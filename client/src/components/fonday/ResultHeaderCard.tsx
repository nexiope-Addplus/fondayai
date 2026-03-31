import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

// ─── 카운트업 숫자 컴포넌트 ───────────────────────────────────────
function CountUp({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const reducedMotion = useReducedMotion();
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, mass: 0.8 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayed, setDisplayed] = useState(reducedMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(value);
      return;
    }
    if (!started.current) {
      started.current = true;
      motionVal.set(value);
    }
  }, [value, motionVal, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    return display.on("change", (v) => setDisplayed(v));
  }, [display, reducedMotion]);

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
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  TINT_WARM,
  TEXT_LABEL,
  COLOR_WARNING,
  COLOR_INFO,
  COLOR_SUCCESS,
  COLOR_DANGER,
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
  const reducedMotion = useReducedMotion();

  return (
    <Card className="overflow-hidden rounded-[20px] border shadow-none"
      style={{ background: BG_BASE, borderColor: BORDER_COLOR }}>
      <CardContent className="p-4">
        {/* ── 1층: 사진 + 종합점수 (가로, 꽉 차게) ── */}
        <div className="flex items-stretch gap-3">
          <div className="relative rounded-2xl overflow-hidden bg-stone-100 shrink-0" style={{ width: 100, minHeight: 120 }}>
            <img src={faceCroppedSrc || imageSrc} alt="" aria-hidden="true" className="w-full h-full object-cover" style={{ objectPosition: "center 50%" }} />
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: SCAN_TO }} />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: SCAN_TO }} />
          </div>
          <motion.div
            className="flex-1 min-w-0 flex flex-col justify-center rounded-2xl px-4 py-3"
            style={{ background: BG_MUTED }}
            animate={reducedMotion ? {} : {
              boxShadow: [
                "0 0 0px rgba(74,124,110,0)",
                "0 0 0px rgba(74,124,110,0)",
                "0 0 24px rgba(74,124,110,0.12)",
                "0 0 0px rgba(74,124,110,0)",
              ],
            }}
            transition={reducedMotion ? {} : { duration: 2.5, delay: 1.5, times: [0, 0.01, 0.4, 1] }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: TEXT_TERTIARY }}>{t("result.overall")}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-[44px] font-normal leading-none" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
                <CountUp value={overallScore} />
              </p>
              <p className="text-[13px] font-medium mb-1.5" style={{ color: TEXT_TERTIARY }}>{t("result.scoreSuffix")}</p>
              {scoreDelta !== null && scoreDelta !== 0 && (
                <motion.span
                  className="text-[14px] font-bold mb-1.5"
                  style={{ color: scoreDelta > 0 ? COLOR_SUCCESS : COLOR_DANGER }}
                  initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={reducedMotion ? {} : { delay: 1, duration: 0.5 }}
                >
                  {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                </motion.span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1.5 text-kr-pretty">{weakestSummary || t("result.actionCard.phaseRecord")}</p>
          </motion.div>
        </div>

        {/* ── 2층: 피부나이 + 순위 + MBTI (flat grid with top border) ── */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <div className="px-2 py-2 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em]" style={{ color: TEXT_TERTIARY }}>{t("result.skinAge")}</p>
            <p className="text-[20px] font-normal leading-none mt-1" style={{ color: COLOR_INFO, fontFamily: FONT_DISPLAY }}>
              {analysisResult?.skinAge && analysisResult.skinAge > 0
                ? <CountUp value={analysisResult.skinAge} />
                : "—"}
            </p>
          </div>
          <div className="px-2 py-2 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em]" style={{ color: TEXT_TERTIARY }}>{t("ranking.topLabel")}</p>
            <p className="text-[16px] font-normal leading-none mt-1 break-keep" style={{ color: COLOR_WARNING, fontFamily: FONT_DISPLAY }}>
              {rankingData && rankingData.myPercentile !== undefined ? t("ranking.myPercentile", { percent: rankingData.myPercentile }) : "—"}
            </p>
          </div>
          <div className="px-2 py-2 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em]" style={{ color: TEXT_TERTIARY }}>{t("result.baumannLabel")}</p>
            <p className="text-[20px] font-normal leading-none mt-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{finalType}</p>
          </div>
        </div>

        {/* ── 3층: 점수 바 + 분석결과 보기 ── */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[12px] font-bold" style={{ color: TEXT_LABEL }}>{t("result.scores")}</p>
            <button
              onClick={() => setShowAnalysis(true)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: TINT_WARM, color: SCAN_TO }}
            >
              {t("modal.analysis.title")} {t("result.viewBtn")}
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {previewScoreItems.map(({ idx, score, color }: { idx: number; score: number; color: string }, i: number) => {
              const prevScore = previousScores?.[idx]?.score;
              const delta = prevScore != null ? score - prevScore : null;
              return <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={i * 80} delta={delta} />;
            })}
          </div>
        </div>

        {/* ── 4층: 바우만 타입 상세 ── */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Microscope className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
              <p className="text-[12px] font-bold" style={{ color: TEXT_LABEL }}>{finalType}</p>
              <button onClick={() => setShowBaumannInfo(v => !v)}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full active:opacity-70 transition-opacity"
                style={{ background: TINT_WARM, color: SCAN_TO }}>
                {showBaumannInfo ? t("result.baumannFold") : t("result.baumannExpand")}
              </button>
            </div>
            <div className="rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0 flex items-center gap-0.5"
              style={{ background: TINT_GREEN, color: DEEP_GREEN }}>
              <Flame className="w-3 h-3" style={{ color: SCAN_TO }} />{t("streak.badge", { count: currentStreak.count || 1 })}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {finalType.split("").map((letter, i) => {
              const color = BAUMANN_COLORS[letter];
              if (!color) return null;
              return (
                <motion.span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{ color, background: `${color}12`, borderColor: `${color}22` }}
                  initial={reducedMotion ? {} : { opacity: 0, y: 6 }}
                  animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
                  transition={reducedMotion ? {} : { delay: i * 0.1 }}>
                  {t(`baumann.${letter}.name`)}
                </motion.span>
              );
            })}
          </div>
          <AnimatePresence>
            {showBaumannInfo && (
              <motion.div initial={reducedMotion ? {} : { opacity: 0, y: -6 }} animate={reducedMotion ? {} : { opacity: 1, y: 0 }} exit={reducedMotion ? {} : { opacity: 0, y: -6 }}
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
        </div>

        {/* ── 5층: AI 총평 (있을 때만) ── */}
        {analysisResult?.aiComment && (
          <button
            onClick={() => setShowAnalysis(true)}
            className="mt-4 pt-4 block w-full text-left"
            style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
          >
            <p className="text-xs font-bold tracking-[0.08em]" style={{ color: TEXT_LABEL }}>{t("result.aiComment")}</p>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed text-kr-pretty line-clamp-2">
              {analysisResult.aiComment}
            </p>
            <p className="text-xs font-bold mt-2" style={{ color: SCAN_TO }}>{t("modal.analysis.title")} {t("result.viewBtn")}</p>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
