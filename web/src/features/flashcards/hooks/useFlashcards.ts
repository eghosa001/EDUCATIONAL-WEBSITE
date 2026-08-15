'use client';

import { useState, useCallback } from 'react';
import { useFlashcardStore } from '@/features/flashcards/store/flashcardStore';
import type { Flashcard } from '@/types/models/flashcard';

export function useFlashcards() {
  const {
    flashcards,
    currentCardIndex,
    isFlipped,
    isStudying,
    sessionStats,
    setFlashcards,
    flipCard,
    nextCard,
    previousCard,
    rateCard,
    startStudySession,
    endStudySession,
    resetSession,
    shuffleCards,
  } = useFlashcardStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const filteredCards = useCallback(() => {
    return flashcards.filter((card) => {
      const matchesSearch = !searchTerm ||
        card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.back.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = !selectedSubject || card.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [flashcards, searchTerm, selectedSubject]);

  const loadFlashcards = useCallback((cards: Flashcard[]) => {
    setFlashcards(cards);
  }, [setFlashcards]);

  const currentCard = flashcards[currentCardIndex] || null;
  const progress = flashcards.length > 0 ? ((currentCardIndex + 1) / flashcards.length) * 100 : 0;

  return {
    flashcards,
    filteredCards: filteredCards(),
    currentCard,
    currentCardIndex,
    isFlipped,
    isStudying,
    sessionStats,
    searchTerm,
    selectedSubject,
    progress,
    setSearchTerm,
    setSelectedSubject,
    flipCard,
    nextCard,
    previousCard,
    rateCard,
    startStudySession,
    endStudySession,
    resetSession,
    shuffleCards,
    loadFlashcards,
  };
}
