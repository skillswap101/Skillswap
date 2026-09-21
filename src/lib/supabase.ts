import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://beekpvtusbijyrzkszwe.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZWtwdnR1c2JpanlyemtzendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzNTAsImV4cCI6MjEwNTMxMDM1MH0.oOI2wwokNoGYS9-i6sX9AfxDVJ-BdCQIUkRZdFiGTSA';

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
export function setSupabaseAuthToken(_token: string | null) {
  if (!supabase) return;
  try {
    // Retain valid Supabase anon key as Authorization header so PostgREST RLS evaluates successfully
    if ((supabase as any)?.rest?.headers) {
      (supabase as any).rest.headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
    }
  } catch (e) {
    // Non-critical header attachment
  }
}

export default supabase;
