import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuredOrigins = (Deno.env.get('AI_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsHeadersFor = (request: Request) => {
  const origin = request.headers.get('Origin');
  const allowed = origin && (configuredOrigins.length === 0 || configuredOrigins.includes(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : (configuredOrigins.length === 0 ? '*' : configuredOrigins[0]),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
};

const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeadersFor(request), 'Content-Type': 'application/json' },
});

const MAX_BODY_BYTES = 64 * 1024;
const DAILY_AI_LIMIT = 100;
const MAX_TUTOR_MESSAGE = 8000;
const MAX_EXPLAIN_QUESTION = 12000;
const MAX_SUMMARY_CONTENT = 30000;
const MAX_CONTEXT_FIELD = 200;

const cleanString = (value: unknown, maxLength: number) => String(value ?? '').trim().slice(0, maxLength);

const parseJson = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try { return JSON.parse(arrayMatch[0]); } catch { return null; }
    }
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try { return JSON.parse(objectMatch[0]); } catch { return null; }
    }
    return null;
  }
};

const openAI = async (
  messages: Array<{ role: string; content: string }>,
  maxTokens = 1000,
  temperature = 0.7,
) => {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('AI provider is not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature, max_tokens: maxTokens }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('AI provider request failed');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const validateQuiz = (value: unknown, expectedCount: number) => {
  if (!Array.isArray(value)) throw new Error('AI returned an invalid quiz format');
  if (value.length !== expectedCount) throw new Error(`AI returned ${value.length} questions; expected ${expectedCount}`);

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`Invalid quiz question at index ${index}`);
    const q = item as Record<string, unknown>;
    const questionText = cleanString(q.questionText, 2000);
    const explanation = cleanString(q.explanation, 3000);
    const difficulty = cleanString(q.difficulty, 30).toLowerCase();
    const questionType = cleanString(q.questionType, 30).toLowerCase();
    const options = Array.isArray(q.options) ? q.options.map((o) => cleanString(o, 500)).filter(Boolean) : [];
    const correctAnswer = cleanString(q.correctAnswer, 500);

    if (!questionText || !explanation || !correctAnswer || options.length < 2 || options.length > 6) {
      throw new Error(`Invalid quiz question at index ${index}`);
    }
    if (!options.includes(correctAnswer)) throw new Error(`Quiz answer does not match an option at index ${index}`);
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new Error(`Invalid quiz difficulty at index ${index}`);

    return { questionText, questionType: questionType || 'multiple-choice', options, correctAnswer, explanation, difficulty };
  });
};

const validateFlashcards = (value: unknown, expectedCount: number) => {
  if (!Array.isArray(value) || value.length !== expectedCount) throw new Error('AI returned an invalid flashcard set');
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`Invalid flashcard at index ${index}`);
    const card = item as Record<string, unknown>;
    const front = cleanString(card.front, 1500);
    const back = cleanString(card.back, 3000);
    if (!front || !back) throw new Error(`Invalid flashcard at index ${index}`);
    return { front, back };
  });
};

