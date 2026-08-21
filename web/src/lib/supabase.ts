import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xanrzsszrysianxhpprk.supabase.co';
const PUBLIC_SUPABASE_KEY = 'sb_publishable_-b8MMXYbJQKauBFjYVJ0vg_SG0GMpFs';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
}

function getSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    PUBLIC_SUPABASE_KEY;
}

export const createClientComponent = () => createClient(getSupabaseUrl(), getSupabaseKey());

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
