"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, MessageCircle, Calendar, Megaphone, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const navItems = [
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/meta-ads", label: "Campanhas", icon: Megaphone },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

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
              {item.label}
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
              Modo Claro
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              Modo Escuro
            </>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Image
              src={theme === "dark" ? "/little-logo-white.png" : "/little-logo.png"}
              alt="Floren"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dr. Alfredo</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Floren Odonto</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
