import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const webRoot = path.join(repoRoot, 'web');
const migrationPath = path.join(repoRoot, 'supabase/migrations/20261008191500_course_lesson_hotpath_indexes.sql');
const read = (relativePath) => fs.readFileSync(path.join(webRoot, relativePath), 'utf8');
const readMigration = () => fs.readFileSync(migrationPath, 'utf8');

describe('course and lesson performance hardening', () => {
  it('keeps the course detail route on metadata-only lesson queries', () => {
    const coursePage = read('src/app/dashboard/courses/[courseId]/page.tsx');
    assert.match(coursePage, /LESSON_CARD_COLUMNS/);
    assert.doesNotMatch(coursePage, /written_content/);
    assert.match(coursePage, /sessionStorage/);
  });

  it('commits the core lesson before optional resources, practice, flashcards or AI work', () => {
    const lessonPage = read('src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
    assert.match(lessonPage, /LESSON_ROUTE_COLUMNS/);
    assert.match(lessonPage, /setLoading\(false\)/);
    assert.match(lessonPage, /loadLessonExtras/);
    assert.match(lessonPage, /window\.setTimeout/);
  });

  it('does not run automatic AI teacher generation during initial lesson display', () => {
    const lessonPage = read('src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
    assert.doesNotMatch(lessonPage, /Teach this lesson as an accurate Nigerian curriculum-aligned teacher/);
    assert.match(lessonPage, /prepareTeacherExplanation/);
  });

  it('has real course-route error recovery instead of a placeholder error boundary', () => {
    const courseError = read('src/app/dashboard/courses/error.tsx');
    assert.doesNotMatch(courseError, /<div>Error<\/div>/);
    assert.match(courseError, /reset\(\)/);
    assert.match(courseError, /Back to courses/);
  });

  it('adds database indexes for the exact course and lesson hot paths', () => {
    const sql = readMigration();
    assert.match(sql, /courses_status_slug_hotpath_idx/);
    assert.match(sql, /lessons_course_published_order_hotpath_idx/);
    assert.match(sql, /lessons_course_slug_hotpath_idx/);
    assert.match(sql, /lesson_resources_lesson_created_hotpath_idx/);
    assert.match(sql, /questions_topic_class_subject_active_hotpath_idx/);
  });
});
