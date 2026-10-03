import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const clean = (value: unknown, max = 4000) => String(value ?? '').trim().slice(0, max);
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const parseArray = (text: string) => {
  try {
    const value = JSON.parse(text);
    return Array.isArray(value) ? value : null;
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const value = JSON.parse(match[0]);
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }
};

type PracticeQuestion = {
  questionText: string;
  questionType: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

function validateQuestions(value: unknown, expected: number): PracticeQuestion[] {
  if (!Array.isArray(value) || value.length !== expected) throw new Error('Expected exactly ' + expected + ' questions');
  const forbiddenStem = /(which examination|examination body|studying .+ helps|important topic|nigerian curriculum covering|first step.+read and understand|which statement is explicitly listed as a learning objective|which additional learning objective)/i;
  const seen = new Set<string>();
  const answerPositions = new Set<number>();

  const validated = value.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new Error('Question ' + (index + 1) + ' is invalid');
    const row = raw as Record<string, unknown>;
    const questionText = clean(row.questionText, 1800);
    const explanation = clean(row.explanation, 2500);
    const difficulty = clean(row.difficulty, 20).toLowerCase();
    const options = Array.isArray(row.options) ? row.options.map(option => clean(option, 600)).filter(Boolean) : [];
    const correctAnswer = clean(row.correctAnswer, 600);
    if (!questionText || !explanation || options.length !== 4 || !correctAnswer) throw new Error('Question ' + (index + 1) + ' is incomplete');
    if (forbiddenStem.test(questionText)) throw new Error('Question ' + (index + 1) + ' is generic rather than lesson-specific');
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error('Question ' + (index + 1) + ' has invalid difficulty');

    const normalizedOptions = options.map(option => option.toLowerCase().replace(/\s+/g, ' ').trim());
    if (new Set(normalizedOptions).size !== 4) throw new Error('Question ' + (index + 1) + ' has duplicate choices');
    const answerIndex = options.findIndex(option => option === correctAnswer);
    if (answerIndex < 0 || options.filter(option => option === correctAnswer).length !== 1) {
      throw new Error('Question ' + (index + 1) + ' must have exactly one matching correct answer');
    }
    answerPositions.add(answerIndex);

    const key = questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) throw new Error('Duplicate questions returned');
    seen.add(key);

    return {
      questionText,
      questionType: 'multiple-choice' as const,
      options,
      correctAnswer,
      explanation,
      difficulty: difficulty as PracticeQuestion['difficulty'],
    };
  });

  if (expected >= 4 && answerPositions.size < 2) {
    throw new Error('Practice set must vary correct-answer positions');
  }
  return validated;
}

