"use client";

import { useState, useEffect, useCallback } from "react";

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  whatsapp?: string;
  email?: string;
}

async function apiFetchDoctors(): Promise<Doctor[]> {
  const res = await fetch("/api/doctors");
  if (!res.ok) return [];
  return res.json();
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const reload = useCallback(async () => {
    const data = await apiFetchDoctors();
    setDoctors(data);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const doctorNames = doctors.map((d) => d.name);

  const addDoctor = async (
    name: string,
    specialty?: string,
    whatsapp?: string,
    email?: string
  ): Promise<"added" | "exists" | "error"> => {
    const trimmed = name.trim();
    if (!trimmed) return "error";

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, specialty, whatsapp, email }),
    });

    if (!res.ok) return "error";
    const data = await res.json();
    await reload();
    return data.exists ? "exists" : "added";
  };

  const updateDoctor = async (doctor: Doctor): Promise<boolean> => {
    const res = await fetch("/api/doctors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doctor),
    });
    if (!res.ok) return false;
    await reload();
    return true;
  };

  const removeDoctor = async (id: string): Promise<void> => {
    await fetch("/api/doctors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await reload();
  };

  return { doctors, doctorNames, addDoctor, updateDoctor, removeDoctor, reload };
}
