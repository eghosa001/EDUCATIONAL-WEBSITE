'use client';

import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import PageHeader from '@/components/ui/PageHeader';
import { useAnalytics } from './hooks';
import { Users, TrendingUp, GraduationCap, BookOpen, Award, Clock } from 'lucide-react';

export default function AnalyticsManager({ dateRange = '30d' }: { dateRange?: string }) {
  const { metrics, revenue, topCourses, loading, error } = useAnalytics(dateRange);

  if (loading) return <Spinner label="Loading analytics..." />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="New Users" value={metrics?.newUsers ?? 0} icon={Users} color="blue" />
        <StatCard label="Exams Taken" value={metrics?.examsTaken ?? 0} icon={Award} color="purple" />
        <StatCard label="Enrollments" value={metrics?.enrollments ?? 0} icon={GraduationCap} color="green" />
        <StatCard label="Revenue" value={`₦${(metrics?.revenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Performing Courses" description="By enrollment count" icon={BookOpen}>
          {topCourses.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No course data available</p>
          ) : (
            <div className="space-y-4">
              {topCourses.slice(0, 5).map((course, i) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.title}</p>
                      <p className="text-xs text-gray-500">{Math.round(course.avg_progress)}% avg progress</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{course.enrollment_count} students</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Revenue Trend" description="Last 12 months" icon={TrendingUp}>
          {revenue.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No revenue data available</p>
          ) : (
            <div className="space-y-3">
              {revenue.slice(0, 6).map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{row.period}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{row.transaction_count} txns</span>
                    <span className="text-sm font-semibold text-green-600">₦{Number(row.total_revenue).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Engagement Overview" description="Key platform metrics" icon={Clock}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{metrics?.enrollments ?? 0}</p>
            <p className="text-sm text-blue-600 mt-1">Total Enrollments</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{metrics?.examsTaken ?? 0}</p>
            <p className="text-sm text-green-600 mt-1">Exams Completed</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">{metrics?.transactions ?? 0}</p>
            <p className="text-sm text-purple-600 mt-1">Transactions</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-700">₦{(metrics?.revenue ?? 0).toLocaleString()}</p>
            <p className="text-sm text-indigo-600 mt-1">Total Revenue</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color] || 'bg-gray-100'} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
