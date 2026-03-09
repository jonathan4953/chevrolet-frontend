import React, { useState, useEffect } from "react";
import { api } from "../../api";
import AdminRelatorios from "./AdminRelatorios";
import ExecutarRelatorio from "./ExecutarRelatorio";

export default function Relatorios({ styles, currentUser, showToast }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("lista"); // "lista" | "admin" | "executar"
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "gestor";

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatorios");
      const todos = Array.isArray(res.data) ? res.data : [];
      // Filtra por perfil permitido
      const permitidos = isAdmin ? todos : todos.filter(r => {
        if (!r.perfis_permitidos || r.perfis_permitidos.length === 0) return true;
        return r.perfis_permitidos.includes(currentUser?.role);
      });
      setRelatorios(permitidos);
    } catch (e) {
      console.error("Erro ao carregar relatórios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRelatorios(); }, []);

  if (viewMode === "admin" && isAdmin) {
    return <AdminRelatorios styles={styles} currentUser={currentUser} showToast={showToast} onBack={() => { setViewMode("lista"); loadRelatorios(); }} />;
  }

  if (viewMode === "executar" && selectedRelatorio) {
    return <ExecutarRelatorio styles={styles} relatorio={selectedRelatorio} showToast={showToast} onBack={() => { setViewMode("lista"); setSelectedRelatorio(null); }} />;
  }

  // === LISTA DE RELATÓRIOS ===
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 5, height: 36, borderRadius: 3, background: "linear-gradient(to bottom, #8b5cf6, #6366f1)" }} />
          <div>
            <h2 style={{ ...styles.cardTitle, margin: 0 }}>Relatórios</h2>
            <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>
              {relatorios.length} relatório(s) disponível(is)
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadRelatorios} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            🔄 Atualizar
          </button>
          {isAdmin && (
            <button onClick={() => setViewMode("admin")} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
              ⚙️ Administrar Relatórios
            </button>
          )}
        </div>
      </div>

      {/* Grid de Relatórios */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⌛ Carregando relatórios...</div>
      ) : relatorios.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569", background: "rgba(15,23,42,0.7)", borderRadius: 16 }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📋</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Nenhum relatório disponível</p>
          {isAdmin && <p style={{ fontSize: 12, marginTop: 8 }}>Clique em "Administrar Relatórios" para criar o primeiro.</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {relatorios.map(r => (
            <div key={r.id} style={{
              background: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(139,92,246,0.15)", borderRadius: 16,
              padding: "22px 24px", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
              onClick={() => { setSelectedRelatorio(r); setViewMode("executar"); }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
                <span style={{
                  background: r.tipo_saida === "tabela" ? "rgba(59,130,246,0.15)" : r.tipo_saida === "grafico" ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.15)",
                  color: r.tipo_saida === "tabela" ? "#60a5fa" : r.tipo_saida === "grafico" ? "#34d399" : "#fbbf24",
                  padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                }}>
                  {r.tipo_saida || "tabela"}
                </span>
              </div>
              <h3 style={{ color: "#f1f5f9", fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>{r.nome}</h3>
              <p style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5, margin: 0, minHeight: 32 }}>{r.descricao || "Sem descrição"}</p>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#475569" }}>{r.parametros?.length || 0} parâmetro(s)</span>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>Executar →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}