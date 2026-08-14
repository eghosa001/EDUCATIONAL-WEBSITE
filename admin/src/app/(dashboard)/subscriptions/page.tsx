'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const subscriptionData = [
  { name: 'Free', value: 45000, color: '#94A3B8' },
  { name: 'Student Basic', value: 12000, color: '#3B82F6' },
  { name: 'Student Premium', value: 8500, color: '#10B981' },
  { name: 'Parent', value: 3200, color: '#8B5CF6' },
  { name: 'Teacher', value: 2100, color: '#F59E0B' },
  { name: 'School', value: 850, color: '#EF4444' },
];

const monthlyData = [
  { month: 'Jan', subscribers: 5200, revenue: 2600000 },
  { month: 'Feb', subscribers: 5800, revenue: 3100000 },
  { month: 'Mar', subscribers: 6500, revenue: 3800000 },
  { month: 'Apr', subscribers: 7200, revenue: 4500000 },
  { month: 'May', subscribers: 8100, revenue: 5200000 },
  { month: 'Jun', subscribers: 9400, revenue: 6100000 },
];

export default function SubscriptionsPage() {
  const totalSubscribers = subscriptionData.reduce((sum, s) => sum + s.value, 0);
  const monthlyRevenue = monthlyData[monthlyData.length - 1].revenue;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Subs', value: totalSubscribers.toLocaleString(), change: '+12%' },
          { label: 'Monthly Rev', value: `₦${(monthlyRevenue / 1000000).toFixed(1)}M`, change: '+22%' },
          { label: 'Churn Rate', value: '3.2%', change: '-0.5%' },
          { label: 'ARPU', value: '₦1,850', change: '+8%' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-green-600 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Subscription Plans</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {subscriptionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-4">
            {subscriptionData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-gray-600">{s.name}: {s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
