import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { DEEP_GREEN, SCAN_TO } from "./constants";
import { getAttendance, todayStr } from "./utils";

export function AttendanceCalendarModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const data = getAttendance();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const thisMonthCount = data.dates.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      <motion.div key="att-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40" onClick={onClose} />
      <motion.div key="att-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto px-5 pb-10 pt-6">
        {/* 핸들 */}
        <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold" style={{ color: DEEP_GREEN }}>{t("attendance.calendarTitle")}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: "#F59E0B" }}>
              {t("attendance.totalPoints", { n: data.totalPoints })}
            </span>
          </div>
        </div>
        <p className="text-[12px] text-stone-400 mb-4">{t("attendance.thisMonth", { n: thisMonthCount })}</p>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {["일","월","화","수","목","금","토"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-stone-400 py-1">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const checked = data.dates.includes(dateStr);
            const isToday = dateStr === todayStr();
            return (
              <div key={dateStr} className="flex flex-col items-center py-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                  ${checked ? "text-white" : isToday ? "text-[#C97062] border border-[#C97062]" : "text-stone-600"}`}
                  style={checked ? { background: "linear-gradient(135deg, #E09882, #C97062)" } : {}}>
                  {day}
                </div>
                {checked && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: SCAN_TO }} />}
              </div>
            );
          })}
        </div>

        <button onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl text-[14px] font-bold text-stone-500 bg-stone-100">
          {t("attendance.close")}
        </button>
      </motion.div>
    </>
  );
}
