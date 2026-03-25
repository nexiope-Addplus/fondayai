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

/* ─── i18n helper ──────────────────────────────────────────────────────────── */
function L(reportLang: string, ko: string, en: string, ja: string) {
  return reportLang === "ko" ? ko : reportLang === "ja" ? ja : en;
}

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

  /* ─── text maps (existing) ───────────────────────────────────────────────── */
  const reportDetailText =
    reportLang === "ko"
      ? {
          radarTitle: "피부 균형 스파이더 그래프",
          radarSub: "현재 상태와 누적 평균을 한 번에 비교합니다.",
          ingredientTrack: "성분 반응 추적",
          ingredientTrackSub:
            "화장품 개봉 이후 점수 흐름을 기준으로 성분 신호를 추렸습니다.",
          recoveryGuide: "시술 후 회복 가이드",
          seasonImpact: "계절/환경 영향 해석",
          triggerCorrelation: "트리거 상관관계",
          forecastTitle: "다음 2주 회복 예측",
          positiveFlow: "긍정 신호",
          cautionFlow: "주의 신호",
        }
      : reportLang === "ja"
        ? {
            radarTitle: "肌バランススパイダー",
            radarSub: "現在状態と累積平均を一目で比較します。",
            ingredientTrack: "成分反応トラッキング",
            ingredientTrackSub:
              "開封後のスコア変化から成分シグナルを抽出しました。",
            recoveryGuide: "施術後の回復ガイド",
            seasonImpact: "季節・環境影響の解釈",
            triggerCorrelation: "トリガー相関",
            forecastTitle: "今後2週間の回復予測",
            positiveFlow: "プラスシグナル",
            cautionFlow: "注意シグナル",
          }
        : {
            radarTitle: "Skin Balance Spider",
            radarSub:
              "Compare the current profile against your accumulated average.",
            ingredientTrack: "Ingredient response tracking",
            ingredientTrackSub:
              "Signals are estimated from score shifts after product opening dates.",
            recoveryGuide: "Post-procedure recovery guide",
            seasonImpact: "Season & environment interpretation",
            triggerCorrelation: "Trigger correlation",
            forecastTitle: "Next 2-week recovery forecast",
            positiveFlow: "Positive signals",
            cautionFlow: "Signals to watch",
          };

  const reportConsultText =
    reportLang === "ko"
      ? {
          brief: "Fonday AI 어드바이저 브리핑",
          briefSub:
            "최근 스캔과 일기 기록을 바탕으로 이번 주 피부 흐름을 정리했습니다.",
          insight: "Fonday AI 어드바이저 해석",
          priorities: "이번 주 우선 과제",
          causes: "원인 추정",
          consultantPlan: "Fonday AI 어드바이저 제안",
          routineAdjust: "루틴 조정 제안",
          lifestyle: "생활 변수 해석",
          procedureGuide: "시술 후 회복 가이드",
        }
      : reportLang === "ja"
        ? {
            brief: "Fonday AIアドバイザー要約",
            briefSub:
              "直近のスキャンと日記記録をもとに、今週の肌の流れを整理しました。",
            insight: "Fonday AIアドバイザー解釈",
            priorities: "今週の優先課題",
            causes: "原因推定",
            consultantPlan: "Fonday AIアドバイザー提案",
            routineAdjust: "ルーティン調整提案",
            lifestyle: "生活要因の解釈",
            procedureGuide: "施術後の回復ガイド",
          }
        : {
            brief: "Fonday AI Advisor Brief",
            briefSub:
              "This week is framed like a real skin consultation, using your recent scans and diary notes.",
            insight: "Fonday AI Advisor Interpretation",
            priorities: "Top priorities this week",
            causes: "Likely drivers",
            consultantPlan: "Fonday AI Advisor Recommendations",
            routineAdjust: "Routine adjustments",
            lifestyle: "Lifestyle interpretation",
            procedureGuide: "Post-procedure recovery guide",
          };

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
    reportLang === "ko"
      ? keyConcern === "redness"
        ? "민감 관리 우선"
        : keyConcern === "pigmentation"
          ? "색소 변동 주의"
          : keyConcern === "hydration"
            ? "장벽 회복 우선"
            : diaryReport.trendKey === "trendUp"
              ? "안정 회복 단계"
              : "집중 관리 구간"
      : reportLang === "ja"
        ? keyConcern === "redness"
          ? "敏感管理優先"
          : keyConcern === "pigmentation"
            ? "色素変動注意"
            : keyConcern === "hydration"
              ? "バリア回復優先"
              : diaryReport.trendKey === "trendUp"
                ? "安定回復段階"
                : "集中管理区間"
        : keyConcern === "redness"
          ? "Sensitivity first"
          : keyConcern === "pigmentation"
            ? "Pigment watch"
            : keyConcern === "hydration"
              ? "Barrier recovery first"
              : diaryReport.trendKey === "trendUp"
                ? "Stable recovery phase"
                : "Focused care phase";

  const consultantHeadline =
    reportLang === "ko"
      ? `${diaryReport.focusConcerns[0]?.titles.ko || "기초 컨디션"} 중심으로 흐름을 먼저 잡아야 하는 주간입니다.`
      : reportLang === "ja"
        ? `${diaryReport.focusConcerns[0]?.titles.ja || "基礎コンディション"}を軸に整える週です。`
        : `This week should center on stabilizing ${diaryReport.focusConcerns[0]?.titles.en || "your baseline condition"}.`;

  const causeEstimateItems = [
    diaryReport.triggerSignals[0]
      ? reportLang === "ko"
        ? `${diaryReport.triggerSignals[0].label}이 있는 날 이후 점수 변동폭이 ${Math.abs(diaryReport.triggerSignals[0].diff)}점 정도 벌어졌습니다.`
        : reportLang === "ja"
          ? `${diaryReport.triggerSignals[0].label}がある日にスコア変動が約${Math.abs(diaryReport.triggerSignals[0].diff)}点広がりました。`
          : `Score volatility widens by about ${Math.abs(diaryReport.triggerSignals[0].diff)} points on days tagged with ${diaryReport.triggerSignals[0].label}.`
      : "",
    weeklyReport.incompleteDays > 1
      ? reportLang === "ko"
        ? `루틴 체크가 끊긴 날이 ${weeklyReport.incompleteDays}일 있어 관리 일관성이 흔들렸습니다.`
        : reportLang === "ja"
          ? `ルーティン記録が途切れた日が${weeklyReport.incompleteDays}日あり、管理の一貫性が落ちました。`
          : `Routine adherence dropped on ${weeklyReport.incompleteDays} days, reducing consistency.`
      : "",
    diaryReport.topCauseTags[0]
      ? reportLang === "ko"
        ? `${diaryReport.topCauseTags[0]} 패턴이 반복되어 생활 변수 영향이 같이 보입니다.`
        : reportLang === "ja"
          ? `${diaryReport.topCauseTags[0]}パターンが繰り返され、生活要因の影響も見えます。`
          : `${diaryReport.topCauseTags[0]} keeps recurring, suggesting a lifestyle driver as well.`
      : "",
  ]
    .filter(Boolean)
    .slice(0, 3);

  const avoidMistakes = [
    ...routineGuide.cautions.slice(0, 2),
    reportLang === "ko"
      ? "좋아졌다고 바로 기능성 루틴 강도를 올리지 마세요."
      : reportLang === "ja"
        ? "少し良くなったからといってすぐに強い機能性ケアへ戻さないでください。"
        : "Do not jump back into stronger actives as soon as things start to look better.",
  ].slice(0, 3);

  const routineAdjustPlan = {
    keep: diaryReport.routineHighlights.strong,
    reduce: diaryReport.routineHighlights.watch,
    add: diaryReport.ingredientPlan[0]
      ? reportLang === "ko"
        ? `${diaryReport.ingredientPlan[0].name} 중심 루틴을 천천히 추가`
        : reportLang === "ja"
          ? `${diaryReport.ingredientPlan[0].name}中心のケアをゆっくり追加`
          : `Slowly add a ${diaryReport.ingredientPlan[0].name}-focused step`
      : diaryReport.copy.notEnough,
  };

  const lifestyleSupportItems = [
    analysisResult?.nutritionTips?.hydrationGoal || "",
    diaryReport.seasonGuide,
    reportLang === "ko"
      ? "수면과 자외선 노출 변수를 같이 관리하면 점수 변동폭을 줄이기 쉽습니다."
      : reportLang === "ja"
        ? "睡眠と紫外線の変数を一緒に整えるとスコア変動を抑えやすくなります。"
        : "Managing sleep and UV exposure together will usually reduce score volatility.",
  ]
    .filter(Boolean)
    .slice(0, 2);

  const closingComment =
    reportLang === "ko"
      ? "이번 주는 더 많이 하는 것보다, 흔들리지 않게 유지하는 것이 핵심입니다."
      : reportLang === "ja"
        ? "今週は増やすことより、ぶれずに維持することが重要です。"
        : "This week is less about doing more and more about staying steady.";

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
        style={{ background: TINT_WARM, border: `1px solid ${BORDER_COLOR}` }}
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
                {L(
                  reportLang,
                  "Fonday AI 어드바이저",
                  "Fonday AI Advisor",
                  "Fonday AIアドバイザー",
                )}
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
              {L(
                reportLang,
                "주간 피부 건강 등급",
                "Weekly Skin Health Grade",
                "週間肌健康グレード",
              )}
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
            {L(
              reportLang,
              "이번 주 피부 컨설팅",
              "This Week's Skin Consult",
              "今週の肌コンサルティング",
            )}
          </p>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed text-center text-kr-pretty">
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
            <p className="text-xs font-semibold text-stone-500">
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {L(
                reportLang,
                "주간 점수 트렌드",
                "Weekly Score Trend",
                "週間スコアトレンド",
              )}
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
                {L(reportLang, "vs 지난주", "vs last week", "vs 先週")}
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
                      border: `1px solid ${BORDER_COLOR}`,
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
                        value: L(
                          reportLang,
                          "지난주 평균",
                          "Last week avg",
                          "先週平均",
                        ),
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
                        value: L(
                          reportLang,
                          "이번주 평균",
                          "This week avg",
                          "今週平均",
                        ),
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {L(
                reportLang,
                "지난주 대비 변화",
                "Week-over-Week Change",
                "前週比の変化",
              )}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {scoreComparison.map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl p-3"
                  style={{ background: BG_MUTED }}
                >
                  <p className="text-xs font-semibold text-stone-500 truncate">
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
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
              <SectionLabel>{reportConsultText.insight}</SectionLabel>
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
              <p className="text-[13px] text-stone-600 mt-3 leading-relaxed text-kr-pretty">
                {diaryReport.executiveSummary}
              </p>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed text-kr-pretty">
                {diaryReport.routineDesc}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Cause Estimates ───────────────────────────────────────────────── */}
      <Card
        className="border-none rounded-3xl overflow-hidden"
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-4">
          <SectionLabel>{reportConsultText.causes}</SectionLabel>
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-4">
          <SectionLabel>{reportConsultText.priorities}</SectionLabel>
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-4">
          <SectionLabel>{reportDetailText.radarTitle}</SectionLabel>
          <p className="text-xs text-stone-500 mt-1">
            {reportDetailText.radarSub}
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
                  name={L(reportLang, "현재", "Current", "現在")}
                  dataKey="current"
                  stroke={SCAN_TO}
                  fill={SCAN_TO}
                  fillOpacity={0.22}
                  strokeWidth={2}
                />
                <Radar
                  name={L(reportLang, "누적 평균", "Average", "累積平均")}
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
          {L(reportLang, "핵심 관찰", "Key observations", "主要観察")}
        </p>
        {diaryReport.focusConcerns.map((concern: any) => (
          <Card
            key={concern.key}
            className="border-none rounded-3xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${BORDER_COLOR}`,
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
                  <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">
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
            border: `1px solid ${BORDER_COLOR}`,
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
                  {L(
                    reportLang,
                    "바우만 타입 × 계절 인사이트",
                    "Baumann Type × Seasonal Insight",
                    "バウマンタイプ × 季節インサイト",
                  )}
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-5">
            <SectionLabel>
              {L(
                reportLang,
                "오늘의 액션 플랜",
                "Today's Action Plan",
                "今日のアクションプラン",
              )}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Morning */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                  <p className="text-xs font-bold" style={{ color: DEEP_GREEN }}>
                    {L(reportLang, "모닝", "Morning", "モーニング")}
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
                    {L(reportLang, "이브닝", "Evening", "イブニング")}
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>{diaryReport.copy.ingredients}</SectionLabel>
            <p className="text-xs text-stone-500 mt-1 text-kr-pretty">
              {L(
                reportLang,
                "Fonday AI 어드바이저가 우선 추천하는 성분 처방입니다.",
                "Top ingredient prescriptions the AI Advisor would prioritize.",
                "Fonday AIアドバイザーが優先して勧める成分処方です。",
              )}
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
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/80 text-stone-500">
                      {item.concern}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>{diaryReport.copy.procedures}</SectionLabel>
            <p className="text-xs text-stone-500 mt-1 text-kr-pretty">
              {L(
                reportLang,
                "시술이 필요하다면 먼저 검토할 만한 방향입니다.",
                "If procedures are on the table, these are worth discussing first.",
                "施術を考えるなら先に相談しやすい方向です。",
              )}
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
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-3 leading-relaxed">
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
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <CardContent className="p-4">
            <SectionLabel>
              {L(
                reportLang,
                "성분 반응 추적",
                reportDetailText.ingredientTrack,
                reportDetailText.ingredientTrack,
              )}
            </SectionLabel>
            <p className="text-xs text-stone-500 mt-1">
              {reportDetailText.ingredientTrackSub}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.ingredientSignals.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                      {reportDetailText.positiveFlow}
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
                      {reportDetailText.cautionFlow}
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
              border: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <CardContent className="p-4">
              <SectionLabel>{diaryReport.copy.cosmeticsSignal}</SectionLabel>
              <p className="text-[12px] text-stone-600 mt-2 leading-relaxed text-kr-pretty">
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
              border: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <CardContent className="p-4">
              <SectionLabel>{reportConsultText.procedureGuide}</SectionLabel>
              <div className="space-y-3 mt-3">
                {diaryReport.recoveryGuide.map((item: string) => (
                  <div
                    key={item}
                    className="rounded-2xl p-3"
                    style={{ background: TINT_NEUTRAL }}
                  >
                    <p className="text-[12px] text-stone-600 leading-relaxed">
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-4">
          <SectionLabel>{reportConsultText.routineAdjust}</SectionLabel>

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
                {L(reportLang, "유지", "Keep", "維持")}
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
                {L(reportLang, "줄이기", "Reduce", "減らす")}
              </p>
              <p className="text-[12px] font-semibold mt-2 text-[#6B5D55] text-kr-pretty">
                {routineAdjustPlan.reduce}
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#F6F4FB" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
                {L(reportLang, "추가", "Add", "追加")}
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-4">
          <SectionLabel>{reportConsultText.lifestyle}</SectionLabel>

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
                <p className="text-[12px] text-stone-600 leading-relaxed text-kr-pretty">
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
              {reportDetailText.triggerCorrelation}
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
              {L(
                reportLang,
                "피해야 할 실수",
                "Avoid This Week",
                "避けたいミス",
              )}
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
          border: `1px solid ${BORDER_COLOR}`,
        }}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            <SectionLabel>{reportDetailText.forecastTitle}</SectionLabel>
          </div>
          <p className="text-[13px] text-stone-600 mt-3 leading-relaxed text-kr-pretty">
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
            border: `1px solid ${BORDER_COLOR}`,
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
                  {L(
                    reportLang,
                    "다음 스캔 추천",
                    "Next Scan Recommendation",
                    "次回スキャン推奨",
                  )}
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
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        <CardContent className="p-5">
          <SectionLabel>
            {L(
              reportLang,
              "마무리 코멘트",
              "Closing note",
              "締めコメント",
            )}
          </SectionLabel>
          <p className="text-[13px] text-[#6B5D55] mt-3 leading-relaxed text-kr-pretty">
            {closingComment}
          </p>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: BORDER_COLOR }}>
            <p className="text-[11px] text-stone-400 text-center">
              {L(
                reportLang,
                "Fonday AI 어드바이저 리포트",
                "Fonday AI Advisor Report",
                "Fonday AIアドバイザーレポート",
              )}{" "}
              — {diaryReport.periodLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
