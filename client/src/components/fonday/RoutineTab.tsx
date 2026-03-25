import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Droplets, AlertTriangle, Plus, Sparkles, X } from "lucide-react";
import type { CosmeticItem } from "./types";
import {
  BG_BASE,
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  TINT_WARM,
  TINT_NEUTRAL,
} from "./constants";
import {
  inferCosmeticTimeOfDay,
  buildRepresentativeRoutine,
  buildCosmeticCorrelationSignals,
} from "./utils";
import { CosmeticsRegisterModal } from "./CosmeticsRegisterModal";
import { CosmeticsReportCard } from "./CosmeticsReportCard";

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
  const [routineLogs, setRoutineLogs] = useState<{ date_str: string; cosmetic_ids: string[] }[]>([]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cosmeticsRes, scansRes] = await Promise.all([
        fetch("/api/cosmetics"),
        fetch("/api/scans"),
      ]);
      const [cosmeticsData, scansData] = await Promise.all([
        cosmeticsRes.json().catch(() => []),
        scansRes.json().catch(() => []),
      ]);
      const items = Array.isArray(cosmeticsData) ? cosmeticsData : [];
      setList(items);
      setScans(Array.isArray(scansData) ? scansData : []);

      fetch("/api/routine-log")
        .then(r => r.ok ? r.json() : [])
        .then(data => setRoutineLogs(Array.isArray(data) ? data : []))
        .catch(() => {});

      if (items.length > 0) {
        setOptimizing(true);
        fetch("/api/cosmetics/optimize-routine", {
          method: "POST",
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
      <div className="min-h-[calc(100dvh-64px)] px-4 pt-6 pb-28" style={{ background: "linear-gradient(180deg, #FDFCFA 0%, #F8F5F1 50%, #FDFCFA 100%)" }}>
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_GREEN }}>
              <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            </div>
            <h2 className="text-[20px] font-bold" style={{ color: "#5C4F4A" }}>{t("cosmetics.myTitle")}</h2>
          </div>
          <p className="text-[14px] leading-relaxed text-kr-pretty" style={{ color: "#8C8078", marginLeft: 42 }}>
            {t("cosmetics.loginDesc")}
          </p>
        </div>

        <div className="rounded-[20px] p-5 mb-6" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div className="space-y-2 mb-5">
            <div className="rounded-2xl px-4 py-3" style={{ background: BG_MUTED }}>
              <p className="text-[13px] font-semibold text-[#5C4F4A]">{t("cosmetics.routineRepresentativeTitle")}</p>
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: BG_MUTED }}>
              <p className="text-[13px] font-semibold text-[#5C4F4A]">{t("cosmetics.signalSectionTitle")}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {i18n.language === "ko" ? (
              <button
                onClick={() => onLogin ? onLogin("kakao", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/kakao")}
                className="w-full font-bold text-[13px] flex items-center justify-center border-0 text-[#3C1E1E]"
                style={{ background: "#FEE500", height: 48, borderRadius: 24 }}
              >
                {t("attendance.kakao")}
              </button>
            ) : (
              <button
                onClick={() => onLogin ? onLogin("line", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/line")}
                className="w-full font-bold text-[13px] flex items-center justify-center border-0 text-white"
                style={{ background: "#C97062", height: 48, borderRadius: 24 }}
              >
                {t("attendance.line")}
              </button>
            )}
            <button
              onClick={() => onLogin ? onLogin("google", "routine") : (localStorage.setItem("fonday_return_tab", "routine"), window.location.href = "/auth/google")}
              className="w-full font-bold text-[13px] text-[#6B5D55] flex items-center justify-center"
              style={{ height: 48, borderRadius: 24, background: BG_MUTED }}
            >
              {t("attendance.google")}
            </button>
          </div>
        </div>

        {productSignals.length > 0 && (
          <div className="rounded-[20px] p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
                  {t("cosmetics.effectBoardEyebrow")}
                </p>
                <p className="text-[15px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                  {t("cosmetics.effectBoardTitle")}
                </p>
                <p className="text-xs text-stone-500 mt-1 text-kr-pretty">
                  {t("cosmetics.effectBoardDesc")}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {productSignals.slice(0, 3).map((signal) => {
                const mainMetric = signal.topScoreIndex !== null ? t(`scores.${signal.topScoreIndex}`) : t("cosmetics.signalMetricFallback");
                const deltaValue = signal.topScoreDelta ?? signal.overallDelta ?? 0;
                const positive = deltaValue >= 0;
                return (
                  <div key={`effect-${signal.itemId}`} className="rounded-2xl p-3" style={{ background: "#FAF8F5" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-[#5C4F4A] truncate">{signal.itemName}</p>
                        <p className="text-xs text-stone-500 mt-1 text-kr-pretty">{signal.note}</p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold shrink-0" style={{ background: `${positive ? DEEP_GREEN : SCAN_TO}12`, color: positive ? DEEP_GREEN : SCAN_TO }}>
                        {positive ? "+" : ""}{deltaValue}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="rounded-2xl p-2.5 bg-white">
                        <p className="text-xs text-stone-400">{t("cosmetics.effectMetricLabel")}</p>
                        <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{mainMetric}</p>
                      </div>
                      <div className="rounded-2xl p-2.5 bg-white">
                        <p className="text-xs text-stone-400">{t("cosmetics.effectTrackedLabel")}</p>
                        <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{t("cosmetics.effectTrackedValue", { days: signal.daysTracked })}</p>
                      </div>
                      <div className="rounded-2xl p-2.5 bg-white">
                        <p className="text-xs text-stone-400">{t("cosmetics.effectScanLabel")}</p>
                        <p className="text-xs font-bold mt-1 text-[#5C4F4A]">{t("cosmetics.effectScanValue", { count: signal.afterCount })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] px-4 pt-5 pb-28" style={{ background: "linear-gradient(180deg, #FDFCFA 0%, #F8F5F1 50%, #FDFCFA 100%)" }}>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_GREEN }}>
            <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
          </div>
          <h1 className="text-[20px] font-bold" style={{ color: "#5C4F4A" }}>{t("cosmetics.myTitle")}</h1>
        </div>
        <p className="text-[13px] text-kr-pretty" style={{ color: "#8C8078", marginLeft: 42 }}>
          {t("cosmetics.routineSubtitle")}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-[16px] p-4" style={{ background: "#F6FBF8" }}>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: DEEP_GREEN }}>{t("cosmetics.amBtn")}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{routinePlan.am.length}</p>
            <p className="text-xs text-stone-400 mt-1">{t("cosmetics.boardStepCount", { count: routinePlan.am.length })}</p>
          </div>
          <div className="rounded-[16px] p-4" style={{ background: "#FFF7F3" }}>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{t("cosmetics.pmBtn")}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{routinePlan.pm.length}</p>
            <p className="text-xs text-stone-400 mt-1">{t("cosmetics.boardStepCount", { count: routinePlan.pm.length })}</p>
          </div>
        </div>

        <button
          onClick={() => setShowRegister(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold"
          style={{ background: TINT_GREEN, color: DEEP_GREEN, height: 48, borderRadius: 24 }}
        >
          <Plus className="w-4 h-4" />
          {t("cosmetics.scanBtn")}
        </button>

        <div className="mt-5 rounded-[20px] p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
                {t("cosmetics.dashboardEyebrow")}
              </p>
              <p className="text-[15px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                {t("cosmetics.dashboardTitle")}
              </p>
              <p className="text-[12px] text-stone-500 mt-1 text-kr-pretty">
                {t("cosmetics.dashboardDesc")}
              </p>
            </div>
            <button
              onClick={() => list.length > 0 && latestAnalysisResult ? setShowReportCard(true) : setShowRegister(true)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 cursor-pointer"
              style={{ background: list.length > 0 && latestAnalysisResult ? `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` : "#FFFFFF" }}
              aria-label={t("cosmeticsReport.title")}
            >
              <Sparkles className="w-5 h-5" style={{ color: list.length > 0 && latestAnalysisResult ? "#FFFFFF" : SCAN_TO }} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {routineStats.map((stat) => (
              <div key={stat.key} className="rounded-2xl p-3" style={{ background: stat.tone }}>
                <p className="text-[11px] text-stone-400 leading-tight truncate">{stat.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
            <p className="text-xs font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.signalTopTitle")}</p>
            {topSignal ? (
              <>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <p className="text-[13px] font-semibold text-[#5C4F4A] truncate min-w-0">{topSignal.itemName}</p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold shrink-0" style={{ background: `${SCAN_TO}12`, color: SCAN_TO }}>
                    {t(`cosmetics.signalConfidence.${topSignal.confidence}`)}
                  </span>
                </div>
                <p className="text-xs mt-1 text-kr-pretty" style={{ color: SCAN_TO }}>{topSignal.note}</p>
              </>
            ) : (
              <p className="text-xs mt-2 text-stone-500 text-kr-pretty">{t("cosmetics.signalEmpty")}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
              <p className="text-[11px] text-stone-400 leading-tight truncate">{t("cosmetics.effectStrongLabel")}</p>
              <p className="text-[18px] font-bold mt-1" style={{ color: DEEP_GREEN }}>{strongestSignalCount}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
              <p className="text-[11px] text-stone-400 leading-tight truncate">{t("cosmetics.effectPositiveLabel")}</p>
              <p className="text-[18px] font-bold mt-1" style={{ color: SCAN_TO }}>{positiveSignalCount}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
              <p className="text-[11px] text-stone-400 leading-tight truncate">{t("cosmetics.effectTrackedProductsLabel")}</p>
              <p className="text-[18px] font-bold mt-1 text-[#5C4F4A]">{productSignals.length}</p>
            </div>
          </div>
          {list.length > 0 && latestAnalysisResult && (
            <button
              onClick={() => setShowReportCard(true)}
              className="w-full mt-3 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-[13px] font-bold cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, color: "#FFFFFF" }}
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
          <div className="rounded-[20px] p-8 text-center" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
              <Droplets className="w-6 h-6" />
            </div>
            <p className="text-[14px] font-bold text-[#6B5D55] mb-1">{t("cosmetics.myEmpty")}</p>
            <p className="text-[12px] text-stone-400">{t("cosmetics.myEmptyDesc")}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {sections.map(({ key, title, accent, bg }) => (
                <div key={key} className="rounded-[20px] p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{title}</p>
                      <p className="text-xs text-stone-400">
                        {optimizing
                          ? t("cosmetics.routineOptimizing")
                          : routinePlan[key].length > 0
                          ? t("cosmetics.boardStepCount", { count: routinePlan[key].length })
                          : t(key === "am" ? "cosmetics.routineEmptyAm" : "cosmetics.routineEmptyPm")}
                      </p>
                    </div>
                    {!optimizing && routinePlan[key].length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: bg, color: accent }}>
                        {t("cosmetics.routineRepresentativeBadge")}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {routinePlan[key].map((item, index) => (
                      <button
                        key={`${key}-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="w-full rounded-2xl bg-white px-3.5 py-3 flex items-center gap-3 text-left"
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: accent }}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate" style={{ color: DEEP_GREEN }}>{t(`cosmetics.categories.${item.category}`)}</p>
                          <p className="text-xs text-stone-400 truncate">{item.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {productSignals.length > 0 && (
              <div className="rounded-[20px] p-4" style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.signalSectionTitle")}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{t("cosmetics.signalSectionDesc")}</p>
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
                  {(showAllSignals ? productSignals : productSignals.slice(0, 3)).map((signal) => {
                    const deltaValue = signal.topScoreDelta ?? signal.overallDelta ?? 0;
                    const positive = deltaValue >= 0;
                    return (
                    <div key={signal.itemId} className="rounded-2xl p-3" style={{ background: "#F8FAFD" }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold text-[#5C4F4A] truncate min-w-0">{signal.itemName}</p>
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
                      <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, Math.max(14, Math.abs(deltaValue) * 6))}%`,
                            background: positive ? DEEP_GREEN : SCAN_TO,
                          }}
                        />
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {routinePlan.conflicts.length > 0 && (
              <div className="rounded-[28px] border p-4" style={{ background: "#FFF8F0", borderColor: "#F7E1D1" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: SCAN_TO }}>{t("cosmetics.routineConflictTitle")}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{t("cosmetics.routineConflictDesc")}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {routinePlan.conflicts.map((conflict, index) => (
                    <div key={index} className="rounded-2xl bg-white p-3">
                      <p className="text-xs font-bold text-[#6B5D55] mb-0.5 line-clamp-2">{conflict.productNames.join(" + ")}</p>
                      <p className="text-xs text-stone-500">{conflict.reason}</p>
                      {conflict.resolution && <p className="text-xs mt-1 font-medium" style={{ color: DEEP_GREEN }}>{conflict.resolution}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[28px] border p-4 bg-white" style={{ borderColor: BORDER_COLOR }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.collectionTitle")}</p>
                  <p className="text-xs text-stone-400">{t("cosmetics.collectionSub")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {list.map((item) => {
                  const signal = productSignals.find((entry) => entry.itemId === item.id) || null;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="rounded-3xl p-3 bg-stone-50 text-left"
                      style={{ border: `1px solid ${BORDER_COLOR}` }}
                    >
                      {item.image_thumbnail ? (
                        <img src={item.image_thumbnail} alt={item.name ?? ""} className="w-full h-28 rounded-2xl object-cover bg-stone-200" loading="lazy" />
                      ) : (
                        <div className="w-full h-28 rounded-2xl bg-stone-100 flex items-center justify-center">
                          <Droplets className="w-7 h-7 text-stone-400" />
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-[#5C4F4A] truncate">{item.name}</p>
                        <p className="text-xs text-stone-400 truncate">{item.brand || t("cosmetics.noBrand")}</p>
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
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </div>
              <div className="flex items-start gap-3">
                {selectedItem.image_thumbnail ? (
                  <img src={selectedItem.image_thumbnail} alt={selectedItem.name ?? ""} className="w-20 h-20 rounded-3xl object-cover bg-stone-100 shrink-0" loading="lazy" />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center shrink-0">
                    <Droplets className="w-8 h-8 text-stone-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[#5C4F4A] text-kr-pretty">{selectedItem.name}</p>
                  <p className="text-[12px] text-stone-400 mt-1">{selectedItem.brand || t("cosmetics.noBrand")}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                      {t(`cosmetics.categories.${selectedItem.category}`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <div className="rounded-2xl p-3" style={{ background: TINT_NEUTRAL }}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.openedLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>{selectedItem.opened_at || t("cosmetics.detailUnknown")}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.detailStatusLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: SCAN_TO }}>{t("cosmetics.detailStatusActive")}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl p-4 bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.ingredientsLabel")}</p>
                <p className="text-[12px] text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap text-kr-pretty">
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
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">{t("cosmetics.signalMetricLabel")}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>
                          {selectedSignal.topScoreIndex !== null ? t(`scores.${selectedSignal.topScoreIndex}`) : t("cosmetics.signalMetricFallback")}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">{t("cosmetics.signalObservedLabel")}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>
                          {t("cosmetics.signalObservedValue", { count: selectedSignal.afterCount, days: Math.min(selectedSignal.daysTracked, 14) })}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[12px] text-stone-500 mt-2 text-kr-pretty">{t("cosmetics.signalEmpty")}</p>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deletingId === selectedItem.id}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[13px] text-stone-600 bg-stone-50 disabled:opacity-40"
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
