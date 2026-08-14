'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Users, TrendingUp, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    teachers: 0,
    schools: 0,
    courses: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setStats({
        totalUsers: 125430,
        activeStudents: 21430,
        teachers: 3420,
        schools: 856,
        courses: 2845,
        revenue: 4520000,
      });
      setLoading(false);
    }, 500);
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'blue', change: '+12%' },
    { label: 'Active Students', value: stats.activeStudents.toLocaleString(), icon: GraduationCap, color: 'green', change: '+8%' },
    { label: 'Teachers', value: stats.teachers.toLocaleString(), icon: TrendingUp, color: 'purple', change: '+5%' },
    { label: 'Schools', value: stats.schools.toString(), icon: ShoppingCart, color: 'orange', change: '+3%' },
    { label: 'Courses', value: stats.courses.toLocaleString(), icon: GraduationCap, color: 'blue', change: '+15%' },
    { label: 'Monthly Revenue', value: `₦${(stats.revenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'green', change: '+22%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and analytics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'New student registered', time: '2 minutes ago', user: 'Emeka Nnamdi' },
            { action: 'Course completed', time: '15 minutes ago', user: 'Fatima Abubakar' },
            { action: 'Exam submitted', time: '32 minutes ago', user: 'Chidi Osei' },
            { action: 'Subscription renewed', time: '1 hour ago', user: 'Aisha Mohammed' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600 flex-1">{item.action}</span>
              <span className="text-sm text-gray-400">{item.user}</span>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
