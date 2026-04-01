/**
 * GET /api/product-recommend?baumann=DSPT&concern=hydration&limit=6
 * 바우만 타입 기반 맞춤 제품 추천
 */
export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const baumann = (url.searchParams.get("baumann") || "DSPT").toUpperCase();
    const concern = url.searchParams.get("concern") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "6"), 20);

    if (!env.FONDAY_DB) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 전체 활성 제품 가져오기
    const { results } = await env.FONDAY_DB.prepare(
      "SELECT * FROM products WHERE is_active = 1"
    ).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 매칭 점수 계산 (0~100, 분산되도록 설계)
    const scored = results.map((p: any) => {
      let score = 0;

      const bestTypes: string[] = JSON.parse(p.best_baumann || "[]");
      const avoidTypes: string[] = JSON.parse(p.avoid_baumann || "[]");

      // 회피 타입 체크 (먼저)
      if (avoidTypes.includes(baumann)) return { ...p, matchScore: 0, key_ingredients: JSON.parse(p.key_ingredients || "[]") };
      const avoidPartial = avoidTypes.some((at: string) =>
        baumann.split("").filter((c, i) => at.length > i && at[i] === c).length >= 3
      );
      if (avoidPartial) return { ...p, matchScore: 5, key_ingredients: JSON.parse(p.key_ingredients || "[]") };

      // best_baumann 리스트에서 가장 높은 매칭도 찾기
      const bestMatchLetters = bestTypes.reduce((max: number, bt: string) => {
        const matches = baumann.split("").filter((c, i) => bt.length > i && bt[i] === c).length;
        return Math.max(max, matches);
      }, 0);

      // best_baumann 리스트 내 순서 보너스 (1번째=최적, 3번째=괜찮음)
      const exactIdx = bestTypes.indexOf(baumann);
      if (exactIdx === 0) score = 95;        // 1순위 정확 매칭
      else if (exactIdx === 1) score = 88;   // 2순위 정확 매칭
      else if (exactIdx >= 2) score = 80;    // 3순위 이하 정확 매칭
      else if (bestMatchLetters === 4) score = 75;  // 정확 매칭이지만 리스트에 없음 (불가능하지만 방어)
      else if (bestMatchLetters === 3) score = 60;  // 4글자 중 3개 일치
      else if (bestMatchLetters === 2) score = 40;  // 4글자 중 2개 일치
      else if (bestMatchLetters === 1) score = 25;  // 1개만 일치
      else score = 15;                               // 전혀 안 맞음

      // 고민(concern) 매칭 보너스
      if (concern && p.target_concern === concern) score = Math.min(100, score + 5);

      return { ...p, matchScore: score, key_ingredients: JSON.parse(p.key_ingredients || "[]") };
    });

    // 점수 높은 순 정렬, 회피 타입 제외, 상위 N개
    const filtered = scored
      .filter((p: any) => p.matchScore > 20)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        keyIngredients: p.key_ingredients,
        targetConcern: p.target_concern,
        price: p.price,
        priceCurrency: p.price_currency,
        buyUrl: p.buy_url,
        imageUrl: p.image_url,
        matchScore: p.matchScore,
      }));

    return new Response(JSON.stringify({ products: filtered, baumann }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e: any) {
    console.error("product-recommend error:", e);
    return new Response(JSON.stringify({ products: [], error: e?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};
