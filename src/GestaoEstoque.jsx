import React, { useState, useEffect, useMemo, useRef } from "react";
import { api } from "./api";
import {
  Search, Package, Plus, MoreVertical, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Wrench, CheckCircle2, AlertTriangle,
  FileText, TrendingUp, DollarSign, Clock, Archive, Eye, RotateCcw,
  Trash2, Upload, X, Download, ArrowLeft, BarChart3, History,
  Activity, Box, ArrowDownToLine, ArrowUpFromLine, ClipboardList,
  Calendar, MapPin, Tag, Hash, Info, Image as ImageIcon, ChevronDown,
  Maximize2, Minimize2, Filter, TrendingDown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */
const T = {
  primary: "#F26B25", primaryDark: "#D95A1E",
  primaryLight: "rgba(242,107,37,0.08)", primaryBorder: "rgba(242,107,37,0.20)",
  success: "#22A06B", danger: "#D93025", warning: "#E8A317", info: "#1A73E8", purple: "#8B5CF6",
  text: "#0f172a", sub: "#475569", muted: "#94a3b8",
  border: "#e2e8f0", borderL: "#f1f5f9", bg: "#f8fafc", card: "#fff",
  r: "12px", rS: "8px", rXs: "6px",
  sh: "0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06)",
  shM: "0 4px 12px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.08)",
  shL: "0 10px 40px rgba(0,0,0,0.10)",
};

const STATUS_MAP = {
  DISPONIVEL: { color: T.success, label: "Disponível", icon: CheckCircle2 },
  LOCADO:     { color: T.info, label: "Locado", icon: ClipboardList },
  RESERVADO:  { color: T.primary, label: "Reservado", icon: Clock },
  MANUTENCAO: { color: T.warning, label: "Manutenção", icon: Wrench },
  INATIVO:    { color: T.muted, label: "Inativo", icon: Archive },
};

const HIST_COLORS = { ENTRADA: T.success, BAIXA: T.danger, LOCACAO_INICIO: T.info, LOCACAO_FIM: T.purple, MANUTENCAO_INICIO: T.warning, MANUTENCAO_FIM: T.success, STATUS_CHANGE: T.purple, DOCUMENTO: T.muted };
const HIST_ICONS = { ENTRADA: ArrowDownToLine, BAIXA: ArrowUpFromLine, LOCACAO_INICIO: ClipboardList, LOCACAO_FIM: CheckCircle2, MANUTENCAO_INICIO: Wrench, MANUTENCAO_FIM: CheckCircle2, STATUS_CHANGE: RotateCcw, DOCUMENTO: FileText };

const fmtCur = v => { if (v == null || isNaN(v)) return "R$ 0,00"; return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v); };
const fmtDate = d => { if (!d || d === "None") return "—"; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; } };
const fmtDateTime = d => { if (!d || d === "None") return "—"; try { return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } };

/* ═══════ ATOMS ═══════ */
function Badge({ children, color = T.muted }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${color}14`, color, border: `1px solid ${color}25`, textTransform: "uppercase" }}>{children}</span>;
}
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { color: T.muted, label: status, icon: Box };
  return <Badge color={s.color}><s.icon size={10} /> {s.label}</Badge>;
}
function KpiCard({ icon: Ic, label, value, color = T.primary, sub: subtitle }) {
  const [h, sH] = useState(false);
  return (<div onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)} style={{ background: T.card, borderRadius: T.r, padding: "16px 18px", border: `1px solid ${h ? T.primaryBorder : T.border}`, boxShadow: h ? T.shM : T.sh, transition: "all .25s", position: "relative", overflow: "hidden", minWidth: 0 }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, background: `radial-gradient(circle at top right,${color}08,transparent 70%)` }} />
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: T.rS, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic size={15} color={color} strokeWidth={1.8} /></div>
    </div>
    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-.02em", lineHeight: 1.3 }}>{value}</div>
    {subtitle && <div style={{ fontSize: 10, color: T.muted, marginTop: 4, fontWeight: 500 }}>{subtitle}</div>}
  </div>);
}
function TH({ children, style = {} }) {
  return <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", borderBottom: `2px solid ${T.border}`, background: T.card, whiteSpace: "nowrap", ...style }}>{children}</th>;
}
function SectionTitle({ title, icon: Ic, right }) {
  return (<div style={{ padding: "14px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: T.text }}>{Ic && <Ic size={16} color={T.primary} strokeWidth={1.8} />}{title}</span>{right}
  </div>);
}

/* ═══════ DROPDOWN ═══════ */
function Dropdown({ trigger, items, align = "left" }) {
  const [o, sO] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) sO(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (<div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
    <div onClick={() => sO(!o)} style={{ cursor: "pointer" }}>{trigger}</div>
    {o && (<div style={{ position: "absolute", top: "calc(100% + 6px)", [align]: 0, zIndex: 100, background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rS, boxShadow: T.shL, minWidth: 220, padding: "6px 0", animation: "fadeIn .15s ease" }}>
      {items.map((it, i) => it.divider ? <div key={i} style={{ height: 1, background: T.border, margin: "4px 0" }} /> :
        <div key={i} onClick={() => { it.onClick?.(); sO(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer", fontSize: 12, fontWeight: 500, color: it.danger ? T.danger : T.sub, background: "transparent" }}
          onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {it.icon && <it.icon size={14} />}<span style={{ flex: 1 }}>{it.label}</span>
        </div>)}
    </div>)}
  </div>);
}
function ActionDropdown({ items }) {
  return <Dropdown align="right" trigger={<div style={{ width: 30, height: 30, borderRadius: T.rXs, border: `1px solid ${T.border}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub }}><MoreVertical size={14} /></div>} items={items} />;
}

/* ═══════ DOCUMENT UPLOADER ═══════ */
function DocumentUploader({ arquivos, setArquivos, maxFiles = 5 }) {
  const ref = useRef(null);
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const novos = [];
    for (const file of files) { if (!valid.includes(file.type) || file.size > 10485760) continue; if (arquivos.length + novos.length >= maxFiles) break; novos.push({ file, name: file.name, type: file.type, size: file.size, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null }); }
    if (novos.length > 0) setArquivos(prev => [...prev, ...novos]);
    if (ref.current) ref.current.value = "";
  };
  const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  return (<div style={{ marginTop: 14 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><label style={{ fontSize: 11, color: T.sub, fontWeight: 700 }}>Documentos Comprobatórios (Opcional)</label><span style={{ fontSize: 10, color: T.muted }}>{arquivos.length}/{maxFiles}</span></div>
    <div onClick={() => arquivos.length < maxFiles && ref.current?.click()} onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.primary; }} onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.border; }} onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.border; handleFiles({ target: { files: e.dataTransfer.files } }); }} style={{ border: `2px dashed ${T.border}`, borderRadius: T.rS, padding: "16px 20px", textAlign: "center", cursor: arquivos.length < maxFiles ? "pointer" : "default", background: T.bg, opacity: arquivos.length >= maxFiles ? 0.5 : 1 }}>
      <Upload size={20} color={T.muted} style={{ marginBottom: 6, opacity: 0.5 }} /><div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{arquivos.length < maxFiles ? "Clique ou arraste imagens e PDFs" : "Limite atingido"}</div><div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>JPG, PNG, WEBP ou PDF — Máx 10MB</div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFiles} style={{ display: "none" }} />
    </div>
    {arquivos.length > 0 && (<div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
      {arquivos.map((arq, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: T.rS, background: T.card, border: `1px solid ${T.border}` }}>
        {arq.preview ? <img src={arq.preview} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: `${T.danger}08`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={16} color={T.danger} /></div>}
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arq.name}</div><div style={{ fontSize: 10, color: T.muted }}>{fmtSize(arq.size)}</div></div>
        <button onClick={e => { e.stopPropagation(); setArquivos(prev => { const u = [...prev]; if (u[i].preview) URL.revokeObjectURL(u[i].preview); u.splice(i, 1); return u; }); }} style={{ background: `${T.danger}08`, border: "none", color: T.danger, cursor: "pointer", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
      </div>))}
    </div>)}
  </div>);
}

