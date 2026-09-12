import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  return new Response(JSON.stringify({
    error: "This legacy endpoint has been retired. Use the lesson-worker and lesson-quality-audit pipeline instead."
  }), { status: 410, headers });
});
