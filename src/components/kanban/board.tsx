"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./column";
import { leads as initialLeads, Lead, LeadStatus } from "@/data/mock-data";

const columns: LeadStatus[] = ["em_contato", "agendado", "compareceu", "fechado"];

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as LeadStatus;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggableId ? { ...lead, status: newStatus } : lead
      )
    );
  };

  const getLeadsByStatus = (status: LeadStatus) =>
    leads.filter((lead) => lead.status === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((status) => (
          <KanbanColumn key={status} status={status} leads={getLeadsByStatus(status)} />
        ))}
      </div>
    </DragDropContext>
  );
}
