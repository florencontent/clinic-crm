"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Label,
} from "recharts";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { MetaCampaign, MetaAdSet } from "@/data/mock-data";

interface CampaignsTabProps {
  campaigns: MetaCampaign[];
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

type SortKey = "name" | "spend" | "leads" | "cpl" | "ctr" | "cpc" | "reach" | "cpm";
type SortDir = "asc" | "desc";

export function CampaignsTab({ campaigns, adsets }: CampaignsTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...campaigns].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const barData = [...campaigns]
    .sort((a, b) => b.leads - a.leads)
    .map(c => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, leads: c.leads, spend: c.spend }));

  const scatterData = campaigns
    .filter(c => c.spend > 0)
    .map(c => ({ x: c.spend, y: c.leads, z: c.cpl > 0 ? c.cpl : 1, name: c.name }));

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

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por campanha */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por Campanha</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} stroke="#e2e8f0" />
              <Tooltip
                formatter={(v) => [v, "Leads"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Investimento vs Leads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Investimento vs Leads</h3>
          <p className="text-xs text-gray-400 mb-4">Tamanho do ponto = CPL (maior = mais caro)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 8, right: 16, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="x" type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" name="Investimento">
                <Label value="Investimento (R$)" offset={-4} position="insideBottom" style={{ fontSize: 10, fill: "#94a3b8" }} />
              </XAxis>
              <YAxis dataKey="y" type="number" tick={{ fontSize: 11 }} stroke="#e2e8f0" name="Leads">
                <Label value="Leads" angle={-90} position="insideLeft" style={{ fontSize: 10, fill: "#94a3b8" }} />
              </YAxis>
              <ZAxis dataKey="z" range={[40, 300]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
                      <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
                      <p>Investimento: R$ {fmt(d.x)}</p>
                      <p>Leads: {d.y}</p>
                      <p>CPL: R$ {fmt(d.z)}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#3b82f6" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de campanhas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Todas as Campanhas</h3>
          <span className="text-xs text-gray-400">{campaigns.length} campanhas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
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
