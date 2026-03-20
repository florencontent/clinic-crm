"use client";

import { useRef } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Phone, Globe, Instagram, MessageCircle } from "lucide-react";
import { Lead } from "@/data/mock-data";

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onOpenChat: (leadId: string) => void;
}

export function KanbanCard({ lead, index, onOpenChat }: KanbanCardProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx < 5 && dy < 5) {
      onOpenChat(lead.id);
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
          className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-shadow cursor-pointer ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-blue-200 dark:ring-blue-700"
              : "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{lead.name}</h4>
            {lead.source === "Meta Ads" ? (
              <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                <Instagram className="h-3 w-3" />
                Meta
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                Site
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{lead.procedure}</p>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(lead.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </span>
              <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
