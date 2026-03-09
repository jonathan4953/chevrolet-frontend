import React, { useState } from "react";

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
      alert("Extrato Importado!");
      // Aqui você chamaria a função para recarregar a lista
    } catch (err) {
      alert("Erro ao importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.cardFull}>
      <div style={{...styles.resultsHeader, display: 'flex', justifyContent: 'space-between'}}>
        <h2 style={styles.cardTitle}>🏦 Conciliação Bancária Unificada</h2>
        <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
          <input type="file" accept=".ofx" onChange={e => setFileOFX(e.target.files[0])} style={{fontSize: 12}} />
          <button onClick={handleUpload} style={{...styles.exportBtn, background: '#3b82f6'}}>
            {loading ? "Processando..." : "Importar OFX"}
          </button>
        </div>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.tableMassa}>
          <thead>
            <tr>
              <th style={styles.thMassa}>Data</th>
              <th style={styles.thMassa}>Descrição</th>
              <th style={styles.thMassa}>Valor</th>
              <th style={styles.thMassa}>Categoria / Centro de Custo</th>
              <th style={styles.thMassa}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.length === 0 ? (
              <tr>
                <td colSpan="5" style={{...styles.tdMassa, textAlign: 'center', padding: 50}}>
                  Aguardando importação de extrato...
                </td>
              </tr>
            ) : (
              transacoes.map((t, i) => (
                <tr key={i} style={styles.trBody}>
                  {/* Linhas da tabela aqui */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}