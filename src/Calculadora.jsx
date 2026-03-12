import React, { useState } from "react";
import { api } from "./api";

const formatBRL = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- COMPONENTES AUXILIARES ---

// 1. Tooltip Info (Circulada Latina Pequena Letra I) - Agora com Hover
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
          background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "help",
          userSelect: "none", lineHeight: 1, fontFamily: "serif"
        }}
      >ⓘ</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "#1e293b", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 10,
          padding: "10px 14px", fontSize: 11, color: "#e2e8f0", width: 260, zIndex: 100,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", lineHeight: 1.5, textAlign: "left", fontWeight: "normal"
        }}>
          {text}
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "#1e293b", border: "1px solid rgba(59, 130, 246, 0.3)", borderTop: "none", borderLeft: "none" }} />
        </div>
      )}
    </span>
  );
}

// 2. Modal de Confirmação Customizado
const ConfirmModalUI = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0f172a", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#f87171", fontWeight: "bold" }}>Atenção</h3>
        <p style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

// 3. Field Wrapper com InfoTip (Movido para fora da função principal para evitar perda de foco)
function FieldInfo({ label, info, children, styles }) {
  return (
    <div style={styles.inputGroup}>
      <label style={{ ...styles.fieldLabel, display: "flex", alignItems: "center" }}>
        {label}
        {info && <InfoTip text={info} />}
      </label>
      {children}
    </div>
  );
}

