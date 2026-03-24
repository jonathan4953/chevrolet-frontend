import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { api } from "./api";

// ============================================================
// GestaoAtivos.jsx — Módulo Gestão de Ativos de Locação v5
// ROI, Payback, Projeção, OM com Docs, Gestão de Estoque
// ============================================================

const STATUS_COLORS = {
  DISPONIVEL: { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981", label: "Disponível" },
  LOCADO:     { bg: "rgba(59,130,246,0.15)", border: "#3b82f6", text: "#3b82f6", label: "Locado" },
  RESERVADO:  { bg: "rgba(242,107,37,0.15)", border: "#F26B25", text: "#F26B25", label: "Reservado" },
  MANUTENCAO: { bg: "rgba(249,115,22,0.15)", border: "#f97316", text: "#f97316", label: "Manutenção" },
  INATIVO:    { bg: "rgba(100,116,139,0.15)", border: "#64748b", text: "#64748b", label: "Inativo" },
};

const LOCACAO_STATUS_COLORS = {
  ATIVA:      { bg: "rgba(16,185,129,0.15)", text: "#10b981", label: "Ativa" },
  FINALIZADA: { bg: "rgba(100,116,139,0.15)", text: "#64748b", label: "Finalizada" },
  ATRASADA:   { bg: "rgba(248,113,113,0.15)", text: "#ef4444", label: "Atrasada" },
};

const HISTORICO_TIPO_COLORS = {
  ENTRADA: "#10b981", BAIXA: "#ef4444", LOCACAO_INICIO: "#3b82f6",
  LOCACAO_FIM: "#6366f1", MANUTENCAO_INICIO: "#f97316", MANUTENCAO_FIM: "#10b981",
  STATUS_CHANGE: "#8b5cf6", DOCUMENTO: "#64748b",
};
const HISTORICO_TIPO_ICONS = {
  ENTRADA: "📥", BAIXA: "📤", LOCACAO_INICIO: "📋", LOCACAO_FIM: "✅",
  MANUTENCAO_INICIO: "🔧", MANUTENCAO_FIM: "✅", STATUS_CHANGE: "🔄", DOCUMENTO: "📎",
};

const fmtCur = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};
const fmtDate = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
};
const fmtDateTime = (d) => {
  if (!d || d === "None") return "—";
  try { return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; }
};

// ---- Small reusable components ----
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", marginLeft: 5, cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", fontSize: 9, fontWeight: 800, background: "rgba(59,130,246,0.15)", color: "#3b82f6", lineHeight: 1 }}>i</span>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1e293b", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#f8fafc", whiteSpace: "normal", width: "max-content", maxWidth: 220, textAlign: "center", zIndex: 99999, boxShadow: "0 8px 25px rgba(0,0,0,0.2)", pointerEvents: "none" }}>
          {text}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e293b" }} />
        </div>
      )}
    </span>
  );
}

function StatusBadge({ status, map = STATUS_COLORS }) {
  const sc = map[status] || { bg: "#f1f5f9", text: "#64748b", label: status };
  return <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text, textTransform: "uppercase", letterSpacing: 0.5 }}>{sc.label}</span>;
}

