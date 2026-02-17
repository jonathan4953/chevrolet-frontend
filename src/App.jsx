import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

// IMPORTAÇÃO DAS LOGOS LOCAIS
import logoDao from "./assets/logo-dao.jpg"; 
const CHEVROLET_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/800px-Chevrolet-logo.png";

export default function App() {
  // --- ESTADOS DE CONTROLE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- ESTADOS DA CALCULADORA E PARÂMETROS ---
  const [models, setModels] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [yearNum, setYearNum] = useState(2024);
  const [kmMensal, setKmMensal] = useState(3000);
  const [taxaJurosMensal, setTaxaJurosMensal] = useState(0.0129);
  const [percentualAplicado, setPercentualAplicado] = useState(0.028);
  const [revisaoMensal, setRevisaoMensal] = useState(56.88);
  const [prazos] = useState([12, 24, 36, 48]);
  
  // --- ESTADOS DE SISTEMA ---
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [savedScenarios] = useState([
    { id: 1, name: "Padrão Varejo", taxa: 0.0129, margem: 0.028 },
    { id: 2, name: "Frotista Agro", taxa: 0.0115, margem: 0.020 },
    { id: 3, name: "Locadora Gov", taxa: 0.0105, margem: 0.015 }
  ]);

  // --- FUNÇÕES ---
  const resetVehicles = () => { setSelectedVehicles([]); setSearch(""); };
  const resetParams = () => { setKmMensal(3000); setTaxaJurosMensal(0.0129); setPercentualAplicado(0.028); setRevisaoMensal(56.88); setYearNum(2024); };
  const clearResults = () => { setResults(null); };

  const exportToCSV = () => {
    if (!results?.compare) return;
    let csv = "Veiculo;FIPE;Prazo;Mensalidade;Faturamento Total;ROI\n";
    results.compare.forEach(item => {
      item.pricing.forEach(p => {
        csv += `${item.vehicle.model_name};${item.vehicle.price_number};${p.prazo_meses}m;${p.mensalidade_calculada.toFixed(2)};${(p.mensalidade_calculada * p.prazo_meses).toFixed(2)};${(p.roi_estimado * 100).toFixed(2)}%\n`;
      });
    });
    downloadCSV(csv, "relatorio_comparativo_chevrolet.csv");
  };

  const exportMassaToCSV = () => {
    if (models.length === 0) return;
    let csv = "Modelo;FIPE;12m;24m;36m;48m\n";
    models.forEach(m => {
      const base = m.price_number || 0;
      const calc = (ms) => (base * (1 + (taxaJurosMensal * ms)) * (1 + percentualAplicado)) / ms;
      csv += `${m.model_name};${base.toFixed(2)};${calc(12).toFixed(2)};${calc(24).toFixed(2)};${calc(36).toFixed(2)};${calc(48).toFixed(2)}\n`;
    });
    downloadCSV(csv, "tabela_geral_chevrolet.csv");
  };

  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  useEffect(() => {
    if (isLoggedIn) {
      async function loadModels() {
        try {
          const r = await api.get("/models?limit=2000");
          setModels(r.data);
        } catch (e) { setError("Erro de conexão com API."); }
      }
      loadModels();
    }
  }, [isLoggedIn]);

  const filteredModels = useMemo(() => {
    const s = search.trim().toLowerCase();
    return models.filter(m => 
      (m.model_name || "").toLowerCase().includes(s) || 
      (m.model_group || "").toLowerCase().includes(s)
    );
  }, [models, search]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) setIsLoggedIn(true);
  };

  async function handleCalculate() {
    setError("");
    if (selectedVehicles.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        vehicles: selectedVehicles.map(m => ({
          model_name_clean: m, year_num: Number(yearNum), km_mensal: Number(kmMensal),
          taxa_juros_mensal: Number(taxaJurosMensal), percentual_aplicado: Number(percentualAplicado),
          revisao_mensal: Number(revisaoMensal), prazos
        })),
      };
      const r = await api.post("/pricing/compare", payload);
      setResults(r.data);
    } catch (e) { setError("Erro nos cálculos."); } finally { setLoading(false); }
  }

  const formatBRL = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // --- VIEW DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.loginLogoContainer}>
            <img src={CHEVROLET_LOGO} alt="Chevrolet" style={styles.loginLogo} />
            <div style={styles.logoDivider} />
            <img src={logoDao} alt="Grupo Dão Silveira" style={styles.daoLogo} />
          </div>
          <h2 style={styles.loginTitle}>Gestão e Controle de Frota</h2>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <div style={styles.inputGroup}><label style={styles.label}>E-mail Corporativo</label><input type="email" style={styles.input} value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
            <div style={styles.inputGroup}><label style={styles.label}>Senha</label><input type="password" style={styles.input} value={password} onChange={(e)=>setPassword(e.target.value)} required /></div>
            <button type="submit" style={styles.loginButton}>ENTRAR NO SISTEMA</button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW INTERNA ---
  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogoBox}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'}}>
                <img src={CHEVROLET_LOGO} alt="Chevrolet" style={styles.sidebarLogo} />
                <div style={{width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)'}} />
                <img src={logoDao} alt="Dão Silveira" style={{...styles.sidebarLogo, height: '28px', filter: 'brightness(1.5)'}} />
            </div>
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" icon="📊" />
          <NavItem active={activeTab === "calculadora"} onClick={() => setActiveTab("calculadora")} label="Calculadora" icon="🧮" />
          <NavItem active={activeTab === "massa"} onClick={() => setActiveTab("massa")} label="Em Massa" icon="📦" />
          <NavItem active={activeTab === "config"} onClick={() => setActiveTab("config")} label="Cenários" icon="⚙️" />
        </nav>
        <button onClick={() => setIsLoggedIn(false)} style={styles.logoutBtn}>Sair do Sistema</button>
      </aside>

      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h1 style={styles.title}>{activeTab.toUpperCase()}</h1>
          <p style={styles.subtitle}> Chevrolet Performance v2.6 • 2026</p>
        </header>

        <main style={styles.container}>
          {activeTab === "dashboard" && (
            <div style={styles.dashboardWrapper}>
              <div style={styles.statsGrid}>
                <StatCard title="FIPE Atualizada" value="Fev/2026" icon="📌" />
                <StatCard title="Modelos Ativos" value={models.length} icon="🚗" />
                <StatCard title="Cenário Ativo" value="Customizado" icon="💰" />
                <StatCard title="Margem Média" value={`${(percentualAplicado * 100).toFixed(1)}%`} icon="📊" />
              </div>
              <h2 style={styles.sectionTitle}>Ações Rápidas</h2>
              <div style={styles.actionGrid}>
                <div style={styles.actionCard} onClick={() => setActiveTab("calculadora")}>
                  <span style={{fontSize: 30}}>🧮</span>
                  <h3>Nova Simulação</h3>
                  <p>Calcular precificação individual ou comparativo</p>
                </div>
                <div style={styles.actionCard} onClick={() => setActiveTab("massa")}>
                  <span style={{fontSize: 30}}>📦</span>
                  <h3>Tabela em Massa</h3>
                  <p>Visualizar todo o estoque Chevrolet</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calculadora" && (
            <div style={styles.calculatorWrapper}>
              <div style={styles.configSection}>
                <section style={styles.cardVehicles}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>1. Veículos</h2>
                    <button onClick={resetVehicles} style={styles.clearBtn}>Limpar ({selectedVehicles.length})</button>
                  </div>
                  <input style={styles.inputSearch} placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div style={styles.modelsBox}>
                    {filteredModels.map(m => (
                      <label key={m.model_name_clean} style={styles.modelItem}>
                        <input type="checkbox" checked={selectedVehicles.includes(m.model_name_clean)} onChange={() => setSelectedVehicles(prev => prev.includes(m.model_name_clean) ? prev.filter(x => x !== m.model_name_clean) : [...prev, m.model_name_clean])} />
                        <div style={styles.modelText}>
                          <span style={styles.modelGroup}>{m.model_group}</span>
                          <span style={styles.modelName}>{m.model_name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section style={styles.cardParams}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>2. Parâmetros</h2>
                    <button onClick={resetParams} style={styles.clearBtn}>Resetar</button>
                  </div>
                  <div style={styles.formGrid}>
                    <Field label="KM Mensal" value={kmMensal} setValue={setKmMensal} />
                    <Field label="Ano Modelo" value={yearNum} setValue={setYearNum} />
                    <Field label="Taxa Juros" value={taxaJurosMensal} setValue={setTaxaJurosMensal} step="0.0001" />
                    <Field label="Margem Net" value={percentualAplicado} setValue={setPercentualAplicado} step="0.0001" />
                    <Field label="Manutenção/mês" value={revisaoMensal} setValue={setRevisaoMensal} />
                  </div>
                  <button style={styles.buttonProcess} onClick={handleCalculate} disabled={loading}>
                    {loading ? "CALCULANDO..." : "PROCESSAR COMPARATIVO"}
                  </button>
                </section>
              </div>

              {results?.compare && (
                <div style={styles.resultsWrapper}>
                  <div style={styles.resultsHeader}>
                    <h2 style={styles.cardTitle}>Resultado do Comparativo</h2>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={clearResults} style={styles.clearResultsBtn}>🗑️ LIMPAR</button>
                      <button onClick={exportToCSV} style={styles.exportBtn}>📥 EXPORTAR EXCEL (CSV)</button>
                    </div>
                  </div>
                  <div style={styles.compareGridWrap}>
                    {results.compare.map((item, idx) => (
                      <div key={idx} style={styles.compareCardItem}>
                        <div style={styles.compareHeader}>
                          <span style={styles.modelGroup}>{item.vehicle?.model_group}</span>
                          <div style={styles.vehicleTitle}>{item.vehicle?.model_name}</div>
                          <div style={styles.comparePrice}>FIPE: R$ {formatBRL(item.vehicle?.price_number)}</div>
                        </div>
                        <div style={styles.compareBody}>
                          {item.pricing?.map(p => (
                            <div key={p.prazo_meses} style={styles.compareRow}>
                              <div style={styles.prazoBadge}>{p.prazo_meses} MESES</div>
                              <div style={styles.mainValue}>R$ {formatBRL(p.mensalidade_calculada)}</div>
                              <div style={styles.subDetail}>Total: R$ {formatBRL(p.mensalidade_calculada * p.prazo_meses)}</div>
                              <div style={{...styles.roiLabel, color: p.roi_estimado > 0.1 ? '#4ade80' : '#eab308'}}>ROI: {(p.roi_estimado * 100).toFixed(1)}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "massa" && (
            <div style={styles.cardFull}>
              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Tabela Geral Chevrolet (Referência)</h2>
                <button onClick={exportMassaToCSV} style={styles.exportBtn}>📥 EXPORTAR TABELA (CSV)</button>
              </div>
              <div style={styles.tableWrapper}>
                <table style={styles.tableMassa}>
                  <thead>
                    <tr><th style={styles.thMassa}>Modelo</th><th style={styles.thMassa}>FIPE</th><th style={styles.thMassa}>12m</th><th style={styles.thMassa}>24m</th><th style={styles.thMassa}>36m</th><th style={styles.thMassa}>48m</th></tr>
                  </thead>
                  <tbody>
                    {models.slice(0, 30).map((m, idx) => {
                      const base = m.price_number || 0;
                      const calc = (ms) => (base * (1 + (taxaJurosMensal * ms)) * (1 + percentualAplicado)) / ms;
                      return (
                        <tr key={idx} style={styles.trBody}>
                          <td style={styles.tdMassa}><strong>{m.model_name}</strong></td>
                          <td style={styles.tdMassa}>R$ {formatBRL(base)}</td>
                          <td style={styles.tdMassaBold}>R$ {formatBRL(calc(12))}</td>
                          <td style={styles.tdMassaBold}>R$ {formatBRL(calc(24))}</td>
                          <td style={styles.tdMassaBold}>R$ {formatBRL(calc(36))}</td>
                          <td style={styles.tdMassaBold}>R$ {formatBRL(calc(48))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div style={styles.cardFull}>
              <h2 style={styles.cardTitle}>Cenários Pré-configurados</h2>
              <div style={styles.actionGrid}>
                {savedScenarios.map(s => (
                  <div key={s.id} style={styles.actionCard} onClick={() => { setTaxaJurosMensal(s.taxa); setPercentualAplicado(s.margem); alert(`Cenário ${s.name} aplicado!`); }}>
                    <h3 style={{color: '#eab308'}}>{s.name}</h3>
                    <p style={{fontSize: 12, color: '#94a3b8'}}>Taxa: {(s.taxa*100).toFixed(2)}% | Margem: {(s.margem*100).toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES AUXILIARES ---
function StatCard({ title, value, icon }) {
  return (
    <div style={styles.statCard}>
      <span style={{fontSize: 24}}>{icon}</span>
      <div><div style={styles.statLabel}>{title}</div><div style={styles.statValue}>{value}</div></div>
    </div>
  );
}

function NavItem({ active, onClick, label, icon }) {
  return (
    <div onClick={onClick} style={{ ...styles.navItem, backgroundColor: active ? "#eab308" : "transparent", color: active ? "#000" : "#94a3b8" }}>
      <span style={{marginRight: 10}}>{icon}</span> {label}
    </div>
  );
}

function Field({ label, value, setValue, step = "1" }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.fieldLabel}>{label}</label>
      <input style={styles.inputSmall} type="number" step={step} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

// --- ESTILOS ---
const styles = {
  page: { display: "flex", minHeight: "100vh", width: "100vw", backgroundColor: "#080c14", color: "#f1f5f9", fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },
  sidebar: { width: "260px", backgroundColor: "#0f172a", borderRight: "1px solid #1e293b", flexShrink: 0, display: 'flex', flexDirection: 'column' },
  sidebarLogoBox: { padding: "45px 20px", textAlign: "center" },
  sidebarLogo: { height: "35px", objectFit: 'contain' }, // Aumentado de 25px para 35px
  nav: { padding: "0 10px", flex: 1 },
  navItem: { padding: "14px 20px", borderRadius: "12px", cursor: "pointer", marginBottom: "5px", fontWeight: 700, fontSize: "14px", display: 'flex', alignItems: 'center' },
  logoutBtn: { margin: "20px", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "transparent", color: "#f87171", cursor: "pointer" },
  
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: { padding: "20px 40px", borderBottom: "1px solid #1e293b" },
  title: { margin: 0, fontSize: 24, fontWeight: 900 },
  subtitle: { color: "#64748b", fontSize: 12 },
  container: { padding: "30px 40px", boxSizing: 'border-box' },

  dashboardWrapper: { display: 'flex', flexDirection: 'column', gap: '30px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  statCard: { background: '#0f172a', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '15px' },
  statLabel: { fontSize: '9px', color: '#64748b', textTransform: 'uppercase' },
  statValue: { fontSize: '16px', fontWeight: 800 },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  actionCard: { background: 'rgba(30, 41, 59, 0.4)', padding: '25px', borderRadius: '20px', border: '1px solid #1e293b', cursor: 'pointer' },

  calculatorWrapper: { display: 'flex', flexDirection: 'column', gap: '30px' },
  configSection: { display: 'flex', gap: '20px', alignItems: 'stretch' },
  cardVehicles: { flex: 1, minWidth: 0, background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px", padding: "25px", border: "1px solid rgba(255,255,255,0.08)" },
  cardParams: { flex: 1, minWidth: 0, background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px", padding: "25px", border: "1px solid rgba(255,255,255,0.08)" },
  
  headerTitleAction: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { marginTop: 0, fontSize: 17, fontWeight: 800, borderLeft: "4px solid #eab308", paddingLeft: 12 },
  modelsBox: { height: "240px", overflowY: "auto", background: "rgba(0,0,0,0.2)", padding: 10, borderRadius: "12px", marginTop: 15 },
  modelItem: { display: "flex", alignItems: "center", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: 'pointer' },
  modelText: { marginLeft: 12 },
  modelGroup: { fontSize: 9, color: "#eab308", fontWeight: 900, textTransform: 'uppercase' },
  modelName: { fontSize: 12, fontWeight: 500 },
  inputSearch: { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white", boxSizing: 'border-box' },
  buttonProcess: { width: '100%', marginTop: '15px', padding: "16px", borderRadius: "12px", background: "#eab308", color: "#000", fontWeight: 900, cursor: "pointer", border: 'none' },
  clearBtn: { background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },

  resultsWrapper: { width: '100%' },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  exportBtn: { padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: 12 },
  clearResultsBtn: { padding: '10px 18px', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid #f87171', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: 12 },
  compareGridWrap: { display: 'flex', flexWrap: 'wrap', gap: '20px' },
  compareCardItem: { flex: '1 1 300px', maxWidth: 'calc(25% - 15px)', background: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b', overflow: 'hidden' },
  compareHeader: { padding: '15px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1e293b' },
  vehicleTitle: { fontSize: 14, fontWeight: 800, minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  comparePrice: { fontSize: 11, color: '#64748b', marginTop: 5 },
  compareBody: { padding: '10px' },
  compareRow: { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' },
  prazoBadge: { fontSize: '9px', color: '#eab308', fontWeight: 900 },
  mainValue: { fontSize: '19px', fontWeight: 900, color: '#fff' },
  subDetail: { fontSize: '10px', color: '#64748b' },
  roiLabel: { fontSize: '11px', fontWeight: 800, marginTop: 8 },

  cardFull: { background: "rgba(30, 41, 59, 0.4)", borderRadius: "20px", padding: "30px", border: "1px solid rgba(255,255,255,0.08)" },
  tableWrapper: { overflowX: 'auto', marginTop: 20 },
  tableMassa: { width: '100%', borderCollapse: 'collapse' },
  thMassa: { textAlign: 'left', padding: '15px', background: '#1e293b', color: '#94a3b8', fontSize: 11 },
  tdMassa: { padding: '15px', borderBottom: '1px solid #1e293b', fontSize: 13 },
  tdMassaBold: { padding: '15px', borderBottom: '1px solid #1e293b', fontWeight: 'bold', color: '#eab308' },

  // LOGIN PAGE
  loginPage: { height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#080c14" },
  loginCard: { width: "500px", padding: "60px 40px", borderRadius: "40px", background: "#0f172a", border: "1px solid #1e293b", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)" },
  
  // CONTAINER LOGOS LADO A LADO - MAIS VISÍVEL
  loginLogoContainer: { display: "flex", alignItems: "center", justifyContent: "center", gap: "35px", marginBottom: "50px" },
  loginLogo: { height: "55px", objectFit: "contain" }, // Aumentado de 30px para 55px
  logoDivider: { width: "2px", height: "60px", background: "rgba(255,255,255,0.15)" },
  daoLogo: { height: "70px", objectFit: "contain", filter: 'brightness(1.2)' }, // Aumentado de 45px para 70px
  
  loginTitle: { fontSize: 22, fontWeight: 800, marginBottom: 40, color: "#fde68a", letterSpacing: "1px", textTransform: 'uppercase' },
  
  loginButton: { width: "100%", padding: "18px", borderRadius: "12px", background: "#eab308", fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '15px', color: '#000' },
  input: { width: "100%", padding: "14px", borderRadius: "10px", background: "#080c14", border: "1px solid #334155", color: "#fff", boxSizing: 'border-box' },
  inputGroup: { marginBottom: 15, textAlign: 'left' },
  label: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 5 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  inputSmall: { width: "100%", padding: "10px", borderRadius: "8px", background: "#080c14", border: "1px solid #1e293b", color: "#fff", boxSizing: 'border-box', fontSize: 13 },
  fieldLabel: { fontSize: 10, color: "#64748b", marginBottom: 3, display: 'block' }
};