import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");
  if (!user) {
    return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
      status: 401,
      headers: CORS,
    });
  }

  const kvKey = `scans:${user.id}`;

  // ── GET: 스캔 히스토리 조회 ──────────────────────────
  if (request.method === "GET") {
    let scans: any[] = [];
    if (env.SCANS_KV) {
      const raw = await env.SCANS_KV.get(kvKey);
      if (raw) scans = JSON.parse(raw);
    }
    return new Response(JSON.stringify(scans), { headers: CORS });
  }

  // ── POST: 스캔 저장 ──────────────────────────────────
  if (request.method === "POST") {
    const body: any = await request.json();

    const newScan = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      overallScore: String(body.overallScore),
      skinAge: body.skinAge ?? null,
      baumannType: body.baumannType ?? null,
      aiComment: body.aiComment ?? "",
      scores: body.scores ?? [],
      hotspots: body.hotspots ?? [],
      improvements: body.improvements ?? [],
      cosmetics: body.cosmetics ?? [],
    };

    if (env.SCANS_KV) {
      const raw = await env.SCANS_KV.get(kvKey);
      const scans: any[] = raw ? JSON.parse(raw) : [];
      scans.unshift(newScan);
      await env.SCANS_KV.put(kvKey, JSON.stringify(scans.slice(0, 30)));
    }

    return new Response(JSON.stringify(newScan), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
