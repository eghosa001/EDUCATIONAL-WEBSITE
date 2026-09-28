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

test('library client reads learner resources directly through Supabase RLS', () => {
  const source = read('src/services/api/libraryService.ts');
  assert.match(source, /from\('library_resources'\)/);
  assert.match(source, /resource\.resource_type/);
  assert.match(source, /totalPages/);
  assert.doesNotMatch(source, /payload\?\.data\?\.resources/);
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
  assert.match(config, /functions\/v1\/web-api/);
  assert.doesNotMatch(config, /web-api\/api\/v1/);
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
  assert.match(source, /generateAiFlashcards\(\{ subjectId, topicId, count: cardCount \}/);
  assert.match(source, /const \[cardCount, setCardCount\] = useState\(10\)/);
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


test('exam catalogue uses the learner API instead of protected exam_questions rows', () => {
  const source = read('src/app/dashboard/exams/page.tsx');
  const api = read('../supabase/functions/web-api/index.ts');
  assert.match(source, /learnerApiConfig\.baseUrl}\/exams\?limit=100/);
  assert.doesNotMatch(source, /from\('exam_questions'\)/);
  assert.match(api, /path==='\/exams'/);
  assert.match(api, /questionCount/);
});


test('Supabase runtime path prefixes are normalized before learner routing', () => {
  const api = read('../supabase/functions/web-api/index.ts');
  assert.match(api, /replace\(\/\^\\\/web-api/);
  assert.match(api, /path\.startsWith\('\/api\/v1'\)/);
});

test('flashcard invocation forwards the current learner access token', () => {
  const service = read('src/services/api/aiService.ts');
  assert.match(service, /headers: token \? \{ Authorization: `Bearer \$\{token\}` \} : undefined/);
});


test('Supabase AI edge functions use Bynara instead of OpenAI', () => {
  for (const relative of [
    '../supabase/functions/ai/index.ts',
    '../supabase/functions/flashcards/index.ts',
    '../supabase/functions/lesson-practice/index.ts',
    '../supabase/functions/lesson-worker/index.ts',
    '../supabase/functions/lesson-quality-audit/index.ts',
  ]) {
    const source = read(relative);
    assert.match(source, /BYNARA_API_KEY/);
    assert.match(source, /BYNARA_BASE_URL/);
    assert.match(source, /AI_DEFAULT_MODEL/);
    assert.doesNotMatch(source, /api\.openai\.com/);
    assert.doesNotMatch(source, /OPENAI_API_KEY/);
  }
});

test('production QA creates a mandatory temporary authenticated learner', () => {
  const workflow = read('../.github/workflows/comprehensive-tests.yml');
  const spec = read('e2e/production-deployed.spec.mjs');
  const qaUser = read('../supabase/functions/qa-user/index.ts');
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /Create temporary production QA student/);
  assert.match(workflow, /Delete temporary production QA student/);
  assert.doesNotMatch(spec, /test\.skip\(!testEmail/);
  assert.match(spec, /QA_EMAIL/);
  assert.match(qaUser, /token\.actions\.githubusercontent\.com/);
  assert.match(qaUser, /eghosa001\/EDUCATIONAL-WEBSITE/);
});


test('production QA continues after individual feature failures and cleanup JSON is valid', () => {
  const workflow = read('../.github/workflows/comprehensive-tests.yml');
  const spec = read('e2e/production-deployed.spec.mjs');
  assert.doesNotMatch(spec, /mode:\s*['"]serial['"]/);
  assert.match(workflow, /delete_payload=\$\(node -e/);
  assert.match(workflow, /JSON\.stringify\(\{action:"delete",userId:process\.env\.QA_USER_ID\}\)/);
});

test('AI provider timeout is configurable and Tutor uses bounded fast-model attempts', () => {
  const source = read('../supabase/functions/ai/index.ts');
  assert.match(source, /timeoutMs = 100_000/);
  assert.match(source, /controller\.abort\(\), timeoutMs/);
  assert.match(source, /openAI\(messages, 700, 0\.6, model, 30_000\)/);
});


test('AI Tutor uses fast free Bynara models with fallback', () => {
  const source = read('../supabase/functions/ai/index.ts');
  assert.match(source, /AI_TUTOR_MODEL/);
  assert.match(source, /ling-3\.0-flash-fin-free/);
  assert.match(source, /AI_TUTOR_FALLBACK_MODEL/);
  assert.match(source, /laguna-s-2\.1/);
  assert.match(source, /openAITutor\(messages\)/);
});
