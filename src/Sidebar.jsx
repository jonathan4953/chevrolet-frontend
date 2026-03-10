import React from "react";

function NavItem({ active, onClick, label, icon, styles }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.navItem,
        backgroundColor: active ? "rgba(234, 179, 8, 0.9)" : "transparent",
        color: active ? "#000" : "#94a3b8",
        boxShadow: active ? "0 4px 15px rgba(234, 179, 8, 0.3)" : "none",
        padding: "7px 20px",
        fontSize: "12px",
        lineHeight: "1.3",
        cursor: "pointer",
      }}
    >
      <span style={{ marginRight: 8 }}>{icon}</span>
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
  return (
    <aside
      style={{
        ...styles.sidebar,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {/* LOGO — fixo no topo */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={LogoOmni}
          alt="Logo Sidebar"
          style={{
            width: "100%",
            maxWidth: "170px",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* MENU — só esta área tem scroll */}
      <nav
        style={{
          ...styles.nav,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "6px 0",
        }}
      >
        {/* GERAL */}
        <div
          style={{
            padding: "4px 20px 3px",
            fontSize: "9px",
            color: "#64748b",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          Geral
        </div>
        <NavItem
          styles={styles}
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
          label="Dashboard"
          icon="📊"
        />
        <NavItem
          styles={styles}
          active={activeTab === "calculadora"}
          onClick={() => setActiveTab("calculadora")}
          label="Calculadora"
          icon="🧮"
        />
        <NavItem
          styles={styles}
          active={activeTab === "estoque_vendas"}
          onClick={() => setActiveTab("estoque_vendas")}
          label="Estoque de Vendas"
          icon="📋"
        />
        <NavItem
          styles={styles}
          active={activeTab === "estoque_locacao"}
          onClick={() => setActiveTab("estoque_locacao")}
          label="Estoque de Locação"
          icon="🔑"
        />

        {/* FINANCEIRO */}
        <div
          style={{
            padding: "10px 20px 3px",
            fontSize: "9px",
            color: "#64748b",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          Financeiro
        </div>
        <NavItem
          styles={styles}
          active={activeTab === "financeiro_dashboard"}
          onClick={() => {
            setActiveTab("financeiro_dashboard");
            loadDashFin();
          }}
          label="Dashboard Financeiro"
          icon="📊"
        />
        <NavItem
          styles={styles}
          active={activeTab === "financeiro_pagar"}
          onClick={() => setActiveTab("financeiro_pagar")}
          label="Contas a Pagar"
          icon="💸"
        />
        <NavItem
          styles={styles}
          active={activeTab === "financeiro_receber"}
          onClick={() => setActiveTab("financeiro_receber")}
          label="Contas a Receber"
          icon="🤑"
        />
        <NavItem
          styles={styles}
          active={activeTab === "contas_bancarias"}
          onClick={() => setActiveTab("contas_bancarias")}
          label="Contas Bancárias"
          icon="🏦"
        />
     <NavItem
  styles={styles}
  active={activeTab === "config_contabil"} // Tem que ser idêntico
  onClick={() => setActiveTab("config_contabil")} // Tem que ser idêntico
  label="Plano de Contas"
  icon="📊"
/>
        <NavItem
          styles={styles}
          active={activeTab === "clientes"}
          onClick={() => {
            setActiveTab("clientes");
            loadClientes();
          }}
          label="Clientes"
          icon="👥"
        />
        <NavItem
          styles={styles}
          active={activeTab === "fornecedores"}
          onClick={() => setActiveTab("fornecedores")}
          label="Fornecedores"
          icon="🏢"
        />

        {/* GESTÃO */}
        {(currentUser?.role === "admin" || currentUser?.role === "gestor") && (
          <>
            <div
              style={{
                padding: "10px 20px 3px",
                fontSize: "9px",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Gestão
            </div>
            <NavItem
              styles={styles}
              active={activeTab === "frota"}
              onClick={() => setActiveTab("frota")}
              label="Gestão de Frota"
              icon="🚗"
            />
            <NavItem
              styles={styles}
              active={activeTab === "usuarios"}
              onClick={() => setActiveTab("usuarios")}
              label="Usuários"
              icon="👥"
            />
            <NavItem
              styles={styles}
              active={activeTab === "logs"}
              onClick={() => setActiveTab("logs")}
              label="Auditoria"
              icon="📝"
            />
            <NavItem
              styles={styles}
              active={activeTab === "relatorios"}
              onClick={() => setActiveTab("relatorios")}
              label="Relatórios"
              icon="📄"
            />
          </>
        )}

        {/* SISTEMA */}
        {currentUser?.role === "admin" && (
          <>
            <div
              style={{
                padding: "10px 20px 3px",
                fontSize: "9px",
                color: "#64748b",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Sistema
            </div>
            <NavItem
              styles={styles}
              active={activeTab === "fipe"}
              onClick={() => setActiveTab("fipe")}
              label="Atualizar FIPE"
              icon="🔄"
            />
            <NavItem
              styles={styles}
              active={activeTab === "config"}
              onClick={() => setActiveTab("config")}
              label="Cenários"
              icon="⚙️"
            />
            <NavItem
              styles={styles}
              active={activeTab === "config_sistema"}
              onClick={() => setActiveTab("config_sistema")}
              label="Personalização"
              icon="🛠️"
            />
          </>
        )}
      </nav>

      {/* USUÁRIO — fixo no rodapé */}
      <div
        style={{
          padding: "10px 15px",
          textAlign: "center",
          fontSize: "10px",
          color: "#94a3b8",
          borderTop: "1px solid #1e293b",
          flexShrink: 0,
        }}
      >
        Logado como:{" "}
        <strong style={{ color: "#eab308" }}>{currentUser?.name}</strong>
        <br />({currentUser?.role?.toUpperCase()})
      </div>

      {/* LOGOUT — fixo no rodapé */}
      <button
        onClick={onLogout}
        style={{ ...styles.logoutBtn, flexShrink: 0 }}
      >
        Sair do Sistema
      </button>
    </aside>
  );
}