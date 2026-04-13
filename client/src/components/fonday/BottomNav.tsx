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
  const isToss = isTossMiniApp();

  const allTabs: { id: TabId; Icon: typeof House; labelKey: string }[] = [
    { id: "scan", Icon: House, labelKey: "nav.scan" },
    { id: "recommend", Icon: ShoppingBag, labelKey: "nav.recommend" },
    { id: "routine", Icon: History, labelKey: "nav.routine" },
    { id: "diary", Icon: NotebookPen, labelKey: "nav.diary" },
    { id: "my", Icon: User, labelKey: "nav.my" },
  ];
  // 토스 미니앱: 추천탭(쿠팡 제휴) 제거 → 4탭 구성
  const tabs = isToss ? allTabs.filter(t => t.id !== "recommend") : allTabs;

  return (
    <nav
      className={`fixed z-50 bg-white ${isToss ? "left-0 right-0 border-t" : "left-3 right-3"}`}
      style={{
        bottom: isToss ? 0 : "calc(8px + env(safe-area-inset-bottom))",
        paddingBottom: isToss ? "env(safe-area-inset-bottom)" : undefined,
        borderTopColor: isToss ? BORDER_COLOR : undefined,
        borderRadius: isToss ? 0 : 24,
        boxShadow: isToss ? "0 -1px 0 rgba(0,0,0,0.04)" : "0 2px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <div className={`max-w-md mx-auto ${isToss ? "px-1" : "px-2"}`}>
        <div className={`grid ${isToss ? "h-[58px]" : "h-[60px]"} ${isToss ? "grid-cols-4" : "grid-cols-5"}`}>
          {tabs.map(({ id, Icon, labelKey }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { haptic("light"); onChange(id); }}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${isToss ? "gap-0" : "gap-0.5"}`}
                style={{ color: isActive ? SCAN_TO : "#6B5D55" }}
              >
                <div
                  className={`flex items-center justify-center transition-all duration-250 ${isToss ? "w-10 h-7 rounded-2xl" : "w-12 h-8 rounded-full"}`}
                  style={{
                    background: isActive ? TINT_WARM : "transparent",
                    transform: isActive ? "scale(1)" : `scale(${isToss ? 1 : 0.85})`,
                    opacity: isActive ? 1 : isToss ? 0.92 : 0.8,
                  }}
                >
                  <Icon className={`${isToss ? "w-[18px] h-[18px]" : "w-5 h-5"}`} strokeWidth={isActive ? 2.4 : 2.1} />
                </div>
                <span className={`leading-none transition-all duration-200 ${isToss ? "text-[10px] mt-0.5" : "text-[11px]"} ${isActive ? "font-bold" : "font-medium"}`}>
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
