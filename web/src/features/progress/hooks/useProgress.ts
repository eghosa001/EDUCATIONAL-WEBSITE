'use client';

import { useEffect } from 'react';
import { useProgressStore } from '@/features/progress/store/progressStore';

export function useProgress() {
  const { overallProgress, subjectPerformance, studySessions, isLoading, error, fetchProgress, fetchSubjectPerformance, fetchStudySessions, getWeakTopics, getStrongTopics, getRecommendedTopics } = useProgressStore();

  useEffect(() => {
    fetchProgress();
    fetchSubjectPerformance();
    fetchStudySessions();
  }, []);

  const weakTopics = getWeakTopics();
  const strongTopics = getStrongTopics();
  const recommendedTopics = getRecommendedTopics();

  const totalStudyTime = studySessions.reduce((acc, session) => acc + session.duration, 0);
  const averageDailyStudyTime = totalStudyTime / 30;

  return {
    overallProgress,
    subjectPerformance,
    studySessions,
    weakTopics,
    strongTopics,
    recommendedTopics,
    totalStudyTime,
    averageDailyStudyTime,
    isLoading,
    error,
  };
}

export function useStreak() {
  const { studySessions } = useProgressStore();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Calculate streak from study sessions
    const dates = studySessions.map((s) => s.date.toISOString().split('T')[0]);
    const uniqueDates = [...new Set(dates)];
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const sessionDate = new Date(uniqueDates[uniqueDates.length - 1 - i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }, [studySessions]);

  return streak;
}
