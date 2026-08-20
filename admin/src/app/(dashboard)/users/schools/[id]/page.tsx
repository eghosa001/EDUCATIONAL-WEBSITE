'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAdminAuthStore } from '@/state/auth';
import { fetchSchool, fetchSchoolStats, fetchSchoolClasses, fetchAttendance, fetchFees, fetchResults, type SchoolRow, type AttendanceRecord, type FeeRecord, type SchoolResult } from '@/services/api/schoolService';

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params?.id as string;
  const { token } = useAdminAuthStore();
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'attendance' | 'fees' | 'results'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    try {
      const [schoolRes, statsRes, classesRes, attendanceRes, feesRes, resultsRes] = await Promise.all([
        fetchSchool(token, schoolId),
        fetchSchoolStats(token, schoolId),
        fetchSchoolClasses(token, schoolId),
        fetchAttendance(token, schoolId),
        fetchFees(token, schoolId),
        fetchResults(token, schoolId),
      ]);
      setSchool(schoolRes.data);
      setStats(statsRes.data);
      setClasses(classesRes.data?.data || []);
      setAttendance(attendanceRes.data?.data || []);
      setFees(feesRes.data?.data || []);
      setResults(resultsRes.data?.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load school details');
    } finally {
      setLoading(false);
    }
  }, [token, schoolId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'classes', label: 'Classes' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fees' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href="/admin/schools" className="text-sm text-blue-600 hover:text-blue-700">← Back to Schools</a>
      </div>

      {/* School Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
              {school?.name?.[0] || 'S'}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{school?.name}</h2>
            <p className="text-gray-500 text-sm">{school?.code}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${school?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {school?.status}
              </span>
              {school?.type && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {school.type}
                </span>
              )}
            </div>
          </div>
          {stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{Number(stats?.students || school?.student_count || 0)}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Number(stats?.teachers || school?.teacher_count || 0)}</p>
                <p className="text-xs text-gray-500">Teachers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{Number(stats?.classes || classes.length)}</p>
                <p className="text-xs text-gray-500">Classes</p>
              </div>
            </div>
          )}
        </div>

            {(school?.address || school?.email || school?.phone) && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {school?.email && <p><span className="text-gray-500">Email: </span>{String(school.email)}</p>}
                {school?.phone && <p><span className="text-gray-500">Phone: </span>{String(school.phone)}</p>}
                {school?.address && <p><span className="text-gray-500">Address: </span>{String(school.address)}</p>}
              </div>
            )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: stats?.students || school?.student_count || 0 },
                { label: 'Total Teachers', value: stats?.teachers || school?.teacher_count || 0 },
                { label: 'Total Classes', value: classes.length },
                { label: 'Status', value: school?.status },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
            {school?.description && (
              <p className="text-sm text-gray-600">{school.description}</p>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No classes yet</p>
            ) : classes.map((cls: any) => (
              <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{cls.class_name || cls.class_code}</p>
                  <p className="text-sm text-gray-500">{cls.teacher_name || 'No teacher assigned'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {cls.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-3">
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records yet</p>
            ) : attendance.slice(0, 10).map((record: AttendanceRecord) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{record.first_name} {record.last_name}</p>
                  <p className="text-sm text-gray-500">{record.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  record.status === 'present' ? 'bg-green-100 text-green-700' :
                  record.status === 'absent' ? 'bg-red-100 text-red-700' :
                  record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-3">
            {fees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No fee records yet</p>
            ) : fees.slice(0, 10).map((fee: FeeRecord) => (
              <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{fee.first_name} {fee.last_name}</p>
                  <p className="text-sm text-gray-500">{fee.fee_type} — ₦{Number(fee.final_amount || fee.amount || 0).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  fee.status === 'paid' ? 'bg-green-100 text-green-700' :
                  fee.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  fee.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {fee.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-3">
            {results.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No results yet</p>
            ) : results.slice(0, 10).map((result: SchoolResult) => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{result.first_name} {result.last_name}</p>
                  <p className="text-sm text-gray-500">{result.subject_name || result.subject_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{result.total_score}%</p>
                  <p className="text-sm text-gray-500">{result.grade || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
