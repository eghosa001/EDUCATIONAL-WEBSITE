'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, GraduationCap, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchSchools } from '@/services/api/schoolService';

export default function SchoolPage() {
  const { token, user } = useAuthStore();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchSchools({}, token)
      .then(res => setSchools(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!schoolCode.trim() || !token) return;
    setJoining(true);
    try {
      await import('@/services/api/schoolService').then(m => m.joinSchool(schoolCode, token));
      setSchoolCode('');
      setShowJoin(false);
      alert('Successfully joined the school!');
    } catch {
      alert('Failed to join school. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-gray-500 mt-1">Browse and join your school on the platform</p>
        </div>
        <button
          onClick={() => setShowJoin(!showJoin)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Building2 className="w-4 h-4" /> Join School
        </button>
      </div>

      {showJoin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Join a School</h3>
          <div className="flex gap-3">
            <input
              value={schoolCode}
              onChange={e => setSchoolCode(e.target.value)}
              placeholder="Enter school code (e.g., LEK-001)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoin}
              disabled={!schoolCode.trim() || joining}
              className="px-6 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Ask your school administrator for the school code.</p>
        </div>
      )}

      {/* My school */}
      {user?.schoolId && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Your School</p>
              <p className="text-xl font-bold">{(user as any).schoolName || 'Connected School'}</p>
              <p className="text-blue-200 text-sm mt-1">{(user as any).className || 'Class not assigned'}</p>
            </div>
          </div>
        </div>
      )}

      {/* School directory */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">School Directory</h2>
        {schools.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No schools registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schools.slice(0, 10).map(school => (
              <div key={school.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {school.name?.[0] || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{school.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{school.code}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {school.studentCount || 0} students</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {school.teacherCount || 0} teachers</span>
                      {school.subscriptionStatus === 'premium' && (
                        <span className="flex items-center gap-1 text-green-600"><CreditCard className="w-3 h-3" /> Premium</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
