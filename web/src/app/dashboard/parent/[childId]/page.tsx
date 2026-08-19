'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileDown,
  Printer,
  Clock,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  TrendingUp,
  Flame,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchParentChildren,
  fetchChildPerformance,
  fetchChildProgress,
  fetchChildCourses,
  fetchChildExams,
  fetchChildStudyTime,
  generateParentReport,
} from '@/services/api/parentService';
import { exportCsv } from '@/utils/exportCsv';

export default function ParentChildReportPage() {
  const params = useParams<{ childId: string }>();
  const childId = params?.childId;
  const { token } = useAuthStore();
  const [child, setChild] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [studyTime, setStudyTime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !childId) return;
    (async () => {
      try {
        const [childrenRes, perfRes, progressRes, coursesRes, examsRes, studyRes] = await Promise.all([
          fetchParentChildren(token),
          fetchChildPerformance(childId, token),
          fetchChildProgress(childId, token),
          fetchChildCourses(childId, 1, 100, token),
          fetchChildExams(childId, 1, 100, token),
          fetchChildStudyTime(childId, token),
        ]);
        const found = (childrenRes.children || []).find(c => c.userId === childId);
        setChild(found || null);
        setPerformance(perfRes.performance || null);
        setProgress(progressRes.progress || null);
        setCourses((coursesRes as any).data?.courses || (coursesRes as any).courses || (coursesRes as any).data || []);
        setExams((examsRes as any).data?.exams || (examsRes as any).exams || (examsRes as any).data || []);
        setStudyTime(studyRes.studyTime || []);
      } catch (err) {
        console.error('Failed to load child report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, childId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleExport = () => {
    const name = child ? `${child.firstName}-${child.lastName}` : 'child';
    exportCsv(`${name}-report-${new Date().toISOString().split('T')[0]}.csv`, [
      { metric: 'Study Time', value: formatTime(performance?.studyTimeSeconds ?? 0) },
      { metric: 'Courses Enrolled', value: performance?.coursesEnrolled ?? 0 },
      { metric: 'Courses Completed', value: performance?.coursesCompleted ?? 0 },
      { metric: 'Lessons Completed', value: performance?.lessonsCompleted ?? 0 },
      { metric: 'Exams Taken', value: performance?.examsTaken ?? 0 },
      { metric: 'Average Exam Score', value: `${(performance?.averageExamScore ?? 0).toFixed(0)}%` },
      { metric: 'Current Streak', value: `${performance?.currentStreak ?? 0} days` },
    ]);
    exportCsv('course-progress.csv', courses.map(c => ({
      course: c.title || '—',
      progress: `${c.progress_percentage ?? c.progressPercentage ?? 0}%`,
      lastAccessed: formatDate(c.last_accessed_at || c.lastAccessedAt),
    })));
    exportCsv('exam-results.csv', exams.map(e => ({
      exam: e.title || '—',
      date: formatDate(e.submitted_at || e.started_at || e.submittedAt || e.startedAt),
      percentage: e.percentage != null ? `${e.percentage}%` : '—',
      result: e.is_passed != null ? (e.is_passed ? 'Passed' : 'Failed') : '—',
    })));
  };

  const handleGenerateReport = async () => {
    if (!token || !childId) return;
    setGenerating(true);
    setMessage('');
    try {
      await generateParentReport(childId, 'progress', token);
      setMessage('Report generated. Check your parent dashboard for recent reports.');
    } catch (err: any) {
      setMessage(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading child report...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Study Time', value: formatTime(performance?.studyTimeSeconds ?? 0), icon: Clock, color: 'blue' },
    { label: 'Courses Enrolled', value: performance?.coursesEnrolled ?? 0, icon: BookOpen, color: 'purple' },
    { label: 'Courses Completed', value: performance?.coursesCompleted ?? 0, icon: CheckCircle, color: 'green' },
    { label: 'Lessons Completed', value: performance?.lessonsCompleted ?? 0, icon: FileText, color: 'indigo' },
    { label: 'Exams Taken', value: performance?.examsTaken ?? 0, icon: ClipboardCheck, color: 'orange' },
    { label: 'Avg Score', value: `${(performance?.averageExamScore ?? 0).toFixed(0)}%`, icon: TrendingUp, color: 'teal' },
    { label: 'Streak', value: `${performance?.currentStreak ?? 0}d`, icon: Flame, color: 'rose' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/parent" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {child ? `${child.firstName} ${child.lastName}` : 'Child Report'}
            </h1>
            <p className="text-gray-500 mt-1">Academic progress report</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {message && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{message}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overview summary */}
      {progress && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Learning Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-700">{progress.enrolledCourses ?? 0}</p>
              <p className="text-sm text-blue-600 mt-1">Courses</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">{progress.completedLessons ?? 0}</p>
              <p className="text-sm text-green-600 mt-1">Lessons Completed</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-700">{progress.averageCourseProgress ?? 0}%</p>
              <p className="text-sm text-purple-600 mt-1">Avg Course Progress</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-700">{progress.averageExamScore ?? 0}%</p>
              <p className="text-sm text-orange-600 mt-1">Avg Exam Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Course progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Course Progress</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No courses enrolled yet.</p>
        ) : (
          <div className="space-y-4">
            {courses.map(course => {
              const progressPct = course.progress_percentage ?? course.progressPercentage ?? 0;
              return (
                <div key={course.course_id || course.courseId || course.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{course.title || 'Course'}</p>
                    <span className={`text-sm font-semibold ${progressPct >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exam results */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Exam Results</h2>
        </div>
        {exams.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No exams taken yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                {['Exam', 'Date', 'Percentage', 'Result'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {exams.slice(0, 20).map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900 text-sm">{e.title || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(e.submitted_at || e.started_at || e.submittedAt || e.startedAt)}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{e.percentage != null ? `${e.percentage}%` : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.is_passed ? 'bg-green-100 text-green-700' : e.is_passed != null ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {e.is_passed ? 'Passed' : e.is_passed != null ? 'Failed' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Study time */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Study Time</h2>
        {studyTime.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No study activity recorded.</p>
        ) : (
          <div className="space-y-2">
            {studyTime.slice(-14).reverse().map(day => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500 flex-shrink-0">{formatDate(day.date)}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min((day.study_time_seconds || day.studyTimeSeconds || 0) / 3600 / 6 * 100, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm text-gray-500">{formatTime(day.study_time_seconds || day.studyTimeSeconds || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
