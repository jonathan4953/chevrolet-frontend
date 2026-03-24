import React, { useState, useEffect, useRef } from "react";
// Importando os ícones limpos e profissionais do Lucide React + ChevronDown para os selects
import { ArrowLeft, FileText, Database, ListFilter, Search, CheckSquare, Square, ChevronDown } from "lucide-react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

const TIPOS_PARAM = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "data", label: "Data" },
  { value: "select", label: "Select (lista)" },
];

export default function ConstrutorRelatorio({ styles, relatorio, onSave, onCancel, showToast }) {
  const isNew = !relatorio?.id;
  
  const [form, setForm] = useState({
    nome: relatorio?.nome || "",
    descricao: relatorio?.descricao || "",
    categoria: relatorio?.categoria || "", 
    query_sql: relatorio?.query_sql || "",
    tipo_saida: relatorio?.tipo_saida || "tabela",
    perfis_permitidos: relatorio?.perfis_permitidos || [],
    parametros: relatorio?.parametros || [],
  });

  const [newParam, setNewParam] = useState({ nome: "", label: "", tipo: "texto", obrigatorio: true, opcoes_sql: "" });

  // --- ESTADOS DO DROPDOWN DE PERFIS ---
  const [rolesDisponiveis, setRolesDisponiveis] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef(null);

  // Busca os perfis no banco
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:8000/rbac/roles");
        if (res.ok) {
          const data = await res.json();
          setRolesDisponiveis(data);
        }
      } catch (err) {
        console.error("Erro ao buscar perfis:", err);
      }
    };
    fetchRoles();
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  // Função atualizada para o novo dropdown
  const togglePerfil = (nomeRole) => {
    setForm(prev => {
      const jaTem = prev.perfis_permitidos.includes(nomeRole);
      if (jaTem) {
        return { ...prev, perfis_permitidos: prev.perfis_permitidos.filter(p => p !== nomeRole) };
      } else {
        return { ...prev, perfis_permitidos: [...prev.perfis_permitidos, nomeRole] };
      }
    });
  };

  const addParam = () => {
    if (!newParam.nome || !newParam.label) return showToast("Preencha nome e label do parâmetro.", "error");
    setForm(p => ({ ...p, parametros: [...p.parametros, { ...newParam }] }));
    setNewParam({ nome: "", label: "", tipo: "texto", obrigatorio: true, opcoes_sql: "" });
  };

  const removeParam = (idx) => setForm(p => ({ ...p, parametros: p.parametros.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return showToast("Nome é obrigatório.", "error");
    if (!form.query_sql.trim()) return showToast("SQL é obrigatório.", "error");
    onSave({ ...form, id: relatorio?.id });
  };

  // ⬅️ ATUALIZADO: Fundo branco garantido e remoção do visual nativo do navegador
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "13px",
    backgroundColor: "#FFFFFF", color: C.text, border: `1px solid #D4D5D6`,
    outline: "none", transition: "border 0.2s", boxSizing: "border-box",
    appearance: "none", WebkitAppearance: "none", MozAppearance: "none"
  };

  const labelStyle = {
    fontSize: "10px", color: C.muted, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: "6px", display: "block"
  };

  const cardStyle = {
    background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "16px",
    padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
  };

  // Lógica global para deixar a borda laranja (focus)
  const handleFocus = e => e.target.style.borderColor = C.primary;
  const handleBlur = e => e.target.style.borderColor = "#D4D5D6";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onCancel} style={{ background: "#F9FAFB", border: `1px solid ${C.border}`, color: C.subtle, borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} strokeWidth={3} /> Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: C.primary }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: C.text, fontWeight: 900 }}>
              {isNew ? "Novo Relatório" : `Editar: ${relatorio.nome}`}
            </h2>
            <p style={{ color: C.muted, fontSize: "12px", margin: "2px 0 0", fontWeight: 600 }}>Defina a query SQL, parâmetros e permissões.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* DADOS BÁSICOS */}
        <div style={cardStyle}>
          <h3 style={{ color: C.primary, fontSize: "14px", fontWeight: "900", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} strokeWidth={2.5} /> DADOS DO RELATÓRIO
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Nome do Relatório *</label>
              <input 
                style={inputStyle} value={form.nome} onChange={e => updateField("nome", e.target.value)} 
                onFocus={handleFocus} onBlur={handleBlur} placeholder="Ex: Faturamento Mensal por Cliente" required 
              />
            </div>
            
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Descrição / Objetivo</label>
              <input 
                style={inputStyle} value={form.descricao} onChange={e => updateField("descricao", e.target.value)} 
                onFocus={handleFocus} onBlur={handleBlur} placeholder="Para que serve este relatório?" 
              />
            </div>

            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Categoria / Módulo (Pasta)</label>
              <input 
                style={inputStyle} value={form.categoria} onChange={e => updateField("categoria", e.target.value)} 
                onFocus={handleFocus} onBlur={handleBlur} placeholder="Ex: Financeiro, RH, Operacional..." 
                list="sugestoes-categorias" 
              />
              <datalist id="sugestoes-categorias">
                <option value="Financeiro" />
                <option value="Faturamento" />
                <option value="Plano de Saúde" />
                <option value="Recursos Humanos" />
                <option value="Operacional" />
                <option value="Auditoria" />
              </datalist>
            </div>

            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Tipo de Saída</label>
              <select 
                style={{...inputStyle, cursor: "pointer", paddingRight: "36px"}} 
                value={form.tipo_saida} 
                onChange={e => updateField("tipo_saida", e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="tabela">Apenas Tabela de Dados</option>
                <option value="grafico">Gráfico de Indicadores + Tabela</option>
              </select>
              {/* Setinha customizada do Lucide */}
              <ChevronDown size={14} strokeWidth={3} style={{ position: "absolute", right: "12px", top: "35px", pointerEvents: "none", color: C.subtle }} />
            </div>

            {/* O NOVO DROPDOWN MULTI-SELECT DE PERFIS */}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Perfis com Acesso</label>
              <div style={{ position: "relative", marginTop: 4 }} ref={dropdownRef}>
                
                {/* Gatilho do Dropdown */}
                <div 
                  onClick={() => setDropdownAberto(!dropdownAberto)}
                  style={{ 
                    ...inputStyle, 
                    cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderColor: dropdownAberto ? C.primary : "#D4D5D6", maxWidth: "50%"
                  }}
                >
                  <span style={{ color: form.perfis_permitidos.length ? C.text : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                    {form.perfis_permitidos.length > 0 
                      ? form.perfis_permitidos.join(", ") 
                      : "Todos os perfis (Padrão)"}
                  </span>
                  <ChevronDown size={14} strokeWidth={3} style={{ color: C.subtle, transform: dropdownAberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </div>

                {/* Menu Suspenso */}
                {dropdownAberto && (
                  <div style={{ 
                    position: "absolute", top: "100%", left: 0, marginTop: "6px",
                    background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, 
                    maxHeight: "220px", overflowY: "auto", width: "50%"
                  }}>
                    {rolesDisponiveis.map(role => {
                      const isChecked = form.perfis_permitidos.includes(role.nome);
                      return (
                        <div 
                          key={role.id}
                          onClick={() => handleTogglePerfil(role.nome)}
                          style={{ 
                            display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", 
                            cursor: "pointer", borderBottom: `1px solid ${C.border}`, margin: 0, transition: "background 0.2s",
                            background: isChecked ? `${C.primary}08` : "transparent"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isChecked ? `${C.primary}08` : C.bgAlt}
                          onMouseLeave={e => e.currentTarget.style.background = isChecked ? `${C.primary}08` : "transparent"}
                        >
                          <div style={{ color: isChecked ? C.primary : C.border, display: "flex" }}>
                            {isChecked ? <CheckSquare size={18} strokeWidth={2.5} /> : <Square size={18} strokeWidth={2.5} />}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: isChecked ? C.primary : C.text }}>{role.nome}</div>
                            {role.descricao && <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", marginTop: 2 }}>{role.descricao}</div>}
                          </div>
                        </div>
                      )
                    })}
                    {rolesDisponiveis.length === 0 && (
                      <div style={{ padding: "16px", fontSize: "13px", color: C.muted, textAlign: "center", fontWeight: 600 }}>Carregando perfis...</div>
                    )}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", color: C.muted, marginTop: "8px", display: "block", fontWeight: "600" }}>Se nenhum for marcado, todos os perfis verão o relatório.</span>
            </div>

          </div>
        </div>

        {/* QUERY SQL */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: C.blue, fontSize: "14px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={18} strokeWidth={2.5} /> QUERY SQL (BANCO DE DADOS)
            </h3>
            <span style={{ fontSize: "10px", background: `${C.blue}10`, color: C.blue, padding: "4px 10px", borderRadius: "6px", fontWeight: "800" }}>SELECT ONLY</span>
          </div>
          <p style={{ color: C.subtle, fontSize: "12px", marginBottom: "12px", fontWeight: "600", lineHeight: "1.5" }}>
            Utilize <code style={{ background: "#F1F5F9", color: C.primary, padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>:parametro</code> para criar filtros dinâmicos.
          </p>
          <textarea
            style={{
              ...inputStyle, width: "100%", minHeight: "220px", fontFamily: "monospace",
              fontSize: "13px", lineHeight: "1.6", resize: "vertical",
              background: "#F8FAFC", color: "#1E293B", border: `1px solid ${C.border}`,
              padding: "16px"
            }}
            value={form.query_sql}
            onChange={e => updateField("query_sql", e.target.value)}
            onFocus={handleFocus} onBlur={handleBlur}
            placeholder={`SELECT \n  nome, \n  valor \nFROM tabela \nWHERE data >= :data_inicio`}
            spellCheck={false}
          />
        </div>

        {/* PARÂMETROS */}
        <div style={cardStyle}>
          <h3 style={{ color: C.yellow, fontSize: "14px", fontWeight: "900", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
            <ListFilter size={18} strokeWidth={2.5} /> PARÂMETROS DE FILTRO
          </h3>

          {/* Lista de parâmetros existentes */}
          {form.parametros.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              {form.parametros.map((p, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#F9FAFB", border: `1px solid ${C.border}`,
                  borderRadius: "12px", padding: "12px 16px", marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", color: C.primary, fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: 4 }}><Search size={14} />:{p.nome}</span>
                    <span style={{ color: C.text, fontSize: "12px", fontWeight: "700" }}>{p.label}</span>
                    <span style={{
                      background: `${C.blue}10`, color: C.blue, padding: "2px 10px",
                      borderRadius: "20px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase"
                    }}>{p.tipo}</span>
                    {p.obrigatorio && <span style={{ color: C.red, fontSize: "10px", fontWeight: "800", textTransform: "uppercase" }}>Obrigatório</span>}
                  </div>
                  <button type="button" onClick={() => removeParam(i)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: "14px", fontWeight: "800" }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar parâmetro */}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", background: "#F9FAFB", border: `1px dashed ${C.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle}>ID no SQL</label>
              <input 
                style={inputStyle} value={newParam.nome} 
                onChange={e => setNewParam(p => ({ ...p, nome: e.target.value.replace(/\s/g, "_").toLowerCase() }))} 
                onFocus={handleFocus} onBlur={handleBlur} placeholder="Ex: id_cliente" 
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label style={labelStyle}>Título do Filtro</label>
              <input 
                style={inputStyle} value={newParam.label} 
                onChange={e => setNewParam(p => ({ ...p, label: e.target.value }))} 
                onFocus={handleFocus} onBlur={handleBlur} placeholder="Ex: Selecione o Cliente" 
              />
            </div>
            
            <div style={{ flex: "0 0 130px", position: "relative" }}>
              <label style={labelStyle}>Tipo</label>
              <select 
                style={{...inputStyle, cursor: "pointer", paddingRight: "36px"}} 
                value={newParam.tipo} 
                onChange={e => setNewParam(p => ({ ...p, tipo: e.target.value }))}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                {TIPOS_PARAM.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={14} strokeWidth={3} style={{ position: "absolute", right: "12px", top: "35px", pointerEvents: "none", color: C.subtle }} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: C.subtle, cursor: "pointer", padding: "10px 0", fontWeight: "700" }}>
              <input type="checkbox" checked={newParam.obrigatorio} onChange={e => setNewParam(p => ({ ...p, obrigatorio: e.target.checked }))} style={{ accentColor: C.primary }} />
              Obrigatório
            </label>

            {newParam.tipo === "select" && (
              <div style={{ flex: "1 1 100%", marginTop: "10px" }}>
                <label style={labelStyle}>Query para carregar a lista (deve retornar ID e NOME)</label>
                <input 
                  style={inputStyle} value={newParam.opcoes_sql} 
                  onChange={e => setNewParam(p => ({ ...p, opcoes_sql: e.target.value }))} 
                  onFocus={handleFocus} onBlur={handleBlur} placeholder="SELECT id_cliente as id, nome_cliente as nome FROM clientes" 
                />
              </div>
            )}

            <button type="button" onClick={addParam} style={{ background: C.green, color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontSize: "12px", fontWeight: "800", boxShadow: `0 4px 10px ${C.green}33` }}>
              ＋ Adicionar Filtro
            </button>
          </div>
        </div>

        {/* AÇÕES FINAIS */}
        <div style={{ display: "flex", gap: 16, marginTop: "10px" }}>
          <button type="submit" style={{ flex: 2, background: C.primary, color: "#fff", border: "none", borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: "800", cursor: "pointer", boxShadow: `0 4px 15px ${C.primary}33` }}>
            {isNew ? "CRIAR RELATÓRIO AGORA" : "SALVAR TODAS AS ALTERAÇÕES"}
          </button>
          <button type="button" onClick={onCancel} style={{ flex: 1, background: "#F9FAFB", color: C.subtle, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            CANCELAR
          </button>
        </div>
        
      </form>
    </div>
  );
}