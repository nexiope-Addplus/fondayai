import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Camera,
  BookOpen,
  ScanLine,
  AlertCircle,
  Shield,
  Sun,
  Moon,
  Share2,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Heart,
  Droplets,
  LayoutGrid,
  Activity,
  Target,
  Flame,
  Eye,
  Zap,
  Leaf,
  Star,
  Waves,
  X,
  Lock,
  Thermometer,
  FileText,
  PlusSquare,
  SmartphoneNfc,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  Utensils,
  Trophy,
  CalendarDays,
  CheckCircle2,
  Bell,
  Smartphone,
  ClipboardList,
  Pill,
  Crown,
  Ban,
  Droplet,
  Microscope,
  Bot,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Extracted shared modules ──────────────────────────────────────────────
export type { TabId, ScanState, SurveyData, Hotspot, PredictionScenario, AnalysisResult, RankingData, CosmeticItem, StreakData, MissionState, AttendanceData, MagazineArticle, ReminderSettings, AICareSettings, DiaryCauseTag, WeatherData, WeatherTipKey, TodoItem, ReportLang, ReportConcernKey } from "../components/fonday/types";
import type { TabId, ScanState, SurveyData, Hotspot, PredictionScenario, AnalysisResult, RankingData, CosmeticItem, StreakData, MissionState, AttendanceData, MagazineArticle, ReminderSettings, AICareSettings, DiaryCauseTag, WeatherData, WeatherTipKey, TodoItem, ReportLang, ReportConcernKey } from "../components/fonday/types";
import {
  BAUMANN_COLORS, DEEP_GREEN, DEEP_GREEN_LIGHT, TEXT_SECONDARY, SCAN_FROM, SCAN_TO,
  TINT_WARM, TINT_GREEN, TINT_NEUTRAL, SCORE_LABEL_MAP, NUTRIENT_COLORS, NUTRIENT_ICONS,
  SCORE_ICONS, SCORE_COLORS, fadeChild, stagger, tabSlideVariants, MISSION_POINTS,
  DIARY_CAUSE_TAGS, LEGACY_DIARY_CAUSE_TAG_MAP, CAUSE_TAG_KEYWORDS,
  CATEGORY_ORDER, COSMETIC_CATEGORIES, CATEGORY_FILTERS, MAGAZINE_ARTICLES,
} from "../components/fonday/constants";
import {
  buildPushScoreSummary, buildBaumannTypeFromResult, todayStr,
  getStreak, updateStreak, getDaysSinceLastScan,
  getMissions, checkAndCompleteMissions,
  getAttendance, checkinToday,
  isIOS, isAndroid, isPWA, shouldShowPushPrompt, dismissPushPrompt,
  markChallengeUsed, markShareUsed,
  getDiaryMemo,
  getAICareSettings, saveAICareSettings,
  getDiaryCauseTags,
  getReminderSettings, saveReminderSettings,
  getDiaryTodos, saveDiaryTodos, getDiaryTodoProgress, initDiaryTodosFromRoutine,
  syncReminderToServer,
  daysSinceDate, buildCosmeticsInsights,
  sortCosmeticsForRoutine, inferCosmeticTimeOfDay, buildRoutineGuide,
  getWeatherTipKey, cropFaceFromImage, compressThumbnail,
} from "../components/fonday/utils";
import { DiaryTab as ExtractedDiaryTab } from "../components/fonday/DiaryTab";
import { MagazineTab } from "../components/fonday/MagazineTab";
import { MyScreen } from "../components/fonday/MyScreen";
import { SkinPredictionCard } from "../components/fonday/SkinPredictionCard";
import { ResultDiaryCard } from "../components/fonday/ResultDiaryCard";
import { ResultLoginCard } from "../components/fonday/ResultLoginCard";
import { ResultNutrientsSheet } from "../components/fonday/ResultNutrientsSheet";
import { ResultImprovementsSheet } from "../components/fonday/ResultImprovementsSheet";
import { ResultAnalysisSheet } from "../components/fonday/ResultAnalysisSheet";
import { ResultCosmeticsGateSheet } from "../components/fonday/ResultCosmeticsGateSheet";
import { ResultActionBar } from "../components/fonday/ResultActionBar";
import { ResultQuestSheet } from "../components/fonday/ResultQuestSheet";
import { PartnershipModal } from "../components/fonday/PartnershipModal";
import { CheckinSuccessSheet, AttendanceBadge } from "../components/fonday/CheckinSuccessSheet";
import { PushPromptSheet } from "../components/fonday/PushPromptSheet";
import { CameraCapture } from "../components/fonday/CameraCapture";
import { WeatherTipCard, MiniScoreBarIdle } from "../components/fonday/WeatherTipCard";
import { MissionCard } from "../components/fonday/MissionCard";
import { BottomNav, LangSwitcher } from "../components/fonday/BottomNav";
import { FaceMeshOverlay } from "../components/fonday/FaceMeshOverlay";
import { ScanIdleScreen } from "../components/fonday/ScanIdleScreen";
import { SurveyScreen } from "../components/fonday/SurveyScreen";
import { ScanningScreen } from "../components/fonday/ScanningScreen";
import { ResultScreen } from "../components/fonday/ResultScreen";
import { RoutineTab } from "../components/fonday/RoutineTab";

class FeedErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Feed render failed" };
  }

  componentDidCatch(error: Error) {
    console.error("[FeedErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[calc(100dvh-64px)] px-5 py-6" style={{ background: "#F8F5F2" }}>
          <div className="rounded-3xl bg-white p-5" style={{ boxShadow: "0 10px 28px rgba(45,95,79,0.08)" }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2 text-stone-400">FEED ERROR</p>
            <p className="text-[15px] font-bold text-stone-800">피드 탭 렌더링 중 오류가 발생했습니다.</p>
            <p className="text-[12px] text-stone-500 mt-2 break-all">{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// ─── Google AdSense 배너 ──────────────────────────────────────────
// 주의: AdSense 대시보드에서 각 위치별로 별도 광고 단위를 생성 후 data-ad-slot 값을 개별 교체하세요.
// 동일한 slot ID를 여러 위치에 쓰면 정책 위반이 될 수 있습니다.
function AdBanner({ slot }: { slot: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // 광고는 실제 콘텐츠가 로드된 후에만 삽입
    const timer = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setLoaded(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="w-full overflow-hidden my-2">
      {/* 광고 레이블 - AdSense 정책 준수 (광고임을 명시) */}
      <p className="text-xs text-center text-stone-300 mb-1 tracking-widest uppercase font-medium">광고</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5928664043346684"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}



export default function SkinScanPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [showCamera, setShowCamera] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [faceCroppedSrc, setFaceCroppedSrc] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [user, setUser] = useState<any>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const justLoggedInRef = useRef(false);

  // 날씨 정보 중앙 관리 (Care Manager 기초 데이터)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      fetch(`/api/weather?lat=${lat}&lon=${lon}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data && !data.error) setWeatherData(data); })
        .catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleScanNew = () => {
    setActiveTab("scan");
    setScanState("idle");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const justLoggedIn = params.get("login") === "success";
    justLoggedInRef.current = justLoggedIn;
    if (justLoggedIn) window.history.replaceState({}, "", "/");

    fetch("/api/user")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data ?? null);
        if (data && justLoggedIn) {
          // 팝업 모드: 부모에 알리고 닫기
          if (window.opener && !window.opener.closed) {
            try { window.opener.postMessage("fonday:login:success", window.location.origin); window.close(); } catch {}
          }
          // iOS PWA LINE 로그인: 새 Safari 탭 → BroadcastChannel로 원래 PWA 탭에 알림
          try { const bc = new BroadcastChannel("fonday-auth"); bc.postMessage({ type: "login_complete" }); bc.close(); } catch {}
        }
      })
      .catch(() => setUser(null));
  }, []);

  // visibilitychange: LINE 로그인 후 PWA로 돌아올 때 자동 로그인 감지
  // (iOS에서 LINE 앱 경유 → Safari 새탭 콜백 → PWA로 복귀 시 쿠키 공유로 자동 로그인)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!localStorage.getItem("fonday_login_pending")) return;
      fetch("/api/user").then(r => r.ok ? r.json() : null).then(u => {
        if (u) {
          localStorage.removeItem("fonday_login_pending");
          setUser(u);
        }
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // 팝업 로그인 (DiaryTab·MyScreen 등에서 사용)
  const openLoginPopup = useCallback((provider: "kakao" | "line" | "google", returnTab?: string) => {
    if (returnTab) localStorage.setItem("fonday_return_tab", returnTab);
    window.location.href = `/auth/${provider}`;
  }, []);

  // 로그인 후 게스트 스캔 연결
  useEffect(() => {
    if (!user) return;
    const guestToken = (() => { try { return localStorage.getItem("fonday_guest_token"); } catch { return null; } })();
    if (!guestToken) return;
    fetch("/api/link-guest-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareToken: guestToken }),
    }).then(() => {
      try { localStorage.removeItem("fonday_guest_token"); } catch {}
    }).catch(() => {});
  }, [user]);

  // 로그인 후 스트릭/출석 서버 데이터 복원
  useEffect(() => {
    if (!user) return;
    fetch("/api/user-stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        // streak: count 더 큰 쪽 우선
        try {
          const local = getStreak();
          if ((data.streak?.count ?? 0) > (local.count ?? 0)) {
            localStorage.setItem("fonday_streak", JSON.stringify(data.streak));
          }
          // attendance: dates 합집합
          const localAtt = getAttendance();
          if (data.attendance?.dates) {
            const unionDates = Array.from(new Set([...localAtt.dates, ...data.attendance.dates]));
            const merged = { dates: unionDates, totalPoints: unionDates.length * 3 };
            localStorage.setItem("fonday_attendance", JSON.stringify(merged));
          }
        } catch { /* ignore */ }
      })
      .catch(() => {});
  }, [user]);

  // 피부 일기 서버 동기화 — 저장 이벤트 발생 시 서버에 write-through
  useEffect(() => {
    if (!user) return;
    const handler = (e: Event) => {
      const dateStr = (e as CustomEvent).detail?.dateStr || todayStr();
      const memo = getDiaryMemo(dateStr);
      const todos = getDiaryTodos(dateStr);
      const causeTags = getDiaryCauseTags(dateStr);
      fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateStr, memo, todos, causeTags }),
      }).catch(() => {});
    };
    window.addEventListener("fonday:diary-updated", handler);
    return () => window.removeEventListener("fonday:diary-updated", handler);
  }, [user]);

  // OAuth 로그인 후 결과 화면 복원
  useEffect(() => {
    if (user === undefined || !user) return;
    const saved = localStorage.getItem("pendingResult");
    if (saved) {
      try {
        const { analysisResult: ar, surveyData: sd, imageBase64: imgB64 } = JSON.parse(saved);
        if (ar) {
          setAnalysisResult(ar);
          setSurveyData(sd);
          if (imgB64) setImageSrc(imgB64);
          setScanState("result");
        }
      } catch { /* ignore */ }
      localStorage.removeItem("pendingResult");
    }
    const returnTab = localStorage.getItem("fonday_return_tab");
    if (justLoggedInRef.current && returnTab) {
      setActiveTab(returnTab as TabId);
    }
    localStorage.removeItem("fonday_return_tab");
  }, [user]);

  const handleCapture = useCallback((file: File) => {
    setImageFile(file);
    const objUrl = URL.createObjectURL(file);
    setImageSrc(objUrl);
    setFaceCroppedSrc(null);
    cropFaceFromImage(objUrl).then(setFaceCroppedSrc).catch(() => {});
    setShowCamera(false);
    setScanState("survey");
    // 설문 중에 미리 base64 변환 시작
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImageBase64(reader.result as string);
  }, []);

  const handleSurveySubmit = useCallback(async (data: SurveyData) => {
    setSurveyData(data);
    setScanState("scanning");
    if (!imageFile) return;

    // base64가 아직 준비되지 않았으면 대기
    let b64 = imageBase64;
    if (!b64) {
      b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => resolve(reader.result as string);
      });
      setImageBase64(b64);
    }

    try {
      const response = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, surveyData: data, lang: i18n.language || "en" }),
      });
      const rawText = await response.text();
      console.log("[API 응답]", response.status, rawText.slice(0, 300));
      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(rawText);
          msg = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
        } catch { msg += ": " + rawText.slice(0, 100); }
        alert(`분석 실패: ${msg}`);
        setScanState("idle");
        return;
      }
      const result = JSON.parse(rawText);
      setAnalysisResult(result);
      setScanState("result");
    } catch (err: any) {
      alert(`분석 실패: ${err.message || "네트워크 오류"}`);
      setScanState("idle");
    }
  }, [imageFile, imageBase64]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-stone-900">
      <div className="max-w-md mx-auto relative min-h-[100dvh]">

        {/* 얼굴 가이드 카메라 */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {scanState === "idle" && (
                <ScanIdleScreen
                  weather={weatherData}
                  onScan={() => setShowCamera(true)}
                  onOpenRoutine={() => setActiveTab("routine")}
                  onOpenDiary={() => setActiveTab("diary")}
                  onOpenDiscover={() => setActiveTab("magazine")}
                  onOpenMy={() => setActiveTab("my")}
                />
              )}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen imageSrc={imageSrc} />}
              {scanState === "result" && (
                <ResultScreen
                  weather={weatherData}
                  surveyData={surveyData}
                  analysisResult={analysisResult}
              ...
                  faceCroppedSrc={faceCroppedSrc}
                  imageBase64={imageBase64}
                  onBack={() => setScanState("idle")}
                  onGoRoutine={() => setActiveTab("routine")}
                  onGoMagazine={() => setActiveTab("magazine")}
                  onOpenDiary={() => setActiveTab("diary")}
                  onGoMy={() => setActiveTab("my")}
                  user={user}
                  deferredPrompt={deferredPrompt}
                  onShowInstallGuide={() => setShowInstallGuide(true)}
                />
              )}
            </motion.div>
          )}
          {activeTab === "diary" && (
            <motion.div key="diary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExtractedDiaryTab user={user} analysisResult={analysisResult} onBack={() => setActiveTab("scan")} onLogin={openLoginPopup} />
            </motion.div>
          )}
          {activeTab === "routine" && (
            <motion.div key="routine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoutineTab user={user} onLogin={openLoginPopup} />
            </motion.div>
          )}
          {activeTab === "magazine" && (
            <motion.div key="magazine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedErrorBoundary>
                <MagazineTab />
              </FeedErrorBoundary>
            </motion.div>
          )}
          {activeTab === "my" && (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MyScreen user={user} analysisResult={analysisResult} onInstall={handleInstall} onBack={() => setActiveTab("scan")} onLogin={openLoginPopup} onGoMagazine={() => setActiveTab("magazine")} onGoRoutine={() => setActiveTab("routine")} onOpenDiary={() => setActiveTab("diary")} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 앱 추가 안내 모달 (iOS) */}
        <AnimatePresence>
          {showInstallGuide && (
            <motion.div className="fixed inset-0 z-[200] flex items-end justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)} />
              <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl p-7"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  <SmartphoneNfc className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-center text-lg font-black mb-2" style={{ color: "#2D5F4F" }}>{t("install.title")}</h3>
                <p className="text-center text-sm text-stone-400 mb-6">{t("install.desc")}</p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step1") }} />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step2") }} />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step3") }} />
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full h-12 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  {t("install.close")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} scanState={scanState} />
    </div>
  );
}
