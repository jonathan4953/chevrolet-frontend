import React, { useState } from "react";
import { api } from "./api";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

const formatBRL = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- COMPONENTES AUXILIARES ---

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span 
      style={{ position: "relative", display: "inline-flex", marginLeft: 6 }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          width: 16, height: 16, borderRadius: "50%", fontSize: 10, fontWeight: 800,
          background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}40`,
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help",
          userSelect: "none", lineHeight: 1, fontFamily: "serif"
        }}
      >ⓘ</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#2A2B2D", border: "1px solid #000", borderRadius: 10,
          padding: "10px 14px", fontSize: 11, color: "#FFF", width: 260, zIndex: 100,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", lineHeight: 1.5, textAlign: "left", fontWeight: "normal"
        }}>
          {text}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "#2A2B2D" }} />
        </div>
      )}
    </span>
  );
}

const ConfirmModalUI = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42,43,45,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ background: "#FFFFFF", borderRadius: "24px", padding: "32px", width: "90%", maxWidth: "400px", border: `1px solid ${C.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: C.red, fontWeight: 900 }}>Atenção</h3>
        <p style={{ fontSize: "14px", color: C.subtle, marginBottom: "28px", fontWeight: 600, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "10px 20px", borderRadius: "10px", background: C.bgAlt, color: C.subtle, border: `1px solid ${C.border}`, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: "10px 20px", borderRadius: "10px", background: C.red, color: "#fff", border: "none", cursor: "pointer", fontWeight: 800 }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

function FieldInfo({ label, info, children, styles }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "10px", color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center" }}>
        {label}
        {info && <InfoTip text={info} />}
      </label>
      {children}
    </div>
  );
}

function Field({ label, info, value, setValue, step = "1", placeholder, styles }) {
  return (
    <FieldInfo label={label} info={info} styles={styles}>
      <input
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "#FFFFFF", color: C.text, border: `1px solid #D4D5D6`, outline: "none", boxSizing: "border-box" }}
        type="number"
        step={step}
        value={value}
        onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
      />
    </FieldInfo>
  );
}

