import React, { useState, useEffect } from "react";
import { api } from "./api"; // Ajuste se seu caminho do axios for diferente

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>Configurações Contábeis</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ padding: "10px", borderRadius: "8px", background: subTab === "plano_contas" ? "#eab308" : "#333", color: "#fff", cursor: "pointer", border: "none" }} onClick={() => setSubTab("plano_contas")}>Plano de Contas</button>
        <button style={{ padding: "10px", borderRadius: "8px", background: subTab === "centros_custo" ? "#eab308" : "#333", color: "#fff", cursor: "pointer", border: "none" }} onClick={() => setSubTab("centros_custo")}>Centros de Custo</button>
      </div>

      {subTab === "plano_contas" && (
        <div style={{ background: "#242424", padding: "20px", borderRadius: "10px" }}>
          <h3>Cadastrar Plano de Contas</h3>
          <form onSubmit={salvarPlano} style={{ display: "flex", gap: "10px", alignItems: "end", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Código (Ex: 1.01)</label>
              <input style={{ padding: "8px", borderRadius: "5px" }} value={novoPlano.codigo_contabil} onChange={e => setNovoPlano({...novoPlano, codigo_contabil: e.target.value})} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Nome da Conta</label>
              <input required style={{ padding: "8px", borderRadius: "5px" }} value={novoPlano.nome} onChange={e => setNovoPlano({...novoPlano, nome: e.target.value})} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Tipo</label>
              <select style={{ padding: "8px", borderRadius: "5px" }} value={novoPlano.tipo} onChange={e => setNovoPlano({...novoPlano, tipo: e.target.value})}>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
              </select>
            </div>
            <button type="submit" style={{ padding: "8px 15px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Adicionar</button>
          </form>

          <table style={{ width: "100%", textAlign: "left", color: "#fff" }}>
            <thead><tr><th>Código</th><th>Nome</th><th>Tipo</th><th>Ações</th></tr></thead>
            <tbody>
              {planos.map(p => (
                <tr key={p.id}>
                  <td>{p.codigo_contabil}</td><td>{p.nome}</td><td>{p.tipo}</td>
                  <td><button onClick={() => excluirPlano(p.id)} style={{ padding: "5px 10px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "centros_custo" && (
        <div style={{ background: "#242424", padding: "20px", borderRadius: "10px" }}>
          <h3>Cadastrar Centro de Custo</h3>
          <form onSubmit={salvarCentro} style={{ display: "flex", gap: "10px", alignItems: "end", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Nome do Centro</label>
              <input required style={{ padding: "8px", borderRadius: "5px" }} value={novoCentro.nome} onChange={e => setNovoCentro({...novoCentro, nome: e.target.value})} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#aaa" }}>Descrição</label>
              <input style={{ padding: "8px", borderRadius: "5px", width: "300px" }} value={novoCentro.descricao} onChange={e => setNovoCentro({...novoCentro, descricao: e.target.value})} />
            </div>
            <button type="submit" style={{ padding: "8px 15px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Adicionar</button>
          </form>

          <table style={{ width: "100%", textAlign: "left", color: "#fff" }}>
            <thead><tr><th>Nome</th><th>Descrição</th><th>Ações</th></tr></thead>
            <tbody>
              {centros.map(c => (
                <tr key={c.id}>
                  <td>{c.nome}</td><td>{c.descricao}</td>
                  <td><button onClick={() => excluirCentro(c.id)} style={{ padding: "5px 10px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}