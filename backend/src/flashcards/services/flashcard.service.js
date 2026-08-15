import { query, getClient, transaction } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 90];

export const flashcardModel = {
  async findById(id) {
    const result = await query('SELECT * FROM flashcards WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { front, back, courseId, subjectId, topicId, userId, tags, difficulty } = data;
    const result = await query(
      `INSERT INTO flashcards (front, back, course_id, subject_id, topic_id, created_by, tags, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [front, back, courseId, subjectId, topicId, userId, JSON.stringify(tags || []), difficulty || 'medium']
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE flashcards SET
         front = COALESCE($2, front),
         back = COALESCE($3, back),
         difficulty = COALESCE($4, difficulty),
         tags = COALESCE($5, tags)
       WHERE id = $1 RETURNING *`,
      [id, data.front, data.back, data.difficulty, data.tags ? JSON.stringify(data.tags) : null]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM flashcards WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async listByCourse(courseId, params = {}) {
    const { page = 1, limit = 20, difficulty } = params;
    const conditions = ['course_id = $1'];
    const values = [courseId];
    let paramIndex = 2;

    if (difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      values.push(difficulty);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM flashcards ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM flashcards ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async listByUser(userId, params = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT f.*, fr.next_review_date, fr.repetition_level, fr.ease_factor
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id AND fr.user_id = $1
       WHERE f.created_by = $1
       ORDER BY f.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findByCourse(courseId) {
    const result = await query('SELECT * FROM flashcards WHERE course_id = $1 ORDER BY created_at ASC', [courseId]);
    return result.rows;
  },
};

export const flashcardReviewModel = {
  async upsert(userId, flashcardId, rating) {
    const result = await query(
      `INSERT INTO flashcard_reviews (user_id, flashcard_id, rating, last_reviewed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, flashcard_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         last_reviewed_at = NOW(),
         review_count = flashcard_reviews.review_count + 1,
         ease_factor = CASE
           WHEN flashcard_reviews.ease_factor IS NULL THEN 2.5
           ELSE GREATEST(1.3, flashcard_reviews.ease_factor + (0.1 - (5 - EXCLUDED.rating) * 0.08) * (EXCLUDED.rating - 3))
         END,
         repetition_level = CASE
           WHEN EXCLUDED.rating >= 4 THEN flashcard_reviews.repetition_level + 1
           ELSE 0
         END,
         next_review_date = CASE
           WHEN EXCLUDED.rating >= 4 THEN
             NOW() + INTERVAL '1 day' * CEIL(POWER(2, flashcard_reviews.repetition_level) * flashcard_reviews.ease_factor)
           ELSE NOW()
         END
       RETURNING *`,
      [userId, flashcardId, rating]
    );
    return result.rows[0];
  },

  async getDueReviews(userId) {
    const result = await query(
      `SELECT fr.*, f.front, f.back, f.id as flashcard_id
       FROM flashcard_reviews fr
       JOIN flashcards f ON fr.flashcard_id = f.id
       WHERE fr.user_id = $1 AND fr.next_review_date <= NOW()
       ORDER BY fr.next_review_date ASC`,
      [userId]
    );
    return result.rows;
  },

  async getReviewStats(userId) {
    const result = await query(
      `SELECT
         COUNT(*)::int as total_reviews,
         COUNT(CASE WHEN rating >= 4 THEN 1 END)::int as known_count,
         COUNT(CASE WHEN rating = 3 THEN 1 END)::int as getting_there_count,
         COUNT(CASE WHEN rating <= 2 THEN 1 END)::int as still_learning_count,
         AVG(ease_factor)::numeric(3,2) as avg_ease_factor
       FROM flashcard_reviews
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },

  async getNextReviewDate(userId, flashcardId) {
    const result = await query(
      `SELECT next_review_date FROM flashcard_reviews WHERE user_id = $1 AND flashcard_id = $2`,
      [userId, flashcardId]
    );
    return result.rows[0]?.next_review_date || null;
  },
};

export const flashcardService = {
  async createFlashcard(userId, data) {
    return flashcardModel.create({ ...data, userId });
  },

  async getDueFlashcards(userId) {
    return flashcardReviewModel.getDueReviews(userId);
  },

  async reviewFlashcard(userId, flashcardId, rating) {
    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', HTTP_STATUS.BAD_REQUEST, 'INVALID_RATING');
    }
    const flashcard = await flashcardModel.findById(flashcardId);
    if (!flashcard) throw new AppError('Flashcard not found', HTTP_STATUS.NOT_FOUND, 'FLASHCARD_NOT_FOUND');

    return transaction(async (client) => {
      await flashcardReviewModel.upsert(userId, flashcardId, rating);
      await query(
        `UPDATE flashcards SET last_reviewed_at = NOW() WHERE id = $1`,
        [flashcardId]
      );
    });
  },

  async generateFromCourse(courseId, userId) {
    const questions = await query(
      `SELECT q.question_text, q.options, q.correct_answer, q.explanation
       FROM questions q
       JOIN course_sections cs ON q.topic_id = cs.topic_id
       WHERE cs.course_id = $1
       ORDER BY RANDOM() LIMIT 20`,
      [courseId]
    );

    const flashcards = questions.rows.map(q => ({
      front: q.question_text,
      back: `${q.explanation || 'See explanation'}`,
      courseId,
      userId,
    }));

    const created = [];
    for (const card of flashcards) {
      created.push(await flashcardModel.create(card));
    }
    return created;
  },

  async getStats(userId) {
    const stats = await flashcardReviewModel.getReviewStats(userId);
    const due = await flashcardReviewModel.getDueReviews(userId);
    return { ...stats, dueCount: due.length };
  },

  async deleteFlashcard(userId, flashcardId) {
    const flashcard = await flashcardModel.findById(flashcardId);
    if (!flashcard || flashcard.createdBy !== userId) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
    }
    return flashcardModel.delete(flashcardId);
  },
};

export default flashcardService;
