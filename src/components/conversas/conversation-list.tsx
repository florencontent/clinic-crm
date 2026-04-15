"use client";

import { useState, useMemo } from "react";
import { Search, MessageCircle, Bell, Pin, PinOff, UserX, Headphones, AlertTriangle, RefreshCw, CalendarDays } from "lucide-react";
import { Conversation, Lead, LeadStatus, Appointment, statusColors, reminderColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversationListProps {
  conversations: Conversation[];
  patients: Lead[];
  appointments?: Appointment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPinContact: (leadId: string, pinned: boolean) => void;
  missedAppointmentLeadIds?: Set<string>;
  inReschedulingLeadIds?: Set<string>;
}

export function ConversationList({ conversations, patients, appointments, selectedId, onSelect, onPinContact, missedAppointmentLeadIds, inReschedulingLeadIds }: ConversationListProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const STATUS_FILTERS: { value: LeadStatus | "all"; label: string }[] = [
    { value: "all", label: t.common.all },
    { value: "em_contato", label: t.status.em_contato },
    { value: "agendado", label: t.status.agendado },
    { value: "nao_compareceu", label: t.status.nao_compareceu },
    { value: "compareceu", label: t.status.compareceu },
    { value: "fechado", label: t.status.fechado },
    { value: "perdido", label: t.status.perdido },
  ];

  const pinnedIds = useMemo(() => new Set(patients.filter((p) => p.isPinned).map((p) => p.id)), [patients]);
  const wantsHumanIds = useMemo(() => new Set(patients.filter((p) => p.wantsHuman).map((p) => p.id)), [patients]);

  // Map leadId → próxima consulta futura
  const nextAptByLead = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<string, Appointment>();
    (appointments || [])
      .filter((a) => a.patientId && new Date(a.date + "T00:00:00") >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .forEach((a) => {
        if (a.patientId && !map.has(a.patientId)) map.set(a.patientId, a);
      });
    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    return conversations.filter((conv) => {
      if (search && !conv.leadName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && conv.status !== statusFilter) return false;
      if (onlyUnread && conv.unread === 0) return false;
      return true;
    });
  }, [conversations, search, statusFilter, onlyUnread]);

  const pinned = filtered.filter((c) => pinnedIds.has(c.leadId));
  const unpinned = filtered.filter((c) => !pinnedIds.has(c.leadId));

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unread, 0);

  const renderConv = (conv: Conversation) => {
    const isPinned = pinnedIds.has(conv.leadId);
    const wantsHuman = wantsHumanIds.has(conv.leadId);
    const isMissed = missedAppointmentLeadIds?.has(conv.leadId) ?? false;
    const isRescheduling = inReschedulingLeadIds?.has(conv.leadId) ?? false;
    const nextApt = nextAptByLead.get(conv.leadId);
    return (
      <div
        key={conv.leadId}
        className="relative group"
        onMouseEnter={() => setHoveredId(conv.leadId)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          onClick={() => onSelect(conv.leadId)}
          className={cn(
            "w-full text-left p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            selectedId === conv.leadId && "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            isMissed && selectedId !== conv.leadId && "bg-red-50/40 dark:bg-red-900/10 border-l-2 border-l-red-400",
            !isMissed && isRescheduling && selectedId !== conv.leadId && "bg-orange-50/40 dark:bg-orange-900/10 border-l-2 border-l-orange-400",
            !isMissed && !isRescheduling && wantsHuman && selectedId !== conv.leadId && "bg-amber-50/60 dark:bg-amber-900/10 border-l-2 border-l-amber-400",
            !isMissed && !isRescheduling && conv.status === "nao_compareceu" && selectedId !== conv.leadId && "bg-red-50/40 dark:bg-red-900/10"
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
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isPinned && <Pin className="h-2.5 w-2.5 text-amber-500 flex-shrink-0 rotate-45" />}
                  <p className={cn(
                    "text-sm truncate",
                    conv.unread > 0 ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-900 dark:text-gray-100"
                  )}>
                    {conv.leadName}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastTime}</span>
              </div>
              <p className={cn(
                "text-xs truncate mb-1.5",
                conv.unread > 0 ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"
              )}>
                {conv.lastMessage || t.conversations.noMessages}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[conv.status])}>
                  {t.status[conv.status]}
                </span>
                {conv.status === "agendado" && conv.reminderStatus && (
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", reminderColors[conv.reminderStatus])}>
                    <Bell className="h-2.5 w-2.5" />
                    {t.reminder[conv.reminderStatus]}
                  </span>
                )}
                {isMissed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Não compareceu
                  </span>
                )}
                {!isMissed && conv.status === "nao_compareceu" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <UserX className="h-2.5 w-2.5" />
                    Não compareceu
                  </span>
                )}
                {isRescheduling && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Em reagendamento
                  </span>
                )}
                {wantsHuman && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                    <Headphones className="h-2.5 w-2.5" />
                    Quer atendente
                  </span>
                )}
                {nextApt && !isMissed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <CalendarDays className="h-2.5 w-2.5" />
                    {format(new Date(nextApt.date + "T12:00:00"), "dd/MM", { locale: ptBR })} às {nextApt.time}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Pin button — visible on hover */}
        {hoveredId === conv.leadId && (
          <button
            onClick={(e) => { e.stopPropagation(); onPinContact(conv.leadId, !isPinned); }}
            title={isPinned ? t.conversations.unpin : t.conversations.pin}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm text-gray-400 hover:text-amber-500 hover:border-amber-300 dark:hover:border-amber-600 transition-all"
          >
            {isPinned
              ? <PinOff className="h-3 w-3" />
              : <Pin className="h-3 w-3 rotate-45" />
            }
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-[400px] border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t.conversations.title}</h3>
          <div className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadTotal}
              </span>
            )}
            <span className="text-xs text-gray-400">{filtered.length} {t.common.of} {conversations.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={t.conversations.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Unread toggle */}
        <button
          onClick={() => setOnlyUnread((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors mb-3",
            onlyUnread
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium"
              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          <MessageCircle className="h-3 w-3" />
          {t.conversations.unread}
          {unreadTotal > 0 && (
            <span className={cn(
              "text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
              onlyUnread ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
                  ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-800 dark:border-gray-200"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            <p className="text-sm">{t.conversations.noConversations}</p>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <>
                <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30">
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Pin className="h-2.5 w-2.5 rotate-45" />
                    {t.conversations.pinned}
                  </p>
                </div>
                {pinned.map(renderConv)}
                {unpinned.length > 0 && (
                  <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t.common.all}</p>
                  </div>
                )}
              </>
            )}
            {unpinned.map(renderConv)}
          </>
        )}
      </div>
    </div>
  );
}
