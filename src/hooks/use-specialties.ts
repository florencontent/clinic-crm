"use client";

import { useState, useEffect, useCallback } from "react";

export interface Specialty {
  id: string;
  name: string;
}

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/specialties");
    if (res.ok) setSpecialties(await res.json());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSpecialty = async (name: string): Promise<"added" | "exists" | "error"> => {
    const trimmed = name.trim();
    if (!trimmed) return "error";

    const res = await fetch("/api/specialties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) return "error";
    const data = await res.json();
    await reload();
    return data.exists ? "exists" : "added";
  };

  const removeSpecialty = async (id: string): Promise<void> => {
    await fetch("/api/specialties", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  };

  return { specialties, addSpecialty, removeSpecialty };
}
