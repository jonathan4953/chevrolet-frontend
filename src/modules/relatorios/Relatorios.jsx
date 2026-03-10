import React, { useState, useEffect } from "react";
import { api } from "../../api";
import AdminRelatorios from "./AdminRelatorios";
import ExecutarRelatorio from "./ExecutarRelatorio";

export default function Relatorios({ styles, currentUser, showToast }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("lista");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  const [buscaRelatorio, setBuscaRelatorio] = useState("");
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "gestor";

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatorios");
      const todos = Array.isArray(res.data) ? res.data : [];
      const permitidos = isAdmin ? todos : todos.filter(r => {
        if (!r.perfis_permitidos || r.perfis_permitidos.length === 0) return true;
        return r.perfis_permitidos.includes(currentUser?.role);
      });
      setRelatorios(permitidos);
    } catch (e) { console.error("Erro ao carregar relatórios:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRelatorios(); }, []);

  const filtrados = buscaRelatorio.trim()
    ? relatorios.filter(r =>
        (r.nome || "").toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
        (r.codigo_ref || "").toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
        (r.descricao || "").toLowerCase().includes(buscaRelatorio.toLowerCase())
      )
    : relatorios;

  if (viewMode === "admin" && isAdmin) {
    return <AdminRelatorios styles={styles} currentUser={currentUser} showToast={showToast} onBack={() => { setViewMode("lista"); loadRelatorios(); }} />;
  }
  if (viewMode === "executar" && selectedRelatorio) {
    return <ExecutarRelatorio styles={styles} relatorio={selectedRelatorio} showToast={showToast} onBack={() => { setViewMode("lista"); setSelectedRelatorio(null); }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 5, height: 36, borderRadius: 3, background: "linear-gradient(to bottom, #8b5cf6, #6366f1)" }} />
          <div>
            <h2 style={{ ...styles.cardTitle, margin: 0 }}>Relatórios</h2>
            <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>{filtrados.length} de {relatorios.length} relatório(s)</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...styles.inputSmall, width: 260, borderColor: "rgba(139,92,246,0.3)" }} placeholder="🔍 Buscar por nome ou código..." value={buscaRelatorio} onChange={e => setBuscaRelatorio(e.target.value)} />
          <button onClick={loadRelatorios} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🔄 Atualizar</button>
          {isAdmin && (<button onClick={() => setViewMode("admin")} style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>⚙️ Administrar</button>)}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⌛ Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569", background: "rgba(15,23,42,0.7)", borderRadius: 16 }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📋</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{buscaRelatorio ? "Nenhum relatório encontrado." : "Nenhum relatório disponível."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtrados.map(r => (
            <div key={r.id} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 16, padding: "22px 24px", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => { setSelectedRelatorio(r); setViewMode("executar"); }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#8b5cf6", fontWeight: 700, background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: 6 }}>{r.codigo_ref || `REL-${String(r.id).padStart(4, "0")}`}</span>
                </div>
                <span style={{ background: r.tipo_saida === "tabela" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)", color: r.tipo_saida === "tabela" ? "#60a5fa" : "#34d399", padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{r.tipo_saida || "tabela"}</span>
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