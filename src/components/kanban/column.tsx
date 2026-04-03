"use client";

import { Droppable } from "@hello-pangea/dnd";
import { KanbanCard } from "./card";
import { Lead, LeadStatus, columnColors } from "@/data/mock-data";
import { useLanguage } from "@/lib/language-context";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onOpenChat: (leadId: string) => void;
  onOpenProfile?: (leadId: string) => void;
  highlightId?: string | null;
  pastAppointmentLeadIds?: Set<string>;
  wantsHumanLeadIds?: Set<string>;
}

export function KanbanColumn({ status, leads, onOpenChat, onOpenProfile, highlightId, pastAppointmentLeadIds, wantsHumanLeadIds }: KanbanColumnProps) {
  const { t } = useLanguage();
  return (
    <div className={`flex-1 min-w-[280px] bg-gray-50 dark:bg-gray-900 rounded-xl border-t-4 ${columnColors[status]}`}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t.status[status]}</h3>
          <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            {leads.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-3 pt-1 space-y-3 min-h-[200px] transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanCard
                key={lead.id}
                lead={lead}
                index={index}
                onOpenChat={onOpenChat}
                onOpenProfile={onOpenProfile}
                highlighted={highlightId === lead.id}
                isPastAppointment={pastAppointmentLeadIds?.has(lead.id) ?? false}
                wantsHuman={wantsHumanLeadIds?.has(lead.id) ?? false}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
