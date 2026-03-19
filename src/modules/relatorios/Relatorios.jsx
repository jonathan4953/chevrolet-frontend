import React, { useState, useEffect } from "react";
import { api } from "../../api";
import AdminRelatorios from "./AdminRelatorios";
import ExecutarRelatorio from "./ExecutarRelatorio";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER DA PÁGINA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 5, height: 38, borderRadius: 3, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: C.text, fontWeight: 900 }}>Relatórios</h2>
            <p style={{ color: C.muted, fontSize: "13px", margin: "2px 0 0", fontWeight: 600 }}>{filtrados.length} de {relatorios.length} relatório(s) disponíveis</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: 'relative' }}>
            <input 
              style={{ 
                padding: "10px 16px 10px 36px", 
                borderRadius: 12, 
                border: `1px solid ${C.border}`, 
                fontSize: "13px", 
                width: 280, 
                color: C.text,
                outline: 'none'
              }} 
              placeholder="Buscar por nome ou código..." 
              value={buscaRelatorio} 
              onChange={e => setBuscaRelatorio(e.target.value)} 
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          </div>
          
          <button 
            onClick={loadRelatorios} 
            style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}
          >
            🔄 Atualizar
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setViewMode("admin")} 
              style={{ background: C.text, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: "12px", fontWeight: 800, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
            >
              ⚙️ Administrar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: C.muted, fontWeight: 600 }}>⌛ Carregando relatórios...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.subtle, background: "#F9FAFB", border: `2px dashed ${C.border}`, borderRadius: 20 }}>
          <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>📋</span>
          <p style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{buscaRelatorio ? "Nenhum relatório encontrado para sua busca." : "Nenhum relatório disponível para seu perfil."}</p>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>Tente outro termo ou entre em contato com o administrador.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {filtrados.map(r => (
            <div key={r.id} 
              style={{ 
                background: "#FFFFFF", 
                border: `1px solid ${C.border}`, 
                borderRadius: 20, 
                padding: "24px", 
                cursor: "pointer", 
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              onClick={() => { setSelectedRelatorio(r); setViewMode("executar"); }}
              onMouseEnter={e => { 
                e.currentTarget.style.borderColor = C.primary; 
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 10px 20px ${C.primary}10`;
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.borderColor = C.border; 
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
              }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
                    <span style={{ fontFamily: "monospace", fontSize: "11px", color: C.primary, fontWeight: 800, background: `${C.primary}10`, padding: "4px 10px", borderRadius: 8 }}>
                      {r.codigo_ref || `REL-${String(r.id).padStart(4, "0")}`}
                    </span>
                  </div>
                  <span style={{ 
                    background: r.tipo_saida === "grafico" ? `${C.green}15` : `${C.blue}15`, 
                    color: r.tipo_saida === "grafico" ? C.green : C.blue, 
                    padding: "4px 12px", 
                    borderRadius: 20, 
                    fontSize: "10px", 
                    fontWeight: 800, 
                    textTransform: "uppercase",
                    border: `1px solid ${r.tipo_saida === "grafico" ? C.green : C.blue}30`
                  }}>
                    {r.tipo_saida || "tabela"}
                  </span>
                </div>
                
                <h3 style={{ color: C.text, fontSize: "16px", fontWeight: 900, margin: "0 0 8px" }}>{r.nome}</h3>
                <p style={{ color: C.subtle, fontSize: "12px", lineHeight: 1.6, margin: 0, minHeight: 40, fontWeight: 600 }}>{r.descricao || "Relatório sem descrição detalhada cadastrada."}</p>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.bgAlt}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: C.muted, fontWeight: 700 }}>{r.parametros?.length || 0} parâmetro(s)</span>
                <span style={{ fontSize: "12px", color: C.primary, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                  Abrir Relatório <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}