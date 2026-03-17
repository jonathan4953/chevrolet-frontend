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

const STATUS_MAP = {
  ATIVO:     { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Ativo" },
  ENCERRADO: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: "Encerrado" },
  CANCELADO: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Cancelado" },
};

function StatusBadge({ status }) {
  const st = STATUS_MAP[status] || { bg: "rgba(100,116,139,0.15)", color: "#94a3b8", label: status };
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, textTransform: "uppercase" }}>{st.label}</span>;
}

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", fontSize: 9, fontWeight: 800, background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>ℹ</span>
      {show && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#cbd5e1", whiteSpace: "nowrap", zIndex: 100, boxShadow: "0 8px 25px rgba(0,0,0,0.5)", pointerEvents: "none", maxWidth: 300 }}>{text}</div>}
    </span>
  );
}

function AcoesDropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>⋮</button>
      {open && <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "4px 0", minWidth: 185, boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
        {items.map((it, i) => it.sep
          ? <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
          : <div key={i} onClick={e => { e.stopPropagation(); it.onClick(); setOpen(false); }} style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", color: it.danger ? "#f87171" : "#cbd5e1" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{it.label}</div>
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
    card: { background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(15,23,42,0.9)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", outline: "none" },
    label: { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4, display: "block" },
    primaryBtn: { padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "linear-gradient(135deg, #eab308, #d97706)", color: "#000" },
    dangerBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#f87171" },
    successBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#34d399" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "12px 14px", fontSize: 12, color: "#cbd5e1", borderBottom: "1px solid rgba(255,255,255,0.04)" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "rgba(15,23,42,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 30, maxWidth: 700, width: "92%", maxHeight: "88vh", overflowY: "auto" },
    sectionBtn: (a) => ({ padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: a ? "rgba(234,179,8,0.9)" : "rgba(255,255,255,0.04)", color: a ? "#000" : "#94a3b8", borderColor: a ? "#eab308" : "rgba(255,255,255,0.08)" }),
    statCard: (c) => ({ background: "rgba(15,23,42,0.6)", borderRadius: 16, border: `1px solid ${c}22`, padding: "20px 24px", position: "relative", overflow: "hidden" }),
  };

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Carregando...</p>;
    const d = dashboard;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
          {[
            { label: "Contratos Ativos", value: d.ativos, monetary: formatCurrency(d.valor_contratos_ativos), icon: "📝", color: "#10b981" },
            { label: "Receita Mensal Prevista", value: formatCurrency(d.receita_mensal_prevista), icon: "💰", color: "#eab308" },
            { label: "Encerrados", value: d.encerrados, icon: "✅", color: "#94a3b8" },
            { label: "Cancelados", value: d.cancelados, icon: "⛔", color: "#f87171" },
            { label: "Valor Total Geral", value: formatCurrency(d.valor_total_geral), icon: "🏦", color: "#3b82f6" },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
              {c.monetary && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.monetary}</div>}
            </div>
          ))}
        </div>

        {/* VENCENDO EM 30 DIAS */}
        {d.vencendo_30_dias?.length > 0 && (
          <div style={{ ...s.card, borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#eab308" }}>Contratos vencendo em 30 dias</span>
            </div>
            {d.vencendo_30_dias.map((v, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <div>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{v.numero || "S/N"}</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>— {v.cliente}</span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ color: "#eab308", fontWeight: 700, fontSize: 11 }}>{v.dias_restantes}d restantes</span>
                  <span style={{ color: "#10b981" }}>{formatCurrency(v.valor_total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* TOP CLIENTES */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #eab308, #f97316)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Top Clientes</span>
            </div>
            {d.top_clientes?.length > 0 ? d.top_clientes.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ color: "#f1f5f9" }}>{c.nome}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "#eab308", fontWeight: 700 }}>{c.contratos}x</span>
                  <span style={{ color: "#10b981" }}>{formatCurrency(c.valor)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Sem dados</p>}
          </div>

          {/* POR TIPO */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Por Tipo</span>
            </div>
            {d.por_tipo?.length > 0 ? d.por_tipo.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                <span style={{ color: "#f1f5f9" }}>{t.tipo}</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{t.quantidade}x</span>
                  <span style={{ color: "#10b981" }}>{formatCurrency(t.valor)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b" }}>Sem dados</p>}
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
        <input placeholder="🔍 Buscar contrato..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...s.input, maxWidth: 280 }} />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, maxWidth: 150 }}>
          <option value="">Todos Status</option>
          <option value="ATIVO">Ativos</option>
          <option value="ENCERRADO">Encerrados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...s.input, maxWidth: 170 }}>
          <option value="">Todos Tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ ...s.input, maxWidth: 120 }}>
          <option value={10}>10 linhas</option><option value={20}>20 linhas</option><option value={30}>30 linhas</option><option value={500}>Todas</option>
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={s.primaryBtn}>+ Novo Contrato</button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Nº", "Cliente", "Tipo", "Valor Total", "Mensal", "Início", "Fim", "Status", "Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {contratos.length === 0 ? (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>{loading ? "Carregando..." : "Nenhum contrato encontrado"}</td></tr>
              ) : contratos.map(c => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => verDetalhe(c.id)}>
                  <td style={{ ...s.td, fontWeight: 600, color: "#eab308", fontFamily: "monospace" }}>{c.numero_contrato || `#${c.id}`}</td>
                  <td style={{ ...s.td, fontWeight: 600, color: "#f1f5f9" }}>{c.cliente_nome}</td>
                  <td style={s.td}><span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>{c.tipo}</span></td>
                  <td style={s.td}>{formatCurrency(c.valor_total)}</td>
                  <td style={s.td}>{formatCurrency(c.valor_mensal)}</td>
                  <td style={s.td}>{formatDate(c.data_inicio)}</td>
                  <td style={s.td}>{formatDate(c.data_fim)}</td>
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
        <span style={{ fontSize: 12, color: "#64748b", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
          {pagination.total > 0 ? `${Math.min((pagination.page - 1) * pagination.per_page + 1, pagination.total)}–${Math.min(pagination.page * pagination.per_page, pagination.total)} de ${pagination.total}` : "0 contratos"}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={pagination.page <= 1} onClick={() => loadContratos(pagination.page - 1)} style={{ ...s.dangerBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}>Anterior</button>
          <span style={{ fontSize: 12, color: "#94a3b8", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>Página {pagination.page} de {pagination.total_pages}</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: 18 }}>{detalhe.numero_contrato || `Contrato #${detalhe.id}`}</h3>
            <span style={{ fontSize: 11, color: "#64748b" }}>{detalhe.tipo} • {detalhe.cliente_nome}</span>
          </div>
          <StatusBadge status={detalhe.status} />
        </div>

        {/* INFO CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Valor Total", value: formatCurrency(detalhe.valor_total), color: "#10b981" },
            { label: "Mensal", value: formatCurrency(detalhe.valor_mensal), color: "#eab308" },
            { label: "Início", value: formatDate(detalhe.data_inicio), color: "#3b82f6" },
            { label: "Fim", value: formatDate(detalhe.data_fim), color: "#f97316" },
          ].map((it, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: it.color, marginTop: 4 }}>{it.value}</div>
            </div>
          ))}
        </div>

        {/* CLIENTE */}
        {detalhe.cliente_nome && detalhe.cliente_nome !== "Sem cliente" && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#94a3b8" }}>
            👤 <strong style={{ color: "#f1f5f9" }}>{detalhe.cliente_nome}</strong>
            {detalhe.cliente_documento ? ` • ${detalhe.cliente_documento}` : ""}
            {detalhe.cliente_email ? ` • ${detalhe.cliente_email}` : ""}
            {detalhe.cliente_telefone ? ` • ${detalhe.cliente_telefone}` : ""}
          </div>
        )}

        {detalhe.observacoes && (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 16 }}>{detalhe.observacoes}</div>
        )}

        {/* ITENS */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ color: "#8b5cf6", fontSize: 12, fontWeight: 700, margin: 0 }}>📦 Itens do Contrato ({detalhe.itens?.length || 0})</h4>
            {detalhe.status === "ATIVO" && (
              <button onClick={() => { setShowAddItem(true); setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 }); }} style={{ ...s.successBtn, fontSize: 10, padding: "4px 10px" }}>+ Item</button>
            )}
          </div>
          {detalhe.itens?.length > 0 ? detalhe.itens.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
              <span style={{ color: "#cbd5e1" }}>{it.nome || it.descricao_item} {it.quantidade > 1 ? `(×${it.quantidade})` : ""}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#10b981" }}>{formatCurrency(it.valor_unitario * it.quantidade)}</span>
                {detalhe.status === "ATIVO" && (
                  <button onClick={() => removeItemFromExisting(detalhe.id, it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 12 }}>✕</button>
                )}
              </div>
            </div>
          )) : <p style={{ fontSize: 11, color: "#64748b" }}>Nenhum item vinculado</p>}
        </div>

        {/* LOCAÇÕES VINCULADAS */}
        {detalhe.locacoes?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: "#3b82f6", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🏗️ Locações Vinculadas ({detalhe.locacoes.length})</h4>
            {detalhe.locacoes.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
                <span style={{ color: "#cbd5e1" }}>{l.ativo_nome} — {formatDate(l.data_inicio)}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#10b981" }}>{formatCurrency(l.valor_contrato)}</span>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESUMO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Receita Locações", value: formatCurrency(detalhe.resumo?.receita_locacoes), color: "#10b981" },
            { label: "Locações Ativas", value: detalhe.resumo?.locacoes_ativas, color: "#eab308" },
            { label: "Valor Itens", value: formatCurrency(detalhe.resumo?.valor_itens), color: "#8b5cf6" },
          ].map((it, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: it.color, marginTop: 2 }}>{it.value}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setDetalhe(null)} style={{ ...s.dangerBtn, width: "100%" }}>Fechar</button>

        {/* MINI MODAL: ADD ITEM */}
        {showAddItem && (
          <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(139,92,246,0.2)" }}>
            <h4 style={{ color: "#a78bfa", fontSize: 12, marginBottom: 12 }}>Adicionar Item</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={s.label}>Ativo (opcional)</label>
                <select style={s.input} value={itemForm.ativo_id} onChange={e => setItemForm({ ...itemForm, ativo_id: e.target.value ? parseInt(e.target.value) : "" })}>
                  <option value="">Sem vínculo com ativo</option>
                  {ativosDisp.map(a => <option key={a.id} value={a.id}>{a.nome} — {formatCurrency(a.valor_locacao_dia)}/dia</option>)}
                </select>
              </div>
              <div><label style={s.label}>Descrição</label><input style={s.input} value={itemForm.descricao_item} onChange={e => setItemForm({ ...itemForm, descricao_item: e.target.value })} /></div>
              <div><label style={s.label}>Valor Unitário</label><input style={s.input} type="number" step="0.01" value={itemForm.valor_unitario} onChange={e => setItemForm({ ...itemForm, valor_unitario: parseFloat(e.target.value) || 0 })} /></div>
              <div><label style={s.label}>Quantidade</label><input style={s.input} type="number" value={itemForm.quantidade} onChange={e => setItemForm({ ...itemForm, quantidade: parseInt(e.target.value) || 1 })} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddItem(false)} style={s.dangerBtn}>Cancelar</button>
              <button onClick={() => addItemToExisting(detalhe.id)} style={s.successBtn}>Adicionar</button>
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
        <h3 style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 20 }}>{editing ? "✏️ Editar Contrato" : "📝 Novo Contrato"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Cliente</label>
            <select style={s.input} value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value ? parseInt(e.target.value) : "" })}>
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Nº Contrato <InfoTip text="Deixe vazio para gerar automaticamente" /></label>
            <input style={s.input} value={form.numero_contrato} onChange={e => setForm({ ...form, numero_contrato: e.target.value })} placeholder="Auto" />
          </div>
          <div>
            <label style={s.label}>Tipo</label>
            <select style={s.input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Data Início *</label>
            <input style={s.input} type="date" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Data Fim</label>
            <input style={s.input} type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Valor Total (R$) <InfoTip text="Recalculado automaticamente se adicionar itens" /></label>
            <input style={s.input} type="number" step="0.01" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>Valor Mensal (R$) <InfoTip text="Valor de recorrência mensal do contrato" /></label>
            <input style={s.input} type="number" step="0.01" value={form.valor_mensal} onChange={e => setForm({ ...form, valor_mensal: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>Forma de Pagamento</label>
            <select style={s.input} value={form.forma_pagamento} onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}>
              <option value="">Selecionar...</option>
              <option value="Boleto">Boleto</option>
              <option value="PIX">PIX</option>
              <option value="Transferência">Transferência</option>
              <option value="Cartão">Cartão</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Descrição</label>
            <textarea style={{ ...s.input, minHeight: 50, resize: "vertical" }} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Observações</label>
            <textarea style={{ ...s.input, minHeight: 40, resize: "vertical" }} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>

        {/* ITENS (só no cadastro novo) */}
        {!editing && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>📦 Itens ({formItens.length}) — {formatCurrency(valorTotalItens)}</span>
              <button onClick={() => { setShowAddItem(true); setItemForm({ ativo_id: "", descricao_item: "", valor_unitario: 0, quantidade: 1 }); }} style={{ ...s.successBtn, fontSize: 10, padding: "4px 10px" }}>+ Item</button>
            </div>
            {formItens.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 11 }}>
                <span style={{ color: "#cbd5e1" }}>{it.descricao_item || `Ativo #${it.ativo_id}`} ×{it.quantidade}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#10b981" }}>{formatCurrency(it.valor_unitario * it.quantidade)}</span>
                  <button onClick={() => setFormItens(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}

            {showAddItem && (
              <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12, border: "1px solid rgba(139,92,246,0.15)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={s.label}>Ativo (opcional)</label>
                    <select style={s.input} value={itemForm.ativo_id} onChange={e => setItemForm({ ...itemForm, ativo_id: e.target.value ? parseInt(e.target.value) : "" })}>
                      <option value="">Sem vínculo</option>
                      {ativosDisp.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                  <div><label style={s.label}>Descrição</label><input style={s.input} value={itemForm.descricao_item} onChange={e => setItemForm({ ...itemForm, descricao_item: e.target.value })} /></div>
                  <div><label style={s.label}>Valor Unit.</label><input style={s.input} type="number" step="0.01" value={itemForm.valor_unitario} onChange={e => setItemForm({ ...itemForm, valor_unitario: parseFloat(e.target.value) || 0 })} /></div>
                  <div><label style={s.label}>Qtd</label><input style={s.input} type="number" value={itemForm.quantidade} onChange={e => setItemForm({ ...itemForm, quantidade: parseInt(e.target.value) || 1 })} /></div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowAddItem(false)} style={{ ...s.dangerBtn, fontSize: 10 }}>Cancelar</button>
                  <button onClick={addItemToForm} style={{ ...s.successBtn, fontSize: 10 }}>Adicionar</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={() => { setShowForm(false); resetForm(); }} style={s.dangerBtn}>Cancelar</button>
          <button onClick={salvarContrato} disabled={loading || !form.data_inicio} style={{ ...s.primaryBtn, opacity: loading || !form.data_inicio ? 0.5 : 1 }}>
            {loading ? "Salvando..." : editing ? "Atualizar" : "Criar Contrato"}
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
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #3b82f6)" }} />
        <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20, fontWeight: 800 }}>Gestão de Contratos</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 20, marginLeft: 16 }}>Contratos de serviço, locação e fornecimento por empresa</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ key: "dashboard", label: "Dashboard", icon: "📊" }, { key: "lista", label: "Contratos", icon: "📝" }].map(sec => (
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