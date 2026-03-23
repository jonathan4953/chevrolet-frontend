import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { api } from "./api";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import {
  Users, TrendingUp, TrendingDown, Minus, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Search, ChevronDown, Eye,
  AlertTriangle, Bell, Clock, Package, Wrench, CheckCircle2,
  X, Building2, FileText, Activity, ExternalLink, Download,
  LayoutDashboard, BellRing, ArrowLeft, Layers, UserCheck, UserX,
  Filter, MoreVertical, RefreshCw, Zap, SlidersHorizontal,
  Maximize2, Minimize2, Satellite, Map as MapIcon, Truck, Box,
  Trophy, Crown, Medal, Star, Loader2, MapPin, BarChart3,
  ChevronRight, ChevronLeft, Globe, UserCog, Briefcase, Hash, Calendar, Phone, Mail, Settings
} from "lucide-react";

const T={primary:"#F26B25",primaryDark:"#D95A1E",primaryLight:"rgba(242,107,37,0.08)",primaryBorder:"rgba(242,107,37,0.20)",success:"#22A06B",danger:"#D93025",warning:"#E8A317",info:"#1A73E8",purple:"#8B5CF6",text:"#0f172a",sub:"#475569",muted:"#94a3b8",border:"#e2e8f0",borderL:"#f1f5f9",bg:"#f8fafc",card:"#fff",r:"12px",rS:"8px",rXs:"6px",sh:"0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06)",shM:"0 4px 12px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.08)",shL:"0 10px 40px rgba(0,0,0,0.10)"};

const fmt = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtSmart = v => fmt(v);
const fmtK = v => fmt(v);
const pct = v => `${(v || 0).toFixed(1)}%`;

/* ═══════ CHART.JS ═══════ */
function ChartCanvas({type,data,options,height="100%"}){const cr=useRef(null);const ch=useRef(null);useEffect(()=>{if(!cr.current)return;if(ch.current)ch.current.destroy();ch.current=new Chart(cr.current.getContext("2d"),{type,data,options:{responsive:true,maintainAspectRatio:false,interaction:{intersect:false,mode:"index"},plugins:{legend:{display:true,position:"bottom",labels:{usePointStyle:true,pointStyle:"circle",padding:16,font:{size:11,weight:"600"}}},tooltip:{backgroundColor:"#fff",titleColor:"#0f172a",bodyColor:"#475569",borderColor:"#e2e8f0",borderWidth:1,cornerRadius:8,padding:12,boxPadding:4,usePointStyle:true,callbacks:options?._tc||{}}},scales:{x:{grid:{display:false},ticks:{font:{size:11},color:"#94a3b8"},border:{display:false}},y:{grid:{color:"#f1f5f9"},ticks:{font:{size:11},color:"#94a3b8",...(options?._yt||{})},border:{display:false}}},...options}});return()=>{if(ch.current)ch.current.destroy();};},[type,JSON.stringify(data)]);return<canvas ref={cr} style={{width:"100%",height}}/>;}

/* ═══════════════════════════════════════════════════════════
   ℹ  INFO TOOLTIP — Hover popup com descrição
   Uso: <InfoTip text="Explicação do campo"/>
   ═══════════════════════════════════════════════════════════ */
function InfoTip({text,size=13}){
  const [show,setShow]=useState(false);
  const [pos,setPos]=useState({x:0,y:0});
  const onEnter=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    setPos({x:r.left+r.width/2, y:r.bottom+8});
    setShow(true);
  };
  return(<>
    <span
      onMouseEnter={onEnter}
      onMouseLeave={()=>setShow(false)}
      style={{
        display:"inline-flex",alignItems:"center",justifyContent:"center",
        width:size+2, height:size+2, borderRadius:"50%",
        background:`${T.muted}12`, color:T.muted,
        fontSize:size-3, fontWeight:800, cursor:"help",
        userSelect:"none", flexShrink:0, lineHeight:1,
        fontFamily:"'Georgia',serif", fontStyle:"italic",
        border:`1px solid ${T.muted}22`,
        transition:"all .15s",
      }}
      onMouseOver={e=>{e.currentTarget.style.background=`${T.primary}15`;e.currentTarget.style.color=T.primary;e.currentTarget.style.borderColor=`${T.primary}30`;}}
      onMouseOut={e=>{e.currentTarget.style.background=`${T.muted}12`;e.currentTarget.style.color=T.muted;e.currentTarget.style.borderColor=`${T.muted}22`;}}
    >ℹ</span>
    {show&&(<div style={{
      position:"fixed", left:pos.x, top:pos.y,
      transform:"translateX(-50%)", zIndex:10000,
      maxWidth:300, padding:"10px 14px",
      background:"#0f172a", color:"#f1f5f9",
      fontSize:11, fontWeight:500, lineHeight:1.55,
      borderRadius:8, boxShadow:"0 8px 30px rgba(0,0,0,0.3)",
      pointerEvents:"none", animation:"fadeIn .12s ease",
      whiteSpace:"normal", fontFamily:"'DM Sans',system-ui,sans-serif",
      fontStyle:"normal", letterSpacing:"0",
    }}>
      <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderBottom:"6px solid #0f172a"}}/>
      {text}
    </div>)}
  </>);
}

/* ═══════ Table header com tooltip ═══════ */
function TH({children,info,style={}}){
  return(<th style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:T.muted,textTransform:"uppercase",borderBottom:`2px solid ${T.border}`,background:T.card,whiteSpace:"nowrap",...style}}>
    <span style={{display:"inline-flex",alignItems:"center",gap:4}}>{children}{info&&<InfoTip text={info} size={11}/>}</span>
  </th>);
}

