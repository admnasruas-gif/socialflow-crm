/**
 * SocialFlow CRM — Gerenciador de Clientes de Social Media
 * Melhorias v2:
 * - Separação estrita entre Cliente e Contrato + Ordenação cronológica de períodos (Mês/Ano)
 * - Indicadores diferenciando Saldo Contratual (Contratadas, Publicadas, Restantes a entregar, Excedente sem compensação entre contratos) de Status Cadastrados (A produzir / Pendente)
 * - Fluxo rápido de publicação direto pelo Card do Cliente ("Adicionar postagem" + "Mais opções" + alerta de link duplicado)
 * - Relatório de Entregas por Contrato ("Copiar resumo" + "Imprimir / Salvar PDF")
 * - Compactação de Contratos na tela de perfil + Separação de Status Administrativo e Progresso de Entregas com prazos
 * - Proteção de ações críticas em Configurações -> Dados (com Exportação JSON e Confirmação Reforçada)
 */

// ==================== CONFIGURAÇÃO SUPABASE (SEM DEPENDÊNCIA DE SUBPASTA) ====================
const getEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key].trim();
    }
  } catch (_) {}
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('http')
);

let supabaseInstance = null;

async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (supabaseInstance) return supabaseInstance;

  try {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return supabaseInstance;
    }
    const mod = await import('@supabase/supabase-js');
    supabaseInstance = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

const STORAGE_KEY = 'socialflow_data_v1';

// Dados de exemplo marcados com isSample: true para isolamento seguro
const SAMPLE_DATA = {
  clients: [
    {
      id: 'sample_cli_1',
      isSample: true,
      name: 'Mariana Costa',
      company: 'Studio Lumina Arquitetura',
      instagram: '@studiolumina.arq',
      phone: '(11) 99812-3456',
      email: 'contato@studiolumina.com.br',
      avatar: '',
      notes: 'Foco em Reels de antes/depois de obras e carrosséis educativos sobre iluminação residencial.',
      contracts: [
        {
          id: 'sample_cnt_101',
          period: 'Novembro/2026',
          totalPosts: 8,
          types: '4 Reels, 4 Carrosséis',
          value: 1800,
          status: 'Ativo',
          startDate: '2026-11-01',
          endDate: '2026-11-30'
        },
        {
          id: 'sample_cnt_100',
          period: 'Outubro/2026',
          totalPosts: 4,
          types: '2 Reels, 2 Carrosséis',
          value: 1200,
          status: 'Concluído',
          startDate: '2026-10-01',
          endDate: '2026-10-31'
        }
      ],
      posts: [
        {
          id: 'sample_pst_1',
          contractId: 'sample_cnt_101',
          date: '2026-11-05',
          type: 'Reels',
          title: 'Tour completo pelo Apartamento Jardins (Antes e Depois)',
          link: 'https://www.instagram.com/reel/example1/',
          status: 'Publicado',
          notes: 'Bateu 15k visualizações orgânicas.'
        },
        {
          id: 'sample_pst_2',
          contractId: 'sample_cnt_101',
          date: '2026-11-12',
          type: 'Carrossel',
          title: '5 erros ao escolher iluminação para sala de estar',
          link: 'https://www.instagram.com/p/example2/',
          status: 'Publicado',
          notes: 'Muitos salvamentos.'
        },
        {
          id: 'sample_pst_099',
          contractId: 'sample_cnt_100',
          date: '2026-10-28',
          type: 'Reels',
          title: 'Entrega final Projeto Cobertura Moema',
          link: 'https://www.instagram.com/reel/outubro1/',
          status: 'Publicado',
          notes: 'Fechamento do pacote de Outubro/2026.'
        }
      ]
    },
    {
      id: 'sample_cli_2',
      isSample: true,
      name: 'Dr. Rafael Mendes',
      company: 'Clínica OdontoPrime',
      instagram: '@dr.rafaelmendes',
      phone: '(21) 98765-1122',
      email: 'rafael@odontoprime.med.br',
      avatar: '',
      notes: 'Conteúdo institucional e educativo seguindo normas do CRO.',
      contracts: [
        {
          id: 'sample_cnt_201',
          period: 'Novembro/2026',
          totalPosts: 12,
          types: '6 Reels, 6 Carrosséis',
          value: 2200,
          status: 'Ativo',
          startDate: '2026-11-01',
          endDate: '2026-11-30'
        },
        {
          id: 'sample_cnt_202',
          period: 'Dezembro/2026',
          totalPosts: 10,
          types: '5 Reels, 5 Carrosséis',
          value: 2200,
          status: 'Ativo',
          startDate: '2026-12-01',
          endDate: '2026-12-31'
        }
      ],
      posts: [
        {
          id: 'sample_pst_201',
          contractId: 'sample_cnt_201',
          date: '2026-11-03',
          type: 'Reels',
          title: 'Mitos e verdades sobre clareamento dental a laser',
          link: 'https://www.instagram.com/reel/odonto1/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'sample_pst_202',
          contractId: 'sample_cnt_201',
          date: '2026-11-08',
          type: 'Carrossel',
          title: 'Quando trocar as lentes de contato dental?',
          link: 'https://www.instagram.com/p/odonto2/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'sample_pst_204',
          contractId: 'sample_cnt_201',
          date: '2026-11-21',
          type: 'Carrossel',
          title: 'Cuidados essenciais no pós-operatório de implantes',
          link: '',
          status: 'Em produção',
          notes: 'Aguardando validação técnica do texto.'
        },
        {
          id: 'sample_pst_205',
          contractId: 'sample_cnt_201',
          date: '2026-11-26',
          type: 'Story',
          title: 'Sequência de Caixinha de Perguntas sobre Sensibilidade',
          link: '',
          status: 'Pendente',
          notes: 'Roteiro enviado para gravação.'
        }
      ]
    },
    {
      id: 'sample_cli_3',
      isSample: true,
      name: 'Camila & Bruno',
      company: 'Roast & Co. Cafeteria',
      instagram: '@roastco.cafe',
      phone: '(31) 99123-9988',
      email: 'ola@roastco.com.br',
      avatar: '',
      notes: 'Pacote enxuto de lançamento do cardápio de verão. 100% entregue!',
      contracts: [
        {
          id: 'sample_cnt_301',
          period: 'Novembro/2026',
          totalPosts: 4,
          types: '2 Reels, 2 Fotos',
          value: 950,
          status: 'Ativo',
          startDate: '2026-11-01',
          endDate: '2026-11-30'
        }
      ],
      posts: [
        {
          id: 'sample_pst_301',
          contractId: 'sample_cnt_301',
          date: '2026-11-04',
          type: 'Reels',
          title: 'ASMR preparando nosso novo Iced Caramel Latte',
          link: 'https://www.tiktok.com/@roastco/video/1',
          status: 'Publicado',
          notes: 'Postado no Reels e TikTok.'
        },
        {
          id: 'sample_pst_302',
          contractId: 'sample_cnt_301',
          date: '2026-11-10',
          type: 'Foto',
          title: 'Croissant de fermentação natural saindo do forno',
          link: 'https://www.instagram.com/p/cafe2/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'sample_pst_303',
          contractId: 'sample_cnt_301',
          date: '2026-11-14',
          type: 'Reels',
          title: 'De onde vêm nossos grãos especiais da Serra da Canastra',
          link: 'https://www.instagram.com/reel/cafe3/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'sample_pst_304',
          contractId: 'sample_cnt_301',
          date: '2026-11-18',
          type: 'Foto',
          title: 'Combo Brunch de Fim de Semana',
          link: 'https://www.instagram.com/p/cafe4/',
          status: 'Publicado',
          notes: 'Pacote do mês finalizado!'
        }
      ]
    }
  ]
};

// Estado da aplicação
let appData = { clients: [] };
let currentClientId = null;
let dashboardMode = 'clients'; // 'clients' | 'posts'
let pendingConfirmCallback = null;
let pendingConfirmRequiredWord = null;
let uploadedAvatarBase64 = '';
let supabase = null;
let isSubmittingClient = false;
let isSubmittingContract = false;
let isSubmittingPost = false;
let openDropdownContractId = null;

// ==================== DATA LOCAL (SEM DESVIO UTC) ====================
/**
 * Retorna a data local atual do usuário no formato YYYY-MM-DD,
 * evitando mudança indevida de dia causada por toISOString() (UTC).
 */
function getLocalTodayISO(refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string YYYY-MM-DD para objeto Date local à meia-noite
 */
function parseLocalDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const parts = isoStr.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

/**
 * Calcula a diferença em dias inteiros entre uma data de término (YYYY-MM-DD) e hoje (data local)
 * > 0: faltam N dias | 0: vence hoje | < 0: vencido há N dias
 */
function getDaysUntilDate(endDateISO, todayISO = getLocalTodayISO()) {
  const end = parseLocalDate(endDateISO);
  const today = parseLocalDate(todayISO);
  if (!end || !today) return null;
  const diffMs = end.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ==================== ORDENAÇÃO CRONOLÓGICA DE PERÍODOS (MÊS/ANO) ====================
const PT_MONTHS_MAP = {
  janeiro: 1, jan: 1,
  fevereiro: 2, fev: 2,
  marco: 3, março: 3, mar: 3,
  abril: 4, abr: 4,
  maio: 5, mai: 5,
  junho: 6, jun: 6,
  julho: 7, jul: 7,
  agosto: 8, ago: 8,
  setembro: 9, set: 9,
  outubro: 10, out: 10,
  novembro: 11, nov: 11,
  dezembro: 12, dez: 12
};

function normalizePeriod(period = '') {
  return String(period).trim();
}

/**
 * Converte um período textual como "Novembro/2026", "Outubro 2025", "11/2026" ou "2026-11"
 * em uma chave numérica cronológica (YYYY * 100 + MM) para ordenação cronológica real.
 */
function parsePeriodSortKey(periodStr = '') {
  const clean = normalizePeriod(periodStr)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!clean) return 0;

  // Formato YYYY-MM ou YYYY/MM
  const isoMatch = clean.match(/^(\d{4})[\s\/\-](\d{1,2})$/);
  if (isoMatch) {
    return Number(isoMatch[1]) * 100 + Number(isoMatch[2]);
  }

  // Formato MM/YYYY ou MM-YYYY
  const brNumMatch = clean.match(/^(\d{1,2})[\s\/\-](\d{4})$/);
  if (brNumMatch) {
    return Number(brNumMatch[2]) * 100 + Number(brNumMatch[1]);
  }

  // Formato "Novembro/2026", "Novembro de 2026", "Nov 2026"
  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : 0;

  let month = 0;
  for (const [mName, mNum] of Object.entries(PT_MONTHS_MAP)) {
    const cleanKey = mName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean.includes(cleanKey)) {
      month = mNum;
      break;
    }
  }

  if (year > 0 || month > 0) {
    return (year || 2000) * 100 + month;
  }

  return 0;
}

/**
 * Ordena uma lista de períodos ou contratos em ordem cronológica (mais recente para o mais antigo, ou vice-versa)
 */
function comparePeriodsChronologically(periodA, periodB, descending = true) {
  const keyA = parsePeriodSortKey(periodA);
  const keyB = parsePeriodSortKey(periodB);
  if (keyA !== keyB) {
    return descending ? keyB - keyA : keyA - keyB;
  }
  return String(periodA).localeCompare(String(periodB), 'pt-BR');
}

