import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Microscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResult, RankingData, StreakData } from "./types";
import {
  BAUMANN_COLORS,
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_WARM,
} from "./constants";
import { MiniScoreBarIdle } from "./WeatherTipCard";

type ResultHeaderCardProps = {
  faceCroppedSrc: string | null;
  imageSrc: string;
  finalType: string;
  overallScore: number;
  scoreDelta: number | null;
  weakestSummary: string;
  rankingData: RankingData | null;
  analysisResult: AnalysisResult | null;
  currentStreak: StreakData;
  showBaumannInfo: boolean;
  setShowBaumannInfo: (fn: (v: boolean) => boolean) => void;
  setShowAnalysis: (v: boolean) => void;
  previewScoreItems: { idx: number; score: number; color: string }[];
};

export function ResultHeaderCard({
  faceCroppedSrc,
  imageSrc,
  finalType,
  overallScore,
  scoreDelta,
  weakestSummary,
  rankingData,
  analysisResult,
  currentStreak,
  showBaumannInfo,
  setShowBaumannInfo,
  setShowAnalysis,
  previewScoreItems,
}: ResultHeaderCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden border-none shadow-2xl rounded-3xl"
      style={{ background: "#FFFFFF" }}>
      <CardContent className="p-3.5">
        <div className="grid grid-cols-[92px_1fr] gap-2.5 items-start sm:grid-cols-[104px_1fr] sm:gap-3">
          <div>
            <div className="relative rounded-3xl overflow-hidden h-[120px] bg-stone-100 sm:rounded-3xl sm:h-[132px]">
              <img src={faceCroppedSrc || imageSrc} className="w-full h-full object-cover" style={{ objectPosition: "center 50%" }} />
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: SCAN_TO }} />
            </div>
            <div className="mt-2 rounded-2xl px-2.5 py-2 text-center"
              style={{ background: TINT_WARM }}>
              <p className="text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.baumannLabel")}</p>
              <p className="text-lg font-bold leading-none mt-1" style={{ color: SCAN_TO }}>{finalType}</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="rounded-3xl px-2.5 py-2.5 mb-2.5 sm:rounded-3xl sm:px-3"
              style={{ background: `${SCAN_FROM}10`, border: `1px solid ${SCAN_FROM}24` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.scores")}</p>
                <button
                  onClick={() => setShowAnalysis(true)}
                  className="rounded-full px-2.5 py-1 text-[9px] font-bold whitespace-nowrap"
                  style={{ background: TINT_WARM, color: SCAN_TO }}
                >
                  {t("modal.analysis.title")} {t("result.viewBtn")}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">
                {scoreDelta !== null
                  ? scoreDelta > 0
                    ? `${t("result.overall")} +${scoreDelta}`
                    : scoreDelta < 0
                    ? `${t("result.overall")} -${Math.abs(scoreDelta)}`
                    : `${t("result.overall")} ${overallScore}`
                  : `${t("result.actionCard.phaseRecord")} · ${weakestSummary || t("result.scores")}`}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {previewScoreItems.map(({ idx, score, color }: { idx: number; score: number; color: string }, i: number) => (
                <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={i * 80} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-3">
          <div className="col-span-2 rounded-2xl px-4 py-3.5" style={{ background: TINT_WARM }}>
            <div className="min-w-0 flex items-end justify-center gap-2">
              <p className="text-[15px] font-bold tracking-[-0.01em] text-stone-600">{t("result.overall")} :</p>
              <p className="text-[36px] font-black leading-none" style={{ color: SCAN_TO }}>{overallScore}{t("result.scoreSuffix")}</p>
            </div>
            <p className="text-[11px] text-stone-600 mt-1.5 leading-snug text-kr-pretty text-center">
              {weakestSummary || t("result.actionCard.phaseRecord")}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-3 flex flex-col items-center justify-center text-center min-w-0" style={{ background: "#F7F3FF", border: "1px solid #E9DDFF" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400 text-center">{t("result.skinAge")}</p>
            <p className="text-[27px] font-bold leading-none mt-1.5" style={{ color: "#7C3AED" }}>
              {analysisResult?.skinAge && analysisResult.skinAge > 0 ? analysisResult.skinAge : "—"}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-3 flex flex-col items-center justify-center text-center min-w-0" style={{ background: "#FFF8EE", border: "1px solid #F4E2C4" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400 text-center">{t("ranking.topLabel")}</p>
            <p className="text-[21px] font-bold leading-none mt-1.5 break-keep text-center" style={{ color: "#D97706" }}>
              {rankingData && rankingData.myPercentile !== undefined ? t("ranking.myPercentile", { percent: rankingData.myPercentile }) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-3xl p-3.5"
          style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
                <Microscope className="w-5 h-5" style={{ color: SCAN_TO }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>{t("result.baumannLabel")}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-lg font-bold leading-none" style={{ color: DEEP_GREEN }}>{finalType}</p>
                  <button onClick={() => setShowBaumannInfo(v => !v)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                    style={{ background: TINT_WARM, color: SCAN_TO }}>
                    {showBaumannInfo ? t("result.baumannFold") : t("result.baumannExpand")}
                  </button>
                </div>
                <p className="text-[11px] font-medium mt-1 text-stone-500 text-kr-pretty">{t("result.mbtiSub")}</p>
              </div>
            </div>
            <div className="rounded-full px-3 py-1 text-[10px] font-bold shrink-0 flex items-center gap-0.5"
              style={{ background: TINT_GREEN, color: DEEP_GREEN }}>
              <Flame className="w-3 h-3" style={{ color: SCAN_TO }} />{t("streak.badge", { count: currentStreak.count || 1 })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {finalType.split("").map((letter, i) => {
              const color = BAUMANN_COLORS[letter];
              if (!color) return null;
              return (
                <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{ color, background: `${color}12`, borderColor: `${color}22` }}>
                  {t(`baumann.${letter}.name`)}
                </span>
              );
            })}
          </div>
          <AnimatePresence>
            {showBaumannInfo && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-2 grid grid-cols-2 gap-1.5">
                {finalType.split("").map((letter) => {
                  const color = BAUMANN_COLORS[letter];
                  if (!color) return null;
                  return (
                    <div key={letter} className="rounded-2xl p-2.5"
                      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      <p className="text-xs font-semibold" style={{ color }}>{letter} — {t(`baumann.${letter}.name`)}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">{t(`baumann.${letter}.desc`)}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {analysisResult?.aiComment && (
            <button
              onClick={() => setShowAnalysis(true)}
              className="mt-3 block w-full rounded-2xl px-3 py-2.5 text-left"
              style={{ background: "#FFFFFF", border: "1px solid #F0E2DA" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.aiComment")}</p>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed text-kr-pretty line-clamp-2">
                {analysisResult.aiComment}
              </p>
              <p className="text-[10px] font-bold mt-2" style={{ color: SCAN_TO }}>{t("modal.analysis.title")} {t("result.viewBtn")}</p>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
