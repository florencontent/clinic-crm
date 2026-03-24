"use client";

import { useState, useEffect, useCallback } from "react";
import { TagType } from "@/data/mock-data";

const STORAGE_KEYS: Record<TagType, string> = {
  especialidade: "tag_options_especialidade",
  doutor: "tag_options_doutor",
  observacao: "tag_options_observacao",
};

const DEFAULTS: Record<TagType, string[]> = {
  especialidade: ["Implante", "Clareamento", "Lente de Contato", "Botox", "Harmonização", "Preenchimento"],
  doutor: ["Dr. Alfredo"],
  observacao: ["Alta prioridade", "Retorno", "Indicação VIP"],
};

function loadOptions(type: TagType): string[] {
  if (typeof window === "undefined") return DEFAULTS[type];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[type]);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return DEFAULTS[type];
}

function saveOptions(type: TagType, values: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(values));
  // Notify other components listening
  window.dispatchEvent(new CustomEvent("tag-options-changed", { detail: { type } }));
}

export function useTagOptions() {
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [doutores, setDoutores] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState<string[]>([]);

  const reload = useCallback(() => {
    setEspecialidades(loadOptions("especialidade"));
    setDoutores(loadOptions("doutor"));
    setObservacoes(loadOptions("observacao"));
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("tag-options-changed", handler);
    return () => window.removeEventListener("tag-options-changed", handler);
  }, [reload]);

  const addOption = (type: TagType, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const current = loadOptions(type);
    if (current.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return false;
    const updated = [...current, trimmed];
    saveOptions(type, updated);
    reload();
    return true;
  };

  const removeOption = (type: TagType, value: string) => {
    const updated = loadOptions(type).filter((v) => v !== value);
    saveOptions(type, updated);
    reload();
  };

  const reorderOption = (type: TagType, from: number, to: number) => {
    const current = loadOptions(type);
    const updated = [...current];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    saveOptions(type, updated);
    reload();
  };

  return { especialidades, doutores, observacoes, addOption, removeOption, reorderOption };
}
