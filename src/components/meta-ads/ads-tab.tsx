"use client";

import { useState, useMemo } from "react";
import { Image as ImageIcon, Video, LayoutGrid, Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { MetaAd, MetaAdSet, MetaCampaign } from "@/data/mock-data";

interface AdsTabProps {
  ads: MetaAd[];
  adsets: MetaAdSet[];
  campaigns: MetaCampaign[];
}

interface DeduplicatedAd {
  name: string;
  thumbnailUrl?: string;
  objectType?: string;
  campaignType?: "whatsapp" | "lp" | "unknown";
  instances: number;
  adsetNames: string[];
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

function fmt(val: number | undefined | null) {
  return (val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cplColor(cpl: number) {
  if (cpl === 0) return { bg: "bg-gray-100", text: "text-gray-400", badge: "bg-gray-100 text-gray-400" };
  if (cpl < 30) return { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" };
  if (cpl < 50) return { bg: "bg-amber-50", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" };
  return { bg: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700" };
}

function getObjectTypeLabel(type?: string) {
  if (!type) return null;
  const t = type.toUpperCase();
  if (t.includes("VIDEO")) return "Vídeo";
  if (t.includes("CAROUSEL") || t.includes("CAROUSEL_CARD")) return "Carrossel";
  return "Imagem";
}

function ObjectTypeIcon({ type }: { type?: string }) {
  if (!type) return <ImageIcon className="w-4 h-4 text-gray-400" />;
  const t = type.toUpperCase();
  if (t.includes("VIDEO")) return <Video className="w-4 h-4 text-purple-500" />;
  if (t.includes("CAROUSEL")) return <LayoutGrid className="w-4 h-4 text-blue-500" />;
  return <ImageIcon className="w-4 h-4 text-yellow-500" />;
}

function deduplicateAds(ads: MetaAd[], adsets: MetaAdSet[]): DeduplicatedAd[] {
  const adsetMap = new Map(adsets.map(a => [a.id, a.name]));
  const map = new Map<string, DeduplicatedAd>();

  for (const ad of ads) {
    const key = ad.name;
    const adsetName = adsetMap.get(ad.adsetId) || ad.adsetId;
    if (map.has(key)) {
      const ex = map.get(key)!;
      ex.spend += ad.spend;
      ex.leads += ad.leads;
      ex.impressions += ad.impressions;
      ex.clicks += ad.clicks;
      ex.instances++;
      if (!ex.adsetNames.includes(adsetName)) ex.adsetNames.push(adsetName);
      if (!ex.thumbnailUrl && ad.thumbnailUrl) ex.thumbnailUrl = ad.thumbnailUrl;
      if (!ex.objectType && ad.objectType) ex.objectType = ad.objectType;
    } else {
      map.set(key, {
        name: ad.name,
        thumbnailUrl: ad.thumbnailUrl,
        objectType: ad.objectType,
        campaignType: ad.campaignType,
        instances: 1,
        adsetNames: [adsetName],
        spend: ad.spend,
        leads: ad.leads,
        impressions: ad.impressions,
        clicks: ad.clicks,
        cpl: 0,
        ctr: 0,
        cpc: 0,
      });
    }
  }

  return Array.from(map.values()).map(a => ({
    ...a,
    cpl: a.leads > 0 ? a.spend / a.leads : 0,
    ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0,
    cpc: a.clicks > 0 ? a.spend / a.clicks : 0,
  }));
}

// Short label for bar chart x-axis
function shortName(name: string) {
  const words = name.split(" ");
  return words.slice(0, 3).join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WrappedXTick({ x, y, payload }: any) {
  const words: string[] = payload.value.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > 9 && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  return (
    <g transform={`translate(${x},${y + 6})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={i * 12}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={9}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

const PIE_COLORS: Record<string, string> = {
  whatsapp: "#22c55e",
  lp: "#f97316",
  unknown: "#94a3b8",
};

const PIE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  lp: "Landing Page",
  unknown: "Outros",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const leads = payload[0]?.value ?? 0;
  const cpl = payload[0]?.payload?.cpl ?? 0;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5 max-w-[180px] leading-snug">{label}</p>
      <p className="text-gray-600 dark:text-gray-300">Leads: <span className="font-bold text-gray-900 dark:text-white">{leads}</span></p>
      <p className="text-gray-600 dark:text-gray-300">CPL: <span className="font-bold text-gray-900 dark:text-white">R$ {fmt(cpl)}</span></p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{d.name}</p>
      <p className="text-gray-600 dark:text-gray-300">Leads: <span className="font-bold text-gray-900 dark:text-white">{d.payload.leads}</span></p>
      <p className="text-gray-600 dark:text-gray-300">CPL médio: <span className="font-bold text-gray-900 dark:text-white">R$ {fmt(d.payload.cpl)}</span></p>
      <p className="text-gray-600 dark:text-gray-300">Investimento: <span className="font-bold text-gray-900 dark:text-white">R$ {fmt(d.payload.spend)}</span></p>
    </div>
  );
}

export function AdsTab({ ads, adsets, campaigns: _campaigns }: AdsTabProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"leads" | "cpl" | "spend">("leads");
  const [campaignFilter, setCampaignFilter] = useState<"all" | "whatsapp" | "lp">("all");
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const deduplicated = useMemo(() => deduplicateAds(ads, adsets), [ads, adsets]);

  const filtered = useMemo(() => {
    let result = deduplicated.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      (campaignFilter === "all" || a.campaignType === campaignFilter)
    );
    result.sort((a, b) => {
      if (sortBy === "leads") return b.leads - a.leads;
      if (sortBy === "cpl") return (a.cpl || Infinity) - (b.cpl || Infinity);
      return b.spend - a.spend;
    });
    return result;
  }, [deduplicated, search, sortBy, campaignFilter]);

  const displayed = showAll ? filtered : filtered.slice(0, 9);

  const avgCpl = deduplicated.filter(a => a.cpl > 0).reduce((s, a, _, arr) => s + a.cpl / arr.length, 0);

  // Bar chart data — only ads with leads, sorted by leads desc
  const barData = useMemo(() =>
    [...deduplicated]
      .filter(a => a.leads > 0)
      .sort((a, b) => b.leads - a.leads)
      .map(a => ({ name: a.name, shortName: shortName(a.name), leads: a.leads, cpl: a.cpl })),
    [deduplicated]
  );

  // Pie chart data — group by campaignType
  const pieData = useMemo(() => {
    const groups = new Map<string, { leads: number; spend: number }>();
    for (const a of deduplicated) {
      const key = a.campaignType ?? "unknown";
      const g = groups.get(key) ?? { leads: 0, spend: 0 };
      g.leads += a.leads;
      g.spend += a.spend;
      groups.set(key, g);
    }
    return Array.from(groups.entries())
      .filter(([, g]) => g.leads > 0)
      .map(([key, g]) => ({
        name: PIE_LABELS[key] ?? key,
        color: PIE_COLORS[key] ?? "#94a3b8",
        leads: g.leads,
        spend: g.spend,
        cpl: g.leads > 0 ? g.spend / g.leads : 0,
        value: g.leads,
      }));
  }, [deduplicated]);

  const BAR_WIDTH = Math.max(barData.length * 72, 400);

  return (
    <div className="space-y-5">
      {/* Charts section */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 min-w-0">
        {/* Bar chart — leads & CPL per ad */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Leads e CPL por Anúncio</h3>
          <div className="overflow-x-auto w-full">
            <div style={{ width: BAR_WIDTH, minWidth: BAR_WIDTH, height: 260 }}>
              <BarChart
                width={BAR_WIDTH}
                height={260}
                data={barData}
                margin={{ top: 10, right: 16, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  tick={<WrappedXTick />}
                  interval={0}
                  height={56}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  width={32}
                  tickFormatter={v => String(v)}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
                <Bar dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">* Role para ver todos os anúncios · CPL exibido no tooltip</p>
        </div>

        {/* Pie chart — leads by campaign type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Leads por categoria de anúncio</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">Sem dados</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={200} height={200}>
                <Pie
                  data={pieData}
                  cx={100}
                  cy={100}
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>

              {/* Legend */}
              <div className="w-full space-y-3">
                {pieData.map((entry, i) => {
                  const total = pieData.reduce((s, p) => s + p.leads, 0);
                  const pct = total > 0 ? ((entry.leads / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span>{entry.leads} leads ({pct}%)</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">R$ {fmt(entry.cpl)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>CPL médio geral</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">R$ {fmt(avgCpl)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar anúncio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {([
            { value: "all", label: "Todos" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "lp", label: "Landing Page" },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => setCampaignFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${campaignFilter === f.value ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(["leads", "cpl", "spend"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sortBy === s ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {s === "leads" ? "Mais Leads" : s === "cpl" ? "Menor CPL" : "Maior Invest."}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} anúncios · CPL médio R$ {fmt(avgCpl)}</span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {displayed.map((ad, idx) => {
          const colors = cplColor(ad.cpl);
          const isExpanded = expandedAd === ad.name;
          const rank = idx < 3 ? idx + 1 : null;
          const typeLabel = getObjectTypeLabel(ad.objectType);

          return (
            <div
              key={ad.name}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              {/* Thumbnail — proporção 4:5 (1080×1350) */}
              <div className="relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {ad.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.name}
                    className="w-full h-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ObjectTypeIcon type={ad.objectType} />
                  </div>
                )}

                {/* Rank badge */}
                {rank && (
                  <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${rank === 1 ? "bg-amber-400 text-white" : rank === 2 ? "bg-gray-300 text-gray-700" : "bg-orange-300 text-white"}`}>
                    #{rank}
                  </div>
                )}

                {/* Type + Campaign badges stacked top-right */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                  {typeLabel && (
                    <div className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      <ObjectTypeIcon type={ad.objectType} />
                      <span>{typeLabel}</span>
                    </div>
                  )}
                  {ad.campaignType === "whatsapp" && (
                    <div className="bg-emerald-600/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                      WhatsApp
                    </div>
                  )}
                  {ad.campaignType === "lp" && (
                    <div className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                      Landing Page
                    </div>
                  )}
                </div>

                {/* Instances badge */}
                {ad.instances > 1 && (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {ad.instances} conjuntos
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 line-clamp-2 leading-snug" title={ad.name}>
                  {ad.name}
                </p>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Leads</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{ad.leads}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${colors.bg} dark:bg-gray-700/50`}>
                    <p className="text-xs text-gray-400 mb-0.5">CPL</p>
                    <p className={`text-lg font-bold ${colors.text}`}>
                      {ad.cpl > 0 ? `R$${ad.cpl.toFixed(0)}` : "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Investimento</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">R$ {fmt(ad.spend)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">CTR</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{ad.ctr.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedAd(isExpanded ? null : ad.name)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-1"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {isExpanded ? "Ocultar conjuntos" : `Ver ${ad.adsetNames.length} conjunto${ad.adsetNames.length > 1 ? "s" : ""}`}
                </button>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {ad.adsetNames.map((n, i) => (
                      <p key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        {n}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 9 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(v => !v)}
            className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {showAll ? "Mostrar menos" : `Ver todos (${filtered.length - 9} restantes)`}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum anúncio encontrado</p>
        </div>
      )}
    </div>
  );
}
