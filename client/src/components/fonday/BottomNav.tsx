import React from "react";
import { useTranslation } from "react-i18next";
import { House, Sparkles, BookOpen, Compass, User } from "lucide-react";
import { SCAN_TO } from "./constants";
import { haptic } from "./utils";
import type { TabId, ScanState } from "./types";

// ─── 언어 선택 버튼 ──────────────────────────────────────────────
export function LangSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const langs = ["EN", "KO", "JA"];
  const current = (i18nHook.language || "en").toUpperCase();
  return (
    <div className="flex items-center gap-0">
      {langs.map((lang) => (
        <button
          key={lang}
          onClick={() => i18nHook.changeLanguage(lang.toLowerCase())}
          className="text-[11px] font-semibold px-2 py-1.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={current === lang ? { color: SCAN_TO } : { color: "#C4BBB2" }}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

// ─── 하단 네비게이션 ──────────────────────────────────────────────
export function BottomNav({ active, onChange, scanState }: {
  active: TabId;
  onChange: (t: TabId) => void;
  scanState: ScanState;
}) {
  const { t } = useTranslation();
  if (scanState === "survey" || scanState === "scanning") return null;
  const btn = (tab: TabId, icon: React.ReactNode, label: string) => {
    const isActive = active === tab;
    return (
      <button
        key={tab}
        onClick={() => { haptic("light"); onChange(tab); }}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? "text-[#C97062]" : "text-stone-400"}`}
      >
        {icon}
        <span className="text-[12px] font-semibold leading-none">{label}</span>
        {isActive && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C97062]" />
        )}
      </button>
    );
  };
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-stone-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-4 h-[64px]">
          {btn("scan", <House className="w-5 h-5" />, t("nav.scan"))}
          {btn("routine", <Sparkles className="w-5 h-5" />, t("nav.routine"))}
          {btn("diary", <BookOpen className="w-5 h-5" />, t("nav.diary"))}
          {btn("my", <User className="w-5 h-5" />, t("nav.my"))}
        </div>
      </div>
    </nav>
  );
}
