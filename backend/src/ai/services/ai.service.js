import { query } from '../../common/database/index.js';
import { config } from '../../common/config/index.js';
import { AIError } from '../../common/errors/index.js';

let openaiClient = null;
try {
  if (config.ai.bynara.apiKey) {
    const OpenAI = (await import('openai')).default;
    openaiClient = new OpenAI({ apiKey: config.ai.bynara.apiKey, baseURL: config.ai.bynara.baseURL });
  }
} catch { openaiClient = null; }

const cleanText = (value, max = 8000) => String(value ?? '').trim().slice(0, max);
const clampInt = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const parseJsonObject = (content) => {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    const match = String(content || '').match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
};

const callLLM = async (messages, options = {}) => {
  if (!openaiClient) {
    return { content: `[Local Response] I understand your question about ${cleanText(messages.at(-1)?.content, 80) || 'your topic'}.`, tokensUsed: 0 };
  }
  try {
    const response = await openaiClient.chat.completions.create({
      model: options.model || config.ai.defaultModel || 'agnes-2.5-flash',
      messages,
      temperature: options.temperature ?? config.ai.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? config.ai.maxTokens ?? 2048,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    });
    return {
      content: response.choices?.[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    throw new AIError(`AI service error: ${error.message}`);
  }
};

const keywordList = (message) => [...new Set(
  cleanText(message, 2000).toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5)
)];

const likeWhere = (column, keywords, startIndex) => keywords.length
  ? ` AND (${keywords.map((_, i) => `${column} ILIKE $${startIndex + i}`).join(' OR ')})`
  : '';

const retrieveContext = async (_userId, message, subjectId, topicId) => {
  const keywords = keywordList(message);
  const likeParams = keywords.map(word => `%${word}%`);
  const params = [subjectId || null, topicId || null, ...likeParams];
  const keywordStart = 3;

  const [lessons, topics, library, questions] = await Promise.all([
    query(`SELECT l.title, l.written_content FROM lessons l JOIN courses c ON c.id = l.course_id
      WHERE l.written_content IS NOT NULL AND (c.subject_id = $1 OR l.topic_id = $2)
      ${likeWhere('l.written_content', keywords, keywordStart)} LIMIT 3`, params),
    query(`SELECT t.name, t.description, t.learning_objectives FROM topics t
      WHERE (t.subject_id = $1 OR t.id = $2)
      ${likeWhere('t.name', keywords, keywordStart)} LIMIT 3`, params),
    query(`SELECT lr.title, lr.description FROM library_resources lr WHERE lr.subject_id = $1
      ${likeWhere('lr.title', keywords, keywordStart)} LIMIT 3`, params),
    query(`SELECT q.question_text, q.explanation, q.correct_answer FROM questions q WHERE q.subject_id = $1
      ${likeWhere('q.question_text', keywords, keywordStart)} LIMIT 3`, params),
  ]);
  return { lessons: lessons.rows || [], topics: topics.rows || [], library: library.rows || [], questions: questions.rows || [] };
};

const formatContextForPrompt = (context) => {
  const parts = [];
  if (context.lessons?.length) parts.push(`LESSONS:\n${context.lessons.map(l => `- ${cleanText(l.title, 200)}: ${cleanText(l.written_content, 700)}`).join('\n')}`);
  if (context.topics?.length) parts.push(`TOPICS:\n${context.topics.map(t => `- ${cleanText(t.name, 200)}: ${cleanText(t.description, 500)} Objectives: ${JSON.stringify(t.learning_objectives || [])}`).join('\n')}`);
  if (context.library?.length) parts.push(`LIBRARY:\n${context.library.map(l => `- ${cleanText(l.title, 200)}: ${cleanText(l.description, 500)}`).join('\n')}`);
  if (context.questions?.length) parts.push(`PAST QUESTIONS:\n${context.questions.map(q => `- Q: ${cleanText(q.question_text, 400)} A: ${JSON.stringify(q.correct_answer)} Explanation: ${cleanText(q.explanation, 400)}`).join('\n')}`);
  return parts.join('\n\n').slice(0, 12000);
};

const normalizeQuestions = (value, max) => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).filter(q => q && typeof q === 'object' && cleanText(q.questionText, 1000)).map(q => ({
    questionText: cleanText(q.questionText, 1000),
    questionType: cleanText(q.questionType, 40) || 'mcq',
    options: Array.isArray(q.options) ? q.options.slice(0, 6).map(x => cleanText(x, 300)) : [],
    correctAnswer: cleanText(q.correctAnswer, 300),
    explanation: cleanText(q.explanation, 1200),
    difficulty: cleanText(q.difficulty, 30),
  }));
};

