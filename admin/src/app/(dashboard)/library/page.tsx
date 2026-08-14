'use client';

import { useState } from 'react';

export default function LibraryAdminPage() {
  const [resources] = useState([
    { id: '1', title: 'Nigerian History Textbook', type: 'PDF', category: 'History', downloads: 342 },
    { id: '2', title: 'WAEC Physics Past Questions', type: 'PDF', category: 'Physics', downloads: 1205 },
    { id: '3', title: 'Introduction to Programming Video', type: 'Video', category: 'CS', downloads: 567 },
  ]);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Resource</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Add Resource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Title" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
              <option>Resource Type</option><option>PDF</option><option>Video</option><option>Image</option>
            </select>
            <input placeholder="Category" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <input placeholder="File URL" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Upload</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Title', 'Type', 'Category', 'Downloads', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {resources.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.type}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.category}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.downloads}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
