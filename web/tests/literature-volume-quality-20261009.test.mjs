import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const names = [
  '../supabase/migrations/20261009231000_complete_literature_ss1_ss2_skills.sql',
  '../supabase/migrations/20261009232000_complete_literature_ss2_ss3_skills.sql',
];
const batches = names.map((path) => {
  const sql = fs.readFileSync(path, 'utf8');
  const match = sql.match(/jsonb_to_recordset\('([\s\S]*?)'::jsonb\)/);
  assert.ok(match, `Missing authored source data: ${path}`);
  return JSON.parse(match[1].replaceAll("''", "'"));
});
const units = batches.flat();

describe('Literature expansion — scoped quality checks', () => {
  it('has 40 unique units across eight terms without duplicate titles', () => {
    assert.deepEqual(batches.map((b) => b.length), [20, 20]);
    const keys = units.map((u) => [u.level, u.term, u.name.toLowerCase().trim()].join('/'));
    assert.equal(new Set(keys).size, 40);
    assert.equal(new Set(units.map((u) => u.slug)).size, 40);
  });

  it('contains substantive distinct instruction and working practice', () => {
    for (const u of units) {
      assert.ok(u.body.length >= 3800, u.name);
      assert.equal(u.points.length, 5, u.name);
      assert.equal(u.cards.length, 6, u.name);
      assert.equal(u.questions.length, 10, u.name);
    }
  });

  it('keeps every new question scoreable and unique within its topic', () => {
    for (const u of units) {
      const stems = new Set();
      for (const q of u.questions) {
        const normalized = q.question.toLowerCase().replace(/[^a-z0-9]+/g, '');
        assert.ok(!stems.has(normalized), `Repeated question: ${u.name}`);
        stems.add(normalized);
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options.map((o) => o.text)).size, 4);
        assert.ok(q.options.some((o) => o.id === q.answer));
        assert.ok(q.explanation.length >= 85);
      }
    }
  });

  it('protects learner records in the reversible deduplication SQL', () => {
    const sql = fs.readFileSync('../supabase/migrations/20261009234500_archive_same_topic_repeated_lessons.sql', 'utf8');
    for (const name of ['lesson_progress','bookmarks','study_sessions','assignments','lesson_practice_attempts']) {
      assert.ok(sql.includes(name), `Missing protected reference: ${name}`);
    }
    assert.doesNotMatch(sql, /DELETE\s+FROM\s+public\.lessons/i);
  });
});
