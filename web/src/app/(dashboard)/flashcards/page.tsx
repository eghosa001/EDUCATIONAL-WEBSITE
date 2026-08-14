'use client';

import { useState } from 'react';
import { SparklesIcon, PlusIcon } from 'lucide-react';

const flashcards = [
  { id: '1', title: 'Biology — Cell Structure', cards: 24, lastReview: '2 days ago' },
  { id: '2', title: 'Chemistry — Periodic Table', cards: 18, lastReview: '1 day ago' },
  { id: '3', title: 'Mathematics — Formulas', cards: 32, lastReview: '5 days ago' },
];

export default function FlashcardsPage() {
  const [decks, setDecks] = useState(flashcards);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-500 mt-1">Spaced repetition for better retention</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map(deck => (
          <div key={deck.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{deck.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{deck.cards} cards</p>
            <p className="text-xs text-gray-400 mt-2">Last reviewed: {deck.lastReview}</p>
            <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Start Review</button>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Deck</h2>
          <input placeholder="Deck Title" className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="Add cards (front | back)" className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500" rows={4} />
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Create Deck</button>
          </div>
        </div>
      )}
    </div>
  );
}
