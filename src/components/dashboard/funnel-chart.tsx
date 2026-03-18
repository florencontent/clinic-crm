"use client";

interface FunnelChartProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

const STAGE_ICONS = ["👥", "📅", "🏥", "✅"];

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">Funil de Vendas</h3>
        <p className="text-xs text-gray-400 mt-0.5">Jornada do lead até o fechamento</p>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const widthPercent = Math.max((item.value / maxValue) * 100, 8);
          const prevValue = index > 0 ? data[index - 1].value : item.value;
          const dropRate = index > 0 && prevValue > 0
            ? Math.round((item.value / prevValue) * 100)
            : 100;

          return (
            <div key={item.stage}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{STAGE_ICONS[index]}</span>
                  <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                </div>
                <div className="flex items-center gap-3">
                  {index > 0 && (
                    <span className="text-xs text-gray-400">
                      {dropRate}% do anterior
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
              <div className="h-9 bg-gray-100 rounded-xl overflow-hidden">
                <div
                  className="h-full rounded-xl flex items-center px-3 transition-all duration-500"
                  style={{ width: `${widthPercent}%`, backgroundColor: item.fill }}
                >
                  {widthPercent > 20 && (
                    <span className="text-white text-xs font-semibold">
                      {Math.round((item.value / maxValue) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
