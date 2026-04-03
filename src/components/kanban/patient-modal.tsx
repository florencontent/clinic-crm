"use client";

import { useState, useRef, useEffect } from "react";
import { X, Phone, CalendarDays, MessageCircle, User, Clock, Mail, Edit2, Send, Trash2, PauseCircle, PlayCircle, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";
import { Lead, Conversation, Appointment, statusColors, reminderColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme-context";
import { EditLeadModal } from "./edit-lead-modal";
import { MarkAsLostModal } from "./mark-as-lost-modal";
import { deletePatient, toggleAgentPause, markAsLost, reactivateLead, updatePatient } from "@/lib/api";
import { useDoctors } from "@/lib/doctors-context";
import { useLanguage } from "@/lib/language-context";

interface PatientModalProps {
  lead: Lead;
  conversations: Conversation[];
  appointments: Appointment[];
  onClose: () => void;
  onOpenChat?: (leadId: string) => void;
  onSave?: (lead: Lead) => void;
  onSendMessage?: (leadId: string, text: string) => void;
  onDelete?: (id: string) => void;
  onLeadUpdate?: (lead: Lead) => void;
  followUpStage?: number;
}

type Tab = "resumo" | "conversa" | "agenda";


export function PatientModal({
  lead: initialLead,
  conversations,
  appointments,
  onClose,
  onSave,
  onSendMessage,
  onDelete,
  onLeadUpdate,
  followUpStage,
}: PatientModalProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("resumo");
  const [lead, setLead] = useState(initialLead);
  const [localDoctor, setLocalDoctor] = useState<string | undefined>(undefined);
  const { doctorNames: DOUTORES } = useDoctors();
  const [showEdit, setShowEdit] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [reagendadoOk, setReagendadoOk] = useState(false);
  const [input, setInput] = useState("");
  const { theme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversation = conversations.find((c) => c.leadId === lead.id);
  const leadAppointments = appointments.filter((a) => a.patientId === lead.id);
  const totalMessages = conversation?.messages.length || 0;
  const lastMessage = conversation?.messages[conversation.messages.length - 1];

  useEffect(() => {
    if (tab === "conversa") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [tab, conversation?.messages]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "resumo", label: t.patientModal.tabs.summary },
    { key: "conversa", label: t.patientModal.tabs.conversation, count: totalMessages },
    { key: "agenda", label: t.patientModal.tabs.appointments, count: leadAppointments.length },
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage?.(lead.id, input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "40px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "40px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleSaveLead = (updated: Lead) => {
    setLead(updated);
    setShowEdit(false);
    onSave?.(updated);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deletePatient(lead.id);
    setDeleting(false);
    if (ok) { onDelete?.(lead.id); onClose(); }
  };

  const handlePauseToggle = async () => {
    setPauseLoading(true);
    const newPaused = !lead.agentPaused;
    const ok = await toggleAgentPause(lead.id, newPaused);
    setPauseLoading(false);
    if (ok) {
      const updated = { ...lead, agentPaused: newPaused };
      setLead(updated);
      onLeadUpdate?.(updated);
    }
  };

  const handleMarkLost = async (reason: string) => {
    const ok = await markAsLost(lead.id, reason);
    if (ok) {
      const updated = { ...lead, status: "perdido" as const, lossReason: reason };
      setLead(updated);
      onLeadUpdate?.(updated);
      setShowLostModal(false);
    }
  };

  const handleTriggerReagendamento = async () => {
    setReagendando(true);
    try {
      await fetch(`/api/leads/${lead.id}/trigger-reagendamento`, { method: "POST" });
      setReagendadoOk(true);
      setTimeout(() => setReagendadoOk(false), 3000);
    } finally {
      setReagendando(false);
    }
  };

  const handleReactivate = async () => {
    const ok = await reactivateLead(lead.id);
    if (ok) {
      const updated = { ...lead, status: "em_contato" as const, lossReason: undefined };
      setLead(updated);
      onLeadUpdate?.(updated);
    }
  };

  const nextLeadAppointment = leadAppointments.find(
    (a) => new Date(a.date + "T00:00:00") >= new Date()
  ) || leadAppointments[0];

  const doctorValue = localDoctor !== undefined ? localDoctor : (lead.doctor || "");

  const handleDoctorChange = async (value: string) => {
    setLocalDoctor(value);
    const updated = { ...lead, doctor: value };
    setLead(updated);
    onLeadUpdate?.(updated);
    await updatePatient(lead.id, { doctor: value });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 px-6 py-5 text-white flex items-start justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <h3 className="text-base font-bold">{lead.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[lead.status])}>
                    {t.status[lead.status]}
                  </span>
                  {lead.status === "agendado" && lead.reminderStatus && (
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", reminderColors[lead.reminderStatus])}>
                      {t.reminder[lead.reminderStatus]}
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">{lead.source}</span>
                  {lead.status === "em_contato" && (lead.followUpStage ?? followUpStage ?? 0) >= 1 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {(lead.followUpStage ?? followUpStage ?? 0) === 5 ? "Mensagem 5 (Encerrando)" : `Mensagem ${lead.followUpStage ?? followUpStage}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Editar lead"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                  tab === t.key
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className={cn("flex-1 overflow-hidden", tab === "conversa" ? "flex flex-col" : "overflow-y-auto")}>
            {tab === "resumo" && (
              <div className="p-5 space-y-4 overflow-y-auto h-full">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">{t.patientModal.phone}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {lead.phone || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">{t.patientModal.leadSince}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {lead.date
                        ? format(new Date(lead.date + "T12:00:00"), "dd/MM/yyyy")
                        : "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">{t.patientModal.interest}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {lead.procedure || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">{t.patientModal.email}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{lead.email || "—"}</span>
                    </div>
                  </div>
                </div>


                {/* Observação */}
                {lead.notes && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800/50">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">{t.patientModal.notes}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}

                {/* Última mensagem */}
                {lastMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium mb-1">{t.patientModal.lastMessage}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{lastMessage.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{lastMessage.timestamp} · {lastMessage.sender === "clinic" ? "Clínica" : lead.name.split(" ")[0]}</p>
                  </div>
                )}

                {/* Próxima consulta */}
                {leadAppointments.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/50">
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-1">{t.patientModal.nextAppointment}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(leadAppointments[0].date + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })} às {leadAppointments[0].time}
                    </p>
                    {leadAppointments[0].procedure && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{leadAppointments[0].procedure}</p>
                    )}
                  </div>
                )}

                {/* Doutor */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-2">{t.patientModal.doctor}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {doctorValue || <span className="text-gray-400 dark:text-gray-500 font-normal">—</span>}
                  </p>
                </div>

                {/* Ticket */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Ticket</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {lead.dealValue != null
                      ? lead.dealValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "—"}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setTab("conversa")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {t.patientModal.viewConversation}
                  </span>
                </button>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Pause/Resume agent */}
                  <button
                    onClick={handlePauseToggle}
                    disabled={pauseLoading}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50",
                      lead.agentPaused
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/40"
                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    )}
                  >
                    {lead.agentPaused
                      ? <><PlayCircle className="h-3.5 w-3.5" />{t.patientModal.resumeAgent}</>
                      : <><PauseCircle className="h-3.5 w-3.5" />{t.patientModal.pauseAgent}</>
                    }
                  </button>

                  {/* Mark as lost / Reactivate */}
                  {lead.status === "perdido" ? (
                    <button
                      onClick={handleReactivate}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {t.patientModal.reactivate}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLostModal(true)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t.patientModal.markLost}
                    </button>
                  )}
                </div>

                {/* Reagendamento — só para nao_compareceu */}
                {lead.status === "nao_compareceu" && (
                  <button
                    onClick={handleTriggerReagendamento}
                    disabled={reagendando}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700/50 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${reagendando ? "animate-spin" : ""}`} />
                    {reagendadoOk ? "Fluxo iniciado!" : reagendando ? "Iniciando..." : "Iniciar reagendamento"}
                  </button>
                )}

                {/* Loss reason display */}
                {lead.status === "perdido" && lead.lossReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-100 dark:border-red-800/50">
                    <p className="text-[10px] text-red-500 dark:text-red-400 font-medium mb-1">{t.patientModal.lossReason}</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{lead.lossReason}</p>
                  </div>
                )}

                {/* Delete */}
                {confirmDelete ? (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                    <p className="text-xs text-red-600 dark:text-red-400 flex-1">{t.patientModal.confirmDelete}</p>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">{t.common.cancel}</button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "..." : t.common.delete}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-dashed border-red-200 dark:border-red-800/50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t.patientModal.deleteLead}
                  </button>
                )}
              </div>
            )}

            {tab === "conversa" && (
              <>
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                  style={{ background: theme === "dark" ? "#111827" : "#EFEAE2" }}
                >
                  {conversation && conversation.messages.length > 0 ? (
                    <>
                      {conversation.messages.map((msg, idx) => {
                        const isClinic = msg.sender === "clinic";
                        const prev = idx > 0 ? conversation.messages[idx - 1] : null;
                        const isGrouped = prev?.sender === msg.sender;
                        return (
                          <div
                            key={msg.id}
                            className={cn("flex", isClinic ? "justify-end" : "justify-start", isGrouped ? "mt-0.5" : "mt-3")}
                          >
                            <div
                              className={cn(
                                "relative max-w-[75%] px-3 py-2 text-sm shadow-sm",
                                isClinic
                                  ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-gray-100 rounded-tl-2xl rounded-bl-2xl rounded-tr-2xl"
                                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tr-2xl rounded-br-2xl rounded-tl-2xl",
                                !isGrouped && isClinic && "rounded-tr-md",
                                !isGrouped && !isClinic && "rounded-tl-md"
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                              <p className="text-[10px] text-gray-400 text-right mt-1 select-none">{msg.timestamp}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-gray-400 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded-full">{t.conversations.noMessages}</p>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="bg-[#F0F2F5] dark:bg-gray-800 px-3 py-3 border-t border-gray-100 dark:border-gray-700 flex items-end gap-2 flex-shrink-0">
                  <div className="flex-1 bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm px-4 py-2">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t.conversations.messagePlaceholder}
                      rows={1}
                      className="w-full text-sm outline-none resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed"
                      style={{ height: "40px", maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white p-2.5 rounded-full transition-colors flex-shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pb-2 bg-[#F0F2F5] dark:bg-gray-800 select-none flex-shrink-0">
                  {t.conversations.enterToSend}
                </p>
              </>
            )}

            {tab === "agenda" && (
              <div className="p-4 space-y-3">
                {leadAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">{t.patientModal.noAppointments}</div>
                ) : (
                  leadAppointments.map((apt) => (
                    <div key={apt.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {format(new Date(apt.date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{apt.time} · {apt.duration} min</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn("text-xs px-2 py-1 rounded-lg font-medium",
                            lead.status === "nao_compareceu"
                              ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          )}>
                            {lead.status === "nao_compareceu" ? "Não compareceu" : t.status.agendado}
                          </span>
                          {lead.status === "agendado" && lead.reminderStatus && (
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", reminderColors[lead.reminderStatus])}>
                              {t.reminder[lead.reminderStatus]}
                            </span>
                          )}
                        </div>
                      </div>
                      {apt.procedure && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{apt.procedure}</p>
                      )}
                      {apt.doctor && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{apt.doctor}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <EditLeadModal
          lead={lead}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveLead}
        />
      )}

      {showLostModal && (
        <MarkAsLostModal
          leadName={lead.name}
          onConfirm={handleMarkLost}
          onCancel={() => setShowLostModal(false)}
        />
      )}
    </>
  );
}
