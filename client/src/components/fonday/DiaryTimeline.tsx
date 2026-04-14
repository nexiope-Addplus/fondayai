import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Activity } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TEXT_SECONDARY,
  COLOR_INFO,
} from "./constants";
import { todayStr } from "./utils";
import { InlineMemo } from "./DiaryInlineMemo";

export function DiaryTimeline({ history, analysisResult, overallScore, finalType, currentScanId }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string; currentScanId: string | null;
}) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();

  const todayEntry = {
    id: currentScanId || "today",
    dateStr: todayStr(),
    date: new Date(),
    score: overallScore,
    baumannType: finalType,
    skinAge: analysisResult?.skinAge,
    aiComment: analysisResult?.aiComment,
    isToday: true,
  };

  const historyEntries = history
    .filter((h: any) => h.id !== currentScanId)
    .map((h: any) => ({
      id: h.id,
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      date: new Date(h.createdAt),
      score: parseInt(h.overallScore),
      baumannType: h.baumannType,
      skinAge: h.skinAge,
      aiComment: h.aiComment,
      isToday: false,
    }));

  const allEntries = [todayEntry, ...historyEntries];

  // 월별 그룹핑
  type EntryType = typeof todayEntry;
  const grouped: { monthKey: string; monthLabel: string; entries: EntryType[] }[] = [];
  for (const entry of allEntries) {
    const mk = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    let group = grouped.find(g => g.monthKey === mk);
    if (!group) {
      const y = entry.date.getFullYear();
      const m = entry.date.getMonth() + 1;
      const label = i18n.language === "ko" ? `${y}년 ${m}월`
        : i18n.language === "ja" ? `${y}年${m}月`
        : entry.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      group = { monthKey: mk, monthLabel: label, entries: [] };
      grouped.push(group);
    }
    group.entries.push(entry);
  }

  // 비교 요약
  const prevScan = history[0];
  const prevScores = prevScan ? (() => { try { return JSON.parse(prevScan.scores || "[]"); } catch { return []; } })() : [];
  const currentScores = analysisResult?.scores || [];
  const improved = currentScores.filter((s: any, idx: number) => s.score > (prevScores[idx]?.score || 0)).length;
  const declined = currentScores.filter((s: any, idx: number) => s.score < (prevScores[idx]?.score || 0)).length;
  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <div className="px-5 pb-8 pt-4">
      {/* 점수 추이 그래프 */}
      {history.length >= 1 && (
        <div className="mb-5">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: TEXT_TERTIARY }}>{t("modal.diary.graphTitle")}</p>
          <div className="h-36 rounded-3xl bg-white px-2 pt-2"
            style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.06)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...historyEntries.slice().reverse().map(e => ({
                date: e.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" }),
                score: e.score,
              })), { date: t("modal.diary.today"), score: overallScore }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "9px" }} />
                <YAxis domain={[0, 100]} ticks={[0,25,50,75,100]} axisLine={false} tickLine={false} style={{ fontSize: "9px" }} width={22} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2.5}
                  dot={{ r: 4, fill: SCAN_TO, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 비교 요약 배지 */}
      {history.length >= 1 && prevScores.length > 0 && (improved > 0 || declined > 0) && (
        <div className="mb-5 px-4 py-2.5 rounded-2xl flex items-center gap-2"
          style={{ background: `${DEEP_GREEN}08`, border: `1px solid ${DEEP_GREEN}15` }}>
          <Activity className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
          <p className="text-[12px] font-semibold" style={{ color: DEEP_GREEN }}>
            {t("compare.summary", { improved, declined })}
          </p>
        </div>
      )}

      {/* 월별 타임라인 */}
      {grouped.map((group, gi) => (
        <div key={group.monthKey} className={gi > 0 ? "mt-6" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-4 bg-stone-200" />
            <span className="text-xs font-bold tracking-widest uppercase whitespace-nowrap" style={{ color: TEXT_TERTIARY }}>
              {group.monthLabel}
            </span>
            <div className="h-[1px] flex-1 bg-stone-200" />
          </div>

          <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-0 w-[1.5px] bg-stone-200" />
            <div className="space-y-4">
              {group.entries.map((entry, ei) => {
                const dateLabel = entry.isToday
                  ? `${t("modal.diary.today")} · ${entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" })}`
                  : entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" });
                return (
                  <motion.div key={entry.id}
                    initial={reducedMotion ? {} : { opacity: 0, x: -8 }} animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
                    transition={reducedMotion ? {} : { delay: (gi * 5 + ei) * 0.05 }}
                    className="flex gap-3 items-start">
                    <div className="shrink-0 w-4 flex flex-col items-center pt-3 z-[1]">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ background: entry.isToday ? SCAN_TO : "#D4C5BC",
                          boxShadow: `0 0 0 2px ${entry.isToday ? SCAN_TO + "30" : "#E8E0D820"}` }} />
                    </div>
                    <div className="flex-1 rounded-3xl p-4 border"
                      style={{
                        background: entry.isToday ? "#FFFAF9" : "#FFFFFF",
                        borderColor: entry.isToday ? `${SCAN_FROM}50` : "#F0EDE8",
                        boxShadow: "0 2px 16px rgba(180,130,110,0.07)",
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium tracking-wide" style={{ color: TEXT_TERTIARY }}>{dateLabel}</span>
                        <div className="flex items-center gap-1.5">
                          {entry.skinAge && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#A78BFA15", color: COLOR_INFO }}>
                              {t("modal.diary.skinAgeLabel", { age: entry.skinAge })}
                            </span>
                          )}
                          <span className="text-[20px] font-black leading-none"
                            style={{ color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>{entry.score}</span>
                        </div>
                      </div>
                      {entry.baumannType && (
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                          style={{ background: entry.isToday ? `${SCAN_FROM}20` : `${DEEP_GREEN}10`,
                            color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>
                          {t("modal.diary.baumannLabel", { type: entry.baumannType })}
                        </span>
                      )}
                      {entry.aiComment && (
                        <p className="text-[12px] leading-relaxed italic" style={{ color: TEXT_SECONDARY }}>"{entry.aiComment}"</p>
                      )}
                      <InlineMemo dateStr={entry.dateStr} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
