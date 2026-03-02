"use client";

import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
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
  const { metrics, funnel, source, conversion, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Visão geral do desempenho da clínica</p>
        </div>

        <div className="flex items-center gap-2">
          {(Object.keys(filterLabels) as DateFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                activeFilter === filter
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
              )}
            >
              {filter === "custom" ? (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {filterLabels[filter]}
                </span>
              ) : (
                filterLabels[filter]
              )}
            </button>
          ))}
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
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="space-y-6">
        <MetricsCards totalLeads={metrics.totalLeads} totalSales={metrics.totalSales} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={funnel} />
          <SourcePieChart data={source} />
        </div>

        <SpendLeadsChart data={metaDailyMetrics} />

        <ConversionBarChart data={conversion} />
      </div>
    </div>
  );
}
