import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api";

const fmt = (v) => { if (!v || isNaN(v)) return "R$ 0,00"; return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v); };
const fmtDate = (d) => { if (!d || d==="None" || d==="null") return "—"; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; } };
const TL_ICONS = { admissao:"🟢",promocao:"⬆️",salario:"💰",treinamento:"📚",avaliacao:"📋",ferias:"🏖️",certificacao:"🎓",demissao:"🔴" };
const TL_COLORS = { admissao:"#22A06B",promocao:"#8b5cf6",salario:"#F26B25",treinamento:"#1A73E8",avaliacao:"#f97316",ferias:"#06b6d4",certificacao:"#ec4899",demissao:"#D93025" };
const SEV = { 
  alta:{bg:"rgba(217, 48, 37, 0.08)",border:"rgba(217, 48, 37, 0.3)",text:"#D93025"},
  media:{bg:"rgba(242, 107, 37, 0.08)",border:"rgba(242, 107, 37, 0.3)",text:"#F26B25"},
  baixa:{bg:"rgba(26, 115, 232, 0.08)",border:"rgba(26, 115, 232, 0.3)",text:"#1A73E8"}
};

const S = {
  card:{background:"#FFFFFF",borderRadius:16,border:"1px solid #E5E7EB",padding:24,boxShadow:"0 4px 12px rgba(0,0,0,0.03)"},
  th:{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:"#636466",textTransform:"uppercase",borderBottom:"1px solid #E5E7EB"},
  td:{padding:"10px 12px",fontSize:12,color:"#3D3E40",borderBottom:"1px solid #E5E7EB"},
  lbl:{fontSize:10,color:"#8E9093",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5},
  val:{fontSize:14,color:"#2A2B2D",fontWeight:700,marginTop:2},
  tabBtn:(a)=>({padding:"7px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"1px solid",whiteSpace:"nowrap",background:a?"#F26B25":"#F9FAFB",color:a?"#FFFFFF":"#636466",borderColor:a?"#F26B25":"#E5E7EB",boxShadow:a?"0 4px 12px rgba(242, 107, 37, 0.25)":"none",transition:"all 0.2s"}),
  infoBox:{background:"#F9FAFB",borderRadius:10,padding:"10px 14px",border:"1px solid #E5E7EB"},
  input:{width:"100%",padding:"8px 12px",borderRadius:8,fontSize:12,background:"#FFFFFF",color:"#2A2B2D",border:"1px solid #D4D5D6",outline:"none"},
  inputLbl:{fontSize:10,color:"#8E9093",fontWeight:700,marginBottom:3,display:"block",textTransform:"uppercase"},
  primaryBtn:{padding:"8px 18px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:"#F26B25",color:"#FFFFFF",boxShadow:"0 4px 10px rgba(242, 107, 37, 0.2)"},
  smallBtn:{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"1px solid #D4D5D6",background:"#F9FAFB",color:"#636466"},
  dangerBtn:{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"1px solid rgba(217, 48, 37, 0.3)",background:"rgba(217, 48, 37, 0.08)",color:"#D93025"},
  successBtn:{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"1px solid rgba(34, 160, 107, 0.3)",background:"rgba(34, 160, 107, 0.08)",color:"#22A06B"},
  overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(42, 43, 45, 0.7)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},
  modal:{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:20,padding:30,maxWidth:500,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 40px rgba(0,0,0,0.1)"},
  bar:(c1,c2)=>({width:4,height:22,borderRadius:2,background:`linear-gradient(to bottom,${c1},${c2})`,flexShrink:0}),
};

const InfoField=({label,value})=>(<div style={S.infoBox}><div style={S.lbl}>{label}</div><div style={S.val}>{value||"—"}</div></div>);
const SectionTitle=({icon,title,c1="#F26B25",c2="#FF9B6A",action})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}><div style={S.bar(c1,c2)}/><span style={{fontSize:15,fontWeight:800,color:"#2A2B2D"}}>{icon} {title}</span></div>
    {action}
  </div>
);

// ============ CHART.JS SALARY LINE CHART ============
function SalaryLineChart({ data, height = 280 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    let destroyed = false;
    const run = async () => {
      try {
        const mod = await import("chart.js");
        const Chart = mod.Chart || mod.default;
        const { LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } = mod;
        Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);
        if (destroyed) return;
        if (chartRef.current) chartRef.current.destroy();
        const labels = data.map(d => fmtDate(d.data));
        const values = data.map(d => d.salario);
        const tipos = data.map(d => d.tipo);
        const colors = data.map(d => d.tipo === "admissao" ? "#1A73E8" : d.tipo === "promocao" ? "#8b5cf6" : "#22A06B");
        chartRef.current = new Chart(canvasRef.current, {
          type: "line",
          data: { labels, datasets: [{
            label: "Salário (R$)", data: values, borderColor: "#22A06B", backgroundColor: "rgba(34, 160, 107, 0.08)",
            borderWidth: 3, pointBackgroundColor: colors, pointBorderColor: colors, pointRadius: 7,
            pointHoverRadius: 10, pointBorderWidth: 2, tension: 0.3, fill: true,
          }]},
          options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#FFFFFF", titleColor: "#2A2B2D", bodyColor: "#636466",
                borderColor: "#E5E7EB", borderWidth: 1, cornerRadius: 10, padding: 12,
                titleFont: { size: 13, weight: 'bold' }, bodyFont: { size: 12 },
                boxPadding: 6,
                callbacks: {
                  label: (ctx) => { const t = tipos[ctx.dataIndex]||""; return [fmt(ctx.raw), `Tipo: ${t}`]; },
                  afterLabel: (ctx) => { if(ctx.dataIndex===0)return""; const prev=values[ctx.dataIndex-1]; const pct=((ctx.raw-prev)/prev*100).toFixed(1); return `Variação: +${pct}%`; }
                }
              }
            },
            scales: {
              x: { grid:{color:"#F5F6F8"}, ticks:{color:"#8E9093",font:{size:10,weight:'bold'}} },
              y: { grid:{color:"#F5F6F8"}, ticks:{color:"#8E9093",font:{size:10,weight:'bold'},callback:(v)=>"R$ "+(v>=1000?(v/1000).toFixed(1)+"k":v)} }
            }
          }
        });
      } catch(e) { console.warn("Chart.js not available, using fallback", e); }
    };
    run();
    return () => { destroyed = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);
  if (!data || data.length === 0) return null;
  return <div style={{ position: "relative", height }}><canvas ref={canvasRef} /></div>;
}

// ============ WRAPPER ============
export default function DossieColaborador({styles,currentUser,showToast}){
  const [sel,setSel]=useState(null);
  const eid=currentUser?.empresa_id||1;
  if(sel) return <DossieView employeeId={sel} empresaId={eid} onBack={()=>setSel(null)} showToast={showToast}/>;
  return <EmployeeSearch empresaId={eid} onSelect={setSel}/>;
}

