/**
 * POST /api/admin/d1-migrate5
 * products 테이블 생성 (화장품 추천 DB)
 * Body: { key: ADMIN_KEY }
 */
import { PRODUCT_SEED } from "./product-seed-data";

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

    // 기존 테이블 드롭 후 재생성 (스키마 변경 반영)
    await env.FONDAY_DB.prepare("DROP TABLE IF EXISTS products").run();
    results.push("dropped old products table");

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
        region TEXT DEFAULT 'kr',
        buy_url TEXT DEFAULT '',
        banner_url TEXT DEFAULT '',
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
      "CREATE INDEX IF NOT EXISTS idx_products_region ON products(region)"
    ).run();
    results.push("idx_products_region ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)"
    ).run();
    results.push("idx_products_active ok");

    // 기존 데이터 삭제 후 새로 시드 (제품 목록 갱신)
    await env.FONDAY_DB.prepare("DELETE FROM products").run();
    results.push("cleared existing products");

    for (const p of PRODUCT_SEED) {
      await env.FONDAY_DB.prepare(`
        INSERT INTO products (name, brand, category, key_ingredients, best_baumann, avoid_baumann, target_concern, price, region, buy_url, banner_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(p.name, p.brand, p.category, p.key_ingredients, p.best_baumann, p.avoid_baumann, p.target_concern, p.price, p.region, p.buy_url || "", p.banner_url || "").run();
    }
    const krCount = PRODUCT_SEED.filter(p => p.region === "kr").length;
    const jpCount = PRODUCT_SEED.filter(p => p.region === "jp").length;
    results.push(`seeded ${PRODUCT_SEED.length} products (kr:${krCount}, jp:${jpCount}, ${PRODUCT_SEED.filter(p => p.buy_url).length} links, ${PRODUCT_SEED.filter(p => p.banner_url).length} banners)`);

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
