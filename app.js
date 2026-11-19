/**
 * SocialFlow CRM — Gerenciador de Clientes de Social Media
 * Suporte Híbrido:
 * - Produção (Vercel + Supabase): Autenticação por E-mail/Senha + Tabelas PostgreSQL (`clientes`, `contratos`, `postagens`) com RLS
 * - Desenvolvimento Local sem .env: Armazenamento Local (`localStorage`) com dados de exemplo
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

// Dados iniciais de exemplo com múltiplos meses de contrato para visualização imediata
const SAMPLE_DATA = {
  clients: [
    {
      id: 'cli_1',
      name: 'Mariana Costa',
      company: 'Studio Lumina Arquitetura',
      instagram: '@studiolumina.arq',
      phone: '(11) 99812-3456',
      email: 'contato@studiolumina.com.br',
      avatar: '',
      notes: 'Foco em Reels de antes/depois de obras e carrosséis educativos sobre iluminação residencial. Postagens terças, quintas e sábados.',
      contracts: [
        {
          id: 'cnt_101',
          period: 'Novembro/2026',
          totalPosts: 10,
          types: '4 Reels, 4 Carrosséis, 2 Fotos',
          value: 1800,
          status: 'Ativo'
        },
        {
          id: 'cnt_100',
          period: 'Outubro/2026',
          totalPosts: 8,
          types: '4 Reels, 4 Carrosséis',
          value: 1500,
          status: 'Concluído'
        }
      ],
      posts: [
        {
          id: 'pst_1',
          contractId: 'cnt_101',
          date: '2026-11-02',
          type: 'Reels',
          title: 'Tour completo pelo Apartamento Jardins (Antes e Depois)',
          link: 'https://www.instagram.com/reel/example1/',
          status: 'Publicado',
          notes: 'Bateu 15k visualizações orgânicas.'
        },
        {
          id: 'pst_2',
          contractId: 'cnt_101',
          date: '2026-11-05',
          type: 'Carrossel',
          title: '5 erros ao escolher iluminação para sala de estar',
          link: 'https://www.instagram.com/p/example2/',
          status: 'Publicado',
          notes: 'Muitos salvamentos.'
        },
        {
          id: 'pst_3',
          contractId: 'cnt_101',
          date: '2026-11-07',
          type: 'Foto',
          title: 'Detalhe marcenaria sob medida - Cozinha Gourmet',
          link: 'https://www.instagram.com/p/example3/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_4',
          contractId: 'cnt_101',
          date: '2026-11-09',
          type: 'Reels',
          title: 'Bastidores da visita técnica na obra Vila Madalena',
          link: 'https://www.instagram.com/reel/example4/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_5',
          contractId: 'cnt_101',
          date: '2026-11-11',
          type: 'Carrossel',
          title: 'Tendências de cores e texturas naturais para 2027',
          link: 'https://www.instagram.com/p/example5/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_6',
          contractId: 'cnt_101',
          date: '2026-11-13',
          type: 'Reels',
          title: 'Como integrar varanda e sala sem perder amplitude',
          link: 'https://www.instagram.com/reel/example6/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_7',
          contractId: 'cnt_101',
          date: '2026-11-15',
          type: 'Foto',
          title: 'Suíte Master minimalista com iluminação indireta',
          link: 'https://www.instagram.com/p/example7/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_8',
          contractId: 'cnt_101',
          date: '2026-11-17',
          type: 'Carrossel',
          title: 'Guia prático: Pedras naturais vs. Lâminas ultracompactas',
          link: 'https://www.instagram.com/p/example8/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_9',
          contractId: 'cnt_101',
          date: '2026-11-19',
          type: 'Reels',
          title: 'Dica rápida: Altura ideal de pendentes na mesa de jantar',
          link: 'https://www.instagram.com/reel/example9/',
          status: 'Publicado',
          notes: '9ª postagem publicada em Novembro/2026 — próximo do limite de 10!'
        },
        {
          id: 'pst_10',
          contractId: 'cnt_101',
          date: '2026-11-24',
          type: 'Carrossel',
          title: 'Retrospectiva de projetos entregues no mês',
          link: '',
          status: 'Agendado',
          notes: 'Arte aprovada, agendado no Meta Business Suite.'
        },
        {
          id: 'pst_099',
          contractId: 'cnt_100',
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
      id: 'cli_2',
      name: 'Dr. Rafael Mendes',
      company: 'Clínica OdontoPrime',
      instagram: '@dr.rafaelmendes',
      phone: '(21) 98765-1122',
      email: 'rafael@odontoprime.med.br',
      avatar: '',
      notes: 'Conteúdo institucional e educativo seguindo normas do CRO. Evitar termos sensacionalistas.',
      contracts: [
        {
          id: 'cnt_201',
          period: 'Novembro/2026',
          totalPosts: 12,
          types: '6 Reels, 6 Carrosséis',
          value: 2200,
          status: 'Ativo'
        },
        {
          id: 'cnt_202',
          period: 'Dezembro/2026',
          totalPosts: 10,
          types: '5 Reels, 5 Carrosséis',
          value: 2200,
          status: 'Ativo'
        }
      ],
      posts: [
        {
          id: 'pst_201',
          contractId: 'cnt_201',
          date: '2026-11-03',
          type: 'Reels',
          title: 'Mitos e verdades sobre clareamento dental a laser',
          link: 'https://www.instagram.com/reel/odonto1/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_202',
          contractId: 'cnt_201',
          date: '2026-11-08',
          type: 'Carrossel',
          title: 'Quando trocar as lentes de contato dental?',
          link: 'https://www.instagram.com/p/odonto2/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_203',
          contractId: 'cnt_201',
          date: '2026-11-14',
          type: 'Reels',
          title: 'Como funciona o escaneamento intraoral 3D',
          link: 'https://www.instagram.com/reel/odonto3/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_204',
          contractId: 'cnt_201',
          date: '2026-11-21',
          type: 'Carrossel',
          title: 'Cuidados essenciais no pós-operatório de implantes',
          link: '',
          status: 'Em produção',
          notes: 'Aguardando validação técnica do texto.'
        },
        {
          id: 'pst_205',
          contractId: 'cnt_201',
          date: '2026-11-26',
          type: 'Story',
          title: 'Sequência de Caixinha de Perguntas sobre Sensibilidade',
          link: '',
          status: 'Pendente',
          notes: 'Roteiro enviado para gravação.'
        },
        {
          id: 'pst_206',
          contractId: 'cnt_202',
          date: '2026-12-04',
          type: 'Reels',
          title: 'Check-up odontológico antes das festas de fim de ano',
          link: '',
          status: 'Pendente',
          notes: 'Planejamento antecipado de Dezembro/2026.'
        }
      ]
    },
    {
      id: 'cli_3',
      name: 'Camila & Bruno',
      company: 'Roast & Co. Cafeteria',
      instagram: '@roastco.cafe',
      phone: '(31) 99123-9988',
      email: 'ola@roastco.com.br',
      avatar: '',
      notes: 'Pacote enxuto de lançamento do cardápio de verão. Cliente já atingiu 100% do pacote contratado!',
      contracts: [
        {
          id: 'cnt_301',
          period: 'Novembro/2026',
          totalPosts: 4,
          types: '2 Reels, 2 Fotos',
          value: 950,
          status: 'Ativo'
        }
      ],
      posts: [
        {
          id: 'pst_301',
          contractId: 'cnt_301',
          date: '2026-11-04',
          type: 'Reels',
          title: 'ASMR preparando nosso novo Iced Caramel Latte',
          link: 'https://www.tiktok.com/@roastco/video/1',
          status: 'Publicado',
          notes: 'Postado no Reels e TikTok.'
        },
        {
          id: 'pst_302',
          contractId: 'cnt_301',
          date: '2026-11-10',
          type: 'Foto',
          title: 'Croissant de fermentação natural saindo do forno',
          link: 'https://www.instagram.com/p/cafe2/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_303',
          contractId: 'cnt_301',
          date: '2026-11-14',
          type: 'Reels',
          title: 'De onde vêm nossos grãos especiais da Serra da Canastra',
          link: 'https://www.instagram.com/reel/cafe3/',
          status: 'Publicado',
          notes: ''
        },
        {
          id: 'pst_304',
          contractId: 'cnt_301',
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
let uploadedAvatarBase64 = '';
let supabase = null;

// ==================== BANCO DE DADOS: SUPABASE & LOCALSTORAGE ====================

/**
 * Mapeia os registros vindos das 3 tabelas do Supabase (`clientes`, `contratos`, `postagens`)
 * para a estrutura em árvore utilizada pelo CRM.
 */
