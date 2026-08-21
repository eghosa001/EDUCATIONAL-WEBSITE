export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  const supabase = getSupabase();

  // Sign in using Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return Response.json(
      { success: false, error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Fetch profile and roles
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const roleRows = (await supabase
    .from('user_roles')
    .select('role_id, roles!inner(name, permissions)')
    .eq('user_id', data.user.id)
  ).data || [];

  const primaryRole = roleRows.length > 0
    ? (roleRows[0] as any).roles?.name || 'student'
    : 'student';

  const permissions = roleRows.length > 0
    ? (roleRows[0] as any).roles?.permissions || {}
    : {};

  // Return session + profile (no JWT needed — Supabase manages sessions)
  return Response.json({
    success: true,
    message: 'Login successful',
    data: {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        middleName: profile?.middle_name || null,
        dateOfBirth: profile?.date_of_birth || null,
        gender: profile?.gender || null,
        avatarUrl: profile?.avatar_url || null,
        isVerified: data.user.email_confirmed_at !== null,
        role: primaryRole,
        permissions,
        createdAt: profile?.created_at || data.user.created_at,
      },
    },
  });
}
