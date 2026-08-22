import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const openAI = async (messages: Array<{ role: string; content: string }>, maxTokens = 1000, temperature = 0.7) => {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY is not configured for the AI Edge Function');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature, max_tokens: maxTokens }),
  });
  if (!response.ok) throw new Error(`AI provider error (${response.status})`);
  return await response.json();
};

const parseJsonArray = (content: string) => {
  try { return JSON.parse(content); } catch { const match = content.match(/\[[\s\S]*\]/); return match ? JSON.parse(match[0]) : []; }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = request.headers.get('Authorization');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Supabase Edge Function configuration is incomplete' }, 500);
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    // User client proves identity with the caller's JWT. The service-role client is
    // used only after that check for server-side writes to protected AI tables.
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);

    const body = await request.json();
    const action = String(body.action || '');
    let result: unknown;

    if (action === 'tutor') {
      const message = String(body.message || '').trim();
      if (!message) return json({ error: 'message is required' }, 400);
      const context = body.context || {};
      let sessionId = body.sessionId as string | undefined;
      if (sessionId) {
        const { data: conversation } = await userClient.from('ai_conversations').select('id').eq('id', sessionId).maybeSingle();
        if (!conversation) sessionId = undefined;
      }
      if (!sessionId) {
        const { data: conversation, error } = await adminClient.from('ai_conversations').insert({ user_id: user.id, title: message.slice(0, 80), context }).select('id').single();
        if (error) throw new Error(error.message);
        sessionId = conversation.id;
      }

      const { data: previous } = await userClient.from('ai_messages').select('role,content').eq('conversation_id', sessionId).order('created_at', { ascending: false }).limit(10);
      const messages = [
        { role: 'system', content: `You are THE GUIDE educational AI tutor for Nigerian students from primary school through university. Be accurate, encouraging, age-appropriate, and explain reasoning. Student level: ${context.studentLevel || 'unknown'}. Subject: ${context.currentSubject || 'general'}. Topic: ${context.currentTopic || 'general'}.` },
        ...((previous || []).reverse() as Array<{ role: string; content: string }>),
        { role: 'user', content: message },
      ];
      const response = await openAI(messages, 1000, 0.7);
      const answer = response.choices?.[0]?.message?.content || 'I could not generate a response.';
      await adminClient.from('ai_messages').insert([
        { conversation_id: sessionId, role: 'user', content: message, model: response.model },
        { conversation_id: sessionId, role: 'assistant', content: answer, model: response.model, tokens_used: response.usage?.total_tokens || null },
      ]);
      await adminClient.from('ai_conversations').update({ message_count: ((previous || []).length + 2), last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id);
      result = { message: { id: crypto.randomUUID(), role: 'assistant', content: answer }, sessionId };
    } else if (action === 'explain') {
      const response = await openAI([
        { role: 'system', content: 'Explain concepts clearly and educationally. Adjust language to the student level and include key points and a simple example where useful.' },
        { role: 'user', content: `Question: ${String(body.question || '')}\nSubject: ${body.subjectId || 'general'}\nTopic: ${body.topicId || 'general'}\nLevel: ${body.level || 'intermediate'}` },
      ], 800, 0.6);
      result = { explanation: { explanation: response.choices?.[0]?.message?.content || '', keyPoints: [] } };
    } else if (action === 'quiz') {
      const count = Math.min(30, Math.max(1, Number(body.questionCount || 10)));
      const response = await openAI([
        { role: 'system', content: `Generate exactly ${count} educational multiple-choice questions. Return ONLY a JSON array. Each item must have questionText, questionType, options, correctAnswer, explanation, difficulty.` },
        { role: 'user', content: `Subject: ${body.subjectId}\nTopic: ${body.topicId || 'general'}\nDifficulty: ${body.difficulty || 'medium'}` },
      ], 2500, 0.8);
      result = { quiz: { id: crypto.randomUUID(), questions: parseJsonArray(response.choices?.[0]?.message?.content || '[]'), createdAt: new Date().toISOString() } };
    } else if (action === 'study-plan') {
      const response = await openAI([
        { role: 'system', content: 'Create a practical structured study plan with daily topics, hours, resources, and practice activities.' },
        { role: 'user', content: `Subject: ${body.subjectId}\nTarget score: ${body.targetScore || 'not specified'}\nHours/day: ${body.availableHoursPerDay}\nExam date: ${body.examDate || 'not specified'}` },
      ], 1500, 0.6);
      result = { studyPlan: { id: crypto.randomUUID(), subjectId: body.subjectId, dailySchedule: [], totalDurationDays: 7, text: response.choices?.[0]?.message?.content || '', createdAt: new Date().toISOString() } };
    } else if (action === 'flashcards') {
      const count = Math.min(50, Math.max(1, Number(body.count || 10)));
      const response = await openAI([
        { role: 'system', content: `Generate exactly ${count} flashcards. Return ONLY a JSON array with front and back fields.` },
        { role: 'user', content: `Subject: ${body.subjectId}\nTopic: ${body.topicId || 'general'}` },
      ], 1800, 0.7);
      const cards = parseJsonArray(response.choices?.[0]?.message?.content || '[]');
      result = { flashcards: Array.isArray(cards) ? cards.map((card: any) => ({ ...card, id: crypto.randomUUID(), subjectId: body.subjectId, topicId: body.topicId })) : [] };
    } else if (action === 'summarize') {
      const response = await openAI([
        { role: 'system', content: 'Summarize educational material accurately, retaining important concepts and exam-relevant points.' },
        { role: 'user', content: `Type: ${body.type || 'lesson'}\nLength: ${body.length || 'medium'}\n\n${String(body.content || '')}` },
      ], 1000, 0.5);
      result = { summary: { summary: response.choices?.[0]?.message?.content || '', keyPoints: [], readingTimeMinutes: 1 } };
    } else {
      return json({ error: `Unsupported AI action: ${action}` }, 400);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await adminClient.from('ai_usage').select('id,questions_asked').eq('user_id', user.id).eq('date', today).maybeSingle();
    if (usage) {
      await adminClient.from('ai_usage').update({ questions_asked: (usage.questions_asked || 0) + 1 }).eq('id', usage.id);
    } else {
      await adminClient.from('ai_usage').insert({ user_id: user.id, date: today, questions_asked: 1, tokens_used: 0, conversations_started: action === 'tutor' ? 1 : 0 });
    }
    return json(result);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'AI request failed' }, 500);
  }
});
