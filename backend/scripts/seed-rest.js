/**
 * LEGACY CONTENT SEEDER — DISABLED
 *
 * This script previously generated generic curriculum questions and flashcards
 * from topic names alone. That produced practice items which did not assess the
 * actual lesson material (for example, questions about which examination body
 * tests a topic).
 *
 * Production content must now be generated from the linked curriculum topic,
 * learning objectives and lesson text, then pass content-quality validation.
 * Use the maintained lesson/practice content pipeline instead of this script.
 */

console.error(
  'seed-rest.js is disabled because its legacy generators are not lesson-grounded. ' +
  'Use the validated curriculum content pipeline instead.'
);
process.exit(1);
