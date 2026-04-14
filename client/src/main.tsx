import { createRoot } from "react-dom/client";
import { lazy, Suspense, type ReactNode } from "react";
import App from "./App";
import "./index.css";
import "./i18n";

// 토스 미니앱 환경 감지 (?toss=1 파라미터로 시뮬레이션 가능)
const isTossMiniApp = !!(
  (window as any).__AIT__ ||
  navigator.userAgent.includes("TossApp") ||
  new URLSearchParams(window.location.search).get("toss") === "1" ||
  localStorage.getItem("fonday_toss_mode") === "1"
);
// URL 파라미터로 진입 시 localStorage에 저장 (새로고침해도 유지)
if (new URLSearchParams(window.location.search).get("toss") === "1") {
  localStorage.setItem("fonday_toss_mode", "1");
}

// Capacitor 앱 감지 (토스 미니앱이 아닌 경우만)
if (!isTossMiniApp) {
  const isNativeApp = !!(
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).webkit?.messageHandlers?.bridge ||
    navigator.userAgent.includes("Capacitor")
  );
  if (isNativeApp) {
    document.documentElement.classList.add("capacitor-app");
  }
  setTimeout(() => {
    if (!document.documentElement.classList.contains("capacitor-app")) {
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        document.documentElement.classList.add("capacitor-app");
      }
    }
  }, 500);
}

// 토스 미니앱: toss-miniapp 클래스 추가
if (isTossMiniApp) {
  document.documentElement.classList.add("toss-miniapp");
}

// fetch 인터셉터: 토스 미니앱은 X-Toss-User 헤더, 네이티브 앱은 Bearer 토큰
const _fetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const headers = new Headers(init?.headers);

  if (isTossMiniApp) {
    // 토스 미니앱: 쿠키 불가 → 토스 유저 hash를 헤더로 전달
    const tossHash = localStorage.getItem("fonday_toss_user_hash");
    if (tossHash && !headers.has("X-Toss-User")) {
      headers.set("X-Toss-User", tossHash);
    }
  } else {
    // 네이티브 앱: Bearer 토큰
    const token = localStorage.getItem("fonday_app_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return _fetch(input, { ...init, headers });
};

// TDS Provider is only loaded inside Toss miniapp — crashes outside Toss
const TossWrapper = lazy(() =>
  import("@toss/tds-mobile-ait").then((m) => ({
    default: ({ children }: { children: ReactNode }) => (
      <m.TDSMobileAITProvider>{children}</m.TDSMobileAITProvider>
    ),
  }))
);

const Root = isTossMiniApp ? (
  <Suspense fallback={null}>
    <TossWrapper>
      <App />
    </TossWrapper>
  </Suspense>
) : (
  <App />
);

createRoot(document.getElementById("root")!).render(Root);