const unique = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter(value => {
    const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const stripMarkdown = (value: string) => value
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[*_>#|~]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const escapeRegExp = (value: string) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

const sentencePool = (content: string) => unique(
  stripMarkdown(content)
    .split(/(?<=[.!?])\s+/)
    .map(sentence => clean(sentence, 360))
    .filter(sentence =>
      sentence.length >= 45 &&
      sentence.length <= 320 &&
      !/(welcome to|in this lesson|learning objective|nerdc curriculum requires|exam tip)/i.test(sentence)
    ),
);

const emphasisPool = (content: string, keyPoints: unknown, title: string) => {
  const bold = [...content.matchAll(/\*\*([^*\n]{2,80})\*\*/g)].map(match => clean(match[1], 80));
  const headings = [...content.matchAll(/^#{2,4}\s+(.{2,80})$/gm)].map(match => clean(match[1], 80));
  const points = Array.isArray(keyPoints) ? keyPoints.map(point => clean(point, 100)) : [];
  const capitalized = [...stripMarkdown(content).matchAll(/\b[A-Z][A-Za-z-]{2,}(?:\s+[A-Z][A-Za-z-]{2,}){0,2}\b/g)]
    .map(match => clean(match[0], 80));
  return unique([title, ...bold, ...headings, ...capitalized, ...points])
    .filter(term => term.length >= 3 && term.length <= 80 && !/[.!?]$/.test(term))
    .slice(0, 80);
};

const rotated = (options: string[], offset: number) => {
  if (!options.length) return options;
  const n = ((offset % options.length) + options.length) % options.length;
  return [...options.slice(n), ...options.slice(0, n)];
};

function groundedFallback(
  lesson: Record<string, unknown>,
  siblingLessons: Array<Record<string, unknown>>,
  expected: number,
): PracticeQuestion[] {
  const title = clean(lesson.title, 240);
  const content = clean(lesson.written_content, 30000);
  const sentences = sentencePool(content);
  const terms = emphasisPool(content, lesson.key_points, title);
  const questions: PracticeQuestion[] = [];

  for (const term of terms) {
    if (questions.length >= expected) break;
    const sentence = sentences.find(candidate => new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i').test(candidate));
    if (!sentence) continue;
    const distractors = terms
      .filter(candidate => candidate.toLowerCase() !== term.toLowerCase())
      .filter(candidate => candidate.length <= Math.max(80, term.length * 3))
      .slice(0, 12);
    if (distractors.length < 3) continue;

    const cloze = sentence.replace(new RegExp(escapeRegExp(term), 'i'), '____');
    if (cloze === sentence) continue;
    const options = rotated([term, ...distractors.slice(0, 3)], questions.length % 4);

    questions.push({
      questionText: 'Complete this statement from "' + title + '": "' + clean(cloze, 520) + '"',
      questionType: 'multiple-choice',
      options,
      correctAnswer: term,
      explanation: 'The lesson states: "' + clean(sentence, 520) + '"',
      difficulty: questions.length < 2 ? 'easy' : questions.length < 4 ? 'medium' : 'hard',
    });
  }

  if (questions.length < expected) {
    const ownPoints = Array.isArray(lesson.key_points)
      ? unique((lesson.key_points as unknown[]).map(point => clean(point, 320)).filter(point => point.length >= 20))
      : [];
    const siblingPoints = unique(siblingLessons.flatMap(row => {
      const points = Array.isArray(row.key_points) ? row.key_points.map(point => clean(point, 320)) : [];
      return [...points, ...sentencePool(clean(row.written_content, 5000)).slice(0, 1)];
    })).filter(point => point.length >= 20);

    for (const point of ownPoints) {
      if (questions.length >= expected) break;
      const start = questions.length % Math.max(1, siblingPoints.length);
      const distractors = [...siblingPoints.slice(start), ...siblingPoints.slice(0, start)]
        .filter(candidate => candidate.toLowerCase() !== point.toLowerCase())
        .slice(0, 3);
      if (distractors.length < 3) continue;

      const options = rotated([point, ...distractors], questions.length % 4);
      questions.push({
        questionText: 'Which statement is supported by the lesson "' + title + '"? Practice item ' + (questions.length + 1),
        questionType: 'multiple-choice',
        options,
        correctAnswer: point,
        explanation: 'This is one of the lesson’s own key points: "' + clean(point, 520) + '"',
        difficulty: questions.length < 3 ? 'medium' : 'hard',
      });
    }
  }

  if (questions.length !== expected) {
    throw new Error('Lesson does not contain enough structured material for reliable fallback practice');
  }
  return validateQuestions(questions, expected);
}

async function fingerprintLesson(lesson: Record<string, unknown>) {
  const source = [
    clean(lesson.title, 2000),
    clean(lesson.written_content, 100000),
    String(Number(lesson.teaching_version || 0)),
  ].join('\n---\n');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const optionId = (index: number) => String.fromCharCode(65 + index);
const publicQuestions = (questions: PracticeQuestion[]) => questions.map((question, index) => ({
  id: 'lesson-practice-' + (index + 1),
  questionText: question.questionText,
  questionType: question.questionType,
  options: question.options.map((text, optionIndex) => ({ id: optionId(optionIndex), text })),
  difficulty: question.difficulty,
  index,
}));
const quizResponse = (lessonId: string, questions: PracticeQuestion[], cached: boolean, generationMethod: string) => json({
  quiz: {
    id: crypto.randomUUID(),
    lessonId,
    questions: publicQuestions(questions),
    createdAt: new Date().toISOString(),
  },
  cached,
  generationMethod,
});

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let reserved = false;
  let userId = '';
  let admin: ReturnType<typeof createClient> | null = null;

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const bynaraKey = Deno.env.get('BYNARA_API_KEY');
    const bynaraBaseUrl = (Deno.env.get('BYNARA_BASE_URL') || 'https://router.bynara.id/v1').replace(/\/$/, '');
    const aiModel = Deno.env.get('AI_DEFAULT_MODEL') || 'agnes-2.5-flash';
    const auth = request.headers.get('Authorization');

    if (!url || !anonKey || !serviceKey) return json({ error: 'Practice service configuration is incomplete' }, 500);
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    admin = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);
    userId = user.id;

    const body = await request.json().catch(() => ({}));
    const lessonId = clean(body.lessonId, 64);
    const action = clean(body.action || 'generate', 20).toLowerCase();
    const count = Number(body.count ?? 5);
    if (!isUuid(lessonId)) return json({ error: 'A valid lessonId is required' }, 400);
    if (!['generate', 'check'].includes(action)) return json({ error: 'Unsupported practice action' }, 400);
    if (!Number.isInteger(count) || count < 3 || count > 10) return json({ error: 'count must be an integer from 3 to 10' }, 400);

    const { data: lesson, error: lessonError } = await admin.from('lessons')
      .select('id,title,written_content,learning_objectives,key_points,topic_id,course_id,is_published,content_quality,teaching_version')
      .eq('id', lessonId)
      .maybeSingle();
    if (lessonError || !lesson || !lesson.is_published || lesson.content_quality === 'needs_review') {
      return json({ error: 'Lesson is not available for practice generation' }, 404);
    }

    const content = clean(lesson.written_content, 30000);
    if (content.length < 500) return json({ error: 'Lesson content is too short for reliable practice generation' }, 422);

    const [{ data: topic }, { data: course }, { data: siblingLessons }] = await Promise.all([
      admin.from('topics').select('name,description,learning_objectives').eq('id', lesson.topic_id).maybeSingle(),
      admin.from('courses').select('subject_id,class_id,term_id,title').eq('id', lesson.course_id).maybeSingle(),
      admin.from('lessons').select('id,title,key_points,written_content').eq('course_id', lesson.course_id).eq('is_published', true).neq('id', lessonId).limit(12),
    ]);
    if (!topic || !course) return json({ error: 'Lesson curriculum mapping is incomplete' }, 422);

    const [{ data: subject }, { data: level }, { data: term }] = await Promise.all([
      admin.from('subjects').select('name').eq('id', course.subject_id).maybeSingle(),
      admin.from('classes').select('name,code').eq('id', course.class_id).maybeSingle(),
      admin.from('terms').select('name').eq('id', course.term_id).maybeSingle(),
    ]);

    const fingerprint = await fingerprintLesson(lesson as Record<string, unknown>);
    const { data: cached } = await admin.from('lesson_practice_sets')
      .select('content_fingerprint,questions,generation_method,source_version')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    let cachedFallback: PracticeQuestion[] | null = null;
    let cachedQuestions: PracticeQuestion[] | null = null;
    if (cached?.content_fingerprint === fingerprint) {
      try {
        cachedQuestions = validateQuestions(cached.questions, count);
      } catch {
        cachedQuestions = null;
      }
    }

    if (action === 'check') {
      if (!cachedQuestions) return json({ error: 'Practice set changed. Reload the practice tab.' }, 409);
      const questionIndex = Number(body.questionIndex);
      const answerId = clean(body.answerId, 4).toUpperCase();
      if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= cachedQuestions.length) {
        return json({ error: 'Invalid practice question' }, 400);
      }
      const question = cachedQuestions[questionIndex];
      const selectedIndex = answerId.length === 1 ? answerId.charCodeAt(0) - 65 : -1;
      if (selectedIndex < 0 || selectedIndex >= question.options.length) return json({ error: 'Invalid answer choice' }, 400);
      const correctIndex = question.options.findIndex(option => option === question.correctAnswer);
      return json({
        result: {
          isCorrect: selectedIndex === correctIndex,
          correctAnswer: optionId(correctIndex),
          explanation: question.explanation,
        },
      });
    }

    if (cachedQuestions) {
      if (cached.generation_method === 'ai' || Number(cached.source_version || 0) >= 2) {
        return quizResponse(lessonId, cachedQuestions, true, String(cached.generation_method || 'grounded-fallback'));
      }
      cachedFallback = cachedQuestions;
    }

    if (bynaraKey) {
      const { data: consumed, error: consumeError } = await admin.rpc('consume_ai_request', { p_user_id: user.id, p_daily_limit: 100 });
      if (!consumeError && consumed === true) {
        reserved = true;
        const system = 'You create rigorous lesson-specific multiple-choice practice for THE GUIDE. Use ONLY the supplied lesson and curriculum metadata as the factual source. Return ONLY a JSON array with exactly ' + count + ' objects. Each object must contain questionText, options, correctAnswer, explanation, difficulty. options must contain exactly four distinct plausible strings. correctAnswer must exactly equal one and only one option. Vary the position of the correct answer across the set. difficulty must be easy, medium, or hard. Every question must test knowledge, interpretation, application or calculation taught in this exact lesson. Do not ask generic study-advice questions. Do not ask learners to identify a learning objective, curriculum statement, examination body, topic importance, or syllabus wording. Do not invent facts, dates, formulas, quotations, scripture, statistics, people, laws, classifications, examples or exam requirements that are absent from or unsupported by the lesson. For calculations, recompute the answer and make distractors distinct. For language questions, ensure exactly one grammatical answer. Explanations must state why the correct answer follows from the lesson.';
        const prompt = [
          'LEVEL: ' + clean(level?.code || level?.name, 120),
          'SUBJECT: ' + clean(subject?.name, 160),
          'TERM: ' + clean(term?.name, 100),
          'COURSE: ' + clean(course.title, 240),
          'TOPIC: ' + clean(topic.name, 500),
          'CURRICULUM OBJECTIVES: ' + JSON.stringify(topic.learning_objectives || lesson.learning_objectives || []),
          'TOPIC DESCRIPTION: ' + clean(topic.description, 2500),
          '',
          'LESSON MATERIAL:',
          content,
        ].join('\n');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45_000);
        try {
          const response = await fetch(bynaraBaseUrl + '/chat/completions', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + bynaraKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: aiModel,
              temperature: 0.15,
              max_tokens: Math.min(4500, 500 * count),
              messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
            }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('Practice generation failed with provider status ' + response.status);
          const data = await response.json();
          const raw = clean(data?.choices?.[0]?.message?.content, 30000);
          const questions = validateQuestions(parseArray(raw), count);

          await admin.from('lesson_practice_sets').upsert({
            lesson_id: lessonId,
            content_fingerprint: fingerprint,
            questions,
            generation_method: 'ai',
            source_version: 2,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'lesson_id' });

          const tokens = Number(data?.usage?.total_tokens || 0);
          const today = new Date().toISOString().slice(0, 10);
          const { data: usage } = await admin.from('ai_usage').select('tokens_used').eq('user_id', user.id).eq('date', today).maybeSingle();
          await admin.from('ai_usage').update({
            tokens_used: Number(usage?.tokens_used || 0) + (Number.isFinite(tokens) ? tokens : 0),
          }).eq('user_id', user.id).eq('date', today);

          reserved = false;
          return quizResponse(lessonId, questions, false, 'ai');
        } catch (error) {
          console.error('AI lesson practice unavailable; using grounded fallback', error instanceof Error ? error.message : String(error));
          if (reserved) {
            try { await admin.rpc('release_ai_request', { p_user_id: user.id }); } catch {}
            reserved = false;
          }
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    let fallback: PracticeQuestion[];
    let usedSeedCache = false;
    try {
      fallback = groundedFallback(
        lesson as Record<string, unknown>,
        (siblingLessons || []) as Array<Record<string, unknown>>,
        count,
      );
    } catch (fallbackError) {
      if (!cachedFallback) throw fallbackError;
      fallback = cachedFallback;
      usedSeedCache = true;
    }

    if (!usedSeedCache) {
      await admin.from('lesson_practice_sets').upsert({
        lesson_id: lessonId,
        content_fingerprint: fingerprint,
        questions: fallback,
        generation_method: 'grounded-fallback',
        source_version: 2,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id' });
    }

    return quizResponse(lessonId, fallback, usedSeedCache, 'grounded-fallback');
  } catch (error) {
    if (reserved && userId && admin) {
      try { await admin.rpc('release_ai_request', { p_user_id: userId }); } catch {}
    }
    const message = error instanceof Error ? error.message : 'Practice generation failed';
    console.error(message);
    return json({ error: message }, /required|invalid|incomplete|short|expected|duplicate|generic|structured/i.test(message) ? 422 : 500);
  }
});
