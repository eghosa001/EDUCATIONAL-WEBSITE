export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const { email, password, firstName, lastName, middleName, role } = await request.json();

  if (!email || !password || !firstName || !lastName) {
    return Response.json(
      { success: false, error: 'Email, password, first name and last name are required' },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Check if user already exists in auth
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    return Response.json(
      { success: false, error: 'User with this email already exists' },
      { status: 409 }
    );
  }

  // Create user via Supabase Auth admin API (bypasses email confirmation)
  const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || '',
      role: role || 'student',
    },
  });

  if (authErr || !newUser.user) {
    return Response.json(
      { success: false, error: authErr?.message || 'Registration failed' },
      { status: 500 }
    );
  }

  // Create profile row
  await supabase.from('profiles').insert({
    id: newUser.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName || null,
  });

  // Assign role
  const { data: roleRow } = await supabase
    .from('roles')
    .select('id')
    .eq('name', role || 'student')
    .single();

  if (roleRow) {
    await supabase.from('user_roles').insert({
      user_id: newUser.user.id,
      role_id: roleRow.id,
    });
  }

  return Response.json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        firstName,
        lastName,
        role: role || 'student',
        isVerified: true,
      },
    },
  });
}
