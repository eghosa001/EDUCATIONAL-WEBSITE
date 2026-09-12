import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

for (const relative of [
  ['src', 'contexts', 'AuthContext.tsx'],
  ['src', 'services', 'api', 'authService.ts'],
]) {
  test(`${relative.join('/')} uses deterministic multi-role priority`, () => {
    const source = fs.readFileSync(path.join(root, ...relative), 'utf8');
    assert.match(source, /super_admin/);
    assert.match(source, /content_admin/);
    assert.match(source, /teacher/);
    assert.match(source, /parent/);
    assert.match(source, /student/);
    assert.match(source, /ROLE_PRIORITY/);
    assert.doesNotMatch(source, /const role = \(roles\[0\]/);
  });
}
