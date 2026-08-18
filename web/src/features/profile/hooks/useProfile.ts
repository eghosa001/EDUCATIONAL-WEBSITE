'use client';

import { useEffect, useState } from 'react';
import { useProfileStore } from '@/features/profile/store/profileStore';

export function useProfile() {
  const { profile, isEditing, isLoading, error, fetchProfile, updateProfile, changePassword, uploadAvatar, setIsEditing } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isEditing,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    setIsEditing,
  };
}

export function usePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const { changePassword } = useProfileStore();

  const validatePasswords = (): boolean => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');

    if (!validatePasswords()) return;

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    isLoading,
    handlePasswordChange,
  };
}