function mapSupabaseRowsToAppData(clientesRows = [], contratosRows = [], postagensRows = []) {
  return {
    clients: clientesRows.map(cli => ({
      id: cli.id,
      name: cli.nome || '',
      company: cli.empresa || '',
      instagram: cli.instagram || '',
      phone: cli.telefone || '',
      email: cli.email || '',
      avatar: cli.foto_url || '',
      notes: cli.observacoes || '',
      createdAt: cli.criado_em,
      contracts: contratosRows
        .filter(cnt => cnt.cliente_id === cli.id)
        .map(cnt => ({
          id: cnt.id,
          period: cnt.periodo || '',
          totalPosts: Number(cnt.total_postagens) || 0,
          types: cnt.tipos || '',
          value: cnt.valor !== null && cnt.valor !== undefined ? Number(cnt.valor) : '',
          status: cnt.status || 'Ativo',
          createdAt: cnt.criado_em
        })),
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
    }))
  };
}

/**
 * Carrega os dados das tabelas do Supabase (`clientes`, `contratos`, `postagens`)
 */
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

// ==================== AUTENTICAÇÃO SUPABASE (E-MAIL & SENHA) ====================
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

// ==================== HELPERS DE PERÍODO / MÊS DO CONTRATO ====================
function normalizePeriod(period = '') {
  return String(period).trim();
}

function getAllContractMonths() {
  const set = new Set();
  appData.clients.forEach(client => {
    (client.contracts || []).forEach(c => {
      const p = normalizePeriod(c.period);
      if (p) set.add(p);
    });
  });
  return Array.from(set);
}

function getPostContractPeriod(client, post) {
  const contracts = client.contracts || [];
  if (post.contractId) {
    const found = contracts.find(c => c.id === post.contractId);
    if (found) return normalizePeriod(found.period);
  }
  if (contracts.length === 1) {
    return normalizePeriod(contracts[0].period);
  }
  return '';
}

