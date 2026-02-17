"use client";

import { DollarSign, Users, Target, MousePointerClick, Eye, BarChart3 } from "lucide-react";

interface Metrics {
  totalSpend: number;
  totalLeads: number;
  cpl: number;
  cpc: number;
  ctr: number;
  reach: number;
}

interface AdsMetricsCardsProps {
  metrics: Metrics;
  periodLabel?: string;
}

function formatValue(value: number, format: string) {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return value.toLocaleString("pt-BR");
}

export function AdsMetricsCards({ metrics, periodLabel }: AdsMetricsCardsProps) {
  const avgCpl = metrics.totalLeads > 0 ? metrics.totalSpend / metrics.totalLeads : 0;

  const cards = [
    { title: "Investimento", value: metrics.totalSpend, format: "currency", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", highlight: "" },
    { title: "Leads", value: metrics.totalLeads, format: "number", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", highlight: "" },
    {
      title: "CPL",
      value: metrics.cpl,
      format: "currency",
      icon: Target,
      color: "text-amber-600",
      bg: "bg-amber-50",
      highlight: avgCpl > 0 && metrics.cpl < avgCpl
        ? "ring-1 ring-green-200 bg-green-50/30"
        : avgCpl > 0 && metrics.cpl > avgCpl * 1.5
          ? "ring-1 ring-red-200 bg-red-50/30"
          : "",
    },
    { title: "CPC", value: metrics.cpc, format: "currency", icon: MousePointerClick, color: "text-purple-600", bg: "bg-purple-50", highlight: "" },
    { title: "CTR", value: metrics.ctr, format: "percent", icon: BarChart3, color: "text-green-600", bg: "bg-green-50", highlight: "" },
    { title: "Alcance", value: metrics.reach, format: "number", icon: Eye, color: "text-rose-600", bg: "bg-rose-50", highlight: "" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${card.highlight}`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatValue(card.value, card.format)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {periodLabel || "Últimos 14 dias"}
          </p>
        </div>
      ))}
    </div>
  );
}
