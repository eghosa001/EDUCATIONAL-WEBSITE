'use client';

import { useParams } from 'next/navigation';
import { PlayIcon, BookOpenIcon, DownloadIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params?.lessonId as string;

  // Mock lesson data - replace with API call
  const lesson = {
    id: lessonId,
    title: 'Cell Biology: Structure and Function',
    description: 'Learn about the fundamental building blocks of life - cells.',
    contentType: 'video',
    videoUrl: '',
    duration: 1800,
    isPublished: true,
    learningObjectives: ['Understand cell structure', 'Identify organelles', 'Explain cell functions'],
    keyPoints: ['Cells are the basic unit of life', 'Plant and animal cells differ in structure', 'Organelles perform specific functions'],
    estimatedMinutes: 30,
  };

  return (
    <div className="space-y-6">
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
        <PlayIcon className="w-16 h-16 text-blue-400" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
        <p className="text-gray-500 mt-1">{lesson.description}</p>
        <div className="flex gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {Math.floor(lesson.estimatedMinutes / 60)}h {lesson.estimatedMinutes % 60}m</span>
          <span className="flex items-center gap-1"><BookOpenIcon className="w-4 h-4" /> {lesson.contentType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Learning Objectives</h2>
            <ul className="space-y-2">
              {lesson.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Key Points</h2>
            <ul className="space-y-2">
              {lesson.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Resources</h3>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-700">
              <DownloadIcon className="w-4 h-4" /> Download Notes
            </button>
          </div>

          <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
}
