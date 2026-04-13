import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, CalendarDays } from "lucide-react";
import { BORDER_COLOR, DEEP_GREEN, SCAN_FROM, SCAN_TO, TEXT_TERTIARY, TINT_GREEN } from "./constants";
import type { AppUser } from "./types";
import { getAttendance, todayStr } from "./utils";

// ─── 체크인 성공 팝업 ─────────────────────────────────────────────
export function CheckinSuccessSheet({ onKakao, onLine, onGoogle, onDismiss, user }: {
  onKakao: () => void;
  onLine: () => void;
  onGoogle: () => void;
  onDismiss: () => void;
  user: AppUser | null;
}) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const data = getAttendance();

  return (
    <>
      <motion.div key="ci-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40" onClick={onDismiss} />
      <motion.div key="ci-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl max-w-md mx-auto px-5 pt-6"
        style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom))", borderTop: `1px solid ${BORDER_COLOR}` }}>
        <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />

        {/* 타이틀 */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: TINT_GREEN }}>
            <Flame className="w-7 h-7" style={{ color: DEEP_GREEN }} />
          </div>
          <h2 className="text-lg font-semibold text-[#5C4F4A] mb-1">{t("attendance.title")}</h2>
        </div>

        <button onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
          {t("attendance.close")}
        </button>
      </motion.div>
    </>
  );
}

// ─── 출석 배지 버튼 (좌상단) ──────────────────────────────────────
export function AttendanceBadge({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const data = getAttendance();
  const today = todayStr();
  const checkedToday = data.dates.includes(today);
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 bg-white/80 rounded-full px-2.5 py-1.5 border transition-all active:scale-95"
      style={{ borderColor: BORDER_COLOR }}>
      <CalendarDays className="w-3.5 h-3.5" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }} />
      <span className="text-xs font-semibold" style={{ color: checkedToday ? SCAN_TO : TEXT_TERTIARY }}>
        {checkedToday ? t("attendance.alreadyChecked") : t("attendance.checkIn")}
      </span>
    </button>
  );
}