function sortContractsChronologically(contracts = [], descending = true) {
  return [...contracts].sort((a, b) => comparePeriodsChronologically(a.period, b.period, descending));
}

// ==================== BANCO DE DADOS: SUPABASE & LOCALSTORAGE ====================
function mapSupabaseRowsToAppData(clientesRows = [], contratosRows = [], postagensRows = []) {
  return {
    clients: clientesRows.map(cli => {
      const clientContracts = contratosRows
        .filter(cnt => cnt.cliente_id === cli.id)
        .map(cnt => ({
          id: cnt.id,
          period: cnt.periodo || '',
          totalPosts: Number(cnt.total_postagens) || 0,
          types: cnt.tipos || '',
          value: cnt.valor !== null && cnt.valor !== undefined ? Number(cnt.valor) : '',
          status: cnt.status || 'Ativo',
          startDate: cnt.data_inicio || '',
          endDate: cnt.data_fim || '',
          createdAt: cnt.criado_em
        }));

      return {
        id: cli.id,
        name: cli.nome || '',
        company: cli.empresa || '',
        instagram: cli.instagram || '',
        phone: cli.telefone || '',
        email: cli.email || '',
        avatar: cli.foto_url || '',
        notes: cli.observacoes || '',
        createdAt: cli.criado_em,
        contracts: sortContractsChronologically(clientContracts, true),
        posts: postagensRows
          .filter(pst => pst.cliente_id === cli.id)
          .map(pst => ({
            id: pst.id,
            contractId: pst.contrato_id || '',
            date: pst.data || '',
            type: pst.tipo || 'Reels',
            title: pst.titulo || '',
            link: pst.link || '',
            status: pst.status || 'Pendente',
            notes: pst.observacoes || '',
            createdAt: pst.criado_em
          }))
      };
    })
  };
}

async function fetchFromSupabase() {
  if (!supabase) return;
  const [resClientes, resContratos, resPostagens] = await Promise.all([
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
    supabase.from('contratos').select('*').order('criado_em', { ascending: false }),
    supabase.from('postagens').select('*').order('data', { ascending: false })
  ]);

  if (resClientes.error) throw resClientes.error;
  if (resContratos.error) throw resContratos.error;
  if (resPostagens.error) throw resPostagens.error;

  appData = mapSupabaseRowsToAppData(
    resClientes.data || [],
    resContratos.data || [],
    resPostagens.data || []
  );
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      appData = JSON.parse(JSON.stringify(SAMPLE_DATA));
      saveData();
    } else {
      appData = JSON.parse(raw);
      if (!appData || !Array.isArray(appData.clients)) {
        appData = { clients: [] };
      }
      // Garante ordenação cronológica dos contratos existentes sem alterar nomes ou dados
      appData.clients.forEach(c => {
        if (Array.isArray(c.contracts)) {
          c.contracts = sortContractsChronologically(c.contracts, true);
        }
      });
    }
  } catch (e) {
    console.error('Erro ao carregar localStorage:', e);
    appData = JSON.parse(JSON.stringify(SAMPLE_DATA));
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (_) {}
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ==================== AUTENTICAÇÃO SUPABASE ====================
function updateDbStatusUI(isOnline, userEmail = '') {
  const dot = document.getElementById('dbConnectionDot');
  const txt = document.getElementById('dbConnectionText');
  const userInfo = document.getElementById('loggedUserInfo');
  const userEmailEl = document.getElementById('loggedUserEmail');

  if (isOnline) {
    dot?.classList.add('online');
    if (txt) txt.textContent = 'Supabase Conectado';
    if (userEmail) {
      userInfo?.classList.remove('hidden');
      if (userEmailEl) userEmailEl.textContent = userEmail;
    }
  } else {
    dot?.classList.remove('online');
    if (txt) txt.textContent = 'Modo Local (Offline)';
    userInfo?.classList.add('hidden');
  }
}

function showAuthScreen(show) {
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');
  if (show) {
    authScreen?.classList.remove('hidden');
    appShell?.classList.add('hidden');
  } else {
    authScreen?.classList.add('hidden');
    appShell?.classList.remove('hidden');
  }
}

async function initBackendAndAuth() {
  if (!isSupabaseConfigured) {
    updateDbStatusUI(false);
    showAuthScreen(false);
    loadData();
    renderDashboard();
    return;
  }

  supabase = await getSupabaseClient();
  if (!supabase) {
    updateDbStatusUI(false);
    showAuthScreen(false);
    loadData();
    renderDashboard();
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    showAuthScreen(true);
  } else {
    showAuthScreen(false);
    updateDbStatusUI(true, session.user?.email || '');
    try {
      await fetchFromSupabase();
      renderDashboard();
    } catch (err) {
      showToast('Erro ao carregar dados do Supabase: ' + (err.message || ''));
    }
  }

  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    if (!newSession) {
      showAuthScreen(true);
      updateDbStatusUI(false);
    } else {
      showAuthScreen(false);
      updateDbStatusUI(true, newSession.user?.email || '');
      try {
        await fetchFromSupabase();
        renderDashboard();
      } catch (err) {
        console.error(err);
      }
    }
  });
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  if (!supabase) return;

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginErrorMsg');
  const btn = document.getElementById('btnLoginSubmit');

  errEl?.classList.add('hidden');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Autenticando...';
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Entrar no Painel';
  }

  if (error) {
    if (errEl) {
      errEl.textContent = 'E-mail ou senha inválidos. Verifique suas credenciais no Supabase.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  showToast('Login realizado com sucesso!');
}

async function handleLogout() {
  if (!supabase) return;
  await supabase.auth.signOut();
  showToast('Sessão encerrada.');
}

// ==================== HELPERS DE PERÍODO E VÍNCULO DE CONTRATO ====================
/**
 * Retorna todos os períodos únicos de contratos ordenados cronologicamente (do mais recente ao mais antigo)
 */
function getAllContractMonths() {
  const set = new Set();
  appData.clients.forEach(client => {
    (client.contracts || []).forEach(c => {
      const p = normalizePeriod(c.period);
      if (p) set.add(p);
    });
  });
  return Array.from(set).sort((a, b) => comparePeriodsChronologically(a, b, true));
}

/**
 * Retorna o contrato ao qual uma postagem está vinculada dentro do MESMO cliente.
 * Impede vínculo cruzado com contrato de outro cliente.
 */
function getLinkedContractForPost(client, post) {
  const contracts = client.contracts || [];
  if (post.contractId) {
    const found = contracts.find(c => c.id === post.contractId);
    return found || null;
  }
  // Compatibilidade com registros antigos sem contractId quando o cliente possui apenas 1 contrato
  if (contracts.length === 1) {
    return contracts[0];
  }
  return null;
}

function getPostContractPeriod(client, post) {
  const contract = getLinkedContractForPost(client, post);
  return contract ? normalizePeriod(contract.period) : '';
}

function populateContractMonthFilters() {
  const globalSelect = document.getElementById('globalContractMonthFilter');
  if (globalSelect) {
    const prevVal = globalSelect.value || 'ALL';
    const months = getAllContractMonths();
    globalSelect.innerHTML = `<option value="ALL">Todos os períodos</option>` +
      months.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if (months.includes(prevVal)) {
      globalSelect.value = prevVal;
    } else {
      globalSelect.value = 'ALL';
    }
  }

  if (currentClientId) {
    const client = appData.clients.find(c => c.id === currentClientId);
    const profileSelect = document.getElementById('filterProfileContractMonth');
    if (client && profileSelect) {
      const prevProfileVal = profileSelect.value || 'ALL';
      const sortedContracts = sortContractsChronologically(client.contracts || [], true);
      const clientMonths = Array.from(new Set(sortedContracts.map(c => normalizePeriod(c.period)).filter(Boolean)));
      profileSelect.innerHTML = `<option value="ALL">Todos os contratos</option>` +
        clientMonths.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
      if (clientMonths.includes(prevProfileVal)) {
        profileSelect.value = prevProfileVal;
      } else {
        profileSelect.value = 'ALL';
      }
    }
  }
}

// ==================== CÁLCULOS DE MÉTRICAS E PROGRESSO (REGRAS V2) ====================
/**
 * Calcula métricas e estado de progresso de um contrato individual:
 * - Restantes: Math.max(0, contratadas - publicadas)
 * - Excedente: Math.max(0, publicadas - contratadas)
 * - Progresso de entregas separado do status administrativo:
 *   * Cancelado -> cinza ("Cancelado")
 *   * Entregue (remaining === 0 e totalContracted > 0) -> verde ("Entregue")
 *   * Em atraso (data_fim informada, < hoje, e remaining > 0) -> vermelho ("Em atraso")
 *   * Prazo próximo (data_fim informada, faltam 0..3 dias, e remaining > 0) -> amarelo ("Prazo próximo")
 *   * Em andamento -> azul ("Em andamento")
 *   * Para contratos antigos sem data_fim, nunca inventa prazo nem marca atraso automaticamente.
 */
function getContractMetrics(client, contract, todayISO = getLocalTodayISO()) {
  const totalContracted = Math.max(0, Number(contract.totalPosts) || 0);
  const allClientPosts = client.posts || [];

  const linkedPosts = allClientPosts.filter(p => {
    const linked = getLinkedContractForPost(client, p);
    return linked && linked.id === contract.id;
  });

  const published = linkedPosts.filter(p => p.status === 'Publicado').length;
  const remaining = Math.max(0, totalContracted - published);
  const excess = Math.max(0, published - totalContracted);
  const percentage = totalContracted > 0
    ? Math.min(100, Math.round((published / totalContracted) * 100))
    : 0;

  let deliveryState = 'Em andamento';
  let deliveryBadgeClass = 'badge-andamento';
  let barFillClass = 'fill-andamento';
  let daysRemaining = null;
  let isOverdue = false;
  let isDueSoon = false;

  if (contract.status === 'Cancelado') {
    deliveryState = 'Cancelado';
    deliveryBadgeClass = 'badge-cancelado-cinza';
    barFillClass = 'fill-cancelado';
  } else if (totalContracted > 0 && remaining === 0) {
    deliveryState = 'Entregue';
    deliveryBadgeClass = 'badge-entregue';
    barFillClass = 'fill-entregue';
  } else if (contract.endDate) {
    daysRemaining = getDaysUntilDate(contract.endDate, todayISO);
    if (daysRemaining !== null && daysRemaining < 0 && remaining > 0) {
      deliveryState = 'Em atraso';
      deliveryBadgeClass = 'badge-atraso';
      barFillClass = 'fill-atraso';
      isOverdue = true;
    } else if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3 && remaining > 0) {
      deliveryState = `Prazo próximo (${daysRemaining === 0 ? 'vence hoje' : `${daysRemaining}d`})`;
      deliveryBadgeClass = 'badge-prazo-proximo';
      barFillClass = 'fill-prazo-proximo';
      isDueSoon = true;
    }
  }

  return {
    totalContracted,
    published,
    remaining,
    excess,
    totalLinked: linkedPosts.length,
    percentage,
    deliveryState,
    deliveryBadgeClass,
    barFillClass,
    daysRemaining,
    isOverdue,
    isDueSoon
  };
}

/**
 * Calcula métricas consolidadas de um cliente respeitando:
 * - Filtro de período (monthFilter)
 * - Opção de incluir ou ocultar contratos cancelados (includeCancelled = false por padrão)
 * - Soma por contrato: postagens excedentes de um contrato NÃO compensam o saldo restante de outro!
 */
