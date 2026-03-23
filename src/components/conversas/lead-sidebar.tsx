"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Mail, CalendarDays, Tag } from "lucide-react";
import { Lead, Appointment, statusLabels, statusColors, TagType } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadSidebarProps {
  lead: Lead | null;
  appointments: Appointment[];
  onClose?: () => void;
}

const tagTypeColors: Record<TagType, string> = {
  especialidade: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  doutor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  observacao: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export function LeadSidebar({ lead, appointments }: LeadSidebarProps) {
  const [open, setOpen] = useState(true);

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
        style={{ left: open ? "0" : "50%" }}
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
                <span className={cn("mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[lead.status])}>
                  {statusLabels[lead.status]}
                </span>
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

              {/* Quick action */}
              <hr className="border-gray-100 dark:border-gray-700" />
              <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Ver no Kanban (em breve)"
              >
                Ver no Kanban
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