const validateStudyPlan = (value: unknown) => {
  if (!value || typeof value !== 'object') throw new Error('AI returned an invalid study plan');
  const plan = value as Record<string, unknown>;
  if (!Array.isArray(plan.dailySchedule) || plan.dailySchedule.length < 1) throw new Error('AI returned an empty study plan');
  const dailySchedule = plan.dailySchedule.map((day, index) => {
    if (!day || typeof day !== 'object') throw new Error(`Invalid study-plan day ${index + 1}`);
    const d = day as Record<string, unknown>;
    const dayNumber = Number(d.day);
    const hours = Number(d.hours);
    const topics = Array.isArray(d.topics) ? d.topics.map((x) => cleanString(x, 300)).filter(Boolean) : [];
    const activities = Array.isArray(d.activities) ? d.activities.map((x) => cleanString(x, 500)).filter(Boolean) : [];
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || !Number.isFinite(hours) || hours <= 0 || hours > 24 || topics.length === 0) {
      throw new Error(`Invalid study-plan day ${index + 1}`);
    }
    return { day: dayNumber, hours, topics, activities };
  });
  return {
    dailySchedule,
    totalDurationDays: dailySchedule.length,
    resources: Array.isArray(plan.resources) ? plan.resources.map((x) => cleanString(x, 500)).filter(Boolean).slice(0, 20) : [],
  };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);

  let reserved = false;
  let userId = '';

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json(request, { error: 'Request body is too large' }, 413);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = request.headers.get('Authorization');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(request, { error: 'AI service configuration is incomplete' }, 500);
    if (!authHeader?.startsWith('Bearer ')) return json(request, { error: 'Authentication required' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(request, { error: 'Authentication required' }, 401);
    userId = user.id;

    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(request, { error: 'Invalid request body' }, 400);
    const action = cleanString((body as Record<string, unknown>).action, 30);
    const allowedActions = new Set(['tutor', 'explain', 'quiz', 'study-plan', 'flashcards', 'summarize']);
    if (!allowedActions.has(action)) return json(request, { error: 'Unsupported AI action' }, 400);

    const { data: reservedResult, error: reserveError } = await adminClient.rpc('consume_ai_request', {
      p_user_id: user.id,
      p_daily_limit: DAILY_AI_LIMIT,
    });
    if (reserveError) throw new Error('AI usage service is temporarily unavailable');
    if (reservedResult !== true) return json(request, { error: 'Daily AI usage limit reached. Please try again tomorrow.' }, 429);
    reserved = true;

    let result: unknown;
    let tokensUsed = 0;
    let conversationStarted = false;

    if (action === 'tutor') {
      const message = cleanString(body.message, MAX_TUTOR_MESSAGE);
      if (!message) return json(request, { error: 'message is required' }, 400);
      const rawContext = body.context && typeof body.context === 'object' ? body.context as Record<string, unknown> : {};
      const context = {
        studentLevel: cleanString(rawContext.studentLevel, MAX_CONTEXT_FIELD) || 'unknown',
        currentSubject: cleanString(rawContext.currentSubject, MAX_CONTEXT_FIELD) || 'general',
        currentTopic: cleanString(rawContext.currentTopic, MAX_CONTEXT_FIELD) || 'general',
      };
      let sessionId = cleanString(body.sessionId, 100) || undefined;
      if (sessionId) {
        const { data: conversation } = await userClient.from('ai_conversations').select('id').eq('id', sessionId).maybeSingle();
        if (!conversation) sessionId = undefined;
      }
      if (!sessionId) {
        const { data: conversation, error } = await adminClient.from('ai_conversations').insert({ user_id: user.id, title: message.slice(0, 80), context }).select('id').single();
        if (error) throw new Error('Unable to create AI conversation');
        sessionId = conversation.id;
        conversationStarted = true;
      }

      const { data: previous } = await userClient.from('ai_messages').select('role,content').eq('conversation_id', sessionId).order('created_at', { ascending: false }).limit(10);
      const messages = [
        { role: 'system', content: `You are THE GUIDE educational AI tutor for Nigerian students from primary school through university. Be accurate, encouraging, age-appropriate, and explain reasoning. Student level: ${context.studentLevel}. Subject: ${context.currentSubject}. Topic: ${context.currentTopic}.` },
        ...((previous || []).reverse() as Array<{ role: string; content: string }>),
        { role: 'user', content: message },
      ];
      const response = await openAI(messages, 1000, 0.7);
      const answer = cleanString(response.choices?.[0]?.message?.content, 12000);
      if (!answer) throw new Error('AI returned an empty response');
      tokensUsed = Number(response.usage?.total_tokens || 0);
      await adminClient.from('ai_messages').insert([
        { conversation_id: sessionId, role: 'user', content: message, model: response.model },
        { conversation_id: sessionId, role: 'assistant', content: answer, model: response.model, tokens_used: tokensUsed || null },
      ]);
      await adminClient.from('ai_conversations').update({ message_count: ((previous || []).length + 2), last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id);
      result = { message: { id: crypto.randomUUID(), role: 'assistant', content: answer }, sessionId };
    } else if (action === 'explain') {
      const question = cleanString(body.question, MAX_EXPLAIN_QUESTION);
      if (!question) return json(request, { error: 'question is required' }, 400);
      const response = await openAI([
        { role: 'system', content: 'Explain concepts clearly and educationally. Adjust language to the student level and include key points and a simple example where useful.' },
        { role: 'user', content: `Question: ${question}\nSubject: ${cleanString(body.subjectId, MAX_CONTEXT_FIELD) || 'general'}\nTopic: ${cleanString(body.topicId, MAX_CONTEXT_FIELD) || 'general'}\nLevel: ${cleanString(body.level, MAX_CONTEXT_FIELD) || 'intermediate'}` },
      ], 800, 0.6);
      tokensUsed = Number(response.usage?.total_tokens || 0);
      result = { explanation: { explanation: cleanString(response.choices?.[0]?.message?.content, 12000), keyPoints: [] } };
    } else if (action === 'quiz') {
      const count = Math.min(30, Math.max(1, Number(body.questionCount || 10)));
      if (!Number.isInteger(count)) return json(request, { error: 'questionCount must be an integer' }, 400);
      const response = await openAI([
        { role: 'system', content: `Generate exactly ${count} educational multiple-choice questions. Return ONLY a JSON array. Each item must have questionText, questionType, options, correctAnswer, explanation, difficulty. The correctAnswer must exactly match one option. difficulty must be easy, medium, or hard.` },
        { role: 'user', content: `Subject: ${cleanString(body.subjectId, MAX_CONTEXT_FIELD)}\nTopic: ${cleanString(body.topicId, MAX_CONTEXT_FIELD) || 'general'}\nDifficulty: ${cleanString(body.difficulty, 30) || 'medium'}` },
      ], Math.min(3000, 100 * count), 0.8);
      tokensUsed = Number(response.usage?.total_tokens || 0);
      const questions = validateQuiz(parseJson(response.choices?.[0]?.message?.content || ''), count);
      result = { quiz: { id: crypto.randomUUID(), questions, createdAt: new Date().toISOString() } };
    } else if (action === 'study-plan') {
      const availableHours = Number(body.availableHoursPerDay);
      if (!Number.isFinite(availableHours) || availableHours <= 0 || availableHours > 24) return json(request, { error: 'availableHoursPerDay must be between 0 and 24' }, 400);
      const response = await openAI([
        { role: 'system', content: 'Create a practical structured study plan. Return ONLY valid JSON: {"dailySchedule":[{"day":1,"hours":2,"topics":["..."],"activities":["..."]}],"resources":["..."]}. Do not return markdown.' },
        { role: 'user', content: `Subject: ${cleanString(body.subjectId, MAX_CONTEXT_FIELD)}\nTarget score: ${cleanString(body.targetScore, 30) || 'not specified'}\nHours/day: ${availableHours}\nExam date: ${cleanString(body.examDate, 40) || 'not specified'}` },
      ], 1800, 0.6);
      tokensUsed = Number(response.usage?.total_tokens || 0);
      const plan = validateStudyPlan(parseJson(response.choices?.[0]?.message?.content || ''));
      result = { studyPlan: { id: crypto.randomUUID(), subjectId: cleanString(body.subjectId, MAX_CONTEXT_FIELD), ...plan, createdAt: new Date().toISOString() } };
    } else if (action === 'flashcards') {
      const count = Math.min(50, Math.max(1, Number(body.count || 10)));
      if (!Number.isInteger(count)) return json(request, { error: 'count must be an integer' }, 400);
      const response = await openAI([
        { role: 'system', content: `Generate exactly ${count} flashcards. Return ONLY a JSON array with front and back string fields.` },
        { role: 'user', content: `Subject: ${cleanString(body.subjectId, MAX_CONTEXT_FIELD)}\nTopic: ${cleanString(body.topicId, MAX_CONTEXT_FIELD) || 'general'}` },
      ], Math.min(3000, 70 * count), 0.7);
      tokensUsed = Number(response.usage?.total_tokens || 0);
      const cards = validateFlashcards(parseJson(response.choices?.[0]?.message?.content || ''), count);
      result = { flashcards: cards.map((card) => ({ ...card, id: crypto.randomUUID(), subjectId: body.subjectId, topicId: body.topicId || null })) };
    } else {
      const content = cleanString(body.content, MAX_SUMMARY_CONTENT);
      if (!content) return json(request, { error: 'content is required' }, 400);
      const response = await openAI([
        { role: 'system', content: 'Summarize educational material accurately, retaining important concepts and exam-relevant points.' },
        { role: 'user', content: `Type: ${cleanString(body.type, 50) || 'lesson'}\nLength: ${cleanString(body.length, 50) || 'medium'}\n\n${content}` },
      ], 1000, 0.5);
      tokensUsed = Number(response.usage?.total_tokens || 0);
      result = { summary: { summary: cleanString(response.choices?.[0]?.message?.content, 12000), keyPoints: [], readingTimeMinutes: Math.max(1, Math.ceil(content.length / 1000)) } };
    }

    await adminClient.from('ai_usage').update({
      tokens_used: Number.isFinite(tokensUsed) ? tokensUsed : 0,
      conversations_started: conversationStarted ? 1 : 0,
    }).eq('user_id', user.id).eq('date', new Date().toISOString().slice(0, 10));

    return json(request, result);
  } catch (error) {
    console.error('AI request failed:', error instanceof Error ? error.message : 'unknown error');
    if (reserved && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          await adminClient.rpc('release_ai_request', { p_user_id: userId });
        }
      } catch (releaseError) {
        console.error('Failed to release AI quota:', releaseError instanceof Error ? releaseError.message : 'unknown error');
      }
    }
    const message = error instanceof Error ? error.message : 'AI request failed';
    const status = /invalid|required|must be|empty|expected/i.test(message) ? 400 : 500;
    return json(request, { error: message }, status);
  }
});
