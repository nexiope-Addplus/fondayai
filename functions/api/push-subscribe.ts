// Fonday Push Subscription — Cloudflare Pages Function
// KV binding: PUSH_KV (Cloudflare 대시보드에서 생성 후 바인딩 필요)

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const kv: KVNamespace | undefined = env.PUSH_KV;

  // ── POST: 구독 저장 ───────────────────────────────────────────
  if (request.method === "POST") {
    const body: any = await request.json();
    const { subscription, baumannType, lang } = body;

    if (!subscription?.endpoint) {
      return new Response(JSON.stringify({ error: "subscription required" }), { status: 400, headers: CORS });
    }

    // endpoint를 기반으로 고유 ID 생성 (URL 안전 해시)
    const id = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(-32);
    const record = { id, subscription, baumannType: baumannType || "OSNT", lang: lang || "ko", createdAt: new Date().toISOString() };

    if (kv) {
      await kv.put(`push:sub:${id}`, JSON.stringify(record));
      // 전체 ID 목록 업데이트
      const allRaw = await kv.get("push:all_ids");
      const allIds: string[] = allRaw ? JSON.parse(allRaw) : [];
      if (!allIds.includes(id)) {
        allIds.push(id);
        await kv.put("push:all_ids", JSON.stringify(allIds));
      }
    }

    return new Response(JSON.stringify({ ok: true, id }), { headers: CORS });
  }

  // ── DELETE: 구독 해제 ─────────────────────────────────────────
  if (request.method === "DELETE") {
    const body: any = await request.json();
    const { endpoint } = body;
    if (!endpoint) return new Response(JSON.stringify({ error: "endpoint required" }), { status: 400, headers: CORS });

    const id = btoa(endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(-32);
    if (kv) {
      await kv.delete(`push:sub:${id}`);
      const allRaw = await kv.get("push:all_ids");
      if (allRaw) {
        const allIds: string[] = JSON.parse(allRaw);
        await kv.put("push:all_ids", JSON.stringify(allIds.filter(x => x !== id)));
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