/* ═══════ Section header com tooltip ═══════ */
function SectionTitle({title,info,right}){
  return(<div style={{padding:"14px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:15,fontWeight:700,color:T.text}}>{title}{info&&<InfoTip text={info}/>}</span>
    {right}
  </div>);
}

/* ═══════ Card sub-header com tooltip ═══════ */
function CardTitle({title,info}){
  return(<div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14,display:"flex",alignItems:"center",gap:5}}>{title}{info&&<InfoTip text={info} size={12}/>}</div>);
}

/* ═══════ ATOMS ═══════ */
function KpiCard({icon:Ic,label,value,trend,tv,color=T.primary,sub:subtitle,info}){
  const [h,sH]=useState(false);
  const tc=trend==="up"?T.success:trend==="down"?T.danger:T.muted;
  const TI=trend==="up"?ArrowUpRight:trend==="down"?ArrowDownRight:Minus;
  const valStr = String(value || "");
  const fSize = valStr.length > 16 ? 13 : valStr.length > 13 ? 16 : valStr.length > 10 ? 18 : 22;

  return(
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{background:T.card,borderRadius:T.r,padding:"18px 20px",border:`1px solid ${h?T.primaryBorder:T.border}`,boxShadow:h?T.shM:T.sh,transition:"all .25s",position:"relative",overflow:"hidden",minWidth:0}}>
      <div style={{position:"absolute",top:0,right:0,width:70,height:70,background:`radial-gradient(circle at top right,${color}08,transparent 70%)`}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:34,height:34,borderRadius:T.rS,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic size={16} color={color} strokeWidth={1.8}/></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {info&&<InfoTip text={info} size={12}/>}
          {tv&&<div style={{display:"flex",alignItems:"center",gap:3,background:`${tc}14`,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:700,color:tc}}><TI size={11}/>{tv}</div>}
        </div>
      </div>
      <div style={{fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={label}>{label}</div>
      <div style={{fontSize:fSize,fontWeight:800,color:T.text,letterSpacing:"-.02em",lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={valStr}>{value}</div>
      {subtitle&&<div style={{fontSize:10,color:T.muted,marginTop:4,fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}} title={subtitle}>{subtitle}</div>}
    </div>
  );
}

function Badge({children,color=T.muted}){return<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:`${color}14`,color,border:`1px solid ${color}25`,textTransform:"capitalize"}}>{children}</span>;}
function Spinner(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:T.muted,gap:8,fontSize:13}}><Loader2 size={20} style={{animation:"spin 1s linear infinite"}}/>Carregando...<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}
function Dropdown({trigger,items,align="left"}){const [o,sO]=useState(false);const ref=useRef(null);useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))sO(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);return(<div ref={ref} style={{position:"relative",display:"inline-flex"}}><div onClick={()=>sO(!o)} style={{cursor:"pointer"}}>{trigger}</div>{o&&(<div style={{position:"absolute",top:"calc(100% + 6px)",[align]:0,zIndex:100,background:T.card,border:`1px solid ${T.border}`,borderRadius:T.rS,boxShadow:T.shL,minWidth:200,padding:"6px 0",animation:"fadeIn .15s ease"}}>{items.map((it,i)=>{if(it.divider)return<div key={i} style={{height:1,background:T.border,margin:"4px 0"}}/>;return(<div key={i} onClick={()=>{it.onClick?.();sO(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:it.active?700:500,color:it.active?T.primary:it.danger?T.danger:T.sub,background:it.active?T.primaryLight:"transparent"}} onMouseEnter={e=>!it.active&&(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>!it.active&&(e.currentTarget.style.background="transparent")}>{it.icon&&<it.icon size={14}/>}<span style={{flex:1}}>{it.label}</span>{it.active&&<CheckCircle2 size={13} color={T.primary}/>}</div>);})}</div>)}</div>);}
function ActionDropdown({items}){return(<Dropdown align="right" trigger={<div style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><MoreVertical size={14}/></div>} items={items}/>);}

/* ═══════ EXPANDABLE CHART with DRILL-DOWN ═══════ */
function ExpandableChart({title,sub:subtitle,children,drillDown,height=240}){
  const [exp,setExp]=useState(false);
  return(<><div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,padding:22}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
      <div><div style={{fontSize:14,fontWeight:700,color:T.text}}>{title}</div>{subtitle&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{subtitle}</div>}</div>
      <button onClick={()=>setExp(true)} style={{width:30,height:30,borderRadius:T.rXs,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.muted}} title="Expandir com detalhes"><Maximize2 size={13}/></button>
    </div><div style={{height}}>{children}</div></div>
  {exp&&(<div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:30}} onClick={()=>setExp(false)}>
    <div onClick={ev=>ev.stopPropagation()} style={{background:T.card,borderRadius:"16px",width:"95vw",maxWidth:1200,maxHeight:"90vh",boxShadow:"0 25px 80px rgba(0,0,0,0.25)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",padding:"18px 28px",borderBottom:`1px solid ${T.border}`}}>
        <div><div style={{fontSize:18,fontWeight:800,color:T.text}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:T.muted,marginTop:2}}>{subtitle}</div>}</div>
        <button onClick={()=>setExp(false)} style={{width:36,height:36,borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><Minimize2 size={16}/></button>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{flex:1,padding:24}}><div style={{height:"45vh"}}>{children}</div></div>
        {drillDown&&<div style={{width:420,borderLeft:`1px solid ${T.border}`,overflowY:"auto",padding:0}}>{drillDown}</div>}
      </div>
    </div>
  </div>)}</>);
}

