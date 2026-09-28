import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUDIENCE = "the-guide-production-qa";
const REPOSITORY = "eghosa001/EDUCATIONAL-WEBSITE";
const MAIN_REF = "refs/heads/main";
const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
};

const parsePart = (value: string) => JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));

const verifyGitHubOidc = async (token: string) => {
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
  if (payload.nbf && Number(payload.nbf) > now + 30) throw new Error("GitHub OIDC token is not active");

  const jwksResponse = await fetch(`${GITHUB_ISSUER}/.well-known/jwks`);
  if (!jwksResponse.ok) throw new Error("Unable to load GitHub OIDC keys");
  const jwks = await jwksResponse.json();
  const jwk = (jwks.keys || []).find((candidate: any) => candidate.kid === header.kid);
  if (!jwk) throw new Error("GitHub OIDC signing key not found");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!valid) throw new Error("Invalid GitHub OIDC signature");
  return payload;
};

const cleanupUser = async (admin: any, userId: string) => {
  if (!userId) return;
  await admin.from("flashcards").delete().eq("created_by", userId);
  await admin.from("profiles").delete().eq("id", userId);
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("users").delete().eq("id", userId);
  await admin.auth.admin.deleteUser(userId);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "GitHub OIDC token required" }, 401);
    await verifyGitHubOidc(authorization.slice("Bearer ".length));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "QA user service is not configured" }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "create") {
      const stamp = Date.now();
      const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
      const email = `qa-production-${stamp}-${suffix}@example.invalid`;
      const password = `Qa!${crypto.randomUUID()}9aA`;
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: "Production", last_name: "QA", role: "student" },
      });
      if (created.error || !created.data.user) throw new Error(created.error?.message || "Unable to create QA student");
      return json({ userId: created.data.user.id, email, password }, 201);
    }

    if (action === "delete") {
      const userId = String(body?.userId || "").trim();
      if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Valid userId is required" }, 400);
      await cleanupUser(admin, userId);
      return json({ success: true });
    }

    return json({ error: "Unsupported QA action" }, 400);
  } catch (error) {
    console.error("QA user operation failed:", error instanceof Error ? error.message : String(error));
    return json({ error: error instanceof Error ? error.message : "QA user operation failed" }, 403);
  }
});