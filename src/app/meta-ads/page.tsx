"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, CalendarDays } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OverviewCards } from "@/components/meta-ads/overview-cards";
import { CampaignsTab } from "@/components/meta-ads/campaigns-tab";
import { AudiencesTab } from "@/components/meta-ads/audiences-tab";
import { AdsTab } from "@/components/meta-ads/ads-tab";
import { MetaAdsSkeleton } from "@/components/meta-ads/meta-ads-skeleton";
import type { MetaCampaign, MetaAdSet, MetaAd, MetaDailyMetric } from "@/data/mock-data";

type Period = "last_7d" | "last_14d" | "last_30d" | "maximum" | "custom";
type Tab = "campanhas" | "publicos" | "anuncios";

const periodLabels: Record<Period, string> = {
  last_7d: "7 dias",
  last_14d: "14 dias",
  last_30d: "30 dias",
  maximum: "Máximo",
  custom: "Personalizado",
};

const tabLabels: Record<Tab, string> = {
  campanhas: "Campanhas",
  publicos: "Públicos",
  anuncios: "Anúncios",
};

interface MetaAdsData {
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  daily: MetaDailyMetric[];
  metrics: {
    totalSpend: number;
    totalLeads: number;
    totalClicks: number;
    cpl: number;
    cpc: number;
    ctr: number;
    reach: number;
    cpm?: number;
  };
  leadOrigins?: { whatsapp: number; site: number };
  demographics?: {
    byAge: Array<{ age: string; leads: number }>;
    byGender: Array<{ gender: string; leads: number }>;
  };
  datePreset?: string;
  lastUpdated?: number;
  stale?: boolean;
}

function buildUrl(period: Period, since: string, until: string) {
  if (period === "custom" && since && until) {
    return `/api/meta-ads?date_preset=last_14d&since=${since}&until=${until}`;
  }
  return `/api/meta-ads?date_preset=${period}`;
}

export default function MetaAdsPage() {
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("last_14d");
  const [activeTab, setActiveTab] = useState<Tab>("campanhas");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const isFirstLoad = useRef(true);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (p: Period, s: string, u: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!data) setLoading(true);
    setError(null);

    try {
      const url = buildUrl(p, s, u);
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Falha ao carregar dados");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData(period, since, until);
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (period === "custom") return; // custom only fetches on confirm
    fetchData(period, since, until);
  }, [period]);

  // Close date picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handlePeriodClick(p: Period) {
    if (p === "custom") {
      setShowDatePicker(true);
      setPeriod("custom");
    } else {
      setShowDatePicker(false);
      setPeriod(p);
    }
  }

  function handleCustomApply() {
    if (!since || !until) return;
    setShowDatePicker(false);
    fetchData("custom", since, until);
  }

  function customLabel() {
    if (period === "custom" && since && until) {
      return `${format(new Date(since + "T00:00:00"), "dd/MM/yy")} – ${format(new Date(until + "T00:00:00"), "dd/MM/yy")}`;
    }
    return "Personalizado";
  }

  if (loading) return <MetaAdsSkeleton />;

  if (error && !data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100 text-center max-w-md">
          <p className="text-red-600 font-medium mb-2">Erro ao carregar dados</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData(period, since, until)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeCampaigns = data.campaigns.filter(c => c.status === "ACTIVE").length;

  const lastUpdatedText = data.lastUpdated
    ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <div className="min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campanhas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance da conta de anúncios
            {data.stale && (
              <span className="ml-2 text-xs text-amber-500 dark:text-amber-400 font-medium">· dados do cache (API indisponível)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdatedText && (
            <span className="text-xs text-gray-400">Atualizado {lastUpdatedText}</span>
          )}

          {/* Period selector */}
          <div className="relative" ref={datePickerRef}>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(["last_7d", "last_14d", "last_30d", "maximum"] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => handlePeriodClick(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    period === p ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
              <button
                onClick={() => handlePeriodClick("custom")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === "custom" ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {customLabel()}
              </button>
            </div>

            {/* Date picker dropdown */}
            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 min-w-[280px]">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Período personalizado</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data inicial</label>
                    <input
                      type="date"
                      value={since}
                      onChange={e => setSince(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data final</label>
                    <input
                      type="date"
                      value={until}
                      onChange={e => setUntil(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCustomApply}
                      disabled={!since || !until}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fetchData(period, since, until, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <OverviewCards
        metrics={data.metrics}
        activeCampaigns={activeCampaigns}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-1">
          {(["campanhas", "publicos", "anuncios"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tabLabels[tab]}
              {tab === "anuncios" && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                  {new Set(data.ads.map(a => a.name)).size}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "campanhas" && (
          <CampaignsTab campaigns={data.campaigns} adsets={data.adsets} daily={data.daily} leadOrigins={data.leadOrigins} datePreset={data.datePreset} since={since} until={until} period={period} />
        )}
        {activeTab === "publicos" && (
          <AudiencesTab adsets={data.adsets} demographics={data.demographics} />
        )}
        {activeTab === "anuncios" && (
          <AdsTab ads={data.ads} adsets={data.adsets} campaigns={data.campaigns} />
        )}
      </div>
    </div>
  );
}
