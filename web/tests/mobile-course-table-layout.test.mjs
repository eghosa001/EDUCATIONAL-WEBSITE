import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('lesson tables scroll independently on mobile without stretching the reading grid', () => {
  const lesson = read('src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  const css = read('src/app/globals.css');
  assert.match(lesson, /lg:grid-cols-\[minmax\(0,1fr\)_300px\]/);
  assert.match(lesson, /<main className="min-w-0">/);
  assert.match(lesson, /mobile-table-scroll/g);
  assert.match(css, /-webkit-overflow-scrolling: touch/);
  assert.match(css, /Swipe sideways to view all columns/);
});

test('dashboard and course layouts allow shrinking to narrow phone viewports', () => {
  const layout = read('src/app/dashboard/layout.tsx');
  const course = read('src/app/dashboard/courses/[courseId]/page.tsx');
  assert.match(layout, /dashboard-content .*min-w-0/);
  assert.match(course, /min-w-0 flex-1 break-words/);
});

test('results and report tables remain horizontally navigable', () => {
  for (const path of [
    'src/app/dashboard/progress/page.tsx',
    'src/app/dashboard/reports/page.tsx',
    'src/app/dashboard/past-questions/analytics/page.tsx',
    'src/app/dashboard/teacher/report/page.tsx',
    'src/app/dashboard/parent/[childId]/page.tsx',
    'src/app/dashboard/subscriptions/billing/page.tsx',
  ]) {
    const page = read(path);
    assert.match(page, /mobile-table-scroll overflow-x-auto/);
    assert.match(page, /tabIndex=\{0\}/);
  }
});
