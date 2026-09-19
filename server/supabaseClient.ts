import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://beekpvtusbijyrzkzwdw.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'process.env.SUPABASE_SERVICE_ROLE_KEY || ""';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or Supabase API Key in environment variables!");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
