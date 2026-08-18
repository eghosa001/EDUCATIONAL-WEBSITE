import { pastQuestionFileModel } from '../models/pastQuestionFile.model.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const listFiles = asyncHandler(async (req, res) => {
  const { page, limit, board, subject, year, isProcessed, search } = req.query;

  const { data, pagination } = await pastQuestionFileModel.list({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    board, subject,
    year: year ? parseInt(year) : undefined,
    isProcessed: isProcessed !== undefined ? isProcessed === 'true' : undefined,
    search,
  });

  res.json({ success: true, data: { files: data }, pagination });
});

export const listFilesByBoard = asyncHandler(async (req, res) => {
  const { page, limit, subject, year } = req.query;
  const { board } = req.params;

  const { data, pagination } = await pastQuestionFileModel.listByBoard(board, {
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
    subject,
    year: year ? parseInt(year) : undefined,
  });

  res.json({ success: true, data: { files: data }, pagination });
});

export const getFile = asyncHandler(async (req, res) => {
  const file = await pastQuestionFileModel.findById(req.params.id);
  if (!file) {
    throw new AppError('File not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  res.json({ success: true, data: { file } });
});

export const getSubjectsByBoard = asyncHandler(async (req, res) => {
  const subjects = await pastQuestionFileModel.getSubjectsByBoard(req.params.board);
  res.json({ success: true, data: { subjects } });
});

export const getYearsByBoard = asyncHandler(async (req, res) => {
  const years = await pastQuestionFileModel.getYearsByBoard(req.params.board);
  res.json({ success: true, data: { years } });
});

export const getBoards = asyncHandler(async (req, res) => {
  const boards = await pastQuestionFileModel.getBoards();
  res.json({ success: true, data: { boards } });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await pastQuestionFileModel.getStats();
  res.json({ success: true, data: { stats } });
});

export const markProcessed = asyncHandler(async (req, res) => {
  const { questionsExtracted } = req.body;
  const file = await pastQuestionFileModel.markProcessed(req.params.id, questionsExtracted || 0);
  if (!file) {
    throw new AppError('File not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  res.json({ success: true, message: 'File marked as processed', data: { file } });
});
