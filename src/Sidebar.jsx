import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, ChevronRight, LogOut, Search,
  LayoutDashboard, Calculator, Tags, Key, 
  PieChart, Receipt, HandCoins, Landmark, BookOpen, Building2,
  Briefcase, Contact, CarFront, Users, FileSignature, UserCog,
  Layers, FileText, RefreshCw, Sliders, Headphones, ShieldCheck,
  Package, BarChart3, Crown, FileCog, Grip 
} from "lucide-react";

// Importe o seu novo Mega Menu (ajuste o caminho se necessário)
import OmniLauncher from "./components/OmniLauncher"; 

const C = {
  primary: "#F26B25",
  primaryLight: "rgba(242, 107, 37, 0.08)", 
  primaryActive: "rgba(242, 107, 37, 0.12)", 
  text: "#0f172a",
  muted: "#94a3b8",
  subtle: "#475569",
  border: "#e2e8f0",
  bg: "#FFFFFF",
  bgAlt: "#f8fafc" 
};

const scrollbarStyles = `
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }
  .sidebar-nav::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px 0;
  }
  .sidebar-nav::-webkit-scrollbar-thumb {
    background-color: ${C.border};
    border-radius: 10px;
    border: 1px solid transparent;
    background-clip: content-box;
  }
  .sidebar-nav::-webkit-scrollbar-thumb:hover {
    background-color: ${C.muted};
  }
`;

function GroupTitle({ children, isOpen }) {
  return (
    <div style={{
      display: isOpen ? "block" : "none",
      padding: "20px 20px 8px 20px",
      fontSize: "10px",
      color: C.muted,
      textTransform: "uppercase",
      fontWeight: "800",
      letterSpacing: "0.15em",
      whiteSpace: "nowrap"
    }}>
      {children}
    </div>
  );
}

function NavItem({ active, onClick, label, icon: Icon, href, isOpen }) {
  const baseStyle = {
    backgroundColor: active ? C.primaryLight : "transparent",
    border: active ? "1px solid rgba(242, 107, 37, 0.2)" : "1px solid transparent",
    color: active ? C.primary : C.subtle,
    padding: isOpen ? "10px 16px" : "10px 0",
    margin: isOpen ? "4px 16px" : "4px 12px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: active ? "700" : "500",
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: isOpen ? "flex-start" : "center",
    transition: "all 0.2s ease-in-out",
    overflow: "hidden",
  };
  const handleMouseEnter = (e) => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(242, 107, 37, 0.05)"; e.currentTarget.style.color = C.primary; } };
  const handleMouseLeave = (e) => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.subtle; } };
  const content = (
    <>
      <Icon strokeWidth={1.3} style={{ marginRight: isOpen ? 10 : 0, minWidth: 18, width: 18, height: 18, flexShrink: 0, transition: "margin 0.2s ease-in-out" }} />
      <span style={{ 
        display: isOpen ? "block" : "none", 
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        opacity: isOpen ? 1 : 0, 
        transition: "opacity 0.2s",
        minWidth: 0,
      }}>{label}</span>
    </>
  );
  if (href) return (<a href={href} target="_blank" rel="noopener noreferrer" style={baseStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} title={label}>{content}</a>);
  return (<div onClick={onClick} style={baseStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} title={label}>{content}</div>);
}

