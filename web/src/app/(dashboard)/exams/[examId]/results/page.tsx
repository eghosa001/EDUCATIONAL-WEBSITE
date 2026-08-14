'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeftIcon, TrophyIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';

export default function ExamResultsPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading exam results
    setTimeout(() => {
      setResult({
        examId,
        score: 78,
        totalMarks: 100,
        percentage: 78,
        isPassed: true,
        timeSpent: '45m',
        correctAnswers: 39,
        wrongAnswers: 11,
        unanswered: 0,
        date: '2024-01-28',
        questions: [
          { id: 1, text: 'What is the capital of Nigeria?', userAnswer: 'Lagos', correctAnswer: 'Abuja', isCorrect: false },
          { id: 2, text: 'What is 2 + 2?', userAnswer: '4', correctAnswer: '4', isCorrect: true },
        ],
      });
      setLoading(false);
    }, 800);
  }, [examId]);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-100 rounded w-1/2" /><div className="h-32 bg-gray-100 rounded" /></div>;
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/exams/${examId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Exam
      </Link>

      {/* Score Card */}
      <div className={`rounded-2xl p-6 text-white ${result.isPassed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {result.percentage}%
            </div>
            <p className="mt-2 text-sm opacity-80">{result.isPassed ? 'Passed' : 'Failed'}</p>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Exam Results</h1>
            <p className="opacity-80 mt-1">Completed on {result.date}</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div><p className="text-2xl font-bold">{result.correctAnswers}</p><p className="text-sm opacity-70">Correct</p></div>
              <div><p className="text-2xl font-bold">{result.wrongAnswers}</p><p className="text-sm opacity-70">Wrong</p></div>
              <div><p className="text-2xl font-bold">{result.timeSpent}</p><p className="text-sm opacity-70">Time Spent</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Question Review</h2>
        <div className="space-y-4">
          {result.questions?.map((q: any) => (
            <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${q.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  {q.isCorrect ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : <XCircleIcon className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{q.id}. {q.text}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className={`px-3 py-1.5 rounded ${q.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      Your answer: {q.userAnswer}
                    </div>
                    {!q.isCorrect && (
                      <div className="px-3 py-1.5 rounded bg-green-50 text-green-700">
                        Correct: {q.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
