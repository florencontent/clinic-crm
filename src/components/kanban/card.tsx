"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Phone, Globe, Instagram } from "lucide-react";
import { Lead } from "@/data/mock-data";

interface KanbanCardProps {
  lead: Lead;
  index: number;
}

export function KanbanCard({ lead, index }: KanbanCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-shadow ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-200" : "hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-900">{lead.name}</h4>
            {lead.source === "Meta Ads" ? (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                <Instagram className="h-3 w-3" />
                Meta
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                <Globe className="h-3 w-3" />
                Site
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-2">{lead.procedure}</p>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(lead.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
