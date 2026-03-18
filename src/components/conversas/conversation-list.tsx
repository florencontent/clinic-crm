"use client";

import { useState, useMemo } from "react";
import { Search, MessageCircle } from "lucide-react";
import { Conversation, LeadStatus, statusLabels, statusColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_FILTERS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "em_contato", label: "Em contato" },
  { value: "agendado", label: "Agendado" },
  { value: "compareceu", label: "Compareceu" },
  { value: "fechado", label: "Fechado" },
];

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const filtered = useMemo(() => {
    return conversations.filter((conv) => {
      if (search && !conv.leadName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && conv.status !== statusFilter) return false;
      if (onlyUnread && conv.unread === 0) return false;
      return true;
    });
  }, [conversations, search, statusFilter, onlyUnread]);

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Conversas</h3>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadTotal}
              </span>
            )}
            <span className="text-xs text-gray-400">{filtered.length} de {conversations.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Unread toggle */}
        <button
          onClick={() => setOnlyUnread((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors mb-3",
            onlyUnread
              ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          )}
        >
          <MessageCircle className="h-3 w-3" />
          Não lidas
          {unreadTotal > 0 && (
            <span className={cn(
              "text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
              onlyUnread ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
            )}>
              {unreadTotal}
            </span>
          )}
        </button>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                statusFilter === f.value
                  ? "bg-gray-800 text-white border-gray-800"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.leadId}
              onClick={() => onSelect(conv.leadId)}
              className={cn(
                "w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                selectedId === conv.leadId && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {conv.leadName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn(
                      "text-sm truncate",
                      conv.unread > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-900"
                    )}>
                      {conv.leadName}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastTime}</span>
                  </div>
                  <p className={cn(
                    "text-xs truncate mb-1.5",
                    conv.unread > 0 ? "text-gray-700" : "text-gray-500"
                  )}>
                    {conv.lastMessage}
                  </p>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conv.status])}>
                    {statusLabels[conv.status]}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
