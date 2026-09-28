import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';
import { getSupabase } from '@/lib/supabase';

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

const mapForum = (row: any): Forum => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  subjectId: row.subject_id || undefined,
  classId: row.class_id || undefined,
  isPublic: Boolean(row.is_public),
  memberCount: Number(row.member_count || 0),
  postCount: Number(row.post_count || 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapPost = (row: any): Post => ({
  id: row.id,
  forumId: row.forum_id || '',
  authorId: row.user_id || '',
  authorName: 'Student',
  title: row.title,
  content: row.content,
  isPinned: Boolean(row.is_pinned),
  isLocked: Boolean(row.is_locked),
  likeCount: Number(row.like_count ?? row.likes_count ?? 0),
  replyCount: Number(row.replies_count || 0),
  viewCount: Number(row.views || 0),
  tags: Array.isArray(row.tags) ? row.tags : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const fetchForums = async (
  page: number = 1,
  limit: number = 20,
  _token?: string
): Promise<PaginatedResponse<Forum>> => {
  const from = (page - 1) * limit;
  const { data, error, count } = await getSupabase()
    .from('forums')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('name')
    .range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const total = count || 0;
  return { data: (data || []).map(mapForum), page, pageSize: limit, total, totalPages: Math.ceil(total / limit) };
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
  _token?: string
): Promise<{ data: Post[]; pagination: any }> => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const from = (page - 1) * limit;
  let query = getSupabase().from('community_posts').select('*', { count: 'exact' }).eq('status', 'published');
  if (forumId) query = query.eq('forum_id', forumId);
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const total = count || 0;
  return { data: (data || []).map(mapPost), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const fetchCommunityPosts = async (
  filters: { page?: number; limit?: number } = {},
  token?: string
): Promise<{ data: Post[]; pagination: any }> => fetchPosts('', filters, token);

const insertPost = async (data: CreatePostData): Promise<{ post: Post }> => {
  const supabase = getSupabase();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('You must be signed in');
  const { data: row, error } = await supabase.from('community_posts').insert({
    user_id: auth.user.id,
    forum_id: data.forumId || null,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
  }).select().single();
  if (error) throw new Error(error.message);
  const post = mapPost(row);
  post.authorName = [auth.user.user_metadata?.first_name, auth.user.user_metadata?.last_name].filter(Boolean).join(' ') || 'You';
  return { post };
};

export const createCommunityPost = async (data: CreatePostData, _token: string): Promise<{ post: Post }> => insertPost(data);
export const createPost = async (data: CreatePostData, _token: string): Promise<{ post: Post }> => insertPost(data);

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
