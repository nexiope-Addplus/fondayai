const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method === "POST") {
    if (!env.SCANS_KV) {
      return new Response(JSON.stringify({ error: "Storage not configured" }), {
        status: 500,
        headers: CORS,
      });
    }

    try {
      const body = await request.json();
      const { overallScore, baumannType, scores, skinAge, aiComment, lang } = body;

      const shareToken = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const scanData = {
        overallScore,
        baumannType,
        scores,
        skinAge,
        aiComment,
        shareToken,
        createdAt,
      };

      // KV 저장 (챌린지/배틀 기능용, 30일 TTL)
      await env.SCANS_KV.put(`share:${shareToken}`, JSON.stringify(scanData), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

      // D1 저장 (관리자 조회용, 영구)
      if (env.FONDAY_DB) {
        await env.FONDAY_DB.prepare(
          `INSERT OR IGNORE INTO scans (id, overall_score, baumann_type, skin_age, ai_comment, scores, share_token, lang, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          overallScore ?? 0,
          baumannType ?? "",
          skinAge ?? null,
          aiComment ?? "",
          JSON.stringify(scores ?? []),
          shareToken,
          lang ?? "ko",
          createdAt
        ).run();
      }

      return new Response(JSON.stringify({ shareToken }), {
        status: 200,
        headers: CORS,
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: CORS,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
