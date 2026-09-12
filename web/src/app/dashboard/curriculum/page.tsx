'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, ChevronRightIcon, Loader2Icon, SearchIcon } from 'lucide-react';
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

function levelCodeToClassSlug(code: string | null) {
  if (!code) return null;
  const primary = code.match(/^P([1-6])$/i);
  if (primary) return `primary-${primary[1]}`;
  const jss = code.match(/^JSS([1-3])$/i);
  if (jss) return `jss-${jss[1]}`;
  const sss = code.match(/^SSS([1-3])$/i);
  if (sss) return `ss-${sss[1]}`;
  return null;
}

function cleanTopicName(name: string) {
  const raw = name.replace(/\s+/g, ' ').trim();
  const mainHeading = raw.split('•')[0]?.trim() || raw;
  const cleaned = mainHeading.replace(/[,:;\-]+$/g, '').replace(/\s+/g, ' ').trim();
  return cleaned || raw;
}

function dedupeTopics(topics: Topic[]) {
  const seen = new Set<string>();
  return topics.filter(topic => {
    const key = cleanTopicName(topic.name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function CurriculumPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topicsByTerm, setTopicsByTerm] = useState<Record<string, Topic[]>>({});
  const [rawTopicCount, setRawTopicCount] = useState(0);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEducationLevels(authToken)
      .then(setLevels)
      .catch(() => setError('Failed to load education levels'))
      .finally(() => setLoadingLevels(false));
  }, [authToken]);

  const selectLevel = useCallback(async (levelCode: string) => {
    setSelectedLevel(levelCode);
    setSelectedSubject(null);
    setTopicsByTerm({});
    setRawTopicCount(0);
    setSubjectSearch('');
    setTopicSearch('');
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
    setRawTopicCount(0);
    setTopicSearch('');
    setLoadingTopics(true);
    setError(null);
    try {
      const data = await fetchSubjectTopics(subject.id, selectedLevel, authToken);
      setRawTopicCount(data.length);
      const grouped: Record<string, Topic[]> = {};
      for (const topic of data) {
        const term = topic.term_name || 'Other';
        (grouped[term] ||= []).push(topic);
      }
      for (const term of Object.keys(grouped)) {
        grouped[term].sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name));
        grouped[term] = dedupeTopics(grouped[term]);
      }
      setTopicsByTerm(grouped);
    } catch {
      setError('Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  }, [selectedLevel, authToken]);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return q ? subjects.filter(subject => subject.name.toLowerCase().includes(q)) : subjects;
  }, [subjects, subjectSearch]);

  const filteredTopicsByTerm = useMemo<Record<string, Topic[]>>(() => {
    const q = topicSearch.trim().toLowerCase();
    if (!q) return topicsByTerm;
    const filteredEntries: Array<[string, Topic[]]> = Object.entries(topicsByTerm)
      .map(([term, topics]): [string, Topic[]] => [
        term,
        topics.filter(topic => `${cleanTopicName(topic.name)} ${topic.name} ${topic.description || ''}`.toLowerCase().includes(q)),
      ])
      .filter(([, topics]) => topics.length > 0);
    return Object.fromEntries(filteredEntries) as Record<string, Topic[]>;
  }, [topicsByTerm, topicSearch]);

  const sortedTerms = Object.keys(filteredTopicsByTerm).sort(
    (a, b) => (TERM_ORDER[a] ?? 99) - (TERM_ORDER[b] ?? 99)
  );
  const classSlug = levelCodeToClassSlug(selectedLevel);
  const selectedLevelName = levels.find(level => level.code === selectedLevel)?.name;
  const totalTopics = Object.values(topicsByTerm).reduce((sum, topics) => sum + topics.length, 0);
  const visibleTopics = Object.values(filteredTopicsByTerm).reduce((sum, topics) => sum + topics.length, 0);
  const duplicateCount = Math.max(0, rawTopicCount - totalTopics);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Curriculum</h1>
          <p className="mt-1 text-gray-500">Browse the Nigerian National Curriculum by class, subject, term and topic.</p>
        </div>
        {classSlug && (
          <Link href={`/dashboard/lessons/class/${classSlug}`} className="inline-flex items-center justify-center rounded-lg bg-[#151A3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#202750]">
            Open teaching materials
          </Link>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-200">1. Select education level</p>
        {loadingLevels ? (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-500"><Loader2Icon className="h-4 w-4 animate-spin" /> Loading levels…</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {levels.map(level => (
              <button key={level.code} onClick={() => selectLevel(level.code)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${selectedLevel === level.code ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200'}`}>
                {level.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLevel && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#1b2045]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">2. Choose a subject</h2>
              <p className="text-sm text-gray-500">{selectedLevelName} · {subjects.length} subjects</p>
            </div>
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={subjectSearch} onChange={event => setSubjectSearch(event.target.value)} placeholder="Search subjects…" className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white" />
            </div>
          </div>
          {loadingSubjects ? (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500"><Loader2Icon className="h-4 w-4 animate-spin" /> Loading subjects…</div>
          ) : filteredSubjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredSubjects.map(subject => (
                <button key={subject.id} onClick={() => selectSubject(subject)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${selectedSubject?.id === subject.id ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30' : 'border-transparent bg-gray-50 hover:border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:hover:border-blue-800'}`}>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-slate-200">{subject.name}</span>
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">No subjects match your search.</p>}
        </div>
      )}

      {selectedSubject && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#1b2045]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"><BookOpenIcon className="h-5 w-5 text-blue-600" />3. {selectedSubject.name} topics</h2>
              <p className="mt-1 text-sm text-gray-500">{selectedLevelName} · {topicSearch ? `${visibleTopics} of ${totalTopics}` : totalTopics} unique topics{duplicateCount ? ` · ${duplicateCount} repeated headings collapsed` : ''}</p>
            </div>
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={topicSearch} onChange={event => setTopicSearch(event.target.value)} placeholder="Search topics…" className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white" />
            </div>
          </div>

          {loadingTopics ? (
            <div className="flex items-center gap-2 py-4 text-sm text-gray-500"><Loader2Icon className="h-4 w-4 animate-spin" /> Loading topics…</div>
          ) : sortedTerms.length > 0 ? (
            <div className="space-y-5">
              {sortedTerms.map(term => (
                <section key={term} className="rounded-xl border border-gray-100 p-4 dark:border-slate-700">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">{term}</h3>
                    <span className="text-xs text-gray-400">{filteredTopicsByTerm[term].length} topic{filteredTopicsByTerm[term].length === 1 ? '' : 's'}</span>
                  </div>
                  <ol className="grid gap-2 md:grid-cols-2">
                    {filteredTopicsByTerm[term].map((topic: Topic, index: number) => (
                      <li key={topic.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-slate-800 dark:text-slate-200" title={topic.name}>
                        <span className="mr-2 font-semibold text-gray-400">{index + 1}.</span>{cleanTopicName(topic.name)}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">No topics match this subject/search.</p>}

          {classSlug && (
            <div className="mt-6 border-t border-gray-100 pt-4 dark:border-slate-700">
              <Link href={`/dashboard/lessons/class/${classSlug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300">
                Continue to {selectedLevelName} teaching materials <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {!selectedLevel && <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500 dark:border-slate-700 dark:bg-[#1b2045]"><p>Select an education level above to view subjects and topics.</p></div>}
    </div>
  );
}
