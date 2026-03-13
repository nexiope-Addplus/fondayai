/**
 * POST /api/admin/d1-migrate3
 * D1 scans 테이블에 gender, age_group 컬럼 추가
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

    const info = await env.FONDAY_DB.prepare("PRAGMA table_info(scans)").all();
    const cols = (info.results as any[]).map((c: any) => c.name);
    const added: string[] = [];

    if (!cols.includes("gender")) {
      await env.FONDAY_DB.prepare("ALTER TABLE scans ADD COLUMN gender TEXT DEFAULT ''").run();
      added.push("gender");
    }
    if (!cols.includes("age_group")) {
      await env.FONDAY_DB.prepare("ALTER TABLE scans ADD COLUMN age_group TEXT DEFAULT ''").run();
      added.push("age_group");
    }

    return new Response(
      JSON.stringify({ success: true, added: added.length ? added : "already exists" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
