'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAdminAuthStore } from '@/state/auth';
import { fetchUser, type AdminUserRow } from '@/services/api/userService';
import { fetchUserProfile, type UserProfile } from '@/services/api/teacherService';

export default function TeacherDetailPage() {
  const params = useParams();
  const userId = params?.id as string;
  const { token } = useAdminAuthStore();
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const [userRes, profileRes] = await Promise.all([
        fetchUser(token, userId),
        fetchUserProfile(token, userId),
      ]);
      setUser(userRes.data.user);
      setProfile(profileRes.data.profile);
      setVerified(userRes.data.user?.roles?.includes('teacher') ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher');
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (isVerified: boolean) => {
    if (!token || !userId) return;
    setVerifying(true);
    try {
      const { verifyTeacher } = await import('@/services/api/teacherService');
      await verifyTeacher(token, userId, isVerified);
      setVerified(isVerified);
    } catch {
      setError('Failed to update verification status');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading teacher details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/users/teachers" className="text-sm text-blue-600 hover:text-blue-700">← Back to Teachers</a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user?.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>

        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Taught Courses</p>
              <p className="text-lg font-semibold text-gray-900">{profile.taught_courses ?? profile.taughtCourses ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrolled Courses</p>
              <p className="text-lg font-semibold text-gray-900">{profile.enrolled_courses ?? profile.enrolledCourses ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">{new Date(profile.created_at ?? profile.createdAt ?? '').toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-lg font-semibold text-gray-900">{profile.is_verified ?? profile.isVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={() => handleVerify(true)}
            disabled={verifying || verified}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {verified ? '✓ Verified' : verifying ? 'Verifying...' : 'Verify Teacher'}
          </button>
          <button
            onClick={() => handleVerify(false)}
            disabled={verifying || !verified}
            className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            Revoke Verification
          </button>
        </div>
      </div>
    </div>
  );
}