function populateContractMonthFilters() {
  const globalSelect = document.getElementById('globalContractMonthFilter');
  if (globalSelect) {
    const prevVal = globalSelect.value || 'ALL';
    const months = getAllContractMonths();
    globalSelect.innerHTML = `<option value="ALL">Todos os meses</option>` +
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
      const clientMonths = Array.from(new Set((client.contracts || []).map(c => normalizePeriod(c.period)).filter(Boolean)));
      profileSelect.innerHTML = `<option value="ALL">Todos os meses de contrato</option>` +
        clientMonths.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
      if (clientMonths.includes(prevProfileVal)) {
        profileSelect.value = prevProfileVal;
      } else {
        profileSelect.value = 'ALL';
      }
    }
  }
}

// ==================== CÁLCULOS DE MÉTRICAS ====================
function getClientMetrics(client, monthFilter = 'ALL') {
  const allContracts = client.contracts || [];
  const filteredContracts = allContracts.filter(c => {
    if (c.status === 'Cancelado') return false;
    if (monthFilter !== 'ALL' && normalizePeriod(c.period).toLowerCase() !== monthFilter.toLowerCase()) return false;
    return true;
  });

  const activeContractsCount = allContracts.filter(c => {
    if (c.status !== 'Ativo') return false;
    if (monthFilter !== 'ALL' && normalizePeriod(c.period).toLowerCase() !== monthFilter.toLowerCase()) return false;
    return true;
  }).length;

  const totalContracted = filteredContracts.reduce((acc, c) => acc + (Number(c.totalPosts) || 0), 0);

  const allPosts = (client.posts || []).filter(p => {
    if (monthFilter === 'ALL') return true;
    const pPeriod = getPostContractPeriod(client, p);
    return pPeriod.toLowerCase() === monthFilter.toLowerCase();
  });

  const totalPublished = allPosts.filter(p => p.status === 'Publicado').length;
  const countPendente = allPosts.filter(p => p.status === 'Pendente').length;
  const countProducao = allPosts.filter(p => p.status === 'Em produção').length;
  const countAgendado = allPosts.filter(p => p.status === 'Agendado').length;

  const remaining = Math.max(0, totalContracted - totalPublished);
  const percentage = totalContracted > 0
    ? Math.min(100, Math.round((totalPublished / totalContracted) * 100))
    : 0;

  const isAtLimit = totalContracted > 0 && totalPublished >= totalContracted;
  const isNearLimit = totalContracted > 0 && !isAtLimit && (remaining <= 2 || percentage >= 80);
  const isNearOrAtLimit = isAtLimit || isNearLimit;

  return {
    activeContractsCount,
    totalContracted,
    totalPublished,
    countPendente,
    countProducao,
    countAgendado,
    totalPostsInScope: allPosts.length,
    remaining,
    percentage,
    isAtLimit,
    isNearLimit,
    isNearOrAtLimit
  };
}

function getContractMetrics(client, contract) {
  const totalContracted = Number(contract.totalPosts) || 0;
  const allClientPosts = client.posts || [];

  const linkedPosts = allClientPosts.filter(p => {
    if (p.contractId === contract.id) return true;
    if (!p.contractId && (client.contracts || []).length === 1) return true;
    return false;
  });

  const linkedPublished = linkedPosts.filter(p => p.status === 'Publicado').length;
  const remaining = Math.max(0, totalContracted - linkedPublished);
  const percentage = totalContracted > 0
    ? Math.min(100, Math.round((linkedPublished / totalContracted) * 100))
    : 0;

  const isAtLimit = totalContracted > 0 && linkedPublished >= totalContracted;
  const isNearLimit = totalContracted > 0 && !isAtLimit && (remaining <= 2 || percentage >= 80);

  return {
    totalContracted,
    published: linkedPublished,
    totalLinked: linkedPosts.length,
    remaining,
    percentage,
    isAtLimit,
    isNearLimit,
    isNearOrAtLimit: isAtLimit || isNearLimit
  };
}

// ==================== HELPERS DE UI ====================
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatInstagram(handle = '') {
  const clean = handle.trim();
  if (!clean) return '';
  return clean.startsWith('@') ? clean : `@${clean}`;
}

function formatCurrency(val) {
  if (val === '' || val === null || val === undefined || isNaN(Number(val)) || Number(val) === 0) {
    return null;
  }
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(isoDate = '') {
  if (!isoDate) return 'Sem data';
  const parts = isoDate.split('-');
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
    case 'Cancelado': return 'badge-cancelado';
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
  }, 3000);
}

