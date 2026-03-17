import React, { useState, useEffect, useMemo } from "react";
import { api } from "./api";

// ============================================================
// DossieColaborador.jsx — OmniRH Employee 360° Dossier
// Tela de busca + Dossiê completo com 10 abas
// ============================================================

const fmt = (v) => {
  if (!v || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};
const fmtDate = (d) => {
  if (!d || d === "None" || d === "null") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};

const TIMELINE_ICONS = { admissao: "🟢", promocao: "⬆️", salario: "💰", treinamento: "📚", avaliacao: "📋", ferias: "🏖️", certificacao: "🎓", demissao: "🔴" };
const TIMELINE_COLORS = { admissao: "#10b981", promocao: "#8b5cf6", salario: "#eab308", treinamento: "#3b82f6", avaliacao: "#f97316", ferias: "#06b6d4", certificacao: "#ec4899", demissao: "#f87171" };

// ============================================================
// WRAPPER: Busca + Dossiê
// ============================================================
export default function DossieColaborador({ styles, currentUser, showToast }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const empresaId = currentUser?.empresa_id || 1;

  if (selectedEmployee) {
    return (
      <DossieView
        employeeId={selectedEmployee}
        empresaId={empresaId}
        onBack={() => setSelectedEmployee(null)}
        showToast={showToast}
      />
    );
  }

  return (
    <EmployeeSearch
      empresaId={empresaId}
      onSelect={(id) => setSelectedEmployee(id)}
      showToast={showToast}
    />
  );
}

// ============================================================
// TELA DE BUSCA
// ============================================================
function EmployeeSearch({ empresaId, onSelect, showToast }) {
  const [busca, setBusca] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  const loadEmployees = async (p = 1) => {
    try {
      setLoading(true);
      let url = `/rh-dossier/employees?empresa_id=${empresaId}&page=${p}&per_page=15`;
      if (busca) url += `&busca=${encodeURIComponent(busca)}`;
      const r = await api.get(url);
      setEmployees(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, total_pages: 1 });
      setPage(p);
    } catch (e) {
      console.error(e);
      // Fallback: tenta rota antiga do rh_routes
      try {
        const r = await api.get(`/rh/employees?empresa_id=${empresaId}&search=${busca || ""}`);
        const list = Array.isArray(r.data) ? r.data : [];
        setEmployees(list.map(e => ({
          id: e.id, nome: e.name, email: e.email, telefone: e.phone,
          salario: e.salary || 0, status: e.status, foto_url: e.photo_url,
          data_admissao: e.hire_date, departamento: e.department_name, cargo: e.position_name,
        })));
        setPagination({ total: list.length, total_pages: 1 });
      } catch { setEmployees([]); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadEmployees(1); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(1), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const s = {
    card: { background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 },
    input: { width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, background: "rgba(15,23,42,0.9)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", outline: "none" },
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #ec4899)" }} />
        <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20, fontWeight: 800 }}>Dossiê do Colaborador</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 24, marginLeft: 16 }}>
        Busque por nome, CPF, e-mail ou matrícula para abrir o dossiê 360°
      </p>

      {/* BARRA DE BUSCA */}
      <div style={{ maxWidth: 500, marginBottom: 24 }}>
        <input
          placeholder="🔍 Digite o nome, CPF ou e-mail do colaborador..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={s.input}
          autoFocus
        />
      </div>

      {/* RESULTADOS */}
      {loading ? (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Buscando colaboradores...</p>
      ) : employees.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>👥</div>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {busca ? `Nenhum colaborador encontrado para "${busca}"` : "Nenhum colaborador cadastrado"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => onSelect(emp.id)}
              style={{
                ...s.card, cursor: "pointer", padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.2s", border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(234,179,8,0.4)"; e.currentTarget.style.background = "rgba(234,179,8,0.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(15,23,42,0.6)"; }}
            >
              {/* AVATAR */}
              {emp.foto_url ? (
                <img src={emp.foto_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border: "2px solid rgba(234,179,8,0.2)", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(234,179,8,0.2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#eab308",
                  border: "2px solid rgba(234,179,8,0.15)",
                }}>
                  {(emp.nome || emp.name || "?").charAt(0)}
                </div>
              )}

              {/* INFO */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {emp.nome || emp.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                  {emp.cargo || emp.position_name || "—"} • {emp.departamento || emp.department_name || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>
                  {emp.email} {emp.telefone ? `• ${emp.telefone}` : ""}
                </div>
              </div>

              {/* STATUS + SALÁRIO */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                  background: emp.status === "Ativo" ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
                  color: emp.status === "Ativo" ? "#34d399" : "#f87171",
                }}>{emp.status}</span>
                {emp.salario > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginTop: 4 }}>{fmt(emp.salario)}</div>
                )}
                {emp.data_admissao && (
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>Desde {fmtDate(emp.data_admissao)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {pagination.total_pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => loadEmployees(page - 1)}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", opacity: page <= 1 ? 0.4 : 1 }}>
            Anterior
          </button>
          <span style={{ fontSize: 12, color: "#64748b", padding: "6px 14px" }}>
            {page} de {pagination.total_pages} ({pagination.total} colaboradores)
          </span>
          <button disabled={page >= pagination.total_pages} onClick={() => loadEmployees(page + 1)}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", opacity: page >= pagination.total_pages ? 0.4 : 1 }}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}


// ============================================================
// DOSSIÊ 360° (após selecionar colaborador)
// ============================================================
function DossieView({ employeeId, empresaId, onBack, showToast }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("geral");

  useEffect(() => { loadDossier(); }, [employeeId]);

  const loadDossier = async () => {
    try {
      setLoading(true);
      const r = await api.get(`/rh-dossier/employees/${employeeId}/dossier?empresa_id=${empresaId}`);
      setDossier(r.data);
    } catch (e) {
      console.error("Erro dossiê:", e);
      showToast?.("Erro ao carregar dossiê", "error");
    } finally { setLoading(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Carregando dossiê...</div>;
  if (!dossier) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ color: "#f87171", marginBottom: 16 }}>Dossiê não encontrado</p>
      <button onClick={onBack} style={{ padding: "8px 20px", borderRadius: 10, fontSize: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8" }}>← Voltar à busca</button>
    </div>
  );

  const { dados_pessoais: dp, dados_profissionais: prof, perfil_extra: perfil,
    formacao, historico_profissional: exp, evolucao_salarial: evoSal,
    metricas_salariais: salMetrics, folha_pagamento: folha, beneficios,
    ponto, ferias, desempenho, treinamentos, documentos,
    contatos_emergencia: contatos, dependentes, promocoes, timeline, insights } = dossier;

  const s = {
    card: { background: "rgba(15,23,42,0.6)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 24 },
    th: { padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)" },
    td: { padding: "10px 12px", fontSize: 12, color: "#cbd5e1", borderBottom: "1px solid rgba(255,255,255,0.04)" },
    label: { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
    value: { fontSize: 14, color: "#f1f5f9", fontWeight: 600, marginTop: 2 },
    tabBtn: (a) => ({
      padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
      border: "1px solid", whiteSpace: "nowrap",
      background: a ? "rgba(234,179,8,0.9)" : "rgba(255,255,255,0.04)",
      color: a ? "#000" : "#94a3b8", borderColor: a ? "#eab308" : "rgba(255,255,255,0.08)",
    }),
    infoBox: { background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px" },
    accentBar: (c1, c2) => ({ width: 4, height: 22, borderRadius: 2, background: `linear-gradient(to bottom, ${c1}, ${c2})`, flexShrink: 0 }),
  };

  const InfoField = ({ label, value }) => (
    <div style={s.infoBox}><div style={s.label}>{label}</div><div style={s.value}>{value || "—"}</div></div>
  );
  const SectionTitle = ({ icon, title, c1 = "#eab308", c2 = "#f97316" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <div style={s.accentBar(c1, c2)} /><span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{icon} {title}</span>
    </div>
  );

  const tabs = [
    { key: "geral", label: "Geral", icon: "👤" }, { key: "profissional", label: "Profissional", icon: "💼" },
    { key: "financeiro", label: "Financeiro", icon: "💰" }, { key: "ponto", label: "Ponto", icon: "⏰" },
    { key: "ferias", label: "Férias", icon: "🏖️" }, { key: "desempenho", label: "Desempenho", icon: "📊" },
    { key: "treinamentos", label: "Treinamentos", icon: "📚" }, { key: "documentos", label: "Documentos", icon: "📄" },
    { key: "timeline", label: "Timeline", icon: "📅" }, { key: "insights", label: "Insights", icon: "🧠" },
  ];

  // ============================================================
  // TAB: GERAL
  // ============================================================
  const renderGeral = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={s.card}>
        <SectionTitle icon="👤" title="Dados Pessoais" c1="#3b82f6" c2="#8b5cf6" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <InfoField label="Nome" value={dp.nome} /><InfoField label="CPF" value={dp.cpf} />
          <InfoField label="Nascimento" value={fmtDate(dp.data_nascimento)} /><InfoField label="Gênero" value={dp.genero} />
          <InfoField label="Estado Civil" value={dp.estado_civil} /><InfoField label="E-mail" value={dp.email} />
          <InfoField label="Telefone" value={dp.telefone} /><InfoField label="Endereço" value={dp.endereco} />
        </div>
      </div>
      <div style={s.card}>
        <SectionTitle icon="🏦" title="Dados Bancários" c1="#10b981" c2="#3b82f6" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <InfoField label="Banco" value={dp.banco} /><InfoField label="Agência" value={dp.agencia} />
          <InfoField label="Conta" value={dp.conta_bancaria} /><InfoField label="PIX" value={dp.chave_pix} />
        </div>
      </div>
      {contatos?.length > 0 && (<div style={s.card}>
        <SectionTitle icon="🆘" title="Contatos de Emergência" c1="#f87171" c2="#f97316" />
        {contatos.map((c, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.nome} <span style={{ color: "#64748b", fontWeight: 400 }}>({c.parentesco})</span></span>
          <span style={{ color: "#94a3b8" }}>{c.telefone}</span></div>))}
      </div>)}
      {dependentes?.length > 0 && (<div style={s.card}>
        <SectionTitle icon="👨‍👩‍👧‍👦" title={`Dependentes (${dependentes.length})`} c1="#8b5cf6" c2="#ec4899" />
        {dependentes.map((d, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
          <div><span style={{ color: "#f1f5f9", fontWeight: 600 }}>{d.nome}</span><span style={{ color: "#64748b", marginLeft: 8 }}>({d.parentesco})</span></div>
          <div style={{ display: "flex", gap: 12 }}><span style={{ color: "#94a3b8" }}>{fmtDate(d.data_nascimento)}</span>
            {d.dependente_ir && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, background: "rgba(16,185,129,0.15)", color: "#34d399", fontWeight: 700 }}>IR</span>}</div>
        </div>))}
      </div>)}
    </div>
  );

  // ============================================================
  // TAB: PROFISSIONAL
  // ============================================================
  const renderProfissional = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={s.card}>
        <SectionTitle icon="💼" title="Dados Profissionais" c1="#eab308" c2="#f97316" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <InfoField label="Cargo" value={prof.cargo} /><InfoField label="Departamento" value={prof.departamento} />
          <InfoField label="Gestor" value={prof.gestor} /><InfoField label="Admissão" value={fmtDate(prof.data_admissao)} />
          <InfoField label="Tipo Contrato" value={prof.tipo_contrato} /><InfoField label="Salário" value={fmt(prof.salario_atual)} />
          <InfoField label="Status" value={prof.status} />
          {prof.data_demissao && <InfoField label="Desligamento" value={fmtDate(prof.data_demissao)} />}
        </div>
      </div>
      {promocoes?.length > 0 && (<div style={s.card}>
        <SectionTitle icon="⬆️" title={`Promoções (${promocoes.length})`} c1="#8b5cf6" c2="#3b82f6" />
        {promocoes.map((p, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div><div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{p.cargo_anterior || "?"} → {p.novo_cargo || "?"}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{p.observacoes || ""}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: "#eab308" }}>{fmtDate(p.data)}</div>
            {p.novo_salario > 0 && <div style={{ fontSize: 10, color: "#10b981" }}>{fmt(p.salario_anterior)} → {fmt(p.novo_salario)}</div>}</div>
        </div>))}
      </div>)}
      {formacao?.length > 0 && (<div style={s.card}>
        <SectionTitle icon="🎓" title="Formação Acadêmica" c1="#ec4899" c2="#8b5cf6" />
        {formacao.map((f, i) => (<div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{f.curso}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.instituicao} — {f.grau}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{fmtDate(f.inicio)} a {fmtDate(f.fim)} • {f.status}</div>
        </div>))}
      </div>)}
      {exp?.length > 0 && (<div style={s.card}>
        <SectionTitle icon="🏢" title="Experiência Anterior" c1="#f97316" c2="#eab308" />
        {exp.map((e, i) => (<div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{e.cargo}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.empresa}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{fmtDate(e.inicio)} a {fmtDate(e.fim)}</div>
        </div>))}
      </div>)}
    </div>
  );

  // ============================================================
  // TAB: FINANCEIRO
  // ============================================================
  const renderFinanceiro = () => {
    const maxSal = Math.max(...(evoSal || []).map(x => x.salario), 1);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {salMetrics && Object.keys(salMetrics).length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[{ label: "Salário Atual", value: fmt(salMetrics.salario_atual), color: "#10b981" },
              { label: "Salário Inicial", value: fmt(salMetrics.salario_inicial), color: "#3b82f6" },
              { label: "Crescimento Total", value: `${salMetrics.crescimento_total_pct}%`, color: "#eab308" },
              { label: "Média Anual", value: `${salMetrics.media_crescimento_anual_pct}%/ano`, color: "#8b5cf6" },
              { label: "Total Reajustes", value: salMetrics.total_reajustes, color: "#f97316" },
              { label: "Último Reajuste", value: fmtDate(salMetrics.ultimo_reajuste), color: "#06b6d4" },
            ].map((c, i) => (
              <div key={i} style={{ ...s.infoBox, border: `1px solid ${c.color}22` }}>
                <div style={s.label}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
        {evoSal?.length > 0 && (<div style={s.card}>
          <SectionTitle icon="📈" title="Evolução Salarial" c1="#10b981" c2="#eab308" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, padding: "0 10px" }}>
            {evoSal.map((ev, i) => {
              const h = Math.max((ev.salario / maxSal) * 170, 8);
              const color = ev.tipo === "admissao" ? "#3b82f6" : ev.tipo === "promocao" ? "#8b5cf6" : "#10b981";
              return (<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{fmt(ev.salario)}</span>
                <div style={{ width: "100%", maxWidth: 40, height: h, borderRadius: "6px 6px 0 0", background: color }} title={`${ev.tipo}: ${ev.motivo || ""}`} />
                <span style={{ fontSize: 8, color: "#64748b" }}>{fmtDate(ev.data)}</span>
                <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, fontWeight: 700, textTransform: "uppercase", background: `${color}20`, color }}>{ev.tipo}</span>
              </div>);
            })}
          </div>
        </div>)}
        {folha?.length > 0 && (<div style={s.card}>
          <SectionTitle icon="📋" title="Folha de Pagamento" c1="#f97316" c2="#f87171" />
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Competência", "Base", "H. Extra", "INSS", "IRRF", "FGTS", "Líquido"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>{folha.map((f, i) => (<tr key={i}>
              <td style={{ ...s.td, fontWeight: 600, color: "#eab308" }}>{f.competencia}</td>
              <td style={s.td}>{fmt(f.salario_base)}</td>
              <td style={{ ...s.td, color: f.horas_extras > 0 ? "#10b981" : "#64748b" }}>{fmt(f.horas_extras)}</td>
              <td style={s.td}>{fmt(f.inss)}</td><td style={s.td}>{fmt(f.irrf)}</td><td style={s.td}>{fmt(f.fgts)}</td>
              <td style={{ ...s.td, fontWeight: 700, color: "#10b981" }}>{fmt(f.salario_liquido)}</td>
            </tr>))}</tbody>
          </table></div>
        </div>)}
      </div>
    );
  };

  // ============================================================
  // TAB: PONTO
  // ============================================================
  const renderPonto = () => (<div style={s.card}>
    <SectionTitle icon="⏰" title="Ponto (Último Mês)" c1="#06b6d4" c2="#3b82f6" />
    {ponto?.length > 0 ? (<div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{["Data", "Entrada", "Saída", "Horas", "H. Extra", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
      <tbody>{ponto.map((p, i) => (<tr key={i}>
        <td style={{ ...s.td, fontWeight: 600 }}>{fmtDate(p.data)}</td>
        <td style={s.td}>{p.entrada || "—"}</td><td style={s.td}>{p.saida || "—"}</td>
        <td style={s.td}>{p.horas_trabalhadas}h</td>
        <td style={{ ...s.td, color: p.horas_extras > 0 ? "#10b981" : "#64748b" }}>{p.horas_extras}h</td>
        <td style={s.td}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
          background: p.status === "Presente" ? "rgba(16,185,129,0.15)" : p.status === "Falta" ? "rgba(248,113,113,0.15)" : "rgba(234,179,8,0.15)",
          color: p.status === "Presente" ? "#34d399" : p.status === "Falta" ? "#f87171" : "#facc15" }}>{p.status}</span></td>
      </tr>))}</tbody></table></div>
    ) : <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 30 }}>Sem registros</p>}
  </div>);

  // ============================================================
  // TAB: FÉRIAS
  // ============================================================
  const renderFerias = () => (<div style={s.card}>
    <SectionTitle icon="🏖️" title="Histórico de Férias" c1="#06b6d4" c2="#10b981" />
    {ferias?.length > 0 ? ferias.map((f, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div><div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{f.dias} dias</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(f.data_inicio)} a {fmtDate(f.data_fim)}</div></div>
        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
          background: f.status?.toLowerCase().includes("goz") ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
          color: f.status?.toLowerCase().includes("goz") ? "#34d399" : "#60a5fa" }}>{f.status}</span>
      </div>
    )) : <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 30 }}>Sem registros</p>}
  </div>);

  // ============================================================
  // TAB: DESEMPENHO
  // ============================================================
  const renderDesempenho = () => (<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    {desempenho?.length > 0 ? desempenho.map((d, i) => (<div key={i} style={s.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 700 }}>Avaliação — {d.periodo}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(d.data)} {d.avaliador ? `• ${d.avaliador}` : ""}</div></div>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 800, color: d.nota_geral >= 8 ? "#10b981" : d.nota_geral >= 6 ? "#eab308" : "#f87171" }}>{d.nota_geral}</div>
          <div style={{ fontSize: 9, color: "#64748b" }}>NOTA</div></div>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${Math.min(d.nota_geral * 10, 100)}%`, borderRadius: 3, background: d.nota_geral >= 8 ? "#10b981" : d.nota_geral >= 6 ? "#eab308" : "#f87171" }} /></div>
      {d.feedback && <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 8 }}><strong style={{ color: "#64748b" }}>Feedback:</strong> {d.feedback}</div>}
      {d.metas && <div style={{ fontSize: 12, color: "#94a3b8", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}><strong style={{ color: "#64748b" }}>Metas:</strong> {d.metas}</div>}
    </div>)) : <div style={s.card}><p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 20 }}>Nenhuma avaliação</p></div>}
  </div>);

  // ============================================================
  // TAB: TREINAMENTOS
  // ============================================================
  const renderTreinamentos = () => (<div style={s.card}>
    <SectionTitle icon="📚" title={`Treinamentos (${treinamentos?.length || 0})`} c1="#3b82f6" c2="#8b5cf6" />
    {treinamentos?.length > 0 ? treinamentos.map((t, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div><div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{t.nome}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{t.descricao}</div></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {t.nota && <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{t.nota}</span>}
          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: t.status?.toLowerCase().includes("conclu") ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.15)",
            color: t.status?.toLowerCase().includes("conclu") ? "#34d399" : "#facc15" }}>{t.status}</span>
        </div>
      </div>
    )) : <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 30 }}>Sem treinamentos</p>}
  </div>);

  // ============================================================
  // TAB: DOCUMENTOS
  // ============================================================
  const renderDocumentos = () => (<div style={s.card}>
    <SectionTitle icon="📄" title={`Documentos (${documentos?.length || 0})`} c1="#f97316" c2="#f87171" />
    {documentos?.length > 0 ? documentos.map((d, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div><div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{d.nome_arquivo}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{d.tipo} • {fmtDate(d.data_upload)}</div></div>
        {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none" }}>Baixar</a>}
      </div>
    )) : <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 30 }}>Sem documentos</p>}
  </div>);

  // ============================================================
  // TAB: TIMELINE
  // ============================================================
  const renderTimeline = () => (<div style={s.card}>
    <SectionTitle icon="📅" title="Timeline" c1="#8b5cf6" c2="#ec4899" />
    {timeline?.length > 0 ? (
      <div style={{ position: "relative", paddingLeft: 30 }}>
        <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.06)" }} />
        {timeline.map((t, i) => {
          const color = TIMELINE_COLORS[t.tipo] || "#94a3b8";
          const icon = TIMELINE_ICONS[t.tipo] || "📌";
          return (<div key={i} style={{ position: "relative", paddingBottom: 20 }}>
            <div style={{ position: "absolute", left: -25, top: 2, width: 14, height: 14, borderRadius: "50%", background: color, border: "2px solid rgba(15,23,42,0.9)", zIndex: 1 }} />
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{icon} {t.titulo}</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>{fmtDate(t.data)}</span></div>
              {t.descricao && <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.descricao}</div>}
            </div></div>);
        })}
      </div>
    ) : <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", padding: 30 }}>Nenhum evento</p>}
  </div>);

  // ============================================================
  // TAB: INSIGHTS
  // ============================================================
  const renderInsights = () => (<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
      {[{ label: "Tempo de Empresa", value: insights.tempo_empresa_formatado, icon: "⏱️", color: "#3b82f6" },
        { label: "Salário Atual", value: fmt(insights.salario_atual), icon: "💰", color: "#10b981" },
        { label: "Média Desempenho", value: insights.media_desempenho || "N/A", icon: "📊", color: "#eab308" },
        { label: "Treinamentos", value: `${insights.treinamentos_concluidos}/${insights.total_treinamentos}`, icon: "📚", color: "#8b5cf6" },
        { label: "Promoções", value: insights.total_promocoes, icon: "⬆️", color: "#f97316" },
        { label: "Dependentes", value: insights.total_dependentes, icon: "👨‍👩‍👧", color: "#06b6d4" },
      ].map((c, i) => (<div key={i} style={{ ...s.infoBox, border: `1px solid ${c.color}22` }}>
        <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
        <div style={s.label}>{c.label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
      </div>))}
    </div>
    <div style={s.card}>
      <SectionTitle icon="⏰" title="Frequência (Último Mês)" c1="#06b6d4" c2="#3b82f6" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[{ label: "Faltas", value: insights.faltas_ultimo_mes, color: insights.faltas_ultimo_mes > 0 ? "#f87171" : "#10b981" },
          { label: "Atrasos", value: insights.atrasos_ultimo_mes, color: insights.atrasos_ultimo_mes > 0 ? "#eab308" : "#10b981" },
          { label: "Horas Extras", value: `${insights.horas_extras_ultimo_mes}h`, color: "#3b82f6" },
        ].map((c, i) => (<div key={i} style={{ ...s.infoBox, textAlign: "center" }}>
          <div style={s.label}>{c.label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
        </div>))}
      </div>
    </div>
    {insights.evolucao_salarial && Object.keys(insights.evolucao_salarial).length > 0 && (<div style={s.card}>
      <SectionTitle icon="📈" title="Evolução Salarial" c1="#10b981" c2="#eab308" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[{ label: "Crescimento Total", value: `${insights.evolucao_salarial.crescimento_total_pct}%`, color: "#10b981" },
          { label: "Média Anual", value: `${insights.evolucao_salarial.media_crescimento_anual_pct}%`, color: "#eab308" },
          { label: "Reajustes", value: insights.evolucao_salarial.total_reajustes, color: "#8b5cf6" },
        ].map((c, i) => (<div key={i} style={{ ...s.infoBox, textAlign: "center" }}>
          <div style={s.label}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>
        </div>))}
      </div>
    </div>)}
    <div style={{ ...s.card, borderColor: "rgba(16,185,129,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>🛡️</span>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Risco de Saída</div>
          <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, textTransform: "uppercase" }}>{insights.risco_saida}</div></div>
      </div>
    </div>
  </div>);

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>← Voltar</button>
        {dp.foto_url ? (
          <img src={dp.foto_url} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", border: "2px solid rgba(234,179,8,0.3)" }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "2px solid rgba(234,179,8,0.3)" }}>
            {dp.nome?.charAt(0) || "?"}
          </div>
        )}
        <div>
          <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20, fontWeight: 800 }}>{dp.nome}</h2>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {prof.cargo} • {prof.departamento} • {prof.status}
            {insights.tempo_empresa_formatado && <span style={{ marginLeft: 8, color: "#64748b" }}>({insights.tempo_empresa_formatado})</span>}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{fmt(prof.salario_atual)}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Salário atual</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (<button key={t.key} onClick={() => setTab(t.key)} style={s.tabBtn(tab === t.key)}>
          <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
        </button>))}
      </div>

      {tab === "geral" && renderGeral()}
      {tab === "profissional" && renderProfissional()}
      {tab === "financeiro" && renderFinanceiro()}
      {tab === "ponto" && renderPonto()}
      {tab === "ferias" && renderFerias()}
      {tab === "desempenho" && renderDesempenho()}
      {tab === "treinamentos" && renderTreinamentos()}
      {tab === "documentos" && renderDocumentos()}
      {tab === "timeline" && renderTimeline()}
      {tab === "insights" && renderInsights()}
    </div>
  );
}