'use client';

import { useParams } from 'next/navigation';
import SchoolDetail from '@/features/schools/SchoolDetail';

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = (params?.id as string) ?? '';
  return <SchoolDetail id={schoolId} />;
}
