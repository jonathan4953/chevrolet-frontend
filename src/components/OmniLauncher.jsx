import React, { useState, useEffect } from 'react';

// A paleta de cores oficial do Omni26 (ajustada para combinar com a sua Sidebar atual)
const C = {
  primary: "#F26B25",
  text: "#0f172a",
  muted: "#94a3b8",
  subtle: "#475569",
  border: "#e2e8f0",
  // Cor especial para o fundo escuro do Launcher (um tom ardósia bem escuro)
  overlayBg: "rgba(15, 23, 42, 0.96)", 
};

export default function OmniLauncher({ isOpen, onClose, modulosAtivos = [], onNavigate }) {
  const [activeTab, setActiveTab] = useState('todos');
  const [busca, setBusca] = useState('');

  // Bloqueia a rolagem do fundo quando o menu está aberto e reseta a busca
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setBusca('');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Se o menu estiver fechado, não renderiza nada
  if (!isOpen) return null;

  // Cria as abas dinamicamente baseadas nos grupos que o usuário tem permissão para ver
  const gruposDisponiveis = ['todos', ...new Set(modulosAtivos.map(m => m.group))];

  // Filtra por aba e por busca
  const modulosFiltrados = modulosAtivos.filter(m => {
    const matchBusca = m.label.toLowerCase().includes(busca.toLowerCase());
    const matchTab = activeTab === 'todos' || m.group === activeTab;
    return matchBusca && matchTab;
  });

  // Estilos
  const s = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: C.overlayBg, backdropFilter: 'blur(12px)',
      zIndex: 99999, display: 'flex', flexDirection: 'column',
      color: '#FFFFFF', padding: '40px 10%',
      animation: 'fadeInOmni 0.2s ease-out',
      fontFamily: 'system-ui, sans-serif'
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      maxWidth: 1000, margin: '0 auto', width: '100%'
    },
    logoDiv: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' },
    closeBtn: {
      background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
      width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#FFF', fontSize: 20, cursor: 'pointer', transition: 'all 0.2s'
    },
    searchContainer: {
      width: '100%', maxWidth: 800, margin: '50px auto 30px', position: 'relative'
    },
    searchInput: {
      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px', color: '#FFF', fontSize: 18, padding: '16px 20px 16px 50px',
      outline: 'none', transition: 'all 0.3s', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    },
    searchIcon: { position: 'absolute', left: 20, top: 18, opacity: 0.5, fontSize: 18 },
    tabs: {
      display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap',
      margin: '0 auto 40px', maxWidth: 800
    },
    tab: (active) => ({
      background: active ? C.primary : 'transparent',
      border: active ? `1px solid ${C.primary}` : '1px solid rgba(255,255,255,0.2)',
      color: active ? '#FFF' : '#CCC',
      padding: '8px 20px', borderRadius: '20px', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em'
    }),
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 20, maxWidth: 1000, margin: '0 auto', flex: 1, alignContent: 'start', width: '100%',
      overflowY: 'auto', paddingBottom: '40px'
    },
    item: {
      display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
      padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s'
    },
    itemIcon: {
      width: 48, height: 48, background: 'rgba(242, 107, 37, 0.15)', // Laranja primário com opacidade
      color: C.primary, borderRadius: '12px', display: 'flex', alignItems: 'center', 
      justifyContent: 'center'
    },
    itemText: { fontSize: 15, fontWeight: 700, lineHeight: 1.3, flex: 1, color: '#FFF' },
    itemSub: { fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
  };

  return (
    <div style={s.overlay}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logoDiv}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{color: '#FFF', fontSize: 18, fontWeight: 900}}>O</span>
          </div>
          Omni26 <span style={{ color: C.primary, fontWeight: 400 }}>Launcher</span>
        </div>
        <button 
          style={s.closeBtn} 
          onClick={onClose} 
          onMouseEnter={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'rotate(90deg)'; }} 
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          title="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Busca Central */}
      <div style={s.searchContainer}>
        <span style={s.searchIcon}>🔍</span>
        <input 
          style={s.searchInput} 
          placeholder="O que você precisa acessar hoje?" 
          value={busca} 
          onChange={e => setBusca(e.target.value)}
          autoFocus
          onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 4px ${C.primary}33`; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}
        />
      </div>

      {/* Abas Dinâmicas */}
      <div style={s.tabs}>
        {gruposDisponiveis.map(grupo => (
          <button key={grupo} style={s.tab(activeTab === grupo)} onClick={() => setActiveTab(grupo)}>
            {grupo}
          </button>
        ))}
      </div>

      {/* Grid de Módulos Reais */}
      <div style={s.grid}>
        {modulosFiltrados.length > 0 ? modulosFiltrados.map(m => {
          const IconeDoModulo = m.icon;
          return (
            <div 
              key={m.key} 
              style={s.item} 
              onClick={() => onNavigate(m)} // Usa a função handleNavClick da Sidebar!
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }} 
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
            >
              <div style={s.itemIcon}>
                <IconeDoModulo size={24} strokeWidth={1.5} />
              </div>
              <div>
                <div style={s.itemText}>{m.label}</div>
                <div style={s.itemSub}>{m.group}</div>
              </div>
            </div>
          );
        }) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Nenhuma função encontrada</h3>
            <p style={{ marginTop: 8, fontSize: 14 }}>Você não possui permissão ou o termo buscado não existe.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInOmni { 
          from { opacity: 0; backdrop-filter: blur(0px); transform: scale(1.02); } 
          to { opacity: 1; backdrop-filter: blur(12px); transform: scale(1); } 
        }
        /* Esconde o scrollbar do grid no launcher para ficar limpo */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
      `}</style>
    </div>
  );
}