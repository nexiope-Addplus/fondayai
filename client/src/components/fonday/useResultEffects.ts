import { useEffect, useRef } from "react";
import i18n from "../../i18n";
import type { CosmeticItem, MissionState, StreakData, RankingData, TodoItem } from "./types";
import {
  todayStr,
  getStreak, updateStreak,
  getMissions, checkAndCompleteMissions,
  getAttendance, checkinToday,
  getDiaryMemo,
  getDiaryTodoProgress, getDiaryTodos, initDiaryTodosFromRoutine,
  haptic,
  isIOS, isPWA, isTossMiniApp, buildStableBaumannType, apiBase, appFetch,
} from "./utils";

export interface UseResultEffectsParams {
  analysisResult: any;
  user: any;
  surveyData: any;
  imageBase64: any;
  deferredPrompt: any;
  resultScrollRef: React.RefObject<HTMLDivElement>;
  // state setters
  setHistory: (v: any[]) => void;
  setIsSaved: (v: boolean) => void;
  setCurrentScanId: (v: string | null) => void;
  setCurrentShareToken: (v: string | null) => void;
  setInternalWeather: (v: any) => void;
  setShowPwaPopup: (v: boolean) => void;
  setRankingData: (v: RankingData | null) => void;
  setPendingChallengeToken: (v: string | null) => void;
  setStreakMilestone: (v: number | null) => void;
  setStreakDelta: (v: number) => void;
  setMissionPops: (v: string[]) => void;
  setMissionState: (v: MissionState) => void;
  setCurrentStreak: (v: StreakData) => void;
  setTodayTodoProgress: (v: { done: number; total: number }) => void;
  setTodayRoutineTodos: (v: TodoItem[]) => void;
  setTodayHasMemo: (v: boolean) => void;
  setShowCheckinSheet: (v: boolean) => void;
  setCheckedCosmeticIds: (v: string[]) => void;
  setCosmeticGrades: (v: { id: string; grade: string; score: number; summary: string }[]) => void;
  // derived values
  finalType: string;
  myCosmetics: CosmeticItem[];
  isSaved: boolean;
  currentShareToken: string | null;
  showAnalysis: boolean;
  showImprovements: boolean;
  internalWeather: any;
  guestTokenFetched: boolean;
  setGuestTokenFetched: (v: boolean) => void;
  activeTab: string;
  refreshCosmetics: (options?: { openRoutineUpdate?: boolean }) => Promise<void>;
  history: any[];
}

