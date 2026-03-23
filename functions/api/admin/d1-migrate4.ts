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

    const results: string[] = [];

    // events 테이블 생성
    // 테이블 존재 여부: PRAGMA로 확인 (sqlite_master는 D1에서 미지원)
    const pragmaInfo = await env.FONDAY_DB.prepare("PRAGMA table_info(events)").all().catch(() => ({ results: [] }));
    if ((pragmaInfo as any).results?.length > 0) {
      results.push("events table already exists — skipped");
    } else {
      await env.FONDAY_DB.prepare(`
        CREATE TABLE events (
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
      await env.FONDAY_DB.prepare("CREATE INDEX idx_events_type ON events(event_type)").run();
      await env.FONDAY_DB.prepare("CREATE INDEX idx_events_created ON events(created_at)").run();
      await env.FONDAY_DB.prepare("CREATE INDEX idx_events_user ON events(user_id)").run();
      results.push("events table created with indexes");
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("d1-migrate4 error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
