"use client";

import { useState } from "react";
import { X, User, Stethoscope, Clock, CalendarDays, UserCog, FileText, Save, Check } from "lucide-react";
import { Appointment } from "@/data/mock-data";

interface AppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSave: (updated: Appointment) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function formatEndTime(time: string, duration: number) {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + duration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

const inputClass =
  "w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

export function AppointmentModal({ appointment, onClose, onSave }: AppointmentModalProps) {
  const [procedure, setProcedure] = useState(appointment.procedure);
  const [doctor, setDoctor] = useState(appointment.doctor);
  const [notes, setNotes] = useState(appointment.notes);
  const [saved, setSaved] = useState(false);

  const endTime = formatEndTime(appointment.time, appointment.duration);

  const handleSave = () => {
    onSave({
      ...appointment,
      procedure,
      doctor,
      notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">{procedure || appointment.procedure}</h3>
              <p className="text-blue-100 text-sm mt-1 capitalize">{formatDate(appointment.date)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Paciente - somente leitura (vem do Google) */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Paciente</p>
              <p className="text-sm font-semibold text-gray-900">{appointment.leadName}</p>
            </div>
          </div>

          {/* Data - somente leitura (vem do Google) */}
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 p-2 rounded-lg flex-shrink-0">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Data</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{formatDate(appointment.date)}</p>
            </div>
          </div>

          {/* Horário - somente leitura (vem do Google) */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Horário</p>
              <p className="text-sm font-semibold text-gray-900">
                {appointment.time} — {endTime} ({appointment.duration} min)
              </p>
            </div>
          </div>

          {/* Procedimento - editável */}
          <div className="flex items-start gap-3">
            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg flex-shrink-0 mt-1">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1.5">Especialidade / Procedimento</p>
              <input
                type="text"
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                placeholder="Ex: Invisalign, Implante, Botox..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Doutor - editável */}
          <div className="flex items-start gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg flex-shrink-0 mt-1">
              <UserCog className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1.5">Doutor(a) Responsável</p>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Ex: Dra. Renata, Dr. Marcos..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Notas - editável */}
          <div className="flex items-start gap-3">
            <div className="bg-red-50 text-red-500 p-2 rounded-lg flex-shrink-0 mt-1">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1.5">Informações do Paciente</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dores, problemas, limitações, alergias..."
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
              saved
                ? "bg-green-500"
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200"
            }`}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
