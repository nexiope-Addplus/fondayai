import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { House, History, NotebookPen, User, ShoppingBag } from "lucide-react";
import { SCAN_TO, BORDER_COLOR, TINT_WARM } from "./constants";
import { haptic, isTossMiniApp } from "./utils";
import type { TabId, ScanState } from "./types";

// ─── 언어 선택 버튼 (토스 미니앱에서는 숨김 — 한글 고정) ─────────
export function LangSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  if (isTossMiniApp()) return null;
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

// ─── 하단 네비게이션 (배민 스타일 — CSS transition only) ──────────
export function BottomNav({ active, onChange, scanState }: {
  active: TabId;
  onChange: (t: TabId) => void;
  scanState: ScanState;
}) {
  const { t } = useTranslation();
  if (scanState === "survey" || scanState === "scanning") return null;

  const allTabs: { id: TabId; Icon: typeof House; labelKey: string }[] = [
    { id: "scan", Icon: House, labelKey: "nav.scan" },
    { id: "recommend", Icon: ShoppingBag, labelKey: "nav.recommend" },
    { id: "routine", Icon: History, labelKey: "nav.routine" },
    { id: "diary", Icon: NotebookPen, labelKey: "nav.diary" },
    { id: "my", Icon: User, labelKey: "nav.my" },
  ];
  // 토스 미니앱: 추천탭(쿠팡 제휴) 제거 → 4탭 구성
  const tabs = isTossMiniApp() ? allTabs.filter(t => t.id !== "recommend") : allTabs;

  return (
    <nav
      className="fixed left-3 right-3 z-50 bg-white/95 backdrop-blur-2xl"
      style={{
        bottom: "calc(8px + env(safe-area-inset-bottom))",
        borderRadius: 24,
        boxShadow: "0 2px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <div className="max-w-md mx-auto px-2">
        <div className={`grid h-[60px] ${isTossMiniApp() ? "grid-cols-4" : "grid-cols-5"}`}>
          {tabs.map(({ id, Icon, labelKey }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { haptic("light"); onChange(id); }}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
                style={{ color: isActive ? SCAN_TO : "#6B5D55" }}
              >
                {/* 활성 배경 pill — CSS transition */}
                <div
                  className="w-12 h-8 flex items-center justify-center rounded-full transition-all duration-250"
                  style={{
                    background: isActive ? TINT_WARM : "transparent",
                    transform: isActive ? "scale(1)" : "scale(0.85)",
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2.2} />
                </div>
                <span className={`text-[10px] leading-none transition-all duration-200 ${isActive ? "font-bold" : "font-medium"}`}>
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
