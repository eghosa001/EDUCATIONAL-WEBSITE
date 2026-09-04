/**
 * REST-BASED CONTENT SEEDER — Nigerian NERDC Curriculum
 *
 * Tops up curriculum content in Supabase via the REST API (works when direct
 * Postgres is unreachable). Reuses the question & flashcard generators from
 * seed-content-detailed.js and inserts them for EXISTING topics, avoiding
 * duplicates.
 *
 * Usage:  cd backend && node scripts/seed-rest.js
 *         node scripts/seed-rest.js --questions        (questions only)
 *         node scripts/seed-rest.js --flashcards       (flashcards only)
 *         node scripts/seed-rest.js --subject=PHYSICS  (limit to one subject)
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(URL, KEY);

const DO_QUESTIONS = !process.argv.includes('--flashcards');
const DO_FLASHCARDS = !process.argv.includes('--questions');
const SUBJECT_FILTER = process.argv.find(a => a.startsWith('--subject='))?.split('=')[1];
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);

// ─── Subject helpers (mirror seed-content-detailed.js) ────────────────
const SUBJECT_ALIASES = {
  'ENGLISH STUDIES': 'ENGLISH LANGUAGE',
  'SOCIAL AND CITIZENSHIP STUDIES': 'CITIZENSHIP AND HERITAGE STUDIES',
  'BASIC SCIENCE': 'BASIC SCIENCE AND TECHNOLOGY',
  'CULTURAL AND CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
  'ISE': 'INTEGRATED SCIENCE',
};
function normalizeSubject(name) { return (SUBJECT_ALIASES[name?.trim()] || name?.trim() || '').toUpperCase(); }

// ─── QUESTION GENERATORS ──────────────────────────────────────────────
function generateQuestions(subjectName, topicName, classCode) {
  const subj = normalizeSubject(subjectName);
  const generator = QUESTION_GENERATORS[subj] || QUESTION_GENERATORS['_default'];
  return generator(topicName, classCode);
}

const QUESTION_GENERATORS = {
  MATHEMATICS: (topic, cls) => [
    { q: `Which of the following best describes "${topic}"?`, o: [ 'It involves calculations and problem-solving using numbers and formulae', 'It is a literary device used in creative writing', 'It is a laboratory experiment in science', 'It is a historical event in Nigerian History' ], a: 'A', e: `${topic} is a mathematical concept that involves numerical relationships and applying formulae to solve problems.`, d: 'easy' },
    { q: `When solving problems on "${topic}", what is the first step?`, o: [ 'Read and understand the problem carefully', 'Write the final answer immediately', 'Skip the problem', 'Guess the answer' ], a: 'A', e: 'The first step in solving any mathematics problem is to read and understand what is being asked.', d: 'easy' },
    { q: `Which examination body in Nigeria tests "${topic}" in Mathematics?`, o: [ 'WAEC, NECO and JAMB', 'Only primary school examinations', 'Only university entrance exams', 'None of the above' ], a: 'A', e: `WAEC (WASSCE), NECO and JAMB all include ${topic} in their Mathematics syllabuses.`, d: 'easy' },
  ],
  'ENGLISH LANGUAGE': (topic, cls) => [
    { q: `In English Language, "${topic}" helps students to:`, o: [ 'Communicate effectively in writing and speech', 'Solve mathematical equations', 'Perform scientific experiments', 'Design computer programs' ], a: 'A', e: `English Language skills, including ${topic}, are essential for effective communication in academic and professional contexts.`, d: 'easy' },
    { q: `Which of the following is a correct application of "${topic}"?`, o: [ 'Using proper grammar and vocabulary in context', 'Writing only in Pidgin English', 'Avoiding all complex words', 'Using only informal expressions' ], a: 'A', e: 'Proper application of English Language concepts involves using grammar and vocabulary correctly in context.', d: 'medium' },
    { q: `Nigerian students should study "${topic}" because:`, o: [ 'English is the official language of instruction in Nigeria', 'It is only needed for foreign travel', 'It replaces the need for other subjects', 'It is only important in primary school' ], a: 'A', e: 'English is the official language of Nigeria and the medium of instruction, making its study essential.', d: 'easy' },
  ],
  _default: (topic, cls) => [
    { q: `Which of the following best describes "${topic}"?`, o: [ `A key topic in the Nigerian curriculum covering important concepts and principles`, 'A topic unrelated to the academic curriculum', 'Only studied at university level', 'Not part of any Nigerian examination' ], a: 'A', e: `${topic} is an important curriculum topic tested in Nigerian examinations including WAEC, NECO and JAMB.`, d: 'easy' },
    { q: `Studying "${topic}" helps students to:`, o: [ 'Build foundational knowledge for examinations and further study', 'Avoid learning other subjects', 'Only entertain themselves', 'Ignore the Nigerian curriculum' ], a: 'A', e: 'Each topic in the Nigerian curriculum builds essential knowledge that contributes to academic success and personal development.', d: 'easy' },
    { q: `Which examination in Nigeria tests knowledge of "${topic}"?`, o: [ 'WAEC (WASSCE) and NECO', 'Only informal assessments', 'No examination tests this topic', 'Only foreign examinations' ], a: 'A', e: `${topic} is part of the Nigerian national curriculum and is tested in major examinations like WAEC and NECO.`, d: 'easy' },
  ],
};

// ─── FLASHCARD GENERATORS ─────────────────────────────────────────────
function generateFlashcards(subjectName, topicName, classCode) {
  const subj = normalizeSubject(subjectName);
  const generator = FLASHCARD_GENERATORS[subj] || FLASHCARD_GENERATORS['_default'];
  return generator(topicName, classCode);
}

const FLASHCARD_GENERATORS = {
  MATHEMATICS: (topic, cls) => [
    { front: `What is ${topic}?`, back: `${topic} is a mathematical concept taught in the Nigerian ${cls} curriculum. It involves understanding numerical relationships and applying formulae to solve problems.`, difficulty: 'easy' },
    { front: `Approach to solving ${topic}`, back: `For ${topic} problems, identify the given information, apply the correct formula, solve step by step, and verify your answer.`, difficulty: 'medium' },
    { front: `Exam tip for ${topic}`, back: `Practice 5+ problems daily on ${topic}. Review formula sheets regularly. Always show working and check units in examinations.`, difficulty: 'medium' },
  ],
  'ENGLISH LANGUAGE': (topic, cls) => [
    { front: `What is ${topic}?`, back: `${topic} is an English Language concept that helps students develop communication skills for academic and everyday use.`, difficulty: 'easy' },
    { front: `How to improve ${topic}`, back: `Read widely, practice writing, study grammar rules, listen to English news, and review past examination questions on ${topic}.`, difficulty: 'medium' },
    { front: `${topic} in Nigerian English`, back: `Nigerian English has unique characteristics. Understanding ${topic} helps in both Nigerian and international communication contexts.`, difficulty: 'medium' },
  ],
  _default: (topic, cls) => [
    { front: `Define: ${topic}`, back: `${topic} is a key topic in the Nigerian ${cls} curriculum, covering fundamental concepts and principles.`, difficulty: 'easy' },
    { front: `Why is ${topic} important?`, back: `${topic} is important because it builds foundational knowledge for WAEC, NECO and JAMB examinations and contributes to personal development.`, difficulty: 'medium' },
    { front: `Study tip for ${topic}`, back: `Read textbooks, attend classes, practice past questions, discuss with peers, and apply ${topic} to real-life situations.`, difficulty: 'medium' },
  ],
};

// ─── Fetch helpers ────────────────────────────────────────────────────
async function fetchAll(table, select, filter) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = sb.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) query = filter(query);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if ((data || []).length < pageSize) break;
  }
  return rows;
}

function classCodeFor(topic) {
  // Infer a display class from the class_id label would need a lookup; keep generic.
  return 'Nigerian';
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  REST CONTENT SEEDER — NERDC 2025');
  console.log('═══════════════════════════════════════════');

  console.log('Fetching subjects…');
  const subjects = await fetchAll('subjects', 'id,name,code');
  const subjectNameById = {};
  for (const s of subjects) subjectNameById[s.id] = s.name;
  console.log(`  ${subjects.length} subjects`);

  console.log('Fetching topics…');
  const topics = await fetchAll('topics', 'id,name,subject_id,class_id');
  console.log(`  ${topics.length} topics`);

  let filteredTopics = topics;
  if (SUBJECT_FILTER) {
    const keepIds = new Set(subjects.filter(s => s.name.toUpperCase().includes(SUBJECT_FILTER.toUpperCase())).map(s => s.id));
    filteredTopics = topics.filter(t => keepIds.has(t.subject_id));
    console.log(`Subject filter "${SUBJECT_FILTER}": ${filteredTopics.length} topics`);
  }
  if (LIMIT > 0) {
    filteredTopics = filteredTopics.slice(0, LIMIT);
    console.log(`Limit: processing ${filteredTopics.length} topics`);
  }

  // Build existing-question and existing-flashcard lookups for fast dedupe.
  console.log('Indexing existing questions & flashcards…');
  const existingQ = new Map(); // subject_id -> Set of question_text
  const existingFC = new Map(); // subject_id -> Set of title
  {
    const qs = await fetchAll('questions', 'id,subject_id,question_text,topic_id');
    for (const q of qs) {
      if (!existingQ.has(q.subject_id)) existingQ.set(q.subject_id, new Set());
      existingQ.get(q.subject_id).add(q.question_text);
    }
    const fcs = await fetchAll('flashcards', 'id,subject_id,title,topic_id');
    for (const f of fcs) {
      if (!existingFC.has(f.subject_id)) existingFC.set(f.subject_id, new Set());
      existingFC.get(f.subject_id).add(f.title);
    }
    console.log(`  questions in DB: ${qs.length}, flashcard sets in DB: ${fcs.length}`);
  }

  // Per-topic question/flashcard counters (topic-scoped dedupe)
  const qByTopic = new Map();
  {
    const withTopic = await fetchAll('questions', 'topic_id', (q) => q.not('topic_id', 'is', null));
    for (const q of withTopic) qByTopic.set(q.topic_id, (qByTopic.get(q.topic_id) || 0) + 1);
  }
  const fcByTopic = new Map();
  {
    const withTopic = await fetchAll('flashcards', 'topic_id', (q) => q.not('topic_id', 'is', null));
    for (const f of withTopic) fcByTopic.set(f.topic_id, (fcByTopic.get(f.topic_id) || 0) + 1);
  }

  let insertedQ = 0, skippedQ = 0, insertedFC = 0, skippedFC = 0, errors = 0;
  let processed = 0;
  const total = filteredTopics.length;

  // Batch collectors for performance (fewer REST round-trips)
  const qBatch = [];
  const fcBatch = [];

  async function flushBatches(isFinal = false) {
    if (qBatch.length && (isFinal || qBatch.length >= 500)) {
      const batch = qBatch.splice(0, 500);
      const { error } = await sb.from('questions').insert(batch);
      if (error) { errors++; console.error(`  [Q batch] ${error.message}`); } else insertedQ += batch.length;
    }
    if (fcBatch.length && (isFinal || fcBatch.length >= 500)) {
      const batch = fcBatch.splice(0, 500);
      const { error } = await sb.from('flashcards').insert(batch);
      if (error) { errors++; console.error(`  [FC batch] ${error.message}`); } else insertedFC += batch.length;
    }
  }

  for (const topic of filteredTopics) {
    processed++;
    const subjectName = subjectNameById[topic.subject_id] || '';
    if (!subjectName) continue;

    // Questions: ensure at least 3 per topic
    if (DO_QUESTIONS) {
      const existingForTopic = qByTopic.get(topic.id) || 0;
      if (existingForTopic < 3) {
        const questions = generateQuestions(subjectName, topic.name, classCodeFor(topic));
        const toAdd = Math.min(3 - existingForTopic, questions.length);
        for (let i = 0; i < toAdd; i++) {
          const q = questions[i];
          if (existingQ.get(topic.subject_id)?.has(q.q)) { skippedQ++; continue; }
          const payload = {
            subject_id: topic.subject_id,
            topic_id: topic.id,
            class_id: topic.class_id,
            question_type: 'mcq',
            question_text: q.q,
            options: q.o.map((text, idx) => ({ id: String.fromCharCode(65 + idx), text })),
            correct_answer: q.a,
            explanation: q.e,
            difficulty: q.d,
            marks: 1,
            source: 'NERDC_GENERATED',
            is_active: true,
          };
          qBatch.push(payload);
          if (!existingQ.has(topic.subject_id)) existingQ.set(topic.subject_id, new Set());
          existingQ.get(topic.subject_id).add(q.q);
        }
        if (existingForTopic + toAdd < 3) skippedQ += (3 - existingForTopic - toAdd);
      } else {
        skippedQ++;
      }
    }

    // Flashcards: ensure at least 1 set per topic
    if (DO_FLASHCARDS) {
      if ((fcByTopic.get(topic.id) || 0) === 0) {
        const cards = generateFlashcards(subjectName, topic.name, classCodeFor(topic));
        const title = `${topic.name} — Flashcards`;
        if (existingFC.get(topic.subject_id)?.has(title)) { skippedFC++; continue; }
        const payload = {
          subject_id: topic.subject_id,
          topic_id: topic.id,
          title,
          description: `Flashcards for ${topic.name}`,
          cards,
          mode: 'study',
          is_public: true,
          view_count: 0,
          usage_count: 0,
        };
        fcBatch.push(payload);
      } else {
        skippedFC++;
      }
    }

    if (qBatch.length >= 500 || fcBatch.length >= 500) await flushBatches();

    if (processed % 500 === 0 || processed === total) {
      console.log(`  Progress ${processed}/${total} | Q: +${insertedQ} FC: +${insertedFC} | errors: ${errors}`);
    }
  }

  await flushBatches(true);
  console.log('  Final flush complete');

  console.log('\n═══════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log(`  Topics scanned:      ${total}`);
  console.log(`  Questions inserted:  ${insertedQ} (skipped ${skippedQ})`);
  console.log(`  Flashcard sets:      ${insertedFC} (skipped ${skippedFC})`);
  console.log(`  Errors:              ${errors}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
