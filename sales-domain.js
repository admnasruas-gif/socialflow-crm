/**
 * NasRuas CRM — Domínio Financeiro: Vendas do Mês, Recebimentos, Comissões, Fechamentos e Baixas
 * Módulo puro (sem acesso a DOM) com aritmética em centavos inteiros.
 *
 * Política oficial de arredondamento de comissões percentuais:
 * - Percentuais são armazenados em pontos-base inteiros (bps): 1% = 100 bps, 12,5% = 1250 bps.
 * - Fórmula: Math.round((base_centavos * percentual_bps) / 10000) (arredondamento comercial half-away-from-zero ao centavo mais próximo).
 * - Comissões já congeladas em fechamento ou com status 'paga' nunca sofrem recálculo automático ao editar regras.
 */

export const PT_MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MODALITY_LABELS = {
  midia_pronta: 'Mídia pronta',
  criacao_conteudo: 'Criação de conteúdo',
  outro: 'Outro',
  nao_informado: 'Não informado'
};

export const CONFERENCE_LABELS = {
  pendente: 'Pendente',
  conferida: 'Conferida',
  divergencia: 'Com divergência'
};

export const RECEIPT_LABELS = {
  nao_informado: 'Não informado',
  pendente: 'Pendente',
  parcial: 'Parcial',
  recebido: 'Recebido'
};

export const COMMISSION_LABELS = {
  a_definir: 'A definir',
  apurada: 'Apurada',
  paga: 'Paga',
  nao_se_aplica: 'Não se aplica'
};

export const TRIGGER_LABELS = {
  sobre_venda: 'Sobre a venda',
  sobre_recebido: 'Sobre o valor recebido',
  manual: 'Regra confirmada manualmente'
};

// ==================== PRECISÃO MONETÁRIA & PERCENTUAIS ====================
export function parseMoneyToCents(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return Math.round(raw * 100);
  }
  const str = String(raw).trim().replace(/^R\$\s*/i, '').replace(/\s+/g, '');
  if (!str) return null;

  let normalized = str;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    // Formato pt-BR: 1.234,56 -> remove pontos de milhar e troca vírgula por ponto
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100);
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function formatCentsBR(cents) {
  const num = Number(cents);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  const absFormatted = (Math.abs(Math.round(num)) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return num < 0 ? `-R$ ${absFormatted}` : `R$ ${absFormatted}`;
}

export function centsToInputStr(cents) {
  if (cents === null || cents === undefined || cents === '') return '';
  const num = Number(cents);
  if (!Number.isFinite(num)) return '';
  return (Math.round(num) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  });
}

export function parsePercentToBps(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const normalized = String(raw).trim().replace(/%/g, '').replace(',', '.');
  if (!normalized) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0 || num > 100) return null;
  return Math.round(num * 100);
}

export function formatBpsPercent(bps) {
  if (bps === null || bps === undefined || bps === '') return '';
  const pct = Number(bps) / 100;
  if (!Number.isFinite(pct)) return '';
  const str = Number.isInteger(pct)
    ? String(pct)
    : pct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return `${str}%`;
}

export function computePercentageCommissionCents(baseCents, percentualBps) {
  const safeBase = Math.max(0, Math.round(Number(baseCents) || 0));
  const safeBps = Math.max(0, Math.min(10000, Math.round(Number(percentualBps) || 0)));
  return Math.round((safeBase * safeBps) / 10000);
}

export function competenceFromISODate(isoDate) {
  const m = String(isoDate || '').trim().match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const month = Number(m[2]);
  if (month < 1 || month > 12) return '';
  return `${m[1]}-${m[2]}`;
}

export function formatCompetenceLabel(competence) {
  const m = String(competence || '').trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) return competence || '—';
  const idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return competence;
  return `${PT_MONTH_LABELS[idx]}/${m[1]}`;
}

