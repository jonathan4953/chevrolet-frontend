import React, { useState, useEffect } from "react";
import { api } from "./api";

export default function Categorias({ styles }) {
  const [categorias, setCategorias] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [editandoCentro, setEditandoCentro] = useState(null);

  const [formCategoria, setFormCategoria] = useState({ nome: "", descricao: "" });
  const [formCentro, setFormCentro] = useState({ nome: "", descricao: "" });

  const showToast = (msg, tipo = "success") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCategorias = async () => {
    try {
      const res = await api.get("/financeiro/categorias");
      setCategorias(res.data);
    } catch (e) {
      showToast("Erro ao carregar categorias.", "error");
    }
  };

  const loadCentrosCusto = async () => {
    try {
      const res = await api.get("/financeiro/centros-custo");
      setCentrosCusto(res.data);
    } catch (e) {
      showToast("Erro ao carregar centros de custo.", "error");
    }
  };

  useEffect(() => {
    loadCategorias();
    loadCentrosCusto();
  }, []);

  const handleSalvarCategoria = async () => {
    if (!formCategoria.nome.trim()) {
      showToast("Nome da categoria é obrigatório.", "error");
      return;
    }
    try {
      setLoading(true);
      if (editandoCategoria) {
        await api.put(`/financeiro/categorias/${editandoCategoria.id}`, formCategoria);
        showToast("Categoria atualizada com sucesso!");
      } else {
        await api.post("/financeiro/categorias", formCategoria);
        showToast("Categoria criada com sucesso!");
      }
      setModalCategoria(false);
      setEditandoCategoria(null);
      setFormCategoria({ nome: "", descricao: "" });
      loadCategorias();
    } catch (e) {
      showToast("Erro ao salvar categoria.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirCategoria = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/financeiro/categorias/${id}`);
      showToast("Categoria excluída com sucesso!");
      loadCategorias();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Erro ao excluir categoria.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarCentro = async () => {
    if (!formCentro.nome.trim()) {
      showToast("Nome do centro de custo é obrigatório.", "error");
      return;
    }
    try {
      setLoading(true);
      if (editandoCentro) {
        await api.put(`/financeiro/centros-custo/${editandoCentro.id}`, formCentro);
        showToast("Centro de custo atualizado com sucesso!");
      } else {
        await api.post("/financeiro/centros-custo", formCentro);
        showToast("Centro de custo criado com sucesso!");
      }
      setModalCentro(false);
      setEditandoCentro(null);
      setFormCentro({ nome: "", descricao: "" });
      loadCentrosCusto();
    } catch (e) {
      showToast("Erro ao salvar centro de custo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirCentro = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/financeiro/centros-custo/${id}`);
      showToast("Centro de custo excluído com sucesso!");
      loadCentrosCusto();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Erro ao excluir centro de custo.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Declaração do objeto s antes do return para evitar erro de escopo
  const s = {
    container: { padding: "24px", color: "#f1f5f9" },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
    },
    title: { fontSize: "20px", fontWeight: "700", color: "#eab308" },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    card: {
      background: "rgba(15,23,42,0.7)",
      border: "1px solid rgba(234,179,8,0.15)",
      borderRadius: "12px",
      padding: "20px",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    cardTitle: { fontSize: "16px", fontWeight: "600", color: "#eab308" },
    btnAdd: {
      background: "rgba(234,179,8,0.15)",
      border: "1px solid rgba(234,179,8,0.3)",
      color: "#eab308",
      padding: "6px 14px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      textAlign: "left",
      padding: "10px 12px",
      fontSize: "12px",
      color: "#94a3b8",
      borderBottom: "1px solid rgba(234,179,8,0.1)",
      textTransform: "uppercase",
    },
    td: {
      padding: "10px 12px",
      fontSize: "13px",
      color: "#e2e8f0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    btnEdit: {
      background: "rgba(59,130,246,0.15)",
      border: "1px solid rgba(59,130,246,0.3)",
      color: "#60a5fa",
      padding: "4px 10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      marginRight: "6px",
    },
    btnDel: {
      background: "rgba(239,68,68,0.15)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#f87171",
      padding: "4px 10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#0f172a",
      border: "1px solid rgba(234,179,8,0.2)",
      borderRadius: "16px",
      padding: "28px",
      width: "420px",
      maxWidth: "95vw",
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#eab308",
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "12px",
      color: "#94a3b8",
      marginBottom: "6px",
      textTransform: "uppercase",
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(234,179,8,0.2)",
      borderRadius: "8px",
      padding: "10px 12px",
      color: "#f1f5f9",
      fontSize: "14px",
      marginBottom: "16px",
      boxSizing: "border-box",
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "8px",
    },
    btnCancel: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "#94a3b8",
      padding: "8px 18px",
      borderRadius: "8px",
      cursor: "pointer",
    },
    btnSave: {
      background: "linear-gradient(135deg,#eab308,#ca8a04)",
      border: "none",
      color: "#000",
      padding: "8px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "700",
    },
  };

  // Modal reutilizável para Categoria e Centro de Custo
  const ModalForm = ({ titulo, form, setForm, onSalvar, onFechar }) => (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalTitle}>{titulo}</div>
        <label style={s.label}>Nome *</label>
        <input
          style={s.input}
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
          placeholder="Nome"
        />
        <label style={s.label}>Descrição</label>
        <input
          style={s.input}
          value={form.descricao}
          onChange={e => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descrição (opcional)"
        />
        <div style={s.modalFooter}>
          <button style={s.btnCancel} onClick={onFechar}>
            Cancelar
          </button>
          <button style={s.btnSave} onClick={onSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.container}>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            zIndex: 9999,
            background: toast.tipo === "error" ? "rgba(239,68,68,0.9)" : "rgba(34,197,94,0.9)",
            color: "#fff",
          }}
        >
          {toast.msg}
        </div>
      )}

      {modalCategoria && (
        <ModalForm
          titulo={editandoCategoria ? "✏️ Editar Categoria" : "➕ Nova Categoria"}
          form={formCategoria}
          setForm={setFormCategoria}
          onSalvar={handleSalvarCategoria}
          onFechar={() => {
            setModalCategoria(false);
            setEditandoCategoria(null);
            setFormCategoria({ nome: "", descricao: "" });
          }}
        />
      )}

      {modalCentro && (
        <ModalForm
          titulo={editandoCentro ? "✏️ Editar Centro de Custo" : "➕ Novo Centro de Custo"}
          form={formCentro}
          setForm={setFormCentro}
          onSalvar={handleSalvarCentro}
          onFechar={() => {
            setModalCentro(false);
            setEditandoCentro(null);
            setFormCentro({ nome: "", descricao: "" });
          }}
        />
      )}

      <div style={s.header}>
        <span style={s.title}>⚙️ Categorias e Centros de Custo</span>
      </div>

      <div style={s.grid}>
        {/* Categorias */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>🏷️ Categorias</span>
            <button
              style={s.btnAdd}
              onClick={() => {
                setEditandoCategoria(null);
                setFormCategoria({ nome: "", descricao: "" });
                setModalCategoria(true);
              }}
            >
              + Nova Categoria
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nome</th>
                <th style={s.th}>Descrição</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ ...s.td, textAlign: "center", color: "#64748b" }}>
                    Nenhuma categoria cadastrada
                  </td>
                </tr>
              ) : (
                categorias.map((cat) => (
                  <tr key={cat.id}>
                    <td style={s.td}>{cat.nome}</td>
                    <td style={s.td}>{cat.descricao || "-"}</td>
                    <td style={s.td}>
                      <button
                        style={s.btnEdit}
                        onClick={() => {
                          setEditandoCategoria(cat);
                          setFormCategoria({
                            nome: cat.nome,
                            descricao: cat.descricao || "",
                          });
                          setModalCategoria(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        style={s.btnDel}
                        onClick={() => handleExcluirCategoria(cat.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Centros de Custo */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>🏢 Centros de Custo</span>
            <button
              style={s.btnAdd}
              onClick={() => {
                setEditandoCentro(null);
                setFormCentro({ nome: "", descricao: "" });
                setModalCentro(true);
              }}
            >
              + Novo Centro
            </button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nome</th>
                <th style={s.th}>Descrição</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {centrosCusto.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ ...s.td, textAlign: "center", color: "#64748b" }}>
                    Nenhum centro de custo cadastrado
                  </td>
                </tr>
              ) : (
                centrosCusto.map((cc) => (
                  <tr key={cc.id}>
                    <td style={s.td}>{cc.nome}</td>
                    <td style={s.td}>{cc.descricao || "-"}</td>
                    <td style={s.td}>
                      <button
                        style={s.btnEdit}
                        onClick={() => {
                          setEditandoCentro(cc);
                          setFormCentro({ nome: cc.nome, descricao: cc.descricao || "" });
                          setModalCentro(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        style={s.btnDel}
                        onClick={() => handleExcluirCentro(cc.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}