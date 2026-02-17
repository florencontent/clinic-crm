"use client";

import { Droppable } from "@hello-pangea/dnd";
import { KanbanCard } from "./card";
import { Lead, LeadStatus, statusLabels, columnColors } from "@/data/mock-data";

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
}

export function KanbanColumn({ status, leads }: KanbanColumnProps) {
  return (
    <div className={`flex-1 min-w-[280px] bg-gray-50 rounded-xl border-t-4 ${columnColors[status]}`}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700">{statusLabels[status]}</h3>
          <span className="bg-white text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
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
              snapshot.isDraggingOver ? "bg-blue-50/50" : ""
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
