'use client';

import { BookOpenIcon, FileTextIcon, VideoIcon } from 'lucide-react';

const typeIcons: Record<string, typeof BookOpenIcon> = {
  pdf: FileTextIcon,
  video: VideoIcon,
  image: BookOpenIcon,
};

export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Downloads</h1>
        <p className="text-gray-500 mt-1">Your saved study materials</p>
      </div>

      <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
        <FileTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="font-medium">No downloads yet</p>
        <p className="text-sm mt-1">Downloaded materials will appear here</p>
      </div>
    </div>
  );
}
