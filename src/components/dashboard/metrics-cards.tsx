"use client";

import { DollarSign, Users, Target, ShoppingCart, TrendingUp, Percent } from "lucide-react";

interface MetricsCardsProps {
  totalLeads: number;
  totalSales: number;
}

function formatValue(value: number, format: string) {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") {
    return `${value}%`;
  }
  return value.toString();
}

export function MetricsCards({ totalLeads, totalSales }: MetricsCardsProps) {
  const cards = [
    {
      title: "Leads",
      value: totalLeads,
      format: "number",
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Vendas",
      value: totalSales,
      format: "number",
      icon: ShoppingCart,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium">{card.title}</p>
            <div className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {formatValue(card.value, card.format)}
          </p>
        </div>
      ))}
    </div>
  );
}
