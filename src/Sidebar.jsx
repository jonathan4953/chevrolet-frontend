import React from "react";

const C = {
  primary: "#F26B25",
  primaryLight: "rgba(242, 107, 37, 0.1)", // Fundo para hover
  primaryActive: "rgba(242, 107, 37, 0.15)", // Fundo para ativo
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

function NavItem({ active, onClick, label, icon, styles, href }) {
  // Estilo base do item de navegação
  const baseStyle = {
    ...styles?.navItem,
    backgroundColor: active ? C.primaryActive : "transparent",
    color: active ? C.primary : C.subtle,
    borderLeft: active ? `4px solid ${C.primary}` : "4px solid transparent",
    padding: "10px 16px",
    margin: "4px 16px 4px 0", // Margem ajustada para alinhar com a borda esquerda
    borderRadius: "0 10px 10px 0",
    fontSize: "13px",
    fontWeight: active ? "800" : "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  };

  const handleMouseEnter = (e) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = C.primaryLight;
      e.currentTarget.style.color = C.primary;
    }
  };

  const handleMouseLeave = (e) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = "transparent";
      e.currentTarget.style.color = C.subtle;
    }
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span style={{ marginRight: 12, fontSize: "16px", display: "flex", alignItems: "center" }}>{icon}</span>
        {label}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={{ marginRight: 12, fontSize: "16px", display: "flex", alignItems: "center" }}>{icon}</span>
      {label}
    </div>
  );
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  loadDashFin,
  loadClientes,
  styles,
  onLogout,
  LogoOmni,
}) {
  const groupTitleStyle = {
    padding: "18px 20px 8px 20px",
    fontSize: "10px",
    color: C.muted,
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: "0.08em"
  };

  return (
    <aside
      style={{
        ...styles?.sidebar,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        backgroundColor: C.bg, // Fundo branco oficial do tema
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 1000,
        width: "280px", // Largura fixa ajustada
        boxShadow: "4px 0 24px rgba(0,0,0,0.02)", // Sombra bem sutil
      }}
    >
      {/* LOGO — fixo no topo */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "center",
          backgroundColor: C.bg,
          flexShrink: 0,
        }}
      >
        <img
          src={LogoOmni}
          alt="Logo Sidebar"
          style={{
            width: "100%",
            maxWidth: "150px",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* MENU — só esta área tem scroll */}
      <nav
        style={{
          ...styles?.nav,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "10px 0 20px 0",
        }}
      >
        {/* GERAL */}
        <div style={groupTitleStyle}>Geral</div>
        <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" icon="📊" />
        <NavItem active={activeTab === "calculadora"} onClick={() => setActiveTab("calculadora")} label="Calculadora" icon="🧮" />
        <NavItem active={activeTab === "estoque_vendas"} onClick={() => setActiveTab("estoque_vendas")} label="Estoque de Vendas" icon="📋" />
        <NavItem active={activeTab === "estoque_locacao"} onClick={() => setActiveTab("estoque_locacao")} label="Estoque de Locação" icon="🔑" />

        {/* FINANCEIRO */}
        <div style={groupTitleStyle}>Financeiro</div>
        <NavItem
          active={activeTab === "financeiro_dashboard"}
          onClick={() => { setActiveTab("financeiro_dashboard"); loadDashFin && loadDashFin(); }}
          label="Dashboard Financeiro"
          icon="📊"
        />
        <NavItem active={activeTab === "financeiro_pagar"} onClick={() => setActiveTab("financeiro_pagar")} label="Contas a Pagar" icon="💸" />
        <NavItem active={activeTab === "financeiro_receber"} onClick={() => setActiveTab("financeiro_receber")} label="Contas a Receber" icon="🤑" />
        <NavItem active={activeTab === "contas_bancarias"} onClick={() => setActiveTab("contas_bancarias")} label="Contas Bancárias" icon="🏦" />
        <NavItem active={activeTab === "config_contabil"} onClick={() => setActiveTab("config_contabil")} label="Plano de Contas" icon="📑" />
        <NavItem active={activeTab === "fornecedores"} onClick={() => setActiveTab("fornecedores")} label="Fornecedores" icon="🏢" />

        {/* RECURSOS HUMANOS */}
        {(currentUser?.is_master || currentUser?.role === "admin" || currentUser?.role === "gestor") && (
          <>
            <div style={groupTitleStyle}>Recursos Humanos</div>
            <NavItem active={activeTab === "rh"} onClick={() => setActiveTab("rh")} label="OmniRH" icon="👔" />
            <NavItem active={activeTab === "dossier"} onClick={() => setActiveTab("dossier")} label="Dossiê do Colaborador" icon="🧬" />
          </>
        )}

        {/* GESTÃO */}
        {(currentUser?.is_master || currentUser?.role === "admin" || currentUser?.role === "gestor") && (
          <>
            <div style={groupTitleStyle}>Gestão</div>
            <NavItem active={activeTab === "frota"} onClick={() => setActiveTab("frota")} label="Gestão de Frota" icon="🚗" />
            <NavItem active={activeTab === "gestao_clientes"} onClick={() => setActiveTab("gestao_clientes")} label="Gestão de Clientes" icon="👥" />
            <NavItem active={activeTab === "gestao_contratos"} onClick={() => setActiveTab("gestao_contratos")} label="Gestão de Contratos" icon="📝" />
            <NavItem active={activeTab === "gestao_usuarios"} onClick={() => setActiveTab("gestao_usuarios")} label="Gestão de Usuários" icon="👤" />
            <NavItem active={activeTab === "gestao_ativos"} onClick={() => setActiveTab("gestao_ativos")} label="Gestão de Ativos" icon="🏗️" />
            <NavItem active={activeTab === "logs"} onClick={() => setActiveTab("logs")} label="Auditoria" icon="🧾" />
            <NavItem active={activeTab === "relatorios"} onClick={() => setActiveTab("relatorios")} label="Relatórios" icon="📄" />
          </>
        )}

        {/* SISTEMA */}
        {(currentUser?.is_master || currentUser?.role === "admin") && (
          <>
            <div style={groupTitleStyle}>Sistema</div>
            <NavItem active={activeTab === "fipe"} onClick={() => setActiveTab("fipe")} label="Atualizar FIPE" icon="🔄" />
            <NavItem active={activeTab === "config_sistema"} onClick={() => setActiveTab("config_sistema")} label="Personalização" icon="🛠️" />
            <NavItem active={activeTab === "admin_rbac"} onClick={() => setActiveTab("admin_rbac")} label="Administração do Sistema" icon="🛡️" />
          </>
        )}

        {/* SUPORTE */}
        <div style={groupTitleStyle}>Suporte</div>
        <NavItem href="https://suporte.omni26.com" label="Abrir Chamado" icon="🎧" />
      </nav>

      {/* USUÁRIO — fixo no rodapé */}
      <div
        style={{
          padding: "16px 20px",
          textAlign: "center",
          fontSize: "12px",
          color: C.subtle,
          borderTop: `1px solid ${C.border}`,
          backgroundColor: C.bgAlt, // Fundo levemente cinza para destacar o rodapé
          flexShrink: 0,
        }}
      >
        Logado como: <strong style={{ color: C.text, fontWeight: "800" }}>{currentUser?.name}</strong>
        {currentUser?.is_master && (
          <span style={{
            display: "inline-block", marginLeft: 8,
            backgroundColor: `${C.yellow}20`, border: `1px solid ${C.yellow}40`,
            color: C.yellow, padding: "2px 8px", borderRadius: 20,
            fontSize: "9px", fontWeight: 800, verticalAlign: "middle"
          }}>👑 MASTER</span>
        )}
        <br />
        <div style={{ marginTop: "6px" }}>
          {currentUser?.empresa_nome && (
            <span style={{ color: C.muted, fontWeight: "600" }}>{currentUser.empresa_nome} • </span>
          )}
          <span style={{ color: C.muted, fontWeight: "800", textTransform: "uppercase", fontSize: "10px" }}>{currentUser?.role}</span>
        </div>
      </div>

      {/* LOGOUT — fixo no rodapé */}
      <div style={{ padding: "0 20px 20px 20px", backgroundColor: C.bgAlt }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: C.primary,
            border: "none",
            color: "#FFFFFF",
            borderRadius: "10px",
            fontWeight: "800",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${C.primary}33`
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "#D95A1E";
            e.currentTarget.style.boxShadow = `0 6px 16px ${C.primary}40`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = C.primary;
            e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}33`;
          }}
        >
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}