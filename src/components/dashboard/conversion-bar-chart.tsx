"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { conversionData } from "@/data/mock-data";

export function ConversionBarChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Taxas de Conversão</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={conversionData} layout="vertical" margin={{ left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 13, fill: "#475569" }}
            width={120}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Taxa"]}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
