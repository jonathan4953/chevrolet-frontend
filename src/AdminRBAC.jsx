import React, { useState, useEffect, useMemo, useRef } from "react";
import { api } from "./api";
import { useConfirm } from "./components/ConfirmContext";

// ============================================================
// AdminRBAC.jsx — Administração do Sistema
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

/* ── Ícones SVG minimalistas ── */
const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.8 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0 } };
  const icons = {
    building:    <svg {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
    package:     <svg {...p}><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>,
    masks:       <svg {...p}><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/><path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2Z"/></svg>,
    user:        <svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    scroll:      <svg {...p}><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 3H8a2 2 0 0 0-2 2v14"/></svg>,
    plus:        <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    pencil:      <svg {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
    trash:       <svg {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
    settings:    <svg {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    key:         <svg {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    lock:        <svg {...p}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    save:        <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    crown:       <svg {...p}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M4 18a1 1 0 0 0-1 1v1h18v-1a1 1 0 0 0-1-1Z"/></svg>,
    check:       <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    x:           <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    refresh:     <svg {...p}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
    shield:      <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    checkAll:    <svg {...p}><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>,
    toggleOff:   <svg {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="8" cy="12" r="3"/></svg>,
    toggleOn:    <svg {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>,
    search:      <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  };
  return icons[name] || null;
};

/* ── Ícone com fundo redondo (estilo Módulo Comercial) ── */
const IconBadge = ({ name, color = C.primary, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: 10,
    background: `${color}12`, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <Icon name={name} size={size * 0.5} color={color} />
  </div>
);

/* ── Dropdown de Ações (três pontos, position: fixed) ── */
function ActionsDropdown({ children, id, openDropdown, setOpenDropdown }) {
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isOpen = openDropdown === id;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (isOpen) { setOpenDropdown(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right });
    setOpenDropdown(id);
  };

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{ background: isOpen ? "#F3F4F6" : "transparent", border: `1px solid ${isOpen ? "#D4D5D6" : "transparent"}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", color: C.subtle }}
        onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.borderColor = "#D4D5D6"; }}}
        onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}}
        title="Ações"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="13" r="1.3" fill="currentColor"/></svg>
      </button>
      {isOpen && (
        <div ref={ref} style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-100%)", zIndex: 9000, background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)", animation: "dropInRBAC 0.12s ease-out" }}>
          {children}
        </div>
      )}
      <style>{`@keyframes dropInRBAC { from { opacity: 0; transform: translateX(-100%) translateY(-4px); } to { opacity: 1; transform: translateX(-100%) translateY(0); } }`}</style>
    </>
  );
}

export default function AdminRBAC({ styles, currentUser, showToast, logAction }) {
  const [activeSection, setActiveSection] = useState("empresas");
  const [empresas, setEmpresas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", cnpj: "", status: "Ativo" });
  const [novaRole, setNovaRole] = useState({ nome: "", descricao: "", empresa_id: 1 });
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissoes, setRolePermissoes] = useState([]);
  const [empresaModulos, setEmpresaModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', password: '123', role_id: '', empresa_id: '', is_master: false });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [moduloSearch, setModuloSearch] = useState('');

  // INICIALIZAÇÃO DO HOOK DE CONFIRMAÇÃO
  const confirm = useConfirm();

  // ── Carregamento ──
  const loadEmpresas = async () => { try { const r = await api.get("/rbac/empresas"); setEmpresas(r.data); } catch(e) { console.error(e); } };
  const loadRoles = async () => { try { const r = await api.get("/rbac/roles"); setRoles(r.data); } catch(e) { console.error(e); } };
  const loadModulos = async () => { try { const r = await api.get("/rbac/modulos"); setModulos(r.data); } catch(e) { console.error(e); } };
  const loadPermissoes = async () => { try { const r = await api.get("/rbac/permissoes"); setPermissoes(r.data); } catch(e) { console.error(e); } };
  const loadUsuarios = async () => { try { const r = await api.get("/rbac/usuarios"); setUsuarios(r.data); } catch(e) { console.error(e); } };
  const loadLogs = async () => { try { const r = await api.get("/rbac/logs?limit=100"); setLogs(r.data); } catch(e) { console.error(e); } };

  useEffect(() => { loadEmpresas(); loadRoles(); loadModulos(); loadPermissoes(); loadUsuarios(); }, []);
  useEffect(() => { if (activeSection === "logs") loadLogs(); }, [activeSection]);

  // ── Empresas ──
  const handleCriarEmpresa = async (e) => { e.preventDefault(); setLoading(true); try { await api.post("/rbac/empresas", novaEmpresa); showToast?.("Empresa criada!", "success"); logAction?.("RBAC", `Criou empresa: ${novaEmpresa.nome}`); setNovaEmpresa({ nome: "", cnpj: "", status: "Ativo" }); loadEmpresas(); } catch(e) { showToast?.("Erro ao criar empresa.", "error"); } finally { setLoading(false); } };
  const loadEmpresaModulos = async (id) => { try { const r = await api.get(`/rbac/empresa-modulos/${id}`); setEmpresaModulos(r.data); setSelectedEmpresa(id); } catch(e) { console.error(e); } };
  const toggleModuloEmpresa = async (moduloId, ativo) => { try { await api.post("/rbac/empresa-modulos/toggle", { empresa_id: selectedEmpresa, modulo_id: moduloId, ativo: !ativo }); loadEmpresaModulos(selectedEmpresa); logAction?.("RBAC", `${!ativo ? 'Ativou' : 'Desativou'} módulo ID ${moduloId}`); } catch(e) { showToast?.("Erro ao alterar módulo", "error"); } };
  const saveEditEmpresa = async () => { if (!editingEmpresa) return; setLoading(true); try { await api.put(`/rbac/empresas/${editingEmpresa.id}`, { nome: editingEmpresa.nome, cnpj: editingEmpresa.cnpj, status: editingEmpresa.status }); showToast?.("Empresa atualizada!", "success"); logAction?.("RBAC", `Editou empresa: ${editingEmpresa.nome}`); setEditingEmpresa(null); loadEmpresas(); } catch(e) { showToast?.("Erro ao atualizar.", "error"); } finally { setLoading(false); } };
  
  const deleteEmpresa = async (id, nome) => { 
    const isConfirmed = await confirm(`Excluir "${nome}"?`);
    if (!isConfirmed) return; 

    try { 
      await api.delete(`/rbac/empresas/${id}`); 
      showToast?.("Excluída!", "success"); 
      loadEmpresas(); 
    } catch(e) { 
      showToast?.(e.response?.data?.detail || "Erro.", "error"); 
    } 
  };

  // ── Perfis ──
  const handleCriarRole = async (e) => { e.preventDefault(); setLoading(true); try { await api.post("/rbac/roles", novaRole); showToast?.("Perfil criado!", "success"); setNovaRole({ nome: "", descricao: "", empresa_id: 1 }); loadRoles(); } catch(e) { showToast?.("Erro.", "error"); } finally { setLoading(false); } };
  const loadRolePermissoes = async (id) => { try { const r = await api.get(`/rbac/role-permissoes/${id}`); setRolePermissoes(r.data.permissao_ids || []); setSelectedRole(id); } catch(e) { console.error(e); } };
  const togglePermissaoRole = (id) => setRolePermissoes(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const salvarPermissoesRole = async () => { if (!selectedRole) return; setLoading(true); try { await api.post("/rbac/role-permissoes", { role_id: selectedRole, permissao_ids: rolePermissoes }); showToast?.("Permissões salvas!", "success"); } catch(e) { showToast?.("Erro.", "error"); } finally { setLoading(false); } };
  
  // Tratamento de Erro de Foreign Key na exclusão de Perfil + Modal Customizado
  const handleExcluirRole = async (id) => { 
    const isConfirmed = await confirm("Excluir perfil?");
    if (!isConfirmed) return; 

    try { 
      await api.delete(`/rbac/roles/${id}`); 
      showToast?.("Excluído!", "success"); 
      loadRoles(); 
      if (selectedRole === id) { 
        setSelectedRole(null); 
        setRolePermissoes([]); 
      } 
    } catch(e) { 
      const errorMsg = e.response?.data?.detail || String(e);
      if (typeof errorMsg === 'string' && (errorMsg.includes("foreign key constraint") || errorMsg.includes("violates foreign key"))) {
        showToast?.("Este perfil não pode ser excluído porque existem usuários vinculados a ele.", "error");
      } else {
        showToast?.(errorMsg || "Erro ao excluir o perfil.", "error");
      }
    } 
  };

  // ── Usuários ──
  const toggleMaster = async (id) => { try { await api.put(`/rbac/usuarios/${id}/toggle-master`); showToast?.("Status MASTER alterado!", "success"); loadUsuarios(); } catch(e) { showToast?.("Erro.", "error"); } };

  const toggleUserStatus = async (userId, nome, atualmenteAtivo) => {
    const acao = atualmenteAtivo ? "Inativar" : "Ativar";
    
    const isConfirmed = await confirm(`${acao} o usuário "${nome}"?`);
    if (!isConfirmed) return;

    try {
      await api.put(`/rbac/usuarios/${userId}/toggle-status`, { ativo: !atualmenteAtivo });
      showToast?.(`${nome} ${atualmenteAtivo ? 'inativado' : 'ativado'}!`, "success");
      logAction?.("RBAC", `${acao}ou usuário: ${nome}`);
      loadUsuarios();
    } catch(e) { 
      showToast?.(e.response?.data?.detail || `Erro ao ${acao.toLowerCase()}.`, "error"); 
    }
  };

  const resetUserPassword = async (userId, nome, senhaProvisoria = '123') => { 
    const senha = senhaProvisoria.trim() || '123'; 
    
    const isConfirmed = await confirm(`Resetar senha de "${nome}" para "${senha}"?`);
    if (!isConfirmed) return; 

    try { 
      await api.put(`/rbac/usuarios/${userId}/reset-password`, { nova_senha: senha }); 
      showToast?.(`Senha resetada!`, "success"); 
      logAction?.("RBAC", `Reset senha: ${nome}`); 
    } catch(e) { 
      showToast?.("Erro.", "error"); 
    } 
  };

  const saveEditUser = async () => {
    if (!editingUser) return; setLoading(true);
    try {
      if (editingUser.role_id_changed) await api.post("/rbac/role-permissoes", { role_id: editingUser.role_id, permissao_ids: [] }).catch(() => {});
      await api.put(`/rbac/usuarios/${editingUser.id}/empresa`, { empresa_id: editingUser.empresa_id });
      if (editingUser.is_master !== editingUser.original_is_master) await api.put(`/rbac/usuarios/${editingUser.id}/toggle-master`);
      if (editingUser.ativo !== editingUser.original_ativo) await api.put(`/rbac/usuarios/${editingUser.id}/toggle-status`, { ativo: editingUser.ativo });
      await api.put(`/users/${editingUser.id}/toggle-permission`).catch(() => {});
      showToast?.("Atualizado!", "success"); setEditingUser(null); loadUsuarios();
    } catch(e) { showToast?.("Erro.", "error"); } finally { setLoading(false); }
  };

  const handleCriarUsuario = async (e) => {
    e.preventDefault();
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.role_id || !novoUsuario.empresa_id) { showToast?.("Preencha todos os campos.", "error"); return; }
    setLoading(true);
    try { await api.post("/rbac/usuarios", { nome: novoUsuario.nome, email: novoUsuario.email, password: novoUsuario.password || '123', role_id: Number(novoUsuario.role_id), empresa_id: Number(novoUsuario.empresa_id), is_master: novoUsuario.is_master }); showToast?.(`"${novoUsuario.nome}" criado!`, "success"); setNovoUsuario({ nome: '', email: '', password: '123', role_id: '', empresa_id: '', is_master: false }); setCreatingUser(false); loadUsuarios(); }
    catch(e) { showToast?.(e.response?.data?.detail || "Erro.", "error"); } finally { setLoading(false); }
  };

  const deleteUser = async (id, nome, isMaster) => {
    if (isMaster) { showToast?.("Revogue MASTER primeiro.", "error"); return; }
    
    const isConfirmed = await confirm(`Excluir "${nome}"?`);
    if (!isConfirmed) return;

    try { 
      await api.delete(`/rbac/usuarios/${id}`); 
      showToast?.("Excluído!", "success"); 
      setUsuarios(prev => prev.filter(u => u.id !== id)); 
    } catch(e) { 
      showToast?.(e.response?.data?.detail || "Erro.", "error"); 
    }
  };

  const permissoesPorModulo = useMemo(() => { const map = {}; permissoes.forEach(p => { if (!map[p.modulo_slug]) map[p.modulo_slug] = { modulo_nome: p.modulo_nome, items: [] }; map[p.modulo_slug].items.push(p); }); return map; }, [permissoes]);

  // ── Estilos ──
  const s = {
    tabBar: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: 16 },
    tab: (active) => ({ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, border: active ? `1px solid ${C.primary}` : `1px solid ${C.border}`, background: active ? C.primary : '#FFFFFF', color: active ? '#FFFFFF' : C.subtle, boxShadow: active ? `0 4px 12px ${C.primary}33` : 'none' }),
    card: { background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" },
    sectionTitle: { fontSize: 16, fontWeight: 800, color: C.text, margin: "0 0 16px 0", display: 'flex', alignItems: 'center', gap: 10 },
    label: { fontSize: 10, color: C.muted, textTransform: 'uppercase', fontWeight: 800, letterSpacing: "0.08em", marginBottom: 6, display: 'block' },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FFFFFF", color: C.text, border: "1px solid #D4D5D6", outline: "none", transition: "border 0.2s", marginBottom: 12, boxSizing: 'border-box' },
    btn: (color = C.primary) => ({ padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', background: color, color: '#FFFFFF', boxShadow: `0 4px 10px ${color}33`, transition: "opacity 0.2s", display: 'flex', alignItems: 'center', gap: 6 }),
    badge: (active) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: active ? `${C.green}15` : `${C.red}15`, color: active ? C.green : C.red, border: `1px solid ${active ? C.green : C.red}40` }),
    masterBadge: { background: `${C.yellow}15`, color: C.yellow, border: `1px solid ${C.yellow}40`, padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 },
    checkbox: (checked) => ({ width: 18, height: 18, borderRadius: 4, cursor: 'pointer', appearance: 'none', border: checked ? `2px solid ${C.green}` : '2px solid #D4D5D6', background: checked ? C.green : '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', flexShrink: 0, transition: "all 0.2s", backgroundImage: checked ? `url('data:image/svg+xml;utf8,<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')` : 'none', backgroundPosition: 'center', backgroundSize: '80%', backgroundRepeat: 'no-repeat' }),
    di: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', fontSize: 12, fontWeight: 600, color: C.text, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 6, transition: "background 0.15s" },
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(42, 43, 45, 0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modalContent: { background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" },
    th: { padding: '12px 14px', fontSize: 10, color: C.muted, textAlign: 'left', borderBottom: `1px solid ${C.border}`, fontWeight: 800, textTransform: 'uppercase', letterSpacing: "0.08em", background: "#F9FAFB" },
    td: { padding: '12px 14px', fontSize: 13, color: C.subtle, borderBottom: `1px solid ${C.border}` }
  };

  if (!currentUser?.is_master && currentUser?.role !== 'admin') {
    return (<div style={{ ...s.card, textAlign: 'center', padding: 60 }}><IconBadge name="lock" color={C.red} size={56} /><h2 style={{ color: C.red, marginTop: 16, fontSize: 20, fontWeight: 800 }}>Acesso Restrito</h2><p style={{ color: C.subtle, fontSize: 14, marginTop: 8 }}>Apenas MASTER ou Administradores.</p></div>);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <IconBadge name="shield" color={C.primary} size={40} />
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, display: "flex", alignItems: "center", gap: 12 }}>
            Administração do Sistema
            {currentUser?.is_master && <span style={s.masterBadge}><Icon name="crown" size={12} color={C.yellow} /> MASTER</span>}
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.subtle, fontWeight: 600 }}>Controle de Acesso Baseado em Perfis • Multiempresa</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        {[{ key: 'empresas', icon: 'building', label: 'Empresas' }, { key: 'modulos', icon: 'package', label: 'Módulos' }, { key: 'perfis', icon: 'masks', label: 'Perfis' }, { key: 'usuarios', icon: 'user', label: 'Usuários' }, { key: 'logs', icon: 'scroll', label: 'Logs' }].map(t => (
          <button key={t.key} style={s.tab(activeSection === t.key)} onClick={() => setActiveSection(t.key)}>
            <Icon name={t.icon} size={15} color={activeSection === t.key ? "#FFF" : C.subtle} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── EMPRESAS ── */}
      {activeSection === "empresas" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={s.card}>
            <h3 style={s.sectionTitle}><IconBadge name="plus" color={C.green} size={28} /> Nova Empresa</h3>
            <form onSubmit={handleCriarEmpresa}>
              <label style={s.label}>Nome</label><input style={s.input} value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>CNPJ</label><input style={s.input} value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} required onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>Status</label><select style={s.input} value={novaEmpresa.status} onChange={e => setNovaEmpresa({...novaEmpresa, status: e.target.value})}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select>
              <button type="submit" style={{...s.btn(), width: "100%", justifyContent: 'center'}} disabled={loading}>CRIAR EMPRESA</button>
            </form>
          </div>
          <div>
            <div style={{...s.card, padding: 0, overflow: "hidden"}}>
              <div style={{ padding: "20px 24px" }}><h3 style={{...s.sectionTitle, margin: 0}}><IconBadge name="building" color={C.blue} size={28} /> Empresas ({empresas.length})</h3></div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['ID', 'Nome', 'CNPJ', 'Status', 'Ações'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{empresas.map(emp => (
                  <tr key={emp.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...s.td, color: C.muted, fontWeight: 700 }}>{emp.id}</td>
                    <td style={{ ...s.td, color: C.text, fontWeight: 800 }}>{emp.nome}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{emp.cnpj}</td>
                    <td style={s.td}><span style={s.badge(emp.status === 'Ativo')}>{emp.status}</span></td>
                    <td style={s.td}><div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...s.btn(C.blue), padding: '6px 12px', fontSize: 11 }} onClick={() => loadEmpresaModulos(emp.id)}><Icon name="settings" size={13} color="#FFF" /> Módulos</button>
                      <button style={{ ...s.btn(C.yellow), padding: '6px 12px', fontSize: 11 }} onClick={() => setEditingEmpresa({ ...emp })}><Icon name="pencil" size={13} color="#FFF" /></button>
                      <button style={{ ...s.btn(C.red), padding: '6px 12px', fontSize: 11 }} onClick={() => deleteEmpresa(emp.id, emp.nome)}><Icon name="trash" size={13} color="#FFF" /></button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {selectedEmpresa && (
              <div style={s.card}>
                <h3 style={s.sectionTitle}><IconBadge name="package" color={C.green} size={28} /> Módulos — {empresas.find(e => e.id === selectedEmpresa)?.nome}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>{empresaModulos.map(mod => (
                  <div key={mod.id} onClick={() => toggleModuloEmpresa(mod.id, mod.liberado)} style={{ padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', background: mod.liberado ? `${C.green}15` : '#F9FAFB', border: `1px solid ${mod.liberado ? `${C.green}40` : C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{mod.icone}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: mod.liberado ? C.green : C.subtle }}>{mod.nome}</div><div style={{ fontSize: 10, color: C.muted }}>{mod.slug}</div></div>
                    <span style={s.badge(mod.liberado)}>{mod.liberado ? 'ON' : 'OFF'}</span>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
          {editingEmpresa && (
            <div style={s.modalOverlay}><div style={{ ...s.modalContent, width: 400 }}>
              <h3 style={s.sectionTitle}><Icon name="pencil" size={18} color={C.primary} /> Editar Empresa</h3>
              <label style={s.label}>Nome</label><input style={s.input} value={editingEmpresa.nome} onChange={e => setEditingEmpresa({...editingEmpresa, nome: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>CNPJ</label><input style={s.input} value={editingEmpresa.cnpj} onChange={e => setEditingEmpresa({...editingEmpresa, cnpj: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>Status</label><select style={s.input} value={editingEmpresa.status} onChange={e => setEditingEmpresa({...editingEmpresa, status: e.target.value})}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle, boxShadow: 'none' }} onClick={() => setEditingEmpresa(null)}>Cancelar</button>
                <button style={s.btn()} onClick={saveEditEmpresa} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div></div>
          )}
        </div>
      )}

      {/* ── MÓDULOS ── */}
      {activeSection === "modulos" && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}><IconBadge name="package" color={C.primary} size={28} /> Módulos ({modulos.length})</h3>
          <input placeholder="Buscar módulo..." value={moduloSearch} onChange={e => setModuloSearch(e.target.value)} style={{ ...s.input, maxWidth: 400 }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {modulos.filter(m => !moduloSearch || m.nome.toLowerCase().includes(moduloSearch.toLowerCase()) || m.slug.toLowerCase().includes(moduloSearch.toLowerCase())).map(m => (
              <div key={m.id} style={{ padding: 16, borderRadius: 12, background: m.ativo ? `${C.green}05` : `${C.red}05`, border: `1px solid ${m.ativo ? `${C.green}30` : `${C.red}30`}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{m.icone}</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{m.nome}</div>
                <div style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>{m.slug}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{m.descricao}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PERFIS ── */}
      {activeSection === "perfis" && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <div>
            <div style={s.card}>
              <h3 style={s.sectionTitle}><IconBadge name="plus" color={C.green} size={28} /> Novo Perfil</h3>
              <form onSubmit={handleCriarRole}>
                <label style={s.label}>Nome</label><input style={s.input} value={novaRole.nome} onChange={e => setNovaRole({...novaRole, nome: e.target.value})} required placeholder="Ex: Operador" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>Descrição</label><input style={s.input} value={novaRole.descricao} onChange={e => setNovaRole({...novaRole, descricao: e.target.value})} placeholder="Opcional" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <button type="submit" style={{...s.btn(), width: "100%", justifyContent: 'center'}} disabled={loading}>CRIAR PERFIL</button>
              </form>
            </div>
            <div style={s.card}>
              <h3 style={s.sectionTitle}><IconBadge name="masks" color={C.purple} size={28} /> Perfis ({roles.length})</h3>
              {roles.map(r => (
                <div key={r.id} onClick={() => loadRolePermissoes(r.id)} style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 8, background: selectedRole === r.id ? `${C.primary}10` : '#F9FAFB', border: `1px solid ${selectedRole === r.id ? C.primary : C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: "all 0.2s" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 800, color: selectedRole === r.id ? C.primary : C.text }}>{r.nome}</div>{r.descricao && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.descricao}</div>}</div>
                  <button onClick={(e) => { e.stopPropagation(); handleExcluirRole(r.id); }} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="x" size={14} color={C.red} /></button>
                </div>
              ))}
            </div>
          </div>
          <div style={s.card}>
            {selectedRole ? (<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ ...s.sectionTitle, margin: 0 }}><IconBadge name="lock" color={C.primary} size={28} /> Permissões — {roles.find(r => r.id === selectedRole)?.nome}</h3>
                <button style={s.btn()} onClick={salvarPermissoesRole} disabled={loading}><Icon name="save" size={14} color="#FFF" /> {loading ? 'SALVANDO...' : 'SALVAR'}</button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button style={{ ...s.btn(C.green), padding: '8px 16px', fontSize: 11 }} onClick={() => setRolePermissoes(permissoes.map(p => p.id))}><Icon name="checkAll" size={13} color="#FFF" /> Marcar Todos</button>
                <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle, padding: '8px 16px', fontSize: 11, boxShadow: 'none' }} onClick={() => setRolePermissoes([])}><Icon name="x" size={13} /> Desmarcar</button>
              </div>
              <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 10 }}>
                {Object.entries(permissoesPorModulo).map(([slug, group]) => (
                  <div key={slug} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: C.primary, marginBottom: 12, borderLeft: `4px solid ${C.primary}`, paddingLeft: 12, textTransform: 'uppercase', letterSpacing: "0.08em" }}>{group.modulo_nome}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, paddingLeft: 16 }}>
                      {group.items.map(p => { const ck = rolePermissoes.includes(p.id); return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, background: ck ? `${C.green}10` : '#F9FAFB', border: `1px solid ${ck ? `${C.green}40` : C.border}`, transition: 'all 0.15s' }}>
                          <input type="checkbox" checked={ck} onChange={() => togglePermissaoRole(p.id)} style={s.checkbox(ck)} />
                          <span style={{ fontSize: 12, color: ck ? C.green : C.subtle, fontWeight: ck ? 800 : 600 }}>{p.nome.split(' ')[0]}</span>
                        </label>
                      ); })}
                    </div>
                  </div>
                ))}
              </div>
            </>) : (
              <div style={{ textAlign: 'center', padding: 80, color: C.muted }}><IconBadge name="masks" color={C.muted} size={56} /><p style={{ marginTop: 16, fontSize: 15, fontWeight: 700 }}>Selecione um perfil para gerenciar permissões</p></div>
            )}
          </div>
        </div>
      )}

      {/* ── USUÁRIOS ── */}
      {activeSection === "usuarios" && (
        <div style={{ ...s.card, padding: 0, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ ...s.sectionTitle, margin: 0 }}><IconBadge name="user" color={C.blue} size={28} /> Usuários ({usuarios.length})</h3>
            <button onClick={() => { setCreatingUser(true); setNovoUsuario({ nome: '', email: '', password: '123', role_id: roles[0]?.id || '', empresa_id: empresas[0]?.id || '', is_master: false }); }} style={{ ...s.btn(C.green), padding: '10px 20px' }}><Icon name="plus" size={14} color="#FFF" /> Novo Usuário</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['ID', 'Nome', 'E-mail', 'Empresa', 'Perfil', 'Master', 'Status', ''].map((h, i) => <th key={i} style={{ ...s.th, ...(h === '' ? { width: 48 } : {}) }}>{h}</th>)}</tr></thead>
              <tbody>{usuarios.map(u => (
                <tr key={u.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...s.td, color: C.muted, fontWeight: 700 }}>{u.id}</td>
                  <td style={{ ...s.td, color: C.text, fontWeight: 800 }}>{u.nome}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.empresa_nome}</td>
                  <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: u.role === 'admin' ? `${C.red}15` : u.role === 'gestor' ? `${C.blue}15` : `${C.muted}15`, color: u.role === 'admin' ? C.red : u.role === 'gestor' ? C.blue : C.subtle, border: `1px solid ${u.role === 'admin' ? C.red : u.role === 'gestor' ? C.blue : C.muted}40`, textTransform: 'uppercase' }}>{u.role}</span></td>
                  <td style={s.td}>{u.is_master ? <span style={s.masterBadge}><Icon name="crown" size={11} color={C.yellow} /> MASTER</span> : <span style={{ color: C.muted }}>—</span>}</td>
                  <td style={s.td}><span style={s.badge(u.ativo)}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                  <td style={{ ...s.td, textAlign: "center" }}>
                    <ActionsDropdown id={u.id} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}>
                      <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); setEditingUser({ ...u, original_is_master: u.is_master, original_ativo: u.ativo, role_id_changed: false, resetSenha: '' }); }} style={s.di} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Icon name="pencil" size={14} /> Editar
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); resetUserPassword(u.id, u.nome); }} style={s.di} onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Icon name="key" size={14} /> Reset Senha
                      </button>
                      <div style={{ height: 1, background: C.border, margin: "2px 6px" }} />
                      <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); toggleUserStatus(u.id, u.nome, u.ativo); }} style={{ ...s.di, color: u.ativo ? C.yellow : C.green }} onMouseEnter={e => e.currentTarget.style.background = u.ativo ? "rgba(245,158,11,0.06)" : "rgba(34,160,107,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Icon name={u.ativo ? "toggleOff" : "toggleOn"} size={14} color={u.ativo ? C.yellow : C.green} />
                        {u.ativo ? 'Inativar' : 'Ativar'}
                      </button>
                      {currentUser?.is_master && u.id !== currentUser.id && (
                        <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); toggleMaster(u.id); }} style={{ ...s.di, color: u.is_master ? C.red : C.green }} onMouseEnter={e => e.currentTarget.style.background = u.is_master ? "rgba(217,48,37,0.06)" : "rgba(34,160,107,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <Icon name="crown" size={14} color={u.is_master ? C.red : C.green} /> {u.is_master ? 'Revogar Master' : 'Tornar Master'}
                        </button>
                      )}
                      {currentUser?.is_master && u.id !== currentUser.id && !u.is_master && (<>
                        <div style={{ height: 1, background: C.border, margin: "2px 6px" }} />
                        <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(null); deleteUser(u.id, u.nome, u.is_master); }} style={{ ...s.di, color: C.red }} onMouseEnter={e => e.currentTarget.style.background = "rgba(217,48,37,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <Icon name="trash" size={14} color={C.red} /> Excluir Usuário
                        </button>
                      </>)}
                    </ActionsDropdown>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* Modal Criar */}
          {creatingUser && (
            <div style={s.modalOverlay}><div style={{ ...s.modalContent, width: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}><IconBadge name="plus" color={C.green} size={28} /> Novo Usuário</h3>
                <button onClick={() => setCreatingUser(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="x" size={20} color={C.muted} /></button>
              </div>
              <form onSubmit={handleCriarUsuario}>
                <label style={s.label}>Nome *</label><input style={s.input} value={novoUsuario.nome} onChange={e => setNovoUsuario({...novoUsuario, nome: e.target.value})} required placeholder="Nome" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>E-mail *</label><input style={s.input} type="email" value={novoUsuario.email} onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})} required placeholder="email@empresa.com" onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <label style={s.label}>Senha Inicial</label><input style={s.input} value={novoUsuario.password} onChange={e => setNovoUsuario({...novoUsuario, password: e.target.value})} placeholder='123' onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
                <p style={{ fontSize: 11, color: C.subtle, marginTop: -6, marginBottom: 16 }}>Troca obrigatória no primeiro login.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div><label style={s.label}>Empresa *</label><select style={s.input} value={novoUsuario.empresa_id} onChange={e => setNovoUsuario({...novoUsuario, empresa_id: Number(e.target.value)})} required><option value="">Selecione...</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></div>
                  <div><label style={s.label}>Perfil *</label><select style={s.input} value={novoUsuario.role_id} onChange={e => setNovoUsuario({...novoUsuario, role_id: Number(e.target.value)})} required><option value="">Selecione...</option>{roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <input type="checkbox" checked={novoUsuario.is_master} onChange={e => setNovoUsuario({...novoUsuario, is_master: e.target.checked})} style={s.checkbox(novoUsuario.is_master)} />
                  <Icon name="crown" size={14} color={C.yellow} /> Acesso MASTER
                </label>
                <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'flex-end' }}>
                  <button type="button" style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle, boxShadow: 'none' }} onClick={() => setCreatingUser(false)}>Cancelar</button>
                  <button type="submit" style={s.btn(C.green)} disabled={loading}>{loading ? 'Criando...' : 'Criar Usuário'}</button>
                </div>
              </form>
            </div></div>
          )}

          {/* Modal Editar */}
          {editingUser && (
            <div style={s.modalOverlay}><div style={{ ...s.modalContent, width: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ ...s.sectionTitle, marginBottom: 0 }}><IconBadge name="pencil" color={C.primary} size={28} /> Editar Usuário</h3>
                <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="x" size={20} color={C.muted} /></button>
              </div>
              <label style={s.label}>Nome</label><input style={s.input} value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value})} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
              <label style={s.label}>E-mail</label><input style={{...s.input, opacity: 0.6, cursor: 'not-allowed', background: "#F9FAFB"}} value={editingUser.email} disabled />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={s.label}>Empresa</label><select style={s.input} value={editingUser.empresa_id || ''} onChange={e => setEditingUser({...editingUser, empresa_id: Number(e.target.value)})}>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></div>
                <div><label style={s.label}>Perfil</label><select style={s.input} value={editingUser.role_id || ''} onChange={e => setEditingUser({...editingUser, role_id: Number(e.target.value), role_id_changed: true})}>{roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', flexDirection: "column", gap: 12, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <input type="checkbox" checked={editingUser.is_master || false} onChange={e => setEditingUser({...editingUser, is_master: e.target.checked})} style={s.checkbox(editingUser.is_master)} />
                  <Icon name="crown" size={14} color={C.yellow} /> Acesso MASTER
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: "#F9FAFB", padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <input type="checkbox" checked={editingUser.canEdit || false} onChange={e => setEditingUser({...editingUser, canEdit: e.target.checked})} style={s.checkbox(editingUser.canEdit)} />
                  <Icon name="pencil" size={14} color={C.blue} /> Permissão de Edição
                </label>
                <label onClick={() => setEditingUser({...editingUser, ativo: !editingUser.ativo})} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', padding: '12px 16px', borderRadius: 10, background: editingUser.ativo ? `${C.green}10` : `${C.red}10`, border: `1px solid ${editingUser.ativo ? `${C.green}30` : `${C.red}30`}`, color: editingUser.ativo ? C.green : C.red, fontWeight: 800, transition: 'all 0.2s' }}>
                  <Icon name={editingUser.ativo ? "toggleOn" : "toggleOff"} size={18} color={editingUser.ativo ? C.green : C.red} />
                  {editingUser.ativo ? 'Conta Ativa' : 'Conta Inativa'}
                </label>
              </div>
              <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: `${C.blue}05`, border: `1px solid ${C.blue}30` }}>
                <label style={{ ...s.label, color: C.blue, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="key" size={13} color={C.blue} /> Reset de Senha</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input style={{ ...s.input, marginBottom: 0, flex: 1, borderColor: `${C.blue}40` }} value={editingUser.resetSenha || ''} onChange={e => setEditingUser({...editingUser, resetSenha: e.target.value})} placeholder="Senha provisória (ex: 123)" onFocus={e => e.target.style.borderColor = C.blue} onBlur={e => e.target.style.borderColor = `${C.blue}40`} />
                  <button onClick={() => resetUserPassword(editingUser.id, editingUser.nome, editingUser.resetSenha || '123')} style={{ ...s.btn(C.blue), whiteSpace: 'nowrap' }}><Icon name="refresh" size={13} color="#FFF" /> Resetar</button>
                </div>
                <p style={{ fontSize: 11, color: C.subtle, marginTop: 8, marginBottom: 0 }}>Troca obrigatória no próximo login.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'flex-end' }}>
                <button style={{ ...s.btn('#F9FAFB'), border: `1px solid ${C.border}`, color: C.subtle, boxShadow: 'none' }} onClick={() => setEditingUser(null)}>Cancelar</button>
                <button style={s.btn()} onClick={saveEditUser} disabled={loading}><Icon name="save" size={14} color="#FFF" /> {loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div></div>
          )}
        </div>
      )}

      {/* ── LOGS ── */}
      {activeSection === "logs" && (
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ ...s.sectionTitle, margin: 0 }}><IconBadge name="scroll" color={C.purple} size={28} /> Logs de Acesso</h3>
            <button style={{ ...s.btn(C.blue), padding: '8px 16px', fontSize: 11 }} onClick={loadLogs}><Icon name="refresh" size={13} color="#FFF" /> Atualizar</button>
          </div>
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Data', 'Usuário', 'Empresa', 'Ação', 'Detalhe'].map(h => <th key={h} style={{ ...s.th, position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{logs.map(l => (
                <tr key={l.id} style={{ transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ ...s.td, color: C.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{l.data?.slice(0, 19).replace("T", " ")}</td>
                  <td style={{ ...s.td, fontWeight: 800 }}>{l.usuario || '—'}</td>
                  <td style={s.td}>{l.empresa || '—'}</td>
                  <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}40` }}>{l.acao}</span></td>
                  <td style={{ ...s.td, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.detalhe || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
            {logs.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Nenhum log registrado</div>}
          </div>
        </div>
      )}
    </div>
  );
}