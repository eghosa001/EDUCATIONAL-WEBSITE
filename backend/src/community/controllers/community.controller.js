import { communityService } from '../services/community.service.js';

export const listForums = async (req, res) => {
  const { page, limit, isPublic } = req.query;
  const { data, pagination } = await communityService.listForums({ page, limit, isPublic });
  res.json({ success: true, data: { forums: data }, pagination });
};

export const getForum = async (req, res) => {
  const forum = await communityService.getForum(req.params.forumId);
  res.json({ success: true, data: { forum } });
};

export const createForum = async (req, res) => {
  const forum = await communityService.createForum({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, message: 'Forum created', data: { forum } });
};

export const updateForum = async (req, res) => {
  const forum = await communityService.updateForum(req.params.forumId, req.user.id, req.body);
  res.json({ success: true, message: 'Forum updated', data: { forum } });
};

export const deleteForum = async (req, res) => {
  await communityService.deleteForum(req.params.forumId, req.user.id);
  res.json({ success: true, message: 'Forum deleted' });
};

export const joinForum = async (req, res) => {
  const member = await communityService.joinForum(req.params.forumId, req.user.id);
  res.json({ success: true, message: 'Joined forum', data: { member } });
};

export const leaveForum = async (req, res) => {
  await communityService.leaveForum(req.params.forumId, req.user.id);
  res.json({ success: true, message: 'Left forum' });
};

export const listForumMembers = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listForumMembers(req.params.forumId, { page, limit });
  res.json({ success: true, data: { members: data }, pagination });
};

export const listForumPosts = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listForumPosts(req.params.forumId, { page, limit });
  res.json({ success: true, data: { posts: data }, pagination });
};

export const listAllPosts = async (req, res) => {
  const { page, limit } = req.query;
  const { query } = await import('../../common/database/index.js');
  const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
  const result = await query(
    `SELECT cp.*, u.first_name, u.last_name, u.avatar_url, s.name AS subject_name
     FROM community_posts cp
     LEFT JOIN users u ON u.id = cp.user_id
     LEFT JOIN subjects s ON s.id = cp.subject_id
     WHERE cp.status = 'published'
     ORDER BY cp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [parseInt(limit) || 20, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM community_posts WHERE status = 'published'`);
  res.json({
    success: true,
    data: { posts: result.rows.map(r => ({
      ...r,
      authorName: r.first_name + ' ' + r.last_name,
      authorAvatar: r.avatar_url,
      subjectName: r.subject_name,
    })) },
    pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: parseInt(countResult.rows[0].total || 0), totalPages: Math.ceil(parseInt(countResult.rows[0].total || 0) / (parseInt(limit) || 20)) },
  });
};

export const getPost = async (req, res) => {
  const post = await communityService.getPost(req.params.postId);
  res.json({ success: true, data: { post } });
};

export const createPost = async (req, res) => {
  const post = await communityService.createPost({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, message: 'Post created', data: { post } });
};

export const updatePost = async (req, res) => {
  const post = await communityService.updatePost(req.params.postId, req.user.id, req.body);
  res.json({ success: true, message: 'Post updated', data: { post } });
};

export const deletePost = async (req, res) => {
  await communityService.deletePost(req.params.postId, req.user.id);
  res.json({ success: true, message: 'Post deleted' });
};

export const likePost = async (req, res) => {
  await communityService.likePost(req.params.postId, req.user.id);
  res.json({ success: true, message: 'Post liked' });
};

export const unlikePost = async (req, res) => {
  await communityService.unlikePost(req.params.postId, req.user.id);
  res.json({ success: true, message: 'Post unliked' });
};

export const listReplies = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listPostReplies(req.params.postId, { page, limit });
  res.json({ success: true, data: { replies: data }, pagination });
};

export const createReply = async (req, res) => {
  const reply = await communityService.createReply({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, message: 'Reply created', data: { reply } });
};

export const updateReply = async (req, res) => {
  const reply = await communityService.updateReply(req.params.replyId, req.user.id, req.body.content);
  res.json({ success: true, message: 'Reply updated', data: { reply } });
};

export const deleteReply = async (req, res) => {
  await communityService.deleteReply(req.params.replyId, req.user.id);
  res.json({ success: true, message: 'Reply deleted' });
};

export const listStudyGroups = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listStudyGroups({ page, limit });
  res.json({ success: true, data: { groups: data }, pagination });
};

export const getStudyGroup = async (req, res) => {
  const group = await communityService.getStudyGroup(req.params.groupId);
  res.json({ success: true, data: { group } });
};

export const createStudyGroup = async (req, res) => {
  const group = await communityService.createStudyGroup({ ...req.body, creatorId: req.user.id });
  res.status(201).json({ success: true, message: 'Study group created', data: { group } });
};

export const updateStudyGroup = async (req, res) => {
  const group = await communityService.updateStudyGroup(req.params.groupId, req.user.id, req.body);
  res.json({ success: true, message: 'Study group updated', data: { group } });
};

export const deleteStudyGroup = async (req, res) => {
  await communityService.deleteStudyGroup(req.params.groupId, req.user.id);
  res.json({ success: true, message: 'Study group deleted' });
};

export const joinStudyGroup = async (req, res) => {
  const { joinCode } = req.body;
  const member = await communityService.joinStudyGroup(req.params.groupId, req.user.id, joinCode);
  res.json({ success: true, message: 'Joined study group', data: { member } });
};

export const leaveStudyGroup = async (req, res) => {
  await communityService.leaveStudyGroup(req.params.groupId, req.user.id);
  res.json({ success: true, message: 'Left study group' });
};

export const listStudyGroupMembers = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listStudyGroupMembers(req.params.groupId, { page, limit });
  res.json({ success: true, data: { members: data }, pagination });
};

export const listStudyGroupMessages = async (req, res) => {
  const { page, limit } = req.query;
  const { data, pagination } = await communityService.listStudyGroupMessages(req.params.groupId, { page, limit });
  res.json({ success: true, data: { messages: data }, pagination });
};

export const sendStudyGroupMessage = async (req, res) => {
  const message = await communityService.sendStudyGroupMessage({ ...req.body, authorId: req.user.id });
  res.status(201).json({ success: true, message: 'Message sent', data: { message } });
};

export const deleteStudyGroupMessage = async (req, res) => {
  await communityService.deleteStudyGroupMessage(req.params.messageId, req.user.id);
  res.json({ success: true, message: 'Message deleted' });
};