"use client";

import { useState } from "react";
import { ConversationList } from "@/components/conversas/conversation-list";
import { ChatWindow } from "@/components/conversas/chat-window";
import { conversations as initialConversations, Conversation } from "@/data/mock-data";

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
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
