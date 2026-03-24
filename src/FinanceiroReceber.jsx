import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Calendar, Filter, Download, Plus,
  AlertCircle, Edit2, Trash2, AlertTriangle,
  FileText, TrendingUp, CheckCircle2, MoreVertical,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  DollarSign
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS — Padrão CentroDeComando
   ═══════════════════════════════════════════════════════════ */
const T = {
  primary: "#F26B25",
  primaryDark: "#D95A1E",
  primaryLight: "rgba(242,107,37,0.08)",
  primaryBorder: "rgba(242,107,37,0.20)",
  success: "#22A06B",
  danger: "#D93025",
  warning: "#E8A317",
  info: "#1A73E8",
  text: "#0f172a",
  sub: "#475569",
  muted: "#94a3b8",
  border: "#e2e8f0",
  borderL: "#f1f5f9",
  bg: "#f8fafc",
  card: "#fff",
  r: "12px",
  rS: "8px",
  rXs: "6px",
  sh: "0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06)",
  shM: "0 4px 12px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.08)",
  shL: "0 10px 40px rgba(0,0,0,0.10)"
};

/* ═══════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════ */
function KpiCard({ icon: Ic, label, value, color = T.primary }) {
  const [h, sH] = useState(false);
  const valStr = String(value || "");
  const fSize = valStr.length > 16 ? 14 : valStr.length > 12 ? 16 : 20;

  return (
    <div
      onMouseEnter={() => sH(true)}
      onMouseLeave={() => sH(false)}
      style={{
        background: T.card,
        borderRadius: T.r,
        padding: "16px 18px",
        border: `1px solid ${h ? T.primaryBorder : T.border}`,
        boxShadow: h ? T.shM : T.sh,
        transition: "all .25s",
        position: "relative",
        overflow: "hidden",
        minWidth: 0
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: 70, height: 70,
        background: `radial-gradient(circle at top right,${color}08,transparent 70%)`
      }} />
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: T.rS,
          background: `${color}12`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Ic size={15} color={color} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{
        fontSize: 10, color: T.muted, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fSize, fontWeight: 800, color: T.text,
        letterSpacing: "-.02em", lineHeight: 1.3, wordBreak: "break-word"
      }}>
        {value}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════ */
function Badge({ children, color = T.muted }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 9px", borderRadius: 20, fontSize: 10,
      fontWeight: 700, background: `${color}14`, color,
      border: `1px solid ${color}25`, textTransform: "capitalize"
    }}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   DROPDOWN + ACTION DROPDOWN
   ═══════════════════════════════════════════════════════════ */
