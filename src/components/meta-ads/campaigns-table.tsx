"use client";

import { useState, useMemo, Fragment } from "react";
import { ArrowUp, ArrowDown, ChevronRight, ChevronDown, Search } from "lucide-react";
import type { MetaCampaign, MetaAdSet } from "@/data/mock-data";

type SortColumn = "name" | "status" | "spend" | "leads" | "cpl" | "ctr";
type SortDirection = "asc" | "desc";

interface CampaignsTableProps {
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
}

export function CampaignsTable({ campaigns, adsets }: CampaignsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("spend");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(10);
  const [tableSearch, setTableSearch] = useState("");

  const filtered = useMemo(() => {
    if (!tableSearch.trim()) return campaigns;
    const q = tableSearch.toLowerCase();
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, tableSearch]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "spend": cmp = a.spend - b.spend; break;
        case "leads": cmp = a.leads - b.leads; break;
        case "cpl": cmp = a.cpl - b.cpl; break;
        case "ctr": cmp = a.ctr - b.ctr; break;
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [campaigns, sortColumn, sortDirection]);

  const visible = sorted.slice(0, visibleCount);

  const maxSpend = useMemo(() => Math.max(...filtered.map((c) => c.spend), 1), [filtered]);
  const avgCpl = useMemo(() => {
    const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
    const totalLeads = filtered.reduce((s, c) => s + c.leads, 0);
    return totalLeads > 0 ? totalSpend / totalLeads : 0;
  }, [campaigns]);

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function SortHeader({ col, children, align }: { col: SortColumn; children: React.ReactNode; align?: string }) {
    const active = sortColumn === col;
    const Icon = sortDirection === "desc" ? ArrowDown : ArrowUp;
    return (
      <th
        onClick={() => handleSort(col)}
        className={`py-3 px-2 font-medium cursor-pointer select-none hover:text-gray-700 transition-colors ${
          align === "right" ? "text-right" : "text-left"
        } ${active ? "text-gray-900 font-semibold" : "text-gray-500"}`}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active && <Icon className="h-3 w-3" />}
        </span>
      </th>
    );
  }

  function getCplColor(cpl: number) {
    if (cpl <= 0 || avgCpl <= 0) return "text-gray-700";
    if (cpl < avgCpl) return "text-green-600";
    if (cpl > avgCpl * 1.5) return "text-red-600";
    return "text-gray-700";
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-gray-900">
            Ranking de Campanhas
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => { setTableSearch(e.target.value); setVisibleCount(10); }}
              placeholder="Filtrar por nome..."
              className="pl-8 h-8 w-52 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">{sorted.length} campanhas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-8" />
              <SortHeader col="name">Campanha</SortHeader>
              <SortHeader col="status">Status</SortHeader>
              <SortHeader col="spend" align="right">Gasto</SortHeader>
              <SortHeader col="leads" align="right">Leads</SortHeader>
              <SortHeader col="cpl" align="right">CPL</SortHeader>
              <SortHeader col="ctr" align="right">CTR</SortHeader>
              <th className="py-3 px-2 text-right text-gray-500 font-medium">Performance</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((campaign) => {
              const isExpanded = expandedRows.has(campaign.id);
              const childAdsets = adsets.filter((s) => s.campaignId === campaign.id);

              return (
                <Fragment key={campaign.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-1">
                      {childAdsets.length > 0 && (
                        <button onClick={() => toggleExpand(campaign.id)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-gray-400" />
                            : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900 max-w-[250px] truncate">{campaign.name}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {campaign.status === "ACTIVE" ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700">
                      R$ {campaign.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-900">{campaign.leads}</td>
                    <td className={`py-3 px-2 text-right ${getCplColor(campaign.cpl)}`}>
                      R$ {campaign.cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700">{campaign.ctr.toFixed(2)}%</td>
                    <td className="py-3 px-2 text-right">
                      <div className="w-20 h-2 bg-gray-100 rounded-full ml-auto">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${(campaign.spend / maxSpend) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                  {isExpanded && childAdsets.map((adset) => (
                    <tr key={adset.id} className="bg-gray-50/50 border-b border-gray-50">
                      <td />
                      <td className="py-2.5 px-2 pl-8 text-gray-600 text-xs border-l-2 border-blue-200">
                        {adset.name}
                      </td>
                      <td />
                      <td className="py-2.5 px-2 text-right text-gray-500 text-xs">
                        R$ {adset.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-700 text-xs font-medium">{adset.leads}</td>
                      <td className="py-2.5 px-2 text-right text-gray-500 text-xs">
                        {adset.leads > 0
                          ? `R$ ${(adset.spend / adset.leads).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right text-gray-500 text-xs">{adset.clicks}</td>
                      <td />
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > visibleCount && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Mostrando {visibleCount} de {sorted.length}
          </span>
          <button
            onClick={() => setVisibleCount((v) => v + 10)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ver mais
          </button>
        </div>
      )}
    </div>
  );
}

