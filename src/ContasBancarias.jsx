// ============================================================
// ContasBancarias.jsx — Tela completa de Contas Bancárias
// Adicione este arquivo na pasta do seu projeto React.
// No app.jsx:
//   import ContasBancarias from './ContasBancarias';
//   // Adicione NavItem: "contas_bancarias" → <ContasBancarias />
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

// ── Paleta e utilitários ──────────────────────────────────
const C = {
  bg: "#f0f4f8",
  surface: "#ffffff",
  border: "#e2e8f0",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
  purple: "#8b5cf6",
  text: "#1e293b",
  muted: "#64748b",
  subtle: "#94a3b8",
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
const Card = ({ children, style = {}, glow = C.blue }) => (
  <div style={{
    background: C.surface, backdropFilter: "blur(16px)",
    border: `1px solid ${glow}33`, borderRadius: 20,
    boxShadow: `0 0 30px ${glow}12, 0 8px 32px rgba(0,0,0,0.4)`,
    ...style
  }}>{children}</div>
);

const KPI = ({ label, value, icon, color = C.blue, sub }) => (
  <div style={{
    background: C.surface, backdropFilter: "blur(16px)",
    border: `1px solid ${color}33`, borderRadius: 18, padding: "22px 24px",
    boxShadow: `0 0 28px ${color}14, 0 8px 24px rgba(0,0,0,0.4)`,
    transition: "transform 0.2s",
    cursor: "default",
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 9, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.subtle, marginTop: 5 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
    </div>
  </div>
);

const Btn = ({ children, onClick, color = C.blue, disabled, style = {}, size = "md" }) => {
  const pad = size === "sm" ? "7px 14px" : "11px 22px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "rgba(255,255,255,0.05)" : `${color}22`,
      color: disabled ? C.muted : color,
      border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : color + "44"}`,
      borderRadius: 10, padding: pad, cursor: disabled ? "not-allowed" : "pointer",
      fontWeight: 800, fontSize: fs, transition: "all 0.15s",
      ...style
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = `${color}40`)}
      onMouseLeave={e => !disabled && (e.currentTarget.style.background = `${color}22`)}
    >{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, required, options }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 13,
        outline: "none",
      }}>
        <option value="">-- Selecionar --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`,
        borderRadius: 10, padding: "10px 13px", color: C.text, fontSize: 13,
        outline: "none", width: "100%", boxSizing: "border-box",
      }} />
    )}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    background: `${color}20`, color, border: `1px solid ${color}44`,
    padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,20,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "rgba(10,18,32,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 560, position: "relative", boxShadow: "0 60px 120px rgba(0,0,0,0.8)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.subtle, fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(to bottom, ${C.blue}, ${C.green})` }} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{isEdit ? "Editar Conta Bancária" : "Nova Conta Bancária"}</h2>
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
              <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0 0" }}>O saldo inicial não pode ser alterado depois do cadastro.</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
          <Btn onClick={onClose} color={C.muted}>Cancelar</Btn>
          <Btn onClick={handleSave} color={C.blue} disabled={saving} style={{ minWidth: 140 }}>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,20,0.9)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ background: "rgba(8,13,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 960, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 60px 120px rgba(0,0,0,0.9)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: C.subtle, fontSize: 18, cursor: "pointer", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 4, height: 32, borderRadius: 2, background: `linear-gradient(to bottom, ${C.green}, ${C.blue})` }} />
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>Conciliação OFX — {conta.nome}</h2>
              <p style={{ margin: "4px 0 0 0", color: C.muted, fontSize: 12 }}>{conta.banco} · Ag {conta.agencia} · CC {conta.conta}</p>
            </div>
          </div>
        </div>

        {/* STEP: upload */}
        {step === "upload" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏦</div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 20, fontWeight: 800 }}>Importar Extrato Bancário</h3>
            <p style={{ color: C.muted, marginBottom: 32, fontSize: 13 }}>Selecione o arquivo .OFX exportado pelo seu banco.<br />O sistema fará o matching automático com suas provisões.</p>
            <input type="file" id="ofxFile" accept=".ofx" style={{ display: "none" }} onChange={handleUpload} />
            <label htmlFor="ofxFile" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: `${C.green}22`, border: `1px solid ${C.green}44`,
              color: C.green, borderRadius: 14, padding: "14px 32px",
              cursor: "pointer", fontWeight: 800, fontSize: 14,
              boxShadow: `0 4px 20px ${C.green}22`,
            }}>
              {loading ? "⌛ Processando..." : "📥 Selecionar arquivo OFX"}
            </label>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 20 }}>Formatos suportados: .OFX (todos os bancos brasileiros)</p>
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
                  { label: "Aguardando Revisão", value: pendentes.length, color: C.yellow },
                ].map((k, i) => (
                  <div key={i} style={{ background: `${k.color}12`, border: `1px solid ${k.color}33`, borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: k.color, fontFamily: "monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {pendentes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: `${C.green}08`, border: `1px solid ${C.green}25`, borderRadius: 18 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900 }}>Extrato 100% Conciliado!</h3>
                <p style={{ color: C.muted, fontSize: 13 }}>Todas as transações foram processadas com sucesso.</p>
                <Btn onClick={() => { onConcluido(); onClose(); }} color={C.green} style={{ marginTop: 20 }}>Fechar e Atualizar</Btn>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, borderLeft: `4px solid ${C.yellow}`, paddingLeft: 12 }}>
                    {pendentes.length} transação(ões) aguardando revisão
                  </h3>
                  <Btn onClick={() => { onConcluido(); onClose(); }} color={C.green} size="sm">✓ Concluir e Fechar</Btn>
                </div>

                {pendentes.map((item, index) => (
                  <div key={item.id_transacao} style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${item.tipo === "credito" ? C.green + "30" : C.red + "30"}`,
                    borderRadius: 16, padding: "20px 22px", marginBottom: 14,
                  }}>
                    {/* Cabeçalho transação */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                          {item.tipo === "credito" ? "💚 Crédito (Entrada)" : "🔴 Débito (Saída)"}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: item.tipo === "credito" ? C.green : C.red, fontFamily: "monospace" }}>
                          {item.tipo === "credito" ? "+ " : "− "}{fmt(item.extrato_valor)}
                        </div>
                        <div style={{ fontSize: 12, color: C.subtle, marginTop: 4, fontStyle: "italic" }}>
                          "{item.extrato_descricao}"
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Data</div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{item.extrato_data}</div>
                        <div style={{ marginTop: 8 }}>
                          {item.sugestoes_vinculo?.length > 0
                            ? <Badge label="✦ Match Encontrado" color={C.green} />
                            : item.sugestao_regra
                              ? <Badge label="✨ Memória" color={C.yellow} />
                              : <Badge label="⚡ Sem Provisão" color={C.muted} />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Match encontrado */}
                    {item.sugestoes_vinculo?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: C.yellow, fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>Provisão correspondente encontrada:</div>
                        {item.sugestoes_vinculo.map((s, si) => (
                          <div key={si} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 12, padding: "12px 16px", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14 }}>{s.fornecedor} — {s.descricao}</div>
                              <div style={{ color: C.green, fontSize: 12, marginTop: 3 }}>
                                {fmt(s.valor_sistema)} · Venc: {fmtDate(s.vencimento_sistema)}
                              </div>
                            </div>
                            <Btn onClick={() => handleConfirmarMatch(item, s.id_parcela)} color={C.green} style={{ flexShrink: 0, marginLeft: 16 }}>
                              ✔ CONFIRMAR
                            </Btn>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lançamento direto */}
                    {(item.sugestoes_vinculo?.length === 0) && (
                      <div style={{ background: `${C.yellow}08`, border: `1px dashed ${C.yellow}40`, borderRadius: 12, padding: "14px 16px" }}>
                        {item.sugestao_regra && (
                          <p style={{ color: C.yellow, fontSize: 12, fontWeight: 700, margin: "0 0 10px 0" }}>
                            ✨ Memória: esse extrato costuma ser de <strong>{item.sugestao_regra.fornecedor_nome}</strong>
                          </p>
                        )}
                        {!item.sugestao_regra && (
                          <p style={{ color: C.subtle, fontSize: 12, margin: "0 0 10px 0" }}>
                            Sem provisão encontrada. Selecione a empresa para criar o lançamento e conciliar:
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <select id={`forn_${index}`} defaultValue={item.sugestao_regra?.id_fornecedor || ""} style={{
                            flex: 1, padding: "10px 13px", borderRadius: 10,
                            background: "rgba(0,0,0,0.4)", border: `1px solid ${C.yellow}33`,
                            color: C.text, fontSize: 12,
                          }}>
                            <option value="">-- Selecionar Empresa / Fornecedor --</option>
                            {fornecedores.map(f => (
                              <option key={f.id} value={f.id}>{f.nome_razao} ({f.documento})</option>
                            ))}
                          </select>
                          <Btn onClick={() => handleLancarDireto(item, index)} color={C.yellow} style={{ flexShrink: 0, color: "#000" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, color: C.text, fontFamily: "'IBM Plex Mono', monospace, system-ui" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: `linear-gradient(to bottom, ${C.blue}, ${C.green})` }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em" }}>Contas Bancárias</h1>
              <p style={{ margin: "4px 0 0 0", color: C.muted, fontSize: 13 }}>Gestão de contas, extratos e conciliação OFX</p>
            </div>
          </div>
        </div>
        <Btn onClick={() => { setEditando(null); setShowModalConta(true); }} color={C.blue}>
          ➕ Nova Conta
        </Btn>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KPI label="Saldo Total" value={fmt(saldoTotal)} icon="🏦" color={saldoTotal >= 0 ? C.green : C.red} sub={`${contas.length} conta(s) ativa(s)`} />
        <KPI label="Entradas do Mês" value={fmt(dashboard?.movimentacoes_mes?.entradas || 0)} icon="📈" color={C.blue} />
        <KPI label="Saídas do Mês" value={fmt(dashboard?.movimentacoes_mes?.saidas || 0)} icon="📉" color={C.red} />
        <KPI label="Transações Pendentes" value={txPendentes} icon="⚡" color={txPendentes > 0 ? C.yellow : C.green} sub={`${txConciliadas} conciliadas`} />
      </div>

      {/* ── CARDS DAS CONTAS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ background: C.surface, borderRadius: 20, padding: "28px 24px", border: `1px solid ${C.border}`, animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 16, background: "rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: 12, width: "60%" }} />
              <div style={{ height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: 8 }} />
              <div style={{ height: 12, background: "rgba(255,255,255,0.03)", borderRadius: 6, width: "40%" }} />
            </div>
          ))
        ) : contas.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
            <h3 style={{ margin: "0 0 8px", fontWeight: 800 }}>Nenhuma conta cadastrada</h3>
            <p style={{ color: C.muted, fontSize: 13 }}>Cadastre sua primeira conta bancária para começar a conciliar.</p>
          </div>
        ) : contas.map(c => {
          const isActive = c.id === activeContaId;
          return (
            <div key={c.id} onClick={() => setActiveContaId(isActive ? null : c.id)} style={{
              background: isActive ? `rgba(59,130,246,0.12)` : C.surface,
              border: `1px solid ${isActive ? C.blue + "60" : C.border}`,
              borderRadius: 20, padding: "24px 22px", cursor: "pointer",
              transition: "all 0.2s", position: "relative",
              boxShadow: isActive ? `0 0 30px ${C.blue}20` : "none",
            }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.borderColor = `${C.blue}40`)}
              onMouseLeave={e => !isActive && (e.currentTarget.style.borderColor = C.border)}
            >
              {/* Badge do banco */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{c.banco} · {c.tipo}</div>
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>Ag {c.agencia || "—"} · CC {c.conta || "—"}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${C.blue}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏦</div>
              </div>

              {/* Saldo */}
              <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Saldo Atual</div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: c.saldo_atual >= 0 ? C.green : C.red }}>
                  {fmt(c.saldo_atual)}
                </div>
                {c.saldo_inicial !== c.saldo_atual && (
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Inicial: {fmt(c.saldo_inicial)}</div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
                <Btn size="sm" color={C.red} onClick={(e) => { e.stopPropagation(); handleDeleteConta(c); }} style={{ padding:'7px 12px', minWidth:0 }} title="Excluir conta">
                  🗑️
                </Btn>
                <Btn size="sm" color={C.green} onClick={() => setConciliacaoConta(c)} style={{ flex: 1, textAlign: "center" }}>
                  📥 OFX
                </Btn>
                <Btn size="sm" color={C.blue} onClick={() => { setEditando(c); setShowModalConta(true); }}>
                  ✏️
                </Btn>
              </div>

              {isActive && (
                <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: C.blue, boxShadow: `0 0 8px ${C.blue}` }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── EXTRATO DA CONTA SELECIONADA ── */}
      {activeContaId && contaAtiva && (
        <Card glow={C.blue} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Extrato — {contaAtiva.nome}</h3>
              <p style={{ margin: "4px 0 0 0", color: C.muted, fontSize: 12 }}>Transações importadas via OFX</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{
                background: "rgba(0,0,0,0.4)", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "7px 12px", color: C.text, fontSize: 12,
              }}>
                <option value="TODOS">Todos os status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="CONCILIADO">Conciliados</option>
                <option value="SUGERIDO">Sugeridos</option>
              </select>
              <Btn size="sm" color={C.muted} onClick={() => loadTransacoes(activeContaId)}>
                🔄 Atualizar
              </Btn>
              <Btn size="sm" color={C.green} onClick={() => setConciliacaoConta(contaAtiva)}>
                📥 Importar OFX
              </Btn>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Data", "Descrição", "Tipo", "Valor", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,0.2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingTx ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>Carregando...</td></tr>
                ) : transacoes.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 50, textAlign: "center", color: C.muted, fontSize: 13 }}>
                    Nenhuma transação. Importe um extrato OFX para começar.
                  </td></tr>
                ) : transacoes.map((t, i) => {
                  const statusColor = t.status_conciliacao === "CONCILIADO" ? C.green : t.status_conciliacao === "SUGERIDO" ? C.yellow : C.muted;
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", color: C.subtle, fontSize: 12 }}>{fmtDate(t.data_movimento)}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12.5 }}>{t.descricao}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge label={t.tipo} color={t.tipo === "credito" ? C.green : C.red} />
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700, color: t.tipo === "credito" ? C.green : C.red }}>
                        {t.tipo === "credito" ? "+" : "−"} {fmt(t.valor)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge label={t.status_conciliacao} color={statusColor} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {t.status_conciliacao === "PENDENTE" && (
                          <Btn size="sm" color={C.yellow} onClick={() => setConciliacaoConta(contaAtiva)}>Conciliar</Btn>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {transacoes.length > 0 && (
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
              <span>{transacoes.length} transação(ões)</span>
              <span>
                {transacoes.filter(t => t.status_conciliacao === "CONCILIADO").length} conciliadas ·&nbsp;
                <span style={{ color: C.yellow }}>{transacoes.filter(t => t.status_conciliacao === "PENDENTE").length} pendentes</span>
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
