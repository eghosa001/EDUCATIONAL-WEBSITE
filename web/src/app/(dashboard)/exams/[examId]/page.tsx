'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchExamById, startExamAttempt, submitExamAttempt,
} from '@/services/api/examService';
import { ArrowLeftIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, FlagIcon } from 'lucide-react';
import Link from 'next/link';

type Answer = Record<string, unknown>;

interface ExamQuestion {
  id: string;
  orderIndex: number;
  questionId: string;
  questionText: string;
  questionType: string;
  options: unknown[];
  marks: number;
  sectionName?: string;
  difficulty?: string;
  timeLimitSeconds?: number;
}

interface ExamStartData {
  attempt: { id: string };
  exam: { title: string; durationMinutes: number; totalQuestions: number };
  questions: ExamQuestion[];
}

export default function ExamAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const examId = params?.examId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'instructions' | 'exam' | 'submitted'>('instructions');
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<{ id: string } | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pageVisibilityRef = useRef<DocumentVisibilityState>('visible');
  const hasStartedRef = useRef(false);

  const durationSec = exam?.durationMinutes ? exam.durationMinutes * 60 : 0;

  const handleTabSwitch = useCallback(() => {
    if (pageVisibilityRef.current === 'visible' && phase === 'exam') {
      setTabSwitchCount(prev => prev + 1);
    }
  }, [phase]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleTabSwitch);
    window.addEventListener('blur', handleTabSwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
      window.removeEventListener('blur', handleTabSwitch);
    };
  }, [handleTabSwitch]);

  useEffect(() => {
    if (!token || !examId) return;
    setLoading(true);
    setError('');

    Promise.all([
      fetchExamById(examId, token),
    ])
      .then(([examRes]) => {
        const examData = examRes.exam;
        setExam(examData);
        setTimeLeft(examData.durationMinutes * 60);
      })
      .catch(err => setError(err.message || 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [token, examId]);

  const startExam = async () => {
    if (!token) return;
    try {
      const res = await startExamAttempt(examId, token);
      setAttempt(res.data.attempt);
      setQuestions(res.data.questions);
      setStartTime(Date.now());
      hasStartedRef.current = true;
      setPhase('exam');
    } catch (err: any) {
      setError(err.message || 'Failed to start exam');
    }
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'exam' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft]);

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, questionId, value }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      return next;
    });
  };

  const unansweredCount = questions.filter(q => answers[q.id] === undefined || answers[q.id] === '').length;

  const handleSubmit = async (isTimeout = false) => {
    if (!attempt || !startTime || isTimeout && phase !== 'exam') return;
    if (!isTimeout && !confirm(`Submit your exam? You have ${unansweredCount} unanswered question(s).`)) return;

    setSubmitting(true);
    setSubmitError('');
    setShowConfirmSubmit(false);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const answerList = Object.entries(answers).map(([questionId, studentAnswer]) => ({
      questionId, studentAnswer,
    }));

    try {
      const res = await submitExamAttempt(examId, attempt.id, {
        examId, answers: answerList, timeSpentSeconds: timeSpent,
      }, token!);
      setPhase('submitted');
      window.localStorage.setItem(`exam_result_${examId}`, JSON.stringify(res.result));
      router.push(`/dashboard/exams/${examId}/results`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const q = questions[currentQIdx];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && phase !== 'submitted') {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 shrink-0" />{error}
        </div>
      </div>
    );
  }

  // ── Instructions Phase ──────────────────────────────────────────────────────
  if (phase === 'instructions') {
    return (
      <div className="space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
          </div>
          <p className="text-gray-500 mt-1">{exam?.description || ''}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Questions', value: questions.length || exam?.questionCount || 40 },
              { label: 'Duration', value: `${exam?.durationMinutes || 60} min` },
              { label: 'Total Marks', value: exam?.stats?.totalMarks || 100 },
              { label: 'Passing Score', value: `${exam?.passing_marks || 50}%` },
            ].map(s => (
              <div key={s.label} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <FlagIcon className="w-4 h-4" /> Anti-Cheat Rules
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Do not switch tabs or minimize this window during the exam</li>
              <li>• Each tab switch will be recorded and may affect your score</li>
              <li>• Your exam will auto-submit when time runs out</li>
              <li>• Tab switch violations detected: <span className="font-bold">{tabSwitchCount}</span></li>
            </ul>
          </div>

          {exam?.instructions && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{exam.instructions}</p>
            </div>
          )}

          <button
            onClick={startExam}
            disabled={tabSwitchCount > 5}
            className="mt-8 w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {tabSwitchCount > 5 ? 'Exam Suspended — Too Many Tab Switches' : 'Start Exam'}
          </button>
        </div>
      </div>
    );
  }

  // ── Submitted Phase ──────────────────────────────────────────────────────────
  if (phase === 'submitted') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Exam Submitted</h2>
          <p className="text-gray-500 mt-1">Your results are being processed...</p>
          {submitError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{submitError}</div>
          )}
        </div>
      </div>
    );
  }

  // ── Exam Interface ───────────────────────────────────────────────────────────
  const progressPercent = Math.round(((currentQIdx + 1) / questions.length) * 100);
  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 inline mr-1" />Exit
          </Link>
          <span className="font-semibold text-gray-900 text-sm truncate max-w-xs">{exam?.title}</span>
        </div>
        <div className="flex items-center gap-6">
          {tabSwitchCount > 0 && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircleIcon className="w-3.5 h-3.5" />{tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
            </span>
          )}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm font-bold ${
            timeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse' : timeLeft < 300 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <ClockIcon className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Question sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden lg:block">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span><span>{answeredCount}/{questions.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isFlagged = flagged.has(q.id);
              const isCurrent = i === currentQIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIdx(i)}
                  className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                    isCurrent ? 'ring-2 ring-blue-600 bg-blue-50 text-blue-700' :
                    isAnswered ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                  {isFlagged && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Question area */}
        <main className="flex-1 p-6">
          {q && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Question header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQIdx + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      flagged.has(q.id) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <FlagIcon className="w-3 h-3 inline mr-1" />{flagged.has(q.id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>
              </div>

              {/* Question text */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <p className="text-lg font-medium text-gray-900 leading-relaxed">{q.questionText}</p>

                {/* MCQ options */}
                {q.questionType === 'mcq' && (
                  <div className="mt-5 space-y-3">
                    {(q.options as any[] || []).map((opt, idx) => {
                      const optLetter = String.fromCharCode(65 + idx);
                      const isSelected = answers[q.id] === opt.text || answers[q.id] === optLetter;
                      return (
                        <button
                          key={idx}
                          onClick={() => setAnswer(q.id, opt.text || optLetter)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold mr-3">{optLetter}.</span>
                          {opt.text || opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Multiple select */}
                {q.questionType === 'multiple_select' && (
                  <div className="mt-5 space-y-3">
                    {(q.options as any[] || []).map((opt, idx) => {
                      const optLetter = String.fromCharCode(65 + idx);
                      const selected = Array.isArray(answers[q.id])
                        ? (answers[q.id] as string[]).includes(optLetter)
                        : false;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const current = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : [];
                            const next = selected ? current.filter(c => c !== optLetter) : [...current, optLetter];
                            setAnswer(q.id, next);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                            selected
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="font-semibold mr-3">{optLetter}.</span>
                          {opt.text || opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True/False */}
                {q.questionType === 'true_false' && (
                  <div className="mt-5 flex gap-3">
                    {['True', 'False'].map(val => {
                      const isSelected = answers[q.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => setAnswer(q.id, val)}
                          className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                            isSelected
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short answer / essay */}
                {['short_answer', 'essay', 'fill_blank', 'numerical'].includes(q.questionType) && (
                  <div className="mt-5">
                    {q.questionType === 'essay' ? (
                      <textarea
                        value={(answers[q.id] as string) || ''}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        placeholder="Write your answer here..."
                      />
                    ) : (
                      <input
                        type={q.questionType === 'numerical' ? 'number' : 'text'}
                        value={(answers[q.id] as string) || ''}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Type your answer..."
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentQIdx === 0}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">{answeredCount} answered · {unansweredCount} remaining</span>
                {currentQIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIdx(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Confirm submit modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmSubmit(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Exam?</h3>
            <p className="text-sm text-gray-500 mb-4">
              You have <span className="font-semibold text-orange-600">{unansweredCount} unanswered</span> question{unansweredCount !== 1 ? 's' : ''}.
              {tabSwitchCount > 0 && ` You switched tabs ${tabSwitchCount} time${tabSwitchCount > 1 ? 's' : ''} during the exam.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                Review Again
              </button>
              <button onClick={() => handleSubmit()} disabled={submitting} className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
