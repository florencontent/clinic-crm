"use client";

import { useEffect, useState } from "react";
import {
  Users, CalendarCheck, UserCheck, Trophy,
  TrendingUp, TrendingDown, Minus,
  DollarSign, BarChart2, Zap, Tag, GitBranch, XCircle,
} from "lucide-react";
import { PeriodComparison } from "@/hooks/use-supabase-data";

type DashboardPeriod = "last_7d" | "last_14d" | "last_30d" | "maximum" | "custom";

interface MetricsCardsProps {
  totalLeads: number;
  followUp: number;
  perdidos: number;
  agendados: number;
  compareceram: number;
  totalSales: number;
  totalRevenue: number;
  currPeriod?: PeriodComparison | null;
  prevPeriod?: PeriodComparison | null;
  period?: DashboardPeriod;
  customStart?: string;
  customEnd?: string;
}

function calcChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildMetaUrl(period: DashboardPeriod, customStart?: string, customEnd?: string) {
  if (period === "custom" && customStart && customEnd) {
    return `/api/meta-ads?date_preset=last_14d&since=${customStart}&until=${customEnd}`;
  }
  const preset = period === "maximum" ? "maximum" : period;
  return `/api/meta-ads?date_preset=${preset}`;
}

// Faturamento desativado por enquanto — não puxa dado do Meta

