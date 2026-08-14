import { query } from '../../common/database/index.js';

export const lessonModel = {
  async findById(id) {
    const result = await query('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(courseId, slug) {
    const result = await query(
      'SELECT * FROM lessons WHERE course_id = $1 AND slug = $2',
      [courseId, slug]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      courseId, sectionId, topicId, subtopicId, title, slug, description,
      learningObjectives, contentType, videoUrl, videoDurationSeconds,
      videoThumbnailUrl, writtenContent, keyPoints, orderIndex,
      isFree, isPublished, estimatedMinutes,
    } = data;
    const result = await query(
      `INSERT INTO lessons (
         course_id, section_id, topic_id, subtopic_id, title, slug, description,
         learning_objectives, content_type, video_url, video_duration_seconds,
         video_thumbnail_url, written_content, key_points, order_index,
         is_free, is_published, estimated_minutes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        courseId, sectionId, topicId, subtopicId, title, slug, description,
        learningObjectives, contentType, videoUrl, videoDurationSeconds,
        videoThumbnailUrl, writtenContent, keyPoints, orderIndex,
        isFree, isPublished, estimatedMinutes,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE lessons SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         learning_objectives = COALESCE($4, learning_objectives),
         content_type = COALESCE($5, content_type),
         video_url = COALESCE($6, video_url),
         video_duration_seconds = COALESCE($7, video_duration_seconds),
         video_thumbnail_url = COALESCE($8, video_thumbnail_url),
         written_content = COALESCE($9, written_content),
         key_points = COALESCE($10, key_points),
         order_index = COALESCE($11, order_index),
         is_free = COALESCE($12, is_free),
         is_published = COALESCE($13, is_published),
         estimated_minutes = COALESCE($14, estimated_minutes)
       WHERE id = $1
       RETURNING *`,
      [
        id, data.title, data.description, data.learningObjectives,
        data.contentType, data.videoUrl, data.videoDurationSeconds,
        data.videoThumbnailUrl, data.writtenContent, data.keyPoints,
        data.orderIndex, data.isFree, data.isPublished, data.estimatedMinutes,
      ]
    );
    return result.rows[0] || null;
  },

  async incrementViews(id) {
    await query('UPDATE lessons SET view_count = view_count + 1 WHERE id = $1', [id]);
  },

  async incrementCompletions(id) {
    await query('UPDATE lessons SET completion_count = completion_count + 1 WHERE id = $1', [id]);
  },

  async listByCourse(courseId) {
    const result = await query(
      'SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index',
      [courseId]
    );
    return result.rows;
  },

  async list({ page = 1, limit = 20, courseId, sectionId, topicId, isPublished } = {}) {
    const conditions = [];
    const values = [];

    if (courseId) {
      conditions.push(`course_id = $${values.length + 1}`);
      values.push(courseId);
    }
    if (sectionId) {
      conditions.push(`section_id = $${values.length + 1}`);
      values.push(sectionId);
    }
    if (topicId) {
      conditions.push(`topic_id = $${values.length + 1}`);
      values.push(topicId);
    }
    if (isPublished !== undefined) {
      conditions.push(`is_published = $${values.length + 1}`);
      values.push(isPublished);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM lessons ${whereClause} ORDER BY order_index LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM lessons WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default lessonModel;
