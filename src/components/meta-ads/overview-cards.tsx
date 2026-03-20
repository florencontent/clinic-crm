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
  const cardClass = "bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow duration-200";
  const labelClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide";
  const subClass = "text-xs text-gray-400 dark:text-gray-500 mt-1";
  const valClass = "text-2xl font-bold text-gray-900 dark:text-gray-100";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Investimento */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>Investimento</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <p className={valClass}>R$ {fmt(metrics.totalSpend)}</p>
        <p className={subClass}>{activeCampaigns} campanhas ativas</p>
      </div>

      {/* Leads */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>Leads</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <p className={valClass}>{metrics.totalLeads}</p>
        <p className={subClass}>total no período</p>
      </div>

      {/* CPL médio */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>CPL Médio</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-purple-500" />
          </div>
        </div>
        <p className={`text-2xl font-bold ${cplColor(metrics.cpl)}`}>
          {metrics.cpl > 0 ? `R$ ${fmt(metrics.cpl)}` : "—"}
        </p>
        <p className={subClass}>custo por lead</p>
      </div>

      {/* Impressões */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>Impressões</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
            <Eye className="w-4 h-4 text-sky-500" />
          </div>
        </div>
        <p className={valClass}>
          {metrics.reach >= 1000 ? `${(metrics.reach / 1000).toFixed(1)}k` : metrics.reach}
        </p>
        <p className={subClass}>total no período</p>
      </div>

      {/* CPM */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>CPM</span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-violet-500" />
          </div>
        </div>
        <p className={valClass}>{cpm > 0 ? `R$ ${fmt(cpm)}` : "—"}</p>
        <p className={subClass}>custo por mil impressões</p>
      </div>

      {/* CPC */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <span className={labelClass}>CPC</span>
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
            <MousePointer className="w-4 h-4 text-orange-500" />
          </div>
        </div>
        <p className={valClass}>{metrics.cpc > 0 ? `R$ ${fmt(metrics.cpc)}` : "—"}</p>
        <p className={subClass}>custo por clique</p>
      </div>
    </div>
  );
}
