import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRewardedAd, TossBannerAd } from "./TossAd";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Sparkles, Leaf, Utensils, CheckCircle2,
} from "lucide-react";
import {
  BG_BASE, BG_MUTED, DEEP_GREEN, SCAN_TO,
  TINT_WARM, TINT_GREEN,
  stagger,
  PAGE_GRADIENT, TEXT_TITLE, TEXT_SECONDARY, COLOR_INFO,
} from "./constants";
import type { CosmeticItem, StreakData, RankingData, MissionState, TodoItem } from "./types";
import {
  todayStr, getStreak, getMissions, checkCosmeticMissions,
  getDiaryMemo, getDiaryTodos, getDiaryTodoProgress,
  markChallengeUsed, openContactsViral,
  isTossMiniApp, apiBase, appFetch,
} from "./utils";
import { share as tossShare } from "@apps-in-toss/web-framework";
import { ResultActionBar } from "./ResultActionBar";
import { ResultRoutineTab } from "./ResultRoutineTab";
import { ResultSolutionTab } from "./ResultSolutionTab";
import { ResultNutritionTab } from "./ResultNutritionTab";
import { useAICareSettings } from "./useAICareSettings";
import { ResultHeaderCard } from "./ResultHeaderCard";
import { ResultOverlayPopups } from "./ResultOverlayPopups";
import { ResultModals } from "./ResultModals";
import { CosmeticsReportCard } from "./CosmeticsReportCard";
import { useResultEffects } from "./useResultEffects";
import { useResultShare } from "./useResultShare";
import { useResultQuests } from "./useResultQuests";
import { useResultAuth } from "./useResultAuth";
import { useResultDerived } from "./useResultDerived";

