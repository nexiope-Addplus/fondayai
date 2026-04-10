import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Capacitor 앱: CSS 변수로 safe area 값 설정 (env()가 안 먹는 경우 대비)
if ((window as any).Capacitor?.isNativePlatform?.()) {
  document.documentElement.classList.add("capacitor-app");
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

createRoot(document.getElementById("root")!).render(<App />);
