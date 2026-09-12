#!/usr/bin/env node

/**
 * Deprecated: this legacy lesson regenerator is intentionally disabled.
 *
 * It could overwrite reviewed content and generated generic objectives/key points.
 * Use the Supabase lesson-worker and lesson-quality-audit pipeline instead, which
 * select by content_quality and apply deterministic quality validation.
 */

console.error(
  'ai-regenerate-lessons.js is disabled. Use the lesson-worker / lesson-quality-audit pipeline instead.'
);
process.exit(1);