function getClientMetrics(client, monthFilter = 'ALL', includeCancelled = false, todayISO = getLocalTodayISO()) {
  const allContracts = sortContractsChronologically(client.contracts || [], true);

  const consideredContracts = allContracts.filter(c => {
    if (!includeCancelled && c.status === 'Cancelado') return false;
    if (monthFilter !== 'ALL' && normalizePeriod(c.period).toLowerCase() !== monthFilter.toLowerCase()) return false;
    return true;
  });

  const activeContractsCount = allContracts.filter(c => {
    if (c.status !== 'Ativo') return false;
    if (monthFilter !== 'ALL' && normalizePeriod(c.period).toLowerCase() !== monthFilter.toLowerCase()) return false;
    return true;
  }).length;

  let totalContracted = 0;
  let totalPublished = 0;
  let remaining = 0;
  let totalExcess = 0;
  let hasOverdueContract = false;
  let hasDueSoonContract = false;

  const contractBreakdowns = consideredContracts.map(cnt => {
    const cm = getContractMetrics(client, cnt, todayISO);
    if (cnt.status !== 'Cancelado') {
      totalContracted += cm.totalContracted;
      totalPublished += cm.published;
      remaining += cm.remaining; // Soma o restante de cada contrato individualmente (sem compensação cruzada)
      totalExcess += cm.excess;
      if (cm.isOverdue) hasOverdueContract = true;
      if (cm.isDueSoon) hasDueSoonContract = true;
    }
    return { contract: cnt, metrics: cm };
  });

  // Contagem de postagens por status cadastrado no escopo do filtro de período
  const postsInPeriod = (client.posts || []).filter(p => {
    const linked = getLinkedContractForPost(client, p);
    if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
    if (monthFilter === 'ALL') return true;
    const pPeriod = linked ? normalizePeriod(linked.period) : '';
    return pPeriod.toLowerCase() === monthFilter.toLowerCase();
  });

  const countPendente = postsInPeriod.filter(p => p.status === 'Pendente').length;
  const countProducao = postsInPeriod.filter(p => p.status === 'Em produção').length;
  const countAgendado = postsInPeriod.filter(p => p.status === 'Agendado').length;

  // Se o cliente tiver postagens publicadas órfãs (sem contrato quando não há contratos) apenas no modo ALL
  if (consideredContracts.length === 0 && monthFilter === 'ALL') {
    totalPublished = postsInPeriod.filter(p => p.status === 'Publicado').length;
  }

  const deliveredTowardContract = Math.max(0, totalContracted - remaining);
  const percentage = totalContracted > 0
    ? Math.min(100, Math.round((deliveredTowardContract / totalContracted) * 100))
    : 0;

  let overallDeliveryState = 'Em andamento';
  let overallBadgeClass = 'badge-andamento';
  let overallFillClass = 'fill-andamento';

  if (consideredContracts.length === 0) {
    overallDeliveryState = 'Sem contrato ativo';
    overallBadgeClass = 'badge-concluido';
    overallFillClass = 'fill-cancelado';
  } else if (hasOverdueContract) {
    overallDeliveryState = 'Em atraso';
    overallBadgeClass = 'badge-atraso';
    overallFillClass = 'fill-atraso';
  } else if (totalContracted > 0 && remaining === 0) {
    overallDeliveryState = 'Entregue';
    overallBadgeClass = 'badge-entregue';
    overallFillClass = 'fill-entregue';
  } else if (hasDueSoonContract) {
    overallDeliveryState = 'Prazo próximo';
    overallBadgeClass = 'badge-prazo-proximo';
    overallFillClass = 'fill-prazo-proximo';
  }

  return {
    activeContractsCount,
    consideredContractsCount: consideredContracts.length,
    contractBreakdowns,
    totalContracted,
    totalPublished,
    remaining,
    totalExcess,
    countPendente,
    countProducao,
    countAgendado,
    totalPostsInScope: postsInPeriod.length,
    percentage,
    hasOverdueContract,
    hasDueSoonContract,
    overallDeliveryState,
    overallBadgeClass,
    overallFillClass
  };
}

// ==================== VALIDAÇÕES & HELPERS DE UI ====================
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normaliza o @ do Instagram evitando duplicação como "@@cliente" ou URLs completas
 */
function formatInstagram(handle = '') {
  let clean = String(handle).trim();
  if (!clean) return '';
  clean = clean.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
  clean = clean.replace(/^@+/, '').trim();
  return clean ? `@${clean}` : '';
}

function getInstagramUrl(handle = '') {
  const formatted = formatInstagram(handle);
  if (!formatted) return '';
  return `https://www.instagram.com/${encodeURIComponent(formatted.slice(1))}/`;
}

