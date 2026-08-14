export interface CommunityPost {
  id: string;
  authorId: string;
  subjectId?: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  isModerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId?: string;
  lessonId?: string;
  authorId: string;
  content: string;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
}
