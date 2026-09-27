'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PastQuestionsLegacyBoardPage() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    const board = String(params?.board || '').toLowerCase();
    router.replace(`/dashboard/past-questions?board=${encodeURIComponent(board)}`);
  }, [params, router]);
  return <div className="flex min-h-[50vh] items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Opening interactive past questions…</div>;
}
