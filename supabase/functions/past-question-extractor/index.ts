import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUDIENCE = "the-guide-question-extractor";
const REPOSITORY = "eghosa001/EDUCATIONAL-WEBSITE";
const MAIN_REF = "refs/heads/main";
const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "no-store" },
});

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
};
const parsePart = (value: string) => JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));

async function verifyGitHubOidc(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid GitHub OIDC token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parsePart(encodedHeader);
  const payload = parsePart(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported GitHub OIDC token");
  if (payload.iss !== GITHUB_ISSUER) throw new Error("Invalid GitHub OIDC issuer");
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(AUDIENCE)) throw new Error("Invalid GitHub OIDC audience");
  if (payload.repository !== REPOSITORY) throw new Error("GitHub OIDC repository is not authorized");
  if (payload.ref !== MAIN_REF) throw new Error("GitHub OIDC ref is not authorized");
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || Number(payload.exp) <= now) throw new Error("GitHub OIDC token has expired");
  const jwksResponse = await fetch(`${GITHUB_ISSUER}/.well-known/jwks`);
  if (!jwksResponse.ok) throw new Error("Unable to load GitHub OIDC keys");
  const jwks = await jwksResponse.json();
  const jwk = (jwks.keys || []).find((candidate: any) => candidate.kid === header.kid);
  if (!jwk) throw new Error("GitHub OIDC signing key not found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!valid) throw new Error("Invalid GitHub OIDC signature");
}

const norm = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const cleanText = (value: unknown, max = 2200) => String(value ?? "")
  .replace(/https?:\/\/\S+/gi, " ")
  .replace(/www\.[^\s]+/gi, " ")
  .replace(/PDF to Word/gi, " ")
  .replace(/Uploaded online by[^\n]*/gi, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, max);

const artifactPattern = /(WAEC.{0,45}Past|Uploaded\s+on|UNTIL\s+YOU\s+ARE\s+TOLD|PRINT\s+IN\s+BLOCK\s+LETTERS|INSTRUCTIONS\s+TO\s+CANDIDATES)/i;
const cleanOptionText = (value: unknown) => cleanText(value, 900)
  .replace(/\s+(w\.m|t\.co)$/i, "")
  .replace(/\s+(Turn\s+over|UNTIL\s+YOU\s+ARE\s+TOLD|Uploaded\s+on|[0-9]{0,5}[\s\W]*WAEC.{0,45}Past).*$/i, "")
  .trim();

