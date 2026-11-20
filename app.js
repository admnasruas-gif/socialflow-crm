/**
 * SocialFlow CRM — Gerenciador de Clientes de Social Media
 * Redesign Mobile-First & App Experience (v3):
 * - Navegação inferior no celular (Clientes, Postagens, Ajustes) e Sidebar compacta no desktop
 * - Cabeçalhos limpos (Título + Ação principal) e resumo compacto em 3 indicadores (Contratadas, Publicadas, Restantes)
 * - Painel inferior (Bottom Sheet) de filtros com contador de filtros ativos
 * - Cards de clientes limpos com linha de contrato ("Contrato: Nov/2026 • 2 de 8 publicadas • 6 restantes"), barra de progresso e ações rápidas (+ Postagem | Ver cliente)
 * - Perfil do cliente compacto com seletor rápido de contrato, histórico logo abaixo do resumo, detalhes secundários expansíveis e menus de 3 pontos (⋮)
 * - Preserva 100% dos dados, autenticação, Supabase, regras de cálculo de saldo sem compensação cruzada e relatórios
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
let openKebabMenuId = null;
let lastFocusedTriggerEl = null;

// ==================== DATA LOCAL (SEM DESVIO UTC) ====================
function getLocalTodayISO(refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const parts = isoStr.trim().split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

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

function parsePeriodSortKey(periodStr = '') {
  const clean = normalizePeriod(periodStr)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!clean) return 0;

  const isoMatch = clean.match(/^(\d{4})[\s\/\-](\d{1,2})$/);
  if (isoMatch) {
    return Number(isoMatch[1]) * 100 + Number(isoMatch[2]);
  }

  const brNumMatch = clean.match(/^(\d{1,2})[\s\/\-](\d{4})$/);
  if (brNumMatch) {
    return Number(brNumMatch[2]) * 100 + Number(brNumMatch[1]);
  }

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

const PT_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Calcula automaticamente o próximo mês/ano a partir de um período atual (ex: "Novembro/2026" -> "Dezembro/2026", "Dezembro/2026" -> "Janeiro/2027")
 * e retorna também as datas de início e fim do novo mês caso o contrato anterior usasse datas.
 */
function computeNextContractPeriod(currentPeriodStr = '', prevStartDate = '', prevEndDate = '') {
  const key = parsePeriodSortKey(currentPeriodStr);
  let nextYear;
  let nextMonth; // 1..12

  if (key > 0) {
    const year = Math.floor(key / 100);
    const month = key % 100;
    if (month >= 1 && month <= 11) {
      nextMonth = month + 1;
      nextYear = year;
    } else if (month === 12) {
      nextMonth = 1;
      nextYear = year + 1;
    }
  }

  if (!nextYear || !nextMonth) {
    const now = new Date();
    const m = now.getMonth() + 1; // 1..12
    if (m === 12) {
      nextMonth = 1;
      nextYear = now.getFullYear() + 1;
    } else {
      nextMonth = m + 1;
      nextYear = now.getFullYear();
    }
  }

  const nextPeriodLabel = `${PT_MONTH_NAMES[nextMonth - 1]}/${nextYear}`;
  let nextStartDate = '';
  let nextEndDate = '';

  if (prevStartDate || prevEndDate) {
    const mm = String(nextMonth).padStart(2, '0');
    const lastDay = new Date(nextYear, nextMonth, 0).getDate();
    nextStartDate = `${nextYear}-${mm}-01`;
    nextEndDate = `${nextYear}-${mm}-${String(lastDay).padStart(2, '0')}`;
  }

  return {
    period: nextPeriodLabel,
    startDate: nextStartDate,
    endDate: nextEndDate
  };
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
  const demoRow = document.getElementById('demoDataSettingsRow');

  if (isOnline) {
    dot?.classList.add('online');
    if (txt) txt.textContent = 'Supabase conectado';
    if (userEmail) {
      userInfo?.classList.remove('hidden');
      if (userEmailEl) userEmailEl.textContent = userEmail;
    }
    demoRow?.classList.add('hidden');
  } else {
    dot?.classList.remove('online');
    if (txt) txt.textContent = 'Modo local';
    userInfo?.classList.add('hidden');
    demoRow?.classList.remove('hidden');
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
    btn.textContent = 'Entrando...';
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }

  if (error) {
    if (errEl) {
      errEl.textContent = 'E-mail ou senha inválidos.';
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

function getLinkedContractForPost(client, post) {
  const contracts = client.contracts || [];
  if (post.contractId) {
    const found = contracts.find(c => c.id === post.contractId);
    return found || null;
  }
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
  const months = getAllContractMonths();
  const optionsHtml = `<option value="ALL">Todos os períodos</option>` +
    months.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

  const globalSelect = document.getElementById('globalContractMonthFilter');
  const sheetSelect = document.getElementById('sheetContractMonthFilter');

  const currentVal = globalSelect?.value || sheetSelect?.value || 'ALL';
  const validVal = months.includes(currentVal) ? currentVal : 'ALL';

  if (globalSelect) {
    globalSelect.innerHTML = optionsHtml;
    globalSelect.value = validVal;
  }
  if (sheetSelect) {
    sheetSelect.innerHTML = optionsHtml;
    sheetSelect.value = validVal;
  }

  // Popula filtro de clientes no Bottom Sheet (para a tela de Postagens)
  const clientFilterSelect = document.getElementById('globalClientFilter');
  if (clientFilterSelect) {
    const prevCli = clientFilterSelect.value || 'ALL';
    clientFilterSelect.innerHTML = `<option value="ALL">Todos os clientes</option>` +
      appData.clients.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    if (appData.clients.some(c => c.id === prevCli)) {
      clientFilterSelect.value = prevCli;
    } else {
      clientFilterSelect.value = 'ALL';
    }
  }

  if (currentClientId) {
    const client = appData.clients.find(c => c.id === currentClientId);
    const profileSelect = document.getElementById('filterProfileContractMonth');
    if (client && profileSelect) {
      const prevProfileVal = profileSelect.value || 'ALL';
      const sortedContracts = sortContractsChronologically(client.contracts || [], true);
      const clientMonths = Array.from(new Set(sortedContracts.map(c => normalizePeriod(c.period)).filter(Boolean)));
      profileSelect.innerHTML = `<option value="ALL">Todos os contratos (${clientMonths.length})</option>` +
        clientMonths.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

      if (clientMonths.includes(prevProfileVal)) {
        profileSelect.value = prevProfileVal;
      } else if (clientMonths.length === 1) {
        profileSelect.value = clientMonths[0];
      } else {
        profileSelect.value = 'ALL';
      }
    }
  }
}

// ==================== CÁLCULOS DE MÉTRICAS E PROGRESSO ====================
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
      deliveryState = `Prazo próximo (${daysRemaining === 0 ? 'hoje' : `${daysRemaining}d`})`;
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
      remaining += cm.remaining;
      totalExcess += cm.excess;
      if (cm.isOverdue) hasOverdueContract = true;
      if (cm.isDueSoon) hasDueSoonContract = true;
    }
    return { contract: cnt, metrics: cm };
  });

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
    overallDeliveryState = 'Sem contrato';
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
  if (!clean) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
}

function isValidPhone(phone = '') {
  const clean = String(phone).trim();
  if (!clean) return true;
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
  if (!clean) return true;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

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

// ==================== NAVEGAÇÃO MOBILE (BOTTOM NAV) & DESKTOP (SIDEBAR) ====================
function updateNavActiveState(activeSection) {
  const navMap = {
    clients: ['navClientsBtn', 'mobileNavClients'],
    posts: ['navPipelineBtn', 'mobileNavPosts'],
    settings: ['navSettingsBtn', 'mobileNavSettings']
  };

  Object.entries(navMap).forEach(([key, ids]) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (key === activeSection) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  });
}

