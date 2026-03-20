"use client";

import { useState, useMemo } from "react";
import { Image as ImageIcon, Video, LayoutGrid, Search, ChevronDown, ChevronUp } from "lucide-react";
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

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  return <ImageIcon className="w-4 h-4 text-emerald-500" />;
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

export function AdsTab({ ads, adsets, campaigns: _campaigns }: AdsTabProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"leads" | "cpl" | "spend">("leads");
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const deduplicated = useMemo(() => deduplicateAds(ads, adsets), [ads, adsets]);

  const filtered = useMemo(() => {
    let result = deduplicated.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      if (sortBy === "leads") return b.leads - a.leads;
      if (sortBy === "cpl") return (a.cpl || Infinity) - (b.cpl || Infinity);
      return b.spend - a.spend;
    });
    return result;
  }, [deduplicated, search, sortBy]);

  const displayed = showAll ? filtered : filtered.slice(0, 9);

  const avgCpl = deduplicated.filter(a => a.cpl > 0).reduce((s, a, _, arr) => s + a.cpl / arr.length, 0);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar anúncio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(["leads", "cpl", "spend"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${sortBy === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s === "leads" ? "Mais Leads" : s === "cpl" ? "Menor CPL" : "Maior Invest."}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} anúncios únicos · CPL médio R$ {fmt(avgCpl)}</span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map((ad, idx) => {
          const colors = cplColor(ad.cpl);
          const isExpanded = expandedAd === ad.name;
          const rank = idx < 3 ? idx + 1 : null;
          const typeLabel = getObjectTypeLabel(ad.objectType);

          return (
            <div
              key={ad.name}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${colors.bg} border-gray-100`}
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                {ad.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.name}
                    className="w-full h-full object-cover"
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

                {/* Type badge */}
                {typeLabel && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    <ObjectTypeIcon type={ad.objectType} />
                    <span>{typeLabel}</span>
                  </div>
                )}

                {/* Instances badge */}
                {ad.instances > 1 && (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {ad.instances} conjuntos
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 leading-snug" title={ad.name}>
                  {ad.name}
                </p>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Leads</p>
                    <p className="text-lg font-bold text-gray-900">{ad.leads}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${colors.bg}`}>
                    <p className="text-xs text-gray-400 mb-0.5">CPL</p>
                    <p className={`text-lg font-bold ${colors.text}`}>
                      {ad.cpl > 0 ? `R$${ad.cpl.toFixed(0)}` : "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">Investimento</p>
                    <p className="text-sm font-semibold text-gray-700">R$ {fmt(ad.spend)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-400 mb-0.5">CTR</p>
                    <p className="text-sm font-semibold text-gray-700">{ad.ctr.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedAd(isExpanded ? null : ad.name)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {isExpanded ? "Ocultar conjuntos" : `Ver ${ad.adsetNames.length} conjunto${ad.adsetNames.length > 1 ? "s" : ""}`}
                </button>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {ad.adsetNames.map((n, i) => (
                      <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
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
