import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/lib/theme-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Floren Manage",
  description: "Gestão de vendas e relacionamento — Clínica Floren Odonto",
  icons: {
    icon: "/logo-floren.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen bg-[#F8FAFC] dark:bg-gray-950 transition-colors">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
