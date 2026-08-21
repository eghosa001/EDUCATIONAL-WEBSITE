export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Decode JWT payload without verifying signature (server-side only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    return Response.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  const userId = payload.sub as string;
  const supabase = getSupabase();

  // Fetch user from auth to get email and confirmation status
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  if (!authUser.user) {
    return Response.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Fetch profile using service role (bypasses RLS)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch roles
  const roleRows = (await supabase
    .from('user_roles')
    .select('roles!inner(name, permissions)')
    .eq('user_id', userId)
  ).data || [];

  const roles = roleRows.map((r: any) => r.roles.name) || ['student'];
  const primaryRole = roles[0] || 'student';
  const permissions = roleRows.length > 0 ? (roleRows[0] as any).roles.permissions : {};

  return Response.json({
    success: true,
    data: {
      user: {
        id: userId,
        email: authUser.user.email,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        middleName: profile?.middle_name || null,
        dateOfBirth: profile?.date_of_birth || null,
        gender: profile?.gender || null,
        avatarUrl: profile?.avatar_url || null,
        isVerified: authUser.user.email_confirmed_at !== null,
        isActive: profile?.is_active !== false,
        role: primaryRole,
        roles,
        permissions,
        createdAt: profile?.created_at || authUser.user.created_at,
      },
      tokens: {
        accessToken: token,
        refreshToken: '',
      },
    },
  });
}
