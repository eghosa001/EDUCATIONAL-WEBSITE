import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exams = fs.readFileSync(new URL('../src/app/dashboard/exams/page.tsx', import.meta.url), 'utf8');
const jamb = fs.readFileSync(new URL('../src/app/dashboard/jamb/page.tsx', import.meta.url), 'utf8');
const past = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/app/dashboard/layout.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const auth = fs.readFileSync(new URL('../src/contexts/AuthContext.tsx', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003210000_fast_exam_board_availability.sql', import.meta.url), 'utf8');

test('school exams and JAMB are structurally separated', () => {
  assert.match(exams, /WAEC/);
  assert.match(exams, /NECO/);
  assert.match(exams, /NABTEB/);
  assert.match(exams, /Go to JAMB/);
  assert.match(jamb, /JAMB Past Questions/);
  assert.match(jamb, /JAMB CBT Examination/);
  assert.match(layout, /label: 'JAMB'/);
  assert.doesNotMatch(layout, /label: 'Past Questions'/);
});

test('JAMB past questions are untimed while JAMB CBT remains four-subject timed', () => {
  assert.match(past, /experience === 'jamb-past'/);
  assert.match(past, /experience === 'jamb-cbt'/);
  assert.match(past, /const isUntimedPastQuestions/);
  assert.match(past, /selectedSubjects\.length === 4/);
  assert.match(past, /singleSubjectExternal/);
  assert.match(past, /Untimed study/);
});

test('exam-board availability is one cached aggregate instead of a row scan', () => {
  assert.match(api, /admin\.rpc\('get_past_question_availability'\)/);
  assert.doesNotMatch(api, /for\(let from=0;from<50000;from\+=1000\)/);
  assert.match(api, /Cache-Control/);
  assert.match(migration, /get_past_question_availability/);
  assert.match(migration, /group by board/i);
});

test('dashboard authentication and shell no longer create avoidable blocking work', () => {
  assert.match(auth, /Promise\.all/);
  assert.match(auth, /event === 'INITIAL_SESSION'/);
  assert.match(dashboard, /loading \? '—'/);
  assert.doesNotMatch(dashboard, /Loading\.\.\./);
  assert.match(dashboard, /href: '\/dashboard\/jamb'/);
});
