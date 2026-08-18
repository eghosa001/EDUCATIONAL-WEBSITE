'use client';

import { useEffect, useState, useCallback } from 'react';
import { SearchIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, DownloadIcon, FileTextIcon, FilterIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { pastQuestionFilesAPI, formatFileSize, type BoardInfo, type SubjectInfo, type PastQuestionFile } from '@/api/past-questions/files';

const BOARDS = [
  { code: 'waec', name: 'West African Examinations Council', color: 'blue' },
  { code: 'jamb', name: 'Joint Admissions and Matriculation Board', color: 'green' },
  { code: 'neco', name: 'National Examination Council', color: 'purple' },
  { code: 'nabteb', name: 'National Business and Technical Exams Board', color: 'orange' },
];

const YEARS = Array.from({ length: 15 }, (_, i) => 2025 - i);

type TabType = 'papers' | 'questions';

export default function PastQuestionsPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;

  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // File browser state
  const [boards, setBoards] = useState<BoardInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [files, setFiles] = useState<PastQuestionFile[]>([]);
  const [filesPagination, setFilesPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Question bank state
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load boards on mount
  useEffect(() => {
    pastQuestionFilesAPI.getBoards(authToken).then(res => {
      setBoards(res.data.boards);
    }).catch(() => {});
  }, [authToken]);

  // Load subjects when board changes
  useEffect(() => {
    if (!selectedBoard || activeTab !== 'papers') {
      setSubjects([]);
      return;
    }
    pastQuestionFilesAPI.getSubjectsByBoard(selectedBoard, authToken).then(res => {
      setSubjects(res.data.subjects);
    }).catch(() => {});
  }, [selectedBoard, activeTab, authToken]);

  // Load files when filters change
  const loadFiles = useCallback(async (page = 1) => {
    if (!selectedBoard || activeTab !== 'papers') return;
    setLoading(true);
    setError(null);
    try {
      const res = await pastQuestionFilesAPI.listByBoard(selectedBoard, {
        subject: selectedSubject || undefined,
        year: selectedYear || undefined,
        page,
        limit: 20,
      }, authToken);
      setFiles(res.data.files);
      setFilesPagination(res.pagination);
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [selectedBoard, selectedSubject, selectedYear, activeTab, authToken]);

  useEffect(() => {
    loadFiles(1);
  }, [loadFiles]);

  // Load questions for question bank tab
  useEffect(() => {
    if (activeTab !== 'questions' || !selectedBoard) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/v1/past-questions/boards/${selectedBoard}/questions?limit=50`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    })
      .then(res => res.json())
      .then(data => setQuestions(data.data?.questions || []))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, [selectedBoard, activeTab, authToken]);

  const handleBoardClick = (code: string) => {
    setSelectedBoard(selectedBoard === code ? null : code);
    setSelectedSubject(null);
    setSelectedYear(null);
    setSearchQuery('');
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setQuestions([]);
  };

  const handleAnswer = (optionId: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(optionId);
    setShowExplanation(true);
    setScore(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: optionId === questions[currentIndex]?.correct_answer?.id ? prev.correct + 1 : prev.correct,
    }));
  };

  const currentQ = questions[currentIndex];

  const getBoardColor = (code: string) => {
    const board = BOARDS.find(b => b.code === code);
    return board?.color || 'gray';
  };

  const filteredFiles = files.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.file_name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Past Questions</h1>
        <p className="text-gray-500 mt-1">Access WAEC, JAMB, NECO past papers and practice questions</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('papers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'papers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileTextIcon className="w-4 h-4 inline mr-1.5" />
          Past Papers
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'questions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpenIcon className="w-4 h-4 inline mr-1.5" />
          Practice Questions
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>
      )}

      {/* Board selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Exam Board</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BOARDS.map(board => {
            const boardInfo = boards.find(b => b.board === board.code);
            return (
              <button
                key={board.code}
                onClick={() => handleBoardClick(board.code)}
                className={`p-4 rounded-xl border text-center transition-colors ${
                  selectedBoard === board.code
                    ? `bg-${board.color}-600 text-white border-${board.color}-600`
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                <p className="font-semibold">{board.code.toUpperCase()}</p>
                <p className={`text-xs mt-1 ${selectedBoard === board.code ? 'text-blue-100' : 'text-gray-500'}`}>
                  {boardInfo ? `${boardInfo.file_count} files` : board.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Papers Tab */}
      {activeTab === 'papers' && selectedBoard && (
        <>
          {/* Subject filter */}
          {subjects.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Subjects ({subjects.length})
                </p>
                {selectedSubject && (
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {subjects.map(subject => (
                  <button
                    key={subject.subject}
                    onClick={() => setSelectedSubject(selectedSubject === subject.subject ? null : subject.subject)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      selectedSubject === subject.subject
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <BookOpenIcon className="w-3.5 h-3.5" />
                    {subject.subject}
                    <span className="text-xs opacity-75">({subject.file_count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Year</p>
            <div className="flex flex-wrap gap-2">
              {YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(selectedYear === year ? null : year)}
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
                onClick={() => setSelectedYear(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !selectedYear ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Years
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Files list */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">
                {filesPagination.total} files found
              </p>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 py-8">
                <ClockIcon className="w-5 h-5 animate-spin" /> Loading files...
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <FileTextIcon className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{file.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{file.subject}</span>
                          {file.year && <span className="text-xs text-gray-400">|</span>}
                          {file.year && <span className="text-xs text-gray-500">{file.year}</span>}
                          {file.paper_type && <span className="text-xs text-gray-400">|</span>}
                          {file.paper_type && <span className="text-xs text-gray-500">{file.paper_type}</span>}
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.is_processed && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {file.questions_extracted} Qs
                        </span>
                      )}
                      <a
                        href={file.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Open PDF"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                      <a
                        href={file.public_url}
                        download
                        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-100 transition-colors"
                        title="Download"
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No files found for this selection.</p>
              </div>
            )}

            {/* Pagination */}
            {filesPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
                {Array.from({ length: Math.min(filesPagination.totalPages, 10) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => loadFiles(page)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filesPagination.page === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && selectedBoard && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <ClockIcon className="w-5 h-5 animate-spin" /> Loading questions...
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

              {showExplanation && currentQ?.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="font-medium text-blue-900 mb-1">Explanation:</p>
                  <p className="text-blue-800 text-sm">{currentQ.explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setSelectedAnswer(null); setShowExplanation(false); } }}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => { if (currentIndex < questions.length - 1) { setCurrentIndex(currentIndex + 1); setSelectedAnswer(null); setShowExplanation(false); } }}
                    disabled={currentIndex === questions.length - 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No questions available for this board yet.</p>
              <p className="text-sm mt-2">Try the Past Papers tab to access PDF documents.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no board selected */}
      {!selectedBoard && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an exam board above</h3>
          <p className="text-gray-500 text-sm">
            Browse past papers and practice questions from WAEC, JAMB, NECO, and more.
          </p>
        </div>
      )}
    </div>
  );
}
