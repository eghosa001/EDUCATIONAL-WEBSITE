'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useExamStore } from '@/features/exams/store/examStore';

export function useExamTimer(durationMinutes: number, isActive: boolean, onTimeUp: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onTimeUp]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return { timeLeft, formatTime, resetTimer };
}

export function useExamNavigation(totalQuestions: number, currentIndex: number, onNavigate: (index: number) => void) {
  const canGoNext = currentIndex < totalQuestions - 1;
  const canGoPrevious = currentIndex > 0;

  const nextQuestion = useCallback(() => {
    if (canGoNext) onNavigate(currentIndex + 1);
  }, [canGoNext, currentIndex, onNavigate]);

  const previousQuestion = useCallback(() => {
    if (canGoPrevious) onNavigate(currentIndex - 1);
  }, [canGoPrevious, currentIndex, onNavigate]);

  return { canGoNext, canGoPrevious, nextQuestion, previousQuestion };
}

export function useExamSubmission(isAnswered: boolean, onSubmit: () => Promise<void>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!isAnswered) return;
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }, [isAnswered, onSubmit]);

  return { isSubmitting, handleSubmit };
}
