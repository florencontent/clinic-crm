import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { DoctorsProvider } from "@/lib/doctors-context";
import { AppShell } from "@/components/layout/app-shell";

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
        <AuthProvider>
          <DoctorsProvider>
            <LanguageProvider>
              <ThemeProvider>
                <AppShell>{children}</AppShell>
              </ThemeProvider>
            </LanguageProvider>
          </DoctorsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
