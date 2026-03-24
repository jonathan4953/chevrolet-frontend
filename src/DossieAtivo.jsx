import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, CarFront, Wrench, CalendarClock, DollarSign, 
  Activity, PackageCheck, PackageMinus, MapPin, Receipt, History, Loader2
} from "lucide-react";

const C = {
  primary: "#F26B25",
  blue: "#1A73E8",
  green: "#22A06B",
  red: "#D93025",
  yellow: "#F59E0B",
  text: "#2A2B2D",
  muted: "#8E9093",
  subtle: "#636466",
  border: "#E5E7EB",
  bgAlt: "#F9FAFB"
};

// RECEBENDO O ativoId POR PROP PARA BUSCAR NO BANCO
export default function DossieAtivo({ ativoId, onBack, showToast }) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [ativo, setAtivo] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // BUSCA OS DADOS REAIS DO BANCO DE DADOS
  // ==========================================
  useEffect(() => {
    if (!ativoId) return;

    const carregarDossie = async () => {
      setLoading(true);
      try {
        // ⚠️ AJUSTE ESTA URL PARA A ROTA DA SUA API QUE RETORNA O DOSSIÊ
        const res = await fetch(`http://localhost:8000/estoque/ativos/${ativoId}/dossie`);
        if (!res.ok) throw new Error("Erro ao carregar o dossiê do ativo.");
        
        const data = await res.json();
        setAtivo(data);
      } catch (error) {
        if (showToast) showToast(error.message, "error");
        else console.error(error);
      } finally {
        setLoading(false);
      }
    };

    carregarDossie();
  }, [ativoId]);

  // ==========================================
  // FUNÇÕES DE FORMATAÇÃO E ESTILO
  // ==========================================
  const formatMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
  
  const getStatusBadge = (status) => {
    const configs = {
      "Disponível": { bg: `${C.green}15`, color: C.green },
      "Locado": { bg: `${C.blue}15`, color: C.blue },
      "Manutenção": { bg: `${C.yellow}15`, color: C.yellow },
      "Baixado": { bg: `${C.red}15`, color: C.red },
    };
    const style = configs[status] || { bg: C.bgAlt, color: C.subtle };
    return (
      <span style={{ background: style.bg, color: style.color, padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>
        {status || "Indefinido"}
      </span>
    );
  };

  const cardKPIStyle = { flex: 1, background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" };
  const tabStyle = (isActive) => ({ padding: "12px 24px", fontSize: "13px", fontWeight: "800", cursor: "pointer", borderBottom: isActive ? `3px solid ${C.primary}` : "3px solid transparent", color: isActive ? C.primary : C.subtle, background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", transition: "all 0.2s" });

  // TELA DE CARREGAMENTO ENQUANTO ESPERA A API
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: C.primary }}>
        <Loader2 className="animate-spin" size={40} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 16, fontWeight: 800, color: C.subtle }}>Carregando Dossiê do Ativo...</p>
      </div>
    );
  }

  // PREVENÇÃO CASO O ATIVO NÃO SEJA ENCONTRADO
  if (!ativo) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <h2 style={{ color: C.red }}>Ativo não encontrado.</h2>
        <button onClick={onBack} style={{ marginTop: 16, padding: "10px 20px", cursor: "pointer" }}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "system-ui, sans-serif" }}>
      
      {/* HEADER DO DOSSIÊ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "10px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.text }}>
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div style={{ width: 48, height: 48, borderRadius: "12px", background: `${C.primary}15`, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CarFront size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: "24px", color: C.text, fontWeight: 900 }}>{ativo.nome}</h2>
              {getStatusBadge(ativo.status)}
            </div>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: "14px", fontWeight: 600 }}>
              Código: <span style={{ color: C.text }}>{ativo.codigo}</span> • Placa/Serial: <span style={{ color: C.text }}>{ativo.placa_serial}</span>
            </p>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ background: "#fff", border: `1px solid ${C.border}`, padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 800, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Wrench size={16} /> Enviar Manutenção
          </button>
          <button style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`, padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 800, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <PackageMinus size={16} /> Baixar Ativo
          </button>
        </div>
      </div>

      {/* CARDS DE KPI & ROI */}
      <div style={{ display: "flex", gap: 20 }}>
        <div style={cardKPIStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.subtle, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            <DollarSign size={16} color={C.muted} /> Custo de Aquisição
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: C.text }}>
            {formatMoeda(ativo.kpis?.custo_aquisicao)}
          </div>
        </div>
        
        <div style={cardKPIStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.blue, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            <Receipt size={16} /> Receita Total (Locações)
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: C.blue }}>
            {formatMoeda(ativo.kpis?.receita_total)}
          </div>
        </div>

        <div style={cardKPIStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.red, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            <Wrench size={16} /> Custo de Manutenção
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: C.red }}>
            {formatMoeda(ativo.kpis?.custo_manutencao)}
          </div>
        </div>

        <div style={{ ...cardKPIStyle, background: (ativo.kpis?.roi_percentual > 0) ? `${C.green}05` : `${C.red}05`, borderColor: (ativo.kpis?.roi_percentual > 0) ? `${C.green}30` : `${C.red}30` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: (ativo.kpis?.roi_percentual > 0) ? C.green : C.red, fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            <Activity size={16} /> ROI (Retorno)
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: (ativo.kpis?.roi_percentual > 0) ? C.green : C.red }}>
            {ativo.kpis?.roi_percentual || 0}%
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, marginTop: 8 }}>
        <button style={tabStyle(activeTab === "resumo")} onClick={() => setActiveTab("resumo")}>Visão Geral</button>
        <button style={tabStyle(activeTab === "locacoes")} onClick={() => setActiveTab("locacoes")}>Histórico de Locações</button>
        <button style={tabStyle(activeTab === "manutencoes")} onClick={() => setActiveTab("manutencoes")}>Manutenções</button>
        <button style={tabStyle(activeTab === "historico")} onClick={() => setActiveTab("historico")}>Auditoria e Vida</button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px", minHeight: "300px" }}>
        
        {/* ABA: VISÃO GERAL */}
        {activeTab === "resumo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: C.text, fontWeight: 800 }}>Informações Cadastrais</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Categoria</span>
                <span style={{ fontSize: "14px", color: C.text, fontWeight: 600 }}>{ativo.categoria}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Data de Entrada</span>
                <span style={{ fontSize: "14px", color: C.text, fontWeight: 600 }}>{ativo.data_entrada}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "11px", color: C.muted, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Localização Atual</span>
                <span style={{ fontSize: "14px", color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color={C.primary} /> {ativo.localizacao_atual || "Estoque Central"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA: LOCAÇÕES */}
        {activeTab === "locacoes" && (
          <div>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: C.text, fontWeight: 800 }}>Contratos e Locações</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Cliente</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Período</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Valor Gerado</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(ativo.locacoes || []).map(loc => (
                  <tr key={loc.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "16px 12px", fontSize: "14px", fontWeight: 700, color: C.text }}>{loc.cliente}</td>
                    <td style={{ padding: "16px 12px", fontSize: "13px", color: C.subtle }}>{loc.inicio} até {loc.fim}</td>
                    <td style={{ padding: "16px 12px", fontSize: "14px", fontWeight: 800, color: C.blue }}>{formatMoeda(loc.valor)}</td>
                    <td style={{ padding: "16px 12px" }}>
                      <span style={{ background: loc.status === "Em andamento" ? `${C.green}15` : `${C.muted}15`, color: loc.status === "Em andamento" ? C.green : C.subtle, padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!ativo.locacoes || ativo.locacoes.length === 0) && (
                  <tr><td colSpan="4" style={{ padding: "30px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Nenhuma locação registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: MANUTENÇÕES */}
        {activeTab === "manutencoes" && (
          <div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: C.text, fontWeight: 800 }}>Ordens de Serviço (O.S.)</h3>
                <button style={{ background: C.primary, color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>+ Registrar Manutenção</button>
             </div>
             <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Data</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Tipo</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Oficina / Serviço</th>
                  <th style={{ padding: "12px", fontSize: "12px", color: C.muted, fontWeight: 800 }}>Custo</th>
                </tr>
              </thead>
              <tbody>
                {(ativo.manutencoes || []).map(man => (
                  <tr key={man.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "16px 12px", fontSize: "13px", color: C.subtle, fontWeight: 600 }}>{man.data}</td>
                    <td style={{ padding: "16px 12px" }}>
                      <span style={{ background: man.tipo === "Preventiva" ? `${C.blue}15` : `${C.red}15`, color: man.tipo === "Preventiva" ? C.blue : C.red, padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                        {man.tipo}
                      </span>
                    </td>
                    <td style={{ padding: "16px 12px", fontSize: "13px", color: C.text }}>
                      <div style={{ fontWeight: 800 }}>{man.oficina}</div>
                      <div style={{ color: C.subtle, fontSize: "12px", marginTop: 4 }}>{man.descricao}</div>
                    </td>
                    <td style={{ padding: "16px 12px", fontSize: "14px", fontWeight: 800, color: C.red }}>{formatMoeda(man.custo)}</td>
                  </tr>
                ))}
                {(!ativo.manutencoes || ativo.manutencoes.length === 0) && (
                  <tr><td colSpan="4" style={{ padding: "30px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Nenhuma manutenção registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA: HISTÓRICO / AUDITORIA */}
        {activeTab === "historico" && (
          <div>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: C.text, fontWeight: 800 }}>Linha do Tempo</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", paddingLeft: "20px" }}>
              <div style={{ position: "absolute", left: "27px", top: "10px", bottom: "10px", width: "2px", background: C.border }} />
              
              {(ativo.historico || []).map((hist) => (
                <div key={hist.id} style={{ display: "flex", gap: 20, padding: "16px 0", position: "relative" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", border: `4px solid ${C.primary}`, zIndex: 2, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>{hist.acao}</div>
                    <div style={{ fontSize: "12px", color: C.subtle, marginTop: 4, display: "flex", gap: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><CalendarClock size={12} /> {hist.data}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><History size={12} /> Feito por: {hist.usuario}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!ativo.historico || ativo.historico.length === 0) && (
                <p style={{ color: C.muted, fontSize: "13px" }}>Nenhum histórico disponível para este ativo.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}