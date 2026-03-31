import React, { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { House, History, NotebookPen, User } from "lucide-react";
import { SCAN_TO, BORDER_COLOR, TINT_WARM, DEEP_GREEN } from "./constants";
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

// ─── 탭 설정 ─────────────────────────────────────────────────────
const TAB_CONFIG: { id: TabId; icon: typeof House; labelKey: string }[] = [
  { id: "scan", icon: House, labelKey: "nav.scan" },
  { id: "routine", icon: History, labelKey: "nav.routine" },
  { id: "diary", icon: NotebookPen, labelKey: "nav.diary" },
  { id: "my", icon: User, labelKey: "nav.my" },
];

// ─── 하단 네비게이션 (배민 스타일) ───────────────────────────────
export function BottomNav({ active, onChange, scanState }: {
  active: TabId;
  onChange: (t: TabId) => void;
  scanState: ScanState;
}) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [pressedTab, setPressedTab] = useState<TabId | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; tab: TabId | null }>({ x: 0, tab: null });

  if (scanState === "survey" || scanState === "scanning") return null;

  // 슬라이드 이동: 탭 누른 채로 좌우 드래그
  const handleTouchStart = (e: React.TouchEvent, tab: TabId) => {
    touchStartRef.current = { x: e.touches[0].clientX, tab };
    setPressedTab(tab);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current.tab || !navRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dx) < 40) return; // 40px 이상 이동해야 탭 전환

    const currentIdx = TAB_CONFIG.findIndex(t => t.id === active);
    if (dx > 0 && currentIdx > 0) {
      // 오른쪽으로 드래그 → 왼쪽 탭
      haptic("light");
      onChange(TAB_CONFIG[currentIdx - 1].id);
      touchStartRef.current = { x: e.touches[0].clientX, tab: TAB_CONFIG[currentIdx - 1].id };
    } else if (dx < 0 && currentIdx < TAB_CONFIG.length - 1) {
      // 왼쪽으로 드래그 → 오른쪽 탭
      haptic("light");
      onChange(TAB_CONFIG[currentIdx + 1].id);
      touchStartRef.current = { x: e.touches[0].clientX, tab: TAB_CONFIG[currentIdx + 1].id };
    }
  }, [active, onChange]);

  const handleTouchEnd = () => {
    touchStartRef.current = { x: 0, tab: null };
    setPressedTab(null);
  };

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-md mx-auto px-3 pb-1">
        <div
          className="grid grid-cols-4 h-[60px] bg-white/95 backdrop-blur-2xl"
          style={{
            borderRadius: 20,
            boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {TAB_CONFIG.map(({ id, icon: Icon, labelKey }) => {
            const isActive = active === id;
            return (
              <motion.button
                key={id}
                onClick={() => { haptic("light"); onChange(id); }}
                onTouchStart={(e) => handleTouchStart(e, id)}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5"
                style={{ color: isActive ? SCAN_TO : "#8C8078" }}
                // 탭 누르면 위로 톡 튀어오르는 애니메이션
                animate={
                  reducedMotion ? {} :
                  isActive
                    ? { y: [4, -6, 0], scale: [0.95, 1.05, 1], transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
                    : { y: 0, scale: 1 }
                }
                whileTap={reducedMotion ? {} : { y: 2, scale: 0.9 }}
              >
                {/* 활성 배경 pill */}
                <div className="relative w-12 h-8 flex items-center justify-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: TINT_WARM }}
                        initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
                        animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
                        exit={reducedMotion ? {} : { scale: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] leading-none ${isActive ? "font-bold" : "font-medium"}`}>
                  {t(labelKey)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
