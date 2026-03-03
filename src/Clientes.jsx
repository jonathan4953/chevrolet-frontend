// Clientes.jsx — Tela completa de Clientes com rastreamento de propostas
import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

const S = {
  bg: "rgba(15,23,42,0.8)",
  border: "rgba(255,255,255,0.07)",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#eab308",
  purple: "#8b5cf6",
  text: "#f1f5f9",
  muted: "#64748b",
  subtle: "#94a3b8",
};

const Card = ({ children, style = {}, glow }) => (
  <div style={{ background: S.bg, backdropFilter: "blur(16px)", border: `1px solid ${glow ? glow + "33" : S.border}`, borderRadius: 20, boxShadow: glow ? `0 0 28px ${glow}12` : "none", ...style }}>{children}</div>
);

const Badge = ({ label, color }) => (
  <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
);

const KPI = ({ label, value, icon, color = S.blue }) => (
  <div style={{ background: S.bg, border: `1px solid ${color}33`, borderRadius: 18, padding: "20px 22px", boxShadow: `0 0 24px ${color}12` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 9, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "monospace" }}>{value}</div>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, required, options, span }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
    <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}{required && <span style={{ color: S.red }}> *</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13 }}>
        {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }} />
    )}
  </div>
);

const EMPTY_CLIENTE = {
  nome: "", cpf_cnpj: "", tipo_pessoa: "PF", email: "", telefone: "", whatsapp: "",
  data_nascimento: "", empresa: "", cargo: "", origem: "Indicação",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  observacoes: ""
};
const ORIGENS = ["Indicação", "Site", "Instagram", "Facebook", "Google", "WhatsApp", "Parceiro", "Evento", "Outros"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function ModalCliente({ cliente, onSave, onClose }) {
  const isEdit = !!cliente?.id;
  const [form, setForm] = useState(cliente ? { ...EMPTY_CLIENTE, ...cliente } : { ...EMPTY_CLIENTE });
  const [saving, setSaving] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const buscarCep = async (cep) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json();
      if (!d.erro) setForm(f => ({ ...f, logradouro: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf }));
    } catch { } finally { setBuscandoCep(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nome) return alert("Nome é obrigatório.");
    setSaving(true);
    try {
      const payload = { ...form, cpf_cnpj: form.cpf_cnpj.replace(/\D/g, "") };
      if (isEdit) await api.put(`/clientes/${cliente.id}`, payload);
      else await api.post("/clientes", payload);
      onSave();
    } catch (e) { alert(e.response?.data?.detail || "Erro ao salvar cliente."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,20,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "rgba(10,18,32,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 760, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 60px 120px rgba(0,0,0,0.8)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: S.subtle, fontSize: 16, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${S.purple}, ${S.blue})` }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{isEdit ? "Editar Cliente" : "Novo Cliente"}</h2>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ fontSize: 10, color: S.purple, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.purple}30`, paddingBottom: 8 }}>Dados Pessoais</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <Input label="Tipo" value={form.tipo_pessoa} onChange={set("tipo_pessoa")} options={[{v:"PF",l:"Pessoa Física"},{v:"PJ",l:"Pessoa Jurídica"}]} />
            <Input label="Origem do Lead" value={form.origem} onChange={set("origem")} options={ORIGENS} />
            <Input label="Nome Completo" value={form.nome} onChange={set("nome")} placeholder="Nome do cliente" required span={2} />
            <Input label={form.tipo_pessoa === "PF" ? "CPF" : "CNPJ"} value={form.cpf_cnpj} onChange={set("cpf_cnpj")} placeholder={form.tipo_pessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"} />
            {form.tipo_pessoa === "PF" && <Input label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={set("data_nascimento")} />}
            {form.tipo_pessoa === "PJ" && <Input label="Nome Fantasia / Empresa" value={form.empresa} onChange={set("empresa")} placeholder="Nome Fantasia" />}
            <Input label="E-mail" type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" />
            <Input label="Telefone" value={form.telefone} onChange={set("telefone")} placeholder="(84) 99999-9999" />
            <Input label="WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} placeholder="(84) 99999-9999" />
            <Input label="Cargo / Profissão" value={form.cargo} onChange={set("cargo")} placeholder="Cargo ou profissão" />
          </div>

          <div style={{ fontSize: 10, color: S.purple, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.purple}30`, paddingBottom: 8 }}>Endereço</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase" }}>CEP</label>
              <input value={form.cep} onChange={e => set("cep")(e.target.value)} onBlur={e => buscarCep(e.target.value)} placeholder="00000-000" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none" }} />
              {buscandoCep && <span style={{ fontSize: 10, color: S.muted }}>🔍 Buscando...</span>}
            </div>
            <Input label="Logradouro" value={form.logradouro} onChange={set("logradouro")} placeholder="Rua, Av..." />
            <Input label="Número" value={form.numero} onChange={set("numero")} placeholder="123" />
            <Input label="Complemento" value={form.complemento} onChange={set("complemento")} placeholder="Apto, Sala..." />
            <Input label="Bairro" value={form.bairro} onChange={set("bairro")} placeholder="Bairro" />
            <Input label="Cidade" value={form.cidade} onChange={set("cidade")} placeholder="Cidade" />
            <Input label="UF" value={form.uf} onChange={set("uf")} options={["", ...UFS]} />
          </div>

          <div style={{ fontSize: 10, color: S.purple, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.purple}30`, paddingBottom: 8 }}>Observações</div>
          <div style={{ marginBottom: 28 }}>
            <textarea value={form.observacoes} onChange={e => set("observacoes")(e.target.value)} placeholder="Notas internas sobre o cliente..." rows={3} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, color: S.subtle, borderRadius: 10, padding: "11px 22px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ background: `${S.purple}22`, border: `1px solid ${S.purple}44`, color: S.purple, borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontWeight: 800, fontSize: 13, minWidth: 140 }}>
              {saving ? "Salvando..." : isEdit ? "💾 Salvar" : "➕ Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalPropostas({ cliente, onClose }) {
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clientes/${cliente.id}/propostas`)
      .then(r => setPropostas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPropostas([]))
      .finally(() => setLoading(false));
  }, [cliente.id]);

  const fmtDate = d => d ? new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR") : "—";
  const fmtMoeda = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,20,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "rgba(10,18,32,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 800, maxHeight: "88vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: S.subtle, fontSize: 16, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${S.purple}, ${S.yellow})` }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>Histórico de Propostas</h2>
            <p style={{ margin: "4px 0 0 0", color: S.muted, fontSize: 12 }}>{cliente.nome}</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: S.muted, textAlign: "center", padding: 40 }}>Carregando...</p>
        ) : propostas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ color: S.muted }}>Nenhuma proposta registrada para este cliente.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["#", "Veículo", "Consultor", "Valor/mês", "Prazo", "Qtd", "Data", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", background: "rgba(0,0,0,0.3)", borderBottom: `1px solid ${S.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propostas.map((p, i) => (
                  <tr key={p.id || i} style={{ borderBottom: `1px solid ${S.border}` }}>
                    <td style={{ padding: "12px 14px", color: S.muted, fontSize: 11 }}>#{String(i + 1).padStart(3, "0")}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>{p.veiculo || "—"}</td>
                    <td style={{ padding: "12px 14px", color: S.subtle }}>{p.consultor || "—"}</td>
                    <td style={{ padding: "12px 14px", color: S.green, fontFamily: "monospace", fontWeight: 700 }}>{fmtMoeda(p.valor_mensal)}</td>
                    <td style={{ padding: "12px 14px" }}>{p.prazo ? `${p.prazo} meses` : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>{p.quantidade || 1}</td>
                    <td style={{ padding: "12px 14px", color: S.subtle, fontSize: 12 }}>{fmtDate(p.data_proposta)}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={p.status || "Gerada"} color={p.status === "Fechada" ? S.green : p.status === "Cancelada" ? S.red : S.yellow} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Clientes() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [verPropostas, setVerPropostas] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/clientes");
      setLista(Array.isArray(r.data) ? r.data : []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Excluir ${nome}?`)) return;
    try { await api.delete(`/clientes/${id}`); load(); }
    catch { alert("Erro ao excluir cliente."); }
  };

  const filtrados = lista.filter(c => {
    const okBusca = busca === "" || c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.email?.toLowerCase().includes(busca.toLowerCase()) || c.cpf_cnpj?.includes(busca) || c.telefone?.includes(busca);
    const okOrigem = filtroOrigem === "Todos" || c.origem === filtroOrigem;
    return okBusca && okOrigem;
  });

  const totalPropostas = lista.reduce((s, c) => s + (c.total_propostas || 0), 0);
  const origens = [...new Set(lista.map(c => c.origem).filter(Boolean))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, color: S.text, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${S.purple}, ${S.blue})` }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Clientes</h1>
            <p style={{ margin: "4px 0 0 0", color: S.muted, fontSize: 13 }}>{lista.length} cadastrado(s) · {totalPropostas} proposta(s) gerada(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true); }} style={{ background: `${S.purple}22`, border: `1px solid ${S.purple}44`, color: S.purple, borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>
          ➕ Novo Cliente
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KPI label="Total de Clientes" value={lista.length} icon="👥" color={S.purple} />
        <KPI label="Propostas Geradas" value={totalPropostas} icon="📋" color={S.yellow} />
        <KPI label="Com Proposta" value={lista.filter(c => (c.total_propostas || 0) > 0).length} icon="✅" color={S.green} />
        <KPI label="Sem Proposta" value={lista.filter(c => !(c.total_propostas || 0)).length} icon="⏳" color={S.muted} />
      </div>

      {/* Filtros */}
      <Card style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Buscar</label>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, CPF, e-mail, telefone..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Origem</label>
            <select value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13 }}>
              <option value="Todos">Todos</option>
              {origens.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={load} style={{ background: `${S.yellow}22`, border: `1px solid ${S.yellow}44`, color: S.yellow, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>🔄</button>
        </div>
      </Card>

      {/* Tabela */}
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Nome", "Documento", "Contato", "Cidade/UF", "Origem", "Propostas", "Consultor", "Ações"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(0,0,0,0.3)", borderBottom: `1px solid ${S.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 50, textAlign: "center", color: S.muted }}>Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 60, textAlign: "center", color: S.muted }}>
                  {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado. Clique em ➕ Novo Cliente para começar."}
                </td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${S.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700 }}>{c.nome}</div>
                    <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{c.tipo_pessoa === "PJ" ? "Jurídica" : "Física"}{c.empresa ? ` · ${c.empresa}` : ""}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: 11, color: S.subtle }}>{c.cpf_cnpj || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 12 }}>{c.telefone || c.whatsapp || "—"}</div>
                    <div style={{ fontSize: 11, color: S.muted }}>{c.email || ""}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: S.subtle }}>{c.cidade ? `${c.cidade}/${c.uf}` : "—"}</td>
                  <td style={{ padding: "14px 16px" }}><Badge label={c.origem || "—"} color={S.blue} /></td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <button onClick={() => setVerPropostas(c)} style={{ background: (c.total_propostas || 0) > 0 ? `${S.yellow}25` : "rgba(255,255,255,0.05)", border: `1px solid ${(c.total_propostas || 0) > 0 ? S.yellow + "50" : "rgba(255,255,255,0.1)"}`, color: (c.total_propostas || 0) > 0 ? S.yellow : S.muted, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>
                      {c.total_propostas || 0}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: S.subtle }}>{c.consultor_nome || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditando(c); setShowModal(true); }} style={{ background: `${S.blue}20`, border: `1px solid ${S.blue}40`, color: S.blue, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>✏️</button>
                      <button onClick={() => handleExcluir(c.id, c.nome)} style={{ background: `${S.red}15`, border: `1px solid ${S.red}35`, color: S.red, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${S.border}`, fontSize: 11, color: S.muted }}>
            {filtrados.length} de {lista.length} cliente(s)
          </div>
        )}
      </Card>

      {showModal && <ModalCliente cliente={editando} onSave={() => { setShowModal(false); setEditando(null); load(); }} onClose={() => { setShowModal(false); setEditando(null); }} />}
      {verPropostas && <ModalPropostas cliente={verPropostas} onClose={() => setVerPropostas(null)} />}
    </div>
  );
}
