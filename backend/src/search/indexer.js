import { query, getClient } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

const SEARCHABLE_TYPES = {
  course: 'courses',
  lesson: 'lessons',
  question: 'questions',
  past_question: 'past_questions',
  flashcard: 'flashcards',
  library_resource: 'library_resources',
  topic: 'topics',
  subject: 'subjects',
  teacher: 'teachers',
};

export const searchIndexer = {
  async indexContent(contentType, contentId, data) {
    const { title, content: textContent, keywords = [], subjectId, topicId } = data;

    const tsVector = toTsVector(title || '') || toTsVector(textContent || '');

    await query(
      `INSERT INTO search_index (content_type, content_id, title, content, keywords, relevance_score)
       VALUES ($1, $2, $3, $4, $5, 0.5)
       ON CONFLICT (content_type, content_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         keywords = EXCLUDED.keywords,
         updated_at = NOW()
       RETURNING id`,
      [contentType, contentId, title, tsVector, keywords]
    );
  },

  async removeContent(contentType, contentId) {
    await query('DELETE FROM search_index WHERE content_type = $1 AND content_id = $2', [contentType, contentId]);
  },

  async search(queryText, params = {}) {
    const {
      page = 1,
      limit = 20,
      contentType,
      subjectId,
      topicId,
      sortBy = 'relevance',
      filters = {},
    } = params;

    const searchQuery = toTsQuery(queryText);
    const offset = (page - 1) * limit;

    let conditions = ['content @@ $1'];
    const values = [searchQuery];
    let paramIndex = 2;

    if (contentType) {
      conditions.push(`content_type = $${paramIndex++}`);
      values.push(contentType);
    }
    if (subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(subjectId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${paramIndex++}`);
      values.push(topicId);
    }

    const whereClause = conditions.join(' AND ');

    const orderClause = sortBy === 'relevance'
      ? `ts_rank(content, $1) DESC`
      : sortBy === 'recent'
        ? 'created_at DESC'
        : 'relevance_score DESC';

    const result = await query(
      `SELECT *, ts_rank(content, $1) as rank
       FROM search_index
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, searchQuery, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM search_index WHERE ${whereClause}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    };
  },

  async searchGlobal(queryText, params = {}) {
    const results = await this.search(queryText, params);

    const enrichedResults = await Promise.all(
      results.data.map(async (item) => {
        let enrichedData = null;
        const typeMap = {
          course: () => query('SELECT id, title, description, thumbnail FROM courses WHERE id = $1', [item.content_id]),
          lesson: () => query('SELECT id, title, course_id FROM lessons WHERE id = $1', [item.content_id]),
          question: () => query('SELECT id, question_text, question_type FROM questions WHERE id = $1', [item.content_id]),
          past_question: () => query('SELECT id, question_text, board, year FROM past_questions WHERE id = $1', [item.content_id]),
          flashcard: () => query('SELECT id, front, back FROM flashcards WHERE id = $1', [item.content_id]),
          topic: () => query('SELECT id, name FROM topics WHERE id = $1', [item.content_id]),
          subject: () => query('SELECT id, name FROM subjects WHERE id = $1', [item.content_id]),
        };

        if (typeMap[item.contentType]) {
          const res = await typeMap[item.contentType]();
          enrichedData = res.rows[0];
        }

        return {
          ...item,
          enriched: enrichedData,
        };
      })
    );

    return {
      data: enrichedResults,
      pagination: results.pagination,
    };
  },

  async bulkIndex(contents) {
    for (const content of contents) {
      await this.indexContent(content.contentType, content.contentId, content.data);
    }
  },

  async refreshIndex() {
    await query('DELETE FROM search_index');

    const courses = await query('SELECT id, title, description FROM courses');
    for (const course of courses.rows) {
      await this.indexContent('course', course.id, { title: course.title, content: course.description });
    }

    const lessons = await query('SELECT id, title, description FROM lessons');
    for (const lesson of lessons.rows) {
      await this.indexContent('lesson', lesson.id, { title: lesson.title, content: lesson.description });
    }

    const subjects = await query('SELECT id, name FROM subjects');
    for (const subject of subjects.rows) {
      await this.indexContent('subject', subject.id, { title: subject.name });
    }

    const topics = await query('SELECT id, name FROM topics');
    for (const topic of topics.rows) {
      await this.indexContent('topic', topic.id, { title: topic.name });
    }
  },

  async getSearchSuggestions(queryText, limit = 5) {
    const searchQuery = toTsQuery(queryText);
    const result = await query(
      `SELECT DISTINCT si.title, si.content_type, COUNT(*)::int as count
       FROM search_index si
       WHERE si.content @@ $1
       GROUP BY si.title, si.content_type
       ORDER BY count DESC
       LIMIT $2`,
      [searchQuery, limit]
    );
    return result.rows;
  },
};

function toTsVector(text) {
  if (!text) return null;
  return text.split(/\s+/).filter(w => w.length > 2).join(' & ');
}

function toTsQuery(text) {
  if (!text) return null;
  const terms = text.split(/\s+/).filter(w => w.length > 2);
  if (terms.length === 0) return null;
  return terms.map(t => `${t}:*`).join(' & ');
}

export default searchIndexer;
