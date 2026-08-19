'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAssignmentById, submitAssignment } from '@/services/api/assignmentService';
import { ArrowLeftIcon, ClockIcon, CalendarIcon, AlertCircleIcon, CheckCircleIcon, Link2Icon } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const assignmentId = params?.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [content, setContent] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [newFileUrl, setNewFileUrl] = useState('');

  useEffect(() => {
    if (!token || !assignmentId) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchAssignmentById(assignmentId, token),
    ])
      .then(([asgnRes]) => {
        setAssignment(asgnRes.assignment);
      })
      .catch(err => setError(err.message || 'Failed to load assignment'))
      .finally(() => setLoading(false));
  }, [token, assignmentId]);

  const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date();
  const canSubmit = assignment?.submissions?.status === 'pending' && !isOverdue;
  const hasSubmitted = !!submission?.status;
  const isLate = submission?.is_late;

  const handleSubmit = async () => {
    if (!content.trim() && fileUrls.length === 0) {
      setError('Please provide content or upload files');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await submitAssignment(assignmentId, { content: content.trim(), fileUrls: fileUrls.length > 0 ? fileUrls : undefined }, token!);
      setSubmission(res.submission);
      setSuccess('Assignment submitted successfully!');
      setTimeout(() => router.push('/dashboard/assignments'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const addFileUrl = () => {
    if (newFileUrl.trim()) {
      setFileUrls(prev => [...prev, newFileUrl.trim()]);
      setNewFileUrl('');
    }
  };

  const removeFileUrl = (url: string) => {
    setFileUrls(prev => prev.filter(u => u !== url));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Assignments
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error || 'Assignment not found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Assignments
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-gray-500 mt-1">Course: {assignment.course_id ? assignment.course_id.slice(0, 8) : 'General'}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            isOverdue && assignment.submission_status === 'pending'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isOverdue && assignment.submission_status === 'pending' ? 'Overdue' :
             assignment.submission_status === 'graded' ? 'Graded' :
             assignment.submission_status === 'submitted' ? 'Submitted' : 'Pending'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Due Date', value: new Date(assignment.due_date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }), icon: CalendarIcon },
            { label: 'Max Score', value: `${assignment.max_score ?? 100} marks`, icon: ClockIcon },
            { label: 'Type', value: (assignment.assignment_type || 'essay').replace(/_/g, ' '), icon: ClockIcon },
            { label: 'Late Penalty', value: `${assignment.late_penalty_percent ?? 0}%`, icon: AlertCircleIcon },
          ].map(s => (
            <div key={s.label} className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{s.value}</p>
            </div>
          ))}
        </div>

        {assignment.instructions && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>
        )}

        {assignment.description && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{assignment.description}</p>
          </div>
        )}
      </div>

      {/* Submission section */}
      {assignment.submission_status === 'graded' && submission?.score !== undefined && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-green-900">Your Submission — Graded</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-green-700">Score</p>
              <p className="text-3xl font-bold text-green-900">{submission.score}/{assignment.max_score ?? 100}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Submitted</p>
              <p className="text-lg font-semibold text-green-900">{new Date(submission.submitted_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Status</p>
              <p className="text-lg font-semibold text-green-900">{submission.is_late ? 'Late' : 'On Time'}</p>
            </div>
          </div>
          {submission.feedback && (
            <div className="mt-4 p-4 bg-white rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-1">Teacher's Feedback:</p>
              <p className="text-sm text-gray-600">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      {assignment.submission_status === 'submitted' && !submission?.score && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <CheckCircleIcon className="w-6 h-6 text-blue-600 mb-2" />
          <h2 className="font-bold text-blue-900">Submitted Awaiting Grading</h2>
          <p className="text-sm text-blue-700 mt-1">You submitted on {new Date(submission.submitted_at).toLocaleString()}</p>
          {submission.is_late && <p className="text-sm text-orange-600 mt-1">This was a late submission.</p>}
          {submission.feedback && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-sm font-medium text-gray-700">Feedback: {submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      {(assignment.submission_status === 'pending' || !assignment.submission_status) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Submit Your Work</h2>
          {isOverdue && !assignment.allow_late_submission && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
              This assignment has closed for submissions.
            </div>
          )}
          {isOverdue && assignment.allow_late_submission && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm mb-4">
              Late submissions are allowed with a {assignment.late_penalty_percent ?? 0}% penalty.
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                placeholder="Write your answer here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Files (optional)</label>
              <div className="flex gap-2">
                <input
                  value={newFileUrl}
                  onChange={e => setNewFileUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFileUrl(); } }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Paste file URL..."
                />
                  <button onClick={addFileUrl} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Link2Icon className="w-4 h-4 text-gray-600" />
                  </button>
              </div>
              {fileUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {fileUrls.map((url, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">{url}</span>
                      <button onClick={() => removeFileUrl(url)} className="text-red-500 hover:text-red-700 text-xs shrink-0">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting || isOverdue && !assignment.allow_late_submission}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
