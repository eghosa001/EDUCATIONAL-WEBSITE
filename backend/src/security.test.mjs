import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { authorizeUserRoute } from './common/middleware/userAuthorization.js';
import { requireRole, requirePermission } from './common/middleware/index.js';

const run = (request) => {
  let nextCalled = false;
  authorizeUserRoute(request, {}, () => { nextCalled = true; });
  return nextCalled;
};

const denied = (request) => assert.throws(() => authorizeUserRoute(request, {}, () => {}), /Not authorized|Administrator access required|Super administrator access required/);

test('user collection is administrator-only', () => {
  denied({ path: '/', params: {}, user: { id: 'u1', role: 'student' } });
  assert.equal(run({ path: '/', params: {}, user: { id: 'a1', role: 'content_admin' } }), true);
});

test('users can access only their own account', () => {
  assert.equal(run({ path: '/u1', params: {}, user: { id: 'u1', role: 'student' } }), true);
  denied({ path: '/u2', params: {}, user: { id: 'u1', role: 'student' } });
});

test('admins may inspect another user', () => {
  assert.equal(run({ path: '/u2', params: {}, user: { id: 'a1', role: 'content_admin' } }), true);
});

test('only super admins can change roles', () => {
  denied({ path: '/u1/roles', params: {}, user: { id: 'u1', role: 'student' } });
  denied({ path: '/u1/roles', params: {}, user: { id: 'a1', role: 'content_admin' } });
  assert.equal(run({ path: '/u1/roles', params: {}, user: { id: 'a1', role: 'super_admin' } }), true);
});

