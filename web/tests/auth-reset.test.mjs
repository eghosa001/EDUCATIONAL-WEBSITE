import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('reset-password component performs a real credential update before showing success', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'features', 'auth', 'components', 'ResetPasswordForm.tsx'), 'utf8');
  assert.match(source, /resetSupabasePassword\(\{ password: data\.password \}\)/);
  assert.match(source, /fetch\(`\$\{apiBase\}\/auth\/reset-password`/);
  assert.match(source, /if \(!response\.ok\)/);
  assert.doesNotMatch(source, /In production, call the API with the token/);
  assert.ok(source.indexOf('setSuccess(true)') > source.indexOf('await resetSupabasePassword'), 'success must be set only after a reset attempt');
});

test('active reset-password page supports backend one-time tokens and Supabase recovery sessions', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'app', '(auth)', 'reset-password', 'page.tsx'), 'utf8');
  assert.match(source, /searchParams\.get\('token'\)/);
  assert.match(source, /\/auth\/reset-password/);
  assert.match(source, /await resetPassword\(\{ password \}\)/);
  assert.match(source, /strongPassword/);
  assert.match(source, /minLength=\{8\}/);
  assert.ok(source.indexOf('if (!response.ok)') < source.indexOf('setSuccess(true)'));
});
