// ─── 색상 상수 ────────────────────────────────────────────────────────────────

export const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B",
  D: "#3B82F6",
  S: "#EF4444",
  R: "#10B981",
  P: "#8B5CF6",
  N: "#06B6D4",
  W: "#6366F1",
  T: "#14B8A6",
};

export const DEEP_GREEN = "#4A7C6E";
export const DEEP_GREEN_LIGHT = "#5E9688";
export const TEXT_SECONDARY = "#8C8078";
export const TEXT_TERTIARY = "#B0A898";
export const SCAN_FROM = "#E09882";
export const SCAN_TO = "#C97062";
export const TINT_WARM = "#FDF4F1";
export const TINT_GREEN = "#EDF5F2";
export const TINT_NEUTRAL = "#F0F0F1";

// ─── DESIGN.md 디자인 토큰 ────────────────────────────────────────────────────
export const BG_BASE = "#FFFFFF";
export const BG_MUTED = "#F5F8F6";
export const BORDER_COLOR = "#EBEBEB";
// 토스 미니앱 감지 (폰트 결정용 — utils.ts isTossMiniApp()과 동일 조건)
const _isToss = typeof window !== "undefined" && (
  !!(window as unknown as { __AIT__?: boolean }).__AIT__ ||
  navigator.userAgent.includes("TossApp") ||
  document.documentElement.classList.contains("toss-miniapp") ||
  new URLSearchParams(window.location.search).get("toss") === "1" ||
  localStorage.getItem("fonday_toss_mode") === "1"
);
const _TOSS_FONT = "'Toss Product Sans', 'Tossface', 'SF Pro KR', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
export const FONT_DISPLAY = _isToss ? _TOSS_FONT : "'LINESeedKR', Pretendard, sans-serif";
export const FONT_HEADING = _isToss ? _TOSS_FONT : "'LINESeedKR', Pretendard, sans-serif";

// Shadow 토큰
export const SHADOW_CARD = "0 0 0 1px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)";
export const SHADOW_ELEVATED = "0 8px 32px rgba(0,0,0,0.10)";

// Border-radius 토큰
export const RADIUS_CARD = 20;
export const RADIUS_SUB = 16;
export const RADIUS_ITEM = 12;
export const RADIUS_PILL = 9999;

// 페이지 배경
export const PAGE_GRADIENT = "#FFFFFF";

// 텍스트 계층 (DESIGN.md 기준)
export const TEXT_HEADING = "#4A403A";
export const TEXT_TITLE = "#5C4F4A";
export const TEXT_LABEL = "#6B5D55";

// Semantic accent colors
export const COLOR_SUCCESS = "#2D7D46";
export const COLOR_WARNING = "#D97706";
export const COLOR_DANGER = "#C2410C";
export const COLOR_INFO = "#7C3AED";

// ─── z-index 스케일 ──────────────────────────────────────────────────────────
export const Z = {
  actionBar: 50,   // ResultActionBar / BottomNav
  sheet: 100,      // detail sheets (RoutineTab selectedItem)
  questSheet: 120, // ResultQuestSheet
  modal: 200,      // modals (CosmeticsRegisterModal, AttendanceCalendar)
  camera: 200,     // CameraCapture overlay
  pwa: 210,        // PWA install prompt
  push: 990,       // push notification banner
  overlay: 999,    // full-screen overlays
} as const;

// ─── Barrel re-exports ───────────────────────────────────────────────────────
export * from "./constants-scores";
export * from "./constants-features";
export * from "./constants-magazine";
