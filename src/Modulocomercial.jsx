import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { api } from "./api";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import {
  Users, TrendingUp, TrendingDown, Minus, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Search, ChevronLeft, ChevronRight,
  ChevronDown, Eye, Edit3, MessageCircle, Phone, Mail, MapPin,
  AlertTriangle, Bell, Clock, Package, Wrench, CheckCircle2,
  X, Calendar, Building2, FileText, Activity, ExternalLink, Download,
  LayoutDashboard, UserPlus, BellRing, ArrowLeft, Hash, Layers,
  UserCheck, UserX, Filter, MoreVertical, Trash2, Copy,
  RefreshCw, Zap, SlidersHorizontal, Maximize2, Minimize2,
  Satellite, Map as MapIcon, Truck, Box, Tag, Loader2
} from "lucide-react";

/* ═══════════════ DESIGN TOKENS ═══════════════ */
const T={primary:"#F26B25",primaryDark:"#D95A1E",primaryLight:"rgba(242,107,37,0.08)",primaryBorder:"rgba(242,107,37,0.20)",success:"#22A06B",danger:"#D93025",warning:"#E8A317",info:"#1A73E8",purple:"#8B5CF6",text:"#0f172a",sub:"#475569",muted:"#94a3b8",border:"#e2e8f0",borderL:"#f1f5f9",bg:"#f8fafc",card:"#fff",r:"12px",rS:"8px",rXs:"6px",sh:"0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06)",shM:"0 4px 12px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.08)",shL:"0 10px 40px rgba(0,0,0,0.10)"};
const fmt=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const fmtK=v=>(v||0)>=1000?`R$ ${((v||0)/1000).toFixed(0)}k`:fmt(v);
const pct=v=>`${(v||0).toFixed(1)}%`;

/* ═══════════════ CHART.JS WRAPPER ═══════════════ */
function ChartCanvas({type,data,options,height="100%"}){
  const canvasRef=useRef(null);const chartRef=useRef(null);
  useEffect(()=>{
    if(!canvasRef.current)return;if(chartRef.current)chartRef.current.destroy();
    const isPie = type === "pie" || type === "doughnut";
    chartRef.current=new Chart(canvasRef.current.getContext("2d"),{type,data,options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:isPie?"nearest":"index"},plugins:{legend:{display:true,position:"bottom",labels:{usePointStyle:true,pointStyle:"circle",padding:16,font:{size:11,weight:"600"}}},tooltip:{backgroundColor:"#fff",titleColor:"#0f172a",bodyColor:"#475569",borderColor:"#e2e8f0",borderWidth:1,cornerRadius:8,padding:12,titleFont:{size:12,weight:"700"},bodyFont:{size:11},boxPadding:4,usePointStyle:true,callbacks:options?._tooltipCallbacks||{}}},scales:isPie?{x:{display:false},y:{display:false}}:{x:{grid:{display:false},ticks:{font:{size:11},color:"#94a3b8"},border:{display:false}},y:{grid:{color:"#f1f5f9",drawBorder:false},ticks:{font:{size:11},color:"#94a3b8",...(options?._yTickOptions||{})},border:{display:false}}},...options}});
    return()=>{if(chartRef.current)chartRef.current.destroy();};
  },[type,JSON.stringify(data),JSON.stringify(options)]);
  return <canvas ref={canvasRef} style={{width:"100%",height}}/>;
}

/* ═══════════════ ATOMS ═══════════════ */
function KpiCard({icon: Ic, label, value, trend, tv, color = T.primary, sub: subtitle}) { const [h, sH] = useState(false); const tc = trend === "up" ? T.success : trend === "down" ? T.danger : T.muted; const TI = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus; const valStr = String(value); const fSize = valStr.length > 15 ? 13 : valStr.length > 12 ? 16 : valStr.length > 9 ? 18 : 22; return ( <div onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)} style={{ background: T.card, borderRadius: T.r, padding: "20px 22px", border: `1px solid ${h ? T.primaryBorder : T.border}`, boxShadow: h ? T.shM : T.sh, transition: "all .25s", position: "relative", overflow: "hidden", minWidth: 0 }} > <div style={{position: "absolute", top: 0, right: 0, width: 70, height: 70, background: `radial-gradient(circle at top right,${color}08,transparent 70%)`}} /> <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12}}> <div style={{width: 36, height: 36, borderRadius: T.rS, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center"}}> <Ic size={18} color={color} strokeWidth={1.8} /> </div> {tv && ( <div style={{display: "flex", alignItems: "center", gap: 3, background: `${tc}14`, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: tc}}> <TI size={11} />{tv} </div> )} </div> <div style={{fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}} title={label}> {label} </div> <div style={{fontSize: fSize, fontWeight: 800, color: T.text, letterSpacing: "-.02em", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}} title={valStr}> {value} </div> {subtitle && ( <div style={{fontSize: 11, color: T.muted, marginTop: 5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}} title={subtitle}> {subtitle} </div> )} </div> ); }function Badge({children,color=T.muted}){return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:`${color}14`,color,border:`1px solid ${color}25`,textTransform:"capitalize"}}>{children}</span>;}
function StatusB({s}){const m={ativo:T.success,inativo:T.warning,churn:T.danger,lead:T.info,Ativo:T.success,Inativo:T.warning};return <Badge color={m[s]||T.muted}>{s||"—"}</Badge>;}
function Spinner(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:T.muted,gap:8,fontSize:13}}><Loader2 size={20} style={{animation:"spin 1s linear infinite"}}/>Carregando...<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}

function Dropdown({trigger,items,align="left"}){const [open,setOpen]=useState(false);const ref=useRef(null);useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);return(<div ref={ref} style={{position:"relative",display:"inline-flex"}}><div onClick={()=>setOpen(!open)} style={{cursor:"pointer"}}>{trigger}</div>{open&&(<div style={{position:"absolute",top:"calc(100% + 6px)",[align]:0,zIndex:100,background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rS,boxShadow:T.shL,minWidth:200,padding:"6px 0",animation:"fadeIn .15s ease"}}>{items.map((item,i)=>{if(item.divider)return<div key={i} style={{height:1,background:T.border,margin:"4px 0"}}/>;return(<div key={i} onClick={()=>{item.onClick?.();setOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:item.active?700:500,color:item.active?T.primary:item.danger?T.danger:T.sub,background:item.active?T.primaryLight:"transparent"}} onMouseEnter={e=>!item.active&&(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>!item.active&&(e.currentTarget.style.background="transparent")}>{item.icon&&<item.icon size={14} strokeWidth={1.5}/>}<span style={{flex:1}}>{item.label}</span>{item.count!==undefined&&<span style={{fontSize:10,fontWeight:700,color:T.muted,background:T.bg,padding:"1px 6px",borderRadius:10}}>{item.count}</span>}{item.active&&<CheckCircle2 size={13} color={T.primary}/>}</div>);})}</div>)}</div>);}
function FilterDropdown({label,icon:Ic=Filter,items}){const ai=items.find(i=>i.active);return(<Dropdown trigger={<div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,fontSize:12,fontWeight:600,color:ai&&!items[0]?.active?T.primary:T.sub,cursor:"pointer",whiteSpace:"nowrap"}}><Ic size={14} strokeWidth={1.5}/>{label}{ai&&!items[0]?.active?`: ${ai.label}`:""}<ChevronDown size={12} color={T.muted}/></div>} items={items}/>);}
function ActionDropdown({items}){return(<Dropdown align="right" trigger={<div style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><MoreVertical size={14}/></div>} items={items}/>);}

