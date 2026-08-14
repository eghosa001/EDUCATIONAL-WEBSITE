export interface CommunityPost {
  id: string;
  userId: string;
  type: 'discussion' | 'question' | 'announcement' | 'resource_share';
  title: string;
  content: string;
  subjectId?: string;
  topicId?: string;
  courseId?: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  likesCount: number;
  repliesCount: number;
  lastReplyAt?: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId?: string;
  parentId?: string;
  userId: string;
  content: string;
  likesCount: number;
  status: 'published' | 'moderated' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface CommentThread extends Comment {
  replies: CommentThread[];
}
