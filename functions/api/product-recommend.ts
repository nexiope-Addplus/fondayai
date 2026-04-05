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

    // 제휴 링크가 있는 활성 제품만 가져오기
    const { results } = await env.FONDAY_DB.prepare(
      "SELECT * FROM products WHERE is_active = 1 AND buy_url != '' AND buy_url IS NOT NULL"
    ).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // 바우만 4축
    const bl = baumann.split(""); // e.g. ["D","S","P","T"]

    // 매칭 점수 계산 (0.00~99.99, 소수점 2자리 세분화)
    const scored = results.map((p: any) => {
      const bestTypes: string[] = JSON.parse(p.best_baumann || "[]");
      const avoidTypes: string[] = JSON.parse(p.avoid_baumann || "[]");
      const ingredients: string[] = JSON.parse(p.key_ingredients || "[]");

      // 회피 타입 체크
      if (avoidTypes.includes(baumann)) return { ...p, matchScore: 0, key_ingredients: ingredients };
      const avoidMax = avoidTypes.reduce((mx: number, at: string) =>
        Math.max(mx, bl.filter((c, i) => at.length > i && at[i] === c).length), 0);
      if (avoidMax >= 3) return { ...p, matchScore: Math.max(1.5, 12 - avoidMax * 2.5), key_ingredients: ingredients };

      const exactIdx = bestTypes.indexOf(baumann);

      // ① 정확 매칭 (최대 40점)
      // 1순위=40, 2순위=34, 3순위+=28
      const exactScore = exactIdx === 0 ? 40 : exactIdx === 1 ? 34 : exactIdx >= 2 ? 28 : 0;

      // ② 축별 부분 매칭 (정확 매칭 없을 때만, 각 축 0~6점, 최대 24점)
      let axisScore = 0;
      if (exactIdx === -1) {
        for (let i = 0; i < 4; i++) {
          const matchCount = bestTypes.filter(bt => bt.length > i && bt[i] === bl[i]).length;
          const ratio = matchCount / Math.max(1, bestTypes.length);
          if (matchCount > 0) axisScore += 3 + ratio * 3; // 3~6점
        }
      }

      // ③ 성분 풍부도 (최대 12점) — 성분 수 × 2.4, 최대 5개까지
      const ingredientScore = Math.min(12, ingredients.length * 2.4);

      // ④ 고민 매칭 (최대 10점)
      const relatedConcerns: Record<string, string[]> = {
        hydration: ["barrier", "nourishing"], soothing: ["barrier", "repair"],
        brightening: ["nourishing"], acne: ["pore", "soothing"], pore: ["acne"],
        "anti-aging": ["elasticity"], elasticity: ["anti-aging", "nourishing"],
        repair: ["soothing", "barrier"], barrier: ["hydration", "soothing"],
        nourishing: ["hydration", "brightening"], absorption: ["hydration"],
        "uv-protection": [],
      };
      const concernScore = concern
        ? (p.target_concern === concern ? 10
          : relatedConcerns[concern]?.includes(p.target_concern) ? 5
          : 0)
        : 0;

      // ⑤ 가격대 (최대 5점) — 1~3.5만원대 선호
      const price = p.price || 15000;
      const priceScore = price >= 10000 && price <= 25000 ? 5
        : price > 25000 && price <= 35000 ? 3
        : price < 10000 ? 3.5 : 1;

      // ⑥ 성분 다양성 보너스 (최대 3점)
      // 3종 이상 서로 다른 성분이면 보너스
      const diversityBonus = ingredients.length >= 3 ? 3 : ingredients.length >= 2 ? 1.5 : 0;

      // 합산 (최대 ~70점)
      const rawTotal = exactScore + axisScore + ingredientScore + concernScore + priceScore + diversityBonus;

      // 70점 스케일 → 99.99 스케일로 정규화 + 제품별 고유 시드로 동점 방지
      const seed = ((p.id * 2654435761) >>> 0) / 4294967296; // 0~1 고유값
      const base = Math.min(99, (rawTotal / 70) * 95); // 0~95 범위
      const jitter = seed * 4.99; // 0~4.99 범위로 소수점 세분화
      const matchScore = Math.round(Math.min(99.99, Math.max(0.5, base + jitter)) * 100) / 100;

      return { ...p, matchScore, key_ingredients: ingredients };
    });

    // 점수 높은 순 정렬, 회피 타입 제외, 상위 N개
    // 동일 점수 내에서 제휴 링크 있는 제품 우선
    const sorted = scored
      .filter((p: any) => p.matchScore > 10)
      .sort((a: any, b: any) => {
        const diff = b.matchScore - a.matchScore;
        if (Math.abs(diff) > 0.01) return diff;
        // 동일 점수: 제휴 링크 있는 제품 우선
        const aHas = a.buy_url && a.buy_url.startsWith("http") ? 1 : 0;
        const bHas = b.buy_url && b.buy_url.startsWith("http") ? 1 : 0;
        return bHas - aHas;
      })
      .slice(0, limit);

    const filtered = sorted.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        keyIngredients: p.key_ingredients,
        targetConcern: p.target_concern,
        price: p.price,
        priceCurrency: p.price_currency,
        buyUrl: p.buy_url,
        bannerUrl: p.banner_url,
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
