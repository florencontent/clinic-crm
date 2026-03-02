"use client";

import { useMemo, useState } from "react";
import type { MetaCampaign } from "@/data/mock-data";

interface LeadsByOriginChartProps {
  campaigns: MetaCampaign[];
}

const CATEGORIES = [
  { label: "Lead WhatsApp", pattern: /^CC\s.*whatsapp/i, color: "#22C55E", bg: "bg-green-500" },
  { label: "Lead Formulário", pattern: /^CC\s.*formul[aá]rio/i, color: "#3B82F6", bg: "bg-blue-500" },
  { label: "Lead Landing Page", pattern: /^CC\s.*landing\s*page/i, color: "#EC4899", bg: "bg-pink-500" },
  { label: "Lead Isca", pattern: /^ISCA\s/i, color: "#F59E0B", bg: "bg-amber-500" },
  { label: "Venda Low Price", pattern: /^VENDA\s/i, color: "#8B5CF6", bg: "bg-purple-500" },
];

export function LeadsByOriginChart({ campaigns }: LeadsByOriginChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const withSpend = campaigns.filter((c) => c.spend > 0);

    return CATEGORIES.map((cat) => {
      const matching = withSpend.filter((c) => cat.pattern.test(c.name));
      const value = matching.reduce((sum, c) => sum + c.leads, 0);
      const spend = matching.reduce((sum, c) => sum + c.spend, 0);
      const cpl = value > 0 ? spend / value : 0;
      return { ...cat, value, spend, cpl };
    });
  }, [campaigns]);

  const total = data.reduce((s, d) => s + d.value, 0);

  // Calculate percentages and angles for the donut
  const segments = useMemo(() => {
    if (total === 0) return [];
    let cumulative = 0;
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const pct = (d.value / total) * 100;
        const start = cumulative;
        cumulative += pct;
        return { ...d, pct, start, end: cumulative, spend: d.spend, cpl: d.cpl };
      });
  }, [data, total]);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Leads por Origem</h3>
        <p className="text-sm text-gray-400 text-center py-8">Sem dados no período</p>
      </div>
    );
  }

  // Build conic gradient
  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Leads por Origem</h3>

      <div className="flex items-center justify-center gap-8">
        {/* Donut chart via CSS conic-gradient */}
        <div
          className="relative w-52 h-52 rounded-full flex-shrink-0"
          style={{ background: `conic-gradient(${gradientStops})` }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Invisible SVG overlay for hover detection per segment */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {segments.map((seg, i) => {
              const startAngle = (seg.start / 100) * 360 - 90;
              const endAngle = (seg.end / 100) * 360 - 90;
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
              return (
                <path
                  key={seg.label}
                  d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-gray-900">{total}</span>
              <span className="text-xs text-gray-400">total</span>
            </div>
          </div>

          {/* Tooltip on hover */}
          {hoveredIndex !== null && segments[hoveredIndex] && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[180px] z-10 pointer-events-none">
              <p className="text-sm font-bold text-gray-900 mb-2">{segments[hoveredIndex].label}</p>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: segments[hoveredIndex].color }} />
                <span className="text-gray-500">Leads:</span>
                <span className="font-medium text-gray-900">{segments[hoveredIndex].value}</span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6366F1" }} />
                <span className="text-gray-500">Gasto:</span>
                <span className="font-medium text-gray-900">
                  R$ {segments[hoveredIndex].spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {segments[hoveredIndex].value > 0 && (
                <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-gray-500">CPL:</span>
                  <span className="font-medium text-gray-900">
                    R$ {segments[hoveredIndex].cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.filter((d) => d.value > 0).map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={d.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${d.bg}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.value} <span className="text-gray-400 font-normal">({pct}%)</span></p>
                  <p className="text-xs text-gray-500">{d.label}</p>
                  <p className="text-xs text-gray-400">
                    R$ {d.spend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {d.value > 0 && <> · CPL R$ {d.cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
