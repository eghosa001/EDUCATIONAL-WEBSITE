import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createSupabaseAdmin = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseAdmin = createSupabaseAdmin();
export const supabase = createSupabaseClient();

export default { createSupabaseAdmin, createSupabaseClient, supabaseAdmin, supabase };
