import { query } from '../../common/database/index.js';
import libraryResourceModel from '../models/libraryResource.model.js';

export const libraryService = {
  async list(params) {
    return libraryResourceModel.list(params);
  },

  async getById(id) {
    const resource = await libraryResourceModel.findById(id);
    if (!resource) throw new Error('Resource not found');
    return resource;
  },

  async getBySlug(slug) {
    return libraryResourceModel.findBySlug(slug);
  },

  async create(data) {
    return libraryResourceModel.create(data);
  },

  async update(id, data) {
    return libraryResourceModel.update(id, data);
  },

  async delete(id) {
    return libraryResourceModel.delete(id);
  },

  async search(queryText, filters = {}) {
    const conditions = ["(title ILIKE $1 OR description ILIKE $1)"];
    const values = [`%${queryText}%`];
    let paramIndex = 2;

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      values.push(filters.resourceType);
    }
    if (filters.subjectId) {
      conditions.push(`subject_id = $${paramIndex++}`);
      values.push(filters.subjectId);
    }
    if (filters.classId) {
      conditions.push(`class_id = $${paramIndex++}`);
      values.push(filters.classId);
    }
    if (filters.examBoard) {
      conditions.push(`exam_board = $${paramIndex++}`);
      values.push(filters.examBoard);
    }
    if (filters.isFree !== undefined) {
      conditions.push(`is_free = $${paramIndex++}`);
      values.push(filters.isFree);
    }

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT * FROM library_resources WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
      values
    );
    return result.rows;
  },

  async incrementViews(id) {
    await query('UPDATE library_resources SET view_count = view_count + 1 WHERE id = $1', [id]);
  },

  async getPastQuestions(board, year, limit = 50) {
    const conditions = [`exam_board = $1`];
    const values = [board];
    let idx = 2;
    if (year) { conditions.push(`exam_year = $${idx++}`); values.push(year); }
    const result = await query(
      `SELECT * FROM library_resources WHERE ${conditions.join(' AND ')} AND resource_type = 'past_question'
       ORDER BY exam_year DESC, created_at DESC LIMIT $${idx}`,
      [...values, limit]
    );
    return result.rows;
  },
};

export default libraryService;
