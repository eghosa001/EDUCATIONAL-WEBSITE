'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIContext {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // In production, call the AI API
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({
          message: content,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.response || 'I\'m here to help you learn!',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  const updateContext = useCallback((newContext: Partial<AIContext>) => {
    setContext((prev) => ({ ...prev, ...newContext }));
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const generateQuiz = useCallback(async (topic: string, difficulty: string, count: number = 5) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/ai/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ topic, difficulty, count }),
      });
      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSummary = useCallback(async (content: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateFlashcards = useCallback(async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/ai/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      return data.data;
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
    sendMessage,
    updateContext,
    clearConversation,
    generateQuiz,
    generateSummary,
    generateFlashcards,
    messagesEndRef,
  };
}

function getFallbackResponse(userMessage: string): string {
  const responses = [
    `That's a great question about "${userMessage.slice(0, 50)}"... Let me help you understand this concept better.`,
    `I can help with that! Here's what you need to know about this topic...`,
    `Great question! Let me break this down for you in simple terms.`,
    `I understand you're asking about this. Here's a helpful explanation...`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
