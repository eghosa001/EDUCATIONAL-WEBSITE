'use client';

import { useState } from 'react';

export default function TeachersUsersPage() {
  const [teachers] = useState([
    { id: '1', name: 'Mr. Adeyemi', subject: 'Biology', courses: 3, verified: true, rating: 4.8 },
    { id: '2', name: 'Mrs. Okonkwo', subject: 'Mathematics', courses: 2, verified: true, rating: 4.9 },
    { id: '3', name: 'Mr. Bello', subject: 'English', courses: 4, verified: false, rating: 4.6 },
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teacher Accounts</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Name', 'Subject', 'Courses', 'Verified', 'Rating', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.subject}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.courses}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.verified ? 'Yes' : 'No'}</span></td>
                <td className="px-4 py-3 text-sm text-yellow-600 font-medium">★ {t.rating}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">View</button><button className="text-sm text-red-600 hover:text-red-700">Suspend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
