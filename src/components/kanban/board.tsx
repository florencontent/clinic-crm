"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { X, Send, Loader2, Search } from "lucide-react";
import { KanbanColumn } from "./column";
import {
  Lead,
  LeadStatus,
  LeadSource,
  Conversation,
  statusLabels,
  statusColors,
} from "@/data/mock-data";
import { usePatients, useConversations } from "@/hooks/use-supabase-data";
import { updatePatientStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const columns: LeadStatus[] = ["em_contato", "agendado", "compareceu", "fechado"];

const SOURCE_FILTERS: { value: LeadSource | "all"; label: string }[] = [
  { value: "all", label: "Todas as origens" },
  { value: "Meta Ads", label: "Meta Ads" },
  { value: "Site", label: "Site" },
];

export function KanbanBoard() {
  const { patients: leads, loading, setPatients: setLeads } = usePatients();
  const { conversations } = useConversations();
  const { theme } = useTheme();
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (search && !lead.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      return true;
    });
  }, [leads, search, sourceFilter]);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as LeadStatus;
    const lead = leads.find((l) => l.id === draggableId);

    setLeads((prev) =>
      prev.map((l) => l.id === draggableId ? { ...l, status: newStatus } : l)
    );

    updatePatientStatus(draggableId, newStatus);

    if (newStatus === "compareceu" && lead) {
      const conv = conversations.find((c) => c.leadId === draggableId);
      fetch("https://florenmarketing.app.n8n.cloud/webhook/pos-consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          phone: conv?.phone || "",
          procedure: lead.procedure || "",
        }),
      }).catch(() => {});
    }
  };

  const getLeadsByStatus = (status: LeadStatus) =>
    filteredLeads.filter((lead) => lead.status === status);

  const handleOpenChat = (leadId: string) => {
    setOpenLeadId(leadId);
    setInput("");
  };

  const handleClose = () => {
    setOpenLeadId(null);
    setInput("");
  };

  const handleSend = () => {
    if (!input.trim() || !openLeadId) return;
    fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: openConversation?.conversationId || "",
        content: input.trim(),
        phone: openConversation?.phone || openLead?.phone || "",
        patientId: openLeadId,
      }),
    });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "40px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const openConversation = conversations.find((c) => c.leadId === openLeadId) || null;
  const openLead = leads.find((l) => l.id === openLeadId) || null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [openConversation?.messages]);

  const hasActiveFilter = search !== "" || sourceFilter !== "all";
  const totalFiltered = filteredLeads.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-400 transition-colors w-52 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Source filter */}
        <div className="flex gap-1.5">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={cn(
                "text-xs px-3 py-2 rounded-lg border font-medium transition-colors",
                sourceFilter === f.value
                  ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-800 dark:border-gray-200"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clear + counter */}
        {hasActiveFilter && (
          <>
            <button
              onClick={() => { setSearch(""); setSourceFilter("all"); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
            <span className="text-xs text-gray-400">
              {totalFiltered} lead{totalFiltered !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

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
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {openLead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{openLead.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[openLead.status])}>
                    {statusLabels[openLead.status]}
                  </span>
                  <span className="text-xs text-gray-400">{openLead.procedure}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: theme === "dark" ? "#111827" : "#EFEAE2" }}>
              {openConversation && openConversation.messages.length > 0 ? (
                <>
                  {openConversation.messages.map((msg, idx) => {
                    const isClinic = msg.sender === "clinic";
                    const prev = idx > 0 ? openConversation.messages[idx - 1] : null;
                    const isGrouped = prev?.sender === msg.sender;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex", isClinic ? "justify-end" : "justify-start", isGrouped ? "mt-0.5" : "mt-3")}
                      >
                        <div
                          className={cn(
                            "relative max-w-[75%] px-3 py-2 text-sm shadow-sm",
                            isClinic
                              ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-gray-100 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-2xl",
                            !isGrouped && isClinic && "rounded-tr-md",
                            !isGrouped && !isClinic && "rounded-tl-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                          <p className="text-[10px] text-gray-400 text-right mt-1 select-none">{msg.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400 bg-white/60 px-3 py-1.5 rounded-full">Nenhuma mensagem ainda</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-[#F0F2F5] dark:bg-gray-800 px-3 py-3 border-t border-gray-100 dark:border-gray-700 flex items-end gap-2">
              <div className="flex-1 bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm px-4 py-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleChatInput}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  autoFocus
                  className="w-full text-sm outline-none resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
                  style={{ height: "40px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white p-2.5 rounded-full transition-colors flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pb-2 bg-[#F0F2F5] dark:bg-gray-800 select-none">
              Enter para enviar · Shift+Enter para nova linha
            </p>
          </div>
        </div>
      )}
    </>
  );
}
