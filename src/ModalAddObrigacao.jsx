import React, { useState } from "react";

export default function ModalAddObrigacao({ 
  onClose, 
  onSave, 
  styles,
  fornecedores = [], 
  setShowAddFornecedorModal,
  loading
}) {
  const [novaObrigacao, setNovaObrigacao] = useState({
    id_fornecedor: "", 
    descricao: "",
    categoria: "Despesas Operacionais",
    centro_custo: "",
    competencia: "",
    valor_total: "",
    data_vencimento: "",
    forma_pagamento: "PIX",
    conta_bancaria: "Conta Principal",
    observacoes: "",
    tipo_pagamento: "avista", 
    qtd_parcelas: 2,
    intervalo_parcelas: "mensal",
    recorrencia_tipo: "meses", 
    recorrencia_qtd: 12,
    parcelas_geradas: [], 
    is_rateado: false,
    tipo_rateio: "Centro de Custo",
    rateios: [], 
    anexos: []
  });

  const handleRemoverAnexo = (indexToRemove) => {
    setNovaObrigacao(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, index) => index !== indexToRemove)
    }));
  };

  const calcularParcelasOuRecorrencia = () => {
    if (!novaObrigacao.valor_total || !novaObrigacao.data_vencimento) {
      return alert("Preencha o Valor Total e a Data Base de Vencimento primeiro.");
    }

    const parcelas = [];
    const baseDate = new Date(novaObrigacao.data_vencimento + 'T12:00:00');
    const total = Number(novaObrigacao.valor_total);

    if (novaObrigacao.tipo_pagamento === 'parcelado') {
      const qtd = Number(novaObrigacao.qtd_parcelas);
      const valParcela = Math.floor((total / qtd) * 100) / 100;
      const resto = total - (valParcela * qtd);
      
      for(let i = 1; i <= qtd; i++) {
        let d = new Date(baseDate);
        if (novaObrigacao.intervalo_parcelas === 'mensal') d.setMonth(d.getMonth() + (i - 1));
        else if (novaObrigacao.intervalo_parcelas === 'semanal') d.setDate(d.getDate() + (i - 1) * 7);

        let valorAtual = valParcela;
        if (i === 1) valorAtual += resto; 

        parcelas.push({ numero_parcela: i, valor: valorAtual.toFixed(2), data_vencimento: d.toISOString().split('T')[0] });
      }
    } else if (novaObrigacao.tipo_pagamento === 'recorrente') {
      const qtd = Number(novaObrigacao.recorrencia_qtd);
      for(let i = 1; i <= qtd; i++) {
        let d = new Date(baseDate);
        if (novaObrigacao.recorrencia_tipo === 'meses') d.setMonth(d.getMonth() + (i - 1));
        else if (novaObrigacao.recorrencia_tipo === 'anos') d.setFullYear(d.getFullYear() + (i - 1));
        else if (novaObrigacao.recorrencia_tipo === 'semanas') d.setDate(d.getDate() + (i - 1) * 7);
        else if (novaObrigacao.recorrencia_tipo === 'dias') d.setDate(d.getDate() + (i - 1));

        parcelas.push({ numero_parcela: i, valor: total.toFixed(2), data_vencimento: d.toISOString().split('T')[0] });
      }
    }
    setNovaObrigacao(prev => ({ ...prev, parcelas_geradas: parcelas }));
  };

  const handleUpdateParcelaGerada = (index, field, value) => {
    const novas = [...novaObrigacao.parcelas_geradas];
    novas[index][field] = value;
    setNovaObrigacao({ ...novaObrigacao, parcelas_geradas: novas });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(novaObrigacao);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
        
        <button 
          onClick={onClose} 
          style={{position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold'}}
        >
          X
        </button>
        
        <h2 style={styles.cardTitle}>Cadastro de Obrigação no Contas a Pagar</h2>
        <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 25}}>
          Registrar uma obrigação financeira, garantindo controle de fluxo de caixa, competência contábil e rastreabilidade.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* ETAPA 1: FORNECEDOR COM BOTÃO + NOVO */}
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>1. Identificação do Fornecedor</h3>
            <div style={styles.formGrid}>
              <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                <label style={styles.fieldLabel}>Selecione o Fornecedor Cadastrado *</label>
                <div style={{display: 'flex', gap: '10px'}}>
                    <select 
                      style={{...styles.inputSmall, flex: 1}} 
                      value={novaObrigacao.id_fornecedor} 
                      onChange={e => setNovaObrigacao({...novaObrigacao, id_fornecedor: e.target.value})} 
                      required
                    >
                      <option value="">-- Selecione o Fornecedor --</option>
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>{f.nome_razao} ({f.documento})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddFornecedorModal(true)}
                      style={{...styles.exportBtn, background: '#3b82f6', padding: '0 15px'}}
                      title="Cadastrar Novo Fornecedor Rapidamente"
                    >
                      + NOVO FORNECEDOR
                    </button>
                </div>
              </div>
            </div>
          </div>

          {/* ETAPA 2: DADOS GERAIS */}
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>2. Dados Gerais da Obrigação</h3>
            <div style={styles.formGrid}>
              <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                <label style={styles.fieldLabel}>Descrição da Despesa *</label>
                <input style={styles.inputSmall} placeholder="Ex: Compra de Peças Lote X" value={novaObrigacao.descricao} onChange={e => setNovaObrigacao({...novaObrigacao, descricao: e.target.value})} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Categoria Financeira *</label>
                <select style={styles.inputSmall} value={novaObrigacao.categoria} onChange={e => setNovaObrigacao({...novaObrigacao, categoria: e.target.value})} required>
                  <option value="Despesas Operacionais">Despesas Operacionais</option>
                  <option value="Impostos e Taxas">Impostos e Taxas</option>
                  <option value="Folha de Pagamento">Folha de Pagamento</option>
                  <option value="Fornecedores">Fornecedores (Veículos/Peças)</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Competência (Mês/Ano) *</label>
                <input type="month" style={styles.inputSmall} value={novaObrigacao.competencia} onChange={e => setNovaObrigacao({...novaObrigacao, competencia: e.target.value})} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Centro de Custo (Opcional)</label>
                <select style={styles.inputSmall} value={novaObrigacao.centro_custo} onChange={e => setNovaObrigacao({...novaObrigacao, centro_custo: e.target.value})}>
                  <option value="">Nenhum</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Locação">Locação</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Oficina">Oficina</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Observações</label>
                <input style={styles.inputSmall} placeholder="Notas adicionais..." value={novaObrigacao.observacoes} onChange={e => setNovaObrigacao({...novaObrigacao, observacoes: e.target.value})} />
              </div>
            </div>
          </div>

          {/* ETAPA 3: DADOS FINANCEIROS & PARCELAMENTO/RECORRÊNCIA (ATUALIZADA) */}
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>3. Dados Financeiros & Condições</h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Valor Total (R$) *</label>
                <input type="number" step="0.01" min="0.01" style={{...styles.inputSmall, color: '#4ade80', fontWeight: 'bold'}} value={novaObrigacao.valor_total} onChange={e => setNovaObrigacao({...novaObrigacao, valor_total: e.target.value})} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Data Base Vencimento *</label>
                <input type="date" style={styles.inputSmall} value={novaObrigacao.data_vencimento} onChange={e => setNovaObrigacao({...novaObrigacao, data_vencimento: e.target.value})} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Forma de Pagamento</label>
                <select style={styles.inputSmall} value={novaObrigacao.forma_pagamento} onChange={e => setNovaObrigacao({...novaObrigacao, forma_pagamento: e.target.value})}>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência / TED</option>
                  <option value="Cartão">Cartão de Crédito</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Conta Bancária Saída</label>
                <select style={styles.inputSmall} value={novaObrigacao.conta_bancaria} onChange={e => setNovaObrigacao({...novaObrigacao, conta_bancaria: e.target.value})}>
                  <option value="Conta Principal">Conta Corrente Principal</option>
                  <option value="Conta Reserva">Conta Reserva</option>
                </select>
              </div>
            </div>

            {/* OPÇÕES DE PAGAMENTO (ÚNICO, PARCELADO, RECORRENTE) */}
            <div style={{marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
              <label style={styles.fieldLabel}>ESTRUTURA DE PAGAMENTO</label>
              <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                  <input type="radio" name="tipoPagamento" value="avista" checked={novaObrigacao.tipo_pagamento === 'avista'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                  Pagamento Único (À Vista)
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                  <input type="radio" name="tipoPagamento" value="parcelado" checked={novaObrigacao.tipo_pagamento === 'parcelado'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                  Parcelado (Divide o Valor)
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                  <input type="radio" name="tipoPagamento" value="recorrente" checked={novaObrigacao.tipo_pagamento === 'recorrente'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                  Recorrente (Repete o Valor)
                </label>
              </div>
              
              {/* PARCELADO CONFIG */}
              {novaObrigacao.tipo_pagamento === 'parcelado' && (
                <div style={{display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end'}}>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Qtd Parcelas</label>
                    <input type="number" min="2" style={styles.inputSmall} value={novaObrigacao.qtd_parcelas} onChange={e => setNovaObrigacao({...novaObrigacao, qtd_parcelas: e.target.value})} />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Intervalo</label>
                    <select style={styles.inputSmall} value={novaObrigacao.intervalo_parcelas} onChange={e => setNovaObrigacao({...novaObrigacao, intervalo_parcelas: e.target.value})}>
                      <option value="mensal">Mensal</option>
                      <option value="semanal">Semanal</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                  <button type="button" onClick={calcularParcelasOuRecorrencia} style={{...styles.exportBtn, background: '#3b82f6', marginBottom: '18px'}}>Gerar Previsão</button>
                </div>
              )}

              {/* RECORRENTE CONFIG */}
              {novaObrigacao.tipo_pagamento === 'recorrente' && (
                <div style={{display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end'}}>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Tempo de Recorrência</label>
                    <select style={styles.inputSmall} value={novaObrigacao.recorrencia_tipo} onChange={e => setNovaObrigacao({...novaObrigacao, recorrencia_tipo: e.target.value})}>
                      <option value="meses">Meses</option>
                      <option value="semanas">Semanas</option>
                      <option value="anos">Anos</option>
                      <option value="dias">Dias</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Quantas vezes se repetirá?</label>
                    <input type="number" min="2" style={styles.inputSmall} value={novaObrigacao.recorrencia_qtd} onChange={e => setNovaObrigacao({...novaObrigacao, recorrencia_qtd: e.target.value})} />
                  </div>
                  <button type="button" onClick={calcularParcelasOuRecorrencia} style={{...styles.exportBtn, background: '#3b82f6', marginBottom: '18px'}}>Gerar Previsão</button>
                </div>
              )}

              {/* TABELA DE EDIÇÃO DAS PARCELAS GERADAS */}
              {novaObrigacao.parcelas_geradas.length > 0 && (
                <div style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                  <h4 style={{fontSize: '12px', color: '#eab308', marginBottom: '10px'}}>Confira e Edite os Lançamentos antes de Salvar:</h4>
                  <table style={styles.tableMassa}>
                    <thead>
                      <tr>
                        <th style={{...styles.thMassa, padding: '10px'}}>Nº</th>
                        <th style={{...styles.thMassa, padding: '10px'}}>Vencimento (Editável)</th>
                        <th style={{...styles.thMassa, padding: '10px'}}>Valor (Editável)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {novaObrigacao.parcelas_geradas.map((p, idx) => (
                        <tr key={idx}>
                          <td style={{...styles.tdMassa, padding: '8px'}}>{p.numero_parcela}</td>
                          <td style={{...styles.tdMassa, padding: '8px'}}>
                            <input 
                              type="date" 
                              style={{...styles.inputSmall, padding: '8px'}} 
                              value={p.data_vencimento} 
                              onChange={(e) => handleUpdateParcelaGerada(idx, 'data_vencimento', e.target.value)} 
                            />
                          </td>
                          <td style={{...styles.tdMassa, padding: '8px'}}>
                            <input 
                              type="number" 
                              step="0.01" 
                              style={{...styles.inputSmall, padding: '8px', color: '#4ade80'}} 
                              value={p.valor} 
                              onChange={(e) => handleUpdateParcelaGerada(idx, 'valor', e.target.value)} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>

          {/* ETAPA 4: RATEIO CONDICIONAL */}
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>4. Rateio Gerencial</h3>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '15px'}}>
              <input type="checkbox" style={{marginRight: '10px', transform: 'scale(1.2)'}} checked={novaObrigacao.is_rateado} onChange={e => setNovaObrigacao({...novaObrigacao, is_rateado: e.target.checked})} />
              Habilitar Rateio Múltiplo
            </label>

            {novaObrigacao.is_rateado && (
              <div style={{padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                <div style={{...styles.inputGroup, width: '50%'}}>
                  <label style={styles.fieldLabel}>Divisão Baseada Em:</label>
                  <select style={styles.inputSmall} value={novaObrigacao.tipo_rateio} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_rateio: e.target.value, rateios: []})}>
                    <option value="Centro de Custo">Centro de Custo</option>
                    <option value="Categoria">Categoria Financeira</option>
                  </select>
                </div>

                {novaObrigacao.rateios.map((rt, idx) => (
                    <div key={idx} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '10px'}}>
                      <div style={{...styles.inputGroup, flex: 2, marginBottom: 0}}>
                        <label style={styles.fieldLabel}>Referência</label>
                        <input style={styles.inputSmall} placeholder={`Nome do ${novaObrigacao.tipo_rateio}`} value={rt.referencia} onChange={(e) => {
                          const novos = [...novaObrigacao.rateios];
                          novos[idx] = { ...novos[idx], referencia: e.target.value };
                          setNovaObrigacao({...novaObrigacao, rateios: novos});
                        }} />
                      </div>
                      <div style={{...styles.inputGroup, flex: 1, marginBottom: 0}}>
                        <label style={styles.fieldLabel}>Percentual (%)</label>
                        <input type="number" step="0.01" style={styles.inputSmall} value={rt.percentual} onChange={(e) => {
                          const novos = [...novaObrigacao.rateios];
                          novos[idx] = { ...novos[idx], percentual: e.target.value };
                          setNovaObrigacao({...novaObrigacao, rateios: novos});
                        }} />
                      </div>
                      <button type="button" onClick={() => {
                          const novos = novaObrigacao.rateios.filter((_, i) => i !== idx);
                          setNovaObrigacao({...novaObrigacao, rateios: novos});
                      }} style={{...styles.clearResultsBtn, padding: '12px', height: '42px'}}>🗑️</button>
                    </div>
                ))}
                <button type="button" onClick={() => setNovaObrigacao({...novaObrigacao, rateios: [...novaObrigacao.rateios, {referencia: '', percentual: 0}]})} style={{...styles.clearBtn, color: '#4ade80', border: '1px solid #4ade80', marginTop: '10px'}}>+ Adicionar Linha de Rateio</button>
              </div>
            )}
          </div>

          {/* ETAPA 5: ANEXOS */}
          <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
            <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>5. Anexos Documentais</h3>
            <input type="file" id="anexoUpload" accept=".pdf, .jpg, .png" multiple style={{display: 'none'}} onChange={(e) => {
              if(e.target.files.length) {
                setNovaObrigacao({...novaObrigacao, anexos: [...novaObrigacao.anexos, ...Array.from(e.target.files)]});
              }
            }} />
            <label htmlFor="anexoUpload" style={{...styles.exportBtn, background: 'rgba(15, 23, 42, 0.8)', border: '1px dashed #94a3b8', display: 'block', textAlign: 'center', width: '100%', padding: '20px', cursor: 'pointer', color: '#cbd5e1'}}>
              📎 Clique para adicionar Nota Fiscal, Boleto, Contrato (PDF, JPG, PNG)
            </label>
            {novaObrigacao.anexos.length > 0 && (
              <ul style={{marginTop: '15px', fontSize: '12px', color: '#94a3b8', listStyle: 'none', padding: 0}}>
                {novaObrigacao.anexos.map((f, i) => (
                  <li key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', marginBottom: '5px'}}>
                    <span>📎 {f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverAnexo(i)}
                      style={{background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold'}}
                      title="Remover anexo"
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* VALIDAÇÃO FINAL E SALVAMENTO */}
          <div style={{display: 'flex', gap: 15, marginTop: 30}}>
            <button type="submit" style={{...styles.exportBtn, flex: 2, fontSize: '14px', background: '#3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)'}} disabled={loading}>
              {loading ? "PROCESSANDO E SALVANDO..." : "✔️ CADASTRAR OBRIGAÇÃO FINANCEIRA"}
            </button>
            <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={onClose}>
              CANCELAR
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}