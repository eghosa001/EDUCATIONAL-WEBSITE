/**
 * AI LESSON REGENERATOR — Nigerian NERDC Curriculum
 *
 * Regenerates rich, topic-specific teaching content for lessons using the
 * BYNARA/OpenAI API. Writes to the `written_content` field (rendered as
 * markdown) and sets `teaching_version`/`content_quality` for resumability.
 *
 * Uses the Supabase REST API (works when direct Postgres is unreachable).
 *
 * Usage:  cd backend && node scripts/ai-regenerate-lessons.js
 *         node scripts/ai-regenerate-lessons.js --limit=50     (test run)
 *         node scripts/ai-regenerate-lessons.js --concurrency=3
 *         node scripts/ai-regenerate-lessons.js --force        (redo ai ones)
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BYNARA_API_KEY in .env
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AI_KEY = process.env.BYNARA_API_KEY || process.env.OPENAI_API_KEY;
const AI_BASE = process.env.BYNARA_BASE_URL || 'https://router.bynara.id/v1';
const AI_MODEL = process.env.AI_DEFAULT_MODEL || 'agnes-2.5-flash';

if (!URL || !KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
if (!AI_KEY) { console.error('Missing BYNARA_API_KEY / OPENAI_API_KEY'); process.exit(1); }

const sb = createClient(URL, KEY);
const ai = new OpenAI({ apiKey: AI_KEY, baseURL: AI_BASE });

const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '3', 10);
const FORCE = process.argv.includes('--force');

const MAX_OUTPUT = 2600;

// ─── Fetch helpers ────────────────────────────────────────────────────
async function fetchAll(table, select, filterFn) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = sb.from(table).select(select).range(from, from + pageSize - 1);
    if (filterFn) q = filterFn(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

function buildPrompt(subjectName, classCode, topicName, lessonTitle, description) {
  return [
    `You are an expert Nigerian teacher writing an accurate, exam-focused lesson aligned with the NERDC curriculum for ${classCode} ${subjectName}.`,
    `Topic: ${topicName}`,
    lessonTitle ? `Lesson title: ${lessonTitle}` : '',
    description ? `Lesson description: ${description}` : '',
    ``,
    `Write a complete lesson in MARKDOWN that actually TEACHES this topic. Requirements:`,
    `1. Clear definitions and explanations with accurate scientific/academic content specific to this topic (do NOT be generic — explain this exact topic).`,
    `2. Step-by-step teaching with concrete examples a Nigerian student can relate to.`,
    `3. Use proper structure with ## headings covering: definition/introduction, key concepts, detailed explanations, examples, and a summary.`,
    `4. Include real, correct facts. Do not invent syllabus claims or facts.`,
    `5. Add a short "Examination tips" section and "Quick self-check questions" at the end.`,
    `6. Use markdown: ## for section headings, **bold** for key terms, bullet lists, and tables where helpful.`,
    `7. Keep it to roughly 1200-1600 words. Output ONLY the markdown lesson, no preamble.`,
  ].filter(Boolean).join('\n');
}

function buildObjectives(subjectName, classCode, topicName) {
  return [
    `Define and explain key concepts of ${topicName}`,
    `Describe the main principles and processes of ${topicName}`,
    `Identify examples of ${topicName} in everyday Nigerian contexts`,
    `Apply knowledge of ${topicName} to answer examination-style questions`,
  ];
}

function buildKeyPoints(subjectName, classCode, topicName) {
  return [
    `${topicName} is an important concept in ${subjectName}`,
    `Understand definitions and core principles`,
    `Recognise practical applications`,
    `Review past WAEC/NECO/JAMB questions on this topic`,
  ];
}

function cleanMarkdown(text) {
  if (!text) return '';
  // Trim leading/trailing whitespace and remove code fences if the model wrapped it.
  let t = text.trim();
  const fence = /^```(?:markdown)?\s*([\s\S]*?)\s*```$/;
  const m = t.match(fence);
  if (m) t = m[1].trim();
  return t;
}

// ─── Per-lesson generation ────────────────────────────────────────────
async function regenerateLesson(lesson, topicName, subjectName, classCode) {
  const prompt = buildPrompt(subjectName, classCode, topicName, lesson.title, lesson.description);
  const response = await ai.chat.completions.create({
    model: AI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: MAX_OUTPUT,
    temperature: 0.4,
  });
  const content = cleanMarkdown(response.choices?.[0]?.message?.content || '');
  if (!content) throw new Error('Empty AI response');

  const objectives = buildObjectives(subjectName, classCode, topicName);
  const keyPoints = buildKeyPoints(subjectName, classCode, topicName);

  const update = {
    written_content: content,
    learning_objectives: objectives,
    key_points: keyPoints,
    description: (lesson.description && lesson.description.length > 0 ? lesson.description : `NERDC ${classCode} ${subjectName}: ${topicName}`),
    estimated_minutes: Math.max(20, Math.min(60, Math.round(content.split(/\s+/).length / 25))),
    content_quality: 'ai',
    teaching_version: 3,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from('lessons').update(update).eq('id', lesson.id);
  if (error) throw new Error(`Update failed: ${error.message}`);
  return content.split(/\s+/).length;
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  AI LESSON REGENERATOR — NERDC 2025');
  console.log(`  Model: ${AI_MODEL}`);
  console.log('═══════════════════════════════════════════');

  console.log('Loading subjects…');
  const subjects = await fetchAll('subjects', 'id,name');
  const subjName = {};
  for (const s of subjects) subjName[s.id] = s.name;
  console.log(`  ${subjects.length} subjects`);

  console.log('Loading topics…');
  const topics = await fetchAll('topics', 'id,name,subject_id,class_id');
  const topicMeta = {}; // topic_id -> { name, subjectName }
  for (const t of topics) {
    topicMeta[t.id] = { name: t.name, subjectName: subjName[t.subject_id] || '', classId: t.class_id };
  }
  console.log(`  ${topics.length} topics`);

  console.log('Loading lessons…');
  let lessons = await fetchAll('lessons', 'id,course_id,topic_id,title,description,written_content,content_quality,teaching_version');

  // Only regenerate topic-linked lessons that have a known curriculum topic/subject.
  let candidates = lessons.filter(l => l.topic_id && topicMeta[l.topic_id]);
  // Skip already-AI lessons unless FORCE.
  if (!FORCE) candidates = candidates.filter(l => (l.content_quality || '') !== 'ai');
  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT);

  console.log(`  Total lessons: ${lessons.length}`);
  console.log(`  Candidates for AI: ${candidates.length}`);
  if (candidates.length === 0) { console.log('Nothing to do (all already AI or no topic). Use --force to redo.'); return; }

  const classIdToCode = {};
  {
    const classes = await fetchAll('classes', 'id,code,name');
    for (const c of classes) classIdToCode[c.id] = c.code || c.name;
  }
let done = 0, failed = 0, failedIds = [];
  let ix = 0;
  // Global rate-limit throttle: when any worker hits 429, this timestamp is set
  // and other workers pause briefly to let the limit reset.
  let rateLimitedUntil = 0;

  const worker = async () => {
    while (ix < candidates.length) {
      const lesson = candidates[ix++];
      const meta = topicMeta[lesson.topic_id];
      const classCode = meta.classId ? (classIdToCode[meta.classId] || 'Nigerian') : 'Nigerian';

      // Respect a shared rate-limit pause.
      if (rateLimitedUntil > Date.now()) {
        await new Promise(r => setTimeout(r, Math.min(rateLimitedUntil - Date.now(), 30000)));
      }

      // Retry loop for a single lesson — handles transient 429 / timeouts.
      let attempts = 0;
      const maxAttempts = 6;
      let lastErr = null;
      while (attempts < maxAttempts) {
        attempts++;
        try {
          await regenerateLesson(lesson, meta.name, meta.subjectName || 'General Studies', classCode);
          done++;
          if (done % 20 === 0) {
            console.log(`  Progress ${done}/${candidates.length} (+${failed} failed) | last topic: ${meta.name}`);
          }
          break;
        } catch (err) {
          lastErr = err;
          const isRateLimit = err.status === 429 || /rate limit|429|too many/i.test(err.message || '');
          if (isRateLimit) {
            // Back off and tell other workers to pause too.
            const wait = Math.min(2000 * attempts * attempts, 60000);
            rateLimitedUntil = Date.now() + wait;
            console.error(`  [429] backoff ${wait / 1000}s — ${meta.name}`);
            await new Promise(r => setTimeout(r, wait));
          } else {
            console.error(`  FAILED ${meta.name}: ${err.message}`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      // Exhausted retries for this lesson.
      if (attempts === maxAttempts && lastErr) {
        failed++;
        failedIds.push(lesson.id);
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log('\n═══════════════════════════════════════════');
  console.log('  DONE');
  console.log(`  Regenerated: ${done}`);
  console.log(`  Failed: ${failed}`);
  if (failedIds.length) {
    console.log(`  Failed ids: ${failedIds.join(',')}`);
    console.log('  Re-run this script to retry failures (they were not marked ai).');
  }
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