export function MetricsCards({
  totalLeads, followUp, perdidos, agendados, compareceram, totalSales, totalRevenue,
  currPeriod, prevPeriod, period = "last_14d", customStart, customEnd,
}: MetricsCardsProps) {
  const [investimento, setInvestimento] = useState<number | null>(null);

  useEffect(() => {
    const url = buildMetaUrl(period, customStart, customEnd);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data?.metrics?.totalSpend != null) {
          setInvestimento(data.metrics.totalSpend);
        }
      })
      .catch(() => {});
  }, [period, customStart, customEnd]);

  const faturamento = totalRevenue;
  const roas = investimento && investimento > 0 ? faturamento / investimento : null;
  const ticketMedio = totalSales > 0 ? totalRevenue / totalSales : 0;

  // ── Row 1: funil ──
  const funnelCards = [
    {
      key: "leads", title: "Total de Leads", subtitle: "Captados no período",
      icon: Users, value: totalLeads, display: String(totalLeads),
      color: { bg: "bg-blue-50", darkBg: "dark:bg-blue-900/20", text: "text-blue-600", darkText: "dark:text-blue-400", border: "border-blue-100" },
      convRate: null as number | null,
      change: (currPeriod && prevPeriod) ? calcChange(currPeriod.totalLeads, prevPeriod.totalLeads) : null,
    },
    {
      key: "followup", title: "Leads em Follow-up", subtitle: "Com mensagem enviada",
      icon: GitBranch, value: followUp, display: String(followUp),
      color: { bg: "bg-purple-50", darkBg: "dark:bg-purple-900/20", text: "text-purple-600", darkText: "dark:text-purple-400", border: "border-purple-100" },
      convRate: totalLeads > 0 ? Math.round((followUp / totalLeads) * 100) : null,
      change: null as number | null,
    },
    {
      key: "agendados", title: "Agendamentos", subtitle: "Consultas marcadas",
      icon: CalendarCheck, value: agendados, display: String(agendados),
      color: { bg: "bg-violet-50", darkBg: "dark:bg-violet-900/20", text: "text-violet-600", darkText: "dark:text-violet-400", border: "border-violet-100" },
      convRate: totalLeads > 0 ? Math.round((agendados / totalLeads) * 100) : null,
      change: (currPeriod && prevPeriod) ? calcChange(currPeriod.agendados, prevPeriod.agendados) : null,
    },
    {
      key: "compareceram", title: "Comparecimentos", subtitle: "Leads presentes",
      icon: UserCheck, value: compareceram, display: String(compareceram),
      color: { bg: "bg-amber-50", darkBg: "dark:bg-amber-900/20", text: "text-amber-600", darkText: "dark:text-amber-400", border: "border-amber-100" },
      convRate: totalLeads > 0 ? Math.round((compareceram / totalLeads) * 100) : null,
      change: (currPeriod && prevPeriod) ? calcChange(currPeriod.compareceram, prevPeriod.compareceram) : null,
    },
    {
      key: "vendas", title: "Vendas Fechadas", subtitle: "Conversões finais",
      icon: Trophy, value: totalSales, display: String(totalSales),
      color: { bg: "bg-emerald-50", darkBg: "dark:bg-emerald-900/20", text: "text-emerald-600", darkText: "dark:text-emerald-400", border: "border-emerald-100" },
      convRate: totalLeads > 0 ? Math.round((totalSales / totalLeads) * 100) : null,
      change: (currPeriod && prevPeriod) ? calcChange(currPeriod.totalSales, prevPeriod.totalSales) : null,
    },
  ];

  // ── Row 2: financeiro ──
  const finCards = [
    {
      key: "faturamento", title: "Faturamento", subtitle: "Receita total",
      icon: DollarSign, display: fmtBRL(faturamento),
      color: { bg: "bg-emerald-50", darkBg: "dark:bg-emerald-900/20", text: "text-emerald-600", darkText: "dark:text-emerald-400", border: "border-emerald-100" },
    },
    {
      key: "investimento", title: "Investimento", subtitle: "Gasto em anúncios Meta",
      icon: BarChart2,
      display: investimento === null ? "—" : fmtBRL(investimento),
      color: { bg: "bg-blue-50", darkBg: "dark:bg-blue-900/20", text: "text-blue-600", darkText: "dark:text-blue-400", border: "border-blue-100" },
    },
    {
      key: "roas", title: "ROAS", subtitle: "Retorno sobre anúncio",
      icon: Zap,
      display: roas === null ? "—" : `${roas.toFixed(1)}x`,
      color: {
        bg: roas !== null && roas >= 3 ? "bg-emerald-50" : "bg-amber-50",
        darkBg: roas !== null && roas >= 3 ? "dark:bg-emerald-900/20" : "dark:bg-amber-900/20",
        text: roas !== null && roas >= 3 ? "text-emerald-600" : "text-amber-600",
        darkText: roas !== null && roas >= 3 ? "dark:text-emerald-400" : "dark:text-amber-400",
        border: roas !== null && roas >= 3 ? "border-emerald-100" : "border-amber-100",
      },
    },
    {
      key: "ticket", title: "Ticket Médio", subtitle: "Por venda fechada",
      icon: Tag, display: fmtBRL(ticketMedio),
      color: { bg: "bg-violet-50", darkBg: "dark:bg-violet-900/20", text: "text-violet-600", darkText: "dark:text-violet-400", border: "border-violet-100" },
    },
    {
      key: "perdidos", title: "Perdidos", subtitle: "Leads não convertidos",
      icon: XCircle, display: String(perdidos),
      color: { bg: "bg-red-50", darkBg: "dark:bg-red-900/20", text: "text-red-500", darkText: "dark:text-red-400", border: "border-red-100" },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Linha 1 — funil */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {funnelCards.map((card) => (
          <div
            key={card.key}
            className={`group bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border ${card.color.border} dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${card.color.bg} ${card.color.text} ${card.color.darkBg} ${card.color.darkText} p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
              {card.convRate !== null && (
                <span className={`text-xs font-semibold ${card.color.text} ${card.color.darkText} px-1.5 py-0.5 rounded-full ${card.color.bg} ${card.color.darkBg}`}>
                  {card.convRate}%
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{card.display}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5">{card.title}</p>
            {card.change !== null && (
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${
                card.change > 0 ? "text-emerald-600 dark:text-emerald-400" :
                card.change < 0 ? "text-red-500 dark:text-red-400" :
                "text-gray-400 dark:text-gray-500"
              }`}>
                {card.change > 0 ? <TrendingUp className="h-3 w-3" /> :
                 card.change < 0 ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {card.change > 0 ? "+" : ""}{card.change}% vs anterior
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Linha 2 — financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {finCards.map((card) => (
          <div
            key={card.key}
            className={`group bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border ${card.color.border} dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${card.color.bg} ${card.color.text} ${card.color.darkBg} ${card.color.darkText} p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{card.display}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mt-0.5">{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
