'use client';

import { create } from 'zustand';
import type { Course, CourseFilter } from '@/types/models/course';
import { courseService } from '@/services/api';

interface CourseState {
  courses: Course[];
  filteredCourses: Course[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCourses: number;

  // Actions
  fetchCourses: (filters?: CourseFilter) => Promise<void>;
  fetchCourse: (id: string) => Promise<Course | null>;
  enrollCourse: (courseId: string) => Promise<boolean>;
  unsaveCourse: (courseId: string) => Promise<void>;
  setFilters: (filters: Partial<CourseFilter>) => void;
  resetFilters: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  filteredCourses: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCourses: 0,

  fetchCourses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourses(filters || get());
      set({
        courses: response.data,
        filteredCourses: response.data,
        currentPage: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalCourses: response.pagination?.total || 0,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch courses',
        isLoading: false,
      });
    }
  },

  fetchCourse: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourse(id);
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch course',
        isLoading: false,
      });
      return null;
    }
  },

  enrollCourse: async (courseId) => {
    try {
      await courseService.enrollCourse(courseId);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to enroll' });
      return false;
    }
  },

  unsaveCourse: async (courseId) => {
    try {
      await courseService.unsaveCourse(courseId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to unsave course' });
    }
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: { category: null, level: null, search: null, sortBy: 'newest' },
      currentPage: 1,
    });
  },
}));
