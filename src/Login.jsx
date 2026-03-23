import React, { useState } from "react";
import { api } from "./api";
import { LogoOmni } from "./constants";
import DottedSurface from "./DottedSurface"; // Importando o background 3D

export default function Login({ sysLogos, onLoginSuccess, onFirstAccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post('/rbac/login', { email, password });
      const user = res.data;
      
      if (user.precisa_trocar_senha) {
        onFirstAccess(user); 
      } else {
        onLoginSuccess(user); 
      }
    } catch (err) {
      setError("E-mail ou senha incorretos. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      position: "fixed",
      top: 0,
      left: 0,
      backgroundColor: "#E8EAED", 
      fontFamily: "'Inter', sans-serif",
      zIndex: 9999,
      boxSizing: "border-box",
      overflow: "hidden", // Evita scroll indesejado do canvas
    },
    card: {
      position: "relative", // Necessário para ficar por cima do background
      zIndex: 10,           // Fica acima das ondas
      backgroundColor: "#FFFFFF",
      padding: "50px 40px",
      borderRadius: "24px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
    },
    logoContainer: {
      marginBottom: "30px",
      display: "flex",
      justifyContent: "center",
    },
    logo: {
      width: "100%",
      maxWidth: "280px",
      height: "auto",
      objectFit: "contain",
    },
    errorBox: {
      backgroundColor: "rgba(217, 48, 37, 0.1)",
      color: "#D93025",
      padding: "12px",
      borderRadius: "8px",
      fontSize: "13px",
      marginBottom: "20px",
      border: "1px solid rgba(217, 48, 37, 0.3)",
      fontWeight: "500",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    inputGroup: {
      textAlign: "left",
    },
    label: {
      display: "block",
      fontSize: "13px",
      color: "#8E9093",
      marginBottom: "8px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    input: {
      width: "100%",
      padding: "14px 16px",
      fontSize: "15px",
      color: "#2A2B2D",
      backgroundColor: "#F8F9FA",
      border: "1px solid #D1D5DB",
      borderRadius: "12px",
      outline: "none",
      transition: "all 0.2s ease",
      boxSizing: "border-box",
    },
    button: {
      marginTop: "10px",
      padding: "16px",
      backgroundColor: "#F26B25",
      color: "#FFFFFF",
      fontSize: "15px",
      fontWeight: "bold",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "background-color 0.2s ease, transform 0.1s",
      boxShadow: "0 4px 15px rgba(242, 107, 37, 0.3)",
    },
    footerText: {
      marginTop: "30px",
      fontSize: "12px",
      color: "#8E9093",
    }
  };

  return (
    <div style={styles.container}>
      {/* O Background Animado renderizado aqui, por trás de tudo */}
      <DottedSurface /> 
      
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img 
            src={sysLogos?.login || LogoOmni} 
            alt="Omni26 Logo" 
            style={styles.logo} 
          />
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail Corporativo</label>
            <input
              type="email"
              style={styles.input}
              placeholder="seu.nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#F26B25"}
              onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = "#F26B25"}
              onBlur={(e) => e.target.style.borderColor = "#D1D5DB"}
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.button, 
              opacity: loading ? 0.7 : 1,
              backgroundColor: loading ? "#CC4E0E" : "#F26B25"
            }} 
            disabled={loading}
          >
            {loading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"}
          </button>
        </form>

        <div style={styles.footerText}>
          &copy; 2026 Omni26 ERP. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}