import { useEffect, useState, useMemo } from "react";
import { api } from "./api";

const S = {
  wrap:  { padding: "30px 40px", boxSizing: "border-box" },
  card:  {
    background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)",
    borderRadius: "24px", padding: "32px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
  },
  title: {
    margin: "0 0 4px 0", fontSize: 18, fontWeight: 800,
    borderLeft: "4px solid #f97316", paddingLeft: 12, color: "#f1f5f9",
  },
  sub:   { fontSize: 12, color: "#64748b", marginBottom: 24, paddingLeft: 16 },
  row:   { display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" },
  input: {
    padding: "10px 14px", borderRadius: 10, fontSize: 13,
    background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f1f5f9", outline: "none", boxSizing: "border-box",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", padding: "14px 12px",
    background: "rgba(0,0,0,0.4)", color: "#64748b",
    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  td: {
    padding: "13px 12px", fontSize: 13, color: "#cbd5e1",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "#0f172a", borderRadius: 20, padding: 32,
    width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
  },
  sBox: {
    background: "rgba(255,255,255,0.02)", padding: 18, borderRadius: 12,
    marginBottom: 16, border: "1px solid rgba(255,255,255,0.04)",
  },
  sTit: { fontSize: 11, color: "#f97316", fontWeight: 800, textTransform: "uppercase", marginBottom: 14 },
  g2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  g3:   { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  lbl:  { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6 },
  f:    { marginBottom: 14 },
};

const btn = (bg = "#f97316", col = "#fff") => ({
  padding: "10px 20px", borderRadius: 10, border: "none",
  background: bg, color: col, fontWeight: 700, fontSize: 13, cursor: "pointer",
});
const btnSm = (bg = "rgba(255,255,255,0.07)", col = "#f1f5f9") => ({
  padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
  background: bg, color: col, fontWeight: 600, fontSize: 12, cursor: "pointer",
});
const badge = (c) => ({
  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: `${c}22`, color: c,
});

const VAZIO = {
  nome: "", documento: "", tipo_pessoa: "F", empresa: "", email: "", telefone: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  observacoes: "", status: "Ativo",
};

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
             "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const PP = 20;

export default function Clientes() {
  const [lista,      setLista]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [busca,      setBusca]      = useState("");
  const [page,       setPage]       = useState(1);
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(VAZIO);
  const [saving,     setSaving]     = useState(false);
  const [propCliente,setPropCliente]= useState(null);
  const [propostas,  setPropostas]  = useState([]);
  const [loadProp,   setLoadProp]   = useState(false);

  const carregar = async (termo) => {
    setLoading(true);
    const b = termo !== undefined ? termo : busca;
    try {
      const qs  = b.trim() ? "?busca=" + encodeURIComponent(b.trim()) : "";
      const res = await api.get("/clientes" + qs);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro clientes:", err);
      alert("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(""); }, []); // eslint-disable-line

  const filtrados = useMemo(() => {
    if (!busca.trim()) return lista;
    const s = busca.toLowerCase();
    return lista.filter(c =>
      ((c.nome_razao || c.nome) || "").toLowerCase().includes(s) || // CORRIGIDO AQUI (Busca)
      (c.empresa||"").toLowerCase().includes(s) ||
      (c.email||"").toLowerCase().includes(s) ||
      (c.documento||"").includes(s)
    );
  }, [lista, busca]);

  const totalPags = Math.max(1, Math.ceil(filtrados.length / PP));
  const pags      = filtrados.slice((page-1)*PP, page*PP);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const abrirNovo = () => { setEditId(null); setForm(VAZIO); setShowModal(true); };
const abrirEdit = (c) => {
  setEditId(c.id);
  
  // Aqui dizemos ao formulário para pegar cada dado específico que veio do banco
  setForm({
    nome: c.nome_razao || c.nome || "",
    documento: c.documento || c.cpf_cnpj || "",
    tipo_pessoa: c.tipo_pessoa || "F",
    empresa: c.empresa || "",
    email: c.email || "",
    telefone: c.telefone || "",
    
    // CAMPOS DE ENDEREÇO (Certifique-se que estes nomes são iguais aos do banco)
    cep: c.cep || "",
    logradouro: c.logradouro || "",
    numero: c.numero || "",
    complemento: c.complemento || "",
    bairro: c.bairro || "",
    cidade: c.cidade || "",
    uf: c.uf || "",
    
    observacoes: c.observacoes || "",
    status: c.status || "Ativo"
  });
  
  setShowModal(true);
};
  const buscarCep = async () => {
    const cep = (form.cep||"").replace(/\D/g,"");
    if (cep.length !== 8) return;
    try {
      const r = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
      const d = await r.json();
      if (!d.erro) setForm(f => ({
        ...f, logradouro:d.logradouro||f.logradouro, bairro:d.bairro||f.bairro,
        cidade:d.localidade||f.cidade, uf:d.uf||f.uf
      }));
    } catch(_) {}
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!(form.nome||"").trim()) { alert("O nome é obrigatório."); return; }
    setSaving(true);
    try {
      if (editId) await api.put("/clientes/" + editId, form);
      else        await api.post("/clientes", form);
      setShowModal(false);
      carregar("");
    } catch(err) {
      alert(err?.response?.data?.detail || "Erro ao salvar cliente.");
    } finally { setSaving(false); }
  };

  const excluir = async (id, nome) => {
    if (!window.confirm('Excluir o cliente "' + nome + '"?')) return;
    try { await api.delete("/clientes/" + id); carregar(""); }
    catch(_) { alert("Erro ao excluir. Pode haver propostas vinculadas."); }
  };

  const verProps = async (c) => {
    setPropCliente(c); setLoadProp(true);
    try {
      const r = await api.get("/clientes/" + c.id + "/propostas");
      setPropostas(Array.isArray(r.data) ? r.data : []);
    } catch(_) { setPropostas([]); }
    finally { setLoadProp(false); }
  };

  const ini = filtrados.length ? (page-1)*PP+1 : 0;
  const fim = Math.min(page*PP, filtrados.length);

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <h2 style={S.title}>Clientes</h2>
        <p style={S.sub}>Cadastro de clientes para vinculação com propostas e contratos.</p>

        <div style={S.row}>
          <input
            style={{ ...S.input, width: 320 }}
            placeholder="Buscar por nome, empresa, e-mail ou CPF/CNPJ…"
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1); }}
            onKeyDown={e => e.key === "Enter" && carregar()}
          />
          <button style={btn()} onClick={() => carregar()} disabled={loading}>
            {loading ? "⌛ Carregando…" : "🔍 Buscar"}
          </button>
          <button style={btn("#10b981")} onClick={abrirNovo}>+ Novo Cliente</button>
        </div>

        <div style={{ overflowX:"auto", borderRadius:14, border:"1px solid rgba(255,255,255,0.05)" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Nome","Empresa","Documento","Contato","Cidade/UF","Propostas","Status","Ações"]
                  .map(h => <th key={h} style={{...S.th, textAlign: h==="Ações"?"center":undefined}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pags.length > 0 ? pags.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(249,115,22,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  
                  {/* CORRIGIDO AQUI (Exibição na tabela) */}
                  <td style={{...S.td,fontWeight:700,color:"#f1f5f9"}}>{c.nome_razao || c.nome || "—"}</td>
                  
                  <td style={S.td}>{c.empresa||"—"}</td>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{c.documento||"—"}</td>
                  <td style={S.td}>
                    <div>{c.email||"—"}</div>
                    {c.telefone && <div style={{fontSize:11,color:"#64748b"}}>{c.telefone}</div>}
                  </td>
                  <td style={S.td}>{c.cidade ? c.cidade+"/"+c.uf : "—"}</td>
                  <td style={S.td}>
                    <button onClick={() => verProps(c)} style={btnSm("rgba(59,130,246,0.12)","#60a5fa")}>
                      📄 {c.total_propostas||0}
                    </button>
                  </td>
                  <td style={S.td}>
                    <span style={badge(c.status==="Ativo"?"#10b981":"#f87171")}>{c.status}</span>
                  </td>
                  <td style={{...S.td,textAlign:"center"}}>
                    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                      <button onClick={() => abrirEdit(c)} style={btnSm()}>✏️</button>
                      <button onClick={() => excluir(c.id, c.nome_razao || c.nome)} style={btnSm("rgba(248,113,113,0.1)","#f87171")}>🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{...S.td,textAlign:"center",padding:"50px",color:"#475569"}}>
                  {loading ? "Carregando…" : "Nenhum cliente cadastrado. Clique em \"+ Novo Cliente\" para começar."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16}}>
            <span style={{fontSize:12,color:"#64748b",background:"rgba(0,0,0,0.3)",padding:"7px 14px",borderRadius:8}}>
              {ini}–{fim} de {filtrados.length} clientes
            </span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} style={btnSm()}>← Anterior</button>
              <span style={{fontSize:13,color:"#94a3b8",padding:"7px 18px",background:"rgba(0,0,0,0.3)",borderRadius:8}}>
                {page} / {totalPags}
              </span>
              <button disabled={page>=totalPags} onClick={()=>setPage(p=>p+1)} style={btnSm()}>Próxima →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL CADASTRO ─────────────────────────────────────────────── */}
      {showModal && (
        <div style={S.overlay} onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div style={S.modal}>
            <h3 style={{...S.title,marginBottom:4}}>{editId?"Editar Cliente":"Novo Cliente"}</h3>
            <p style={S.sub}>{editId?"Altere os dados e salve.":"Preencha os dados para cadastrar."}</p>
            <form onSubmit={salvar}>

              <div style={S.sBox}>
                <div style={S.sTit}>1. Identificação</div>
                <div style={S.g2}>
                  <div style={S.f}>
                    <label style={S.lbl}>Tipo de Pessoa</label>
                    <select style={{...S.input,width:"100%"}} value={form.tipo_pessoa} onChange={set("tipo_pessoa")}>
                      <option value="F">Pessoa Física</option>
                      <option value="J">Pessoa Jurídica</option>
                    </select>
                  </div>
                  <div style={S.f}>
                    <label style={S.lbl}>{form.tipo_pessoa==="J"?"CNPJ":"CPF"}</label>
                    <input style={{...S.input,width:"100%"}} value={form.documento} onChange={set("documento")}
                      placeholder={form.tipo_pessoa==="J"?"00.000.000/0000-00":"000.000.000-00"} />
                  </div>
                </div>
                <div style={S.f}>
                  <label style={S.lbl}>Nome Completo *</label>
                  <input required style={{...S.input,width:"100%"}} value={form.nome} onChange={set("nome")}
                    placeholder="Nome do cliente ou responsável" />
                </div>
                {form.tipo_pessoa==="J" && (
                  <div style={S.f}>
                    <label style={S.lbl}>Razão Social / Empresa</label>
                    <input style={{...S.input,width:"100%"}} value={form.empresa} onChange={set("empresa")} />
                  </div>
                )}
                <div style={S.g2}>
                  <div style={S.f}>
                    <label style={S.lbl}>E-mail</label>
                    <input type="email" style={{...S.input,width:"100%"}} value={form.email} onChange={set("email")}
                      placeholder="email@exemplo.com" />
                  </div>
                  <div style={S.f}>
                    <label style={S.lbl}>Telefone / WhatsApp</label>
                    <input style={{...S.input,width:"100%"}} value={form.telefone} onChange={set("telefone")}
                      placeholder="(84) 99999-9999" />
                  </div>
                </div>
              </div>

              <div style={S.sBox}>
                <div style={S.sTit}>2. Endereço</div>
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  <div style={{flex:1}}>
                    <label style={S.lbl}>CEP</label>
                    <input style={{...S.input,width:"100%"}} value={form.cep} onChange={set("cep")}
                      onBlur={buscarCep} placeholder="00000-000" maxLength={9} />
                  </div>
                  <button type="button" onClick={buscarCep}
                    style={{...btnSm("rgba(59,130,246,0.15)","#60a5fa"),alignSelf:"flex-end",padding:"10px 16px"}}>
                    🔍 Buscar CEP
                  </button>
                </div>
                <div style={S.f}>
                  <label style={S.lbl}>Logradouro</label>
                  <input style={{...S.input,width:"100%"}} value={form.logradouro} onChange={set("logradouro")}
                    placeholder="Rua, Av., Alameda…" />
                </div>
                <div style={S.g3}>
                  <div style={S.f}><label style={S.lbl}>Número</label>
                    <input style={{...S.input,width:"100%"}} value={form.numero} onChange={set("numero")} placeholder="Nº"/></div>
                  <div style={S.f}><label style={S.lbl}>Complemento</label>
                    <input style={{...S.input,width:"100%"}} value={form.complemento} onChange={set("complemento")} placeholder="Apto…"/></div>
                  <div style={S.f}><label style={S.lbl}>Bairro</label>
                    <input style={{...S.input,width:"100%"}} value={form.bairro} onChange={set("bairro")} /></div>
                </div>
                <div style={S.g2}>
                  <div style={S.f}><label style={S.lbl}>Cidade</label>
                    <input style={{...S.input,width:"100%"}} value={form.cidade} onChange={set("cidade")} /></div>
                  <div style={S.f}><label style={S.lbl}>UF</label>
                    <select style={{...S.input,width:"100%"}} value={form.uf} onChange={set("uf")}>
                      <option value="">Selecione…</option>
                      {UFS.map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={S.sBox}>
                <div style={S.sTit}>3. Informações Adicionais</div>
                <div style={S.f}>
                  <label style={S.lbl}>Observações</label>
                  <textarea style={{...S.input,width:"100%",resize:"vertical",minHeight:72}}
                    value={form.observacoes} onChange={set("observacoes")}
                    placeholder="Anotações internas…" />
                </div>
                {editId && (
                  <div style={S.f}>
                    <label style={S.lbl}>Status</label>
                    <select style={{...S.input,width:"100%"}} value={form.status} onChange={set("status")}>
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{display:"flex",gap:12}}>
                <button type="submit" disabled={saving} style={{...btn(),flex:2}}>
                  {saving?"Salvando…":editId?"✔ Salvar Alterações":"✔ Cadastrar Cliente"}
                </button>
                <button type="button" onClick={()=>setShowModal(false)}
                  style={{...btnSm("rgba(248,113,113,0.1)","#f87171"),flex:1,padding:"10px 20px",fontSize:13,fontWeight:700}}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL PROPOSTAS ───────────────────────────────────────────── */}
      {propCliente && (
        <div style={S.overlay} onClick={e => e.target===e.currentTarget && setPropCliente(null)}>
          <div style={{...S.modal,maxWidth:620}}>
            <h3 style={{...S.title,marginBottom:4}}>Propostas — {propCliente.nome_razao || propCliente.nome}</h3>
            <p style={S.sub}>Histórico de propostas geradas para este cliente.</p>
            {loadProp ? (
              <div style={{textAlign:"center",padding:40,color:"#64748b"}}>Carregando…</div>
            ) : propostas.length > 0 ? (
              <table style={S.table}>
                <thead><tr>
                  {["Veículo","Qtd","Prazo","R$/mês","Status","Data"].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {propostas.map(p=>(
                    <tr key={p.id}>
                      <td style={{...S.td,fontSize:12}}>{p.veiculo||"—"}</td>
                      <td style={S.td}>{p.quantidade}</td>
                      <td style={S.td}>{p.prazo?p.prazo+"m":"—"}</td>
                      <td style={S.td}>{p.valor_mensal?
                        "R$ "+Number(p.valor_mensal).toLocaleString("pt-BR",{minimumFractionDigits:2}):"—"}</td>
                      <td style={S.td}><span style={badge("#eab308")}>{p.status}</span></td>
                      <td style={{...S.td,fontSize:11}}>{p.data_criacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{textAlign:"center",padding:"40px",color:"#475569"}}>
                Nenhuma proposta registrada para este cliente.
              </div>
            )}
            <button onClick={()=>setPropCliente(null)}
              style={{...btnSm(),width:"100%",marginTop:20,padding:12,textAlign:"center",fontSize:13}}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}