export function useResultEffects(params: UseResultEffectsParams): {
  tabContentRef: React.MutableRefObject<HTMLDivElement | null>;
} {
  const {
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
  } = params;

  // PWA 설치 팝업: 결과 페이지 50% 스크롤 후 표시
  const pwaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pwaTriggeredRef = useRef(false);
  useEffect(() => {
    const isDismissed = localStorage.getItem("fonday_pwa_dismissed") === "1";
    if (isPWA() || isDismissed || pwaTriggeredRef.current || isTossMiniApp()) return;
    if (!isIOS() && !deferredPrompt) return;

    const el = resultScrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const ratio = scrollTop / Math.max(1, scrollHeight - clientHeight);
      if (ratio >= 0.5 && !pwaTriggeredRef.current) {
        pwaTriggeredRef.current = true;
        pwaTimerRef.current = setTimeout(() => setShowPwaPopup(true), 1000);
        el.removeEventListener("scroll", handleScroll);
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (pwaTimerRef.current) {
        clearTimeout(pwaTimerRef.current);
        pwaTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredPrompt]);

  // 챌린지 참여 후 내 결과 저장
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
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (isNewMilestone) {
      setStreakMilestone(streak.count);
      timers.push(setTimeout(() => setStreakMilestone(null), 3000));
    }
    const newMissions = checkAndCompleteMissions();
    setMissionState(getMissions());
    if (newMissions.length > 0) {
      setMissionPops(newMissions);
      timers.push(setTimeout(() => setMissionPops([]), 3500));
    }
    const isNew = checkinToday();
    if (isNew && !isTossMiniApp()) {
      timers.push(setTimeout(() => { haptic("success"); setShowCheckinSheet(true); }, 1200));
    }
    if (analysisResult?.prediction?.good?.routine) {
      initDiaryTodosFromRoutine(todayStr(), analysisResult.prediction.good.routine);
    }
    setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
    setTodayRoutineTodos(getDiaryTodos(todayStr()));
    setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    if (user) {
      appFetch(`${apiBase()}/api/user-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak: getStreak(),
          attendance: getAttendance(),
          missionState: getMissions(),
        }),
      }).catch(() => {});
    }
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diary event listener
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

  // 히스토리 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    appFetch(`${apiBase()}/api/scans`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
          try {
            if (!localStorage.getItem("fonday_total_scans") && data.length > 0) {
              localStorage.setItem("fonday_total_scans", String(data.length));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [user]);

  // 등록된 화장품 수 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    void refreshCosmetics();
  }, [user, refreshCosmetics]);

  // 랭킹 데이터 로드
  useEffect(() => {
    const score = analysisResult?.scores?.[0]?.score || 0;
    appFetch(`${apiBase()}/api/ranking?myScore=${score}`)
      .then(res => res.json())
      .then(data => setRankingData(data))
      .catch(() => {});
  }, [analysisResult]);

  // 비로그인 챌린지 토큰 생성
  useEffect(() => {
    if (!analysisResult || currentShareToken || guestTokenFetched) return;
    if (user !== null && !isSaved) return;
    setGuestTokenFetched(true);
    const KO_AGE_GROUPS = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
    appFetch(`${apiBase()}/api/challenge-token`, {
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
        try { localStorage.setItem("fonday_guest_token", data.shareToken); } catch {}
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, analysisResult, isSaved, currentShareToken]);

  // 날씨 정보 가져오기
  useEffect(() => {
    if (!navigator.geolocation) return;
    const controller = new AbortController();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        appFetch(`${apiBase()}/api/weather?lat=${lat}&lon=${lon}`, { signal: controller.signal })
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data && !data.error) setInternalWeather(data); })
          .catch(() => {});
      },
      () => {},
      { timeout: 5000, enableHighAccuracy: false }
    );
    return () => controller.abort();
  }, []);

  // 스캔 저장
  const savingRef = useRef(false);
  useEffect(() => {
    if (!user || !analysisResult || isSaved || savingRef.current) return;
    savingRef.current = true;
    const overallScore = analysisResult.scores?.[0]?.score || 0;

    appFetch(`${apiBase()}/api/scans`, {
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
        weatherInfo: internalWeather,
        lang: i18n.language || "ko",
        gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
        ageGroup: ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"][surveyData?.ageIdx ?? 2] ?? "",
        referrer: localStorage.getItem("fonday_referrer") || "",
      })
    }).then(res => res.json()).then(data => {
      setIsSaved(true);
      if (data?.id) setCurrentScanId(data.id);
      if (data?.shareToken) setCurrentShareToken(data.shareToken);
      try {
        const prev = parseInt(localStorage.getItem("fonday_total_scans") ?? "0", 10);
        localStorage.setItem("fonday_total_scans", String(prev + 1));
      } catch {}

      const KO_AGE_GROUPS2 = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
      appFetch(`${apiBase()}/api/challenge-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallScore,
          baumannType: finalType,
          scores: analysisResult.scores,
          skinAge: analysisResult.skinAge,
          aiComment: analysisResult.aiComment,
          weatherInfo: internalWeather,
          lang: i18n.language || "ko",
          isGuest: false,
          gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
          ageGroup: KO_AGE_GROUPS2[surveyData?.ageIdx ?? 2] ?? "",
        }),
      }).then(res => res.json()).then(d => {
        if (d?.shareToken && !currentShareToken) setCurrentShareToken(d.shareToken);
      }).catch(() => {});
    }).catch(err => console.error("[Scan Save Error]", err));
  }, [user, analysisResult, internalWeather]);

  // 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    const el = resultScrollRef.current;
    if (!el) return;
    el.style.overflow = (showAnalysis || showImprovements) ? 'hidden' : 'auto';
  }, [showAnalysis, showImprovements]);

  // 탭 전환 시 스크롤
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const tabMountedRef = useRef(false);
  useEffect(() => {
    if (!tabMountedRef.current) {
      tabMountedRef.current = true;
      return;
    }
    const content = tabContentRef.current;
    const container = resultScrollRef.current;
    if (content && container) {
      container.scrollTo({ top: content.offsetTop - 8, behavior: "smooth" });
    }
  }, [activeTab]);

  // 화장품 등급 로드
  useEffect(() => {
    if (!user || !analysisResult || myCosmetics.length === 0) return;
    appFetch(`${apiBase()}/api/cosmetics/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baumannType: finalType,
        scores: analysisResult.scores,
        lang: i18n.language || "ko",
      }),
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCosmeticGrades(data); })
      .catch(() => {});
  }, [user, myCosmetics.length > 0, analysisResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // 루틴 로그
  useEffect(() => {
    if (!user) return;
    appFetch(`${apiBase()}/api/routine-log?date=${todayStr()}`)
      .then(r => r.ok ? r.json() : { cosmetic_ids: [] })
      .then(data => {
        const ids = Array.isArray(data.cosmetic_ids) ? data.cosmetic_ids : [];
        setCheckedCosmeticIds(ids);
      })
      .catch(() => {});
  }, [user]);

  return { tabContentRef };
}
