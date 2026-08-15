'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCourseStore } from '@/features/courses/store/courseStore';

export function useCourses() {
  const {
    courses,
    filteredCourses,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCourses,
    fetchCourses,
    fetchCourse,
    enrollCourse,
    unsaveCourse,
    setFilters,
    resetFilters,
  } = useCourseStore();

  const [filters, setFiltersState] = useState({
    category: null as string | null,
    level: null as string | null,
    search: null as string | null,
    sortBy: 'newest' as 'newest' | 'popular' | 'rating' | 'price',
  });

  useEffect(() => {
    fetchCourses(filters);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setFilters(newFilters);
    fetchCourses({ ...filters, ...newFilters });
  }, [filters, setFilters, fetchCourses]);

  const handleSearch = useCallback((search: string) => {
    setFiltersState((prev) => ({ ...prev, search }));
    setFilters({ search });
    fetchCourses({ ...filters, search });
  }, [filters, setFilters, fetchCourses]);

  const handleEnroll = useCallback(async (courseId: string) => {
    return await enrollCourse(courseId);
  }, [enrollCourse]);

  const handleUnsave = useCallback(async (courseId: string) => {
    await unsaveCourse(courseId);
  }, [unsaveCourse]);

  const handlePageChange = useCallback((page: number) => {
    fetchCourses({ ...filters, page });
  }, [filters, fetchCourses]);

  return {
    courses,
    filteredCourses,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCourses,
    filters,
    handleFilterChange,
    handleSearch,
    handleEnroll,
    handleUnsave,
    handlePageChange,
    resetFilters,
  };
}

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCourse = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
          },
        });
        if (mounted) {
          if (response.ok) {
            const data = await response.json();
            setCourse(data.data);
          } else {
            setError('Failed to load course');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCourse();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  return { course, isLoading, error };
}
