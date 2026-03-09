export const styles = {
  container: {
    flex: 1,
    padding: "30px 40px",
    overflowY: "auto",
    overflowX: "hidden",
    background: "transparent",
    color: "#e2e8f0",
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
    backgroundColor: 'rgba(2, 6, 23, 0.75)', 
    backdropFilter: 'blur(10px)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999 
  },
  modalContent: { 
    backgroundColor: 'rgba(15, 23, 42, 0.85)', 
    backdropFilter: 'blur(20px)',
    padding: '40px', 
    borderRadius: '25px', 
    width: '80%', 
    maxWidth: '900px', 
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 20px rgba(234, 179, 8, 0.05)'
  },
  modalTableBox: { 
    maxHeight: '400px', 
    overflowY: 'auto', 
    marginTop: 20, 
    border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.2)'
  },
  bulkActionBox: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 15, 
    background: 'rgba(234, 179, 8, 0.1)', 
    padding: '15px 20px', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '1px solid rgba(234, 179, 8, 0.3)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
  },
  unselectBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#94a3b8', 
    fontSize: '11px', 
    cursor: 'pointer', 
    textDecoration: 'underline' 
  },
  brandTag: { 
    fontSize: 10, 
    color: '#eab308', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    letterSpacing: '1px' 
  },
  qtyContainer: { 
    marginTop: '12px', 
    padding: '10px', 
    background: 'rgba(0,0,0,0.3)', 
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  qtyLabel: { 
    fontSize: '8px', 
    color: '#94a3b8', 
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
    background: 'rgba(255,255,255,0.1)', 
    border: 'none', 
    color: '#fff', 
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
    background: 'rgba(0,0,0,0.4)', 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: '15px', 
    minWidth: '40px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '6px', 
    border: '1px solid rgba(255,255,255,0.05)' 
  },
  fleetTotal: { 
    fontSize: '10px', 
    color: '#4ade80', 
    fontWeight: 'bold', 
    marginTop: '4px' 
  },
  pdfCardBtn: { 
    width: '100%', 
    marginTop: '15px', 
    padding: '12px', 
    background: '#fde68a', 
    color: '#000', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    fontSize: '11px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px',
    boxShadow: '0 4px 15px rgba(253, 230, 138, 0.3)'
  },
page: {
  display: "flex",
  height: "100vh",
  width: "100vw",
  background: "radial-gradient(circle at top right, #1e293b, #020617)",
  color: "#f1f5f9",
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
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(15px)",
  borderRight: "1px solid rgba(255,255,255,0.05)",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
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
    transition: 'background 0.2s, box-shadow 0.2s'
  },
  logoutBtn: { 
    margin: "20px", 
    padding: "12px", 
    borderRadius: "12px", 
    border: "1px solid rgba(248, 113, 113, 0.3)", 
    background: "rgba(248, 113, 113, 0.05)", 
    color: "#f87171", 
    cursor: "pointer" 
  },
mainContent: {
  flex: 1,
  marginLeft: "240px",    // Espaço para sidebar fixa
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
    background: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
    position: 'sticky',
    top: 0,
    zIndex: 5
  },
  title: { 
    margin: 0, 
    fontSize: 24, 
    fontWeight: 900 
  },
  subtitle: { 
    color: "#94a3b8", 
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
    background: 'rgba(30, 41, 59, 0.6)', 
    backdropFilter: 'blur(12px)',
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.08)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transform: 'translateY(-2px)'
  },
  statLabel: { 
    fontSize: '9px', 
    color: '#94a3b8', 
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statValue: { 
    fontSize: '20px', 
    fontWeight: 800 
  },
  actionGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  actionCard: { 
    background: 'rgba(30, 41, 59, 0.6)', 
    backdropFilter: 'blur(12px)',
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.08)', 
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
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
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: "blur(16px)",
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
  },
  cardParams: { 
    flex: 1, 
    minWidth: 0, 
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: "blur(16px)",
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
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
    borderLeft: "4px solid #eab308", 
    paddingLeft: 12,
    textShadow: '0 2px 5px rgba(0,0,0,0.5)'
  },
  modelsBox: { 
    height: "300px", 
    overflowY: "auto", 
    background: "rgba(0,0,0,0.3)", 
    padding: 15, 
    borderRadius: "16px", 
    marginTop: 15,
    border: "1px solid rgba(255,255,255,0.05)"
  },
  modelItem: { 
    display: "flex", 
    alignItems: "center", 
    padding: "12px", 
    borderBottom: "1px solid rgba(255,255,255,0.05)", 
    cursor: 'pointer' 
  },
  modelText: { 
    marginLeft: 12 
  },
  modelName: { 
    fontSize: 12, 
    fontWeight: 500 
  },
  inputSearch: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "1px solid rgba(255,255,255,0.1)", 
    background: "rgba(15, 23, 42, 0.6)", 
    color: "white", 
    boxSizing: 'border-box',
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
  },
  buttonProcess: { 
    width: '100%', 
    marginTop: '20px', 
    padding: "16px", 
    borderRadius: "14px", 
    background: "#eab308", 
    color: "#000", 
    fontWeight: 900, 
    cursor: "pointer", 
    border: 'none',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(234, 179, 8, 0.4)'
  },
  clearBtn: { 
    background: 'rgba(248, 113, 113, 0.1)', 
    color: '#f87171', 
    border: '1px solid rgba(248, 113, 113, 0.2)', 
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
    background: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12,
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
  },
  clearResultsBtn: { 
    padding: '12px 20px', 
    background: 'rgba(248, 113, 113, 0.15)', 
    color: '#f87171', 
    border: '1px solid rgba(248, 113, 113, 0.3)', 
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
    background: 'rgba(15, 23, 42, 0.8)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '24px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
  },
  compareHeader: { 
    padding: '20px 15px', 
    textAlign: 'center', 
    background: 'rgba(255,255,255,0.03)', 
    borderBottom: '1px solid rgba(255,255,255,0.05)' 
  },
  vehicleTitle: { 
    fontSize: 14, 
    fontWeight: 800, 
    minHeight: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
  },
  compareBody: { 
    padding: '15px', 
    flex: 1 
  },
  compareRow: { 
    padding: '15px 10px', 
    borderBottom: '1px solid rgba(255,255,255,0.03)', 
    textAlign: 'center' 
  },
  prazoBadge: { 
    fontSize: '10px', 
    color: '#eab308', 
    fontWeight: 900 
  },
  mainValue: { 
    fontSize: '22px', 
    fontWeight: 900, 
    color: '#fff',
    marginTop: '10px'
  },
  cardFull: { 
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: 'blur(16px)',
    borderRadius: "24px", 
    padding: "35px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
  },
  tableWrapper: { 
    overflowX: 'auto', 
    marginTop: 20,
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  tableMassa: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  thMassa: { 
    textAlign: 'left', 
    padding: '18px 15px', 
    background: 'rgba(15, 23, 42, 0.6)', 
    color: '#94a3b8', 
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tdMassa: {
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "13px",
    color: "#cbd5e1",
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
    background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)"
  },
  loginCard: { 
    width: "500px", 
    padding: "60px 40px", 
    borderRadius: "32px", 
    background: "rgba(15, 23, 42, 0.6)", 
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", 
    textAlign: "center", 
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)"
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
    color: "#fde68a", 
    letterSpacing: "1px", 
    textTransform: 'uppercase',
    textShadow: '0 4px 10px rgba(0,0,0,0.5)'
  },
  loginButton: { 
    width: "100%", 
    padding: "18px", 
    borderRadius: "14px", 
    background: "#eab308", 
    fontWeight: 900, 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '15px', 
    color: '#000',
    boxShadow: '0 10px 25px rgba(234, 179, 8, 0.4)'
  },
  input: { 
    width: "100%", 
    padding: "16px", 
    borderRadius: "12px", 
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff", 
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
  },
  inputGroup: { 
    marginBottom: 18, 
    textAlign: 'left' 
  },
  label: { 
    fontSize: 10, 
    color: '#94a3b8', 
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
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff", 
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
  },
  fieldLabel: { 
    fontSize: 10, 
    color: '#cbd5e1', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 6,
    fontWeight: 'bold'
  }
};