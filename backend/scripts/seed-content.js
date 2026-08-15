/**
 * Generate courses and lessons from the seeded curriculum data.
 * Reads parsed_curriculum.json and creates:
 *   - Courses (one per subject per level per term)
 *   - Course sections (grouped by term)
 *   - Lessons (one per topic)
 */
import { query, closePool } from '../src/common/database/index.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text, maxLen = 20) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, maxLen);
}

const TERM_ORDER = { 'first': 1, 'second': 2, 'third': 3 };

// ── Load curriculum ────────────────────────────────────────────────────────

const curriculumPath = join(__dirname, 'parsed_curriculum.json');
if (!existsSync(curriculumPath)) {
  console.error('❌ parsed_curriculum.json not found. Run parse-curriculum.js first.');
  process.exit(1);
}

const curriculum = JSON.parse(readFileSync(curriculumPath, 'utf8'));
console.log(`📖 Loaded curriculum with ${Object.keys(curriculum).length} class datasets\n`);

// ── Fetch IDs ───────────────────────────────────────────────────────────────

async function fetchIds() {
  console.log('🔍 Fetching database IDs...\n');

  const [systemRes, levelsRes, termsRes] = await Promise.all([
    query('SELECT id FROM education_systems WHERE code = $1 LIMIT 1', ['NG-NCC']),
    query('SELECT id, code FROM education_levels WHERE is_active = TRUE ORDER BY order_index'),
    query('SELECT id, code FROM terms ORDER BY order_index'),
  ]);

  if (!systemRes.rows[0]) {
    console.error('❌ Education system "NG-NCC" not found.');
    process.exit(1);
  }
  const systemId = systemRes.rows[0].id;
  console.log(`   System: ${systemRes.rows[0].name} (${systemId})`);

  const levelMap = {};
  for (const l of levelsRes.rows) {
    levelMap[l.code] = l.id;
  }
  console.log(`   ${levelsRes.rows.length} levels loaded`);

  const termMap = {};
  for (const t of termsRes.rows) {
    termMap[t.code] = t.id;
  }
  console.log(`   ${termsRes.rows.length} terms loaded\n`);

  return { systemId, levelMap, termMap };
}

// ── Seed courses & lessons ──────────────────────────────────────────────────

