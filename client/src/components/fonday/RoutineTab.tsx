import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Droplets, AlertTriangle, Plus, Sparkles, X, Sun, Moon } from "lucide-react";
import type { CosmeticItem } from "./types";
import {
  BG_BASE,
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  FONT_HEADING,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  TINT_WARM,
  TINT_NEUTRAL,
  SHADOW_CARD,
  RADIUS_CARD,
  RADIUS_SUB,
  RADIUS_ITEM,
  PAGE_GRADIENT,
  TEXT_HEADING,
  TEXT_TITLE,
  TEXT_LABEL,
  TEXT_SECONDARY,
  COLOR_WARNING,
} from "./constants";
import {
  inferCosmeticTimeOfDay,
  buildRepresentativeRoutine,
  buildCosmeticCorrelationSignals,
} from "./utils";
import { CosmeticsRegisterModal } from "./CosmeticsRegisterModal";
import { CosmeticsReportCard } from "./CosmeticsReportCard";
import { RoutineChecklist } from "./RoutineChecklist";
import { todayStr } from "./utils";

interface OptimizedRoutine {
  am: { id: string; order: number }[];
  pm: { id: string; order: number }[];
  conflicts: { productNames: string[]; reason: string; resolution: string }[];
}

export function RoutineTab({ user, onLogin }: { user: any; onLogin?: (p: "kakao" | "line" | "google", tab: string) => void }) {
  const { t, i18n } = useTranslation();
  const [list, setList] = useState<CosmeticItem[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState<OptimizedRoutine | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showAllCollection, setShowAllCollection] = useState(false);
  const [routineLogs, setRoutineLogs] = useState<{ date_str: string; cosmetic_ids: string[] }[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cosmeticsRes, scansRes] = await Promise.all([
        fetch("/api/cosmetics", { credentials: "include" }),
        fetch("/api/scans", { credentials: "include" }),
      ]);
      const [cosmeticsData, scansData] = await Promise.all([
        cosmeticsRes.json().catch(() => []),
        scansRes.json().catch(() => []),
      ]);
      const items = Array.isArray(cosmeticsData) ? cosmeticsData : [];
      setList(items);
      setScans(Array.isArray(scansData) ? scansData : []);

      fetch("/api/routine-log", { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then(data => setRoutineLogs(Array.isArray(data) ? data : []))
        .catch(() => {});

      if (items.length > 0) {
        setOptimizing(true);
        fetch("/api/cosmetics/optimize-routine", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cosmetics: items }),
        })
          .then((r) => r.json())
          .then((result) => {
            if (result.am || result.pm) setOptimized(result);
          })
          .catch(() => {})
          .finally(() => setOptimizing(false));
      } else {
        setOptimized(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, [user]);

  // 오늘 체크한 화장품 로드
  useEffect(() => {
    if (!user) return;
    fetch(`/api/routine-log?date=${todayStr()}`)
      .then((r) => (r.ok ? r.json() : { cosmetic_ids: [] }))
      .then((data) => {
        const ids = Array.isArray(data.cosmetic_ids) ? data.cosmetic_ids : [];
        setCheckedIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const handleCosmeticToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      fetch("/api/routine-log", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr(), cosmetic_ids: next }),
      }).catch(() => {});
      return next;
    });
  };

  const routinePlan = buildRepresentativeRoutine(
    list,
    t,
    optimized
      ? {
          am: optimized.am?.map((item) => item.id),
          pm: optimized.pm?.map((item) => item.id),
          conflicts: optimized.conflicts,
        }
      : undefined,
  );
  const productSignals = buildCosmeticCorrelationSignals(list, scans, t, routineLogs);
  const latestScan = scans.length > 0 ? scans[0] : null;
  const latestBaumannType = latestScan?.baumannType ?? "";
  const latestScores = (() => {
    try {
      if (!latestScan?.scores) return [];
      return Array.isArray(latestScan.scores) ? latestScan.scores : JSON.parse(latestScan.scores as string);
    } catch { return []; }
  })();
  const latestAnalysisResult = latestScores.length > 0 ? { scores: latestScores } as any : null;
  const topSignal = productSignals[0] || null;
  const selectedSignal = selectedItem ? productSignals.find((signal) => signal.itemId === selectedItem.id) || null : null;
  const strongestSignalCount = productSignals.filter((signal) => signal.confidence === "strong").length;
  const positiveSignalCount = productSignals.filter((signal) => (signal.topScoreDelta ?? signal.overallDelta ?? 0) >= 0).length;
  const routineStats = [
    {
      key: "products",
      label: t("cosmetics.dashboardProducts"),
      value: list.length,
      tone: "#F6FBF8",
      color: DEEP_GREEN,
    },
    {
      key: "scans",
      label: t("cosmetics.dashboardScans"),
      value: scans.length,
      tone: "#FFF7F3",
      color: SCAN_TO,
    },
    {
      key: "signals",
      label: t("cosmetics.dashboardSignals"),
      value: productSignals.length,
      tone: "#F7F4FB",
      color: "#6D4CC2",
    },
  ];
  const sections = [
    {
      key: "am" as const,
      title: t("result.actionCard.phaseMorning"),
      accent: DEEP_GREEN,
      bg: TINT_GREEN,
    },
    {
      key: "pm" as const,
      title: t("result.actionCard.phaseEvening"),
      accent: SCAN_TO,
      bg: TINT_WARM,
    },
  ];

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/cosmetics/${id}`, { method: "DELETE" }).catch(() => {});
    setList((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem((prev) => (prev?.id === id ? null : prev));
    setDeletingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-64px)] px-4 pt-5 pb-28" style={{ background: PAGE_GRADIENT }}>
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_GREEN }}>
              <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            </div>
            <h2 className="text-[22px] font-extrabold" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>{t("cosmetics.myTitle")}</h2>
          </div>
          <p className="text-[14px] leading-relaxed text-kr-pretty" style={{ color: TEXT_SECONDARY, marginLeft: 42 }}>
            {t("cosmetics.loginDesc")}
          </p>
        </div>

        <div className="p-5 mb-6" style={{ borderRadius: RADIUS_CARD, background: BG_BASE, boxShadow: SHADOW_CARD }}>
          <div className="mb-4">
            <p className="text-[14px] font-bold mb-3" style={{ color: TEXT_TITLE }}>{t("cosmetics.loginValueTitle", "로그인하면 이런 걸 할 수 있어요")}</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("cosmetics.loginValue1", "AM/PM 루틴을 자동으로 정리해줘요")}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("cosmetics.loginValue2", "화장품별 피부 변화를 추적해요")}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: COLOR_WARNING }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("cosmetics.loginValue3", "성분 충돌을 미리 알려줘요")}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {i18n.language === "ko" ? (
              <button
                onClick={() => onLogin ? onLogin("kakao", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/kakao")}
                className="w-full font-bold text-[13px] flex items-center justify-center gap-2 border-0 text-[#3C1E1E]"
                style={{ background: "#FEE500", height: 48, borderRadius: 24 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                {t("attendance.kakao")}
              </button>
            ) : (
              <button
                onClick={() => onLogin ? onLogin("line", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/line")}
                className="w-full font-bold text-[13px] flex items-center justify-center gap-2 border-0 text-white"
                style={{ background: "#06C755", height: 48, borderRadius: 24 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 7.56c0-3.16-3.13-5.73-6.98-5.73S1.04 4.4 1.04 7.56c0 2.83 2.47 5.2 5.82 5.65.23.05.53.15.61.35.07.18.05.46.02.64l-.1.58c-.03.18-.14.69.6.38.74-.32 3.98-2.38 5.43-4.07C14.54 9.88 15 8.78 15 7.56Z" fill="white"/></svg>
                {t("attendance.line")}
              </button>
            )}
            <button
              onClick={() => onLogin ? onLogin("google", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/google")}
              className="w-full font-bold text-[13px] text-[#6B5D55] flex items-center justify-center gap-2"
              style={{ height: 48, borderRadius: 24, background: BG_MUTED }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              {t("attendance.google")}
            </button>
          </div>
        </div>

        {productSignals.length > 0 && (
          <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                  {t("cosmetics.effectBoardEyebrow")}
                </p>
                <p className="text-[15px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                  {t("cosmetics.effectBoardTitle")}
                </p>
                <p className="text-xs mt-1 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>
                  {t("cosmetics.effectBoardDesc")}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(() => {
                // 동일 점수+설명 시그널 묶기
                const grouped: { key: string; signals: typeof productSignals; delta: number; note: string; topScoreIndex: number | null; daysTracked: number; afterCount: number }[] = [];
                for (const signal of productSignals) {
                  const delta = signal.topScoreDelta ?? signal.overallDelta ?? 0;
                  const key = `${delta}_${signal.note}`;
                  const existing = grouped.find(g => g.key === key);
                  if (existing) {
                    existing.signals.push(signal);
                  } else {
                    grouped.push({ key, signals: [signal], delta, note: signal.note, topScoreIndex: signal.topScoreIndex, daysTracked: signal.daysTracked, afterCount: signal.afterCount });
                  }
                }
                return grouped.slice(0, 3).map((group) => {
                  const mainMetric = group.topScoreIndex !== null ? t(`scores.${group.topScoreIndex}`) : t("cosmetics.signalMetricFallback");
                  const positive = group.delta >= 0;
                  const names = group.signals.map(s => s.itemName);
                  const displayName = names.length <= 2 ? names.join(", ") : `${names[0]} ${t("cosmetics.effectGroupSuffix", { count: names.length - 1 })}`;
                  return (
                    <div key={group.key} className="rounded-2xl p-3" style={{ background: "#FAF8F5" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-[#5C4F4A]">{displayName}</p>
                          <p className="text-xs mt-1 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{group.note}</p>
                          {names.length > 2 && (
                            <p className="text-xs mt-1.5" style={{ color: SCAN_TO }}>
                              {t("cosmetics.effectGroupHint", "동시에 사용 중이라 개별 효과를 구분하기 어려워요")}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold shrink-0" style={{ background: `${positive ? DEEP_GREEN : SCAN_TO}12`, color: positive ? DEEP_GREEN : SCAN_TO }}>
                          {positive ? "+" : ""}{group.delta}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="rounded-2xl p-2.5 bg-white">
                          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.effectMetricLabel")}</p>
                          <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{mainMetric}</p>
                        </div>
                        <div className="rounded-2xl p-2.5 bg-white">
                          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.effectTrackedLabel")}</p>
                          <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{t("cosmetics.effectTrackedValue", { days: group.daysTracked })}</p>
                        </div>
                        <div className="rounded-2xl p-2.5 bg-white">
                          <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.effectScanLabel")}</p>
                          <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{t("cosmetics.effectScanValue", { count: group.afterCount })}</p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] px-4 pt-5 pb-28" style={{ background: PAGE_GRADIENT }}>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_GREEN }}>
            <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
          </div>
          <h1 className="text-[22px] font-extrabold" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>{t("cosmetics.myTitle")}</h1>
        </div>
        <p className="text-[13px] text-kr-pretty" style={{ color: TEXT_SECONDARY, marginLeft: 42 }}>
          {t("cosmetics.routineSubtitle")}
        </p>

        {/* AM/PM 요약 — 아이콘+텍스트 한 줄 */}
        <div className="flex items-center gap-4 mt-4 mb-4">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            <span className="text-[13px] font-semibold" style={{ color: TEXT_TITLE }}>{t("cosmetics.amBtn")}</span>
            <span className="text-[13px] font-bold" style={{ color: DEEP_GREEN }}>{routinePlan.am.length}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: SCAN_TO }} />
            <span className="text-[13px] font-semibold" style={{ color: TEXT_TITLE }}>{t("cosmetics.pmBtn")}</span>
            <span className="text-[13px] font-bold" style={{ color: SCAN_TO }}>{routinePlan.pm.length}</span>
          </div>
        </div>

        <button
          onClick={() => setShowRegister(true)}
          className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold"
          style={{ background: "rgba(74,124,110,0.06)", color: DEEP_GREEN, border: "1.5px solid rgba(74,124,110,0.18)", height: 44, borderRadius: 22 }}
        >
          <Plus className="w-4 h-4" />
          {t("cosmetics.scanBtn")}
        </button>

        {/* 화장품 성적표 — 플랫 섹션 */}
        <div className="mt-8 pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-[15px] font-bold" style={{ color: TEXT_TITLE }}>
            {t("cosmetics.dashboardTitle")}
          </p>
          <p className="text-[12px] mt-0.5 mb-4" style={{ color: TEXT_SECONDARY }}>
            {t("cosmetics.dashboardDesc")}
          </p>

          {/* 요약 숫자 */}
          <div className="flex items-center gap-3 mb-4">
            {routineStats.map((stat) => (
              <div key={stat.key} className="flex items-center gap-1.5">
                <span className="text-[18px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-[11px]" style={{ color: TEXT_SECONDARY }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* 가장 효과 좋은 제품 */}
          {topSignal ? (
            <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              <p className="text-[11px] font-bold mb-1.5" style={{ color: DEEP_GREEN }}>{t("cosmetics.signalTopTitle")}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold truncate" style={{ color: TEXT_TITLE }}>{topSignal.itemName}</p>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0" style={{ background: TINT_WARM, color: SCAN_TO }}>
                  {t(`cosmetics.signalConfidence.${topSignal.confidence}`)}
                </span>
              </div>
              <p className="text-[12px] mt-1 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{topSignal.note}</p>
            </div>
          ) : (
            <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>{t("cosmetics.signalEmpty")}</p>
            </div>
          )}

          {list.length > 0 && latestAnalysisResult && (
            <button
              onClick={() => setShowReportCard(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 text-[13px] font-bold"
              style={{ background: "#C97062", color: "#FFFFFF", height: 44, borderRadius: 22 }}
            >
              <Sparkles className="w-4 h-4" />
              {t("cosmeticsReport.title")}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="pt-5 mt-5 p-8 text-center" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
              <Droplets className="w-6 h-6" />
            </div>
            <p className="text-[14px] font-bold text-[#6B5D55] mb-1">{t("cosmetics.myEmpty")}</p>
            <p className="text-[12px] mb-4" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.myEmptyDesc")}</p>
            <button
              onClick={() => setShowRegister(true)}
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5"
              style={{ background: DEEP_GREEN, color: "#FFFFFF", borderRadius: 20 }}
            >
              <Plus className="w-4 h-4" />
              {t("cosmetics.scanBtn")}
            </button>
          </div>
        ) : (
          <>
            <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              {sections.map(({ key, title, accent, bg }, sectionIdx) => (
                <div key={key} className={sectionIdx > 0 ? "mt-5 pt-5" : ""} style={sectionIdx > 0 ? { borderTop: "1px solid #EBE8E4" } : {}}>
                  <div className="flex items-center gap-2 mb-3">
                    {key === "am" ? <Sun className="w-4 h-4" style={{ color: accent }} /> : <Moon className="w-4 h-4" style={{ color: accent }} />}
                    <p className="text-[14px] font-bold" style={{ color: accent }}>{title}</p>
                    <span className="text-xs" style={{ color: TEXT_SECONDARY }}>
                      {routinePlan[key].length > 0 ? `${routinePlan[key].length}${t("cosmetics.boardStepSuffix", "개")}` : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {routinePlan[key].length === 0 ? (
                      <p className="text-[13px] py-2" style={{ color: TEXT_TERTIARY }}>
                        {t(key === "am" ? "cosmetics.routineEmptyAm" : "cosmetics.routineEmptyPm")}
                      </p>
                    ) : routinePlan[key].map((item, index) => (
                      <button
                        key={`${key}-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="w-full px-3.5 py-3 flex items-center gap-3 text-left"
                        style={{ borderRadius: RADIUS_SUB, background: BG_MUTED }}
                      >
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: accent }}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold truncate" style={{ color: TEXT_TITLE }}>{t(`cosmetics.categories.${item.category}`)}</p>
                          <p className="text-[12px] truncate" style={{ color: TEXT_SECONDARY }}>{item.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: TEXT_TERTIARY }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 오늘 사용한 화장품 체크리스트 */}
            {list.length > 0 && (
              <div className="mt-6">
                <RoutineChecklist
                  cosmetics={list}
                  checkedIds={checkedIds}
                  onToggle={handleCosmeticToggle}
                  onRegister={() => setShowRegister(true)}
                  user={user}
                  loading={loading}
                />
              </div>
            )}

            {productSignals.length > 0 && (
              <div className="pt-8 mt-8" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.signalSectionTitle")}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.signalSectionDesc")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: "#EEF4FF", color: "#4A7C6E" }}>
                      {t("cosmetics.signalWindow")}
                    </span>
                    {productSignals.length > 3 && (
                      <button
                        onClick={() => setShowAllSignals((v) => !v)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap"
                        style={{ background: TINT_WARM, color: SCAN_TO }}
                      >
                        {showAllSignals ? t("common.collapse") : t("common.viewAll", { count: productSignals.length })}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5">
                  {(() => {
                    // 전체보기: 개별 표시, 축소: 그룹화
                    if (showAllSignals) {
                      // 모든 제품이 동일 점수+설명인지 확인
                      const allSame = productSignals.length > 1 && productSignals.every((s) => {
                        const d0 = productSignals[0].topScoreDelta ?? productSignals[0].overallDelta ?? 0;
                        const d = s.topScoreDelta ?? s.overallDelta ?? 0;
                        return d === d0 && s.note === productSignals[0].note;
                      });
                      const items = [];
                      if (allSame) {
                        items.push(
                          <div key="same-notice" className="p-3 rounded-xl text-center" style={{ background: TINT_WARM }}>
                            <p className="text-[12px] font-semibold" style={{ color: SCAN_TO }}>
                              {t("cosmetics.effectAllSameTitle", "모든 제품의 분석 결과가 동일해요")}
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: TEXT_SECONDARY }}>
                              {t("cosmetics.effectAllSameDesc", "매일 같은 제품을 동시에 사용하고 있어서 개별 효과를 구분하기 어려워요. 한 제품씩 바꿔보면 더 정확한 분석이 가능해요.")}
                            </p>
                          </div>
                        );
                      }
                      items.push(...productSignals.map((signal) => {
                        const deltaValue = signal.topScoreDelta ?? signal.overallDelta ?? 0;
                        const positive = deltaValue >= 0;
                        return (
                          <div key={signal.itemId} className="p-3" style={{ borderRadius: RADIUS_ITEM, background: BG_MUTED }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12px] font-semibold truncate min-w-0" style={{ color: TEXT_TITLE }}>{signal.itemName}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: positive ? `${DEEP_GREEN}12` : `${SCAN_TO}12`, color: positive ? DEEP_GREEN : SCAN_TO }}>
                                  {positive ? "+" : ""}{deltaValue}
                                </span>
                                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                                  {t(`cosmetics.signalConfidence.${signal.confidence}`)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs mt-1 text-kr-pretty" style={{ color: SCAN_TO }}>{signal.note}</p>
                          </div>
                        );
                      }));
                      return items;
                    }
                    const grouped: { key: string; signals: typeof productSignals; delta: number; note: string; confidence: string }[] = [];
                    const source = productSignals.slice(0, 3);
                    for (const signal of source) {
                      const delta = signal.topScoreDelta ?? signal.overallDelta ?? 0;
                      const key = `${delta}_${signal.note}`;
                      const existing = grouped.find(g => g.key === key);
                      if (existing) { existing.signals.push(signal); }
                      else { grouped.push({ key, signals: [signal], delta, note: signal.note, confidence: signal.confidence }); }
                    }
                    return grouped.map((group) => {
                      const positive = group.delta >= 0;
                      const names = group.signals.map(s => s.itemName);
                      const displayName = names.length <= 2 ? names.join(", ") : `${names[0]} ${t("cosmetics.effectGroupSuffix", { count: names.length - 1 })}`;
                      return (
                        <div key={group.key} className="p-3" style={{ borderRadius: RADIUS_ITEM, background: BG_MUTED }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-semibold text-[#5C4F4A] min-w-0">{displayName}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: positive ? `${DEEP_GREEN}12` : `${SCAN_TO}12`, color: positive ? DEEP_GREEN : SCAN_TO }}>
                                {positive ? "+" : ""}{group.delta}
                              </span>
                              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                                {t(`cosmetics.signalConfidence.${group.confidence}`)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs mt-1 text-kr-pretty" style={{ color: SCAN_TO }}>{group.note}</p>
                          {names.length > 2 && (
                            <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>
                              {t("cosmetics.effectGroupHint")}
                            </p>
                          )}
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: BG_BASE }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(100, Math.max(14, Math.abs(group.delta) * 6))}%`,
                                background: positive ? DEEP_GREEN : SCAN_TO,
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {routinePlan.conflicts.length > 0 && (
              <div className="border p-4" style={{ borderRadius: RADIUS_CARD, background: "#FFF8F0", borderColor: "#F7E1D1" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: SCAN_TO }}>{t("cosmetics.routineConflictTitle")}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.routineConflictDesc")}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {routinePlan.conflicts.map((conflict, index) => (
                    <div key={index} className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-[#6B5D55] mb-0.5 line-clamp-2">{conflict.productNames.join(" + ")}</p>
                      <p className="text-xs" style={{ color: TEXT_SECONDARY }}>{conflict.reason}</p>
                      {conflict.resolution && <p className="text-xs mt-1 font-medium" style={{ color: DEEP_GREEN }}>{conflict.resolution}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 mt-8" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              <div className="mb-4">
                <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.collectionTitle")}</p>
                <p className="text-xs mt-0.5" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.collectionSub")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(showAllCollection ? list : list.slice(0, 4)).map((item) => {
                  const signal = productSignals.find((entry) => entry.itemId === item.id) || null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-3 text-left"
                      style={{ borderRadius: RADIUS_CARD, background: BG_BASE, boxShadow: SHADOW_CARD }}
                    >
                      {item.image_thumbnail ? (
                        <img src={item.image_thumbnail} alt={item.name ?? ""} className="w-full h-28 rounded-2xl object-cover bg-stone-200" loading="lazy" />
                      ) : (
                        <div className="w-full h-28 rounded-2xl bg-stone-100 flex items-center justify-center">
                          <Droplets className="w-7 h-7" style={{ color: TEXT_TERTIARY }} />
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-[#5C4F4A] truncate">{item.name}</p>
                        <p className="text-xs truncate" style={{ color: TEXT_TERTIARY }}>{item.brand || t("cosmetics.noBrand")}</p>
                        {signal && <p className="text-xs mt-2 line-clamp-2 text-kr-pretty" style={{ color: SCAN_TO }}>{signal.note}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                            {t(`cosmetics.categories.${item.category}`)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: `${SCAN_FROM}14`, color: SCAN_TO }}>
                            {item.time_of_day === "am"
                              ? t("cosmetics.amBtn")
                              : item.time_of_day === "pm"
                              ? t("cosmetics.pmBtn")
                              : inferCosmeticTimeOfDay(item.category) === "am"
                              ? t("cosmetics.amBtn")
                              : t("cosmetics.pmBtn")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {list.length > 4 && (
                <button
                  onClick={() => setShowAllCollection(v => !v)}
                  className="w-full mt-3 text-center text-[13px] font-semibold py-2"
                  style={{ color: DEEP_GREEN }}
                >
                  {showAllCollection ? t("common.collapse", "접기") : t("common.viewAll", { count: list.length, defaultValue: `전체 ${list.length}개 보기` })}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => setShowRegister(true)}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <AnimatePresence>
        {showReportCard && latestAnalysisResult && (
          <CosmeticsReportCard
            myCosmetics={list}
            analysisResult={latestAnalysisResult}
            finalType={latestBaumannType}
            onClose={() => setShowReportCard(false)}
            onAddCosmetic={() => { setShowReportCard(false); setShowRegister(true); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRegister && (
          <CosmeticsRegisterModal
            onClose={() => setShowRegister(false)}
            onSuccess={() => {
              setShowRegister(false);
              loadData().catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div className="fixed inset-0 z-[130] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedItem(null)} />
            <motion.div
              className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8"
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between px-1 mb-4">
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5F5F4" }}
                >
                  <X className="w-4 h-4" style={{ color: TEXT_TERTIARY }} />
                </button>
              </div>
              <div className="flex items-start gap-3">
                {selectedItem.image_thumbnail ? (
                  <img src={selectedItem.image_thumbnail} alt={selectedItem.name ?? ""} className="w-20 h-20 rounded-3xl object-cover bg-stone-100 shrink-0" loading="lazy" />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center shrink-0">
                    <Droplets className="w-8 h-8" style={{ color: TEXT_TERTIARY }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[#5C4F4A] text-kr-pretty">{selectedItem.name}</p>
                  <p className="text-[12px] mt-1" style={{ color: TEXT_TERTIARY }}>{selectedItem.brand || t("cosmetics.noBrand")}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                      {t(`cosmetics.categories.${selectedItem.category}`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <div className="rounded-2xl p-3" style={{ background: TINT_NEUTRAL }}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.openedLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>{selectedItem.opened_at || t("cosmetics.detailUnknown")}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.detailStatusLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: SCAN_TO }}>{t("cosmetics.detailStatusActive")}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl p-4 bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.ingredientsLabel")}</p>
                <p className="text-[12px] mt-2 leading-relaxed whitespace-pre-wrap text-kr-pretty" style={{ color: TEXT_LABEL }}>
                  {selectedItem.ingredients?.trim() || t("cosmetics.ingredientsEmpty")}
                </p>
              </div>

              <div className="mt-4 rounded-3xl p-4" style={{ background: "#F7FAFC" }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: DEEP_GREEN }}>{t("cosmetics.signalCardTitle")}</p>
                  {selectedSignal && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                      {t(`cosmetics.signalConfidence.${selectedSignal.confidence}`)}
                    </span>
                  )}
                </div>
                {selectedSignal ? (
                  <>
                    <p className="text-[13px] font-semibold mt-2 text-kr-pretty" style={{ color: SCAN_TO }}>{selectedSignal.note}</p>
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.signalMetricLabel")}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>
                          {selectedSignal.topScoreIndex !== null ? t(`scores.${selectedSignal.topScoreIndex}`) : t("cosmetics.signalMetricFallback")}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: TEXT_TERTIARY }}>{t("cosmetics.signalObservedLabel")}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>
                          {t("cosmetics.signalObservedValue", { count: selectedSignal.afterCount, days: Math.min(selectedSignal.daysTracked, 14) })}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[12px] mt-2 text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{t("cosmetics.signalEmpty")}</p>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deletingId === selectedItem.id}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[13px] bg-stone-50 disabled:opacity-40" style={{ color: TEXT_LABEL }}
                >
                  {deletingId === selectedItem.id ? "..." : t("cosmetics.deleteConfirm")}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ background: DEEP_GREEN }}
                >
                  {t("cosmetics.confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
