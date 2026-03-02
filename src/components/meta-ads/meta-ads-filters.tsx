"use client";

import type { Period } from "@/hooks/use-meta-ads-filters";

interface MetaAdsFiltersProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const periodOptions: { value: Period; label: string }[] = [
  { value: "last_7d", label: "7 dias" },
  { value: "last_14d", label: "14 dias" },
  { value: "last_30d", label: "30 dias" },
];

export function MetaAdsFilters({ period, onPeriodChange }: MetaAdsFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {periodOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onPeriodChange(opt.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            period === opt.value
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
              : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
