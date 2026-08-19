import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== FORUMS ==========

export interface Forum {
  id: string;
  name: string;
  description: string;
  subjectId?: string;
  classId?: string;
  isPublic: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumData {
  name: string;
  description: string;
  subjectId?: string;
  classId?: string;
  isPublic?: boolean;
}

export const fetchForums = async (
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<Forum>> => {
  const response = await fetch(`${baseUrl}/community/forums?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchForumById = async (forumId: string, token?: string): Promise<{ forum: Forum }> => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createForum = async (data: CreateForumData, token: string) => {
  const response = await fetch(`${baseUrl}/community/forums`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateForum = async (forumId: string, data: Partial<CreateForumData>, token: string) => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteForum = async (forumId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== FORUM MEMBERSHIP ==========

export const joinForum = async (forumId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const leaveForum = async (forumId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchForumMembers = async (
  forumId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/community/forums/${forumId}/members?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== POSTS ==========

export interface Post {
  id: string;
  forumId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  likeCount: number;
  replyCount: number;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  forumId: string;
  title: string;
  content: string;
  tags?: string[];
}

export const fetchPosts = async (
  forumId: string,
  filters: { page?: number; limit?: number } = {},
  token?: string
): Promise<{ data: Post[]; pagination: any }> => {
  const url = forumId
    ? `${baseUrl}/community/forums/${forumId}/posts?page=${filters.page || 1}&limit=${filters.limit || 20}`
    : `${baseUrl}/community/posts?page=${filters.page || 1}&limit=${filters.limit || 20}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const res = await handleApiError(response) as any;
  return { data: res.data?.posts || res.data || [], pagination: res.pagination || {} };
};

export const fetchCommunityPosts = async (
  filters: { page?: number; limit?: number } = {},
  token?: string
): Promise<{ data: Post[]; pagination: any }> => {
  const response = await fetch(`${baseUrl}/community/posts?page=${filters.page || 1}&limit=${filters.limit || 20}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const res = await handleApiError(response) as any;
  return { data: res.data?.posts || res.data || [], pagination: res.pagination || {} };
};

export const createCommunityPost = async (
  data: CreatePostData,
  token: string
): Promise<{ post: Post }> => {
  const response = await fetch(`${baseUrl}/community/posts`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  const res = await handleApiError(response) as any;
  return { post: res.data?.post || res.data || {} };
};

export const createPost = async (data: CreatePostData, token: string): Promise<{ post: Post }> => {
  const response = await fetch(`${baseUrl}/community/posts`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  const res = await handleApiError(response) as any;
  return { post: res.data?.post || res.data || {} };
};

export const fetchPostById = async (postId: string, token?: string): Promise<{ post: Post }> => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const updatePost = async (postId: string, data: Partial<CreatePostData>, token: string) => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deletePost = async (postId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== POST INTERACTIONS ==========

export const likePost = async (postId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const unlikePost = async (postId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}/like`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== REPLIES ==========

export interface Reply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReplyData {
  postId: string;
  content: string;
}

export const fetchReplies = async (
  postId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<Reply>> => {
  const response = await fetch(`${baseUrl}/community/posts/${postId}/replies?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createReply = async (data: CreateReplyData, token: string) => {
  const response = await fetch(`${baseUrl}/community/replies`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateReply = async (replyId: string, content: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/replies/${replyId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ content, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const deleteReply = async (replyId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/replies/${replyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== STUDY GROUPS ==========

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subjectId?: string;
  topicId?: string;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  joinCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyGroupData {
  name: string;
  description: string;
  subjectId?: string;
  topicId?: string;
  maxMembers?: number;
  isPrivate?: boolean;
}

export const fetchStudyGroups = async (
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<StudyGroup>> => {
  const response = await fetch(`${baseUrl}/community/study-groups?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchStudyGroupById = async (groupId: string, token?: string): Promise<{ group: StudyGroup }> => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createStudyGroup = async (data: CreateStudyGroupData, token: string) => {
  const response = await fetch(`${baseUrl}/community/study-groups`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateStudyGroup = async (groupId: string, data: Partial<CreateStudyGroupData>, token: string) => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteStudyGroup = async (groupId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== STUDY GROUP MEMBERSHIP ==========

export const joinStudyGroup = async (groupId: string, joinCode?: string, token?: string) => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}/join`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ joinCode, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const leaveStudyGroup = async (groupId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchStudyGroupMembers = async (
  groupId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}/members?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== STUDY GROUP MESSAGES ==========

export interface StudyGroupMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

export interface CreateGroupMessageData {
  groupId: string;
  content: string;
  attachments?: string[];
}

export const fetchStudyGroupMessages = async (
  groupId: string,
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResponse<StudyGroupMessage>> => {
  const response = await fetch(`${baseUrl}/community/study-groups/${groupId}/messages?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const sendStudyGroupMessage = async (data: CreateGroupMessageData, token: string) => {
  const response = await fetch(`${baseUrl}/community/messages`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteStudyGroupMessage = async (messageId: string, token: string) => {
  const response = await fetch(`${baseUrl}/community/messages/${messageId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
