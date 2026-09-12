import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('parent dashboard uses the real API v1 parent routes', () => {
  const store = fs.readFileSync(path.join(root, 'src', 'features', 'parent', 'store', 'parentStore.ts'), 'utf8');
  const hook = fs.readFileSync(path.join(root, 'src', 'features', 'parent', 'hooks', 'useParentDashboard.ts'), 'utf8');

  assert.match(store, /\$\{apiConfig\.baseUrl\}\/parents\/children/);
  assert.match(store, /\/performance/);
  assert.match(store, /\/progress/);
  assert.match(hook, /\/study-time/);
  assert.match(hook, /fetchChildren\(\)/);

  assert.doesNotMatch(store, /\/api\/parents\/monitor/);
  assert.doesNotMatch(hook, /\/activity/);
});