const ALL_NAV_ITEMS = [
  { group: "Geral", key: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "all" },
  { group: "Geral", key: "calculadora", label: "Calculadora", icon: Calculator, permission: "all" },
  { group: "Geral", key: "estoque_vendas", label: "Estoque de Vendas", icon: Tags, permission: "all" },
  { group: "Geral", key: "estoque_locacao", label: "Estoque de Locação", icon: Key, permission: "all" },
  { group: "Financeiro", key: "financeiro_dashboard", label: "Dashboard Financeiro", icon: PieChart, permission: "all", extra: "loadDashFin" },
  { group: "Financeiro", key: "financeiro_pagar", label: "Contas a Pagar", icon: Receipt, permission: "all" },
  { group: "Financeiro", key: "financeiro_receber", label: "Contas a Receber", icon: HandCoins, permission: "all" },
  { group: "Financeiro", key: "contas_bancarias", label: "Contas Bancárias", icon: Landmark, permission: "all" },
  { group: "Financeiro", key: "config_contabil", label: "Plano de Contas", icon: BookOpen, permission: "all" },
  { group: "Financeiro", key: "fornecedores", label: "Fornecedores", icon: Building2, permission: "all" },
  { group: "Recursos Humanos", key: "rh", label: "OmniRH", icon: Briefcase, permission: "gestao" },
  { group: "Recursos Humanos", key: "dossier", label: "Dossiê do Colaborador", icon: Contact, permission: "gestao" },
  { group: "Gestão", key: "comercial", label: "Gestão Comercial", icon: BarChart3, permission: "gestao" },
  { group: "Gestão", key: "frota", label: "Gestão de Frota", icon: CarFront, permission: "gestao" },
  { group: "Gestão", key: "gestao_clientes", label: "Gestão de Clientes", icon: Users, permission: "gestao" },
  { group: "Gestão", key: "gestao_contratos", label: "Gestão de Contratos", icon: FileSignature, permission: "gestao" },
  { group: "Gestão", key: "gestao_usuarios", label: "Gestão de Usuários", icon: UserCog, permission: "gestao" },
  { group: "Gestão", key: "gestao_ativos", label: "Gestão de Ativos", icon: Layers, permission: "gestao" },
  { group: "Gestão", key: "gestao_estoque", label: "Gestão de Estoque", icon: Package, permission: "gestao" },
  { group: "Gestão", key: "relatorios", label: "Relatórios", icon: FileText, permission: "gestao" },
  { group: "Gestão", key: "gestao_relatorios", label: "Gerenciador de Relatórios", icon: FileCog, permission: "gestao" },
  { group: "Gestão", key: "centro_comando", label: "Centro de Comando", icon: Crown, permission: "franqueador" },
  { group: "Sistema", key: "fipe", label: "Atualizar FIPE", icon: RefreshCw, permission: "admin" },
  { group: "Sistema", key: "config_sistema", label: "Personalização", icon: Sliders, permission: "admin" },
  { group: "Sistema", key: "admin_rbac", label: "Administração do Sistema", icon: ShieldCheck, permission: "admin" },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser, loadDashFin, loadClientes, styles, onLogout, LogoOmni, isOpen, setIsOpen }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLauncherOpen, setIsLauncherOpen] = useState(false); // ESTADO DO MEGA MENU

  const hasPermission = (item) => {
    if (item.permission === "all") return true;
    if (item.permission === "gestao") return currentUser?.is_master || currentUser?.role === "admin" || currentUser?.role === "gestor";
    if (item.permission === "admin") return currentUser?.is_master || currentUser?.role === "admin";
    if (item.permission === "franqueador") return currentUser?.is_master || currentUser?.is_franqueador;
    return false;
  };

  const filteredItems = useMemo(() => {
    const permitted = ALL_NAV_ITEMS.filter(hasPermission);
    if (!searchTerm.trim()) return permitted;
    const s = searchTerm.toLowerCase();
    return permitted.filter(item => item.label.toLowerCase().includes(s) || item.group.toLowerCase().includes(s));
  }, [searchTerm, currentUser]);

  const groups = useMemo(() => {
    const map = new Map();
    filteredItems.forEach(item => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    });
    return map;
  }, [filteredItems]);

  const handleNavClick = (item) => {
    setActiveTab(item.key);
    if (item.extra === "loadDashFin" && loadDashFin) loadDashFin();
    setSearchTerm("");
    setIsLauncherOpen(false); // Fecha o launcher se ele tiver sido usado
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <>
      <aside style={{ ...styles?.sidebar, position: "fixed", top: 0, left: 0, height: "100vh", backgroundColor: C.bg, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "visible", zIndex: 1000, width: isOpen ? "260px" : "80px", boxShadow: "4px 0 24px rgba(0,0,0,0.02)", transition: "width 0.3s ease-in-out" }}>
        <style>{scrollbarStyles}</style>
        <button onClick={() => setIsOpen(!isOpen)} style={{ position: "absolute", right: "-14px", top: "32px", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", backgroundColor: "#ffffff", border: `2px solid ${C.primary}`, borderRadius: "50%", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", color: C.primary, cursor: "pointer", transition: "all 0.2s ease-in-out" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = "#ffffff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = C.primary; }}>
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
          {/* Logo */}
          <div style={{ padding: isOpen ? "24px 28px" : "24px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: C.bg, flexShrink: 0, minHeight: "81px", transition: "padding 0.3s ease-in-out" }}>
            <img src={LogoOmni} alt="Logo Sidebar" style={{ height: "auto", objectFit: "contain", width: isOpen ? "150px" : "32px", transition: "width 0.3s ease-in-out" }} />
          </div>

          {/* Search */}
          <div style={{ padding: isOpen ? "12px 16px" : "12px 10px", flexShrink: 0, transition: "padding 0.3s ease-in-out" }}>
            {isOpen ? (
              <div style={{ position: "relative" }}>
                <Search size={14} color={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Buscar"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 28px 8px 32px", borderRadius: "8px",
                    border: `1px solid ${searchTerm ? C.primary + "40" : C.border}`,
                    fontSize: "12px", fontWeight: 500, color: C.text, background: C.bgAlt,
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary + "60"}
                  onBlur={e => { if (!searchTerm) e.target.style.borderColor = C.border; }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} style={{
                    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ) : (
              <div onClick={() => setIsOpen(true)} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "8px 0", cursor: "pointer", borderRadius: "8px", transition: "background 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Search size={18} color={C.muted} strokeWidth={1.3} />
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="sidebar-nav" style={{ ...styles?.nav, flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0 20px 0", scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
            
            {/* BOTÃO DO MEGA MENU - LAUNCHER */}
            <div style={{ padding: isOpen ? "0 16px" : "0 12px", marginBottom: "16px" }}>
              <button
                onClick={() => setIsLauncherOpen(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isOpen ? "flex-start" : "center",
                  gap: "12px",
                  padding: isOpen ? "12px 16px" : "12px 0",
                  backgroundColor: C.primary,
                  color: "#FFF",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "13px",
                  boxShadow: `0 4px 12px ${C.primary}40`,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#D95A1E"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = "translateY(0)"; }}
                title="Todos os Módulos"
              >
                <Grip size={18} strokeWidth={2} />
                {isOpen && <span>Todos os Módulos</span>}
              </button>
            </div>

            {isSearching && filteredItems.length === 0 && isOpen && (
              <div style={{ padding: "30px 20px", textAlign: "center" }}>
                <Search size={24} color={C.border} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Nenhuma função encontrada</div>
              </div>
            )}

            {Array.from(groups.entries()).map(([groupName, items]) => (
              <React.Fragment key={groupName}>
                {isSearching ? (
                  isOpen && <div style={{ padding: "8px 20px 4px 20px", fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{groupName}</div>
                ) : (
                  <GroupTitle isOpen={isOpen}>{groupName}</GroupTitle>
                )}
                {items.map(item => {
                  const showSep = item.key === "centro_comando" && !isSearching;
                  return (
                    <React.Fragment key={item.key}>
                      {showSep && <div style={{ height: 1, background: C.border, margin: "12px 20px 4px 20px", display: isOpen ? "block" : "none" }} />}
                      <NavItem isOpen={isOpen} active={activeTab === item.key} onClick={() => handleNavClick(item)} label={item.label} icon={item.icon} />
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}

            {!isSearching && (
              <>
                <GroupTitle isOpen={isOpen}>Suporte</GroupTitle>
                <NavItem isOpen={isOpen} href="https://suporte.omni26.com" label="Abrir Chamado" icon={Headphones} />
              </>
            )}
          </nav>

          {/* User */}
          <div style={{ padding: isOpen ? "16px 20px" : "12px 0", borderTop: `1px solid ${C.border}`, backgroundColor: C.bgAlt, flexShrink: 0, transition: "padding 0.3s ease-in-out" }}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: isOpen ? "row" : "column", gap: isOpen ? 12 : 6, padding: isOpen ? "0" : "4px 0" }}>
              <div style={{ position: "relative", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                {currentUser?.foto_url || currentUser?.avatar_url ? (
                  <img src={currentUser.foto_url || currentUser.avatar_url} alt={currentUser?.name || "Usuário"} style={{ width: isOpen ? 40 : 36, height: isOpen ? 40 : 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.border}`, transition: "all 0.2s ease-in-out" }} />
                ) : (
                  <div style={{ width: isOpen ? 40 : 36, height: isOpen ? 40 : 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.primary}, ${C.primary}cc)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: isOpen ? 15 : 14, fontWeight: 800, textTransform: "uppercase", border: "2px solid #fff", boxShadow: `0 2px 8px ${C.primary}30`, transition: "all 0.2s ease-in-out" }}>
                    {(() => { const name = currentUser?.name || "U"; const parts = name.trim().split(" "); if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0]; return parts[0][0]; })()}
                  </div>
                )}
                <div style={{ position: "absolute", bottom: isOpen ? 0 : -1, right: isOpen ? 0 : "auto", width: 10, height: 10, borderRadius: "50%", background: "#22A06B", border: "2px solid #fff" }} />
              </div>
              {isOpen && (
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>{currentUser?.name || "Usuário"}</span>
                    {currentUser?.is_master && <span style={{ backgroundColor: `${C.primary}15`, border: `1px solid ${C.primary}30`, color: C.primary, padding: "1px 6px", borderRadius: 12, fontSize: 8, fontWeight: 800, whiteSpace: "nowrap" }}>MASTER</span>}
                    {currentUser?.is_franqueador && !currentUser?.is_master && <span style={{ backgroundColor: "#1e293b12", border: "1px solid #1e293b25", color: "#1e293b", padding: "1px 6px", borderRadius: 12, fontSize: 8, fontWeight: 800, whiteSpace: "nowrap" }}>FRANQ.</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.muted, fontWeight: 600 }}>
                    {currentUser?.empresa_nome && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{currentUser.empresa_nome}</span>}
                    {currentUser?.empresa_nome && <span>•</span>}
                    <span style={{ textTransform: "uppercase", fontWeight: 800, fontSize: 9, color: C.muted }}>{currentUser?.role}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: isOpen ? "0 20px 20px 20px" : "0 10px 20px 10px", backgroundColor: C.bgAlt, transition: "padding 0.3s ease-in-out" }}>
            <button onClick={onLogout} style={{ width: "100%", padding: isOpen ? "12px" : "12px 0", height: "40px", backgroundColor: C.primary, border: "none", color: "#FFFFFF", borderRadius: "10px", fontWeight: "800", fontSize: "13px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0, boxShadow: `0 4px 12px ${C.primary}33`, display: "flex", justifyContent: "center", alignItems: "center" }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#D95A1E"; e.currentTarget.style.boxShadow = `0 6px 16px ${C.primary}40`; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}33`; }}>
              {isOpen ? "Sair do Sistema" : <LogOut size={18} />}
            </button>
          </div>
        </div>
      </aside>

      {/* RENDERIZA O MEGA MENU PASSANDO A LISTA DE MÓDULOS FILTRADA E A NAVEGAÇÃO */}
      <OmniLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        modulosAtivos={filteredItems} 
        onNavigate={handleNavClick}
      />
    </>
  );
}