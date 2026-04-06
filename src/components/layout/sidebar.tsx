"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, MessageCircle, Calendar, Megaphone, Settings, Sun, Moon, GitBranch, LogOut, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// navItems are built inside the component so they can use translations

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const isDark = theme === "dark";
  const [unreadCount, setUnreadCount] = useState(0);
  const [humanCount, setHumanCount] = useState(0);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const navItems = [
    { href: "/kanban", label: t.nav.kanban, icon: Columns3 },
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/conversas", label: t.nav.conversations, icon: MessageCircle },
    { href: "/atendimento-humano", label: "Atendimento Humano", icon: Headphones },
    { href: "/follow-up", label: "Follow-up", icon: GitBranch },
    { href: "/agenda", label: t.nav.agenda, icon: Calendar },
    { href: "/meta-ads", label: t.nav.campaigns, icon: Megaphone },
    { href: "/configuracoes", label: t.nav.settings, icon: Settings },
  ];

  useEffect(() => {
    const fetchUnread = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("direction", "inbound")
        .gte("sent_at", since);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchHumanCount = async () => {
      const { count } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("wants_human", true);
      setHumanCount(count || 0);
    };
    fetchHumanCount();
    const interval = setInterval(fetchHumanCount, 15_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-colors">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center">
        <Image
          src={theme === "dark" ? "/logo-floren-white.png" : "/logo-floren.png"}
          alt="Floren Manage"
          width={140}
          height={40}
          className="object-contain"
          style={{ marginLeft: "11%" }}
          priority
          unoptimized
        />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badge =
            item.href === "/conversas" && unreadCount > 0 ? unreadCount :
            item.href === "/atendimento-humano" && humanCount > 0 ? humanCount :
            null;
          const badgeAmber = item.href === "/atendimento-humano";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                  isActive ? "bg-white/30 text-white" : badgeAmber ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                )}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" />
              {t.nav.lightMode}
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              {t.nav.darkMode}
            </>
          )}
        </button>

        {/* User info + logout */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
            isDark
              ? "overflow-hidden border border-gray-700"
              : "bg-gradient-to-br from-blue-400 to-blue-600 shadow-md shadow-blue-200"
          }`}>
            <Image
              src="/little-logo-white.png"
              alt="Floren"
              width={isDark ? 32 : 20}
              height={isDark ? 32 : 20}
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Dr. Alfredo</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
