"use client";

import { useState } from "react";
import { useTagOptions } from "@/hooks/use-tag-options";
import { X, Plus } from "lucide-react";
import { Lead, LeadStatus, LeadSource, Tag, TagType, statusLabels } from "@/data/mock-data";
import { updatePatient } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EditLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (lead: Lead) => void;
}

const tagTypeLabels: Record<TagType, string> = {
  especialidade: "Especialidade",
  doutor: "Doutor",
  observacao: "Observação",
};

const tagTypeColors: Record<TagType, string> = {
  especialidade: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  doutor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  observacao: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export function EditLeadModal({ lead, onClose, onSave }: EditLeadModalProps) {
  const { especialidades: ESPECIALIDADES, doutores: DOUTORES } = useTagOptions();
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState(lead.email || "");
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [source, setSource] = useState<LeadSource>(lead.source);
  const [tags, setTags] = useState<Tag[]>(lead.tags || []);
  const [saving, setSaving] = useState(false);

  // For adding new tags
  const [newEspecialidade, setNewEspecialidade] = useState("");
  const [customEspecialidade, setCustomEspecialidade] = useState("");
  const [newDoutor, setNewDoutor] = useState("");
  const [newObs, setNewObs] = useState("");

  const addTag = (type: TagType, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.type === type && t.value === trimmed)) return;
    setTags((prev) => [...prev, { type, value: trimmed }]);
  };

  const removeTag = (type: TagType, value: string) => {
    setTags((prev) => prev.filter((t) => !(t.type === type && t.value === value)));
  };

  const handleAddEspecialidade = () => {
    const val = newEspecialidade === "__custom__" ? customEspecialidade : newEspecialidade;
    addTag("especialidade", val);
    setNewEspecialidade("");
    setCustomEspecialidade("");
  };

  const handleAddDoutor = () => {
    addTag("doutor", newDoutor);
    setNewDoutor("");
  };

  const handleAddObs = () => {
    addTag("observacao", newObs);
    setNewObs("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const updated = await updatePatient(lead.id, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      source,
      status,
      tags,
    });
    setSaving(false);
    if (updated) {
      onSave(updated);
    } else {
      // Fallback: optimistic update
      onSave({ ...lead, name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, source, status, tags });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Editar Lead</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            >
              {(["em_contato", "agendado", "compareceu", "fechado"] as LeadStatus[]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>

          {/* Origem */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Origem</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors"
            >
              {(["Site", "Meta Ads", "Orgânico", "Indicação"] as LeadSource[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</label>
            <div className="space-y-3">

              {/* Especialidade */}
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Especialidade</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.filter((t) => t.type === "especialidade").map((t) => (
                    <span key={t.value} className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", tagTypeColors.especialidade)}>
                      {t.value}
                      <button onClick={() => removeTag("especialidade", t.value)} className="hover:opacity-70">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={newEspecialidade}
                    onChange={(e) => setNewEspecialidade(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                  >
                    <option value="">Selecionar...</option>
                    {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
                    <option value="__custom__">Outro...</option>
                  </select>
                  {newEspecialidade === "__custom__" && (
                    <input
                      type="text"
                      value={customEspecialidade}
                      onChange={(e) => setCustomEspecialidade(e.target.value)}
                      placeholder="Digite..."
                      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                    />
                  )}
                  <button
                    onClick={handleAddEspecialidade}
                    disabled={!newEspecialidade || (newEspecialidade === "__custom__" && !customEspecialidade.trim())}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Doutor */}
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Doutor</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.filter((t) => t.type === "doutor").map((t) => (
                    <span key={t.value} className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", tagTypeColors.doutor)}>
                      {t.value}
                      <button onClick={() => removeTag("doutor", t.value)} className="hover:opacity-70">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={newDoutor}
                    onChange={(e) => setNewDoutor(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                  >
                    <option value="">Selecionar...</option>
                    {DOUTORES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button
                    onClick={handleAddDoutor}
                    disabled={!newDoutor}
                    className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Observação */}
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Observação</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.filter((t) => t.type === "observacao").map((t) => (
                    <span key={t.value} className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", tagTypeColors.observacao)}>
                      {t.value}
                      <button onClick={() => removeTag("observacao", t.value)} className="hover:opacity-70">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newObs}
                    onChange={(e) => setNewObs(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddObs(); } }}
                    placeholder="Adicionar observação..."
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                  />
                  <button
                    onClick={handleAddObs}
                    disabled={!newObs.trim()}
                    className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
