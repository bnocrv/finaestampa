import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = (window.SUPABASE_URL || window.APP_CONFIG?.supabase?.url || '').trim();
const anonKey = (window.SUPABASE_ANON_KEY || window.APP_CONFIG?.supabase?.anonKey || '').trim();

function createFallbackQuery(result = { data: [], error: null }) {
  return {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    update() { return this; },
    insert() { return this; },
    delete() { return this; },
    then(resolve) {
      resolve(result);
    }
  };
}

function getFallbackSupabase() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { session: null },
        error: { message: 'Configure a URL e a chave pública do Supabase para ativar o login real.' }
      }),
      signOut: async () => ({ error: null })
    },
    from: () => createFallbackQuery(),
    channel: () => ({
      on() { return this; },
      subscribe() {
        return { unsubscribe() {} };
      }
    })
  };
}

export const supabase = url && anonKey && url !== 'https://your-project.supabase.co' && anonKey !== 'your-public-anon-key'
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : getFallbackSupabase();

export async function getSupabaseSession() {
  const { data: { session } = {} } = await supabase.auth.getSession();
  return session;
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function isSupabaseConfigured() {
  return Boolean(url && anonKey && url !== 'https://your-project.supabase.co' && anonKey !== 'your-public-anon-key');
}
