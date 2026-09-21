import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://beekpvtusbijyrzkszwe.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZWtwdnR1c2JpanlyemtzendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzNTAsImV4cCI6MjEwNTMxMDM1MH0.oOI2wwokNoGYS9-i6sX9AfxDVJ-BdCQIUkRZdFiGTSA';

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
