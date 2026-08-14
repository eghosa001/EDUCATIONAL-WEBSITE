export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiTutorSession {
  id: string;
  userId: string;
  subjectId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
