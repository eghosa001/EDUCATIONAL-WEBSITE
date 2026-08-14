'use client';

import { useState } from 'react';
import { BuildingIcon, UsersIcon, SchoolIcon, TrendingUpIcon } from 'lucide-react';

const schools = [
  { id: '1', name: 'Federal Government College', location: 'Abuja', students: 1250, teachers: 45, type: 'Government' },
  { id: '2', name: 'Grace International School', location: 'Lagos', students: 890, teachers: 32, type: 'Private' },
  { id: '3', name: 'Queen\'s Secondary School', location: 'Port Harcourt', students: 670, teachers: 28, type: 'Missionary' },
  { id: '4', name: 'National College', location: 'Kano', students: 1100, teachers: 40, type: 'Government' },
];

export default function SchoolPage() {
  const [registeredSchools] = useState(schools.slice(0, 2));
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School</h1>
          <p className="text-gray-500 mt-1">Your school information and management</p>
        </div>
        <button onClick={() => setShowRegister(!showRegister)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          {showRegister ? 'Cancel' : 'Register School'}
        </button>
      </div>

      {showRegister && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Register Your School</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="School Name" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="School Code" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
              <option>School Type</option>
              <option>Government</option>
              <option>Private</option>
              <option>Missionary</option>
            </select>
            <input placeholder="State" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Submit Registration</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: '2,140', icon: UsersIcon, color: 'blue' },
          { label: 'Total Teachers', value: '77', icon: TrendingUpIcon, color: 'green' },
          { label: 'Schools', value: '2', icon: SchoolIcon, color: 'purple' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Schools</h2>
        </div>
        {registeredSchools.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No schools registered yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {registeredSchools.map(school => (
              <div key={school.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BuildingIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-500">{school.location} · {school.type}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{school.students} students</p>
                  <p>{school.teachers} teachers</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
