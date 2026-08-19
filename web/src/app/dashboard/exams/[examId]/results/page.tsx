'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchExamById, submitExamAttempt, startExamAttempt,
} from '@/services/api/examService';
import { ArrowLeftIcon, TrophyIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const examId = params?.examId as string;
  const attemptId = params?.attemptId as string;

  const [result, setResult] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');

    const loadData = async () => {
      try {
        if (attemptId) {
          // Fetch attempt details with answers
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/exams/${examId}/attempts/${attemptId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setResult({
              score: data.data.attempt.score,
              totalMarks: data.data.attempt.score ? data.data.attempt.percentage : 0,
              percentage: data.data.attempt.percentage,
              isPassed: data.data.attempt.is_passed,
              timeSpent: formatTime(data.data.attempt.time_spent_seconds),
            });
            setAnswers(data.data.answers || []);
          }
        } else {
          // Try to get result from localStorage (immediate submission)
          const stored = window.localStorage.getItem(`exam_result_${examId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            setResult(parsed);
          } else {
            // Fetch exam info for display
            const examRes = await fetchExamById(examId, token);
            setResult({
              examTitle: examRes.exam.title,
              message: 'No results available yet. Take the exam first.',
            });
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, examId, attemptId]);

  const formatTime = (seconds: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/exams" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Exams
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>
      </div>
    );
  }

  if (!result?.percentage && result?.message) {
    return (
      <div className="text-center py-20">
        <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">{result.message}</h2>
        <Link href={`/dashboard/exams/${examId}`} className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          Go to Exam
        </Link>
      </div>
    );
  }

  const correctCount = result.correctCount || 0;
  const incorrectCount = result.incorrectCount || 0;
  const unansweredCount = result.unansweredCount || 0;
  const totalQuestions = correctCount + incorrectCount + unansweredCount;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/exams/${examId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Exam
      </Link>

      {/* Score Card */}
      <div className={`rounded-2xl p-8 text-white ${
        (result.isPassed ?? result.percentage >= 50)
          ? 'bg-gradient-to-br from-green-500 to-emerald-700'
          : 'bg-gradient-to-br from-red-500 to-rose-700'
      }`}>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold">
              {result.percentage ?? 0}%
            </div>
            <p className="mt-3 text-sm opacity-80 font-medium">
              {((result.isPassed ?? result.percentage >= 50)) ? 'Passed' : 'Failed'}
            </p>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{result.examTitle || 'Exam Results'}</h1>
            <p className="opacity-80 mt-1 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Time spent: {result.timeSpent || '—'}
            </p>
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-3xl font-bold">{totalQuestions}</p>
                <p className="text-sm opacity-70">Total Questions</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{correctCount}</p>
                <p className="text-sm opacity-70">Correct</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{incorrectCount}</p>
                <p className="text-sm opacity-70">Wrong</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{unansweredCount}</p>
                <p className="text-sm opacity-70">Skipped</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      {answers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Answer Review</h2>
          <div className="space-y-4">
            {answers.map((ans, idx) => (
              <div key={ans.id || idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    ans.is_correct ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {ans.is_correct
                      ? <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      : <XCircleIcon className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {idx + 1}. {ans.question_text}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className={`px-3 py-1.5 rounded ${
                        ans.is_correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        Your answer: <span className="font-medium">{formatAnswer(ans.student_answer)}</span>
                      </div>
                      {!ans.is_correct && (
                        <div className="px-3 py-1.5 rounded bg-green-50 text-green-700">
                          Correct: <span className="font-medium">{formatAnswer(ans.correct_answer)}</span>
                        </div>
                      )}
                    </div>
                    {ans.explanation && (
                      <p className="mt-2 text-xs text-gray-500 italic">{ans.explanation}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{ans.marks_obtained}/{ans.marks ?? 1} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAnswer(val: any): string {
  if (val === null || val === undefined) return '—';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}
