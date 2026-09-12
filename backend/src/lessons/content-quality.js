const TEMPLATE_PATTERNS = [
  /this lesson covers .* a fundamental concept/i,
  /core concept.*fundamental idea behind/i,
  /apply the relevant formula for/i,
  /identify the given information/i,
  /a simple sentence demonstrating/i,
  /is an important aspect of .* studies that helps students/i,
  /this objective means that you should be able to identify the relevant concept/i,
  /is a mathematical concept taught in the nigerian/i,
];

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

export function assessLessonContent(data = {}) {
  const written = normalizeText(data.writtenContent ?? data.written_content);
  const description = normalizeText(data.description);
  const title = normalizeText(data.title);
  const combined = `${title} ${description} ${written}`.trim();
  const issues = [];

  if (!title) issues.push('Lesson title is required.');
  if (!written) issues.push('Written lesson content is required before publication.');
  if (written && written.length < 700) issues.push('Written lesson content is too short for publication.');

  const matchedTemplate = TEMPLATE_PATTERNS.find(pattern => pattern.test(combined));
  if (matchedTemplate) issues.push('Lesson contains generic/template teaching text instead of topic-specific instruction.');

  const objectives = data.learningObjectives ?? data.learning_objectives;
  if (!Array.isArray(objectives) || objectives.filter(Boolean).length < 2) {
    issues.push('At least two topic-specific learning objectives are required.');
  }

  const keyPoints = data.keyPoints ?? data.key_points;
  if (!Array.isArray(keyPoints) || keyPoints.filter(Boolean).length < 2) {
    issues.push('At least two topic-specific key points are required.');
  }

  return { valid: issues.length === 0, issues };
}

export function assertPublishableLesson(data = {}) {
  const publishing = data.isPublished === true || data.is_published === true;
  if (!publishing) return;
  const assessment = assessLessonContent(data);
  if (!assessment.valid) {
    const error = new Error(`Lesson cannot be published: ${assessment.issues.join(' ')}`);
    error.code = 'LESSON_CONTENT_QUALITY_FAILED';
    error.statusCode = 422;
    error.details = assessment.issues;
    throw error;
  }
}

export function isTemplateLesson(lesson = {}) {
  return !assessLessonContent({
    ...lesson,
    isPublished: true,
    writtenContent: lesson.writtenContent ?? lesson.written_content,
    learningObjectives: lesson.learningObjectives ?? lesson.learning_objectives,
    keyPoints: lesson.keyPoints ?? lesson.key_points,
  }).valid;
}
