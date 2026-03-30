"use client";

import { useState } from "react";
import { X, CalendarCheck, Loader2, Check } from "lucide-react";
import { createAppointment } from "@/lib/api";
import { Lead } from "@/data/mock-data";
import { useDoctors } from "@/lib/doctors-context";

interface ScheduleModalProps {
  lead: Lead;
  onClose: () => void;
  onScheduled?: () => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-all";

export function ScheduleModal({ lead, onClose, onScheduled }: ScheduleModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const { doctorNames } = useDoctors();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const id = await createAppointment({
      patientId: lead.id,
      date,
      startTime: time,
      duration,
      procedure: lead.procedure || "",
      doctor,
      notes,
    });
    setSaving(false);
    if (id) {
      setSaved(true);
      setTimeout(() => { onScheduled?.(); onClose(); }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            <div>
              <p className="font-bold text-sm">Agendar Consulta</p>
              <p className="text-blue-100 text-xs">{lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Horário</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Duração (min)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Médico</label>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecionar...</option>
                {doctorNames.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
              rows={2}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Pular
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${
              saved
                ? "bg-green-500"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-200 dark:shadow-blue-900/50"
            } disabled:opacity-60`}
          >
            {saved ? (
              <><Check className="h-4 w-4" /> Agendado!</>
            ) : saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              <><CalendarCheck className="h-4 w-4" /> Confirmar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
