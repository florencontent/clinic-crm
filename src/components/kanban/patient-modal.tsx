"use client";

import { useState } from "react";
import { X, Phone, CalendarDays, MessageCircle, User, Clock, ChevronRight } from "lucide-react";
import { Lead, Conversation, Appointment, statusLabels, statusColors } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientModalProps {
  lead: Lead;
  conversations: Conversation[];
  appointments: Appointment[];
  onClose: () => void;
  onOpenChat: (leadId: string) => void;
}

type Tab = "resumo" | "historico" | "agenda";

export function PatientModal({ lead, conversations, appointments, onClose, onOpenChat }: PatientModalProps) {
  const [tab, setTab] = useState<Tab>("resumo");

  const conversation = conversations.find((c) => c.leadId === lead.id);
  const leadAppointments = appointments.filter((a) => a.patientId === lead.id);
  const totalMessages = conversation?.messages.length || 0;
  const lastMessage = conversation?.messages[conversation.messages.length - 1];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "resumo", label: "Resumo" },
    { key: "historico", label: "Mensagens", count: totalMessages },
    { key: "agenda", label: "Consultas", count: leadAppointments.length },
  ];

  return (
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
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
        <div className="flex-1 overflow-y-auto">
          {tab === "resumo" && (
            <div className="p-5 space-y-4">
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
                  <p className="text-[10px] text-gray-400 mb-1">Mensagens</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                    {totalMessages} mensagens
                  </div>
                </div>
              </div>

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
                onClick={() => { onOpenChat(lead.id); onClose(); }}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Abrir conversa
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {tab === "historico" && (
            <div className="p-4 space-y-2">
              {!conversation || conversation.messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Nenhuma mensagem ainda</div>
              ) : (
                [...conversation.messages].reverse().slice(0, 30).map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === "clinic" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] px-3 py-2 rounded-xl text-sm shadow-sm",
                      msg.sender === "clinic"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    )}>
                      <p className="text-xs opacity-60 mb-0.5">{msg.sender === "clinic" ? "Clínica" : lead.name.split(" ")[0]} · {msg.timestamp}</p>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
  );
}
