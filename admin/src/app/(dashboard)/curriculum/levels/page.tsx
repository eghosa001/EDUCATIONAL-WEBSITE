'use client';

import { useState } from 'react';

const levels = [
  { code: 'P1', name: 'Primary 1', order: 1 },
  { code: 'P2', name: 'Primary 2', order: 2 },
  { code: 'P3', name: 'Primary 3', order: 3 },
  { code: 'P4', name: 'Primary 4', order: 4 },
  { code: 'P5', name: 'Primary 5', order: 5 },
  { code: 'P6', name: 'Primary 6', order: 6 },
  { code: 'JSS1', name: 'Junior Secondary 1', order: 7 },
  { code: 'JSS2', name: 'Junior Secondary 2', order: 8 },
  { code: 'JSS3', name: 'Junior Secondary 3', order: 9 },
  { code: 'SSS1', name: 'Senior Secondary 1', order: 10 },
  { code: 'SSS2', name: 'Senior Secondary 2', order: 11 },
  { code: 'SSS3', name: 'Senior Secondary 3', order: 12 },
];

export default function CurriculumLevelsPage() {
  const [items, setItems] = useState(levels);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSave = () => {
    if (editing) {
      setItems(prev => prev.map(i => i.code === editing ? { ...i, name: editValue } : i));
      setEditing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Education Levels</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Level</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Order', 'Code', 'Name', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.code} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{item.order}</td>
                <td className="px-4 py-3 font-mono text-sm text-gray-600">{item.code}</td>
                <td className="px-4 py-3">
                  {editing === item.code ? (
                    <div className="flex gap-2">
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm outline-none" autoFocus onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} />
                      <button onClick={handleSave} className="text-sm text-green-600">✓</button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-900">{item.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditing(item.code); setEditValue(item.name); }} className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button>
                  <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
