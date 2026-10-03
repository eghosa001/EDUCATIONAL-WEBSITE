import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003241500_strict_jamb_archive_only.sql', import.meta.url), 'utf8');

test('JAMB CBT sessions use archived storage-backed questions only', () => {
  assert.match(api, /\.like\('source','storage:%'\)/);
  assert.doesNotMatch(api, /source\.like\.storage:%,source\.like\.JAMB %/);
  assert.match(migration, /pq\.source like 'storage:%'/);
});

test('JAMB past-question listing and sessions also enforce storage provenance', () => {
  assert.match(api, /toLowerCase\(\)==='jamb'\)query=query\.like\('source','storage:%'\)/);
  assert.match(api, /if\(board==='jamb'\)q=q\.like\('source','storage:%'\)/);
  assert.match(api, /startsWith\('storage:'\)/);
});

test('generic past-question availability excludes non-storage JAMB rows', () => {
  assert.match(migration, /lower\(board\) <> 'jamb' or source like 'storage:%'/);
});
