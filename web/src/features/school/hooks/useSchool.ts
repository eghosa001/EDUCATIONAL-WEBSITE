import { useState, useCallback } from 'react';

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  subject: string;
}

export interface SchoolTimetable {
  id: string;
  classId: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

export interface SchoolAttendance {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export function useSchoolClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/schools/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      setClasses(data.data);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { classes, isLoading, fetchClasses };
}

export function useSchoolTimetable() {
  const [timetable, setTimetable] = useState<SchoolTimetable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const fetchTimetable = useCallback(async (classId?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schools/timetable${classId ? `?classId=${classId}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      setTimetable(data.data);
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { timetable, isLoading, selectedClass, setSelectedClass, fetchTimetable };
}

export function useSchoolAttendance() {
  const [attendance, setAttendance] = useState<SchoolAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchAttendance = useCallback(async (classId: string, date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schools/attendance?classId=${classId}&date=${date}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      setAttendance(data.data);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAttendance = useCallback(async (attendanceId: string, status: SchoolAttendance['status']) => {
    try {
      await fetch(`/api/schools/attendance/${attendanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to mark attendance:', err);
    }
  }, []);

  return { attendance, isLoading, selectedClass, selectedDate, setSelectedClass, setSelectedDate, fetchAttendance, markAttendance };
}
