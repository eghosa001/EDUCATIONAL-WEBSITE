import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeUserRoute } from './common/middleware/userAuthorization.js';

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
