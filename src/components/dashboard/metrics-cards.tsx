"use client";

import { Users, CalendarCheck, UserCheck, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PeriodComparison } from "@/hooks/use-supabase-data";

interface MetricsCardsProps {
  totalLeads: number;
  agendados: number;
  compareceram: number;
  totalSales: number;
  currPeriod?: PeriodComparison | null;
  prevPeriod?: PeriodComparison | null;
}

const cards = [
  {
    key: "leads",
    title: "Total de Leads",
    subtitle: "Captados no período",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-900/20",
    text: "text-blue-600",
    darkText: "dark:text-blue-400",
    border: "border-blue-100",
  },
  {
    key: "agendados",
    title: "Agendamentos",
    subtitle: "Consultas marcadas",
    icon: CalendarCheck,
    gradient: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    darkBg: "dark:bg-violet-900/20",
    text: "text-violet-600",
    darkText: "dark:text-violet-400",
    border: "border-violet-100",
  },
  {
    key: "compareceram",
    title: "Comparecimentos",
    subtitle: "Leads presentes",
    icon: UserCheck,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    darkBg: "dark:bg-amber-900/20",
    text: "text-amber-600",
    darkText: "dark:text-amber-400",
    border: "border-amber-100",
  },
  {
    key: "vendas",
    title: "Vendas Fechadas",
    subtitle: "Conversões finais",
    icon: Trophy,
    gradient: "from-emerald-500 to-green-500",
    bg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-900/20",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
    border: "border-emerald-100",
  },
];

function calcChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function MetricsCards({ totalLeads, agendados, compareceram, totalSales, currPeriod, prevPeriod }: MetricsCardsProps) {
  const values: Record<string, number> = {
    leads: totalLeads,
    agendados,
    compareceram,
    vendas: totalSales,
  };

  const currValues: Record<string, number> = {
    leads: currPeriod?.totalLeads ?? 0,
    agendados: currPeriod?.agendados ?? 0,
    compareceram: currPeriod?.compareceram ?? 0,
    vendas: currPeriod?.totalSales ?? 0,
  };

  const prevValues: Record<string, number> = {
    leads: prevPeriod?.totalLeads ?? 0,
    agendados: prevPeriod?.agendados ?? 0,
    compareceram: prevPeriod?.compareceram ?? 0,
    vendas: prevPeriod?.totalSales ?? 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = values[card.key];
        const convRate = card.key !== "leads" && totalLeads > 0
          ? Math.round((value / totalLeads) * 100)
          : null;

        const change = (currPeriod && prevPeriod)
          ? calcChange(currValues[card.key], prevValues[card.key])
          : null;

        return (
          <div
            key={card.key}
            className={`group bg-white dark:bg-gray-800 rounded-2xl p-5 border ${card.border} dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bg} ${card.text} ${card.darkBg} ${card.darkText} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                <card.icon className="h-5 w-5" />
              </div>
              {convRate !== null && (
                <span className={`text-xs font-semibold ${card.text} ${card.bg} ${card.darkText} ${card.darkBg} px-2 py-0.5 rounded-full`}>
                  {convRate}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>

            {change !== null && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                change > 0 ? "text-emerald-600 dark:text-emerald-400" :
                change < 0 ? "text-red-500 dark:text-red-400" :
                "text-gray-400 dark:text-gray-500"
              }`}>
                {change > 0 ? <TrendingUp className="h-3 w-3" /> :
                 change < 0 ? <TrendingDown className="h-3 w-3" /> :
                 <Minus className="h-3 w-3" />}
                {change > 0 ? "+" : ""}{change}% vs período anterior
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
