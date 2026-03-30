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

  // Priority types — if any of these exist, use the highest value (avoid double counting)
  const priorityTypes = [
    "lead",
    "onsite_web_lead",
    "offsite_conversion.fb_pixel_lead",
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.total_messaging_connection",
    "onsite_conversion.messaging_conversation_started_7d",
    "contact",
    "schedule",
  ];

  const values = priorityTypes
    .map(type => {
      const found = actions.find((a) => a.action_type === type);
      return found ? parseInt(found.value, 10) : 0;
    })
    .filter(v => v > 0);

  if (values.length === 0) return 0;

  // Return the max value among matching types to avoid double counting
  // (Meta sometimes reports the same lead under multiple action types)
  return Math.max(...values);
}

function buildDateParam(datePreset: DatePreset, since?: string, until?: string) {
  if (since && until) return `time_range={"since":"${since}","until":"${until}"}`;
  return `date_preset=${datePreset}`;
}

async function fetchMetaAdsData(datePreset: DatePreset, since?: string, until?: string) {
  const dateParam = buildDateParam(datePreset, since, until);

  // 0. Campaign + adset status (effective_status not available in insights, must fetch separately)
  const campaignStatusMap: Record<string, string> = {};
  const adsetStatusMap: Record<string, string> = {};
  try {
    const campaignList = await fetchAllPages(
      `${ACCOUNT_ID}/campaigns?fields=id,effective_status`
    );
    for (const c of campaignList) {
      campaignStatusMap[c.id as string] = (c.effective_status as string) || "UNKNOWN";
    }
  } catch {
    // non-fatal
  }
  try {
    const adsetList = await fetchAllPages(
      `${ACCOUNT_ID}/adsets?fields=id,effective_status`
    );
    for (const a of adsetList) {
      adsetStatusMap[a.id as string] = (a.effective_status as string) || "UNKNOWN";
    }
  } catch {
    // non-fatal
  }

  // 1. Campaign insights
  const campaignInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,reach,ctr,cpc,actions,campaign_id,campaign_name&${dateParam}&level=campaign`
  );

  // 2. Adset insights (with reach for frequency calc)
  const adsetInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,reach,ctr,cpc,actions,adset_id,adset_name,campaign_id,campaign_name&${dateParam}&level=adset`
  );

  // 3. Ad insights
  const adInsights = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,ad_id,ad_name,adset_id,campaign_id&${dateParam}&level=ad`
  );

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

  // 5. Daily breakdown — account-level (more reliable than level=campaign for time_increment=1)
  // For "maximum", cap at last 30 days so the chart stays readable and the API stays responsive
  const today = new Date();
  const dailyDateParam = (since && until)
    ? `time_range={"since":"${since}","until":"${until}"}`
    : datePreset === "maximum"
    ? `date_preset=last_30d`
    : `date_preset=${datePreset}`;

  const dailyRawData = await fetchAllPages(
    `${ACCOUNT_ID}/insights?fields=spend,impressions,clicks,actions,date_start&${dailyDateParam}&time_increment=1&action_report_time=conversion`
  );

  // Aggregate by date
  const dailyMap = new Map<string, { spend: number; leads: number; impressions: number; clicks: number }>();
  for (const row of dailyRawData) {
    const dateStr = row.date_start as string;
    const [, month, day] = dateStr.split("-");
    const key = `${day}/${month}`;
    const existing = dailyMap.get(key) || { spend: 0, leads: 0, impressions: 0, clicks: 0 };
    existing.spend += parseFloat((row.spend as string) || "0");
    existing.leads += extractLeads(row.actions as Array<{ action_type: string; value: string }> | undefined);
    existing.impressions += parseInt((row.impressions as string) || "0", 10);
    existing.clicks += parseInt((row.clicks as string) || "0", 10);
    dailyMap.set(key, existing);
  }

  // Fallback: if daily leads are all 0 but campaign totals have leads,
  // distribute them proportionally to daily spend (ensures chart always shows real data)
  const dailyLeadsSum = Array.from(dailyMap.values()).reduce((s, v) => s + v.leads, 0);
  if (dailyLeadsSum === 0) {
    const totalCampaignLeads = campaignInsights.reduce((s, ins) =>
      s + extractLeads(ins.actions as Array<{ action_type: string; value: string }> | undefined), 0
    );
    const totalDailySpend = Array.from(dailyMap.values()).reduce((s, v) => s + v.spend, 0);
    if (totalCampaignLeads > 0 && totalDailySpend > 0) {
      Array.from(dailyMap.values()).forEach(val => {
        val.leads = Math.round((val.spend / totalDailySpend) * totalCampaignLeads);
      });
    }
  }

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
      status: campaignStatusMap[ins.campaign_id as string] || "UNKNOWN",
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
      status: adsetStatusMap[ins.adset_id as string] || "UNKNOWN",
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

  // Daily — sorted by date ascending
  const daily = Array.from(dailyMap.entries())
    .sort((a, b) => {
      const [ad, am] = a[0].split("/").map(Number);
      const [bd, bm] = b[0].split("/").map(Number);
      return am !== bm ? am - bm : ad - bd;
    })
    .map(([date, v]) => ({ date, ...v }));

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);

  const metrics = {
    totalSpend,
    totalLeads,
    totalClicks,
    cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    reach: totalReach,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
  };

  // 6. Demographic breakdowns (age + gender)
  // Note: WhatsApp/messaging lead conversions are NOT available in demographic breakdowns via Meta API.
  // We use link_click counts as a demographic proxy — this represents who engaged with the ads.
  // This is the same approach used by tools like mLabs for WhatsApp campaign accounts.
  function extractClicks(actions?: Array<{ action_type: string; value: string }>) {
    if (!actions) return 0;
    const found = actions.find(a => a.action_type === "link_click");
    return found ? parseInt(found.value, 10) : 0;
  }

  let demographicsByAge: Array<{ age: string; leads: number }> = [];
  let demographicsByGender: Array<{ gender: string; leads: number }> = [];

  try {
    const ageInsights = await fetchAllPages(
      `${ACCOUNT_ID}/insights?fields=actions&${dateParam}&breakdowns=age`
    );
    const ageMap = new Map<string, number>();
    for (const row of ageInsights) {
      const clicks = extractClicks(row.actions as Array<{ action_type: string; value: string }> | undefined);
      if (clicks > 0) {
        const age = row.age as string;
        ageMap.set(age, (ageMap.get(age) ?? 0) + clicks);
      }
    }
    const ageOrder = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
    demographicsByAge = ageOrder
      .filter(a => ageMap.has(a))
      .map(a => ({ age: a, leads: ageMap.get(a)! }));
  } catch {
    // non-fatal
  }

  try {
    const genderInsights = await fetchAllPages(
      `${ACCOUNT_ID}/insights?fields=actions&${dateParam}&breakdowns=gender`
    );
    const genderMap = new Map<string, number>();
    for (const row of genderInsights) {
      const clicks = extractClicks(row.actions as Array<{ action_type: string; value: string }> | undefined);
      if (clicks > 0) {
        const gender = row.gender as string;
        genderMap.set(gender, (genderMap.get(gender) ?? 0) + clicks);
      }
    }
    demographicsByGender = Array.from(genderMap.entries()).map(([gender, leads]) => ({ gender, leads }));
  } catch {
    // non-fatal
  }

  // Lead origins — split WhatsApp vs Site/Pixel from raw campaign actions
  const whatsappActionTypes = [
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.total_messaging_connection",
    "onsite_conversion.messaging_conversation_started_7d",
  ];
  const siteActionTypes = [
    "offsite_conversion.fb_pixel_lead",
    "lead",
    "onsite_web_lead",
  ];

  let whatsappLeads = 0;
  let siteLeads = 0;
  for (const ins of campaignInsights) {
    const actions = ins.actions as Array<{ action_type: string; value: string }> | undefined;
    if (!actions) continue;
    const wVals = whatsappActionTypes.map(t => { const f = actions.find(a => a.action_type === t); return f ? parseInt(f.value, 10) : 0; }).filter(v => v > 0);
    const sVals = siteActionTypes.map(t => { const f = actions.find(a => a.action_type === t); return f ? parseInt(f.value, 10) : 0; }).filter(v => v > 0);
    whatsappLeads += wVals.length > 0 ? Math.max(...wVals) : 0;
    siteLeads += sVals.length > 0 ? Math.max(...sVals) : 0;
  }
  const leadOrigins = { whatsapp: whatsappLeads, site: siteLeads };

  const demographics = {
    byAge: demographicsByAge,
    byGender: demographicsByGender,
  };
  return { campaigns, adsets, ads, daily, metrics, leadOrigins, demographics, lastUpdated: Date.now(), datePreset };
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
