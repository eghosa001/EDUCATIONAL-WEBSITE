import { Router } from 'express';
import { authMiddleware } from '../common/middleware/index.js';
import * as documentController from '../documents/controllers/document.controller.js';

export const documentRoutes = Router();

documentRoutes.get('/', documentController.listDocuments);
documentRoutes.get('/search', documentController.searchDocuments);
documentRoutes.get('/buckets', documentController.getDocumentBuckets);
documentRoutes.get('/subjects', documentController.getDocumentSubjects);
documentRoutes.get('/years', documentController.getDocumentYears);
documentRoutes.get('/:id', documentController.getDocument);
documentRoutes.get('/:id/download', documentController.getDocumentDownload);