/* ═══════ DRILL-DOWN PANEL ═══════ */
function DrillDownReceita({redeId}){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{setLoading(true);const url=redeId?`/franqueador-module/receita/detalhada?rede_id=${redeId}`:"/franqueador-module/receita/detalhada";const r=await api.get(url);setD(r.data);}catch(e){console.error(e);}finally{setLoading(false);}})();},[redeId]);
  if(loading)return<div style={{padding:20,color:T.muted,fontSize:12}}>Carregando detalhes...</div>;
  if(!d)return null;
  return(<div>
    <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:700,color:T.text}}>Composição da Receita<InfoTip text="Detalhamento da receita por franquia e por mês, com quantidade de locações. Abaixo, as maiores locações dos últimos 30 dias." size={12}/></div>
    {Object.entries(d.por_franquia||{}).map(([nome,meses])=>{
      const total=Object.values(meses).reduce((s,m)=>s+m.receita,0);
      return(<div key={nome} style={{padding:"12px 20px",borderBottom:`1px solid ${T.borderL}`}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:12,fontWeight:700,color:T.text}}>{nome}</span>
          <span style={{fontSize:12,fontWeight:800,color:T.primary}}>{fmtSmart(total)}</span>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {(d.meses||[]).map(m=>{const v=meses[m];return v?(<div key={m} style={{fontSize:10,color:T.muted}}>
            <span style={{fontWeight:600}}>{m.slice(5)}</span>: {fmtK(v.receita)} ({v.locacoes} loc.)
          </div>):null;})}
        </div>
      </div>);
    })}
    {(d.top_locacoes||[]).length>0&&(<>
      <div style={{padding:"16px 20px 8px",fontSize:12,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:5}}>Maiores Locações (30 dias)<InfoTip text="Top 10 locações com maior valor de contrato realizadas nos últimos 30 dias em toda a rede." size={11}/></div>
      {d.top_locacoes.slice(0,10).map((l,i)=>(<div key={i} style={{padding:"8px 20px",borderBottom:`1px solid ${T.borderL}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:11,fontWeight:600,color:T.text}}>{l.ativo}</div><div style={{fontSize:10,color:T.muted}}>{l.cliente} • {l.franquia}</div></div>
        <span style={{fontSize:12,fontWeight:700,color:T.success}}>{fmt(l.valor)}</span>
      </div>))}
    </>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function DashboardFranqueador({redeId,onSelectFranquia}){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{setLoading(true);const url=redeId?`/franqueador-module/dashboard?rede_id=${redeId}`:"/franqueador-module/dashboard";const r=await api.get(url);setD(r.data);}catch(e){console.error(e);}finally{setLoading(false);}})();},[redeId]);
  if(loading)return<Spinner/>;if(!d)return<div style={{textAlign:"center",padding:60,color:T.muted}}>Erro ao carregar</div>;
  const k=d.kpis||{};const fqs=d.franquias||[];const g=d.graficos||{};

  return(<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:12,marginBottom:20}}>
      <KpiCard icon={DollarSign} label="Receita da Rede" value={fmtSmart(k.receita_total)} color={T.success} info="Soma de todos os contratos de locação de todas as franquias da rede."/>
      <KpiCard icon={BarChart3} label="Receita Média/Unid." value={fmtSmart(k.receita_media_franquia)} color={T.info} info="Receita total da rede dividida pelo número de unidades ativas."/>
      <KpiCard icon={DollarSign} label="Ticket Médio" value={fmtSmart(k.ticket_medio)} color={T.primary} info="Receita total da rede dividida pela quantidade de clientes únicos que realizaram locação."/>
      <KpiCard icon={Building2} label="Unidades Ativas" value={k.total_unidades||0} color={T.info} info="Total de franquias com status ativo vinculadas à rede."/>
      <KpiCard icon={Users} label="Clientes da Rede" value={k.total_clientes||0} color={T.success} info="Quantidade de clientes únicos cadastrados em todas as franquias da rede."/>
      <KpiCard icon={TrendingUp} label="Crescimento" value={pct(k.crescimento)} color={k.crescimento>=0?T.success:T.danger} info="Variação percentual de novos clientes cadastrados em relação ao mês anterior."/>
      <KpiCard icon={UserX} label="Churn" value={pct(k.churn_rate)} color={T.danger} info="Percentual de clientes classificados como churn (sem locação recente) em relação ao total de clientes da rede."/>
      <KpiCard icon={AlertTriangle} label="Unid. em Risco" value={k.unidades_risco||0} color={T.danger} info="Franquias com receita nos últimos 30 dias inferior a 50% da média de receita da rede."/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12,marginBottom:20}}>
      {[
        {ic:Truck,l:"Ativos Locados",v:k.ativos_locados||0,val:k.val_locados,c:T.success,tip:"Equipamentos atualmente em locação ativa em toda a rede. O valor abaixo é o patrimônio total locado."},
        {ic:Box,l:"Disponíveis",v:k.ativos_disponiveis||0,val:k.val_disponiveis,c:T.info,tip:"Equipamentos prontos para locação, sem contrato ativo. Representa a receita potencial não explorada."},
        {ic:Wrench,l:"Manutenção",v:k.ativos_manutencao||0,c:T.warning,tip:"Equipamentos em manutenção preventiva ou corretiva, temporariamente indisponíveis para locação."}
      ].map((x,i)=>(
        <div key={i} style={{background:T.card,borderRadius:T.r,padding:"14px 18px",border:`1px solid ${T.border}`,boxShadow:T.sh,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:T.rS,background:`${x.c}12`,display:"flex",alignItems:"center",justifyContent:"center"}}><x.ic size={18} color={x.c}/></div>
          <div style={{minWidth:0, flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>{x.l}<InfoTip text={x.tip} size={10}/></div>
            <div style={{fontSize:17,fontWeight:800,color:T.text}}>{x.v}</div>
            {x.val!==undefined&&<div style={{fontSize:10,color:T.sub,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fmtSmart(x.val)}</div>}
          </div>
        </div>))}
      <div style={{background:`linear-gradient(135deg,${T.primary}10,${T.primary}04)`,borderRadius:T.r,padding:"14px 18px",border:`1px solid ${T.primaryBorder}`,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,borderRadius:T.rS,background:`${T.primary}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Target size={18} color={T.primary}/></div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted,fontWeight:700,textTransform:"uppercase"}}>Ocupação<InfoTip text="Taxa de ocupação da rede: ativos locados ÷ total de ativos operacionais (excluindo inativos). Meta ideal: acima de 70%." size={10}/></div>
          <div style={{fontSize:20,fontWeight:800,color:T.primary}}>{pct(k.taxa_ocupacao)}</div>
        </div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      {(g.receita_mensal||[]).length>0&&<ExpandableChart title="Receita da Rede" sub="Evolução mensal — clique ⛶ para detalhes" drillDown={<DrillDownReceita redeId={redeId}/>}>
        <ChartCanvas type="bar" data={{labels:g.receita_mensal.map(d=>d.mes),datasets:[{label:"Receita",data:g.receita_mensal.map(d=>d.receita),backgroundColor:T.primary+"cc",borderRadius:5}]}} options={{_tc:{label:c=>fmt(c.raw)},_yt:{callback:v=>fmtK(v)}}}/>
      </ExpandableChart>}
      {fqs.length>0&&<ExpandableChart title="Receita por Franquia" sub="Comparativo entre unidades" drillDown={<DrillDownReceita redeId={redeId}/>}>
        <ChartCanvas type="bar" data={{labels:fqs.map(f=>f.apelido||f.nome),datasets:[{label:"Receita",data:fqs.map(f=>f.receita),backgroundColor:fqs.map((_,i)=>[T.primary,T.success,T.info,T.warning,T.purple,T.danger][i%6]+"cc"),borderRadius:4}]}} options={{indexAxis:"y",_tc:{label:c=>fmt(c.raw)},plugins:{legend:{display:false}}}}/>
      </ExpandableChart>}
    </div>

    {/* Franchise table */}
    <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>
      <SectionTitle title="Franquias da Rede" info="Ranking de todas as unidades franqueadas, ordenadas por receita. Clique numa linha para abrir o Dossiê, ou use o menu ⋮ para Gestão." right={<span style={{fontSize:11,color:T.muted,fontWeight:600}}>{fqs.length} unidades</span>}/>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>
        <TH>#</TH>
        <TH info="Nome ou apelido da unidade franqueada e sua região de atuação.">Franquia</TH>
        <TH info="Soma de todos os contratos de locação realizados pela franquia.">Receita</TH>
        <TH info="Quantidade de clientes únicos ativos cadastrados na franquia.">Clientes</TH>
        <TH info="Receita total da franquia dividida pelo número de clientes.">Ticket</TH>
        <TH info="Percentual de equipamentos locados sobre o total operacional. Verde: >70%, Amarelo: 40-70%, Vermelho: <40%.">Ocupação</TH>
        <TH info="Score de performance de 0 a 100, calculado com base na receita relativa à média e na taxa de ocupação.">Score</TH>
        <TH></TH>
      </tr></thead>
      <tbody>{fqs.map((f,i)=>{
        const mc=i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":null;
        return(<tr key={f.empresa_id} onClick={()=>onSelectFranquia(f,"dossie")} style={{cursor:"pointer",borderBottom:`1px solid ${T.borderL}`}} onMouseEnter={e=>e.currentTarget.style.background=T.primaryLight} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <td style={{padding:"12px 14px",width:45}}>{mc?<div style={{width:24,height:24,borderRadius:"50%",background:`${mc}25`,border:`2px solid ${mc}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:mc}}>{i+1}</div>:<span style={{color:T.muted,fontWeight:600}}>{i+1}</span>}</td>
          <td style={{padding:"12px 14px"}}><div style={{fontWeight:700,color:T.text}}>{f.apelido||f.nome}</div><div style={{fontSize:10,color:T.muted}}>{f.regiao||""}</div></td>
          <td style={{padding:"12px 14px",fontWeight:700,color:T.text}}>{fmtSmart(f.receita)}</td>
          <td style={{padding:"12px 14px",fontWeight:600,color:T.sub}}>{f.total_clientes}</td>
          <td style={{padding:"12px 14px",fontWeight:600,color:T.sub}}>{fmtSmart(f.ticket_medio)}</td>
          <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:50,height:5,borderRadius:3,background:T.borderL,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:f.taxa_ocupacao>70?T.success:f.taxa_ocupacao>40?T.warning:T.danger,width:`${Math.min(f.taxa_ocupacao,100)}%`}}/></div><span style={{fontSize:10,fontWeight:600,color:f.taxa_ocupacao>70?T.success:f.taxa_ocupacao>40?T.warning:T.danger}}>{f.taxa_ocupacao}%</span></div></td>
          <td style={{padding:"12px 14px"}}><div style={{width:32,height:32,borderRadius:"50%",background:`${f.score>70?T.success:f.score>40?T.warning:T.danger}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:f.score>70?T.success:f.score>40?T.warning:T.danger}}>{f.score}</div></td>
          <td style={{padding:"12px 14px"}} onClick={e=>e.stopPropagation()}><ActionDropdown items={[{label:"Dossiê (Raio-X)",icon:Eye,onClick:()=>onSelectFranquia(f,"dossie")},{label:"Gestão da Franquia",icon:Settings,onClick:()=>onSelectFranquia(f,"gestao")},{divider:true},{label:"Abrir Mapa",icon:MapPin,onClick:()=>f.latitude&&window.open(`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`,"_blank")}]}/></td>
        </tr>);})}
      </tbody></table></div>
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════
   DOSSIÊ DO FRANQUEADO
   ═══════════════════════════════════════════════════════════ */
function DossieFranquia({empresaId,onBack}){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.get(`/franqueador-module/franquias/${empresaId}/dossie`);setD(r.data);}catch(e){console.error(e);}finally{setLoading(false);}})();},[empresaId]);
  if(loading)return<Spinner/>;if(!d)return<div style={{padding:60,textAlign:"center",color:T.muted}}>Erro</div>;
  const info=d.info||{};const k=d.kpis||{};const rm=d.receita_mensal||[];

  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
      <button onClick={onBack} style={{width:34,height:34,borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><ArrowLeft size={15}/></button>
      <div style={{flex:1}}><h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:0}}>Dossiê — {info.apelido||info.nome}</h2><div style={{fontSize:11,color:T.muted,marginTop:3}}>{info.nome} • {info.regiao||""} • {info.responsavel||""}</div></div>
      <Badge color={info.status==="Ativa"?T.success:T.warning}>{info.status||"—"}</Badge>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:20}}>
      <KpiCard icon={DollarSign} label="Receita Total" value={fmtSmart(k.receita_total)} color={T.success} info="Soma de todos os contratos de locação desta franquia."/>
      <KpiCard icon={DollarSign} label="Ticket Médio" value={fmtSmart(k.ticket_medio)} color={T.primary} info="Receita total desta franquia dividida pela quantidade de clientes que locaram."/>
      <KpiCard icon={Users} label="Clientes" value={k.total_clientes||0} color={T.info} info="Total de clientes cadastrados nesta franquia com status ativo."/>
      <KpiCard icon={FileText} label="Locações" value={k.total_locacoes||0} color={T.purple} info="Quantidade total de contratos de locação realizados."/>
      <KpiCard icon={Truck} label="Locados" value={k.ativos_locados||0} color={T.success} info="Equipamentos atualmente em locação ativa nesta franquia."/>
      <KpiCard icon={Box} label="Disponíveis" value={k.ativos_disponiveis||0} color={T.info} info="Equipamentos prontos para novas locações nesta unidade."/>
      <KpiCard icon={Target} label="Ocupação" value={pct(k.taxa_ocupacao)} color={T.primary} info="Ativos locados ÷ total operacional desta franquia."/>
      <KpiCard icon={UserX} label="Churn" value={k.clientes_churn||0} color={T.danger} info="Clientes desta franquia classificados como churn (sem locação recente)."/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:22,boxShadow:T.sh}}>
        <CardTitle title="Dados da Franquia" info="Informações cadastrais, contato e vínculo da franquia com a rede."/>
        {[[Building2,"Nome",info.nome],[Hash,"CNPJ",info.cnpj],[MapPin,"Região",info.regiao],[Users,"Responsável",info.responsavel],[FileText,"Plano",info.plano],[Calendar,"Adesão",info.data_adesao?new Date(info.data_adesao).toLocaleDateString("pt-BR"):"—"],[Phone,"Telefone",info.telefone||"—"],[Mail,"Email",info.email||"—"]].map(([Ic,l,v],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<7?`1px solid ${T.borderL}`:"none"}}>
            <Ic size={13} color={T.muted} strokeWidth={1.5}/><span style={{fontSize:10,color:T.muted,minWidth:80,fontWeight:600}}>{l}</span><span style={{fontSize:12,color:T.text,fontWeight:500}}>{v||"—"}</span>
          </div>
        ))}
      </div>
      {rm.length>0?<ExpandableChart title="Receita Mensal" drillDown={<DrillDownReceita redeId={null}/>}>
        <ChartCanvas type="bar" data={{labels:rm.map(d=>d.mes),datasets:[{label:"Receita",data:rm.map(d=>d.receita),backgroundColor:T.primary+"cc",borderRadius:5}]}} options={{_tc:{label:c=>fmt(c.raw)},_yt:{callback:v=>fmtK(v)}}}/>
      </ExpandableChart>:<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:40,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted}}>Sem dados de receita</div>}
    </div>

    {info.latitude&&info.longitude&&(<div style={{marginTop:16,background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:T.sh}}>
      <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}><MapPin size={14} color={T.primary}/><span style={{fontSize:13,fontWeight:700,color:T.text}}>Localização</span></div>
      <iframe src={`https://maps.google.com/maps?q=${info.latitude},${info.longitude}&t=k&z=15&output=embed&hl=pt-BR`} style={{width:"100%",height:250,border:"none"}} allowFullScreen loading="lazy"/>
    </div>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════════
   GESTÃO DE FRANQUIAS
   ═══════════════════════════════════════════════════════════ */
function GestaoFranquia({empresaId,onBack}){
  const [d,setD]=useState(null);const [loading,setLoading]=useState(true);const [tab,sTab]=useState("cadastro");
  useEffect(()=>{(async()=>{try{setLoading(true);const r=await api.get(`/franqueador-module/franquias/${empresaId}/gestao`);setD(r.data);}catch(e){console.error(e);}finally{setLoading(false);}})();},[empresaId]);
  if(loading)return<Spinner/>;if(!d)return<div style={{padding:60,textAlign:"center",color:T.muted}}>Erro ao carregar</div>;

  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
      <button onClick={onBack} style={{width:34,height:34,borderRadius:T.rS,border:`1px solid ${T.border}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:T.sub}}><ArrowLeft size={15}/></button>
      <div style={{flex:1}}><h2 style={{fontSize:20,fontWeight:800,color:T.text,margin:0}}>Gestão — {d.apelido||d.nome}</h2><div style={{fontSize:11,color:T.muted,marginTop:3}}>{d.nome} • CNPJ: {d.cnpj||"—"}</div></div>
      <Badge color={d.status_franquia==="Ativa"?T.success:T.warning}>{d.status_franquia||d.status||"—"}</Badge>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:20}}>
      <KpiCard icon={Calendar} label="Tempo de Franquia" value={`${d.tempo_franquia_anos||0} anos`} sub={`${d.tempo_franquia_meses||0} meses`} color={T.info} info="Tempo decorrido desde a data de adesão da franquia à rede."/>
      <KpiCard icon={UserCog} label="Funcionários" value={d.funcionarios?.ativos||0} sub={`${d.funcionarios?.inativos||0} inativos`} color={T.success} info="Total de funcionários com status ativo cadastrados no módulo RH desta unidade."/>
      <KpiCard icon={Users} label="Usuários Sistema" value={d.usuarios_sistema?.ativos||0} sub={`Limite: ${d.limite_usuarios||"—"}`} color={T.purple} info="Usuários com acesso ao sistema Omni26 nesta franquia. Limite definido pelo plano contratado."/>
      <KpiCard icon={FileText} label="Contratos Ativos" value={d.contratos?.ativos||0} sub={fmtSmart(d.contratos?.valor_mensal||0)+"/mês"} color={T.primary} info="Contratos de locação vigentes (status ATIVO) e o valor mensal total desses contratos."/>
      <KpiCard icon={Package} label="Limite Ativos" value={d.limite_ativos||"—"} color={T.warning} info="Quantidade máxima de equipamentos que esta franquia pode cadastrar, conforme o plano contratado."/>
    </div>

    <div style={{display:"flex",gap:3,marginBottom:18,borderBottom:`1px solid ${T.border}`}}>
      {[{id:"cadastro",l:"Cadastro"},{id:"funcionarios",l:`Funcionários (${d.funcionarios?.ativos||0})`},{id:"localizacao",l:"Localização"}].map(t=>(
        <button key={t.id} onClick={()=>sTab(t.id)} style={{padding:"9px 18px",border:"none",background:"transparent",color:tab===t.id?T.primary:T.muted,fontSize:12,fontWeight:tab===t.id?700:500,cursor:"pointer",borderBottom:`2px solid ${tab===t.id?T.primary:"transparent"}`,marginBottom:-1}}>{t.l}</button>
      ))}
    </div>

    {tab==="cadastro"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:22,boxShadow:T.sh}}>
        <CardTitle title="Dados Cadastrais" info="Razão social, CNPJ, endereço, responsável e plano contratado pela franquia."/>
        {[[Building2,"Razão Social",d.nome],[Hash,"CNPJ",d.cnpj],[MapPin,"Região",d.regiao],[Users,"Responsável",d.responsavel],[Mail,"Email",d.email],[Phone,"Telefone",d.telefone],[FileText,"Plano",d.plano],[Settings,"Status",d.status]].map(([Ic,l,v],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<7?`1px solid ${T.borderL}`:"none"}}>
            <Ic size={13} color={T.muted}/><span style={{fontSize:10,color:T.muted,minWidth:90,fontWeight:600}}>{l}</span><span style={{fontSize:12,color:T.text,fontWeight:500}}>{v||"—"}</span>
          </div>
        ))}
      </div>
      <div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:22,boxShadow:T.sh}}>
        <CardTitle title="Contrato & Limites" info="Datas do contrato de franquia, limites do plano (usuários, ativos) e receita de contratos vigentes."/>
        {[["Início Contrato",d.data_contrato_inicio?new Date(d.data_contrato_inicio).toLocaleDateString("pt-BR"):"—"],["Fim Contrato",d.data_contrato_fim?new Date(d.data_contrato_fim).toLocaleDateString("pt-BR"):"—"],["Data Adesão",d.data_adesao?new Date(d.data_adesao).toLocaleDateString("pt-BR"):"—"],["Tempo de Franquia",`${d.tempo_franquia_anos||0} anos (${d.tempo_franquia_meses||0} meses)`],["Limite Usuários",d.limite_usuarios||"—"],["Limite Ativos",d.limite_ativos||"—"],["Contratos Ativos",`${d.contratos?.ativos||0} (${fmtSmart(d.contratos?.valor_total||0)})`],["Receita Mensal Contratos",fmtSmart(d.contratos?.valor_mensal||0)]].map(([l,v],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<7?`1px solid ${T.borderL}`:"none"}}>
            <span style={{fontSize:11,color:T.muted,fontWeight:600}}>{l}</span><span style={{fontSize:12,color:T.text,fontWeight:600}}>{v}</span>
          </div>
        ))}
        {d.observacoes&&<div style={{marginTop:12,padding:"10px 12px",background:T.bg,borderRadius:T.rS,fontSize:11,color:T.sub}}><strong>Obs:</strong> {d.observacoes}</div>}
      </div>
    </div>)}

    {tab==="funcionarios"&&(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>
      {!(d.lista_funcionarios||[]).length&&<div style={{padding:40,textAlign:"center",color:T.muted}}>Nenhum funcionário cadastrado nesta unidade</div>}
      {(d.lista_funcionarios||[]).length>0&&<div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            <TH info="Nome completo do colaborador registrado no módulo RH.">Nome</TH>
            <TH info="Cargo ou função atribuída ao colaborador.">Cargo</TH>
            <TH info="Departamento ou setor ao qual o colaborador pertence.">Departamento</TH>
            <TH>Email</TH>
            <TH>Telefone</TH>
          </tr></thead>
          <tbody>{(d.lista_funcionarios||[]).map((f,i)=>(<tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
            <td style={{padding:"10px 14px",fontWeight:600,color:T.text}}>{f.nome}</td>
            <td style={{padding:"10px 14px"}}><Badge color={T.sub}>{f.cargo}</Badge></td>
            <td style={{padding:"10px 14px",color:T.sub}}>{f.departamento}</td>
            <td style={{padding:"10px 14px",color:T.sub,fontSize:11}}>{f.email||"—"}</td>
            <td style={{padding:"10px 14px",color:T.sub,fontSize:11}}>{f.telefone||"—"}</td>
          </tr>))}</tbody>
        </table>
      </div>}
    </div>)}

    {tab==="localizacao"&&(d.latitude&&d.longitude?(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,overflow:"hidden",boxShadow:T.sh}}>
      <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><MapPin size={14} color={T.primary}/><span style={{fontSize:13,fontWeight:700,color:T.text}}>Localização — {d.apelido||d.nome}</span></div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`} target="_blank" rel="noopener noreferrer" style={{fontSize:10,fontWeight:700,color:T.primary,textDecoration:"none",display:"flex",alignItems:"center",gap:4}}><ExternalLink size={11}/>Google Maps</a>
      </div>
      <iframe src={`https://maps.google.com/maps?q=${d.latitude},${d.longitude}&t=k&z=15&output=embed&hl=pt-BR`} style={{width:"100%",height:350,border:"none"}} allowFullScreen loading="lazy"/>
      <div style={{padding:"10px 18px",background:T.bg,fontSize:11,color:T.muted}}>Lat: {d.latitude?.toFixed(5)} • Lng: {d.longitude?.toFixed(5)} • {d.regiao||""}</div>
    </div>):<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,padding:40,textAlign:"center",color:T.muted}}>Sem coordenadas</div>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════════
   MAPA DA REDE
   ═══════════════════════════════════════════════════════════ */
