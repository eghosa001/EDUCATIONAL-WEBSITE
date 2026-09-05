import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_AI_LIMIT = 100;
const allowedOrigins = (Deno.env.get("AI_ALLOWED_ORIGINS") || "").split(",").map(v => v.trim()).filter(Boolean);
const cors = (request: Request) => {
  const origin = request.headers.get("Origin");
  const allowed = origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin));
  return { "Access-Control-Allow-Origin": allowed ? origin : (allowedOrigins.length ? allowedOrigins[0] : "*"), "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
};
const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(request), "Content-Type": "application/json" } });
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);
const parseJson = (value: string): unknown => { try { return JSON.parse(value); } catch { const match = value.match(/\[[\s\S]*\]/); if (!match) return null; try { return JSON.parse(match[0]); } catch { return null; } } };
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const validateCards = (value: unknown, count: number, topic: string) => {
  if (!Array.isArray(value) || value.length !== count) throw new Error(`AI returned ${Array.isArray(value) ? value.length : 0} cards; expected ${count}`);
  const seen = new Set<string>();
  const forbidden = ["key topic in the nigerian curriculum", "read textbooks, attend classes, practice past questions", "builds foundational knowledge for waec", "contributes to personal development", "is important because it builds"];
  return value.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Invalid flashcard ${index + 1}`);
    const card = item as Record<string, unknown>;
    const front = text(card.front, 1200); const back = text(card.back, 2500); const difficulty = text(card.difficulty, 20).toLowerCase();
    if (front.length < 8 || back.length < 15) throw new Error(`Flashcard ${index + 1} is too short`);
    const key = normalise(front); if (seen.has(key)) throw new Error(`Duplicate flashcard ${index + 1}`); seen.add(key);
    const combined = normalise(`${front} ${back}`); if (forbidden.some(p => combined.includes(p))) throw new Error(`Flashcard ${index + 1} contains generic filler`);
    if (!combined.includes(normalise(topic))) throw new Error(`Flashcard ${index + 1} is not grounded in the selected topic`);
    if (!["easy", "medium", "hard"].includes(difficulty)) throw new Error(`Flashcard ${index + 1} has invalid difficulty`);
    return { front, back, difficulty };
  });
};
async function openAI(messages: Array<{ role: string; content: string }>, maxTokens: number) {
  const key = Deno.env.get("OPENAI_API_KEY"); if (!key) throw new Error("AI provider is not configured");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 45_000);
  try { const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.25, max_tokens: maxTokens, messages }), signal: controller.signal }); if (!response.ok) throw new Error("AI provider request failed"); return await response.json(); } finally { clearTimeout(timeout); }
}
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  let reserved = false;
  try {
    const auth = request.headers.get("Authorization"); if (!auth?.startsWith("Bearer ")) return json(request, { error: "Authentication required" }, 401);
    const url = Deno.env.get("SUPABASE_URL"); const anon = Deno.env.get("SUPABASE_ANON_KEY"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json(request, { error: "Flashcard service is not configured" }, 500);
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } }); const admin = createClient(url, service);
    const { data: { user } } = await userClient.auth.getUser(); if (!user) return json(request, { error: "Authentication required" }, 401);
    const body = await request.json().catch(() => null); const subjectId = text(body?.subjectId, 80); const topicId = text(body?.topicId, 80); const count = Number(body?.count || 20);
    if (!subjectId) return json(request, { error: "subjectId is required" }, 400); if (!Number.isInteger(count) || count < 5 || count > 30) return json(request, { error: "count must be an integer between 5 and 30" }, 400);
    const { data: reservedResult, error: reserveError } = await admin.rpc("consume_ai_request", { p_user_id: user.id, p_daily_limit: DAILY_AI_LIMIT });
    if (reserveError) throw new Error("AI usage service is temporarily unavailable");
    if (reservedResult !== true) return json(request, { error: "Daily AI usage limit reached. Please try again tomorrow." }, 429);
    reserved = true;
    const { data: subject, error: subjectError } = await admin.from("subjects").select("id,name").eq("id", subjectId).eq("is_active", true).maybeSingle(); if (subjectError || !subject) return json(request, { error: "Selected subject was not found" }, 404);
    let topicQuery = admin.from("topics").select("id,name,description,learning_objectives").eq("subject_id", subjectId).eq("is_active", true); if (topicId) topicQuery = topicQuery.eq("id", topicId);
    const { data: topics, error: topicError } = await topicQuery.limit(topicId ? 1 : 20); if (topicError || !topics?.length) return json(request, { error: "Selected curriculum topic was not found" }, 404);
    const topic = topics[0]; const objectives = Array.isArray(topic.learning_objectives) ? topic.learning_objectives : [];
    const response = await openAI([
      { role: "system", content: `You create high-quality study flashcards for THE GUIDE. Generate exactly ${count} cards for one Nigerian school curriculum topic. Cards must test actual knowledge, not generic study advice. Use only facts you can confidently support from standard school knowledge and the supplied topic/objectives. Do not invent dates, quotations, formulas, statistics, people, classifications, or religious/scriptural claims. If a fact is uncertain, do not include it. Each card must have a focused question/prompt on the front and a precise, self-contained answer on the back. Vary the card types: definitions, distinctions, processes, causes/effects, examples, applications, formulas/calculations where genuinely relevant. Match the learner's level. Return ONLY a JSON array of objects with front, back and difficulty (easy|medium|hard). Never use filler such as 'this is important', 'read textbooks', 'for WAEC/NECO/JAMB', or generic descriptions.` },
      { role: "user", content: `Subject: ${subject.name}\nTopic: ${topic.name}\nTopic description: ${text(topic.description, 2000)}\nCurriculum learning objectives: ${JSON.stringify(objectives).slice(0, 6000)}\n\nCreate the flashcards now. Every card must teach or test a specific fact, concept, relationship, procedure, example, or calculation directly connected to this topic.` },
    ], Math.min(4500, count * 150));
    const cards = validateCards(parseJson(response.choices?.[0]?.message?.content || ""), count, topic.name);
    const { data: saved, error: saveError } = await admin.from("flashcards").insert({ subject_id: subject.id, topic_id: topic.id, title: `${topic.name} — AI Flashcards`, description: `Curriculum-grounded flashcards for ${topic.name}.`, cards, mode: "ai", is_public: false, created_by: user.id, usage_count: 0, view_count: 0 }).select("id").single();
    if (saveError) throw new Error("Generated cards could not be saved");
    return json(request, { flashcards: cards.map((card, i) => ({ ...card, id: `${saved.id}:${i}`, subjectId: subject.id, topicId: topic.id })), setId: saved.id });
  } catch (error) {
    if (reserved) { try { const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const auth = request.headers.get("Authorization"); if (url && service && auth) { const client = createClient(url, service); const { data: { user } } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY") || "", { global: { headers: { Authorization: auth } } }).auth.getUser(); if (user) await client.rpc("release_ai_request", { p_user_id: user.id }); } } catch {} }
    const message = error instanceof Error ? error.message : "Flashcard generation failed"; console.error("Flashcard generation failed:", message); return json(request, { error: message }, /required|invalid|expected|duplicate|generic|grounded|short|not found/i.test(message) ? 400 : 500);
  }
});
