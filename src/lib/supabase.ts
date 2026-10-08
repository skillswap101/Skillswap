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
 * Preserved for backward compatibility.
 * Automatic token acquisition and refresh is handled by the official accessToken callback in createClient.
 */
export function setSupabaseAuthToken(_token: string | null): void {
  // Handled authoritatively by createClient({ accessToken })
}

export default supabase;
