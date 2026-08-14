'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpenIcon, ArrowLeftIcon } from 'lucide-react';

const subjects: Record<string, string[]> = {
  Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics'],
  English: ['Comprehension', 'Lexis and Structure', 'Use of English', 'Oral English'],
  Physics: ['Mechanics', 'Waves', 'Electricity', 'Optics', 'Modern Physics'],
  Chemistry: ['Organic', 'Inorganic', 'Physical', 'Analytical'],
  Biology: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology'],
  Economics: ['Microeconomics', 'Macroeconomics', 'Econometrics'],
};

export default function PastQuestionsBoardPage() {
  const params = useParams();
  const board = params?.board as string;
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjectList = subjects[board.toUpperCase()] || Object.keys(subjects);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/past-questions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Past Questions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{board.toUpperCase()} Past Questions</h1>
        <p className="text-gray-500 mt-1">Select a subject to practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectList.map(subject => (
          <Link
            key={subject}
            href={`/dashboard/past-questions/${board}/${subject}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <BookOpenIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{subject}</p>
                <p className="text-sm text-gray-500">Practice questions available</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
