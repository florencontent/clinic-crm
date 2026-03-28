"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/lib/theme-context";

interface FunnelFlowProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

export function FunnelFlowChart({ data }: FunnelFlowProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!data || data.length === 0) return null;

  const total = data[0]?.value || 1;

  // ── SVG funnel ──
  const W = 520;
  const H = 160;
  const cy = H / 2;
  const maxH = H * 0.88;
  const minH = H * 0.10;
  const stages = data.length;
  const xs = data.map((_, i) => (i / (stages - 1)) * W);

  const getH = (v: number) => minH + ((v / total) * (maxH - minH));

  // Build smooth path using cubic bezier
  function smoothPath(pts: Array<{ x: number; y: number }>) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cx1 = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.5;
      const cy1 = pts[i].y;
      const cx2 = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.5;
      const cy2 = pts[i + 1].y;
      d += ` C ${cx1} ${cy1} ${cx2} ${cy2} ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return d;
  }

  const topPts = data.map((d, i) => ({ x: xs[i], y: cy - getH(d.value) / 2 }));
  const botPts = data.map((d, i) => ({ x: xs[i], y: cy + getH(d.value) / 2 }));

  const topPath = smoothPath(topPts);
  const botPathReversed = smoothPath([...botPts].reverse());

  // Build the closed area path
  const areaPath = `${topPath} L ${botPts[botPts.length - 1].x} ${botPts[botPts.length - 1].y} ${botPathReversed.replace(/^M [^ ]+ [^ ]+/, "")} Z`;

  // Vertical dividers
  const dividers = data.slice(1, -1).map((d, i) => {
    const idx = i + 1;
    const h = getH(d.value);
    return { x: xs[idx], y1: cy - h / 2, y2: cy + h / 2 };
  });

  const bgColor = isDark ? "#1f2937" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#f3f4f6";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textMuted = isDark ? "#6b7280" : "#9ca3af";
  const dividerColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow duration-200"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold" style={{ color: textPrimary }}>Funil de Conversão</h3>
        <p className="text-xs mt-0.5" style={{ color: textMuted }}>Jornada do lead até o fechamento</p>
      </div>

      <div className="flex gap-6 items-center">
        {/* Funnel SVG + labels */}
        <div className="flex-1 min-w-0">
          {/* Stage headers */}
          <div className="flex mb-3" style={{ paddingLeft: 0 }}>
            {data.map((d, i) => {
              const pct = i === 0 ? 100 : Math.round((d.value / total) * 100);
              return (
                <div
                  key={d.stage}
                  className="flex-1 text-center"
                  style={{ minWidth: 0 }}
                >
                  <p className="text-lg font-bold leading-tight" style={{ color: d.fill }}>
                    {d.value}
                    {i > 0 && (
                      <span className="text-xs font-medium ml-1" style={{ color: textMuted }}>
                        {pct}%
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>{d.stage}</p>
                </div>
              );
            })}
          </div>

          {/* SVG */}
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ display: "block", height: 120 }}
          >
            <defs>
              <linearGradient id="fflow-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#1D4ED8" stopOpacity="0.95" />
                <stop offset="20%"  stopColor="#9333EA" stopOpacity="0.95" />
                <stop offset="50%"  stopColor="#3B82F6" stopOpacity="0.95" />
                <stop offset="75%"  stopColor="#4C1D95" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#22C55E" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#fflow-grad)" />
            {dividers.map((d, i) => (
              <line
                key={i}
                x1={d.x} y1={d.y1}
                x2={d.x} y2={d.y2}
                stroke={dividerColor}
                strokeWidth="1.5"
              />
            ))}
          </svg>

        </div>

        {/* Donut chart */}
        <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 180 }}>
          <div style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: isDark ? "1px solid #374151" : "none",
                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.6)" : "0 4px 16px rgba(0,0,0,0.15)",
                    fontSize: 12,
                    backgroundColor: isDark ? "#111827" : "#ffffff",
                    color: textPrimary,
                  }}
                  labelStyle={{ color: textPrimary, fontWeight: 600 }}
                  itemStyle={{ color: textPrimary }}
                  formatter={(v: number | undefined) => [v ?? 0, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 w-full mt-1">
            {data.map((d) => {
              const pct = Math.round((d.value / total) * 100);
              return (
                <div key={d.stage} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="flex-1" style={{ color: textMuted }}>{d.stage}</span>
                  <span className="font-semibold tabular-nums" style={{ color: textPrimary }}>{d.value}</span>
                  <span className="tabular-nums w-9 text-right" style={{ color: textMuted }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
