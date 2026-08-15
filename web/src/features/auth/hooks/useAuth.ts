'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['student', 'teacher', 'parent']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function useLogin() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }, [login, router]);

  return { register, handleSubmit, errors, error, isLoading, onSubmit };
}

export function useRegister() {
  const { register: authRegister, isLoading } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setFormError(null);
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      router.push('/dashboard');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed');
    }
  }, [authRegister, router]);

  return { formRegister, handleSubmit, errors, formError, isLoading, onSubmit };
}

export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/auth/login');
    router.refresh();
  }, [logout, router]);

  return { handleLogout };
}
