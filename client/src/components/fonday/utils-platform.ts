// ─── 플랫폼 / 환경 감지 유틸 ─────────────────────────────────────────────────

// ─── 날짜 유틸 ───────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 디바이스 감지 ───────────────────────────────────────────────────────────

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

// ─── 햅틱 피드백 ────────────────────────────────────────────────────────────

export function haptic(style: "light" | "medium" | "success" = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (style) {
      case "light": navigator.vibrate(6); break;
      case "medium": navigator.vibrate(12); break;
      case "success": navigator.vibrate([8, 50, 12]); break;
    }
  } catch {}
}

export function isPWA(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone;
}

/** 토스 미니앱 환경 감지 (?toss=1 파라미터로 시뮬레이션 가능) */
export function isTossMiniApp(): boolean {
  return !!(
    (window as unknown as { __AIT__?: boolean }).__AIT__ ||
    navigator.userAgent.includes("TossApp") ||
    document.documentElement.classList.contains("toss-miniapp") ||
    new URLSearchParams(window.location.search).get("toss") === "1" ||
    localStorage.getItem("fonday_toss_mode") === "1"
  );
}

/** API base URL — 토스 미니앱은 외부 도메인 직접 호출 (프록시 없음) */
export function apiBase(): string {
  if (isTossMiniApp()) return "https://fondayai.com";
  return "";
}

/**
 * 토스 미니앱 대응 fetch wrapper
 * - 토스 WebView는 써드파티 쿠키 차단 → credentials: "include" 제거
 * - 토스 사용자 식별을 위해 X-Toss-User 헤더 추가
 */
export function appFetch(input: string, init?: RequestInit): Promise<Response> {
  if (!isTossMiniApp()) return fetch(input, init);

  const headers = new Headers(init?.headers);
  const tossHash = localStorage.getItem("fonday_toss_user_hash");
  if (tossHash) headers.set("X-Toss-User", tossHash);

  const { credentials: _, ...rest } = init || {};
  return fetch(input, { ...rest, headers, mode: "cors", credentials: "omit" });
}

// ─── 푸시 프롬프트 유틸 ───────────────────────────────────────────────────────

export function shouldShowPushPrompt(): boolean {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (typeof Notification !== "undefined" && Notification.permission === "denied") return false;
  try {
    const raw = localStorage.getItem("fonday_push_prompt");
    if (!raw) return true;
    const { dismissed, lastDismissed } = JSON.parse(raw);
    if (!dismissed) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastDismissed).getTime()) / 86400000);
    return daysSince >= 7;
  } catch { return true; }
}

export function dismissPushPrompt() {
  try {
    localStorage.setItem("fonday_push_prompt", JSON.stringify({ dismissed: true, lastDismissed: todayStr() }));
  } catch {}
}
