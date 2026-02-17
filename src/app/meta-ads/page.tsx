"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { AdsMetricsCards } from "@/components/meta-ads/ads-metrics-cards";
import { SpendLeadsChart } from "@/components/meta-ads/spend-leads-chart";
import { LeadsByOriginChart } from "@/components/meta-ads/leads-by-origin-chart";
import { CampaignsTable } from "@/components/meta-ads/campaigns-table";
import { AdsetsBarChart } from "@/components/meta-ads/adsets-bar-chart";
import { AdsPerformance } from "@/components/meta-ads/ads-performance";
import { MetaAdsHeader } from "@/components/meta-ads/meta-ads-header";
import { MetaAdsFilters } from "@/components/meta-ads/meta-ads-filters";
import { MetaAdsSkeleton } from "@/components/meta-ads/meta-ads-skeleton";
import { useMetaAdsFilters, type Period } from "@/hooks/use-meta-ads-filters";
import type {
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaDailyMetric,
} from "@/data/mock-data";

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
  lastUpdated?: number;
  datePreset?: string;
}

const periodLabels: Record<Period, string> = {
  last_7d: "Últimos 7 dias",
  last_14d: "Últimos 14 dias",
  last_30d: "Últimos 30 dias",
};

export default function MetaAdsPage() {
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const filters = useMetaAdsFilters(data);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async (preset: Period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!data) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`/api/meta-ads?date_preset=${preset}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Falha ao carregar dados");
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
      setLastUpdated(json.lastUpdated || Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      // If we already have data, show error as toast-like but keep existing data
      if (data) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  // Fetch on mount
  useEffect(() => {
    fetchData(filters.period);
  }, []);

  // Refetch whenever period changes (skip the first render)
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchData(filters.period, true);
  }, [filters.period, fetchData]);

  const handleRefresh = () => fetchData(filters.period, true);

  if (loading) {
    return <MetaAdsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100 text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => fetchData(filters.period)}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const hasResults = filters.filteredCampaigns.length > 0;

  return (
    <div className="min-h-screen p-8 space-y-6">
      <MetaAdsHeader
        lastUpdated={lastUpdated}
        loading={refreshing}
        onRefresh={handleRefresh}
      />

      <MetaAdsFilters
        period={filters.period}
        onPeriodChange={filters.setPeriod}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        searchQuery={filters.searchQuery}
        onSearchChange={filters.setSearchQuery}
        hideZeroSpend={filters.hideZeroSpend}
        onHideZeroSpendChange={filters.setHideZeroSpend}
      />

      <div className={`transition-opacity duration-300 space-y-6 ${refreshing ? "opacity-50" : ""}`}>
        {/* Top metrics: ALL campaigns with spend, regardless of filters */}
        <AdsMetricsCards
          metrics={filters.totalMetrics}
          periodLabel={periodLabels[filters.period]}
        />

        {hasResults ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendLeadsChart data={filters.filteredDaily} />
              <LeadsByOriginChart campaigns={data.campaigns} />
            </div>

            <CampaignsTable
              campaigns={filters.filteredCampaigns}
              adsets={filters.filteredAdsets}
            />

            <AdsetsBarChart adsets={filters.filteredAdsets} campaigns={filters.filteredCampaigns} />

            <AdsPerformance ads={filters.filteredAds} adsets={filters.filteredAdsets} campaigns={filters.filteredCampaigns} />
          </>
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">Nenhuma campanha encontrada</p>
            <p className="text-sm text-gray-400 mb-4">
              Tente ajustar os filtros ou limpar a busca
            </p>
            <button
              onClick={filters.clearSearch}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
