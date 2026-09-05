import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const MAX_BATCH = 10;
const MIN_CONTENT = 900;
const MAX_CONTENT = 50000;
const AI_MODEL = "gpt-4o-mini";

const normalise = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const words = (value: string) => normalise(value).split(" ").filter(Boolean);
const parseJson = (text: string): unknown => {
  try { return JSON.parse(text); } catch {
    const object = text.match(/\{[\s\S]*\}/);
    if (!object) return null;
    try { return JSON.parse(object[0]); } catch { return null; }
  }
};
const sha256 = async (text: string) => {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

function deterministicFlags(lesson: { title: string | null; written_content: string | null }, topic: { name: string | null; learning_objectives: unknown }) {
  const content = String(lesson.written_content || "").trim();
  const lower = normalise(content);
  const flags: string[] = [];
  if (content.length < MIN_CONTENT) flags.push("content_too_short");
  if (content.length > MAX_CONTENT) flags.push("content_too_long");
  if (/\bas an ai\b|\bthis ai\b|\blanguage model\b|\bchatgpt\b/i.test(content)) flags.push("ai_meta_language");
  if (/\bread textbooks\b|\battend classes\b|\bpractice past questions\b/i.test(content) && content.length < 2500) flags.push("generic_study_advice");
  if (/\bimportant topic\b|\bkey topic in the nigerian curriculum\b|\bis a significant event\/concept\b/i.test(content)) flags.push("generic_curriculum_filler");
  const topicWords = words(topic.name || lesson.title || "").filter((w) => w.length >= 5);
  if (topicWords.length >= 2 && !topicWords.some((w) => lower.includes(w))) flags.push("topic_not_obvious_in_content");
  const objectives = Array.isArray(topic.learning_objectives) ? topic.learning_objectives : [];
  if (objectives.length === 0) flags.push("missing_curriculum_objectives");
  return flags;
}

async function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase service configuration unavailable");
  return createClient(url, serviceKey);
}

async function authenticateAdmin(request: Request, sb: ReturnType<typeof createClient>) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Authentication required");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!anonKey || !url) throw new Error("Supabase auth configuration unavailable");
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Authentication required");
  const { data: roles, error: roleError } = await sb.from("user_roles").select("roles(name)").eq("user_id", user.id);
  if (roleError) throw new Error("Unable to verify administrator role");
  const names = (roles || []).map((row: any) => row.roles?.name).filter(Boolean);
  if (!names.includes("super_admin") && !names.includes("content_admin")) throw new Error("Administrator access required");
  return user.id;
}

async function auditWithAI(input: {
  level: string;
  subject: string;
  term: string;
  topic: string;
  description: string;
  objectives: unknown;
  title: string;
  content: string;
}) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const system = `You are the senior factual reviewer for THE GUIDE, a Nigerian educational platform. Audit one existing lesson against its exact curriculum context. Be conservative: a lesson passes only when it is factually sound, teaches the named topic, is structurally useful to the learner, and does not make unsupported curriculum/examination/religious/scientific claims.

Return ONLY valid JSON with this exact shape:
{"pass":true,"score":92,"issues":[],"correctedContent":null}

Rules:
- score is 0-100.
- issues is an array of concise objects: {"severity":"critical|major|minor","type":"factual|curriculum|structure|language|generic|other","description":"..."}.
- Mark pass=false for any material factual error, invented fact, wrong formula/calculation, fabricated quotation/scripture/hadith, misleading definition, major topic mismatch, or lesson that is too generic to teach the named topic.
- Minor grammar alone should not fail an otherwise accurate lesson.
- Do not fail merely because a lesson uses a different valid teaching sequence.
- Check every factual claim, dates, names, classifications, formulas, units, examples, religious references, and examination claims. If a claim cannot be justified from reliable general knowledge, prefer removing it rather than inventing a correction.
- The supplied NERDC objectives define the curriculum boundary. Do not invent objectives.
- For languages, distinguish sounds from letters and grammar from spelling. For mathematics/science, verify formulas and calculations. For history/government/economics, verify names, dates, institutions and cause/effect. For Christian/Islamic studies, do not fabricate quotations or references.
- If pass=false, correctedContent MUST be a complete replacement lesson in markdown, not a patch or explanation. Preserve good material, fix the identified issues, and ensure the replacement is at least 1200 characters. If pass=true, correctedContent MUST be null.`;
  const user = `LEVEL: ${input.level}\nSUBJECT: ${input.subject}\nTERM: ${input.term}\nTOPIC: ${input.topic}\nDESCRIPTION: ${input.description}\nNERDC OBJECTIVES: ${JSON.stringify(input.objectives)}\nLESSON TITLE: ${input.title}\n\nEXISTING LESSON:\n${input.content}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, temperature: 0.1, max_tokens: 7000, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI audit request failed: ${response.status}`);
    const data = await response.json();
    const parsed = parseJson(String(data?.choices?.[0]?.message?.content || ""));
    if (!parsed || typeof parsed !== "object") throw new Error("AI returned invalid audit JSON");
    return { result: parsed as Record<string, unknown>, model: String(data?.model || AI_MODEL) };
  } finally { clearTimeout(timeout); }
}

