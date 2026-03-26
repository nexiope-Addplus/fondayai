import React from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  Shield,
  Sparkles,
  Target,
  Leaf,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResult } from "./types";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
  BORDER_COLOR,
  FONT_DISPLAY,
  TEXT_TERTIARY,
  BG_MUTED,
} from "./constants";

type DiaryReportTabProps = {
  diaryReport: any;
  reportLang: string;
  routineGuide: any;
  weeklyReport: any;
  analysisResult: AnalysisResult | null;
};

/* ─── Section wrapper ──────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-[0.14em]"
      style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}
    >
      {children}
    </p>
  );
}

export function DiaryReportTab({
  diaryReport,
  reportLang,
  routineGuide,
  weeklyReport,
  analysisResult,
}: DiaryReportTabProps) {
  const { t } = useTranslation();

  /* ─── derived data (existing) ────────────────────────────────────────────── */
  const consultantActionItems = [
    diaryReport.routineHighlights.strong,
    diaryReport.ingredientPlan[0]?.reason || diaryReport.copy.notEnough,
    diaryReport.triggerSignals[0]
      ? `${diaryReport.triggerSignals[0].label} ${diaryReport.triggerSignals[0].diff > 0 ? `+${diaryReport.triggerSignals[0].diff}` : diaryReport.triggerSignals[0].diff}`
      : diaryReport.seasonGuide,
  ]
    .filter(Boolean)
    .slice(0, 3);

  const keyConcern = diaryReport.focusConcerns[0]?.key;
  const reportStatusLabel =
    keyConcern === "redness"
      ? t("diaryReport.statusRedness")
      : keyConcern === "pigmentation"
        ? t("diaryReport.statusPigmentation")
        : keyConcern === "hydration"
          ? t("diaryReport.statusHydration")
          : diaryReport.trendKey === "trendUp"
            ? t("diaryReport.statusTrendUp")
            : t("diaryReport.statusDefault");

  const headlineConcern =
    diaryReport.focusConcerns[0]?.titles[reportLang] ||
    t("diaryReport.headlineDefault");
  const consultantHeadline =
    reportLang === "ko"
      ? `${headlineConcern}${t("diaryReport.headlineSuffix")}`
      : t("diaryReport.headlineSuffix", { concern: headlineConcern });

  const causeEstimateItems = [
    diaryReport.triggerSignals[0]
      ? t("diaryReport.causesTriggerScore", {
          label: diaryReport.triggerSignals[0].label,
          diff: Math.abs(diaryReport.triggerSignals[0].diff),
        })
      : "",
    weeklyReport.incompleteDays > 1
      ? t("diaryReport.causesRoutineDrop", {
          days: weeklyReport.incompleteDays,
        })
      : "",
    diaryReport.topCauseTags[0]
      ? t("diaryReport.causesLifestyle", {
          tag: diaryReport.topCauseTags[0],
        })
      : "",
  ]
    .filter(Boolean)
    .slice(0, 3);

  const avoidMistakes = [
    ...routineGuide.cautions.slice(0, 2),
    t("diaryReport.avoidMistake"),
  ].slice(0, 3);

  const routineAdjustPlan = {
    keep: diaryReport.routineHighlights.strong,
    reduce: diaryReport.routineHighlights.watch,
    add: diaryReport.ingredientPlan[0]
      ? t("diaryReport.routineAddSuffix", {
          name: diaryReport.ingredientPlan[0].name,
        })
      : diaryReport.copy.notEnough,
  };

  const lifestyleSupportItems = [
    analysisResult?.nutritionTips?.hydrationGoal || "",
    diaryReport.seasonGuide,
    t("diaryReport.lifestyleSleep"),
  ]
    .filter(Boolean)
    .slice(0, 2);

  const closingComment = t("diaryReport.closingComment");

  /* ─── NEW data fields (safe access) ──────────────────────────────────────── */
  const dailyTrend: { date: string; score: number | null }[] =
    diaryReport.dailyTrend || [];
  const scoreComparison: {
    label: string;
    thisWeek: number;
    lastWeek: number;
    delta: number | null;
  }[] = (diaryReport.scoreComparison || []).slice(0, 6);
  const weeklyGrade: { grade: string; color: string; bg: string } =
    diaryReport.weeklyGrade || { grade: "-", color: DEEP_GREEN, bg: TINT_GREEN };
  const baumannSeasonInsight: string[] =
    diaryReport.baumannSeasonInsight || [];
  const dailyActionPlan: { morning: string[]; evening: string[] } =
    diaryReport.dailyActionPlan || { morning: [], evening: [] };
  const nextScanRecommendation: string =
    diaryReport.nextScanRecommendation || "";
  const trendDelta: number = diaryReport.trendDelta ?? 0;
  const recentMean: number = diaryReport.recentMean ?? 0;
  const previousMean: number = diaryReport.previousMean ?? 0;
  const finalType: string = diaryReport.finalType || "";

  /* ─── chart data: fill gaps ──────────────────────────────────────────────── */
  const chartData = dailyTrend.map((d) => ({
    date: d.date.slice(5), // "03-21"
    score: d.score,
  }));

  return (
    <div className="px-5 pt-4 pb-8 space-y-4">
      {/* ════════════════════════════════════════════════════════════════════════
          1. PREMIUM HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: TINT_WARM, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-5">
          {/* Branding + Grade */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
              <p
                className="text-xs font-semibold tracking-[0.16em] uppercase"
                style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}
              >
                {t("diaryReport.fondayAdvisor")}
              </p>
            </div>
            {finalType && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: `${DEEP_GREEN}14`, color: DEEP_GREEN }}
              >
                {finalType}
              </span>
            )}
          </div>

          {/* Weekly Grade — large */}
          <div className="flex flex-col items-center mt-4">
            <p className="text-xs font-semibold text-stone-400">
              {t("diaryReport.weeklyGradeLabel")}
            </p>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mt-2"
              style={{ background: weeklyGrade.bg }}
            >
              <span
                className="text-[36px] font-bold"
                style={{ fontFamily: FONT_DISPLAY, color: weeklyGrade.color }}
              >
                {weeklyGrade.grade}
              </span>
            </div>
          </div>

          {/* Title + headline */}
          <p
            className="text-[20px] font-normal mt-4 text-center text-kr-pretty"
            style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}
          >
            {t("diaryReport.thisWeekConsult")}
          </p>
          <p className="text-xs text-[#8C8078] mt-1 leading-relaxed text-center text-kr-pretty">
            {consultantHeadline}
          </p>

          {/* Status badge */}
          <div className="mt-3 flex justify-center">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "#FFFFFF", color: SCAN_TO }}
            >
              {reportStatusLabel}
            </span>
          </div>

          {/* Period + Stats grid */}
          <div className="mt-4 text-center">
            <p className="text-xs font-semibold text-[#8C8078]">
              {diaryReport.copy.period}
            </p>
            <p
              className="text-sm font-semibold mt-0.5"
              style={{ color: DEEP_GREEN }}
            >
              {diaryReport.periodLabel}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#FFFFFF" }}
            >
              <p className="text-xs font-semibold text-stone-400">
                {diaryReport.copy.scans}
              </p>
              <p
                className="text-[20px] font-normal mt-1"
                style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}
              >
                {diaryReport.scanCount}
              </p>
            </div>
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#FFFFFF" }}
            >
              <p className="text-xs font-semibold text-stone-400">
                {diaryReport.copy.diary}
              </p>
              <p
                className="text-[20px] font-normal mt-1"
                style={{ fontFamily: FONT_DISPLAY, color: SCAN_TO }}
              >
                {diaryReport.memoCount}
              </p>
            </div>
            <div
              className="rounded-2xl p-3 text-center"
              style={{ background: "#FFFFFF" }}
            >
              <p className="text-xs font-semibold text-stone-400">
                {diaryReport.copy.adherence}
              </p>
              <p
                className="text-[20px] font-normal mt-1"
                style={{ fontFamily: FONT_DISPLAY, color: "#0F766E" }}
              >
                {diaryReport.adherence}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          2. WEEKLY SCORE TREND CHART
      ═══════════════════════════════════════════════════════════════════════ */}
      {dailyTrend.length > 0 && (
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {t("diaryReport.weeklyScoreTrend")}
            </SectionLabel>
            <div className="flex items-center gap-2 mt-1">
              {trendDelta >= 0 ? (
                <TrendingUp className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              ) : (
                <TrendingDown className="w-4 h-4" style={{ color: SCAN_TO }} />
              )}
              <span
                className="text-sm font-semibold"
                style={{ color: trendDelta >= 0 ? DEEP_GREEN : SCAN_TO }}
              >
                {trendDelta > 0 ? "+" : ""}
                {trendDelta}
              </span>
              <span className="text-xs text-stone-400">
                {t("diaryReport.vsLastWeek")}
              </span>
            </div>

            <div className="w-full h-52 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9C9488", fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#B0A898", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  {previousMean > 0 && (
                    <ReferenceLine
                      y={previousMean}
                      stroke={TEXT_TERTIARY}
                      strokeDasharray="4 4"
                      label={{
                        value: t("diaryReport.lastWeekAvg"),
                        fill: TEXT_TERTIARY,
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                  )}
                  {recentMean > 0 && (
                    <ReferenceLine
                      y={recentMean}
                      stroke={DEEP_GREEN}
                      strokeDasharray="4 4"
                      label={{
                        value: t("diaryReport.thisWeekAvg"),
                        fill: DEEP_GREEN,
                        fontSize: 11,
                        position: "insideBottomRight",
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={SCAN_TO}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: SCAN_TO, stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                    activeDot={{ r: 6, fill: SCAN_TO }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          3. THIS WEEK vs LAST WEEK COMPARISON
      ═══════════════════════════════════════════════════════════════════════ */}
      {scoreComparison.length > 0 && (
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {t("diaryReport.weekOverWeekChange")}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {scoreComparison.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl p-3"
                  style={{ background: BG_MUTED }}
                >
                  <p className="text-xs font-semibold text-[#8C8078] truncate">
                    {m.label}
                  </p>
                  <div className="flex items-end justify-between mt-1.5">
                    <p
                      className="text-[20px] font-normal"
                      style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}
                    >
                      {m.thisWeek}
                    </p>
                    {m.delta != null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            m.delta >= 0 ? `${DEEP_GREEN}14` : `${SCAN_TO}14`,
                          color: m.delta >= 0 ? DEEP_GREEN : SCAN_TO,
                        }}
                      >
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          4. FONDAY AI ADVISOR INTERPRETATION
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: TINT_WARM }}
            >
              <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
            </div>
            <div className="min-w-0">
              <SectionLabel>{t("diaryReport.insight")}</SectionLabel>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p
                  className="text-base font-semibold text-kr-pretty"
                  style={{ color: DEEP_GREEN }}
                >
                  {diaryReport.copy[diaryReport.trendKey]}
                </p>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: `${SCAN_FROM}18`,
                    color: SCAN_TO,
                  }}
                >
                  {diaryReport.trendDesc}
                </span>
              </div>
              <p className="text-[13px] text-[#8C8078] mt-3 leading-relaxed text-kr-pretty">
                {diaryReport.executiveSummary}
              </p>
              <p className="text-xs text-[#8C8078] mt-2 leading-relaxed text-kr-pretty">
                {diaryReport.routineDesc}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Cause Estimates ───────────────────────────────────────────────── */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-4">
          <SectionLabel>{t("diaryReport.causes")}</SectionLabel>
          <div className="space-y-2.5 mt-3">
            {causeEstimateItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl p-3 flex items-start gap-3"
                style={{ background: "#F8F5F2" }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-normal"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    background: "#FFFFFF",
                    color: SCAN_TO,
                  }}
                >
                  {index + 1}
                </div>
                <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Priorities ────────────────────────────────────────────────────── */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-4">
          <SectionLabel>{t("diaryReport.priorities")}</SectionLabel>
          <div className="space-y-2.5 mt-3">
            {consultantActionItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl p-3 flex items-start gap-3"
                style={{
                  background:
                    index === 0
                      ? TINT_WARM
                      : index === 1
                        ? TINT_GREEN
                        : "#F6F4FB",
                }}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-normal"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    background: "#FFFFFF",
                    color:
                      index === 0
                        ? SCAN_TO
                        : index === 1
                          ? DEEP_GREEN
                          : "#7C3AED",
                  }}
                >
                  {index + 1}
                </div>
                <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          5. KEY CONCERNS — Radar + Cards
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-4">
          <SectionLabel>{t("diaryReport.radarTitle")}</SectionLabel>
          <p className="text-xs text-[#8C8078] mt-1">
            {t("diaryReport.radarSub")}
          </p>
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="68%"
                data={diaryReport.radarData}
              >
                <PolarGrid stroke="#E7E1DA" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#7C6F63", fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name={t("diaryReport.radarCurrent")}
                  dataKey="current"
                  stroke={SCAN_TO}
                  fill={SCAN_TO}
                  fillOpacity={0.22}
                  strokeWidth={2}
                />
                <Radar
                  name={t("diaryReport.radarAverage")}
                  dataKey="average"
                  stroke={DEEP_GREEN}
                  fill={DEEP_GREEN}
                  fillOpacity={0.38}
                  strokeWidth={2}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#444",
                    paddingTop: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── Concern cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em] px-1"
          style={{ color: SCAN_TO }}
        >
          {t("diaryReport.keyObservations")}
        </p>
        {diaryReport.focusConcerns.map((concern: any) => (
          <Card
            key={concern.key}
            className="border-none rounded-3xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[15px] font-semibold text-kr-pretty"
                    style={{ color: concern.accent }}
                  >
                    {concern.titles[reportLang]}
                  </p>
                  <p className="text-[12px] text-[#8C8078] mt-1 leading-relaxed">
                    {concern.summaries[reportLang]}
                  </p>
                </div>
                <div
                  className="rounded-2xl px-3 py-2 shrink-0 text-right"
                  style={{
                    background: `${concern.accent}12`,
                    border: `1px solid ${concern.accent}20`,
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: concern.accent,
                    }}
                  >
                    {diaryReport.copy.avgRisk}
                  </p>
                  <p
                    className="text-[20px] font-normal leading-none mt-1"
                    style={{
                      fontFamily: FONT_DISPLAY,
                      color: concern.accent,
                    }}
                  >
                    {concern.avgRisk}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, concern.avgRisk)}%`,
                    background: concern.accent,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          6. BAUMANN TYPE SEASONAL INSIGHT
      ═══════════════════════════════════════════════════════════════════════ */}
      {baumannSeasonInsight.length > 0 && (
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${TINT_GREEN} 0%, ${TINT_WARM} 100%)`,
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "#FFFFFF" }}
              >
                <Leaf className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              </div>
              <div>
                <SectionLabel>
                  {t("diaryReport.baumannSeasonInsight")}
                </SectionLabel>
                {finalType && (
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${DEEP_GREEN}14`, color: DEEP_GREEN }}
                  >
                    {finalType}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2.5 mt-4">
              {baumannSeasonInsight.map((tip, i) => (
                <div
                  key={`bs-${i}`}
                  className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: "rgba(255,255,255,0.75)" }}
                >
                  <Shield
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: DEEP_GREEN }}
                  />
                  <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          7. TODAY'S ACTION PLAN
      ═══════════════════════════════════════════════════════════════════════ */}
      {(dailyActionPlan.morning.length > 0 ||
        dailyActionPlan.evening.length > 0) && (
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {t("diaryReport.todayActionPlan")}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Morning */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                  <p className="text-xs font-bold" style={{ color: DEEP_GREEN }}>
                    {t("diaryReport.morning")}
                  </p>
                </div>
                {dailyActionPlan.morning.map((step, i) => (
                  <div
                    key={`am-${i}`}
                    className="rounded-2xl p-2.5 flex items-start gap-2"
                    style={{ background: TINT_GREEN }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                      style={{ background: DEEP_GREEN, color: "#fff" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              {/* Evening */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4" style={{ color: SCAN_TO }} />
                  <p className="text-xs font-bold" style={{ color: SCAN_TO }}>
                    {t("diaryReport.evening")}
                  </p>
                </div>
                {dailyActionPlan.evening.map((step, i) => (
                  <div
                    key={`pm-${i}`}
                    className="rounded-2xl p-2.5 flex items-start gap-2"
                    style={{ background: TINT_WARM }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                      style={{ background: SCAN_TO, color: "#fff" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          8. INGREDIENT PRESCRIPTION + PROCEDURE RECOMMENDATIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>{diaryReport.copy.ingredients}</SectionLabel>
            <p className="text-xs text-[#8C8078] mt-1 text-kr-pretty">
              {t("diaryReport.ingredientPrescriptionSub")}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.ingredientPlan.map((item: any) => (
                <div
                  key={item.name}
                  className="rounded-2xl p-3"
                  style={{ background: `${item.accent}10` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: item.accent }}
                    >
                      {item.name}
                    </p>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/80 text-[#8C8078]">
                      {item.concern}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8078] mt-2 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>{diaryReport.copy.procedures}</SectionLabel>
            <p className="text-xs text-[#8C8078] mt-1 text-kr-pretty">
              {t("diaryReport.procedurePlanSub")}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.procedurePlan.map((item: any) => (
                <div
                  key={item.name}
                  className="rounded-2xl p-3 border"
                  style={{
                    borderColor: `${item.accent}20`,
                    background: "#FFFFFF",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: DEEP_GREEN }}
                    >
                      {item.name}
                    </p>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: `${item.accent}12`,
                        color: item.accent,
                      }}
                    >
                      {diaryReport.copy.recommended}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8078] mt-2 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8C8078] mt-3 leading-relaxed">
              {diaryReport.copy.procedureNote}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          9. INGREDIENT RESPONSE TRACKING + COSMETICS SIGNAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>
              {t("diaryReport.ingredientTrack")}
            </SectionLabel>
            <p className="text-xs text-[#8C8078] mt-1">
              {t("diaryReport.ingredientTrackSub")}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.ingredientSignals.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                      {t("diaryReport.positiveFlow")}
                    </p>
                    <div className="space-y-3 mt-2">
                      {diaryReport.ingredientSignals
                        .filter((item: any) => item.delta >= 0)
                        .slice(0, 3)
                        .map((item: any) => (
                          <div
                            key={`good-${item.ingredient}`}
                            className="rounded-[16px] p-3"
                            style={{ background: TINT_GREEN }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-emerald-700">
                                {item.ingredient}
                              </p>
                              <span className="text-xs font-semibold text-emerald-600">
                                +{item.delta}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{
                        fontFamily: FONT_DISPLAY,
                        color: TEXT_TERTIARY,
                      }}
                    >
                      {t("diaryReport.cautionFlow")}
                    </p>
                    <div className="space-y-3 mt-2">
                      {diaryReport.ingredientSignals
                        .filter((item: any) => item.delta < 0)
                        .slice(0, 3)
                        .map((item: any) => (
                          <div
                            key={`bad-${item.ingredient}`}
                            className="rounded-[16px] p-3"
                            style={{ background: TINT_WARM }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="text-sm font-semibold"
                                style={{ color: SCAN_TO }}
                              >
                                {item.ingredient}
                              </p>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: SCAN_TO }}
                              >
                                {item.delta}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-stone-400 py-8 text-center">
                  {diaryReport.copy.notEnough}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cosmetics Signal + Recovery Guide */}
        <div className="space-y-3">
          <Card
            className="border-none rounded-3xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent className="p-4">
              <SectionLabel>{diaryReport.copy.cosmeticsSignal}</SectionLabel>
              <p className="text-[12px] text-[#8C8078] mt-2 leading-relaxed text-kr-pretty">
                {diaryReport.cosmeticsSignal}
              </p>
              {routineGuide.cautions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {routineGuide.cautions.slice(0, 2).map((item: string) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: TINT_WARM, color: SCAN_TO }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-none rounded-3xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}
          >
            <CardContent className="p-4">
              <SectionLabel>{t("diaryReport.procedureGuide")}</SectionLabel>
              <div className="space-y-3 mt-3">
                {diaryReport.recoveryGuide.map((item: string) => (
                  <div
                    key={item}
                    className="rounded-2xl p-3"
                    style={{ background: TINT_NEUTRAL }}
                  >
                    <p className="text-[12px] text-[#8C8078] leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          10. ROUTINE ADJUSTMENT (Keep / Reduce / Add)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-4">
          <SectionLabel>{t("diaryReport.routineAdjust")}</SectionLabel>

          {/* Memo signals + Cause tags */}
          <div className="grid gap-3 mt-3 md:grid-cols-2">
            <div className="rounded-3xl p-4" style={{ background: TINT_WARM }}>
              <p
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}
              >
                {diaryReport.copy.memoSignals}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(diaryReport.keywordSummary.length > 0
                  ? diaryReport.keywordSummary
                  : [diaryReport.copy.notEnough]
                ).map((item: string) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#FFFFFF", color: SCAN_TO }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: "#F5F3FF" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
                {diaryReport.copy.causeSignals}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(diaryReport.topCauseTags.length > 0
                  ? diaryReport.topCauseTags
                  : [diaryReport.copy.notEnough]
                ).map((item: string) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "#FFFFFF", color: "#7C3AED" }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Keep / Reduce / Add */}
          <div className="grid gap-3 mt-3 md:grid-cols-3">
            <div className="rounded-2xl p-3" style={{ background: TINT_GREEN }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                {t("diaryReport.keep")}
              </p>
              <p className="text-[12px] font-semibold mt-2 text-[#6B5D55] text-kr-pretty">
                {routineAdjustPlan.keep}
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
              <p
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}
              >
                {t("diaryReport.reduce")}
              </p>
              <p className="text-[12px] font-semibold mt-2 text-[#6B5D55] text-kr-pretty">
                {routineAdjustPlan.reduce}
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#F6F4FB" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
                {t("diaryReport.add")}
              </p>
              <p className="text-[12px] font-semibold mt-2 text-[#6B5D55] text-kr-pretty">
                {routineAdjustPlan.add}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          11. LIFESTYLE & TRIGGERS
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-4">
          <SectionLabel>{t("diaryReport.lifestyle")}</SectionLabel>

          {/* Lifestyle support items */}
          <div className="space-y-2.5 mt-3">
            {lifestyleSupportItems.map((item, index) => (
              <div
                key={`ls-${index}`}
                className="rounded-2xl p-3"
                style={{
                  background: index === 0 ? "#F5F9FF" : TINT_NEUTRAL,
                }}
              >
                <p className="text-[12px] text-[#8C8078] leading-relaxed text-kr-pretty">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Trigger signals */}
          <div className="mt-4">
            <p
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: SCAN_TO }}
            >
              {t("diaryReport.triggerCorrelation")}
            </p>
            <div className="space-y-2.5 mt-2">
              {diaryReport.triggerSignals.length > 0 ? (
                diaryReport.triggerSignals.map((item: any) => (
                  <div
                    key={item.tag}
                    className="rounded-2xl p-3"
                    style={{
                      background: item.diff <= 0 ? TINT_WARM : TINT_GREEN,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: item.diff <= 0 ? SCAN_TO : "#059669",
                        }}
                      >
                        {item.label}
                      </p>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: item.diff <= 0 ? SCAN_TO : "#059669",
                        }}
                      >
                        {item.diff > 0 ? `+${item.diff}` : item.diff}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-stone-400 py-4 text-center">
                  {diaryReport.copy.notEnough}
                </p>
              )}
            </div>
          </div>

          {/* Avoid mistakes */}
          <div className="mt-4">
            <p
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: "#C2410C" }}
            >
              {t("diaryReport.avoidThisWeek")}
            </p>
            <div className="space-y-2.5 mt-2">
              {avoidMistakes.map((item, index) => (
                <div
                  key={`av-${index}`}
                  className="rounded-2xl p-3 flex items-start gap-3"
                  style={{ background: "#FFF7ED" }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: "#C2410C" }}
                  />
                  <p className="text-[12px] text-[#6B5D55] leading-relaxed text-kr-pretty">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          12. 2-WEEK RECOVERY FORECAST
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{
          background: TINT_GREEN,
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        }}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            <SectionLabel>{t("diaryReport.forecastTitle")}</SectionLabel>
          </div>
          <p className="text-[13px] text-[#8C8078] mt-3 leading-relaxed text-kr-pretty">
            {diaryReport.forecast.note}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl p-4" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-semibold text-stone-400">WEEK 1</p>
              <p
                className="text-[28px] font-normal mt-1"
                style={{ fontFamily: FONT_DISPLAY, color: SCAN_TO }}
              >
                {diaryReport.forecast.week1}
              </p>
              <div
                className="h-1.5 rounded-full mt-2"
                style={{ background: `${SCAN_TO}20` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Number(String(diaryReport.forecast.week1).replace(/[^0-9]/g, "")) || 50)}%`,
                    background: SCAN_TO,
                  }}
                />
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-semibold text-stone-400">WEEK 2</p>
              <p
                className="text-[28px] font-normal mt-1"
                style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}
              >
                {diaryReport.forecast.week2}
              </p>
              <div
                className="h-1.5 rounded-full mt-2"
                style={{ background: `${DEEP_GREEN}20` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Number(String(diaryReport.forecast.week2).replace(/[^0-9]/g, "")) || 60)}%`,
                    background: DEEP_GREEN,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          13. NEXT SCAN RECOMMENDATION
      ═══════════════════════════════════════════════════════════════════════ */}
      {nextScanRecommendation && (
        <Card
          className="border-none rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${TINT_WARM} 0%, #FFFFFF 100%)`,
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${SCAN_TO}14` }}
              >
                <Camera className="w-5 h-5" style={{ color: SCAN_TO }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                  {t("diaryReport.nextScanRecommendation")}
                </p>
                <p className="text-[13px] text-[#6B5D55] mt-1 leading-relaxed text-kr-pretty">
                  {nextScanRecommendation}
                </p>
              </div>
              <ChevronRight
                className="w-5 h-5 shrink-0"
                style={{ color: TEXT_TERTIARY }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          14. CLOSING NOTE
      ═══════════════════════════════════════════════════════════════════════ */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <CardContent className="p-5">
          <SectionLabel>
            {t("diaryReport.closingNote")}
          </SectionLabel>
          <p className="text-[13px] text-[#6B5D55] mt-3 leading-relaxed text-kr-pretty">
            {closingComment}
          </p>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: BORDER_COLOR }}>
            <p className="text-[11px] text-stone-400 text-center">
              {t("diaryReport.fondayAdvisorReport")}{" "}
              — {diaryReport.periodLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