function ExpandableChart({title,sub:subtitle,children,height=240}){const [exp,setExp]=useState(false);return(<><div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,padding:22,position:"relative"}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}><div><div style={{fontSize:14,fontWeight:700,color:T.text}}>{title}</div>{subtitle&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{subtitle}</div>}</div><button onClick={()=>setExp(true)} style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.muted}}><Maximize2 size={13}/></button></div><div style={{height}}>{children}</div></div>{exp&&(<div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:40}} onClick={()=>setExp(false)}><div onClick={e=>e.stopPropagation()} style={{background:T.card,borderRadius:"16px",width:"90vw",maxWidth:1100,maxHeight:"85vh",boxShadow:"0 25px 80px rgba(0,0,0,0.25)",overflow:"hidden",display:"flex",flexDirection:"column"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 28px",borderBottom:`1px solid ${T.border}`}}><div style={{fontSize:18,fontWeight:800,color:T.text}}>{title}</div><button onClick={()=>setExp(false)} style={{width:36,height:36,borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><Minimize2 size={16}/></button></div><div style={{padding:28,flex:1}}><div style={{height:"55vh"}}>{children}</div></div></div></div>)}</>);}

function GoogleMapEmbed({lat,lng,endereco,cidade,uf,nome}){const [mt,sMt]=useState("satellite");const eu=`https://maps.google.com/maps?q=${lat},${lng}&t=${mt==="satellite"?"k":"m"}&z=16&output=embed&hl=pt-BR`;return(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:T.sh}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:`1px solid ${T.border}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><MapPin size={15} color={T.primary}/><span style={{fontSize:13,fontWeight:700,color:T.text}}>Localização</span></div><div style={{display:"flex",gap:4}}><button onClick={()=>sMt("satellite")} style={{padding:"4px 10px",borderRadius:T.rXs,border:`1px solid ${mt==="satellite"?T.primary:T.border}`,background:mt==="satellite"?T.primaryLight:T.card,color:mt==="satellite"?T.primary:T.sub,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><Satellite size={11}/>Satélite</button><button onClick={()=>sMt("roadmap")} style={{padding:"4px 10px",borderRadius:T.rXs,border:`1px solid ${mt==="roadmap"?T.primary:T.border}`,background:mt==="roadmap"?T.primaryLight:T.card,color:mt==="roadmap"?T.primary:T.sub,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><MapIcon size={11}/>Mapa</button><a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,color:T.sub,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4,textDecoration:"none"}}><ExternalLink size={11}/>Google Maps</a></div></div><iframe src={eu} style={{width:"100%",height:300,border:"none"}} allowFullScreen loading="lazy" title={`Mapa - ${nome}`}/><div style={{padding:"10px 18px",background:T.bg,fontSize:11,color:T.muted}}>{endereco}, {cidade}/{uf}</div></div>);}

/* ═══════════════ DASHBOARD ═══════════════ */
function Dashboard({empresaId}){const [data,setData]=useState(null);const [loading,setLoading]=useState(true);useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.get(`/comercial-module/dashboard?empresa_id=${empresaId}`);setData(r.data);}catch(e){console.error("Dash comercial:",e);}finally{setLoading(false);}})();},[empresaId]);if(loading)return<Spinner/>;if(!data)return<div style={{textAlign:"center",padding:60,color:T.muted}}>Erro ao carregar dashboard</div>;const k=data.kpis||{};const at=data.ativos||{};const g=data.graficos||{};

  // Função para exibir % no tooltip de gráficos de pizza
  const pieCb = { label: c => { const v=c.raw||0; const t=c.dataset.data.reduce((a,b)=>a+b,0); const p=t>0?((v/t)*100).toFixed(1):0; return ` ${c.label}: ${v} un. (${p}%)`; }};

  return(<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:14,marginBottom:22}}><KpiCard icon={DollarSign} label="Receita Total" value={fmt(k.receita_total)} color={T.success}/><KpiCard icon={Target} label="Receita Potencial" value={fmt(k.receita_potencial)} sub="Ativos disponíveis" color={T.info}/><KpiCard icon={Activity} label="Churn Rate" value={pct(k.churn_rate)} color={T.danger}/><KpiCard icon={DollarSign} label="Ticket Médio" value={fmt(k.ticket_medio)} color={T.primary}/><KpiCard icon={UserCheck} label="Ativos" value={k.clientes_ativos||0} color={T.success}/><KpiCard icon={UserX} label="Inativos" value={k.clientes_inativos||0} color={T.warning}/><KpiCard icon={TrendingUp} label="Crescimento" value={pct(k.crescimento_base)} color={T.info}/></div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:22}}>{[{ic:Package,l:"Locados",q:at.locados?.qtd||0,v:at.locados?.valor||0,c:T.success},{ic:Layers,l:"Disponíveis",q:at.disponiveis?.qtd||0,v:at.disponiveis?.valor||0,c:T.info},{ic:Wrench,l:"Manutenção",q:at.manutencao?.qtd||0,v:at.manutencao?.valor||0,c:T.warning}].map((x,i)=>(<div key={i} style={{background:T.card,borderRadius:T.r,padding:"16px 20px",border:`1px solid ${T.border}`,boxShadow:T.sh,display:"flex",alignItems:"center",gap:14}}><div style={{width:40,height:40,borderRadius:T.rS,background:`${x.c}12`,display:"flex",alignItems:"center",justifyContent:"center"}}><x.ic size={20} color={x.c} strokeWidth={1.8}/></div><div><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:18,fontWeight:800,color:T.text}}>{x.q}</div><div style={{fontSize:11,color:T.sub,fontWeight:600}}>{fmt(x.v)}</div></div></div>))}<div style={{background:`linear-gradient(135deg,${T.primary}10,${T.primary}04)`,borderRadius:T.r,padding:"16px 20px",border:`1px solid ${T.primaryBorder}`,display:"flex",alignItems:"center",gap:14}}><div style={{width:40,height:40,borderRadius:T.rS,background:`${T.primary}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Target size={20} color={T.primary}/></div><div><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Ocupação</div><div style={{fontSize:22,fontWeight:800,color:T.primary}}>{pct(k.taxa_ocupacao)}</div></div></div></div>
  
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:18}}>
    <ExpandableChart title="Distribuição de Ativos" sub="Quantitativo e percentual">
      <ChartCanvas type="doughnut" data={{labels:["Locados","Disponíveis","Manutenção"],datasets:[{data:[at.locados?.qtd||0,at.disponiveis?.qtd||0,at.manutencao?.qtd||0],backgroundColor:[T.success+"cc",T.info+"cc",T.warning+"cc"],borderColor:T.card,borderWidth:2}]}} options={{_tooltipCallbacks:pieCb}}/>
    </ExpandableChart>

    <ExpandableChart title="Carteira de Clientes" sub="Ativos vs Inativos">
      <ChartCanvas type="doughnut" data={{labels:["Ativos","Inativos"],datasets:[{data:[k.clientes_ativos||0,k.clientes_inativos||0],backgroundColor:[T.success+"cc",T.warning+"cc"],borderColor:T.card,borderWidth:2}]}} options={{_tooltipCallbacks:pieCb}}/>
    </ExpandableChart>

    {(g.evolucao_churn||[]).length>0&&<ExpandableChart title="Evolução do Churn" sub="Últimos meses"><ChartCanvas type="line" data={{labels:g.evolucao_churn.map(d=>d.mes),datasets:[{label:"Churn %",data:g.evolucao_churn.map(d=>d.churn),borderColor:T.danger,backgroundColor:T.danger+"15",tension:.4,fill:true,pointRadius:4,pointBackgroundColor:T.card,pointBorderColor:T.danger,pointBorderWidth:2}]}} options={{_yTickOptions:{callback:v=>v+"%"}}}/></ExpandableChart>}
    {(g.evolucao_ticket||[]).length>0&&<ExpandableChart title="Ticket Médio"><ChartCanvas type="line" data={{labels:g.evolucao_ticket.map(d=>d.mes),datasets:[{label:"Ticket",data:g.evolucao_ticket.map(d=>d.ticket),borderColor:T.primary,backgroundColor:T.primary+"15",tension:.4,fill:true,pointRadius:4,pointBackgroundColor:T.card,pointBorderColor:T.primary,pointBorderWidth:2}]}} options={{_tooltipCallbacks:{label:c=>fmt(c.raw)},_yTickOptions:{callback:v=>fmtK(v)}}}/></ExpandableChart>}
    {(g.evolucao_clientes||[]).length>0&&<ExpandableChart title="Ativos vs Inativos"><ChartCanvas type="bar" data={{labels:g.evolucao_clientes.map(d=>d.mes),datasets:[{label:"Ativos",data:g.evolucao_clientes.map(d=>d.ativos),backgroundColor:T.success+"cc",borderRadius:4},{label:"Inativos",data:g.evolucao_clientes.map(d=>d.inativos),backgroundColor:T.warning+"cc",borderRadius:4}]}}/></ExpandableChart>}
    {(g.fluxo_clientes||[]).length>0&&<ExpandableChart title="Entrada vs Saída"><ChartCanvas type="line" data={{labels:g.fluxo_clientes.map(d=>d.mes),datasets:[{label:"Entradas",data:g.fluxo_clientes.map(d=>d.entradas),borderColor:T.success,backgroundColor:T.success+"15",tension:.4,fill:true},{label:"Saídas",data:g.fluxo_clientes.map(d=>d.saidas),borderColor:T.danger,backgroundColor:"transparent",tension:.4,borderDash:[5,5]}]}}/></ExpandableChart>}
  </div></div>);
}

