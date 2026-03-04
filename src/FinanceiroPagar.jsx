import { useState } from "react";

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
  // 👇 AS 3 VARIÁVEIS QUE ESTAVAM FALTANDO FORAM ADICIONADAS AQUI:
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

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* ── KPI CARDS ── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16}}>
        {[
          { label:"Total Provisionado", value:`R$ ${formatBRL(totalPagar)}`, icon:"📋", color:"#ef4444", glow:"rgba(239,68,68,0.15)" },
          { label:"Vencidos", value:`R$ ${formatBRL(totalVencido)}`, icon:"⚠️", color: totalVencido>0?"#ef4444":"#10b981", glow: totalVencido>0?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.1)" },
          { label:"Vence em 7 dias", value:proximosSete.length, icon:"📅", color:"#f59e0b", glow:"rgba(245,158,11,0.15)" },
          { label:"Total de Registros", value:contasPagar.length, icon:"📄", color:"#3b82f6", glow:"rgba(59,130,246,0.15)" },
        ].map((k,i)=>(
          <div key={i} style={{
            background:"rgba(15,23,42,0.7)", backdropFilter:"blur(12px)",
            border:`1px solid ${k.glow.replace('0.15','0.3')}`,
            borderRadius:16, padding:"20px 22px",
            boxShadow:`0 0 24px ${k.glow}, 0 8px 24px rgba(0,0,0,0.3)`,
            transition:"transform 0.2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:9, color:"#64748b", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10}}>{k.label}</div>
                <div style={{fontSize:20, fontWeight:900, color:k.color, fontFamily:"monospace", letterSpacing:"-0.02em"}}>{k.value}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:12,background:`${k.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BARRA FILTROS + AÇÕES ── */}
      <div style={{
        background:"rgba(15,23,42,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 24px",
      }}>
        <div style={{display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end"}}>
          
          <div style={{flex:"1 1 220px"}}>
            <label style={styles.fieldLabel}>Pesquisar</label>
            <input
              style={{...styles.inputSmall, borderColor:"rgba(59,130,246,0.3)"}}
              placeholder="Fornecedor, NF, descrição..."
              value={financeiroBuscaPagar}
              onChange={e => setFinanceiroBuscaPagar(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.fieldLabel}>Início</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataInicioPagar} onChange={e=>setFinanceiroDataInicioPagar(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Fim</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataFimPagar} onChange={e=>setFinanceiroDataFimPagar(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Status</label>
            <select style={{...styles.inputSmall, width:140}} value={filtroStatusPagar} onChange={e=>setFiltroStatusPagar(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="ABERTO">Em Aberto</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="PAGO">Pago</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>
          
          <button onClick={loadContasPagar} style={{...styles.exportBtn, background:"#eab308", color:"#000", boxShadow:"0 4px 15px rgba(234,179,8,0.4)"}}>
            🔍 BUSCAR
          </button>

          {/* 👇 AQUI FOI CORRIGIDO PARA handleImportOFXPagar */}
          <div style={{position:"relative"}}>
            <input type="file" id="ofxUploadPagar" accept=".ofx,.pdf" style={{display:"none"}} onChange={handleImportOFXPagar}/>
            <label htmlFor="ofxUploadPagar" style={{
              ...styles.exportBtn, background:"#10b981",
              display:"inline-flex", alignItems:"center", gap:8,
              boxShadow:"0 4px 15px rgba(16,185,129,0.4)", cursor:"pointer",
              borderRadius:12, padding:"12px 20px", fontWeight:"bold", fontSize:12, color:"#fff"
            }}>
              {loading ? "⌛ LENDO..." : "📥 CONCILIAR OFX"}
            </label>
          </div>

          {hasEditPermission && (
            <button onClick={()=>setShowAddObrigacaoModal(true)} style={{
              ...styles.exportBtn, background:"#3b82f6",
              boxShadow:"0 4px 15px rgba(59,130,246,0.4)",
            }}>
              ➕ NOVA OBRIGAÇÃO
            </button>
          )}
        </div>
      </div>

      {/* ── ALERTA VENCIDOS ── */}
      {vencidos.length > 0 && (
        <div style={{
          background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:12, padding:"12px 20px",
          display:"flex", alignItems:"center", gap:12,
        }}>
          <span style={{fontSize:20}}>🚨</span>
          <div>
            <span style={{color:"#ef4444", fontWeight:800, fontSize:13}}>
              {vencidos.length} parcela(s) vencida(s) totalizando R$ {formatBRL(totalVencido)}
            </span>
            <span style={{color:"#94a3b8", fontSize:12, marginLeft:8}}>— ação imediata recomendada</span>
          </div>
        </div>
      )}

      {/* ── TABELA ── */}
      <div style={{...styles.cardFull, padding:0, overflow:"hidden"}}>
        <div style={{padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <h2 style={{...styles.cardTitle, margin:0}}>Contas a Pagar & Provisões</h2>
          <span style={{fontSize:11, color:"#64748b"}}>{filtrados.length} registro(s)</span>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead>
              <tr>
                <th style={styles.thMassa}>Vencimento</th>
                <th style={styles.thMassa}>Fatura / Título</th>
                <th style={styles.thMassa}>Descrição</th>
                <th style={styles.thMassa}>Fornecedor</th>
                <th style={styles.thMassa}>NF</th>
                <th style={styles.thMassa}>Parcela</th>
                <th style={styles.thMassa}>Valor (R$)</th>
                <th style={styles.thMassa}>Status</th>
                {hasEditPermission && <th style={{...styles.thMassa, textAlign:"center"}}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((c, idx) => {
                const atrasado = c.vencimento && !["PAGO","CONCILIADO"].includes(c.status) && new Date(c.vencimento+"T12:00:00Z") < hoje;
                return (
                  <tr key={idx} style={{
                    ...styles.trBody,
                    background: atrasado ? "rgba(239,68,68,0.06)" : "transparent",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = atrasado ? "rgba(239,68,68,0.06)" : "transparent"}
                  >
                    <td style={styles.tdMassa}>
                      <strong style={{color: atrasado?"#ef4444":"#f1f5f9"}}>
                        {c.vencimento ? new Date(c.vencimento+"T12:00:00Z").toLocaleDateString("pt-BR") : "-"}
                      </strong>
                      {atrasado && <span style={{display:"block",fontSize:9,color:"#ef4444",fontWeight:700}}>VENCIDO</span>}
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#60a5fa",fontSize:11,fontWeight:700,display:"block"}}>{c.fatura||"FAT-000"}</span>
                      <span style={{color:"#64748b",fontSize:10}}>{c.titulo||"TIT-000"}</span>
                    </td>
                    <td style={{...styles.tdMassa, maxWidth:180}}>
                      <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:12.5,fontWeight:500}}>{c.descricao}</div>
                    </td>
                    <td style={{...styles.tdMassa, color:"#94a3b8", fontSize:12}}>{c.fornecedor||"-"}</td>
                    <td style={{...styles.tdMassa, color:"#64748b", fontSize:11}}>{c.numero_nf||"S/N"}</td>
                    <td style={{...styles.tdMassa, textAlign:"center"}}>
                      <span style={{background:"rgba(255,255,255,0.08)",padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>
                        {c.parcela_atual}/{c.qtd_parcelas}
                      </span>
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#ef4444",fontWeight:900,fontFamily:"monospace",fontSize:13}}>
                        R$ {formatBRL(c.valor)}
                      </span>
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{
                        background: getStatusColor(atrasado?"ATRASADO":c.status)+"22",
                        color: getStatusColor(atrasado?"ATRASADO":c.status),
                        border:`1px solid ${getStatusColor(atrasado?"ATRASADO":c.status)}44`,
                        padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:800,
                        textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap",
                      }}>
                        {atrasado ? "ATRASADO" : c.status}
                      </span>
                    </td>
                    {hasEditPermission && (
                      <td style={{...styles.tdMassa, textAlign:"center"}}>
                        <div style={{display:"flex", gap:6, justifyContent:"center"}}>
                          <button
                            onClick={()=>{ setContaToEdit(c); setShowEditContaModal(true); }}
                            style={{background:"rgba(59,130,246,0.15)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Editar Provisão"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.3)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(59,130,246,0.15)"}
                          >✏️</button>
                          <button
                            onClick={()=>handleExcluirParcela(c.id)}
                            style={{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Excluir APENAS esta Parcela"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.28)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.12)"}
                          >🗑️</button>
                          <button
                            onClick={()=>handleExcluirObrigacao(c.id_obrigacao, c.descricao)}
                            style={{background:"rgba(127,29,29,0.2)",color:"#fca5a5",border:"1px solid rgba(127,29,29,0.4)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Excluir OBRIGAÇÃO INTEIRA e todas as parcelas"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(127,29,29,0.4)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(127,29,29,0.2)"}
                          >🚨</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr><td colSpan={hasEditPermission?9:8} style={{...styles.tdMassa,textAlign:"center",color:"#475569",padding:50,fontSize:13}}>
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