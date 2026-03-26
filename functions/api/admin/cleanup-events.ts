/**
 * POST /api/admin/cleanup-events
 * 중복 app_open 이벤트 정리 — session_id당 가장 오래된 1건만 남김
 * Body: { key: ADMIN_KEY }
 */
export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    if (!env.ADMIN_KEY || body.key !== env.ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 중복 app_open 중 각 session_id의 가장 오래된 것만 남기고 삭제
    const result = await env.FONDAY_DB.prepare(
      `DELETE FROM events WHERE event_type='app_open' AND id NOT IN (
        SELECT MIN(id) FROM events WHERE event_type='app_open' GROUP BY session_id
      )`
    ).run();

    const deleted = result?.meta?.changes ?? 0;

    // 정리 후 현재 상태 확인
    const after = await env.FONDAY_DB.prepare(
      "SELECT COUNT(DISTINCT session_id) as sessions FROM events WHERE event_type='app_open'"
    ).first();

    return new Response(JSON.stringify({
      ok: true,
      deleted,
      remaining_sessions: after?.sessions ?? 0,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
