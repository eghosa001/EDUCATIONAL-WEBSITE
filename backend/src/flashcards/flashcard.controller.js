import flashcardModel from './models/flashcard.model.js';
import { AppError, HTTP_STATUS } from '../common/errors/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

export const listFlashcards = async (req, res) => {
  const { page, limit, courseId, difficulty } = req.query;
  const { data, pagination } = await flashcardModel.listByCourse(courseId || undefined, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    difficulty,
  });

  res.json({ success: true, data: { flashcards: data }, pagination });
};

export const getFlashcard = async (req, res) => {
  const { id } = req.params;
  const flashcard = await flashcardModel.findById(id);
  if (!flashcard) notFound('Flashcard');

  res.json({ success: true, data: { flashcard } });
};

export const createFlashcard = async (req, res) => {
  const { courseId, subjectId, topicId, front, back, difficulty } = req.body;
  const userId = req.user.id;

  if (!front || !back) {
    throw new AppError('Front and back are required', HTTP_STATUS.BAD_REQUEST, 'MISSING_FIELDS');
  }

  const flashcard = await flashcardModel.create({
    front, back, courseId, subjectId, topicId, userId, difficulty,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Flashcard created',
    data: { flashcard },
  });
};

export const updateFlashcard = async (req, res) => {
  const { id } = req.params;
  const flashcard = await flashcardModel.update(id, req.body);
  if (!flashcard) notFound('Flashcard');

  res.json({ success: true, message: 'Flashcard updated', data: { flashcard } });
};

export const deleteFlashcard = async (req, res) => {
  const { id } = req.params;
  const flashcard = await flashcardModel.delete(id);
  if (!flashcard) notFound('Flashcard');

  res.json({ success: true, message: 'Flashcard deleted' });
};

export const getMyFlashcards = async (req, res) => {
  const { page, limit, difficulty } = req.query;
  const { data, pagination } = await flashcardModel.listByUser(req.user.id, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    difficulty,
  });
  res.json({ success: true, data: { flashcards: data }, pagination });
};