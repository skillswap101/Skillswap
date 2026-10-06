import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

// Server must only use the privileged service role key, never downgraded to anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_') &&
  supabaseKey &&
  !supabaseKey.includes('placeholder')
);

if (isProduction && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY is required in production! Never downgrade to public anon key on the backend.");
} else if (!isSupabaseConfigured) {
  console.warn("⚠️ Warning: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server environment variables!");
}

// Fallback dummy token format to prevent createClient constructor from throwing at module load time
const effectiveKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', effectiveKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
