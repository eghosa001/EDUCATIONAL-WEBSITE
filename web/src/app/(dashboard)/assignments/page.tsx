'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchAssignments, submitAssignment, fetchMySubmissions } from '@/services/api/assignmentService';

interface Assignment {
  id: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description?: string;
  instructions?: string;
  maxScore: number;
  dueDate: string;
  isActive: boolean;
  submittedCount?: number;
  totalStudents?: number;
  slug?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  status: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  isLate: boolean;
}

export default function AssignmentsPage() {
  const { token } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'submitted'>('all');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchAssignments({ page: 1, limit: 50 }, token),
      fetchMySubmissions(token),
    ])
      .then(([assignRes, subRes]) => {
        setAssignments((assignRes.data || []) as Assignment[]);
        const subMap = new Map<string, Submission>();
        (subRes.submissions || []).forEach((s: Submission) => subMap.set(s.assignmentId, s));
        setSubmissions(subMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = assignments.filter(a => {
    if (filter === 'upcoming') {
      const now = new Date();
      const due = new Date(a.dueDate);
      return a.isActive && due >= now && !submissions.has(a.id);
    }
    if (filter === 'submitted') return submissions.has(a.id);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">View and submit your coursework</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'upcoming', 'submitted'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'upcoming' && ` (${assignments.filter(a => { const d = new Date(a.dueDate); return a.isActive && d >= new Date() && !submissions.has(a.id); }).length})`}
            {f === 'submitted' && ` (${submissions.size})`}
          </button>
        ))}
      </div>

      {/* Assignments */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No assignments</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'upcoming' ? 'No upcoming assignments. Great job staying on top!' : 'No assignments found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(assignment => {
            const submission = submissions.get(assignment.id);
            const isLate = submission?.isLate;
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date() && !submission;
            const isCompleted = !!submission;

            return (
              <div
                key={assignment.id}
                className={`bg-white rounded-xl border p-5 transition-colors ${
                  isOverdue ? 'border-red-200 bg-red-50/50' :
                  isCompleted ? 'border-green-200 bg-green-50/30' :
                  'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{assignment.courseTitle || 'Course'}</span>
                      {isOverdue && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>}
                      {isLate && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Late</span>}
                      {isCompleted && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Submitted</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{assignment.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {dueDate.toLocaleDateString()}</span>
                      <span>{assignment.maxScore} marks</span>
                      {assignment.submittedCount !== undefined && (
                        <span>{assignment.submittedCount}/{assignment.totalStudents || 0} submitted</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {isCompleted ? (
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{submission.score}/{assignment.maxScore}</p>
                        <p className="text-xs text-gray-400">Scored</p>
                      </div>
                    ) : (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Submit
                      </button>
                    )}
                  </div>
                </div>
                {submission?.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">Teacher Feedback:</p>
                    <p className="text-sm text-gray-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
