"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import type { Period, StatusFilter } from "@/hooks/use-meta-ads-filters";

interface MetaAdsFiltersProps {
  period: Period;
  onPeriodChange: (p: Period) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hideZeroSpend: boolean;
  onHideZeroSpendChange: (v: boolean) => void;
}

const periodOptions: { value: Period; label: string }[] = [
  { value: "last_7d", label: "7 dias" },
  { value: "last_14d", label: "14 dias" },
  { value: "last_30d", label: "30 dias" },
];

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "paused", label: "Pausadas" },
];

export function MetaAdsFilters({
  period,
  onPeriodChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  hideZeroSpend,
  onHideZeroSpendChange,
}: MetaAdsFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3 flex-wrap">
      {/* Period toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              period === opt.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Status toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusFilterChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              statusFilter === opt.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Buscar campanhas, conjuntos..."
          className="pl-9 h-9 w-64 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Hide zero spend */}
      <label className="flex items-center gap-2 cursor-pointer ml-auto">
        <input
          type="checkbox"
          checked={hideZeroSpend}
          onChange={(e) => onHideZeroSpendChange(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">Ocultar sem gasto</span>
      </label>
    </div>
  );
}
