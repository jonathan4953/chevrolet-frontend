import React, { useState } from "react";
import { api } from "./api";
import { LogoOmni } from "./constants";
import DottedSurface from "./DottedSurface"; // Importando o background 3D

// ============================================================
// COMPONENTE: Tela de Verificação 2FA (app OU email)
// ============================================================
function TwoFactorVerify({ email, method = "app", maskedEmail = "", onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const isEmail = method === "email";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post('/rbac/2fa/verify', { email, code });
      onVerified(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Código inválido. Tente novamente.";
      setError(msg);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      const res = await api.post('/rbac/2fa/resend-email', { email });
      setResendMsg(res.data.message || "Código reenviado!");
    } catch (err) {
      setError(err?.response?.data?.detail || "Erro ao reenviar código.");
    } finally {
      setResending(false);
    }
  };

  const styles2FA = {
    overlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(248, 250, 252, 0.85)",
      backdropFilter: "blur(20px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10001,
      animation: "fadeIn2FA 0.3s ease-out",
    },
    card: {
      backgroundColor: "#FFFFFF",
      padding: "50px 40px",
      borderRadius: "24px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
    },
    icon: { fontSize: "48px", marginBottom: "20px" },
    title: { color: "#0f172a", margin: "0 0 8px 0", fontWeight: "800", fontSize: "22px" },
    subtitle: { color: "#64748b", fontSize: "14px", marginBottom: "30px", lineHeight: "1.5" },
    errorBox: { backgroundColor: "rgba(217, 48, 37, 0.1)", color: "#D93025", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", border: "1px solid rgba(217, 48, 37, 0.3)", fontWeight: "500" },
    successBox: { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#059669", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "20px", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: "500" },
    codeInput: { width: "100%", padding: "16px", fontSize: "28px", letterSpacing: "10px", textAlign: "center", borderRadius: "12px", border: "2px solid #e2e8f0", marginBottom: "20px", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box", fontWeight: "700", backgroundColor: "#F8F9FA" },
    button: { width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#F26B25", color: "#FFFFFF", border: "none", fontWeight: "bold", fontSize: "15px", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)" },
    cancelButton: { width: "100%", padding: "12px", borderRadius: "12px", backgroundColor: "transparent", color: "#64748b", border: "none", fontWeight: "600", fontSize: "13px", cursor: "pointer", marginTop: "12px" },
    resendButton: { width: "100%", padding: "10px", borderRadius: "10px", backgroundColor: "transparent", color: "#F26B25", border: "1px solid rgba(242, 107, 37, 0.3)", fontWeight: "600", fontSize: "13px", cursor: "pointer", marginBottom: "16px", transition: "all 0.2s" },
  };

  return (
    <div style={styles2FA.overlay}>
      <div style={styles2FA.card}>
        <div style={styles2FA.icon}>{isEmail ? "📧" : "🔐"}</div>
        <h2 style={styles2FA.title}>Verificação de Segurança</h2>
        <p style={styles2FA.subtitle}>
          {isEmail
            ? <>Enviamos um código de 6 dígitos para <strong>{maskedEmail}</strong>. Verifique sua caixa de entrada.</>
            : "Digite o código de 6 dígitos gerado no seu aplicativo autenticador."
          }
        </p>

        {error && <div style={styles2FA.errorBox}>{error}</div>}
        {resendMsg && <div style={styles2FA.successBox}>{resendMsg}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text" maxLength="6" placeholder="000000" value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={styles2FA.codeInput}
            onFocus={(e) => (e.target.style.borderColor = "#F26B25")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            autoFocus disabled={loading}
          />

          {isEmail && (
            <button type="button" onClick={handleResend} disabled={resending}
              style={{ ...styles2FA.resendButton, opacity: resending ? 0.5 : 1 }}>
              {resending ? "Reenviando..." : "📩 Reenviar Código"}
            </button>
          )}

          <button type="submit" disabled={code.length < 6 || loading}
            style={{ ...styles2FA.button, opacity: code.length < 6 || loading ? 0.6 : 1, backgroundColor: loading ? "#CC4E0E" : "#F26B25" }}>
            {loading ? "VERIFICANDO..." : "CONFIRMAR ACESSO"}
          </button>
        </form>

        <button onClick={onCancel} style={styles2FA.cancelButton}>
          ← Voltar ao login
        </button>
      </div>

      <style>{`
        @keyframes fadeIn2FA {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ============================================================
// COMPONENTE: Tela de Setup 2FA (primeiro login com 2FA ativo)
// ============================================================
function TwoFactorSetup({ email, userId, qrCode, secret, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("qr"); // qr | verify

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Primeiro confirma o código e ativa o secret permanente
      await api.post('/rbac/2fa/enable', { user_id: userId, code });
      // Depois faz o verify para obter os dados completos do login
      const res = await api.post('/rbac/2fa/verify', { email, code });
      onVerified(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Código inválido. Tente novamente.";
      setError(msg);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const sSetup = {
    overlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(248, 250, 252, 0.9)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10001, animation: "fadeIn2FA 0.3s ease-out",
    },
    card: {
      backgroundColor: "#FFFFFF", padding: "40px 36px", borderRadius: "24px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.12)", width: "100%", maxWidth: "440px",
      textAlign: "center",
    },
  };

  return (
    <div style={sSetup.overlay}>
      <div style={sSetup.card}>
        {step === "qr" ? (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📱</div>
            <h2 style={{ color: "#0f172a", margin: "0 0 8px", fontWeight: 800, fontSize: "20px" }}>
              Configure seu Autenticador
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "24px", lineHeight: 1.6 }}>
              Sua conta exige verificação em duas etapas. Escaneie o QR Code 
              abaixo com o <strong>Google Authenticator</strong> ou <strong>Authy</strong>.
            </p>

            {/* QR Code */}
            {qrCode && (
              <div style={{
                display: "flex", justifyContent: "center", marginBottom: "16px",
              }}>
                <img src={qrCode} alt="QR Code 2FA" style={{
                  width: "200px", height: "200px", borderRadius: "12px",
                  border: "1px solid #E5E7EB", padding: "8px", backgroundColor: "#fff",
                }} />
              </div>
            )}

            {/* Secret manual */}
            <div style={{
              backgroundColor: "#F8F9FA", borderRadius: "10px", padding: "12px 14px",
              marginBottom: "24px", border: "1px solid #E5E7EB",
            }}>
              <p style={{ fontSize: "11px", color: "#8E9093", margin: "0 0 6px", fontWeight: 600 }}>
                Ou insira manualmente:
              </p>
              <code style={{
                fontSize: "13px", fontWeight: 700, color: "#F26B25",
                letterSpacing: "2px", fontFamily: "'Courier New', monospace",
                wordBreak: "break-all",
              }}>
                {secret?.match(/.{1,4}/g)?.join(" ")}
              </code>
            </div>

            <button onClick={() => setStep("verify")} style={{
              width: "100%", padding: "16px", borderRadius: "12px",
              backgroundColor: "#F26B25", color: "#FFFFFF", border: "none",
              fontWeight: "bold", fontSize: "15px", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)",
            }}>
              JÁ ESCANEEI →
            </button>

            <button onClick={onCancel} style={{
              width: "100%", padding: "12px", borderRadius: "12px",
              backgroundColor: "transparent", color: "#64748b", border: "none",
              fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "8px",
            }}>
              ← Voltar ao login
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔢</div>
            <h2 style={{ color: "#0f172a", margin: "0 0 8px", fontWeight: 800, fontSize: "20px" }}>
              Confirme o Código
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "24px", lineHeight: 1.6 }}>
              Digite o código de 6 dígitos que aparece no seu aplicativo autenticador.
            </p>

            {error && (
              <div style={{
                backgroundColor: "rgba(217, 48, 37, 0.1)", color: "#D93025",
                padding: "12px", borderRadius: "8px", fontSize: "13px",
                marginBottom: "16px", border: "1px solid rgba(217, 48, 37, 0.3)", fontWeight: 500,
              }}>{error}</div>
            )}

            <form onSubmit={handleVerify}>
              <input
                type="text" maxLength="6" placeholder="000000" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  width: "100%", padding: "16px", fontSize: "28px", letterSpacing: "10px",
                  textAlign: "center", borderRadius: "12px", border: "2px solid #e2e8f0",
                  marginBottom: "16px", outline: "none", fontWeight: 700,
                  backgroundColor: "#F8F9FA", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#F26B25")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                autoFocus disabled={loading}
              />
              <button type="submit" disabled={code.length < 6 || loading} style={{
                width: "100%", padding: "16px", borderRadius: "12px",
                backgroundColor: loading ? "#CC4E0E" : "#F26B25", color: "#FFFFFF",
                border: "none", fontWeight: "bold", fontSize: "15px", cursor: "pointer",
                opacity: code.length < 6 || loading ? 0.6 : 1,
                boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)",
              }}>
                {loading ? "VERIFICANDO..." : "CONFIRMAR E ATIVAR"}
              </button>
            </form>

            <button onClick={() => { setStep("qr"); setCode(""); setError(""); }} style={{
              width: "100%", padding: "12px", borderRadius: "12px",
              backgroundColor: "transparent", color: "#64748b", border: "none",
              fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "8px",
            }}>
              ← Voltar ao QR Code
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn2FA {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ============================================================
// COMPONENTE: Esqueci Minha Senha
// ============================================================
function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("email"); // email | code | newpass | done
  const [forgotEmail, setForgotEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setError("");
    try {
      await api.post('/rbac/forgot-password', { email: forgotEmail });
      setSuccess("Se o e-mail existir no sistema, você receberá um código de recuperação.");
      setStep("code");
    } catch (err) {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPass.length < 3) {
      setError("A senha deve ter pelo menos 3 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post('/rbac/forgot-password/reset', { email: forgotEmail, code, new_password: newPass });
      setSuccess(res.data.message || "Senha redefinida com sucesso!");
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.detail || "Código inválido ou expirado.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post('/rbac/forgot-password', { email: forgotEmail });
      setSuccess("Novo código enviado!");
    } catch {
      setError("Erro ao reenviar.");
    } finally {
      setLoading(false);
    }
  };

  const sty = {
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(248, 250, 252, 0.9)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, animation: "fadeIn2FA 0.3s ease-out" },
    card: { backgroundColor: "#FFFFFF", padding: "50px 40px", borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.12)", width: "100%", maxWidth: "420px", textAlign: "center" },
    title: { color: "#0f172a", margin: "0 0 8px 0", fontWeight: "800", fontSize: "22px" },
    subtitle: { color: "#64748b", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6" },
    input: { width: "100%", padding: "14px 16px", fontSize: "15px", color: "#2A2B2D", backgroundColor: "#F8F9FA", border: "1px solid #D1D5DB", borderRadius: "12px", outline: "none", boxSizing: "border-box", marginBottom: "12px", transition: "border-color 0.2s" },
    codeInput: { width: "100%", padding: "16px", fontSize: "28px", letterSpacing: "10px", textAlign: "center", borderRadius: "12px", border: "2px solid #e2e8f0", marginBottom: "16px", outline: "none", fontWeight: 700, backgroundColor: "#F8F9FA", boxSizing: "border-box" },
    btn: { width: "100%", padding: "16px", borderRadius: "12px", backgroundColor: "#F26B25", color: "#FFFFFF", border: "none", fontWeight: "bold", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)", transition: "all 0.2s" },
    btnGhost: { width: "100%", padding: "12px", borderRadius: "12px", backgroundColor: "transparent", color: "#64748b", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "12px" },
    errorBox: { backgroundColor: "rgba(217,48,37,0.1)", color: "#D93025", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid rgba(217,48,37,0.3)", fontWeight: 500 },
    successBox: { backgroundColor: "rgba(16,185,129,0.1)", color: "#059669", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", border: "1px solid rgba(16,185,129,0.3)", fontWeight: 500 },
    resendBtn: { width: "100%", padding: "10px", borderRadius: "10px", backgroundColor: "transparent", color: "#F26B25", border: "1px solid rgba(242,107,37,0.3)", fontWeight: 600, fontSize: "13px", cursor: "pointer", marginBottom: "12px" },
  };

  return (
    <div style={sty.overlay}>
      <div style={sty.card}>

        {/* ETAPA 1: Informar e-mail */}
        {step === "email" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔑</div>
            <h2 style={sty.title}>Esqueci Minha Senha</h2>
            <p style={sty.subtitle}>
              Digite seu e-mail corporativo. Enviaremos um código de recuperação.
            </p>
            {error && <div style={sty.errorBox}>{error}</div>}
            <form onSubmit={handleSendCode}>
              <input type="email" placeholder="seu.email@empresa.com" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={sty.input} required autoFocus
                onFocus={(e) => e.target.style.borderColor = "#F26B25"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              />
              <button type="submit" disabled={!forgotEmail || loading}
                style={{ ...sty.btn, opacity: !forgotEmail || loading ? 0.6 : 1 }}>
                {loading ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
              </button>
            </form>
            <button onClick={onBack} style={sty.btnGhost}>← Voltar ao login</button>
          </>
        )}

        {/* ETAPA 2: Digitar código */}
        {step === "code" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
            <h2 style={sty.title}>Verifique seu E-mail</h2>
            <p style={sty.subtitle}>
              Enviamos um código de 6 dígitos para <strong>{forgotEmail}</strong>.
            </p>
            {error && <div style={sty.errorBox}>{error}</div>}
            {success && <div style={sty.successBox}>{success}</div>}
            <input type="text" maxLength="6" placeholder="000000" value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              style={sty.codeInput} autoFocus
              onFocus={(e) => e.target.style.borderColor = "#F26B25"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
            <button onClick={handleResend} disabled={loading} style={{ ...sty.resendBtn, opacity: loading ? 0.5 : 1 }}>
              📩 Reenviar Código
            </button>
            <button onClick={() => { if (code.length === 6) setStep("newpass"); else setError("Digite o código completo."); }}
              disabled={code.length < 6}
              style={{ ...sty.btn, opacity: code.length < 6 ? 0.6 : 1 }}>
              CONTINUAR
            </button>
            <button onClick={() => { setStep("email"); setCode(""); setError(""); setSuccess(""); }} style={sty.btnGhost}>← Alterar e-mail</button>
          </>
        )}

        {/* ETAPA 3: Nova senha */}
        {step === "newpass" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
            <h2 style={sty.title}>Nova Senha</h2>
            <p style={sty.subtitle}>Defina sua nova senha de acesso.</p>
            {error && <div style={sty.errorBox}>{error}</div>}
            <form onSubmit={handleResetPassword}>
              <input type="password" placeholder="Nova senha" value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                style={sty.input} required autoFocus
                onFocus={(e) => e.target.style.borderColor = "#F26B25"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              />
              <input type="password" placeholder="Confirmar nova senha" value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                style={sty.input} required
                onFocus={(e) => e.target.style.borderColor = "#F26B25"}
                onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
              />
              <button type="submit" disabled={loading || !newPass || !confirmPass}
                style={{ ...sty.btn, opacity: loading || !newPass || !confirmPass ? 0.6 : 1 }}>
                {loading ? "REDEFININDO..." : "REDEFINIR SENHA"}
              </button>
            </form>
            <button onClick={() => setStep("code")} style={sty.btnGhost}>← Voltar</button>
          </>
        )}

        {/* ETAPA 4: Sucesso */}
        {step === "done" && (
          <>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 20px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(16,185,129,0.3)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={sty.title}>Senha Redefinida!</h2>
            <p style={sty.subtitle}>{success || "Sua senha foi atualizada com sucesso. Faça login com a nova senha."}</p>
            <button onClick={onBack} style={sty.btn}>VOLTAR AO LOGIN</button>
          </>
        )}
      </div>
      <style>{`@keyframes fadeIn2FA { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}


// ============================================================
// COMPONENTE PRINCIPAL: Login
// ============================================================
export default function Login({ sysLogos, onLoginSuccess, onFirstAccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Estado para 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [pending2FAEmail, setPending2FAEmail] = useState("");
  const [pending2FAUserId, setPending2FAUserId] = useState(null);
  const [setupData, setSetupData] = useState(null); // { qr_code, secret }
  const [twoFAMethod, setTwoFAMethod] = useState("app"); // 'app' ou 'email'
  const [maskedEmail, setMaskedEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post('/rbac/login', { email, password });
      const data = res.data;

      // ── Se o backend pede 2FA ──
      if (data.requires_2fa) {
        setPending2FAEmail(data.email);
        setPending2FAUserId(data.user_id);
        setTwoFAMethod(data.two_fa_method || "app");
        setMaskedEmail(data.masked_email || "");

        if (data.requires_2fa_setup) {
          // Primeiro login com 2FA app — precisa configurar o autenticador
          setSetupData({ qr_code: data.qr_code, secret: data.secret });
          setShow2FASetup(true);
        } else {
          // Já configurou (app) ou é email — só pedir o código
          setShow2FA(true);
        }
        return;
      }

      // ── Fluxo normal (sem 2FA) ──
      if (data.precisa_trocar_senha) {
        onFirstAccess(data);
      } else {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError("E-mail ou senha incorretos. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  // Callback quando 2FA é verificado com sucesso
  const handle2FAVerified = (userData) => {
    setShow2FA(false);
    setShow2FASetup(false);
    setSetupData(null);
    if (userData.precisa_trocar_senha) {
      onFirstAccess(userData);
    } else {
      onLoginSuccess(userData);
    }
  };

  // Callback para cancelar 2FA e voltar ao login
  const handle2FACancel = () => {
    setShow2FA(false);
    setShow2FASetup(false);
    setPending2FAEmail("");
    setPending2FAUserId(null);
    setSetupData(null);
    setTwoFAMethod("app");
    setMaskedEmail("");
    setPassword("");
  };

  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: "#E8EAED", 
      fontFamily: "'Inter', sans-serif",
      zIndex: 9999,
      boxSizing: "border-box",
      overflow: "hidden",
    },
    card: {
      position: "relative",
      zIndex: 10,
      backgroundColor: "#FFFFFF",
      padding: "50px 40px",
      borderRadius: "24px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
    },
    logoContainer: {
      marginBottom: "30px",
      display: "flex",
      justifyContent: "center",
    },
    logo: {
      width: "100%",
      maxWidth: "280px",
      height: "auto",
      objectFit: "contain",
    },
    errorBox: {
      backgroundColor: "rgba(217, 48, 37, 0.1)",
      color: "#D93025",
      padding: "12px",
      borderRadius: "8px",
      fontSize: "13px",
      marginBottom: "20px",
      border: "1px solid rgba(217, 48, 37, 0.3)",
      fontWeight: "500",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    inputGroup: {
      textAlign: "left",
    },
    label: {
      display: "block",
      fontSize: "13px",
      color: "#8E9093",
      marginBottom: "8px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "14px 16px",
      fontSize: "15px",
      color: "#2A2B2D",
      backgroundColor: "#F8F9FA",
      border: "1px solid #D1D5DB",
      borderRadius: "12px",
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    },
    button: {
      marginTop: "10px",
      padding: "16px",
      backgroundColor: "#F26B25",
      color: "#FFFFFF",
      fontSize: "15px",
      fontWeight: "bold",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "background-color 0.2s ease, transform 0.1s",
      boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)",
    },
    footerText: {
      marginTop: "30px",
      fontSize: "12px",
      color: "#8E9093",
    }
  };

  return (
    <div style={styles.container}>
      {/* O Background Animado renderizado aqui, por trás de tudo */}
      <DottedSurface /> 

      {/* Modal Esqueci Minha Senha */}
      {showForgotPassword && (
        <ForgotPassword onBack={() => setShowForgotPassword(false)} />
      )}

      {/* Modal 2FA - Verificação (já configurou ou email) */}
      {show2FA && (
        <TwoFactorVerify
          email={pending2FAEmail}
          method={twoFAMethod}
          maskedEmail={maskedEmail}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      )}

      {/* Modal 2FA - Setup (primeiro login, precisa configurar autenticador) */}
      {show2FASetup && setupData && (
        <TwoFactorSetup
          email={pending2FAEmail}
          userId={pending2FAUserId}
          qrCode={setupData.qr_code}
          secret={setupData.secret}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      )}
      
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img 
            src={sysLogos?.login || LogoOmni} 
            alt="Omni26 Logo" 
            style={styles.logo} 
          />
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail Corporativo</label>
            <input
              type="email"
              style={styles.input}
              placeholder="seu.nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#F26B25"}
              onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#F26B25"}
              onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button, 
              opacity: loading ? 0.7 : 1,
              backgroundColor: loading ? "#CC4E0E" : "#F26B25"
            }} 
            disabled={loading}
          >
            {loading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"}
          </button>
        </form>

        <button 
          onClick={() => setShowForgotPassword(true)}
          style={{
            background: "none", border: "none", color: "#F26B25", fontSize: "13px",
            fontWeight: "600", cursor: "pointer", marginTop: "20px", padding: "8px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.opacity = "0.7"}
          onMouseLeave={(e) => e.target.style.opacity = "1"}
        >
          Esqueci minha senha
        </button>

        <div style={styles.footerText}>
          &copy; 2026 Omni26 ERP. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}