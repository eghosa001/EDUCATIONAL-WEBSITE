'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  GraduationCapIcon,
  PlayIcon,
  TrophyIcon,
  XCircleIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';
import { fetchPastQuestionExplanation } from '@/services/api/pastQuestionAnalyticsService';
import { fetchExamBoardAvailability } from '@/services/api/examBoardService';
import {
  fetchJambCoursePresets,
  gradeJambCbtSession,
  startJambCbtSession,
  type JambCoursePreset,
} from '@/services/api/jambService';

type Mode = 'class' | 'exam';
type Experience = 'legacy' | 'class' | 'school-past' | 'school-cbt' | 'jamb-past' | 'jamb-cbt';
type Phase = 'setup' | 'count' | 'exam' | 'results';
type ClassRow = { id: string; name: string; code: string | null };
type SubjectRow = { id: string; name: string; code: string | null };
type Question = {
  id: string;
  question_text: string;
  options: unknown;
  difficulty: string | null;
  question_image_url?: string | null;
  year?: number | null;
  board?: string | null;
  subject_id?: string | null;
  source: 'class' | 'exam';
  subject_name?: string | null;
};
type GradeRow = { question_id: string; is_correct: boolean; correct_answer: unknown; explanation: string | null };
type GradeResult = {
  total: number;
  answered?: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  attemptId?: string;
  timedOut?: boolean;
  timeSpentSeconds?: number;
  subjectBreakdown?: Array<{ subjectId: string; subjectName: string; total: number; answered: number; correct: number; percentage: number }>;
  results: GradeRow[];
};

const EXAMS = [
  { code: 'jamb', label: 'JAMB / UTME', max: 4 },
  { code: 'waec', label: 'WAEC', max: 9 },
  { code: 'neco', label: 'NECO', max: 9 },
  { code: 'nabteb', label: 'NABTEB', max: 9 },
] as const;
const COUNTS = [10, 20, 30, 40, 50];

