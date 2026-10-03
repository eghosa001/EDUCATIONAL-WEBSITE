import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lessonPage = fs.readFileSync(new URL('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx', import.meta.url), 'utf8');
const practiceFn = fs.readFileSync(new URL('../../supabase/functions/lesson-practice/index.ts', import.meta.url), 'utf8');
const visualRoute = fs.readFileSync(new URL('../src/app/lesson-visuals/[lessonId]/route.ts', import.meta.url), 'utf8');

test('lesson practice uses the dedicated secure edge function', () => {
  assert.match(lessonPage, /functions\.invoke\('lesson-practice'/);
  assert.match(lessonPage, /action: 'check'/);
  assert.match(practiceFn, /publicQuestions/);
  assert.match(practiceFn, /action === 'check'/);
  assert.doesNotMatch(practiceFn, /publicQuestions[\s\S]{0,500}correctAnswer:/);
});

test('lesson visuals are real lesson resources', () => {
  assert.match(lessonPage, /LessonResourceVisuals/);
  assert.match(lessonPage, /LessonQuickReference/);
  assert.match(lessonPage, /Lesson summary table/);
  assert.match(lessonPage, /visual-summary/);
  assert.match(visualRoute, /image\/svg\+xml/);
  assert.match(visualRoute, /learning_objectives,key_points/);
});
