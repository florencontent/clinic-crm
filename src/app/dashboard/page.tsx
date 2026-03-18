"use client";

import { useState } from "react";
import { Calendar, Loader2, RefreshCw } from "lucide-react";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { SourcePieChart } from "@/components/dashboard/source-pie-chart";
import { SpendLeadsChart } from "@/components/meta-ads/spend-leads-chart";
import { ConversionBarChart } from "@/components/dashboard/conversion-bar-chart";
import { metaDailyMetrics } from "@/data/mock-data";
import { useDashboardData } from "@/hooks/use-supabase-data";
import { cn } from "@/lib/utils";

type DateFilter = "hoje" | "7d" | "15d" | "30d" | "custom";

const filterLabels: Record<DateFilter, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "15d": "15 dias",
  "30d": "30 dias",
  custom: "Personalizado",
};

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<DateFilter>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { metrics, funnel, source, conversion, loading, refresh } = useDashboardData();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const agendados = funnel[1]?.value ?? 0;
  const compareceram = funnel[2]?.value ?? 0;

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Visão geral do desempenho da clínica</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {(Object.keys(filterLabels) as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeFilter === filter
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                {filter === "custom" ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {filterLabels[filter]}
                  </span>
                ) : (
                  filterLabels[filter]
                )}
              </button>
            ))}
          </div>

          <button
            onClick={refresh}
            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeFilter === "custom" && (
        <div className="mb-6 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-fit">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Row 1 — 4 metric cards */}
        <MetricsCards
          totalLeads={metrics.totalLeads}
          agendados={agendados}
          compareceram={compareceram}
          totalSales={metrics.totalSales}
        />

        {/* Row 2 — Funnel + Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={funnel} />
          <SourcePieChart data={source} />
        </div>

        {/* Row 3 — Conversion rates */}
        <ConversionBarChart data={conversion} />

        {/* Row 4 — Meta Ads spend vs leads */}
        <SpendLeadsChart data={metaDailyMetrics} />
      </div>
    </div>
  );
}
