import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sun, Moon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEEP_GREEN, SCAN_FROM, SCAN_TO, TINT_WARM, TINT_GREEN, TINT_NEUTRAL, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";
import { ResultDiaryCard } from "./ResultDiaryCard";
import { ResultLoginCard } from "./ResultLoginCard";

export function ResultRoutineTab(props: any) {
  const { t } = useTranslation();
  const {
    showOnboarding, setShowOnboarding, history,
    questStatusDetail, nextStreakGoal, daysToGoal, nextStreakReward,
    questProgressPct, essentialQuests, setShowQuestSheet,
    morningRoutineItems, eveningRoutineItems,
    morningRoutineComplete, eveningRoutineComplete,
    setRoutinePeriodCompletion, handleDiaryEntry,
    routineGuide, cosmeticsInsights, cosmeticCount,
    user, setShowCosmeticsRegister, setShowCosmeticsGate, myCosmetics,
    overallScore, previousScore, currentStreak, onOpenDiary,
    loginPromptRef, socialLoginButton, handleGoogleLogin, goTo,
    setShowCosmeticsReport,
  } = props;

  return (
          <div className="space-y-4">

        {/* 첫 방문자 온보딩 카드 */}
        {showOnboarding && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 flex items-start gap-3"
            style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
          >
            <span className="text-xl shrink-0 mt-0.5">✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5C4F4A] mb-0.5">{t("result.onboarding.title")}</p>
              <p className="text-xs text-stone-500 leading-relaxed text-kr-pretty">{t("result.onboarding.sub")}</p>
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

        {/* 퀘스트 / 미션 카드 */}
        <Card className="rounded-3xl overflow-hidden bg-white" style={{ border: `1px solid ${BORDER_COLOR}` }}>
          <CardContent className="p-3.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("result.actionCard.missionEyebrow")}</p>
              <p className="text-base font-semibold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("result.actionCard.title")}</p>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed text-kr-pretty">{questStatusDetail}</p>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: DEEP_GREEN }}
                initial={{ width: 0 }}
                animate={{ width: `${questProgressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 mt-3">
              <p className="text-xs text-stone-500 line-clamp-1">
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
          </CardContent>
        </Card>

        {/* 루틴 체크 카드 */}
        <Card className="rounded-3xl overflow-hidden bg-white" style={{ border: `1px solid ${BORDER_COLOR}` }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("diary.routineTitle")}</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[13px] font-semibold leading-snug flex items-center gap-1" style={{ color: DEEP_GREEN }}>
                    <Sun className="w-3.5 h-3.5 shrink-0" />{t("cosmetics.amBtn")}: {morningRoutineItems.join(" + ")}
                  </p>
                  <p className="text-[13px] font-semibold leading-snug flex items-center gap-1" style={{ color: SCAN_TO }}>
                    <Moon className="w-3.5 h-3.5 shrink-0" />{t("cosmetics.pmBtn")}: {eveningRoutineItems.join(" + ")}
                  </p>
                </div>
                <p className="text-xs text-stone-500 mt-1">{t("cosmetics.routineCoachDesc")}</p>
              </div>
              <Button
                onClick={handleDiaryEntry}
                className="rounded-full h-8 px-3 text-xs font-semibold shadow-none shrink-0"
                style={{ background: TINT_NEUTRAL, color: DEEP_GREEN }}
              >
                {t("result.actionCard.diaryButton")}
              </Button>
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
              <div className="mt-4 rounded-3xl p-4" style={{ background: TINT_NEUTRAL }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("cosmetics.insightTitle")}</p>
                    <p className="text-xs text-stone-400">{t("cosmetics.ctaCount", { count: cosmeticCount })}</p>
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
                      style={{ background: "#FFFFFF", color: DEEP_GREEN }}
                    >
                      + {t("cosmetics.scanBtn")}
                    </button>
                  </div>
                </div>
                {myCosmetics.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-3xl p-3" style={{ background: "#FFFFFF" }}>
                      <p className="text-xs font-semibold" style={{ color: DEEP_GREEN }}>{t("cosmetics.goodComboTitle")}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {routineGuide.goodMixes.length > 0 ? routineGuide.goodMixes.slice(0, 3).map((item: any, index: number) => (
                          <span key={`good-mix-${index}`} className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: TINT_GREEN, color: "#059669" }}>
                            {item}
                          </span>
                        )) : (
                          <p className="text-xs text-stone-400 mt-1">{t("cosmetics.goodComboEmpty")}</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-3xl p-3" style={{ background: "#FFFFFF" }}>
                      <p className="text-xs font-semibold" style={{ color: "#C2410C" }}>{t("cosmetics.cautionTitle")}</p>
                      <div className="mt-2 space-y-1.5">
                        {routineGuide.cautions.length > 0 ? routineGuide.cautions.slice(0, 2).map((item: any, index: number) => (
                          <div key={`caution-note-${index}`} className="flex items-start gap-2">
                            <span className="text-xs font-semibold mt-0.5" style={{ color: "#EA580C" }}>!</span>
                            <p className="text-xs text-stone-600 leading-relaxed text-kr-pretty">{item}</p>
                          </div>
                        )) : (
                          <p className="text-xs text-stone-400 mt-1">{t("cosmetics.cautionEmpty")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

            {/* 피부 일기 카드 / 로그인 카드 */}
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
            ) : (
              <ResultLoginCard
                loginPromptRef={loginPromptRef}
                socialLoginButton={socialLoginButton}
                onGoogleLogin={handleGoogleLogin}
                onGoSolution={() => goTo("solution")}
              />
        )}

          </div>
  );
}
