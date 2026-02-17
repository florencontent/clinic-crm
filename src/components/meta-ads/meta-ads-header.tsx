"use client";

import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MetaAdsHeaderProps {
  lastUpdated: number | null;
  loading: boolean;
  onRefresh: () => void;
}

export function MetaAdsHeader({ lastUpdated, loading, onRefresh }: MetaAdsHeaderProps) {
  const updatedText = lastUpdated
    ? `Atualizado ${formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })}`
    : null;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meta Ads</h1>
        <p className="text-sm text-gray-500 mt-1">Performance da conta de anúncios</p>
      </div>
      <div className="flex items-center gap-3">
        {updatedText && (
          <span className="text-xs text-gray-400">{updatedText}</span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
