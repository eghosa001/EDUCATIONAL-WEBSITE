import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const DAILY_AI_LIMIT = 100;
const cors = (request: Request) => {
  const origin = request.headers.get("Origin");
  let allowedOrigin = "*";
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") allowedOrigin = parsed.origin;
    } catch {}
  }
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};
const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(request), "Content-Type": "application/json" } });
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const parseJson = (value: string): unknown => { try { return JSON.parse(value); } catch { const match = value.match(/\[[\s\S]*\]/); if (!match) return null; try { return JSON.parse(match[0]); } catch { return null; } } };
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const validateCards = (value: unknown, count: number, topic: string) => { if (!Array.isArray(value) || value.length !== count) throw new Error(`AI returned ${Array.isArray(value) ? value.length : 0} cards; expected ${count}`); const seen = new Set<string>(); const forbidden = ["key topic in the nigerian curriculum", "read textbooks, attend classes, practice past questions", "builds foundational knowledge for waec", "contributes to personal development", "is important because it builds"]; return value.map((item, index) => { if (!item || typeof item !== "object") throw new Error(`Invalid flashcard ${index + 1}`); const card = item as Record<string, unknown>; const front = text(card.front, 1200); const back = text(card.back, 2500); const difficulty = text(card.difficulty, 20).toLowerCase(); if (front.length < 8 || back.length < 15) throw new Error(`Flashcard ${index + 1} is too short`); const key = normalise(front); if (seen.has(key)) throw new Error(`Duplicate flashcard ${index + 1}`); seen.add(key); const combined = normalise(`${front} ${back}`); if (forbidden.some(p => combined.includes(p))) throw new Error(`Flashcard ${index + 1} contains generic filler`); if (combined.length < 20) throw new Error(`Flashcard ${index + 1} does not contain enough educational content`); if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error(`Flashcard ${index + 1} has invalid difficulty`); return { front, back, difficulty }; }); };
async function openAI(messages: Array<{ role: string; content: string }>, maxTokens: number, model: string, timeoutMs = 8_000) { const key = Deno.env.get("BYNARA_API_KEY"); const baseUrl = (Deno.env.get("BYNARA_BASE_URL") || "https://router.bynara.id/v1").replace(/\/$/, ""); if (!key) throw new Error("Bynara AI provider is not configured"); const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs); try { const response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, temperature: 0.2, max_tokens: maxTokens, messages }), signal: controller.signal }); if (!response.ok) { const detail = (await response.text()).slice(0, 500); console.error("Bynara request failed", model, response.status, detail); throw new Error(`AI provider request failed with status ${response.status}`); } return await response.json(); } finally { clearTimeout(timeout); } }
async function generateCards(messages: Array<{ role: string; content: string }>, count: number, topic: string) { const preferred = Deno.env.get("AI_FLASHCARD_MODEL") || Deno.env.get("AI_TUTOR_MODEL") || Deno.env.get("AI_DEFAULT_MODEL") || "ling-3.0-flash-fin-free"; const fallback = Deno.env.get("AI_FLASHCARD_FALLBACK_MODEL") || Deno.env.get("AI_TUTOR_FALLBACK_MODEL") || "laguna-s-2.1"; let lastError: unknown = null; for (const model of [...new Set([preferred, fallback])]) { try { const response = await openAI(messages, Math.min(3200, Math.max(1800, count * 110)), model); return validateCards(parseJson(response.choices?.[0]?.message?.content || ""), count, topic); } catch (error) { lastError = error; console.warn("Flashcard model failed; trying fallback if available:", model, error instanceof Error ? error.message : String(error)); } } throw lastError instanceof Error ? lastError : new Error("Flashcard generation failed"); }

