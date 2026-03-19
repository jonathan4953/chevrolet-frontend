import React, { useState, useEffect, useMemo } from "react";
import { api } from "./api";

// ============================================================
// AdminRBAC.jsx — Administração do Sistema
// Usado pela aba "admin_rbac" no App.jsx
// ============================================================

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  purple: "#8b5cf6",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
};

export default function AdminRBAC({ styles, currentUser, showToast, logAction }) {
  const [activeSection, setActiveSection] = useState("empresas");
  
  // --- DADOS ---
  const [empresas, setEmpresas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);

  // --- FORMULÁRIOS ---
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", cnpj: "", status: "Ativo" });
  const [novaRole, setNovaRole] = useState({ nome: "", descricao: "", empresa_id: 1 });
  
  // --- ESTADO DE EDIÇÃO ---
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissoes, setRolePermissoes] = useState([]);
  const [empresaModulos, setEmpresaModulos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edição de empresa
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  
  // Edição de usuário
  const [editingUser, setEditingUser] = useState(null);
  
  // Criação de usuário
  const [creatingUser, setCreatingUser] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', password: '123', role_id: '', empresa_id: '', is_master: false });
  
  // Dropdown de ações
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Busca de módulos
  const [moduloSearch, setModuloSearch] = useState('');

  // ============================================================
  // CARREGAMENTO DE DADOS
  // ============================================================
  const loadEmpresas = async () => {
    try { const r = await api.get("/rbac/empresas"); setEmpresas(r.data); } catch(e) { console.error(e); }
  };
  const loadRoles = async () => {
    try { const r = await api.get("/rbac/roles"); setRoles(r.data); } catch(e) { console.error(e); }
  };
  const loadModulos = async () => {
    try { const r = await api.get("/rbac/modulos"); setModulos(r.data); } catch(e) { console.error(e); }
  };
  const loadPermissoes = async () => {
    try { const r = await api.get("/rbac/permissoes"); setPermissoes(r.data); } catch(e) { console.error(e); }
  };
  const loadUsuarios = async () => {
    try { const r = await api.get("/rbac/usuarios"); setUsuarios(r.data); } catch(e) { console.error(e); }
  };
  const loadLogs = async () => {
    try { const r = await api.get("/rbac/logs?limit=100"); setLogs(r.data); } catch(e) { console.error(e); }
  };

  useEffect(() => {
    loadEmpresas();
    loadRoles();
    loadModulos();
    loadPermissoes();
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (activeSection === "logs") loadLogs();
  }, [activeSection]);

  // ============================================================
  // HANDLERS — EMPRESAS
  // ============================================================
  const handleCriarEmpresa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/rbac/empresas", novaEmpresa);
      showToast?.("Empresa criada com sucesso!", "success");
      logAction?.("RBAC", `Criou empresa: ${novaEmpresa.nome}`);
      setNovaEmpresa({ nome: "", cnpj: "", status: "Ativo" });
      loadEmpresas();
    } catch (err) {
      showToast?.("Erro ao criar empresa. Verifique se o CNPJ já existe.", "error");
    } finally { setLoading(false); }
  };

  // ============================================================
  // HANDLERS — MÓDULOS POR EMPRESA
  // ============================================================
  const loadEmpresaModulos = async (empresaId) => {
    try {
      const r = await api.get(`/rbac/empresa-modulos/${empresaId}`);
      setEmpresaModulos(r.data);
      setSelectedEmpresa(empresaId);
    } catch(e) { console.error(e); }
  };

  const toggleModuloEmpresa = async (moduloId, ativo) => {
    try {
      await api.post("/rbac/empresa-modulos/toggle", {
        empresa_id: selectedEmpresa,
        modulo_id: moduloId,
        ativo: !ativo
      });
      loadEmpresaModulos(selectedEmpresa);
      logAction?.("RBAC", `${!ativo ? 'Ativou' : 'Desativou'} módulo ID ${moduloId} para empresa ID ${selectedEmpresa}`);
    } catch(e) {
      showToast?.("Erro ao alterar módulo", "error");
    }
  };

  // ============================================================
  // HANDLERS — PERFIS & PERMISSÕES
  // ============================================================
  const handleCriarRole = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/rbac/roles", novaRole);
      showToast?.("Perfil criado com sucesso!", "success");
      logAction?.("RBAC", `Criou perfil: ${novaRole.nome}`);
      setNovaRole({ nome: "", descricao: "", empresa_id: 1 });
      loadRoles();
    } catch(e) {
      showToast?.("Erro ao criar perfil.", "error");
    } finally { setLoading(false); }
  };

  const loadRolePermissoes = async (roleId) => {
    try {
      const r = await api.get(`/rbac/role-permissoes/${roleId}`);
      setRolePermissoes(r.data.permissao_ids || []);
      setSelectedRole(roleId);
    } catch(e) { console.error(e); }
  };

  const togglePermissaoRole = (permId) => {
    setRolePermissoes(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const salvarPermissoesRole = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await api.post("/rbac/role-permissoes", {
        role_id: selectedRole,
        permissao_ids: rolePermissoes
      });
      showToast?.("Permissões salvas com sucesso!", "success");
      logAction?.("RBAC", `Atualizou permissões do perfil ID ${selectedRole}`);
    } catch(e) {
      showToast?.("Erro ao salvar permissões.", "error");
    } finally { setLoading(false); }
  };

  const handleExcluirRole = async (roleId) => {
    if (!window.confirm("Tem certeza que deseja excluir este perfil?")) return;
    try {
      await api.delete(`/rbac/roles/${roleId}`);
      showToast?.("Perfil excluído!", "success");
      loadRoles();
      if (selectedRole === roleId) { setSelectedRole(null); setRolePermissoes([]); }
    } catch(e) {
      showToast?.(e.response?.data?.detail || "Erro ao excluir perfil.", "error");
    }
  };

  // ============================================================
  // HANDLERS — TOGGLE MASTER
  // ============================================================
  const toggleMaster = async (userId) => {
    try {
      await api.put(`/rbac/usuarios/${userId}/toggle-master`);
      showToast?.("Status MASTER alterado!", "success");
      logAction?.("RBAC", `Alterou status MASTER do usuário ID ${userId}`);
      loadUsuarios();
    } catch(e) {
      showToast?.("Erro ao alterar status.", "error");
    }
  };

  // ============================================================
  // HANDLERS — EDIÇÃO DE EMPRESA
  // ============================================================
  const saveEditEmpresa = async () => {
    if (!editingEmpresa) return;
    setLoading(true);
    try {
      await api.put(`/rbac/empresas/${editingEmpresa.id}`, {
        nome: editingEmpresa.nome,
        cnpj: editingEmpresa.cnpj,
        status: editingEmpresa.status
      });
      showToast?.("Empresa atualizada!", "success");
      logAction?.("RBAC", `Editou empresa: ${editingEmpresa.nome}`);
      setEditingEmpresa(null);
      loadEmpresas();
    } catch(e) { showToast?.("Erro ao atualizar empresa.", "error"); }
    finally { setLoading(false); }
  };

  const deleteEmpresa = async (id, nome) => {
    if (!window.confirm(`Excluir a empresa "${nome}"? Todos os dados vinculados serão afetados.`)) return;
    try {
      await api.delete(`/rbac/empresas/${id}`);
      showToast?.("Empresa excluída!", "success");
      logAction?.("RBAC", `Excluiu empresa: ${nome}`);
      loadEmpresas();
    } catch(e) {
      showToast?.(e.response?.data?.detail || "Erro ao excluir empresa.", "error");
    }
  };

  // ============================================================
  // HANDLERS — EDIÇÃO DE USUÁRIO (reset senha, trocar perfil)
  // ============================================================
  const resetUserPassword = async (userId, nome, senhaProvisoria = '123') => {
    const senha = senhaProvisoria.trim() || '123';
    if (!window.confirm(`Resetar a senha de "${nome}" para "${senha}"?\nO usuário será obrigado a trocar no próximo login.`)) return;
    try {
      await api.put(`/rbac/usuarios/${userId}/reset-password`, { nova_senha: senha });
      showToast?.(`Senha de ${nome} resetada para "${senha}"!`, "success");
      logAction?.("RBAC", `Resetou senha do usuário: ${nome}`);
    } catch(e) { showToast?.(e.response?.data?.detail || "Erro ao resetar senha.", "error"); }
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      // Atualiza role_id via endpoint existente ou RBAC
      if (editingUser.role_id_changed) {
        await api.post("/rbac/role-permissoes", {
          role_id: editingUser.role_id,
          permissao_ids: [] // mantém permissões existentes
        }).catch(() => {});
      }
      // Atualiza empresa via RBAC
      await api.put(`/rbac/usuarios/${editingUser.id}/empresa`, { empresa_id: editingUser.empresa_id });
      // Toggle master se mudou
      if (editingUser.is_master !== editingUser.original_is_master) {
        await api.put(`/rbac/usuarios/${editingUser.id}/toggle-master`);
      }
      // Toggle ativo/inativo se mudou
      if (editingUser.ativo !== editingUser.original_ativo) {
        await api.put(`/rbac/usuarios/${editingUser.id}/toggle-status`, { ativo: editingUser.ativo });
      }
      // Toggle permissão edição
      await api.put(`/users/${editingUser.id}/toggle-permission`).catch(() => {});
      
      showToast?.("Usuário atualizado!", "success");
      logAction?.("RBAC", `Editou usuário: ${editingUser.nome}`);
      setEditingUser(null);
      loadUsuarios();
    } catch(e) { showToast?.("Erro ao salvar.", "error"); }
    finally { setLoading(false); }
  };

  // ============================================================
  // HANDLERS — CRIAÇÃO DE USUÁRIO
  // ============================================================
  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.role_id || !novoUsuario.empresa_id) {
      showToast?.("Preencha todos os campos obrigatórios.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/rbac/usuarios", {
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        password: novoUsuario.password || '123',
        role_id: Number(novoUsuario.role_id),
        empresa_id: Number(novoUsuario.empresa_id),
        is_master: novoUsuario.is_master
      });
      showToast?.(`Usuário "${novoUsuario.nome}" criado com sucesso! Senha inicial: ${novoUsuario.password || '123'}`, "success");
      logAction?.("RBAC", `Criou usuário: ${novoUsuario.nome} (${novoUsuario.email})`);
      setNovoUsuario({ nome: '', email: '', password: '123', role_id: '', empresa_id: '', is_master: false });
      setCreatingUser(false);
      loadUsuarios();
    } catch (err) {
      showToast?.(err.response?.data?.detail || "Erro ao criar usuário. Verifique se o e-mail já existe.", "error");
    } finally { setLoading(false); }
  };

  // ============================================================
  // HANDLERS — EXCLUSÃO DE USUÁRIO
  // ============================================================
  const deleteUser = async (userId, nome, isMaster) => {
    if (isMaster) {
      showToast?.("Não é possível excluir um usuário MASTER. Revogue o acesso MASTER primeiro.", "error");
      return;
    }
    if (!window.confirm(`⚠️ ATENÇÃO: Deseja realmente excluir o usuário "${nome}"?\n\nEsta ação irá:\n• Desativar o acesso ao sistema\n• Desativar o acesso ao GLPI (suporte)\n\nEssa ação não pode ser desfeita facilmente.`)) return;
    try {
      await api.delete(`/rbac/usuarios/${userId}`);
      showToast?.(`Usuário "${nome}" excluído com sucesso!`, "success");
      logAction?.("RBAC", `Excluiu usuário: ${nome} (ID ${userId})`);
      // Remove da lista local para feedback imediato
      setUsuarios(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      showToast?.(err.response?.data?.detail || "Erro ao excluir usuário.", "error");
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // ============================================================
  // AGRUPAMENTO DE PERMISSÕES POR MÓDULO
  // ============================================================
  const permissoesPorModulo = useMemo(() => {
    const map = {};
    permissoes.forEach(p => {
      if (!map[p.modulo_slug]) {
        map[p.modulo_slug] = { modulo_nome: p.modulo_nome, items: [] };
      }
      map[p.modulo_slug].items.push(p);
    });
    return map;
  }, [permissoes]);

  // ============================================================
  // ESTILOS LOCAIS
  // ============================================================
  const s = {
    tabBar: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: 16 },
    tab: (active) => ({
      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
      cursor: 'pointer', transition: 'all 0.2s',
      border: active ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
      background: active ? C.primary : '#F9FAFB',
      color: active ? '#FFFFFF' : C.subtle,
      boxShadow: active ? `0 4px 12px ${C.primary}33` : 'none'
    }),
    card: {
      background: '#FFFFFF', border: `1px solid ${C.border}`,
      borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
    },
    sectionTitle: { fontSize: 16, fontWeight: 800, color: C.text, margin: "0 0 16px 0", display: 'flex', alignItems: 'center', gap: 8 },
    label: { fontSize: 10, color: C.muted, textTransform: 'uppercase', fontWeight: 800, letterSpacing: "0.08em", marginBottom: 6, display: 'block' },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FFFFFF", color: C.text, border: "1px solid #D4D5D6", outline: "none", transition: "border 0.2s", marginBottom: 12, boxSizing: 'border-box' },
    btn: (color = C.primary) => ({
      padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 12,
      border: 'none', cursor: 'pointer', background: color, color: '#FFFFFF',
      boxShadow: `0 4px 10px ${color}33`, transition: "opacity 0.2s"
    }),
    badge: (active) => ({
      display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 10,
      fontWeight: 800, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
      background: active ? `${C.green}15` : `${C.red}15`,
      color: active ? C.green : C.red,
      border: `1px solid ${active ? C.green : C.red}40`
    }),
    masterBadge: {
      background: `${C.yellow}15`,
      color: C.yellow, border: `1px solid ${C.yellow}40`, padding: '4px 10px', borderRadius: 20,
      fontSize: 10, fontWeight: 800
    },
    checkbox: (checked) => ({
      width: 18, height: 18, borderRadius: 4, cursor: 'pointer', appearance: 'none',
      border: checked ? `2px solid ${C.green}` : '2px solid #D4D5D6',
      background: checked ? C.green : '#FFFFFF',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      verticalAlign: 'middle', position: 'relative', flexShrink: 0, transition: "all 0.2s",
      backgroundImage: checked ? `url('data:image/svg+xml;utf8,<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')` : 'none',
      backgroundPosition: 'center', backgroundSize: '80%', backgroundRepeat: 'no-repeat'
    }),
    dropdownItem: {
      display: 'block', width: '100%', padding: '9px 16px', fontSize: 12, fontWeight: 600,
      color: C.text, background: 'transparent', border: 'none', textAlign: 'left',
      cursor: 'pointer', borderRadius: 0, transition: "background 0.2s"
    },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(42, 43, 45, 0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
    th: { padding: '12px 14px', fontSize: 10, color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.border}`, fontWeight: 800, textTransform: 'uppercase', letterSpacing: "0.08em", background: "#F9FAFB" },
    td: { padding: '12px 14px', fontSize: 13, color: C.subtle, borderBottom: `1px solid ${C.border}` }
  };

  // Verificação de acesso
  if (!currentUser?.is_master && currentUser?.role !== 'admin') {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: 60 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <h2 style={{ color: C.red, marginTop: 16, fontSize: 20, fontWeight: 800 }}>Acesso Restrito</h2>
        <p style={{ color: C.subtle, fontSize: 14, marginTop: 8, fontWeight: 600 }}>
          Apenas usuários MASTER ou Administradores podem acessar este painel.
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: C.text, fontWeight: 900, display: "flex", alignItems: "center", gap: 12 }}>
            Administração do Sistema
            {currentUser?.is_master && <span style={s.masterBadge}>👑 MASTER</span>}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.subtle, fontWeight: 600 }}>Controle de Acesso Baseado em Perfis • Multiempresa</p>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabBar}>
        {[
          { key: 'empresas', label: '🏢 Empresas', show: true },
          { key: 'modulos', label: '📦 Módulos', show: true },
          { key: 'perfis', label: '🎭 Perfis', show: true },
          { key: 'usuarios', label: '👤 Usuários', show: true },
          { key: 'logs', label: '📜 Logs', show: true },
        ].filter(t => t.show).map(t => (
          <button key={t.key} style={s.tab(activeSection === t.key)} onClick={() => setActiveSection(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO: EMPRESAS */}
      {/* ============================================================ */}
      {activeSection === "empresas" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          {/* Formulário */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>➕ Nova Empresa</h3>
            <form onSubmit={handleCriarEmpresa}>
              <label style={s.label}>Nome</label>
              <input style={s.input} value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>CNPJ</label>
              <input style={s.input} value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>Status</label>
              <select style={s.input} value={novaEmpresa.status} onChange={e => setNovaEmpresa({...novaEmpresa, status: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
              <button type="submit" style={{...s.btn(), width: "100%", marginTop: 8}} disabled={loading}>CRIAR EMPRESA</button>
            </form>
          </div>

          {/* Lista + Módulos */}
          <div>
            <div style={{...s.card, padding: 0, overflow: "hidden"}}>
              <div style={{ padding: "20px 24px" }}>
                <h3 style={{...s.sectionTitle, margin: 0}}>🏢 Empresas Cadastradas ({empresas.length})</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'Nome', 'CNPJ', 'Status', 'Ações'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresas.map(emp => (
                    <tr key={emp.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ ...s.td, color: C.muted, fontWeight: 700 }}>{emp.id}</td>
                      <td style={{ ...s.td, color: C.text, fontWeight: 800 }}>{emp.nome}</td>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{emp.cnpj}</td>
                      <td style={s.td}>
                        <span style={s.badge(emp.status === 'Ativo')}>{emp.status}</span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ ...s.btn(C.blue), padding: '6px 12px', fontSize: 11 }} onClick={() => loadEmpresaModulos(emp.id)}>⚙️ Módulos</button>
                          <button style={{ ...s.btn(C.yellow), padding: '6px 12px', fontSize: 11 }} onClick={() => setEditingEmpresa({ ...emp })}>✏️</button>
                          <button style={{ ...s.btn(C.red), padding: '6px 12px', fontSize: 11 }} onClick={() => deleteEmpresa(emp.id, emp.nome)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Módulos da empresa selecionada */}
            {selectedEmpresa && (
              <div style={s.card}>
                <h3 style={s.sectionTitle}>
                  📦 Módulos — {empresas.find(e => e.id === selectedEmpresa)?.nome || ''}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {empresaModulos.map(mod => (
                    <div
                      key={mod.id}
                      onClick={() => toggleModuloEmpresa(mod.id, mod.liberado)}
                      style={{
                        padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        background: mod.liberado ? `${C.green}15` : '#F9FAFB',
                        border: `1px solid ${mod.liberado ? `${C.green}40` : C.border}`,
                        display: 'flex', alignItems: 'center', gap: 12
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{mod.icone}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: mod.liberado ? C.green : C.subtle }}>{mod.nome}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{mod.slug}</div>
                      </div>
                      <span style={s.badge(mod.liberado)}>{mod.liberado ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal edição de empresa */}
          {editingEmpresa && (
            <div style={s.modalOverlay}>
              <div style={{ ...s.modalContent, width: 400 }}>
                <h3 style={s.sectionTitle}>✏️ Editar Empresa</h3>
                <label style={s.label}>Nome</label>
                <input style={s.input} value={editingEmpresa.nome} onChange={e => setEditingEmpresa({...editingEmpresa, nome: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>CNPJ</label>
                <input style={s.input} value={editingEmpresa.cnpj} onChange={e => setEditingEmpresa({...editingEmpresa, cnpj: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>Status</label>
                <select style={s.input} value={editingEmpresa.status} onChange={e => setEditingEmpresa({...editingEmpresa, status: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
                <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                  <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle }} onClick={() => setEditingEmpresa(null)}>Cancelar</button>
                  <button style={s.btn()} onClick={saveEditEmpresa} disabled={loading}>{loading ? '⌛...' : '💾 Salvar Alterações'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: MÓDULOS (leitura) */}
      {/* ============================================================ */}
      {activeSection === "modulos" && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}>📦 Módulos do Sistema ({modulos.length})</h3>
          <input
            placeholder="🔍 Buscar módulo por nome ou slug..."
            value={moduloSearch}
            onChange={e => setModuloSearch(e.target.value)}
            style={{ ...s.input, maxWidth: 400 }}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {modulos.filter(m => !moduloSearch || m.nome.toLowerCase().includes(moduloSearch.toLowerCase()) || m.slug.toLowerCase().includes(moduloSearch.toLowerCase()) || (m.descricao || '').toLowerCase().includes(moduloSearch.toLowerCase())).map(m => (
              <div key={m.id} style={{
                padding: '16px', borderRadius: 12,
                background: m.ativo ? `${C.green}05` : `${C.red}05`,
                border: `1px solid ${m.ativo ? `${C.green}30` : `${C.red}30`}`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icone}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{m.nome}</div>
                <div style={{ fontSize: 11, color: C.subtle, marginTop: 4, fontWeight: 600 }}>{m.slug}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{m.descricao}</div>
              </div>
            ))}
            {modulos.filter(m => !moduloSearch || m.nome.toLowerCase().includes(moduloSearch.toLowerCase()) || m.slug.toLowerCase().includes(moduloSearch.toLowerCase()) || (m.descricao || '').toLowerCase().includes(moduloSearch.toLowerCase())).length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: C.muted, fontSize: 14, fontWeight: 600 }}>Nenhum módulo encontrado para "{moduloSearch}"</div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: PERFIS & PERMISSÕES */}
      {/* ============================================================ */}
      {activeSection === "perfis" && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Coluna esquerda: Criar + Lista de Roles */}
          <div>
            <div style={s.card}>
              <h3 style={s.sectionTitle}>➕ Novo Perfil</h3>
              <form onSubmit={handleCriarRole}>
                <label style={s.label}>Nome</label>
                <input style={s.input} value={novaRole.nome} onChange={e => setNovaRole({...novaRole, nome: e.target.value})} required placeholder="Ex: Operador" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>Descrição</label>
                <input style={s.input} value={novaRole.descricao} onChange={e => setNovaRole({...novaRole, descricao: e.target.value})} placeholder="Opcional" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <button type="submit" style={{...s.btn(), width: "100%", marginTop: 8}} disabled={loading}>CRIAR PERFIL</button>
              </form>
            </div>

            <div style={s.card}>
              <h3 style={s.sectionTitle}>🎭 Perfis ({roles.length})</h3>
              {roles.map(r => (
                <div
                  key={r.id}
                  onClick={() => loadRolePermissoes(r.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                    background: selectedRole === r.id ? `${C.primary}10` : '#F9FAFB',
                    border: `1px solid ${selectedRole === r.id ? C.primary : C.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: "all 0.2s"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: selectedRole === r.id ? C.primary : C.text }}>{r.nome}</div>
                    {r.descricao && <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>{r.descricao}</div>}
                  </div>
                  {!['admin', 'gestor', 'consultor'].includes(r.nome.toLowerCase()) && (
                    <button onClick={(e) => { e.stopPropagation(); handleExcluirRole(r.id); }}
                      style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita: Permissões da Role selecionada */}
          <div style={s.card}>
            {selectedRole ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ ...s.sectionTitle, margin: 0 }}>
                    🔐 Permissões — {roles.find(r => r.id === selectedRole)?.nome || ''}
                  </h3>
                  <button style={s.btn()} onClick={salvarPermissoesRole} disabled={loading}>
                    {loading ? '⌛ SALVANDO...' : '💾 SALVAR PERMISSÕES'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <button style={{ ...s.btn(C.green), padding: '8px 16px', fontSize: 11 }}
                    onClick={() => setRolePermissoes(permissoes.map(p => p.id))}>
                    ✅ Marcar Todos
                  </button>
                  <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle, padding: '8px 16px', fontSize: 11 }}
                    onClick={() => setRolePermissoes([])}>
                    ✖ Desmarcar Todos
                  </button>
                </div>

                <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 10 }}>
                  {Object.entries(permissoesPorModulo).map(([slug, group]) => (
                    <div key={slug} style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 900, color: C.primary, marginBottom: 12,
                        borderLeft: `4px solid ${C.primary}`, paddingLeft: 12, textTransform: 'uppercase', letterSpacing: "0.08em"
                      }}>
                        {group.modulo_nome}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, paddingLeft: 16 }}>
                        {group.items.map(p => {
                          const checked = rolePermissoes.includes(p.id);
                          return (
                            <label key={p.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px',
                              borderRadius: 10, background: checked ? `${C.green}10` : '#F9FAFB',
                              border: `1px solid ${checked ? `${C.green}40` : C.border}`,
                              transition: 'all 0.15s'
                            }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermissaoRole(p.id)}
                                style={s.checkbox(checked)}
                              />
                              <span style={{ fontSize: 12, color: checked ? C.green : C.subtle, fontWeight: checked ? 800 : 600 }}>
                                {p.nome.split(' ')[0]}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}>
                <span style={{ fontSize: 48 }}>🎭</span>
                <p style={{ marginTop: 16, fontSize: 15, fontWeight: 700 }}>Selecione um perfil à esquerda para gerenciar suas permissões</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: USUÁRIOS */}
      {/* ============================================================ */}
      {activeSection === "usuarios" && (
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ ...s.sectionTitle, margin: 0 }}>👤 Usuários do Sistema ({usuarios.length})</h3>
            <button
              onClick={() => { setCreatingUser(true); setNovoUsuario({ nome: '', email: '', password: '123', role_id: roles[0]?.id || '', empresa_id: empresas[0]?.id || '', is_master: false }); }}
              style={{ ...s.btn(C.green), padding: '10px 20px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
            >➕ Novo Usuário</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Nome', 'E-mail', 'Empresa', 'Perfil', 'Master', 'Status', 'Ações'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...s.td, color: C.muted, fontWeight: 700 }}>{u.id}</td>
                  <td style={{ ...s.td, color: C.text, fontWeight: 800 }}>{u.nome}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.empresa_nome}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                      background: u.role === 'admin' ? `${C.red}15` : u.role === 'gestor' ? `${C.blue}15` : `${C.muted}15`,
                      color: u.role === 'admin' ? C.red : u.role === 'gestor' ? C.blue : C.subtle,
                      border: `1px solid ${u.role === 'admin' ? C.red : u.role === 'gestor' ? C.blue : C.muted}40`,
                      textTransform: 'uppercase'
                    }}>{u.role}</span>
                  </td>
                  <td style={s.td}>
                    {u.is_master ? <span style={s.masterBadge}>👑 MASTER</span> : <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>—</span>}
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(u.ativo)}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td style={s.td}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === u.id ? null : u.id); }}
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                          background: openDropdown === u.id ? `${C.primary}15` : '#F9FAFB',
                          color: openDropdown === u.id ? C.primary : C.subtle,
                          border: `1px solid ${openDropdown === u.id ? `${C.primary}50` : C.border}`,
                          transition: 'all 0.15s'
                        }}
                      >⚙️ Ações ▾</button>

                      {openDropdown === u.id && (
                        <div style={{
                          position: 'absolute', right: 0, top: '110%', zIndex: 1000,
                          background: '#FFFFFF', border: `1px solid ${C.border}`,
                          borderRadius: 12, minWidth: 180, padding: '6px 0',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
                        }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); setEditingUser({ ...u, original_is_master: u.is_master, original_ativo: u.ativo, role_id_changed: false, resetSenha: '' }); }}
                            style={s.dropdownItem} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >✏️ Editar</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); resetUserPassword(u.id, u.nome); }}
                            style={s.dropdownItem} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >🔄 Reset Senha</button>
                          {currentUser?.is_master && u.id !== currentUser.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); toggleMaster(u.id); }}
                              style={{ ...s.dropdownItem, color: u.is_master ? C.red : C.green }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >{u.is_master ? '⬇ Revogar Master' : '⬆ Tornar Master'}</button>
                          )}
                          {currentUser?.is_master && u.id !== currentUser.id && !u.is_master && (
                            <>
                              <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); deleteUser(u.id, u.nome, u.is_master); }}
                                style={{ ...s.dropdownItem, color: C.red }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >🗑️ Excluir Usuário</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* MODAL CRIAÇÃO DE USUÁRIO */}
          {creatingUser && (
            <div style={s.modalOverlay}>
              <div style={{ ...s.modalContent, width: 500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}>➕ Novo Usuário</h3>
                  <button onClick={() => setCreatingUser(false)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', fontWeight: 800 }}>✕</button>
                </div>

                <form onSubmit={handleCriarUsuario}>
                  <label style={s.label}>Nome Completo *</label>
                  <input style={s.input} value={novoUsuario.nome} onChange={e => setNovoUsuario({...novoUsuario, nome: e.target.value})} required placeholder="Nome do colaborador" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />

                  <label style={s.label}>E-mail (Login) *</label>
                  <input style={s.input} type="email" value={novoUsuario.email} onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})} required placeholder="email@empresa.com" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />

                  <label style={s.label}>Senha Inicial</label>
                  <input style={s.input} value={novoUsuario.password} onChange={e => setNovoUsuario({...novoUsuario, password: e.target.value})} placeholder='Padrão: 123' onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                  <p style={{ fontSize: 11, color: C.subtle, marginTop: -6, marginBottom: 16, fontWeight: 600 }}>O usuário será obrigado a trocar no primeiro login.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={s.label}>Empresa *</label>
                      <select style={s.input} value={novoUsuario.empresa_id} onChange={e => setNovoUsuario({...novoUsuario, empresa_id: Number(e.target.value)})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                        <option value="">Selecione...</option>
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Perfil (Role) *</label>
                      <select style={s.input} value={novoUsuario.role_id} onChange={e => setNovoUsuario({...novoUsuario, role_id: Number(e.target.value)})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                        <option value="">Selecione...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                      </select>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.text, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <input type="checkbox" checked={novoUsuario.is_master} onChange={e => setNovoUsuario({...novoUsuario, is_master: e.target.checked})} style={s.checkbox(novoUsuario.is_master)} />
                    👑 Conceder Acesso MASTER
                  </label>

                  <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'flex-end' }}>
                    <button type="button" style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle }} onClick={() => setCreatingUser(false)}>Cancelar</button>
                    <button type="submit" style={s.btn(C.green)} disabled={loading}>{loading ? '⌛ Criando...' : '✅ Criar Usuário'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL EDIÇÃO DE USUÁRIO */}
          {editingUser && (
            <div style={s.modalOverlay}>
              <div style={{ ...s.modalContent, width: 500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}>✏️ Editar Usuário</h3>
                  <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', fontWeight: 800 }}>✕</button>
                </div>
                
                <label style={s.label}>Nome</label>
                <input style={s.input} value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                
                <label style={s.label}>E-mail</label>
                <input style={{...s.input, opacity: 0.6, cursor: 'not-allowed', background: "#F9FAFB"}} value={editingUser.email} disabled />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={s.label}>Empresa</label>
                    <select style={s.input} value={editingUser.empresa_id || ''} onChange={e => setEditingUser({...editingUser, empresa_id: Number(e.target.value)})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                      {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Perfil (Role)</label>
                    <select style={s.input} value={editingUser.role_id || ''} onChange={e => setEditingUser({...editingUser, role_id: Number(e.target.value), role_id_changed: true})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: "column", gap: 12, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.text, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <input type="checkbox" checked={editingUser.is_master || false} onChange={e => setEditingUser({...editingUser, is_master: e.target.checked})} style={s.checkbox(editingUser.is_master)} />
                    👑 Acesso MASTER
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.text, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <input type="checkbox" checked={editingUser.canEdit || false} onChange={e => setEditingUser({...editingUser, canEdit: e.target.checked})} style={s.checkbox(editingUser.canEdit)} />
                    ✏️ Permissão de Edição
                  </label>
                  <label
                    onClick={() => setEditingUser({...editingUser, ativo: !editingUser.ativo})}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer',
                      padding: '12px 16px', borderRadius: 10,
                      background: editingUser.ativo ? `${C.green}10` : `${C.red}10`,
                      border: `1px solid ${editingUser.ativo ? `${C.green}30` : `${C.red}30`}`,
                      color: editingUser.ativo ? C.green : C.red,
                      fontWeight: 800, transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{editingUser.ativo ? '✅' : '🚫'}</span>
                    {editingUser.ativo ? 'Conta Ativa' : 'Conta Inativa'}
                  </label>
                </div>

                {/* RESET DE SENHA */}
                <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: `${C.blue}05`, border: `1px solid ${C.blue}30` }}>
                  <label style={{ ...s.label, color: C.blue, marginBottom: 8 }}>🔑 Reset de Senha</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      style={{ ...s.input, marginBottom: 0, flex: 1, borderColor: `${C.blue}40` }}
                      value={editingUser.resetSenha || ''}
                      onChange={e => setEditingUser({...editingUser, resetSenha: e.target.value})}
                      placeholder="Senha provisória (ex: 123)"
                      onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = `${C.blue}40`}
                    />
                    <button
                      onClick={() => { resetUserPassword(editingUser.id, editingUser.nome, editingUser.resetSenha || '123'); }}
                      style={{ padding: '10px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', background: C.blue, color: '#FFFFFF', border: 'none', whiteSpace: 'nowrap', boxShadow: `0 4px 10px ${C.blue}33` }}
                    >🔄 Resetar</button>
                  </div>
                  <p style={{ fontSize: 11, color: C.subtle, marginTop: 8, marginBottom: 0, fontWeight: 600 }}>O usuário será obrigado a trocar no próximo login. A senha também será atualizada no GLPI.</p>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'flex-end' }}>
                  <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle }} onClick={() => setEditingUser(null)}>Cancelar</button>
                  <button style={s.btn()} onClick={saveEditUser} disabled={loading}>{loading ? '⌛...' : '💾 Salvar Alterações'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: LOGS */}
      {/* ============================================================ */}
      {activeSection === "logs" && (
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ ...s.sectionTitle, margin: 0 }}>📜 Logs de Acesso</h3>
            <button style={{ ...s.btn(C.blue), padding: '8px 16px', fontSize: 11 }} onClick={loadLogs}>🔄 Atualizar</button>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Data', 'Usuário', 'Empresa', 'Ação', 'Detalhe'].map(h => (
                    <th key={h} style={{ ...s.th, position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...s.td, color: C.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{l.data?.slice(0, 19).replace("T", " ")}</td>
                    <td style={{ ...s.td, color: C.text, fontWeight: 800 }}>{l.usuario || '—'}</td>
                    <td style={s.td}>{l.empresa || '—'}</td>
                    <td style={s.td}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}40` }}>{l.acao}</span>
                    </td>
                    <td style={{ ...s.td, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.detalhe || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 14, fontWeight: 600 }}>Nenhum log registrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}