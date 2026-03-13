import { getUserFromCookie } from "../../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");
  if (!user) {
    return new Response(JSON.stringify([]), { status: 401, headers: CORS });
  }

  const db = env.FONDAY_DB;
  if (!db) {
    return new Response(JSON.stringify([]), { headers: CORS });
  }

  // GET: 화장품 목록
  if (request.method === "GET") {
    try {
      const result = await db
        .prepare("SELECT * FROM cosmetics WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC")
        .bind(user.id)
        .all();
      return new Response(JSON.stringify(result.results ?? []), { headers: CORS });
    } catch {
      return new Response(JSON.stringify([]), { headers: CORS });
    }
  }

  // POST: 화장품 등록
  if (request.method === "POST") {
    const body: any = await request.json();
    const { name, brand, category, timeOfDay, openedAt, isSkincareRelevant, imageThumbnail } = body;

    if (!name || !category) {
      return new Response(JSON.stringify({ error: "name, category 필요" }), { status: 400, headers: CORS });
    }

    try {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO cosmetics (id, user_id, name, brand, category, time_of_day, opened_at, status, is_skincare_relevant, image_thumbnail, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
        )
        .bind(
          id,
          user.id,
          name,
          brand || "",
          category,
          timeOfDay || "both",
          openedAt || null,
          isSkincareRelevant !== false ? 1 : 0,
          imageThumbnail || "",
          createdAt
        )
        .run();

      return new Response(JSON.stringify({ id, success: true }), { headers: CORS });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
