import React, { useState, useEffect, useRef, useMemo } from "react";
import { api } from "./api";

// ============================================================
// GestaoContratos.jsx — Módulo Gestão de Contratos v1
// ============================================================

const formatCurrency = (v) => {
  if (!v || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};
const formatDate = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

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

const STATUS_MAP = {
  ATIVO:     { bg: `${C.green}15`, color: C.green, label: "Ativo", border: `${C.green}40` },
  ENCERRADO: { bg: `${C.muted}15`, color: C.subtle, label: "Encerrado", border: `${C.border}` },
  CANCELADO: { bg: `${C.red}15`, color: C.red, label: "Cancelado", border: `${C.red}40` },
};

function StatusBadge({ status }) {
  const st = STATUS_MAP[status] || { bg: `${C.muted}15`, color: C.subtle, label: status, border: C.border };
  return <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: "uppercase" }}>{st.label}</span>;
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", fontSize: 9, fontWeight: 800, background: `${C.blue}15`, color: C.blue }}>ℹ</span>
      {show && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.subtle, fontWeight: 600, whiteSpace: "nowrap", zIndex: 100, boxShadow: "0 8px 25px rgba(0,0,0,0.1)", pointerEvents: "none", maxWidth: 300 }}>{text}</div>}
    </span>
  );
}

function AcoesDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", color: C.subtle, lineHeight: 1, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F9FAFB"}>⋮</button>
      {open && <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 0", minWidth: 185, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}>
        {items.map((it, i) => it.sep
          ? <div key={i} style={{ height: 1, background: C.border, margin: "4px 0" }} />
          : <div key={i} onClick={e => { e.stopPropagation(); it.onClick(); setOpen(false); }} style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: it.danger ? C.red : C.text }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{it.label}</div>
        )}
      </div>}
    </div>
  );
}

