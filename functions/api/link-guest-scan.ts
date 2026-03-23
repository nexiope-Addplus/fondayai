import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET!);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const body: any = await request.json();
  const { shareToken } = body;
  if (!shareToken) {
    return new Response(JSON.stringify({ error: "shareToken 필요" }), { status: 400, headers: CORS });
  }

  const db = env.FONDAY_DB;
  if (!db) {
    return new Response(JSON.stringify({ ok: false, error: "DB 없음" }), { headers: CORS });
  }

  try {
    // is_guest=1이고 user_id가 없는 스캔만 연결 (이미 연결된 건 건드리지 않음)
    await db.prepare(
      `UPDATE scans SET user_id = ?, is_guest = 0 WHERE share_token = ? AND (user_id IS NULL OR user_id = '')`
    ).bind(user.id, shareToken).run();

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message }), { headers: CORS });
  }
};
