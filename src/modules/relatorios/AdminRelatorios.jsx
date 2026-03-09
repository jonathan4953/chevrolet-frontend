import React, { useState, useEffect } from "react";
import { api } from "../../api";
import ConstrutorRelatorio from "./ConstrutorRelatorio";

export default function AdminRelatorios({ styles, currentUser, showToast, onBack }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null = lista, object = editing/creating

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatorios");
      setRelatorios(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (r) => {
    if (!window.confirm(`Excluir o relatório "${r.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/relatorios/${r.id}`);
      showToast("Relatório excluído!", "success");
      load();
    } catch (e) { showToast("Erro ao excluir.", "error"); }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/relatorios/${data.id}`, data);
        showToast("Relatório atualizado!", "success");
      } else {
        await api.post("/relatorios", data);
        showToast("Relatório criado!", "success");
      }
      setEditing(null);
      load();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Erro ao salvar relatório.", "error");
    }
  };

  if (editing !== null) {
    return <ConstrutorRelatorio styles={styles} relatorio={editing} onSave={handleSave} onCancel={() => setEditing(null)} showToast={showToast} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>← Voltar</button>
          <div>
            <h2 style={{ ...styles.cardTitle, margin: 0 }}>Administração de Relatórios</h2>
            <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>{relatorios.length} relatório(s) cadastrado(s)</p>
          </div>
        </div>
        <button onClick={() => setEditing({})} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
          ➕ Novo Relatório
        </button>
      </div>

      <div style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 0, overflow: "hidden" }}>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead>
              <tr>
                <th style={styles.thMassa}>ID</th>
                <th style={styles.thMassa}>Nome</th>
                <th style={styles.thMassa}>Descrição</th>
                <th style={styles.thMassa}>Tipo</th>
                <th style={styles.thMassa}>Parâmetros</th>
                <th style={styles.thMassa}>Perfis</th>
                <th style={{ ...styles.thMassa, textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.length > 0 ? relatorios.map(r => (
                <tr key={r.id} style={styles.trBody}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...styles.tdMassa, fontFamily: "monospace", color: "#8b5cf6", fontWeight: 700 }}>#{r.id}</td>
                  <td style={{ ...styles.tdMassa, fontWeight: 700 }}>{r.nome}</td>
                  <td style={{ ...styles.tdMassa, color: "#64748b", fontSize: 11, maxWidth: 200 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.descricao || "-"}</div>
                  </td>
                  <td style={styles.tdMassa}>
                    <span style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>{r.tipo_saida || "tabela"}</span>
                  </td>
                  <td style={{ ...styles.tdMassa, textAlign: "center" }}>{r.parametros?.length || 0}</td>
                  <td style={{ ...styles.tdMassa, fontSize: 10, color: "#64748b" }}>{(r.perfis_permitidos || []).join(", ") || "Todos"}</td>
                  <td style={{ ...styles.tdMassa, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => setEditing(r)} style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✏️</button>
                      <button onClick={() => handleDelete(r)} style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ ...styles.tdMassa, textAlign: "center", color: "#475569", padding: 50 }}>Nenhum relatório cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}