// ─── 피부 예측 카드 ────────────────────────────────────────────────
export function ResultScreen({ surveyData, analysisResult, imageSrc, faceCroppedSrc, imageBase64, onBack, onGoMagazine, onOpenDiary, onGoRoutine, onGoRecommend, onGoMy, user, deferredPrompt, onShowInstallGuide }: any) {
  const { t } = useTranslation();

  // ── State declarations ──
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  const [internalWeather, setInternalWeather] = useState<any>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisUnlocked, setAnalysisUnlocked] = useState(false);
  const rewardedAd = useRewardedAd();

  // Preload rewarded ad for analysis unlock
  useEffect(() => { if (isTossMiniApp()) rewardedAd.load(); }, []);

  // When reward earned, unlock and open analysis
  useEffect(() => {
    if (rewardedAd.rewarded) {
      setAnalysisUnlocked(true);
      setShowAnalysis(true);
    }
  }, [rewardedAd.rewarded]);

  // Wrap setShowAnalysis — Toss: reward ad first, then open
  const handleOpenAnalysis = useCallback((open: boolean) => {
    if (!open) { setShowAnalysis(false); return; }
    if (!isTossMiniApp() || analysisUnlocked) { setShowAnalysis(true); return; }
    // Show rewarded ad — onReward will open the sheet
    rewardedAd.show();
  }, [analysisUnlocked, rewardedAd]);
  const [showBaumannInfo, setShowBaumannInfo] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);
  const [showNutrients, setShowNutrients] = useState(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [pendingChallengeToken, setPendingChallengeToken] = useState<string | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [streakDelta, setStreakDelta] = useState<number>(0);
  const [missionPops, setMissionPops] = useState<string[]>([]);
  const [showCheckinSheet, setShowCheckinSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<"routine" | "solution" | "nutrition">("routine");
  const tabDirectionRef = useRef<1 | -1>(1);
  const [currentStreak, setCurrentStreak] = useState<StreakData>(() => getStreak());
  const [todayTodoProgress, setTodayTodoProgress] = useState(() => getDiaryTodoProgress(todayStr()));
  const [todayRoutineTodos, setTodayRoutineTodos] = useState<TodoItem[]>(() => getDiaryTodos(todayStr()));
  const [missionState, setMissionState] = useState<MissionState>(() => getMissions());
  const [todayHasMemo, setTodayHasMemo] = useState(() => Boolean(getDiaryMemo(todayStr()).trim()));
  const loginPromptRef = useRef<HTMLDivElement>(null);
  const [cosmeticCount, setCosmeticCount] = useState(0);
  const [myCosmetics, setMyCosmetics] = useState<CosmeticItem[]>([]);
  const [showCosmeticsGate, setShowCosmeticsGate] = useState(false);
  const [showCosmeticsRegister, setShowCosmeticsRegister] = useState(false);
  const [showCosmeticsReport, setShowCosmeticsReport] = useState(false);
  const [showRoutineUpdateSheet, setShowRoutineUpdateSheet] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("fonday_onboarding_done"));
  const [showQuestSheet, setShowQuestSheet] = useState(false);
  const [showPwaPopup, setShowPwaPopup] = useState(false);
  const [checkedCosmeticIds, setCheckedCosmeticIds] = useState<string[]>([]);
  const [cosmeticGrades, setCosmeticGrades] = useState<{id:string;grade:string;score:number;summary:string}[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [guestTokenFetched, setGuestTokenFetched] = useState(false);

  const refreshCosmetics = useCallback(async (options?: { openRoutineUpdate?: boolean }) => {
    try {
      const response = await appFetch(`${apiBase()}/api/cosmetics`);
      const data = response.ok ? await response.json() : [];
      const next = Array.isArray(data) ? data : [];
      setMyCosmetics(next);
      setCosmeticCount(next.length);
      const cosmeticMissions = checkCosmeticMissions(next.length);
      if (cosmeticMissions.length > 0) {
        setMissionState(getMissions());
        setMissionPops(cosmeticMissions);
        setTimeout(() => setMissionPops([]), 3500);
      }
      if (options?.openRoutineUpdate && next.length > 0) {
        setShowRoutineUpdateSheet(true);
      }
    } catch { /* no-op */ }
  }, []);

  const {
    aiCareSettings, pushSubscribed, pushLoading,
    showPushPrompt, setShowPushPrompt, handlePushToggle,
    updateAICareOption, aiCareLabels,
  } = useAICareSettings(analysisResult);

  // ── Derived values ──
  const scores = analysisResult?.scores || [];
  const {
    overallScore, finalType, previousScore,
    cosmeticsInsights, routineGuide,
    morningTask, eveningTask, morningRoutineItems, eveningRoutineItems, routineUpdateItems,
    setRoutinePeriodCompletion, routineComplete,
    morningRoutineComplete, eveningRoutineComplete, completedRoutinePhases,
    weakestSummary, scoreDelta, previewScoreItems,
    nextStreakGoal, daysToGoal, totalPoints,
  } = useResultDerived({
    analysisResult, scores, history, myCosmetics,
    currentStreak, todayTodoProgress, todayRoutineTodos,
    setTodayRoutineTodos, missionState,
  });

  // ── Custom hooks ──
  const { tabContentRef } = useResultEffects({
    analysisResult, user, surveyData, imageBase64, deferredPrompt,
    resultScrollRef,
    setHistory, setIsSaved, setCurrentScanId, setCurrentShareToken,
    setInternalWeather, setShowPwaPopup, setRankingData,
    setPendingChallengeToken, setStreakMilestone, setStreakDelta,
    setMissionPops, setMissionState, setCurrentStreak,
    setTodayTodoProgress, setTodayRoutineTodos, setTodayHasMemo,
    setShowCheckinSheet, setCheckedCosmeticIds, setCosmeticGrades,
    finalType, myCosmetics, isSaved, currentShareToken,
    showAnalysis, showImprovements, internalWeather,
    guestTokenFetched, setGuestTokenFetched,
    activeTab, refreshCosmetics, history,
  });

  const {
    questBoard, essentialQuests, questDoneCount, questProgressPct, questStatusDetail,
    avoidLunch, avoidDinner,
  } = useResultQuests({
    missionState, routineComplete, todayHasMemo,
    completedRoutinePhases, scores, overallScore, finalType,
  });

  const { shareLoading, handleShare } = useResultShare({
    analysisResult, finalType, overallScore, currentShareToken,
    rankingData, avoidLunch, avoidDinner, surveyData,
    setMissionPops, setMissionState,
  });

  const {
    openLoginPopup, handleGoogleLogin, handleKakaoLogin, handleLineLogin,
    socialLoginButton, handleDiaryEntry,
    handlePartnershipSubmit, handleWaitlistSubmit,
  } = useResultAuth({
    analysisResult, surveyData, imageBase64, user, onOpenDiary, loginPromptRef,
    partnerForm, setPartnerForm, setIsPartnerSubmitting, setIsPartnerSuccess, setShowPartnership,
    email, setEmail, setIsSubmitting, setIsSuccess, setShowWaitlist,
  });

  // ── Tab navigation ──
  const TAB_SEQUENCE = ["routine", "solution", "nutrition"] as const;
  const TAB_ORDER = { routine: 0, solution: 1, nutrition: 2 } as const;
  const goTo = (next: "routine" | "solution" | "nutrition") => {
    tabDirectionRef.current = TAB_ORDER[next] >= TAB_ORDER[activeTab] ? 1 : -1;
    setActiveTab(next);
  };

  // ── Render ──
  return (
    <>
    <ResultOverlayPopups
      streakMilestone={streakMilestone} missionPops={missionPops}
      showPwaPopup={showPwaPopup} setShowPwaPopup={setShowPwaPopup}
      deferredPrompt={deferredPrompt} onShowInstallGuide={onShowInstallGuide}
      showCheckinSheet={showCheckinSheet} setShowCheckinSheet={setShowCheckinSheet}
      user={user} handleKakaoLogin={handleKakaoLogin} handleLineLogin={handleLineLogin}
      handleGoogleLogin={handleGoogleLogin} showPushPrompt={showPushPrompt}
      setShowPushPrompt={setShowPushPrompt} pushLoading={pushLoading} handlePushToggle={handlePushToggle}
    />

    <motion.div
      ref={resultScrollRef} className="h-[calc(100dvh-60px)] overflow-y-auto"
      style={{ background: PAGE_GRADIENT }}
      initial={{ opacity: 0, y: isTossMiniApp() ? 12 : 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isTossMiniApp() ? 0.28 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div className={`px-5 pb-40 space-y-6 ${isTossMiniApp() ? "pt-4" : "pt-6"}`} variants={stagger} initial="initial" animate="animate">
        <div className="flex justify-between items-center">
          {!isTossMiniApp() && (
            <button onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold active:opacity-70"
              style={{ background: TINT_WARM, color: SCAN_TO }}>
              <Camera className="w-4 h-4" /> {t("result.back")}
            </button>
          )}
          <div className={`flex items-center gap-2${isTossMiniApp() ? " mx-auto" : ""}`}>
            {!isTossMiniApp() && <img src="/fonday-logo.svg" alt="Fonday" className="h-5" style={{ objectFit: "contain" }} />}
            <span className={`${isTossMiniApp() ? "text-[13px]" : "text-[14px]"} font-bold`} style={{ color: TEXT_TITLE }}>
              {isTossMiniApp() ? t("result.tossReportLabel") : t("result.reportLabel")}
            </span>
          </div>
        </div>

        <ResultHeaderCard
          faceCroppedSrc={faceCroppedSrc} imageSrc={imageSrc}
          finalType={finalType} overallScore={overallScore} scoreDelta={scoreDelta}
          weakestSummary={weakestSummary} rankingData={rankingData} analysisResult={analysisResult}
          currentStreak={currentStreak} showBaumannInfo={showBaumannInfo}
          setShowBaumannInfo={setShowBaumannInfo} setShowAnalysis={handleOpenAnalysis}
          previewScoreItems={previewScoreItems}
          previousScores={history.length > 0 ? history[0]?.scores : null}
        />

        {analysisResult?.improvements?.[0] && (
          <div className="flex items-start gap-3 px-4 py-3.5" style={{ borderRadius: 16, background: TINT_GREEN }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: BG_BASE }}>
              <Sparkles className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: DEEP_GREEN }}>
                {isTossMiniApp() ? t("result.tossTodayAction") : t("result.todayFocus")}
              </p>
              <p className="text-[14px] font-bold mt-0.5" style={{ color: TEXT_TITLE }}>{analysisResult.improvements[0].title}</p>
              <p className="text-[12px] mt-1 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{t("result.actionCard.phaseMorning")}: {morningTask}</p>
              <p className="text-[12px] mt-0.5 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{t("result.actionCard.phaseEvening")}: {eveningTask}</p>
            </div>
          </div>
        )}

        <div ref={tabNavRef} className="rounded-full p-1.5 sticky top-0 z-20" style={{ background: BG_MUTED }}>
          <div className="flex gap-2">
            {([
              { id: "routine" as const, label: isTossMiniApp() ? t("result.tab.tossRoutine") : t("result.tab.routine"), icon: <CheckCircle2 className="w-4 h-4" />, activeBg: "#F7FBF8", activeText: DEEP_GREEN },
              { id: "solution" as const, label: isTossMiniApp() ? t("result.tab.tossSolution") : t("result.tab.solution"), icon: <Leaf className="w-4 h-4" />, activeBg: "#FFF8F4", activeText: SCAN_TO },
              { id: "nutrition" as const, label: isTossMiniApp() ? t("result.tab.tossNutrition") : t("result.tab.nutrition"), icon: <Utensils className="w-4 h-4" />, activeBg: "#FCF8FF", activeText: COLOR_INFO },
            ]).map(({ id, label, icon, activeBg, activeText }) => (
              <button key={id} onClick={() => goTo(id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-semibold transition-all"
                style={activeTab === id ? { background: activeBg, color: activeText } : { background: BG_BASE, color: "#A8A29E" }}>
                {icon}<span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={tabContentRef} className="overflow-hidden"
          onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            if (startX == null) return;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) < 80) return;
            const cur = TAB_SEQUENCE.indexOf(activeTab);
            if (diff < 0 && cur < TAB_SEQUENCE.length - 1) goTo(TAB_SEQUENCE[cur + 1]);
            else if (diff > 0 && cur > 0) goTo(TAB_SEQUENCE[cur - 1]);
          }}>
        <AnimatePresence mode="wait" initial={false} custom={tabDirectionRef.current}>
        {activeTab === "routine" && (
          <motion.div key="routine" custom={tabDirectionRef.current}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}>
          <ResultRoutineTab
            showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding}
            history={history} questStatusDetail={questStatusDetail}
            nextStreakGoal={nextStreakGoal} daysToGoal={daysToGoal}
            questProgressPct={questProgressPct} essentialQuests={essentialQuests}
            setShowQuestSheet={setShowQuestSheet}
            morningRoutineItems={morningRoutineItems} eveningRoutineItems={eveningRoutineItems}
            morningRoutineComplete={morningRoutineComplete} eveningRoutineComplete={eveningRoutineComplete}
            setRoutinePeriodCompletion={setRoutinePeriodCompletion}
            handleDiaryEntry={handleDiaryEntry} routineGuide={routineGuide}
            cosmeticsInsights={cosmeticsInsights} cosmeticCount={cosmeticCount}
            user={user} setShowCosmeticsRegister={setShowCosmeticsRegister}
            setShowCosmeticsGate={setShowCosmeticsGate}
            myCosmetics={myCosmetics} overallScore={overallScore} previousScore={previousScore}
            currentStreak={currentStreak} prediction={analysisResult?.prediction}
            onOpenDiary={onOpenDiary} loginPromptRef={loginPromptRef}
            socialLoginButton={socialLoginButton} handleGoogleLogin={handleGoogleLogin}
            goTo={goTo} onGoRoutineTab={onGoRoutine} onGoDiaryTab={onOpenDiary} onGoMyTab={onGoMy}
            setShowCosmeticsReport={setShowCosmeticsReport}
          />
          </motion.div>
        )}
        {activeTab === "solution" && (
          <motion.div key="solution" custom={tabDirectionRef.current}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}>
          <ResultSolutionTab
            user={user} cosmeticCount={cosmeticCount}
            setShowCosmeticsRegister={setShowCosmeticsRegister} setShowCosmeticsGate={setShowCosmeticsGate}
            analysisResult={analysisResult} handleDiaryEntry={handleDiaryEntry}
            pushSubscribed={pushSubscribed} pushLoading={pushLoading} handlePushToggle={handlePushToggle}
            aiCareSettings={aiCareSettings} updateAICareOption={updateAICareOption}
            aiCareLabels={aiCareLabels} setShowWaitlist={setShowWaitlist}
            goTo={goTo} onGoRoutineTab={onGoRoutine} onGoDiscoverTab={onGoMagazine} onGoMyTab={onGoMy}
            loginPromptRef={loginPromptRef} socialLoginButton={socialLoginButton} handleGoogleLogin={handleGoogleLogin}
          />
          </motion.div>
        )}
        {activeTab === "nutrition" && (
          <motion.div key="nutrition" custom={tabDirectionRef.current}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}>
          <ResultNutritionTab analysisResult={analysisResult} />
          </motion.div>
        )}
        </AnimatePresence>

        {/* 배너 광고 (토스 — 탭 콘텐츠 하단) */}
        {isTossMiniApp() && (
          <div className="px-4 py-3">
            <TossBannerAd className="rounded-2xl overflow-hidden" />
          </div>
        )}
        </div>
      </motion.div>

      <ResultActionBar
        shareLoading={shareLoading} pendingChallengeToken={pendingChallengeToken}
        currentShareToken={currentShareToken} onShare={handleShare}
        onInviteFriends={() => openContactsViral()} baumannType={finalType}
        onOpenChallenge={() => {
          sessionStorage.removeItem("battleChallengeToken");
          window.location.href = `/battle/${pendingChallengeToken}`;
        }}
        onCreateChallenge={() => {
          if (!currentShareToken) return;
          markChallengeUsed();
          const battlePath = `/battle/${currentShareToken}`;
          const shareText = t("result.challengeText", { score: overallScore, type: finalType });
          if (isTossMiniApp()) {
            const battleUrl = `https://fondayai.com/battle/${currentShareToken}`;
            tossShare({ message: `${shareText}\n${battleUrl}` }).catch(() => {});
          } else {
            const shareUrl = `${window.location.origin}${battlePath}`;
            if (navigator.share) {
              navigator.share({ title: "Fonday° 피부 챌린지", text: shareText, url: shareUrl }).catch(() => {});
            } else {
              const ta = document.createElement("textarea");
              ta.value = shareUrl;
              ta.style.cssText = "position:fixed;left:-9999px;opacity:0";
              document.body.appendChild(ta); ta.focus(); ta.select();
              try { document.execCommand("copy"); } catch {}
              document.body.removeChild(ta);
              alert(t("result.challengeLinkCopied"));
            }
          }
        }}
      />

      <ResultModals
        showAnalysis={showAnalysis} setShowAnalysis={handleOpenAnalysis}
        aiComment={analysisResult?.aiComment} scores={scores}
        skinReport={(analysisResult?.skinReport as { area: string; finding: string }[]) ?? []}
        finalType={finalType} showImprovements={showImprovements} setShowImprovements={setShowImprovements}
        improvements={(analysisResult?.improvements as { title: string; desc: string }[]) ?? []}
        cosmetics={(analysisResult?.cosmetics as { type: string; key: string; reason: string }[]) ?? []}
        showNutrients={showNutrients} setShowNutrients={setShowNutrients}
        avoidLunch={avoidLunch} avoidDinner={avoidDinner}
        showCosmeticsGate={showCosmeticsGate} setShowCosmeticsGate={setShowCosmeticsGate}
        language={i18n.language} onLoginFromGate={(provider) => openLoginPopup(provider, "scan")}
        showCosmeticsRegister={showCosmeticsRegister} setShowCosmeticsRegister={setShowCosmeticsRegister}
        refreshCosmetics={refreshCosmetics}
        showRoutineUpdateSheet={showRoutineUpdateSheet} setShowRoutineUpdateSheet={setShowRoutineUpdateSheet}
        morningRoutineItems={morningRoutineItems} eveningRoutineItems={eveningRoutineItems}
        routineUpdateItems={routineUpdateItems}
        showQuestSheet={showQuestSheet} setShowQuestSheet={setShowQuestSheet}
        totalPoints={totalPoints} questDoneCount={questDoneCount} questBoard={questBoard}
        showPartnership={showPartnership} setShowPartnership={setShowPartnership}
        partnerForm={partnerForm} setPartnerForm={setPartnerForm}
        handlePartnershipSubmit={handlePartnershipSubmit}
        isPartnerSubmitting={isPartnerSubmitting} isPartnerSuccess={isPartnerSuccess}
        showWaitlist={showWaitlist} setShowWaitlist={setShowWaitlist}
        email={email} setEmail={setEmail} isSubmitting={isSubmitting} isSuccess={isSuccess}
        handleWaitlistSubmit={handleWaitlistSubmit}
      />

      <AnimatePresence>
        {showCosmeticsReport && (
          <CosmeticsReportCard
            myCosmetics={myCosmetics} analysisResult={analysisResult} finalType={finalType}
            onClose={() => setShowCosmeticsReport(false)}
            onAddCosmetic={() => {
              setShowCosmeticsReport(false);
              if (user) setShowCosmeticsRegister(true);
              else setShowCosmeticsGate(true);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
