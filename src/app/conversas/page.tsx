"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ConversationList } from "@/components/conversas/conversation-list";
import { ChatWindow } from "@/components/conversas/chat-window";
import { LeadSidebar } from "@/components/conversas/lead-sidebar";
import { useConversations, usePatients, useAppointments } from "@/hooks/use-supabase-data";
import { pinContact } from "@/lib/api";

export default function ConversasPage() {
  const { conversations, loading, setConversations } = useConversations();
  const { patients, setPatients } = usePatients();
  const { appointments, setAppointments } = useAppointments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedConversation = conversations.find((c) => c.leadId === selectedId) || null;
  const selectedLead = selectedId ? (patients.find((p) => p.id === selectedId) || null) : null;

  const missedAppointmentLeadIds = useMemo(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agendadoIds = new Set(patients.filter((p) => p.status === "agendado").map((p) => p.id));
    return new Set(
      appointments
        .filter((a) => {
          if (!a.patientId || !agendadoIds.has(a.patientId)) return false;
          return new Date(a.date + "T" + a.time) < cutoff;
        })
        .map((a) => a.patientId) as string[]
    );
  }, [appointments, patients]);

  const inReschedulingLeadIds = useMemo(
    () => new Set(patients.filter((p) => p.inRescheduling).map((p) => p.id)),
    [patients]
  );

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

  const handlePinContact = async (leadId: string, pinned: boolean) => {
    setPatients((prev) => prev.map((p) => p.id === leadId ? { ...p, isPinned: pinned } : p));
    await pinContact(leadId, pinned);
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
        patients={patients}
        appointments={appointments}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onPinContact={handlePinContact}
        missedAppointmentLeadIds={missedAppointmentLeadIds}
        inReschedulingLeadIds={inReschedulingLeadIds}
      />
      <ChatWindow
        conversation={selectedConversation}
        onSendMessage={handleSendMessage}
      />
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
