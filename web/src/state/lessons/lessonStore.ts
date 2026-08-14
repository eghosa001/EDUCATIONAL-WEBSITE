'use client';

import { create } from 'zustand';
import type { Lesson } from '@/types/models/lesson';

interface LessonState {
  lessons: Lesson[];
  activeLesson: Lesson | null;
  progress: Record<string, number>;
  isLoading: boolean;
  setLessons: (lessons: Lesson[]) => void;
  setActiveLesson: (lesson: Lesson | null) => void;
  setProgress: (lessonId: string, progress: number) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  lessons: [],
  activeLesson: null,
  progress: {},
  isLoading: false,
  setLessons: (lessons) => set({ lessons }),
  setActiveLesson: (activeLesson) => set({ activeLesson }),
  setProgress: (lessonId, progress) =>
    set((state) => ({ progress: { ...state.progress, [lessonId]: progress } })),
}));