const isLikelyQuestionFile = (file: any) => {
  const name = String(file.file_name || "").toLowerCase();
  if (!["waec", "jamb"].includes(String(file.board || "").toLowerCase())) return false;
  if (/syllabus|selected[- _]?text|nerdc|scheme|2021[- _]?2025/.test(name)) return false;
  if (String(file.board).toLowerCase() === "jamb") return /past[- _]?questions?|questions?[- _]?and[- _]?answers?/.test(name);
  return Boolean(file.year) && !/allproblems|document[_-]?compress/.test(name);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "GitHub OIDC token required" }, 401);
    await verifyGitHubOidc(authorization.slice(7));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Service configuration unavailable" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "manifest") {
      const { data, error } = await admin.from("past_question_files")
        .select("id,board,subject,year,file_name,public_url,is_processed,questions_extracted,metadata")
        .not("public_url", "is", null)
        .in("board", ["waec", "jamb"])
        .order("year", { ascending: true, nullsFirst: false });
      if (error) throw error;
      const files = (data || []).filter((file: any) => {
        if (!isLikelyQuestionFile(file)) return false;
        const status = String(file.metadata?.status || "");
        return !file.is_processed || ["needs_ocr_or_manual_parse", "needs_batch_processing", "ocr_failed"].includes(status);
      });
      return json({ files, count: files.length });
    }

    if (action === "ingest") {
      const fileId = String(body?.fileId || "");
      if (!/^[0-9a-f-]{36}$/i.test(fileId)) return json({ error: "Valid fileId required" }, 400);
      const questions = Array.isArray(body?.questions) ? body.questions.slice(0, 2000) : [];
      const { data: file, error: fileError } = await admin.from("past_question_files")
        .select("id,board,subject,year,file_name,metadata").eq("id", fileId).maybeSingle();
      if (fileError || !file) return json({ error: "Source file not found" }, 404);
      if (!isLikelyQuestionFile(file)) return json({ error: "Source is not classified as a past-question paper" }, 400);

      const { data: subjects, error: subjectError } = await admin.from("subjects").select("id,name").eq("is_active", true);
      if (subjectError) throw subjectError;
      const wanted = norm(file.subject);
      let subjectId: string | null = null;
      for (const subject of subjects || []) {
        const candidate = norm(subject.name);
        if (candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate)) { subjectId = subject.id; break; }
      }

      const source = `storage:${file.id}`;
      const { error: deleteError } = await admin.from("past_questions").delete().eq("source", source);
      if (deleteError) throw deleteError;

      const rows: any[] = [];
      let answered = 0;
      let active = 0;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i] || {};
        const questionText = cleanText(q.questionText || q.question_text);
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const seen = new Set<string>();
        const options = rawOptions.map((option: any, index: number) => {
          const id = String(option?.id || String.fromCharCode(65 + index)).toUpperCase().replace(/[^A-E]/g, "").slice(0, 1);
          const text = cleanOptionText(option?.text ?? option?.value ?? "");
          return { id, text };
        }).filter((option: any) => option.id && option.text && !seen.has(option.id) && seen.add(option.id)).slice(0, 5);
        let correctAnswer = String(q.correctAnswer || q.correct_answer || "").toUpperCase().trim();
        if (!options.some((option: any) => option.id === correctAnswer)) correctAnswer = "";
        if (correctAnswer) answered++;
        const looksLikeReference = /(topics\/contents\/notes objectives|candidates should be able to|learning objectives|definition of .* salient features|assessment would include)/i.test(questionText);
        const isMcq = options.length > 0;
        const optionIds = options.map((option: any) => option.id);
        const coreOptionsOrdered = optionIds.slice(0, 4).join("") === "ABCD";
        const hasExtractionArtifacts = artifactPattern.test(questionText) ||
          options.some((option: any) => artifactPattern.test(option.text) || option.text.length > 500);
        const isActive = questionText.length >= 10 && questionText.length <= 1800 && !looksLikeReference && !hasExtractionArtifacts &&
          ((!isMcq && /\?|\b(state|explain|describe|calculate|find|determine|list|define|write|draw|discuss|give|outline|compare|mention)\b/i.test(questionText)) ||
           (isMcq && options.length >= 4 && coreOptionsOrdered && questionText.length <= 1000));
        if (isActive) active++;
        rows.push({
          board: String(file.board || "").toLowerCase(),
          year: file.year || null,
          subject_id: subjectId,
          topic_id: null,
          question_type: isMcq ? "mcq" : "essay",
          question_text: questionText || "Unparsed source question",
          options,
          correct_answer: correctAnswer || null,
          explanation: null,
          difficulty: "medium",
          marks: isMcq ? 1 : 10,
          source,
          tags: [String(file.board || "").toLowerCase(), file.subject, file.year, file.file_name, "storage-extracted"].filter(Boolean),
          is_active: isActive,
        });
      }

      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await admin.from("past_questions").insert(rows.slice(i, i + 100));
        if (error) throw error;
      }

      const nextMetadata = {
        ...(file.metadata || {}),
        status: "ocr_extracted",
        processed_at: new Date().toISOString(),
        extraction_method: String(body?.method || "ocr"),
        extracted_total: rows.length,
        active_questions: active,
        answered_questions: answered,
      };
      const { error: updateError } = await admin.from("past_question_files").update({
        is_processed: true,
        questions_extracted: active,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      }).eq("id", file.id);
      if (updateError) throw updateError;
      return json({ success: true, inserted: rows.length, active, answered });
    }

    if (action === "fail") {
      const fileId = String(body?.fileId || "");
      const message = cleanText(body?.message || "OCR extraction failed", 500);
      const { data: file } = await admin.from("past_question_files").select("metadata").eq("id", fileId).maybeSingle();
      await admin.from("past_question_files").update({
        is_processed: true,
        metadata: { ...(file?.metadata || {}), status: "ocr_failed", failed_at: new Date().toISOString(), review_reason: message },
        updated_at: new Date().toISOString(),
      }).eq("id", fileId);
      return json({ success: true });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error("question extractor failed", error instanceof Error ? error.message : String(error));
    return json({ error: error instanceof Error ? error.message : "Question extractor failed" }, 403);
  }
});