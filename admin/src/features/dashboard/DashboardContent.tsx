'use client';

import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Activity,
  Layers,
  ClipboardCheck,
  FileQuestion,
  FileText,
  CreditCard,
  Banknote,
  TrendingUp,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import PageHeader from '@/components/ui/PageHeader';
import Flash from '@/components/ui/Flash';
import { formatNumber, formatCompactNaira, timeAgo, titleCase } from '@/utils/format';
import { useDashboard } from './hooks';

export default function DashboardContent() {
  const { data, loading, error, reload } = useDashboard();

  if (loading) return <Spinner label="Loading dashboard..." />;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Platform overview and analytics" />
        <Flash tone="error" message={error} />
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;
  const statCards = [
    { label: 'Total Students', value: formatNumber(stats.totalStudents), icon: GraduationCap, tone: 'blue' as const, change: 'active' },
    { label: 'Teachers', value: formatNumber(stats.totalTeachers), icon: Users, tone: 'purple' as const, change: 'active' },
    { label: 'Parents', value: formatNumber(stats.totalParents), icon: Users, tone: 'orange' as const },
    { label: 'Schools', value: formatNumber(stats.totalSchools), icon: Building2, tone: 'green' as const },
    { label: 'Active Today', value: formatNumber(stats.activeToday), icon: Activity, tone: 'red' as const },
    { label: 'Subscribers', value: formatNumber(stats.subscribers), icon: CreditCard, tone: 'indigo' as const },
    { label: 'Courses', value: formatNumber(stats.courses), icon: BookOpen, tone: 'blue' as const },
    { label: 'Lessons', value: formatNumber(stats.lessons), icon: Layers, tone: 'green' as const },
    { label: 'Questions', value: formatNumber(stats.questions), icon: FileQuestion, tone: 'yellow' as const },
    { label: 'Exams', value: formatNumber(stats.exams), icon: ClipboardCheck, tone: 'purple' as const },
    { label: 'Monthly Revenue', value: formatCompactNaira(stats.monthlyRevenue), icon: Banknote, tone: 'green' as const },
  ];

  const pendingTotal = data.pendingContent.coursesPendingReview + data.pendingContent.lessonsUnpublished;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and analytics"
        actions={
          <button onClick={reload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Refresh
          </button>
        }
      />

      {error && <Flash tone="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} change={s.change} changeTone="neutral" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Recent Activity"
          description="Latest user registrations"
          icon={Activity}
          className="lg:col-span-2"
          action={
            <button onClick={reload} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Refresh
            </button>
          }
        >
          <div className="space-y-3 -mx-1">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                  {(user.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{titleCase(user.role)}</span>
                <span className="text-xs text-gray-400">{timeAgo(user.createdAt)}</span>
              </div>
            ))}
            {data.recentUsers.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">No users yet</p>}
          </div>
        </Card>

        <Card title="Pending Content" description="Awaiting your review" icon={FileText}>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-800">Course reviews</p>
                <p className="text-xs text-yellow-600">Status: pending_review</p>
              </div>
              <span className="text-2xl font-bold text-yellow-700">{data.pendingContent.coursesPendingReview}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Unpublished lessons</p>
                <p className="text-xs text-blue-600">Status: draft</p>
              </div>
              <span className="text-2xl font-bold text-blue-700">{data.pendingContent.lessonsUnpublished}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-indigo-800">Total pending</p>
                <p className="text-xs text-indigo-600">Across all content types</p>
              </div>
              <span className="text-2xl font-bold text-indigo-700">{pendingTotal}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Popular Subjects" description="By course enrollments" icon={TrendingUp}>
        {data.popularSubjects.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No enrollments yet</p>
        ) : (
          <div className="space-y-4">
            {data.popularSubjects.map((subject, index) => {
              const max = Math.max(...data.popularSubjects.map((s) => s.enrollments), 1);
              return (
                <div key={subject.code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">
                      <span className="text-gray-400 mr-2">{index + 1}.</span>
                      {subject.name}
                    </span>
                    <span className="text-sm text-gray-500">{formatNumber(subject.enrollments)} enrollments</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${(subject.enrollments / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
