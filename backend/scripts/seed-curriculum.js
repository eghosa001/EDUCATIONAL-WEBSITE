/**
 * Nigerian NERDC Curriculum Seed Script
 * 
 * Properly merges subjects across the 6 classes (JSS1–JSS3, SSS1–SSS3),
 * so Mathematics appears once and spans all 6 classes, etc.
 * 
 * Usage: cd backend && node scripts/seed-curriculum.js
 */
import { query, closePool } from '../src/common/database/index.js';
import OpenAI from 'openai';
import fs from 'fs/promises';

const BYNARA_API_KEY = process.env.BYNARA_API_KEY || process.env.OPENAI_API_KEY;
const BYNARA_BASE_URL = process.env.BYNARA_BASE_URL || 'https://router.bynara.id/v1';
const AI_MODEL = process.env.AI_DEFAULT_MODEL || 'agnes-2.5-flash';

let aiClient = null;
if (BYNARA_API_KEY) {
  aiClient = new OpenAI({ apiKey: BYNARA_API_KEY, baseURL: BYNARA_BASE_URL });
}

// ── Normalize subject names so they merge correctly across classes ──
function normalizeSubjectName(rawName) {
  // Trim whitespace and normalize
  let name = rawName.trim().replace(/\s+/g, ' ');
  
  // Remove trailing artifacts
  name = name.replace(/\s+SCHEME\s*OF?\s*WORK\s*$/, '').trim();
  name = name.replace(/\s*\([^)]*SCHEME[^)]*\)\s*$/, '').trim();
  
  // Normalize common variants
  const aliases = {
    'CHRISTIAN RELIGIOUS STUDIES (CRS)': 'CHRISTIAN RELIGIOUS STUDIES',
    'ISLAMIC RELIGIOUS STUDIES (IRS)': 'ISLAMIC RELIGIOUS STUDIES',
    'CULTURAL & CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
    'PHYSICAL & HEALTH EDUCATION': 'PHYSICAL AND HEALTH EDUCATION',
    'CULTURAL AND CREATIVE ARTS (CCA)': 'CULTURAL AND CREATIVE ARTS',
    'CATERING AND CRAFT': 'CATERING AND CRAFT PRACTICE',
    'FASHION DESIGN & GARMENT MAKING': 'FASHION DESIGN AND GARMENT MAKING',
    'SOLAR PHOTOVOLTAIC INSTALLATION & MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
    'SOLAR PHOTOVOLTAIC (PV) INSTALLATION AND MAINTENANCE': 'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE',
  };
  return aliases[name] || name;
}

function makeCode(name) {
  // Create short unique codes (max 20 chars)
  const shorthand = {
    'MATHEMATICS': 'MATH', 'ENGLISH STUDIES': 'ENG', 'ENGLISH LANGUAGE': 'ENG',
    'BIOLOGY': 'BIO', 'CHEMISTRY': 'CHEM', 'PHYSICS': 'PHY',
    'AGRICULTURAL SCIENCE': 'AGR', 'FINANCIAL ACCOUNTING': 'ACC',
    'COMMERCE': 'COMM', 'ECONOMICS': 'ECO', 'GOVERNMENT': 'GOV',
    'GEOGRAPHY': 'GEO', 'HISTORY': 'HIST', 'LITERATURE-IN-ENGLISH': 'LIT',
    'MARKETING': 'MKT', 'DIGITAL TECHNOLOGIES': 'DTech',
    'COMPUTER HARDWARE AND GSM REPAIRS': 'GSM',
    'CITIZENSHIP AND HERITAGE STUDIES': 'CIV',
    'CULTURAL AND CREATIVE ARTS': 'CCA',
    'PHYSICAL AND HEALTH EDUCATION': 'PHE',
    'BEAUTY AND COSMETOLOGY': 'BCOS',
    'FASHION DESIGN AND GARMENT MAKING': 'FASH',
    'FOOD AND NUTRITION': 'FDN',
    'TECHNICAL DRAWING': 'TDRAW',
    'VISUAL ARTS': 'VART',
    'CATERING AND CRAFT PRACTICE': 'CAT',
    'LIVESTOCK FARMING': 'LIV',
    'HORTICULTURE AND CROP PRODUCTION': 'HORT',
    'SOLAR PHOTOVOLTAIC INSTALLATION AND MAINTENANCE': 'SOLAR',
    'ISLAMIC RELIGIOUS STUDIES': 'IRS',
    'CHRISTIAN RELIGIOUS STUDIES': 'CRS',
    'BUSINESS STUDIES': 'BUS',
    'INTERMEDIATE SCIENCE': 'ISC',
    'FRENCH': 'FRE',
    'FURTHER MATHEMATICS': 'FMATH',
    'HEALTH HABITS': 'HLTH',
    'HANDWRITING': 'HAND',
    'LITERACY (LETTER WORK)': 'LITLET',
    'LITERACY (LANGUAGE DOMAIN)': 'LITLANG',
    'NUMERACY': 'NUM',
    'PRE-SCIENCE': 'PRESCI',
    'SOCIAL HABITS': 'SOC',
    'CIVIC EDUCATION': 'CIVED',
    'CREATIVITY': 'CREA',
    'PERSONAL DEVELOPMENT': 'PERS',
    'SONGS AND RHYMES': 'SONG',
    'PREVOCATIONAL STUDIES': 'PREVOC',
    'BASIC SCIENCE & TECHNOLOGY': 'BST',
  };
  return shorthand[name] || name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 20);
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

