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
  bgAlt: "#F9FAFB",
  hover: "#F3F4F6"
};

export default function Relatorios({ styles, currentUser, showToast }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("lista");
  const [selectedRelatorio, setSelectedRelatorio] = useState(null);
  
  // Filtros da barra lateral
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [somenteMeuPerfil, setSomenteMeuPerfil] = useState(true);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "gestor";

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatorios");
      const todos = Array.isArray(res.data) ? res.data : [];
      
      // REGRA DE SEGURANÇA: Filtra pelo perfil de acesso
      const permitidos = isAdmin ? todos : todos.filter(r => {
        if (!r.perfis_permitidos || r.perfis_permitidos.length === 0) return true;
        return r.perfis_permitidos.includes(currentUser?.role);
      });
      
      setRelatorios(permitidos);
    } catch (e) { 
      console.error("Erro ao carregar relatórios:", e); 
      showToast("Erro ao carregar relatórios", "error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadRelatorios(); }, []);

  // Aplicação dos filtros visuais da barra lateral
  const filtrados = relatorios.filter(r => {
    const matchCodigo = filtroCodigo ? (r.codigo_ref || String(r.id)).toLowerCase().includes(filtroCodigo.toLowerCase()) : true;
    const matchTitulo = filtroTitulo ? (r.nome || "").toLowerCase().includes(filtroTitulo.toLowerCase()) : true;
    
    // Simulação do checkbox "Relatórios do perfil ativo" (já é o padrão de segurança, mas útil para admin ver a diferença)
    const matchPerfil = somenteMeuPerfil && isAdmin ? 
      (!r.perfis_permitidos?.length || r.perfis_permitidos.includes(currentUser?.role)) : true;

    return matchCodigo && matchTitulo && matchPerfil;
  });

  // Agrupamento simulando pastas/categorias (Como no Tasy)
  const relatoriosAgrupados = filtrados.reduce((acc, r) => {
    const categoria = r.categoria || "Gerais / Sem Categoria"; // Ideal adicionar 'categoria' no Construtor depois
    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(r);
    return acc;
  }, {});

  if (viewMode === "admin" && isAdmin) {
    return <AdminRelatorios styles={styles} currentUser={currentUser} showToast={showToast} onBack={() => { setViewMode("lista"); loadRelatorios(); }} />;
  }
  if (viewMode === "executar" && selectedRelatorio) {
    return <ExecutarRelatorio styles={styles} relatorio={selectedRelatorio} showToast={showToast} onBack={() => { setViewMode("lista"); setSelectedRelatorio(null); }} />;
  }

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: "6px", fontSize: "12px",
    border: `1px solid ${C.border}`, outline: "none", boxSizing: "border-box", marginBottom: "12px"
  };

  const labelStyle = {
    fontSize: "11px", color: C.subtle, fontWeight: "700", marginBottom: "4px", display: "block"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16, fontFamily: "system-ui, sans-serif" }}>
 {/* HEADER DA PÁGINA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bg, padding: "16px 24px", borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: C.primary }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: C.text, fontWeight: 900 }}>Impressão de Relatórios</h2>
            <p style={{ color: C.muted, fontSize: "12px", margin: "2px 0 0", fontWeight: 600 }}>Usuário ativo: {currentUser?.nome || "Usuário"}</p>
          </div>
        </div>
      </div>

      {/* PAINEL DUPLO: FILTROS E LISTA */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        
        {/* PAINEL ESQUERDO: BUSCA/FILTRO (Similar ao Tasy) */}
        <div style={{ width: "260px", background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", flexShrink: 0 }}>
          <h3 style={{ fontSize: "12px", color: C.text, fontWeight: 800, textTransform: "uppercase", marginBottom: "16px", borderBottom: `1px solid ${C.border}`, paddingBottom: "8px" }}>
            🔍 Filtro de Relatórios
          </h3>
          
          <label style={labelStyle}>Código do Relatório</label>
          <input style={inputStyle} value={filtroCodigo} onChange={e => setFiltroCodigo(e.target.value)} placeholder="Ex: REL-001" />

          <label style={labelStyle}>Título ou Palavra-chave</label>
          <input style={inputStyle} value={filtroTitulo} onChange={e => setFiltroTitulo(e.target.value)} placeholder="Ex: Faturamento" />

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: C.text, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={somenteMeuPerfil} onChange={e => setSomenteMeuPerfil(e.target.checked)} style={{ accentColor: C.primary }} />
              Relatórios do perfil ativo
            </label>
          </div>

          <button onClick={loadRelatorios} style={{ width: "100%", marginTop: "24px", background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>
            🔄 Recarregar Dados
          </button>
        </div>

        {/* PAINEL CENTRAL: ÁRVORE DE RELATÓRIOS (Similar ao Tasy) */}
        <div style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, minHeight: "500px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ padding: "12px 16px", background: C.bgAlt, borderBottom: `1px solid ${C.border}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <span style={{ fontSize: "12px", color: C.subtle, fontWeight: 700 }}>
              {filtrados.length} relatório(s) liberado(s) para seu acesso
            </span>
          </div>

          <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: C.muted, fontWeight: 600 }}>⌛ Carregando relatórios...</div>
            ) : filtrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.subtle }}>Nenhum relatório encontrado com estes filtros.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(relatoriosAgrupados).map(([categoria, lista]) => (
                  <div key={categoria} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    
                    {/* Cabeçalho da Categoria (Pasta) */}
                    <div style={{ background: "#F1F5F9", padding: "10px 16px", fontSize: "13px", fontWeight: 800, color: C.blue, display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.border}` }}>
                      📁 {categoria.toUpperCase()}
                    </div>
                    
                    {/* Itens da Categoria */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {lista.map((r, i) => (
                        <div key={r.id} 
                          onClick={() => { setSelectedRelatorio(r); setViewMode("executar"); }}
                          style={{ 
                            padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
                            borderBottom: i === lista.length - 1 ? "none" : `1px solid ${C.border}`,
                            cursor: "pointer", transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = C.hover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ color: C.muted, fontSize: "16px" }}>📄</span>
                            <div>
                              <div style={{ color: C.text, fontSize: "13px", fontWeight: 700 }}>{r.nome}</div>
                              <div style={{ color: C.muted, fontSize: "11px", marginTop: "2px" }}>{r.descricao || "Sem descrição"}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <span style={{ fontSize: "10px", fontFamily: "monospace", color: C.subtle, background: C.bgAlt, padding: "4px 8px", borderRadius: 4 }}>
                              {r.codigo_ref || `ID: ${r.id}`}
                            </span>
                            <button style={{ background: `${C.primary}15`, color: C.primary, border: "none", borderRadius: 6, padding: "6px 12px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                              ABRIR →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}