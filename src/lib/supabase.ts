import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { api } from '@/lib/api';

// Resposta do endpoint de token Realtime
interface RealtimeTokenResponse {
  supabase_url: string;
  supabase_anon_key: string;
  token: string;
  expires_in: number; // segundos
}

// Estado compartilhado do singleton
let supabaseInstance: SupabaseClient | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

/**
 * Busca config + token JWT do Realtime via backend autenticado e
 * (re)configura o cliente Supabase singleton com o novo token.
 */
async function fetchAndApplyToken(): Promise<SupabaseClient> {
  const data = await api.get<RealtimeTokenResponse>('/realtime/token');

  if (!supabaseInstance) {
    // Primeira inicialização — cria o cliente com anon key apenas para abrir
    // a conexão Realtime; o token JWT com as policies RLS é aplicado abaixo.
    supabaseInstance = createClient(data.supabase_url, data.supabase_anon_key, {
      auth: {
        // Não usamos autenticação Supabase diretamente; apenas Realtime.
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  // Aplica o JWT assinado pelo backend — RLS vai validar o usuário
  supabaseInstance.realtime.setAuth(data.token);

  // Agenda o próximo refresh com margem de 60 s antes de expirar
  const refreshInMs = Math.max((data.expires_in - 60) * 1000, 30_000);
  scheduleRefresh(refreshInMs);

  return supabaseInstance;
}

function scheduleRefresh(delayMs: number) {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(async () => {
    try {
      await fetchAndApplyToken();
    } catch {
      // Tenta de novo em 30 s se falhar
      scheduleRefresh(30_000);
    }
  }, delayMs);
}

/**
 * Retorna (ou inicializa) o cliente Supabase singleton com token Realtime válido.
 * Seguro chamar múltiplas vezes — deduplica a requisição inicial.
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Garante que apenas uma requisição de inicialização aconteça em paralelo
  if (!initPromise) {
    initPromise = fetchAndApplyToken().finally(() => {
      initPromise = null;
    });
  }

  return initPromise;
}

/**
 * Destrói o singleton e cancela o refresh agendado.
 * Útil no logout para garantir que o próximo usuário não reutilize o token.
 */
export function destroySupabaseClient() {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (supabaseInstance) {
    supabaseInstance.removeAllChannels();
    supabaseInstance = null;
  }
  initPromise = null;
}
