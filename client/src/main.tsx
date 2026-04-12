import { createRoot } from "react-dom/client";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import App from "./App";
import "./index.css";
import "./i18n";

// 토스 미니앱 환경 감지
const isTossMiniApp = !!(
  (window as any).__AIT__ ||
  navigator.userAgent.includes("TossApp")
);

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

// 네이티브 앱: 모든 fetch에 Bearer 토큰 자동 첨부
const _fetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const token = localStorage.getItem("fonday_app_token");
  if (token) {
    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return _fetch(input, { ...init, headers });
  }
  return _fetch(input, init);
};

createRoot(document.getElementById("root")!).render(
  <TDSMobileAITProvider>
    <App />
  </TDSMobileAITProvider>
);
