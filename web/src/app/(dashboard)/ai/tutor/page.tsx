'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { sendAiTutorMessage, type AiTutorRequest } from '@/services/api/aiService';
import type { ChatMessage } from '@/types/models/ai';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: 'Hello! I\'m your AI tutor. Ask me anything about your studies — I can explain concepts, help with homework, generate quizzes, or create study plans. What would you like to learn today?',
  createdAt: new Date().toISOString(),
};

const QUICK_QUESTIONS = [
  'Explain photosynthesis simply',
  'Help me with quadratic equations',
  'Generate a quiz on cell biology',
  'Create a study plan for JAMB',
];

export default function AiTutorPage() {
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async (text?: string) => {
    const message = (text || input).trim();
    if (!message || isLoading || !token) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const req: AiTutorRequest = { message, subjectId: subjectId || undefined, topicId: topicId || undefined };
      const res = await sendAiTutorMessage(req, token);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.message?.content || 'I\'m sorry, I couldn\'t generate a response. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please check your connection and try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Tutor</h1>
            <p className="text-sm text-gray-500">Get personalized help with your studies</p>
          </div>
        </div>
        {(subjectId || topicId) && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            Context: {subjectId || topicId}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">AI may produce inaccurate information. Always verify with your teacher.</p>
          </div>
        </div>

        {/* Sidebar context */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Learning Context</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject (optional)</label>
                <input
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  placeholder="Subject ID"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Topic (optional)</label>
                <input
                  value={topicId}
                  onChange={e => setTopicId(e.target.value)}
                  placeholder="Topic ID"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Adding context helps the AI provide more relevant answers based on your curriculum.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">AI Features</h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> Explain concepts simply</li>
              <li className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> Generate practice quizzes</li>
              <li className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> Create study plans</li>
              <li className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> Summarize lessons</li>
              <li className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-indigo-500" /> Generate flashcards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
