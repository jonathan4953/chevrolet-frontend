import React, { useState } from "react";

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

  const inputStyle = styles.inputSmall;
  const labelStyle = styles.fieldLabel;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← Voltar</button>
        <div>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>{isNew ? "Novo Relatório" : `Editar: ${relatorio.nome}`}</h2>
          <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>Defina a query SQL, parâmetros e permissões.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* DADOS BÁSICOS */}
        <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#8b5cf6", fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>📋 Dados do Relatório</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Nome *</label>
              <input style={inputStyle} value={form.nome} onChange={e => updateField("nome", e.target.value)} placeholder="Ex: Contas a Pagar por Período" required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Descrição</label>
              <input style={inputStyle} value={form.descricao} onChange={e => updateField("descricao", e.target.value)} placeholder="Breve descrição do relatório" />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Saída</label>
              <select style={inputStyle} value={form.tipo_saida} onChange={e => updateField("tipo_saida", e.target.value)}>
                <option value="tabela">Tabela</option>
                <option value="grafico">Gráfico + Tabela</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Perfis Permitidos</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {PERFIS.map(p => (
                  <label key={p} style={{
                    display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "6px 12px", borderRadius: 8,
                    background: form.perfis_permitidos.includes(p) ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.perfis_permitidos.includes(p) ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: form.perfis_permitidos.includes(p) ? "#a78bfa" : "#64748b", fontSize: 11, fontWeight: 700,
                  }}>
                    <input type="checkbox" checked={form.perfis_permitidos.includes(p)} onChange={() => togglePerfil(p)} style={{ accentColor: "#8b5cf6" }} />
                    {p}
                  </label>
                ))}
              </div>
              <span style={{ fontSize: 10, color: "#475569", marginTop: 4, display: "block" }}>Vazio = todos os perfis</span>
            </div>
          </div>
        </div>

        {/* QUERY SQL */}
        <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#10b981", fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>🗄️ Query SQL</h3>
          <p style={{ color: "#64748b", fontSize: 11, marginBottom: 12 }}>
            Use <code style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", padding: "2px 6px", borderRadius: 4 }}>:nome_parametro</code> para parâmetros dinâmicos. Ex: <code style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", padding: "2px 6px", borderRadius: 4 }}>WHERE data_vencimento BETWEEN :data_inicio AND :data_fim</code>
          </p>
          <textarea
            style={{
              ...inputStyle, width: "100%", minHeight: 180, fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontSize: 12, lineHeight: 1.6, resize: "vertical", whiteSpace: "pre",
              background: "rgba(0,0,0,0.4)", color: "#e2e8f0",
            }}
            value={form.query_sql}
            onChange={e => updateField("query_sql", e.target.value)}
            placeholder={`SELECT \n  f.razao_social AS fornecedor,\n  p.valor_parcela AS valor,\n  p.data_vencimento,\n  p.status\nFROM parcela_obrigacao p\nJOIN obrigacao_pagar o ON p.id_obrigacao = o.id_obrigacao\nLEFT JOIN fornecedor f ON o.id_fornecedor = f.id_fornecedor\nWHERE p.data_vencimento BETWEEN :data_inicio AND :data_fim`}
            spellCheck={false}
          />
        </div>

        {/* PARÂMETROS */}
        <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#f59e0b", fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>⚡ Parâmetros de Execução</h3>

          {/* Lista de parâmetros existentes */}
          {form.parametros.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {form.parametros.map((p, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>:{p.nome}</span>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{p.label}</span>
                    <span style={{
                      background: "rgba(139,92,246,0.12)", color: "#a78bfa", padding: "2px 8px",
                      borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                    }}>{p.tipo}</span>
                    {p.obrigatorio && <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>Obrigatório</span>}
                  </div>
                  <button type="button" onClick={() => removeParam(i)} style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar parâmetro */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
            <div style={{ flex: "1 1 120px" }}>
              <label style={labelStyle}>Nome (bind)</label>
              <input style={inputStyle} value={newParam.nome} onChange={e => setNewParam(p => ({ ...p, nome: e.target.value.replace(/\s/g, "_").toLowerCase() }))} placeholder="data_inicio" />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={labelStyle}>Label (exibição)</label>
              <input style={inputStyle} value={newParam.label} onChange={e => setNewParam(p => ({ ...p, label: e.target.value }))} placeholder="Data Inicial" />
            </div>
            <div style={{ flex: "0 0 120px" }}>
              <label style={labelStyle}>Tipo</label>
              <select style={inputStyle} value={newParam.tipo} onChange={e => setNewParam(p => ({ ...p, tipo: e.target.value }))}>
                {TIPOS_PARAM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94a3b8", cursor: "pointer", padding: "8px 0" }}>
              <input type="checkbox" checked={newParam.obrigatorio} onChange={e => setNewParam(p => ({ ...p, obrigatorio: e.target.checked }))} style={{ accentColor: "#8b5cf6" }} />
              Obrig.
            </label>
            {newParam.tipo === "select" && (
              <div style={{ flex: "1 1 200px" }}>
                <label style={labelStyle}>SQL para opções</label>
                <input style={inputStyle} value={newParam.opcoes_sql} onChange={e => setNewParam(p => ({ ...p, opcoes_sql: e.target.value }))} placeholder="SELECT id, nome FROM fornecedor" />
              </div>
            )}
            <button type="button" onClick={addParam} style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>➕ Adicionar</button>
          </div>
        </div>

        {/* AÇÕES */}
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={{ flex: 1, background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {isNew ? "➕ Criar Relatório" : "💾 Salvar Alterações"}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}