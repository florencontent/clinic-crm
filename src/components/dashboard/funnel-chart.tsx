"use client";

interface FunnelChartProps {
  data: Array<{ stage: string; value: number; fill: string }>;
}

export function FunnelChart({ data }: FunnelChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minWidthPct = 35;
  const maxWidthPct = 85;

  const getWidth = (value: number) => {
    const ratio = value / maxValue;
    return minWidthPct + (maxWidthPct - minWidthPct) * ratio;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow duration-200">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Funil de Vendas</h3>
        <p className="text-xs text-gray-400 mt-0.5">Jornada do lead até o fechamento</p>
      </div>

      <div className="flex flex-col items-center gap-0">
        {data.map((item, i) => {
          const widthPct = getWidth(item.value);
          const nextValue = data[i + 1]?.value ?? 0;
          const convPct = item.value > 0 ? Math.round((nextValue / item.value) * 100) : 0;

          return (
            <div key={item.stage} className="w-full flex flex-col items-center">
              {/* Barra da etapa */}
              <div
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(135deg, ${lighten(item.fill, 35)} 0%, ${item.fill} 100%)`,
                  borderRadius: 10,
                  padding: "10px 16px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <p style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.8)",
                  margin: "0 0 4px",
                }}>
                  {item.stage}
                </p>
                <p style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#ffffff",
                  margin: 0,
                  lineHeight: 1,
                  textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}>
                  {item.value}
                </p>
              </div>

              {/* Conversão entre etapas */}
              {i < data.length - 1 && (
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">↓</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {convPct}% avançam
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">↓</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Taxa de conversão total */}
        {data.length >= 2 && (
          <div className="mt-4 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Taxa de conversão total:{" "}
              <span className="text-blue-500 dark:text-blue-400">
                {data[0].value > 0
                  ? `${((data[data.length - 1].value / data[0].value) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function lighten(hex: string, amount = 40): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
