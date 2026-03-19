import { useState } from "react";

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

export default function FinanceiroPagar({
  styles,
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
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 16,
    padding: "20px 22px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    transition: "transform 0.2s",
    cursor: "default"
  });

  return (
    <div style={{display:'flex', flexDirection:'column', gap:24, fontFamily: "system-ui, sans-serif"}}>

      {/* ── KPI CARDS ── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16}}>
        {[
          { label:"Total Provisionado", value:`R$ ${formatBRL(totalPagar)}`, icon:"📋", color: C.text },
          { label:"Vencidos", value:`R$ ${formatBRL(totalVencido)}`, icon:"⚠️", color: totalVencido > 0 ? C.red : C.green },
          { label:"Vence em 7 dias", value: proximosSete.length, icon:"📅", color: C.yellow },
          { label:"Total de Registros", value: contasPagar.length, icon:"📄", color: C.blue },
        ].map((k,i)=>(
          <div key={i} style={cardKpiStyle(k.color)}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:10, color: C.muted, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:22, fontWeight:900, color: C.text, fontFamily:"monospace"}}>{k.value}</div>
              </div>
              <div style={{width:40, height:40, borderRadius:12, background: `${k.color}10`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18}}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BARRA FILTROS + AÇÕES ── */}
      <div style={{
        background:"#FFFFFF", border: `1px solid ${C.border}`,
        borderRadius:16, padding:"24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
      }}>
        <div style={{display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end"}}>
          
          <div style={{flex:"1 1 250px"}}>
            <label style={{fontSize:10, color: C.muted, fontWeight:800, textTransform:"uppercase", marginBottom:6, display:"block"}}>Pesquisar</label>
            <input
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13 }}
              placeholder="Fornecedor, NF, descrição..."
              value={financeiroBuscaPagar}
              onChange={e => setFinanceiroBuscaPagar(e.target.value)}
            />
          </div>
          <div>
            <label style={{fontSize:10, color: C.muted, fontWeight:800, textTransform:"uppercase", marginBottom:6, display:"block"}}>Início</label>
            <input type="date" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13 }} value={financeiroDataInicioPagar} onChange={e=>setFinanceiroDataInicioPagar(e.target.value)}/>
          </div>
          <div>
            <label style={{fontSize:10, color: C.muted, fontWeight:800, textTransform:"uppercase", marginBottom:6, display:"block"}}>Fim</label>
            <input type="date" style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13 }} value={financeiroDataFimPagar} onChange={e=>setFinanceiroDataFimPagar(e.target.value)}/>
          </div>
          <div>
            <label style={{fontSize:10, color: C.muted, fontWeight:800, textTransform:"uppercase", marginBottom:6, display:"block"}}>Status</label>
            <select style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13, width:140 }} value={filtroStatusPagar} onChange={e=>setFiltroStatusPagar(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="ABERTO">Em Aberto</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="PAGO">Pago</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>
          
          <button onClick={loadContasPagar} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: `0 4px 12px ${C.primary}33` }}>
            🔍 BUSCAR
          </button>

          <div style={{position:"relative"}}>
            <input type="file" id="ofxUploadPagar" accept=".ofx,.pdf" style={{display:"none"}} onChange={handleImportOFXPagar}/>
            <label htmlFor="ofxUploadPagar" style={{
              background: C.green, color:"#fff", border: "none",
              display:"inline-flex", alignItems:"center", gap:8,
              boxShadow:`0 4px 12px ${C.green}33`, cursor:"pointer",
              borderRadius:10, padding:"12px 20px", fontWeight:800, fontSize:12
            }}>
              {loading ? "⌛ LENDO..." : "📥 CONCILIAR OFX"}
            </label>
          </div>

          {hasEditPermission && (
            <button onClick={()=>setShowAddObrigacaoModal(true)} style={{
              background: C.blue, color: "#fff", border: "none",
              boxShadow:`0 4px 12px ${C.blue}33`, borderRadius:10, padding:"12px 20px", fontWeight:800, fontSize:12, cursor: "pointer"
            }}>
              ➕ NOVA OBRIGAÇÃO
            </button>
          )}
        </div>
      </div>

      {/* ── ALERTA VENCIDOS ── */}
      {vencidos.length > 0 && (
        <div style={{
          background: `${C.red}08`, border:`1px solid ${C.red}30`,
          borderRadius:12, padding:"14px 20px",
          display:"flex", alignItems:"center", gap:12,
        }}>
          <span style={{fontSize:20}}>🚨</span>
          <div>
            <span style={{color: C.red, fontWeight:800, fontSize:13}}>
              {vencidos.length} parcela(s) vencida(s) totalizando R$ {formatBRL(totalVencido)}
            </span>
            <span style={{color: C.subtle, fontSize:12, marginLeft:8, fontWeight: 600}}>— ação imediata recomendada</span>
          </div>
        </div>
      )}

      {/* ── TABELA ── */}
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{padding:"18px 24px", borderBottom: `1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background: C.bgAlt}}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0 }}>Contas a Pagar & Provisões</h2>
          <span style={{fontSize:11, color: C.muted, fontWeight: 700}}>{filtrados.length} registro(s)</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgAlt }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Vencimento</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Fatura / Título</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Descrição</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Fornecedor</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>NF</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Parc.</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Valor</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Status</th>
                {hasEditPermission && <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((c, idx) => {
                const atrasado = c.vencimento && !["PAGO","CONCILIADO"].includes(c.status) && new Date(c.vencimento+"T12:00:00Z") < hoje;
                return (
                  <tr key={idx} style={{ 
                    borderBottom: `1px solid ${C.border}`,
                    background: atrasado ? `${C.red}05` : "transparent",
                    transition: "background 0.2s"
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = atrasado ? `${C.red}08` : C.bgAlt}
                    onMouseLeave={e => e.currentTarget.style.background = atrasado ? `${C.red}05` : "transparent"}
                  >
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>
                      <strong style={{color: atrasado ? C.red : C.text, fontWeight: 800}}>
                        {c.vencimento ? new Date(c.vencimento+"T12:00:00Z").toLocaleDateString("pt-BR") : "-"}
                      </strong>
                      {atrasado && <span style={{display:"block",fontSize:9,color: C.red, fontWeight:900, marginTop: 2}}>VENCIDO</span>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>
                      <span style={{color: C.blue, fontSize:11, fontWeight:800, display:"block"}}>{c.fatura||"FAT-000"}</span>
                      <span style={{color: C.muted, fontSize:10, fontWeight: 600}}>{c.titulo||"TIT-000"}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, maxWidth:180 }}>
                      <div style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:700, color: C.text}}>{c.descricao}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: C.subtle, fontWeight: 600 }}>{c.fornecedor||"-"}</td>
                    <td style={{ padding: "14px 16px", fontSize: 11, color: C.muted, fontWeight: 600 }}>{c.numero_nf||"S/N"}</td>
                    <td style={{ padding: "14px 16px", textAlign:"center" }}>
                      <span style={{background: C.bgAlt, border: `1px solid ${C.border}`, padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:800, color: C.subtle}}>
                        {c.parcela_atual}/{c.qtd_parcelas}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>
                      <span style={{color: C.red, fontWeight:900, fontFamily:"monospace"}}>
                        R$ {formatBRL(c.valor)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        background: `${getStatusColor(atrasado?"ATRASADO":c.status)}15`,
                        color: getStatusColor(atrasado?"ATRASADO":c.status),
                        border:`1px solid ${getStatusColor(atrasado?"ATRASADO":c.status)}40`,
                        padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:800,
                        textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap",
                      }}>
                        {atrasado ? "ATRASADO" : c.status}
                      </span>
                    </td>
                    {hasEditPermission && (
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{display:"flex", gap:8, justifyContent:"center"}}>
                          <button
                            onClick={()=>{ setContaToEdit(c); setShowEditContaModal(true); }}
                            style={{background: "#F9FAFB", color: C.blue, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, transition:"all 0.2s"}}
                            onMouseEnter={e=>{ e.currentTarget.style.background = `${C.blue}10`; e.currentTarget.style.borderColor = C.blue; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = C.border; }}
                          >✏️</button>
                          <button
                            onClick={()=>handleExcluirParcela(c.id)}
                            style={{background: "#F9FAFB", color: C.red, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, transition:"all 0.2s"}}
                            onMouseEnter={e=>{ e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.borderColor = C.red; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = C.border; }}
                          >🗑️</button>
                          <button
                            onClick={()=>handleExcluirObrigacao(c.id_obrigacao, c.descricao)}
                            style={{background: `${C.red}10`, color: C.red, border:`1px solid ${C.red}30`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14, transition:"all 0.2s"}}
                            title="Excluir OBRIGAÇÃO INTEIRA"
                          >🚨</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr><td colSpan={hasEditPermission?9:8} style={{padding: 60, textAlign:"center", color: C.muted, fontSize: 14, fontWeight: 700}}>
                  Nenhuma conta a pagar encontrada.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}