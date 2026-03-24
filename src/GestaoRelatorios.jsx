import React, { useState, useEffect } from "react";
import ConstrutorRelatorio from "./modules/relatorios/ConstrutorRelatorio"; // Mantenha o seu caminho correto aqui
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bgAlt: "#F9FAFB"
};

export default function GestaoRelatorios({ showToast }) {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Controle de tela: null = Lista; {} = Novo; {id:...} = Editando
  const [relatorioEditando, setRelatorioEditando] = useState(null);
  
  // Controle do Dropdown de Ações
  const [dropdownAberto, setDropdownAberto] = useState(null);

  // Fecha o dropdown se o usuário clicar fora dele
  useEffect(() => {
    const handleClickFora = () => setDropdownAberto(null);
    window.addEventListener("click", handleClickFora);
    return () => window.removeEventListener("click", handleClickFora);
  }, []);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/relatorios");
      if (!res.ok) throw new Error("Erro ao buscar relatórios");
      const data = await res.json();
      setRelatorios(data);
    } catch (err) {
      if (showToast) showToast(err.message, "error");
      else alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (dadosRelatorio) => {
    const isEdit = !!dadosRelatorio.id;
    const url = isEdit 
      ? `http://localhost:8000/relatorios/${dadosRelatorio.id}` 
      : "http://localhost:8000/relatorios";
      
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosRelatorio)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao salvar");
      
      if (showToast) showToast(data.message || "Relatório salvo com sucesso!", "success");
      setRelatorioEditando(null); 
      carregarRelatorios(); 
    } catch (err) {
      if (showToast) showToast(err.message, "error");
      else alert(err.message);
    }
  };

  const handleExcluir = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o relatório "${nome}"?`)) return;
    
    try {
      const res = await fetch(`http://localhost:8000/relatorios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erro ao excluir");
      
      if (showToast) showToast("Relatório excluído!", "success");
      carregarRelatorios();
    } catch (err) {
      if (showToast) showToast(err.message, "error");
      else alert(err.message);
    }
  };

  if (relatorioEditando !== null) {
    return (
      <ConstrutorRelatorio 
        relatorio={Object.keys(relatorioEditando).length === 0 ? null : relatorioEditando} 
        onSave={handleSalvar} 
        onCancel={() => setRelatorioEditando(null)} 
        showToast={showToast}
      />
    );
  }

  const filtrados = relatorios.filter(r => 
    r.nome.toLowerCase().includes(busca.toLowerCase()) || 
    r.categoria?.toLowerCase().includes(busca.toLowerCase()) ||
    r.codigo_ref?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px", color: C.text, fontWeight: 900, letterSpacing: "-0.5px" }}>
            Gestão de Relatórios
          </h2>
          <p style={{ color: C.muted, fontSize: "14px", margin: "4px 0 0", fontWeight: 500 }}>
            Administre os painéis, crie novas consultas SQL e gerencie permissões.
          </p>
        </div>
        <button 
          onClick={() => setRelatorioEditando({})} 
          style={{ background: C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "12px 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer", display: "flex", gap: 8, alignItems: "center", boxShadow: `0 4px 12px ${C.primary}40` }}
        >
          <span>＋</span> NOVO RELATÓRIO
        </button>
      </div>

      <div style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: `1px solid ${C.border}`, display: "flex", gap: 16 }}>
        <input 
          type="text" 
          placeholder="Buscar por nome, código ou categoria..." 
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none", color: C.text }}
        />
      </div>

      {/* Trocado overflow: "hidden" por "visible" para o dropdown não ser cortado nas últimas linhas */}
      <div style={{ background: "#fff", borderRadius: "12px", border: `1px solid ${C.border}`, overflow: "visible" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}`, borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
            <tr>
              <th style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 800, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Código</th>
              <th style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 800, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nome do Relatório</th>
              <th style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 800, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoria</th>
              <th style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 800, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Acessos</th>
              <th style={{ padding: "14px 20px", fontSize: "11px", fontWeight: 800, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right", width: "80px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Carregando relatórios...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Nenhum relatório encontrado.</td></tr>
            ) : (
              filtrados.map((r, idx) => (
                <tr key={r.id} style={{ borderBottom: idx === filtrados.length - 1 ? "none" : `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#F8FAFC"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "16px 20px", fontSize: "12px", color: C.muted, fontWeight: 700, fontFamily: "monospace" }}>
                    {r.codigo_ref || `REL-${String(r.id).padStart(4, '0')}`}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{r.nome}</div>
                    <div style={{ fontSize: "12px", color: C.muted, marginTop: 4 }}>{r.descricao || "Sem descrição"}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: "#F1F5F9", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                      {r.categoria || "Gerais"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {r.perfis_permitidos?.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.perfis_permitidos.map(p => (
                          <span key={p} style={{ background: `${C.blue}15`, color: C.blue, padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: C.muted, fontStyle: "italic" }}>Todos</span>
                    )}
                  </td>
                  
                  {/* CÉLULA DE AÇÕES COM DROPDOWN */}
                  <td style={{ padding: "16px 20px", textAlign: "right", position: "relative" }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique feche o menu na mesma hora
                        setDropdownAberto(dropdownAberto === r.id ? null : r.id);
                      }}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: C.subtle, padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" }}
                      onMouseOver={e => e.currentTarget.style.background = C.border}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* MENU SUSPENSO */}
                    {dropdownAberto === r.id && (
                      <div style={{
                        position: "absolute",
                        right: "40px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "#fff",
                        border: `1px solid ${C.border}`,
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        zIndex: 100,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: "140px",
                        overflow: "hidden"
                      }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRelatorioEditando(r); setDropdownAberto(null); }}
                          style={{ background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: C.text, textAlign: "left" }}
                          onMouseOver={e => e.currentTarget.style.background = C.bgAlt}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Edit2 size={14} color={C.blue} /> Editar
                        </button>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExcluir(r.id, r.nome); setDropdownAberto(null); }}
                          style={{ background: "transparent", border: "none", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: C.red, textAlign: "left" }}
                          onMouseOver={e => e.currentTarget.style.background = "#FEF2F2"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}