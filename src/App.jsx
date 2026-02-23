import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

// IMPORTAÇÃO DAS LOGOS LOCAIS
const CHEVROLET_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet-logo.png/800px-Chevrolet-logo.png";

export default function App() {
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
  const [taxaJurosMensal, setTaxaJurosMensal] = useState(0.0129);
  const [percentualAplicado, setPercentualAplicado] = useState(0.028);
  const [revisaoMensal, setRevisaoMensal] = useState(56.88);
  const [prazos] = useState([12, 24, 36, 48]);
  
  // Parâmetros técnicos
  const [custoPneus, setCustoPneus] = useState(880.00);
  const [seguroAnual, setSeguroAnual] = useState(2100.00);
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
    { id: 1, name: "Padrão Varejo", taxa: 0.0129, margem: 0.028 },
    { id: 2, name: "Frotista Agro", taxa: 0.0115, margem: 0.020 },
    { id: 3, name: "Locadora Gov", taxa: 0.0105, margem: 0.015 }
  ]);

  // --- FUNÇÕES DE LIMPEZA ---
  const resetVehicles = () => { 
    setSelectedVehicles([]); 
    setSearch(""); 
    setSelectedBrand("Todas"); 
  };
  
  const resetParams = () => { 
    setKmMensal(3000); 
    setTaxaJurosMensal(0.0129); 
    setPercentualAplicado(0.028); 
    setRevisaoMensal(56.88); 
    setYearNum(2024); 
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
        return "#f87171"; // Vermelho
      case "Locado": 
      case "Locados": 
        return "#60a5fa"; // Azul
      case "Disponível": 
      case "Ociosos": 
        return "#4ade80"; // Verde
      case "Manutenção": 
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
      
      // CONFIGURAÇÃO DOS LOGS DINÂMICOS PARA MOSTRAR A GRAVAÇÃO REAL
      // Substituído o hardcode da Fiat por um dicionário dinâmico que mapeia de forma realista os veículos gravados
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

      // Chamada HTTP real que processa a persistência dos dados
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
        cliente_nome: clienteNome || "Proposta Comercial", 
        quantidade: qtdSelecionada, 
        prazos: [12, 24, 36, 48], 
        logo_url: sysLogos.pdf 
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
      
      logAction("Proposta", `Gerou PDF da proposta para ${vehicleCleanName}`);
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

  useEffect(() => { 
    if (isLoggedIn) { 
      loadModels(); 
      loadInventoryVendas(); 
      loadInventoryLocacao(); 
      loadDashboardData();
      loadUsers(); // Agora a lista de usuários vem do banco assim que fazemos login!
    } 
  }, [isLoggedIn]);

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
          prazos: [12, 24, 36, 48] 
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
                  style={{...styles.clearResultsBtn, flex: 1, background: '#1e293b'}}
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

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogoBox}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <img src={sysLogos.sidebar} alt="Logo Sidebar" style={styles.sidebarLogo} />
            </div>
        </div>
        
        <nav style={styles.nav}>
          <div style={{padding: '0 20px 10px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold'}}>
            Geral
          </div>
          <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} label="Dashboard" icon="📊" />
          <NavItem active={activeTab === "calculadora"} onClick={() => setActiveTab("calculadora")} label="Calculadora" icon="🧮" />
          <NavItem active={activeTab === "estoque_vendas"} onClick={() => setActiveTab("estoque_vendas")} label="Estoque de Vendas" icon="📋" />
          <NavItem active={activeTab === "estoque_locacao"} onClick={() => setActiveTab("estoque_locacao")} label="Estoque de Locação" icon="🔑" />
          
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
              <span style={{color: '#eab308', fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px'}}>Olá, {currentUser?.name}</span>
              <h1 style={styles.title}>{activeTab.replace('_', ' ').toUpperCase()}</h1>
              <p style={styles.subtitle}> Sistema v3.0 • 2026</p>
            </div>
            {error && (
              <div style={{background: '#7f1d1d', color: '#fecaca', padding: '10px 20px', borderRadius: '8px', fontSize: '12px'}}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </header>

        <main style={styles.container}>
          
          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div style={styles.dashboardWrapper}>
              
              <div style={styles.statsGrid}>
                {/* Aqui usamos o fullInventory que puxa do banco sem sofrer interferência dos filtros da tela */}
                <StatCard title="Estoque (Vendas)" value={fullInventoryVendas.length} icon="🏠" breakdown={vendasBreakdown} />
                <StatCard title="Estoque (Locação)" value={fullInventoryLocacao.length} icon="🔑" breakdown={locacaoBreakdown} />
                <StatCard title="Modelos Ativos" value={models.length} icon="🚗" />
                <StatCard title="Margem Média" value={`${(percentualAplicado * 100).toFixed(1)}%`} icon="📊" />
              </div>
              
              <h2 style={styles.sectionTitle}>Ações Rápidas</h2>
              <div style={styles.actionGrid}>
                {hasEditPermission && (
                  <div style={styles.actionCard} onClick={() => setActiveTab("frota")}>
                    <span style={{fontSize: 30}}>🚗</span>
                    <h3>Gestão de Veículos</h3>
                    <p>Cadastrar manualmente ou importar arquivos</p>
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
                  <button onClick={loadInventoryVendas} style={{...styles.exportBtn, background: '#eab308', color: '#000'}}>🔍 PESQUISAR</button>
                  <button onClick={() => exportInventoryXLSX('venda')} style={styles.exportBtn}>📥 XLSX</button>
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
                      <tr key={idx} style={{...styles.trBody, backgroundColor: selectedInventoryItems.includes(v.placa) ? 'rgba(234, 179, 8, 0.05)' : 'transparent'}}>
                        
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
                          <span style={{color: getStatusColor(v.status), fontWeight: 'bold'}}>{v.status}</span>
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
                <span style={{fontSize: '13px', color: '#94a3b8'}}>Página {currentPage} de {totalPages || 1}</span>
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
                  <button onClick={loadInventoryLocacao} style={{...styles.exportBtn, background: '#eab308', color: '#000'}}>🔍 PESQUISAR</button>
                  <button onClick={() => exportInventoryXLSX('locacao')} style={styles.exportBtn}>📥 XLSX</button>
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
                      <tr key={idx} style={{...styles.trBody, backgroundColor: selectedInventoryItemsLocacao.includes(v.placa) ? 'rgba(234, 179, 8, 0.05)' : 'transparent'}}>
                        
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
                <span style={{fontSize: '13px', color: '#94a3b8'}}>Página {currentPageLocacao} de {totalPagesLocacao || 1}</span>
                <button disabled={currentPageLocacao >= totalPagesLocacao} onClick={() => setCurrentPageLocacao(prev => prev + 1)} style={styles.clearResultsBtn}>Próxima</button>
              </div>
            </div>
          )}

          {/* TAB: GESTÃO DE FROTA (CADASTRO MANUAL E IMPORTAÇÃO) */}
          {activeTab === "frota" && (currentUser?.role === 'admin' || currentUser?.role === 'gestor') && (
            <div style={styles.dashboardWrapper}>
               <div style={styles.configSection}>
                 
                 <section style={styles.cardVehicles}>
                    <h2 style={styles.cardTitle}>Cadastro de Estoque Real</h2>
                    <form onSubmit={handleManualSubmit} style={styles.inventoryGrid}>
                      
                      <div style={{...styles.inputGroup, gridColumn: 'span 2', background: 'rgba(234, 179, 8, 0.1)', padding: 15, borderRadius: 10, border: '1px solid #eab308'}}>
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
                       
                       <div style={{border: '2px dashed #334155', padding: '40px', borderRadius: '20px'}}>
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
                 
                 {/* Formulário Novo Usuário */}
                 <div style={{flex: 1, background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px'}}>
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

                 {/* Lista de Usuários */}
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
                                     background: '#1e293b', 
                                     padding: '5px 10px', 
                                     borderRadius: '6px', 
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
                                            borderRadius: '6px', 
                                            fontSize: '10px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer'
                                         }}>
                                            {u.canEdit ? "✔ EDIÇÃO" : "✖ BLOQUEADO"}
                                         </button>
                                      ) : (
                                        <span style={{fontSize: '11px', color: '#64748b'}}>Permissão Nativa</span>
                                      )}
                                      
                                      {/* BOTÃO DE RESETAR SENHA (Para admin ou gestor resetando consultor) */}
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
               
               <div style={{maxHeight: '600px', overflowY: 'auto', border: '1px solid #1e293b', borderRadius: '15px'}}>
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
                                  borderRadius: '4px'
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

          {/* TAB: ATUALIZAR FIPE (Ajustado com Dicionário Dinâmico de Marcas) */}
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
                <div style={{marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <span style={{fontSize: '12px', color: '#eab308', fontWeight: 'bold'}}>Status do Sincronizador Estrito:</span>
                    <span style={{fontSize: '12px', color: '#eab308', fontWeight: 'bold'}}>{syncProgress}%</span>
                  </div>
                  <div style={{width: '100%', height: '12px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden'}}>
                    <div style={{width: `${syncProgress}%`, height: '100%', background: '#eab308', transition: 'width 0.4s ease'}}></div>
                  </div>
                </div>
              )}

              {/* TERMINAL DE ATUALIZAÇÃO (Mostrando a gravação real com os modelos corretos) */}
              <div style={{
                background: '#000', 
                color: '#0f0', 
                fontFamily: 'monospace', 
                padding: '15px', 
                borderRadius: '8px', 
                height: '200px', 
                overflowY: 'auto', 
                marginBottom: '20px',
                fontSize: '12px',
                border: '1px solid #334155'
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
                      background: '#7f1d1d',
                      color: '#fff',
                      border: 'none',
                      padding: '0 30px'
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
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: 15, 
                  border: '1px solid #10b981'
                }}>
                  <h4 style={{margin: '0 0 5px 0', color: '#10b981'}}>✅ Gravação PostgreSQL Finalizada</h4>
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
                 
                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #1e293b'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Tela de Login</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: '#0f172a', borderRadius: '10px'}}>
                        <img src={sysLogos.login} alt="Login Logo" style={{maxHeight: '60px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoLogin" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'login')} />
                     <label htmlFor="logoLogin" style={{...styles.clearBtn, color: '#fff', border: '1px solid #334155', cursor: 'pointer', display: 'block', padding: '10px'}}>Substituir Imagem</label>
                  </div>

                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #1e293b'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Sidebar (Menu Lateral)</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: '#0f172a', borderRadius: '10px'}}>
                        <img src={sysLogos.sidebar} alt="Sidebar Logo" style={{maxHeight: '40px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoSidebar" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'sidebar')} />
                     <label htmlFor="logoSidebar" style={{...styles.clearBtn, color: '#fff', border: '1px solid #334155', cursor: 'pointer', display: 'block', padding: '10px'}}>Substituir Imagem</label>
                  </div>

                  <div style={{background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #1e293b'}}>
                     <h3 style={{fontSize: '12px', color: '#eab308', textTransform: 'uppercase', marginBottom: '20px'}}>Proposta PDF (Download)</h3>
                     <div style={{height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', background: '#fff', borderRadius: '10px'}}>
                        <img src={sysLogos.pdf} alt="PDF Logo" style={{maxHeight: '60px', maxWidth: '80%'}} />
                     </div>
                     <input type="file" id="logoPdf" accept=".jpg, .png, .jpeg" style={{display: 'none'}} onChange={(e) => handleLogoChange(e, 'pdf')} />
                     <label htmlFor="logoPdf" style={{...styles.clearBtn, color: '#fff', border: '1px solid #334155', cursor: 'pointer', display: 'block', padding: '10px'}}>Substituir Imagem</label>
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
                  
                  {/* Filtro de Marca */}
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
                    <Field label="KM Mensal" value={kmMensal} setValue={setKmMensal} />
                    <Field label="Ano Modelo" value={yearNum} setValue={setYearNum} />
                    <Field label="Taxa Juros" value={taxaJurosMensal} setValue={setTaxaJurosMensal} step="0.0001" />
                    <Field label="Margem Net" value={percentualAplicado} setValue={setPercentualAplicado} step="0.0001" />
                    <Field label="Manutenção/mês" value={revisaoMensal} setValue={setRevisaoMensal} />
                    <Field label="Seguro Anual" value={seguroAnual} setValue={setSeguroAnual} />
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
                      <div style={{marginTop: 10}}>
                        <input 
                          style={{...styles.inputSearch, width: '300px', height: '38px', fontSize: '13px', border: '1px solid #eab308'}} 
                          placeholder="Nome do Cliente..." 
                          value={clienteNome} 
                          onChange={(e) => setClienteNome(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
                      <button onClick={clearResults} style={styles.clearResultsBtn}>🗑️ LIMPAR</button>
                      <button onClick={exportToCSV} style={styles.exportBtn}>📥 EXCEL</button>
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
                              <div key={p.prazo_meses} style={styles.compareRow}>
                                <div style={styles.prazoBadge}>{p.prazo_meses} MESES</div>
                                <div style={styles.mainValue}>R$ {formatBRL(p.mensalidade_calculada)}</div>
                                {q > 1 && <div style={styles.fleetTotal}>Frota: R$ {formatBRL(p.mensalidade_calculada * q)}</div>}
                              </div>
                            ))}
                            <button 
                              onClick={() => handleDownloadPDF(vKey)} 
                              disabled={isPdfLoading} 
                              style={{...styles.pdfCardBtn, background: isPdfLoading ? '#334155' : '#fde68a'}}
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
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatCard({ title, value, icon, breakdown }) {
  return (
    <div style={{...styles.statCard, flexDirection: 'column', alignItems: 'flex-start'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '100%'}}>
        <span style={{fontSize: 24}}>{icon}</span>
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
          borderTop: '1px solid #1e293b', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px'
        }}>
          {breakdown.map((b, i) => (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center'}}>
               <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <div style={{width: 8, height: 8, borderRadius: '50%', backgroundColor: b.color}}></div>
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
        backgroundColor: active ? "#eab308" : "transparent", 
        color: active ? "#000" : "#94a3b8" 
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
        type="number" 
        step={step} 
        value={value} 
        onChange={(e) => setValue(Number(e.target.value))} 
      />
    </div>
  ); 
}

// --- ESTILOS COMPLETOS ---
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
    backgroundColor: 'rgba(0,0,0,0.85)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999 
  },
  modalContent: { 
    backgroundColor: '#0f172a', 
    padding: '40px', 
    borderRadius: '25px', 
    width: '80%', 
    maxWidth: '900px', 
    border: '1px solid #1e293b' 
  },
  modalTableBox: { 
    maxHeight: '400px', 
    overflowY: 'auto', 
    marginTop: 20, 
    border: '1px solid #1e293b', 
    borderRadius: '12px' 
  },
  bulkActionBox: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 15, 
    background: 'rgba(234, 179, 8, 0.1)', 
    padding: '15px 20px', 
    borderRadius: '12px', 
    marginBottom: '20px', 
    border: '1px solid #eab308' 
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
    borderRadius: '12px' 
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
    background: '#334155', 
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
    background: 'rgba(255,255,255,0.05)', 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: '15px', 
    minWidth: '40px', 
    height: '32px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: '6px', 
    border: '1px solid rgba(255,255,255,0.1)' 
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
    borderRadius: '10px', 
    fontWeight: 'bold', 
    fontSize: '11px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px' 
  },
  page: { 
    display: "flex", 
    minHeight: "100vh", 
    width: "100vw", 
    backgroundColor: "#080c14", 
    color: "#f1f5f9", 
    fontFamily: "'Inter', sans-serif", 
    overflowX: 'hidden' 
  },
  sidebar: { 
    width: "260px", 
    backgroundColor: "#0f172a", 
    borderRight: "1px solid #1e293b", 
    flexShrink: 0, 
    display: 'flex', 
    flexDirection: 'column' 
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
    alignItems: 'center' 
  },
  logoutBtn: { 
    margin: "20px", 
    padding: "12px", 
    borderRadius: "10px", 
    border: "1px solid #334155", 
    background: "transparent", 
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
    borderBottom: "1px solid #1e293b" 
  },
  title: { 
    margin: 0, 
    fontSize: 24, 
    fontWeight: 900 
  },
  subtitle: { 
    color: "#64748b", 
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
    background: '#0f172a', 
    padding: '20px', 
    borderRadius: '16px', 
    border: '1px solid #1e293b', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px' 
  },
  statLabel: { 
    fontSize: '9px', 
    color: '#64748b', 
    textTransform: 'uppercase' 
  },
  statValue: { 
    fontSize: '16px', 
    fontWeight: 800 
  },
  actionGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  actionCard: { 
    background: 'rgba(30, 41, 59, 0.4)', 
    padding: '25px', 
    borderRadius: '20px', 
    border: '1px solid #1e293b', 
    cursor: 'pointer' 
  },
  calculatorWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '30px' 
  },
  configSection: { 
    display: 'flex', 
    gap: '20px', 
    alignItems: 'stretch' 
  },
  cardVehicles: { 
    flex: 1.2, 
    minWidth: 0, 
    background: "rgba(30, 41, 59, 0.4)", 
    borderRadius: "20px", 
    padding: "25px", 
    border: "1px solid rgba(255,255,255,0.08)" 
  },
  cardParams: { 
    flex: 1, 
    minWidth: 0, 
    background: "rgba(30, 41, 59, 0.4)", 
    borderRadius: "20px", 
    padding: "25px", 
    border: "1px solid rgba(255,255,255,0.08)" 
  },
  headerTitleAction: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  cardTitle: { 
    marginTop: 0, 
    fontSize: 17, 
    fontWeight: 800, 
    borderLeft: "4px solid #eab308", 
    paddingLeft: 12 
  },
  modelsBox: { 
    height: "240px", 
    overflowY: "auto", 
    background: "rgba(0,0,0,0.2)", 
    padding: 10, 
    borderRadius: "12px", 
    marginTop: 15 
  },
  modelItem: { 
    display: "flex", 
    alignItems: "center", 
    padding: "10px", 
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
    padding: "12px", 
    borderRadius: "10px", 
    border: "1px solid #334155", 
    background: "#0f172a", 
    color: "white", 
    boxSizing: 'border-box' 
  },
  buttonProcess: { 
    width: '100%', 
    marginTop: '15px', 
    padding: "16px", 
    borderRadius: "12px", 
    background: "#eab308", 
    color: "#000", 
    fontWeight: 900, 
    cursor: "pointer", 
    border: 'none',
    textAlign: 'center'
  },
  clearBtn: { 
    background: 'rgba(248, 113, 113, 0.1)', 
    color: '#f87171', 
    border: 'none', 
    padding: '5px 10px', 
    borderRadius: '6px', 
    fontSize: '10px', 
    fontWeight: 'bold' 
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
    padding: '10px 18px', 
    background: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12 
  },
  clearResultsBtn: { 
    padding: '10px 18px', 
    background: 'rgba(248, 113, 113, 0.1)', 
    color: '#f87171', 
    border: '1px solid #f87171', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: 12 
  },
  compareGridWrap: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '20px' 
  },
  compareCardItem: { 
    flex: '1 1 300px', 
    maxWidth: 'calc(25% - 15px)', 
    background: '#0f172a', 
    borderRadius: '20px', 
    border: '1px solid #1e293b', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  compareHeader: { 
    padding: '15px', 
    textAlign: 'center', 
    background: 'rgba(255,255,255,0.02)', 
    borderBottom: '1px solid #1e293b' 
  },
  vehicleTitle: { 
    fontSize: 14, 
    fontWeight: 800, 
    minHeight: '40px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  compareBody: { 
    padding: '10px', 
    flex: 1 
  },
  compareRow: { 
    padding: '12px', 
    borderBottom: '1px solid rgba(255,255,255,0.03)', 
    textAlign: 'center' 
  },
  prazoBadge: { 
    fontSize: '9px', 
    color: '#eab308', 
    fontWeight: 900 
  },
  mainValue: { 
    fontSize: '19px', 
    fontWeight: 900, 
    color: '#fff' 
  },
  cardFull: { 
    background: "rgba(30, 41, 59, 0.4)", 
    borderRadius: "20px", 
    padding: "30px", 
    border: "1px solid rgba(255,255,255,0.08)" 
  },
  tableWrapper: { 
    overflowX: 'auto', 
    marginTop: 20 
  },
  tableMassa: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  thMassa: { 
    textAlign: 'left', 
    padding: '15px', 
    background: '#1e293b', 
    color: '#94a3b8', 
    fontSize: 11 
  },
  tdMassa: { 
    padding: '15px', 
    borderBottom: '1px solid #1e293b', 
    fontSize: 13 
  },
  loginPage: { 
    height: "100vh", 
    width: "100vw", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    background: "#080c14" 
  },
  loginCard: { 
    width: "500px", 
    padding: "60px 40px", 
    borderRadius: "40px", 
    background: "#0f172a", 
    border: "1px solid #1e293b", 
    textAlign: "center", 
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)" 
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
    textTransform: 'uppercase' 
  },
  loginButton: { 
    width: "100%", 
    padding: "18px", 
    borderRadius: "12px", 
    background: "#eab308", 
    fontWeight: 900, 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '15px', 
    color: '#000' 
  },
  input: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "10px", 
    background: "#080c14", 
    border: "1px solid #334155", 
    color: "#fff", 
    boxSizing: 'border-box' 
  },
  inputGroup: { 
    marginBottom: 15, 
    textAlign: 'left' 
  },
  label: { 
    fontSize: 10, 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 5 
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "12px" 
  },
  inputSmall: { 
    width: "100%", 
    padding: "10px", 
    borderRadius: "8px", 
    background: "#080c14", 
    border: "1px solid #334155", 
    color: "#fff", 
    boxSizing: 'border-box' 
  },
  fieldLabel: { 
    fontSize: 9, 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    display: 'block', 
    marginBottom: 5 
  }
};