const normalizeFlashcards = (value, max) => Array.isArray(value) ? value.slice(0, max).filter(fc => fc && typeof fc === 'object' && cleanText(fc.front, 500) && cleanText(fc.back, 1500)).map(fc => ({
  id: crypto.randomUUID(), front: cleanText(fc.front, 500), back: cleanText(fc.back, 1500),
})) : [];

export const aiService = {
  async createConversation(data) {
    const result = await query(`INSERT INTO ai_conversations (user_id, course_id, lesson_id, topic_id, title, context)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [data.userId, data.courseId || null, data.lessonId || null, data.topicId || null, cleanText(data.title, 120), data.context || {}]);
    return result.rows[0];
  },

  async listConversations(userId, params = {}) {
    const page = clampInt(params.page, 1, 100000, 1); const limit = clampInt(params.limit, 1, 100, 20);
    const result = await query(`SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY last_message_at DESC LIMIT $2 OFFSET $3`, [userId, limit, (page - 1) * limit]);
    return result.rows || [];
  },

  async addMessage(conversationId, data) {
    const result = await query(`INSERT INTO ai_messages (conversation_id, role, content, tokens_used, model)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`, [conversationId, data.role, cleanText(data.content, 20000), Number(data.tokensUsed) || 0, cleanText(data.model, 100) || 'default']);
    await query(`UPDATE ai_conversations SET message_count = message_count + 1, last_message_at = NOW() WHERE id = $1`, [conversationId]);
    return result.rows[0];
  },

  async getConversation(conversationId, userId) {
    const result = await query(`SELECT c.*, COALESCE(array_agg(m ORDER BY m.created_at) FILTER (WHERE m.id IS NOT NULL), '{}') AS messages
      FROM ai_conversations c LEFT JOIN ai_messages m ON m.conversation_id = c.id
      WHERE c.id = $1 AND c.user_id = $2 GROUP BY c.id`, [conversationId, userId]);
    return result.rows[0];
  },

  async chat(userId, data) {
    const message = cleanText(data.message, 8000); if (!message) throw new AIError('Message is required');
    const { subjectId, topicId, sessionId } = data; let conversation;
    if (sessionId) conversation = await this.getConversation(sessionId, userId);
    if (!conversation) {
      const recent = await query(`SELECT * FROM ai_conversations WHERE user_id = $1 AND last_message_at > NOW() - INTERVAL '24 hours' ORDER BY last_message_at DESC LIMIT 1`, [userId]);
      conversation = recent.rows[0];
    }
    if (!conversation) conversation = await this.createConversation({ userId, topicId: topicId || null, title: message.slice(0, 50), context: { subjectId, topicId } });
    await this.addMessage(conversation.id, { role: 'user', content: message });
    const contextText = formatContextForPrompt(await retrieveContext(userId, message, subjectId, topicId));
    const history = await query(`SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 20`, [conversation.id]);
    const messages = [
      { role: 'system', content: `You are an expert AI tutor for the Nigerian education curriculum. Use supplied curriculum context as the primary source. Never present an unsupported claim as a curriculum fact. If context is insufficient, clearly say so. Be clear and encouraging.\nCURRICULUM CONTEXT:\n${contextText || 'No matching curriculum context was found.'}` },
      ...(history.rows || []).reverse().map(m => ({ role: m.role, content: cleanText(m.content, 10000) })),
    ];
    const { content, tokensUsed } = await callLLM(messages);
    await this.addMessage(conversation.id, { role: 'assistant', content, tokensUsed, model: config.ai.defaultModel });
    await this.recordUsage({ userId, questionsAsked: 1, tokensUsed, conversationsStarted: 0 });
    return { message: { role: 'assistant', content }, sessionId: conversation.id };
  },

  async generateQuiz(data) {
    const questionCount = clampInt(data.questionCount, 1, 30, 10);
    const difficulty = ['easy', 'medium', 'hard'].includes(data.difficulty) ? data.difficulty : 'medium';
    const topicId = data.topicId || null;
    const existing = await query(`SELECT * FROM questions WHERE subject_id = $1 AND ($2::uuid IS NULL OR topic_id = $2) AND difficulty = $3 AND is_active = TRUE ORDER BY RANDOM() LIMIT $4`, [data.subjectId, topicId, difficulty, questionCount]);
    if (existing.rows.length >= questionCount) return { id: crypto.randomUUID(), questions: normalizeQuestions(existing.rows.map(q => ({ questionText: q.question_text, questionType: q.question_type, options: q.options, correctAnswer: q.correct_answer, explanation: q.explanation, difficulty: q.difficulty })), questionCount), createdAt: new Date().toISOString() };
    const contextText = formatContextForPrompt(await retrieveContext('', `questions ${data.subjectId}`, data.subjectId, topicId));
    const prompt = `Generate exactly ${questionCount} ${difficulty} quiz questions grounded only in the supplied curriculum context. Subject ID: ${data.subjectId}. Topic ID: ${topicId || 'none'}. Question types: ${(Array.isArray(data.questionTypes) ? data.questionTypes : ['mcq']).slice(0, 4).join(', ')}. Do not invent curriculum-specific facts. Return JSON {"questions":[{"questionText":"","questionType":"mcq","options":[],"correctAnswer":"","explanation":"","difficulty":"${difficulty}"}]}. Context:\n${contextText}`;
    try {
      const { content, tokensUsed } = await callLLM([{ role: 'system', content: 'You create accurate curriculum-grounded assessments. JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 6000, temperature: 0.2 });
      const parsed = parseJsonObject(content); const questions = normalizeQuestions(parsed?.questions, questionCount);
      if (!questions.length) throw new Error('AI returned no valid questions');
      await this.recordUsage({ userId: data.userId || null, questionsAsked: questions.length, tokensUsed, conversationsStarted: 0 });
      return { id: crypto.randomUUID(), questions, createdAt: new Date().toISOString() };
    } catch {
      return { id: crypto.randomUUID(), questions: normalizeQuestions(existing.rows.map(q => ({ questionText: q.question_text, questionType: q.question_type, options: q.options, correctAnswer: q.correct_answer, explanation: q.explanation, difficulty: q.difficulty })), questionCount), createdAt: new Date().toISOString() };
    }
  },

  async generateStudyPlan(data) {
    const hours = Math.min(24, Math.max(0.25, Number(data.availableHoursPerDay) || 2));
    const topicsResult = await query(`SELECT t.name, t.description, t.estimated_hours FROM topics t WHERE t.subject_id = $1 AND t.is_active = TRUE ORDER BY t.order_index`, [data.subjectId]);
    const topics = topicsResult.rows || []; const totalHours = topics.reduce((sum, t) => sum + (Number(t.estimated_hours) || 2), 0); const daysNeeded = Math.max(1, Math.ceil(totalHours / hours));
    const prompt = `Create a realistic study plan for Nigerian curriculum subject ${data.subjectId}. Available hours/day: ${hours}. Exam date: ${data.examDate || 'not specified'}. Target score: ${data.targetScore || 'not specified'}. Use ONLY these topics: ${topics.map(t => `${t.name} (${t.estimated_hours || 2}h)`).join(', ')}. Return JSON {"dailySchedule":[{"day":"Day 1","topics":[],"hours":0,"resources":[]}],"totalDurationDays":0}. Do not invent topic names or curriculum requirements.`;
    try { const { content } = await callLLM([{ role: 'system', content: 'You are a curriculum study planner. JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 5000, temperature: 0.2 }); const parsed = parseJsonObject(content); if (!Array.isArray(parsed?.dailySchedule)) throw new Error('Invalid plan'); return { id: crypto.randomUUID(), subjectId: data.subjectId, dailySchedule: parsed.dailySchedule.slice(0, 90), totalDurationDays: Number(parsed.totalDurationDays) || daysNeeded, createdAt: new Date().toISOString() }; }
    catch { let day = 1; const dailySchedule = topics.map(t => ({ day: `Day ${day++}`, topics: [t.name], hours: Math.min(hours, Number(t.estimated_hours) || 2), resources: [] })); return { id: crypto.randomUUID(), subjectId: data.subjectId, dailySchedule, totalDurationDays: daysNeeded, createdAt: new Date().toISOString() }; }
  },

  async explain(data) {
    const question = cleanText(data.question, 5000); if (!question) throw new AIError('Question is required');
    const level = ['beginner', 'intermediate', 'advanced'].includes(data.level) ? data.level : 'intermediate';
    const contextText = formatContextForPrompt(await retrieveContext('', question, data.subjectId, data.topicId));
    const prompt = `Explain this question at ${level} level. Use the supplied curriculum context where relevant. Do not invent curriculum facts; distinguish general knowledge from supplied curriculum content. Question: ${question}\nContext:\n${contextText || 'No matching context.'}\nReturn JSON {"explanation":"","keyPoints":[],"examples":[]}.`;
    try { const { content } = await callLLM([{ role: 'system', content: 'You are an accurate Nigerian curriculum explainer. JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 5000, temperature: 0.2 }); const parsed = parseJsonObject(content); if (!cleanText(parsed?.explanation, 20)) throw new Error('Invalid explanation'); return { explanation: cleanText(parsed.explanation, 12000), keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 20) : [], examples: Array.isArray(parsed.examples) ? parsed.examples.slice(0, 10) : [] }; }
    catch { return { explanation: 'The AI explanation could not be generated safely. Please review the lesson or textbook for this topic.', keyPoints: [], examples: [] }; }
  },

  async generateFlashcards(data) {
    const count = clampInt(data.count, 1, 50, 10);
    const result = await query(`SELECT t.id, t.name, t.description FROM topics t WHERE t.subject_id = $1 AND ($2::uuid IS NULL OR t.id = $2) AND t.is_active = TRUE ORDER BY t.order_index LIMIT $3`, [data.subjectId, data.topicId || null, count]);
    const rows = result.rows || [];
    if (rows.length >= count) return { flashcards: rows.map(t => ({ id: crypto.randomUUID(), front: t.name, back: t.description || `Review the key concepts in ${t.name}.`, subjectId: data.subjectId, topicId: t.id })) };
    const contextText = formatContextForPrompt(await retrieveContext('', `flashcards ${data.subjectId}`, data.subjectId, data.topicId));
    try { const { content } = await callLLM([{ role: 'system', content: 'Generate accurate curriculum-grounded flashcards. JSON only.' }, { role: 'user', content: `Generate up to ${count} flashcards for subject ${data.subjectId}${data.topicId ? ` and topic ${data.topicId}` : ''}. Use only the supplied context and do not invent facts. Return {"flashcards":[{"front":"","back":""}]}. Context:\n${contextText}` }], { json: true, maxTokens: 5000, temperature: 0.2 }); const parsed = parseJsonObject(content); const cards = normalizeFlashcards(parsed?.flashcards, count); if (!cards.length) throw new Error('No valid cards'); return { flashcards: cards.map(c => ({ ...c, subjectId: data.subjectId, topicId: data.topicId || null })) }; }
    catch { return { flashcards: rows.map(t => ({ id: crypto.randomUUID(), front: t.name, back: t.description || '', subjectId: data.subjectId, topicId: t.id })) }; }
  },

  async summarize(data) {
    const source = cleanText(data.content, 12000); if (!source) throw new AIError('Content is required');
    try { const { content } = await callLLM([{ role: 'system', content: 'Summarize faithfully. Do not add facts not present in the source. JSON only.' }, { role: 'user', content: `Summarize this ${cleanText(data.type, 40) || 'lesson'} in ${cleanText(data.length, 20) || 'medium'} length. Return {"summary":"","keyPoints":[],"readingTimeMinutes":0}. Source:\n${source}` }], { json: true, maxTokens: 3000, temperature: 0.2 }); const parsed = parseJsonObject(content); if (!cleanText(parsed?.summary, 20)) throw new Error('Invalid summary'); return { summary: cleanText(parsed.summary, 6000), keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 20) : [], readingTimeMinutes: Number(parsed.readingTimeMinutes) || Math.max(1, Math.ceil(source.length / 1000)) }; }
    catch { return { summary: source.slice(0, 500) + (source.length > 500 ? '…' : ''), keyPoints: [], readingTimeMinutes: Math.max(1, Math.ceil(source.length / 1000)) }; }
  },

  async recordUsage(data) {
    if (!data.userId) return;
    await query(`INSERT INTO ai_usage (user_id, date, questions_asked, tokens_used, conversations_started) VALUES ($1, CURRENT_DATE, $2, $3, $4)
      ON CONFLICT (user_id, date) DO UPDATE SET questions_asked = ai_usage.questions_asked + EXCLUDED.questions_asked, tokens_used = ai_usage.tokens_used + EXCLUDED.tokens_used, conversations_started = ai_usage.conversations_started + EXCLUDED.conversations_started`, [data.userId, Number(data.questionsAsked) || 0, Number(data.tokensUsed) || 0, Number(data.conversationsStarted) || 0]);
  },

  async getUserUsageStats(userId) {
    const result = await query(`SELECT COALESCE(SUM(questions_asked),0) AS total_questions, COALESCE(SUM(tokens_used),0) AS total_tokens, COUNT(DISTINCT date) AS active_days FROM ai_usage WHERE user_id = $1`, [userId]);
    return result.rows[0];
  },

  async getUsageStats(userId) {
    const today = new Date().toISOString().slice(0, 10); const month = `${today.slice(0, 7)}-01`;
    const result = await query(`SELECT (SELECT COALESCE(SUM(questions_asked),0) FROM ai_usage WHERE user_id=$1) AS total_requests,
      (SELECT COALESCE(SUM(questions_asked),0) FROM ai_usage WHERE user_id=$1 AND date=$2) AS requests_today,
      (SELECT COALESCE(SUM(questions_asked),0) FROM ai_usage WHERE user_id=$1 AND date >= $3) AS requests_this_month,
      (SELECT COUNT(*) FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE user_id=$1)) AS total_messages`, [userId, today, month]);
    const row = result.rows[0] || {}; return { totalRequests: Number(row.total_requests) || 0, requestsToday: Number(row.requests_today) || 0, requestsThisMonth: Number(row.requests_this_month) || 0, mostUsedFeature: 'tutor' };
  },
};

export default aiService;
