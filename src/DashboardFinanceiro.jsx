import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";

// ============================================================
// DashboardFinanceiro.jsx — Dashboard Financeiro Avançado
// Chart.js, filtros período, DRE, projeção, fullscreen, drill-down
// ============================================================

const fmt = (v) => { if (!v && v !== 0) return "R$ 0,00"; return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v); };
const fmtN = (v) => Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = (d) => { if(!d||d==="None")return"—"; try{return new Date(d).toLocaleDateString("pt-BR");}catch{return d;} };

// Styles
const C = {
  card:{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"24px 28px"},
  kpiCard:(color,glow)=>({background:"rgba(15,23,42,0.8)",backdropFilter:"blur(16px)",border:`1px solid ${color}33`,borderRadius:20,padding:"26px 24px",boxShadow:`0 0 40px ${glow},0 12px 40px rgba(0,0,0,0.4)`,transition:"transform 0.25s"}),
  th:{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:"1px solid rgba(255,255,255,0.06)"},
  td:{padding:"10px 14px",fontSize:12,color:"#cbd5e1",borderBottom:"1px solid rgba(255,255,255,0.04)"},
  sectionTitle:{margin:0,fontSize:15,fontWeight:800,borderLeft:"4px solid #eab308",paddingLeft:12,color:"#f8fafc"},
  input:{background:"#1e293b",color:"#f8fafc",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none"},
  btn:(bg,color="#fff")=>({background:bg,color,border:"none",borderRadius:10,padding:"10px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}),
  smallBtn:{padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#94a3b8"},
  overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  fullModal:{background:"rgba(15,23,42,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,width:"95%",height:"90vh",overflowY:"auto",padding:30},
};

// ============================================================
// CHART.JS: Receitas vs Despesas (Barras)
// ============================================================
function FluxoChart({data,height=300,onBarClick}){
  const ref=useRef(null);const chart=useRef(null);
  useEffect(()=>{
    if(!ref.current||!data?.length)return;
    let dead=false;
    (async()=>{
      try{
        const mod=await import("chart.js");
        const Ch=mod.Chart||mod.default;
        const{BarController,BarElement,LineController,LineElement,PointElement,LinearScale,CategoryScale,Tooltip,Legend,Filler}=mod;
        Ch.register(BarController,BarElement,LineController,LineElement,PointElement,LinearScale,CategoryScale,Tooltip,Legend,Filler);
        if(dead)return;if(chart.current)chart.current.destroy();
        chart.current=new Ch(ref.current,{
          type:"bar",
          data:{
            labels:data.map(d=>d.label),
            datasets:[
              {label:"Receitas",data:data.map(d=>d.entradas),backgroundColor:"rgba(16,185,129,0.5)",borderColor:"#10b981",borderWidth:1,borderRadius:6,order:2},
              {label:"Despesas",data:data.map(d=>d.saidas),backgroundColor:"rgba(239,68,68,0.5)",borderColor:"#ef4444",borderWidth:1,borderRadius:6,order:2},
              {label:"Resultado",data:data.map(d=>d.saldo),type:"line",borderColor:"#eab308",borderWidth:2,pointBackgroundColor:data.map(d=>d.saldo>=0?"#10b981":"#ef4444"),pointRadius:5,pointHoverRadius:8,tension:0.3,fill:false,order:1},
            ]
          },
          options:{
            responsive:true,maintainAspectRatio:false,
            onClick:(e,els)=>{if(els.length>0&&onBarClick){const i=els[0].index;onBarClick(data[i]);}},
            plugins:{
              legend:{labels:{color:"#94a3b8",font:{size:11},boxWidth:14,padding:16}},
              tooltip:{backgroundColor:"rgba(15,23,42,0.95)",titleColor:"#f1f5f9",bodyColor:"#94a3b8",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,cornerRadius:10,padding:12,
                callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${fmt(ctx.raw)}`}}
            },
            scales:{
              x:{grid:{display:false},ticks:{color:"#64748b",font:{size:10}}},
              y:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#64748b",font:{size:10},callback:v=>"R$ "+(Math.abs(v)>=1000?(v/1000).toFixed(0)+"k":v)}}
            }
          }
        });
      }catch(e){console.warn("Chart.js error",e);}
    })();
    return()=>{dead=true;if(chart.current)chart.current.destroy();};
  },[data]);
  return<div style={{position:"relative",height}}><canvas ref={ref}/></div>;
}

// ============================================================
// CHART.JS: Projeção Fluxo de Caixa (Linha)
// ============================================================
function ProjecaoChart({historico,projecao,height=250}){
  const ref=useRef(null);const chart=useRef(null);
  useEffect(()=>{
    if(!ref.current)return;
    const hist=historico?.slice(-6)||[];const proj=projecao||[];
    if(!hist.length&&!proj.length)return;
    let dead=false;
    (async()=>{
      try{
        const mod=await import("chart.js");
        const Ch=mod.Chart||mod.default;
        const{LineController,LineElement,PointElement,LinearScale,CategoryScale,Tooltip,Legend,Filler}=mod;
        Ch.register(LineController,LineElement,PointElement,LinearScale,CategoryScale,Tooltip,Legend,Filler);
        if(dead)return;if(chart.current)chart.current.destroy();
        const labels=[...hist.map(h=>h.label),...proj.map(p=>`${p.label} ⟶`)];
        const saldoHist=hist.map(h=>h.saldo);
        const saldoProj=proj.map(p=>p.saldo_previsto);
        const realData=[...saldoHist,...Array(proj.length).fill(null)];
        const projData=[...Array(hist.length>0?hist.length-1:0).fill(null),saldoHist.length>0?saldoHist[saldoHist.length-1]:0,...saldoProj];
        chart.current=new Ch(ref.current,{
          type:"line",
          data:{labels,datasets:[
            {label:"Realizado",data:realData,borderColor:"#3b82f6",backgroundColor:"rgba(59,130,246,0.08)",borderWidth:3,pointRadius:5,pointBackgroundColor:"#3b82f6",tension:0.3,fill:true},
            {label:"Projetado",data:projData,borderColor:"#eab308",backgroundColor:"rgba(234,179,8,0.06)",borderWidth:2,borderDash:[8,4],pointRadius:5,pointBackgroundColor:"#eab308",tension:0.3,fill:true},
          ]},
          options:{
            responsive:true,maintainAspectRatio:false,
            plugins:{legend:{labels:{color:"#94a3b8",font:{size:11},boxWidth:14,padding:16}},
              tooltip:{backgroundColor:"rgba(15,23,42,0.95)",titleColor:"#f1f5f9",bodyColor:"#94a3b8",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,cornerRadius:10,padding:12,
                callbacks:{label:ctx=>`${ctx.dataset.label}: ${fmt(ctx.raw)}`}}},
            scales:{x:{grid:{display:false},ticks:{color:"#64748b",font:{size:10}}},
              y:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#64748b",font:{size:10},callback:v=>"R$ "+(Math.abs(v)>=1000?(v/1000).toFixed(0)+"k":v)}}}
          }
        });
      }catch(e){console.warn(e);}
    })();
    return()=>{dead=true;if(chart.current)chart.current.destroy();};
  },[historico,projecao]);
  return<div style={{position:"relative",height}}><canvas ref={ref}/></div>;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function DashboardFinanceiro({styles,currentUser,showToast,setActiveTab}){
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);
  const [drillDown,setDrillDown]=useState(null);const [drillLoading,setDrillLoading]=useState(false);
  const [fullscreen,setFullscreen]=useState(null); // "fluxo"|"dre"|"contas"|"projecao"|null

  // Filtros
  const hoje=new Date();const anoAtual=hoje.getFullYear();const mesAtual=hoje.getMonth();
  const [dtIni,setDtIni]=useState(`${anoAtual}-${String(mesAtual+1).padStart(2,"0")}-01`);
  const [dtFim,setDtFim]=useState(hoje.toISOString().split("T")[0]);
  const [presetPeriodo,setPresetPeriodo]=useState("mes_atual");

  const applyPreset=(preset)=>{
    setPresetPeriodo(preset);
    const h=new Date();const y=h.getFullYear();const m=h.getMonth();
    if(preset==="mes_atual"){setDtIni(`${y}-${String(m+1).padStart(2,"0")}-01`);setDtFim(h.toISOString().split("T")[0]);}
    else if(preset==="mes_anterior"){const pm=m===0?11:m-1;const py=m===0?y-1:y;const ud=new Date(py,pm+1,0).getDate();setDtIni(`${py}-${String(pm+1).padStart(2,"0")}-01`);setDtFim(`${py}-${String(pm+1).padStart(2,"0")}-${ud}`);}
    else if(preset==="trimestre"){const mi=m-2>0?m-2:0;setDtIni(`${y}-${String(mi+1).padStart(2,"0")}-01`);setDtFim(h.toISOString().split("T")[0]);}
    else if(preset==="semestre"){const mi=m-5>0?m-5:0;setDtIni(`${y}-${String(mi+1).padStart(2,"0")}-01`);setDtFim(h.toISOString().split("T")[0]);}
    else if(preset==="ano_atual"){setDtIni(`${y}-01-01`);setDtFim(h.toISOString().split("T")[0]);}
    else if(preset==="ano_anterior"){setDtIni(`${y-1}-01-01`);setDtFim(`${y-1}-12-31`);}
  };

  const loadData=async()=>{
    try{setLoading(true);const r=await api.get(`/financeiro/dashboard-v2/consolidado?data_inicio=${dtIni}&data_fim=${dtFim}`);setData(r.data);}
    catch(e){console.error(e);showToast?.("Erro ao carregar dashboard","error");}
    finally{setLoading(false);}
  };

  const loadDrillDown=async(mesAno)=>{
    try{setDrillLoading(true);const r=await api.get(`/financeiro/dashboard-v2/drill-down/${mesAno}`);setDrillDown(r.data);}
    catch(e){console.error(e);showToast?.("Erro drill-down","error");}
    finally{setDrillLoading(false);}
  };

  useEffect(()=>{loadData();},[]);

  const handleBarClick=(item)=>{if(item?.mes_ano)loadDrillDown(item.mes_ano);};

  if(loading)return<div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>Carregando dashboard financeiro...</div>;
  if(!data)return<div style={{textAlign:"center",padding:60,color:"#f87171"}}>Erro ao carregar dados</div>;

  const{kpis,comparativo:comp,fluxo_mensal:fluxo,dre,contas_bancarias:contas,projecao,vencidas,recebiveis_vencidos:recVenc}=data;

  const ExpandBtn=({section})=>(<button onClick={()=>setFullscreen(section)} title="Expandir" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 8px",cursor:"pointer",color:"#94a3b8",fontSize:14,lineHeight:1}}>⛶</button>);

  const VarBadge=({val})=>{const pos=val>=0;return<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:pos?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",color:pos?"#34d399":"#f87171"}}>{pos?"▲":"▼"} {Math.abs(val)}%</span>;};

  // ============================================================
  // RENDER: KPIs
  // ============================================================
  const renderKPIs=()=>(
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18}}>
      {[
        {label:"Saldo em Conta",value:fmt(kpis.saldo_total),icon:"🏦",color:"#10b981",glow:"rgba(16,185,129,0.15)",var:null},
        {label:"Receitas do Período",value:fmt(kpis.entradas),icon:"📈",color:"#3b82f6",glow:"rgba(59,130,246,0.15)",var:comp?.var_entradas_pct},
        {label:"Despesas do Período",value:fmt(kpis.saidas),icon:"📉",color:"#ef4444",glow:"rgba(239,68,68,0.15)",var:comp?.var_saidas_pct},
        {label:"Resultado Líquido",value:fmt(kpis.resultado),icon:"💰",color:kpis.resultado>=0?"#10b981":"#ef4444",glow:kpis.resultado>=0?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",var:comp?.var_resultado_pct},
      ].map((k,i)=>(
        <div key={i} style={C.kpiCard(k.color,k.glow)} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:9,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:900,color:k.color,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{k.value}</div>
              {k.var!==null&&k.var!==undefined&&<div style={{marginTop:8}}><VarBadge val={k.var}/><span style={{fontSize:9,color:"#475569",marginLeft:6}}>vs período anterior</span></div>}
            </div>
            <div style={{width:46,height:46,borderRadius:14,background:`${k.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{k.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // ============================================================
  // RENDER: FILTROS
  // ============================================================
  const renderFiltros=()=>(
    <div style={{...C.card,padding:"16px 24px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:12,color:"#94a3b8",fontWeight:700}}>📅 Período:</span>
      {[{k:"mes_atual",l:"Mês Atual"},{k:"mes_anterior",l:"Mês Anterior"},{k:"trimestre",l:"Trimestre"},{k:"semestre",l:"Semestre"},{k:"ano_atual",l:"Ano Atual"},{k:"ano_anterior",l:"Ano Anterior"}].map(p=>(
        <button key={p.k} onClick={()=>{applyPreset(p.k);}} style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"1px solid",
          background:presetPeriodo===p.k?"rgba(234,179,8,0.9)":"rgba(255,255,255,0.04)",color:presetPeriodo===p.k?"#000":"#94a3b8",borderColor:presetPeriodo===p.k?"#eab308":"rgba(255,255,255,0.08)"}}>{p.l}</button>
      ))}
      <div style={{height:20,width:1,background:"rgba(255,255,255,0.1)"}}/>
      <input type="date" value={dtIni} onChange={e=>{setDtIni(e.target.value);setPresetPeriodo("custom");}} style={C.input}/>
      <span style={{color:"#64748b",fontSize:12}}>a</span>
      <input type="date" value={dtFim} onChange={e=>{setDtFim(e.target.value);setPresetPeriodo("custom");}} style={C.input}/>
      <button onClick={loadData} style={C.btn("linear-gradient(135deg,#eab308,#d97706)","#000")}>🔍 Aplicar</button>
    </div>
  );

  // ============================================================
  // RENDER: FLUXO DE CAIXA (com drill-down)
  // ============================================================
  const renderFluxo=(fullMode=false)=>(
    <div style={{...C.card,...(fullMode?{border:"none",padding:0}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={C.sectionTitle}>Receitas vs Despesas — Fluxo de Caixa</h3>
        <div style={{display:"flex",gap:8}}>{!fullMode&&<ExpandBtn section="fluxo"/>}</div>
      </div>
      <FluxoChart data={fluxo} height={fullMode?450:300} onBarClick={handleBarClick}/>
      <p style={{fontSize:10,color:"#475569",textAlign:"center",marginTop:8}}>Clique em uma barra para ver transações detalhadas do mês</p>

      {/* DRILL-DOWN */}
      {drillDown&&(<div style={{marginTop:20,background:"rgba(234,179,8,0.04)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:16,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h4 style={{margin:0,color:"#eab308",fontSize:14,fontWeight:800}}>📋 Detalhes: {drillDown.label}</h4>
          <button onClick={()=>setDrillDown(null)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          {[{l:"Entradas",v:drillDown.total_entradas,c:"#10b981"},{l:"Saídas",v:drillDown.total_saidas,c:"#ef4444"},{l:"Resultado",v:drillDown.resultado,c:drillDown.resultado>=0?"#3b82f6":"#f97316"}
          ].map((x,i)=>(<div key={i} style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:18,fontWeight:800,color:x.c,marginTop:4}}>{fmt(x.v)}</div></div>))}
        </div>
        {/* Tabela de transações */}
        {drillDown.pagamentos?.length>0&&(<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#ef4444",marginBottom:8}}>Pagamentos ({drillDown.pagamentos.length})</div>
          <div style={{maxHeight:200,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
            {["Data","Fornecedor","Descrição","Categoria","Valor"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr></thead>
            <tbody>{drillDown.pagamentos.map((p,i)=>(<tr key={i}><td style={C.td}>{fmtDate(p.data)}</td><td style={C.td}>{p.fornecedor}</td><td style={{...C.td,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.descricao}</div></td><td style={{...C.td,fontSize:11,color:"#64748b"}}>{p.categoria}</td><td style={{...C.td,color:"#ef4444",fontWeight:700,fontFamily:"monospace"}}>{fmt(p.valor)}</td></tr>))}</tbody></table></div></div>)}
        {drillDown.recebimentos?.length>0&&(<div><div style={{fontSize:11,fontWeight:700,color:"#10b981",marginBottom:8}}>Recebimentos ({drillDown.recebimentos.length})</div>
          <div style={{maxHeight:200,overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
            {["Data","Cliente","Descrição","Valor"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr></thead>
            <tbody>{drillDown.recebimentos.map((r,i)=>(<tr key={i}><td style={C.td}>{fmtDate(r.data)}</td><td style={C.td}>{r.cliente}</td><td style={C.td}>{r.descricao}</td><td style={{...C.td,color:"#10b981",fontWeight:700,fontFamily:"monospace"}}>{fmt(r.valor)}</td></tr>))}</tbody></table></div></div>)}
      </div>)}
    </div>
  );

  // ============================================================
  // RENDER: DRE
  // ============================================================
  const renderDRE=(fullMode=false)=>(
    <div style={{...C.card,...(fullMode?{border:"none",padding:0}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={C.sectionTitle}>DRE Simplificado</h3>
        {!fullMode&&<ExpandBtn section="dre"/>}
      </div>
      {/* RESULTADO */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"14px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Receitas</div><div style={{fontSize:20,fontWeight:800,color:"#10b981",marginTop:4}}>{fmt(dre.total_receitas)}</div></div>
        <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"14px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Despesas</div><div style={{fontSize:20,fontWeight:800,color:"#ef4444",marginTop:4}}>{fmt(dre.total_despesas)}</div></div>
        <div style={{background:dre.resultado_operacional>=0?"rgba(59,130,246,0.06)":"rgba(249,115,22,0.06)",border:`1px solid ${dre.resultado_operacional>=0?"rgba(59,130,246,0.2)":"rgba(249,115,22,0.2)"}`,borderRadius:12,padding:"14px 18px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase"}}>Resultado ({dre.margem_pct}%)</div><div style={{fontSize:20,fontWeight:800,color:dre.resultado_operacional>=0?"#3b82f6":"#f97316",marginTop:4}}>{fmt(dre.resultado_operacional)}</div></div>
      </div>
      {/* DETALHAMENTO */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div><div style={{fontSize:12,fontWeight:700,color:"#10b981",marginBottom:10}}>📈 Receitas por Categoria</div>
          {dre.receitas?.length>0?dre.receitas.map((r,i)=>{const pct=dre.total_receitas>0?(r.valor/dre.total_receitas*100).toFixed(1):0;return(
            <div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
              <span style={{color:"#cbd5e1"}}>{r.categoria}</span><span style={{color:"#10b981",fontWeight:700,fontFamily:"monospace"}}>{fmt(r.valor)} <span style={{color:"#64748b",fontSize:9}}>({pct}%)</span></span></div>
              <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:"#10b981",borderRadius:2}}/></div></div>);})
          :<p style={{fontSize:11,color:"#475569"}}>Sem receitas no período</p>}
        </div>
        <div><div style={{fontSize:12,fontWeight:700,color:"#ef4444",marginBottom:10}}>📉 Despesas por Categoria</div>
          {dre.despesas?.length>0?dre.despesas.map((d,i)=>{const pct=dre.total_despesas>0?(d.valor/dre.total_despesas*100).toFixed(1):0;return(
            <div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
              <span style={{color:"#cbd5e1"}}>{d.categoria}</span><span style={{color:"#ef4444",fontWeight:700,fontFamily:"monospace"}}>{fmt(d.valor)} <span style={{color:"#64748b",fontSize:9}}>({pct}%)</span></span></div>
              <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:"#ef4444",borderRadius:2}}/></div></div>);})
          :<p style={{fontSize:11,color:"#475569"}}>Sem despesas no período</p>}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: CONTAS BANCÁRIAS
  // ============================================================
  const renderContas=(fullMode=false)=>(
    <div style={{...C.card,...(fullMode?{border:"none",padding:0}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={C.sectionTitle}>Saldo por Conta Bancária</h3>
        {!fullMode&&<ExpandBtn section="contas"/>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
        {contas?.map((c,i)=>(
          <div key={i} style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{c.nome}</div><div style={{fontSize:10,color:"#64748b"}}>{c.banco} • {c.tipo}</div></div>
              <div style={{fontSize:18,fontWeight:900,color:c.saldo_atual>=0?"#10b981":"#ef4444",fontFamily:"monospace"}}>{fmt(c.saldo_atual)}</div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div style={{flex:1}}><div style={{fontSize:9,color:"#64748b",textTransform:"uppercase"}}>Entradas (30d)</div><div style={{fontSize:12,fontWeight:700,color:"#10b981"}}>{fmt(c.entradas_mes)}</div></div>
              <div style={{flex:1}}><div style={{fontSize:9,color:"#64748b",textTransform:"uppercase"}}>Saídas (30d)</div><div style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>{fmt(c.saidas_mes)}</div></div>
            </div>
          </div>
        ))}
        {(!contas||contas.length===0)&&<p style={{color:"#475569",fontSize:12}}>Nenhuma conta bancária</p>}
      </div>
    </div>
  );

  // ============================================================
  // RENDER: PROJEÇÃO
  // ============================================================
  const renderProjecao=(fullMode=false)=>(
    <div style={{...C.card,...(fullMode?{border:"none",padding:0}:{})}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={C.sectionTitle}>Fluxo de Caixa Projetado</h3>
        {!fullMode&&<ExpandBtn section="projecao"/>}
      </div>
      <ProjecaoChart historico={fluxo} projecao={projecao} height={fullMode?400:250}/>
      {projecao?.length>0&&(<div style={{display:"grid",gridTemplateColumns:`repeat(${projecao.length},1fr)`,gap:12,marginTop:16}}>
        {projecao.map((p,i)=>(<div key={i} style={{background:"rgba(234,179,8,0.04)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:12,padding:"12px 16px",textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#eab308",marginBottom:8}}>{p.label}</div>
          <div style={{display:"flex",justifyContent:"space-around",fontSize:10}}>
            <div><div style={{color:"#64748b"}}>Receitas</div><div style={{color:"#10b981",fontWeight:700}}>{fmt(p.receitas_previstas)}</div></div>
            <div><div style={{color:"#64748b"}}>Despesas</div><div style={{color:"#ef4444",fontWeight:700}}>{fmt(p.despesas_previstas)}</div></div>
          </div>
          <div style={{marginTop:6,fontSize:14,fontWeight:800,color:p.saldo_previsto>=0?"#3b82f6":"#f97316"}}>{fmt(p.saldo_previsto)}</div>
        </div>))}
      </div>)}
    </div>
  );

  // ============================================================
  // RENDER: ALERTAS VENCIDOS
  // ============================================================
  const renderAlertas=()=>{
    if((!vencidas||vencidas.quantidade===0)&&(!recVenc||recVenc.quantidade===0))return null;
    return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {vencidas?.quantidade>0&&(<div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:28}}>🚨</span><div><div style={{fontSize:13,fontWeight:800,color:"#ef4444"}}>{vencidas.quantidade} parcela(s) vencida(s)</div><div style={{fontSize:12,color:"#94a3b8"}}>Total: <strong style={{color:"#ef4444"}}>{fmt(vencidas.total)}</strong></div></div>
        {setActiveTab&&<button onClick={()=>setActiveTab("financeiro_pagar")} style={{...C.smallBtn,marginLeft:"auto"}}>Ver →</button>}
      </div>)}
      {recVenc?.quantidade>0&&(<div style={{background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.25)",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:28}}>⚠️</span><div><div style={{fontSize:13,fontWeight:800,color:"#eab308"}}>{recVenc.quantidade} recebível(eis) vencido(s)</div><div style={{fontSize:12,color:"#94a3b8"}}>Total: <strong style={{color:"#eab308"}}>{fmt(recVenc.total)}</strong></div></div>
        {setActiveTab&&<button onClick={()=>setActiveTab("financeiro_receber")} style={{...C.smallBtn,marginLeft:"auto"}}>Ver →</button>}
      </div>)}
    </div>);
  };

  // ============================================================
  // FULLSCREEN MODAL
  // ============================================================
  const renderFullscreen=()=>{
    if(!fullscreen)return null;
    const titles={fluxo:"Receitas vs Despesas",dre:"DRE Simplificado",contas:"Contas Bancárias",projecao:"Fluxo Projetado"};
    const content={fluxo:renderFluxo(true),dre:renderDRE(true),contas:renderContas(true),projecao:renderProjecao(true)};
    return(<div style={C.overlay} onClick={()=>setFullscreen(null)}>
      <div style={C.fullModal} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{color:"#f1f5f9",margin:0,fontSize:20,fontWeight:800}}>{titles[fullscreen]}</h2>
          <button onClick={()=>setFullscreen(null)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        {content[fullscreen]}
      </div>
    </div>);
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {/* HEADER */}
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{width:5,height:36,borderRadius:3,background:"linear-gradient(to bottom,#eab308,#f97316)"}}/>
      <div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#f8fafc"}}>Dashboard Financeiro</h2>
        <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>Período: {fmtDate(dtIni)} a {fmtDate(dtFim)} ({data.periodo?.dias} dias)</p></div>
    </div>

    {renderFiltros()}
    {renderKPIs()}
    {renderAlertas()}

    {/* GRID: Fluxo + DRE */}
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20}}>
      {renderFluxo()}
      {renderDRE()}
    </div>

    {/* GRID: Projeção + Contas */}
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20}}>
      {renderProjecao()}
      {renderContas()}
    </div>

    {renderFullscreen()}
  </div>);
}