function isValidEmail(email = '') {
  const clean = String(email).trim();
  if (!clean) return true; // Opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

function isValidPhone(phone = '') {
  const clean = String(phone).trim();
  if (!clean) return true; // Opcional
  const digits = clean.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function getWhatsAppUrl(phone = '') {
  const clean = String(phone).trim();
  if (!clean || !isValidPhone(clean)) return '';
  let digits = clean.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}`;
}

function isValidHttpUrl(urlStr = '') {
  const clean = String(urlStr).trim();
  if (!clean) return true; // Link pode ser vazio em postagens ainda não publicadas
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Renderiza avatar com fallback automático para iniciais caso a imagem falhe
 */
function renderAvatarHtml(client, extraClass = '') {
  const initials = escapeHtml(getInitials(client.name));
  if (!client.avatar) {
    return `<div class="avatar ${extraClass}">${initials}</div>`;
  }
  return `
    <div class="avatar ${extraClass}" data-initials="${initials}">
      <img src="${escapeHtml(client.avatar)}" alt="${escapeHtml(client.name)}" onerror="this.style.display='none'; this.parentElement.textContent=this.parentElement.getAttribute('data-initials');">
    </div>
  `;
}

function formatCurrency(val) {
  if (val === '' || val === null || val === undefined || isNaN(Number(val)) || Number(val) === 0) {
    return null;
  }
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(isoDate = '') {
  if (!isoDate) return 'Sem data';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getPostStatusBadgeClass(status) {
  switch (status) {
    case 'Pendente': return 'badge-pendente';
    case 'Em produção': return 'badge-producao';
    case 'Agendado': return 'badge-agendado';
    case 'Publicado': return 'badge-publicado';
    default: return 'badge-pendente';
  }
}

function getContractStatusBadgeClass(status) {
  switch (status) {
    case 'Ativo': return 'badge-ativo';
    case 'Concluído': return 'badge-concluido';
    case 'Cancelado': return 'badge-cancelado-cinza';
    default: return 'badge-concluido';
  }
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3200);
}

// ==================== NAVEGAÇÃO ENTRE VIEWS (DASHBOARD, PERFIL, CONFIGURAÇÕES) ====================
function showMainView(viewName) {
  const dashView = document.getElementById('dashboardView');
  const profView = document.getElementById('profileView');
  const setView = document.getElementById('settingsView');
  const navClients = document.getElementById('navClientsBtn');
  const navPipeline = document.getElementById('navPipelineBtn');
  const navSettings = document.getElementById('navSettingsBtn');

  dashView?.classList.add('hidden');
  profView?.classList.add('hidden');
  setView?.classList.add('hidden');

  navClients?.classList.remove('active');
  navPipeline?.classList.remove('active');
  navSettings?.classList.remove('active');

  if (viewName === 'profile') {
    profView?.classList.remove('hidden');
    navClients?.classList.add('active');
  } else if (viewName === 'settings') {
    currentClientId = null;
    setView?.classList.remove('hidden');
    navSettings?.classList.add('active');
  } else {
    currentClientId = null;
    dashView?.classList.remove('hidden');
    if (dashboardMode === 'posts') {
      navPipeline?.classList.add('active');
    } else {
      navClients?.classList.add('active');
    }
  }
}

function setDashboardMode(mode) {
  dashboardMode = mode;
  const tabClients = document.getElementById('tabViewClients');
  const tabPosts = document.getElementById('tabViewPosts');
  const clientsSubView = document.getElementById('clientsSubView');
  const globalPostsSubView = document.getElementById('globalPostsSubView');

  showMainView('dashboard');

  if (mode === 'posts') {
    tabClients?.classList.remove('active');
    tabPosts?.classList.add('active');
    clientsSubView?.classList.add('hidden');
    globalPostsSubView?.classList.remove('hidden');
  } else {
    tabClients?.classList.add('active');
    tabPosts?.classList.remove('active');
    clientsSubView?.classList.remove('hidden');
    globalPostsSubView?.classList.add('hidden');
  }
}

function syncStatusPillsUI(selectedStatus) {
  document.querySelectorAll('[data-status-pill]').forEach(btn => {
    if (btn.getAttribute('data-status-pill') === selectedStatus) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==================== RENDERIZAÇÃO: DASHBOARD CRM ====================
function renderDashboard() {
  populateContractMonthFilters();

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const monthFilter = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('globalPostStatusFilter')?.value || 'ALL';
  const includeCancelled = Boolean(document.getElementById('toggleShowCancelled')?.checked);

  syncStatusPillsUI(statusFilter);

  const statusNotice = document.getElementById('statusFilterNotice');
  if (statusNotice) {
    if (statusFilter !== 'ALL') {
      statusNotice.classList.remove('hidden');
    } else {
      statusNotice.classList.add('hidden');
    }
  }

  const clearBtn = document.getElementById('btnClearGlobalFilters');
  if (clearBtn) {
    if (searchQuery || monthFilter !== 'ALL' || statusFilter !== 'ALL') {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  let funnelCounts = {
    ALL: 0,
    Pendente: 0,
    'Em produção': 0,
    Agendado: 0,
    Publicado: 0
  };

  // 1. Filtra clientes por busca e período do contrato (base para o saldo contratual e contadores de funil)
  const clientsInPeriod = appData.clients.filter(c => {
    if (searchQuery) {
      const nameMatch = (c.name || '').toLowerCase().includes(searchQuery);
      const companyMatch = (c.company || '').toLowerCase().includes(searchQuery);
      const instaMatch = (c.instagram || '').toLowerCase().includes(searchQuery);
      if (!nameMatch && !companyMatch && !instaMatch) return false;
    }

    if (monthFilter !== 'ALL') {
      const hasContractInMonth = (c.contracts || []).some(cnt => {
        if (!includeCancelled && cnt.status === 'Cancelado') return false;
        return normalizePeriod(cnt.period).toLowerCase() === monthFilter.toLowerCase();
      });
      if (!hasContractInMonth) return false;
    }

    return true;
  });

  // Contabiliza postagens no funil para os clientes do período
  clientsInPeriod.forEach(c => {
    const clientPostsInMonth = (c.posts || []).filter(p => {
      const linked = getLinkedContractForPost(c, p);
      if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
      if (monthFilter === 'ALL') return true;
      const pPeriod = linked ? normalizePeriod(linked.period) : '';
      return pPeriod.toLowerCase() === monthFilter.toLowerCase();
    });

    clientPostsInMonth.forEach(p => {
      funnelCounts.ALL += 1;
      if (funnelCounts[p.status] !== undefined) {
        funnelCounts[p.status] += 1;
      }
    });
  });

  // 2. Filtra clientes exibidos se houver filtro de status ativo
  const filteredClients = clientsInPeriod.filter(c => {
    if (statusFilter === 'ALL') return true;
    const clientPostsInMonth = (c.posts || []).filter(p => {
      const linked = getLinkedContractForPost(c, p);
      if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
      if (monthFilter === 'ALL') return true;
      const pPeriod = linked ? normalizePeriod(linked.period) : '';
      return pPeriod.toLowerCase() === monthFilter.toLowerCase();
    });
    return clientPostsInMonth.some(p => p.status === statusFilter);
  });

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt('pillCountAll', funnelCounts.ALL);
  setTxt('pillCountPendente', funnelCounts['Pendente']);
  setTxt('pillCountProducao', funnelCounts['Em produção']);
  setTxt('pillCountAgendado', funnelCounts['Agendado']);
  setTxt('pillCountPublicado', funnelCounts['Publicado']);

  const sidebarFunnel = document.getElementById('sidebarFunnelSummary');
  if (sidebarFunnel) {
    const rows = [
      { label: 'Pendente', display: 'A produzir (Pendente)', dot: 'dot-pendente', count: funnelCounts['Pendente'] },
      { label: 'Em produção', display: 'Em produção', dot: 'dot-producao', count: funnelCounts['Em produção'] },
      { label: 'Agendado', display: 'Agendado', dot: 'dot-agendado', count: funnelCounts['Agendado'] },
      { label: 'Publicado', display: 'Publicado', dot: 'dot-publicado', count: funnelCounts['Publicado'] }
    ];
    sidebarFunnel.innerHTML = rows.map(r => `
      <div class="mini-funnel-row" onclick="applyQuickStatusFilter('${escapeHtml(r.label)}')">
        <div class="mini-funnel-left">
          <span class="pill-dot ${r.dot}"></span>
          <span>${escapeHtml(r.display)}</span>
        </div>
        <span class="mini-funnel-count">${r.count}</span>
      </div>
    `).join('');
  }

  // Calcula KPIs globais sobre os clientes filtrados
  let totalContracted = 0;
  let totalPublished = 0;
  let totalRemaining = 0;
  let totalExcess = 0;
  let totalToProduce = 0;

  filteredClients.forEach(client => {
    const m = getClientMetrics(client, monthFilter, includeCancelled);
    totalContracted += m.totalContracted;
    totalPublished += m.totalPublished;
    totalRemaining += m.remaining;
    totalExcess += m.totalExcess;
    totalToProduce += m.countPendente;
  });

  setTxt('statTotalClients', filteredClients.length);
  setTxt('statTotalContracted', totalContracted);
  setTxt('statTotalPublished', totalPublished);
  setTxt('statTotalPending', totalRemaining);
  setTxt('statToProduceSub', `A produzir (status Pendente): ${totalToProduce}`);
  setTxt('statExcessSub', totalExcess > 0 ? `+${totalExcess} excedente(s) entregue(s)` : 'Entregas concluídas');

  renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled);
  renderGlobalPostsFeed(filteredClients, monthFilter, statusFilter, includeCancelled);
}

function renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled) {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  if (filteredClients.length === 0) {
    const hasFilter = searchQuery || monthFilter !== 'ALL' || statusFilter !== 'ALL';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>${hasFilter ? 'Nenhum cliente encontrado para os filtros selecionados' : 'Nenhum cliente cadastrado ainda'}</h4>
        <p>${hasFilter ? 'Experimente limpar os filtros de Período do Contrato, Status da Postagem ou termo de busca.' : 'Comece cadastrando seu primeiro cliente no CRM de social media.'}</p>
        ${hasFilter
          ? `<button type="button" class="btn btn-secondary btn-sm" onclick="resetGlobalFilters()">Limpar filtros</button>`
          : `<button type="button" class="btn btn-primary" onclick="openClientModal()">+ Cadastrar Primeiro Cliente</button>`
        }
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredClients.map(client => {
    const m = getClientMetrics(client, monthFilter, includeCancelled);
    const avatarHtml = renderAvatarHtml(client);

    const cardStateClass = m.hasOverdueContract
      ? 'card-overdue'
      : (m.hasDueSoonContract ? 'card-due-soon' : '');

    const instaFormatted = formatInstagram(client.instagram);
    const instaUrl = getInstagramUrl(client.instagram);
    const waUrl = getWhatsAppUrl(client.phone);

    // Resumo claro de Contrato(s) separado do Nome do Cliente
    let contractBlockHtml = '';
    if (m.contractBreakdowns.length === 0) {
      contractBlockHtml = `
        <div class="contract-summary-line">
          <div class="contract-summary-period">
            <span>Sem contrato no período</span>
          </div>
          <div class="contract-summary-numbers">Crie um contrato para controlar o saldo de postagens.</div>
        </div>
      `;
    } else if (m.contractBreakdowns.length === 1) {
      const { contract, metrics: cm } = m.contractBreakdowns[0];
      contractBlockHtml = `
        <div class="contract-summary-line">
          <div class="contract-summary-period">
            <span>Contrato: ${escapeHtml(contract.period)}</span>
            ${cm.excess > 0 ? `<span class="excess-pill">+${cm.excess} excedente</span>` : ''}
          </div>
          <div class="contract-summary-numbers">
            <strong>${cm.totalContracted}</strong> contratadas | <strong>${cm.published}</strong> publicadas | <strong>${cm.remaining}</strong> restantes
          </div>
        </div>
      `;
    } else {
      const periodsLabel = m.contractBreakdowns.map(b => b.contract.period).join(', ');
      contractBlockHtml = `
        <div class="contract-summary-line">
          <div class="contract-summary-period">
            <span>Contratos (${m.contractBreakdowns.length}): ${escapeHtml(periodsLabel)}</span>
            ${m.totalExcess > 0 ? `<span class="excess-pill">+${m.totalExcess} excedente</span>` : ''}
          </div>
          <div class="contract-summary-numbers">
            <strong>${m.totalContracted}</strong> contratadas | <strong>${m.totalPublished}</strong> publicadas | <strong>${m.remaining}</strong> restantes
          </div>
        </div>
      `;
    }

    return `
      <article class="client-card ${cardStateClass}" data-client-id="${escapeHtml(client.id)}">
        <div class="client-card-top">
          <div class="client-identity">
            ${avatarHtml}
            <div class="client-title-wrap">
              <h3 class="client-name" onclick="openClientProfile('${escapeHtml(client.id)}')">${escapeHtml(client.name)}</h3>
              ${client.company ? `<p class="client-company">${escapeHtml(client.company)}</p>` : ''}
              <div class="client-links-row">
                ${instaFormatted ? `<a href="${escapeHtml(instaUrl)}" target="_blank" rel="noopener noreferrer" class="client-handle">${escapeHtml(instaFormatted)}</a>` : ''}
                ${waUrl ? `<a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="whatsapp-mini-link" title="Abrir conversa no WhatsApp">💬 WhatsApp</a>` : ''}
              </div>
            </div>
          </div>
          <span class="badge ${m.overallBadgeClass}">${escapeHtml(m.overallDeliveryState)}</span>
        </div>

        ${contractBlockHtml}

        <div class="progress-wrap">
          <div class="progress-meta">
            <span>Entregas do pacote ${m.countPendente > 0 ? `• A produzir: ${m.countPendente}` : ''}</span>
            <strong>${m.percentage}% concluído</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${m.overallFillClass}" style="width: ${m.percentage}%"></div>
          </div>
        </div>

        <div class="client-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="openQuickPostFromCard('${escapeHtml(client.id)}')">
            + Adicionar postagem
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openClientProfile('${escapeHtml(client.id)}')">
            Abrir cliente
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function renderGlobalPostsFeed(filteredClients, monthFilter, statusFilter, includeCancelled) {
  const listEl = document.getElementById('globalPostsList');
  const countLabel = document.getElementById('globalPostsCountLabel');
  if (!listEl) return;

  const allMatchingPosts = [];
  filteredClients.forEach(client => {
    (client.posts || []).forEach(post => {
      const linked = getLinkedContractForPost(client, post);
      if (!includeCancelled && linked && linked.status === 'Cancelado') return;
      const postPeriod = linked ? normalizePeriod(linked.period) : '';
      if (monthFilter !== 'ALL' && postPeriod.toLowerCase() !== monthFilter.toLowerCase()) {
        return;
      }
      if (statusFilter !== 'ALL' && post.status !== statusFilter) {
        return;
      }
      allMatchingPosts.push({ client, post, postPeriod });
    });
  });

  allMatchingPosts.sort((a, b) => (b.post.date || '').localeCompare(a.post.date || ''));

  if (countLabel) {
    countLabel.textContent = `${allMatchingPosts.length} ${allMatchingPosts.length === 1 ? 'postagem' : 'postagens'}`;
  }

  if (allMatchingPosts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <h4>Nenhuma postagem encontrada neste filtro</h4>
        <p>Altere o filtro de Status da Postagem ou Período do Contrato para visualizar outras entregas.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="resetGlobalFilters()">Limpar filtros</button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = allMatchingPosts.map(({ client, post, postPeriod }) => {
    const statusBadgeClass = getPostStatusBadgeClass(post.status);
    const instaFormatted = formatInstagram(client.instagram);
    const linkBtnHtml = post.link
      ? `<a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
           <span>Ver publicação</span>
         </a>`
      : '';

    return `
      <div class="post-item">
        <div class="post-left">
          <div class="post-badges">
            <span class="post-client-pill" onclick="openClientProfile('${escapeHtml(client.id)}')">
              👤 ${escapeHtml(client.name)} ${instaFormatted ? `(${escapeHtml(instaFormatted)})` : ''}
            </span>
            <span class="badge ${statusBadgeClass}">${escapeHtml(post.status)}</span>
            <span class="badge badge-type">${escapeHtml(post.type)}</span>
            <span class="post-date">📅 ${escapeHtml(formatDateBR(post.date))}</span>
            ${postPeriod ? `<span class="contract-month-tag">Contrato: ${escapeHtml(postPeriod)}</span>` : ''}
          </div>
          <div class="post-title">${escapeHtml(post.title)}</div>
          ${post.notes ? `<div class="post-notes">${escapeHtml(post.notes)}</div>` : ''}
        </div>
        <div class="post-right">
          ${linkBtnHtml}
          <button type="button" class="btn btn-ghost btn-sm" onclick="openClientProfile('${escapeHtml(client.id)}')">Abrir cliente</button>
        </div>
      </div>
    `;
  }).join('');
}

function applyQuickStatusFilter(status) {
  const select = document.getElementById('globalPostStatusFilter');
  if (select) {
    select.value = status;
  }
  renderDashboard();
}

function resetGlobalFilters() {
  const searchInput = document.getElementById('searchInput');
  const monthSelect = document.getElementById('globalContractMonthFilter');
  const statusSelect = document.getElementById('globalPostStatusFilter');
  if (searchInput) searchInput.value = '';
  if (monthSelect) monthSelect.value = 'ALL';
  if (statusSelect) statusSelect.value = 'ALL';
  renderDashboard();
}

// ==================== RENDERIZAÇÃO: PERFIL DO CLIENTE COMPACTO ====================
function openClientProfile(clientId) {
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;

  currentClientId = clientId;
  showMainView('profile');

  populateContractMonthFilters();
  const globalMonth = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const profileMonthSelect = document.getElementById('filterProfileContractMonth');
  if (profileMonthSelect) {
    const hasOption = Array.from(profileMonthSelect.options || []).some(o => o.value === globalMonth);
    profileMonthSelect.value = hasOption ? globalMonth : 'ALL';
  }

  const globalStatus = document.getElementById('globalPostStatusFilter')?.value || 'ALL';
  const profileStatusSelect = document.getElementById('filterPostStatus');
  if (profileStatusSelect) {
    profileStatusSelect.value = globalStatus;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderClientProfile();
}

function backToDashboard() {
  currentClientId = null;
  showMainView('dashboard');
  renderDashboard();
}

function filterProfileByContractMonth(period) {
  const profileMonthSelect = document.getElementById('filterProfileContractMonth');
  if (!profileMonthSelect) return;
  if (profileMonthSelect.value === period) {
    profileMonthSelect.value = 'ALL';
  } else {
    profileMonthSelect.value = period;
  }
  renderClientProfile();
}

function renderClientProfile() {
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) {
    backToDashboard();
    return;
  }

  populateContractMonthFilters();

  const selectedProfileMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
  const includeCancelled = Boolean(document.getElementById('toggleProfileShowCancelled')?.checked);
  const m = getClientMetrics(client, selectedProfileMonth, includeCancelled);

  const avatarHtml = renderAvatarHtml(client, 'avatar-lg');
  const instaFormatted = formatInstagram(client.instagram);
  const instaUrl = getInstagramUrl(client.instagram);
  const waUrl = getWhatsAppUrl(client.phone);

  document.getElementById('profileHeaderCard').innerHTML = `
    <div class="profile-top">
      <div class="profile-main-info">
        ${avatarHtml}
        <div class="profile-details">
          <h1>
            <span>${escapeHtml(client.name)}</span>
            <span class="badge ${m.overallBadgeClass}">${escapeHtml(m.overallDeliveryState)}</span>
          </h1>
          ${client.company ? `<p style="color: var(--text-muted); font-weight: 500; font-size: 0.88rem;">${escapeHtml(client.company)}</p>` : ''}
          <div class="profile-meta-list">
            ${instaFormatted ? `
              <span class="profile-meta-item">
                <a href="${escapeHtml(instaUrl)}" target="_blank" rel="noopener noreferrer" class="client-handle">${escapeHtml(instaFormatted)}</a>
              </span>` : ''}
            ${client.phone ? `<span class="profile-meta-item">📱 ${escapeHtml(client.phone)}</span>` : ''}
            ${waUrl ? `<span class="profile-meta-item"><a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="whatsapp-mini-link">💬 Abrir WhatsApp</a></span>` : ''}
            ${client.email ? `<span class="profile-meta-item">✉️ ${escapeHtml(client.email)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button type="button" class="btn btn-primary btn-sm" onclick="openQuickPostFromCard('${escapeHtml(client.id)}')">
          + Adicionar postagem
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openDeliveryReportModal('${escapeHtml(client.id)}')">
          📄 Relatório de entregas
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openClientModal('${escapeHtml(client.id)}')">
          Editar cliente
        </button>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteClient('${escapeHtml(client.id)}')">
          Excluir
        </button>
      </div>
    </div>
    ${client.notes ? `<div class="profile-notes"><strong>Observações internas:</strong> ${escapeHtml(client.notes)}</div>` : ''}
  `;

  document.getElementById('profileStatsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Postagens Contratadas ${selectedProfileMonth !== 'ALL' ? `(${escapeHtml(selectedProfileMonth)})` : ''}</span>
        <strong class="stat-value">${m.totalContracted}</strong>
        <span class="stat-sub">Contratos ativos: ${m.activeContractsCount}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Postagens Publicadas</span>
        <strong class="stat-value" style="color: var(--emerald-text);">${m.totalPublished}</strong>
        <span class="stat-sub">${m.totalExcess > 0 ? `+${m.totalExcess} excedente(s)` : `${m.percentage}% do pacote`}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Restantes a Entregar</span>
        <strong class="stat-value">${m.remaining}</strong>
        <span class="stat-sub">Saldo contratual</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">A Produzir (Status Pendente)</span>
        <strong class="stat-value">${m.countPendente}</strong>
        <span class="stat-sub">Em produção: ${m.countProducao} • Agendado: ${m.countAgendado}</span>
      </div>
    </div>
  `;

  renderContractsList(client, selectedProfileMonth, includeCancelled);
  renderPostsList(client, includeCancelled);
}

function toggleContractDropdown(contractId, event) {
  if (event) event.stopPropagation();
  openDropdownContractId = openDropdownContractId === contractId ? null : contractId;
  const client = appData.clients.find(c => c.id === currentClientId);
  if (client) {
    const selectedProfileMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
    const includeCancelled = Boolean(document.getElementById('toggleProfileShowCancelled')?.checked);
    renderContractsList(client, selectedProfileMonth, includeCancelled);
  }
}

function renderContractsList(client, selectedProfileMonth = 'ALL', includeCancelled = false) {
  const container = document.getElementById('contractsList');
  const allContracts = sortContractsChronologically(client.contracts || [], true);
  const contracts = allContracts.filter(c => includeCancelled || c.status !== 'Cancelado');

  if (contracts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Nenhum contrato ${!includeCancelled && allContracts.length > 0 ? 'ativo/concluído' : 'cadastrado'}</h4>
        <p>Crie um contrato com o mês/ano (ex.: Novembro/2026) e a quantidade de postagens contratadas.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openContractModal()">+ Criar Contrato</button>
      </div>
    `;
    return;
  }

  container.innerHTML = contracts.map(contract => {
    const cm = getContractMetrics(client, contract);
    const adminBadgeClass = getContractStatusBadgeClass(contract.status);
    const formattedVal = formatCurrency(contract.value);
    const isSelected = selectedProfileMonth !== 'ALL' && normalizePeriod(contract.period).toLowerCase() === selectedProfileMonth.toLowerCase();
    const isDropdownOpen = openDropdownContractId === contract.id;

    let deadlineText = '';
    if (contract.startDate || contract.endDate) {
      const startBR = contract.startDate ? formatDateBR(contract.startDate) : '...';
      const endBR = contract.endDate ? formatDateBR(contract.endDate) : '...';
      deadlineText = `Prazo: ${startBR} a ${endBR}`;
    }

    return `
      <div class="contract-row-card ${cm.isOverdue ? 'contract-overdue' : ''} ${isSelected ? 'contract-selected' : ''}">
        <div class="contract-col-main">
          <div class="contract-period-line">
            <span class="contract-period-title" onclick="filterProfileByContractMonth('${escapeHtml(normalizePeriod(contract.period))}')" title="Filtrar postagens deste período">
              📅 ${escapeHtml(contract.period)}
            </span>
            <span class="badge ${adminBadgeClass}" title="Status administrativo do contrato">${escapeHtml(contract.status)}</span>
            <span class="badge ${cm.deliveryBadgeClass}" title="Progresso das entregas">${escapeHtml(cm.deliveryState)}</span>
          </div>
          <div class="contract-meta-sub">
            ${formattedVal ? `<span><strong>${formattedVal}</strong></span>` : ''}
            ${contract.types ? `<span>• ${escapeHtml(contract.types)}</span>` : ''}
            ${deadlineText ? `<span>• ${escapeHtml(deadlineText)}</span>` : ''}
          </div>
        </div>

        <div class="contract-col-counts">
          <span><strong>${cm.totalContracted}</strong> contratadas</span>
          <span>•</span>
          <span><strong style="color: var(--emerald-text);">${cm.published}</strong> publicadas</span>
          <span>•</span>
          <span><strong>${cm.remaining}</strong> restantes</span>
          ${cm.excess > 0 ? `<span class="excess-pill">+${cm.excess} excedente</span>` : ''}
        </div>

        <div class="contract-col-progress">
          <div class="progress-meta">
            <span>Progresso</span>
            <strong>${cm.percentage}%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${cm.barFillClass}" style="width: ${cm.percentage}%"></div>
          </div>
        </div>

        <div class="contract-col-actions">
          <button type="button" class="btn btn-ghost btn-sm" onclick="filterProfileByContractMonth('${escapeHtml(normalizePeriod(contract.period))}')">
            ${isSelected ? '✓ Ver todas' : 'Ver postagens'}
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openContractModal('${escapeHtml(contract.id)}')">
            Editar
          </button>
          <div class="dropdown-wrap">
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleContractDropdown('${escapeHtml(contract.id)}', event)" aria-label="Mais opções do contrato">
              Mais ▾
            </button>
            ${isDropdownOpen ? `
              <div class="dropdown-menu">
                <button type="button" class="dropdown-item" onclick="openQuickPostFromCard('${escapeHtml(client.id)}', '${escapeHtml(contract.id)}')">
                  + Adicionar postagem neste contrato
                </button>
                <button type="button" class="dropdown-item" onclick="openDeliveryReportModal('${escapeHtml(client.id)}', '${escapeHtml(contract.id)}')">
                  📄 Relatório deste contrato
                </button>
                <button type="button" class="dropdown-item danger" onclick="confirmDeleteContract('${escapeHtml(contract.id)}')">
                  🗑️ Excluir contrato
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPostsList(client, includeCancelled = false) {
  const container = document.getElementById('postsList');
  const filterStatus = document.getElementById('filterPostStatus')?.value || 'ALL';
  const filterMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';

  const profileNotice = document.getElementById('profileStatusFilterNotice');
  if (profileNotice) {
    if (filterStatus !== 'ALL') {
      profileNotice.classList.remove('hidden');
    } else {
      profileNotice.classList.add('hidden');
    }
  }

  let posts = [...(client.posts || [])];
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  posts = posts.filter(p => {
    const linked = getLinkedContractForPost(client, p);
    if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
    if (filterMonth !== 'ALL') {
      const pPeriod = linked ? normalizePeriod(linked.period) : '';
      if (pPeriod.toLowerCase() !== filterMonth.toLowerCase()) return false;
    }
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    return true;
  });

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Nenhuma postagem encontrada</h4>
        <p>${filterStatus === 'ALL' && filterMonth === 'ALL'
          ? 'Registre as publicações entregues ou planejadas deste cliente.'
          : 'Não há postagens cadastradas que correspondam aos filtros selecionados.'}</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="openQuickPostFromCard('${escapeHtml(client.id)}')">
          + Adicionar postagem
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(post => {
    const statusBadgeClass = getPostStatusBadgeClass(post.status);
    const postPeriod = getPostContractPeriod(client, post);

    const linkBtnHtml = post.link
      ? `<a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
           <span>Ver publicação</span>
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
             <polyline points="15 3 21 3 21 9"></polyline>
             <line x1="10" y1="14" x2="21" y2="3"></line>
           </svg>
         </a>`
      : '';

    return `
      <div class="post-item">
        <div class="post-left">
          <div class="post-badges">
            <span class="badge ${statusBadgeClass}">${escapeHtml(post.status)}</span>
            <span class="badge badge-type">${escapeHtml(post.type)}</span>
            <span class="post-date">📅 ${escapeHtml(formatDateBR(post.date))}</span>
            ${postPeriod ? `<span class="contract-month-tag">Contrato: ${escapeHtml(postPeriod)}</span>` : ''}
          </div>
          <div class="post-title">${escapeHtml(post.title)}</div>
          ${post.notes ? `<div class="post-notes">${escapeHtml(post.notes)}</div>` : ''}
        </div>

        <div class="post-right">
          ${linkBtnHtml}
          <button type="button" class="btn btn-ghost btn-sm" onclick="openPostModal('${escapeHtml(post.id)}', '${escapeHtml(client.id)}')">Editar</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="confirmDeletePost('${escapeHtml(post.id)}')">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== FLUXO RÁPIDO DE POSTAGEM PELO CARD + MODAL DE POSTAGEM ====================
function setPostMoreOptionsExpanded(expanded) {
  const block = document.getElementById('postMoreOptionsBlock');
  const btn = document.getElementById('btnTogglePostMoreOptions');
  const arrow = document.getElementById('moreOptionsArrow');
  if (!block) return;

  if (expanded) {
    block.classList.remove('hidden');
    btn?.setAttribute('aria-expanded', 'true');
    if (arrow) arrow.textContent = '▾';
  } else {
    block.classList.add('hidden');
    btn?.setAttribute('aria-expanded', 'false');
    if (arrow) arrow.textContent = '▸';
  }
}

function updatePostSaveButtonText() {
  const postId = document.getElementById('postId')?.value || '';
  const status = document.getElementById('postStatus')?.value || 'Publicado';
  const btn = document.getElementById('btnSavePost');
  if (!btn) return;
  if (postId) {
    btn.textContent = 'Salvar alterações';
  } else if (status === 'Publicado') {
    btn.textContent = 'Salvar como publicada';
  } else {
    btn.textContent = `Salvar (${status})`;
  }
}

function checkDuplicatePostLink() {
  const linkVal = (document.getElementById('postLink')?.value || '').trim().toLowerCase();
  const postId = document.getElementById('postId')?.value || '';
  const targetClientId = document.getElementById('postTargetClientId')?.value || currentClientId;
  const warningEl = document.getElementById('duplicateLinkWarning');
  if (!warningEl) return false;

  if (!linkVal) {
    warningEl.classList.add('hidden');
    return false;
  }

  const client = appData.clients.find(c => c.id === targetClientId);
  if (!client) {
    warningEl.classList.add('hidden');
    return false;
  }

  const isDuplicate = (client.posts || []).some(p => {
    if (postId && p.id === postId) return false;
    return (p.link || '').trim().toLowerCase() === linkVal;
  });

  if (isDuplicate) {
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }
  return isDuplicate;
}

/**
 * Abre o formulário rápido de postagem direto de qualquer Card de Cliente (ou de dentro do Perfil)
 */
function openQuickPostFromCard(clientId, preselectedContractId = '') {
  openDropdownContractId = null;
  openPostModal(null, clientId, true, preselectedContractId);
}

function openPostModal(postId = null, targetClientId = null, isQuickFlow = false, preselectedContractId = '') {
  const resolvedClientId = targetClientId || currentClientId;
  const client = appData.clients.find(c => c.id === resolvedClientId);
  if (!client) return;

  const form = document.getElementById('postForm');
  const noContractBox = document.getElementById('postNoContractWarning');
  const errEl = document.getElementById('postFormError');
  const dupWarn = document.getElementById('duplicateLinkWarning');

  errEl?.classList.add('hidden');
  dupWarn?.classList.add('hidden');
  document.getElementById('postTargetClientId').value = client.id;
  const clientLabel = document.getElementById('postModalClientLabel');
  if (clientLabel) {
    const insta = formatInstagram(client.instagram);
    clientLabel.textContent = `Cliente: ${client.name}${insta ? ` (${insta})` : ''}`;
  }

  const sortedContracts = sortContractsChronologically(client.contracts || [], true);
  const validContracts = sortedContracts.filter(c => c.status !== 'Cancelado');
  const activeContracts = sortedContracts.filter(c => c.status === 'Ativo');

  // Se o cliente não tiver nenhum contrato cadastrado, orienta a criar um sem gerar registros automaticamente
  if (!postId && sortedContracts.length === 0) {
    form?.classList.add('hidden');
    noContractBox?.classList.remove('hidden');
    document.getElementById('postModalTitle').textContent = 'Contrato necessário';
    const btnCreate = document.getElementById('btnCreateContractFromPostModal');
    if (btnCreate) {
      btnCreate.onclick = () => {
        closeModal('postModal');
        currentClientId = client.id;
        openContractModal();
      };
    }
    openModal('postModal');
    return;
  }

  noContractBox?.classList.add('hidden');
  form?.classList.remove('hidden');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('postTargetClientId').value = client.id;

  const contractSelect = document.getElementById('postContractId');
  const contractsForSelect = validContracts.length > 0 ? validContracts : sortedContracts;

  if (activeContracts.length > 1 && !postId && !preselectedContractId) {
    contractSelect.innerHTML = `<option value="">Selecione o contrato ativo...</option>` +
      contractsForSelect.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`).join('');
  } else {
    contractSelect.innerHTML = contractsForSelect.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`).join('');
  }

  if (postId) {
    const post = (client.posts || []).find(p => p.id === postId);
    if (!post) return;
    document.getElementById('postModalTitle').textContent = 'Editar Postagem';
    document.getElementById('postId').value = post.id;
    document.getElementById('postDate').value = post.date || getLocalTodayISO();
    document.getElementById('postType').value = post.type || 'Reels';
    document.getElementById('postStatus').value = post.status || 'Publicado';
    const linked = getLinkedContractForPost(client, post);
    document.getElementById('postContractId').value = linked ? linked.id : (post.contractId || '');
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postLink').value = post.link || '';
    document.getElementById('postNotes').value = post.notes || '';
    setPostMoreOptionsExpanded(true);
  } else {
    document.getElementById('postModalTitle').textContent = isQuickFlow
      ? 'Registrar Publicação (Fluxo Rápido)'
      : 'Nova Postagem';
    document.getElementById('postId').value = '';
    document.getElementById('postDate').value = getLocalTodayISO();
    document.getElementById('postType').value = 'Reels';
    document.getElementById('postStatus').value = 'Publicado';
    document.getElementById('postTitle').value = '';
    document.getElementById('postLink').value = '';
    document.getElementById('postNotes').value = '';

    if (preselectedContractId) {
      contractSelect.value = preselectedContractId;
    } else if (activeContracts.length === 1) {
      // Seleciona automaticamente quando há somente 1 contrato ativo
      contractSelect.value = activeContracts[0].id;
    } else if (activeContracts.length > 1) {
      // Quando há vários contratos ativos, solicita a seleção
      contractSelect.value = '';
    } else if (contractsForSelect.length === 1) {
      contractSelect.value = contractsForSelect[0].id;
    }

    setPostMoreOptionsExpanded(!isQuickFlow);
  }

  updatePostSaveButtonText();
  openModal('postModal');
}

async function handlePostSubmit(e) {
  e.preventDefault();
  if (isSubmittingPost) return;

  const targetClientId = document.getElementById('postTargetClientId')?.value || currentClientId;
  const client = appData.clients.find(c => c.id === targetClientId);
  if (!client) return;

  const id = document.getElementById('postId').value;
  const date = document.getElementById('postDate').value;
  const type = document.getElementById('postType').value || 'Reels';
  const status = document.getElementById('postStatus').value || 'Publicado';
  const contractId = document.getElementById('postContractId').value;
  const title = document.getElementById('postTitle').value.trim();
  const link = document.getElementById('postLink').value.trim();
  const notes = document.getElementById('postNotes').value.trim();
  const errEl = document.getElementById('postFormError');
  const btn = document.getElementById('btnSavePost');

  errEl?.classList.add('hidden');

  if (!title) {
    if (errEl) {
      errEl.textContent = 'Informe o título ou descrição curta da postagem.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (!date) {
    if (errEl) {
      errEl.textContent = 'Informe a data da postagem.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (!contractId) {
    if (errEl) {
      errEl.textContent = 'Selecione o contrato/período desta postagem.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  // Impede vínculo de uma postagem a contrato pertencente a outro cliente
  const belongsToClient = (client.contracts || []).some(c => c.id === contractId);
  if (!belongsToClient) {
    if (errEl) {
      errEl.textContent = 'Erro de validação: O contrato selecionado não pertence a este cliente.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (link && !isValidHttpUrl(link)) {
    if (errEl) {
      errEl.textContent = 'O link da publicação deve começar com http:// ou https://.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  isSubmittingPost = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  try {
    if (supabase) {
      const payload = {
        cliente_id: client.id,
        contrato_id: contractId,
        data: date,
        tipo: type,
        titulo: title,
        link,
        status,
        observacoes: notes
      };

      if (id) {
        const { error } = await supabase.from('postagens').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('postagens').insert([payload]);
        if (error) throw error;
      }
      await fetchFromSupabase();
      showToast(id ? 'Postagem atualizada!' : (status === 'Publicado' ? 'Publicação registrada e contabilizada!' : 'Postagem salva!'));
    } else {
      if (!client.posts) client.posts = [];
      if (id) {
        const post = client.posts.find(p => p.id === id);
        if (post) {
          post.date = date;
          post.type = type;
          post.status = status;
          post.contractId = contractId;
          post.title = title;
          post.link = link;
          post.notes = notes;
        }
        showToast('Postagem atualizada!');
      } else {
        client.posts.unshift({
          id: uid('pst'),
          contractId,
          date,
          type,
          status,
          title,
          link,
          notes
        });
        showToast(status === 'Publicado' ? 'Publicação registrada e contabilizada!' : 'Postagem cadastrada!');
      }
      saveData();
    }

    closeModal('postModal');
    if (currentClientId === client.id) {
      renderClientProfile();
    } else {
      renderDashboard();
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'Não foi possível salvar a postagem: ' + (err.message || 'Erro desconhecido.');
      errEl.classList.remove('hidden');
    }
  } finally {
    isSubmittingPost = false;
    if (btn) btn.disabled = false;
    updatePostSaveButtonText();
  }
}

// ==================== RELATÓRIO DE ENTREGAS POR CONTRATO ====================
let currentReportClientId = null;

function generateDeliveryReportPlainText(client, contract) {
  const cm = getContractMetrics(client, contract);
  const insta = formatInstagram(client.instagram);

  // Apenas publicações entregues (status === 'Publicado') vinculadas a este contrato, ordenadas por data
  const deliveredPosts = (client.posts || [])
    .filter(p => {
      if (p.status !== 'Publicado') return false;
      const linked = getLinkedContractForPost(client, p);
      return linked && linked.id === contract.id;
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const lines = [
    'RELATÓRIO DE ENTREGAS',
    `Cliente: ${client.name}${insta ? ` (${insta})` : ''}`,
    `Contrato: ${contract.period}`,
    `Contratadas: ${cm.totalContracted}`,
    `Publicadas: ${cm.published}`,
    `Restantes: ${cm.remaining}`
  ];

  if (cm.excess > 0) {
    lines.push(`Excedente entregue: +${cm.excess}`);
  }

  lines.push('');

  if (deliveredPosts.length === 0) {
    lines.push('Nenhuma publicação entregue registrada neste contrato até o momento.');
  } else {
    deliveredPosts.forEach(p => {
      lines.push(`${formatDateBR(p.date)} — [${p.type}] ${p.title}`);
      if (p.link) {
        lines.push(`Link: ${p.link}`);
      }
      lines.push('');
    });
  }

  return {
    text: lines.join('\n').trim(),
    cm,
    deliveredPosts
  };
}

function openDeliveryReportModal(clientId = null, preselectedContractId = '') {
  openDropdownContractId = null;
  const resolvedId = clientId || currentClientId;
  const client = appData.clients.find(c => c.id === resolvedId);
  if (!client) return;

  currentReportClientId = client.id;
  const select = document.getElementById('reportContractSelect');
  const sortedContracts = sortContractsChronologically(client.contracts || [], true);

  if (sortedContracts.length === 0) {
    showToast('Crie um contrato para este cliente antes de gerar o relatório de entregas.');
    return;
  }

  select.innerHTML = sortedContracts.map(c =>
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`
  ).join('');

  if (preselectedContractId && sortedContracts.some(c => c.id === preselectedContractId)) {
    select.value = preselectedContractId;
  } else {
    const active = sortedContracts.find(c => c.status === 'Ativo') || sortedContracts[0];
    select.value = active.id;
  }

  renderDeliveryReportContent();
  openModal('reportModal');
}

function renderDeliveryReportContent() {
  const client = appData.clients.find(c => c.id === currentReportClientId);
  if (!client) return;

  const contractId = document.getElementById('reportContractSelect')?.value;
  const contract = (client.contracts || []).find(c => c.id === contractId) || client.contracts?.[0];
  const area = document.getElementById('printableReportArea');
  if (!contract || !area) return;

  const { cm, deliveredPosts } = generateDeliveryReportPlainText(client, contract);
  const insta = formatInstagram(client.instagram);

  // Não exibe observações internas, telefone, e-mail ou valores financeiros!
  area.innerHTML = `
    <div class="report-doc-header">
      <div class="report-doc-tag">RELATÓRIO DE ENTREGAS</div>
      <div class="report-doc-title">${escapeHtml(client.name)}</div>
      ${insta ? `<div class="report-doc-handle">${escapeHtml(insta)}</div>` : ''}
    </div>

    <div class="report-summary-grid">
      <div class="report-stat-box">
        <span class="report-stat-label">Contrato / Período</span>
        <strong class="report-stat-val">${escapeHtml(contract.period)}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Contratadas</span>
        <strong class="report-stat-val">${cm.totalContracted}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Publicadas</span>
        <strong class="report-stat-val" style="color: #15803d;">${cm.published}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Restantes</span>
        <strong class="report-stat-val">${cm.remaining}</strong>
      </div>
      ${cm.excess > 0 ? `
        <div class="report-stat-box">
          <span class="report-stat-label">Excedente</span>
          <strong class="report-stat-val" style="color: #15803d;">+${cm.excess}</strong>
        </div>
      ` : ''}
    </div>

    <h4 style="font-size: 0.9rem; margin-bottom: 0.65rem; color: #334155;">
      Publicações Entregues (${deliveredPosts.length})
    </h4>

    ${deliveredPosts.length === 0
      ? `<p style="font-size: 0.85rem; color: #64748b;">Nenhuma publicação concluída neste contrato até o momento.</p>`
      : `<div class="report-deliveries-list">
          ${deliveredPosts.map(p => `
            <div class="report-delivery-item">
              <div class="report-delivery-main">
                ${escapeHtml(formatDateBR(p.date))} — <span style="color: #475569;">[${escapeHtml(p.type)}]</span> ${escapeHtml(p.title)}
              </div>
              ${p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer" class="report-delivery-link">Link: ${escapeHtml(p.link)}</a>` : ''}
            </div>
          `).join('')}
        </div>`
    }
  `;
}

async function copyDeliveryReportToClipboard() {
  const client = appData.clients.find(c => c.id === currentReportClientId);
  if (!client) return;
  const contractId = document.getElementById('reportContractSelect')?.value;
  const contract = (client.contracts || []).find(c => c.id === contractId);
  if (!contract) return;

  const { text } = generateDeliveryReportPlainText(client, contract);

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showToast('Resumo copiado para a área de transferência!');
  } catch (_) {
    showToast('Não foi possível copiar automaticamente.');
  }
}

// ==================== MODAIS DE CLIENTE E CONTRATO ====================
function openModal(modalId) {
  document.getElementById(modalId)?.classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
}

function openClientModal(clientId = null) {
  const form = document.getElementById('clientForm');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('clientFormError')?.classList.add('hidden');
  uploadedAvatarBase64 = '';

  if (clientId) {
    const client = appData.clients.find(c => c.id === clientId);
    if (!client) return;
    document.getElementById('clientModalTitle').textContent = 'Editar Cliente';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientCompany').value = client.company || '';
    document.getElementById('clientInstagram').value = client.instagram || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientAvatar').value = client.avatar && !client.avatar.startsWith('data:') ? client.avatar : '';
    uploadedAvatarBase64 = client.avatar && client.avatar.startsWith('data:') ? client.avatar : '';
    document.getElementById('clientNotes').value = client.notes || '';
  } else {
    document.getElementById('clientModalTitle').textContent = 'Novo Cliente';
    document.getElementById('clientId').value = '';
  }

  openModal('clientModal');
}

async function handleClientSubmit(e) {
  e.preventDefault();
  if (isSubmittingClient) return;

  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const company = document.getElementById('clientCompany').value.trim();
  const instagram = formatInstagram(document.getElementById('clientInstagram').value);
  const phone = document.getElementById('clientPhone').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const avatarUrl = document.getElementById('clientAvatar').value.trim();
  const notes = document.getElementById('clientNotes').value.trim();
  const errEl = document.getElementById('clientFormError');
  const btn = document.getElementById('btnSaveClient');

  errEl?.classList.add('hidden');

  if (!name) {
    if (errEl) {
      errEl.textContent = 'O nome do cliente é obrigatório.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (email && !isValidEmail(email)) {
    if (errEl) {
      errEl.textContent = 'Informe um endereço de e-mail válido.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (phone && !isValidPhone(phone)) {
    if (errEl) {
      errEl.textContent = 'Informe um telefone/WhatsApp válido com DDD (10 a 15 dígitos).';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
    if (errEl) {
      errEl.textContent = 'A URL da foto/logo deve começar com http:// ou https://.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  const finalAvatar = uploadedAvatarBase64 || avatarUrl || '';

  isSubmittingClient = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  try {
    if (supabase) {
      const payload = {
        nome: name,
        empresa: company,
        instagram,
        telefone: phone,
        email,
        foto_url: finalAvatar,
        observacoes: notes
      };

      if (id) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert([payload]);
        if (error) throw error;
      }
      await fetchFromSupabase();
      showToast(id ? 'Dados do cliente atualizados!' : 'Novo cliente cadastrado com sucesso!');
    } else {
      if (id) {
        const client = appData.clients.find(c => c.id === id);
        if (client) {
          client.name = name;
          client.company = company;
          client.instagram = instagram;
          client.phone = phone;
          client.email = email;
          client.avatar = finalAvatar;
          client.notes = notes;
        }
        showToast('Dados do cliente atualizados!');
      } else {
        const newClient = {
          id: uid('cli'),
          name,
          company,
          instagram,
          phone,
          email,
          avatar: finalAvatar,
          notes,
          contracts: [],
          posts: []
        };
        appData.clients.unshift(newClient);
        showToast('Novo cliente cadastrado com sucesso!');
      }
      saveData();
    }

    closeModal('clientModal');
    if (currentClientId) {
      renderClientProfile();
    } else {
      renderDashboard();
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'Erro ao salvar cliente: ' + (err.message || 'Verifique sua conexão.');
      errEl.classList.remove('hidden');
    }
  } finally {
    isSubmittingClient = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Salvar Cliente';
    }
  }
}

function confirmDeleteClient(clientId) {
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;

  openConfirmModal(
    'Excluir Cliente',
    `Tem certeza que deseja excluir o cliente "${client.name}" e todas as suas postagens e contratos? Essa ação não pode ser desfeita.`,
    async () => {
      if (supabase) {
        const { error } = await supabase.from('clientes').delete().eq('id', clientId);
        if (error) {
          showToast('Erro ao excluir cliente: ' + error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        appData.clients = appData.clients.filter(c => c.id !== clientId);
        saveData();
      }
      showToast('Cliente excluído.');
      backToDashboard();
    }
  );
}

// --- Modal Contrato ---
function openContractModal(contractId = null) {
  openDropdownContractId = null;
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const form = document.getElementById('contractForm');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('contractFormError')?.classList.add('hidden');

  if (contractId) {
    const contract = (client.contracts || []).find(c => c.id === contractId);
    if (!contract) return;
    document.getElementById('contractModalTitle').textContent = 'Editar Contrato';
    document.getElementById('contractId').value = contract.id;
    document.getElementById('contractPeriod').value = contract.period || '';
    document.getElementById('contractTotalPosts').value = contract.totalPosts || '';
    document.getElementById('contractStartDate').value = contract.startDate || '';
    document.getElementById('contractEndDate').value = contract.endDate || '';
    document.getElementById('contractTypes').value = contract.types || '';
    document.getElementById('contractValue').value = contract.value || '';
    document.getElementById('contractStatus').value = contract.status || 'Ativo';
  } else {
    document.getElementById('contractModalTitle').textContent = 'Novo Contrato de Postagens';
    document.getElementById('contractId').value = '';
    document.getElementById('contractStartDate').value = '';
    document.getElementById('contractEndDate').value = '';
    document.getElementById('contractStatus').value = 'Ativo';
  }

  openModal('contractModal');
}

async function handleContractSubmit(e) {
  e.preventDefault();
  if (isSubmittingContract) return;

  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const id = document.getElementById('contractId').value;
  const period = document.getElementById('contractPeriod').value.trim();
  const totalPosts = Number(document.getElementById('contractTotalPosts').value) || 0;
  const startDate = document.getElementById('contractStartDate')?.value || '';
  const endDate = document.getElementById('contractEndDate')?.value || '';
  const types = document.getElementById('contractTypes').value.trim();
  const valueRaw = document.getElementById('contractValue').value;
  const value = valueRaw !== '' ? Number(valueRaw) : null;
  const status = document.getElementById('contractStatus').value;
  const errEl = document.getElementById('contractFormError');
  const btn = document.getElementById('btnSaveContract');

  errEl?.classList.add('hidden');

  if (!period) {
    if (errEl) {
      errEl.textContent = 'Informe o mês e ano ou período do contrato (ex.: Novembro/2026).';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (totalPosts <= 0) {
    if (errEl) {
      errEl.textContent = 'A quantidade de postagens contratadas deve ser maior que zero.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (startDate && endDate && endDate < startDate) {
    if (errEl) {
      errEl.textContent = 'A data de término não pode ser anterior à data de início.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  isSubmittingContract = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  try {
    if (supabase) {
      const fullPayload = {
        cliente_id: client.id,
        periodo: period,
        total_postagens: totalPosts,
        tipos: types,
        valor: value,
        status,
        data_inicio: startDate || null,
        data_fim: endDate || null
      };

      const basePayload = {
        cliente_id: client.id,
        periodo: period,
        total_postagens: totalPosts,
        tipos: types,
        valor: value,
        status
      };

      let opError = null;
      if (id) {
        const res = await supabase.from('contratos').update(fullPayload).eq('id', id);
        if (res.error && String(res.error.message || '').includes('data_')) {
          const fallback = await supabase.from('contratos').update(basePayload).eq('id', id);
          opError = fallback.error;
        } else {
          opError = res.error;
        }
      } else {
        const res = await supabase.from('contratos').insert([fullPayload]);
        if (res.error && String(res.error.message || '').includes('data_')) {
          const fallback = await supabase.from('contratos').insert([basePayload]);
          opError = fallback.error;
        } else {
          opError = res.error;
        }
      }

      if (opError) throw opError;
      await fetchFromSupabase();
      showToast(id ? 'Contrato atualizado!' : 'Contrato salvo com sucesso!');
    } else {
      if (!client.contracts) client.contracts = [];
      if (id) {
        const contract = client.contracts.find(c => c.id === id);
        if (contract) {
          contract.period = period;
          contract.totalPosts = totalPosts;
          contract.startDate = startDate;
          contract.endDate = endDate;
          contract.types = types;
          contract.value = value !== null ? value : '';
          contract.status = status;
        }
        showToast('Contrato atualizado!');
      } else {
        client.contracts.push({
          id: uid('cnt'),
          period,
          totalPosts,
          startDate,
          endDate,
          types,
          value: value !== null ? value : '',
          status
        });
        showToast('Contrato adicionado ao cliente!');
      }
      client.contracts = sortContractsChronologically(client.contracts, true);
      saveData();
    }

    closeModal('contractModal');
    renderClientProfile();
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'Erro ao salvar contrato: ' + (err.message || '');
      errEl.classList.remove('hidden');
    }
  } finally {
    isSubmittingContract = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Salvar Contrato';
    }
  }
}

function confirmDeleteContract(contractId) {
  openDropdownContractId = null;
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;
  const contract = (client.contracts || []).find(c => c.id === contractId);
  if (!contract) return;

  openConfirmModal(
    'Excluir Contrato',
    `Deseja excluir o contrato "${contract.period}"? As postagens registradas serão mantidas no histórico do cliente.`,
    async () => {
      if (supabase) {
        const { error } = await supabase.from('contratos').delete().eq('id', contractId);
        if (error) {
          showToast('Erro ao excluir contrato: ' + error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        client.contracts = client.contracts.filter(c => c.id !== contractId);
        saveData();
      }
      showToast('Contrato removido.');
      renderClientProfile();
    }
  );
}

function confirmDeletePost(postId) {
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;
  const post = (client.posts || []).find(p => p.id === postId);
  if (!post) return;

  openConfirmModal(
    'Excluir Postagem',
    `Deseja excluir a postagem "${post.title}"? O saldo contratual e os indicadores serão recalculados imediatamente.`,
    async () => {
      if (supabase) {
        const { error } = await supabase.from('postagens').delete().eq('id', postId);
        if (error) {
          showToast('Erro ao excluir postagem: ' + error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        client.posts = client.posts.filter(p => p.id !== postId);
        saveData();
      }
      showToast('Postagem excluída.');
      renderClientProfile();
    }
  );
}

// ==================== CONFIGURAÇÕES → DADOS & CONFIRMAÇÃO REFORÇADA ====================
function openConfirmModal(title, message, onConfirm, requiredWord = null) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  pendingConfirmCallback = onConfirm;
  pendingConfirmRequiredWord = requiredWord;

  const hardBlock = document.getElementById('confirmHardBlock');
  const hardInput = document.getElementById('confirmHardInput');
  const hardLabel = document.getElementById('confirmHardLabel');

  if (requiredWord) {
    hardBlock?.classList.remove('hidden');
    if (hardLabel) hardLabel.textContent = `Para confirmar, digite exatamente ${requiredWord} abaixo:`;
    if (hardInput) {
      hardInput.value = '';
      hardInput.placeholder = requiredWord;
    }
  } else {
    hardBlock?.classList.add('hidden');
    if (hardInput) hardInput.value = '';
  }

  openModal('confirmModal');
}

function exportUserDataJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'SocialFlow CRM',
    clients: appData.clients || []
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `socialflow-backup-${getLocalTodayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup JSON exportado com sucesso!');
}

// Expõe funções chamadas via onclick no HTML
if (typeof window !== 'undefined') {
  Object.assign(window, {
    openClientProfile,
    openClientModal,
    confirmDeleteClient,
    openContractModal,
    confirmDeleteContract,
    openPostModal,
    openQuickPostFromCard,
    confirmDeletePost,
    applyQuickStatusFilter,
    resetGlobalFilters,
    filterProfileByContractMonth,
    openDeliveryReportModal,
    toggleContractDropdown
  });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
  initBackendAndAuth();

  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Fechar dropdown de contrato ao clicar fora
  document.addEventListener('click', () => {
    if (openDropdownContractId) {
      openDropdownContractId = null;
      const client = appData.clients.find(c => c.id === currentClientId);
      if (client) {
        const selectedProfileMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
        const includeCancelled = Boolean(document.getElementById('toggleProfileShowCancelled')?.checked);
        renderContractsList(client, selectedProfileMonth, includeCancelled);
      }
    }
  });

  // Fechar modais com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
    }
  });

  document.getElementById('brandLogo')?.addEventListener('click', () => {
    setDashboardMode('clients');
    backToDashboard();
  });
  document.getElementById('btnBackToDashboard')?.addEventListener('click', backToDashboard);

  document.getElementById('navClientsBtn')?.addEventListener('click', () => {
    setDashboardMode('clients');
    backToDashboard();
  });
  document.getElementById('navPipelineBtn')?.addEventListener('click', () => {
    setDashboardMode('posts');
    backToDashboard();
  });
  document.getElementById('navSettingsBtn')?.addEventListener('click', () => {
    showMainView('settings');
  });

  document.getElementById('tabViewClients')?.addEventListener('click', () => setDashboardMode('clients'));
  document.getElementById('tabViewPosts')?.addEventListener('click', () => setDashboardMode('posts'));

  document.getElementById('btnNewClientHeader')?.addEventListener('click', () => openClientModal());
  document.getElementById('btnNewContract')?.addEventListener('click', () => openContractModal());
  document.getElementById('btnNewPost')?.addEventListener('click', () => openPostModal(null, currentClientId, false));
  document.getElementById('btnQuickPostProfile')?.addEventListener('click', () => openQuickPostFromCard(currentClientId));
  document.getElementById('btnOpenDeliveryReport')?.addEventListener('click', () => openDeliveryReportModal(currentClientId));

  // Toggle "Mais opções" no modal de postagem
  document.getElementById('btnTogglePostMoreOptions')?.addEventListener('click', () => {
    const block = document.getElementById('postMoreOptionsBlock');
    const isHidden = block?.classList.contains('hidden');
    setPostMoreOptionsExpanded(Boolean(isHidden));
  });

  document.getElementById('postStatus')?.addEventListener('change', updatePostSaveButtonText);
  document.getElementById('postLink')?.addEventListener('input', checkDuplicatePostLink);

  // Relatório de entregas
  document.getElementById('reportContractSelect')?.addEventListener('change', renderDeliveryReportContent);
  document.getElementById('btnCopyReportText')?.addEventListener('click', copyDeliveryReportToClipboard);
  document.getElementById('btnPrintReport')?.addEventListener('click', () => window.print());

  // Busca e Filtros
  document.getElementById('searchInput')?.addEventListener('input', () => {
    if (currentClientId) backToDashboard();
    else renderDashboard();
  });

  document.getElementById('toggleShowCancelled')?.addEventListener('change', renderDashboard);
  document.getElementById('toggleProfileShowCancelled')?.addEventListener('change', renderClientProfile);

  document.getElementById('globalContractMonthFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (currentClientId) {
      const profileMonth = document.getElementById('filterProfileContractMonth');
      if (profileMonth) profileMonth.value = val;
      renderClientProfile();
    } else {
      renderDashboard();
    }
  });

  document.getElementById('globalPostStatusFilter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (currentClientId) {
      const profileStatus = document.getElementById('filterPostStatus');
      if (profileStatus) profileStatus.value = val;
      renderClientProfile();
    } else {
      renderDashboard();
    }
  });

  document.getElementById('btnClearGlobalFilters')?.addEventListener('click', resetGlobalFilters);

  document.querySelectorAll('[data-status-pill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-status-pill');
      applyQuickStatusFilter(status);
    });
  });

  document.getElementById('filterPostStatus')?.addEventListener('change', () => {
    const client = appData.clients.find(c => c.id === currentClientId);
    const includeCancelled = Boolean(document.getElementById('toggleProfileShowCancelled')?.checked);
    if (client) renderPostsList(client, includeCancelled);
  });

  document.getElementById('filterProfileContractMonth')?.addEventListener('change', renderClientProfile);

  document.getElementById('clientAvatarFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedAvatarBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('clientForm')?.addEventListener('submit', handleClientSubmit);
  document.getElementById('contractForm')?.addEventListener('submit', handleContractSubmit);
  document.getElementById('postForm')?.addEventListener('submit', handlePostSubmit);

  // Confirmação (simples ou reforçada)
  document.getElementById('btnConfirmAction')?.addEventListener('click', async () => {
    if (pendingConfirmRequiredWord) {
      const typed = (document.getElementById('confirmHardInput')?.value || '').trim().toUpperCase();
      if (typed !== pendingConfirmRequiredWord.toUpperCase()) {
        showToast(`Digite "${pendingConfirmRequiredWord}" para confirmar a operação.`);
        return;
      }
    }
    if (typeof pendingConfirmCallback === 'function') {
      await pendingConfirmCallback();
    }
    pendingConfirmCallback = null;
    pendingConfirmRequiredWord = null;
    closeModal('confirmModal');
  });

  // Configurações -> Dados
  document.getElementById('btnExportDataJson')?.addEventListener('click', exportUserDataJson);

  document.getElementById('btnClearData')?.addEventListener('click', () => {
    openConfirmModal(
      'Exclusão em Massa — Confirmação Reforçada',
      'Esta ação apagará TODOS os clientes, contratos e postagens atualmente salvos. Recomendamos exportar um backup JSON antes de continuar.',
      async () => {
        if (supabase) {
          const { error } = await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) {
            showToast('Erro ao limpar dados: ' + error.message);
            return;
          }
          await fetchFromSupabase();
        } else {
          appData = { clients: [] };
          saveData();
        }
        resetGlobalFilters();
        backToDashboard();
        showToast('Todos os dados foram removidos.');
      },
      'EXCLUIR'
    );
  });

  document.getElementById('btnResetDemo')?.addEventListener('click', () => {
    if (supabase) {
      showToast('No modo conectado ao Supabase, os exemplos locais estão desativados para proteger seus dados reais.');
      return;
    }
    openConfirmModal(
      'Restaurar Exemplos de Demonstração',
      'Isso irá adicionar/restaurar os 3 clientes fictícios de demonstração no armazenamento local, preservando seus clientes reais cadastrados.',
      async () => {
        // Preserva registros reais (que não são sample_cli_*) e atualiza/adiciona apenas os exemplos
        const realClients = (appData.clients || []).filter(c => !c.isSample && !String(c.id).startsWith('sample_cli_'));
        const sampleCopy = JSON.parse(JSON.stringify(SAMPLE_DATA.clients));
        appData.clients = [...realClients, ...sampleCopy];
        saveData();
        resetGlobalFilters();
        backToDashboard();
        showToast('Exemplos restaurados sem afetar seus clientes reais!');
      }
    );
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.getAttribute('data-close-modal'));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add('hidden');
      }
    });
  });
});
