import React from "react";
import { useTranslation } from "react-i18next";
import { House, Droplets, BookOpen, Search, User } from "lucide-react";
import { SCAN_TO } from "./constants";
import type { TabId, ScanState } from "./types";

// ─── 언어 선택 버튼 ──────────────────────────────────────────────
export function LangSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const langs = ["EN", "KO", "JA"];
  const current = (i18nHook.language || "en").toUpperCase();
  return (
    <div className="flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
      {langs.map((lang) => (
        <button
          key={lang}
          onClick={() => i18nHook.changeLanguage(lang.toLowerCase())}
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-all"
          style={current === lang ? { color: SCAN_TO } : { color: "#B0A898" }}
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
  const btn = (tab: TabId, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange(tab)}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active === tab ? "text-[#C97062]" : "text-stone-400"}`}>
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-stone-100">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-5 h-[64px]">
          {btn("scan", <House className="w-5 h-5" />, t("nav.scan"))}
          {btn("routine", <Droplets className="w-5 h-5" />, t("nav.routine"))}
          {btn("diary", <BookOpen className="w-5 h-5" />, t("nav.diary"))}
          {btn("magazine", <Search className="w-5 h-5" />, t("nav.magazine"))}
          {btn("my", <User className="w-5 h-5" />, t("nav.my"))}
        </div>
      </div>
    </nav>
  );
}
