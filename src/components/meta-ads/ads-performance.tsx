"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { MetaAd, MetaAdSet, MetaCampaign } from "@/data/mock-data";

interface AdsPerformanceProps {
  ads: MetaAd[];
  adsets: MetaAdSet[];
  campaigns: MetaCampaign[];
}

type CampaignType = "whatsapp" | "formulario" | "landing_page" | "outro";

const campaignTypeBadge: Record<CampaignType, { label: string; className: string }> = {
  whatsapp: { label: "WhatsApp", className: "bg-green-100 text-green-700" },
  formulario: { label: "Formulário", className: "bg-blue-100 text-blue-700" },
  landing_page: { label: "Landing Page", className: "bg-purple-100 text-purple-700" },
  outro: { label: "Outro", className: "bg-gray-100 text-gray-600" },
};

function getCampaignType(name: string): CampaignType {
  const lower = name.toLowerCase();
  if (/whatsapp/i.test(lower)) return "whatsapp";
  if (/formul[aá]rio/i.test(lower)) return "formulario";
  if (/landing\s*page/i.test(lower) || /\blp\b/i.test(lower)) return "landing_page";
  return "outro";
}

export function AdsPerformance({ ads, adsets, campaigns }: AdsPerformanceProps) {
  const [showAll, setShowAll] = useState(false);
  const [adSearch, setAdSearch] = useState("");

  // Build lookup maps: adsetId → campaignId, campaignId → campaign
  const adsetToCampaign = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of adsets) map.set(s.id, s.campaignId);
    return map;
  }, [adsets]);

  const campaignMap = useMemo(() => {
    const map = new Map<string, MetaCampaign>();
    for (const c of campaigns) map.set(c.id, c);
    return map;
  }, [campaigns]);

  // For each ad, resolve its campaign type
  const adCampaignType = useMemo(() => {
    const map = new Map<string, CampaignType>();
    for (const ad of ads) {
      const campaignId = adsetToCampaign.get(ad.adsetId);
      const campaign = campaignId ? campaignMap.get(campaignId) : undefined;
      map.set(ad.id, campaign ? getCampaignType(campaign.name) : "outro");
    }
    return map;
  }, [ads, adsetToCampaign, campaignMap]);

  const sortedAds = useMemo(() => {
    let filtered = [...ads].filter((a) => a.spend > 0);
    if (adSearch.trim()) {
      const q = adSearch.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => b.leads - a.leads);
  }, [ads, adSearch]);

  const visibleAds = showAll ? sortedAds : sortedAds.slice(0, 8);
  const maxLeads = Math.max(...sortedAds.map((a) => a.leads), 1);

  const avgCpl = useMemo(() => {
    const totalSpend = sortedAds.reduce((s, a) => s + a.spend, 0);
    const totalLeads = sortedAds.reduce((s, a) => s + a.leads, 0);
    return totalLeads > 0 ? totalSpend / totalLeads : 0;
  }, [sortedAds]);

  function getCplColor(cpl: number) {
    if (cpl <= 0 || avgCpl <= 0) return "text-gray-700";
    if (cpl < avgCpl) return "text-green-600";
    if (cpl > avgCpl * 1.5) return "text-red-600";
    return "text-gray-700";
  }

  const rankColors = [
    "bg-amber-400 text-white",
    "bg-gray-300 text-gray-700",
    "bg-amber-600/70 text-white",
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-gray-900">Top Anúncios</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={adSearch}
              onChange={(e) => { setAdSearch(e.target.value); setShowAll(false); }}
              placeholder="Filtrar por nome..."
              className="pl-8 h-8 w-52 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        {sortedAds.length > 8 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showAll ? "Ver menos" : `Ver todos (${sortedAds.length})`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleAds.map((ad, idx) => {
          const cpl = ad.leads > 0 ? ad.spend / ad.leads : 0;
          const type = adCampaignType.get(ad.id) || "outro";
          const badge = campaignTypeBadge[type];
          return (
            <div
              key={ad.id}
              className="relative bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Rank badge for top 3 */}
              {idx < 3 && (
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColors[idx]}`}>
                  {idx + 1}
                </div>
              )}

              {/* Campaign type badge */}
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${badge.className}`}>
                {badge.label}
              </span>

              {/* Performance bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
                <div
                  className="h-1.5 bg-blue-500 rounded-full"
                  style={{ width: `${(ad.leads / maxLeads) * 100}%` }}
                />
              </div>

              {/* Ad name */}
              <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-3">{ad.name}</p>

              {/* Metrics 2x2 grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Gasto</span>
                  <p className="font-medium text-gray-700">
                    R$ {ad.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Leads</span>
                  <p className="font-bold text-gray-900">{ad.leads}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">CPL</span>
                  <p className={`font-medium ${getCplColor(cpl)}`}>
                    {cpl > 0
                      ? `R$ ${cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Clicks</span>
                  <p className="font-medium text-gray-700">{ad.clicks}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
