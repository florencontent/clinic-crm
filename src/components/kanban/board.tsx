"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { X, Loader2, Search, UserPlus, Download, Upload } from "lucide-react";
import { KanbanColumn } from "./column";
import { NewLeadModal } from "./new-lead-modal";
import { ScheduleModal } from "./schedule-modal";
import { PatientModal } from "./patient-modal";
import { ImportLeadsModal } from "./import-leads-modal";
import { MarkAsLostModal } from "./mark-as-lost-modal";
import { markAsLost } from "@/lib/api";
import {
  Lead,
  LeadStatus,
  LeadSource,
} from "@/data/mock-data";
import { usePatients, useConversations, useAppointments } from "@/hooks/use-supabase-data";
import { updatePatientStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

const columns: LeadStatus[] = ["em_contato", "agendado", "compareceu", "fechado", "perdido"];


function exportLeadsCSV(leads: Lead[], statusLabels: Record<string, string>) {
  const header = ["Nome", "Telefone", "Procedimento", "Origem", "Status", "Data"].join(";");
  const rows = leads.map((l) =>
    [l.name, l.phone, l.procedure, l.source, statusLabels[l.status], l.date].join(";")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function KanbanBoard() {
  const { t } = useLanguage();
  const { patients: leads, loading, setPatients: setLeads, refresh: refreshLeads } = usePatients();

  const SOURCE_FILTERS: { value: LeadSource | "all"; label: string }[] = [
    { value: "all", label: t.kanban.allSources },
    { value: "Meta Ads", label: "Meta Ads" },
    { value: "Site", label: t.source["Site"] },
    { value: "Orgânico", label: t.source["Orgânico"] },
    { value: "Indicação", label: t.source["Indicação"] },
  ];
  const { conversations, setConversations } = useConversations();
  const { appointments } = useAppointments();

  // Leads that requested human attendant (from DB field on patient)
  const wantsHumanLeadIds = useMemo(() => {
    return new Set(leads.filter((l) => l.wantsHuman).map((l) => l.id));
  }, [leads]);

  // Leads still "agendado" whose appointment was 24h+ ago (missed consultation)
  const pastAppointmentLeadIds = useMemo(() => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agendadoIds = new Set(leads.filter((l) => l.status === "agendado").map((l) => l.id));
    return new Set(
      appointments
        .filter((a) => {
          if (!a.patientId || !agendadoIds.has(a.patientId)) return false;
          return new Date(a.date + "T" + a.time) < cutoff;
        })
        .map((a) => a.patientId) as string[]
    );
  }, [appointments, leads]);
  const searchParams = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("highlight");
    if (!id) return;
    setHighlightId(id);
    const t = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(t);
  }, [searchParams]);

  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<Lead | null>(null);
  const [profileLeadId, setProfileLeadId] = useState<string | null>(null);
  const [lostDragLead, setLostDragLead] = useState<Lead | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (search && !lead.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      return true;
    });
  }, [leads, search, sourceFilter]);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as LeadStatus;
    const lead = leads.find((l) => l.id === draggableId);

    setLeads((prev) =>
      prev.map((l) => l.id === draggableId ? { ...l, status: newStatus } : l)
    );

    updatePatientStatus(draggableId, newStatus);

    if (newStatus === "perdido" && lead) {
      // Revert optimistic update — wait for modal confirmation
      setLeads((prev) => prev.map((l) => l.id === draggableId ? { ...l, status: lead.status } : l));
      setLostDragLead(lead);
      return;
    }

    if (newStatus === "compareceu" && lead) {
      const conv = conversations.find((c) => c.leadId === draggableId);
      fetch("https://florenmarketing.app.n8n.cloud/webhook/pos-consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          phone: conv?.phone || "",
          procedure: lead.procedure || "",
        }),
      }).catch(() => {});
    }

    if (newStatus === "agendado" && lead) {
      setScheduleFor(lead);
    }
  };

  const getLeadsByStatus = (status: LeadStatus) =>
    filteredLeads.filter((lead) => lead.status === status);

  const profileLead = leads.find((l) => l.id === profileLeadId) || null;

  const hasActiveFilter = search !== "" || sourceFilter !== "all";
  const totalFiltered = filteredLeads.length;

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={t.kanban.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-400 transition-colors w-52 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Source filter */}
        <div className="flex gap-1.5 flex-wrap">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={cn(
                "text-xs px-3 py-2 rounded-lg border font-medium transition-colors",
                sourceFilter === f.value
                  ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-gray-800 dark:border-gray-200"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clear + counter */}
        {hasActiveFilter && (
          <>
            <button
              onClick={() => { setSearch(""); setSourceFilter("all"); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t.kanban.clear}
            </button>
            <span className="text-xs text-gray-400">
              {totalFiltered} {totalFiltered !== 1 ? t.kanban.leads : t.kanban.lead}
            </span>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export CSV */}
        <button
          onClick={() => exportLeadsCSV(filteredLeads, t.status)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          title="Exportar CSV"
        >
          <Download className="h-3.5 w-3.5" />
          {t.kanban.export}
        </button>

        {/* Import CSV */}
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <Upload className="h-3.5 w-3.5" />
          {t.kanban.importCSV}
        </button>

        {/* Novo Lead */}
        <button
          onClick={() => setShowNewLead(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors font-medium shadow-sm shadow-blue-200 dark:shadow-blue-900/50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t.kanban.newLead}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={getLeadsByStatus(status)}
              onOpenChat={(id) => setProfileLeadId(id)}
              onOpenProfile={(id) => setProfileLeadId(id)}
              highlightId={highlightId}
              pastAppointmentLeadIds={pastAppointmentLeadIds}
              wantsHumanLeadIds={wantsHumanLeadIds}
            />
          ))}
        </div>
      </DragDropContext>

      {/* New Lead Modal */}
      {showNewLead && (
        <NewLeadModal
          onClose={() => setShowNewLead(false)}
          onCreated={(lead) => setLeads((prev) => [lead, ...prev])}
        />
      )}

      {/* Import CSV Modal */}
      {showImport && (
        <ImportLeadsModal
          onClose={() => setShowImport(false)}
          onImported={(count) => {
            setShowImport(false);
            if (count > 0) refreshLeads();
          }}
        />
      )}

      {/* Schedule Modal */}
      {scheduleFor && (
        <ScheduleModal
          lead={scheduleFor}
          onClose={() => setScheduleFor(null)}
        />
      )}

      {/* Patient Profile Modal */}
      {profileLeadId && profileLead && (
        <PatientModal
          lead={profileLead}
          conversations={conversations}
          appointments={appointments}
          isPastMissedAppointment={pastAppointmentLeadIds.has(profileLeadId)}
          onClose={() => setProfileLeadId(null)}
          onOpenChat={(id) => setProfileLeadId(id)}
          onSave={(updated) => setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))}
          onSendMessage={handleSendMessage}
          onDelete={(id) => { setLeads((prev) => prev.filter((l) => l.id !== id)); setProfileLeadId(null); }}
          onLeadUpdate={(updated) => setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l))}
        />
      )}

      {/* Mark as Lost Modal (drag) */}
      {lostDragLead && (
        <MarkAsLostModal
          leadName={lostDragLead.name}
          onConfirm={async (reason) => {
            await markAsLost(lostDragLead.id, reason);
            setLeads((prev) => prev.map((l) => l.id === lostDragLead.id ? { ...l, status: "perdido", lossReason: reason } : l));
            setLostDragLead(null);
          }}
          onCancel={() => setLostDragLead(null)}
        />
      )}
    </>
  );
}
