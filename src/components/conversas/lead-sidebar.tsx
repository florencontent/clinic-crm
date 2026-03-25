"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Mail, CalendarDays, Tag, PauseCircle, PlayCircle, Stethoscope } from "lucide-react";
import { Lead, Appointment, statusLabels, statusColors, reminderLabels, reminderColors, TagType } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toggleAgentPause } from "@/lib/api";

interface LeadSidebarProps {
  lead: Lead | null;
  appointments: Appointment[];
  onClose?: () => void;
  onLeadUpdate?: (lead: Lead) => void;
}

const tagTypeColors: Record<TagType, string> = {
  especialidade: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  doutor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  observacao: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export function LeadSidebar({ lead, appointments, onLeadUpdate }: LeadSidebarProps) {
  const [open, setOpen] = useState(true);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [localPaused, setLocalPaused] = useState<boolean | undefined>(undefined);

  const isPaused = localPaused !== undefined ? localPaused : lead?.agentPaused ?? false;

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

  const leadAppointments = lead
    ? appointments.filter((a) => a.patientId === lead.id)
    : [];

  const nextAppointment = leadAppointments.find(
    (a) => new Date(a.date + "T00:00:00") >= new Date()
  );

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
              <p className="text-sm text-gray-400 dark:text-gray-500">Selecione uma conversa para ver os detalhes do lead</p>
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
                    {statusLabels[lead.status]}
                  </span>
                  {lead.status === "agendado" && lead.reminderStatus && (
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", reminderColors[lead.reminderStatus])}>
                      {reminderLabels[lead.reminderStatus]}
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-700" />

              {/* Info */}
              <div className="space-y-2.5">
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

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tagTypeColors[tag.type])}
                        >
                          {tag.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Next appointment */}
              {nextAppointment && (
                <>
                  <hr className="border-gray-100 dark:border-gray-700" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Próxima consulta</p>
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
                      {nextAppointment.doctor && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{nextAppointment.doctor}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

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
                    ? <><PlayCircle className="h-3.5 w-3.5" />Retomar Agente</>
                    : <><PauseCircle className="h-3.5 w-3.5" />Pausar Agente</>
                  }
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Ver no Kanban
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
