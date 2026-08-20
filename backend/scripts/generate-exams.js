/**
 * Generate practice exams and quizzes from the question bank.
 * Uses Supabase client directly (no local DB needed).
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, KEY);

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
}

async function main() {
  console.log('=== Exam & Quiz Generator ===\n');

  // Get subjects with IDs
  const { data: subjects } = await sb.from('subjects').select('id,code,name');
  const subjById = {};
  for (const s of subjects || []) subjById[s.id] = s;
  const codeToId = {};
  for (const s of subjects || []) codeToId[s.code] = s.id;
  console.log(`Loaded ${subjects.length} subjects\n`);

  // ── WAEC-style exams ───────────────────────────────────
  const EXAM_CONFIGS = [
    { name: 'WAEC Biology Practice', code: 'BIO', board: 'waec', duration: 180, qCount: 50 },
    { name: 'WAEC Chemistry Practice', code: 'CHM', board: 'waec', duration: 180, qCount: 50 },
    { name: 'WAEC Physics Practice', code: 'PHY', board: 'waec', duration: 180, qCount: 50 },
    { name: 'WAEC Mathematics Practice', code: 'MATH', board: 'waec', duration: 180, qCount: 50 },
    { name: 'WAEC English Practice', code: 'ENG', board: 'waec', duration: 150, qCount: 50 },
    { name: 'JAMB Mathematics CBT', code: 'MATH', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'JAMB English CBT', code: 'ENG', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'JAMB Biology CBT', code: 'BIO', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'JAMB Chemistry CBT', code: 'CHM', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'JAMB Physics CBT', code: 'PHY', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'JAMB Economics CBT', code: 'ECO', board: 'jamb', duration: 120, qCount: 40 },
    { name: 'NECO Government Practice', code: 'GOV', board: 'neco', duration: 150, qCount: 45 },
    { name: 'NECO Agricultural Science Practice', code: 'AGS', board: 'neco', duration: 150, qCount: 45 },
  ];

  let totalExams = 0;
  for (const cfg of EXAM_CONFIGS) {
    const subjId = codeToId[cfg.code];
    if (!subjId) continue;

    // Get active MCQ questions for this subject
    const { data: qs } = await sb.from('questions').select('id,question_text,options,correct_answer,difficulty,marks')
      .eq('subject_id', subjId).eq('question_type', 'mcq').eq('is_active', true);
    const questions = qs || [];
    if (questions.length < 10) {
      console.log(`  ⚠ ${cfg.name}: only ${questions.length} questions, skipping`);
      continue;
    }

    // Create exam
    const title = cfg.name;
    const slug = slugify(title);
    const { data: existing } = await sb.from('exams').select('id').eq('slug', slug).limit(1);
    if (existing?.length) { console.log(`  - ${title}: already exists`); continue; }

    // Shuffle and pick questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(cfg.qCount, questions.length));
    const totalMarks = selected.reduce((s, q) => s + (parseFloat(q.marks) || 1), 0);

    const { data: examRes } = await sb.from('exams').insert({
      title, slug, description: `${title} — ${selected.length} practice questions`,
      instructions: `Answer all ${selected.length} questions. You have ${cfg.duration} minutes.`,
      subject_id: subjId,
      exam_type: 'practice',
      duration_minutes: cfg.duration,
      total_marks: totalMarks,
      passing_marks: totalMarks * 0.5,
      is_timed: true, shuffle_questions: true,
      show_results_immediately: true, allow_review: true,
      max_attempts: 3, is_active: true, is_public: true,
    }).select('id').single();

    if (!examRes) { console.error(`  ✗ Failed to create ${title}`); continue; }
    const examId = examRes.id;

    for (let i = 0; i < selected.length; i++) {
      await sb.from('exam_questions').insert({
        exam_id: examId, question_id: selected[i].id,
        order_index: i, marks: parseFloat(selected[i].marks) || 1,
      });
    }
    totalExams++;
    console.log(`  ✓ ${title}: ${selected.length} questions, ${cfg.duration}min`);
  }

  // ── Quiz sets per subject topic ────────────────────────
  console.log(`\n── Creating Topic Quizzes ──`);
  const { data: topics } = await sb.from('topics').select('id,subject_id,name,code').eq('is_active', true);
  let quizCount = 0;

  for (const topic of topics || []) {
    const { data: tqs } = await sb.from('questions').select('id').eq('topic_id', topic.id).eq('is_active', true);
    if ((tqs?.length || 0) < 5) continue;

    const { data: existing } = await sb.from('quizzes').select('id')
      .eq('title', `Quiz: ${topic.name}`).limit(1);
    if (existing?.length) continue;

    const shuffled = [...tqs].sort(() => Math.random() - 0.5).slice(0, 10);
    const { data: quizRes } = await sb.from('quizzes').insert({
      course_id: null, lesson_id: null,
      title: `Quiz: ${topic.name}`,
      description: `${shuffled.length} practice questions on ${topic.name}`,
      instructions: 'Answer all questions. Review explanations after each question.',
      time_limit_minutes: shuffled.length * 2,
      passing_score: 50, max_attempts: 3,
      shuffle_questions: true, show_explanation: true, is_active: true,
    }).select('id').single();

    if (!quizRes) continue;
    const quizId = quizRes.id;
    for (let i = 0; i < shuffled.length; i++) {
      await sb.from('quiz_questions').insert({
        quiz_id: quizId, question_id: shuffled[i].id,
        order_index: i, marks: 1,
      });
    }
    quizCount++;
    if (quizCount % 50 === 0) console.log(`  ... ${quizCount} quizzes created`);
  }

  // ── VERIFY ─────────────────────────────────────────────
  console.log('\n═══ FINAL COUNTS ═══');
  for (const tbl of ['exams','quiz_questions','quizzes','questions','lessons','topics','flashcards']) {
    const { count } = await sb.from(tbl).select('*', { count:'exact', head:true });
    console.log(`  ${tbl}: ${(count??0).toLocaleString()}`);
  }
  console.log(`\n✅ Exams created: ${totalExams}, Quizzes created: ${quizCount}`);
}

main().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
