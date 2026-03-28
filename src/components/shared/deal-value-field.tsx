"use client";

import { useState, useRef } from "react";
import { DollarSign } from "lucide-react";
import { updatePatient } from "@/lib/api";
import { Lead } from "@/data/mock-data";

interface DealValueFieldProps {
  lead: Lead;
  onUpdate?: (updated: Lead) => void;
  size?: "sm" | "md";
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function DealValueField({ lead, onUpdate, size = "sm" }: DealValueFieldProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setInputValue(lead.dealValue ? String(lead.dealValue) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const parsed = parseFloat(inputValue.replace(/\D/g, ""));
    const newValue = isNaN(parsed) ? null : parsed;
    setEditing(false);
    setSaving(true);
    await updatePatient(lead.id, { dealValue: newValue });
    setSaving(false);
    onUpdate?.({ ...lead, dealValue: newValue ?? undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  };

  if (size === "md") {
    return (
      <div className="flex items-start gap-3">
        <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg flex-shrink-0 mt-1">
          <DollarSign className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Ticket</p>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              placeholder="Ex: 4500"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          ) : (
            <button
              onClick={handleStartEdit}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
            >
              {saving ? "Salvando..." : lead.dealValue ? formatBRL(lead.dealValue) : <span className="text-gray-400 font-normal text-xs">Clique para informar</span>}
            </button>
          )}
        </div>
      </div>
    );
  }

  // size === "sm" (sidebar)
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Ticket</p>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="Ex: 4500"
          className="w-full px-2 py-1.5 text-xs rounded-lg border border-blue-400 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none transition-colors"
        />
      ) : (
        <button
          onClick={handleStartEdit}
          className="w-full text-left px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 transition-colors"
        >
          {saving ? "Salvando..." : lead.dealValue ? formatBRL(lead.dealValue) : <span className="text-gray-400">Clique para informar...</span>}
        </button>
      )}
    </div>
  );
}