function showMainView(viewName) {
  const dashView = document.getElementById('dashboardView');
  const postsView = document.getElementById('globalPostsSubView');
  const profView = document.getElementById('profileView');
  const setView = document.getElementById('settingsView');

  dashView?.classList.add('hidden');
  postsView?.classList.add('hidden');
  profView?.classList.add('hidden');
  setView?.classList.add('hidden');

  if (viewName === 'profile') {
    profView?.classList.remove('hidden');
    updateNavActiveState('clients');
  } else if (viewName === 'settings') {
    currentClientId = null;
    setView?.classList.remove('hidden');
    updateNavActiveState('settings');
  } else if (viewName === 'posts') {
    currentClientId = null;
    dashboardMode = 'posts';
    postsView?.classList.remove('hidden');
    updateNavActiveState('posts');
  } else {
    currentClientId = null;
    dashboardMode = 'clients';
    dashView?.classList.remove('hidden');
    updateNavActiveState('clients');
  }
}

function setDashboardMode(mode) {
  if (mode === 'posts') {
    showMainView('posts');
  } else {
    showMainView('clients');
  }
  renderDashboard();
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

// ==================== MENU DE TRÊS PONTOS (KEBAB MENU) ====================
function toggleKebabMenu(menuId, event) {
  if (event) event.stopPropagation();
  const prev = openKebabMenuId;
  closeAllKebabMenus();
  if (prev !== menuId) {
    const el = document.getElementById(menuId);
    if (el) {
      el.classList.remove('hidden');
      openKebabMenuId = menuId;
    }
  }
}

function closeAllKebabMenus() {
  openKebabMenuId = null;
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
}

// ==================== RENDERIZAÇÃO: TELA DE CLIENTES E TELA DE POSTAGENS ====================
function renderDashboard() {
  populateContractMonthFilters();

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const postsSearchQuery = (document.getElementById('postsSearchInput')?.value || '').trim().toLowerCase();
  const monthFilter = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('globalPostStatusFilter')?.value || 'ALL';
  const clientFilter = document.getElementById('globalClientFilter')?.value || 'ALL';
  const includeCancelled = Boolean(document.getElementById('toggleShowCancelled')?.checked);

  syncStatusPillsUI(statusFilter);

  const periodDisplayLabel = document.getElementById('globalPeriodDisplayLabel');
  if (periodDisplayLabel) {
    periodDisplayLabel.textContent = monthFilter === 'ALL' ? 'Todos os períodos' : monthFilter;
  }

  // Calcula quantidade de filtros extras ativos para o badge do botão "Filtros"
  let activeFilterCount = 0;
  if (monthFilter !== 'ALL') activeFilterCount++;
  if (statusFilter !== 'ALL') activeFilterCount++;
  if (includeCancelled) activeFilterCount++;

  const activePostsFilterCount = activeFilterCount + (clientFilter !== 'ALL' ? 1 : 0);

  const badgeClients = document.getElementById('activeFiltersBadge');
  if (badgeClients) {
    badgeClients.textContent = activeFilterCount;
    badgeClients.classList.toggle('hidden', activeFilterCount === 0);
  }

  const badgePosts = document.getElementById('activePostsFiltersBadge');
  if (badgePosts) {
    badgePosts.textContent = activePostsFilterCount;
    badgePosts.classList.toggle('hidden', activePostsFilterCount === 0);
  }

  const statusNotice = document.getElementById('statusFilterNotice');
  if (statusNotice) {
    statusNotice.classList.toggle('hidden', statusFilter === 'ALL');
  }

  const clearBtn = document.getElementById('btnClearGlobalFilters');
  if (clearBtn) {
    clearBtn.classList.toggle('hidden', !(searchQuery || activeFilterCount > 0));
  }

  const clearPostsBtn = document.getElementById('btnClearPostsFilters');
  if (clearPostsBtn) {
    clearPostsBtn.classList.toggle('hidden', !(postsSearchQuery || activePostsFilterCount > 0));
  }

  let funnelCounts = {
    ALL: 0,
    Pendente: 0,
    'Em produção': 0,
    Agendado: 0,
    Publicado: 0
  };

  // 1. Filtra clientes por busca e período do contrato
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
    if (clientFilter !== 'ALL' && c.id !== clientFilter) return;
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
      { label: 'Publicado', display: 'Publicadas', dot: 'dot-publicado', count: funnelCounts['Publicado'] },
      { label: 'Agendado', display: 'Agendadas', dot: 'dot-agendado', count: funnelCounts['Agendado'] },
      { label: 'Em produção', display: 'Em produção', dot: 'dot-producao', count: funnelCounts['Em produção'] },
      { label: 'Pendente', display: 'Pendentes', dot: 'dot-pendente', count: funnelCounts['Pendente'] }
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

  // Calcula os 3 indicadores compactos (Contratadas, Publicadas, Restantes) respeitando o período selecionado
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
  setTxt('statClientsWord', filteredClients.length === 1 ? 'cliente' : 'clientes');
  setTxt('statTotalContracted', totalContracted);
  setTxt('statTotalPublished', totalPublished);
  setTxt('statTotalPending', totalRemaining);
  setTxt('statToProduceSub', `A produzir (status Pendente): ${totalToProduce}`);
  setTxt('statExcessSub', totalExcess > 0 ? `+${totalExcess} excedente(s)` : '');

  renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled);
  renderGlobalPostsFeed(monthFilter, statusFilter, clientFilter, postsSearchQuery || searchQuery, includeCancelled);
}

function renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled) {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  if (filteredClients.length === 0) {
    const hasFilter = searchQuery || monthFilter !== 'ALL' || statusFilter !== 'ALL';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>${hasFilter ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h4>
        <p>${hasFilter ? 'Altere ou limpe os filtros aplicados para ver outros clientes.' : 'Cadastre seu primeiro cliente para acompanhar contratos e entregas.'}</p>
        ${hasFilter
          ? `<button type="button" class="btn btn-secondary" onclick="resetGlobalFilters()">Limpar filtros</button>`
          : `<button type="button" class="btn btn-primary" onclick="openClientModal()">+ Cliente</button>`
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

    // Resumo limpo do contrato: Período + "2 de 8 entregues" e "6 restantes"
    let periodLabel = '';
    let deliveredLabel = '';
    let remainingLabel = '';

    if (m.contractBreakdowns.length === 0) {
      periodLabel = 'Sem contrato ativo';
      deliveredLabel = '0 de 0 entregues';
      remainingLabel = '0 restantes';
    } else if (m.contractBreakdowns.length === 1) {
      const { contract, metrics: cm } = m.contractBreakdowns[0];
      periodLabel = escapeHtml(contract.period);
      deliveredLabel = `${cm.published} de ${cm.totalContracted} entregues`;
      remainingLabel = `${cm.remaining} ${cm.remaining === 1 ? 'restante' : 'restantes'}${cm.excess > 0 ? ` (+${cm.excess} extra)` : ''}`;
    } else {
      const latestPeriod = m.contractBreakdowns[0].contract.period;
      periodLabel = `${m.contractBreakdowns.length} contratos (atual: ${escapeHtml(latestPeriod)})`;
      deliveredLabel = `${m.totalPublished} de ${m.totalContracted} entregues`;
      remainingLabel = `${m.remaining} ${m.remaining === 1 ? 'restante' : 'restantes'}${m.totalExcess > 0 ? ` (+${m.totalExcess} extra)` : ''}`;
    }

    const subtitleText = instaFormatted || client.company || '';

    return `
      <article class="ios-client-card ${cardStateClass}" data-client-id="${escapeHtml(client.id)}">
        <div class="ios-client-header" role="button" tabindex="0" onclick="openClientProfile('${escapeHtml(client.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openClientProfile('${escapeHtml(client.id)}');}" aria-label="Abrir perfil de ${escapeHtml(client.name)}">
          <div class="ios-client-identity">
            ${avatarHtml}
            <div class="ios-client-titles">
              <h3 class="ios-client-name">${escapeHtml(client.name)}</h3>
              ${subtitleText ? `<span class="ios-client-handle">${escapeHtml(subtitleText)}</span>` : ''}
            </div>
          </div>
          <svg class="ios-client-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <div class="ios-client-contract-row">
          <span class="ios-contract-period">${periodLabel}</span>
          <span class="badge ${m.overallBadgeClass}">${escapeHtml(m.overallDeliveryState)}</span>
        </div>

        <div class="ios-client-progress-block">
          <div class="ios-client-stats-row tabular-nums">
            <span class="ios-stats-delivered">${deliveredLabel}</span>
            <span class="ios-stats-remaining">${remainingLabel}</span>
          </div>
          <div class="ios-progress-track">
            <div class="ios-progress-fill ${m.overallFillClass}" style="width: ${m.percentage}%"></div>
          </div>
        </div>

        <button type="button" class="ios-register-post-btn" onclick="openQuickPostFromCard('${escapeHtml(client.id)}')">
          + Registrar postagem
        </button>
      </article>
    `;
  }).join('');
}

// ==================== RENDERIZAÇÃO DE CARDS DE POSTAGEM (MOBILE-FIRST) ====================
/**
 * Componente padronizado de Card de Postagem usado tanto no Perfil quanto na Tela Global de Postagens
 */
function renderPostCardHtml(client, post, postPeriod, isGlobalView = false) {
  const statusBadgeClass = getPostStatusBadgeClass(post.status);
  const menuId = `kebab_post_${isGlobalView ? 'g_' : 'p_'}${post.id}`;

  const linkBtnHtml = post.link
    ? `<a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
         <span>Ver publicação</span>
         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
           <polyline points="15 3 21 3 21 9"></polyline>
           <line x1="10" y1="14" x2="21" y2="3"></line>
         </svg>
       </a>`
    : '';

  return `
    <article class="post-card">
      <div class="post-card-top">
        <div class="post-meta-left">
          <span class="badge ${statusBadgeClass}">${escapeHtml(post.status)}</span>
          <span class="post-date tabular-nums">${escapeHtml(formatDateBR(post.date))}</span>
          <span class="post-type-meta">• ${escapeHtml(post.type)}</span>
        </div>

        <div class="kebab-wrap">
          <button type="button" class="btn-icon-only" onclick="toggleKebabMenu('${escapeHtml(menuId)}', event)" aria-label="Opções da postagem">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          <div id="${escapeHtml(menuId)}" class="dropdown-menu hidden">
            <button type="button" class="dropdown-item" onclick="openPostModal('${escapeHtml(post.id)}', '${escapeHtml(client.id)}')">
              Editar postagem
            </button>
            <button type="button" class="dropdown-item danger" onclick="confirmDeletePost('${escapeHtml(post.id)}', '${escapeHtml(client.id)}')">
              Excluir postagem
            </button>
          </div>
        </div>
      </div>

      <h3 class="post-title">${escapeHtml(post.title)}</h3>

      ${(isGlobalView || postPeriod || linkBtnHtml) ? `
        <div class="post-card-bottom">
          <div class="post-context-row">
            ${isGlobalView ? `<button type="button" class="post-client-link" onclick="openClientProfile('${escapeHtml(client.id)}')">${escapeHtml(client.name)}</button>` : ''}
            ${(isGlobalView && postPeriod) ? `<span>•</span>` : ''}
            ${postPeriod ? `<span>${escapeHtml(postPeriod)}</span>` : ''}
          </div>
          ${linkBtnHtml}
        </div>
      ` : ''}
    </article>
  `;
}

function renderGlobalPostsFeed(monthFilter, statusFilter, clientFilter, queryStr, includeCancelled) {
  const listEl = document.getElementById('globalPostsList');
  const countLabel = document.getElementById('globalPostsCountLabel');
  if (!listEl) return;

  const q = (queryStr || '').trim().toLowerCase();
  const allMatchingPosts = [];

  appData.clients.forEach(client => {
    if (clientFilter !== 'ALL' && client.id !== clientFilter) return;

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
      if (q) {
        const titleMatch = (post.title || '').toLowerCase().includes(q);
        const clientMatch = (client.name || '').toLowerCase().includes(q);
        const instaMatch = (client.instagram || '').toLowerCase().includes(q);
        if (!titleMatch && !clientMatch && !instaMatch) return;
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
        <h4>Nenhuma postagem encontrada</h4>
        <p>Altere os filtros ou registre uma nova publicação.</p>
        <button type="button" class="btn btn-secondary" onclick="resetGlobalFilters()">Limpar filtros</button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = allMatchingPosts
    .map(({ client, post, postPeriod }) => renderPostCardHtml(client, post, postPeriod, true))
    .join('');
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
  const postsSearchInput = document.getElementById('postsSearchInput');
  const monthSelect = document.getElementById('globalContractMonthFilter');
  const sheetMonthSelect = document.getElementById('sheetContractMonthFilter');
  const statusSelect = document.getElementById('globalPostStatusFilter');
  const clientSelect = document.getElementById('globalClientFilter');
  const cancelledToggle = document.getElementById('toggleShowCancelled');

  if (searchInput) searchInput.value = '';
  if (postsSearchInput) postsSearchInput.value = '';
  if (monthSelect) monthSelect.value = 'ALL';
  if (sheetMonthSelect) sheetMonthSelect.value = 'ALL';
  if (statusSelect) statusSelect.value = 'ALL';
  if (clientSelect) clientSelect.value = 'ALL';
  if (cancelledToggle) cancelledToggle.checked = false;

  renderDashboard();
}

// ==================== RENDERIZAÇÃO: PERFIL DO CLIENTE (MOBILE-FIRST) ====================
function openClientProfile(clientId) {
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;

  currentClientId = clientId;
  showMainView('profile');

  // Fecha seção expansível secundária por padrão para manter o histórico próximo do topo
  document.getElementById('clientDetailsExpandableBody')?.classList.add('hidden');
  document.getElementById('btnToggleClientDetails')?.setAttribute('aria-expanded', 'false');
  const chev = document.getElementById('clientDetailsChevron');
  if (chev) chev.textContent = '▾';

  populateContractMonthFilters();

  const globalMonth = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const profileMonthSelect = document.getElementById('filterProfileContractMonth');
  if (profileMonthSelect) {
    const sortedContracts = sortContractsChronologically(client.contracts || [], true);
    const hasGlobalOption = Array.from(profileMonthSelect.options || []).some(o => o.value === globalMonth);
    if (globalMonth !== 'ALL' && hasGlobalOption) {
      profileMonthSelect.value = globalMonth;
    } else if (sortedContracts.length > 0) {
      // Seleciona o contrato ativo mais recente por padrão para mostrar o resumo imediato
      const latestActive = sortedContracts.find(c => c.status === 'Ativo') || sortedContracts[0];
      profileMonthSelect.value = normalizePeriod(latestActive.period);
    } else {
      profileMonthSelect.value = 'ALL';
    }
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
  showMainView('clients');
  renderDashboard();
}

function filterProfileByContractMonth(period) {
  const profileMonthSelect = document.getElementById('filterProfileContractMonth');
  if (!profileMonthSelect) return;
  profileMonthSelect.value = period;
  renderClientProfile();
}

function openManageContractsSection() {
  closeAllKebabMenus();
  const body = document.getElementById('clientDetailsExpandableBody');
  const btn = document.getElementById('btnToggleClientDetails');
  const chev = document.getElementById('clientDetailsChevron');
  if (body) {
    body.classList.remove('hidden');
    btn?.setAttribute('aria-expanded', 'true');
    if (chev) chev.textContent = '▴';
    body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
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

  const avatarHtml = renderAvatarHtml(client, 'avatar-sm');
  const instaFormatted = formatInstagram(client.instagram);
  const instaUrl = getInstagramUrl(client.instagram);
  const waUrl = getWhatsAppUrl(client.phone);
  const profileMenuId = `kebab_profile_${client.id}`;

  // A. Cabeçalho Compacto do Perfil (Voltar, Avatar, Nome, Instagram clicável e Menu de 3 pontos)
  document.getElementById('profileHeaderCard').innerHTML = `
    <div class="profile-topbar-left">
      <button type="button" class="btn-icon-only" onclick="backToDashboard()" aria-label="Voltar para Clientes">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      ${avatarHtml}
      <div class="profile-topbar-titles">
        <h1 class="profile-topbar-name">${escapeHtml(client.name)}</h1>
        ${instaFormatted
          ? `<a href="${escapeHtml(instaUrl)}" target="_blank" rel="noopener noreferrer" class="client-handle">${escapeHtml(instaFormatted)}</a>`
          : (client.company ? `<span class="client-handle">${escapeHtml(client.company)}</span>` : '')
        }
      </div>
    </div>

    <div class="kebab-wrap">
      <button type="button" class="btn-icon-only" onclick="toggleKebabMenu('${escapeHtml(profileMenuId)}', event)" aria-label="Opções do cliente">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
      <div id="${escapeHtml(profileMenuId)}" class="dropdown-menu hidden">
        <button type="button" class="dropdown-item" onclick="openClientModal('${escapeHtml(client.id)}')">
          Editar cliente
        </button>
        <button type="button" class="dropdown-item" onclick="openContractModal()">
          + Novo contrato
        </button>
        <button type="button" class="dropdown-item" onclick="openManageContractsSection()">
          Gerenciar contratos
        </button>
        <button type="button" class="dropdown-item danger" onclick="confirmDeleteClient('${escapeHtml(client.id)}')">
          Excluir cliente
        </button>
      </div>
    </div>
  `;

  // Badge de status de entrega do contrato selecionado
  const deliveryBadge = document.getElementById('profileDeliveryBadge');
  if (deliveryBadge) {
    deliveryBadge.className = `badge ${m.overallBadgeClass}`;
    deliveryBadge.textContent = m.overallDeliveryState;
  }

  const profileContractDisplayLabel = document.getElementById('profileContractDisplayLabel');
  if (profileContractDisplayLabel) {
    profileContractDisplayLabel.textContent = selectedProfileMonth === 'ALL'
      ? `Todos os contratos (${(client.contracts || []).length})`
      : selectedProfileMonth;
  }

  // C. Resumo do Contrato Selecionado (Mesmo componente de 3 colunas sem separadores soltos)
  document.getElementById('profileStatsGrid').innerHTML = `
    <div class="ios-summary-col">
      <span class="ios-summary-label">Contratadas</span>
      <strong class="ios-summary-value tabular-nums">${m.totalContracted}</strong>
    </div>
    <div class="ios-summary-col">
      <span class="ios-summary-label">Publicadas</span>
      <strong class="ios-summary-value tabular-nums text-success">${m.totalPublished}</strong>
    </div>
    <div class="ios-summary-col">
      <span class="ios-summary-label">Restantes</span>
      <strong class="ios-summary-value tabular-nums">${m.remaining}</strong>
    </div>
  `;

  const progressBlock = document.getElementById('profileProgressBlock');
  if (progressBlock) {
    progressBlock.innerHTML = `
      <div class="ios-client-stats-row tabular-nums">
        <span class="ios-stats-delivered">${m.totalPublished} de ${m.totalContracted} entregues${m.totalExcess > 0 ? ` (+${m.totalExcess} extra)` : ''}</span>
        <span class="ios-stats-remaining">${m.remaining} ${m.remaining === 1 ? 'restante' : 'restantes'}</span>
      </div>
      <div class="ios-progress-track">
        <div class="ios-progress-fill ${m.overallFillClass}" style="width: ${m.percentage}%"></div>
      </div>
    `;
  }

  // Detalhes secundários em linhas limpas (sem cards dentro de cards)
  const secDetails = document.getElementById('profileSecondaryDetailsContent');
  if (secDetails) {
    const selectedContractObj = (client.contracts || []).find(
      c => normalizePeriod(c.period).toLowerCase() === selectedProfileMonth.toLowerCase()
    );
    const valFormatted = selectedContractObj ? formatCurrency(selectedContractObj.value) : null;
    const hasDates = selectedContractObj && (selectedContractObj.startDate || selectedContractObj.endDate);

    const rows = [];
    if (client.company) {
      rows.push({ label: 'Empresa', value: escapeHtml(client.company) });
    }
    if (client.phone) {
      const waLink = waUrl
        ? ` <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--success); font-weight: 500; margin-left: 6px; text-decoration: none;">WhatsApp ↗</a>`
        : '';
      rows.push({ label: 'Telefone', value: `${escapeHtml(client.phone)}${waLink}` });
    }
    if (client.email) {
      rows.push({ label: 'E-mail', value: escapeHtml(client.email) });
    }
    if (client.notes) {
      rows.push({ label: 'Observações', value: escapeHtml(client.notes) });
    }
    if (selectedContractObj) {
      rows.push({ label: 'Contrato selecionado', value: `${escapeHtml(selectedContractObj.period)} (${escapeHtml(selectedContractObj.status)})` });
      if (selectedContractObj.types) {
        rows.push({ label: 'Formatos', value: escapeHtml(selectedContractObj.types) });
      }
      if (valFormatted) {
        rows.push({ label: 'Valor', value: valFormatted });
      }
      if (hasDates) {
        rows.push({
          label: 'Prazo',
          value: `${selectedContractObj.startDate ? formatDateBR(selectedContractObj.startDate) : '...'} a ${selectedContractObj.endDate ? formatDateBR(selectedContractObj.endDate) : '...'}`
        });
      }
    }

    secDetails.innerHTML = rows.length > 0
      ? `<div class="detail-lines-list">
          ${rows.map(r => `
            <div class="detail-line-row">
              <span class="detail-line-label">${r.label}</span>
              <span class="detail-line-value">${r.value}</span>
            </div>
          `).join('')}
        </div>`
      : `<p style="font-size: 0.84rem; color: var(--text-muted); padding-top: 12px;">Nenhum detalhe adicional preenchido.</p>`;
  }

  renderContractsList(client, selectedProfileMonth, includeCancelled);
  renderPostsList(client, includeCancelled);
}

function renderContractsList(client, selectedProfileMonth = 'ALL', includeCancelled = false) {
  const container = document.getElementById('contractsList');
  if (!container) return;
  const allContracts = sortContractsChronologically(client.contracts || [], true);
  const contracts = allContracts.filter(c => includeCancelled || c.status !== 'Cancelado');

  if (contracts.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px 0; color: var(--text-muted); font-size: 0.85rem;">
        Nenhum contrato cadastrado.
      </div>
    `;
    return;
  }

  container.innerHTML = contracts.map(contract => {
    const cm = getContractMetrics(client, contract);
    const adminBadgeClass = getContractStatusBadgeClass(contract.status);
    const formattedVal = formatCurrency(contract.value);
    const menuId = `kebab_cnt_${contract.id}`;

    return `
      <div class="contract-line-item">
        <div class="contract-mini-info">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="contract-mini-period">${escapeHtml(contract.period)}</span>
            <span class="badge ${adminBadgeClass}">${escapeHtml(contract.status)}</span>
            <span class="badge ${cm.deliveryBadgeClass}">${escapeHtml(cm.deliveryState)}</span>
          </div>
          <div class="contract-mini-sub tabular-nums">
            ${cm.published} de ${cm.totalContracted} entregues • ${cm.remaining} restantes
            ${formattedVal ? ` • ${formattedVal}` : ''}
          </div>
        </div>

        <div class="kebab-wrap">
          <button type="button" class="btn-icon-only" onclick="toggleKebabMenu('${escapeHtml(menuId)}', event)" aria-label="Opções do contrato">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          <div id="${escapeHtml(menuId)}" class="dropdown-menu hidden">
            <button type="button" class="dropdown-item" onclick="filterProfileByContractMonth('${escapeHtml(normalizePeriod(contract.period))}')">
              Selecionar contrato
            </button>
            <button type="button" class="dropdown-item" onclick="renewContractInOneClick('${escapeHtml(contract.id)}')">
              ↻ Renovar para o próximo mês
            </button>
            <button type="button" class="dropdown-item" onclick="openContractModal('${escapeHtml(contract.id)}')">
              Editar contrato
            </button>
            <button type="button" class="dropdown-item" onclick="openDeliveryReportModal('${escapeHtml(client.id)}', '${escapeHtml(contract.id)}')">
              Relatório deste contrato
            </button>
            <button type="button" class="dropdown-item danger" onclick="confirmDeleteContract('${escapeHtml(contract.id)}')">
              Excluir contrato
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPostsList(client, includeCancelled = false) {
  const container = document.getElementById('postsList');
  if (!container) return;
  const filterStatus = document.getElementById('filterPostStatus')?.value || 'ALL';
  const filterMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';

  const profileNotice = document.getElementById('profileStatusFilterNotice');
  if (profileNotice) {
    profileNotice.classList.toggle('hidden', filterStatus === 'ALL');
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
          ? 'Registre a primeira publicação deste cliente.'
          : 'Não há postagens para o contrato ou status selecionado.'}</p>
        <button type="button" class="btn btn-primary" onclick="openQuickPostFromCard('${escapeHtml(client.id)}')">
          + Adicionar postagem
        </button>
      </div>
    `;
    return;
  }

  // Mostra o rótulo do contrato no card da postagem apenas quando "Todos os contratos" está selecionado
  const showContractOnCard = filterMonth === 'ALL' && (client.contracts || []).length > 1;

  container.innerHTML = posts
    .map(post => {
      const postPeriod = showContractOnCard ? getPostContractPeriod(client, post) : '';
      return renderPostCardHtml(client, post, postPeriod, false);
    })
    .join('');
}

// ==================== FLUXO RÁPIDO DE POSTAGEM + FORMULÁRIO MOBILE ====================
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
    btn.textContent = 'Salvar';
  } else if (status === 'Publicado') {
    btn.textContent = 'Salvar como publicada';
  } else {
    btn.textContent = 'Salvar';
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

  warningEl.classList.toggle('hidden', !isDuplicate);
  return isDuplicate;
}

function populateContractSelectForPostModal(client, postId = null, preselectedContractId = '') {
  const contractSelect = document.getElementById('postContractId');
  const noContractBox = document.getElementById('postNoContractWarning');
  const form = document.getElementById('postForm');
  if (!client || !contractSelect) return false;

  const sortedContracts = sortContractsChronologically(client.contracts || [], true);
  const validContracts = sortedContracts.filter(c => c.status !== 'Cancelado');
  const activeContracts = sortedContracts.filter(c => c.status === 'Ativo');

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
    return false;
  }

  noContractBox?.classList.add('hidden');
  form?.classList.remove('hidden');

  const contractsForSelect = validContracts.length > 0 ? validContracts : sortedContracts;
  if (activeContracts.length > 1 && !postId && !preselectedContractId) {
    contractSelect.innerHTML = `<option value="">Selecione o contrato...</option>` +
      contractsForSelect.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`).join('');
  } else {
    contractSelect.innerHTML = contractsForSelect.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`).join('');
  }

  if (preselectedContractId && contractsForSelect.some(c => c.id === preselectedContractId)) {
    contractSelect.value = preselectedContractId;
  } else if (activeContracts.length === 1) {
    contractSelect.value = activeContracts[0].id;
  } else if (activeContracts.length > 1 && !postId) {
    contractSelect.value = '';
  } else if (contractsForSelect.length === 1) {
    contractSelect.value = contractsForSelect[0].id;
  }

  return true;
}

function openQuickPostFromCard(clientId, preselectedContractId = '') {
  closeAllKebabMenus();
  // Se estiver dentro do perfil do cliente e houver um mês de contrato selecionado no topo, pré-seleciona esse contrato
  let resolvedContractId = preselectedContractId;
  if (!resolvedContractId && currentClientId === clientId) {
    const selectedPeriod = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
    if (selectedPeriod !== 'ALL') {
      const cli = appData.clients.find(c => c.id === clientId);
      const found = (cli?.contracts || []).find(c => normalizePeriod(c.period).toLowerCase() === selectedPeriod.toLowerCase());
      if (found) resolvedContractId = found.id;
    }
  }
  openPostModal(null, clientId, true, resolvedContractId);
}

function openPostModal(postId = null, targetClientId = null, isQuickFlow = false, preselectedContractId = '') {
  closeAllKebabMenus();

  if (appData.clients.length === 0) {
    showToast('Cadastre um cliente primeiro.');
    openClientModal();
    return;
  }

  const clientSelectGroup = document.getElementById('postClientSelectGroup');
  const clientSelectEl = document.getElementById('postClientSelect');
  const hasExplicitClient = Boolean(targetClientId || currentClientId);
  const resolvedClientId = targetClientId || currentClientId || appData.clients[0].id;
  const client = appData.clients.find(c => c.id === resolvedClientId);
  if (!client) return;

  const form = document.getElementById('postForm');
  const errEl = document.getElementById('postFormError');
  const dupWarn = document.getElementById('duplicateLinkWarning');

  errEl?.classList.add('hidden');
  dupWarn?.classList.add('hidden');
  if (form && typeof form.reset === 'function') form.reset();

  document.getElementById('postTargetClientId').value = client.id;
  const clientLabel = document.getElementById('postModalClientLabel');
  if (clientLabel) {
    const insta = formatInstagram(client.instagram);
    clientLabel.textContent = `${client.name}${insta ? ` (${insta})` : ''}`;
  }

  if (!hasExplicitClient && !postId && clientSelectGroup && clientSelectEl) {
    clientSelectGroup.classList.remove('hidden');
    clientSelectEl.innerHTML = appData.clients
      .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
      .join('');
    clientSelectEl.value = client.id;
  } else {
    clientSelectGroup?.classList.add('hidden');
  }

  const hasContracts = populateContractSelectForPostModal(client, postId, preselectedContractId);
  if (!hasContracts) {
    openModal('postModal');
    return;
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
    document.getElementById('postModalTitle').textContent = 'Adicionar Postagem';
    document.getElementById('postId').value = '';
    document.getElementById('postDate').value = getLocalTodayISO();
    document.getElementById('postType').value = 'Reels';
    document.getElementById('postStatus').value = 'Publicado';
    document.getElementById('postTitle').value = '';
    document.getElementById('postLink').value = '';
    document.getElementById('postNotes').value = '';
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
      errEl.textContent = 'Selecione o contrato desta postagem.';
      errEl.classList.remove('hidden');
    }
    return;
  }

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
      showToast(id ? 'Postagem atualizada!' : (status === 'Publicado' ? 'Publicação registrada!' : 'Postagem salva!'));
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
        showToast(status === 'Publicado' ? 'Publicação registrada!' : 'Postagem cadastrada!');
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
  closeAllKebabMenus();
  const resolvedId = clientId || currentClientId;
  const client = appData.clients.find(c => c.id === resolvedId);
  if (!client) return;

  currentReportClientId = client.id;
  const select = document.getElementById('reportContractSelect');
  const sortedContracts = sortContractsChronologically(client.contracts || [], true);

  if (sortedContracts.length === 0) {
    showToast('Crie um contrato para este cliente antes de gerar o relatório.');
    return;
  }

  select.innerHTML = sortedContracts.map(c =>
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`
  ).join('');

  if (preselectedContractId && sortedContracts.some(c => c.id === preselectedContractId)) {
    select.value = preselectedContractId;
  } else {
    const selectedProfileMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
    const matchingPeriodContract = sortedContracts.find(
      c => normalizePeriod(c.period).toLowerCase() === selectedProfileMonth.toLowerCase()
    );
    const active = matchingPeriodContract || sortedContracts.find(c => c.status === 'Ativo') || sortedContracts[0];
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

  area.innerHTML = `
    <div class="report-doc-header">
      <div>
        <div class="report-brand-mark">SocialFlow • Relatório de Entregas</div>
        <div class="report-doc-title">${escapeHtml(client.name)}</div>
        ${insta ? `<div class="report-doc-handle">${escapeHtml(insta)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <span class="report-stat-label">Período</span>
        <div style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(contract.period)}</div>
      </div>
    </div>

    <div class="report-summary-grid">
      <div class="report-stat-box">
        <span class="report-stat-label">Contratadas</span>
        <strong class="report-stat-val">${cm.totalContracted}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Publicadas</span>
        <strong class="report-stat-val text-success">${cm.published}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Restantes</span>
        <strong class="report-stat-val">${cm.remaining}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">${cm.excess > 0 ? 'Excedente' : 'Progresso'}</span>
        <strong class="report-stat-val ${cm.excess > 0 ? 'text-success' : ''}">${cm.excess > 0 ? `+${cm.excess}` : `${cm.percentage}%`}</strong>
      </div>
    </div>

    <h4 style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; color: var(--text-muted);">
      Publicações Entregues (${deliveredPosts.length})
    </h4>

    ${deliveredPosts.length === 0
      ? `<p style="font-size: 0.875rem; color: var(--text-muted); padding: 8px 0;">Nenhuma publicação concluída neste contrato até o momento.</p>`
      : `<div class="report-deliveries-list">
          ${deliveredPosts.map(p => `
            <div class="report-delivery-item">
              <div class="report-delivery-main">
                <span class="tabular-nums" style="color: var(--text-muted); font-weight: 400;">${escapeHtml(formatDateBR(p.date))}</span> — <span style="color: var(--text-secondary); font-weight: 400;">[${escapeHtml(p.type)}]</span> ${escapeHtml(p.title)}
              </div>
              ${p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer" class="report-delivery-link">${escapeHtml(p.link)}</a>` : ''}
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
    showToast('Resumo copiado!');
  } catch (_) {
    showToast('Não foi possível copiar automaticamente.');
  }
}

// ==================== MODAIS DE CLIENTE E CONTRATO ====================
function syncBodyFullscreenModalState() {
  if (typeof document === 'undefined' || !document.body) return;
  const fullscreenIds = ['clientModal', 'contractModal', 'postModal', 'reportModal'];
  const anyOpen = fullscreenIds.some(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
  document.body.classList.toggle('fullscreen-modal-open', anyOpen);
}

function openModal(modalId) {
  if (typeof document !== 'undefined' && document.activeElement) {
    lastFocusedTriggerEl = document.activeElement;
  }
  const modal = document.getElementById(modalId);
  modal?.classList.remove('hidden');
  syncBodyFullscreenModalState();
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
  syncBodyFullscreenModalState();
  if (lastFocusedTriggerEl && typeof lastFocusedTriggerEl.focus === 'function') {
    try {
      lastFocusedTriggerEl.focus();
    } catch (_) {}
  }
}

function setClientMoreInfoExpanded(expanded) {
  const block = document.getElementById('clientMoreInfoBlock');
  const btn = document.getElementById('btnToggleClientMoreInfo');
  const arrow = document.getElementById('clientMoreInfoArrow');
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

function updateClientAvatarPreview(avatarSrc = '', nameVal = '') {
  const preview = document.getElementById('clientModalAvatarPreview');
  if (!preview) return;
  const initials = escapeHtml(getInitials(nameVal || 'CL'));
  if (avatarSrc) {
    preview.innerHTML = `<img src="${escapeHtml(avatarSrc)}" alt="Foto" onerror="this.style.display='none'; this.parentElement.textContent='${initials}';">`;
  } else {
    preview.textContent = initials;
  }
}

function openClientModal(clientId = null) {
  closeAllKebabMenus();
  const form = document.getElementById('clientForm');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('clientFormError')?.classList.add('hidden');
  uploadedAvatarBase64 = '';
  const fileNameHint = document.getElementById('clientAvatarFileName');
  if (fileNameHint) fileNameHint.textContent = 'PNG ou JPG opcional';

  if (clientId) {
    const client = appData.clients.find(c => c.id === clientId);
    if (!client) return;
    document.getElementById('clientModalTitle').textContent = 'Editar cliente';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientCompany').value = client.company || '';
    document.getElementById('clientInstagram').value = client.instagram || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientAvatar').value = client.avatar && !client.avatar.startsWith('data:') ? client.avatar : '';
    uploadedAvatarBase64 = client.avatar && client.avatar.startsWith('data:') ? client.avatar : '';
    document.getElementById('clientNotes').value = client.notes || '';
    updateClientAvatarPreview(client.avatar || '', client.name || '');

    const hasSecondaryData = Boolean(client.phone || client.company || client.email || client.notes || (client.avatar && !client.avatar.startsWith('data:')));
    setClientMoreInfoExpanded(hasSecondaryData);
  } else {
    document.getElementById('clientModalTitle').textContent = 'Novo cliente';
    document.getElementById('clientId').value = '';
    updateClientAvatarPreview('', '');
    setClientMoreInfoExpanded(false);
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
      errEl.textContent = 'O link da foto/logo deve começar com http:// ou https://.';
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
      showToast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
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
        showToast('Cliente atualizado!');
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
        showToast('Cliente cadastrado!');
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
      btn.textContent = 'Salvar';
    }
  }
}

function confirmDeleteClient(clientId) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;

  openConfirmModal(
    'Excluir Cliente',
    `Deseja excluir "${client.name}" e todas as suas postagens e contratos? Essa ação não pode ser desfeita.`,
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
  closeAllKebabMenus();
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
    document.getElementById('contractModalTitle').textContent = 'Novo Contrato';
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
      errEl.textContent = 'Informe o mês e ano do contrato (ex.: Novembro/2026).';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (totalPosts <= 0) {
    if (errEl) {
      errEl.textContent = 'A quantidade contratada deve ser maior que zero.';
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
      showToast(id ? 'Contrato atualizado!' : 'Contrato salvo!');
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
        showToast('Contrato salvo!');
      }
      client.contracts = sortContractsChronologically(client.contracts, true);
      saveData();
    }

    closeModal('contractModal');
    // Seleciona automaticamente o período recém-criado/editado no perfil
    const profileSelect = document.getElementById('filterProfileContractMonth');
    if (profileSelect) {
      populateContractMonthFilters();
      profileSelect.value = period;
    }
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
      btn.textContent = 'Salvar';
    }
  }
}

/**
 * Renova um contrato em 1 clique para o próximo mês:
 * - Copia quantidade contratada, tipos e valor do contrato selecionado (ou do contrato mais recente do cliente)
 * - Avança o período para o próximo mês/ano (ex: Novembro/2026 -> Dezembro/2026)
 * - Se o contrato do próximo mês já existir para este cliente, avisa e seleciona sem duplicar!
 */
async function renewContractInOneClick(sourceContractId = null) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const sorted = sortContractsChronologically(client.contracts || [], true);
  if (sorted.length === 0) {
    showToast('Crie o primeiro contrato do cliente para poder renovar nos próximos meses.');
    openContractModal();
    return;
  }

  let baseContract = null;
  if (sourceContractId) {
    baseContract = sorted.find(c => c.id === sourceContractId);
  }
  if (!baseContract) {
    const selectedProfileMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';
    if (selectedProfileMonth !== 'ALL') {
      baseContract = sorted.find(c => normalizePeriod(c.period).toLowerCase() === selectedProfileMonth.toLowerCase());
    }
  }
  if (!baseContract) {
    baseContract = sorted.find(c => c.status === 'Ativo') || sorted[0];
  }

  const nextInfo = computeNextContractPeriod(baseContract.period, baseContract.startDate, baseContract.endDate);

  // Evita duplicar se o contrato do próximo mês já existir
  const existingNext = sorted.find(c => normalizePeriod(c.period).toLowerCase() === nextInfo.period.toLowerCase());
  if (existingNext) {
    showToast(`O contrato de ${nextInfo.period} já existe para este cliente!`);
    filterProfileByContractMonth(existingNext.period);
    return;
  }

  const totalPosts = Number(baseContract.totalPosts) || 0;
  const types = baseContract.types || '';
  const value = baseContract.value !== '' && baseContract.value !== null && baseContract.value !== undefined
    ? Number(baseContract.value)
    : null;

  try {
    if (supabase) {
      const fullPayload = {
        cliente_id: client.id,
        periodo: nextInfo.period,
        total_postagens: totalPosts,
        tipos: types,
        valor: value,
        status: 'Ativo',
        data_inicio: nextInfo.startDate || null,
        data_fim: nextInfo.endDate || null
      };
      const basePayload = {
        cliente_id: client.id,
        periodo: nextInfo.period,
        total_postagens: totalPosts,
        tipos: types,
        valor: value,
        status: 'Ativo'
      };

      const res = await supabase.from('contratos').insert([fullPayload]);
      if (res.error && String(res.error.message || '').includes('data_')) {
        const fallback = await supabase.from('contratos').insert([basePayload]);
        if (fallback.error) throw fallback.error;
      } else if (res.error) {
        throw res.error;
      }
      await fetchFromSupabase();
    } else {
      client.contracts.push({
        id: uid('cnt'),
        period: nextInfo.period,
        totalPosts,
        startDate: nextInfo.startDate,
        endDate: nextInfo.endDate,
        types,
        value: value !== null ? value : '',
        status: 'Ativo'
      });
      client.contracts = sortContractsChronologically(client.contracts, true);
      saveData();
    }

    populateContractMonthFilters();
    const profileSelect = document.getElementById('filterProfileContractMonth');
    if (profileSelect) {
      profileSelect.value = nextInfo.period;
    }
    renderClientProfile();
    showToast(`Contrato renovado para ${nextInfo.period} (${totalPosts} postagens)!`);
  } catch (err) {
    showToast('Erro ao renovar contrato: ' + (err.message || ''));
  }
}

function confirmDeleteContract(contractId) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;
  const contract = (client.contracts || []).find(c => c.id === contractId);
  if (!contract) return;

  openConfirmModal(
    'Excluir Contrato',
    `Deseja excluir o contrato "${contract.period}"? As postagens registradas serão mantidas.`,
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

function confirmDeletePost(postId, ownerClientId = null) {
  closeAllKebabMenus();
  const resolvedClientId = ownerClientId || currentClientId;
  const client = appData.clients.find(c => c.id === resolvedClientId);
  if (!client) return;
  const post = (client.posts || []).find(p => p.id === postId);
  if (!post) return;

  openConfirmModal(
    'Excluir Postagem',
    `Deseja excluir a postagem "${post.title}"? O saldo será atualizado imediatamente.`,
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
      if (currentClientId) {
        renderClientProfile();
      } else {
        renderDashboard();
      }
    }
  );
}

// ==================== AJUSTES → DADOS & CONFIRMAÇÃO REFORÇADA ====================
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
    if (hardLabel) hardLabel.textContent = `Para confirmar, digite ${requiredWord} abaixo:`;
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
  showToast('Backup JSON exportado!');
}

// ==================== PWA (INSTALAR COMO APLICATIVO NO CELULAR) ====================
let deferredPwaPrompt = null;

function initPwaSupport() {
  if (typeof window === 'undefined') return;

  // Registra Service Worker se disponível (em HTTPS / localhost)
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  const installBtn = document.getElementById('btnInstallPwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    installBtn?.classList.remove('hidden');
  });

  installBtn?.addEventListener('click', async () => {
    if (!deferredPwaPrompt) return;
    deferredPwaPrompt.prompt();
    const { outcome } = await deferredPwaPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplicativo SocialFlow instalado!');
      installBtn.classList.add('hidden');
    }
    deferredPwaPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    installBtn?.classList.add('hidden');
    deferredPwaPrompt = null;
  });
}

// Expõe funções chamadas via onclick no HTML
if (typeof window !== 'undefined') {
  Object.assign(window, {
    openClientProfile,
    backToDashboard,
    openClientModal,
    confirmDeleteClient,
    openContractModal,
    renewContractInOneClick,
    confirmDeleteContract,
    openPostModal,
    openQuickPostFromCard,
    confirmDeletePost,
    applyQuickStatusFilter,
    resetGlobalFilters,
    filterProfileByContractMonth,
    openDeliveryReportModal,
    toggleKebabMenu,
    openManageContractsSection
  });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
  initBackendAndAuth();
  initPwaSupport();

  document.getElementById('btnRenewContractOneClick')?.addEventListener('click', () => renewContractInOneClick());

  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Fechar menus de 3 pontos ao clicar fora
  document.addEventListener('click', () => {
    closeAllKebabMenus();
  });

  // Fechar modais com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllKebabMenus();
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
      syncBodyFullscreenModalState();
    }
  });

  // Navegação Desktop & Mobile Bottom Nav
  document.getElementById('brandLogo')?.addEventListener('click', () => setDashboardMode('clients'));
  document.getElementById('navClientsBtn')?.addEventListener('click', () => setDashboardMode('clients'));
  document.getElementById('mobileNavClients')?.addEventListener('click', () => setDashboardMode('clients'));

  document.getElementById('navPipelineBtn')?.addEventListener('click', () => setDashboardMode('posts'));
  document.getElementById('mobileNavPosts')?.addEventListener('click', () => setDashboardMode('posts'));

  document.getElementById('navSettingsBtn')?.addEventListener('click', () => showMainView('settings'));
  document.getElementById('mobileNavSettings')?.addEventListener('click', () => showMainView('settings'));

  // Botões de ação nos cabeçalhos
  document.getElementById('btnNewClientHeader')?.addEventListener('click', () => openClientModal());
  document.getElementById('btnNewClientSidebar')?.addEventListener('click', () => openClientModal());
  document.getElementById('btnNewPostGlobalHeader')?.addEventListener('click', () => openPostModal(null, null, true));
  document.getElementById('btnNewContract')?.addEventListener('click', () => openContractModal());
  document.getElementById('btnNewPost')?.addEventListener('click', () => openPostModal(null, currentClientId, false));
  document.getElementById('btnQuickPostProfile')?.addEventListener('click', () => openQuickPostFromCard(currentClientId));
  document.getElementById('btnOpenDeliveryReport')?.addEventListener('click', () => openDeliveryReportModal(currentClientId));

  // Seção expansível "Detalhes do cliente e contrato" no perfil
  document.getElementById('btnToggleClientDetails')?.addEventListener('click', () => {
    const body = document.getElementById('clientDetailsExpandableBody');
    const btn = document.getElementById('btnToggleClientDetails');
    const chev = document.getElementById('clientDetailsChevron');
    const isHidden = body?.classList.contains('hidden');
    if (isHidden) {
      body?.classList.remove('hidden');
      btn?.setAttribute('aria-expanded', 'true');
      if (chev) chev.textContent = '▴';
    } else {
      body?.classList.add('hidden');
      btn?.setAttribute('aria-expanded', 'false');
      if (chev) chev.textContent = '▾';
    }
  });

  // Abrir Bottom Sheet de Filtros
  document.getElementById('btnOpenFiltersSheet')?.addEventListener('click', () => {
    document.getElementById('filterClientGroupInSheet')?.classList.add('hidden');
    openModal('filtersSheetModal');
  });

  document.getElementById('btnOpenPostsFiltersSheet')?.addEventListener('click', () => {
    document.getElementById('filterClientGroupInSheet')?.classList.remove('hidden');
    openModal('filtersSheetModal');
  });

  document.getElementById('btnSheetResetFilters')?.addEventListener('click', () => {
    resetGlobalFilters();
    closeModal('filtersSheetModal');
  });

  // Troca de cliente dentro do modal de nova postagem (quando aberto da tela global)
  document.getElementById('postClientSelect')?.addEventListener('change', (e) => {
    const selectedCliId = e.target.value;
    const cli = appData.clients.find(c => c.id === selectedCliId);
    if (!cli) return;
    document.getElementById('postTargetClientId').value = cli.id;
    const clientLabel = document.getElementById('postModalClientLabel');
    if (clientLabel) {
      const insta = formatInstagram(cli.instagram);
      clientLabel.textContent = `${cli.name}${insta ? ` (${insta})` : ''}`;
    }
    populateContractSelectForPostModal(cli, null, '');
  });

  // Toggle "Mais informações" no modal de cliente e atualização do avatar preview
  document.getElementById('btnToggleClientMoreInfo')?.addEventListener('click', () => {
    const block = document.getElementById('clientMoreInfoBlock');
    const isHidden = block?.classList.contains('hidden');
    setClientMoreInfoExpanded(Boolean(isHidden));
  });

  document.getElementById('clientName')?.addEventListener('input', (e) => {
    const currentSrc = uploadedAvatarBase64 || document.getElementById('clientAvatar')?.value.trim() || '';
    updateClientAvatarPreview(currentSrc, e.target.value);
  });

  document.getElementById('clientAvatar')?.addEventListener('input', (e) => {
    if (!uploadedAvatarBase64) {
      updateClientAvatarPreview(e.target.value.trim(), document.getElementById('clientName')?.value || '');
    }
  });

  // Toggle instruções de instalação PWA em Ajustes (só abre ao tocar)
  document.getElementById('btnTogglePwaInstructions')?.addEventListener('click', () => {
    const tips = document.getElementById('pwaManualTips');
    const btn = document.getElementById('btnTogglePwaInstructions');
    const isHidden = tips?.classList.contains('hidden');
    if (isHidden) {
      tips?.classList.remove('hidden');
      btn?.setAttribute('aria-expanded', 'true');
    } else {
      tips?.classList.add('hidden');
      btn?.setAttribute('aria-expanded', 'false');
    }
  });

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
  document.getElementById('searchInput')?.addEventListener('input', renderDashboard);
  document.getElementById('postsSearchInput')?.addEventListener('input', renderDashboard);

  document.getElementById('toggleShowCancelled')?.addEventListener('change', renderDashboard);
  document.getElementById('toggleProfileShowCancelled')?.addEventListener('change', renderClientProfile);

  document.getElementById('globalContractMonthFilter')?.addEventListener('change', (e) => {
    const sheetSelect = document.getElementById('sheetContractMonthFilter');
    if (sheetSelect) sheetSelect.value = e.target.value;
    renderDashboard();
  });

  document.getElementById('sheetContractMonthFilter')?.addEventListener('change', (e) => {
    const globalSelect = document.getElementById('globalContractMonthFilter');
    if (globalSelect) globalSelect.value = e.target.value;
    renderDashboard();
  });

  document.getElementById('globalPostStatusFilter')?.addEventListener('change', renderDashboard);
  document.getElementById('globalClientFilter')?.addEventListener('change', renderDashboard);

  document.getElementById('btnClearGlobalFilters')?.addEventListener('click', resetGlobalFilters);
  document.getElementById('btnClearPostsFilters')?.addEventListener('click', resetGlobalFilters);

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
    const fileNameHint = document.getElementById('clientAvatarFileName');
    if (fileNameHint) fileNameHint.textContent = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedAvatarBase64 = reader.result;
      updateClientAvatarPreview(uploadedAvatarBase64, document.getElementById('clientName')?.value || '');
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
        showToast(`Digite "${pendingConfirmRequiredWord}" para confirmar.`);
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

  // Ajustes -> Dados
  document.getElementById('btnExportDataJson')?.addEventListener('click', exportUserDataJson);

  document.getElementById('btnClearData')?.addEventListener('click', () => {
    openConfirmModal(
      'Exclusão em Massa',
      'Esta ação apagará TODOS os clientes, contratos e postagens salvos. Exporte um backup JSON antes de continuar.',
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
      showToast('Conectado ao Supabase: exemplos locais estão desativados para proteger seus dados reais.');
      return;
    }
    openConfirmModal(
      'Restaurar Exemplos',
      'Isso adicionará os 3 clientes de demonstração no Modo Local, preservando os clientes reais que você cadastrou.',
      async () => {
        const realClients = (appData.clients || []).filter(c => !c.isSample && !String(c.id).startsWith('sample_cli_'));
        const sampleCopy = JSON.parse(JSON.stringify(SAMPLE_DATA.clients));
        appData.clients = [...realClients, ...sampleCopy];
        saveData();
        resetGlobalFilters();
        backToDashboard();
        showToast('Exemplos restaurados!');
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
        syncBodyFullscreenModalState();
      }
    });
  });
});
