"use client";

interface ConversionBarChartProps {
  data: Array<{ name: string; value: number }>;
}

const COLORS = [
  { bar: "from-blue-400 to-blue-500", badge: "bg-blue-50 text-blue-700" },
  { bar: "from-violet-400 to-violet-500", badge: "bg-violet-50 text-violet-700" },
  { bar: "from-emerald-400 to-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
];

export function ConversionBarChart({ data }: ConversionBarChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">Taxas de Conversão</h3>
        <p className="text-xs text-gray-400 mt-0.5">Eficiência em cada etapa do funil</p>
      </div>

      <div className="space-y-5">
        {data.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          const pct = Math.min(Math.max(item.value, 0), 100);

          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${color.badge}`}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
