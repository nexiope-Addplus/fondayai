import React from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
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
} from "./constants";

type DiaryReportTabProps = {
  diaryReport: any;
  reportLang: string;
  routineGuide: any;
  weeklyReport: any;
  analysisResult: AnalysisResult | null;
};

export function DiaryReportTab({ diaryReport, reportLang, routineGuide, weeklyReport, analysisResult }: DiaryReportTabProps) {
  const { t } = useTranslation();

  const reportDetailText = reportLang === "ko"
    ? {
        radarTitle: "피부 균형 스파이더 그래프",
        radarSub: "현재 상태와 누적 평균을 한 번에 비교합니다.",
        ingredientTrack: "성분 반응 추적",
        ingredientTrackSub: "화장품 개봉 이후 점수 흐름을 기준으로 성분 신호를 추렸습니다.",
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
          ingredientTrackSub: "開封後のスコア変化から成分シグナルを抽出しました。",
          recoveryGuide: "施術後の回復ガイド",
          seasonImpact: "季節・環境影響の解釈",
          triggerCorrelation: "トリガー相関",
          forecastTitle: "今後2週間の回復予測",
          positiveFlow: "プラスシグナル",
          cautionFlow: "注意シグナル",
        }
      : {
          radarTitle: "Skin Balance Spider",
          radarSub: "Compare the current profile against your accumulated average.",
          ingredientTrack: "Ingredient response tracking",
          ingredientTrackSub: "Signals are estimated from score shifts after product opening dates.",
          recoveryGuide: "Post-procedure recovery guide",
          seasonImpact: "Season & environment interpretation",
          triggerCorrelation: "Trigger correlation",
          forecastTitle: "Next 2-week recovery forecast",
          positiveFlow: "Positive signals",
          cautionFlow: "Signals to watch",
        };
  const reportConsultText = reportLang === "ko"
    ? {
        brief: "상담실장 브리핑",
        briefSub: "최근 스캔과 일기 기록을 바탕으로 이번 주 피부 흐름을 상담 메모처럼 정리했습니다.",
        insight: "상담실장 해석",
        priorities: "이번 주 우선 과제",
        causes: "원인 추정",
        consultantPlan: "상담실장 제안",
        routineAdjust: "루틴 조정 제안",
        lifestyle: "생활 변수 해석",
        procedureGuide: "시술 후 회복 가이드",
      }
    : reportLang === "ja"
      ? {
          brief: "カウンセリング要約",
          briefSub: "直近のスキャンと日記記録をもとに、今週の肌 흐름を相談メモのように整理しました。",
          insight: "カウンセラー解釈",
          priorities: "今週の優先課題",
          causes: "原因推定",
          consultantPlan: "カウンセラー提案",
          routineAdjust: "ルーティン調整提案",
          lifestyle: "生活要因の解釈",
          procedureGuide: "施術後の回復ガイド",
        }
      : {
          brief: "Consult Brief",
          briefSub: "This week is framed like a real skin consultation, using your recent scans and diary notes.",
          insight: "Consultant interpretation",
          priorities: "Top priorities this week",
          causes: "Likely drivers",
          consultantPlan: "Consultant recommendations",
          routineAdjust: "Routine adjustments",
          lifestyle: "Lifestyle interpretation",
          procedureGuide: "Post-procedure recovery guide",
        };
  const consultantActionItems = [
    diaryReport.routineHighlights.strong,
    diaryReport.ingredientPlan[0]?.reason || diaryReport.copy.notEnough,
    diaryReport.triggerSignals[0]
      ? `${diaryReport.triggerSignals[0].label} ${diaryReport.triggerSignals[0].diff > 0 ? `+${diaryReport.triggerSignals[0].diff}` : diaryReport.triggerSignals[0].diff}`
      : diaryReport.seasonGuide,
  ].filter(Boolean).slice(0, 3);
  const keyConcern = diaryReport.focusConcerns[0]?.key;
  const reportStatusLabel = reportLang === "ko"
    ? keyConcern === "redness" ? "민감 관리 우선"
      : keyConcern === "pigmentation" ? "색소 변동 주의"
      : keyConcern === "hydration" ? "장벽 회복 우선"
      : diaryReport.trendKey === "trendUp" ? "안정 회복 단계"
      : "집중 관리 구간"
    : reportLang === "ja"
      ? keyConcern === "redness" ? "敏感管理優先"
        : keyConcern === "pigmentation" ? "色素変動注意"
        : keyConcern === "hydration" ? "バリア回復優先"
        : diaryReport.trendKey === "trendUp" ? "安定回復段階"
        : "集中管理区間"
      : keyConcern === "redness" ? "Sensitivity first"
        : keyConcern === "pigmentation" ? "Pigment watch"
        : keyConcern === "hydration" ? "Barrier recovery first"
        : diaryReport.trendKey === "trendUp" ? "Stable recovery phase"
        : "Focused care phase";
  const consultantHeadline = reportLang === "ko"
    ? `${diaryReport.focusConcerns[0]?.titles.ko || "기초 컨디션"} 중심으로 흐름을 먼저 잡아야 하는 주간입니다.`
    : reportLang === "ja"
      ? `${diaryReport.focusConcerns[0]?.titles.ja || "基礎コンディション"}を軸に整える週です。`
      : `This week should center on stabilizing ${diaryReport.focusConcerns[0]?.titles.en || "your baseline condition"}.`;
  const causeEstimateItems = [
    diaryReport.triggerSignals[0]
      ? (reportLang === "ko"
          ? `${diaryReport.triggerSignals[0].label}이 있는 날 이후 점수 변동폭이 ${Math.abs(diaryReport.triggerSignals[0].diff)}점 정도 벌어졌습니다.`
          : reportLang === "ja"
            ? `${diaryReport.triggerSignals[0].label}がある日にスコア変動が約${Math.abs(diaryReport.triggerSignals[0].diff)}点広がりました。`
            : `Score volatility widens by about ${Math.abs(diaryReport.triggerSignals[0].diff)} points on days tagged with ${diaryReport.triggerSignals[0].label}.`)
      : "",
    weeklyReport.incompleteDays > 1
      ? (reportLang === "ko"
          ? `루틴 체크가 끊긴 날이 ${weeklyReport.incompleteDays}일 있어 관리 일관성이 흔들렸습니다.`
          : reportLang === "ja"
            ? `ルーティン記録が途切れた日が${weeklyReport.incompleteDays}日あり、管理の一貫性が落ちました。`
            : `Routine adherence dropped on ${weeklyReport.incompleteDays} days, reducing consistency.`)
      : "",
    diaryReport.topCauseTags[0]
      ? (reportLang === "ko"
          ? `${diaryReport.topCauseTags[0]} 패턴이 반복되어 생활 변수 영향이 같이 보입니다.`
          : reportLang === "ja"
            ? `${diaryReport.topCauseTags[0]}パターンが繰り返され、生活要因の影響も見えます。`
            : `${diaryReport.topCauseTags[0]} keeps recurring, suggesting a lifestyle driver as well.`)
      : "",
  ].filter(Boolean).slice(0, 3);
  const avoidMistakes = [
    ...(routineGuide.cautions.slice(0, 2)),
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
      ? (reportLang === "ko"
          ? `${diaryReport.ingredientPlan[0].name} 중심 루틴을 천천히 추가`
          : reportLang === "ja"
            ? `${diaryReport.ingredientPlan[0].name}中心のケアをゆっくり追加`
            : `Slowly add a ${diaryReport.ingredientPlan[0].name}-focused step`)
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
  ].filter(Boolean).slice(0, 2);
  const closingComment = reportLang === "ko"
    ? "이번 주는 더 많이 하는 것보다, 흔들리지 않게 유지하는 것이 핵심입니다."
    : reportLang === "ja"
      ? "今週は増やすことより、ぶれずに維持することが重要です。"
      : "This week is less about doing more and more about staying steady.";

  return (
    <div className="px-5 pt-4 pb-8 space-y-4">
      <Card className="border-none rounded-3xl overflow-hidden shadow-sm"
        style={{ background: TINT_WARM }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>
                {reportConsultText.brief}
              </p>
              <p className="text-[20px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                {reportLang === "ko" ? "이번 주 피부 컨설팅" : reportLang === "ja" ? "今週の肌コンサルティング" : "This Week's Skin Consult"}
              </p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                {consultantHeadline}
              </p>
            </div>
            <div className="rounded-3xl px-3 py-2 text-right shrink-0"
              style={{ background: "#FFFFFFAA" }}>
              <p className="text-xs font-bold text-stone-500 whitespace-nowrap">{diaryReport.copy.period}</p>
              <p className="text-sm font-bold mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.periodLabel}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-start">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
              {reportStatusLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">{diaryReport.copy.scans}</p>
              <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.scanCount}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">{diaryReport.copy.diary}</p>
              <p className="text-[20px] font-black mt-1" style={{ color: SCAN_TO }}>{diaryReport.memoCount}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">{diaryReport.copy.adherence}</p>
              <p className="text-[20px] font-black mt-1" style={{ color: "#0F766E" }}>{diaryReport.adherence}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
              <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                {reportConsultText.insight}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-base font-bold text-kr-pretty" style={{ color: DEEP_GREEN }}>
                  {diaryReport.copy[diaryReport.trendKey]}
                </p>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${SCAN_FROM}18`, color: SCAN_TO }}>
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

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportConsultText.causes}
          </p>
          <div className="space-y-2.5 mt-3">
            {causeEstimateItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: "#F8F5F2" }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                  {index + 1}
                </div>
                <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportConsultText.priorities}
          </p>
          <div className="space-y-2.5 mt-3">
            {consultantActionItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: index === 0 ? TINT_WARM : index === 1 ? TINT_GREEN : "#F6F4FB" }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#FFFFFF", color: index === 0 ? SCAN_TO : index === 1 ? DEEP_GREEN : "#7C3AED" }}>
                  {index + 1}
                </div>
                <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportDetailText.radarTitle}
          </p>
          <p className="text-xs text-stone-500 mt-1">{reportDetailText.radarSub}</p>
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="68%" data={diaryReport.radarData}>
                <PolarGrid stroke="#E7E1DA" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#7C6F63", fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={reportLang === "ko" ? "현재" : reportLang === "ja" ? "現在" : "Current"} dataKey="current" stroke={SCAN_TO} fill={SCAN_TO} fillOpacity={0.22} strokeWidth={2} />
                <Radar name={reportLang === "ko" ? "누적 평균" : reportLang === "ja" ? "累積平均" : "Average"} dataKey="average" stroke={DEEP_GREEN} fill={DEEP_GREEN} fillOpacity={0.38} strokeWidth={2} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 700, color: "#444", paddingTop: "8px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] px-1" style={{ color: SCAN_TO }}>
          {reportLang === "ko" ? "핵심 관찰" : reportLang === "ja" ? "主要観察" : "Key observations"}
        </p>
        {diaryReport.focusConcerns.map((concern: any) => (
          <Card key={concern.key} className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-kr-pretty" style={{ color: concern.accent }}>{concern.titles[reportLang]}</p>
                  <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">{concern.summaries[reportLang]}</p>
                </div>
                <div className="rounded-2xl px-3 py-2 shrink-0 text-right"
                  style={{ background: `${concern.accent}12`, border: `1px solid ${concern.accent}20` }}>
                  <p className="text-xs font-bold" style={{ color: concern.accent }}>{diaryReport.copy.avgRisk}</p>
                  <p className="text-[20px] font-black leading-none mt-1" style={{ color: concern.accent }}>{concern.avgRisk}</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, concern.avgRisk)}%`, background: concern.accent }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {diaryReport.copy.ingredients}
            </p>
            <p className="text-xs text-stone-500 mt-1 text-kr-pretty">{reportLang === "ko" ? "상담실장이 우선 추천하는 성분 처방입니다." : reportLang === "ja" ? "優先して勧めたい成分処方です。" : "Top ingredient prescriptions a consultant would prioritize."}</p>
            <div className="space-y-3 mt-3">
              {diaryReport.ingredientPlan.map((item: any) => (
                <div key={item.name} className="rounded-2xl p-3" style={{ background: `${item.accent}10` }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: item.accent }}>{item.name}</p>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/80 text-stone-500">{item.concern}</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">{item.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {diaryReport.copy.procedures}
            </p>
            <p className="text-xs text-stone-500 mt-1 text-kr-pretty">{reportLang === "ko" ? "시술이 필요하다면 상담실에서 먼저 검토할 만한 방향입니다." : reportLang === "ja" ? "施術を考えるなら先に相談しやすい方向です。" : "If procedures are on the table, these are the first directions worth discussing."}</p>
            <div className="space-y-3 mt-3">
              {diaryReport.procedurePlan.map((item: any) => (
                <div key={item.name} className="rounded-2xl p-3 border" style={{ borderColor: `${item.accent}20`, background: "#FFFFFF" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{item.name}</p>
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${item.accent}12`, color: item.accent }}>
                      {diaryReport.copy.recommended}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">{item.reason}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-3 leading-relaxed">{diaryReport.copy.procedureNote}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {reportLang === "ko" ? "성분 반응 추적" : reportDetailText.ingredientTrack}
            </p>
            <p className="text-xs text-stone-500 mt-1">{reportDetailText.ingredientTrackSub}</p>
            <div className="space-y-3 mt-3">
              {diaryReport.ingredientSignals.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">{reportDetailText.positiveFlow}</p>
                    <div className="space-y-3 mt-2">
                      {diaryReport.ingredientSignals.filter((item: any) => item.delta >= 0).slice(0, 3).map((item: any) => (
                        <div key={`good-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: TINT_GREEN }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-emerald-700">{item.ingredient}</p>
                            <span className="text-xs font-bold text-emerald-600">+{item.delta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{reportDetailText.cautionFlow}</p>
                    <div className="space-y-3 mt-2">
                      {diaryReport.ingredientSignals.filter((item: any) => item.delta < 0).slice(0, 3).map((item: any) => (
                        <div key={`bad-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: TINT_WARM }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold" style={{ color: SCAN_TO }}>{item.ingredient}</p>
                            <span className="text-xs font-bold" style={{ color: SCAN_TO }}>{item.delta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-stone-400 py-8 text-center">{diaryReport.copy.notEnough}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {reportConsultText.procedureGuide}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.recoveryGuide.map((item: string) => (
                <div key={item} className="rounded-2xl p-3" style={{ background: TINT_NEUTRAL }}>
                  <p className="text-[12px] text-stone-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportConsultText.routineAdjust}
          </p>
          <div className="grid gap-3 mt-3 md:grid-cols-2">
            <div className="rounded-3xl p-4" style={{ background: TINT_WARM }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineGood}</p>
              <p className="text-sm font-bold mt-2 text-kr-pretty" style={{ color: DEEP_GREEN }}>{diaryReport.routineHighlights.strong}</p>
            </div>
            <div className="rounded-3xl p-4" style={{ background: TINT_NEUTRAL }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineWatch}</p>
              <p className="text-sm font-bold mt-2 text-kr-pretty" style={{ color: "#8C8070" }}>{diaryReport.routineHighlights.watch}</p>
            </div>
            <div className="rounded-3xl p-4" style={{ background: TINT_WARM }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{diaryReport.copy.memoSignals}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(diaryReport.keywordSummary.length > 0 ? diaryReport.keywordSummary : [diaryReport.copy.notEnough]).map((item: string) => (
                  <span key={item} className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: "#F5F3FF" }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7C3AED]">{diaryReport.copy.causeSignals}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(diaryReport.topCauseTags.length > 0 ? diaryReport.topCauseTags : [diaryReport.copy.notEnough]).map((item: string) => (
                  <span key={item} className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#FFFFFF", color: "#7C3AED" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-3xl p-4 mt-3" style={{ background: TINT_NEUTRAL }}>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: DEEP_GREEN }}>
              {diaryReport.copy.cosmeticsSignal}
            </p>
            <p className="text-[12px] text-stone-600 mt-2 leading-relaxed">{diaryReport.cosmeticsSignal}</p>
            {routineGuide.cautions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {routineGuide.cautions.slice(0, 2).map((item: string) => (
                  <span key={item} className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: TINT_WARM, color: SCAN_TO }}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-3 mt-3 md:grid-cols-3">
            <div className="rounded-2xl p-3" style={{ background: TINT_GREEN }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">{reportLang === "ko" ? "유지" : reportLang === "ja" ? "維持" : "Keep"}</p>
              <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.keep}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{reportLang === "ko" ? "줄이기" : reportLang === "ja" ? "減らす" : "Reduce"}</p>
              <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.reduce}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#F6F4FB" }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7C3AED]">{reportLang === "ko" ? "추가" : reportLang === "ja" ? "追加" : "Add"}</p>
              <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.add}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportLang === "ko" ? "피해야 할 실수" : reportLang === "ja" ? "避けたいミス" : "Avoid This Week"}
          </p>
          <div className="space-y-2.5 mt-3">
            {avoidMistakes.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: "#FFF7ED" }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#FFFFFF", color: "#C2410C" }}>
                  !
                </div>
                <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {reportConsultText.lifestyle}
            </p>
            <div className="space-y-2.5 mt-3">
              {lifestyleSupportItems.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl p-3" style={{ background: index === 0 ? "#F5F9FF" : TINT_NEUTRAL }}>
                  <p className="text-[12px] text-stone-600 leading-relaxed text-kr-pretty">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
              {reportConsultText.causes}
            </p>
            <div className="space-y-3 mt-3">
              {diaryReport.triggerSignals.length > 0 ? diaryReport.triggerSignals.map((item: any) => (
                <div key={item.tag} className="rounded-2xl p-3" style={{ background: item.diff <= 0 ? TINT_WARM : TINT_GREEN }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: item.diff <= 0 ? SCAN_TO : "#059669" }}>{item.label}</p>
                    <span className="text-xs font-bold" style={{ color: item.diff <= 0 ? SCAN_TO : "#059669" }}>
                      {item.diff > 0 ? `+${item.diff}` : item.diff}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-[12px] text-stone-400 py-8 text-center">{diaryReport.copy.notEnough}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: TINT_GREEN }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                {reportDetailText.forecastTitle}
              </p>
              <p className="text-[13px] text-stone-600 mt-2 leading-relaxed text-kr-pretty">{diaryReport.forecast.note}</p>
            </div>
            <div className="rounded-3xl px-3 py-2 shrink-0 text-right" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">WEEK 2</p>
              <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">WEEK 1</p>
              <p className="text-2xl font-bold mt-1" style={{ color: SCAN_TO }}>{diaryReport.forecast.week1}</p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
              <p className="text-xs font-bold text-stone-400">WEEK 2</p>
              <p className="text-2xl font-bold mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
            {reportLang === "ko" ? "마무리 코멘트" : reportLang === "ja" ? "締めコメント" : "Closing note"}
          </p>
          <p className="text-[13px] text-stone-700 mt-3 leading-relaxed text-kr-pretty">{closingComment}</p>
        </CardContent>
      </Card>
    </div>
  );
}
