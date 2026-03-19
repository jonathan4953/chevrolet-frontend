import React from "react";

const DEFAULT_COLOR_PALETTE = {
  primary: "#F26B25",
  primaryDark: "#D95A1E",
  accent: "#F26B25",
  success: "#22A06B",
  danger: "#D93025",
  info: "#1A73E8",
  sidebar: "#FFFFFF",
  background: "#F9FAFB",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#2A2B2D",
  textMuted: "#8E9093",
  navActive: "#F26B25",
};

const C = {
  primary: "#F26B25",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bgAlt: "#F9FAFB"
};

export default function ConfigSistema({
  styles,
  currentUser,
  activeTab,
  sysLogos,
  setSysLogos,
  OMNI26_DEFAULT_LOGO,
  colorPalette,
  setColorPalette,
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

  const sectionTitleStyle = {
    fontSize: '12px',
    color: C.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderLeft: `4px solid ${C.primary}`,
    paddingLeft: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: 0 }}>Personalização Visual</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: '4px 0 0', fontWeight: 600 }}>
          Controle a identidade visual da plataforma. Alterações em logos e paleta refletem em todo o sistema.
        </p>
      </div>

      {/* ── LOGOS ── */}
      <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h3 style={sectionTitleStyle}>🖼️ Identidade Visual (Logos)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '10px' }}>
          {[
            { key: 'login', label: 'Tela de Acesso', bg: '#F1F5F9' },
            { key: 'sidebar', label: 'Menu Lateral (Sidebar)', bg: '#F8FAFC' },
            { key: 'pdf', label: 'Proposta Comercial (PDF)', bg: '#FFFFFF' },
          ].map(({ key, label, bg }) => (
            <div key={key} style={{ background: C.bgAlt, padding: '24px', borderRadius: '16px', textAlign: 'center', border: `1px solid ${C.border}` }}>
              <h4 style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', marginBottom: '16px', fontWeight: 900, letterSpacing: '0.05em' }}>{label}</h4>
              
              <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: bg, borderRadius: '12px', border: `1px solid ${C.border}`, padding: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <img src={sysLogos[key]} alt={label} style={{ maxHeight: '70px', maxWidth: '90%', objectFit: 'contain' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="file" id={`logo_${key}`} accept=".jpg,.png,.jpeg,.svg" style={{ display: 'none' }} onChange={(e) => handleLogoChange(e, key)} />
                <label htmlFor={`logo_${key}`} style={{ background: '#FFF', border: `1px solid ${C.border}`, color: C.text, cursor: 'pointer', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}>
                  📁 Substituir Logo
                </label>
                <button
                  onClick={() => {
                    const u = { ...sysLogos, [key]: OMNI26_DEFAULT_LOGO };
                    setSysLogos(u);
                    try { sessionStorage.setItem('omni26_logos', JSON.stringify(u)); } catch(e) {}
                  }}
                  style={{ background: 'none', border: 'none', color: C.primary, cursor: 'pointer', padding: '8px', fontSize: '11px', fontWeight: 800 }}
                >
                  ↺ Restaurar Padrão
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PALETA ── */}
      <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <h3 style={sectionTitleStyle}>🎨 Cores do Ecossistema</h3>
        <p style={{ color: C.subtle, fontSize: 13, marginBottom: '24px', fontWeight: 600 }}>
          Defina as cores globais. Utilize o seletor ou insira o código hexadecimal (ex: <span style={{ color: C.primary }}>#F26B25</span>).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { key: 'primary', label: 'Cor Primária (Ações)', hint: '#F26B25' },
            { key: 'success', label: 'Sucesso (Pagtos/OK)', hint: '#22A06B' },
            { key: 'danger', label: 'Erro / Perigo', hint: '#D93025' },
            { key: 'info', label: 'Info / Links', hint: '#1A73E8' },
            { key: 'navActive', label: 'Destaque de Menu', hint: '#F26B25' },
            { key: 'sidebar', label: 'Fundo do Menu', hint: '#FFFFFF' },
          ].map(({ key, label, hint }) => (
            <div key={key} style={{ background: C.bgAlt, padding: '18px', borderRadius: '12px', border: `1px solid ${C.border}`, transition: 'all 0.2s' }}>
              <label style={{ fontSize: '10px', color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: '12px', fontWeight: 900 }}>
                {label}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="color"
                  value={(() => { try { const c = colorPalette[key]; return (c && c.startsWith('#') && c.length === 7) ? c : hint; } catch(e) { return hint; } })()}
                  onChange={(e) => savePalette({ ...colorPalette, [key]: e.target.value })}
                  style={{ width: '44px', height: '40px', borderRadius: '10px', border: `1px solid ${C.border}`, cursor: 'pointer', padding: '3px', background: '#FFF' }}
                />
                <input
                  type="text"
                  value={colorPalette[key] || ''}
                  onChange={(e) => savePalette({ ...colorPalette, [key]: e.target.value })}
                  placeholder={hint}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: '#FFFFFF', border: `1px solid #D4D5D6`, color: C.text, fontSize: '13px', fontWeight: 700, outline: 'none' }}
                />
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: colorPalette[key] || hint, border: `1px solid rgba(0,0,0,0.05)` }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', borderTop: `1px solid ${C.border}`, paddingTop: '24px' }}>
          <button
            onClick={() => { savePalette(DEFAULT_COLOR_PALETTE); alert('Configurações originais Omni26 restauradas!'); }}
            style={{ background: '#FFF', border: `1px solid ${C.border}`, color: C.subtle, padding: '14px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
          >
            ↺ Restaurar Padrões
          </button>
          <button
            onClick={() => alert('As novas cores foram aplicadas ao ambiente!')}
            style={{ background: C.primary, color: "#fff", border: "none", padding: '14px 32px', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 15px ${C.primary}44` }}
          >
            ✔ Confirmar Alterações
          </button>
        </div>
      </div>

    </div>
  );
}