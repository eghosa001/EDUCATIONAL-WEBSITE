import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

const parentController = read('./parents/controllers/parent.controller.js');
const parentRoutes = read('./routes/parent.routes.js');
const certificateController = read('./certificates/controllers/certificate.controller.js');
const aiRoutes = read('./routes/ai.routes.js');

test('parent report download route has a concrete controller handler', () => {
  assert.match(parentRoutes, /reports\/:reportId\/download/);
  assert.match(parentRoutes, /parentController\.downloadReport/);
  assert.match(parentController, /export const downloadReport/);
  assert.match(parentController, /parentService\.getReport\(req\.user\.id, req\.params\.reportId\)/);
  assert.match(parentController, /Content-Disposition/);
});

test('certificate download streams a real PDF instead of metadata', () => {
  assert.match(certificateController, /certificateService\.generatePDF/);
  assert.match(certificateController, /Content-Type', 'application\/pdf/);
  assert.match(certificateController, /Buffer\.from\(pdf\)/);
  assert.doesNotMatch(certificateController, /actual PDF would be streamed/);
});

test('AI tutor route validates the payload consumed by aiService.chat', () => {
  assert.match(aiRoutes, /message:\s*Joi\.string\(\).*required\(\)/s);
  assert.match(aiRoutes, /subjectId:\s*Joi\.string\(\)\.uuid\(\)\.optional\(\)/);
  assert.match(aiRoutes, /topicId:\s*Joi\.string\(\)\.uuid\(\)\.optional\(\)/);
  assert.match(aiRoutes, /sessionId:\s*Joi\.string\(\)\.uuid\(\)\.optional\(\)/);
  assert.match(aiRoutes, /validateRequest\(tutorSchema\)/);
});
