"use client";

import { Users, CalendarCheck, UserCheck, Trophy } from "lucide-react";

interface MetricsCardsProps {
  totalLeads: number;
  agendados: number;
  compareceram: number;
  totalSales: number;
}

const cards = [
  {
    key: "leads",
    title: "Total de Leads",
    subtitle: "Captados no período",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
  },
  {
    key: "agendados",
    title: "Agendamentos",
    subtitle: "Consultas marcadas",
    icon: CalendarCheck,
    gradient: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
  },
  {
    key: "compareceram",
    title: "Comparecimentos",
    subtitle: "Leads presentes",
    icon: UserCheck,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
  },
  {
    key: "vendas",
    title: "Vendas Fechadas",
    subtitle: "Conversões finais",
    icon: Trophy,
    gradient: "from-emerald-500 to-green-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
];

export function MetricsCards({ totalLeads, agendados, compareceram, totalSales }: MetricsCardsProps) {
  const values: Record<string, number> = {
    leads: totalLeads,
    agendados,
    compareceram,
    vendas: totalSales,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = values[card.key];
        const convRate = card.key !== "leads" && totalLeads > 0
          ? Math.round((value / totalLeads) * 100)
          : null;

        return (
          <div
            key={card.key}
            className={`bg-white rounded-2xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bg} ${card.text} p-2.5 rounded-xl`}>
                <card.icon className="h-5 w-5" />
              </div>
              {convRate !== null && (
                <span className={`text-xs font-semibold ${card.text} ${card.bg} px-2 py-0.5 rounded-full`}>
                  {convRate}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-700">{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
