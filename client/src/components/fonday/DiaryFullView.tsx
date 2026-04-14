import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { RankingData } from "./types";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TEXT_SECONDARY,
  COLOR_WARNING,
} from "./constants";
import { todayStr } from "./utils";
import { DiaryTimeline } from "./DiaryTimeline";
import { DiaryCalendarView } from "./DiaryCalendarView";

export function DiaryFullView({ history, analysisResult, overallScore, finalType, currentScanId, rankingData, user, onClose, onLogout }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string;
  currentScanId: string | null; rankingData: RankingData | null;
  user: any; onClose: () => void; onLogout: () => void;
}) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<"timeline" | "calendar" | "ranking">("timeline");

  const allEntries: { dateStr: string; score: number }[] = [
    { dateStr: todayStr(), score: overallScore },
    ...history.filter((h: any) => h.id !== currentScanId).map((h: any) => ({
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      score: parseInt(h.overallScore),
    })),
  ];

  const tabs: { id: "timeline" | "calendar" | "ranking"; label: string }[] = [
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "calendar", label: t("modal.diary.calendarTab") },
    { id: "ranking", label: t("modal.diary.rankingTab") },
  ];

  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col max-w-md mx-auto"
      style={{ background: "#F8F5F2" }}
      initial={reducedMotion ? {} : { x: "100%" }} animate={reducedMotion ? {} : { x: 0 }} exit={reducedMotion ? {} : { x: "100%" }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 300 }}>

      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-1.5 active:opacity-70" style={{ color: TEXT_SECONDARY }}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("modal.diary.title")}</span>
          </button>
          <div className="flex items-center gap-2">
            {user?.avatar && <img src={user.avatar} alt="" aria-hidden="true" className="w-7 h-7 rounded-full" />}
            <button onClick={onLogout} className="text-xs underline" style={{ color: TEXT_TERTIARY }}>
              {t("modal.diary.logout")}
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-[12px] font-bold transition-all border-b-2 ${
                tab === id ? "border-[#C97062] text-[#C97062]" : "border-transparent"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {tab === "timeline" && (
            <motion.div key="tl" initial={reducedMotion ? {} : { opacity: 0 }} animate={reducedMotion ? {} : { opacity: 1 }} exit={reducedMotion ? {} : { opacity: 0 }}>
              <DiaryTimeline history={history} analysisResult={analysisResult}
                overallScore={overallScore} finalType={finalType} currentScanId={currentScanId} />
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div key="cal" initial={reducedMotion ? {} : { opacity: 0 }} animate={reducedMotion ? {} : { opacity: 1 }} exit={reducedMotion ? {} : { opacity: 0 }}>
              <DiaryCalendarView allEntries={allEntries} />
            </motion.div>
          )}
          {tab === "ranking" && (
            <motion.div key="rank" initial={reducedMotion ? {} : { opacity: 0 }} animate={reducedMotion ? {} : { opacity: 1 }} exit={reducedMotion ? {} : { opacity: 0 }}>
              <div className="px-5 pb-8 space-y-4 pt-4">
                {!rankingData ? (
                  <div className="py-12 text-center" style={{ color: TEXT_TERTIARY }}><p className="text-[12px]">...</p></div>
                ) : (
                  <>
                    {rankingData.myPercentile !== undefined ? (
                      <div className="p-5 rounded-2xl text-center"
                        style={{ background: `linear-gradient(135deg, ${SCAN_FROM}20, ${SCAN_TO}10)` }}>
                        <p className="text-xs mb-1" style={{ color: TEXT_SECONDARY }}>{t("ranking.myRankLabel")}</p>
                        <p className="text-4xl font-black" style={{ color: SCAN_TO }}>
                          {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                        </p>
                        <p className="text-xs mt-1" style={{ color: TEXT_TERTIARY }}>{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl text-center bg-stone-50">
                        <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>{t("ranking.loginForRank")}</p>
                        <p className="text-xs mt-1" style={{ color: TEXT_TERTIARY }}>{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold mb-3" style={{ color: TEXT_TERTIARY }}>{t("ranking.distribution")}</p>
                      <div className="space-y-3">
                        {rankingData.scoreDistribution.map((band, bi) => {
                          const maxCount = Math.max(...rankingData.scoreDistribution.map(d => d.count), 1);
                          const barPct = Math.round((band.count / maxCount) * 100);
                          const [bMin, bMax] = band.label.split("-").map(Number);
                          const isMyBand = overallScore >= bMin && overallScore <= bMax;
                          return (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-xs w-14 shrink-0" style={{ color: TEXT_TERTIARY }}>{band.label}</span>
                              <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.max(barPct, band.count > 0 ? 6 : 0)}%`,
                                    background: isMyBand ? `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` : "#D1D5DB" }} />
                              </div>
                              <span className="text-xs w-5 text-right" style={{ color: TEXT_TERTIARY }}>{band.count}</span>
                              {isMyBand && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: `${SCAN_FROM}30`, color: SCAN_TO }}>{t("ranking.me")}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {Object.keys(rankingData.baumannDistribution).length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-2" style={{ color: TEXT_TERTIARY }}>{t("ranking.topBaumann")}</p>
                        <div className="flex gap-2">
                          {Object.entries(rankingData.baumannDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([type, count], ri) => (
                              <div key={type} className="flex-1 p-3 rounded-2xl text-center bg-white">
                                <span className="text-[13px]">{["🥇","🥈","🥉"][ri]}</span>
                                <p className="text-lg font-bold mt-0.5" style={{ color: SCAN_TO }}>{type}</p>
                                <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{count as number}{t("ranking.people")}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-white text-center">
                        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("ranking.avgScore")}</p>
                        <p className="text-xl font-black" style={{ color: DEEP_GREEN }}>{rankingData.avgScore}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white text-center">
                        <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("ranking.topScore")}</p>
                        <p className="text-xl font-black" style={{ color: COLOR_WARNING }}>{rankingData.topScore}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
