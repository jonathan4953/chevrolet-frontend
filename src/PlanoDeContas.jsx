import React, { useState, useEffect } from "react";
import { api } from "./api";

const S = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#F26B25",
  primaryLight: "rgba(242, 107, 37, 0.1)",
  green: "#22A06B",
  red: "#D93025",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  
  card: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
  inputLbl: { fontSize: 10, color: "#8E9093", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "block" },
  input: { width: "100%", background: "#FFFFFF", border: "1px solid #D4D5D6", borderRadius: 10, padding: "10px 12px", color: "#2A2B2D", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
  primaryBtn: { background: "#F26B25", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 10px rgba(242, 107, 37, 0.2)", height: 38 },
  dangerBtn: { background: "rgba(217, 48, 37, 0.1)", border: "1px solid rgba(217, 48, 37, 0.3)", color: "#D93025", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 800, fontSize: 11 },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 10, color: "#8E9093", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" },
  td: { padding: "14px 16px", fontSize: 13, color: "#636466", borderBottom: "1px solid #E5E7EB", fontWeight: 600 },
  tab: (active) => ({ padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", border: active ? "1px solid #F26B25" : "1px solid #E5E7EB", background: active ? "#F26B25" : "#F9FAFB", color: active ? "#FFFFFF" : "#636466", transition: "all 0.2s", boxShadow: active ? "0 4px 12px rgba(242, 107, 37, 0.2)" : "none" })
};

export default function PlanoDeContas({ styles, showToast }) {
  const [subTab, setSubTab] = useState("plano_contas");
  const [planos, setPlanos] = useState([]);
  const [centros, setCentros] = useState([]);
  
  const [novoPlano, setNovoPlano] = useState({ codigo_contabil: "", nome: "", tipo: "DESPESA" });
  const [novoCentro, setNovoCentro] = useState({ nome: "", descricao: "" });

  const loadData = () => {
    api.get("/financeiro/plano-contas").then(r => setPlanos(r.data)).catch(e => console.error(e));
    api.get("/financeiro/centros-custo").then(r => setCentros(r.data)).catch(e => console.error(e));
  };

  useEffect(() => { loadData(); }, []);

  const salvarPlano = (e) => {
    e.preventDefault();
    api.post("/financeiro/plano-contas", novoPlano)
      .then(() => { showToast("Plano cadastrado com sucesso!", "success"); setNovoPlano({codigo_contabil:"", nome:"", tipo:"DESPESA"}); loadData(); })
      .catch(() => showToast("Erro ao salvar plano.", "error"));
  };

  const excluirPlano = (id) => {
    if(window.confirm("Deseja realmente excluir este plano de contas?")) {
      api.delete(`/financeiro/plano-contas/${id}`).then(() => { showToast("Excluído com sucesso!", "success"); loadData(); });
    }
  };

  const salvarCentro = (e) => {
    e.preventDefault();
    api.post("/financeiro/centros-custo", novoCentro)
      .then(() => { showToast("Centro de Custo cadastrado!", "success"); setNovoCentro({nome:"", descricao:""}); loadData(); })
      .catch(() => showToast("Erro ao salvar centro de custo.", "error"));
  };

  const excluirCentro = (id) => {
    if(window.confirm("Deseja realmente excluir este centro de custo?")) {
      api.delete(`/financeiro/centros-custo/${id}`).then(() => { showToast("Excluído com sucesso!", "success"); loadData(); });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${S.primary}, #FF9B6A)` }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: S.text }}>Configuração Contábil</h1>
          <p style={{ margin: "4px 0 0 0", color: S.muted, fontSize: 13, fontWeight: 600 }}>Plano de Contas e Centros de Custo para DRE, Balancete e classificação financeira.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, borderBottom: `1px solid ${S.border}`, paddingBottom: 16 }}>
        <button style={S.tab(subTab === "plano_contas")} onClick={() => setSubTab("plano_contas")}>Plano de Contas</button>
        <button style={S.tab(subTab === "centros_custo")} onClick={() => setSubTab("centros_custo")}>Centros de Custo</button>
      </div>

      {/* CONTEÚDO PLANO DE CONTAS */}
      {subTab === "plano_contas" && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <h3 style={{ margin: 0, color: S.text, fontWeight: 800, fontSize: 16 }}>Plano de Contas (Categorias)</h3>
          </div>
          
          {/* Formulário - Fundo totalmente branco e inputs organizados */}
          <form onSubmit={salvarPlano} style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 32 }}>
            <div style={{ flex: "1 1 150px" }}>
              <label style={S.inputLbl}>Código</label>
              <input style={S.input} value={novoPlano.codigo_contabil} onChange={e => setNovoPlano({...novoPlano, codigo_contabil: e.target.value})} placeholder="3.1.01" onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
            </div>
            <div style={{ flex: "3 1 300px" }}>
              <label style={S.inputLbl}>Nome da Conta *</label>
              <input required style={S.input} value={novoPlano.nome} onChange={e => setNovoPlano({...novoPlano, nome: e.target.value})} placeholder="Ex: Receita de Locação" onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label style={S.inputLbl}>Tipo *</label>
              <select style={S.input} value={novoPlano.tipo} onChange={e => setNovoPlano({...novoPlano, tipo: e.target.value})} onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
              </select>
            </div>
            <button type="submit" style={S.primaryBtn}>➕ Adicionar Plano</button>
          </form>

          {/* Tabela de Planos */}
          <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${S.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={S.th}>Código</th><th style={S.th}>Nome</th><th style={S.th}>Tipo</th><th style={S.th}>Ações</th></tr></thead>
              <tbody>
                {planos.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: S.muted, fontWeight: 600 }}>Nenhum plano cadastrado.</td></tr>
                ) : planos.map(p => (
                  <tr key={p.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...S.td, color: S.primary, fontWeight: 800 }}>{p.codigo_contabil}</td>
                    <td style={{ ...S.td, color: S.text, fontWeight: 700 }}>{p.nome}</td>
                    <td style={S.td}>
                      <span style={{ background: p.tipo === "RECEITA" ? "rgba(34, 160, 107, 0.1)" : "rgba(217, 48, 37, 0.1)", color: p.tipo === "RECEITA" ? S.green : S.red, padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: "uppercase", border: `1px solid ${p.tipo === "RECEITA" ? "rgba(34, 160, 107, 0.3)" : "rgba(217, 48, 37, 0.3)"}` }}>
                        {p.tipo}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button onClick={() => excluirPlano(p.id)} style={S.dangerBtn}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO CENTROS DE CUSTO */}
      {subTab === "centros_custo" && (
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>🏢</span>
            <h3 style={{ margin: 0, color: S.text, fontWeight: 800, fontSize: 16 }}>Cadastrar Centro de Custo</h3>
          </div>

          <form onSubmit={salvarCentro} style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 32 }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={S.inputLbl}>Nome do Centro *</label>
              <input required style={S.input} value={novoCentro.nome} onChange={e => setNovoCentro({...novoCentro, nome: e.target.value})} placeholder="Ex: Operacional, Matriz..." onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
            </div>
            <div style={{ flex: "2 1 300px" }}>
              <label style={S.inputLbl}>Descrição</label>
              <input style={S.input} value={novoCentro.descricao} onChange={e => setNovoCentro({...novoCentro, descricao: e.target.value})} placeholder="Opcional: Detalhes sobre a área..." onFocus={e => e.target.style.borderColor = S.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
            </div>
            <button type="submit" style={S.primaryBtn}>➕ Adicionar Centro</button>
          </form>

          <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${S.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={S.th}>Nome do Centro</th><th style={S.th}>Descrição</th><th style={S.th}>Ações</th></tr></thead>
              <tbody>
                {centros.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 40, textAlign: "center", color: S.muted, fontWeight: 600 }}>Nenhum centro de custo cadastrado.</td></tr>
                ) : centros.map(c => (
                  <tr key={c.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...S.td, color: S.text, fontWeight: 800 }}>{c.nome}</td>
                    <td style={S.td}>{c.descricao || "—"}</td>
                    <td style={S.td}>
                      <button onClick={() => excluirCentro(c.id)} style={S.dangerBtn}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}