// ============ BUSCA ============
function EmployeeSearch({empresaId,onSelect}){
  const [busca,setBusca]=useState("");const [emps,setEmps]=useState([]);const [loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true);try{
    let url=`/rh-dossier/employees?empresa_id=${empresaId}&per_page=30`;if(busca)url+=`&busca=${encodeURIComponent(busca)}`;
    const r=await api.get(url);setEmps(r.data.data||[]);
  }catch{try{const r=await api.get(`/rh/employees?empresa_id=${empresaId}&search=${busca||""}`);
    setEmps((Array.isArray(r.data)?r.data:[]).map(e=>({id:e.id,nome:e.name,email:e.email,telefone:e.phone,salario:e.salary||0,status:e.status,foto_url:e.photo_url,data_admissao:e.hire_date,departamento:e.department_name,cargo:e.position_name})));
  }catch{setEmps([]);}}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  useEffect(()=>{const t=setTimeout(()=>load(),400);return()=>clearTimeout(t);},[busca]);
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><div style={S.bar("#F26B25","#FF9B6A")}/><h2 style={{color:"#2A2B2D",margin:0,fontSize:22,fontWeight:800}}>Dossiê do Colaborador</h2></div>
    <p style={{color:"#8E9093",fontSize:12,marginBottom:24,marginLeft:16,fontWeight:600}}>Busque por nome, CPF ou e-mail para abrir o dossiê 360°</p>
    <div style={{maxWidth:500,marginBottom:24}}><input placeholder="🔍 Nome, CPF ou e-mail..." value={busca} onChange={e=>setBusca(e.target.value)} style={{...S.input,padding:"12px 16px",fontSize:14,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}} autoFocus/></div>
    {loading?<p style={{color:"#8E9093",textAlign:"center",padding:40,fontWeight:600}}>Buscando...</p>:
    emps.length===0?<div style={{...S.card,textAlign:"center",padding:60}}><div style={{fontSize:40,marginBottom:12,opacity:0.3}}>👥</div><p style={{color:"#8E9093",fontWeight:600}}>{busca?`Nenhum resultado para "${busca}"`:"Nenhum colaborador"}</p></div>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
      {emps.map(e=>(<div key={e.id} onClick={()=>onSelect(e.id)} style={{...S.card,cursor:"pointer",padding:"16px 20px",display:"flex",alignItems:"center",gap:14,transition:"all 0.2s"}}
        onMouseEnter={ev=>{ev.currentTarget.style.borderColor="#F26B25";ev.currentTarget.style.boxShadow="0 6px 16px rgba(242, 107, 37, 0.15)";}} onMouseLeave={ev=>{ev.currentTarget.style.borderColor="#E5E7EB";ev.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.03)";}}>
        <div style={{width:48,height:48,borderRadius:12,flexShrink:0,background:"rgba(242, 107, 37, 0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#F26B25",border:"2px solid rgba(242, 107, 37, 0.2)"}}>{(e.nome||"?").charAt(0)}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:800,color:"#2A2B2D",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nome}</div>
          <div style={{fontSize:11,color:"#636466",fontWeight:600}}>{e.cargo||"—"} • {e.departamento||"—"}</div><div style={{fontSize:10,color:"#8E9093"}}>{e.email}</div></div>
        <div style={{textAlign:"right",flexShrink:0}}><span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,textTransform:"uppercase",background:e.status==="Ativo"?"rgba(34, 160, 107, 0.1)":"rgba(217, 48, 37, 0.1)",color:e.status==="Ativo"?"#22A06B":"#D93025"}}>{e.status}</span>
          {e.salario>0&&<div style={{fontSize:12,fontWeight:800,color:"#22A06B",marginTop:4}}>{fmt(e.salario)}</div>}</div>
      </div>))}</div>}
  </div>);
}

