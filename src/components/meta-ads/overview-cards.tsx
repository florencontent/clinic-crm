"use client";

import { DollarSign, Users, TrendingDown, MousePointer, Eye, BarChart2 } from "lucide-react";

interface OverviewCardsProps {
  metrics: {
    totalSpend: number;
    totalLeads: number;
    cpl: number;
    cpc: number;
    ctr: number;
    reach: number;
    cpm?: number;
  };
  activeCampaigns: number;
}

function fmt(val: number | undefined | null) {
  return (val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cplColor(cpl: number) {
  if (cpl === 0) return "text-gray-400";
  if (cpl < 30) return "text-emerald-600";
  if (cpl < 50) return "text-amber-500";
  return "text-red-500";
}

export function OverviewCards({ metrics, activeCampaigns }: OverviewCardsProps) {
  const cpm = metrics.reach > 0 ? (metrics.totalSpend / metrics.reach) * 1000 : 0;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Investimento */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Investimento</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">R$ {fmt(metrics.totalSpend)}</p>
        <p className="text-xs text-gray-400 mt-1">{activeCampaigns} campanhas ativas</p>
      </div>

      {/* Leads */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Leads</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
        <p className="text-xs text-gray-400 mt-1">total no período</p>
      </div>

      {/* CPL médio */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CPL Médio</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-purple-500" />
          </div>
        </div>
        <p className={`text-2xl font-bold ${cplColor(metrics.cpl)}`}>
          {metrics.cpl > 0 ? `R$ ${fmt(metrics.cpl)}` : "—"}
        </p>
        <p className="text-xs text-gray-400 mt-1">custo por lead</p>
      </div>

      {/* Impressões */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Impressões</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {metrics.reach >= 1000 ? `${(metrics.reach / 1000).toFixed(1)}k` : metrics.reach}
        </p>
        <p className="text-xs text-gray-400 mt-1">total no período</p>
      </div>

      {/* CPM */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CPM</span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-violet-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {cpm > 0 ? `R$ ${fmt(cpm)}` : "—"}
        </p>
        <p className="text-xs text-gray-400 mt-1">custo por mil impressões</p>
      </div>

      {/* CPC */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CPC</span>
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <MousePointer className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {metrics.cpc > 0 ? `R$ ${fmt(metrics.cpc)}` : "—"}
        </p>
        <p className="text-xs text-gray-400 mt-1">custo por clique</p>
      </div>
    </div>
  );
}
