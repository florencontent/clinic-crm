"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { createPatient } from "@/lib/api";
import { Lead } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface NewLeadModalProps {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

const SOURCE_OPTIONS = [
  { value: "indicacao", label: "Indicação" },
  { value: "site", label: "Site" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "organico", label: "Orgânico" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all";

export function NewLeadModal({ onClose, onCreated }: NewLeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [procedure, setProcedure] = useState("");
  const [source, setSource] = useState<"site" | "meta_ads" | "indicacao" | "organico">("indicacao");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!phone.trim()) { setError("Telefone é obrigatório."); return; }
    setError("");
    setSaving(true);
    const lead = await createPatient({ name: name.trim(), phone: phone.trim(), procedure: procedure.trim(), source });
    setSaving(false);
    if (!lead) { setError("Erro ao criar lead. Tente novamente."); return; }
    onCreated(lead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Novo Lead</h3>
              <p className="text-blue-100 text-xs mt-0.5">Cadastrar lead manualmente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Nome completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Telefone / WhatsApp *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999999999"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Interesse / Procedimento
            </label>
            <input
              type="text"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="Ex: Implante, Botox, Harmonização..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              Origem
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSource(opt.value as typeof source)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    source === opt.value
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200 dark:shadow-blue-900/50 transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {saving ? "Salvando..." : "Criar Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
