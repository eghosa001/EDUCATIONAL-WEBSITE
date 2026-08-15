/**
 * Expand question bank with diverse question types.
 * Adds essay, numerical, and true/false questions to complement existing MCQs.
 */
import { query, closePool } from '../src/common/database/index.js';

const ESSAY_TEMPLATES = {
  MATHEMATICS: [
    { text: 'Show that the quadratic formula gives the roots of ax² + bx + c = 0.', topic: 'Algebra' },
    { text: 'Prove that the sum of angles in a triangle is 180°.', topic: 'Geometry' },
    { text: 'Solve the simultaneous equations: 2x + y = 7 and x - y = 2.', topic: 'Linear Equations' },
    { text: 'Find the equation of the straight line passing through (2,3) and (4,7).', topic: 'Coordinate Geometry' },
    { text: 'Calculate the area of a circle with radius 7cm. Use π = 22/7.', topic: 'Area' },
  ],
  ENGLISH_LANGUAGE: [
    { text: 'Write an essay of not less than 450 words on: "The importance of education in Nigerian society."', topic: 'Essay' },
    { text: 'Summarize the main idea of the passage provided in not more than 150 words.', topic: 'Summary' },
    { text: 'Correct the errors in the following passage.', topic: 'Error Correction' },
    { text: 'Complete the story beginning: "I never expected to win the competition..."', topic: 'Composition' },
  ],
  BIOLOGY: [
    { text: 'Describe the process of photosynthesis and its importance to life on Earth.', topic: 'Photosynthesis' },
    { text: 'Explain the structure and function of the human heart.', topic: 'Anatomy' },
    { text: 'Discuss the mechanisms of evolution and natural selection.', topic: 'Evolution' },
    { text: 'Describe the human excretory system and its functions.', topic: 'Excretion' },
  ],
  CHEMISTRY: [
    { text: 'Explain the principles of atomic structure and how they relate to the periodic table.', topic: 'Atomic Structure' },
    { text: 'Describe the methods of water purification used in Nigeria.', topic: 'Water Chemistry' },
    { text: 'Explain the process of electrolysis and its industrial applications.', topic: 'Electrolysis' },
    { text: 'Describe the properties and uses of alkanes, alkenes, and alkynes.', topic: 'Organic Chemistry' },
  ],
  PHYSICS: [
    { text: 'Derive the equation of motion: v = u + at.', topic: 'Kinematics' },
    { text: 'Explain the laws of reflection and refraction of light with diagrams.', topic: 'Optics' },
    { text: 'Describe the construction and working of a simple electric motor.', topic: 'Electromagnetism' },
    { text: 'Explain the concept of conservation of energy with examples.', topic: 'Energy' },
  ],
};

const TRUE_FALSE_QUESTIONS = [
  { text: 'The Earth is the fourth planet from the Sun.', answer: { id: 'F', text: 'False' }, explanation: 'Earth is the third planet from the Sun.' },
  { text: 'Water boils at 100°C at sea level.', answer: { id: 'T', text: 'True' }, explanation: 'Pure water boils at 100°C (212°F) at standard atmospheric pressure.' },
  { text: 'The chemical symbol for gold is Go.', answer: { id: 'F', text: 'False' }, explanation: 'The chemical symbol for gold is Au (from Latin: Aurum).' },
  { text: 'Light travels faster than sound.', answer: { id: 'T', text: 'True' }, explanation: 'Light travels at approximately 3 × 10⁸ m/s, while sound travels at about 343 m/s in air.' },
  { text: 'The human heart has four chambers.', answer: { id: 'T', text: 'True' }, explanation: 'The human heart has two atria and two ventricles, making four chambers total.' },
  { text: 'Plants produce oxygen during respiration.', answer: { id: 'F', text: 'False' }, explanation: 'Plants produce oxygen during photosynthesis, not respiration. During respiration, they consume oxygen.' },
  { text: 'Nigeria gained independence in 1960.', answer: { id: 'T', text: 'True' }, explanation: 'Nigeria gained independence from Britain on October 1, 1960.' },
  { text: 'The capital of Nigeria is Lagos.', answer: { id: 'F', text: 'False' }, explanation: 'The capital of Nigeria is Abuja. Lagos was the former capital.' },
];

