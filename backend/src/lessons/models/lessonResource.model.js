import { query } from '../../common/database/index.js';

export const lessonResourceModel = {
  async findById(id) {
    const result = await query('SELECT * FROM lesson_resources WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      lessonId, title, resourceType, fileUrl, fileSizeBytes,
      mimeType, description, isDownloadable, orderIndex,
    } = data;
    const result = await query(
      `INSERT INTO lesson_resources (lesson_id, title, resource_type, file_url, file_size_bytes, mime_type, description, is_downloadable, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [lessonId, title, resourceType, fileUrl, fileSizeBytes, mimeType, description, isDownloadable, orderIndex]
    );
    return result.rows[0];
  },

  async listByLesson(lessonId) {
    const result = await query(
      'SELECT * FROM lesson_resources WHERE lesson_id = $1 ORDER BY order_index',
      [lessonId]
    );
    return result.rows;
  },

  async delete(id) {
    const result = await query('DELETE FROM lesson_resources WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default lessonResourceModel;
