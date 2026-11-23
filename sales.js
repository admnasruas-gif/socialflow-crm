/**
 * NasRuas CRM — Controlador do Módulo Financeiro "Vendas do Mês"
 * Responsável por persistência (Supabase + fallback local), formulários,
 * conferência, recebimentos, comissões, fechamentos mensais, baixas e relatórios internos.
 *
 * Regras absolutas:
 * - Zero dados importados de listas anteriores ou exemplos fictícios. Estado inicial sempre vazio.
 * - Reutiliza exclusivamente clientes, contratos e publicações existentes via window.__nasruasCore.
 * - Estados de Conferência, Recebimento, Comissão, Fechamento e Baixa são independentes.
 */

import {
  MODALITY_LABELS,
  CONFERENCE_LABELS,
  RECEIPT_LABELS,
  COMMISSION_LABELS,
  TRIGGER_LABELS,
  parseMoneyToCents,
  formatCentsBR,
  centsToInputStr,
  parsePercentToBps,
  formatBpsPercent,
  competenceFromISODate,
  formatCompetenceLabel,
  getCurrentCompetenceISO,
  generateUid,
  ensureSalesState,
  computeSaleReceiptSummary,
  validateNewReceipt,
  getSaleCommission,
  calculateCommissionForSale,
  formatCommissionRuleSummary,
  findPotentialDuplicateSales,
  hasFinancialRecordsForClient,
  hasFinancialRecordsForContract,
  hasFinancialRecordsForPost,
  filterSales,
  computeSalesKPIs,
  buildClosurePreview,
  executeMonthClosure,
  reopenMonthClosure,
  validatePayoutSelection,
  executeCommissionPayout,
  reverseCommissionPayout,
  buildSalesReport,
  buildCommissionsReport,
  buildClosureReport,
  exportReportToCsvText
} from './sales-domain.js';

const core = () => (typeof window !== 'undefined' ? window.__nasruasCore : null);
const el = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);

let salesModuleInitialized = false;
let activeSalesSubtab = 'lancamentos';
let competenceTouchedManually = false;
let currentDetailSaleId = null;
let selectedCommissionIds = new Set();
let pendingSaleDraft = null;
let lastRenderedSalesReportData = null;
let editingBeneficiaryId = null;
let editingRuleId = null;

let isSubmittingSale = false;
let isSubmittingReceipt = false;
let isSubmittingCommission = false;
let isSubmittingClosure = false;
let isSubmittingPayout = false;
let isSubmittingConfig = false;

const salesFilterState = {
  competencia: getCurrentCompetenceISO(),
  dateMode: 'competencia',
  query: '',
  clienteId: 'ALL',
  contratoId: 'ALL',
  agreementType: 'ALL',
  conferenciaStatus: 'ALL',
  recebimentoStatus: 'ALL',
  beneficiarioId: 'ALL',
  comissaoStatus: 'ALL',
  modalidadeMaterial: 'ALL'
};

// ==================== HELPERS DE CONTEXTO ====================
function getAppDataSafe() {
  const c = core();
  const appData = c?.getAppData?.() || { clients: [], videos: [] };
  c?.ensureRecoveryStructures?.();
  ensureSalesState(appData);
  return appData;
}

function getSalesStateSafe() {
  return ensureSalesState(getAppDataSafe());
}

function getTodayISODate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function escapeStr(val = '') {
  const c = core();
  if (c?.escapeHtml) return c.escapeHtml(String(val ?? ''));
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTimeBR(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnlyBR(isoDate) {
  const c = core();
  if (c?.formatDateBR) return c.formatDateBR(isoDate);
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (isoDate || '—');
}

function findClientAndContract(clienteId, contratoId) {
  const clients = getAppDataSafe().clients || [];
  const client = clients.find(c => c.id === clienteId) || null;
  const contract = client?.contracts?.find(cnt => cnt.id === contratoId) || null;
  return { client, contract };
}

function isSaleLockedByClosure(sale) {
  if (!sale?.fechamentoId) return false;
  const state = getSalesStateSafe();
  const closure = state.closures.find(cl => cl.id === sale.fechamentoId);
  return closure?.status === 'fechado';
}

function isCommissionLocked(commission) {
  if (!commission) return false;
  if (commission.status === 'paga' || commission.congeladaEm) return true;
  if (commission.fechamentoId) {
    const closure = getSalesStateSafe().closures.find(cl => cl.id === commission.fechamentoId);
    if (closure?.status === 'fechado') return true;
  }
  return false;
}

function getBadgeClassForConference(status) {
  if (status === 'conferida') return 'sales-badge-success';
  if (status === 'divergencia') return 'sales-badge-danger';
  return 'sales-badge-warning';
}

function getBadgeClassForReceipt(status) {
  if (status === 'recebido') return 'sales-badge-success';
  if (status === 'parcial') return 'sales-badge-info';
  if (status === 'pendente') return 'sales-badge-warning';
  return 'sales-badge-neutral';
}

function getBadgeClassForCommission(status) {
  if (status === 'paga') return 'sales-badge-success';
  if (status === 'apurada') return 'sales-badge-info';
  if (status === 'nao_se_aplica') return 'sales-badge-neutral';
  return 'sales-badge-warning';
}

function isMissingTableError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /does not exist|schema cache|Could not find the table/i.test(msg)
  );
}

// ==================== MAPEAMENTO SUPABASE <-> DOMÍNIO ====================
function mapBeneficiaryRow(r) {
  return {
    id: r.id,
    nome: r.nome || '',
    papel: r.papel || '',
    userAuthId: r.user_auth_id || null,
    observacoes: r.observacoes || '',
    ativo: r.ativo !== false,
    criadoEm: r.criado_em || '',
    atualizadoEm: r.atualizado_em || ''
  };
}

function mapRuleRow(r) {
  return {
    id: r.id,
    nome: r.nome || '',
    beneficiarioId: r.beneficiario_id,
    tipoCalculo: r.tipo_calculo || 'percentual',
    percentualBps: r.percentual_bps !== null && r.percentual_bps !== undefined ? Number(r.percentual_bps) : null,
    valorFixoCentavos: r.valor_fixo_centavos !== null && r.valor_fixo_centavos !== undefined ? Number(r.valor_fixo_centavos) : null,
    basePercentual: r.base_percentual || null,
    gatilhoApuracao: r.gatilho_apuracao || 'sobre_venda',
    modalidadeFiltro: r.modalidade_filtro || null,
    ativo: r.ativo !== false,
    criadoEm: r.criado_em || '',
    atualizadoEm: r.atualizado_em || ''
  };
}

function mapSaleRow(r) {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    contratoId: r.contrato_id,
    titulo: r.titulo || '',
    dataVenda: r.data_venda || '',
    competencia: r.competencia || '',
    valorCentavos: Number(r.valor_centavos || 0),
    modalidadeMaterial: r.modalidade_material || 'nao_informado',
    detalhePacoteComplementar: r.detalhe_pacote_complementar || '',
    observacoesInternas: r.observacoes_internas || '',
    conferenciaStatus: r.conferencia_status || 'pendente',
    conferenciaObs: r.conferencia_obs || '',
    conferidoPorUserId: r.conferido_por_user_id || null,
    conferidoPorEmail: r.conferido_por_email || '',
    conferidoEm: r.conferido_em || null,
    recebimentoStatus: r.recebimento_status || 'nao_informado',
    fechamentoId: r.fechamento_id || null,
    idempotencyKey: r.idempotency_key || null,
    arquivado: Boolean(r.arquivado),
    criadoEm: r.criado_em || '',
    atualizadoEm: r.atualizado_em || ''
  };
}

function mapSalePostRow(r) {
  return {
    id: r.id,
    vendaId: r.venda_id,
    postagemId: r.postagem_id,
    criadoEm: r.criado_em || ''
  };
}

function mapReceiptRow(r) {
  return {
    id: r.id,
    vendaId: r.venda_id,
    tipoMovimento: r.tipo_movimento || 'recebimento',
    estornoDeId: r.estorno_de_id || null,
    valorCentavos: Number(r.valor_centavos || 0),
    dataRecebimento: r.data_recebimento || '',
    formaPagamento: r.forma_pagamento || '',
    referencia: r.referencia || '',
    observacoes: r.observacoes || '',
    divergenciaExcedente: Boolean(r.divergencia_excedente),
    registradoPorEmail: r.registrado_por_email || '',
    idempotencyKey: r.idempotency_key || null,
    criadoEm: r.criado_em || ''
  };
}

function mapCommissionRow(r) {
  return {
    id: r.id,
    vendaId: r.venda_id,
    beneficiarioId: r.beneficiario_id || null,
    regraId: r.regra_id || null,
    status: r.status || 'a_definir',
    tipoCalculo: r.tipo_calculo || null,
    percentualBps: r.percentual_bps !== null && r.percentual_bps !== undefined ? Number(r.percentual_bps) : null,
    valorFixoCentavos: r.valor_fixo_centavos !== null && r.valor_fixo_centavos !== undefined ? Number(r.valor_fixo_centavos) : null,
    basePercentual: r.base_percentual || null,
    gatilhoApuracao: r.gatilho_apuracao || null,
    baseCalculoCentavos: r.base_calculo_centavos !== null && r.base_calculo_centavos !== undefined ? Number(r.base_calculo_centavos) : null,
    valorApuradoCentavos: r.valor_apurado_centavos !== null && r.valor_apurado_centavos !== undefined ? Number(r.valor_apurado_centavos) : null,
    fechamentoId: r.fechamento_id || null,
    pagoEm: r.pago_em || null,
    congeladaEm: r.congelada_em || null,
    observacoes: r.observacoes || '',
    criadoEm: r.criado_em || '',
    atualizadoEm: r.atualizado_em || ''
  };
}

function mapClosureRow(r) {
  return {
    id: r.id,
    competencia: r.competencia || '',
    status: r.status || 'fechado',
    qtdVendas: Number(r.qtd_vendas || 0),
    totalVendidoCentavos: Number(r.total_vendido_centavos || 0),
    totalRecebidoCentavos: Number(r.total_recebido_centavos || 0),
    saldoReceberCentavos: Number(r.saldo_receber_centavos || 0),
    totalComissaoCentavos: Number(r.total_comissao_centavos || 0),
    confirmadoPorUserId: r.confirmado_por_user_id || null,
    confirmadoPorEmail: r.confirmado_por_email || '',
    confirmadoEm: r.confirmado_em || '',
    reabertoEm: r.reaberto_em || null,
    reabertoPorEmail: r.reaberto_por_email || '',
    motivoReabertura: r.motivo_reabertura || '',
    observacoes: r.observacoes || '',
    idempotencyKey: r.idempotency_key || null,
    criadoEm: r.criado_em || ''
  };
}

function mapClosureItemRow(r) {
  return {
    id: r.id,
    fechamentoId: r.fechamento_id,
    vendaId: r.venda_id,
    vendaComissaoId: r.venda_comissao_id || null,
    beneficiarioId: r.beneficiario_id || null,
    beneficiarioNomeSnapshot: r.beneficiario_nome_snapshot || '',
    vendaValorCentavos: Number(r.venda_valor_centavos || 0),
    recebidoSnapshotCentavos: Number(r.recebido_snapshot_centavos || 0),
    baseCalculoCentavos: r.base_calculo_centavos !== null && r.base_calculo_centavos !== undefined ? Number(r.base_calculo_centavos) : null,
    regraResumoSnapshot: r.regra_resumo_snapshot || '',
    valorComissaoCentavos: Number(r.valor_comissao_centavos || 0),
    statusComissaoSnapshot: r.status_comissao_snapshot || 'a_definir',
    criadoEm: r.criado_em || ''
  };
}

function mapPayoutRow(r) {
  return {
    id: r.id,
    beneficiarioId: r.beneficiario_id,
    fechamentoId: r.fechamento_id || null,
    valorTotalCentavos: Number(r.valor_total_centavos || 0),
    dataPagamento: r.data_pagamento || '',
    formaPagamento: r.forma_pagamento || '',
    referencia: r.referencia || '',
    observacoes: r.observacoes || '',
    registradoPorEmail: r.registrado_por_email || '',
    idempotencyKey: r.idempotency_key || null,
    estornadoEm: r.estornado_em || null,
    estornadoPorEmail: r.estornado_por_email || '',
    motivoEstorno: r.motivo_estorno || '',
    criadoEm: r.criado_em || ''
  };
}

function mapPayoutItemRow(r) {
  return {
    id: r.id,
    baixaId: r.baixa_id,
    vendaComissaoId: r.venda_comissao_id,
    valorQuitadoCentavos: Number(r.valor_quitado_centavos || 0),
    ativo: r.ativo !== false,
    criadoEm: r.criado_em || ''
  };
}

export async function fetchSalesFromSupabase() {
  const c = core();
  const state = getSalesStateSafe();
  const sb = c?.getSupabase?.();
  if (!sb) {
    state.migrationMissing = false;
    state.lastError = null;
    return;
  }

  try {
    const [
      resBenef,
      resRules,
      resSales,
      resSalePosts,
      resReceipts,
      resComms,
      resClosures,
      resClosureItems,
      resPayouts,
      resPayoutItems
    ] = await Promise.all([
      sb.from('comissao_beneficiarios').select('*').order('nome', { ascending: true }),
      sb.from('comissao_regras').select('*').order('nome', { ascending: true }),
      sb.from('vendas').select('*').order('data_venda', { ascending: false }).order('criado_em', { ascending: false }),
      sb.from('venda_postagens').select('*'),
      sb.from('venda_recebimentos').select('*').order('data_recebimento', { ascending: true }).order('criado_em', { ascending: true }),
      sb.from('venda_comissoes').select('*'),
      sb.from('fechamentos_mensais').select('*').order('competencia', { ascending: false }).order('criado_em', { ascending: false }),
      sb.from('fechamento_itens').select('*'),
      sb.from('comissao_baixas').select('*').order('data_pagamento', { ascending: false }).order('criado_em', { ascending: false }),
      sb.from('comissao_baixa_itens').select('*')
    ]);

    const firstError = [
      resBenef.error,
      resRules.error,
      resSales.error,
      resSalePosts.error,
      resReceipts.error,
      resComms.error,
      resClosures.error,
      resClosureItems.error,
      resPayouts.error,
      resPayoutItems.error
    ].find(Boolean);

    if (firstError) {
      if (isMissingTableError(firstError)) {
        state.migrationMissing = true;
        state.lastError = firstError.message || 'Migration pendente';
        updateMigrationBannerUI();
        return;
      }
      throw firstError;
    }

    state.migrationMissing = false;
    state.lastError = null;
    state.beneficiaries = (resBenef.data || []).map(mapBeneficiaryRow);
    state.rules = (resRules.data || []).map(mapRuleRow);
    state.sales = (resSales.data || []).map(mapSaleRow);
    state.salePosts = (resSalePosts.data || []).map(mapSalePostRow);
    state.receipts = (resReceipts.data || []).map(mapReceiptRow);
    state.commissions = (resComms.data || []).map(mapCommissionRow);
    state.closures = (resClosures.data || []).map(mapClosureRow);
    state.closureItems = (resClosureItems.data || []).map(mapClosureItemRow);
    state.payouts = (resPayouts.data || []).map(mapPayoutRow);
    state.payoutItems = (resPayoutItems.data || []).map(mapPayoutItemRow);
    updateMigrationBannerUI();
  } catch (err) {
    state.lastError = err?.message || 'Erro ao carregar módulo financeiro';
    console.warn('Erro ao buscar vendas no Supabase:', err);
  }
}

function updateMigrationBannerUI() {
  const state = getSalesStateSafe();
  const banner = el('salesMigrationBanner');
  if (banner) {
    banner.classList.toggle('hidden', !state.migrationMissing);
  }
}

function ensureSupabaseReadyForWrite() {
  const c = core();
  const sb = c?.getSupabase?.();
  const state = getSalesStateSafe();
  if (sb && state.migrationMissing) {
    c?.showToast?.('Execute a migration v6_vendas_financeiro.sql no Supabase antes de gravar registros financeiros.');
    return false;
  }
  return true;
}

// ==================== GUARDA ANTI-EXCLUSÃO EM CASCATA ====================
export function checkFinancialDeletionGuard(type, id = '') {
  const state = getSalesStateSafe();
  if (type === 'all') {
    const hasAny =
      state.sales.length > 0 ||
      state.receipts.length > 0 ||
      state.closures.length > 0 ||
      state.payouts.length > 0;
    if (hasAny) {
      return {
        blocked: true,
        message: 'Exclusão em massa bloqueada: existem vendas, recebimentos, fechamentos ou baixas financeiras vinculadas. Preserve ou arquive os registros individualmente.'
      };
    }
    return { blocked: false, message: '' };
  }

  if (type === 'cliente' && hasFinancialRecordsForClient(state, id)) {
    return {
      blocked: true,
      message: 'Não é possível excluir definitivamente este cliente porque ele possui vendas registradas. O histórico financeiro é preservado.'
    };
  }
  if (type === 'contrato' && hasFinancialRecordsForContract(state, id)) {
    return {
      blocked: true,
      message: 'Não é possível excluir definitivamente este contrato porque ele possui vendas vinculadas.'
    };
  }
  if (type === 'postagem' && hasFinancialRecordsForPost(state, id)) {
    return {
      blocked: true,
      message: 'Não é possível excluir definitivamente esta publicação porque ela está vinculada a uma venda.'
    };
  }
  return { blocked: false, message: '' };
}

// ==================== INTEGRAÇÃO COM PERFIL & CONTRATOS ====================
export function getContractSalesBadgeHtml(contractId) {
  const state = getSalesStateSafe();
  const linked = state.sales.filter(s => !s.arquivado && s.contratoId === contractId);
  if (linked.length === 0) return '';
  const totalCents = linked.reduce((sum, s) => sum + Number(s.valorCentavos || 0), 0);
  return `<div class="contract-mini-sub" style="margin-top:4px;"><span class="sales-badge sales-badge-info">${linked.length} venda(s) • ${formatCentsBR(totalCents)}</span></div>`;
}

export function renderClientProfileSalesSection(client) {
  const mount = el('profileSalesSummaryMount');
  if (!mount || !client) return;
  const state = getSalesStateSafe();
  const clientSales = state.sales.filter(s => !s.arquivado && s.clienteId === client.id);

  let sold = 0;
  let received = 0;
  let balance = 0;
  for (const s of clientSales) {
    const rec = computeSaleReceiptSummary(s, state.receipts);
    sold += Number(s.valorCentavos || 0);
    received += rec.totalRecebidoCentavos;
    balance += rec.saldoCentavos;
  }

  mount.innerHTML = `
    <div class="profile-sales-card">
      <div class="profile-sales-card-top">
        <div>
          <span class="profile-sales-kicker">FINANCEIRO DO CLIENTE</span>
          <div class="profile-sales-metrics tabular-nums">
            <span><strong>${clientSales.length}</strong> venda(s)</span>
            <span>Vendido: <strong>${formatCentsBR(sold)}</strong></span>
            <span>Recebido: <strong style="color:var(--green-text);">${formatCentsBR(received)}</strong></span>
            <span>Saldo: <strong>${formatCentsBR(balance)}</strong></span>
          </div>
        </div>
        <div class="profile-sales-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openSalesForClient('${escapeStr(client.id)}')">Ver vendas</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="openSaleModal(null, '${escapeStr(client.id)}')">+ Registrar venda</button>
        </div>
      </div>
    </div>
  `;
}

export function openSalesForClient(clientId) {
  salesFilterState.clienteId = clientId || 'ALL';
  salesFilterState.competencia = 'ALL';
  salesFilterState.contratoId = 'ALL';
  activeSalesSubtab = 'lancamentos';
  core()?.setDashboardMode?.('sales');
}

export function openSaleForContract(clientId, contractId) {
  const state = getSalesStateSafe();
  const existing = state.sales.filter(s => !s.arquivado && s.clienteId === clientId && s.contratoId === contractId);
  if (existing.length === 1) {
    openSaleDetailModal(existing[0].id);
    return;
  }
  if (existing.length > 1) {
    salesFilterState.clienteId = clientId;
    salesFilterState.contratoId = contractId;
    salesFilterState.competencia = 'ALL';
    activeSalesSubtab = 'lancamentos';
    core()?.setDashboardMode?.('sales');
    return;
  }
  openSaleModal(null, clientId, contractId);
}

// ==================== RENDERIZAÇÃO PRINCIPAL (#salesView) ====================
function populateSalesCompetenceFilter() {
  const select = el('salesCompetenceFilter');
  if (!select) return;
  const state = getSalesStateSafe();
  const comps = new Set([getCurrentCompetenceISO()]);
  state.sales.forEach(s => { if (s.competencia) comps.add(s.competencia); });
  state.closures.forEach(cl => { if (cl.competencia) comps.add(cl.competencia); });
  state.receipts.forEach(r => {
    const cmp = competenceFromISODate(r.dataRecebimento);
    if (cmp) comps.add(cmp);
  });
  if (salesFilterState.competencia && salesFilterState.competencia !== 'ALL') {
    comps.add(salesFilterState.competencia);
  }

  const sorted = Array.from(comps).sort().reverse();
  const opts = sorted.map(cmp => `<option value="${escapeStr(cmp)}">${escapeStr(formatCompetenceLabel(cmp))}</option>`).join('');
  select.innerHTML = `${opts}<option value="ALL">Todas as competências</option>`;
  select.value = salesFilterState.competencia || 'ALL';
}

