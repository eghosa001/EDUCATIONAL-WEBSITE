import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const authContext = fs.readFileSync(path.join(root, 'src', 'contexts', 'AuthContext.tsx'), 'utf8');
const authHook = fs.readFileSync(path.join(root, 'src', 'features', 'auth', 'hooks', 'useAuth.ts'), 'utf8');
const loginForm = fs.readFileSync(path.join(root, 'src', 'features', 'auth', 'components', 'LoginForm.tsx'), 'utf8');

test('email-verification registration is treated as successful pending verification', () => {
  assert.match(authContext, /requiresEmailVerification: true/);
  assert.doesNotMatch(authContext, /Registration succeeded, but email verification is required before signing in/);
  assert.match(authHook, /result\.requiresEmailVerification/);
  assert.match(authHook, /\/login\?registered=1&email=/);
});

test('login page displays verification success and contains no dead social or remember controls', () => {
  assert.match(loginForm, /Registration successful\. Check/);
  assert.match(loginForm, /defaultValue=\{pendingEmail \|\| ''\}/);
  assert.doesNotMatch(loginForm, /Remember me/);
  assert.doesNotMatch(loginForm, /Sign in with Google/);
});
