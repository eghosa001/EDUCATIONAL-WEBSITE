import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MAX_BATCH = 10;
const MIN_CONTENT = 900;
const MAX_CONTENT = 50000;
const MODEL = "gpt-4o-mini";

const normalise = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const topicWords = (value: string) => normalise(value).split(" ").filter((word) => word.length >= 5);
const parseJson = (text: string): unknown => {
  try { return JSON.parse(text); } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
};
const sha256 = async (text: string) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

function deterministicFlags(content: string, title: string, topic: { name: string | null; learning_objectives: unknown }) {
  const text = String(content || "").trim();
  const lower = normalise(text);
  const flags: string[] = [];
  if (text.length < MIN_CONTENT) flags.push("content_too_short");
  if (text.length > MAX_CONTENT) flags.push("content_too_long");
  if (/\bas an ai\b|\bthis ai\b|\blanguage model\b|\bchatgpt\b/i.test(text)) flags.push("ai_meta_language");
  if (/\bread textbooks\b|\battend classes\b|\bpractice past questions\b/i.test(text) && text.length < 2500) flags.push("generic_study_advice");
  if (/\bimportant topic\b|\bkey topic in the nigerian curriculum\b|\bis a significant event\/concept\b/i.test(text)) flags.push("generic_curriculum_filler");
  const requiredTopicWords = topicWords(topic.name || title);
  if (requiredTopicWords.length >= 2 && !requiredTopicWords.some((word) => lower.includes(word))) flags.push("topic_not_obvious_in_content");
  if (!Array.isArray(topic.learning_objectives) || topic.learning_objectives.length === 0) flags.push("missing_curriculum_objectives");
  return flags;
}

async function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service configuration unavailable");
  return createClient(url, key);
}

async function requireAdmin(request: Request, sb: ReturnType<typeof createClient>) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication required");
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Supabase auth configuration unavailable");
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Authentication required");
  const { data, error: roleError } = await sb.from("user_roles").select("roles(name)").eq("user_id", user.id);
  if (roleError) throw new Error("Unable to verify administrator role");
  const roles = (data || []).map((row: any) => row.roles?.name).filter(Boolean);
  if (!roles.includes("super_admin") && !roles.includes("content_admin")) throw new Error("Administrator access required");
}

async function review(input: { level: string; subject: string; term: string; topic: string; description: string; objectives: unknown; title: string; content: string; flags: string[] }) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const system = `You are the senior factual quality editor for THE GUIDE, a Nigerian educational platform. Audit an existing lesson against its exact curriculum context.

Return ONLY valid JSON:
{"pass":true,"score":92,"issues":[],"correctedContent":null}

A lesson passes only if it is factually sound, teaches the named topic, is appropriate for the learner, and is structurally useful. Minor grammar alone does not fail it.

When pass=false, correctedContent MUST be a complete replacement lesson in markdown of at least 1200 characters. Preserve accurate material and fix the actual problems. Do not return a patch, commentary, or apology. When pass=true, correctedContent MUST be null.

Check definitions, factual claims, dates, names, classifications, formulas, units, calculations, examples, language terminology, historical/government/economic claims, and Christian/Islamic references. Never invent scripture, hadith, quotations, dates, people, statistics, laws, exam requirements, or curriculum claims. The supplied NERDC objectives are the curriculum boundary. Remove uncertain claims rather than guessing. Do not turn the topic name into a fake definition or fill space with generic study advice.`;
  const user = `LEVEL: ${input.level}\nSUBJECT: ${input.subject}\nTERM: ${input.term}\nTOPIC: ${input.topic}\nDESCRIPTION: ${input.description}\nNERDC OBJECTIVES: ${JSON.stringify(input.objectives)}\nLESSON TITLE: ${input.title}\nDETERMINISTIC FLAGS: ${JSON.stringify(input.flags)}\n\nEXISTING LESSON:\n${input.content}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.1, max_tokens: 7000, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI audit request failed: ${response.status}`);
    const data = await response.json();
    const parsed = parseJson(String(data?.choices?.[0]?.message?.content || ""));
    if (!parsed || typeof parsed !== "object") throw new Error("AI returned invalid audit JSON");
    return { audit: parsed as Record<string, unknown>, model: String(data?.model || MODEL) };
  } finally { clearTimeout(timeout); }
}

