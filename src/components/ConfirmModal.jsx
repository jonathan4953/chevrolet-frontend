import React from 'react';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#fff1f0',
        padding: '24px 36px',
        borderRadius: '16px',
        width: 360,
        boxShadow: '0 12px 25px rgba(166, 32, 21, 0.5)',
        color: '#7a1f1f',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 15,
        lineHeight: 1.4,
        textAlign: 'center',
        userSelect: 'none',
      }}>
        <p style={{ whiteSpace: 'pre-line', marginBottom: 28 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button onClick={onCancel} style={{
            backgroundColor: '#f7d6d5',
            border: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            color: '#7a1f1f',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4bcb9'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f7d6d5'}
          >
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            backgroundColor: '#8f2a24',
            border: 'none',
            borderRadius: 12,
            padding: '10px 24px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            boxShadow: '0 0 14px #8f2a24a8',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7a251f'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8f2a24'}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;