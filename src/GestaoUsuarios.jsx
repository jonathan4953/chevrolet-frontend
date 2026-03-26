import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";
import { useConfirm } from "./components/ConfirmContext"; // <-- Adicionando a pasta components/
const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  purple: "#8b5cf6",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
};

const formatDate = (d) => {
  if (!d || d === "None") return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

function AcoesDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          background: open ? "#F3F4F6" : "transparent",
          border: `1px solid ${open ? "#D4D5D6" : "transparent"}`,
          borderRadius: 8,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s",
          color: C.subtle,
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "#F3F4F6";
            e.currentTarget.style.borderColor = "#D4D5D6";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }
        }}
        title="Ações"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1.3" fill="currentColor" />
          <circle cx="8" cy="8" r="1.3" fill="currentColor" />
          <circle cx="8" cy="13" r="1.3" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div
          ref={ref}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateX(-100%)",
            zIndex: 9000,
            background: "#FFFFFF",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 4,
            minWidth: 190,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)",
            animation: "dropInGU 0.12s ease-out",
          }}
        >
          {items.map((it, i) =>
            it.sep ? (
              <div key={i} style={{ height: 1, background: C.border, margin: "2px 6px" }} />
            ) : (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  it.onClick();
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  color: it.danger ? C.red : it.success ? C.green : C.text,
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = it.danger
                    ? "rgba(217,48,37,0.06)"
                    : it.success
                    ? "rgba(34,160,107,0.06)"
                    : "#F3F4F6")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
      <style>{`@keyframes dropInGU { from { opacity: 0; transform: translateX(-100%) translateY(-4px); } to { opacity: 1; transform: translateX(-100%) translateY(0); } }`}</style>
    </>
  );
}

