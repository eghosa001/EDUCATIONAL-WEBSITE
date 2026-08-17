import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

export const supabaseUrl = config.supabase.url;
export const supabaseAnonKey = config.supabase.anonKey;
export const supabaseServiceRoleKey = config.supabase.serviceRoleKey;

export const createSupabaseClient = (useServiceRole = false) => {
  const key = useServiceRole ? supabaseServiceRoleKey : supabaseAnonKey;
  return createClient(supabaseUrl, key);
};

export const supabase = createSupabaseClient(false);
export const supabaseAdmin = createSupabaseClient(true);

export default { createSupabaseClient, supabase, supabaseAdmin };
