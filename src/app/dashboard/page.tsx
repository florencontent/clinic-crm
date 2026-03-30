"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarDays, Loader2, RefreshCw, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { SourcePieChart } from "@/components/dashboard/source-pie-chart";
import { FunnelFlowChart } from "@/components/dashboard/funnel-flow-chart";
import { RevenueLineChart } from "@/components/dashboard/revenue-line-chart";
import { useDashboardData } from "@/hooks/use-supabase-data";

export type DashboardPeriod = "last_7d" | "last_14d" | "last_30d" | "maximum" | "custom";

const periodLabels: Record<DashboardPeriod, string> = {
  last_7d: "7 dias",
  last_14d: "14 dias",
  last_30d: "30 dias",
  maximum: "Máximo",
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
  const [period, setPeriod] = useState<DashboardPeriod>("last_14d");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const { metrics, funnel, source, sourceAgendamentos, sourceVendas, currPeriod, prevPeriod, loading, refresh } =
    useDashboardData(period, since, until);

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

  function handlePeriodClick(p: DashboardPeriod) {
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
    setLastRefreshed(new Date());
  }

  function handleRefresh() {
    refresh();
    setLastRefreshed(new Date());
  }

  function customLabel() {
    if (period === "custom" && since && until) {
      return `${format(new Date(since + "T00:00:00"), "dd/MM/yy")} – ${format(new Date(until + "T00:00:00"), "dd/MM/yy")}`;
    }
    return "Personalizado";
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const agendados = funnel.find((f) => f.stage === "Agendados")?.value ?? 0;
  const compareceram = funnel.find((f) => f.stage === "Compareceram")?.value ?? 0;

  const lastUpdatedText = formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: ptBR });

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">Visão geral do desempenho da clínica</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-400">Atualizado {lastUpdatedText}</span>

          {/* Period selector */}
          <div className="relative" ref={datePickerRef}>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(["last_7d", "last_14d", "last_30d", "maximum"] as DashboardPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodClick(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    period === p
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
              <button
                onClick={() => handlePeriodClick("custom")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  period === "custom"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                      onChange={(e) => setSince(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data final</label>
                    <input
                      type="date"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <button
                    onClick={handleCustomApply}
                    disabled={!since || !until}
                    className="w-full py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={() => exportDashboardCSV(metrics, funnel, source)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <MetricsCards
          totalLeads={metrics.totalLeads}
          followUp={metrics.followUp}
          perdidos={metrics.perdidos}
          agendados={agendados}
          compareceram={compareceram}
          totalSales={metrics.totalSales}
          totalRevenue={metrics.totalRevenue}
          currPeriod={currPeriod}
          prevPeriod={prevPeriod}
          period={period}
          customStart={since || undefined}
          customEnd={until || undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={funnel} />
          <SourcePieChart data={source} dataAgendamentos={sourceAgendamentos} dataVendas={sourceVendas} />
        </div>

        <RevenueLineChart
          activeFilter={period}
          customStart={since || undefined}
          customEnd={until || undefined}
        />

        <FunnelFlowChart data={funnel} />
      </div>
    </div>
  );
}