/* ═══════ MODAL ═══════ */
function Modal({ children, onClose, maxWidth = 600 }) {
  return (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={onClose}>
    <div style={{ background: T.card, borderRadius: "16px", padding: 28, maxWidth, width: "92%", maxHeight: "88vh", overflowY: "auto", boxShadow: T.shL }} onClick={e => e.stopPropagation()}>{children}</div>
  </div>);
}

/* ═══════ UPLOAD HELPER ═══════ */
async function uploadDocumentos(arquivos, contexto, contextoId) {
  if (!arquivos || arquivos.length === 0) return [];
  const up = [];
  for (const arq of arquivos) { try { const fd = new FormData(); fd.append("file", arq.file); fd.append("contexto", contexto); fd.append("contexto_id", String(contextoId)); const r = await api.post("/ativos-module/documentos/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); up.push(r.data); } catch (e) { console.error("Upload err:", arq.name, e); } }
  return up;
}

const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: T.rS, fontSize: 13, background: T.bg, color: T.text, border: `1px solid ${T.border}`, outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 11, color: T.sub, fontWeight: 700, marginBottom: 4, display: "block" };
const btnPrimary = { padding: "10px 22px", borderRadius: T.rS, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: T.primary, color: "#fff", boxShadow: `0 2px 8px ${T.primary}30`, display: "inline-flex", alignItems: "center", gap: 6 };
const btnDanger = { padding: "8px 16px", borderRadius: T.rS, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.danger}30`, background: `${T.danger}08`, color: T.danger, display: "inline-flex", alignItems: "center", gap: 6 };
const btnSecondary = { padding: "8px 16px", borderRadius: T.rS, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}`, background: T.card, color: T.sub, display: "inline-flex", alignItems: "center", gap: 6 };

/* ═══════════════════════════════════════════════════════════
   GRÁFICO SVG PURO — Sem recharts (evita conflito React duplo)
   ═══════════════════════════════════════════════════════════ */
function SvgChart({ data, series, height = 260, type = "area", yUnit = "", showAquisicao = false, aquisicaoVal = 0 }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => { if (entries[0]) setW(entries[0].contentRect.width); });
    ro.observe(ref.current);
    setW(ref.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length === 0 || w === 0) return <div ref={ref} style={{ width: "100%", height }} />;

  const pad = { top: 20, right: 16, bottom: 40, left: 60 };
  const cw = w - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Calc max value across all series
  let allVals = [];
  series.forEach(s => data.forEach(d => { const v = d[s.key]; if (typeof v === "number") allVals.push(Math.abs(v)); }));
  if (showAquisicao && aquisicaoVal > 0) allVals.push(aquisicaoVal);
  const maxVal = Math.max(...allVals, 1);
  const minVal = series.some(s => data.some(d => d[s.key] < 0)) ? -Math.max(...data.map(d => series.reduce((m, s) => Math.max(m, Math.abs(Math.min(d[s.key] || 0, 0))), 0)), 1) : 0;
  const range = maxVal - minVal;

  const x = (i) => pad.left + (i / (data.length - 1 || 1)) * cw;
  const y = (v) => pad.top + ch - ((v - minVal) / range) * ch;

  const fmtAxis = v => { if (yUnit === "%") return `${v}%`; return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)); };

  // Y axis ticks
  const yTicks = [];
  const step = range / 4;
  for (let i = 0; i <= 4; i++) yTicks.push(minVal + step * i);

  // Build paths
  const buildPath = (key) => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key] || 0).toFixed(1)}`).join(" ");
  const buildArea = (key) => {
    const base = y(Math.max(minVal, 0));
    return buildPath(key) + ` L${x(data.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  };

  // Bar chart
  const barWidth = Math.max(cw / data.length * 0.6, 4);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg width={w} height={height} style={{ display: "block" }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} y1={y(v)} x2={w - pad.right} y2={y(v)} stroke={T.borderL} strokeDasharray="3 3" />
            <text x={pad.left - 8} y={y(v) + 3} textAnchor="end" fontSize={10} fill={T.muted}>{fmtAxis(Math.round(v))}</text>
          </g>
        ))}

        {/* X axis labels */}
        {data.map((d, i) => {
          const skip = data.length > 14 ? Math.ceil(data.length / 10) : data.length > 7 ? 2 : 1;
          if (i % skip !== 0 && i !== data.length - 1) return null;
          return <text key={i} x={type === "bar" ? pad.left + (i + 0.5) * (cw / data.length) : x(i)} y={height - 8} textAnchor="middle" fontSize={9} fill={T.muted} fontWeight={600}>{d.mes}</text>;
        })}

        {/* Aquisição reference line */}
        {showAquisicao && aquisicaoVal > 0 && (
          <g>
            <line x1={pad.left} y1={y(aquisicaoVal)} x2={w - pad.right} y2={y(aquisicaoVal)} stroke={T.primary} strokeWidth={1.5} strokeDasharray="6 3" />
            <text x={w - pad.right + 4} y={y(aquisicaoVal) - 4} fontSize={9} fill={T.primary} fontWeight={700}>Aquisição</text>
          </g>
        )}

        {/* Series rendering */}
        {type === "bar" ? (
          /* Bar chart */
          series.map(s => data.map((d, i) => {
            const bx = pad.left + i * (cw / data.length) + (cw / data.length - barWidth) / 2;
            const val = d[s.key] || 0;
            const bh = Math.max((Math.abs(val) / range) * ch, 2);
            const by = val >= 0 ? y(val) : y(0);
            return <rect key={`${s.key}-${i}`} x={bx} y={by} width={barWidth} height={bh} rx={3} fill={s.color} opacity={hover === i ? 1 : 0.85} />;
          }))
        ) : (
          /* Area + Line chart */
          series.map((s, si) => (
            <g key={s.key}>
              {s.area !== false && <path d={buildArea(s.key)} fill={s.color} opacity={0.12} />}
              <path d={buildPath(s.key)} fill="none" stroke={s.color} strokeWidth={s.dash ? 1.5 : 2} strokeDasharray={s.dash || ""} />
              {/* Dots on hover */}
              {data.map((d, i) => hover === i && (
                <circle key={i} cx={x(i)} cy={y(d[s.key] || 0)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          ))
        )}

        {/* Meta 100% line for ROI */}
        {yUnit === "%" && <line x1={pad.left} y1={y(100)} x2={w - pad.right} y2={y(100)} stroke={T.success} strokeWidth={1.5} strokeDasharray="6 3" />}

        {/* Invisible hover zones */}
        {data.map((d, i) => (
          <rect key={`h-${i}`} x={type === "bar" ? pad.left + i * (cw / data.length) : x(i) - cw / data.length / 2} y={pad.top} width={cw / data.length} height={ch}
            fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "crosshair" }} />
        ))}
      </svg>

      {/* Tooltip */}
      {hover !== null && data[hover] && (
        <div style={{
          position: "absolute", top: 10, left: Math.min(x(hover) + 12, w - 200),
          background: "#0f172a", borderRadius: 10, padding: "12px 16px", boxShadow: T.shL, minWidth: 180, zIndex: 10, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 8, borderBottom: "1px solid #334155", paddingBottom: 6 }}>{data[hover].mes}</div>
          {series.map(s => (
            <div key={s.key} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "3px 0" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>
                {yUnit === "%" ? `${data[hover][s.key]}%` : fmtCur(data[hover][s.key])}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {series.map(s => (
          <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.sub }}>
            <span style={{ width: 10, height: 3, borderRadius: 1, background: s.color, display: "inline-block" }} />{s.label}
          </span>
        ))}
        {showAquisicao && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.sub }}><span style={{ width: 10, height: 2, background: T.primary, display: "inline-block", borderTop: "1px dashed" }} />Valor Aquisição</span>}
        {yUnit === "%" && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.sub }}><span style={{ width: 10, height: 2, background: T.success, display: "inline-block", borderTop: "1px dashed" }} />Meta 100%</span>}
      </div>
    </div>
  );
}

