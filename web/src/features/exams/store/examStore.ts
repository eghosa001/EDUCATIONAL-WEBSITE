'use client';

import { create } from 'zustand';
import type { Exam, ExamQuestion } from '@/types/models/exam';
import { apiConfig, getAuthHeaders, handleApiResponse } from '@/services/api/config';

interface ExamState {
  currentExam: Exam | null;
  examQuestions: ExamQuestion[];
  attemptId: string | null;
  answers: Record<string, string>;
  currentTime: number;
  isStarted: boolean;
  isSubmitted: boolean;
  isLoading: boolean;
  error: string | null;
  startExam: (exam: Exam) => Promise<void>;
  setCurrentExam: (exam: Exam | null) => void;
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

const authToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('edu_token'));

export const useExamStore = create<ExamState>((set, get) => ({
  currentExam: null,
  examQuestions: [],
  attemptId: null,
  answers: {},
  currentTime: 0,
  isStarted: false,
  isSubmitted: false,
  isLoading: false,
  error: null,
  currentQuestionIndex: 0,

  setCurrentExam: (exam) => set({ currentExam: exam }),

  startExam: async (exam) => {
    const token = authToken();
    if (!token) {
      set({ error: 'You must be signed in to start an exam' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${apiConfig.baseUrl}/exams/${exam.id}/attempts`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: apiConfig.credentials,
      });
      const payload = await handleApiResponse<{
        data: {
          attempt: { id: string };
          exam: { durationMinutes: number };
          questions: Array<{
            questionId: string;
            questionText: string;
            questionType: string;
            options?: Array<{ id?: string; label?: string; text: string }>;
            marks: number;
            difficulty: 'easy' | 'medium' | 'hard';
            orderIndex: number;
          }>;
        };
      }>(response);

      const questions: ExamQuestion[] = (payload.data.questions || []).map((question) => ({
        id: question.questionId,
        examId: exam.id,
        questionText: question.questionText,
        questionType:
          question.questionType === 'true_false'
            ? 'true-false'
            : question.questionType === 'short_answer'
              ? 'short-answer'
              : question.questionType === 'essay'
                ? 'essay'
                : 'multiple-choice',
        options: Array.isArray(question.options)
          ? question.options.map((option, index) => ({
              label: option.label || option.id || String.fromCharCode(65 + index),
              text: option.text,
              isCorrect: false,
            }))
          : undefined,
        marks: Number(question.marks || 1),
        difficulty: question.difficulty || 'medium',
        orderIndex: Number(question.orderIndex || 0),
      }));

      set({
        currentExam: { ...exam, questions },
        examQuestions: questions,
        attemptId: payload.data.attempt.id,
        isStarted: true,
        isSubmitted: false,
        currentTime: Number(payload.data.exam.durationMinutes || exam.durationMinutes) * 60,
        answers: {},
        currentQuestionIndex: 0,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        isStarted: false,
        error: err instanceof Error ? err.message : 'Failed to start exam',
      });
    }
  },

  setAnswer: (questionId, answer) => {
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } }));
  },

  setTime: (time) => set({ currentTime: time }),

  submitExam: async () => {
    const { currentExam, attemptId, answers, currentTime } = get();
    if (!currentExam || !attemptId) {
      set({ error: 'No active exam attempt' });
      return { score: 0, passed: false };
    }

    const token = authToken();
    if (!token) {
      set({ error: 'You must be signed in to submit an exam' });
      return { score: 0, passed: false };
    }

    set({ isLoading: true, error: null });
    try {
      const elapsed = Math.max(0, currentExam.durationMinutes * 60 - currentTime);
      const response = await fetch(`${apiConfig.baseUrl}/exams/${currentExam.id}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: apiConfig.credentials,
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({ questionId, studentAnswer })),
          timeSpentSeconds: elapsed,
        }),
      });
      const payload = await handleApiResponse<{
        data: { result: { percentage: number; isPassed: boolean } };
      }>(response);

      set({ isLoading: false, isSubmitted: true });
      return {
        score: Number(payload.data.result.percentage || 0),
        passed: Boolean(payload.data.result.isPassed),
      };
    } catch (err) {
      set({
        isLoading: false,
        isSubmitted: false,
        error: err instanceof Error ? err.message : 'Failed to submit exam',
      });
      return { score: 0, passed: false };
    }
  },

  resetExam: () => {
    set({
      currentExam: null,
      examQuestions: [],
      attemptId: null,
      answers: {},
      currentTime: 0,
      isStarted: false,
      isSubmitted: false,
      isLoading: false,
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
    set((state) => ({ currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0) }));
  },

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  getAnsweredCount: () => Object.keys(get().answers).length,
  getTotalQuestions: () => get().examQuestions.length,
}));
