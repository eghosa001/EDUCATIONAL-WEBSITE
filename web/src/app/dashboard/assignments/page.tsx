'use client';

import { useEffect, useState } from 'react';
import { FileText, Clock } from 'lucide-react';
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
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
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
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load assignments'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (assignmentId: string) => {
    if (!token || submittingId) return;
    const content = (drafts[assignmentId] || '').trim();
    if (!content) { setError('Enter your assignment response before submitting.'); return; }
    setSubmittingId(assignmentId);
    setError('');
    try {
      const result = await submitAssignment(assignmentId, { content }, token);
      setSubmissions(prev => {
        const next = new Map(prev);
        next.set(assignmentId, result.submission as Submission);
        return next;
      });
      setOpenAssignmentId(null);
      setDrafts(prev => ({ ...prev, [assignmentId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit assignment');
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = assignments.filter(a => {
    if (filter === 'upcoming') {
      const due = new Date(a.dueDate);
      return a.isActive && due >= new Date() && !submissions.has(a.id);
    }
    if (filter === 'submitted') return submissions.has(a.id);
    return true;
  });

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"/><p className="text-gray-500">Loading assignments...</p></div></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Assignments</h1><p className="mt-1 text-gray-500">View and submit your coursework</p></div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2">
        {(['all', 'upcoming', 'submitted'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter===f?'bg-blue-600 text-white':'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
            {f==='upcoming' && ` (${assignments.filter(a => a.isActive && new Date(a.dueDate) >= new Date() && !submissions.has(a.id)).length})`}
            {f==='submitted' && ` (${submissions.size})`}
          </button>
        ))}
      </div>

      {filtered.length===0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><FileText className="mx-auto mb-4 h-12 w-12 text-gray-300"/><h3 className="mb-1 text-lg font-medium text-gray-900">No assignments</h3><p className="text-sm text-gray-500">{filter==='upcoming'?'No upcoming assignments. Great job staying on top!':'No assignments found.'}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(assignment => {
            const submission = submissions.get(assignment.id);
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = dueDate < new Date() && !submission;
            const isCompleted = !!submission;
            return (
              <div key={assignment.id} className={`rounded-xl border p-5 ${isOverdue?'border-red-200 bg-red-50/50':isCompleted?'border-green-200 bg-green-50/30':'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2"><span className="text-xs text-gray-400">{assignment.courseTitle||'Course'}</span>{isOverdue&&<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Overdue</span>}{submission?.isLate&&<span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">Late</span>}{isCompleted&&<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">Submitted</span>}</div>
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.description&&<p className="mt-1 line-clamp-2 text-sm text-gray-500">{assignment.description}</p>}
                    {assignment.instructions&&<p className="mt-2 text-sm text-gray-600">{assignment.instructions}</p>}
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400"><span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Due: {dueDate.toLocaleDateString()}</span><span>{assignment.maxScore} marks</span></div>
                  </div>
                  {isCompleted ? <div className="text-right"><p className="text-lg font-bold text-green-600">{submission.score ?? '—'}/{assignment.maxScore}</p><p className="text-xs text-gray-400">Score</p></div> : <button onClick={() => { setError(''); setOpenAssignmentId(openAssignmentId===assignment.id?null:assignment.id); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">{openAssignmentId===assignment.id?'Close':'Submit'}</button>}
                </div>
                {!isCompleted && openAssignmentId===assignment.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <label htmlFor={`assignment-${assignment.id}`} className="mb-2 block text-sm font-medium text-gray-700">Your response</label>
                    <textarea id={`assignment-${assignment.id}`} rows={6} value={drafts[assignment.id]||''} onChange={e=>setDrafts(prev=>({...prev,[assignment.id]:e.target.value}))} className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type your assignment response here…"/>
                    <div className="mt-3 flex justify-end"><button onClick={() => void handleSubmit(assignment.id)} disabled={submittingId===assignment.id || !(drafts[assignment.id]||'').trim()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submittingId===assignment.id?'Submitting…':'Submit assignment'}</button></div>
                  </div>
                )}
                {submission?.feedback&&<div className="mt-3 rounded-lg bg-gray-50 p-3"><p className="mb-1 text-xs font-medium text-gray-500">Teacher Feedback:</p><p className="text-sm text-gray-700">{submission.feedback}</p></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
