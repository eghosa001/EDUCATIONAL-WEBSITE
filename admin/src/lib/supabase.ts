import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xanrzsszrysianxhpprk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-b8MMXYbJQKauBFjYVJ0vg_SG0GMpFs';

export const createClientComponent = () => createClient(supabaseUrl, supabaseKey);
export const supabase = createClientComponent();
export default { createClientComponent, supabase };
