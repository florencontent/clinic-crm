"use client";

import { Conversation, statusLabels, statusColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="w-[360px] border-r border-gray-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Conversas</h3>
        <p className="text-xs text-gray-500 mt-0.5">{conversations.length} contatos</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.leadId}
            onClick={() => onSelect(conv.leadId)}
            className={cn(
              "w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors",
              selectedId === conv.leadId && "bg-blue-50 hover:bg-blue-50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {conv.leadName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.leadName}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastTime}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-1.5">{conv.lastMessage}</p>
                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conv.status])}>
                    {statusLabels[conv.status]}
                  </span>
                  {conv.unread > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
