/**
 * Configuração do Cliente Supabase (Banco de Dados & Autenticação)
 * Nenhuma chave secreta fica salva no código!
 * As variáveis são lidas automaticamente do arquivo .env (local) ou das Environment Variables da Vercel.
 */

const getEnv = (key) => {
  try {
    // Quando rodando via Vite / Vercel Build
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key].trim();
    }
  } catch (_) {}
  return '';
};

export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('http')
);

let supabaseInstance = null;

/**
 * Inicializa o cliente Supabase usando a biblioteca oficial carregada ou instalada
 */
export async function getSupabaseClient() {
  if (!isSupabaseConfigured) return null;
  if (supabaseInstance) return supabaseInstance;

  try {
    // Tenta usar o pacote npm @supabase/supabase-js (no Vite/Vercel) ou o global window.supabase (se aberto direto no navegador)
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
