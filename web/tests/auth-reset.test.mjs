import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('reset-password form performs a real credential update before showing success', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'features', 'auth', 'components', 'ResetPasswordForm.tsx'), 'utf8');
  assert.match(source, /resetSupabasePassword\(\{ password: data\.password \}\)/);
  assert.match(source, /fetch\(`\$\{apiBase\}\/auth\/reset-password`/);
  assert.match(source, /if \(!response\.ok\)/);
  assert.doesNotMatch(source, /In production, call the API with the token/);
  assert.ok(source.indexOf('setSuccess(true)') > source.indexOf('await resetSupabasePassword'), 'success must be set only after a reset attempt');
});
