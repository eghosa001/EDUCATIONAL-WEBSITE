'use client';

import { BookOpenIcon, FileTextIcon, VideoIcon, ImageIcon } from 'lucide-react';

const resources = [
  { id: '1', title: 'Cell Biology Notes', type: 'pdf', size: '2.4 MB' },
  { id: '2', title: 'Organelle Diagram', type: 'image', size: '1.1 MB' },
  { id: '3', title: 'Video Lecture - Introduction', type: 'video', size: '156 MB' },
  { id: '4', title: 'Practice Questions', type: 'pdf', size: '850 KB' },
];

const typeIcons = { pdf: FileTextIcon, image: ImageIcon, video: VideoIcon };

export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Downloads</h1>
        <p className="text-gray-500 mt-1">Your saved study materials</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {resources.map((res) => {
            const Icon = typeIcons[res.type as keyof typeof typeIcons] || FileTextIcon;
            return (
              <div key={res.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{res.title}</p>
                  <p className="text-xs text-gray-400 uppercase">{res.type} · {res.size}</p>
                </div>
                <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                  Download
                </button>
              </div>
            );
          })}
        </div>
        {resources.length === 0 && (
          <div className="text-center py-12 text-gray-500">No downloads yet</div>
        )}
      </div>
    </div>
  );
}
