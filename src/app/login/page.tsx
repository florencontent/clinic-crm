"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError("Email ou senha inválidos.");
      return;
    }

    router.replace("/kanban");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding (very dark) */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "rgb(8, 8, 12)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, rgb(30,30,50) 0%, transparent 70%)" }} />
        </div>

        <Image
          src="/logo1.png"
          alt="Floren"
          width={160}
          height={60}
          className="object-contain relative z-10"
        />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "rgb(100,100,120)" }}>
            Gestão Inteligente
          </p>
          <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: "rgb(230,230,240)" }}>
            Seu CRM com<br />IA integrada
          </h2>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "rgb(90,90,110)" }}>
            Gerencie leads, automatize follow-ups e acompanhe cada paciente com inteligência artificial.
          </p>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "rgb(50,50,65)" }}>
          © 2026 Floren Odonto. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — form (deep dark blue) */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ background: "rgb(6, 14, 36)" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image
              src="/logo1.png"
              alt="Floren"
              width={140}
              height={52}
              className="object-contain"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "rgb(220,228,255)" }}>
              Bem-vindo de volta
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgb(80,100,150)" }}>
              Entre com suas credenciais para acessar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(140,160,210)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all placeholder-gray-600"
                style={{
                  background: "rgb(12, 22, 52)",
                  border: "1px solid rgb(25, 40, 90)",
                  color: "rgb(200, 215, 255)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgb(59,130,246)")}
                onBlur={(e) => (e.target.style.borderColor = "rgb(25, 40, 90)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "rgb(140,160,210)" }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 text-sm rounded-xl outline-none transition-all placeholder-gray-600"
                  style={{
                    background: "rgb(12, 22, 52)",
                    border: "1px solid rgb(25, 40, 90)",
                    color: "rgb(200, 215, 255)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgb(59,130,246)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(25, 40, 90)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgb(70,90,140)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "rgb(29, 78, 216)" }}
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : null}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
