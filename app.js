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
          agreementType: 'Mensal',
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
          agreementType: 'Mensal',
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
          agreementType: 'Mensal',
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
let appData = { clients: [], videos: [] };
let currentClientId = null;
let dashboardMode = 'clients'; // 'clients' | 'posts' | 'videos'
let activeClientCategory = 'ALL'; // 'Mensal' | 'Avulso' | 'Parceria' | 'ALL'
let videoStatusFilter = 'ALL';
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
function mapSupabaseRowsToAppData(clientesRows = [], contratosRows = [], postagensRows = [], videosRows = []) {
  const trashClients = [];
  const trashContracts = [];
  const trashPosts = [];

  const activeClients = [];
  clientesRows.forEach(cli => {
    const clientContractsAll = contratosRows
      .filter(cnt => cnt.cliente_id === cli.id)
      .map(cnt => ({
        id: cnt.id,
        clientId: cli.id,
        clientName: cli.nome || '',
        agreementType: cnt.tipo_acordo || null,
        agreementTitle: cnt.titulo_acordo || '',
        partnershipSubtype: cnt.subtipo_parceria || '',
        hasDefinedQuantity: cnt.quantidade_definida !== false,
        partnershipNotes: cnt.descricao_combinado || '',
        period: cnt.periodo || '',
        totalPosts: Number(cnt.total_postagens) || 0,
        durationMonths: Number(cnt.duracao_meses) || inferContractDurationMonths({ startDate: cnt.data_inicio, endDate: cnt.data_fim }),
        types: cnt.tipos || '',
        value: cnt.valor !== null && cnt.valor !== undefined ? Number(cnt.valor) : '',
        status: cnt.status || 'Ativo',
        startDate: cnt.data_inicio || '',
        endDate: cnt.data_fim || '',
        deletedAt: cnt.deleted_at || null,
        createdAt: cnt.criado_em
      }));

    const clientPostsAll = postagensRows
      .filter(pst => pst.cliente_id === cli.id)
      .map(pst => ({
        id: pst.id,
        clientId: cli.id,
        clientName: cli.nome || '',
        contractId: pst.contrato_id || '',
        date: pst.data || '',
        type: pst.tipo || 'Reels',
        title: pst.titulo || '',
        link: pst.link || '',
        status: pst.status || 'Pendente',
        notes: pst.observacoes || '',
        deletedAt: pst.deleted_at || null,
        createdAt: pst.criado_em
      }));

    const mappedClient = {
      id: cli.id,
      name: cli.nome || '',
      company: cli.empresa || '',
      instagram: cli.instagram || '',
      phone: cli.telefone || '',
      email: cli.email || '',
      avatar: cli.foto_url || '',
      notes: cli.observacoes || '',
      status: cli.status || 'Ativo',
      archived: Boolean(cli.arquivado),
      deletedAt: cli.deleted_at || null,
      createdAt: cli.criado_em,
      contracts: sortContractsChronologically(clientContractsAll.filter(c => !c.deletedAt), true),
      posts: clientPostsAll.filter(p => !p.deletedAt)
    };

    if (cli.deleted_at) {
      trashClients.push({
        ...mappedClient,
        contracts: sortContractsChronologically(clientContractsAll, true),
        posts: clientPostsAll
      });
    } else {
      activeClients.push(mappedClient);
      clientContractsAll.filter(c => c.deletedAt).forEach(c => trashContracts.push(c));
      clientPostsAll.filter(p => p.deletedAt).forEach(p => trashPosts.push(p));
    }
  });

  const mappedVideos = (videosRows || [])
    .filter(v => !v.deleted_at)
    .map(v => ({
      id: v.id,
      title: v.titulo || '',
      description: v.descricao || '',
      status: v.status || 'A fazer',
      dueDate: v.data_prevista || '',
      materialLink: v.link_material || '',
      finalLink: v.link_final || '',
      notes: v.observacoes || '',
      archived: Boolean(v.arquivado),
      createdAt: v.criado_em
    }));

  return {
    clients: activeClients,
    videos: mappedVideos,
    trash: {
      clients: trashClients,
      contracts: trashContracts,
      posts: trashPosts
    },
    auditLog: appData?.auditLog || []
  };
}

async function fetchFromSupabase() {
  if (!supabase) return;
  const [resClientes, resContratos, resPostagens, resVideos] = await Promise.all([
    supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
    supabase.from('contratos').select('*').order('criado_em', { ascending: false }),
    supabase.from('postagens').select('*').order('data', { ascending: false }),
    supabase.from('videos').select('*').order('criado_em', { ascending: false }).then(r => r).catch(() => ({ data: [], error: null }))
  ]);

  if (resClientes.error) throw resClientes.error;
  if (resContratos.error) throw resContratos.error;
  if (resPostagens.error) throw resPostagens.error;

  const videosData = resVideos && !resVideos.error ? (resVideos.data || []) : [];

  appData = mapSupabaseRowsToAppData(
    resClientes.data || [],
    resContratos.data || [],
    resPostagens.data || [],
    videosData
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
          if (c.isSample) {
            c.contracts.forEach(cnt => {
              if (!cnt.agreementType) cnt.agreementType = 'Mensal';
            });
          }
          c.contracts = sortContractsChronologically(c.contracts, true);
        }
      });
    }
  } catch (e) {
    console.error('Erro ao carregar localStorage:', e);
    appData = JSON.parse(JSON.stringify(SAMPLE_DATA));
  }
}

function ensureRecoveryStructures() {
  if (!Array.isArray(appData.videos)) {
    appData.videos = [];
  }
  if (!appData.trash) {
    appData.trash = { clients: [], contracts: [], posts: [] };
  }
  if (!Array.isArray(appData.trash.clients)) appData.trash.clients = [];
  if (!Array.isArray(appData.trash.contracts)) appData.trash.contracts = [];
  if (!Array.isArray(appData.trash.posts)) appData.trash.posts = [];
  if (!Array.isArray(appData.auditLog)) appData.auditLog = [];
}

async function recordAuditEvent(entidade, entidadeId, acao, detalhes = {}) {
  ensureRecoveryStructures();
  const authorEmail = document.getElementById('loggedUserEmail')?.textContent || (supabase ? 'usuario' : 'modo_local');
  const entry = {
    id: uid('log'),
    entidade,
    entidadeId: String(entidadeId || ''),
    acao,
    detalhes,
    autorEmail: authorEmail,
    criadoEm: new Date().toISOString()
  };

  appData.auditLog.unshift(entry);
  if (appData.auditLog.length > 200) {
    appData.auditLog = appData.auditLog.slice(0, 200);
  }
  if (!supabase) {
    saveData();
  } else {
    try {
      await supabase.from('historico_alteracoes').insert([{
        entidade,
        entidade_id: String(entidadeId || ''),
        acao,
        detalhes,
        autor_email: authorEmail
      }]);
    } catch (_) {
      // Ignora silenciosamente caso a tabela historico_alteracoes ainda nao exista no banco
    }
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

  dot?.classList.remove('error');

  if (isOnline) {
    dot?.classList.add('online');
    if (txt) txt.textContent = 'Dados salvos na nuvem (Supabase)';
    if (userEmail) {
      userInfo?.classList.remove('hidden');
      if (userEmailEl) userEmailEl.textContent = userEmail;
    }
    demoRow?.classList.add('hidden');
  } else {
    dot?.classList.remove('online');
    if (txt) txt.textContent = 'Dados salvos somente neste aparelho';
    userInfo?.classList.add('hidden');
    demoRow?.classList.remove('hidden');
  }
}

function setPersistenceErrorUI(message = '') {
  const dot = document.getElementById('dbConnectionDot');
  const txt = document.getElementById('dbConnectionText');
  dot?.classList.remove('online');
  dot?.classList.add('error');
  if (txt) {
    txt.textContent = `Erro ao salvar: ${message || 'falha na gravação.'}`;
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
function extractSingleMonthYear(periodStr = '') {
  const clean = normalizePeriod(periodStr)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!clean) return { month: 0, year: 0 };

  const isoMatch = clean.match(/^(\d{4})[\s\/\-](\d{1,2})$/);
  if (isoMatch) return { year: Number(isoMatch[1]), month: Number(isoMatch[2]) };

  const brNumMatch = clean.match(/^(\d{1,2})[\s\/\-](\d{4})$/);
  if (brNumMatch) return { year: Number(brNumMatch[2]), month: Number(brNumMatch[1]) };

  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : 0;

  const tokens = clean.split(/[^a-z0-9]+/).filter(Boolean);
  let month = 0;
  for (const tok of tokens) {
    if (PT_MONTHS_MAP[tok]) {
      month = PT_MONTHS_MAP[tok];
      break;
    }
  }
  return { month, year };
}

function periodLabelsMatch(labelA = '', labelB = '') {
  const a = normalizePeriod(labelA).toLowerCase();
  const b = normalizePeriod(labelB).toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;

  const pa = extractSingleMonthYear(labelA);
  const pb = extractSingleMonthYear(labelB);
  if (pa.month > 0 && pb.month > 0 && pa.month === pb.month) {
    if (pa.year > 0 && pb.year > 0) return pa.year === pb.year;
    return true;
  }
  return false;
}

function extractContractPeriodMonths(contract) {
  if (!contract) return [];
  const type = contract.agreementType || null;
  // Acordos Avulso e Parceria usam agreementTitle (ex.: "Permuta Festa"), não período mensal
  if (type === 'Avulso' || type === 'Parceria') return [];

  const raw = normalizePeriod(contract.period || '');
  if (!raw) return [];
  if (!type && parsePeriodSortKey(raw) <= 0) return [];

  const clean = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
  const explicitYear = yearMatch ? Number(yearMatch[1]) : 0;

  const tokens = clean.split(/[^a-z0-9]+/).filter(Boolean);
  const foundMonths = [];
  tokens.forEach(tok => {
    const m = PT_MONTHS_MAP[tok];
    if (m && !foundMonths.includes(m)) {
      foundMonths.push(m);
    }
  });

  if (foundMonths.length > 1) {
    let curYear = explicitYear;
    return foundMonths.map((m, idx) => {
      if (curYear > 0 && idx > 0 && m < foundMonths[idx - 1]) {
        curYear += 1;
      }
      const name = PT_MONTH_NAMES[m - 1];
      return curYear > 0 ? `${name}/${curYear}` : name;
    });
  }

  if (foundMonths.length === 1 && Number(contract.durationMonths) > 1 && contract.startDate && contract.endDate) {
    const start = parseLocalDate(contract.startDate);
    const end = parseLocalDate(contract.endDate);
    if (start && end && end >= start) {
      const result = [];
      let y = start.getFullYear();
      let m = start.getMonth() + 1;
      const endY = end.getFullYear();
      const endM = end.getMonth() + 1;
      let guard = 0;
      while ((y < endY || (y === endY && m <= endM)) && guard < 24) {
        const name = PT_MONTH_NAMES[m - 1];
        result.push(explicitYear > 0 ? `${name}/${y}` : name);
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
        guard += 1;
      }
      if (result.length > 0) return result;
    }
  }

  if (parsePeriodSortKey(raw) > 0) {
    return [raw];
  }
  return [];
}

function contractMatchesPeriod(contract, monthFilter = 'ALL') {
  if (!monthFilter || monthFilter === 'ALL') return true;
  if (!contract) return false;

  const rawPeriod = normalizePeriod(contract.period || '');
  if (rawPeriod && rawPeriod.toLowerCase() === monthFilter.toLowerCase()) return true;

  const months = extractContractPeriodMonths(contract);
  if (months.some(m => periodLabelsMatch(m, monthFilter))) return true;

  const type = contract.agreementType || null;
  if (type === 'Avulso' || type === 'Parceria') {
    const target = extractSingleMonthYear(monthFilter);
    if (target.month > 0 && (contract.startDate || contract.endDate)) {
      const start = parseLocalDate(contract.startDate || contract.endDate);
      const end = parseLocalDate(contract.endDate || contract.startDate);
      if (start && end) {
        const checkYear = target.year > 0 ? target.year : start.getFullYear();
        const monthStart = new Date(checkYear, target.month - 1, 1, 0, 0, 0, 0);
        const monthEnd = new Date(checkYear, target.month, 0, 23, 59, 59, 999);
        return start <= monthEnd && end >= monthStart;
      }
    }
    if (parsePeriodSortKey(rawPeriod) > 0 && periodLabelsMatch(rawPeriod, monthFilter)) {
      return true;
    }
  }

  return false;
}

function getAllContractMonths() {
  const set = new Set();
  appData.clients.forEach(client => {
    (client.contracts || []).forEach(c => {
      extractContractPeriodMonths(c).forEach(p => {
        if (p) set.add(p);
      });
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
function getContractDisplayLabel(contract) {
  if (!contract) return 'Acordo';
  if (contract.agreementType === 'Avulso' || contract.agreementType === 'Parceria') {
    return contract.agreementTitle || contract.period || contract.agreementType;
  }
  return contract.period || contract.agreementTitle || 'Contrato';
}

function getAgreementTypeBadgeText(contract) {
  return contract?.agreementType || 'A classificar';
}

function getContractMetrics(client, contract, todayISO = getLocalTodayISO()) {
  const isUnlimitedQuantity = (contract.agreementType === 'Parceria' || contract.agreementType === 'Avulso') && contract.hasDefinedQuantity === false;
  const totalContracted = isUnlimitedQuantity ? 0 : Math.max(0, Number(contract.totalPosts) || 0);
  const allClientPosts = client.posts || [];

  const linkedPosts = allClientPosts.filter(p => {
    const linked = getLinkedContractForPost(client, p);
    return linked && linked.id === contract.id;
  });

  const published = linkedPosts.filter(p => p.status === 'Publicado').length;
  const remaining = isUnlimitedQuantity ? 0 : Math.max(0, totalContracted - published);
  const excess = isUnlimitedQuantity ? 0 : Math.max(0, published - totalContracted);
  const percentage = (!isUnlimitedQuantity && totalContracted > 0)
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
  } else if (isUnlimitedQuantity) {
    if (contract.agreementType === 'Parceria') {
      deliveryState = contract.status === 'Encerrado' ? 'Encerrada' : (contract.status === 'Pausado' ? 'Pausada' : 'Parceria ativa');
    } else {
      deliveryState = contract.status === 'Encerrado' ? 'Encerrado' : (contract.status === 'Pausado' ? 'Pausado' : 'Avulso ativo');
    }
    deliveryBadgeClass = contract.status === 'Encerrado' ? 'badge-concluido' : 'badge-andamento';
    barFillClass = 'fill-andamento';
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
    hasDefinedQuantity: !isUnlimitedQuantity,
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

function getClientMetrics(client, monthFilter = 'ALL', includeCancelled = false, todayISO = getLocalTodayISO(), categoryFilter = 'ALL') {
  const allContracts = sortContractsChronologically(client.contracts || [], true);

  const consideredContracts = allContracts.filter(c => {
    if (!includeCancelled && c.status === 'Cancelado') return false;
    if (categoryFilter !== 'ALL' && c.agreementType !== categoryFilter) return false;
    if (monthFilter !== 'ALL' && !contractMatchesPeriod(c, monthFilter)) return false;
    return true;
  });

  const activeContractsCount = consideredContracts.filter(c => c.status === 'Ativo').length;

  let totalContracted = 0;
  let totalPublished = 0;
  let remaining = 0;
  let totalExcess = 0;
  let hasOverdueContract = false;
  let hasDueSoonContract = false;
  let hasUndefinedPartnership = false;

  const contractBreakdowns = consideredContracts.map(cnt => {
    const cm = getContractMetrics(client, cnt, todayISO);
    if (cnt.status !== 'Cancelado') {
      if (!cm.hasDefinedQuantity) {
        hasUndefinedPartnership = true;
        totalPublished += cm.published;
      } else {
        totalContracted += cm.totalContracted;
        totalPublished += cm.published;
        remaining += cm.remaining;
        totalExcess += cm.excess;
      }
      if (cm.isOverdue) hasOverdueContract = true;
      if (cm.isDueSoon) hasDueSoonContract = true;
    }
    return { contract: cnt, metrics: cm };
  });

  const postsInPeriod = (client.posts || []).filter(p => {
    const linked = getLinkedContractForPost(client, p);
    if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
    if (monthFilter === 'ALL') return true;
    return linked ? contractMatchesPeriod(linked, monthFilter) : false;
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
  } else if (hasUndefinedPartnership && totalContracted === 0) {
    const allParceria = consideredContracts.every(c => c.agreementType === 'Parceria');
    overallDeliveryState = allParceria ? 'Parceria contínua' : 'Quantidade livre';
    overallBadgeClass = 'badge-andamento';
    overallFillClass = 'fill-andamento';
  } else if (hasOverdueContract) {
    overallDeliveryState = 'Em atraso';
    overallBadgeClass = 'badge-atraso';
    overallFillClass = 'fill-atraso';
  } else if (totalContracted > 0 && remaining === 0) {
    const allMensal = consideredContracts.every(c => c.agreementType === 'Mensal');
    overallDeliveryState = allMensal ? 'Pacote completo' : 'Entregue';
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
    videos: ['navVideosBtn', 'mobileNavVideos'],
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
  const videosView = document.getElementById('videosView');
  const profView = document.getElementById('profileView');
  const setView = document.getElementById('settingsView');

  dashView?.classList.add('hidden');
  postsView?.classList.add('hidden');
  videosView?.classList.add('hidden');
  profView?.classList.add('hidden');
  setView?.classList.add('hidden');

  if (viewName === 'profile') {
    profView?.classList.remove('hidden');
    updateNavActiveState('clients');
  } else if (viewName === 'settings') {
    currentClientId = null;
    setView?.classList.remove('hidden');
    updateNavActiveState('settings');
  } else if (viewName === 'videos') {
    currentClientId = null;
    dashboardMode = 'videos';
    videosView?.classList.remove('hidden');
    updateNavActiveState('videos');
    renderVideosView();
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
  } else if (mode === 'videos') {
    showMainView('videos');
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
let clientsViewMode = 'cards';

function setClientsViewMode(mode) {
  clientsViewMode = mode === 'table' ? 'table' : 'cards';
  document.getElementById('btnClientsViewCards')?.classList.toggle('active', clientsViewMode === 'cards');
  document.getElementById('btnClientsViewTable')?.classList.toggle('active', clientsViewMode === 'table');
  renderDashboard();
}

function setClientCategory(cat) {
  window.__userPickedCategory = true;
  activeClientCategory = ['Mensal', 'Avulso', 'Parceria', 'ALL'].includes(cat) ? cat : 'Mensal';
  document.querySelectorAll('[data-client-category]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-client-category') === activeClientCategory);
  });
  renderDashboard();
}

window.setClientCategory = setClientCategory;

function renderDashboard() {
  populateContractMonthFilters();

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const postsSearchQuery = (document.getElementById('postsSearchInput')?.value || '').trim().toLowerCase();
  const monthFilter = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('globalPostStatusFilter')?.value || 'ALL';
  const clientFilter = document.getElementById('globalClientFilter')?.value || 'ALL';
  const clientStatusFilter = document.getElementById('globalClientStatusFilter')?.value || 'ALL';
  const archivedFilter = document.getElementById('globalArchivedFilter')?.value || 'HIDE';
  const portfolioConditionFilter = document.getElementById('globalPortfolioConditionFilter')?.value || 'ALL';
  const clientSort = document.getElementById('globalClientSort')?.value || 'name_asc';
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
  if (clientStatusFilter !== 'ALL') activeFilterCount++;
  if (archivedFilter !== 'HIDE') activeFilterCount++;
  if (portfolioConditionFilter !== 'ALL') activeFilterCount++;
  if (clientSort !== 'name_asc') activeFilterCount++;
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

  // 1. Filtra clientes por busca, status do cliente, arquivamento e período do contrato
  const clientsInPeriod = appData.clients.filter(c => {
    const archived = isClientArchived(c);
    if (archivedFilter === 'HIDE' && archived) return false;
    if (archivedFilter === 'ONLY' && !archived) return false;

    if (clientStatusFilter !== 'ALL' && getClientStatus(c) !== clientStatusFilter) return false;

    if (searchQuery) {
      const nameMatch = (c.name || '').toLowerCase().includes(searchQuery);
      const companyMatch = (c.company || '').toLowerCase().includes(searchQuery);
      const instaMatch = (c.instagram || '').toLowerCase().includes(searchQuery);
      if (!nameMatch && !companyMatch && !instaMatch) return false;
    }

    if (monthFilter !== 'ALL' && portfolioConditionFilter !== 'NO_CONTRACT') {
      const hasContractInMonth = (c.contracts || []).some(cnt => {
        if (!includeCancelled && cnt.status === 'Cancelado') return false;
        return contractMatchesPeriod(cnt, monthFilter);
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
      return linked ? contractMatchesPeriod(linked, monthFilter) : false;
    });

    clientPostsInMonth.forEach(p => {
      funnelCounts.ALL += 1;
      if (funnelCounts[p.status] !== undefined) {
        funnelCounts[p.status] += 1;
      }
    });
  });

  // Se ainda houver acordos legados sem classificação e nenhum Mensal classificado, exibe 'Todos' automaticamente para não ocultar os clientes existentes
  const legacyList = getUnclassifiedLegacyContracts();
  const hasAnyMensal = (appData.clients || []).some(c => (c.contracts || []).some(cnt => cnt.agreementType === 'Mensal'));
  if (!hasAnyMensal && legacyList.length > 0 && activeClientCategory === 'Mensal' && !window.__userPickedCategory) {
    activeClientCategory = 'ALL';
    document.querySelectorAll('[data-client-category]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-client-category') === activeClientCategory);
    });
  }

  // 2. Filtra clientes exibidos por categoria, status de postagem e situação da carteira
  const filteredClients = clientsInPeriod.filter(c => {
    const m = getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), activeClientCategory);

    if (activeClientCategory !== 'ALL' && m.contractBreakdowns.length === 0) return false;

    if (portfolioConditionFilter === 'WITH_REMAINING' && m.remaining <= 0) return false;
    if (portfolioConditionFilter === 'COMPLETED' && !(m.contractBreakdowns.length > 0 && m.remaining === 0 && m.totalContracted > 0)) return false;
    if (portfolioConditionFilter === 'CONTRACT_NO_POSTS') {
      const hasPostsInScope = m.contractBreakdowns.some(b => b.metrics.totalLinked > 0);
      if (m.contractBreakdowns.length === 0 || hasPostsInScope) return false;
    }
    if (portfolioConditionFilter === 'NO_CONTRACT' && m.contractBreakdowns.length > 0) return false;

    if (statusFilter === 'ALL') return true;
    const clientPostsInMonth = (c.posts || []).filter(p => {
      const linked = getLinkedContractForPost(c, p);
      if (!includeCancelled && linked && linked.status === 'Cancelado') return false;
      if (activeClientCategory !== 'ALL' && (!linked || linked.agreementType !== activeClientCategory)) return false;
      if (monthFilter === 'ALL') return true;
      return linked ? contractMatchesPeriod(linked, monthFilter) : false;
    });
    return clientPostsInMonth.some(p => p.status === statusFilter);
  });

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Atualiza contadores das visões internas (Mensais ativos, Avulsos, Parceiros, Todos)
  const countCategoryClients = (list, cat) => list.filter(c => (
    getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), cat).contractBreakdowns.length > 0
  )).length;
  const countOtherClients = (list) => list.filter(c => {
    const mAll = getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), 'ALL');
    return !mAll.contractBreakdowns.some(b => ['Mensal', 'Avulso', 'Parceria'].includes(b.contract.agreementType));
  }).length;
  const countAllCategoryEntries = (list) => (
    countCategoryClients(list, 'Mensal') +
    countCategoryClients(list, 'Avulso') +
    countCategoryClients(list, 'Parceria') +
    countOtherClients(list)
  );

  setTxt('catCountMensal', countCategoryClients(clientsInPeriod, 'Mensal'));
  setTxt('catCountAvulso', countCategoryClients(clientsInPeriod, 'Avulso'));
  setTxt('catCountParceria', countCategoryClients(clientsInPeriod, 'Parceria'));
  setTxt('catCountAll', countAllCategoryEntries(clientsInPeriod));

  // Banner de classificação de acordos legados (sem tipo_acordo definido)
  const legacyBanner = document.getElementById('legacyClassificationBanner');
  const legacyText = document.getElementById('legacyClassificationText');
  if (legacyBanner) {
    legacyBanner.classList.toggle('hidden', legacyList.length === 0);
    if (legacyText && legacyList.length > 0) {
      legacyText.textContent = `${legacyList.length} acordo(s) antigo(s) aguardando classificação (Mensal, Avulso ou Parceria).`;
    }
  }

  // 3. Ordena clientes conforme seleção
  filteredClients.sort((a, b) => {
    if (clientSort === 'remaining_desc') {
      return getClientMetrics(b, monthFilter, includeCancelled).remaining - getClientMetrics(a, monthFilter, includeCancelled).remaining;
    }
    if (clientSort === 'progress_asc') {
      return getClientMetrics(a, monthFilter, includeCancelled).percentage - getClientMetrics(b, monthFilter, includeCancelled).percentage;
    }
    if (clientSort === 'last_post_desc' || clientSort === 'last_post_asc') {
      const da = getClientLastPublishedDates(a, monthFilter, includeCancelled).lastAll || '';
      const db = getClientLastPublishedDates(b, monthFilter, includeCancelled).lastAll || '';
      if (!da && !db) return (a.name || '').localeCompare(b.name || '', 'pt-BR');
      if (!da) return 1;
      if (!db) return -1;
      return clientSort === 'last_post_desc' ? db.localeCompare(da) : da.localeCompare(db);
    }
    return (a.name || '').localeCompare(b.name || '', 'pt-BR');
  });

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
  let totalContractsCount = 0;

  filteredClients.forEach(client => {
    const m = getClientMetrics(client, monthFilter, includeCancelled, getLocalTodayISO(), activeClientCategory);
    totalContracted += m.totalContracted;
    totalPublished += m.totalPublished;
    totalRemaining += m.remaining;
    totalExcess += m.totalExcess;
    totalToProduce += m.countPendente;
    totalContractsCount += m.contractBreakdowns.length;
  });

  const displayedClientsCount = activeClientCategory === 'ALL'
    ? countAllCategoryEntries(filteredClients)
    : filteredClients.length;

  setTxt('statTotalClients', displayedClientsCount);
  const clientWord = displayedClientsCount === 1 ? 'cliente' : 'clientes';
  const contractWord = totalContractsCount === 1 ? 'contrato' : 'contratos';
  setTxt('statClientsWord', `${clientWord} · ${totalContractsCount} ${contractWord}`);
  setTxt('statTotalContracted', totalContracted);
  setTxt('statTotalPublished', totalPublished);
  setTxt('statTotalPending', totalRemaining);
  setTxt('statToProduceSub', `A produzir (status Pendente): ${totalToProduce}`);
  setTxt('statExcessSub', totalExcess > 0 ? `+${totalExcess} excedente(s)` : '');

  if (clientsViewMode === 'table') {
    renderClientsTable(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled);
  } else {
    renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled);
  }
  renderGlobalPostsFeed(monthFilter, statusFilter, clientFilter, postsSearchQuery || searchQuery, includeCancelled);
}

