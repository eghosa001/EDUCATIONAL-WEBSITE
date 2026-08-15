import { query } from '../common/database/index.js';
import { AppError } from '../common/errors/index.js';
import { HTTP_STATUS } from '../common/constants/index.js';

export const flashcardController = {
  async create(req, res, next) {
    try {
      const flashcard = await flashcardService.createFlashcard(req.user.id, req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, data: flashcard });
    } catch (error) {
      next(error);
    }
  },

  async listByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const flashcards = await flashcardService.listByCourse(courseId, req.query);
      res.json({ success: true, data: flashcards });
    } catch (error) {
      next(error);
    }
  },

  async review(req, res, next) {
    try {
      const { flashcardId } = req.params;
      const { rating } = req.body;
      const result = await flashcardService.reviewFlashcard(req.user.id, flashcardId, rating);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getDue(req, res, next) {
    try {
      const flashcards = await flashcardService.getDueFlashcards(req.user.id);
      res.json({ success: true, data: flashcards });
    } catch (error) {
      next(error);
    }
  },

  async generateFromCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const flashcards = await flashcardService.generateFromCourse(courseId, req.user.id);
      res.json({ success: true, data: flashcards });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await flashcardService.getStats(req.user.id);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};

export const pastQuestionController = {
  async list(req, res, next) {
    try {
      const result = await pastQuestionModel.list(req.query);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  async listByBoard(req, res, next) {
    try {
      const { board } = req.params;
      const result = await pastQuestionModel.listByBoard(board, req.query);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },

  async getQuestionsForPractice(req, res, next) {
    try {
      const { board, subjectId } = req.params;
      const questions = await pastQuestionService.getQuestionsForPractice(board, subjectId, null, parseInt(req.query.count) || 20);
      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  },

  async generateTimedTest(req, res, next) {
    try {
      const { board, subjectId } = req.params;
      const test = await pastQuestionService.generateTimedTest(board, subjectId, parseInt(req.query.count) || 40);
      res.json({ success: true, data: test });
    } catch (error) {
      next(error);
    }
  },

  async getAnalytics(req, res, next) {
    try {
      const { board } = req.params;
      const analytics = await pastQuestionService.getAnalytics(board, req.query.subjectId);
      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  },
};

export const assessmentEngineController = {
  async generateRandomQuiz(req, res, next) {
    try {
      const quiz = await assessmentEngine.generateRandomQuiz(req.body);
      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  },

  async generateWeightedQuiz(req, res, next) {
    try {
      const quiz = await assessmentEngine.generateWeightedQuiz(req.body);
      res.json({ success: true, data: quiz });
    } catch (error) {
      next(error);
    }
  },

  async validateAnswer(req, res, next) {
    try {
      const { questionId } = req.params;
      const result = await assessmentEngine.validateAnswer(questionId, req.body.userAnswer);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async calculateScore(req, res, next) {
    try {
      const result = await assessmentEngine.calculateScore(req.body.answers, req.body.questions);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

export const contentApprovalController = {
  async submitForReview(req, res, next) {
    try {
      const workflow = await contentApprovalService.submitForReview(
        req.body.contentType,
        req.body.contentId,
        req.user.id,
        req.body
      );
      res.status(HTTP_STATUS.CREATED).json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  },

  async reviewContent(req, res, next) {
    try {
      const result = await contentApprovalService.reviewContent(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async publishContent(req, res, next) {
    try {
      const workflow = await contentApprovalService.publishContent(req.params.id, req.user.id);
      res.json({ success: true, data: workflow });
    } catch (error) {
      next(error);
    }
  },

  async getPendingReviews(req, res, next) {
    try {
      const reviews = await contentApprovalService.getPendingReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  },

  async getReviewStats(req, res, next) {
    try {
      const stats = await contentApprovalService.getReviewStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};

export const notificationDispatcherController = {
  async sendNotification(req, res, next) {
    try {
      const result = await notificationDispatcher.send(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async sendToMultiple(req, res, next) {
    try {
      const { userIds, ...notificationData } = req.body;
      const results = await notificationDispatcher.sendToMultiple(userIds, notificationData);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  },

  async getChannelPreferences(req, res, next) {
    try {
      const preferences = await notificationDispatcher.getChannelPreferences(req.user.id);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  },
};

export const liveClassController = {
  async createClass(req, res, next) {
    try {
      const class_ = await liveClassService.createClass(req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, data: class_ });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingClasses(req, res, next) {
    try {
      const classes = await liveClassService.getUpcomingClasses(req.user.id);
      res.json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  },

  async joinClass(req, res, next) {
    try {
      const attendance = await liveClassService.joinClass(req.params.id, req.user.id);
      res.json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  },

  async getClassParticipants(req, res, next) {
    try {
      const participants = await liveClassService.getClassParticipants(req.params.id);
      res.json({ success: true, data: participants });
    } catch (error) {
      next(error);
    }
  },

  async getClassAnalytics(req, res, next) {
    try {
      const analytics = await liveClassService.getClassAnalytics(req.params.id);
      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  },
};

export const searchIndexerController = {
  async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await searchIndexer.search(q, req.query);
      res.json({ success: true, data: results.data, pagination: results.pagination });
    } catch (error) {
      next(error);
    }
  },

  async searchGlobal(req, res, next) {
    try {
      const { q } = req.query;
      const results = await searchIndexer.searchGlobal(q, req.query);
      res.json({ success: true, data: results.data, pagination: results.pagination });
    } catch (error) {
      next(error);
    }
  },

  async getSuggestions(req, res, next) {
    try {
      const { q } = req.query;
      const suggestions = await searchIndexer.getSearchSuggestions(q, parseInt(req.query.limit) || 5);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  },

  async refreshIndex(req, res, next) {
    try {
      await searchIndexer.refreshIndex();
      res.json({ success: true, message: 'Search index refreshed successfully' });
    } catch (error) {
      next(error);
    }
  },
};

export const certificateController = {
  async generate(req, res, next) {
    try {
      const { courseId } = req.params;
      const certificate = await certificateService.generateCertificate(req.user.id, courseId);
      res.json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  },

  async download(req, res, next) {
    try {
      const { id } = req.params;
      const certificate = await certificateService.getCertificate(id);
      if (!certificate) throw new AppError('Certificate not found', HTTP_STATUS.NOT_FOUND);

      res.download(`certificates/${id}.pdf`, `${certificate.certificateNumber}.pdf`);
    } catch (error) {
      next(error);
    }
  },

  async verify(req, res, next) {
    try {
      const { certificateNumber } = req.params;
      const certificate = await certificateService.verifyCertificate(certificateNumber);
      if (!certificate) {
        return res.json({ success: false, data: null, message: 'Certificate not found' });
      }
      res.json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  },

  async getUserCertificates(req, res, next) {
    try {
      const certificates = await certificateService.getUserCertificates(req.user.id);
      res.json({ success: true, data: certificates });
    } catch (error) {
      next(error);
    }
  },
};

export const moderationController = {
  async getQueue(req, res, next) {
    try {
      const queue = await moderationService.getQueue(req.query);
      res.json({ success: true, data: queue.data, pagination: queue.pagination });
    } catch (error) {
      next(error);
    }
  },

  async review(req, res, next) {
    try {
      const result = await moderationService.review(req.params.id, req.user.id, req.body.action, req.body.notes);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async flagContent(req, res, next) {
    try {
      const result = await moderationService.flagContent({ ...req.body, reportedBy: req.user.id });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await moderationService.getContentStats();
      const pending = await moderationService.getPendingCount();
      res.json({ success: true, data: { stats, pending } });
    } catch (error) {
      next(error);
    }
  },
};
