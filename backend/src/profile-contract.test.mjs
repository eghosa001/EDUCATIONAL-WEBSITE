import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routes = fs.readFileSync(new URL('./routes/user.routes.js', import.meta.url), 'utf8');

test('self-profile routes exist before dynamic user id routes', () => {
  const getSelf = routes.indexOf("userRoutes.get('/profile'");
  const patchSelf = routes.indexOf("userRoutes.patch('/profile'");
  const dynamic = routes.indexOf("userRoutes.get('/:id'");
  assert.ok(getSelf >= 0 && patchSelf >= 0 && dynamic >= 0);
  assert.ok(getSelf < dynamic);
  assert.ok(patchSelf < dynamic);
  assert.match(routes.slice(getSelf, dynamic), /req\.params\.id = req\.user\.id/);
});