export default function GestaoUsuarios({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("lista");
  const [loading, setLoading] = useState(false);

  // Data
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 });
  const [limiteInfo, setLimiteInfo] = useState({
    limite_usuarios: 5,
    usuarios_ativos: 0,
    vagas_disponiveis: 5,
    plano: "Básico",
  });
  const [busca, setBusca] = useState("");
  const [incluirInativos, setIncluirInativos] = useState(false);
  const [perPage, setPerPage] = useState(20);
  const [dashboard, setDashboard] = useState(null);
  const [roles, setRoles] = useState([]);

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "", password: "123", role_id: "", is_master: false });

  // Reset senha
  const [showResetSenha, setShowResetSenha] = useState(null);
  const [novaSenha, setNovaSenha] = useState("123");

  const empresaId = currentUser?.empresa_id || 1;

  // ============================================================
  // CARREGAMENTO
  // ============================================================
  const loadUsuarios = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/usuarios-module/usuarios?empresa_id=${empresaId}&page=${page}&per_page=${perPage}`;
      if (busca) url += `&busca=${encodeURIComponent(busca)}`;
      if (incluirInativos) url += "&incluir_inativos=true";
      const r = await api.get(url);
      setUsuarios(r.data.data || []);
      setPagination(r.data.pagination);
      setLimiteInfo(r.data.limite || limiteInfo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const r = await api.get(`/usuarios-module/dashboard?empresa_id=${empresaId}`);
      setDashboard(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRoles = async () => {
    try {
      const r = await api.get(`/usuarios-module/roles?empresa_id=${empresaId}`);
      setRoles(r.data || []);
    } catch {
      setRoles([]);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (section === "lista") loadUsuarios(1);
    if (section === "dashboard") loadDashboard();
  }, [section]);

  useEffect(() => {
    if (section === "lista") loadUsuarios(1);
  }, [busca, incluirInativos, perPage]);

  // ============================================================
  // AÇÕES
  // ============================================================
  const resetForm = () => {
    setForm({ nome: "", email: "", password: "123", role_id: roles[0]?.id || "", is_master: false });
    setEditing(null);
  };

  const salvarUsuario = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.role_id) {
      showToast?.("Preencha nome, e-mail e perfil", "error");
      return;
    }
    try {
      setLoading(true);
      if (editing) {
        // Ajuste: Incluindo is_master na edição
        await api.put(`/usuarios-module/usuarios/${editing.id}`, {
          nome: form.nome,
          email: form.email,
          role_id: form.role_id,
          is_master: form.is_master,
        });
        showToast?.("Usuário atualizado!", "success");
        logAction?.("usuarios.editar", `Usuário ${form.nome} editado`);
      } else {
        const r = await api.post("/usuarios-module/usuarios", { ...form, empresa_id: empresaId });
        showToast?.(
          `Usuário "${form.nome}" criado! Senha: ${form.password}. Vagas restantes: ${r.data.vagas_restantes}`,
          "success"
        );
        logAction?.("usuarios.criar", `Usuário ${form.nome} criado`);
      }
      setShowForm(false);
      resetForm();
      loadUsuarios(pagination.page);
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao salvar", "error");
    } finally {
      setLoading(false);
    }
  };

  const editarUsuario = (u) => {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, password: "", role_id: u.role_id, is_master: u.is_master });
    setShowForm(true);
  };

  const inativarUsuario = async (id, nome) => {
    if (!window.confirm(`Inativar o usuário "${nome}"?\n\nO acesso ao sistema será revogado mas o histórico será mantido.`)) return;
    try {
      await api.put(`/usuarios-module/usuarios/${id}/inativar`);
      showToast?.(`Usuário "${nome}" inativado`, "success");
      logAction?.("usuarios.inativar", `Usuário ${nome} inativado`);
      loadUsuarios(pagination.page);
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro", "error");
    }
  };

  const reativarUsuario = async (id, nome) => {
    try {
      await api.put(`/usuarios-module/usuarios/${id}/reativar`);
      showToast?.(`Usuário "${nome}" reativado`, "success");
      logAction?.("usuarios.reativar", `Usuário ${nome} reativado`);
      loadUsuarios(pagination.page);
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro — verifique o limite de usuários", "error");
    }
  };

  const resetSenha = async () => {
    if (!showResetSenha) return;
    try {
      await api.put(`/usuarios-module/usuarios/${showResetSenha.id}/reset-senha?nova_senha=${encodeURIComponent(novaSenha)}`);
      showToast?.(`Senha de "${showResetSenha.nome}" resetada para "${novaSenha}"`, "success");
      logAction?.("usuarios.reset_senha", `Resetou senha de ${showResetSenha.nome}`);
      setShowResetSenha(null);
      setNovaSenha("123");
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro", "error");
    }
  };

  // ============================================================
  // ESTILOS
  // ============================================================
  const s = {
    card: { background: "#FFFFFF", borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FFFFFF", color: C.text, border: "1px solid #D4D5D6", outline: "none", transition: "border 0.2s" },
    label: { fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" },
    primaryBtn: { padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", border: "none", background: C.primary, color: "#FFFFFF", boxShadow: `0 4px 10px ${C.primary}33` },
    dangerBtn: { padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.red}40`, background: `${C.red}15`, color: C.red },
    successBtn: { padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", border: `1px solid ${C.green}40`, background: `${C.green}15`, color: C.green },
    th: { padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}`, background: "#F9FAFB" },
    td: { padding: "14px 16px", fontSize: 13, color: C.subtle, borderBottom: `1px solid ${C.border}`, fontWeight: 600 },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(42, 43, 45, 0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, maxWidth: 550, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
    sectionBtn: (a) => ({ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", border: a ? `1px solid ${C.primary}` : `1px solid ${C.border}`, background: a ? C.primary : "#F9FAFB", color: a ? "#FFFFFF" : C.subtle, transition: "all 0.2s", boxShadow: a ? `0 4px 12px ${C.primary}33` : "none" }),
    statCard: (c) => ({ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${c}33`, padding: "20px 24px", position: "relative", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }),
  };

  // ============================================================
  // BARRA DE LIMITE
  // ============================================================
  const renderLimitBar = () => {
    const pct = limiteInfo.limite_usuarios > 0 ? (limiteInfo.usuarios_ativos / limiteInfo.limite_usuarios) * 100 : 0;
    const corBarra = pct >= 90 ? C.red : pct >= 70 ? C.yellow : C.green;
    return (
      <div style={{ ...s.card, padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.subtle, fontWeight: 600 }}>
              Usuários: <strong style={{ color: C.text, fontWeight: 800 }}>{limiteInfo.usuarios_ativos}</strong> / {limiteInfo.limite_usuarios}
            </span>
            <span style={{ fontSize: 12, color: corBarra, fontWeight: 800 }}>
              {limiteInfo.vagas_disponiveis} vaga{limiteInfo.vagas_disponiveis !== 1 ? "s" : ""} disponíve{limiteInfo.vagas_disponiveis !== 1 ? "is" : "l"}
            </span>
          </div>
          <div style={{ height: 8, background: "#F9FAFB", borderRadius: 4, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: corBarra, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: C.text, padding: "6px 12px", background: "#F9FAFB", borderRadius: 8, border: `1px solid ${C.border}`, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Plano: {limiteInfo.plano}
        </span>
      </div>
    );
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: C.muted, textAlign: "center", padding: 40, fontWeight: 600 }}>Carregando dashboard...</p>;
    const d = dashboard;
    const emp = d.empresa || {};
    const pct = emp.percentual_uso || 0;
    const corBarra = pct >= 90 ? C.red : pct >= 70 ? C.yellow : C.green;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* BARRA DE LIMITE */}
        <div style={{ ...s.card, borderColor: `${corBarra}50`, background: `${corBarra}05` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{emp.nome}</span>
              <span style={{ fontSize: 12, color: C.subtle, marginLeft: 12, fontWeight: 600 }}>Plano: {emp.plano}</span>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: corBarra }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: "#FFFFFF", borderRadius: 5, overflow: "hidden", marginBottom: 10, border: `1px solid ${corBarra}30` }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: corBarra, borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.subtle, fontWeight: 600 }}>
            <span>{d.ativos} ativos de {emp.limite_usuarios} permitidos</span>
            <span style={{ color: corBarra, fontWeight: 800 }}>{emp.vagas_disponiveis} vagas disponíveis</span>
          </div>
        </div>

        {/* CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { label: "Total", value: d.total, icon: "👥", color: C.blue },
            { label: "Ativos", value: d.ativos, icon: "✅", color: C.green },
            { label: "Inativos", value: d.inativos, icon: "⛔", color: C.red },
            { label: "Masters", value: d.masters, icon: "👑", color: C.yellow },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* POR PERFIL */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom, ${C.purple}, ${C.blue})` }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Por Perfil</span>
            </div>
            {d.por_perfil?.length > 0 ? (
              d.por_perfil.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>{p.perfil}</span>
                  <span style={{ color: C.purple, fontWeight: 800 }}>{p.quantidade}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Sem dados</p>
            )}
          </div>

          {/* ÚLTIMOS CRIADOS */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom, ${C.green}, ${C.yellow})` }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Últimos Cadastrados</span>
            </div>
            {d.recentes?.length > 0 ? (
              d.recentes.map((u, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <div>
                    <span style={{ color: C.text, fontWeight: 700 }}>{u.nome}</span>
                    <span style={{ color: C.subtle, marginLeft: 8, fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                  </div>
                  <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>{formatDate(u.criado_em)}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Sem dados</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // LISTA
  // ============================================================
  const renderLista = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {renderLimitBar()}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍 Buscar usuário..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ ...s.input, maxWidth: 280 }}
          onFocus={(e) => (e.target.style.borderColor = C.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, fontWeight: 600, cursor: "pointer", background: "#FFFFFF", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}` }}>
          <input type="checkbox" checked={incluirInativos} onChange={(e) => setIncluirInativos(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.primary }} />
          Mostrar inativos
        </label>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          style={{ ...s.input, maxWidth: 120 }}
          onFocus={(e) => (e.target.style.borderColor = C.primary)}
          onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
        >
          <option value={10}>10 linhas</option>
          <option value={20}>20 linhas</option>
          <option value={30}>30 linhas</option>
          <option value={500}>Todas</option>
        </select>
        <button
          onClick={() => {
            if (limiteInfo.vagas_disponiveis <= 0) {
              showToast?.(`Limite de ${limiteInfo.limite_usuarios} usuários atingido. Inative alguém ou amplie o plano.`, "error");
              return;
            }
            resetForm();
            setShowForm(true);
          }}
          style={{ ...s.primaryBtn, opacity: limiteInfo.vagas_disponiveis <= 0 ? 0.5 : 1 }}
        >
          + Novo Usuário
        </button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nome", "E-mail", "Perfil", "Master", "Status", "Criado em", ""].map((h, i) => (
                  <th key={i} style={{ ...s.th, ...(h === "" ? { width: 48 } : {}) }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40, fontWeight: 600 }}>
                    {loading ? "Carregando..." : "Nenhum usuário encontrado"}
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr
                    key={u.id}
                    style={{ transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...s.td, fontWeight: 800, color: u.ativo ? C.text : C.muted }}>{u.nome}</td>
                    <td style={{ ...s.td, color: u.ativo ? C.subtle : C.muted }}>{u.email}</td>
                    <td style={s.td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          background: u.role === "admin" ? `${C.red}15` : u.role === "gestor" ? `${C.blue}15` : `${C.muted}15`,
                          color: u.role === "admin" ? C.red : u.role === "gestor" ? C.blue : C.subtle,
                          border: `1px solid ${u.role === "admin" ? C.red : u.role === "gestor" ? C.blue : C.muted}40`,
                        }}
                      >
                        {u.role_name || u.role}
                      </span>
                    </td>
                    <td style={s.td}>
                      {u.is_master ? (
                        <span style={{ background: `${C.yellow}15`, color: C.yellow, border: `1px solid ${C.yellow}40`, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                          👑 MASTER
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>—</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          background: u.ativo ? `${C.green}15` : `${C.red}15`,
                          color: u.ativo ? C.green : C.red,
                          border: `1px solid ${u.ativo ? C.green : C.red}40`,
                        }}
                      >
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: C.muted }}>{formatDate(u.criado_em)}</td>
                    <td style={{ ...s.td, textAlign: "center" }}>
                      <AcoesDropdown
                        items={[
                          { label: "✏️ Editar", onClick: () => editarUsuario(u) },
                          {
                            label: "🔄 Resetar Senha",
                            onClick: () => {
                              setShowResetSenha(u);
                              setNovaSenha("123");
                            },
                          },
                          { sep: true },
                          ...(u.ativo && !u.is_master && u.id !== currentUser?.id
                            ? [{ label: "⛔ Inativar", onClick: () => inativarUsuario(u.id, u.nome), danger: true }]
                            : []),
                          ...(!u.ativo
                            ? [{ label: "✅ Reativar", onClick: () => reativarUsuario(u.id, u.nome), success: true }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINAÇÃO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.subtle, background: "#F9FAFB", padding: "8px 15px", borderRadius: 8, border: `1px solid ${C.border}`, fontWeight: 600 }}>
          {pagination.total > 0
            ? `${Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–${Math.min(pagination.page * pagination.per_page, pagination.total)} de ${pagination.total}`
            : "0 usuários"}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadUsuarios(pagination.page - 1)}
            style={{ ...s.dangerBtn, opacity: pagination.page <= 1 ? 0.4 : 1, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}
          >
            Anterior
          </button>
          <span style={{ fontSize: 12, color: C.text, background: "#F9FAFB", padding: "8px 15px", borderRadius: 8, border: `1px solid ${C.border}`, fontWeight: 800 }}>
            Página {pagination.page} de {pagination.total_pages}
          </span>
          <button
            disabled={pagination.page >= pagination.total_pages}
            onClick={() => loadUsuarios(pagination.page + 1)}
            style={{ ...s.dangerBtn, opacity: pagination.page >= pagination.total_pages ? 0.4 : 1, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM
  // ============================================================
  const renderForm = () =>
    showForm && (
      <div
        style={s.modalOverlay}
        onClick={() => {
          setShowForm(false);
          resetForm();
        }}
      >
        <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: 0 }}>{editing ? "Editar Usuário" : "Novo Usuário"}</h3>
          </div>

          {!editing && (
            <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: C.green, fontWeight: 600 }}>
              Vagas disponíveis: <strong style={{ fontWeight: 800, fontSize: 14 }}>{limiteInfo.vagas_disponiveis}</strong> de {limiteInfo.limite_usuarios}{" "}
              <span style={{ color: C.subtle, marginLeft: 8 }}>(Plano: {limiteInfo.plano})</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={s.label}>Nome Completo *</label>
              <input
                style={s.input}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do colaborador"
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={s.label}>E-mail (Login) *</label>
              <input
                style={{ ...s.input, background: editing ? "#F9FAFB" : "#FFFFFF", opacity: editing ? 0.7 : 1 }}
                disabled={editing}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@empresa.com"
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
              />
            </div>
            {!editing && (
              <div>
                <label style={s.label}>Senha Inicial</label>
                <input
                  style={s.input}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="123"
                  onFocus={(e) => (e.target.style.borderColor = C.primary)}
                  onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
                />
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginTop: 4 }}>Obrigatório trocar no 1º login</span>
              </div>
            )}
            <div style={{ gridColumn: editing ? "1 / -1" : "auto" }}>
              <label style={s.label}>Perfil (Role) *</label>
              <select
                style={s.input}
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
              >
                <option value="">Selecione...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Ajuste: Permite que um master ative/desative outros masters na edição e na criação */}
            {currentUser?.is_master && (
              <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.text, fontWeight: 700, cursor: "pointer", background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <input
                    type="checkbox"
                    checked={form.is_master}
                    onChange={(e) => setForm({ ...form, is_master: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: C.primary, cursor: "pointer" }}
                  />
                  👑 Acesso MASTER (acesso total ao sistema)
                </label>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={{ ...s.dangerBtn, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}
            >
              Cancelar
            </button>
            <button
              onClick={salvarUsuario}
              disabled={loading || !form.nome || !form.email || !form.role_id}
              style={{ ...s.primaryBtn, opacity: loading || !form.nome || !form.email || !form.role_id ? 0.5 : 1 }}
            >
              {loading ? "Salvando..." : editing ? "💾 Salvar Alterações" : "➕ Criar Usuário"}
            </button>
          </div>
        </div>
      </div>
    );

  // ============================================================
  // MODAL: RESET SENHA
  // ============================================================
  const renderResetSenha = () =>
    showResetSenha && (
      <div style={s.modalOverlay} onClick={() => setShowResetSenha(null)}>
        <div style={{ ...s.modalContent, maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${C.blue}, #60A5FA)` }} />
            <h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: 0 }}>🔄 Resetar Senha</h3>
          </div>
          <p style={{ fontSize: 14, color: C.subtle, marginBottom: 20, fontWeight: 600 }}>
            Resetar senha do usuário <strong style={{ color: C.text, fontWeight: 800 }}>{showResetSenha.nome}</strong>
          </p>
          <div style={{ background: "#F9FAFB", padding: 16, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <label style={s.label}>Nova Senha Provisória</label>
            <input
              style={s.input}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="123"
              onFocus={(e) => (e.target.style.borderColor = C.blue)}
              onBlur={(e) => (e.target.style.borderColor = "#D4D5D6")}
            />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginTop: 8 }}>O usuário será obrigado a trocar a senha no próximo login</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
            <button onClick={() => setShowResetSenha(null)} style={{ ...s.dangerBtn, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}>
              Cancelar
            </button>
            <button onClick={resetSenha} style={{ ...s.primaryBtn, background: C.blue, boxShadow: `0 4px 10px ${C.blue}33` }}>
              Confirmar Reset
            </button>
          </div>
        </div>
      </div>
    );

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
        <h2 style={{ color: C.text, margin: 0, fontSize: 24, fontWeight: 900 }}>Gestão de Usuários</h2>
      </div>
      <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginBottom: 24, marginLeft: 16 }}>Administração de usuários da empresa com controle de limite por contrato</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        {[
          { key: "dashboard", label: "Dashboard", icon: "📊" },
          { key: "lista", label: "Usuários", icon: "👤" },
        ].map((sec) => (
          <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}>
            <span style={{ marginRight: 8 }}>{sec.icon}</span>
            {sec.label}
          </button>
        ))}
      </div>

      {section === "dashboard" && renderDashboard()}
      {section === "lista" && renderLista()}
      {renderForm()}
      {renderResetSenha()}
    </div>
  );
}