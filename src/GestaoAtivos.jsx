import React, { useState, useEffect, useMemo, useRef } from "react";
import { api } from "./api";

// ============================================================
// GestaoAtivos.jsx — Módulo Gestão de Ativos de Locação v2
// Melhorias: dropdown ações, alertas dismiss diário, tooltips ℹ,
//            valores R$ nos cards, upload de foto no cadastro
// ============================================================

const STATUS_COLORS = {
  DISPONIVEL: { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981", label: "Disponível" },
  LOCADO:     { bg: "rgba(59,130,246,0.15)", border: "#3b82f6", text: "#3b82f6", label: "Locado" },
  RESERVADO:  { bg: "rgba(242,107,37,0.15)",  border: "#F26B25", text: "#F26B25", label: "Reservado" },
  MANUTENCAO: { bg: "rgba(249,115,22,0.15)", border: "#f97316", text: "#f97316", label: "Manutenção" },
  INATIVO:    { bg: "rgba(100,116,139,0.15)", border: "#64748b", text: "#64748b", label: "Inativo" },
};

const LOCACAO_STATUS_COLORS = {
  ATIVA:      { bg: "rgba(16,185,129,0.15)", text: "#10b981", label: "Ativa" },
  FINALIZADA: { bg: "rgba(100,116,139,0.15)", text: "#64748b", label: "Finalizada" },
  ATRASADA:   { bg: "rgba(248,113,113,0.15)", text: "#ef4444", label: "Atrasada" },
};

const formatCurrency = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

const formatDate = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

// ============================================================
// COMPONENTE: Tooltip informativo ℹ️
// ============================================================
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 15, height: 15, borderRadius: "50%", fontSize: 9, fontWeight: 800,
        background: "rgba(59,130,246,0.15)", color: "#3b82f6", lineHeight: 1,
        fontFamily: "sans-serif"
      }}>i</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", border: "none",
          borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#f8fafc",
          whiteSpace: "normal", // <-- Permite o texto quebrar de linha
          width: "max-content",
          maxWidth: 220, // <-- Evita que o balão fique gigante
          textAlign: "center",
          zIndex: 99999, // <-- Força a ficar acima de TUDO
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}>
          {text}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent", borderTop: "5px solid #1e293b",
          }} />
        </div>
      )}
    </span>
  );
}
// ============================================================
// COMPONENTE: StatusBadge
// ============================================================
function StatusBadge({ status, map = STATUS_COLORS }) {
  const sc = map[status] || { bg: "#f1f5f9", text: "#64748b", label: status };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: sc.bg, color: sc.text, textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {sc.label}
    </span>
  );
}

