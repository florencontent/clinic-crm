"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ConversationList } from "@/components/conversas/conversation-list";
import { ChatWindow } from "@/components/conversas/chat-window";
import { Conversation } from "@/data/mock-data";
import { useConversations } from "@/hooks/use-supabase-data";

export default function ConversasPage() {
  const { conversations, loading, setConversations } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedConversation = conversations.find((c) => c.leadId === selectedId) || null;

  const handleSendMessage = (leadId: string, text: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.leadId !== leadId) return conv;
        const newMsg = {
          id: `m-${Date.now()}`,
          text,
          sender: "clinic" as const,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: text,
          lastTime: "Agora",
        };
      })
    );
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
    </div>
  );
}
