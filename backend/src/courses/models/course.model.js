import { query } from '../../common/database/index.js';

export const courseModel = {
  async findById(id) {
    const result = await query('SELECT * FROM courses WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM courses WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      subjectId, classId, termId, teacherId, title, slug,
      shortDescription, fullDescription, thumbnailUrl, previewVideoUrl,
      difficulty, status, price, currency, isFree, isFeatured,
    } = data;
    const result = await query(
      `INSERT INTO courses (
         subject_id, class_id, term_id, teacher_id, title, slug,
         short_description, full_description, thumbnail_url, preview_video_url,
         difficulty, status, price, currency, is_free, is_featured
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        subjectId, classId, termId, teacherId, title, slug,
        shortDescription, fullDescription, thumbnailUrl, previewVideoUrl,
        difficulty, status, price, currency, isFree, isFeatured,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE courses SET
         title = COALESCE($2, title),
         short_description = COALESCE($3, short_description),
         full_description = COALESCE($4, full_description),
         thumbnail_url = COALESCE($5, thumbnail_url),
         preview_video_url = COALESCE($6, preview_video_url),
         difficulty = COALESCE($7, difficulty),
         status = COALESCE($8, status),
         price = COALESCE($9, price),
         is_free = COALESCE($10, is_free),
         is_featured = COALESCE($11, is_featured),
         published_at = CASE WHEN $12::text IS NOT NULL THEN NOW() ELSE published_at END
       WHERE id = $1
       RETURNING *`,
      [
        id, data.title, data.shortDescription, data.fullDescription,
        data.thumbnailUrl, data.previewVideoUrl, data.difficulty,
        data.status, data.price, data.isFree, data.isFeatured,
        data.publish ? 'publish' : null,
      ]
    );
    return result.rows[0] || null;
  },

  async updateCounters(id, counters) {
    const result = await query(
      `UPDATE courses SET
         enrollment_count = COALESCE($2, enrollment_count),
         rating = COALESCE($3, rating),
         review_count = COALESCE($4, review_count),
         total_duration_hours = COALESCE($5, total_duration_hours),
         lesson_count = COALESCE($6, lesson_count)
       WHERE id = $1
       RETURNING *`,
      [id, counters.enrollmentCount, counters.rating, counters.reviewCount, counters.totalDurationHours, counters.lessonCount]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, status, subjectId, classId, teacherId, search, featured } = {}) {
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (subjectId) {
      conditions.push(`subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (classId) {
      conditions.push(`class_id = $${values.length + 1}`);
      values.push(classId);
    }
    if (teacherId) {
      conditions.push(`teacher_id = $${values.length + 1}`);
      values.push(teacherId);
    }
    if (featured) {
      conditions.push(`is_featured = TRUE`);
    }
    if (search) {
      conditions.push(`title ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM courses ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM courses ${whereClause}`,
      values.slice(0, values.length - 2)
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async delete(id) {
    const result = await query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default courseModel;
