import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const rawSupabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    !rawSupabaseUrl.includes('placeholder') &&
    !rawSupabaseUrl.includes('YOUR_') &&
    !rawSupabaseAnonKey.includes('YOUR_')
  );
}

const missingConfigurationError = new Error(
  'Supabase client configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
);

// Preserve client API without manufacturing mock JWT credentials
export const supabase = isSupabaseConfigured()
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      accessToken: async () => {
        try {
          const { auth } = await import('../firebase');
          const user = auth.currentUser;
          if (user) {
            return await user.getIdToken();
          }
        } catch {}
        return null;
      },
    })
  : (new Proxy({} as SupabaseClient, {
      get() {
        throw missingConfigurationError;
      },
    }));

/**
 * Attaches the Firebase JWT token to the client's Authorization header
 * Preserved for backward compatibility while accessToken callback provides automatic refresh.
 */
export function setSupabaseAuthToken(token: string | null) {
  if (!isSupabaseConfigured()) return;
  try {
    const headers = (supabase as any)?.rest?.headers;
    if (!headers) return;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
    }
  } catch (e) {
    console.warn('[Supabase] Failed to update auth header:', e);
  }
}

export default supabase;