const cleanMarkdown = (value: unknown, max = 2500) => text(value, max)
  .replace(/<[^>]+>/g, " ")
  .replace(/[*_`#>]/g, "")
  .replace(/\\n/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const groundedFallbackCards = (topic: Record<string, unknown>, lessons: any[], count: number) => {
  const cards: Array<{ front: string; back: string; difficulty: string }> = [];
  const seen = new Set<string>();
  const topicName = cleanMarkdown(topic.name, 180) || "this topic";
  const add = (frontValue: unknown, backValue: unknown) => {
    const front = cleanMarkdown(frontValue, 1200);
    const back = cleanMarkdown(backValue, 2500);
    if (front.length < 8 || back.length < 15) return;
    const key = normalise(front);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const difficulty = cards.length % 5 === 4 ? "hard" : cards.length % 3 === 2 ? "medium" : "easy";
    cards.push({ front, back, difficulty });
  };

  for (const lesson of lessons || []) {
    const content = String(lesson?.written_content || "");
    if (!content.trim()) continue;

    const tableRe = /^\|\s*(?:\*\*)?([^|\n*]{2,120})(?:\*\*)?\s*\|\s*([^|\n]{15,1800})\s*\|/gm;
    for (const match of content.matchAll(tableRe)) {
      const term = cleanMarkdown(match[1], 160);
      const meaning = cleanMarkdown(match[2], 1200);
      if (/^(term|meaning|[-: ]+)$/i.test(term) || /^[-: ]+$/.test(meaning)) continue;
      add(`What is ${term}?`, meaning);
    }

    const bulletRe = /^-\s+\*\*([^*\n]{2,120})\*\*\s*:\s*(.{15,1800})$/gm;
    for (const match of content.matchAll(bulletRe)) add(`Explain ${cleanMarkdown(match[1], 160)}.`, match[2]);

    const definitionRe = /\*\*([^*\n]{2,120})\*\*\s+(is|are|refers to|means)\s+([^\n]{15,1800})/gi;
    for (const match of content.matchAll(definitionRe)) {
      const term = cleanMarkdown(match[1], 160);
      const verb = String(match[2]).toLowerCase();
      const answer = cleanMarkdown(`${term} ${verb} ${match[3]}`, 1800).split(/(?<=[.!?])\s+/)[0];
      add(verb === "are" ? `What are ${term}?` : `What is ${term}?`, answer);
    }

    const headingRe = /^#{2,4}\s+(.+)$/gm;
    const headings = [...content.matchAll(headingRe)];
    for (let i = 0; i < headings.length; i += 1) {
      const heading = cleanMarkdown(headings[i][1].replace(/^\d+\.\s*/, ""), 180);
      if (!heading || /^(introduction|summary|recap)$/i.test(heading)) continue;
      const start = (headings[i].index || 0) + headings[i][0].length;
      const end = i + 1 < headings.length ? (headings[i + 1].index || content.length) : content.length;
      const section = content.slice(start, end)
        .split(/\n\s*\n/)
        .map((part: string) => cleanMarkdown(part, 1800))
        .find((part: string) => part.length >= 40 && !part.startsWith("|") && !part.startsWith("-"));
      if (section) add(`Explain ${heading} in ${topicName}.`, section);
    }

    const lessonPoints = [...(Array.isArray(lesson?.key_points) ? lesson.key_points : []), ...(Array.isArray(lesson?.learning_objectives) ? lesson.learning_objectives : [])];
    lessonPoints.forEach((point, pointIndex) => {
      const answer = cleanMarkdown(point, 1200);
      if (answer.length >= 25) add(`What is key point ${pointIndex + 1} from ${cleanMarkdown(lesson?.title, 120) || topicName}?`, answer);
    });

    const proseChunks = content
      .split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map((part: string) => cleanMarkdown(part, 1500))
      .filter((part: string) =>
        part.length >= 45 &&
        part.length <= 1400 &&
        !/^[-|]/.test(part) &&
        !/^(objectives?|summary|introduction|conclusion|recap)$/i.test(part)
      );
    proseChunks.slice(0, Math.max(0, count - cards.length)).forEach((chunk: string, chunkIndex: number) => {
      add(`What important idea ${chunkIndex + 1} does ${cleanMarkdown(lesson?.title, 120) || topicName} teach about ${topicName}?`, chunk);
    });
  }

  (Array.isArray(topic.learning_objectives) ? topic.learning_objectives : []).forEach((objective, objectiveIndex) => {
    const answer = cleanMarkdown(objective, 1200);
    if (answer.length >= 25) add(`What is curriculum objective ${objectiveIndex + 1} for ${topicName}?`, answer);
  });

  return cards.slice(0, count);
};

Deno.serve(async request => { if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) }); if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405); let reserved = false; try { const auth = request.headers.get("Authorization"); if (!auth?.startsWith("Bearer ")) return json(request, { error: "Authentication required" }, 401); const url = Deno.env.get("SUPABASE_URL"); const anon = Deno.env.get("SUPABASE_ANON_KEY"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (!url || !anon || !service) return json(request, { error: "Flashcard service is not configured" }, 500); const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } }); const admin = createClient(url, service); const { data: { user } } = await userClient.auth.getUser(); if (!user) return json(request, { error: "Authentication required" }, 401); const body = await request.json().catch(() => null); const subjectId = text(body?.subjectId, 80); const topicId = text(body?.topicId, 80); const count = Number(body?.count || 20); if (!subjectId) return json(request, { error: "subjectId is required" }, 400); if (!Number.isInteger(count) || count < 5 || count > 30) return json(request, { error: "count must be an integer between 5 and 30" }, 400); const { data: subject, error: subjectError } = await admin.from("subjects").select("id,name").eq("id", subjectId).eq("is_active", true).maybeSingle(); if (subjectError || !subject) return json(request, { error: "Selected subject was not found" }, 404); let topicQuery = admin.from("topics").select("id,name,description,learning_objectives").eq("subject_id", subjectId).eq("is_active", true); if (topicId) topicQuery = topicQuery.eq("id", topicId); const { data: topics, error: topicError } = await topicQuery.limit(topicId ? 1 : 20); if (topicError || !topics?.length) return json(request, { error: "Selected curriculum topic was not found" }, 404); const topic = topics[0]; const objectives = Array.isArray(topic.learning_objectives) ? topic.learning_objectives : [];
    const { data: lessonRows, error: lessonError } = await admin
      .from("lessons")
      .select("title,written_content,key_points,learning_objectives")
      .eq("topic_id", topic.id)
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .limit(20);
    if (lessonError) throw new Error("Published lesson content could not be loaded");
    let cards = groundedFallbackCards(topic as Record<string, unknown>, lessonRows || [], count);
    let generationMode = "curriculum";
    if (cards.length < Math.min(5, count)) {
      const { data: reservedResult, error: reserveError } = await admin.rpc("consume_ai_request", { p_user_id: user.id, p_daily_limit: DAILY_AI_LIMIT });
      if (reserveError) throw new Error("AI usage service is temporarily unavailable");
      if (reservedResult !== true) return json(request, { error: "Daily AI usage limit reached. Please try again tomorrow." }, 429);
      reserved = true;
      const messages = [
        { role: "system", content: `You create high-quality study flashcards for THE GUIDE. Generate exactly ${count} cards for one Nigerian school curriculum topic. Cards must test actual knowledge, not generic study advice. Use only facts you can confidently support from standard school knowledge and the supplied topic/objectives. Return ONLY a JSON array of objects with front, back and difficulty (easy|medium|hard).` },
        { role: "user", content: `Subject: ${subject.name}\nTopic: ${topic.name}\nTopic description: ${text(topic.description, 2000)}\nCurriculum learning objectives: ${JSON.stringify(objectives).slice(0, 6000)}\nCreate concise factual flashcards now.` },
      ];
      try {
        cards = await generateCards(messages, count, topic.name);
        generationMode = "ai";
      } catch (providerError) {
        console.warn("AI flashcard rescue failed:", providerError instanceof Error ? providerError.message : String(providerError));
        cards = groundedFallbackCards(topic as Record<string, unknown>, lessonRows || [], count);
        if (cards.length < Math.min(5, count)) throw providerError;
      }
    }
    cards = cards.slice(0, count);
    const { data: saved, error: saveError } = await admin.from("flashcards").insert({ subject_id: subject.id, topic_id: topic.id, title: `${topic.name} — Flashcards`, description: `Curriculum-grounded flashcards for ${topic.name}.`, cards, mode: generationMode, is_public: false, created_by: user.id, usage_count: 0, view_count: 0 }).select("id").single(); if (saveError) throw new Error("Generated cards could not be saved"); return json(request, { flashcards: cards.map((card, i) => ({ ...card, id: `${saved.id}:${i}`, subjectId: subject.id, topicId: topic.id })), setId: saved.id }); } catch (error) { if (reserved) { try { const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const auth = request.headers.get("Authorization"); if (url && service && auth) { const anon = Deno.env.get("SUPABASE_ANON_KEY"); if (anon) { const user = (await createClient(url, anon, { global: { headers: { Authorization: auth } } }).auth.getUser()).data.user; if (user) await createClient(url, service).rpc("release_ai_request", { p_user_id: user.id }); } } } catch {} } const message = error instanceof Error ? error.message : "Flashcard generation failed"; console.error("Flashcard generation failed:", message); return json(request, { error: message }, /required|invalid|expected|duplicate|generic|grounded|short|not found/i.test(message) ? 400 : 500); } });
