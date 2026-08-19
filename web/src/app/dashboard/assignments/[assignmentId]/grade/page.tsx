'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAssignmentById, fetchAssignmentSubmissions, gradeSubmission } from '@/services/api/assignmentService';
import { ArrowLeftIcon, CheckCircleIcon, PencilIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';

export default function AssignmentGradePage() {
  const params = useParams();
  const { token, user } = useAuth();
  const assignmentId = params?.assignmentId as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token || !assignmentId) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchAssignmentById(assignmentId, token),
      fetchAssignmentSubmissions(assignmentId, token),
    ])
      .then(([asgnRes, subRes]) => {
        setAssignment(asgnRes.assignment);
        setSubmissions(subRes.submissions || []);
      })
      .catch(err => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, [token, assignmentId]);

  const handleGrade = async (submissionId: string) => {
    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > (assignment?.max_score ?? 100)) {
      setError(`Score must be between 0 and ${assignment?.max_score ?? 100}`);
      return;
    }
    setGradingId(submissionId);
    setError('');
    setSuccessMsg('');
    try {
      await gradeSubmission(assignmentId, submissionId, { score, feedback: gradeFeedback.trim() }, token!);
      setSuccessMsg('Submission graded successfully');
      setGradeScore('');
      setGradeFeedback('');
      // Refresh submissions
       const subRes = await fetchAssignmentSubmissions(assignmentId, token!);
      setSubmissions(subRes.submissions || []);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission');
    } finally {
      setGradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/assignments" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Assignments
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
        <p className="text-gray-500 mt-1">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <span>Max Score: {assignment.max_score ?? 100}</span>
          <span>•</span>
          <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
          <span>•</span>
          <span>Type: {(assignment.assignment_type || 'essay').replace(/_/g, ' ')}</span>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {successMsg && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{successMsg}</div>}

      {submissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub: any) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">
                    {(sub.student_first_name || '?')[0]}{(sub.student_last_name || '')[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sub.student_first_name} {sub.student_last_name}</p>
                    <p className="text-sm text-gray-500">
                      Submitted {new Date(sub.submitted_at).toLocaleString()}
                      {sub.is_late && <span className="text-orange-600 ml-2 font-medium">(late)</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {sub.status === 'graded' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      {sub.score}/{assignment.max_score ?? 100}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">Pending</span>
                  )}
                </div>
              </div>

              {sub.content && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.content}</p>
                </div>
              )}

              {sub.file_urls?.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {sub.file_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline">
                      Attachment {i + 1}
                    </a>
                  ))}
                </div>
              )}

              {sub.status !== 'graded' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <PencilIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Grade this submission</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      max={assignment.max_score ?? 100}
                      value={gradeScore}
                      onChange={e => setGradeScore(e.target.value)}
                      placeholder={`Score (0-${assignment.max_score ?? 100})`}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <input
                      value={gradeFeedback}
                      onChange={e => setGradeFeedback(e.target.value)}
                      placeholder="Feedback (optional)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      onClick={() => handleGrade(sub.id)}
                      disabled={gradingId === sub.id || !gradeScore}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {gradingId === sub.id ? 'Saving...' : 'Grade'}
                    </button>
                  </div>
                </div>
              )}

              {sub.status === 'graded' && sub.feedback && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                  <span className="font-medium">Feedback:</span> {sub.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
