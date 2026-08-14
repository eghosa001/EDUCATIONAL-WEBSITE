import { query } from '../../common/database/index.js';

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
};

export default aiService;
