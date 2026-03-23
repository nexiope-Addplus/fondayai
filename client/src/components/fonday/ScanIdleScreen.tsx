import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles, Heart, Lock, CalendarDays, Activity,
  ClipboardList, Camera, ChevronDown, ChevronRight, Flame, Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BAUMANN_COLORS, DEEP_GREEN, SCAN_FROM, SCAN_TO, TEXT_SECONDARY,
  TINT_GREEN, TINT_WARM, SCORE_COLORS, stagger, fadeChild,
} from "./constants";
import type { WeatherData, WeatherTipKey } from "./types";
import { getStreak, getAttendance, getDaysSinceLastScan, getWeatherTipKey } from "./utils";
import { AttendanceCalendarModal } from "./MyScreen";
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
  const attendance = getAttendance();
  const daysSince = getDaysSinceLastScan();
  const [showCalendar, setShowCalendar] = useState(false);
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
    if (pullY >= 70) window.location.reload();
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
      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>

    <motion.div
      className="flex flex-col px-3 pb-8 relative overflow-hidden"
      style={{ minHeight: "calc(100dvh - 60px)", background: "#FDFAF8", paddingTop: 20 }}
      variants={stagger} initial="initial" animate="animate"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 헤더 row */}
      <div className="flex justify-between items-center mb-3 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: `${SCAN_FROM}22`, border: `1px solid ${SCAN_FROM}50` }}>
          <Sparkles className="w-3 h-3" style={{ color: SCAN_TO }} />
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: SCAN_TO, fontFamily: "'Fraunces', Georgia, serif" }}>FONDAY AI</span>
        </div>
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
              style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(201,112,98,0.12)", backdropFilter: "blur(8px)" }}>
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

      {/* ── 헤더 + 히어로 미리보기 ── */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: `${SCAN_FROM}22`, border: `1px solid ${SCAN_FROM}50` }}>
            <Sparkles className="w-3 h-3" style={{ color: SCAN_TO }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: SCAN_TO, fontFamily: "'Fraunces', Georgia, serif" }}>FONDAY AI</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/80 border border-white/70 shadow-[0_8px_24px_rgba(189,133,111,0.12)]">
            <span className="text-xs font-bold" style={{ color: DEEP_GREEN }}>{t("idle.heroBadge")}</span>
          </div>
        </div>
        <h1 className="text-[28px] sm:text-[30px] font-light text-stone-800 leading-[1.08] mb-1.5 px-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          {t("idle.subtitle1")}<br />{t("idle.subtitle3")}
        </h1>
        <p className="text-[12px] text-stone-500 px-1 mb-3">
          {t("idle.subtitle4")}
        </p>

        <div className="rounded-3xl p-3 border border-white/70 sm:rounded-3xl sm:p-3.5"
          style={{ background: "rgba(255,255,255,0.84)", boxShadow: "0 18px 44px rgba(160,120,100,0.15)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-stone-700">{t("idle.previewTitle")}</div>
              <div className="text-xs text-stone-400">{t("idle.previewSub")}</div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full max-w-[48%]"
              style={{ background: `${SCAN_FROM}16`, color: SCAN_TO }}>
              <Heart className="w-3 h-3 shrink-0" />
              <span className="text-[10px] leading-tight font-bold">{t("idle.socialCount", { n: socialCount.toLocaleString() })}</span>
            </div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 items-stretch sm:grid-cols-[116px_1fr] sm:gap-2.5 md:grid-cols-[132px_1fr] md:gap-3">
            <div className="relative rounded-3xl overflow-hidden min-h-[168px] bg-stone-100 sm:rounded-3xl sm:min-h-[176px]">
              <img
                src="/face-model.png"
                alt="preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center top" }}
              />
              <motion.div className="absolute left-0 right-0 h-[2px] z-10"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${SCAN_TO}CC 40%, ${SCAN_FROM} 50%, ${SCAN_TO}CC 60%, transparent 100%)` }}
                animate={reducedMotion ? { top: "50%" } : { top: ["5%", "88%", "5%"] }}
                transition={reducedMotion ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }} />
              <div className="absolute inset-x-0 bottom-0 h-24"
                style={{ background: "linear-gradient(to top, rgba(20,20,20,0.55), transparent)" }} />
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs sm:text-xs font-bold uppercase tracking-[0.16em] text-white/75">{t("idle.heroMbtiLabel")}</p>
                <p className="text-[22px] sm:text-2xl font-bold leading-none">OSNT</p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="rounded-3xl px-2.5 py-2.5 mb-2.5 sm:rounded-3xl sm:px-3"
                style={{ background: `${SCAN_FROM}10`, border: `1px solid ${SCAN_FROM}24` }}>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] truncate min-w-0" style={{ color: SCAN_TO }}>{t("idle.heroBenefitsTitle")}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] shrink-0 ml-1" style={{ color: TEXT_SECONDARY }}>{t("idle.heroTag")}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-xs shrink-0 whitespace-nowrap" style={{ background: "#F3E8E2", color: SCAN_TO }}>{t("result.baumannLabel")}</Badge>
                    <span>{t("idle.heroBenefit1")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-xs shrink-0 whitespace-nowrap" style={{ background: "#E7F7F0", color: DEEP_GREEN }}>{t("result.scores")}</Badge>
                    <span>{t("idle.heroBenefit2")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-xs shrink-0 whitespace-nowrap" style={{ background: "#FFF2E8", color: "#C2410C" }}>{t("result.skinAge")}</Badge>
                    <span>{t("idle.heroBenefit3")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {PREVIEW_SCORES.map(({ idx, score, color }, i) => (
                  <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={500 + i * 100} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        {scanLoading && (
          <div className={`rounded-2xl bg-white px-4 py-4 mb-4${reducedMotion ? "" : " animate-pulse"}`} style={{ boxShadow: "0 8px 20px rgba(45,95,79,0.06)" }}>
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
          <div className="rounded-2xl bg-white px-4 py-4 mb-4" style={{ boxShadow: "0 8px 20px rgba(45,95,79,0.06)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                  {t("idle.latestEyebrow")}
                </p>
                <p className="text-[15px] font-bold text-stone-800 mt-1">{t("idle.latestTitle")}</p>
                <p className="text-xs text-stone-500 mt-1 text-kr-pretty">{t("idle.latestDesc")}</p>
              </div>
              <div className="rounded-2xl px-3 py-2 text-right shrink-0" style={{ background: TINT_GREEN }}>
                <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: DEEP_GREEN }}>
                  {t("result.overall")}
                </p>
                <p className="text-[18px] font-light mt-1" style={{ color: DEEP_GREEN, fontFamily: "'Fraunces', Georgia, serif" }}>{latestScan.overallScore ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-2xl p-3" style={{ background: "#F6FBF8" }}>
                <p className="text-[11px] text-stone-400 leading-tight">{t("result.skinAge")}</p>
                <p className="text-[14px] font-bold mt-1 truncate" style={{ color: DEEP_GREEN }}>{latestScan.skinAge ?? "—"}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "#FFF7F3" }}>
                <p className="text-[11px] text-stone-400 leading-tight">{t("result.baumannLabel")}</p>
                <p className="text-[14px] font-bold mt-1 truncate" style={{ color: SCAN_TO }}>{latestScan.baumannType || "—"}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: "#F7F4FB" }}>
                <p className="text-[11px] text-stone-400 leading-tight">{t("my.focusTitle")}</p>
                <p className="text-[11px] font-bold mt-1 text-stone-800 line-clamp-2 leading-tight text-kr-pretty">
                  {Array.isArray(latestScan.scores) && latestScan.scores.length > 1
                    ? [...latestScan.scores].slice(1).sort((a: any, b: any) => Number(a.score) - Number(b.score))[0]?.label || "—"
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {latestScoreDelta !== null && (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: latestScoreDelta >= 0 ? "#E8F5EC" : "#FFF7ED", color: latestScoreDelta >= 0 ? "#2D7D46" : "#C2410C" }}>
                  {latestScoreDelta >= 0 ? "+" : ""}{latestScoreDelta}{t("result.scoreSuffix")}
                </span>
              )}
              {latestWeakMetric?.label && (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#F7F4FB", color: "#6D4CC2" }}>
                  {t("idle.latestFocus", { concern: latestWeakMetric.label })}
                </span>
              )}
              {daysSince !== null && (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#F8FAFD", color: DEEP_GREEN }}>
                  {t("idle.latestRecency", { days: daysSince })}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left active:opacity-70"
            style={{ background: "#FFFFFF", boxShadow: "0 8px 20px rgba(45,95,79,0.06)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
                <CalendarDays className="w-4.5 h-4.5" style={{ color: SCAN_TO }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-stone-800 truncate">{t("attendance.calendarTitle")}</p>
                <p className="text-xs text-stone-500 truncate">{t("attendance.totalPoints", { n: attendance.totalPoints })}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
          </button>
          {streak.count >= 2 && (
            <div
              className="rounded-2xl px-3 py-2.5 flex flex-col justify-center min-w-[92px]"
              style={{ background: "#FFF7ED", boxShadow: "0 8px 20px rgba(217,119,6,0.08)" }}
            >
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#C2410C" }}>
                <Flame className="w-3 h-3" />
                streak
              </div>
              <p className="text-[12px] font-bold mt-1" style={{ color: "#9A3412" }}>{t("streak.badge", { count: streak.count })}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 바우만 설명 더보기 accordion */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="rounded-2xl bg-white/90" style={{ backdropFilter: "blur(8px)" }}>
          <button onClick={() => setShowBaumannExp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <p className="text-sm font-bold text-stone-800">{t("idle.baumannSectionTitle")}</p>
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

      {/* 단계 표시 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="bg-white rounded-2xl px-3 py-2.5"
          style={{ boxShadow: "0 2px 10px rgba(45,95,79,0.06)" }}>
          <h2 className="text-xs font-semibold text-stone-400 text-center mb-2 tracking-widest uppercase">
            {t("idle.stepsTitle")}
          </h2>
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start" style={{ flex: 1 }}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={step.active
                      ? { background: TINT_WARM }
                      : { background: "#F4F4F5" }}>
                    <step.Icon className="w-4 h-4" style={{ color: step.active ? SCAN_TO : "#A9998E" }} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-stone-700">{step.title}</div>
                    <div className="text-xs text-stone-400 mt-0.5 leading-tight">{step.sub}</div>
                  </div>
                </div>
                {i < 2 && <div className="text-stone-200 text-sm pt-2 flex-shrink-0">›</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 개인정보 보호 배지 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl"
          style={{ background: "#EEF7F3" }}>
          <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DEEP_GREEN }} />
          <span className="text-xs font-medium" style={{ color: DEEP_GREEN }}>{t("idle.privacy")}</span>
        </div>
      </motion.div>

      {/* CTA 버튼 */}
      <motion.div variants={fadeChild} className="mt-auto relative" style={{ zIndex: 1 }}>
        <motion.button
          onClick={onScan}
          className="w-full py-4 sm:py-[18px] rounded-2xl text-white text-[15px] sm:text-[16px] font-bold tracking-tight"
          style={{ background: DEEP_GREEN }}
          whileHover={{ scale: reducedMotion ? 1 : 1.01 }}
          whileTap={{ scale: reducedMotion ? 1 : 0.97 }}
          animate={reducedMotion ? {} : {
            boxShadow: [
              `0 8px 22px rgba(45,95,79,0.16)`,
              `0 10px 28px rgba(45,95,79,0.22)`,
              `0 8px 22px rgba(45,95,79,0.16)`,
            ],
          }}
          transition={reducedMotion ? {} : { duration: 2.5, repeat: Infinity }}
        >
          {t("idle.ctaBtn")}
        </motion.button>
        <p className="text-center text-xs mt-2.5" style={{ color: TEXT_SECONDARY }}>
          <Sparkles className="w-3 h-3 inline mr-1" style={{ color: SCAN_FROM }} />
          {t("idle.ctaHint")}
        </p>
      </motion.div>

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
