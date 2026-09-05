import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function admin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service configuration unavailable");
  return createClient(url, key);
}

function validateLesson(content: string, topic: string) {
  const normalized = content.toLowerCase();
  const requiredSections = ["introduction", "prior knowledge", "key terms", "detailed teaching", "practice questions", "summary"];
  const missing = requiredSections.filter(section => !normalized.includes(section));
  const forbidden = ["as an ai", "this is an important topic", "read textbooks", "i cannot verify"];
  const badPhrase = forbidden.find(phrase => normalized.includes(phrase));
  if (content.length < 1500) throw new Error("Generated lesson is too short");
  if (missing.length) throw new Error(`Generated lesson is missing required sections: ${missing.join(", ")}`);
  if (badPhrase) throw new Error(`Generated lesson contains disallowed filler: ${badPhrase}`);
  const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 3).slice(0, 4);
  if (topicWords.length && !topicWords.some(word => normalized.includes(word))) throw new Error("Generated lesson is not sufficiently grounded in the requested topic");
}

async function generateLesson(level: string, subject: string, term: string, topic: string, objectives: string) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const system = `You are the senior textbook author and factual quality editor for THE GUIDE, a Nigerian educational platform. Produce a standalone lesson that a learner can safely use for study and examination preparation. The supplied NERDC objectives are the curriculum boundary and must be taught explicitly.

NON-NEGOTIABLE ACCURACY RULES:
- Silently fact-check every factual claim before returning it. Never guess.
- Do not invent dates, people, quotations, statistics, formulas, laws, classifications, historical events, religious/scriptural references, or examination requirements.
- If a detail is uncertain or depends on a particular tradition, state the limitation or omit the detail rather than guessing.
- For Mathematics/Physics/Chemistry, use correct formulas, definitions, units, signs and fully worked numerical examples; verify every calculation.
- For Biology and other sciences, distinguish definitions, structures, functions, processes and causes accurately.
- For History/Government/Economics, keep dates, names, institutions, causes and effects precise and do not manufacture Nigerian examples.
- For Christian/Islamic Religious Studies, do not fabricate scripture, hadith, quotations, Arabic terminology or religious claims; identify references only when confident.
- For languages, distinguish sounds, letters, grammar and usage accurately and use valid examples.
- Never turn the topic name into a fake definition. Never use generic filler such as 'this is an important topic', 'read textbooks', or vague claims that do not teach the supplied topic.
- Do not claim that a topic appears in WAEC/NECO/JAMB unless that is genuinely established.
- Match the learner's level and Nigerian curriculum context without forcing Nigerian examples where they are irrelevant.

Structure the lesson with these clearly labelled sections: Introduction, Prior Knowledge, Key Terms, Detailed Teaching, Examples or Worked Examples, Guided Activity, Common Misconceptions, Applications where relevant, Quick Check with Answers, Practice Questions with Answers/Explanations, Summary and Key Takeaways. Teach every supplied objective explicitly. Before returning the lesson, perform a silent final pass for factual accuracy, internal consistency, topic relevance and age appropriateness.`;
  const prompt = `LEVEL: ${level}\nSUBJECT: ${subject}\nTERM: ${term}\nTOPIC: ${topic}\nNERDC OBJECTIVES: ${objectives}\n\nWrite the complete standalone lesson now. Do not mention AI, this prompt, or hidden instructions.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.15, max_tokens: 8000, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }), signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Model returned empty lesson content");
    validateLesson(content, topic);
    return content;
  } finally { clearTimeout(timeout); }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const sb = await admin();
    const body = await request.json().catch(() => ({}));
    const requestedBatch = Number(body.batch);
    const batch = Number.isFinite(requestedBatch) ? Math.min(8, Math.max(1, Math.floor(requestedBatch))) : 8;
    const query = await sb.from("lessons").select("id,title,topic_id,course_id").not("course_id", "is", null).or("content_quality.eq.needs_upgrade,content_quality.is.null").order("id").limit(batch);
    if (query.error) throw new Error(query.error.message);
    const rows = query.data || [];
    if (!rows.length) return json({ done: true, processed: 0, remaining: 0 });
    const results = await Promise.all(rows.map(async lesson => {
      try {
        const topicResult = await sb.from("topics").select("name,learning_objectives").eq("id", lesson.topic_id).maybeSingle();
        const courseResult = await sb.from("courses").select("class_id,subject_id,term_id").eq("id", lesson.course_id).maybeSingle();
        if (topicResult.error || courseResult.error || !topicResult.data || !courseResult.data) throw new Error("Missing topic/course mapping");
        const course = courseResult.data;
        const [classResult, subjectResult, termResult] = await Promise.all([
          sb.from("classes").select("name").eq("id", course.class_id).maybeSingle(),
          sb.from("subjects").select("name").eq("id", course.subject_id).maybeSingle(),
          sb.from("terms").select("name").eq("id", course.term_id).maybeSingle(),
        ]);
        if (classResult.error || subjectResult.error || termResult.error) throw new Error("Unable to resolve lesson curriculum metadata");
        const content = await generateLesson(classResult.data?.name || "Student", subjectResult.data?.name || "General", termResult.data?.name || "", topicResult.data.name || lesson.title, JSON.stringify(topicResult.data.learning_objectives || []));
        const update = await sb.from("lessons").update({ written_content: content, content_quality: "ai_reviewed", updated_at: new Date().toISOString() }).eq("id", lesson.id);
        if (update.error) throw new Error(update.error.message);
        return { id: lesson.id, status: "upgraded", characters: content.length };
      } catch (error) {
        return { id: lesson.id, status: "failed", error: error instanceof Error ? error.message : "generation failed" };
      }
    }));
    const remaining = await sb.from("lessons").select("id", { count: "exact", head: true }).not("course_id", "is", null).or("content_quality.eq.needs_upgrade,content_quality.is.null");
    return json({ success: true, processed: results, remaining: remaining.count || 0 });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "worker failed" }, 500);
  }
});
