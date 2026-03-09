import React, { useState, useEffect } from "react";
import { api } from "../../api";

const formatar_moeda_brl = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

export default function ExecutarRelatorio({ styles, relatorio, showToast, onBack }) {
  const [params, setParams] = useState({});
  const [selectOptions, setSelectOptions] = useState({});
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState("tabela"); // "tabela" | "grafico"

  // Inicializa parâmetros com defaults
  useEffect(() => {
    const defaults = {};
    (relatorio.parametros || []).forEach(p => {
      if (p.tipo === "data") defaults[p.nome] = new Date().toISOString().split("T")[0];
      else defaults[p.nome] = "";
    });
    setParams(defaults);
    // Carrega opções para selects
    (relatorio.parametros || []).filter(p => p.tipo === "select" && p.opcoes_sql).forEach(async (p) => {
      try {
        const res = await api.post("/relatorios/executar-opcoes", { sql: p.opcoes_sql });
        setSelectOptions(prev => ({ ...prev, [p.nome]: res.data?.dados || [] }));
      } catch (e) { console.error("Erro ao carregar opções:", e); }
    });
  }, [relatorio]);

  const handleExecutar = async (e) => {
    e.preventDefault();
    // Valida obrigatórios
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
      const det = e?.response?.data?.detail || "Erro ao executar relatório.";
      showToast(det, "error");
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

  // Detecta colunas numéricas para gráfico
  const numericCols = resultado?.colunas?.filter(c =>
    resultado.dados?.some(r => typeof r[c] === "number" && !c.toLowerCase().includes("id"))
  ) || [];
  const labelCol = resultado?.colunas?.find(c => typeof resultado.dados?.[0]?.[c] === "string") || resultado?.colunas?.[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← Voltar</button>
        <div>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>{relatorio.nome}</h2>
          <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>{relatorio.descricao || "Sem descrição"}</p>
        </div>
      </div>

      {/* Formulário de Parâmetros */}
      {(relatorio.parametros || []).length > 0 && (
        <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <h3 style={{ color: "#f59e0b", fontSize: 14, fontWeight: 800, margin: "0 0 16px" }}>⚡ Parâmetros</h3>
          <form onSubmit={handleExecutar} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {(relatorio.parametros || []).map((p, i) => (
              <div key={i} style={{ flex: "1 1 180px" }}>
                <label style={styles.fieldLabel}>{p.label} {p.obrigatorio && <span style={{ color: "#ef4444" }}>*</span>}</label>
                {p.tipo === "data" ? (
                  <input type="date" style={styles.inputSmall} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} />
                ) : p.tipo === "numero" ? (
                  <input type="number" step="any" style={styles.inputSmall} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} />
                ) : p.tipo === "select" ? (
                  <select style={styles.inputSmall} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio}>
                    <option value="">Selecione...</option>
                    {(selectOptions[p.nome] || []).map((opt, j) => {
                      const keys = Object.keys(opt);
                      return <option key={j} value={opt[keys[0]]}>{opt[keys[1]] || opt[keys[0]]}</option>;
                    })}
                  </select>
                ) : (
                  <input type="text" style={styles.inputSmall} value={params[p.nome] || ""} onChange={e => setParams(prev => ({ ...prev, [p.nome]: e.target.value }))} required={p.obrigatorio} placeholder={p.label} />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 12, fontWeight: 800, height: 38 }}>
              {loading ? "⌛ Executando..." : "▶ Executar"}
            </button>
          </form>
        </div>
      )}

      {/* Botão rápido se não tem parâmetros */}
      {(relatorio.parametros || []).length === 0 && (
        <button onClick={handleExecutar} disabled={loading} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer", fontSize: 13, fontWeight: 800 }}>
          {loading ? "⌛ Executando..." : "▶ Executar Relatório"}
        </button>
      )}

      {/* RESULTADOS */}
      {resultado && resultado.dados && (
        <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          {/* Toolbar de resultados */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#10b981", fontSize: 13, fontWeight: 800 }}>✅ {resultado.dados.length} registro(s)</span>
              <span style={{ color: "#64748b", fontSize: 11 }}>em {resultado.tempo_ms || "?"}ms</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {relatorio.tipo_saida === "grafico" && numericCols.length > 0 && (
                <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setChartMode("tabela")} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: chartMode === "tabela" ? "#8b5cf6" : "transparent", color: chartMode === "tabela" ? "#fff" : "#94a3b8" }}>Tabela</button>
                  <button onClick={() => setChartMode("grafico")} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: chartMode === "grafico" ? "#8b5cf6" : "transparent", color: chartMode === "grafico" ? "#fff" : "#94a3b8" }}>Gráfico</button>
                </div>
              )}
              <button onClick={exportCSV} style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>📥 CSV</button>
            </div>
          </div>

          {/* Gráfico (barras horizontais simples em SVG) */}
          {chartMode === "grafico" && numericCols.length > 0 && (() => {
            const col = numericCols[0];
            const data = resultado.dados.slice(0, 20);
            const maxVal = Math.max(...data.map(r => Math.abs(Number(r[col]) || 0)), 1);
            const barH = 28, gap = 4, svgH = data.length * (barH + gap) + 20;
            return (
              <div style={{ padding: "20px 24px" }}>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 12 }}>Coluna: <strong style={{ color: "#a78bfa" }}>{col}</strong> (top 20)</p>
                <svg viewBox={`0 0 700 ${svgH}`} style={{ width: "100%", height: "auto" }}>
                  {data.map((r, i) => {
                    const val = Math.abs(Number(r[col]) || 0);
                    const w = (val / maxVal) * 500;
                    const y = i * (barH + gap);
                    const lbl = String(r[labelCol] || "").substring(0, 30);
                    return (
                      <g key={i}>
                        <rect x={150} y={y} width={Math.max(w, 2)} height={barH} fill="rgba(139,92,246,0.6)" rx={4} />
                        <text x={145} y={y + barH / 2 + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{lbl}</text>
                        <text x={155 + w} y={y + barH / 2 + 4} fill="#a78bfa" fontSize="10" fontWeight="bold">{formatar_moeda_brl(Number(r[col]))}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })()}

          {/* Tabela dinâmica */}
          {(chartMode === "tabela" || relatorio.tipo_saida !== "grafico") && (
            <div style={{ ...styles.tableWrapper, maxHeight: 500, overflowY: "auto" }}>
              <table style={styles.tableMassa}>
                <thead>
                  <tr>
                    {resultado.colunas.map((col, i) => (
                      <th key={i} style={{ ...styles.thMassa, whiteSpace: "nowrap" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultado.dados.map((row, ri) => (
                    <tr key={ri} style={styles.trBody}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {resultado.colunas.map((col, ci) => {
                        const val = row[col];
                        const isNum = typeof val === "number";
                        const isMoney = isNum && (col.toLowerCase().includes("valor") || col.toLowerCase().includes("preco") || col.toLowerCase().includes("saldo") || col.toLowerCase().includes("total"));
                        return (
                          <td key={ci} style={{ ...styles.tdMassa, fontFamily: isNum ? "monospace" : "inherit", textAlign: isNum ? "right" : "left", color: isMoney ? "#4ade80" : undefined, fontWeight: isMoney ? 700 : undefined }}>
                            {val === null ? <span style={{ color: "#475569" }}>—</span> : isMoney ? formatar_moeda_brl(val) : isNum ? val.toLocaleString("pt-BR") : String(val)}
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