"use client";

import { useState } from "react";
import { Plus, X, Tag, Stethoscope, User, MessageSquare } from "lucide-react";
import { useTagOptions } from "@/hooks/use-tag-options";
import { TagType } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const sections: {
  type: TagType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  chipColor: string;
  inputPlaceholder: string;
}[] = [
  {
    type: "especialidade",
    label: "Especialidades",
    description: "Procedimentos e tratamentos oferecidos pela clínica",
    icon: Stethoscope,
    color: "text-blue-600 dark:text-blue-400",
    chipColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    inputPlaceholder: "Ex: Implante dentário, Clareamento...",
  },
  {
    type: "doutor",
    label: "Doutores",
    description: "Profissionais que atendem na clínica",
    icon: User,
    color: "text-purple-600 dark:text-purple-400",
    chipColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    inputPlaceholder: "Ex: Dr. João, Dra. Ana...",
  },
  {
    type: "observacao",
    label: "Observações Predefinidas",
    description: "Atalhos rápidos para observações frequentes nos leads",
    icon: MessageSquare,
    color: "text-amber-600 dark:text-amber-400",
    chipColor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    inputPlaceholder: "Ex: Alta prioridade, Retorno...",
  },
];

function TagSection({
  section,
  options,
  onAdd,
  onRemove,
}: {
  section: (typeof sections)[0];
  options: string[];
  onAdd: (type: TagType, value: string) => boolean;
  onRemove: (type: TagType, value: string) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const ok = onAdd(section.type, input);
    if (ok) {
      setInput("");
      setError("");
    } else if (input.trim()) {
      setError("Essa opção já existe.");
      setTimeout(() => setError(""), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <div className={cn("p-2 rounded-xl", section.chipColor.split(" ").slice(0, 2).join(" "))}>
          <section.icon className={cn("h-4 w-4", section.color)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
        </div>
        <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {options.length}
        </span>
      </div>

      {/* Options */}
      <div className="px-6 py-4">
        {options.length === 0 ? (
          <p className="text-xs text-gray-400 italic mb-4">Nenhuma opção cadastrada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {options.map((opt) => (
              <span
                key={opt}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all",
                  section.chipColor
                )}
              >
                {opt}
                <button
                  onClick={() => onRemove(section.type, opt)}
                  className="hover:opacity-60 transition-opacity flex-shrink-0"
                  title="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder={section.inputPlaceholder}
            className={cn(
              "flex-1 px-3 py-2 text-sm rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none transition-colors placeholder-gray-400",
              error
                ? "border-red-300 dark:border-red-700 focus:border-red-400"
                : "border-gray-200 dark:border-gray-700 focus:border-blue-400"
            )}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { especialidades, doutores, observacoes, addOption, removeOption } = useTagOptions();

  const optionsMap: Record<TagType, string[]> = {
    especialidade: especialidades,
    doutor: doutores,
    observacao: observacoes,
  };

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
        {sections.map((section) => (
          <TagSection
            key={section.type}
            section={section}
            options={optionsMap[section.type]}
            onAdd={addOption}
            onRemove={removeOption}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        As configurações são salvas automaticamente neste dispositivo.
      </p>
    </div>
  );
}