function validateAudit(value: Record<string, unknown>) {
  if (typeof value.pass !== "boolean") throw new Error("Audit response missing pass");
  const score = Number(value.score);
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Audit response has invalid score");
  if (!Array.isArray(value.issues)) throw new Error("Audit response missing issues");
  const issues = value.issues.slice(0, 20).map((item) => {
    const issue = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      severity: ["critical", "major", "minor"].includes(String(issue.severity)) ? String(issue.severity) : "minor",
      type: String(issue.type || "other").slice(0, 40),
      description: String(issue.description || "").trim().slice(0, 1000),
    };
  }).filter((issue) => issue.description);
  const correctedContent = value.correctedContent == null ? null : String(value.correctedContent).trim();
  return { pass: value.pass, score, issues, correctedContent };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const sb = await getAdminClient();
    await authenticateAdmin(request, sb);
    const body = await request.json().catch(() => ({}));
    const batch = Math.min(MAX_BATCH, Math.max(1, Number(body.batch || 5)));
    const mode = body.mode === "audit" ? "audit" : "audit_and_repair";

    const { data: claim, error: claimError } = await sb.rpc("claim_lesson_quality_audits", { p_limit: batch });
    if (claimError) throw new Error(claimError.message);
    const ids = (claim || []).map((row: { lesson_id: string }) => row.lesson_id);
    if (!ids.length) {
      const { count } = await sb.from("lesson_quality_audits").select("id", { count: "exact", head: true }).in("status", ["passed", "repaired"]);
      const { count: total } = await sb.from("lessons").select("id", { count: "exact", head: true }).not("course_id", "is", null).not("topic_id", "is", null).not("written_content", "is", null);
      return json({ success: true, processed: 0, message: "No unprocessed lessons available", auditedOrRepaired: count || 0, eligibleLessons: total || 0 });
    }

    const { data: lessons, error: lessonError } = await sb.from("lessons").select("id,title,written_content,topic_id,course_id").in("id", ids);
    if (lessonError) throw new Error(lessonError.message);
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
        const flags = deterministicFlags(lesson, topicResult.data);
        const originalHash = await sha256(content);
        const audit = await auditWithAI({
          level: classResult.data?.code || classResult.data?.name || "Student",
          subject: subjectResult.data?.name || "General Studies",
          term: termResult.data?.name || "",
          topic: topicResult.data.name || lesson.title || "",
          description: topicResult.data.description || "",
          objectives: topicResult.data.learning_objectives || [],
          title: lesson.title || topicResult.data.name || "Lesson",
          content,
        });
        const checked = validateAudit(audit.result);
        const failed = !checked.pass || flags.length > 0;
        let finalStatus = failed ? "failed" : "passed";
        let corrected = checked.correctedContent;

        if (failed && mode === "audit_and_repair" && !corrected) {
          throw new Error("Lesson failed audit but AI did not provide correctedContent");
        }
        if (failed && mode === "audit_and_repair" && corrected) {
          const correctedFlags = deterministicFlags({ title: lesson.title, written_content: corrected }, topicResult.data);
          if (corrected.length < MIN_CONTENT || corrected.length > MAX_CONTENT || correctedFlags.includes("ai_meta_language") || correctedFlags.includes("generic_curriculum_filler")) {
            throw new Error(`Corrected lesson failed structural validation: ${correctedFlags.join(",") || "invalid length"}`);
          }
          const update = await sb.from("lessons").update({ written_content: corrected, content_quality: "ai_reviewed", teaching_version: (lesson as any).teaching_version ? Number((lesson as any).teaching_version) + 1 : 1, updated_at: new Date().toISOString() }).eq("id", id);
          if (update.error) throw new Error(update.error.message);
          finalStatus = "repaired";
        }

        const { error: saveError } = await sb.from("lesson_quality_audits").update({
          status: finalStatus,
          score: checked.score,
          issues: checked.issues,
          deterministic_flags: flags,
          original_content_hash: originalHash,
          original_content: finalStatus === "repaired" ? content : null,
          corrected_content: finalStatus === "repaired" ? corrected : null,
          model: audit.model,
          audited_at: new Date().toISOString(),
          repaired_at: finalStatus === "repaired" ? new Date().toISOString() : null,
          error_message: null,
        }).eq("lesson_id", id);
        if (saveError) throw new Error(saveError.message);
        results.push({ id, status: finalStatus, score: checked.score, issues: checked.issues.length, deterministicFlags: flags });
      } catch (error) {
        const message = error instanceof Error ? error.message : "audit failed";
        await sb.from("lesson_quality_audits").update({ status: "repair_failed", error_message: message, audited_at: new Date().toISOString() }).eq("lesson_id", id);
        results.push({ id, status: "repair_failed", error: message });
      }
    }

    const { count: remaining } = await sb.from("lessons").select("id", { count: "exact", head: true }).not("course_id", "is", null).not("topic_id", "is", null).not("written_content", "is", null);
    const { data: summaryRows } = await sb.from("lesson_quality_audits").select("status");
    const summary = (summaryRows || []).reduce((acc: Record<string, number>, row: { status: string }) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
    return json({ success: true, mode, processed: results.length, results, auditSummary: summary, eligibleLessons: remaining || 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "lesson quality audit failed";
    const status = /Authentication required|Administrator access required/.test(message) ? 401 : 500;
    console.error(message);
    return json({ error: message }, status);
  }
});
