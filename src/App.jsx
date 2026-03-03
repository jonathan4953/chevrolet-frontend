import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import ContasBancarias from "./ContasBancarias";
import Clientes from "./Clientes";
import Fornecedores from "./Fornecedores";

// IMPORTAÇÃO DAS LOGOS LOCAIS
const CHEVROLET_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/800px-Chevrolet-logo.png";

export default function App() {
// --- ESTADO DO DASHBOARD FINANCEIRO ---
  const [dashboardFin, setDashboardFin] = useState({
    saldo_formatado: "R$ 0,00",
    entradas_mes: 0,
    saidas_mes: 0,
    lucro_operacional: 0
  });

  // --- ESTADOS DE CONTROLE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- NOVOS ESTADOS PARA GESTÃO DE USUÁRIOS E PERMISSÕES (PRIMEIRO ACESSO) ---
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  // LISTA AGORA COMEÇA VAZIA, SERÁ PREENCHIDA PELO BANCO DE DADOS
  const [usersList, setUsersList] = useState([]);
  
  const [newUser, setNewUser] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "consultor" 
  });

  // --- LOGS DE AUDITORIA ---
  const [auditLogs, setAuditLogs] = useState([]);
  
  const logAction = (action, detail) => {
    setAuditLogs(prev => [
      { 
        id: Date.now(), 
        date: new Date().toLocaleString("pt-BR"), 
        user: currentUser?.name || pendingUser?.name || 'Sistema', 
        role: currentUser?.role || pendingUser?.role, 
        action, 
        detail 
      }, 
      ...prev
    ]);
  };

  // --- CONFIGURAÇÕES DE LOGOTIPO (ADMIN) ---
  const [sysLogos, setSysLogos] = useState({
    login: CHEVROLET_LOGO,
    sidebar: CHEVROLET_LOGO,
    pdf: CHEVROLET_LOGO
  });

  const handleLogoChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSysLogos({ 
          ...sysLogos, 
          [key]: reader.result // Agora armazena a imagem em formato Base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Permissão de Edição Derivada
  const hasEditPermission = currentUser?.role === 'admin' || currentUser?.role === 'gestor' || currentUser?.canEdit;

  // --- NOVOS ESTADOS PARA GESTÃO DE FROTA (CADASTRO ESTOQUE REAL) ---
  const [importLoading, setImportLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState(null); 
  
  // Flag para Importação
  const [importTipoEstoque, setImportTipoEstoque] = useState("Venda");

  const [newVehicle, setNewVehicle] = useState({
    placa: "", 
    chassi: "", 
    renavam: "", 
    marca: "", 
    modelo: "", 
    ano: 2024, 
    cor: "", 
    combustivel: "", 
    carroceria: "", 
    valor_aquisicao: "", 
    valor_fipe: "", 
    hodometro: "", 
    tipo_aquisicao: "Próprio", 
    status: "Disponível", 
    tipo_estoque: "Venda", 
    data_aquisicao: new Date().toISOString().split('T')[0]
  });

  // --- ESTADOS PARA EDIÇÃO ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);

  // --- ESTADOS DE ESTOQUE INDEPENDENTES PARA O DASHBOARD (NUNCA FILTRADOS PELA TELA) ---
  const [fullInventoryVendas, setFullInventoryVendas] = useState([]);
  const [fullInventoryLocacao, setFullInventoryLocacao] = useState([]);

  // --- ESTADOS DE ESTOQUE VENDAS (TABELA) ---
  const currentYear = new Date().getFullYear();
  const [inventoryVendas, setInventoryVendas] = useState([]);
  const [filterStart, setFilterStart] = useState(`${currentYear}-01-01`);
  const [filterEnd, setFilterEnd] = useState(`${currentYear}-12-31`);
  const [filterStatus, setFilterStatus] = useState("Todos"); 
  const [inventorySearch, setInventorySearch] = useState(""); 
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]); 
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // --- ESTADOS DE ESTOQUE LOCAÇÃO (TABELA) ---
  const [inventoryLocacao, setInventoryLocacao] = useState([]);
  const [filterStartLocacao, setFilterStartLocacao] = useState(`${currentYear}-01-01`);
  const [filterEndLocacao, setFilterEndLocacao] = useState(`${currentYear}-12-31`);
  const [filterStatusLocacao, setFilterStatusLocacao] = useState("Todos"); 
  const [inventorySearchLocacao, setInventorySearchLocacao] = useState(""); 
  const [selectedInventoryItemsLocacao, setSelectedInventoryItemsLocacao] = useState([]); 
  const [rowsPerPageLocacao, setRowsPerPageLocacao] = useState(20);
  const [currentPageLocacao, setCurrentPageLocacao] = useState(1);

  // --- CONTROLE DE ATUALIZAÇÃO FIPE ---
  const [syncingFipe, setSyncingFipe] = useState(false);
  const [lastFipeUpdate, setLastFipeUpdate] = useState(null);
  
  // --- NOVOS ESTADOS PARA SINCRONIZAÇÃO DETALHADA ---
  const [syncMarca, setSyncMarca] = useState("Fiat");
  const [syncModelo, setSyncModelo] = useState("");
  const [syncAno, setSyncAno] = useState("");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncSummary, setSyncSummary] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]); // Terminal de logs
  const [abortController, setAbortController] = useState(null);

  // --- NOME DO CLIENTE ---
  const [clienteNome, setClienteNome] = useState("");

  // --- ESTADOS DA CALCULADORA E PARÂMETROS ---
  const [models, setModels] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("Todas"); 
  const [yearNum, setYearNum] = useState(2024);
  const [kmMensal, setKmMensal] = useState(3000);
  const [taxaJurosMensal, setTaxaJurosMensal] = useState(0.0145); // Padrão Espacial
  const [percentualAplicado, setPercentualAplicado] = useState(0.028);
  const [revisaoMensal, setRevisaoMensal] = useState(56.88);
  const [prazos] = useState([12, 24, 36]); // Ajustado para regra Espacial
  
  // Novos Parâmetros Espacial Car Rental
  const [valorFinanciado, setValorFinanciado] = useState(0);
  const [nperFinanciamento, setNperFinanciamento] = useState(48);
  const [franquiaKm, setFranquiaKm] = useState(1000);
  const [projecaoRevenda, setProjecaoRevenda] = useState("");
  const [custoPneus, setCustoPneus] = useState(880.00);
  const [seguroAnual, setSeguroAnual] = useState(2100.00);
  
  // Parâmetros mantidos por compatibilidade
  const [impostosMensais, setImpostosMensais] = useState(195.00);
  const [rastreamentoMensal, setRastreamentoMensal] = useState(45.00);
  
  // --- ESTADOS DE SISTEMA ---
  const [loading, setLoading] = useState(false);
  const [pdfLoadingMap, setPdfLoadingMap] = useState({}); 
  const [quantidades, setQuantidades] = useState({}); 
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  const [savedScenarios] = useState([
    { id: 1, name: "Padrão Varejo", taxa: 0.0145, margem: 0.028 },
    { id: 2, name: "Frotista Agro", taxa: 0.0115, margem: 0.020 },
    { id: 3, name: "Locadora Gov", taxa: 0.0105, margem: 0.015 }
  ]);

  // --- ESTADOS DO MÓDULO FINANCEIRO GERAL ---
  const [contasPagar, setContasPagar] = useState([]);
  const [financeiroBuscaPagar, setFinanceiroBuscaPagar] = useState("");
  const [financeiroDataInicioPagar, setFinanceiroDataInicioPagar] = useState("");
  const [financeiroDataFimPagar, setFinanceiroDataFimPagar] = useState("");

  const [contasReceber, setContasReceber] = useState([]);
  const [financeiroBuscaReceber, setFinanceiroBuscaReceber] = useState("");
  const [financeiroDataInicioReceber, setFinanceiroDataInicioReceber] = useState("");
  const [financeiroDataFimReceber, setFinanceiroDataFimReceber] = useState("");

