import React, { useState, useEffect, useMemo } from "react";
import { api } from "./api";

// ============================================================
// AdminRBAC.jsx — Painel Administrativo RBAC
// Usado pela aba "admin_rbac" no App.jsx
// ============================================================

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
    tabBar: { display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' },
    tab: (active) => ({
      padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', border: 'none', transition: 'all 0.2s',
      background: active ? '#eab308' : 'rgba(255,255,255,0.06)',
      color: active ? '#000' : '#94a3b8',
      boxShadow: active ? '0 4px 12px rgba(234,179,8,0.3)' : 'none'
    }),
    card: {
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24, marginBottom: 16
    },
    sectionTitle: { fontSize: 16, fontWeight: 700, color: '#eab308', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
    label: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4, display: 'block' },
    input: { ...styles.inputSmall, marginBottom: 10 },
    btn: (color = '#eab308') => ({
      padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 12,
      border: 'none', cursor: 'pointer', background: color, color: color === '#eab308' ? '#000' : '#fff',
      boxShadow: `0 4px 12px ${color}44`
    }),
    badge: (active) => ({
      display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 10,
      fontWeight: 700, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
      background: active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
    }),
    masterBadge: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: '#000', padding: '3px 10px', borderRadius: 6,
      fontSize: 10, fontWeight: 800
    },
    checkbox: (checked) => ({
      width: 18, height: 18, borderRadius: 4, cursor: 'pointer', appearance: 'none',
      border: checked ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.2)',
      background: checked ? '#10b981' : 'transparent',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      verticalAlign: 'middle', position: 'relative', flexShrink: 0
    })
  };

  // Verificação de acesso
  if (!currentUser?.is_master && currentUser?.role !== 'admin') {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: 60 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <h2 style={{ color: '#f87171', marginTop: 16, fontSize: 18 }}>Acesso Restrito</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
          Apenas usuários MASTER ou Administradores podem acessar este painel.
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>🛡️</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#f1f5f9', fontWeight: 700 }}>Administração do Sistema</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Controle de Acesso Baseado em Perfis • Multiempresa</p>
        </div>
        {currentUser?.is_master && <span style={s.masterBadge}>👑 MASTER</span>}
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
              <input style={s.input} value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} required />
              <label style={s.label}>CNPJ</label>
              <input style={s.input} value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} required />
              <label style={s.label}>Status</label>
              <select style={s.input} value={novaEmpresa.status} onChange={e => setNovaEmpresa({...novaEmpresa, status: e.target.value})}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
              <button type="submit" style={s.btn()} disabled={loading}>CRIAR EMPRESA</button>
            </form>
          </div>

          {/* Lista + Módulos */}
          <div>
            <div style={s.card}>
              <h3 style={s.sectionTitle}>🏢 Empresas Cadastradas ({empresas.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'Nome', 'CNPJ', 'Status', 'Módulos'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresas.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{emp.id}</td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{emp.nome}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{emp.cnpj}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={s.badge(emp.status === 'Ativo')}>{emp.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button
                          style={{ ...s.btn('#3b82f6'), padding: '6px 14px', fontSize: 10 }}
                          onClick={() => loadEmpresaModulos(emp.id)}
                        >
                          ⚙️ Gerenciar
                        </button>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {empresaModulos.map(mod => (
                    <div
                      key={mod.id}
                      onClick={() => toggleModuloEmpresa(mod.id, mod.liberado)}
                      style={{
                        padding: '12px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                        background: mod.liberado ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${mod.liberado ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', alignItems: 'center', gap: 10
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{mod.icone}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: mod.liberado ? '#10b981' : '#64748b' }}>{mod.nome}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>{mod.slug}</div>
                      </div>
                      <span style={s.badge(mod.liberado)}>{mod.liberado ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: MÓDULOS (leitura) */}
      {/* ============================================================ */}
      {activeSection === "modulos" && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}>📦 Módulos do Sistema ({modulos.length})</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Estes são todos os módulos registrados. Para liberar por empresa, use a aba Empresas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {modulos.map(m => (
              <div key={m.id} style={{
                padding: '14px 16px', borderRadius: 12,
                background: m.ativo ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${m.ativo ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icone}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{m.nome}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.slug}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{m.descricao}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: PERFIS & PERMISSÕES */}
      {/* ============================================================ */}
      {activeSection === "perfis" && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          {/* Coluna esquerda: Criar + Lista de Roles */}
          <div>
            <div style={s.card}>
              <h3 style={s.sectionTitle}>➕ Novo Perfil</h3>
              <form onSubmit={handleCriarRole}>
                <label style={s.label}>Nome</label>
                <input style={s.input} value={novaRole.nome} onChange={e => setNovaRole({...novaRole, nome: e.target.value})} required placeholder="Ex: Operador" />
                <label style={s.label}>Descrição</label>
                <input style={s.input} value={novaRole.descricao} onChange={e => setNovaRole({...novaRole, descricao: e.target.value})} placeholder="Opcional" />
                <button type="submit" style={s.btn()} disabled={loading}>CRIAR PERFIL</button>
              </form>
            </div>

            <div style={s.card}>
              <h3 style={s.sectionTitle}>🎭 Perfis ({roles.length})</h3>
              {roles.map(r => (
                <div
                  key={r.id}
                  onClick={() => loadRolePermissoes(r.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                    background: selectedRole === r.id ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedRole === r.id ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === r.id ? '#eab308' : '#f1f5f9' }}>{r.nome}</div>
                    {r.descricao && <div style={{ fontSize: 10, color: '#64748b' }}>{r.descricao}</div>}
                  </div>
                  {!['admin', 'gestor', 'consultor'].includes(r.nome.toLowerCase()) && (
                    <button onClick={(e) => { e.stopPropagation(); handleExcluirRole(r.id); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita: Permissões da Role selecionada */}
          <div style={s.card}>
            {selectedRole ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={s.sectionTitle}>
                    🔐 Permissões — {roles.find(r => r.id === selectedRole)?.nome || ''}
                  </h3>
                  <button style={s.btn()} onClick={salvarPermissoesRole} disabled={loading}>
                    {loading ? '⌛ SALVANDO...' : '💾 SALVAR PERMISSÕES'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button style={{ ...s.btn('#10b981'), padding: '6px 14px', fontSize: 10 }}
                    onClick={() => setRolePermissoes(permissoes.map(p => p.id))}>
                    ✅ Marcar Todos
                  </button>
                  <button style={{ ...s.btn('#ef4444'), padding: '6px 14px', fontSize: 10 }}
                    onClick={() => setRolePermissoes([])}>
                    ✖ Desmarcar Todos
                  </button>
                </div>

                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {Object.entries(permissoesPorModulo).map(([slug, group]) => (
                    <div key={slug} style={{ marginBottom: 14 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#eab308', marginBottom: 8,
                        borderLeft: '3px solid #eab308', paddingLeft: 10, textTransform: 'uppercase'
                      }}>
                        {group.modulo_nome}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, paddingLeft: 13 }}>
                        {group.items.map(p => {
                          const checked = rolePermissoes.includes(p.id);
                          return (
                            <label key={p.id} style={{
                              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px',
                              borderRadius: 8, background: checked ? 'rgba(16,185,129,0.08)' : 'transparent',
                              border: `1px solid ${checked ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                              transition: 'all 0.15s'
                            }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermissaoRole(p.id)}
                                style={s.checkbox(checked)}
                              />
                              <span style={{ fontSize: 11, color: checked ? '#10b981' : '#94a3b8', fontWeight: checked ? 600 : 400 }}>
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
              <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
                <span style={{ fontSize: 48 }}>🎭</span>
                <p style={{ marginTop: 12, fontSize: 13 }}>Selecione um perfil à esquerda para gerenciar suas permissões</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: USUÁRIOS */}
      {/* ============================================================ */}
      {activeSection === "usuarios" && (
        <div style={s.card}>
          <h3 style={s.sectionTitle}>👤 Usuários do Sistema ({usuarios.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Nome', 'E-mail', 'Empresa', 'Perfil', 'Master', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: 10, color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{u.id}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{u.nome}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px', fontSize: 11, color: '#94a3b8' }}>{u.empresa_nome}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: u.role === 'admin' ? 'rgba(248,113,113,0.15)' : u.role === 'gestor' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                      color: u.role === 'admin' ? '#f87171' : u.role === 'gestor' ? '#60a5fa' : '#94a3b8',
                      textTransform: 'uppercase'
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {u.is_master ? <span style={s.masterBadge}>👑 MASTER</span> : <span style={{ fontSize: 11, color: '#475569' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={s.badge(u.ativo)}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {currentUser?.is_master && u.id !== currentUser.id && (
                      <button
                        onClick={() => toggleMaster(u.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          background: u.is_master ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                          color: u.is_master ? '#ef4444' : '#eab308',
                          border: `1px solid ${u.is_master ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`
                        }}
                      >
                        {u.is_master ? '⬇ Revogar MASTER' : '⬆ Promover MASTER'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO: LOGS */}
      {/* ============================================================ */}
      {activeSection === "logs" && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={s.sectionTitle}>📜 Logs de Acesso</h3>
            <button style={{ ...s.btn('#3b82f6'), padding: '6px 14px', fontSize: 10 }} onClick={loadLogs}>🔄 Atualizar</button>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Data', 'Usuário', 'Empresa', 'Ação', 'Detalhe'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 10, color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, textTransform: 'uppercase', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.5)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{l.data?.slice(0, 19)}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#f1f5f9' }}>{l.usuario || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#94a3b8' }}>{l.empresa || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{l.acao}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#94a3b8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.detalhe || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>Nenhum log registrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}