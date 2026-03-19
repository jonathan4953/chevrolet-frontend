export const styles = {
  container: {
    flex: 1,
    padding: "30px 40px",
    overflowY: "auto",
    overflowX: "hidden",
    background: "transparent",
    color: "#2A2B2D", // Texto escuro para modo claro
    fontFamily: "'Inter', sans-serif",
  },
  inventoryGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "20px 30px", 
    marginTop: '20px', 
    alignItems: 'end' 
  },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay mais suave
    backdropFilter: 'blur(4px)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999 
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', // Modal branco
    padding: '40px', 
    borderRadius: '25px', 
    width: '80%', 
    maxWidth: '900px', 
    border: '1px solid #E5E7EB',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)' // Sombra limpa e leve
  },
  modalTableBox: { 
    maxHeight: '400px', 
    overflowY: 'auto', 
    marginTop: 20, 
    border: '1px solid #E5E7EB', 
    borderRadius: '12px',
    background: '#F9FAFB' // Cinza super claro
  },
  bulkActionBox: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 15, 
    background: 'rgba(242, 107, 37, 0.05)', // Fundo laranja super translúcido
    padding: '15px 20px', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '1px solid rgba(242, 107, 37, 0.2)', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
  },
  unselectBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#636466', 
    fontSize: '11px', 
    cursor: 'pointer', 
    textDecoration: 'underline' 
  },
  brandTag: { 
    fontSize: 10, 
    color: '#F26B25', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    letterSpacing: '1px' 
  },
  qtyContainer: { 
    marginTop: '12px', 
    padding: '10px', 
    background: '#F9FAFB', 
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  qtyLabel: { 
    fontSize: '8px', 
    color: '#8E9093', 
    display: 'block', 
    marginBottom: '6px', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  qtySelector: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px' 
  },
  qtyBtn: { 
    background: '#E5E7EB', // Botão de qtde cinza claro
    border: 'none', 
    color: '#2A2B2D', 
    width: '32px', 
    height: '32px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 0, 
    lineHeight: 1 
  },
  qtyValBox: { 
    background: '#FFFFFF', 
    color: '#2A2B2D', 
    fontWeight: 'bold', 
    fontSize: '15px', 
    minWidth: '40px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '6px', 
    border: '1px solid #D4D5D6' 
  },
  fleetTotal: { 
    fontSize: '10px', 
    color: '#22A06B', // Verde sucesso padronizado
    fontWeight: 'bold', 
    marginTop: '4px' 
  },
  pdfCardBtn: { 
    width: '100%', 
    marginTop: '15px', 
    padding: '12px', 
    background: '#FDECE3', // Laranja bem clarinho
    color: '#F26B25', 
    border: '1px solid rgba(242, 107, 37, 0.2)', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    fontSize: '11px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px',
    boxShadow: 'none'
  },
  page: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#F5F6F8", // Fundo do sistema off-white limpo
    color: "#2A2B2D",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "240px",
    minWidth: "240px",
    height: "100vh",
    backgroundColor: "#FFFFFF", // Sidebar branca
    borderRight: "1px solid #E5E7EB",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "2px 0 10px rgba(0,0,0,0.02)", // Sombra bem sutil
    zIndex: 10,
  },
  sidebarLogoBox: { 
    padding: "45px 20px", 
    textAlign: "center" 
  },
  sidebarLogo: { 
    height: "35px", 
    objectFit: 'contain' 
  },
  nav: { 
    padding: "0 10px", 
    flex: 1 
  },
  navItem: { 
    padding: "10px 16px", 
    borderRadius: "10px", 
    cursor: "pointer", 
    marginBottom: "3px", 
    fontWeight: 700, 
    fontSize: "13px", 
    display: 'flex', 
    alignItems: 'center',
    transition: 'background 0.2s, color 0.2s',
    color: '#636466' // Texto padrão da sidebar
  },
  logoutBtn: { 
    margin: "20px", 
    padding: "12px", 
    borderRadius: "12px", 
    border: "1px solid rgba(217, 48, 37, 0.2)", 
    background: "rgba(217, 48, 37, 0.05)", 
    color: "#D93025", 
    cursor: "pointer" 
  },
  mainContent: {
    flex: 1,
    marginLeft: "240px",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    height: "100vh",
    overflowY: "auto",
    padding: "30px 40px",
    boxSizing: "border-box",
    background: "transparent",
  },
  header: { 
    padding: "20px 40px", 
    background: "rgba(255, 255, 255, 0.95)", // Header branco com blur leve
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #E5E7EB",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    position: 'sticky',
    top: 0,
    zIndex: 5
  },
  title: { 
    margin: 0, 
    fontSize: 24, 
    fontWeight: 900,
    color: '#2A2B2D'
  },
  subtitle: { 
    color: "#8E9093", 
    fontSize: 12 
  },
  dashboardWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '20px' 
  },
  statCard: { 
    background: '#FFFFFF', 
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid #E5E7EB', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)', // Sombra super limpa
    transform: 'translateY(-2px)'
  },
  statLabel: { 
    fontSize: '9px', 
    color: '#8E9093', 
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statValue: { 
    fontSize: '20px', 
    fontWeight: 800,
    color: '#2A2B2D'
  },
  actionGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  actionCard: { 
    background: '#FFFFFF', 
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid #E5E7EB', 
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    transform: 'translateY(-2px)'
  },
  calculatorWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  configSection: { 
    display: 'flex', 
    gap: '25px', 
    alignItems: 'stretch' 
  },
  cardVehicles: { 
    flex: 1.2, 
    minWidth: 0, 
    background: "#FFFFFF", 
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid #E5E7EB",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
  },
  cardParams: { 
    flex: 1, 
    minWidth: 0, 
    background: "#FFFFFF", 
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid #E5E7EB",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
  },
  headerTitleAction: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  cardTitle: { 
    marginTop: 0, 
    fontSize: 18, 
    fontWeight: 800, 
    borderLeft: "4px solid #F26B25", 
    paddingLeft: 12,
    color: '#2A2B2D' // Removemos o text-shadow
  },
  modelsBox: { 
    height: "300px", 
    overflowY: "auto", 
    background: "#F9FAFB", 
    padding: 15, 
    borderRadius: "16px", 
    marginTop: 15,
    border: "1px solid #E5E7EB"
  },
  modelItem: { 
    display: "flex", 
    alignItems: "center", 
    padding: "12px", 
    borderBottom: "1px solid #E5E7EB", 
    cursor: 'pointer' 
  },
  modelText: { 
    marginLeft: 12 
  },
  modelName: { 
    fontSize: 12, 
    fontWeight: 500,
    color: '#2A2B2D'
  },
  inputSearch: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "1px solid #D4D5D6", 
    background: "#FFFFFF", // Input branco puro
    color: "#2A2B2D", 
    boxSizing: 'border-box',
    boxShadow: "none" // Removido inset escuro
  },
  buttonProcess: { 
    width: '100%', 
    marginTop: '20px', 
    padding: "16px", 
    borderRadius: "14px", 
    background: "#F26B25", 
    color: "#FFFFFF", 
    fontWeight: 900, 
    cursor: "pointer", 
    border: 'none',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(242, 107, 37, 0.3)' 
  },
  clearBtn: { 
    background: 'rgba(217, 48, 37, 0.05)', 
    color: '#D93025', 
    border: '1px solid rgba(217, 48, 37, 0.2)', 
    padding: '6px 12px', 
    borderRadius: '8px', 
    fontSize: '11px', 
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resultsWrapper: { 
    width: '100%' 
  },
  resultsHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  exportBtn: { 
    padding: '12px 20px', 
    background: '#1A73E8', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12,
    boxShadow: '0 4px 15px rgba(26, 115, 232, 0.3)'
  },
  clearResultsBtn: { 
    padding: '12px 20px', 
    background: 'rgba(217, 48, 37, 0.05)', 
    color: '#D93025', 
    border: '1px solid rgba(217, 48, 37, 0.2)', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12 
  },
  compareGridWrap: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '25px' 
  },
  compareCardItem: { 
    flex: '1 1 300px', 
    maxWidth: 'calc(25% - 15px)', 
    background: '#FFFFFF', 
    borderRadius: '24px', 
    border: '1px solid #E5E7EB', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 8px 20px rgba(0,0,0,0.04)'
  },
  compareHeader: { 
    padding: '20px 15px', 
    textAlign: 'center', 
    background: '#F9FAFB', 
    borderBottom: '1px solid #E5E7EB' 
  },
  vehicleTitle: { 
    fontSize: 14, 
    fontWeight: 800, 
    minHeight: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: '#2A2B2D'
  },
  compareBody: { 
    padding: '15px', 
    flex: 1 
  },
  compareRow: { 
    padding: '15px 10px', 
    borderBottom: '1px solid #E5E7EB', 
    textAlign: 'center' 
  },
  prazoBadge: { 
    fontSize: '10px', 
    color: '#F26B25', 
    fontWeight: 900 
  },
  mainValue: { 
    fontSize: '22px', 
    fontWeight: 900, 
    color: '#2A2B2D',
    marginTop: '10px'
  },
  cardFull: { 
    background: "#FFFFFF", 
    borderRadius: "24px", 
    padding: "35px", 
    border: "1px solid #E5E7EB",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
  },
  tableWrapper: { 
    overflowX: 'auto', 
    marginTop: 20,
    background: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB'
  },
  tableMassa: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  thMassa: { 
    textAlign: 'left', 
    padding: '18px 15px', 
    background: '#F3F4F6', 
    color: '#636466', 
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tdMassa: {
    padding: "16px 24px",
    borderBottom: "1px solid #E5E7EB",
    fontSize: "13px",
    color: "#3D3E40",
    verticalAlign: "middle"
  },
  trBody: {
    transition: 'background 0.2s',
  },
  loginPage: { 
    height: "100vh", 
    width: "100vw", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    background: "#F5F6F8" // Fundo liso cinza clarinho
  },
  loginCard: { 
    width: "500px", 
    padding: "60px 40px", 
    borderRadius: "32px", 
    background: "#FFFFFF", 
    border: "1px solid #E5E7EB", 
    textAlign: "center", 
    boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.08)" // Sombra maior, mas leve
  },
  loginLogoContainer: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "35px", 
    marginBottom: "50px" 
  },
  loginLogo: { 
    height: "55px", 
    objectFit: "contain" 
  },
  loginTitle: { 
    fontSize: 22, 
    fontWeight: 800, 
    marginBottom: 40, 
    color: "#2A2B2D", 
    letterSpacing: "1px", 
    textTransform: 'uppercase'
  },
  loginButton: { 
    width: "100%", 
    padding: "18px", 
    borderRadius: "14px", 
    background: "#F26B25", 
    fontWeight: 900, 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '15px', 
    color: '#FFFFFF', 
    boxShadow: '0 8px 20px rgba(242, 107, 37, 0.3)' 
  },
  input: { 
    width: "100%", 
    padding: "16px", 
    borderRadius: "12px", 
    background: "#FFFFFF", 
    border: "1px solid #D4D5D6", 
    color: "#2A2B2D", 
    boxSizing: 'border-box',
    boxShadow: 'none'
  },
  inputGroup: { 
    marginBottom: 18, 
    textAlign: 'left' 
  },
  label: { 
    fontSize: 10, 
    color: '#8E9093', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 8,
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "15px" 
  },
  inputSmall: { 
    width: "100%", 
    padding: "12px", 
    borderRadius: "10px", 
    background: "#FFFFFF", 
    border: "1px solid #D4D5D6", 
    color: "#2A2B2D", 
    boxSizing: 'border-box',
    boxShadow: 'none'
  },
  fieldLabel: { 
    fontSize: 10, 
    color: '#8E9093', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 6,
    fontWeight: 'bold'
  }
};