import { useTranslation } from "react-i18next";
import { Bot, CheckCircle2 } from "lucide-react";

import type { PredictionScenario } from "./types";
import { DEEP_GREEN, SCAN_TO, FONT_DISPLAY, TEXT_TERTIARY, RADIUS_CARD, RADIUS_SUB } from "./constants";

export function SkinPredictionCard({
  prediction,
  currentScore,
  onOpenDiary,
}: {
  prediction: { good: PredictionScenario; bad: PredictionScenario };
  currentScore: number;
  onOpenDiary?: () => void;
}) {
  const { t } = useTranslation();
  const { good, bad } = prediction;
  const goodDelta = good.score - currentScore;
  const badDelta = bad.score - currentScore;
  const rewardPts = Math.max(goodDelta, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#F6F4FB" }}>
            <Bot className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold" style={{ color: "#5C4F4A" }}>{t("result.prediction.title")}</p>
            <p className="text-xs" style={{ color: "#8C8078" }}>{t("result.prediction.currentScore", { score: currentScore })}</p>
          </div>
        </div>
        <div className="px-3 py-2 text-right shrink-0" style={{ borderRadius: RADIUS_SUB, background: "#F5F3FF" }}>
          <p className="text-xs font-semibold text-violet-500">{t("result.prediction.rewardLabel")}</p>
          <p className="text-[20px] font-bold leading-none text-violet-700">+{rewardPts}</p>
          <p className="text-[11px] text-violet-400 mt-0.5">{t("result.prediction.rewardSub")}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-kr-pretty" style={{ color: "#5C4F4A" }}>
          {t("result.prediction.missionTitle")}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-violet-600" style={{ background: "rgba(124,58,237,0.06)" }}>
            {t("result.prediction.daysAfter", { days: good.days })}
          </span>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: "#8C8078", background: "rgba(0,0,0,0.03)" }}>
            {t("result.prediction.disclaimer")}
          </span>
        </div>
      </div>

      {/* 좋은 방향 — 녹색 배경 (기능적 색상 유지) */}
      <div className="p-4" style={{ borderRadius: RADIUS_CARD, background: "#F0FDF4" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-600">{t("result.prediction.bestRoute")}</p>
            <p className="text-[13px] font-bold text-emerald-700 text-kr-pretty mt-0.5">{good.scenario}</p>
            <p className="text-xs mt-0.5" style={{ color: "#8C8078" }}>{t("result.prediction.goodCaption")}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[28px] font-bold leading-none text-emerald-600">{good.score}</p>
            <p className="text-xs font-bold text-emerald-500 mt-0.5">+{goodDelta}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-emerald-700 mb-2">{t("result.prediction.routine")}</p>
        <div className="space-y-2">
          {good.routine?.map((routine, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span className="text-[12px] font-medium text-[#6B5D55] leading-tight text-kr-pretty">{routine}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 위험 방향 — 주황 배경 (기능적 색상 유지) */}
      <div className="p-4" style={{ borderRadius: RADIUS_CARD, background: "#FFF7ED" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-orange-500">{t("result.prediction.riskRoute")}</p>
            <p className="text-[13px] font-bold text-orange-700 text-kr-pretty mt-0.5">{bad.scenario}</p>
            <p className="text-xs mt-0.5" style={{ color: "#8C8078" }}>{t("result.prediction.badCaption")}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[28px] font-bold leading-none text-orange-500">{bad.score}</p>
            <p className="text-xs font-bold text-orange-400 mt-0.5">-{Math.abs(badDelta)}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-orange-700 mb-2">{t("result.prediction.risks")}</p>
        <div className="flex flex-wrap gap-1.5">
          {bad.risks?.map((risk, index) => (
            <span key={index} className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#6B5D55]" style={{ background: "rgba(0,0,0,0.04)" }}>
              {risk}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
