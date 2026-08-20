import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

export const createClientComponent = () => {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
};

let _supabase: ReturnType<typeof createClientComponent> | null = null;
export function getSupabase() {
  if (!_supabase) _supabase = createClientComponent();
  return _supabase;
}

export const supabase = new Proxy({} as ReturnType<typeof createClientComponent>, {
  get(_, prop) {
    return (getSupabase() as any)[prop];
  },
});

export default { createClientComponent, supabase: getSupabase };
