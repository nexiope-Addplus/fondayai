/**
 * POST /api/diary-reminder  — 루틴 리마인더 설정 저장
 * DELETE /api/diary-reminder — 리마인더 해제
 *
 * KV 저장: push:reminder:{id} = { hour, lang }
 * id는 push subscription endpoint 기반 (push-subscribe.ts와 동일 방식)
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function endpointToId(endpoint: string): string {
  return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(-32);
}

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  const kv: KVNamespace | undefined = env.PUSH_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: "PUSH_KV not configured" }), { status: 500, headers: CORS });
  }

  // ── POST: 리마인더 설정 저장 ─────────────────────────────────
  if (request.method === "POST") {
    const body: any = await request.json();
    const { endpoint, hour, lang } = body;

    if (!endpoint || hour === undefined) {
      return new Response(JSON.stringify({ error: "endpoint and hour required" }), { status: 400, headers: CORS });
    }

    const id = endpointToId(endpoint);
    await kv.put(`push:reminder:${id}`, JSON.stringify({
      hour: Number(hour),
      lang: lang || "ko",
      updatedAt: new Date().toISOString(),
    }));

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  // ── DELETE: 리마인더 해제 ─────────────────────────────────────
  if (request.method === "DELETE") {
    const body: any = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "endpoint required" }), { status: 400, headers: CORS });
    }

    const id = endpointToId(endpoint);
    await kv.delete(`push:reminder:${id}`);

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
