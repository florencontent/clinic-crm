"use client";

import { useState, useEffect, useCallback } from "react";

async function apiFetchDoctors(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch("/api/doctors");
  if (!res.ok) return [];
  return res.json();
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);

  const reload = useCallback(async () => {
    const data = await apiFetchDoctors();
    setDoctors(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const doctorNames = doctors.map((d) => d.name);

  const addDoctor = async (name: string): Promise<"added" | "exists" | "error"> => {
    const trimmed = name.trim();
    if (!trimmed) return "error";

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) return "error";
    const data = await res.json();
    await reload();
    return data.exists ? "exists" : "added";
  };

  const removeDoctor = async (id: string): Promise<void> => {
    await fetch("/api/doctors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  };

  return { doctors, doctorNames, addDoctor, removeDoctor };
}