function renderClientsTable(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled) {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  if (filteredClients.length === 0) {
    renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled);
    return;
  }

  const rowsHtml = [];
  filteredClients.forEach(client => {
    const m = getClientMetrics(client, monthFilter, includeCancelled, getLocalTodayISO(), activeClientCategory);
    const lastDates = getClientLastPublishedDates(client, monthFilter, includeCancelled);
    const lastPostDisplay = monthFilter !== 'ALL'
      ? (lastDates.lastInPeriod ? `${formatDateBR(lastDates.lastInPeriod)} (período)` : (lastDates.lastAll ? `${formatDateBR(lastDates.lastAll)} (geral)` : '—'))
      : (lastDates.lastAll ? formatDateBR(lastDates.lastAll) : '—');
    const clientStatus = getClientStatus(client);
    const statusTag = isClientArchived(client) ? 'Arquivado' : (clientStatus !== 'Ativo' ? clientStatus : '');

    if (m.contractBreakdowns.length === 0) {
      rowsHtml.push(`
        <tr>
          <td>
            <button type="button" class="post-client-link" onclick="openClientProfile('${escapeHtml(client.id)}')">${escapeHtml(client.name)}</button>
            ${statusTag ? `<span class="badge badge-concluido" style="margin-left:6px;">${escapeHtml(statusTag)}</span>` : ''}
          </td>
          <td><span style="color:var(--text-secondary);">Sem contrato no período</span></td>
          <td class="tabular-nums">0</td>
          <td class="tabular-nums">0</td>
          <td class="tabular-nums">0</td>
          <td class="tabular-nums">—</td>
          <td class="tabular-nums">0%</td>
          <td class="tabular-nums">${escapeHtml(lastPostDisplay)}</td>
          <td class="table-actions-cell">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openClientProfile('${escapeHtml(client.id)}')">Perfil</button>
          </td>
        </tr>
      `);
      return;
    }

    m.contractBreakdowns.forEach(({ contract, metrics: cm }) => {
      const label = getContractDisplayLabel(contract);
      const typeTag = getAgreementTypeBadgeText(contract);
      rowsHtml.push(`
        <tr>
          <td>
            <button type="button" class="post-client-link" onclick="openClientProfile('${escapeHtml(client.id)}')">${escapeHtml(client.name)}</button>
            ${statusTag ? `<span class="badge badge-concluido" style="margin-left:6px;">${escapeHtml(statusTag)}</span>` : ''}
          </td>
          <td><strong>${escapeHtml(label)}</strong> <span class="badge badge-concluido" style="margin-left:4px;">${escapeHtml(typeTag)}</span></td>
          <td class="tabular-nums">${cm.hasDefinedQuantity ? cm.totalContracted : 'Livre'}</td>
          <td class="tabular-nums">${cm.published}</td>
          <td class="tabular-nums">${cm.hasDefinedQuantity ? cm.remaining : '—'}</td>
          <td class="tabular-nums">${cm.hasDefinedQuantity ? (cm.excess > 0 ? `+${cm.excess}` : '0') : '—'}</td>
          <td class="tabular-nums">${cm.hasDefinedQuantity ? `${cm.percentage}%` : '—'}</td>
          <td class="tabular-nums">${escapeHtml(lastPostDisplay)}</td>
          <td class="table-actions-cell">
            <button type="button" class="btn btn-primary btn-sm" onclick="openQuickPostFromCard('${escapeHtml(client.id)}', '${escapeHtml(contract.id)}')">+ Postar</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openDeliveryReportModal('${escapeHtml(client.id)}', '${escapeHtml(contract.id)}')">Relatório</button>
          </td>
        </tr>
      `);
    });
  });

  grid.innerHTML = `
    <div class="desktop-clients-table-wrap">
      <table class="desktop-clients-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Período / Contrato</th>
            <th>Contratadas</th>
            <th>Publicadas</th>
            <th>Restantes</th>
            <th>Excedentes</th>
            <th>Progresso</th>
            <th>Última publicação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderSingleClientCardHtml(client, monthFilter, includeCancelled, categoryScope = 'ALL') {
  const m = getClientMetrics(client, monthFilter, includeCancelled, getLocalTodayISO(), categoryScope);
  const avatarHtml = renderAvatarHtml(client);

  const cardStateClass = m.hasOverdueContract
    ? 'card-overdue'
    : (m.hasDueSoonContract ? 'card-due-soon' : '');

  const instaFormatted = formatInstagram(client.instagram);

  let periodLabel = '';
  let deliveredLabel = '';
  let remainingLabel = '';

  if (m.contractBreakdowns.length === 0) {
    periodLabel = '<span class="badge-period-pill">Sem contrato ativo</span>';
    deliveredLabel = '0 de 0 entregues';
    remainingLabel = '0 restantes';
  } else if (m.contractBreakdowns.length === 1) {
    const { contract, metrics: cm } = m.contractBreakdowns[0];
    const dispLabel = getContractDisplayLabel(contract);
    const typeTag = getAgreementTypeBadgeText(contract);
    const qtySuffix = cm.hasDefinedQuantity ? ` (${cm.totalContracted})` : '';
    periodLabel = `<span class="badge-period-pill">${escapeHtml(dispLabel)}</span><span class="badge-agreement-pill">${escapeHtml(typeTag)}${qtySuffix}</span>`;
    if (!cm.hasDefinedQuantity) {
      deliveredLabel = `${cm.published} publicadas`;
      remainingLabel = 'Sem limite definido';
    } else {
      deliveredLabel = `${cm.published} de ${cm.totalContracted} entregues`;
      remainingLabel = `${cm.remaining} ${cm.remaining === 1 ? 'restante' : 'restantes'}${cm.excess > 0 ? ` (+${cm.excess} extra)` : ''}`;
    }
  } else {
    const latestLabel = getContractDisplayLabel(m.contractBreakdowns[0].contract);
    periodLabel = `<span class="badge-period-pill">${m.contractBreakdowns.length} contratos (atual: ${escapeHtml(latestLabel)})</span>`;
    if (m.hasUndefinedPartnership && m.totalContracted === 0) {
      deliveredLabel = `${m.totalPublished} publicadas`;
      remainingLabel = 'Sem limite definido';
    } else {
      deliveredLabel = `${m.totalPublished} de ${m.totalContracted} entregues`;
      remainingLabel = `${m.remaining} ${m.remaining === 1 ? 'restante' : 'restantes'}${m.totalExcess > 0 ? ` (+${m.totalExcess} extra)` : ''}`;
    }
  }

  const subtitleText = instaFormatted || client.company || '';
  const targetContractId = m.contractBreakdowns.length === 1 ? m.contractBreakdowns[0].contract.id : '';

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
        <div class="ios-contract-pills-left">${periodLabel}</div>
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

      <button type="button" class="ios-register-post-btn" onclick="openQuickPostFromCard('${escapeHtml(client.id)}', '${escapeHtml(targetContractId)}')">
        + Registrar postagem
      </button>
    </article>
  `;
}

function renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery, includeCancelled) {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  if (filteredClients.length === 0) {
    const hasFilter = searchQuery || monthFilter !== 'ALL' || statusFilter !== 'ALL';
    const isCategoryEmpty = !hasFilter && activeClientCategory !== 'ALL';
    const catTitle = activeClientCategory === 'Mensal'
      ? 'Nenhum cliente mensal ativo'
      : (activeClientCategory === 'Avulso' ? 'Nenhum acordo avulso encontrado' : 'Nenhuma parceria cadastrada');
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>${isCategoryEmpty ? catTitle : (hasFilter ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado')}</h4>
        <p>${isCategoryEmpty
          ? 'Você pode cadastrar um novo acordo ou consultar as outras categorias da carteira.'
          : (hasFilter ? 'Altere ou limpe os filtros aplicados para ver outros clientes.' : 'Cadastre seu primeiro cliente para acompanhar contratos e entregas.')}</p>
        ${isCategoryEmpty
          ? `<div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
               <button type="button" class="btn btn-secondary" onclick="setClientCategory('Avulso')">Ver Avulsos</button>
               <button type="button" class="btn btn-secondary" onclick="setClientCategory('Parceria')">Ver Parceiros</button>
               <button type="button" class="btn btn-secondary" onclick="setClientCategory('ALL')">Ver Todos</button>
             </div>`
          : (hasFilter
              ? `<button type="button" class="btn btn-secondary" onclick="resetGlobalFilters()">Limpar filtros</button>`
              : `<button type="button" class="btn btn-primary" onclick="openClientModal()">+ Cliente</button>`)}
      </div>
    `;
    return;
  }

  if (activeClientCategory !== 'ALL') {
    grid.innerHTML = filteredClients
      .map(client => renderSingleClientCardHtml(client, monthFilter, includeCancelled, activeClientCategory))
      .join('');
    return;
  }

  // Na visão "Todos", separa sempre por categoria com destaque inicial para Pacotes Mensais Ativos
  const mensalClients = filteredClients.filter(c => getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), 'Mensal').contractBreakdowns.length > 0);
  const avulsoClients = filteredClients.filter(c => getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), 'Avulso').contractBreakdowns.length > 0);
  const parceriaClients = filteredClients.filter(c => getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), 'Parceria').contractBreakdowns.length > 0);
  const otherClients = filteredClients.filter(c => {
    const mAll = getClientMetrics(c, monthFilter, includeCancelled, getLocalTodayISO(), 'ALL');
    const hasClassified = mAll.contractBreakdowns.some(b => ['Mensal', 'Avulso', 'Parceria'].includes(b.contract.agreementType));
    return !hasClassified;
  });

  const sections = [];
  if (mensalClients.length > 0) {
    sections.push(`
      <div class="clients-group-header clients-group-highlight">
        <span>PACOTES MENSAIS ATIVOS</span>
        <span class="clients-group-count">${mensalClients.length} ${mensalClients.length === 1 ? 'ativo' : 'ativos'}</span>
      </div>
      ${mensalClients.map(c => renderSingleClientCardHtml(c, monthFilter, includeCancelled, 'Mensal')).join('')}
    `);
  }
  if (avulsoClients.length > 0) {
    sections.push(`
      <div class="clients-group-header">
        <span>CLIENTES AVULSOS</span>
        <span class="clients-group-count">${avulsoClients.length}</span>
      </div>
      ${avulsoClients.map(c => renderSingleClientCardHtml(c, monthFilter, includeCancelled, 'Avulso')).join('')}
    `);
  }
  if (parceriaClients.length > 0) {
    sections.push(`
      <div class="clients-group-header">
        <span>PARCEIROS</span>
        <span class="clients-group-count">${parceriaClients.length}</span>
      </div>
      ${parceriaClients.map(c => renderSingleClientCardHtml(c, monthFilter, includeCancelled, 'Parceria')).join('')}
    `);
  }
  if (otherClients.length > 0) {
    sections.push(`
      <div class="clients-group-header">
        <span>OUTROS / SEM ACORDO NO PERÍODO</span>
        <span class="clients-group-count">${otherClients.length}</span>
      </div>
      ${otherClients.map(c => renderSingleClientCardHtml(c, monthFilter, includeCancelled, 'ALL')).join('')}
    `);
  }

  grid.innerHTML = sections.join('');
}

// ==================== RENDERIZAÇÃO DE CARDS DE POSTAGEM (MOBILE-FIRST) ====================
/**
 * Componente padronizado de Card de Postagem usado tanto no Perfil quanto na Tela Global de Postagens
 */
function buildPostLinkPreviewData(url = '', postType = '') {
  const raw = String(url || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  let platform = 'Link da publicação';
  let kind = 'link';

  if (lower.includes('instagram.com/reel')) {
    platform = 'Instagram Reels';
    kind = 'reel';
  } else if (lower.includes('instagram.com')) {
    platform = postType === 'Carrossel' ? 'Instagram Carrossel' : 'Instagram Post';
    kind = 'ig';
  } else if (lower.includes('tiktok.com')) {
    platform = 'TikTok';
    kind = 'reel';
  } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    platform = 'YouTube';
    kind = 'reel';
  }

  let slug = raw.replace(/^https?:\/\/(www\.)?/i, '');
  if (slug.length > 42) slug = `${slug.slice(0, 39)}...`;
  return { platform, kind, slug, url: raw };
}

async function copyTextToClipboard(text = '', successMsg = 'Link copiado!') {
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
    showToast(successMsg);
  } catch (e) {
    showToast('Não foi possível copiar automaticamente.');
  }
}

function renderPostCardHtml(client, post, postPeriod, isGlobalView = false) {
  const statusBadgeClass = getPostStatusBadgeClass(post.status);
  const menuId = `kebab_post_${isGlobalView ? 'g_' : 'p_'}${post.id}`;
  const preview = buildPostLinkPreviewData(post.link, post.type);
  const insta = formatInstagram(client.instagram);
  const initials = getInitials(client.name);

  const previewHtml = preview
    ? `<div class="post-link-preview">
         <div class="post-link-thumb post-link-thumb-${preview.kind}" aria-hidden="true">
           ${preview.kind === 'reel'
             ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>'
             : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'}
         </div>
         <div class="post-link-meta">
           <span class="post-link-platform">${escapeHtml(preview.platform)}</span>
           <span class="post-link-slug">${escapeHtml(preview.slug)}</span>
           ${insta ? `<span class="post-link-handle">${escapeHtml(insta)}</span>` : ''}
         </div>
         <a href="${escapeHtml(preview.url)}" target="_blank" rel="noopener noreferrer" class="post-external-link">
           <span>Abrir</span>
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
             <line x1="7" y1="17" x2="17" y2="7"></line>
             <polyline points="7 7 17 7 17 17"></polyline>
           </svg>
         </a>
       </div>`
    : '';

  return `
    <article class="post-card">
      <div class="post-card-top">
        <div class="post-meta-left">
          <select class="post-status-quick-select ${statusBadgeClass}"
                  onchange="quickChangePostStatus('${escapeHtml(client.id)}', '${escapeHtml(post.id)}', this.value)"
                  aria-label="Alterar status da postagem">
            <option value="Pendente" ${post.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
            <option value="Em produção" ${post.status === 'Em produção' ? 'selected' : ''}>Em produção</option>
            <option value="Agendado" ${post.status === 'Agendado' ? 'selected' : ''}>Agendado</option>
            <option value="Publicado" ${post.status === 'Publicado' ? 'selected' : ''}>Publicado</option>
          </select>
          <span class="post-format-pill">${escapeHtml(post.type)}</span>
        </div>

        <div class="post-card-top-right">
          <span class="post-date tabular-nums">${escapeHtml(formatDateBR(post.date))}</span>
          <div class="kebab-wrap">
            <button type="button" class="btn-icon-only" onclick="toggleKebabMenu('${escapeHtml(menuId)}', event)" aria-label="Opções da postagem">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
            <div id="${escapeHtml(menuId)}" class="dropdown-menu hidden">
              ${preview ? `<button type="button" class="dropdown-item" onclick="copyTextToClipboard('${escapeHtml(preview.url)}', 'Link copiado!'); closeAllKebabMenus();">Copiar link</button>` : ''}
              <button type="button" class="dropdown-item" onclick="openPostModal('${escapeHtml(post.id)}', '${escapeHtml(client.id)}')">
                Editar postagem
              </button>
              <button type="button" class="dropdown-item danger" onclick="confirmDeletePost('${escapeHtml(post.id)}', '${escapeHtml(client.id)}')">
                Excluir postagem
              </button>
            </div>
          </div>
        </div>
      </div>

      ${(isGlobalView || postPeriod) ? `
        <div class="post-client-context-row">
          ${isGlobalView ? `
            <button type="button" class="post-client-link" onclick="openClientProfile('${escapeHtml(client.id)}')">
              <span class="post-client-mini-avatar">${client.avatar ? `<img src="${escapeHtml(client.avatar)}" alt="">` : escapeHtml(initials)}</span>
              <span>${escapeHtml(client.name)}</span>
            </button>
          ` : ''}
          ${postPeriod ? `<span class="post-period-pill">${escapeHtml(postPeriod)}</span>` : ''}
        </div>
      ` : ''}

      <h3 class="post-title">${escapeHtml(post.title)}</h3>

      ${previewHtml}
    </article>
  `;
}

const VALID_POST_STATUSES = ['Pendente', 'Em produção', 'Agendado', 'Publicado'];

async function quickChangePostStatus(clientId, postId, newStatus) {
  if (!VALID_POST_STATUSES.includes(newStatus)) return;
  const client = (appData.clients || []).find(c => c.id === clientId);
  if (!client) return;
  const post = (client.posts || []).find(p => p.id === postId);
  if (!post || post.status === newStatus) return;

  const previousStatus = post.status;
  post.status = newStatus;

  if (currentClientId === client.id) {
    renderClientProfile();
  }
  renderDashboard();

  try {
    if (supabase) {
      const { error } = await supabase
        .from('postagens')
        .update({ status: newStatus })
        .eq('id', postId);
      if (error) throw error;
    } else {
      saveData();
    }
    recordAuditEvent('postagem', postId, 'alteracao_status', { titulo: post.title, de: previousStatus, para: newStatus });
    showToast(`Status alterado para "${newStatus}".`);
  } catch (err) {
    post.status = previousStatus;
    if (currentClientId === client.id) {
      renderClientProfile();
    }
    renderDashboard();
    showToast('Erro ao atualizar status: ' + (err.message || 'Tente novamente.'));
  }
}

window.quickChangePostStatus = quickChangePostStatus;
window.clearAppPwaCache = clearAppPwaCache;

async function clearAppPwaCache() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    showToast('Cache atualizado! Recarregando...');
    setTimeout(() => window.location.reload(), 600);
  } catch (err) {
    showToast('Não foi possível limpar o cache: ' + (err.message || 'Erro desconhecido.'));
  }
}

function getPeriodFromISODate(isoDate) {
  const m = String(isoDate || '').match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (!m) return '';
  const monthIdx = Number(m[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return '';
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[monthIdx]}/${m[1]}`;
}

function renderGlobalPostsFeed(monthFilter, statusFilter, clientFilter, queryStr, includeCancelled) {
  const listEl = document.getElementById('globalPostsList');
  const countLabel = document.getElementById('globalPostsCountLabel');
  const periodMode = document.getElementById('globalPostsPeriodMode')?.value || 'contract';
  const periodModeNotice = document.getElementById('postsPeriodModeNotice');
  if (!listEl) return;

  if (periodModeNotice) {
    periodModeNotice.classList.toggle('hidden', !(periodMode === 'date' && monthFilter !== 'ALL'));
  }

  const q = (queryStr || '').trim().toLowerCase();
  const allMatchingPosts = [];

  appData.clients.forEach(client => {
    if (clientFilter !== 'ALL' && client.id !== clientFilter) return;

    (client.posts || []).forEach(post => {
      const linked = getLinkedContractForPost(client, post);
      if (!includeCancelled && linked && linked.status === 'Cancelado') return;
      const postContractPeriod = linked ? normalizePeriod(linked.period) : '';
      const postDatePeriod = getPeriodFromISODate(post.date);

      if (monthFilter !== 'ALL') {
        const matches = periodMode === 'date'
          ? periodLabelsMatch(postDatePeriod, monthFilter)
          : (linked ? contractMatchesPeriod(linked, monthFilter) : false);
        if (!matches) return;
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

      allMatchingPosts.push({ client, post, postPeriod: postContractPeriod });
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

function goToPostsWithStatus(status) {
  const select = document.getElementById('globalPostStatusFilter');
  if (select) {
    select.value = status;
  }
  setDashboardMode('posts');
}

function updateMiniCalendarBadge() {
  const monthEl = document.getElementById('miniCalMonth');
  const dayEl = document.getElementById('miniCalDay');
  if (!monthEl || !dayEl) return;
  const now = new Date();
  const shortMonths = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  monthEl.textContent = shortMonths[now.getMonth()] || 'HOJE';
  dayEl.textContent = String(now.getDate()).padStart(2, '0');
}

function resetGlobalFilters() {
  const searchInput = document.getElementById('searchInput');
  const postsSearchInput = document.getElementById('postsSearchInput');
  const monthSelect = document.getElementById('globalContractMonthFilter');
  const sheetMonthSelect = document.getElementById('sheetContractMonthFilter');
  const statusSelect = document.getElementById('globalPostStatusFilter');
  const clientSelect = document.getElementById('globalClientFilter');
  const clientStatusSelect = document.getElementById('globalClientStatusFilter');
  const archivedSelect = document.getElementById('globalArchivedFilter');
  const conditionSelect = document.getElementById('globalPortfolioConditionFilter');
  const sortSelect = document.getElementById('globalClientSort');
  const cancelledToggle = document.getElementById('toggleShowCancelled');

  if (searchInput) searchInput.value = '';
  if (postsSearchInput) postsSearchInput.value = '';
  if (monthSelect) monthSelect.value = 'ALL';
  if (sheetMonthSelect) sheetMonthSelect.value = 'ALL';
  if (statusSelect) statusSelect.value = 'ALL';
  if (clientSelect) clientSelect.value = 'ALL';
  if (clientStatusSelect) clientStatusSelect.value = 'ALL';
  if (archivedSelect) archivedSelect.value = 'HIDE';
  if (conditionSelect) conditionSelect.value = 'ALL';
  if (sortSelect) sortSelect.value = 'name_asc';
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

  const avatarHtml = renderAvatarHtml(client, 'avatar-lg');
  const instaFormatted = formatInstagram(client.instagram);
  const instaUrl = getInstagramUrl(client.instagram);
  const waUrl = getWhatsAppUrl(client.phone);
  const profileMenuId = `kebab_profile_${client.id}`;

  // A. Topo do Perfil (Voltar, Logo NasRuas e Menu) + Card de Identidade (estilo Stitch)
  document.getElementById('profileHeaderCard').innerHTML = `
    <div class="profile-topbar-nav-row">
      <button type="button" class="profile-back-btn" onclick="backToDashboard()" aria-label="Voltar para Clientes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Voltar</span>
      </button>

      <img src="/logo-nasruas.png" alt="NasRuas de ITZ" class="profile-topbar-logo">

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
          <button type="button" class="dropdown-item" onclick="toggleArchiveClient('${escapeHtml(client.id)}')">
            ${isClientArchived(client) ? 'Restaurar cliente' : 'Arquivar cliente'}
          </button>
          <button type="button" class="dropdown-item danger" onclick="confirmDeleteClient('${escapeHtml(client.id)}')">
            Excluir cliente
          </button>
        </div>
      </div>
    </div>

    <div class="ios-client-card profile-identity-card">
      <div class="profile-identity-top">
        ${avatarHtml}
        <div class="profile-topbar-titles">
          <h1 class="profile-topbar-name">${escapeHtml(client.name)}</h1>
          ${instaFormatted
            ? `<a href="${escapeHtml(instaUrl)}" target="_blank" rel="noopener noreferrer" class="client-handle">${escapeHtml(instaFormatted)}</a>`
            : ''}
          ${client.company ? `<span class="badge-period-pill">${escapeHtml(client.company)}</span>` : ''}
        </div>
      </div>
      <div class="profile-identity-actions">
        ${waUrl
          ? `<a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">WhatsApp</a>`
          : `<button type="button" class="btn btn-secondary btn-sm" disabled>Sem WhatsApp</button>`}
        <button type="button" class="btn btn-secondary btn-sm" onclick="openClientModal('${escapeHtml(client.id)}')">
          Editar cliente
        </button>
      </div>
    </div>
  `;

  // Badge de status e pílula de tipo do acordo
  const deliveryBadge = document.getElementById('profileDeliveryBadge');
  if (deliveryBadge) {
    deliveryBadge.className = `badge ${m.overallBadgeClass}`;
    deliveryBadge.textContent = m.overallDeliveryState;
  }
  const typePill = document.getElementById('profileAgreementTypePill');
  if (typePill) {
    const firstContract = m.contractBreakdowns[0]?.contract;
    if (firstContract) {
      typePill.textContent = getAgreementTypeBadgeText(firstContract);
      typePill.classList.remove('hidden');
    } else {
      typePill.classList.add('hidden');
    }
  }

  renderProfileMonthlyHistory(client, includeCancelled);

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
      <div class="ios-progress-track">
        <div class="ios-progress-fill ${m.overallFillClass}" style="width: ${m.percentage}%"></div>
      </div>
      <div class="ios-client-stats-row tabular-nums">
        <span class="ios-stats-delivered">${m.totalPublished} de ${m.totalContracted} entregues${m.totalExcess > 0 ? ` (+${m.totalExcess} extra)` : ''}</span>
        <span class="ios-stats-remaining">${m.percentage}% concluído</span>
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
    const durationMonths = inferContractDurationMonths(contract);
    const menuId = `kebab_cnt_${contract.id}`;

    return `
      <div class="contract-line-item">
        <div class="contract-mini-info">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="contract-mini-period">${escapeHtml(contract.period)}</span>
            ${durationMonths > 1 ? `<span class="badge badge-concluido">${durationMonths} meses</span>` : ''}
            <span class="badge ${adminBadgeClass}">${escapeHtml(contract.status)}</span>
            <span class="badge ${cm.deliveryBadgeClass}">${escapeHtml(cm.deliveryState)}</span>
          </div>
          <div class="contract-mini-sub tabular-nums">
            ${cm.published} de ${cm.totalContracted} entregues • ${cm.remaining} restantes
            ${formattedVal ? ` • ${formattedVal}` : ''}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openContractModal('${escapeHtml(contract.id)}')">
            Editar
          </button>
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
      </div>
    `;
  }).join('');
}

function renderProfileMonthlyHistory(client, includeCancelled = false) {
  const container = document.getElementById('profileMonthlyHistoryList');
  if (!container || !client) return;

  const sortedContracts = sortContractsChronologically(client.contracts || [], true)
    .filter(c => includeCancelled || c.status !== 'Cancelado');

  if (sortedContracts.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:var(--text-secondary); padding: 4px 0;">Nenhum contrato registrado no histórico.</p>`;
    return;
  }

  container.innerHTML = sortedContracts.map(c => {
    const cm = getContractMetrics(client, c);
    return `
      <div class="monthly-history-row">
        <div class="monthly-history-info">
          <span class="monthly-history-period">${escapeHtml(c.period)} <span class="badge ${cm.deliveryBadgeClass}" style="margin-left:6px;">${escapeHtml(cm.deliveryState)}</span></span>
          <span class="monthly-history-metrics">${cm.totalContracted} contratadas | ${cm.published} publicadas | ${cm.remaining} restantes${cm.excess > 0 ? ` | +${cm.excess} excedente(s)` : ''}</span>
        </div>
        <div class="monthly-history-actions">
          <button type="button" class="btn btn-secondary btn-sm" onclick="openContractModal('${escapeHtml(c.id)}')">Editar</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="filterProfileByContractMonth('${escapeHtml(c.period)}')">Publicações</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="openDeliveryReportModal('${escapeHtml(client.id)}', '${escapeHtml(c.id)}')">Relatório</button>
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

/**
 * Suggests post type, date (today if empty), and title from a pasted URL
 * when creating a new post, without overwriting manual user input.
 */
function autofillPostFieldsFromLink() {
  const postId = document.getElementById('postId')?.value || '';
  if (postId) return;

  const linkVal = (document.getElementById('postLink')?.value || '').trim();
  if (!/^https?:\/\//i.test(linkVal)) return;

  let parsedUrl;
  try {
    parsedUrl = new URL(linkVal);
  } catch {
    return;
  }

  const host = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname.toLowerCase();
  const typeEl = document.getElementById('postType');
  const dateEl = document.getElementById('postDate');
  const titleEl = document.getElementById('postTitle');

  let detectedType = '';
  if (host.includes('instagram.com')) {
    if (path.includes('/reel/') || path.includes('/reels/')) {
      detectedType = 'Reels';
    } else if (path.includes('/stories/')) {
      detectedType = 'Story';
    } else if (path.includes('/p/')) {
      detectedType = (typeEl && typeEl.value === 'Carrossel') ? 'Carrossel' : 'Foto';
    }
  } else if (host.includes('tiktok.com')) {
    detectedType = 'Reels';
  } else if (host.includes('youtube.com') || host.includes('youtu.be')) {
    detectedType = path.includes('/shorts/') ? 'Reels' : 'Vídeo';
  } else if (host.includes('vimeo.com')) {
    detectedType = 'Vídeo';
  }

  if (detectedType && typeEl) {
    typeEl.value = detectedType;
  }

  if (dateEl && !dateEl.value) {
    dateEl.value = getLocalTodayISO();
  }

  if (titleEl && (!titleEl.value.trim() || titleEl.dataset.autoSuggested === 'true')) {
    const isoDate = dateEl?.value || getLocalTodayISO();
    const parts = isoDate.split('-');
    const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : formatDateBR(isoDate);

    const isSocialIdHost =
      host.includes('instagram.com') ||
      host.includes('tiktok.com') ||
      host.includes('youtube.com') ||
      host.includes('youtu.be');

    let slugTitle = '';
    if (!isSocialIdHost) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      const lastSeg = segments[segments.length - 1] || '';
      if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(lastSeg) && !/^[a-f0-9-]{20,}$/i.test(lastSeg)) {
        const words = lastSeg.replace(/[-_]+/g, ' ').trim();
        slugTitle = words.charAt(0).toUpperCase() + words.slice(1);
      }
    }

    if (slugTitle) {
      titleEl.value = slugTitle;
    } else {
      const targetClientId =
        document.getElementById('postTargetClientId')?.value ||
        document.getElementById('postClientSelect')?.value ||
        currentClientId;
      const client = appData.clients.find(c => c.id === targetClientId);
      const clientLabel = client ? (formatInstagram(client.instagram) || client.name) : '';
      const labelType = detectedType || typeEl?.value || 'Postagem';
      titleEl.value = clientLabel ? `${labelType} — ${clientLabel} (${shortDate})` : `${labelType} (${shortDate})`;
    }
    titleEl.dataset.autoSuggested = 'true';
  }
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
  const formatOption = (c) => {
    const typeTag = getAgreementTypeBadgeText(c);
    const label = getContractDisplayLabel(c);
    return `<option value="${escapeHtml(c.id)}">[${escapeHtml(typeTag)}] ${escapeHtml(label)} (${escapeHtml(c.status)})</option>`;
  };
  if (activeContracts.length > 1 && !postId && !preselectedContractId) {
    contractSelect.innerHTML = `<option value="">Selecione o acordo...</option>` +
      contractsForSelect.map(formatOption).join('');
  } else {
    contractSelect.innerHTML = contractsForSelect.map(formatOption).join('');
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
    document.getElementById('postTitle').dataset.autoSuggested = 'false';
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
    document.getElementById('postTitle').dataset.autoSuggested = '';
    document.getElementById('postLink').value = '';
    document.getElementById('postNotes').value = '';
    setPostMoreOptionsExpanded(!isQuickFlow);
  }

  const saveAndAddBtn = document.getElementById('btnSaveAndAddAnotherPost');
  if (saveAndAddBtn) {
    saveAndAddBtn.classList.toggle('hidden', Boolean(postId));
  }
  updatePostSaveButtonText();
  openModal('postModal');
}

let postSubmitKeepOpen = false;

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

    if (postSubmitKeepOpen && !id) {
      postSubmitKeepOpen = false;
      document.getElementById('postTitle').value = '';
      document.getElementById('postLink').value = '';
      document.getElementById('postNotes').value = '';
      document.getElementById('duplicateLinkWarning')?.classList.add('hidden');
      document.getElementById('postTitle')?.focus();
    } else {
      postSubmitKeepOpen = false;
      closeModal('postModal');
    }

    if (supabase) updateDbStatusUI(true);

    if (currentClientId === client.id) {
      renderClientProfile();
    } else {
      renderDashboard();
    }
  } catch (err) {
    postSubmitKeepOpen = false;
    setPersistenceErrorUI(err.message);
    if (errEl) {
      errEl.textContent = 'Não foi possível salvar a postagem: ' + (err.message || 'Erro desconhecido.');
      errEl.classList.remove('hidden');
    }
  } finally {
    postSubmitKeepOpen = false;
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

function generateMultiContractReportData(client, contracts) {
  const insta = formatInstagram(client.instagram);
  const generatedAt = new Date();
  const generatedLabel = `${String(generatedAt.getDate()).padStart(2, '0')}/${String(generatedAt.getMonth() + 1).padStart(2, '0')}/${generatedAt.getFullYear()} às ${String(generatedAt.getHours()).padStart(2, '0')}:${String(generatedAt.getMinutes()).padStart(2, '0')}`;

  let totalContracted = 0;
  let totalPublished = 0;
  let totalRemaining = 0;
  let totalExcess = 0;
  let hasDefinedQty = false;
  const contractIds = new Set();

  contracts.forEach(c => {
    contractIds.add(c.id);
    if (c.status === 'Cancelado') return;
    const cm = getContractMetrics(client, c);
    if (cm.hasDefinedQuantity) {
      hasDefinedQty = true;
      totalContracted += cm.totalContracted;
      totalRemaining += cm.remaining;
      totalExcess += cm.excess;
    }
    totalPublished += cm.published;
  });

  const deliveredTowardContract = Math.max(0, totalContracted - totalRemaining);
  const percentage = (hasDefinedQty && totalContracted > 0)
    ? Math.min(100, Math.round((deliveredTowardContract / totalContracted) * 100))
    : 0;

  const deliveredPosts = (client.posts || [])
    .filter(p => {
      if (p.status !== 'Publicado') return false;
      const linked = getLinkedContractForPost(client, p);
      return linked && contractIds.has(linked.id);
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const periodLabel = contracts.length === 1
    ? getContractDisplayLabel(contracts[0])
    : `${contracts.length} acordos (${contracts.map(c => getContractDisplayLabel(c)).join(', ')})`;

  const lines = [
    'RELATÓRIO DE ENTREGAS',
    `Contato: ${client.name}${insta ? ` (${insta})` : ''}`,
    `Acordo: ${periodLabel}`,
    `Gerado em: ${generatedLabel}`
  ];
  if (hasDefinedQty) {
    lines.push(`Contratadas: ${totalContracted}`);
    lines.push(`Publicadas: ${totalPublished}`);
    lines.push(`Restantes: ${totalRemaining}`);
    lines.push(`Progresso: ${percentage}%`);
    if (totalExcess > 0) lines.push(`Excedente entregue: +${totalExcess}`);
  } else {
    lines.push(`Publicações realizadas: ${totalPublished} (Parceria sem limite definido)`);
  }
  lines.push('');

  if (deliveredPosts.length === 0) {
    lines.push('Nenhuma publicação entregue registrada neste recorte até o momento.');
  } else {
    deliveredPosts.forEach(p => {
      lines.push(`${formatDateBR(p.date)} — [${p.type}] ${p.title}`);
      if (p.link) lines.push(`Link: ${p.link}`);
      lines.push('');
    });
  }

  return {
    text: lines.join('\n').trim(),
    periodLabel,
    generatedLabel,
    cm: { hasDefinedQuantity: hasDefinedQty, totalContracted, published: totalPublished, remaining: totalRemaining, excess: totalExcess, percentage },
    deliveredPosts
  };
}

function getSelectedReportContracts(client) {
  const multiChecked = Boolean(document.getElementById('toggleReportMultiContracts')?.checked);
  const sortedContracts = sortContractsChronologically(client.contracts || [], true);

  if (multiChecked) {
    const checkedIds = Array.from(document.querySelectorAll('input[name="reportMultiContractItem"]:checked'))
      .map(el => el.value);
    const selected = sortedContracts.filter(c => checkedIds.includes(c.id));
    if (selected.length > 0) return selected;
  }

  const contractId = document.getElementById('reportContractSelect')?.value;
  const single = sortedContracts.find(c => c.id === contractId) || sortedContracts[0];
  return single ? [single] : [];
}

function openDeliveryReportModal(clientId = null, preselectedContractId = '') {
  closeAllKebabMenus();
  const resolvedId = clientId || currentClientId;
  const client = appData.clients.find(c => c.id === resolvedId);
  if (!client) return;

  currentReportClientId = client.id;
  const select = document.getElementById('reportContractSelect');
  const multiToggle = document.getElementById('toggleReportMultiContracts');
  const multiWrap = document.getElementById('reportMultiContractsWrap');
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

  if (multiToggle) multiToggle.checked = false;
  if (multiWrap) {
    multiWrap.classList.add('hidden');
    multiWrap.innerHTML = sortedContracts.map(c => `
      <label class="checkbox-inline" style="min-height: 32px;">
        <input type="checkbox" name="reportMultiContractItem" value="${escapeHtml(c.id)}" ${c.id === select.value ? 'checked' : ''} onchange="renderDeliveryReportContent()">
        <span>${escapeHtml(c.period)}</span>
      </label>
    `).join('');
  }

  renderDeliveryReportContent();
  openModal('reportModal');
}

function renderDeliveryReportContent() {
  const client = appData.clients.find(c => c.id === currentReportClientId);
  if (!client) return;

  const selectedContracts = getSelectedReportContracts(client);
  const area = document.getElementById('printableReportArea');
  if (selectedContracts.length === 0 || !area) return;

  const { cm, deliveredPosts, periodLabel, generatedLabel } = generateMultiContractReportData(client, selectedContracts);
  const insta = formatInstagram(client.instagram);

  area.innerHTML = `
    <div class="report-doc-header report-doc-header-branded">
      <div class="report-doc-brand-row">
        <img src="/logo-nasruas.png" alt="NasRuas de ITZ" class="report-brand-logo">
        <div>
          <div class="report-brand-mark">NasRuas de ITZ • Relatório de Entregas</div>
          <div class="report-doc-title">${escapeHtml(client.name)}</div>
          ${insta ? `<div class="report-doc-handle">${escapeHtml(insta)}</div>` : ''}
        </div>
      </div>
      <div class="report-doc-period-box">
        <span class="report-stat-label">Período</span>
        <div class="report-doc-period-val">${escapeHtml(periodLabel)}</div>
        <div class="report-doc-generated">Gerado em ${escapeHtml(generatedLabel)}</div>
      </div>
    </div>

    <div class="report-summary-grid">
      <div class="report-stat-box">
        <span class="report-stat-label">Contratadas</span>
        <strong class="report-stat-val tabular-nums">${cm.hasDefinedQuantity ? cm.totalContracted : 'Livre'}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Publicadas</span>
        <strong class="report-stat-val text-success tabular-nums">${cm.published}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Restantes</span>
        <strong class="report-stat-val tabular-nums">${cm.hasDefinedQuantity ? cm.remaining : '—'}</strong>
      </div>
      <div class="report-stat-box report-stat-box-highlight">
        <span class="report-stat-label">${cm.excess > 0 ? 'Excedente' : 'Progresso'}</span>
        <strong class="report-stat-val ${cm.excess > 0 ? 'text-success' : ''} tabular-nums">${cm.hasDefinedQuantity ? (cm.excess > 0 ? `+${cm.excess}` : `${cm.percentage}%`) : 'Contínua'}</strong>
      </div>
    </div>

    <h4 class="report-deliveries-heading">
      Publicações Entregues (${deliveredPosts.length})
    </h4>

    ${deliveredPosts.length === 0
      ? `<p style="font-size: 0.875rem; color: var(--text-muted); padding: 8px 0;">Nenhuma publicação concluída neste recorte até o momento.</p>`
      : `<div class="report-deliveries-list">
          ${deliveredPosts.map((p, idx) => `
            <div class="report-delivery-item report-delivery-card">
              <span class="report-delivery-num tabular-nums">${String(idx + 1).padStart(2, '0')}</span>
              <div class="report-delivery-body">
                <div class="report-delivery-meta">
                  <span class="badge badge-concluido">${escapeHtml(p.type)}</span>
                  <span class="tabular-nums">${escapeHtml(formatDateBR(p.date))}</span>
                </div>
                <div class="report-delivery-main">${escapeHtml(p.title)}</div>
                ${p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer" class="report-delivery-link">${escapeHtml(p.link)}</a>` : ''}
              </div>
            </div>
          `).join('')}
        </div>`
    }
  `;
}

async function copyDeliveryReportToClipboard() {
  const client = appData.clients.find(c => c.id === currentReportClientId);
  if (!client) return;
  const selectedContracts = getSelectedReportContracts(client);
  if (selectedContracts.length === 0) return;

  const { text } = generateMultiContractReportData(client, selectedContracts);

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

async function shareDeliveryReportWhatsApp() {
  const client = appData.clients.find(c => c.id === currentReportClientId);
  if (!client) return;
  const selectedContracts = getSelectedReportContracts(client);
  if (selectedContracts.length === 0) return;

  const { text } = generateMultiContractReportData(client, selectedContracts);
  const encoded = encodeURIComponent(text);

  if (encoded.length > 1800) {
    await copyDeliveryReportToClipboard();
    showToast('Relatório muito longo para URL do WhatsApp. Texto completo copiado — cole no WhatsApp ou gere o PDF.');
    return;
  }

  const digits = String(client.phone || '').replace(/\D/g, '');
  const fullNumber = digits.length >= 10 && digits.length <= 11 ? `55${digits}` : digits;
  const waUrl = fullNumber
    ? `https://wa.me/${fullNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

// ==================== RELATÓRIO GERAL GERENCIAL ====================
function getGeneralReportData(periodOverride = null) {
  const monthFilter = periodOverride !== null
    ? periodOverride
    : (document.getElementById('generalReportPeriodSelect')?.value || document.getElementById('globalContractMonthFilter')?.value || 'ALL');
  const includeCancelled = Boolean(document.getElementById('toggleShowCancelled')?.checked);
  const archivedFilter = document.getElementById('globalArchivedFilter')?.value || 'HIDE';
  const clientStatusFilter = document.getElementById('globalClientStatusFilter')?.value || 'ALL';
  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

  const rows = [];
  const uniqueClientsSet = new Set();
  const categoryClientSets = { Mensal: new Set(), Avulso: new Set(), Parceria: new Set() };
  const byCategoryCount = { Mensal: 0, Avulso: 0, Parceria: 0, SemCategoria: 0 };
  let totalContracted = 0;
  let totalPublished = 0;
  let totalRemaining = 0;
  let totalExcess = 0;
  let completedContracts = 0;

  (appData.clients || []).forEach(client => {
    const archived = isClientArchived(client);
    if (archivedFilter === 'HIDE' && archived) return;
    if (archivedFilter === 'ONLY' && !archived) return;
    if (clientStatusFilter !== 'ALL' && getClientStatus(client) !== clientStatusFilter) return;

    if (searchQuery) {
      const nameMatch = (client.name || '').toLowerCase().includes(searchQuery);
      const companyMatch = (client.company || '').toLowerCase().includes(searchQuery);
      const instaMatch = (client.instagram || '').toLowerCase().includes(searchQuery);
      if (!nameMatch && !companyMatch && !instaMatch) return;
    }

    const m = getClientMetrics(client, monthFilter, includeCancelled);
    m.contractBreakdowns.forEach(({ contract, metrics: cm }) => {
      uniqueClientsSet.add(client.id);
      const cat = contract.agreementType;
      if (cat && categoryClientSets[cat]) {
        categoryClientSets[cat].add(client.id);
        byCategoryCount[cat] += 1;
      } else {
        byCategoryCount.SemCategoria += 1;
      }

      if (contract.status !== 'Cancelado') {
        if (cm.hasDefinedQuantity) {
          totalContracted += cm.totalContracted;
          totalRemaining += cm.remaining;
          totalExcess += cm.excess;
          if (cm.totalContracted > 0 && cm.remaining === 0) completedContracts += 1;
        }
        totalPublished += cm.published;
      }
      rows.push({
        client,
        contract,
        cm
      });
    });
  });

  const sumCategoriesUnique = categoryClientSets.Mensal.size + categoryClientSets.Avulso.size + categoryClientSets.Parceria.size;
  const hasOverlap = sumCategoriesUnique > uniqueClientsSet.size;

  return {
    monthFilter,
    uniqueClientsCount: uniqueClientsSet.size,
    contractsCount: rows.length,
    byCategoryCount,
    hasOverlap,
    totalContracted,
    totalPublished,
    totalRemaining,
    totalExcess,
    completedContracts,
    rows
  };
}

function openGeneralReportModal() {
  closeAllKebabMenus();
  const select = document.getElementById('generalReportPeriodSelect');
  const globalSelect = document.getElementById('globalContractMonthFilter');
  if (select && globalSelect) {
    select.innerHTML = globalSelect.innerHTML;
    select.value = globalSelect.value || 'ALL';
  }
  renderGeneralReportContent();
  openModal('generalReportModal');
}

function renderGeneralReportContent() {
  const area = document.getElementById('printableGeneralReportArea');
  if (!area) return;

  const data = getGeneralReportData();
  const now = new Date();
  const generatedLabel = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  area.innerHTML = `
    <div class="report-doc-header">
      <div>
        <div class="report-brand-mark">NasRuas de ITZ • Relatório Geral</div>
        <div class="report-doc-title">Resumo Gerencial de Acordos</div>
        <div class="report-doc-handle">${data.uniqueClientsCount} contatos únicos · ${data.contractsCount} acordos (Mensais: ${data.byCategoryCount.Mensal} · Avulsos: ${data.byCategoryCount.Avulso} · Parceiros: ${data.byCategoryCount.Parceria})</div>
        ${data.hasOverlap ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Nota: um mesmo contato pode aparecer em mais de uma categoria sem duplicar a contagem de contatos únicos.</div>` : ''}
      </div>
      <div style="text-align: right;">
        <span class="report-stat-label">Período</span>
        <div style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(data.monthFilter === 'ALL' ? 'Todos os períodos' : data.monthFilter)}</div>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Gerado em ${escapeHtml(generatedLabel)}</div>
      </div>
    </div>

    <div class="report-summary-grid">
      <div class="report-stat-box">
        <span class="report-stat-label">Contratadas</span>
        <strong class="report-stat-val">${data.totalContracted}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Publicadas</span>
        <strong class="report-stat-val text-success">${data.totalPublished}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Restantes</span>
        <strong class="report-stat-val">${data.totalRemaining}</strong>
      </div>
      <div class="report-stat-box">
        <span class="report-stat-label">Excedentes</span>
        <strong class="report-stat-val">${data.totalExcess > 0 ? `+${data.totalExcess}` : '0'}</strong>
      </div>
    </div>

    ${data.rows.length === 0
      ? `<p style="font-size: 0.875rem; color: var(--text-muted); padding: 8px 0;">Nenhum contrato encontrado para o recorte selecionado.</p>`
      : `<div class="desktop-clients-table-wrap" style="margin-top: 12px;">
          <table class="desktop-clients-table">
            <thead>
              <tr>
                <th>Contato</th>
                <th>Categoria</th>
                <th>Acordo / Período</th>
                <th>Contratadas</th>
                <th>Publicadas</th>
                <th>Restantes</th>
                <th>Excedentes</th>
                <th>Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${data.rows.map(({ client, contract, cm }) => `
                <tr>
                  <td><strong>${escapeHtml(client.name)}</strong></td>
                  <td>${escapeHtml(getAgreementTypeBadgeText(contract))}</td>
                  <td>${escapeHtml(getContractDisplayLabel(contract))}</td>
                  <td class="tabular-nums">${cm.hasDefinedQuantity ? cm.totalContracted : 'Livre'}</td>
                  <td class="tabular-nums">${cm.published}</td>
                  <td class="tabular-nums">${cm.hasDefinedQuantity ? cm.remaining : '—'}</td>
                  <td class="tabular-nums">${cm.hasDefinedQuantity ? (cm.excess > 0 ? `+${cm.excess}` : '0') : '—'}</td>
                  <td class="tabular-nums">${cm.hasDefinedQuantity ? `${cm.percentage}%` : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
    }
  `;
}

function sanitizeCsvCell(val) {
  let str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function exportGeneralReportCsv() {
  const data = getGeneralReportData();
  const headers = [
    'Cliente',
    'Instagram',
    'Período',
    'Status do Contrato',
    'Contratadas',
    'Publicadas',
    'Restantes',
    'Excedentes',
    'Progresso (%)'
  ];

  const lines = [headers.map(sanitizeCsvCell).join(';')];
  data.rows.forEach(({ client, contract, cm }) => {
    lines.push([
      client.name,
      formatInstagram(client.instagram),
      contract.period,
      contract.status,
      cm.totalContracted,
      cm.published,
      cm.remaining,
      cm.excess,
      `${cm.percentage}%`
    ].map(sanitizeCsvCell).join(';'));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nasruas-relatorio-${getLocalTodayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('CSV exportado com sucesso!');
}

// ==================== MODAIS DE CLIENTE E CONTRATO ====================
function syncBodyFullscreenModalState() {
  if (typeof document === 'undefined' || !document.body) return;
  const fullscreenIds = ['clientModal', 'contractModal', 'renewContractModal', 'postModal', 'reportModal', 'generalReportModal', 'trashModal', 'auditLogModal', 'legacyClassificationModal', 'videoModal'];
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

/**
 * Comprime a imagem selecionada via canvas (max 256x256, JPEG 0.82) para evitar
 * salvar arquivos de 3-5 MB em Base64 no banco ou estourar o localStorage.
 */
function compressAvatarImage(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const rawDataUrl = reader.result;
      if (typeof Image === 'undefined' || typeof document === 'undefined') {
        return resolve(rawDataUrl);
      }
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width >= height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed || rawDataUrl);
        } catch (_) {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadAvatarToStorageIfAvailable(dataUrl) {
  if (!supabase || !dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false
    });
    if (error) return dataUrl; // Fallback silencioso para DataURL já comprimido (~18 KB)
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return pub?.publicUrl || dataUrl;
  } catch (_) {
    return dataUrl;
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

function getClientStatus(client) {
  return client?.status || 'Ativo';
}

function isClientArchived(client) {
  return Boolean(client?.archived);
}

function getClientLastPublishedDates(client, monthFilter = 'ALL', includeCancelled = false) {
  const allPosts = (client?.posts || []).filter(p => p.status === 'Publicado' && p.date);
  let lastAll = '';
  let lastInPeriod = '';

  allPosts.forEach(p => {
    if (!lastAll || p.date > lastAll) {
      lastAll = p.date;
    }
    const linked = getLinkedContractForPost(client, p);
    if (!includeCancelled && linked && linked.status === 'Cancelado') return;
    if (monthFilter === 'ALL') {
      if (!lastInPeriod || p.date > lastInPeriod) lastInPeriod = p.date;
    } else if (linked && contractMatchesPeriod(linked, monthFilter)) {
      if (!lastInPeriod || p.date > lastInPeriod) lastInPeriod = p.date;
    }
  });

  return { lastAll, lastInPeriod };
}

async function toggleArchiveClient(clientId) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;
  const nextArchived = !isClientArchived(client);

  try {
    if (supabase) {
      const { error } = await supabase
        .from('clientes')
        .update({ arquivado: nextArchived })
        .eq('id', clientId);
      if (error) throw error;
      await fetchFromSupabase();
    } else {
      client.archived = nextArchived;
      saveData();
    }
    showToast(nextArchived ? 'Cliente arquivado (contratos e postagens preservados).' : 'Cliente restaurado para a carteira ativa.');
    if (currentClientId === clientId) {
      renderClientProfile();
    } else {
      renderDashboard();
    }
  } catch (err) {
    setPersistenceErrorUI(err.message);
    showToast('Não foi possível alterar o arquivamento: ' + (err.message || 'Erro no banco.'));
  }
}

window.toggleArchiveClient = toggleArchiveClient;

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
    const clientStatusEl = document.getElementById('clientStatus');
    if (clientStatusEl) clientStatusEl.value = getClientStatus(client);
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
    const clientStatusEl = document.getElementById('clientStatus');
    if (clientStatusEl) clientStatusEl.value = 'Ativo';
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
  const clientStatus = document.getElementById('clientStatus')?.value || 'Ativo';
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

  let finalAvatar = uploadedAvatarBase64 || avatarUrl || '';

  isSubmittingClient = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Salvando...';
  }

  try {
    if (supabase) {
      if (uploadedAvatarBase64 && uploadedAvatarBase64.startsWith('data:image/')) {
        finalAvatar = await uploadAvatarToStorageIfAvailable(uploadedAvatarBase64);
      }
      const payload = {
        nome: name,
        empresa: company,
        instagram,
        telefone: phone,
        email,
        foto_url: finalAvatar,
        observacoes: notes,
        status: clientStatus
      };

      const basePayload = {
        nome: name,
        empresa: company,
        instagram,
        telefone: phone,
        email,
        foto_url: finalAvatar,
        observacoes: notes
      };

      if (id) {
        let res = await supabase.from('clientes').update(payload).eq('id', id);
        if (res.error && String(res.error.message || '').includes('status')) {
          res = await supabase.from('clientes').update(basePayload).eq('id', id);
        }
        if (res.error) throw res.error;
      } else {
        let res = await supabase.from('clientes').insert([payload]);
        if (res.error && String(res.error.message || '').includes('status')) {
          res = await supabase.from('clientes').insert([basePayload]);
        }
        if (res.error) throw res.error;
      }
      await fetchFromSupabase();
      updateDbStatusUI(true);
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
          client.status = clientStatus;
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
          status: clientStatus,
          archived: false,
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
    'Mover cliente para a Lixeira',
    `Deseja mover "${client.name}" para a lixeira? Contratos e postagens sairão dos indicadores e poderão ser restaurados depois.`,
    async () => {
      const deletedAt = new Date().toISOString();
      if (supabase) {
        let res = await supabase.from('clientes').update({ deleted_at: deletedAt }).eq('id', clientId);
        if (res.error && String(res.error.message || '').includes('deleted_at')) {
          res = await supabase.from('clientes').delete().eq('id', clientId);
        }
        if (res.error) {
          setPersistenceErrorUI(res.error.message);
          showToast('Erro ao mover cliente para lixeira: ' + res.error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        ensureRecoveryStructures();
        appData.clients = appData.clients.filter(c => c.id !== clientId);
        if (!appData.trash.clients.some(c => c.id === client.id)) {
          appData.trash.clients.unshift({ ...client, deletedAt });
        }
        saveData();
      }
      recordAuditEvent('cliente', clientId, 'exclusao_lixeira', { nome: client.name });
      showToast('Cliente movido para a lixeira.');
      backToDashboard();
    }
  );
}

function inferContractDurationMonths(contract) {
  if (Number(contract?.durationMonths) > 0) return Number(contract.durationMonths);
  const start = String(contract?.startDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const end = String(contract?.endDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!start || !end) return 1;
  const sY = Number(start[1]);
  const sM = Number(start[2]);
  const eY = Number(end[1]);
  const eM = Number(end[2]);
  const diff = (eY - sY) * 12 + (eM - sM) + 1;
  if ([1, 2, 3, 6, 12].includes(diff)) return diff;
  return diff > 1 ? diff : 1;
}

function applyContractDurationDates() {
  const durationEl = document.getElementById('contractDurationMonths');
  const startEl = document.getElementById('contractStartDate');
  const endEl = document.getElementById('contractEndDate');
  if (!durationEl || !startEl || !endEl) return;

  const months = Math.max(1, Number(durationEl.value) || 1);
  if (!startEl.value) {
    startEl.value = getLocalTodayISO();
  }
  const m = startEl.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return;

  const startDateObj = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const endDateObj = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + months, startDateObj.getDate() - 1);
  const yyyy = endDateObj.getFullYear();
  const mm = String(endDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(endDateObj.getDate()).padStart(2, '0');
  endEl.value = `${yyyy}-${mm}-${dd}`;
}

function syncContractAgreementFields() {
  const type = document.getElementById('contractAgreementType')?.value || 'Mensal';
  const titleGroup = document.getElementById('contractAgreementTitleGroup');
  const titleLabel = document.getElementById('contractAgreementTitleLabel');
  const titleInput = document.getElementById('contractAgreementTitle');
  const subGroup = document.getElementById('contractPartnershipSubtypeGroup');
  const notesGroup = document.getElementById('contractPartnershipNotesGroup');
  const periodGroup = document.getElementById('contractPeriodGroup');
  const durationGroup = document.getElementById('contractDurationGroup');
  const defQtyGroup = document.getElementById('contractHasDefinedQuantityGroup');
  const defQtyCheck = document.getElementById('contractHasDefinedQuantity');
  const totalPostsGroup = document.getElementById('contractTotalPostsGroup');
  const valueGroup = document.getElementById('contractValueGroup');

  if (type === 'Mensal') {
    titleGroup?.classList.add('hidden');
    subGroup?.classList.add('hidden');
    notesGroup?.classList.add('hidden');
    defQtyGroup?.classList.add('hidden');
    periodGroup?.classList.remove('hidden');
    durationGroup?.classList.remove('hidden');
    totalPostsGroup?.classList.remove('hidden');
    valueGroup?.classList.remove('hidden');
  } else if (type === 'Avulso') {
    titleGroup?.classList.remove('hidden');
    if (titleLabel) titleLabel.innerHTML = 'Nome do pacote ou ação <span class="req">*</span>';
    if (titleInput) titleInput.placeholder = 'Ex: Divulgação da inauguração';
    subGroup?.classList.add('hidden');
    notesGroup?.classList.add('hidden');
    defQtyGroup?.classList.remove('hidden');
    periodGroup?.classList.add('hidden');
    durationGroup?.classList.add('hidden');
    valueGroup?.classList.remove('hidden');
    const hasQty = defQtyCheck ? defQtyCheck.checked : true;
    totalPostsGroup?.classList.toggle('hidden', !hasQty);
  } else {
    // Parceria
    titleGroup?.classList.remove('hidden');
    if (titleLabel) titleLabel.innerHTML = 'Identificação da parceria <span class="req">*</span>';
    if (titleInput) titleInput.placeholder = 'Ex: Parceria Evento / Permuta';
    subGroup?.classList.remove('hidden');
    notesGroup?.classList.remove('hidden');
    defQtyGroup?.classList.remove('hidden');
    periodGroup?.classList.add('hidden');
    durationGroup?.classList.add('hidden');
    valueGroup?.classList.add('hidden');
    const hasQty = defQtyCheck ? defQtyCheck.checked : true;
    totalPostsGroup?.classList.toggle('hidden', !hasQty);
  }
}

// --- Modal Contrato ---
function openContractModal(contractId = null) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const form = document.getElementById('contractForm');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('contractFormError')?.classList.add('hidden');
  const durationEl = document.getElementById('contractDurationMonths');
  const typeEl = document.getElementById('contractAgreementType');
  const defQtyCheck = document.getElementById('contractHasDefinedQuantity');

  if (contractId) {
    const contract = (client.contracts || []).find(c => c.id === contractId);
    if (!contract) return;
    document.getElementById('contractModalTitle').textContent = 'Editar Acordo / Contrato';
    document.getElementById('contractId').value = contract.id;
    if (typeEl) typeEl.value = contract.agreementType || 'Mensal';
    if (document.getElementById('contractAgreementTitle')) {
      document.getElementById('contractAgreementTitle').value = contract.agreementTitle || contract.period || '';
    }
    if (document.getElementById('contractPartnershipSubtype')) {
      document.getElementById('contractPartnershipSubtype').value = contract.partnershipSubtype || '';
    }
    if (document.getElementById('contractPartnershipNotes')) {
      document.getElementById('contractPartnershipNotes').value = contract.partnershipNotes || '';
    }
    if (defQtyCheck) {
      defQtyCheck.checked = contract.hasDefinedQuantity !== false;
    }
    document.getElementById('contractPeriod').value = contract.period || '';
    document.getElementById('contractTotalPosts').value = contract.totalPosts || '';
    if (durationEl) {
      const inferred = inferContractDurationMonths(contract);
      const hasOpt = Array.from(durationEl.options || []).some(o => Number(o.value) === inferred);
      durationEl.value = hasOpt ? String(inferred) : '1';
    }
    document.getElementById('contractStartDate').value = contract.startDate || '';
    document.getElementById('contractEndDate').value = contract.endDate || '';
    document.getElementById('contractTypes').value = contract.types || '';
    document.getElementById('contractValue').value = contract.value || '';
    document.getElementById('contractStatus').value = contract.status || 'Ativo';
  } else {
    document.getElementById('contractModalTitle').textContent = 'Novo Acordo / Contrato';
    document.getElementById('contractId').value = '';
    if (typeEl) {
      typeEl.value = (activeClientCategory === 'Avulso' || activeClientCategory === 'Parceria') ? activeClientCategory : 'Mensal';
    }
    if (defQtyCheck) defQtyCheck.checked = true;
    if (durationEl) durationEl.value = '1';
    document.getElementById('contractStartDate').value = '';
    document.getElementById('contractEndDate').value = '';
    document.getElementById('contractStatus').value = 'Ativo';
  }

  syncContractAgreementFields();
  openModal('contractModal');
}

async function handleContractSubmit(e) {
  e.preventDefault();
  if (isSubmittingContract) return;

  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const id = document.getElementById('contractId').value;
  const agreementType = document.getElementById('contractAgreementType')?.value || 'Mensal';
  const agreementTitle = (document.getElementById('contractAgreementTitle')?.value || '').trim();
  const partnershipSubtype = document.getElementById('contractPartnershipSubtype')?.value || '';
  const partnershipNotes = (document.getElementById('contractPartnershipNotes')?.value || '').trim();
  const hasDefinedQuantity = (agreementType === 'Parceria' || agreementType === 'Avulso')
    ? Boolean(document.getElementById('contractHasDefinedQuantity')?.checked)
    : true;
  const rawPeriod = document.getElementById('contractPeriod').value.trim();
  const period = agreementType === 'Mensal' ? rawPeriod : (agreementTitle || rawPeriod);
  const durationMonths = agreementType === 'Mensal'
    ? Math.max(1, Number(document.getElementById('contractDurationMonths')?.value) || 1)
    : 1;
  const totalPosts = hasDefinedQuantity ? (Number(document.getElementById('contractTotalPosts').value) || 0) : 0;
  const startDate = document.getElementById('contractStartDate')?.value || '';
  const endDate = document.getElementById('contractEndDate')?.value || '';
  const types = document.getElementById('contractTypes').value.trim();
  const valueRaw = document.getElementById('contractValue').value;
  const value = (agreementType !== 'Parceria' && valueRaw !== '') ? Number(valueRaw) : null;
  const status = document.getElementById('contractStatus').value;
  const errEl = document.getElementById('contractFormError');
  const btn = document.getElementById('btnSaveContract');

  errEl?.classList.add('hidden');

  if (agreementType === 'Mensal' && !rawPeriod) {
    if (errEl) {
      errEl.textContent = 'Informe o mês e ano do contrato (ex.: Novembro/2026).';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (agreementType !== 'Mensal' && !agreementTitle) {
    if (errEl) {
      errEl.textContent = agreementType === 'Parceria' ? 'Informe a identificação da parceria.' : 'Informe o nome do pacote ou ação avulsa.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (hasDefinedQuantity && totalPosts <= 0) {
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

  if (id) {
    const existingContract = (client.contracts || []).find(c => c.id === id);
    if (existingContract) {
      const cm = getContractMetrics(client, existingContract);
      if (hasDefinedQuantity && totalPosts < cm.published) {
        const excessResult = cm.published - totalPosts;
        const confirmed = window.confirm(
          `Este contrato já possui ${cm.published} publicações publicadas. Reduzir para ${totalPosts} gerará ${excessResult} excedente(s). Deseja confirmar?`
        );
        if (!confirmed) return;
      }
    }
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
        tipo_acordo: agreementType,
        titulo_acordo: agreementTitle,
        subtipo_parceria: partnershipSubtype,
        quantidade_definida: hasDefinedQuantity,
        descricao_combinado: partnershipNotes,
        duracao_meses: durationMonths,
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
        status,
        data_inicio: startDate || null,
        data_fim: endDate || null
      };

      let opError = null;
      if (id) {
        const res = await supabase.from('contratos').update(fullPayload).eq('id', id);
        if (res.error && /(tipo_acordo|titulo_acordo|subtipo_parceria|quantidade_definida|descricao_combinado|duracao_meses)/.test(String(res.error.message || ''))) {
          const fallback = await supabase.from('contratos').update(basePayload).eq('id', id);
          opError = fallback.error;
        } else {
          opError = res.error;
        }
      } else {
        const res = await supabase.from('contratos').insert([fullPayload]);
        if (res.error && /(tipo_acordo|titulo_acordo|subtipo_parceria|quantidade_definida|descricao_combinado|duracao_meses)/.test(String(res.error.message || ''))) {
          const fallback = await supabase.from('contratos').insert([basePayload]);
          opError = fallback.error;
        } else {
          opError = res.error;
        }
      }

      if (opError) throw opError;
      await fetchFromSupabase();
      showToast(id ? 'Acordo atualizado!' : 'Acordo salvo!');
    } else {
      if (!client.contracts) client.contracts = [];
      if (id) {
        const contract = client.contracts.find(c => c.id === id);
        if (contract) {
          contract.agreementType = agreementType;
          contract.agreementTitle = agreementTitle;
          contract.partnershipSubtype = partnershipSubtype;
          contract.hasDefinedQuantity = hasDefinedQuantity;
          contract.partnershipNotes = partnershipNotes;
          contract.period = period;
          contract.durationMonths = durationMonths;
          contract.totalPosts = totalPosts;
          contract.startDate = startDate;
          contract.endDate = endDate;
          contract.types = types;
          contract.value = value !== null ? value : '';
          contract.status = status;
        }
        showToast('Acordo atualizado!');
      } else {
        client.contracts.push({
          id: uid('cnt'),
          agreementType,
          agreementTitle,
          partnershipSubtype,
          hasDefinedQuantity,
          partnershipNotes,
          period,
          durationMonths,
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
    setPersistenceErrorUI(err.message);
    showToast('Erro ao renovar contrato: ' + (err.message || ''));
  }
}

function checkRenewExistingContractWarning(client, periodInputVal) {
  const warnBox = document.getElementById('renewExistingWarning');
  const warnText = document.getElementById('renewExistingWarningText');
  const openBtn = document.getElementById('btnOpenExistingRenewContract');
  const confirmBtn = document.getElementById('btnConfirmRenewContract');
  if (!client || !warnBox) return null;

  const normalized = normalizePeriod(periodInputVal || '').toLowerCase();
  const existing = (client.contracts || []).find(c => normalizePeriod(c.period).toLowerCase() === normalized);

  if (existing) {
    warnBox.classList.remove('hidden');
    if (warnText) warnText.textContent = `Já existe o contrato de ${existing.period} para este cliente.`;
    if (confirmBtn) confirmBtn.disabled = true;
    if (openBtn) {
      openBtn.onclick = () => {
        closeModal('renewContractModal');
        filterProfileByContractMonth(existing.period);
      };
    }
    return existing;
  }

  warnBox.classList.add('hidden');
  if (confirmBtn) confirmBtn.disabled = false;
  return null;
}

function openRenewContractReviewModal(sourceContractId = null) {
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
  document.getElementById('renewSourceContractId').value = baseContract.id;
  document.getElementById('renewPeriodInput').value = nextInfo.period;
  document.getElementById('renewTotalPostsInput').value = Number(baseContract.totalPosts) || 1;
  document.getElementById('renewFormError')?.classList.add('hidden');

  checkRenewExistingContractWarning(client, nextInfo.period);
  openModal('renewContractModal');
}

async function handleRenewContractSubmit(e) {
  e.preventDefault();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const sourceId = document.getElementById('renewSourceContractId')?.value || '';
  const period = (document.getElementById('renewPeriodInput')?.value || '').trim();
  const totalPosts = Number(document.getElementById('renewTotalPostsInput')?.value) || 0;
  const errEl = document.getElementById('renewFormError');
  const confirmBtn = document.getElementById('btnConfirmRenewContract');

  errEl?.classList.add('hidden');

  if (!period) {
    if (errEl) {
      errEl.textContent = 'Informe o período do novo contrato.';
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
  if (checkRenewExistingContractWarning(client, period)) return;

  const baseContract = (client.contracts || []).find(c => c.id === sourceId) || (client.contracts || [])[0];
  const nextInfo = computeNextContractPeriod(baseContract?.period || '', baseContract?.startDate || '', baseContract?.endDate || '');
  const useDates = normalizePeriod(period).toLowerCase() === nextInfo.period.toLowerCase();

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Renovando...';
  }

  try {
    const types = baseContract?.types || '';
    const value = baseContract?.value !== '' && baseContract?.value !== null && baseContract?.value !== undefined
      ? Number(baseContract.value)
      : null;

    if (supabase) {
      const fullPayload = {
        cliente_id: client.id,
        periodo: period,
        total_postagens: totalPosts,
        tipos: types,
        valor: value,
        status: 'Ativo',
        data_inicio: useDates ? (nextInfo.startDate || null) : null,
        data_fim: useDates ? (nextInfo.endDate || null) : null
      };
      const basePayload = {
        cliente_id: client.id,
        periodo: period,
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
      updateDbStatusUI(true);
    } else {
      client.contracts.push({
        id: uid('cnt'),
        period,
        totalPosts,
        startDate: useDates ? nextInfo.startDate : '',
        endDate: useDates ? nextInfo.endDate : '',
        types,
        value: value !== null ? value : '',
        status: 'Ativo'
      });
      client.contracts = sortContractsChronologically(client.contracts, true);
      saveData();
    }

    closeModal('renewContractModal');
    populateContractMonthFilters();
    const profileSelect = document.getElementById('filterProfileContractMonth');
    if (profileSelect) profileSelect.value = period;
    renderClientProfile();
    showToast(`Contrato renovado para ${period} (${totalPosts} postagens)!`);
  } catch (err) {
    setPersistenceErrorUI(err.message);
    if (errEl) {
      errEl.textContent = 'Erro ao renovar: ' + (err.message || 'Tente novamente.');
      errEl.classList.remove('hidden');
    }
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar renovação';
    }
  }
}

function confirmDeleteContract(contractId) {
  closeAllKebabMenus();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;
  const contract = (client.contracts || []).find(c => c.id === contractId);
  if (!contract) return;

  openConfirmModal(
    'Mover contrato para a Lixeira',
    `Deseja mover o contrato "${contract.period}" para a lixeira? As postagens registradas serão mantidas.`,
    async () => {
      const deletedAt = new Date().toISOString();
      if (supabase) {
        let res = await supabase.from('contratos').update({ deleted_at: deletedAt }).eq('id', contractId);
        if (res.error && String(res.error.message || '').includes('deleted_at')) {
          res = await supabase.from('contratos').delete().eq('id', contractId);
        }
        if (res.error) {
          setPersistenceErrorUI(res.error.message);
          showToast('Erro ao excluir contrato: ' + res.error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        ensureRecoveryStructures();
        client.contracts = client.contracts.filter(c => c.id !== contractId);
        if (!appData.trash.contracts.some(c => c.id === contract.id)) {
          appData.trash.contracts.unshift({ ...contract, clientId: client.id, clientName: client.name, deletedAt });
        }
        saveData();
      }
      recordAuditEvent('contrato', contractId, 'exclusao_lixeira', { cliente: client.name, periodo: contract.period });
      showToast('Contrato movido para a lixeira.');
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
    'Mover postagem para a Lixeira',
    `Deseja mover a postagem "${post.title}" para a lixeira? O saldo será atualizado imediatamente.`,
    async () => {
      const deletedAt = new Date().toISOString();
      if (supabase) {
        let res = await supabase.from('postagens').update({ deleted_at: deletedAt }).eq('id', postId);
        if (res.error && String(res.error.message || '').includes('deleted_at')) {
          res = await supabase.from('postagens').delete().eq('id', postId);
        }
        if (res.error) {
          setPersistenceErrorUI(res.error.message);
          showToast('Erro ao excluir postagem: ' + res.error.message);
          return;
        }
        await fetchFromSupabase();
      } else {
        ensureRecoveryStructures();
        client.posts = client.posts.filter(p => p.id !== postId);
        if (!appData.trash.posts.some(p => p.id === post.id)) {
          appData.trash.posts.unshift({ ...post, clientId: client.id, clientName: client.name, deletedAt });
        }
        saveData();
      }
      recordAuditEvent('postagem', postId, 'exclusao_lixeira', { cliente: client.name, titulo: post.title });
      showToast('Postagem movida para a lixeira.');
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

// ==================== LIXEIRA, RESTAURAÇÃO, HISTÓRICO & IMPORTAÇÃO ====================
function openTrashModal() {
  renderTrashList();
  openModal('trashModal');
}

function renderTrashList() {
  const container = document.getElementById('trashListContainer');
  if (!container) return;
  ensureRecoveryStructures();

  const items = [];
  appData.trash.clients.forEach(c => items.push({ type: 'cliente', id: c.id, title: c.name, sub: `${(c.contracts || []).length} contrato(s) · ${(c.posts || []).length} postagem(ns)`, deletedAt: c.deletedAt }));
  appData.trash.contracts.forEach(c => items.push({ type: 'contrato', id: c.id, title: `${c.period} (${c.clientName || 'Cliente'})`, sub: `${c.totalPosts} contratadas`, deletedAt: c.deletedAt }));
  appData.trash.posts.forEach(p => items.push({ type: 'postagem', id: p.id, title: p.title, sub: `${p.clientName || 'Cliente'} · ${formatDateBR(p.date)}`, deletedAt: p.deletedAt }));

  if (items.length === 0) {
    container.innerHTML = `<p style="font-size:14px; color:var(--text-secondary); padding: 12px 0;">A lixeira está vazia.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="monthly-history-row">
      <div class="monthly-history-info">
        <span class="monthly-history-period">[${escapeHtml(item.type)}] ${escapeHtml(item.title)}</span>
        <span class="monthly-history-metrics">${escapeHtml(item.sub)}</span>
      </div>
      <div class="monthly-history-actions">
        <button type="button" class="btn btn-primary btn-sm" onclick="restoreFromTrash('${escapeHtml(item.type)}', '${escapeHtml(item.id)}')">Restaurar</button>
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="hardDeleteFromTrash('${escapeHtml(item.type)}', '${escapeHtml(item.id)}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

async function restoreFromTrash(type, id) {
  ensureRecoveryStructures();
  try {
    if (supabase) {
      const table = type === 'cliente' ? 'clientes' : (type === 'contrato' ? 'contratos' : 'postagens');
      const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
      if (error) throw error;
      await fetchFromSupabase();
    } else {
      if (type === 'cliente') {
        const found = appData.trash.clients.find(c => c.id === id);
        if (!found) return;
        appData.trash.clients = appData.trash.clients.filter(c => c.id !== id);
        if (!appData.clients.some(c => c.id === found.id)) {
          delete found.deletedAt;
          appData.clients.unshift(found);
        }
      } else if (type === 'contrato') {
        const found = appData.trash.contracts.find(c => c.id === id);
        if (!found) return;
        const owner = appData.clients.find(c => c.id === found.clientId);
        if (!owner) {
          showToast('Restaure o cliente antes de restaurar este contrato.');
          return;
        }
        appData.trash.contracts = appData.trash.contracts.filter(c => c.id !== id);
        if (!owner.contracts.some(c => c.id === found.id)) {
          delete found.deletedAt;
          owner.contracts.push(found);
          owner.contracts = sortContractsChronologically(owner.contracts, true);
        }
      } else if (type === 'postagem') {
        const found = appData.trash.posts.find(p => p.id === id);
        if (!found) return;
        const owner = appData.clients.find(c => c.id === found.clientId);
        if (!owner) {
          showToast('Restaure o cliente antes de restaurar esta postagem.');
          return;
        }
        appData.trash.posts = appData.trash.posts.filter(p => p.id !== id);
        if (!owner.posts.some(p => p.id === found.id)) {
          delete found.deletedAt;
          owner.posts.unshift(found);
        }
      }
      saveData();
    }
    recordAuditEvent(type, id, 'restauracao', {});
    renderTrashList();
    renderDashboard();
    showToast('Registro restaurado sem duplicação!');
  } catch (err) {
    setPersistenceErrorUI(err.message);
    showToast('Erro ao restaurar: ' + (err.message || 'Tente novamente.'));
  }
}

async function hardDeleteFromTrash(type, id) {
  ensureRecoveryStructures();
  try {
    if (supabase) {
      const table = type === 'cliente' ? 'clientes' : (type === 'contrato' ? 'contratos' : 'postagens');
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      await fetchFromSupabase();
    } else {
      if (type === 'cliente') appData.trash.clients = appData.trash.clients.filter(c => c.id !== id);
      if (type === 'contrato') appData.trash.contracts = appData.trash.contracts.filter(c => c.id !== id);
      if (type === 'postagem') appData.trash.posts = appData.trash.posts.filter(p => p.id !== id);
      saveData();
    }
    renderTrashList();
    showToast('Registro removido definitivamente.');
  } catch (err) {
    showToast('Erro ao excluir definitivamente: ' + (err.message || ''));
  }
}

function openAuditLogModal() {
  renderAuditLogList();
  openModal('auditLogModal');
}

function renderAuditLogList() {
  const container = document.getElementById('auditLogListContainer');
  if (!container) return;
  ensureRecoveryStructures();

  if (appData.auditLog.length === 0) {
    container.innerHTML = `<p style="font-size:14px; color:var(--text-secondary); padding: 12px 0;">Nenhuma alteração registrada ainda.</p>`;
    return;
  }

  container.innerHTML = appData.auditLog.map(entry => {
    const dt = entry.criadoEm ? new Date(entry.criadoEm).toLocaleString('pt-BR') : '';
    const detailsStr = entry.detalhes ? JSON.stringify(entry.detalhes) : '';
    return `
      <div class="monthly-history-row">
        <div class="monthly-history-info">
          <span class="monthly-history-period">${escapeHtml(entry.acao)} (${escapeHtml(entry.entidade)})</span>
          <span class="monthly-history-metrics">${escapeHtml(dt)} · ${escapeHtml(entry.autorEmail || '')}</span>
          ${detailsStr && detailsStr !== '{}' ? `<span class="monthly-history-metrics">${escapeHtml(detailsStr)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function handleImportBackupFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const importedClients = Array.isArray(parsed?.clients) ? parsed.clients : [];
    if (importedClients.length === 0) {
      showToast('Arquivo de backup sem clientes válidos.');
      return;
    }

    const totalContracts = importedClients.reduce((acc, c) => acc + (c.contracts?.length || 0), 0);
    const totalPosts = importedClients.reduce((acc, c) => acc + (c.posts?.length || 0), 0);
    const targetMode = supabase ? 'na nuvem (Supabase)' : 'neste aparelho (Modo Local)';

    openConfirmModal(
      'Prévia de Importação de Backup',
      `O arquivo contém ${importedClients.length} cliente(s), ${totalContracts} contrato(s) e ${totalPosts} postagem(ns). Os registros novos serão mesclados ${targetMode} sem duplicar IDs existentes. Deseja continuar?`,
      async () => {
        ensureRecoveryStructures();
        let addedClients = 0;

        if (supabase) {
          try {
            for (const impCli of importedClients) {
              if (!impCli || !impCli.id || !impCli.name) continue;
              const exists = appData.clients.some(c => c.id === impCli.id || (c.name || '').toLowerCase() === (impCli.name || '').toLowerCase());
              if (exists) continue;

              const cliPayload = {
                nome: impCli.name,
                empresa: impCli.company || '',
                instagram: impCli.instagram || '',
                telefone: impCli.phone || '',
                email: impCli.email || '',
                foto_url: impCli.avatar || '',
                observacoes: impCli.notes || ''
              };
              const { data: insertedCli, error: cliErr } = await supabase.from('clientes').insert([cliPayload]).select('id').single();
              if (cliErr) throw cliErr;
              const newCliId = insertedCli.id;
              const contractIdMap = {};

              for (const cnt of (impCli.contracts || [])) {
                const cntPayload = {
                  cliente_id: newCliId,
                  periodo: cnt.period || '',
                  total_postagens: Math.max(1, Number(cnt.totalPosts) || 1),
                  tipos: cnt.types || '',
                  valor: cnt.value !== '' && cnt.value !== null && cnt.value !== undefined ? Number(cnt.value) : null,
                  status: cnt.status || 'Ativo'
                };
                const { data: insertedCnt, error: cntErr } = await supabase.from('contratos').insert([cntPayload]).select('id').single();
                if (cntErr) throw cntErr;
                contractIdMap[cnt.id] = insertedCnt.id;
              }

              for (const pst of (impCli.posts || [])) {
                const pstPayload = {
                  cliente_id: newCliId,
                  contrato_id: contractIdMap[pst.contractId] || null,
                  data: pst.date || getLocalTodayISO(),
                  tipo: pst.type || 'Reels',
                  titulo: pst.title || 'Publicação',
                  link: pst.link || '',
                  status: pst.status || 'Pendente',
                  observacoes: pst.notes || ''
                };
                const { error: pstErr } = await supabase.from('postagens').insert([pstPayload]);
                if (pstErr) throw pstErr;
              }
              addedClients++;
            }
            await fetchFromSupabase();
            updateDbStatusUI(true);
          } catch (err) {
            setPersistenceErrorUI(err.message);
            showToast('Erro ao importar para a nuvem: ' + (err.message || 'Tente novamente.'));
            return;
          }
        } else {
          importedClients.forEach(impCli => {
            if (!impCli || !impCli.id || !impCli.name) return;
            const exists = appData.clients.some(c => c.id === impCli.id);
            if (!exists) {
              appData.clients.push({
                ...impCli,
                status: impCli.status || 'Ativo',
                archived: Boolean(impCli.archived),
                contracts: sortContractsChronologically(impCli.contracts || [], true),
                posts: impCli.posts || []
              });
              addedClients++;
            }
          });
          saveData();
        }

        recordAuditEvent('backup', 'importacao', 'importacao_backup', { clientesAdicionados: addedClients });
        renderDashboard();
        showToast(`Importação concluída: ${addedClients} cliente(s) adicionado(s).`);
      }
    );
  } catch (_) {
    showToast('Não foi possível ler o arquivo .json selecionado.');
  }
}

// ==================== CLASSIFICAÇÃO DE ACORDOS LEGADOS ====================
function suggestLegacyAgreementType(contract) {
  if (contract?.agreementType === 'Mensal' || contract?.agreementType === 'Avulso' || contract?.agreementType === 'Parceria') {
    return { suggestion: contract.agreementType, confidence: 'definida', reason: 'Já classificado' };
  }
  const periodStr = String(contract?.period || '').trim();
  const isMonthYear = /^(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/\d{4}$/i.test(periodStr);
  if (isMonthYear && (Number(contract?.totalPosts) || 0) > 0) {
    return { suggestion: 'Mensal', confidence: 'alta', reason: 'Período no formato Mês/Ano' };
  }
  if (!isMonthYear && Number(contract?.value) > 0) {
    return { suggestion: 'Avulso', confidence: 'media', reason: 'Período descritivo com valor informado' };
  }
  return { suggestion: 'Revisar', confidence: 'ambigua', reason: 'Sem padrão claro — revise manualmente' };
}

function getUnclassifiedLegacyContracts() {
  const list = [];
  (appData.clients || []).forEach(client => {
    (client.contracts || []).forEach(contract => {
      if (!contract.agreementType) {
        list.push({ client, contract, ...suggestLegacyAgreementType(contract) });
      }
    });
  });
  return list;
}

function openLegacyClassificationModal() {
  const list = getUnclassifiedLegacyContracts();
  const container = document.getElementById('legacyClassificationList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p style="font-size:14px; color:var(--text-secondary); padding: 12px 0;">Todos os acordos já estão classificados.</p>`;
  } else {
    container.innerHTML = list.map(({ client, contract, suggestion, reason }) => {
      const defaultChoice = (suggestion === 'Mensal' || suggestion === 'Avulso' || suggestion === 'Parceria') ? suggestion : 'Mensal';
      return `
        <div class="monthly-history-row">
          <div class="monthly-history-info">
            <span class="monthly-history-period">${escapeHtml(client.name)} — ${escapeHtml(contract.period || 'Sem período')}</span>
            <span class="monthly-history-metrics">${Number(contract.totalPosts) || 0} contratadas · Sugestão: <strong>${escapeHtml(suggestion)}</strong> (${escapeHtml(reason)})</span>
          </div>
          <div>
            <select class="select-filter" data-legacy-contract-id="${escapeHtml(contract.id)}" data-legacy-client-id="${escapeHtml(client.id)}" aria-label="Classificar acordo">
              <option value="Mensal" ${defaultChoice === 'Mensal' ? 'selected' : ''}>Mensal</option>
              <option value="Avulso" ${defaultChoice === 'Avulso' ? 'selected' : ''}>Avulso</option>
              <option value="Parceria" ${defaultChoice === 'Parceria' ? 'selected' : ''}>Parceria</option>
            </select>
          </div>
        </div>
      `;
    }).join('');
  }
  openModal('legacyClassificationModal');
}

async function applyLegacyClassifications() {
  const selects = Array.from(document.querySelectorAll('[data-legacy-contract-id]'));
  if (selects.length === 0) {
    closeModal('legacyClassificationModal');
    return;
  }

  try {
    for (const sel of selects) {
      const contractId = sel.getAttribute('data-legacy-contract-id');
      const clientId = sel.getAttribute('data-legacy-client-id');
      const chosenType = sel.value;
      if (!['Mensal', 'Avulso', 'Parceria'].includes(chosenType)) continue;

      if (supabase) {
        const { error } = await supabase.from('contratos').update({ tipo_acordo: chosenType }).eq('id', contractId);
        if (error) throw error;
      } else {
        const cli = appData.clients.find(c => c.id === clientId);
        const cnt = (cli?.contracts || []).find(c => c.id === contractId);
        if (cnt) cnt.agreementType = chosenType;
      }
    }
    if (supabase) {
      await fetchFromSupabase();
    } else {
      saveData();
    }
    closeModal('legacyClassificationModal');
    renderDashboard();
    showToast('Acordos classificados com sucesso!');
  } catch (err) {
    setPersistenceErrorUI(err.message);
    showToast('Erro ao salvar classificação: ' + (err.message || 'Verifique se a migração v5 foi aplicada no Supabase.'));
  }
}

// ==================== ABA INDEPENDENTE: VÍDEOS (KANBAN) ====================
async function quickChangeVideoStatus(videoId, newStatus) {
  const valid = ['A fazer', 'Em produção', 'Concluído'];
  if (!valid.includes(newStatus)) return;
  const video = (appData.videos || []).find(v => v.id === videoId);
  if (!video || video.status === newStatus) return;

  const prevStatus = video.status;
  video.status = newStatus;
  video.updatedAt = new Date().toISOString();
  renderVideosView();

  try {
    if (supabase) {
      const { error } = await supabase
        .from('videos')
        .update({ status: newStatus, atualizado_em: video.updatedAt })
        .eq('id', videoId);
      if (error) throw error;
    } else {
      saveData();
    }
    showToast(`Vídeo movido para "${newStatus}".`);
  } catch (err) {
    video.status = prevStatus;
    renderVideosView();
    showToast('Erro ao atualizar status do vídeo.', true);
  }
}

function renderVideosView() {
  ensureRecoveryStructures();
  const listEl = document.getElementById('videosList');
  const countEl = document.getElementById('videosCountLabel');
  const searchQuery = (document.getElementById('videosSearchInput')?.value || '').trim().toLowerCase();
  const showArchived = Boolean(document.getElementById('toggleShowArchivedVideos')?.checked);
  if (!listEl) return;

  const filtered = (appData.videos || []).filter(v => {
    if (!showArchived && v.archived) return false;
    if (videoStatusFilter !== 'ALL' && v.status !== videoStatusFilter) return false;
    if (searchQuery && !(v.title || '').toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'vídeo' : 'vídeos'}`;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>Nenhum vídeo encontrado</h4>
        <p>Projetos de vídeo aqui são independentes dos clientes e não consomem saldo de publicações.</p>
        <button type="button" class="btn btn-primary" onclick="openVideoModal()">+ Novo vídeo</button>
      </div>
    `;
    return;
  }

  const columns = [
    { status: 'A fazer', title: 'A fazer', accentClass: 'kanban-col-todo' },
    { status: 'Em produção', title: 'Em produção', accentClass: 'kanban-col-doing' },
    { status: 'Concluído', title: 'Concluído', accentClass: 'kanban-col-done' }
  ];
  const visibleColumns = videoStatusFilter === 'ALL'
    ? columns
    : columns.filter(col => col.status === videoStatusFilter);

  const renderVideoCard = (v) => {
    const moveAction = v.status === 'A fazer'
      ? `<button type="button" class="btn btn-secondary btn-sm" onclick="quickChangeVideoStatus('${escapeHtml(v.id)}', 'Em produção')">Mover → Em produção</button>`
      : (v.status === 'Em produção'
        ? `<button type="button" class="btn btn-secondary btn-sm" onclick="quickChangeVideoStatus('${escapeHtml(v.id)}', 'Concluído')">Concluir ✓</button>`
        : `<button type="button" class="btn btn-ghost btn-sm" onclick="quickChangeVideoStatus('${escapeHtml(v.id)}', 'Em produção')">Reabrir</button>`);

    const stepsDone = getVideoChecklistArray(v).length;
    return `
      <article class="kanban-card">
        <div class="kanban-card-top">
          ${v.dueDate ? `<span class="post-date tabular-nums">${escapeHtml(formatDateBR(v.dueDate))}</span>` : '<span class="post-date">Sem prazo</span>'}
          <div style="display:inline-flex; gap:6px; align-items:center;">
            ${stepsDone > 0 ? `<span class="badge badge-concluido tabular-nums">${stepsDone}/4 etapas</span>` : ''}
            ${v.archived ? `<span class="badge badge-concluido">Arquivado</span>` : ''}
          </div>
        </div>
        <h3 class="post-title">${escapeHtml(v.title)}</h3>
        ${v.description ? `<p class="kanban-card-desc">${escapeHtml(v.description)}</p>` : ''}
        ${(v.materialLink || v.finalLink) ? `
          <div class="kanban-card-links">
            ${v.materialLink ? `<a href="${escapeHtml(v.materialLink)}" target="_blank" rel="noopener noreferrer" class="post-external-link">Material</a>` : ''}
            ${v.finalLink ? `<a href="${escapeHtml(v.finalLink)}" target="_blank" rel="noopener noreferrer" class="post-external-link">Vídeo final</a>` : ''}
          </div>
        ` : ''}
        <div class="kanban-card-actions">
          ${moveAction}
          <div class="kanban-card-subactions">
            <button type="button" class="btn btn-ghost btn-sm" onclick="openVideoModal('${escapeHtml(v.id)}')">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleArchiveVideo('${escapeHtml(v.id)}')">${v.archived ? 'Restaurar' : 'Arquivar'}</button>
            <button type="button" class="btn btn-ghost btn-sm text-danger" onclick="confirmDeleteVideo('${escapeHtml(v.id)}')">Excluir</button>
          </div>
        </div>
      </article>
    `;
  };

  listEl.innerHTML = `
    <div class="videos-kanban-board" style="grid-column: 1 / -1;">
      ${visibleColumns.map(col => {
        const items = filtered.filter(v => v.status === col.status);
        return `
          <section class="kanban-column ${col.accentClass}" aria-label="${escapeHtml(col.title)}">
            <header class="kanban-column-header">
              <h3 class="kanban-column-title">${escapeHtml(col.title)}</h3>
              <span class="kanban-column-count tabular-nums">${items.length}</span>
            </header>
            <div class="kanban-column-body">
              ${items.length === 0
                ? `<p class="kanban-empty-note">Nenhum vídeo em "${escapeHtml(col.title)}".</p>`
                : items.map(renderVideoCard).join('')}
            </div>
          </section>
        `;
      }).join('')}
    </div>
  `;
}

const VIDEO_CHECKLIST_LABELS = {
  roteiro: 'Roteiro / pauta definida',
  captacao: 'Captação / gravação realizada',
  edicao: 'Edição e legendas prontas',
  revisao: 'Revisado e pronto para envio'
};

function extractVideoChecklistFromNotes(notes = '') {
  const str = String(notes || '');
  const match = str.match(/\[checklist:([a-z,]*)\]\s*$/i);
  if (!match) return { cleanNotes: str, checklist: [] };
  const checklist = match[1].split(',').map(s => s.trim()).filter(s => VIDEO_CHECKLIST_LABELS[s]);
  const cleanNotes = str.replace(match[0], '').trim();
  return { cleanNotes, checklist };
}

function getVideoChecklistArray(video) {
  if (Array.isArray(video?.checklist) && video.checklist.length > 0) return video.checklist;
  return extractVideoChecklistFromNotes(video?.notes || '').checklist;
}

function updateVideoChecklistCount() {
  const checks = Array.from(document.querySelectorAll('.video-step-check'));
  const done = checks.filter(c => c.checked).length;
  const badge = document.getElementById('videoChecklistBadge');
  if (badge) badge.textContent = `${done}/${checks.length || 4}`;
}

async function copyVideoChecklistFromModal() {
  const title = (document.getElementById('videoTitle')?.value || '').trim() || 'Projeto de vídeo';
  const status = document.getElementById('videoStatus')?.value || 'A fazer';
  const checks = Array.from(document.querySelectorAll('.video-step-check'));
  const lines = [
    `*${title}* (${status})`,
    ...checks.map(c => `${c.checked ? '✅' : '⬜'} ${VIDEO_CHECKLIST_LABELS[c.value] || c.value}`)
  ];
  await copyTextToClipboard(lines.join('\n'), 'Checklist copiado!');
}

function openVideoModal(videoId = null) {
  ensureRecoveryStructures();
  const form = document.getElementById('videoForm');
  if (form && typeof form.reset === 'function') form.reset();
  document.getElementById('videoFormError')?.classList.add('hidden');
  let activeChecklist = [];

  if (videoId) {
    const v = (appData.videos || []).find(item => item.id === videoId);
    if (!v) return;
    const parsed = extractVideoChecklistFromNotes(v.notes || '');
    activeChecklist = Array.isArray(v.checklist) ? v.checklist : parsed.checklist;
    document.getElementById('videoModalTitle').textContent = 'Editar vídeo';
    document.getElementById('videoId').value = v.id;
    document.getElementById('videoTitle').value = v.title || '';
    document.getElementById('videoStatus').value = v.status || 'A fazer';
    document.getElementById('videoDescription').value = v.description || '';
    document.getElementById('videoDueDate').value = v.dueDate || '';
    document.getElementById('videoMaterialLink').value = v.materialLink || '';
    document.getElementById('videoFinalLink').value = v.finalLink || '';
    document.getElementById('videoNotes').value = parsed.cleanNotes;
  } else {
    document.getElementById('videoModalTitle').textContent = 'Novo vídeo';
    document.getElementById('videoId').value = '';
    document.getElementById('videoStatus').value = 'A fazer';
  }
  document.querySelectorAll('.video-step-check').forEach(cb => {
    cb.checked = activeChecklist.includes(cb.value);
  });
  updateVideoChecklistCount();
  openModal('videoModal');
}

async function handleVideoSubmit(e) {
  e.preventDefault();
  ensureRecoveryStructures();

  const id = document.getElementById('videoId').value;
  const title = document.getElementById('videoTitle').value.trim();
  const status = document.getElementById('videoStatus').value || 'A fazer';
  const description = document.getElementById('videoDescription').value.trim();
  const dueDate = document.getElementById('videoDueDate').value || '';
  const materialLink = document.getElementById('videoMaterialLink').value.trim();
  const finalLink = document.getElementById('videoFinalLink').value.trim();
  const rawNotes = document.getElementById('videoNotes').value.trim();
  const checklist = Array.from(document.querySelectorAll('.video-step-check')).filter(c => c.checked).map(c => c.value);
  const notes = checklist.length > 0 ? `${rawNotes ? `${rawNotes}\n` : ''}[checklist:${checklist.join(',')}]` : rawNotes;
  const errEl = document.getElementById('videoFormError');

  errEl?.classList.add('hidden');

  if (!title) {
    if (errEl) {
      errEl.textContent = 'O título do vídeo é obrigatório.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if ((materialLink && !isValidHttpUrl(materialLink)) || (finalLink && !isValidHttpUrl(finalLink))) {
    if (errEl) {
      errEl.textContent = 'Os links devem começar com http:// ou https://.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  try {
    if (supabase) {
      const payload = {
        titulo: title,
        descricao: description,
        status,
        data_prevista: dueDate || null,
        link_material: materialLink,
        link_final: finalLink,
        observacoes: notes
      };
      if (id) {
        const { error } = await supabase.from('videos').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('videos').insert([payload]);
        if (error) throw error;
      }
      await fetchFromSupabase();
    } else {
      if (id) {
        const v = appData.videos.find(item => item.id === id);
        if (v) {
          v.title = title;
          v.status = status;
          v.description = description;
          v.dueDate = dueDate;
          v.materialLink = materialLink;
          v.finalLink = finalLink;
          v.notes = notes;
        }
      } else {
        appData.videos.unshift({
          id: uid('vid'),
          title,
          description,
          status,
          dueDate,
          materialLink,
          finalLink,
          notes,
          archived: false,
          createdAt: new Date().toISOString()
        });
      }
      saveData();
    }
    closeModal('videoModal');
    renderVideosView();
    showToast(id ? 'Vídeo atualizado!' : 'Vídeo cadastrado!');
  } catch (err) {
    setPersistenceErrorUI(err.message);
    if (errEl) {
      errEl.textContent = 'Erro ao salvar vídeo: ' + (err.message || 'Erro desconhecido.');
      errEl.classList.remove('hidden');
    }
  }
}

async function toggleArchiveVideo(videoId) {
  ensureRecoveryStructures();
  const v = appData.videos.find(item => item.id === videoId);
  if (!v) return;
  const nextArchived = !v.archived;

  try {
    if (supabase) {
      const { error } = await supabase.from('videos').update({ arquivado: nextArchived }).eq('id', videoId);
      if (error) throw error;
      await fetchFromSupabase();
    } else {
      v.archived = nextArchived;
      saveData();
    }
    renderVideosView();
    showToast(nextArchived ? 'Vídeo arquivado.' : 'Vídeo restaurado.');
  } catch (err) {
    showToast('Erro ao atualizar vídeo: ' + (err.message || ''));
  }
}

function confirmDeleteVideo(videoId) {
  ensureRecoveryStructures();
  const v = appData.videos.find(item => item.id === videoId);
  if (!v) return;
  openConfirmModal(
    'Excluir Vídeo',
    `Deseja excluir o projeto de vídeo "${v.title}"? Isso não altera nenhum cliente ou saldo de publicações.`,
    async () => {
      try {
        if (supabase) {
          const { error } = await supabase.from('videos').update({ deleted_at: new Date().toISOString() }).eq('id', videoId);
          if (error) throw error;
          await fetchFromSupabase();
        } else {
          appData.videos = appData.videos.filter(item => item.id !== videoId);
          saveData();
        }
        renderVideosView();
        showToast('Vídeo excluído.');
      } catch (err) {
        showToast('Erro ao excluir vídeo: ' + (err.message || ''));
      }
    }
  );
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
    restoreFromTrash,
    hardDeleteFromTrash,
    openVideoModal,
    toggleArchiveVideo,
    confirmDeleteVideo,
    openLegacyClassificationModal,
    applyQuickStatusFilter,
    goToPostsWithStatus,
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
  updateMiniCalendarBadge();

  document.getElementById('btnRenewContractOneClick')?.addEventListener('click', () => openRenewContractReviewModal());

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
  document.getElementById('btnQuickNewPostTile')?.addEventListener('click', () => openPostModal(null, null, true));
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
  document.getElementById('postTitle')?.addEventListener('input', (e) => {
    e.target.dataset.autoSuggested = 'false';
  });
  document.getElementById('postLink')?.addEventListener('input', () => {
    checkDuplicatePostLink();
    autofillPostFieldsFromLink();
  });

  // Relatório de entregas & Relatório geral
  document.getElementById('reportContractSelect')?.addEventListener('change', renderDeliveryReportContent);
  document.getElementById('toggleReportMultiContracts')?.addEventListener('change', (e) => {
    const wrap = document.getElementById('reportMultiContractsWrap');
    const select = document.getElementById('reportContractSelect');
    if (wrap) wrap.classList.toggle('hidden', !e.target.checked);
    if (select) select.disabled = Boolean(e.target.checked);
    renderDeliveryReportContent();
  });
  document.getElementById('btnCopyReportText')?.addEventListener('click', copyDeliveryReportToClipboard);
  document.getElementById('btnShareReportWhatsApp')?.addEventListener('click', shareDeliveryReportWhatsApp);
  document.getElementById('btnPrintReport')?.addEventListener('click', () => window.print());

  document.getElementById('btnOpenGeneralReport')?.addEventListener('click', openGeneralReportModal);
  document.getElementById('generalReportPeriodSelect')?.addEventListener('change', renderGeneralReportContent);
  document.getElementById('btnExportGeneralCsv')?.addEventListener('click', exportGeneralReportCsv);
  document.getElementById('btnPrintGeneralReport')?.addEventListener('click', () => window.print());

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
  document.getElementById('globalClientStatusFilter')?.addEventListener('change', renderDashboard);
  document.getElementById('globalArchivedFilter')?.addEventListener('change', renderDashboard);
  document.getElementById('globalPortfolioConditionFilter')?.addEventListener('change', renderDashboard);
  document.getElementById('globalClientSort')?.addEventListener('change', renderDashboard);

  document.getElementById('btnClientsViewCards')?.addEventListener('click', () => setClientsViewMode('cards'));
  document.getElementById('btnClientsViewTable')?.addEventListener('click', () => setClientsViewMode('table'));

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

  document.getElementById('clientAvatarFile')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileNameHint = document.getElementById('clientAvatarFileName');
    if (fileNameHint) fileNameHint.textContent = `${file.name} (otimizada)`;
    uploadedAvatarBase64 = await compressAvatarImage(file);
    updateClientAvatarPreview(uploadedAvatarBase64, document.getElementById('clientName')?.value || '');
  });

  document.getElementById('clientForm')?.addEventListener('submit', handleClientSubmit);
  document.getElementById('renewContractForm')?.addEventListener('submit', handleRenewContractSubmit);
  document.getElementById('renewPeriodInput')?.addEventListener('input', (e) => {
    const client = appData.clients.find(c => c.id === currentClientId);
    if (client) checkRenewExistingContractWarning(client, e.target.value);
  });
  document.getElementById('contractForm')?.addEventListener('submit', handleContractSubmit);
  document.getElementById('contractAgreementType')?.addEventListener('change', syncContractAgreementFields);
  document.getElementById('contractHasDefinedQuantity')?.addEventListener('change', syncContractAgreementFields);
  document.getElementById('contractDurationMonths')?.addEventListener('change', applyContractDurationDates);
  document.getElementById('contractStartDate')?.addEventListener('change', applyContractDurationDates);

  // Categorias de acordos (Mensais ativos, Avulsos, Parceiros, Todos) e Legados
  document.querySelectorAll('[data-client-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      setClientCategory(btn.getAttribute('data-client-category'));
    });
  });
  document.getElementById('btnOpenLegacyClassificationModal')?.addEventListener('click', openLegacyClassificationModal);
  document.getElementById('btnSaveLegacyClassifications')?.addEventListener('click', applyLegacyClassifications);

  // Aba independente Vídeos
  document.getElementById('navVideosBtn')?.addEventListener('click', () => setDashboardMode('videos'));
  document.getElementById('mobileNavVideos')?.addEventListener('click', () => setDashboardMode('videos'));
  document.getElementById('btnNewVideoHeader')?.addEventListener('click', () => openVideoModal());
  document.getElementById('videosSearchInput')?.addEventListener('input', renderVideosView);
  document.getElementById('toggleShowArchivedVideos')?.addEventListener('change', renderVideosView);
  document.querySelectorAll('[data-video-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      videoStatusFilter = btn.getAttribute('data-video-status') || 'ALL';
      document.querySelectorAll('[data-video-status]').forEach(b => b.classList.toggle('active', b === btn));
      renderVideosView();
    });
  });
  document.getElementById('videoForm')?.addEventListener('submit', handleVideoSubmit);
  document.getElementById('postForm')?.addEventListener('submit', handlePostSubmit);
  document.getElementById('btnSaveAndAddAnotherPost')?.addEventListener('click', () => {
    const postFormEl = document.getElementById('postForm');
    if (!postFormEl) return;
    postSubmitKeepOpen = true;
    if (typeof postFormEl.requestSubmit === 'function') {
      postFormEl.requestSubmit();
    } else {
      postFormEl.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });
  document.getElementById('globalPostsPeriodMode')?.addEventListener('change', renderDashboard);

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

  // Ajustes -> Dados, Lixeira, Histórico, Backup e PWA
  document.getElementById('btnExportDataJson')?.addEventListener('click', exportUserDataJson);
  document.getElementById('btnImportDataJson')?.addEventListener('click', () => {
    document.getElementById('importBackupFile')?.click();
  });
  document.getElementById('importBackupFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleImportBackupFile(file);
    e.target.value = '';
  });
  document.getElementById('btnOpenTrashModal')?.addEventListener('click', openTrashModal);
  document.getElementById('btnOpenAuditLogModal')?.addEventListener('click', openAuditLogModal);
  document.getElementById('btnClearPwaCache')?.addEventListener('click', clearAppPwaCache);
  document.getElementById('btnNewPostSidebar')?.addEventListener('click', () => openGlobalNewPost());

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

Object.assign(window, {
  copyTextToClipboard,
  quickChangeVideoStatus,
  updateVideoChecklistCount,
  copyVideoChecklistFromModal
});
