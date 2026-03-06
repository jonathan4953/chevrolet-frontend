// ConfigSistema.jsx
// Personalização Visual do Sistema

const DEFAULT_COLOR_PALETTE = {
  primary:    "#f97316",
  primaryDark:"#ea580c",
  accent:     "#f59e0b",
  success:    "#10b981",
  danger:     "#ef4444",
  info:       "#3b82f6",
  sidebar:    "#1e293b",
  background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)",
  cardBg:     "#ffffff",
  border:     "#e2e8f0",
  text:       "#1e293b",
  textMuted:  "#64748b",
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

  if (activeTab !== "config_sistema") return null;

  return (
    <div style={styles.cardFull}>
      <h2 style={styles.cardTitle}>Personalização Visual do Sistema</h2>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 30 }}>
        Somente administradores podem alterar logos e paleta de cores.
      </p>

      {/* ── LOGOS ── */}
      <h3 style={{ fontSize: '13px', color: '#f97316', textTransform: 'uppercase', borderLeft: '3px solid #f97316', paddingLeft: '10px', marginBottom: '20px' }}>
        Logos do Sistema
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>

        {[
          { key: 'login',   label: 'Tela de Login',          bg: '#f1f5f9' },
          { key: 'sidebar', label: 'Sidebar (Menu Lateral)',  bg: '#1e293b' },
          { key: 'pdf',     label: 'Proposta PDF (Download)', bg: '#ffffff' },
        ].map(({ key, label, bg }) => (
          <div key={key} style={{ background: '#f8fafc', padding: '25px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 800 }}>{label}</h3>
            <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', background: bg, borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <img src={sysLogos[key]} alt={label} style={{ maxHeight: '60px', maxWidth: '80%', objectFit: 'contain' }} />
            </div>
            <input type="file" id={`logo_${key}`} accept=".jpg,.png,.jpeg,.svg" style={{ display: 'none' }} onChange={(e) => handleLogoChange(e, key)} />
            <label htmlFor={`logo_${key}`} style={{ ...styles.clearBtn, color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'block', padding: '10px', borderRadius: '8px', marginBottom: '8px', fontSize: 12 }}>
              📁 Substituir Imagem
            </label>
            <button
              onClick={() => {
                const u = { ...sysLogos, [key]: OMNI26_DEFAULT_LOGO };
                setSysLogos(u);
                try { sessionStorage.setItem('omni26_logos', JSON.stringify(u)); } catch(e) {}
              }}
              style={{ ...styles.clearBtn, color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', display: 'block', width: '100%', padding: '8px', borderRadius: '8px', fontSize: '11px' }}
            >
              ↺ Restaurar Padrão
            </button>
          </div>
        ))}

      </div>

      {/* ── PALETA ── */}
      <h3 style={{ fontSize: '13px', color: '#f97316', textTransform: 'uppercase', borderLeft: '3px solid #f97316', paddingLeft: '10px', marginBottom: '20px' }}>
        Paleta de Cores do Sistema
      </h3>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: '20px' }}>
        Suporta hex (ex: <code style={{ color:'#f97316' }}>#FF6600</code>) e RGB (ex: <code style={{ color:'#f97316' }}>rgb(255,102,0)</code>).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { key: 'primary',   label: 'Cor Primária (botões)',      hint: '#f97316' },
          { key: 'accent',    label: 'Cor de Acento (títulos)',    hint: '#f59e0b' },
          { key: 'success',   label: 'Cor de Sucesso',             hint: '#10b981' },
          { key: 'danger',    label: 'Cor de Erro/Perigo',         hint: '#ef4444' },
          { key: 'info',      label: 'Cor Informativa',            hint: '#3b82f6' },
          { key: 'navActive', label: 'Item Ativo no Menu',         hint: '#f97316' },
        ].map(({ key, label, hint }) => (
          <div key={key} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px', fontWeight: 800 }}>
              {label}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <input
                type="color"
                value={(() => { try { const c = colorPalette[key]; return (c && c.startsWith('#') && c.length === 7) ? c : '#f97316'; } catch(e) { return '#f97316'; } })()}
                onChange={(e) => savePalette({ ...colorPalette, [key]: e.target.value })}
                style={{ width: '40px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '2px', background: 'none' }}
              />
              <input
                type="text"
                value={colorPalette[key] || ''}
                onChange={(e) => savePalette({ ...colorPalette, [key]: e.target.value })}
                placeholder={hint}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #d1d5db', color: '#1e293b', fontSize: '12px' }}
              />
            </div>
            <div style={{ height: '5px', borderRadius: '3px', background: colorPalette[key] || hint, border: '1px solid #e2e8f0' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
        <button
          onClick={() => { savePalette(DEFAULT_COLOR_PALETTE); alert('Paleta restaurada para o padrão Omni26!'); }}
          style={{ ...styles.clearResultsBtn, padding: '12px 24px' }}
        >
          ↺ Restaurar Paleta Padrão
        </button>
        <button
          onClick={() => alert('Paleta salva e aplicada ao sistema!')}
          style={{ ...styles.exportBtn, background: colorPalette.primary || '#f97316', boxShadow: `0 4px 15px ${colorPalette.primary || '#f97316'}66` }}
        >
          ✔ Confirmar Paleta
        </button>
      </div>

    </div>
  );
}