/* ═══════════════ CLIENTES ═══════════════ */
function ClientesList({empresaId,onSelect}){const [clientes,setClientes]=useState([]);const [loading,setLoading]=useState(true);const [q,sQ]=useState("");const [sf,sSf]=useState("todos");const [pg,sPg]=useState(1);const [pag,sPag]=useState({total:0,total_pages:1});const pp=15;
  const load=async(page=1)=>{try{setLoading(true);let url=`/clientes-module/clientes?empresa_id=${empresaId}&page=${page}&per_page=${pp}`;if(q)url+=`&busca=${encodeURIComponent(q)}`;if(sf==="ativo")url+="&status=Ativo";else if(sf==="inativo")url+="&status=Inativo";const r=await api.get(url);setClientes(r.data.data||[]);sPag(r.data.pagination||{});}catch(e){console.error(e);}finally{setLoading(false);}};
  useEffect(()=>{load(1);},[q,sf,empresaId]);useEffect(()=>{load(pg);},[pg]);const tp=pag.total_pages||1;
  return(<div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:220,background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rS,padding:"0 12px",height:38}}><Search size={15} color={T.muted}/><input placeholder="Buscar nome, CNPJ ou cidade..." value={q} onChange={e=>{sQ(e.target.value);sPg(1);}} style={{border:"none",outline:"none",background:"transparent",fontSize:12,color:T.text,width:"100%"}}/></div>
    <FilterDropdown label="Status" icon={SlidersHorizontal} items={[{label:"Todos",active:sf==="todos",onClick:()=>{sSf("todos");sPg(1);}},{divider:true},{label:"Ativo",active:sf==="ativo",onClick:()=>{sSf("ativo");sPg(1);}},{label:"Inativo",active:sf==="inativo",onClick:()=>{sSf("inativo");sPg(1);}}]}/><span style={{fontSize:11,color:T.muted,fontWeight:600,marginLeft:"auto"}}>{pag.total||0} clientes</span></div>
  {loading?<Spinner/>:(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Cliente","Status","Email","Telefone","Cidade",""].map((l,i)=>(<th key={i} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,background:T.card}}>{l}</th>))}</tr></thead><tbody>{clientes.map(c=>(<tr key={c.id} onClick={()=>onSelect(c)} style={{cursor:"pointer",borderBottom:`1px solid ${T.borderL}`}} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><td style={{padding:"12px 14px"}}><div style={{fontWeight:700,color:T.text}}>{c.nome||c.nome_razao}</div><div style={{fontSize:10,color:T.muted}}>{c.documento||c.cpf_cnpj||""}</div></td><td style={{padding:"12px 14px"}}><StatusB s={c.status_comercial||c.status}/></td><td style={{padding:"12px 14px",color:T.sub,fontSize:11}}>{c.email||"—"}</td><td style={{padding:"12px 14px",color:T.sub,fontSize:11}}>{c.telefone||"—"}</td><td style={{padding:"12px 14px",color:T.sub,fontSize:11}}>{c.cidade||""}/{c.uf||""}</td><td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}><ActionDropdown items={[{label:"Ver Dossiê",icon:Eye,onClick:()=>onSelect(c)},{label:"WhatsApp",icon:MessageCircle,onClick:()=>c.telefone&&window.open(`https://wa.me/55${c.telefone.replace(/\D/g,"")}`)},{label:"Email",icon:Mail,onClick:()=>c.email&&window.open(`mailto:${c.email}`)}]}/></td></tr>))}</tbody></table></div>
    {tp>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderTop:`1px solid ${T.border}`}}><span style={{fontSize:11,color:T.muted}}>Pág {pg}/{tp}</span><div style={{display:"flex",gap:3}}><button onClick={()=>sPg(p=>Math.max(1,p-1))} disabled={pg===1} style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:pg===1?"not-allowed":"pointer",opacity:pg===1?.4:1,color:T.sub}}><ChevronLeft size={13}/></button>{Array.from({length:Math.min(5,tp)},(_,i)=>{const p=pg<=3?i+1:pg+i-2;if(p<1||p>tp)return null;return(<button key={p} onClick={()=>sPg(p)} style={{width:30,height:30,borderRadius:T.rXs,border:p===pg?"none":`1px solid ${T.border}`,background:p===pg?T.primary:T.card,color:p===pg?"#fff":T.sub,fontSize:11,fontWeight:700,cursor:"pointer"}}>{p}</button>);}).filter(Boolean)}<button onClick={()=>sPg(p=>Math.min(tp,p+1))} disabled={pg===tp} style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:pg===tp?"not-allowed":"pointer",opacity:pg===tp?.4:1,color:T.sub}}><ChevronRight size={13}/></button></div></div>)}</div>)}</div>);
}

