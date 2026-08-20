import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { bookmarkService } from '../services/bookmark.service.js';

export async function listBookmarks(req, res) {
  const bookmarks = await bookmarkService.listBookmarks(req.user.id);
  res.json({ success: true, data: bookmarks });
}

export async function getCourseBookmarks(req, res) {
  const bookmarks = await bookmarkService.getCourseBookmarks(req.user.id);
  res.json({ success: true, data: bookmarks });
}

export async function createBookmark(req, res) {
  const { courseId, lessonId } = req.body;
  if (!courseId) throw new AppError('courseId is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  const bookmark = await bookmarkService.createBookmark(req.user.id, courseId, lessonId || null);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: bookmark });
}

export async function deleteBookmark(req, res) {
  await bookmarkService.deleteBookmark(req.params.id, req.user.id);
  res.json({ success: true, message: 'Bookmark removed' });
}

export async function getBookmarkCount(req, res) {
  const count = await bookmarkService.getBookmarkCount(req.user.id);
  res.json({ success: true, data: { count } });
}
