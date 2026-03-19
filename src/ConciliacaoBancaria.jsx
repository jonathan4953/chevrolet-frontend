import React, { useState } from "react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bg: "#FFFFFF",
  bgAlt: "#F9FAFB"
};

export default function ConciliacaoBancaria({ styles, api, formatar_moeda_brl }) {
  const [transacoes, setTransacoes] = useState([]);
  const [fileOFX, setFileOFX] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!fileOFX) return alert("Selecione o arquivo OFX");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", fileOFX);

    try {
      await api.post("/financeiro/upload-ofx", formData);
      alert("Extrato Importado com Sucesso!");
      // loadTransacoes();
    } catch (err) {
      alert("Erro ao importar arquivo OFX.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#FFFFFF", 
      border: `1px solid ${C.border}`, 
      borderRadius: 16, 
      overflow: "hidden", 
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* HEADER */}
      <div style={{
        padding: "20px 24px", 
        borderBottom: `1px solid ${C.border}`, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: C.bgAlt
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: C.blue }} />
          <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: 0 }}>🏦 Conciliação Bancária Unificada</h2>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Custom File Upload */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "#FFF",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            color: C.subtle
          }}>
            <span style={{ fontSize: 16 }}>📂</span>
            {fileOFX ? fileOFX.name : "Selecionar OFX"}
            <input 
              type="file" 
              accept=".ofx" 
              onChange={e => setFileOFX(e.target.files[0])} 
              style={{ display: "none" }} 
            />
          </label>

          <button 
            onClick={handleUpload} 
            disabled={!fileOFX || loading}
            style={{
              background: C.blue,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              cursor: fileOFX ? "pointer" : "not-allowed",
              fontSize: 12,
              fontWeight: 800,
              boxShadow: fileOFX ? `0 4px 12px ${C.blue}33` : "none",
              opacity: fileOFX ? 1 : 0.6,
              transition: "all 0.2s"
            }}
          >
            {loading ? "⌛ Processando..." : "📥 Importar Extrato"}
          </button>
        </div>
      </div>

      {/* TABELA */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FFF" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Data</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Descrição</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Valor</th>
              <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Categoria / Centro de Custo</th>
              <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${C.border}` }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 80, textAlign: 'center', color: C.muted, fontSize: 14, fontWeight: 700 }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>☁️</div>
                  Aguardando importação de extrato para conciliação.
                </td>
              </tr>
            ) : (
              transacoes.map((t, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: C.text }}>{t.date}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: C.subtle, fontWeight: 600 }}>{t.description}</td>
                  <td style={{ 
                    padding: "14px 16px", 
                    fontSize: 13, 
                    fontWeight: 800, 
                    color: t.value < 0 ? C.red : C.green,
                    fontFamily: "monospace" 
                  }}>
                    {formatar_moeda_brl(t.value)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <select style={{ 
                      width: "100%", 
                      padding: "6px 10px", 
                      borderRadius: 8, 
                      border: `1px solid ${C.border}`, 
                      fontSize: 12,
                      background: "#F9FAFB"
                    }}>
                      <option>Vincular Categoria...</option>
                    </select>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <button style={{ 
                      background: C.green, 
                      color: "#FFF", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "6px 14px", 
                      fontSize: 11, 
                      fontWeight: 800,
                      cursor: "pointer"
                    }}>
                      CONCILIAR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}