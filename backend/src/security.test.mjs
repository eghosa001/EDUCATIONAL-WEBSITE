import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { authorizeUserRoute } from './common/middleware/userAuthorization.js';
import { requireRole, requirePermission } from './common/middleware/index.js';

const run = (request) => {
  let nextCalled = false;
  authorizeUserRoute(request, {}, () => { nextCalled = true; });
  return nextCalled;
};

const denied = (request) => assert.throws(() => authorizeUserRoute(request, {}, () => {}), /Not authorized|Administrator access required|Super administrator access required/);

test('user collection is administrator-only', () => {
  denied({ path: '/', params: {}, user: { id: 'u1', role: 'student' } });
  assert.equal(run({ path: '/', params: {}, user: { id: 'a1', role: 'content_admin' } }), true);
});

test('users can access only their own account', () => {
  assert.equal(run({ path: '/u1', params: {}, user: { id: 'u1', role: 'student' } }), true);
  denied({ path: '/u2', params: {}, user: { id: 'u1', role: 'student' } });
});

test('admins may inspect another user', () => {
  assert.equal(run({ path: '/u2', params: {}, user: { id: 'a1', role: 'content_admin' } }), true);
});

test('only super admins can change roles', () => {
  denied({ path: '/u1/roles', params: {}, user: { id: 'u1', role: 'student' } });
  denied({ path: '/u1/roles', params: {}, user: { id: 'a1', role: 'content_admin' } });
  assert.equal(run({ path: '/u1/roles', params: {}, user: { id: 'a1', role: 'super_admin' } }), true);
});

test('requireRole honors the normalized many-to-many role list', () => {
  let nextCalled = false;
  requireRole('super_admin')({ user: { role: 'student', roles: ['student', 'super_admin'] } }, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('super-admin wildcard permission is honored', () => {
  let nextCalled = false;
  requirePermission('manage_anything')({ user: { permissions: ['*'] } }, {}, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('backend authentication supports verified Supabase sessions without unverified JWT decoding', () => {
  const source = fs.readFileSync(new URL('./common/middleware/index.js', import.meta.url), 'utf8');
  assert.match(source, /client\.auth\.getUser\(token\)/);
  assert.match(source, /verifyToken\(token\)/);
  assert.doesNotMatch(source, /jwt\.decode\(token\)/);
  assert.doesNotMatch(source, /decodeToken\(token\)/);
});

test('user service projects user_roles into the route-guard role field', () => {
  const source = fs.readFileSync(new URL('./users/services/user.service.js', import.meta.url), 'utf8');
  assert.match(source, /role:\s*primaryRole/);
  assert.match(source, /roles,\s*role:\s*primaryRole,\s*primaryRole,\s*permissions/);
  assert.match(source, /ROLE_PRIORITY/);
});
