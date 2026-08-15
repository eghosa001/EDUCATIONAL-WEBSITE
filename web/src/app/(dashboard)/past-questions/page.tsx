'use client';

import { useEffect, useState } from 'react';
import { SearchIcon, BookOpenIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

const BOARDS = [
  { code: 'WAEC', name: 'West African Examinations Council' },
  { code: 'NECO', name: 'National Examination Council' },
  { code: 'JAMB', name: 'Joint Admissions and Matriculation Board' },
  { code: 'NABTEB', name: 'National Business and Technical Exams Board' },
  { code: 'POST-UTME', name: 'Post-UTME' },
];

const YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

export default function PastQuestionsPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;

  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string; count: number }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Fetch subjects with question counts for selected board
  useEffect(() => {
    if (!selectedBoard) {
      setSubjects([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch questions grouped by subject to get counts
    fetch(`http://localhost:3000/api/v1/questions?examName=${selectedBoard}&limit=1000`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    })
      .then(res => res.json())
      .then(data => {
        const subjectMap = new Map<string, { id: string; name: string; count: number }>();
        for (const q of data.data || []) {
          const subj = q.subject;
          if (subj) {
            const key = subj.name;
            if (!subjectMap.has(key)) {
              subjectMap.set(key, { id: subj.id, name: subj.name, count: 0 });
            }
            subjectMap.get(key)!.count++;
          }
        }
        setSubjects(Array.from(subjectMap.values()).sort((a, b) => b.count - a.count));
      })
      .catch(() => setError('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, [selectedBoard, authToken]);

  // Fetch questions when subject is selected
  const fetchQuestions = async (subjectId: string, year?: number) => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });

    let url = `http://localhost:3000/api/v1/questions?subjectId=${subjectId}&examName=${selectedBoard}&limit=50`;
    if (year) url += `&examYear=${year}`;

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      setQuestions(data.data || []);
    } catch {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subject: { id: string; name: string }) => {
    setSelectedSubject(subject);
    fetchQuestions(subject.id, selectedYear ?? undefined);
  };

  const handleYearClick = (year: number) => {
    setSelectedYear(selectedYear === year ? null : year);
    if (selectedSubject) {
      fetchQuestions(selectedSubject.id, selectedYear === year ? undefined : year);
    }
  };

  const handleAnswer = (optionId: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionId);
    setShowExplanation(true);
    setScore(prev => ({ ...prev, total: prev.total + 1, correct: optionId === questions[currentIndex]?.correct_answer?.id ? prev.correct + 1 : prev.correct }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Past Questions</h1>
        <p className="text-gray-500 mt-1">Practice with WAEC, NECO, JAMB, NABTEB and more</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>
      )}

      {/* Board selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Exam Board</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {BOARDS.map(board => (
            <button
              key={board.code}
              onClick={() => { setSelectedBoard(selectedBoard === board.code ? null : board.code); setSelectedSubject(null); setSubjects([]); }}
              className={`p-4 rounded-xl border text-center transition-colors ${
                selectedBoard === board.code
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              <p className="font-semibold">{board.code}</p>
              <p className={`text-xs mt-1 ${selectedBoard === board.code ? 'text-blue-100' : 'text-gray-500'}`}>
                {subjects.filter(s => s.name).reduce((acc, s) => acc + s.count, 0) || 0} Qs
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Subject selection */}
      {selectedBoard && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{BOARDS.find(b => b.code === selectedBoard)?.name} — Subjects</p>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <ClockIcon className="w-4 h-4 animate-spin" /> Loading subjects…
            </div>
          ) : subjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedSubject?.id === subject.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <BookOpenIcon className="w-4 h-4" />
                  {subject.name}
                  <span className="text-xs opacity-75">({subject.count})</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No subjects found for this board.</p>
          )}
        </div>
      )}

      {/* Year filter */}
      {selectedSubject && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Year</p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map(year => (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
            <button
              onClick={() => { setSelectedYear(null); fetchQuestions(selectedSubject.id); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedYear
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Years
            </button>
          </div>
        </div>
      )}

      {/* Questions */}
      {selectedSubject && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <ClockIcon className="w-5 h-5 animate-spin" /> Loading questions…
            </div>
          ) : questions.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircleIcon className={`w-4 h-4 ${score.correct > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={score.correct > 0 ? 'text-green-700' : 'text-gray-600'}>
                    Score: {score.correct}/{score.total}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-900 font-medium">{currentQ?.question_text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{currentQ?.difficulty}</span>
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">{currentQ?.marks} marks</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {currentQ?.options?.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    disabled={!!selectedAnswer}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedAnswer
                        ? opt.id === currentQ.correct_answer?.id
                          ? 'bg-green-50 border-green-300 text-green-800'
                          : opt.id === selectedAnswer
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                        : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    <span className="font-medium mr-2">{opt.id}.</span>
                    {opt.text}
                    {selectedAnswer && opt.id === currentQ.correct_answer?.id && (
                      <CheckCircleIcon className="inline w-4 h-4 ml-2 text-green-600" />
                    )}
                  </button>
                ))}
              </div>

              {showExplanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="font-medium text-blue-900 mb-1">Explanation:</p>
                  <p className="text-blue-800 text-sm">{currentQ?.explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextQuestion}
                    disabled={currentIndex === questions.length - 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <button
                  onClick={() => { setSelectedSubject(null); setQuestions([]); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to Subjects
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No questions found for this selection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
