import { getUserFromCookie } from "../_utils/jwt";

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
    return new Response(
      JSON.stringify(request.method === "GET" ? [] : { error: "로그인이 필요합니다." }),
      { status: 401, headers: CORS },
    );
  }

  const db = env.FONDAY_DB;
  if (!db) {
    return new Response(
      JSON.stringify(request.method === "GET" ? [] : { success: true, offline: true }),
      { headers: CORS },
    );
  }

  if (request.method === "GET") {
    try {
      const result = await db
        .prepare(
          "SELECT date_str, memo, todos, cause_tags, updated_at FROM diary_entries WHERE user_id = ? ORDER BY date_str DESC",
        )
        .bind(user.id)
        .all();
      return new Response(JSON.stringify(result.results ?? []), { headers: CORS });
    } catch {
      return new Response(JSON.stringify([]), { headers: CORS });
    }
  }

  if (request.method === "POST") {
    const body: any = await request.json();
    const { dateStr, memo, todos, causeTags } = body ?? {};

    if (!dateStr) {
      return new Response(JSON.stringify({ error: "dateStr 필요" }), { status: 400, headers: CORS });
    }

    try {
      const id = `${user.id}_${dateStr}`;
      const updatedAt = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO diary_entries (id, user_id, date_str, memo, todos, cause_tags, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, date_str) DO UPDATE SET
             memo = excluded.memo,
             todos = excluded.todos,
             cause_tags = excluded.cause_tags,
             updated_at = excluded.updated_at`,
        )
        .bind(
          id,
          user.id,
          dateStr,
          memo || "",
          JSON.stringify(todos || []),
          JSON.stringify(causeTags || []),
          updatedAt,
        )
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: CORS });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
