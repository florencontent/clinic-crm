"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

const LOSS_REASONS = [
  "Sem contato após follow-up",
  "Orçamento negado",
  "Concorrência venceu",
  "Desistência confirmada",
  "Lead não qualificado",
  "Inviabilidade clínica",
  "Lead duplicado",
  "Outro",
];

interface MarkAsLostModalProps {
  leadName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function MarkAsLostModal({ leadName, onConfirm, onCancel }: MarkAsLostModalProps) {
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");

  const finalReason = reason === "Outro" ? custom.trim() : reason;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-500 p-1.5 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Marcar como Perdido</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Qual o motivo da perda de <span className="font-medium text-gray-900 dark:text-gray-100">{leadName}</span>?
          </p>

          <div className="space-y-2">
            {LOSS_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-red-500"
                />
                <span className={`text-sm transition-colors ${reason === r ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"}`}>
                  {r}
                </span>
              </label>
            ))}
          </div>

          {reason === "Outro" && (
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Descreva o motivo..."
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-red-400 transition-colors placeholder-gray-400"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => finalReason && onConfirm(finalReason)}
            disabled={!finalReason}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
