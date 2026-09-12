/**
 * Generate draft courses and placeholder lesson records from parsed curriculum data.
 *
 * IMPORTANT: curriculum structure is not lesson content. This script intentionally
 * creates DRAFT courses/lessons only. A separate reviewed content pipeline must
 * supply substantive teaching content before publication.
 */
import { query, closePool } from '../src/common/database/index.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function slugify(text, maxLen = 100) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxLen);
}

const TERM_ORDER = { first: 1, second: 2, third: 3 };
const curriculumPath = join(__dirname, 'parsed_curriculum.json');

if (!existsSync(curriculumPath)) {
  console.error('❌ parsed_curriculum.json not found. Run parse-curriculum.js first.');
  process.exit(1);
}

const curriculum = JSON.parse(readFileSync(curriculumPath, 'utf8'));
console.log(`📖 Loaded curriculum with ${Object.keys(curriculum).length} class datasets\n`);

async function fetchIds() {
  const [systemRes, levelsRes, termsRes] = await Promise.all([
    query('SELECT id FROM education_systems WHERE code = $1 LIMIT 1', ['NG-NCC']),
    query('SELECT id, code FROM education_levels WHERE is_active = TRUE ORDER BY order_index'),
    query('SELECT id, code FROM terms WHERE is_active = TRUE ORDER BY order_index'),
  ]);

  if (!systemRes.rows[0]) throw new Error('Education system NG-NCC not found');
  return {
    systemId: systemRes.rows[0].id,
    levelMap: Object.fromEntries(levelsRes.rows.map(row => [row.code, row.id])),
    termMap: Object.fromEntries(termsRes.rows.map(row => [row.code, row.id])),
  };
}

async function getClassId(classCode) {
  const result = await query(
    `SELECT c.id
       FROM classes c
       JOIN programs p ON p.id = c.program_id
       JOIN education_levels el ON el.id = p.education_level_id
      WHERE el.code = $1 AND c.is_active = TRUE
      ORDER BY c.order_index
      LIMIT 1`,
    [classCode],
  );
  return result.rows[0]?.id || null;
}

async function getOrCreateSubject(systemId, subjectName) {
  const code = slugify(subjectName, 20);
  const existing = await query(
    'SELECT id FROM subjects WHERE education_system_id = $1 AND code = $2 LIMIT 1',
    [systemId, code],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query(
    `INSERT INTO subjects (education_system_id, name, code, order_index, is_core)
     VALUES ($1, $2, $3, 0, FALSE)
     RETURNING id`,
    [systemId, subjectName, code],
  );
  return created.rows[0].id;
}

async function seedContent({ systemId, levelMap, termMap }) {
  let coursesCreated = 0;
  let sectionsCreated = 0;
  let lessonsCreated = 0;
  let skipped = 0;

  for (const [classCode, classData] of Object.entries(curriculum)) {
    if (!levelMap[classCode]) {
      console.warn(`⚠️ Level ${classCode} not found — skipping`);
      skipped++;
      continue;
    }

    const classId = await getClassId(classCode);
    if (!classId) {
      console.warn(`⚠️ Class for ${classCode} not found — skipping`);
      skipped++;
      continue;
    }

    for (const [subjectName, termsData] of Object.entries(classData)) {
      const subjectId = await getOrCreateSubject(systemId, subjectName);

      for (const [termKey, topics] of Object.entries(termsData)) {
        if (!Array.isArray(topics) || !topics.length || !TERM_ORDER[termKey]) continue;
        const termId = termMap[`TERM-${TERM_ORDER[termKey]}`];
        if (!termId) continue;

        const courseTitle = `${subjectName} — ${classCode} ${termKey.charAt(0).toUpperCase()}${termKey.slice(1)} Term`;
        const courseSlug = slugify(courseTitle);
        const existingCourse = await query('SELECT id FROM courses WHERE slug = $1 LIMIT 1', [courseSlug]);
        let courseId = existingCourse.rows[0]?.id;

        if (!courseId) {
          const createdCourse = await query(
            `INSERT INTO courses (
               subject_id, class_id, term_id, title, slug,
               short_description, full_description, difficulty,
               status, price, currency, is_free, is_featured
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,'beginner','draft',0,'NGN',TRUE,FALSE)
             RETURNING id`,
            [
              subjectId,
              classId,
              termId,
              courseTitle,
              courseSlug,
              `${subjectName} for ${classCode} ${termKey} term`,
              `Curriculum structure for ${subjectName}, ${classCode}, ${termKey} term. Teaching content requires review before publication.`,
            ],
          );
          courseId = createdCourse.rows[0].id;
          coursesCreated++;
        }

        for (let index = 0; index < topics.length; index++) {
          const topic = topics[index];
          const sectionTitle = String(topic.name || `Topic ${index + 1}`).slice(0, 120);
          let sectionId;
          const existingSection = await query(
            'SELECT id FROM course_sections WHERE course_id = $1 AND title = $2 LIMIT 1',
            [courseId, sectionTitle],
          );

          if (existingSection.rows[0]) {
            sectionId = existingSection.rows[0].id;
          } else {
            const createdSection = await query(
              `INSERT INTO course_sections (course_id, title, description, order_index)
               VALUES ($1,$2,$3,$4)
               RETURNING id`,
              [courseId, sectionTitle, `Curriculum topic: ${sectionTitle}`, index + 1],
            );
            sectionId = createdSection.rows[0].id;
            sectionsCreated++;
          }

          const lessonSlug = `${slugify(topic.code || topic.name || `topic-${index + 1}`, 80)}-${index + 1}`;
          const existingLesson = await query(
            'SELECT id FROM lessons WHERE course_id = $1 AND slug = $2 LIMIT 1',
            [courseId, lessonSlug],
          );
          if (existingLesson.rows[0]) continue;

          await query(
            `INSERT INTO lessons (
               course_id, section_id, topic_id, title, slug, description,
               learning_objectives, content_type, written_content, key_points,
               order_index, is_free, is_published, estimated_minutes, content_quality
             ) VALUES ($1,$2,$3,$4,$5,$6,'[]'::jsonb,'text',$7,'[]'::jsonb,$8,TRUE,FALSE,$9,'needs_review')`,
            [
              courseId,
              sectionId,
              topic.id || null,
              sectionTitle.slice(0, 160),
              lessonSlug,
              topic.description || `Curriculum topic: ${sectionTitle}`,
              `Curriculum placeholder for ${sectionTitle}. Substantive lesson content has not yet been reviewed and this record must remain unpublished.`,
              index,
              Math.max(10, Math.floor(Number(topic.estimatedHours || 1) * 60)),
            ],
          );
          lessonsCreated++;
        }

        await query('UPDATE courses SET lesson_count = $2 WHERE id = $1', [courseId, topics.length]);
      }
    }
  }

  return { coursesCreated, sectionsCreated, lessonsCreated, skipped };
}

const run = async () => {
  console.log('=== Curriculum Draft Content Generator ===\n');
  const stats = await seedContent(await fetchIds());
  console.log(`Courses created: ${stats.coursesCreated}`);
  console.log(`Sections created: ${stats.sectionsCreated}`);
  console.log(`Draft lessons created: ${stats.lessonsCreated}`);
  console.log(`Skipped levels: ${stats.skipped}`);
  console.log('No generated placeholder lesson was published.');
  await closePool();
};

run().catch(error => {
  console.error('❌ Content generation failed:', error);
  closePool().finally(() => process.exit(1));
});
