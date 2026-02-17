 async function handleCalculate() {
    setError("");
    if (selectedVehicles.length === 0) {
      setError("Selecione pelo menos 1 veículo para continuar.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        vehicles: selectedVehicles.map((modelNameClean) => ({
          model_name_clean: modelNameClean,
          year_num: Number(yearNum),
          km_mensal: Number(kmMensal),
          taxa_juros_mensal: Number(taxaJurosMensal),
          percentual_aplicado: Number(percentualAplicado),
          custo_pneus: Number(custoPneus),
          revisao_mensal: Number(revisaoMensal),
          seguro_anual: Number(seguroAnual),
          impostos_mensais: Number(impostosMensais),
          rastreamento_mensal: Number(rastreamentoMensal),
          projecao_revenda: null,
          prazos: prazos,
        })),
      };
      const r = await api.post("/pricing/compare", payload);
      setResults(r.data);
    } catch (e) {
      setError("Erro ao processar cálculos.");
    } finally {
      setLoading(false);
    }
  }