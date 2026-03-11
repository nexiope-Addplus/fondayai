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
      const { overallScore, baumannType, scores, skinAge, aiComment } = body;

      const shareToken = crypto.randomUUID();
      const scanData = {
        overallScore,
        baumannType,
        scores,
        skinAge,
        aiComment,
        shareToken,
        createdAt: new Date().toISOString(),
      };

      // 30일 TTL
      await env.SCANS_KV.put(`share:${shareToken}`, JSON.stringify(scanData), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

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
