import { useState } from "react";
import api from "../api";

export default function FipePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/fipe/sync", {
        marcas: ["chevrolet", "fiat", "jeep", "gwm"]
      });

      setMessage("Base FIPE atualizada com sucesso!");
    } catch (error) {
      setMessage("Erro ao atualizar FIPE.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Atualização da Base FIPE</h2>

      <button onClick={handleSync} disabled={loading}>
        {loading ? "Atualizando..." : "Atualizar Agora"}
      </button>

      {message && <p style={{ marginTop: "15px" }}>{message}</p>}
    </div>
  );
}