export function getCurrentCompetenceISO(dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function generateUid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ==================== ESTADO VAZIO INICIAL (ZERO DADOS DE EXEMPLO) ====================
export function createEmptySalesState() {
  return {
    beneficiaries: [],
    rules: [],
    sales: [],
    salePosts: [],
    receipts: [],
    commissions: [],
    closures: [],
    closureItems: [],
    payouts: [],
    payoutItems: []
  };
}

export function ensureSalesState(container) {
  if (!container || typeof container !== 'object') return createEmptySalesState();
  if (!container.salesState || typeof container.salesState !== 'object') {
    container.salesState = createEmptySalesState();
  }
  const keys = [
    'beneficiaries', 'rules', 'sales', 'salePosts', 'receipts',
    'commissions', 'closures', 'closureItems', 'payouts', 'payoutItems'
  ];
  for (const k of keys) {
    if (!Array.isArray(container.salesState[k])) {
      container.salesState[k] = [];
    }
  }
  return container.salesState;
}

// ==================== RECEBIMENTOS & SALDO DA VENDA ====================
export function getSaleReceipts(saleId, receipts = []) {
  return (receipts || [])
    .filter(r => r.vendaId === saleId)
    .sort((a, b) => {
      const dateCmp = String(a.dataRecebimento || '').localeCompare(String(b.dataRecebimento || ''));
      if (dateCmp !== 0) return dateCmp;
      return String(a.criadoEm || '').localeCompare(String(b.criadoEm || ''));
    });
}

export function computeSaleReceiptSummary(sale, receipts = []) {
  const list = getSaleReceipts(sale?.id, receipts);
  const reversedIds = new Set();

  for (const r of list) {
    if (r.tipoMovimento === 'estorno' && r.estornoDeId) {
      reversedIds.add(r.estornoDeId);
    }
  }

  let totalRecebidoCentavos = 0;
  let activePositiveCount = 0;

  for (const r of list) {
    const raw = Math.round(Number(r.valorCentavos) || 0);
    const signed = r.tipoMovimento === 'estorno' ? -Math.abs(raw) : raw;
    totalRecebidoCentavos += signed;
    if (r.tipoMovimento !== 'estorno' && !reversedIds.has(r.id) && signed > 0) {
      activePositiveCount += 1;
    }
  }

  const saleValue = Math.max(0, Math.round(Number(sale?.valorCentavos) || 0));
  const saldoCentavos = Math.max(0, saleValue - totalRecebidoCentavos);
  const excedenteCentavos = Math.max(0, totalRecebidoCentavos - saleValue);
  const hasDivergenciaExcedente =
    totalRecebidoCentavos > saleValue ||
    list.some(r => r.divergenciaExcedente && !reversedIds.has(r.id));

  let statusRecebimento = 'nao_informado';
  if (list.length === 0 || (activePositiveCount === 0 && totalRecebidoCentavos <= 0)) {
    // Nunca permite marcar "recebido" sem registro financeiro ativo correspondente
    statusRecebimento = sale?.recebimentoStatus === 'pendente' ? 'pendente' : 'nao_informado';
  } else if (totalRecebidoCentavos <= 0) {
    statusRecebimento = 'pendente';
  } else if (totalRecebidoCentavos < saleValue) {
    statusRecebimento = 'parcial';
  } else {
    statusRecebimento = 'recebido';
  }

  return {
    movements: list,
    reversedIds,
    totalRecebidoCentavos,
    saldoCentavos,
    excedenteCentavos,
    hasDivergenciaExcedente,
    statusRecebimento,
    activePositiveCount
  };
}

export function validateNewReceipt(sale, existingReceipts = [], { valorCentavos, dataRecebimento } = {}) {
  const cents = Math.round(Number(valorCentavos));
  if (!Number.isFinite(cents) || cents <= 0) {
    return { ok: false, error: 'Informe um valor recebido maior que zero.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataRecebimento || '').trim())) {
    return { ok: false, error: 'Informe uma data de recebimento válida.' };
  }

  const summary = computeSaleReceiptSummary(sale, existingReceipts);
  const projectedTotal = summary.totalRecebidoCentavos + cents;
  const saleValue = Math.max(0, Math.round(Number(sale?.valorCentavos) || 0));
  const willExceedBalance = projectedTotal > saleValue;
  const excessCents = Math.max(0, projectedTotal - saleValue);

  return {
    ok: true,
    willExceedBalance,
    excessCents,
    projectedTotal
  };
}

// ==================== COMISSÕES INDEPENDENTES ====================
export function getSaleCommission(saleId, commissions = []) {
  return (commissions || []).find(c => c.vendaId === saleId) || null;
}

export function calculateCommissionForSale(commission, sale, receiptSummary = null) {
  if (!commission || !sale) return null;

  // Nunca recalcula comissões já pagas ou congeladas em fechamento
  if (commission.status === 'paga' || commission.congeladaEm || commission.fechamentoId) {
    return { ...commission };
  }

  if (commission.status === 'nao_se_aplica') {
    return {
      ...commission,
      baseCalculoCentavos: null,
      valorApuradoCentavos: 0
    };
  }

  const hasBeneficiary = Boolean(commission.beneficiarioId);
  const tipo = commission.tipoCalculo;
  const gatilho = commission.gatilhoApuracao;

  if (!hasBeneficiary || !tipo || !gatilho) {
    return {
      ...commission,
      status: 'a_definir',
      baseCalculoCentavos: null,
      valorApuradoCentavos: null
    };
  }

  if (tipo === 'fixo') {
    if (commission.valorFixoCentavos === null || commission.valorFixoCentavos === undefined) {
      return {
        ...commission,
        status: 'a_definir',
        baseCalculoCentavos: null,
        valorApuradoCentavos: null
      };
    }
    const fixedCents = Math.max(0, Math.round(Number(commission.valorFixoCentavos) || 0));
    return {
      ...commission,
      status: 'apurada',
      baseCalculoCentavos: Math.max(0, Math.round(Number(sale.valorCentavos) || 0)),
      valorApuradoCentavos: fixedCents
    };
  }

  if (tipo === 'percentual') {
    if (
      commission.percentualBps === null ||
      commission.percentualBps === undefined ||
      !commission.basePercentual
    ) {
      return {
        ...commission,
        status: 'a_definir',
        baseCalculoCentavos: null,
        valorApuradoCentavos: null
      };
    }
    const summary = receiptSummary || computeSaleReceiptSummary(sale, []);
    const baseCents = commission.basePercentual === 'valor_recebido'
      ? Math.max(0, summary.totalRecebidoCentavos)
      : Math.max(0, Math.round(Number(sale.valorCentavos) || 0));

    return {
      ...commission,
      status: 'apurada',
      baseCalculoCentavos: baseCents,
      valorApuradoCentavos: computePercentageCommissionCents(baseCents, commission.percentualBps)
    };
  }

  return {
    ...commission,
    status: 'a_definir',
    baseCalculoCentavos: null,
    valorApuradoCentavos: null
  };
}

export function formatCommissionRuleSummary(commission) {
  if (!commission) return 'A definir';
  if (commission.status === 'nao_se_aplica') return 'Não se aplica';
  if (commission.status === 'a_definir' || !commission.tipoCalculo) return 'A definir';
  const trig = TRIGGER_LABELS[commission.gatilhoApuracao] || commission.gatilhoApuracao || '';
  if (commission.tipoCalculo === 'fixo') {
    return `Fixo ${formatCentsBR(commission.valorFixoCentavos)} (${trig})`;
  }
  const baseLabel = commission.basePercentual === 'valor_recebido' ? 'sobre recebido' : 'sobre venda';
  return `${formatBpsPercent(commission.percentualBps)} ${baseLabel} (${trig})`;
}

// ==================== DETECÇÃO DE DUPLICIDADE & ANTI-CASCATA ====================
export function findPotentialDuplicateSales(
  sales = [],
  { clienteId, contratoId, competencia, valorCentavos, excludeSaleId = null } = {}
) {
  return (sales || []).filter(s => {
    if (excludeSaleId && s.id === excludeSaleId) return false;
    if (s.arquivado) return false;
    if (s.clienteId !== clienteId || s.contratoId !== contratoId) return false;
    if (competencia && s.competencia !== competencia) return false;
    if (valorCentavos !== undefined && valorCentavos !== null && Number(s.valorCentavos) !== Number(valorCentavos)) {
      return true; // Mesmo cliente + mesmo contrato + mesma competência já merece alerta de atenção
    }
    return true;
  });
}

export function hasFinancialRecordsForClient(salesState, clientId) {
  const s = ensureSalesState({ salesState });
  return s.sales.some(v => v.clienteId === clientId);
}

export function hasFinancialRecordsForContract(salesState, contractId) {
  const s = ensureSalesState({ salesState });
  return s.sales.some(v => v.contratoId === contractId);
}

export function hasFinancialRecordsForPost(salesState, postId) {
  const s = ensureSalesState({ salesState });
  return s.salePosts.some(sp => sp.postagemId === postId);
}

// ==================== BUSCA, FILTROS & 8 INDICADORES ====================
function buildClientContractLookup(clients = []) {
  const clientMap = new Map();
  const contractMap = new Map();
  for (const c of clients || []) {
    clientMap.set(c.id, c);
    for (const cnt of c.contracts || []) {
      contractMap.set(cnt.id, { ...cnt, clientId: c.id });
    }
  }
  return { clientMap, contractMap };
}

export function filterSales(salesState, clients = [], filters = {}) {
  const state = ensureSalesState({ salesState });
  const { clientMap, contractMap } = buildClientContractLookup(clients);

  const competenceFilter = filters.competencia || 'ALL';
  const dateMode = filters.dateMode === 'recebimento' ? 'recebimento' : 'competencia';
  const query = String(filters.query || '').trim().toLowerCase();
  const includeArchived = Boolean(filters.includeArchived);

  return state.sales.filter(sale => {
    if (!includeArchived && sale.arquivado) return false;

    const client = clientMap.get(sale.clienteId);
    const contract = contractMap.get(sale.contratoId);
    const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
    const rawCommission = getSaleCommission(sale.id, state.commissions);
    const commission = rawCommission ? calculateCommissionForSale(rawCommission, sale, receiptSummary) : null;
    const comStatus = commission ? commission.status : 'a_definir';

    if (competenceFilter !== 'ALL') {
      if (dateMode === 'recebimento') {
        const hasReceiptInMonth = receiptSummary.movements.some(r =>
          !receiptSummary.reversedIds.has(r.id) &&
          r.tipoMovimento !== 'estorno' &&
          competenceFromISODate(r.dataRecebimento) === competenceFilter
        );
        if (!hasReceiptInMonth) return false;
      } else if (sale.competencia !== competenceFilter) {
        return false;
      }
    }

    if (filters.clienteId && filters.clienteId !== 'ALL' && sale.clienteId !== filters.clienteId) return false;
    if (filters.contratoId && filters.contratoId !== 'ALL' && sale.contratoId !== filters.contratoId) return false;
    if (filters.agreementType && filters.agreementType !== 'ALL') {
      if ((contract?.agreementType || '') !== filters.agreementType) return false;
    }
    if (filters.conferenciaStatus && filters.conferenciaStatus !== 'ALL') {
      if ((sale.conferenciaStatus || 'pendente') !== filters.conferenciaStatus) return false;
    }
    if (filters.recebimentoStatus && filters.recebimentoStatus !== 'ALL') {
      if (receiptSummary.statusRecebimento !== filters.recebimentoStatus) return false;
    }
    if (filters.beneficiarioId && filters.beneficiarioId !== 'ALL') {
      if ((commission?.beneficiarioId || '') !== filters.beneficiarioId) return false;
    }
    if (filters.comissaoStatus && filters.comissaoStatus !== 'ALL') {
      if (comStatus !== filters.comissaoStatus) return false;
    }
    if (filters.modalidadeMaterial && filters.modalidadeMaterial !== 'ALL') {
      if ((sale.modalidadeMaterial || 'nao_informado') !== filters.modalidadeMaterial) return false;
    }

    if (query) {
      const hay = [
        sale.titulo,
        client?.name,
        client?.company,
        client?.instagram,
        contract?.period,
        contract?.agreementTitle
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(query)) return false;
    }

    return true;
  });
}

function computeReceiptAmountInCompetence(receiptSummary, competence) {
  if (!competence || competence === 'ALL') return receiptSummary.totalRecebidoCentavos;

  return receiptSummary.movements.reduce((total, movement) => {
    const raw = Math.abs(Math.round(Number(movement.valorCentavos) || 0));
    if (competenceFromISODate(movement.dataRecebimento) !== competence) return total;
    if (movement.tipoMovimento === 'estorno') return total - raw;
    if (receiptSummary.reversedIds.has(movement.id)) return total;
    return total + raw;
  }, 0);
}

export function computeSalesKPIs(filteredSales = [], salesState, filters = {}) {
  const state = ensureSalesState({ salesState });

  let totalVendidoCentavos = 0;
  let totalRecebidoCentavos = 0;
  let saldoReceberCentavos = 0;
  let aguardandoConferenciaCount = 0;
  let comDivergenciaCount = 0;
  let comissoesApuradasCentavos = 0;
  let comissoesPendentesCentavos = 0;
  let comissoesPagasCentavos = 0;
  let comissoesADefinirCount = 0;

  for (const sale of filteredSales) {
    // O valor da venda é sempre contabilizado 1 única vez, independente do número de publicações ligadas
    const val = Math.max(0, Math.round(Number(sale.valorCentavos) || 0));
    const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
    const rawCommission = getSaleCommission(sale.id, state.commissions);
    const commission = rawCommission ? calculateCommissionForSale(rawCommission, sale, receiptSummary) : null;

    totalVendidoCentavos += val;
    totalRecebidoCentavos += receiptSummary.totalRecebidoCentavos;
    saldoReceberCentavos += receiptSummary.saldoCentavos;

    if ((sale.conferenciaStatus || 'pendente') === 'pendente') {
      aguardandoConferenciaCount += 1;
    }
    if (sale.conferenciaStatus === 'divergencia' || receiptSummary.hasDivergenciaExcedente) {
      comDivergenciaCount += 1;
    }

    if (!commission || commission.status === 'a_definir') {
      comissoesADefinirCount += 1;
    } else if (commission.status === 'apurada') {
      const comVal = Math.max(0, Math.round(Number(commission.valorApuradoCentavos) || 0));
      comissoesApuradasCentavos += comVal;
      comissoesPendentesCentavos += comVal;
    } else if (commission.status === 'paga') {
      const comVal = Math.max(0, Math.round(Number(commission.valorApuradoCentavos) || 0));
      comissoesApuradasCentavos += comVal;
      comissoesPagasCentavos += comVal;
    }
  }

  return {
    qtdVendas: filteredSales.length,
    totalVendidoCentavos,
    totalRecebidoCentavos,
    totalRecebidoNoPeriodoCentavos: filteredSales.reduce((total, sale) => {
      const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
      return total + computeReceiptAmountInCompetence(receiptSummary, filters.competencia);
    }, 0),
    saldoReceberCentavos,
    aguardandoConferenciaCount,
    comDivergenciaCount,
    comissoesApuradasCentavos,
    comissoesPendentesCentavos,
    comissoesPagasCentavos,
    comissoesADefinirCount
  };
}

// ==================== FECHAMENTO DO MÊS & REABERTURA CONTROLADA ====================
export function buildClosurePreview(competencia, salesState, clients = []) {
  const state = ensureSalesState({ salesState });
  const salesInMonth = state.sales.filter(s => !s.arquivado && s.competencia === competencia);
  const existingClosed = state.closures.find(cl => cl.competencia === competencia && cl.status === 'fechado') || null;
  const benefMap = new Map((state.beneficiaries || []).map(b => [b.id, b]));
  const { clientMap, contractMap } = buildClientContractLookup(clients);

  let totalVendidoCentavos = 0;
  let totalRecebidoCentavos = 0;
  let saldoReceberCentavos = 0;
  let totalComissaoCentavos = 0;
  let divergenciasCount = 0;
  let conferenciaPendenteCount = 0;
  let comissoesADefinirCount = 0;

  const byBeneficiaryMap = new Map();
  const itemsPreview = [];

  for (const sale of salesInMonth) {
    const val = Math.max(0, Math.round(Number(sale.valorCentavos) || 0));
    const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
    const rawCommission = getSaleCommission(sale.id, state.commissions);
    const commission = rawCommission ? calculateCommissionForSale(rawCommission, sale, receiptSummary) : null;
    const comStatus = commission ? commission.status : 'a_definir';
    const hasDivergencia = sale.conferenciaStatus === 'divergencia' || receiptSummary.hasDivergenciaExcedente;

    totalVendidoCentavos += val;
    totalRecebidoCentavos += receiptSummary.totalRecebidoCentavos;
    saldoReceberCentavos += receiptSummary.saldoCentavos;

    if (hasDivergencia) divergenciasCount += 1;
    if ((sale.conferenciaStatus || 'pendente') === 'pendente') conferenciaPendenteCount += 1;
    if (comStatus === 'a_definir') comissoesADefinirCount += 1;

    let comVal = 0;
    if (comStatus === 'apurada' || comStatus === 'paga') {
      comVal = Math.max(0, Math.round(Number(commission?.valorApuradoCentavos) || 0));
      totalComissaoCentavos += comVal;
    }

    const benef = commission?.beneficiarioId ? benefMap.get(commission.beneficiarioId) : null;
    const benefName = benef?.nome || (comStatus === 'nao_se_aplica' ? 'Sem comissão' : 'A definir');
    const benefKey = benef?.id || (comStatus === 'nao_se_aplica' ? '__none__' : '__undefined__');

    if (comStatus === 'apurada' || comStatus === 'paga') {
      if (!byBeneficiaryMap.has(benefKey)) {
        byBeneficiaryMap.set(benefKey, {
          beneficiarioId: benef?.id || null,
          beneficiarioNome: benefName,
          qtdVendas: 0,
          totalComissaoCentavos: 0,
          totalApuradoPendenteCentavos: 0,
          totalPagoCentavos: 0
        });
      }
      const grp = byBeneficiaryMap.get(benefKey);
      grp.qtdVendas += 1;
      grp.totalComissaoCentavos += comVal;
      if (comStatus === 'paga') grp.totalPagoCentavos += comVal;
      else grp.totalApuradoPendenteCentavos += comVal;
    }

    const client = clientMap.get(sale.clienteId);
    const contract = contractMap.get(sale.contratoId);

    itemsPreview.push({
      sale,
      clientName: client?.name || 'Cliente removido',
      contractLabel: contract?.agreementTitle || contract?.period || 'Acordo',
      receiptSummary,
      commission,
      beneficiarioId: commission?.beneficiarioId || null,
      beneficiarioNomeSnapshot: benefName,
      regraResumoSnapshot: formatCommissionRuleSummary(commission),
      valorComissaoCentavos: comVal,
      statusComissaoSnapshot: comStatus,
      hasDivergencia
    });
  }

  const blockers = [];
  if (salesInMonth.length === 0) {
    blockers.push('Não há vendas ativas nesta competência para fechar.');
  }
  if (existingClosed) {
    blockers.push(`A competência ${formatCompetenceLabel(competencia)} já possui um fechamento ativo.`);
  }
  if (divergenciasCount > 0) {
    blockers.push(`${divergenciasCount} venda(s) com divergência (conferência ou recebimento excedente) aguardando resolução.`);
  }
  if (comissoesADefinirCount > 0) {
    blockers.push(`${comissoesADefinirCount} venda(s) com comissão em "A definir". Defina a comissão ou marque como "Não se aplica".`);
  }

  return {
    competencia,
    existingClosed,
    qtdVendas: salesInMonth.length,
    totalVendidoCentavos,
    totalRecebidoCentavos,
    saldoReceberCentavos,
    totalComissaoCentavos,
    divergenciasCount,
    conferenciaPendenteCount,
    comissoesADefinirCount,
    byBeneficiary: Array.from(byBeneficiaryMap.values()),
    itemsPreview,
    blockers,
    canClose: blockers.length === 0
  };
}

export function executeMonthClosure(
  competencia,
  salesState,
  clients = [],
  { authorEmail = '', authorUserId = null, observacoes = '', idempotencyKey = '' } = {}
) {
  const state = ensureSalesState({ salesState });
  if (idempotencyKey) {
    const dup = state.closures.find(cl => cl.idempotencyKey === idempotencyKey);
    if (dup) return { ok: true, closure: dup, items: state.closureItems.filter(i => i.fechamentoId === dup.id), idempotentHit: true };
  }

  const preview = buildClosurePreview(competencia, state, clients);
  if (!preview.canClose) {
    return { ok: false, error: preview.blockers[0] || 'Existem pendências impedindo o fechamento.', preview };
  }

  const nowIso = new Date().toISOString();
  const closureId = generateUid('fech');
  const closure = {
    id: closureId,
    competencia,
    status: 'fechado',
    qtdVendas: preview.qtdVendas,
    totalVendidoCentavos: preview.totalVendidoCentavos,
    totalRecebidoCentavos: preview.totalRecebidoCentavos,
    saldoReceberCentavos: preview.saldoReceberCentavos,
    totalComissaoCentavos: preview.totalComissaoCentavos,
    confirmadoPorUserId: authorUserId,
    confirmadoPorEmail: authorEmail,
    confirmadoEm: nowIso,
    reabertoEm: null,
    reabertoPorEmail: '',
    motivoReabertura: '',
    observacoes: String(observacoes || '').trim(),
    idempotencyKey: idempotencyKey || null,
    criadoEm: nowIso
  };

  const newItems = [];
  for (const item of preview.itemsPreview) {
    const fItem = {
      id: generateUid('fitem'),
      fechamentoId: closureId,
      vendaId: item.sale.id,
      vendaComissaoId: item.commission?.id || null,
      beneficiarioId: item.beneficiarioId,
      beneficiarioNomeSnapshot: item.beneficiarioNomeSnapshot,
      vendaValorCentavos: item.sale.valorCentavos,
      recebidoSnapshotCentavos: item.receiptSummary.totalRecebidoCentavos,
      baseCalculoCentavos: item.commission?.baseCalculoCentavos ?? item.sale.valorCentavos,
      regraResumoSnapshot: item.regraResumoSnapshot,
      valorComissaoCentavos: item.valorComissaoCentavos,
      statusComissaoSnapshot: item.statusComissaoSnapshot,
      criadoEm: nowIso
    };
    newItems.push(fItem);

    // Vincula e congela a venda e a comissão apurada (NUNCA marca comissão como paga automaticamente!)
    item.sale.fechamentoId = closureId;
    item.sale.atualizadoEm = nowIso;

    if (item.commission) {
      const targetCom = state.commissions.find(c => c.id === item.commission.id) || item.commission;
      const recalculated = calculateCommissionForSale(targetCom, item.sale, item.receiptSummary);
      Object.assign(targetCom, recalculated);
      targetCom.fechamentoId = closureId;
      if (!targetCom.congeladaEm) {
        targetCom.congeladaEm = nowIso;
      }
      targetCom.atualizadoEm = nowIso;
    }
  }

  state.closures.unshift(closure);
  state.closureItems.push(...newItems);

  return { ok: true, closure, items: newItems };
}

export function reopenMonthClosure(closureId, salesState, { authorEmail = '', motivo = '' } = {}) {
  const state = ensureSalesState({ salesState });
  const closure = state.closures.find(c => c.id === closureId);
  if (!closure) return { ok: false, error: 'Fechamento não encontrado.' };
  if (closure.status !== 'fechado') return { ok: false, error: 'Este fechamento já foi reaberto anteriormente.' };
  const reason = String(motivo || '').trim();
  if (!reason) return { ok: false, error: 'Informe o motivo para reabrir o fechamento.' };

  const nowIso = new Date().toISOString();
  closure.status = 'reaberto';
  closure.reabertoEm = nowIso;
  closure.reabertoPorEmail = authorEmail;
  closure.motivoReabertura = reason;

  // Libera apenas vendas e comissões NÃO pagas; preserva snapshot e comissões já pagas intactas
  for (const sale of state.sales) {
    if (sale.fechamentoId === closureId) {
      sale.fechamentoId = null;
      sale.atualizadoEm = nowIso;
    }
  }
  for (const com of state.commissions) {
    if (com.fechamentoId === closureId) {
      com.fechamentoId = null;
      if (com.status !== 'paga') {
        com.congeladaEm = null;
      }
      com.atualizadoEm = nowIso;
    }
  }

  return { ok: true, closure };
}

// ==================== BAIXA DE COMISSÕES & ESTORNO ====================
export function validatePayoutSelection(commissionIds = [], salesState) {
  const state = ensureSalesState({ salesState });
  const uniqueIds = Array.from(new Set((commissionIds || []).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { ok: false, error: 'Selecione ao menos uma comissão apurada para dar baixa.' };
  }

  const activePaidCommissionIds = new Set(
    state.payoutItems.filter(pi => pi.ativo !== false).map(pi => pi.vendaComissaoId)
  );

  const selected = [];
  let beneficiaryId = null;

  for (const comId of uniqueIds) {
    const com = state.commissions.find(c => c.id === comId);
    if (!com) {
      return { ok: false, error: 'Uma das comissões selecionadas não foi encontrada.' };
    }
    if (com.status === 'paga' || activePaidCommissionIds.has(com.id)) {
      return { ok: false, error: 'Baixa duplicada bloqueada: há comissão já paga/baixada na seleção.' };
    }
    if (com.status !== 'apurada') {
      return { ok: false, error: 'Somente comissões com situação "Apurada" podem receber baixa de pagamento.' };
    }
    if (!com.beneficiarioId) {
      return { ok: false, error: 'A comissão selecionada não possui beneficiário definido.' };
    }
    if (beneficiaryId === null) {
      beneficiaryId = com.beneficiarioId;
    } else if (beneficiaryId !== com.beneficiarioId) {
      return { ok: false, error: 'Não é permitido misturar beneficiários diferentes em um mesmo pagamento.' };
    }
    selected.push(com);
  }

  const totalCentavos = selected.reduce(
    (sum, c) => sum + Math.max(0, Math.round(Number(c.valorApuradoCentavos) || 0)),
    0
  );

  return {
    ok: true,
    beneficiaryId,
    items: selected,
    totalCentavos
  };
}

export function executeCommissionPayout(
  commissionIds = [],
  salesState,
  {
    dataPagamento,
    formaPagamento = '',
    referencia = '',
    observacoes = '',
    authorEmail = '',
    fechamentoId = null,
    idempotencyKey = ''
  } = {}
) {
  const state = ensureSalesState({ salesState });
  if (idempotencyKey) {
    const existing = state.payouts.find(p => p.idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        ok: true,
        payout: existing,
        payoutItems: state.payoutItems.filter(pi => pi.baixaId === existing.id),
        idempotentHit: true
      };
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataPagamento || '').trim())) {
    return { ok: false, error: 'Informe uma data efetiva de pagamento válida.' };
  }

  const check = validatePayoutSelection(commissionIds, state);
  if (!check.ok) return check;

  const nowIso = new Date().toISOString();
  const payoutId = generateUid('bx');
  const resolvedClosureId = fechamentoId || check.items.find(i => i.fechamentoId)?.fechamentoId || null;

  const payout = {
    id: payoutId,
    beneficiarioId: check.beneficiaryId,
    fechamentoId: resolvedClosureId,
    valorTotalCentavos: check.totalCentavos,
    dataPagamento,
    formaPagamento: String(formaPagamento || '').trim(),
    referencia: String(referencia || '').trim(),
    observacoes: String(observacoes || '').trim(),
    registradoPorEmail: authorEmail,
    idempotencyKey: idempotencyKey || null,
    estornadoEm: null,
    estornadoPorEmail: '',
    motivoEstorno: '',
    criadoEm: nowIso
  };

  const newPayoutItems = [];
  for (const com of check.items) {
    const quitado = Math.max(0, Math.round(Number(com.valorApuradoCentavos) || 0));
    newPayoutItems.push({
      id: generateUid('bxi'),
      baixaId: payoutId,
      vendaComissaoId: com.id,
      valorQuitadoCentavos: quitado,
      ativo: true,
      criadoEm: nowIso
    });
    // Quita integralmente o item na v1, sem tocar no recebimento do cliente
    com.status = 'paga';
    com.pagoEm = dataPagamento;
    com.atualizadoEm = nowIso;
  }

  state.payouts.unshift(payout);
  state.payoutItems.push(...newPayoutItems);

  return { ok: true, payout, payoutItems: newPayoutItems };
}

export function reverseCommissionPayout(payoutId, salesState, { authorEmail = '', motivo = '' } = {}) {
  const state = ensureSalesState({ salesState });
  const payout = state.payouts.find(p => p.id === payoutId);
  if (!payout) return { ok: false, error: 'Pagamento de comissão não encontrado.' };
  if (payout.estornadoEm) return { ok: false, error: 'Este pagamento já foi estornado.' };

  const reason = String(motivo || '').trim();
  if (!reason) return { ok: false, error: 'Informe o motivo para registrar o estorno da baixa.' };

  const nowIso = new Date().toISOString();
  payout.estornadoEm = nowIso;
  payout.estornadoPorEmail = authorEmail;
  payout.motivoEstorno = reason;

  for (const pi of state.payoutItems) {
    if (pi.baixaId === payoutId && pi.ativo !== false) {
      pi.ativo = false;
      const com = state.commissions.find(c => c.id === pi.vendaComissaoId);
      if (com && com.status === 'paga') {
        com.status = 'apurada';
        com.pagoEm = null;
        com.atualizadoEm = nowIso;
      }
    }
  }

  return { ok: true, payout };
}

// ==================== RELATÓRIOS INTERNOS & CSV ====================
export function buildSalesReport(filteredSales = [], salesState, clients = [], meta = {}) {
  const state = ensureSalesState({ salesState });
  const { clientMap, contractMap } = buildClientContractLookup(clients);
  const benefMap = new Map(state.beneficiaries.map(b => [b.id, b]));

  const rows = filteredSales.map(sale => {
    const client = clientMap.get(sale.clienteId);
    const contract = contractMap.get(sale.contratoId);
    const receipt = computeSaleReceiptSummary(sale, state.receipts);
    const rawCom = getSaleCommission(sale.id, state.commissions);
    const com = rawCom ? calculateCommissionForSale(rawCom, sale, receipt) : null;
    const benef = com?.beneficiarioId ? benefMap.get(com.beneficiarioId) : null;

    return {
      saleId: sale.id,
      cliente: client?.name || 'Cliente',
      acordo: contract?.agreementTitle || contract?.period || 'Acordo',
      tipoAcordo: contract?.agreementType || 'Não classificado',
      descricao: sale.titulo,
      competencia: formatCompetenceLabel(sale.competencia),
      dataVenda: sale.dataVenda,
      valorCentavos: Math.max(0, Math.round(Number(sale.valorCentavos) || 0)),
      recebidoCentavos: receipt.totalRecebidoCentavos,
      saldoCentavos: receipt.saldoCentavos,
      conferencia: CONFERENCE_LABELS[sale.conferenciaStatus || 'pendente'] || 'Pendente',
      recebimento: RECEIPT_LABELS[receipt.statusRecebimento] || 'Não informado',
      beneficiario: benef?.nome || (com?.status === 'nao_se_aplica' ? '—' : 'A definir')
    };
  });

  const totals = computeSalesKPIs(filteredSales, state);
  return {
    type: 'vendas_mes',
    title: 'Relatório Interno — Vendas do Mês',
    periodLabel: meta.periodLabel || 'Todos os períodos',
    dateModeLabel: meta.dateMode === 'recebimento' ? 'Por data de recebimento' : 'Por competência',
    rows,
    totals
  };
}

export function buildCommissionsReport(salesState, clients = [], filters = {}) {
  const state = ensureSalesState({ salesState });
  const filteredSales = filterSales(state, clients, filters);
  const { clientMap } = buildClientContractLookup(clients);
  const benefMap = new Map(state.beneficiaries.map(b => [b.id, b]));
  const payoutById = new Map(state.payouts.map(p => [p.id, p]));
  const activeItemByComId = new Map(
    state.payoutItems.filter(pi => pi.ativo !== false).map(pi => [pi.vendaComissaoId, pi])
  );

  const rows = [];
  let totalBaseCentavos = 0;
  let totalApuradoCentavos = 0;
  let totalPagoCentavos = 0;
  let totalPendenteCentavos = 0;

  for (const sale of filteredSales) {
    const client = clientMap.get(sale.clienteId);
    const receipt = computeSaleReceiptSummary(sale, state.receipts);
    const rawCom = getSaleCommission(sale.id, state.commissions);
    const com = rawCom ? calculateCommissionForSale(rawCom, sale, receipt) : null;
    const status = com?.status || 'a_definir';
    const benef = com?.beneficiarioId ? benefMap.get(com.beneficiarioId) : null;
    const activePi = com ? activeItemByComId.get(com.id) : null;
    const activePayout = activePi ? payoutById.get(activePi.baixaId) : null;
    const apurado = (status === 'apurada' || status === 'paga')
      ? Math.max(0, Math.round(Number(com?.valorApuradoCentavos) || 0))
      : 0;
    const base = (status === 'apurada' || status === 'paga')
      ? Math.max(0, Math.round(Number(com?.baseCalculoCentavos) || 0))
      : 0;

    if (status === 'apurada' || status === 'paga') {
      totalBaseCentavos += base;
      totalApuradoCentavos += apurado;
      if (status === 'paga') totalPagoCentavos += apurado;
      else totalPendenteCentavos += apurado;
    }

    rows.push({
      beneficiario: benef?.nome || (status === 'nao_se_aplica' ? 'Sem comissão' : 'A definir'),
      cliente: client?.name || 'Cliente',
      vendaTitulo: sale.titulo,
      competencia: formatCompetenceLabel(sale.competencia),
      baseCalculoCentavos: base,
      regra: formatCommissionRuleSummary(com),
      valorApuradoCentavos: apurado,
      situacao: COMMISSION_LABELS[status] || status,
      dataPagamento: com?.pagoEm || '',
      referenciaBaixa: activePayout?.referencia || activePayout?.id || ''
    });
  }

  return {
    type: 'comissoes',
    title: 'Relatório Interno — Comissões',
    rows,
    totals: {
      totalBaseCentavos,
      totalApuradoCentavos,
      totalPagoCentavos,
      totalPendenteCentavos
    }
  };
}

export function buildClosureReport(closureId, salesState, clients = []) {
  const state = ensureSalesState({ salesState });
  const closure = state.closures.find(c => c.id === closureId);
  if (!closure) return null;

  const { clientMap } = buildClientContractLookup(clients);
  const salesMap = new Map(state.sales.map(s => [s.id, s]));
  const items = state.closureItems.filter(i => i.fechamentoId === closureId).map(i => {
    const sale = salesMap.get(i.vendaId);
    const client = sale ? clientMap.get(sale.clienteId) : null;
    return {
      ...i,
      clienteNome: client?.name || 'Cliente',
      vendaTitulo: sale?.titulo || 'Venda'
    };
  });

  const byBeneficiary = new Map();
  for (const item of items) {
    const key = item.beneficiarioNomeSnapshot || 'A definir';
    if (!byBeneficiary.has(key)) {
      byBeneficiary.set(key, { beneficiario: key, qtd: 0, totalCentavos: 0 });
    }
    const g = byBeneficiary.get(key);
    g.qtd += 1;
    g.totalCentavos += Math.max(0, Math.round(Number(item.valorComissaoCentavos) || 0));
  }

  const relatedReversals = state.payouts.filter(p => p.fechamentoId === closureId && p.estornadoEm);

  return {
    type: 'fechamento',
    title: `Relatório Interno — Fechamento ${formatCompetenceLabel(closure.competencia)}`,
    closure,
    items,
    byBeneficiary: Array.from(byBeneficiary.values()),
    relatedReversals
  };
}

export function exportReportToCsvText(headers = [], rows = []) {
  const escapeCell = (val) => {
    let str = String(val ?? '').replace(/\r?\n/g, ' ');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escapeCell).join(';')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(';'));
  }
  return '\uFEFF' + lines.join('\r\n');
}
