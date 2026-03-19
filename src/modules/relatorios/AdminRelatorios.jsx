import React, { useState, useEffect } from "react";
import { api } from "../../api";
import ConstrutorRelatorio from "./ConstrutorRelatorio";

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

export default function AdminRelatorios({ styles, currentUser, showToast, onBack }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); 

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER DA SEÇÃO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button 
            onClick={onBack} 
            style={{ 
              background: "#F9FAFB", 
              border: `1px solid ${C.border}`, 
              color: C.subtle, 
              borderRadius: 10, 
              padding: "8px 16px", 
              cursor: "pointer", 
              fontSize: "12px", 
              fontWeight: 800,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.border}
            onMouseLeave={e => e.currentTarget.style.background = "#F9FAFB"}
          >
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 32, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", color: C.text, fontWeight: 900 }}>Administração de Relatórios</h2>
              <p style={{ color: C.muted, fontSize: "12px", margin: "2px 0 0", fontWeight: 600 }}>{relatorios.length} relatório(s) cadastrado(s)</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setEditing({})} 
          style={{ 
            background: C.primary, 
            color: "#fff", 
            border: "none", 
            borderRadius: 10, 
            padding: "10px 22px", 
            cursor: "pointer", 
            fontSize: "12px", 
            fontWeight: 800,
            boxShadow: `0 4px 12px ${C.primary}33`,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#D95A1E"}
          onMouseLeave={e => e.currentTarget.style.background = C.primary}
        >
          ➕ Novo Relatório
        </button>
      </div>

      {/* CONTAINER DA TABELA */}
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>ID</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Nome</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Descrição</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Tipo</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Parâmetros</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Perfis</th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "10px", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.length > 0 ? relatorios.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontFamily: "monospace", color: C.primary, fontWeight: 800 }}>#{r.id}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 800, color: C.text }}>{r.nome}</td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: C.subtle, maxWidth: 250 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>{r.descricao || "-"}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30`, padding: "4px 10px", borderRadius: 20, fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                      {r.tipo_saida || "tabela"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center", fontSize: "13px", fontWeight: 800, color: C.text }}>{r.parametros?.length || 0}</td>
                  <td style={{ padding: "14px 16px", fontSize: "11px", color: C.muted, fontWeight: 700 }}>{(r.perfis_permitidos || []).join(", ") || "Todos"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button 
                        onClick={() => setEditing(r)} 
                        style={{ background: "#F9FAFB", color: C.blue, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${C.blue}10`; e.currentTarget.style.borderColor = C.blue; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = C.border; }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(r)} 
                        style={{ background: "#F9FAFB", color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${C.red}10`; e.currentTarget.style.borderColor = C.red; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = C.border; }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ padding: "60px 0", textAlign: "center", color: C.muted, fontSize: "14px", fontWeight: 700 }}>
                    Nenhum relatório cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}