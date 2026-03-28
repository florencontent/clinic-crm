"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Search, RefreshCw, PauseCircle, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { PatientModal } from "@/components/kanban/patient-modal";
import { usePatients, useConversations, useAppointments } from "@/hooks/use-supabase-data";

type FollowUpLead = {
  id: string;
  name: string;
  phone: string;
  procedure_interest: string;
  source: string;
  status: string;
  follow_up_stage: number;
  follow_up_sent_at: string | null;
  created_at: string;
  agent_paused: boolean;
};

type SortField = "name" | "follow_up_stage" | "follow_up_sent_at" | "next_send";
type SortDir = "asc" | "desc";

const STAGE_CONFIG = [
  {
    stage: -1,
    label: "Todos",
    description: "",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    activeBg: "bg-gray-700 dark:bg-gray-300",
    activeText: "text-white dark:text-gray-900",
    dot: "bg-gray-400",
  },
  {
    stage: 1,
    label: "Mensagem 1",
    description: "Interesse + especialidade",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500",
    activeText: "text-white",
    dot: "bg-blue-400",
  },
  {
    stage: 2,
    label: "Mensagem 2",
    description: "Benefícios + objeções",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    text: "text-cyan-700 dark:text-cyan-300",
    activeBg: "bg-cyan-500",
    activeText: "text-white",
    dot: "bg-cyan-400",
  },
  {
    stage: 3,
    label: "Mensagem 3",
    description: "Prova social + educação",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    dot: "bg-amber-400",
  },
  {
    stage: 4,
    label: "Mensagem 4",
    description: "Depoimento emocional",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    activeBg: "bg-orange-500",
    activeText: "text-white",
    dot: "bg-orange-400",
  },
  {
    stage: 5,
    label: "Mensagem 5 (Encerrando)",
    description: "5ª mensagem enviada",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    activeBg: "bg-red-500",
    activeText: "text-white",
    dot: "bg-red-400",
  },
];

function getStageConfig(stage: number) {
  return STAGE_CONFIG.find((s) => s.stage === stage) ?? STAGE_CONFIG[1];
}

function calcNextSend(lead: FollowUpLead): Date | null {
  if (lead.follow_up_stage >= 5) return null;
  if (lead.follow_up_stage === 0) {
    const base = new Date(lead.created_at);
    base.setHours(base.getHours() + 3);
    return base;
  }
  if (!lead.follow_up_sent_at) return null;
  const base = new Date(lead.follow_up_sent_at);
  base.setDate(base.getDate() + 1);
  return base;
}

function formatNextSend(lead: FollowUpLead): { label: string; late: boolean } {
  if (lead.follow_up_stage >= 5) return { label: "—", late: false };
  const next = calcNextSend(lead);
  if (!next) return { label: "—", late: false };
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const late = diffMs < 0;
  if (late) return { label: "Atrasado", late: true };
  if (diffDays === 0) return { label: "Hoje", late: false };
  if (diffDays === 1) return { label: "Amanhã", late: false };
  return {
    label: next.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    late: false,
  };
}

