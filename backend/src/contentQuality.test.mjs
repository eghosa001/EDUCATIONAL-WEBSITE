import test from 'node:test';
import assert from 'node:assert/strict';
import { assessLessonContent } from './lessons/content-quality.js';

test('rejects generic placeholder lesson content', () => {
  const result = assessLessonContent({
    title: 'Nutrition',
    written_content: 'This lesson covers Nutrition, a fundamental concept in the Nigerian SSS1 curriculum. '.repeat(20),
    learning_objectives: ['Understand Nutrition', 'Explain Nutrition'],
    key_points: ['Core concept', 'Application'],
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.some(issue => /generic\/template/i.test(issue)));
});

test('rejects lessons that are too short or structurally incomplete', () => {
  const result = assessLessonContent({ title: 'Photosynthesis', written_content: 'Plants make food.' });
  assert.equal(result.valid, false);
  assert.ok(result.issues.length >= 3);
});

test('accepts substantial topic-specific lesson content', () => {
  const paragraphs = [
    'Photosynthesis is the process by which green plants convert light energy into chemical energy stored in glucose. Chlorophyll in chloroplasts absorbs light, while carbon dioxide enters leaves through stomata and water is transported from roots through xylem.',
    'The overall reaction can be represented as six molecules of carbon dioxide plus six molecules of water producing one molecule of glucose and six molecules of oxygen in the presence of light and chlorophyll. The light-dependent reactions generate ATP and NADPH, while the Calvin cycle uses them to fix carbon dioxide.',
    'A useful investigation compares a destarched plant leaf exposed to light with a covered section. After boiling the leaf in water, removing chlorophyll with ethanol, and adding iodine solution, only the region that received light turns blue-black because starch accumulated there.',
    'Factors that affect the rate include light intensity, carbon dioxide concentration, temperature, water availability, and chlorophyll content. A limiting factor is the factor in shortest supply relative to demand, so increasing another factor may have no effect until the limiting one is addressed.',
    'Photosynthesis supports food chains because producers create organic matter used by consumers. It also releases oxygen and removes carbon dioxide from the atmosphere. Students should distinguish photosynthesis from respiration: photosynthesis stores energy in glucose, whereas respiration releases usable energy from glucose.',
  ].join('\n\n').repeat(2);
  const result = assessLessonContent({
    title: 'Photosynthesis',
    written_content: paragraphs,
    learning_objectives: ['Explain the photosynthesis equation', 'Investigate the need for light', 'Describe limiting factors'],
    key_points: ['Chlorophyll absorbs light energy', 'Carbon dioxide and water form glucose', 'Light intensity can limit the rate'],
  });
  assert.equal(result.valid, true, result.issues.join(' '));
});
