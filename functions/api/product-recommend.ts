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

    // 매칭 점수 계산
    const scored = results.map((p: any) => {
      let score = 50; // base score

      const bestTypes: string[] = JSON.parse(p.best_baumann || "[]");
      const avoidTypes: string[] = JSON.parse(p.avoid_baumann || "[]");

      // 정확히 매칭되는 바우만 타입
      if (bestTypes.includes(baumann)) score += 40;

      // 부분 매칭 (4글자 중 3개 이상 일치)
      const matchCount = bestTypes.reduce((max: number, bt: string) => {
        const matches = baumann.split("").filter((c, i) => bt[i] === c).length;
        return Math.max(max, matches);
      }, 0);
      if (matchCount >= 3) score += 20;
      else if (matchCount >= 2) score += 10;

      // 회피 타입이면 패널티
      if (avoidTypes.includes(baumann)) score -= 60;
      const avoidPartial = avoidTypes.some((at: string) =>
        baumann.split("").filter((c, i) => at[i] === c).length >= 3
      );
      if (avoidPartial) score -= 30;

      // 고민(concern) 매칭 보너스
      if (concern && p.target_concern === concern) score += 15;

      return { ...p, matchScore: Math.max(0, Math.min(100, score)), key_ingredients: JSON.parse(p.key_ingredients || "[]") };
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
