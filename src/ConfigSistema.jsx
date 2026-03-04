// ConfigSistema.jsx
// Personalização Visual + Cenários de Mercado

const DEFAULT_COLOR_PALETTE = {
  primary:    "#f97316",
  primaryDark:"#ea6c0a",
  accent:     "#eab308",
  success:    "#10b981",
  danger:     "#f87171",
  info:       "#3b82f6",
  sidebar:    "rgba(15, 23, 42, 0.7)",
  background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
  cardBg:     "rgba(15, 23, 42, 0.6)",
  border:     "rgba(255,255,255,0.1)",
  text:       "#f1f5f9",
  textMuted:  "#94a3b8",
  navActive:  "#f97316",
};

export default function ConfigSistema({
  styles,
  currentUser,
  activeTab,
  sysLogos,        setSysLogos,
  OMNI26_DEFAULT_LOGO,
  colorPalette,    setColorPalette,
  savedScenarios,
  setTaxaJurosMensal,
  setPercentualAplicado,
  logAction,
}) {

  const savePalette = (newPalette) => {
    setColorPalette(newPalette);
    try { sessionStorage.setItem('omni26_palette', JSON.stringify(newPalette)); } catch(e) {}
  };

  const handleLogoChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...sysLogos, [key]: reader.result };
        setSysLogos(updated);
        try { sessionStorage.setItem('omni26_logos', JSON.stringify(updated)); } catch(e) {}
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {activeTab === "config_sistema" && (
        <div style={styles.cardFull}>
          <h2 style={styles.cardTitle}>Personalização Visual do Sistema</h2>
          <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 30}}>
            Somente administradores podem alterar logos e paleta de cores.
          </p>

          <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', borderLeft: '3px solid #eab308', paddingLeft: '10px', marginBottom: '20px'}}>Logos do Sistema</h3>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px'}}>

            <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
              <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Tela de Login</h3>
              <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)'}}>
                <img src={sysLogos.login} alt="Login Logo" style={{maxHeight: '60px', maxWidth: '80%', objectFit: 'contain'}} />
              </div>
              <input type="file" id="logoLogin" accept=".jpg,.png,.jpeg,.svg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'login')} />
              <label htmlFor="logoLogin" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px', marginBottom: '8px'}}>📁 Substituir Imagem</label>
              <button onClick={() => { const u = {...sysLogos, login: OMNI26_DEFAULT_LOGO}; setSysLogos(u); try{sessionStorage.setItem('omni26_logos', JSON.stringify(u));}catch(e){} }} style={{...styles.clearBtn, color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', display: 'block', width: '100%', padding: '8px', borderRadius: '10px', fontSize: '11px'}}>↺ Restaurar Padrão</button>
            </div>

            <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
              <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Sidebar (Menu Lateral)</h3>
              <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)'}}>
                <img src={sysLogos.sidebar} alt="Sidebar Logo" style={{maxHeight: '40px', maxWidth: '80%', objectFit: 'contain'}} />
              </div>
              <input type="file" id="logoSidebar" accept=".jpg,.png,.jpeg,.svg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'sidebar')} />
              <label htmlFor="logoSidebar" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px', marginBottom: '8px'}}>📁 Substituir Imagem</label>
              <button onClick={() => { const u = {...sysLogos, sidebar: OMNI26_DEFAULT_LOGO}; setSysLogos(u); try{sessionStorage.setItem('omni26_logos', JSON.stringify(u));}catch(e){} }} style={{...styles.clearBtn, color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', display: 'block', width: '100%', padding: '8px', borderRadius: '10px', fontSize: '11px'}}>↺ Restaurar Padrão</button>
            </div>

            <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
              <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Proposta PDF (Download)</h3>
              <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}}>
                <img src={sysLogos.pdf} alt="PDF Logo" style={{maxHeight: '60px', maxWidth: '80%', objectFit: 'contain'}} />
              </div>
              <input type="file" id="logoPdf" accept=".jpg,.png,.jpeg,.svg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'pdf')} />
              <label htmlFor="logoPdf" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px', marginBottom: '8px'}}>📁 Substituir Imagem</label>
              <button onClick={() => { const u = {...sysLogos, pdf: OMNI26_DEFAULT_LOGO}; setSysLogos(u); try{sessionStorage.setItem('omni26_logos', JSON.stringify(u));}catch(e){} }} style={{...styles.clearBtn, color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', display: 'block', width: '100%', padding: '8px', borderRadius: '10px', fontSize: '11px'}}>↺ Restaurar Padrão</button>
            </div>

          </div>

          <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', borderLeft: '3px solid #eab308', paddingLeft: '10px', marginBottom: '20px'}}>Paleta de Cores do Sistema</h3>
          <p style={{color: '#64748b', fontSize: 12, marginBottom: '20px'}}>
            Suporta hex (ex: <code style={{color:'#f97316'}}>#FF6600</code>) e RGB (ex: <code style={{color:'#f97316'}}>rgb(255,102,0)</code>).
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px'}}>
            {[
              {key: 'primary',   label: 'Cor Primária (botões, destaque)',  hint: 'Ex: #f97316'},
              {key: 'accent',    label: 'Cor de Acento (títulos, bordas)',  hint: 'Ex: #eab308'},
              {key: 'success',   label: 'Cor de Sucesso',                   hint: 'Ex: #10b981'},
              {key: 'danger',    label: 'Cor de Erro/Perigo',               hint: 'Ex: #f87171'},
              {key: 'info',      label: 'Cor Informativa',                  hint: 'Ex: #3b82f6'},
              {key: 'navActive', label: 'Cor do Item Ativo no Menu',        hint: 'Ex: #f97316'},
            ].map(({key, label, hint}) => (
              <div key={key} style={{background: 'rgba(0,0,0,0.3)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <label style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px', fontWeight: 'bold'}}>{label}</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                  <input
                    type="color"
                    value={(() => { try { const c = colorPalette[key]; if (c && c.startsWith('#') && c.length === 7) return c; return '#f97316'; } catch(e) { return '#f97316'; } })()}
                    onChange={(e) => savePalette({...colorPalette, [key]: e.target.value})}
                    style={{width: '44px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'none', padding: '2px'}}
                  />
                  <input
                    type="text"
                    value={colorPalette[key] || ''}
                    onChange={(e) => savePalette({...colorPalette, [key]: e.target.value})}
                    placeholder={hint}
                    style={{flex: 1, padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px'}}
                  />
                </div>
                <div style={{height: '6px', borderRadius: '3px', background: colorPalette[key] || '#f97316', marginTop: '6px', border: '1px solid rgba(255,255,255,0.1)'}} />
              </div>
            ))}
          </div>
          <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
            <button
              onClick={() => { savePalette(DEFAULT_COLOR_PALETTE); alert('Paleta restaurada para o padrão Omni26!'); }}
              style={{...styles.clearResultsBtn, padding: '12px 24px'}}
            >↺ Restaurar Paleta Padrão</button>
            <button
              onClick={() => alert('Paleta salva e aplicada ao sistema!')}
              style={{...styles.exportBtn, background: colorPalette.primary || '#f97316', boxShadow: `0 4px 15px ${colorPalette.primary || '#f97316'}66`}}
            >✔ Confirmar Paleta</button>
          </div>

        </div>
      )}

      {activeTab === "config" && (
        <div style={styles.cardFull}>
          <h2 style={styles.cardTitle}>Cenários de Mercado</h2>
          <div style={styles.actionGrid}>
            {savedScenarios.map(s => (
              <div
                key={s.id}
                style={styles.actionCard}
                onClick={() => {
                  setTaxaJurosMensal(s.taxa);
                  setPercentualAplicado(s.margem);
                  logAction("Cenários", `Aplicou cenário: ${s.name}`);
                  alert(`Cenário ${s.name} aplicado!`);
                }}
              >
                <h3 style={{color: '#eab308'}}>{s.name}</h3>
                <p style={{fontSize: 12, color: '#94a3b8'}}>
                  Taxa: {(s.taxa*100).toFixed(2)}% | Margem: {(s.margem*100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}