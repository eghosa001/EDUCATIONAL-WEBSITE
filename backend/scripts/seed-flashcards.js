import { query, closePool } from '../src/common/database/index.js';

const cleanup = async () => {
  await query('DELETE FROM flashcard_reviews');
  await query('DELETE FROM flashcards');
  console.log('Cleared flashcards');
};

const buildFlashcards = async () => {
  const biologyResult = await query("SELECT id FROM subjects WHERE code = 'BIO'");
  if (!biologyResult.rows.length) { console.log('No Biology subject'); return 0; }
  const subjectId = biologyResult.rows[0].id;

  const courseResult = await query("SELECT id FROM courses WHERE status = 'published' LIMIT 1");
  const courseId = courseResult.rows[0]?.id || null;

  // Build flashcards from questions
  const questions = await query(
    `SELECT q.id, q.question_text, q.correct_answer, q.explanation, t.name as topic_name, t.id as topic_id
     FROM questions q LEFT JOIN topics t ON t.id = q.topic_id
     WHERE q.subject_id = $1 AND q.is_active = TRUE`,
    [subjectId]
  );

  // Group by topic for set-based flashcards
  const topicGroups = {};
  for (const q of questions.rows) {
    const key = q.topic_id || 'general';
    if (!topicGroups[key]) topicGroups[key] = { name: q.topic_name || 'General', questions: [] };
    const ca = typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer);
    topicGroups[key].questions.push({ front: q.question_text, back: `Answer: ${ca}` + (q.explanation ? '\n' + q.explanation : '') });
  }

  let flashcardsCreated = 0;
  for (const [key, group] of Object.entries(topicGroups)) {
    if (group.questions.length < 2) continue;
    const title = `SS2 Biology — ${group.name} Flashcards`;
    const result = await query(
      `INSERT INTO flashcards (course_id, subject_id, topic_id, title, description, cards, mode, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, 'standard', TRUE)
       RETURNING id`,
      [
        courseId, subjectId, key === 'general' ? null : key,
        title,
        `${group.questions.length} flashcards covering ${group.name}`,
        JSON.stringify(group.questions.map(q => ({ front: q.front, back: q.back }))),
      ]
    );
    if (result.rows.length) {
      console.log(`Created: ${title} (${group.questions.length} cards)`);
      flashcardsCreated++;
    }
  }

  console.log(`Total flashcard sets created: ${flashcardsCreated}`);
  return flashcardsCreated;
};

const run = async () => {
  await cleanup();
  await buildFlashcards();
  const result = await query('SELECT COUNT(*) as total FROM flashcards');
  console.log(`Flashcard sets in database: ${result.rows[0].total}`);
  await closePool();
};

run().catch(err => { console.error('Flashcard seed failed:', err); closePool(); process.exit(1); });
