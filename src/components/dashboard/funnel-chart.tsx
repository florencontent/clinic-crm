"use client";

interface FunnelChartProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

// Lighter shade for gradient highlight
function lighten(hex: string, amount = 40): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  const svgWidth = 280;
  const sliceH = 52;
  const gap = 6;
  const svgHeight = data.length * sliceH + (data.length - 1) * gap;
  const maxHalfWidth = svgWidth * 0.46;
  const minHalfWidth = svgWidth * 0.14;
  const cx = svgWidth / 2;
  const r = 8; // corner radius

  const getHalfWidth = (value: number) => {
    const ratio = maxValue > 0 ? value / maxValue : 0;
    return minHalfWidth + (maxHalfWidth - minHalfWidth) * ratio;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900">Funil de Vendas</h3>
        <p className="text-xs text-gray-400 mt-0.5">Jornada do lead até o fechamento</p>
      </div>

      <div className="flex items-center gap-8">
        {/* SVG Funnel */}
        <div className="flex-shrink-0">
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              {data.map((item, i) => (
                <linearGradient key={i} id={`fg-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lighten(item.fill, 30)} stopOpacity="1" />
                  <stop offset="100%" stopColor={item.fill} stopOpacity="1" />
                </linearGradient>
              ))}
              <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.10)" />
              </filter>
            </defs>

            {data.map((item, i) => {
              const hw = getHalfWidth(item.value);
              const nextHw = i < data.length - 1 ? getHalfWidth(data[i + 1].value) : hw * 0.78;
              const y = i * (sliceH + gap);

              // Rounded trapezoid via path
              // Top edge: from (cx-hw, y) to (cx+hw, y) with rounded top corners
              // Bottom edge: from (cx+nextHw, y+sliceH) to (cx-nextHw, y+sliceH) with rounded bottom corners
              const tl = { x: cx - hw, y };
              const tr = { x: cx + hw, y };
              const br = { x: cx + nextHw, y: y + sliceH };
              const bl = { x: cx - nextHw, y: y + sliceH };

              // Clamp radius so it doesn't exceed half the side lengths
              const topW = hw * 2;
              const botW = nextHw * 2;
              const rc = Math.min(r, topW / 2, botW / 2, sliceH / 2);

              const path = [
                `M ${tl.x + rc} ${tl.y}`,
                `L ${tr.x - rc} ${tr.y}`,
                `Q ${tr.x} ${tr.y} ${tr.x - (tr.x - br.x) * (rc / sliceH)} ${tr.y + rc}`,
                `L ${br.x + (tr.x - br.x) * (rc / sliceH)} ${br.y - rc}`,
                `Q ${br.x} ${br.y} ${br.x - rc} ${br.y}`,
                `L ${bl.x + rc} ${bl.y}`,
                `Q ${bl.x} ${bl.y} ${bl.x + (tl.x - bl.x) * (rc / sliceH)} ${bl.y - rc}`,
                `L ${tl.x - (tl.x - bl.x) * (rc / sliceH)} ${tl.y + rc}`,
                `Q ${tl.x} ${tl.y} ${tl.x + rc} ${tl.y}`,
                `Z`,
              ].join(" ");

              const pct = maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;
              const midY = y + sliceH / 2;

              return (
                <g key={i} filter="url(#shadow)">
                  <path d={path} fill={`url(#fg-${i})`} />
                  <text
                    x={cx}
                    y={midY - 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="700"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
                  >
                    {item.value}
                  </text>
                  <text
                    x={cx}
                    y={midY + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="500"
                    opacity="0.85"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-4">
          {data.map((item, i) => (
            <div key={item.stage} className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs font-medium text-gray-600 flex-1">{item.stage}</span>
              <span className="text-sm font-bold text-gray-900 tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
