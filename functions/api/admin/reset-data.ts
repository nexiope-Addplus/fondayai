/**
 * POST /api/admin/reset-data
 * 전체 데이터 초기화 (스캔, 일기, 화장품, 이벤트)
 * Body (form-data): { key: ADMIN_KEY, confirm: "전체초기화" }
 * ⚠️ 복구 불가 — 반드시 confirm 텍스트 일치 필요
 */
export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const fd = await request.formData();
    const key = fd.get("key") as string | null;
    const confirm = fd.get("confirm") as string | null;

    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    if (confirm !== "전체초기화") {
      return new Response(JSON.stringify({ error: "확인 텍스트가 틀렸습니다" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    if (!env.FONDAY_DB) {
      return new Response(JSON.stringify({ error: "DB not configured" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    // D1 테이블 초기화
    const tables = ["scans", "diary_entries", "cosmetics", "events"];
    for (const table of tables) {
      try {
        const res = await env.FONDAY_DB.prepare(`DELETE FROM ${table}`).run();
        results.push(`${table}: ${(res as any).meta?.changes ?? 0}행 삭제`);
      } catch (e: any) {
        results.push(`${table}: 스킵 (${e?.message?.slice(0, 40) ?? "오류"})`);
      }
    }

    // PUSH_KV 초기화 (push 구독 목록)
    if (env.PUSH_KV) {
      try {
        const allIds = await env.PUSH_KV.get("push:all_ids");
        if (allIds) {
          const ids: string[] = JSON.parse(allIds);
          await Promise.all([
            env.PUSH_KV.delete("push:all_ids"),
            ...ids.map((id: string) => env.PUSH_KV.delete(`push:sub:${id}`)),
          ]);
          results.push(`push_kv: ${ids.length}개 구독 삭제`);
        } else {
          results.push("push_kv: 구독 없음");
        }
      } catch (e: any) {
        results.push(`push_kv: 스킵 (${e?.message?.slice(0, 40) ?? "오류"})`);
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("reset-data error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
