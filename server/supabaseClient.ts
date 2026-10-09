import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const defaultSupabaseUrl = 'https://beekpvtusbijyrzkszwe.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZWtwdnR1c2JpanlyemtzendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzNTAsImV4cCI6MjEwNTMxMDM1MH0.oOI2wwokNoGYS9-i6sX9AfxDVJ-BdCQIUkRZdFiGTSA';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || defaultSupabaseUrl;

// Server prefers privileged service role key; in local dev fallback to project key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (!isProduction ? (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey) : '');

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

// Fallback token to prevent createClient constructor from throwing
const effectiveKey = supabaseKey || defaultAnonKey;

export const supabase = createClient(supabaseUrl || defaultSupabaseUrl, effectiveKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
