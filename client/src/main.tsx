import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Capacitor 앱 감지: 네이티브 브릿지 or standalone 모드
const isNativeApp = !!(
  (window as any).Capacitor?.isNativePlatform?.() ||
  (window as any).webkit?.messageHandlers?.bridge ||
  navigator.userAgent.includes("Capacitor")
);
if (isNativeApp) {
  document.documentElement.classList.add("capacitor-app");
}
// 디버그: 2초 후에도 확인 (브릿지 늦게 로드되는 경우)
setTimeout(() => {
  if (!document.documentElement.classList.contains("capacitor-app")) {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      document.documentElement.classList.add("capacitor-app");
    }
  }
}, 500);

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

createRoot(document.getElementById("root")!).render(<App />);
