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

function AudienceChart({ title, adsets, secondMetricLabel }: AudienceChartProps) {
  const data = [...adsets]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .map((s) => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      gasto: s.spend,
      resultado: s.leads,
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
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "Gasto") return [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Gasto"];
              return [value, secondMetricLabel];
            }}
          />
          <Legend />
          <Bar dataKey="gasto" name="Gasto" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={16} />
          <Bar dataKey="resultado" name={secondMetricLabel} fill="#22C55E" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
