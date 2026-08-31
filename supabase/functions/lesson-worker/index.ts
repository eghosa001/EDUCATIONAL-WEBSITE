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

async function generateLesson(level: string, subject: string, term: string, topic: string, objectives: string) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");

  const system = `You are the senior textbook author for THE GUIDE, a Nigerian educational platform. The non-negotiable goal is that a student can learn the supplied topic from THE GUIDE without needing a textbook. Use the supplied NERDC objectives as the curriculum boundary. Never merely repeat objectives. Teach every concept explicitly and accurately at the learner's level. Use concrete, topic-specific examples and no generic filler. Adapt to the subject: Mathematics/Physics/Chemistry require explained formulas, units and step-by-step worked calculations where relevant; sciences require mechanisms and processes; languages require rules, examples and exercises; humanities require factual context, causes/effects/comparisons where relevant; primary learners require simple concrete language. Include introduction, prior knowledge, key terms, detailed teaching of every objective, examples/worked examples, guided activity, misconceptions, applications, quick check with answers, practice questions with answers/explanations, summary and key takeaways. Never tell the learner to research the topic instead of teaching it.`;
  const prompt = `LEVEL: ${level}\nSUBJECT: ${subject}\nTERM: ${term}\nTOPIC: ${topic}\nNERDC OBJECTIVES: ${objectives}\n\nWrite the complete standalone lesson now. Make it substantive enough for independent study and examination preparation. Do not mention AI or this instruction.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.25, max_tokens: 8000, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content || content.length < 1500) throw new Error("Generated lesson failed quality minimum");
  return content;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const sb = await admin();
    const body = await request.json().catch(() => ({}));
    const batch = Math.min(8, Math.max(1, Number(body.batch || 8)));

    // This function is intended to be called only by a trusted server-side scheduler.
    // Supabase JWT verification remains enabled at the function gateway.
    const query = await sb.from("lessons")
      .select("id,title,topic_id,course_id")
      .not("course_id", "is", null)
      .or("content_quality.eq.needs_upgrade,content_quality.is.null")
      .order("id")
      .limit(batch);
    if (query.error) throw new Error(query.error.message);
    const rows = query.data || [];
    if (!rows.length) return json({ done: true, processed: 0, remaining: 0 });

    const results = await Promise.all(rows.map(async (lesson) => {
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
        const content = await generateLesson(classResult.data?.name || "Student", subjectResult.data?.name || "General", termResult.data?.name || "", topicResult.data.name || lesson.title, JSON.stringify(topicResult.data.learning_objectives || []));
        const update = await sb.from("lessons").update({ written_content: content, content_quality: "substantive", updated_at: new Date().toISOString() }).eq("id", lesson.id);
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