// ============ DOSSIÊ 360° ============
function DossieView({employeeId,empresaId,onBack,showToast}){
  const [dossier,setDossier]=useState(null);const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("dashboard");const [alertas,setAlertas]=useState([]);
  const [editSection,setEditSection]=useState(null);const [editForm,setEditForm]=useState({});
  const [showAddModal,setShowAddModal]=useState(null);const [addForm,setAddForm]=useState({});
  const [uploading,setUploading]=useState(false);const [docType,setDocType]=useState("Geral");const fileRef=useRef(null);

  useEffect(()=>{loadDossier();loadAlerts();},[employeeId]);
  const loadDossier=async()=>{try{setLoading(true);const r=await api.get(`/rh-dossier/employees/${employeeId}/dossier?empresa_id=${empresaId}`);setDossier(r.data);}catch(e){console.error(e);showToast?.("Erro ao carregar dossiê","error");}finally{setLoading(false);}};
  const loadAlerts=async()=>{try{const r=await api.get(`/rh-dossier/employees/${employeeId}/alerts?empresa_id=${empresaId}`);setAlertas(r.data.alertas||[]);}catch{setAlertas([]);}};

  const savePersonal=async()=>{try{await api.put(`/rh-dossier/employees/${employeeId}/personal`,editForm);showToast?.("Dados pessoais atualizados!","success");setEditSection(null);loadDossier();}catch(e){showToast?.(e.response?.data?.detail||"Erro","error");}};
  const saveProfessional=async()=>{try{await api.put(`/rh-dossier/employees/${employeeId}/professional`,editForm);showToast?.("Dados profissionais atualizados!","success");setEditSection(null);loadDossier();}catch(e){showToast?.(e.response?.data?.detail||"Erro","error");}};

  const addItem=async(type)=>{
    const urls={contato:"/rh-dossier/emergency-contacts",dependente:"/rh-dossier/dependents",formacao:"/rh-dossier/education",experiencia:"/rh-dossier/experience",salario:"/rh-dossier/salary-history"};
    try{await api.post(urls[type],{...addForm,employee_id:employeeId,empresa_id:empresaId});showToast?.("Adicionado!","success");setShowAddModal(null);setAddForm({});loadDossier();if(type==="salario")loadAlerts();}
    catch(e){showToast?.(e.response?.data?.detail||"Erro","error");}};
  const deleteItem=async(type,id)=>{if(!window.confirm("Remover?"))return;
    const urls={contato:`/rh-dossier/emergency-contacts/${id}`,dependente:`/rh-dossier/dependents/${id}`,formacao:`/rh-dossier/education/${id}`,experiencia:`/rh-dossier/experience/${id}`};
    try{await api.delete(urls[type]);showToast?.("Removido","success");loadDossier();}catch(e){showToast?.(e.response?.data?.detail||"Erro","error");}};

  if(loading)return<div style={{textAlign:"center",padding:60,color:"#8E9093",fontWeight:700}}>Carregando dossiê...</div>;
  if(!dossier)return<div style={{textAlign:"center",padding:60}}><p style={{color:"#D93025",marginBottom:16,fontWeight:700}}>Dossiê não encontrado</p><button onClick={onBack} style={S.smallBtn}>← Voltar</button></div>;

  const {dados_pessoais:dp,dados_profissionais:prof,formacao,historico_profissional:exp,evolucao_salarial:evoSal,metricas_salariais:salMetrics,folha_pagamento:folha,ponto,ferias,desempenho,treinamentos,documentos,contatos_emergencia:contatos,dependentes,promocoes,timeline,insights}=dossier;
  const tabs=[{key:"dashboard",label:"Visão Geral",icon:"🏠"},{key:"geral",label:"Dados Pessoais",icon:"👤"},{key:"profissional",label:"Profissional",icon:"💼"},{key:"financeiro",label:"Financeiro",icon:"💰"},{key:"ponto",label:"Ponto",icon:"⏰"},{key:"ferias",label:"Férias",icon:"🏖️"},{key:"desempenho",label:"Desempenho",icon:"📊"},{key:"treinamentos",label:"Treinamentos",icon:"📚"},{key:"documentos",label:"Documentos",icon:"📄"},{key:"timeline",label:"Timeline",icon:"📅"},{key:"insights",label:"Insights",icon:"🧠"}];

  const EditField=({label,field,type="text"})=>(<div><label style={S.inputLbl}>{label}</label><input style={S.input} type={type} value={editForm[field]||""} onChange={e=>setEditForm(p=>({...p,[field]:e.target.value}))}/></div>);

  // ====== MODAL ADICIONAR ======
  const renderAddModal=()=>{
    if(!showAddModal)return null;
    const configs={
      contato:{title:"Contato de Emergência",fields:[{l:"Nome",f:"name"},{l:"Parentesco",f:"relationship"},{l:"Telefone",f:"phone"},{l:"E-mail",f:"email"}]},
      dependente:{title:"Dependente",fields:[{l:"Nome",f:"name"},{l:"Nascimento",f:"birth_date",t:"date"},{l:"Parentesco",f:"relationship"},{l:"CPF",f:"cpf"}]},
      formacao:{title:"Formação Acadêmica",fields:[{l:"Instituição",f:"institution"},{l:"Curso",f:"course"},{l:"Grau",f:"degree"},{l:"Início",f:"start_date",t:"date"},{l:"Fim",f:"end_date",t:"date"},{l:"Status",f:"status"}]},
      experiencia:{title:"Experiência",fields:[{l:"Empresa",f:"company"},{l:"Cargo",f:"position"},{l:"Início",f:"start_date",t:"date"},{l:"Fim",f:"end_date",t:"date"},{l:"Descrição",f:"description"}]},
      salario:{title:"Reajuste Salarial",fields:[{l:"Novo Salário (R$)",f:"salario",t:"number"},{l:"Tipo",f:"tipo"},{l:"Motivo",f:"motivo"},{l:"Data Início",f:"data_inicio",t:"date"}]},
    };
    const cfg=configs[showAddModal];if(!cfg)return null;
    return(<div style={S.overlay} onClick={()=>setShowAddModal(null)}><div style={S.modal} onClick={e=>e.stopPropagation()}>
      <h3 style={{color:"#2A2B2D",fontSize:18,fontWeight:800,marginBottom:20}}>+ {cfg.title}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {cfg.fields.map((fi,i)=>(<div key={i} style={fi.f==="description"||fi.f==="motivo"?{gridColumn:"1/-1"}:{}}>
          <label style={S.inputLbl}>{fi.l}</label>
          {fi.f==="tipo"?<select style={S.input} value={addForm[fi.f]||""} onChange={e=>setAddForm(p=>({...p,[fi.f]:e.target.value}))}>
            <option value="">Selecione...</option><option value="admissao">Admissão</option><option value="promocao">Promoção</option><option value="reajuste">Reajuste</option><option value="dissidio">Dissídio</option></select>
          :fi.f==="status"&&showAddModal==="formacao"?<select style={S.input} value={addForm[fi.f]||""} onChange={e=>setAddForm(p=>({...p,[fi.f]:e.target.value}))}>
            <option value="">Selecione...</option><option value="Concluído">Concluído</option><option value="Em andamento">Em andamento</option><option value="Trancado">Trancado</option></select>
          :<input style={S.input} type={fi.t||"text"} value={addForm[fi.f]||""} onChange={e=>setAddForm(p=>({...p,[fi.f]:e.target.value}))}/>}
        </div>))}
        {showAddModal==="dependente"&&(<div style={{gridColumn:"1/-1"}}><label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#636466",cursor:"pointer",fontWeight:600}}>
          <input type="checkbox" checked={addForm.is_ir_dependent||false} onChange={e=>setAddForm(p=>({...p,is_ir_dependent:e.target.checked}))}/>Dependente para IR</label></div>)}
      </div>
      <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
        <button onClick={()=>setShowAddModal(null)} style={S.smallBtn}>Cancelar</button>
        <button onClick={()=>addItem(showAddModal)} style={S.primaryBtn}>Salvar</button>
      </div>
    </div></div>);
  };

  // ====== TAB: DASHBOARD (VISÃO GERAL) ======
  const renderDashboard=()=>{
    const lastPromo = promocoes?.length>0 ? promocoes[0] : null;
    const lastFerias = ferias?.length>0 ? ferias[0] : null;
    const lastAval = desempenho?.length>0 ? desempenho[0] : null;
    const maxSal = Math.max(...(evoSal||[]).map(x=>x.salario),1);
    return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* ROW 1: KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:14}}>
        {[
          {icon:"💰",label:"Salário Atual",value:fmt(prof.salario_atual),sub:salMetrics?.crescimento_total_pct?`+${salMetrics.crescimento_total_pct}% desde admissão`:"",color:"#22A06B"},
          {icon:"⏱️",label:"Tempo de Empresa",value:insights.tempo_empresa_formatado,sub:fmtDate(prof.data_admissao),color:"#1A73E8"},
          {icon:"📊",label:"Última Avaliação",value:lastAval?`${lastAval.nota_geral}`:"N/A",sub:lastAval?`${lastAval.periodo} — ${fmtDate(lastAval.data)}`:"Sem avaliação",color:lastAval?(lastAval.nota_geral>=8?"#22A06B":lastAval.nota_geral>=6?"#F26B25":"#D93025"):"#8E9093"},
          {icon:"⬆️",label:"Última Promoção",value:lastPromo?lastPromo.novo_cargo||"—":"N/A",sub:lastPromo?fmtDate(lastPromo.data):"Sem promoção",color:"#8b5cf6"},
          {icon:"🏖️",label:"Últimas Férias",value:lastFerias?`${lastFerias.dias}d`:"N/A",sub:lastFerias?`${fmtDate(lastFerias.data_inicio)} — ${lastFerias.status}`:"Sem registro",color:"#06b6d4"},
          {icon:"📚",label:"Treinamentos",value:`${insights.treinamentos_concluidos}/${insights.total_treinamentos}`,sub:"concluídos",color:"#f97316"},
        ].map((c,i)=>(<div key={i} style={{background:"#FFFFFF",borderRadius:16,border:`1px solid ${c.color}33`,padding:"18px 20px",position:"relative",overflow:"hidden",boxShadow:"0 4px 12px rgba(0,0,0,0.02)"}}>
          <div style={{position:"absolute",top:-10,right:-10,fontSize:48,opacity:0.1}}>{c.icon}</div>
          <div style={{fontSize:10,color:"#8E9093",fontWeight:800,textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
          <div style={{fontSize:24,fontWeight:800,color:c.color,lineHeight:1}}>{c.value}</div>
          <div style={{fontSize:10,color:"#8E9093",marginTop:4,fontWeight:600}}>{c.sub}</div>
        </div>))}
      </div>

      {/* ROW 2: ALERTAS + RESUMO PROFISSIONAL */}
      <div style={{display:"grid",gridTemplateColumns:alertas.length>0?"1fr 1fr":"1fr",gap:16}}>
        {/* ALERTAS */}
        {alertas.length>0&&(<div style={{...S.card,borderColor:"rgba(217, 48, 37, 0.2)",padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={S.bar("#D93025","#f97316")}/><span style={{fontSize:15,fontWeight:800,color:"#D93025"}}>🔔 Alertas ({alertas.length})</span>
          </div>
          {alertas.map((a,i)=>{const sc=SEV[a.severidade]||SEV.media;return(<div key={i} style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:800,color:sc.text}}>{a.icone} {a.titulo}</div>
            <div style={{fontSize:11,color:"#636466",marginTop:2}}>{a.descricao}</div>
          </div>);})}
        </div>)}

        {/* RESUMO RÁPIDO */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={S.bar("#1A73E8","#8b5cf6")}/><span style={{fontSize:15,fontWeight:800,color:"#2A2B2D"}}>📋 Resumo Profissional</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <InfoField label="Cargo" value={prof.cargo}/>
            <InfoField label="Departamento" value={prof.departamento}/>
            <InfoField label="Contrato" value={prof.tipo_contrato}/>
            <InfoField label="Gestor" value={prof.gestor}/>
            <InfoField label="Dependentes" value={`${dependentes?.length||0}`}/>
            <InfoField label="Promoções" value={`${promocoes?.length||0}`}/>
          </div>
        </div>
      </div>

      {/* ROW 3: MINI EVOLUÇÃO SALARIAL + FREQUÊNCIA */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        {/* MINI GRÁFICO SALARIAL */}
        {evoSal?.length>0&&(<div style={S.card}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={S.bar("#22A06B","#F26B25")}/><span style={{fontSize:15,fontWeight:800,color:"#2A2B2D"}}>📈 Evolução Salarial</span>
            <button onClick={()=>setTab("financeiro")} style={{...S.smallBtn,marginLeft:"auto",fontSize:9}}>Ver detalhes →</button>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
            {evoSal.map((ev,i)=>{const h=Math.max((ev.salario/maxSal)*100,6);const color=ev.tipo==="admissao"?"#1A73E8":ev.tipo==="promocao"?"#8b5cf6":"#22A06B";return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:8,color:"#8E9093",fontWeight:700}}>{fmt(ev.salario)}</span>
                <div style={{width:"100%",maxWidth:32,height:h,borderRadius:"4px 4px 0 0",background:color}}/>
                <span style={{fontSize:7,color:"#8E9093",fontWeight:700}}>{fmtDate(ev.data)}</span>
              </div>);})}
          </div>
        </div>)}

        {/* FREQUÊNCIA */}
        <div style={S.card}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={S.bar("#06b6d4","#1A73E8")}/><span style={{fontSize:15,fontWeight:800,color:"#2A2B2D"}}>⏰ Frequência</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {label:"Faltas",value:insights.faltas_ultimo_mes,color:insights.faltas_ultimo_mes>0?"#D93025":"#22A06B"},
              {label:"Atrasos",value:insights.atrasos_ultimo_mes,color:insights.atrasos_ultimo_mes>0?"#F26B25":"#22A06B"},
              {label:"H. Extras",value:`${insights.horas_extras_ultimo_mes}h`,color:"#1A73E8"},
            ].map((c,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8}}>
              <span style={{fontSize:12,color:"#636466",fontWeight:700}}>{c.label}</span>
              <span style={{fontSize:18,fontWeight:800,color:c.color}}>{c.value}</span>
            </div>))}
          </div>
          <div style={{fontSize:9,color:"#8E9093",marginTop:8,textAlign:"center",fontWeight:700,textTransform:"uppercase"}}>Último mês</div>
        </div>
      </div>

      {/* ROW 4: TIMELINE RECENTE */}
      {timeline?.length>0&&(<div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={S.bar("#8b5cf6","#ec4899")}/><span style={{fontSize:15,fontWeight:800,color:"#2A2B2D"}}>📅 Últimos Eventos</span>
          <button onClick={()=>setTab("timeline")} style={{...S.smallBtn,marginLeft:"auto",fontSize:9}}>Ver timeline completa →</button>
        </div>
        {timeline.slice(-5).reverse().map((t,i)=>{const color=TL_COLORS[t.tipo]||"#8E9093";const icon=TL_ICONS[t.tipo]||"📌";return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:"1px solid #E5E7EB"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>
            <div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:"#2A2B2D"}}>{icon} {t.titulo}</span>
              {t.descricao&&<span style={{fontSize:11,color:"#636466",marginLeft:8}}>{t.descricao}</span>}</div>
            <span style={{fontSize:10,color:"#8E9093",flexShrink:0,fontWeight:600}}>{fmtDate(t.data)}</span>
          </div>);})}
      </div>)}
    </div>);
  };

  // ====== TAB: GERAL ======
  const renderGeral=()=>(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {alertas.length>0&&(<div style={{...S.card,borderColor:"rgba(217, 48, 37, 0.2)",padding:16}}>
      <div style={{fontSize:13,fontWeight:800,color:"#D93025",marginBottom:10}}>🔔 {alertas.length} Alerta{alertas.length>1?"s":""}</div>
      {alertas.map((a,i)=>{const sc=SEV[a.severidade]||SEV.media;return(<div key={i} style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
        <div style={{fontSize:12,fontWeight:800,color:sc.text}}>{a.icone} {a.titulo}</div><div style={{fontSize:11,color:"#636466",marginTop:2}}>{a.descricao}</div></div>);})}
    </div>)}
    <div style={S.card}>
      <SectionTitle icon="👤" title="Dados Pessoais" c1="#1A73E8" c2="#8b5cf6"
        action={editSection==="personal"?<div style={{display:"flex",gap:6}}><button onClick={savePersonal} style={S.successBtn}>Salvar</button><button onClick={()=>setEditSection(null)} style={S.smallBtn}>Cancelar</button></div>
        :<button onClick={()=>{setEditSection("personal");setEditForm({name:dp.nome,cpf:dp.cpf,email:dp.email,phone:dp.telefone,address:dp.endereco,gender:dp.genero,marital_status:dp.estado_civil,bank_name:dp.banco,bank_agency:dp.agencia,bank_account:dp.conta_bancaria,pix_key:dp.chave_pix});}} style={S.smallBtn}>✏️ Editar</button>}/>
      {editSection==="personal"?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <EditField label="Nome" field="name"/><EditField label="CPF" field="cpf"/><EditField label="E-mail" field="email"/><EditField label="Telefone" field="phone"/>
        <EditField label="Gênero" field="gender"/><EditField label="Estado Civil" field="marital_status"/>
        <div style={{gridColumn:"1/-1"}}><EditField label="Endereço" field="address"/></div>
        <EditField label="Banco" field="bank_name"/><EditField label="Agência" field="bank_agency"/><EditField label="Conta" field="bank_account"/><EditField label="PIX" field="pix_key"/>
      </div>):(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <InfoField label="Nome" value={dp.nome}/><InfoField label="CPF" value={dp.cpf}/><InfoField label="Nascimento" value={fmtDate(dp.data_nascimento)}/>
        <InfoField label="Gênero" value={dp.genero}/><InfoField label="Estado Civil" value={dp.estado_civil}/><InfoField label="E-mail" value={dp.email}/>
        <InfoField label="Telefone" value={dp.telefone}/><InfoField label="Endereço" value={dp.endereco}/><InfoField label="Banco" value={dp.banco}/>
        <InfoField label="Agência" value={dp.agencia}/><InfoField label="Conta" value={dp.conta_bancaria}/><InfoField label="PIX" value={dp.chave_pix}/>
      </div>)}
    </div>
    <div style={S.card}><SectionTitle icon="🆘" title={`Contatos Emergência (${contatos?.length||0})`} c1="#D93025" c2="#f97316"
      action={<button onClick={()=>{setShowAddModal("contato");setAddForm({name:"",relationship:"",phone:"",email:""});}} style={S.smallBtn}>+ Adicionar</button>}/>
      {contatos?.map((c,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #E5E7EB",fontSize:12}}>
        <span style={{color:"#2A2B2D",fontWeight:700}}>{c.nome} <span style={{color:"#8E9093"}}>({c.parentesco})</span> — {c.telefone}</span>
        <button onClick={()=>deleteItem("contato",c.id)} style={S.dangerBtn}>✕</button></div>))}
      {(!contatos||contatos.length===0)&&<p style={{fontSize:11,color:"#8E9093",fontWeight:600}}>Nenhum contato</p>}
    </div>
    <div style={S.card}><SectionTitle icon="👨‍👩‍👧‍👦" title={`Dependentes (${dependentes?.length||0})`} c1="#8b5cf6" c2="#ec4899"
      action={<button onClick={()=>{setShowAddModal("dependente");setAddForm({name:"",birth_date:"",relationship:"",cpf:"",is_ir_dependent:false});}} style={S.smallBtn}>+ Adicionar</button>}/>
      {dependentes?.map((d,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #E5E7EB",fontSize:12}}>
        <div><span style={{color:"#2A2B2D",fontWeight:700}}>{d.nome}</span><span style={{color:"#8E9093",marginLeft:8,fontWeight:600}}>({d.parentesco})</span>
          {d.dependente_ir&&<span style={{marginLeft:6,padding:"2px 6px",borderRadius:4,fontSize:8,background:"rgba(34, 160, 107, 0.1)",color:"#22A06B",fontWeight:800}}>IR</span>}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:"#636466",fontSize:11,fontWeight:600}}>{fmtDate(d.data_nascimento)}</span>
          <button onClick={()=>deleteItem("dependente",d.id)} style={S.dangerBtn}>✕</button></div>
      </div>))}
      {(!dependentes||dependentes.length===0)&&<p style={{fontSize:11,color:"#8E9093",fontWeight:600}}>Nenhum dependente</p>}
    </div>
  </div>);

  // ====== TAB: PROFISSIONAL ======
  const renderProfissional=()=>(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={S.card}><SectionTitle icon="💼" title="Dados Profissionais" c1="#F26B25" c2="#f97316"
      action={editSection==="professional"?<div style={{display:"flex",gap:6}}><button onClick={saveProfessional} style={S.successBtn}>Salvar</button><button onClick={()=>setEditSection(null)} style={S.smallBtn}>Cancelar</button></div>
      :<button onClick={()=>{setEditSection("professional");setEditForm({employment_type:prof.tipo_contrato,status:prof.status});}} style={S.smallBtn}>✏️ Editar</button>}/>
      {editSection==="professional"?(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={S.inputLbl}>Tipo Contrato</label><select style={S.input} value={editForm.employment_type||""} onChange={e=>setEditForm(p=>({...p,employment_type:e.target.value}))}><option value="CLT">CLT</option><option value="PJ">PJ</option><option value="Estágio">Estágio</option><option value="Temporário">Temporário</option></select></div>
        <div><label style={S.inputLbl}>Status</label><select style={S.input} value={editForm.status||""} onChange={e=>setEditForm(p=>({...p,status:e.target.value}))}><option value="Ativo">Ativo</option><option value="Férias">Férias</option><option value="Afastado">Afastado</option><option value="Desligado">Desligado</option></select></div>
      </div>):(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
        <InfoField label="Cargo" value={prof.cargo}/><InfoField label="Departamento" value={prof.departamento}/><InfoField label="Gestor" value={prof.gestor}/>
        <InfoField label="Admissão" value={fmtDate(prof.data_admissao)}/><InfoField label="Contrato" value={prof.tipo_contrato}/><InfoField label="Salário" value={fmt(prof.salario_atual)}/><InfoField label="Status" value={prof.status}/>
      </div>)}
    </div>
    {promocoes?.length>0&&<div style={S.card}><SectionTitle icon="⬆️" title={`Promoções (${promocoes.length})`} c1="#8b5cf6" c2="#1A73E8"/>
      {promocoes.map((p,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #E5E7EB"}}>
        <div style={{fontSize:12,color:"#2A2B2D",fontWeight:700}}>{p.cargo_anterior||"?"} → <span style={{color:"#8b5cf6"}}>{p.novo_cargo||"?"}</span></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#F26B25",fontWeight:700}}>{fmtDate(p.data)}</div>{p.novo_salario>0&&<div style={{fontSize:10,color:"#22A06B",fontWeight:600}}>{fmt(p.salario_anterior)} → {fmt(p.novo_salario)}</div>}</div>
      </div>))}</div>}
    <div style={S.card}><SectionTitle icon="🎓" title={`Formação (${formacao?.length||0})`} c1="#ec4899" c2="#8b5cf6"
      action={<button onClick={()=>{setShowAddModal("formacao");setAddForm({institution:"",course:"",degree:"",start_date:"",end_date:"",status:"Concluído"});}} style={S.smallBtn}>+ Adicionar</button>}/>
      {formacao?.map((f,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #E5E7EB"}}>
        <div><div style={{fontSize:13,color:"#2A2B2D",fontWeight:800}}>{f.curso}</div><div style={{fontSize:11,color:"#636466",fontWeight:600}}>{f.instituicao} — {f.grau}</div><div style={{fontSize:10,color:"#8E9093"}}>{fmtDate(f.inicio)} a {fmtDate(f.fim)}</div></div>
        <button onClick={()=>deleteItem("formacao",f.id)} style={S.dangerBtn}>✕</button></div>))}
      {(!formacao||formacao.length===0)&&<p style={{fontSize:11,color:"#8E9093",fontWeight:600}}>Nenhuma formação</p>}
    </div>
    <div style={S.card}><SectionTitle icon="🏢" title={`Experiência (${exp?.length||0})`} c1="#f97316" c2="#F26B25"
      action={<button onClick={()=>{setShowAddModal("experiencia");setAddForm({company:"",position:"",start_date:"",end_date:"",description:""});}} style={S.smallBtn}>+ Adicionar</button>}/>
      {exp?.map((e,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #E5E7EB"}}>
        <div><div style={{fontSize:13,color:"#2A2B2D",fontWeight:800}}>{e.cargo}</div><div style={{fontSize:11,color:"#636466",fontWeight:600}}>{e.empresa}</div><div style={{fontSize:10,color:"#8E9093"}}>{fmtDate(e.inicio)} a {fmtDate(e.fim)}</div></div>
        <button onClick={()=>deleteItem("experiencia",e.id)} style={S.dangerBtn}>✕</button></div>))}
      {(!exp||exp.length===0)&&<p style={{fontSize:11,color:"#8E9093",fontWeight:600}}>Nenhuma experiência</p>}
    </div>
  </div>);

  // ====== TAB: FINANCEIRO ======
  const renderFinanceiro=()=>{const maxSal=Math.max(...(evoSal||[]).map(x=>x.salario),1);return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {salMetrics&&Object.keys(salMetrics).length>0&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12}}>
      {[{l:"Salário Atual",v:fmt(salMetrics.salario_atual),c:"#22A06B"},{l:"Inicial",v:fmt(salMetrics.salario_inicial),c:"#1A73E8"},{l:"Crescimento",v:`${salMetrics.crescimento_total_pct}%`,c:"#F26B25"},
        {l:"Média Anual",v:`${salMetrics.media_crescimento_anual_pct}%/a`,c:"#8b5cf6"},{l:"Reajustes",v:salMetrics.total_reajustes,c:"#f97316"},{l:"Último",v:fmtDate(salMetrics.ultimo_reajuste),c:"#06b6d4"}
      ].map((c,i)=>(<div key={i} style={{...S.infoBox,border:`1px solid ${c.c}44`,background:"#FFFFFF"}}><div style={S.lbl}>{c.l}</div><div style={{fontSize:18,fontWeight:800,color:c.c,marginTop:4}}>{c.v}</div></div>))}</div>)}
    {evoSal?.length>0&&(<div style={S.card}><SectionTitle icon="📈" title="Evolução Salarial" c1="#22A06B" c2="#F26B25"
      action={<button onClick={()=>{setShowAddModal("salario");setAddForm({salario:"",tipo:"reajuste",motivo:"",data_inicio:""});}} style={S.smallBtn}>+ Reajuste</button>}/>
      <SalaryLineChart data={evoSal} height={280}/>
      {/* Legenda */}
      <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:12}}>
        {[{c:"#1A73E8",l:"Admissão"},{c:"#8b5cf6",l:"Promoção"},{c:"#22A06B",l:"Reajuste"}].map((x,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:"50%",background:x.c}}/><span style={{fontSize:10,color:"#636466",fontWeight:700}}>{x.l}</span></div>
        ))}
      </div>
    </div>)}
    {folha?.length>0&&(<div style={S.card}><SectionTitle icon="📋" title="Folha de Pagamento" c1="#f97316" c2="#D93025"/>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Comp.","Base","H.Extra","INSS","IRRF","FGTS","Líquido"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{folha.map((f,i)=>(<tr key={i}><td style={{...S.td,fontWeight:800,color:"#F26B25"}}>{f.competencia}</td><td style={S.td}>{fmt(f.salario_base)}</td>
          <td style={{...S.td,fontWeight:600,color:f.horas_extras>0?"#22A06B":"#8E9093"}}>{fmt(f.horas_extras)}</td><td style={S.td}>{fmt(f.inss)}</td><td style={S.td}>{fmt(f.irrf)}</td>
          <td style={S.td}>{fmt(f.fgts)}</td><td style={{...S.td,fontWeight:800,color:"#22A06B"}}>{fmt(f.salario_liquido)}</td></tr>))}</tbody></table></div></div>)}
  </div>);};

  // ====== TABS RESTANTES ======
  const renderPonto=()=>(<div style={S.card}><SectionTitle icon="⏰" title="Ponto (Último Mês)" c1="#06b6d4" c2="#1A73E8"/>
    {ponto?.length>0?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Data","Entrada","Saída","Horas","H.Extra","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{ponto.map((p,i)=>(<tr key={i}><td style={{...S.td,fontWeight:700}}>{fmtDate(p.data)}</td><td style={S.td}>{p.entrada||"—"}</td><td style={S.td}>{p.saida||"—"}</td>
        <td style={{...S.td,fontWeight:600}}>{p.horas_trabalhadas}h</td><td style={{...S.td,fontWeight:700,color:p.horas_extras>0?"#22A06B":"#8E9093"}}>{p.horas_extras}h</td>
        <td style={S.td}><span style={{padding:"3px 8px",borderRadius:4,fontSize:9,fontWeight:800,textTransform:"uppercase",background:p.status==="Presente"?"rgba(34, 160, 107, 0.1)":"rgba(217, 48, 37, 0.1)",color:p.status==="Presente"?"#22A06B":"#D93025"}}>{p.status}</span></td></tr>))}</tbody></table></div>
    :<p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:30,fontWeight:600}}>Sem registros</p>}</div>);

  const renderFerias=()=>(<div style={S.card}><SectionTitle icon="🏖️" title="Férias" c1="#06b6d4" c2="#22A06B"/>
    {ferias?.length>0?ferias.map((f,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #E5E7EB"}}>
      <div><div style={{fontSize:13,color:"#2A2B2D",fontWeight:800}}>{f.dias} dias</div><div style={{fontSize:11,color:"#636466",fontWeight:600}}>{fmtDate(f.data_inicio)} a {fmtDate(f.data_fim)}</div></div>
      <span style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:800,textTransform:"uppercase",background:f.status?.toLowerCase().includes("goz")?"rgba(34, 160, 107, 0.1)":"rgba(26, 115, 232, 0.1)",color:f.status?.toLowerCase().includes("goz")?"#22A06B":"#1A73E8"}}>{f.status}</span>
    </div>)):<p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:30,fontWeight:600}}>Sem registros</p>}</div>);

  const renderDesempenho=()=>(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {desempenho?.length>0?desempenho.map((d,i)=>(<div key={i} style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><div style={{fontSize:15,color:"#2A2B2D",fontWeight:800}}>Avaliação — {d.periodo}</div><div style={{fontSize:11,color:"#636466",fontWeight:600}}>{fmtDate(d.data)} {d.avaliador?`• ${d.avaliador}`:""}</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,lineHeight:1,color:d.nota_geral>=8?"#22A06B":d.nota_geral>=6?"#F26B25":"#D93025"}}>{d.nota_geral}</div><div style={{fontSize:9,color:"#8E9093",fontWeight:800}}>NOTA</div></div></div>
      <div style={{height:8,background:"#F5F6F8",borderRadius:4,marginBottom:14}}><div style={{height:"100%",width:`${Math.min(d.nota_geral*10,100)}%`,borderRadius:4,background:d.nota_geral>=8?"#22A06B":d.nota_geral>=6?"#F26B25":"#D93025"}}/></div>
      {d.feedback&&<div style={{fontSize:12,color:"#3D3E40",padding:"12px 14px",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontWeight:500,lineHeight:1.4}}>{d.feedback}</div>}
    </div>)):<div style={S.card}><p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:20,fontWeight:600}}>Nenhuma avaliação</p></div>}</div>);

  const renderTreinamentos=()=>(<div style={S.card}><SectionTitle icon="📚" title={`Treinamentos (${treinamentos?.length||0})`} c1="#1A73E8" c2="#8b5cf6"/>
    {treinamentos?.length>0?treinamentos.map((t,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #E5E7EB"}}>
      <div><div style={{fontSize:13,color:"#2A2B2D",fontWeight:800}}>{t.nome}</div></div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>{t.nota&&<span style={{fontSize:14,fontWeight:800,color:"#22A06B"}}>{t.nota}</span>}
        <span style={{padding:"3px 8px",borderRadius:4,fontSize:9,fontWeight:800,textTransform:"uppercase",background:t.status?.toLowerCase().includes("conclu")?"rgba(34, 160, 107, 0.1)":"rgba(242, 107, 37, 0.1)",color:t.status?.toLowerCase().includes("conclu")?"#22A06B":"#F26B25"}}>{t.status}</span></div>
    </div>)):<p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:30,fontWeight:600}}>Sem treinamentos</p>}</div>);

  const renderDocumentos=()=>{
    const handleUpload=async(e)=>{
      const file=e.target.files?.[0]; if(!file)return;
      const formData=new FormData();
      formData.append("file",file);
      formData.append("document_type",docType);
      formData.append("empresa_id",String(empresaId));
      setUploading(true);
      try{
        await api.post(`/rh-dossier/employees/${employeeId}/documents/upload`,formData,{headers:{"Content-Type":"multipart/form-data"}});
        showToast?.(`"${file.name}" enviado!`,"success"); loadDossier();
      }catch(err){showToast?.(err.response?.data?.detail||"Erro no upload","error");}
      finally{setUploading(false);if(fileRef.current)fileRef.current.value="";}
    };

    const handleDelete=async(docId,nome)=>{
      if(!window.confirm(`Remover "${nome||"documento"}"?`))return;
      try{await api.delete(`/rh-dossier/documents/${docId}`);showToast?.("Documento removido","success");loadDossier();}
      catch(err){showToast?.(err.response?.data?.detail||"Erro","error");}
    };

    return(<div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* UPLOAD */}
      <div style={{...S.card,borderColor:"rgba(26, 115, 232, 0.2)",background:"rgba(26, 115, 232, 0.02)"}}>
        <SectionTitle icon="📤" title="Upload de Documento" c1="#1A73E8" c2="#8b5cf6"/>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div><label style={S.inputLbl}>Tipo do Documento</label>
            <select style={{...S.input,width:200}} value={docType} onChange={e=>setDocType(e.target.value)}>
              <option value="Geral">Geral</option><option value="RG">RG</option><option value="CPF">CPF</option>
              <option value="CTPS">CTPS</option><option value="CNH">CNH</option><option value="Comprovante de Residência">Comprovante de Residência</option>
              <option value="Certidão Nascimento">Certidão Nascimento</option><option value="Certidão Casamento">Certidão Casamento</option>
              <option value="Diploma">Diploma</option><option value="Certificado">Certificado</option>
              <option value="Contrato">Contrato de Trabalho</option><option value="Atestado Médico">Atestado Médico</option>
              <option value="ASO">ASO</option><option value="Outro">Outro</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={S.inputLbl}>Arquivo (PDF, imagem, DOC — máx 10MB)</label>
            <input ref={fileRef} type="file" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
              style={{...S.input,padding:"7px 12px",cursor:"pointer",background:"#FFFFFF"}} disabled={uploading}/>
          </div>
          {uploading&&<span style={{fontSize:11,color:"#F26B25",fontWeight:700}}>Enviando...</span>}
        </div>
      </div>

      {/* LISTA DE DOCUMENTOS */}
      <div style={S.card}>
        <SectionTitle icon="📄" title={`Documentos (${documentos?.length||0})`} c1="#f97316" c2="#D93025"/>
        {documentos?.length>0?documentos.map((d,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #E5E7EB"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(26, 115, 232, 0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,border:"1px solid rgba(26, 115, 232, 0.15)"}}>
                {d.tipo?.includes("PDF")||d.nome_arquivo?.endsWith(".pdf")?"📕":d.tipo?.includes("Cert")||d.tipo?.includes("Diploma")?"🎓":d.tipo?.includes("Atestado")||d.tipo?.includes("ASO")?"🏥":"📄"}
              </div>
              <div>
                <div style={{fontSize:13,color:"#2A2B2D",fontWeight:800}}>{d.nome_arquivo||"Sem nome"}</div>
                <div style={{fontSize:11,color:"#636466",fontWeight:600}}>{d.tipo} • {fmtDate(d.data_upload)}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {d.url&&<a href={d.url} target="_blank" rel="noopener noreferrer" style={{...S.smallBtn,color:"#1A73E8",borderColor:"rgba(26, 115, 232, 0.3)",textDecoration:"none"}}>⬇ Baixar</a>}
              <button onClick={()=>handleDelete(d.id,d.nome_arquivo)} style={S.dangerBtn}>✕</button>
            </div>
          </div>
        )):<p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:30,fontWeight:600}}>Nenhum documento enviado</p>}
      </div>
    </div>);
  };

  const renderTimeline=()=>(<div style={S.card}><SectionTitle icon="📅" title="Timeline" c1="#8b5cf6" c2="#ec4899"/>
    {timeline?.length>0?(<div style={{position:"relative",paddingLeft:30,marginTop:10}}>
      <div style={{position:"absolute",left:11,top:0,bottom:0,width:2,background:"#E5E7EB"}}/>
      {timeline.map((t,i)=>{const color=TL_COLORS[t.tipo]||"#8E9093";const icon=TL_ICONS[t.tipo]||"📌";return(
        <div key={i} style={{position:"relative",paddingBottom:20}}>
          <div style={{position:"absolute",left:-25,top:4,width:14,height:14,borderRadius:"50%",background:color,border:"2px solid #FFFFFF",boxShadow:"0 0 0 1px #E5E7EB",zIndex:1}}/>
          <div style={{background:"#F9FAFB",borderRadius:10,padding:"12px 16px",borderLeft:`4px solid ${color}`,borderTop:"1px solid #E5E7EB",borderRight:"1px solid #E5E7EB",borderBottom:"1px solid #E5E7EB",boxShadow:"0 2px 6px rgba(0,0,0,0.02)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:800,color:"#2A2B2D"}}>{icon} {t.titulo}</span>
              <span style={{fontSize:10,color:"#8E9093",fontWeight:700}}>{fmtDate(t.data)}</span></div>
            {t.descricao&&<div style={{fontSize:12,color:"#636466",lineHeight:1.4}}>{t.descricao}</div>}
          </div></div>);})}
    </div>):<p style={{color:"#8E9093",fontSize:12,textAlign:"center",padding:30,fontWeight:600}}>Nenhum evento</p>}</div>);

  const renderInsights=()=>(<div style={{display:"flex",flexDirection:"column",gap:20}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
      {[{l:"Tempo Empresa",v:insights.tempo_empresa_formatado,i:"⏱️",c:"#1A73E8"},{l:"Salário",v:fmt(insights.salario_atual),i:"💰",c:"#22A06B"},
        {l:"Média Desempenho",v:insights.media_desempenho||"N/A",i:"📊",c:"#F26B25"},{l:"Treinamentos",v:`${insights.treinamentos_concluidos}/${insights.total_treinamentos}`,i:"📚",c:"#8b5cf6"},
        {l:"Promoções",v:insights.total_promocoes,i:"⬆️",c:"#f97316"},{l:"Dependentes",v:insights.total_dependentes,i:"👨‍👩‍👧",c:"#06b6d4"},
      ].map((c,i)=>(<div key={i} style={{...S.infoBox,border:`1px solid ${c.c}33`,background:"#FFFFFF",boxShadow:"0 2px 8px rgba(0,0,0,0.02)"}}><div style={{fontSize:18,marginBottom:4}}>{c.i}</div><div style={S.lbl}>{c.l}</div><div style={{fontSize:20,fontWeight:800,color:c.c,marginTop:4}}>{c.v}</div></div>))}
    </div>
    <div style={S.card}><SectionTitle icon="⏰" title="Frequência (Último Mês)" c1="#06b6d4" c2="#1A73E8"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[{l:"Faltas",v:insights.faltas_ultimo_mes,c:insights.faltas_ultimo_mes>0?"#D93025":"#22A06B"},
          {l:"Atrasos",v:insights.atrasos_ultimo_mes,c:insights.atrasos_ultimo_mes>0?"#F26B25":"#22A06B"},
          {l:"Horas Extras",v:`${insights.horas_extras_ultimo_mes}h`,c:"#1A73E8"}
        ].map((c,i)=>(<div key={i} style={{...S.infoBox,textAlign:"center",background:"#FFFFFF",border:"1px solid #E5E7EB"}}><div style={S.lbl}>{c.l}</div><div style={{fontSize:24,fontWeight:800,color:c.c,marginTop:4}}>{c.v}</div></div>))}
      </div>
    </div>
    {insights.evolucao_salarial&&Object.keys(insights.evolucao_salarial).length>0&&(<div style={S.card}><SectionTitle icon="📈" title="Evolução Salarial" c1="#22A06B" c2="#F26B25"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[{l:"Crescimento",v:`${insights.evolucao_salarial.crescimento_total_pct}%`,c:"#22A06B"},{l:"Média Anual",v:`${insights.evolucao_salarial.media_crescimento_anual_pct}%`,c:"#F26B25"},{l:"Reajustes",v:insights.evolucao_salarial.total_reajustes,c:"#8b5cf6"}
        ].map((c,i)=>(<div key={i} style={{...S.infoBox,textAlign:"center",background:"#FFFFFF",border:"1px solid #E5E7EB"}}><div style={S.lbl}>{c.l}</div><div style={{fontSize:22,fontWeight:800,color:c.c,marginTop:4}}>{c.v}</div></div>))}
      </div></div>)}
    <div style={{...S.card,borderColor:"rgba(34, 160, 107, 0.4)",background:"rgba(34, 160, 107, 0.03)"}}><div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>🛡️</span>
      <div><div style={{fontSize:14,fontWeight:800,color:"#2A2B2D"}}>Risco de Saída</div><div style={{fontSize:13,color:"#22A06B",fontWeight:800,textTransform:"uppercase"}}>{insights.risco_saida}</div></div></div></div>
  </div>);

  // ====== RENDER PRINCIPAL ======
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,background:"#FFFFFF",padding:"16px 20px",borderRadius:16,border:"1px solid #E5E7EB",boxShadow:"0 4px 12px rgba(0,0,0,0.02)"}}>
      <button onClick={onBack} style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:10,padding:"8px 14px",fontSize:12,color:"#636466",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>← Voltar</button>
      <div style={{width:56,height:56,borderRadius:14,background:"rgba(242, 107, 37, 0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:"2px solid rgba(242, 107, 37, 0.3)",color:"#F26B25",fontWeight:800}}>{dp.nome?.charAt(0)||"?"}</div>
      <div><h2 style={{color:"#2A2B2D",margin:0,fontSize:20,fontWeight:800}}>{dp.nome}</h2>
        <div style={{fontSize:12,color:"#636466",fontWeight:600}}>{prof.cargo} • {prof.departamento} • <span style={{color:prof.status==="Ativo"?"#22A06B":"#D93025"}}>{prof.status}</span>
          {insights.tempo_empresa_formatado&&<span style={{marginLeft:8,color:"#8E9093"}}>({insights.tempo_empresa_formatado})</span>}</div></div>
      <div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:"#22A06B"}}>{fmt(prof.salario_atual)}</div><div style={{fontSize:10,color:"#8E9093",fontWeight:700,textTransform:"uppercase"}}>Salário atual</div></div>
    </div>
    
    <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap",paddingBottom:12,borderBottom:"1px solid #E5E7EB"}}>
      {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={S.tabBtn(tab===t.key)}><span style={{marginRight:6}}>{t.icon}</span>{t.label}</button>))}
    </div>
    
    {tab==="dashboard"&&renderDashboard()}
    {tab==="geral"&&renderGeral()}
    {tab==="profissional"&&renderProfissional()}
    {tab==="financeiro"&&renderFinanceiro()}
    {tab==="ponto"&&renderPonto()}
    {tab==="ferias"&&renderFerias()}
    {tab==="desempenho"&&renderDesempenho()}
    {tab==="treinamentos"&&renderTreinamentos()}
    {tab==="documentos"&&renderDocumentos()}
    {tab==="timeline"&&renderTimeline()}
    {tab==="insights"&&renderInsights()}
    {renderAddModal()}
  </div>);
}