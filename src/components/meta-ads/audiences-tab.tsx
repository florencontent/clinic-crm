"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { MetaAdSet } from "@/data/mock-data";
import { useTheme } from "@/lib/theme-context";

interface AudiencesTabProps {
  adsets: MetaAdSet[];
}

function fmt(val: number | undefined | null) {
  return (val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    status: string;
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
      const cName = a.campaignName || "";
      if (!ex.campaigns.includes(cName)) ex.campaigns.push(cName);
      // If any adset in the group is ACTIVE, mark the group as ACTIVE
      if (a.status === "ACTIVE") ex.status = "ACTIVE";
    } else {
      map.set(key, {
        audience: a.audience,
        campaigns: [a.campaignName || ""],
        status: a.status || "UNKNOWN",
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tooltipStyle = {
    borderRadius: 8,
    border: isDark ? "1px solid #374151" : "1px solid #e2e8f0",
    fontSize: 12,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f1f5f9" : "#111827",
  };
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [onlyActive, setOnlyActive] = useState(false);

  const grouped = useMemo(() => groupByAudience(adsets), [adsets]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...grouped]
    .filter(g => g.leads > 0)
    .filter(g => !onlyActive || g.status === "ACTIVE")
    .sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const barData = useMemo(() =>
    grouped
      .filter(g => g.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .map(g => ({ name: g.audience, leads: g.leads, cpl: parseFloat(g.cpl.toFixed(2)) })),
    [grouped]
  );

  function wrapText(text: string, maxChars = 14): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      if (current && (current + " " + word).length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = current ? current + " " + word : word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function CustomXTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
    const lines = wrapText(payload?.value ?? "");
    const fill = isDark ? "#9ca3af" : "#64748b";
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text key={i} x={0} y={0} dy={i * 13 + 12} textAnchor="middle" fill={fill} fontSize={10}>
            {line}
          </text>
        ))}
      </g>
    );
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  }

  const Th = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none text-${align}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">{label} <SortIcon k={k} /></span>
    </th>
  );

  const saturated = grouped.filter(g => g.frequency > 3);

  return (
    <div className="space-y-6">
      {saturated.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {saturated.length} público{saturated.length > 1 ? "s" : ""} com sinal de saturação (frequência &gt; 3)
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {saturated.map(g => g.audience).join(", ")} — considere trocar o criativo ou expandir o público.
            </p>
          </div>
        </div>
      )}

      {/* Leads por público */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Leads por Público</h3>
        <p className="text-xs text-gray-400 mb-4">
          {barData.length} público{barData.length !== 1 ? "s" : ""} com leads no período — ordenado do maior para o menor
        </p>
        {barData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum público gerou leads neste período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={barData}
              margin={{ top: 16, right: 16, left: 0, bottom: barData.length > 5 ? 90 : 60 }}
              barSize={Math.max(24, Math.min(48, Math.floor(600 / barData.length)))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f1f5f9"} />
              <XAxis
                dataKey="name"
                tick={<CustomXTick />}
                interval={0}
                stroke={isDark ? "#374151" : "#e2e8f0"}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: isDark ? "#9ca3af" : "#64748b" }}
                stroke={isDark ? "#374151" : "#e2e8f0"}
              />
              <Tooltip
                formatter={(v, _name, props) => [
                  `${v} leads · CPL R$ ${props.payload.cpl.toFixed(2)}`,
                  props.payload.name,
                ]}
                contentStyle={tooltipStyle}
              />
              <Bar
                dataKey="leads"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Públicos com Leads</h3>
            <span className="text-xs text-gray-400">{sorted.length} público{sorted.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setOnlyActive(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!onlyActive ? "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setOnlyActive(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${onlyActive ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
            >
              ● Ativos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <Th k="audience" label="Público" />
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left">Campanhas</th>
                <Th k="spend" label="Invest." align="right" />
                <Th k="leads" label="Leads" align="right" />
                <Th k="cpl" label="CPL" align="right" />
                <Th k="ctr" label="CTR" align="right" />
                <Th k="reach" label="Alcance" align="right" />
                <Th k="frequency" label="Freq." align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {g.frequency > 3 && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="text-sm text-gray-800 dark:text-gray-100">{g.audience}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {g.campaigns.filter(Boolean).slice(0, 2).map((c, ci) => (
                        <span key={ci} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={c}>
                          {c.length > 15 ? c.slice(0, 15) + "…" : c}
                        </span>
                      ))}
                      {g.campaigns.length > 2 && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">+{g.campaigns.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">R$ {fmt(g.spend)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-100">{g.leads}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${cplBadge(g.cpl)}`}>
                      {g.cpl > 0 ? `R$ ${fmt(g.cpl)}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{g.ctr.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                    {g.reach >= 1000 ? `${(g.reach / 1000).toFixed(1)}k` : g.reach}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.frequency > 3 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
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
