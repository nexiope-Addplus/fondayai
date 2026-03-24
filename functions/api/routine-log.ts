import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS routine_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date_str TEXT NOT NULL,
    cosmetic_ids TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_logs_user_date ON routine_logs(user_id, date_str);
`;

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET!);
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

  // Auto-create table
  try {
    await db.exec(CREATE_TABLE_SQL);
  } catch {
    // Table may already exist; ignore
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    try {
      if (date) {
        const result = await db
          .prepare(
            "SELECT cosmetic_ids FROM routine_logs WHERE user_id = ? AND date_str = ?",
          )
          .bind(user.id, date)
          .first();
        const cosmeticIds = result ? JSON.parse(result.cosmetic_ids as string) : [];
        return new Response(JSON.stringify({ cosmetic_ids: cosmeticIds }), { headers: CORS });
      } else {
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);
        const result = await db
          .prepare(
            "SELECT date_str, cosmetic_ids FROM routine_logs WHERE user_id = ? AND date_str >= ? ORDER BY date_str DESC",
          )
          .bind(user.id, fromDate)
          .all();
        const rows = (result.results ?? []).map((row: any) => ({
          date_str: row.date_str,
          cosmetic_ids: JSON.parse(row.cosmetic_ids),
        }));
        return new Response(JSON.stringify(rows), { headers: CORS });
      }
    } catch {
      return new Response(
        JSON.stringify(date ? { cosmetic_ids: [] } : []),
        { headers: CORS },
      );
    }
  }

  if (request.method === "POST") {
    const body: any = await request.json();
    const { date_str, cosmetic_ids } = body ?? {};

    if (!date_str) {
      return new Response(JSON.stringify({ error: "date_str 필요" }), { status: 400, headers: CORS });
    }

    try {
      const id = `${user.id}_${date_str}`;
      const updatedAt = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO routine_logs (id, user_id, date_str, cosmetic_ids, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, date_str) DO UPDATE SET
             cosmetic_ids = excluded.cosmetic_ids,
             updated_at = excluded.updated_at`,
        )
        .bind(
          id,
          user.id,
          date_str,
          JSON.stringify(cosmetic_ids || []),
          updatedAt,
        )
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: CORS });
    } catch {
      return new Response(JSON.stringify({ error: "저장 중 오류가 발생했습니다." }), { status: 500, headers: CORS });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
