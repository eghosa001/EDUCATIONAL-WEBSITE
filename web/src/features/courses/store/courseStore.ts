'use client';

import { create } from 'zustand';
import type { Course, CourseFilter } from '@/types/models/course';
import { fetchCourses, fetchCourseByIdOrSlug, enrollInCourse, unenrollFromCourse } from '@/services/api/courseService';

interface CourseState {
  courses: Course[];
  filteredCourses: Course[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  filters: CourseFilter;

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
  filters: { category: null, level: null, search: null, sortBy: 'newest' },

  fetchCourses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('edu_token') || '';
      const mergedFilters = { ...get().filters, ...filters };
      // Strip null values and map CourseFilter keys to CourseFilters API keys
      const apiFilters: Record<string, unknown> = {};
      Object.entries(mergedFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          apiFilters[key] = value;
        }
      });
      const response = await fetchCourses(apiFilters as any, token);
      set({
        courses: response.data,
        filteredCourses: response.data,
        currentPage: response.page || 1,
        totalPages: response.totalPages || 1,
        totalCourses: response.total || 0,
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
      const token = localStorage.getItem('edu_token') || '';
      const response = await fetchCourseByIdOrSlug(id, token);
      set({ isLoading: false });
      return response.course;
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
      const token = localStorage.getItem('edu_token') || '';
      await enrollInCourse(courseId, token);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to enroll' });
      return false;
    }
  },

  unsaveCourse: async (courseId) => {
    try {
      const token = localStorage.getItem('edu_token') || '';
      await unenrollFromCourse(courseId, token);
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
