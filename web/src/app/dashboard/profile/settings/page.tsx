'use client';

import { useEffect, useRef, useState } from 'react';
import { BellIcon, Camera, ShieldIcon, UserIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { useProfileStore } from '@/features/profile/store/profileStore';
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreference,
} from '@/services/api/notificationPreferenceService';

interface NotifPref {
  email: boolean;
  push: boolean;
  studyReminders: boolean;
  resultAlerts: boolean;
  promotional: boolean;
}

const DEFAULT_PREFS: NotifPref = {
  email: true,
  push: true,
  studyReminders: true,
  resultAlerts: true,
  promotional: false,
};

export default function ProfileSettingsPage() {
  const { user } = useAuthStore();
  const {
    profile,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    isLoading,
    error,
  } = useProfileStore();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState<NotifPref>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchProfile().catch(() => undefined);
    void fetchNotificationPreferences()
      .then((rows) => {
        if (cancelled) return;
        const next = { ...DEFAULT_PREFS };
        rows.forEach((row) => {
          if (row.channel === 'email' && row.notificationType === 'all') next.email = row.isEnabled;
          else if (row.channel === 'push' && row.notificationType === 'all') next.push = row.isEnabled;
          else if (row.channel === 'in_app' && row.notificationType === 'study_reminder') next.studyReminders = row.isEnabled;
          else if (row.channel === 'in_app' && row.notificationType === 'exam_result') next.resultAlerts = row.isEnabled;
          else if (row.channel === 'email' && row.notificationType === 'promotion') next.promotional = row.isEnabled;
        });
        setNotifPrefs(next);
      })
      .catch((err) => {
        if (!cancelled) setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unable to load notification preferences' });
      })
      .finally(() => {
        if (!cancelled) setPrefsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, fetchProfile]);

  useEffect(() => {
    const source = profile || user;
    if (!source) return;
    setProfileForm({
      firstName: source.firstName || '',
      lastName: source.lastName || '',
      phone: profile?.phone || '',
    });
  }, [profile, user]);

  const handleProfileSave = async () => {
    setMessage(null);
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required' });
      return;
    }
    try {
      await updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
      });
      setMessage({ type: 'success', text: 'Profile saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile' });
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    setMessage(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file);
      if (!url) throw new Error(useProfileStore.getState().error || 'Unable to upload profile image');
      setMessage({ type: 'success', text: 'Profile photo updated' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unable to upload profile image' });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async () => {
    setMessage(null);
    if (!passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'Enter your current password' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setMessage({ type: 'error', text: 'New password must differ from current password' });
      return;
    }
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to change password' });
    }
  };

  const handleNotifSave = async () => {
    setMessage(null);
    setPrefsSaving(true);
    const preferences: NotificationPreference[] = [
      { channel: 'email', notificationType: 'all', isEnabled: notifPrefs.email },
      { channel: 'push', notificationType: 'all', isEnabled: notifPrefs.push },
      { channel: 'in_app', notificationType: 'study_reminder', isEnabled: notifPrefs.studyReminders },
      { channel: 'in_app', notificationType: 'exam_result', isEnabled: notifPrefs.resultAlerts },
      { channel: 'email', notificationType: 'promotion', isEnabled: notifPrefs.promotional },
    ];
    try {
      await saveNotificationPreferences(preferences);
      setMessage({ type: 'success', text: 'Notification preferences saved' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save notification preferences' });
    } finally {
      setPrefsSaving(false);
    }
  };

  const displayProfile = profile || user;
  const initials = `${profileForm.firstName?.[0] || ''}${profileForm.lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your personal details, notifications, and account security.</p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      {error && !message && activeTab === 'profile' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
        {[
          { id: 'profile' as const, label: 'Profile', icon: UserIcon },
          { id: 'notifications' as const, label: 'Notifications', icon: BellIcon },
          { id: 'security' as const, label: 'Security', icon: ShieldIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setMessage(null); }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {activeTab === 'profile' && <>
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0">
              {displayProfile?.avatar ? (
                <img src={displayProfile.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">{initials}</div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void handleAvatarUpload(event.target.files?.[0])}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">{profileForm.firstName} {profileForm.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="mt-1 text-xs text-gray-400">{avatarUploading ? 'Uploading photo…' : 'Photo: JPG, PNG, WebP or GIF up to 5 MB'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
              <input value={profileForm.firstName} onChange={(event) => setProfileForm((previous) => ({ ...previous, firstName: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
              <input value={profileForm.lastName} onChange={(event) => setProfileForm((previous) => ({ ...previous, lastName: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input type="tel" value={profileForm.phone} onChange={(event) => setProfileForm((previous) => ({ ...previous, phone: event.target.value }))} placeholder="+234..." className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input value={user?.email || ''} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleProfileSave} disabled={isLoading || avatarUploading} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </>}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {prefsLoading ? (
              <p className="py-8 text-center text-sm text-gray-500">Loading notification preferences…</p>
            ) : <>
              {([
                { key: 'email' as const, label: 'Email notifications', description: 'Important account and learning updates by email' },
                { key: 'push' as const, label: 'Push notifications', description: 'Notifications on supported signed-in devices' },
                { key: 'studyReminders' as const, label: 'Study reminders', description: 'Reminders to continue your learning plan' },
                { key: 'resultAlerts' as const, label: 'Result alerts', description: 'Exam and assessment result notifications' },
                { key: 'promotional' as const, label: 'Promotional emails', description: 'Optional product and offer messages' },
              ]).map(({ key, label, description }) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{label}</span>
                    <span className="block text-xs text-gray-500">{description}</span>
                  </span>
                  <input type="checkbox" checked={notifPrefs[key]} onChange={(event) => setNotifPrefs((previous) => ({ ...previous, [key]: event.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-blue-600" />
                </label>
              ))}
              <div className="mt-4 flex justify-end">
                <button onClick={handleNotifSave} disabled={prefsSaving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {prefsSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </>}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
              Your current password is verified by Supabase before a new password is accepted.
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
              <input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, currentPassword: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
              <input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handlePasswordChange} disabled={isLoading} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
