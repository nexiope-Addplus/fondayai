import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { House, History, NotebookPen, Compass, User } from "lucide-react";
import { SCAN_TO, BORDER_COLOR, TINT_WARM } from "./constants";
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
        <motion.button
          key={lang}
          onClick={() => i18nHook.changeLanguage(lang.toLowerCase())}
          className="text-[11px] font-semibold px-2 py-1.5 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={current === lang ? { color: SCAN_TO } : { color: "#C4BBB2" }}
          whileTap={{ scale: 0.9 }}
        >
          {lang}
        </motion.button>
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
        className="relative flex flex-col items-center justify-center gap-1 transition-colors"
        style={{ color: isActive ? SCAN_TO : "#8C8078" }}
      >
        <div className="w-10 h-7 flex items-center justify-center rounded-full transition-colors"
          style={isActive ? { background: TINT_WARM } : undefined}>
          {icon}
        </div>
        <span className={`text-[11px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
      </button>
    );
  };
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-2xl"
      style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-4 h-[64px]">
          {btn("scan", <House className="w-5 h-5" />, t("nav.scan"))}
          {btn("routine", <History className="w-5 h-5" />, t("nav.routine"))}
          {btn("diary", <NotebookPen className="w-5 h-5" />, t("nav.diary"))}
          {btn("my", <User className="w-5 h-5" />, t("nav.my"))}
        </div>
      </div>
    </nav>
  );
}
