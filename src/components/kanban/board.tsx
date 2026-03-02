"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { X, Send, Loader2 } from "lucide-react";
import { KanbanColumn } from "./column";
import {
  Lead,
  LeadStatus,
  Conversation,
  statusLabels,
  statusColors,
} from "@/data/mock-data";
import { usePatients } from "@/hooks/use-supabase-data";
import { updatePatientStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const columns: LeadStatus[] = ["em_contato", "agendado", "compareceu", "fechado"];

export function KanbanBoard() {
  const { patients: leads, loading, setPatients: setLeads } = usePatients();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as LeadStatus;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggableId ? { ...lead, status: newStatus } : lead
      )
    );

    // Persist to Supabase
    updatePatientStatus(draggableId, newStatus);
  };

  const getLeadsByStatus = (status: LeadStatus) =>
    leads.filter((lead) => lead.status === status);

  const handleOpenChat = (leadId: string) => {
    if (!conversations.some((c) => c.leadId === leadId)) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setConversations((prev) => [
          ...prev,
          {
            leadId: lead.id,
            leadName: lead.name,
            lastMessage: "",
            lastTime: "Agora",
            unread: 0,
            status: lead.status,
            messages: [],
          },
        ]);
      }
    }
    setOpenLeadId(leadId);
    setInput("");
  };

  const handleClose = () => {
    setOpenLeadId(null);
    setInput("");
  };

  const handleSend = () => {
    if (!input.trim() || !openLeadId) return;
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.leadId !== openLeadId) return conv;
        const newMsg = {
          id: `m-${Date.now()}`,
          text: input.trim(),
          sender: "clinic" as const,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: input.trim(),
          lastTime: "Agora",
        };
      })
    );
    setInput("");
  };

  const openConversation = conversations.find((c) => c.leadId === openLeadId) || null;
  const openLead = leads.find((l) => l.id === openLeadId) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={getLeadsByStatus(status)}
              onOpenChat={handleOpenChat}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Chat Modal */}
      {openLeadId && openLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {openLead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{openLead.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[openLead.status])}>
                    {statusLabels[openLead.status]}
                  </span>
                  <span className="text-xs text-gray-400">{openLead.procedure}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F0F2F5]">
              {openConversation && openConversation.messages.length > 0 ? (
                openConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.sender === "clinic"
                        ? "bg-blue-500 text-white ml-auto rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                    )}
                  >
                    <p>{msg.text}</p>
                    <p className={cn(
                      "text-[10px] mt-1 text-right",
                      msg.sender === "clinic" ? "text-blue-100" : "text-gray-400"
                    )}>
                      {msg.timestamp}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Envie a primeira!</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
