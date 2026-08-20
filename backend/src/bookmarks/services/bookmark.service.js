import { bookmarkModel } from '../models/bookmark.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const bookmarkService = {
  async listBookmarks(userId) {
    return await bookmarkModel.findByUser(userId);
  },

  async getCourseBookmarks(userId) {
    return await bookmarkModel.getCourseBookmarks(userId);
  },

  async createBookmark(userId, courseId, lessonId = null) {
    const exists = await bookmarkModel.exists(userId, courseId, lessonId);
    if (exists) return exists;
    return await bookmarkModel.create({ userId, courseId, lessonId });
  },

  async deleteBookmark(id, userId) {
    const bookmark = await bookmarkModel.findById(id);
    if (!bookmark) throw new AppError('Bookmark not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    if (bookmark.user_id !== userId) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    }
    return await bookmarkModel.delete(id, userId);
  },

  async getBookmarkCount(userId) {
    return await bookmarkModel.count(userId);
  },
};