function MapaRede({redeId,onSelectFranquia}){
  const mapRef=useRef(null);const mapI=useRef(null);const mk=useRef([]);const [loaded,setLoaded]=useState(false);const [fqs,setFqs]=useState([]);
  useEffect(()=>{(async()=>{try{const url=redeId?`/franqueador-module/mapa?rede_id=${redeId}`:"/franqueador-module/mapa";const r=await api.get(url);setFqs(r.data||[]);}catch(e){console.error(e);}})();},[redeId]);
  useEffect(()=>{if(window.L){setLoaded(true);return;}const css=document.createElement("link");css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);const js=document.createElement("script");js.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";js.onload=()=>setLoaded(true);document.head.appendChild(js);},[]);
  useEffect(()=>{if(!loaded||!mapRef.current||mapI.current)return;mapI.current=window.L.map(mapRef.current).setView([-6.5,-36],7);window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM",maxZoom:18}).addTo(mapI.current);setTimeout(()=>mapI.current.invalidateSize(),200);},[loaded]);
  useEffect(()=>{if(!mapI.current||!window.L||!fqs.length)return;const L=window.L;mk.current.forEach(m=>mapI.current.removeLayer(m));mk.current=[];
    fqs.forEach(f=>{if(!f.latitude||!f.longitude)return;const c=f.receita>0?T.success:T.warning;const icon=L.divIcon({className:"",html:`<div style="width:18px;height:18px;border-radius:50%;background:${c};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,iconSize:[18,18],iconAnchor:[9,9]});const m=L.marker([f.latitude,f.longitude],{icon}).addTo(mapI.current);m.bindPopup(`<div style="font-family:system-ui;min-width:200px;"><div style="font-weight:800;font-size:14px;margin-bottom:4px;">${f.apelido||f.nome}</div><div style="font-size:11px;color:#64748b;margin-bottom:8px;">${f.regiao||""}</div><div style="font-size:12px;"><b>Receita:</b> ${fmtSmart(f.receita)}<br><b>Clientes:</b> ${f.clientes}</div></div>`);m.on("click",()=>onSelectFranquia&&onSelectFranquia(f));mk.current.push(m);});
    if(fqs.length>1){const bounds=L.latLngBounds(fqs.filter(f=>f.latitude).map(f=>[f.latitude,f.longitude]));mapI.current.fitBounds(bounds,{padding:[40,40]});}
  },[fqs,loaded]);
  return(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>{!loaded&&<Spinner/>}<div ref={mapRef} style={{width:"100%",height:550}}/></div>);
}

/* ═══════════════════════════════════════════════════════════
   ALERTAS
   ═══════════════════════════════════════════════════════════ */
function AlertasFranqueador({redeId,showToast}){
  const [als,setAls]=useState([]);const [loading,setLoading]=useState(true);
  const load=async()=>{try{setLoading(true);const url=redeId?`/franqueador-module/alertas?rede_id=${redeId}`:"/franqueador-module/alertas";const r=await api.get(url);setAls(r.data||[]);}catch(e){console.error(e);}finally{setLoading(false);}};
  useEffect(()=>{load();},[redeId]);
  const dispensar=async id=>{try{await api.put(`/franqueador-module/alertas/${id}/dispensar`);setAls(p=>p.filter(a=>a.id!==id));showToast?.("Dispensado","success");}catch(e){console.error(e);}};
  const gerar=async()=>{try{const r=await api.post(`/franqueador-module/alertas/gerar?rede_id=${redeId||1}`);showToast?.((r.data.alertas_gerados||0)+" alertas gerados","success");load();}catch(e){showToast?.("Erro","error");}};
  const pc={alta:{c:T.danger,ic:AlertTriangle},media:{c:T.warning,ic:Bell},baixa:{c:T.info,ic:BellRing}};
  return(<div>
    <div style={{display:"flex",gap:8,marginBottom:16}}><button onClick={gerar} style={{padding:"8px 14px",borderRadius:T.rS,border:"none",background:T.primary,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,marginLeft:"auto"}}><RefreshCw size={12}/>Gerar Alertas</button></div>
    {loading?<Spinner/>:(<div style={{background:T.card,borderRadius:T.r,border:`1px solid ${T.border}`,boxShadow:T.sh,overflow:"hidden"}}>
      {!als.length&&<div style={{textAlign:"center",padding:50}}><CheckCircle2 size={28} color={T.success} style={{marginBottom:10}}/><div style={{fontSize:15,fontWeight:700,color:T.text}}>Nenhum alerta ativo</div></div>}
      {als.map((a,i)=>{const p=pc[a.prioridade]||pc.media;return(<div key={a.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 22px",borderBottom:i<als.length-1?`1px solid ${T.borderL}`:"none",borderLeft:`4px solid ${p.c}`}}>
        <div style={{width:34,height:34,borderRadius:T.rS,background:`${p.c}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><p.ic size={15} color={p.c}/></div>
        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:2}}>{a.titulo}</div><div style={{display:"flex",alignItems:"center",gap:8,fontSize:10}}><Badge color={p.c}>{a.prioridade}</Badge>{a.empresa_nome&&<Badge color={T.sub}>{a.empresa_nome}</Badge>}<span style={{color:T.muted}}>{a.data_criacao?new Date(a.data_criacao).toLocaleDateString("pt-BR"):""}</span></div></div>
        <ActionDropdown items={[{label:a.acao_sugerida||"Agir",icon:Zap},{divider:true},{label:"Dispensar",icon:X,danger:true,onClick:()=>dispensar(a.id)}]}/>
      </div>);})}
    </div>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export default function CentroComandoFranqueador({styles:ps,currentUser,showToast,logAction}){
  const [tab,sTab]=useState("dashboard");
  const [sel,sSel]=useState(null);
  const [viewMode,setViewMode]=useState(null);
  const redeId=currentUser?.rede_id||null;

  const goFranquia=useCallback((f,mode="dossie")=>{sSel(f);setViewMode(mode);sTab("detail");},[]);
  const goBack=useCallback(()=>{sSel(null);setViewMode(null);sTab("dashboard");},[]);

  const tabs=[
    {id:"dashboard",l:"Dashboard",ic:LayoutDashboard},
    {id:"mapa",l:"Mapa da Rede",ic:Globe},
    {id:"alertas",l:"Alertas",ic:BellRing},
  ];

  return(<div style={{fontFamily:"'DM Sans','Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.leaflet-popup-content-wrapper{border-radius:10px!important;box-shadow:0 4px 20px rgba(0,0,0,0.12)!important;}.leaflet-popup-tip{display:none!important;}`}</style>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
      <div><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
        <div style={{width:36,height:36,borderRadius:T.rS,background:"linear-gradient(135deg,#1e293b,#0f172a)",display:"flex",alignItems:"center",justifyContent:"center"}}><Crown size={18} color="#FFD700" strokeWidth={2}/></div>
        <h1 style={{fontSize:24,fontWeight:800,color:T.text,margin:0}}>Centro de Comando</h1>
      </div><p style={{fontSize:12,color:T.muted,margin:"2px 0 0 46px"}}>Visão consolidada da rede • {currentUser?.empresa_nome||"Omni26"}</p></div>
    </div>

    {tab!=="detail"&&(<div style={{display:"flex",alignItems:"center",gap:3,marginBottom:22,background:T.card,borderRadius:T.r,padding:5,border:`1px solid ${T.border}`,boxShadow:T.sh,overflowX:"auto"}}>
      {tabs.map(t=>{const a=tab===t.id;return(<button key={t.id} onClick={()=>sTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:T.rS,border:"none",background:a?T.primary:"transparent",color:a?"#fff":T.sub,fontSize:12,fontWeight:a?700:600,cursor:"pointer",whiteSpace:"nowrap"}}><t.ic size={15} strokeWidth={a?2:1.5}/>{t.l}</button>);})}
    </div>)}

    {tab==="dashboard"&&<DashboardFranqueador redeId={redeId} onSelectFranquia={(f,mode)=>goFranquia(f,mode||"dossie")}/>}
    {tab==="detail"&&sel&&viewMode==="dossie"&&<DossieFranquia empresaId={sel.empresa_id} onBack={goBack}/>}
    {tab==="detail"&&sel&&viewMode==="gestao"&&<GestaoFranquia empresaId={sel.empresa_id} onBack={goBack}/>}
    {tab==="mapa"&&<MapaRede redeId={redeId} onSelectFranquia={f=>goFranquia(f,"dossie")}/>}
    {tab==="alertas"&&<AlertasFranqueador redeId={redeId} showToast={showToast}/>}
  </div>);
}