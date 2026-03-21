import React from "react";
import { 
  Search, Calendar, Filter, Download, Plus, 
  AlertCircle, Edit2, Trash2, AlertTriangle, 
  FileText, TrendingUp, CheckCircle2 
} from "lucide-react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  text: "#0f172a",       // PRETO (Contraste máximo)
  textSecondary: "#334155", // GRAFITE (Para infos secundárias)
  muted: "#64748b",      // CINZA (Apenas para labels pequenos)
  border: "#e2e8f0",
  bg: "#FFFFFF",
  bgAlt: "#f8fafc"
};

export default function FinanceiroPagar({
  contasPagar,
  loadContasPagar,
  handleExcluirObrigacao,
  handleExcluirParcela,
  setShowAddObrigacaoModal,
  setContaToEdit,
  setShowEditContaModal,
  financeiroBuscaPagar,   
  setFinanceiroBuscaPagar,
  financeiroDataInicioPagar, 
  setFinanceiroDataInicioPagar,
  financeiroDataFimPagar,    
  setFinanceiroDataFimPagar,
  filtroStatusPagar,       
  setFiltroStatusPagar,
  handleImportOFXPagar,
  loading,
  formatBRL,
  hasEditPermission,
  getStatusColor
}) {
  const totalPagar = contasPagar.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const hoje = new Date();
  
  const vencidos = contasPagar.filter(c => {
    if (!c.vencimento || ["PAGO","CONCILIADO"].includes(c.status)) return false;
    return new Date(c.vencimento + 'T12:00:00Z') < hoje;
  });
  
  const totalVencido = vencidos.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  
  const proximosSete = contasPagar.filter(c => {
    if (!c.vencimento || ["PAGO","CONCILIADO"].includes(c.status)) return false;
    const d = new Date(c.vencimento + 'T12:00:00Z');
    const diff = (d - hoje) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  const filtrados = filtroStatusPagar === "TODOS" ? contasPagar :
    filtroStatusPagar === "VENCIDOS" ? vencidos :
    contasPagar.filter(c => c.status === filtroStatusPagar);

const cardKpiStyle = (color) => ({
    background: "#FFFFFF",
    backgroundColor: "#FFFFFF", // Reforço para garantir que o branco vença
    border: `1px solid ${C.border}`,
    borderTop: `4px solid ${color}`, // DESIGN MINIMALISTA: Barra no topo
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", // Sombra mais leve
    transition: "transform 0.2s ease-in-out",
    cursor: "default",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

 {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: "Total Provisionado", value: `R$ ${formatBRL(totalPagar)}`, icon: TrendingUp, color: C.blue },
          { label: "Vencidos", value: `R$ ${formatBRL(totalVencido)}`, icon: AlertCircle, color: totalVencido > 0 ? C.red : C.green },
          { label: "Vence em 7 dias", value: proximosSete.length, icon: Calendar, color: C.yellow },
          { label: "Total de Registros", value: contasPagar.length, icon: FileText, color: C.text },
        ].map((k, i) => (
          <div key={i} 
            style={{
              // ESTILO DIRETO PARA MATAR O CINZA:
              background: "#FFFFFF", 
              backgroundColor: "#FFFFFF", 
              border: `1px solid ${C.border}`,
              borderTop: `4px solid ${k.color}`, 
              borderRadius: 16, 
              padding: "20px 22px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transition: "transform 0.2s ease-in-out",
              cursor: "default"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                {/* Cor fixa escura para o label */}
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  {k.label}
                </div>
                {/* Cor fixa preta para o valor (Contraste Máximo) */}
                <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
                  {k.value}
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                <k.icon size={20} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BARRA FILTROS + AÇÕES ── */}
      <div style={{
        background: "#FFFFFF", border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          
          <div style={{ flex: "1 1 250px", position: "relative" }}>
            <label style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Pesquisar</label>
            <div style={{ position: "relative" }}>
              <Search size={16} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, background: C.bgAlt }}
                placeholder="Fornecedor, NF, descrição..."
                value={financeiroBuscaPagar}
                onChange={e => setFinanceiroBuscaPagar(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Período</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, background: C.bgAlt }} value={financeiroDataInicioPagar} onChange={e => setFinanceiroDataInicioPagar(e.target.value)} />
              <span style={{ color: C.muted }}>a</span>
              <input type="date" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, background: C.bgAlt }} value={financeiroDataFimPagar} onChange={e => setFinanceiroDataFimPagar(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Status</label>
            <select style={{ padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, width: 140, background: C.bgAlt }} value={filtroStatusPagar} onChange={e => setFiltroStatusPagar(e.target.value)}>
              <option value="TODOS">Todos Status</option>
              <option value="ABERTO">Em Aberto</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="PAGO">Pago</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>
          
          <button onClick={loadContasPagar} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: `0 4px 12px ${C.primary}33`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} /> FILTRAR
          </button>

          <div style={{ position: "relative" }}>
            <input type="file" id="ofxUploadPagar" accept=".ofx,.pdf" style={{ display: "none" }} onChange={handleImportOFXPagar} />
            <label htmlFor="ofxUploadPagar" style={{
              background: C.green, color: "#fff", border: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: `0 4px 12px ${C.green}33`, cursor: "pointer",
              borderRadius: 10, padding: "12px 20px", fontWeight: 800, fontSize: 12
            }}>
              <Download size={16} /> {loading ? "LENDO..." : "CONCILIAR OFX"}
            </label>
          </div>

          {hasEditPermission && (
            <button onClick={() => setShowAddObrigacaoModal(true)} style={{
              background: C.blue, color: "#fff", border: "none",
              boxShadow: `0 4px 12px ${C.blue}33`, borderRadius: 10, padding: "12px 20px", fontWeight: 800, fontSize: 12, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Plus size={16} /> NOVA OBRIGAÇÃO
            </button>
          )}
        </div>
      </div>

      {/* ── ALERTA VENCIDOS ── */}
      {vencidos.length > 0 && (
        <div style={{
          background: `${C.red}08`, border: `1px solid ${C.red}20`,
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <AlertTriangle color={C.red} size={24} />
          <div>
            <span style={{ color: C.red, fontWeight: 800, fontSize: 14 }}>
              Atenção: {vencidos.length} parcela(s) vencida(s) totalizando R$ {formatBRL(totalVencido)}
            </span>
            <div style={{ color: C.subtle, fontSize: 12, fontWeight: 600 }}>Ação imediata recomendada para evitar juros e multas.</div>
          </div>
        </div>
      )}

      {/* ── TABELA ── */}
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bgAlt }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color={C.primary} /> Contas a Pagar & Provisões
          </h2>
          <span style={{ fontSize: 11, color: C.subtle, fontWeight: 800, background: '#fff', padding: '4px 12px', borderRadius: 20, border: `1px solid ${C.border}` }}>
            {filtrados.length} REGISTROS
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["Vencimento", "Fatura / Título", "Descrição", "Fornecedor", "NF", "Parc.", "Valor", "Status", "Ações"].map((h, i) => (
                  <th key={i} style={{ padding: "16px", textAlign: h === "Ações" || h === "Parc." ? "center" : "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((c, idx) => {
                const atrasado = c.vencimento && !["PAGO", "CONCILIADO"].includes(c.status) && new Date(c.vencimento + "T12:00:00Z") < hoje;
                const statusColor = getStatusColor(atrasado ? "ATRASADO" : c.status);
                
                return (
                  <tr key={idx} style={{ 
                    borderBottom: `1px solid ${C.border}`,
                    background: atrasado ? `${C.red}05` : "transparent",
                    transition: "background 0.2s ease"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = atrasado ? `${C.red}08` : C.bgAlt}
                    onMouseLeave={e => e.currentTarget.style.background = atrasado ? `${C.red}05` : "transparent"}
                  >
                    <td style={{ padding: "16px", fontSize: 13 }}>
                      <strong style={{ color: atrasado ? C.red : C.text, fontWeight: 800 }}>
                        {c.vencimento ? new Date(c.vencimento + "T12:00:00Z").toLocaleDateString("pt-BR") : "-"}
                      </strong>
                      {atrasado && <span style={{ display: "block", fontSize: 9, color: C.red, fontWeight: 900, marginTop: 4 }}>⚠️ VENCIDO</span>}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ color: C.blue, fontSize: 11, fontWeight: 900, display: "block" }}>{c.fatura || "FAT-000"}</span>
                      <span style={{ color: C.subtle, fontSize: 10, fontWeight: 700 }}>{c.titulo || "TIT-000"}</span>
                    </td>
                    <td style={{ padding: "16px", maxWidth: 180 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 700, color: C.text, fontSize: 13 }}>{c.descricao}</div>
                    </td>
                    <td style={{ padding: "16px", fontSize: 12, color: C.subtle, fontWeight: 600 }}>{c.fornecedor || "-"}</td>
                    <td style={{ padding: "16px", fontSize: 11, color: C.muted, fontWeight: 700 }}>{c.numero_nf || "S/N"}</td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{ background: C.bgAlt, border: `1px solid ${C.border}`, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.subtle }}>
                        {c.parcela_atual}/{c.qtd_parcelas}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ color: atrasado ? C.red : C.text, fontWeight: 900, fontSize: 14 }}>
                        R$ {formatBRL(c.valor)}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        background: `${statusColor}12`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`,
                        padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        {atrasado || c.status === "ATRASADO" ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                        {atrasado ? "ATRASADO" : c.status}
                      </span>
                    </td>
                    {hasEditPermission && (
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => { setContaToEdit(c); setShowEditContaModal(true); }}
                            title="Editar Parcela"
                            style={{ background: "#fff", color: C.blue, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.background = `${C.blue}05`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "#fff"; }}
                          ><Edit2 size={14} /></button>
                          
                          <button
                            onClick={() => handleExcluirParcela(c.id)}
                            title="Excluir Parcela"
                            style={{ background: "#fff", color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = `${C.red}05`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "#fff"; }}
                          ><Trash2 size={14} /></button>

                          <button
                            onClick={() => handleExcluirObrigacao(c.id_obrigacao, c.descricao)}
                            title="Excluir OBRIGAÇÃO INTEIRA"
                            style={{ background: `${C.red}10`, color: C.red, border: `1px solid ${C.red}20`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.color = C.red; }}
                          ><AlertTriangle size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={hasEditPermission ? 9 : 8} style={{ padding: 80, textAlign: "center" }}>
                    <div style={{ color: C.muted, fontSize: 14, fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Search size={40} strokeWidth={1} />
                      Nenhum registro encontrado para este período.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}