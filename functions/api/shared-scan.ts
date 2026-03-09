const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: CORS,
      });
    }

    if (!env.SCANS_KV) {
      return new Response(JSON.stringify({ error: "Storage not configured" }), {
        status: 500,
        headers: CORS,
      });
    }

    try {
      // Fetch public scan data from KV storage
      const raw = await env.SCANS_KV.get(`share:${token}`);
      
      if (!raw) {
        return new Response(JSON.stringify({ error: "Scan not found" }), {
          status: 404,
          headers: CORS,
        });
      }

      const scan = JSON.parse(raw);

      // Only return non-sensitive public fields
      const publicScanData = {
        overallScore: scan.overallScore,
        scores: typeof scan.scores === 'string' ? JSON.parse(scan.scores) : scan.scores,
        baumannType: scan.baumannType,
        skinAge: scan.skinAge,
        aiComment: scan.aiComment,
        shareToken: scan.shareToken,
        createdAt: scan.createdAt
      };

      return new Response(JSON.stringify(publicScanData), {
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
