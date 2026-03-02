"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MetaAdSet, MetaCampaign } from "@/data/mock-data";

interface AdsetsBarChartProps {
  adsets: MetaAdSet[];
  campaigns: MetaCampaign[];
}

function filterAdsetsByCampaignPattern(
  adsets: MetaAdSet[],
  campaignMap: Map<string, MetaCampaign>,
  pattern: RegExp
) {
  return adsets.filter((s) => {
    const camp = campaignMap.get(s.campaignId);
    return camp && pattern.test(camp.name) && s.spend > 0;
  });
}

export function AdsetsBarChart({ adsets, campaigns }: AdsetsBarChartProps) {
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  const ccWhatsapp = filterAdsetsByCampaignPattern(adsets, campaignMap, /^CC\s.*whatsapp/i);
  const ccFormulario = filterAdsetsByCampaignPattern(adsets, campaignMap, /^CC\s.*formul[aá]rio/i);
  const ccLandingPage = filterAdsetsByCampaignPattern(adsets, campaignMap, /^CC\s.*landing\s*page/i);
  const isca = filterAdsetsByCampaignPattern(adsets, campaignMap, /^ISCA\s/i);
  const venda = filterAdsetsByCampaignPattern(adsets, campaignMap, /^VENDA\s/i);

  return (
    <div className="space-y-6">
      <AudienceChart
        title="Públicos Consultoria WhatsApp"
        adsets={ccWhatsapp}
        secondMetricKey="leads"
        secondMetricLabel="Leads"
      />
      <AudienceChart
        title="Públicos Consultoria Formulário"
        adsets={ccFormulario}
        secondMetricKey="leads"
        secondMetricLabel="Leads"
      />
      <AudienceChart
        title="Públicos Consultoria Landing Page"
        adsets={ccLandingPage}
        secondMetricKey="leads"
        secondMetricLabel="Leads"
      />
      <AudienceChart
        title="Públicos Isca"
        adsets={isca}
        secondMetricKey="leads"
        secondMetricLabel="Leads"
      />
      <AudienceChart
        title="Públicos Low Price"
        adsets={venda}
        secondMetricKey="leads"
        secondMetricLabel="Vendas"
      />
    </div>
  );
}

interface AudienceChartProps {
  title: string;
  adsets: MetaAdSet[];
  secondMetricKey: string;
  secondMetricLabel: string;
}

function CustomTooltip({ active, payload, label, secondMetricLabel }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; dataKey: string }>; label?: string; secondMetricLabel: string }) {
  if (!active || !payload?.length) return null;

  const gasto = payload.find((p) => p.dataKey === "gasto")?.value || 0;
  const resultado = payload.find((p) => p.dataKey === "resultado")?.value || 0;
  const cpl = resultado > 0 ? gasto / resultado : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[180px]">
      <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6366F1" }} />
        <span className="text-gray-500">Gasto:</span>
        <span className="font-medium text-gray-900">
          R$ {gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22C55E" }} />
        <span className="text-gray-500">{secondMetricLabel}:</span>
        <span className="font-medium text-gray-900">{resultado}</span>
      </div>
      {resultado > 0 && (
        <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-gray-100">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-gray-500">CPL:</span>
          <span className="font-medium text-gray-900">
            R$ {cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

function AudienceChart({ title, adsets, secondMetricLabel }: AudienceChartProps) {
  // Agrupar adsets pelo nome do público, somando métricas
  const grouped = new Map<string, { spend: number; leads: number }>();
  for (const s of adsets) {
    const existing = grouped.get(s.name);
    if (existing) {
      existing.spend += s.spend;
      existing.leads += s.leads;
    } else {
      grouped.set(s.name, { spend: s.spend, leads: s.leads });
    }
  }

  const data = [...grouped.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, 10)
    .map(([name, metrics]) => ({
      name: name.length > 20 ? name.slice(0, 20) + "…" : name,
      gasto: metrics.spend,
      resultado: metrics.leads,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-8">Nenhum público com gasto neste período</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#475569" }}
            width={160}
          />
          <Tooltip content={<CustomTooltip secondMetricLabel={secondMetricLabel} />} />
          <Legend />
          <Bar dataKey="gasto" name="Gasto" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={16} />
          <Bar dataKey="resultado" name={secondMetricLabel} fill="#22C55E" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
