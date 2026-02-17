"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MetaDailyMetric } from "@/data/mock-data";

interface CplTrendChartProps {
  data: MetaDailyMetric[];
}

export function CplTrendChart({ data }: CplTrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    cpl: d.leads > 0 ? d.spend / d.leads : null,
  }));

  const validCpls = chartData.filter((d) => d.cpl !== null).map((d) => d.cpl as number);
  const avgCpl = validCpls.length > 0 ? validCpls.reduce((a, b) => a + b, 0) / validCpls.length : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Tendência de CPL
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v) => `R$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backgroundColor: "white",
            }}
            formatter={(value: number) => {
              const delta = avgCpl > 0 ? ((value - avgCpl) / avgCpl * 100).toFixed(1) : "0";
              return [
                `R$ ${value.toFixed(2)} (${Number(delta) > 0 ? "+" : ""}${delta}% vs média)`,
                "CPL",
              ];
            }}
          />
          {avgCpl > 0 && (
            <ReferenceLine
              y={avgCpl}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              label={{ value: `Média R$${avgCpl.toFixed(0)}`, position: "right", fontSize: 11, fill: "#94a3b8" }}
            />
          )}
          <Line
            type="monotone"
            dataKey="cpl"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 4, fill: "#F59E0B" }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
