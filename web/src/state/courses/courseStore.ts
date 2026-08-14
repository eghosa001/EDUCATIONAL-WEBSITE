'use client';

import { create } from 'zustand';
import type { Course } from '@/types/models/course';

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  isLoading: boolean;
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  selectedCourse: null,
  isLoading: false,
  setCourses: (courses) => set({ courses }),
  setSelectedCourse: (selectedCourse) => set({ selectedCourse }),
  setLoading: (isLoading) => set({ isLoading }),
}));
