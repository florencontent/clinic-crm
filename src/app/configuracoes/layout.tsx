"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, Calendar, MessageSquare, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const sections = [
    {
      href: "/configuracoes/tickets",
      label: t.settings.sections.tickets.label,
      icon: Tag,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      href: "/configuracoes/agenda",
      label: t.settings.sections.agenda.label,
      icon: Calendar,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      href: "/configuracoes/mensagens",
      label: t.settings.sections.messages.label,
      icon: MessageSquare,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
      href: "/configuracoes/notificacoes",
      label: t.settings.sections.notifications.label,
      icon: Bell,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      href: "/configuracoes/geral",
      label: t.settings.sections.general.label,
      icon: Settings,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-800",
    },
  ];

  return (
    <div className="flex h-full min-h-screen">
      {/* Settings sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">{t.settings.title}</p>
        {sections.map((s) => {
          const isActive = pathname === s.href || pathname.startsWith(s.href + "/");
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-700"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <div className={cn("p-1.5 rounded-lg flex-shrink-0", s.bg)}>
                <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              </div>
              {s.label}
            </Link>
          );
        })}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
