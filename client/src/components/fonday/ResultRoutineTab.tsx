import React from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Sun, Moon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkinPredictionCard } from "./SkinPredictionCard";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_WARM,
  TINT_GREEN,
  TINT_NEUTRAL,
  BORDER_COLOR,
  FONT_DISPLAY,
  TEXT_TERTIARY,
  BG_BASE,
  TEXT_LABEL,
  TEXT_SECONDARY,
  COLOR_DANGER,
} from "./constants";
import { ResultDiaryCard } from "./ResultDiaryCard";

export function ResultRoutineTab(props: any) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const {
    showOnboarding, setShowOnboarding, history,
    questStatusDetail, nextStreakGoal, daysToGoal, nextStreakReward,
    questProgressPct, essentialQuests, setShowQuestSheet,
    morningRoutineItems, eveningRoutineItems,
    morningRoutineComplete, eveningRoutineComplete,
    setRoutinePeriodCompletion, handleDiaryEntry,
    routineGuide, cosmeticsInsights, cosmeticCount,
    user, setShowCosmeticsRegister, setShowCosmeticsGate, myCosmetics,
    overallScore, previousScore, currentStreak, onOpenDiary, prediction,
    loginPromptRef, socialLoginButton, handleGoogleLogin, goTo,
    setShowCosmeticsReport,
  } = props;

  return (
          <div className="space-y-4">

        {/* 첫 방문자 온보딩 카드 */}
        {showOnboarding && history.length === 0 && (
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: -8 }} animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            className="pt-5 mt-5 p-4 flex items-start gap-3"
            style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
          >
            <span className="text-xl shrink-0 mt-0.5">✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5C4F4A] mb-0.5">{t("result.onboarding.title")}</p>
              <p className="text-xs leading-relaxed text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{t("result.onboarding.sub")}</p>
              <button
                onClick={() => { localStorage.setItem("fonday_onboarding_done", "1"); setShowOnboarding(false); }}
                className="mt-2 text-xs font-medium rounded-full px-3 py-1"
                style={{ background: TINT_WARM, color: SCAN_TO }}
              >
                {t("result.onboarding.dismiss")}
              </button>
            </div>
          </motion.div>
        )}

        {/* 루틴 체크 카드 — 실제 피부 행동을 최상단에 */}
        <div className="space-y-1 mt-4">
          <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: TEXT_LABEL }}>{t("diary.routineTitle")}</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[13px] font-semibold leading-snug flex items-center gap-1" style={{ color: DEEP_GREEN }}>
                    <Sun className="w-3.5 h-3.5 shrink-0" />{t("cosmetics.amBtn")}: {morningRoutineItems.join(" + ")}
                  </p>
                  <p className="text-[13px] font-semibold leading-snug flex items-center gap-1" style={{ color: SCAN_TO }}>
                    <Moon className="w-3.5 h-3.5 shrink-0" />{t("cosmetics.pmBtn")}: {eveningRoutineItems.join(" + ")}
                  </p>
                </div>
                <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>{t("cosmetics.routineCoachDesc")}</p>
              </div>
              <button
                onClick={handleDiaryEntry}
                className="rounded-full h-9 px-4 text-xs font-semibold shrink-0"
                style={{ background: "rgba(74,124,110,0.08)", color: DEEP_GREEN, border: "1.5px solid rgba(74,124,110,0.2)" }}
              >
                {t("result.actionCard.diaryButton")}
              </button>
            </div>

            <div className="grid gap-3 mt-4 md:grid-cols-2">
              <button
                onClick={() => setRoutinePeriodCompletion("AM", morningRoutineItems)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left"
                style={{ background: TINT_GREEN }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sun className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
                  <p className="text-xs font-semibold truncate" style={{ color: DEEP_GREEN }}>{morningRoutineItems.join(" → ")}</p>
                </div>
                <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                  morningRoutineComplete ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                }`}>
                  {morningRoutineComplete && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>

              <button
                onClick={() => setRoutinePeriodCompletion("PM", eveningRoutineItems)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left"
                style={{ background: TINT_WARM }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Moon className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                  <p className="text-xs font-semibold truncate" style={{ color: SCAN_TO }}>{eveningRoutineItems.join(" → ")}</p>
                </div>
                <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                  eveningRoutineComplete ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                }`}>
                  {eveningRoutineComplete && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            </div>

            {(routineGuide.goodMixes.length > 0 || routineGuide.cautions.length > 0 || cosmeticsInsights.length > 0) && (
              <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_LABEL }}>{t("cosmetics.insightTitle")}</p>
                    <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.ctaCount", { count: cosmeticCount })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {myCosmetics.length > 0 && setShowCosmeticsReport && (
                      <button
                        onClick={() => setShowCosmeticsReport(true)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                        style={{ background: `${SCAN_FROM}18`, color: SCAN_TO }}
                      >
                        {t("cosmeticsReport.btnLabel")}
                      </button>
                    )}
                    <button
                      onClick={() => user ? setShowCosmeticsRegister(true) : setShowCosmeticsGate(true)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                      style={{ background: BG_BASE, color: DEEP_GREEN }}
                    >
                      + {t("cosmetics.scanBtn")}
                    </button>
                  </div>
                </div>
                {myCosmetics.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 pt-4 mt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                    <div className="py-2">
                      <p className="text-xs font-semibold" style={{ color: DEEP_GREEN }}>{t("cosmetics.goodComboTitle")}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {routineGuide.goodMixes.length > 0 ? routineGuide.goodMixes.slice(0, 3).map((item: any, index: number) => (
                          <span key={`good-mix-${index}`} className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: TINT_GREEN, color: "#059669" }}>
                            {item}
                          </span>
                        )) : (
                          <p className="text-xs mt-1" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.goodComboEmpty")}</p>
                        )}
                      </div>
                    </div>
                    <div className="py-2">
                      <p className="text-xs font-semibold" style={{ color: COLOR_DANGER }}>{t("cosmetics.cautionTitle")}</p>
                      <div className="mt-2 space-y-1.5">
                        {routineGuide.cautions.length > 0 ? routineGuide.cautions.slice(0, 2).map((item: any, index: number) => (
                          <div key={`caution-note-${index}`} className="flex items-start gap-2">
                            <span className="text-xs font-semibold mt-0.5" style={{ color: "#EA580C" }}>!</span>
                            <p className="text-xs leading-relaxed text-kr-pretty" style={{ color: TEXT_LABEL }}>{item}</p>
                          </div>
                        )) : (
                          <p className="text-xs mt-1" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.cautionEmpty")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

            {/* 피부 일기 카드 */}
            {user === undefined ? (
              <div className="h-16 rounded-3xl bg-stone-100 animate-pulse" />
            ) : user ? (
              <ResultDiaryCard
                history={history}
                overallScore={overallScore}
                previousScore={previousScore}
                streakCount={currentStreak.count || 1}
                avatar={user.avatar}
                onOpenDiary={onOpenDiary}
              />
            ) : null}

        {prediction && (
          <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
            <SkinPredictionCard
              prediction={prediction}
              currentScore={overallScore}
              onOpenDiary={handleDiaryEntry}
            />
          </div>
        )}

        {/* 퀘스트 / 미션 — 루틴 아래 (게이미피케이션) */}
        <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: TEXT_LABEL }}>{t("result.actionCard.missionEyebrow")}</p>
            <p className="text-base font-bold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("result.actionCard.title")}</p>
            <p className="text-xs mt-1.5 leading-relaxed text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{questStatusDetail}</p>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: DEEP_GREEN }}
              initial={reducedMotion ? { width: `${questProgressPct}%` } : { width: 0 }}
              animate={{ width: `${questProgressPct}%` }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-xs line-clamp-1" style={{ color: TEXT_SECONDARY }}>
              {nextStreakGoal
                ? t("result.actionCard.streakGoal", { days: daysToGoal, goal: nextStreakGoal, reward: nextStreakReward })
                : t("result.actionCard.streakDone")}
            </p>
            <button
              onClick={() => setShowQuestSheet(true)}
              className="rounded-full px-3 py-1.5 text-xs font-medium shrink-0"
              style={{ background: TINT_WARM, color: SCAN_TO }}
            >
              {t("result.actionCard.questTitle", { done: essentialQuests.filter((quest: any) => quest.done).length, total: essentialQuests.length })}
            </button>
          </div>
        </div>

          </div>
  );
}