function populateSalesFilterDropdowns() {
  const clients = (getAppDataSafe().clients || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const state = getSalesStateSafe();
  const bens = (state.beneficiaries || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  const clientOpts = `<option value="ALL">Todos os clientes</option>` +
    clients.map(c => `<option value="${escapeStr(c.id)}">${escapeStr(c.name || 'Sem nome')}</option>`).join('');
  ['salesClientFilter', 'salesSheetClientFilter'].forEach(id => {
    const s = el(id);
    if (s) {
      s.innerHTML = clientOpts;
      s.value = salesFilterState.clienteId || 'ALL';
    }
  });

  const contractSel = el('salesContractFilter');
  if (contractSel) {
    const scopeClients = salesFilterState.clienteId !== 'ALL'
      ? clients.filter(c => c.id === salesFilterState.clienteId)
      : clients;
    const cntOpts = [];
    for (const c of scopeClients) {
      for (const cnt of c.contracts || []) {
        const prefix = salesFilterState.clienteId === 'ALL' ? `${c.name}: ` : '';
        cntOpts.push(`<option value="${escapeStr(cnt.id)}">${escapeStr(prefix + (cnt.agreementTitle || cnt.period || 'Acordo'))}</option>`);
      }
    }
    contractSel.innerHTML = `<option value="ALL">Todos os contratos</option>${cntOpts.join('')}`;
    contractSel.value = Array.from(contractSel.options).some(o => o.value === salesFilterState.contratoId)
      ? salesFilterState.contratoId
      : 'ALL';
    salesFilterState.contratoId = contractSel.value;
  }

  const benOpts = `<option value="ALL">Beneficiário: Todos</option>` +
    bens.map(b => `<option value="${escapeStr(b.id)}">${escapeStr(b.nome)}${b.ativo ? '' : ' (Inativo)'}</option>`).join('');
  ['salesBeneficiaryFilter', 'salesSheetBeneficiaryFilter'].forEach(id => {
    const s = el(id);
    if (s) {
      s.innerHTML = benOpts;
      s.value = salesFilterState.beneficiarioId || 'ALL';
    }
  });

  const syncPairs = [
    ['salesAgreementTypeFilter', 'salesSheetAgreementTypeFilter', 'agreementType'],
    ['salesConferenceFilter', 'salesSheetConferenceFilter', 'conferenciaStatus'],
    ['salesReceiptFilter', 'salesSheetReceiptFilter', 'recebimentoStatus'],
    ['salesCommissionStatusFilter', 'salesSheetCommissionStatusFilter', 'comissaoStatus'],
    ['salesModalityFilter', 'salesSheetModalityFilter', 'modalidadeMaterial']
  ];
  syncPairs.forEach(([deskId, sheetId, key]) => {
    if (el(deskId)) el(deskId).value = salesFilterState[key];
    if (el(sheetId)) el(sheetId).value = salesFilterState[key];
  });

  if (el('salesDateModeFilter')) el('salesDateModeFilter').value = salesFilterState.dateMode;
  if (el('salesSearchInput') && el('salesSearchInput').value !== salesFilterState.query) {
    el('salesSearchInput').value = salesFilterState.query;
  }

  let extraCount = 0;
  if (salesFilterState.clienteId !== 'ALL') extraCount++;
  if (salesFilterState.contratoId !== 'ALL') extraCount++;
  if (salesFilterState.agreementType !== 'ALL') extraCount++;
  if (salesFilterState.conferenciaStatus !== 'ALL') extraCount++;
  if (salesFilterState.recebimentoStatus !== 'ALL') extraCount++;
  if (salesFilterState.beneficiarioId !== 'ALL') extraCount++;
  if (salesFilterState.comissaoStatus !== 'ALL') extraCount++;
  if (salesFilterState.modalidadeMaterial !== 'ALL') extraCount++;
  if (salesFilterState.query.trim()) extraCount++;

  const badge = el('salesActiveFiltersBadge');
  if (badge) {
    badge.textContent = String(extraCount);
    badge.classList.toggle('hidden', extraCount === 0);
  }
  el('btnClearSalesFilters')?.classList.toggle('hidden', extraCount === 0 && salesFilterState.dateMode === 'competencia');
  el('salesDateModeNotice')?.classList.toggle('hidden', salesFilterState.dateMode !== 'recebimento');
}

function renderSalesKPIs(filteredSales) {
  const grid = el('salesKpisGrid');
  if (!grid) return;
  const state = getSalesStateSafe();
  const k = computeSalesKPIs(filteredSales, state);

  const items = [
    { label: 'Qtd. de vendas', value: String(k.qtdVendas), sub: 'Lançamentos filtrados', tone: '' },
    { label: 'Total vendido', value: formatCentsBR(k.totalVendidoCentavos), sub: 'Contabilizado 1x por venda', tone: '' },
    { label: 'Total recebido', value: formatCentsBR(k.totalRecebidoCentavos), sub: 'Baixado dos clientes', tone: 'kpi-green' },
    { label: 'Saldo a receber', value: formatCentsBR(k.saldoReceberCentavos), sub: 'Em aberto de clientes', tone: k.saldoReceberCentavos > 0 ? 'kpi-amber' : '' },
    { label: 'Aguardando conferência', value: String(k.aguardandoConferenciaCount), sub: 'Vendas pendentes', tone: k.aguardandoConferenciaCount > 0 ? 'kpi-amber' : '' },
    { label: 'Com divergência', value: String(k.comDivergenciaCount), sub: 'Conferência ou excedente', tone: k.comDivergenciaCount > 0 ? 'kpi-red' : '' },
    { label: 'Comissões apuradas', value: formatCentsBR(k.comissoesApuradasCentavos), sub: `Pendentes: ${formatCentsBR(k.comissoesPendentesCentavos)} • A definir: ${k.comissoesADefinirCount}`, tone: 'kpi-purple' },
    { label: 'Comissões pagas', value: formatCentsBR(k.comissoesPagasCentavos), sub: 'Baixas confirmadas', tone: 'kpi-green' }
  ];

  grid.innerHTML = items.map(it => `
    <div class="sales-kpi-card ${it.tone}">
      <div class="sales-kpi-label">${escapeStr(it.label)}</div>
      <div class="sales-kpi-value tabular-nums">${escapeStr(it.value)}</div>
      <div class="sales-kpi-sub">${escapeStr(it.sub)}</div>
    </div>
  `).join('');
}

function renderSalesAlertsBanner(filteredSales) {
  const banner = el('salesAlertsBanner');
  if (!banner) return;
  const state = getSalesStateSafe();
  const comp = salesFilterState.competencia;
  const alerts = [];

  if (comp !== 'ALL') {
    const closed = state.closures.find(cl => cl.competencia === comp && cl.status === 'fechado');
    if (closed) {
      alerts.push(`Competência <strong>${escapeStr(formatCompetenceLabel(comp))}</strong> fechada em ${escapeStr(formatDateTimeBR(closed.confirmadoEm))} por ${escapeStr(closed.confirmadoPorEmail || 'usuário')}. Alterações exigem reabertura controlada.`);
    }
  }

  const k = computeSalesKPIs(filteredSales, state);
  if (k.comDivergenciaCount > 0) {
    alerts.push(`<strong>${k.comDivergenciaCount} venda(s)</strong> com divergência sinalizada.`);
  }
  if (k.comissoesADefinirCount > 0) {
    alerts.push(`<strong>${k.comissoesADefinirCount} venda(s)</strong> com comissão "A definir".`);
  }

  if (alerts.length === 0) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }
  banner.classList.remove('hidden');
  banner.innerHTML = alerts.map(a => `<div class="sales-alert-line">${a}</div>`).join('');
}

function updateSalesBulkBarUI() {
  const bar = el('salesBulkBar');
  if (!bar) return;
  const state = getSalesStateSafe();
  const ids = Array.from(selectedCommissionIds).filter(cid => {
    const c = state.commissions.find(x => x.id === cid);
    return c && c.status === 'apurada';
  });
  selectedCommissionIds = new Set(ids);

  if (ids.length === 0) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');
  const check = validatePayoutSelection(ids, state);
  const totalCents = ids.reduce((s, cid) => {
    const com = state.commissions.find(x => x.id === cid);
    return s + Math.max(0, Number(com?.valorApuradoCentavos || 0));
  }, 0);

  el('salesBulkCountLabel').textContent = `${ids.length} comissão(ões) selecionada(s)`;
  el('salesBulkTotalLabel').textContent = `Total: ${formatCentsBR(totalCents)}`;
  const warnEl = el('salesBulkWarningLabel');
  const btn = el('btnSalesBulkPayout');
  if (!check.ok) {
    if (warnEl) warnEl.textContent = check.error;
    if (btn) btn.disabled = true;
  } else {
    const ben = state.beneficiaries.find(b => b.id === check.beneficiaryId);
    if (warnEl) warnEl.textContent = ben ? `Beneficiário: ${ben.nome}` : '';
    if (btn) btn.disabled = false;
  }
}

function renderSalesLancamentosList(filteredSales) {
  const container = el('salesListContainer');
  if (!container) return;
  const state = getSalesStateSafe();
  const clients = getAppDataSafe().clients || [];
  const benefMap = new Map(state.beneficiaries.map(b => [b.id, b]));
  const c = core();

  if (filteredSales.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <h3>Nenhuma venda encontrada neste recorte</h3>
        <p>Cadastre manualmente uma venda vinculada a um cliente e acordo existente ou ajuste os filtros.</p>
        <button type="button" class="btn btn-primary" onclick="openSaleModal()">+ Nova venda</button>
      </div>
    `;
    updateSalesBulkBarUI();
    return;
  }

  const rowsData = filteredSales.map(sale => {
    const { client, contract } = findClientAndContract(sale.clienteId, sale.contratoId);
    const receipt = computeSaleReceiptSummary(sale, state.receipts);
    const rawCom = getSaleCommission(sale.id, state.commissions);
    const com = rawCom ? calculateCommissionForSale(rawCom, sale, receipt) : null;
    const comStatus = com?.status || 'a_definir';
    const benef = com?.beneficiarioId ? benefMap.get(com.beneficiarioId) : null;
    const linkedPostsCount = state.salePosts.filter(sp => sp.vendaId === sale.id).length;
    const locked = isSaleLockedByClosure(sale);
    const agType = contract ? (c?.getAgreementTypeBadgeText?.(contract) || contract.agreementType || 'Acordo') : 'Acordo';
    const contractLabel = contract ? (contract.agreementTitle || contract.period || 'Acordo') : 'Acordo';
    const canSelectForPayout = Boolean(com?.id && comStatus === 'apurada' && com?.beneficiarioId);
    const isChecked = canSelectForPayout && selectedCommissionIds.has(com.id);

    return {
      sale, client, contract, receipt, com, comStatus, benef,
      linkedPostsCount, locked, agType, contractLabel, canSelectForPayout, isChecked
    };
  });

  const desktopRows = rowsData.map(r => {
    const comValText = (r.comStatus === 'apurada' || r.comStatus === 'paga')
      ? formatCentsBR(r.com?.valorApuradoCentavos || 0)
      : (r.comStatus === 'nao_se_aplica' ? 'R$ 0,00 (N/A)' : 'A definir');

    return `
      <tr>
        <td style="width:36px;">
          <input type="checkbox" ${r.canSelectForPayout ? '' : 'disabled'} ${r.isChecked ? 'checked' : ''} aria-label="Selecionar comissão de ${escapeStr(r.sale.titulo)}" onchange="toggleSaleBulkSelection('${escapeStr(r.com?.id || '')}', this.checked)">
        </td>
        <td>
          <div style="font-weight:700;">
            <button type="button" class="sales-link-btn" onclick="openSaleDetailModal('${escapeStr(r.sale.id)}')">${escapeStr(r.sale.titulo)}</button>
            ${r.locked ? '<span class="sales-badge sales-badge-neutral" title="Competência fechada">Fechada</span>' : ''}
          </div>
          <div class="sales-table-sub">
            <button type="button" class="sales-link-subtle" onclick="openClientFromSales('${escapeStr(r.sale.clienteId)}')">${escapeStr(r.client?.name || 'Cliente')}</button>
            • <span class="sales-badge sales-badge-neutral">${escapeStr(r.agType)}</span> ${escapeStr(r.contractLabel)}
            ${r.linkedPostsCount > 0 ? ` • ${r.linkedPostsCount} postagem(ns)` : ''}
          </div>
        </td>
        <td class="tabular-nums">
          <div><strong>${escapeStr(formatCompetenceLabel(r.sale.competencia))}</strong></div>
          <div class="sales-table-sub">Venda: ${escapeStr(formatDateOnlyBR(r.sale.dataVenda))}</div>
        </td>
        <td class="tabular-nums">
          <div><strong>${escapeStr(formatCentsBR(r.sale.valorCentavos))}</strong></div>
          <div class="sales-table-sub">Rec: ${escapeStr(formatCentsBR(r.receipt.totalRecebidoCentavos))} • Saldo: ${escapeStr(formatCentsBR(r.receipt.saldoCentavos))}</div>
        </td>
        <td>
          <div class="sales-badges-stack">
            <span class="sales-badge ${getBadgeClassForConference(r.sale.conferenciaStatus || 'pendente')}">${escapeStr(CONFERENCE_LABELS[r.sale.conferenciaStatus || 'pendente'])}</span>
            <span class="sales-badge ${getBadgeClassForReceipt(r.receipt.statusRecebimento)}">${escapeStr(RECEIPT_LABELS[r.receipt.statusRecebimento])}</span>
            ${r.receipt.hasDivergenciaExcedente ? '<span class="sales-badge sales-badge-danger">Excedente</span>' : ''}
          </div>
        </td>
        <td>
          <div><span class="sales-badge ${getBadgeClassForCommission(r.comStatus)}">${escapeStr(COMMISSION_LABELS[r.comStatus] || r.comStatus)}</span></div>
          <div class="sales-table-sub tabular-nums">${escapeStr(r.benef?.nome || (r.comStatus === 'nao_se_aplica' ? 'Sem comissão' : 'Beneficiário a definir'))} • ${escapeStr(comValText)}</div>
        </td>
        <td style="white-space:nowrap; text-align:right;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openSaleDetailModal('${escapeStr(r.sale.id)}')">Conferir / Pagar</button>
          ${!r.locked ? `<button type="button" class="btn btn-ghost btn-sm" onclick="openSaleModal('${escapeStr(r.sale.id)}')">Editar</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  const mobileCards = rowsData.map(r => {
    const comValText = (r.comStatus === 'apurada' || r.comStatus === 'paga')
      ? formatCentsBR(r.com?.valorApuradoCentavos || 0)
      : (r.comStatus === 'nao_se_aplica' ? 'Não se aplica' : 'A definir');

    return `
      <div class="sales-mobile-card">
        <div class="sales-mobile-card-head">
          <div style="display:flex; align-items:flex-start; gap:8px; min-width:0;">
            ${r.canSelectForPayout ? `<input type="checkbox" style="margin-top:4px;" ${r.isChecked ? 'checked' : ''} onchange="toggleSaleBulkSelection('${escapeStr(r.com.id)}', this.checked)" aria-label="Selecionar para baixa">` : ''}
            <div style="min-width:0;">
              <button type="button" class="sales-link-btn" onclick="openSaleDetailModal('${escapeStr(r.sale.id)}')">${escapeStr(r.sale.titulo)}</button>
              <div class="sales-table-sub">${escapeStr(r.client?.name || 'Cliente')} • ${escapeStr(r.agType)} (${escapeStr(r.contractLabel)})</div>
            </div>
          </div>
          <span class="sales-badge sales-badge-neutral">${escapeStr(formatCompetenceLabel(r.sale.competencia))}</span>
        </div>

        <div class="sales-mobile-amounts tabular-nums">
          <div><span>Venda</span><strong>${escapeStr(formatCentsBR(r.sale.valorCentavos))}</strong></div>
          <div><span>Recebido</span><strong style="color:var(--green-text);">${escapeStr(formatCentsBR(r.receipt.totalRecebidoCentavos))}</strong></div>
          <div><span>Saldo</span><strong>${escapeStr(formatCentsBR(r.receipt.saldoCentavos))}</strong></div>
        </div>

        <div class="sales-badges-stack">
          <span class="sales-badge ${getBadgeClassForConference(r.sale.conferenciaStatus || 'pendente')}">Conf: ${escapeStr(CONFERENCE_LABELS[r.sale.conferenciaStatus || 'pendente'])}</span>
          <span class="sales-badge ${getBadgeClassForReceipt(r.receipt.statusRecebimento)}">Rec: ${escapeStr(RECEIPT_LABELS[r.receipt.statusRecebimento])}</span>
          <span class="sales-badge ${getBadgeClassForCommission(r.comStatus)}">Com: ${escapeStr(comValText)}</span>
          ${r.receipt.hasDivergenciaExcedente ? '<span class="sales-badge sales-badge-danger">Recebido &gt; Venda</span>' : ''}
          ${r.locked ? '<span class="sales-badge sales-badge-neutral">Fechada</span>' : ''}
        </div>

        <div class="sales-mobile-card-foot">
          <span class="sales-table-sub">Beneficiário: ${escapeStr(r.benef?.nome || 'A definir')}</span>
          <div style="display:flex; gap:6px;">
            ${!r.locked ? `<button type="button" class="btn btn-ghost btn-sm" onclick="openSaleModal('${escapeStr(r.sale.id)}')">Editar</button>` : ''}
            <button type="button" class="btn btn-primary btn-sm" onclick="openSaleDetailModal('${escapeStr(r.sale.id)}')">Abrir</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sales-table-wrap">
      <table class="sales-table">
        <thead>
          <tr>
            <th></th>
            <th>Venda / Cliente / Acordo</th>
            <th>Competência</th>
            <th>Valores</th>
            <th>Conferência & Recebimento</th>
            <th>Comissão</th>
            <th style="text-align:right;">Ações</th>
          </tr>
        </thead>
        <tbody>${desktopRows}</tbody>
      </table>
    </div>
    <div class="sales-mobile-cards">${mobileCards}</div>
  `;

  updateSalesBulkBarUI();
}

function renderSalesComissoesTab(filteredSales) {
  const container = el('salesCommissionsContainer');
  if (!container) return;
  const state = getSalesStateSafe();
  const benefMap = new Map(state.beneficiaries.map(b => [b.id, b]));
  const grouped = new Map();

  for (const sale of filteredSales) {
    const rec = computeSaleReceiptSummary(sale, state.receipts);
    const rawCom = getSaleCommission(sale.id, state.commissions);
    const com = rawCom ? calculateCommissionForSale(rawCom, sale, rec) : null;
    if (!com || com.status === 'nao_se_aplica' || com.status === 'a_definir' || !com.beneficiarioId) continue;

    if (!grouped.has(com.beneficiarioId)) {
      const ben = benefMap.get(com.beneficiarioId);
      grouped.set(com.beneficiarioId, {
        beneficiarioId: com.beneficiarioId,
        nome: ben?.nome || 'Beneficiário',
        papel: ben?.papel || '',
        apuradaIds: [],
        apuradaCentavos: 0,
        pagaCentavos: 0
      });
    }
    const g = grouped.get(com.beneficiarioId);
    const val = Math.max(0, Number(com.valorApuradoCentavos || 0));
    if (com.status === 'apurada') {
      g.apuradaIds.push(com.id);
      g.apuradaCentavos += val;
    } else if (com.status === 'paga') {
      g.pagaCentavos += val;
    }
  }

  const benefCards = Array.from(grouped.values()).map(g => `
    <div class="sales-subcard">
      <div class="sales-subcard-row">
        <div>
          <strong>${escapeStr(g.nome)}</strong>
          ${g.papel ? `<span class="sales-table-sub"> • ${escapeStr(g.papel)}</span>` : ''}
          <div class="sales-table-sub tabular-nums">
            Pendentes para baixa (${g.apuradaIds.length}): <strong>${escapeStr(formatCentsBR(g.apuradaCentavos))}</strong>
            • Já pagas: <strong style="color:var(--green-text);">${escapeStr(formatCentsBR(g.pagaCentavos))}</strong>
          </div>
        </div>
        <div>
          ${g.apuradaIds.length > 0
            ? `<button type="button" class="btn btn-yellow-brand btn-sm" onclick="openSalesPayoutForList('${escapeStr(g.apuradaIds.join(','))}')">Dar baixa em lote (${escapeStr(formatCentsBR(g.apuradaCentavos))})</button>`
            : '<span class="sales-badge sales-badge-success">Tudo quitado no recorte</span>'}
        </div>
      </div>
    </div>
  `).join('');

  const payoutRows = (state.payouts || []).map(p => {
    const ben = benefMap.get(p.beneficiarioId);
    const itemCount = state.payoutItems.filter(pi => pi.baixaId === p.id).length;
    return `
      <div class="sales-subcard ${p.estornadoEm ? 'sales-subcard-muted' : ''}">
        <div class="sales-subcard-row">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong>${escapeStr(ben?.nome || 'Beneficiário')}</strong>
              <span class="tabular-nums"><strong>${escapeStr(formatCentsBR(p.valorTotalCentavos))}</strong></span>
              ${p.estornadoEm
                ? '<span class="sales-badge sales-badge-danger">Estornada</span>'
                : '<span class="sales-badge sales-badge-success">Paga</span>'}
            </div>
            <div class="sales-table-sub">
              Data efetiva: ${escapeStr(formatDateOnlyBR(p.dataPagamento))} • ${itemCount} item(ns)
              ${p.formaPagamento ? ` • ${escapeStr(p.formaPagamento)}` : ''}
              ${p.referencia ? ` • Ref: ${escapeStr(p.referencia)}` : ''}
            </div>
            ${p.estornadoEm ? `<div class="sales-table-sub" style="color:var(--red-text);">Estorno em ${escapeStr(formatDateTimeBR(p.estornadoEm))} (${escapeStr(p.estornadoPorEmail || 'usuário')}): ${escapeStr(p.motivoEstorno)}</div>` : ''}
          </div>
          ${!p.estornadoEm ? `<button type="button" class="btn btn-danger btn-sm" onclick="promptReverseSalesPayout('${escapeStr(p.id)}')">Estornar baixa</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sales-section-block">
      <div class="sales-section-header">
        <h4>Resumo de comissões por beneficiário (recorte atual)</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openSalesConfigModal()">Beneficiários e regras</button>
      </div>
      ${benefCards || '<div class="empty-state-card"><p>Nenhuma comissão configurada para as vendas filtradas. Abra uma venda para definir beneficiário e regra.</p></div>'}
    </div>
    <div class="sales-section-block" style="margin-top:16px;">
      <div class="sales-section-header">
        <h4>Histórico de baixas de comissões</h4>
      </div>
      ${payoutRows || '<div class="empty-state-card"><p>Nenhuma baixa de comissão registrada ainda.</p></div>'}
    </div>
  `;
}

function renderSalesFechamentosTab() {
  const container = el('salesClosuresContainer');
  if (!container) return;
  const state = getSalesStateSafe();

  const cards = (state.closures || []).map(cl => {
    const isClosed = cl.status === 'fechado';
    const items = state.closureItems.filter(i => i.fechamentoId === cl.id);
    return `
      <div class="sales-subcard">
        <div class="sales-subcard-row">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong>${escapeStr(formatCompetenceLabel(cl.competencia))}</strong>
              <span class="sales-badge ${isClosed ? 'sales-badge-info' : 'sales-badge-warning'}">${isClosed ? 'Fechado' : 'Reaberto'}</span>
              <span class="sales-table-sub">${cl.qtdVendas} venda(s) • ${items.length} item(ns) no snapshot</span>
            </div>
            <div class="sales-table-sub tabular-nums" style="margin-top:4px;">
              Vendido: <strong>${escapeStr(formatCentsBR(cl.totalVendidoCentavos))}</strong> • Recebido: <strong>${escapeStr(formatCentsBR(cl.totalRecebidoCentavos))}</strong> • Saldo: <strong>${escapeStr(formatCentsBR(cl.saldoReceberCentavos))}</strong> • Comissões: <strong>${escapeStr(formatCentsBR(cl.totalComissaoCentavos))}</strong>
            </div>
            <div class="sales-table-sub">
              Confirmado em ${escapeStr(formatDateTimeBR(cl.confirmadoEm))} por ${escapeStr(cl.confirmadoPorEmail || 'usuário')}
              ${cl.reabertoEm ? ` | Reaberto em ${escapeStr(formatDateTimeBR(cl.reabertoEm))} (${escapeStr(cl.motivoReabertura)})` : ''}
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openSalesReportModal('fechamento', '${escapeStr(cl.id)}')">Relatório</button>
            ${isClosed ? `<button type="button" class="btn btn-danger btn-sm" onclick="promptReopenSalesClosure('${escapeStr(cl.id)}')">Reabrir</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sales-section-block">
      <div class="sales-section-header">
        <h4>Fechamentos mensais registrados</h4>
        <button type="button" class="btn btn-primary btn-sm" onclick="openSalesClosureModal()">+ Fechar mês</button>
      </div>
      ${cards || '<div class="empty-state-card"><p>Nenhum fechamento mensal confirmado ainda. Use "Fechar mês" após conferir as vendas da competência.</p></div>'}
    </div>
  `;
}

export function renderSalesView() {
  const c = core();
  const state = getSalesStateSafe();
  const clients = getAppDataSafe().clients || [];

  updateMigrationBannerUI();
  populateSalesCompetenceFilter();
  populateSalesFilterDropdowns();

  const filtered = filterSales(state, clients, salesFilterState);
  renderSalesKPIs(filtered);
  renderSalesAlertsBanner(filtered);

  el('salesTabLancamentos')?.classList.toggle('hidden', activeSalesSubtab !== 'lancamentos');
  el('salesTabComissoes')?.classList.toggle('hidden', activeSalesSubtab !== 'comissoes');
  el('salesTabFechamentos')?.classList.toggle('hidden', activeSalesSubtab !== 'fechamentos');

  document.querySelectorAll('[data-sales-subtab]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-sales-subtab') === activeSalesSubtab);
  });

  if (activeSalesSubtab === 'lancamentos') {
    renderSalesLancamentosList(filtered);
  } else if (activeSalesSubtab === 'comissoes') {
    renderSalesComissoesTab(filtered);
  } else {
    renderSalesFechamentosTab();
  }

  if (c?.getCurrentClientId?.() && !el('profileView')?.classList.contains('hidden')) {
    const activeClient = clients.find(cl => cl.id === c.getCurrentClientId());
    if (activeClient) renderClientProfileSalesSection(activeClient);
  }
}

// ==================== FORMULÁRIO MANUAL DE VENDA (#saleModal) ====================
function setSaleOptionalExpanded(expanded) {
  const body = el('saleOptionalBody');
  const btn = el('btnToggleSaleOptionalSection');
  const chev = el('saleOptionalChevron');
  if (!body) return;
  body.classList.toggle('hidden', !expanded);
  body.style.display = expanded ? 'flex' : 'none';
  btn?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (chev) chev.textContent = expanded ? '▴' : '▾';
}

function populateSaleModalClients(searchText = '', selectedClientId = '') {
  const select = el('saleClientSelect');
  if (!select) return;
  const q = String(searchText || '').trim().toLowerCase();
  const clients = (getAppDataSafe().clients || [])
    .filter(c => !q || `${c.name || ''} ${c.company || ''} ${c.instagram || ''}`.toLowerCase().includes(q))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (clients.length === 0) {
    select.innerHTML = '<option value="">Nenhum cliente encontrado</option>';
    select.value = '';
    return;
  }

  select.innerHTML = `<option value="">Selecione um cliente...</option>` +
    clients.map(c => {
      const extra = [c.company, c.instagram].filter(Boolean).join(' • ');
      return `<option value="${escapeStr(c.id)}">${escapeStr(c.name || 'Sem nome')}${extra ? ` (${escapeStr(extra)})` : ''}</option>`;
    }).join('');

  if (selectedClientId && clients.some(c => c.id === selectedClientId)) {
    select.value = selectedClientId;
  }
}

function populateSaleModalContracts(clientId, selectedContractId = '') {
  const select = el('saleContractSelect');
  const metaBox = el('saleContractMetaBox');
  const partnerWarn = el('salePartnershipWarning');
  const btnUseVal = el('btnUseContractValue');
  const valHint = el('saleContractValueHint');
  const pkgBox = el('saleContractPackageSummary');
  if (!select) return;

  const client = (getAppDataSafe().clients || []).find(c => c.id === clientId);
  const contracts = client?.contracts || [];

  if (!client || contracts.length === 0) {
    select.innerHTML = '<option value="">Nenhum acordo cadastrado para este cliente</option>';
    select.value = '';
    metaBox?.classList.add('hidden');
    partnerWarn?.classList.add('hidden');
    btnUseVal?.classList.add('hidden');
    if (valHint) valHint.textContent = client ? 'Cadastre um acordo para vincular a venda.' : '';
    if (pkgBox) pkgBox.textContent = 'Selecione um acordo para ver os itens contratados.';
    populateSaleModalPosts(clientId, '', []);
    return;
  }

  select.innerHTML = `<option value="">Selecione o acordo/contrato...</option>` +
    contracts.map(cnt => {
      const agType = core()?.getAgreementTypeBadgeText?.(cnt) || cnt.agreementType || 'Acordo';
      const title = cnt.agreementTitle || cnt.period || 'Acordo';
      const valNum = Number(cnt.value);
      const valStr = Number.isFinite(valNum) && cnt.value !== '' && cnt.value !== null ? ` • R$ ${centsToInputStr(Math.round(valNum * 100))}` : '';
      return `<option value="${escapeStr(cnt.id)}">[${escapeStr(agType)}] ${escapeStr(title)}${cnt.status ? ` (${escapeStr(cnt.status)})` : ''}${escapeStr(valStr)}</option>`;
    }).join('');

  if (selectedContractId && contracts.some(cnt => cnt.id === selectedContractId)) {
    select.value = selectedContractId;
  } else if (contracts.length === 1) {
    select.value = contracts[0].id;
  }
  syncSelectedContractMetadataInSaleForm();
}

function syncSelectedContractMetadataInSaleForm() {
  const clientId = el('saleClientSelect')?.value || '';
  const contractId = el('saleContractSelect')?.value || '';
  const { client, contract } = findClientAndContract(clientId, contractId);
  const metaBox = el('saleContractMetaBox');
  const partnerWarn = el('salePartnershipWarning');
  const btnUseVal = el('btnUseContractValue');
  const valHint = el('saleContractValueHint');
  const pkgBox = el('saleContractPackageSummary');

  if (!contract) {
    metaBox?.classList.add('hidden');
    partnerWarn?.classList.add('hidden');
    btnUseVal?.classList.add('hidden');
    if (valHint) valHint.textContent = '';
    if (pkgBox) pkgBox.textContent = 'Selecione um acordo para ver os itens contratados.';
    populateSaleModalPosts(clientId, '', getSelectedLinkedPostIdsFromForm());
    checkDuplicateSaleWarningInForm();
    return;
  }

  const agType = core()?.getAgreementTypeBadgeText?.(contract) || contract.agreementType || 'Mensal';
  const rawVal = contract.value !== '' && contract.value !== null && contract.value !== undefined ? Number(contract.value) : null;
  const contractCents = rawVal !== null && Number.isFinite(rawVal) ? Math.round(rawVal * 100) : null;

  if (metaBox) {
    metaBox.classList.remove('hidden');
    metaBox.innerHTML = `
      <strong>${escapeStr(agType)}</strong> • ${escapeStr(contract.agreementTitle || contract.period || '')}
      ${contract.period && contract.agreementTitle && contract.period !== contract.agreementTitle ? ` (${escapeStr(contract.period)})` : ''}
      • Status: <strong>${escapeStr(contract.status || 'Ativo')}</strong>
    `;
  }

  partnerWarn?.classList.toggle('hidden', agType !== 'Parceria');

  if (contractCents !== null && contractCents > 0) {
    btnUseVal?.classList.remove('hidden');
    if (btnUseVal) btnUseVal.dataset.contractCents = String(contractCents);
    if (valHint) valHint.textContent = `Valor de referência no contrato: ${formatCentsBR(contractCents)} (editar aqui não altera o contrato).`;
  } else {
    btnUseVal?.classList.add('hidden');
    if (valHint) valHint.textContent = agType === 'Parceria' ? 'Parceria sem valor monetário pré-definido.' : 'Contrato sem valor definido.';
  }

  if (pkgBox) {
    const qtyText = contract.hasDefinedQuantity === false ? 'Quantidade livre' : `${Number(contract.totalPosts || 0)} publicação(ões) combinada(s)`;
    const formatsText = contract.types ? ` • Formatos: ${contract.types}` : '';
    const extraText = contract.partnershipNotes ? ` • Combinado: ${contract.partnershipNotes}` : '';
    pkgBox.textContent = `${qtyText}${formatsText}${extraText}`;
  }

  populateSaleModalPosts(client?.id || '', contract.id, getSelectedLinkedPostIdsFromForm());
  checkDuplicateSaleWarningInForm();
}

function getSelectedLinkedPostIdsFromForm() {
  const list = el('saleLinkedPostsList');
  if (!list) return [];
  return Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

function populateSaleModalPosts(clientId, contractId, checkedPostIds = []) {
  const container = el('saleLinkedPostsList');
  if (!container) return;
  const client = (getAppDataSafe().clients || []).find(c => c.id === clientId);
  const posts = (client?.posts || []).filter(p => !contractId || !p.contractId || p.contractId === contractId);

  if (posts.length === 0) {
    container.innerHTML = '<div class="sales-table-sub">Nenhuma publicação registrada neste acordo até o momento.</div>';
    return;
  }

  const checkedSet = new Set(checkedPostIds);
  container.innerHTML = posts.map(p => `
    <label class="sales-post-check-item">
      <input type="checkbox" value="${escapeStr(p.id)}" ${checkedSet.has(p.id) ? 'checked' : ''}>
      <span>
        <strong>${escapeStr(p.title || p.type || 'Publicação')}</strong>
        <span class="sales-table-sub">(${escapeStr(p.type || 'Post')} • ${escapeStr(p.status || 'Pendente')}${p.date ? ` • ${escapeStr(formatDateOnlyBR(p.date))}` : ''})</span>
      </span>
    </label>
  `).join('');
}

function checkDuplicateSaleWarningInForm() {
  const box = el('saleDuplicateWarning');
  if (!box) return;
  const saleId = el('saleId')?.value || null;
  const clienteId = el('saleClientSelect')?.value || '';
  const contratoId = el('saleContractSelect')?.value || '';
  const competencia = el('saleCompetenceInput')?.value || '';
  const valorCentavos = parseMoneyToCents(el('saleValueInput')?.value);

  if (!clienteId || !contratoId || !competencia) {
    box.classList.add('hidden');
    box.textContent = '';
    return;
  }

  const matches = findPotentialDuplicateSales(getSalesStateSafe().sales, {
    clienteId,
    contratoId,
    competencia,
    valorCentavos,
    excludeSaleId: saleId
  });

  if (matches.length === 0) {
    box.classList.add('hidden');
    box.textContent = '';
    return;
  }

  box.classList.remove('hidden');
  box.innerHTML = `Atenção: já existe(m) <strong>${matches.length}</strong> venda(s) neste acordo e competência (${escapeStr(matches.map(m => `${m.titulo}: ${formatCentsBR(m.valorCentavos)}`).join('; '))}). Confirme que não é lançamento duplicado antes de salvar.`;
}

function populateSaleModalBeneficiaries(selectedBeneficiaryId = '', locked = false) {
  const input = el('saleBeneficiarySelect');
  const group = el('saleBeneficiaryButtons');
  const btnNew = el('btnSaleCreateNewBeneficiary');
  const hint = el('saleBeneficiaryHint');
  if (!input) return;

  const bens = (getSalesStateSafe().beneficiaries || [])
    .filter(b => b.ativo || b.id === selectedBeneficiaryId)
    .slice()
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  const resolvedVal = selectedBeneficiaryId && bens.some(b => b.id === selectedBeneficiaryId) ? selectedBeneficiaryId : '';
  input.value = resolvedVal;
  input.disabled = Boolean(locked);

  if (group) {
    const disabledAttr = locked ? 'disabled' : '';
    const options = [{ id: '', nome: 'A definir', papel: '', ativo: true }, ...bens];
    group.innerHTML = options.map(opt => {
      const isSelected = opt.id === resolvedVal;
      const label = opt.id
        ? `${opt.nome}${opt.papel ? ` (${opt.papel})` : ''}${opt.ativo ? '' : ' (Inativo)'}`
        : opt.nome;
      return `<button type="button" class="sales-choice-btn${isSelected ? ' active' : ''}" data-beneficiary-id="${escapeStr(opt.id)}" aria-pressed="${isSelected ? 'true' : 'false'}" ${disabledAttr}>${escapeStr(label)}</button>`;
    }).join('');
  }

  if (btnNew) btnNew.disabled = Boolean(locked);
  if (hint) {
    hint.textContent = locked
      ? 'Comissão já fechada ou paga — beneficiário bloqueado para preservação histórica.'
      : 'Opcional — não calcula comissão automaticamente sem regra confirmada.';
  }
}

function captureSaleModalDraft(actionType) {
  pendingSaleDraft = {
    active: true,
    actionType,
    saleId: el('saleId')?.value || '',
    clienteId: el('saleClientSelect')?.value || '',
    clientSearch: el('saleClientSearchInput')?.value || '',
    contratoId: el('saleContractSelect')?.value || '',
    titulo: el('saleTitleInput')?.value || '',
    dataVenda: el('saleDateInput')?.value || getTodayISODate(),
    competencia: el('saleCompetenceInput')?.value || '',
    competenceTouchedManually,
    valorInput: el('saleValueInput')?.value || '',
    beneficiarioId: el('saleBeneficiarySelect')?.value || '',
    beneficiaryLocked: Boolean(el('saleBeneficiarySelect')?.disabled),
    modalidadeMaterial: el('saleModalitySelect')?.value || 'nao_informado',
    detalhePacoteComplementar: el('salePackageNoteInput')?.value || '',
    linkedPostIds: getSelectedLinkedPostIdsFromForm(),
    observacoesInternas: el('saleInternalNotesInput')?.value || '',
    optionalExpanded: el('btnToggleSaleOptionalSection')?.getAttribute('aria-expanded') === 'true'
  };
}

export function handleExternalEntityCreated(entityType, savedId = '', ctx = {}) {
  if (!pendingSaleDraft?.active) return;
  const draft = { ...pendingSaleDraft };
  pendingSaleDraft = null;
  const clients = getAppDataSafe().clients || [];

  if (entityType === 'client') {
    const resolved = (savedId && clients.find(c => c.id === savedId)) || clients[0] || null;
    if (resolved) {
      draft.clienteId = resolved.id;
      draft.contratoId = '';
      draft.clientSearch = '';
    }
  } else if (entityType === 'contract') {
    const owner = clients.find(c => c.id === (ctx.clientId || draft.clienteId));
    const resolved = (savedId && owner?.contracts?.find(cnt => cnt.id === savedId)) || owner?.contracts?.[0] || null;
    if (resolved) draft.contratoId = resolved.id;
  } else if (entityType === 'post') {
    const owner = clients.find(c => c.id === (ctx.clientId || draft.clienteId));
    const resolved = (savedId && owner?.posts?.find(p => p.id === savedId)) || owner?.posts?.[0] || null;
    if (resolved && !draft.linkedPostIds.includes(resolved.id)) {
      draft.linkedPostIds.push(resolved.id);
      draft.optionalExpanded = true;
    }
  } else if (entityType === 'beneficiary') {
    const bens = getSalesStateSafe().beneficiaries || [];
    const resolved = (savedId && bens.find(b => b.id === savedId)) || bens[bens.length - 1] || null;
    if (resolved) draft.beneficiarioId = resolved.id;
  }

  restoreSaleModalFromDraft(draft);
}

function restoreSaleModalFromDraft(draft) {
  const titleEl = el('saleModalTitle');
  if (titleEl) titleEl.textContent = draft.saleId ? 'Editar venda' : 'Nova venda';
  el('saleFormError')?.classList.add('hidden');
  el('saleId').value = draft.saleId || '';
  el('saleClientSearchInput').value = draft.clientSearch || '';
  populateSaleModalClients(draft.clientSearch || '', draft.clienteId || '');
  populateSaleModalContracts(draft.clienteId || '', draft.contratoId || '');

  el('saleTitleInput').value = draft.titulo || '';
  el('saleDateInput').value = draft.dataVenda || getTodayISODate();
  el('saleCompetenceInput').value = draft.competencia || competenceFromISODate(draft.dataVenda || getTodayISODate());
  competenceTouchedManually = Boolean(draft.competenceTouchedManually);
  el('saleValueInput').value = draft.valorInput || '';
  populateSaleModalBeneficiaries(draft.beneficiarioId || '', Boolean(draft.beneficiaryLocked));
  el('saleModalitySelect').value = draft.modalidadeMaterial || 'nao_informado';
  el('salePackageNoteInput').value = draft.detalhePacoteComplementar || '';
  el('saleInternalNotesInput').value = draft.observacoesInternas || '';
  populateSaleModalPosts(draft.clienteId || '', draft.contratoId || '', draft.linkedPostIds || []);
  setSaleOptionalExpanded(Boolean(draft.optionalExpanded));
  checkDuplicateSaleWarningInForm();
  core()?.openModal?.('saleModal');
}

export function openSaleModal(saleId = null, preselectedClientId = '', preselectedContractId = '') {
  pendingSaleDraft = null;
  const c = core();
  const state = getSalesStateSafe();
  const form = el('saleForm');
  if (form && typeof form.reset === 'function') form.reset();
  el('saleFormError')?.classList.add('hidden');
  el('saleDuplicateWarning')?.classList.add('hidden');

  if (saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;
    if (isSaleLockedByClosure(sale)) {
      c?.showToast?.('Esta competência está fechada. Reabra o fechamento com motivo antes de editar a venda.');
      return;
    }
    el('saleModalTitle').textContent = 'Editar venda';
    el('saleId').value = sale.id;
    el('saleClientSearchInput').value = '';
    populateSaleModalClients('', sale.clienteId);
    populateSaleModalContracts(sale.clienteId, sale.contratoId);

    el('saleTitleInput').value = sale.titulo || '';
    el('saleDateInput').value = sale.dataVenda || getTodayISODate();
    el('saleCompetenceInput').value = sale.competencia || competenceFromISODate(sale.dataVenda);
    competenceTouchedManually = true;
    el('saleValueInput').value = centsToInputStr(sale.valorCentavos);
    const existingCom = getSaleCommission(sale.id, state.commissions);
    populateSaleModalBeneficiaries(existingCom?.beneficiarioId || '', isCommissionLocked(existingCom));
    el('saleModalitySelect').value = sale.modalidadeMaterial || 'nao_informado';
    el('salePackageNoteInput').value = sale.detalhePacoteComplementar || '';
    el('saleInternalNotesInput').value = sale.observacoesInternas || '';
    const linked = state.salePosts.filter(sp => sp.vendaId === sale.id).map(sp => sp.postagemId);
    populateSaleModalPosts(sale.clienteId, sale.contratoId, linked);
    const hasOpt = Boolean(
      (sale.modalidadeMaterial && sale.modalidadeMaterial !== 'nao_informado') ||
      sale.detalhePacoteComplementar ||
      sale.observacoesInternas ||
      linked.length > 0
    );
    setSaleOptionalExpanded(hasOpt);
  } else {
    const today = getTodayISODate();
    el('saleModalTitle').textContent = 'Nova venda';
    el('saleId').value = '';
    el('saleClientSearchInput').value = '';
    const clientTarget = preselectedClientId || (salesFilterState.clienteId !== 'ALL' ? salesFilterState.clienteId : '');
    populateSaleModalClients('', clientTarget);
    populateSaleModalContracts(el('saleClientSelect')?.value || '', preselectedContractId || '');

    el('saleDateInput').value = today;
    const defaultComp = (salesFilterState.competencia && salesFilterState.competencia !== 'ALL')
      ? salesFilterState.competencia
      : competenceFromISODate(today);
    el('saleCompetenceInput').value = defaultComp;
    competenceTouchedManually = false;
    populateSaleModalBeneficiaries('', false);
    el('saleModalitySelect').value = 'nao_informado';
    setSaleOptionalExpanded(false);
  }

  checkDuplicateSaleWarningInForm();
  c?.openModal?.('saleModal');
}

async function handleSaleFormSubmit(e) {
  e.preventDefault();
  if (isSubmittingSale) return;
  if (!ensureSupabaseReadyForWrite()) return;

  const c = core();
  const state = getSalesStateSafe();
  const errEl = el('saleFormError');
  errEl?.classList.add('hidden');

  const saleId = el('saleId')?.value || '';
  const clienteId = el('saleClientSelect')?.value || '';
  const contratoId = el('saleContractSelect')?.value || '';
  const titulo = (el('saleTitleInput')?.value || '').trim();
  const dataVenda = el('saleDateInput')?.value || '';
  const competencia = (el('saleCompetenceInput')?.value || competenceFromISODate(dataVenda)).trim();
  const valorCentavos = parseMoneyToCents(el('saleValueInput')?.value);
  const beneficiarioId = el('saleBeneficiarySelect')?.value || null;
  const modalidadeMaterial = el('saleModalitySelect')?.value || 'nao_informado';
  const detalhePacoteComplementar = (el('salePackageNoteInput')?.value || '').trim();
  const observacoesInternas = (el('saleInternalNotesInput')?.value || '').trim();
  const linkedPostIds = getSelectedLinkedPostIdsFromForm();

  const showFormErr = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    }
  };

  if (!clienteId) return showFormErr('Selecione um cliente existente.');
  if (!contratoId) return showFormErr('Selecione um contrato ou acordo deste cliente.');
  if (!titulo) return showFormErr('Informe a identificação ou descrição da venda.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVenda)) return showFormErr('Informe uma data da venda válida.');
  if (!/^\d{4}-\d{2}$/.test(competencia)) return showFormErr('Informe uma competência válida (AAAA-MM).');
  if (valorCentavos === null || valorCentavos < 0) return showFormErr('Informe um valor monetário válido.');

  const closedForComp = state.closures.find(cl => cl.competencia === competencia && cl.status === 'fechado');
  if (closedForComp && !saleId) {
    return showFormErr(`A competência ${formatCompetenceLabel(competencia)} está fechada. Reabra o fechamento ou altere a competência antes de lançar.`);
  }

  const saveBtn = el('btnSaveSale');
  isSubmittingSale = true;
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }

  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const nowIso = new Date().toISOString();
    let finalSaleId = saleId;

    if (sb) {
      if (saleId) {
        const { error } = await sb.from('vendas').update({
          cliente_id: clienteId,
          contrato_id: contratoId,
          titulo,
          data_venda: dataVenda,
          competencia,
          valor_centavos: valorCentavos,
          modalidade_material: modalidadeMaterial,
          detalhe_pacote_complementar: detalhePacoteComplementar,
          observacoes_internas: observacoesInternas,
          atualizado_em: nowIso
        }).eq('id', saleId);
        if (error) throw error;

        await sb.from('venda_postagens').delete().eq('venda_id', saleId);
        if (linkedPostIds.length > 0) {
          const postRows = linkedPostIds.map(pid => ({
            ...(userId ? { user_id: userId } : {}),
            venda_id: saleId,
            postagem_id: pid
          }));
          const { error: vpErr } = await sb.from('venda_postagens').insert(postRows);
          if (vpErr) throw vpErr;
        }

        const existingCom = getSaleCommission(saleId, state.commissions);
        if (!isCommissionLocked(existingCom)) {
          const prevBenId = existingCom?.beneficiarioId || null;
          if (existingCom && beneficiarioId !== prevBenId && (existingCom.status !== 'nao_se_aplica' || beneficiarioId)) {
            const comUpdate = {
              beneficiario_id: beneficiarioId || null,
              atualizado_em: nowIso
            };
            if ((!beneficiarioId && existingCom.status === 'apurada') || existingCom.status === 'nao_se_aplica') {
              comUpdate.status = 'a_definir';
              comUpdate.base_calculo_centavos = null;
              comUpdate.valor_apurado_centavos = null;
            }
            const { error: cuErr } = await sb.from('venda_comissoes').update(comUpdate).eq('id', existingCom.id);
            if (cuErr) throw cuErr;
          } else if (!existingCom && beneficiarioId) {
            const { error: ciErr } = await sb.from('venda_comissoes').insert([{
              ...(userId ? { user_id: userId } : {}),
              venda_id: saleId,
              beneficiario_id: beneficiarioId,
              status: 'a_definir'
            }]);
            if (ciErr) throw ciErr;
          }
        }
      } else {
        const { data: insertedSale, error } = await sb.from('vendas').insert([{
          ...(userId ? { user_id: userId } : {}),
          cliente_id: clienteId,
          contrato_id: contratoId,
          titulo,
          data_venda: dataVenda,
          competencia,
          valor_centavos: valorCentavos,
          modalidade_material: modalidadeMaterial,
          detalhe_pacote_complementar: detalhePacoteComplementar,
          observacoes_internas: observacoesInternas,
          idempotency_key: generateUid('vkey')
        }]).select('*').single();
        if (error) throw error;
        finalSaleId = insertedSale.id;

        if (linkedPostIds.length > 0) {
          const postRows = linkedPostIds.map(pid => ({
            ...(userId ? { user_id: userId } : {}),
            venda_id: finalSaleId,
            postagem_id: pid
          }));
          const { error: vpErr } = await sb.from('venda_postagens').insert(postRows);
          if (vpErr) throw vpErr;
        }

        const { error: comErr } = await sb.from('venda_comissoes').insert([{
          ...(userId ? { user_id: userId } : {}),
          venda_id: finalSaleId,
          beneficiario_id: beneficiarioId || null,
          status: 'a_definir'
        }]);
        if (comErr) throw comErr;
      }
      await fetchSalesFromSupabase();
    } else {
      if (saleId) {
        const existing = state.sales.find(s => s.id === saleId);
        if (!existing) throw new Error('Venda não encontrada.');
        Object.assign(existing, {
          clienteId,
          contratoId,
          titulo,
          dataVenda,
          competencia,
          valorCentavos,
          modalidadeMaterial,
          detalhePacoteComplementar,
          observacoesInternas,
          atualizadoEm: nowIso
        });
        state.salePosts = state.salePosts.filter(sp => sp.vendaId !== saleId);
        linkedPostIds.forEach(pid => {
          state.salePosts.push({ id: generateUid('vp'), vendaId: saleId, postagemId: pid, criadoEm: nowIso });
        });

        const existingCom = getSaleCommission(saleId, state.commissions);
        if (!isCommissionLocked(existingCom)) {
          const prevBenId = existingCom?.beneficiarioId || null;
          if (existingCom && beneficiarioId !== prevBenId && (existingCom.status !== 'nao_se_aplica' || beneficiarioId)) {
            existingCom.beneficiarioId = beneficiarioId || null;
            if ((!beneficiarioId && existingCom.status === 'apurada') || existingCom.status === 'nao_se_aplica') {
              existingCom.status = 'a_definir';
              existingCom.baseCalculoCentavos = null;
              existingCom.valorApuradoCentavos = null;
            }
            existingCom.atualizadoEm = nowIso;
          } else if (!existingCom && beneficiarioId) {
            state.commissions.push({
              id: generateUid('vcom'),
              vendaId: saleId,
              beneficiarioId,
              regraId: null,
              status: 'a_definir',
              tipoCalculo: null,
              percentualBps: null,
              valorFixoCentavos: null,
              basePercentual: null,
              gatilhoApuracao: null,
              baseCalculoCentavos: null,
              valorApuradoCentavos: null,
              fechamentoId: null,
              pagoEm: null,
              congeladaEm: null,
              observacoes: '',
              criadoEm: nowIso,
              atualizadoEm: nowIso
            });
          }
        }
      } else {
        finalSaleId = generateUid('vend');
        state.sales.unshift({
          id: finalSaleId,
          clienteId,
          contratoId,
          titulo,
          dataVenda,
          competencia,
          valorCentavos,
          modalidadeMaterial,
          detalhePacoteComplementar,
          observacoesInternas,
          conferenciaStatus: 'pendente',
          conferenciaObs: '',
          conferidoPorUserId: null,
          conferidoPorEmail: '',
          conferidoEm: null,
          recebimentoStatus: 'nao_informado',
          fechamentoId: null,
          idempotencyKey: generateUid('vkey'),
          arquivado: false,
          criadoEm: nowIso,
          atualizadoEm: nowIso
        });
        linkedPostIds.forEach(pid => {
          state.salePosts.push({ id: generateUid('vp'), vendaId: finalSaleId, postagemId: pid, criadoEm: nowIso });
        });
        state.commissions.push({
          id: generateUid('vcom'),
          vendaId: finalSaleId,
          beneficiarioId: beneficiarioId || null,
          regraId: null,
          status: 'a_definir',
          tipoCalculo: null,
          percentualBps: null,
          valorFixoCentavos: null,
          basePercentual: null,
          gatilhoApuracao: null,
          baseCalculoCentavos: null,
          valorApuradoCentavos: null,
          fechamentoId: null,
          pagoEm: null,
          congeladaEm: null,
          observacoes: '',
          criadoEm: nowIso,
          atualizadoEm: nowIso
        });
      }
      c?.saveData?.();
    }

    await c?.recordAuditEvent?.('venda', finalSaleId, saleId ? 'edicao' : 'criacao', { titulo, competencia, valorCentavos });
    c?.closeModal?.('saleModal');

    if (salesFilterState.competencia !== 'ALL' && salesFilterState.competencia !== competencia) {
      salesFilterState.competencia = competencia;
      c?.showToast?.(`Venda salva! Competência ${formatCompetenceLabel(competencia)} selecionada.`);
    } else {
      c?.showToast?.(saleId ? 'Venda atualizada!' : 'Venda registrada!');
    }
    renderSalesView();
  } catch (err) {
    showFormErr('Erro ao salvar venda: ' + (err?.message || 'Verifique os dados.'));
  } finally {
    isSubmittingSale = false;
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar venda'; }
  }
}

// ==================== DETALHE DA VENDA: 3 PAINÉIS INDEPENDENTES ====================
export function openSaleDetailModal(saleId) {
  currentDetailSaleId = saleId;
  renderSaleDetailModal();
  core()?.openModal?.('saleDetailModal');
}

function renderSaleDetailModal() {
  const body = el('saleDetailBody');
  const titleEl = el('saleDetailModalTitle');
  const subEl = el('saleDetailSubtitle');
  if (!body || !currentDetailSaleId) return;

  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  if (!sale) {
    body.innerHTML = '<div class="empty-state-card"><p>Venda não encontrada.</p></div>';
    return;
  }

  const { client, contract } = findClientAndContract(sale.clienteId, sale.contratoId);
  const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
  const rawCom = getSaleCommission(sale.id, state.commissions);
  const commission = rawCom ? calculateCommissionForSale(rawCom, sale, receiptSummary) : null;
  const comStatus = commission?.status || 'a_definir';
  const lockedByClosure = isSaleLockedByClosure(sale);
  const comLocked = isCommissionLocked(commission);
  const agType = contract ? (core()?.getAgreementTypeBadgeText?.(contract) || contract.agreementType || '') : '';
  const linkedIds = new Set(state.salePosts.filter(sp => sp.vendaId === sale.id).map(sp => sp.postagemId));
  const linkedPosts = (client?.posts || []).filter(p => linkedIds.has(p.id));

  if (titleEl) titleEl.textContent = sale.titulo;
  if (subEl) {
    subEl.textContent = `${client?.name || 'Cliente'} • ${agType} (${contract?.agreementTitle || contract?.period || 'Acordo'}) • Competência ${formatCompetenceLabel(sale.competencia)}`;
  }

  const activeBens = state.beneficiaries.filter(b => b.ativo || b.id === commission?.beneficiarioId);
  const activeRules = state.rules.filter(r => r.ativo);

  const movementsHtml = receiptSummary.movements.length === 0
    ? '<p class="sales-table-sub">Nenhum recebimento lançado ainda.</p>'
    : receiptSummary.movements.map(m => {
        const isEstorno = m.tipoMovimento === 'estorno';
        const alreadyReversed = receiptSummary.reversedIds.has(m.id);
        return `
          <div class="sales-movement-row ${isEstorno ? 'sales-movement-estorno' : ''}">
            <div>
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <strong class="tabular-nums">${escapeStr(formatCentsBR(m.valorCentavos))}</strong>
                <span class="sales-badge ${isEstorno ? 'sales-badge-danger' : 'sales-badge-success'}">${isEstorno ? 'Estorno' : 'Recebimento'}</span>
                ${m.divergenciaExcedente ? '<span class="sales-badge sales-badge-danger">Excedeu saldo</span>' : ''}
                ${alreadyReversed ? '<span class="sales-badge sales-badge-neutral">Estornado</span>' : ''}
              </div>
              <div class="sales-table-sub">
                ${escapeStr(formatDateOnlyBR(m.dataRecebimento))}
                ${m.formaPagamento ? ` • ${escapeStr(m.formaPagamento)}` : ''}
                ${m.referencia ? ` • Ref: ${escapeStr(m.referencia)}` : ''}
                ${m.observacoes ? ` • ${escapeStr(m.observacoes)}` : ''}
              </div>
            </div>
            ${!isEstorno && !alreadyReversed && !lockedByClosure
              ? `<button type="button" class="btn btn-ghost btn-sm" onclick="reverseReceiptInDetail('${escapeStr(m.id)}')">Estornar</button>`
              : ''}
          </div>
        `;
      }).join('');

  const postsHtml = linkedPosts.length === 0
    ? '<span class="sales-table-sub">Nenhuma publicação vinculada (venda pode ser salva antes da publicação).</span>'
    : linkedPosts.map(p => `
        <div class="sales-linked-post-pill">
          <strong>${escapeStr(p.title || p.type || 'Publicação')}</strong>
          <span class="sales-table-sub">(${escapeStr(p.type || '')} • ${escapeStr(p.status || 'Pendente')})</span>
          ${p.link ? `<a href="${escapeStr(p.link)}" target="_blank" rel="noopener noreferrer" class="sales-link-subtle">Abrir link ↗</a>` : ''}
        </div>
      `).join('');

  body.innerHTML = `
    <div class="sales-detail-summary-card">
      <div class="sales-detail-top-actions">
        <div>
          <span class="sales-badge sales-badge-neutral">${escapeStr(MODALITY_LABELS[sale.modalidadeMaterial || 'nao_informado'])}</span>
          ${lockedByClosure ? '<span class="sales-badge sales-badge-info">Congelada em fechamento</span>' : ''}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openClientFromSales('${escapeStr(sale.clienteId)}')">Perfil do cliente</button>
          ${!lockedByClosure ? `<button type="button" class="btn btn-secondary btn-sm" onclick="editSaleFromDetail('${escapeStr(sale.id)}')">Editar venda</button>` : ''}
        </div>
      </div>
      <div class="sales-detail-amounts-grid tabular-nums">
        <div><span>Valor da venda</span><strong>${escapeStr(formatCentsBR(sale.valorCentavos))}</strong></div>
        <div><span>Total recebido</span><strong style="color:var(--green-text);">${escapeStr(formatCentsBR(receiptSummary.totalRecebidoCentavos))}</strong></div>
        <div><span>Saldo a receber</span><strong>${escapeStr(formatCentsBR(receiptSummary.saldoCentavos))}</strong></div>
        <div><span>Data da venda</span><strong>${escapeStr(formatDateOnlyBR(sale.dataVenda))}</strong></div>
      </div>
      ${sale.detalhePacoteComplementar ? `<div class="sales-table-sub" style="margin-top:6px;">Pacote: ${escapeStr(sale.detalhePacoteComplementar)}</div>` : ''}
      ${sale.observacoesInternas ? `<div class="sales-table-sub" style="margin-top:4px;">Obs. interna (não enviada a clientes): ${escapeStr(sale.observacoesInternas)}</div>` : ''}
      <div class="sales-linked-posts-wrap">${postsHtml}</div>
    </div>

    <!-- PAINEL A: CONFERÊNCIA DA VENDA -->
    <div class="sales-panel-card">
      <div class="sales-panel-header">
        <h4>A. Conferência da venda</h4>
        <span class="sales-badge ${getBadgeClassForConference(sale.conferenciaStatus || 'pendente')}">${escapeStr(CONFERENCE_LABELS[sale.conferenciaStatus || 'pendente'])}</span>
      </div>
      <p class="sales-table-sub">Conferir a venda não altera recebimento nem comissão.</p>
      <div class="sales-form-2col" style="margin-top:8px;">
        <div class="form-group">
          <label for="detailConferenceStatus">Situação da conferência</label>
          <select id="detailConferenceStatus">
            <option value="pendente" ${sale.conferenciaStatus === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="conferida" ${sale.conferenciaStatus === 'conferida' ? 'selected' : ''}>Conferida</option>
            <option value="divergencia" ${sale.conferenciaStatus === 'divergencia' ? 'selected' : ''}>Com divergência</option>
          </select>
        </div>
        <div class="form-group">
          <label for="detailConferenceObs">Observação da conferência</label>
          <input type="text" id="detailConferenceObs" value="${escapeStr(sale.conferenciaObs || '')}" placeholder="Ex: Valores conferidos com acordo">
        </div>
      </div>
      <div class="sales-panel-foot">
        <span class="sales-table-sub">${sale.conferidoEm ? `Última conferência: ${escapeStr(formatDateTimeBR(sale.conferidoEm))} (${escapeStr(sale.conferidoPorEmail || 'usuário')})` : 'Ainda não conferida'}</span>
        <button type="button" class="btn btn-primary btn-sm" id="btnSaveDetailConference">Salvar conferência</button>
      </div>
    </div>

    <!-- PAINEL B: RECEBIMENTO DO CLIENTE -->
    <div class="sales-panel-card">
      <div class="sales-panel-header">
        <h4>B. Recebimentos do cliente</h4>
        <span class="sales-badge ${getBadgeClassForReceipt(receiptSummary.statusRecebimento)}">${escapeStr(RECEIPT_LABELS[receiptSummary.statusRecebimento])}</span>
      </div>
      ${receiptSummary.hasDivergenciaExcedente ? `
        <div class="warning-banner" style="margin:8px 0;">
          Excedente detectado: recebido (${escapeStr(formatCentsBR(receiptSummary.totalRecebidoCentavos))}) ultrapassa o valor da venda em <strong>${escapeStr(formatCentsBR(receiptSummary.excedenteCentavos))}</strong>. Tratado como divergência até ajuste/estorno.
        </div>` : ''}
      ${receiptSummary.activePositiveCount === 0 && receiptSummary.totalRecebidoCentavos <= 0 ? `
        <div class="sales-inline-links-row" style="margin-bottom:8px;">
          <button type="button" class="btn btn-ghost btn-sm" onclick="togglePendingReceiptStatus('${sale.recebimentoStatus === 'pendente' ? 'nao_informado' : 'pendente'}')">
            ${sale.recebimentoStatus === 'pendente' ? 'Voltar para "Não informado"' : 'Marcar como "Pendente de recebimento"'}
          </button>
          <span class="sales-table-sub">Não é possível marcar "Recebido" sem lançar o recebimento correspondente.</span>
        </div>` : ''}
      <div class="sales-movements-list">${movementsHtml}</div>
      ${!lockedByClosure ? `
        <form id="detailReceiptForm" class="sales-inline-subform" novalidate>
          <div class="sales-form-2col">
            <div class="form-group">
              <label for="detailReceiptValue">Novo recebimento (R$) <span class="req">*</span></label>
              <input type="text" id="detailReceiptValue" inputmode="decimal" placeholder="${escapeStr(centsToInputStr(receiptSummary.saldoCentavos || sale.valorCentavos))}">
            </div>
            <div class="form-group">
              <label for="detailReceiptDate">Data do recebimento <span class="req">*</span></label>
              <input type="date" id="detailReceiptDate" value="${escapeStr(getTodayISODate())}">
            </div>
          </div>
          <div class="sales-form-2col">
            <div class="form-group">
              <label for="detailReceiptMethod">Forma de pagamento (opcional)</label>
              <input type="text" id="detailReceiptMethod" placeholder="Ex: PIX, Boleto, Cartão">
            </div>
            <div class="form-group">
              <label for="detailReceiptRef">Referência / Observação</label>
              <input type="text" id="detailReceiptRef" placeholder="Ex: Comprovante 1ª parcela">
            </div>
          </div>
          <div id="detailReceiptExcessConfirmBox" class="warning-banner hidden">
            <label style="display:flex; gap:8px; align-items:flex-start; cursor:pointer;">
              <input type="checkbox" id="detailReceiptConfirmExcess">
              <span>O valor informado ultrapassa o saldo a receber. Confirmar registro mesmo assim marcando <strong>divergência excedente</strong> (sem ajustar silenciosamente)?</span>
            </label>
          </div>
          <p id="detailReceiptError" class="auth-error hidden"></p>
          <div style="display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-primary btn-sm" id="btnSaveDetailReceipt">Registrar recebimento</button>
          </div>
        </form>` : '<p class="sales-table-sub">Competência fechada: reabra o fechamento para lançar ou estornar recebimentos.</p>'}
    </div>

    <!-- PAINEL C: COMISSÃO -->
    <div class="sales-panel-card">
      <div class="sales-panel-header">
        <h4>C. Comissão da venda</h4>
        <span class="sales-badge ${getBadgeClassForCommission(comStatus)}">${escapeStr(COMMISSION_LABELS[comStatus] || comStatus)}</span>
      </div>
      ${comLocked ? `
        <div class="sales-readonly-box" style="margin-top:8px;">
          <div><strong>Situação:</strong> ${escapeStr(COMMISSION_LABELS[comStatus] || comStatus)} ${commission?.pagoEm ? `em ${escapeStr(formatDateOnlyBR(commission.pagoEm))}` : '(congelada no fechamento)'}</div>
          <div><strong>Regra aplicada:</strong> ${escapeStr(formatCommissionRuleSummary(commission))}</div>
          <div><strong>Valor apurado:</strong> ${escapeStr(formatCentsBR(commission?.valorApuradoCentavos || 0))}</div>
          <p class="sales-table-sub" style="margin-top:4px;">Comissões já fechadas ou pagas não sofrem recálculo automático.</p>
        </div>` : `
        <form id="detailCommissionForm" style="margin-top:8px;" novalidate>
          <div class="sales-form-2col">
            <div class="form-group">
              <label for="detailComMode">Definição da comissão</label>
              <select id="detailComMode">
                <option value="a_definir" ${comStatus === 'a_definir' ? 'selected' : ''}>A definir</option>
                <option value="configurar" ${comStatus === 'apurada' ? 'selected' : ''}>Configurar / Apurar</option>
                <option value="nao_se_aplica" ${comStatus === 'nao_se_aplica' ? 'selected' : ''}>Não se aplica (sem comissão)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="detailComRuleTemplate">Usar regra opcional (preenche abaixo)</label>
              <select id="detailComRuleTemplate">
                <option value="">Preenchimento manual</option>
                ${activeRules.map(r => `<option value="${escapeStr(r.id)}" ${commission?.regraId === r.id ? 'selected' : ''}>${escapeStr(r.nome)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="detailComFieldsWrap" class="${comStatus === 'apurada' ? '' : 'hidden'}">
            <div class="sales-form-2col">
              <div class="form-group">
                <label for="detailComBeneficiary">Beneficiário <span class="req">*</span></label>
                <select id="detailComBeneficiary">
                  <option value="">Selecione...</option>
                  ${activeBens.map(b => `<option value="${escapeStr(b.id)}" ${commission?.beneficiarioId === b.id ? 'selected' : ''}>${escapeStr(b.nome)}${b.papel ? ` (${escapeStr(b.papel)})` : ''}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="detailComTrigger">Gatilho de apuração <span class="req">*</span></label>
                <select id="detailComTrigger">
                  <option value="sobre_venda" ${commission?.gatilhoApuracao === 'sobre_venda' ? 'selected' : ''}>Sobre a venda</option>
                  <option value="sobre_recebido" ${commission?.gatilhoApuracao === 'sobre_recebido' ? 'selected' : ''}>Sobre o valor recebido</option>
                  <option value="manual" ${commission?.gatilhoApuracao === 'manual' ? 'selected' : ''}>Regra confirmada manualmente</option>
                </select>
              </div>
            </div>

            <div class="sales-form-2col">
              <div class="form-group">
                <label for="detailComType">Tipo de cálculo</label>
                <select id="detailComType">
                  <option value="percentual" ${(commission?.tipoCalculo || 'percentual') === 'percentual' ? 'selected' : ''}>Percentual (%)</option>
                  <option value="fixo" ${commission?.tipoCalculo === 'fixo' ? 'selected' : ''}>Valor fixo (R$)</option>
                </select>
              </div>
              <div class="form-group" id="detailComPctBaseWrap">
                <label for="detailComBasePct">Base do percentual</label>
                <select id="detailComBasePct">
                  <option value="valor_venda" ${(commission?.basePercentual || 'valor_venda') === 'valor_venda' ? 'selected' : ''}>Sobre valor da venda (${escapeStr(formatCentsBR(sale.valorCentavos))})</option>
                  <option value="valor_recebido" ${commission?.basePercentual === 'valor_recebido' ? 'selected' : ''}>Sobre valor recebido (${escapeStr(formatCentsBR(receiptSummary.totalRecebidoCentavos))})</option>
                </select>
              </div>
            </div>

            <div class="sales-form-2col">
              <div class="form-group" id="detailComPercentInputWrap">
                <label for="detailComPercentInput">Percentual (%)</label>
                <input type="text" id="detailComPercentInput" inputmode="decimal" value="${escapeStr(commission?.percentualBps !== null && commission?.percentualBps !== undefined ? (commission.percentualBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '')}" placeholder="Ex: 15">
              </div>
              <div class="form-group hidden" id="detailComFixedInputWrap">
                <label for="detailComFixedInput">Valor fixo (R$)</label>
                <input type="text" id="detailComFixedInput" inputmode="decimal" value="${escapeStr(commission?.valorFixoCentavos !== null && commission?.valorFixoCentavos !== undefined ? centsToInputStr(commission.valorFixoCentavos) : '')}" placeholder="Ex: 50,00">
              </div>
              <div class="form-group">
                <label for="detailComObs">Observação da comissão</label>
                <input type="text" id="detailComObs" value="${escapeStr(commission?.observacoes || '')}" placeholder="Opcional">
              </div>
            </div>
          </div>

          <p id="detailComError" class="auth-error hidden"></p>
          <div class="sales-panel-foot">
            <div>
              ${comStatus === 'apurada'
                ? `<span class="tabular-nums">Apurada: <strong>${escapeStr(formatCentsBR(commission?.valorApuradoCentavos || 0))}</strong></span>`
                : `<span class="sales-table-sub">${comStatus === 'nao_se_aplica' ? 'Venda marcada sem comissão.' : 'Sem regra configurada — permanece como "A definir".'}</span>`}
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${comStatus === 'apurada' && commission?.id && commission?.beneficiarioId
                ? `<button type="button" class="btn btn-yellow-brand btn-sm" onclick="openSalesPayoutForList('${escapeStr(commission.id)}')">Dar baixa na comissão</button>`
                : ''}
              <button type="submit" class="btn btn-primary btn-sm" id="btnSaveDetailCommission">Salvar comissão</button>
            </div>
          </div>
        </form>`}
    </div>
  `;

  el('btnSaveDetailConference')?.addEventListener('click', saveDetailConference);
  el('detailReceiptForm')?.addEventListener('submit', saveDetailReceipt);
  el('detailCommissionForm')?.addEventListener('submit', saveDetailCommission);
  el('detailComMode')?.addEventListener('change', syncDetailCommissionFieldsUI);
  el('detailComType')?.addEventListener('change', syncDetailCommissionFieldsUI);
  el('detailComRuleTemplate')?.addEventListener('change', applySelectedRuleTemplateInDetail);
  el('detailReceiptValue')?.addEventListener('input', () => {
    el('detailReceiptExcessConfirmBox')?.classList.add('hidden');
    const cb = el('detailReceiptConfirmExcess');
    if (cb) cb.checked = false;
  });
  syncDetailCommissionFieldsUI();
}

function syncDetailCommissionFieldsUI() {
  const mode = el('detailComMode')?.value || 'a_definir';
  const type = el('detailComType')?.value || 'percentual';
  el('detailComFieldsWrap')?.classList.toggle('hidden', mode !== 'configurar');
  el('detailComPctBaseWrap')?.classList.toggle('hidden', type !== 'percentual');
  el('detailComPercentInputWrap')?.classList.toggle('hidden', type !== 'percentual');
  el('detailComFixedInputWrap')?.classList.toggle('hidden', type !== 'fixo');
}

function applySelectedRuleTemplateInDetail() {
  const ruleId = el('detailComRuleTemplate')?.value || '';
  if (!ruleId) return;
  const rule = getSalesStateSafe().rules.find(r => r.id === ruleId);
  if (!rule) return;
  if (el('detailComMode')) el('detailComMode').value = 'configurar';
  if (el('detailComBeneficiary')) el('detailComBeneficiary').value = rule.beneficiarioId || '';
  if (el('detailComTrigger')) el('detailComTrigger').value = rule.gatilhoApuracao || 'sobre_venda';
  if (el('detailComType')) el('detailComType').value = rule.tipoCalculo || 'percentual';
  if (el('detailComBasePct')) el('detailComBasePct').value = rule.basePercentual || 'valor_venda';
  if (el('detailComPercentInput')) {
    el('detailComPercentInput').value = rule.percentualBps !== null && rule.percentualBps !== undefined
      ? (rule.percentualBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
      : '';
  }
  if (el('detailComFixedInput')) {
    el('detailComFixedInput').value = rule.valorFixoCentavos !== null && rule.valorFixoCentavos !== undefined
      ? centsToInputStr(rule.valorFixoCentavos)
      : '';
  }
  syncDetailCommissionFieldsUI();
}

async function saveDetailConference() {
  if (!ensureSupabaseReadyForWrite() || !currentDetailSaleId) return;
  const c = core();
  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  if (!sale) return;

  const status = el('detailConferenceStatus')?.value || 'pendente';
  const obs = (el('detailConferenceObs')?.value || '').trim();
  const nowIso = new Date().toISOString();
  const email = c?.getCurrentUserEmail?.() || (c?.getSupabase?.() ? 'usuario' : 'modo_local');
  const userId = c?.getCurrentUserId?.() || null;

  try {
    const sb = c?.getSupabase?.();
    if (sb) {
      const { error } = await sb.from('vendas').update({
        conferencia_status: status,
        conferencia_obs: obs,
        conferido_por_user_id: userId,
        conferido_por_email: email,
        conferido_em: nowIso,
        atualizado_em: nowIso
      }).eq('id', sale.id);
      if (error) throw error;
      await fetchSalesFromSupabase();
    } else {
      sale.conferenciaStatus = status;
      sale.conferenciaObs = obs;
      sale.conferidoPorUserId = userId;
      sale.conferidoPorEmail = email;
      sale.conferidoEm = nowIso;
      sale.atualizadoEm = nowIso;
      c?.saveData?.();
    }
    await c?.recordAuditEvent?.('venda', sale.id, 'conferencia', { status, obs });
    c?.showToast?.('Conferência salva!');
    renderSaleDetailModal();
    renderSalesView();
  } catch (err) {
    c?.showToast?.('Erro ao salvar conferência: ' + (err?.message || ''));
  }
}

export async function togglePendingReceiptStatus(targetStatus) {
  if (!ensureSupabaseReadyForWrite() || !currentDetailSaleId) return;
  const c = core();
  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  if (!sale) return;
  const summary = computeSaleReceiptSummary(sale, state.receipts);
  if (summary.activePositiveCount > 0 || summary.totalRecebidoCentavos > 0) {
    c?.showToast?.('Existem recebimentos lançados: o status é calculado pelos registros financeiros.');
    return;
  }
  const safeStatus = targetStatus === 'pendente' ? 'pendente' : 'nao_informado';
  const nowIso = new Date().toISOString();
  const sb = c?.getSupabase?.();
  if (sb) {
    const { error } = await sb.from('vendas').update({ recebimento_status: safeStatus, atualizado_em: nowIso }).eq('id', sale.id);
    if (error) return c?.showToast?.('Erro: ' + error.message);
    await fetchSalesFromSupabase();
  } else {
    sale.recebimentoStatus = safeStatus;
    sale.atualizadoEm = nowIso;
    c?.saveData?.();
  }
  renderSaleDetailModal();
  renderSalesView();
}

async function syncSaleCommissionAfterReceiptChange(sale, state, sb) {
  const com = getSaleCommission(sale.id, state.commissions);
  if (!com || isCommissionLocked(com)) return;
  if (com.status !== 'apurada' || com.basePercentual !== 'valor_recebido') return;

  const updatedSummary = computeSaleReceiptSummary(sale, state.receipts);
  const recalculated = calculateCommissionForSale(com, sale, updatedSummary);
  const nowIso = new Date().toISOString();

  if (sb) {
    await sb.from('venda_comissoes').update({
      base_calculo_centavos: recalculated.baseCalculoCentavos,
      valor_apurado_centavos: recalculated.valorApuradoCentavos,
      atualizado_em: nowIso
    }).eq('id', com.id);
  } else {
    Object.assign(com, recalculated, { atualizadoEm: nowIso });
  }
}

async function saveDetailReceipt(e) {
  e.preventDefault();
  if (isSubmittingReceipt || !ensureSupabaseReadyForWrite() || !currentDetailSaleId) return;
  const c = core();
  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  if (!sale) return;

  const errEl = el('detailReceiptError');
  errEl?.classList.add('hidden');
  const valorCentavos = parseMoneyToCents(el('detailReceiptValue')?.value);
  const dataRecebimento = el('detailReceiptDate')?.value || '';
  const formaPagamento = (el('detailReceiptMethod')?.value || '').trim();
  const refInput = (el('detailReceiptRef')?.value || '').trim();

  const check = validateNewReceipt(sale, state.receipts, { valorCentavos, dataRecebimento });
  if (!check.ok) {
    if (errEl) { errEl.textContent = check.error; errEl.classList.remove('hidden'); }
    return;
  }

  if (check.willExceedBalance) {
    const confirmBox = el('detailReceiptExcessConfirmBox');
    confirmBox?.classList.remove('hidden');
    if (!el('detailReceiptConfirmExcess')?.checked) {
      if (errEl) {
        errEl.textContent = `Atenção: este recebimento excede o saldo da venda em ${formatCentsBR(check.excessCents)}. Marque a confirmação acima para registrar como divergência.`;
        errEl.classList.remove('hidden');
      }
      return;
    }
  }

  isSubmittingReceipt = true;
  const btn = el('btnSaveDetailReceipt');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const email = c?.getCurrentUserEmail?.() || (sb ? 'usuario' : 'modo_local');
    const nowIso = new Date().toISOString();

    if (sb) {
      const { error } = await sb.from('venda_recebimentos').insert([{
        ...(userId ? { user_id: userId } : {}),
        venda_id: sale.id,
        tipo_movimento: 'recebimento',
        valor_centavos: valorCentavos,
        data_recebimento: dataRecebimento,
        forma_pagamento: formaPagamento,
        referencia: refInput,
        divergencia_excedente: Boolean(check.willExceedBalance),
        ...(userId ? { registrado_por_user_id: userId } : {}),
        registrado_por_email: email,
        idempotency_key: generateUid('rkey')
      }]);
      if (error) throw error;
      await fetchSalesFromSupabase();

      const freshSale = getSalesStateSafe().sales.find(s => s.id === sale.id) || sale;
      const updatedSummary = computeSaleReceiptSummary(freshSale, getSalesStateSafe().receipts);
      await sb.from('vendas').update({
        recebimento_status: updatedSummary.statusRecebimento,
        atualizado_em: nowIso
      }).eq('id', sale.id);
      await syncSaleCommissionAfterReceiptChange(freshSale, getSalesStateSafe(), sb);
      await fetchSalesFromSupabase();
    } else {
      state.receipts.push({
        id: generateUid('rec'),
        vendaId: sale.id,
        tipoMovimento: 'recebimento',
        estornoDeId: null,
        valorCentavos,
        dataRecebimento,
        formaPagamento,
        referencia: refInput,
        observacoes: '',
        divergenciaExcedente: Boolean(check.willExceedBalance),
        registradoPorEmail: email,
        idempotencyKey: generateUid('rkey'),
        criadoEm: nowIso
      });
      const updatedSummary = computeSaleReceiptSummary(sale, state.receipts);
      sale.recebimentoStatus = updatedSummary.statusRecebimento;
      sale.atualizadoEm = nowIso;
      await syncSaleCommissionAfterReceiptChange(sale, state, null);
      c?.saveData?.();
    }

    await c?.recordAuditEvent?.('recebimento', sale.id, 'criacao', { valorCentavos, dataRecebimento, excedente: check.willExceedBalance });
    c?.showToast?.(check.willExceedBalance ? 'Recebimento registrado com alerta de divergência excedente.' : 'Recebimento registrado!');
    renderSaleDetailModal();
    renderSalesView();
  } catch (err) {
    if (errEl) { errEl.textContent = 'Erro ao registrar recebimento: ' + (err?.message || ''); errEl.classList.remove('hidden'); }
  } finally {
    isSubmittingReceipt = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Registrar recebimento'; }
  }
}

export function reverseReceiptInDetail(receiptId) {
  if (!ensureSupabaseReadyForWrite() || !currentDetailSaleId) return;
  const c = core();
  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  const orig = state.receipts.find(r => r.id === receiptId && r.vendaId === currentDetailSaleId);
  if (!sale || !orig) return;

  c?.openConfirmModal?.(
    'Estornar recebimento',
    `Deseja lançar um estorno de ${formatCentsBR(orig.valorCentavos)}? O lançamento original será preservado no histórico.`,
    async () => {
      try {
        const sb = c?.getSupabase?.();
        const userId = c?.getCurrentUserId?.();
        const email = c?.getCurrentUserEmail?.() || (sb ? 'usuario' : 'modo_local');
        const nowIso = new Date().toISOString();
        const negativeVal = -Math.abs(Math.round(Number(orig.valorCentavos) || 0));

        if (sb) {
          const { error } = await sb.from('venda_recebimentos').insert([{
            ...(userId ? { user_id: userId } : {}),
            venda_id: sale.id,
            tipo_movimento: 'estorno',
            estorno_de_id: orig.id,
            valor_centavos: negativeVal,
            data_recebimento: getTodayISODate(),
            forma_pagamento: orig.formaPagamento || '',
            referencia: `Estorno de ${orig.referencia || formatDateOnlyBR(orig.dataRecebimento)}`,
            ...(userId ? { registrado_por_user_id: userId } : {}),
            registrado_por_email: email,
            idempotency_key: generateUid('estkey')
          }]);
          if (error) throw error;
          await fetchSalesFromSupabase();
          const freshSale = getSalesStateSafe().sales.find(s => s.id === sale.id) || sale;
          const updatedSummary = computeSaleReceiptSummary(freshSale, getSalesStateSafe().receipts);
          await sb.from('vendas').update({
            recebimento_status: updatedSummary.statusRecebimento,
            atualizado_em: nowIso
          }).eq('id', sale.id);
          await syncSaleCommissionAfterReceiptChange(freshSale, getSalesStateSafe(), sb);
          await fetchSalesFromSupabase();
        } else {
          state.receipts.push({
            id: generateUid('rec'),
            vendaId: sale.id,
            tipoMovimento: 'estorno',
            estornoDeId: orig.id,
            valorCentavos: negativeVal,
            dataRecebimento: getTodayISODate(),
            formaPagamento: orig.formaPagamento || '',
            referencia: `Estorno de ${orig.referencia || formatDateOnlyBR(orig.dataRecebimento)}`,
            observacoes: '',
            divergenciaExcedente: false,
            registradoPorEmail: email,
            idempotencyKey: generateUid('estkey'),
            criadoEm: nowIso
          });
          const updatedSummary = computeSaleReceiptSummary(sale, state.receipts);
          sale.recebimentoStatus = updatedSummary.statusRecebimento;
          sale.atualizadoEm = nowIso;
          await syncSaleCommissionAfterReceiptChange(sale, state, null);
          c?.saveData?.();
        }
        c?.showToast?.('Estorno registrado com preservação de histórico.');
        renderSaleDetailModal();
        renderSalesView();
      } catch (err) {
        c?.showToast?.('Erro ao estornar recebimento: ' + (err?.message || ''));
      }
    }
  );
}

async function saveDetailCommission(e) {
  e.preventDefault();
  if (isSubmittingCommission || !ensureSupabaseReadyForWrite() || !currentDetailSaleId) return;
  const c = core();
  const state = getSalesStateSafe();
  const sale = state.sales.find(s => s.id === currentDetailSaleId);
  if (!sale) return;

  const existing = getSaleCommission(sale.id, state.commissions);
  if (isCommissionLocked(existing)) {
    c?.showToast?.('Comissão fechada ou já paga não pode ser alterada.');
    return;
  }

  const errEl = el('detailComError');
  errEl?.classList.add('hidden');
  const showComErr = (msg) => {
    if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
  };

  const mode = el('detailComMode')?.value || 'a_definir';
  const regraId = el('detailComRuleTemplate')?.value || null;
  let draft = {
    ...(existing || { id: generateUid('vcom'), vendaId: sale.id }),
    regraId,
    observacoes: (el('detailComObs')?.value || '').trim()
  };

  if (mode === 'a_definir') {
    draft = {
      ...draft,
      status: 'a_definir',
      beneficiarioId: null,
      tipoCalculo: null,
      percentualBps: null,
      valorFixoCentavos: null,
      basePercentual: null,
      gatilhoApuracao: null,
      baseCalculoCentavos: null,
      valorApuradoCentavos: null
    };
  } else if (mode === 'nao_se_aplica') {
    draft = {
      ...draft,
      status: 'nao_se_aplica',
      beneficiarioId: null,
      tipoCalculo: null,
      percentualBps: null,
      valorFixoCentavos: null,
      basePercentual: null,
      gatilhoApuracao: null,
      baseCalculoCentavos: null,
      valorApuradoCentavos: 0
    };
  } else {
    const beneficiarioId = el('detailComBeneficiary')?.value || '';
    const tipoCalculo = el('detailComType')?.value || 'percentual';
    const gatilhoApuracao = el('detailComTrigger')?.value || 'sobre_venda';
    const basePercentual = el('detailComBasePct')?.value || 'valor_venda';
    const percentualBps = tipoCalculo === 'percentual' ? parsePercentToBps(el('detailComPercentInput')?.value) : null;
    const valorFixoCentavos = tipoCalculo === 'fixo' ? parseMoneyToCents(el('detailComFixedInput')?.value) : null;

    if (!beneficiarioId) return showComErr('Selecione um beneficiário para apurar a comissão.');
    if (tipoCalculo === 'percentual' && percentualBps === null) return showComErr('Informe um percentual válido (0 a 100%).');
    if (tipoCalculo === 'fixo' && valorFixoCentavos === null) return showComErr('Informe um valor fixo válido.');

    const receiptSummary = computeSaleReceiptSummary(sale, state.receipts);
    draft = calculateCommissionForSale({
      ...draft,
      status: 'apurada',
      beneficiarioId,
      tipoCalculo,
      percentualBps,
      valorFixoCentavos,
      basePercentual: tipoCalculo === 'percentual' ? basePercentual : null,
      gatilhoApuracao
    }, sale, receiptSummary);
  }

  isSubmittingCommission = true;
  const btn = el('btnSaveDetailCommission');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const nowIso = new Date().toISOString();

    if (sb) {
      const payload = {
        beneficiario_id: draft.beneficiarioId || null,
        regra_id: draft.regraId || null,
        status: draft.status,
        tipo_calculo: draft.tipoCalculo || null,
        percentual_bps: draft.percentualBps ?? null,
        valor_fixo_centavos: draft.valorFixoCentavos ?? null,
        base_percentual: draft.basePercentual || null,
        gatilho_apuracao: draft.gatilhoApuracao || null,
        base_calculo_centavos: draft.baseCalculoCentavos ?? null,
        valor_apurado_centavos: draft.valorApuradoCentavos ?? null,
        observacoes: draft.observacoes || '',
        atualizado_em: nowIso
      };
      if (existing?.id) {
        const { error } = await sb.from('venda_comissoes').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('venda_comissoes').insert([{
          ...(userId ? { user_id: userId } : {}),
          venda_id: sale.id,
          ...payload
        }]);
        if (error) throw error;
      }
      await fetchSalesFromSupabase();
    } else {
      draft.atualizadoEm = nowIso;
      if (existing) {
        Object.assign(existing, draft);
      } else {
        draft.criadoEm = nowIso;
        state.commissions.push(draft);
      }
      c?.saveData?.();
    }

    await c?.recordAuditEvent?.('comissao', sale.id, 'configuracao', { status: draft.status, valorApuradoCentavos: draft.valorApuradoCentavos });
    c?.showToast?.('Comissão atualizada!');
    renderSaleDetailModal();
    renderSalesView();
  } catch (err) {
    showComErr('Erro ao salvar comissão: ' + (err?.message || ''));
  } finally {
    isSubmittingCommission = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar comissão'; }
  }
}

// ==================== BENEFICIÁRIOS & REGRAS OPCIONAIS (#salesConfigModal) ====================
export function openSalesConfigModal(preserveDraft = false) {
  if (!preserveDraft) pendingSaleDraft = null;
  editingBeneficiaryId = null;
  editingRuleId = null;
  renderSalesConfigModal();
  core()?.openModal?.('salesConfigModal');
}

function renderSalesConfigModal() {
  const body = el('salesConfigModalBody');
  if (!body) return;
  const state = getSalesStateSafe();
  const editBen = editingBeneficiaryId ? state.beneficiaries.find(b => b.id === editingBeneficiaryId) : null;
  const editRule = editingRuleId ? state.rules.find(r => r.id === editingRuleId) : null;
  const benefMap = new Map(state.beneficiaries.map(b => [b.id, b]));

  const benList = state.beneficiaries.length === 0
    ? '<p class="sales-table-sub">Nenhum beneficiário cadastrado.</p>'
    : state.beneficiaries.map(b => `
        <div class="sales-subcard">
          <div class="sales-subcard-row">
            <div>
              <strong>${escapeStr(b.nome)}</strong>
              ${b.papel ? `<span class="sales-table-sub"> • ${escapeStr(b.papel)}</span>` : ''}
              <span class="sales-badge ${b.ativo ? 'sales-badge-success' : 'sales-badge-neutral'}">${b.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="editSalesBeneficiary('${escapeStr(b.id)}')">Editar</button>
          </div>
        </div>
      `).join('');

  const rulesList = state.rules.length === 0
    ? '<p class="sales-table-sub">Nenhuma regra opcional cadastrada. Você pode configurar cada comissão diretamente na venda.</p>'
    : state.rules.map(r => {
        const ben = benefMap.get(r.beneficiarioId);
        const valStr = r.tipoCalculo === 'fixo'
          ? `Fixo ${formatCentsBR(r.valorFixoCentavos)}`
          : `${formatBpsPercent(r.percentualBps)} (${r.basePercentual === 'valor_recebido' ? 'sobre recebido' : 'sobre venda'})`;
        return `
          <div class="sales-subcard">
            <div class="sales-subcard-row">
              <div>
                <strong>${escapeStr(r.nome)}</strong>
                <span class="sales-badge ${r.ativo ? 'sales-badge-info' : 'sales-badge-neutral'}">${r.ativo ? 'Ativa' : 'Inativa'}</span>
                <div class="sales-table-sub">
                  ${escapeStr(ben?.nome || 'Beneficiário')} • ${escapeStr(valStr)} • ${escapeStr(TRIGGER_LABELS[r.gatilhoApuracao] || r.gatilhoApuracao)}
                  ${r.modalidadeFiltro ? ` • Filtro: ${escapeStr(MODALITY_LABELS[r.modalidadeFiltro] || r.modalidadeFiltro)}` : ''}
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="editSalesRule('${escapeStr(r.id)}')">Editar</button>
            </div>
          </div>
        `;
      }).join('');

  body.innerHTML = `
    <div class="sales-panel-card">
      <h4>${editBen ? 'Editar beneficiário' : 'Cadastrar beneficiário (equipe / vendedor)'}</h4>
      <form id="salesBeneficiaryForm" class="sales-inline-subform" novalidate>
        <div class="sales-form-2col">
          <div class="form-group">
            <label for="cfgBenName">Nome do beneficiário <span class="req">*</span></label>
            <input type="text" id="cfgBenName" required value="${escapeStr(editBen?.nome || '')}" placeholder="Ex: Responsável comercial">
          </div>
          <div class="form-group">
            <label for="cfgBenRole">Função / Papel</label>
            <input type="text" id="cfgBenRole" value="${escapeStr(editBen?.papel || '')}" placeholder="Ex: Comercial, Social Media">
          </div>
        </div>
        <div class="sales-form-2col">
          <div class="form-group">
            <label for="cfgBenObs">Observações</label>
            <input type="text" id="cfgBenObs" value="${escapeStr(editBen?.observacoes || '')}">
          </div>
          <div class="form-group" style="justify-content:flex-end;">
            <label class="toggle-inline"><input type="checkbox" id="cfgBenActive" ${editBen?.ativo !== false ? 'checked' : ''}><span>Ativo</span></label>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          ${editBen ? '<button type="button" class="btn btn-ghost btn-sm" onclick="openSalesConfigModal()">Cancelar edição</button>' : ''}
          <button type="submit" class="btn btn-primary btn-sm">${editBen ? 'Atualizar beneficiário' : 'Adicionar beneficiário'}</button>
        </div>
      </form>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">${benList}</div>
    </div>

    <div class="sales-panel-card">
      <h4>${editRule ? 'Editar regra opcional' : 'Regras opcionais de comissão'}</h4>
      <p class="sales-table-sub">Editar uma regra nunca recalcula comissões já congeladas em fechamento ou pagas.</p>
      <form id="salesRuleForm" class="sales-inline-subform" novalidate>
        <div class="sales-form-2col">
          <div class="form-group">
            <label for="cfgRuleName">Nome da regra <span class="req">*</span></label>
            <input type="text" id="cfgRuleName" required value="${escapeStr(editRule?.nome || '')}" placeholder="Ex: Regra padrão comercial">
          </div>
          <div class="form-group">
            <label for="cfgRuleBen">Beneficiário <span class="req">*</span></label>
            <select id="cfgRuleBen" required>
              <option value="">Selecione...</option>
              ${state.beneficiaries.map(b => `<option value="${escapeStr(b.id)}" ${editRule?.beneficiarioId === b.id ? 'selected' : ''}>${escapeStr(b.nome)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="sales-form-2col">
          <div class="form-group">
            <label for="cfgRuleType">Tipo</label>
            <select id="cfgRuleType">
              <option value="percentual" ${(editRule?.tipoCalculo || 'percentual') === 'percentual' ? 'selected' : ''}>Percentual (%)</option>
              <option value="fixo" ${editRule?.tipoCalculo === 'fixo' ? 'selected' : ''}>Valor fixo (R$)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="cfgRuleTrigger">Gatilho de apuração</label>
            <select id="cfgRuleTrigger">
              <option value="sobre_venda" ${editRule?.gatilhoApuracao === 'sobre_venda' ? 'selected' : ''}>Sobre a venda</option>
              <option value="sobre_recebido" ${editRule?.gatilhoApuracao === 'sobre_recebido' ? 'selected' : ''}>Sobre o valor recebido</option>
              <option value="manual" ${editRule?.gatilhoApuracao === 'manual' ? 'selected' : ''}>Regra confirmada manualmente</option>
            </select>
          </div>
        </div>
        <div class="sales-form-2col">
          <div class="form-group" id="cfgRulePctWrap">
            <label for="cfgRulePct">Percentual (%)</label>
            <input type="text" id="cfgRulePct" value="${escapeStr(editRule?.percentualBps !== null && editRule?.percentualBps !== undefined ? (editRule.percentualBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '')}" placeholder="Ex: 10">
          </div>
          <div class="form-group" id="cfgRuleBaseWrap">
            <label for="cfgRuleBase">Base do percentual</label>
            <select id="cfgRuleBase">
              <option value="valor_venda" ${(editRule?.basePercentual || 'valor_venda') === 'valor_venda' ? 'selected' : ''}>Valor da venda</option>
              <option value="valor_recebido" ${editRule?.basePercentual === 'valor_recebido' ? 'selected' : ''}>Valor recebido</option>
            </select>
          </div>
          <div class="form-group hidden" id="cfgRuleFixWrap">
            <label for="cfgRuleFix">Valor fixo (R$)</label>
            <input type="text" id="cfgRuleFix" value="${escapeStr(editRule?.valorFixoCentavos !== null && editRule?.valorFixoCentavos !== undefined ? centsToInputStr(editRule.valorFixoCentavos) : '')}" placeholder="Ex: 100,00">
          </div>
        </div>
        <div class="sales-form-2col">
          <div class="form-group">
            <label for="cfgRuleMod">Modalidade (opcional)</label>
            <select id="cfgRuleMod">
              <option value="">Qualquer modalidade</option>
              <option value="midia_pronta" ${editRule?.modalidadeFiltro === 'midia_pronta' ? 'selected' : ''}>Mídia pronta</option>
              <option value="criacao_conteudo" ${editRule?.modalidadeFiltro === 'criacao_conteudo' ? 'selected' : ''}>Criação de conteúdo</option>
              <option value="outro" ${editRule?.modalidadeFiltro === 'outro' ? 'selected' : ''}>Outro</option>
            </select>
          </div>
          <div class="form-group" style="justify-content:flex-end;">
            <label class="toggle-inline"><input type="checkbox" id="cfgRuleActive" ${editRule?.ativo !== false ? 'checked' : ''}><span>Regra ativa</span></label>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="submit" class="btn btn-primary btn-sm">${editRule ? 'Atualizar regra' : 'Adicionar regra'}</button>
        </div>
      </form>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">${rulesList}</div>
    </div>
  `;

  const syncRuleTypeUI = () => {
    const isFixed = el('cfgRuleType')?.value === 'fixo';
    el('cfgRulePctWrap')?.classList.toggle('hidden', isFixed);
    el('cfgRuleBaseWrap')?.classList.toggle('hidden', isFixed);
    el('cfgRuleFixWrap')?.classList.toggle('hidden', !isFixed);
  };
  el('cfgRuleType')?.addEventListener('change', syncRuleTypeUI);
  syncRuleTypeUI();

  el('salesBeneficiaryForm')?.addEventListener('submit', saveBeneficiaryFromConfig);
  el('salesRuleForm')?.addEventListener('submit', saveRuleFromConfig);
}

export function editSalesBeneficiary(id) {
  editingBeneficiaryId = id;
  renderSalesConfigModal();
}

export function editSalesRule(id) {
  editingRuleId = id;
  renderSalesConfigModal();
}

async function saveBeneficiaryFromConfig(e) {
  e.preventDefault();
  if (isSubmittingConfig || !ensureSupabaseReadyForWrite()) return;
  const c = core();
  const state = getSalesStateSafe();
  const nome = (el('cfgBenName')?.value || '').trim();
  const papel = (el('cfgBenRole')?.value || '').trim();
  const observacoes = (el('cfgBenObs')?.value || '').trim();
  const ativo = Boolean(el('cfgBenActive')?.checked);
  if (!nome) return c?.showToast?.('Informe o nome do beneficiário.');

  isSubmittingConfig = true;
  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const nowIso = new Date().toISOString();
    let savedBenId = editingBeneficiaryId || '';
    if (sb) {
      if (editingBeneficiaryId) {
        const { error } = await sb.from('comissao_beneficiarios').update({ nome, papel, observacoes, ativo, atualizado_em: nowIso }).eq('id', editingBeneficiaryId);
        if (error) throw error;
      } else {
        const { data: insertedBen, error } = await sb.from('comissao_beneficiarios').insert([{ ...(userId ? { user_id: userId } : {}), nome, papel, observacoes, ativo }]).select('id').single();
        if (error) throw error;
        savedBenId = insertedBen?.id || '';
      }
      await fetchSalesFromSupabase();
    } else {
      if (editingBeneficiaryId) {
        const b = state.beneficiaries.find(x => x.id === editingBeneficiaryId);
        if (b) Object.assign(b, { nome, papel, observacoes, ativo, atualizadoEm: nowIso });
      } else {
        savedBenId = generateUid('ben');
        state.beneficiaries.push({ id: savedBenId, nome, papel, userAuthId: null, observacoes, ativo, criadoEm: nowIso, atualizadoEm: nowIso });
      }
      c?.saveData?.();
    }
    editingBeneficiaryId = null;
    c?.showToast?.('Beneficiário salvo!');
    renderSalesConfigModal();
    renderSalesView();
    if (pendingSaleDraft?.active && pendingSaleDraft.actionType === 'beneficiary') {
      c?.closeModal?.('salesConfigModal');
      handleExternalEntityCreated('beneficiary', savedBenId);
    }
  } catch (err) {
    c?.showToast?.('Erro ao salvar beneficiário: ' + (err?.message || ''));
  } finally {
    isSubmittingConfig = false;
  }
}

async function saveRuleFromConfig(e) {
  e.preventDefault();
  if (isSubmittingConfig || !ensureSupabaseReadyForWrite()) return;
  const c = core();
  const state = getSalesStateSafe();
  const nome = (el('cfgRuleName')?.value || '').trim();
  const beneficiarioId = el('cfgRuleBen')?.value || '';
  const tipoCalculo = el('cfgRuleType')?.value || 'percentual';
  const gatilhoApuracao = el('cfgRuleTrigger')?.value || 'sobre_venda';
  const basePercentual = tipoCalculo === 'percentual' ? (el('cfgRuleBase')?.value || 'valor_venda') : null;
  const percentualBps = tipoCalculo === 'percentual' ? parsePercentToBps(el('cfgRulePct')?.value) : null;
  const valorFixoCentavos = tipoCalculo === 'fixo' ? parseMoneyToCents(el('cfgRuleFix')?.value) : null;
  const modalidadeFiltro = el('cfgRuleMod')?.value || null;
  const ativo = Boolean(el('cfgRuleActive')?.checked);

  if (!nome || !beneficiarioId) return c?.showToast?.('Informe o nome da regra e o beneficiário.');
  if (tipoCalculo === 'percentual' && percentualBps === null) return c?.showToast?.('Percentual inválido.');
  if (tipoCalculo === 'fixo' && valorFixoCentavos === null) return c?.showToast?.('Valor fixo inválido.');

  isSubmittingConfig = true;
  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const nowIso = new Date().toISOString();
    if (sb) {
      const payload = {
        nome,
        beneficiario_id: beneficiarioId,
        tipo_calculo: tipoCalculo,
        percentual_bps: percentualBps,
        valor_fixo_centavos: valorFixoCentavos,
        base_percentual: basePercentual,
        gatilho_apuracao: gatilhoApuracao,
        modalidade_filtro: modalidadeFiltro,
        ativo,
        atualizado_em: nowIso
      };
      if (editingRuleId) {
        const { error } = await sb.from('comissao_regras').update(payload).eq('id', editingRuleId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('comissao_regras').insert([{ ...(userId ? { user_id: userId } : {}), ...payload }]);
        if (error) throw error;
      }
      await fetchSalesFromSupabase();
    } else {
      if (editingRuleId) {
        const r = state.rules.find(x => x.id === editingRuleId);
        if (r) Object.assign(r, { nome, beneficiarioId, tipoCalculo, percentualBps, valorFixoCentavos, basePercentual, gatilhoApuracao, modalidadeFiltro, ativo, atualizadoEm: nowIso });
      } else {
        state.rules.push({
          id: generateUid('reg'),
          nome, beneficiarioId, tipoCalculo, percentualBps, valorFixoCentavos, basePercentual, gatilhoApuracao, modalidadeFiltro, ativo,
          criadoEm: nowIso, atualizadoEm: nowIso
        });
      }
      c?.saveData?.();
    }
    editingRuleId = null;
    c?.showToast?.('Regra salva (comissões já fechadas ou pagas foram preservadas)!');
    renderSalesConfigModal();
  } catch (err) {
    c?.showToast?.('Erro ao salvar regra: ' + (err?.message || ''));
  } finally {
    isSubmittingConfig = false;
  }
}

// ==================== FECHAMENTO DO MÊS (#salesClosureModal) ====================
export function openSalesClosureModal(targetCompetence = '') {
  const comp = targetCompetence || (salesFilterState.competencia !== 'ALL' ? salesFilterState.competencia : getCurrentCompetenceISO());
  renderSalesClosureModal(comp);
  core()?.openModal?.('salesClosureModal');
}

function renderSalesClosureModal(competencia) {
  const body = el('salesClosureModalBody');
  if (!body) return;
  const state = getSalesStateSafe();
  const clients = getAppDataSafe().clients || [];
  const preview = buildClosurePreview(competencia, state, clients);

  const blockersHtml = preview.blockers.length > 0
    ? `<div class="warning-banner" style="margin:10px 0;">
        <strong>Pendências impedindo o fechamento:</strong>
        <ul style="margin:6px 0 0 18px;">${preview.blockers.map(b => `<li>${escapeStr(b)}</li>`).join('')}</ul>
      </div>`
    : '<div class="sales-alert-line" style="background:var(--green-bg); border-color:var(--green-text); color:var(--green-text);">Competência apta para fechamento. Confirmar o fechamento não marca comissões como pagas.</div>';

  const benefRows = preview.byBeneficiary.length === 0
    ? '<p class="sales-table-sub">Nenhuma comissão apurada nesta competência.</p>'
    : preview.byBeneficiary.map(b => `
        <div class="sales-subcard-row" style="padding:6px 0; border-bottom:1px solid var(--border-subtle);">
          <span><strong>${escapeStr(b.beneficiarioNome)}</strong> (${b.qtdVendas} venda(s))</span>
          <span class="tabular-nums"><strong>${escapeStr(formatCentsBR(b.totalComissaoCentavos))}</strong></span>
        </div>
      `).join('');

  body.innerHTML = `
    <div class="sales-panel-card">
      <div class="form-group">
        <label for="closureCompetenceInput">Competência para fechamento</label>
        <input type="month" id="closureCompetenceInput" value="${escapeStr(competencia)}">
      </div>
      <div class="sales-detail-amounts-grid tabular-nums" style="margin-top:10px;">
        <div><span>Qtd. vendas</span><strong>${preview.qtdVendas}</strong></div>
        <div><span>Total vendido</span><strong>${escapeStr(formatCentsBR(preview.totalVendidoCentavos))}</strong></div>
        <div><span>Total recebido</span><strong>${escapeStr(formatCentsBR(preview.totalRecebidoCentavos))}</strong></div>
        <div><span>Saldo a receber</span><strong>${escapeStr(formatCentsBR(preview.saldoReceberCentavos))}</strong></div>
        <div><span>Com divergência</span><strong>${preview.divergenciasCount}</strong></div>
        <div><span>Comissões a definir</span><strong>${preview.comissoesADefinirCount}</strong></div>
        <div><span>Total comissão</span><strong>${escapeStr(formatCentsBR(preview.totalComissaoCentavos))}</strong></div>
      </div>
      ${blockersHtml}
    </div>

    <div class="sales-panel-card">
      <h4>Comissões apuradas por beneficiário</h4>
      ${benefRows}
    </div>

    <div class="sales-panel-card">
      <div class="form-group">
        <label for="closureNotesInput">Observações do fechamento (opcional)</label>
        <input type="text" id="closureNotesInput" placeholder="Ex: Fechamento mensal revisado">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
        <button type="button" class="btn btn-ghost" data-close-modal="salesClosureModal">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnConfirmSalesClosure" ${preview.canClose ? '' : 'disabled'}>Confirmar fechamento</button>
      </div>
    </div>
  `;

  el('closureCompetenceInput')?.addEventListener('change', (e) => {
    if (/^\d{4}-\d{2}$/.test(e.target.value)) renderSalesClosureModal(e.target.value);
  });
  el('btnConfirmSalesClosure')?.addEventListener('click', () => confirmSalesClosure(competencia));
}

async function confirmSalesClosure(competencia) {
  if (isSubmittingClosure || !ensureSupabaseReadyForWrite()) return;
  const c = core();
  const state = getSalesStateSafe();
  const clients = getAppDataSafe().clients || [];
  const observacoes = (el('closureNotesInput')?.value || '').trim();
  const authorEmail = c?.getCurrentUserEmail?.() || (c?.getSupabase?.() ? 'usuario' : 'modo_local');
  const authorUserId = c?.getCurrentUserId?.() || null;

  isSubmittingClosure = true;
  const btn = el('btnConfirmSalesClosure');
  if (btn) { btn.disabled = true; btn.textContent = 'Fechando...'; }

  try {
    const sb = c?.getSupabase?.();
    if (sb) {
      const preview = buildClosurePreview(competencia, state, clients);
      if (!preview.canClose) throw new Error(preview.blockers[0] || 'Existem pendências impedindo o fechamento.');

      const nowIso = new Date().toISOString();
      const { data: closureRow, error: clErr } = await sb.from('fechamentos_mensais').insert([{
        ...(authorUserId ? { user_id: authorUserId } : {}),
        competencia,
        status: 'fechado',
        qtd_vendas: preview.qtdVendas,
        total_vendido_centavos: preview.totalVendidoCentavos,
        total_recebido_centavos: preview.totalRecebidoCentavos,
        saldo_receber_centavos: preview.saldoReceberCentavos,
        total_comissao_centavos: preview.totalComissaoCentavos,
        ...(authorUserId ? { confirmado_por_user_id: authorUserId } : {}),
        confirmado_por_email: authorEmail,
        confirmado_em: nowIso,
        observacoes,
        idempotency_key: generateUid('fkey')
      }]).select('*').single();
      if (clErr) throw clErr;

      const snapshotItems = [];
      for (const item of preview.itemsPreview) {
        snapshotItems.push({
          ...(authorUserId ? { user_id: authorUserId } : {}),
          fechamento_id: closureRow.id,
          venda_id: item.sale.id,
          venda_comissao_id: item.commission?.id || null,
          beneficiario_id: item.beneficiarioId,
          beneficiario_nome_snapshot: item.beneficiarioNomeSnapshot,
          venda_valor_centavos: item.sale.valorCentavos,
          recebido_snapshot_centavos: item.receiptSummary.totalRecebidoCentavos,
          base_calculo_centavos: item.commission?.baseCalculoCentavos ?? item.sale.valorCentavos,
          regra_resumo_snapshot: item.regraResumoSnapshot,
          valor_comissao_centavos: item.valorComissaoCentavos,
          status_comissao_snapshot: item.statusComissaoSnapshot
        });

        await sb.from('vendas').update({ fechamento_id: closureRow.id, atualizado_em: nowIso }).eq('id', item.sale.id);
        if (item.commission?.id) {
          await sb.from('venda_comissoes').update({
            fechamento_id: closureRow.id,
            congelada_em: item.commission.congeladaEm || nowIso,
            base_calculo_centavos: item.commission.baseCalculoCentavos ?? null,
            valor_apurado_centavos: item.commission.valorApuradoCentavos ?? 0,
            atualizado_em: nowIso
          }).eq('id', item.commission.id);
        }
      }
      if (snapshotItems.length > 0) {
        const { error: fiErr } = await sb.from('fechamento_itens').insert(snapshotItems);
        if (fiErr) throw fiErr;
      }
      await fetchSalesFromSupabase();
    } else {
      const res = executeMonthClosure(competencia, state, clients, {
        authorEmail,
        authorUserId,
        observacoes,
        idempotencyKey: generateUid('fkey')
      });
      if (!res.ok) throw new Error(res.error);
      c?.saveData?.();
    }

    await c?.recordAuditEvent?.('fechamento', competencia, 'fechamento_confirmado', { competencia, authorEmail });
    c?.closeModal?.('salesClosureModal');
    activeSalesSubtab = 'fechamentos';
    c?.showToast?.(`Fechamento de ${formatCompetenceLabel(competencia)} confirmado!`);
    renderSalesView();
  } catch (err) {
    c?.showToast?.('Erro no fechamento: ' + (err?.message || ''));
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar fechamento'; }
  } finally {
    isSubmittingClosure = false;
  }
}

export function promptReopenSalesClosure(closureId) {
  const c = core();
  const body = el('salesClosureModalBody');
  if (!body) return;
  const cl = getSalesStateSafe().closures.find(x => x.id === closureId);
  if (!cl) return;

  body.innerHTML = `
    <div class="sales-panel-card">
      <h4>Reabertura controlada — ${escapeStr(formatCompetenceLabel(cl.competencia))}</h4>
      <p class="sales-table-sub">O snapshot histórico e comissões já pagas serão preservados; apenas lançamentos não pagos ficarão editáveis novamente.</p>
      <div class="form-group" style="margin-top:10px;">
        <label for="reopenClosureReasonInput">Motivo obrigatório da reabertura <span class="req">*</span></label>
        <input type="text" id="reopenClosureReasonInput" placeholder="Ex: Correção de valor ou inclusão de lançamento">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
        <button type="button" class="btn btn-ghost" data-close-modal="salesClosureModal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="btnConfirmReopenClosure">Confirmar reabertura</button>
      </div>
    </div>
  `;
  c?.openModal?.('salesClosureModal');

  el('btnConfirmReopenClosure')?.addEventListener('click', async () => {
    if (!ensureSupabaseReadyForWrite()) return;
    const motivo = (el('reopenClosureReasonInput')?.value || '').trim();
    if (!motivo) return c?.showToast?.('Informe o motivo da reabertura.');
    const authorEmail = c?.getCurrentUserEmail?.() || (c?.getSupabase?.() ? 'usuario' : 'modo_local');
    const nowIso = new Date().toISOString();

    try {
      const sb = c?.getSupabase?.();
      if (sb) {
        const { error } = await sb.from('fechamentos_mensais').update({
          status: 'reaberto',
          reaberto_em: nowIso,
          reaberto_por_email: authorEmail,
          motivo_reabertura: motivo
        }).eq('id', closureId);
        if (error) throw error;
        await sb.from('vendas').update({ fechamento_id: null, atualizado_em: nowIso }).eq('fechamento_id', closureId);
        await sb.from('venda_comissoes').update({ fechamento_id: null, congelada_em: null, atualizado_em: nowIso }).eq('fechamento_id', closureId).neq('status', 'paga');
        await sb.from('venda_comissoes').update({ fechamento_id: null, atualizado_em: nowIso }).eq('fechamento_id', closureId).eq('status', 'paga');
        await fetchSalesFromSupabase();
      } else {
        const res = reopenMonthClosure(closureId, getSalesStateSafe(), { authorEmail, motivo });
        if (!res.ok) throw new Error(res.error);
        c?.saveData?.();
      }
      await c?.recordAuditEvent?.('fechamento', closureId, 'reabertura', { motivo });
      c?.closeModal?.('salesClosureModal');
      c?.showToast?.('Fechamento reaberto com histórico preservado.');
      renderSalesView();
    } catch (err) {
      c?.showToast?.('Erro ao reabrir fechamento: ' + (err?.message || ''));
    }
  });
}

// ==================== BAIXA DE COMISSÃO & ESTORNO (#salesPayoutModal) ====================
export function toggleSaleBulkSelection(comId, checked) {
  if (!comId) return;
  if (checked) selectedCommissionIds.add(comId);
  else selectedCommissionIds.delete(comId);
  updateSalesBulkBarUI();
}

export function openSalesPayoutForList(commaSeparatedIds = '') {
  const ids = String(commaSeparatedIds || '').split(',').map(s => s.trim()).filter(Boolean);
  openSalesPayoutModal(ids);
}

export function openSalesPayoutModal(commissionIds = []) {
  const c = core();
  const state = getSalesStateSafe();
  const check = validatePayoutSelection(commissionIds, state);
  if (!check.ok) {
    c?.showToast?.(check.error);
    return;
  }

  const body = el('salesPayoutModalBody');
  if (!body) return;
  const ben = state.beneficiaries.find(b => b.id === check.beneficiaryId);
  const salesMap = new Map(state.sales.map(s => [s.id, s]));

  const itemsHtml = check.items.map(com => {
    const sale = salesMap.get(com.vendaId);
    const client = sale ? (getAppDataSafe().clients || []).find(cl => cl.id === sale.clienteId) : null;
    return `
      <div class="sales-subcard-row" style="padding:6px 0; border-bottom:1px solid var(--border-subtle);">
        <span><strong>${escapeStr(sale?.titulo || 'Venda')}</strong> • ${escapeStr(client?.name || 'Cliente')} (${escapeStr(formatCompetenceLabel(sale?.competencia || ''))})</span>
        <span class="tabular-nums"><strong>${escapeStr(formatCentsBR(com.valorApuradoCentavos))}</strong></span>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="sales-panel-card">
      <div><strong>Beneficiário:</strong> ${escapeStr(ben?.nome || 'Beneficiário')}</div>
      <div style="margin-top:8px;">${itemsHtml}</div>
      <div class="sales-subcard-row" style="margin-top:10px; font-size:16px;">
        <strong>Total da baixa</strong>
        <strong class="tabular-nums">${escapeStr(formatCentsBR(check.totalCentavos))}</strong>
      </div>
    </div>

    <form id="salesPayoutForm" class="sales-panel-card" novalidate>
      <div class="sales-form-2col">
        <div class="form-group">
          <label for="payoutDateInput">Data efetiva do pagamento <span class="req">*</span></label>
          <input type="date" id="payoutDateInput" required value="${escapeStr(getTodayISODate())}">
        </div>
        <div class="form-group">
          <label for="payoutMethodInput">Forma de pagamento (opcional)</label>
          <input type="text" id="payoutMethodInput" placeholder="Ex: PIX, Transferência">
        </div>
      </div>
      <div class="sales-form-2col">
        <div class="form-group">
          <label for="payoutRefInput">Referência (opcional)</label>
          <input type="text" id="payoutRefInput" placeholder="Ex: Comprovante / Lote">
        </div>
        <div class="form-group">
          <label for="payoutObsInput">Observação (opcional)</label>
          <input type="text" id="payoutObsInput">
        </div>
      </div>
      <p class="sales-table-sub">Dar baixa na comissão não altera o status de recebimento do cliente.</p>
      <p id="payoutFormError" class="auth-error hidden"></p>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
        <button type="button" class="btn btn-ghost" data-close-modal="salesPayoutModal">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="btnConfirmSalesPayout">Confirmar pagamento (${escapeStr(formatCentsBR(check.totalCentavos))})</button>
      </div>
    </form>
  `;

  el('salesPayoutForm')?.addEventListener('submit', (e) => submitSalesPayout(e, check.items.map(i => i.id)));
  c?.openModal?.('salesPayoutModal');
}

async function submitSalesPayout(e, commissionIds) {
  e.preventDefault();
  if (isSubmittingPayout || !ensureSupabaseReadyForWrite()) return;
  const c = core();
  const state = getSalesStateSafe();
  const dataPagamento = el('payoutDateInput')?.value || '';
  const formaPagamento = (el('payoutMethodInput')?.value || '').trim();
  const referencia = (el('payoutRefInput')?.value || '').trim();
  const observacoes = (el('payoutObsInput')?.value || '').trim();
  const errEl = el('payoutFormError');
  errEl?.classList.add('hidden');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPagamento)) {
    if (errEl) { errEl.textContent = 'Informe uma data efetiva de pagamento válida.'; errEl.classList.remove('hidden'); }
    return;
  }

  isSubmittingPayout = true;
  const btn = el('btnConfirmSalesPayout');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

  try {
    const sb = c?.getSupabase?.();
    const userId = c?.getCurrentUserId?.();
    const authorEmail = c?.getCurrentUserEmail?.() || (sb ? 'usuario' : 'modo_local');
    const check = validatePayoutSelection(commissionIds, state);
    if (!check.ok) throw new Error(check.error);

    if (sb) {
      const nowIso = new Date().toISOString();
      const resolvedClosureId = check.items.find(i => i.fechamentoId)?.fechamentoId || null;
      const { data: payoutRow, error: pErr } = await sb.from('comissao_baixas').insert([{
        ...(userId ? { user_id: userId } : {}),
        beneficiario_id: check.beneficiaryId,
        fechamento_id: resolvedClosureId,
        valor_total_centavos: check.totalCentavos,
        data_pagamento: dataPagamento,
        forma_pagamento: formaPagamento,
        referencia,
        observacoes,
        ...(userId ? { registrado_por_user_id: userId } : {}),
        registrado_por_email: authorEmail,
        idempotency_key: generateUid('bxkey')
      }]).select('*').single();
      if (pErr) throw pErr;

      const itemsPayload = check.items.map(com => ({
        ...(userId ? { user_id: userId } : {}),
        baixa_id: payoutRow.id,
        venda_comissao_id: com.id,
        valor_quitado_centavos: Math.max(0, Math.round(Number(com.valorApuradoCentavos) || 0)),
        ativo: true
      }));
      const { error: piErr } = await sb.from('comissao_baixa_itens').insert(itemsPayload);
      if (piErr) throw piErr;

      for (const com of check.items) {
        const { error: uErr } = await sb.from('venda_comissoes').update({
          status: 'paga',
          pago_em: dataPagamento,
          atualizado_em: nowIso
        }).eq('id', com.id);
        if (uErr) throw uErr;
      }
      await fetchSalesFromSupabase();
    } else {
      const res = executeCommissionPayout(commissionIds, state, {
        dataPagamento, formaPagamento, referencia, observacoes, authorEmail, idempotencyKey: generateUid('bxkey')
      });
      if (!res.ok) throw new Error(res.error);
      c?.saveData?.();
    }

    selectedCommissionIds.clear();
    await c?.recordAuditEvent?.('comissao_baixa', check.beneficiaryId, 'pagamento', { totalCentavos: check.totalCentavos, qtd: check.items.length });
    c?.closeModal?.('salesPayoutModal');
    c?.showToast?.('Baixa de comissão registrada!');
    if (currentDetailSaleId && !el('saleDetailModal')?.classList.contains('hidden')) {
      renderSaleDetailModal();
    }
    renderSalesView();
  } catch (err) {
    if (errEl) { errEl.textContent = 'Erro ao registrar baixa: ' + (err?.message || ''); errEl.classList.remove('hidden'); }
  } finally {
    isSubmittingPayout = false;
    if (btn) { btn.disabled = false; }
  }
}

export function promptReverseSalesPayout(payoutId) {
  const c = core();
  const body = el('salesPayoutModalBody');
  const p = getSalesStateSafe().payouts.find(x => x.id === payoutId);
  if (!body || !p) return;

  body.innerHTML = `
    <div class="sales-panel-card">
      <h4>Estornar baixa de comissão (${escapeStr(formatCentsBR(p.valorTotalCentavos))})</h4>
      <p class="sales-table-sub">O registro do pagamento original permanecerá no histórico para auditoria e as comissões voltarão para "Apurada".</p>
      <div class="form-group" style="margin-top:10px;">
        <label for="reversePayoutReasonInput">Motivo do estorno <span class="req">*</span></label>
        <input type="text" id="reversePayoutReasonInput" placeholder="Ex: Lançado em data ou beneficiário incorreto">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
        <button type="button" class="btn btn-ghost" data-close-modal="salesPayoutModal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="btnConfirmReversePayout">Confirmar estorno</button>
      </div>
    </div>
  `;
  c?.openModal?.('salesPayoutModal');

  el('btnConfirmReversePayout')?.addEventListener('click', async () => {
    if (!ensureSupabaseReadyForWrite()) return;
    const motivo = (el('reversePayoutReasonInput')?.value || '').trim();
    if (!motivo) return c?.showToast?.('Informe o motivo do estorno.');
    const state = getSalesStateSafe();
    const authorEmail = c?.getCurrentUserEmail?.() || (c?.getSupabase?.() ? 'usuario' : 'modo_local');
    const nowIso = new Date().toISOString();

    try {
      const sb = c?.getSupabase?.();
      if (sb) {
        const affectedItems = state.payoutItems.filter(pi => pi.baixaId === payoutId && pi.ativo !== false);
        const { error } = await sb.from('comissao_baixas').update({
          estornado_em: nowIso,
          estornado_por_email: authorEmail,
          motivo_estorno: motivo
        }).eq('id', payoutId);
        if (error) throw error;

        await sb.from('comissao_baixa_itens').update({ ativo: false }).eq('baixa_id', payoutId);
        for (const pi of affectedItems) {
          await sb.from('venda_comissoes').update({ status: 'apurada', pago_em: null, atualizado_em: nowIso }).eq('id', pi.vendaComissaoId).eq('status', 'paga');
        }
        await fetchSalesFromSupabase();
      } else {
        const res = reverseCommissionPayout(payoutId, state, { authorEmail, motivo });
        if (!res.ok) throw new Error(res.error);
        c?.saveData?.();
      }
      await c?.recordAuditEvent?.('comissao_baixa', payoutId, 'estorno', { motivo });
      c?.closeModal?.('salesPayoutModal');
      c?.showToast?.('Baixa estornada com histórico preservado.');
      renderSalesView();
    } catch (err) {
      c?.showToast?.('Erro ao estornar baixa: ' + (err?.message || ''));
    }
  });
}

// ==================== RELATÓRIOS INTERNOS (#salesReportModal) ====================
export function openSalesReportModal(defaultType = 'vendas_mes', closureId = '') {
  const typeSel = el('salesReportTypeSelect');
  if (typeSel) typeSel.value = defaultType;
  populateSalesReportClosureSelect(closureId);
  renderSalesReportContent();
  core()?.openModal?.('salesReportModal');
}

function populateSalesReportClosureSelect(preselectId = '') {
  const sel = el('salesReportClosureSelect');
  if (!sel) return;
  const closures = getSalesStateSafe().closures || [];
  if (closures.length === 0) {
    sel.innerHTML = '<option value="">Nenhum fechamento registrado</option>';
    return;
  }
  sel.innerHTML = closures.map(cl =>
    `<option value="${escapeStr(cl.id)}">${escapeStr(formatCompetenceLabel(cl.competencia))} (${cl.status === 'fechado' ? 'Fechado' : 'Reaberto'})</option>`
  ).join('');
  if (preselectId && closures.some(c => c.id === preselectId)) {
    sel.value = preselectId;
  }
}

export function renderSalesReportContent() {
  const area = el('printableSalesReportArea');
  const type = el('salesReportTypeSelect')?.value || 'vendas_mes';
  const closureWrap = el('salesReportClosureSelectWrap');
  if (!area) return;

  closureWrap?.classList.toggle('hidden', type !== 'fechamento');
  const state = getSalesStateSafe();
  const clients = getAppDataSafe().clients || [];

  if (type === 'vendas_mes') {
    const filtered = filterSales(state, clients, salesFilterState);
    const rpt = buildSalesReport(filtered, state, clients, {
      periodLabel: salesFilterState.competencia === 'ALL' ? 'Todas as competências' : formatCompetenceLabel(salesFilterState.competencia),
      dateMode: salesFilterState.dateMode
    });
    lastRenderedSalesReportData = {
      filename: `relatorio-vendas-${salesFilterState.competencia || 'geral'}.csv`,
      headers: ['Cliente', 'Acordo', 'Tipo', 'Descrição', 'Competência', 'Data Venda', 'Valor', 'Recebido', 'Saldo', 'Conferência', 'Recebimento', 'Beneficiário'],
      rows: rpt.rows.map(r => [
        r.cliente, r.acordo, r.tipoAcordo, r.descricao, r.competencia, formatDateOnlyBR(r.dataVenda),
        centsToInputStr(r.valorCentavos), centsToInputStr(r.recebidoCentavos), centsToInputStr(r.saldoCentavos),
        r.conferencia, r.recebimento, r.beneficiario
      ])
    };
    area.innerHTML = `
      <h3>${escapeStr(rpt.title)}</h3>
      <p class="sales-table-sub">Recorte: ${escapeStr(rpt.periodLabel)} • ${escapeStr(rpt.dateModeLabel)}</p>
      <div class="sales-detail-amounts-grid tabular-nums" style="margin:12px 0;">
        <div><span>Vendas</span><strong>${rpt.totals.qtdVendas}</strong></div>
        <div><span>Vendido</span><strong>${escapeStr(formatCentsBR(rpt.totals.totalVendidoCentavos))}</strong></div>
        <div><span>Recebido</span><strong>${escapeStr(formatCentsBR(rpt.totals.totalRecebidoCentavos))}</strong></div>
        <div><span>Saldo</span><strong>${escapeStr(formatCentsBR(rpt.totals.saldoReceberCentavos))}</strong></div>
      </div>
      <table class="sales-table">
        <thead><tr><th>Cliente / Venda</th><th>Acordo</th><th>Comp.</th><th>Valor</th><th>Recebido</th><th>Saldo</th><th>Situações</th></tr></thead>
        <tbody>${rpt.rows.map(r => `
          <tr>
            <td><strong>${escapeStr(r.cliente)}</strong><div class="sales-table-sub">${escapeStr(r.descricao)}</div></td>
            <td>${escapeStr(r.acordo)} (${escapeStr(r.tipoAcordo)})</td>
            <td>${escapeStr(r.competencia)}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(r.valorCentavos))}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(r.recebidoCentavos))}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(r.saldoCentavos))}</td>
            <td>${escapeStr(r.conferencia)} / ${escapeStr(r.recebimento)}</td>
          </tr>`).join('') || '<tr><td colspan="7">Sem vendas neste recorte.</td></tr>'}
        </tbody>
      </table>
    `;
  } else if (type === 'comissoes') {
    const rpt = buildCommissionsReport(state, clients, salesFilterState);
    lastRenderedSalesReportData = {
      filename: `relatorio-comissoes-${salesFilterState.competencia || 'geral'}.csv`,
      headers: ['Beneficiário', 'Cliente', 'Venda', 'Competência', 'Base', 'Regra', 'Apurado', 'Situação', 'Pagamento', 'Referência Baixa'],
      rows: rpt.rows.map(r => [
        r.beneficiario, r.cliente, r.vendaTitulo, r.competencia,
        centsToInputStr(r.baseCalculoCentavos), r.regra, centsToInputStr(r.valorApuradoCentavos),
        r.situacao, r.dataPagamento ? formatDateOnlyBR(r.dataPagamento) : '', r.referenciaBaixa
      ])
    };
    area.innerHTML = `
      <h3>${escapeStr(rpt.title)}</h3>
      <div class="sales-detail-amounts-grid tabular-nums" style="margin:12px 0;">
        <div><span>Total apurado</span><strong>${escapeStr(formatCentsBR(rpt.totals.totalApuradoCentavos))}</strong></div>
        <div><span>Pago</span><strong>${escapeStr(formatCentsBR(rpt.totals.totalPagoCentavos))}</strong></div>
        <div><span>Pendente</span><strong>${escapeStr(formatCentsBR(rpt.totals.totalPendenteCentavos))}</strong></div>
      </div>
      <table class="sales-table">
        <thead><tr><th>Beneficiário</th><th>Cliente / Venda</th><th>Regra</th><th>Apurado</th><th>Situação</th></tr></thead>
        <tbody>${rpt.rows.map(r => `
          <tr>
            <td><strong>${escapeStr(r.beneficiario)}</strong></td>
            <td>${escapeStr(r.cliente)}<div class="sales-table-sub">${escapeStr(r.vendaTitulo)} (${escapeStr(r.competencia)})</div></td>
            <td>${escapeStr(r.regra)}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(r.valorApuradoCentavos))}</td>
            <td>${escapeStr(r.situacao)}${r.dataPagamento ? ` (${escapeStr(formatDateOnlyBR(r.dataPagamento))})` : ''}</td>
          </tr>`).join('') || '<tr><td colspan="5">Sem dados para exibir.</td></tr>'}
        </tbody>
      </table>
    `;
  } else {
    const closureId = el('salesReportClosureSelect')?.value || '';
    const rpt = buildClosureReport(closureId, state, clients);
    if (!rpt) {
      lastRenderedSalesReportData = null;
      area.innerHTML = '<p class="sales-table-sub">Selecione ou confirme um fechamento para visualizar o relatório congelado.</p>';
      return;
    }
    lastRenderedSalesReportData = {
      filename: `relatorio-fechamento-${rpt.closure.competencia}.csv`,
      headers: ['Cliente', 'Venda', 'Valor Venda', 'Recebido Snapshot', 'Base', 'Regra', 'Beneficiário', 'Comissão', 'Status'],
      rows: rpt.items.map(i => [
        i.clienteNome, i.vendaTitulo, centsToInputStr(i.vendaValorCentavos), centsToInputStr(i.recebidoSnapshotCentavos),
        centsToInputStr(i.baseCalculoCentavos ?? i.vendaValorCentavos), i.regraResumoSnapshot,
        i.beneficiarioNomeSnapshot, centsToInputStr(i.valorComissaoCentavos), i.statusComissaoSnapshot
      ])
    };
    area.innerHTML = `
      <h3>${escapeStr(rpt.title)}</h3>
      <p class="sales-table-sub">Status: <strong>${rpt.closure.status === 'fechado' ? 'Fechado' : 'Reaberto'}</strong> • Confirmado em ${escapeStr(formatDateTimeBR(rpt.closure.confirmadoEm))} por ${escapeStr(rpt.closure.confirmadoPorEmail || 'usuário')}</p>
      <div class="sales-detail-amounts-grid tabular-nums" style="margin:12px 0;">
        <div><span>Vendas</span><strong>${rpt.closure.qtdVendas}</strong></div>
        <div><span>Vendido</span><strong>${escapeStr(formatCentsBR(rpt.closure.totalVendidoCentavos))}</strong></div>
        <div><span>Recebido</span><strong>${escapeStr(formatCentsBR(rpt.closure.totalRecebidoCentavos))}</strong></div>
        <div><span>Total comissões</span><strong>${escapeStr(formatCentsBR(rpt.closure.totalComissaoCentavos))}</strong></div>
      </div>
      <h4>Total por beneficiário</h4>
      <ul style="margin:6px 0 14px 18px;">
        ${rpt.byBeneficiary.map(b => `<li><strong>${escapeStr(b.beneficiario)}</strong> (${b.qtd} venda(s)): ${escapeStr(formatCentsBR(b.totalCentavos))}</li>`).join('')}
      </ul>
      <table class="sales-table">
        <thead><tr><th>Cliente / Venda</th><th>Beneficiário</th><th>Regra Snapshot</th><th>Venda</th><th>Comissão</th></tr></thead>
        <tbody>${rpt.items.map(i => `
          <tr>
            <td><strong>${escapeStr(i.clienteNome)}</strong><div class="sales-table-sub">${escapeStr(i.vendaTitulo)}</div></td>
            <td>${escapeStr(i.beneficiarioNomeSnapshot)}</td>
            <td>${escapeStr(i.regraResumoSnapshot)}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(i.vendaValorCentavos))}</td>
            <td class="tabular-nums">${escapeStr(formatCentsBR(i.valorComissaoCentavos))}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;
  }
}

function downloadSalesReportCsv() {
  const c = core();
  if (!lastRenderedSalesReportData) return c?.showToast?.('Não há dados de relatório para exportar.');
  const csvText = exportReportToCsvText(lastRenderedSalesReportData.headers, lastRenderedSalesReportData.rows);
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = lastRenderedSalesReportData.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== EVENTOS DOM & EXPOSIÇÃO GLOBAL ====================
function bindSalesDomEvents() {
  if (salesModuleInitialized || typeof document === 'undefined') return;
  salesModuleInitialized = true;

  el('btnNewSale')?.addEventListener('click', () => openSaleModal());
  el('btnOpenSalesConfig')?.addEventListener('click', () => openSalesConfigModal(false));
  el('btnOpenSalesConfigMobile')?.addEventListener('click', () => openSalesConfigModal(false));
  el('btnOpenSalesClosure')?.addEventListener('click', () => openSalesClosureModal());
  el('btnOpenSalesReports')?.addEventListener('click', () => openSalesReportModal());
  el('btnOpenSalesFiltersSheet')?.addEventListener('click', () => core()?.openModal?.('salesFiltersSheetModal'));

  el('salesCompetenceFilter')?.addEventListener('change', (e) => {
    salesFilterState.competencia = e.target.value;
    renderSalesView();
  });
  el('salesDateModeFilter')?.addEventListener('change', (e) => {
    salesFilterState.dateMode = e.target.value === 'recebimento' ? 'recebimento' : 'competencia';
    renderSalesView();
  });
  el('salesSearchInput')?.addEventListener('input', (e) => {
    salesFilterState.query = e.target.value;
    renderSalesView();
  });

  const filterBindings = [
    ['salesClientFilter', 'clienteId'],
    ['salesSheetClientFilter', 'clienteId'],
    ['salesContractFilter', 'contratoId'],
    ['salesAgreementTypeFilter', 'agreementType'],
    ['salesSheetAgreementTypeFilter', 'agreementType'],
    ['salesConferenceFilter', 'conferenciaStatus'],
    ['salesSheetConferenceFilter', 'conferenciaStatus'],
    ['salesReceiptFilter', 'recebimentoStatus'],
    ['salesSheetReceiptFilter', 'recebimentoStatus'],
    ['salesBeneficiaryFilter', 'beneficiarioId'],
    ['salesSheetBeneficiaryFilter', 'beneficiarioId'],
    ['salesCommissionStatusFilter', 'comissaoStatus'],
    ['salesSheetCommissionStatusFilter', 'comissaoStatus'],
    ['salesModalityFilter', 'modalidadeMaterial'],
    ['salesSheetModalityFilter', 'modalidadeMaterial']
  ];
  filterBindings.forEach(([domId, key]) => {
    el(domId)?.addEventListener('change', (e) => {
      salesFilterState[key] = e.target.value;
      if (key === 'clienteId') salesFilterState.contratoId = 'ALL';
      renderSalesView();
    });
  });

  const resetAllFilters = () => {
    Object.assign(salesFilterState, {
      dateMode: 'competencia',
      query: '',
      clienteId: 'ALL',
      contratoId: 'ALL',
      agreementType: 'ALL',
      conferenciaStatus: 'ALL',
      recebimentoStatus: 'ALL',
      beneficiarioId: 'ALL',
      comissaoStatus: 'ALL',
      modalidadeMaterial: 'ALL'
    });
    renderSalesView();
  };
  el('btnClearSalesFilters')?.addEventListener('click', resetAllFilters);
  el('btnResetSalesSheetFilters')?.addEventListener('click', resetAllFilters);

  document.querySelectorAll('[data-sales-subtab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSalesSubtab = btn.getAttribute('data-sales-subtab') || 'lancamentos';
      renderSalesView();
    });
  });

  el('btnSalesBulkClear')?.addEventListener('click', () => {
    selectedCommissionIds.clear();
    renderSalesView();
  });
  el('btnSalesBulkPayout')?.addEventListener('click', () => {
    openSalesPayoutModal(Array.from(selectedCommissionIds));
  });

  // Eventos dentro do modal manual de venda (#saleModal)
  el('saleForm')?.addEventListener('submit', handleSaleFormSubmit);
  el('saleClientSearchInput')?.addEventListener('input', (e) => {
    const prevClientId = el('saleClientSelect')?.value || '';
    populateSaleModalClients(e.target.value, prevClientId);
    populateSaleModalContracts(el('saleClientSelect')?.value || '', '');
  });
  el('saleClientSelect')?.addEventListener('change', (e) => {
    populateSaleModalContracts(e.target.value, '');
  });
  el('saleContractSelect')?.addEventListener('change', syncSelectedContractMetadataInSaleForm);
  el('saleDateInput')?.addEventListener('change', (e) => {
    if (!competenceTouchedManually) {
      const sugg = competenceFromISODate(e.target.value);
      if (sugg && el('saleCompetenceInput')) el('saleCompetenceInput').value = sugg;
    }
    checkDuplicateSaleWarningInForm();
  });
  el('saleCompetenceInput')?.addEventListener('change', () => {
    competenceTouchedManually = true;
    checkDuplicateSaleWarningInForm();
  });
  el('saleValueInput')?.addEventListener('input', checkDuplicateSaleWarningInForm);
  el('btnUseContractValue')?.addEventListener('click', (e) => {
    const cents = Number(e.currentTarget?.dataset?.contractCents);
    if (Number.isFinite(cents) && el('saleValueInput')) {
      el('saleValueInput').value = centsToInputStr(cents);
      checkDuplicateSaleWarningInForm();
    }
  });
  el('btnToggleSaleOptionalSection')?.addEventListener('click', () => {
    const expanded = el('btnToggleSaleOptionalSection')?.getAttribute('aria-expanded') === 'true';
    setSaleOptionalExpanded(!expanded);
  });

  // Retorno preservado ao criar Cliente, Contrato ou Postagem a partir da Venda
  el('btnSaleOpenClientProfile')?.addEventListener('click', () => {
    const cid = el('saleClientSelect')?.value;
    if (!cid) return core()?.showToast?.('Selecione um cliente primeiro.');
    core()?.closeModal?.('saleModal');
    core()?.openClientProfile?.(cid);
  });
  el('btnSaleCreateNewClient')?.addEventListener('click', () => {
    captureSaleModalDraft('client');
    core()?.closeModal?.('saleModal');
    core()?.openClientModal?.(null);
  });
  el('btnSaleCreateNewContract')?.addEventListener('click', () => {
    const cid = el('saleClientSelect')?.value;
    if (!cid) return core()?.showToast?.('Selecione ou cadastre o cliente antes de criar o acordo.');
    captureSaleModalDraft('contract');
    core()?.closeModal?.('saleModal');
    core()?.openContractModal?.(null, cid);
  });
  el('btnSaleCreateNewPost')?.addEventListener('click', () => {
    const cid = el('saleClientSelect')?.value;
    if (!cid) return core()?.showToast?.('Selecione o cliente antes de registrar uma postagem.');
    const cntId = el('saleContractSelect')?.value || '';
    captureSaleModalDraft('post');
    core()?.closeModal?.('saleModal');
    core()?.openPostModal?.(null, cid, false, cntId);
  });
  el('btnSaleCreateNewBeneficiary')?.addEventListener('click', () => {
    captureSaleModalDraft('beneficiary');
    core()?.closeModal?.('saleModal');
    openSalesConfigModal(true);
  });
  el('saleBeneficiaryButtons')?.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('.sales-choice-btn');
    const hiddenInput = el('saleBeneficiarySelect');
    if (!btn || btn.disabled || !hiddenInput || hiddenInput.disabled) return;
    const chosenId = btn.getAttribute('data-beneficiary-id') || '';
    hiddenInput.value = chosenId;
    el('saleBeneficiaryButtons')?.querySelectorAll('.sales-choice-btn').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  });

  // Relatórios internos
  el('salesReportTypeSelect')?.addEventListener('change', renderSalesReportContent);
  el('salesReportClosureSelect')?.addEventListener('change', renderSalesReportContent);
  el('btnPrintSalesReport')?.addEventListener('click', () => window.print());
  el('btnExportSalesReportCsv')?.addEventListener('click', downloadSalesReportCsv);
}