test('requireRole honors the normalized many-to-many role list', () => {
  let nextCalled = false;
  requireRole('super_admin')({ user: { role: 'student', roles: ['student', 'super_admin'] } }, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('super-admin wildcard permission is honored', () => {
  let nextCalled = false;
  requirePermission('manage_anything')({ user: { permissions: ['*'] } }, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('backend authentication supports verified Supabase sessions without unverified JWT decoding', () => {
  const source = fs.readFileSync(new URL('./common/middleware/index.js', import.meta.url), 'utf8');
  assert.match(source, /client\.auth\.getUser\(token\)/);
  assert.match(source, /verifyToken\(token\)/);
  assert.doesNotMatch(source, /jwt\.decode\(token\)/);
  assert.doesNotMatch(source, /decodeToken\(token\)/);
});

test('user service projects user_roles into the route-guard role field', () => {
  const source = fs.readFileSync(new URL('./users/services/user.service.js', import.meta.url), 'utf8');
  assert.match(source, /role:\s*primaryRole/);
  assert.match(source, /roles,\s*role:\s*primaryRole,\s*primaryRole,\s*permissions/);
  assert.match(source, /ROLE_PRIORITY/);
  assert.match(source, /useSupabase[\s\S]*getByTable\('users'/);
});

test('removing roles cannot delete the final super administrator', () => {
  const middleware = fs.readFileSync(new URL('./common/middleware/protectLastSuperAdmin.js', import.meta.url), 'utf8');
  const routes = fs.readFileSync(new URL('./routes/user.routes.js', import.meta.url), 'utf8');
  assert.match(middleware, /r\.name = 'super_admin'/);
  assert.match(middleware, /admins\.rowCount <= 1/);
  assert.match(middleware, /Cannot remove the last super administrator/);
  assert.match(routes, /protectLastSuperAdminRemoval/);
});

test('configured Supabase Auth, not DB transport mode, selects the mobile auth provider', () => {
  const routes = fs.readFileSync(new URL('./routes/auth.routes.js', import.meta.url), 'utf8');
  assert.match(routes, /const useSupabaseAuth = Boolean\(supabase\)/);
  assert.doesNotMatch(routes, /useSupabase \? supabaseHandler : legacyHandler/);
});

test('mobile auth uses canonical Supabase sessions and accepts body refresh tokens', () => {
  const routes = fs.readFileSync(new URL('./routes/auth.routes.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('./auth/controllers/supabaseAuth.controller.js', import.meta.url), 'utf8');
  assert.match(routes, /chooseAuthHandler\(authController\.register, supabaseAuthController\.registerWithSupabase\)/);
  assert.match(routes, /chooseAuthHandler\(authController\.login, supabaseAuthController\.loginWithSupabase\)/);
  assert.match(routes, /req\.body\?\.refreshToken/);
  assert.match(controller, /auth\.signUp\(/);
  assert.match(controller, /auth\.signInWithPassword\(/);
  assert.match(controller, /auth\.refreshSession\(/);
  assert.match(controller, /accessToken:\s*session\.access_token/);
  assert.match(controller, /refreshToken:\s*session\.refresh_token/);
  assert.match(controller, /auth\.verifyOtp\(\{ type: 'email', token_hash: token \}\)/);
  assert.match(controller, /auth\.resend\(\{ type: 'signup', email \}\)/);
});

test('registration preserves only allowed self-service roles through stripping validation', () => {
  const routes = fs.readFileSync(new URL('./routes/auth.routes.js', import.meta.url), 'utf8');
  assert.match(routes, /SELF_SERVICE_ROLES = new Set\(\['student', 'teacher', 'parent'\]\)/);
  assert.match(routes, /captureRegistrationRole/);
  assert.match(routes, /restoreRegistrationRole/);
  assert.match(routes, /req\.body\.role = req\.requestedRegistrationRole \|\| 'student'/);
  assert.doesNotMatch(routes, /super_admin[^\n]*SELF_SERVICE_ROLES/);
});

test('server Supabase clients do not persist or auto-refresh shared sessions', () => {
  const source = fs.readFileSync(new URL('./common/supabase/index.js', import.meta.url), 'utf8');
  assert.match(source, /persistSession:\s*false/);
  assert.match(source, /autoRefreshToken:\s*false/);
  assert.match(source, /detectSessionInUrl:\s*false/);
});

test('Supabase password flows never rely on nullable public password hashes', () => {
  const source = fs.readFileSync(new URL('./auth/controllers/password.controller.js', import.meta.url), 'utf8');
  assert.match(source, /supabaseAdmin\.rpc\('consume_password_reset'/);
  assert.match(source, /auth\.admin\.updateUserById\(userId, \{ password \}\)/);
  assert.match(source, /auth\.signInWithPassword\(/);
  assert.match(source, /auth\.admin\.updateUserById\(req\.user\.id, \{ password: newPassword \}\)/);
});

test('exam management and attempts are protected by role and ownership checks', () => {
  const routes = fs.readFileSync(new URL('./routes/exam.routes.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('./exams/controllers/exam.controller.js', import.meta.url), 'utf8');
  assert.match(routes, /requireRole\('teacher', 'content_admin', 'super_admin'\)/);
  assert.match(routes, /examManager/);
  assert.match(controller, /assertExamManager/);
  assert.match(controller, /attempt\.exam_id !== id/);
  assert.match(controller, /show_results_immediately/);
});

test('course and lesson management require manager roles and ownership', () => {
  const courseRoutes = fs.readFileSync(new URL('./routes/course.routes.js', import.meta.url), 'utf8');
  const courseController = fs.readFileSync(new URL('./courses/controllers/course.controller.js', import.meta.url), 'utf8');
  const lessonRoutes = fs.readFileSync(new URL('./routes/lesson.routes.js', import.meta.url), 'utf8');
  const lessonController = fs.readFileSync(new URL('./lessons/controllers/lesson.controller.js', import.meta.url), 'utf8');
  assert.match(courseRoutes, /requireRole\('teacher', 'content_admin', 'super_admin'\)/);
  assert.match(courseController, /assertCourseManager/);
  assert.match(courseController, /COURSE_STATUS\.PUBLISHED/);
  assert.match(lessonRoutes, /requireRole\('teacher', 'content_admin', 'super_admin'\)/);
  assert.match(lessonController, /assertLessonManager/);
  assert.match(lessonController, /progressService\.completeLesson/);
});

test('question bank does not expose answer keys to ordinary readers', () => {
  const routes = fs.readFileSync(new URL('./routes/question.routes.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('./questions/controllers/question.controller.js', import.meta.url), 'utf8');
  assert.match(routes, /questionManager/);
  assert.match(routes, /questionReviewer/);
  assert.match(controller, /includeAnswers/);
  assert.match(controller, /is_active/);
  assert.match(controller, /assertQuestionManager/);
});

test('assignment management is course-owner or content-admin only', () => {
  const routes = fs.readFileSync(new URL('./routes/assignment.routes.js', import.meta.url), 'utf8');
  const controller = fs.readFileSync(new URL('./assignments/controllers/assignment.controller.js', import.meta.url), 'utf8');
  assert.match(routes, /requireRole\('teacher', 'content_admin', 'super_admin'\)/);
  assert.match(controller, /assertCourseManager/);
  assert.match(controller, /findByStudentAndCourse/);
  assert.doesNotMatch(controller, /teacherId:\s*req\.body\.teacherId/);
});

test('curriculum mutation is restricted to content administrators', () => {
  const routes = fs.readFileSync(new URL('./routes/curriculum.routes.js', import.meta.url), 'utf8');
  assert.match(routes, /requireRole\('content_admin', 'super_admin'\)/);
  assert.match(routes, /curriculumManager/);
});

test('mobile self-profile route exists before dynamic user-id routes', () => {
  const routes = fs.readFileSync(new URL('./routes/user.routes.js', import.meta.url), 'utf8');
  const selfRoute = routes.indexOf("userRoutes.get('/profile'");
  const dynamicRoute = routes.indexOf("userRoutes.get('/:id'");
  assert.ok(selfRoute >= 0 && dynamicRoute >= 0 && selfRoute < dynamicRoute);
  assert.match(routes, /userRoutes\.patch\('\/profile'/);
});
