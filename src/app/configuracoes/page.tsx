"use client";

import Link from "next/link";
import { Tag, Calendar, MessageSquare, Bell, Settings, ChevronRight } from "lucide-react";

const sections = [
  {
    href: "/configuracoes/tickets",
    label: "Tickets e Tags",
    description: "Gerencie especialidades, procedimentos e doutores para categorizar seus leads",
    icon: Tag,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-800/50",
  },
  {
    href: "/configuracoes/agenda",
    label: "Agenda e Lembretes",
    description: "Configure horários de funcionamento, lembretes automáticos e dias de folga",
    icon: Calendar,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-800/50",
  },
  {
    href: "/configuracoes/mensagens",
    label: "Mensagens e Automação",
    description: "Templates de follow-up, mensagem de pós-consulta e fluxos automáticos",
    icon: MessageSquare,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    border: "border-purple-100 dark:border-purple-800/50",
  },
  {
    href: "/configuracoes/notificacoes",
    label: "Notificações",
    description: "Configure alertas por e-mail e push notifications para sua equipe",
    icon: Bell,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-800/50",
  },
  {
    href: "/configuracoes/geral",
    label: "Geral",
    description: "Tema (claro/escuro), idioma e logs do sistema",
    icon: Settings,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-100 dark:border-gray-700",
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h2>
        <p className="text-sm text-gray-400 mt-1">Gerencie todas as configurações do seu CRM</p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border ${s.border} shadow-sm hover:shadow-md transition-all group`}
          >
            <div className={`p-3 rounded-xl flex-shrink-0 ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
