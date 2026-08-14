import { query, closePool } from '../src/common/database/index.js';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';

const BYNARA_API_KEY = process.env.BYNARA_API_KEY || process.env.OPENAI_API_KEY;
const BYNARA_BASE_URL = process.env.BYNARA_BASE_URL || 'https://router.bynara.id/v1';
const AI_MODEL = process.env.AI_DEFAULT_MODEL || 'agnes-2.5-flash';

let aiClient = null;
if (BYNARA_API_KEY) {
  aiClient = new OpenAI({ apiKey: BYNARA_API_KEY, baseURL: BYNARA_BASE_URL });
}

async function ensureEducationStructure() {
  const systemRes = await query("SELECT id FROM education_systems WHERE code = 'NG-NCC'");
  if (!systemRes.rows.length) {
    const sys = await query(
      `INSERT INTO education_systems (name, code, country, description) 
       VALUES ('Nigerian National Curriculum', 'NG-NCC', 'Nigeria', 
               'The Nigerian national education curriculum across primary, junior secondary, and senior secondary education.')
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      []
    );
    console.log('Created education system');
  }
  
  const systemId = (await query("SELECT id FROM education_systems WHERE code = 'NG-NCC'")).rows[0].id;

  const levels = [
    { name: 'Pre-Nursery', code: 'PN', orderIndex: 0, minAge: 3, maxAge: 4 },
    { name: 'Primary 1', code: 'P1', orderIndex: 1, minAge: 6, maxAge: 7 },
    { name: 'Primary 2', code: 'P2', orderIndex: 2, minAge: 7, maxAge: 8 },
    { name: 'Primary 3', code: 'P3', orderIndex: 3, minAge: 8, maxAge: 9 },
    { name: 'Primary 4', code: 'P4', orderIndex: 4, minAge: 9, maxAge: 10 },
    { name: 'Primary 5', code: 'P5', orderIndex: 5, minAge: 10, maxAge: 11 },
    { name: 'Primary 6', code: 'P6', orderIndex: 6, minAge: 11, maxAge: 12 },
    { name: 'Junior Secondary 1', code: 'JSS1', orderIndex: 7, minAge: 12, maxAge: 13 },
    { name: 'Junior Secondary 2', code: 'JSS2', orderIndex: 8, minAge: 13, maxAge: 14 },
    { name: 'Junior Secondary 3', code: 'JSS3', orderIndex: 9, minAge: 14, maxAge: 15 },
    { name: 'Senior Secondary 1', code: 'SSS1', orderIndex: 10, minAge: 15, maxAge: 16 },
    { name: 'Senior Secondary 2', code: 'SSS2', orderIndex: 11, minAge: 16, maxAge: 17 },
    { name: 'Senior Secondary 3', code: 'SSS3', orderIndex: 12, minAge: 17, maxAge: 18 },
  ];

  const levelIds = {};
  for (const lvl of levels) {
    const res = await query(
      `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [systemId, lvl.name, lvl.code, `${lvl.name} in the Nigerian education system`, lvl.orderIndex, lvl.minAge, lvl.maxAge]
    );
    levelIds[lvl.code] = res.rows[0].id;
  }
  console.log(`Ensured ${levels.length} education levels`);

  // Create programs and classes for each level
  for (const lvl of levels) {
    const levelId = levelIds[lvl.code];
    const programRes = await query(
      `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
       VALUES ($1, $2 || ' Program', $3 || '-PGM', $2 || ' general program', 1, $4)
       ON CONFLICT (education_level_id, code) DO UPDATE SET education_level_id = EXCLUDED.education_level_id RETURNING id`,
      [levelId, lvl.name, lvl.code, lvl.orderIndex]
    );
    const programId = programRes.rows[0].id;

    await query(
      `INSERT INTO classes (program_id, name, code, order_index)
       VALUES ($1, $2 || ' A', $3 || '-A', 1)
       ON CONFLICT (program_id, code) DO NOTHING`,
      [programId, lvl.name, lvl.code]
    );
    await query(
      `INSERT INTO classes (program_id, name, code, order_index)
       VALUES ($1, $2 || ' B', $3 || '-B', 2)
       ON CONFLICT (program_id, code) DO NOTHING`,
      [programId, lvl.name, lvl.code]
    );
  }
  console.log('Ensured programs and classes for all levels');

  // Ensure terms exist
  const terms = [
    { name: 'First Term', code: 'TERM-1', orderIndex: 1 },
    { name: 'Second Term', code: 'TERM-2', orderIndex: 2 },
    { name: 'Third Term', code: 'TERM-3', orderIndex: 3 },
  ];
  for (const term of terms) {
    await query(
      `INSERT INTO terms (education_system_id, name, code, description, order_index)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [systemId, term.name, term.code, term.description, term.orderIndex]
    );
  }
  console.log('Ensured terms');

  return { systemId, levelIds };
}

function makeCode(str) {
  return str.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

async function seedSubjectsAndTopics(curriculum, levelIds) {
  const termMap = { first: 'TERM-1', second: 'TERM-2', third: 'TERM-3' };
  const classCodeMap = {
    'PRE-NURSERY': 'PN', 'P1': 'P1', 'P2': 'P2', 'P3': 'P3', 'P4': 'P4', 'P5': 'P5', 'P6': 'P6',
    'JSS1': 'JSS1', 'JSS2': 'JSS2', 'JSS3': 'JSS3',
    'SSS1': 'SSS1', 'SSS2': 'SSS2', 'SSS3': 'SSS3',
  };

  let totalSubjects = 0;
  let totalTopics = 0;
  let totalSubtopics = 0;
  let totalLessons = 0;
  let totalQuestions = 0;

  for (const [classCode, subjects] of Object.entries(curriculum)) {
    const levelCode = classCodeMap[classCode];
    if (!levelCode || !levelIds[levelCode]) {
      console.log(`  Skipping ${classCode} - no level found`);
      continue;
    }
    const levelId = levelIds[levelCode];

    for (const [subjectName, termsData] of Object.entries(subjects)) {
      // Check if subject already exists
      const code = makeCode(subjectName);
      const existing = await query(
        "SELECT id FROM subjects WHERE code = $1 LIMIT 1", [code]
      );

      let subjectId;
      if (existing.rows.length) {
        subjectId = existing.rows[0].id;
      } else {
        const subjRes = await query(
          `INSERT INTO subjects (education_system_id, name, code, description, is_core, order_index)
           VALUES ((SELECT id FROM education_systems WHERE code = 'NG-NCC'), $1, $2, $3, $4, $5)
           RETURNING id`,
          [subjectName, code, `Nigerian NERDC curriculum for ${subjectName}`, code === 'MATH' || code === 'ENG' || code === 'BIO' || code === 'CHEM' || code === 'PHY', totalSubjects]
        );
        subjectId = subjRes.rows[0].id;
        totalSubjects++;
      }

      let termTopicCount = 0;
      for (const [termKey, topics] of Object.entries(termsData)) {
        const termCode = termMap[termKey];
        if (!termCode) continue;

        const classRes = await query(
          `SELECT c.id FROM classes c JOIN programs p ON p.id = c.program_id 
           JOIN education_levels el ON el.id = p.education_level_id 
           WHERE el.code = $1 AND c.code LIKE $2 LIMIT 1`,
          [levelCode, `${levelCode}-%`]
        );
        const classId = classRes.rows[0]?.id;
        if (!classId) continue;

        for (let idx = 0; idx < topics.length; idx++) {
          const topic = topics[idx];
          const topicCode = `${code}_${termKey}_${idx.toString().padStart(2, '0')}`;

          const topicRes = await query(
            `INSERT INTO topics (subject_id, class_id, term_id, name, code, description, learning_objectives, order_index, estimated_hours, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
             ON CONFLICT (subject_id, class_id, term_id, code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
             RETURNING id`,
            [subjectId, classId, termCode, topic.name, topicCode, null, '[]', idx, 1]
          );
          const topicId = topicRes.rows[0].id;
          termTopicCount++;
          totalTopics++;

          // Insert subtopics
          if (topic.subtopics && topic.subtopics.length > 0) {
            for (let sIdx = 0; sIdx < topic.subtopics.length; sIdx++) {
              const sub = topic.subtopics[sIdx];
              const subCode = `${topicCode}_S${sIdx.toString().padStart(2, '0')}`;
              await query(
                `INSERT INTO subtopics (topic_id, name, code, description, learning_objectives, order_index, estimated_hours, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                 ON CONFLICT (topic_id, code) DO NOTHING`,
                [topicId, sub, subCode, null, '[]', sIdx, 0.5]
              );
              totalSubtopics++;
            }
          }
        }
      }
      console.log(`  ${classCode} / ${subjectName}: ${termTopicCount} topics`);
    }
  }

  console.log(`\nSeeded: ${totalSubjects} subjects, ${totalTopics} topics, ${totalSubtopics} subtopics`);
  return { totalSubjects, totalTopics, totalSubtopics };
}

async function generateAILessons(curriculum, levelIds) {
  if (!aiClient) {
    console.log('No AI client configured, skipping lesson generation');
    return 0;
  }

  const termMap = { first: 'TERM-1', second: 'TERM-2', third: 'TERM-3' };
  const classCodeMap = {
    'PRE-NURSERY': 'PN', 'P1': 'P1', 'P2': 'P2', 'P3': 'P3', 'P4': 'P4', 'P5': 'P5', 'P6': 'P6',
    'JSS1': 'JSS1', 'JSS2': 'JSS2', 'JSS3': 'JSS3',
    'SSS1': 'SSS1', 'SSS2': 'SSS2', 'SSS3': 'SSS3',
  };

  let generated = 0;
  const BATCH_SIZE = 5;
  let batch = [];

  for (const [classCode, subjects] of Object.entries(curriculum)) {
    const levelCode = classCodeMap[classCode];
    if (!levelCode || !levelIds[levelCode]) continue;

    for (const [subjectName, termsData] of Object.entries(subjects)) {
      const code = makeCode(subjectName);
      const subjectRes = await query("SELECT id FROM subjects WHERE code = $1", [code]);
      if (!subjectRes.rows.length) continue;
      const subjectId = subjectRes.rows[0].id;

      const classRes = await query(
        `SELECT c.id FROM classes c JOIN programs p ON p.id = c.program_id 
         JOIN education_levels el ON el.id = p.education_level_id 
         WHERE el.code = $1 AND c.code LIKE $2 LIMIT 1`,
        [levelCode, `${levelCode}-%`]
      );
      const classId = classRes.rows[0]?.id;
      if (!classId) continue;

      for (const [termKey, topics] of Object.entries(termsData)) {
        const termCode = termMap[termKey];
        if (!termCode) continue;

        for (let idx = 0; idx < topics.length; idx++) {
          const topic = topics[idx];
          const topicCode = `${code}_${termKey}_${idx.toString().padStart(2, '0')}`;
          
          const topicRes = await query(
            "SELECT id FROM topics WHERE code = $1 AND subject_id = $2 AND class_id = $3 LIMIT 1",
            [topicCode, subjectId, classId]
          );
          if (!topicRes.rows.length) continue;
          const topicId = topicRes.rows[0].id;

          const subtopics = topic.subtopics?.join(', ') || '';
          const prompt = `Create a concise educational lesson about "${topic.name}" for ${classCode} ${subjectName} students in the ${termKey} term.
          
Subtopics covered: ${subtopics || 'General topic introduction'}

Generate:
1. A short description (2-3 sentences)
2. Learning objectives as a JSON array of strings
3. Key points as a JSON array of strings (3-5 points)
4. Written content of 200-400 words explaining the topic clearly with examples relevant to Nigerian students
5. Suggest 3 practice questions (MCQ format with options A-D, correct answer, and explanation)

Return as valid JSON with keys: description, learning_objectives, key_points, written_content, practice_questions`;

          try {
            const response = await aiClient.chat.completions.create({
              model: AI_MODEL,
              messages: [
                { role: 'system', content: 'You are an expert Nigerian curriculum content creator. Create accurate, engaging educational content aligned with the NERDC curriculum.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 1500,
            });

            const content = response.choices[0]?.message?.content || '';
            let parsed;
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch {
              parsed = null;
            }

            if (parsed) {
              await query(
                `INSERT INTO lessons (course_id, topic_id, title, slug, description, learning_objectives, content_type, written_content, key_points, order_index, is_free, is_published, estimated_minutes)
                 VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE, $10)
                 ON CONFLICT DO NOTHING`,
                [
                  topicId,
                  `${classCode} ${subjectName}: ${topic.name}`,
                  slugify(`${classCode}-${code.toLowerCase()}-${slugify(topic.name)}`),
                  parsed.description || topic.name,
                  JSON.stringify(parsed.learning_objectives || []),
                  'text',
                  parsed.written_content || `Lesson on ${topic.name} covering: ${subtopics}`,
                  JSON.stringify(parsed.key_points || []),
                  idx,
                  Math.max(15, Math.min(45, Math.ceil((parsed.written_content?.length || 300) / 200))),
                ]
              );
              generated++;

              // Insert practice questions
              if (parsed.practice_questions && Array.isArray(parsed.practice_questions)) {
                for (const q of parsed.practice_questions.slice(0, 3)) {
                  await query(
                    `INSERT INTO questions (subject_id, topic_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, is_active)
                     VALUES ($1, $2, 'mcq', $3, $4, $5, $6, $7, 1, 'AI_GENERATED', TRUE)
                     ON CONFLICT DO NOTHING`,
                    [
                      subjectId, topicId,
                      q.question || topic.name + ' - practice question',
                      JSON.stringify(q.options || [
                        { id: 'A', text: 'Option A' },
                        { id: 'B', text: 'Option B' },
                        { id: 'C', text: 'Option C' },
                        { id: 'D', text: 'Option D' },
                      ]),
                      JSON.stringify(q.answer || 'A'),
                      q.explanation || 'Explanation for the correct answer.',
                      ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
                    ]
                  );
                  totalQuestions++;
                }
              }
            }
          } catch (err) {
            console.error(`  Failed to generate lesson for ${classCode}/${subjectName}/${topic.name}: ${err.message}`);
          }

          // Small delay to avoid rate limiting
          if (generated % BATCH_SIZE === 0) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
    }
  }

  console.log(`\nGenerated ${generated} AI lessons`);
  return generated;
}

const run = async () => {
  console.log('=== Nigerian Curriculum Seed Script ===\n');
  
  let curriculum;
  try {
    const fs = await import('fs/promises');
    const data = await fs.readFile('scripts/parsed_curriculum.json', 'utf8');
    curriculum = JSON.parse(data);
    console.log(`Loaded curriculum data: ${Object.keys(curriculum).length} classes\n`);
  } catch (err) {
    console.error('Failed to load parsed_curriculum.json. Run parse-curriculum.js first.');
    process.exit(1);
  }

  await ensureEducationStructure();
  const levelIds = {
    'PN': null, 'P1': null, 'P2': null, 'P3': null, 'P4': null, 'P5': null, 'P6': null,
    'JSS1': null, 'JSS2': null, 'JSS3': null,
    'SSS1': null, 'SSS2': null, 'SSS3': null,
  };
  const lvlRes = await query("SELECT id, code FROM education_levels WHERE code IN ($1)", [
    Object.keys(levelIds)
  ]);
  for (const row of lvlRes.rows) levelIds[row.code] = row.id;

  await seedSubjectsAndTopics(curriculum, levelIds);
  await generateAILessons(curriculum, levelIds);

  await closePool();
  console.log('\nCurriculum seed complete.');
};

run().catch((error) => {
  console.error('Seed failed:', error);
  closePool().finally(() => process.exit(1));
});
