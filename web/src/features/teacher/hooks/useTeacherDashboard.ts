'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTeacherStore } from '@/features/teacher/store/teacherStore';

export function useTeacherDashboard() {
  const { dashboardData, courses, analytics, isLoading, error, fetchDashboard, fetchCourses, fetchAnalytics } = useTeacherStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'analytics' | 'earnings'>('overview');

  useEffect(() => {
    fetchDashboard();
    fetchCourses();
  }, []);

  const refreshData = useCallback(() => {
    fetchDashboard();
    fetchCourses();
    fetchAnalytics();
  }, [fetchDashboard, fetchCourses, fetchAnalytics]);

  return {
    dashboardData,
    courses,
    analytics,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    refreshData,
  };
}

export function useTeacherCourses() {
  const { courses, fetchCourses, updateCourse } = useTeacherStore();
  const [isCreating, setIsCreating] = useState(false);

  const createCourse = useCallback(async (data: { title: string; description: string; category: string; level: string }) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      fetchCourses();
      return result;
    } finally {
      setIsCreating(false);
    }
  }, [fetchCourses]);

  return { courses, isCreating, createCourse, updateCourse, refreshCourses: fetchCourses };
}

export function useAssignmentGrading() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSubmissions = useCallback(async (courseId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/assignments/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      setSubmissions(data.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const gradeSubmission = useCallback(async (submissionId: string, grade: number, feedback: string) => {
    try {
      await fetch(`/api/assignments/${submissionId}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ grade, feedback }),
      });
    } catch (err) {
      console.error('Failed to grade submission:', err);
    }
  }, []);

  return { submissions, isLoading, loadSubmissions, gradeSubmission };
}