export default function Calculadora({
  styles, models, filteredModels, availableBrands, clientes,
  results, setResults, quantidades, setQuantidades,
  selectedVehicles, setSelectedVehicles,
  selectedBrand, setSelectedBrand,
  search, setSearch,
  yearNum, setYearNum,
  kmMensal, setKmMensal,
  taxaJurosMensal, setTaxaJurosMensal,
  percentualAplicado, setPercentualAplicado,
  revisaoMensal, setRevisaoMensal,
  valorFinanciado, setValorFinanciado,
  nperFinanciamento, setNperFinanciamento,
  franquiaKm, setFranquiaKm,
  custoPneus, setCustoPneus,
  seguroAnual, setSeguroAnual,
  impostosMensais, setImpostosMensais,
  rastreamentoMensal, setRastreamentoMensal,
  projecaoRevenda, setProjecaoRevenda,
  clienteSelecionado, setClienteSelecionado,
  clienteNome, setClienteNome,
  loading, setLoading,
  pdfLoadingMap, error, setError,
  handleDownloadPDF, exportToCSV, clearResults, resetParams, resetVehicles, logAction,
  descontoPct, setDescontoPct, prazoContrato, setPrazoContrato
}) {

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: "", action: null });

  const confirmAction = (message, action) => {
    setConfirmDialog({ isOpen: true, message, action });
  };

  const handleConfirm = () => {
    if (confirmDialog.action) confirmDialog.action();
    setConfirmDialog({ isOpen: false, message: "", action: null });
  };

  async function handleCalculate() {
    setError(""); 
    if (selectedVehicles.length === 0) { 
      setError("Selecione ao menos um veículo."); 
      return; 
    } 
    setLoading(true);
    try {
      const payload = { 
        vehicles: selectedVehicles.map(m => ({ 
          model_name_clean: m, 
          year_num: Number(yearNum), 
          km_mensal: Number(kmMensal), 
          taxa_juros_mensal: Number(taxaJurosMensal), 
          percentual_applied: Number(percentualAplicado), 
          revisao_mensal: Number(revisaoMensal), 
          custo_pneus: Number(custoPneus), 
          seguro_anual: Number(seguroAnual), 
          impostos_mensais: Number(impostosMensais), 
          rastreamento_mensal: Number(rastreamentoMensal), 
          prazos: [12, 24, 36], 
          valor_financiado: Number(valorFinanciado),
          nper_financiamento: Number(nperFinanciamento),
          franquia_km: Number(franquiaKm),
          projecao_revenda: projecaoRevenda ? Number(projecaoRevenda) : null,
          desconto_percentual: Number(descontoPct) || 0,
          prazo_contrato: Number(prazoContrato) || 24,
        })) 
      };
      const r = await api.post("/pricing/compare", payload); 
      setResults(r.data);
      logAction("Calculadora", `Realizou cálculo comparativo de ${selectedVehicles.length} veículos`);
    } catch (e) { 
      setError("⚠️ Erro ao processar cálculos."); 
    } finally { 
      setLoading(false); 
    }
  }

  const cardStyle = {
    background: "#FFFFFF",
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      
      <ConfirmModalUI 
        isOpen={confirmDialog.isOpen} 
        message={confirmDialog.message} 
        onConfirm={handleConfirm} 
        onCancel={() => setConfirmDialog({ isOpen: false, message: "", action: null })} 
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        
        {/* 1. SELEÇÃO DE VEÍCULOS */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: C.primary }} />
              <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: 0 }}>1. Seleção de Veículos</h2>
            </div>
            <button onClick={() => confirmAction("Deseja limpar os veículos?", resetVehicles)} style={{ background: "none", border: "none", color: C.red, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>LIMPAR ({selectedVehicles.length})</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700 }} value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
              {availableBrands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <input style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13 }} placeholder="🔍 Filtrar modelos..." value={search} onChange={(e) => setSearch(e.target.value)} />
            
            <div style={{ height: 400, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 12, background: C.bgAlt, padding: 8 }}>
              {filteredModels.map(m => (
                <label key={m.model_name_clean} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#FFF" } onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <input type="checkbox" style={{ accentColor: C.primary }} checked={selectedVehicles.includes(m.model_name_clean)} onChange={() => setSelectedVehicles(prev => prev.includes(m.model_name_clean) ? prev.filter(x => x !== m.model_name_clean) : [...prev, m.model_name_clean])} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>
                    {m.brand_name?.toUpperCase()} - {m.model_name} - {(m.year_model === 32000) ? 2026 : m.year_model}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>
        
        {/* 2. AJUSTE DE PARÂMETROS */}
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: C.primary }} />
              <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: 0 }}>2. Ajuste de Parâmetros</h2>
            </div>
            <button onClick={() => confirmAction("Restaurar padrões?", resetParams)} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>RESETAR</button>
          </div>
          
          <div style={{ marginBottom: 16, padding: '12px', borderRadius: '10px', background: valorFinanciado > 0 ? `${C.primary}10` : C.bgAlt, border: `1px solid ${valorFinanciado > 0 ? `${C.primary}40` : C.border}` }}>
            <div style={{ fontSize: '9px', color: valorFinanciado > 0 ? C.primary : C.muted, textTransform: 'uppercase', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {valorFinanciado > 0 ? '🟠 BASE: VALOR MANUAL' : '⚪ BASE: TABELA FIPE'}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Valor Base (R$)" info="Sobrepõe o valor da FIPE." value={valorFinanciado} setValue={setValorFinanciado} placeholder="Ex: 150000" />
            <Field label="Desconto (%)" value={descontoPct} setValue={setDescontoPct} step="0.01" />
            
            <FieldInfo label="Prazo Contrato">
              <select style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13, background: "#FFF", fontWeight: 700 }} value={prazoContrato} onChange={(e) => setPrazoContrato(Number(e.target.value))}>
                <option value={12}>12 meses</option><option value={24}>24 meses</option><option value={36}>36 meses</option>
              </select>
            </FieldInfo>
            
            <FieldInfo label="Franquia KM">
              <select style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid #D4D5D6`, fontSize: 13, background: "#FFF", fontWeight: 700 }} value={franquiaKm} onChange={(e) => setFranquiaKm(Number(e.target.value))}>
                <option value={1000}>1.000 km</option><option value={2000}>2.000 km</option><option value={3000}>3.000 km</option>
              </select>
            </FieldInfo>

            <Field label="Manutenção (Total)" value={revisaoMensal} setValue={setRevisaoMensal} />
            <Field label="Custo Pneus (Jogo)" value={custoPneus} setValue={setCustoPneus} />
            <Field label="Seguro (Anual)" value={seguroAnual} setValue={setSeguroAnual} />
            <Field label="Impostos (Anual)" value={impostosMensais} setValue={setImpostosMensais} />
          </div>
          
          <button 
            style={{ marginTop: 20, width: "100%", padding: "16px", borderRadius: 12, border: "none", background: C.primary, color: "#FFF", fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 15px ${C.primary}33`, opacity: loading ? 0.7 : 1 }} 
            onClick={handleCalculate} disabled={loading}
          >
            {loading ? "CALCULANDO..." : "GERAR ESTUDO COMPARATIVO"}
          </button>
        </section>
      </div>

      {/* RESULTADOS */}
      {results?.compare && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.bgAlt, padding: "20px 24px", borderRadius: 16, border: `1px solid ${C.border}` }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: 0 }}>Resultado do Comparativo</h2>
            <div style={{ display: "flex", gap: 12 }}>
              <select 
                style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, width: 300, fontWeight: 700 }}
                value={clienteSelecionado?.id || ""}
                onChange={(e) => {
                  const c = clientes.find(cl => String(cl.id) === e.target.value);
                  setClienteSelecionado(c || null);
                  if (c) setClienteNome(c.nome_razao || c.nome || "");
                }}
              >
                <option value="">👤 Selecionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_razao || c.nome}</option>)}
              </select>
              <button onClick={exportToCSV} style={{ background: C.green, color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>📥 EXCEL</button>
              <button onClick={clearResults} style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted, padding: "10px 20px", borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>🗑️ LIMPAR</button>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 24 }}>
            {results.compare.map((item, idx) => {
              const vKey = item.vehicle.model_name_clean; 
              const q = quantidades[vKey] || 1; 
              const isPdfLoading = pdfLoadingMap[vKey] || false;
              
              return (
                <div key={idx} style={{ ...cardStyle, padding: 0 }}>
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: C.primary, background: `${C.primary}15`, padding: "4px 10px", borderRadius: 20 }}>{item.vehicle?.brand_name?.toUpperCase()}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: "12px 0 6px" }}>{item.vehicle?.model_name}</h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.muted }}>UNIDADES:</span>
                      <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "#FFF", cursor: "pointer", fontWeight: 800 }} onClick={() => setQuantidades({...quantidades, [vKey]: Math.max(1, q - 1)})}>-</button>
                      <span style={{ fontWeight: 900, fontSize: 16, width: 30, textAlign: 'center' }}>{q}</span>
                      <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "#FFF", cursor: "pointer", fontWeight: 800 }} onClick={() => setQuantidades({...quantidades, [vKey]: q + 1})}>+</button>
                    </div>
                  </div>
                  
                  <div style={{ padding: "24px" }}>
                    {item.pricing?.map(p => (
                      <div key={p.prazo_meses} style={{ padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: C.subtle }}>PLANO {p.prazo_meses} MESES</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: "#FFF", padding: "4px 10px", borderRadius: 6, background: p.status === 'APROVAR' ? C.green : p.status === 'AJUSTAR' ? C.yellow : C.red }}>{p.status}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>R$ {formatBRL(p.mensalidade_final)}</div>
                        {q > 1 && <div style={{ fontSize: 14, fontWeight: 800, color: C.primary, marginTop: 4 }}>TOTAL FROTA: R$ {formatBRL(p.mensalidade_final * q)}</div>}
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 14 }}>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Técnica: R$ {formatBRL(p.mensalidade_tecnica)}</div>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>ROI: {p.roi_percentual}%</div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleDownloadPDF(vKey)} 
                      disabled={isPdfLoading} 
                      style={{ marginTop: 24, width: "100%", padding: "14px", borderRadius: 12, background: C.bgAlt, border: `1px solid ${C.border}`, color: C.text, fontWeight: 900, fontSize: 13, cursor: "pointer", transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.border}
                      onMouseLeave={e => e.currentTarget.style.background = C.bgAlt}
                    >
                      {isPdfLoading ? "⌛ GERANDO PDF..." : "📄 BAIXAR PROPOSTA COMERCIAL"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}