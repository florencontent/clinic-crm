"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ConversationList } from "@/components/conversas/conversation-list";
import { ChatWindow } from "@/components/conversas/chat-window";
import { LeadSidebar } from "@/components/conversas/lead-sidebar";
import { useConversations, usePatients, useAppointments } from "@/hooks/use-supabase-data";

export default function ConversasPage() {
  const { conversations, loading, setConversations } = useConversations();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ChatWindow
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />
      <LeadSidebar
        lead={selectedLead}
        appointments={appointments}
      />
    </div>
  );
}
