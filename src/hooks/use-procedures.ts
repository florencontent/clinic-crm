"use client";

import { useState, useEffect, useCallback } from "react";

export interface Procedure {
  id: string;
  name: string;
  description?: string;
}

export function useProcedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/procedures");
    if (res.ok) setProcedures(await res.json());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addProcedure = async (name: string, description?: string): Promise<"added" | "exists" | "error"> => {
    const trimmed = name.trim();
    if (!trimmed) return "error";

    const res = await fetch("/api/procedures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, description }),
    });

    if (!res.ok) return "error";
    const data = await res.json();
    await reload();
    return data.exists ? "exists" : "added";
  };

  const removeProcedure = async (id: string): Promise<void> => {
    await fetch("/api/procedures", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  };

  return { procedures, addProcedure, removeProcedure };
}
