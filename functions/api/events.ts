/**
 * POST /api/events
 * 클라이언트 행동 이벤트 수집 (인증 불필요, 익명 허용)
 *
 * Body: {
 *   event_type: string,   // 'tab_view', 'scan_start', 'scan_complete', ...
 *   event_data?: object,  // 추가 데이터
 *   session_id?: string,
 *   lang?: string,
 *   is_guest?: boolean,
 * }
 */

import { verifyJWT } from "../_utils/jwt";

const ALLOWED_EVENT_TYPES = new Set([
  "tab_view",
  "scan_start",
  "scan_complete",
  "scan_fail",
  "push_prompt_shown",
  "push_prompt_accepted",
  "push_prompt_dismissed",
  "pwa_prompt_shown",
  "pwa_prompt_accepted",
  "pwa_prompt_dismissed",
  "feature_use",
  "share_created",
  "care_briefing_requested",
  "cosmetics_classified",
  "diary_written",
  "routine_checked",
  "magazine_viewed",
  "app_open",
]);

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  if (!env.FONDAY_DB) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200, // 에러여도 클라이언트 차단 안 함
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { event_type, event_data, session_id, lang, is_guest } = body;

  // event_type allowlist 검증 (프롬프트 인젝션 방지)
  if (!ALLOWED_EVENT_TYPES.has(event_type)) {
    return new Response(JSON.stringify({ ok: false, error: "Unknown event type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // lang allowlist
  const ALLOWED_LANGS = ["ko", "en", "ja"] as const;
  const safeLang = ALLOWED_LANGS.includes(lang) ? lang : "ko";

  // JWT에서 user_id 추출 (로그인 유저면 연결)
  let userId = "";
  let isGuest = is_guest !== false ? 1 : 0;
  try {
    const cookie = request.headers.get("Cookie") ?? "";
    const match = cookie.match(/fonday_session=([^;]+)/);
    if (match) {
      const payload = await verifyJWT(match[1], env.JWT_SECRET!);
      if (payload?.sub) {
        userId = String(payload.sub);
        isGuest = 0;
      }
    }
  } catch { /* 인증 실패 시 guest로 처리 */ }

  const safeSessionId = String(session_id ?? "").slice(0, 64);
  const safeEventData = JSON.stringify(
    event_data && typeof event_data === "object" ? event_data : {}
  );

  try {
    await env.FONDAY_DB.prepare(
      "INSERT INTO events (user_id, session_id, event_type, event_data, lang, is_guest) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(userId, safeSessionId, event_type, safeEventData, safeLang, isGuest)
      .run();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    // events 테이블 미생성 시 조용히 실패
    console.error("[events]", e?.message);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
