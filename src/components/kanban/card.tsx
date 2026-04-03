"use client";

import { useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Phone, Globe, Instagram, Bell, UserX, Headphones } from "lucide-react";
import { Lead, reminderColors } from "@/data/mock-data";
import { useLanguage } from "@/lib/language-context";

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onOpenChat: (leadId: string) => void;
  onOpenProfile?: (leadId: string) => void;
  highlighted?: boolean;
  isPastAppointment?: boolean;
  wantsHuman?: boolean;
}

export function KanbanCard({ lead, index, onOpenProfile, highlighted, isPastAppointment, wantsHuman }: KanbanCardProps) {
  const { t } = useLanguage();
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlighted || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx < 5 && dy < 5) {
      onOpenProfile?.(lead.id);
    }
    mouseDownPos.current = null;
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          <div
            ref={cardRef}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border transition-shadow cursor-pointer ${
              snapshot.isDragging
                ? "shadow-lg ring-2 ring-blue-200 dark:ring-blue-700 border-gray-100 dark:border-gray-700"
                : highlighted
                ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-600 ring-offset-1 shadow-md animate-pulse"
                : isPastAppointment && lead.status === "agendado"
                ? "border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-800/50 ring-offset-1 bg-red-50/30 dark:bg-red-900/10"
                : lead.status === "nao_compareceu"
                ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10"
                : "border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700"
            }`}
          >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{lead.name}</h4>
            {lead.source === "Meta Ads" ? (
              <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                <Instagram className="h-3 w-3" />
                Meta
              </span>
            ) : lead.source === "Orgânico" ? (
              <span className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                {t.source["Orgânico"]}
              </span>
            ) : lead.source === "Indicação" ? (
              <span className="flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                {t.source["Indicação"]}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                {t.source["Site"]}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lead.procedure}</p>

          {lead.status === "em_contato" && (lead.followUpStage ?? 0) >= 1 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {(lead.followUpStage ?? 0) === 5 ? "Mensagem 5 (Encerrando)" : `Mensagem ${lead.followUpStage}`}
            </span>
          )}

          {lead.status === "agendado" && lead.reminderStatus && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${reminderColors[lead.reminderStatus]}`}>
              <Bell className="h-2.5 w-2.5" />
              {t.reminder[lead.reminderStatus]}
            </span>
          )}

          {isPastAppointment && lead.status === "agendado" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
              ⚠ Não compareceu — reagendar
            </span>
          )}

          {lead.status === "nao_compareceu" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
              <UserX className="h-2.5 w-2.5" />
              Não compareceu
            </span>
          )}

          {wantsHuman && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
              <Headphones className="h-2.5 w-2.5" />
              Quer atendente
            </span>
          )}

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
