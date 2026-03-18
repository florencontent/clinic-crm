"use client";

interface FunnelChartProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

const STAGE_ICONS = ["👥", "📅", "🏥", "✅"];

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;
  const total = maxValue;

  // Funnel dimensions
  const svgWidth = 320;
  const svgHeight = 260;
  const topPad = 10;
  const stageHeight = (svgHeight - topPad) / data.length;
  const maxHalfWidth = svgWidth * 0.47;
  const minHalfWidth = svgWidth * 0.08;

  const getHalfWidth = (value: number) => {
    const ratio = total > 0 ? value / total : 0;
    return minHalfWidth + (maxHalfWidth - minHalfWidth) * ratio;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">Funil de Vendas</h3>
        <p className="text-xs text-gray-400 mt-0.5">Jornada do lead até o fechamento</p>
      </div>

      <div className="flex items-center gap-6">
        {/* SVG Funnel */}
        <div className="flex-shrink-0">
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <defs>
              {data.map((item, i) => (
                <linearGradient key={i} id={`fg-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={item.fill} stopOpacity="0.75" />
                  <stop offset="50%" stopColor={item.fill} stopOpacity="1" />
                  <stop offset="100%" stopColor={item.fill} stopOpacity="0.75" />
                </linearGradient>
              ))}
            </defs>

            {data.map((item, i) => {
              const topHW = getHalfWidth(item.value);
              const botHW = i < data.length - 1 ? getHalfWidth(data[i + 1].value) : topHW * 0.72;
              const y = topPad + i * stageHeight;
              const cx = svgWidth / 2;
              const gap = 3;

              const points = [
                `${cx - topHW},${y + gap / 2}`,
                `${cx + topHW},${y + gap / 2}`,
                `${cx + botHW},${y + stageHeight - gap / 2}`,
                `${cx - botHW},${y + stageHeight - gap / 2}`,
              ].join(" ");

              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <g key={i}>
                  <polygon
                    points={points}
                    fill={`url(#fg-${i})`}
                    rx="4"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
                  />
                  {/* Center label */}
                  <text
                    x={cx}
                    y={y + stageHeight / 2 - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="13"
                    fontWeight="700"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                  >
                    {item.value}
                  </text>
                  <text
                    x={cx}
                    y={y + stageHeight / 2 + 11}
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
        <div className="flex-1 space-y-3">
          {data.map((item, i) => {
            const prevValue = i > 0 ? data[i - 1].value : item.value;
            const dropRate = i > 0 && prevValue > 0
              ? Math.round((item.value / prevValue) * 100)
              : 100;

            return (
              <div key={item.stage} className="flex items-center gap-3">
                <span className="text-lg">{STAGE_ICONS[i]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 truncate">{item.stage}</span>
                    <span className="text-sm font-bold text-gray-900 ml-2">{item.value}</span>
                  </div>
                  {i > 0 && (
                    <span className="text-[10px] text-gray-400">{dropRate}% do estágio anterior</span>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
