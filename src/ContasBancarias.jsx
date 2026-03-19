import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import ConfirmModal from './components/ConfirmModal';

// ── Paleta e utilitários ──────────────────────────────────
const C = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#F26B25", // Laranja Oficial
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  purple: "#8b5cf6",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
};

const fmt = (v) =>
  "R$ " +
  Number(v || 0)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const fmtDate = (d) =>
  d ? new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR") : "-";

const bancosBR = [
  "Banco do Brasil", "Bradesco", "Itaú", "Santander", "Caixa Econômica Federal",
  "Nubank", "Inter", "C6 Bank", "BTG Pactual", "Sicoob", "Sicredi",
  "Safra", "Original", "XP Investimentos", "Outro"
];

// ── Componentes base ──────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 20,
    boxShadow: `0 4px 12px rgba(0,0,0,0.03)`,
    ...style
  }}>{children}</div>
);

const KPI = ({ label, value, icon, color = C.primary, sub }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`, borderRadius: 18, padding: "22px 24px",
    boxShadow: `0 4px 12px rgba(0,0,0,0.03)`,
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-3px)";
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.06)`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.03)`;
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.subtle, marginTop: 5, fontWeight: 600 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
    </div>
  </div>
);

const Btn = ({ children, onClick, color = C.primary, disabled, style = {}, size = "md", solid = false }) => {
  const pad = size === "sm" ? "7px 14px" : "11px 22px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#F5F6F8" : solid ? color : `${color}15`,
      color: disabled ? C.muted : solid ? "#FFFFFF" : color,
      border: solid ? "none" : `1px solid ${disabled ? C.border : color + "40"}`,
      borderRadius: 10, padding: pad, cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 800, fontSize: fs, transition: "all 0.15s",
      boxShadow: solid && !disabled ? `0 4px 10px ${color}33` : "none",
      ...style
    }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(-1px)";
          if(!solid) e.currentTarget.style.background = `${color}25`;
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.transform = "translateY(0)";
          if(!solid) e.currentTarget.style.background = `${color}15`;
        }
      }}
    >{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, required, options }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: "#FFFFFF", border: `1px solid #D4D5D6`,
        borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 13,
        outline: "none", transition: "border 0.2s"
      }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
        <option value="">-- Selecionar --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        background: "#FFFFFF", border: `1px solid #D4D5D6`,
        borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 13,
        outline: "none", width: "100%", boxSizing: "border-box", transition: "border 0.2s"
      }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"} />
    )}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}15`, color, border: `1px solid ${color}30`,
    padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
  }}>{label}</span>
);

// ── Modal Cadastro/Edição Conta Bancária ──────────────────
function ModalConta({ conta, onSave, onClose }) {
  const isEdit = !!conta?.id;
  const [form, setForm] = useState({
    nome: conta?.nome || "",
    banco: conta?.banco || "",
    agencia: conta?.agencia || "",
    conta: conta?.conta || "",
    tipo: conta?.tipo || "Corrente",
    saldo_inicial: conta?.saldo_inicial || 0,
    ativo: conta?.ativo !== false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nome || !form.banco) return alert("Nome e banco são obrigatórios.");
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/conciliacao/contas-bancarias/${conta.id}`, form);
      } else {
        await api.post("/conciliacao/contas-bancarias", form);
      }
      onSave();
    } catch (e) {
      alert(e.response?.data?.detail || "Erro ao salvar conta.");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42, 43, 45, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 560, position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F9FAFB", border: "1px solid #D4D5D6", color: C.subtle, fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F9FAFB"}>✕</button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>{isEdit ? "Editar Conta Bancária" : "Nova Conta Bancária"}</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Nome da Conta" value={form.nome} onChange={set("nome")} placeholder="Ex: Conta Corrente Bradesco" required />
          </div>
          <Input label="Banco" value={form.banco} onChange={set("banco")} options={bancosBR} required />
          <Input label="Tipo" value={form.tipo} onChange={set("tipo")} options={["Corrente", "Poupança", "Pagamento", "Investimento"]} />
          <Input label="Agência" value={form.agencia} onChange={set("agencia")} placeholder="0001" />
          <Input label="Número da Conta" value={form.conta} onChange={set("conta")} placeholder="00000-0" />
          {!isEdit && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Saldo Inicial (R$)" type="number" value={form.saldo_inicial} onChange={v => set("saldo_inicial")(parseFloat(v) || 0)} placeholder="0.00" />
              <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0 0", fontWeight: 600 }}>O saldo inicial não pode ser alterado depois do cadastro.</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
          <Btn onClick={onClose} color={C.subtle}>Cancelar</Btn>
          <Btn onClick={handleSave} color={C.primary} solid disabled={saving} style={{ minWidth: 140 }}>
            {saving ? "Salvando..." : (isEdit ? "💾 Salvar" : "➕ Criar Conta")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Modal de Conciliação OFX ──────────────────────────────
function ModalConciliacao({ conta, fornecedores, onClose, onConcluido }) {
  const [step, setStep] = useState("upload"); // upload | revisao | done
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [itens, setItens] = useState([]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("id_conta_bancaria", conta.id);
      const res = await api.post("/financeiro/conciliar/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResultado(res.data);
      setItens(res.data.conciliacao || []);
      setStep("revisao");
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao processar OFX.");
    } finally { setLoading(false); }
  };

  const handleConfirmarMatch = async (item, idParcela) => {
    try {
      await api.post("/conciliacao/aprovar-match", {
        id_transacao: item.id_transacao,
        id_parcela: idParcela,
        tipo_parcela: item.tipo === "debito" ? "PAGAR" : "RECEBER",
      });
      setItens(prev => prev.filter(i => i.id_transacao !== item.id_transacao));
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao confirmar match.");
    }
  };

  const handleLancarDireto = async (item, index) => {
    const sel = document.getElementById(`forn_${index}`);
    const id_fornecedor = sel?.value;
    if (!id_fornecedor) return alert("Selecione uma empresa para lançar.");
    try {
      await api.post("/conciliacao/lancar-e-conciliar", {
        id_transacao: item.id_transacao,
        id_fornecedor: parseInt(id_fornecedor),
        descricao: item.extrato_descricao,
        valor: item.extrato_valor,
        data: item.extrato_data_iso,
        tipo: item.tipo === "credito" ? "ENTRADA" : "SAIDA",
        id_conta_bancaria: conta.id,
      });
      setItens(prev => prev.filter(i => i.id_transacao !== item.id_transacao));
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao lançar.");
    }
  };

  const pendentes = itens.filter(i => !["CONCILIADO"].includes(i.status_conciliacao));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(42, 43, 45, 0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 960, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "#F9FAFB", border: "1px solid #D4D5D6", color: C.subtle, fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"} onMouseLeave={e => e.currentTarget.style.background = "#F9FAFB"}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 4, height: 32, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Conciliação OFX — {conta.nome}</h2>
              <p style={{ margin: "4px 0 0 0", color: C.muted, fontSize: 12, fontWeight: 600 }}>{conta.banco} · Ag {conta.agencia} · CC {conta.conta}</p>
            </div>
          </div>
        </div>

        {/* STEP: upload */}
        {step === "upload" && (
          <div style={{ textAlign: "center", padding: "60px 20px", border: `2px dashed ${C.primary}40`, background: `${C.primary}05`, borderRadius: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏦</div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 22, fontWeight: 900, color: C.text }}>Importar Extrato Bancário</h3>
            <p style={{ color: C.subtle, marginBottom: 32, fontSize: 14, fontWeight: 600 }}>Selecione o arquivo .OFX exportado pelo seu banco.<br />O sistema fará o matching automático com suas provisões.</p>
            <input type="file" id="ofxFile" accept=".ofx" style={{ display: "none" }} onChange={handleUpload} />
            <label htmlFor="ofxFile" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: C.primary, color: "#FFFFFF", borderRadius: 12, padding: "14px 32px",
              cursor: "pointer", fontWeight: 800, fontSize: 14,
              boxShadow: `0 4px 14px ${C.primary}40`, transition: "all 0.2s"
            }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              {loading ? "⌛ Processando..." : "📥 Selecionar arquivo OFX"}
            </label>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 20, fontWeight: 600 }}>Formatos suportados: .OFX (todos os bancos brasileiros)</p>
          </div>
        )}

        {/* STEP: revisao */}
        {step === "revisao" && (
          <div>
            {/* Resumo do resultado */}
            {resultado && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Novas Transações", value: resultado.novas_transacoes, color: C.blue },
                  { label: "Ignoradas (Dup)", value: resultado.ignoradas_duplicidade, color: C.muted },
                  { label: "Auto-Conciliadas", value: resultado.conciliadas_automaticamente, color: C.green },
                  { label: "Aguardando Revisão", value: pendentes.length, color: C.primary },
                ].map((k, i) => (
                  <div key={i} style={{ background: "#FFFFFF", border: `1px solid ${k.color}33`, borderRadius: 14, padding: "14px 18px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: k.color, fontFamily: "monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: C.subtle, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {pendentes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: `${C.green}08`, border: `1px solid ${C.green}30`, borderRadius: 18 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: C.text }}>Extrato 100% Conciliado!</h3>
                <p style={{ color: C.subtle, fontSize: 14, fontWeight: 600 }}>Todas as transações foram processadas com sucesso.</p>
                <Btn onClick={() => { onConcluido(); onClose(); }} color={C.green} solid style={{ marginTop: 24, padding: "12px 28px" }}>✓ Fechar e Atualizar</Btn>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, borderLeft: `4px solid ${C.primary}`, paddingLeft: 12, color: C.text }}>
                    {pendentes.length} transação(ões) aguardando revisão
                  </h3>
                  <Btn onClick={() => { onConcluido(); onClose(); }} color={C.green} solid size="sm">✓ Concluir e Fechar</Btn>
                </div>

                {pendentes.map((item, index) => (
                  <div key={item.id_transacao} style={{
                    background: "#FFFFFF",
                    border: `1px solid ${item.tipo === "credito" ? C.green + "40" : C.red + "40"}`,
                    borderRadius: 16, padding: "20px 22px", marginBottom: 14,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                  }}>
                    {/* Cabeçalho transação */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #E5E7EB" }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>
                          {item.tipo === "credito" ? "💚 Crédito (Entrada)" : "🔴 Débito (Saída)"}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: item.tipo === "credito" ? C.green : C.red, fontFamily: "monospace" }}>
                          {item.tipo === "credito" ? "+ " : "− "}{fmt(item.extrato_valor)}
                        </div>
                        <div style={{ fontSize: 13, color: C.subtle, marginTop: 4, fontStyle: "italic", fontWeight: 600 }}>
                          "{item.extrato_descricao}"
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Data</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{item.extrato_data}</div>
                        <div style={{ marginTop: 8 }}>
                          {item.sugestoes_vinculo?.length > 0
                            ? <Badge label="✦ Match Encontrado" color={C.green} />
                            : item.sugestao_regra
                              ? <Badge label="✨ Memória" color={C.primary} />
                              : <Badge label="⚡ Sem Provisão" color={C.muted} />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Match encontrado */}
                    {item.sugestoes_vinculo?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: C.green, fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>Provisão correspondente encontrada:</div>
                        {item.sugestoes_vinculo.map((s, si) => (
                          <div key={si} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: `${C.green}08`, border: `1px solid ${C.green}30`, borderRadius: 12, padding: "12px 16px", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{s.fornecedor} — {s.descricao}</div>
                              <div style={{ color: C.green, fontSize: 12, marginTop: 3, fontWeight: 700 }}>
                                {fmt(s.valor_sistema)} · Venc: {fmtDate(s.vencimento_sistema)}
                              </div>
                            </div>
                            <Btn onClick={() => handleConfirmarMatch(item, s.id_parcela)} color={C.green} solid style={{ flexShrink: 0, marginLeft: 16 }}>
                              ✔ CONFIRMAR
                            </Btn>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lançamento direto */}
                    {(item.sugestoes_vinculo?.length === 0) && (
                      <div style={{ background: "#F9FAFB", border: `1px dashed ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                        {item.sugestao_regra && (
                          <p style={{ color: C.primary, fontSize: 12, fontWeight: 800, margin: "0 0 10px 0" }}>
                            ✨ Memória: esse extrato costuma ser de <strong>{item.sugestao_regra.fornecedor_nome}</strong>
                          </p>
                        )}
                        {!item.sugestao_regra && (
                          <p style={{ color: C.subtle, fontSize: 12, fontWeight: 600, margin: "0 0 10px 0" }}>
                            Sem provisão encontrada. Selecione a empresa para criar o lançamento e conciliar:
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <select id={`forn_${index}`} defaultValue={item.sugestao_regra?.id_fornecedor || ""} style={{
                            flex: 1, padding: "10px 13px", borderRadius: 10,
                            background: "#FFFFFF", border: `1px solid #D4D5D6`,
                            color: C.text, fontSize: 13, outline: "none", transition: "border 0.2s"
                          }} onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = "#D4D5D6"}>
                            <option value="">-- Selecionar Empresa / Fornecedor --</option>
                            {fornecedores.map(f => (
                              <option key={f.id} value={f.id}>{f.nome_razao} ({f.documento})</option>
                            ))}
                          </select>
                          <Btn onClick={() => handleLancarDireto(item, index)} color={C.primary} solid style={{ flexShrink: 0 }}>
                            {item.sugestao_regra ? "CONFIRMAR E BAIXAR" : "CRIAR E CONCILIAR"}
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
export default function ContasBancarias({ fornecedores = [] }) {
  const [contas, setContas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModalConta, setShowModalConta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [conciliacaoConta, setConciliacaoConta] = useState(null);
  const [activeContaId, setActiveContaId] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const loadContas = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        api.get("/conciliacao/contas-bancarias"),
        api.get("/conciliacao/dashboard"),
      ]);
      setContas(cRes.data);
      setDashboard(dRes.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, []);

  const handleDeleteConta = async (conta) => {
    if (!window.confirm(`Excluir a conta "${conta.nome}"?\n\nTodas as transações serão removidas.`)) return;
    try {
      await api.delete(`/conciliacao/contas-bancarias/${conta.id}`);
      alert("Conta excluída.");
      loadContas();
      if (activeContaId === conta.id) setActiveContaId(null);
    } catch (e) {
      alert("Erro ao excluir: " + (e.response?.data?.detail || e.message));
    }
  };

  const loadTransacoes = useCallback(async (idConta) => {
    setLoadingTx(true);
    try {
      const params = { id_conta: idConta };
      if (filtroStatus !== "TODOS") params.status = filtroStatus;
      const res = await api.get("/conciliacao/transacoes", { params });
      setTransacoes(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingTx(false); }
  }, [filtroStatus]);

  useEffect(() => { loadContas(); }, [loadContas]);
  useEffect(() => { if (activeContaId) loadTransacoes(activeContaId); }, [activeContaId, filtroStatus, loadTransacoes]);

  const contaAtiva = contas.find(c => c.id === activeContaId);

  const saldoTotal = contas.reduce((s, c) => s + (c.saldo_atual || 0), 0);
  const txPendentes = dashboard?.transacoes?.pendentes || 0;
  const txConciliadas = dashboard?.transacoes?.conciliadas || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, color: C.text, fontFamily: "system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${C.primary}, #FF9B6A)` }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text }}>Contas Bancárias</h1>
              <p style={{ margin: "4px 0 0 0", color: C.muted, fontSize: 13, fontWeight: 600 }}>Gestão de contas, extratos e conciliação OFX</p>
            </div>
          </div>
        </div>
        <Btn onClick={() => { setEditando(null); setShowModalConta(true); }} color={C.primary} solid>
          ➕ Nova Conta
        </Btn>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KPI label="Saldo Total" value={fmt(saldoTotal)} icon="🏦" color={saldoTotal >= 0 ? C.green : C.red} sub={`${contas.length} conta(s) ativa(s)`} />
        <KPI label="Entradas do Mês" value={fmt(dashboard?.movimentacoes_mes?.entradas || 0)} icon="📈" color={C.blue} />
        <KPI label="Saídas do Mês" value={fmt(dashboard?.movimentacoes_mes?.saidas || 0)} icon="📉" color={C.red} />
        <KPI label="Transações Pendentes" value={txPendentes} icon="⚡" color={txPendentes > 0 ? C.primary : C.green} sub={`${txConciliadas} conciliadas`} />
      </div>

      {/* ── CARDS DAS CONTAS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ background: "#FFFFFF", borderRadius: 20, padding: "28px 24px", border: `1px solid #E5E7EB`, animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 16, background: "#F5F6F8", borderRadius: 8, marginBottom: 12, width: "60%" }} />
              <div style={{ height: 28, background: "#F5F6F8", borderRadius: 8, marginBottom: 8 }} />
              <div style={{ height: 12, background: "#F9FAFB", borderRadius: 6, width: "40%" }} />
            </div>
          ))
        ) : contas.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", background: "#FFFFFF", border: `1px solid #E5E7EB`, borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
            <h3 style={{ margin: "0 0 8px", fontWeight: 800, color: C.text }}>Nenhuma conta cadastrada</h3>
            <p style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>Cadastre sua primeira conta bancária para começar a conciliar.</p>
          </div>
        ) : contas.map(c => {
          const isActive = c.id === activeContaId;
          return (
            <div key={c.id} onClick={() => setActiveContaId(isActive ? null : c.id)} style={{
              background: isActive ? `${C.primary}05` : "#FFFFFF",
              border: `1px solid ${isActive ? C.primary : C.border}`,
              borderRadius: 20, padding: "24px 22px", cursor: "pointer",
              transition: "all 0.2s", position: "relative",
              boxShadow: isActive ? `0 4px 16px ${C.primary}20` : "0 4px 12px rgba(0,0,0,0.03)",
            }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = `${C.primary}50`)}
              onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = C.border)}
            >
              {/* Badge do banco */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{c.banco} · {c.tipo}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: C.subtle, marginTop: 4, fontWeight: 600 }}>Ag {c.agencia || "—"} · CC {c.conta || "—"}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏦</div>
              </div>

              {/* Saldo */}
              <div style={{ background: "#F9FAFB", border: `1px solid #E5E7EB`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Saldo Atual</div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: c.saldo_atual >= 0 ? C.green : C.red }}>
                  {fmt(c.saldo_atual)}
                </div>
                {c.saldo_inicial !== c.saldo_atual && (
                  <div style={{ fontSize: 10, color: C.subtle, marginTop: 4, fontWeight: 600 }}>Inicial: {fmt(c.saldo_inicial)}</div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                <Btn size="sm" color={C.red} onClick={(e) => { e.stopPropagation(); handleDeleteConta(c); }} style={{ padding:'7px 12px', minWidth:0 }} title="Excluir conta">
                  🗑️
                </Btn>
                <Btn size="sm" color={C.green} onClick={() => setConciliacaoConta(c)} style={{ flex: 1, textAlign: "center" }}>
                  📥 Importar OFX
                </Btn>
                <Btn size="sm" color={C.primary} onClick={() => { setEditando(c); setShowModalConta(true); }}>
                  ✏️ Editar
                </Btn>
              </div>

              {isActive && (
                <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: C.primary, boxShadow: `0 0 8px ${C.primary}` }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── EXTRATO DA CONTA SELECIONADA ── */}
      {activeContaId && contaAtiva && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, background: "#F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Extrato — {contaAtiva.nome}</h3>
              <p style={{ margin: "4px 0 0 0", color: C.subtle, fontSize: 12, fontWeight: 600 }}>Transações importadas via OFX</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{
                background: "#FFFFFF", border: `1px solid #D4D5D6`,
                borderRadius: 8, padding: "7px 12px", color: C.text, fontSize: 12, outline: "none",
                fontWeight: 600
              }}>
                <option value="TODOS">Todos os status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="CONCILIADO">Conciliados</option>
                <option value="SUGERIDO">Sugeridos</option>
              </select>
              <Btn size="sm" color={C.muted} onClick={() => loadTransacoes(activeContaId)}>
                🔄 Atualizar
              </Btn>
              <Btn size="sm" color={C.green} solid onClick={() => setConciliacaoConta(contaAtiva)}>
                📥 Importar OFX
              </Btn>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Data", "Descrição", "Tipo", "Valor", "Status", "Ações"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${C.border}`, background: "#FFFFFF", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingTx ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted, fontWeight: 600 }}>Carregando...</td></tr>
                ) : transacoes.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 50, textAlign: "center", color: C.muted, fontSize: 13, fontWeight: 600 }}>
                    Nenhuma transação. Importe um extrato OFX para começar.
                  </td></tr>
                ) : transacoes.map((t, i) => {
                  const statusColor = t.status_conciliacao === "CONCILIADO" ? C.green : t.status_conciliacao === "SUGERIDO" ? C.primary : C.muted;
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px", color: C.subtle, fontSize: 12, fontWeight: 700 }}>{fmtDate(t.data_movimento)}</td>
                      <td style={{ padding: "14px 16px", maxWidth: 260 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 13, fontWeight: 700, color: C.text }}>{t.descricao}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Badge label={t.tipo} color={t.tipo === "credito" ? C.green : C.red} />
                      </td>
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 800, color: t.tipo === "credito" ? C.green : C.red, fontSize: 14 }}>
                        {t.tipo === "credito" ? "+" : "−"} {fmt(t.valor)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Badge label={t.status_conciliacao} color={statusColor} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {t.status_conciliacao === "PENDENTE" && (
                          <Btn size="sm" color={C.primary} onClick={() => setConciliacaoConta(contaAtiva)}>Conciliar</Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {transacoes.length > 0 && (
            <div style={{ padding: "12px 24px", background: "#F9FAFB", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.subtle, fontWeight: 600 }}>
              <span>{transacoes.length} transação(ões)</span>
              <span>
                {transacoes.filter(t => t.status_conciliacao === "CONCILIADO").length} conciliadas ·&nbsp;
                <span style={{ color: C.primary, fontWeight: 800 }}>{transacoes.filter(t => t.status_conciliacao === "PENDENTE").length} pendentes</span>
              </span>
            </div>
          )}
        </Card>
      )}

      {/* ── MODAIS ── */}
      {showModalConta && (
        <ModalConta
          conta={editando}
          onSave={() => { setShowModalConta(false); setEditando(null); loadContas(); }}
          onClose={() => { setShowModalConta(false); setEditando(null); }}
        />
      )}

      {conciliacaoConta && (
        <ModalConciliacao
          conta={conciliacaoConta}
          fornecedores={fornecedores}
          onClose={() => setConciliacaoConta(null)}
          onConcluido={() => { loadContas(); if (activeContaId) loadTransacoes(activeContaId); }}
        />
      )}
    </div>
  );
}