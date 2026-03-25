"use client";

import { useState } from "react";
import { Calendar, Loader2, RefreshCw, Download } from "lucide-react";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { SourcePieChart } from "@/components/dashboard/source-pie-chart";
import { FunnelFlowChart } from "@/components/dashboard/funnel-flow-chart";
import { RevenueLineChart } from "@/components/dashboard/revenue-line-chart";
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

function exportDashboardCSV(
  metrics: { totalLeads: number; totalSales: number },
  funnel: Array<{ stage: string; value: number }>,
  source: Array<{ name: string; value: number }>
) {
  const lines = [
    "MÉTRICAS GERAIS",
    `Total de Leads;${metrics.totalLeads}`,
    `Vendas Fechadas;${metrics.totalSales}`,
    "",
    "FUNIL DE CONVERSÃO",
    ...funnel.map((f) => `${f.stage};${f.value}`),
    "",
    "ORIGEM DOS LEADS",
    ...source.map((s) => `${s.name};${s.value}`),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<DateFilter>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { metrics, funnel, source, sourceAgendamentos, sourceVendas, conversion, currPeriod, prevPeriod, loading, refresh } =
    useDashboardData(activeFilter);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Visão geral do desempenho da clínica</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            {(Object.keys(filterLabels) as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeFilter === filter
                    ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
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
            onClick={() => exportDashboardCSV(metrics, funnel, source)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={refresh}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeFilter === "custom" && (
        <div className="mb-6 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="space-y-6">
        <MetricsCards
          totalLeads={metrics.totalLeads}
          agendados={agendados}
          compareceram={compareceram}
          totalSales={metrics.totalSales}
          currPeriod={currPeriod}
          prevPeriod={prevPeriod}
          activeFilter={activeFilter}
          customStart={startDate || undefined}
          customEnd={endDate || undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={funnel} />
          <SourcePieChart data={source} dataAgendamentos={sourceAgendamentos} dataVendas={sourceVendas} />
        </div>

        <RevenueLineChart
          activeFilter={activeFilter}
          customStart={startDate || undefined}
          customEnd={endDate || undefined}
        />

        <FunnelFlowChart data={funnel} />
      </div>
    </div>
  );
}