// ── Step 1: Build education structure ────────────────────────────────
async function ensureEducationStructure() {
  // Ensure system exists
  const sysRes = await query(
    `INSERT INTO education_systems (name, code, country, description)
     VALUES ('Nigerian National Curriculum', 'NG-NCC', 'Nigeria',
             'The Nigerian national education curriculum across early childhood (pre-nursery), primary, junior secondary and senior secondary education.')
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    []
  );
  const systemId = sysRes.rows[0].id;

  // Ensure levels exist (Pre-Nursery → SSS3)
  const levels = [
    { code: 'PRE-NURSERY', name: 'Pre-Nursery', orderIndex: 1, minAge: 2, maxAge: 3 },
    { code: 'NURSERY1', name: 'Nursery 1', orderIndex: 2, minAge: 3, maxAge: 4 },
    { code: 'NURSERY2', name: 'Nursery 2', orderIndex: 3, minAge: 4, maxAge: 5 },
    { code: 'NURSERY3', name: 'Nursery 3', orderIndex: 4, minAge: 5, maxAge: 6 },
    { code: 'P1', name: 'Primary 1', orderIndex: 5, minAge: 6, maxAge: 7 },
    { code: 'P2', name: 'Primary 2', orderIndex: 6, minAge: 7, maxAge: 8 },
    { code: 'P3', name: 'Primary 3', orderIndex: 7, minAge: 8, maxAge: 9 },
    { code: 'P4', name: 'Primary 4', orderIndex: 8, minAge: 9, maxAge: 10 },
    { code: 'P5', name: 'Primary 5', orderIndex: 9, minAge: 10, maxAge: 11 },
    { code: 'P6', name: 'Primary 6', orderIndex: 10, minAge: 11, maxAge: 12 },
    { code: 'JSS1', name: 'Junior Secondary 1', orderIndex: 11, minAge: 12, maxAge: 13 },
    { code: 'JSS2', name: 'Junior Secondary 2', orderIndex: 12, minAge: 13, maxAge: 14 },
    { code: 'JSS3', name: 'Junior Secondary 3', orderIndex: 13, minAge: 14, maxAge: 15 },
    { code: 'SSS1', name: 'Senior Secondary 1', orderIndex: 14, minAge: 15, maxAge: 16 },
    { code: 'SSS2', name: 'Senior Secondary 2', orderIndex: 15, minAge: 16, maxAge: 17 },
    { code: 'SSS3', name: 'Senior Secondary 3', orderIndex: 16, minAge: 17, maxAge: 18 },
  ];

  const levelIds = {};
  for (const lvl of levels) {
    const res = await query(
      `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [systemId, lvl.name, lvl.code, `${lvl.name} — Nigerian basic education`, lvl.orderIndex, lvl.minAge, lvl.maxAge]
    );
    levelIds[lvl.code] = res.rows[0].id;
  }
  console.log(`Ensured ${levels.length} education levels`);

  // Ensure programs and classes for each level
  for (const lvl of levels) {
    const programRes = await query(
      `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
       VALUES ($1, $2 || ' Program', $3 || '-PGM', $2 || ' general program', 1, $4)
       ON CONFLICT (education_level_id, code) DO UPDATE SET education_level_id = EXCLUDED.education_level_id RETURNING id`,
      [levelIds[lvl.code], lvl.name, lvl.code, lvl.orderIndex]
    );
    const programId = programRes.rows[0].id;

    // Class A and B for each level
    for (const clsLetter of ['A', 'B']) {
      await query(
        `INSERT INTO classes (program_id, name, code, order_index)
         VALUES ($1, $2 || ' Class ' || $3, $4 || '-' || $3, $5)
         ON CONFLICT (program_id, code) DO NOTHING`,
        [programId, lvl.name, clsLetter, lvl.code, clsLetter === 'A' ? 1 : 2]
      );
    }
  }
  console.log(`Ensured programs and classes for all ${levels.length} levels`);

  // Ensure terms exist
  const termCodes = ['TERM-1', 'TERM-2', 'TERM-3'];
  for (const [idx, code] of termCodes.entries()) {
    await query(
      `INSERT INTO terms (education_system_id, name, code, description, order_index)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (education_system_id, code) DO UPDATE SET name = EXCLUDED.name`,
      [systemId, code === 'TERM-1' ? 'First Term' : code === 'TERM-2' ? 'Second Term' : 'Third Term', code, '', idx + 1]
    );
  }
  // Fetch term UUIDs
  const termRes = await query("SELECT id, code FROM terms WHERE code = ANY($1::text[])", [termCodes]);
  const termIdMap = {};
  for (const r of termRes.rows) termIdMap[r.code] = r.id;
  console.log('Ensured 3 academic terms');

  return { systemId, levelIds, termIdMap };
}

