import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles, Lock, Activity,
  ClipboardList, Camera, ChevronDown,
  Sun, Cloud, CloudRain, Snowflake, Droplets, Wind, CloudSnow, CloudFog, SunDim, Moon, CloudSun,
} from "lucide-react";
import {
  BAUMANN_COLORS,
  DEEP_GREEN,
  SCAN_TO,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  SCORE_COLORS,
  stagger,
  fadeChild,
  BG_MUTED,
  BORDER_COLOR,
  FONT_DISPLAY,
  FONT_HEADING,
  SHADOW_CARD,
  SHADOW_ELEVATED,
  RADIUS_CARD,
  RADIUS_ITEM,
  PAGE_GRADIENT,
  BG_BASE,
  TEXT_HEADING,
  TEXT_TITLE,
  TEXT_LABEL,
  COLOR_WARNING,
  COLOR_DANGER,
  COLOR_INFO,
  COLOR_SUCCESS,
} from "./constants";
import type { WeatherData, WeatherTipKey } from "./types";
import { getStreak, getDaysSinceLastScan, getWeatherTipKey, buildCosmeticCorrelationSignals, todayStr, haptic, isTossMiniApp, apiBase, appFetch } from "./utils";
// AttendanceCalendarModal은 MY탭에서만 사용
import { WeatherTipCard } from "./WeatherTipCard";
import { TossBannerAd, getRemainingScans, useScanCredit, addScanCredit, useRewardedAd } from "./TossAd";
import { LangSwitcher } from "./BottomNav";

