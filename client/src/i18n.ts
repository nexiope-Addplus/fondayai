import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import ko from "./locales/ko/translation.json";
import ja from "./locales/ja/translation.json";

const savedLang = localStorage.getItem("fonday_lang") || "en";

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
