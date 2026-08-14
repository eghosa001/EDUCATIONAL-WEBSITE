import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler, validateRequest, authMiddleware, optionalAuthMiddleware } from '../common/middleware/index.js';
import { schemas } from '../common/validators/joi.js';
import * as communityController from '../community/controllers/community.controller.js';

export const communityRoutes = Router();

const forumSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  subjectId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  isPublic: Joi.boolean().default(true),
});

const postSchema = Joi.object({
  forumId: Joi.string().uuid().optional(),
  title: Joi.string().min(3).max(300).required(),
  content: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  courseId: Joi.string().uuid().optional(),
});

const replySchema = Joi.object({
  postId: Joi.string().uuid().required(),
  content: Joi.string().required(),
  parentId: Joi.string().uuid().optional(),
});

const studyGroupSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  subjectId: Joi.string().uuid().optional(),
  topicId: Joi.string().uuid().optional(),
  maxMembers: Joi.number().integer().min(2).max(500).default(100),
  isPrivate: Joi.boolean().default(false),
});

communityRoutes.get('/forums', optionalAuthMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listForums));
communityRoutes.get('/forums/:forumId', optionalAuthMiddleware, asyncHandler(communityController.getForum));
communityRoutes.post('/forums', authMiddleware, validateRequest(forumSchema), asyncHandler(communityController.createForum));
communityRoutes.patch('/forums/:forumId', authMiddleware, validateRequest(forumSchema), asyncHandler(communityController.updateForum));
communityRoutes.delete('/forums/:forumId', authMiddleware, asyncHandler(communityController.deleteForum));

communityRoutes.post('/forums/:forumId/join', authMiddleware, asyncHandler(communityController.joinForum));
communityRoutes.post('/forums/:forumId/leave', authMiddleware, asyncHandler(communityController.leaveForum));
communityRoutes.get('/forums/:forumId/members', authMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listForumMembers));

communityRoutes.get('/forums/:forumId/posts', optionalAuthMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listForumPosts));
communityRoutes.get('/posts/:postId', optionalAuthMiddleware, asyncHandler(communityController.getPost));
communityRoutes.post('/posts', authMiddleware, validateRequest(postSchema), asyncHandler(communityController.createPost));
communityRoutes.patch('/posts/:postId', authMiddleware, validateRequest(postSchema), asyncHandler(communityController.updatePost));
communityRoutes.delete('/posts/:postId', authMiddleware, asyncHandler(communityController.deletePost));

communityRoutes.post('/posts/:postId/like', authMiddleware, asyncHandler(communityController.likePost));
communityRoutes.delete('/posts/:postId/like', authMiddleware, asyncHandler(communityController.unlikePost));

communityRoutes.get('/posts/:postId/replies', optionalAuthMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listReplies));
communityRoutes.post('/replies', authMiddleware, validateRequest(replySchema), asyncHandler(communityController.createReply));
communityRoutes.patch('/replies/:replyId', authMiddleware, validateRequest(Joi.object({ content: Joi.string().required() })), asyncHandler(communityController.updateReply));
communityRoutes.delete('/replies/:replyId', authMiddleware, asyncHandler(communityController.deleteReply));

communityRoutes.get('/study-groups', optionalAuthMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listStudyGroups));
communityRoutes.get('/study-groups/:groupId', optionalAuthMiddleware, asyncHandler(communityController.getStudyGroup));
communityRoutes.post('/study-groups', authMiddleware, validateRequest(studyGroupSchema), asyncHandler(communityController.createStudyGroup));
communityRoutes.patch('/study-groups/:groupId', authMiddleware, validateRequest(studyGroupSchema), asyncHandler(communityController.updateStudyGroup));
communityRoutes.delete('/study-groups/:groupId', authMiddleware, asyncHandler(communityController.deleteStudyGroup));

communityRoutes.post('/study-groups/:groupId/join', authMiddleware, validateRequest(Joi.object({ joinCode: Joi.string().optional() })), asyncHandler(communityController.joinStudyGroup));
communityRoutes.post('/study-groups/:groupId/leave', authMiddleware, asyncHandler(communityController.leaveStudyGroup));
communityRoutes.get('/study-groups/:groupId/members', authMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listStudyGroupMembers));
communityRoutes.get('/study-groups/:groupId/messages', authMiddleware, validateRequest({ query: schemas.pagination }), asyncHandler(communityController.listStudyGroupMessages));
communityRoutes.post('/messages', authMiddleware, validateRequest(Joi.object({
  groupId: Joi.string().uuid().required(),
  content: Joi.string().required(),
  attachments: Joi.array().items(Joi.string()).optional(),
})), asyncHandler(communityController.sendStudyGroupMessage));
communityRoutes.delete('/messages/:messageId', authMiddleware, asyncHandler(communityController.deleteStudyGroupMessage));