function validate(value: Record<string, unknown>) {
  if (typeof value.pass !== "boolean") throw new Error("Audit response missing pass");
  const score = Number(value.score);
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Audit response has invalid score");
  if (!Array.isArray(value.issues)) throw new Error("Audit response missing issues");
  const issues = value.issues.slice(0, 20).map((item) => {
    const issue = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { severity: ["critical", "major", "minor"].includes(String(issue.severity)) ? String(issue.severity) : "minor", type: String(issue.type || "other").slice(0, 40), description: String(issue.description || "").trim().slice(0, 1000) };
  }).filter((issue) => issue.description);
  const correctedContent = value.correctedContent == null ? null : String(value.correctedContent).trim();
  return { pass: value.pass, score, issues, correctedContent };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const sb = await adminClient();
    await requireAdmin(request, sb);
    const body = await request.json().catch(() => ({}));
    const batch = Math.min(MAX_BATCH, Math.max(1, Number(body.batch || 5)));
    const mode = body.mode === "audit" ? "audit" : body.mode === "repair_failed" ? "repair_failed" : "audit_and_repair";

    const { data: claim, error: claimError } = await sb.rpc("claim_lesson_quality_audits", { p_limit: batch, p_include_failed: mode === "repair_failed" });
    if (claimError) throw new Error(claimError.message);
    const ids = (claim || []).map((row: { lesson_id: string }) => row.lesson_id);
    if (!ids.length) return json({ success: true, processed: 0, message: "No eligible lessons remain in this queue." });

    const { data: lessons, error: lessonsError } = await sb.from("lessons").select("id,title,written_content,topic_id,course_id,teaching_version").in("id", ids);
    if (lessonsError) throw new Error(lessonsError.message);
    const byId = new Map((lessons || []).map((lesson) => [lesson.id, lesson]));
    const results: unknown[] = [];

    for (const id of ids) {
      const lesson = byId.get(id);
      if (!lesson) continue;
      try {
        const [topicResult, courseResult] = await Promise.all([
          sb.from("topics").select("name,description,learning_objectives").eq("id", lesson.topic_id).maybeSingle(),
          sb.from("courses").select("class_id,subject_id,term_id").eq("id", lesson.course_id).maybeSingle(),
        ]);
        if (topicResult.error || courseResult.error || !topicResult.data || !courseResult.data) throw new Error("Missing curriculum mapping");
        const course = courseResult.data;
        const [classResult, subjectResult, termResult] = await Promise.all([
          sb.from("classes").select("name,code").eq("id", course.class_id).maybeSingle(),
          sb.from("subjects").select("name").eq("id", course.subject_id).maybeSingle(),
          sb.from("terms").select("name").eq("id", course.term_id).maybeSingle(),
        ]);
        const content = String(lesson.written_content || "").trim();
        const flags = deterministicFlags(content, lesson.title || "", topicResult.data);
        const originalHash = await sha256(content);
        const response = await review({
          level: classResult.data?.code || classResult.data?.name || "Student",
          subject: subjectResult.data?.name || "General Studies",
          term: termResult.data?.name || "",
          topic: topicResult.data.name || lesson.title || "",
          description: topicResult.data.description || "",
          objectives: topicResult.data.learning_objectives || [],
          title: lesson.title || topicResult.data.name || "Lesson",
          content,
          flags,
        });
        const checked = validate(response.audit);
        const failed = !checked.pass || flags.length > 0;
        if (failed && mode === "audit_and_repair" && !checked.correctedContent) throw new Error("Failed audit without a corrected lesson");
        if (failed && mode === "repair_failed" && !checked.correctedContent) throw new Error("Failed audit without a corrected lesson");

        let status = failed ? "failed" : "passed";
        if (failed && checked.correctedContent && (mode === "audit_and_repair" || mode === "repair_failed")) {
          const correctedFlags = deterministicFlags(checked.correctedContent, lesson.title || "", topicResult.data);
          if (checked.correctedContent.length < MIN_CONTENT || checked.correctedContent.length > MAX_CONTENT || correctedFlags.includes("ai_meta_language") || correctedFlags.includes("generic_curriculum_filler") || correctedFlags.includes("content_too_short")) throw new Error(`Corrected lesson failed deterministic validation: ${correctedFlags.join(",") || "invalid length"}`);
          const { error: updateError } = await sb.from("lessons").update({ written_content: checked.correctedContent, content_quality: "ai_reviewed", teaching_version: Number(lesson.teaching_version || 0) + 1, updated_at: new Date().toISOString() }).eq("id", id);
          if (updateError) throw new Error(updateError.message);
          status = "repaired";
        }

        const { error: saveError } = await sb.from("lesson_quality_audits").update({
          status,
          score: checked.score,
          issues: checked.issues,
          deterministic_flags: flags,
          original_content_hash: originalHash,
          original_content: status === "repaired" ? content : null,
          corrected_content: status === "repaired" ? checked.correctedContent : null,
          model: response.model,
          audited_at: new Date().toISOString(),
          repaired_at: status === "repaired" ? new Date().toISOString() : null,
          error_message: null,
        }).eq("lesson_id", id);
        if (saveError) throw new Error(saveError.message);
        results.push({ id, status, score: checked.score, issueCount: checked.issues.length, deterministicFlags: flags });
      } catch (error) {
        const message = error instanceof Error ? error.message : "audit failed";
        await sb.from("lesson_quality_audits").update({ status: "repair_failed", error_message: message, audited_at: new Date().toISOString() }).eq("lesson_id", id);
        results.push({ id, status: "repair_failed", error: message });
      }
    }

    const { data: summaryRows } = await sb.from("lesson_quality_audits").select("status");
    const summary = (summaryRows || []).reduce((acc: Record<string, number>, row: { status: string }) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
    const { count: eligible } = await sb.from("lessons").select("id", { count: "exact", head: true }).not("course_id", "is", null).not("topic_id", "is", null).gt("written_content", "");
    return json({ success: true, mode, processed: results.length, results, auditSummary: summary, eligibleLessons: eligible || 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "lesson quality audit failed";
    const status = message === "Administrator access required" ? 403 : /Authentication required/.test(message) ? 401 : 500;
    console.error(message);
    return json({ error: message }, status);
  }
});
