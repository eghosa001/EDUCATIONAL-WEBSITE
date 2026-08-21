import { getSupabase } from '@/lib/supabase';
import type { User } from '@/types/models/user';

// Authentication is owned by Supabase Auth. The legacy Express/JWT auth endpoints
// are no longer part of the web application's authentication path.

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    session: {
      access_token: string;
      refresh_token: string;
      user: { id: string; email?: string };
    };
    user: User;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'teacher' | 'parent';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: { id: string; email: string; firstName: string; lastName: string; isVerified: boolean; role: string };
  };
}

export interface TokenResponse {
  success: boolean;
  data: { tokens: { accessToken: string; refreshToken: string } };
}

export interface AuthMessageResponse {
  success: boolean;
  message: string;
}

const mapUser = async (authUser: any): Promise<User> => {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', authUser.id);

  const role = ((roleRows || []).map((row: any) => row.roles?.name).find(Boolean) || authUser.user_metadata?.role || 'student') as User['role'];
  const createdAt = profile?.created_at || authUser.created_at || new Date().toISOString();

  return {
    id: authUser.id,
    email: authUser.email || profile?.email || '',
    firstName: profile?.first_name || authUser.user_metadata?.first_name || '',
    lastName: profile?.last_name || authUser.user_metadata?.last_name || '',
    role,
    avatar: profile?.avatar_url || undefined,
    createdAt,
    updatedAt: profile?.updated_at || createdAt,
  } as User;
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message || 'Invalid email or password');
  }

  return {
    success: true,
    message: 'Signed in successfully',
    data: {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: { id: data.user.id, email: data.user.email },
      },
      user: await mapUser(data.user),
    },
  };
};

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const { data: result, error } = await getSupabase().auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role || 'student',
      },
    },
  });

  if (error || !result.user) {
    throw new Error(error?.message || 'Registration failed');
  }

  const user = await mapUser(result.user);
  return {
    success: true,
    message: result.session ? 'Registration successful' : 'Registration successful. Check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: Boolean(result.user.email_confirmed_at),
        role: user.role,
      },
    },
  };
};

export const logout = async (_token?: string) => {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(error.message);
  return { success: true, message: 'Signed out successfully' };
};

export const refreshToken = async (_refreshToken?: string): Promise<TokenResponse> => {
  const { data, error } = await getSupabase().auth.refreshSession();
  if (error || !data.session) throw new Error(error?.message || 'Unable to refresh session');
  return {
    success: true,
    data: {
      tokens: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    },
  };
};

export const forgotPassword = async (data: { email: string }): Promise<AuthMessageResponse> => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectTo = `${origin}/reset-password`;
  const { error } = await getSupabase().auth.resetPasswordForEmail(data.email.trim().toLowerCase(), { redirectTo });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Password reset email sent' };
};

export const resetPassword = async (data: { token?: string; password: string }): Promise<AuthMessageResponse> => {
  const { data: sessionData } = await getSupabase().auth.getSession();
  if (!sessionData.session) {
    throw new Error('Your password reset session is missing or has expired. Please request a new reset link.');
  }
  const { error } = await getSupabase().auth.updateUser({ password: data.password });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Password updated successfully' };
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }, _token?: string) => {
  const { data: sessionData } = await getSupabase().auth.getSession();
  if (!sessionData.session) throw new Error('You must be signed in to change your password');
  const { error } = await getSupabase().auth.updateUser({ password: data.newPassword });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Password updated successfully' };
};

export const verifyEmail = async (_userId?: string, token?: string) => {
  if (!token) throw new Error('Verification token is missing');
  const { data, error } = await getSupabase().auth.verifyOtp({ type: 'email', token_hash: token });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Email verified', user: data.user };
};

export const resendVerification = async (_token?: string) => {
  const { data } = await getSupabase().auth.getUser();
  if (!data.user?.email) throw new Error('No signed-in email is available');
  const { error } = await getSupabase().auth.resend({ type: 'signup', email: data.user.email });
  if (error) throw new Error(error.message);
  return { success: true, message: 'Verification email sent' };
};

export const getCurrentUser = async (_token?: string) => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error(error?.message || 'Not authenticated');
  return { user: await mapUser(data.user) };
};
