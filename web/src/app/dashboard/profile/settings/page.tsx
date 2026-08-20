'use client';

import { useState, useEffect } from 'react';
import { SettingsIcon, UserIcon, BellIcon, ShieldIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { useProfileStore } from '@/features/profile/store/profileStore';

interface NotifPref {
  email: boolean;
  push: boolean;
  studyReminders: boolean;
  resultAlerts: boolean;
  promotional: boolean;
}

export default function ProfileSettingsPage() {
  const { user } = useAuthStore();
  const { profile, updateProfile, changePassword, isLoading, error } = useProfileStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState<NotifPref>({
    email: true, push: true, studyReminders: true, resultAlerts: true, promotional: false,
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '' });
    }
    const token = localStorage.getItem('edu_token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          const rows: Array<{ channel: string; notification_type: string; is_enabled: boolean }> = data?.data?.preferences || [];
          const prefs: NotifPref = { email: true, push: true, studyReminders: true, resultAlerts: true, promotional: false };
          rows.forEach((row: { channel: string; notification_type: string; is_enabled: boolean }) => {
            if (row.channel === 'email') prefs.email = row.is_enabled;
            else if (row.channel === 'push') prefs.push = row.is_enabled;
            else if (row.notification_type === 'study_reminder') prefs.studyReminders = row.is_enabled;
            else if (row.notification_type === 'exam_result') prefs.resultAlerts = row.is_enabled;
            else if (row.notification_type === 'promotion') prefs.promotional = row.is_enabled;
          });
          setNotifPrefs(prefs);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleProfileSave = async () => {
    setSaved(null);
    try {
      await updateProfile({ firstName: profileForm.firstName, lastName: profileForm.lastName });
      setSaved('Profile saved successfully');
    } catch (err) {
      setSaved(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handlePasswordChange = async () => {
    setPwdError('');
    setPwdSuccess('');
    if (passwordForm.newPassword.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPwdError('Passwords do not match'); return; }
    if (passwordForm.newPassword === passwordForm.currentPassword) { setPwdError('New password must differ from current'); return; }
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPwdSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleNotifSave = async () => {
    setNotifSaved(false);
    const token = localStorage.getItem('edu_token');
    if (!token) return;
    const channels: Array<{ channel: string; notificationType: string; isEnabled: boolean }> = [
      { channel: 'email', notificationType: 'all', isEnabled: notifPrefs.email },
      { channel: 'push', notificationType: 'all', isEnabled: notifPrefs.push },
      { channel: 'in_app', notificationType: 'study_reminder', isEnabled: notifPrefs.studyReminders },
      { channel: 'in_app', notificationType: 'exam_result', isEnabled: notifPrefs.resultAlerts },
      { channel: 'email', notificationType: 'promotion', isEnabled: notifPrefs.promotional },
    ];
    try {
      await Promise.all(channels.map(c =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/notifications/preferences`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(c),
        }).then(r => r.json())
      ));
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch {
      setSaved('Failed to save notification preferences');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {saved && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{saved}</div>
      )}
      {error && activeTab === 'profile' && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white rounded-xl p-1">
        {[
          { id: 'profile', label: 'Profile', icon: UserIcon },
          { id: 'notifications', label: 'Notifications', icon: BellIcon },
          { id: 'security', label: 'Security', icon: ShieldIcon },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'profile' && (
          <>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
                {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">{profileForm.firstName} {profileForm.lastName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={user?.email || ''} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleProfileSave} disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {([
              { key: 'email' as const, label: 'Email notifications' },
              { key: 'push' as const, label: 'Push notifications' },
              { key: 'studyReminders' as const, label: 'Study reminders' },
              { key: 'resultAlerts' as const, label: 'Result alerts' },
              { key: 'promotional' as const, label: 'Promotional emails' },
            ]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{label}</span>
                <input type="checkbox" checked={notifPrefs[key]} onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600" />
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button onClick={handleNotifSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                {notifSaved ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            {pwdError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{pwdError}</div>}
            {pwdSuccess && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{pwdSuccess}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handlePasswordChange} disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