function Dropdown({ trigger, items, align = "left" }) {
  const [o, sO] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) sO(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => sO(!o)} style={{ cursor: "pointer" }}>{trigger}</div>
      {o && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", [align]: 0,
          zIndex: 100, background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.rS, boxShadow: T.shL, minWidth: 200,
          padding: "6px 0", animation: "fadeIn .15s ease"
        }}>
          {items.map((it, i) => {
            if (it.divider) return <div key={i} style={{ height: 1, background: T.border, margin: "4px 0" }} />;
            return (
              <div
                key={i}
                onClick={() => { it.onClick?.(); sO(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 16px", cursor: "pointer", fontSize: 12,
                  fontWeight: 500, color: it.danger ? T.danger : it.success ? T.success : T.sub,
                  background: "transparent"
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {it.icon && <it.icon size={14} />}
                <span style={{ flex: 1 }}>{it.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionDropdown({ items }) {
  return (
    <Dropdown
      align="right"
      trigger={
        <div style={{
          width: 30, height: 30, borderRadius: T.rXs,
          border: `1px solid ${T.border}`, background: T.card,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: T.sub
        }}>
          <MoreVertical size={14} />
        </div>
      }
      items={items}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   TH + SECTION TITLE
   ═══════════════════════════════════════════════════════════ */
function TH({ children, style = {} }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: "left", fontSize: 10,
      fontWeight: 700, color: T.muted, textTransform: "uppercase",
      borderBottom: `2px solid ${T.border}`, background: T.card,
      whiteSpace: "nowrap", ...style
    }}>
      {children}
    </th>
  );
}

function SectionTitle({ title, icon: Ic, right }) {
  return (
    <div style={{
      padding: "14px 22px", borderBottom: `1px solid ${T.border}`,
      display: "flex", justifyContent: "space-between", alignItems: "center"
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 15, fontWeight: 700, color: T.text
      }}>
        {Ic && <Ic size={16} color={T.primary} strokeWidth={1.8} />}
        {title}
      </span>
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — FinanceiroReceber
   ═══════════════════════════════════════════════════════════ */
export default function FinanceiroReceber({
  contasReceber,
  loadContasReceber,
  handleEditReceber,
  handleExcluirReceber,
  handleBaixaReceber,
  setShowAddReceberModal,
  loadClientes,
  loadEstruturaContabil,
  financeiroBuscaReceber,
  setFinanceiroBuscaReceber,
  financeiroDataInicioReceber,
  setFinanceiroDataInicioReceber,
  financeiroDataFimReceber,
  setFinanceiroDataFimReceber,
  filtroStatusReceber,
  setFiltroStatusReceber,
  handleImportOFXReceber,
  loading,
  formatBRL,
  hasEditPermission,
  getStatusColor
}) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const hoje = new Date();

  const totalReceber = contasReceber.reduce((s, c) => s + (Number(c.valor) || 0), 0);

  const vencidosR = contasReceber.filter(c => {
    if (!c.vencimento || ["RECEBIDO", "CONCILIADO"].includes(c.status)) return false;
    return new Date(c.vencimento + "T12:00:00Z") < hoje;
  });

  const totalVencidoR = vencidosR.reduce((s, c) => s + (Number(c.valor) || 0), 0);

  const filtradosR = filtroStatusReceber === "TODOS" ? contasReceber :
    filtroStatusReceber === "VENCIDOS" ? vencidosR :
    contasReceber.filter(c => c.status === filtroStatusReceber);

  /* ── Paginação ── */
  const totalItems = filtradosR.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginados = useMemo(() => {
    if (pageSize === 0) return filtradosR;
    const start = (safePage - 1) * pageSize;
    return filtradosR.slice(start, start + pageSize);
  }, [filtradosR, safePage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * (pageSize || totalItems) + 1;
  const rangeEnd = pageSize === 0 ? totalItems : Math.min(safePage * pageSize, totalItems);

  useEffect(() => { setCurrentPage(1); }, [filtroStatusReceber, pageSize, contasReceber]);

  const selectStyle = {
    padding: "8px 12px", borderRadius: T.rS,
    border: `1px solid ${T.border}`, fontSize: 12,
    background: T.card, color: T.text, fontWeight: 600,
    cursor: "pointer", outline: "none"
  };

  const inputStyle = {
    padding: "10px 12px", borderRadius: T.rS,
    border: `1px solid ${T.border}`, fontSize: 12,
    background: T.card, color: T.text, fontWeight: 500
  };

  const btnPrimary = {
    background: T.primary, color: "#fff", border: "none",
    borderRadius: T.rS, padding: "10px 18px", fontWeight: 700,
    fontSize: 12, cursor: "pointer", display: "flex",
    alignItems: "center", gap: 6, whiteSpace: "nowrap",
    boxShadow: `0 2px 8px ${T.primary}30`
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 16,
      fontFamily: "'DM Sans','Inter',-apple-system,BlinkMacSystemFont,sans-serif"
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ═══ KPI CARDS ═══ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))",
        gap: 12
      }}>
        <KpiCard
          icon={TrendingUp}
          label="Total a Receber"
          value={`R$ ${formatBRL(totalReceber)}`}
          color={T.success}
        />
        <KpiCard
          icon={AlertCircle}
          label="Vencidos"
          value={`R$ ${formatBRL(totalVencidoR)}`}
          color={totalVencidoR > 0 ? T.danger : T.success}
        />
        <KpiCard
          icon={Calendar}
          label="Em Aberto"
          value={contasReceber.filter(c => c.status === "A RECEBER").length}
          color={T.warning}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Recebidos"
          value={contasReceber.filter(c => c.status === "RECEBIDO").length}
          color={T.info}
        />
      </div>

      {/* ═══ BARRA FILTROS + AÇÕES ═══ */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.r, padding: "18px 22px", boxShadow: T.sh
      }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>

          <div style={{ flex: "1 1 220px" }}>
            <label style={{
              fontSize: 10, color: T.muted, fontWeight: 700,
              textTransform: "uppercase", marginBottom: 6, display: "block"
            }}>Pesquisar</label>
            <div style={{ position: "relative" }}>
              <Search size={14} color={T.muted} style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)"
              }} />
              <input
                style={{ ...inputStyle, width: "100%", paddingLeft: 32, background: T.bg }}
                placeholder="Cliente, NF..."
                value={financeiroBuscaReceber}
                onChange={e => setFinanceiroBuscaReceber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: 10, color: T.muted, fontWeight: 700,
              textTransform: "uppercase", marginBottom: 6, display: "block"
            }}>Período</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="date" style={{ ...inputStyle, background: T.bg }}
                value={financeiroDataInicioReceber}
                onChange={e => setFinanceiroDataInicioReceber(e.target.value)}
              />
              <span style={{ color: T.muted, fontSize: 11 }}>a</span>
              <input
                type="date" style={{ ...inputStyle, background: T.bg }}
                value={financeiroDataFimReceber}
                onChange={e => setFinanceiroDataFimReceber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize: 10, color: T.muted, fontWeight: 700,
              textTransform: "uppercase", marginBottom: 6, display: "block"
            }}>Status</label>
            <select
              style={{ ...selectStyle, width: 130, background: T.bg }}
              value={filtroStatusReceber}
              onChange={e => setFiltroStatusReceber(e.target.value)}
            >
              <option value="TODOS">Todos Status</option>
              <option value="A RECEBER">A Receber</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="RECEBIDO">Recebido</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>

          <button onClick={loadContasReceber} style={btnPrimary}>
            <Filter size={14} /> Filtrar
          </button>

          <div style={{ position: "relative" }}>
            <input
              type="file" id="ofxUploadReceber" accept=".ofx,.pdf"
              style={{ display: "none" }} onChange={handleImportOFXReceber}
            />
            <label htmlFor="ofxUploadReceber" style={{
              ...btnPrimary, background: T.success,
              boxShadow: `0 2px 8px ${T.success}30`, cursor: "pointer"
            }}>
              <Download size={14} /> {loading ? "Importando..." : "Importar OFX"}
            </label>
          </div>

          <button
            onClick={() => {
              if (typeof loadClientes === "function") loadClientes();
              if (typeof loadEstruturaContabil === "function") loadEstruturaContabil();
              setShowAddReceberModal(true);
            }}
            style={{
              ...btnPrimary, background: T.success,
              boxShadow: `0 2px 8px ${T.success}30`
            }}
          >
            <Plus size={14} /> Novo Direito
          </button>
        </div>
      </div>

      {/* ═══ ALERTA VENCIDOS ═══ */}
      {vencidosR.length > 0 && (
        <div style={{
          background: `${T.danger}08`, border: `1px solid ${T.danger}20`,
          borderRadius: T.rS, padding: "14px 18px", borderLeft: `4px solid ${T.danger}`,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: T.rS,
            background: `${T.danger}12`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <AlertTriangle size={15} color={T.danger} />
          </div>
          <div>
            <div style={{ color: T.danger, fontWeight: 700, fontSize: 13 }}>
              Atenção: {vencidosR.length} parcela(s) vencida(s) totalizando R$ {formatBRL(totalVencidoR)}
            </div>
            <div style={{ color: T.sub, fontSize: 11, fontWeight: 500, marginTop: 2 }}>
              Ação imediata recomendada para evitar perdas.
            </div>
          </div>
        </div>
      )}

      {/* ═══ TABELA ═══ */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: T.r, overflow: "hidden", boxShadow: T.sh
      }}>
        <SectionTitle
          title="Contas a Receber & Faturas"
          icon={FileText}
          right={
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
              {totalItems} registros
            </span>
          }
        />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <TH>Vencimento</TH>
                <TH>Fatura / Título</TH>
                <TH>Descrição</TH>
                <TH>Cliente</TH>
                <TH>NF</TH>
                <TH style={{ textAlign: "center" }}>Parc.</TH>
                <TH>Valor</TH>
                <TH>Status</TH>
                {hasEditPermission && <TH style={{ textAlign: "center" }}></TH>}
              </tr>
            </thead>
            <tbody>
              {paginados.length > 0 ? paginados.map((c, idx) => {
                const atrasadoR = c.vencimento &&
                  !["RECEBIDO", "CONCILIADO"].includes(c.status) &&
                  new Date(c.vencimento + "T12:00:00Z") < hoje;
                const statusColor = getStatusColor(atrasadoR ? "ATRASADO" : c.status);

                // Build dropdown items dynamically
                const dropdownItems = [
                  {
                    label: "Editar",
                    icon: Edit2,
                    onClick: () => handleEditReceber(c)
                  }
                ];

                // Add "Baixar/Receber" only if not already received
                if (c.status !== "RECEBIDO" && c.status !== "Recebido" && c.status !== "CONCILIADO") {
                  dropdownItems.push({
                    label: "Baixar / Receber",
                    icon: DollarSign,
                    success: true,
                    onClick: () => handleBaixaReceber(c)
                  });
                }

                dropdownItems.push({ divider: true });
                dropdownItems.push({
                  label: "Excluir",
                  icon: Trash2,
                  danger: true,
                  onClick: () => handleExcluirReceber(c.id_receber, c.descricao)
                });

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${T.borderL}`,
                      background: atrasadoR ? `${T.danger}04` : "transparent",
                      transition: "background .15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = atrasadoR ? `${T.danger}08` : T.primaryLight}
                    onMouseLeave={e => e.currentTarget.style.background = atrasadoR ? `${T.danger}04` : "transparent"}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <strong style={{ color: atrasadoR ? T.danger : T.text, fontWeight: 700, fontSize: 12 }}>
                        {c.vencimento ? new Date(c.vencimento + "T12:00:00Z").toLocaleDateString("pt-BR") : "—"}
                      </strong>
                      {atrasadoR && (
                        <span style={{ display: "block", fontSize: 9, color: T.danger, fontWeight: 700, marginTop: 2 }}>
                          VENCIDO
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: T.success, fontSize: 11, fontWeight: 700, display: "block" }}>
                        {c.fatura || "REC-000"}
                      </span>
                      <span style={{ color: T.muted, fontSize: 10, fontWeight: 600 }}>
                        {c.titulo || "TIT-000"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                      <div style={{
                        whiteSpace: "nowrap", overflow: "hidden",
                        textOverflow: "ellipsis", fontWeight: 600,
                        color: T.text, fontSize: 12
                      }}>
                        {c.descricao}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: 12, color: T.sub, fontWeight: 500 }}>
                      {c.cliente || "—"}
                    </td>

                    <td style={{ padding: "12px 14px", fontSize: 11, color: T.muted, fontWeight: 600 }}>
                      {c.numero_nf || "S/N"}
                    </td>

                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span style={{
                        background: T.bg, border: `1px solid ${T.border}`,
                        padding: "3px 8px", borderRadius: T.rXs,
                        fontSize: 10, fontWeight: 700, color: T.sub
                      }}>
                        {c.parcela_atual}/{c.qtd_parcelas}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        color: atrasadoR ? T.danger : T.success,
                        fontWeight: 800, fontSize: 13
                      }}>
                        R$ {formatBRL(c.valor)}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <Badge color={statusColor}>
                        {atrasadoR || c.status === "ATRASADO"
                          ? <><AlertCircle size={9} /> ATRASADO</>
                          : <><CheckCircle2 size={9} /> {c.status}</>
                        }
                      </Badge>
                    </td>

                    {hasEditPermission && (
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <ActionDropdown items={dropdownItems} />
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td
                    colSpan={hasEditPermission ? 9 : 8}
                    style={{ padding: 60, textAlign: "center" }}
                  >
                    <div style={{
                      color: T.muted, fontSize: 13, fontWeight: 600,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 10
                    }}>
                      <Search size={32} strokeWidth={1} color={T.muted} />
                      Nenhuma conta a receber encontrada.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ FOOTER — Paginação ═══ */}
        <div style={{
          padding: "12px 22px", borderTop: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: T.card, flexWrap: "wrap", gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Exibir</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ ...selectStyle, padding: "5px 8px", fontSize: 11, minWidth: 60 }}
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={0}>Todos</option>
            </select>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>por página</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>
              {totalItems === 0 ? "0 — 0" : `${rangeStart} – ${rangeEnd}`} de {totalItems}
            </span>

            {pageSize !== 0 && totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[
                  { icon: ChevronsLeft, go: 1, disabled: safePage <= 1, title: "Primeira" },
                  { icon: ChevronLeft, go: safePage - 1, disabled: safePage <= 1, title: "Anterior" },
                  { icon: ChevronRight, go: safePage + 1, disabled: safePage >= totalPages, title: "Próxima" },
                  { icon: ChevronsRight, go: totalPages, disabled: safePage >= totalPages, title: "Última" },
                ].map((b, i) => (
                  <button
                    key={i}
                    title={b.title}
                    disabled={b.disabled}
                    onClick={() => setCurrentPage(b.go)}
                    style={{
                      width: 28, height: 28, borderRadius: T.rXs,
                      border: `1px solid ${T.border}`, background: T.card,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: b.disabled ? "not-allowed" : "pointer",
                      color: b.disabled ? T.borderL : T.sub,
                      opacity: b.disabled ? 0.5 : 1,
                      transition: "all .15s"
                    }}
                    onMouseEnter={e => {
                      if (!b.disabled) {
                        e.currentTarget.style.borderColor = T.primary;
                        e.currentTarget.style.color = T.primary;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = T.border;
                      e.currentTarget.style.color = b.disabled ? T.borderL : T.sub;
                    }}
                  >
                    <b.icon size={13} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}