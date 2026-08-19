'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, BrainIcon, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { generateAiFlashcards } from '@/services/api/aiService';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subjectId?: string;
  topicId?: string;
}

export default function FlashcardsPage() {
  const { token } = useAuthStore();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState('');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (token) {
      // Load saved flashcards from backend or generate defaults
      setLoading(false);
    }
  }, [token]);

  const handleGenerate = async () => {
    if (!token || !subjectId) return;
    setLoading(true);
    try {
      const res = await generateAiFlashcards({ subjectId, count: 20 }, token);
      setFlashcards(res.flashcards || []);
      setGenerated(true);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch {
      // Fallback to empty
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  if (loading && !generated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-500 mt-1">Study with AI-generated flashcards using spaced repetition</p>
        </div>
      </div>

      {/* Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Generate Flashcards</h2>
        </div>
        <div className="flex gap-3">
          <input
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            placeholder="Enter subject ID (e.g., biology, mathematics)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={!subjectId || loading}
            className="px-6 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Enter a subject name or ID to generate flashcards from your curriculum.</p>
      </div>

      {/* Flashcard display */}
      {flashcards.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <div className="flex gap-2">
              <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full h-64 cursor-pointer perspective-1000"
          >
            <div className={`relative w-full h-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl border-2 border-indigo-200 flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                <span className="text-xs text-indigo-400 uppercase tracking-wider mb-3">Question</span>
                <p className="text-lg font-semibold text-gray-900 text-center">{flashcards[currentIndex].front}</p>
                <p className="text-xs text-gray-400 mt-4">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-2 border-green-200 flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-xs text-green-500 uppercase tracking-wider mb-3">Answer</span>
                <p className="text-lg text-gray-800 text-center">{flashcards[currentIndex].back}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-2">
              <button onClick={() => handleRate('hard')} className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                Hard
              </button>
              <button onClick={() => handleRate('good')} className="px-4 py-2 text-sm text-yellow-600 border border-yellow-200 rounded-xl hover:bg-yellow-50 transition-colors">
                Good
              </button>
              <button onClick={() => handleRate('easy')} className="px-4 py-2 text-sm text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors">
                Easy
              </button>
            </div>
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BrainIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No flashcards yet</h3>
          <p className="text-gray-500 text-sm">Enter a subject above to generate AI flashcards for study.</p>
        </div>
      )}
    </div>
  );
}
