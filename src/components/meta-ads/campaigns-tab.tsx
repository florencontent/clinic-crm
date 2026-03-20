"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { MetaCampaign, MetaAdSet, MetaDailyMetric } from "@/data/mock-data";

interface CampaignsTabProps {
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  daily: MetaDailyMetric[];
  leadOrigins?: { whatsapp: number; site: number };
  datePreset?: string;
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

type SortKey = "name" | "spend" | "leads" | "cpl" | "ctr" | "cpc" | "reach" | "cpm";
type SortDir = "asc" | "desc";

export function CampaignsTab({ campaigns, adsets, daily, leadOrigins, datePreset }: CampaignsTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(false);

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
      className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none text-${align}`}
      onClick={() => handleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label} <SortIcon k={k} />
      </span>
    </th>
  );

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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Campanhas com maior volume de leads</h3>
          <ResponsiveContainer width="100%" height={Math.max(220, barData.length * 52)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" />
              <YAxis type="category" dataKey="name" tick={<WrapTick />} width={180} stroke="#e2e8f0" />
              <Tooltip
                formatter={(v) => [v, "Leads"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Origem dos leads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700">Origem dos Leads</h3>
          <p className="text-xs text-gray-400 mb-4">Canais de captação</p>
          {originsTotal === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">Sem dados de origem</div>
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
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-4 flex-1">
                {originsData.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{d.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round((d.value / originsTotal) * 100)}%`, backgroundColor: d.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 block">
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Investimento vs Leads</h3>
        <p className="text-xs text-gray-400 mb-4">
            {datePreset === "maximum" ? "Evolução diária — últimos 30 dias" : "Evolução diária no período selecionado"}
          </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={daily} margin={{ left: 4, right: 16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#e2e8f0" interval="preserveStartEnd" />
            <YAxis yAxisId="spend" orientation="left" tick={{ fontSize: 10 }} stroke="#e2e8f0" tickFormatter={v => `R$${v}`} width={52} />
            <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10 }} stroke="#e2e8f0" width={30} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-gray-700">Campanhas</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{sorted.length} campanhas</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setOnlyActive(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !onlyActive ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
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
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left w-8"></th>
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
            <tbody className="divide-y divide-gray-50">
              {sorted.map(c => {
                const isOpen = expanded === c.id;
                const children = adsets.filter(a => a.campaignId === c.id);
                return (
                  <>
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/30 cursor-pointer transition-colors"
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
                          <span className="text-sm font-medium text-gray-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">R$ {fmt(c.spend)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{c.leads}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${cplBadge(c.cpl)}`}>
                          {c.cpl > 0 ? `R$ ${fmt(c.cpl)}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{c.ctr.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">R$ {fmt(c.cpc)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {c.reach >= 1000 ? `${(c.reach / 1000).toFixed(1)}k` : c.reach}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">R$ {fmt(c.cpm)}</td>
                    </tr>
                    {isOpen && children.map(a => (
                      <tr key={a.id} className="bg-blue-50/20">
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 pl-10">
                          <span className="text-xs text-gray-500">↳ {a.name}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">R$ {fmt(a.spend)}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-600 font-semibold">{a.leads}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cplBadge(a.cpl)}`}>
                            {a.cpl > 0 ? `R$ ${fmt(a.cpl)}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">{a.ctr.toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">R$ {fmt(a.cpc)}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-500">
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
