'use client';

import { BookOpenIcon, FileTextIcon, VideoIcon, DownloadIcon, StarIcon } from 'lucide-react';

const examTypes = ['WAEC', 'NECO', 'JAMB', 'NABTEB', 'Post-UTME'];
const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'];

export default function ExamDetailPage() {
  const exam = { title: 'SS2 Biology Mid-Term Exam', type: 'Timed', duration: 60, questions: 40, marks: 100, passing: 40 };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
        <p className="text-gray-500 mt-1">Test your knowledge with timed practice exams</p>
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[{ label: 'Questions', value: exam.questions, icon: FileTextIcon },
            { label: 'Duration', value: `${exam.duration}min`, icon: BookOpenIcon },
            { label: 'Total Marks', value: exam.marks, icon: StarIcon },
            { label: 'Passing', value: exam.passing, icon: DownloadIcon }].map(s => (
            <div key={s.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <s.icon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <button className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Start Exam</button>
      </div>
    </div>
  );
}
