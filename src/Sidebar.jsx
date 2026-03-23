import React from "react";
import { 
  ChevronLeft, ChevronRight, LogOut,
  LayoutDashboard, Calculator, Tags, Key, 
  PieChart, Receipt, HandCoins, Landmark, BookOpen, Building2,
  Briefcase, Contact, CarFront, Users, FileSignature, UserCog,
  Layers, ListChecks, FileText, RefreshCw, Sliders, Shield, Headphones, ShieldCheck,
  Target, MapPin, BellRing, Package, BarChart3,
  Crown
} from "lucide-react";

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

function NavItem({ active, onClick, label, icon: Icon, styles, href, isOpen }) {
  const baseStyle = {
    ...styles?.navItem,
    backgroundColor: active ? C.primaryLight : "transparent",
    border: active ? `1px solid rgba(242, 107, 37, 0.2)` : "1px solid transparent",
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
  };
  const handleMouseEnter = (e) => { if (!active) { e.currentTarget.style.backgroundColor = "rgba(242, 107, 37, 0.05)"; e.currentTarget.style.color = C.primary; } };
  const handleMouseLeave = (e) => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.subtle; } };
  const content = (
    <>
      <Icon strokeWidth={1.3} style={{ marginRight: isOpen ? 12 : 0, width: 18, height: 18, transition: "margin 0.2s ease-in-out" }} />
      <span style={{ display: isOpen ? "block" : "none", whiteSpace: "nowrap", opacity: isOpen ? 1 : 0, transition: "opacity 0.2s" }}>{label}</span>
    </>
  );
  if (href) return (<a href={href} target="_blank" rel="noopener noreferrer" style={baseStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>{content}</a>);
  return (<div onClick={onClick} style={baseStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>{content}</div>);
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, loadDashFin, loadClientes, styles, onLogout, LogoOmni, isOpen, setIsOpen }) {
  return (
    <aside style={{ ...styles?.sidebar, position: "fixed", top: 0, left: 0, height: "100vh", backgroundColor: C.bg, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "visible", zIndex: 1000, width: isOpen ? "240px" : "80px", boxShadow: "4px 0 24px rgba(0,0,0,0.02)", transition: "width 0.3s ease-in-out" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ position: "absolute", right: "-14px", top: "32px", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", backgroundColor: "#ffffff", border: `2px solid ${C.primary}`, borderRadius: "50%", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", color: C.primary, cursor: "pointer", transition: "all 0.2s ease-in-out" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.color = "#ffffff"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = C.primary; }}>
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
        <div style={{ padding: isOpen ? "24px 28px" : "24px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: C.bg, flexShrink: 0, minHeight: "81px", transition: "padding 0.3s ease-in-out" }}>
          <img src={LogoOmni} alt="Logo Sidebar" style={{ height: "auto", objectFit: "contain", width: isOpen ? "150px" : "32px", transition: "width 0.3s ease-in-out" }} />
        </div>

        <nav style={{ ...styles?.nav, flex: 1, overflowY: "auto", overflowX: "hidden", padding: "15px 0 20px 0", scrollbarWidth: "none", msOverflowStyle: "none" }}>

          <GroupTitle isOpen={isOpen}>Geral</GroupTitle>
          <NavItem isOpen={isOpen} active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" icon={LayoutDashboard} />
          <NavItem isOpen={isOpen} active={activeTab === "calculadora"} onClick={() => setActiveTab("calculadora")} label="Calculadora" icon={Calculator} />
          <NavItem isOpen={isOpen} active={activeTab === "estoque_vendas"} onClick={() => setActiveTab("estoque_vendas")} label="Estoque de Vendas" icon={Tags} />
          <NavItem isOpen={isOpen} active={activeTab === "estoque_locacao"} onClick={() => setActiveTab("estoque_locacao")} label="Estoque de Locação" icon={Key} />

          <GroupTitle isOpen={isOpen}>Financeiro</GroupTitle>
          <NavItem isOpen={isOpen} active={activeTab === "financeiro_dashboard"} onClick={() => { setActiveTab("financeiro_dashboard"); loadDashFin && loadDashFin(); }} label="Dashboard Financeiro" icon={PieChart} />
          <NavItem isOpen={isOpen} active={activeTab === "financeiro_pagar"} onClick={() => setActiveTab("financeiro_pagar")} label="Contas a Pagar" icon={Receipt} />
          <NavItem isOpen={isOpen} active={activeTab === "financeiro_receber"} onClick={() => setActiveTab("financeiro_receber")} label="Contas a Receber" icon={HandCoins} />
          <NavItem isOpen={isOpen} active={activeTab === "contas_bancarias"} onClick={() => setActiveTab("contas_bancarias")} label="Contas Bancárias" icon={Landmark} />
          <NavItem isOpen={isOpen} active={activeTab === "config_contabil"} onClick={() => setActiveTab("config_contabil")} label="Plano de Contas" icon={BookOpen} />
          <NavItem isOpen={isOpen} active={activeTab === "fornecedores"} onClick={() => setActiveTab("fornecedores")} label="Fornecedores" icon={Building2} />

          {(currentUser?.is_master || currentUser?.role === "admin" || currentUser?.role === "gestor") && (
            <>
              <GroupTitle isOpen={isOpen}>Recursos Humanos</GroupTitle>
              <NavItem isOpen={isOpen} active={activeTab === "rh"} onClick={() => setActiveTab("rh")} label="OmniRH" icon={Briefcase} />
              <NavItem isOpen={isOpen} active={activeTab === "dossier"} onClick={() => setActiveTab("dossier")} label="Dossiê do Colaborador" icon={Contact} />
            </>
          )}

          {(currentUser?.is_master || currentUser?.role === "admin" || currentUser?.role === "gestor") && (
            <>
              <GroupTitle isOpen={isOpen}>Gestão</GroupTitle>
              <NavItem isOpen={isOpen} active={activeTab === "comercial"} onClick={() => setActiveTab("comercial")} label="Gestão Comercial" icon={BarChart3} />
              <NavItem isOpen={isOpen} active={activeTab === "frota"} onClick={() => setActiveTab("frota")} label="Gestão de Frota" icon={CarFront} />
              <NavItem isOpen={isOpen} active={activeTab === "gestao_clientes"} onClick={() => setActiveTab("gestao_clientes")} label="Gestão de Clientes" icon={Users} />
              <NavItem isOpen={isOpen} active={activeTab === "gestao_contratos"} onClick={() => setActiveTab("gestao_contratos")} label="Gestão de Contratos" icon={FileSignature} />
              <NavItem isOpen={isOpen} active={activeTab === "gestao_usuarios"} onClick={() => setActiveTab("gestao_usuarios")} label="Gestão de Usuários" icon={UserCog} />
              <NavItem isOpen={isOpen} active={activeTab === "gestao_ativos"} onClick={() => setActiveTab("gestao_ativos")} label="Gestão de Ativos" icon={Layers} />
              <NavItem isOpen={isOpen} active={activeTab === "logs"} onClick={() => setActiveTab("logs")} label="Auditoria" icon={ListChecks} />
              <NavItem isOpen={isOpen} active={activeTab === "relatorios"} onClick={() => setActiveTab("relatorios")} label="Relatórios" icon={FileText} />

              {/* ── CENTRO DE COMANDO (entrada única — abas internas) ── */}
              {(currentUser?.is_master || currentUser?.is_franqueador) && (
                <>
                  <div style={{ height: 1, background: C.border, margin: "12px 20px 4px 20px", display: isOpen ? "block" : "none" }} />
                  <NavItem isOpen={isOpen} active={activeTab === "centro_comando"} onClick={() => setActiveTab("centro_comando")} label="Centro de Comando" icon={Crown} />
                </>
              )}
            </>
          )}

          {(currentUser?.is_master || currentUser?.role === "admin") && (
            <>
              <GroupTitle isOpen={isOpen}>Sistema</GroupTitle>
              <NavItem isOpen={isOpen} active={activeTab === "fipe"} onClick={() => setActiveTab("fipe")} label="Atualizar FIPE" icon={RefreshCw} />
              <NavItem isOpen={isOpen} active={activeTab === "config_sistema"} onClick={() => setActiveTab("config_sistema")} label="Personalização" icon={Sliders} />
              <NavItem isOpen={isOpen} active={activeTab === "admin_rbac"} onClick={() => setActiveTab("admin_rbac")} label="Administração do Sistema" icon={ShieldCheck} />
            </>
          )}

          <GroupTitle isOpen={isOpen}>Suporte</GroupTitle>
          <NavItem isOpen={isOpen} href="https://suporte.omni26.com" label="Abrir Chamado" icon={Headphones} />
        </nav>

        {/* ═══════ USER AVATAR SECTION ═══════ */}
        <div style={{ 
          padding: isOpen ? "16px 20px" : "12px 0", 
          borderTop: `1px solid ${C.border}`, 
          backgroundColor: C.bgAlt, 
          flexShrink: 0, 
          transition: "padding 0.3s ease-in-out" 
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: isOpen ? "center" : "center", 
            flexDirection: isOpen ? "row" : "column",
            gap: isOpen ? 12 : 6,
            padding: isOpen ? "0" : "4px 0",
          }}>
            {/* Avatar Circle */}
            <div style={{ 
              position: "relative", 
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
            }}>
              {currentUser?.foto_url || currentUser?.avatar_url ? (
                <img 
                  src={currentUser.foto_url || currentUser.avatar_url} 
                  alt={currentUser?.name || "Usuário"}
                  style={{ 
                    width: isOpen ? 40 : 36, 
                    height: isOpen ? 40 : 36, 
                    borderRadius: "50%", 
                    objectFit: "cover",
                    border: `2px solid ${C.border}`,
                    transition: "all 0.2s ease-in-out",
                  }} 
                />
              ) : (
                <div style={{ 
                  width: isOpen ? 40 : 36, 
                  height: isOpen ? 40 : 36, 
                  borderRadius: "50%", 
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primary}cc)`,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: isOpen ? 15 : 14,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  border: "2px solid #fff",
                  boxShadow: `0 2px 8px ${C.primary}30`,
                  transition: "all 0.2s ease-in-out",
                }}>
                  {(() => {
                    const name = currentUser?.name || "U";
                    const parts = name.trim().split(" ");
                    if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
                    return parts[0][0];
                  })()}
                </div>
              )}
              {/* Online indicator dot */}
              <div style={{
                position: "absolute",
                bottom: isOpen ? 0 : -1,
                right: isOpen ? 0 : "auto",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#22A06B",
                border: "2px solid #fff",
              }} />
            </div>

            {/* User Info (only when open) */}
            {isOpen && (
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6, 
                  marginBottom: 2 
                }}>
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: C.text, 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis",
                    maxWidth: 110,
                  }}>
                    {currentUser?.name || "Usuário"}
                  </span>
                  {currentUser?.is_master && (
                    <span style={{ 
                      backgroundColor: `${C.primary}15`, 
                      border: `1px solid ${C.primary}30`, 
                      color: C.primary, 
                      padding: "1px 6px", 
                      borderRadius: 12, 
                      fontSize: 8, 
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}>👑 MASTER</span>
                  )}
                  {currentUser?.is_franqueador && !currentUser?.is_master && (
                    <span style={{ 
                      backgroundColor: "#1e293b12", 
                      border: "1px solid #1e293b25", 
                      color: "#1e293b", 
                      padding: "1px 6px", 
                      borderRadius: 12, 
                      fontSize: 8, 
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}>🏢 FRANQ.</span>
                  )}
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  fontSize: 10, 
                  color: C.muted, 
                  fontWeight: 600 
                }}>
                  {currentUser?.empresa_nome && (
                    <span style={{ 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      maxWidth: 90 
                    }}>
                      {currentUser.empresa_nome}
                    </span>
                  )}
                  {currentUser?.empresa_nome && <span>•</span>}
                  <span style={{ 
                    textTransform: "uppercase", 
                    fontWeight: 800, 
                    fontSize: 9, 
                    color: C.muted 
                  }}>
                    {currentUser?.role}
                  </span>
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
  );
}