/**
 * POST /api/admin/d1-migrate
 * D1 scans 테이블에 user_id 컬럼 추가 + 인덱스 생성
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

    if (!env.FONDAY_DB) {
      return new Response(JSON.stringify({ error: "DB not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 컬럼 존재 여부 확인
    const info = await env.FONDAY_DB.prepare("PRAGMA table_info(scans)").all();
    const hasUserIdColumn = info.results.some((col: any) => col.name === "user_id");

    if (hasUserIdColumn) {
      return new Response(
        JSON.stringify({ message: "user_id column already exists", skipped: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    await env.FONDAY_DB.prepare("ALTER TABLE scans ADD COLUMN user_id TEXT").run();
    await env.FONDAY_DB
      .prepare("CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id)")
      .run();

    return new Response(
      JSON.stringify({ success: true, message: "Migration done: user_id column + index created" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
