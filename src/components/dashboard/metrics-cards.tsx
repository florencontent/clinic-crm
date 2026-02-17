"use client";

import { DollarSign, ShoppingCart, TrendingUp, Target } from "lucide-react";
import { dashboardMetrics } from "@/data/mock-data";

const cards = [
  {
    title: "Investimento",
    value: dashboardMetrics.investment,
    format: "currency",
    icon: DollarSign,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Total Vendas",
    value: dashboardMetrics.totalSales,
    format: "number",
    icon: ShoppingCart,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Faturamento",
    value: dashboardMetrics.revenue,
    format: "currency",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "ROI",
    value: dashboardMetrics.roi,
    format: "percent",
    icon: Target,
    color: dashboardMetrics.roi >= 0 ? "text-green-600" : "text-red-600",
    bg: dashboardMetrics.roi >= 0 ? "bg-green-50" : "bg-red-50",
  },
];

function formatValue(value: number, format: string) {
  if (format === "currency") {
    return `R$ ${value.toLocaleString("pt-BR")}`;
  }
  if (format === "percent") {
    return `${value}%`;
  }
  return value.toString();
}

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.title === "ROI" ? card.color : "text-gray-900"}`}>
            {formatValue(card.value, card.format)}
          </p>
        </div>
      ))}
    </div>
  );
}