/* ═══════════════ DOSSIÊ ═══════════════ */
function Dossie({clienteId,empresaId,onBack}){const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [tab,sTab]=useState("visao");
  useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.get(`/comercial-module/clientes/${clienteId}/dossie-comercial`);setData(r.data);}catch(e){console.error(e);}finally{setLoading(false);}})();},[clienteId]);
  if(loading)return<Spinner/>;if(!data)return<div style={{textAlign:"center",padding:60,color:T.muted}}>Erro ao carregar dossiê</div>;
  const c=data.cliente||{};const k=data.kpis||{};const rm=data.receita_mensal||[];const locs=data.locacoes||[];const ints=data.interacoes||[];const endereco=`${c.logradouro||""} ${c.numero||""}, ${c.bairro||""}`.trim();
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}><button onClick={onBack} style={{width:34,height:34,borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><ArrowLeft size={15}/></button><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:10}}><h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:0}}>{c.nome}</h2><StatusB s={c.status_comercial}/></div><div style={{fontSize:11,color:T.muted,marginTop:3}}>{c.documento||c.cpf_cnpj} • {endereco}, {c.cidade}/{c.uf}</div></div>
      <Dropdown trigger={<div style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:T.rS,background:T.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}><Zap size={13}/>Ações<ChevronDown size={12}/></div>} align="right" items={[{label:"WhatsApp",icon:MessageCircle,onClick:()=>c.telefone&&window.open(`https://wa.me/55${c.telefone.replace(/\D/g,"")}`)},{label:"Ligar",icon:Phone},{label:"Email",icon:Mail,onClick:()=>c.email&&window.open(`mailto:${c.email}`)},{divider:true},{label:"Editar",icon:Edit3},{label:"Nova Oportunidade",icon:Target}]}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:22}}><KpiCard icon={DollarSign} label="Receita Total" value={fmt(k.receita_total)} color={T.success}/><KpiCard icon={DollarSign} label="Ticket Médio" value={fmt(k.ticket_medio)} color={T.primary}/><KpiCard icon={FileText} label="Contratos" value={k.contratos_ativos||0} color={T.info}/><KpiCard icon={Activity} label="Tendência" value={(k.tendencia||"—")} color={k.tendencia==="crescente"?T.success:k.tendencia==="decrescente"?T.danger:T.warning}/></div>
    <div style={{display:"flex",gap:3,marginBottom:18,borderBottom:`1px solid ${T.border}`}}>{[{id:"visao",l:"Visão Geral"},{id:"locacoes",l:"Locações"},{id:"interacoes",l:"Interações"},{id:"localizacao",l:"Localização"},{id:"contato",l:"Contato"}].map(t=>(<button key={t.id} onClick={()=>sTab(t.id)} style={{padding:"9px 18px",border:"none",background:"transparent",color:tab===t.id?T.primary:T.muted,fontSize:12,fontWeight:tab===t.id?700:500,cursor:"pointer",borderBottom:`2px solid ${tab===t.id?T.primary:"transparent"}`,marginBottom:-1}}>{t.l}</button>))}</div>

    {tab==="visao"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:22,boxShadow:T.sh}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Dados Cadastrais</div>{[[Building2,"Razão Social",c.nome],[Hash,"CNPJ/CPF",c.documento||c.cpf_cnpj],[Phone,"Telefone",`${c.telefone||"—"}${c.is_whatsapp?" (WhatsApp)":""}`],[Mail,"Email",c.email||"—"],[MapPin,"Endereço",endereco],[MapPin,"Cidade",`${c.cidade||""}/${c.uf||""}`],[Calendar,"Cadastro",c.data_cadastro?new Date(c.data_cadastro).toLocaleDateString("pt-BR"):"—"],[Users,"Responsável",c.responsavel_comercial||"—"],[Tag,"Segmento",c.segmento||"—"]].map(([Ic,l,v],i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<8?`1px solid ${T.borderL}`:"none"}}><Ic size={14} color={T.muted} strokeWidth={1.5}/><span style={{fontSize:11,color:T.muted,minWidth:100,fontWeight:600}}>{l}</span><span style={{fontSize:12,color:T.text,fontWeight:500}}>{v}</span></div>))}</div>
      {rm.length>0?<ExpandableChart title="Receita Mensal"><ChartCanvas type="bar" data={{labels:rm.map(d=>d.mes),datasets:[{label:"Receita",data:rm.map(d=>d.receita),backgroundColor:T.primary+"cc",borderRadius:5}]}} options={{_tooltipCallbacks:{label:c=>fmt(c.raw)},_yTickOptions:{callback:v=>fmtK(v)}}}/></ExpandableChart>:<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:40,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted}}>Sem dados de receita</div>}
    </div>)}
    {tab==="locacoes"&&(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>{!locs.length&&<div style={{padding:40,textAlign:"center",color:T.muted}}>Nenhuma locação</div>}{locs.map((h,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 22px",borderBottom:i<locs.length-1?`1px solid ${T.borderL}`:"none"}}><div style={{width:9,height:9,borderRadius:"50%",background:h.status==="ATIVA"?T.success:T.muted,flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:T.text}}>{h.ativo_nome||"Ativo"}</div><div style={{fontSize:10,color:T.muted}}>{h.data_inicio?new Date(h.data_inicio).toLocaleDateString("pt-BR"):""} → {h.data_prevista_fim?new Date(h.data_prevista_fim).toLocaleDateString("pt-BR"):""} • {h.status}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{fmt(h.valor_contrato)}</div><div style={{fontSize:10,color:T.muted}}>{fmt(h.valor_diaria)}/dia</div></div></div>))}</div>)}
    {tab==="interacoes"&&(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>{!ints.length&&<div style={{padding:40,textAlign:"center",color:T.muted}}>Nenhuma interação</div>}{ints.map((h,i)=>{const tc={ligacao:T.info,whatsapp:"#25D366",email:T.primary,visita:T.success,proposta:T.warning,reuniao:T.purple,nota:T.muted};return(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 22px",borderBottom:i<ints.length-1?`1px solid ${T.borderL}`:"none"}}><div style={{width:9,height:9,borderRadius:"50%",background:tc[h.tipo]||T.muted,flexShrink:0,marginTop:5}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:T.text}}>{h.descricao}</div><div style={{fontSize:10,color:T.muted,marginTop:2}}>{h.data_interacao?new Date(h.data_interacao).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):""} • {h.tipo} via {h.canal} • {h.responsavel}</div></div></div>);})}</div>)}
    {tab==="localizacao"&&(c.latitude&&c.longitude?<GoogleMapEmbed lat={c.latitude} lng={c.longitude} endereco={endereco} cidade={c.cidade||""} uf={c.uf||""} nome={c.nome}/>:<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:40,textAlign:"center",color:T.muted}}>Sem coordenadas cadastradas</div>)}
    {tab==="contato"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>{[[Phone,"Telefone",c.telefone||"—",c.telefone?`tel:${c.telefone.replace(/\D/g,"")}`:"","Ligar",null],[MessageCircle,"WhatsApp",c.is_whatsapp?c.telefone:"N/A",c.is_whatsapp&&c.telefone?`https://wa.me/55${c.telefone.replace(/\D/g,"")}`:"","Chat","#25D366"],[Mail,"Email",c.email||"—",c.email?`mailto:${c.email}`:"","Enviar",null]].map(([Ic,l,v,a,bl,co],i)=>(<div key={i} style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:22,boxShadow:T.sh,textAlign:"center"}}><div style={{width:44,height:44,borderRadius:T.rS,background:`${co||T.primary}12`,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><Ic size={20} color={co||T.primary}/></div><div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:3}}>{l}</div><div style={{fontSize:13,color:T.text,fontWeight:600,marginBottom:12}}>{v}</div>{a&&<a href={a} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 18px",borderRadius:T.rS,background:co||T.primary,color:"#fff",fontSize:11,fontWeight:700,textDecoration:"none"}}>{bl}<ExternalLink size={11}/></a>}</div>))}</div>)}
  </div>);
}

/* ═══════════════ ATIVOS ═══════════════ */
function AtivosTab({empresaId, showToast}){
  const [ativos,setAtivos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [dash,setDash]=useState({});
  const [statusF,setStatusF]=useState("todos");
  const [catF,setCatF]=useState("todos");
  const [q,sQ]=useState("");
  
  // States para os Modais
  const [ativoAcao, setAtivoAcao] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showProposta, setShowProposta] = useState(false);
  const [showLocacao, setShowLocacao] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  
  // State para carregar os clientes nos selects
  const [clientesOpt, setClientesOpt] = useState([]);
  
  // States dos formulários
  const [formProp, setFormProp] = useState({ cliente_id: "", dias: 30, valor_negociado: "" });
  const [formLoc, setFormLoc] = useState({ cliente_id: "", data_inicio: "", data_fim: "" });

  useEffect(()=>{(async()=>{try{setLoading(true);const[rA,rD]=await Promise.all([api.get(`/ativos-module/ativos?empresa_id=${empresaId}&per_page=500`),api.get(`/ativos-module/dashboard?empresa_id=${empresaId}`)]);setAtivos(rA.data?.data||rA.data||[]);setDash(rD.data||{});}catch(e){console.error(e);}finally{setLoading(false);}})();},[empresaId]);
  
  const cats=[...new Set(ativos.map(a=>a.categoria).filter(Boolean))];
  const fil=useMemo(()=>{let d=[...ativos];if(statusF!=="todos")d=d.filter(a=>a.status===statusF);if(catF!=="todos")d=d.filter(a=>a.categoria===catF);if(q)d=d.filter(a=>(a.nome||"").toLowerCase().includes(q.toLowerCase()));return d;},[ativos,statusF,catF,q]);
  const sc={LOCADO:T.success,DISPONIVEL:T.info,MANUTENCAO:T.warning,RESERVADO:T.purple,INATIVO:T.muted};
  const sl={LOCADO:"Locado",DISPONIVEL:"Disponível",MANUTENCAO:"Manutenção",RESERVADO:"Reservado",INATIVO:"Inativo"};
  const vg=dash.visao_geral||{};const fin=dash.financeiro||{};

  const fetchClientes = async () => {
    if (clientesOpt.length > 0) return;
    try {
      const r = await api.get(`/clientes-module/clientes?empresa_id=${empresaId}&per_page=500&status=Ativo`);
      setClientesOpt(r.data.data || []);
    } catch(e) { console.error("Erro clientes", e); }
  };

  // Funções que ABREM as janelas
  const handleDetalhes = (ativo) => {
    setAtivoAcao(ativo);
    setShowDetalhes(true);
  };

  const handleCriarProposta = async (ativo) => {
    setAtivoAcao(ativo);
    setFormProp({ cliente_id: "", dias: 30, valor_negociado: ativo.valor_locacao_dia });
    setShowProposta(true);
    await fetchClientes();
  };

  const handleLocacao = async (ativo) => {
    setAtivoAcao(ativo);
    setFormLoc({ cliente_id: "", data_inicio: new Date().toISOString().split("T")[0], data_fim: "" });
    setShowLocacao(true);
    await fetchClientes();
  };

  // Funções que EXECUTAM as ações
  const submitProposta = async () => {
    if(!formProp.cliente_id) return showToast?.("Selecione um cliente!", "error");
    try {
      setGerandoPdf(true);
      showToast?.("Gerando PDF, aguarde...", "info");
      
      const payload = {
        ativo_id: ativoAcao.id,
        cliente_id: parseInt(formProp.cliente_id),
        dias: parseInt(formProp.dias),
        valor_negociado: parseFloat(formProp.valor_negociado),
        empresa_id: empresaId
      };

      // Chama a rota e pede a resposta em formato de "arquivo" (blob)
      const res = await api.post('/comercial-module/proposta/pdf', payload, { responseType: 'blob' });
      
      // Mágica para forçar o navegador a fazer o download do arquivo
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Proposta_${ativoAcao.nome.replace(/\s/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      showToast?.(`PDF baixado com sucesso!`, "success");
      setShowProposta(false);
    } catch(e) { 
      console.error(e); 
      showToast?.("Erro ao gerar PDF. Verifique o backend.", "error"); 
    } finally {
      setGerandoPdf(false);
    }
  };

  const submitLocacao = async () => {
    if(!formLoc.cliente_id || !formLoc.data_inicio) return showToast?.("Preencha cliente e data de início!", "error");
    try {
      showToast?.(`Ativo locado com sucesso! (Integração em andamento)`, "success");
      setShowLocacao(false);
    } catch(e) { showToast?.("Erro ao registrar locação", "error"); }
  };

  if(loading)return<Spinner/>;
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14,marginBottom:22}}>
        <KpiCard icon={Package} label="Total" value={vg.total_ativos||ativos.length} sub={`Patrimônio: ${fmt(fin.valor_total_patrimonio)}`} color={T.primary}/>
        <KpiCard icon={Truck} label="Locados" value={vg.locados||0} sub={`Receita/dia: ${fmt(fin.receita_diaria_potencial)}`} color={T.success}/>
        <KpiCard icon={Box} label="Disponíveis" value={vg.disponiveis||0} sub={`Ocioso: ${fmt(fin.valor_ocioso)}`} color={T.info}/>
        <KpiCard icon={Wrench} label="Manutenção" value={vg.em_manutencao||0} color={T.warning}/>
      </div>
      
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:200,background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rS,padding:"0 12px",height:38}}><Search size={15} color={T.muted}/><input placeholder="Buscar ativo..." value={q} onChange={e=>sQ(e.target.value)} style={{border:"none",outline:"none",background:"transparent",fontSize:12,color:T.text,width:"100%"}}/></div>
        <FilterDropdown label="Status" icon={SlidersHorizontal} items={[{label:"Todos",active:statusF==="todos",onClick:()=>setStatusF("todos")},{divider:true},{label:"Disponível",active:statusF==="DISPONIVEL",onClick:()=>setStatusF("DISPONIVEL")},{label:"Locado",active:statusF==="LOCADO",onClick:()=>setStatusF("LOCADO")},{label:"Manutenção",active:statusF==="MANUTENCAO",onClick:()=>setStatusF("MANUTENCAO")}]}/>
        {cats.length>0&&<FilterDropdown label="Categoria" icon={Tag} items={[{label:"Todas",active:catF==="todos",onClick:()=>setCatF("todos")},{divider:true},...cats.map(c=>({label:c,active:catF===c,onClick:()=>setCatF(c)}))]}/>}<span style={{fontSize:11,color:T.muted,fontWeight:600,marginLeft:"auto"}}>{fil.length} ativos</span>
      </div>
      
      <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Ativo","Categoria","Status","Aquisição","Diária",""].map((l,i)=>(<th key={i} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,background:T.card}}>{l}</th>))}</tr></thead>
            <tbody>{fil.slice(0,50).map(a=>(<tr key={a.id} style={{borderBottom:`1px solid ${T.borderL}`}} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{padding:"12px 14px"}}><div style={{fontWeight:700,color:T.text}}>{a.nome}</div><div style={{fontSize:10,color:T.muted}}>#{a.id}{a.codigo_rastreio?` • ${a.codigo_rastreio}`:""}</div></td>
              <td style={{padding:"12px 14px"}}><Badge color={T.sub}>{a.categoria||"Geral"}</Badge></td>
              <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:sc[a.status]||T.muted}}/><span style={{fontWeight:600,color:sc[a.status]||T.muted}}>{sl[a.status]||a.status}</span></div></td>
              <td style={{padding:"12px 14px",fontWeight:600,color:T.text}}>{fmt(a.valor_aquisicao)}</td>
              <td style={{padding:"12px 14px",fontWeight:600,color:T.primary}}>{fmt(a.valor_locacao_dia)}</td>
              <td style={{padding:"12px 14px"}}>
                <ActionDropdown items={[
                  {label:"Detalhes", icon:Eye, onClick: () => handleDetalhes(a)},
                  {label:"Criar Proposta", icon:FileText, onClick: () => handleCriarProposta(a)},
                  {label: a.status === "LOCADO" ? "Já Locado" : "Locação Rápida", icon:Truck, onClick: () => a.status === "LOCADO" ? showToast("Este ativo já está locado!", "warning") : handleLocacao(a)}
                ]}/>
              </td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────── MODAL DE DETALHES ─────────────────── */}
      {showDetalhes && ativoAcao && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.card,borderRadius:T.r,width:"100%",maxWidth:500,boxShadow:T.shL,overflow:"hidden",animation:"fadeIn .2s ease-out"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Eye size={18} color={T.primary}/><div style={{fontSize:16,fontWeight:800,color:T.text}}>Ficha do Ativo</div></div>
              <button onClick={()=>setShowDetalhes(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted}}><X size={20}/></button>
            </div>
            <div style={{padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <h2 style={{fontSize:22,margin:0,fontWeight:800,color:T.text}}>{ativoAcao.nome}</h2>
                <Badge color={sc[ativoAcao.status]||T.muted}>{sl[ativoAcao.status]||ativoAcao.status}</Badge>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                <div style={{background:T.bg,padding:14,borderRadius:T.rS,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Categoria</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{ativoAcao.categoria||"Não informada"}</div>
                </div>
                <div style={{background:T.bg,padding:14,borderRadius:T.rS,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Cód. Rastreio</div>
                  <div style={{fontSize:14,fontWeight:600,color:T.text}}>{ativoAcao.codigo_rastreio||"—"}</div>
                </div>
                <div style={{background:T.bg,padding:14,borderRadius:T.rS,border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Valor Aquisição</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.text}}>{fmt(ativoAcao.valor_aquisicao)}</div>
                </div>
                <div style={{background:`${T.primary}10`,padding:14,borderRadius:T.rS,border:`1px solid ${T.primaryBorder}`}}>
                  <div style={{fontSize:11,color:T.primary,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Diária Sugerida</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.primary}}>{fmt(ativoAcao.valor_locacao_dia)}</div>
                </div>
              </div>
              <button onClick={()=>setShowDetalhes(false)} style={{width:"100%",padding:"12px",borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,color:T.text,fontWeight:700,cursor:"pointer"}}>Fechar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL PROPOSTA (Com Download de PDF) ─────────────────── */}
      {showProposta && ativoAcao && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.card,borderRadius:T.r,width:"100%",maxWidth:400,boxShadow:T.shL,overflow:"hidden",animation:"fadeIn .2s ease-out"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><FileText size={18} color={T.primary}/><div style={{fontSize:16,fontWeight:800,color:T.text}}>Gerar Proposta</div></div>
              <button onClick={()=>setShowProposta(false)} disabled={gerandoPdf} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted}}><X size={20}/></button>
            </div>
            <div style={{padding:24}}>
              <div style={{background:`${T.primary}12`,padding:"12px 16px",borderRadius:T.rS,marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                <Package size={24} color={T.primary}/>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{ativoAcao.nome}</div><div style={{fontSize:11,color:T.sub}}>Diária padrão: {fmt(ativoAcao.valor_locacao_dia)}</div></div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Selecione o Cliente</label>
                <select value={formProp.cliente_id} onChange={e=>setFormProp({...formProp, cliente_id: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}>
                  <option value="">Selecione...</option>
                  {clientesOpt.map(c => <option key={c.id} value={c.id}>{c.nome || c.nome_razao}</option>)}
                </select>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Dias Previstos</label>
                  <input type="number" value={formProp.dias} onChange={e=>setFormProp({...formProp, dias: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Valor/Dia Negociado (R$)</label>
                  <input type="number" value={formProp.valor_negociado} onChange={e=>setFormProp({...formProp, valor_negociado: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/>
                </div>
              </div>

              <div style={{background:T.bg,padding:"14px",borderRadius:T.rS,textAlign:"center",marginBottom:24,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Total Estimado</div>
                <div style={{fontSize:24,fontWeight:800,color:T.text}}>{fmt((formProp.dias || 0) * (formProp.valor_negociado || 0))}</div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setShowProposta(false)} disabled={gerandoPdf} style={{flex:1,padding:"12px",borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,color:T.sub,fontWeight:700,cursor:"pointer",opacity:gerandoPdf?0.5:1}}>Cancelar</button>
                <button onClick={submitProposta} disabled={gerandoPdf} style={{flex:1,padding:"12px",borderRadius:T.rS,border:"none",background:T.primary,color:"#fff",fontWeight:700,cursor:"pointer",boxShadow:`0 4px 12px ${T.primary}40`,opacity:gerandoPdf?0.5:1}}>
                  {gerandoPdf ? "Baixando..." : "Gerar PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── MODAL LOCAÇÃO RÁPIDA ─────────────────── */}
      {showLocacao && ativoAcao && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:T.card,borderRadius:T.r,width:"100%",maxWidth:400,boxShadow:T.shL,overflow:"hidden",animation:"fadeIn .2s ease-out"}}>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Truck size={18} color={T.success}/><div style={{fontSize:16,fontWeight:800,color:T.text}}>Locação Rápida</div></div>
              <button onClick={()=>setShowLocacao(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:T.muted}}><X size={20}/></button>
            </div>
            <div style={{padding:24}}>
              <div style={{background:`${T.success}12`,padding:"12px 16px",borderRadius:T.rS,marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
                <Package size={24} color={T.success}/>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>{ativoAcao.nome}</div><div style={{fontSize:11,color:T.sub}}>Pronto para uso imediato</div></div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Selecione o Cliente</label>
                <select value={formLoc.cliente_id} onChange={e=>setFormLoc({...formLoc, cliente_id: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}>
                  <option value="">Selecione...</option>
                  {clientesOpt.map(c => <option key={c.id} value={c.id}>{c.nome || c.nome_razao}</option>)}
                </select>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Data de Início</label>
                  <input type="date" value={formLoc.data_inicio} onChange={e=>setFormLoc({...formLoc, data_inicio: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:T.sub,marginBottom:6}}>Previsão Fim</label>
                  <input type="date" value={formLoc.data_fim} onChange={e=>setFormLoc({...formLoc, data_fim: e.target.value})} style={{width:"100%",padding:"10px 12px",borderRadius:T.rS,border:`1px solid ${T.border}`,fontSize:13,color:T.text,outline:"none"}}/>
                </div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setShowLocacao(false)} style={{flex:1,padding:"12px",borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,color:T.sub,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
                <button onClick={submitLocacao} style={{flex:1,padding:"12px",borderRadius:T.rS,border:"none",background:T.success,color:"#fff",fontWeight:700,cursor:"pointer",boxShadow:`0 4px 12px ${T.success}40`}}>Confirmar Locação</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ═══════════════ FUNIL CRM ═══════════════ */
function Funil({empresaId,showToast}){const [opps,setOpps]=useState([]);const [loading,setLoading]=useState(true);const [view,setView]=useState("funnel");const [drag,sDrag]=useState(null);const [over,sOver]=useState(null);
  const STAGES=[{id:"lead",l:"Lead",c:T.info},{id:"contato",l:"Contato",c:T.purple},{id:"proposta",l:"Proposta",c:T.warning},{id:"negociacao",l:"Negociação",c:T.primary},{id:"ganho",l:"Ganho",c:T.success},{id:"perdido",l:"Perdido",c:T.danger}];
  const load=async()=>{try{setLoading(true);const r=await api.get(`/comercial-module/oportunidades?empresa_id=${empresaId}&per_page=200`);setOpps(r.data.data||[]);}catch(e){console.error(e);}finally{setLoading(false);}};useEffect(()=>{load();},[empresaId]);
  const moveStage=async(id,etapa)=>{try{await api.put(`/comercial-module/oportunidades/${id}/mover`,{etapa});setOpps(p=>p.map(o=>o.id===id?{...o,etapa}:o));showToast?.(`Movida para "${etapa}"`,"success");}catch(e){console.error(e);showToast?.("Erro","error");}};
  const byS=useMemo(()=>{const m={};STAGES.forEach(s=>m[s.id]=[]);opps.forEach(o=>{if(m[o.etapa])m[o.etapa].push(o);});return m;},[opps]);
  const tot=opps.filter(o=>!["ganho","perdido"].includes(o.etapa)).reduce((s,o)=>s+(o.valor||0),0);const fS=STAGES.filter(s=>!["ganho","perdido"].includes(s.id));const mx=Math.max(...fS.map(s=>(byS[s.id]?.length||0)),1);
  if(loading)return<Spinner/>;
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18,background:T.card,borderRadius:T.r,padding:"14px 22px",border:`1px solid ${T.border}`,boxShadow:T.sh,flexWrap:"wrap"}}><div><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Pipeline</div><div style={{fontSize:22,fontWeight:800,color:T.text}}>{fmt(tot)}</div></div><div style={{height:36,width:1,background:T.border}}/><div><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Oportunidades</div><div style={{fontSize:22,fontWeight:800,color:T.text}}>{opps.filter(o=>!["ganho","perdido"].includes(o.etapa)).length}</div></div><div style={{height:36,width:1,background:T.border}}/><div><div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Conversão</div><div style={{fontSize:22,fontWeight:800,color:T.success}}>{opps.length>0?((byS.ganho?.length||0)/opps.length*100).toFixed(0):0}%</div></div><div style={{marginLeft:"auto"}}><Dropdown trigger={<div style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,fontSize:12,fontWeight:600,color:T.sub,cursor:"pointer"}}><Eye size={14}/>{view==="funnel"?"Funil":"Kanban"}<ChevronDown size={12}/></div>} align="right" items={[{label:"Funil",active:view==="funnel",onClick:()=>setView("funnel")},{label:"Kanban",active:view==="kanban",onClick:()=>setView("kanban")}]}/></div></div>
    {view==="funnel"&&(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,padding:"30px 40px"}}><div style={{maxWidth:700,margin:"0 auto"}}>{fS.map((st,idx)=>{const items=byS[st.id]||[];const cnt=items.length;const val=items.reduce((s,o)=>s+(o.valor||0),0);const w=40+(60*(1-idx/Math.max(fS.length-1,1)));return(<div key={st.id} style={{display:"flex",alignItems:"center",gap:20,marginBottom:4}}><div style={{flex:1,display:"flex",justifyContent:"center"}}><div style={{width:`${w}%`,height:58,background:`linear-gradient(135deg,${st.c}18,${st.c}08)`,border:`1.5px solid ${st.c}35`,borderRadius:idx===0?"12px 12px 4px 4px":idx===fS.length-1?"4px 4px 12px 12px":"4px",display:"flex",alignItems:"center",justifyContent:"center",gap:14,position:"relative",overflow:"hidden",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}><div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(cnt/mx)*100}%`,background:`${st.c}15`}}/><div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:12}}><div style={{width:30,height:30,borderRadius:"50%",background:`${st.c}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:st.c}}>{cnt}</div><div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{st.l}</div><div style={{fontSize:11,color:T.muted}}>{fmt(val)}</div></div></div></div></div>{idx<fS.length-1&&(<div style={{width:60,textAlign:"center"}}><div style={{fontSize:14,fontWeight:800,color:st.c}}>{cnt>0?`${Math.round(((byS[fS[idx+1].id]?.length||0)/cnt)*100)}%`:"—"}</div><div style={{fontSize:9,color:T.muted}}>conversão</div></div>)}</div>);})}
      <div style={{display:"flex",gap:16,marginTop:20,justifyContent:"center"}}>{[STAGES.find(s=>s.id==="ganho"),STAGES.find(s=>s.id==="perdido")].map((s,i)=>{const its=byS[s.id]||[];return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 24px",borderRadius:T.rS,background:`${s.c}08`,border:`1px solid ${s.c}20`}}><div style={{width:28,height:28,borderRadius:"50%",background:`${s.c}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:s.c}}>{its.length}</div><div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{s.l}</div><div style={{fontSize:11,color:T.muted}}>{fmt(its.reduce((sum,o)=>sum+(o.valor||0),0))}</div></div></div>);})}</div></div></div>)}
    {view==="kanban"&&(<div style={{display:"grid",gridTemplateColumns:`repeat(${STAGES.length},minmax(170px,1fr))`,gap:10,overflowX:"auto"}}>{STAGES.map(st=>(<div key={st.id} onDragOver={e=>{e.preventDefault();sOver(st.id);}} onDragLeave={()=>sOver(null)} onDrop={e=>{e.preventDefault();if(drag){moveStage(drag,st.id);}sDrag(null);sOver(null);}} style={{background:over===st.id?`${st.c}08`:T.bg,borderRadius:T.r,padding:10,border:`1px solid ${over===st.id?st.c:T.border}`,minHeight:360}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,paddingBottom:8,borderBottom:`2px solid ${st.c}`}}><div><div style={{fontSize:11,fontWeight:700,color:T.text}}>{st.l}</div><div style={{fontSize:10,color:T.muted}}>{byS[st.id]?.length||0} • {fmt((byS[st.id]||[]).reduce((s,o)=>s+(o.valor||0),0))}</div></div></div>{(byS[st.id]||[]).map(o=>(<div key={o.id} draggable onDragStart={()=>sDrag(o.id)} onDragEnd={()=>{sDrag(null);sOver(null);}} style={{background:T.card,borderRadius:T.rS,padding:12,marginBottom:7,border:`1px solid ${drag===o.id?T.primary:T.border}`,boxShadow:T.sh,cursor:"grab",opacity:drag===o.id?.6:1}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:4}}>{o.cliente_nome||o.titulo}</div><div style={{fontSize:14,fontWeight:800,color:st.c,marginBottom:6}}>{fmt(o.valor)}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:10,color:T.muted}}><span>{o.responsavel}</span><span><Clock size={9}/> {o.dias_aberto||0}d</span></div></div>))}{!(byS[st.id]||[]).length&&<div style={{textAlign:"center",padding:28,color:T.muted,fontSize:11,fontStyle:"italic"}}>Arraste aqui</div>}</div>))}</div>)}
  </div>);
}

/* ═══════════════ ALERTAS ═══════════════ */
function Alertas({empresaId,showToast}){const [als,setAls]=useState([]);const [cont,setCont]=useState({});const [loading,setLoading]=useState(true);const [tipoF,setTipoF]=useState("todos");const [prioF,setPrioF]=useState("todos");
  const load=async()=>{try{setLoading(true);let url=`/comercial-module/alertas?empresa_id=${empresaId}`;if(tipoF!=="todos")url+=`&tipo=${tipoF}`;if(prioF!=="todos")url+=`&prioridade=${prioF}`;const r=await api.get(url);setAls(r.data.data||[]);setCont(r.data.contadores||{});}catch(e){console.error(e);}finally{setLoading(false);}};useEffect(()=>{load();},[empresaId,tipoF,prioF]);
  const dispensar=async id=>{try{await api.put(`/comercial-module/alertas/${id}/dispensar`);setAls(p=>p.filter(a=>a.id!==id));showToast?.("Dispensado","success");}catch(e){console.error(e);}};
  const gerar=async()=>{try{const r=await api.post(`/comercial-module/alertas/gerar?empresa_id=${empresaId}`);showToast?.(r.data.message||"Alertas gerados","success");load();}catch(e){console.error(e);showToast?.("Erro","error");}};
  const pc={alta:{c:T.danger,ic:AlertTriangle,l:"Alta"},critica:{c:T.danger,ic:AlertTriangle,l:"Crítica"},media:{c:T.warning,ic:Bell,l:"Média"},baixa:{c:T.info,ic:BellRing,l:"Baixa"}};const tc={churn:{c:T.danger,l:"Churn"},ticket_queda:{c:T.warning,l:"Ticket"},equipamento_parado:{c:T.info,l:"Equipamento"},contrato_vencendo:{c:T.primary,l:"Contrato"}};
  return(<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:18}}><KpiCard icon={AlertTriangle} label="Críticos" value={cont.criticos||0} color={T.danger}/><KpiCard icon={Bell} label="Atenção" value={cont.atencao||0} color={T.warning}/><KpiCard icon={BellRing} label="Info" value={cont.informativos||0} color={T.info}/><KpiCard icon={Layers} label="Total" value={cont.total||als.length} color={T.primary}/></div>
  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}><FilterDropdown label="Tipo" icon={SlidersHorizontal} items={[{label:"Todos",active:tipoF==="todos",onClick:()=>setTipoF("todos")},{divider:true},{label:"Churn",active:tipoF==="churn",onClick:()=>setTipoF("churn")},{label:"Equipamento",active:tipoF==="equipamento_parado",onClick:()=>setTipoF("equipamento_parado")},{label:"Contrato",active:tipoF==="contrato_vencendo",onClick:()=>setTipoF("contrato_vencendo")}]}/><FilterDropdown label="Prioridade" icon={AlertTriangle} items={[{label:"Todas",active:prioF==="todos",onClick:()=>setPrioF("todos")},{divider:true},{label:"Alta",active:prioF==="alta",onClick:()=>setPrioF("alta")},{label:"Média",active:prioF==="media",onClick:()=>setPrioF("media")},{label:"Baixa",active:prioF==="baixa",onClick:()=>setPrioF("baixa")}]}/><button onClick={gerar} style={{padding:"8px 14px",borderRadius:T.rS,border:"none",background:T.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginLeft:"auto"}}><RefreshCw size={12}/>Gerar Alertas</button></div>
  {loading?<Spinner/>:(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>{!als.length&&<div style={{textAlign:"center",padding:50}}><CheckCircle2 size={28} color={T.success} style={{marginBottom:10}}/><div style={{fontSize:15,fontWeight:700,color:T.text}}>Nenhum alerta</div></div>}{als.map((a,i)=>{const p=pc[a.prioridade]||pc.media;const t=tc[a.tipo]||{c:T.muted,l:a.tipo};return(<div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 22px",borderBottom:i<als.length-1?`1px solid ${T.borderL}`:"none",borderLeft:`4px solid ${p.c}`}}><div style={{width:36,height:36,borderRadius:T.rS,background:`${p.c}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><p.ic size={16} color={p.c}/></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:3}}>{a.titulo}</div><div style={{display:"flex",alignItems:"center",gap:8,fontSize:10}}><Badge color={t.c}>{t.l}</Badge><Badge color={p.c}>{p.l}</Badge><span style={{color:T.muted}}>{a.data_criacao?new Date(a.data_criacao).toLocaleDateString("pt-BR"):""}</span></div></div><ActionDropdown items={[{label:a.acao_sugerida||"Agir",icon:Zap},{divider:true},{label:"Dispensar",icon:X,danger:true,onClick:()=>dispensar(a.id)}]}/></div>);})}</div>)}</div>);
}

/* ═══════════════ MAIN ═══════════════ */
export default function ModuloComercial({styles:ps,currentUser,showToast,logAction,activeSubTab="dashboard"}){const [tab,sTab]=useState(activeSubTab);const [sel,sSel]=useState(null);const eid=currentUser?.empresa_id||1;
  useEffect(()=>{if(activeSubTab&&activeSubTab!=="dossie"){sTab(activeSubTab);sSel(null);}},[activeSubTab]);
  const goC=useCallback(c=>{sSel(c);sTab("dossie");},[]);const goB=useCallback(()=>{sSel(null);sTab("clientes");},[]);
  const tabs=[{id:"dashboard",l:"Dashboard",ic:LayoutDashboard},{id:"clientes",l:"Clientes",ic:Users},{id:"ativos",l:"Ativos",ic:Package},{id:"funil",l:"Funil CRM",ic:Target},{id:"alertas",l:"Alertas",ic:BellRing}];
  return(<div style={{fontFamily:"'DM Sans','Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}><div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}><div style={{width:36,height:36,borderRadius:T.rS,background:`linear-gradient(135deg,${T.primary},${T.primaryDark})`,display:"flex",alignItems:"center",justifyContent:"center"}}><LayoutDashboard size={18} color="#fff" strokeWidth={2}/></div><h1 style={{fontSize:24,fontWeight:800,color:T.text,margin:0}}>Módulo Comercial</h1></div><p style={{fontSize:12,color:T.muted,margin:"2px 0 0 46px"}}>Inteligência comercial • {currentUser?.empresa_nome||"Omni26"}</p></div>
      <div style={{display:"flex",gap:8}}><Dropdown trigger={<div style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",borderRadius:T.rS,background:T.card,color:T.sub,border:`1px solid ${T.border}`,fontSize:11,fontWeight:700,cursor:"pointer"}}><Download size={13}/>Exportar<ChevronDown size={11} color={T.muted}/></div>} align="right" items={[{label:"CSV",icon:FileText},{label:"PDF",icon:Download}]}/><button style={{display:"flex",alignItems:"center",gap:5,padding:"8px 16px",borderRadius:T.rS,background:T.primary,color:"#fff",border:"none",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 12px ${T.primary}33`}}><UserPlus size={13}/>Novo Cliente</button></div></div>
    {tab!=="dossie"&&(<div style={{display:"flex",alignItems:"center",gap:3,marginBottom:22,background:T.card,borderRadius:T.r,padding:5,border:`1px solid ${T.border}`,boxShadow:T.sh,overflowX:"auto"}}>{tabs.map(t=>{const a=tab===t.id;return(<button key={t.id} onClick={()=>sTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:T.rS,border:"none",background:a?T.primary:"transparent",color:a?"#fff":T.sub,fontSize:12,fontWeight:a?700:600,cursor:"pointer",whiteSpace:"nowrap"}}><t.ic size={15} strokeWidth={a?2:1.5}/>{t.l}</button>);})}</div>)}
    {tab==="dashboard"&&<Dashboard empresaId={eid}/>}
    {tab==="clientes"&&<ClientesList empresaId={eid} onSelect={goC} showToast={showToast}/>}
    {tab==="dossie"&&sel&&<Dossie clienteId={sel.id} empresaId={eid} onBack={goB}/>}
    {tab==="ativos"&&<AtivosTab empresaId={eid} showToast={showToast}/>}
    {tab==="funil"&&<Funil empresaId={eid} showToast={showToast}/>}
    {tab==="alertas"&&<Alertas empresaId={eid} showToast={showToast}/>}
  </div>);
}