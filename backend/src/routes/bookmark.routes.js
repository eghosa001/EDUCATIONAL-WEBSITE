import { Router } from 'express';
import { authMiddleware } from '../common/middleware/index.js';
import * as bookmarkController from '../bookmarks/controllers/bookmark.controller.js';

export const bookmarkRoutes = Router();

bookmarkRoutes.use(authMiddleware);

bookmarkRoutes.get('/', bookmarkController.listBookmarks);
bookmarkRoutes.get('/courses', bookmarkController.getCourseBookmarks);
bookmarkRoutes.get('/count', bookmarkController.getBookmarkCount);
bookmarkRoutes.post('/', bookmarkController.createBookmark);
bookmarkRoutes.delete('/:id', bookmarkController.deleteBookmark);
