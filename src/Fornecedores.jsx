// Fornecedores.jsx — Tela completa de Cadastro de Fornecedores
import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

const S = {
  bg: "rgba(15,23,42,0.8)",
  border: "rgba(255,255,255,0.07)",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#eab308",
  text: "#f1f5f9",
  muted: "#64748b",
  subtle: "#94a3b8",
};

const fmt = (v) => v ? v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "";

const Card = ({ children, style = {} }) => (
  <div style={{ background: S.bg, backdropFilter: "blur(16px)", border: `1px solid ${S.border}`, borderRadius: 20, ...style }}>{children}</div>
);

const Badge = ({ label, color }) => (
  <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
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

const EMPTY = { nome_razao: "", documento: "", email: "", telefone: "", tipo_fornecedor: "Geral", tipo_pessoa: "PJ", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };
const TIPOS = ["Geral", "Veículos/Peças", "Seguros", "Combustível", "Manutenção", "Serviços", "Financeiro", "Outros"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function ModalFornecedor({ fornecedor, onSave, onClose }) {
  const isEdit = !!fornecedor?.id;
  const [form, setForm] = useState(fornecedor ? { ...fornecedor } : { ...EMPTY });
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
    if (!form.nome_razao || !form.documento) return alert("Nome e documento são obrigatórios.");
    setSaving(true);
    try {
      const payload = { ...form, documento: form.documento.replace(/\D/g, "") };
      if (isEdit) await api.put(`/fornecedores/${fornecedor.id}`, payload);
      else await api.post("/fornecedores", payload);
      onSave();
    } catch (e) { alert(e.response?.data?.detail || "Erro ao salvar. Verifique se o documento já existe."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,20,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "rgba(10,18,32,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 60px 120px rgba(0,0,0,0.8)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: S.subtle, fontSize: 16, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${S.blue}, ${S.green})` }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
        </div>

        <form onSubmit={handleSave}>
          {/* Seção: Dados Gerais */}
          <div style={{ fontSize: 10, color: S.yellow, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.yellow}30`, paddingBottom: 8 }}>Dados Gerais</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <Input label="Tipo de Pessoa" value={form.tipo_pessoa} onChange={set("tipo_pessoa")} options={[{v:"PJ",l:"Pessoa Jurídica (CNPJ)"},{v:"PF",l:"Pessoa Física (CPF)"}]} />
            <Input label="Categoria" value={form.tipo_fornecedor} onChange={set("tipo_fornecedor")} options={TIPOS} />
            <Input label={form.tipo_pessoa === "PJ" ? "Razão Social" : "Nome Completo"} value={form.nome_razao} onChange={set("nome_razao")} placeholder="Nome ou Razão Social" required span={2} />
            <Input label={form.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"} value={form.documento} onChange={set("documento")} placeholder={form.tipo_pessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} required />
            <Input label="Telefone / WhatsApp" value={form.telefone} onChange={set("telefone")} placeholder="(84) 99999-9999" />
            <Input label="E-mail" value={form.email} onChange={set("email")} type="email" placeholder="contato@empresa.com.br" span={2} />
          </div>

          {/* Seção: Endereço */}
          <div style={{ fontSize: 10, color: S.yellow, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.yellow}30`, paddingBottom: 8 }}>Endereço</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>CEP</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={form.cep} onChange={e => set("cep")(e.target.value)} onBlur={e => buscarCep(e.target.value)} placeholder="00000-000" style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none" }} />
                {buscandoCep && <span style={{ alignSelf: "center", color: S.muted, fontSize: 11 }}>🔍</span>}
              </div>
            </div>
            <Input label="Logradouro" value={form.logradouro} onChange={set("logradouro")} placeholder="Rua, Av..." />
            <Input label="Número" value={form.numero} onChange={set("numero")} placeholder="123" />
            <Input label="Complemento" value={form.complemento} onChange={set("complemento")} placeholder="Sala, Apto..." />
            <Input label="Bairro" value={form.bairro} onChange={set("bairro")} placeholder="Bairro" />
            <Input label="Cidade" value={form.cidade} onChange={set("cidade")} placeholder="Cidade" />
            <Input label="UF" value={form.uf} onChange={set("uf")} options={["", ...UFS]} />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, color: S.subtle, borderRadius: 10, padding: "11px 22px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ background: `${S.blue}22`, border: `1px solid ${S.blue}44`, color: S.blue, borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontWeight: 800, fontSize: 13, minWidth: 140 }}>
              {saving ? "Salvando..." : isEdit ? "💾 Salvar Alterações" : "➕ Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Fornecedores() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/fornecedores");
      setLista(Array.isArray(r.data) ? r.data : []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Excluir ${nome}?`)) return;
    try {
      await api.delete(`/fornecedores/${id}`);
      load();
    } catch { alert("Erro ao excluir. Pode estar vinculado a obrigações financeiras."); }
  };

  const filtrados = lista.filter(f => {
    const ok = busca === "" || f.nome_razao?.toLowerCase().includes(busca.toLowerCase()) || f.documento?.includes(busca) || f.email?.toLowerCase().includes(busca.toLowerCase());
    const okTipo = filtroTipo === "Todos" || f.tipo_fornecedor === filtroTipo;
    return ok && okTipo;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, color: S.text, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${S.blue}, ${S.green})` }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Fornecedores</h1>
            <p style={{ margin: "4px 0 0 0", color: S.muted, fontSize: 13 }}>{lista.length} cadastrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true); }} style={{ background: `${S.blue}22`, border: `1px solid ${S.blue}44`, color: S.blue, borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>
          ➕ Novo Fornecedor
        </button>
      </div>

      {/* Filtros */}
      <Card style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Buscar</label>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, CNPJ, e-mail..." style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Categoria</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13 }}>
              <option value="Todos">Todos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
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
                {["Razão Social / Nome", "Documento", "Categoria", "Telefone", "E-mail", "Cidade/UF", "Ações"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(0,0,0,0.3)", borderBottom: `1px solid ${S.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: "center", color: S.muted }}>Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 60, textAlign: "center", color: S.muted }}>
                  {busca ? "Nenhum fornecedor encontrado para essa busca." : "Nenhum fornecedor cadastrado."}
                </td></tr>
              ) : filtrados.map(f => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${S.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700 }}>{f.nome_razao}</div>
                    <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{f.tipo_pessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: 12, color: S.subtle }}>{fmt(f.documento)}</td>
                  <td style={{ padding: "14px 16px" }}><Badge label={f.tipo_fornecedor || "Geral"} color={S.blue} /></td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12 }}>{f.telefone || "—"}</td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12 }}>{f.email || "—"}</td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12 }}>{f.cidade ? `${f.cidade}/${f.uf}` : "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditando(f); setShowModal(true); }} style={{ background: `${S.blue}20`, border: `1px solid ${S.blue}40`, color: S.blue, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>✏️ Editar</button>
                      <button onClick={() => handleExcluir(f.id, f.nome_razao)} style={{ background: `${S.red}15`, border: `1px solid ${S.red}35`, color: S.red, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${S.border}`, fontSize: 11, color: S.muted }}>
            {filtrados.length} de {lista.length} fornecedor(es)
          </div>
        )}
      </Card>

      {showModal && (
        <ModalFornecedor
          fornecedor={editando}
          onSave={() => { setShowModal(false); setEditando(null); load(); }}
          onClose={() => { setShowModal(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
