"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SourcePieChartProps {
  data: Array<{ name: string; value: number; fill: string }>;
}

export function SourcePieChart({ data }: SourcePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">Origem dos Leads</h3>
          <p className="text-xs text-gray-400 mt-0.5">Canais de captação</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-gray-400">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900">Origem dos Leads</h3>
        <p className="text-xs text-gray-400 mt-0.5">Canais de captação</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-shrink-0 w-44 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "13px" }}
                formatter={(value) => [`${value} leads`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: item.fill }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct}%</span>
                  <span className="text-xs text-gray-400 w-6 text-right">{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
