'use client';

import { create } from 'zustand';
import type { ForumPost, StudyGroup, QnAQuestion } from '@/types/models/community';

interface CommunityState {
  posts: ForumPost[];
  studyGroups: StudyGroup[];
  qnaQuestions: QnAQuestion[];
  isLoading: boolean;
  error: string | null;
  activeTab: 'forums' | 'groups' | 'qa';

  // Actions
  setActiveTab: (tab: 'forums' | 'groups' | 'qa') => void;
  fetchPosts: (category?: string) => Promise<void>;
  createPost: (data: { title: string; content: string; category: string; tags?: string[] }) => Promise<ForumPost | null>;
  likePost: (postId: string) => Promise<void>;
  commentOnPost: (postId: string, content: string) => Promise<void>;
  fetchStudyGroups: () => Promise<void>;
  createStudyGroup: (data: { name: string; description: string; subject: string }) => Promise<StudyGroup | null>;
  joinStudyGroup: (groupId: string) => Promise<void>;
  leaveStudyGroup: (groupId: string) => Promise<void>;
  fetchQnA: (category?: string) => Promise<void>;
  askQuestion: (data: { question: string; details: string; subject: string; tags?: string[] }) => Promise<QnAQuestion | null>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  acceptAnswer: (questionId: string, answerId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  studyGroups: [],
  qnaQuestions: [],
  isLoading: false,
  error: null,
  activeTab: 'forums',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchPosts: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/community/posts${category ? `?category=${category}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ posts: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch posts', isLoading: false });
    }
  },

  createPost: async (data) => {
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set((state) => ({ posts: [result.data, ...state.posts] }));
      return result.data;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create post' });
      return null;
    }
  },

  likePost: async (postId) => {
    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
        ),
      }));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  },

  commentOnPost: async (postId, content) => {
    try {
      await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ content }),
      });
      get().fetchPosts();
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  },

  fetchStudyGroups: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/community/study-groups', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ studyGroups: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch groups', isLoading: false });
    }
  },

  createStudyGroup: async (data) => {
    try {
      const response = await fetch('/api/community/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set((state) => ({ studyGroups: [result.data, ...state.studyGroups] }));
      return result.data;
    } catch (err) {
      return null;
    }
  },

  joinStudyGroup: async (groupId) => {
    try {
      await fetch(`/api/community/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      get().fetchStudyGroups();
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  },

  leaveStudyGroup: async (groupId) => {
    try {
      await fetch(`/api/community/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      get().fetchStudyGroups();
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  },

  fetchQnA: async (category) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/community/qna${category ? `?category=${category}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ qnaQuestions: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch Q&A', isLoading: false });
    }
  },

  askQuestion: async (data) => {
    try {
      const response = await fetch('/api/community/qna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set((state) => ({ qnaQuestions: [result.data, ...state.qnaQuestions] }));
      return result.data;
    } catch (err) {
      return null;
    }
  },

  answerQuestion: async (questionId, answer) => {
    try {
      await fetch(`/api/community/qna/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ answer }),
      });
      get().fetchQnA();
    } catch (err) {
      console.error('Failed to answer:', err);
    }
  },

  acceptAnswer: async (questionId, answerId) => {
    try {
      await fetch(`/api/community/qna/${questionId}/answers/${answerId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      get().fetchQnA();
    } catch (err) {
      console.error('Failed to accept answer:', err);
    }
  },
}));
