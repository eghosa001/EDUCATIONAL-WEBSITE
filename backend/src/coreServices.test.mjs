import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { query, pool } from './common/database/index.js';
import { create: createUser } from './users/services/user.service.js';
import { create: createCourse } from './courses/services/course.service.js';
import { getOverview } from './progress/services/progress.service.js';
import { create: createExam } from './exams/services/exam.service.js';
import { create: createQuestion } from './questions/services/question.service.js';
import { validateSubscriptionAccess } from './subscriptions/services/subscription.service.js';
import { initializePayment } from './payments/services/payment.service.js';
import { createConversation, addMessage } from './ai/services/ai.service.js';
import { create: createNotification } from './notifications/services/notification.service.js';
import { getProfile: getTeacherProfile } from './teachers/services/teacher.service.js';
import { getProfile: getParentProfile } from './parents/services/parent.service.js';
import { awardPoints } from './gamification/services/gamification.service.js';
import { createForum, createPost } from './community/services/community.service.js';

const cleanup = async () => {
  await query('DELETE FROM student_courses');
  await query('DELETE FROM lesson_progress');
  await query('DELETE FROM study_sessions');
  await query('DELETE FROM exam_attempts');
  await query('DELETE FROM exam_answers');
  await query('DELETE FROM submissions');
  await query('DELETE FROM quiz_attempts');
  await query('DELETE FROM courses');
  await query('DELETE FROM lessons');
  await query('DELETE FROM exams');
  await query('DELETE FROM questions');
  await query('DELETE FROM quizzes');
  await query('DELETE FROM notifications');
  await query('DELETE FROM ai_conversations');
  await query('DELETE FROM ai_messages');
  await query('DELETE FROM ai_usage');
  await query('DELETE FROM subscriptions');
  await query('DELETE FROM payments');
  await query('DELETE FROM teacher_earnings');
  await query('DELETE FROM live_classes');
  await query('DELETE FROM forums');
  await query('DELETE FROM forum_members');
  await query('DELETE FROM community_posts');
  await query('DELETE FROM comments');
  await query('DELETE FROM post_likes');
  await query('DELETE FROM comment_likes');
  await query('DELETE FROM study_groups');
  await query('DELETE FROM study_group_members');
  await query('DELETE FROM study_group_messages');
  await query('DELETE FROM badges');
  await query('DELETE FROM achievements');
  await query('DELETE FROM student_points');
  await query('DELETE FROM points_history');
  await query('DELETE FROM rewards');
  await query('DELETE FROM user_rewards');
  await query('DELETE FROM parent_children');
  await query('DELETE FROM parents');
  await query('DELETE FROM teachers');
  await query("DELETE FROM users WHERE email LIKE 'test%'");
};

