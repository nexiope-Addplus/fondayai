import { useCallback, useRef } from "react";

/** sessionStorage key for session ID */
const SESSION_KEY = "fonday_session_id";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export type AnalyticsEventType =
  | "tab_view"
  | "scan_start"
  | "scan_complete"
  | "scan_fail"
  | "push_prompt_shown"
  | "push_prompt_accepted"
  | "push_prompt_dismissed"
  | "pwa_prompt_shown"
  | "pwa_prompt_accepted"
  | "pwa_prompt_dismissed"
  | "feature_use"
  | "share_created"
  | "care_briefing_requested"
  | "cosmetics_classified"
  | "diary_written"
  | "routine_checked"
  | "magazine_viewed"
  | "app_open";

export function useAnalytics(lang?: string, isGuest?: boolean) {
  const sessionIdRef = useRef<string>("");

  const trackEvent = useCallback(
    (eventType: AnalyticsEventType, eventData?: Record<string, unknown>) => {
      if (!sessionIdRef.current) {
        sessionIdRef.current = getOrCreateSessionId();
      }
      // 논블로킹 fire-and-forget
      fetch("/api/events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          event_data: eventData ?? {},
          session_id: sessionIdRef.current,
          lang: lang ?? "ko",
          is_guest: isGuest !== false,
        }),
      }).catch(() => {}); // 실패해도 무시
    },
    [lang, isGuest]
  );

  return { trackEvent };
}
