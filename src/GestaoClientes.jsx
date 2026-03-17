import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";

// ============================================================
// GestaoClientes.jsx — Módulo Gestão de Clientes v1
// Isolado por empresa_id, RBAC, paginação, soft delete
// ============================================================

const formatDate = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const formatCurrency = (v) => {
  if (!v || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 15, height: 15, borderRadius: "50%", fontSize: 9, fontWeight: 800,
        background: "rgba(59,130,246,0.2)", color: "#60a5fa",
      }}>ℹ</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#cbd5e1",
          whiteSpace: "nowrap", zIndex: 100, boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
          pointerEvents: "none", maxWidth: 300,
        }}>{text}</div>
      )}
    </span>
  );
}

// Dropdown de ações
function AcoesDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer",
          color: "#94a3b8", lineHeight: 1,
        }}>⋮</button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
          background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "4px 0", minWidth: 175,
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        }}>
          {items.map((item, i) =>
            item.sep ? (
              <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
            ) : (
              <div key={i} onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
                style={{
                  padding: "8px 14px", fontSize: 12, cursor: "pointer",
                  color: item.danger ? "#f87171" : "#cbd5e1",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {item.label}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function GestaoClientes({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("lista");
  const [loading, setLoading] = useState(false);

  // --- LISTA ---
  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 });
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [perPage, setPerPage] = useState(20);

  // --- DASHBOARD ---
  const [dashboard, setDashboard] = useState(null);

  // --- FORMS ---
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({
    nome: "", documento: "", tipo_pessoa: "F", empresa: "",
    email: "", telefone: "", cep: "", logradouro: "", numero: "",
    complemento: "", bairro: "", cidade: "", uf: "", observacoes: "",
  });

  const empresaId = currentUser?.empresa_id || 1;

  // ============================================================
  // CARREGAMENTO
  // ============================================================
  const loadClientes = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/clientes-module/clientes?empresa_id=${empresaId}&page=${page}&per_page=${perPage}`;
      if (busca) url += `&busca=${encodeURIComponent(busca)}`;
      if (filtroStatus && filtroStatus !== "Todos") url += `&status=${filtroStatus}`;
      const r = await api.get(url);
      setClientes(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, per_page: perPage, total_pages: 1 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDashboard = async () => {
    try {
      const r = await api.get(`/clientes-module/dashboard?empresa_id=${empresaId}`);
      setDashboard(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (section === "lista") loadClientes(1);
    if (section === "dashboard") loadDashboard();
  }, [section]);

  useEffect(() => { if (section === "lista") loadClientes(1); }, [busca, filtroStatus, perPage]);

  // ============================================================
  // BUSCA CEP
  // ============================================================
  const buscarCep = async (cep) => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev, logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro, cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
      }
    } catch { /* silently fail */ }
  };

  // ============================================================
  // AÇÕES
  // ============================================================
  const resetForm = () => {
    setForm({ nome: "", documento: "", tipo_pessoa: "F", empresa: "", email: "", telefone: "",
      cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", observacoes: "" });
    setEditing(null);
  };

  const salvarCliente = async () => {
    if (!form.nome.trim()) { showToast?.("Nome é obrigatório", "error"); return; }
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/clientes-module/clientes/${editing.id}`, form);
        showToast?.("Cliente atualizado!", "success");
        logAction?.("clientes.editar", `Cliente ${form.nome} editado`);
      } else {
        await api.post("/clientes-module/clientes", { ...form, empresa_id: empresaId });
        showToast?.("Cliente cadastrado!", "success");
        logAction?.("clientes.criar", `Cliente ${form.nome} cadastrado`);
      }
      setShowForm(false);
      resetForm();
      loadClientes(pagination.page);
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao salvar", "error");
    } finally { setLoading(false); }
  };

  const editarCliente = (c) => {
    setEditing(c);
    setForm({
      nome: c.nome || "", documento: c.documento || c.cpf_cnpj || "",
      tipo_pessoa: c.tipo_pessoa || "F", empresa: c.empresa || "",
      email: c.email || "", telefone: c.telefone || "",
      cep: c.cep || "", logradouro: c.logradouro || "", numero: c.numero || "",
      complemento: c.complemento || "", bairro: c.bairro || "",
      cidade: c.cidade || "", uf: c.uf || "", observacoes: c.observacoes || "",
    });
    setShowForm(true);
  };

  const inativarCliente = async (id, nome) => {
    if (!window.confirm(`Inativar o cliente "${nome}"?\n\nO cliente será desativado mas permanecerá no histórico.`)) return;
    try {
      await api.put(`/clientes-module/clientes/${id}/inativar`);
      showToast?.(`Cliente "${nome}" inativado`, "success");
      logAction?.("clientes.inativar", `Cliente ${nome} inativado`);
      // Atualiza localmente para manter visível com status Inativo
      setClientes(prev => prev.map(c => c.id === id ? { ...c, ativo: false, status: "Inativo" } : c));
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const reativarCliente = async (id, nome) => {
    try {
      await api.put(`/clientes-module/clientes/${id}/reativar`);
      showToast?.(`Cliente "${nome}" reativado`, "success");
      // Atualiza localmente para refletir reativação
      setClientes(prev => prev.map(c => c.id === id ? { ...c, ativo: true, status: "Ativo" } : c));
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const verDetalhe = async (id) => {
    try {
      const r = await api.get(`/clientes-module/clientes/${id}`);
      setDetalhe(r.data);
    } catch (e) { console.error(e); }
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
    successBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#34d399" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "12px 14px", fontSize: 12, color: "#cbd5e1", borderBottom: "1px solid rgba(255,255,255,0.04)" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 30, maxWidth: 650, width: "90%", maxHeight: "85vh", overflowY: "auto" },
    sectionBtn: (active) => ({
      padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
      cursor: "pointer", border: "1px solid",
      background: active ? "rgba(234,179,8,0.9)" : "rgba(255,255,255,0.04)",
      color: active ? "#000" : "#94a3b8",
      borderColor: active ? "#eab308" : "rgba(255,255,255,0.08)",
    }),
    statCard: (color) => ({
      background: "rgba(15,23,42,0.6)", borderRadius: 16,
      border: `1px solid ${color}22`, padding: "20px 24px",
      position: "relative", overflow: "hidden",
    }),
  };

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Carregando...</p>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[
            { label: "Total Cadastrados", value: dashboard.total, icon: "👥", color: "#3b82f6" },
            { label: "Ativos", value: dashboard.ativos, icon: "✅", color: "#10b981" },
            { label: "Inativos", value: dashboard.inativos, icon: "⛔", color: "#f87171" },
            { label: "Pessoa Física", value: dashboard.pf, icon: "👤", color: "#eab308" },
            { label: "Pessoa Jurídica", value: dashboard.pj, icon: "🏢", color: "#8b5cf6" },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Últimos Cadastrados</span>
            </div>
            {dashboard.recentes?.length > 0 ? dashboard.recentes.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.nome}</span>
                <span style={{ color: "#64748b" }}>{formatDate(c.data_cadastro)}</span>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhum cliente cadastrado</p>}
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #eab308, #f97316)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Top Clientes por Contratos</span>
            </div>
            {dashboard.top_contratos?.length > 0 ? dashboard.top_contratos.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ color: "#f1f5f9" }}>{c.nome}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "#eab308", fontWeight: 700 }}>{c.total_contratos} contratos</span>
                  <span style={{ color: "#10b981" }}>{formatCurrency(c.valor_total)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhum contrato vinculado</p>}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: LISTA COM PAGINAÇÃO
  // ============================================================
  const renderLista = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* FILTROS */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}
          style={{ ...s.input, maxWidth: 280 }} />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, maxWidth: 150 }}>
          <option value="Todos">Todos</option>
          <option value="Ativo">Ativos</option>
          <option value="Inativo">Inativos</option>
        </select>
        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ ...s.input, maxWidth: 120 }}>
          <option value={10}>10 linhas</option>
          <option value={20}>20 linhas</option>
          <option value={30}>30 linhas</option>
          <option value={500}>Todas</option>
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={s.primaryBtn}>+ Novo Cliente</button>
      </div>

      {/* TABELA */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Nome", "Documento", "Tipo", "E-mail", "Telefone", "Cidade/UF", "Status", "Ações"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>
                  {loading ? "Carregando..." : "Nenhum cliente encontrado"}
                </td></tr>
              ) : clientes.map(c => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => verDetalhe(c.id)}>
                  <td style={{ ...s.td, fontWeight: 600, color: "#f1f5f9" }}>{c.nome}</td>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11 }}>{c.documento || c.cpf_cnpj || "—"}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: c.tipo_pessoa === "J" ? "rgba(139,92,246,0.15)" : "rgba(234,179,8,0.15)",
                      color: c.tipo_pessoa === "J" ? "#a78bfa" : "#facc15",
                    }}>{c.tipo_pessoa === "J" ? "PJ" : "PF"}</span>
                  </td>
                  <td style={s.td}>{c.email || "—"}</td>
                  <td style={s.td}>{c.telefone || "—"}</td>
                  <td style={s.td}>{[c.cidade, c.uf].filter(Boolean).join("/") || "—"}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: c.ativo ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
                      color: c.ativo ? "#34d399" : "#f87171",
                    }}>{c.ativo ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    <AcoesDropdown items={[
                      { label: "👁️ Ver Detalhes", onClick: () => verDetalhe(c.id) },
                      { label: "✏️ Editar", onClick: () => editarCliente(c) },
                      { sep: true },
                      ...(c.ativo
                        ? [{ label: "⛔ Inativar", onClick: () => inativarCliente(c.id, c.nome), danger: true }]
                        : [{ label: "✅ Reativar", onClick: () => reativarCliente(c.id, c.nome) }]
                      ),
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
          {pagination.total > 0
            ? `${Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–${Math.min(pagination.page * pagination.per_page, pagination.total)} de ${pagination.total}`
            : "0 clientes"
          }
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={pagination.page <= 1} onClick={() => loadClientes(pagination.page - 1)}
            style={{ ...s.dangerBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ fontSize: 12, color: "#94a3b8", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
            Página {pagination.page} de {pagination.total_pages}
          </span>
          <button disabled={pagination.page >= pagination.total_pages} onClick={() => loadClientes(pagination.page + 1)}
            style={{ ...s.dangerBtn, opacity: pagination.page >= pagination.total_pages ? 0.4 : 1 }}>Próxima</button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: DETALHE DO CLIENTE
  // ============================================================
  const renderDetalhe = () => detalhe && (
    <div style={s.modalOverlay} onClick={() => setDetalhe(null)}>
      <div style={{ ...s.modalContent, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: 18 }}>{detalhe.nome}</h3>
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {detalhe.tipo_pessoa === "J" ? "Pessoa Jurídica" : "Pessoa Física"}
              {detalhe.documento ? ` • ${detalhe.documento}` : ""}
            </span>
          </div>
          <span style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
            background: detalhe.ativo ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
            color: detalhe.ativo ? "#34d399" : "#f87171",
          }}>{detalhe.ativo ? "ATIVO" : "INATIVO"}</span>
        </div>

        {/* DADOS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "E-mail", value: detalhe.email },
            { label: "Telefone", value: detalhe.telefone },
            { label: "Empresa", value: detalhe.empresa },
            { label: "Cadastro", value: formatDate(detalhe.data_cadastro) },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: "#f1f5f9", marginTop: 2 }}>{item.value || "—"}</div>
            </div>
          ))}
        </div>

        {/* ENDEREÇO */}
        {(detalhe.logradouro || detalhe.cidade) && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#94a3b8" }}>
            📍 {[detalhe.logradouro, detalhe.numero, detalhe.complemento, detalhe.bairro, detalhe.cidade, detalhe.uf].filter(Boolean).join(", ")}
            {detalhe.cep ? ` — CEP: ${detalhe.cep}` : ""}
          </div>
        )}

        {/* RESUMO FINANCEIRO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Contratos Ativos", value: detalhe.resumo_financeiro?.contratos_ativos || 0, color: "#10b981" },
            { label: "Valor Contratos", value: formatCurrency(detalhe.resumo_financeiro?.valor_contratos_ativos), color: "#eab308" },
            { label: "Total Contratos", value: detalhe.resumo_financeiro?.total_contratos || 0, color: "#3b82f6" },
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: item.color, marginTop: 4 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* CONTRATOS */}
        {detalhe.contratos?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: "#eab308", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📝 Contratos</h4>
            {detalhe.contratos.map((ct, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#cbd5e1" }}>{ct.numero_contrato || "S/N"} — {ct.descricao || ct.tipo}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#10b981" }}>{formatCurrency(ct.valor_total)}</span>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                    background: ct.status === "ATIVO" ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                    color: ct.status === "ATIVO" ? "#34d399" : "#94a3b8",
                  }}>{ct.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LOCAÇÕES */}
        {detalhe.locacoes?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🏗️ Locações</h4>
            {detalhe.locacoes.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "#cbd5e1" }}>{l.ativo_nome} — {formatDate(l.data_inicio)}</span>
                <span style={{ color: "#10b981" }}>{formatCurrency(l.valor_contrato)}</span>
              </div>
            ))}
          </div>
        )}

        {detalhe.observacoes && (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 16 }}>
            {detalhe.observacoes}
          </div>
        )}

        <button onClick={() => setDetalhe(null)} style={{ ...s.dangerBtn, width: "100%" }}>Fechar</button>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM CADASTRO/EDIÇÃO
  // ============================================================
  const renderForm = () => showForm && (
    <div style={s.modalOverlay} onClick={() => { setShowForm(false); resetForm(); }}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 20 }}>
          {editing ? "✏️ Editar Cliente" : "👥 Novo Cliente"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Nome / Razão Social *</label>
            <input style={s.input} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Tipo Pessoa</label>
            <select style={s.input} value={form.tipo_pessoa} onChange={e => setForm({ ...form, tipo_pessoa: e.target.value })}>
              <option value="F">Pessoa Física</option>
              <option value="J">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label style={s.label}>{form.tipo_pessoa === "J" ? "CNPJ" : "CPF"}</label>
            <input style={s.input} value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} placeholder={form.tipo_pessoa === "J" ? "00.000.000/0000-00" : "000.000.000-00"} />
          </div>
          <div>
            <label style={s.label}>Empresa / Nome Fantasia</label>
            <input style={s.input} value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>E-mail</label>
            <input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Telefone</label>
            <input style={s.input} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>CEP <InfoTip text="Preencha o CEP para buscar endereço automaticamente" /></label>
            <input style={s.input} value={form.cep}
              onChange={e => setForm({ ...form, cep: e.target.value })}
              onBlur={e => buscarCep(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Logradouro</label>
            <input style={s.input} value={form.logradouro} onChange={e => setForm({ ...form, logradouro: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Número</label>
            <input style={s.input} value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Complemento</label>
            <input style={s.input} value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Bairro</label>
            <input style={s.input} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Cidade</label>
            <input style={s.input} value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>UF</label>
            <input style={s.input} maxLength={2} value={form.uf} onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Observações</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => { setShowForm(false); resetForm(); }} style={s.dangerBtn}>Cancelar</button>
          <button onClick={salvarCliente} disabled={loading || !form.nome.trim()}
            style={{ ...s.primaryBtn, opacity: loading || !form.nome.trim() ? 0.5 : 1 }}>
            {loading ? "Salvando..." : editing ? "Atualizar" : "Cadastrar Cliente"}
          </button>
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
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #3b82f6, #8b5cf6)" }} />
        <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20, fontWeight: 800 }}>Gestão de Clientes</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 20, marginLeft: 16 }}>
        Cadastro, consulta e gestão de clientes vinculados à empresa
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "dashboard", label: "Dashboard", icon: "📊" },
          { key: "lista", label: "Clientes", icon: "👥" },
        ].map(sec => (
          <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}>
            <span style={{ marginRight: 6 }}>{sec.icon}</span>{sec.label}
          </button>
        ))}
      </div>

      {section === "dashboard" && renderDashboard()}
      {section === "lista" && renderLista()}

      {renderForm()}
      {renderDetalhe()}
    </div>
  );
}