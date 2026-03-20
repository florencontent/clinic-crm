"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MetaDailyMetric } from "@/data/mock-data";

interface EvolutionTabProps {
  daily: MetaDailyMetric[];
}

type Metric = "leads" | "spend" | "cpl";

const metricConfig: Record<Metric, { label: string; color: string; prefix: string; suffix: string }> = {
  leads: { label: "Leads por dia", color: "#3b82f6", prefix: "", suffix: " leads" },
  spend: { label: "Investimento por dia", color: "#8b5cf6", prefix: "R$ ", suffix: "" },
  cpl: { label: "CPL por dia", color: "#f59e0b", prefix: "R$ ", suffix: "" },
};

export function EvolutionTab({ daily }: EvolutionTabProps) {
  const [metric, setMetric] = useState<Metric>("leads");

  const data = daily.map(d => ({
    ...d,
    cpl: d.leads > 0 ? d.spend / d.leads : 0,
  }));

  const values = data.map(d => d[metric] as number).filter(v => v > 0);
  const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  const cfg = metricConfig[metric];

  function fmt(val: number) {
    return val.toLocaleString("pt-BR", { minimumFractionDigits: metric !== "leads" ? 2 : 0, maximumFractionDigits: metric !== "leads" ? 2 : 0 });
  }

  const totalLeads = daily.reduce((s, d) => s + d.leads, 0);
  const totalSpend = daily.reduce((s, d) => s + d.spend, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const bestDay = [...data].sort((a, b) => b.leads - a.leads)[0];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total de leads</p>
          <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
          <p className="text-xs text-gray-400 mt-1">no período</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total investido</p>
          <p className="text-2xl font-bold text-gray-900">R$ {totalSpend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-400 mt-1">no período</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CPL médio</p>
          <p className={`text-2xl font-bold ${avgCpl < 30 ? "text-emerald-600" : avgCpl < 50 ? "text-amber-500" : "text-red-500"}`}>
            {avgCpl > 0 ? `R$ ${avgCpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">custo por lead</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Melhor dia</p>
          <p className="text-2xl font-bold text-gray-900">{bestDay?.leads ?? 0} leads</p>
          <p className="text-xs text-gray-400 mt-1">{bestDay?.date ?? "—"}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{cfg.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Média do período: {cfg.prefix}{fmt(avg)}{cfg.suffix}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["leads", "spend", "cpl"] as Metric[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${metric === m ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {m === "leads" ? "Leads" : m === "spend" ? "Investimento" : "CPL"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ left: 8, right: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              stroke="#e2e8f0"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              stroke="#e2e8f0"
              tickFormatter={v => metric === "leads" ? String(v) : `R$${v}`}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v) => [`${cfg.prefix}${fmt(Number(v))}${cfg.suffix}`, cfg.label]}
            />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke={cfg.color}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{ value: `Média: ${cfg.prefix}${fmt(avg)}`, position: "right", fontSize: 10, fill: cfg.color }}
              />
            )}
            <Line
              type="monotone"
              dataKey={metric}
              stroke={cfg.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Detalhamento Diário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Data</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Investimento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Leads</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">CPL</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Impressões</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Cliques</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...data].reverse().map((d, i) => {
                const cpl = d.leads > 0 ? d.spend / d.leads : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{d.date}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">R$ {d.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{d.leads}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cpl === 0 ? "bg-gray-100 text-gray-400" : cpl < 30 ? "bg-emerald-100 text-emerald-700" : cpl < 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {cpl > 0 ? `R$ ${cpl.toFixed(2)}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {d.impressions >= 1000 ? `${(d.impressions / 1000).toFixed(1)}k` : d.impressions}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">{d.clicks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
