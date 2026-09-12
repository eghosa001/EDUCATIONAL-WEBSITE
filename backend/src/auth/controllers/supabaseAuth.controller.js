import { createSupabaseClient, supabaseAdmin } from '../../common/supabase/index.js';
import userService from '../../users/services/user.service.js';
import { supabaseUpdate } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const SECURE = process.env.NODE_ENV === 'production';
const SELF_SERVICE_ROLES = new Set(['student', 'teacher', 'parent']);

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: SECURE,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
};

const newAnonClient = () => {
  const client = createSupabaseClient(false);
  if (!client) {
    throw new AppError('Authentication service is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
  return client;
};

const tokensFromSession = (session) => ({
  accessToken: session.access_token,
  refreshToken: session.refresh_token,
});

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  middleName: user.middle_name,
  dateOfBirth: user.date_of_birth,
  gender: user.gender,
  avatarUrl: user.avatar_url,
  isVerified: user.is_verified,
  isActive: user.is_active,
  role: user.role,
  roles: user.roles,
  permissions: user.permissions,
  createdAt: user.created_at,
});

const loadActiveUser = async (id) => {
  const user = await userService.getUserById(id);
  if (!user) {
    throw new AppError('User account is not initialized', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
  if (!user.is_active) {
    throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
  }
  return user;
};

export const registerWithSupabase = async (req, res) => {
  const { email, password, firstName, lastName, middleName, role } = req.body;
  const assignedRole = SELF_SERVICE_ROLES.has(role) ? role : 'student';
  const client = newAnonClient();

  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName || null,
        role: assignedRole,
      },
    },
  });

  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message || '');
    throw new AppError(
      duplicate ? 'User with this email already exists' : error.message || 'Registration failed',
      duplicate ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST,
      duplicate ? ERROR_CODES.CONFLICT : ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (!data.user) {
    throw new AppError('Registration failed', HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  const user = await loadActiveUser(data.user.id);
  const tokens = data.session ? tokensFromSession(data.session) : null;
  if (tokens) setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: data.session
      ? 'Registration successful'
      : 'Registration successful. Verify your email before signing in.',
    data: {
      user: publicUser(user),
      tokens,
      requiresEmailVerification: !data.session,
    },
  });
};

export const loginWithSupabase = async (req, res) => {
  const { email, password } = req.body;
  const client = newAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user || !data.session) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const user = await loadActiveUser(data.user.id);
  await supabaseUpdate('users', { last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { id: user.id });

  const tokens = tokensFromSession(data.session);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: publicUser({ ...user, last_login_at: new Date().toISOString() }), tokens },
  });
};

export const refreshWithSupabase = async (req, res) => {
  const token = req.body?.refreshToken
    || req.supabaseRefreshToken
    || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    throw new AppError('No refresh token provided', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  const client = newAnonClient();
  const { data, error } = await client.auth.refreshSession({ refresh_token: token });
  if (error || !data.user || !data.session) {
    throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR);
  }

  await loadActiveUser(data.user.id);
  const tokens = tokensFromSession(data.session);
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  res.json({ success: true, message: 'Token refreshed', data: { tokens } });
};

export const logoutWithSupabase = async (req, res) => {
  try {
    if (supabaseAdmin && req.token) {
      await supabaseAdmin.auth.admin.signOut(req.token, 'local');
    }
  } catch (error) {
    console.warn('[supabase-auth] Session revocation failed:', error?.message || error);
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

export const logoutAllWithSupabase = async (req, res) => {
  try {
    if (supabaseAdmin && req.token) {
      await supabaseAdmin.auth.admin.signOut(req.token, 'global');
    }
  } catch (error) {
    console.warn('[supabase-auth] Global session revocation failed:', error?.message || error);
  }
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out from all devices' });
};
