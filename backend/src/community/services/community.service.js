import forumModel from '../models/forum.model.js';
import forumMemberModel from '../models/forumMember.model.js';
import postModel from '../models/post.model.js';
import commentModel from '../models/comment.model.js';
import postLikeModel from '../models/postLike.model.js';
import commentLikeModel from '../models/commentLike.model.js';
import studyGroupModel from '../models/studyGroup.model.js';
import studyGroupMemberModel from '../models/studyGroupMember.model.js';
import studyGroupMessageModel from '../models/studyGroupMessage.model.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

const notFound = (message) => {
  throw new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

export const communityService = {
  async listForums(params) {
    return forumModel.list(params);
  },

  async getForum(id) {
    const forum = await forumModel.findById(id);
    if (!forum) notFound('Forum');
    return forum;
  },

  async createForum(data) {
    return forumModel.create(data);
  },

  async updateForum(id, userId, data) {
    const forum = await forumModel.update(id, data);
    if (!forum) notFound('Forum');
    return forum;
  },

  async deleteForum(id, userId) {
    const forum = await forumModel.delete(id);
    if (!forum) notFound('Forum');
    return forum;
  },

  async joinForum(forumId, userId) {
    const forum = await forumModel.findById(forumId);
    if (!forum) notFound('Forum');

    const existing = await forumMemberModel.findByForumAndUser(forumId, userId);
    if (existing) throw new AppError('Already a member', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);

    const member = await forumMemberModel.add(forumId, userId);
    await forumModel.incrementMemberCount(forumId, 1);
    return member;
  },

  async leaveForum(forumId, userId) {
    const member = await forumMemberModel.remove(forumId, userId);
    if (!member) notFound('Membership');
    await forumModel.incrementMemberCount(forumId, -1);
    return member;
  },

  async listForumMembers(forumId, params) {
    return forumMemberModel.listByForum(forumId, params);
  },

  async listForumPosts(forumId, params) {
    const forum = await forumModel.findById(forumId);
    if (!forum) notFound('Forum');
    return postModel.listByForum(forumId, params);
  },

  async getPost(id) {
    const post = await postModel.findById(id);
    if (!post) notFound('Post');
    await postModel.incrementViews(id);
    return post;
  },

  async createPost(data) {
    const post = await postModel.create(data);
    if (data.forumId) await forumModel.incrementPostCount(data.forumId, 1);
    return post;
  },

  async updatePost(id, userId, data) {
    const post = await postModel.update(id, userId, data);
    if (!post) notFound('Post');
    return post;
  },

  async deletePost(id, userId) {
    const post = await postModel.delete(id, userId);
    if (!post) notFound('Post');
    if (post.forum_id) await forumModel.incrementPostCount(post.forum_id, -1);
    return post;
  },

  async likePost(postId, userId) {
    const existing = await postLikeModel.findByPostAndUser(postId, userId);
    if (existing) throw new AppError('Already liked', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    await postLikeModel.add(postId, userId);
    await postModel.incrementLikeCount(postId, 1);
    return { success: true };
  },

  async unlikePost(postId, userId) {
    const existing = await postLikeModel.findByPostAndUser(postId, userId);
    if (!existing) throw new AppError('Not liked', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    await postLikeModel.remove(postId, userId);
    await postModel.incrementLikeCount(postId, -1);
    return { success: true };
  },

  async listPostReplies(postId, params) {
    return commentModel.listByPost(postId, params);
  },

  async createReply(data) {
    const reply = await commentModel.create(data);
    await postModel.incrementReplyCount(data.postId, 1);
    await postModel.updateLastReplyAt(data.postId);
    return reply;
  },

  async updateReply(id, userId, content) {
    const reply = await commentModel.update(id, userId, content);
    if (!reply) notFound('Reply');
    return reply;
  },

  async deleteReply(id, userId) {
    const reply = await commentModel.delete(id, userId);
    if (!reply) notFound('Reply');
    await postModel.incrementReplyCount(reply.post_id, -1);
    return reply;
  },

  async likeComment(commentId, userId) {
    const existing = await commentLikeModel.findByCommentAndUser(commentId, userId);
    if (existing) throw new AppError('Already liked', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    await commentLikeModel.add(commentId, userId);
    await commentModel.incrementLikeCount(commentId, 1);
    return { success: true };
  },

  async unlikeComment(commentId, userId) {
    const existing = await commentLikeModel.findByCommentAndUser(commentId, userId);
    if (!existing) throw new AppError('Not liked', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    await commentLikeModel.remove(commentId, userId);
    await commentModel.incrementLikeCount(commentId, -1);
    return { success: true };
  },

  async listStudyGroups(params) {
    return studyGroupModel.list(params);
  },

  async getStudyGroup(id) {
    const group = await studyGroupModel.findById(id);
    if (!group) notFound('Study group');
    return group;
  },

  async createStudyGroup(data) {
    const group = await studyGroupModel.create(data);
    await studyGroupMemberModel.add(group.id, data.creatorId, 'owner');
    return group;
  },

  async updateStudyGroup(id, userId, data) {
    const group = await studyGroupModel.update(id, userId, data);
    if (!group) notFound('Study group');
    return group;
  },

  async deleteStudyGroup(id, userId) {
    const group = await studyGroupModel.delete(id, userId);
    if (!group) notFound('Study group');
    return group;
  },

  async joinStudyGroup(groupId, userId, joinCode) {
    const group = await studyGroupModel.findById(groupId);
    if (!group) notFound('Study group');
    if (group.is_private && group.join_code !== joinCode) {
      throw new AppError('Invalid join code', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const existing = await studyGroupMemberModel.findByGroupAndUser(groupId, userId);
    if (existing) throw new AppError('Already a member', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    if (group.member_count >= group.max_members) {
      throw new AppError('Group is full', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const member = await studyGroupMemberModel.add(groupId, userId);
    await studyGroupModel.incrementMemberCount(groupId, 1);
    return member;
  },

  async leaveStudyGroup(groupId, userId) {
    const group = await studyGroupModel.findById(groupId);
    if (!group) notFound('Study group');
    if (group.creator_id === userId) {
      throw new AppError('Creator cannot leave, transfer ownership or delete group', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const member = await studyGroupMemberModel.remove(groupId, userId);
    if (!member) notFound('Membership');
    await studyGroupModel.incrementMemberCount(groupId, -1);
    return member;
  },

  async listStudyGroupMembers(groupId, params) {
    return studyGroupMemberModel.listByGroup(groupId, params);
  },

  async listStudyGroupMessages(groupId, params) {
    return studyGroupMessageModel.listByGroup(groupId, params);
  },

  async sendStudyGroupMessage(data) {
    const member = await studyGroupMemberModel.findByGroupAndUser(data.groupId, data.authorId);
    if (!member) throw new AppError('Not a member of this group', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    return studyGroupMessageModel.create(data);
  },

  async deleteStudyGroupMessage(id, userId) {
    return studyGroupMessageModel.delete(id, userId);
  },
};

export default communityService;