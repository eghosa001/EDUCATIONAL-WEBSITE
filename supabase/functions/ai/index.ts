import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const openAI = async (messages: Array<{ role: string; content: string }>, maxTokens = 1000, temperature = 0.7) => {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY is not configured for the AI Edge Function');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI provider error (${response.status}): ${text.slice(0, 500)}`);
  }
  return await response.json();
};

const parseJsonArray = (content: string) => {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase configuration is missing' }, 500);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required' }, 401);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication required' }, 401);

    const body = await request.json();
    const action = body.action as string;

    let result: unknown;
    let feature = action;
    let usageConversationId: string | undefined;

    if (action === 'tutor') {
      const message = String(body.message || '').trim();
      if (!message) return json({ error: 'message is required' }, 400);
      const context = body.context || {};
      const conversationId = body.sessionId as string | undefined;

      let sessionId = conversationId;
      if (sessionId) {
        const { data: conversation } = await supabase
          .from('ai_conversations').select('id').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
        if (!conversation) sessionId = undefined;
      }
      if (!sessionId) {
        const { data: conversation, error } = await supabase
          .from('ai_conversations').insert({ user_id: user.id, title: message.slice(0, 80) }).select('id').single();
        if (error) throw new Error(error.message);
        sessionId = conversation.id;
      }

      const { data: previous } = await supabase
        .from('ai_messages').select('role,content').eq('conversation_id', sessionId).eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(10);

      const system = 'You are THE GUIDE educational AI tutor for Nigerian students from primary school through university. Be accurate, encouraging, age-appropriate, and explain reasoning rather than only giving answers.';
      const contextText = `Student level: ${context.studentLevel || 'unknown'}\nSubject: ${context.currentSubject || 'general'}\nTopic: ${context.currentTopic || 'general'}\nLearning context: ${JSON.stringify(context.context || {})}`;
      const messages = [
        { role: 'system', content: `${system}\n\n${contextText}` },
        ...((previous || []).reverse() as Array<{ role: string; content: string }>),
        { role: 'user', content: message },
      ];
      const response = await openAI(messages, 1000, 0.7);
      const answer = response.choices?.[0]?.message?.content || 'I could not generate a response.';
      await supabase.from('ai_messages').insert([
        { conversation_id: sessionId, user_id: user.id, role: 'user', content: message },
        { conversation_id: sessionId, user_id: user.id, role: 'assistant', content: answer },
      ]);
      result = { message: { id: crypto.randomUUID(), role: 'assistant', content: answer }, sessionId };
      usageConversationId = sessionId;
    } else if (action === 'explain') {
      const question = String(body.question || '').trim();
      const response = await openAI([
        { role: 'system', content: 'Explain concepts clearly and educationally. Adjust language to the student level and include key points and a simple example where useful.' },
        { role: 'user', content: `Question: ${question}\nSubject: ${body.subjectId || 'general'}\nTopic: ${body.topicId || 'general'}\nLevel: ${body.level || 'intermediate'}` },
      ], 800, 0.6);
      result = { explanation: { explanation: response.choices?.[0]?.message?.content || '', keyPoints: [] } };
    } else if (action === 'quiz') {
      const count = Math.min(30, Math.max(1, Number(body.questionCount || 10)));
      const response = await openAI([
        { role: 'system', content: `Generate exactly ${count} educational multiple-choice questions. Return ONLY a JSON array. Each item must have questionText, questionType, options (array), correctAnswer, explanation, difficulty.` },
        { role: 'user', content: `Subject: ${body.subjectId}\nTopic: ${body.topicId || 'general'}\nDifficulty: ${body.difficulty || 'medium'}` },
      ], 2500, 0.8);
      result = { quiz: { id: crypto.randomUUID(), questions: parseJsonArray(response.choices?.[0]?.message?.content || '[]'), createdAt: new Date().toISOString() } };
    } else if (action === 'study-plan') {
      const response = await openAI([
        { role: 'system', content: 'Create a practical structured study plan. Return clear daily topics, hours, resources, and practice activities.' },
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
        { role: 'system', content: 'Summarize educational material accurately, retaining the important concepts and exam-relevant points.' },
        { role: 'user', content: `Type: ${body.type || 'lesson'}\nLength: ${body.length || 'medium'}\n\n${String(body.content || '')}` },
      ], 1000, 0.5);
      result = { summary: { summary: response.choices?.[0]?.message?.content || '', keyPoints: [], readingTimeMinutes: 1 } };
    } else {
      return json({ error: `Unsupported AI action: ${action}` }, 400);
    }

    const usage = (await openAI([], 1, 0).catch(() => null));
    void usage;
    await supabase.from('ai_usage_events').insert({ user_id: user.id, feature, created_at: new Date().toISOString() });
    void usageConversationId;
    return json(result);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'AI request failed' }, 500);
  }
});
