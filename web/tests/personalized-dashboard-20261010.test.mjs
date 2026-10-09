import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const raw = read('../src/lib/studyRecommendation.ts');
const compiled = ts.transpileModule(raw, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { chooseStudyRecommendation } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
const weakTopic = {
  topicId: 'a103b6a1-3ee8-48f5-8c5a-f41d38d22c8c',
  topicName: 'Linear equations',
  subjectName: 'Mathematics',
  attempts: 5,
  correct: 2,
  accuracy: 40,
};
const courses = [{ courseId: 'course-one', courseTitle: 'Year 2 Maths', progressPercentage: 38 }];

test('weak-topic recommendation outranks due flashcards and courses', () => {
  const next = chooseStudyRecommendation({ dueCount: 7, weakTopic }, courses);
  assert.equal(next.kind, 'weak-topic');
  assert.equal(next.href, `/dashboard/flashcards?topic=${weakTopic.topicId}`);
  assert.match(next.explanation, /2 of 5 recent answers correct/);
  assert.match(next.title, /Linear equations/);
});

test('due flashcards outrank a merely unfinished course', () => {
  const next = chooseStudyRecommendation({ dueCount: 1, weakTopic: null }, courses);
  assert.equal(next.kind, 'due-flashcards');
  assert.equal(next.title, '1 flashcard due');
  assert.equal(next.href, '/dashboard/flashcards');
  const plural = chooseStudyRecommendation({ dueCount: 12, weakTopic: null }, courses);
  assert.equal(plural.title, '12 flashcards due');
});

test('continuation uses a real unfinished enrolled course, not invented lessons', () => {
  const next = chooseStudyRecommendation({ dueCount: 0, weakTopic: null }, [
    { courseId: 'complete', courseTitle: 'Completed', progressPercentage: 100 },
    ...courses,
  ]);
  assert.equal(next.kind, 'continue-course');
  assert.equal(next.href, '/dashboard/courses/course-one');
  assert.match(next.explanation, /38% completed/);
});

test('first-time and partial-data states have an honest fallback', () => {
  const next = chooseStudyRecommendation(null, []);
  assert.equal(next.kind, 'start');
  assert.equal(next.href, '/dashboard/courses');
  assert.doesNotMatch(next.explanation, /due|mastery|score/i);
});

test('learner homepage does not wait for multiple independent requests or replace failures with zeroes', () => {
  const page = read('../src/app/dashboard/page.tsx');
  assert.match(page, /fetchStudentFocus\(token\)/);
  assert.match(page, /fetchRecentCourses\(token, 3\)/);
  assert.match(page, /fetchStudentOverview\(token\)/);
  assert.doesNotMatch(page, /Promise\.all\(\[fetchStudentOverview\(token\), fetchMyCourses\(token\)\]\)/);
  assert.match(page, /setOverviewError\('Study statistics are temporarily unavailable/);
  assert.match(page, /setCoursesError\('Recent courses could not be loaded/);
  assert.match(page, /Retry loading/);
  assert.match(page, /overviewLoading \|\| !overview \? '—'/);
  assert.match(page, /chooseStudyRecommendation\(focus, recentCourses\)/);
});

test('homepage course path only loads 3 recent enrollments, not every course at once', () => {
  const service = read('../src/services/api/courseService.ts');
  const selected = service.slice(service.indexOf('export const fetchRecentCourses'), service.indexOf('export const fetchCourseStudents'));
  assert.match(selected, /\.limit\(Math\.max\(1, Math\.min\(5, limit\)\)\)/);
  assert.match(selected, /\.select\('course_id,progress_percentage,completed_at,last_accessed_at,enrolled_at,courses\(id,title,slug\)'\)/);
  assert.doesNotMatch(selected, /\.select\('\*'/);
  assert.match(selected, /\.eq\('student_id', auth\.user\.id\)/);
  assert.match(selected, /completedCounts/);
});

test('weak-topic evidence and due review counts are user-scoped and bounded', () => {
  const service = read('../src/services/api/progressService.ts');
  const snippet = service.slice(service.indexOf('export const fetchStudentFocus'), service.indexOf('export const fetchStudentOverview'));
  assert.match(snippet, /\.limit\(160\)/);
  assert.match(snippet, /\.select\('id', \{ count: 'exact', head: true \}\)/);
  assert.match(snippet, /\.eq\('user_id', userId\)/);
  assert.match(snippet, /result\.attempts >= 3 && result\.accuracy < 60/);
  assert.match(snippet, /\.eq\('is_active', true\)/);
  assert.match(snippet, /topic\?\.class_id && topic\?\.subject_id/);
  assert.match(snippet, /partialFailure/);
});
