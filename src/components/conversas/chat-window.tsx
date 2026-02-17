"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Conversation, statusLabels, statusColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (leadId: string, text: string) => void;
}

export function ChatWindow({ conversation, onSendMessage }: ChatWindowProps) {
  const [input, setInput] = useState("");

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
            <Send className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(conversation.leadId, input.trim());
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F0F2F5] h-full">
      {/* Header */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
          {conversation.leadName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{conversation.leadName}</p>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conversation.status])}>
            {statusLabels[conversation.status]}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
              msg.sender === "clinic"
                ? "bg-blue-500 text-white ml-auto rounded-br-md"
                : "bg-white text-gray-900 rounded-bl-md shadow-sm"
            )}
          >
            <p>{msg.text}</p>
            <p className={cn(
              "text-[10px] mt-1",
              msg.sender === "clinic" ? "text-blue-100 text-right" : "text-gray-400 text-right"
            )}>
              {msg.timestamp}
            </p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-gray-100 rounded-full px-5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all"
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
  );
}
