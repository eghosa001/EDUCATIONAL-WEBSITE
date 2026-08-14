import { query } from '../../common/database/index.js';
import { config } from '../../common/config/index.js';
import { AIError } from '../../common/errors/index.js';

let openaiClient = null;
try {
  if (config.ai.bynara.apiKey) {
    const OpenAI = (await import('openai')).default;
    openaiClient = new OpenAI({
      apiKey: config.ai.bynara.apiKey,
      baseURL: config.ai.bynara.baseURL,
    });
  }
} catch {
  openaiClient = null;
}

const callLLM = async (messages, options = {}) => {
  if (!openaiClient) {
    return {
      content: `[Local Response] I understand your question about ${messages[messages.length - 1]?.content?.slice(0, 50) || 'your topic'}. As an AI tutor for the Nigerian curriculum, I would explain this concept step by step based on your current level.`,
      tokensUsed: 0,
    };
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: options.model || config.ai.defaultModel || 'agnes-2.5-flash',
      messages,
      temperature: options.temperature ?? config.ai.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? config.ai.maxTokens ?? 2048,
      response_format: options.json ? { type: 'json_object' } : undefined,
    });
    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;
    return { content, tokensUsed };
  } catch (error) {
    throw new AIError(`AI service error: ${error.message}`);
  }
};

const retrieveContext = async (userId, message, subjectId, topicId) => {
  const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  const likeClauses = keywords.map((_, i) => `$${i + 4}`).join(' OR ');
  const params = [subjectId, topicId, userId, ...keywords];

  const [lessons, topics, library, questions] = await Promise.all([
    query(
      `SELECT l.title, l.written_content
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
       WHERE l.written_content IS NOT NULL
         AND (c.subject_id = $1 OR l.topic_id = $2)
         AND (${likeClauses.replace(/\$/g, 'l.written_content ILIKE %')})
       LIMIT 3`,
      params
    ),
    query(
      `SELECT t.name, t.description, t.learning_objectives
       FROM topics t
       WHERE (t.subject_id = $1 OR t.id = $2)
         AND (${likeClauses.replace(/\$/g, 't.name ILIKE %')})
       LIMIT 3`,
      params
    ),
    query(
      `SELECT lr.title, lr.description
       FROM library_resources lr
       WHERE lr.subject_id = $1
         AND (${likeClauses.replace(/\$/g, 'lr.title ILIKE %')})
       LIMIT 3`,
      params
    ),
    query(
      `SELECT q.question_text, q.explanation, q.correct_answer
       FROM questions q
       WHERE q.subject_id = $1
         AND (${likeClauses.replace(/\$/g, 'q.question_text ILIKE %')})
       LIMIT 3`,
      params
    ),
  ]);

  const context = {
    lessons: lessons.rows,
    topics: topics.rows,
    library: library.rows,
    questions: questions.rows,
  };
  return context;
};

const formatContextForPrompt = (context) => {
  const parts = [];
  if (context.lessons?.length) parts.push(`LESSONS:\n${context.lessons.map(l => `- ${l.title}: ${l.written_content?.slice(0, 500)}`).join('\n')}`);
  if (context.topics?.length) parts.push(`TOPICS:\n${context.topics.map(t => `- ${t.name}: ${t.description} Objectives: ${JSON.stringify(t.learning_objectives || [])}`).join('\n')}`);
  if (context.library?.length) parts.push(`LIBRARY:\n${context.library.map(l => `- ${l.title}: ${l.description}`).join('\n')}`);
  if (context.questions?.length) parts.push(`PAST QUESTIONS:\n${context.questions.map(q => `- Q: ${q.question_text} A: ${JSON.stringify(q.correct_answer)} Explanation: ${q.explanation}`).join('\n')}`);
  return parts.join('\n\n');
};

