'use client';

import { useEffect, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

export default function CurriculumPage() {
  const { token } = useAuthStore();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const levels = [
    { code: 'P1', name: 'Primary 1', order: 1 },
    { code: 'P2', name: 'Primary 2', order: 2 },
    { code: 'P3', name: 'Primary 3', order: 3 },
    { code: 'P4', name: 'Primary 4', order: 4 },
    { code: 'P5', name: 'Primary 5', order: 5 },
    { code: 'P6', name: 'Primary 6', order: 6 },
    { code: 'JSS1', name: 'Junior Secondary 1', order: 7 },
    { code: 'JSS2', name: 'Junior Secondary 2', order: 8 },
    { code: 'JSS3', name: 'Junior Secondary 3', order: 9 },
    { code: 'SSS1', name: 'Senior Secondary 1', order: 10 },
    { code: 'SSS2', name: 'Senior Secondary 2', order: 11 },
    { code: 'SSS3', name: 'Senior Secondary 3', order: 12 },
  ];

  const subjectsByLevel: Record<string, string[]> = {
    P1: ['Mathematics', 'English', 'Basic Science', 'Civic Education', 'Creative Art'],
    P2: ['Mathematics', 'English', 'Basic Science', 'Civic Education', 'Creative Art'],
    P3: ['Mathematics', 'English', 'Basic Science', 'Civic Education', 'Creative Art', 'Hausa/Yoruba/Igbo'],
    JSS1: ['Mathematics', 'English', 'Basic Science', 'Basic Technology', 'Civic Education', 'Agricultural Science'],
    JSS2: ['Mathematics', 'English', 'Basic Science', 'Basic Technology', 'Civic Education', 'Home Economics'],
    JSS3: ['Mathematics', 'English', 'Basic Science', 'Social Studies', 'Civic Education', 'Commercial Arts'],
    SSS1: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'],
    SSS2: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Government'],
    SSS3: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Literature'],
  };

  const subjects = selectedLevel ? (subjectsByLevel[selectedLevel] || []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Curriculum</h1>
        <p className="text-gray-500 mt-1">Nigerian National Curriculum by education level</p>
      </div>

      {/* Level selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Education Level</p>
        <div className="flex flex-wrap gap-2">
          {levels.map(level => (
            <button
              key={level.code}
              onClick={() => setSelectedLevel(selectedLevel === level.code ? null : level.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Subjects for {levels.find(l => l.code === selectedLevel)?.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map(subject => (
              <div key={subject} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-pointer transition-colors">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedLevel && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <p>Select an education level above to view available subjects</p>
        </div>
      )}
    </div>
  );
}
