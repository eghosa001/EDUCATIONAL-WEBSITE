import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be configured');
}

export const createSupabaseAdmin = () => {
  if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured for admin operations');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

export const createSupabaseClient = () => {
  if (!supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY must be configured');
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseAdmin = createSupabaseAdmin();
export const supabase = createSupabaseClient();

export default { createSupabaseAdmin, createSupabaseClient, supabaseAdmin, supabase };
