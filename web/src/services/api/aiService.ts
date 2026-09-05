import { getSupabase } from '@/lib/supabase';
import type { AiTutorSession, ChatMessage } from '@/types/models/ai';
import type { PaginatedResponse } from '@/types/api/api';

/**
 * AI is a privileged capability. The browser never receives an AI provider key.
 */
const invokeAi = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await getSupabase().functions.invoke('ai', { body });
  if (error) throw new Error(error.message || 'AI request failed');
  if (data?.error) throw new Error(String(data.error));
  return data as T;
};

export interface AiTutorMessage { role: 'user' | 'assistant'; content: string; }
export interface AiTutorRequest { message: string; subjectId?: string; topicId?: string; context?: Record<string, unknown>; sessionId?: string; }
export interface AiTutorResponse { message: ChatMessage; sessionId: string; }

export const sendAiTutorMessage = (data: AiTutorRequest, _token?: string) => invokeAi<AiTutorResponse>({ action: 'tutor', ...data });

export const fetchAiTutorSessions = async (page = 1, limit = 20, _token?: string): Promise<PaginatedResponse<AiTutorSession>> => {
  const supabase = getSupabase();
  const from = Math.max(0, (page - 1) * limit);
  const to = from + limit - 1;
  const { data, error, count } = await supabase.from('ai_conversations').select('*', { count: 'exact' }).order('updated_at', { ascending: false }).range(from, to);
  if (error) throw new Error(error.message);
  return { data: (data || []) as unknown as AiTutorSession[], page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};

export const fetchAiTutorSession = async (sessionId: string, _token?: string): Promise<{ session: AiTutorSession }> => {
  const { data, error } = await getSupabase().from('ai_conversations').select('*').eq('id', sessionId).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'AI session not found');
  return { session: data as unknown as AiTutorSession };
};

export const deleteAiTutorSession = async (sessionId: string, _token?: string) => {
  const { error } = await getSupabase().from('ai_conversations').delete().eq('id', sessionId);
  if (error) throw new Error(error.message);
  return { success: true };
};

export interface AiQuizRequest { subjectId: string; topicId?: string; difficulty?: string; questionCount: number; questionTypes?: string[]; }
export interface AiGeneratedQuiz { id: string; questions: Array<{ questionText: string; questionType: string; options?: string[]; correctAnswer: string; explanation?: string; difficulty: string; }>; createdAt: string; }
export const generateAiQuiz = (data: AiQuizRequest, _token?: string) => invokeAi<{ quiz: AiGeneratedQuiz }>({ action: 'quiz', ...data });

export interface AiStudyPlanRequest { subjectId: string; targetScore?: number; availableHoursPerDay: number; examDate?: string; }
export interface AiStudyPlan { id: string; subjectId: string; dailySchedule: Array<{ day: string; topics: string[]; hours: number; resources: string[]; }>; totalDurationDays: number; createdAt: string; text?: string; }
export const generateAiStudyPlan = (data: AiStudyPlanRequest, _token?: string) => invokeAi<{ studyPlan: AiStudyPlan }>({ action: 'study-plan', ...data });

export interface AiExplainRequest { question: string; subjectId?: string; topicId?: string; level?: 'beginner' | 'intermediate' | 'advanced'; }
export interface AiExplanation { explanation: string; keyPoints: string[]; examples?: string[]; }
export const getAiExplanation = (data: AiExplainRequest, _token?: string) => invokeAi<{ explanation: AiExplanation }>({ action: 'explain', ...data });

export interface AiFlashcardRequest { subjectId: string; topicId?: string; count: number; }
export interface AiFlashcard { id: string; front: string; back: string; subjectId: string; topicId?: string; difficulty?: string; }
export const generateAiFlashcards = (data: AiFlashcardRequest, _token?: string) => {
  return getSupabase().functions.invoke('flashcards', { body: data }).then(({ data, error }) => {
    if (error) throw new Error(error.message || 'Flashcard generation failed');
    if (data?.error) throw new Error(String(data.error));
    return data as { flashcards: AiFlashcard[] };
  });
};

export interface SavedFlashcard { id: string; front: string; back: string; subjectId?: string; topicId?: string; courseId?: string; difficulty?: string; }

/** The database stores one flashcard set per row in `flashcards.cards` JSONB. */
export const fetchMyFlashcards = async (_token?: string, params: { page?: number; limit?: number; difficulty?: string } = {}): Promise<{ flashcards: SavedFlashcard[]; pagination: { page: number; limit: number; total: number } }> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) throw new Error('You must be signed in');

  let query = getSupabase()
    .from('flashcards')
    .select('id,course_id,lesson_id,topic_id,subject_id,title,cards,created_at', { count: 'exact' })
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const { data: sets, error, count } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) throw new Error(error.message);

  const flashcards: SavedFlashcard[] = [];
  for (const set of sets || []) {
    const cards = Array.isArray(set.cards) ? set.cards : [];
    for (const raw of cards) {
      if (!raw || typeof raw !== 'object') continue;
      const card = raw as Record<string, unknown>;
      const front = String(card.front ?? '').trim();
      const back = String(card.back ?? '').trim();
      const difficulty = String(card.difficulty ?? '').trim().toLowerCase();
      if (!front || !back) continue;
      if (params.difficulty && difficulty !== params.difficulty.toLowerCase()) continue;
      flashcards.push({
        id: `${set.id}:${flashcards.length}`,
        front,
        back,
        subjectId: set.subject_id || undefined,
        topicId: set.topic_id || undefined,
        courseId: set.course_id || undefined,
        difficulty: difficulty || undefined,
      });
    }
  }

  return { flashcards, pagination: { page, limit, total: count || 0 } };
};

export interface AiSummarizeRequest { content: string; type: 'lesson' | 'article' | 'video_transcript'; length?: 'short' | 'medium' | 'detailed'; }
export interface AiSummary { summary: string; keyPoints: string[]; readingTimeMinutes: number; }
export const generateAiSummary = (data: AiSummarizeRequest, _token?: string) => invokeAi<{ summary: AiSummary }>({ action: 'summarize', ...data });

export interface AiUsageStats { totalRequests: number; requestsToday: number; requestsThisMonth: number; mostUsedFeature: string; }
export const fetchAiUsageStats = async (_token?: string): Promise<{ stats: AiUsageStats }> => {
  const user = (await getSupabase().auth.getUser()).data.user;
  if (!user) throw new Error('You must be signed in');
  const { data, error } = await getSupabase().from('ai_usage_events').select('feature,created_at').eq('user_id', user.id);
  if (error) throw new Error(error.message);
  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const rows = data || [];
  const counts = rows.reduce<Record<string, number>>((acc, row: any) => { acc[row.feature] = (acc[row.feature] || 0) + 1; return acc; }, {});
  const mostUsedFeature = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return { stats: { totalRequests: rows.length, requestsToday: rows.filter((r: any) => new Date(r.created_at).getTime() >= today.getTime()).length, requestsThisMonth: rows.filter((r: any) => new Date(r.created_at).getTime() >= month.getTime() && new Date(r.created_at).getTime() <= now).length, mostUsedFeature } };
};