function optionsOf(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item: any, index) => ({
      id: String(item?.id ?? item?.label ?? String.fromCharCode(65 + index)),
      text: String(item?.text ?? item?.value ?? item ?? ''),
    }));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([id, item]: any) => ({
      id,
      text: String(item?.text ?? item?.value ?? item ?? ''),
    }));
  }
  return [];
}
function scalar(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const item: any = value;
    return String(item.id ?? item.label ?? item.answer ?? item.value ?? '') || null;
  }
  return null;
}
function shuffle<T>(rows: T[]) {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function PastQuestionsPage() {
  const { token } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('exam');
  const [experience, setExperience] = useState<Experience>('legacy');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [examAvailability, setExamAvailability] = useState<Record<string, string[]>>({});
  const [classAvailability, setClassAvailability] = useState<Record<string, string[]>>({});
  const [examYears, setExamYears] = useState<Record<string, number[]>>({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('jamb');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classPracticeSessionId, setClassPracticeSessionId] = useState<string | null>(null);
  const [jambSessionId, setJambSessionId] = useState<string | null>(null);
  const [jambPresets, setJambPresets] = useState<JambCoursePreset[]>([]);
  const [jambSubjectAvailability, setJambSubjectAvailability] = useState<Record<string, number>>({});
  const [selectedCoursePresetId, setSelectedCoursePresetId] = useState('');
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});
  const [jambDurationMinutes, setJambDurationMinutes] = useState(40);
  const [jambPresetLoading, setJambPresetLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanationOverrides, setExplanationOverrides] = useState<Record<string, string>>({});
  const [explainingQuestionId, setExplainingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = new URLSearchParams(window.location.search);
      const requestedBoard = String(query.get('board') || '').toLowerCase();
      const requestedExperience = String(query.get('experience') || '').toLowerCase() as Experience;
      const validBoard = EXAMS.some(exam => exam.code === requestedBoard);
      const validExperience: Experience = ['class','school-past','school-cbt','jamb-past','jamb-cbt'].includes(requestedExperience)
        ? requestedExperience
        : 'legacy';

      if (validExperience === 'class') {
        setExperience('class');
        setMode('class');
      } else if (validBoard) {
        setExperience(validExperience === 'legacy' ? (requestedBoard === 'jamb' ? 'jamb-cbt' : 'school-cbt') : validExperience);
        setMode('exam');
        setSelectedExam(requestedBoard);
      } else {
        setExperience(validExperience);
      }

      const needsClassData = validExperience === 'class' || (!validBoard && validExperience === 'legacy');
      const needsExamData = validBoard || validExperience !== 'class';

      const [classResult, subjectResult, courseResult, availability] = await Promise.all([
        needsClassData
          ? supabase.from('classes').select('id,name,code').eq('is_active', true).order('order_index')
          : Promise.resolve({ data: [] as any[], error: null }),
        supabase.from('subjects').select('id,name,code').eq('is_active', true).order('order_index'),
        needsClassData
          ? supabase.from('courses').select('class_id,subject_id').eq('status', 'published')
          : Promise.resolve({ data: [] as any[], error: null }),
        needsExamData ? fetchExamBoardAvailability(token).catch(() => ({})) : Promise.resolve({}),
      ]);
      if (cancelled) return;

      const setupError = classResult.error || subjectResult.error || courseResult.error;
      if (setupError) setError(setupError.message || 'Unable to load practice setup');
      setClasses((classResult.data || []) as ClassRow[]);
      setSubjects((subjectResult.data || []) as SubjectRow[]);

      const classSubjects: Record<string, string[]> = {};
      for (const row of courseResult.data || []) {
        const classId = String((row as any).class_id || '');
        const subjectId = String((row as any).subject_id || '');
        if (!classId || !subjectId) continue;
        const values = classSubjects[classId] || (classSubjects[classId] = []);
        if (!values.includes(subjectId)) values.push(subjectId);
      }
      setClassAvailability(classSubjects);

      const bySubject: Record<string, string[]> = {};
      const byYear: Record<string, number[]> = {};
      for (const [board, value] of Object.entries(availability || {}) as [string, any][]) {
        bySubject[board] = Array.isArray(value?.subjectIds) ? value.subjectIds : [];
        byYear[board] = Array.isArray(value?.years) ? value.years : [];
      }
      setExamAvailability(bySubject);
      setExamYears(byYear);
    })().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load practice setup');
    });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || experience !== 'jamb-cbt') return;
    let cancelled = false;
    setJambPresetLoading(true);
    void fetchJambCoursePresets(token)
      .then((data) => {
        if (cancelled) return;
        setJambPresets(data.presets || []);
        setJambSubjectAvailability(data.subjectAvailability || {});
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load JAMB course presets');
      })
      .finally(() => {
        if (!cancelled) setJambPresetLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, experience]);

  useEffect(() => {
    if (!subjects.length) return;
    const query = new URLSearchParams(window.location.search);
    const subject = decodeURIComponent(query.get('subject') || '').trim().toLowerCase();
    if (subject) {
      const match = subjects.find(item => item.name.toLowerCase() === subject || String(item.code || '').toLowerCase() === subject);
      if (match) setSelectedSubjects([match.id]);
    }
  }, [subjects]);

  const isUntimedPastQuestions = experience === 'school-past' || experience === 'jamb-past';
  const isTimedSession = !isUntimedPastQuestions;

  useEffect(() => {
    if (phase !== 'exam' || !isTimedSession) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, isTimedSession]);

  useEffect(() => {
    if (phase === 'exam' && isTimedSession && secondsLeft === 0 && questions.length > 0 && !submitting) {
      void submitCbt(true);
    }
    // submitCbt intentionally reads the latest component state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, isTimedSession]);

  const examConfig = EXAMS.find(item => item.code === selectedExam)!;
  const visibleSubjects = mode === 'exam' && examAvailability[selectedExam]?.length
    ? subjects.filter(subject => examAvailability[selectedExam].includes(subject.id))
    : mode === 'class' && selectedClass
      ? subjects.filter(subject => (classAvailability[selectedClass] || []).includes(subject.id))
      : subjects;
  const availableYears = examYears[selectedExam] || [];
  const selectedNames = selectedSubjects.map(id => subjects.find(subject => subject.id === id)?.name).filter(Boolean) as string[];
  const isJambCbt = experience === 'jamb-cbt' || (experience === 'legacy' && mode === 'exam' && selectedExam === 'jamb');
  const singleSubjectExternal = experience === 'jamb-past' || experience === 'school-past' || experience === 'school-cbt';
  const jambHasEnglish = selectedSubjects.some(id => {
    const name = subjects.find(subject => subject.id === id)?.name || jambPresets.flatMap(preset => preset.subjects).find(subject => subject.id === id)?.name || '';
    return /^(english language|use of english)$/i.test(name.trim());
  });
  const selectionValid = mode === 'class'
    ? Boolean(selectedClass && selectedSubjects.length === 1)
    : isJambCbt
      ? selectedSubjects.length === 4 && jambHasEnglish
      : singleSubjectExternal
        ? selectedSubjects.length === 1
        : selectedSubjects.length > 0;
  const current = questions[index];
  const currentOptions = optionsOf(current?.options);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const resultMap = useMemo(() => new Map((grade?.results || []).map(row => [row.question_id, row])), [grade]);

  const resetSession = () => {
    setQuestions([]);
    setClassPracticeSessionId(null);
    setJambSessionId(null);
    setAnswers({});
    setFlagged(new Set());
    setIndex(0);
    setSecondsLeft(0);
    setStartedAt(null);
    setGrade(null);
    setExplanationOverrides({});
    setExplainingQuestionId(null);
    setError(null);
  };
  const chooseMode = (value: Mode) => {
    resetSession();
    setPhase('setup');
    setMode(value);
    setSelectedSubjects([]);
    setSelectedYear('');
  };
  const selectedPreset = jambPresets.find(item => item.id === selectedCoursePresetId) || null;
  const selectedJambPlan = selectedSubjects.map(subjectId => ({
    subjectId,
    count: Math.max(0, Number(subjectQuestionCounts[subjectId] ?? 10)),
    available: Number(jambSubjectAvailability[subjectId] || 0),
    name: subjects.find(subject => subject.id === subjectId)?.name || selectedPreset?.subjects.find(subject => subject.id === subjectId)?.name || 'Subject',
  }));
  const jambQuestionTotal = selectedJambPlan.reduce((sum, item) => sum + item.count, 0);
  const jambPlanValid = isJambCbt
    ? selectedJambPlan.length === 4 &&
      selectedJambPlan.every(item => item.count >= 1 && item.count <= item.available) &&
      jambDurationMinutes >= 5 && jambDurationMinutes <= 240
    : true;

  const applyCoursePreset = (presetId: string) => {
    setSelectedCoursePresetId(presetId);
    const preset = jambPresets.find(item => item.id === presetId);
    if (!preset) {
      setSelectedSubjects([]);
      setSubjectQuestionCounts({});
      return;
    }
    const ids = preset.subjects.map(subject => subject.id);
    const counts: Record<string, number> = {};
    for (const subject of preset.subjects) {
      counts[subject.id] = Math.min(10, Math.max(0, Number(subject.availableQuestions || 0)));
    }
    setSelectedSubjects(ids);
    setSubjectQuestionCounts(counts);
    setSelectedYear('');
    setError(null);
  };

  const setJambSubjectCount = (subjectId: string, value: number) => {
    const available = Number(jambSubjectAvailability[subjectId] || 0);
    const next = Math.max(1, Math.min(100, Math.round(value || 1)));
    setSubjectQuestionCounts(previous => ({ ...previous, [subjectId]: Math.min(next, Math.max(1, available || next)) }));
  };

  const toggleSubject = (id: string) => {
    if (isJambCbt) {
      setSelectedCoursePresetId('');
      setSelectedSubjects(previous => {
        if (previous.includes(id)) {
          setSubjectQuestionCounts(counts => {
            const next = { ...counts };
            delete next[id];
            return next;
          });
          return previous.filter(value => value !== id);
        }
        if (previous.length >= 4) return previous;
        setSubjectQuestionCounts(counts => ({ ...counts, [id]: Math.min(10, Math.max(1, Number(jambSubjectAvailability[id] || 10))) }));
        return [...previous, id];
      });
      return;
    }
    if (mode === 'class' || singleSubjectExternal) {
      setSelectedSubjects(previous => previous.includes(id) ? [] : [id]);
      return;
    }
    setSelectedSubjects(previous => previous.includes(id)
      ? previous.filter(value => value !== id)
      : previous.length < examConfig.max ? [...previous, id] : previous);
  };

  const continueToCount = () => {
    if (!selectionValid) {
      setError(isJambCbt
        ? 'Select exactly 4 JAMB / UTME subjects before continuing.'
        : singleSubjectExternal
          ? 'Select one subject before continuing.'
          : 'Complete your practice selection before continuing.');
      return;
    }
    setError(null);
    setPhase('count');
  };

  const loadExamQuestions = async () => {
    const targets = selectedSubjects.map((subjectId, position) => {
      const base = Math.floor(questionCount / selectedSubjects.length);
      const extra = position < questionCount % selectedSubjects.length ? 1 : 0;
      return { subjectId, target: base + extra };
    });
    const groups = await Promise.all(targets.map(async ({ subjectId, target }) => {
      if (target <= 0) return [] as Question[];
      const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions/session`, {
        method: 'POST',
        headers: getLearnerApiHeaders(token ?? undefined),
        credentials: learnerApiConfig.credentials,
        body: JSON.stringify({
          board: selectedExam,
          subjectId,
          count: Math.max(5, target),
          ...(selectedYear ? { year: Number(selectedYear) } : {}),
        }),
      });
      if (response.status === 404) return [] as Question[];
      const payload = await handleApiResponse<any>(response);
      return (payload?.data?.questions || []).slice(0, target).map((question: any) => ({
        id: String(question.id),
        question_text: String(question.question_text || ''),
        options: question.options,
        difficulty: question.difficulty ?? null,
        question_image_url: question.question_image_url ?? null,
        year: question.year ?? null,
        board: question.board ?? selectedExam,
        subject_id: question.subject_id ?? subjectId,
        source: 'exam' as const,
      }));
    }));
    return shuffle(groups.flat());
  };

  async function startCbt() {
    if (!token || !selectionValid || loading) return;
    if (isJambCbt && !jambPlanValid) {
      setError('Adjust each subject question count to the verified JAMB bank capacity and choose a total time between 5 and 240 minutes.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let loaded: Question[] = [];
      let sessionSeconds: number | null = null;
      if (mode === 'class') {
        const response = await fetch(`${learnerApiConfig.baseUrl}/class-practice/session`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubjects[0],
            count: questionCount,
          }),
        });
        const payload = await handleApiResponse<any>(response);
        setClassPracticeSessionId(String(payload.data?.sessionId || ''));
        loaded = (payload.data?.questions || []).map((question: any) => ({
          id: String(question.id),
          question_text: String(question.question_text || ''),
          options: question.options,
          difficulty: question.difficulty ?? null,
          subject_id: selectedSubjects[0],
          source: 'class' as const,
        }));
      } else if (isJambCbt) {
        const session = await startJambCbtSession(token, {
          ...(selectedCoursePresetId ? { coursePresetId: selectedCoursePresetId } : {}),
          durationMinutes: jambDurationMinutes,
          subjects: selectedJambPlan.map(item => ({ subjectId: item.subjectId, count: item.count })),
        });
        setJambSessionId(String(session.sessionId || ''));
        loaded = (session.questions || []).map((question: any) => ({
          id: String(question.id),
          question_text: String(question.question_text || ''),
          options: question.options,
          difficulty: question.difficulty ?? null,
          question_image_url: question.question_image_url ?? null,
          year: question.year ?? null,
          board: 'jamb',
          subject_id: question.subject_id ?? null,
          subject_name: question.subject_name ?? null,
          source: 'exam' as const,
        }));
        const expiry = new Date(String(session.expiresAt || '')).getTime();
        sessionSeconds = Number.isFinite(expiry) ? Math.max(1, Math.ceil((expiry - Date.now()) / 1000)) : jambDurationMinutes * 60;
      } else {
        loaded = await loadExamQuestions();
      }
      if (!loaded.length) throw new Error('No graded questions are available for this selection yet.');
      setQuestions(loaded);
      setAnswers({});
      setFlagged(new Set());
      setIndex(0);
      setGrade(null);
      setSecondsLeft(sessionSeconds ?? (isTimedSession ? loaded.length * 60 : 0));
      setStartedAt(Date.now());
      setPhase('exam');
    } catch (err: any) {
      setError(err?.message || 'Unable to start this CBT');
    } finally {
      setLoading(false);
    }
  }

  async function explainPastQuestion(questionId: string) {
    if (!token || mode !== 'exam' || explainingQuestionId) return;
    setExplainingQuestionId(questionId);
    setError(null);
    try {
      const result = await fetchPastQuestionExplanation(questionId, token);
      setExplanationOverrides(previous => ({ ...previous, [questionId]: result.explanation }));
    } catch (err: any) {
      setError(err?.message || 'Unable to generate this explanation');
    } finally {
      setExplainingQuestionId(null);
    }
  }

  const lockedExternalExperience = experience !== 'legacy' && experience !== 'class';
  const pageTitle = experience === 'jamb-past' ? 'JAMB Past Questions'
    : experience === 'jamb-cbt' ? 'JAMB CBT Examination'
    : experience === 'school-past' ? `${examConfig.label} Past Questions`
    : experience === 'school-cbt' ? `${examConfig.label} Timed CBT`
    : experience === 'class' ? 'Class Practice'
    : 'Past Questions CBT';
  const pageDescription = experience === 'jamb-past'
    ? 'Choose one JAMB subject and revise verified past questions without a countdown timer.'
    : experience === 'jamb-cbt'
      ? 'Choose exactly four JAMB subjects for a timed CBT simulation.'
      : experience === 'school-past'
        ? `Study verified ${examConfig.label} past questions one subject at a time.`
        : experience === 'school-cbt'
          ? `Run a timed ${examConfig.label} CBT session for one subject.`
          : experience === 'class'
            ? 'Practise directly from the lessons in your selected class and subject.'
            : 'Choose the practice source and subjects first.';

  async function submitCbt(automatic = false) {
    if (!token || !questions.length || submitting) return;
    if (!automatic && !window.confirm(`Submit this CBT? ${questions.length - answeredCount} question(s) are unanswered.`)) return;
    setSubmitting(true);
    setError(null);
    try {
      let result: GradeResult;
      if (mode === 'class') {
        if (!classPracticeSessionId) throw new Error('Class practice session is missing. Please start a new set.');
        const response = await fetch(`${learnerApiConfig.baseUrl}/class-practice/${classPracticeSessionId}/grade`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            answers: questions.map(question => ({ questionId: question.id, answer: answers[question.id] || '' })),
          }),
        });
        const payload = await handleApiResponse<any>(response);
        result = payload.data.result as GradeResult;
      } else if (isJambCbt) {
        if (!jambSessionId) throw new Error('JAMB CBT session is missing. Please start a new exam.');
        result = await gradeJambCbtSession(
          token,
          jambSessionId,
          questions.map(question => ({ questionId: question.id, answer: answers[question.id] || '' })),
        ) as GradeResult;
      } else {
        const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions/grade`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            board: selectedExam,
            ...(selectedYear ? { year: Number(selectedYear) } : {}),
            timeSpentSeconds: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0,
            answers: questions.map(question => ({ questionId: question.id, answer: answers[question.id] || '' })),
          }),
        });
        const payload = await handleApiResponse<any>(response);
        result = payload.data.result as GradeResult;
      }
      setGrade(result);
      setPhase('results');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit this CBT');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'setup') {
    return <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">{pageTitle}</h1><p className="mt-1 text-slate-500 dark:text-slate-400">{pageDescription}</p></div><div className="flex flex-wrap gap-2">{mode === 'exam' && <Link href="/dashboard/past-questions/analytics" className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"><BarChart3 className="h-4 w-4"/>Performance</Link>}<Link href={selectedExam === 'jamb' ? '/dashboard/jamb' : '/dashboard/exams'} className="inline-flex items-center justify-center rounded-xl border border-[#151A3A] px-4 py-2 text-sm font-semibold text-[#151A3A] transition hover:bg-[#151A3A] hover:text-white dark:border-slate-300 dark:text-slate-100">Back to hub</Link></div></header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {experience === 'legacy' && <div className="flex w-fit gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
        <button onClick={() => chooseMode('class')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'class' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><GraduationCapIcon className="mr-1.5 inline h-4 w-4"/>Class Practice</button>
        <button onClick={() => chooseMode('exam')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'exam' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><BookOpenIcon className="mr-1.5 inline h-4 w-4"/>External Exams</button>
      </div>}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        {mode === 'class' ? <>
          <p className="mb-3 text-sm font-semibold">1. Choose class</p>
          <div className="flex flex-wrap gap-2">{classes.map(item => <button key={item.id} onClick={() => { setSelectedClass(item.id); setSelectedSubjects([]); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${selectedClass === item.id ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{item.name}</button>)}</div>
        </> : <>
          {lockedExternalExperience ? <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-950/30"><p className="text-xs font-bold uppercase tracking-wide text-brand-700">Examination</p><p className="mt-1 text-lg font-extrabold text-[#151A3A] dark:text-white">{examConfig.label}</p></div> : <><p className="mb-3 text-sm font-semibold">1. Choose examination</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{EXAMS.map(item => <button key={item.code} onClick={() => { setSelectedExam(item.code); setSelectedSubjects([]); setSelectedYear(''); }} className={`rounded-xl border p-3 text-sm font-bold ${selectedExam === item.code ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{item.label}</button>)}</div></>}
        </>}
        {(mode === 'exam' || selectedClass) && <div className="mt-6">
          {isJambCbt && <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 dark:border-brand-900 dark:bg-brand-950/20">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex-1 text-sm font-semibold text-[#151A3A] dark:text-white">
                Choose course (optional)
                <select value={selectedCoursePresetId} onChange={event => applyCoursePreset(event.target.value)} disabled={jambPresetLoading} className="mt-2 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white">
                  <option value="">I will choose my 4 subjects manually</option>
                  {jambPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.courseName}{preset.readyForTenEach ? '' : ' · bank still expanding'}</option>)}
                </select>
              </label>
              {jambPresetLoading && <span className="inline-flex items-center gap-2 pb-3 text-xs font-semibold text-slate-500"><ClockIcon className="h-4 w-4 animate-spin"/>Loading presets…</span>}
            </div>
            {selectedPreset && <div className="mt-4">
              <p className="text-sm font-bold text-[#151A3A] dark:text-white">{selectedPreset.courseName} subject combination</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{selectedPreset.subjects.map(subject => <div key={subject.id} className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-[#151A3A]"><span className="font-semibold">{subject.name}</span><span className={`ml-2 text-xs ${subject.availableQuestions >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>{subject.availableQuestions} verified questions</span></div>)}</div>
              <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{selectedPreset.notes}</p>
              <a href={selectedPreset.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-brand-700 underline">Verify your institution/course on JAMB IBASS</a>
            </div>}
          </div>}
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">2. {mode === 'exam' ? (isJambCbt ? 'Select exactly 4 subjects (English required)' : singleSubjectExternal ? 'Select one subject' : `Select subjects (up to ${examConfig.max})`) : 'Select subject'}</p><span className="text-xs font-bold text-slate-500">{selectedSubjects.length} selected</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{visibleSubjects.map(subject => {
            const selected = selectedSubjects.includes(subject.id);
            const subjectLimit = isJambCbt ? 4 : singleSubjectExternal ? 1 : examConfig.max;
            const jambAvailable = Number(jambSubjectAvailability[subject.id] || 0);
            const disabled = (mode === 'exam' && !selected && selectedSubjects.length >= subjectLimit) || (isJambCbt && jambAvailable < 1);
            return <button key={subject.id} disabled={disabled} onClick={() => toggleSubject(subject.id)} className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${selected ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-[#151A3A]/40 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'} disabled:cursor-not-allowed disabled:opacity-40`}><span className="mr-2">{selected ? '✓' : '○'}</span>{subject.name}{isJambCbt && <span className={`ml-2 block text-[11px] font-medium ${selected ? 'text-white/70' : jambAvailable >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>{jambAvailable} verified JAMB questions</span>}</button>;
          })}</div>
          {isJambCbt && <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">JAMB / UTME CBT requires exactly 4 subjects including Use of English. Question limits shown above come only from verified JAMB past questions.</p>}
          {mode === 'exam' && selectedSubjects.length > 0 && availableYears.length > 0 && <label className="mt-5 block text-sm font-medium">3. Year (optional)<select value={selectedYear} onChange={event => setSelectedYear(event.target.value)} className="ml-2 rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">All available years</option>{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>}
        </div>}
        <button onClick={continueToCount} disabled={!selectionValid} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#151A3A] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{isJambCbt ? 'Configure questions & time' : 'Continue to question count'} <PlayIcon className="h-4 w-4"/></button>
      </section>
      <p className="text-xs text-slate-500">Questions are served from the structured Supabase question bank; source PDFs are never exposed to learners.</p>
    </div>;
  }

  if (phase === 'count' && isJambCbt) {
    return <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => { setError(null); setPhase('setup'); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4"/>Back to subject selection</button>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">JAMB CBT configuration</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#151A3A] dark:text-white">Set questions per subject</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a different number for each subject. The combined paper will be randomized and use only verified JAMB past questions.</p>

        {selectedPreset && <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-950/30">
          <b className="text-[#151A3A] dark:text-white">{selectedPreset.courseName}</b>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{selectedPreset.notes}</p>
        </div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="mt-6 space-y-3">
          {selectedJambPlan.map(item => {
            const shortage = item.available < item.count;
            return <div key={item.subjectId} className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center ${shortage ? 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/10' : 'border-stone-200 dark:border-slate-700'}`}>
              <div>
                <p className="font-bold text-[#151A3A] dark:text-white">{item.name}</p>
                <p className={`mt-1 text-xs font-semibold ${item.available >= 10 ? 'text-emerald-600' : 'text-amber-600'}`}>{item.available} verified JAMB questions currently available</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[5,10,20,30].map(value => <button key={value} type="button" disabled={value > item.available} onClick={() => setJambSubjectCount(item.subjectId, value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${item.count === value ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-white text-slate-600'} disabled:cursor-not-allowed disabled:opacity-30`}>{value}</button>)}
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Custom
                  <input type="number" min={1} max={Math.max(1,item.available)} value={item.count || ''} disabled={item.available < 1} onChange={event => setJambSubjectCount(item.subjectId, Number(event.target.value))} className="w-20 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-[#151A3A] dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"/>
                </label>
              </div>
            </div>;
          })}
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 p-4 dark:border-slate-700">
            <p className="text-sm font-bold text-[#151A3A] dark:text-white">Total exam time</p>
            <p className="mt-1 text-xs text-slate-500">One countdown applies to the full combined paper.</p>
            <div className="mt-3 flex flex-wrap gap-2">{[30,40,60,90,120].map(minutes => <button key={minutes} type="button" onClick={() => setJambDurationMinutes(minutes)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${jambDurationMinutes === minutes ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-600'}`}>{minutes} min</button>)}</div>
            <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">Custom minutes
              <input type="number" min={5} max={240} value={jambDurationMinutes} onChange={event => setJambDurationMinutes(Math.max(5, Math.min(240, Number(event.target.value) || 5)))} className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold text-[#151A3A] dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"/>
            </label>
          </div>
          <div className="rounded-xl bg-[#151A3A] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Combined paper</p>
            <p className="mt-2 text-4xl font-extrabold">{jambQuestionTotal}</p>
            <p className="text-sm text-slate-300">questions across 4 subjects</p>
            <p className="mt-4 text-lg font-bold">{jambDurationMinutes} minutes total</p>
          </div>
        </div>

        {!jambPlanValid && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          One or more subjects does not yet have enough verified JAMB questions for the count selected. Reduce that subject count or use a combination with sufficient verified questions while the source bank is being expanded.
        </div>}
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <b>Strict JAMB mode:</b> this scored CBT uses only active JAMB past-question records with verified answer keys. Lesson-generated or generic practice questions are excluded.
        </div>

        <button onClick={() => void startCbt()} disabled={loading || !jambPlanValid} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#151A3A] py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{loading ? <><ClockIcon className="h-4 w-4 animate-spin"/>Building randomized JAMB paper…</> : <><PlayIcon className="h-4 w-4"/>Start {jambQuestionTotal}-question JAMB CBT</>}</button>
      </section>
    </div>;
  }

  if (phase === 'count') {
    return <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => { setError(null); setPhase('setup'); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4"/>Back to selection</button>
      <section className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">{isTimedSession ? 'CBT setup' : 'Past questions setup'}</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#151A3A] dark:text-white">Choose question count</h1>
        <p className="mt-2 text-slate-500">{mode === 'exam' ? selectedExam.toUpperCase() : classes.find(item => item.id === selectedClass)?.name} · {selectedNames.join(' • ')}{selectedYear ? ` · ${selectedYear}` : ''}</p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">{COUNTS.map(count => <button key={count} onClick={() => setQuestionCount(count)} className={`rounded-xl border p-4 text-center font-bold transition ${questionCount === count ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white'}`}>{count}<span className="mt-1 block text-xs font-normal opacity-70">questions</span></button>)}</div>
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-slate-700 dark:bg-brand-950/30 dark:text-slate-200">{isTimedSession ? <><b>Timing:</b> 1 minute per loaded question. Answers are graded only when you submit.</> : <><b>Study mode:</b> No countdown timer. Work at your own pace, then submit for grading and review.</>}</div>
        <button onClick={() => void startCbt()} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#151A3A] py-3.5 font-semibold text-white disabled:opacity-50">{loading ? <><ClockIcon className="h-4 w-4 animate-spin"/>Loading questions…</> : <><PlayIcon className="h-4 w-4"/>{isTimedSession ? 'Start CBT' : 'Start Past Questions'}</>}</button>
      </section>
    </div>;
  }

  if (phase === 'results' && grade) {
    return <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#151A3A] to-[#30406f] p-7 text-white shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl font-extrabold">{Number(grade.percentage || 0)}%</div><div><TrophyIcon className="h-8 w-8 text-amber-300"/><h1 className="mt-2 text-2xl font-extrabold">CBT Results</h1><p className="mt-1 text-slate-200">{selectedNames.join(' • ')}</p><div className="mt-4 flex flex-wrap gap-5 text-sm"><span><b className="text-xl">{grade.correct}</b> correct</span><span><b className="text-xl">{grade.incorrect}</b> wrong</span><span><b className="text-xl">{grade.unanswered}</b> skipped</span></div></div></div>
      </section>
      {isJambCbt && grade.subjectBreakdown?.length ? <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{grade.subjectBreakdown.map(subject => <div key={subject.subjectId} className="rounded-xl border border-stone-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{subject.subjectName}</p><p className="mt-2 text-2xl font-extrabold text-[#151A3A] dark:text-white">{subject.percentage}%</p><p className="mt-1 text-xs text-slate-500">{subject.correct}/{subject.total} correct · {subject.answered} answered</p></div>)}</section> : null}
      <div className="flex flex-wrap gap-3"><button onClick={() => { resetSession(); setPhase('count'); }} className="rounded-xl bg-[#151A3A] px-5 py-3 font-semibold text-white">Try another set</button><button onClick={() => { resetSession(); setPhase('setup'); }} className="rounded-xl border border-stone-300 px-5 py-3 font-semibold">Change selection</button>{mode === 'exam' && <Link href="/dashboard/past-questions/analytics" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-5 py-3 font-semibold text-brand-700"><BarChart3 className="h-4 w-4"/>View performance</Link>}</div>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">Answer review</h2><div className="mt-5 space-y-4">{questions.map((question, position) => {
        const row = resultMap.get(question.id);
        const correctAnswer = scalar(row?.correct_answer);
        return <article key={question.id} className="rounded-xl border border-stone-200 p-4 dark:border-slate-700"><div className="flex gap-3">{row?.is_correct ? <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"/> : <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600"/>}<div><p className="font-semibold">{position + 1}. {question.question_text}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your answer: <b>{answers[question.id] || 'Not answered'}</b></p>{!row?.is_correct && <p className="mt-1 text-sm text-emerald-700">Correct answer: <b>{correctAnswer || '—'}</b></p>}{(explanationOverrides[question.id] || row?.explanation) ? <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-950/30"><b>Explanation:</b> {explanationOverrides[question.id] || row?.explanation}</div> : mode === 'exam' && <button type="button" onClick={() => void explainPastQuestion(question.id)} disabled={explainingQuestionId === question.id} className="mt-3 rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">{explainingQuestionId === question.id ? 'Explaining…' : 'Explain this answer'}</button>}</div></div></article>;
      })}</div></section>
    </div>;
  }

  if (!current) return <div className="py-16 text-center text-slate-500">No question available.</div>;

  return <div className="space-y-5">
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#1b2045]/95"><div><b className="text-[#151A3A] dark:text-white">{pageTitle}</b><p className="text-xs text-slate-500">Answered {answeredCount}/{questions.length} · {selectedNames.join(' • ')}</p></div>{isTimedSession ? <div className="rounded-xl bg-brand-50 px-4 py-2 font-mono text-lg font-bold text-[#151A3A] dark:bg-brand-950/30 dark:text-white">{formatTime(secondsLeft)}</div> : <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Untimed study</div>}</div>
    <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><p className="font-semibold">Questions</p><div className="mt-3 grid grid-cols-5 gap-2">{questions.map((question, position) => <button key={question.id} onClick={() => setIndex(position)} className={`rounded-lg border p-2 text-xs font-semibold ${position === index ? 'border-[#151A3A] bg-[#151A3A] text-white' : answers[question.id] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white dark:border-slate-700 dark:bg-[#151A3A]'}`}>{position + 1}{flagged.has(question.id) ? '⚑' : ''}</button>)}</div></aside>
      <main className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-500">Question {index + 1} of {questions.length}</span><button onClick={() => setFlagged(previous => { const next = new Set(previous); next.has(current.id) ? next.delete(current.id) : next.add(current.id); return next; })} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"><FlagIcon className="h-3.5 w-3.5"/>{flagged.has(current.id) ? 'Flagged' : 'Flag'}</button></div>
        <div className="mt-5 rounded-xl bg-stone-50 p-5 dark:bg-[#151A3A]"><div className="mb-2 flex flex-wrap gap-2">{current.subject_name && <span className="rounded-full bg-[#151A3A] px-2 py-1 text-xs font-bold text-white">{current.subject_name}</span>}{current.year && <span className="rounded-full bg-brand-100 px-2 py-1 text-xs">{current.year}</span>}{current.difficulty && <span className="rounded-full bg-stone-200 px-2 py-1 text-xs dark:bg-slate-700">{current.difficulty}</span>}</div><p className="font-semibold leading-7 text-slate-900 dark:text-white">{current.question_text}</p>{current.question_image_url && <img src={current.question_image_url} alt="Question illustration" className="mt-4 max-h-72 rounded-lg object-contain"/>}</div>
        <div className="mt-4 space-y-2">{currentOptions.map(option => <button key={option.id} onClick={() => setAnswers(previous => ({ ...previous, [current.id]: option.id }))} className={`w-full rounded-xl border px-4 py-3 text-left transition ${answers[current.id] === option.id ? 'border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/30 dark:text-brand-100' : 'border-stone-200 bg-white text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}><span className="mr-2 font-bold">{option.id}.</span>{option.text}</button>)}</div>
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-4 dark:border-slate-700"><button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button><div className="flex gap-2"><button onClick={() => setIndex(value => Math.min(questions.length - 1, value + 1))} disabled={index === questions.length - 1} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Next</button><button onClick={() => void submitCbt(false)} disabled={submitting} className="rounded-lg bg-[#151A3A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit CBT'}</button></div></div>
      </main>
    </div>
  </div>;
}
