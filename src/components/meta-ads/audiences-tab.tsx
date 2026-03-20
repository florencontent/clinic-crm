"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { MetaAdSet } from "@/data/mock-data";

interface AudiencesTabProps {
  adsets: MetaAdSet[];
}

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cplBadge(cpl: number) {
  if (cpl === 0) return "bg-gray-100 text-gray-400";
  if (cpl < 30) return "bg-emerald-100 text-emerald-700";
  if (cpl < 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

type SortKey = "audience" | "spend" | "leads" | "cpl" | "frequency" | "reach" | "ctr";
type SortDir = "asc" | "desc";

// Group adsets by audience name, summing metrics
function groupByAudience(adsets: MetaAdSet[]) {
  const map = new Map<string, {
    audience: string;
    campaigns: string[];
    spend: number;
    leads: number;
    impressions: number;
    clicks: number;
    reach: number;
    count: number;
  }>();

  for (const a of adsets) {
    const key = a.audience;
    if (map.has(key)) {
      const ex = map.get(key)!;
      ex.spend += a.spend;
      ex.leads += a.leads;
      ex.impressions += a.impressions;
      ex.clicks += a.clicks;
      ex.reach += a.reach;
      ex.count++;
      if (!ex.campaigns.includes(a.campaignName)) ex.campaigns.push(a.campaignName);
    } else {
      map.set(key, {
        audience: a.audience,
        campaigns: [a.campaignName],
        spend: a.spend,
        leads: a.leads,
        impressions: a.impressions,
        clicks: a.clicks,
        reach: a.reach,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).map(g => ({
    ...g,
    cpl: g.leads > 0 ? g.spend / g.leads : 0,
    ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
    frequency: g.reach > 0 ? g.impressions / g.reach : 0,
  }));
}

export function AudiencesTab({ adsets }: AudiencesTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const grouped = useMemo(() => groupByAudience(adsets), [adsets]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...grouped].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const barData = [...grouped]
    .sort((a, b) => a.cpl - b.cpl)
    .slice(0, 12)
    .map(g => ({
      name: g.audience.length > 22 ? g.audience.slice(0, 22) + "…" : g.audience,
      cpl: parseFloat(g.cpl.toFixed(2)),
      leads: g.leads,
    }));

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  }

  const Th = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none text-${align}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">{label} <SortIcon k={k} /></span>
    </th>
  );

  const saturated = grouped.filter(g => g.frequency > 3);

  return (
    <div className="space-y-6">
      {saturated.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {saturated.length} público{saturated.length > 1 ? "s" : ""} com sinal de saturação (frequência &gt; 3)
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {saturated.map(g => g.audience).join(", ")} — considere trocar o criativo ou expandir o público.
            </p>
          </div>
        </div>
      )}

      {/* CPL por público */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">CPL por Público</h3>
        <p className="text-xs text-gray-400 mb-4">Menores CPLs — públicos mais eficientes</p>
        <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 36)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 48 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" tickFormatter={v => `R$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} stroke="#e2e8f0" />
            <Tooltip
              formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, "CPL"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Bar dataKey="cpl" fill="#8b5cf6" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 10, fill: "#64748b", formatter: (v: unknown) => `R$${Number(v).toFixed(0)}` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Todos os Públicos</h3>
          <span className="text-xs text-gray-400">{grouped.length} públicos únicos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th k="audience" label="Público" />
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Campanhas</th>
                <Th k="spend" label="Invest." align="right" />
                <Th k="leads" label="Leads" align="right" />
                <Th k="cpl" label="CPL" align="right" />
                <Th k="ctr" label="CTR" align="right" />
                <Th k="reach" label="Alcance" align="right" />
                <Th k="frequency" label="Freq." align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {g.frequency > 3 && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="text-sm text-gray-800">{g.audience}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.campaigns.slice(0, 2).map((c, ci) => (
                        <span key={ci} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={c}>
                          {c.length > 15 ? c.slice(0, 15) + "…" : c}
                        </span>
                      ))}
                      {g.campaigns.length > 2 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{g.campaigns.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">R$ {fmt(g.spend)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{g.leads}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${cplBadge(g.cpl)}`}>
                      {g.cpl > 0 ? `R$ ${fmt(g.cpl)}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">{g.ctr.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {g.reach >= 1000 ? `${(g.reach / 1000).toFixed(1)}k` : g.reach}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.frequency > 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                      {g.frequency.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
