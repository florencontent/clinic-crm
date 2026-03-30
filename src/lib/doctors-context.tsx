"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  whatsapp?: string;
  email?: string;
}

interface DoctorsContextValue {
  doctors: Doctor[];
  doctorNames: string[];
  reload: () => Promise<void>;
  addDoctor: (name: string, specialty?: string, whatsapp?: string, email?: string) => Promise<"added" | "exists" | "error">;
  updateDoctor: (doctor: Doctor) => Promise<boolean>;
  removeDoctor: (id: string) => Promise<void>;
}

const DoctorsContext = createContext<DoctorsContextValue>({
  doctors: [],
  doctorNames: [],
  reload: async () => {},
  addDoctor: async () => "error",
  updateDoctor: async () => false,
  removeDoctor: async () => {},
});

export function DoctorsProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/doctors");
    if (res.ok) {
      const data = await res.json();
      setDoctors(data);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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

  return (
    <DoctorsContext.Provider value={{
      doctors,
      doctorNames: doctors.map((d) => d.name),
      reload,
      addDoctor,
      updateDoctor,
      removeDoctor,
    }}>
      {children}
    </DoctorsContext.Provider>
  );
}

export function useDoctors() {
  return useContext(DoctorsContext);
}