// ─── 메인 스캔 화면 ───────────────────────────────────────────────
export function ScanIdleScreen({
  onScan,
  onOpenRoutine,
  onOpenDiary,
  onOpenDiscover,
  onOpenMy,
}: {
  onScan: () => void;
  onOpenRoutine?: () => void;
  onOpenDiary?: () => void;
  onOpenDiscover?: () => void;
  onOpenMy?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const isToss = isTossMiniApp();
  const streak = getStreak();
  const daysSince = getDaysSinceLastScan();
  const [showBaumannExp, setShowBaumannExp] = useState(false);
  const [showAdPrompt, setShowAdPrompt] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemainingScans());
  const rewardedAd = useRewardedAd();

  // Preload rewarded ad for Toss
  useEffect(() => { if (isToss) rewardedAd.load(); }, [isToss]);

  const handleScanWithQuota = () => {
    if (!isToss) { onScan(); return; }
    if (useScanCredit()) {
      setRemaining(getRemainingScans());
      onScan();
    } else {
      setShowAdPrompt(true);
    }
  };

  const handleWatchAd = () => {
    setShowAdPrompt(false);
    rewardedAd.show();
  };

  // Rewarded ad callback — add credit when user earns reward
  useEffect(() => {
    if (rewardedAd.rewarded) {
      addScanCredit();
      setRemaining(getRemainingScans());
      onScan();
    }
  }, [rewardedAd.rewarded]);
  const [pullY, setPullY] = useState(0);
  const [idleWeather, setIdleWeather] = useState<WeatherData | null>(null);
  const [latestScan, setLatestScan] = useState<any | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [careBriefing, setCareBriefing] = useState<{ briefing: string; priority: string } | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    appFetch(`${apiBase()}/api/scans`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentScans(data);
          if (data.length > 0) setLatestScan(data[0]);
        }
      })
      .catch(() => setLatestScan(null))
      .finally(() => setScanLoading(false));
  }, []);

  // 운영 서버 날씨 로직 + Fallback 복구 (Care Briefing 필수)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const SEOUL = { lat: 37.5665, lon: 126.9780 };

    const fetchWeather = (lat: number, lon: number, isRetry = false) => {
      appFetch(`${apiBase()}/api/weather?lat=${lat}&lon=${lon}`, { signal })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (signal.aborted) return;
          if (data && !data.error) {
            setIdleWeather(data as WeatherData);
          } else if (!isRetry) {
            fetchWeather(SEOUL.lat, SEOUL.lon, true);
          }
        })
        .catch(() => {
          if (!signal.aborted && !isRetry) {
            fetchWeather(SEOUL.lat, SEOUL.lon, true);
          }
        });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(SEOUL.lat, SEOUL.lon),
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      fetchWeather(SEOUL.lat, SEOUL.lon);
    }

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 케어 브리핑 로드 (날씨 데이터 준비 시)
  useEffect(() => {
    if (!idleWeather || typeof idleWeather.temp === 'undefined' || idleWeather.temp === null) return;
    const temp = idleWeather.temp;
    const humidity = idleWeather.humidity ?? "";
    const aqi = idleWeather.aqi ?? "";
    const pm25 = idleWeather.pm25 ?? "";
    const uv = idleWeather.uvIndex ?? "";
    const lang = i18n.language || "ko";

    appFetch(`${apiBase()}/api/care-briefing?temp=${temp}&humidity=${humidity}&aqi=${aqi}&pm25=${pm25}&uv=${uv}&lang=${lang}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.briefing) setCareBriefing(data); })
      .catch(() => {});
  }, [idleWeather]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    // 스크롤이 맨 위이고 아래로 당길 때만 pull-to-refresh (스크롤 중 간섭 방지)
    if (dy > 20 && window.scrollY <= 0) setPullY(Math.min(dy - 20, 80));
  };
  const handleTouchEnd = () => {
    if (pullY >= 70) { haptic("medium"); window.location.reload(); }
    setPullY(0);
  };



  const PREVIEW_SCORES = [
    { idx: 0, score: 82, color: SCORE_COLORS[0] },
    { idx: 1, score: 68, color: SCORE_COLORS[1] },
    { idx: 2, score: 74, color: SCORE_COLORS[2] },
    { idx: 3, score: 91, color: SCORE_COLORS[3] },
  ];

  const STEPS = [
    { Icon: ClipboardList, title: t("idle.step1"), sub: t("idle.step1Sub"), active: true },
    { Icon: Camera, title: t("idle.step2"), sub: t("idle.step2Sub"), active: false },
    { Icon: Sparkles, title: t("idle.step3"), sub: t("idle.step3Sub"), active: false },
  ];
  const previousScan = recentScans[1] ?? null;
  const latestScoreDelta = latestScan && previousScan
    ? Number(latestScan.overallScore || 0) - Number(previousScan.overallScore || 0)
    : null;
  // 접속/새로고침마다 다른 문구 (컴포넌트 마운트 시 랜덤)
  const [greetingVariantIdx] = useState(() => Math.floor(Math.random() * 100));

  const latestWeakMetric = useMemo(() => {
    if (!Array.isArray(latestScan?.scores) || latestScan.scores.length <= 1) return null;
    return [...latestScan.scores].slice(1).sort((a: any, b: any) => Number(a.score) - Number(b.score))[0];
  }, [latestScan?.scores]);

  return (
    <>
    <motion.div
      className="flex flex-col px-4 pt-5 relative overflow-hidden"
      style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom))", minHeight: "calc(100dvh - 60px)", background: PAGE_GRADIENT }}
      variants={stagger} initial="initial" animate="animate"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 헤더 row */}
      <div className="flex justify-between items-center mb-4 relative" style={{ zIndex: 1 }}>
        <img src="/fonday-logo.svg" alt="Fonday" className="h-8" style={{ objectFit: "contain" }} />
        <LangSwitcher />
      </div>

      {pullY > 10 && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ height: pullY, opacity: pullY / 70 }}>
          <div className={`w-7 h-7 rounded-full border-2 border-t-transparent flex items-center justify-center ${pullY >= 70 ? "border-[#C97062]" : "border-stone-300"}`}
            style={{ animation: pullY >= 70 ? "spin 0.6s linear infinite" : "none" }} />
        </div>
      )}
      {/* 날씨 기반 그리팅 — 날씨 로딩 후에만 표시 (깜빡임 방지) */}
      {(() => {
        if (!idleWeather) return null; // 날씨 로딩 전에는 숨김
        const hour = new Date().getHours();
        const weatherIconMap: Record<WeatherTipKey, { icon: React.ComponentType<any>; color: string }> = {
          polluted: { icon: Wind, color: TEXT_SECONDARY },
          snowy:    { icon: CloudSnow, color: "#6B9BD2" },
          rainy:    { icon: CloudRain, color: "#6B9BD2" },
          foggy:    { icon: CloudFog, color: TEXT_SECONDARY },
          cold:     { icon: Snowflake, color: "#6B9BD2" },
          sunny_hot:{ icon: SunDim, color: COLOR_WARNING },
          sunny:    { icon: Sun, color: COLOR_WARNING },
          dry:      { icon: Sun, color: COLOR_WARNING },
          humid:    { icon: Droplets, color: "#2B7FBF" },
          cloudy:   { icon: Cloud, color: TEXT_SECONDARY },
        };
        const weatherVariantMap: Record<WeatherTipKey, string[]> = {
          polluted: ["idle.greetingWeatherPolluted", "idle.greetingWeatherPolluted2", "idle.greetingWeatherPolluted3"],
          snowy:    ["idle.greetingWeatherSnowy", "idle.greetingWeatherSnowy2", "idle.greetingWeatherSnowy3"],
          rainy:    ["idle.greetingWeatherRainy", "idle.greetingWeatherRainy2", "idle.greetingWeatherRainy3"],
          foggy:    ["idle.greetingWeatherFoggy", "idle.greetingWeatherFoggy2", "idle.greetingWeatherFoggy3"],
          cold:     ["idle.greetingWeatherCold", "idle.greetingWeatherCold2", "idle.greetingWeatherCold3"],
          sunny_hot:["idle.greetingWeatherSunnyHot", "idle.greetingWeatherSunnyHot2", "idle.greetingWeatherSunnyHot3"],
          sunny:    ["idle.greetingWeatherSunny", "idle.greetingWeatherSunny2", "idle.greetingWeatherSunny3"],
          dry:      ["idle.greetingWeatherDry", "idle.greetingWeatherDry2", "idle.greetingWeatherDry3"],
          humid:    ["idle.greetingWeatherHumid", "idle.greetingWeatherHumid2", "idle.greetingWeatherHumid3"],
          cloudy:   ["idle.greetingWeatherCloudy", "idle.greetingWeatherCloudy2", "idle.greetingWeatherCloudy3"],
        };
        const timeBasedVariants = [
          { range: [0, 6],   icon: Moon as React.ComponentType<any>, color: COLOR_INFO, keys: ["idle.greetingNight", "idle.greetingNight2", "idle.greetingNight3"] },
          { range: [6, 10],  icon: Sun as React.ComponentType<any>, color: COLOR_WARNING, keys: ["idle.greetingMorning", "idle.greetingMorning2", "idle.greetingMorning3"] },
          { range: [10, 14], icon: CloudSun as React.ComponentType<any>, color: COLOR_WARNING, keys: ["idle.greetingNoon", "idle.greetingNoon2", "idle.greetingNoon3"] },
          { range: [14, 20], icon: Droplets as React.ComponentType<any>, color: "#2B7FBF", keys: ["idle.greetingAfternoon", "idle.greetingAfternoon2", "idle.greetingAfternoon3"] },
          { range: [20, 25], icon: Moon as React.ComponentType<any>, color: COLOR_INFO, keys: ["idle.greetingNight", "idle.greetingNight2", "idle.greetingNight3"] },
        ];
        const fallback = timeBasedVariants.find(({ range }) => hour >= range[0] && hour < range[1]);
        if (!fallback) return null;

        // 날씨 아이콘 + 날씨 문구 사용 (낮 시간대), 밤에는 시간대 기반
        const wKey = (hour >= 6 && hour < 20) ? getWeatherTipKey(idleWeather!) : null;
        const iconInfo = wKey ? weatherIconMap[wKey] : { icon: fallback.icon, color: fallback.color };
        const GreetingIcon = iconInfo.icon;
        const variants = wKey ? weatherVariantMap[wKey] : fallback.keys;
        const greetingKey = variants[greetingVariantIdx % variants.length];

        return (
          <motion.div variants={fadeChild} className="mb-2 relative" style={{ zIndex: 1 }}>
            <p className="text-[13px] leading-relaxed flex items-center gap-1.5" style={{ color: TEXT_SECONDARY }}>
              <GreetingIcon className="w-4 h-4 inline-block shrink-0" style={{ color: iconInfo.color }} />
              {t(greetingKey)}
            </p>
          </motion.div>
        );
      })()}

      {/* 상단 스캔 CTA 제거 — 하단 CTA로 통일 (B안 레이아웃) */}

      {/* 컴백 배너 (3일+ 경과 시) */}
      {daysSince !== null && daysSince >= 3 && (
        <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-semibold"
            style={daysSince >= 7
              ? { background: "#FFF7ED", color: COLOR_DANGER }
              : { background: "#F0FAF6", color: "#166534" }}>
            {daysSince >= 7
              ? t("streak.comeback7", { days: daysSince })
              : t("streak.comeback3", { days: daysSince })}
          </div>
        </motion.div>
      )}

      {/* ── 히어로: 헤드라인 → 이미지(16:9) → 3단계 → CTA (신규 유저) ── */}
      {!latestScan && !scanLoading && (
        <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
          {/* 헤드라인 */}
          <h1 className="text-[24px] font-extrabold leading-[1.35] mt-1 mb-2 whitespace-pre-line" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>
            {isToss ? t("idle.tossTitle") : t("idle.title")}
          </h1>
          <p className="text-[14px] leading-[1.7] mb-4" style={{ color: TEXT_SECONDARY }}>
            {isToss ? t("idle.tossSubtitle") : t("idle.subtitle4")}
          </p>

          {/* 얼굴 이미지 — 16:9 가로, 스크롤 없이 CTA까지 보이도록 */}
          <div className="relative overflow-hidden mb-5 bg-stone-100"
            style={{ aspectRatio: isToss ? "16/8.6" : "16/9", borderRadius: 20, boxShadow: isToss ? SHADOW_CARD : SHADOW_ELEVATED }}>
            <img
              src="/face-model.png"
              alt="skin analysis preview"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            <motion.div className="absolute inset-x-0 h-[2px] z-10"
              style={{ background: `linear-gradient(90deg, transparent 0%, ${DEEP_GREEN}CC 40%, ${DEEP_GREEN} 50%, ${DEEP_GREEN}CC 60%, transparent 100%)`, top: 0, willChange: "transform" }}
              animate={reducedMotion || isToss ? {} : { top: ["8%", "88%", "8%"] }}
              transition={reducedMotion || isToss ? {} : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute inset-x-0 bottom-0 h-16"
              style={{ background: "linear-gradient(to top, rgba(20,20,20,0.45), transparent)" }} />
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: `${DEEP_GREEN}88` }} />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: `${DEEP_GREEN}88` }} />
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-[24px] font-normal leading-none" style={{ fontFamily: FONT_DISPLAY }}>OSNT</p>
            </div>
          </div>

          {!isToss ? (
            <div className="flex items-center justify-center gap-2 mb-4">
              {STEPS.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-1.5">
                    <step.Icon className="w-3.5 h-3.5" style={{ color: step.active ? SCAN_TO : "#A9998E" }} />
                    <span className="text-[12px] font-medium" style={{ color: TEXT_LABEL }}>{step.title}</span>
                  </div>
                  {i < 2 && <span className="text-[11px]" style={{ color: TEXT_TERTIARY }}>›</span>}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-2 rounded-2xl px-3.5 py-3" style={{ background: BG_MUTED }}>
              <ClipboardList className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
              <p className="text-[12px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                {isToss ? t("idle.tossCtaHint") : t("idle.ctaHint")}
              </p>
            </div>
          )}

          {/* CTA — pill 형태, 부드러운 Salmon */}
          <motion.button
            onClick={() => { haptic("medium"); handleScanWithQuota(); }}
            className="w-full text-white text-[15px] font-semibold flex items-center justify-center gap-2"
            style={{
              background: "#C97062",
              boxShadow: "0 2px 12px rgba(201,112,98,0.2)",
              height: 52,
              borderRadius: 26,
            }}
            whileHover={{ scale: reducedMotion ? 1 : 1.02 }}
            whileTap={{ scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 2 }}
          >
            {isToss ? t("idle.tossCtaBtn") : t("idle.ctaBtn")}
          </motion.button>
          <p className="text-center text-[12px] mt-4" style={{ color: TEXT_TERTIARY }}>
            {isToss ? t("idle.tossCtaHint") : t("idle.ctaHint")}
          </p>
          {/* 소셜 프루프 — 토스 미니앱에서는 숨김 (가짜 카운터 = 다크패턴) */}
          {!isTossMiniApp() && (
            <p className="text-center text-[11px] mt-2" style={{ color: TEXT_TERTIARY }}>
              {t("idle.socialCount", { n: (1247 + Math.floor((Date.now() - new Date("2026-01-01").getTime()) / 86400000) * 3).toLocaleString() })}
            </p>
          )}
        </motion.div>
      )}

      <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
        {scanLoading && (
          <div className={`py-4 mb-4${reducedMotion ? "" : " animate-pulse"}`}>
            <div className="h-3 w-20 rounded-full bg-stone-200/50 mb-3" />
            <div className="h-8 w-24 rounded-full bg-stone-200/50 mx-auto mb-2" />
            <div className="h-3 w-48 rounded-full bg-stone-200/50 mx-auto" />
          </div>
        )}
        {!scanLoading && latestScan && (
          <div className="mb-4">
            {/* One Big Number — 시각적 앵커 */}
            <div className="text-center py-4">
              <p className="text-[14px] font-bold uppercase tracking-[0.10em] mb-2" style={{ color: TEXT_TERTIARY }}>
                {isToss ? t("result.tossOverall") : t("result.overall")}
              </p>
              <p className="text-[56px] font-normal leading-none" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>
                {latestScan.overallScore ?? "—"}
              </p>
              {latestScoreDelta !== null && (
                <span className="inline-block mt-2 text-[13px] font-semibold" style={{ color: latestScoreDelta >= 0 ? COLOR_SUCCESS : COLOR_DANGER }}>
                  {latestScoreDelta >= 0 ? "+" : ""}{latestScoreDelta}{t("result.scoreSuffix")}
                </span>
              )}
            </div>

            {/* 핵심 요약 한 줄 */}
            <div className="flex items-center justify-center gap-3 py-3">
              <span className="text-[14px] font-semibold" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
                {latestScan.baumannType || "—"}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: BORDER_COLOR }} />
              <span className="text-[14px]" style={{ color: TEXT_SECONDARY }}>
                {t("result.skinAge")} {latestScan.skinAge ?? "—"}
              </span>
              {!isToss && latestWeakMetric?.label && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ background: BORDER_COLOR }} />
                  <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
                    {latestWeakMetric.label}
                  </span>
                </>
              )}
            </div>

            {/* 재스캔 버튼 — 점수 바로 아래 */}
            <button
              onClick={() => { haptic("medium"); handleScanWithQuota(); }}
              className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold active:opacity-80 transition-opacity mt-4"
              style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN, height: 48, borderRadius: 24 }}
            >
              <Camera className="w-4 h-4" />
              {t("idle.rescan", "오늘의 피부 스캔하기")}
            </button>
          </div>
        )}

        {/* ── 홈 루틴 체크 위젯 (로그인 유저, 화장품 등록 시) ── */}
        {latestScan && (() => {
          // 간단한 inline 체크리스트 — 등록된 화장품 fetch는 부모에서 불필요, 별도 fetch
          return <HomeRoutineWidget onOpenRoutine={onOpenRoutine} />;
        })()}

        {/* 출석 캘린더는 MY탭으로 이동 — 홈 흐름 정리 */}
      </motion.div>

      {/* 날씨 상세 — 리턴 유저에게만 (신규 유저에겐 그리팅으로 충분) */}
      {!isToss && idleWeather && latestScan && (
        <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
          <WeatherTipCard compact weather={idleWeather} weakMetric={latestWeakMetric?.label} />
        </motion.div>
      )}

      {/* 바우만 설명 더보기 accordion */}
      {!isToss && (
      <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
        <div style={{ background: BG_BASE, boxShadow: SHADOW_CARD, borderRadius: RADIUS_CARD }}>
          <button onClick={() => setShowBaumannExp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: TEXT_SECONDARY }} />
              <p className="text-[14px] font-semibold text-[#6B5D55]">{t("idle.baumannSectionTitle")}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {!showBaumannExp && <span className="text-xs font-bold" style={{ color: TEXT_TERTIARY }}>O/D · S/R · P/N · W/T</span>}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showBaumannExp ? "rotate-180" : ""} style={{ color: TEXT_TERTIARY }}`} />
            </div>
          </button>
          <AnimatePresence>
            {showBaumannExp && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                className="overflow-hidden px-4 pb-4">
                <p className="text-xs mb-3 leading-relaxed" style={{ color: TEXT_SECONDARY }}>{t("idle.baumannSectionDesc")}</p>
                <div className="space-y-1.5 mb-3">
                  {(t("idle.baumannAxes", { returnObjects: true }) as any[]).map((ax: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5" style={{ borderRadius: RADIUS_ITEM, background: BG_MUTED }}>
                      <p className="text-xs font-semibold w-16 shrink-0" style={{ color: TEXT_LABEL }}>{ax.label}</p>
                      <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{ax.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(BAUMANN_COLORS) as [string, string][]).map(([letter, color]) => (
                    <span key={letter} className="text-xs font-bold px-2.5 py-1 rounded-full border"
                      style={{ color, background: `${color}12`, borderColor: `${color}25` }}>
                      {letter} {t(`baumann.${letter}.name`)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      )}

      {/* ── 신규 유저: 프라이버시 안내 (CTA 아래) ── */}
      {!latestScan && !scanLoading && (
        <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TEXT_TERTIARY }} />
            <span className="text-xs font-medium" style={{ color: TEXT_TERTIARY }}>{t("idle.privacy")}</span>
          </div>
        </motion.div>
      )}

      {/* 재스캔 버튼은 점수 바로 아래로 이동됨 */}

      {/* 배너 광고 (토스 미니앱) */}
      {isToss && <TossBannerAd className="mb-4 rounded-2xl overflow-hidden" />}

    </motion.div>

    {/* 광고 시청 프롬프트 (토스 — 스캔 횟수 소진 시) */}
    <AnimatePresence>
      {showAdPrompt && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowAdPrompt(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            className="relative bg-white rounded-3xl p-6 mx-6 max-w-sm w-full text-center"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-lg font-bold mb-2" style={{ color: "#5C4F4A" }}>
              {t("idle.adPromptTitle", "오늘의 무료 스캔을 모두 사용했어요")}
            </p>
            <p className="text-sm mb-5" style={{ color: TEXT_SECONDARY }}>
              {t("idle.adPromptDesc", "짧은 광고를 보면 1회 추가 스캔할 수 있어요")}
            </p>
            <button
              onClick={handleWatchAd}
              disabled={!rewardedAd.loaded}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-[14px] disabled:opacity-50"
              style={{ background: "#C97062" }}
            >
              {rewardedAd.loaded
                ? t("idle.adPromptBtn", "광고 보고 스캔하기")
                : t("idle.adPromptLoading", "광고 준비 중...")}
            </button>
            <button
              onClick={() => setShowAdPrompt(false)}
              className="mt-3 text-sm font-medium"
              style={{ color: TEXT_TERTIARY }}
            >
              {t("common.close", "닫기")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

// ─── 홈 루틴 체크 위젯 + 효과 보드 ──────────────────────────────
function HomeRoutineWidget({ onOpenRoutine }: { onOpenRoutine?: () => void }) {
  const { t } = useTranslation();
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [topSignal, setTopSignal] = useState<any | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      appFetch(`${apiBase()}/api/cosmetics`).then(r => r.ok ? r.json() : []),
      appFetch(`${apiBase()}/api/routine-log?date=${todayStr()}`).then(r => r.ok ? r.json() : { cosmetic_ids: [] }),
      appFetch(`${apiBase()}/api/scans`).then(r => r.ok ? r.json() : []),
    ])
      .then(([items, log, scans]) => {
        const cosmeticItems = Array.isArray(items) ? items : [];
        setCosmetics(cosmeticItems);
        setCheckedIds(Array.isArray(log.cosmetic_ids) ? log.cosmetic_ids : []);
        // 효과 보드: 가장 강한 시그널 찾기
        if (cosmeticItems.length > 0 && Array.isArray(scans) && scans.length >= 2) {
          const signals = buildCosmeticCorrelationSignals(cosmeticItems, scans, t);
          if (signals.length > 0 && signals[0].confidence !== "early") {
            setTopSignal(signals[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || cosmetics.length === 0) return null;

  const checkedCount = checkedIds.filter(id => cosmetics.some((c: any) => c.id === id)).length;
  const total = cosmetics.length;


  return (
    <div className="mb-8">
      {/* 루틴 요약 한 줄 — 탭하면 루틴 탭으로 */}
      <button
        onClick={onOpenRoutine}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderRadius: RADIUS_CARD, background: BG_BASE, boxShadow: SHADOW_CARD }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${DEEP_GREEN}12` }}>
            <span className="text-[13px] font-bold" style={{ color: DEEP_GREEN }}>✓</span>
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold" style={{ color: TEXT_TITLE }}>
              {t("routineChecklist.title", "오늘 사용한 화장품")}
            </p>
            <p className="text-[12px]" style={{ color: TEXT_TERTIARY }}>
              {checkedCount}/{total} {t("routineChecklist.completed", "완료")}
            </p>
          </div>
        </div>
        <span className="text-[12px] font-semibold" style={{ color: DEEP_GREEN }}>
          {t("routineChecklist.goCheck", "체크하기 ›")}
        </span>
      </button>

      {/* 효과 보드 (가장 효과 좋은 제품) */}
      {topSignal && (
        <div className="flex items-center gap-3 mt-2 px-4 py-3"
          style={{ borderRadius: RADIUS_CARD, background: BG_BASE, boxShadow: SHADOW_CARD }}>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: SCAN_TO }}>
              {t("idle.effectBoard", "효과 추적")}
            </p>
            <p className="text-[13px] font-bold text-[#5C4F4A] truncate">{topSignal.itemName}</p>
            <p className="text-[11px] mt-0.5 leading-snug text-kr-pretty" style={{ color: TEXT_TERTIARY }}>{topSignal.note}</p>
          </div>
          {topSignal.topScoreDelta != null && (
            <span className="rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
              style={{ background: topSignal.topScoreDelta >= 0 ? "#E8F5EC" : "#FFF7ED", color: topSignal.topScoreDelta >= 0 ? COLOR_SUCCESS : COLOR_DANGER }}>
              {topSignal.topScoreDelta >= 0 ? "+" : ""}{topSignal.topScoreDelta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