// ── Step 2: Merge parsed data into per-subject format ───────────────
// Input: { JSS1: { MATH: {first:[...], second:[...], third:[...]}, ... }, JSS2: {...}, ... }
// Output: { MATH: { JSS1: [...topics...], JSS2: [...], JSS3: [...], SSS1: [...], SSS2: [...], SSS3: [...] }, ... }
function buildSubjectMap(parsedData) {
  const subjectMap = {};

  for (const [classCode, subjects] of Object.entries(parsedData)) {
    for (const [rawName, termData] of Object.entries(subjects)) {
      const normalizedName = normalizeSubjectName(rawName);
      if (!subjectMap[normalizedName]) {
        subjectMap[normalizedName] = {};
      }
      subjectMap[normalizedName][classCode] = termData;
    }
  }

  return subjectMap;
}

// ── Step 3: Seed subjects and topics across all classes ─────────────
async function seedSubjectsAndTopics(subjectMap, levelIds, termIdMap) {
  let totalSubjects = 0;
  let totalTopics = 0;
  let totalSubtopics = 0;

  for (const [subjectName, classTopics] of Object.entries(subjectMap)) {
    const code = makeCode(subjectName);

    // Insert subject once
    const existing = await query("SELECT id FROM subjects WHERE code = $1 LIMIT 1", [code]);
    let subjectId;
    if (existing.rows.length) {
      subjectId = existing.rows[0].id;
    } else {
      const isCore = ['MATHEMATICS', 'ENGLISH STUDIES', 'ENGLISH LANGUAGE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS'].includes(code);
      const subjRes = await query(
        `INSERT INTO subjects (education_system_id, name, code, description, is_core, order_index)
         VALUES ((SELECT id FROM education_systems WHERE code = 'NG-NCC'), $1, $2, $3, $4, $5)
         RETURNING id`,
        [subjectName, code, `Nigerian NERDC curriculum for ${subjectName}`, isCore, totalSubjects]
      );
      subjectId = subjRes.rows[0].id;
      totalSubjects++;
    }

    // For each class that has this subject, insert topics
    for (const [classCode, termData] of Object.entries(classTopics)) {
      const levelId = levelIds[classCode];
      if (!levelId) continue;

      // Get class ID
      const classRes = await query(
        `SELECT c.id FROM classes c
         JOIN programs p ON p.id = c.program_id
         JOIN education_levels el ON el.id = p.education_level_id
         WHERE el.code = $1 AND c.code LIKE $2
         LIMIT 1`,
        [classCode, `${classCode}-%`]
      );
      const classId = classRes.rows[0]?.id;
      if (!classId) continue;

      let topicCount = 0;
      for (const [termKey, topics] of Object.entries(termData)) {
        const termCode = termKey === 'first' ? 'TERM-1' : termKey === 'second' ? 'TERM-2' : 'TERM-3';
        const termId = termIdMap[termCode];
        if (!termId) continue;

        for (let idx = 0; idx < topics.length; idx++) {
          const topic = topics[idx];
          const topicCode = `${code}_${termKey}_${idx.toString().padStart(2, '0')}`;

          const topicRes = await query(
            `INSERT INTO topics (subject_id, class_id, term_id, name, code, learning_objectives, order_index, estimated_hours, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
             ON CONFLICT (subject_id, class_id, term_id, code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
             RETURNING id`,
            [subjectId, classId, termId, topic.name, topicCode, '[]', idx, 1]
          );
          const topicId = topicRes.rows[0].id;
          topicCount++;
          totalTopics++;

          // Insert subtopics
          if (topic.subtopics && topic.subtopics.length > 0) {
            for (let sIdx = 0; sIdx < topic.subtopics.length; sIdx++) {
              const subCode = `${topicCode}_S${sIdx.toString().padStart(2, '0')}`;
              await query(
                `INSERT INTO subtopics (topic_id, name, code, learning_objectives, order_index, estimated_hours, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, TRUE)
                 ON CONFLICT (topic_id, code) DO NOTHING`,
                [topicId, topic.subtopics[sIdx], subCode, '[]', sIdx, 0.5]
              );
              totalSubtopics++;
            }
          }
        }
      }
      console.log(`    ${classCode}/${subjectName}: ${topicCount} topics`);
    }
  }

  console.log(`\nSeeded ${totalSubjects} subjects, ${totalTopics} topics, ${totalSubtopics} subtopics`);
  return { totalSubjects, totalTopics, totalSubtopics };
}

