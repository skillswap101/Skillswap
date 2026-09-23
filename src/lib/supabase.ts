import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const rawSupabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
  rawSupabaseAnonKey &&
  !rawSupabaseUrl.includes('placeholder') &&
  !rawSupabaseUrl.includes('YOUR_') &&
  !rawSupabaseAnonKey.includes('YOUR_')
);

// Fallback dummy credentials to prevent createClient constructor from throwing when unconfigured
const effectiveUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const effectiveAnonKey = rawSupabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(effectiveUrl, effectiveAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function setSupabaseAuthToken(token: string | null) {
  if (!supabase) return;
  try {
    const headers = (supabase as any)?.rest?.headers;
    if (!headers) return;
    headers['Authorization'] = token ? `Bearer ${token}` : `Bearer ${effectiveAnonKey}`;
  } catch (e) {
    console.warn('[Supabase] Failed to update auth header:', e);
  }
}

export default supabase;
