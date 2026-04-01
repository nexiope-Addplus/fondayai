/**
 * POST /api/admin/d1-migrate5
 * products 테이블 생성 (화장품 추천 DB)
 * Body: { key: ADMIN_KEY }
 */
export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    let key: string | null = null;
    const ct = request.headers.get("Content-Type") ?? "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      key = body.key ?? null;
    } else {
      const fd = await request.formData();
      key = fd.get("key") as string | null;
    }
    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.FONDAY_DB) {
      return new Response(JSON.stringify({ error: "DB not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    // 화장품 추천 제품 테이블
    await env.FONDAY_DB.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        key_ingredients TEXT DEFAULT '[]',
        best_baumann TEXT DEFAULT '[]',
        avoid_baumann TEXT DEFAULT '[]',
        target_concern TEXT DEFAULT '',
        price INTEGER DEFAULT 0,
        price_currency TEXT DEFAULT 'KRW',
        buy_url TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
    results.push("products table ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)"
    ).run();
    results.push("idx_products_category ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)"
    ).run();
    results.push("idx_products_active ok");

    // MVP 시드 데이터: 올리브영 인기 50개
    const seed = [
      // 토너 (10)
      { name: "다이브인 저분자 히알루론산 토너", brand: "토리든", category: "toner", key_ingredients: '["히알루론산","판테놀","알란토인"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 18200 },
      { name: "자작나무 수분 토너", brand: "라운드랩", category: "toner", key_ingredients: '["자작나무수액","히알루론산","판테놀"]', best_baumann: '["DSPT","DRPT","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 15800 },
      { name: "머금 에센스 토너", brand: "넘버즈인", category: "toner", key_ingredients: '["히알루론산","쌀추출물","나이아신아마이드"]', best_baumann: '["DSPT","DSPW","DRNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 18000 },
      { name: "어성초 77 수딩 토너", brand: "아누아", category: "toner", key_ingredients: '["어성초","판테놀","위치하젤"]', best_baumann: '["OSPT","OSPW","OSNT"]', avoid_baumann: '[]', target_concern: "soothing", price: 18000 },
      { name: "AHA BHA PHA 30 Days 미라클 토너", brand: "썸바이미", category: "toner", key_ingredients: '["AHA","BHA","PHA","나이아신아마이드"]', best_baumann: '["ORPT","ORPW","ORNT"]', avoid_baumann: '["DSPT","DSPW"]', target_concern: "pore", price: 12000 },
      { name: "닥터자르트 시카페어 토너", brand: "닥터자르트", category: "toner", key_ingredients: '["센텔라","판테놀","마데카소사이드"]', best_baumann: '["DSPT","OSPT","DSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 23000 },
      { name: "그린티 히알루론산 토너", brand: "이니스프리", category: "toner", key_ingredients: '["녹차","히알루론산","스쿠알란"]', best_baumann: '["DRNT","DRPT","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 13500 },
      { name: "쏘내추럴 티트리 시카 수딩 토너", brand: "쏘내추럴", category: "toner", key_ingredients: '["티트리","시카","살리실산"]', best_baumann: '["OSPT","OSPW","ORPT"]', avoid_baumann: '["DSPT"]', target_concern: "acne", price: 12800 },
      { name: "스킨1004 마다가스카르 센텔라 토닝 토너", brand: "스킨1004", category: "toner", key_ingredients: '["센텔라","나이아신아마이드","히알루론산"]', best_baumann: '["DSPT","OSPT","DRPT"]', avoid_baumann: '[]', target_concern: "soothing", price: 16000 },
      { name: "구달 맑은 어성초 진정 토너", brand: "구달", category: "toner", key_ingredients: '["어성초","판테놀","알란토인"]', best_baumann: '["OSPT","OSNT","OSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 13500 },

      // 세럼 (10)
      { name: "스네일 뮤신 96% 파워 에센스", brand: "코스알엑스", category: "serum", key_ingredients: '["달팽이뮤신","나이아신아마이드","히알루론산"]', best_baumann: '["DSPT","DSPW","DRPT"]', avoid_baumann: '[]', target_concern: "repair", price: 17800 },
      { name: "비타C 13 세럼", brand: "토리든", category: "serum", key_ingredients: '["비타민C","나이아신아마이드","판테놀"]', best_baumann: '["DRPW","DRPT","ORPW"]', avoid_baumann: '["DSPT","OSPT"]', target_concern: "brightening", price: 21000 },
      { name: "하이퍼 글레이즈 세럼", brand: "넘버즈인", category: "serum", key_ingredients: '["글루타치온","나이아신아마이드","비타민C"]', best_baumann: '["DRPW","DRPT","DSPW"]', avoid_baumann: '[]', target_concern: "brightening", price: 22000 },
      { name: "그린티 씨드 세럼", brand: "이니스프리", category: "serum", key_ingredients: '["녹차씨오일","녹차추출물","스쿠알란"]', best_baumann: '["DRNT","DSNT","DRPT"]', avoid_baumann: '[]', target_concern: "hydration", price: 27000 },
      { name: "프로폴리스 에너지 앰플", brand: "코스알엑스", category: "serum", key_ingredients: '["프로폴리스","나이아신아마이드","판테놀"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "nourish", price: 22500 },
      { name: "레티놀 인텐스 리모델링 세럼", brand: "토리든", category: "serum", key_ingredients: '["레티놀","펩타이드","세라마이드"]', best_baumann: '["DRPW","DRPT","ORNW"]', avoid_baumann: '["OSPT","OSPW","DSPT"]', target_concern: "wrinkle", price: 28000 },
      { name: "비피다 바이옴 앰플", brand: "마녀공장", category: "serum", key_ingredients: '["비피다","갈락토미세스","나이아신아마이드"]', best_baumann: '["DSPT","DRPT","DSPW"]', avoid_baumann: '[]', target_concern: "repair", price: 25000 },
      { name: "하이퍼 쌀 토닝 앰플", brand: "넘버즈인", category: "serum", key_ingredients: '["쌀추출물","나이아신아마이드","알부틴"]', best_baumann: '["DRPW","DRPT","DSPW"]', avoid_baumann: '[]', target_concern: "brightening", price: 19800 },
      { name: "히알루론산 수분 에센스", brand: "이즈앤트리", category: "serum", key_ingredients: '["히알루론산","판테놀","센텔라"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 14800 },
      { name: "마데카소사이드 시카 세럼", brand: "스킨1004", category: "serum", key_ingredients: '["마데카소사이드","센텔라","판테놀"]', best_baumann: '["DSPT","OSPT","DSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 16500 },

      // 크림 (10)
      { name: "세라베 모이스처라이징 크림", brand: "세라베", category: "cream", key_ingredients: '["세라마이드","히알루론산","나이아신아마이드"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 19800 },
      { name: "세타필 모이스처라이징 크림", brand: "세타필", category: "cream", key_ingredients: '["글리세린","해바라기오일","나이아신아마이드"]', best_baumann: '["DSPT","DRPT","DSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 22000 },
      { name: "일리윤 세라마이드 아토 크림", brand: "일리윤", category: "cream", key_ingredients: '["세라마이드","판테놀","스쿠알란"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "barrier", price: 15800 },
      { name: "시카 리페어 크림", brand: "닥터자르트", category: "cream", key_ingredients: '["센텔라","판테놀","마데카소사이드"]', best_baumann: '["DSPT","OSPT","DSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 32000 },
      { name: "수분 크림 라이트", brand: "라운드랩", category: "cream", key_ingredients: '["자작나무수액","세라마이드","판테놀"]', best_baumann: '["DSNT","DSPT","OSNT"]', avoid_baumann: '[]', target_concern: "hydration", price: 18000 },
      { name: "레티놀 인텐스 크림", brand: "이니스프리", category: "cream", key_ingredients: '["레티놀","시카","세라마이드"]', best_baumann: '["DRPW","DRPT","DRNW"]', avoid_baumann: '["OSPT","DSPT"]', target_concern: "wrinkle", price: 25000 },
      { name: "알로에 수딩 젤크림", brand: "홀리카홀리카", category: "cream", key_ingredients: '["알로에","히알루론산","판테놀"]', best_baumann: '["OSNT","OSPT","ORNT"]', avoid_baumann: '[]', target_concern: "soothing", price: 9800 },
      { name: "리얼 콜라겐 보습 크림", brand: "에뛰드", category: "cream", key_ingredients: '["콜라겐","세라마이드","히알루론산"]', best_baumann: '["DSPW","DRPW","DSNW"]', avoid_baumann: '[]', target_concern: "elasticity", price: 18500 },
      { name: "판테놀 시카 밤 크림", brand: "아누아", category: "cream", key_ingredients: '["판테놀","센텔라","세라마이드"]', best_baumann: '["DSPT","OSPT","DSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 22000 },
      { name: "어드밴스드 스네일 92 크림", brand: "코스알엑스", category: "cream", key_ingredients: '["달팽이뮤신","아데노신","판테놀"]', best_baumann: '["DSPT","DSPW","DRPT"]', avoid_baumann: '[]', target_concern: "repair", price: 18500 },

      // 선크림 (10)
      { name: "워터리 선크림 SPF50+", brand: "라운드랩", category: "sunscreen", key_ingredients: '["자작나무수액","히알루론산","센텔라"]', best_baumann: '["DSPT","DSNT","DRPT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 16800 },
      { name: "아쿠아 리치 워터리 에센스 SPF50+", brand: "비오레", category: "sunscreen", key_ingredients: '["히알루론산","로얄젤리","구연산"]', best_baumann: '["ORNT","ORPT","OSNT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 12800 },
      { name: "톤업 선크림 SPF50+", brand: "라운드랩", category: "sunscreen", key_ingredients: '["자작나무수액","나이아신아마이드","센텔라"]', best_baumann: '["DSPT","DRPT","DSNT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 18000 },
      { name: "에어리 선스틱 SPF50+", brand: "토리든", category: "sunscreen", key_ingredients: '["히알루론산","센텔라","비타민E"]', best_baumann: '["DSPT","OSPT","DRPT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 16500 },
      { name: "모이스처 선크림 SPF50+", brand: "이즈앤트리", category: "sunscreen", key_ingredients: '["히알루론산","센텔라","스쿠알란"]', best_baumann: '["DSPT","DSPW","DSNT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 14800 },
      { name: "아이소이 선밀크 SPF50+", brand: "아이소이", category: "sunscreen", key_ingredients: '["알로에","불가리안로즈","비타민E"]', best_baumann: '["DSNT","DRNT","OSNT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 25000 },
      { name: "UV 디펜스 미 데일리 선크림 SPF50+", brand: "라로슈포제", category: "sunscreen", key_ingredients: '["나이아신아마이드","비타민E","라로슈포제온천수"]', best_baumann: '["DSPT","OSPT","DRPT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 28000 },
      { name: "에센스 인 선밀크 SPF50+", brand: "구달", category: "sunscreen", key_ingredients: '["어성초","히알루론산","나이아신아마이드"]', best_baumann: '["OSPT","OSNT","ORPT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 15800 },
      { name: "다이브인 워터리 선크림 SPF50+", brand: "토리든", category: "sunscreen", key_ingredients: '["히알루론산","판테놀","센텔라"]', best_baumann: '["DSPT","DSNT","DSPW"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 18000 },
      { name: "산들산들 선크림 SPF50+", brand: "스킨1004", category: "sunscreen", key_ingredients: '["센텔라","히알루론산","나이아신아마이드"]', best_baumann: '["DSPT","OSPT","DRPT"]', avoid_baumann: '[]', target_concern: "uv_protect", price: 16000 },

      // 클렌저 (10)
      { name: "다이브인 클렌징 폼", brand: "토리든", category: "cleanser", key_ingredients: '["히알루론산","판테놀","알란토인"]', best_baumann: '["DSPT","DSNT","DSPW"]', avoid_baumann: '[]', target_concern: "cleansing", price: 12000 },
      { name: "독도 클렌징 워터", brand: "라운드랩", category: "cleanser", key_ingredients: '["해양심층수","히알루론산","판테놀"]', best_baumann: '["DSPT","OSPT","DRPT"]', avoid_baumann: '[]', target_concern: "cleansing", price: 13800 },
      { name: "로우 pH 굿모닝 젤 클렌저", brand: "코스알엑스", category: "cleanser", key_ingredients: '["티트리","BHA","판테놀"]', best_baumann: '["OSPT","ORPT","OSNT"]', avoid_baumann: '[]', target_concern: "cleansing", price: 10800 },
      { name: "퍼펙트 휩 센카 클렌징 폼", brand: "센카", category: "cleanser", key_ingredients: '["히알루론산","실크","꿀"]', best_baumann: '["DRNT","DRPT","DSNT"]', avoid_baumann: '[]', target_concern: "cleansing", price: 6800 },
      { name: "그린티 아미노 클렌징 폼", brand: "이니스프리", category: "cleanser", key_ingredients: '["녹차","아미노산","글리세린"]', best_baumann: '["DRNT","DSNT","ORNT"]', avoid_baumann: '[]', target_concern: "cleansing", price: 9800 },
      { name: "어성초 클렌징 폼", brand: "아누아", category: "cleanser", key_ingredients: '["어성초","BHA","판테놀"]', best_baumann: '["OSPT","ORPT","OSPW"]', avoid_baumann: '[]', target_concern: "acne", price: 14000 },
      { name: "시카 클렌징 폼", brand: "닥터자르트", category: "cleanser", key_ingredients: '["센텔라","판테놀","아미노산"]', best_baumann: '["DSPT","OSPT","DSPW"]', avoid_baumann: '[]', target_concern: "soothing", price: 18000 },
      { name: "퓨어핏 시카 클렌저", brand: "스킨1004", category: "cleanser", key_ingredients: '["센텔라","티트리","알란토인"]', best_baumann: '["DSPT","OSPT","DSNT"]', avoid_baumann: '[]', target_concern: "soothing", price: 13000 },
      { name: "소다 포어 클렌징 폼", brand: "홀리카홀리카", category: "cleanser", key_ingredients: '["베이킹소다","파파인","AHA"]', best_baumann: '["ORPT","ORPW","ORNT"]', avoid_baumann: '["DSPT","OSPT"]', target_concern: "pore", price: 8800 },
      { name: "비타민 클렌징 폼", brand: "구달", category: "cleanser", key_ingredients: '["비타민C","유자","나이아신아마이드"]', best_baumann: '["DRPT","DRPW","ORPT"]', avoid_baumann: '[]', target_concern: "brightening", price: 10800 },
    ];

    // 기존 데이터 있으면 스킵
    const count = await env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM products").first();
    if (count?.cnt === 0) {
      for (const p of seed) {
        await env.FONDAY_DB.prepare(`
          INSERT INTO products (name, brand, category, key_ingredients, best_baumann, avoid_baumann, target_concern, price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(p.name, p.brand, p.category, p.key_ingredients, p.best_baumann, p.avoid_baumann, p.target_concern, p.price).run();
      }
      results.push(`seeded ${seed.length} products`);
    } else {
      results.push(`products already has ${count?.cnt} rows, skip seed`);
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("d1-migrate5 error:", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: e?.message ?? "" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
