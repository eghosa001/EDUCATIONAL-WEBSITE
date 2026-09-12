import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

export const supabaseUrl = config.supabase.url;
export const supabaseAnonKey = config.supabase.anonKey;
export const supabaseServiceRoleKey = config.supabase.serviceRoleKey;

export const createSupabaseClient = (useServiceRole = false) => {
  if (!supabaseUrl) {
    console.warn('[supabase] SUPABASE_URL not set — Supabase client unavailable');
    return null;
  }
  const key = useServiceRole ? supabaseServiceRoleKey : supabaseAnonKey;
  if (!key) {
    console.warn(`[supabase] ${useServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY'} not set — Supabase client unavailable`);
    return null;
  }
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = supabaseUrl && supabaseAnonKey ? createSupabaseClient(false) : null;
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey ? createSupabaseClient(true) : null;

export default { createSupabaseClient, supabase, supabaseAdmin };
