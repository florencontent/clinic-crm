import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Floren Manage",
  description: "Gestão de vendas e relacionamento — Clínica Floren Odonto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-[#F8FAFC]">
          {children}
        </main>
      </body>
    </html>
  );
}
