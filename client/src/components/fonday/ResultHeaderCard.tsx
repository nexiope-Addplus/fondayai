import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

// ─── 카운트업 숫자 컴포넌트 ───────────────────────────────────────
function CountUp({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, mass: 0.8 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      motionVal.set(value);
    }
  }, [value, motionVal]);

  useEffect(() => {
    return display.on("change", (v) => setDisplayed(v));
  }, [display]);

  return <span className={className} style={style}>{displayed}</span>;
}
import { Flame, Microscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResult, RankingData, StreakData } from "./types";
import {
  BAUMANN_COLORS,
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
  previousScores?: { score: number }[] | null;
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
  previousScores,
}: ResultHeaderCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden rounded-3xl border shadow-none"
      style={{ background: BG_BASE, borderColor: BORDER_COLOR }}>
      <CardContent className="p-3.5">
        <div className="grid grid-cols-[92px_1fr] gap-2.5 items-start sm:grid-cols-[104px_1fr] sm:gap-3">
          <div>
            <div className="relative rounded-3xl overflow-hidden h-[120px] bg-stone-100 sm:rounded-3xl sm:h-[132px]">
              <img src={faceCroppedSrc || imageSrc} alt="" aria-hidden="true" className="w-full h-full object-cover" style={{ objectPosition: "center 50%" }} />
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: SCAN_TO }} />
            </div>
            <div className="mt-2 rounded-2xl px-2.5 py-2 text-center border"
              style={{ background: BG_MUTED, borderColor: BORDER_COLOR }}>
              <p className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("result.baumannLabel")}</p>
              <p className="text-lg font-normal leading-none mt-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{finalType}</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="rounded-[16px] px-2.5 py-2.5 mb-2.5"
              style={{ background: BG_MUTED }}>
              <div className="flex items-center justify-between gap-1.5">
                <p className="text-[11px] font-bold whitespace-nowrap truncate" style={{ color: "#6B5D55" }}>{t("result.scores")}</p>
                <button
                  onClick={() => setShowAnalysis(true)}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                  style={{ background: TINT_WARM, color: SCAN_TO }}
                >
                  {t("modal.analysis.title")} {t("result.viewBtn")}
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed text-kr-pretty">
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
              {previewScoreItems.map(({ idx, score, color }: { idx: number; score: number; color: string }, i: number) => {
                const prevScore = previousScores?.[idx]?.score;
                const delta = prevScore != null ? score - prevScore : null;
                return <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={i * 80} delta={delta} />;
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-3">
          <div className="col-span-2 rounded-2xl px-4 py-3.5" style={{ background: BG_MUTED }}>
            <div className="min-w-0 flex items-end justify-center gap-2">
              <p className="text-[15px] font-medium tracking-[-0.01em] text-stone-500">{t("result.overall")} :</p>
              <p className="text-[36px] font-normal leading-none" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
                <CountUp value={overallScore} />{t("result.scoreSuffix")}
              </p>
            </div>
            <p className="text-xs text-stone-600 mt-1.5 leading-snug text-kr-pretty text-center">
              {weakestSummary || t("result.actionCard.phaseRecord")}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-3 flex flex-col items-center justify-center text-center min-w-0" style={{ background: BG_MUTED }}>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-center" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("result.skinAge")}</p>
            <p className="text-[27px] font-normal leading-none mt-1.5" style={{ color: "#7C3AED", fontFamily: FONT_DISPLAY }}>
              {analysisResult?.skinAge && analysisResult.skinAge > 0
                ? <CountUp value={analysisResult.skinAge} />
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-3 flex flex-col items-center justify-center text-center min-w-0" style={{ background: BG_MUTED }}>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-center" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("ranking.topLabel")}</p>
            <p className="text-[21px] font-normal leading-none mt-1.5 break-keep text-center" style={{ color: "#D97706", fontFamily: FONT_DISPLAY }}>
              {rankingData && rankingData.myPercentile !== undefined ? t("ranking.myPercentile", { percent: rankingData.myPercentile }) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[20px] p-3.5"
          style={{ background: BG_MUTED }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: BG_MUTED }}>
                <Microscope className="w-5 h-5" style={{ color: SCAN_TO }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("result.baumannLabel")}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-lg font-bold leading-none" style={{ color: DEEP_GREEN }}>{finalType}</p>
                  <button onClick={() => setShowBaumannInfo(v => !v)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all"
                    style={{ background: TINT_WARM, color: SCAN_TO }}>
                    {showBaumannInfo ? t("result.baumannFold") : t("result.baumannExpand")}
                  </button>
                </div>
                <p className="text-xs font-medium mt-1 text-stone-500 text-kr-pretty">{t("result.mbtiSub")}</p>
              </div>
            </div>
            <div className="rounded-full px-3 py-1 text-xs font-semibold shrink-0 flex items-center gap-0.5"
              style={{ background: TINT_GREEN, color: DEEP_GREEN }}>
              <Flame className="w-3 h-3" style={{ color: SCAN_TO }} />{t("streak.badge", { count: currentStreak.count || 1 })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {finalType.split("").map((letter, i) => {
              const color = BAUMANN_COLORS[letter];
              if (!color) return null;
              return (
                <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full border"
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
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{t(`baumann.${letter}.desc`)}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          {analysisResult?.aiComment && (
            <button
              onClick={() => setShowAnalysis(true)}
              className="mt-3 block w-full rounded-2xl px-3 py-2.5 text-left border"
              style={{ background: BG_BASE, borderColor: BORDER_COLOR }}
            >
              <p className="text-xs font-bold tracking-[0.08em]" style={{ color: "#6B5D55" }}>{t("result.aiComment")}</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed text-kr-pretty line-clamp-2">
                {analysisResult.aiComment}
              </p>
              <p className="text-xs font-bold mt-2" style={{ color: SCAN_TO }}>{t("modal.analysis.title")} {t("result.viewBtn")}</p>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