function formatSentAt(sentAt: string | null): string {
  if (!sentAt) return "—";
  const d = new Date(sentAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function mapSource(source: string): string {
  if (source === "meta_ads") return "Meta Ads";
  if (source === "organico") return "Orgânico";
  if (source === "indicacao") return "Indicação";
  return "Site";
}

export default function FollowUpPage() {
  const [leads, setLeads] = useState<FollowUpLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState(-1);
  const [sortField, setSortField] = useState<SortField>("next_send");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { patients: allPatients, setPatients: setAllPatients } = usePatients();
  const { conversations, setConversations } = useConversations();
  const { appointments } = useAppointments();

  const selectedLead = allPatients.find((p) => p.id === selectedLeadId) ?? null;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("id,name,phone,procedure_interest,source,status,follow_up_stage,follow_up_sent_at,created_at,agent_paused")
      .in("status", ["novo", "em_contato", "qualificado", "perdido"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Only show leads that are in the follow-up pipeline:
      // active stages (0-4, em_contato) or completed (stage 5, perdido via follow-up)
        const filtered = data.filter((p) => {
        const stage = p.follow_up_stage ?? 0;
        return stage >= 1; // só leads que já receberam ao menos uma mensagem
      });
      setLeads(filtered as FollowUpLead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Counts per stage
  const stageCounts = STAGE_CONFIG.filter((s) => s.stage >= 1).map((s) => ({
    ...s,
    count: leads.filter((l) => (l.follow_up_stage ?? 0) === s.stage).length,
  }));
  const totalCount = leads.length;

  // Filter + search
  const filtered = leads.filter((l) => {
    const stage = l.follow_up_stage ?? 0;
    if (selectedStage >= 0 && stage !== selectedStage) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.procedure_interest?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") {
      cmp = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "follow_up_stage") {
      cmp = (a.follow_up_stage ?? 0) - (b.follow_up_stage ?? 0);
    } else if (sortField === "follow_up_sent_at") {
      const ta = a.follow_up_sent_at ? new Date(a.follow_up_sent_at).getTime() : 0;
      const tb = b.follow_up_sent_at ? new Date(b.follow_up_sent_at).getTime() : 0;
      cmp = ta - tb;
    } else if (sortField === "next_send") {
      const na = calcNextSend(a)?.getTime() ?? Infinity;
      const nb = calcNextSend(b)?.getTime() ?? Infinity;
      cmp = na - nb;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-0.5" />
      : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  return (
    <>
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Follow-up</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Leads em fluxo automático de reativação via WhatsApp
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {/* Todos */}
        <button
          onClick={() => setSelectedStage(-1)}
          className={cn(
            "rounded-xl p-4 border text-left transition-all",
            selectedStage === -1
              ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 shadow-md"
              : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
          )}
        >
          <p className={cn("text-2xl font-bold", selectedStage === -1 ? "text-white dark:text-gray-900" : "text-gray-900 dark:text-gray-100")}>
            {totalCount}
          </p>
          <p className={cn("text-xs font-medium mt-1", selectedStage === -1 ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400")}>
            Todos
          </p>
        </button>

        {stageCounts.map((s) => (
          <button
            key={s.stage}
            onClick={() => setSelectedStage(s.stage)}
            className={cn(
              "rounded-xl p-4 border text-left transition-all",
              selectedStage === s.stage
                ? `${s.activeBg} border-transparent shadow-md`
                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
            )}
          >
            <p className={cn(
              "text-2xl font-bold",
              selectedStage === s.stage ? s.activeText : "text-gray-900 dark:text-gray-100"
            )}>
              {s.count}
            </p>
            <p className={cn(
              "text-xs font-medium mt-1",
              selectedStage === s.stage ? s.activeText + " opacity-80" : "text-gray-500 dark:text-gray-400"
            )}>
              {s.label}
            </p>
            {/* Thin progress bar */}
            <div className="mt-2 h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className={cn("h-full rounded-full", s.dot)}
                style={{ width: totalCount > 0 ? `${Math.round((s.count / totalCount) * 100)}%` : "0%" }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Search */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou procedimento..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors placeholder-gray-400"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {sorted.length} lead{sorted.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th
                  className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => handleSort("name")}
                >
                  Lead <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Telefone
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Procedimento
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Origem
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => handleSort("follow_up_stage")}
                >
                  Estágio <SortIcon field="follow_up_stage" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => handleSort("follow_up_sent_at")}
                >
                  Último envio <SortIcon field="follow_up_sent_at" />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => handleSort("next_send")}
                >
                  Próximo envio <SortIcon field="next_send" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-gray-400 dark:text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-gray-400 dark:text-gray-500">
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                sorted.map((lead) => {
                  const stage = lead.follow_up_stage ?? 0;
                  const cfg = getStageConfig(stage);
                  const nextSend = formatNextSend(lead);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      {/* Lead name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {lead.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lead.name}</p>
                            {lead.agent_paused && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                                <PauseCircle className="h-3 w-3" /> Pausado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                        {lead.phone || "—"}
                      </td>

                      {/* Procedure */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {lead.procedure_interest || "—"}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {mapSource(lead.source)}
                      </td>

                      {/* Stage badge */}
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", cfg.bg, cfg.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Last sent */}
                      <td className="px-4 py-3.5">
                        {lead.follow_up_sent_at ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatSentAt(lead.follow_up_sent_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Next send */}
                      <td className="px-4 py-3.5">
                        {stage >= 5 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span className={cn(
                            "text-xs font-medium",
                            nextSend.late
                              ? "text-red-500 dark:text-red-400"
                              : nextSend.label === "Hoje"
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {nextSend.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {selectedLeadId && selectedLead && (
      <PatientModal
        lead={selectedLead}
        conversations={conversations}
        appointments={appointments}
        onClose={() => setSelectedLeadId(null)}
        onOpenChat={(id) => setSelectedLeadId(id)}
        onSave={(updated) => {
          setAllPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setSelectedLeadId(null);
        }}
        onSendMessage={(leadId, text) => {
          const conv = conversations.find((c) => c.leadId === leadId);
          setConversations((prev) =>
            prev.map((c) =>
              c.leadId === leadId
                ? { ...c, messages: [...c.messages, { id: Date.now().toString(), text, sender: "clinic", timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }] }
                : c
            )
          );
          if (conv) {
            fetch("https://florenmarketing.app.n8n.cloud/webhook/crm-v2", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: conv.phone, message: text, direction: "outbound" }),
            }).catch(() => {});
          }
        }}
        onLeadUpdate={(updated) => setAllPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        followUpStage={leads.find((l) => l.id === selectedLeadId)?.follow_up_stage}
      />
    )}
    </>
  );
}