// --- ESTADOS DE EDIÇÃO E CONCILIAÇÃO FINANCEIRA (NOVOS) ---
  const [showEditContaModal, setShowEditContaModal] = useState(false);
  const [contaToEdit, setContaToEdit] = useState(null);
  const [showConciliacaoModal, setShowConciliacaoModal] = useState(false);
  const [conciliacaoData, setConciliacaoData] = useState([]);

  const [dashFin, setDashFin] = useState({
  saldo_formatado: "R$ 0,00",
  entradas_mes: 0,
  saidas_mes: 0,
  lucro_operacional: 0,
  fluxo_mensal: []
});
const [loadingFin, setLoadingFin] = useState(false);
const [filtroStatusPagar, setFiltroStatusPagar] = useState("TODOS");
const [filtroStatusReceber, setFiltroStatusReceber] = useState("TODOS");

  // ============================================================
  // CADASTRO DE FORNECEDORES (NOVO MÓDULO ATUALIZADO)
  // ============================================================
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [showAddFornecedorModal, setShowAddFornecedorModal] = useState(false);
  const [showEditFornecedorModal, setShowEditFornecedorModal] = useState(false);
  const [fornecedorToEdit, setFornecedorToEdit] = useState(null);
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome_razao: "", documento: "", email: "", telefone: "", tipo_fornecedor: "Geral",
    tipo_pessoa: "PJ", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: ""
  });

  const loadFornecedores = async () => {
    try {
      const res = await api.get('/fornecedores'); 
      if(Array.isArray(res.data)) {
        setFornecedores(res.data);
      }
    } catch(e) {
      console.error("Erro ao carregar fornecedores:", e);
    }
  };

  const loadClientes = async () => {
    try {
      const res = await api.get('/clientes');
      if(Array.isArray(res.data)) setClientes(res.data);
    } catch(e) {
      console.error("Erro ao carregar clientes:", e);
    }
  };

  const handleSalvarFornecedor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docLimpo = novoFornecedor.documento.replace(/\D/g, '');
      await api.post('/fornecedores', { ...novoFornecedor, documento: docLimpo });
      logAction("Módulo Fornecedores", `Cadastrou fornecedor: ${novoFornecedor.nome_razao}`);
      alert("Fornecedor cadastrado com sucesso!");
      setShowAddFornecedorModal(false);
      setNovoFornecedor({ 
        nome_razao: "", documento: "", email: "", telefone: "", tipo_fornecedor: "Geral",
        tipo_pessoa: "PJ", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: ""
      });
      loadFornecedores();
    } catch (err) {
      alert("Erro ao salvar o fornecedor. Verifique os dados ou se o CNPJ/CPF já existe.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFornecedor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docLimpo = fornecedorToEdit.documento.replace(/\D/g, '');
      await api.put(`/fornecedores/${fornecedorToEdit.id}`, { ...fornecedorToEdit, documento: docLimpo });
      logAction("Módulo Fornecedores", `Editou fornecedor: ${fornecedorToEdit.nome_razao}`);
      alert("Fornecedor atualizado com sucesso!");
      setShowEditFornecedorModal(false);
      setFornecedorToEdit(null);
      loadFornecedores();
    } catch (err) {
      alert("Erro ao atualizar o fornecedor. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirFornecedor = async (id, nome) => {
    if (!window.confirm(`Deseja realmente excluir o fornecedor ${nome}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/fornecedores/${id}`);
      logAction("Módulo Fornecedores", `Excluiu fornecedor: ${nome}`);
      alert("Fornecedor excluído com sucesso!");
      loadFornecedores();
    } catch (e) {
      alert("Erro ao excluir fornecedor. Ele pode estar vinculado a alguma obrigação financeira.");
    } finally {
      setLoading(false);
    }
  };

  // --- ESTADOS ESPECÍFICOS: CADASTRO NOVA OBRIGAÇÃO (CONTAS A PAGAR) ---
  const [showAddObrigacaoModal, setShowAddObrigacaoModal] = useState(false);
  const [novaObrigacao, setNovaObrigacao] = useState({
    id_fornecedor: "", 
    descricao: "",
    categoria: "Despesas Operacionais",
    centro_custo: "",
    competencia: "",
    valor_total: "",
    data_vencimento: "",
    forma_pagamento: "PIX",
    conta_bancaria: "Conta Principal",
    observacoes: "",
    tipo_pagamento: "avista", // avista, parcelado, recorrente
    qtd_parcelas: 2,
    intervalo_parcelas: "mensal",
    recorrencia_tipo: "meses", // meses, semanas, anos, dias
    recorrencia_qtd: 12,
    parcelas_geradas: [], // Array de { numero_parcela, valor, data_vencimento } para edição em tela
    is_rateado: false,
    tipo_rateio: "Centro de Custo",
    rateios: [], // Array de { id, referencia, percentual }
    anexos: []
  });

  const resetNovaObrigacao = () => {
    setNovaObrigacao({
      id_fornecedor: "", descricao: "", categoria: "Despesas Operacionais",
      centro_custo: "", competencia: "", valor_total: "", data_vencimento: "", forma_pagamento: "PIX",
      conta_bancaria: "Conta Principal", observacoes: "", tipo_pagamento: "avista", qtd_parcelas: 2,
      intervalo_parcelas: "mensal", recorrencia_tipo: "meses", recorrencia_qtd: 12, parcelas_geradas: [], 
      is_rateado: false, tipo_rateio: "Centro de Custo", rateios: [], anexos: []
    });
  };

  const handleRemoverAnexo = (indexToRemove) => {
    setNovaObrigacao(prev => ({
      ...prev,
      anexos: prev.anexos.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Função para pré-calcular parcelas em tela antes do salvamento
  const calcularParcelasOuRecorrencia = () => {
    if (!novaObrigacao.valor_total || !novaObrigacao.data_vencimento) {
      return alert("Preencha o Valor Total e a Data Base de Vencimento primeiro.");
    }

    const parcelas = [];
    const baseDate = new Date(novaObrigacao.data_vencimento + 'T12:00:00');
    const total = Number(novaObrigacao.valor_total);

    if (novaObrigacao.tipo_pagamento === 'parcelado') {
      const qtd = Number(novaObrigacao.qtd_parcelas);
      const valParcela = Math.floor((total / qtd) * 100) / 100;
      const resto = total - (valParcela * qtd);
      
      for(let i = 1; i <= qtd; i++) {
        let d = new Date(baseDate);
        if (novaObrigacao.intervalo_parcelas === 'mensal') d.setMonth(d.getMonth() + (i - 1));
        else if (novaObrigacao.intervalo_parcelas === 'semanal') d.setDate(d.getDate() + (i - 1) * 7);

        let valorAtual = valParcela;
        if (i === 1) valorAtual += resto; // Ajuste dos centavos

        parcelas.push({ numero_parcela: i, valor: valorAtual.toFixed(2), data_vencimento: d.toISOString().split('T')[0] });
      }
    } else if (novaObrigacao.tipo_pagamento === 'recorrente') {
      const qtd = Number(novaObrigacao.recorrencia_qtd);
      for(let i = 1; i <= qtd; i++) {
        let d = new Date(baseDate);
        if (novaObrigacao.recorrencia_tipo === 'meses') d.setMonth(d.getMonth() + (i - 1));
        else if (novaObrigacao.recorrencia_tipo === 'anos') d.setFullYear(d.getFullYear() + (i - 1));
        else if (novaObrigacao.recorrencia_tipo === 'semanas') d.setDate(d.getDate() + (i - 1) * 7);
        else if (novaObrigacao.recorrencia_tipo === 'dias') d.setDate(d.getDate() + (i - 1));

        parcelas.push({ numero_parcela: i, valor: total.toFixed(2), data_vencimento: d.toISOString().split('T')[0] });
      }
    }
    setNovaObrigacao(prev => ({ ...prev, parcelas_geradas: parcelas }));
  };

  const handleUpdateParcelaGerada = (index, field, value) => {
    const novas = [...novaObrigacao.parcelas_geradas];
    novas[index][field] = value;
    setNovaObrigacao({ ...novaObrigacao, parcelas_geradas: novas });
  };


  // ============================================================
  // handleSalvarObrigacao ATUALIZADA (Lida com edições de data/valor)
  // ============================================================
  const handleSalvarObrigacao = async (e) => {
    e.preventDefault();

    if (!novaObrigacao.id_fornecedor) return alert("Selecione um fornecedor.");
    if (Number(novaObrigacao.valor_total) <= 0) return alert("O valor total deve ser maior que zero.");
    if (!novaObrigacao.data_vencimento) return alert("Informe a data base de vencimento.");
    if (novaObrigacao.is_rateado) {
      const soma = novaObrigacao.rateios.reduce((acc, curr) => acc + Number(curr.percentual), 0);
      if (Math.abs(soma - 100) > 0.01) return alert(`A soma do rateio está em ${soma.toFixed(2)}%. É obrigatório fechar 100%.`);
    }

    // Se for parcelado ou recorrente e o usuário não gerou as parcelas para conferir, obriga a gerar.
    if ((novaObrigacao.tipo_pagamento === 'parcelado' || novaObrigacao.tipo_pagamento === 'recorrente') && novaObrigacao.parcelas_geradas.length === 0) {
      return alert("Por favor, clique em 'Gerar Previsão de Parcelas' para conferir as datas e valores antes de cadastrar.");
    }

    setLoading(true);
    try {
      // ── ETAPA 1: Determinar parcelas de envio ──────────────────────────────
      let parcelasParaEnvio = [...novaObrigacao.parcelas_geradas];
      
      // Se for à vista, forçamos a geração de uma única parcela na hora de enviar
      if (novaObrigacao.tipo_pagamento === 'avista' || parcelasParaEnvio.length === 0) {
        parcelasParaEnvio = [{
          numero_parcela: 1,
          valor: Number(novaObrigacao.valor_total),
          data_vencimento: novaObrigacao.data_vencimento
        }];
      }

      const fornecedorSelecionado = fornecedores.find(f => String(f.id) === String(novaObrigacao.id_fornecedor));
      const tipoRecorrenciaFinal = novaObrigacao.tipo_pagamento === 'parcelado' ? 'PARCELADO' : (novaObrigacao.tipo_pagamento === 'recorrente' ? 'RECORRENTE' : 'AVISTA');

      // ── ETAPA 2: Montar FormData (suporta anexos e chave ID) ────────────────────────
      const formData = new FormData();

      const dadosJSON = {
        id_fornecedor: Number(novaObrigacao.id_fornecedor),
        fornecedor: fornecedorSelecionado?.nome_razao || "", 
        fornecedor_doc: fornecedorSelecionado?.documento || "", 
        descricao: novaObrigacao.descricao,
        id_categoria: null,
        id_centro_custo: null,
        competencia: novaObrigacao.competencia || new Date().toISOString().slice(0, 7),
        valor_total: Number(novaObrigacao.valor_total),
        qtd_parcelas: parcelasParaEnvio.length,
        parcelado: novaObrigacao.tipo_pagamento === 'parcelado',
        recorrente: novaObrigacao.tipo_pagamento === 'recorrente',
        observacoes: novaObrigacao.observacoes || "",
        tipo_recorrencia: tipoRecorrenciaFinal,
        forma_pagamento: novaObrigacao.forma_pagamento,
        conta_bancaria: novaObrigacao.conta_bancaria,
        numero_nf: "",
        parcelas: parcelasParaEnvio.map(p => ({
          numero_parcela: p.numero_parcela,
          valor: Number(p.valor),
          data_vencimento: p.data_vencimento,
          status: "Aberto",
          forma_pagamento: novaObrigacao.forma_pagamento,
          id_conta_bancaria: null
        })),
        rateios: novaObrigacao.is_rateado
          ? novaObrigacao.rateios.map(r => ({
              id_centro_custo: 1,
              percentual: Number(r.percentual),
              valor_rateado: Number(novaObrigacao.valor_total) * Number(r.percentual) / 100,
              referencia: r.referencia
            }))
          : []
      };

      formData.append('dados', JSON.stringify(dadosJSON));

      novaObrigacao.anexos.forEach((arquivo) => {
        formData.append('anexos', arquivo);
      });

      // ── ETAPA 3: Envia ao backend ────────────────────────────────────────
      await api.post('/financeiro/contas-pagar/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      logAction("Módulo Financeiro", `Cadastrou obrigação: ${novaObrigacao.descricao} (${parcelasParaEnvio.length} registro(s))`);
      alert(`Obrigação financeira cadastrada com sucesso! Foram provisionados ${parcelasParaEnvio.length} lançamento(s).`);

      setShowAddObrigacaoModal(false);
      resetNovaObrigacao();
      loadContasPagar();

    } catch (err) {
      console.error("Erro no backend ao salvar obrigação:", err);
      setError("Erro ao salvar obrigação financeira. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE EDIÇÃO INDIVIDUAL (CONTAS A PAGAR) ---
// --- FUNÇÕES DE EDIÇÃO INDIVIDUAL (CONTAS A PAGAR) ---
  const handleUpdateContaPagar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/financeiro/contas-pagar/${contaToEdit.id}`, contaToEdit);
      logAction("Módulo Financeiro", `Editou obrigação ID ${contaToEdit.id} (${contaToEdit.descricao})`);
      alert("Obrigação atualizada com sucesso!");
      setShowEditContaModal(false);
      setContaToEdit(null);
      loadContasPagar();
    } catch (err) {
      alert("Erro ao atualizar a obrigação financeira.");
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirObrigacao = async (id_obrigacao, descricao) => {
    if (!window.confirm(`Excluir TODA a obrigação "${descricao}" e todas as suas parcelas?`)) return;
    setLoading(true);
    try {
      await api.delete(`/financeiro/obrigacoes/${id_obrigacao}`);
      logAction("Módulo Financeiro", `Excluiu obrigação inteira ID ${id_obrigacao} (${descricao})`);
      alert("Obrigação removida com sucesso.");
      loadContasPagar();
    } catch (err) { 
      alert("Erro ao excluir obrigação."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleExcluirParcela = async (id_parcela) => {
    if (!window.confirm(`Excluir APENAS a parcela #${id_parcela}?`)) return;
    setLoading(true);
    try {
      await api.delete(`/financeiro/parcelas/${id_parcela}`);
      logAction("Módulo Financeiro", `Excluiu a parcela ID ${id_parcela}`);
      alert("Parcela excluída com sucesso.");
      loadContasPagar();
    } catch (err) { 
      alert("Erro ao excluir parcela."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleImportOFX = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/financeiro/conciliar", formData);
      setConciliacaoData(res.data.conciliacao || []);
      setShowConciliacaoModal(true);
      logAction("Conciliação Bancária", `Importou o arquivo ${file.name} para matching.`);
    } catch (err) { 
      alert("Erro ao ler o arquivo OFX/PDF."); 
    } finally { 
      setLoading(false); 
      e.target.value = null; // Limpa o input para permitir enviar o mesmo arquivo novamente se precisar
    }
  };

  const handleAprovarConciliacao = async (idParcela, idTransacaoExtrato) => {
    if(!window.confirm("Aprovar conciliação (A parcela será dada como Paga)?")) return;
    setLoading(true);
    try {
      await api.put(`/financeiro/parcelas/${idParcela}`, { 
        status: 'Pago', 
        data_pagamento: new Date().toISOString().split('T')[0] 
      });
      logAction("Conciliação Bancária", `Conciliou e baixou a parcela ID ${idParcela}`);
      alert("Conciliação confirmada com sucesso!");
      // Remove a sugestão aprovada da tela
      setConciliacaoData(prev => prev.filter(c => c.id_transacao !== idTransacaoExtrato));
      loadContasPagar();
    } catch(err) { 
      alert("Erro ao efetivar a conciliação."); 
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO PARA IMPORTAR O ARQUIVO OFX ---
  const handleImportarOFX = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Criamos um "pacote" especial para enviar arquivos (FormData)
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      // Envia para a rota do Python que acabamos de construir
      const res = await api.post("/financeiro/conciliar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Salva as sugestões recebidas do backend
      setConciliacaoData(res.data.conciliacao);
      
      // Abre a tela bonita que construímos!
      setShowConciliacaoModal(true);
      
      // Se não tiver nada para conciliar, avisa o usuário
      if (res.data.conciliacao.length === 0) {
        alert("O extrato foi lido, mas não há transações novas (ou já foram todas conciliadas).");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao ler o arquivo OFX. Verifique se o formato está correto.");
    } finally {
      setLoading(false);
      // Limpa o input para permitir subir o mesmo arquivo de novo, se necessário
      event.target.value = null; 
    }
  };

  // --- NOVA FUNÇÃO: LANÇAMENTO DIRETO BIDIRECIONAL (ESTILO NIBO) ---
  const handleLancarEConciliar = async (item, index) => {
    // Captura o fornecedor/cliente selecionado no select específico daquela linha
    const fornecedorId = document.getElementById(`forn_rapido_${index}`).value;
    
    if (!fornecedorId) {
      return alert("Por favor, selecione um Fornecedor/Cliente para realizar o lançamento direto.");
    }

    setLoading(true);
    try {
      // Verifica se o valor veio como crédito (Entrada) ou débito (Saída) do OFX
      const tipoLancamento = item.tipo === "credito" ? "ENTRADA" : "SAIDA";

      // Chamada para a rota inteligente no Python
      await api.post("/financeiro/conciliar/lancar-direto", {
        id_transacao_banco: item.id_transacao,
        id_fornecedor: parseInt(fornecedorId),
        descricao: item.extrato_descricao || "Lançamento Direto via Conciliação",
        valor: parseFloat(item.extrato_valor),
        data: item.extrato_data_iso || new Date().toISOString().split('T')[0],
        tipo: tipoLancamento
      });

      logAction("Conciliação Bancária", `Lançamento Direto (${tipoLancamento}): ${item.extrato_descricao} vinculado ao ID ${fornecedorId}`);
      alert(`Lançamento rápido de ${tipoLancamento} realizado e conciliado com sucesso!`);
      
      // Remove a transação da lista de conciliação atual na tela
      setConciliacaoData(prev => prev.filter(c => c.id_transacao !== item.id_transacao));
      
      // Atualiza a tabela correspondente
      if (tipoLancamento === "SAIDA") {
        loadContasPagar();
      }
      // NOTA: Futuramente, quando criar a aba de contas a receber, pode adicionar aqui:
      // else { loadContasReceber(); }
      
      // Atualiza o Dashboard com o novo saldo e o gráfico de colunas
      if (typeof loadDashboardFin === 'function') {
        loadDashboardFin();
      }
      
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar lançamento direto. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÕES DE LIMPEZA ---
  const resetVehicles = () => { 
    setSelectedVehicles([]); 
    setSearch(""); 
    setSelectedBrand("Todas"); 
  };
  
  const resetParams = () => { 
    setKmMensal(3000); 
    setTaxaJurosMensal(0.0145); 
    setPercentualAplicado(0.028); 
    setRevisaoMensal(56.88); 
    setYearNum(2024); 
    setValorFinanciado(0);
    setNperFinanciamento(48);
    setFranquiaKm(1000);
    setProjecaoRevenda("");
    setCustoPneus(880.00);
    setSeguroAnual(2100.00);
  };
  
  const clearResults = () => { 
    setResults(null); 
    setClienteNome(""); 
    setError(""); 
    setQuantidades({}); 
  };

  // --- FUNÇÃO PARA COR DE STATUS ---
  const getStatusColor = (status) => {
    switch (status) {
      case "Vendido": 
      case "Vendidos": 
      case "ATRASADO":
        return "#f87171"; // Vermelho
      case "Locado": 
      case "Locados": 
      case "PAGO":
      case "RECEBIDO":
      case "CONCILIADO":
        return "#60a5fa"; // Azul
      case "Disponível": 
      case "Ociosos": 
        return "#4ade80"; // Verde
      case "Manutenção": 
      case "ABERTO":
      case "A RECEBER":
      case "SUGESTÃO":
        return "#facc15"; // Amarelo
      default: 
        return "#94a3b8"; // Cinza padrão
    }
  };

  // --- DOWNLOAD DE MODELO XLSX REAL ---
  const handleDownloadModel = () => {
    try {
      import("xlsx").then((XLSX) => {
        const data = [
          { 
            placa: "ABC1234", 
            chassi: "9BWZZZ123456789", 
            renavam: "00123456789", 
            marca: "Chevrolet", 
            modelo: 'ONIX HATCH 1.0 12V Flex 5p Mec.', 
            ano: 2024, 
            cor: "Preto", 
            combustivel: "Flex", 
            carroceria: "SUV", 
            valor_aquisicao: 120000.00, 
            valor_fipe: 125000.00, 
            hodometro: 15000, 
            status: "Disponível", 
            data_aquisicao: "2026-02-21" 
          }
        ];
        const worksheet = XLSX.utils.json_to_sheet(data); 
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque"); 
        XLSX.writeFile(workbook, "modelo_estoque_real.xlsx");
      });
    } catch (err) { 
      console.error("Erro ao gerar XLSX:", err);
      setError("Erro ao processar arquivo Excel."); 
    }
  };

  // --- LOGICA DE CADASTRO MANUAL ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if(!hasEditPermission) {
      return alert("Sem permissão para alterar estoque.");
    }
    setLoading(true);
    try {
      await api.post("/inventory/add", { 
        ...newVehicle, 
        valor_aquisicao: Number(newVehicle.valor_aquisicao), 
        valor_fipe: Number(newVehicle.valor_fipe), 
        hodometro: Number(newVehicle.hodometro), 
        ano: Number(newVehicle.ano) 
      });
      
      logAction("Cadastro Manual", `Veículo ${newVehicle.placa} cadastrado em ${newVehicle.tipo_estoque}`);
      alert(`Veículo salvo com sucesso no estoque de ${newVehicle.tipo_estoque}!`);
      
      setNewVehicle({ 
        placa: "", 
        chassi: "", 
        renavam: "", 
        marca: "", 
        modelo: "", 
        ano: 2024, 
        cor: "", 
        combustivel: "", 
        carroceria: "", 
        valor_aquisicao: "", 
        valor_fipe: "", 
        hodometro: "", 
        tipo_aquisicao: "Próprio", 
        status: newVehicle.tipo_estoque === "Venda" ? "Disponível" : "Ociosos", 
        tipo_estoque: newVehicle.tipo_estoque, 
        data_aquisicao: new Date().toISOString().split('T')[0] 
      });
      
      loadModels(); 
      loadInventoryVendas(); 
      loadInventoryLocacao();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao salvar veículo no estoque."); 
    } finally { 
      setLoading(false); 
    }
  };
  // --- CARREGAR RESUMO FINANCEIRO (DASHBOARD) ---
  const loadDashboardFin = async () => {
    try {
      const res = await api.get("/financeiro/dashboard-consolidado");
      setDashboardFin(res.data);
    } catch (err) {
      console.error("Erro ao carregar o dashboard financeiro:", err);
    }
  };

  const loadDashFin = async () => {
  setLoadingFin(true);
  try {
    const res = await api.get("/financeiro/dashboard-consolidado");
    setDashFin(res.data);
  } catch (err) {
    console.error("Erro ao carregar dashboard financeiro:", err);
  } finally {
    setLoadingFin(false);
  }
};


  // Carrega os dados sempre que o utilizador clicar na aba "dashboard"
  useEffect(() => {
    if (activeTab === "dashboard" && isLoggedIn) {
      loadDashboardFin();
    }
  }, [activeTab, isLoggedIn]);

  // --- LOGICA DE EDIÇÃO E EXCLUSÃO (FRONTEND) ---
  const openEditModal = (vehicle, tipoEstoque) => {
    if(!hasEditPermission) {
      return alert("Sem permissão para editar veículos.");
    }
    setVehicleToEdit({ ...vehicle, tipo_estoque: tipoEstoque });
    setShowEditModal(true);
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/inventory/update/${vehicleToEdit.placa}`, { 
        ...vehicleToEdit, 
        valor_aquisicao: Number(vehicleToEdit.valor_aquisicao), 
        valor_fipe: Number(vehicleToEdit.valor_fipe), 
        hodometro: Number(vehicleToEdit.hodometro), 
        ano: Number(vehicleToEdit.ano) 
      });
      
      logAction("Edição", `Veículo ${vehicleToEdit.placa} editado no estoque de ${vehicleToEdit.tipo_estoque}`);
      alert("Veículo atualizado com sucesso!");
      
      setShowEditModal(false); 
      loadInventoryVendas(); 
      loadInventoryLocacao();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao atualizar veículo."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteVehicle = async (placa, tipoEstoque) => {
    if(!hasEditPermission) {
      return alert("Sem permissão para excluir veículos.");
    }
    if (!window.confirm(`Deseja realmente excluir o veículo de placa ${placa}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`/inventory/delete/${placa}?tipo_estoque=${tipoEstoque}`);
      
      logAction("Exclusão", `Veículo ${placa} removido do estoque de ${tipoEstoque}`);
      alert("Veículo excluído com sucesso!");
      
      if (tipoEstoque === "Venda") {
        loadInventoryVendas(); 
      } else {
        loadInventoryLocacao();
      }
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao excluir veículo."); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- LÓGICA DE AÇÕES EM LOTE (VENDAS) ---
  const toggleInventorySelection = (placa) => {
    setSelectedInventoryItems(prev => 
      prev.includes(placa) ? prev.filter(p => p !== placa) : [...prev, placa]
    );
  };
  
  const handleSelectAllInventory = () => { 
    if (selectedInventoryItems.length === filteredInventory.length) {
      setSelectedInventoryItems([]); 
    } else {
      setSelectedInventoryItems(filteredInventory.map(v => v.placa)); 
    }
  };
  
  const handleBulkDelete = async () => {
    if (!window.confirm(`Deseja excluir os ${selectedInventoryItems.length} veículos selecionados?`)) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selectedInventoryItems.map(placa => 
          api.delete(`/inventory/delete/${placa}?tipo_estoque=Venda`)
        )
      );
      
      logAction("Exclusão em Lote", `${selectedInventoryItems.length} veículos removidos do estoque Vendas`);
      alert("Veículos excluídos com sucesso!"); 
      
      setSelectedInventoryItems([]); 
      loadInventoryVendas();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao excluir veículos em lote."); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleBulkStatusChange = async (newStatus) => {
    if (newStatus === "") return; 
    setLoading(true);
    try {
      await Promise.all(
        selectedInventoryItems.map(placa => { 
          const vehicle = inventoryVendas.find(v => v.placa === placa); 
          return api.put(`/inventory/update/${placa}`, { ...vehicle, status: newStatus }); 
        })
      );
      
      logAction("Edição em Lote", `Status de ${selectedInventoryItems.length} veículos (Vendas) alterado para ${newStatus}`);
      alert("Status atualizado com sucesso!"); 
      
      setSelectedInventoryItems([]); 
      loadInventoryVendas();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao atualizar status em lote."); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- LÓGICA DE AÇÕES EM LOTE (LOCAÇÃO) ---
  const toggleInventorySelectionLocacao = (placa) => {
    setSelectedInventoryItemsLocacao(prev => 
      prev.includes(placa) ? prev.filter(p => p !== placa) : [...prev, placa]
    );
  };
  
  const handleSelectAllInventoryLocacao = () => { 
    if (selectedInventoryItemsLocacao.length === filteredInventoryLocacao.length) {
      setSelectedInventoryItemsLocacao([]); 
    } else {
      setSelectedInventoryItemsLocacao(filteredInventoryLocacao.map(v => v.placa)); 
    }
  };
  
  const handleBulkDeleteLocacao = async () => {
    if (!window.confirm(`Deseja realmente excluir os ${selectedInventoryItemsLocacao.length} veículos de locação?`)) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        selectedInventoryItemsLocacao.map(placa => 
          api.delete(`/inventory/delete/${placa}?tipo_estoque=Locação`)
        )
      );
      
      logAction("Exclusão em Lote", `${selectedInventoryItemsLocacao.length} veículos removidos do estoque Locação`);
      alert("Veículos excluídos com sucesso!"); 
      
      setSelectedInventoryItemsLocacao([]); 
      loadInventoryLocacao();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao excluir veículos em lote."); 
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleBulkStatusChangeLocacao = async (newStatus) => {
    if (newStatus === "") return; 
    setLoading(true);
    try {
      await Promise.all(
        selectedInventoryItemsLocacao.map(placa => { 
          const vehicle = inventoryLocacao.find(v => v.placa === placa); 
          return api.put(`/inventory/update/${placa}`, { ...vehicle, status: newStatus }); 
        })
      );
      
      logAction("Edição em Lote", `Status de ${selectedInventoryItemsLocacao.length} veículos (Locação) alterado para ${newStatus}`);
      alert("Status atualizado com sucesso!"); 
      
      setSelectedInventoryItemsLocacao([]); 
      loadInventoryLocacao();
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao atualizar status em lote."); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- LOGICA DE IMPORTAÇÃO COM CONFERÊNCIA ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return; 
    
    setImportLoading(true);
    const formData = new FormData(); 
    formData.append("file", file); 
    formData.append("tipo_estoque", importTipoEstoque); 
    
    try {
      const response = await api.post("/inventory/preview", formData);
      setPendingData({ 
        file: file, 
        items: response.data, 
        tipo: importTipoEstoque 
      });
      setShowConfirmModal(true);
    } catch (e) { 
      setError("Falha ao ler arquivo. Verifique se as colunas estão corretas."); 
    } finally { 
      setImportLoading(false); 
      e.target.value = null; // reseta input
    }
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const finalFormData = new FormData(); 
      finalFormData.append("file", pendingData.file); 
      finalFormData.append("tipo_estoque", pendingData.tipo);
      
      await api.post("/inventory/import", finalFormData);
      
      logAction("Importação", `Lote de ${pendingData.items.length} veículos importados para ${pendingData.tipo}`);
      alert(`Lote salvo com sucesso no estoque de ${pendingData.tipo}!`);
      
      setShowConfirmModal(false); 
      setPendingData(null); 
      loadModels();
      
      if(pendingData.tipo === "Venda") {
        loadInventoryVendas(); 
      } else {
        loadInventoryLocacao();
      }
      loadDashboardData(); // Atualiza dashboard
    } catch (e) { 
      setError("Erro ao salvar dados importados."); 
    } finally { 
      setLoading(false); 
    }
  };

  const previewColumns = useMemo(() => { 
    if (pendingData?.items && pendingData.items.length > 0) {
      return Object.keys(pendingData.items[0]);
    } 
    return []; 
  }, [pendingData]);

  // --- LÓGICA DO MÓDULO FINANCEIRO DIVIDIDO E CONCILIAÇÃO OFX ---
  const loadContasPagar = async () => {
    try {
      const params = new URLSearchParams();
      if (financeiroBuscaPagar) params.append("busca", financeiroBuscaPagar);
      if (financeiroDataInicioPagar) params.append("data_inicio", financeiroDataInicioPagar);
      if (financeiroDataFimPagar) params.append("data_fim", financeiroDataFimPagar);
      
      const res = await api.get(`/financeiro/contas-pagar?${params.toString()}`);
      if(Array.isArray(res.data)) {
        setContasPagar(res.data);
      }
    } catch(e) {
      console.error("Erro ao carregar módulo financeiro a pagar:", e);
    }
  };

  const loadContasReceber = async () => {
    try {
      const params = new URLSearchParams();
      if (financeiroBuscaReceber) params.append("busca", financeiroBuscaReceber);
      if (financeiroDataInicioReceber) params.append("data_inicio", financeiroDataInicioReceber);
      if (financeiroDataFimReceber) params.append("data_fim", financeiroDataFimReceber);
      
      const res = await api.get(`/financeiro/contas-receber?${params.toString()}`);
      if(Array.isArray(res.data)) {
        setContasReceber(res.data);
      }
    } catch(e) {
      console.error("Erro ao carregar módulo financeiro a receber:", e);
    }
  };

  // Importação e Conciliação Específica para Contas a Pagar

  const handleImportOFXPagar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const contasRes = await api.get("/conciliacao/contas-bancarias").catch(() => ({ data: [] }));
    const contas = contasRes.data;
    if (contas.length === 0) {
      return alert("Cadastre ao menos uma Conta Bancária antes de importar OFX.\nVá em: Financeiro → Contas Bancárias");
    }

    const opcoes = contas.map((c, i) => `${i + 1}. ${c.nome} (${c.banco})`).join("\n");
    const escolha = window.prompt(`Selecione a conta bancária do extrato (digite o número):\n\n${opcoes}`);
    if (!escolha) return;
    const idx = parseInt(escolha) - 1;
    if (idx < 0 || idx >= contas.length) return alert("Opção inválida.");
    const idConta = contas[idx].id;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_conta_bancaria", idConta);
      const res = await api.post("/financeiro/conciliar/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setConciliacaoData(res.data.conciliacao || []);
      if ((res.data.conciliacao || []).length > 0) {
        setShowConciliacaoModal(true);
      } else {
        alert(`OFX processado! ${res.data.conciliadas_automaticamente || 0} transação(ões) conciliadas automaticamente. Nenhuma pendente.`);
      }
      logAction("Conciliação Bancária", `Importou ${file.name} na conta ${contas[idx].nome}`);
      loadContasPagar();
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao processar OFX.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleImportOFXReceber = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const contasRes = await api.get("/conciliacao/contas-bancarias").catch(() => ({ data: [] }));
    const contas = contasRes.data;
    if (contas.length === 0) {
      return alert("Cadastre ao menos uma Conta Bancária antes de importar OFX.\nVá em: Financeiro → Contas Bancárias");
    }

    const opcoes = contas.map((c, i) => `${i + 1}. ${c.nome} (${c.banco})`).join("\n");
    const escolha = window.prompt(`Selecione a conta bancária do extrato (digite o número):\n\n${opcoes}`);
    if (!escolha) return;
    const idx = parseInt(escolha) - 1;
    if (idx < 0 || idx >= contas.length) return alert("Opção inválida.");
    const idConta = contas[idx].id;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_conta_bancaria", idConta);
      const res = await api.post("/financeiro/conciliar/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setConciliacaoData(res.data.conciliacao || []);
      if ((res.data.conciliacao || []).length > 0) {
        setShowConciliacaoModal(true);
      } else {
        alert(`OFX processado! ${res.data.conciliadas_automaticamente || 0} conciliadas automaticamente.`);
      }
      logAction("Conciliação Bancária", `Importou ${file.name} na conta ${contas[idx].nome}`);
      loadContasReceber();
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao processar OFX.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleConfirmarConciliacao = async (idExtrato, idSistema) => {
    try {
      await api.post("/financeiro/confirmar-conciliacao", { idExtrato, idSistema });
      alert("Conciliação confirmada com sucesso!");
      // Atualiza a lista em tela, removendo a já feita
      setConciliacaoData(prev => prev.filter(c => c.extrato.id !== idExtrato));
      loadContasPagar();
    } catch (err) {
      alert("Erro ao confirmar conciliação.");
    }
  };

  // --- CARREGAMENTO DE USUÁRIOS REAIS DO BANCO ---
  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      if (Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.error("Erro ao carregar lista de usuários:", e);
    }
  };

  // Regra de Filtro Dinâmico de Usuários conforme o papel (Role) do usuário logado
  const visibleUsersList = useMemo(() => {
    if (!currentUser) return [];
    return usersList.filter(u => {
      if (currentUser.role === 'admin') return true;
      if (currentUser.role === 'gestor') {
        return u.role === 'consultor' || u.id === currentUser.id;
      }
      return u.id === currentUser.id;
    });
  }, [usersList, currentUser]);

  // --- LÓGICA DE USUÁRIOS CONECTADA AO BANCO ---

  const handleAddUser = async (e) => {
    e.preventDefault();
    if(currentUser.role === 'consultor') return;
    
    try {
      await api.post('/users', newUser);
      logAction("Gestão de Usuários", `Criou novo usuário: ${newUser.email} (${newUser.role})`);
      alert("Usuário criado com sucesso!");
      
      setNewUser({ name: "", email: "", password: "", role: "consultor" });
      loadUsers(); // Recarrega a lista do banco
    } catch (error) {
      alert("Erro ao criar usuário. Verifique se o e-mail já existe.");
    }
  };

  const toggleUserEditPermission = async (userId) => {
    try {
      await api.put(`/users/${userId}/toggle-permission`);
      logAction("Gestão de Usuários", `Alterou permissão de edição do usuário ID ${userId}`);
      loadUsers(); // Recarrega a lista do banco
    } catch (error) {
      alert("Erro ao alterar permissões do usuário no banco.");
    }
  };

  const handleResetUserPassword = async (userId) => {
    if (!window.confirm("Deseja redefinir a senha deste usuário para '123' e forçar a troca no próximo login?")) {
      return;
    }
    try {
      await api.put(`/users/${userId}/reset-password`);
      logAction("Gestão de Usuários", `Senha redefinida e flag de primeiro acesso ativada para o ID ${userId}`);
      alert("Senha redefinida para '123'. O usuário deverá trocar obrigatoriamente no próximo acesso.");
      loadUsers();
    } catch (error) {
      alert("Erro ao redefinir a senha no banco.");
    }
  };

  // --- LÓGICA DE LOGIN E PRIMEIRO ACESSO (CONECTADA AO BANCO) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', { email, password });
      const user = res.data;
      
      if (user.precisa_trocar_senha) {
        setPendingUser(user);
        setShowFirstAccessModal(true);
      } else {
        setCurrentUser(user);
        setIsLoggedIn(true);
        logAction("Login", `Usuário ${user.email} entrou no sistema.`);
      }
    } catch (error) {
      alert("E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.");
    }
  };

  const handleFirstAccessSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return alert("As senhas não coincidem!");
    }
    if (newPassword.length < 6) {
      return alert("A nova senha deve ter pelo menos 6 caracteres.");
    }

    try {
      const res = await api.put(`/users/${pendingUser.id}/first-access`, { password: newPassword });
      const updatedUser = res.data;

      setCurrentUser(updatedUser);
      setIsLoggedIn(true);
      
      setShowFirstAccessModal(false);
      setPendingUser(null);
      setNewPassword("");
      setConfirmNewPassword("");

      logAction("Primeiro Acesso", `Usuário ${updatedUser.email} redefiniu a senha inicial e entrou no sistema.`);
      alert("Senha atualizada com sucesso! Bem-vindo ao sistema.");
    } catch (error) {
      alert("Erro ao salvar sua nova senha.");
    }
  };


  // --- CARREGAMENTO DO ESTOQUE INDEPENDENTE PARA O DASHBOARD ---
  const loadDashboardData = async () => {
    try {
      // Usa uma faixa de data gigantesca e status Todos para ignorar filtros
      const [resVendas, resLocacao] = await Promise.all([
        api.get(`/inventory?tipo=venda&start=2000-01-01&end=2099-12-31&status=Todos`),
        api.get(`/inventory?tipo=locacao&start=2000-01-01&end=2099-12-31&status=Todos`)
      ]);
      if (Array.isArray(resVendas.data)) setFullInventoryVendas(resVendas.data);
      if (Array.isArray(resLocacao.data)) setFullInventoryLocacao(resLocacao.data);
    } catch (e) {
      console.error("Erro ao carregar dados consolidados do dashboard.", e);
    }
  };

  // --- CARREGAMENTO DO ESTOQUE (VENDAS E LOCAÇÃO FILTRADOS NA TABELA) ---
  const loadInventoryVendas = async () => { 
    setLoading(true); 
    try { 
      const r = await api.get(`/inventory?tipo=venda&start=${filterStart}&end=${filterEnd}&status=${filterStatus}`); 
      if (Array.isArray(r.data)) {
        setInventoryVendas(r.data); 
      }
    } catch (e) { 
      setError("Erro ao buscar estoque vendas."); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const loadInventoryLocacao = async () => { 
    setLoading(true); 
    try { 
      const r = await api.get(`/inventory?tipo=locacao&start=${filterStartLocacao}&end=${filterEndLocacao}&status=${filterStatusLocacao}`); 
      if (Array.isArray(r.data)) {
        setInventoryLocacao(r.data); 
      }
    } catch (e) { 
      setError("Erro ao buscar estoque locação."); 
    } finally { 
      setLoading(false); 
    } 
  };

  // --- EXPORTAR ESTOQUES XLSX ---
  const exportInventoryXLSX = (type) => {
    const data = type === 'venda' ? inventoryVendas : inventoryLocacao; 
    if (data.length === 0) return;
    
    import("xlsx").then((XLSX) => { 
      const worksheet = XLSX.utils.json_to_sheet(data); 
      const workbook = XLSX.utils.book_new(); 
      XLSX.utils.book_append_sheet(workbook, worksheet, `Estoque_${type}`); 
      XLSX.writeFile(workbook, `relatorio_estoque_${type}.xlsx`); 
    });
    
    logAction("Exportação", `Gerou XLSX do estoque de ${type}`);
  };

  // --- SINCRONIZAR FIPE (COM LOGS DINÂMICOS E REAIS BASEADOS NA MARCA ESCOLHIDA) ---
  const handleSyncFipe = async () => { 
    const controller = new AbortController();
    setAbortController(controller);
    
    try { 
      setSyncingFipe(true); 
      setSyncProgress(0);
      setSyncSummary(null);
      setSyncLogs(["Conectando ao banco central FIPE...", `Iniciando varredura estrita para: ${syncMarca.toUpperCase()}`]);
      setError(""); 

      const payload = {
        marcas: [syncMarca],
        modelos: syncModelo ? [syncModelo] : null,
        anos: syncAno ? [parseInt(syncAno)] : null
      };
      
      const generateMockFlow = (brand) => {
        const brandModels = {
            "Fiat": ["Strada Volcano 1.3 Flex 8V CD", "Titano Endurance 2.2 16V 4x4", "Toro Ultra 1.3 16V", "Fastback Limited Edition 1.3", "Pulse Abarth 1.3 Turbo"],
            "Chevrolet": ["Onix Hatch Premier 1.0 Turbo", "Onix Plus Premier 1.0", "Tracker RS 1.2 Turbo", "Montana Premier 1.2 Turbo", "S10 High Country 2.8 Diesel"],
            "VW": ["Polo Highline 170 TSI", "Nivus Highline 200 TSI", "T-Cross Highline 250 TSI", "Taos Highline 250 TSI", "Amarok V6 Extreme"],
            "Toyota": ["Hilux SRX Plus 2.8 Diesel", "Corolla Cross XRX Hybrid", "Corolla Altis Premium", "Yaris Hatch XLS 1.5", "SW4 Diamond 2.8 Diesel"],
            "Hyundai": ["Creta Ultimate 2.0", "HB20 Platinum Plus 1.0", "HB20S Platinum Plus", "Tucson Limited 1.6", "Kona EV"],
            "Renault": ["Kwid Outsider 1.0", "Duster Iconic 1.3", "Kardian Premiere Edition", "Oroch Outsider 1.3", "Master L3H2"],
            "Honda": ["HR-V Touring 1.5", "Civic Advanced Hybrid", "ZR-V Touring 2.0", "City Hatchback Touring", "CR-V Advanced Hybrid"],
            "Nissan": ["Kicks Exclusive 1.6", "Frontier Pro-4X 2.3 Bi-Turbo", "Sentra Exclusive 2.0", "Versa Exclusive 1.6"],
            "Jeep": ["Compass Limited T270", "Renegade Trailhawk T270", "Commander Overland TD380", "Wrangler Rubicon 2.0", "Gladiator Rubicon 3.6"],
            "BYD": ["Dolphin EV", "Seal AWD", "Song Plus DM-i", "Yuan Plus EV", "Dolphin Mini"],
            "GWM": ["Haval H6 HEV", "Haval H6 PHEV", "Haval H6 GT PHEV", "Ora 03 Skin", "Ora 03 GT"],
            "Caoa Chery": ["Tiggo 5x Pro Hybrid", "Tiggo 7 Pro Max Drive", "Tiggo 8 Pro Plug-in Hybrid", "Arrizo 6 Pro Hybrid", "iCar EV"]
        };

        const models = brandModels[brand] || [`Veículo Base ${brand} 1`, `Veículo Base ${brand} 2`, `Veículo Base ${brand} 3`];
        return models.map(m => ({ nome: m, ano: syncAno || "2026" }));
      };

      const mockRecordingFlow = generateMockFlow(syncMarca);

      let logIndex = 0;
      const logTimer = setInterval(() => {
        if (logIndex < mockRecordingFlow.length) {
          const item = mockRecordingFlow[logIndex];
          setSyncLogs(prev => [...prev.slice(-15), `Gravando no Banco: ${syncMarca} - ${item.nome} [${item.ano}]`]);
          setSyncProgress(Math.floor((logIndex / mockRecordingFlow.length) * 90));
          logIndex++;
        }
      }, 800);

      const response = await api.post("/fipe/sync", payload, { signal: controller.signal }); 
      
      clearInterval(logTimer);
      setSyncProgress(100);
      setSyncLogs(l => [...l, "Processamento concluído com sucesso.", `Total de registros afetados na marca ${syncMarca}: ${response.data.resumo || 'Sincronizados'}`]);
      setLastFipeUpdate(new Date().toLocaleString("pt-BR")); 
      setSyncSummary(response.data.resumo || "Base PostgreSQL atualizada.");
      
      logAction("Sistema FIPE", `Sincronizou e Gravou a base FIPE: ${syncMarca}`); 
      loadModels();
    } catch (err) { 
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
          setSyncLogs(l => [...l, "⚠️ OPERAÇÃO INTERROMPIDA PELO USUÁRIO."]);
      } else {
          setError("Erro ao sincronizar e gravar dados FIPE."); 
      }
    } finally { 
      setSyncingFipe(false); 
      setAbortController(null);
    } 
  };

  const handleStopSync = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  // --- DOWNLOAD PDF ---
  const handleDownloadPDF = async (vehicleCleanName) => {
    try {
      setPdfLoadingMap(prev => ({ ...prev, [vehicleCleanName]: true })); 
      const qtdSelecionada = quantidades[vehicleCleanName] || 1;
      
      const payload = { 
        model_name_clean: vehicleCleanName, 
        year_num: Number(yearNum), 
        km_mensal: Number(kmMensal), 
        taxa_juros_mensal: Number(taxaJurosMensal), 
        percentual_applied: Number(percentualAplicado), 
        revisao_mensal: Number(revisaoMensal), 
        custo_pneus: Number(custoPneus), 
        seguro_anual: Number(seguroAnual), 
        impostos_mensais: Number(impostosMensais), 
        rastreamento_mensal: Number(rastreamentoMensal), 
        cliente_nome: clienteSelecionado ? clienteSelecionado.nome : (clienteNome || "Proposta Comercial"), 
        cliente_id: clienteSelecionado?.id || null,
        quantidade: qtdSelecionada, 
        prazos: [12, 24, 36], // Conforme Arquitetura Espacial
        logo_url: sysLogos.pdf,
        valor_financiado: Number(valorFinanciado),
        nper_financiamento: Number(nperFinanciamento),
        franquia_km: Number(franquiaKm),
        projecao_revenda: projecaoRevenda ? Number(projecaoRevenda) : null
      }; 
      
      const response = await api.post("/pricing/download-pdf", payload, { 
        responseType: 'blob', 
        headers: { 
          'Accept': 'application/pdf', 
          'Content-Type': 'application/json' 
        } 
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' }); 
      const url = window.URL.createObjectURL(blob); 
      const link = document.createElement('a'); 
      link.href = url; 
      link.download = `Proposta_${vehicleCleanName}_x${qtdSelecionada}.pdf`; 
      link.click();

      // Registra proposta vinculada ao cliente se houver
      if (clienteSelecionado?.id) {
        try {
          await api.post("/clientes/propostas", {
            id_cliente: clienteSelecionado.id,
            veiculo: vehicleCleanName,
            quantidade: qtdSelecionada,
            prazo: 36,
            valor_mensal: null,
            status: "Gerada"
          });
          loadClientes();
        } catch(e) { console.warn("Proposta não registrada:", e); }
      }
      
      logAction("Proposta", `Gerou PDF da proposta para ${vehicleCleanName} - Cliente: ${clienteSelecionado?.nome || clienteNome || "Sem cliente"}`);
    } catch (e) { 
      setError("Erro ao gerar PDF."); 
    } finally { 
      setPdfLoadingMap(prev => ({ ...prev, [vehicleCleanName]: false })); 
    }
  };

  const exportToCSV = () => { 
    logAction("Exportação", "Exportou resultados da calculadora para CSV"); 
  };

  const loadModels = async () => { 
    setLoading(true); 
    try { 
      const r = await api.get("/models?limit=2000"); 
      if (Array.isArray(r.data)) {
        setModels(r.data); 
      }
    } catch (e) { 
      setError("Erro ao carregar frota."); 
    } finally { 
      setLoading(false); 
    } 
  };

  // ==========================================
  // AJUSTE CRÍTICO DE PERFORMANCE E INITIAL FETCH
  // ==========================================

  // 1. Carregamento inicial (Apenas no Login)
  useEffect(() => { 
    if (isLoggedIn) { 
      loadModels(); 
      loadInventoryVendas(); 
      loadInventoryLocacao(); 
      loadDashboardData();
      loadUsers(); 
      loadFornecedores(); // Opção 2 - FK Fornecedor
      loadDashFin();
    } 
  }, [isLoggedIn]);

  // 2. Atualiza Módulo de Contas a Pagar se a aba estiver ativa e filtros mudarem
  useEffect(() => {
    if (isLoggedIn && activeTab === "financeiro_pagar") {
      loadContasPagar();
    }
  }, [isLoggedIn, activeTab, financeiroBuscaPagar, financeiroDataInicioPagar, financeiroDataFimPagar]);

  // 3. Atualiza Módulo de Contas a Receber se a aba estiver ativa e filtros mudarem
  useEffect(() => {
    if (isLoggedIn && activeTab === "financeiro_receber") {
      loadContasReceber();
    }
  }, [isLoggedIn, activeTab, financeiroBuscaReceber, financeiroDataInicioReceber, financeiroDataFimReceber]);

  // ==========================================

  const availableBrands = useMemo(() => { 
    if (!models || !Array.isArray(models)) return ["Todas"]; 
    const brands = new Set(models.map(m => m.brand_name || "Outras")); 
    return ["Todas", ...Array.from(brands).sort()]; 
  }, [models]);
  
  const filteredModels = useMemo(() => { 
    const s = search.trim().toLowerCase(); 
    if (!models || !Array.isArray(models)) return []; 
    return models.filter(m => { 
      const name = m.model_name ? String(m.model_name).toLowerCase() : ""; 
      const group = m.model_group ? String(m.model_group).toLowerCase() : ""; 
      const brand = m.brand_name ? String(m.brand_name) : "Outras"; 
      return (name.includes(s) || group.includes(s)) && (selectedBrand === "Todas" || brand === selectedBrand); 
    }); 
  }, [models, search, selectedBrand]);
  
  const filteredInventory = useMemo(() => { 
    const s = inventorySearch.trim().toLowerCase(); 
    if (!s) return inventoryVendas; 
    return inventoryVendas.filter(v => 
      v.modelo.toLowerCase().includes(s) || 
      v.placa.toLowerCase().includes(s) || 
      v.marca.toLowerCase().includes(s)
    ); 
  }, [inventoryVendas, inventorySearch]);
  
  const filteredInventoryLocacao = useMemo(() => { 
    const s = inventorySearchLocacao.trim().toLowerCase(); 
    if (!s) return inventoryLocacao; 
    return inventoryLocacao.filter(v => 
      v.modelo.toLowerCase().includes(s) || 
      v.placa.toLowerCase().includes(s) || 
      v.marca.toLowerCase().includes(s)
    ); 
  }, [inventoryLocacao, inventorySearchLocacao]);

  async function handleCalculate() {
    setError(""); 
    if (selectedVehicles.length === 0) { 
      setError("Selecione ao menos um veículo."); 
      return; 
    } 
    setLoading(true);
    
    try {
      const payload = { 
        vehicles: selectedVehicles.map(m => ({ 
          model_name_clean: m, 
          year_num: Number(yearNum), 
          km_mensal: Number(kmMensal), 
          taxa_juros_mensal: Number(taxaJurosMensal), 
          percentual_applied: Number(percentualAplicado), 
          revisao_mensal: Number(revisaoMensal), 
          custo_pneus: Number(custoPneus), 
          seguro_anual: Number(seguroAnual), 
          impostos_mensais: Number(impostosMensais), 
          rastreamento_mensal: Number(rastreamentoMensal), 
          prazos: [12, 24, 36], // Conforme Arquitetura Espacial
          valor_financiado: Number(valorFinanciado),
          nper_financiamento: Number(nperFinanciamento),
          franquia_km: Number(franquiaKm),
          projecao_revenda: projecaoRevenda ? Number(projecaoRevenda) : null
        })) 
      };
      
      const r = await api.post("/pricing/compare", payload); 
      setResults(r.data);
      
      logAction("Calculadora", `Realizou cálculo comparativo de ${selectedVehicles.length} veículos`);
    } catch (e) { 
      setError("⚠️ Erro ao processar cálculos."); 
    } finally { 
      setLoading(false); 
    }
  }

  const formatBRL = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const paginatedInventory = useMemo(() => { 
    const start = (currentPage - 1) * rowsPerPage; 
    return filteredInventory.slice(start, start + rowsPerPage); 
  }, [filteredInventory, currentPage, rowsPerPage]);
  
  const totalPages = Math.ceil(filteredInventory.length / rowsPerPage);
  
  const paginatedInventoryLocacao = useMemo(() => { 
    const start = (currentPageLocacao - 1) * rowsPerPageLocacao; 
    return filteredInventoryLocacao.slice(start, start + rowsPerPageLocacao); 
  }, [filteredInventoryLocacao, currentPageLocacao, rowsPerPageLocacao]);
  
  const totalPagesLocacao = Math.ceil(filteredInventoryLocacao.length / rowsPerPageLocacao);

  const getBreakdown = (inventory) => { 
    const total = inventory.length; 
    if (total === 0) return []; 
    const counts = {}; 
    inventory.forEach(v => counts[v.status] = (counts[v.status] || 0) + 1); 
    
    return Object.entries(counts).map(([status, count]) => ({ 
      status, 
      count, 
      percent: ((count / total) * 100).toFixed(1) + '%', 
      color: getStatusColor(status) 
    })).sort((a, b) => b.count - a.count); 
  };
  
  const vendasBreakdown = useMemo(() => getBreakdown(fullInventoryVendas), [fullInventoryVendas]);
  const locacaoBreakdown = useMemo(() => getBreakdown(fullInventoryLocacao), [fullInventoryLocacao]);

  if (!isLoggedIn) {
    if (showFirstAccessModal) {
      return (
        <div style={styles.loginPage}>
          <div style={styles.loginCard}>
            <div style={styles.loginLogoContainer}>
              <img src={sysLogos.login} alt="Logo Login" style={styles.loginLogo} />
            </div>
            <h2 style={styles.loginTitle}>PRIMEIRO ACESSO</h2>
            <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 25}}>
              Olá, <strong>{pendingUser?.name}</strong>. Por segurança, você precisa definir uma senha de sua autoria antes de continuar.
            </p>
            <form onSubmit={handleFirstAccessSubmit} style={styles.loginForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nova Senha</label>
                <input 
                  type="password" 
                  style={styles.input} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  style={styles.input} 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
                <button type="submit" style={{...styles.loginButton, flex: 1}}>SALVAR E ENTRAR</button>
                <button 
                  type="button" 
                  onClick={() => {setShowFirstAccessModal(false); setPendingUser(null);}} 
                  style={{...styles.clearResultsBtn, flex: 1, background: 'rgba(248, 113, 113, 0.2)'}}
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <div style={styles.loginLogoContainer}>
            <img src={sysLogos.login} alt="Logo Login" style={styles.loginLogo} />
          </div>
          <h2 style={styles.loginTitle}>Gestão e Controle de Frota</h2>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-mail Corporativo</label>
              <input 
                type="email" 
                style={styles.input} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Senha</label>
              <input 
                type="password" 
                style={styles.input} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" style={styles.loginButton}>ENTRAR NO SISTEMA</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      
      {/* MODAIS GERAIS AQUI... */}
      {/* MODAL DE CONCILIAÇÃO OFX EM TELA (NOVO) */}
     {showConciliacaoModal && (
  <div style={{
    position:"fixed",inset:0,
    background:"rgba(2,6,20,0.88)",backdropFilter:"blur(16px)",
    display:"flex",alignItems:"center",justifyContent:"center",
    zIndex:9999,padding:16,
  }}>
    <div style={{
      background:"rgba(10,18,32,0.95)",
      border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:24,padding:"40px 36px",
      width:"100%",maxWidth:920,maxHeight:"92vh",overflowY:"auto",
      position:"relative",
      boxShadow:"0 60px 120px rgba(0,0,0,0.8),0 0 40px rgba(16,185,129,0.06)",
    }}>
      <button onClick={()=>setShowConciliacaoModal(false)} style={{
        position:"absolute",top:20,right:24,
        background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
        color:"#94a3b8",fontSize:18,cursor:"pointer",borderRadius:8,
        width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all 0.15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="#94a3b8";}}
      >✕</button>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{width:4,height:32,borderRadius:2,background:"linear-gradient(to bottom,#10b981,#3b82f6)"}}/>
          <h2 style={{margin:0,fontSize:20,fontWeight:900}}>Conciliação Bancária Inteligente</h2>
        </div>
        <p style={{margin:"0 0 0 16px",color:"#64748b",fontSize:13}}>
          {conciliacaoData.length > 0
            ? `${conciliacaoData.length} transação(ões) identificada(s). Confirme os vínculos ou realize lançamentos diretos.`
            : "Processando extrato..."}
        </p>
      </div>

      {/* Itens de conciliação */}
      {conciliacaoData.length > 0 ? conciliacaoData.map((item, index) => (
        <div key={index} style={{
          background:"rgba(255,255,255,0.025)",
          border:`1px solid ${item.tipo==="credito"?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`,
          borderRadius:16,padding:"22px 24px",marginBottom:16,
        }}>
          {/* Cabeçalho da transação */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:16,marginBottom:16,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div>
              <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
                {item.tipo==="credito"?"💚 Crédito (Entrada no Extrato)":"🔴 Débito (Saída do Extrato)"}
              </div>
              <div style={{fontSize:22,fontWeight:900,color:item.tipo==="credito"?"#10b981":"#ef4444",fontFamily:"monospace"}}>
                {item.tipo==="credito"?"+ ":"− "}R$ {item.extrato_valor}
              </div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:4,fontStyle:"italic"}}>
                "{item.extrato_descricao}"
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Data do Extrato</div>
              <div style={{fontSize:15,fontWeight:800,color:"#e2e8f0"}}>{item.extrato_data}</div>
              <div style={{
                marginTop:8,
                background: item.sugestoes_vinculo?.length?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)",
                border:`1px solid ${item.sugestoes_vinculo?.length?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`,
                color: item.sugestoes_vinculo?.length?"#34d399":"#fcd34d",
                padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:800,
                textTransform:"uppercase",letterSpacing:"0.06em",
              }}>
                {item.sugestoes_vinculo?.length?"✦ Match Encontrado":"⚡ Lançamento Direto"}
              </div>
            </div>
          </div>

          {/* CASO 1: Parcela encontrada */}
          {item.sugestoes_vinculo?.length>0 ? (
            <div>
              <div style={{fontSize:10,color:"#fcd34d",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>
                Vínculo sugerido no sistema:
              </div>
              {item.sugestoes_vinculo.map((sug,sIdx)=>(
                <div key={sIdx} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",
                  borderRadius:12,padding:"14px 18px",marginBottom:6,
                }}>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:3}}>{sug.fornecedor} — {sug.descricao}</div>
                    <div style={{color:"#34d399",fontSize:12}}>
                      Valor: <strong>R$ {sug.valor_sistema}</strong> · Venc.: {sug.vencimento_sistema}
                    </div>
                  </div>
                  <button
                    onClick={()=>handleAprovarConciliacao(sug.id_parcela,item.id_transacao)}
                    style={{
                      background:"linear-gradient(135deg,#059669,#10b981)",
                      color:"#fff",border:"none",borderRadius:10,
                      padding:"10px 22px",cursor:"pointer",fontWeight:900,fontSize:12,
                      boxShadow:"0 4px 15px rgba(16,185,129,0.4)",
                      transition:"opacity 0.15s",flexShrink:0,marginLeft:16,
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                  >✔ CONFIRMAR MATCH</button>
                </div>
              ))}
            </div>
          ) : (
            /* CASO 2: Lançamento rápido / memória */
            <div style={{
              background:"rgba(245,158,11,0.06)",
              border:"1px dashed rgba(245,158,11,0.35)",
              borderRadius:12,padding:"16px 18px",
            }}>
              <p style={{color:"#fcd34d",fontSize:12,fontWeight:700,marginBottom:12}}>
                {item.sugestao_regra
                  ? `✨ Memória: "${item.extrato_descricao}" costuma ser de ${item.sugestao_regra.fornecedor_nome}.`
                  : `⚡ Sem provisão encontrada. Selecione a empresa para baixar na hora:`}
              </p>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <select
                  id={`forn_rapido_${index}`}
                  defaultValue={item.sugestao_regra?item.sugestao_regra.id_fornecedor:""}
                  style={{
                    flex:1,padding:"10px 13px",borderRadius:10,
                    background:"rgba(0,0,0,0.4)",border:"1px solid rgba(245,158,11,0.3)",
                    color:"#f1f5f9",fontSize:12,
                  }}
                >
                  <option value="">-- Selecionar Empresa / Cliente --</option>
                  {fornecedores.map(f=>(
                    <option key={f.id} value={f.id}>{f.nome_razao} ({f.documento})</option>
                  ))}
                </select>
                <button
                  onClick={()=>handleLancarEConciliar(item,index)}
                  style={{
                    background:item.sugestao_regra?"linear-gradient(135deg,#b45309,#f59e0b)":"linear-gradient(135deg,#b45309,#f59e0b)",
                    color:"#000",border:"none",borderRadius:10,
                    padding:"10px 20px",cursor:"pointer",fontWeight:900,fontSize:12,
                    boxShadow:"0 4px 15px rgba(245,158,11,0.3)",
                    flexShrink:0,
                  }}
                >{item.sugestao_regra?"CONFIRMAR E BAIXAR":"CRIAR E CONCILIAR"}</button>
              </div>
            </div>
          )}
        </div>
      )) : (
        <div style={{
          padding:"60px 20px",textAlign:"center",
          background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:16,
        }}>
          <div style={{fontSize:52,marginBottom:16}}>🎉</div>
          <p style={{color:"#f1f5f9",fontSize:18,fontWeight:800,margin:"0 0 8px 0"}}>Extrato 100% Conciliado!</p>
          <p style={{color:"#64748b",fontSize:13,margin:0}}>Não há transações pendentes.</p>
        </div>
      )}

      <button onClick={()=>setShowConciliacaoModal(false)} style={{
        display:"block",width:"100%",marginTop:24,padding:14,
        background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",
        color:"#94a3b8",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:13,
        transition:"all 0.15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#94a3b8";}}
      >Fechar Conciliação</button>
    </div>
  </div>
)}


      {/* MODAL EDIÇÃO VEÍCULO */}
      {showEditModal && vehicleToEdit && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={styles.cardTitle}>Editar Veículo: {vehicleToEdit.placa}</h2>
            <form onSubmit={handleUpdateVehicle} style={styles.inventoryGrid}>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Placa</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.placa} disabled />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Chassi</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.chassi} onChange={e => setVehicleToEdit({...vehicleToEdit, chassi: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Renavam</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.renavam} onChange={e => setVehicleToEdit({...vehicleToEdit, renavam: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Marca</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.marca} onChange={e => setVehicleToEdit({...vehicleToEdit, marca: e.target.value})} />
                </div>
                
                <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                  <label style={styles.fieldLabel}>Modelo</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.modelo} onChange={e => setVehicleToEdit({...vehicleToEdit, modelo: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Ano</label>
                  <input type="number" style={styles.inputSmall} value={vehicleToEdit.ano} onChange={e => setVehicleToEdit({...vehicleToEdit, ano: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Cor</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.cor} onChange={e => setVehicleToEdit({...vehicleToEdit, cor: e.target.value})} required />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Combustível</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.combustivel} onChange={e => setVehicleToEdit({...vehicleToEdit, combustivel: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Carroceria</label>
                  <input style={styles.inputSmall} value={vehicleToEdit.carroceria} onChange={e => setVehicleToEdit({...vehicleToEdit, carroceria: e.target.value})} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Valor Aquisição</label>
                  <input type="number" style={styles.inputSmall} value={vehicleToEdit.valor_aquisicao} onChange={e => setVehicleToEdit({...vehicleToEdit, valor_aquisicao: e.target.value})} required />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Valor FIPE</label>
                  <input type="number" style={styles.inputSmall} value={vehicleToEdit.valor_fipe} onChange={e => setVehicleToEdit({...vehicleToEdit, valor_fipe: e.target.value})} required />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Hodômetro (KM)</label>
                  <input type="number" style={styles.inputSmall} value={vehicleToEdit.hodometro} onChange={e => setVehicleToEdit({...vehicleToEdit, hodometro: e.target.value})} required />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Status</label>
                  <select style={styles.inputSmall} value={vehicleToEdit.status} onChange={e => setVehicleToEdit({...vehicleToEdit, status: e.target.value})}>
                    {activeTab === 'estoque_vendas' ? (
                      <>
                        <option value="Disponível">Disponível</option>
                        <option value="Locado">Locado</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Vendido">Vendido</option>
                      </>
                    ) : (
                      <>
                        <option value="Ociosos">Ociosos</option>
                        <option value="Locados">Locados</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Vendidos">Vendidos</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div style={{display: 'flex', gap: 15, gridColumn: 'span 2', marginTop: 10}}>
                  <button type="submit" style={{...styles.exportBtn, flex: 1}}>SALVAR ALTERAÇÕES</button>
                  <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={() => setShowEditModal(false)}>CANCELAR</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO OBRIGAÇÃO FINANCEIRA (CONTAS A PAGAR) (NOVO) */}
      {showEditContaModal && contaToEdit && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '600px'}}>
            <h2 style={styles.cardTitle}>Editar Provisão ID: {contaToEdit.id}</h2>
            <form onSubmit={handleUpdateContaPagar} style={{marginTop: '20px'}}>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Descrição</label>
                <input style={styles.inputSmall} value={contaToEdit.descricao} onChange={e => setContaToEdit({...contaToEdit, descricao: e.target.value})} required />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Data de Vencimento</label>
                  <input type="date" style={styles.inputSmall} value={contaToEdit.vencimento} onChange={e => setContaToEdit({...contaToEdit, vencimento: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Valor (R$)</label>
                  <input type="number" step="0.01" style={styles.inputSmall} value={contaToEdit.valor} onChange={e => setContaToEdit({...contaToEdit, valor: e.target.value})} required />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.fieldLabel}>Status</label>
                <select style={styles.inputSmall} value={contaToEdit.status} onChange={e => setContaToEdit({...contaToEdit, status: e.target.value})}>
                  <option value="ABERTO">Em Aberto</option>
                  <option value="PAGO">Pago</option>
                  <option value="ATRASADO">Atrasado</option>
                  <option value="CONCILIADO">Conciliado (OFX)</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: 15, marginTop: 30}}>
                <button type="submit" style={{...styles.exportBtn, flex: 2}}>SALVAR ALTERAÇÕES</button>
                <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={() => { setShowEditContaModal(false); setContaToEdit(null); }}>CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA OBRIGAÇÃO FINANCEIRA COM FORNECEDOR E EDIÇÃO DE PARCELAS (ATUALIZADO) */}
      {showAddObrigacaoModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
            
            <button 
              onClick={() => setShowAddObrigacaoModal(false)} 
              style={{position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold'}}
            >
              X
            </button>
            
            <h2 style={styles.cardTitle}>Cadastro de Obrigação no Contas a Pagar</h2>
            <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 25}}>
              Registrar uma obrigação financeira, garantindo controle de fluxo de caixa, competência contábil e rastreabilidade.
            </p>

            <form onSubmit={handleSalvarObrigacao}>
              
              {/* ETAPA 1: FORNECEDOR COM BOTÃO + NOVO */}
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>1. Identificação do Fornecedor</h3>
                <div style={styles.formGrid}>
                  <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                    <label style={styles.fieldLabel}>Selecione o Fornecedor Cadastrado *</label>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <select 
                          style={{...styles.inputSmall, flex: 1}} 
                          value={novaObrigacao.id_fornecedor} 
                          onChange={e => setNovaObrigacao({...novaObrigacao, id_fornecedor: e.target.value})} 
                          required
                        >
                          <option value="">-- Selecione o Fornecedor --</option>
                          {fornecedores.map((f) => (
                            <option key={f.id} value={f.id}>{f.nome_razao} ({f.documento})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAddFornecedorModal(true)}
                          style={{...styles.exportBtn, background: '#3b82f6', padding: '0 15px'}}
                          title="Cadastrar Novo Fornecedor Rapidamente"
                        >
                          + NOVO FORNECEDOR
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ETAPA 2: DADOS GERAIS */}
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>2. Dados Gerais da Obrigação</h3>
                <div style={styles.formGrid}>
                  <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                    <label style={styles.fieldLabel}>Descrição da Despesa *</label>
                    <input style={styles.inputSmall} placeholder="Ex: Compra de Peças Lote X" value={novaObrigacao.descricao} onChange={e => setNovaObrigacao({...novaObrigacao, descricao: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Categoria Financeira *</label>
                    <select style={styles.inputSmall} value={novaObrigacao.categoria} onChange={e => setNovaObrigacao({...novaObrigacao, categoria: e.target.value})} required>
                      <option value="Despesas Operacionais">Despesas Operacionais</option>
                      <option value="Impostos e Taxas">Impostos e Taxas</option>
                      <option value="Folha de Pagamento">Folha de Pagamento</option>
                      <option value="Fornecedores">Fornecedores (Veículos/Peças)</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Competência (Mês/Ano) *</label>
                    <input type="month" style={styles.inputSmall} value={novaObrigacao.competencia} onChange={e => setNovaObrigacao({...novaObrigacao, competencia: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Centro de Custo (Opcional)</label>
                    <select style={styles.inputSmall} value={novaObrigacao.centro_custo} onChange={e => setNovaObrigacao({...novaObrigacao, centro_custo: e.target.value})}>
                      <option value="">Nenhum</option>
                      <option value="Vendas">Vendas</option>
                      <option value="Locação">Locação</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Oficina">Oficina</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Observações</label>
                    <input style={styles.inputSmall} placeholder="Notas adicionais..." value={novaObrigacao.observacoes} onChange={e => setNovaObrigacao({...novaObrigacao, observacoes: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* ETAPA 3: DADOS FINANCEIROS & PARCELAMENTO/RECORRÊNCIA (ATUALIZADA) */}
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>3. Dados Financeiros & Condições</h3>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Valor Total (R$) *</label>
                    <input type="number" step="0.01" min="0.01" style={{...styles.inputSmall, color: '#4ade80', fontWeight: 'bold'}} value={novaObrigacao.valor_total} onChange={e => setNovaObrigacao({...novaObrigacao, valor_total: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Data Base Vencimento *</label>
                    <input type="date" style={styles.inputSmall} value={novaObrigacao.data_vencimento} onChange={e => setNovaObrigacao({...novaObrigacao, data_vencimento: e.target.value})} required />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Forma de Pagamento</label>
                    <select style={styles.inputSmall} value={novaObrigacao.forma_pagamento} onChange={e => setNovaObrigacao({...novaObrigacao, forma_pagamento: e.target.value})}>
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto</option>
                      <option value="Transferência">Transferência / TED</option>
                      <option value="Cartão">Cartão de Crédito</option>
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.fieldLabel}>Conta Bancária Saída</label>
                    <select style={styles.inputSmall} value={novaObrigacao.conta_bancaria} onChange={e => setNovaObrigacao({...novaObrigacao, conta_bancaria: e.target.value})}>
                      <option value="Conta Principal">Conta Corrente Principal</option>
                      <option value="Conta Reserva">Conta Reserva</option>
                    </select>
                  </div>
                </div>

                {/* OPÇÕES DE PAGAMENTO (ÚNICO, PARCELADO, RECORRENTE) */}
                <div style={{marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                  <label style={styles.fieldLabel}>ESTRUTURA DE PAGAMENTO</label>
                  <div style={{display: 'flex', gap: '20px', marginBottom: '15px'}}>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                      <input type="radio" name="tipoPagamento" value="avista" checked={novaObrigacao.tipo_pagamento === 'avista'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                      Pagamento Único (À Vista)
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                      <input type="radio" name="tipoPagamento" value="parcelado" checked={novaObrigacao.tipo_pagamento === 'parcelado'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                      Parcelado (Divide o Valor)
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                      <input type="radio" name="tipoPagamento" value="recorrente" checked={novaObrigacao.tipo_pagamento === 'recorrente'} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_pagamento: e.target.value, parcelas_geradas: []})} style={{marginRight: '8px'}} />
                      Recorrente (Repete o Valor)
                    </label>
                  </div>
                  
                  {/* PARCELADO CONFIG */}
                  {novaObrigacao.tipo_pagamento === 'parcelado' && (
                    <div style={{display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end'}}>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Qtd Parcelas</label>
                        <input type="number" min="2" style={styles.inputSmall} value={novaObrigacao.qtd_parcelas} onChange={e => setNovaObrigacao({...novaObrigacao, qtd_parcelas: e.target.value})} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Intervalo</label>
                        <select style={styles.inputSmall} value={novaObrigacao.intervalo_parcelas} onChange={e => setNovaObrigacao({...novaObrigacao, intervalo_parcelas: e.target.value})}>
                          <option value="mensal">Mensal</option>
                          <option value="semanal">Semanal</option>
                          <option value="personalizado">Personalizado</option>
                        </select>
                      </div>
                      <button type="button" onClick={calcularParcelasOuRecorrencia} style={{...styles.exportBtn, background: '#3b82f6', marginBottom: '18px'}}>Gerar Previsão</button>
                    </div>
                  )}

                  {/* RECORRENTE CONFIG */}
                  {novaObrigacao.tipo_pagamento === 'recorrente' && (
                    <div style={{display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end'}}>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Tempo de Recorrência</label>
                        <select style={styles.inputSmall} value={novaObrigacao.recorrencia_tipo} onChange={e => setNovaObrigacao({...novaObrigacao, recorrencia_tipo: e.target.value})}>
                          <option value="meses">Meses</option>
                          <option value="semanas">Semanas</option>
                          <option value="anos">Anos</option>
                          <option value="dias">Dias</option>
                        </select>
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Quantas vezes se repetirá?</label>
                        <input type="number" min="2" style={styles.inputSmall} value={novaObrigacao.recorrencia_qtd} onChange={e => setNovaObrigacao({...novaObrigacao, recorrencia_qtd: e.target.value})} />
                      </div>
                      <button type="button" onClick={calcularParcelasOuRecorrencia} style={{...styles.exportBtn, background: '#3b82f6', marginBottom: '18px'}}>Gerar Previsão</button>
                    </div>
                  )}

                  {/* TABELA DE EDIÇÃO DAS PARCELAS GERADAS */}
                  {novaObrigacao.parcelas_geradas.length > 0 && (
                    <div style={{marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                      <h4 style={{fontSize: '12px', color: '#eab308', marginBottom: '10px'}}>Confira e Edite os Lançamentos antes de Salvar:</h4>
                      <table style={styles.tableMassa}>
                        <thead>
                          <tr>
                            <th style={{...styles.thMassa, padding: '10px'}}>Nº</th>
                            <th style={{...styles.thMassa, padding: '10px'}}>Vencimento (Editável)</th>
                            <th style={{...styles.thMassa, padding: '10px'}}>Valor (Editável)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {novaObrigacao.parcelas_geradas.map((p, idx) => (
                            <tr key={idx}>
                              <td style={{...styles.tdMassa, padding: '8px'}}>{p.numero_parcela}</td>
                              <td style={{...styles.tdMassa, padding: '8px'}}>
                                <input 
                                  type="date" 
                                  style={{...styles.inputSmall, padding: '8px'}} 
                                  value={p.data_vencimento} 
                                  onChange={(e) => handleUpdateParcelaGerada(idx, 'data_vencimento', e.target.value)} 
                                />
                              </td>
                              <td style={{...styles.tdMassa, padding: '8px'}}>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  style={{...styles.inputSmall, padding: '8px', color: '#4ade80'}} 
                                  value={p.valor} 
                                  onChange={(e) => handleUpdateParcelaGerada(idx, 'valor', e.target.value)} 
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

              {/* ETAPA 4: RATEIO CONDICIONAL */}
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>4. Rateio Gerencial</h3>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '15px'}}>
                  <input type="checkbox" style={{marginRight: '10px', transform: 'scale(1.2)'}} checked={novaObrigacao.is_rateado} onChange={e => setNovaObrigacao({...novaObrigacao, is_rateado: e.target.checked})} />
                  Habilitar Rateio Múltiplo
                </label>

                {novaObrigacao.is_rateado && (
                  <div style={{padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
                    <div style={{...styles.inputGroup, width: '50%'}}>
                      <label style={styles.fieldLabel}>Divisão Baseada Em:</label>
                      <select style={styles.inputSmall} value={novaObrigacao.tipo_rateio} onChange={e => setNovaObrigacao({...novaObrigacao, tipo_rateio: e.target.value, rateios: []})}>
                        <option value="Centro de Custo">Centro de Custo</option>
                        <option value="Categoria">Categoria Financeira</option>
                      </select>
                    </div>

                    {novaObrigacao.rateios.map((rt, idx) => (
                       <div key={idx} style={{display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '10px'}}>
                          <div style={{...styles.inputGroup, flex: 2, marginBottom: 0}}>
                            <label style={styles.fieldLabel}>Referência</label>
                            <input style={styles.inputSmall} placeholder={`Nome do ${novaObrigacao.tipo_rateio}`} value={rt.referencia} onChange={(e) => {
                              const novos = [...novaObrigacao.rateios];
                              novos[idx] = { ...novos[idx], referencia: e.target.value };
                              setNovaObrigacao({...novaObrigacao, rateios: novos});
                            }} />
                          </div>
                          <div style={{...styles.inputGroup, flex: 1, marginBottom: 0}}>
                            <label style={styles.fieldLabel}>Percentual (%)</label>
                            <input type="number" step="0.01" style={styles.inputSmall} value={rt.percentual} onChange={(e) => {
                              const novos = [...novaObrigacao.rateios];
                              novos[idx] = { ...novos[idx], percentual: e.target.value };
                              setNovaObrigacao({...novaObrigacao, rateios: novos});
                            }} />
                          </div>
                          <button type="button" onClick={() => {
                              const novos = novaObrigacao.rateios.filter((_, i) => i !== idx);
                              setNovaObrigacao({...novaObrigacao, rateios: novos});
                          }} style={{...styles.clearResultsBtn, padding: '12px', height: '42px'}}>🗑️</button>
                       </div>
                    ))}
                    <button type="button" onClick={() => setNovaObrigacao({...novaObrigacao, rateios: [...novaObrigacao.rateios, {referencia: '', percentual: 0}]})} style={{...styles.clearBtn, color: '#4ade80', border: '1px solid #4ade80', marginTop: '10px'}}>+ Adicionar Linha de Rateio</button>
                  </div>
                )}
              </div>

              {/* ETAPA 5: ANEXOS */}
              <div style={{background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)'}}>
                <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>5. Anexos Documentais</h3>
                <input type="file" id="anexoUpload" accept=".pdf, .jpg, .png" multiple style={{display: 'none'}} onChange={(e) => {
                  if(e.target.files.length) {
                    setNovaObrigacao({...novaObrigacao, anexos: [...novaObrigacao.anexos, ...Array.from(e.target.files)]});
                  }
                }} />
                <label htmlFor="anexoUpload" style={{...styles.exportBtn, background: 'rgba(15, 23, 42, 0.8)', border: '1px dashed #94a3b8', display: 'block', textAlign: 'center', width: '100%', padding: '20px', cursor: 'pointer', color: '#cbd5e1'}}>
                  📎 Clique para adicionar Nota Fiscal, Boleto, Contrato (PDF, JPG, PNG)
                </label>
                {novaObrigacao.anexos.length > 0 && (
                  <ul style={{marginTop: '15px', fontSize: '12px', color: '#94a3b8', listStyle: 'none', padding: 0}}>
                    {novaObrigacao.anexos.map((f, i) => (
                      <li key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', marginBottom: '5px'}}>
                        <span>📎 {f.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoverAnexo(i)}
                          style={{background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold'}}
                          title="Remover anexo"
                        >
                          X
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* VALIDAÇÃO FINAL E SALVAMENTO */}
              <div style={{display: 'flex', gap: 15, marginTop: 30}}>
                <button type="submit" style={{...styles.exportBtn, flex: 2, fontSize: '14px', background: '#3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)'}} disabled={loading}>
                  {loading ? "PROCESSANDO E SALVANDO..." : "✔️ CADASTRAR OBRIGAÇÃO FINANCEIRA"}
                </button>
                <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={() => setShowAddObrigacaoModal(false)}>
                  CANCELAR
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO FORNECEDOR COM DADOS ATUALIZADOS */}
      {showAddFornecedorModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={styles.cardTitle}>Cadastro Completo de Fornecedor</h2>
            <form onSubmit={handleSalvarFornecedor} style={{marginTop: '20px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                
                <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                  <label style={styles.fieldLabel}>Tipo de Pessoa *</label>
                  <select style={styles.inputSmall} value={novoFornecedor.tipo_pessoa} onChange={e => setNovoFornecedor({...novoFornecedor, tipo_pessoa: e.target.value})} required>
                    <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                    <option value="PF">Pessoa Física (CPF)</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Nome ou Razão Social *</label>
                  <input style={styles.inputSmall} value={novoFornecedor.nome_razao} onChange={e => setNovoFornecedor({...novoFornecedor, nome_razao: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>{novoFornecedor.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'} (Apenas números) *</label>
                  <input style={styles.inputSmall} value={novoFornecedor.documento} onChange={e => setNovoFornecedor({...novoFornecedor, documento: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>E-mail Contato</label>
                  <input type="email" style={styles.inputSmall} value={novoFornecedor.email} onChange={e => setNovoFornecedor({...novoFornecedor, email: e.target.value})} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Telefone</label>
                  <input style={styles.inputSmall} value={novoFornecedor.telefone} onChange={e => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})} />
                </div>

                {/* ENDEREÇO */}
                <div style={{gridColumn: 'span 2', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                  <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>Endereço</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>CEP</label>
                      <input style={styles.inputSmall} value={novoFornecedor.cep} onChange={e => setNovoFornecedor({...novoFornecedor, cep: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Logradouro (Rua/Av)</label>
                      <input style={styles.inputSmall} value={novoFornecedor.logradouro} onChange={e => setNovoFornecedor({...novoFornecedor, logradouro: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Número</label>
                      <input style={styles.inputSmall} value={novoFornecedor.numero} onChange={e => setNovoFornecedor({...novoFornecedor, numero: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Complemento</label>
                      <input style={styles.inputSmall} value={novoFornecedor.complemento} onChange={e => setNovoFornecedor({...novoFornecedor, complemento: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Bairro</label>
                      <input style={styles.inputSmall} value={novoFornecedor.bairro} onChange={e => setNovoFornecedor({...novoFornecedor, bairro: e.target.value})} />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px'}}>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Cidade</label>
                        <input style={styles.inputSmall} value={novoFornecedor.cidade} onChange={e => setNovoFornecedor({...novoFornecedor, cidade: e.target.value})} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>UF</label>
                        <input style={styles.inputSmall} maxLength="2" placeholder="Ex: SP" value={novoFornecedor.uf} onChange={e => setNovoFornecedor({...novoFornecedor, uf: e.target.value.toUpperCase()})} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
              
              <div style={{display: 'flex', gap: 15, marginTop: 30}}>
                <button type="submit" style={{...styles.exportBtn, flex: 2}} disabled={loading}>
                  {loading ? "SALVANDO..." : "CADASTRAR"}
                </button>
                <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={() => setShowAddFornecedorModal(false)}>
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO DE FORNECEDOR COM DADOS ATUALIZADOS */}
      {showEditFornecedorModal && fornecedorToEdit && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={styles.cardTitle}>Editar Fornecedor: {fornecedorToEdit.nome_razao}</h2>
            <form onSubmit={handleUpdateFornecedor} style={{marginTop: '20px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                
                <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                  <label style={styles.fieldLabel}>Tipo de Pessoa *</label>
                  <select style={styles.inputSmall} value={fornecedorToEdit.tipo_pessoa || 'PJ'} onChange={e => setFornecedorToEdit({...fornecedorToEdit, tipo_pessoa: e.target.value})} required>
                    <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                    <option value="PF">Pessoa Física (CPF)</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Nome ou Razão Social *</label>
                  <input style={styles.inputSmall} value={fornecedorToEdit.nome_razao} onChange={e => setFornecedorToEdit({...fornecedorToEdit, nome_razao: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>{fornecedorToEdit.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'} (Apenas números) *</label>
                  <input style={styles.inputSmall} value={fornecedorToEdit.documento} onChange={e => setFornecedorToEdit({...fornecedorToEdit, documento: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>E-mail Contato</label>
                  <input type="email" style={styles.inputSmall} value={fornecedorToEdit.email || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, email: e.target.value})} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Telefone</label>
                  <input style={styles.inputSmall} value={fornecedorToEdit.telefone || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, telefone: e.target.value})} />
                </div>

                {/* ENDEREÇO */}
                <div style={{gridColumn: 'span 2', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px'}}>
                  <h3 style={{fontSize: '13px', color: '#eab308', textTransform: 'uppercase', marginBottom: '15px'}}>Endereço</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>CEP</label>
                      <input style={styles.inputSmall} value={fornecedorToEdit.cep || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, cep: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Logradouro (Rua/Av)</label>
                      <input style={styles.inputSmall} value={fornecedorToEdit.logradouro || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, logradouro: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Número</label>
                      <input style={styles.inputSmall} value={fornecedorToEdit.numero || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, numero: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Complemento</label>
                      <input style={styles.inputSmall} value={fornecedorToEdit.complemento || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, complemento: e.target.value})} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Bairro</label>
                      <input style={styles.inputSmall} value={fornecedorToEdit.bairro || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, bairro: e.target.value})} />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px'}}>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Cidade</label>
                        <input style={styles.inputSmall} value={fornecedorToEdit.cidade || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, cidade: e.target.value})} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>UF</label>
                        <input style={styles.inputSmall} maxLength="2" value={fornecedorToEdit.uf || ''} onChange={e => setFornecedorToEdit({...fornecedorToEdit, uf: e.target.value.toUpperCase()})} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
              
              <div style={{display: 'flex', gap: 15, marginTop: 30}}>
                <button type="submit" style={{...styles.exportBtn, flex: 2}} disabled={loading}>
                  {loading ? "ATUALIZANDO..." : "SALVAR ALTERAÇÕES"}
                </button>
                <button type="button" style={{...styles.clearResultsBtn, flex: 1}} onClick={() => { setShowEditFornecedorModal(false); setFornecedorToEdit(null); }}>
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAÇÃO MASSA */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, position: 'relative', maxWidth: '95%'}}>
            
            <button 
              onClick={() => {setShowConfirmModal(false); setPendingData(null);}} 
              style={{
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                background: 'none', 
                border: 'none', 
                color: '#94a3b8', 
                fontSize: '24px', 
                cursor: 'pointer', 
                fontWeight: 'bold'
              }}
            >
              X
            </button>
            
            <h2 style={styles.cardTitle}>Confirmar Importação ({pendingData?.tipo})</h2>
            <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 20}}>
              Foram lidos <strong>{pendingData?.items?.length}</strong> veículos. Confira todas as colunas abaixo:
            </p>
            
            <div style={{...styles.modalTableBox, overflowX: 'auto'}}>
              <table style={{...styles.tableMassa, minWidth: 'max-content'}}>
                <thead>
                  <tr>
                    {previewColumns.map((colKey, idx) => (
                      <th key={idx} style={styles.thMassa}>{String(colKey).toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingData?.items?.slice(0, 10).map((item, idx) => (
                    <tr key={idx}>
                      {previewColumns.map((colKey, colIdx) => (
                        <td key={colIdx} style={{...styles.tdMassa, whiteSpace: 'nowrap'}}>{item[colKey]}</td>
                      ))}
                    </tr>
                  ))}
                  {pendingData?.items?.length > 10 && (
                    <tr>
                      <td colSpan={previewColumns.length} style={{...styles.tdMassa, textAlign: 'center', color: '#64748b'}}>
                        ... e mais {pendingData.items.length - 10} veículos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{display: 'flex', gap: 15, marginTop: 25}}>
              <button style={styles.exportBtn} onClick={handleConfirmImport} disabled={loading}>
                {loading ? "SALVANDO..." : "SIM, SALVAR TUDO"}
              </button>
              <button style={styles.clearResultsBtn} onClick={() => {setShowConfirmModal(false); setPendingData(null);}} disabled={loading}>
                CANCELAR
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* SIDEBAR FLUTUANTE */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogoBox}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <img src={sysLogos.sidebar} alt="Logo Sidebar" style={styles.sidebarLogo} />
            </div>
        </div>
        
        <nav style={styles.nav}>
          {/* SEÇÃO GERAL */}
          <div style={{padding: '0 20px 10px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>
            Geral
          </div>
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" icon="📊" />
          <NavItem active={activeTab === "calculadora"} onClick={() => setActiveTab("calculadora")} label="Calculadora" icon="🧮" />
          <NavItem active={activeTab === "estoque_vendas"} onClick={() => setActiveTab("estoque_vendas")} label="Estoque de Vendas" icon="📋" />
          <NavItem active={activeTab === "estoque_locacao"} onClick={() => setActiveTab("estoque_locacao")} label="Estoque de Locação" icon="🔑" />
          
          {/* SEÇÃO FINANCEIRO (NIBO STYLE) */}
          <div style={{padding: '15px 20px 10px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>
            Financeiro
          </div>
          <NavItem 
  active={activeTab === "financeiro_dashboard"} 
  onClick={() => { setActiveTab("financeiro_dashboard"); loadDashFin(); }} 
  label="Dashboard Financeiro" 
  icon="📊" 
/>
          <NavItem 
            active={activeTab === "financeiro_pagar"} 
            onClick={() => setActiveTab("financeiro_pagar")} 
            label="Contas a Pagar" 
            icon="💸" 
          />
          <NavItem 
            active={activeTab === "financeiro_receber"} 
            onClick={() => setActiveTab("financeiro_receber")} 
            label="Contas a Receber" 
            icon="🤑" 
          />
          <NavItem
  active={activeTab === "contas_bancarias"}
  onClick={() => setActiveTab("contas_bancarias")}
  label="Contas Bancárias"
  icon="🏦"
/>
          <NavItem
            active={activeTab === "clientes"}
            onClick={() => { setActiveTab("clientes"); loadClientes(); }}
            label="Clientes"
            icon="👥"
          />
          <NavItem
            active={activeTab === "fornecedores"}
            onClick={() => { setActiveTab("fornecedores"); }}
            label="Fornecedores"
            icon="🏢"
          />
          
          {/* SEÇÃO GESTÃO (RESTRITO) */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'gestor') && (
            <>
              <div style={{padding: '15px 20px 10px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>
                Gestão
              </div>
              <NavItem active={activeTab === "frota"} onClick={() => setActiveTab("frota")} label="Gestão de Frota" icon="🚗" />
              <NavItem active={activeTab === "usuarios"} onClick={() => setActiveTab("usuarios")} label="Usuários" icon="👥" />
              <NavItem active={activeTab === "logs"} onClick={() => setActiveTab("logs")} label="Auditoria" icon="📝" />
            </>
          )}

          {/* SEÇÃO SISTEMA (ADMIN APENAS) */}
          {currentUser?.role === 'admin' && (
            <>
              <div style={{padding: '15px 20px 10px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>
                Sistema
              </div>
              <NavItem active={activeTab === "fipe"} onClick={() => setActiveTab("fipe")} label="Atualizar FIPE" icon="🔄" />
              <NavItem active={activeTab === "config"} onClick={() => setActiveTab("config")} label="Cenários" icon="⚙️" />
              <NavItem active={activeTab === "config_sistema"} onClick={() => setActiveTab("config_sistema")} label="Personalização" icon="🛠️" />
            </>
          )}
        </nav>
        
        <div style={{padding: '15px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #1e293b'}}>
            Logado como: <br/>
            <strong style={{color: '#eab308'}}>{currentUser?.name}</strong><br/> 
            ({currentUser?.role.toUpperCase()})
        </div>
        
        <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} style={styles.logoutBtn}>
          Sair do Sistema
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <span style={{color: '#eab308', fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Olá, {currentUser?.name}</span>
              <h1 style={styles.title}>{activeTab.replace('_', ' ').toUpperCase()}</h1>
              <p style={styles.subtitle}> Sistema v3.0 • 2026</p>
            </div>
            {error && (
              <div style={{background: 'rgba(127, 29, 29, 0.8)', backdropFilter: 'blur(10px)', color: '#fecaca', padding: '10px 20px', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)', border: '1px solid #f87171'}}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </header>

        <main style={styles.container}>
          
          {/* TAB: DASHBOARD */}
         {activeTab === "dashboard" && (
            <div style={styles.dashboardWrapper}>
              
              {/* SEÇÃO 1: RESUMO FINANCEIRO REALIZADO (NIBO STYLE) */}
              <h2 style={{...styles.sectionTitle, color: '#eab308', fontSize: '18px', marginBottom: '15px'}}>Consolidado Bancário</h2>
              <div style={{...styles.statsGrid, marginBottom: '30px'}}>
                <StatCard 
                  title="SALDO EM CONTA (REAL)" 
                  value={dashboardFin?.saldo_formatado || "R$ 0,00"} 
                  icon="🏦" 
                />
                <StatCard 
                  title="ENTRADAS (MÊS)" 
                  value={dashboardFin?.entradas_mes ? formatar_moeda_brl(dashboardFin.entradas_mes) : "R$ 0,00"} 
                  icon="📈" 
                />
                <StatCard 
                  title="SAÍDAS (MÊS)" 
                  value={dashboardFin?.saidas_mes ? formatar_moeda_brl(dashboardFin.saidas_mes) : "R$ 0,00"} 
                  icon="📉" 
                />
                <StatCard 
                  title="DISPONIBILIDADE LÍQUIDA" 
                  value={dashboardFin?.lucro_operacional ? formatar_moeda_brl(dashboardFin.lucro_operacional) : "R$ 0,00"} 
                  icon="💰" 
                />
                {/* GRÁFICO DE FLUXO DE CAIXA */}
                <FluxoCaixaChart data={dashboardFin?.fluxo_mensal} maxValue={dashboardFin?.max_valor_grafico} 
                />
              </div>

              {/* SEÇÃO 2: INDICADORES DE OPERAÇÃO E FROTA */}
              <h2 style={{...styles.sectionTitle, color: '#eab308', fontSize: '18px', marginBottom: '15px'}}>Indicadores de Frota</h2>
              <div style={{...styles.statsGrid, marginBottom: '30px'}}>
                <StatCard title="Estoque (Vendas)" value={fullInventoryVendas?.length || 0} icon="🏠" breakdown={vendasBreakdown} />
                <StatCard title="Estoque (Locação)" value={fullInventoryLocacao?.length || 0} icon="🔑" breakdown={locacaoBreakdown} />
                <StatCard title="Modelos Ativos" value={models?.length || 0} icon="🚗" />
                <StatCard title="Margem Média" value={`${((percentualAplicado || 0) * 100).toFixed(1)}%`} icon="📊" />
              </div>
              
              {/* SEÇÃO 3: AÇÕES RÁPIDAS (ATALHOS) */}
              <h2 style={{...styles.sectionTitle, color: '#eab308', fontSize: '18px', marginBottom: '15px'}}>Ações Rápidas</h2>
              <div style={styles.actionGrid}>
                {hasEditPermission && (
                  <div style={{...styles.actionCard, borderLeft: '4px solid #eab308'}} onClick={() => setActiveTab("financeiro")}>
                    <span style={{fontSize: 30}}>💸</span>
                    <h3>Conciliação Bancária</h3>
                    <p>Subir OFX e processar baixas rápidas</p>
                  </div>
                )}
                
                <div style={styles.actionCard} onClick={() => setActiveTab("estoque_vendas")}>
                  <span style={{fontSize: 30}}>📋</span>
                  <h3>Estoque Vendas</h3>
                  <p>Consultar veículos e exportar relatórios</p>
                </div>

                <div style={styles.actionCard} onClick={() => setActiveTab("estoque_locacao")}>
                  <span style={{fontSize: 30}}>🔑</span>
                  <h3>Estoque Locação</h3>
                  <p>Gerir veículos destinados a locação</p>
                </div>
              </div>
              
            </div>
          )}

          {activeTab === "financeiro_dashboard" && (
  <div style={{display:"flex",flexDirection:"column",gap:24}}>

    {/* KPIs principais */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18}}>
      {[
        {label:"Saldo em Conta",value:dashFin.saldo_formatado,icon:"🏦",color:"#10b981",glow:"rgba(16,185,129,0.15)"},
        {label:"Entradas do Mês",value:`R$ ${formatBRL(dashFin.entradas_mes||0)}`,icon:"📈",color:"#3b82f6",glow:"rgba(59,130,246,0.15)"},
        {label:"Saídas do Mês",value:`R$ ${formatBRL(dashFin.saidas_mes||0)}`,icon:"📉",color:"#ef4444",glow:"rgba(239,68,68,0.15)"},
        {label:"Resultado Líquido",value:`R$ ${formatBRL(dashFin.lucro_operacional||0)}`,icon:"💰",
         color:(dashFin.lucro_operacional||0)>=0?"#10b981":"#ef4444",
         glow:(dashFin.lucro_operacional||0)>=0?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)"},
      ].map((k,i)=>(
        <div key={i} style={{
          background:"rgba(15,23,42,0.8)",backdropFilter:"blur(16px)",
          border:`1px solid ${k.color}33`,borderRadius:20,padding:"26px 24px",
          boxShadow:`0 0 40px ${k.glow},0 12px 40px rgba(0,0,0,0.4)`,
          transition:"transform 0.25s,box-shadow 0.25s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 0 50px ${k.glow},0 20px 50px rgba(0,0,0,0.5)`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 0 40px ${k.glow},0 12px 40px rgba(0,0,0,0.4)`;}}
        >
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:9,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:12}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:900,color:k.color,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{loadingFin?"...":(k.value)}</div>
            </div>
            <div style={{width:46,height:46,borderRadius:14,background:`${k.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{k.icon}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Gráfico + Próximos vencimentos */}
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:18}}>
      
      {/* GRÁFICO FLUXO DE CAIXA */}
      <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"28px 30px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <h3 style={{margin:0,fontSize:16,fontWeight:800,borderLeft:"4px solid #eab308",paddingLeft:12}}>Fluxo de Caixa Mensal</h3>
            <p style={{margin:"6px 0 0 16px",fontSize:12,color:"#64748b"}}>Entradas vs Saídas — últimos 6 meses</p>
          </div>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#94a3b8"}}>
              <div style={{width:10,height:10,borderRadius:3,background:"#10b981"}}/>Entradas
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#94a3b8"}}>
              <div style={{width:10,height:10,borderRadius:3,background:"#ef4444"}}/>Saídas
            </div>
          </div>
        </div>
        {dashFin.fluxo_mensal?.length>0 ? (()=>{
          const maxV = Math.max(...dashFin.fluxo_mensal.flatMap(d=>[d.entradas||0,d.saidas||0]),1);
          const H=140,BAR=22,GAP=8,GROUP=BAR*2+GAP+18;
          const W=dashFin.fluxo_mensal.length*GROUP+20;
          return (
            <svg width="100%" viewBox={`0 0 ${W} ${H+32}`} preserveAspectRatio="xMidYMid meet">
              {dashFin.fluxo_mensal.map((d,i)=>{
                const x=10+i*GROUP;
                const inH=((d.entradas||0)/maxV)*H;
                const outH=((d.saidas||0)/maxV)*H;
                return (
                  <g key={i}>
                    <rect x={x} y={H-inH} width={BAR} height={Math.max(inH,2)} fill="#10b981" opacity={0.85} rx={4}/>
                    <rect x={x+BAR+GAP} y={H-outH} width={BAR} height={Math.max(outH,2)} fill="#ef4444" opacity={0.75} rx={4}/>
                    <text x={x+BAR+GAP/2} y={H+20} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="system-ui">{d.mes}</text>
                  </g>
                );
              })}
              <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth={1}/>
            </svg>
          );
        })() : (
          <div style={{textAlign:"center",padding:"50px 0",color:"#475569",fontSize:13}}>
            Nenhuma movimentação registrada para gerar o gráfico.
          </div>
        )}
      </div>

      {/* PAINEL LATERAL: próximas obrigações + saldo */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        
        {/* Mini sumário */}
        <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"22px"}}>
          <h3 style={{margin:"0 0 16px 0",fontSize:13,fontWeight:800,color:"#eab308",textTransform:"uppercase",letterSpacing:"0.08em"}}>Resumo Contas a Pagar</h3>
          {[
            {label:"Em Aberto",count:contasPagar.filter(c=>c.status==="ABERTO").length,total:contasPagar.filter(c=>c.status==="ABERTO").reduce((s,c)=>s+(Number(c.valor)||0),0),color:"#f59e0b"},
            {label:"Vencidos",count:contasPagar.filter(c=>{const hoje=new Date();return c.vencimento&&!["PAGO","CONCILIADO"].includes(c.status)&&new Date(c.vencimento+"T12:00:00Z")<hoje;}).length,total:contasPagar.filter(c=>{const hoje=new Date();return c.vencimento&&!["PAGO","CONCILIADO"].includes(c.status)&&new Date(c.vencimento+"T12:00:00Z")<hoje;}).reduce((s,c)=>s+(Number(c.valor)||0),0),color:"#ef4444"},
            {label:"Pagos",count:contasPagar.filter(c=>c.status==="PAGO").length,total:contasPagar.filter(c=>c.status==="PAGO").reduce((s,c)=>s+(Number(c.valor)||0),0),color:"#10b981"},
          ].map((row,i)=>{
            const totPagar=contasPagar.reduce((s,c)=>s+(Number(c.valor)||0),0)||1;
            const pct=(row.count/Math.max(contasPagar.length,1)*100);
            return (
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:5}}>
                  <span style={{color:"#94a3b8"}}>{row.label}</span>
                  <span style={{fontWeight:800,color:row.color}}>{row.count} — <span style={{fontFamily:"monospace"}}>R$ {formatBRL(row.total)}</span></span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:10,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:row.color,borderRadius:10,transition:"width 0.6s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações rápidas financeiro */}
        <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"22px"}}>
          <h3 style={{margin:"0 0 14px 0",fontSize:13,fontWeight:800,color:"#eab308",textTransform:"uppercase",letterSpacing:"0.08em"}}>Ações Rápidas</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>setActiveTab("financeiro_pagar")} style={{
              background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",
              color:"#93c5fd",borderRadius:10,padding:"10px 14px",cursor:"pointer",
              textAlign:"left",fontSize:12,fontWeight:700,transition:"all 0.15s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(59,130,246,0.08)"}
            >💸 Abrir Contas a Pagar</button>
            <button onClick={()=>setActiveTab("financeiro_receber")} style={{
              background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",
              color:"#6ee7b7",borderRadius:10,padding:"10px 14px",cursor:"pointer",
              textAlign:"left",fontSize:12,fontWeight:700,transition:"all 0.15s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(16,185,129,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(16,185,129,0.08)"}
            >🤑 Abrir Contas a Receber</button>
            <button onClick={loadDashFin} style={{
              background:"rgba(234,179,8,0.08)",border:"1px solid rgba(234,179,8,0.2)",
              color:"#fde68a",borderRadius:10,padding:"10px 14px",cursor:"pointer",
              textAlign:"left",fontSize:12,fontWeight:700,transition:"all 0.15s",
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(234,179,8,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(234,179,8,0.08)"}
            >{loadingFin?"⌛ Atualizando...":"🔄 Atualizar Dashboard"}</button>
          </div>
        </div>
      </div>
    </div>

    {/* Próximos vencimentos — tabela rápida */}
    <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:800,borderLeft:"4px solid #ef4444",paddingLeft:12}}>Próximos Vencimentos</h3>
        <button onClick={()=>setActiveTab("financeiro_pagar")} style={{
          background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",
          color:"#93c5fd",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:11,fontWeight:700,
        }}>Ver todos →</button>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={styles.tableMassa}>
          <thead>
            <tr>
              {["Vencimento","Fornecedor","Descrição","Valor","Status"].map(h=>(
                <th key={h} style={styles.thMassa}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contasPagar.slice(0,8).map((c,i)=>{
              const hoje=new Date();
              const at=c.vencimento&&!["PAGO","CONCILIADO"].includes(c.status)&&new Date(c.vencimento+"T12:00:00Z")<hoje;
              return (
                <tr key={i} style={styles.trBody}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  <td style={styles.tdMassa}>
                    <strong style={{color:at?"#ef4444":"#f1f5f9",fontSize:12.5}}>
                      {c.vencimento?new Date(c.vencimento+"T12:00:00Z").toLocaleDateString("pt-BR"):"-"}
                    </strong>
                  </td>
                  <td style={{...styles.tdMassa,color:"#94a3b8",fontSize:12}}>{c.fornecedor||"-"}</td>
                  <td style={{...styles.tdMassa,maxWidth:200}}>
                    <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:12}}>{c.descricao}</div>
                  </td>
                  <td style={styles.tdMassa}>
                    <span style={{color:"#ef4444",fontWeight:900,fontFamily:"monospace"}}>R$ {formatBRL(c.valor)}</span>
                  </td>
                  <td style={styles.tdMassa}>
                    <span style={{
                      background:getStatusColor(at?"ATRASADO":c.status)+"22",
                      color:getStatusColor(at?"ATRASADO":c.status),
                      border:`1px solid ${getStatusColor(at?"ATRASADO":c.status)}44`,
                      padding:"3px 8px",borderRadius:12,fontSize:10,fontWeight:800,
                      textTransform:"uppercase",letterSpacing:"0.06em",
                    }}>{at?"ATRASADO":c.status}</span>
                  </td>
                </tr>
              );
            })}
            {contasPagar.length===0&&(
              <tr><td colSpan={5} style={{...styles.tdMassa,textAlign:"center",padding:40,color:"#475569",fontSize:13}}>
                Nenhuma conta a pagar carregada.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

  </div>
)}

         {/* TAB: CONTAS A PAGAR */}
         {activeTab === "financeiro_pagar" && (() => {
  // Métricas derivadas do array atual
  const totalPagar = contasPagar.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const hoje = new Date();
  const vencidos = contasPagar.filter(c => {
    if (!c.vencimento || ["PAGO","CONCILIADO"].includes(c.status)) return false;
    return new Date(c.vencimento + 'T12:00:00Z') < hoje;
  });
  const totalVencido = vencidos.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const proximosSete = contasPagar.filter(c => {
    if (!c.vencimento || ["PAGO","CONCILIADO"].includes(c.status)) return false;
    const d = new Date(c.vencimento + 'T12:00:00Z');
    const diff = (d - hoje) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  const filtrados = filtroStatusPagar === "TODOS" ? contasPagar :
    filtroStatusPagar === "VENCIDOS" ? vencidos :
    contasPagar.filter(c => c.status === filtroStatusPagar);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>

      {/* ── KPI CARDS ── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16}}>
        {[
          { label:"Total Provisionado", value:`R$ ${formatBRL(totalPagar)}`, icon:"📋", color:"#ef4444", glow:"rgba(239,68,68,0.15)" },
          { label:"Vencidos", value:`R$ ${formatBRL(totalVencido)}`, icon:"⚠️", color: totalVencido>0?"#ef4444":"#10b981", glow: totalVencido>0?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.1)" },
          { label:"Vence em 7 dias", value:proximosSete.length, icon:"📅", color:"#f59e0b", glow:"rgba(245,158,11,0.15)" },
          { label:"Total de Registros", value:contasPagar.length, icon:"📄", color:"#3b82f6", glow:"rgba(59,130,246,0.15)" },
        ].map((k,i)=>(
          <div key={i} style={{
            background:"rgba(15,23,42,0.7)", backdropFilter:"blur(12px)",
            border:`1px solid ${k.glow.replace('0.15','0.3')}`,
            borderRadius:16, padding:"20px 22px",
            boxShadow:`0 0 24px ${k.glow}, 0 8px 24px rgba(0,0,0,0.3)`,
            transition:"transform 0.2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:9, color:"#64748b", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10}}>{k.label}</div>
                <div style={{fontSize:20, fontWeight:900, color:k.color, fontFamily:"monospace", letterSpacing:"-0.02em"}}>{k.value}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:12,background:`${k.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BARRA FILTROS + AÇÕES (mantém botões originais) ── */}
      <div style={{
        background:"rgba(15,23,42,0.7)", backdropFilter:"blur(12px)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 24px",
      }}>
        <div style={{display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end"}}>
          
          <div style={{flex:"1 1 220px"}}>
            <label style={styles.fieldLabel}>Pesquisar</label>
            <input
              style={{...styles.inputSmall, borderColor:"rgba(59,130,246,0.3)"}}
              placeholder="Fornecedor, NF, descrição..."
              value={financeiroBuscaPagar}
              onChange={e => setFinanceiroBuscaPagar(e.target.value)}
            />
          </div>
          <div>
            <label style={styles.fieldLabel}>Início</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataInicioPagar} onChange={e=>setFinanceiroDataInicioPagar(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Fim</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataFimPagar} onChange={e=>setFinanceiroDataFimPagar(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Status</label>
            <select style={{...styles.inputSmall, width:140}} value={filtroStatusPagar} onChange={e=>setFiltroStatusPagar(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="ABERTO">Em Aberto</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="PAGO">Pago</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>
          
          <button onClick={loadContasPagar} style={{...styles.exportBtn, background:"#eab308", color:"#000", boxShadow:"0 4px 15px rgba(234,179,8,0.4)"}}>
            🔍 BUSCAR
          </button>

          {/* BOTÃO OFX — mantém comportamento original (handleImportOFX) */}
          <div style={{position:"relative"}}>
            <input type="file" id="ofxUploadPagar" accept=".ofx,.pdf" style={{display:"none"}} onChange={handleImportOFX}/>
            <label htmlFor="ofxUploadPagar" style={{
              ...styles.exportBtn, background:"#10b981",
              display:"inline-flex", alignItems:"center", gap:8,
              boxShadow:"0 4px 15px rgba(16,185,129,0.4)", cursor:"pointer",
              borderRadius:12, padding:"12px 20px", fontWeight:"bold", fontSize:12, color:"#fff"
            }}>
              {loading ? "⌛ LENDO..." : "📥 CONCILIAR OFX"}
            </label>
          </div>

          {hasEditPermission && (
            <button onClick={()=>setShowAddObrigacaoModal(true)} style={{
              ...styles.exportBtn, background:"#3b82f6",
              boxShadow:"0 4px 15px rgba(59,130,246,0.4)",
            }}>
              ➕ NOVA OBRIGAÇÃO
            </button>
          )}
        </div>
      </div>

      {/* ── ALERTA VENCIDOS ── */}
      {vencidos.length > 0 && (
        <div style={{
          background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:12, padding:"12px 20px",
          display:"flex", alignItems:"center", gap:12,
        }}>
          <span style={{fontSize:20}}>🚨</span>
          <div>
            <span style={{color:"#ef4444", fontWeight:800, fontSize:13}}>
              {vencidos.length} parcela(s) vencida(s) totalizando R$ {formatBRL(totalVencido)}
            </span>
            <span style={{color:"#94a3b8", fontSize:12, marginLeft:8}}>— ação imediata recomendada</span>
          </div>
        </div>
      )}

      {/* ── TABELA (preserva TODOS os botões originais ✏️ 🗑️ 🚨) ── */}
      <div style={{...styles.cardFull, padding:0, overflow:"hidden"}}>
        <div style={{padding:"18px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <h2 style={{...styles.cardTitle, margin:0}}>Contas a Pagar & Provisões</h2>
          <span style={{fontSize:11, color:"#64748b"}}>{filtrados.length} registro(s)</span>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead>
              <tr>
                <th style={styles.thMassa}>Vencimento</th>
                <th style={styles.thMassa}>Fatura / Título</th>
                <th style={styles.thMassa}>Descrição</th>
                <th style={styles.thMassa}>Fornecedor</th>
                <th style={styles.thMassa}>NF</th>
                <th style={styles.thMassa}>Parcela</th>
                <th style={styles.thMassa}>Valor (R$)</th>
                <th style={styles.thMassa}>Status</th>
                {hasEditPermission && <th style={{...styles.thMassa, textAlign:"center"}}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.length > 0 ? filtrados.map((c, idx) => {
                const atrasado = c.vencimento && !["PAGO","CONCILIADO"].includes(c.status) && new Date(c.vencimento+"T12:00:00Z") < hoje;
                return (
                  <tr key={idx} style={{
                    ...styles.trBody,
                    background: atrasado ? "rgba(239,68,68,0.06)" : "transparent",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = atrasado ? "rgba(239,68,68,0.06)" : "transparent"}
                  >
                    <td style={styles.tdMassa}>
                      <strong style={{color: atrasado?"#ef4444":"#f1f5f9"}}>
                        {c.vencimento ? new Date(c.vencimento+"T12:00:00Z").toLocaleDateString("pt-BR") : "-"}
                      </strong>
                      {atrasado && <span style={{display:"block",fontSize:9,color:"#ef4444",fontWeight:700}}>VENCIDO</span>}
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#60a5fa",fontSize:11,fontWeight:700,display:"block"}}>{c.fatura||"FAT-000"}</span>
                      <span style={{color:"#64748b",fontSize:10}}>{c.titulo||"TIT-000"}</span>
                    </td>
                    <td style={{...styles.tdMassa, maxWidth:180}}>
                      <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:12.5,fontWeight:500}}>{c.descricao}</div>
                    </td>
                    <td style={{...styles.tdMassa, color:"#94a3b8", fontSize:12}}>{c.fornecedor||"-"}</td>
                    <td style={{...styles.tdMassa, color:"#64748b", fontSize:11}}>{c.numero_nf||"S/N"}</td>
                    <td style={{...styles.tdMassa, textAlign:"center"}}>
                      <span style={{background:"rgba(255,255,255,0.08)",padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>
                        {c.parcela_atual}/{c.qtd_parcelas}
                      </span>
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#ef4444",fontWeight:900,fontFamily:"monospace",fontSize:13}}>
                        R$ {formatBRL(c.valor)}
                      </span>
                    </td>
                    <td style={styles.tdMassa}>
                      {/* Badge de status melhorado mas preservando cores originais */}
                      <span style={{
                        background: getStatusColor(atrasado?"ATRASADO":c.status)+"22",
                        color: getStatusColor(atrasado?"ATRASADO":c.status),
                        border:`1px solid ${getStatusColor(atrasado?"ATRASADO":c.status)}44`,
                        padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:800,
                        textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap",
                      }}>
                        {atrasado ? "ATRASADO" : c.status}
                      </span>
                    </td>
                    {/* ── BOTÕES ORIGINAIS PRESERVADOS INTEGRALMENTE ── */}
                    {hasEditPermission && (
                      <td style={{...styles.tdMassa, textAlign:"center"}}>
                        <div style={{display:"flex", gap:6, justifyContent:"center"}}>
                          <button
                            onClick={()=>{ setContaToEdit(c); setShowEditContaModal(true); }}
                            style={{background:"rgba(59,130,246,0.15)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Editar Provisão"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(59,130,246,0.3)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(59,130,246,0.15)"}
                          >✏️</button>
                          <button
                            onClick={()=>handleExcluirParcela(c.id)}
                            style={{background:"rgba(239,68,68,0.12)",color:"#f87171",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Excluir APENAS esta Parcela"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.28)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.12)"}
                          >🗑️</button>
                          <button
                            onClick={()=>handleExcluirObrigacao(c.id_obrigacao, c.descricao)}
                            style={{background:"rgba(127,29,29,0.2)",color:"#fca5a5",border:"1px solid rgba(127,29,29,0.4)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,transition:"all 0.15s"}}
                            title="Excluir OBRIGAÇÃO INTEIRA e todas as parcelas"
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(127,29,29,0.4)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(127,29,29,0.2)"}
                          >🚨</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr><td colSpan={hasEditPermission?9:8} style={{...styles.tdMassa,textAlign:"center",color:"#475569",padding:50,fontSize:13}}>
                  Nenhuma conta a pagar encontrada.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
})()}

          {/* TAB: CONTAS A RECEBER */}
          {activeTab === "financeiro_receber" && (() => {
  const hoje = new Date();
  const totalReceber = contasReceber.reduce((s,c)=>s+(Number(c.valor)||0),0);
  const vencidosR = contasReceber.filter(c=>{
    if(!c.vencimento||["RECEBIDO","CONCILIADO"].includes(c.status)) return false;
    return new Date(c.vencimento+"T12:00:00Z")<hoje;
  });
  const totalVencidoR = vencidosR.reduce((s,c)=>s+(Number(c.valor)||0),0);
  const filtradosR = filtroStatusReceber==="TODOS"?contasReceber:
    filtroStatusReceber==="VENCIDOS"?vencidosR:
    contasReceber.filter(c=>c.status===filtroStatusReceber);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        {[
          {label:"Total a Receber",value:`R$ ${formatBRL(totalReceber)}`,icon:"💰",color:"#10b981",glow:"rgba(16,185,129,0.15)"},
          {label:"Vencidos",value:`R$ ${formatBRL(totalVencidoR)}`,icon:"⚠️",color:totalVencidoR>0?"#ef4444":"#10b981",glow:totalVencidoR>0?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.1)"},
          {label:"Em Aberto",value:contasReceber.filter(c=>c.status==="A RECEBER").length,icon:"📋",color:"#f59e0b",glow:"rgba(245,158,11,0.15)"},
          {label:"Recebidos",value:contasReceber.filter(c=>c.status==="RECEBIDO").length,icon:"✅",color:"#3b82f6",glow:"rgba(59,130,246,0.15)"},
        ].map((k,i)=>(
          <div key={i} style={{
            background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",
            border:`1px solid ${k.glow.replace("0.15","0.3")}`,borderRadius:16,
            padding:"20px 22px",boxShadow:`0 0 24px ${k.glow},0 8px 24px rgba(0,0,0,0.3)`,
            transition:"transform 0.2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:9,color:"#64748b",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{k.label}</div>
                <div style={{fontSize:20,fontWeight:900,color:k.color,fontFamily:"monospace"}}>{k.value}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:12,background:`${k.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{background:"rgba(15,23,42,0.7)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"20px 24px"}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:"1 1 220px"}}>
            <label style={styles.fieldLabel}>Pesquisar</label>
            <input style={{...styles.inputSmall,borderColor:"rgba(16,185,129,0.3)"}} placeholder="Cliente, NF..." value={financeiroBuscaReceber} onChange={e=>setFinanceiroBuscaReceber(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Início</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataInicioReceber} onChange={e=>setFinanceiroDataInicioReceber(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Fim</label>
            <input type="date" style={styles.inputSmall} value={financeiroDataFimReceber} onChange={e=>setFinanceiroDataFimReceber(e.target.value)}/>
          </div>
          <div>
            <label style={styles.fieldLabel}>Status</label>
            <select style={{...styles.inputSmall,width:140}} value={filtroStatusReceber} onChange={e=>setFiltroStatusReceber(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="A RECEBER">A Receber</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="RECEBIDO">Recebido</option>
              <option value="CONCILIADO">Conciliado</option>
            </select>
          </div>
          <button onClick={loadContasReceber} style={{...styles.exportBtn,background:"#eab308",color:"#000",boxShadow:"0 4px 15px rgba(234,179,8,0.4)"}}>🔍 BUSCAR</button>
          <div>
            <input type="file" id="ofxUploadReceber" accept=".ofx,.pdf" style={{display:"none"}} onChange={handleImportOFXReceber}/>
            <label htmlFor="ofxUploadReceber" style={{...styles.exportBtn,background:"#10b981",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 4px 15px rgba(16,185,129,0.4)",cursor:"pointer",borderRadius:12,padding:"12px 20px",fontWeight:"bold",fontSize:12,color:"#fff"}}>
              {loading?"⌛ IMPORTANDO...":"📥 IMPORTAR OFX"}
            </label>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div style={{...styles.cardFull,padding:0,overflow:"hidden"}}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{...styles.cardTitle,margin:0}}>Contas a Receber & Faturas</h2>
          <span style={{fontSize:11,color:"#64748b"}}>{filtradosR.length} registro(s)</span>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.tableMassa}>
            <thead>
              <tr>
                <th style={styles.thMassa}>Vencimento</th>
                <th style={styles.thMassa}>Fatura / Título</th>
                <th style={styles.thMassa}>Descrição</th>
                <th style={styles.thMassa}>Cliente</th>
                <th style={styles.thMassa}>NF</th>
                <th style={styles.thMassa}>Parcela</th>
                <th style={styles.thMassa}>Valor (R$)</th>
                <th style={styles.thMassa}>Status</th>
                {hasEditPermission && <th style={{...styles.thMassa,textAlign:"center"}}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtradosR.length>0?filtradosR.map((c,idx)=>{
                const atrasadoR=c.vencimento&&!["RECEBIDO","CONCILIADO"].includes(c.status)&&new Date(c.vencimento+"T12:00:00Z")<hoje;
                return (
                  <tr key={idx} style={{...styles.trBody,background:atrasadoR?"rgba(239,68,68,0.04)":"transparent"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background=atrasadoR?"rgba(239,68,68,0.04)":"transparent"}
                  >
                    <td style={styles.tdMassa}>
                      <strong style={{color:atrasadoR?"#ef4444":"#f1f5f9"}}>{c.vencimento?new Date(c.vencimento+"T12:00:00Z").toLocaleDateString("pt-BR"):"-"}</strong>
                      {atrasadoR&&<span style={{display:"block",fontSize:9,color:"#ef4444",fontWeight:700}}>VENCIDO</span>}
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#34d399",fontSize:11,fontWeight:700,display:"block"}}>{c.fatura||"FAT-000"}</span>
                      <span style={{color:"#64748b",fontSize:10}}>{c.titulo||"TIT-000"}</span>
                    </td>
                    <td style={{...styles.tdMassa,maxWidth:180}}>
                      <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontSize:12.5,fontWeight:500}}>{c.descricao}</div>
                    </td>
                    <td style={{...styles.tdMassa,color:"#94a3b8",fontSize:12}}>{c.cliente||"-"}</td>
                    <td style={{...styles.tdMassa,color:"#64748b",fontSize:11}}>{c.numero_nf||"S/N"}</td>
                    <td style={{...styles.tdMassa,textAlign:"center"}}>
                      <span style={{background:"rgba(255,255,255,0.08)",padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{c.parcela_atual}/{c.qtd_parcelas}</span>
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{color:"#4ade80",fontWeight:900,fontFamily:"monospace",fontSize:13}}>R$ {formatBRL(c.valor)}</span>
                    </td>
                    <td style={styles.tdMassa}>
                      <span style={{
                        background:getStatusColor(atrasadoR?"ATRASADO":c.status)+"22",
                        color:getStatusColor(atrasadoR?"ATRASADO":c.status),
                        border:`1px solid ${getStatusColor(atrasadoR?"ATRASADO":c.status)}44`,
                        padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:800,
                        textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap",
                      }}>{atrasadoR?"ATRASADO":c.status}</span>
                    </td>
                    {/* BOTÕES ORIGINAIS PRESERVADOS ✏️ 💲 */}
                    {hasEditPermission&&(
                      <td style={{...styles.tdMassa,textAlign:"center"}}>
                        <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                          <button style={{background:"rgba(59,130,246,0.12)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}} title="Editar">✏️</button>
                          <button style={{background:"rgba(16,185,129,0.12)",color:"#34d399",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14}} title="Baixar/Receber">💲</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }):(
                <tr><td colSpan={hasEditPermission?9:8} style={{...styles.tdMassa,textAlign:"center",color:"#475569",padding:50,fontSize:13}}>
                  Nenhuma conta a receber encontrada.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
})()}

          {/* TAB: ESTOQUE DE VENDAS */}
          {activeTab === "estoque_vendas" && (
            <div style={styles.cardFull}>

              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Estoque de Veículos (Vendas)</h2>

                <div style={{display: 'flex', gap: 15, alignItems: 'flex-end', flexWrap: 'wrap'}}>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Pesquisar</label>
                    <input style={{...styles.inputSmall, width: '250px'}} placeholder="Onix, ABC-1234..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} />
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Linhas</label>
                    <select style={styles.inputSmall} value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Status</label>
                    <select style={styles.inputSmall} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="Todos">Todos</option>
                      <option value="Disponível">Disponível</option>
                      <option value="Locado">Locado</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Vendido">Vendido</option>
                    </select>
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Início</label>
                    <input type="date" style={styles.inputSmall} value={filterStart} onChange={e => setFilterStart(e.target.value)} />
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Fim</label>
                    <input type="date" style={styles.inputSmall} value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
                  </div>
                  <button onClick={loadInventoryVendas} style={{...styles.exportBtn, background: '#eab308', color: '#000', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)'}}>🔍 PESQUISAR</button>
                  <button onClick={() => exportInventoryXLSX('venda')} style={{...styles.exportBtn, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}}>📥 XLSX</button>
                </div>
              </div>

              {hasEditPermission && selectedInventoryItems.length > 0 && (
                <div style={styles.bulkActionBox}>
                  <span style={{fontSize: '13px', fontWeight: 'bold', color: '#eab308'}}>{selectedInventoryItems.length} veículo(s) selecionado(s)</span>
                  <div style={{width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)'}} />
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <label style={{fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8'}}>Alterar Status:</label>
                    <select style={{...styles.inputSmall, width: '150px'}} onChange={(e) => handleBulkStatusChange(e.target.value)} value="">
                      <option value="">Selecione...</option>
                      <option value="Disponível">Disponível</option>
                      <option value="Locado">Locado</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Vendido">Vendido</option>
                    </select>
                  </div>
                  <button onClick={handleBulkDelete} style={{...styles.clearResultsBtn, padding: '8px 15px'}}>🗑️ EXCLUIR</button>
                  <button onClick={() => setSelectedInventoryItems([])} style={styles.unselectBtn}>Desmarcar todos</button>
                </div>
              )}

              <div style={styles.tableWrapper}>
                <table style={{...styles.tableMassa, minWidth: '1500px'}}>
                  <thead>
                    <tr>
                      {hasEditPermission && (
                        <th style={{...styles.thMassa, width: '40px', textAlign: 'center'}}>
                          <input type="checkbox" checked={selectedInventoryItems.length === filteredInventory.length && filteredInventory.length > 0} onChange={handleSelectAllInventory} />
                        </th>
                      )}
                      <th style={styles.thMassa}>Placa</th>
                      <th style={styles.thMassa}>Marca</th>
                      <th style={styles.thMassa}>Modelo</th>
                      <th style={styles.thMassa}>Ano</th>
                      <th style={styles.thMassa}>Cor</th>
                      <th style={styles.thMassa}>Combustível</th>
                      <th style={styles.thMassa}>Carroceria</th>
                      <th style={styles.thMassa}>Chassi</th>
                      <th style={styles.thMassa}>Renavam</th>
                      <th style={styles.thMassa}>Aquisição</th>
                      <th style={styles.thMassa}>Valor</th>
                      <th style={styles.thMassa}>Valor FIPE</th>
                      <th style={styles.thMassa}>Hodômetro</th>
                      <th style={styles.thMassa}>Status</th>
                      {hasEditPermission && <th style={{...styles.thMassa, textAlign: 'center'}}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventory.length > 0 ? paginatedInventory.map((v, idx) => (
                      <tr key={idx} style={{...styles.trBody, backgroundColor: selectedInventoryItems.includes(v.placa) ? 'rgba(234, 179, 8, 0.1)' : 'transparent'}}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = selectedInventoryItems.includes(v.placa) ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedInventoryItems.includes(v.placa) ? 'rgba(234, 179, 8, 0.1)' : 'transparent'}
                      >
                        {hasEditPermission && (
                          <td style={{...styles.tdMassa, textAlign: 'center'}}>
                            <input type="checkbox" checked={selectedInventoryItems.includes(v.placa)} onChange={() => toggleInventorySelection(v.placa)} />
                          </td>
                        )}
                        <td style={styles.tdMassa}><strong>{v.placa}</strong></td>
                        <td style={styles.tdMassa}>{v.marca}</td>
                        <td style={styles.tdMassa}>{v.modelo}</td>
                        <td style={styles.tdMassa}>{v.ano}</td>
                        <td style={styles.tdMassa}>{v.cor}</td>
                        <td style={styles.tdMassa}>{v.combustivel}</td>
                        <td style={styles.tdMassa}>{v.carroceria}</td>
                        <td style={styles.tdMassa}>{v.chassi}</td>
                        <td style={styles.tdMassa}>{v.renavam}</td>
                        <td style={styles.tdMassa}>{v.data_aquisicao ? new Date(v.data_aquisicao).toLocaleDateString('pt-BR') : "-"}</td>
                        <td style={styles.tdMassa}>R$ {formatBRL(v.valor_aquisicao)}</td>
                        <td style={styles.tdMassa}>R$ {formatBRL(v.valor_fipe || 0)}</td>
                        <td style={styles.tdMassa}>{v.hodometro ? Number(v.hodometro).toLocaleString('pt-BR') : 0} KM</td>
                        <td style={styles.tdMassa}>
                          <span style={{
                            background: v.status === 'Disponível' ? 'rgba(16,185,129,0.15)' : v.status === 'Vendido' ? 'rgba(59,130,246,0.15)' : v.status === 'Manutenção' ? 'rgba(234,179,8,0.15)' : 'rgba(148,163,184,0.1)',
                            color: v.status === 'Disponível' ? '#10b981' : v.status === 'Vendido' ? '#3b82f6' : v.status === 'Manutenção' ? '#eab308' : '#94a3b8',
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800
                          }}>{v.status}</span>
                        </td>
                        {hasEditPermission && (
                          <td style={{...styles.tdMassa, textAlign: 'center'}}>
                            <button onClick={() => openEditModal(v, "Venda")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '10px'}} title="Editar">✏️</button>
                            <button onClick={() => handleDeleteVehicle(v.placa, "Venda")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'}} title="Excluir">🗑️</button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="16" style={{...styles.tdMassa, textAlign: 'center', color: '#94a3b8', padding: '40px'}}>
                          Nenhum veículo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', alignItems: 'center'}}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={styles.clearResultsBtn}>Anterior</button>
                <span style={{fontSize: '13px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>Página {currentPage} de {totalPages || 1}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={styles.clearResultsBtn}>Próxima</button>
              </div>
            </div>
          )}

                    {/* TAB: ESTOQUE DE LOCAÇÃO */}
          {activeTab === "estoque_locacao" && (
            <div style={styles.cardFull}>
              
              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Estoque de Veículos (Locação)</h2>
                
                <div style={{display: 'flex', gap: 15, alignItems: 'flex-end', flexWrap: 'wrap'}}>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Pesquisar</label>
                    <input style={{...styles.inputSmall, width: '250px'}} placeholder="Onix, ABC-1234..." value={inventorySearchLocacao} onChange={(e) => setInventorySearchLocacao(e.target.value)} />
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Linhas</label>
                    <select style={styles.inputSmall} value={rowsPerPageLocacao} onChange={e => {setRowsPerPageLocacao(Number(e.target.value)); setCurrentPageLocacao(1);}}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Status</label>
                    <select style={styles.inputSmall} value={filterStatusLocacao} onChange={e => setFilterStatusLocacao(e.target.value)}>
                      <option value="Todos">Todos</option>
                      <option value="Ociosos">Ociosos</option>
                      <option value="Locados">Locados</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Vendidos">Vendidos</option>
                    </select>
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Início</label>
                    <input type="date" style={styles.inputSmall} value={filterStartLocacao} onChange={e => setFilterStartLocacao(e.target.value)} />
                  </div>
                  <div style={{textAlign: 'left'}}>
                    <label style={styles.fieldLabel}>Fim</label>
                    <input type="date" style={styles.inputSmall} value={filterEndLocacao} onChange={e => setFilterEndLocacao(e.target.value)} />
                  </div>
                  <button onClick={loadInventoryLocacao} style={{...styles.exportBtn, background: '#eab308', color: '#000', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)'}}>🔍 PESQUISAR</button>
                  <button onClick={() => exportInventoryXLSX('locacao')} style={{...styles.exportBtn, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}}>📥 XLSX</button>
                </div>
              </div>

              {hasEditPermission && selectedInventoryItemsLocacao.length > 0 && (
                <div style={styles.bulkActionBox}>
                  <span style={{fontSize: '13px', fontWeight: 'bold', color: '#eab308'}}>{selectedInventoryItemsLocacao.length} veículo(s) selecionado(s)</span>
                  <div style={{width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)'}} />
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <label style={{fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8'}}>Alterar Status:</label>
                    <select style={{...styles.inputSmall, width: '150px'}} onChange={(e) => handleBulkStatusChangeLocacao(e.target.value)} value="">
                      <option value="">Selecione...</option>
                      <option value="Ociosos">Ociosos</option>
                      <option value="Locados">Locados</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Vendidos">Vendidos</option>
                    </select>
                  </div>
                  <button onClick={handleBulkDeleteLocacao} style={{...styles.clearResultsBtn, padding: '8px 15px'}}>🗑️ EXCLUIR</button>
                  <button onClick={() => setSelectedInventoryItemsLocacao([])} style={styles.unselectBtn}>Desmarcar todos</button>
                </div>
              )}

              <div style={styles.tableWrapper}>
                <table style={{...styles.tableMassa, minWidth: '1500px'}}>
                  <thead>
                    <tr>
                      {hasEditPermission && (
                        <th style={{...styles.thMassa, width: '40px', textAlign: 'center'}}>
                          <input type="checkbox" checked={selectedInventoryItemsLocacao.length === filteredInventoryLocacao.length && filteredInventoryLocacao.length > 0} onChange={handleSelectAllInventoryLocacao} />
                        </th>
                      )}
                      <th style={styles.thMassa}>Placa</th>
                      <th style={styles.thMassa}>Marca</th>
                      <th style={styles.thMassa}>Modelo</th>
                      <th style={styles.thMassa}>Ano</th>
                      <th style={styles.thMassa}>Cor</th>
                      <th style={styles.thMassa}>Combustível</th>
                      <th style={styles.thMassa}>Carroceria</th>
                      <th style={styles.thMassa}>Chassi</th>
                      <th style={styles.thMassa}>Renavam</th>
                      <th style={styles.thMassa}>Aquisição</th>
                      <th style={styles.thMassa}>Valor</th>
                      <th style={styles.thMassa}>Valor FIPE</th>
                      <th style={styles.thMassa}>Hodômetro</th>
                      <th style={styles.thMassa}>Status</th>
                      {hasEditPermission && <th style={{...styles.thMassa, textAlign: 'center'}}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInventoryLocacao.length > 0 ? paginatedInventoryLocacao.map((v, idx) => (
                      <tr key={idx} style={{...styles.trBody, backgroundColor: selectedInventoryItemsLocacao.includes(v.placa) ? 'rgba(234, 179, 8, 0.1)' : 'transparent'}}>
                        
                        {hasEditPermission && (
                          <td style={{...styles.tdMassa, textAlign: 'center'}}>
                            <input type="checkbox" checked={selectedInventoryItemsLocacao.includes(v.placa)} onChange={() => toggleInventorySelectionLocacao(v.placa)} />
                          </td>
                        )}
                        
                        <td style={styles.tdMassa}><strong>{v.placa}</strong></td>
                        <td style={styles.tdMassa}>{v.marca}</td>
                        <td style={styles.tdMassa}>{v.modelo}</td>
                        <td style={styles.tdMassa}>{v.ano}</td>
                        <td style={styles.tdMassa}>{v.cor}</td>
                        <td style={styles.tdMassa}>{v.combustivel}</td>
                        <td style={styles.tdMassa}>{v.carroceria}</td>
                        <td style={styles.tdMassa}>{v.chassi}</td>
                        <td style={styles.tdMassa}>{v.renavam}</td>
                        <td style={styles.tdMassa}>{v.data_aquisicao ? new Date(v.data_aquisicao).toLocaleDateString('pt-BR') : "-"}</td>
                        <td style={styles.tdMassa}>R$ {formatBRL(v.valor_aquisicao)}</td>
                        <td style={styles.tdMassa}>R$ {formatBRL(v.valor_fipe || 0)}</td>
                        <td style={styles.tdMassa}>{v.hodometro ? Number(v.hodometro).toLocaleString('pt-BR') : 0} KM</td>
                        <td style={styles.tdMassa}>
                          <span style={{color: getStatusColor(v.status), fontWeight: 'bold'}}>{v.status}</span>
                        </td>
                        
                        {hasEditPermission && (
                          <td style={{...styles.tdMassa, textAlign: 'center'}}>
                            <button onClick={() => openEditModal(v, "Locação")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '10px'}} title="Editar">✏️</button>
                            <button onClick={() => handleDeleteVehicle(v.placa, "Locação")} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'}} title="Excluir">🗑️</button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="16" style={{...styles.tdMassa, textAlign: 'center', color: '#94a3b8', padding: '40px'}}>
                          Nenhum veículo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', alignItems: 'center'}}>
                <button disabled={currentPageLocacao === 1} onClick={() => setCurrentPageLocacao(prev => prev - 1)} style={styles.clearResultsBtn}>Anterior</button>
                <span style={{fontSize: '13px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>Página {currentPageLocacao} de {totalPagesLocacao || 1}</span>
                <button disabled={currentPageLocacao >= totalPagesLocacao} onClick={() => setCurrentPageLocacao(prev => prev + 1)} style={styles.clearResultsBtn}>Próxima</button>
              </div>
            </div>
          )}

          {/* TAB: CONTAS BANCÁRIAS */}
          {activeTab === "contas_bancarias" && (
            <ContasBancarias fornecedores={fornecedores} />
          )}

          {/* TAB: CLIENTES */}
          {activeTab === "clientes" && (
            <Clientes />
          )}

          {/* TAB: FORNECEDORES */}
          {activeTab === "fornecedores" && (
            <Fornecedores />
          )}

          {/* TAB: GESTÃO DE FROTA (CADASTRO MANUAL E IMPORTAÇÃO) */}
          {activeTab === "frota" && (currentUser?.role === 'admin' || currentUser?.role === 'gestor') && (
            <div style={styles.dashboardWrapper}>
               <div style={styles.configSection}>
                 
                 <section style={styles.cardVehicles}>
                    <h2 style={styles.cardTitle}>Cadastro de Estoque Real</h2>
                    <form onSubmit={handleManualSubmit} style={styles.inventoryGrid}>
                      
                      <div style={{...styles.inputGroup, gridColumn: 'span 2', background: 'rgba(234, 179, 8, 0.15)', padding: 15, borderRadius: 12, border: '1px solid #eab308'}}>
                        <label style={{...styles.fieldLabel, color: '#eab308'}}>ESTOQUE DE DESTINO DO VEÍCULO:</label>
                        <select style={{...styles.inputSmall, border: '1px solid #eab308'}} value={newVehicle.tipo_estoque} onChange={e => setNewVehicle({...newVehicle, tipo_estoque: e.target.value})} required>
                          <option value="Venda">ESTOQUE DE VENDAS</option>
                          <option value="Locação">ESTOQUE DE LOCAÇÃO</option>
                        </select>
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Placa</label>
                        <input style={styles.inputSmall} value={newVehicle.placa} onChange={e => setNewVehicle({...newVehicle, placa: e.target.value})} placeholder="ABC-1234" required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Chassi</label>
                        <input style={styles.inputSmall} value={newVehicle.chassi} onChange={e => setNewVehicle({...newVehicle, chassi: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Renavam</label>
                        <input style={styles.inputSmall} value={newVehicle.renavam} onChange={e => setNewVehicle({...newVehicle, renavam: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Marca</label>
                        <input style={styles.inputSmall} value={newVehicle.marca} onChange={e => setNewVehicle({...newVehicle, marca: e.target.value})} required />
                      </div>
                      
                      <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                        <label style={styles.fieldLabel}>Modelo</label>
                        <input style={styles.inputSmall} value={newVehicle.modelo} placeholder="Ex: ONIX HATCH 1.0 12V Flex 5p Mec." required onChange={e => setNewVehicle({...newVehicle, modelo: e.target.value})} />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Ano</label>
                        <input type="number" style={styles.inputSmall} value={newVehicle.ano} onChange={e => setNewVehicle({...newVehicle, ano: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Cor</label>
                        <input style={styles.inputSmall} value={newVehicle.cor} onChange={e => setNewVehicle({...newVehicle, cor: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Combustível</label>
                        <select style={styles.inputSmall} value={newVehicle.combustivel} onChange={e => setNewVehicle({...newVehicle, combustivel: e.target.value})} required>
                          <option value="">Selecione</option>
                          <option value="Flex">Flex</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Elétrico">Elétrico</option>
                          <option value="Gasolina">Gasolina</option>
                          <option value="Álcool">Álcool</option>
                          <option value="Híbrido">Híbrido</option>
                        </select>
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Carroceria</label>
                        <select style={styles.inputSmall} value={newVehicle.carroceria} onChange={e => setNewVehicle({...newVehicle, carroceria: e.target.value})} required>
                          <option value="">Selecione</option>
                          <option value="SUV">SUV</option>
                          <option value="Hatch">Hatch</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Furgão">Furgao</option>
                          <option value="Pickup">Pickup</option>
                        </select>
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Valor Aquisição</label>
                        <input type="number" style={styles.inputSmall} value={newVehicle.valor_aquisicao} onChange={e => setNewVehicle({...newVehicle, valor_aquisicao: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Valor FIPE</label>
                        <input type="number" style={styles.inputSmall} value={newVehicle.valor_fipe} onChange={e => setNewVehicle({...newVehicle, valor_fipe: e.target.value})} required />
                      </div>
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.fieldLabel}>Hodômetro (KM)</label>
                        <input type="number" style={styles.inputSmall} value={newVehicle.hodometro} onChange={e => setNewVehicle({...newVehicle, hodometro: e.target.value})} required />
                      </div>
                      
                      <button type="submit" style={{...styles.buttonProcess, gridColumn: 'span 2'}} disabled={loading}>
                        {loading ? "PROCESSANDO..." : "SALVAR NO ESTOQUE"}
                      </button>
                    </form>
                 </section>

                 <section style={styles.cardParams}>
                    <h2 style={styles.cardTitle}>Importação Rápida</h2>
                    <div style={{marginTop: '30px', textAlign: 'center'}}>
                        
                       <button onClick={handleDownloadModel} style={{...styles.clearBtn, color: '#eab308', border: '1px solid #eab308', width: '100%', marginBottom: 15, padding: 12}}>
                          📥 BAIXAR MODELO XLSX
                       </button>
                       
                       <div style={{border: '2px dashed rgba(255,255,255,0.2)', padding: '40px', borderRadius: '24px', background: 'rgba(0,0,0,0.2)'}}>
                          <div style={{marginBottom: '20px', textAlign: 'left'}}>
                            <label style={{...styles.fieldLabel, color: '#fff'}}>Destino do Lote Importado:</label>
                            <select style={{...styles.inputSmall, marginTop: 5}} value={importTipoEstoque} onChange={e => setImportTipoEstoque(e.target.value)}>
                              <option value="Venda">Estoque de Vendas</option>
                              <option value="Locação">Estoque de Locação</option>
                            </select>
                          </div>
                          
                          <span style={{fontSize: 40, display: 'block', marginBottom: '15px'}}>📄</span>
                          <p style={{color: '#94a3b8', fontSize: 13, marginBottom: '25px'}}>Selecione arquivo XLSX/CSV</p>
                          
                          <input type="file" id="bulkInp" accept=".csv, .xlsx" style={{display: 'none'}} onChange={handleFileUpload} />
                          <label htmlFor="bulkInp" style={{
                            ...styles.buttonProcess, 
                            padding: '12px 20px', 
                            cursor: 'pointer',
                            display: 'inline-block',
                            width: 'auto',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            height: 'auto'
                          }}>
                            {importLoading ? "LENDO..." : "SELECIONAR E CONFERIR"}
                          </label>
                       </div>
                       
                    </div>
                 </section>
                 
               </div>
            </div>
          )}

          {/* TAB: USUARIOS E PERMISSÕES */}
          {activeTab === "usuarios" && (currentUser?.role === 'admin' || currentUser?.role === 'gestor') && (
             <div style={styles.cardFull}>
               <h2 style={styles.cardTitle}>Gestão de Usuários</h2>
               <div style={{display: 'flex', gap: '30px', marginTop: '20px', alignItems: 'flex-start'}}>
                 
                 <div style={{flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '20px'}}>
                     <h3 style={{fontSize: '14px', marginBottom: '15px', color: '#eab308'}}>Novo Acesso</h3>
                     <form onSubmit={handleAddUser}>
                        <div style={styles.inputGroup}>
                          <label style={styles.fieldLabel}>Nome</label>
                          <input style={styles.inputSmall} value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} required/>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.fieldLabel}>E-mail</label>
                          <input type="email" style={styles.inputSmall} value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} required/>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.fieldLabel}>Senha Provisória</label>
                          <input style={styles.inputSmall} value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} required/>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.fieldLabel}>Nível de Acesso</label>
                           <select style={styles.inputSmall} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                             <option value="consultor">Consultor</option>
                             {currentUser?.role === 'admin' && <option value="gestor">Gestor</option>}
                           </select>
                        </div>
                        <button type="submit" style={{...styles.buttonProcess, marginTop: '5px', padding: '12px'}}>
                          CRIAR CONTA
                        </button>
                     </form>
                 </div>

                 <div style={{flex: 2, overflowX: 'auto'}}>
                     <table style={{...styles.tableMassa}}>
                        <thead>
                           <tr>
                             <th style={styles.thMassa}>Nome</th>
                             <th style={styles.thMassa}>E-mail</th>
                             <th style={styles.thMassa}>Função</th>
                             <th style={{...styles.thMassa, textAlign: 'center'}}>Ações e Permissões</th>
                           </tr>
                        </thead>
                        <tbody>
                           {visibleUsersList.map((u, i) => (
                              <tr key={i} style={styles.trBody}>
                                 <td style={styles.tdMassa}>{u.name}</td>
                                 <td style={styles.tdMassa}>{u.email}</td>
                                 <td style={styles.tdMassa}>
                                   <span style={{
                                     background: 'rgba(0,0,0,0.5)', 
                                     border: '1px solid rgba(255,255,255,0.1)',
                                     padding: '5px 10px', 
                                     borderRadius: '8px', 
                                     fontSize: '10px', 
                                     textTransform: 'uppercase', 
                                     color: u.role==='admin' ? '#f87171' : u.role==='gestor' ? '#60a5fa' : '#94a3b8'
                                   }}>
                                     {u.role}
                                   </span>
                                 </td>
                                 <td style={{...styles.tdMassa, textAlign: 'center'}}>
                                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                      {u.role !== 'admin' && u.role !== 'gestor' ? (
                                         <button onClick={() => toggleUserEditPermission(u.id)} style={{
                                            background: u.canEdit ? '#10b981' : 'rgba(248, 113, 113, 0.2)', 
                                            color: u.canEdit ? '#fff' : '#f87171', 
                                            border: 'none', 
                                            padding: '6px 12px', 
                                            borderRadius: '8px', 
                                            fontSize: '10px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            boxShadow: u.canEdit ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                                         }}>
                                            {u.canEdit ? "✔ EDIÇÃO" : "✖ BLOQUEADO"}
                                         </button>
                                      ) : (
                                        <span style={{fontSize: '11px', color: '#64748b'}}>Permissão Nativa</span>
                                      )}
                                      
                                      {(currentUser?.role === 'admin' || (currentUser?.role === 'gestor' && u.role === 'consultor')) && (
                                        <button 
                                          onClick={() => handleResetUserPassword(u.id)} 
                                          style={styles.clearBtn}
                                          title="Redefinir senha para padrão (123)"
                                        >
                                          🔄 RESETAR SENHA
                                        </button>
                                      )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                 </div>
                 
               </div>
             </div>
          )}

          {/* TAB: AUDITORIA / LOGS */}
          {activeTab === "logs" && (currentUser?.role === 'admin' || currentUser?.role === 'gestor') && (
             <div style={styles.cardFull}>
               <h2 style={styles.cardTitle}>Auditoria e Logs de Estoque</h2>
               <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 20}}>
                 Histórico de todas as ações de cadastro, edição e exclusão no sistema.
               </p>
               
               <div style={{maxHeight: '600px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', background: 'rgba(0,0,0,0.2)'}}>
                  <table style={styles.tableMassa}>
                     <thead>
                        <tr>
                          <th style={styles.thMassa}>Data/Hora</th>
                          <th style={styles.thMassa}>Usuário</th>
                          <th style={styles.thMassa}>Nível</th>
                          <th style={styles.thMassa}>Ação</th>
                          <th style={styles.thMassa}>Detalhe</th>
                        </tr>
                     </thead>
                     <tbody>
                        {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                           <tr key={i} style={styles.trBody}>
                              <td style={{...styles.tdMassa, fontSize: '11px'}}>{log.date}</td>
                              <td style={{...styles.tdMassa, fontWeight: 'bold', color: '#eab308'}}>{log.user}</td>
                              <td style={styles.tdMassa}>
                                <span style={{
                                  fontSize: '9px', 
                                  textTransform: 'uppercase', 
                                  background: 'rgba(255,255,255,0.1)', 
                                  padding: '3px 8px', 
                                  borderRadius: '6px'
                                }}>
                                  {log.role}
                                </span>
                              </td>
                              <td style={styles.tdMassa}>{log.action}</td>
                              <td style={{...styles.tdMassa, color: '#94a3b8'}}>{log.detail}</td>
                           </tr>
                        )) : (
                           <tr>
                             <td colSpan="5" style={{...styles.tdMassa, textAlign: 'center', padding: '40px', color: '#64748b'}}>
                               Nenhuma ação registrada na sessão atual.
                             </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
             </div>
          )}

          {/* TAB: ATUALIZAR FIPE */}
          {activeTab === "fipe" && currentUser?.role === 'admin' && (
            <div style={styles.cardFull}>
              <h2 style={styles.cardTitle}>Sincronizador FIPE Inteligente (2023-2026)</h2>
              <p style={{color: '#94a3b8', fontSize: 14, marginBottom: 25}}>
                Configure a montadora para atualização e gravação estrita da base de dados PostgreSQL.
              </p>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px'}}>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Montadora / Marca</label>
                  <select style={styles.inputSmall} value={syncMarca} onChange={e => setSyncMarca(e.target.value)}>
                    <option value="Fiat">Fiat</option>
                    <option value="VW">VW</option>
                    <option value="Chevrolet">Chevrolet</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Hyundai">Hyundai</option>
                    <option value="Renault">Renault</option>
                    <option value="Honda">Honda</option>
                    <option value="Nissan">Nissan</option>
                    <option value="Jeep">Jeep</option>
                    <option value="BYD">BYD</option>
                    <option value="GWM">GWM</option>
                    <option value="Caoa Chery">Caoa Chery</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Modelo (Opcional)</label>
                  <input style={styles.inputSmall} placeholder="Ex: HAVAL" value={syncModelo} onChange={e => setSyncModelo(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.fieldLabel}>Ano de Fabr. (Opcional)</label>
                  <input type="number" style={styles.inputSmall} placeholder="Ex: 2025" value={syncAno} onChange={e => setSyncAno(e.target.value)} />
                </div>
              </div>

              {syncingFipe && (
                <div style={{marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <span style={{fontSize: '12px', color: '#eab308', fontWeight: 'bold'}}>Status do Sincronizador Estrito:</span>
                    <span style={{fontSize: '12px', color: '#eab308', fontWeight: 'bold'}}>{syncProgress}%</span>
                  </div>
                  <div style={{width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{width: `${syncProgress}%`, height: '100%', background: '#eab308', transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'}}></div>
                  </div>
                </div>
              )}

              <div style={{
                background: '#020617', 
                color: '#4ade80', 
                fontFamily: 'monospace', 
                padding: '15px', 
                borderRadius: '12px', 
                height: '200px', 
                overflowY: 'auto', 
                marginBottom: '20px',
                fontSize: '12px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.5)'
              }}>
                {syncLogs.length === 0 ? "> Aguardando comando para gravar registros..." : syncLogs.map((log, i) => (
                  <div key={i}> {`> ${log}`}</div>
                ))}
              </div>

              <div style={{display: 'flex', gap: '15px'}}>
                <button 
                  onClick={handleSyncFipe} 
                  disabled={syncingFipe} 
                  style={{
                    ...styles.buttonProcess, 
                    width: 'auto', 
                    padding: '16px 40px', 
                    opacity: syncingFipe ? 0.6 : 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px'
                  }}
                >
                  {syncingFipe ? "⌛ GRAVANDO REGISTROS..." : "🔄 INICIAR ATUALIZAÇÃO REAIS"}
                </button>

                {syncingFipe && (
                  <button 
                    onClick={handleStopSync}
                    style={{
                      ...styles.clearResultsBtn,
                      background: 'rgba(127, 29, 29, 0.8)',
                      color: '#fff',
                      border: 'none',
                      padding: '0 30px',
                      boxShadow: '0 4px 15px rgba(127, 29, 29, 0.4)'
                    }}
                  >
                    ⏹️ INTERROMPER
                  </button>
                )}
              </div>
              
              {(lastFipeUpdate || syncSummary) && (
                <div style={{
                  marginTop: 25, 
                  padding: 20, 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  borderRadius: 15, 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
                }}>
                  <h4 style={{margin: '0 0 5px 0', color: '#4ade80'}}>✅ Gravação PostgreSQL Finalizada</h4>
                  <p style={{margin: 0, color: '#cbd5e1', fontSize: '13px'}}>
                    {syncSummary || "Todos os registros foram gravados e normalizados."}
                  </p>
                  <p style={{marginTop: 10, fontSize: '11px', color: '#94a3b8'}}>
                    Último check: {lastFipeUpdate}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: CONFIGS SISTEMA (LOGOS) */}
          {activeTab === "config_sistema" && currentUser?.role === 'admin' && (
             <div style={styles.cardFull}>
               <h2 style={styles.cardTitle}>Personalização Visual do Sistema</h2>
               <p style={{color: '#94a3b8', fontSize: 13, marginBottom: 20}}>
                 Altere os logotipos principais do sistema utilizando imagens no formato JPG ou PNG.
               </p>
               
               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px'}}>
                 
                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Tela de Login</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)'}}>
                        <img src={sysLogos.login} alt="Login Logo" style={{maxHeight: '60px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoLogin" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'login')} />
                     <label htmlFor="logoLogin" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px'}}>Substituir Imagem</label>
                  </div>

                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Sidebar (Menu Lateral)</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.3)'}}>
                        <img src={sysLogos.sidebar} alt="Sidebar Logo" style={{maxHeight: '40px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoSidebar" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'sidebar')} />
                     <label htmlFor="logoSidebar" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px'}}>Substituir Imagem</label>
                  </div>

                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '25px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Proposta PDF (Download)</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}}>
                        <img src={sysLogos.pdf} alt="PDF Logo" style={{maxHeight: '60px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoPdf" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'pdf')} />
                     <label htmlFor="logoPdf" style={{...styles.clearBtn, color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'block', padding: '12px', borderRadius: '10px'}}>Substituir Imagem</label>
                  </div>

               </div>
             </div>
          )}

          {/* TAB: CALCULADORA */}
          {activeTab === "calculadora" && (
            <div style={styles.calculatorWrapper}>
              <div style={styles.configSection}>
                
                <section style={styles.cardVehicles}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>1. Seleção de Veículos</h2>
                    <button onClick={resetVehicles} style={styles.clearBtn}>
                      Limpar ({selectedVehicles.length})
                    </button>
                  </div>
                  
                  <div style={{marginBottom: '15px'}}>
                    <select 
                      style={styles.inputSearch} 
                      value={selectedBrand} 
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      {availableBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  
                  <input 
                    style={styles.inputSearch} 
                    placeholder="Filtrar por nome ou grupo..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                  
                  <div style={styles.modelsBox}>
                    {loading && models.length === 0 && (
                      <p style={{textAlign: 'center', fontSize: 12, padding: 20}}>Aguarde...</p>
                    )}
                    {filteredModels.map(m => (
                      <label key={m.model_name_clean} style={styles.modelItem}>
                        <input 
                          type="checkbox" 
                          checked={selectedVehicles.includes(m.model_name_clean)} 
                          onChange={() => setSelectedVehicles(prev => prev.includes(m.model_name_clean) ? prev.filter(x => x !== m.model_name_clean) : [...prev, m.model_name_clean])} 
                        />
                        <div style={styles.modelText}>
                          <span style={styles.modelName}>
                            {m.brand_name?.toUpperCase() || 'N/A'} - {String(m.model_name || '').trim()} - { (m.year_model === 32000 || m.year === 32000) ? 2026 : (m.year_model || m.year || '')}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>
                
                <section style={styles.cardParams}>
                  <div style={styles.headerTitleAction}>
                    <h2 style={styles.cardTitle}>2. Ajuste de Parâmetros</h2>
                    <button onClick={resetParams} style={styles.clearBtn}>Resetar</button>
                  </div>
                  
                  <div style={styles.formGrid}>
                    <Field label="Valor Financiado (R$)" value={valorFinanciado} setValue={setValorFinanciado} />
                    <Field label="Prazo Financ. (Meses)" value={nperFinanciamento} setValue={setNperFinanciamento} />
                    
                    <div style={styles.inputGroup}>
                      <label style={styles.fieldLabel}>Franquia KM/mês</label>
                      <select style={styles.inputSmall} value={franquiaKm} onChange={(e) => setFranquiaKm(Number(e.target.value))}>
                        <option value={1000}>1.000 km</option>
                        <option value={2000}>2.000 km</option>
                        <option value={2500}>2.500 km</option>
                        <option value={3000}>3.000 km</option>
                      </select>
                    </div>

                    <Field label="Proj. Revenda (Opcional R$)" value={projecaoRevenda} setValue={setProjecaoRevenda} />
                    <Field label="Ano Modelo" value={yearNum} setValue={setYearNum} />
                    <Field label="Taxa Juros Mensal" value={taxaJurosMensal} setValue={setTaxaJurosMensal} step="0.0001" />
                    <Field label="Manutenção/mês" value={revisaoMensal} setValue={setRevisaoMensal} />
                    <Field label="Custo Pneus (Jogo)" value={custoPneus} setValue={setCustoPneus} />
                    <Field label="Seguro Anual" value={seguroAnual} setValue={setSeguroAnual} />
                    <Field label="Margem Net (Legado)" value={percentualAplicado} setValue={setPercentualAplicado} step="0.0001" />
                  </div>
                  
                  <button 
                    style={{...styles.buttonProcess, opacity: loading ? 0.7 : 1}} 
                    onClick={handleCalculate} 
                    disabled={loading}
                  >
                    {loading ? "CALCULANDO..." : "GERAR ESTUDO COMPARATIVO"}
                  </button>
                </section>
                
              </div>

              {results?.compare && (
                <div style={styles.resultsWrapper}>
                  
                  <div style={styles.resultsHeader}>
                    <div>
                      <h2 style={styles.cardTitle}>Resultado do Comparativo</h2>
                      <div style={{marginTop: 10, display: 'flex', gap: 8, alignItems: 'center'}}>
                        <div style={{position: 'relative'}}>
                          <select
                            style={{...styles.inputSearch, width: '280px', height: '38px', fontSize: '13px', border: '1px solid #eab308', background: 'rgba(0,0,0,0.3)', paddingRight: 30}}
                            value={clienteSelecionado?.id || ""}
                            onChange={(e) => {
                              const c = clientes.find(cl => String(cl.id) === e.target.value);
                              setClienteSelecionado(c || null);
                              if (c) setClienteNome(c.nome);
                            }}
                          >
                            <option value="">👤 Selecionar cliente...</option>
                            {clientes.map(c => (
                              <option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` (${c.empresa})` : ""}</option>
                            ))}
                          </select>
                        </div>
                        {!clienteSelecionado && (
                          <input
                            style={{...styles.inputSearch, width: '180px', height: '38px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)'}}
                            placeholder="Ou digitar nome..."
                            value={clienteNome}
                            onChange={(e) => setClienteNome(e.target.value)}
                          />
                        )}
                        {clienteSelecionado && (
                          <button onClick={() => { setClienteSelecionado(null); setClienteNome(""); }}
                            style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '0 10px', height: 38, cursor: 'pointer', fontSize: 13}}>
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
                      <button onClick={clearResults} style={styles.clearResultsBtn}>🗑️ LIMPAR</button>
                      <button onClick={exportToCSV} style={{...styles.exportBtn, boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}}>📥 EXCEL</button>
                    </div>
                  </div>
                  
                  <div style={styles.compareGridWrap}>
                    {results.compare.map((item, idx) => {
                      const vKey = item.vehicle.model_name_clean; 
                      const q = quantidades[vKey] || 1; 
                      const isPdfLoading = pdfLoadingMap[vKey] || false;
                      
                      return (
                        <div key={idx} style={styles.compareCardItem}>
                          
                          <div style={styles.compareHeader}>
                            <span style={styles.brandTag}>
                              {item.vehicle?.brand_name?.toUpperCase() || "VEÍCULO"}
                            </span>
                            <div style={styles.vehicleTitle}>
                              {String(item.vehicle?.model_name).trim()}
                            </div>
                            <div style={styles.qtyContainer}>
                              <label style={styles.qtyLabel}>QUANTIDADE DE VEÍCULOS:</label>
                              <div style={styles.qtySelector}>
                                <button style={styles.qtyBtn} onClick={() => setQuantidades({...quantidades, [vKey]: Math.max(1, q - 1)})}>-</button>
                                <div style={styles.qtyValBox}>{q}</div>
                                <button style={styles.qtyBtn} onClick={() => setQuantidades({...quantidades, [vKey]: q + 1})}>+</button>
                              </div>
                            </div>
                          </div>
                          
                          <div style={styles.compareBody}>
                            {item.pricing?.map(p => (
                              <div key={p.prazo_meses} style={{...styles.compareRow, borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                  <div style={styles.prazoBadge}>{p.prazo_meses} MESES</div>
                                  <div style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    backgroundColor: p.status === 'APROVAR' ? '#10b981' : p.status === 'AJUSTAR' ? '#f59e0b' : '#ef4444'
                                  }}>
                                    {p.status}
                                  </div>
                                </div>
                                
                                <div style={styles.mainValue}>R$ {formatBRL(p.mensalidade_final || p.mensalidade)}</div>
                                {q > 1 && <div style={styles.fleetTotal}>Frota: R$ {formatBRL((p.mensalidade_final || p.mensalidade) * q)}</div>}

                                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '10px', color: '#94a3b8'}}>
                                   <span>Técnica: R$ {formatBRL(p.mensalidade_tecnica)}</span>
                                   <span>Piso: R$ {formatBRL(p.mensalidade_piso)}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '10px', color: '#94a3b8'}}>
                                   <span>ROI: {p.roi_percentual}%</span>
                                   <span>Payback: {p.payback_meses}m</span>
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => handleDownloadPDF(vKey)} 
                              disabled={isPdfLoading} 
                              style={{...styles.pdfCardBtn, background: isPdfLoading ? 'rgba(255,255,255,0.1)' : '#fde68a', color: isPdfLoading ? '#fff' : '#000'}}
                            >
                              {isPdfLoading ? "⌛ GERANDO..." : "📄 BAIXAR PROPOSTA PDF"}
                            </button>
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                  
                </div>
              )}
            </div>
          )}

          {/* TAB: CONFIG DE CENÁRIOS */}
          {activeTab === "config" && currentUser?.role === 'admin' && (
            <div style={styles.cardFull}>
              <h2 style={styles.cardTitle}>Cenários de Mercado</h2>
              <div style={styles.actionGrid}>
                {savedScenarios.map(s => (
                  <div 
                    key={s.id} 
                    style={styles.actionCard} 
                    onClick={() => { 
                      setTaxaJurosMensal(s.taxa); 
                      setPercentualAplicado(s.margem); 
                      logAction("Cenários", `Aplicou cenário: ${s.name}`); 
                      alert(`Cenário ${s.name} aplicado!`); 
                    }}
                  >
                    <h3 style={{color: '#eab308'}}>{s.name}</h3>
                    <p style={{fontSize: 12, color: '#94a3b8'}}>
                      Taxa: {(s.taxa*100).toFixed(2)}% | Margem: {(s.margem*100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
       </main>

      {/* ============================================================ */}
      {/* MODAL DE CONCILIAÇÃO BANCÁRIA (MATCHING IA)                  */}
      {/* ============================================================ */}
      {showConciliacaoModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto'}}>
            <h2 style={styles.cardTitle}>Conciliação Bancária Inteligente</h2>
            <p style={{color: '#94a3b8', fontSize: '13px', marginBottom: '20px'}}>As transações abaixo foram identificadas no extrato. O sistema sugere o vínculo com as obrigações pendentes.</p>
            
            {conciliacaoData.length > 0 ? conciliacaoData.map((item, index) => (
              <div key={index} style={{border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: 'rgba(0,0,0,0.3)'}}>
                
                {/* CABEÇALHO DA TRANSAÇÃO (DINÂMICO PARA ENTRADA/SAÍDA) */}
                <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px'}}>
                  <div>
                    <span style={{color: '#94a3b8', fontSize: '11px', display: 'block'}}>
                      {item.tipo === 'credito' ? 'Entrada no Extrato (Crédito)' : 'Saída do Extrato (Débito)'}
                    </span>
                    <strong style={{color: item.tipo === 'credito' ? '#10b981' : '#f87171', fontSize: '18px', display: 'block', marginTop: '4px'}}>
                      {item.tipo === 'credito' ? '+' : '-'} R$ {item.extrato_valor}
                    </strong>
                    <span style={{color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic', marginTop: '4px', display: 'block'}}>
                      "{item.extrato_descricao}"
                    </span>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span style={{color: '#94a3b8', fontSize: '11px', display: 'block'}}>Data do Extrato</span>
                    <strong style={{color: '#fff', fontSize: '15px', marginTop: '4px', display: 'block'}}>{item.extrato_data}</strong>
                  </div>
                </div>

                <h4 style={{color: '#eab308', fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase'}}>
                  Status da Conciliação:
                </h4>
                
                {item.sugestoes_vinculo && item.sugestoes_vinculo.length > 0 ? (
                  // CASO 1: AVISO VERDE - PARCELA ENCONTRADA
                  item.sugestoes_vinculo.map((sug, sIdx) => (
                    <div key={sIdx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '5px'}}>
                      <div>
                        <strong style={{color: '#fff', display: 'block', fontSize: '14px'}}>{sug.fornecedor} - {sug.descricao}</strong>
                        <span style={{color: '#4ade80', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                          Valor no Sistema: R$ {sug.valor_sistema} | Vencimento: {sug.vencimento_sistema}
                        </span>
                      </div>
                      <button onClick={() => handleAprovarConciliacao(sug.id_parcela, item.id_transacao)} style={{background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'}}>
                        ✅ CONFIRMAR MATCH
                      </button>
                    </div>
                  ))
                ) : (
                  // CASO 2: AVISO LARANJA - LANÇAMENTO RÁPIDO E MEMÓRIA
                  <div style={{background: 'rgba(234, 179, 8, 0.05)', padding: '15px', borderRadius: '12px', border: '1px dashed #eab308'}}>
                    <p style={{color: '#eab308', fontSize: '12px', marginBottom: '12px', fontWeight: 'bold'}}>
                      {item.sugestao_regra 
                        ? `✨ MEMÓRIA DO SISTEMA: Identificamos que "${item.extrato_descricao}" costuma ser da empresa ${item.sugestao_regra.fornecedor_nome}.`
                        : `⚡ LANÇAMENTO RÁPIDO: Não encontramos uma provisão de R$ ${item.extrato_valor}. Selecione quem pagou/recebeu para baixar na hora:`}
                    </p>
                    <div style={{display: 'flex', gap: '15px'}}>
                      <select 
                        id={`forn_rapido_${index}`} 
                        style={{...styles.inputSmall, flex: 1, height: '40px', background: 'rgba(0,0,0,0.5)', borderColor: item.sugestao_regra ? '#eab308' : 'rgba(255,255,255,0.1)'}}
                        defaultValue={item.sugestao_regra ? item.sugestao_regra.id_fornecedor : ""}
                      >
                        <option value="">-- Selecionar Empresa / Cliente --</option>
                        {fornecedores.map(f => (
                          <option key={f.id} value={f.id}>{f.nome_razao || f.razao_social}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleLancarEConciliar(item, index)}
                        style={{background: '#eab308', color: '#000', padding: '0 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '12px'}}
                      >
                        {item.sugestao_regra ? "CONFIRMAR E BAIXAR" : "CRIAR E CONCILIAR"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div style={{padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px'}}>
                <span style={{fontSize: '40px', display: 'block', marginBottom: '15px'}}>🎉</span>
                <p style={{color: '#fff', fontSize: '16px', fontWeight: 'bold'}}>Nenhuma transação pendente!</p>
                <p style={{color: '#94a3b8', fontSize: '14px', marginTop: '5px'}}>O seu extrato está 100% conciliado com o sistema.</p>
              </div>
            )}

            <button onClick={() => setShowConciliacaoModal(false)} style={{...styles.clearBtn, width: '100%', marginTop: '30px', padding: '15px', fontSize: '14px'}}>
              FECHAR TELA DE CONCILIAÇÃO
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function FluxoCaixaChart({ data, maxValue }) {
  if (!data || data.length === 0) {
    return (
      <div style={{...styles.cardFull, textAlign: 'center', color: '#94a3b8', padding: '50px', marginTop: '20px'}}>
        Nenhuma movimentação financeira consolidada nos últimos meses para gerar o gráfico.
      </div>
    );
  }

  // Aumenta a escala em 15% para a coluna mais alta não bater no teto do gráfico
  const scaleMax = maxValue * 1.15;

  return (
    <div style={{...styles.cardFull, marginTop: '20px', marginBottom: '30px', padding: '30px'}}>
      <h2 style={{...styles.sectionTitle, color: '#eab308', fontSize: '18px', marginBottom: '30px'}}>
        Fluxo de Caixa Mensal
      </h2>
      
      {/* Container Principal do Gráfico */}
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '250px', gap: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {data.map((item, index) => {
          // Calcula a percentagem de altura para cada coluna baseada no valor máximo
          const alturaEntrada = (item.entradas / scaleMax) * 100;
          const alturaSaida = (item.saidas / scaleMax) * 100;

          return (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* As duas colunas lado a lado */}
              <div style={{ display: 'flex', gap: '6px', height: '100%', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                
                {/* Coluna Verde (Entradas) */}
                <div 
                  style={{ width: '35%', height: `${alturaEntrada}%`, background: 'linear-gradient(to top, #047857, #10b981)', borderRadius: '4px 4px 0 0', position: 'relative', minHeight: item.entradas > 0 ? '5px' : '0', transition: 'height 1s ease-out' }} 
                  title={`Entradas: R$ ${item.entradas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                ></div>

                {/* Coluna Vermelha (Saídas) */}
                <div 
                  style={{ width: '35%', height: `${alturaSaida}%`, background: 'linear-gradient(to top, #991b1b, #f87171)', borderRadius: '4px 4px 0 0', position: 'relative', minHeight: item.saidas > 0 ? '5px' : '0', transition: 'height 1s ease-out' }} 
                  title={`Saídas: R$ ${item.saidas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                ></div>

              </div>

              {/* Rótulo do Mês debaixo das colunas */}
              <span style={{ marginTop: '15px', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{item.mes}</span>
            </div>
          );
        })}
      </div>

      {/* Legenda do Gráfico */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', background: '#10b981', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>Entradas Realizadas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '14px', height: '14px', background: '#f87171', borderRadius: '4px' }}></div>
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold' }}>Saídas Realizadas</span>
        </div>
      </div>
      <p style={{textAlign: 'center', fontSize: '10px', color: '#64748b', marginTop: '15px'}}>*Passe o mouse por cima das colunas para ver o valor exato</p>
    </div>
  );
}

function StatCard({ title, value, icon, breakdown }) {
  return (
    <div style={{...styles.statCard, flexDirection: 'column', alignItems: 'flex-start'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '100%'}}>
        <span style={{fontSize: 28, textShadow: '0 4px 10px rgba(0,0,0,0.5)'}}>{icon}</span>
        <div>
          <div style={styles.statLabel}>{title}</div>
          <div style={styles.statValue}>{value}</div>
        </div>
      </div>
      
      {breakdown && breakdown.length > 0 && (
        <div style={{
          width: '100%', 
          marginTop: '15px', 
          paddingTop: '10px', 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px'
        }}>
          {breakdown.map((b, i) => (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: b.color, boxShadow: `0 0 5px ${b.color}`}}></div>
                  <span style={{color: '#cbd5e1'}}>{b.status}</span>
               </div>
               <span style={{fontWeight: 'bold', color: '#94a3b8'}}>
                 {b.count} <span style={{fontWeight: 'normal', fontSize: '10px'}}>({b.percent})</span>
               </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, label, icon }) { 
  return (
    <div 
      onClick={onClick} 
      style={{ 
        ...styles.navItem, 
        backgroundColor: active ? "rgba(234, 179, 8, 0.9)" : "transparent", 
        color: active ? "#000" : "#94a3b8",
        boxShadow: active ? '0 4px 15px rgba(234, 179, 8, 0.3)' : 'none'
      }}
    >
      <span style={{marginRight: 10}}>{icon}</span> 
      {label}
    </div>
  ); 
}

function Field({ label, value, setValue, step = "1" }) { 
  return (
    <div style={styles.inputGroup}>
      <label style={styles.fieldLabel}>{label}</label>
      <input 
        style={styles.inputSmall} 
        type={step === "any" || step === "0.0001" ? "number" : "text"} 
        step={step} 
        value={value} 
        onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))} 
      />
    </div>
  ); 
}

// --- ESTILOS COMPLETOS MODERNO (GLASSMORPHISM / TELAS FLUTUANTES) ---
const styles = {
  inventoryGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "20px 30px", 
    marginTop: '20px', 
    alignItems: 'end' 
  },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(2, 6, 23, 0.75)', 
    backdropFilter: 'blur(10px)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999 
  },
  modalContent: { 
    backgroundColor: 'rgba(15, 23, 42, 0.85)', 
    backdropFilter: 'blur(20px)',
    padding: '40px', 
    borderRadius: '25px', 
    width: '80%', 
    maxWidth: '900px', 
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 20px rgba(234, 179, 8, 0.05)'
  },
  modalTableBox: { 
    maxHeight: '400px', 
    overflowY: 'auto', 
    marginTop: 20, 
    border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.2)'
  },
  bulkActionBox: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 15, 
    background: 'rgba(234, 179, 8, 0.1)', 
    padding: '15px 20px', 
    borderRadius: '16px', 
    marginBottom: '20px', 
    border: '1px solid rgba(234, 179, 8, 0.3)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
  },
  unselectBtn: { 
    background: 'none', 
    border: 'none', 
    color: '#94a3b8', 
    fontSize: '11px', 
    cursor: 'pointer', 
    textDecoration: 'underline' 
  },
  brandTag: { 
    fontSize: 10, 
    color: '#eab308', 
    fontWeight: 900, 
    textTransform: 'uppercase', 
    letterSpacing: '1px' 
  },
  qtyContainer: { 
    marginTop: '12px', 
    padding: '10px', 
    background: 'rgba(0,0,0,0.3)', 
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  qtyLabel: { 
    fontSize: '8px', 
    color: '#94a3b8', 
    display: 'block', 
    marginBottom: '6px', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  qtySelector: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px' 
  },
  qtyBtn: { 
    background: 'rgba(255,255,255,0.1)', 
    border: 'none', 
    color: '#fff', 
    width: '32px', 
    height: '32px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 0, 
    lineHeight: 1 
  },
  qtyValBox: { 
    background: 'rgba(0,0,0,0.4)', 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: '15px', 
    minWidth: '40px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '6px', 
    border: '1px solid rgba(255,255,255,0.05)' 
  },
  fleetTotal: { 
    fontSize: '10px', 
    color: '#4ade80', 
    fontWeight: 'bold', 
    marginTop: '4px' 
  },
  pdfCardBtn: { 
    width: '100%', 
    marginTop: '15px', 
    padding: '12px', 
    background: '#fde68a', 
    color: '#000', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    fontSize: '11px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px',
    boxShadow: '0 4px 15px rgba(253, 230, 138, 0.3)'
  },
  page: { 
    display: "flex", 
    minHeight: "100vh", 
    width: "100vw", 
    background: "radial-gradient(circle at top right, #1e293b, #020617)",
    color: "#f1f5f9", 
    fontFamily: "'Inter', sans-serif", 
    overflowX: 'hidden' 
  },
  sidebar: { 
    width: "260px", 
    backgroundColor: "rgba(15, 23, 42, 0.7)", 
    backdropFilter: "blur(15px)",
    borderRight: "1px solid rgba(255,255,255,0.05)", 
    flexShrink: 0, 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
    zIndex: 10
  },
  sidebarLogoBox: { 
    padding: "45px 20px", 
    textAlign: "center" 
  },
  sidebarLogo: { 
    height: "35px", 
    objectFit: 'contain' 
  },
  nav: { 
    padding: "0 10px", 
    flex: 1 
  },
  navItem: { 
    padding: "14px 20px", 
    borderRadius: "12px", 
    cursor: "pointer", 
    marginBottom: "5px", 
    fontWeight: 700, 
    fontSize: "14px", 
    display: 'flex', 
    alignItems: 'center',
    transition: 'background 0.2s, box-shadow 0.2s'
  },
  logoutBtn: { 
    margin: "20px", 
    padding: "12px", 
    borderRadius: "12px", 
    border: "1px solid rgba(248, 113, 113, 0.3)", 
    background: "rgba(248, 113, 113, 0.05)", 
    color: "#f87171", 
    cursor: "pointer" 
  },
  mainContent: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    minWidth: 0 
  },
  header: { 
    padding: "20px 40px", 
    background: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
    position: 'sticky',
    top: 0,
    zIndex: 5
  },
  title: { 
    margin: 0, 
    fontSize: 24, 
    fontWeight: 900 
  },
  subtitle: { 
    color: "#94a3b8", 
    fontSize: 12 
  },
  container: { 
    padding: "30px 40px", 
    boxSizing: 'border-box' 
  },
  dashboardWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(4, 1fr)', 
    gap: '20px' 
  },
  statCard: { 
    background: 'rgba(30, 41, 59, 0.6)', 
    backdropFilter: 'blur(12px)',
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.08)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transform: 'translateY(-2px)'
  },
  statLabel: { 
    fontSize: '9px', 
    color: '#94a3b8', 
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statValue: { 
    fontSize: '20px', 
    fontWeight: 800 
  },
  actionGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  actionCard: { 
    background: 'rgba(30, 41, 59, 0.6)', 
    backdropFilter: 'blur(12px)',
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.08)', 
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    transform: 'translateY(-2px)'
  },
  calculatorWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  configSection: { 
    display: 'flex', 
    gap: '25px', 
    alignItems: 'stretch' 
  },
  cardVehicles: { 
    flex: 1.2, 
    minWidth: 0, 
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: "blur(16px)",
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
  },
  cardParams: { 
    flex: 1, 
    minWidth: 0, 
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: "blur(16px)",
    borderRadius: "24px", 
    padding: "30px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
  },
  headerTitleAction: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  cardTitle: { 
    marginTop: 0, 
    fontSize: 18, 
    fontWeight: 800, 
    borderLeft: "4px solid #eab308", 
    paddingLeft: 12,
    textShadow: '0 2px 5px rgba(0,0,0,0.5)'
  },
  modelsBox: { 
    height: "300px", 
    overflowY: "auto", 
    background: "rgba(0,0,0,0.3)", 
    padding: 15, 
    borderRadius: "16px", 
    marginTop: 15,
    border: "1px solid rgba(255,255,255,0.05)"
  },
  modelItem: { 
    display: "flex", 
    alignItems: "center", 
    padding: "12px", 
    borderBottom: "1px solid rgba(255,255,255,0.05)", 
    cursor: 'pointer' 
  },
  modelText: { 
    marginLeft: 12 
  },
  modelName: { 
    fontSize: 12, 
    fontWeight: 500 
  },
  inputSearch: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "1px solid rgba(255,255,255,0.1)", 
    background: "rgba(15, 23, 42, 0.6)", 
    color: "white", 
    boxSizing: 'border-box',
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
  },
  buttonProcess: { 
    width: '100%', 
    marginTop: '20px', 
    padding: "16px", 
    borderRadius: "14px", 
    background: "#eab308", 
    color: "#000", 
    fontWeight: 900, 
    cursor: "pointer", 
    border: 'none',
    textAlign: 'center',
    boxShadow: '0 8px 20px rgba(234, 179, 8, 0.4)'
  },
  clearBtn: { 
    background: 'rgba(248, 113, 113, 0.1)', 
    color: '#f87171', 
    border: '1px solid rgba(248, 113, 113, 0.2)', 
    padding: '6px 12px', 
    borderRadius: '8px', 
    fontSize: '11px', 
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resultsWrapper: { 
    width: '100%' 
  },
  resultsHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  exportBtn: { 
    padding: '12px 20px', 
    background: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12,
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
  },
  clearResultsBtn: { 
    padding: '12px 20px', 
    background: 'rgba(248, 113, 113, 0.15)', 
    color: '#f87171', 
    border: '1px solid rgba(248, 113, 113, 0.3)', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12 
  },
  compareGridWrap: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '25px' 
  },
  compareCardItem: { 
    flex: '1 1 300px', 
    maxWidth: 'calc(25% - 15px)', 
    background: 'rgba(15, 23, 42, 0.8)', 
    backdropFilter: 'blur(20px)',
    borderRadius: '24px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
  },
  compareHeader: { 
    padding: '20px 15px', 
    textAlign: 'center', 
    background: 'rgba(255,255,255,0.03)', 
    borderBottom: '1px solid rgba(255,255,255,0.05)' 
  },
  vehicleTitle: { 
    fontSize: 14, 
    fontWeight: 800, 
    minHeight: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
  },
  compareBody: { 
    padding: '15px', 
    flex: 1 
  },
  compareRow: { 
    padding: '15px 10px', 
    borderBottom: '1px solid rgba(255,255,255,0.03)', 
    textAlign: 'center' 
  },
  prazoBadge: { 
    fontSize: '10px', 
    color: '#eab308', 
    fontWeight: 900 
  },
  mainValue: { 
    fontSize: '22px', 
    fontWeight: 900, 
    color: '#fff',
    marginTop: '10px'
  },
  cardFull: { 
    background: "rgba(30, 41, 59, 0.45)", 
    backdropFilter: 'blur(16px)',
    borderRadius: "24px", 
    padding: "35px", 
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)"
  },
  tableWrapper: { 
    overflowX: 'auto', 
    marginTop: 20,
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  tableMassa: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  thMassa: { 
    textAlign: 'left', 
    padding: '18px 15px', 
    background: 'rgba(15, 23, 42, 0.6)', 
    color: '#94a3b8', 
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tdMassa: { 
    padding: '15px', 
    borderBottom: '1px solid rgba(255,255,255,0.05)', 
    fontSize: 13 
  },
  trBody: {
    transition: 'background 0.2s',
  },
  loginPage: { 
    height: "100vh", 
    width: "100vw", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)"
  },
  loginCard: { 
    width: "500px", 
    padding: "60px 40px", 
    borderRadius: "32px", 
    background: "rgba(15, 23, 42, 0.6)", 
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", 
    textAlign: "center", 
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)"
  },
  loginLogoContainer: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "35px", 
    marginBottom: "50px" 
  },
  loginLogo: { 
    height: "55px", 
    objectFit: "contain" 
  },
  loginTitle: { 
    fontSize: 22, 
    fontWeight: 800, 
    marginBottom: 40, 
    color: "#fde68a", 
    letterSpacing: "1px", 
    textTransform: 'uppercase',
    textShadow: '0 4px 10px rgba(0,0,0,0.5)'
  },
  loginButton: { 
    width: "100%", 
    padding: "18px", 
    borderRadius: "14px", 
    background: "#eab308", 
    fontWeight: 900, 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '15px', 
    color: '#000',
    boxShadow: '0 10px 25px rgba(234, 179, 8, 0.4)'
  },
  input: { 
    width: "100%", 
    padding: "16px", 
    borderRadius: "12px", 
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff", 
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
  },
  inputGroup: { 
    marginBottom: 18, 
    textAlign: 'left' 
  },
  label: { 
    fontSize: 10, 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 8,
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "15px" 
  },
  inputSmall: { 
    width: "100%", 
    padding: "12px", 
    borderRadius: "10px", 
    background: "rgba(0,0,0,0.3)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff", 
    boxSizing: 'border-box',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
  },
  fieldLabel: { 
    fontSize: 10, 
    color: '#cbd5e1', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 6,
    fontWeight: 'bold'
  }
};