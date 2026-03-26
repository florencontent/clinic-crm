"use client";

import { useState } from "react";
import { Plus, X, Tag, Stethoscope, User } from "lucide-react";
import { useTagOptions } from "@/hooks/use-tag-options";
import { useDoctors } from "@/hooks/use-doctors";
import { TagType } from "@/data/mock-data";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const { especialidades, addOption, removeOption } = useTagOptions();
  const { doctors, addDoctor, removeDoctor } = useDoctors();

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h2>
        </div>
        <p className="text-sm text-gray-400 ml-12">
          Gerencie as opções de tags para classificar seus leads
        </p>
      </div>

      <div className="space-y-5">
        {/* Especialidades — localStorage */}
        <EspecialidadesSection
          options={especialidades}
          onAdd={(v) => addOption("especialidade", v)}
          onRemove={(v) => removeOption("especialidade", v)}
        />

        {/* Doutores — Supabase */}
        <DoutoresSection
          doctors={doctors}
          onAdd={addDoctor}
          onRemove={removeDoctor}
        />
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Doutores são salvos no banco de dados e sincronizados em toda a aplicação.
      </p>
    </div>
  );
}

function EspecialidadesSection({
  options,
  onAdd,
  onRemove,
}: {
  options: string[];
  onAdd: (v: string) => boolean;
  onRemove: (v: string) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const ok = onAdd(input);
    if (ok) { setInput(""); setError(""); }
    else if (input.trim()) { setError("Essa opção já existe."); setTimeout(() => setError(""), 2000); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Especialidades</h3>
          <p className="text-xs text-gray-400 mt-0.5">Procedimentos e tratamentos oferecidos pela clínica</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {options.length}
        </span>
      </div>
      <div className="px-6 py-4">
        {options.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-4">Nenhuma opção cadastrada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {options.map((opt) => (
              <span key={opt} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {opt}
                <button onClick={() => onRemove(opt)} className="hover:opacity-60 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder="Ex: Implante dentário, Clareamento..."
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder-gray-400",
              error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700 focus:border-blue-400"
            )}
          />
          <button onClick={handleAdd} disabled={!input.trim()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

function DoutoresSection({
  doctors,
  onAdd,
  onRemove,
}: {
  doctors: Array<{ id: string; name: string }>;
  onAdd: (name: string) => Promise<"added" | "exists" | "error">;
  onRemove: (id: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setAdding(true);
    const result = await onAdd(input);
    setAdding(false);
    if (result === "added") {
      setInput(""); setError("");
    } else if (result === "exists") {
      setError("Esse doutor já existe."); setTimeout(() => setError(""), 2500);
    } else {
      setError("Erro ao salvar. Tente novamente."); setTimeout(() => setError(""), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40">
          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Doutores</h3>
          <p className="text-xs text-gray-400 mt-0.5">Profissionais que atendem na clínica</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {doctors.length}
        </span>
      </div>
      <div className="px-6 py-4">
        {doctors.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-4">Nenhum doutor cadastrado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {doctors.map((d) => (
              <span key={d.id} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {d.name}
                <button onClick={() => onRemove(d.id)} className="hover:opacity-60 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder="Ex: Dr. João, Dra. Ana..."
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder-gray-400",
              error ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700 focus:border-blue-400"
            )}
          />
          <button onClick={handleAdd} disabled={!input.trim() || adding} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {adding ? "..." : "Adicionar"}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}
