'use client';

import { create } from 'zustand';
import type { Lesson } from '@/types/models/lesson';
import type { Course } from '@/types/models/course';

interface LessonState {
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  lessons: Lesson[];
  completedLessons: Set<string>;
  isCompleted: (lessonId: string) => boolean;
  markCompleted: (lessonId: string) => void;
  markInProgress: (lessonId: string) => void;
  setCurrentCourse: (course: Course | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  setLessons: (lessons: Lesson[]) => void;
  setCurrentLessonIndex: (index: number) => void;
  currentLessonIndex: number;
  videoProgress: Record<string, number>;
  setVideoProgress: (lessonId: string, progress: number) => void;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  currentCourse: null,
  currentLesson: null,
  lessons: [],
  completedLessons: new Set(),
  currentLessonIndex: 0,
  videoProgress: {},

  isCompleted: (lessonId) => get().completedLessons.has(lessonId),

  markCompleted: (lessonId) => {
    set((state) => ({
      completedLessons: new Set([...state.completedLessons, lessonId]),
    }));
  },

  markInProgress: (lessonId) => {
    set((state) => ({
      completedLessons: new Set([...state.completedLessons, lessonId]),
    }));
  },

  setCurrentCourse: (course) => set({ currentCourse: course }),

  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

  setLessons: (lessons) => set({ lessons }),

  setCurrentLessonIndex: (index) => set({ currentLessonIndex: index }),

  setVideoProgress: (lessonId, progress) => {
    set((state) => ({
      videoProgress: { ...state.videoProgress, [lessonId]: progress },
    }));
  },
}));