// ==================== RENDERIZAÇÃO: DASHBOARD CRM ====================
function setDashboardMode(mode) {
  dashboardMode = mode;
  const tabClients = document.getElementById('tabViewClients');
  const tabPosts = document.getElementById('tabViewPosts');
  const navClients = document.getElementById('navClientsBtn');
  const navPipeline = document.getElementById('navPipelineBtn');
  const clientsSubView = document.getElementById('clientsSubView');
  const globalPostsSubView = document.getElementById('globalPostsSubView');

  if (mode === 'posts') {
    tabClients?.classList.remove('active');
    tabPosts?.classList.add('active');
    navClients?.classList.remove('active');
    navPipeline?.classList.add('active');
    clientsSubView?.classList.add('hidden');
    globalPostsSubView?.classList.remove('hidden');
  } else {
    tabClients?.classList.add('active');
    tabPosts?.classList.remove('active');
    navClients?.classList.add('active');
    navPipeline?.classList.remove('active');
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

function renderDashboard() {
  populateContractMonthFilters();

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const monthFilter = document.getElementById('globalContractMonthFilter')?.value || 'ALL';
  const statusFilter = document.getElementById('globalPostStatusFilter')?.value || 'ALL';

  syncStatusPillsUI(statusFilter);

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

  const filteredClients = appData.clients.filter(c => {
    if (searchQuery) {
      const nameMatch = (c.name || '').toLowerCase().includes(searchQuery);
      const companyMatch = (c.company || '').toLowerCase().includes(searchQuery);
      const instaMatch = (c.instagram || '').toLowerCase().includes(searchQuery);
      if (!nameMatch && !companyMatch && !instaMatch) return false;
    }

    if (monthFilter !== 'ALL') {
      const hasContractInMonth = (c.contracts || []).some(
        cnt => normalizePeriod(cnt.period).toLowerCase() === monthFilter.toLowerCase()
      );
      if (!hasContractInMonth) return false;
    }

    const clientPostsInMonth = (c.posts || []).filter(p => {
      if (monthFilter === 'ALL') return true;
      return getPostContractPeriod(c, p).toLowerCase() === monthFilter.toLowerCase();
    });

    clientPostsInMonth.forEach(p => {
      funnelCounts.ALL += 1;
      if (funnelCounts[p.status] !== undefined) {
        funnelCounts[p.status] += 1;
      }
    });

    if (statusFilter !== 'ALL') {
      const hasPostWithStatus = clientPostsInMonth.some(p => p.status === statusFilter);
      if (!hasPostWithStatus) return false;
    }

    return true;
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
      { label: 'Pendente', dot: 'dot-pendente', count: funnelCounts['Pendente'] },
      { label: 'Em produção', dot: 'dot-producao', count: funnelCounts['Em produção'] },
      { label: 'Agendado', dot: 'dot-agendado', count: funnelCounts['Agendado'] },
      { label: 'Publicado', dot: 'dot-publicado', count: funnelCounts['Publicado'] }
    ];
    sidebarFunnel.innerHTML = rows.map(r => `
      <div class="mini-funnel-row" onclick="applyQuickStatusFilter('${escapeHtml(r.label)}')">
        <div class="mini-funnel-left">
          <span class="pill-dot ${r.dot}"></span>
          <span>${escapeHtml(r.label)}</span>
        </div>
        <span class="mini-funnel-count">${r.count}</span>
      </div>
    `).join('');
  }

  let totalContracted = 0;
  let totalPublished = 0;
  let totalPending = 0;

  filteredClients.forEach(client => {
    const m = getClientMetrics(client, monthFilter);
    totalContracted += m.totalContracted;
    totalPublished += m.totalPublished;
    totalPending += m.remaining;
  });

  setTxt('statTotalClients', filteredClients.length);
  setTxt('statTotalContracted', totalContracted);
  setTxt('statTotalPublished', totalPublished);
  setTxt('statTotalPending', totalPending);

  renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery);
  renderGlobalPostsFeed(filteredClients, monthFilter, statusFilter);
}

function renderClientsGrid(filteredClients, monthFilter, statusFilter, searchQuery) {
  const grid = document.getElementById('clientsGrid');
  if (!grid) return;

  if (filteredClients.length === 0) {
    const hasFilter = searchQuery || monthFilter !== 'ALL' || statusFilter !== 'ALL';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>${hasFilter ? 'Nenhum cliente encontrado para os filtros selecionados' : 'Nenhum cliente cadastrado ainda'}</h4>
        <p>${hasFilter ? 'Experimente limpar os filtros de Mês do Contrato, Status da Postagem ou termo de busca.' : 'Comece cadastrando seu primeiro cliente no CRM de social media.'}</p>
        ${hasFilter
          ? `<button type="button" class="btn btn-secondary btn-sm" onclick="resetGlobalFilters()">Limpar filtros</button>`
          : `<button type="button" class="btn btn-primary" onclick="openClientModal()">+ Cadastrar Primeiro Cliente</button>`
        }
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredClients.map(client => {
    const m = getClientMetrics(client, monthFilter);
    const avatarHtml = client.avatar
      ? `<img src="${escapeHtml(client.avatar)}" alt="${escapeHtml(client.name)}">`
      : escapeHtml(getInitials(client.name));

    let alertBadgeHtml = '';
    if (m.isAtLimit) {
      alertBadgeHtml = `<span class="limit-alert-badge" title="O cliente já atingiu 100% das postagens contratadas">Limite atingido</span>`;
    } else if (m.isNearLimit) {
      alertBadgeHtml = `<span class="limit-alert-badge" title="Restam poucas postagens no contrato atual">Próximo do limite</span>`;
    }

    const barFillClass = m.isNearOrAtLimit ? 'fill-danger' : 'fill-emerald';

    const contractTagsHtml = (client.contracts || []).map(cnt => {
      const isSelectedMonth = monthFilter !== 'ALL' && normalizePeriod(cnt.period).toLowerCase() === monthFilter.toLowerCase();
      return `<span class="contract-month-tag" style="${isSelectedMonth ? 'background: var(--primary-soft); color: var(--primary); border-color: var(--primary);' : ''}">📅 ${escapeHtml(cnt.period)}</span>`;
    }).join('');

    return `
      <article class="client-card ${m.isNearOrAtLimit ? 'near-limit' : ''}" data-client-id="${escapeHtml(client.id)}" onclick="openClientProfile('${escapeHtml(client.id)}')">
        <div class="client-card-top">
          <div class="client-identity">
            <div class="avatar">${avatarHtml}</div>
            <div class="client-title-wrap">
              <h3 class="client-name">${escapeHtml(client.name)}</h3>
              ${client.company ? `<p class="client-company">${escapeHtml(client.company)}</p>` : ''}
              <span class="client-handle">${escapeHtml(formatInstagram(client.instagram))}</span>
            </div>
          </div>
          ${alertBadgeHtml}
        </div>

        ${contractTagsHtml ? `<div class="crm-card-contracts-row">${contractTagsHtml}</div>` : ''}

        <div class="client-metrics">
          <div class="metric-box">
            <span class="metric-num">${m.totalContracted}</span>
            <span class="metric-lbl">Contratadas</span>
          </div>
          <div class="metric-box">
            <span class="metric-num">${m.totalPublished}</span>
            <span class="metric-lbl">Publicadas</span>
          </div>
          <div class="metric-box">
            <span class="metric-num ${m.isNearOrAtLimit ? 'danger-text' : ''}">${m.remaining}</span>
            <span class="metric-lbl">Restantes</span>
          </div>
        </div>

        <div class="crm-status-mini-row">
          <span class="mini-status-chip badge-pendente">Pendentes: ${m.countPendente}</span>
          <span class="mini-status-chip badge-producao">Produção: ${m.countProducao}</span>
          <span class="mini-status-chip badge-agendado">Agendados: ${m.countAgendado}</span>
          <span class="mini-status-chip badge-publicado">Publicados: ${m.totalPublished}</span>
        </div>

        <div class="progress-wrap">
          <div class="progress-meta">
            <span>Progresso ${monthFilter !== 'ALL' ? `(${escapeHtml(monthFilter)})` : 'do pacote'}</span>
            <strong>${m.percentage}% concluído</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barFillClass}" style="width: ${m.percentage}%"></div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderGlobalPostsFeed(filteredClients, monthFilter, statusFilter) {
  const listEl = document.getElementById('globalPostsList');
  const countLabel = document.getElementById('globalPostsCountLabel');
  if (!listEl) return;

  const allMatchingPosts = [];
  filteredClients.forEach(client => {
    (client.posts || []).forEach(post => {
      const postPeriod = getPostContractPeriod(client, post);
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
        <p>Altere o filtro de Status da Postagem ou Mês do Contrato para visualizar outras entregas.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = allMatchingPosts.map(({ client, post, postPeriod }) => {
    const statusBadgeClass = getPostStatusBadgeClass(post.status);
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
              👤 ${escapeHtml(client.name)} (${escapeHtml(formatInstagram(client.instagram))})
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
          <button type="button" class="btn btn-ghost btn-sm" onclick="openClientProfile('${escapeHtml(client.id)}')">Abrir Perfil</button>
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

// ==================== RENDERIZAÇÃO: PERFIL DO CLIENTE ====================
function openClientProfile(clientId) {
  const client = appData.clients.find(c => c.id === clientId);
  if (!client) return;

  currentClientId = clientId;
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('profileView').classList.remove('hidden');

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
  document.getElementById('profileView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
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
  const m = getClientMetrics(client, selectedProfileMonth);

  const avatarHtml = client.avatar
    ? `<img src="${escapeHtml(client.avatar)}" alt="${escapeHtml(client.name)}">`
    : escapeHtml(getInitials(client.name));

  let limitTag = '';
  if (m.isAtLimit) {
    limitTag = `<span class="limit-alert-badge">Limite contratado atingido (${m.totalPublished}/${m.totalContracted})</span>`;
  } else if (m.isNearLimit) {
    limitTag = `<span class="limit-alert-badge">Próximo do limite (${m.remaining} restante${m.remaining === 1 ? '' : 's'})</span>`;
  }

  document.getElementById('profileHeaderCard').innerHTML = `
    <div class="profile-top">
      <div class="profile-main-info">
        <div class="avatar avatar-lg">${avatarHtml}</div>
        <div class="profile-details">
          <h1>
            <span>${escapeHtml(client.name)}</span>
            ${limitTag}
          </h1>
          ${client.company ? `<p style="color: var(--text-muted); font-weight: 500;">${escapeHtml(client.company)}</p>` : ''}
          <div class="profile-meta-list">
            <span class="profile-meta-item">
              <strong style="color: var(--primary);">${escapeHtml(formatInstagram(client.instagram))}</strong>
            </span>
            ${client.phone ? `<span class="profile-meta-item">📱 ${escapeHtml(client.phone)}</span>` : ''}
            ${client.email ? `<span class="profile-meta-item">✉️ ${escapeHtml(client.email)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button type="button" class="btn btn-secondary" onclick="openClientModal('${escapeHtml(client.id)}')">
          Editar cliente
        </button>
        <button type="button" class="btn btn-outline-danger" onclick="confirmDeleteClient('${escapeHtml(client.id)}')">
          Excluir cliente
        </button>
      </div>
    </div>
    ${client.notes ? `<div class="profile-notes"><strong>Observações do CRM:</strong> ${escapeHtml(client.notes)}</div>` : ''}
  `;

  document.getElementById('profileStatsGrid').innerHTML = `
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Contratos Ativos ${selectedProfileMonth !== 'ALL' ? `(${escapeHtml(selectedProfileMonth)})` : ''}</span>
        <strong class="stat-value">${m.activeContractsCount}</strong>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Total Contratado</span>
        <strong class="stat-value">${m.totalContracted}</strong>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-info">
        <span class="stat-label">Total Publicado</span>
        <strong class="stat-value" style="color: var(--emerald-text);">${m.totalPublished}</strong>
      </div>
    </div>
    <div class="stat-card" style="${m.isNearOrAtLimit ? 'border-color: var(--danger-border); background: #fff5f5;' : ''}">
      <div class="stat-info">
        <span class="stat-label">Postagens Restantes</span>
        <strong class="stat-value" style="${m.isNearOrAtLimit ? 'color: var(--danger);' : ''}">${m.remaining}</strong>
      </div>
    </div>
  `;

  renderContractsList(client, selectedProfileMonth);
  renderPostsList(client);
}

function renderContractsList(client, selectedProfileMonth = 'ALL') {
  const container = document.getElementById('contractsList');
  const contracts = client.contracts || [];

  if (contracts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h4>Nenhum contrato cadastrado</h4>
        <p>Crie um contrato mensal ou pacote de postagens para acompanhar o limite contratado.</p>
        <button type="button" class="btn btn-secondary btn-sm" onclick="openContractModal()">+ Criar Contrato</button>
      </div>
    `;
    return;
  }

  container.innerHTML = contracts.map(contract => {
    const cm = getContractMetrics(client, contract);
    const badgeClass = getContractStatusBadgeClass(contract.status);
    const formattedVal = formatCurrency(contract.value);
    const nearClass = (contract.status === 'Ativo' && cm.isNearOrAtLimit) ? 'contract-near-limit' : '';
    const isSelected = selectedProfileMonth !== 'ALL' && normalizePeriod(contract.period).toLowerCase() === selectedProfileMonth.toLowerCase();

    return `
      <div class="contract-card ${nearClass} ${isSelected ? 'contract-selected' : ''}">
        <div class="contract-header">
          <div>
            <div class="contract-period" onclick="filterProfileByContractMonth('${escapeHtml(normalizePeriod(contract.period))}')" title="Clique para filtrar as postagens deste mês">
              📅 ${escapeHtml(contract.period)}
            </div>
            ${contract.types ? `<div class="contract-types">${escapeHtml(contract.types)}</div>` : ''}
          </div>
          <span class="badge ${badgeClass}">Contrato ${escapeHtml(contract.status)}</span>
        </div>

        ${formattedVal ? `<div class="contract-value">Valor: ${formattedVal}</div>` : ''}

        <div class="contract-stats-row">
          <span>Contratadas: <strong>${cm.totalContracted}</strong></span>
          <span>Publicadas: <strong>${cm.published}</strong></span>
          <span>Restantes: <strong style="${cm.isNearOrAtLimit ? 'color: var(--danger);' : ''}">${cm.remaining}</strong></span>
        </div>

        <div class="progress-wrap">
          <div class="progress-meta">
            <span>Progresso do contrato</span>
            <strong>${cm.percentage}%</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${cm.isNearOrAtLimit ? 'fill-danger' : 'fill-emerald'}" style="width: ${cm.percentage}%"></div>
          </div>
        </div>

        <div class="contract-footer">
          <button type="button" class="btn btn-ghost btn-sm" onclick="filterProfileByContractMonth('${escapeHtml(normalizePeriod(contract.period))}')">
            ${isSelected ? '✓ Filtrando mês' : 'Filtrar postagens'}
          </button>
          <div>
            <button type="button" class="btn btn-ghost btn-sm" onclick="openContractModal('${escapeHtml(contract.id)}')">Editar</button>
            <button type="button" class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="confirmDeleteContract('${escapeHtml(contract.id)}')">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPostsList(client) {
  const container = document.getElementById('postsList');
  const filterStatus = document.getElementById('filterPostStatus')?.value || 'ALL';
  const filterMonth = document.getElementById('filterProfileContractMonth')?.value || 'ALL';

  let posts = [...(client.posts || [])];
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (filterMonth !== 'ALL') {
    posts = posts.filter(p => getPostContractPeriod(client, p).toLowerCase() === filterMonth.toLowerCase());
  }

  if (filterStatus !== 'ALL') {
    posts = posts.filter(p => p.status === filterStatus);
  }

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Nenhuma postagem encontrada</h4>
        <p>${filterStatus === 'ALL' && filterMonth === 'ALL'
          ? 'Registre as postagens planejadas ou já publicadas deste cliente.'
          : 'Não há postagens que correspondam aos filtros de Mês do Contrato e Status selecionados.'}</p>
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
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <button type="button" class="btn btn-ghost btn-sm" onclick="openPostModal('${escapeHtml(post.id)}')">Editar</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="confirmDeletePost('${escapeHtml(post.id)}')">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== MODAIS & FORMULÁRIOS (CRUD HÍBRIDO SUPABASE + LOCAL) ====================
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// --- Modal Cliente ---
function openClientModal(clientId = null) {
  const form = document.getElementById('clientForm');
  if (form && typeof form.reset === 'function') form.reset();
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
  const id = document.getElementById('clientId').value;
  const name = document.getElementById('clientName').value.trim();
  const company = document.getElementById('clientCompany').value.trim();
  const instagram = formatInstagram(document.getElementById('clientInstagram').value);
  const phone = document.getElementById('clientPhone').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const avatarUrl = document.getElementById('clientAvatar').value.trim();
  const notes = document.getElementById('clientNotes').value.trim();

  const finalAvatar = uploadedAvatarBase64 || avatarUrl || '';

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
      if (error) {
        showToast('Erro ao atualizar cliente: ' + error.message);
        return;
      }
      showToast('Dados do cliente atualizados no Supabase!');
    } else {
      const { error } = await supabase.from('clientes').insert([payload]);
      if (error) {
        showToast('Erro ao cadastrar cliente: ' + error.message);
        return;
      }
      showToast('Novo cliente salvo no Supabase!');
    }

    await fetchFromSupabase();
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
        showToast('Dados do cliente atualizados!');
      }
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
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const form = document.getElementById('contractForm');
  if (form && typeof form.reset === 'function') form.reset();

  if (contractId) {
    const contract = (client.contracts || []).find(c => c.id === contractId);
    if (!contract) return;
    document.getElementById('contractModalTitle').textContent = 'Editar Contrato';
    document.getElementById('contractId').value = contract.id;
    document.getElementById('contractPeriod').value = contract.period || '';
    document.getElementById('contractTotalPosts').value = contract.totalPosts || '';
    document.getElementById('contractTypes').value = contract.types || '';
    document.getElementById('contractValue').value = contract.value || '';
    document.getElementById('contractStatus').value = contract.status || 'Ativo';
  } else {
    document.getElementById('contractModalTitle').textContent = 'Novo Contrato de Postagens';
    document.getElementById('contractId').value = '';
    document.getElementById('contractStatus').value = 'Ativo';
  }

  openModal('contractModal');
}

async function handleContractSubmit(e) {
  e.preventDefault();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const id = document.getElementById('contractId').value;
  const period = document.getElementById('contractPeriod').value.trim();
  const totalPosts = Number(document.getElementById('contractTotalPosts').value) || 0;
  const types = document.getElementById('contractTypes').value.trim();
  const valueRaw = document.getElementById('contractValue').value;
  const value = valueRaw !== '' ? Number(valueRaw) : null;
  const status = document.getElementById('contractStatus').value;

  if (supabase) {
    const payload = {
      cliente_id: client.id,
      periodo: period,
      total_postagens: totalPosts,
      tipos: types,
      valor: value,
      status
    };

    if (id) {
      const { error } = await supabase.from('contratos').update(payload).eq('id', id);
      if (error) {
        showToast('Erro ao atualizar contrato: ' + error.message);
        return;
      }
      showToast('Contrato atualizado no Supabase!');
    } else {
      const { error } = await supabase.from('contratos').insert([payload]);
      if (error) {
        showToast('Erro ao criar contrato: ' + error.message);
        return;
      }
      showToast('Contrato salvo no Supabase!');
    }
    await fetchFromSupabase();
  } else {
    if (!client.contracts) client.contracts = [];
    if (id) {
      const contract = client.contracts.find(c => c.id === id);
      if (contract) {
        contract.period = period;
        contract.totalPosts = totalPosts;
        contract.types = types;
        contract.value = value !== null ? value : '';
        contract.status = status;
        showToast('Contrato atualizado!');
      }
    } else {
      client.contracts.unshift({
        id: uid('cnt'),
        period,
        totalPosts,
        types,
        value: value !== null ? value : '',
        status
      });
      showToast('Contrato adicionado ao cliente!');
    }
    saveData();
  }

  closeModal('contractModal');
  renderClientProfile();
}

function confirmDeleteContract(contractId) {
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

// --- Modal Postagem ---
function openPostModal(postId = null) {
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const form = document.getElementById('postForm');
  if (form && typeof form.reset === 'function') form.reset();

  const contractSelect = document.getElementById('postContractId');
  const contracts = client.contracts || [];
  contractSelect.innerHTML = `<option value="">Automático / Pacote Geral</option>` +
    contracts.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.period)} (${escapeHtml(c.status)})</option>`).join('');

  if (postId) {
    const post = (client.posts || []).find(p => p.id === postId);
    if (!post) return;
    document.getElementById('postModalTitle').textContent = 'Editar Postagem';
    document.getElementById('postId').value = post.id;
    document.getElementById('postDate').value = post.date || '';
    document.getElementById('postType').value = post.type || 'Reels';
    document.getElementById('postStatus').value = post.status || 'Pendente';
    document.getElementById('postContractId').value = post.contractId || '';
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postLink').value = post.link || '';
    document.getElementById('postNotes').value = post.notes || '';
  } else {
    document.getElementById('postModalTitle').textContent = 'Nova Postagem';
    document.getElementById('postId').value = '';
    document.getElementById('postDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('postType').value = 'Reels';
    document.getElementById('postStatus').value = 'Publicado';

    const activeContract = contracts.find(c => c.status === 'Ativo');
    if (activeContract) {
      contractSelect.value = activeContract.id;
    }
  }

  openModal('postModal');
}

async function handlePostSubmit(e) {
  e.preventDefault();
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;

  const id = document.getElementById('postId').value;
  const date = document.getElementById('postDate').value;
  const type = document.getElementById('postType').value;
  const status = document.getElementById('postStatus').value;
  const contractId = document.getElementById('postContractId').value;
  const title = document.getElementById('postTitle').value.trim();
  const link = document.getElementById('postLink').value.trim();
  const notes = document.getElementById('postNotes').value.trim();

  if (supabase) {
    const payload = {
      cliente_id: client.id,
      contrato_id: contractId || null,
      data: date,
      tipo: type,
      titulo: title,
      link,
      status,
      observacoes: notes
    };

    if (id) {
      const { error } = await supabase.from('postagens').update(payload).eq('id', id);
      if (error) {
        showToast('Erro ao atualizar postagem: ' + error.message);
        return;
      }
      showToast('Postagem atualizada no Supabase!');
    } else {
      const { error } = await supabase.from('postagens').insert([payload]);
      if (error) {
        showToast('Erro ao salvar postagem: ' + error.message);
        return;
      }
      showToast(status === 'Publicado' ? 'Postagem publicada e contabilizada!' : 'Postagem salva no Supabase!');
    }
    await fetchFromSupabase();
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
        showToast('Postagem atualizada!');
      }
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
      showToast(status === 'Publicado' ? 'Postagem publicada e contabilizada!' : 'Postagem cadastrada!');
    }
    saveData();
  }

  closeModal('postModal');
  renderClientProfile();
}

function confirmDeletePost(postId) {
  const client = appData.clients.find(c => c.id === currentClientId);
  if (!client) return;
  const post = (client.posts || []).find(p => p.id === postId);
  if (!post) return;

  openConfirmModal(
    'Excluir Postagem',
    `Deseja excluir a postagem "${post.title}"? O contador de postagens será atualizado automaticamente.`,
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

// --- Modal de Confirmação Genérico ---
function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  pendingConfirmCallback = onConfirm;
  openModal('confirmModal');
}

// Expõe funções chamadas via onclick no HTML quando carregado como ES Module (`type="module"`)
if (typeof window !== 'undefined') {
  Object.assign(window, {
    openClientProfile,
    openClientModal,
    confirmDeleteClient,
    openContractModal,
    confirmDeleteContract,
    openPostModal,
    confirmDeletePost,
    applyQuickStatusFilter,
    resetGlobalFilters,
    filterProfileByContractMonth
  });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
  initBackendAndAuth();

  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  document.getElementById('brandLogo').addEventListener('click', () => {
    setDashboardMode('clients');
    backToDashboard();
  });
  document.getElementById('btnBackToDashboard').addEventListener('click', backToDashboard);

  document.getElementById('navClientsBtn')?.addEventListener('click', () => {
    setDashboardMode('clients');
    backToDashboard();
  });
  document.getElementById('navPipelineBtn')?.addEventListener('click', () => {
    setDashboardMode('posts');
    backToDashboard();
  });

  document.getElementById('tabViewClients')?.addEventListener('click', () => setDashboardMode('clients'));
  document.getElementById('tabViewPosts')?.addEventListener('click', () => setDashboardMode('posts'));

  document.getElementById('btnNewClientHeader').addEventListener('click', () => openClientModal());
  document.getElementById('btnNewContract').addEventListener('click', () => openContractModal());
  document.getElementById('btnNewPost').addEventListener('click', () => openPostModal());

  document.getElementById('searchInput').addEventListener('input', () => {
    if (currentClientId) backToDashboard();
    else renderDashboard();
  });

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

  document.getElementById('btnClearGlobalFilters')?.addEventListener('click', () => {
    resetGlobalFilters();
  });

  document.querySelectorAll('[data-status-pill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-status-pill');
      applyQuickStatusFilter(status);
    });
  });

  document.getElementById('filterPostStatus').addEventListener('change', () => {
    const client = appData.clients.find(c => c.id === currentClientId);
    if (client) renderPostsList(client);
  });

  document.getElementById('filterProfileContractMonth')?.addEventListener('change', () => {
    renderClientProfile();
  });

  document.getElementById('clientAvatarFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      uploadedAvatarBase64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
  document.getElementById('contractForm').addEventListener('submit', handleContractSubmit);
  document.getElementById('postForm').addEventListener('submit', handlePostSubmit);

  document.getElementById('btnConfirmAction').addEventListener('click', async () => {
    if (typeof pendingConfirmCallback === 'function') {
      await pendingConfirmCallback();
    }
    pendingConfirmCallback = null;
    closeModal('confirmModal');
  });

  document.getElementById('btnClearData').addEventListener('click', () => {
    openConfirmModal(
      'Limpar todos os dados',
      'Deseja remover todos os clientes e postagens de exemplo para começar a usar o CRM do zero?',
      async () => {
        if (supabase) {
          await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await fetchFromSupabase();
        } else {
          appData = { clients: [] };
          saveData();
        }
        resetGlobalFilters();
        backToDashboard();
        showToast('Dados limpos! Pronto para cadastrar seus clientes.');
      }
    );
  });

  document.getElementById('btnResetDemo').addEventListener('click', () => {
    openConfirmModal(
      'Restaurar dados de exemplo',
      'Isso irá carregar novamente os 3 clientes de exemplo para demonstração. Deseja continuar?',
      async () => {
        appData = JSON.parse(JSON.stringify(SAMPLE_DATA));
        saveData();
        resetGlobalFilters();
        backToDashboard();
        showToast('Dados de exemplo restaurados!');
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