// ── Step 4: Generate AI lessons & questions per topic ───────────────
async function generateAILessons(subjectMap, levelIds, termIdMap) {
  if (!aiClient) {
    console.log('\nNo AI client configured (set BYNARA_API_KEY). Skipping AI lesson generation.');
    return 0;
  }

  const termCodeMap = { first: 'TERM-1', second: 'TERM-2', third: 'TERM-3' };
  let generated = 0;
  const BATCH_SIZE = 3;

  for (const [subjectName, classTopics] of Object.entries(subjectMap)) {
    const code = makeCode(subjectName);
    const subjectRes = await query("SELECT id FROM subjects WHERE code = $1", [code]);
    if (!subjectRes.rows.length) continue;
    const subjectId = subjectRes.rows[0].id;

    for (const [classCode, termData] of Object.entries(classTopics)) {
      const classRes = await query(
        `SELECT c.id FROM classes c JOIN programs p ON p.id = c.program_id
         JOIN education_levels el ON el.id = p.education_level_id
         WHERE el.code = $1 AND c.code LIKE $2 LIMIT 1`,
        [classCode, `${classCode}-%`]
      );
      const classId = classRes.rows[0]?.id;
      if (!classId) continue;

      for (const [termKey, topics] of Object.entries(termData)) {
        const termCode = termCodeMap[termKey];
        const termId = termIdMap[termCode];
        if (!termId) continue;

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
          const prompt = `Create an educational lesson about "${topic.name}" for ${classCode} ${subjectName} students (${termKey} term).
          
Subtopics: ${subtopics || 'General introduction'}

Return valid JSON only (no markdown):
{
  "description": "2-3 sentence overview",
  "learning_objectives": ["objective 1", "objective 2", "objective 3"],
  "key_points": ["point 1", "point 2", "point 3", "point 4"],
  "written_content": "200-400 word explanation with Nigerian context examples",
  "practice_questions": [
    {"question": "...", "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}], "answer": "A", "explanation": "..."}
  ]
}`;

          try {
            const response = await aiClient.chat.completions.create({
              model: AI_MODEL,
              messages: [
                { role: 'system', content: 'You are an expert Nigerian curriculum content creator aligned with NERDC standards. Return only valid JSON.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            });

            const content = response.choices[0]?.message?.content || '';
            let parsed;
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch { parsed = null; }

            if (parsed) {
              // Insert lesson
              await query(
                `INSERT INTO lessons (topic_id, title, slug, description, learning_objectives, content_type, written_content, key_points, order_index, is_free, is_published, estimated_minutes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE, $10)
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
                      q.question || `${topic.name} - practice question`,
                      JSON.stringify(q.options || [
                        { id: 'A', text: 'Option A' },
                        { id: 'B', text: 'Option B' },
                        { id: 'C', text: 'Option C' },
                        { id: 'D', text: 'Option D' },
                      ]),
                      JSON.stringify(q.answer || 'A'),
                      q.explanation || 'Explanation.',
                      ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
                    ]
                  );
                }
              }
            }
          } catch (err) {
            console.error(`  ✗ ${classCode}/${subjectName}/${topic.name}: ${err.message?.slice(0, 60)}`);
          }

          if (generated % BATCH_SIZE === 0) {
            await new Promise(r => setTimeout(r, 600));
          }
        }
      }
    }
  }

  console.log(`\nGenerated ${generated} AI lessons with practice questions`);
  return generated;
}

// ── Main ────────────────────────────────────────────────────────────
const run = async () => {
  console.log('=== Nigerian NERDC Curriculum Seed (v2 — merged subjects) ===\n');

  // Load parsed curriculum
  let curriculum;
  try {
    const data = await fs.readFile('scripts/parsed_curriculum.json', 'utf8');
    curriculum = JSON.parse(data);
    console.log(`Loaded ${Object.keys(curriculum).length} class datasets\n`);
  } catch {
    console.error('Failed to load parsed_curriculum.json. Run parse-curriculum.js first.');
    process.exit(1);
  }

  // Build merged subject map: { SUBJECT_NAME: { CLASS_CODE: {first:[...], second:[...], third:[...]} } }
  const subjectMap = buildSubjectMap(curriculum);
  console.log(`Merged into ${Object.keys(subjectMap).length} unique subjects\n`);

  // Show breakdown
  console.log('Subject distribution across classes:');
  for (const [subj, classes] of Object.entries(subjectMap)) {
    const classList = Object.keys(classes).sort().join(', ');
    const totalTopics = Object.values(classes).reduce((s, td) =>
      s + ['first','second','third'].reduce((t, term) => t + (td[term] || []).length, 0), 0);
    console.log(`  ${subj} → ${classList} (${totalTopics} topics)`);
  }

  // Seed database
  const { levelIds, termIdMap } = await ensureEducationStructure();
  await seedSubjectsAndTopics(subjectMap, levelIds, termIdMap);

  // AI lesson generation is opt-in (pass --ai). With 5,700+ topics it would
  // otherwise make thousands of API calls and take hours.
  const runAI = process.argv.includes('--ai');
  if (runAI) {
    await generateAILessons(subjectMap, levelIds, termIdMap);
  } else {
    console.log('\nSkipping AI lesson generation (pass --ai to enable).');
  }

  await closePool();
  console.log('\n✅ Curriculum seed complete.');
};

run().catch(err => {
  console.error('Seed failed:', err);
  closePool().finally(() => process.exit(1));
});