describe('Core Services Smoke Tests', () => {
  before(async () => {
    await cleanup();
  });

  after(async () => {
    await cleanup();
    await pool.end();
  });

  it('Database connection works', async () => {
    const result = await query('SELECT 1 as test');
    assert.strictEqual(result.rows[0].test, 1);
  });

  it('User service: create and find user', async () => {
    const user = await userService.create({
      email: 'test-user@example.com',
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'User',
    });
    assert.ok(user.id);
    assert.strictEqual(user.email, 'test-user@example.com');

    const found = await userService.getById(user.id);
    assert.strictEqual(found.id, user.id);
  });

  it('Course service: create and list courses', async () => {
    const teacher = await userService.create({
      email: 'test-teacher@example.com',
      passwordHash: 'hashed',
      firstName: 'Teacher',
      lastName: 'Test',
    });

    const course = await courseService.create({
      teacherId: teacher.id,
      title: 'Test Course',
      slug: 'test-course',
      shortDescription: 'A test course',
    });
    assert.ok(course.id);
    assert.strictEqual(course.title, 'Test Course');

    const list = await courseService.list({ page: 1, limit: 10 });
    assert.ok(list.data.length > 0);
  });

  it('Progress service: get overview', async () => {
    const user = await userService.create({
      email: 'test-progress@example.com',
      passwordHash: 'hashed',
      firstName: 'Progress',
      lastName: 'Test',
    });

    const overview = await progressService.getOverview(user.id);
    assert.ok(typeof overview.enrolledCourses === 'number');
    assert.ok(typeof overview.completedLessons === 'number');
  });

  it('Exam service: create and list exams', async () => {
    const exam = await examService.create({
      title: 'Test Exam',
      slug: 'test-exam',
      examType: 'practice',
      durationMinutes: 60,
    });
    assert.ok(exam.id);
    assert.strictEqual(exam.title, 'Test Exam');

    const list = await examService.list({ page: 1, limit: 10 });
    assert.ok(list.data.length > 0);
  });

  it('Question service: create and find question', async () => {
    const question = await questionService.create({
      questionType: 'mcq',
      questionText: 'What is 2+2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
        { id: 'c', text: '5' },
        { id: 'd', text: '6' },
      ],
      correctAnswer: 'b',
      difficulty: 'easy',
    });
    assert.ok(question.id);
    assert.strictEqual(question.question_text, 'What is 2+2?');

    const found = await questionService.findById(question.id);
    assert.strictEqual(found.id, question.id);
  });

  it('Subscription service: validate subscription access', async () => {
    const user = await userService.create({
      email: 'test-sub@example.com',
      passwordHash: 'hashed',
      firstName: 'Sub',
      lastName: 'Test',
    });

    const { hasAccess, message } = await subscriptionService.validateSubscriptionAccess(user.id);
    assert.ok(typeof hasAccess === 'boolean');
    assert.ok(message);
  });

  it('Payment service: initialize payment', async () => {
    const user = await userService.create({
      email: 'test-payment@example.com',
      passwordHash: 'hashed',
      firstName: 'Payment',
      lastName: 'Test',
    });

    const wallet = await (await import('./subscriptions/models/subscription.model.js')).walletModel.findByUserId(user.id);
    if (!wallet) {
      await query('INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 10000, \'NGN\')', [user.id]);
    }

    const result = await initializePayment(user.id, {
      amount: 1000,
      currency: 'NGN',
      gateway: 'wallet',
      purpose: 'test',
    });
    assert.ok(result.success);
    assert.ok(result.data.payment.id);
  });

  it('AI service: create conversation and add message', async () => {
    const user = await userService.create({
      email: 'test-ai@example.com',
      passwordHash: 'hashed',
      firstName: 'AI',
      lastName: 'Test',
    });

    const conv = await aiService.createConversation({
      userId: user.id,
      title: 'Test Conversation',
    });
    assert.ok(conv.id);

    const msg = await aiService.addMessage(conv.id, { role: 'user', content: 'Hello' });
    assert.ok(msg.id);
  });

  it('Notification service: create and list', async () => {
    const user = await userService.create({
      email: 'test-notify@example.com',
      passwordHash: 'hashed',
      firstName: 'Notify',
      lastName: 'Test',
    });

    await notificationService.create({
      userId: user.id,
      type: 'test',
      title: 'Test Notification',
      body: 'Test body',
    });

    const list = await notificationService.listByUser(user.id, { page: 1, limit: 10 });
    assert.ok(list.length > 0);
  });

  it('Teacher service: get or create profile', async () => {
    const user = await userService.create({
      email: 'test-teacher-svc@example.com',
      passwordHash: 'hashed',
      firstName: 'Teacher',
      lastName: 'Service',
    });

    const profile = await teacherService.getProfile(user.id);
    assert.strictEqual(profile.userId, user.id);
    assert.strictEqual(profile.firstName, 'Teacher');
  });

  it('Parent service: get or create profile', async () => {
    const user = await userService.create({
      email: 'test-parent-svc@example.com',
      passwordHash: 'hashed',
      firstName: 'Parent',
      lastName: 'Service',
    });

    const profile = await parentService.getProfile(user.id);
    assert.strictEqual(profile.userId, user.id);
    assert.strictEqual(profile.firstName, 'Parent');
  });

  it('Gamification service: award points and get points', async () => {
    const user = await userService.create({
      email: 'test-gamification@example.com',
      passwordHash: 'hashed',
      firstName: 'Game',
      lastName: 'User',
    });

    const points = await gamificationService.awardPoints(user.id, 'lesson_completed');
    assert.ok(points.totalPoints >= 10);
  });

  it('Community service: create forum and post', async () => {
    const user = await userService.create({
      email: 'test-community@example.com',
      passwordHash: 'hashed',
      firstName: 'Community',
      lastName: 'User',
    });

    const forum = await communityService.createForum({
      name: 'Test Forum',
      description: 'A test forum',
      createdBy: user.id,
    });
    assert.ok(forum.id);

    const post = await communityService.createPost({
      userId: user.id,
      forumId: forum.id,
      title: 'Test Post',
      content: 'Test content',
    });
    assert.ok(post.id);
  });
});