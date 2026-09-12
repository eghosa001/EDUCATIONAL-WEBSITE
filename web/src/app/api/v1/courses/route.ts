import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ success: false, error: 'Course service is not configured' }, { status: 503 });
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // This route is a public catalog endpoint. Draft/archived courses belong in
  // authenticated author/admin flows and must never be selectable here.
  const query = supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) return Response.json({ success: false, error: 'Unable to load courses' }, { status: 500 });

  return Response.json(
    { success: true, data: data || [], pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
