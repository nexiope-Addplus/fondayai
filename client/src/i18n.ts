import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import ko from "./locales/ko/translation.json";
import ja from "./locales/ja/translation.json";

// URL ?lang= 파라미터 우선 (OAuth 콜백에서 언어 복원용)
const urlLang = new URLSearchParams(window.location.search).get("lang");
const cookieLang = document.cookie.match(/fonday_lang=(\w+)/)?.[1];
// 브라우저/시스템 언어 감지 (ko, ja, en)
function detectBrowserLang(): string {
  const nav = navigator.language || (navigator as any).userLanguage || "";
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("ja")) return "ja";
  return "en";
}
// 토스 미니앱: 한글 강제
const isToss = !!((window as any).__AIT__ || navigator.userAgent.includes("TossApp"));
const savedLang = isToss ? "ko" : (urlLang || localStorage.getItem("fonday_lang") || cookieLang || detectBrowserLang());
if (urlLang) localStorage.setItem("fonday_lang", urlLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("fonday_lang", lng);
});

export default i18n;
