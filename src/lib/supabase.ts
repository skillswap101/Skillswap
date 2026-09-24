import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_') &&
  !supabaseAnonKey.includes('YOUR_')
);

const missingConfigurationError = new Error(
  'Supabase client configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
);

// Preserve the client API without manufacturing credentials when configuration is absent.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : new Proxy({} as SupabaseClient, {
      get() {
        throw missingConfigurationError;
      },
    });

export function setSupabaseAuthToken(token: string | null) {
  if (!isSupabaseConfigured) return;

  try {
    const headers = (supabase as any)?.rest?.headers;
    if (!headers) return;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
    }
  } catch (error) {
    console.warn('[Supabase] Failed to update auth header:', error);
  }
}

export default supabase;
