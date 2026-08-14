'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchMyAssignments, fetchMySubmissions,
} from '@/services/api/assignmentService';
import { CalendarIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, FileTextIcon } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchMyAssignments(token),
      fetchMySubmissions(token),
    ])
      .then(([asgnRes, subRes]) => {
        // Merge assignments with submission status
        const subMap = new Map(
          (subRes.submissions || []).map((s: any) => [s.assignment_id, s])
        );
        const merged = (asgnRes.assignments || []).map((a: any) => {
          const sub = subMap.get(a.id);
          return {
            ...a,
            submissionStatus: sub?.status || 'pending',
            submissionScore: sub?.score,
            isLate: sub?.is_late,
            hasSubmitted: !!sub,
          };
        });
        setAssignments(merged);
      })
      .catch(err => setError(err.message || 'Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = assignments.filter(a => {
    if (filter === 'all') return true;
    return a.submissionStatus === filter;
  });

  const pending = assignments.filter(a => a.submissionStatus === 'pending').length;
  const getCourseTitle = (id?: string) => id ? id.slice(0, 8) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-500 mt-1">{pending} pending assignment{pending !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'pending', 'submitted', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === f ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && ` (${pending})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <FileTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOverdue = a.due_date && new Date(a.due_date) < new Date() && a.submissionStatus === 'pending';
            return (
              <Link key={a.id} href={`/dashboard/assignments/${a.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  a.submissionStatus === 'graded' ? 'bg-green-100' :
                  a.submissionStatus === 'submitted' ? 'bg-blue-100' :
                  isOverdue ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {a.submissionStatus === 'graded' && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                  {a.submissionStatus === 'submitted' && <FileTextIcon className="w-5 h-5 text-blue-600" />}
                  {(a.submissionStatus === 'pending' || isOverdue) && <ClockIcon className="w-5 h-5 text-yellow-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-sm text-gray-500">{getCourseTitle(a.course_id)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm flex items-center gap-1 justify-end ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    <CalendarIcon className="w-3 h-3" />
                    {new Date(a.due_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    {isOverdue && <span className="ml-1">(overdue)</span>}
                  </p>
                  {a.submissionScore !== null && a.submissionScore !== undefined && (
                    <p className="text-sm font-semibold text-green-600 mt-1">{a.submissionScore}/{a.max_score ?? 100}%</p>
                  )}
                  {a.is_late && a.submissionStatus === 'graded' && (
                    <p className="text-xs text-orange-600 mt-0.5">Late submission</p>
                  )}
                </div>
                <div className="shrink-0">
                  {a.submissionStatus === 'pending' && !isOverdue && (
                    <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg">Submit</span>
                  )}
                  {a.submissionStatus === 'submitted' && (
                    <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg">View</span>
                  )}
                  {a.submissionStatus === 'graded' && (
                    <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg">Graded</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
