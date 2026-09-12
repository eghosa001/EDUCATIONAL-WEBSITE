const hasSupabaseTarget = Boolean(
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_ID ||
  process.env.SUPABASE_DB_HOST ||
  process.env.VERCEL
);

if (hasSupabaseTarget) {
  console.error(
    'Refusing to run the legacy database seeder against Supabase/production. ' +
    'It creates local password-hash users outside Supabase Auth. Use migrations or an Auth-aware seed workflow instead.'
  );
  process.exit(1);
}

await import('./seed.js');
