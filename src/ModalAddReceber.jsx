import React, { useState, useEffect } from 'react';

export default function ModalAddReceber({ styles, onClose, clientes, categorias, centrosCusto, loading, onSave }) {
  const [novoDireito, setNovoDireito] = useState({
    id_cliente: "",
    descricao: "",
    valor_total: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: "",
    forma_pagamento: "BOLETO",
    id_plano_conta: "", 
    id_centro_custo: "", 
    numero_parcelas: 1
  });

  const [parcelas, setParcelas] = useState([]);

  // EFEITO: Gera as parcelas automaticamente quando o valor, quantidade ou data inicial mudam
  useEffect(() => {
    const num = parseInt(novoDireito.numero_parcelas) || 0;
    const total = parseFloat(novoDireito.valor_total) || 0;
    const firstDate = novoDireito.data_vencimento;

    if (total > 0 && num > 0 && firstDate) {
      let valParcela = (total / num).toFixed(2);
      let diff = (total - (valParcela * num)).toFixed(2); // Corrige dízimas na última parcela

      let newParcelas = [];
      let [ano, mes, dia] = firstDate.split('-');

      for (let i = 1; i <= num; i++) {
        // Adiciona 1 mês para cada parcela subsequente
        let date = new Date(ano, parseInt(mes) - 1 + (i - 1), dia);
        let formattedDate = date.toISOString().split('T')[0];
        
        let val = parseFloat(valParcela);
        if (i === num) val += parseFloat(diff);

        newParcelas.push({
          numero_parcela: i,
          valor: val.toFixed(2),
          data_vencimento: formattedDate
        });
      }
      setParcelas(newParcelas);
    } else {
      setParcelas([]);
    }
  }, [novoDireito.valor_total, novoDireito.numero_parcelas, novoDireito.data_vencimento]);

  // Função para permitir ao utilizador editar uma parcela manualmente
  const handleParcelaChange = (index, field, value) => {
    const newParcelas = [...parcelas];
    newParcelas[index][field] = value;
    setParcelas(newParcelas);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Envia os dados principais + as parcelas editadas para o backend
    onSave({ ...novoDireito, parcelas });
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, maxWidth: '850px', background: 'rgba(15, 23, 42, 0.98)', border: '1px solid #10b981' }}>
        
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: '#10b981', margin: '0 0 5px 0', fontSize: '22px' }}>💰 Registro de Receita (Novo Direito)</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Provisionamento com classificação de Plano de Contas e Centro de Custo.</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.inventoryGrid}>
            
         {/* CLIENTE (ATUALIZADO PARA LER QUALQUER CAMPO) */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.fieldLabel}>Cliente / Sacado</label>
              <select required style={{...styles.inputSmall, borderColor: '#10b981'}} value={novoDireito.id_cliente} onChange={(e) => setNovoDireito({ ...novoDireito, id_cliente: e.target.value })}>
                <option value="">-- Selecione o Cliente --</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {/* Tenta várias opções de nomes comuns para garantir que acha o nome do cliente e o documento */}
                    {c.nome || c.nome_razao || c.razao_social || "Nome não encontrado"} 
                    {" - "} 
                    ({c.documento || c.cpf_cnpj || c.cpf || c.cnpj || "Sem doc"})
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIÇÃO */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.fieldLabel}>Descrição do Recebimento</label>
              <input required style={styles.inputSmall} placeholder="Ex: Fatura Jan/26, Venda Veículo XYZ..." value={novoDireito.descricao} onChange={(e) => setNovoDireito({ ...novoDireito, descricao: e.target.value })}/>
            </div>

            {/* CLASSIFICAÇÃO ERP (Plano de Contas e Centro de Custo) */}
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Plano de Contas (Categoria)</label>
              <select style={styles.inputSmall} value={novoDireito.id_plano_conta} onChange={(e) => setNovoDireito({ ...novoDireito, id_plano_conta: e.target.value })}>
                <option value="">-- Selecione (Opcional) --</option>
                {categorias?.filter(c => c.tipo === 'RECEITA').map((cat) => (<option key={cat.id} value={cat.id}>{cat.nome}</option>))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Centro de Custo</label>
              <select style={styles.inputSmall} value={novoDireito.id_centro_custo} onChange={(e) => setNovoDireito({ ...novoDireito, id_centro_custo: e.target.value })}>
                <option value="">-- Selecione (Opcional) --</option>
                {centrosCusto?.map((cc) => (<option key={cc.id} value={cc.id}>{cc.nome}</option>))}
              </select>
            </div>

            {/* VALORES E DATAS */}
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Valor Total (R$)</label>
              <input required type="number" step="0.01" style={{...styles.inputSmall, color: '#10b981', fontWeight: 'bold'}} value={novoDireito.valor_total} onChange={(e) => setNovoDireito({ ...novoDireito, valor_total: e.target.value })}/>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Nº de Parcelas</label>
              <input required type="number" min="1" style={styles.inputSmall} value={novoDireito.numero_parcelas} onChange={(e) => setNovoDireito({ ...novoDireito, numero_parcelas: e.target.value })}/>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Data de Emissão</label>
              <input required type="date" style={styles.inputSmall} value={novoDireito.data_emissao} onChange={(e) => setNovoDireito({ ...novoDireito, data_emissao: e.target.value })}/>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>1º Vencimento</label>
              <input required type="date" style={styles.inputSmall} value={novoDireito.data_vencimento} onChange={(e) => setNovoDireito({ ...novoDireito, data_vencimento: e.target.value })}/>
            </div>
          </div>

          {/* GRID DE PARCELAS GERADAS (Permite Edição) */}
          {parcelas.length > 0 && (
            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#e2e8f0', fontSize: '13px' }}>📋 Tabela de Parcelas (Você pode editar as datas e valores)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {parcelas.map((p, index) => (
                  <div key={index} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Parcela {p.numero_parcela}</span>
                    <input type="date" style={{...styles.inputSmall, padding: '5px', fontSize: '12px'}} value={p.data_vencimento} onChange={(e) => handleParcelaChange(index, 'data_vencimento', e.target.value)} />
                    <input type="number" step="0.01" style={{...styles.inputSmall, padding: '5px', fontSize: '12px'}} value={p.valor} onChange={(e) => handleParcelaChange(index, 'valor', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTÕES */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button type="submit" disabled={loading} style={{ ...styles.exportBtn, flex: 1, background: '#10b981', color: '#fff' }}>
              {loading ? "⌛ SALVANDO..." : "✓ CONFIRMAR DIREITO A RECEBER"}
            </button>
            <button type="button" onClick={onClose} style={{ ...styles.clearResultsBtn, flex: 1 }}>CANCELAR</button>
          </div>
        </form>
      </div>
    </div>
  );
}