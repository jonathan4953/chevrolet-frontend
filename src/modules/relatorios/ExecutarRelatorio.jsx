import React, { useState, useEffect } from "react";
import { api } from "../../api";

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

const formatar_moeda_brl = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

export default function ExecutarRelatorio({ styles, relatorio, showToast, onBack }) {
  const [params, setParams] = useState({});
  const [selectOptions, setSelectOptions] = useState({});
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState("tabela"); 

  useEffect(() => {
    const defaults = {};
    (relatorio.parametros || []).forEach(p => {
      if (p.tipo === "data") defaults[p.nome] = new Date().toISOString().split("T")[0];
      else defaults[p.nome] = "";
    });
    setParams(defaults);
    
    (relatorio.parametros || []).filter(p => p.tipo === "select" && p.opcoes_sql).forEach(async (p) => {
      try {
        const res = await api.post("/relatorios/executar-opcoes", { sql: p.opcoes_sql });
        setSelectOptions(prev => ({ ...prev, [p.nome]: res.data?.dados || [] }));
      } catch (e) { console.error("Erro ao carregar opções:", e); }
    });
  }, [relatorio]);

  const handleExecutar = async (e) => {
    e.preventDefault();
    for (const p of (relatorio.parametros || [])) {
      if (p.obrigatorio && !params[p.nome]) {
        return showToast(`Preencha o parâmetro "${p.label}".`, "error");
      }
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await api.post(`/relatorios/executar/${relatorio.id}`, { parametros: params });
      setResultado(res.data);
      if (res.data?.dados?.length === 0) showToast("Consulta executada, mas não retornou dados.", "info");
    } catch (e) {
      showToast(e?.response?.data?.detail || "Erro ao executar relatório.", "error");
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!resultado?.dados?.length) return;
    const cols = resultado.colunas;
    const header = cols.join(";");
    const rows = resultado.dados.map(r => cols.map(c => String(r[c] ?? "")).join(";"));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${relatorio.nome.replace(/\s/g, "_")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const numericCols = resultado?.colunas?.filter(c =>
    resultado.dados?.some(r => typeof r[c] === "number" && !c.toLowerCase().includes("id"))
  ) || [];
  const labelCol = resultado?.colunas?.find(c => typeof resultado.dados?.[0]?.[c] === "string") || resultado?.colunas?.[0];

  const cardStyle = {
    background: "#FFFFFF",
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
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
    boxSizing: "border-box"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>← Voltar</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: C.primary }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: C.text, fontWeight: 900 }}>{relatorio.nome}</h2>
            <p style={{ color: C.muted, fontSize: "12px", margin: "2px 0 0", fontWeight: 600 }}>{relatorio.descricao || "Relatório do sistema"}</p>
          </div>
        </div>
      </div>

      {/* Formulário de Parâmetros */}
      {(relatorio.parametros || []).length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ color: C.primary, fontSize: "14px", fontWeight: 900, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>⚡ Filtros de Execução</h3>
          <form onSubmit={handleExecutar} style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {(relatorio.parametros || []).map((p, i) => (
              <div key={i} style={{ flex: "1 1 200px" }}>
                <label style={{ fontSize: "10px", color: C.muted, fontWeight: 800, textTransform: "uppercase", marginBottom: "6px", display: "block" }}>
                   {p.label} {p.obrigatorio && <span style={{ color: C.red }}>*</span>}
                </label>
                {p.tipo === "data" ? (
                  <input type="date" style={inputStyle} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} />
                ) : p.tipo === "numero" ? (
                  <input type="number" step="any" style={inputStyle} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} />
                ) : p.tipo === "select" ? (
                  <select style={inputStyle} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio}>
                    <option value="">Selecione...</option>
                    {(selectOptions[p.nome] || []).map((opt, j) => {
                      const keys = Object.keys(opt);
                      return <option key={j} value={opt[keys[0]]}>{opt[keys[1]] || opt[keys[0]]}</option>;
                    })}
                  </select>
                ) : (
                  <input type="text" style={inputStyle} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} placeholder={p.label} />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", cursor: "pointer", fontSize: "13px", fontWeight: 800, height: "42px", boxShadow: `0 4px 10px ${C.primary}33` }}>
              {loading ? "⌛ Processando..." : "▶ Gerar Relatório"}
            </button>
          </form>
        </div>
      )}

      {/* Botão rápido se não tem parâmetros */}
      {(relatorio.parametros || []).length === 0 && !resultado && (
        <button onClick={handleExecutar} disabled={loading} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 12, padding: "16px", cursor: "pointer", fontSize: "14px", fontWeight: 800, boxShadow: `0 4px 15px ${C.primary}33` }}>
          {loading ? "⌛ Processando Dados..." : "▶ Executar Relatório Completo"}
        </button>
      )}

      {/* RESULTADOS */}
      {resultado && resultado.dados && (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {/* Toolbar de resultados */}
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bgAlt }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ color: C.green, fontSize: "13px", fontWeight: 800 }}>✅ {resultado.dados.length} registros encontrados</span>
              <span style={{ color: C.muted, fontSize: "11px", fontWeight: 600 }}>Tempo: {resultado.tempo_ms || "?"}ms</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {relatorio.tipo_saida === "grafico" && numericCols.length > 0 && (
                <div style={{ display: "flex", background: "#FFFFFF", borderRadius: "10px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                  <button onClick={() => setChartMode("tabela")} style={{ padding: "6px 14px", fontSize: "11px", fontWeight: 800, border: "none", cursor: "pointer", background: chartMode === "tabela" ? C.primary : "transparent", color: chartMode === "tabela" ? "#fff" : C.subtle }}>TABELA</button>
                  <button onClick={() => setChartMode("grafico")} style={{ padding: "6px 14px", fontSize: "11px", fontWeight: 800, border: "none", cursor: "pointer", background: chartMode === "grafico" ? C.primary : "transparent", color: chartMode === "grafico" ? "#fff" : C.subtle }}>GRÁFICO</button>
                </div>
              )}
              <button onClick={exportCSV} style={{ background: "#FFFFFF", border: `1px solid ${C.green}50`, color: C.green, borderRadius: 10, padding: "6px 16px", cursor: "pointer", fontSize: "11px", fontWeight: 800 }}>📥 Exportar CSV</button>
            </div>
          </div>

          {/* Gráfico */}
          {chartMode === "grafico" && numericCols.length > 0 && (() => {
            const col = numericCols[0];
            const data = resultado.dados.slice(0, 15);
            const maxVal = Math.max(...data.map(r => Math.abs(Number(r[col]) || 0)), 1);
            const barH = 32, gap = 8, svgH = data.length * (barH + gap) + 40;
            return (
              <div style={{ padding: "30px 40px", background: "#FFFFFF" }}>
                <p style={{ color: C.subtle, fontSize: "12px", marginBottom: "20px", fontWeight: 700 }}>Análise Visual: <span style={{ color: C.primary }}>{col.toUpperCase()}</span> (Top 15)</p>
                <svg viewBox={`0 0 800 ${svgH}`} style={{ width: "100%", height: "auto" }}>
                  {data.map((r, i) => {
                    const val = Math.abs(Number(r[col]) || 0);
                    const w = (val / maxVal) * 550;
                    const y = i * (barH + gap);
                    const lbl = String(r[labelCol] || "").substring(0, 25);
                    return (
                      <g key={i}>
                        <text x={170} y={y + barH / 2 + 5} textAnchor="end" fill={C.subtle} fontSize="11" fontWeight="600">{lbl}</text>
                        <rect x={180} y={y} width={Math.max(w, 4)} height={barH} fill={i === 0 ? C.primary : C.blue} rx={6} opacity={0.85} />
                        <text x={190 + w} y={y + barH / 2 + 5} fill={C.text} fontSize="11" fontWeight="800">{formatar_moeda_brl(Number(r[col]))}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}

          {/* Tabela dinâmica */}
          {(chartMode === "tabela" || relatorio.tipo_saida !== "grafico") && (
            <div style={{ maxHeight: 600, overflowY: "auto", background: "#FFFFFF" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.bgAlt, position: 'sticky', top: 0, zIndex: 1 }}>
                    {resultado.colunas.map((col, i) => (
                      <th key={i} style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.dados.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {resultado.colunas.map((col, ci) => {
                        const val = row[col];
                        const isNum = typeof val === "number";
                        const colLow = col.toLowerCase();
                        const isMoney = isNum && (colLow.includes("valor") || colLow.includes("preco") || colLow.includes("saldo") || colLow.includes("total") || colLow.includes("receber") || colLow.includes("pagar"));
                        return (
                          <td key={ci} style={{ 
                            padding: "14px 16px", 
                            fontSize: "13px", 
                            fontFamily: isNum ? "monospace" : "inherit", 
                            textAlign: isNum ? "right" : "left", 
                            color: isMoney ? C.green : C.text, 
                            fontWeight: isMoney || isNum ? 800 : 600 
                          }}>
                            {val === null ? <span style={{ color: C.muted }}>—</span> : isMoney ? formatar_moeda_brl(val) : isNum ? val.toLocaleString("pt-BR") : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}