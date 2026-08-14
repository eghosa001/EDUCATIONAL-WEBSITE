'use client';

import { useParams } from 'next/navigation';
import { UsersIcon, TrendingUp, BookOpenIcon, CalendarIcon } from 'lucide-react';

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params?.id as string;

  const school = {
    id: schoolId,
    name: 'Federal Government College',
    code: 'FGC-ABJ',
    state: 'FCT Abuja',
    type: 'Government',
    students: 1250,
    teachers: 45,
    courses: 32,
    established: 1985,
    status: 'active',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
            {school.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
            <p className="text-gray-500">{school.code} · {school.state}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {school.status}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Edit School</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Manage</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Students', value: school.students.toLocaleString(), icon: UsersIcon, color: 'blue' },
          { label: 'Teachers', value: school.teachers.toString(), icon: TrendingUp, color: 'green' },
          { label: 'Courses', value: school.courses.toString(), icon: BookOpenIcon, color: 'purple' },
          { label: 'Established', value: school.established.toString(), icon: CalendarIcon, color: 'orange' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
