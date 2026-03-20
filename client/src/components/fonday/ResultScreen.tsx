import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Camera, ScanLine, AlertCircle, Shield, Sun, Moon,
  Sparkles, ArrowRight, Heart, Droplets, Target,
  Leaf, Star, Thermometer, Utensils, CheckCircle2, Pill,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DEEP_GREEN, DEEP_GREEN_LIGHT, SCAN_FROM, SCAN_TO,
  TINT_WARM, TINT_GREEN, TINT_NEUTRAL, SCORE_LABEL_MAP, NUTRIENT_COLORS,
  SCORE_COLORS, fadeChild, stagger, tabSlideVariants, MISSION_POINTS,
} from "./constants";
import type { CosmeticItem, StreakData, RankingData, MissionState, TodoItem, AICareSettings } from "./types";
import {
  buildPushScoreSummary, buildBaumannTypeFromResult, todayStr,
  getStreak, updateStreak,
  getMissions, checkAndCompleteMissions,
  getAttendance, checkinToday,
  shouldShowPushPrompt, dismissPushPrompt,
  markChallengeUsed, markShareUsed,
  getDiaryMemo,
  getAICareSettings, saveAICareSettings,
  getDiaryTodos, saveDiaryTodos, getDiaryTodoProgress, initDiaryTodosFromRoutine,
  getReminderSettings, saveReminderSettings, syncReminderToServer,
  buildCosmeticsInsights, buildRoutineGuide,
} from "./utils";
import { SkinPredictionCard } from "./SkinPredictionCard";
import { ResultDiaryCard } from "./ResultDiaryCard";
import { ResultLoginCard } from "./ResultLoginCard";
import { ResultNutrientsSheet } from "./ResultNutrientsSheet";
import { ResultImprovementsSheet } from "./ResultImprovementsSheet";
import { ResultAnalysisSheet } from "./ResultAnalysisSheet";
import { ResultCosmeticsGateSheet } from "./ResultCosmeticsGateSheet";
import { ResultActionBar } from "./ResultActionBar";
import { ResultQuestSheet } from "./ResultQuestSheet";
import { PartnershipModal } from "./PartnershipModal";
import { CheckinSuccessSheet } from "./CheckinSuccessSheet";
import { PushPromptSheet } from "./PushPromptSheet";
import { CosmeticsRegisterModal } from "./MyScreen";
import { ResultRoutineTab } from "./ResultRoutineTab";
import { ResultSolutionTab } from "./ResultSolutionTab";
import { ResultNutritionTab } from "./ResultNutritionTab";
import { PwaInstallPopup } from "./PwaInstallPopup";
import { RoutineUpdateSheet } from "./RoutineUpdateSheet";
import { WaitlistModal } from "./WaitlistModal";
import { useAICareSettings } from "./useAICareSettings";
import { ResultHeaderCard } from "./ResultHeaderCard";

