"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Conversation, statusLabels, statusColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

interface ChatWindowProps {
  conversation: Conversation | null;
  onSendMessage: (leadId: string, text: string) => void;
}

export function ChatWindow({ conversation, onSendMessage }: ChatWindowProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: theme === "dark" ? "#111827" : "#EFEAE2" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-gray-700/60 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <MessageSquare className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(conversation.leadId, input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "40px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#F0F2F5] dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {conversation.leadName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{conversation.leadName}</p>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conversation.status])}>
            {statusLabels[conversation.status]}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: theme === "dark" ? "#111827" : "#EFEAE2" }}
      >
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-400 bg-white/60 dark:bg-gray-700/60 px-3 py-1.5 rounded-full shadow-sm">
              Nenhuma mensagem ainda
            </p>
          </div>
        ) : (
          conversation.messages.map((msg, idx) => {
            const isClinic = msg.sender === "clinic";
            const prevMsg = idx > 0 ? conversation.messages[idx - 1] : null;
            const isGrouped = prevMsg?.sender === msg.sender;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isClinic ? "justify-end" : "justify-start",
                  isGrouped ? "mt-0.5" : "mt-3"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[72%] px-3 py-2 text-sm shadow-sm",
                    isClinic
                      ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-gray-100 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-2xl",
                    !isGrouped && isClinic && "rounded-tr-md",
                    !isGrouped && !isClinic && "rounded-tl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 text-right mt-1 select-none">
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#F0F2F5] dark:bg-gray-800 px-3 py-3 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
        <div className="flex-1 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="w-full text-sm outline-none resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
            style={{ height: "40px", maxHeight: "120px" }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors flex-shrink-0 shadow-sm"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pb-1.5 bg-[#F0F2F5] dark:bg-gray-800 select-none">
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  );
}