const NUMERICAL_QUESTIONS = [
  { text: 'Calculate: 25% of 480', answer: '120', explanation: '25% × 480 = 0.25 × 480 = 120' },
  { text: 'Simplify: 3³ × 2²', answer: '108', explanation: '3³ = 27, 2² = 4, so 27 × 4 = 108' },
  { text: 'Find the HCF of 24 and 36', answer: '12', explanation: 'Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. HCF = 12' },
  { text: 'Convert 2.5 km to meters', answer: '2500', explanation: '1 km = 1000 m, so 2.5 km = 2500 m' },
  { text: 'If x + 5 = 12, find x', answer: '7', explanation: 'x = 12 - 5 = 7' },
  { text: 'Calculate the area of a rectangle with length 12cm and width 8cm', answer: '96', explanation: 'Area = length × width = 12 × 8 = 96 cm²' },
  { text: 'What is the square root of 144?', answer: '12', explanation: '12 × 12 = 144' },
  { text: 'Evaluate: 15 ÷ 3 + 2 × 4', answer: '13', explanation: 'Following BODMAS: 15÷3 = 5, 2×4 = 8, so 5+8 = 13' },
];

async function main() {
  console.log('=== Question Type Expander ===\n');

  // Get subject IDs
  const subjectsRes = await query(`SELECT id, name FROM subjects WHERE is_active = TRUE`);
  const subjectMap = {};
  for (const s of subjectsRes.rows) {
    subjectMap[s.name.toUpperCase()] = s.id;
  }
  console.log(`Loaded ${Object.keys(subjectMap).length} subjects\n`);

  let essayCount = 0;
  let tfCount = 0;
  let numCount = 0;

  // Add essay questions
  console.log('Adding essay questions...');
  for (const [subject, templates] of Object.entries(ESSAY_TEMPLATES)) {
    const subjectId = subjectMap[subject.toUpperCase()];
    if (!subjectId) continue;

    for (const tmpl of templates) {
      await query(
        `INSERT INTO questions (
          subject_id, question_type, question_text, correct_answer, explanation,
          difficulty, marks, source, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        ON CONFLICT DO NOTHING`,
        [
          subjectId,
          'essay',
          tmpl.text,
          JSON.stringify({ id: 'N/A', text: 'Essay response' }),
          tmpl.explanation || 'See marking scheme.',
          'medium',
          10,
          'SYSTEM_GENERATED',
        ]
      );
      essayCount++;
    }
  }

  // Add true/false questions
  console.log('Adding true/false questions...');
  const mathSubjectId = subjectMap['MATHEMATICS'];
  if (mathSubjectId) {
    for (const tf of TRUE_FALSE_QUESTIONS) {
      await query(
        `INSERT INTO questions (
          subject_id, question_type, question_text, options, correct_answer, explanation,
          difficulty, marks, source, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        ON CONFLICT DO NOTHING`,
        [
          mathSubjectId,
          'true_false',
          tf.text,
          JSON.stringify([
            { id: 'T', text: 'True' },
            { id: 'F', text: 'False' },
          ]),
          JSON.stringify(tf.answer),
          tf.explanation,
          'easy',
          1,
          'SYSTEM_GENERATED',
        ]
      );
      tfCount++;
    }
  }

  // Add numerical questions
  console.log('Adding numerical questions...');
  if (mathSubjectId) {
    for (const num of NUMERICAL_QUESTIONS) {
      await query(
        `INSERT INTO questions (
          subject_id, question_type, question_text, correct_answer, explanation,
          difficulty, marks, source, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        ON CONFLICT DO NOTHING`,
        [
          mathSubjectId,
          'numerical',
          num.text,
          JSON.stringify({ id: 'A', text: num.answer }),
          num.explanation,
          'medium',
          2,
          'SYSTEM_GENERATED',
        ]
      );
      numCount++;
    }
  }

  console.log(`\n✅ Question expansion complete:`);
  console.log(`   Essay questions:   ${essayCount}`);
  console.log(`   True/False:        ${tfCount}`);
  console.log(`   Numerical:         ${numCount}`);

  // Verify
  const verify = await query(`
    SELECT question_type, COUNT(*) as count
    FROM questions
    GROUP BY question_type
    ORDER BY count DESC
  `);
  console.log('\nQuestions by type:');
  for (const row of verify.rows) {
    console.log(`   ${row.question_type}: ${row.count}`);
  }

  await closePool();
}

main().catch(err => {
  console.error('❌ Expansion failed:', err);
  closePool().finally(() => process.exit(1));
});
