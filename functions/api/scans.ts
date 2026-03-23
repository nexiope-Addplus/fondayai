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

    const shareToken = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newScan = {
      id: Date.now().toString(),
      createdAt,
      overallScore: String(body.overallScore),
      skinAge: body.skinAge ?? null,
      baumannType: body.baumannType ?? null,
      aiComment: body.aiComment ?? "",
      scores: body.scores ?? [],
      hotspots: body.hotspots ?? [],
      improvements: body.improvements ?? [],
      cosmetics: body.cosmetics ?? [],
      weatherInfo: body.weatherInfo ?? null,
      shareToken,
    };

    if (env.SCANS_KV) {
      const raw = await env.SCANS_KV.get(kvKey);
      const scans: any[] = raw ? JSON.parse(raw) : [];
      scans.unshift(newScan);
      await env.SCANS_KV.put(kvKey, JSON.stringify(scans.slice(0, 30)));
      await env.SCANS_KV.put(`share:${shareToken}`, JSON.stringify(newScan));
    }

    // D1에도 저장 (관리자 통계용) — gender/age_group 포함
    if (env.FONDAY_DB) {
      env.FONDAY_DB.prepare(
        `INSERT OR IGNORE INTO scans
           (id, user_id, overall_score, baumann_type, skin_age, ai_comment, scores,
            weather_info, share_token, lang, is_guest, gender, age_group, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        user.id,
        body.overallScore ?? 0,
        body.baumannType ?? "",
        body.skinAge ?? null,
        body.aiComment ?? "",
        JSON.stringify(body.scores ?? []),
        JSON.stringify(body.weatherInfo ?? null),
        shareToken,
        body.lang ?? "ko",
        body.gender ?? "",
        body.ageGroup ?? "",
        createdAt
      ).run().catch(() => {});
    }

    return new Response(JSON.stringify(newScan), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
