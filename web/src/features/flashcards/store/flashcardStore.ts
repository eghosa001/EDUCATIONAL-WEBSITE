'use client';

import { create } from 'zustand';
import type { Flashcard } from '@/types/models/flashcard';

interface FlashcardState {
  flashcards: Flashcard[];
  currentCardIndex: number;
  isFlipped: boolean;
  isStudying: boolean;
  sessionStats: {
    known: number;
    gettingThere: number;
    stillLearning: number;
  };

  // Actions
  setFlashcards: (cards: Flashcard[]) => void;
  flipCard: () => void;
  nextCard: () => void;
  previousCard: () => void;
  rateCard: (rating: 'know' | 'gettingThere' | 'stillLearning') => void;
  startStudySession: () => void;
  endStudySession: () => void;
  resetSession: () => void;
  shuffleCards: () => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  flashcards: [],
  currentCardIndex: 0,
  isFlipped: false,
  isStudying: false,
  sessionStats: { known: 0, gettingThere: 0, stillLearning: 0 },

  setFlashcards: (flashcards) => set({ flashcards, currentCardIndex: 0, isFlipped: false }),

  flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

  nextCard: () => {
    set((state) => ({
      currentCardIndex: Math.min(state.currentCardIndex + 1, state.flashcards.length - 1),
      isFlipped: false,
    }));
  },

  previousCard: () => {
    set((state) => ({
      currentCardIndex: Math.max(state.currentCardIndex - 1, 0),
      isFlipped: false,
    }));
  },

  rateCard: (rating) => {
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        [rating === 'know' ? 'known' : rating === 'gettingThere' ? 'gettingThere' : 'stillLearning']:
          state.sessionStats[rating === 'know' ? 'known' : rating === 'gettingThere' ? 'gettingThere' : 'stillLearning'] + 1,
      },
    }));
    get().nextCard();
  },

  startStudySession: () => set({ isStudying: true, currentCardIndex: 0, isFlipped: false, sessionStats: { known: 0, gettingThere: 0, stillLearning: 0 } }),

  endStudySession: () => set({ isStudying: false }),

  resetSession: () => set({ currentCardIndex: 0, isFlipped: false, sessionStats: { known: 0, gettingThere: 0, stillLearning: 0 } }),

  shuffleCards: () => {
    set((state) => ({
      flashcards: [...state.flashcards].sort(() => Math.random() - 0.5),
      currentCardIndex: 0,
    }));
  },
}));
