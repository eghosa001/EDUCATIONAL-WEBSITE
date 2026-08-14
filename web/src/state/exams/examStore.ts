'use client';

import { create } from 'zustand';
import type { Exam, ExamResult } from '@/types/models/exam';
import type { Question } from '@/types/models/question';

interface ExamState {
  exams: Exam[];
  activeExam: Exam | null;
  questions: Question[];
  answers: Record<string, string>;
  results: ExamResult[];
  isLoading: boolean;
  setExams: (exams: Exam[]) => void;
  setActiveExam: (exam: Exam | null) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string) => void;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  exams: [],
  activeExam: null,
  questions: [],
  answers: {},
  results: [],
  isLoading: false,
  setExams: (exams) => set({ exams }),
  setActiveExam: (activeExam) => set({ activeExam }),
  setQuestions: (questions) => set({ questions }),
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  resetExam: () => set({ activeExam: null, questions: [], answers: {} }),
}));
