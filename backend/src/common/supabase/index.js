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
  return createClient(supabaseUrl, key);
};

export const supabase = supabaseUrl ? createSupabaseClient(false) : null;
export const supabaseAdmin = supabaseUrl ? createSupabaseClient(true) : null;

export default { createSupabaseClient, supabase, supabaseAdmin };