if (typeof window !== 'undefined') {
  window.__nasruasSales = {
    fetchSalesFromSupabase,
    renderSalesView,
    renderClientProfileSalesSection,
    getContractSalesBadgeHtml,
    handleExternalEntityCreated,
    checkFinancialDeletionGuard,
    openSaleModal,
    openSaleDetailModal,
    openSaleForContract,
    openSalesForClient,
    openSalesConfigModal,
    openSalesClosureModal,
    openSalesPayoutModal,
    openSalesReportModal
  };

  Object.assign(window, {
    openSaleModal,
    openSaleDetailModal,
    openSaleForContract,
    openSalesForClient,
    openSalesConfigModal,
    openSalesClosureModal,
    openSalesPayoutModal,
    openSalesPayoutForList,
    openSalesReportModal,
    promptReopenSalesClosure,
    promptReverseSalesPayout,
    editSalesBeneficiary,
    editSalesRule,
    togglePendingReceiptStatus,
    reverseReceiptInDetail,
    toggleSaleBulkSelection,
    openClientFromSales: (clientId) => core()?.openClientProfile?.(clientId),
    editSaleFromDetail: (saleId) => {
      core()?.closeModal?.('saleDetailModal');
      openSaleModal(saleId);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSalesDomEvents);
  } else {
    bindSalesDomEvents();
  }
}
