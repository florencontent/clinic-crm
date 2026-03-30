"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!session && !isLoginPage) {
      router.replace("/login");
    }
    if (session && isLoginPage) {
      router.replace("/kanban");
    }
  }, [loading, session, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
        <div className="w-8 h-8 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-[#F8FAFC] dark:bg-gray-950 transition-colors">
        {children}
      </main>
    </>
  );
}
