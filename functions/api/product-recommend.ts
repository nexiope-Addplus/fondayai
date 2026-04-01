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

    // 바우만 4축
    const bl = baumann.split(""); // e.g. ["D","S","P","T"]

    // 매칭 점수 계산 (1~99, 1점 단위 분산)
    const scored = results.map((p: any) => {
      const bestTypes: string[] = JSON.parse(p.best_baumann || "[]");
      const avoidTypes: string[] = JSON.parse(p.avoid_baumann || "[]");
      const ingredients: string[] = JSON.parse(p.key_ingredients || "[]");

      // 회피 타입 체크
      if (avoidTypes.includes(baumann)) return { ...p, matchScore: 0, key_ingredients: ingredients };
      const avoidMax = avoidTypes.reduce((mx: number, at: string) =>
        Math.max(mx, bl.filter((c, i) => at.length > i && at[i] === c).length), 0);
      if (avoidMax >= 3) return { ...p, matchScore: Math.max(3, 15 - avoidMax * 3), key_ingredients: ingredients };

      // ① 축별 매칭 (각 축 0~15, 총 최대 60)
      let axisScore = 0;
      for (let i = 0; i < 4; i++) {
        const matched = bestTypes.filter(bt => bt.length > i && bt[i] === bl[i]).length;
        if (matched > 0) axisScore += 8 + Math.round((matched / Math.max(1, bestTypes.length)) * 7);
      }

      // ② 정확 매칭 보너스 (최대 25)
      const exactIdx = bestTypes.indexOf(baumann);
      const exactBonus = exactIdx === 0 ? 25 : exactIdx === 1 ? 20 : exactIdx === 2 ? 16 : exactIdx >= 3 ? 12 : 0;

      // ③ 부분 매칭 (정확 매칭 없을 때만, 최대 12)
      let partialBonus = 0;
      if (exactIdx === -1) {
        const bestPartial = bestTypes.reduce((mx: number, bt: string) =>
          Math.max(mx, bl.filter((c, i) => bt.length > i && bt[i] === c).length), 0);
        partialBonus = bestPartial === 3 ? 12 : bestPartial === 2 ? 6 : bestPartial === 1 ? 2 : 0;
      }

      // ④ 성분 보너스 (최대 8)
      const ingredientBonus = Math.min(8, ingredients.length * 2);

      // ⑤ 고민 매칭 (최대 7)
      const relatedConcerns: Record<string, string[]> = {
        hydration: ["barrier", "nourish"], soothing: ["barrier", "repair"],
        brightening: ["nourish"], acne: ["pore", "soothing"], pore: ["acne"],
        wrinkle: ["elasticity"], elasticity: ["wrinkle", "nourish"],
        repair: ["soothing", "barrier"], barrier: ["hydration", "soothing"],
      };
      const concernBonus = concern
        ? (p.target_concern === concern ? 7 : relatedConcerns[concern]?.includes(p.target_concern) ? 3 : 0)
        : 0;

      // ⑥ 가격대 점수 (0~4)
      const price = p.price || 15000;
      const priceScore = price >= 10000 && price <= 25000 ? 4
        : price > 25000 && price <= 35000 ? 2
        : price < 10000 ? 3 : 0;

      // 합산 (최대 ~104)
      const rawTotal = axisScore + exactBonus + partialBonus + ingredientBonus + concernBonus + priceScore;

      // ⑦ 제품 고유 시드로 동점 방지 (0.0~0.99)
      // 이름 길이 + 가격 + ID 조합으로 각 제품마다 고유한 소수점 생성
      const seed = ((p.id * 2654435761) >>> 0) / 4294967296; // 0~1 사이 고유값

      // rawTotal을 0~99 범위로 정규화, 시드로 ±8 분산
      const normalized = Math.min(99, Math.max(1, Math.round(rawTotal * 0.85 + seed * 16 - 4)));
      return { ...p, matchScore: normalized, key_ingredients: ingredients };
    });

    // 점수 높은 순 정렬, 회피 타입 제외, 상위 N개
    const filtered = scored
      .filter((p: any) => p.matchScore > 10)
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
