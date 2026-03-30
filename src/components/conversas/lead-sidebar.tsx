"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Phone, Mail, CalendarDays, Tag, PauseCircle, PlayCircle, Stethoscope } from "lucide-react";
import { Lead, Appointment, statusColors, reminderColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toggleAgentPause, updatePatient, updateAppointmentDoctor } from "@/lib/api";
import { DealValueField } from "@/components/shared/deal-value-field";
import { useDoctors } from "@/lib/doctors-context";
import { useLanguage } from "@/lib/language-context";

interface LeadSidebarProps {
  lead: Lead | null;
  appointments: Appointment[];
  onClose?: () => void;
  onLeadUpdate?: (lead: Lead) => void;
  onAppointmentUpdate?: (appointment: Appointment) => void;
}

export function LeadSidebar({ lead, appointments, onLeadUpdate }: LeadSidebarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [localPaused, setLocalPaused] = useState<boolean | undefined>(undefined);
  const [localNotes, setLocalNotes] = useState<string | undefined>(undefined);
  const [localDoctor, setLocalDoctor] = useState<string | undefined>(undefined);
  const [notesSaving, setNotesSaving] = useState(false);
  const { t } = useLanguage();
  const { doctorNames: DOUTORES } = useDoctors();

  // Reset local state whenever the selected lead changes
  useEffect(() => {
    setLocalPaused(undefined);
    setLocalNotes(undefined);
    setLocalDoctor(undefined);
  }, [lead?.id]);

  const isPaused = localPaused !== undefined ? localPaused : lead?.agentPaused ?? false;
  const notesValue = localNotes !== undefined ? localNotes : (lead?.notes ?? "");
  const doctorValue = localDoctor !== undefined ? localDoctor : (lead?.doctor ?? "");

  const leadAppointments = lead
    ? appointments.filter((a) => a.patientId === lead.id)
    : [];

  const nextAppointment = leadAppointments.find(
    (a) => new Date(a.date + "T00:00:00") >= new Date()
  );

  const handleNotesSave = async () => {
    if (!lead || localNotes === undefined) return;
    setNotesSaving(true);
    await updatePatient(lead.id, { notes: localNotes });
    setNotesSaving(false);
    onLeadUpdate?.({ ...lead, notes: localNotes });
  };

  const handlePauseToggle = async () => {
    if (!lead) return;
    setPauseLoading(true);
    const newPaused = !isPaused;
    const ok = await toggleAgentPause(lead.id, newPaused);
    setPauseLoading(false);
    if (ok) {
      setLocalPaused(newPaused);
      onLeadUpdate?.({ ...lead, agentPaused: newPaused });
    }
  };

  const handleDoctorChange = async (value: string) => {
    if (!lead) return;
    setLocalDoctor(value);
    await updatePatient(lead.id, { doctor: value });
    onLeadUpdate?.({ ...lead, doctor: value });
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 border-l border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 overflow-hidden flex flex-col relative",
        open ? "w-80" : "w-10"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute top-3 left-0 -translate-x-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        style={{ left: "20px" }}
      >
        {open ? (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="flex-1 overflow-y-auto">
          {!lead ? (
            <div className="flex items-center justify-center h-full text-center px-4 py-12">
              <p className="text-sm text-gray-400 dark:text-gray-500">{t.sidebar.selectPrompt}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center pt-3 pb-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold mb-3">
                  {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{lead.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[lead.status])}>
                    {t.status[lead.status]}
                  </span>
                  {lead.status === "em_contato" && (lead.followUpStage ?? 0) >= 1 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {(lead.followUpStage ?? 0) === 5 ? "Mensagem 5 (Encerrando)" : `Mensagem ${lead.followUpStage}`}
                    </span>
                  )}
                  {lead.status === "agendado" && lead.reminderStatus && (
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", reminderColors[lead.reminderStatus])}>
                      {t.reminder[lead.reminderStatus]}
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* Info */}
              <div className="space-y-2.5">
                {lead.date && (
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {t.sidebar.leadSince} {format(new Date(lead.date + "T12:00:00"), "dd/MM/yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{lead.phone || "—"}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{lead.source}</span>
                </div>
                {lead.procedure && (
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{lead.procedure}</span>
                  </div>
                )}
              </div>

              {/* Observação */}
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">{t.sidebar.notes}</p>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesSave}
                    placeholder={t.sidebar.notesPlaceholder}
                    rows={3}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-400 transition-colors placeholder-gray-400 resize-none"
                  />
                  {notesSaving && <p className="text-[10px] text-gray-400 mt-1">{t.sidebar.saving}</p>}
                </div>
              </>

              {/* Next appointment */}
              {nextAppointment && (
                <>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">{t.sidebar.nextAppointment}</p>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CalendarDays className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(nextAppointment.date + "T12:00:00"), "dd 'de' MMM", { locale: ptBR })} às {nextAppointment.time}
                        </span>
                      </div>
                      {nextAppointment.procedure && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{nextAppointment.procedure}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Doutor */}
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">{t.sidebar.doctor}</p>
                  <select
                    value={doctorValue}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="">{t.sidebar.selectDoctor}</option>
                    {DOUTORES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </>

              {/* Ticket */}
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <DealValueField lead={lead} onUpdate={onLeadUpdate} />
              </>

              {/* Actions */}
              <hr className="border-gray-100 dark:border-gray-700" />
              <div className="space-y-2">
                <button
                  onClick={handlePauseToggle}
                  disabled={pauseLoading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50",
                    isPaused
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-100"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100"
                  )}
                >
                  {isPaused
                    ? <><PlayCircle className="h-3.5 w-3.5" />{t.sidebar.resumeAgent}</>
                    : <><PauseCircle className="h-3.5 w-3.5" />{t.sidebar.pauseAgent}</>
                  }
                </button>
                <button
                  onClick={() => router.push("/kanban?highlight=" + lead.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.sidebar.viewOnKanban}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
