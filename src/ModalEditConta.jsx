import React from "react";

export default function ModalEditConta({ 
  contaToEdit, 
  setContaToEdit, 
  onClose, 
  onSave, 
  styles 
}) {
  if (!contaToEdit) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: '600px'}}>
        <h2 style={styles.cardTitle}>Editar Provisão ID: {contaToEdit.id}</h2>
        <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
          <div style={styles.inputGroup}>
            <label style={styles.fieldLabel}>Descrição</label>
            <input 
              style={styles.inputSmall} 
              value={contaToEdit.descricao} 
              onChange={e => setContaToEdit({...contaToEdit, descricao: e.target.value})} 
              required 
            />
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Data de Vencimento</label>
              <input 
                type="date" 
                style={styles.inputSmall} 
                value={contaToEdit.vencimento} 
                onChange={e => setContaToEdit({...contaToEdit, vencimento: e.target.value})} 
                required 
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.fieldLabel}>Valor (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                style={styles.inputSmall} 
                value={contaToEdit.valor} 
                onChange={e => setContaToEdit({...contaToEdit, valor: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.fieldLabel}>Status</label>
            <select 
              style={styles.inputSmall} 
              value={contaToEdit.status} 
              onChange={e => setContaToEdit({...contaToEdit, status: e.target.value})}
            >
              <option value="ABERTO">Em Aberto</option>
              <option value="PAGO">Pago</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="CONCILIADO">Conciliado (OFX)</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: 15, marginTop: 30}}>
            <button type="submit" style={{...styles.exportBtn, flex: 2}}>
              SALVAR ALTERAÇÕES
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