async function seedContent({ systemId, levelMap, termMap }) {
  let coursesCreated = 0;
  let sectionsCreated = 0;
  let lessonsCreated = 0;
  let skipped = 0;

  const subjectCache = {}; // subjectId by { subjectName, classCode }

  for (const [classCode, classData] of Object.entries(curriculum)) {
    const levelId = levelMap[classCode];
    if (!levelId) {
      console.warn(`⚠️  Level "${classCode}" not found in DB — skipping`);
      skipped++;
      continue;
    }

    // Get class_id for this level
    const classRes = await query(
      `SELECT c.id FROM classes c
       JOIN programs p ON p.id = c.program_id
       JOIN education_levels el ON el.id = p.education_level_id
       WHERE el.code = $1 LIMIT 1`,
      [classCode]
    );

    if (!classRes.rows[0]) {
      console.warn(`⚠️  Class not found for level "${classCode}" — skipping`);
      skipped++;
      continue;
    }
    const classId = classRes.rows[0].id;
    console.log(`\n📘 ${classCode}:`);

    for (const [subjectName, termsData] of Object.entries(classData)) {
      // Get or create subject
      let subjectId = subjectCache[`${subjectName}|${classCode}`];
      if (!subjectId) {
        const subjectRes = await query(
          `SELECT id FROM subjects WHERE education_system_id = $1 AND code = $2 LIMIT 1`,
          [systemId, slugify(subjectName)]
        );
        if (subjectRes.rows[0]) {
          subjectId = subjectRes.rows[0].id;
        } else {
          // Create subject
          const newSubject = await query(
            `INSERT INTO subjects (education_system_id, name, code, order_index, is_core)
             VALUES ($1, $2, $3, 0, FALSE)
             RETURNING id`,
            [systemId, subjectName, slugify(subjectName)]
          );
          subjectId = newSubject.rows[0].id;
          console.log(`   + Subject: ${subjectName}`);
        }
        subjectCache[`${subjectName}|${classCode}`] = subjectId;
      }

      // Group topics by term
      const topicsByTerm = { first: [], second: [], third: [] };
      let totalTopics = 0;
      for (const [termKey, topics] of Object.entries(termsData)) {
        if (topicsByTerm[termKey]) {
          topicsByTerm[termKey] = topics;
          totalTopics += topics.length;
        }
      }

      // Create one course per term that has topics
      for (const [termKey, topics] of Object.entries(topicsByTerm)) {
        if (topics.length === 0) continue;

        const termCode = `TERM-${TERM_ORDER[termKey]}`;
        const termId = termMap[termCode];
        if (!termId) {
          console.warn(`   ⚠️  Term ${termCode} not found for ${subjectName}`);
          continue;
        }

        // Create course
        const courseTitle = `${subjectName} — ${classCode} ${termKey.charAt(0).toUpperCase() + termKey.slice(1)} Term`;
        const courseSlug = slugify(courseTitle, 100);

        const courseRes = await query(
          `SELECT id FROM courses WHERE slug = $1 LIMIT 1`,
          [courseSlug]
        );

        let courseId;
        if (courseRes.rows[0]) {
          courseId = courseRes.rows[0].id;
        } else {
          const course = await query(
            `INSERT INTO courses (
              subject_id, class_id, term_id, title, slug,
              short_description, full_description,
              difficulty, status, price, currency, is_free, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id`,
            [
              subjectId, classId, termId, courseTitle, courseSlug,
              `${subjectName} for ${classCode} ${termKey} term`,
              `Complete ${subjectName} course covering ${topics.length} topics for ${classCode} ${termKey} term.`,
              'beginner', 'published', 0, 'NGN', true, false,
            ]
          );
          courseId = course.rows[0].id;
          coursesCreated++;
        }

        // Create course sections (one per topic)
        let sectionOrder = 1;
        for (const topic of topics) {
          // Create section
          const sectionTitle = topic.name.length > 60 ? topic.name.substring(0, 60) : topic.name;
          const sectionRes = await query(
            `SELECT id FROM course_sections WHERE course_id = $1 AND title = $2 LIMIT 1`,
            [courseId, sectionTitle]
          );

          let sectionId;
          if (sectionRes.rows[0]) {
            sectionId = sectionRes.rows[0].id;
          } else {
            const section = await query(
              `INSERT INTO course_sections (course_id, title, description, order_index)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [courseId, sectionTitle, `Section for ${topic.name}`, sectionOrder]
            );
            sectionId = section.rows[0].id;
            sectionsCreated++;
            sectionOrder++;
          }

          // Create lesson
          const lessonTitle = topic.name.length > 80 ? topic.name.substring(0, 80) : topic.name;
          const lessonSlug = `${slugify(topic.code || slugify(topic.name))}-${sectionOrder - 1}`;

          const lessonRes = await query(
            `SELECT id FROM lessons WHERE course_id = $1 AND slug = $2 LIMIT 1`,
            [courseId, lessonSlug]
          );

          if (!lessonRes.rows[0]) {
            await query(
              `INSERT INTO lessons (
                course_id, section_id, topic_id, title, slug, description,
                learning_objectives, content_type, written_content, key_points,
                order_index, is_free, is_published, estimated_minutes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
              [
                courseId, sectionId, topic.id, lessonTitle, lessonSlug,
                topic.description || `Learn about ${topic.name}`,
                [], 'text',
                `## ${topic.name}\n\n${topic.description || `Study topic: ${topic.name}`}`,
                [],
                topic.orderIndex || 0, true, true,
                Math.max(10, Math.floor((topic.estimatedHours || 1) * 60)),
              ]
            );
            lessonsCreated++;
          }
        }

        // Update course lesson_count
        await query(
          `UPDATE courses SET lesson_count = ($2) WHERE id = $1`,
          [courseId, topics.length]
        );
      }
    }
  }

  return { coursesCreated, sectionsCreated, lessonsCreated, skipped };
}

// ── Main ───────────────────────────────────────────────────────────────────

const run = async () => {
  console.log('=== Curriculum Content Generator ===\n');

  const ids = await fetchIds();
  const stats = await seedContent(ids);

  console.log(`\n✅ Content generation complete:`);
  console.log(`   Courses created:   ${stats.coursesCreated}`);
  console.log(`   Sections created:  ${stats.sectionsCreated}`);
  console.log(`   Lessons created:   ${stats.lessonsCreated}`);
  if (stats.skipped > 0) {
    console.log(`   Skipped levels:    ${stats.skipped}`);
  }
  console.log(`\nRun with --ai flag to generate AI lessons:`);
  console.log(`   node scripts/seed-content.js --ai`);

  await closePool();
};

run().catch(err => {
  console.error('❌ Content generation failed:', err);
  closePool().finally(() => process.exit(1));
});
