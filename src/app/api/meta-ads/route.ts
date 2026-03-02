import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN!;
const ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID!;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (was 6 hours — too stale)

const VALID_PRESETS = ["last_7d", "last_14d", "last_30d"] as const;
type DatePreset = (typeof VALID_PRESETS)[number];

function getCacheFile(preset: DatePreset) {
  return path.join(CACHE_DIR, `meta-ads-${preset}.json`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readCache(preset: DatePreset) {
  try {
    const raw = await readFile(getCacheFile(preset), "utf-8");
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  } catch {
    // no cache or invalid
  }
  return null;
}

async function writeCache(preset: DatePreset, data: unknown) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(getCacheFile(preset), JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore cache write errors
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
      await sleep(30000 * (i + 1)); // 30s, 60s
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

async function fetchMetaAdsData(datePreset: DatePreset) {
  // 1. Campaign insights (includes campaign-level metrics for the period)
  const campaignInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,ctr,cpc,actions,campaign_id,campaign_name&date_preset=${datePreset}&level=campaign`
  );
  await sleep(3000);

  // 2. Adset insights
  const adsetInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,adset_id,adset_name,campaign_id&date_preset=${datePreset}&level=adset`
  );
  await sleep(3000);

  // 3. Ad insights
  const adInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,ad_id,ad_name,adset_id&date_preset=${datePreset}&level=ad`
  );
  await sleep(3000);

  // 4. Daily breakdown
  const dailyData = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions&date_preset=${datePreset}&time_increment=1`
  );

  // Build campaigns from insights (only campaigns with data in the period)
  const campaigns = campaignInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: ins.campaign_id as string,
      name: (ins.campaign_name as string) || "Sem nome",
      status: "ACTIVE" as string,
      spend,
      impressions,
      clicks,
      leads,
      cpl: leads > 0 ? spend / leads : 0,
      ctr: parseFloat((ins.ctr as string) || "0"),
      cpc: parseFloat((ins.cpc as string) || "0"),
    };
  });

  // Build adsets from insights
  const adsets = adsetInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: ins.adset_id as string,
      name: (ins.adset_name as string) || "Sem nome",
      campaignId: ins.campaign_id as string,
      audience: (ins.adset_name as string) || "Sem nome",
      spend,
      leads,
      impressions,
      clicks,
    };
  });

  // Build ads from insights
  const ads = adInsights.map((ins) => {
    const spend = parseFloat((ins.spend as string) || "0");
    const impressions = parseInt((ins.impressions as string) || "0", 10);
    const clicks = parseInt((ins.clicks as string) || "0", 10);
    const leads = extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: ins.ad_id as string,
      name: (ins.ad_name as string) || "Sem nome",
      adsetId: ins.adset_id as string,
      creative: (ins.ad_name as string) || "Sem nome",
      spend,
      leads,
      impressions,
      clicks,
      cpl: leads > 0 ? spend / leads : 0,
    };
  });

  // Build daily metrics
  const daily = dailyData.map((d) => {
    const dateStr = d.date_start as string; // "YYYY-MM-DD"
    const [year, month, day] = dateStr.split("-");
    return {
      date: `${day}/${month}`,
      spend: parseFloat((d.spend as string) || "0"),
      leads: extractLeads(d.actions as Array<{ action_type: string; value: string }> | undefined),
      impressions: parseInt((d.impressions as string) || "0", 10),
      clicks: parseInt((d.clicks as string) || "0", 10),
    };
  });

  // Aggregated metrics
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);

  const metrics = {
    totalSpend,
    totalLeads,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    reach: totalImpressions,
  };

  return {
    campaigns,
    adsets,
    ads,
    daily,
    metrics,
    lastUpdated: Date.now(),
    datePreset,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPreset = searchParams.get("date_preset") || "last_14d";
  const datePreset: DatePreset = VALID_PRESETS.includes(rawPreset as DatePreset)
    ? (rawPreset as DatePreset)
    : "last_14d";

  try {
    // Try cache first
    const cached = await readCache(datePreset);
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = await fetchMetaAdsData(datePreset);
    await writeCache(datePreset, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Meta Ads API error:", error);

    // If fetch fails, try returning stale cache (ignore TTL)
    try {
      const raw = await readFile(getCacheFile(datePreset), "utf-8");
      const stale = JSON.parse(raw);
      return NextResponse.json({ ...stale.data, stale: true });
    } catch {
      // no cache available
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Meta Ads data" },
      { status: 500 }
    );
  }
}