// 4. Input Field Padrão (Movido para fora da função principal para evitar perda de foco)
function Field({ label, info, value, setValue, step = "1", placeholder, styles }) {
  return (
    <FieldInfo label={label} info={info} styles={styles}>
      <input
        style={styles.inputSmall}
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
  styles,
  models,
  filteredModels,
  availableBrands,
  clientes,
  results,            setResults,
  quantidades,        setQuantidades,
  selectedVehicles,   setSelectedVehicles,
  selectedBrand,      setSelectedBrand,
  search,             setSearch,
  yearNum,            setYearNum,
  kmMensal,           setKmMensal,
  taxaJurosMensal,    setTaxaJurosMensal,
  percentualAplicado, setPercentualAplicado,
  revisaoMensal,      setRevisaoMensal,
  valorFinanciado,    setValorFinanciado,
  nperFinanciamento,  setNperFinanciamento,
  franquiaKm,         setFranquiaKm,
  custoPneus,         setCustoPneus,
  seguroAnual,        setSeguroAnual,
  impostosMensais,    setImpostosMensais,
  rastreamentoMensal, setRastreamentoMensal,
  projecaoRevenda,    setProjecaoRevenda,
  clienteSelecionado, setClienteSelecionado,
  clienteNome,        setClienteNome,
  loading,            setLoading,
  pdfLoadingMap,
  error,              setError,
  handleDownloadPDF,
  exportToCSV,
  clearResults,
  resetParams,
  resetVehicles,
  logAction,
  
  // PROPRIEDADES NOVAS DO APP.JSX
  descontoPct,        setDescontoPct,
  prazoContrato,      setPrazoContrato
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

  return (
    <div style={styles.calculatorWrapper}>
      
      {/* RENDERIZAÇÃO DO MODAL DE CONFIRMAÇÃO */}
      <ConfirmModalUI 
        isOpen={confirmDialog.isOpen} 
        message={confirmDialog.message} 
        onConfirm={handleConfirm} 
        onCancel={() => setConfirmDialog({ isOpen: false, message: "", action: null })} 
      />

      <div style={styles.configSection}>
        
        {/* 1. SELEÇÃO DE VEÍCULOS */}
        <section style={{
          ...styles.cardVehicles, 
          display: 'grid', 
          gridTemplateRows: 'max-content max-content max-content 1fr',
          alignSelf: 'stretch' // Garante que a altura total acompanha exatamente o cartão vizinho
        }}>
          
          <div style={styles.headerTitleAction}>
            <h2 style={styles.cardTitle}>1. Seleção de Veículos</h2>
            <button 
              onClick={() => confirmAction("Tem certeza que deseja limpar a seleção de veículos?", resetVehicles)} 
              style={styles.clearBtn}
            >
              Limpar ({selectedVehicles.length})
            </button>
          </div>
          
          <div style={{marginBottom: '15px'}}>
            <select 
              style={styles.inputSearch} 
              value={selectedBrand} 
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <input 
            style={styles.inputSearch} 
            placeholder="Filtrar por nome ou grupo..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          
          {/* O Grid reserva o espaço exato até ao fundo, e o absolute preenche-o na perfeição! */}
          <div style={{ position: 'relative', marginTop: '10px' }}>
            <div style={{
              ...styles.modelsBox, 
              position: 'absolute', 
              top: 0, bottom: 0, left: 0, right: 0, 
              overflowY: 'auto', 
              margin: 0,
              height: 'auto' // Limpa qualquer conflito de altura do estilo antigo
            }}>
              {loading && models.length === 0 && (
                <p style={{textAlign: 'center', fontSize: 12, padding: 20}}>Aguarde...</p>
              )}
              {filteredModels.map(m => (
                <label key={m.model_name_clean} style={styles.modelItem}>
                  <input 
                    type="checkbox" 
                    checked={selectedVehicles.includes(m.model_name_clean)} 
                    onChange={() => setSelectedVehicles(prev => prev.includes(m.model_name_clean) ? prev.filter(x => x !== m.model_name_clean) : [...prev, m.model_name_clean])} 
                  />
                  <div style={styles.modelText}>
                    <span style={styles.modelName}>
                      {m.brand_name?.toUpperCase() || 'N/A'} - {String(m.model_name || '').trim()} - { (m.year_model === 32000 || m.year === 32000) ? 2026 : (m.year_model || m.year || '')}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>
        
        {/* 2. AJUSTE DE PARÂMETROS */}
        <section style={styles.cardParams}>
          <div style={styles.headerTitleAction}>
            <h2 style={styles.cardTitle}>2. Ajuste de Parâmetros</h2>
            <button 
              onClick={() => confirmAction("Tem certeza que deseja restaurar os parâmetros ao padrão?", () => { resetParams(); if(setDescontoPct) setDescontoPct(0); if(setPrazoContrato) setPrazoContrato(24); })} 
              style={styles.clearBtn}
            >
              Resetar
            </button>
          </div>
          
          <div style={{marginBottom: '12px', padding: '12px 15px', borderRadius: '10px', background: valorFinanciado > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${valorFinanciado > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s'}}>
            <div style={{fontSize: '10px', color: valorFinanciado > 0 ? '#f97316' : '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px'}}>
              {valorFinanciado > 0 ? '🟠 BASE DO CÁLCULO: VALOR INSERIDO (PRIORITÁRIO)' : '⚪ BASE DO CÁLCULO: FIPE (preencha abaixo para sobrepor)'}
              {descontoPct > 0 && <span style={{color:"#ef4444"}}> • DESCONTO {descontoPct}%</span>}
            </div>
          </div>

          <div style={styles.formGrid}>
            
            {/* Valor Financiado Prioritário */}
            <Field 
              styles={styles}
              label="Valor Financiado (R$) — Prioritário" 
              info="Se preenchido com qualquer valor, o sistema irá utilizá-lo como base para realizar os cálculos das propostas (em 12, 24 e 36 meses). Os dados do veículo (FIPE, modelo, ano) permanecerão no PDF, mas respeitando este montante financeiro."
              value={valorFinanciado} 
              setValue={setValorFinanciado} 
              placeholder="Ex: 150000"
            />
            
            {/* Desconto */}
            <Field 
              styles={styles}
              label="Desconto (%)" 
              info="Aplica uma dedução percentual diretamente sobre o valor do veículo (seja FIPE ou inserido pelo utilizador). Afeta a base de cálculo da mensalidade."
              value={descontoPct} 
              setValue={setDescontoPct} 
              step="0.01" 
              placeholder="Ex: 5"
            />
            
            {/* Prazo de Contrato */}
            <FieldInfo styles={styles} label="Prazo de Contrato" info="Duração total do contrato de assinatura. O custo total da 'Manutenção' será fracionado por esta quantidade de meses.">
              <select style={styles.inputSmall} value={prazoContrato} onChange={(e) => setPrazoContrato(Number(e.target.value))}>
                <option value={12}>12 meses</option>
                <option value={24}>24 meses</option>
                <option value={36}>36 meses</option>
              </select>
            </FieldInfo>
            
            {/* Franquia KM */}
            <FieldInfo styles={styles} label="Franquia KM/mês" info="Limite mensal de quilometragem permitida para o contrato.">
              <select style={styles.inputSmall} value={franquiaKm} onChange={(e) => setFranquiaKm(Number(e.target.value))}>
                <option value={1000}>1.000 km</option>
                <option value={2000}>2.000 km</option>
                <option value={2500}>2.500 km</option>
                <option value={3000}>3.000 km</option>
              </select>
            </FieldInfo>

            <Field 
              styles={styles}
              label="Proj. Revenda (Opcional R$)" 
              info="Estimativa de valor de revenda do veículo ao fim do contrato. Afeta diretamente o cálculo do ROI. Deixe em branco para usar o padrão."
              value={projecaoRevenda} 
              setValue={setProjecaoRevenda} 
            />
            
            {/* Manutenção (Total) */}
            <Field 
              styles={styles}
              label="Manutenção (Custo Total)" 
              info="Valor TOTAL de gastos esperados com oficina/revisões para todo o ciclo do contrato. O motor financeiro vai dividir este número pelo número de meses escolhido no 'Prazo de Contrato'."
              value={revisaoMensal} 
              setValue={setRevisaoMensal} 
            />
            
            <Field 
              styles={styles}
              label="Custo Pneus (Jogo)" 
              info="Valor referente a um jogo de pneus. Utilizado na provisão calculada de acordo com a franquia de quilometragem selecionada."
              value={custoPneus} 
              setValue={setCustoPneus} 
            />
            
            {/* Seguro e Impostos */}
            <Field 
              styles={styles}
              label="Seguro (R$ anual)" 
              info="Custo anual da apólice de seguro do veículo. O cálculo fracionará este valor para deduzir o custo mensal."
              value={seguroAnual} 
              setValue={setSeguroAnual} 
            />
            
            <Field 
              styles={styles}
              label="Impostos (R$ anual)" 
              info="Total anual estimado para IPVA, licenciamento e taxas governamentais do veículo."
              value={impostosMensais} 
              setValue={setImpostosMensais} 
            />
            
            <Field 
              styles={styles}
              label="Margem Net (Legado)" 
              info="Fator percentual de margem retida historicamente, caso precise de aplicar uma taxa adicional no cálculo."
              value={percentualAplicado} 
              setValue={setPercentualAplicado} 
              step="0.0001" 
            />
          </div>
          
          <button 
            style={{...styles.buttonProcess, opacity: loading ? 0.7 : 1}} 
            onClick={handleCalculate} 
            disabled={loading}
          >
            {loading ? "CALCULANDO..." : "GERAR ESTUDO COMPARATIVO"}
          </button>
        </section>
        
      </div>

      {/* RESULTADOS */}
      {results?.compare && (
        <div style={styles.resultsWrapper}>
          
          <div style={styles.resultsHeader}>
            <div>
              <h2 style={styles.cardTitle}>Resultado do Comparativo</h2>
              <div style={{marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                {/* Dropdown customizado de clientes */}
                <div style={{position: 'relative', zIndex: 9999, flexShrink: 0}}>
                  <select
                    style={{
                      ...styles.inputSearch, 
                      width: '280px', 
                      minWidth: '280px',
                      height: '40px', 
                      fontSize: '13px', 
                      border: '1px solid #eab308', 
                      background: 'rgba(0,0,0,0.3)', 
                      
                      // AS 3 LINHAS ABAIXO CORRIGEM O CORTE DO TEXTO:
                      padding: '0 10px', 
                      lineHeight: 'normal',
                      color: '#f8fafc', // Garante que a cor do texto fique clara

                      boxSizing: 'border-box',
                      textOverflow: 'ellipsis'
                    }}
                    value={clienteSelecionado?.id || ""}
                    onChange={(e) => {
                      const c = clientes.find(cl => String(cl.id) === e.target.value);
                      setClienteSelecionado(c || null);
                      if (c) setClienteNome(c.nome_razao || c.nome || "");
                    }}
                  >
                    <option value="">👤 Selecionar cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_razao || c.nome}{c.empresa ? ` (${c.empresa})` : ""}</option>
                    ))}
                  </select>
                </div>
                {clienteSelecionado && (
                  <button onClick={() => { setClienteSelecionado(null); setClienteNome(""); }}
                    style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '0 10px', height: 38, cursor: 'pointer', fontSize: 13}}>
                    ✕
                  </button>
                )}
                {!clienteSelecionado && (
                  <input
                    style={{...styles.inputSearch, width: '180px', height: '40px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.45)', color: '#f1f5f9', borderRadius: 10}}
                    placeholder="Ou digitar nome..."
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
              <button 
                onClick={() => confirmAction("Tem certeza que deseja apagar os resultados atuais da tela?", clearResults)} 
                style={styles.clearResultsBtn}
              >
                🗑️ LIMPAR
              </button>
              <button onClick={exportToCSV} style={{...styles.exportBtn, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}}>📥 EXCEL</button>
            </div>
          </div>
          
          <div style={styles.compareGridWrap}>
            {results.compare.map((item, idx) => {
              const vKey = item.vehicle.model_name_clean; 
              const q = quantidades[vKey] || 1; 
              const isPdfLoading = pdfLoadingMap[vKey] || false;
              
              return (
                <div key={idx} style={styles.compareCardItem}>
                  
                  <div style={styles.compareHeader}>
                    <span style={styles.brandTag}>
                      {item.vehicle?.brand_name?.toUpperCase() || "VEÍCULO"}
                    </span>
                    <div style={styles.vehicleTitle}>
                      {String(item.vehicle?.model_name).trim()}
                    </div>
                    <div style={styles.qtyContainer}>
                      <label style={styles.qtyLabel}>QUANTIDADE DE VEÍCULOS:</label>
                      <div style={styles.qtySelector}>
                        <button style={styles.qtyBtn} onClick={() => setQuantidades({...quantidades, [vKey]: Math.max(1, q - 1)})}>-</button>
                        <div style={styles.qtyValBox}>{q}</div>
                        <button style={styles.qtyBtn} onClick={() => setQuantidades({...quantidades, [vKey]: q + 1})}>+</button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.compareBody}>
                    {item.pricing?.map(p => (
                      <div key={p.prazo_meses} style={{...styles.compareRow, borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div style={styles.prazoBadge}>{p.prazo_meses} MESES</div>
                          <div style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            color: '#fff',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            backgroundColor: p.status === 'APROVAR' ? '#10b981' : p.status === 'AJUSTAR' ? '#f59e0b' : '#ef4444'
                          }}>
                            {p.status}
                          </div>
                        </div>
                        
                        <div style={styles.mainValue}>R$ {formatBRL(p.mensalidade_final || p.mensalidade)}</div>
                        {q > 1 && <div style={styles.fleetTotal}>Frota: R$ {formatBRL((p.mensalidade_final || p.mensalidade) * q)}</div>}

                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '10px', color: '#94a3b8'}}>
                           <span>Técnica: R$ {formatBRL(p.mensalidade_tecnica)}</span>
                           <span>Piso: R$ {formatBRL(p.mensalidade_piso)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '10px', color: '#94a3b8'}}>
                           <span>Deprec: R$ {formatBRL(p.detalhes?.depreciacao_mensal || 0)}</span>
                           <span>Revenda: R$ {formatBRL(p.detalhes?.valor_revenda_projetado || 0)}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '10px', color: '#94a3b8'}}>
                           <span>ROI: {p.roi_percentual}%</span>
                           <span>Payback: {p.payback_meses}m</span>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleDownloadPDF(vKey)} 
                      disabled={isPdfLoading} 
                      style={{...styles.pdfCardBtn, background: isPdfLoading ? 'rgba(255,255,255,0.1)' : '#fde68a', color: isPdfLoading ? '#fff' : '#000'}}
                    >
                      {isPdfLoading ? "⌛ GERANDO..." : "📄 BAIXAR PROPOSTA PDF"}
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