// ---- Document Uploader ----
function DocumentUploader({ arquivos, setArquivos, maxFiles = 5 }) {
  const ref = useRef(null);
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const novos = [];
    for (const file of files) {
      if (!validTypes.includes(file.type) || file.size > 10485760) continue;
      if (arquivos.length + novos.length >= maxFiles) break;
      novos.push({ file, name: file.name, type: file.type, size: file.size, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
    }
    if (novos.length > 0) setArquivos(prev => [...prev, ...novos]);
    if (ref.current) ref.current.value = "";
  };
  const fmtSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>📎 Documentos Comprobatórios (Opcional)</label>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>{arquivos.length}/{maxFiles}</span>
      </div>
      <div onClick={() => arquivos.length < maxFiles && ref.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#F26B25"; }}
        onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#cbd5e1"; handleFiles({ target: { files: e.dataTransfer.files } }); }}
        style={{ border: "2px dashed #cbd5e1", borderRadius: 10, padding: "16px 20px", textAlign: "center", cursor: arquivos.length < maxFiles ? "pointer" : "default", background: "#f8fafc", opacity: arquivos.length >= maxFiles ? 0.5 : 1 }}>
        <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.5 }}>📷 📄</div>
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{arquivos.length < maxFiles ? "Clique ou arraste imagens e PDFs" : "Limite atingido"}</div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>JPG, PNG, WEBP ou PDF • Máx 10MB</div>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFiles} style={{ display: "none" }} />
      </div>
      {arquivos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {arquivos.map((arq, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0" }}>
              {arq.preview ? <img src={arq.preview} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0" }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📄</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arq.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtSize(arq.size)}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setArquivos(prev => { const u = [...prev]; if (u[i].preview) URL.revokeObjectURL(u[i].preview); u.splice(i, 1); return u; }); }} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- ROI / Payback / Projeção Visual ----
function PainelFinanceiro({ roi, styles: s }) {
  const [tab, setTab] = useState("resumo");
  if (!roi) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 20, fontSize: 12 }}>Carregando dados financeiros...</p>;

  const tabBtn = (key, label) => ({
    padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
    border: "1px solid", transition: "all 0.2s",
    background: tab === key ? "#F26B25" : "#fff",
    color: tab === key ? "#fff" : "#64748b",
    borderColor: tab === key ? "#F26B25" : "#e2e8f0",
  });

  const paybackPct = roi.payback_atingido ? 100 : roi.valor_aquisicao > 0 ? Math.min(Math.round((roi.lucro_bruto / roi.valor_aquisicao) * 100), 99) : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTab("resumo")} style={tabBtn("resumo", "Resumo")}>📊 Resumo</button>
        <button onClick={() => setTab("projecao")} style={tabBtn("projecao", "Projeção")}>📈 Projeção 12m</button>
        <button onClick={() => setTab("historico")} style={tabBtn("historico", "Histórico")}>📉 Receita Mensal</button>
      </div>

      {/* === TAB RESUMO === */}
      {tab === "resumo" && (
        <div>
          {/* ROI + Payback Hero */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* ROI Card */}
            <div style={{ background: roi.roi >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${roi.roi >= 0 ? "#6ee7b7" : "#fca5a5"}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                ROI <InfoTip text="Retorno sobre Investimento = (Lucro Bruto ÷ Valor Aquisição) × 100" />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: roi.roi >= 0 ? "#10b981" : "#ef4444", marginTop: 4 }}>
                {roi.roi}%
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                Lucro: {fmtCur(roi.lucro_bruto)}
              </div>
            </div>

            {/* Payback Card */}
            <div style={{ background: roi.payback_atingido ? "rgba(16,185,129,0.08)" : "rgba(242,107,37,0.08)", border: `1px solid ${roi.payback_atingido ? "#6ee7b7" : "#fdba74"}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Payback <InfoTip text="Tempo para recuperar o investimento inicial com o lucro operacional" />
              </div>
              {roi.payback_atingido ? (
                <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981", marginTop: 4 }}>✅ Atingido</div>
              ) : roi.payback_meses ? (
                <div style={{ fontSize: 28, fontWeight: 900, color: "#F26B25", marginTop: 4 }}>{roi.payback_meses}<span style={{ fontSize: 14, fontWeight: 600 }}> meses</span></div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", marginTop: 8 }}>Indefinido</div>
              )}
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                {roi.payback_atingido ? "Investimento recuperado!" : roi.meses_restantes_payback ? `${roi.meses_restantes_payback}m restantes` : "Lucro mensal ≤ 0"}
              </div>
            </div>
          </div>

          {/* Barra de progresso do payback */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>PROGRESSO DO PAYBACK</span>
              <span style={{ fontSize: 10, color: "#F26B25", fontWeight: 800 }}>{paybackPct}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#e2e8f0", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 5, transition: "width 0.8s ease",
                width: `${paybackPct}%`,
                background: paybackPct >= 100 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #F26B25, #f97316)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>R$ 0</span>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>Aquisição: {fmtCur(roi.valor_aquisicao)}</span>
            </div>
          </div>

          {/* KPIs grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Receita Total", value: fmtCur(roi.receita_total), color: "#10b981" },
              { label: "Custo Manutenção", value: fmtCur(roi.custo_manutencao_total), color: "#ef4444" },
              { label: "Lucro Bruto", value: fmtCur(roi.lucro_bruto), color: roi.lucro_bruto >= 0 ? "#10b981" : "#ef4444" },
              { label: "Receita Média/Mês", value: fmtCur(roi.receita_media_mensal), color: "#3b82f6" },
              { label: "Custo Médio/Mês", value: fmtCur(roi.custo_medio_mensal), color: "#f97316" },
              { label: "Lucro Médio/Mês", value: fmtCur(roi.lucro_medio_mensal), color: roi.lucro_medio_mensal >= 0 ? "#10b981" : "#ef4444" },
              { label: "Total Locações", value: roi.total_locacoes, color: "#3b82f6" },
              { label: "Dias Locados", value: `${roi.dias_locados}d`, color: "#8b5cf6" },
              { label: "Taxa Ocupação", value: `${roi.taxa_ocupacao}%`, color: "#F26B25" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 14, color: k.color, fontWeight: 800, marginTop: 2 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Depreciação */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>
              📉 Depreciação Linear <InfoTip text="Depreciação calculada pelo método linear: valor aquisição ÷ vida útil em meses" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Deprec./Mês", value: fmtCur(roi.depreciacao_mensal), color: "#64748b" },
                { label: "Deprec. Acum.", value: fmtCur(roi.depreciacao_acumulada), color: "#ef4444" },
                { label: "Valor Residual", value: fmtCur(roi.valor_residual), color: "#10b981" },
                { label: "Vida Restante", value: `${Math.round(roi.vida_util_restante)}m`, color: "#8b5cf6" },
              ].map((d, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 13, color: d.color, fontWeight: 800, marginTop: 2 }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === TAB PROJEÇÃO 12 MESES === */}
      {tab === "projecao" && (
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>
            Projeção baseada na média mensal atual: <strong style={{ color: "#10b981" }}>{fmtCur(roi.receita_media_mensal)}</strong> receita | <strong style={{ color: "#ef4444" }}>{fmtCur(roi.custo_medio_mensal)}</strong> custo
          </div>

          {/* Gráfico de barras empilhadas */}
          {roi.projecao_12_meses && roi.projecao_12_meses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 180, padding: "0 4px" }}>
                {(() => {
                  const maxVal = Math.max(...roi.projecao_12_meses.map(p => Math.max(p.receita_acumulada, roi.valor_aquisicao)), 1);
                  return roi.projecao_12_meses.map((p, i) => {
                    const lucroH = Math.max((p.lucro_acumulado / maxVal) * 150, 2);
                    const aquisH = (roi.valor_aquisicao / maxVal) * 150;
                    const isPB = p.payback_atingido;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
                        <span style={{ fontSize: 8, color: isPB ? "#10b981" : "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {fmtCur(p.lucro_acumulado).replace("R$\u00a0", "")}
                        </span>
                        <div style={{ position: "relative", width: "100%", height: 150 }}>
                          {/* Linha do payback */}
                          <div style={{
                            position: "absolute", bottom: aquisH, left: -2, right: -2,
                            height: 2, background: "#ef4444",
                            borderRadius: 1, zIndex: 2, opacity: 0.6,
                          }} />
                          {/* Barra de lucro acumulado */}
                          <div style={{
                            position: "absolute", bottom: 0, left: "10%", right: "10%",
                            height: Math.max(lucroH, 2),
                            borderRadius: "4px 4px 0 0",
                            background: isPB
                              ? "linear-gradient(to top, #10b981, #34d399)"
                              : "linear-gradient(to top, #F26B25, #fb923c)",
                            transition: "height 0.5s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: 8, color: "#94a3b8", fontWeight: 600 }}>{p.mes.split("/")[0]}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#F26B25" }} /> Antes do Payback
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /> Após Payback
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 10, height: 2, background: "#ef4444" }} /> Valor Aquisição
                </span>
              </div>
            </div>
          )}

          {/* Tabela de projeção */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  {["Mês", "Receita Acum.", "Custo Acum.", "Lucro Acum.", "Valor Residual", "Payback"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(roi.projecao_12_meses || []).map((p, i) => (
                  <tr key={i} style={{ background: p.payback_atingido ? "rgba(16,185,129,0.04)" : "transparent" }}>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#0f172a" }}>{p.mes}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: "#10b981", fontWeight: 600 }}>{fmtCur(p.receita_acumulada)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: "#ef4444", fontWeight: 600 }}>{fmtCur(p.custo_acumulado)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: p.lucro_acumulado >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{fmtCur(p.lucro_acumulado)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: "#8b5cf6", fontWeight: 600 }}>{fmtCur(p.valor_residual)}</td>
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9" }}>
                      {p.payback_atingido
                        ? <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 800, background: "rgba(16,185,129,0.15)", color: "#10b981" }}>ATINGIDO</span>
                        : <span style={{ fontSize: 10, color: "#94a3b8" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TAB HISTÓRICO RECEITA MENSAL === */}
      {tab === "historico" && (
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>Receita vs Custo — Últimos 12 meses</div>
          {roi.receita_mensal_historica && roi.receita_mensal_historica.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160, padding: "0 4px" }}>
                {(() => {
                  const maxVal = Math.max(...roi.receita_mensal_historica.map(m => Math.max(m.receita, m.custo)), 1);
                  return roi.receita_mensal_historica.map((m, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 120, width: "100%" }}>
                        <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "linear-gradient(to top, #10b981, #34d399)", height: Math.max((m.receita / maxVal) * 110, 1), transition: "height 0.5s" }} />
                        <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "linear-gradient(to top, #ef4444, #fca5a5)", height: Math.max((m.custo / maxVal) * 110, 1), transition: "height 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 8, color: "#94a3b8", fontWeight: 600 }}>{m.mes}</span>
                    </div>
                  ));
                })()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, justifyContent: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /> Receita
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} /> Custo Manutenção
                </span>
              </div>

              {/* Tabela resumo */}
              <div style={{ overflowX: "auto", marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr>
                    {["Mês", "Receita", "Custo", "Lucro"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {roi.receita_mensal_historica.map((m, i) => (
                      <tr key={i}>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700 }}>{m.mes}</td>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: "#10b981", fontWeight: 600 }}>{fmtCur(m.receita)}</td>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: "#ef4444", fontWeight: 600 }}>{fmtCur(m.custo)}</td>
                        <td style={{ padding: "6px 10px", borderBottom: "1px solid #f1f5f9", color: m.lucro >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{fmtCur(m.lucro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Histórico Timeline ----
function HistoricoTimeline({ historico, onVerDocumento }) {
  const items = Array.isArray(historico) ? historico : [];
  if (items.length === 0) return <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}><div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📋</div><p style={{ fontSize: 13, fontWeight: 600 }}>Nenhum histórico registrado</p></div>;
  return (
    <div style={{ position: "relative", paddingLeft: 32 }}>
      <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: "#e2e8f0", borderRadius: 1 }} />
      {items.map((item, i) => {
        const color = HISTORICO_TIPO_COLORS[item.tipo] || "#64748b";
        const icon = HISTORICO_TIPO_ICONS[item.tipo] || "📝";
        return (
          <div key={i} style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", left: -32, top: 4, width: 22, height: 22, borderRadius: "50%", background: `${color}20`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, zIndex: 2 }}>{icon}</div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div><span style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.tipo_label || item.tipo}</span>{item.usuario && <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 8 }}>por {item.usuario}</span>}</div>
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>{fmtDateTime(item.data)}</span>
              </div>
              <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.5 }}>{item.descricao}</p>
              {item.detalhes && (() => { try { const d = typeof item.detalhes === "string" ? JSON.parse(item.detalhes) : item.detalhes; return d && typeof d === "object" ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>{Object.entries(d).map(([k, v]) => <div key={k} style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 10, color: "#475569" }}><span style={{ fontWeight: 700 }}>{k}:</span> {String(v)}</div>)}</div> : null; } catch { return null; } })()}
              {item.documentos && item.documentos.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {item.documentos.map((doc, j) => (
                    <div key={j} onClick={() => onVerDocumento?.(doc)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.15)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}>
                      {doc.tipo?.startsWith("image/") ? <img src={doc.url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }} /> : <span style={{ fontSize: 14 }}>📄</span>}
                      <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Ações Dropdown ----
function AcoesDropdown({ ativo, onEditar, onBaixa, onVerDetalhe, onMudarStatus, onVerHistorico }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const items = [
    { label: "👁️ Ver Detalhes", onClick: () => { onVerDetalhe(ativo.id); setOpen(false); } },
    { label: "📜 Histórico Completo", onClick: () => { onVerHistorico(ativo); setOpen(false); } },
    { label: "✏️ Editar", onClick: () => { onEditar(ativo); setOpen(false); } },
    { label: "🔄 Alterar Status / OM", onClick: () => { onMudarStatus(ativo); setOpen(false); } },
    { sep: true },
    { label: "📦 Baixa de Estoque", onClick: () => { onBaixa(ativo); setOpen(false); }, danger: true },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, padding: "5px 10px", fontSize: 14, cursor: "pointer", color: "#475569", lineHeight: 1 }}>⋮</button>
      {open && <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "4px 0", minWidth: 210, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}>
        {items.map((item, i) => item.sep ? <div key={i} style={{ height: 1, background: "#e2e8f0", margin: "4px 0" }} /> :
          <div key={i} onClick={e => { e.stopPropagation(); item.onClick(); }} style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", color: item.danger ? "#ef4444" : "#334155" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{item.label}</div>
        )}
      </div>}
    </div>
  );
}

// ---- Alert dismiss helpers ----
const ALERTA_KEY = "omni26_ativos_alertas_dismissed";
function getDismissedToday() { try { const d = JSON.parse(localStorage.getItem(ALERTA_KEY) || "{}"); return d.date === new Date().toISOString().slice(0, 10) ? (d.ids || []) : []; } catch { return []; } }
function dismissAlerta(k) { try { const h = new Date().toISOString().slice(0, 10); const d = JSON.parse(localStorage.getItem(ALERTA_KEY) || "{}"); const ids = d.date === h ? (d.ids || []) : []; ids.push(k); localStorage.setItem(ALERTA_KEY, JSON.stringify({ date: h, ids })); } catch {} }

async function uploadDocumentos(arquivos, contexto, contextoId) {
  if (!arquivos || arquivos.length === 0) return [];
  const up = [];
  for (const arq of arquivos) {
    try {
      const fd = new FormData(); fd.append("file", arq.file); fd.append("contexto", contexto); fd.append("contexto_id", String(contextoId));
      const r = await api.post("/ativos-module/documentos/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      up.push(r.data);
    } catch (e) { console.error("Upload err:", arq.name, e); }
  }
  return up;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function GestaoAtivos({ styles, currentUser, showToast, logAction }) {
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [buscaAtivo, setBuscaAtivo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [showFormAtivo, setShowFormAtivo] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState(null);
  const [ativoDetalhe, setAtivoDetalhe] = useState(null);
  const [formAtivo, setFormAtivo] = useState({ nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0, valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60, codigo_rastreio: "", observacoes: "", imagem_url: "" });
  const [imagemPreview, setImagemPreview] = useState(null);

  const [ativoParaStatus, setAtivoParaStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [formAberturaOM, setFormAberturaOM] = useState({ tipo: "PREVENTIVA", data_inicio: new Date().toISOString().split("T")[0], descricao_problema: "", responsavel: "", custo_estimado: 0 });
  const [arquivosAberturaOM, setArquivosAberturaOM] = useState([]);
  const [formFechamentoOM, setFormFechamentoOM] = useState({ data_fim: new Date().toISOString().split("T")[0], descricao_solucao: "", responsavel: "", custo_real: 0 });
  const [arquivosFechamentoOM, setArquivosFechamentoOM] = useState([]);

  const [estoqueAtivoSelecionado, setEstoqueAtivoSelecionado] = useState(null);
  const [historicoAtivo, setHistoricoAtivo] = useState([]);
  const [roiAtivo, setRoiAtivo] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [documentoViewer, setDocumentoViewer] = useState(null);
  const [filtroEstoque, setFiltroEstoque] = useState("");
  const [filtroEstoqueStatus, setFiltroEstoqueStatus] = useState("");
  const [estoqueTab, setEstoqueTab] = useState("historico"); // historico | financeiro

  const [showBaixaModal, setShowBaixaModal] = useState(null);
  const [formBaixa, setFormBaixa] = useState({ motivo: "", observacoes: "" });
  const [arquivosBaixa, setArquivosBaixa] = useState([]);

  const [locacoes, setLocacoes] = useState([]);
  const [filtroLocacao, setFiltroLocacao] = useState("");
  const [showFormLocacao, setShowFormLocacao] = useState(false);
  const [formLocacao, setFormLocacao] = useState({ ativo_id: "", cliente_id: "", data_inicio: "", data_prevista_fim: "", valor_contrato: 0, valor_diaria: 0, observacoes: "" });
  const [manutencoes, setManutencoes] = useState([]);
  const [showFormManutencao, setShowFormManutencao] = useState(false);
  const [formManutencao, setFormManutencao] = useState({ ativo_id: "", tipo: "CORRETIVA", custo: 0, descricao: "", responsavel: "" });
  const [clientes, setClientes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [dismissedAlertas, setDismissedAlertas] = useState(getDismissedToday());

  const alertasVisiveis = useMemo(() => alertas.filter(a => !dismissedAlertas.includes(`${a.tipo}_${a.ativo_nome || a.locacao_id || a.manutencao_id}`)), [alertas, dismissedAlertas]);
  const handleDismissAlerta = (a) => { const k = `${a.tipo}_${a.ativo_nome || a.locacao_id || a.manutencao_id}`; dismissAlerta(k); setDismissedAlertas(prev => [...prev, k]); };

  const empresaId = currentUser?.empresa_id || 1;

  // ---- Data loading ----
  const loadDashboard = async () => { try { setLoading(true); const r = await api.get(`/ativos-module/dashboard?empresa_id=${empresaId}`); setDashboard(r.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const loadAtivos = async () => { try { let url = `/ativos-module/ativos?empresa_id=${empresaId}`; if (filtroStatus) url += `&status=${filtroStatus}`; if (filtroCategoria) url += `&categoria=${filtroCategoria}`; if (buscaAtivo) url += `&busca=${buscaAtivo}`; const r = await api.get(url); setAtivos(r.data); } catch (e) { console.error(e); } };
  const loadCategorias = async () => { try { const r = await api.get(`/ativos-module/categorias?empresa_id=${empresaId}`); setCategorias(r.data); } catch {} };
  const loadLocacoes = async () => { try { let url = `/ativos-module/locacoes?empresa_id=${empresaId}`; if (filtroLocacao) url += `&status=${filtroLocacao}`; const r = await api.get(url); setLocacoes(r.data); } catch {} };
  const loadManutencoes = async () => { try { const r = await api.get(`/ativos-module/manutencoes?empresa_id=${empresaId}`); setManutencoes(r.data); } catch {} };
  const loadClientes = async () => { try { const r = await api.get("/clientes"); setClientes(r.data || []); } catch {} };
  const loadAlertas = async () => { try { const r = await api.get(`/ativos-module/alertas?empresa_id=${empresaId}`); setAlertas(r.data.alertas || []); } catch {} };
  const loadHistoricoAtivo = async (id) => { try { setLoadingHistorico(true); const r = await api.get(`/ativos-module/ativos/${id}/historico`); const raw = r.data; const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.historico) ? raw.historico : []; setHistoricoAtivo(arr); } catch { setHistoricoAtivo([]); } finally { setLoadingHistorico(false); } };
  const loadRoiAtivo = async (id) => { try { const r = await api.get(`/ativos-module/ativos/${id}/roi`); setRoiAtivo(r.data); } catch { setRoiAtivo(null); } };

  useEffect(() => { loadClientes(); loadCategorias(); }, []);
  useEffect(() => { if (section === "dashboard") { loadDashboard(); loadAlertas(); } if (section === "ativos") loadAtivos(); if (section === "locacoes") loadLocacoes(); if (section === "manutencoes") loadManutencoes(); if (section === "estoque") loadAtivos(); }, [section]);
  useEffect(() => { if (section === "ativos") loadAtivos(); }, [filtroStatus, filtroCategoria, buscaAtivo]);
  useEffect(() => { if (section === "locacoes") loadLocacoes(); }, [filtroLocacao]);

  // ---- Actions ----
  const handleImageUpload = (e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5242880) { showToast?.("Máximo 5MB", "error"); return; } const r = new FileReader(); r.onloadend = () => { setImagemPreview(r.result); setFormAtivo(prev => ({ ...prev, imagem_url: r.result })); }; r.readAsDataURL(f); };
  const resetFormAtivo = () => { setFormAtivo({ nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0, valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60, codigo_rastreio: "", observacoes: "", imagem_url: "" }); setImagemPreview(null); };
  const editarAtivo = (a) => { setEditingAtivo(a); setFormAtivo({ nome: a.nome, categoria: a.categoria, descricao: a.descricao || "", valor_aquisicao: a.valor_aquisicao, valor_locacao_dia: a.valor_locacao_dia, data_aquisicao: a.data_aquisicao ? String(a.data_aquisicao).split("T")[0] : "", vida_util_meses: a.vida_util_meses, codigo_rastreio: a.codigo_rastreio || "", observacoes: a.observacoes || "", imagem_url: a.imagem_url || "" }); setImagemPreview(a.imagem_url || null); setShowFormAtivo(true); };
  const salvarAtivo = async () => { try { setLoading(true); if (editingAtivo) { await api.put(`/ativos-module/ativos/${editingAtivo.id}`, formAtivo); showToast?.("Ativo atualizado!", "success"); } else { await api.post("/ativos-module/ativos", { ...formAtivo, empresa_id: empresaId }); showToast?.("Ativo criado!", "success"); } setShowFormAtivo(false); setEditingAtivo(null); resetFormAtivo(); loadAtivos(); loadCategorias(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); } };

  const abrirModalStatus = (a) => { setAtivoParaStatus(a); setNovoStatus(a.status); setFormAberturaOM({ tipo: "PREVENTIVA", data_inicio: new Date().toISOString().split("T")[0], descricao_problema: "", responsavel: "", custo_estimado: 0 }); setFormFechamentoOM({ data_fim: new Date().toISOString().split("T")[0], descricao_solucao: "", responsavel: "", custo_real: 0 }); setArquivosAberturaOM([]); setArquivosFechamentoOM([]); };
  const salvarNovoStatus = async () => {
    if (!ativoParaStatus) return; const sa = ativoParaStatus.status;
    try { setLoading(true);
      if (novoStatus === "MANUTENCAO" && sa !== "MANUTENCAO") { if (!formAberturaOM.descricao_problema || !formAberturaOM.responsavel) { showToast?.("Campos obrigatórios: Descrição e Responsável.", "warning"); setLoading(false); return; } const r = await api.post(`/ativos-module/ativos/${ativoParaStatus.id}/manutencao/iniciar`, formAberturaOM); if (arquivosAberturaOM.length > 0) await uploadDocumentos(arquivosAberturaOM, "manutencao_abertura", r.data?.manutencao_id || r.data?.id); showToast?.("OM aberta!", "success"); }
      else if (novoStatus === "DISPONIVEL" && sa === "MANUTENCAO") { if (!formFechamentoOM.descricao_solucao || !formFechamentoOM.responsavel) { showToast?.("Campos obrigatórios: Solução e Responsável.", "warning"); setLoading(false); return; } const r = await api.put(`/ativos-module/ativos/${ativoParaStatus.id}/manutencao/finalizar`, formFechamentoOM); if (arquivosFechamentoOM.length > 0) await uploadDocumentos(arquivosFechamentoOM, "manutencao_fechamento", r.data?.manutencao_id || r.data?.id); showToast?.("OM finalizada!", "success"); }
      else { if (novoStatus === "LOCADO") { showToast?.("LOCADO só via Locação.", "warning"); setLoading(false); return; } await api.patch(`/ativos-module/ativos/${ativoParaStatus.id}/status`, { status: novoStatus }); showToast?.("Status atualizado!", "success"); }
      setAtivoParaStatus(null); setArquivosAberturaOM([]); setArquivosFechamentoOM([]); loadAtivos(); loadManutencoes(); if (section === "dashboard") loadDashboard();
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); }
  };

  const abrirBaixaEstoque = (a) => { setShowBaixaModal(a); setFormBaixa({ motivo: "", observacoes: "" }); setArquivosBaixa([]); };
  const confirmarBaixa = async () => { if (!showBaixaModal || !formBaixa.motivo) { showToast?.("Informe o motivo.", "warning"); return; } try { setLoading(true); await api.delete(`/ativos-module/ativos/${showBaixaModal.id}`, { data: formBaixa }); if (arquivosBaixa.length > 0) await uploadDocumentos(arquivosBaixa, "baixa_estoque", showBaixaModal.id); showToast?.("Baixa realizada!", "success"); setShowBaixaModal(null); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); } };

  const verDetalheAtivo = async (id) => { try { const r = await api.get(`/ativos-module/ativos/${id}`); setAtivoDetalhe(r.data); } catch {} };
  const verHistoricoCompleto = async (a) => { setEstoqueAtivoSelecionado(a); setEstoqueTab("historico"); await Promise.all([loadHistoricoAtivo(a.id), loadRoiAtivo(a.id)]); };

  const criarLocacao = async () => { try { setLoading(true); await api.post("/ativos-module/locacoes", { ...formLocacao, empresa_id: empresaId }); showToast?.("Locação criada!", "success"); setShowFormLocacao(false); setFormLocacao({ ativo_id: "", cliente_id: "", data_inicio: "", data_prevista_fim: "", valor_contrato: 0, valor_diaria: 0, observacoes: "" }); loadLocacoes(); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); } };
  const finalizarLocacao = async (id) => { if (!window.confirm("Finalizar locação?")) return; try { await api.put(`/ativos-module/locacoes/${id}/finalizar`); showToast?.("Finalizada!", "success"); loadLocacoes(); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } };
  const criarManutencao = async () => { try { setLoading(true); await api.post("/ativos-module/manutencoes", { ...formManutencao, empresa_id: empresaId }); showToast?.("Registrada!", "success"); setShowFormManutencao(false); setFormManutencao({ ativo_id: "", tipo: "CORRETIVA", custo: 0, descricao: "", responsavel: "" }); loadManutencoes(); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); } };
  const finalizarManutencao = async (id) => { if (!window.confirm("Finalizar manutenção?")) return; try { await api.put(`/ativos-module/manutencoes/${id}/finalizar`); showToast?.("Finalizada!", "success"); loadManutencoes(); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } };

  // ---- Styles ----
  const s = {
    card: { background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
    sectionBtn: (active) => ({ padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: active ? "#F26B25" : "#fff", color: active ? "#fff" : "#64748b", borderColor: active ? "#F26B25" : "#e2e8f0", transition: "all 0.2s", boxShadow: active ? "0 4px 10px rgba(242,107,37,0.2)" : "none" }),
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", outline: "none", boxSizing: "border-box" },
    label: { fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4, display: "block" },
    primaryBtn: { padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: "#F26B25", color: "#fff", transition: "all 0.2s", boxShadow: "0 4px 10px rgba(242,107,37,0.2)" },
    dangerBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #fca5a5", background: "#fef2f2", color: "#ef4444" },
    successBtn: { padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #6ee7b7", background: "#ecfdf5", color: "#10b981" },
    th: { padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" },
    td: { padding: "12px 14px", fontSize: 12, color: "#334155", borderBottom: "1px solid #e2e8f0" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" },
    modalContent: { background: "#fff", borderRadius: 20, padding: 30, maxWidth: 600, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
    statCard: (c) => ({ background: "#fff", borderRadius: 16, border: `1px solid ${c}33`, padding: "20px 24px", position: "relative", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }),
  };

  const sections = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "ativos", label: "Ativos", icon: "🏗️" },
    { key: "locacoes", label: "Locações", icon: "📋" },
    { key: "manutencoes", label: "Manutenções", icon: "🔧" },
    { key: "estoque", label: "Gestão de Estoque", icon: "📦" },
  ];

  const ativosDisponiveis = useMemo(() => ativos.filter(a => a.status === "DISPONIVEL"), [ativos]);
  const ativosEstoque = useMemo(() => {
    let f = [...ativos];
    if (filtroEstoque) { const se = filtroEstoque.toLowerCase(); f = f.filter(a => a.nome?.toLowerCase().includes(se) || a.codigo_rastreio?.toLowerCase().includes(se) || a.categoria?.toLowerCase().includes(se)); }
    if (filtroEstoqueStatus) f = f.filter(a => a.status === filtroEstoqueStatus);
    return f;
  }, [ativos, filtroEstoque, filtroEstoqueStatus]);

  // ============================================================
  // RENDERS (Dashboard, Ativos, Locações, Manutenções, Estoque)
  // ============================================================

  // DASHBOARD
  const renderDashboard = () => {
    if (!dashboard) return <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Carregando...</p>;
    const { visao_geral: vg, financeiro: fin, operacional: op, manutencao: man, kpis, graficos } = dashboard;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {alertasVisiveis.length > 0 && <div style={{ ...s.card, borderColor: "#fca5a5", background: "#fef2f2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 20 }}>🔔</span><span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{alertasVisiveis.length} Alerta{alertasVisiveis.length > 1 ? "s" : ""}</span></div></div>
          {alertasVisiveis.slice(0, 8).map((a, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 12, color: "#b91c1c", borderBottom: "1px solid #fecaca" }}><span>{a.mensagem}</span><button onClick={() => handleDismissAlerta(a)} style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "#64748b", fontSize: 12, cursor: "pointer", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, marginLeft: 10 }}>✕</button></div>)}
        </div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
          {[
            { label: "Total de Ativos", value: vg.total_ativos, icon: "🏗️", color: "#3b82f6", monetary: fmtCur(fin.valor_total_patrimonio) },
            { label: "Disponíveis", value: vg.disponiveis, icon: "✅", color: "#10b981", monetary: fmtCur(fin.valor_ocioso) },
            { label: "Locados", value: vg.locados, icon: "📋", color: "#F26B25", monetary: fmtCur(fin.valor_em_uso) },
            { label: "Em Manutenção", value: vg.em_manutencao, icon: "🔧", color: "#f97316" },
            { label: "Taxa de Ocupação", value: `${vg.taxa_ocupacao}%`, icon: "📈", color: "#8b5cf6" },
            { label: "Atrasados", value: op.total_atrasados, icon: "⏰", color: "#ef4444" },
          ].map((c, i) => <div key={i} style={s.statCard(c.color)}><div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}><div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${c.color}15` }} /></div><div style={{ position: "relative", zIndex: 10 }}><div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div><div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{c.label}</div><div style={{ fontSize: 26, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.value}</div>{c.monetary && <div style={{ fontSize: 12, color: "#0f172a", marginTop: 4, fontWeight: 800 }}>{c.monetary}</div>}</div></div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          <div style={s.card}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #3b82f6)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Financeiro</span></div>
            {[{ l: "Patrimônio Total", v: fmtCur(fin.valor_total_patrimonio), c: "#3b82f6" },{ l: "Valor em Uso", v: fmtCur(fin.valor_em_uso), c: "#10b981" },{ l: "Valor Ocioso", v: fmtCur(fin.valor_ocioso), c: "#f97316" },{ l: "Receita Mês", v: fmtCur(fin.receita_mes), c: "#F26B25" },{ l: "Custo Manut.", v: fmtCur(fin.custo_manutencao_mes), c: "#ef4444" },{ l: "Lucro Oper.", v: fmtCur(fin.lucro_operacional_mes), c: fin.lucro_operacional_mes >= 0 ? "#10b981" : "#ef4444" }].map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}><span style={{ fontSize: 12, color: "#64748b" }}>{it.l}</span><span style={{ fontSize: 13, fontWeight: 700, color: it.c }}>{it.v}</span></div>)}
          </div>
          <div style={s.card}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #F26B25, #f97316)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Previsão de Retorno</span></div>
            {op.previsao_retorno?.length > 0 ? op.previsao_retorno.map((p, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}><div><div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.ativo}</div><div style={{ fontSize: 10, color: "#64748b" }}>{p.cliente}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: p.dias_restantes <= 3 ? "#ef4444" : "#F26B25", fontWeight: 700 }}>{p.dias_restantes}d</div><div style={{ fontSize: 10, color: "#64748b" }}>{fmtDate(p.data_prevista_fim)}</div></div></div>) : <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Nenhuma locação ativa</p>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div style={s.card}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #8b5cf6, #3b82f6)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Top ROI</span></div>{kpis.top_roi?.length > 0 ? kpis.top_roi.map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}><div><div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}><span style={{ color: "#F26B25", marginRight: 6 }}>#{i+1}</span>{it.ativo}</div><div style={{ fontSize: 10, color: "#64748b" }}>Rec: {fmtCur(it.receita)} | Manut: {fmtCur(it.custo_manutencao)}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#10b981" }}>{it.roi}%</div></div></div>) : <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Sem dados</p>}</div>
          <div style={s.card}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #f97316, #ef4444)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Ranking Manutenção</span></div>{man.ranking?.length > 0 ? man.ranking.map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{it.ativo}</div><div style={{ display: "flex", gap: 16 }}><span style={{ fontSize: 11, color: "#f97316", fontWeight: 700 }}>{it.quantidade}x</span><span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{fmtCur(it.custo_total)}</span></div></div>) : <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: 20 }}>Sem dados</p>}</div>
        </div>
        {graficos?.receita_mensal?.length > 0 && <div style={s.card}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #F26B25)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Receita Mensal (6m)</span></div><div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, padding: "0 10px" }}>{(() => { const mx = Math.max(...graficos.receita_mensal.map(m => m.receita), 1); return graficos.receita_mensal.map((m, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><span style={{ fontSize: 10, color: "#10b981", fontWeight: 700 }}>{fmtCur(m.receita)}</span><div style={{ width: "100%", maxWidth: 50, borderRadius: "8px 8px 0 0", height: `${Math.max((m.receita/mx)*120, 4)}px`, background: "linear-gradient(to top, #10b981, #34d399)", transition: "height 0.5s" }} /><span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{m.mes}</span></div>); })()}</div></div>}
      </div>
    );
  };

  // TABLE HELPER
  const TableWrap = ({ headers, children, empty }) => <div style={{ ...s.card, padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{headers.map(h => <th key={h} style={{ ...s.th, ...(h === "" ? { width: 40 } : {}) }}>{h}</th>)}</tr></thead><tbody>{children || <tr><td colSpan={headers.length} style={{ ...s.td, textAlign: "center", color: "#64748b", padding: 40 }}>{empty}</td></tr>}</tbody></table></div></div>;

  // ATIVOS
  const renderAtivos = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Buscar..." value={buscaAtivo} onChange={e => setBuscaAtivo(e.target.value)} style={{ ...s.input, maxWidth: 250 }} />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ ...s.input, maxWidth: 180 }}><option value="">Todos Status</option>{Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ ...s.input, maxWidth: 180 }}><option value="">Todas Categorias</option>{categorias.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <button onClick={() => { resetFormAtivo(); setEditingAtivo(null); setShowFormAtivo(true); }} style={s.primaryBtn}>+ Novo Ativo</button>
      </div>
      <TableWrap headers={["", "Nome", "Categoria", "Valor Aquisição", "Valor Diária", "Status", "Código", "Ações"]} empty="Nenhum ativo encontrado">
        {ativos.length > 0 && ativos.map(a => <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => verDetalheAtivo(a.id)} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td style={{ ...s.td, padding: "6px 10px" }}>{a.imagem_url ? <img src={a.imagem_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏗️</div>}</td>
          <td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{a.nome}</td><td style={s.td}>{a.categoria}</td><td style={s.td}>{fmtCur(a.valor_aquisicao)}</td><td style={s.td}>{fmtCur(a.valor_locacao_dia)}</td><td style={s.td}><StatusBadge status={a.status} /></td><td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{a.codigo_rastreio || "—"}</td>
          <td style={s.td} onClick={e => e.stopPropagation()}><AcoesDropdown ativo={a} onEditar={editarAtivo} onBaixa={abrirBaixaEstoque} onVerDetalhe={verDetalheAtivo} onMudarStatus={abrirModalStatus} onVerHistorico={verHistoricoCompleto} /></td>
        </tr>)}
      </TableWrap>
      {/* Detalhe modal com ROI */}
      {ativoDetalhe && <div style={s.modalOverlay} onClick={() => setAtivoDetalhe(null)}><div style={{ ...s.modalContent, maxWidth: 750 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>{ativoDetalhe.imagem_url ? <img src={ativoDetalhe.imagem_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }} /> : <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏗️</div>}<div><h3 style={{ color: "#0f172a", margin: 0, fontSize: 18, fontWeight: 800 }}>{ativoDetalhe.nome}</h3><span style={{ fontSize: 11, color: "#64748b" }}>{ativoDetalhe.categoria} • {ativoDetalhe.codigo_rastreio || "Sem código"}</span></div></div>
          <StatusBadge status={ativoDetalhe.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>{[{ l: "Aquisição", v: fmtCur(ativoDetalhe.valor_aquisicao) },{ l: "Diária", v: fmtCur(ativoDetalhe.valor_locacao_dia) },{ l: "Vida Útil", v: `${ativoDetalhe.vida_util_meses}m` }].map((it, i) => <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}><div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{it.l}</div><div style={{ fontSize: 14, color: "#0f172a", fontWeight: 800, marginTop: 4 }}>{it.v}</div></div>)}</div>
        {/* PAINEL FINANCEIRO / ROI */}
        {ativoDetalhe.roi && <div style={{ ...s.card, marginBottom: 20, padding: 20 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}><div style={{ width: 4, height: 24, borderRadius: 2, background: "linear-gradient(to bottom, #10b981, #F26B25)" }} /><span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Análise Financeira do Ativo</span></div><PainelFinanceiro roi={ativoDetalhe.roi} styles={s} /></div>}
        <div style={{ marginBottom: 24 }}><h4 style={{ color: "#F26B25", fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: "uppercase" }}>📋 Últimas Locações</h4>{ativoDetalhe.locacoes?.length > 0 ? ativoDetalhe.locacoes.slice(0, 5).map((l, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12, borderBottom: "1px solid #e2e8f0" }}><span style={{ color: "#475569", fontWeight: 600 }}>{l.cliente_nome} — {fmtDate(l.data_inicio)}</span><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: "#10b981", fontWeight: 700 }}>{fmtCur(l.valor_contrato)}</span><StatusBadge status={l.status} map={LOCACAO_STATUS_COLORS} /></div></div>) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhuma locação</p>}</div>
        <div><h4 style={{ color: "#f97316", fontSize: 12, fontWeight: 800, marginBottom: 10, textTransform: "uppercase" }}>🔧 Últimas Manutenções</h4>{ativoDetalhe.manutencoes?.length > 0 ? ativoDetalhe.manutencoes.slice(0, 5).map((m, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 12, borderBottom: "1px solid #e2e8f0" }}><span style={{ color: "#475569", fontWeight: 600 }}>{m.tipo} — {m.descricao || "Sem desc."}</span><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ color: "#ef4444", fontWeight: 700 }}>{fmtCur(m.custo)}</span><span style={{ fontSize: 10, color: m.data_fim ? "#10b981" : "#f97316", fontWeight: 700 }}>{m.data_fim ? "Finalizada" : "Aberta"}</span></div></div>) : <p style={{ fontSize: 12, color: "#64748b" }}>Nenhuma manutenção</p>}</div>
        <button onClick={() => setAtivoDetalhe(null)} style={{ ...s.dangerBtn, marginTop: 24, width: "100%", padding: 12 }}>Fechar</button>
      </div></div>}
    </div>
  );

  // LOCAÇÕES
  const renderLocacoes = () => (<div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><select value={filtroLocacao} onChange={e => setFiltroLocacao(e.target.value)} style={{ ...s.input, maxWidth: 180 }}><option value="">Todas</option><option value="ATIVA">Ativas</option><option value="FINALIZADA">Finalizadas</option><option value="ATRASADA">Atrasadas</option></select><button onClick={() => setShowFormLocacao(true)} style={s.primaryBtn}>+ Nova Locação</button></div>
    <TableWrap headers={["Ativo", "Cliente", "Início", "Prev. Fim", "Fim Real", "Contrato", "Diária", "Status", "Ações"]} empty="Nenhuma locação">{locacoes.length > 0 && locacoes.map(l => <tr key={l.id} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{l.ativo_nome}</td><td style={s.td}>{l.cliente_nome}</td><td style={s.td}>{fmtDate(l.data_inicio)}</td><td style={s.td}>{fmtDate(l.data_prevista_fim)}</td><td style={s.td}>{fmtDate(l.data_real_fim)}</td><td style={s.td}>{fmtCur(l.valor_contrato)}</td><td style={s.td}>{fmtCur(l.valor_diaria)}</td><td style={s.td}><StatusBadge status={l.status} map={LOCACAO_STATUS_COLORS} /></td><td style={s.td}>{(l.status === "ATIVA" || l.status === "ATRASADA") && <button onClick={() => finalizarLocacao(l.id)} style={s.successBtn}>Finalizar</button>}</td></tr>)}</TableWrap>
  </div>);

  // MANUTENÇÕES
  const renderManutencoes = () => (<div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div><button onClick={() => setShowFormManutencao(true)} style={s.primaryBtn}>+ Registrar Manutenção</button></div>
    <TableWrap headers={["Ativo", "Tipo", "Início", "Fim", "Custo", "Descrição", "Responsável", "Ações"]} empty="Nenhuma manutenção">{manutencoes.length > 0 && manutencoes.map(m => <tr key={m.id} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}><td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{m.ativo_nome}</td><td style={s.td}><span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: m.tipo === "PREVENTIVA" ? "rgba(59,130,246,0.15)" : "rgba(242,107,37,0.15)", color: m.tipo === "PREVENTIVA" ? "#3b82f6" : "#F26B25" }}>{m.tipo}</span></td><td style={s.td}>{fmtDate(m.data_inicio)}</td><td style={s.td}>{fmtDate(m.data_fim)}</td><td style={s.td}>{fmtCur(m.custo)}</td><td style={{ ...s.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.descricao || "—"}</td><td style={s.td}>{m.responsavel || "—"}</td><td style={s.td}>{!m.data_fim && <button onClick={() => finalizarManutencao(m.id)} style={s.successBtn}>Finalizar</button>}</td></tr>)}</TableWrap>
  </div>);

  // ESTOQUE
  const renderEstoque = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Buscar nome, código, categoria..." value={filtroEstoque} onChange={e => setFiltroEstoque(e.target.value)} style={{ ...s.input, maxWidth: 300 }} />
        <select value={filtroEstoqueStatus} onChange={e => setFiltroEstoqueStatus(e.target.value)} style={{ ...s.input, maxWidth: 180 }}><option value="">Todos Status</option>{Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button onClick={() => { resetFormAtivo(); setEditingAtivo(null); setShowFormAtivo(true); }} style={s.primaryBtn}>📥 Entrada de Ativo</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {Object.entries(STATUS_COLORS).map(([st, sc]) => { const cnt = ativos.filter(a => a.status === st).length; return <div key={st} onClick={() => setFiltroEstoqueStatus(filtroEstoqueStatus === st ? "" : st)} style={{ padding: "12px 16px", borderRadius: 10, background: filtroEstoqueStatus === st ? sc.bg : "#fff", border: `1px solid ${filtroEstoqueStatus === st ? sc.border : "#e2e8f0"}`, cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: sc.text }}>{cnt}</div><div style={{ fontSize: 10, fontWeight: 700, color: sc.text, textTransform: "uppercase" }}>{sc.label}</div></div>; })}
      </div>
      <TableWrap headers={["", "Nome", "Categoria", "Código", "Status", "Dt. Aquisição", "Valor Aquisição", "Ações"]} empty="Nenhum ativo no estoque">
        {ativosEstoque.length > 0 && ativosEstoque.map(a => <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => verHistoricoCompleto(a)} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td style={{ ...s.td, padding: "6px 10px" }}>{a.imagem_url ? <img src={a.imagem_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>}</td>
          <td style={{ ...s.td, fontWeight: 700, color: "#0f172a" }}>{a.nome}</td><td style={s.td}>{a.categoria}</td><td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{a.codigo_rastreio || "—"}</td><td style={s.td}><StatusBadge status={a.status} /></td><td style={s.td}>{fmtDate(a.data_aquisicao)}</td><td style={s.td}>{fmtCur(a.valor_aquisicao)}</td>
          <td style={s.td} onClick={e => e.stopPropagation()}><div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => verHistoricoCompleto(a)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", cursor: "pointer" }}>📜 Histórico</button>
            <button onClick={() => abrirModalStatus(a)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(242,107,37,0.1)", color: "#F26B25", border: "1px solid rgba(242,107,37,0.2)", cursor: "pointer" }}>🔄 Status</button>
            {a.status !== "INATIVO" && <button onClick={() => abrirBaixaEstoque(a)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>📤 Baixa</button>}
          </div></td>
        </tr>)}
      </TableWrap>
    </div>
  );

  // ---- FORM MODALS (Ativo, Locação, Manutenção) ----
  const renderFormAtivo = () => showFormAtivo && <div style={s.modalOverlay} onClick={() => { setShowFormAtivo(false); setImagemPreview(null); }}><div style={{ ...s.modalContent, maxWidth: 650 }} onClick={e => e.stopPropagation()}><h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{editingAtivo ? "✏️ Editar Ativo" : "📥 Entrada de Ativo"}</h3>
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}><div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: "2px dashed #cbd5e1", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>{imagemPreview ? <img src={imagemPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, opacity: 0.4 }}>📷</span>}</div><div><label style={{ ...s.primaryBtn, display: "inline-block", padding: "8px 16px", fontSize: 11, cursor: "pointer" }}>📷 Foto<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} /></label>{imagemPreview && <button onClick={() => { setImagemPreview(null); setFormAtivo(p => ({ ...p, imagem_url: "" })); }} style={{ fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "block", fontWeight: 700 }}>Remover</button>}</div></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Nome *</label><input style={s.input} value={formAtivo.nome} onChange={e => setFormAtivo({ ...formAtivo, nome: e.target.value })} /></div>
      <div><label style={s.label}>Categoria</label><input style={s.input} value={formAtivo.categoria} onChange={e => setFormAtivo({ ...formAtivo, categoria: e.target.value })} list="cat-list" /><datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist></div>
      <div><label style={s.label}>Data Aquisição</label><input style={s.input} type="date" value={formAtivo.data_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, data_aquisicao: e.target.value })} /></div>
      <div><label style={s.label}>Valor Aquisição (R$)</label><input style={s.input} type="number" step="0.01" value={formAtivo.valor_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, valor_aquisicao: parseFloat(e.target.value) || 0 })} /></div>
      <div><label style={s.label}>Diária (R$)</label><input style={s.input} type="number" step="0.01" value={formAtivo.valor_locacao_dia} onChange={e => setFormAtivo({ ...formAtivo, valor_locacao_dia: parseFloat(e.target.value) || 0 })} /></div>
      <div><label style={s.label}>Vida Útil (meses)</label><input style={s.input} type="number" value={formAtivo.vida_util_meses} onChange={e => setFormAtivo({ ...formAtivo, vida_util_meses: parseInt(e.target.value) || 60 })} /></div>
      <div><label style={s.label}>Código Rastreio</label><input style={s.input} value={formAtivo.codigo_rastreio} onChange={e => setFormAtivo({ ...formAtivo, codigo_rastreio: e.target.value })} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Descrição</label><textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={formAtivo.descricao} onChange={e => setFormAtivo({ ...formAtivo, descricao: e.target.value })} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Observações</label><textarea style={{ ...s.input, minHeight: 50, resize: "vertical" }} value={formAtivo.observacoes} onChange={e => setFormAtivo({ ...formAtivo, observacoes: e.target.value })} /></div>
    </div>
    <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}><button onClick={() => { setShowFormAtivo(false); setEditingAtivo(null); setImagemPreview(null); }} style={s.dangerBtn}>Cancelar</button><button onClick={salvarAtivo} disabled={loading || !formAtivo.nome} style={{ ...s.primaryBtn, opacity: loading || !formAtivo.nome ? 0.5 : 1 }}>{loading ? "Salvando..." : editingAtivo ? "Atualizar" : "Registrar Entrada"}</button></div>
  </div></div>;

  const renderFormLocacao = () => showFormLocacao && <div style={s.modalOverlay} onClick={() => setShowFormLocacao(false)}><div style={s.modalContent} onClick={e => e.stopPropagation()}><h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>📋 Nova Locação</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Ativo *</label><select style={s.input} value={formLocacao.ativo_id} onChange={e => { const aid = parseInt(e.target.value); const at = ativos.find(a => a.id === aid); setFormLocacao({ ...formLocacao, ativo_id: aid, valor_diaria: at?.valor_locacao_dia || 0 }); }}><option value="">Selecionar...</option>{ativosDisponiveis.map(a => <option key={a.id} value={a.id}>{a.nome} — {fmtCur(a.valor_locacao_dia)}/dia</option>)}</select></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Cliente</label><select style={s.input} value={formLocacao.cliente_id} onChange={e => setFormLocacao({ ...formLocacao, cliente_id: parseInt(e.target.value) || "" })}><option value="">Selecionar...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
      <div><label style={s.label}>Início</label><input style={s.input} type="date" value={formLocacao.data_inicio} onChange={e => setFormLocacao({ ...formLocacao, data_inicio: e.target.value })} /></div>
      <div><label style={s.label}>Prev. Fim *</label><input style={s.input} type="date" value={formLocacao.data_prevista_fim} onChange={e => setFormLocacao({ ...formLocacao, data_prevista_fim: e.target.value })} /></div>
      <div><label style={s.label}>Contrato (R$)</label><input style={s.input} type="number" step="0.01" value={formLocacao.valor_contrato} onChange={e => setFormLocacao({ ...formLocacao, valor_contrato: parseFloat(e.target.value) || 0 })} /></div>
      <div><label style={s.label}>Diária (R$)</label><input style={s.input} type="number" step="0.01" value={formLocacao.valor_diaria} onChange={e => setFormLocacao({ ...formLocacao, valor_diaria: parseFloat(e.target.value) || 0 })} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Obs.</label><textarea style={{ ...s.input, minHeight: 50, resize: "vertical" }} value={formLocacao.observacoes} onChange={e => setFormLocacao({ ...formLocacao, observacoes: e.target.value })} /></div>
    </div>
    <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}><button onClick={() => setShowFormLocacao(false)} style={s.dangerBtn}>Cancelar</button><button onClick={criarLocacao} disabled={loading || !formLocacao.ativo_id || !formLocacao.data_prevista_fim} style={{ ...s.primaryBtn, opacity: loading || !formLocacao.ativo_id ? 0.5 : 1 }}>{loading ? "Criando..." : "Criar Locação"}</button></div>
  </div></div>;

  const renderFormManutencao = () => showFormManutencao && <div style={s.modalOverlay} onClick={() => setShowFormManutencao(false)}><div style={s.modalContent} onClick={e => e.stopPropagation()}><h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 24 }}>🔧 Manutenção Manual</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Ativo *</label><select style={s.input} value={formManutencao.ativo_id} onChange={e => setFormManutencao({ ...formManutencao, ativo_id: parseInt(e.target.value) || "" })}><option value="">Selecionar...</option>{ativos.filter(a => a.status !== "LOCADO" && a.status !== "INATIVO").map(a => <option key={a.id} value={a.id}>{a.nome} ({STATUS_COLORS[a.status]?.label})</option>)}</select></div>
      <div><label style={s.label}>Tipo</label><select style={s.input} value={formManutencao.tipo} onChange={e => setFormManutencao({ ...formManutencao, tipo: e.target.value })}><option value="CORRETIVA">Corretiva</option><option value="PREVENTIVA">Preventiva</option></select></div>
      <div><label style={s.label}>Custo (R$)</label><input style={s.input} type="number" step="0.01" value={formManutencao.custo} onChange={e => setFormManutencao({ ...formManutencao, custo: parseFloat(e.target.value) || 0 })} /></div>
      <div><label style={s.label}>Responsável</label><input style={s.input} value={formManutencao.responsavel} onChange={e => setFormManutencao({ ...formManutencao, responsavel: e.target.value })} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Descrição</label><textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={formManutencao.descricao} onChange={e => setFormManutencao({ ...formManutencao, descricao: e.target.value })} /></div>
    </div>
    <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}><button onClick={() => setShowFormManutencao(false)} style={s.dangerBtn}>Cancelar</button><button onClick={criarManutencao} disabled={loading || !formManutencao.ativo_id} style={{ ...s.primaryBtn, opacity: loading || !formManutencao.ativo_id ? 0.5 : 1 }}>{loading ? "Registrando..." : "Registrar"}</button></div>
  </div></div>;

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: "linear-gradient(to bottom, #F26B25, #ea580c)" }} />
        <h2 style={{ color: "#0f172a", margin: 0, fontSize: 22, fontWeight: 900 }}>Gestão de Ativos de Locação</h2>
      </div>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24, marginLeft: 16 }}>Controle de ativos, locações, manutenções, estoque, ROI e projeções</p>
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {sections.map(sec => <button key={sec.key} onClick={() => setSection(sec.key)} style={s.sectionBtn(section === sec.key)}><span style={{ marginRight: 6 }}>{sec.icon}</span> {sec.label}</button>)}
      </div>

      {section === "dashboard" && renderDashboard()}
      {section === "ativos" && renderAtivos()}
      {section === "locacoes" && renderLocacoes()}
      {section === "manutencoes" && renderManutencoes()}
      {section === "estoque" && renderEstoque()}
      {renderFormAtivo()}
      {renderFormLocacao()}
      {renderFormManutencao()}

      {/* MODAL STATUS / OM */}
      {ativoParaStatus && <div style={s.modalOverlay} onClick={() => setAtivoParaStatus(null)}><div style={{ ...s.modalContent, maxWidth: 550 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🔄 Status: <span style={{ color: STATUS_COLORS[ativoParaStatus.status]?.text }}>{ativoParaStatus.nome}</span></h3>
        <label style={s.label}>Novo status:</label>
        <select style={{ ...s.input, marginBottom: 20, fontSize: 14, fontWeight: 700 }} value={novoStatus} onChange={e => setNovoStatus(e.target.value)}>
          <option value={ativoParaStatus.status} disabled>Selecione...</option>
          {ativoParaStatus.status !== "DISPONIVEL" && <option value="DISPONIVEL">✅ Disponível</option>}
          {ativoParaStatus.status !== "MANUTENCAO" && <option value="MANUTENCAO">🔧 Manutenção (OM)</option>}
          {ativoParaStatus.status !== "RESERVADO" && <option value="RESERVADO">⏳ Reservado</option>}
          {ativoParaStatus.status !== "INATIVO" && <option value="INATIVO">🚫 Inativo</option>}
        </select>
        {novoStatus === "MANUTENCAO" && ativoParaStatus.status !== "MANUTENCAO" && <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ color: "#ea580c", margin: "0 0 16px 0", fontSize: 14, fontWeight: 800 }}>📄 Abertura de OM (Obrigatório)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={s.label}>Tipo</label><select style={s.input} value={formAberturaOM.tipo} onChange={e => setFormAberturaOM({ ...formAberturaOM, tipo: e.target.value })}><option value="PREVENTIVA">Preventiva</option><option value="CORRETIVA">Corretiva</option><option value="EMERGENCIAL">Emergencial</option></select></div>
            <div><label style={s.label}>Data Início</label><input style={s.input} type="date" value={formAberturaOM.data_inicio} onChange={e => setFormAberturaOM({ ...formAberturaOM, data_inicio: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Responsável *</label><input style={s.input} placeholder="Ex: Oficina do João" value={formAberturaOM.responsavel} onChange={e => setFormAberturaOM({ ...formAberturaOM, responsavel: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Problema *</label><textarea style={{ ...s.input, minHeight: 60 }} placeholder="O que aconteceu?" value={formAberturaOM.descricao_problema} onChange={e => setFormAberturaOM({ ...formAberturaOM, descricao_problema: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Custo Estimado (R$)</label><input style={s.input} type="number" step="0.01" value={formAberturaOM.custo_estimado} onChange={e => setFormAberturaOM({ ...formAberturaOM, custo_estimado: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <DocumentUploader arquivos={arquivosAberturaOM} setArquivos={setArquivosAberturaOM} />
        </div>}
        {novoStatus === "DISPONIVEL" && ativoParaStatus.status === "MANUTENCAO" && <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ color: "#059669", margin: "0 0 16px 0", fontSize: 14, fontWeight: 800 }}>✅ Finalizar OM</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={s.label}>Data Conclusão</label><input style={s.input} type="date" value={formFechamentoOM.data_fim} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, data_fim: e.target.value })} /></div>
            <div><label style={s.label}>Custo Real (R$)</label><input style={s.input} type="number" step="0.01" value={formFechamentoOM.custo_real} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, custo_real: parseFloat(e.target.value) || 0 })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Responsável *</label><input style={s.input} placeholder="Quem fez?" value={formFechamentoOM.responsavel} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, responsavel: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Solução *</label><textarea style={{ ...s.input, minHeight: 60 }} placeholder="O que foi feito?" value={formFechamentoOM.descricao_solucao} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, descricao_solucao: e.target.value })} /></div>
          </div>
          <DocumentUploader arquivos={arquivosFechamentoOM} setArquivos={setArquivosFechamentoOM} />
        </div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => { setAtivoParaStatus(null); setArquivosAberturaOM([]); setArquivosFechamentoOM([]); }} style={{ ...s.dangerBtn, padding: "10px 16px" }}>Cancelar</button>
          <button onClick={salvarNovoStatus} disabled={loading || novoStatus === ativoParaStatus.status} style={{ ...s.primaryBtn, opacity: (loading || novoStatus === ativoParaStatus.status) ? 0.5 : 1 }}>{loading ? "Processando..." : novoStatus === "MANUTENCAO" ? "Abrir OM" : novoStatus === "DISPONIVEL" && ativoParaStatus.status === "MANUTENCAO" ? "Finalizar OM" : "Confirmar"}</button>
        </div>
      </div></div>}

      {/* MODAL BAIXA */}
      {showBaixaModal && <div style={s.modalOverlay} onClick={() => { setShowBaixaModal(null); setArquivosBaixa([]); }}><div style={{ ...s.modalContent, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#ef4444", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>📤 Baixa de Estoque</h3>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Ativo: <strong style={{ color: "#0f172a" }}>{showBaixaModal.nome}</strong></p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={s.label}>Motivo *</label><select style={s.input} value={formBaixa.motivo} onChange={e => setFormBaixa({ ...formBaixa, motivo: e.target.value })}><option value="">Selecione...</option><option value="DESGASTE_NATURAL">Desgaste Natural</option><option value="QUEBRA_IRREPARAVEL">Quebra Irreparável</option><option value="VENDA">Venda</option><option value="PERDA_ROUBO">Perda / Roubo</option><option value="OBSOLESCENCIA">Obsolescência</option><option value="DOACAO">Doação</option><option value="OUTRO">Outro</option></select></div>
          <div><label style={s.label}>Observações</label><textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} value={formBaixa.observacoes} onChange={e => setFormBaixa({ ...formBaixa, observacoes: e.target.value })} /></div>
          <DocumentUploader arquivos={arquivosBaixa} setArquivos={setArquivosBaixa} />
        </div>
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginTop: 20, fontSize: 11, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>⚠️</span><span>O ativo será marcado como <strong>INATIVO</strong> permanentemente.</span></div>
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}><button onClick={() => { setShowBaixaModal(null); setArquivosBaixa([]); }} style={{ ...s.dangerBtn, padding: "10px 16px" }}>Cancelar</button><button onClick={confirmarBaixa} disabled={loading || !formBaixa.motivo} style={{ padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: (!loading && formBaixa.motivo) ? "#ef4444" : "#fca5a5", color: "#fff" }}>{loading ? "Processando..." : "Confirmar Baixa"}</button></div>
      </div></div>}

      {/* MODAL HISTÓRICO + FINANCEIRO DO ATIVO */}
      {estoqueAtivoSelecionado && <div style={s.modalOverlay} onClick={() => { setEstoqueAtivoSelecionado(null); setHistoricoAtivo([]); setRoiAtivo(null); }}><div style={{ ...s.modalContent, maxWidth: 800 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {estoqueAtivoSelecionado.imagem_url ? <img src={estoqueAtivoSelecionado.imagem_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} /> : <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📦</div>}
            <div><h3 style={{ color: "#0f172a", margin: 0, fontSize: 18, fontWeight: 800 }}>{estoqueAtivoSelecionado.nome}</h3><div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{estoqueAtivoSelecionado.categoria} • {estoqueAtivoSelecionado.codigo_rastreio || "Sem código"}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><StatusBadge status={estoqueAtivoSelecionado.status} /><button onClick={() => { setEstoqueAtivoSelecionado(null); setHistoricoAtivo([]); setRoiAtivo(null); }} style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button></div>
        </div>

        {/* Mini KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { l: "Aquisição", v: fmtCur(estoqueAtivoSelecionado.valor_aquisicao), c: "#3b82f6" },
            { l: "Diária", v: fmtCur(estoqueAtivoSelecionado.valor_locacao_dia), c: "#F26B25" },
            { l: "ROI", v: roiAtivo ? `${roiAtivo.roi}%` : "—", c: roiAtivo?.roi >= 0 ? "#10b981" : "#ef4444" },
            { l: "Payback", v: roiAtivo ? (roiAtivo.payback_atingido ? "✅ OK" : roiAtivo.payback_meses ? `${roiAtivo.payback_meses}m` : "∞") : "—", c: roiAtivo?.payback_atingido ? "#10b981" : "#F26B25" },
          ].map((it, i) => <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "center" }}><div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{it.l}</div><div style={{ fontSize: 14, color: it.c, fontWeight: 800, marginTop: 2 }}>{it.v}</div></div>)}
        </div>

        {/* Tabs: Histórico vs Financeiro */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setEstoqueTab("historico")} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: estoqueTab === "historico" ? "#F26B25" : "#fff", color: estoqueTab === "historico" ? "#fff" : "#64748b", borderColor: estoqueTab === "historico" ? "#F26B25" : "#e2e8f0" }}>📜 Histórico do Ciclo de Vida</button>
          <button onClick={() => setEstoqueTab("financeiro")} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", background: estoqueTab === "financeiro" ? "#F26B25" : "#fff", color: estoqueTab === "financeiro" ? "#fff" : "#64748b", borderColor: estoqueTab === "financeiro" ? "#F26B25" : "#e2e8f0" }}>📊 Análise Financeira</button>
        </div>

        {estoqueTab === "historico" && (loadingHistorico ? <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}><p>Carregando histórico...</p></div> : <HistoricoTimeline historico={historicoAtivo} onVerDocumento={doc => setDocumentoViewer(doc)} />)}

        {estoqueTab === "financeiro" && <PainelFinanceiro roi={roiAtivo} styles={s} />}

        <div style={{ display: "flex", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setEstoqueAtivoSelecionado(null); abrirModalStatus(estoqueAtivoSelecionado); }} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(242,107,37,0.1)", color: "#F26B25", border: "1px solid rgba(242,107,37,0.2)", cursor: "pointer" }}>🔄 Status / OM</button>
            {estoqueAtivoSelecionado.status !== "INATIVO" && <button onClick={() => { setEstoqueAtivoSelecionado(null); abrirBaixaEstoque(estoqueAtivoSelecionado); }} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>📤 Baixa</button>}
          </div>
          <button onClick={() => { setEstoqueAtivoSelecionado(null); setHistoricoAtivo([]); setRoiAtivo(null); }} style={s.dangerBtn}>Fechar</button>
        </div>
      </div></div>}

      {/* DOCUMENT VIEWER */}
      {documentoViewer && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setDocumentoViewer(null)}>
        <div style={{ background: "#fff", borderRadius: 16, maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{documentoViewer.nome}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {documentoViewer.url && <a href={documentoViewer.url} target="_blank" rel="noopener noreferrer" download style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#475569", textDecoration: "none", border: "1px solid #e2e8f0" }}>⬇ Download</a>}
              <button onClick={() => setDocumentoViewer(null)} style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>
          <div style={{ padding: 20, overflow: "auto", maxHeight: "80vh" }}>
            {(documentoViewer.tipo?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(documentoViewer.url || "")) && <img src={documentoViewer.url} alt={documentoViewer.nome} style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 8, display: "block", margin: "0 auto" }} />}
            {(documentoViewer.tipo === "application/pdf" || /\.pdf$/i.test(documentoViewer.url || "")) && <iframe src={documentoViewer.url} title={documentoViewer.nome} style={{ width: "100%", minWidth: 500, height: "75vh", border: "none", borderRadius: 8 }} />}
          </div>
        </div>
      </div>}
    </div>
  );
}