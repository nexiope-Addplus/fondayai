import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_NEUTRAL,
  BG_BASE,
  TEXT_TERTIARY,
  COLOR_WARNING,
  COLOR_INFO,
} from "./constants";
import {
  getDiaryCauseTags,
  getDiaryMemo,
  getDiaryTodoProgress,
  todayStr,
} from "./utils";
import { InlineTodos } from "./DiaryInlineTodos";
import { InlineMemo } from "./DiaryInlineMemo";

export function DiaryCalendarView({ allEntries }: { allEntries: { dateStr: string; score: number }[] }) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<{ dateStr: string; score: number } | null>(() => {
    const todayEntry = allEntries.find((entry) => entry.dateStr === todayStr());
    return todayEntry ?? null;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const scoreMap = new Map(allEntries.map(e => [e.dateStr, e.score]));

  const getScoreColor = (score: number) =>
    score >= 90 ? SCAN_TO : score >= 75 ? SCAN_FROM : score >= 60 ? "#F5C5B8" : "#FAE0DA";
  const getTextColor = (score: number) => score >= 75 ? "#fff" : SCAN_TO;

  const monthLabel = i18n.language === "ko"
    ? `${year}년 ${month + 1}월`
    : i18n.language === "ja"
    ? `${year}年${month + 1}月`
    : new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdayLabels = i18n.language === "ko"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : i18n.language === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="px-5 pb-8 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white" style={{ color: TEXT_TERTIARY }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white" style={{ color: TEXT_TERTIARY }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {weekdayLabels.map(d => (
          <div key={d} className="text-center text-xs font-bold py-1.5" style={{ color: TEXT_TERTIARY }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const score = scoreMap.get(dateStr);
          const todoProgress = getDiaryTodoProgress(dateStr);
          const memo = getDiaryMemo(dateStr);
          const tags = getDiaryCauseTags(dateStr);
          const isToday = dateStr === todayStr();
          const isSelected = selectedEntry?.dateStr === dateStr;
          return (
            <button key={dateStr}
              onClick={() => setSelectedEntry({ dateStr, score: score ?? 0 })}
              className="flex min-h-[60px] flex-col items-center justify-start py-1.5 gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
                ${isSelected ? "ring-2 ring-offset-1 ring-[#C97062]" : ""}`}
                style={score !== undefined
                  ? { background: getScoreColor(score), color: getTextColor(score) }
                  : isSelected
                  ? { background: `${SCAN_FROM}30`, border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : isToday
                  ? { border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : { color: TEXT_TERTIARY }}>
                {day}
              </div>
              {todoProgress.total > 0 ? (
                <div
                  className="min-h-[14px] rounded-full px-1.5 text-xs font-bold leading-[14px]"
                  style={{
                    background: todoProgress.done === todoProgress.total ? TINT_GREEN : TINT_NEUTRAL,
                    color: todoProgress.done === todoProgress.total ? "#059669" : "#9A8F80",
                  }}
                >
                  {todoProgress.done}/{todoProgress.total}
                </div>
              ) : (
                <div className="min-h-[14px]">
                  {score !== undefined && <div className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                </div>
              )}
              <div className="flex items-center gap-1 min-h-[10px]">
                {score !== undefined && <span className="w-1.5 h-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                {todoProgress.total > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: todoProgress.done === todoProgress.total ? "#10B981" : COLOR_WARNING }} />}
                {memo && <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR_INFO }} />}
                {tags.length > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C6E" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedEntry && (
        <motion.div initial={reducedMotion ? {} : { opacity: 0, y: 8 }} animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          className="mt-4 p-5 rounded-3xl shadow-sm" style={{ background: BG_BASE }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium tracking-wide" style={{ color: TEXT_TERTIARY }}>{selectedEntry.dateStr}</span>
            {selectedEntry.score > 0 && (
              <span className="text-[20px] font-black" style={{ color: SCAN_TO }}>{selectedEntry.score}{t("result.scoreSuffix")}</span>
            )}
          </div>
          <InlineTodos dateStr={selectedEntry.dateStr} />
          <InlineMemo dateStr={selectedEntry.dateStr} />
        </motion.div>
      )}

      <div className="mt-5 flex items-center gap-3 justify-center flex-wrap">
        {([{ label: "90+", color: SCAN_TO }, { label: "75~89", color: SCAN_FROM },
          { label: "60~74", color: "#F5C5B8" }, { label: "~59", color: "#FAE0DA" }]).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 justify-center flex-wrap">
        {[
          { label: t("modal.diary.legendRoutine"), color: "#10B981" },
          { label: t("modal.diary.legendIncomplete"), color: COLOR_WARNING },
          { label: t("modal.diary.legendMemo"), color: COLOR_INFO },
          { label: t("modal.diary.legendTag"), color: "#4A7C6E" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
