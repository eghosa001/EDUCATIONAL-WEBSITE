import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !user || !user.is_active) {
    return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return Response.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
  }

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', user.id);
  const roleIds = (roleRows || []).map(r => r.role_id);
  const { data: roles } = await supabase.from('roles').select('name').in('id', roleIds);
  const primaryRole = roles?.[0]?.name || 'student';

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: primaryRole },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', issuer: 'educational-platform', audience: 'educational-platform-users' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d', issuer: 'educational-platform', audience: 'educational-platform-users' }
  );

  return Response.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
        role: primaryRole,
      },
      tokens: { accessToken, refreshToken },
    },
  });
}
