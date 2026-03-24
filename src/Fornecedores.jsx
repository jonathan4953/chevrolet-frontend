// Fornecedores.jsx — Tela completa de Cadastro de Fornecedores
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";

const S = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#F26B25",
  primaryLight: "rgba(242, 107, 37, 0.1)",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
};

const fmt = (v) => v ? v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "";

const Card = ({ children, style = {} }) => (
  <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", ...style }}>{children}</div>
);

const Badge = ({ label, color }) => (
  <span style={{ background: `${color}15`, color, border: `1px solid ${color}30`, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
);

const Input = ({ label, value, onChange, type = "text", placeholder, required, options, span }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: span ? `span ${span}` : undefined }}>
    <label style={{ fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}{required && <span style={{ color: S.red }}> *</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
        {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
    )}
  </div>
);

/* ── Dropdown de Ações ── */
function ActionsDropdown({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const itemBase = {
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "9px 14px",
    background: "none", border: "none",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    textAlign: "left", transition: "background 0.15s",
    borderRadius: 6,
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? "#F3F4F6" : "transparent",
          border: `1px solid ${open ? "#D4D5D6" : "transparent"}`,
          borderRadius: 8, width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s", color: S.subtle,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#D4D5D6"; }}}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}}
        title="Ações"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1.3" fill="currentColor"/>
          <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
          <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
          background: "#FFFFFF", border: `1px solid ${S.border}`,
          borderRadius: 12, padding: 4, minWidth: 160,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04)",
          animation: "dropIn 0.12s ease-out",
        }}>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            style={{ ...itemBase, color: S.text }}
            onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            Editar
          </button>

          <div style={{ height: 1, background: S.border, margin: "2px 6px" }} />

          <button
            onClick={() => { setOpen(false); onDelete(); }}
            style={{ ...itemBase, color: S.red }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(217, 48, 37, 0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            Excluir
          </button>
        </div>
      )}

      <style>{`@keyframes dropIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(42, 43, 45, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: `1px solid ${S.border}`, borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F9FAFB", border: "1px solid #D4D5D6", color: S.subtle, fontSize: 16, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F9FAFB"}>✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${S.primary}, #FF9B6A)` }} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: S.text }}>{isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ fontSize: 11, color: S.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.primaryLight}`, paddingBottom: 8 }}>Dados Gerais</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <Input label="Tipo de Pessoa" value={form.tipo_pessoa} onChange={set("tipo_pessoa")} options={[{v:"PJ",l:"Pessoa Jurídica (CNPJ)"},{v:"PF",l:"Pessoa Física (CPF)"}]} />
            <Input label="Categoria" value={form.tipo_fornecedor} onChange={set("tipo_fornecedor")} options={TIPOS} />
            <Input label={form.tipo_pessoa === "PJ" ? "Razão Social" : "Nome Completo"} value={form.nome_razao} onChange={set("nome_razao")} placeholder="Nome ou Razão Social" required span={2} />
            <Input label={form.tipo_pessoa === "PJ" ? "CNPJ" : "CPF"} value={form.documento} onChange={set("documento")} placeholder={form.tipo_pessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} required />
            <Input label="Telefone / WhatsApp" value={form.telefone} onChange={set("telefone")} placeholder="(84) 99999-9999" />
            <Input label="E-mail" value={form.email} onChange={set("email")} type="email" placeholder="contato@empresa.com.br" span={2} />
          </div>

          <div style={{ fontSize: 11, color: S.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, borderBottom: `1px solid ${S.primaryLight}`, paddingBottom: 8 }}>Endereço</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>CEP</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input 
                  value={form.cep} 
                  onChange={e => set("cep")(e.target.value)} 
                  onBlur={e => {
                    buscarCep(e.target.value);
                    e.target.style.borderColor = "#D4D5D6";
                  }} 
                  placeholder="00000-000" 
                  style={{ flex: 1, background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", transition: "border 0.2s" }} 
                  onFocus={e => e.target.style.borderColor = S.primary} 
                />
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
            <button type="button" onClick={onClose} style={{ background: "#F9FAFB", border: `1px solid #D4D5D6`, color: S.subtle, borderRadius: 10, padding: "11px 22px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ background: S.primary, border: "none", color: "#FFFFFF", borderRadius: 10, padding: "11px 28px", cursor: "pointer", fontWeight: 800, fontSize: 13, minWidth: 140, boxShadow: "0 4px 10px rgba(242, 107, 37, 0.2)" }}>
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
          <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${S.primary}, #FF9B6A)` }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: S.text }}>Fornecedores</h1>
            <p style={{ margin: "4px 0 0 0", color: S.muted, fontSize: 13, fontWeight: 600 }}>{lista.length} cadastrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setEditando(null); setShowModal(true); }} style={{ background: S.primary, border: "none", color: "#FFFFFF", borderRadius: 12, padding: "11px 22px", cursor: "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 10px rgba(242, 107, 37, 0.2)" }}>
          ➕ Novo Fornecedor
        </button>
      </div>

      {/* Filtros */}
      <Card style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Buscar</label>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, CNPJ, e-mail..." style={{ width: "100%", background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, boxSizing: "border-box", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Categoria</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 13, outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
              <option value="Todos">Todos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={load} style={{ background: S.primaryLight, border: `1px solid rgba(242, 107, 37, 0.3)`, color: S.primary, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>🔄</button>
        </div>
      </Card>

      {/* Tabela */}
      <Card style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Razão Social / Nome", "Documento", "Categoria", "Telefone", "E-mail", "Cidade/UF", ""].map((h, i) => (
                  <th key={i} style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, color: S.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "#F9FAFB", borderBottom: `1px solid ${S.border}`, whiteSpace: "nowrap", ...(h === "" ? { width: 48 } : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 50, textAlign: "center", color: S.muted, fontWeight: 600 }}>Carregando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 60, textAlign: "center", color: S.muted, fontWeight: 600 }}>
                  {busca ? "Nenhum fornecedor encontrado para essa busca." : "Nenhum fornecedor cadastrado."}
                </td></tr>
              ) : filtrados.map(f => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${S.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 800, color: S.text }}>{f.nome_razao}</div>
                    <div style={{ fontSize: 11, color: S.muted, marginTop: 2, fontWeight: 600 }}>{f.tipo_pessoa === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: 12, color: S.subtle, fontWeight: 600 }}>{fmt(f.documento)}</td>
                  <td style={{ padding: "14px 16px" }}><Badge label={f.tipo_fornecedor || "Geral"} color={S.primary} /></td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12, fontWeight: 600 }}>{f.telefone || "—"}</td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12, fontWeight: 600 }}>{f.email || "—"}</td>
                  <td style={{ padding: "14px 16px", color: S.subtle, fontSize: 12, fontWeight: 600 }}>{f.cidade ? `${f.cidade}/${f.uf}` : "—"}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <ActionsDropdown
                      onEdit={() => { setEditando(f); setShowModal(true); }}
                      onDelete={() => handleExcluir(f.id, f.nome_razao)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${S.border}`, fontSize: 11, color: S.muted, fontWeight: 600, background: "#F9FAFB" }}>
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