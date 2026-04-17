"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, CalendarPlus, Loader2, Check, Search, Clock, Lock, Calendar } from "lucide-react";
import { createAppointment, searchPatients, getAvailableSlots, type SlotStatus } from "@/lib/api";
import { Appointment } from "@/data/mock-data";
import { useDoctors } from "@/lib/doctors-context";
import { cn } from "@/lib/utils";

interface NewAppointmentModalProps {
  initialDate: string;
  onClose: () => void;
  onCreated: (apt: Appointment) => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all";

export function NewAppointmentModal({ initialDate, onClose, onCreated }: NewAppointmentModalProps) {
  const { doctorNames: DOUTORES } = useDoctors();
  const [date, setDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [procedure, setProcedure] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Slot availability
  const [slots, setSlots] = useState<SlotStatus[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const slotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Patient search
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const loadSlots = useCallback((d: string, dur: number) => {
    if (slotTimerRef.current) clearTimeout(slotTimerRef.current);
    setSlots([]);
    setSelectedTime(null);
    if (!d) return;
    setLoadingSlots(true);
    slotTimerRef.current = setTimeout(async () => {
      const result = await getAvailableSlots(d, dur);
      setSlots(result);
      setLoadingSlots(false);
    }, 300);
  }, []);

  useEffect(() => { loadSlots(date, duration); }, [date, duration, loadSlots]);
  useEffect(() => () => { if (slotTimerRef.current) clearTimeout(slotTimerRef.current); }, []);

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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    if (!selectedPatient) { setError("Selecione um paciente."); return; }
    if (!selectedTime) { setError("Selecione um horário."); return; }
    setError("");
    setSaving(true);
    const id = await createAppointment({
      patientId: selectedPatient.id,
      date,
      startTime: selectedTime,
      duration,
      procedure,
      doctor,
      notes,
    });
    setSaving(false);
    if (!id) { setError("Erro ao criar agendamento. Tente novamente."); return; }
    setSaved(true);
    onCreated({ id, patientId: selectedPatient.id, leadName: selectedPatient.name, procedure, date, time: selectedTime, duration, doctor, notes });
    setTimeout(onClose, 800);
  };

  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const isSunday = dayOfWeek === 0;
  const availableCount = slots.filter(s => s.available).length;
  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

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
              <p className="text-blue-100 text-xs mt-0.5 capitalize">{dateLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Patient search */}
          <div ref={searchRef} className="relative">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Paciente *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedPatient.name}</span>
                <button onClick={() => { setSelectedPatient(null); setPatientQuery(""); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)}
                    onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
                    placeholder="Buscar paciente por nome..." className={inputClass + " pl-9"} autoFocus
                  />
                </div>
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 overflow-hidden">
                    {patientResults.map((p) => (
                      <button key={p.id} onClick={() => { setSelectedPatient({ id: p.id, name: p.name }); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
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
          </div>

          {/* Time slot grid */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Horário *
              {loadingSlots && <Loader2 className="h-3 w-3 animate-spin text-blue-400 ml-1" />}
              {!loadingSlots && !isSunday && slots.length > 0 && (
                <span className="font-normal text-gray-400">
                  — {availableCount} disponíve{availableCount !== 1 ? "is" : "l"}
                </span>
              )}
            </label>

            {isSunday ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                A clínica não atende aos domingos. Selecione outra data.
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center h-16 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                Nenhum horário disponível neste dia.
              </div>
            ) : availableCount === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-xs text-red-500 dark:text-red-400">
                <Lock className="h-4 w-4 flex-shrink-0" />
                Todos os horários estão ocupados. Selecione outra data ou duração.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    title={
                      !slot.available && slot.conflict
                        ? `Ocupado: ${slot.conflict.patientName}${slot.conflict.procedure ? ` — ${slot.conflict.procedure}` : ""}`
                        : undefined
                    }
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all",
                      slot.available
                        ? selectedTime === slot.time
                          ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30 scale-105"
                          : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:border-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer"
                        : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    )}
                  >
                    <span className="text-sm">{slot.time}h</span>
                    {!slot.available && (
                      <span className="flex items-center gap-0.5 text-[9px] font-normal mt-0.5 text-gray-400 dark:text-gray-600 truncate w-full justify-center">
                        <Lock className="h-2 w-2 flex-shrink-0" />
                        {slot.conflict?.source === "gcal" ? "GCal" : slot.conflict?.patientName?.split(" ")[0] ?? "Ocupado"}
                      </span>
                    )}
                    {slot.available && selectedTime === slot.time && (
                      <Check className="absolute top-1 right-1 h-2.5 w-2.5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Doutor(a)</label>
            <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className={inputClass}>
              <option value="">Selecionar...</option>
              {DOUTORES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
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

          {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
          {selectedTime ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTime}h</span>
              {" · "}{duration} min
            </p>
          ) : (
            <p className="text-xs text-gray-400">Nenhum horário selecionado</p>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved || !selectedTime || loadingSlots}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60",
                saved
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/50"
              )}
            >
              {saved ? (
                <><Check className="h-4 w-4" /> Agendado!</>
              ) : saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><CalendarPlus className="h-4 w-4" /> Agendar</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