export default function GestaoContratos({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("lista");
  const [loading, setLoading] = useState(false);

  // Data
  const [contratos, setContratos] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 20, total_pages: 1 });
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [perPage, setPerPage] = useState(20);
  const [tipos, setTipos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [detalhe, setDetalhe] = useState(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ cliente_id: "", numero_contrato: "", descricao: "", tipo: "Locação", valor_total: 0, valor_mensal: 0, data_inicio: "", data_fim: "", forma_pagamento: "", observacoes: "" });
  const [formItens, setFormItens] = useState([]);

  // Form item
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 });

  // Selects
  const [clientes, setClientes] = useState([]);
  const [ativosDisp, setAtivosDisp] = useState([]);

  const empresaId = currentUser?.empresa_id || 1;

  // ============================================================
  // CARREGAMENTO
  // ============================================================
  const loadContratos = async (page = 1) => {
    try {
      setLoading(true);
      let url = `/contratos-module/contratos?empresa_id=${empresaId}&page=${page}&per_page=${perPage}`;
      if (busca) url += `&busca=${encodeURIComponent(busca)}`;
      if (filtroStatus) url += `&status=${filtroStatus}`;
      if (filtroTipo) url += `&tipo=${encodeURIComponent(filtroTipo)}`;
      const r = await api.get(url);
      setContratos(r.data.data || []);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadDashboard = async () => {
    try { const r = await api.get(`/contratos-module/dashboard?empresa_id=${empresaId}`); setDashboard(r.data); }
    catch (e) { console.error(e); }
  };

  const loadTipos = async () => {
    try { const r = await api.get(`/contratos-module/tipos?empresa_id=${empresaId}`); setTipos(r.data || []); }
    catch { setTipos(["Locação", "Prestação de Serviço", "Manutenção", "Fornecimento"]); }
  };

  const loadClientes = async () => {
    try { const r = await api.get(`/clientes-module/compat/clientes?empresa_id=${empresaId}`); setClientes(r.data || []); }
    catch {
      try { const r = await api.get("/clientes"); setClientes(Array.isArray(r.data) ? r.data : r.data?.data || []); }
      catch { setClientes([]); }
    }
  };

  const loadAtivos = async () => {
    try { const r = await api.get(`/ativos-module/ativos?empresa_id=${empresaId}&status=DISPONIVEL`); setAtivosDisp(r.data || []); }
    catch { setAtivosDisp([]); }
  };

  useEffect(() => { loadClientes(); loadTipos(); loadAtivos(); }, []);
  useEffect(() => { if (section === "lista") loadContratos(1); if (section === "dashboard") loadDashboard(); }, [section]);
  useEffect(() => { if (section === "lista") loadContratos(1); }, [busca, filtroStatus, filtroTipo, perPage]);

  // ============================================================
  // AÇÕES
  // ============================================================
  const resetForm = () => { setForm({ cliente_id: "", numero_contrato: "", descricao: "", tipo: "Locação", valor_total: 0, valor_mensal: 0, data_inicio: "", data_fim: "", forma_pagamento: "", observacoes: "" }); setFormItens([]); setEditing(null); };

  const salvarContrato = async () => {
    if (!form.data_inicio) { showToast?.("Data de início é obrigatória", "error"); return; }
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/contratos-module/contratos/${editing.id}`, form);
        showToast?.("Contrato atualizado!", "success");
        logAction?.("contratos.editar", `Contrato ${form.numero_contrato || editing.id} editado`);
      } else {
        await api.post("/contratos-module/contratos", { ...form, empresa_id: empresaId, itens: formItens });
        showToast?.("Contrato criado!", "success");
        logAction?.("contratos.criar", `Contrato ${form.numero_contrato || "novo"} criado`);
      }
      setShowForm(false); resetForm(); loadContratos(pagination.page);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro ao salvar", "error"); }
    finally { setLoading(false); }
  };

  const editarContrato = (c) => {
    setEditing(c);
    setForm({
      cliente_id: c.cliente_id || "", numero_contrato: c.numero_contrato || "", descricao: c.descricao || "",
      tipo: c.tipo || "Locação", valor_total: c.valor_total || 0, valor_mensal: c.valor_mensal || 0,
      data_inicio: c.data_inicio ? String(c.data_inicio).split("T")[0] : "",
      data_fim: c.data_fim ? String(c.data_fim).split("T")[0] : "",
      forma_pagamento: c.forma_pagamento || "", observacoes: c.observacoes || "",
    });
    setShowForm(true);
  };

  const encerrarContrato = async (id, num) => {
    if (!window.confirm(`Encerrar o contrato "${num || id}"?`)) return;
    try {
      await api.put(`/contratos-module/contratos/${id}/encerrar`);
      showToast?.("Contrato encerrado", "success");
      logAction?.("contratos.encerrar", `Contrato ${num || id} encerrado`);
      loadContratos(pagination.page);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const cancelarContrato = async (id, num) => {
    if (!window.confirm(`Cancelar o contrato "${num || id}"?\n\nEsta ação inativa o contrato permanentemente.`)) return;
    try {
      await api.put(`/contratos-module/contratos/${id}/inativar`);
      showToast?.("Contrato cancelado", "success");
      loadContratos(pagination.page);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const verDetalhe = async (id) => {
    try { const r = await api.get(`/contratos-module/contratos/${id}`); setDetalhe(r.data); }
    catch (e) { console.error(e); }
  };

  // Item form helpers
  const addItemToForm = () => {
    const desc = itemForm.descricao_item || (itemForm.ativo_id ? ativosDisp.find(a => a.id === parseInt(itemForm.ativo_id))?.nome || "" : "");
    setFormItens(prev => [...prev, { ...itemForm, descricao_item: desc }]);
    setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 });
    setShowAddItem(false);
  };

  const addItemToExisting = async (contratoId) => {
    try {
      await api.post(`/contratos-module/contratos/${contratoId}/itens`, itemForm);
      showToast?.("Item adicionado!", "success");
      setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 });
      setShowAddItem(false);
      verDetalhe(contratoId);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const removeItemFromExisting = async (contratoId, itemId) => {
    try {
      await api.delete(`/contratos-module/contratos/${contratoId}/itens/${itemId}`);
      showToast?.("Item removido", "success");
      verDetalhe(contratoId);
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  const valorTotalItens = useMemo(() => formItens.reduce((s, i) => s + (i.valor_unitario || 0) * (i.quantidade || 1), 0), [formItens]);

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
    modalContent: { background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, maxWidth: 700, width: "92%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
    sectionBtn: (a) => ({ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", border: a ? `1px solid ${C.primary}` : `1px solid ${C.border}`, background: a ? C.primary : "#F9FAFB", color: a ? "#FFFFFF" : C.subtle, transition: "all 0.2s", boxShadow: a ? `0 4px 12px ${C.primary}33` : "none" }),
    statCard: (c) => ({ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${c}33`, padding: "20px 24px", position: "relative", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }),
  };

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: C.muted, textAlign: "center", padding: 40, fontWeight: 600 }}>Carregando dashboard...</p>;
    const d = dashboard;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
          {[
            { label: "Contratos Ativos", value: d.ativos, monetary: formatCurrency(d.valor_contratos_ativos), icon: "📝", color: C.green },
            { label: "Receita Mensal Prevista", value: formatCurrency(d.receita_mensal_prevista), icon: "💰", color: C.yellow },
            { label: "Encerrados", value: d.encerrados, icon: "✅", color: C.muted },
            { label: "Cancelados", value: d.cancelados, icon: "⛔", color: C.red },
            { label: "Valor Total Geral", value: formatCurrency(d.valor_total_geral), icon: "🏦", color: C.blue },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color, marginTop: 4, fontFamily: "monospace" }}>{c.value}</div>
              {c.monetary && <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 600 }}>{c.monetary}</div>}
            </div>
          ))}
        </div>

        {/* VENCENDO EM 30 DIAS */}
        {d.vencendo_30_dias?.length > 0 && (
          <div style={{ ...s.card, borderColor: `${C.yellow}50`, background: `${C.yellow}05` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.yellow }}>Contratos vencendo em 30 dias</span>
            </div>
            {d.vencendo_30_dias.map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.yellow}30`, fontSize: 13 }}>
                <div>
                  <span style={{ color: C.text, fontWeight: 700 }}>{v.numero || "S/N"}</span>
                  <span style={{ color: C.subtle, marginLeft: 8, fontWeight: 600 }}>— {v.cliente}</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ color: C.yellow, fontWeight: 800, fontSize: 12, padding: "2px 8px", background: `${C.yellow}15`, borderRadius: 12 }}>{v.dias_restantes}d restantes</span>
                  <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(v.valor_total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* TOP CLIENTES */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom, ${C.yellow}, ${C.primary})` }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Top Clientes</span>
            </div>
            {d.top_clientes?.length > 0 ? d.top_clientes.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.text, fontWeight: 700 }}>{c.nome}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: C.primary, fontWeight: 800 }}>{c.contratos}x</span>
                  <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(c.valor)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Sem dados</p>}
          </div>

          {/* POR TIPO */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: `linear-gradient(to bottom, ${C.purple}, ${C.blue})` }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Por Tipo</span>
            </div>
            {d.por_tipo?.length > 0 ? d.por_tipo.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.text, fontWeight: 700 }}>{t.tipo}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: C.purple, fontWeight: 800 }}>{t.quantidade}x</span>
                  <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(t.valor)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Sem dados</p>}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: LISTA
  // ============================================================
  const renderLista = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Buscar contrato..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...s.input, maxWidth: 280 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, maxWidth: 150 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
          <option value="">Todos Status</option>
          <option value="ATIVO">Ativos</option>
          <option value="ENCERRADO">Encerrados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...s.input, maxWidth: 170 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
          <option value="">Todos Tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ ...s.input, maxWidth: 120 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
          <option value={10}>10 linhas</option><option value={20}>20 linhas</option><option value={30}>30 linhas</option><option value={500}>Todas</option>
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={s.primaryBtn}>+ Novo Contrato</button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Nº", "Cliente", "Tipo", "Valor Total", "Mensal", "Início", "Fim", "Status", "Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {contratos.length === 0 ? (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40, fontWeight: 600 }}>{loading ? "Carregando..." : "Nenhum contrato encontrado"}</td></tr>
              ) : contratos.map(c => (
                <tr key={c.id} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => verDetalhe(c.id)} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...s.td, fontWeight: 800, color: C.primary, fontFamily: "monospace", fontSize: 14 }}>{c.numero_contrato || `#${c.id}`}</td>
                  <td style={{ ...s.td, fontWeight: 800, color: C.text }}>{c.cliente_nome}</td>
                  <td style={s.td}><span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: `${C.purple}15`, color: C.purple, border: `1px solid ${C.purple}40` }}>{c.tipo}</span></td>
                  <td style={{...s.td, fontWeight: 700}}>{formatCurrency(c.valor_total)}</td>
                  <td style={s.td}>{formatCurrency(c.valor_mensal)}</td>
                  <td style={{...s.td, fontSize: 12}}>{formatDate(c.data_inicio)}</td>
                  <td style={{...s.td, fontSize: 12}}>{formatDate(c.data_fim)}</td>
                  <td style={s.td}><StatusBadge status={c.status} /></td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    <AcoesDropdown items={[
                      { label: "👁️ Ver Detalhes", onClick: () => verDetalhe(c.id) },
                      { label: "✏️ Editar", onClick: () => editarContrato(c) },
                      { sep: true },
                      ...(c.status === "ATIVO" ? [
                        { label: "✅ Encerrar", onClick: () => encerrarContrato(c.id, c.numero_contrato) },
                        { label: "⛔ Cancelar", onClick: () => cancelarContrato(c.id, c.numero_contrato), danger: true },
                      ] : []),
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
        <span style={{ fontSize: 12, color: C.subtle, background: "#F9FAFB", padding: "8px 15px", borderRadius: 8, border: `1px solid ${C.border}`, fontWeight: 600 }}>
          {pagination.total > 0 ? `${Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–${Math.min(pagination.page * pagination.per_page, pagination.total)} de ${pagination.total}` : "0 contratos"}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={pagination.page <= 1} onClick={() => loadContratos(pagination.page - 1)} style={{ ...s.dangerBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ fontSize: 12, color: C.text, background: "#F9FAFB", padding: "8px 15px", borderRadius: 8, border: `1px solid ${C.border}`, fontWeight: 800 }}>Página {pagination.page} de {pagination.total_pages}</span>
          <button disabled={pagination.page >= pagination.total_pages} onClick={() => loadContratos(pagination.page + 1)} style={{ ...s.dangerBtn, opacity: pagination.page >= pagination.total_pages ? 0.4 : 1 }}>Próxima</button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: DETALHE DO CONTRATO
  // ============================================================
  const renderDetalhe = () => detalhe && (
    <div style={s.modalOverlay} onClick={() => setDetalhe(null)}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h3 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>{detalhe.numero_contrato || `Contrato #${detalhe.id}`}</h3>
            <span style={{ fontSize: 12, color: C.subtle, fontWeight: 600 }}>{detalhe.tipo} • {detalhe.cliente_nome}</span>
          </div>
          <StatusBadge status={detalhe.status} />
        </div>

        {/* INFO CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Valor Total", value: formatCurrency(detalhe.valor_total), color: C.green },
            { label: "Mensal", value: formatCurrency(detalhe.valor_mensal), color: C.yellow },
            { label: "Início", value: formatDate(detalhe.data_inicio), color: C.blue },
            { label: "Fim", value: formatDate(detalhe.data_fim), color: C.primary },
          ].map((it, i) => (
            <div key={i} style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>{it.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: it.color, marginTop: 6 }}>{it.value}</div>
            </div>
          ))}
        </div>

        {/* CLIENTE */}
        {detalhe.cliente_nome && detalhe.cliente_nome !== "Sem cliente" && (
          <div style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.subtle, fontWeight: 600 }}>
            👤 <strong style={{ color: C.text, fontWeight: 800 }}>{detalhe.cliente_nome}</strong>
            {detalhe.cliente_documento ? ` • ${detalhe.cliente_documento}` : ""}
            {detalhe.cliente_email ? ` • ${detalhe.cliente_email}` : ""}
            {detalhe.cliente_telefone ? ` • ${detalhe.cliente_telefone}` : ""}
          </div>
        )}

        {detalhe.observacoes && (
          <div style={{ fontSize: 13, color: C.subtle, fontWeight: 600, padding: "12px 16px", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 20 }}>
            <strong style={{ display: "block", marginBottom: 4, color: C.text, fontSize: 11, textTransform: "uppercase" }}>Observações:</strong>
            {detalhe.observacoes}
          </div>
        )}

        {/* ITENS */}
        <div style={{ marginBottom: 20, background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ color: C.text, fontSize: 14, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>📦 Itens do Contrato ({detalhe.itens?.length || 0})</h4>
            {detalhe.status === "ATIVO" && (
              <button onClick={() => { setShowAddItem(true); setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 }); }} style={{ ...s.successBtn, fontSize: 11, padding: "6px 12px" }}>+ Adicionar Item</button>
            )}
          </div>
          {detalhe.itens?.length > 0 ? detalhe.itens.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i === detalhe.itens.length -1 ? "none" : `1px solid ${C.border}`, fontSize: 12 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{it.nome || it.descricao_item} {it.quantidade > 1 ? <span style={{color: C.subtle}}>(×{it.quantidade})</span> : ""}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(it.valor_unitario * it.quantidade)}</span>
                {detalhe.status === "ATIVO" && (
                  <button onClick={() => removeItemFromExisting(detalhe.id, it.id)} style={{ background: `${C.red}15`, border: `1px solid ${C.red}40`, borderRadius: 6, cursor: "pointer", color: C.red, fontSize: 12, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }} title="Remover item">✕</button>
                )}
              </div>
            </div>
          )) : <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Nenhum item vinculado</p>}
        </div>

        {/* LOCAÇÕES VINCULADAS */}
        {detalhe.locacoes?.length > 0 && (
          <div style={{ marginBottom: 20, background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <h4 style={{ color: C.text, fontSize: 14, fontWeight: 800, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 6 }}>🏗️ Locações Vinculadas ({detalhe.locacoes.length})</h4>
            {detalhe.locacoes.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i === detalhe.locacoes.length -1 ? "none" : `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.subtle, fontWeight: 600 }}>{l.ativo_nome} — {formatDate(l.data_inicio)}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(l.valor_contrato)}</span>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESUMO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Receita Locações", value: formatCurrency(detalhe.resumo?.receita_locacoes), color: C.green },
            { label: "Locações Ativas", value: detalhe.resumo?.locacoes_ativas, color: C.yellow },
            { label: "Valor Itens", value: formatCurrency(detalhe.resumo?.valor_itens), color: C.purple },
          ].map((it, i) => (
            <div key={i} style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase" }}>{it.label}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: it.color, marginTop: 4 }}>{it.value}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setDetalhe(null)} style={{ ...s.dangerBtn, width: "100%", padding: "12px", fontSize: 14, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}>Fechar Detalhes</button>

        {/* MINI MODAL: ADD ITEM */}
        {showAddItem && (
          <div style={{ marginTop: 20, background: "#FFFFFF", borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
            <h4 style={{ color: C.text, fontSize: 14, fontWeight: 800, margin: "0 0 16px 0" }}>Adicionar Item ao Contrato</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={s.label}>Ativo (opcional)</label>
                <select style={s.input} value={itemForm.ativo_id} onChange={e => setItemForm({ ...itemForm, ativo_id: e.target.value ? parseInt(e.target.value) : "" })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                  <option value="">Sem vínculo com ativo</option>
                  {ativosDisp.map(a => <option key={a.id} value={a.id}>{a.nome} — {formatCurrency(a.valor_locacao_dia)}/dia</option>)}
                </select>
              </div>
              <div><label style={s.label}>Descrição</label><input style={s.input} value={itemForm.descricao_item} onChange={e => setItemForm({ ...itemForm, descricao_item: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
              <div><label style={s.label}>Valor Unitário</label><input style={s.input} type="number" step="0.01" value={itemForm.valor_unitario} onChange={e => setItemForm({ ...itemForm, valor_unitario: parseFloat(e.target.value) || 0 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
              <div><label style={s.label}>Quantidade</label><input style={s.input} type="number" value={itemForm.quantidade} onChange={e => setItemForm({ ...itemForm, quantidade: parseInt(e.target.value) || 1 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddItem(false)} style={{ ...s.dangerBtn, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}>Cancelar</button>
              <button onClick={() => addItemToExisting(detalhe.id)} style={s.successBtn}>✔️ Adicionar Item</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM
  // ============================================================
  const renderForm = () => showForm && (
    <div style={s.modalOverlay} onClick={() => { setShowForm(false); resetForm(); }}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
          <h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: 0 }}>{editing ? "Editar Contrato" : "Novo Contrato"}</h3>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Cliente</label>
            <select style={s.input} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value ? parseInt(e.target.value) : "" })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Nº Contrato <InfoTip text="Deixe vazio para gerar automaticamente" /></label>
            <input style={s.input} value={form.numero_contrato} onChange={e => setForm({ ...form, numero_contrato: e.target.value })} placeholder="Gerado Automaticamente" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={s.label}>Tipo</label>
            <select style={s.input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Data Início *</label>
            <input style={s.input} type="date" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={s.label}>Data Fim</label>
            <input style={s.input} type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={s.label}>Valor Total (R$) <InfoTip text="Recalculado automaticamente se adicionar itens abaixo" /></label>
            <input style={s.input} type="number" step="0.01" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: parseFloat(e.target.value) || 0 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={s.label}>Valor Mensal (R$) <InfoTip text="Valor de recorrência mensal do contrato" /></label>
            <input style={s.input} type="number" step="0.01" value={form.valor_mensal} onChange={e => setForm({ ...form, valor_mensal: parseFloat(e.target.value) || 0 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={s.label}>Forma de Pagamento</label>
            <select style={s.input} value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
              <option value="">Selecionar...</option>
              <option value="Boleto">Boleto</option>
              <option value="PIX">PIX</option>
              <option value="Transferência">Transferência</option>
              <option value="Cartão">Cartão</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Descrição Rápida</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Observações / Condições</label>
            <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
        </div>

        {/* ITENS (só no cadastro novo) */}
        {!editing && (
          <div style={{ marginTop: 24, background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>📦 Itens ({formItens.length}) — {formatCurrency(valorTotalItens)}</span>
              <button onClick={() => { setShowAddItem(true); setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 }); }} style={{ ...s.successBtn, fontSize: 11, padding: "6px 12px" }}>+ Adicionar Item</button>
            </div>
            
            {formItens.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i === formItens.length -1 ? "none" : `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.subtle, fontWeight: 600 }}>{it.descricao_item || `Ativo #${it.ativo_id}`} ×{it.quantidade}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: C.green, fontWeight: 800 }}>{formatCurrency(it.valor_unitario * it.quantidade)}</span>
                  <button onClick={() => setFormItens(prev => prev.filter((_, j) => j !== i))} style={{ background: `${C.red}15`, border: `1px solid ${C.red}40`, borderRadius: 6, cursor: "pointer", color: C.red, fontSize: 12, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
            ))}

            {showAddItem && (
              <div style={{ marginTop: 16, background: "#FFFFFF", borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                <h4 style={{ color: C.text, fontSize: 13, fontWeight: 800, margin: "0 0 12px 0" }}>Novo Item</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={s.label}>Ativo (opcional)</label>
                    <select style={s.input} value={itemForm.ativo_id} onChange={e => setItemForm({ ...itemForm, ativo_id: e.target.value ? parseInt(e.target.value) : "" })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                      <option value="">Sem vínculo</option>
                      {ativosDisp.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                  <div><label style={s.label}>Descrição</label><input style={s.input} value={itemForm.descricao_item} onChange={e => setItemForm({ ...itemForm, descricao_item: e.target.value })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
                  <div><label style={s.label}>Valor Unit.</label><input style={s.input} type="number" step="0.01" value={itemForm.valor_unitario} onChange={e => setItemForm({ ...itemForm, valor_unitario: parseFloat(e.target.value) || 0 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
                  <div><label style={s.label}>Qtd</label><input style={s.input} type="number" value={itemForm.quantidade} onChange={e => setItemForm({ ...itemForm, quantidade: parseInt(e.target.value) || 1 })} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} /></div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowAddItem(false)} style={{ ...s.dangerBtn, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}>Cancelar</button>
                  <button onClick={addItemToForm} style={s.successBtn}>✔️ Confirmar Item</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
          <button onClick={() => { setShowForm(false); resetForm(); }} style={{ ...s.dangerBtn, background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle }}>Cancelar</button>
          <button onClick={salvarContrato} disabled={loading || !form.data_inicio} style={{ ...s.primaryBtn, opacity: loading || !form.data_inicio ? 0.5 : 1 }}>
            {loading ? "Salvando..." : editing ? "💾 Salvar Alterações" : "➕ Criar Contrato"}
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
        <h2 style={{ color: C.text, margin: 0, fontSize: 24, fontWeight: 900 }}>Gestão de Contratos</h2>
      </div>
      <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginBottom: 24, marginLeft: 16 }}>Contratos de serviço, locação e fornecimento por empresa</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
        {[{ key: "dashboard", label: "Dashboard", icon: "📊" }, { key: "lista", label: "Contratos", icon: "📝" }].map(sec => (
          <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}>
            <span style={{ marginRight: 8 }}>{sec.icon}</span>{sec.label}
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