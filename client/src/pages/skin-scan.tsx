import React, { useState, useRef, useCallback, useEffect, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, SmartphoneNfc } from "lucide-react";
import { isTossMiniApp, apiBase, appFetch } from "../components/fonday/utils";
import { useInterstitialAd } from "../components/fonday/TossAd";
import type { TabId, ScanState, SurveyData, AnalysisResult } from "../components/fonday/types";
import {
  todayStr, getStreak, getAttendance,
  getDiaryMemo, getDiaryTodos, getDiaryCauseTags,
  cropFaceFromImage,
} from "../components/fonday/utils";
import { useAnalytics } from "../components/fonday/useAnalytics";
import { CameraCapture } from "../components/fonday/CameraCapture";
import { ScanIdleScreen } from "../components/fonday/ScanIdleScreen";
import { SurveyScreen } from "../components/fonday/SurveyScreen";
import { ScanningScreen } from "../components/fonday/ScanningScreen";
import { ResultScreen } from "../components/fonday/ResultScreen";
import { BottomNav } from "../components/fonday/BottomNav";

// 탭 컴포넌트 — 첫 방문 시 scan 탭만 로드, 나머지는 탭 전환 시 지연 로드
const DiaryTab = lazy(() => import("../components/fonday/DiaryTab").then(m => ({ default: m.DiaryTab })));
// Ultra-MVP: MagazineTab 숨김 — 리텐션 검증 후 복원
// const MagazineTab = lazy(() => import("../components/fonday/MagazineTab").then(m => ({ default: m.MagazineTab })));
const MyScreen = lazy(() => import("../components/fonday/MyScreen").then(m => ({ default: m.MyScreen })));
const RoutineTab = lazy(() => import("../components/fonday/RoutineTab").then(m => ({ default: m.RoutineTab })));
const RecommendTab = lazy(() => import("../components/fonday/RecommendTab").then(m => ({ default: m.RecommendTab })));

