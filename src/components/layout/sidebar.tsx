"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Columns3, MessageCircle, Calendar, Megaphone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/kanban", label: "Kanban", icon: Columns3 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversas", label: "Conversas", icon: MessageCircle },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/meta-ads", label: "Meta Ads", icon: Megaphone },
  { href: "/videos", label: "Gerador de Vídeos", icon: Video },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center">
        <Image
          src="/logo-floren.png"
          alt="Floren Manage"
          width={140}
          height={40}
          className="object-contain"
          style={{ marginLeft: "11%" }}
          priority
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
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            FA
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Dr. Alfredo</p>
            <p className="text-xs text-gray-500">Floren Odonto</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
