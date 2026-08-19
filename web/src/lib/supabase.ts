import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('[supabase] No anon key provided — Supabase client operations will fail. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const createClientComponent = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createClientComponent();

export default { createClientComponent, supabase };
