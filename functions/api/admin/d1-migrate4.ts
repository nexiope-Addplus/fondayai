/**
 * POST /api/admin/d1-migrate4
 * events 테이블 생성 (행동 분석용)
 * Body: { key: ADMIN_KEY }
 */
export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // JSON과 form-data 둘 다 지원
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

    await env.FONDAY_DB.prepare(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT '',
        session_id TEXT DEFAULT '',
        event_type TEXT NOT NULL,
        event_data TEXT DEFAULT '{}',
        lang TEXT DEFAULT 'ko',
        is_guest INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
    results.push("events table ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)"
    ).run();
    results.push("idx_events_type ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)"
    ).run();
    results.push("idx_events_created ok");

    await env.FONDAY_DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id)"
    ).run();
    results.push("idx_events_user ok");

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("d1-migrate4 error:", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: e?.message ?? "" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
