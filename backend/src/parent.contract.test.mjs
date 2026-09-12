import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync(new URL('./parents/controllers/parent.controller.js', import.meta.url), 'utf8');
const routes = fs.readFileSync(new URL('./routes/parent.routes.js', import.meta.url), 'utf8');

test('parent report download route has a concrete controller handler', () => {
  assert.match(routes, /reports\/:reportId\/download/);
  assert.match(routes, /parentController\.downloadReport/);
  assert.match(controller, /export const downloadReport/);
  assert.match(controller, /parentService\.getReport\(req\.user\.id, req\.params\.reportId\)/);
  assert.match(controller, /Content-Disposition/);
});
