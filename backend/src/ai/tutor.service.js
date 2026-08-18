import { query, getClient } from '../common/database/index.js';
import { AppError } from '../common/errors/index.js';
import { HTTP_STATUS } from '../common/constants/index.js';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an educational AI tutor for Nigerian students. You help students from primary school through university level.
Always respond in a helpful, encouraging, and educational manner.
Consider the student's level and curriculum when answering.`;

const CONTEXT_PROMPT_TEMPLATE = `Student Context:
- Level: {level}
- Current Subject: {subject}
- Current Topic: {topic}
- Learning History: {history}
- Curriculum: {curriculum}

Previous questions: {previousQuestions}

Student Question: {question}`;

export const aiTutorService = {
  client: null,

  async initialize() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  },

  async getChatResponse(message, context = {}) {
    if (!this.client) await this.initialize();

    const {
      userId, studentLevel, currentSubject, currentTopic,
      learningHistory = [], previousQuestions = []
    } = context;

    const curriculumContext = await this.getCurriculumContext(studentLevel, currentSubject, currentTopic);
    const studentHistory = await this.getStudentLearningHistory(userId);

    const contextMessage = CONTEXT_PROMPT_TEMPLATE
      .replace('{level}', studentLevel || 'unknown')
      .replace('{subject}', currentSubject || 'general')
      .replace('{topic}', currentTopic || 'general')
      .replace('{history}', learningHistory.slice(-3).join(', ') || 'No history')
      .replace('{curriculum}', curriculumContext || 'General curriculum')
      .replace('{previousQuestions}', previousQuestions.slice(-2).map(q => q.question).join('; ') || 'None')
      .replace('{question}', message);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    await this.logAIUsage(userId, message, response.choices[0].message.content);

    return {
      response: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    };
  },

  async explainLikeImFive(question, subject, level) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Explain concepts like the student is 5 years old. Use simple language and analogies.' },
        { role: 'user', content: `Explain "${question}" in the context of ${subject || 'general studies'} for a ${level || 'young'} student.` },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });
    return response.choices[0].message.content;
  },

  async explainLikeImTen(question, subject, level) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Explain concepts like the student is 10 years old. Use age-appropriate language with some detail.' },
        { role: 'user', content: `Explain "${question}" in the context of ${subject || 'general studies'} for a ${level || 'middle school'} student.` },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    return response.choices[0].message.content;
  },

  async generateQuiz(topic, difficulty = 'medium', count = 10, questionType = 'mcq') {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Generate ${count} ${questionType.toUpperCase()} questions about "${topic}" at ${difficulty} difficulty. Return as JSON array with question, options (A-D), correctAnswer (A/B/C/D), and explanation.` },
        { role: 'user', content: `Generate quiz questions for topic: ${topic}` },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    });

    try {
      const content = response.choices[0].message.content;
      const questions = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]');
      return questions;
    } catch {
      return [{ question: content, type: 'text' }];
    }
  },

  async generateStudyPlan(subject, level, timeAvailable = '7 days') {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Generate a structured study plan with daily topics, resources, and practice questions.' },
        { role: 'user', content: `Create a ${timeAvailable} study plan for ${subject} at ${level} level.` },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });
    return response.choices[0].message.content;
  },

  async generateSummary(content, maxLength = 300) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize the content concisely while keeping key concepts.' },
        { role: 'user', content: `Summarize this content (max ${maxLength} characters): ${content}` },
      ],
      temperature: 0.5,
      max_tokens: maxLength,
    });
    return response.choices[0].message.content;
  },

  async generateFlashcards(topic, count = 10) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Generate ${count} flashcards about "${topic}". Return as JSON with front (question) and back (answer).` },
        { role: 'user', content: `Create flashcards for ${topic}` },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    try {
      const content = response.choices[0].message.content;
      const flashcards = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]');
      return flashcards.map(fc => ({ front: fc.front, back: fc.back }));
    } catch {
      return [];
    }
  },

  async getRAGResponse(question, userId) {
    const context = await this.searchEducationalDatabase(question, userId);
    const fullContext = context.map(item => item.content).join('\n\n');

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Use the following educational content to answer the student's question. If the content doesn't help, say so clearly.` },
        { role: 'user', content: `Educational Context:\n${fullContext}\n\nQuestion: ${question}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return {
      response: response.choices[0].message.content,
      sources: context.map(c => ({ id: c.id, type: c.type, title: c.title })),
    };
  },

  async searchEducationalDatabase(question, userId, limit = 5) {
    const userContext = await this.getUserLearningContext(userId);

    const result = await query(
      `SELECT id, type, title, content, subject_id, topic_id
       FROM educational_content
       WHERE content ILIKE $1 OR title ILIKE $1
       ORDER BY relevance_score DESC
       LIMIT $2`,
      [`%${question.split(' ').slice(0, 3).join('%')}%`, limit]
    );

    return result.rows;
  },

  async getUserLearningContext(userId) {
    const result = await query(
      `SELECT DISTINCT s.subject_id, s.topic_id, AVG(p.score) as avg_score
       FROM student_progress p
       JOIN subjects s ON p.subject_id = s.id
       WHERE p.user_id = $1
       GROUP BY s.subject_id, s.topic_id
       ORDER BY avg_score ASC
       LIMIT 5`,
      [userId]
    );
    return result.rows;
  },

  async getCurriculumContext(level, subject, topic) {
    if (!level && !subject) return '';
    const conditions = [];
    const values = [];
    if (level) { conditions.push(`name = $1`); values.push(level); }
    if (subject) { conditions.push(`name = $2`); values.push(subject); }
    if (topic) { conditions.push(`name = $3`); values.push(topic); }

    const result = await query(
      `SELECT name, description FROM curriculum_topics WHERE ${conditions.join(' AND ')}`,
      values
    );
    return result.rows.map(r => `${r.name}: ${r.description}`).join('; ');
  },

  async getStudentLearningHistory(userId, limit = 5) {
    const result = await query(
      `SELECT q.question_text, ea.is_correct, q.subject_id
       FROM exam_attempts ea
       JOIN exam_questions eq ON ea.exam_question_id = eq.id
       JOIN questions q ON eq.question_id = q.id
       WHERE ea.user_id = $1
       ORDER BY ea.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async logAIUsage(userId, question, response, metadata = {}) {
    await query(
      `INSERT INTO ai_usage (user_id, question, response, metadata)
       VALUES ($1, $2, $3, $4)`,
      [userId, question, response, JSON.stringify(metadata)]
    );
  },

  async getUsageStats(userId, days = 30) {
    const result = await query(
      `SELECT COUNT(*)::int as total_questions,
              COUNT(DISTINCT DATE(created_at))::int as active_days,
              SUM(LENGTH(response))::int as total_chars
       FROM ai_usage
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [userId]
    );
    return result.rows[0];
  },
};

export default aiTutorService;
