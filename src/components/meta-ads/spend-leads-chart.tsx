"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MetaDailyMetric } from "@/data/mock-data";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  const spend = payload.find((p) => p.name === "Investimento")?.value || 0;
  const leads = payload.find((p) => p.name === "Leads")?.value || 0;
  const cpl = leads > 0 ? spend / leads : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[180px]">
      <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {entry.name === "Investimento"
              ? `R$ ${entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : entry.value}
          </span>
        </div>
      ))}
      {leads > 0 && (
        <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-gray-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-gray-500">CPL:</span>
          <span className="font-medium text-gray-900">
            R$ {cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

export function SpendLeadsChart({ data }: { data: MetaDailyMetric[] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Investimento & Leads por Dia
      </h3>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis
            yAxisId="spend"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v) => `R$${v}`}
          />
          <YAxis
            yAxisId="leads"
            orientation="right"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            name="Investimento"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#spendGradient)"
          />
          <Line
            yAxisId="leads"
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
