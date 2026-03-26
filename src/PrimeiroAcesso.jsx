// PrimeiroAcesso.jsx — Tela de redefinição de senha no primeiro acesso
import { useState } from "react";
import { api } from "./api";
import { LogoOmni } from "./constants";

const C = {
  primary: "#F26B25",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#D4D5D6",
  red: "#D93025",
  bg: "#FFFFFF",
};

export default function PrimeiroAcesso({ pendingUser, sysLogos, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const senhasCoincide = confirmPassword === "" || confirmPassword === newPassword;
  const senhaValida = newPassword.length >= 6;
  const canSubmit = senhaValida && newPassword === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await api.put(`/rbac/usuarios/${pendingUser.id}/first-access`, { password: newPassword });
      onSuccess(res.data);
    } catch {
      alert("Erro ao salvar sua nova senha. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "12px 44px 12px 14px",
    borderRadius: 10,
    border: `1px solid ${hasError ? C.red : C.border}`,
    fontSize: 14,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    background: C.bg,
  });

  const focusHandler = (e) => {
    e.target.style.borderColor = C.primary;
    e.target.style.boxShadow = "0 0 0 3px rgba(242, 107, 37, 0.1)";
  };

  const blurHandler = (hasError) => (e) => {
    e.target.style.borderColor = hasError ? C.red : C.border;
    e.target.style.boxShadow = "none";
  };

  const EyeButton = ({ show, onToggle }) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", padding: 2,
        color: C.muted, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      title={show ? "Ocultar senha" : "Mostrar senha"}
    >
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  );

  // Password strength
  const getStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: "Muito curta", color: C.red, pct: 20 };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { label: "Fraca", color: "#E67E22", pct: 40 };
    if (score === 2) return { label: "Média", color: "#F2C037", pct: 60 };
    if (score === 3) return { label: "Boa", color: "#22A06B", pct: 80 };
    return { label: "Forte", color: "#10b981", pct: 100 };
  };

  const strength = getStrength();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: 16,
      zIndex: 10000,
    }}>
      <div style={{
        background: C.bg,
        borderRadius: 24,
        padding: "44px 40px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        border: `1px solid #E5E7EB`,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={sysLogos?.login || LogoOmni}
            alt="Omni26"
            style={{ height: 38, objectFit: "contain" }}
          />
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #F26B25, #FF9B6A)" }} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Criar Nova Senha</h2>
        </div>

        <p style={{ margin: "0 0 28px 16px", color: C.muted, fontSize: 13, fontWeight: 500, lineHeight: 1.6 }}>
          Bem-vindo(a), <strong style={{ color: C.text }}>{pendingUser?.name || "Usuário"}</strong>!
          Por segurança, defina uma nova senha para continuar.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Nova Senha */}
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: "block", fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Nova Senha <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
                style={inputStyle(false)}
                onFocus={focusHandler}
                onBlur={blurHandler(false)}
              />
              <EyeButton show={showPass} onToggle={() => setShowPass(p => !p)} />
            </div>
          </div>

          {/* Strength bar */}
          {strength && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 4, background: "#E5E7EB", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${strength.pct}%`, background: strength.color, borderRadius: 4, transition: "all 0.3s ease" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: strength.color, whiteSpace: "nowrap" }}>{strength.label}</span>
              </div>
            </div>
          )}

          {/* Confirmar Senha */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Confirmar Senha <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                style={inputStyle(!senhasCoincide)}
                onFocus={focusHandler}
                onBlur={blurHandler(!senhasCoincide)}
              />
              <EyeButton show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />
            </div>
            {!senhasCoincide && (
              <p style={{ margin: "6px 0 0 0", fontSize: 11, color: C.red, fontWeight: 600 }}>As senhas não coincidem.</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || saving}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: canSubmit && !saving ? C.primary : "#D4D5D6",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 800,
              cursor: canSubmit && !saving ? "pointer" : "not-allowed",
              boxShadow: canSubmit && !saving ? "0 4px 14px rgba(242, 107, 37, 0.3)" : "none",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spinPA 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Salvando...
              </>
            ) : "Salvar e Entrar"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", margin: "20px 0 0 0", fontSize: 11, color: C.muted, fontWeight: 500 }}>
          Sua senha temporária será substituída permanentemente.
        </p>
      </div>

      <style>{`
        @keyframes spinPA {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}