function FinanceiroChart({ roi, ativo }) {
  const [expanded, setExpanded] = useState(false);
  const [periodo, setPeriodo] = useState("12m");
  const [chartType, setChartType] = useState("evolucao");

  const chartData = useMemo(() => {
    const mesesOp = Math.max(Math.round((roi.dias_locados || 0) / 30.44) || 1, 1);
    const vidaUtil = ativo.vida_util_meses || 60;
    const valorAq = roi.valor_aquisicao || 0;
    const depMes = roi.depreciacao_mensal || 0;
    const recMedia = roi.receita_media_mensal || 0;
    const custMedia = roi.custo_medio_mensal || 0;
    const mesesFiltro = periodo === "6m" ? 6 : periodo === "12m" ? 12 : periodo === "24m" ? 24 : vidaUtil;
    const data = [];
    let recAcum = 0, custAcum = 0;
    for (let i = 1; i <= mesesFiltro; i++) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - mesesOp + i);
      const mesLabel = dt.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      recAcum += recMedia; custAcum += custMedia;
      const depAcum = depMes * i;
      data.push({ mes: mesLabel, receita: Math.round(recAcum), custo: Math.round(custAcum), lucro: Math.round(recAcum - custAcum), depreciacao: Math.round(depAcum), valorResidual: Math.round(Math.max(valorAq - depAcum, 0)), roi: valorAq > 0 ? Math.round(((recAcum - custAcum) / valorAq) * 100) : 0, aquisicao: valorAq });
    }
    return data;
  }, [roi, ativo, periodo]);

  const seriesMap = {
    evolucao: [
      { key: "receita", label: "Receita Acum.", color: T.success },
      { key: "custo", label: "Custo Acum.", color: T.danger },
      { key: "lucro", label: "Lucro Acum.", color: T.info, area: false },
    ],
    depreciacao: [
      { key: "valorResidual", label: "Valor Residual", color: T.success },
      { key: "depreciacao", label: "Deprec. Acumulada", color: T.danger },
    ],
    roi: [
      { key: "roi", label: "ROI %", color: T.primary },
    ],
  };

  const periodBtns = [{ key: "6m", label: "6 meses" }, { key: "12m", label: "12 meses" }, { key: "24m", label: "24 meses" }, { key: "vida", label: "Vida útil" }];
  const chartTypeBtns = [{ key: "evolucao", label: "Receita vs Custo", icon: TrendingUp }, { key: "depreciacao", label: "Depreciação", icon: TrendingDown }, { key: "roi", label: "ROI Acumulado", icon: BarChart3 }];

  const kpis = [
    { l: "Deprec./Mês", v: fmtCur(roi.depreciacao_mensal), c: T.muted, ic: TrendingDown },
    { l: "Deprec. Acumulada", v: fmtCur(roi.depreciacao_acumulada), c: T.danger, ic: TrendingDown },
    { l: "Valor Residual", v: fmtCur(roi.valor_residual), c: T.success, ic: DollarSign },
    { l: "Vida Restante", v: `${Math.round(roi.vida_util_restante || 0)} meses`, c: T.purple, ic: Clock },
    { l: "ROI", v: `${roi.roi}%`, c: roi.roi >= 0 ? T.success : T.danger, ic: TrendingUp },
    { l: "Receita Total", v: fmtCur(roi.receita_total), c: T.success, ic: DollarSign },
    { l: "Custo Manutenção", v: fmtCur(roi.custo_manutencao_total), c: T.danger, ic: Wrench },
    { l: "Lucro Bruto", v: fmtCur(roi.lucro_bruto), c: roi.lucro_bruto >= 0 ? T.success : T.danger, ic: BarChart3 },
    { l: "Taxa Ocupação", v: `${roi.taxa_ocupacao}%`, c: T.primary, ic: Activity },
  ];

  const renderChart = (h) => (
    <SvgChart
      data={chartData}
      series={seriesMap[chartType]}
      height={h}
      type={chartType === "roi" ? "bar" : "area"}
      yUnit={chartType === "roi" ? "%" : ""}
      showAquisicao={chartType === "evolucao"}
      aquisicaoVal={roi.valor_aquisicao || 0}
    />
  );

  const filterBar = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {periodBtns.map(b => { const a = periodo === b.key; return <button key={b.key} onClick={() => setPeriodo(b.key)} style={{ padding: "5px 12px", borderRadius: T.rXs, border: `1px solid ${a ? T.primary : T.border}`, background: a ? `${T.primary}12` : T.card, color: a ? T.primary : T.muted, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{b.label}</button>; })}
      <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />
      {chartTypeBtns.map(b => { const a = chartType === b.key; return <button key={b.key} onClick={() => setChartType(b.key)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: T.rXs, border: `1px solid ${a ? T.info : T.border}`, background: a ? `${T.info}12` : T.card, color: a ? T.info : T.muted, fontSize: 10, fontWeight: 700, cursor: "pointer" }}><b.icon size={11} />{b.label}</button>; })}
    </div>
  );

  return (
    <div>
      {/* KPIs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: T.bg, borderRadius: T.rS, padding: "10px 12px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: T.rXs, background: `${k.c}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><k.ic size={13} color={k.c} /></div>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div><div style={{ fontSize: 13, color: k.c, fontWeight: 800, marginTop: 1 }}>{k.v}</div></div>
          </div>
        ))}
      </div>

      {/* Gráfico com filtros e botão expandir */}
      <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.border}`, boxShadow: T.sh, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          {filterBar}
          <button onClick={() => setExpanded(true)} style={{ width: 30, height: 30, borderRadius: T.rXs, border: `1px solid ${T.border}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted }} title="Expandir gráfico"><Maximize2 size={13} /></button>
        </div>
        <div style={{ padding: "16px 12px 8px" }}>
          {renderChart(260)}
        </div>
      </div>

      {/* Modal expandido */}
      {expanded && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }} onClick={() => setExpanded(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: "16px", width: "95vw", maxWidth: 1100, maxHeight: "90vh", boxShadow: T.shL, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Análise Financeira — {ativo.nome}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>ROI: {roi.roi}% | Payback: {roi.payback_atingido ? "Atingido" : roi.payback_meses ? `${roi.payback_meses} meses` : "Indefinido"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {filterBar}
                <button onClick={() => setExpanded(false)} style={{ width: 36, height: 36, borderRadius: T.rS, border: `1px solid ${T.border}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub }}><Minimize2 size={16} /></button>
              </div>
            </div>
            <div style={{ padding: "24px 20px", flex: 1, overflow: "auto" }}>
              {renderChart(450)}
              {/* KPIs no expandido */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginTop: 20 }}>
                {kpis.map((k, i) => (
                  <div key={i} style={{ background: T.bg, borderRadius: T.rS, padding: "12px 14px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.rS, background: `${k.c}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><k.ic size={14} color={k.c} /></div>
                    <div><div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>{k.l}</div><div style={{ fontSize: 15, color: k.c, fontWeight: 800, marginTop: 2 }}>{k.v}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   FICHA DO ATIVO — Tela completa ao selecionar um ativo
   Com modal de detalhamento ao clicar em etapa do histórico
   ═══════════════════════════════════════════════════════════ */
function FichaAtivo({ ativo, historico, roi, loadingHist, onBack, onStatusOM, onBaixa, onEdit, onVerDoc }) {
  const [tab, setTab] = useState("historico");
  const [detalheEvento, setDetalheEvento] = useState(null);
  const items = Array.isArray(historico) ? historico : [];
  const sc = STATUS_MAP[ativo.status] || { color: T.muted, label: ativo.status, icon: Box };

  const tabBtn = (key, label, ic) => { const a = tab === key; return (<button onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: T.rXs, border: "none", background: a ? `${T.primary}12` : "transparent", color: a ? T.primary : T.muted, fontSize: 11, fontWeight: a ? 700 : 600, cursor: "pointer" }}>{ic}{label}</button>); };

  /* Info Row helper */
  const InfoRow = ({ icon: Ic, label, value }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.borderL}` }}>
      <Ic size={13} color={T.muted} strokeWidth={1.5} />
      <span style={{ fontSize: 11, color: T.muted, minWidth: 110, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );

  /* Modal de detalhamento de evento do histórico */
  const renderDetalheEvento = () => {
    if (!detalheEvento) return null;
    const ev = detalheEvento;
    const color = HIST_COLORS[ev.tipo] || T.muted;
    const Ic = HIST_ICONS[ev.tipo] || FileText;
    const detalhes = (() => { try { const d = typeof ev.detalhes === "string" ? JSON.parse(ev.detalhes) : ev.detalhes; return d && typeof d === "object" && !Array.isArray(d) ? d : null; } catch { return null; } })();

    // Labels descritivos por tipo
    const tipoInfo = {
      ENTRADA: { titulo: "Entrada no Estoque", desc: "Registro de entrada do ativo no sistema de estoque da empresa." },
      BAIXA: { titulo: "Baixa de Estoque", desc: "O ativo foi removido do estoque operacional." },
      LOCACAO_INICIO: { titulo: "Início de Locação", desc: "O ativo foi disponibilizado para um cliente em regime de locação." },
      LOCACAO_FIM: { titulo: "Fim de Locação", desc: "O ativo foi devolvido pelo cliente e retornou ao estoque." },
      MANUTENCAO_INICIO: { titulo: "Início de Manutenção", desc: "Uma ordem de manutenção foi aberta para este ativo." },
      MANUTENCAO_FIM: { titulo: "Fim de Manutenção", desc: "A manutenção foi concluída e o ativo foi liberado." },
      STATUS_CHANGE: { titulo: "Alteração de Status", desc: "O status operacional do ativo foi alterado." },
      DOCUMENTO: { titulo: "Documento Anexado", desc: "Um documento comprobatório foi vinculado ao ativo." },
    };
    const info = tipoInfo[ev.tipo] || { titulo: ev.tipo_label || ev.tipo, desc: "" };

    return (
      <Modal onClose={() => setDetalheEvento(null)} maxWidth={580}>
        {/* Header com ícone colorido */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: T.r, background: `${color}15`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic size={20} color={color} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>{info.titulo}</h3>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{fmtDateTime(ev.data)}{ev.usuario && ` — por ${ev.usuario}`}</div>
          </div>
          <Badge color={color}>{ev.tipo_label || ev.tipo}</Badge>
        </div>

        {/* Descrição contextual */}
        {info.desc && <p style={{ fontSize: 12, color: T.sub, margin: "0 0 16px", padding: "10px 14px", background: T.bg, borderRadius: T.rS, border: `1px solid ${T.borderL}`, lineHeight: 1.6 }}>{info.desc}</p>}

        {/* Descrição do evento */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Descrição do Evento</label>
          <div style={{ padding: "12px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rS, borderLeft: `3px solid ${color}`, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
            {ev.descricao || "Sem descrição registrada."}
          </div>
        </div>

        {/* Detalhes em grid */}
        {detalhes && Object.keys(detalhes).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Informações Detalhadas</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(detalhes).map(([k, v]) => (
                <div key={k} style={{ padding: "10px 14px", borderRadius: T.rS, background: T.bg, border: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadados do evento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ padding: "10px 12px", borderRadius: T.rS, background: T.bg, border: `1px solid ${T.borderL}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>Data/Hora</div>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginTop: 3 }}>{fmtDateTime(ev.data)}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: T.rS, background: T.bg, border: `1px solid ${T.borderL}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>Responsável</div>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginTop: 3 }}>{ev.usuario || "Sistema"}</div>
          </div>
          <div style={{ padding: "10px 12px", borderRadius: T.rS, background: T.bg, border: `1px solid ${T.borderL}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>Tipo</div>
            <div style={{ fontSize: 12, color, fontWeight: 700, marginTop: 3 }}>{ev.tipo}</div>
          </div>
        </div>

        {/* Documentos anexados */}
        {ev.documentos && ev.documentos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, display: "block" }}>Documentos Comprobatórios ({ev.documentos.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ev.documentos.map((doc, j) => (
                <div key={j} onClick={() => { setDetalheEvento(null); setTimeout(() => onVerDoc?.(doc), 100); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.rS, background: `${T.info}06`, border: `1px solid ${T.info}20`, cursor: "pointer", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${T.info}12`} onMouseLeave={e => e.currentTarget.style.background = `${T.info}06`}>
                  {doc.tipo?.startsWith("image/") ? <img src={doc.url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid ${T.border}` }} /> : <div style={{ width: 40, height: 40, borderRadius: 6, background: `${T.danger}08`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={18} color={T.danger} /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nome}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{doc.tipo?.startsWith("image/") ? "Imagem" : "PDF"}</div>
                  </div>
                  <Eye size={14} color={T.info} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referência (se houver) */}
        {ev.referencia_id && (
          <div style={{ padding: "8px 12px", borderRadius: T.rXs, background: T.bg, border: `1px solid ${T.borderL}`, fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Hash size={11} /> Referência #{ev.referencia_id}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => setDetalheEvento(null)} style={btnSecondary}>Fechar</button>
        </div>
      </Modal>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header com botão voltar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: T.rS, border: `1px solid ${T.border}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, flexShrink: 0 }}><ArrowLeft size={15} /></button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>Ficha do Ativo</h2>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Gestão de Estoque — Movimentação e Histórico Completo</div>
        </div>
        <ActionDropdown items={[
          { label: "Editar Cadastro", icon: FileText, onClick: onEdit },
          { label: "Alterar Status / OM", icon: RotateCcw, onClick: onStatusOM },
          { divider: true },
          ...(ativo.status !== "INATIVO" ? [{ label: "Baixa de Estoque", icon: Trash2, danger: true, onClick: onBaixa }] : []),
        ]} />
      </div>

      {/* ═══ FICHA CADASTRAL + IMAGEM ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 20 }}>
        {/* Dados cadastrais */}
        <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.border}`, boxShadow: T.sh, overflow: "hidden" }}>
          <SectionTitle title="Dados Cadastrais" icon={ClipboardList} right={<StatusBadge status={ativo.status} />} />
          <div style={{ padding: "8px 22px 16px" }}>
            <InfoRow icon={Package} label="Nome" value={<strong style={{ color: T.text, fontWeight: 700 }}>{ativo.nome}</strong>} />
            <InfoRow icon={Tag} label="Categoria" value={ativo.categoria} />
            <InfoRow icon={Hash} label="Código Rastreio" value={<span style={{ fontFamily: "monospace", fontSize: 12 }}>{ativo.codigo_rastreio || "—"}</span>} />
            <InfoRow icon={Calendar} label="Data Aquisição" value={fmtDate(ativo.data_aquisicao)} />
            <InfoRow icon={DollarSign} label="Valor Aquisição" value={<strong style={{ color: T.info }}>{fmtCur(ativo.valor_aquisicao)}</strong>} />
            <InfoRow icon={DollarSign} label="Valor Diária" value={<strong style={{ color: T.primary }}>{fmtCur(ativo.valor_locacao_dia)}</strong>} />
            <InfoRow icon={Clock} label="Vida Útil" value={`${ativo.vida_util_meses || 60} meses`} />
            {ativo.descricao && <InfoRow icon={Info} label="Descrição" value={ativo.descricao} />}
            {ativo.observacoes && <InfoRow icon={FileText} label="Observações" value={ativo.observacoes} />}
          </div>
        </div>

        {/* Imagem + Mini KPIs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Imagem */}
          <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.border}`, boxShadow: T.sh, overflow: "hidden", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {ativo.imagem_url ? (
              <img src={ativo.imagem_url} alt={ativo.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center", color: T.muted }}>
                <ImageIcon size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 600 }}>Sem imagem</div>
              </div>
            )}
          </div>

          {/* Mini KPIs financeiros */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { l: "ROI", v: roi ? `${roi.roi}%` : "—", c: roi?.roi >= 0 ? T.success : T.danger },
              { l: "Payback", v: roi ? (roi.payback_atingido ? "Atingido" : roi.payback_meses ? `${roi.payback_meses}m` : "∞") : "—", c: roi?.payback_atingido ? T.success : T.primary },
              { l: "Receita Total", v: roi ? fmtCur(roi.receita_total) : "—", c: T.success },
              { l: "Custo Manut.", v: roi ? fmtCur(roi.custo_manutencao_total) : "—", c: T.danger },
            ].map((it, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: T.rS, padding: "10px 12px", border: `1px solid ${T.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>{it.l}</div>
                <div style={{ fontSize: 13, color: it.c, fontWeight: 800, marginTop: 2 }}>{it.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TABS: Histórico / Financeiro ═══ */}
      <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.border}`, boxShadow: T.sh, overflow: "hidden" }}>
        <div style={{ padding: "12px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 2 }}>
          {tabBtn("historico", "Movimentações e Histórico", <History size={13} />)}
          {tabBtn("financeiro", "Análise Financeira", <BarChart3 size={13} />)}
        </div>

        <div style={{ padding: 22 }}>
          {/* HISTORICO */}
          {tab === "historico" && (
            loadingHist ? <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 12 }}>Carregando histórico...</div> : (
              items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.muted }}>
                  <History size={40} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div style={{ position: "relative", paddingLeft: 32 }}>
                  <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: T.border, borderRadius: 1 }} />
                  {items.map((item, i) => {
                    const color = HIST_COLORS[item.tipo] || T.muted;
                    const Ic = HIST_ICONS[item.tipo] || FileText;
                    const detalhes = (() => { try { const d = typeof item.detalhes === "string" ? JSON.parse(item.detalhes) : item.detalhes; return d && typeof d === "object" && !Array.isArray(d) ? d : null; } catch { return null; } })();
                    return (
                      <div key={i} style={{ position: "relative", marginBottom: 20, cursor: "pointer" }} onClick={() => setDetalheEvento(item)}>
                        <div style={{ position: "absolute", left: -32, top: 4, width: 22, height: 22, borderRadius: "50%", background: `${color}15`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><Ic size={10} color={color} /></div>
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.rS, padding: "12px 16px", borderLeft: `3px solid ${color}`, transition: "box-shadow .2s, border-color .2s" }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shM; e.currentTarget.style.borderColor = `${color}40`; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div><span style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.tipo_label || item.tipo}</span>{item.usuario && <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>por {item.usuario}</span>}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{fmtDateTime(item.data)}</span>
                              <Eye size={12} color={T.muted} style={{ opacity: 0.4 }} />
                            </div>
                          </div>
                          <p style={{ fontSize: 12, color: T.sub, margin: 0, lineHeight: 1.5 }}>{item.descricao}</p>
                          {detalhes && (<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{Object.entries(detalhes).map(([k, v]) => (<div key={k} style={{ padding: "3px 8px", borderRadius: T.rXs, background: T.bg, fontSize: 10, color: T.sub, border: `1px solid ${T.borderL}` }}><span style={{ fontWeight: 700 }}>{k}:</span> {String(v)}</div>))}</div>)}
                          {item.documentos && item.documentos.length > 0 && (<div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            <FileText size={12} color={T.info} />
                            <span style={{ fontSize: 10, color: T.info, fontWeight: 600 }}>{item.documentos.length} documento{item.documentos.length > 1 ? "s" : ""} anexado{item.documentos.length > 1 ? "s" : ""}</span>
                          </div>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )
          )}

          {/* FINANCEIRO — Gráfico SVG puro */}
          {tab === "financeiro" && (
            !roi ? <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 12 }}>Dados financeiros não disponíveis</div> : (
              <FinanceiroChart roi={roi} ativo={ativo} />
            )
          )}
        </div>
      </div>

      {/* Modal de detalhamento do evento */}
      {renderDetalheEvento()}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — GestaoEstoque
   ═══════════════════════════════════════════════════════════ */
export default function GestaoEstoque({ currentUser, showToast, logAction }) {
  const [loading, setLoading] = useState(false);
  const [ativos, setAtivos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Ficha do ativo selecionado (tela completa)
  const [ativoAberto, setAtivoAberto] = useState(null);
  const [historicoAtivo, setHistoricoAtivo] = useState([]);
  const [roiAtivo, setRoiAtivo] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [documentoViewer, setDocumentoViewer] = useState(null);

  // Forms
  const [showFormAtivo, setShowFormAtivo] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState(null);
  const [formAtivo, setFormAtivo] = useState({ nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0, valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60, codigo_rastreio: "", observacoes: "", imagem_url: "" });
  const [imagemPreview, setImagemPreview] = useState(null);

  // Status / OM
  const [ativoParaStatus, setAtivoParaStatus] = useState(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [formAberturaOM, setFormAberturaOM] = useState({ tipo: "PREVENTIVA", data_inicio: new Date().toISOString().split("T")[0], descricao_problema: "", responsavel: "", custo_estimado: 0 });
  const [arquivosAberturaOM, setArquivosAberturaOM] = useState([]);
  const [formFechamentoOM, setFormFechamentoOM] = useState({ data_fim: new Date().toISOString().split("T")[0], descricao_solucao: "", responsavel: "", custo_real: 0 });
  const [arquivosFechamentoOM, setArquivosFechamentoOM] = useState([]);

  // Baixa
  const [showBaixaModal, setShowBaixaModal] = useState(null);
  const [formBaixa, setFormBaixa] = useState({ motivo: "", observacoes: "" });
  const [arquivosBaixa, setArquivosBaixa] = useState([]);

  const empresaId = currentUser?.empresa_id || 1;

  // ── Data ──
  const loadAtivos = async () => { try { const r = await api.get(`/ativos-module/ativos?empresa_id=${empresaId}`); setAtivos(r.data); } catch (e) { console.error(e); } };
  const loadCategorias = async () => { try { const r = await api.get(`/ativos-module/categorias?empresa_id=${empresaId}`); setCategorias(r.data); } catch {} };
  const loadHistorico = async (id) => { try { setLoadingHist(true); const r = await api.get(`/ativos-module/ativos/${id}/historico`); const raw = r.data; setHistoricoAtivo(Array.isArray(raw) ? raw : Array.isArray(raw?.historico) ? raw.historico : []); } catch { setHistoricoAtivo([]); } finally { setLoadingHist(false); } };
  const loadRoi = async (id) => { try { const r = await api.get(`/ativos-module/ativos/${id}/roi`); setRoiAtivo(r.data); } catch { setRoiAtivo(null); } };

  useEffect(() => { loadAtivos(); loadCategorias(); }, []);
  useEffect(() => { setCurrentPage(1); }, [filtro, filtroStatus]);

  // ── Filtered + Paginated ──
  const filtrados = useMemo(() => {
    let f = [...ativos];
    if (filtro) { const s = filtro.toLowerCase(); f = f.filter(a => a.nome?.toLowerCase().includes(s) || a.codigo_rastreio?.toLowerCase().includes(s) || a.categoria?.toLowerCase().includes(s)); }
    if (filtroStatus) f = f.filter(a => a.status === filtroStatus);
    return f;
  }, [ativos, filtro, filtroStatus]);

  const totalItems = filtrados.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginados = useMemo(() => { if (pageSize === 0) return filtrados; const start = (safePage - 1) * pageSize; return filtrados.slice(start, start + pageSize); }, [filtrados, safePage, pageSize]);
  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * (pageSize || totalItems) + 1;
  const rangeEnd = pageSize === 0 ? totalItems : Math.min(safePage * pageSize, totalItems);

  // ── Actions ──
  const handleImageUpload = (e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5242880) { showToast?.("Máximo 5MB", "error"); return; } const r = new FileReader(); r.onloadend = () => { setImagemPreview(r.result); setFormAtivo(p => ({ ...p, imagem_url: r.result })); }; r.readAsDataURL(f); };
  const resetFormAtivo = () => { setFormAtivo({ nome: "", categoria: "Geral", descricao: "", valor_aquisicao: 0, valor_locacao_dia: 0, data_aquisicao: "", vida_util_meses: 60, codigo_rastreio: "", observacoes: "", imagem_url: "" }); setImagemPreview(null); };

  const abrirFicha = async (a) => { setAtivoAberto(a); await Promise.all([loadHistorico(a.id), loadRoi(a.id)]); };
  const fecharFicha = () => { setAtivoAberto(null); setHistoricoAtivo([]); setRoiAtivo(null); };

  const editarAtivo = (a) => { setEditingAtivo(a); setFormAtivo({ nome: a.nome, categoria: a.categoria, descricao: a.descricao || "", valor_aquisicao: a.valor_aquisicao, valor_locacao_dia: a.valor_locacao_dia, data_aquisicao: a.data_aquisicao ? String(a.data_aquisicao).split("T")[0] : "", vida_util_meses: a.vida_util_meses, codigo_rastreio: a.codigo_rastreio || "", observacoes: a.observacoes || "", imagem_url: a.imagem_url || "" }); setImagemPreview(a.imagem_url || null); setShowFormAtivo(true); };

  const salvarAtivo = async () => {
    try { setLoading(true);
      if (editingAtivo) { await api.put(`/ativos-module/ativos/${editingAtivo.id}`, formAtivo); showToast?.("Ativo atualizado!", "success"); }
      else { await api.post("/ativos-module/ativos", { ...formAtivo, empresa_id: empresaId }); showToast?.("Entrada registrada!", "success"); logAction?.("Gestão Estoque", `Entrada: ${formAtivo.nome}`); }
      setShowFormAtivo(false); setEditingAtivo(null); resetFormAtivo(); loadAtivos(); loadCategorias();
      if (ativoAberto && editingAtivo?.id === ativoAberto.id) { const r = await api.get(`/ativos-module/ativos?empresa_id=${empresaId}`); const updated = r.data?.find(a => a.id === ativoAberto.id); if (updated) setAtivoAberto(updated); }
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); }
  };

  const abrirModalStatus = (a) => { setAtivoParaStatus(a); setNovoStatus(a.status); setFormAberturaOM({ tipo: "PREVENTIVA", data_inicio: new Date().toISOString().split("T")[0], descricao_problema: "", responsavel: "", custo_estimado: 0 }); setFormFechamentoOM({ data_fim: new Date().toISOString().split("T")[0], descricao_solucao: "", responsavel: "", custo_real: 0 }); setArquivosAberturaOM([]); setArquivosFechamentoOM([]); };

  const salvarNovoStatus = async () => {
    if (!ativoParaStatus) return; const sa = ativoParaStatus.status;
    try { setLoading(true);
      if (novoStatus === "MANUTENCAO" && sa !== "MANUTENCAO") { if (!formAberturaOM.descricao_problema || !formAberturaOM.responsavel) { showToast?.("Preencha Descrição e Responsável.", "warning"); setLoading(false); return; } const r = await api.post(`/ativos-module/ativos/${ativoParaStatus.id}/manutencao/iniciar`, formAberturaOM); if (arquivosAberturaOM.length > 0) await uploadDocumentos(arquivosAberturaOM, "manutencao_abertura", r.data?.manutencao_id || r.data?.id); showToast?.("OM aberta!", "success"); }
      else if (novoStatus === "DISPONIVEL" && sa === "MANUTENCAO") { if (!formFechamentoOM.descricao_solucao || !formFechamentoOM.responsavel) { showToast?.("Preencha Solução e Responsável.", "warning"); setLoading(false); return; } const r = await api.put(`/ativos-module/ativos/${ativoParaStatus.id}/manutencao/finalizar`, formFechamentoOM); if (arquivosFechamentoOM.length > 0) await uploadDocumentos(arquivosFechamentoOM, "manutencao_fechamento", r.data?.manutencao_id || r.data?.id); showToast?.("OM finalizada!", "success"); }
      else { if (novoStatus === "LOCADO") { showToast?.("LOCADO só via módulo de Locação.", "warning"); setLoading(false); return; } await api.patch(`/ativos-module/ativos/${ativoParaStatus.id}/status`, { status: novoStatus }); showToast?.("Status atualizado!", "success"); }
      setAtivoParaStatus(null); loadAtivos();
      if (ativoAberto?.id === ativoParaStatus.id) { setTimeout(() => abrirFicha({ ...ativoParaStatus, status: novoStatus }), 300); }
    } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); }
  };

  const confirmarBaixa = async () => {
    if (!showBaixaModal || !formBaixa.motivo) { showToast?.("Informe o motivo.", "warning"); return; }
    try { setLoading(true); await api.delete(`/ativos-module/ativos/${showBaixaModal.id}`, { data: formBaixa }); if (arquivosBaixa.length > 0) await uploadDocumentos(arquivosBaixa, "baixa_estoque", showBaixaModal.id); showToast?.("Baixa realizada!", "success"); setShowBaixaModal(null); fecharFicha(); loadAtivos(); } catch (e) { showToast?.(e.response?.data?.detail || "Erro", "error"); } finally { setLoading(false); }
  };

  // ══════════════════════════════════════════════════════════
  // Se um ativo está aberto, mostra a FICHA em tela cheia
  // ══════════════════════════════════════════════════════════
  if (ativoAberto) return (
    <>
      <FichaAtivo
        ativo={ativoAberto} historico={historicoAtivo} roi={roiAtivo} loadingHist={loadingHist}
        onBack={fecharFicha}
        onEdit={() => editarAtivo(ativoAberto)}
        onStatusOM={() => abrirModalStatus(ativoAberto)}
        onBaixa={() => { setShowBaixaModal(ativoAberto); setFormBaixa({ motivo: "", observacoes: "" }); setArquivosBaixa([]); }}
        onVerDoc={doc => setDocumentoViewer(doc)}
      />
      {/* Modals rendered below */}
      {renderFormAtivoModal()}
      {renderStatusModal()}
      {renderBaixaModal()}
      {renderDocViewer()}
    </>
  );

  // ══════════════════════════════════════════════════════════
  // LISTAGEM PRINCIPAL
  // ══════════════════════════════════════════════════════════
  function renderFormAtivoModal() {
    if (!showFormAtivo) return null;
    return (<Modal onClose={() => { setShowFormAtivo(false); setImagemPreview(null); }} maxWidth={650}>
      <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>{editingAtivo ? <><FileText size={20} color={T.primary} /> Editar Ativo</> : <><ArrowDownToLine size={20} color={T.success} /> Entrada de Ativo</>}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: T.r, overflow: "hidden", border: `2px dashed ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>{imagemPreview ? <img src={imagemPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={28} color={T.muted} style={{ opacity: 0.4 }} />}</div>
        <div><label style={{ ...btnPrimary, padding: "8px 16px", fontSize: 11, cursor: "pointer" }}><Upload size={14} /> Foto<input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} /></label>{imagemPreview && <button onClick={() => { setImagemPreview(null); setFormAtivo(p => ({ ...p, imagem_url: "" })); }} style={{ fontSize: 10, color: T.danger, background: "none", border: "none", cursor: "pointer", marginTop: 4, display: "block", fontWeight: 700 }}>Remover</button>}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Nome *</label><input style={inputStyle} value={formAtivo.nome} onChange={e => setFormAtivo({ ...formAtivo, nome: e.target.value })} /></div>
        <div><label style={labelStyle}>Categoria</label><input style={inputStyle} value={formAtivo.categoria} onChange={e => setFormAtivo({ ...formAtivo, categoria: e.target.value })} list="cat-list" /><datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist></div>
        <div><label style={labelStyle}>Data Aquisição</label><input style={inputStyle} type="date" value={formAtivo.data_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, data_aquisicao: e.target.value })} /></div>
        <div><label style={labelStyle}>Valor Aquisição (R$)</label><input style={inputStyle} type="number" step="0.01" value={formAtivo.valor_aquisicao} onChange={e => setFormAtivo({ ...formAtivo, valor_aquisicao: parseFloat(e.target.value) || 0 })} /></div>
        <div><label style={labelStyle}>Diária (R$)</label><input style={inputStyle} type="number" step="0.01" value={formAtivo.valor_locacao_dia} onChange={e => setFormAtivo({ ...formAtivo, valor_locacao_dia: parseFloat(e.target.value) || 0 })} /></div>
        <div><label style={labelStyle}>Vida Útil (meses)</label><input style={inputStyle} type="number" value={formAtivo.vida_util_meses} onChange={e => setFormAtivo({ ...formAtivo, vida_util_meses: parseInt(e.target.value) || 60 })} /></div>
        <div><label style={labelStyle}>Código Rastreio</label><input style={inputStyle} value={formAtivo.codigo_rastreio} onChange={e => setFormAtivo({ ...formAtivo, codigo_rastreio: e.target.value })} /></div>
        <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Descrição</label><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={formAtivo.descricao} onChange={e => setFormAtivo({ ...formAtivo, descricao: e.target.value })} /></div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
        <button onClick={() => { setShowFormAtivo(false); setEditingAtivo(null); setImagemPreview(null); }} style={btnSecondary}>Cancelar</button>
        <button onClick={salvarAtivo} disabled={loading || !formAtivo.nome} style={{ ...btnPrimary, opacity: loading || !formAtivo.nome ? 0.5 : 1 }}>{loading ? "Salvando..." : editingAtivo ? "Atualizar" : "Registrar Entrada"}</button>
      </div>
    </Modal>);
  }

  function renderStatusModal() {
    if (!ativoParaStatus) return null;
    return (<Modal onClose={() => { setAtivoParaStatus(null); setArquivosAberturaOM([]); setArquivosFechamentoOM([]); }} maxWidth={550}>
      <h3 style={{ color: T.text, fontSize: 18, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><RotateCcw size={20} color={T.primary} /> Status: <span style={{ color: STATUS_MAP[ativoParaStatus.status]?.color }}>{ativoParaStatus.nome}</span></h3>
      <label style={labelStyle}>Novo status:</label>
      <select style={{ ...inputStyle, marginBottom: 20, fontSize: 14, fontWeight: 700 }} value={novoStatus} onChange={e => setNovoStatus(e.target.value)}>
        <option value={ativoParaStatus.status} disabled>Selecione...</option>
        {ativoParaStatus.status !== "DISPONIVEL" && <option value="DISPONIVEL">Disponível</option>}
        {ativoParaStatus.status !== "MANUTENCAO" && <option value="MANUTENCAO">Manutenção (OM)</option>}
        {ativoParaStatus.status !== "RESERVADO" && <option value="RESERVADO">Reservado</option>}
        {ativoParaStatus.status !== "INATIVO" && <option value="INATIVO">Inativo</option>}
      </select>
      {novoStatus === "MANUTENCAO" && ativoParaStatus.status !== "MANUTENCAO" && (<div style={{ background: `${T.warning}08`, border: `1px solid ${T.warning}30`, borderRadius: T.r, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: T.warning, margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={16} /> Abertura de OM</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Tipo</label><select style={inputStyle} value={formAberturaOM.tipo} onChange={e => setFormAberturaOM({ ...formAberturaOM, tipo: e.target.value })}><option value="PREVENTIVA">Preventiva</option><option value="CORRETIVA">Corretiva</option><option value="EMERGENCIAL">Emergencial</option></select></div>
          <div><label style={labelStyle}>Data Início</label><input style={inputStyle} type="date" value={formAberturaOM.data_inicio} onChange={e => setFormAberturaOM({ ...formAberturaOM, data_inicio: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Responsável *</label><input style={inputStyle} placeholder="Ex: Oficina do João" value={formAberturaOM.responsavel} onChange={e => setFormAberturaOM({ ...formAberturaOM, responsavel: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Problema *</label><textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="O que aconteceu?" value={formAberturaOM.descricao_problema} onChange={e => setFormAberturaOM({ ...formAberturaOM, descricao_problema: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Custo Estimado (R$)</label><input style={inputStyle} type="number" step="0.01" value={formAberturaOM.custo_estimado} onChange={e => setFormAberturaOM({ ...formAberturaOM, custo_estimado: parseFloat(e.target.value) || 0 })} /></div>
        </div>
        <DocumentUploader arquivos={arquivosAberturaOM} setArquivos={setArquivosAberturaOM} />
      </div>)}
      {novoStatus === "DISPONIVEL" && ativoParaStatus.status === "MANUTENCAO" && (<div style={{ background: `${T.success}08`, border: `1px solid ${T.success}30`, borderRadius: T.r, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: T.success, margin: "0 0 16px 0", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={16} /> Finalizar OM</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Data Conclusão</label><input style={inputStyle} type="date" value={formFechamentoOM.data_fim} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, data_fim: e.target.value })} /></div>
          <div><label style={labelStyle}>Custo Real (R$)</label><input style={inputStyle} type="number" step="0.01" value={formFechamentoOM.custo_real} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, custo_real: parseFloat(e.target.value) || 0 })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Responsável *</label><input style={inputStyle} placeholder="Quem fez?" value={formFechamentoOM.responsavel} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, responsavel: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Solução *</label><textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="O que foi feito?" value={formFechamentoOM.descricao_solucao} onChange={e => setFormFechamentoOM({ ...formFechamentoOM, descricao_solucao: e.target.value })} /></div>
        </div>
        <DocumentUploader arquivos={arquivosFechamentoOM} setArquivos={setArquivosFechamentoOM} />
      </div>)}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <button onClick={() => { setAtivoParaStatus(null); }} style={btnSecondary}>Cancelar</button>
        <button onClick={salvarNovoStatus} disabled={loading || novoStatus === ativoParaStatus.status} style={{ ...btnPrimary, opacity: (loading || novoStatus === ativoParaStatus.status) ? 0.5 : 1 }}>{loading ? "Processando..." : novoStatus === "MANUTENCAO" ? "Abrir OM" : novoStatus === "DISPONIVEL" && ativoParaStatus.status === "MANUTENCAO" ? "Finalizar OM" : "Confirmar"}</button>
      </div>
    </Modal>);
  }

  function renderBaixaModal() {
    if (!showBaixaModal) return null;
    return (<Modal onClose={() => { setShowBaixaModal(null); setArquivosBaixa([]); }} maxWidth={500}>
      <h3 style={{ color: T.danger, fontSize: 18, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><ArrowUpFromLine size={20} /> Baixa de Estoque</h3>
      <p style={{ fontSize: 12, color: T.sub, marginBottom: 20 }}>Ativo: <strong style={{ color: T.text }}>{showBaixaModal.nome}</strong></p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label style={labelStyle}>Motivo *</label><select style={inputStyle} value={formBaixa.motivo} onChange={e => setFormBaixa({ ...formBaixa, motivo: e.target.value })}><option value="">Selecione...</option><option value="DESGASTE_NATURAL">Desgaste Natural</option><option value="QUEBRA_IRREPARAVEL">Quebra Irreparável</option><option value="VENDA">Venda</option><option value="PERDA_ROUBO">Perda / Roubo</option><option value="OBSOLESCENCIA">Obsolescência</option><option value="DOACAO">Doação</option><option value="OUTRO">Outro</option></select></div>
        <div><label style={labelStyle}>Observações</label><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={formBaixa.observacoes} onChange={e => setFormBaixa({ ...formBaixa, observacoes: e.target.value })} /></div>
        <DocumentUploader arquivos={arquivosBaixa} setArquivos={setArquivosBaixa} />
      </div>
      <div style={{ background: `${T.danger}08`, border: `1px solid ${T.danger}20`, borderRadius: T.rS, padding: 12, marginTop: 20, fontSize: 11, color: T.danger, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /><span>O ativo será marcado como <strong>INATIVO</strong> permanentemente.</span></div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
        <button onClick={() => { setShowBaixaModal(null); setArquivosBaixa([]); }} style={btnSecondary}>Cancelar</button>
        <button onClick={confirmarBaixa} disabled={loading || !formBaixa.motivo} style={{ ...btnPrimary, background: (!loading && formBaixa.motivo) ? T.danger : `${T.danger}50`, boxShadow: "none" }}>{loading ? "Processando..." : "Confirmar Baixa"}</button>
      </div>
    </Modal>);
  }

  function renderDocViewer() {
    if (!documentoViewer) return null;
    return (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setDocumentoViewer(null)}>
      <div style={{ background: T.card, borderRadius: "16px", maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", boxShadow: T.shL, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{documentoViewer.nome}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {documentoViewer.url && <a href={documentoViewer.url} target="_blank" rel="noopener noreferrer" download style={{ ...btnSecondary, textDecoration: "none", padding: "6px 12px", fontSize: 11 }}><Download size={12} /> Download</a>}
            <button onClick={() => setDocumentoViewer(null)} style={{ background: `${T.danger}08`, border: `1px solid ${T.danger}20`, color: T.danger, borderRadius: T.rXs, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          </div>
        </div>
        <div style={{ padding: 20, overflow: "auto", maxHeight: "80vh" }}>
          {(documentoViewer.tipo?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(documentoViewer.url || "")) && <img src={documentoViewer.url} alt={documentoViewer.nome} style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: T.rS, display: "block", margin: "0 auto" }} />}
          {(documentoViewer.tipo === "application/pdf" || /\.pdf$/i.test(documentoViewer.url || "")) && <iframe src={documentoViewer.url} title={documentoViewer.nome} style={{ width: "100%", minWidth: 500, height: "75vh", border: "none", borderRadius: T.rS }} />}
        </div>
      </div>
    </div>);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans','Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ═══ KPI STATUS CARDS ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
        {Object.entries(STATUS_MAP).map(([st, sc]) => {
          const cnt = ativos.filter(a => a.status === st).length;
          const isActive = filtroStatus === st;
          return (<div key={st} onClick={() => setFiltroStatus(isActive ? "" : st)} style={{ background: T.card, borderRadius: T.r, padding: "14px 18px", border: `1px solid ${isActive ? sc.color : T.border}`, boxShadow: isActive ? T.shM : T.sh, cursor: "pointer", transition: "all .2s", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right,${sc.color}10,transparent 70%)` }} />
            <div style={{ width: 28, height: 28, borderRadius: T.rXs, background: `${sc.color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><sc.icon size={14} color={sc.color} strokeWidth={1.8} /></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{cnt}</div>
            <div style={{ fontSize: 10, color: sc.color, fontWeight: 700, textTransform: "uppercase" }}>{sc.label}</div>
          </div>);
        })}
      </div>

      {/* ═══ FILTROS ═══ */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "18px 22px", boxShadow: T.sh }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 250px" }}>
            <label style={labelStyle}>Pesquisar</label>
            <div style={{ position: "relative" }}><Search size={14} color={T.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} /><input style={{ ...inputStyle, paddingLeft: 32 }} placeholder="Nome, código, categoria..." value={filtro} onChange={e => setFiltro(e.target.value)} /></div>
          </div>
          <div><label style={labelStyle}>Status</label><select style={{ ...inputStyle, width: 150, cursor: "pointer" }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="">Todos Status</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <button onClick={() => { resetFormAtivo(); setEditingAtivo(null); setShowFormAtivo(true); }} style={btnPrimary}><Plus size={14} /> Entrada de Ativo</button>
        </div>
      </div>

      {/* ═══ TABELA ═══ */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.r, overflow: "hidden", boxShadow: T.sh }}>
        <SectionTitle title="Estoque de Ativos" icon={Package} right={<span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{totalItems} ativos</span>} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr><TH style={{ width: 50 }}></TH><TH>Nome</TH><TH>Categoria</TH><TH>Código</TH><TH>Status</TH><TH>Dt. Aquisição</TH><TH>Valor Aquisição</TH><TH style={{ textAlign: "center" }}></TH></tr></thead>
            <tbody>
              {paginados.length > 0 ? paginados.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${T.borderL}`, cursor: "pointer", transition: "background .15s" }} onClick={() => abrirFicha(a)} onMouseEnter={e => e.currentTarget.style.background = T.primaryLight} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "8px 14px" }}>{a.imagem_url ? <img src={a.imagem_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={16} color={T.muted} /></div>}</td>
                  <td style={{ padding: "8px 14px", fontWeight: 700, color: T.text }}>{a.nome}</td>
                  <td style={{ padding: "8px 14px", color: T.sub, fontWeight: 500 }}>{a.categoria}</td>
                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: T.muted }}>{a.codigo_rastreio || "—"}</td>
                  <td style={{ padding: "8px 14px" }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: "8px 14px", color: T.sub }}>{fmtDate(a.data_aquisicao)}</td>
                  <td style={{ padding: "8px 14px", fontWeight: 700, color: T.text }}>{fmtCur(a.valor_aquisicao)}</td>
                  <td style={{ padding: "8px 14px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <ActionDropdown items={[
                      { label: "Abrir Ficha", icon: Eye, onClick: () => abrirFicha(a) },
                      { label: "Editar Ativo", icon: FileText, onClick: () => editarAtivo(a) },
                      { label: "Alterar Status / OM", icon: RotateCcw, onClick: () => abrirModalStatus(a) },
                      { divider: true },
                      ...(a.status !== "INATIVO" ? [{ label: "Baixa de Estoque", icon: Trash2, danger: true, onClick: () => { setShowBaixaModal(a); setFormBaixa({ motivo: "", observacoes: "" }); setArquivosBaixa([]); } }] : []),
                    ]} />
                  </td>
                </tr>
              )) : (<tr><td colSpan={8} style={{ padding: 60, textAlign: "center" }}><div style={{ color: T.muted, fontSize: 13, fontWeight: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}><Package size={32} strokeWidth={1} color={T.muted} />Nenhum ativo encontrado.</div></td></tr>)}
            </tbody>
          </table>
        </div>
        {/* Paginação */}
        <div style={{ padding: "12px 22px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Exibir</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ ...inputStyle, padding: "5px 8px", fontSize: 11, minWidth: 60, width: "auto", cursor: "pointer" }}><option value={10}>10</option><option value={30}>30</option><option value={50}>50</option><option value={0}>Todos</option></select>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>por página</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{totalItems === 0 ? "0 — 0" : `${rangeStart} – ${rangeEnd}`} de {totalItems}</span>
            {pageSize !== 0 && totalPages > 1 && (<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[{ icon: ChevronsLeft, go: 1, d: safePage <= 1 }, { icon: ChevronLeft, go: safePage - 1, d: safePage <= 1 }, { icon: ChevronRight, go: safePage + 1, d: safePage >= totalPages }, { icon: ChevronsRight, go: totalPages, d: safePage >= totalPages }].map((b, i) => (
                <button key={i} disabled={b.d} onClick={() => setCurrentPage(b.go)} style={{ width: 28, height: 28, borderRadius: T.rXs, border: `1px solid ${T.border}`, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: b.d ? "not-allowed" : "pointer", color: b.d ? T.borderL : T.sub, opacity: b.d ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!b.d) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; } }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = b.d ? T.borderL : T.sub; }}><b.icon size={13} /></button>
              ))}
            </div>)}
          </div>
        </div>
      </div>

      {renderFormAtivoModal()}
      {renderStatusModal()}
      {renderBaixaModal()}
      {renderDocViewer()}
    </div>
  );
}