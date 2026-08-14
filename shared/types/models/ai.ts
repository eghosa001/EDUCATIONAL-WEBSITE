export interface AiConversation {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  title?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AiUsage {
  id: string;
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  createdAt: string;
}
