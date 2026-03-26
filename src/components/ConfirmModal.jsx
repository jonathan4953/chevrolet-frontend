import React from 'react';
import './ConfirmModal.css'; // Como você disse que criou esse arquivo, mantive o import!

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  // Estilos inline garantindo que ele fique bonito e por cima de tudo no ERP
  const s = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(42, 43, 45, 0.7)",
      backdropFilter: "blur(4px)",
      zIndex: 99999, // Bem alto para ficar acima de menus e sidebars
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    content: {
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "16px",
      padding: "24px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      textAlign: "center",
      animation: "popUp 0.2s ease-out"
    },
    icon: {
      fontSize: "32px",
      marginBottom: "16px",
      display: "block"
    },
    title: {
      margin: "0 0 12px 0",
      fontSize: "18px",
      fontWeight: 800,
      color: "#2A2B2D"
    },
    message: {
      margin: "0 0 24px 0",
      fontSize: "14px",
      color: "#636466",
      lineHeight: "1.5"
    },
    buttons: {
      display: "flex",
      gap: "12px",
      justifyContent: "center"
    },
    btnCancel: {
      padding: "10px 20px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: 800,
      cursor: "pointer",
      background: "#F9FAFB",
      color: "#636466",
      border: "1px solid #E5E7EB"
    },
    btnConfirm: {
      padding: "10px 20px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: 800,
      cursor: "pointer",
      background: "#D93025", // Vermelho de alerta
      color: "#FFFFFF",
      border: "none",
      boxShadow: "0 4px 10px rgba(217,48,37,0.3)"
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.content}>
        <span style={s.icon}>⚠️</span>
        <h3 style={s.title}>Atenção</h3>
        {/* Renderiza a mensagem permitindo quebra de linha (\n) se houver */}
        <p style={s.message}>
          {message.split('\n').map((linha, i) => (
            <React.Fragment key={i}>
              {linha}
              <br />
            </React.Fragment>
          ))}
        </p>
        
        <div style={s.buttons}>
          <button style={s.btnCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button style={s.btnConfirm} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
      
      {/* Animação suave de entrada */}
      <style>
        {`@keyframes popUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}
      </style>
    </div>
  );
}