import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('exam store submits server attempts instead of grading correct answers in the browser', () => {
  const source = read('src/features/exams/store/examStore.ts');
  assert.match(source, /\/exams\/\$\{exam\.id\}\/attempts/);
  assert.match(source, /\/attempts\/\$\{attemptId\}\/submit/);
  assert.match(source, /studentAnswer/);
  assert.doesNotMatch(source, /answers\[q\.id\]\s*===\s*q\.correctAnswer/);
});

test('lesson completion is persisted before local completion state changes', () => {
  const source = read('src/features/lessons/hooks/useVideoPlayer.ts');
  assert.match(source, /\/progress\/courses\/\$\{courseId\}\/lessons\/\$\{lessonId\}\/complete/);
  assert.ok(source.indexOf('await handleApiResponse(response)') < source.indexOf('markCompleted(lessonId)'));
});

test('lesson store keeps in-progress lessons separate from completed lessons', () => {
  const source = read('src/features/lessons/store/lessonStore.ts');
  assert.match(source, /inProgressLessons/);
  const markInProgress = source.slice(source.indexOf('markInProgress:'), source.indexOf('setCurrentCourse:'));
  assert.doesNotMatch(markInProgress, /completedLessons:\s*new Set\(\[\.\.\.state\.completedLessons, lessonId\]\)/);
});

test('AI tutor hook uses hardened AI services rather than nonexistent backend URLs', () => {
  const source = read('src/features/ai/hooks/useAITutor.ts');
  assert.match(source, /sendAiTutorMessage/);
  assert.match(source, /generateAiQuiz/);
  assert.match(source, /generateAiSummary/);
  assert.match(source, /generateAiFlashcards/);
  assert.doesNotMatch(source, /\/api\/v1\/ai\/chat/);
  assert.doesNotMatch(source, /getFallbackResponse/);
});

test('forgot-password form waits for a real reset request before showing success', () => {
  const source = read('src/features/auth/components/ForgotPasswordForm.tsx');
  assert.match(source, /await forgotPassword\(\{ email: data\.email \}\)/);
  assert.ok(source.indexOf('await forgotPassword') < source.indexOf('setSent(true)'));
  assert.doesNotMatch(source, /In production, call the API here/);
});
