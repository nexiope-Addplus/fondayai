import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays } from "lucide-react";
import { SCAN_FROM, SCAN_TO } from "./constants";
import { getAttendance, todayStr } from "./utils";

// ─── 체크인 성공 팝업 ─────────────────────────────────────────────
export function CheckinSuccessSheet({ onKakao, onLine, onGoogle, onDismiss, user }: {
  onKakao: () => void;
  onLine: () => void;
  onGoogle: () => void;
  onDismiss: () => void;
  user: any;
}) {
  const { t, i18n } = useTranslation();
  const data = getAttendance();

  return (
    <>
      <motion.div key="ci-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40" onClick={onDismiss} />
      <motion.div key="ci-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto px-5 pb-10 pt-6">
        <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />

        {/* 타이틀 */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 mb-1">{t("attendance.title")}</h2>
        </div>

        {!user && (
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-[13px] font-semibold text-stone-600 mb-0.5">{t("attendance.stored")}</p>
            <p className="text-[12px] text-stone-400 whitespace-pre-line">{t("attendance.loginDesc")}</p>
          </div>
        )}

        {!user ? (
          <div className="flex flex-col gap-2.5">
            {i18n.language === "ko" ? (
              <button onClick={onKakao}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-stone-800 flex items-center justify-center gap-2"
                style={{ background: "#FEE500" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                {t("attendance.kakao")}
              </button>
            ) : (
              <button onClick={onLine}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "#06C755" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                {t("attendance.line")}
              </button>
            )}
            <button onClick={onGoogle}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-stone-700 flex items-center justify-center gap-2 bg-white">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
              {t("attendance.google")}
            </button>
            <button onClick={onDismiss}
              className="w-full py-2.5 text-[13px] font-semibold text-stone-400">
              {t("attendance.later")}
            </button>
          </div>
        ) : (
          <button onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
            {t("attendance.close")}
          </button>
        )}
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
      className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm transition-all active:scale-95">
      <CalendarDays className="w-3.5 h-3.5" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }} />
      <span className="text-xs font-bold" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }}>
        {checkedToday ? t("attendance.alreadyChecked") : t("attendance.checkIn")}
      </span>
    </button>
  );
}
