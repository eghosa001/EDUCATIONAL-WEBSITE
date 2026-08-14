'use client';

import { useState } from 'react';
import { SearchIcon, FilterIcon } from 'lucide-react';

const boards = [
  { code: 'WAEC', name: 'West African Examinations Council', questions: 1250 },
  { code: 'NECO', name: 'National Examination Council', questions: 980 },
  { code: 'JAMB', name: 'Joint Admissions and Matriculation Board', questions: 4200 },
  { code: 'NABTEB', name: 'National Business and Technical Exams Board', questions: 650 },
  { code: 'POST-UTME', name: 'Post-UTME', questions: 3100 },
];

const subjectsByBoard: Record<string, string[]> = {
  WAEC: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature'],
  NECO: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Civic Education'],
  JAMB: ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Commerce'],
  NABTEB: ['Mathematics', 'English', 'Technical Drawing', 'Further Maths'],
  'POST-UTME': ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
};

export default function PastQuestionsPage() {
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjects = selectedBoard ? (subjectsByBoard[selectedBoard] || []) : [];
  const filteredSubjects = subjects.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Past Questions</h1>
        <p className="text-gray-500 mt-1">Practice with past WAEC, NECO, JAMB and more</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search questions by subject..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Board selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {boards.map(board => (
          <button
            key={board.code}
            onClick={() => { setSelectedBoard(selectedBoard === board.code ? null : board.code); setSelectedSubject(null); }}
            className={`p-4 rounded-xl border text-center transition-colors ${
              selectedBoard === board.code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
            }`}
          >
            <p className="font-semibold">{board.code}</p>
            <p className={`text-xs mt-1 ${selectedBoard === board.code ? 'text-blue-100' : 'text-gray-500'}`}>{board.questions.toLocaleString()} Qs</p>
          </button>
        ))}
      </div>

      {/* Subject selection */}
      {selectedBoard && filteredSubjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{boards.find(b => b.code === selectedBoard)?.name} — Select Subject</p>
          <div className="flex flex-wrap gap-2">
            {filteredSubjects.map(subject => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubject === subject
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          {selectedSubject && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">{selectedSubject} past questions coming soon</p>
              <p className="text-sm text-green-600 mt-1">Browse our course catalog for practice questions in the meantime.</p>
            </div>
          )}
        </div>
      )}

      {selectedBoard && filteredSubjects.length === 0 && (
        <div className="text-center py-8 text-gray-500">No subjects match "{search}"</div>
      )}
    </div>
  );
}