export const aiService = {
  async createConversation(data) {
    const result = await query(
      `INSERT INTO ai_conversations (user_id, course_id, lesson_id, topic_id, title, context)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.userId, data.courseId || null, data.lessonId || null, data.topicId || null, data.title, data.context || '{}']
    );
    return result.rows[0];
  },

  async listConversations(userId, params = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY last_message_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async addMessage(conversationId, data) {
    const result = await query(
      `INSERT INTO ai_messages (conversation_id, role, content, tokens_used, model)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [conversationId, data.role, data.content, data.tokensUsed || 0, data.model || 'default']
    );

    await query(
      `UPDATE ai_conversations SET message_count = message_count + 1, last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    return result.rows[0];
  },

  async getConversation(conversationId, userId) {
    const result = await query(
      `SELECT c.*, array_agg(m ORDER BY m.created_at) as messages
       FROM ai_conversations c
       LEFT JOIN ai_messages m ON m.conversation_id = c.id
       WHERE c.id = $1 AND c.user_id = $2
       GROUP BY c.id`,
      [conversationId, userId]
    );
    return result.rows[0];
  },

  async chat(userId, data) {
    const { message, subjectId, topicId, sessionId } = data;

    let conversation;
    if (sessionId) {
      conversation = await this.getConversation(sessionId, userId);
    } else {
      const recent = await query(
        `SELECT * FROM ai_conversations WHERE user_id = $1 AND last_message_at > NOW() - INTERVAL '24 hours'
         ORDER BY last_message_at DESC LIMIT 1`,
        [userId]
      );
      conversation = recent.rows[0];
    }

    if (!conversation) {
      const title = message.slice(0, 50);
      conversation = await this.createConversation({
        userId,
        courseId: null,
        lessonId: null,
        topicId: subjectId || null,
        title,
        context: { subjectId, topicId },
      });
    }

    await this.addMessage(conversation.id, { role: 'user', content: message });

    const context = await retrieveContext(userId, message, subjectId, topicId);
    const contextText = formatContextForPrompt(context);

    const systemPrompt = `You are an expert AI tutor for the Nigerian education curriculum. 
You teach students from primary through university level.
Use the provided curriculum context to give accurate, grounded answers.
If the context doesn't contain the answer, say so and provide a general explanation.
Be encouraging, clear, and use examples relevant to Nigerian students.
Current context:
${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(await query(
        `SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at`,
        [conversation.id]
      )).rows.map(m => ({ role: m.role, content: m.content })),
    ];

    const { content, tokensUsed } = await callLLM(messages);

    await this.addMessage(conversation.id, { role: 'assistant', content, tokensUsed, model: config.ai.defaultModel });
    await this.recordUsage({ userId, questionsAsked: 1, tokensUsed, conversationsStarted: 0 });

    return {
      message: { role: 'assistant', content },
      sessionId: conversation.id,
    };
  },

  async generateQuiz(data) {
    const { subjectId, topicId, difficulty = 'medium', questionCount = 10, questionTypes = ['mcq'] } = data;

    const existingResult = await query(
      `SELECT * FROM questions
       WHERE subject_id = $1 AND ($2::uuid IS NULL OR topic_id = $2) AND difficulty = $3 AND is_active = TRUE
       ORDER BY RANDOM() LIMIT $4`,
      [subjectId, topicId || null, difficulty, questionCount]
    );

    if (existingResult.rows.length >= questionCount) {
      return {
        id: crypto.randomUUID(),
        questions: existingResult.rows.slice(0, questionCount).map(q => ({
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
        createdAt: new Date().toISOString(),
      };
    }

    const context = await retrieveContext('', 'quiz generation', subjectId, topicId);
    const contextText = formatContextForPrompt(context);

    const prompt = `Generate ${questionCount} ${difficulty} level quiz questions for the Nigerian curriculum.
Subject ID: ${subjectId}${topicId ? `, Topic ID: ${topicId}` : ''}
Context: ${contextText}
Question types: ${questionTypes.join(', ')}
Return JSON: { "questions": [{ "questionText", "questionType", "options", "correctAnswer", "explanation", "difficulty" }] }`;

    try {
      const { content, tokensUsed } = await callLLM([{ role: 'system', content: 'You are a Nigerian curriculum quiz generator. Output valid JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 4096 });
      const parsed = JSON.parse(content);
      await this.recordUsage({ userId: data.userId || '', questionsAsked: 0, tokensUsed, conversationsStarted: 0 });
      return { id: crypto.randomUUID(), questions: parsed.questions, createdAt: new Date().toISOString() };
    } catch {
      return {
        id: crypto.randomUUID(),
        questions: existingResult.rows.map(q => ({
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
        createdAt: new Date().toISOString(),
      };
    }
  },

  async generateStudyPlan(data) {
    const { subjectId, targetScore, availableHoursPerDay, examDate } = data;

    const topicsResult = await query(
      `SELECT t.name, t.description, t.estimated_hours
       FROM topics t
       WHERE t.subject_id = $1 AND t.is_active = TRUE
       ORDER BY t.order_index`,
      [subjectId]
    );

    const topics = topicsResult.rows;
    const totalHours = topics.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 2), 0);
    const daysNeeded = Math.ceil(totalHours / availableHoursPerDay);

    const prompt = `Create a study plan for Nigerian curriculum subject ${subjectId}.
Available hours per day: ${availableHoursPerDay}
Exam date: ${examDate || 'not specified'}
Target score: ${targetScore || 'not specified'}
Topics: ${topics.map(t => `${t.name} (${t.estimated_hours || 2}h)`).join(', ')}
Return JSON: { "dailySchedule": [{ "day", "topics": [], "hours", "resources": [] }], "totalDurationDays" }`;

    try {
      const { content } = await callLLM([{ role: 'system', content: 'You are a Nigerian curriculum study planner. Output valid JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 4096 });
      const parsed = JSON.parse(content);
      return { id: crypto.randomUUID(), subjectId, dailySchedule: parsed.dailySchedule, totalDurationDays: parsed.totalDurationDays || daysNeeded, createdAt: new Date().toISOString() };
    } catch {
      let day = 1;
      const dailySchedule = [];
      for (const topic of topics) {
        const hours = Math.min(availableHoursPerDay, parseFloat(topic.estimated_hours) || 2);
        dailySchedule.push({ day: `Day ${day++}`, topics: [topic.name], hours, resources: [] });
      }
      return { id: crypto.randomUUID(), subjectId, dailySchedule, totalDurationDays: daysNeeded, createdAt: new Date().toISOString() };
    }
  },

  async explain(data) {
    const { question, subjectId, topicId, level = 'intermediate' } = data;
    const context = await retrieveContext('', question, subjectId, topicId);
    const contextText = formatContextForPrompt(context);

    const levelPrompt = level === 'beginner' ? 'Explain like I am 12 years old, using simple language and everyday Nigerian examples.' :
      level === 'advanced' ? 'Provide a deep technical explanation with mathematical/formal details.' :
      'Explain clearly with examples suitable for a secondary school student.';

    const prompt = `${levelPrompt}
Question: ${question}
Curriculum context:
${contextText}
Return JSON: { "explanation", "keyPoints": [], "examples": [] }`;

    try {
      const { content } = await callLLM([{ role: 'system', content: 'You are a Nigerian curriculum explainer. Output valid JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 4096 });
      const parsed = JSON.parse(content);
      return { explanation: parsed.explanation, keyPoints: parsed.keyPoints || [], examples: parsed.examples || [] };
    } catch {
      return { explanation: `Based on the ${level} level, here is an explanation for: ${question}`, keyPoints: ['Review your textbook', 'Practice similar questions'], examples: [] };
    }
  },

  async generateFlashcards(data) {
    const { subjectId, topicId, count = 10 } = data;

    const topicsResult = await query(
      `SELECT t.name, t.description
       FROM topics t
       WHERE t.subject_id = $1 AND ($2::uuid IS NULL OR t.id = $2) AND t.is_active = TRUE
       LIMIT $3`,
      [subjectId, topicId || null, count]
    );

    if (topicsResult.rows.length >= count) {
      return {
        flashcards: topicsResult.rows.slice(0, count).map((t, i) => ({
          id: crypto.randomUUID(),
          front: t.name,
          back: t.description || `Key concepts for ${t.name}`,
          subjectId,
          topicId: t.id,
        })),
      };
    }

    const prompt = `Generate ${count} flashcards for Nigerian curriculum subject ${subjectId}${topicId ? ` topic ${topicId}` : ''}.
Return JSON: { "flashcards": [{ "front", "back", "subjectId", "topicId" }] }`;

    try {
      const { content } = await callLLM([{ role: 'system', content: 'You are a flashcard generator. Output valid JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 4096 });
      const parsed = JSON.parse(content);
      return { flashcards: parsed.flashcards };
    } catch {
      return { flashcards: topicsResult.rows.map((t, i) => ({ id: crypto.randomUUID(), front: t.name, back: t.description, subjectId, topicId: t.id })) };
    }
  },

  async summarize(data) {
    const { content, type = 'lesson', length = 'medium' } = data;
    const prompt = `Summarize this ${type} content in ${length} length for a Nigerian student.
Content: ${content.slice(0, 8000)}
Return JSON: { "summary", "keyPoints": [], "readingTimeMinutes" }`;

    try {
      const { content: summaryContent } = await callLLM([{ role: 'system', content: 'You are a summarizer. Output valid JSON only.' }, { role: 'user', content: prompt }], { json: true, maxTokens: 2048 });
      const parsed = JSON.parse(summaryContent);
      return { summary: parsed.summary, keyPoints: parsed.keyPoints || [], readingTimeMinutes: parsed.readingTimeMinutes || Math.ceil(content.length / 1000) };
    } catch {
      return { summary: content.slice(0, 500) + '...', keyPoints: ['Key point 1', 'Key point 2'], readingTimeMinutes: 5 };
    }
  },

  async recordUsage(data) {
    await query(
      `INSERT INTO ai_usage (user_id, date, questions_asked, tokens_used, conversations_started)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET
         questions_asked = ai_usage.questions_asked + EXCLUDED.questions_asked,
         tokens_used = ai_usage.tokens_used + EXCLUDED.tokens_used,
         conversations_started = ai_usage.conversations_started + EXCLUDED.conversations_started`,
      [data.userId, data.questionsAsked, data.tokensUsed, data.conversationsStarted]
    );
  },

  async getUserUsageStats(userId) {
    const result = await query(
      `SELECT COALESCE(SUM(questions_asked), 0) as total_questions,
              COALESCE(SUM(tokens_used), 0) as total_tokens,
              COUNT(DISTINCT date) as active_days
       FROM ai_usage WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  async getUsageStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const result = await query(
      `SELECT
         (SELECT COALESCE(SUM(questions_asked), 0) FROM ai_usage WHERE user_id = $1) as total_requests,
         (SELECT COALESCE(SUM(questions_asked), 0) FROM ai_usage WHERE user_id = $1 AND date = $2) as requests_today,
         (SELECT COALESCE(SUM(questions_asked), 0) FROM ai_usage WHERE user_id = $1 AND date >= $3) as requests_this_month,
         (SELECT COUNT(*) FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = $1)) as total_messages`,
      [userId, today, `${thisMonth}-01`]
    );
    const row = result.rows[0];
    return {
      totalRequests: parseInt(row.total_requests),
      requestsToday: parseInt(row.requests_today),
      requestsThisMonth: parseInt(row.requests_this_month),
      mostUsedFeature: 'tutor',
    };
  },
};

export default aiService;