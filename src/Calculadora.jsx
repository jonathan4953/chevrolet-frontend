// Calculadora.jsx — extraída do App.jsx
import { api } from "./api";

const formatBRL = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Calculadora({
  styles,
  models,
  filteredModels,
  availableBrands,
  clientes,
  results,         setResults,
  quantidades,     setQuantidades,
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
  ClienteDropdown,
}) {

  function Field({ label, value, setValue, step = "1" }) {
    return (
      <div style={styles.inputGroup}>
        <label style={styles.fieldLabel}>{label}</label>
        <input
          style={styles.inputSmall}
          type={step === "any" || step === "0.0001" ? "number" : "text"}
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
    );
  }

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
          prazos: [12, 24, 36], // Conforme Arquitetura Espacial
          valor_financiado: Number(valorFinanciado),
          nper_financiamento: Number(nperFinanciamento),
          franquia_km: Number(franquiaKm),
          projecao_revenda: projecaoRevenda ? Number(projecaoRevenda) : null
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
                    <div style={styles.configSection}>
                
                <section style={styles.cardVehicles}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>1. Seleção de Veículos</h2>
                    <button onClick={resetVehicles} style={styles.clearBtn}>
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
                  
                  <div style={styles.modelsBox}>
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
                </section>
                
                <section style={styles.cardParams}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>2. Ajuste de Parâmetros</h2>
                    <button onClick={resetParams} style={styles.clearBtn}>Resetar</button>
                  </div>
                  
                  <div style={{marginBottom: '12px', padding: '12px 15px', borderRadius: '10px', background: valorFinanciado > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${valorFinanciado > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s'}}>
                    <div style={{fontSize: '10px', color: valorFinanciado > 0 ? '#f97316' : '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      {valorFinanciado > 0 ? '🟠 BASE DO CÁLCULO: VALOR FINANCIADO (PRIORITÁRIO)' : '⚪ BASE DO CÁLCULO: FIPE (preencha abaixo para usar valor financiado)'}
                    </div>
                  </div>
                  <div style={styles.formGrid}>
                    <Field label="Valor Financiado (R$) — Prioritário" value={valorFinanciado} setValue={setValorFinanciado} />
                    <Field label="Prazo Financ. (Meses)" value={nperFinanciamento} setValue={setNperFinanciamento} />
                    
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Franquia KM/mês</label>
                      <select style={styles.inputSmall} value={franquiaKm} onChange={(e) => setFranquiaKm(Number(e.target.value))}>
                        <option value={1000}>1.000 km</option>
                        <option value={2000}>2.000 km</option>
                        <option value={2500}>2.500 km</option>
                        <option value={3000}>3.000 km</option>
                      </select>
                    </div>

                    <Field label="Proj. Revenda (Opcional R$)" value={projecaoRevenda} setValue={setProjecaoRevenda} />
                    <Field label="Ano Modelo" value={yearNum} setValue={setYearNum} />
                    <Field label="Taxa Juros Mensal" value={taxaJurosMensal} setValue={setTaxaJurosMensal} step="0.0001" />
                    <Field label="Manutenção/mês" value={revisaoMensal} setValue={setRevisaoMensal} />
                    <Field label="Custo Pneus (Jogo)" value={custoPneus} setValue={setCustoPneus} />
                    <Field label="Seguro Anual" value={seguroAnual} setValue={setSeguroAnual} />
                    <Field label="Margem Net (Legado)" value={percentualAplicado} setValue={setPercentualAplicado} step="0.0001" />
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

                    {results?.compare && (
                <div style={styles.resultsWrapper}>
                  
                  <div style={styles.resultsHeader}>
                    <div>
                      <h2 style={styles.cardTitle}>Resultado do Comparativo</h2>
                      <div style={{marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                        {/* Dropdown customizado de clientes */}
                        <ClienteDropdown
                          clientes={clientes}
                          clienteSelecionado={clienteSelecionado}
                          onSelect={(c) => { setClienteSelecionado(c || null); setClienteNome(c ? c.nome : ''); }}
                          onClear={() => { setClienteSelecionado(null); setClienteNome(''); }}
                        />
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
                      <button onClick={clearResults} style={styles.clearResultsBtn}>🗑️ LIMPAR</button>
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
