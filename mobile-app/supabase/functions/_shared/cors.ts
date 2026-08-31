// Shared CORS headers.
//
// React Native does not enforce CORS, but the Expo Web build calls these same
// functions from a browser, so every function answers the OPTIONS preflight and
// echoes these headers on the real response.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** JSON response with CORS headers attached. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/** Standard preflight answer; return this for `req.method === "OPTIONS"`. */
export function preflight(): Response {
  return new Response("ok", { headers: corsHeaders });
}
