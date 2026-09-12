import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (value: unknown, max = 4000) => String(value ?? '').trim().slice(0, max);
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const parseArray = (text: string) => { try { const value = JSON.parse(text); return Array.isArray(value) ? value : null; } catch { const match = text.match(/\[[\s\S]*\]/); if (!match) return null; try { const value = JSON.parse(match[0]); return Array.isArray(value) ? value : null; } catch { return null; } } };

function validateQuestions(value: unknown, expected: number) {
  if (!Array.isArray(value) || value.length !== expected) throw new Error(`Expected exactly ${expected} questions`);
  const forbiddenStem = /(which examination|examination body|studying .+ helps|important topic|nigerian curriculum covering|first step.+read and understand)/i;
  const seen = new Set<string>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new Error(`Question ${index + 1} is invalid`);
    const row = raw as Record<string, unknown>;
    const questionText = clean(row.questionText, 1800);
    const explanation = clean(row.explanation, 2500);
    const difficulty = clean(row.difficulty, 20).toLowerCase();
    const options = Array.isArray(row.options) ? row.options.map((option) => clean(option, 600)).filter(Boolean) : [];
    const correctAnswer = clean(row.correctAnswer, 600);
    if (!questionText || !explanation || options.length !== 4 || !correctAnswer) throw new Error(`Question ${index + 1} is incomplete`);
    if (forbiddenStem.test(questionText)) throw new Error(`Question ${index + 1} is generic rather than lesson-specific`);
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error(`Question ${index + 1} has invalid difficulty`);
    const normalizedOptions = options.map((option) => option.toLowerCase().replace(/\s+/g, ' ').trim());
    if (new Set(normalizedOptions).size !== 4) throw new Error(`Question ${index + 1} has duplicate choices`);
    const exactMatches = options.filter((option) => option === correctAnswer).length;
    if (exactMatches !== 1) throw new Error(`Question ${index + 1} must have exactly one matching correct answer`);
    const key = questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) throw new Error('Duplicate questions returned');
    seen.add(key);
    return { questionText, questionType: 'multiple-choice', options, correctAnswer, explanation, difficulty };
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let reserved = false;
  let userId = '';
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    const auth = request.headers.get('Authorization');
    if (!url || !anonKey || !serviceKey || !openAiKey) return json({ error: 'Practice service configuration is incomplete' }, 500);
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);
    userId = user.id;

    const body = await request.json().catch(() => ({}));
    const lessonId = clean(body.lessonId, 64);
    const count = Number(body.count ?? 5);
    if (!isUuid(lessonId)) return json({ error: 'A valid lessonId is required' }, 400);
    if (!Number.isInteger(count) || count < 3 || count > 10) return json({ error: 'count must be an integer from 3 to 10' }, 400);

    const { data: lesson, error: lessonError } = await admin.from('lessons')
      .select('id,title,written_content,learning_objectives,topic_id,course_id,is_published,content_quality')
      .eq('id', lessonId).maybeSingle();
    if (lessonError || !lesson || !lesson.is_published || lesson.content_quality === 'needs_review') return json({ error: 'Lesson is not available for practice generation' }, 404);
    const content = clean(lesson.written_content, 30000);
    if (content.length < 500) return json({ error: 'Lesson content is too short for reliable practice generation' }, 422);

    const [{ data: topic }, { data: course }] = await Promise.all([
      admin.from('topics').select('name,description,learning_objectives').eq('id', lesson.topic_id).maybeSingle(),
      admin.from('courses').select('subject_id,class_id,term_id,title').eq('id', lesson.course_id).maybeSingle(),
    ]);
    if (!topic || !course) return json({ error: 'Lesson curriculum mapping is incomplete' }, 422);
    const [{ data: subject }, { data: level }, { data: term }] = await Promise.all([
      admin.from('subjects').select('name').eq('id', course.subject_id).maybeSingle(),
      admin.from('classes').select('name,code').eq('id', course.class_id).maybeSingle(),
      admin.from('terms').select('name').eq('id', course.term_id).maybeSingle(),
    ]);

    const { data: consumed, error: consumeError } = await admin.rpc('consume_ai_request', { p_user_id: user.id, p_daily_limit: 100 });
    if (consumeError) throw new Error('AI usage service is temporarily unavailable');
    if (consumed !== true) return json({ error: 'Daily AI usage limit reached. Please try again tomorrow.' }, 429);
    reserved = true;

    const system = `You create rigorous lesson-specific multiple-choice practice for THE GUIDE. Use ONLY the supplied lesson and curriculum metadata as the factual source. Return ONLY a JSON array with exactly ${count} objects. Each object must contain questionText, options, correctAnswer, explanation, difficulty. options must contain exactly four distinct plausible strings. correctAnswer must exactly equal one and only one option. difficulty must be easy, medium, or hard. Every question must test knowledge or reasoning taught in this exact lesson. Do not ask generic study-advice questions. Do not ask which examination body tests a topic. Do not ask whether a topic is important or part of a curriculum. Do not invent facts, dates, formulas, quotations, scripture, statistics, people, laws, classifications, examples or exam requirements that are absent from or unsupported by the lesson. For calculations, recompute the answer and make distractors distinct. For language questions, ensure exactly one grammatical answer. Explanations must state why the correct answer follows from the lesson.`;
    const prompt = `LEVEL: ${clean(level?.code || level?.name, 120)}\nSUBJECT: ${clean(subject?.name, 160)}\nTERM: ${clean(term?.name, 100)}\nCOURSE: ${clean(course.title, 240)}\nTOPIC: ${clean(topic.name, 500)}\nCURRICULUM OBJECTIVES: ${JSON.stringify(topic.learning_objectives || lesson.learning_objectives || [])}\nTOPIC DESCRIPTION: ${clean(topic.description, 2500)}\n\nLESSON MATERIAL:\n${content}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.15, max_tokens: Math.min(4500, 500 * count), messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Practice generation failed with provider status ${response.status}`);
      const data = await response.json();
      const raw = clean(data?.choices?.[0]?.message?.content, 30000);
      const questions = validateQuestions(parseArray(raw), count);
      const tokens = Number(data?.usage?.total_tokens || 0);
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await admin.from('ai_usage').select('tokens_used').eq('user_id', user.id).eq('date', today).maybeSingle();
      await admin.from('ai_usage').update({ tokens_used: Number(usage?.tokens_used || 0) + (Number.isFinite(tokens) ? tokens : 0) }).eq('user_id', user.id).eq('date', today);
      return json({ quiz: { id: crypto.randomUUID(), lessonId, questions, createdAt: new Date().toISOString() } });
    } finally { clearTimeout(timeout); }
  } catch (error) {
    if (reserved && userId) {
      try {
        const url = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (url && serviceKey) await createClient(url, serviceKey).rpc('release_ai_request', { p_user_id: userId });
      } catch { /* best effort */ }
    }
    const message = error instanceof Error ? error.message : 'Practice generation failed';
    console.error(message);
    return json({ error: message }, /required|invalid|incomplete|short|expected|duplicate|generic/i.test(message) ? 422 : 500);
  }
});
