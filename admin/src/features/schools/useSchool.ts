'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchSchool,
  fetchSchoolStats,
  fetchSchoolClasses,
  fetchTimetables,
  fetchAttendance,
  fetchAttendanceStats,
  fetchFees,
  fetchFeeSummary,
  fetchResults,
  fetchResultSummary,
  updateSchool,
  type SchoolRow,
  type SchoolStats,
  type SchoolClass,
  type TimetableEntry,
  type AttendanceRecord,
  type AttendanceStats,
  type FeeRecord,
  type FeeSummary,
  type SchoolResult,
  type ResultSummary,
} from '@/services/api/schoolService';

export interface SchoolDetailData {
  school: SchoolRow | null;
  stats: SchoolStats | null;
  classes: SchoolClass[];
  timetables: TimetableEntry[];
  attendance: AttendanceRecord[];
  attendanceStats: AttendanceStats | null;
  fees: FeeRecord[];
  feeSummary: FeeSummary | null;
  results: SchoolResult[];
  resultSummary: ResultSummary | null;
  loading: boolean;
  error: string;
}

export function useSchool(id: string) {
  const { token } = useAdminAuthStore();
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [resultSummary, setResultSummary] = useState<ResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token || !id) return;
    setLoading(true);
    Promise.all([
      fetchSchool(token, id),
      fetchSchoolStats(token, id),
      fetchSchoolClasses(token, id, { page: 1, limit: 50 }),
      fetchTimetables(token, id, { page: 1, limit: 100 }),
      fetchAttendance(token, id, { page: 1, limit: 100 }),
      fetchAttendanceStats(token, id),
      fetchFees(token, id, { page: 1, limit: 50 }),
      fetchFeeSummary(token, id),
      fetchResults(token, id, { page: 1, limit: 50 }),
      fetchResultSummary(token, id),
    ])
      .then(([s, st, cls, tt, att, attStats, fee, feeSum, res, resSum]) => {
        setSchool(s.data);
        setStats(st.data);
        setClasses(cls.data.data || []);
        setTimetables(tt.data.data || []);
        setAttendance(att.data.data || []);
        setAttendanceStats(attStats.data);
        setFees(fee.data.data || []);
        setFeeSummary(feeSum.data);
        setResults(res.data.data || []);
        setResultSummary(resSum.data);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load school'))
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token) return;
      await updateSchool(token, id, data);
      await load();
    },
    [token, id, load]
  );

  return {
    school,
    stats,
    classes,
    timetables,
    attendance,
    attendanceStats,
    fees,
    feeSummary,
    results,
    resultSummary,
    loading,
    error,
    reload: load,
    save,
  };
}
