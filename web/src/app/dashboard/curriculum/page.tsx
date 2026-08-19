'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpenIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchEducationLevels,
  fetchSubjectsByLevel,
  fetchSubjectTopics,
  type EducationLevel,
  type Subject,
  type Topic,
} from '@/services/api/curriculumService';

const TERM_ORDER: Record<string, number> = {
  'First Term': 1,
  'Second Term': 2,
  'Third Term': 3,
};

export default function CurriculumPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topicsByTerm, setTopicsByTerm] = useState<Record<string, Topic[]>>({});
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEducationLevels(authToken)
      .then(setLevels)
      .catch(() => setError('Failed to load education levels'))
      .finally(() => setLoadingLevels(false));
  }, [token]);

  const selectLevel = useCallback(async (levelCode: string) => {
    setSelectedLevel(levelCode);
    setSelectedSubject(null);
    setTopicsByTerm({});
    setLoadingSubjects(true);
    setError(null);
    try {
      const data = await fetchSubjectsByLevel(levelCode, authToken);
      setSubjects(data);
    } catch {
      setSubjects([]);
      setError('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  }, [authToken]);

  const selectSubject = useCallback(async (subject: Subject) => {
    if (!selectedLevel) return;
    setSelectedSubject(subject);
    setTopicsByTerm({});
    setLoadingTopics(true);
    setError(null);
    try {
      const data = await fetchSubjectTopics(subject.id, selectedLevel, authToken);
      const grouped: Record<string, Topic[]> = {};
      for (const topic of data) {
        const term = topic.term_name || 'Other';
        (grouped[term] ||= []).push(topic);
      }
      for (const term of Object.keys(grouped)) {
        grouped[term].sort((a, b) => a.order_index - b.order_index);
      }
      setTopicsByTerm(grouped);
    } catch {
      setError('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  }, [selectedLevel, authToken]);

  const sortedTerms = Object.keys(topicsByTerm).sort(
    (a, b) => (TERM_ORDER[a] ?? 99) - (TERM_ORDER[b] ?? 99)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Curriculum</h1>
        <p className="text-gray-500 mt-1">Nigerian National Curriculum by education level</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Level selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Select Education Level</p>
        {loadingLevels ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
            <Loader2Icon className="w-4 h-4 animate-spin" /> Loading levels…
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {levels.map(level => (
              <button
                key={level.code}
                onClick={() => selectLevel(level.code)}
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
        )}
      </div>

      {/* Subjects */}
      {selectedLevel && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Subjects for {levels.find(l => l.code === selectedLevel)?.name}
          </h2>
          {loadingSubjects ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading subjects…
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => selectSubject(subject)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                    selectedSubject?.id === subject.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border-transparent'
                  }`}
                >
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{subject.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No subjects found for this level.</p>
          )}
        </div>
      )}

      {/* Topics */}
      {selectedSubject && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-blue-600" />
            {selectedSubject.name}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {levels.find(l => l.code === selectedLevel)?.name} · {
              Object.values(topicsByTerm).reduce((sum, topics) => sum + topics.length, 0)
            } topics
          </p>
          {loadingTopics ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <Loader2Icon className="w-4 h-4 animate-spin" /> Loading topics…
            </div>
          ) : sortedTerms.length > 0 ? (
            <div className="space-y-5">
              {sortedTerms.map(term => (
                <div key={term}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">{term}</h3>
                  <ol className="list-decimal list-inside space-y-1.5">
                    {topicsByTerm[term].map(topic => (
                      <li key={topic.id} className="text-sm text-gray-700">
                        {topic.name}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No topics found for this subject.</p>
          )}
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
