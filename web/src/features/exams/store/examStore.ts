'use client';

import { create } from 'zustand';
import type { Exam, ExamQuestion, ExamAnswer } from '@/types/models/exam';

interface ExamState {
  currentExam: Exam | null;
  examQuestions: ExamQuestion[];
  answers: Record<string, string>;
  currentTime: number;
  isStarted: boolean;
  isSubmitted: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentExam: (exam: Exam | null) => void;
  startExam: (exam: Exam) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setTime: (time: number) => void;
  submitExam: () => Promise<{ score: number; passed: boolean }>;
  resetExam: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  getAnsweredCount: () => number;
  getTotalQuestions: () => number;
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentExam: null,
  examQuestions: [],
  answers: {},
  currentTime: 0,
  isStarted: false,
  isSubmitted: false,
  isLoading: false,
  error: null,
  currentQuestionIndex: 0,

  setCurrentExam: (exam) => set({ currentExam: exam }),

  startExam: (exam) => {
    set({
      currentExam: exam,
      examQuestions: exam.questions || [],
      isStarted: true,
      isSubmitted: false,
      currentTime: exam.durationMinutes * 60,
      answers: {},
      currentQuestionIndex: 0,
    });
  },

  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  setTime: (time) => set({ currentTime: time }),

  submitExam: async () => {
    const { currentExam, answers } = get();
    if (!currentExam) return { score: 0, passed: false };

    set({ isLoading: true, isSubmitted: true });

    try {
      // In production, call the API to submit answers
      const correctAnswers = currentExam.questions?.filter(
        (q) => answers[q.id] === q.correctAnswer
      ).length || 0;

      const score = Math.round((correctAnswers / (currentExam.questions?.length || 1)) * 100);
      const passed = score >= (currentExam.passingScore || 50);

      set({ isLoading: false });
      return { score, passed };
    } catch (err) {
      set({ isLoading: false, error: 'Failed to submit exam' });
      return { score: 0, passed: false };
    }
  },

  resetExam: () => {
    set({
      currentExam: null,
      examQuestions: [],
      answers: {},
      currentTime: 0,
      isStarted: false,
      isSubmitted: false,
      currentQuestionIndex: 0,
      error: null,
    });
  },

  nextQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.examQuestions.length - 1),
    }));
  },

  previousQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    }));
  },

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  getAnsweredCount: () => Object.keys(get().answers).length,

  getTotalQuestions: () => get().examQuestions.length,
}));
