"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { MetaCampaign, MetaAdSet, MetaDailyMetric } from "@/data/mock-data";
import { useTheme } from "@/lib/theme-context";

interface CampaignsTabProps {
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  daily: MetaDailyMetric[];
  leadOrigins?: { whatsapp: number; site: number };
  datePreset?: string;
  since?: string;
  until?: string;
  period?: string;
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

type SortKey = "name" | "spend" | "leads" | "cpl" | "ctr" | "cpc" | "reach" | "cpm";
type SortDir = "asc" | "desc";

// ─── Date range helpers ──────────────────────────────────────────────────────

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Returns number of days between two ISO dates (inclusive) */
function periodDays(sinceIso: string, untilIso: string) {
  const ms = isoToDate(untilIso).getTime() - isoToDate(sinceIso).getTime();
  return Math.round(ms / 86400000) + 1;
}

type Granularity = "day" | "week" | "month" | "halfyear";

function getGranularity(days: number): Granularity {
  if (days <= 31) return "day";
  if (days <= 180) return "week";
  if (days <= 1825) return "month"; // up to ~5 years
  return "halfyear";
}

/** Generate all ISO dates from since to until inclusive */
function generateDateRange(sinceIso: string, untilIso: string): string[] {
  const dates: string[] = [];
  let cur = isoToDate(sinceIso);
  const end = isoToDate(untilIso);
  while (cur <= end) {
    dates.push(dateToIso(cur));
    cur = addDays(cur, 1);
  }
  return dates;
}

/** Aggregate daily data into buckets based on granularity */
function aggregateDaily(
  daily: MetaDailyMetric[],
  sinceIso: string,
  untilIso: string,
  granularity: Granularity
): Array<{ date: string; spend: number; leads: number }> {
  // Build lookup from ISO date → values (zero-fill all dates in range)
  const lookup = new Map<string, { spend: number; leads: number }>();
  for (const d of generateDateRange(sinceIso, untilIso)) {
    lookup.set(d, { spend: 0, leads: 0 });
  }
  for (const row of daily) {
    // row.date is already ISO (YYYY-MM-DD)
    const key = row.date.length === 10 ? row.date : null;
    if (key && lookup.has(key)) {
      lookup.get(key)!.spend += row.spend;
      lookup.get(key)!.leads += row.leads;
    }
  }

  if (granularity === "day") {
    return Array.from(lookup.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([iso, v]) => {
        const [, m, d] = iso.split("-");
        return { date: `${d}/${m}`, ...v };
      });
  }

  // Group into buckets
  const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const buckets = new Map<string, { spend: number; leads: number; label: string }>();

  for (const [iso, v] of Array.from(lookup.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const d = isoToDate(iso);
    let key: string;
    let label: string;

    if (granularity === "week") {
      // ISO week key: year + week number
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      // Label: "S{weekNum} Mmm" — reset week count per month for readability
      const dayOfMonth = d.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      label = `S${weekOfMonth} ${MONTHS_PT[d.getMonth()]}`;
    } else if (granularity === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    } else {
      // halfyear
      const half = d.getMonth() < 6 ? 1 : 2;
      key = `${d.getFullYear()}-H${half}`;
      label = `${half}S/${String(d.getFullYear()).slice(2)}`;
    }

    if (!buckets.has(key)) buckets.set(key, { spend: 0, leads: 0, label });
    buckets.get(key)!.spend += v.spend;
    buckets.get(key)!.leads += v.leads;
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => ({ date: v.label, spend: v.spend, leads: v.leads }));
}

// ─────────────────────────────────────────────────────────────────────────────

export function CampaignsTab({ campaigns, adsets, daily, leadOrigins, datePreset, since, until, period }: CampaignsTabProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(false);

  const tooltipStyle = {
    borderRadius: 8,
    border: isDark ? "1px solid #374151" : "1px solid #e2e8f0",
    fontSize: 12,
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f1f5f9" : "#111827",
  };

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...campaigns]
    .filter(c => !onlyActive || c.status === "ACTIVE")
    .sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const barData = [...campaigns]
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map(c => ({ name: c.name, leads: c.leads, spend: c.spend }));

  function WrapTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
    const name = (payload?.value || "");
    // Split on " | " to use natural breaks, then re-join into max 2 lines of ~30 chars
    const parts = name.split(" | ");
    const lines: string[] = [];
    let current = "";
    for (const part of parts) {
      const candidate = current ? `${current} | ${part}` : part;
      if (candidate.length > 30 && current) {
        lines.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    const lineH = 13;
    const totalH = lines.length * lineH;
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((l, i) => (
          <text
            key={i}
            x={-4}
            y={-(totalH / 2) + i * lineH + lineH * 0.75}
            textAnchor="end"
            fill="#6b7280"
            fontSize={10}
          >
            {l}
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
      <span className="inline-flex items-center gap-1">
        {label} <SortIcon k={k} />
      </span>
    </th>
  );

  // ── Compute chart date range ────────────────────────────────────────────────
  const todayIso = new Date().toISOString().split("T")[0];
  let chartSince: string;
  let chartUntil: string;

  if (period === "custom" && since && until) {
    chartSince = since;
    chartUntil = until;
  } else if (datePreset === "last_7d") {
    chartSince = dateToIso(addDays(new Date(), -7));
    chartUntil = todayIso;
  } else if (datePreset === "last_14d") {
    chartSince = dateToIso(addDays(new Date(), -14));
    chartUntil = todayIso;
  } else if (datePreset === "last_30d") {
    chartSince = dateToIso(addDays(new Date(), -30));
    chartUntil = todayIso;
  } else {
    // maximum: use min/max of actual data
    const dates = daily.map(d => d.date).filter(d => d.length === 10).sort();
    chartSince = dates[0] ?? todayIso;
    chartUntil = dates[dates.length - 1] ?? todayIso;
  }

  const days = periodDays(chartSince, chartUntil);
  const granularity = getGranularity(days);
  const chartData = aggregateDaily(daily, chartSince, chartUntil, granularity);
  // ────────────────────────────────────────────────────────────────────────────

  const originsTotal = (leadOrigins?.whatsapp ?? 0) + (leadOrigins?.site ?? 0);
  const originsData = [
    { name: "WhatsApp", value: leadOrigins?.whatsapp ?? 0, color: "#22c55e" },
    { name: "Site / LP", value: leadOrigins?.site ?? 0, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Linha 1: Top campanhas + Origem dos leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por campanha */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Campanhas com maior volume de leads</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, barData.length * 52)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" />
              <YAxis type="category" dataKey="name" tick={<WrapTick />} width={180} stroke="#e2e8f0" />
              <Tooltip
                formatter={(v) => [v, "Leads"]}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origem dos leads */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Origem dos Leads</h3>
          <p className="text-xs text-gray-400 mb-4">Canais de captação</p>
          {originsTotal === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400 dark:text-gray-500">Sem dados de origem</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={originsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {originsData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [v, "Leads"]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 flex-1">
                {originsData.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{d.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((d.value / originsTotal) * 100)}%`, backgroundColor: d.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
                      {Math.round((d.value / originsTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Linha 2: Investimento vs Leads */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Investimento vs Leads</h3>
        <p className="text-xs text-gray-400 mb-4">
          {granularity === "day" ? "Evolução diária" : granularity === "week" ? "Evolução semanal" : granularity === "month" ? "Evolução mensal" : "Evolução semestral"}
          {datePreset === "maximum" ? " — período total da conta" : " — período selecionado"}
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ left: 4, right: 16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              stroke="#e2e8f0"
              interval={chartData.length > 60 ? Math.floor(chartData.length / 20) : chartData.length > 30 ? Math.floor(chartData.length / 15) : "preserveStartEnd"}
            />
            <YAxis yAxisId="spend" orientation="left" tick={{ fontSize: 10 }} stroke="#e2e8f0" tickFormatter={v => `R$${v}`} width={52} />
            <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10 }} stroke="#e2e8f0" width={30} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) =>
                name === "Investimento" ? [`R$ ${fmt(value as number)}`, name] : [value, name]
              }
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="spend" type="monotone" dataKey="spend" name="Investimento" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="leads" type="monotone" dataKey="leads" name="Leads" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de campanhas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Campanhas</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{sorted.length} campanhas</span>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setOnlyActive(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !onlyActive ? "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100 shadow-sm" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setOnlyActive(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  onlyActive
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                ● Ativas
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-left w-8"></th>
                <Th k="name" label="Campanha" />
                <Th k="spend" label="Invest." align="right" />
                <Th k="leads" label="Leads" align="right" />
                <Th k="cpl" label="CPL" align="right" />
                <Th k="ctr" label="CTR" align="right" />
                <Th k="cpc" label="CPC" align="right" />
                <Th k="reach" label="Alcance" align="right" />
                <Th k="cpm" label="CPM" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map(c => {
                const isOpen = expanded === c.id;
                const children = adsets.filter(a => a.campaignId === c.id);
                return (
                  <>
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                    >
                      <td className="px-4 py-3 text-gray-300">
                        {children.length > 0 && (
                          isOpen ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${c.status === "ACTIVE" ? "bg-emerald-400" : "bg-gray-300"}`}
                          />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">R$ {fmt(c.spend)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-gray-100">{c.leads}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${cplBadge(c.cpl)}`}>
                          {c.cpl > 0 ? `R$ ${fmt(c.cpl)}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{c.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">R$ {fmt(c.cpc)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {c.reach >= 1000 ? `${(c.reach / 1000).toFixed(1)}k` : c.reach}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">R$ {fmt(c.cpm)}</td>
                    </tr>
                    {isOpen && children.map(a => (
                      <tr key={a.id} className="bg-blue-50/20 dark:bg-blue-900/10">
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-10">
                          <span className="text-xs text-gray-500 dark:text-gray-400">↳ {a.name}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">R$ {fmt(a.spend)}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-600 dark:text-gray-300 font-semibold">{a.leads}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cplBadge(a.cpl)}`}>
                            {a.cpl > 0 ? `R$ ${fmt(a.cpl)}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{a.ctr.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">R$ {fmt(a.cpc)}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">
                          {a.reach >= 1000 ? `${(a.reach / 1000).toFixed(1)}k` : a.reach}
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
