"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/lib/theme-context";

type SourceData = Array<{ name: string; value: number; fill: string }>;

interface SourcePieChartProps {
  data: SourceData;
  dataAgendamentos: SourceData;
  dataVendas: SourceData;
}

type Tab = "leads" | "agendamentos" | "vendas";

const tabs: { key: Tab; label: string }[] = [
  { key: "leads", label: "Leads" },
  { key: "agendamentos", label: "Agendamentos" },
  { key: "vendas", label: "Vendas" },
];

const tooltipLabel: Record<Tab, string> = {
  leads: "leads",
  agendamentos: "agendamentos",
  vendas: "vendas",
};

export function SourcePieChart({ data, dataAgendamentos, dataVendas }: SourcePieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<Tab>("leads");

  const activeData = activeTab === "leads" ? data : activeTab === "agendamentos" ? dataAgendamentos : dataVendas;
  const total = activeData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow duration-200"
      style={{
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#374151" : "#f3f4f6",
      }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Origem</h3>
        <p className="text-xs text-gray-400 mt-0.5">Canais de captação</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.key ? (isDark ? "#374151" : "#ffffff") : "transparent",
              color: activeTab === tab.key
                ? isDark ? "#f1f5f9" : "#111827"
                : isDark ? "#9ca3af" : "#6b7280",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-gray-400">Nenhum dado disponível</p>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {activeData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    fontSize: "13px",
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    color: isDark ? "#f1f5f9" : "#111827",
                  }}
                  formatter={(value) => [`${value} ${tooltipLabel[activeTab]}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-1">
            {activeData.map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="group flex items-center justify-between px-2 py-1.5 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 cursor-default">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-150" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-150">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{pct}%</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-6 text-right">{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
