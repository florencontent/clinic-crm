import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN!;
const ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID!;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_TTL = 30 * 60 * 1000;

const VALID_PRESETS = ["last_7d", "last_14d", "last_30d", "maximum"] as const;
type DatePreset = (typeof VALID_PRESETS)[number];

function getCacheFile(preset: DatePreset | string) {
  return path.join(CACHE_DIR, `meta-ads-${preset}.json`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCache(key: string) {
  try {
    const raw = await readFile(getCacheFile(key), "utf-8");
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  } catch {
    // no cache
  }
  return null;
}

async function writeCache(key: string, data: unknown) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(getCacheFile(key), JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore
  }
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return res;
    const body = await res.json().catch(() => ({}));
    const errorMsg = body?.error?.message || "";
    const isRateLimit =
      errorMsg.includes("request limit") ||
      errorMsg.includes("reduce the amount") ||
      errorMsg.includes("too many calls");
    if (isRateLimit && i < retries - 1) {
      await sleep(30000 * (i + 1));
      continue;
    }
    throw new Error(errorMsg || `Meta API error (${res.status})`);
  }
  throw new Error("Max retries reached");
}

async function fetchAllPages(endpoint: string) {
  const allData: Record<string, unknown>[] = [];
  let url: string | null = `${BASE_URL}/${endpoint}${endpoint.includes("?") ? "&" : "?"}access_token=${ACCESS_TOKEN}&limit=500`;
  while (url) {
    const res = await fetchWithRetry(url);
    const json = await res.json();
    allData.push(...(json.data || []));
    url = json.paging?.next || null;
    if (url) await sleep(2000);
  }
  return allData;
}

function extractLeads(actions?: Array<{ action_type: string; value: string }>) {
  if (!actions) return 0;
  const leadTypes = [
    "lead",
    "onsite_web_lead",
    "offsite_conversion.fb_pixel_lead",
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.total_messaging_connection",
  ];
  for (const type of leadTypes) {
    const found = actions.find((a) => a.action_type === type);
    if (found) return parseInt(found.value, 10);
  }
  return 0;
}

function buildDateParam(datePreset: DatePreset, since?: string, until?: string) {
  if (since && until) return `time_range={"since":"${since}","until":"${until}"}`;
  return `date_preset=${datePreset}`;
}

async function fetchMetaAdsData(datePreset: DatePreset, since?: string, until?: string) {
  const dateParam = buildDateParam(datePreset, since, until);

  // 1. Campaign insights
  const campaignInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,reach,ctr,cpc,actions,campaign_id,campaign_name&${dateParam}&level=campaign`
  );
  await sleep(3000);

  // 2. Adset insights (with reach for frequency calc)
  const adsetInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,reach,ctr,cpc,actions,adset_id,adset_name,campaign_id,campaign_name&${dateParam}&level=adset`
  );
  await sleep(3000);

  // 3. Ad insights
  const adInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,ad_id,ad_name,adset_id,campaign_id&${dateParam}&level=ad`
  );
  await sleep(3000);

  // 4. Ad creatives (for thumbnails)
  let creativeMap: Record<string, { thumbnailUrl?: string; objectType?: string }> = {};
  try {
    const adsWithCreative = await fetchAllPages(
      `${ACCOUNT_ID}/ads?fields=id,name,creative{thumbnail_url,image_url,object_type}`
    );
    for (const ad of adsWithCreative) {
      const creative = ad.creative as Record<string, string> | undefined;
      if (creative) {
        creativeMap[ad.id as string] = {
          thumbnailUrl: creative.thumbnail_url || creative.image_url,
          objectType: creative.object_type,
        };
      }
    }
  } catch {
    // creative fetch is optional — don't fail the whole request
  }
  await sleep(2000);

  // 5. Daily breakdown
  const dailyData = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions&${dateParam}&time_increment=1`
  );

  // Build campaigns
  const campaigns = campaignInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const reach = parseInt((ins.reach as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: ins.campaign_id as string,
      name: (ins.campaign_name as string) || "Sem nome",
      status: "ACTIVE" as string,
      spend,
      impressions,
      clicks,
      reach,
      leads,
      cpl: leads > 0 ? spend / leads : 0,
      ctr: parseFloat((ins.ctr as string) || "0"),
      cpc: parseFloat((ins.cpc as string) || "0"),
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    };
  });

  // Build adsets
  const adsets = adsetInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const reach = parseInt((ins.reach as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: ins.adset_id as string,
      name: (ins.adset_name as string) || "Sem nome",
      campaignId: ins.campaign_id as string,
      campaignName: (ins.campaign_name as string) || "Sem nome",
      audience: (ins.adset_name as string) || "Sem nome",
      spend,
      leads,
      impressions,
      clicks,
      reach,
      frequency: reach > 0 ? impressions / reach : 0,
      ctr: parseFloat((ins.ctr as string) || "0"),
      cpc: parseFloat((ins.cpc as string) || "0"),
      cpl: leads > 0 ? spend / leads : 0,
    };
  });

  // Build ads (with thumbnails)
  const ads = adInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    const adId = ins.ad_id as string;
    const creative = creativeMap[adId] || {};
    return {
      id: adId,
      name: (ins.ad_name as string) || "Sem nome",
      adsetId: ins.adset_id as string,
      campaignId: ins.campaign_id as string,
      creative: (ins.ad_name as string) || "Sem nome",
      thumbnailUrl: creative.thumbnailUrl,
      objectType: creative.objectType,
      spend,
      leads,
      impressions,
      clicks,
      cpl: leads > 0 ? spend / leads : 0,
    };
  });

  // Daily
  const daily = dailyData.map((d) => {
    const dateStr = d.date_start as string;
    const [, month, day] = dateStr.split("-");
    return {
      date: `${day}/${month}`,
      spend: parseFloat((d.spend as string) || "0"),
      leads: extractLeads(d.actions as Array<{ action_type: string; value: string }> | undefined),
      impressions: parseInt((d.impressions as string) || "0", 10),
      clicks: parseInt((d.clicks as string) || "0", 10),
    };
  });

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);

  const metrics = {
    totalSpend,
    totalLeads,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    reach: totalReach,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
  };

  return { campaigns, adsets, ads, daily, metrics, lastUpdated: Date.now(), datePreset };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPreset = searchParams.get("date_preset") || "last_14d";
  const since = searchParams.get("since") || undefined;
  const until = searchParams.get("until") || undefined;

  // Custom date range
  const isCustom = !!(since && until);
  const cacheKey = isCustom ? `custom-${since}-${until}` : rawPreset;
  const datePreset: DatePreset = VALID_PRESETS.includes(rawPreset as DatePreset)
    ? (rawPreset as DatePreset)
    : "last_14d";

  try {
    const cached = await readCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const data = await fetchMetaAdsData(datePreset, since, until);
    await writeCache(cacheKey, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Meta Ads API error:", error);
    try {
      const raw = await readFile(getCacheFile(cacheKey), "utf-8");
      const stale = JSON.parse(raw);
      return NextResponse.json({ ...stale.data, stale: true });
    } catch {
      // no cache
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Meta Ads data" },
      { status: 500 }
    );
  }
}
