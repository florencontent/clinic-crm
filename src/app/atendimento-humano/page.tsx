"use client";

import { useState, useMemo } from "react";
import { Loader2, Headphones, UserCheck } from "lucide-react";
import { ChatWindow } from "@/components/conversas/chat-window";
import { LeadSidebar } from "@/components/conversas/lead-sidebar";
import { useConversations, usePatients, useAppointments } from "@/hooks/use-supabase-data";
import { pinContact } from "@/lib/api";
import { cn } from "@/lib/utils";
import { statusColors } from "@/data/mock-data";
import { useLanguage } from "@/lib/language-context";

export default function AtendimentoHumanoPage() {
  const { t } = useLanguage();
  const { conversations, loading, setConversations } = useConversations();
  const { patients, setPatients } = usePatients();
  const { appointments, setAppointments } = useAppointments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const humanConversations = useMemo(
    () => conversations.filter((c) => c.wantsHuman),
    [conversations]
  );

  const selectedConversation = conversations.find((c) => c.leadId === selectedId) || null;
  const selectedLead = selectedId ? (patients.find((p) => p.id === selectedId) || null) : null;

  const handleSendMessage = (leadId: string, text: string) => {
    const conv = conversations.find((c) => c.leadId === leadId);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.leadId !== leadId) return c;
        const newMsg = {
          id: `m-${Date.now()}`,
          text,
          sender: "clinic" as const,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        return {
          ...c,
          messages: [...c.messages, newMsg],
          lastMessage: text,
          lastTime: "Agora",
        };
      })
    );
    fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conv?.conversationId || "",
        content: text,
        phone: conv?.phone || "",
        patientId: leadId,
      }),
    }).catch(() => {});
  };

  const handleMarkAsAttended = (leadId: string) => {
    setConversations((prev) =>
      prev.map((c) => c.leadId === leadId ? { ...c, wantsHuman: undefined } : c)
    );
    if (selectedId === leadId) setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Left panel: list of leads wanting human */}
      <div className="w-[360px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Atendimento Humano</h3>
            </div>
            {humanConversations.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {humanConversations.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Leads que solicitaram atendimento humano
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {humanConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Headphones className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhum lead aguardando atendimento</p>
            </div>
          ) : (
            humanConversations.map((conv) => (
              <div key={conv.leadId} className="relative group">
                <button
                  onClick={() => setSelectedId(conv.leadId)}
                  className={cn(
                    "w-full text-left p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-amber-50/60 dark:hover:bg-amber-900/10 transition-colors",
                    selectedId === conv.leadId
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "bg-amber-50/30 dark:bg-amber-900/5 border-l-2 border-l-amber-400"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {conv.leadName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {conv.leadName}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
                        {conv.lastMessage || "Sem mensagens"}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conv.status])}>
                          {t.status[conv.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                          <Headphones className="h-2.5 w-2.5" />
                          Quer atendente
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Mark as attended button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleMarkAsAttended(conv.leadId); }}
                  title="Marcar como atendido"
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm text-gray-400 hover:text-green-500 hover:border-green-300 dark:hover:border-green-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      <ChatWindow
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />

      {/* Lead sidebar */}
      <LeadSidebar
        lead={selectedLead}
        appointments={appointments}
        onLeadUpdate={(updated) => setPatients((prev) => prev.map((p) => p.id === updated.id ? updated : p))}
        onAppointmentUpdate={(updated) =>
          setAppointments((prev) => prev.map((a) => a.id === updated.id ? updated : a))
        }
      />
    </div>
  );
}
