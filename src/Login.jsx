import React, { useState } from "react";
import { DottedSurface } from "./components/ui/dotted-surface";
import { Lock, User, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export default function Login({ 
  onLogin, 
  loading, 
  isFirstAccess, 
  pendingUser, 
  onFirstAccessSubmit, 
  onCancelFirstAccess,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#f8fafc] overflow-hidden">
      {/* Background dinâmico */}
      <DottedSurface className="opacity-40" />

      {/* Efeito de iluminação central */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,107,37,0.05),transparent_70%)] blur-[60px]" />

      <div className="relative z-10 w-full max-w-[400px] p-10 mx-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-[24px] shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#F26B25] rounded-lg flex items-center justify-center shadow-orange-200 shadow-lg">
                <ShieldCheck className="text-white size-6" />
            </div>
            <span className="text-2xl font-black text-[#2A2B2D] tracking-tighter">
              omni<span className="text-[#F26B25]">26</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm font-semibold tracking-tight">
            {isFirstAccess ? "CONFIGURAÇÃO DE ACESSO" : "ERP SYSTEM v3.0"}
          </p>
        </div>

        {isFirstAccess ? (
          /* FORMULÁRIO DE PRIMEIRO ACESSO (PRESERVADO) */
          <form onSubmit={onFirstAccessSubmit} className="flex flex-col gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-2">
              <p className="text-[#F26B25] text-[11px] font-bold leading-tight">
                Olá, {pendingUser?.name}. Por segurança, você precisa definir uma senha de sua autoria antes de continuar.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nova Senha</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#F26B25] outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Confirmar Nova Senha</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#F26B25] outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                className="flex-1 py-4 bg-[#F26B25] hover:bg-[#ea580c] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20"
              >
                SALVAR E ENTRAR
              </button>
              <button
                type="button"
                onClick={onCancelFirstAccess}
                className="px-4 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </form>
        ) : (
          /* FORMULÁRIO DE LOGIN NORMAL */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">E-mail Corporativo</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#F26B25] focus:ring-1 focus:ring-[#F26B25] outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Senha de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 size-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#F26B25] focus:ring-1 focus:ring-[#F26B25] outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 bg-[#F26B25] hover:bg-[#ea580c] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"} 
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                &copy; 2026 4A PULSE • Tecnologia e Inteligência
            </span>
        </div>
      </div>
    </div>
  );
}