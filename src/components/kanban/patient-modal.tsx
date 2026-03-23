"use client";

import { useState, useRef, useEffect } from "react";
import { X, Phone, CalendarDays, MessageCircle, User, Clock, Mail, Edit2, Send } from "lucide-react";
import { Lead, Conversation, Appointment, statusLabels, statusColors, TagType } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme-context";
import { EditLeadModal } from "./edit-lead-modal";

interface PatientModalProps {
  lead: Lead;
  conversations: Conversation[];
  appointments: Appointment[];
  onClose: () => void;
  onOpenChat: (leadId: string) => void;
  onSave?: (lead: Lead) => void;
  onSendMessage?: (leadId: string, text: string) => void;
}

type Tab = "resumo" | "conversa" | "agenda";

const tagTypeColors: Record<TagType, string> = {
  especialidade: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  doutor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  observacao: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export function PatientModal({
  lead: initialLead,
  conversations,
  appointments,
  onClose,
  onOpenChat,
  onSave,
  onSendMessage,
}: PatientModalProps) {
  const [tab, setTab] = useState<Tab>("resumo");
  const [lead, setLead] = useState(initialLead);
  const [showEdit, setShowEdit] = useState(false);
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
    { key: "resumo", label: "Resumo" },
    { key: "conversa", label: "Conversa", count: totalMessages },
    { key: "agenda", label: "Consultas", count: leadAppointments.length },
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
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[lead.status])}>
                    {statusLabels[lead.status]}
                  </span>
                  <span className="text-gray-400 text-xs">{lead.source}</span>
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
                    <p className="text-[10px] text-gray-400 mb-1">Telefone</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {lead.phone || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">Lead desde</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {lead.date
                        ? format(new Date(lead.date + "T12:00:00"), "dd/MM/yyyy")
                        : "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">Interesse</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {lead.procedure || "—"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-1">Email</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{lead.email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {lead.tags && lead.tags.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tagTypeColors[tag.type])}
                        >
                          {tag.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Última mensagem */}
                {lastMessage && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium mb-1">Última mensagem</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{lastMessage.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{lastMessage.timestamp} · {lastMessage.sender === "clinic" ? "Clínica" : lead.name.split(" ")[0]}</p>
                  </div>
                )}

                {/* Próxima consulta */}
                {leadAppointments.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/50">
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-1">Próxima consulta</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(leadAppointments[0].date + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })} às {leadAppointments[0].time}
                    </p>
                    {leadAppointments[0].procedure && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{leadAppointments[0].procedure}</p>
                    )}
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => setTab("conversa")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Ver conversa
                  </span>
                </button>
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
                      <p className="text-xs text-gray-400 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded-full">Nenhuma mensagem ainda</p>
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
                      placeholder="Digite uma mensagem..."
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
                  Enter para enviar · Shift+Enter para nova linha
                </p>
              </>
            )}

            {tab === "agenda" && (
              <div className="p-4 space-y-3">
                {leadAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Nenhuma consulta agendada</div>
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
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg font-medium">
                          Agendado
                        </span>
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
    </>
  );
}