// Ultra-MVP: FeedErrorBoundary 숨김 — 매거진 탭 복원 시 함께 복원
// class FeedErrorBoundary extends React.Component<...> { ... }


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
  const [scanError, setScanError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const prevTabRef = useRef<TabId>("scan");
  const justLoggedInRef = useRef(false);

  const { trackEvent } = useAnalytics(i18n.language, !user);

  // Interstitial ad — load+show in one call during scan analysis
  const interstitialAd = useInterstitialAd();

  const TAB_ORDER: TabId[] = ["scan", "routine", "diary", "my"];
  const tabDirection = TAB_ORDER.indexOf(activeTab) >= TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1;

  const handleTabChange = (tab: TabId) => {
    prevTabRef.current = activeTab;
    setActiveTab(tab);
    trackEvent("tab_view", { tab });
  };

  // PWA 설치 프롬프트 — 토스 미니앱에서는 비활성화
  useEffect(() => {
    if (isTossMiniApp()) return;
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    const installed = () => { trackEvent("pwa_prompt_accepted"); setDeferredPrompt(null); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", handler); window.removeEventListener("appinstalled", installed); };
  }, []);

  const handleInstall = async () => {
    if (isTossMiniApp()) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (deferredPrompt) {
      trackEvent("pwa_prompt_shown");
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      trackEvent(choice.outcome === "accepted" ? "pwa_prompt_accepted" : "pwa_prompt_dismissed");
      setDeferredPrompt(null);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setShowInstallGuide(true);
    } else {
      alert(t("install.androidHint", "브라우저 메뉴(⋮) → '홈 화면에 추가'를 눌러주세요"));
    }
  };

  const handleScanNew = () => {
    setActiveTab("scan");
    setScanState("idle");
  };

  // 토스 미니앱: toss-miniapp 클래스 추가 (폰트 오버라이드용)
  useEffect(() => {
    if (isTossMiniApp()) document.documentElement.classList.add("toss-miniapp");
  }, []);

  // 토스 미니앱: user 상태는 getAnonymousKey useEffect에서 자동 설정됨
  // 비-토스 환경에서는 쿠키 기반 세션 확인
  useEffect(() => {
    if (isTossMiniApp()) return; // 토스는 getAnonymousKey에서 처리
    fetch(`${apiBase()}/api/user`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data ?? null))
      .catch(() => setUser(null));
  }, []);

  // 토스 미니앱: getAnonymousKey로 자동 로그인
  const [tossAuthError, setTossAuthError] = useState(false);
  const isSimulated = !!(localStorage.getItem("fonday_toss_mode") === "1" && !(window as any).__AIT__);
  const tossLogin = useCallback(() => {
    if (!isTossMiniApp()) return;
    setTossAuthError(false);

    // 시뮬레이션 모드 (?toss=1): mock 유저로 바로 설정
    if (isSimulated) {
      const mockHash = "sim_" + Date.now();
      localStorage.setItem("fonday_toss_user_hash", mockHash);
      setUser({ id: `toss_${mockHash}`, username: "토스 테스트", provider: "toss", avatar: null, email: null });
      return;
    }

    import("@apps-in-toss/web-framework").then(({ getAnonymousKey }) => {
      getAnonymousKey().then((result) => {
        if (!result || typeof result === "string") {
          setTossAuthError(true);
          return;
        }
        if (result.type === "HASH") {
          const tossUserId = `toss_${result.hash}`;
          localStorage.setItem("fonday_toss_user_hash", result.hash);
          setUser({
            id: tossUserId,
            username: "토스 사용자",
            provider: "toss",
            avatar: null,
            email: null,
          });
        }
      }).catch(() => setTossAuthError(true));
    }).catch(() => setTossAuthError(true));
  }, [isSimulated]);
  useEffect(() => { tossLogin(); }, [tossLogin]);

  // 토스 미니앱: 로그인은 getAnonymousKey로 자동 처리됨 — no-op
  const openLoginPopup = useCallback((_provider: string, _returnTab?: string) => {}, []);

  // 로그인 후 게스트 스캔 연결
  useEffect(() => {
    if (!user) return;
    const guestToken = (() => { try { return localStorage.getItem("fonday_guest_token"); } catch { return null; } })();
    if (!guestToken) return;
    appFetch(`${apiBase()}/api/link-guest-scan`, {
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
    appFetch(`${apiBase()}/api/user-stats`)
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
      appFetch(`${apiBase()}/api/diary`, {
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

  // app_open — 세션당 1회만
  useEffect(() => {
    if (sessionStorage.getItem("fonday_app_opened")) return;
    sessionStorage.setItem("fonday_app_opened", "1");
    trackEvent("app_open", { lang: i18n.language });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    trackEvent("scan_start", { gender: data.gender, age: data.age });
    // Show interstitial ad during analysis (2nd+ scan)
    if (isTossMiniApp() && analysisResult) interstitialAd.show();
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
      let previousScores: number[] | undefined;
      try {
        const raw = localStorage.getItem("fonday_prev_scores");
        if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length === 10) previousScores = arr; }
      } catch {}
      const apiUrl = `${apiBase()}/api/analyze-skin`;
      const response = await appFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, surveyData: data, lang: i18n.language || "en", previousScores }),
      });
      const rawText = await response.text();
      console.log("[API 응답]", response.status, response.url, rawText.slice(0, 300));
      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(rawText);
          msg = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
        } catch { msg += ": " + rawText.slice(0, 100); }
        // 디버그: 실제 요청 URL 표시
        msg = `[${apiUrl}] ${msg}`;
        setScanError(msg);
        setScanState("error");
        trackEvent("scan_fail", { status: response.status });
        return;
      }
      const result = JSON.parse(rawText);
      setAnalysisResult(result);
      setScanState("result");
      trackEvent("scan_complete", { score: result.overallScore, baumannType: result.baumannType });
    } catch (err: any) {
      // 디버그: 토스에서 간단 GET 테스트로 네트워크 자체 확인
      let netTest = "untested";
      if (isTossMiniApp()) {
        try {
          const t = await fetch(`${apiBase()}/api/health`, { mode: "cors", credentials: "omit" });
          netTest = `GET:${t.status}`;
        } catch (e: any) { netTest = `GET-fail:${e.message}`; }
      }
      const debugInfo = `${err.message || "네트워크 오류"} | origin:${window.location.origin} | api:${apiBase()} | toss:${isTossMiniApp()} | net:${netTest}`;
      setScanError(debugInfo);
      setScanState("error");
      trackEvent("scan_fail", { error: "network" });
    }
  }, [imageFile, imageBase64, trackEvent]);

  // 토스 미니앱: 인증 실패 시 재시도 화면
  if (tossAuthError && isTossMiniApp()) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF9F6] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ background: "#FDF4F1" }}>
            <AlertCircle className="w-7 h-7" style={{ color: "#C97062" }} />
          </div>
          <div>
            <p className="text-[16px] font-bold text-[#4A403A]">연결에 실패했어요</p>
            <p className="text-[13px] text-[#8C8078] mt-1">잠시 후 다시 시도해 주세요</p>
          </div>
          <button
            onClick={tossLogin}
            className="px-6 py-3 rounded-2xl text-[14px] font-semibold text-white"
            style={{ background: "#4A7C6E" }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-stone-900">
      <div className="max-w-md mx-auto relative min-h-[100dvh] overflow-x-hidden">

        {/* 얼굴 가이드 카메라 */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        <AnimatePresence mode="wait" custom={tabDirection}>
          {activeTab === "scan" && (
            <motion.div
              key="scan"
              custom={tabDirection}
              initial={{ opacity: 0, x: tabDirection * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tabDirection * -24 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {scanState === "idle" && (
                <ScanIdleScreen
                  onScan={() => setShowCamera(true)}
                  onOpenRoutine={() => handleTabChange("routine")}
                  onOpenDiary={() => handleTabChange("diary")}
                  onOpenDiscover={() => handleTabChange("scan")}
                  onOpenMy={() => handleTabChange("my")}
                />
              )}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen imageSrc={imageSrc} />}
              {scanState === "error" && (
                <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-6 text-center" style={{ background: "#FDFAF8" }}>
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5" style={{ background: "#FEF2F2" }}>
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                  </div>
                  <h2 className="text-xl font-bold text-[#5C4F4A] mb-2">{t("scan.errorTitle")}</h2>
                  <p className="text-sm text-stone-500 mb-2 text-kr-pretty">{t("scan.errorDesc")}</p>
                  {scanError && (
                    <p className="text-xs text-stone-400 bg-stone-100 rounded-xl px-4 py-2 mb-6 max-w-xs break-all">{scanError}</p>
                  )}
                  <button
                    onClick={() => { setScanError(null); setScanState("idle"); }}
                    className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-white"
                    style={{ background: "#4A7C6E" }}
                  >
                    {t("scan.errorRetry")}
                  </button>
                </div>
              )}
              {scanState === "result" && (
                <ResultScreen
                  surveyData={surveyData}
                  analysisResult={analysisResult}
                  imageSrc={imageSrc}
                  faceCroppedSrc={faceCroppedSrc}
                  imageBase64={imageBase64}
                  onBack={() => setScanState("idle")}
                  onGoRoutine={() => handleTabChange("routine")}
                  onGoRecommend={() => handleTabChange("recommend")}
                  onGoMagazine={() => handleTabChange("scan")}
                  onOpenDiary={() => handleTabChange("diary")}
                  onGoMy={() => handleTabChange("my")}
                  user={user}
                  deferredPrompt={deferredPrompt}
                  onShowInstallGuide={() => setShowInstallGuide(true)}
                />
              )}
            </motion.div>
          )}
          {activeTab === "diary" && (
            <motion.div key="diary" custom={tabDirection} initial={{ opacity: 0, x: tabDirection * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tabDirection * -24 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<div className="min-h-[calc(100dvh-64px)]" />}>
                <DiaryTab user={user} analysisResult={analysisResult} onBack={() => handleTabChange("scan")} onLogin={openLoginPopup} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === "recommend" && (
            <motion.div key="recommend" custom={tabDirection} initial={{ opacity: 0, x: tabDirection * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tabDirection * -24 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<div className="min-h-[calc(100dvh-64px)]" />}>
                <RecommendTab user={user} baumannType={analysisResult ? undefined : undefined} onLogin={openLoginPopup} />
              </Suspense>
            </motion.div>
          )}
          {activeTab === "routine" && (
            <motion.div key="routine" custom={tabDirection} initial={{ opacity: 0, x: tabDirection * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tabDirection * -24 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<div className="min-h-[calc(100dvh-64px)]" />}>
                <RoutineTab user={user} onLogin={openLoginPopup} />
              </Suspense>
            </motion.div>
          )}
          {/* Ultra-MVP: 매거진 탭 숨김 — 리텐션 검증 후 복원 */}
          {activeTab === "my" && (
            <motion.div key="my" custom={tabDirection} initial={{ opacity: 0, x: tabDirection * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: tabDirection * -24 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <Suspense fallback={<div className="min-h-[calc(100dvh-64px)]" />}>
                <MyScreen user={user} analysisResult={analysisResult} onInstall={handleInstall} onBack={() => handleTabChange("scan")} onGoMagazine={() => handleTabChange("scan")} onGoRoutine={() => handleTabChange("routine")} onOpenDiary={() => handleTabChange("diary")} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 앱 추가 안내 모달 (iOS) — 토스 미니앱에서는 표시 안 함 */}
        <AnimatePresence>
          {showInstallGuide && !isTossMiniApp() && (
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
                <h3 className="text-center text-lg font-black mb-2" style={{ color: "#4A7C6E" }}>{t("install.title")}</h3>
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
      <BottomNav active={activeTab} onChange={handleTabChange} scanState={scanState} />
    </div>
  );
}
