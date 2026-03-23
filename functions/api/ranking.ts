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

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const myScore = url.searchParams.get("myScore")
      ? parseInt(url.searchParams.get("myScore")!)
      : null;

    // SCANS_KV에서 모든 유저 스캔 수집
    const allScores: number[] = [];
    const baumannDistribution: Record<string, number> = {};

    if (env.SCANS_KV) {
      // 모든 scans: 키 목록 가져오기 (최대 1000개)
      const listed = await env.SCANS_KV.list({ prefix: "scans:" });
      for (const key of listed.keys) {
        const raw = await env.SCANS_KV.get(key.name);
        if (!raw) continue;
        try {
          const scans: any[] = JSON.parse(raw);
          if (Array.isArray(scans)) {
            for (const scan of scans) {
              const s = parseInt(scan.overallScore);
              if (!isNaN(s) && s > 0) allScores.push(s);
              if (scan.baumannType) {
                baumannDistribution[scan.baumannType] =
                  (baumannDistribution[scan.baumannType] || 0) + 1;
              }
            }
          }
        } catch (e) {
          console.error(`Failed to parse scan data for ${key.name}:`, e);
          continue;
        }
      }
    }

    // 현재 유저 점수를 풀에 포함 (미저장 스캔 포함)
    const scorePool = (myScore && myScore > 0) ? allScores.concat([myScore]) : allScores;

    const totalScans = scorePool.length;
    const avgScore = totalScans > 0
      ? Math.round(scorePool.reduce((a, b) => a + b, 0) / totalScans)
      : 0;
    
    let topScore = 0;
    if (totalScans > 0) {
      for (const s of scorePool) {
        if (s > topScore) topScore = s;
      }
    }

    const scoreDistribution = [
      { label: "0-20", count: 0 },
      { label: "21-40", count: 0 },
      { label: "41-60", count: 0 },
      { label: "61-80", count: 0 },
      { label: "81-100", count: 0 },
    ];
    for (const s of scorePool) {
      if (s <= 20) scoreDistribution[0].count++;
      else if (s <= 40) scoreDistribution[1].count++;
      else if (s <= 60) scoreDistribution[2].count++;
      else if (s <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    }

    const result: any = {
      totalScans,
      avgScore,
      topScore,
      scoreDistribution,
      baumannDistribution,
    };

    if (myScore && myScore > 0 && scorePool.length > 0) {
      const scoresBelow = scorePool.filter(s => s < myScore).length;
      result.myPercentile = Math.max(
        1,
        Math.round((1 - scoresBelow / scorePool.length) * 100)
      );
    }

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: CORS,
    });
  }
};
