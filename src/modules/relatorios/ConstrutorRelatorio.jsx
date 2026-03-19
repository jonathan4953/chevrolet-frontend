import React, { useState } from "react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

const TIPOS_PARAM = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "data", label: "Data" },
  { value: "select", label: "Select (lista)" },
];

const PERFIS = ["admin", "gestor", "consultor"];

export default function ConstrutorRelatorio({ styles, relatorio, onSave, onCancel, showToast }) {
  const isNew = !relatorio?.id;
  const [form, setForm] = useState({
    nome: relatorio?.nome || "",
    descricao: relatorio?.descricao || "",
    query_sql: relatorio?.query_sql || "",
    tipo_saida: relatorio?.tipo_saida || "tabela",
    perfis_permitidos: relatorio?.perfis_permitidos || [],
    parametros: relatorio?.parametros || [],
  });

  const [newParam, setNewParam] = useState({ nome: "", label: "", tipo: "texto", obrigatorio: true, opcoes_sql: "" });

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const togglePerfil = (p) => {
    setForm(prev => ({
      ...prev,
      perfis_permitidos: prev.perfis_permitidos.includes(p)
        ? prev.perfis_permitidos.filter(x => x !== p)
        : [...prev.perfis_permitidos, p]
    }));
  };

  const addParam = () => {
    if (!newParam.nome || !newParam.label) return showToast("Preencha nome e label do parâmetro.", "error");
    setForm(p => ({ ...p, parametros: [...p.parametros, { ...newParam }] }));
    setNewParam({ nome: "", label: "", tipo: "texto", obrigatorio: true, opcoes_sql: "" });
  };

  const removeParam = (idx) => setForm(p => ({ ...p, parametros: p.parametros.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return showToast("Nome é obrigatório.", "error");
    if (!form.query_sql.trim()) return showToast("SQL é obrigatório.", "error");
    onSave({ ...form, id: relatorio?.id });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    background: "#FFFFFF",
    color: C.text,
    border: `1px solid #D4D5D6`,
    outline: "none",
    transition: "border 0.2s",
    boxSizing: "border-box"
  };

  const labelStyle = {
    fontSize: "10px",
    color: C.muted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    display: "block"
  };

  const cardStyle = {
    background: "#FFFFFF",
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button 
          onClick={onCancel} 
          style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}
        >
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: C.primary }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: C.text, fontWeight: 900 }}>
              {isNew ? "Novo Relatório" : `Editar: ${relatorio.nome}`}
            </h2>
            <p style={{ color: C.muted, fontSize: "12px", margin: "2px 0 0", fontWeight: 600 }}>Defina a query SQL, parâmetros e permissões.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* DADOS BÁSICOS */}
        <div style={cardStyle}>
          <h3 style={{ color: C.primary, fontSize: "14px", fontWeight: "900", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Dados do Relatório</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Nome do Relatório *</label>
              <input style={inputStyle} value={form.nome} onChange={e => updateField("nome", e.target.value)} placeholder="Ex: Faturamento Mensal por Cliente" required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Descrição / Objetivo</label>
              <input style={inputStyle} value={form.descricao} onChange={e => updateField("descricao", e.target.value)} placeholder="Para que serve este relatório?" />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Saída</label>
              <select style={inputStyle} value={form.tipo_saida} onChange={e => updateField("tipo_saida", e.target.value)}>
                <option value="tabela">Apenas Tabela de Dados</option>
                <option value="grafico">Gráfico de Indicadores + Tabela</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Perfis com Acesso</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {PERFIS.map(p => {
                  const active = form.perfis_permitidos.includes(p);
                  return (
                    <label key={p} style={{
                      display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 14px", borderRadius: "10px",
                      background: active ? `${C.primary}10` : "#F9FAFB",
                      border: `1px solid ${active ? C.primary : C.border}`,
                      color: active ? C.primary : C.subtle, fontSize: "11px", fontWeight: "800", transition: "all 0.2s"
                    }}>
                      <input type="checkbox" checked={active} onChange={() => togglePerfil(p)} style={{ accentColor: C.primary }} />
                      {p.toUpperCase()}
                    </label>
                  );
                })}
              </div>
              <span style={{ fontSize: "10px", color: C.muted, marginTop: "6px", display: "block", fontWeight: "600" }}>Se nenhum for marcado, todos os perfis verão o relatório.</span>
            </div>
          </div>
        </div>

        {/* QUERY SQL */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: C.blue, fontSize: "14px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>🗄️ Query SQL (Banco de Dados)</h3>
            <span style={{ fontSize: "10px", background: `${C.blue}10`, color: C.blue, padding: "4px 10px", borderRadius: "6px", fontWeight: "800" }}>SELECT ONLY</span>
          </div>
          <p style={{ color: C.subtle, fontSize: "12px", marginBottom: "12px", fontWeight: "600", lineHeight: "1.5" }}>
            Utilize <code style={{ background: "#F1F5F9", color: C.primary, padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>:parametro</code> para criar filtros dinâmicos.
          </p>
          <textarea
            style={{
              ...inputStyle, width: "100%", minHeight: "220px", fontFamily: "monospace",
              fontSize: "13px", lineHeight: "1.6", resize: "vertical",
              background: "#F8FAFC", color: "#1E293B", border: `1px solid ${C.border}`,
              padding: "16px"
            }}
            value={form.query_sql}
            onChange={e => updateField("query_sql", e.target.value)}
            placeholder={`SELECT \n  nome, \n  valor \nFROM tabela \nWHERE data >= :data_inicio`}
            spellCheck={false}
          />
        </div>

        {/* PARÂMETROS */}
        <div style={cardStyle}>
          <h3 style={{ color: C.yellow, fontSize: "14px", fontWeight: "900", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚡ Parâmetros de Filtro</h3>

          {/* Lista de parâmetros existentes */}
          {form.parametros.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              {form.parametros.map((p, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#F9FAFB", border: `1px solid ${C.border}`,
                  borderRadius: "12px", padding: "12px 16px", marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", color: C.primary, fontSize: "13px", fontWeight: "800" }}>:{p.nome}</span>
                    <span style={{ color: C.text, fontSize: "12px", fontWeight: "700" }}>{p.label}</span>
                    <span style={{
                      background: `${C.blue}10`, color: C.blue, padding: "2px 10px",
                      borderRadius: "20px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase"
                    }}>{p.tipo}</span>
                    {p.obrigatorio && <span style={{ color: C.red, fontSize: "10px", fontWeight: "800", textTransform: "uppercase" }}>Obrigatório</span>}
                  </div>
                  <button type="button" onClick={() => removeParam(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: "14px", fontWeight: "800" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar parâmetro */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", background: "#F9FAFB", border: `1px dashed ${C.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle}>ID no SQL</label>
              <input style={inputStyle} value={newParam.nome} onChange={e => setNewParam(p => ({ ...p, nome: e.target.value.replace(/\s/g, "_").toLowerCase() }))} placeholder="Ex: id_cliente" />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Título do Filtro</label>
              <input style={inputStyle} value={newParam.label} onChange={e => setNewParam(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Selecione o Cliente" />
            </div>
            <div style={{ flex: "0 0 130px" }}>
              <label style={labelStyle}>Tipo</label>
              <select style={inputStyle} value={newParam.tipo} onChange={e => setNewParam(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS_PARAM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: C.subtle, cursor: "pointer", padding: "10px 0", fontWeight: "700" }}>
              <input type="checkbox" checked={newParam.obrigatorio} onChange={e => setNewParam(p => ({ ...p, obrigatorio: e.target.checked }))} style={{ accentColor: C.primary }} />
              Obrigatório
            </label>
            {newParam.tipo === "select" && (
              <div style={{ flex: "1 1 100%", marginTop: "10px" }}>
                <label style={labelStyle}>Query para carregar a lista (deve retornar ID e NOME)</label>
                <input style={inputStyle} value={newParam.opcoes_sql} onChange={e => setNewParam(p => ({ ...p, opcoes_sql: e.target.value }))} placeholder="SELECT id_cliente as id, nome_cliente as nome FROM clientes" />
              </div>
            )}
            <button type="button" onClick={addParam} style={{ background: C.green, color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontSize: "12px", fontWeight: "800", boxShadow: `0 4px 10px ${C.green}33` }}>
              ＋ Adicionar Filtro
            </button>
          </div>
        </div>

        {/* AÇÕES FINAIS */}
        <div style={{ display: "flex", gap: 16, marginTop: "10px" }}>
          <button type="submit" style={{ flex: 2, background: C.primary, color: "#fff", border: "none", borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: `0 4px 15px ${C.primary}33` }}>
            {isNew ? "🚀 CRIAR RELATÓRIO AGORA" : "💾 SALVAR TODAS AS ALTERAÇÕES"}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, background: "#F9FAFB", color: C.subtle, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            CANCELAR
          </button>
        </div>
      </form>
    </div>
  );
}