"use client";

import { useState } from "react";
import { X, User, Stethoscope, Clock, CalendarDays, UserCog, FileText, Save, Check, Trash2, AlertTriangle, DollarSign } from "lucide-react";
import { Appointment, reminderLabels, reminderColors } from "@/data/mock-data";
import { deleteAppointmentWithCalendar, deletePatient, updatePatient, updateAppointmentDoctor } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDoctors } from "@/lib/doctors-context";
import { useLanguage } from "@/lib/language-context";

interface AppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSave: (updated: Appointment) => void;
  onDelete?: (id: string) => void;
  onDeleteLead?: (patientId: string) => void;
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
  "w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500";

export function AppointmentModal({ appointment, onClose, onSave, onDelete, onDeleteLead }: AppointmentModalProps) {
  const { t } = useLanguage();
  const { doctorNames: DOUTORES } = useDoctors();
  const procedure = appointment.procedure;
  const [doctor, setDoctor] = useState(appointment.doctor);
  const [patientNotes, setPatientNotes] = useState(appointment.patientNotes ?? "");
  const [dealValueInput, setDealValueInput] = useState(appointment.patientDealValue ? String(appointment.patientDealValue) : "");
  const [editingDeal, setEditingDeal] = useState(false);
  const [localDealValue, setLocalDealValue] = useState(appointment.patientDealValue);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteLead, setConfirmDeleteLead] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);

  const endTime = formatEndTime(appointment.time, appointment.duration);

  const handleSave = async () => {
    onSave({ ...appointment, procedure, doctor });
    await Promise.all([
      updateAppointmentDoctor(appointment.id, doctor),
      appointment.patientId && patientNotes !== (appointment.patientNotes ?? "")
        ? updatePatient(appointment.patientId, { notes: patientNotes })
        : Promise.resolve(null),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    const ok = await deleteAppointmentWithCalendar(appointment.id, {
      leadName: appointment.leadName,
      procedure: appointment.procedure,
      date: appointment.date,
      time: appointment.time,
    });
    setDeleting(false);
    if (ok) {
      onDelete(appointment.id);
      onClose();
    }
  };

  const handleDeleteLead = async () => {
    if (!onDeleteLead || !appointment.patientId) return;
    setDeletingLead(true);
    const ok = await deletePatient(appointment.patientId);
    setDeletingLead(false);
    if (ok) {
      onDeleteLead(appointment.patientId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-transparent dark:border-gray-700"
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
          {/* Paciente */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg flex-shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Paciente</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{appointment.leadName}</p>
            </div>
          </div>

          {/* Data */}
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg flex-shrink-0">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Data</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{formatDate(appointment.date)}</p>
            </div>
          </div>

          {/* Status Lembrete */}
          {appointment.reminderStatus && (
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 p-2 rounded-lg flex-shrink-0">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status do Lembrete</p>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5", reminderColors[appointment.reminderStatus])}>
                  {t.reminder[appointment.reminderStatus]}
                </span>
              </div>
            </div>
          )}

          {/* Horário */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg flex-shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Horário</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {appointment.time} — {endTime} ({appointment.duration} min)
              </p>
            </div>
          </div>

          {/* Procedimento - somente leitura */}
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-lg flex-shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Especialidade / Procedimento</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{procedure || "—"}</p>
            </div>
          </div>

          {/* Doutor - editável */}
          <div className="flex items-start gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg flex-shrink-0 mt-1">
              <UserCog className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Doutor(a) Responsável</p>
              <select
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecionar...</option>
                {DOUTORES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Ticket / Valor - editável */}
          {appointment.patientId && (
            <div className="flex items-start gap-3">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg flex-shrink-0 mt-1">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Ticket / Valor (R$)</p>
                {editingDeal ? (
                  <input
                    type="number"
                    value={dealValueInput}
                    onChange={(e) => setDealValueInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const parsed = dealValueInput ? parseFloat(dealValueInput) : undefined;
                        setLocalDealValue(parsed);
                        setEditingDeal(false);
                        if (appointment.patientId) {
                          await updatePatient(appointment.patientId, { dealValue: parsed ?? null });
                        }
                      } else if (e.key === "Escape") {
                        setDealValueInput(localDealValue ? String(localDealValue) : "");
                        setEditingDeal(false);
                      }
                    }}
                    onBlur={async () => {
                      const parsed = dealValueInput ? parseFloat(dealValueInput) : undefined;
                      setLocalDealValue(parsed);
                      setEditingDeal(false);
                      if (appointment.patientId) {
                        await updatePatient(appointment.patientId, { dealValue: parsed ?? null });
                      }
                    }}
                    placeholder="0,00"
                    autoFocus
                    className={inputClass}
                  />
                ) : (
                  <button
                    onClick={() => setEditingDeal(true)}
                    className="w-full text-left px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 hover:border-blue-400 transition-colors"
                  >
                    {localDealValue != null
                      ? localDealValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : <span className="text-gray-400 dark:text-gray-500">Clique para informar...</span>}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Observação do lead - editável */}
          <div className="flex items-start gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2 rounded-lg flex-shrink-0 mt-1">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Observação</p>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Anote informações sobre o paciente..."
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
          {confirmDeleteLead ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 flex-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Excluir lead e todos os dados?
              </div>
              <button
                onClick={() => setConfirmDeleteLead(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={deletingLead}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {deletingLead ? "Excluindo..." : "Confirmar"}
              </button>
            </div>
          ) : onDeleteLead && appointment.patientId ? (
            <button
              onClick={() => setConfirmDeleteLead(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-dashed border-red-200 dark:border-red-800/50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir Lead
            </button>
          ) : null}
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 flex-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Excluir agendamento?
              </div>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Excluindo..." : "Confirmar"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {onDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              )}
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
                  saved
                    ? "bg-green-500"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200 dark:shadow-blue-900/50"
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
          )}
        </div>
      </div>
    </div>
  );
}
