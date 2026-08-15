'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCommunityStore } from '@/features/community/store/communityStore';

export function useCommunity() {
  const {
    posts,
    studyGroups,
    qnaQuestions,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    fetchPosts,
    createPost,
    likePost,
    commentOnPost,
    fetchStudyGroups,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    fetchQnA,
    askQuestion,
    answerQuestion,
    acceptAnswer,
  } = useCommunityStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'forums') fetchPosts(selectedCategory || undefined);
    if (activeTab === 'groups') fetchStudyGroups();
    if (activeTab === 'qa') fetchQnA(selectedCategory || undefined);
  }, [activeTab, selectedCategory]);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = studyGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQnA = qnaQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    posts: filteredPosts,
    studyGroups: filteredGroups,
    qnaQuestions: filteredQnA,
    isLoading,
    error,
    createPost,
    likePost,
    commentOnPost,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    askQuestion,
    answerQuestion,
    acceptAnswer,
  };
}

export function useForumPosts() {
  const { posts, fetchPosts, createPost, likePost, commentOnPost } = useCommunityStore();
  const [isLoading, setIsLoading] = useState(false);

  const loadPosts = useCallback(async (category?: string) => {
    setIsLoading(true);
    await fetchPosts(category);
    setIsLoading(false);
  }, [fetchPosts]);

  return { posts, isLoading, loadPosts, createPost, likePost, commentOnPost };
}

export function useStudyGroups() {
  const { studyGroups, fetchStudyGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup } = useCommunityStore();
  const [isLoading, setIsLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    await fetchStudyGroups();
    setIsLoading(false);
  }, [fetchStudyGroups]);

  return { studyGroups, isLoading, loadGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup };
}
