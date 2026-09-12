'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  sendAiTutorMessage,
  generateAiQuiz,
  generateAiSummary,
  generateAiFlashcards,
} from '@/services/api/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIContext {
  subjectId?: string;
  topicId?: string;
  studentLevel?: string;
  currentSubject?: string;
  currentTopic?: string;
  learningHistory?: string[];
}

export function useAITutor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<AIContext>({});
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const data = await sendAiTutorMessage({
        message: text,
        subjectId: context.subjectId,
        topicId: context.topicId,
        sessionId,
        context: {
          studentLevel: context.studentLevel,
          currentSubject: context.currentSubject,
          currentTopic: context.currentTopic,
          learningHistory: context.learningHistory,
        },
      });
      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message?.content || 'No response was returned.',
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  }, [context, isLoading, sessionId]);

  const updateContext = useCallback((newContext: Partial<AIContext>) => {
    setContext((prev) => ({ ...prev, ...newContext }));
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  }, []);

  const generateQuiz = useCallback(async (
    subjectId: string,
    difficulty: string,
    count: number = 5,
    topicId?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateAiQuiz({
        subjectId,
        topicId,
        difficulty,
        questionCount: count,
      });
      return data.quiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSummary = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateAiSummary({ content, type: 'lesson', length: 'medium' });
      return data.summary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateFlashcards = useCallback(async (subjectId: string, topicId?: string, count: number = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateAiFlashcards({ subjectId, topicId, count });
      return data.flashcards;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    context,
    sessionId,
    sendMessage,
    updateContext,
    clearConversation,
    generateQuiz,
    generateSummary,
    generateFlashcards,
    messagesEndRef,
  };
}