// ─── 피부 예측 카드 ────────────────────────────────────────────────
export function ResultScreen({ surveyData, analysisResult, imageSrc, faceCroppedSrc, imageBase64, onBack, onGoMagazine, onOpenDiary, user, deferredPrompt, onShowInstallGuide }: any) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showBaumannInfo, setShowBaumannInfo] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const diaryDrag = useDragControls();
  const [showNutrients, setShowNutrients] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [diaryTab, setDiaryTab] = useState<"history" | "compare" | "ranking">("history");
  const [pendingChallengeToken, setPendingChallengeToken] = useState<string | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [streakDelta, setStreakDelta] = useState<number>(0);
  const [missionPops, setMissionPops] = useState<string[]>([]);

  const refreshCosmetics = useCallback(async (options?: { openRoutineUpdate?: boolean }) => {
    try {
      const response = await fetch("/api/cosmetics");
      const data = response.ok ? await response.json() : [];
      const next = Array.isArray(data) ? data : [];
      setMyCosmetics(next);
      setCosmeticCount(next.length);
      if (options?.openRoutineUpdate && next.length > 0) {
        setShowRoutineUpdateSheet(true);
      }
    } catch {
      // no-op
    }
  }, []);
  const [showCheckinSheet, setShowCheckinSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<"routine" | "solution" | "nutrition">("routine");
  const tabDirectionRef = useRef<1 | -1>(1);
  const [currentStreak, setCurrentStreak] = useState<StreakData>(() => getStreak());
  const [todayTodoProgress, setTodayTodoProgress] = useState(() => getDiaryTodoProgress(todayStr()));
  const [todayRoutineTodos, setTodayRoutineTodos] = useState<TodoItem[]>(() => getDiaryTodos(todayStr()));
  const [missionState, setMissionState] = useState<MissionState>(() => getMissions());
  const [todayHasMemo, setTodayHasMemo] = useState(() => Boolean(getDiaryMemo(todayStr()).trim()));
  const loginPromptRef = useRef<HTMLDivElement>(null);
  // 화장품 기능
  const [cosmeticCount, setCosmeticCount] = useState(0);
  const [myCosmetics, setMyCosmetics] = useState<CosmeticItem[]>([]);
  const [showCosmeticsGate, setShowCosmeticsGate] = useState(false);
  const [showCosmeticsRegister, setShowCosmeticsRegister] = useState(false);
  const [showRoutineUpdateSheet, setShowRoutineUpdateSheet] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("fonday_onboarding_done"));
  const [showQuestSheet, setShowQuestSheet] = useState(false);
  const [showPwaPopup, setShowPwaPopup] = useState(false);

  // PWA 설치 팝업: 결과 진입 후 4초 뒤 자동 표시
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem("fonday_pwa_dismissed") === "1";
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isStandalone || isDismissed) return;
    if (!isIos && !deferredPrompt) return; // Android인데 프롬프트 없으면 표시 안 함
    const timer = setTimeout(() => setShowPwaPopup(true), 4000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 챌린지 참여 후 내 결과 저장 (비로그인도 작동)
  useEffect(() => {
    const token = sessionStorage.getItem('battleChallengeToken');
    if (!token) return;
    setPendingChallengeToken(token);
    const sc = analysisResult?.scores ?? [];
    const ov = sc[0]?.score ?? 0;
    const isOilyCh = (sc[1]?.score ?? 0) > 50;
    const isSensCh = (sc[3]?.score ?? 100) < 60;
    const isPigCh  = (sc[5]?.score ?? 0) > 50;
    const isWrinkCh = (sc[4]?.score ?? 100) < 60;
    const bt = `${isOilyCh?"O":"D"}${isSensCh?"S":"R"}${isPigCh?"P":"N"}${isWrinkCh?"W":"T"}`;
    sessionStorage.setItem('battleMyResult', JSON.stringify({
      overallScore: String(ov),
      scores: sc,
      baumannType: bt,
      skinAge: analysisResult?.skinAge,
      aiComment: analysisResult?.aiComment ?? "",
      createdAt: new Date().toISOString(),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스캔 완료 → 스트릭 업데이트 + 미션 체크
  useEffect(() => {
    if (!analysisResult) return;
    const overallScore = analysisResult.scores?.[0]?.score || 0;
    const { streak, isNewMilestone, deltaScore } = updateStreak(overallScore);
    setCurrentStreak(streak);
    setStreakDelta(deltaScore);
    // Bug 3 fix: timeout ID 수집 후 cleanup 반환
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (isNewMilestone) {
      setStreakMilestone(streak.count);
      timers.push(setTimeout(() => setStreakMilestone(null), 3000));
    }
    const newMissions = checkAndCompleteMissions(streak.count, overallScore, deltaScore);
    setMissionState(getMissions());
    if (newMissions.length > 0) {
      setMissionPops(newMissions);
      timers.push(setTimeout(() => setMissionPops([]), 3500));
    }
    // 출석 체크인 (오늘 첫 스캔이면 팝업)
    const isNew = checkinToday();
    if (isNew) {
      timers.push(setTimeout(() => setShowCheckinSheet(true), 1200));
    }
    // 예측 루틴 → 오늘 Todo로 자동 저장 (오늘 처음이면)
    if (analysisResult?.prediction?.good?.routine) {
      initDiaryTodosFromRoutine(todayStr(), analysisResult.prediction.good.routine);
    }
    setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
    setTodayRoutineTodos(getDiaryTodos(todayStr()));
    setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    // 로그인 사용자 → 스트릭/출석 서버 동기화
    if (user) {
      fetch("/api/user-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak,
          attendance: getAttendance(),
          missionState: getMissions(),
        }),
      }).catch(() => {});
    }
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshTodayState = () => {
      setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
      setTodayRoutineTodos(getDiaryTodos(todayStr()));
      setMissionState(getMissions());
      setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshTodayState();
    };
    window.addEventListener("focus", refreshTodayState);
    window.addEventListener("fonday:diary-updated", refreshTodayState as EventListener);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", refreshTodayState);
      window.removeEventListener("fonday:diary-updated", refreshTodayState as EventListener);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const openLoginPopup = useCallback((provider: "kakao" | "line" | "google", returnTab?: string) => {
    if (returnTab) localStorage.setItem("fonday_return_tab", returnTab);
    if (analysisResult) localStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    window.location.href = `/auth/${provider}`;
  }, [analysisResult, surveyData, imageBase64]);

  const handleGoogleLogin = () => openLoginPopup("google");
  const handleKakaoLogin = () => openLoginPopup("kakao");
  const handleLineLogin = () => openLoginPopup("line");
  const isKo = i18n.language === "ko";
  const socialLoginButton = isKo ? (
    <Button onClick={handleKakaoLogin}
      className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
      style={{ background: "#FEE500" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
      </svg>
      {t("result.login.kakao")}
    </Button>
  ) : (
    <Button onClick={handleLineLogin}
      className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-white"
      style={{ background: "#06C755" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/>
      </svg>
      {t("result.login.line")}
    </Button>
  );
  const handleDiaryEntry = () => {
    if (user) {
      onOpenDiary?.();
      return;
    }
    loginPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const handleOpenDiaryCalendar = () => {
    sessionStorage.setItem("fonday_diary_target_tab", "calendar");
    handleDiaryEntry();
  };
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    aiCareSettings,
    setAICareSettings,
    pushSubscribed,
    pushLoading,
    showPushPrompt,
    setShowPushPrompt,
    handlePushToggle,
    updateAICareOption,
    aiCareLabels,
  } = useAICareSettings(analysisResult);

  // 히스토리 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    fetch("/api/scans")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [user]);

  // 등록된 화장품 수 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    void refreshCosmetics();
  }, [user, refreshCosmetics]);

  // 랭킹 데이터 로드 (Bug 2 fix: analysisResult 의존성 추가)
  useEffect(() => {
    const score = analysisResult?.scores?.[0]?.score || 0;
    fetch(`/api/ranking?myScore=${score}`)
      .then(res => res.json())
      .then(data => setRankingData(data))
      .catch(() => {});
  }, [analysisResult]);

  // 비로그인 챌린지 토큰 생성 (로그인 여부 확정 후 즉시)
  const [guestTokenFetched, setGuestTokenFetched] = useState(false);
  useEffect(() => {
    if (!analysisResult || user !== null || guestTokenFetched) return;
    setGuestTokenFetched(true);
    const KO_AGE_GROUPS = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
    fetch("/api/challenge-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallScore: analysisResult.scores?.[0]?.score || 0,
        baumannType: finalType,
        scores: analysisResult.scores,
        skinAge: analysisResult.skinAge,
        aiComment: analysisResult.aiComment,
        lang: i18n.language || "ko",
        gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
        ageGroup: KO_AGE_GROUPS[surveyData?.ageIdx ?? 2] ?? "",
      }),
    }).then(res => res.json()).then(data => {
      if (data?.shareToken) {
        setCurrentShareToken(data.shareToken);
        // 로그인 후 연결을 위해 localStorage에도 보관
        try { localStorage.setItem("fonday_guest_token", data.shareToken); } catch {}
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, analysisResult]);

  // 스캔 저장 (로그인 + 분석결과 둘 다 준비됐을 때)
  useEffect(() => {
    if (!user || !analysisResult || isSaved) return;
    // Bug 1 fix: 한국어 label 하드코딩 제거 → index 0 (항상 종합점수)
    const overallScore = analysisResult.scores[0]?.score || 0;
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallScore,
        skinAge: analysisResult.skinAge ?? null,
        baumannType: finalType,
        scores: analysisResult.scores,
        hotspots: analysisResult.hotspots,
        aiComment: analysisResult.aiComment,
        improvements: analysisResult.improvements ?? [],
        cosmetics: analysisResult.cosmetics ?? [],
        lang: i18n.language || "ko",
        gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
        ageGroup: ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"][surveyData?.ageIdx ?? 2] ?? "",
      })
    }).then(res => res.json()).then(data => {
      setIsSaved(true);
      if (data?.id) setCurrentScanId(data.id);
      if (data?.shareToken) setCurrentShareToken(data.shareToken);
      // D1에도 저장 (관리자 통계용)
      const KO_AGE_GROUPS2 = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
      fetch("/api/challenge-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallScore,
          baumannType: finalType,
          scores: analysisResult.scores,
          skinAge: analysisResult.skinAge,
          aiComment: analysisResult.aiComment,
          lang: i18n.language || "ko",
          isGuest: false,
          gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
          ageGroup: KO_AGE_GROUPS2[surveyData?.ageIdx ?? 2] ?? "",
        }),
      }).catch(() => {});
    }).catch(() => {}); // Bug 4 fix: .catch() 추가
  }, [user, analysisResult]);

  // 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    const el = resultScrollRef.current;
    if (!el) return;
    el.style.overflow = (showAnalysis || showImprovements) ? 'hidden' : 'auto';
  }, [showAnalysis, showImprovements]);

  const TAB_SEQUENCE = ["routine", "solution", "nutrition"] as const;
  const TAB_ORDER = { routine: 0, solution: 1, nutrition: 2 } as const;
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const goTo = (next: "routine" | "solution" | "nutrition") => {
    tabDirectionRef.current = TAB_ORDER[next] >= TAB_ORDER[activeTab] ? 1 : -1;
    setActiveTab(next);
  };

  // 탭 전환 시 탭 바 위치로 스크롤 (초기 마운트 제외)
  const tabMountedRef = useRef(false);
  useEffect(() => {
    if (!tabMountedRef.current) {
      tabMountedRef.current = true;
      return; // 초기 로드: 스크롤 없이 최상단(10가지 점수)부터 보임
    }
    const content = tabContentRef.current;
    const container = resultScrollRef.current;
    if (content && container) {
      container.scrollTo({ top: content.offsetTop - 8, behavior: "smooth" });
    }
  }, [activeTab]);

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnerSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xzdjpden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });
      if (res.ok) {
        setIsPartnerSuccess(true);
        setTimeout(() => { setShowPartnership(false); setIsPartnerSuccess(false); setPartnerForm({ name: "", company: "", email: "", message: "" }); }, 2000);
      }
    } catch { alert("오류가 발생했습니다."); }
    finally { setIsPartnerSubmitting(false); }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData, analysisResult }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { setShowWaitlist(false); setIsSuccess(false); setEmail(""); }, 2000);
      }
    } catch { alert("오류가 발생했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const scores = analysisResult?.scores || [];
  // Labels from server are always Korean (REQUIRED_LABELS), so we match by Korean label OR by index
  const overallScore = scores[0]?.score || 0;
  const isOily  = (scores[3]?.score ?? 100) < 50;  // index 3 = 모공 상태
  const isSens  = (scores[2]?.score ?? 0) > 50;    // index 2 = 붉은기 수준
  const isPig   = (scores[5]?.score ?? 0) > 50;    // index 5 = 잡티/색소침착
  const isWrink = (scores[4]?.score ?? 100) < 60;  // index 4 = 주름 및 탄력
  const finalType = `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`;
  const previousScore = history.length > 0 ? parseInt(history[0]?.overallScore || "0", 10) || null : null;
  const cosmeticsInsights = buildCosmeticsInsights(myCosmetics, overallScore, previousScore, t);
  const routineGuide = buildRoutineGuide(myCosmetics, t);
  const todayRoutine = analysisResult?.prediction?.good?.routine ?? [];
  const morningTask = todayRoutine[0] ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.fallbackFocus");
  const eveningTask = todayRoutine[1] ?? analysisResult?.improvements?.[1]?.title ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.eveningFallback");
  const morningRoutineItems = routineGuide.amSteps.length > 0
    ? routineGuide.amSteps
    : [morningTask];
  const eveningRoutineItems = routineGuide.pmSteps.length > 0
    ? routineGuide.pmSteps
    : [eveningTask];
  const routineUpdateItems = [
    ...morningRoutineItems.map((item) => `AM · ${item}`),
    ...eveningRoutineItems.map((item) => `PM · ${item}`),
  ];
  const getRoutineTodoState = (period: "AM" | "PM", label: string) => {
    const prefixed = `${period} · ${label}`;
    return todayRoutineTodos.find((todo) => todo.text === prefixed || todo.text === label);
  };
  const isRoutinePeriodComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return false;
    return items.every((item) => Boolean(getRoutineTodoState(period, item)?.done));
  };
  const setRoutinePeriodCompletion = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return;
    const next = [...todayRoutineTodos];
    const shouldComplete = !isRoutinePeriodComplete(period, items);
    items.forEach((item) => {
      const prefixed = `${period} · ${item}`;
      const existingIndex = next.findIndex((todo) => todo.text === prefixed || todo.text === item);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], text: prefixed, done: shouldComplete };
      } else {
        next.push({ text: prefixed, done: shouldComplete });
      }
    });
    setTodayRoutineTodos(next);
    saveDiaryTodos(todayStr(), next);
  };
  const todayMissionRoutines = [morningTask, eveningTask].filter(Boolean);
  const todayFocus = todayMissionRoutines.join(" · ") || analysisResult?.improvements?.[0]?.title || t("result.actionCard.fallbackFocus");
  const routineDone = todayTodoProgress.done;
  const routineTotal = todayTodoProgress.total || todayRoutine.length;
  const routineComplete = routineTotal > 0 && routineDone === routineTotal;
  const morningRoutineComplete = isRoutinePeriodComplete("AM", morningRoutineItems);
  const eveningRoutineComplete = isRoutinePeriodComplete("PM", eveningRoutineItems);
  const completedRoutinePhases = [morningRoutineComplete, eveningRoutineComplete].filter(Boolean).length;
  const weakestScores: { index: number; score: number }[] = scores
    .slice(1)
    .map((item: any, index: number) => ({ index: index + 1, score: item.score }))
    .sort((a: { index: number; score: number }, b: { index: number; score: number }) => a.score - b.score)
    .slice(0, 2);
  const weakestSummary = weakestScores.map(({ index }: { index: number; score: number }) => t(`scores.${index}`)).join(" · ");
  const scoreDelta = previousScore !== null ? overallScore - previousScore : null;
  const previewScoreItems: { idx: number; score: number; color: string }[] = [1, 2, 3, 5]
    .map((idx) => ({ idx, score: scores[idx]?.score ?? 0, color: SCORE_COLORS[idx] || DEEP_GREEN }))
    .filter((item: { idx: number; score: number; color: string }) => item.score > 0);
  const nextStreakGoal = [3, 7, 30].find((goal) => goal > (currentStreak.count || 0)) ?? null;
  const daysToGoal = nextStreakGoal ? Math.max(nextStreakGoal - (currentStreak.count || 0), 0) : 0;
  const nextStreakReward = nextStreakGoal ? MISSION_POINTS[`streak_${nextStreakGoal}`] || 0 : 0;
  const attendance = getAttendance();
  const totalPoints = missionState.totalPoints + attendance.totalPoints;
  const dailyImproved = missionState.dailyDate === todayStr() && missionState.dailyImproved;
  const dailyChallenged = missionState.dailyDate === todayStr() && missionState.dailyChallenged;
  const questBoard = [
    {
      id: "scan",
      done: missionState.dailyCompleted,
      label: t("result.actionCard.questScan"),
      reward: `+${MISSION_POINTS.daily_scan}pt`,
      detail: t("result.actionCard.questScanDetail"),
      accent: "#C97062",
    },
    {
      id: "routine",
      done: routineComplete,
      label: t("result.actionCard.questRoutine"),
      reward: routineComplete ? t("result.actionCard.questDone") : `${completedRoutinePhases}/2`,
      detail: t("result.actionCard.questRoutineDetail"),
      accent: "#059669",
    },
    {
      id: "memo",
      done: todayHasMemo,
      label: t("result.actionCard.questMemo"),
      reward: todayHasMemo ? t("result.actionCard.questDone") : t("result.actionCard.questPending"),
      detail: t("result.actionCard.questMemoDetail"),
      accent: "#7C3AED",
    },
    {
      id: "improve",
      done: dailyImproved,
      label: t("result.actionCard.questImprove"),
      reward: dailyImproved ? `+${MISSION_POINTS.daily_improve}pt` : `+${MISSION_POINTS.daily_improve}pt`,
      detail: t("result.actionCard.questImproveDetail"),
      accent: "#0284C7",
    },
    {
      id: "challenge_share",
      done: dailyChallenged,
      label: t("result.actionCard.questChallenge"),
      reward: `+${MISSION_POINTS.daily_challenge}pt`,
      detail: t("result.actionCard.questChallengeDetail"),
      accent: "#7C3AED",
    },
  ];
  const essentialQuestIds = new Set(["scan", "routine", "memo"]);
  const essentialQuests = questBoard.filter((quest) => essentialQuestIds.has(quest.id));
  const questDoneCount = questBoard.filter((quest) => quest.done).length;
  const questProgressPct = Math.round((questDoneCount / questBoard.length) * 100);
  const allClearBonus = questDoneCount === questBoard.length ? 20 : 0;
  const firstIncompleteQuest = questBoard.find((q) => !q.done);
  const questStatusDetail = questDoneCount === questBoard.length
    ? t("result.actionCard.statusDone")
    : firstIncompleteQuest
      ? t("result.actionCard.statusNext", { tasks: firstIncompleteQuest.label })
      : "";

  const parseFoodOptions = (value?: string): string[] => {
    if (!value) return [];
    const delimiter = value.includes("|") ? "|" : "·";
    return value
      .split(delimiter)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const pickFoodOption = (value: string | undefined, seed: number, fallbackIndex = 0): string | null => {
    const options = parseFoodOptions(value);
    if (options.length === 0) return null;
    const normalizedSeed = Math.abs(Math.round(seed));
    return options[normalizedSeed % options.length] ?? options[Math.min(fallbackIndex, options.length - 1)] ?? null;
  };

  const dedupeFoods = (items: ({ food: string; why: string } | null)[]) => {
    const seen = new Set<string>();
    return items.filter((item): item is { food: string; why: string } => {
      if (!item?.food) return false;
      if (seen.has(item.food)) return false;
      seen.add(item.food);
      return true;
    });
  };

  // 날짜 기반 시드 — 매일 다른 음식 추천 (YYYYMMDD 정수)
  const dailySeed = (() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  })();

  // 점수 기반 피해야 할 음식 키 (바우만 외 추가 항목)
  const scoreAvoidKeys: string[] = [];
  if ((scores[1]?.score ?? 100) < 50) scoreAvoidKeys.push("hydration");
  if ((scores[6]?.score ?? 0) > 60)   scoreAvoidKeys.push("trouble");
  if ((scores[7]?.score ?? 0) > 60)   scoreAvoidKeys.push("darkCircle");
  if ((scores[8]?.score ?? 100) < 50) scoreAvoidKeys.push("glow");

  // 점심 피해야 할 음식 (바우만 4글자 + 점수 기반 통합)
  const avoidLunch: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.lunch, overallScore + idx + l.charCodeAt(0) + dailySeed);
      return food ? { food, why: d.lunchWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 1]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  // 저녁 피해야 할 음식 (바우만 4글자 + 점수 기반 통합)
  const avoidDinner: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.dinner, overallScore + idx + l.charCodeAt(0) + 5 + dailySeed);
      return food ? { food, why: d.dinnerWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 5]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + 7 + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  const handleShare = async () => {
    if (shareLoading) return;
    markShareUsed();
    setShareLoading(true);
    try {
      // i18n 문자열 미리 resolve
      const scoreLabels = Array.from({ length: 10 }, (_, i) => t(`scores.${i}`));
      const baumannNames: Record<string, string> = {};
      ["O","D","S","R","P","N","W","T"].forEach(l => { baumannNames[l] = t(`baumann.${l}.name`); });

      // nutrients: 바우만 글자별 첫 번째 영양소
      const nutrients: Record<string, { name: string; foods: string; why: string }> = {};
      finalType.split("").forEach(letter => {
        const arr = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
        if (arr?.[0]) nutrients[letter] = arr[0];
      });

      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

      const i18nTexts = {
        rankLabel: t("share.rankLabel"),
        overallScoreLabel: t("share.overallScoreLabel"),
        skinAgeLabel: t("share.skinAgeLabel"),
        skinAgeSuffix: t("share.skinAgeSuffix"),
        slide2Sub: t("share.slide2Sub"),
        slide3Sub: t("share.slide3Sub"),
        recIngredient: t("share.recIngredient"),
        slide4Sub: t("share.slide4Sub"),
        slide5Sub: t("share.slide5Sub"),
        footerText: t("share.footerText"),
      };

      const body = {
        lang: i18n.language,
        finalType,
        overallScore,
        skinAge: analysisResult?.skinAge,
        aiComment: analysisResult?.aiComment ?? "",
        rankingPercentile: rankingData?.myPercentile,
        scores: (analysisResult?.scores ?? []).map((s: any) => ({ score: s.score, label: s.label })),
        improvements: (analysisResult?.improvements ?? []).slice(0, 3),
        cosmetics: (analysisResult?.cosmetics ?? []).slice(0, 2),
        nutrients,
        avoidLunch,
        avoidDinner,
        scoreLabels,
        baumannNames,
        scoreSuffix: t("result.scoreSuffix"),
        dateStr,
        i18nTexts,
      };

      const shareController = new AbortController();
      const shareTimeout = setTimeout(() => shareController.abort(), 20000);
      const res = await fetch("/api/generate-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: shareController.signal,
      }).finally(() => clearTimeout(shareTimeout));
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        throw new Error(`generate-share failed: ${res.status} | ${errBody?.error ?? ""}: ${errBody?.detail ?? ""}`);
      }

      const { slides } = await res.json() as { slides: string[] };
      if (!slides?.length) throw new Error("no slides returned");

      const files: File[] = slides.map((dataUrl, i) => {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
        return new File([bytes], `fonday-reels-${i + 1}.png`, { type: "image/png" });
      });

      const shareText = t("result.shareText", { score: overallScore, type: finalType });
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: "Fonday AI 피부 분석", text: shareText });
      } else {
        for (const file of files) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = file.name;
          a.click();
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (e) {
      console.error("[share]", e);
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          alert("이미지 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          alert(`공유 실패: ${e.message}`);
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <>
    {/* 스트릭 마일스톤 팝업 */}
    <AnimatePresence>
      {streakMilestone && (
        <motion.div
          key="milestone"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-16 left-1/2 z-[999] -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-[15px] text-center"
          style={{ background: "#F59E0B" }}
        >
          {t("streak.milestone", { count: streakMilestone })}
        </motion.div>
      )}
    </AnimatePresence>

    {/* 미션 달성 팝업 */}
    <AnimatePresence>
      {missionPops.length > 0 && (
        <motion.div
          key="missionpop"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 z-[999] -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl bg-white flex flex-col items-center gap-1 min-w-[200px]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        >
          <Target className="w-6 h-6" />
          <p className="font-black text-stone-800 text-[14px]">{t("mission.newAchieve")}</p>
          <p className="text-[12px] text-stone-500">{t(`mission.${missionPops[0]}`)}</p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* PWA 설치 팝업 */}
    <PwaInstallPopup
      open={showPwaPopup}
      onDismiss={() => { setShowPwaPopup(false); localStorage.setItem("fonday_pwa_dismissed", "1"); }}
      deferredPrompt={deferredPrompt}
      onShowInstallGuide={onShowInstallGuide}
    />

    {/* 출석 체크인 팝업 */}
    <AnimatePresence>
      {showCheckinSheet && (
        <CheckinSuccessSheet
          user={user}
          onKakao={() => { setShowCheckinSheet(false); handleKakaoLogin(); }}
          onLine={() => { setShowCheckinSheet(false); handleLineLogin(); }}
          onGoogle={() => { setShowCheckinSheet(false); handleGoogleLogin(); }}
          onDismiss={() => setShowCheckinSheet(false)}
        />
      )}
    </AnimatePresence>

    {/* 푸시 구독 유도 바텀시트 */}
    <AnimatePresence>
      {showPushPrompt && (
        <PushPromptSheet
          isLoading={pushLoading}
          onAllow={async () => {
            await handlePushToggle();
            dismissPushPrompt();
            setShowPushPrompt(false);
          }}
          onDismiss={() => {
            dismissPushPrompt();
            setShowPushPrompt(false);
          }}
        />
      )}
    </AnimatePresence>

    {/* ── 공유 슬라이드는 서버사이드(generate-share.ts)에서 생성됨 ── */}
    <div ref={resultScrollRef} className="h-[calc(100dvh-60px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-40 space-y-6" variants={stagger} initial="initial" animate="animate">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-full gap-1.5 hover:bg-rose-50"
            style={{ borderColor: SCAN_TO, color: SCAN_TO }}>
            <Camera className="w-4 h-4" /> {t("result.back")}
          </Button>
          <h2 className="text-xl font-black tracking-tight" style={{ color: DEEP_GREEN }}>{t("result.title")}</h2>
        </div>

        {/* 압축형 결과 헤더 */}
        <ResultHeaderCard
          faceCroppedSrc={faceCroppedSrc}
          imageSrc={imageSrc}
          finalType={finalType}
          overallScore={overallScore}
          scoreDelta={scoreDelta}
          weakestSummary={weakestSummary}
          rankingData={rankingData}
          analysisResult={analysisResult}
          currentStreak={currentStreak}
          showBaumannInfo={showBaumannInfo}
          setShowBaumannInfo={setShowBaumannInfo}
          setShowAnalysis={setShowAnalysis}
          previewScoreItems={previewScoreItems}
        />

        {/* ── 오늘의 핵심 액션 카드 ── */}
        {(analysisResult?.improvements ?? []).length > 0 && (() => {
          const top = (analysisResult.improvements as { title: string; desc: string }[])[0];
          return (
            <motion.div variants={fadeChild} className="rounded-3xl p-4"
              style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: TINT_WARM }}><Target className="w-4 h-4" style={{ color: SCAN_TO }} /></div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                  {t("result.todayAction")}
                </p>
              </div>
              <p className="text-sm font-bold text-stone-800 leading-tight mb-1">{top.title}</p>
              <p className="text-[11px] text-stone-500 leading-relaxed">{top.desc}</p>
            </motion.div>
          );
        })()}

        {/* ── 3탭 네비게이션 ── */}
        <div ref={tabNavRef} className="rounded-3xl p-2 sticky top-0 z-20 backdrop-blur-md"
          style={{ background: "rgba(248,245,242,0.94)", boxShadow: "0 8px 20px rgba(45,95,79,0.05)" }}>
          <div className="flex gap-2">
            {([
              { id: "routine" as const,   label: t("result.tab.routine"),   icon: <CheckCircle2 className="w-4 h-4" />, activeBg: TINT_GREEN, activeText: DEEP_GREEN },
              { id: "solution" as const,  label: t("result.tab.solution"),  icon: <Leaf className="w-4 h-4" />,         activeBg: TINT_WARM, activeText: SCAN_TO },
              { id: "nutrition" as const, label: t("result.tab.nutrition"), icon: <Utensils className="w-4 h-4" />,     activeBg: "#FFF7ED", activeText: "#C2410C" },
            ]).map(({ id, label, icon, activeBg, activeText }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} onClick={() => goTo(id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl text-xs font-medium transition-all"
                  style={isActive
                    ? { background: activeBg, color: activeText }
                    : { background: "#FFFFFF", color: "#A8A29E" }}>
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={tabContentRef} className="overflow-hidden"
          onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            if (startX == null) return;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) < 40) return;
            const cur = TAB_SEQUENCE.indexOf(activeTab);
            if (diff < 0 && cur < TAB_SEQUENCE.length - 1) goTo(TAB_SEQUENCE[cur + 1]);
            else if (diff > 0 && cur > 0) goTo(TAB_SEQUENCE[cur - 1]);
          }}>
        <AnimatePresence mode="wait" initial={false} custom={tabDirectionRef.current}>
        {/* ── 루틴 탭 ── */}
        {activeTab === "routine" && (
          <motion.div key="routine" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <ResultRoutineTab
            showOnboarding={showOnboarding}
            setShowOnboarding={setShowOnboarding}
            history={history}
            questStatusDetail={questStatusDetail}
            nextStreakGoal={nextStreakGoal}
            daysToGoal={daysToGoal}
            nextStreakReward={nextStreakReward}
            questProgressPct={questProgressPct}
            essentialQuests={essentialQuests}
            setShowQuestSheet={setShowQuestSheet}
            morningRoutineItems={morningRoutineItems}
            eveningRoutineItems={eveningRoutineItems}
            morningRoutineComplete={morningRoutineComplete}
            eveningRoutineComplete={eveningRoutineComplete}
            setRoutinePeriodCompletion={setRoutinePeriodCompletion}
            handleDiaryEntry={handleDiaryEntry}
            routineGuide={routineGuide}
            cosmeticsInsights={cosmeticsInsights}
            cosmeticCount={cosmeticCount}
            user={user}
            setShowCosmeticsRegister={setShowCosmeticsRegister}
            setShowCosmeticsGate={setShowCosmeticsGate}
            myCosmetics={myCosmetics}
            overallScore={overallScore}
            previousScore={previousScore}
            currentStreak={currentStreak}
            onOpenDiary={onOpenDiary}
            loginPromptRef={loginPromptRef}
            socialLoginButton={socialLoginButton}
            handleGoogleLogin={handleGoogleLogin}
            goTo={goTo}
          />
          </motion.div>
        )}

        {/* ── 솔루션 탭 ── */}
        {activeTab === "solution" && (
          <motion.div key="solution" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <ResultSolutionTab
            user={user}
            cosmeticCount={cosmeticCount}
            setShowCosmeticsRegister={setShowCosmeticsRegister}
            setShowCosmeticsGate={setShowCosmeticsGate}
            analysisResult={analysisResult}
            handleDiaryEntry={handleDiaryEntry}
            pushSubscribed={pushSubscribed}
            pushLoading={pushLoading}
            handlePushToggle={handlePushToggle}
            aiCareSettings={aiCareSettings}
            updateAICareOption={updateAICareOption}
            aiCareLabels={aiCareLabels}
            setShowWaitlist={setShowWaitlist}
            goTo={goTo}
          />
          </motion.div>
        )}

        {/* ── 영양 탭 ── */}
        {activeTab === "nutrition" && (
          <motion.div key="nutrition" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <ResultNutritionTab analysisResult={analysisResult} />
          </motion.div>
        )}

        </AnimatePresence>
        </div>

        {/* ── 제휴 텍스트 링크 ── */}
        <div className="pt-2 pb-1 text-center">
          <button onClick={() => setShowPartnership(true)}
            className="text-[11px] text-stone-400 underline underline-offset-2 hover:text-stone-600 transition-colors">
            {t("result.partnershipLink")}
          </button>
        </div>

      </motion.div>

      <ResultActionBar
        shareLoading={shareLoading}
        pendingChallengeToken={pendingChallengeToken}
        currentShareToken={currentShareToken}
        onShare={handleShare}
        onOpenChallenge={() => {
          sessionStorage.removeItem("battleChallengeToken");
          window.location.href = `/battle/${pendingChallengeToken}`;
        }}
        onCreateChallenge={() => {
          if (!currentShareToken) return;
          markChallengeUsed();
          const shareUrl = `${window.location.origin}/battle/${currentShareToken}`;
          if (navigator.share) {
            navigator
              .share({
                title: "Fonday AI 피부 챌린지!",
                text: t("result.shareText", { score: overallScore, type: finalType }),
                url: shareUrl,
              })
              .catch(console.error);
          } else {
            navigator.clipboard.writeText(shareUrl).then(() => alert(t("result.challengeLinkCopied")));
          }
        }}
      />

      <ResultAnalysisSheet
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        aiComment={analysisResult?.aiComment}
        scores={scores}
        skinReport={(analysisResult?.skinReport as { area: string; finding: string }[]) ?? []}
        finalType={finalType}
      />

      <ResultImprovementsSheet
        open={showImprovements}
        onClose={() => setShowImprovements(false)}
        improvements={(analysisResult?.improvements as { title: string; desc: string }[]) ?? []}
        cosmetics={(analysisResult?.cosmetics as { type: string; key: string; reason: string }[]) ?? []}
      />

      <ResultNutrientsSheet
        open={showNutrients}
        onClose={() => setShowNutrients(false)}
        finalType={finalType}
        avoidLunch={avoidLunch}
        avoidDinner={avoidDinner}
      />

      <ResultCosmeticsGateSheet
        open={showCosmeticsGate}
        language={i18n.language}
        onClose={() => setShowCosmeticsGate(false)}
        onLogin={(provider) => {
          setShowCosmeticsGate(false);
          openLoginPopup(provider, "scan");
        }}
      />

      {/* 화장품 등록 모달 */}
      <AnimatePresence>
        {showCosmeticsRegister && (
          <CosmeticsRegisterModal
            onClose={() => setShowCosmeticsRegister(false)}
            onSuccess={() => {
              setShowCosmeticsRegister(false);
              void refreshCosmetics({ openRoutineUpdate: true });
            }}
          />
        )}
      </AnimatePresence>

      <RoutineUpdateSheet
        open={showRoutineUpdateSheet}
        onClose={() => setShowRoutineUpdateSheet(false)}
        morningRoutineItems={morningRoutineItems}
        eveningRoutineItems={eveningRoutineItems}
        onApply={() => {
          saveDiaryTodos(todayStr(), routineUpdateItems.map((text) => ({ text, done: false })));
          setShowRoutineUpdateSheet(false);
        }}
      />

      <ResultQuestSheet
        open={showQuestSheet}
        onClose={() => setShowQuestSheet(false)}
        totalPoints={totalPoints}
        doneCount={questDoneCount}
        totalCount={questBoard.length}
        questBoard={questBoard}
      />

      <PartnershipModal
        open={showPartnership}
        onClose={() => setShowPartnership(false)}
        form={partnerForm}
        onFormChange={setPartnerForm}
        onSubmit={handlePartnershipSubmit}
        submitting={isPartnerSubmitting}
        success={isPartnerSuccess}
      />

      {/* 얼리버드 모달 */}
      <WaitlistModal
        open={showWaitlist}
        onClose={() => setShowWaitlist(false)}
        email={email}
        onEmailChange={setEmail}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        onSubmit={handleWaitlistSubmit}
      />
    </div>
    </>
  );
}
