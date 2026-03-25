import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles, Heart, Lock, Activity,
  ClipboardList, Camera, ChevronDown, Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BAUMANN_COLORS, DEEP_GREEN, SCAN_FROM, SCAN_TO, TEXT_SECONDARY, TEXT_TERTIARY,
  TINT_GREEN, TINT_WARM, SCORE_COLORS, stagger, fadeChild,
  BG_BASE, BG_MUTED, BORDER_COLOR, FONT_DISPLAY,
} from "./constants";
import type { WeatherData, WeatherTipKey } from "./types";
import { getStreak, getDaysSinceLastScan, getWeatherTipKey, buildCosmeticCorrelationSignals, todayStr, haptic } from "./utils";
// AttendanceCalendarModal은 MY탭에서만 사용
import { WeatherTipCard, MiniScoreBarIdle } from "./WeatherTipCard";
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
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const streak = getStreak();
  const daysSince = getDaysSinceLastScan();
  const [showBaumannExp, setShowBaumannExp] = useState(false);
  const [socialCount, setSocialCount] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [idleWeather, setIdleWeather] = useState<WeatherData | null>(null);
  const [latestScan, setLatestScan] = useState<any | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [careBriefing, setCareBriefing] = useState<{ briefing: string; priority: string } | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    fetch("/api/scans")
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
      fetch(`/api/weather?lat=${lat}&lon=${lon}`, { signal })
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
    
    fetch(`/api/care-briefing?temp=${temp}&humidity=${humidity}&aqi=${aqi}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data && data.briefing) setCareBriefing(data); })
      .catch(() => {});
  }, [idleWeather]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && window.scrollY === 0) setPullY(Math.min(dy, 80));
  };
  const handleTouchEnd = () => {
    if (pullY >= 70) { haptic("medium"); window.location.reload(); }
    setPullY(0);
  };

  useEffect(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const target = Math.floor(2000 + Math.abs(Math.sin(seed) * 1500));
    let current = 0;
    const stepMs = 16;
    const increment = target / (1500 / stepMs);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setSocialCount(target); clearInterval(timer); }
      else setSocialCount(Math.floor(current));
    }, stepMs);
    return () => clearInterval(timer);
  }, []);

  const PREVIEW_SCORES = [
    { idx: 0, score: 82, color: SCORE_COLORS[0] },
    { idx: 1, score: 68, color: SCORE_COLORS[1] },
    { idx: 2, score: 74, color: SCORE_COLORS[2] },
    { idx: 3, score: 91, color: SCORE_COLORS[3] },
  ];

  const STEPS = [
    { Icon: ClipboardList, title: t("idle.step1"), sub: t("idle.step1Sub"), active: true },
    { Icon: Camera, title: t("idle.step2"), sub: t("idle.step2Sub"), active: false },
    { Icon: Activity, title: t("idle.step3"), sub: t("idle.step3Sub"), active: false },
  ];
  const previousScan = recentScans[1] ?? null;
  const latestScoreDelta = latestScan && previousScan
    ? Number(latestScan.overallScore || 0) - Number(previousScan.overallScore || 0)
    : null;
  const latestWeakMetric = useMemo(() => {
    if (!Array.isArray(latestScan?.scores) || latestScan.scores.length <= 1) return null;
    return [...latestScan.scores].slice(1).sort((a: any, b: any) => Number(a.score) - Number(b.score))[0];
  }, [latestScan?.scores]);

  return (
    <>
    <motion.div
      className="flex flex-col px-3 pb-8 relative overflow-hidden"
      style={{ minHeight: "calc(100dvh - 60px)", background: BG_BASE, paddingTop: 20 }}
      variants={stagger} initial="initial" animate="animate"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 헤더 row */}
      <div className="flex justify-between items-center mb-5 relative" style={{ zIndex: 1 }}>
        <span className="text-lg font-bold tracking-tight" style={{ color: "#1C1917", fontFamily: FONT_DISPLAY }}>Fonday AI</span>
        <LangSwitcher />
      </div>

      {pullY > 10 && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ height: pullY, opacity: pullY / 70 }}>
          <div className={`w-7 h-7 rounded-full border-2 border-t-transparent flex items-center justify-center ${pullY >= 70 ? "border-[#C97062]" : "border-stone-300"}`}
            style={{ animation: pullY >= 70 ? "spin 0.6s linear infinite" : "none" }} />
        </div>
      )}
      {/* 날씨 기반 그리팅 + 날씨 팁 통합 카드 */}
      {(() => {
        const hour = new Date().getHours();
        const weatherEmojiMap: Record<WeatherTipKey, string> = {
          polluted: "😷", snowy: "❄️", rainy: "🌧️", foggy: "🌫️",
          cold: "🧣", sunny_hot: "🌞", sunny: "☀️", dry: "🌵", humid: "💦", cloudy: "☁️",
        };
        const weatherKeyMap: Record<WeatherTipKey, string> = {
          polluted: "idle.greetingWeatherPolluted",
          snowy:    "idle.greetingWeatherSnowy",
          rainy:    "idle.greetingWeatherRainy",
          foggy:    "idle.greetingWeatherFoggy",
          cold:     "idle.greetingWeatherCold",
          sunny_hot:"idle.greetingWeatherSunnyHot",
          sunny:    "idle.greetingWeatherSunny",
          dry:      "idle.greetingWeatherDry",
          humid:    "idle.greetingWeatherHumid",
          cloudy:   "idle.greetingWeatherCloudy",
        };
        const timeBased = [
          { range: [0, 6],   emoji: "🌙", key: "idle.greetingNight" },
          { range: [6, 10],  emoji: "☀️", key: "idle.greetingMorning" },
          { range: [10, 14], emoji: "🌤️", key: "idle.greetingNoon" },
          { range: [14, 20], emoji: "💧", key: "idle.greetingAfternoon" },
          { range: [20, 25], emoji: "🌙", key: "idle.greetingNight" },
        ];
        const fallback = timeBased.find(({ range }) => hour >= range[0] && hour < range[1]);
        if (!fallback) return null;

        // 낮 시간대(6~20)에 날씨 데이터가 있으면 날씨 기반 그리팅 사용
        const useWeatherGreeting = idleWeather && hour >= 6 && hour < 20;
        const wKey = useWeatherGreeting ? getWeatherTipKey(idleWeather!) : null;
        const emoji = wKey ? weatherEmojiMap[wKey] : fallback.emoji;
        const greetingKey = wKey ? weatherKeyMap[wKey] : fallback.key;

        return (
          <motion.div variants={fadeChild} className="mb-3 relative" style={{ zIndex: 1 }}>
            <div className="rounded-2xl overflow-hidden border"
              style={{ background: "rgba(255,255,255,0.9)", borderColor: BORDER_COLOR }}>
              {/* 인사 + 날씨 헤더 */}
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <span className="text-base">{emoji}</span>
                <p className="text-[12px] font-semibold text-stone-600">{t(greetingKey)}</p>
              </div>
              <WeatherTipCard compact weather={idleWeather} />

              {/* Ultra-MVP: AI 케어 브리핑 숨김 — 리텐션 검증 후 복원 */}
              <AnimatePresence>
                {false && careBriefing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-2.5 px-3.5 py-2.5 border-t"
                      style={{
                        background: careBriefing.priority === "high" ? "#FFF8F8" : "#F4FBF7",
                        borderColor: careBriefing.priority === "high" ? "#FECACA" : "#D1FAE5",
                      }}
                    >
                      <Bot className={`w-4 h-4 mt-0.5 shrink-0 ${careBriefing.priority === "high" ? "text-rose-500" : "text-emerald-600"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] font-black uppercase tracking-widest text-stone-400">AI Care</p>
                          {careBriefing.priority === "high" && (
                            <span className="text-[11px] font-bold text-rose-500 animate-pulse">!</span>
                          )}
                        </div>
                        <p className="text-[12px] font-semibold text-stone-700 leading-snug break-keep">
                          {careBriefing.briefing}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })()}

      {/* 상단 스캔 CTA 제거 — 하단 CTA로 통일 (B안 레이아웃) */}

      {/* 컴백 배너 (3일+ 경과 시) */}
      {daysSince !== null && daysSince >= 3 && (
        <motion.div variants={fadeChild} className="mb-3 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
            style={daysSince >= 7
              ? { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }
              : { background: "#F0FAF6", color: "#166534", border: "1px solid #BBF7D0" }}>
            {daysSince >= 7
              ? t("streak.comeback7", { days: daysSince })
              : t("streak.comeback3", { days: daysSince })}
          </div>
        </motion.div>
      )}

      {/* ── 히어로: 얼굴 이미지 + 헤드라인 + CTA (신규 유저, 포스터 스타일) ── */}
      {!latestScan && !scanLoading && (
        <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
          {/* 히어로 이미지 — 시각적 앵커 */}
          <div className="relative rounded-3xl overflow-hidden mb-6 bg-stone-100" style={{ aspectRatio: "4/3" }}>
            <img
              src="/face-model.png"
              alt="skin analysis preview"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            <motion.div className="absolute left-0 right-0 h-[2px] z-10"
              style={{ background: `linear-gradient(90deg, transparent 0%, ${SCAN_TO}CC 40%, ${SCAN_FROM} 50%, ${SCAN_TO}CC 60%, transparent 100%)` }}
              animate={reducedMotion ? { top: "50%" } : { top: ["10%", "85%", "10%"] }}
              transition={reducedMotion ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute inset-x-0 bottom-0 h-32"
              style={{ background: "linear-gradient(to top, rgba(20,20,20,0.6), transparent)" }} />
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: `${SCAN_TO}AA` }} />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: `${SCAN_TO}AA` }} />
            <div className="absolute bottom-5 left-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{t("idle.heroMbtiLabel")}</p>
              <p className="text-[28px] font-bold leading-none mt-0.5" style={{ fontFamily: FONT_DISPLAY }}>OSNT</p>
            </div>
            <div className="absolute bottom-5 right-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Heart className="w-3 h-3 text-white/80" />
                <span className="text-[11px] font-bold text-white/90">{socialCount.toLocaleString()}+</span>
              </div>
            </div>
          </div>

          {/* 헤드라인 + 설명 */}
          <h1 className="text-[30px] font-light leading-[1.15] mb-3" style={{ color: "#1C1917", fontFamily: FONT_DISPLAY }}>
            {t("idle.subtitle1")}<br />{t("idle.subtitle3")}
          </h1>
          <p className="text-[14px] leading-[1.7] mb-6" style={{ color: TEXT_SECONDARY }}>
            {t("idle.subtitle4")}
          </p>

          {/* CTA */}
          <motion.button
            onClick={() => { haptic("medium"); onScan(); }}
            className="w-full py-4 rounded-2xl text-white text-[15px] font-semibold tracking-tight"
            style={{ background: DEEP_GREEN }}
            whileHover={{ scale: reducedMotion ? 1 : 1.01 }}
            whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
          >
            {t("idle.ctaBtn")}
          </motion.button>
          <p className="text-center text-xs mt-3" style={{ color: TEXT_TERTIARY }}>
            {t("idle.ctaHint")}
          </p>
        </motion.div>
      )}

      <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
        {scanLoading && (
          <div className={`rounded-2xl bg-white px-4 py-4 mb-4 border${reducedMotion ? "" : " animate-pulse"}`} style={{ borderColor: BORDER_COLOR }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="h-3 w-20 rounded-full bg-stone-100 mb-2" />
                <div className="h-4 w-36 rounded-full bg-stone-100 mb-1.5" />
                <div className="h-3 w-48 rounded-full bg-stone-100" />
              </div>
              <div className="rounded-2xl px-3 py-2 shrink-0 w-16 h-14 bg-stone-100" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl p-3 bg-stone-50">
                  <div className="h-2.5 w-10 rounded-full bg-stone-100 mb-2" />
                  <div className="h-4 w-8 rounded-full bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        )}
        {!scanLoading && latestScan && (
          <div className="mb-4">
            {/* One Big Number — 시각적 앵커 */}
            <div className="text-center py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: TEXT_TERTIARY }}>
                {t("result.overall")}
              </p>
              <p className="text-[56px] font-light leading-none" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>
                {latestScan.overallScore ?? "—"}
              </p>
              {latestScoreDelta !== null && (
                <span className="inline-block mt-2 text-[13px] font-semibold" style={{ color: latestScoreDelta >= 0 ? "#2D7D46" : "#C2410C" }}>
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
              {latestWeakMetric?.label && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ background: BORDER_COLOR }} />
                  <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
                    {latestWeakMetric.label}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── 홈 루틴 체크 위젯 (로그인 유저, 화장품 등록 시) ── */}
        {latestScan && (() => {
          // 간단한 inline 체크리스트 — 등록된 화장품 fetch는 부모에서 불필요, 별도 fetch
          return <HomeRoutineWidget onOpenRoutine={onOpenRoutine} />;
        })()}

        {/* 출석 캘린더는 MY탭으로 이동 — 홈 흐름 정리 */}
      </motion.div>

      {/* 바우만 설명 더보기 accordion */}
      <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
        <div className="rounded-2xl" style={{ background: BG_MUTED }}>
          <button onClick={() => setShowBaumannExp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: TEXT_SECONDARY }} />
              <p className="text-[14px] font-semibold text-stone-700">{t("idle.baumannSectionTitle")}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {!showBaumannExp && <span className="text-xs font-bold text-stone-400">O/D · S/R · P/N · W/T</span>}
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${showBaumannExp ? "rotate-180" : ""}`} />
            </div>
          </button>
          <AnimatePresence>
            {showBaumannExp && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                className="overflow-hidden px-4 pb-4">
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">{t("idle.baumannSectionDesc")}</p>
                <div className="space-y-1.5 mb-3">
                  {(t("idle.baumannAxes", { returnObjects: true }) as any[]).map((ax: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <p className="text-xs font-semibold text-stone-600 w-16 shrink-0">{ax.label}</p>
                      <p className="text-xs text-stone-400">{ax.desc}</p>
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

      {/* ── 신규 유저: 단계 표시 (독립 섹션, 카드 없이 여유롭게) ── */}
      {!latestScan && (
        <>
          <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
            <p className="text-xs font-semibold text-stone-400 text-center mb-4 tracking-widest uppercase">
              {t("idle.stepsTitle")}
            </p>
            <div className="flex items-start justify-between">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start" style={{ flex: 1 }}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={step.active ? { background: TINT_WARM } : { background: "#F4F4F5" }}>
                      <step.Icon className="w-5 h-5" style={{ color: step.active ? SCAN_TO : "#A9998E" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-stone-700">{step.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5 leading-tight">{step.sub}</p>
                    </div>
                  </div>
                  {i < 2 && <div className="text-stone-200 text-sm pt-3 flex-shrink-0">›</div>}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeChild} className="mb-8 relative" style={{ zIndex: 1 }}>
            <div className="flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TEXT_TERTIARY }} />
              <span className="text-xs font-medium" style={{ color: TEXT_TERTIARY }}>{t("idle.privacy")}</span>
            </div>
          </motion.div>
        </>
      )}

      {/* ── 리턴 유저: 간결한 재스캔 버튼 ── */}
      {latestScan && (
        <motion.div variants={fadeChild} className="relative" style={{ zIndex: 1 }}>
          <button
            onClick={() => { haptic("medium"); onScan(); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold active:opacity-80 transition-opacity"
            style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN }}
          >
            <Camera className="w-4 h-4" />
            {t("idle.rescan", "오늘의 피부 스캔하기")}
          </button>
        </motion.div>
      )}

      <div className="text-center pt-4 pb-4 relative" style={{ zIndex: 1 }}>
        <a href="/privacy.html" className="text-xs underline inline-flex items-center min-h-[44px] px-2" style={{ color: TEXT_SECONDARY }}>
          {t("idle.privacyLink")}
        </a>
        <span className="text-xs text-stone-200 mx-1">·</span>
        <a href="/terms.html" className="text-xs underline inline-flex items-center min-h-[44px] px-2" style={{ color: TEXT_SECONDARY }}>
          {t("idle.termsLink")}
        </a>
      </div>
    </motion.div>
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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/cosmetics").then(r => r.ok ? r.json() : []),
      fetch(`/api/routine-log?date=${todayStr()}`).then(r => r.ok ? r.json() : { cosmetic_ids: [] }),
      fetch("/api/scans").then(r => r.ok ? r.json() : []),
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

  const handleToggle = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter(x => x !== id)
      : [...checkedIds, id];
    setCheckedIds(next);
    fetch("/api/routine-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_str: todayStr(), cosmetic_ids: next }),
    }).catch(() => {});
  };

  return (
    <div className="rounded-2xl bg-white px-4 py-3.5 mb-3 border" style={{ borderColor: BORDER_COLOR }}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>
          {t("routineChecklist.title", "오늘 사용한 화장품")}
        </p>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
          {checkedCount}/{total}
        </span>
      </div>
      <div className="space-y-1">
        {(showAll ? cosmetics : cosmetics.slice(0, 5)).map((item: any) => {
          const checked = checkedIds.includes(item.id);
          return (
            <button key={item.id} onClick={() => { haptic("light"); handleToggle(item.id); }}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors"
              style={{ background: checked ? `${DEEP_GREEN}08` : "transparent" }}>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{ background: checked ? DEEP_GREEN : "transparent", borderColor: checked ? DEEP_GREEN : "#D1CBC3" }}>
                {checked && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <span className="text-[13px] font-medium truncate" style={{ color: checked ? DEEP_GREEN : "#374151" }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      {cosmetics.length > 5 && !showAll && (
        <button onClick={() => setShowAll(true)} className="mt-2 text-xs font-semibold" style={{ color: DEEP_GREEN }}>
          +{cosmetics.length - 5}{t("routineChecklist.more", "개 더보기")}
        </button>
      )}
      {showAll && cosmetics.length > 5 && (
        <button onClick={() => setShowAll(false)} className="mt-2 text-xs font-semibold" style={{ color: TEXT_TERTIARY }}>
          {t("routineChecklist.collapse", "접기")}
        </button>
      )}

      {/* ── 효과 보드 (가장 효과 좋은 제품) ── */}
      {topSignal && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
            {t("idle.effectBoard", "효과 추적")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-stone-800 truncate">{topSignal.itemName}</p>
              <p className="text-[11px] mt-0.5 leading-snug text-kr-pretty" style={{ color: TEXT_TERTIARY }}>{topSignal.note}</p>
            </div>
            {topSignal.topScoreDelta != null && (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                style={{ background: topSignal.topScoreDelta >= 0 ? "#E8F5EC" : "#FFF7ED", color: topSignal.topScoreDelta >= 0 ? "#2D7D46" : "#C2410C" }}>
                {topSignal.topScoreDelta >= 0 ? "+" : ""}{topSignal.topScoreDelta}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
