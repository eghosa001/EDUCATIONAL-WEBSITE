import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');

test('advanced JAMB setup loads from dedicated and legacy exam entry paths', () => {
  assert.match(page, /experience === 'jamb-cbt'/);
  assert.match(page, /experience === 'legacy' && mode === 'exam' && selectedExam === 'jamb'/);
  assert.match(page, /fetchJambCoursePresets\(token\)/);
  assert.match(page, /setJambSubjectAvailability/);
  assert.match(page, /\[token, experience, mode, selectedExam\]/);
});
