import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";

// ============================================================
// GestaoUsuarios.jsx — Módulo Gestão de Usuários v1
// Controle de limite por contrato, soft delete, isolamento empresa
// ============================================================

const formatDate = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

function AcoesDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>⋮</button>
      {open && <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "4px 0", minWidth: 190, boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
        {items.map((it, i) => it.sep
          ? <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
          : <div key={i} onClick={e => { e.stopPropagation(); it.onClick(); setOpen(false); }} style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", color: it.danger ? "#f87171" : it.success ? "#34d399" : "#cbd5e1" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{it.label}</div>
        )}
      </div>}
    </div>
  );
}

export default function GestaoUsuarios({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("lista");
  const [loading, setLoading] = useState(false);

  // Data
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 });
  const [limiteInfo, setLimiteInfo] = useState({ limite_usuarios: 5, usuarios_ativos: 0, vagas_disponiveis: 5, plano: "Básico" });
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDashboard = async () => {
    try { const r = await api.get(`/usuarios-module/dashboard?empresa_id=${empresaId}`); setDashboard(r.data); }
    catch (e) { console.error(e); }
  };

  const loadRoles = async () => {
    try { const r = await api.get(`/usuarios-module/roles?empresa_id=${empresaId}`); setRoles(r.data || []); }
    catch { setRoles([]); }
  };

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { if (section === "lista") loadUsuarios(1); if (section === "dashboard") loadDashboard(); }, [section]);
  useEffect(() => { if (section === "lista") loadUsuarios(1); }, [busca, incluirInativos, perPage]);

  // ============================================================
  // AÇÕES
  // ============================================================
  const resetForm = () => { setForm({ nome: "", email: "", password: "123", role_id: roles[0]?.id || "", is_master: false }); setEditing(null); };

  const salvarUsuario = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.role_id) {
      showToast?.("Preencha nome, e-mail e perfil", "error"); return;
    }
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/usuarios-module/usuarios/${editing.id}`, { nome: form.nome, email: form.email, role_id: form.role_id });
        showToast?.("Usuário atualizado!", "success");
        logAction?.("usuarios.editar", `Usuário ${form.nome} editado`);
      } else {
        const r = await api.post("/usuarios-module/usuarios", { ...form, empresa_id: empresaId });
        showToast?.(`Usuário "${form.nome}" criado! Senha: ${form.password}. Vagas restantes: ${r.data.vagas_restantes}`, "success");
        logAction?.("usuarios.criar", `Usuário ${form.nome} criado`);
      }
      setShowForm(false); resetForm(); loadUsuarios(pagination.page);
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao salvar", "error");
    } finally { setLoading(false); }
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
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const reativarUsuario = async (id, nome) => {
    try {
      await api.put(`/usuarios-module/usuarios/${id}/reativar`);
      showToast?.(`Usuário "${nome}" reativado`, "success");
      logAction?.("usuarios.reativar", `Usuário ${nome} reativado`);
      loadUsuarios(pagination.page);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro — verifique o limite de usuários", "error"); }
  };

  const resetSenha = async () => {
    if (!showResetSenha) return;
    try {
      await api.put(`/usuarios-module/usuarios/${showResetSenha.id}/reset-senha?nova_senha=${encodeURIComponent(novaSenha)}`);
      showToast?.(`Senha de "${showResetSenha.nome}" resetada para "${novaSenha}"`, "success");
      logAction?.("usuarios.reset_senha", `Resetou senha de ${showResetSenha.nome}`);
      setShowResetSenha(null); setNovaSenha("123");
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  // ============================================================
  // ESTILOS
  // ============================================================
  const s = {
    card: { background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(15,23,42,0.9)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", outline: "none" },
    label: { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4, display: "block" },
    primaryBtn: { padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #eab308, #d97706)", color: "#000" },
    dangerBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#f87171" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "12px 14px", fontSize: 12, color: "#cbd5e1", borderBottom: "1px solid rgba(255,255,255,0.04)" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 30, maxWidth: 550, width: "90%", maxHeight: "85vh", overflowY: "auto" },
    sectionBtn: (a) => ({ padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: a ? "rgba(234,179,8,0.9)" : "rgba(255,255,255,0.04)", color: a ? "#000" : "#94a3b8", borderColor: a ? "#eab308" : "rgba(255,255,255,0.08)" }),
    statCard: (c) => ({ background: "rgba(15,23,42,0.6)", borderRadius: 16, border: `1px solid ${c}22`, padding: "20px 24px", position: "relative", overflow: "hidden" }),
  };

  // ============================================================
  // BARRA DE LIMITE
  // ============================================================
  const renderLimitBar = () => {
    const pct = limiteInfo.limite_usuarios > 0 ? (limiteInfo.usuarios_ativos / limiteInfo.limite_usuarios) * 100 : 0;
    const corBarra = pct >= 90 ? "#f87171" : pct >= 70 ? "#eab308" : "#10b981";
    return (
      <div style={{ ...s.card, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Usuários: <strong style={{ color: "#f1f5f9" }}>{limiteInfo.usuarios_ativos}</strong> / {limiteInfo.limite_usuarios}
            </span>
            <span style={{ fontSize: 11, color: corBarra, fontWeight: 700 }}>
              {limiteInfo.vagas_disponiveis} vaga{limiteInfo.vagas_disponiveis !== 1 ? "s" : ""} disponíve{limiteInfo.vagas_disponiveis !== 1 ? "is" : "l"}
            </span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: corBarra, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
        </div>
        <span style={{ fontSize: 10, color: "#64748b", padding: "4px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 6, fontWeight: 600 }}>
          Plano: {limiteInfo.plano}
        </span>
      </div>
    );
  };

  // ============================================================
  // DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Carregando...</p>;
    const d = dashboard;
    const emp = d.empresa || {};
    const pct = emp.percentual_uso || 0;
    const corBarra = pct >= 90 ? "#f87171" : pct >= 70 ? "#eab308" : "#10b981";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* BARRA DE LIMITE */}
        <div style={{ ...s.card, borderColor: `${corBarra}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{emp.nome}</span>
              <span style={{ fontSize: 11, color: "#64748b", marginLeft: 10 }}>Plano: {emp.plano}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: corBarra }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: corBarra, borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
            <span>{d.ativos} ativos de {emp.limite_usuarios} permitidos</span>
            <span style={{ color: corBarra, fontWeight: 700 }}>{emp.vagas_disponiveis} vagas</span>
          </div>
        </div>

        {/* CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { label: "Total", value: d.total, icon: "👥", color: "#3b82f6" },
            { label: "Ativos", value: d.ativos, icon: "✅", color: "#10b981" },
            { label: "Inativos", value: d.inativos, icon: "⛔", color: "#f87171" },
            { label: "Masters", value: d.masters, icon: "👑", color: "#eab308" },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 2 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* POR PERFIL */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Por Perfil</span>
            </div>
            {d.por_perfil?.length > 0 ? d.por_perfil.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ color: "#f1f5f9" }}>{p.perfil}</span>
                <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{p.quantidade}</span>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Sem dados</p>}
          </div>

          {/* ÚLTIMOS CRIADOS */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #eab308)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Últimos Cadastrados</span>
            </div>
            {d.recentes?.length > 0 ? d.recentes.map((u, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <div>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{u.nome}</span>
                  <span style={{ color: "#64748b", marginLeft: 6, fontSize: 10 }}>{u.role}</span>
                </div>
                <span style={{ color: "#64748b", fontSize: 11 }}>{formatDate(u.criado_em)}</span>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Sem dados</p>}
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
        <input placeholder="🔍 Buscar usuário..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...s.input, maxWidth: 280 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
          <input type="checkbox" checked={incluirInativos} onChange={e => setIncluirInativos(e.target.checked)} />
          Mostrar inativos
        </label>
        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ ...s.input, maxWidth: 120 }}>
          <option value={10}>10 linhas</option><option value={20}>20 linhas</option><option value={30}>30 linhas</option><option value={500}>Todas</option>
        </select>
        <button onClick={() => {
          if (limiteInfo.vagas_disponiveis <= 0) {
            showToast?.(`Limite de ${limiteInfo.limite_usuarios} usuários atingido. Inative alguém ou amplie o plano.`, "error");
            return;
          }
          resetForm(); setShowForm(true);
        }} style={{ ...s.primaryBtn, opacity: limiteInfo.vagas_disponiveis <= 0 ? 0.5 : 1 }}>
          + Novo Usuário
        </button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Nome", "E-mail", "Perfil", "Master", "Status", "Criado em", "Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>{loading ? "Carregando..." : "Nenhum usuário encontrado"}</td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ ...s.td, fontWeight: 600, color: u.ativo ? "#f1f5f9" : "#64748b" }}>{u.nome}</td>
                  <td style={{ ...s.td, color: u.ativo ? "#94a3b8" : "#475569" }}>{u.email}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      background: u.role === "admin" ? "rgba(248,113,113,0.15)" : u.role === "gestor" ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)",
                      color: u.role === "admin" ? "#f87171" : u.role === "gestor" ? "#60a5fa" : "#94a3b8",
                    }}>{u.role_name || u.role}</span>
                  </td>
                  <td style={s.td}>
                    {u.is_master
                      ? <span style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>👑 MASTER</span>
                      : <span style={{ fontSize: 11, color: "#475569" }}>—</span>
                    }
                  </td>
                  <td style={s.td}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: u.ativo ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
                      color: u.ativo ? "#34d399" : "#f87171",
                    }}>{u.ativo ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td style={{ ...s.td, fontSize: 11, color: "#64748b" }}>{formatDate(u.criado_em)}</td>
                  <td style={s.td}>
                    <AcoesDropdown items={[
                      { label: "✏️ Editar", onClick: () => editarUsuario(u) },
                      { label: "🔄 Resetar Senha", onClick: () => { setShowResetSenha(u); setNovaSenha("123"); } },
                      { sep: true },
                      ...(u.ativo && !u.is_master && u.id !== currentUser?.id
                        ? [{ label: "⛔ Inativar", onClick: () => inativarUsuario(u.id, u.nome), danger: true }]
                        : []),
                      ...(!u.ativo
                        ? [{ label: "✅ Reativar", onClick: () => reativarUsuario(u.id, u.nome), success: true }]
                        : []),
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINAÇÃO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
          {pagination.total > 0 ? `${Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–${Math.min(pagination.page * pagination.per_page, pagination.total)} de ${pagination.total}` : "0 usuários"}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={pagination.page <= 1} onClick={() => loadUsuarios(pagination.page - 1)} style={{ ...s.dangerBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ fontSize: 12, color: "#94a3b8", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>Página {pagination.page} de {pagination.total_pages}</span>
          <button disabled={pagination.page >= pagination.total_pages} onClick={() => loadUsuarios(pagination.page + 1)} style={{ ...s.dangerBtn, opacity: pagination.page >= pagination.total_pages ? 0.4 : 1 }}>Próxima</button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM
  // ============================================================
  const renderForm = () => showForm && (
    <div style={s.modalOverlay} onClick={() => { setShowForm(false); resetForm(); }}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 20 }}>{editing ? "✏️ Editar Usuário" : "👤 Novo Usuário"}</h3>

        {!editing && (
          <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#34d399" }}>
            Vagas disponíveis: <strong>{limiteInfo.vagas_disponiveis}</strong> de {limiteInfo.limite_usuarios} (Plano: {limiteInfo.plano})
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Nome Completo *</label>
            <input style={s.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do colaborador" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>E-mail (Login) *</label>
            <input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" />
          </div>
          {!editing && (
            <div>
              <label style={s.label}>Senha Inicial</label>
              <input style={s.input} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="123" />
              <span style={{ fontSize: 10, color: "#64748b" }}>Obrigatório trocar no 1º login</span>
            </div>
          )}
          <div>
            <label style={s.label}>Perfil (Role) *</label>
            <select style={s.input} value={form.role_id} onChange={e => setForm({ ...form, role_id: Number(e.target.value) })}>
              <option value="">Selecione...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          {!editing && currentUser?.is_master && (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_master} onChange={e => setForm({ ...form, is_master: e.target.checked })} />
                👑 Acesso MASTER (acesso total ao sistema)
              </label>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => { setShowForm(false); resetForm(); }} style={s.dangerBtn}>Cancelar</button>
          <button onClick={salvarUsuario} disabled={loading || !form.nome || !form.email || !form.role_id}
            style={{ ...s.primaryBtn, opacity: loading || !form.nome || !form.email || !form.role_id ? 0.5 : 1 }}>
            {loading ? "Salvando..." : editing ? "Atualizar" : "Criar Usuário"}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: RESET SENHA
  // ============================================================
  const renderResetSenha = () => showResetSenha && (
    <div style={s.modalOverlay} onClick={() => setShowResetSenha(null)}>
      <div style={{ ...s.modalContent, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 16 }}>🔄 Resetar Senha</h3>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
          Resetar senha de <strong style={{ color: "#f1f5f9" }}>{showResetSenha.nome}</strong>
        </p>
        <label style={s.label}>Nova Senha Provisória</label>
        <input style={s.input} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="123" />
        <span style={{ fontSize: 10, color: "#64748b" }}>O usuário será obrigado a trocar no próximo login</span>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => setShowResetSenha(null)} style={s.dangerBtn}>Cancelar</button>
          <button onClick={resetSenha} style={s.primaryBtn}>Resetar Senha</button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #f97316, #eab308)" }} />
        <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20, fontWeight: 800 }}>Gestão de Usuários</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 20, marginLeft: 16 }}>Administração de usuários da empresa com controle de limite por contrato</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ key: "dashboard", label: "Dashboard", icon: "📊" }, { key: "lista", label: "Usuários", icon: "👤" }].map(sec => (
          <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}>
            <span style={{ marginRight: 6 }}>{sec.icon}</span>{sec.label}
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