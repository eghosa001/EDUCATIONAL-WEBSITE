import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync(new URL('../src/app/lesson-visuals/[lessonId]/route.ts', import.meta.url), 'utf8');

test('lesson visual route selects trustworthy content-aware templates', () => {
  assert.match(route, /markdownTableSummary/);
  assert.match(route, /REFERENCE TABLE/);
  assert.match(route, /lessonEquation/);
  assert.match(route, /FORMULA \/ RELATIONSHIP/);
  assert.match(route, /SEQUENCE \/ PROCESS/);
  assert.match(route, /CONCEPT MAP/);
});

test('lesson visual route keeps source-only and XML safety guarantees', () => {
  assert.match(route, /Content-aware visual summary drawn only from this lesson/);
  assert.match(route, /escapeXml/);
  assert.match(route, /image\/svg\+xml/);
  assert.match(route, /X-Content-Type-Options/);
});
