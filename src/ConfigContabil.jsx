import React, { useState, useEffect } from "react";
import { api } from "./api";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

export default function ConfigContabil({ styles, showToast }) {
  const [planosContas, setPlanosContas] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  
  const [novoPlano, setNovoPlano] = useState({ codigo_contabil: "", nome: "", tipo: "DESPESA" });
  const [editPlano, setEditPlano] = useState(null);
  
  const [novoCentro, setNovoCentro] = useState({ nome: "" });
  const [editCentro, setEditCentro] = useState(null);

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

  const cardStyle = {
    background: "#FFFFFF",
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
  };

  const inputGroupStyle = {
    background: C.bgAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "16px",
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: 20,
    flexWrap: "wrap"
  };

  const inputLabelStyle = {
    fontSize: "10px",
    color: C.muted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
    display: "block"
  };

  const baseInputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: `1px solid #D4D5D6`,
    fontSize: "13px",
    outline: "none",
    background: "#FFF"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER PRINCIPAL */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 5, height: 38, borderRadius: 3, background: `linear-gradient(to bottom, ${C.primary}, #FFB088)` }} />
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", color: C.text, fontWeight: 900 }}>Configuração Contábil</h2>
          <p style={{ color: C.muted, fontSize: "13px", margin: "2px 0 0", fontWeight: 600 }}>Estrutura de Plano de Contas e Centros de Custo para classificação financeira.</p>
        </div>
      </div>

      {/* === PLANO DE CONTAS === */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 900, margin: 0 }}>Plano de Contas (Categorias DRE)</h3>
        </div>

        <form onSubmit={handleSavePlano} style={inputGroupStyle}>
          <div style={{ flex: "0 0 120px" }}>
            <label style={inputLabelStyle}>Código</label>
            <input 
              style={baseInputStyle} 
              placeholder="3.1.01" 
              value={editPlano ? editPlano.codigo_contabil : novoPlano.codigo_contabil} 
              onChange={e => editPlano ? setEditPlano({...editPlano, codigo_contabil: e.target.value}) : setNovoPlano({...novoPlano, codigo_contabil: e.target.value})} 
            />
          </div>
          <div style={{ flex: "1 1 250px" }}>
            <label style={inputLabelStyle}>Nome da Conta *</label>
            <input 
              style={baseInputStyle} 
              placeholder="Ex: Receita de Locação" 
              required 
              value={editPlano ? editPlano.nome : novoPlano.nome} 
              onChange={e => editPlano ? setEditPlano({...editPlano, nome: e.target.value}) : setNovoPlano({...novoPlano, nome: e.target.value})} 
            />
          </div>
          <div style={{ flex: "0 0 140px" }}>
            <label style={inputLabelStyle}>Tipo *</label>
            <select 
              style={baseInputStyle} 
              value={editPlano ? editPlano.tipo : novoPlano.tipo} 
              onChange={e => editPlano ? setEditPlano({...editPlano, tipo: e.target.value}) : setNovoPlano({...novoPlano, tipo: e.target.value})}
            >
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ background: editPlano ? C.blue : C.primary, color: "#fff", border: "none", padding: "11px 22px", borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 12px ${editPlano ? C.blue : C.primary}33` }}>
              {editPlano ? "SALVAR ALTERAÇÃO" : "ADICIONAR PLANO"}
            </button>
            {editPlano && (
              <button type="button" onClick={()=>setEditPlano(null)} style={{ background: "#FFF", color: C.subtle, border: `1px solid ${C.border}`, padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                CANCELAR
              </button>
            )}
          </div>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgAlt }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Código</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Nome</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Tipo</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {planosContas.length > 0 ? planosContas.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.bgAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", color: C.primary, fontWeight: 800 }}>{p.codigo_contabil || "-"}</td>
                  <td style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>{p.nome}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ 
                      background: p.tipo === "RECEITA" ? `${C.green}15` : `${C.red}15`, 
                      color: p.tipo === "RECEITA" ? C.green : C.red, 
                      padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 900, border: `1px solid ${p.tipo === "RECEITA" ? C.green : C.red}33` 
                    }}>{p.tipo}</span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button onClick={()=>setEditPlano({...p})} style={{ background: "none", color: C.blue, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>✏️</button>
                      <button onClick={()=>handleDeletePlano(p)} style={{ background: "none", color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: C.muted, fontWeight: 700 }}>Nenhum plano cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === CENTROS DE CUSTO === */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>🏢</span>
          <h3 style={{ color: C.text, fontSize: 16, fontWeight: 900, margin: 0 }}>Centros de Custo (Alocação)</h3>
        </div>

        <form onSubmit={handleSaveCentro} style={inputGroupStyle}>
          <div style={{ flex: "1 1 300px" }}>
            <label style={inputLabelStyle}>Nome do Centro de Custo *</label>
            <input 
              style={baseInputStyle} 
              placeholder="Ex: Administrativo, Frota, Oficina..." 
              required 
              value={editCentro ? editCentro.nome : novoCentro.nome} 
              onChange={e => editCentro ? setEditCentro({...editCentro, nome: e.target.value}) : setNovoCentro({...novoCentro, nome: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={{ background: C.blue, color: "#fff", border: "none", padding: "11px 22px", borderRadius: 10, fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 12px ${C.blue}33` }}>
              {editCentro ? "SALVAR ALTERAÇÃO" : "ADICIONAR CENTRO"}
            </button>
            {editCentro && (
              <button type="button" onClick={()=>setEditCentro(null)} style={{ background: "#FFF", color: C.subtle, border: `1px solid ${C.border}`, padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                CANCELAR
              </button>
            )}
          </div>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bgAlt }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>ID</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Nome</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {centrosCusto.length > 0 ? centrosCusto.map((cc, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: "0.2s" }} onMouseEnter={e => e.currentTarget.style.background = C.bgAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", color: C.muted, fontWeight: 700 }}>#{cc.id}</td>
                  <td style={{ padding: "14px 16px", color: C.text, fontWeight: 700 }}>{cc.nome}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button onClick={()=>setEditCentro({...cc})} style={{ background: "none", color: C.blue, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>✏️</button>
                      <button onClick={()=>handleDeleteCentro(cc)} style={{ background: "none", color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ padding: 40, textAlign: "center", color: C.muted, fontWeight: 700 }}>Nenhum centro cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DICA INFORMATIVA */}
      <div style={{ background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <p style={{ color: C.subtle, fontSize: 13, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            Use o <strong style={{ color: C.primary }}>Plano de Contas</strong> para definir categorias de Receita e Despesa. 
            Os <strong style={{ color: C.blue }}>Centros de Custo</strong> servem para identificar de qual setor ou unidade de negócio o valor se origina. 
            Estas opções estarão disponíveis em todos os lançamentos financeiros.
          </p>
        </div>
      </div>
    </div>
  );
}