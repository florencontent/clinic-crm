"use client";

interface FunnelChartProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Funil de Vendas</h3>
      <div className="flex flex-col items-center gap-1">
        {data.map((item, index) => {
          const widthPercent = Math.max((item.value / maxValue) * 100, 20);
          const isLast = index === data.length - 1;

          return (
            <div key={item.stage} className="w-full flex flex-col items-center">
              <div
                className="relative py-4 text-center text-white font-semibold text-sm transition-all"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.fill,
                  borderRadius: index === 0 ? "12px 12px 0 0" : isLast ? "0 0 12px 12px" : "0",
                  clipPath: isLast
                    ? "polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)"
                    : index === 0
                    ? undefined
                    : "polygon(0% 0%, 100% 0%, 96% 100%, 4% 100%)",
                }}
              >
                <span className="block text-base font-bold">{item.value}</span>
                <span className="block text-xs font-medium opacity-90">{item.stage}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
