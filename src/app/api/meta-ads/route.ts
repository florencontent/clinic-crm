import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const ACCESS_TOKEN = process.env.META_ADS_ACCESS_TOKEN!;
const ACCOUNT_ID = process.env.META_ADS_ACCOUNT_ID!;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

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

async function fetchWithRetry(url: string, retries = 5): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return res;

    const body = await res.json().catch(() => ({}));
    const errorMsg = body?.error?.message || "";

    const isRateLimit = errorMsg.includes("request limit") || errorMsg.includes("reduce the amount");
    if (isRateLimit && i < retries - 1) {
      await sleep(15000 * (i + 1)); // 15s, 30s, 45s, 60s
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
    if (url) await sleep(1000);
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
  const delayMs = datePreset === "last_30d" ? 5000 : 2000;

  // Fetch sequentially to avoid rate limits
  const campaignsData = await fetchAllPages(`${ACCOUNT_ID}/campaigns?fields=name,status`);
  await sleep(delayMs);

  const campaignInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,ctr,cpc,actions,campaign_id&date_preset=${datePreset}&level=campaign`
  );
  await sleep(delayMs);

  const adsetsData = await fetchAllPages(`${ACCOUNT_ID}/adsets?fields=name,campaign_id`);
  await sleep(delayMs);

  const adsetInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,adset_id&date_preset=${datePreset}&level=adset`
  );
  await sleep(delayMs);

  const adsData = await fetchAllPages(`${ACCOUNT_ID}/ads?fields=name,adset_id,creative{name}`);
  await sleep(delayMs);

  const adInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,ad_id&date_preset=${datePreset}&level=ad`
  );
  await sleep(delayMs);

  const dailyData = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions&date_preset=${datePreset}&time_increment=1`
  );

  // Map insights by id
  const campaignInsightsMap = new Map<string, Record<string, unknown>>();
  for (const ins of campaignInsights) {
    campaignInsightsMap.set(ins.campaign_id as string, ins);
  }

  const adsetInsightsMap = new Map<string, Record<string, unknown>>();
  for (const ins of adsetInsights) {
    adsetInsightsMap.set(ins.adset_id as string, ins);
  }

  const adInsightsMap = new Map<string, Record<string, unknown>>();
  for (const ins of adInsights) {
    adInsightsMap.set(ins.ad_id as string, ins);
  }

  // Build campaigns
  const campaigns = campaignsData.map((c) => {
    const ins = campaignInsightsMap.get(c.id as string);
    const spend = parseFloat((ins?.spend as string) || "0");
    const impressions = parseInt((ins?.impressions as string) || "0", 10);
    const clicks = parseInt((ins?.clicks as string) || "0", 10);
    const leads = extractLeads(ins?.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: c.id as string,
      name: c.name as string,
      status: c.status as string,
      spend,
      impressions,
      clicks,
      leads,
      cpl: leads > 0 ? spend / leads : 0,
      ctr: parseFloat((ins?.ctr as string) || "0"),
      cpc: parseFloat((ins?.cpc as string) || "0"),
    };
  });

  // Build adsets
  const adsets = adsetsData.map((s) => {
    const ins = adsetInsightsMap.get(s.id as string);
    const spend = parseFloat((ins?.spend as string) || "0");
    const impressions = parseInt((ins?.impressions as string) || "0", 10);
    const clicks = parseInt((ins?.clicks as string) || "0", 10);
    const leads = extractLeads(ins?.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: s.id as string,
      name: s.name as string,
      campaignId: s.campaign_id as string,
      audience: s.name as string,
      spend,
      leads,
      impressions,
      clicks,
    };
  });

  // Build ads
  const ads = adsData.map((a) => {
    const ins = adInsightsMap.get(a.id as string);
    const spend = parseFloat((ins?.spend as string) || "0");
    const impressions = parseInt((ins?.impressions as string) || "0", 10);
    const clicks = parseInt((ins?.clicks as string) || "0", 10);
    const leads = extractLeads(ins?.actions as Array<{ action_type: string; value: string }> | undefined);
    return {
      id: a.id as string,
      name: a.name as string,
      adsetId: a.adset_id as string,
      creative: ((a.creative as Record<string, unknown>)?.name as string) || (a.name as string),
      spend,
      leads,
      impressions,
      clicks,
      cpl: leads > 0 ? spend / leads : 0,
    };
  });

  // Build daily metrics
  const daily = dailyData.map((d) => {
    const dateObj = new Date(d.date_start as string);
    return {
      date: `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}`,
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
    const fallbackFiles = [
      getCacheFile(datePreset),
      path.join(CACHE_DIR, "meta-ads.json"), // legacy filename
    ];
    for (const file of fallbackFiles) {
      try {
        const raw = await readFile(file, "utf-8");
        const stale = JSON.parse(raw);
        return NextResponse.json(stale.data);
      } catch {
        // try next file
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Meta Ads data" },
      { status: 500 }
    );
  }
}
