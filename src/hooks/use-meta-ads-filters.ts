"use client";

import { useState, useMemo, useCallback } from "react";
import type { MetaCampaign, MetaAdSet, MetaAd, MetaDailyMetric } from "@/data/mock-data";

export type Period = "last_7d" | "last_14d" | "last_30d";
export type StatusFilter = "all" | "active" | "paused";

interface MetaAdsData {
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  daily: MetaDailyMetric[];
  metrics: {
    totalSpend: number;
    totalLeads: number;
    cpl: number;
    cpc: number;
    ctr: number;
    reach: number;
  };
}

interface FilteredMetrics {
  totalSpend: number;
  totalLeads: number;
  cpl: number;
  cpc: number;
  ctr: number;
  reach: number;
}

export function useMetaAdsFilters(data: MetaAdsData | null) {
  const [period, setPeriod] = useState<Period>("last_14d");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideZeroSpend, setHideZeroSpend] = useState(true);

  // Total metrics: ALL campaigns with spend > 0, regardless of status/search filters
  const totalMetrics = useMemo<FilteredMetrics>(() => {
    if (!data) return { totalSpend: 0, totalLeads: 0, cpl: 0, cpc: 0, ctr: 0, reach: 0 };

    const withSpend = data.campaigns.filter((c) => c.spend > 0);
    if (!withSpend.length) return { totalSpend: 0, totalLeads: 0, cpl: 0, cpc: 0, ctr: 0, reach: 0 };

    const totalSpend = withSpend.reduce((s, c) => s + c.spend, 0);
    const totalLeads = withSpend.reduce((s, c) => s + c.leads, 0);
    const totalClicks = withSpend.reduce((s, c) => s + c.clicks, 0);
    const totalImpressions = withSpend.reduce((s, c) => s + c.impressions, 0);

    return {
      totalSpend,
      totalLeads,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      reach: totalImpressions,
    };
  }, [data]);

  const filteredCampaigns = useMemo(() => {
    if (!data) return [];
    let campaigns = [...data.campaigns];

    // Filter by status
    if (statusFilter === "active") {
      campaigns = campaigns.filter((c) => c.status === "ACTIVE");
    } else if (statusFilter === "paused") {
      campaigns = campaigns.filter((c) => c.status === "PAUSED");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      campaigns = campaigns.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Filter zero spend
    if (hideZeroSpend) {
      campaigns = campaigns.filter((c) => c.spend > 0);
    }

    // Sort by spend descending
    return campaigns.sort((a, b) => b.spend - a.spend);
  }, [data, statusFilter, searchQuery, hideZeroSpend]);

  const filteredCampaignIds = useMemo(
    () => new Set(filteredCampaigns.map((c) => c.id)),
    [filteredCampaigns]
  );

  const filteredAdsets = useMemo(() => {
    if (!data) return [];
    let adsets = data.adsets.filter((s) => filteredCampaignIds.has(s.campaignId));

    if (hideZeroSpend) {
      adsets = adsets.filter((s) => s.spend > 0);
    }

    return adsets.sort((a, b) => b.spend - a.spend);
  }, [data, filteredCampaignIds, hideZeroSpend]);

  const filteredAdsetIds = useMemo(
    () => new Set(filteredAdsets.map((s) => s.id)),
    [filteredAdsets]
  );

  const filteredAds = useMemo(() => {
    if (!data) return [];
    let ads = data.ads.filter((a) => filteredAdsetIds.has(a.adsetId));

    if (hideZeroSpend) {
      ads = ads.filter((a) => a.spend > 0);
    }

    return ads.sort((a, b) => b.leads - a.leads);
  }, [data, filteredAdsetIds, hideZeroSpend]);

  // Daily data comes already correct from the API for the selected period
  const filteredDaily = useMemo(() => {
    if (!data) return [];
    return data.daily;
  }, [data]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  return {
    // State
    period,
    setPeriod,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    hideZeroSpend,
    setHideZeroSpend,
    // Derived
    filteredCampaigns,
    filteredAdsets,
    filteredAds,
    filteredDaily,
    totalMetrics,
    clearSearch,
  };
}
