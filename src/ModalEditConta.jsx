import React, { useState, useEffect } from "react";

export default function ModalEditConta({ contaToEdit, setContaToEdit, styles, onClose, onSave }) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the event to onSave so handleUpdateContaPagar receives it
    onSave(e);
  };

  if (!contaToEdit) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto'}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:4,height:28,borderRadius:2,background:"linear-gradient(to bottom,#f59e0b,#eab308)"}}/>
          <h2 style={styles.cardTitle}>Editar Conta a Pagar</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={styles.fieldLabel}>Descrição</label>
              <input 
                style={styles.inputSmall} 
                value={contaToEdit.descricao || ""} 
                onChange={e => setContaToEdit({...contaToEdit, descricao: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Valor (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                style={styles.inputSmall} 
                value={contaToEdit.valor || ""} 
                onChange={e => setContaToEdit({...contaToEdit, valor: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Vencimento</label>
              <input 
                type="date" 
                style={styles.inputSmall} 
                value={contaToEdit.vencimento || ""} 
                onChange={e => setContaToEdit({...contaToEdit, vencimento: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Status</label>
              <select 
                style={{...styles.inputSmall, background:"rgba(15,23,42,0.9)", color:"#f1f5f9"}} 
                value={contaToEdit.status || "ABERTO"} 
                onChange={e => setContaToEdit({...contaToEdit, status: e.target.value})}
              >
                <option value="ABERTO">Aberto</option>
                <option value="PAGO">Pago</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CONCILIADO">Conciliado</option>
              </select>
            </div>
            <div>
              <label style={styles.fieldLabel}>Fornecedor</label>
              <input 
                style={styles.inputSmall} 
                value={contaToEdit.fornecedor || ""} 
                disabled 
              />
            </div>
          </div>
          
          <div style={{display:"flex",gap:12,marginTop:20}}>
            <button 
              type="submit" 
              style={{
                ...styles.exportBtn, 
                flex:1, 
                background:"linear-gradient(135deg,#f59e0b,#eab308)", 
                color:"#000", 
                border:"none",
                fontWeight:800,
                fontSize:13,
                padding:"12px 20px",
                borderRadius:12,
                cursor:"pointer"
              }}
            >
              💾 SALVAR ALTERAÇÕES
            </button>
            <button 
              type="button" 
              style={{...styles.clearResultsBtn, flex:1}} 
              onClick={onClose}
            >
              CANCELAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}