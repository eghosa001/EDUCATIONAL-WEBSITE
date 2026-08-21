import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured. Add it to the web app environment.');
  }
  return value;
}

function getSupabaseKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is not configured.');
  }
  return value;
}

export const createClientComponent = () =>
  createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

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
