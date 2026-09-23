import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://beekpvtusbijyrzkszwe.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_') &&
  !supabaseAnonKey.includes('YOUR_')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Attaches the Firebase JWT token to the client's Authorization header
 * so Supabase RLS can evaluate auth.uid() if Third-Party JWT is enabled in Supabase Dashboard.
 */
export function setSupabaseAuthToken(token: string | null) {
  if (!supabase) return;
  try {
    const headers = (supabase as any)?.rest?.headers;
    if (!headers) return;
    headers['Authorization'] = token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`;
  } catch (e) {
    console.warn('[Supabase] Failed to update auth header:', e);
  }
}

export default supabase;
