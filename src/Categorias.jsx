import React, { useState, useEffect } from "react";
import { api } from "./api";

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
    if(!window.confirm("Deseja realmente excluir esta categoria?")) return;
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
    if(!window.confirm("Deseja realmente excluir este centro de custo?")) return;
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

  const s = {
    container: { padding: "24px", fontFamily: "system-ui, sans-serif" },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "24px",
    },
    title: { fontSize: "22px", fontWeight: "900", color: C.text },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    card: {
      background: "#FFFFFF",
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "0",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      background: C.bgAlt,
      borderBottom: `1px solid ${C.border}`,
    },
    cardTitle: { fontSize: "15px", fontWeight: "800", color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" },
    btnAdd: {
      background: C.primary,
      border: "none",
      color: "#FFF",
      padding: "8px 16px",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "800",
      boxShadow: `0 4px 10px ${C.primary}33`,
      transition: "all 0.2s"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      textAlign: "left",
      padding: "14px 16px",
      fontSize: "10px",
      fontWeight: "800",
      color: C.muted,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      borderBottom: `1px solid ${C.border}`,
    },
    td: {
      padding: "14px 16px",
      fontSize: "13px",
      color: C.subtle,
      fontWeight: "600",
      borderBottom: `1px solid ${C.border}`,
    },
    btnEdit: {
      background: "none",
      border: `1px solid ${C.border}`,
      color: C.blue,
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "700",
      marginRight: "8px",
      transition: "all 0.2s"
    },
    btnDel: {
      background: "none",
      border: `1px solid ${C.border}`,
      color: C.red,
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "700",
      transition: "all 0.2s"
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(42, 43, 45, 0.6)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
    },
    modal: {
      background: "#FFFFFF",
      border: `1px solid ${C.border}`,
      borderRadius: "20px",
      padding: "32px",
      width: "400px",
      maxWidth: "90vw",
      boxShadow: "0 20px 50px rgba(0,0,0,0.15)"
    },
    modalTitle: {
      fontSize: "18px",
      fontWeight: "900",
      color: C.text,
      marginBottom: "24px",
    },
    label: {
      display: "block",
      fontSize: "10px",
      color: C.muted,
      fontWeight: "800",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    input: {
      width: "100%",
      background: "#FFFFFF",
      border: `1px solid #D4D5D6`,
      borderRadius: "10px",
      padding: "12px 14px",
      color: C.text,
      fontSize: "14px",
      marginBottom: "20px",
      boxSizing: "border-box",
      outline: "none"
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "8px",
    },
    btnCancel: {
      background: C.bgAlt,
      border: `1px solid ${C.border}`,
      color: C.subtle,
      padding: "10px 20px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px"
    },
    btnSave: {
      background: C.primary,
      border: "none",
      color: "#FFF",
      padding: "10px 24px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "800",
      fontSize: "13px",
      boxShadow: `0 4px 12px ${C.primary}33`
    },
  };

  const ModalForm = ({ titulo, form, setForm, onSalvar, onFechar }) => (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalTitle}>{titulo}</div>
        <label style={s.label}>Nome *</label>
        <input
          style={s.input}
          value={form.nome}
          onChange={e => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Marketing, Manutenção..."
        />
        <label style={s.label}>Descrição</label>
        <input
          style={s.input}
          value={form.descricao}
          onChange={e => setForm({ ...form, descricao: e.target.value })}
          placeholder="Breve detalhamento"
        />
        <div style={s.modalFooter}>
          <button style={s.btnCancel} onClick={onFechar}>
            Cancelar
          </button>
          <button style={s.btnSave} onClick={onSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Dados"}
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
            bottom: "32px",
            right: "32px",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "800",
            zIndex: 9999,
            background: toast.tipo === "error" ? C.red : C.green,
            color: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
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
        <div style={{ width: 4, height: 28, background: C.primary, borderRadius: 2 }} />
        <span style={s.title}>Categorias e Centros de Custo</span>
      </div>

      <div style={s.grid}>
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
              + Adicionar
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
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
                    <td colSpan={3} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40 }}>
                      Nenhuma categoria cadastrada
                    </td>
                  </tr>
                ) : (
                  categorias.map((cat) => (
                    <tr key={cat.id} onMouseEnter={e => e.currentTarget.style.background = C.bgAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{transition: "0.2s"}}>
                      <td style={{ ...s.td, color: C.text, fontWeight: "800" }}>{cat.nome}</td>
                      <td style={s.td}>{cat.descricao || "-"}</td>
                      <td style={s.td}>
                        <button
                          style={s.btnEdit}
                          onClick={() => {
                            setEditandoCategoria(cat);
                            setFormCategoria({ nome: cat.nome, descricao: cat.descricao || "" });
                            setModalCategoria(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button style={s.btnDel} onClick={() => handleExcluirCategoria(cat.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
              + Adicionar
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
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
                    <td colSpan={3} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40 }}>
                      Nenhum centro de custo cadastrado
                    </td>
                  </tr>
                ) : (
                  centrosCusto.map((cc) => (
                    <tr key={cc.id} onMouseEnter={e => e.currentTarget.style.background = C.bgAlt} onMouseLeave={e => e.currentTarget.style.background = "transparent"} style={{transition: "0.2s"}}>
                      <td style={{ ...s.td, color: C.text, fontWeight: "800" }}>{cc.nome}</td>
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
                          ✏️
                        </button>
                        <button style={s.btnDel} onClick={() => handleExcluirCentro(cc.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}