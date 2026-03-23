"use client";

import { useState, useEffect, useRef } from "react";
import { X, CalendarPlus, Loader2, Check, Search } from "lucide-react";
import { createAppointment, searchPatients } from "@/lib/api";
import { Appointment } from "@/data/mock-data";

interface NewAppointmentModalProps {
  initialDate: string;
  onClose: () => void;
  onCreated: (apt: Appointment) => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all";

export function NewAppointmentModal({ initialDate, onClose, onCreated }: NewAppointmentModalProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [procedure, setProcedure] = useState("");
  const [doctor, setDoctor] = useState("Dr. Alfredo Marques");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Patient search
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (patientQuery.length < 2) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      const results = await searchPatients(patientQuery);
      setPatientResults(results);
      setShowDropdown(results.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    if (!selectedPatient) { setError("Selecione um paciente."); return; }
    setError("");
    setSaving(true);
    const id = await createAppointment({
      patientId: selectedPatient.id,
      date,
      startTime: time,
      duration,
      procedure,
      doctor,
      notes,
    });
    setSaving(false);
    if (!id) { setError("Erro ao criar agendamento."); return; }

    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + duration;
    setSaved(true);
    onCreated({
      id,
      patientId: selectedPatient.id,
      leadName: selectedPatient.name,
      procedure,
      date,
      time,
      duration,
      doctor,
      notes,
    });
    void total;
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarPlus className="h-5 w-5" />
            <div>
              <h3 className="font-bold text-base">Novo Agendamento</h3>
              <p className="text-blue-100 text-xs mt-0.5">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Patient search */}
          <div ref={searchRef} className="relative">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Paciente *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPatient.name}</span>
                <button
                  onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
                    placeholder="Buscar paciente por nome..."
                    className={inputClass + " pl-9"}
                    autoFocus
                  />
                </div>
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatient({ id: p.id, name: p.name }); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Horário</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Duration & Doctor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Duração</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Médico</label>
              <input type="text" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="Dr. Alfredo..." className={inputClass} />
            </div>
          </div>

          {/* Procedure */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Procedimento</label>
            <input type="text" value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="Ex: Implante, Avaliação..." className={inputClass} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Informações adicionais..." className={inputClass + " resize-none"} />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-white dark:bg-gray-900">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all ${
              saved ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/50"
            } disabled:opacity-60`}
          >
            {saved ? <><Check className="h-4 w-4" /> Agendado!</> : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><CalendarPlus className="h-4 w-4" /> Agendar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
