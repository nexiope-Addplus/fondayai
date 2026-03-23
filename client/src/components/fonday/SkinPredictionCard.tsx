import { useTranslation } from "react-i18next";
import { Bot, CheckCircle2 } from "lucide-react";

import type { PredictionScenario } from "./types";
import { DEEP_GREEN, SCAN_TO } from "./constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="rounded-3xl overflow-hidden bg-white/95" style={{ boxShadow: "0 10px 28px rgba(45,95,79,0.08)" }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F6F4FB" }}>
              <Bot className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{t("result.prediction.title")}</p>
              <p className="text-xs text-stone-400">{t("result.prediction.currentScore", { score: currentScore })}</p>
            </div>
          </div>
          <div className="rounded-2xl px-3 py-2 text-right shrink-0" style={{ background: "#F5F3FF", border: "1px solid #E9D5FF" }}>
            <p className="text-xs font-bold text-violet-500">{t("result.prediction.rewardLabel")}</p>
            <p className="text-[20px] font-black leading-none text-violet-700">+{rewardPts}</p>
            <p className="text-xs text-violet-400 mt-1">{t("result.prediction.rewardSub")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs font-semibold text-kr-pretty" style={{ color: DEEP_GREEN }}>
            {t("result.prediction.missionTitle")}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-100">
              {t("result.prediction.daysAfter", { days: good.days })}
            </span>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold text-stone-500 bg-stone-50">
              {t("result.prediction.disclaimer")}
            </span>
          </div>
        </div>

        <div className="grid gap-2.5">
          <div className="rounded-2xl p-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-600">{t("result.prediction.bestRoute")}</p>
                <p className="text-xs font-semibold text-emerald-700 text-kr-pretty">{good.scenario}</p>
                <p className="text-xs text-stone-400 mt-0.5">{t("result.prediction.goodCaption")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[28px] font-black leading-none text-emerald-600">{good.score}</p>
                <p className="text-xs font-semibold text-emerald-500 mt-0.5">+{goodDelta}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-emerald-700 mb-2">{t("result.prediction.routine")}</p>
            <div className="space-y-3">
              {good.routine?.map((routine, index) => (
                <div key={index} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="text-xs font-medium text-stone-700 leading-tight text-kr-pretty">{routine}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-orange-500">{t("result.prediction.riskRoute")}</p>
                <p className="text-xs font-semibold text-orange-700 text-kr-pretty">{bad.scenario}</p>
                <p className="text-xs text-stone-400 mt-0.5">{t("result.prediction.badCaption")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[28px] font-black leading-none text-orange-500">{bad.score}</p>
                <p className="text-xs font-semibold text-orange-400 mt-0.5">-{Math.abs(badDelta)}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-orange-700 mb-2">{t("result.prediction.risks")}</p>
            <div className="flex flex-wrap gap-1.5">
              {bad.risks?.map((risk, index) => (
                <span key={index} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-stone-600 text-kr-pretty">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
