import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('assignment submit control is wired to the submission service', () => {
  const source = read('src/app/dashboard/assignments/page.tsx');
  assert.match(source, /submitAssignment\(/);
  assert.match(source, /onClick=.*handleSubmit/);
  assert.match(source, /Submit assignment/);
});

test('subscription checkout always returns to the real billing screen', () => {
  const source = read('src/app/dashboard/subscriptions/plans/page.tsx');
  assert.match(source, /BILLING_PATH = ['"]\/dashboard\/subscriptions\/billing['"]/);
  assert.doesNotMatch(source, /router\.push\(['"]\/subscriptions\/billing['"]\)/);
  assert.doesNotMatch(source, /origin\}\/subscriptions\/billing/);
});

test('live class actions and scheduling route are implemented', () => {
  const source = read('src/app/dashboard/live-classes/page.tsx');
  assert.match(source, /joinLiveClass/);
  assert.match(source, /handleJoin/);
  assert.match(source, /toggleReminder/);
  assert.ok(fs.existsSync(path.join(root, 'src/app/dashboard/live-classes/create/page.tsx')));
});

test('library and downloads never emit empty file links', () => {
  const library = read('src/app/dashboard/library/page.tsx');
  const downloads = read('src/app/dashboard/downloads/page.tsx');
  assert.match(library, /hasUsableUrl/);
  assert.match(library, /File unavailable/);
  assert.match(downloads, /filter\(r => hasUsableUrl\(r\.fileUrl\)\)/);
});

test('community forum chips perform filtering and posts expand', () => {
  const source = read('src/app/dashboard/community/page.tsx');
  assert.match(source, /setActiveForum\(forum\.id\)/);
  assert.match(source, /setExpandedPost/);
  assert.match(source, /!selectedForum/);
});

test('database repair migration adds bookmarks and removes anonymous CBT execution', () => {
  const migration = read('../supabase/migrations/20260915094500_production_qa_repairs.sql');
  assert.match(migration, /create table if not exists public\.bookmarks/i);
  assert.match(migration, /revoke execute on function public\.cbt_get_questions\(uuid, uuid, integer\) from anon/i);
  assert.match(migration, /revoke execute on function public\.cbt_grade\(jsonb\) from anon/i);
});

test('backend has publishable-key compatibility fallback', () => {
  const config = read('../backend/src/common/config/index.js');
  assert.match(config, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(config, /sb_publishable_/);
});


test('lesson math is normalized instead of showing raw dollar delimiters', () => {
  const source = read('src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  assert.match(source, /function normalizeLessonMath/);
  assert.match(source, /function readableMathExpression/);
  assert.match(source, /normalizeLessonMath\(String\(content/);
});

test('library client normalizes the backend resources envelope', () => {
  const source = read('src/services/api/libraryService.ts');
  assert.match(source, /payload\?\.data\?\.resources/);
  assert.match(source, /resource\.resource_type/);
  assert.match(source, /totalPages/);
});

test('AI tutor uses curriculum selectors instead of raw UUID inputs', () => {
  const source = read('src/app/dashboard/ai/tutor/page.tsx');
  assert.match(source, /from\('subjects'\)/);
  assert.match(source, /from\('topics'\)/);
  assert.doesNotMatch(source, /placeholder="Subject ID"/);
  assert.doesNotMatch(source, /placeholder="Topic ID"/);
});

test('student navigation exposes curriculum, library and plans', () => {
  const source = read('src/app/dashboard/layout.tsx');
  assert.match(source, /href: '\/dashboard\/curriculum'/);
  assert.match(source, /href: '\/dashboard\/library'/);
  assert.match(source, /href: '\/dashboard\/subscriptions\/plans'/);
});


test('learner exam and past-question flows use the Supabase learner API', () => {
  const config = read('src/services/api/config.ts');
  const exam = read('src/app/dashboard/exams/[examId]/page.tsx');
  const past = read('src/app/dashboard/past-questions/page.tsx');
  assert.match(config, /functions\/v1\/web-api\/api\/v1/);
  assert.match(exam, /learnerApiConfig/);
  assert.match(past, /learnerApiConfig/);
  assert.doesNotMatch(exam, /apiConfig\.baseUrl/);
  assert.doesNotMatch(past, /apiConfig\.baseUrl/);
});

test('AI tutor preserves the conversation and sends named curriculum context', () => {
  const source = read('src/app/dashboard/ai/tutor/page.tsx');
  assert.match(source, /sessionId: sessionId \|\| undefined/);
  assert.match(source, /currentSubject: selectedSubject\?\.name/);
  assert.match(source, /currentTopic: selectedTopic\?\.name/);
  assert.match(source, /setSessionId\(res\.sessionId\)/);
});

test('flashcard generation requires an explicit curriculum topic', () => {
  const source = read('src/app/dashboard/flashcards/page.tsx');
  assert.match(source, /from\('topics'\)/);
  assert.match(source, /generateAiFlashcards\(\{ subjectId, topicId, count: 20 \}/);
  assert.match(source, /disabled=\{!subjectId \|\| !topicId \|\| generating\}/);
});

test('AI quota RPCs and learner exam edge routes are versioned', () => {
  const migration = read('../supabase/migrations/20260928200000_restore_ai_quota_rpcs.sql');
  const api = read('../supabase/functions/web-api/index.ts');
  assert.match(migration, /create or replace function public\.consume_ai_request/i);
  assert.match(migration, /grant execute on function public\.consume_ai_request\(uuid, integer\) to service_role/i);
  assert.match(api, /startExamMatch/);
  assert.match(api, /submitExamMatch/);
});
