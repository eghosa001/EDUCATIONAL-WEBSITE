import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routes = fs.readFileSync(new URL('./routes/exam.routes.js', import.meta.url), 'utf8');
const controller = fs.readFileSync(new URL('./exams/controllers/exam.controller.js', import.meta.url), 'utf8');

test('exam management routes require teacher/content-admin/super-admin roles', () => {
  assert.match(routes, /const examManager = requireRole\('teacher', 'content_admin', 'super_admin'\)/);
  for (const route of ["post('/',", "patch('/:id',", "delete('/:id',", "get('/:id/questions',", "post('/:id/questions',", "post('/:id/publish',", "get('/:id/attempts',"]) {
    const start = routes.indexOf(`examRoutes.${route}`);
    assert.ok(start >= 0, `missing route ${route}`);
    const end = routes.indexOf(');', start);
    assert.match(routes.slice(start, end), /examManager/);
  }
});

test('teachers are limited to exams they created', () => {
  assert.match(controller, /roles\.has\('teacher'\) && exam\?\.created_by === user\?\.id/);
  assert.match(controller, /requireExamManager\(req, existing\)/);
  assert.match(controller, /requireExamManager\(req, exam\)/);
});

test('attempt submission is bound to the URL exam', () => {
  assert.match(controller, /if \(attempt\.exam_id !== id\) notFound\('Attempt'\)/);
});

test('students cannot read another learner attempt or active answer keys', () => {
  assert.match(controller, /if \(!isOwner && !isManager\)/);
  assert.match(controller, /canSeeAnswerKey = isManager \|\| \(isOwner && attempt\.status === EXAM_ATTEMPT_STATUS\.SUBMITTED && exam\.show_results_immediately\)/);
  assert.match(controller, /q\.correct_answer, q\.explanation/);
});
