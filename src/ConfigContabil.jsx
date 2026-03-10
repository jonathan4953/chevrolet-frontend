import React, { useState, useEffect } from "react";
import { api } from "./api"; // Ajuste o caminho da sua API se necessário

export default function ConfigContabil({ styles, showToast }) {
  // === ESTADOS DA TELA ===
  const [planosContas, setPlanosContas] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  
  const [novoPlano, setNovoPlano] = useState({ codigo_contabil: "", nome: "", tipo: "DESPESA" });
  const [editPlano, setEditPlano] = useState(null);
  
  const [novoCentro, setNovoCentro] = useState({ nome: "" });
  const [editCentro, setEditCentro] = useState(null);

  // === CARREGAR DADOS ===
  const loadEstruturaContabil = async () => {
    try {
      const resPlanos = await api.get("/financeiro/plano-contas");
      setPlanosContas(Array.isArray(resPlanos.data) ? resPlanos.data : []);
      
      const resCentros = await api.get("/financeiro/centros-custo");
      setCentrosCusto(Array.isArray(resCentros.data) ? resCentros.data : []);
    } catch (err) {
      console.error("Erro ao carregar estrutura contábil", err);
    }
  };

  useEffect(() => {
    loadEstruturaContabil();
  }, []);

  // === FUNÇÕES DE PLANO DE CONTAS ===
  const handleSavePlano = async (e) => {
    e.preventDefault();
    try {
      if (editPlano) {
        await api.put(`/financeiro/plano-contas/${editPlano.id}`, { 
          codigo_contabil: editPlano.codigo_contabil, 
          nome: editPlano.nome, 
          tipo: editPlano.tipo 
        });
        showToast("Plano atualizado!", "success"); 
        setEditPlano(null);
      } else {
        if (!novoPlano.nome.trim()) return showToast("Informe o nome.", "error");
        await api.post("/financeiro/plano-contas", novoPlano);
        showToast("Plano criado!", "success"); 
        setNovoPlano({ codigo_contabil: "", nome: "", tipo: "DESPESA" });
      }
      loadEstruturaContabil();
    } catch(err) { 
      showToast(err?.response?.data?.detail || "Erro.", "error"); 
    }
  };

  const handleDeletePlano = async (p) => {
    if (!window.confirm(`Deseja excluir "${p.nome}"?`)) return;
    try { 
      await api.delete(`/financeiro/plano-contas/${p.id}`); 
      showToast("Plano Excluído!", "success"); 
      loadEstruturaContabil(); 
    } catch(err) { 
      showToast(err?.response?.data?.detail || "Erro.", "error"); 
    }
  };

  // === FUNÇÕES DE CENTRO DE CUSTO ===
  const handleSaveCentro = async (e) => {
    e.preventDefault();
    try {
      if (editCentro) {
        await api.put(`/financeiro/centros-custo/${editCentro.id}`, { nome: editCentro.nome });
        showToast("Centro atualizado!", "success"); 
        setEditCentro(null);
      } else {
        if (!novoCentro.nome.trim()) return showToast("Informe o nome.", "error");
        await api.post("/financeiro/centros-custo", novoCentro);
        showToast("Centro criado!", "success"); 
        setNovoCentro({ nome: "" });
      }
      loadEstruturaContabil();
    } catch(err) { 
      showToast(err?.response?.data?.detail || "Erro.", "error"); 
    }
  };

  const handleDeleteCentro = async (cc) => {
    if (!window.confirm(`Deseja excluir "${cc.nome}"?`)) return;
    try { 
      await api.delete(`/financeiro/centros-custo/${cc.id}`); 
      showToast("Excluído!", "success"); 
      loadEstruturaContabil(); 
    } catch(err) { 
      showToast(err?.response?.data?.detail || "Erro.", "error"); 
    }
  };

  // === INTERFACE (JSX) ===
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:5,height:36,borderRadius:3,background:"linear-gradient(to bottom,#f97316,#eab308)"}}/>
        <div>
          <h2 style={{...styles.cardTitle,margin:0}}>Configuração Contábil</h2>
          <p style={{color:"#64748b",fontSize:12,margin:"4px 0 0"}}>Plano de Contas e Centros de Custo para DRE, Balancete e classificação financeira.</p>
        </div>
      </div>

      {/* === PLANO DE CONTAS === */}
      <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
        <h3 style={{color:"#f97316",fontSize:15,fontWeight:800,margin:"0 0 16px"}}>📊 Plano de Contas (Categorias)</h3>
        <form onSubmit={handleSavePlano} style={{display:"flex",gap:10,alignItems:"flex-end",marginBottom:18,flexWrap:"wrap",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:16}}>
          <div style={{flex:"0 0 120px"}}>
            <label style={styles.fieldLabel}>Código</label>
            <input style={styles.inputSmall} placeholder="3.1.01" value={editPlano ? editPlano.codigo_contabil : novoPlano.codigo_contabil} onChange={e => editPlano ? setEditPlano({...editPlano, codigo_contabil: e.target.value}) : setNovoPlano({...novoPlano, codigo_contabil: e.target.value})} />
          </div>
          <div style={{flex:"1 1 200px"}}>
            <label style={styles.fieldLabel}>Nome da Conta *</label>
            <input style={styles.inputSmall} placeholder="Ex: Receita de Locação" required value={editPlano ? editPlano.nome : novoPlano.nome} onChange={e => editPlano ? setEditPlano({...editPlano, nome: e.target.value}) : setNovoPlano({...novoPlano, nome: e.target.value})} />
          </div>
          <div style={{flex:"0 0 140px"}}>
            <label style={styles.fieldLabel}>Tipo *</label>
            <select style={styles.inputSmall} value={editPlano ? editPlano.tipo : novoPlano.tipo} onChange={e => editPlano ? setEditPlano({...editPlano, tipo: e.target.value}) : setNovoPlano({...novoPlano, tipo: e.target.value})}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </div>
          <button type="submit" style={{background:editPlano?"linear-gradient(135deg,#3b82f6,#2563eb)":"linear-gradient(135deg,#f97316,#ea580c)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
            {editPlano ? "💾 Salvar Alteração" : "➕ Adicionar Plano"}
          </button>
          {editPlano && <button type="button" onClick={()=>setEditPlano(null)} style={{background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.1)",padding:"10px 16px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>}
        </form>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead><tr><th style={styles.thMassa}>Código</th><th style={styles.thMassa}>Nome</th><th style={styles.thMassa}>Tipo</th><th style={{...styles.thMassa,textAlign:"center"}}>Ações</th></tr></thead>
            <tbody>
              {planosContas.length > 0 ? planosContas.map((p,i)=>(
                <tr key={i} style={styles.trBody} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...styles.tdMassa,fontFamily:"monospace",color:"#eab308",fontWeight:700}}>{p.codigo_contabil || "-"}</td>
                  <td style={styles.tdMassa}>{p.nome}</td>
                  <td style={styles.tdMassa}><span style={{background:p.tipo==="RECEITA"?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",color:p.tipo==="RECEITA"?"#34d399":"#f87171",border:`1px solid ${p.tipo==="RECEITA"?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,padding:"4px 12px",borderRadius:20,fontSize:10,fontWeight:800}}>{p.tipo}</span></td>
                  <td style={{...styles.tdMassa,textAlign:"center"}}>
                    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                      <button onClick={()=>setEditPlano({...p})} style={{background:"rgba(59,130,246,0.12)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13}} title="Editar">✏️</button>
                      <button onClick={()=>handleDeletePlano(p)} style={{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13}} title="Desativar">🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={4} style={{...styles.tdMassa,textAlign:"center",color:"#475569",padding:40}}>Nenhum plano cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* === CENTROS DE CUSTO === */}
      <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24}}>
        <h3 style={{color:"#3b82f6",fontSize:15,fontWeight:800,margin:"0 0 16px"}}>🏢 Centros de Custo</h3>
        <form onSubmit={handleSaveCentro} style={{display:"flex",gap:10,alignItems:"flex-end",marginBottom:18,flexWrap:"wrap",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:16}}>
          <div style={{flex:"1 1 300px"}}>
            <label style={styles.fieldLabel}>Nome do Centro de Custo *</label>
            <input style={styles.inputSmall} placeholder="Ex: Administrativo, Frota, Vendas..." required value={editCentro ? editCentro.nome : novoCentro.nome} onChange={e => editCentro ? setEditCentro({...editCentro, nome: e.target.value}) : setNovoCentro({...novoCentro, nome: e.target.value})} />
          </div>
          <button type="submit" style={{background:editCentro?"linear-gradient(135deg,#3b82f6,#2563eb)":"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
            {editCentro ? "💾 Salvar Alteração" : "➕ Adicionar Centro"}
          </button>
          {editCentro && <button type="button" onClick={()=>setEditCentro(null)} style={{background:"rgba(255,255,255,0.06)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.1)",padding:"10px 16px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>Cancelar</button>}
        </form>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead><tr><th style={styles.thMassa}>ID</th><th style={styles.thMassa}>Nome</th><th style={{...styles.thMassa,textAlign:"center"}}>Ações</th></tr></thead>
            <tbody>
              {centrosCusto.length > 0 ? centrosCusto.map((cc,i)=>(
                <tr key={i} style={styles.trBody} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{...styles.tdMassa,fontFamily:"monospace",color:"#94a3b8"}}>{cc.id}</td>
                  <td style={styles.tdMassa}>{cc.nome}</td>
                  <td style={{...styles.tdMassa,textAlign:"center"}}>
                    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                      <button onClick={()=>setEditCentro({...cc})} style={{background:"rgba(59,130,246,0.12)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13}}>✏️</button>
                      <button onClick={()=>handleDeleteCentro(cc)} style={{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:13}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={3} style={{...styles.tdMassa,textAlign:"center",color:"#475569",padding:40}}>Nenhum centro cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:18}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <span style={{fontSize:20}}>💡</span>
          <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.6,margin:0}}>
            O <strong style={{color:"#f97316"}}>Plano de Contas</strong> classifica receitas e despesas (DRE, Balancete).
            Os <strong style={{color:"#3b82f6"}}>Centros de Custo</strong> alocam por setor/veículo/projeto.
            Ambos aparecem nos dropdowns de Contas a Pagar e Contas a Receber.
          </p>
        </div>
      </div>
    </div>
  );
}