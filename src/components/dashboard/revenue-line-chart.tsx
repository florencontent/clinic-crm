"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { fetchDailyFechados } from "@/lib/api";
import { useTheme } from "@/lib/theme-context";
import { Loader2 } from "lucide-react";

// Ticket médio por venda fechada (configurável)
const AVG_TICKET = 3500;

type DateFilter = "hoje" | "7d" | "15d" | "30d" | "custom";

interface Props {
  activeFilter: DateFilter;
  customStart?: string;
  customEnd?: string;
}

function getDateRange(filter: DateFilter, customStart?: string, customEnd?: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  if (filter === "custom" && customStart && customEnd) {
    return { from: customStart, to: customEnd };
  }
  const days = filter === "hoje" ? 1 : filter === "7d" ? 7 : filter === "15d" ? 15 : 30;
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  return { from: fmt(from), to: fmt(today) };
}


function formatBRL(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
}

export function RevenueLineChart({ activeFilter, customStart, customEnd }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [chartData, setChartData] = useState<Array<{ date: string; faturamento: number; investimento: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { from, to } = getDateRange(activeFilter, customStart, customEnd);

      const fechados = await fetchDailyFechados(`${from}T00:00:00Z`, `${to}T23:59:59Z`);

      const sorted = fechados.map((f) => {
        const [, m, d] = f.date.split("-");
        return { date: `${d}/${m}`, faturamento: f.count * AVG_TICKET, investimento: 0 };
      });

      setChartData(sorted);
      setLoading(false);
    }

    load();
  }, [activeFilter, customStart, customEnd]);

  const gridColor = isDark ? "#1f2937" : "#f3f4f6";
  const textColor = isDark ? "#6b7280" : "#9ca3af";
  const bgColor = isDark ? "#1f2937" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#f3f4f6";

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow duration-200"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Faturamento vs Investimento</h3>
        <p className="text-xs text-gray-400 mt-0.5">Evolução ao longo do período selecionado</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-52">
          <p className="text-sm text-gray-400">Nenhum dado no período</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: textColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatBRL}
              tick={{ fontSize: 11, fill: textColor }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                fontSize: 13,
                backgroundColor: bgColor,
                color: isDark ? "#f1f5f9" : "#111827",
              }}
              formatter={(value: number, name: string) => [
                `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
                name === "faturamento" ? "Faturamento" : "Investimento",
              ]}
            />
            <Line
              type="monotone"
              dataKey="faturamento"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