// ============================================================
// COMPONENTE: Dropdown de ações por ativo
// ============================================================
function AcoesDropdown({ ativo, onEditar, onBaixa, onVerDetalhe }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "👁️ Ver Detalhes", onClick: () => { onVerDetalhe(ativo.id); setOpen(false); } },
    { label: "✏️ Editar", onClick: () => { onEditar(ativo); setOpen(false); } },
    { sep: true },
    { label: "📦 Baixa de Estoque", onClick: () => { onBaixa(ativo.id, ativo.nome); setOpen(false); }, danger: true },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          background: "#ffffff", border: "1px solid #cbd5e1",
          borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer",
          color: "#475569", lineHeight: 1,
        }}
      >⋮</button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
          background: "#ffffff", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "4px 0", minWidth: 175,
          boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
        }}>
          {items.map((item, i) =>
            item.sep ? (
              <div key={i} style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} />
            ) : (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); item.onClick(); }}
                style={{
                  padding: "8px 14px", fontSize: 12, cursor: "pointer",
                  color: item.danger ? "#ef4444" : "#334155",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {item.label}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HELPER: Alertas dismiss diário (localStorage por data)
// ============================================================
const ALERTA_STORAGE_KEY = "omni26_ativos_alertas_dismissed";

function getDismissedToday() {
  try {
    const data = JSON.parse(localStorage.getItem(ALERTA_STORAGE_KEY) || "{}");
    const hoje = new Date().toISOString().slice(0, 10);
    if (data.date !== hoje) return []; // reset diário
    return data.ids || [];
  } catch { return []; }
}

function dismissAlerta(alertaKey) {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const data = JSON.parse(localStorage.getItem(ALERTA_STORAGE_KEY) || "{}");
    const ids = data.date === hoje ? (data.ids || []) : [];
    ids.push(alertaKey);
    localStorage.setItem(ALERTA_STORAGE_KEY, JSON.stringify({ date: hoje, ids }));
  } catch { /* silently fail */ }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function GestaoAtivos({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // --- DASHBOARD ---
  const [dashboard, setDashboard] = useState(null);

  // --- ATIVOS ---
  const [ativos, setAtivos] = useState([]);
  const [buscaAtivo, setBuscaAtivo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [showFormAtivo, setShowFormAtivo] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState(null);
  const [ativoDetalhe, setAtivoDetalhe] = useState(null);
  const [formAtivo, setFormAtivo] = useState({
    nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0,
    valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60,
    codigo_rastreio: "", observacoes: "", imagem_url: "",
  });
  const [imagemPreview, setImagemPreview] = useState(null);

  // --- LOCAÇÕES ---
  const [locacoes, setLocacoes] = useState([]);
  const [filtroLocacao, setFiltroLocacao] = useState("");
  const [showFormLocacao, setShowFormLocacao] = useState(false);
  const [formLocacao, setFormLocacao] = useState({
    ativo_id: "", cliente_id: "", data_inicio: "", data_prevista_fim: "",
    valor_contrato: 0, valor_diaria: 0, observacoes: "",
  });

  // --- MANUTENÇÕES ---
  const [manutencoes, setManutencoes] = useState([]);
  const [showFormManutencao, setShowFormManutencao] = useState(false);
  const [formManutencao, setFormManutencao] = useState({
    ativo_id: "", tipo: "CORRETIVA", custo: 0, descricao: "", responsavel: "",
  });

  // --- CLIENTES ---
  const [clientes, setClientes] = useState([]);

  // --- ALERTAS (com dismiss diário) ---
  const [alertas, setAlertas] = useState([]);
  const [dismissedAlertas, setDismissedAlertas] = useState(getDismissedToday());

  const alertasVisiveis = useMemo(
    () => alertas.filter(a => !dismissedAlertas.includes(`${a.tipo}_${a.ativo_nome || a.locacao_id || a.manutencao_id}`)),
    [alertas, dismissedAlertas]
  );

  const handleDismissAlerta = (alerta) => {
    const key = `${alerta.tipo}_${alerta.ativo_nome || alerta.locacao_id || alerta.manutencao_id}`;
    dismissAlerta(key);
    setDismissedAlertas(prev => [...prev, key]);
  };

  const empresaId = currentUser?.empresa_id || 1;

  // ============================================================
  // CARREGAMENTO DE DADOS
  // ============================================================
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const r = await api.get(`/ativos-module/dashboard?empresa_id=${empresaId}`);
      setDashboard(r.data);
    } catch (e) { console.error("Erro dashboard ativos:", e); }
    finally { setLoading(false); }
  };

  const loadAtivos = async () => {
    try {
      let url = `/ativos-module/ativos?empresa_id=${empresaId}`;
      if (filtroStatus) url += `&status=${filtroStatus}`;
      if (filtroCategoria) url += `&categoria=${filtroCategoria}`;
      if (buscaAtivo) url += `&busca=${buscaAtivo}`;
      const r = await api.get(url);
      setAtivos(r.data);
    } catch (e) { console.error(e); }
  };

  const loadCategorias = async () => {
    try {
      const r = await api.get(`/ativos-module/categorias?empresa_id=${empresaId}`);
      setCategorias(r.data);
    } catch (e) { console.error(e); }
  };

  const loadLocacoes = async () => {
    try {
      let url = `/ativos-module/locacoes?empresa_id=${empresaId}`;
      if (filtroLocacao) url += `&status=${filtroLocacao}`;
      const r = await api.get(url);
      setLocacoes(r.data);
    } catch (e) { console.error(e); }
  };

  const loadManutencoes = async () => {
    try {
      const r = await api.get(`/ativos-module/manutencoes?empresa_id=${empresaId}`);
      setManutencoes(r.data);
    } catch (e) { console.error(e); }
  };

  const loadClientes = async () => {
    try {
      const r = await api.get("/clientes");
      setClientes(r.data || []);
    } catch (e) { console.error(e); }
  };

  const loadAlertas = async () => {
    try {
      const r = await api.get(`/ativos-module/alertas?empresa_id=${empresaId}`);
      setAlertas(r.data.alertas || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadClientes(); loadCategorias(); }, []);

  useEffect(() => {
    if (section === "dashboard") { loadDashboard(); loadAlertas(); }
    if (section === "ativos") loadAtivos();
    if (section === "locacoes") loadLocacoes();
    if (section === "manutencoes") loadManutencoes();
  }, [section]);

  useEffect(() => { if (section === "ativos") loadAtivos(); }, [filtroStatus, filtroCategoria, buscaAtivo]);
  useEffect(() => { if (section === "locacoes") loadLocacoes(); }, [filtroLocacao]);

  // ============================================================
  // UPLOAD DE IMAGEM (converte para base64 data URL)
  // ============================================================
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast?.("Imagem muito grande. Máximo: 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagemPreview(reader.result);
      setFormAtivo(prev => ({ ...prev, imagem_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ============================================================
  // AÇÕES: ATIVOS
  // ============================================================
  const salvarAtivo = async () => {
    try {
      setLoading(true);
      if (editingAtivo) {
        await api.put(`/ativos-module/ativos/${editingAtivo.id}`, formAtivo);
        showToast?.("Ativo atualizado com sucesso!", "success");
        logAction?.("ativos.editar", `Ativo ${formAtivo.nome} editado`);
      } else {
        await api.post("/ativos-module/ativos", { ...formAtivo, empresa_id: empresaId });
        showToast?.("Ativo criado com sucesso!", "success");
        logAction?.("ativos.criar", `Ativo ${formAtivo.nome} criado`);
      }
      setShowFormAtivo(false);
      setEditingAtivo(null);
      setImagemPreview(null);
      resetFormAtivo();
      loadAtivos();
      loadCategorias();
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao salvar ativo", "error");
    } finally { setLoading(false); }
  };

  const resetFormAtivo = () => {
    setFormAtivo({
      nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0,
      valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60,
      codigo_rastreio: "", observacoes: "", imagem_url: "",
    });
    setImagemPreview(null);
  };

  const editarAtivo = (a) => {
    setEditingAtivo(a);
    setFormAtivo({
      nome: a.nome, categoria: a.categoria, descricao: a.descricao || "",
      valor_aquisicao: a.valor_aquisicao, valor_locacao_dia: a.valor_locacao_dia,
      data_aquisicao: a.data_aquisicao ? String(a.data_aquisicao).split("T")[0] : "",
      vida_util_meses: a.vida_util_meses, codigo_rastreio: a.codigo_rastreio || "",
      observacoes: a.observacoes || "", imagem_url: a.imagem_url || "",
    });
    setImagemPreview(a.imagem_url || null);
    setShowFormAtivo(true);
  };

  const baixaEstoque = async (id, nome) => {
    if (!window.confirm(`Confirmar BAIXA DE ESTOQUE do ativo "${nome}"?\n\nEsta ação irá inativar o ativo permanentemente do estoque.`)) return;
    try {
      await api.delete(`/ativos-module/ativos/${id}`);
      showToast?.(`Baixa de estoque realizada: ${nome}`, "success");
      logAction?.("ativos.baixa", `Baixa de estoque do ativo ${nome} (ID: ${id})`);
      loadAtivos();
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro na baixa", "error"); }
  };

  const verDetalheAtivo = async (id) => {
    try {
      const r = await api.get(`/ativos-module/ativos/${id}`);
      setAtivoDetalhe(r.data);
    } catch (e) { console.error(e); }
  };

  // ============================================================
  // AÇÕES: LOCAÇÕES
  // ============================================================
  const criarLocacao = async () => {
    try {
      setLoading(true);
      await api.post("/ativos-module/locacoes", { ...formLocacao, empresa_id: empresaId });
      showToast?.("Locação criada com sucesso!", "success");
      logAction?.("locacoes.criar", `Locação criada para ativo #${formLocacao.ativo_id}`);
      setShowFormLocacao(false);
      setFormLocacao({ ativo_id: "", cliente_id: "", data_inicio: "", data_prevista_fim: "", valor_contrato: 0, valor_diaria: 0, observacoes: "" });
      loadLocacoes();
      loadAtivos();
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao criar locação", "error");
    } finally { setLoading(false); }
  };

  const finalizarLocacao = async (id) => {
    if (!window.confirm("Finalizar esta locação?")) return;
    try {
      await api.put(`/ativos-module/locacoes/${id}/finalizar`);
      showToast?.("Locação finalizada!", "success");
      logAction?.("locacoes.finalizar", `Locação #${id} finalizada`);
      loadLocacoes();
      loadAtivos();
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  // ============================================================
  // AÇÕES: MANUTENÇÕES
  // ============================================================
  const criarManutencao = async () => {
    try {
      setLoading(true);
      await api.post("/ativos-module/manutencoes", { ...formManutencao, empresa_id: empresaId });
      showToast?.("Manutenção registrada!", "success");
      logAction?.("manutencoes.criar", `Manutenção registrada para ativo #${formManutencao.ativo_id}`);
      setShowFormManutencao(false);
      setFormManutencao({ ativo_id: "", tipo: "CORRETIVA", custo: 0, descricao: "", responsavel: "" });
      loadManutencoes();
      loadAtivos();
    } catch (e) {
      showToast?.(e.response?.data?.detail || "Erro ao registrar manutenção", "error");
    } finally { setLoading(false); }
  };

  const finalizarManutencao = async (id) => {
    if (!window.confirm("Finalizar esta manutenção?")) return;
    try {
      await api.put(`/ativos-module/manutencoes/${id}/finalizar`);
      showToast?.("Manutenção finalizada!", "success");
      loadManutencoes();
      loadAtivos();
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); }
  };

  // ============================================================
  // ESTILOS INTERNOS (TEMA CLARO OMNI26)
  // ============================================================
  const s = {
    card: {
      background: "#ffffff", borderRadius: 16,
      border: "1px solid #e2e8f0", padding: 24,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    },
    sectionBtn: (active) => ({
      padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700,
      cursor: "pointer", border: "1px solid",
      background: active ? "#F26B25" : "#ffffff",
      color: active ? "#ffffff" : "#64748b",
      borderColor: active ? "#F26B25" : "#e2e8f0",
      transition: "all 0.2s",
      boxShadow: active ? "0 4px 10px rgba(242, 107, 37, 0.2)" : "none",
    }),
    input: {
      width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
      background: "#f8fafc", color: "#0f172a",
      border: "1px solid #cbd5e1", outline: "none",
    },
    label: { fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4, display: "block" },
    primaryBtn: {
      padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700,
      cursor: "pointer", border: "none",
      background: "#F26B25",
      color: "#ffffff", transition: "all 0.2s",
      boxShadow: "0 4px 10px rgba(242, 107, 37, 0.2)"
    },
    dangerBtn: {
      padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600,
      cursor: "pointer", border: "1px solid #fca5a5",
      background: "#fef2f2", color: "#ef4444",
    },
    successBtn: {
      padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600,
      cursor: "pointer", border: "1px solid #6ee7b7",
      background: "#ecfdf5", color: "#10b981",
    },
    th: {
      padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700,
      color: "#475569", textTransform: "uppercase", letterSpacing: 0.8,
      borderBottom: "1px solid #e2e8f0", background: "#f8fafc",
    },
    td: {
      padding: "12px 14px", fontSize: 12, color: "#334155",
      borderBottom: "1px solid #e2e8f0",
    },
    modalOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)",
    },
    modalContent: {
      background: "#ffffff", border: "none",
      borderRadius: 20, padding: 30, maxWidth: 600, width: "90%",
      maxHeight: "85vh", overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    },
  statCard: (color) => ({
      background: "#ffffff", borderRadius: 16,
      border: `1px solid ${color}33`, padding: "20px 24px",
      position: "relative", /* Retirei o overflow: hidden daqui */
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    }),
  };

  const sections = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "ativos", label: "Ativos", icon: "🏗️" },
    { key: "locacoes", label: "Locações", icon: "📋" },
    { key: "manutencoes", label: "Manutenções", icon: "🔧" },
  ];

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Carregando dashboard...</p>;
    const { visao_geral: vg, financeiro: fin, operacional: op, manutencao: man, kpis, graficos } = dashboard;

    const valorDisponiveis = fin.valor_ocioso || 0;
    const valorLocados = fin.valor_em_uso || 0;
    const valorTotal = fin.valor_total_patrimonio || 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ALERTAS COM DISMISS INDIVIDUAL */}
        {alertasVisiveis.length > 0 && (
          <div style={{ ...s.card, borderColor: "#fca5a5", background: "#fef2f2" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔔</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>
                  {alertasVisiveis.length} Alerta{alertasVisiveis.length > 1 ? "s" : ""}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#64748b" }}>Alertas fechados reaparecem no próximo login</span>
            </div>
            {alertasVisiveis.slice(0, 8).map((a, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", fontSize: 12, color: "#b91c1c",
                borderBottom: "1px solid #fecaca",
              }}>
                <span>
                  {a.tipo === "LOCACAO_ATRASADA" && "⏰ "}
                  {a.tipo === "ATIVO_PARADO" && "💤 "}
                  {a.tipo === "MANUTENCAO_PROLONGADA" && "🔧 "}
                  {a.mensagem}
                </span>
                <button
                  onClick={() => handleDismissAlerta(a)}
                  style={{
                    background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)",
                    color: "#64748b", fontSize: 12, cursor: "pointer", borderRadius: 6,
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    lineHeight: 1, padding: 0, flexShrink: 0, marginLeft: 10,
                  }}
                  title="Fechar alerta (reaparece amanhã se não resolvido)"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          {[
            {
              label: "Total de Ativos", value: vg.total_ativos, icon: "🏗️", color: "#3b82f6",
              monetary: formatCurrency(valorTotal),
              tip: "Quantidade total de ativos cadastrados (ativos e inativos operacionais)",
            },
            {
              label: "Disponíveis", value: vg.disponiveis, icon: "✅", color: "#10b981",
              monetary: formatCurrency(valorDisponiveis),
              tip: "Ativos livres para locação. O valor representa o patrimônio parado",
            },
            {
              label: "Locados", value: vg.locados, icon: "📋", color: "#F26B25",
              monetary: formatCurrency(valorLocados),
              tip: "Ativos em contrato ativo de locação. O valor representa patrimônio gerando receita",
            },
            {
              label: "Em Manutenção", value: vg.em_manutencao, icon: "🔧", color: "#f97316",
              tip: "Ativos fora de operação por manutenção preventiva ou corretiva",
            },
            {
              label: "Taxa de Ocupação", value: `${vg.taxa_ocupacao}%`, icon: "📈", color: "#8b5cf6",
              tip: "Fórmula: (ativos locados ÷ ativos operacionais) × 100",
            },
            {
              label: "Atrasados", value: op.total_atrasados, icon: "⏰", color: "#ef4444",
              tip: "Locações com data prevista de devolução ultrapassada e ainda não finalizadas",
            },
          ].map((c, i) => (
            <div key={i} style={s.statCard(c.color)}>
              
              {/* ISOLAMENTO DO CÍRCULO: Fica preso aqui e não corta o Tooltip */}
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
                <div style={{
                  position: "absolute", top: -20, right: -20, width: 80, height: 80,
                  borderRadius: "50%", background: `${c.color}15`,
                }} />
              </div>
              
              {/* CONTEÚDO PRINCIPAL: Fica numa camada acima (zIndex: 10) */}
              <div style={{ position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
                  <InfoTip text={c.tip} />
                </div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
                {c.monetary && (
                  <div style={{ fontSize: 12, color: "#0f172a", marginTop: 4, fontWeight: 800 }}>
                    {c.monetary}
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>

        {/* FINANCEIRO */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Financeiro</span>
            </div>
            {[
              { label: "Patrimônio Total", value: formatCurrency(fin.valor_total_patrimonio), color: "#3b82f6", tip: "Soma do valor de aquisição de todos os ativos" },
              { label: "Valor em Uso", value: formatCurrency(fin.valor_em_uso), color: "#10b981", tip: "Valor de aquisição dos ativos atualmente locados" },
              { label: "Valor Ocioso", value: formatCurrency(fin.valor_ocioso), color: "#f97316", tip: "Valor de aquisição dos ativos parados (disponíveis)" },
              { label: "Receita do Mês", value: formatCurrency(fin.receita_mes), color: "#F26B25", tip: "Soma dos contratos de locação iniciados no mês atual" },
              { label: "Custo Manutenção", value: formatCurrency(fin.custo_manutencao_mes), color: "#ef4444", tip: "Soma dos custos de manutenção registrados no mês atual" },
              { label: "Lucro Operacional", value: formatCurrency(fin.lucro_operacional_mes), color: fin.lucro_operacional_mes >= 0 ? "#10b981" : "#ef4444", tip: "Fórmula: receita do mês − custo de manutenção do mês" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center" }}>
                  {item.label}<InfoTip text={item.tip} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* PREVISÃO DE RETORNO */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #F26B25, #f97316)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Previsão de Retorno</span>
              <InfoTip text="Locações ativas ordenadas pela data prevista de devolução" />
            </div>
            {op.previsao_retorno?.length > 0 ? op.previsao_retorno.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}>{p.ativo}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{p.cliente}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: p.dias_restantes <= 3 ? "#ef4444" : "#F26B25", fontWeight: 700 }}>
                    {p.dias_restantes}d restantes
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{formatDate(p.data_prevista_fim)}</div>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Nenhuma locação ativa</p>
            )}
          </div>
        </div>

        {/* TOP ROI + RANKING MANUTENÇÃO */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #3b82f6)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Top ROI por Ativo</span>
              <InfoTip text="ROI = (receita total do ativo ÷ valor de aquisição) × 100. Quanto maior, mais o ativo se pagou." />
            </div>
            {kpis.top_roi?.length > 0 ? kpis.top_roi.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 700 }}>
                    <span style={{ color: "#F26B25", marginRight: 6 }}>#{i + 1}</span>{item.ativo}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>
                    Receita: {formatCurrency(item.receita)} | Manut: {formatCurrency(item.custo_manutencao)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{item.roi}%</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>ROI</div>
                </div>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Sem dados</p>}
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #f97316, #ef4444)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Ranking Manutenção</span>
              <InfoTip text="Ativos que mais demandaram manutenção. Avalie se vale manter ou dar baixa." />
            </div>
            {man.ranking?.length > 0 ? man.ranking.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{item.ativo}</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>{item.quantidade}x</span>
                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{formatCurrency(item.custo_total)}</span>
                </div>
              </div>
            )) : <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Sem dados</p>}
          </div>
        </div>

        {/* RECEITA MENSAL */}
        {graficos?.receita_mensal?.length > 0 && (
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #F26B25)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Receita Mensal (Últimos 6 meses)</span>
              <InfoTip text="Soma dos valores de contrato por mês de início da locação" />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, padding: "0 10px" }}>
              {(() => {
                const max = Math.max(...graficos.receita_mensal.map(m => m.receita), 1);
                return graficos.receita_mensal.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>{formatCurrency(m.receita)}</span>
                    <div style={{
                      width: "100%", maxWidth: 50, borderRadius: "8px 8px 0 0",
                      height: `${Math.max((m.receita / max) * 120, 4)}px`,
                      background: "linear-gradient(to top, #10b981, #34d399)",
                      transition: "height 0.5s ease",
                    }} />
                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{m.mes}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* POR CATEGORIA */}
        {graficos?.por_categoria?.length > 0 && (
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #ec4899)" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Ativos por Categoria</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {graficos.por_categoria.map((c, i) => {
                const colors = ["#3b82f6", "#10b981", "#F26B25", "#f97316", "#8b5cf6", "#ec4899", "#ef4444"];
                const color = colors[i % colors.length];
                return (
                  <div key={i} style={{
                    padding: "8px 16px", borderRadius: 10,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 12, color, fontWeight: 700 }}>{c.quantidade}</span>
                    <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{c.categoria}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: TABELA ATIVOS (com dropdown de ações)
  // ============================================================
  const renderAtivos = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍 Buscar ativo..."
          value={buscaAtivo}
          onChange={e => setBuscaAtivo(e.target.value)}
          style={{ ...s.input, maxWidth: 250 }}
        />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, maxWidth: 180 }}>
          <option value="">Todos os Status</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ ...s.input, maxWidth: 180 }}>
          <option value="">Todas Categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { resetFormAtivo(); setEditingAtivo(null); setShowFormAtivo(true); }} style={s.primaryBtn}>
          + Novo Ativo
        </button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["", "Nome", "Categoria", "Valor Aquisição", "Valor Diária", "Status", "Código", "Ações"].map(h => (
                  <th key={h} style={{ ...s.th, ...(h === "" ? { width: 40 } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ativos.length === 0 ? (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>Nenhum ativo encontrado</td></tr>
              ) : ativos.map(a => (
                <tr 
                  key={a.id} 
                  style={{ cursor: "pointer", transition: "background 0.2s" }} 
                  onClick={() => verDetalheAtivo(a.id)}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* THUMBNAIL */}
                  <td style={{ ...s.td, padding: "6px 10px" }}>
                    {a.imagem_url ? (
                      <img src={a.imagem_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏗️</div>
                    )}
                  </td>
                  <td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{a.nome}</td>
                  <td style={s.td}>{a.categoria}</td>
                  <td style={s.td}>{formatCurrency(a.valor_aquisicao)}</td>
                  <td style={s.td}>{formatCurrency(a.valor_locacao_dia)}</td>
                  <td style={s.td}><StatusBadge status={a.status} /></td>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{a.codigo_rastreio || "—"}</td>
                  <td style={s.td} onClick={e => e.stopPropagation()}>
                    <AcoesDropdown
                      ativo={a}
                      onEditar={editarAtivo}
                      onBaixa={baixaEstoque}
                      onVerDetalhe={verDetalheAtivo}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE */}
      {ativoDetalhe && (
        <div style={s.modalOverlay} onClick={() => setAtivoDetalhe(null)}>
          <div style={{ ...s.modalContent, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {ativoDetalhe.imagem_url ? (
                  <img src={ativoDetalhe.imagem_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏗️</div>
                )}
                <div>
                  <h3 style={{ color: "#0f172a", margin: 0, fontSize: 18, fontWeight: 800 }}>{ativoDetalhe.nome}</h3>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{ativoDetalhe.categoria} • {ativoDetalhe.codigo_rastreio || "Sem código"}</span>
                </div>
              </div>
              <StatusBadge status={ativoDetalhe.status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Aquisição", value: formatCurrency(ativoDetalhe.valor_aquisicao) },
                { label: "Diária", value: formatCurrency(ativoDetalhe.valor_locacao_dia) },
                { label: "Vida Útil", value: `${ativoDetalhe.vida_util_meses} meses` },
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 800, marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {ativoDetalhe.observacoes && (
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                {ativoDetalhe.observacoes}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: "#F26B25", fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: "uppercase" }}>📋 Últimas Locações</h4>
              {ativoDetalhe.locacoes?.length > 0 ? ativoDetalhe.locacoes.slice(0, 5).map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#475569", fontWeight: 600 }}>{l.cliente_nome} <span style={{ color: "#94a3b8", fontWeight: "normal" }}>— {formatDate(l.data_inicio)}</span></span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>{formatCurrency(l.valor_contrato)}</span>
                    <StatusBadge status={l.status} map={LOCACAO_STATUS_COLORS} />
                  </div>
                </div>
              )) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhuma locação registrada</p>}
            </div>

            <div>
              <h4 style={{ color: "#f97316", fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: "uppercase" }}>🔧 Últimas Manutenções</h4>
              {ativoDetalhe.manutencoes?.length > 0 ? ativoDetalhe.manutencoes.slice(0, 5).map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12, borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#475569", fontWeight: 600 }}>{m.tipo} <span style={{ color: "#94a3b8", fontWeight: "normal" }}>— {m.descricao || "Sem descrição"}</span></span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>{formatCurrency(m.custo)}</span>
                    <span style={{ fontSize: 10, color: m.data_fim ? "#10b981" : "#f97316", fontWeight: 700 }}>
                      {m.data_fim ? "Finalizada" : "Em andamento"}
                    </span>
                  </div>
                </div>
              )) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhuma manutenção registrada</p>}
            </div>

            <button onClick={() => setAtivoDetalhe(null)} style={{ ...s.dangerBtn, marginTop: 24, width: "100%", padding: "12px" }}>Fechar Detalhes</button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER: LOCAÇÕES
  // ============================================================
  const renderLocacoes = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <select value={filtroLocacao} onChange={e => setFiltroLocacao(e.target.value)} style={{ ...s.input, maxWidth: 180 }}>
          <option value="">Todas</option>
          <option value="ATIVA">Ativas</option>
          <option value="FINALIZADA">Finalizadas</option>
          <option value="ATRASADA">Atrasadas</option>
        </select>
        <button onClick={() => setShowFormLocacao(true)} style={s.primaryBtn}>+ Nova Locação</button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Ativo", "Cliente", "Início", "Prev. Fim", "Fim Real", "Valor Contrato", "Diária", "Status", "Ações"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locacoes.length === 0 ? (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>Nenhuma locação encontrada</td></tr>
              ) : locacoes.map(l => (
                <tr key={l.id} 
                    style={{ transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{l.ativo_nome}</td>
                  <td style={s.td}>{l.cliente_nome}</td>
                  <td style={s.td}>{formatDate(l.data_inicio)}</td>
                  <td style={s.td}>{formatDate(l.data_prevista_fim)}</td>
                  <td style={s.td}>{formatDate(l.data_real_fim)}</td>
                  <td style={s.td}>{formatCurrency(l.valor_contrato)}</td>
                  <td style={s.td}>{formatCurrency(l.valor_diaria)}</td>
                  <td style={s.td}><StatusBadge status={l.status} map={LOCACAO_STATUS_COLORS} /></td>
                  <td style={s.td}>
                    {(l.status === "ATIVA" || l.status === "ATRASADA") && (
                      <button onClick={() => finalizarLocacao(l.id)} style={s.successBtn}>Finalizar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: MANUTENÇÕES
  // ============================================================
  const renderManutencoes = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setShowFormManutencao(true)} style={s.primaryBtn}>+ Registrar Manutenção</button>
      </div>

      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Ativo", "Tipo", "Início", "Fim", "Custo", "Descrição", "Responsável", "Ações"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {manutencoes.length === 0 ? (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>Nenhuma manutenção registrada</td></tr>
              ) : manutencoes.map(m => (
                <tr key={m.id}
                    style={{ transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{m.ativo_nome}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                      background: m.tipo === "PREVENTIVA" ? "rgba(59,130,246,0.15)" : "rgba(242,107,37,0.15)",
                      color: m.tipo === "PREVENTIVA" ? "#3b82f6" : "#F26B25",
                    }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={s.td}>{formatDate(m.data_inicio)}</td>
                  <td style={s.td}>{formatDate(m.data_fim)}</td>
                  <td style={s.td}>{formatCurrency(m.custo)}</td>
                  <td style={{ ...s.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.descricao || "—"}</td>
                  <td style={s.td}>{m.responsavel || "—"}</td>
                  <td style={s.td}>
                    {!m.data_fim && (
                      <button onClick={() => finalizarManutencao(m.id)} style={s.successBtn}>Finalizar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM ATIVO (com upload de imagem)
  // ============================================================
  const renderFormAtivo = () => showFormAtivo && (
    <div style={s.modalOverlay} onClick={() => { setShowFormAtivo(false); setImagemPreview(null); }}>
      <div style={{ ...s.modalContent, maxWidth: 650 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
          {editingAtivo ? "✏️ Editar Ativo" : "🏗️ Novo Ativo"}
        </h3>

        {/* UPLOAD DE FOTO */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 12, overflow: "hidden",
            border: "2px dashed #cbd5e1", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#f8fafc",
          }}>
            {imagemPreview ? (
              <img src={imagemPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 28, opacity: 0.4 }}>📷</span>
            )}
          </div>
          <div>
            <label
              style={{
                ...s.primaryBtn, display: "inline-block", padding: "8px 16px",
                fontSize: 11, cursor: "pointer",
              }}
            >
              📷 Escolher Foto
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, fontWeight: 600 }}>JPG, PNG ou WEBP • Máx 5MB</div>
            {imagemPreview && (
              <button
                onClick={() => { setImagemPreview(null); setFormAtivo(prev => ({ ...prev, imagem_url: "" })); }}
                style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0, fontWeight: 700 }}
              >
                Remover foto
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Nome *</label>
            <input style={s.input} value={formAtivo.nome} onChange={e => setFormAtivo({ ...formAtivo, nome: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Categoria</label>
            <input style={s.input} value={formAtivo.categoria} onChange={e => setFormAtivo({ ...formAtivo, categoria: e.target.value })} list="cat-list" />
            <datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label style={s.label}>Data Aquisição</label>
            <input style={s.input} type="date" value={formAtivo.data_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, data_aquisicao: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>
              Valor Aquisição (R$)
              <InfoTip text="Preço pago na compra do ativo. Usado para calcular ROI e IPA." />
            </label>
            <input style={s.input} type="number" step="0.01" value={formAtivo.valor_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, valor_aquisicao: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>
              Valor Locação/Dia (R$)
              <InfoTip text="Valor cobrado por dia de locação. Usado como referência ao criar contratos." />
            </label>
            <input style={s.input} type="number" step="0.01" value={formAtivo.valor_locacao_dia} onChange={e => setFormAtivo({ ...formAtivo, valor_locacao_dia: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>
              Vida Útil (meses)
              <InfoTip text="Estimativa de vida útil do ativo em meses. Usado para controle de depreciação." />
            </label>
            <input style={s.input} type="number" value={formAtivo.vida_util_meses} onChange={e => setFormAtivo({ ...formAtivo, vida_util_meses: parseInt(e.target.value) || 60 })} />
          </div>
          <div>
            <label style={s.label}>
              Código Rastreio (QR/RFID)
              <InfoTip text="Código único para identificação física do ativo via QR Code ou RFID." />
            </label>
            <input style={s.input} value={formAtivo.codigo_rastreio} onChange={e => setFormAtivo({ ...formAtivo, codigo_rastreio: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Descrição</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={formAtivo.descricao} onChange={e => setFormAtivo({ ...formAtivo, descricao: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Observações</label>
            <textarea style={{ ...s.input, minHeight: 50, resize: "vertical" }} value={formAtivo.observacoes} onChange={e => setFormAtivo({ ...formAtivo, observacoes: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={() => { setShowFormAtivo(false); setEditingAtivo(null); setImagemPreview(null); }} style={s.dangerBtn}>Cancelar</button>
          <button onClick={salvarAtivo} disabled={loading || !formAtivo.nome} style={{ ...s.primaryBtn, opacity: loading || !formAtivo.nome ? 0.5 : 1 }}>
            {loading ? "Salvando..." : editingAtivo ? "Atualizar Ativo" : "Criar Ativo"}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM LOCAÇÃO
  // ============================================================
  const ativosDisponiveis = useMemo(() => ativos.filter(a => a.status === "DISPONIVEL"), [ativos]);

  const renderFormLocacao = () => showFormLocacao && (
    <div style={s.modalOverlay} onClick={() => setShowFormLocacao(false)}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>📋 Nova Locação</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Ativo *</label>
            <select style={s.input} value={formLocacao.ativo_id} onChange={e => {
              const aid = parseInt(e.target.value);
              const ativo = ativos.find(a => a.id === aid);
              setFormLocacao({ ...formLocacao, ativo_id: aid, valor_diaria: ativo?.valor_locacao_dia || 0 });
            }}>
              <option value="">Selecionar ativo...</option>
              {ativosDisponiveis.map(a => <option key={a.id} value={a.id}>{a.nome} — {formatCurrency(a.valor_locacao_dia)}/dia</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Cliente</label>
            <select style={s.input} value={formLocacao.cliente_id} onChange={e => setFormLocacao({ ...formLocacao, cliente_id: parseInt(e.target.value) || "" })}>
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Data Início</label>
            <input style={s.input} type="date" value={formLocacao.data_inicio} onChange={e => setFormLocacao({ ...formLocacao, data_inicio: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>Previsão Fim *</label>
            <input style={s.input} type="date" value={formLocacao.data_prevista_fim} onChange={e => setFormLocacao({ ...formLocacao, data_prevista_fim: e.target.value })} />
          </div>
          <div>
            <label style={s.label}>
              Valor Contrato (R$)
              <InfoTip text="Valor total fechado para o período de locação" />
            </label>
            <input style={s.input} type="number" step="0.01" value={formLocacao.valor_contrato} onChange={e => setFormLocacao({ ...formLocacao, valor_contrato: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>
              Valor Diária (R$)
              <InfoTip text="Valor unitário por dia. Preenchido automaticamente pelo cadastro do ativo." />
            </label>
            <input style={s.input} type="number" step="0.01" value={formLocacao.valor_diaria} onChange={e => setFormLocacao({ ...formLocacao, valor_diaria: parseFloat(e.target.value) || 0 })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Observações</label>
            <textarea style={{ ...s.input, minHeight: 50, resize: "vertical" }} value={formLocacao.observacoes} onChange={e => setFormLocacao({ ...formLocacao, observacoes: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={() => setShowFormLocacao(false)} style={s.dangerBtn}>Cancelar</button>
          <button onClick={criarLocacao} disabled={loading || !formLocacao.ativo_id || !formLocacao.data_prevista_fim} style={{ ...s.primaryBtn, opacity: loading || !formLocacao.ativo_id ? 0.5 : 1 }}>
            {loading ? "Criando..." : "Criar Locação"}
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MODAL: FORM MANUTENÇÃO
  // ============================================================
  const renderFormManutencao = () => showFormManutencao && (
    <div style={s.modalOverlay} onClick={() => setShowFormManutencao(false)}>
      <div style={s.modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>🔧 Registrar Manutenção</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Ativo *</label>
            <select style={s.input} value={formManutencao.ativo_id} onChange={e => setFormManutencao({ ...formManutencao, ativo_id: parseInt(e.target.value) || "" })}>
              <option value="">Selecionar ativo...</option>
              {ativos.filter(a => a.status !== "LOCADO" && a.status !== "INATIVO").map(a => (
                <option key={a.id} value={a.id}>{a.nome} ({STATUS_COLORS[a.status]?.label})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.label}>
              Tipo
              <InfoTip text="Preventiva: manutenção programada. Corretiva: reparo de falha/quebra." />
            </label>
            <select style={s.input} value={formManutencao.tipo} onChange={e => setFormManutencao({ ...formManutencao, tipo: e.target.value })}>
              <option value="CORRETIVA">Corretiva</option>
              <option value="PREVENTIVA">Preventiva</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Custo (R$)</label>
            <input style={s.input} type="number" step="0.01" value={formManutencao.custo} onChange={e => setFormManutencao({ ...formManutencao, custo: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label style={s.label}>Responsável</label>
            <input style={s.input} value={formManutencao.responsavel} onChange={e => setFormManutencao({ ...formManutencao, responsavel: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Descrição</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={formManutencao.descricao} onChange={e => setFormManutencao({ ...formManutencao, descricao: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={() => setShowFormManutencao(false)} style={s.dangerBtn}>Cancelar</button>
          <button onClick={criarManutencao} disabled={loading || !formManutencao.ativo_id} style={{ ...s.primaryBtn, opacity: loading || !formManutencao.ativo_id ? 0.5 : 1 }}>
            {loading ? "Registrando..." : "Registrar Manutenção"}
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
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #F26B25, #ea580c)" }} />
        <h2 style={{ color: "#0f172a", margin: 0, fontSize: 22, fontWeight: 900 }}>Gestão de Ativos de Locação</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24, marginLeft: 16 }}>
        Controle de ativos, locações, manutenções e KPIs de performance
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {sections.map(sec => (
          <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}>
            <span style={{ marginRight: 6 }}>{sec.icon}</span>
            {sec.label}
          </button>
        ))}
      </div>

      {section === "dashboard" && renderDashboard()}
      {section === "ativos" && renderAtivos()}
      {section === "locacoes" && renderLocacoes()}
      {section === "manutencoes" && renderManutencoes()}

      {renderFormAtivo()}
      {renderFormLocacao()}
      {renderFormManutencao()}
    </div>
  );
}