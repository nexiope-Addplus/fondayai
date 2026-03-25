import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ScanLine, Lightbulb, Sparkles, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEEP_GREEN, SCAN_TO, SCAN_FROM, TINT_WARM, TINT_GREEN, TINT_NEUTRAL, BG_MUTED, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY, SHADOW_CARD } from "./constants";
import { SkinPredictionCard } from "./SkinPredictionCard";

export function ResultSolutionTab(props: any) {
  const { t } = useTranslation();
  const {
    user, cosmeticCount, setShowCosmeticsRegister, setShowCosmeticsGate,
    analysisResult, handleDiaryEntry, goTo,
  } = props;

  return (
          <div className="space-y-4">

            {/* 화장품 스캔 배너 */}
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: TINT_GREEN }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "#FFFFFF", color: DEEP_GREEN }}>
                <ScanLine className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("cosmetics.ctaTitle")}</p>
                <p className="text-xs text-stone-400 leading-tight text-kr-pretty">{t("cosmetics.ctaBannerSub")}</p>
              </div>
              {user && cosmeticCount > 0 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ background: "#FFFFFF", color: DEEP_GREEN }}>
                  {t("cosmetics.ctaCount", { count: cosmeticCount })}
                </span>
              )}
              <button onClick={() => user ? setShowCosmeticsRegister(true) : setShowCosmeticsGate(true)}
                className="shrink-0 px-4 py-2 rounded-xl text-white text-xs font-semibold"
                style={{ background: DEEP_GREEN }}>
                + {t("cosmetics.scanBtn")}
              </button>
            </div>

            <div className="space-y-3">

            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: TINT_GREEN }}>
                <Lightbulb className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: "#6B5D55" }}>{t("modal.improvements.title")}</p>
                <p className="text-xs text-stone-400">{t("modal.improvements.sub")}</p>
              </div>
            </div>
            <div className="space-y-4">
              {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#5C4F4A] mb-1">{item.title}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: "#8C8078" }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            {(analysisResult?.improvements ?? []).length === 0 && (
              <p className="text-center text-sm text-stone-400 py-6">{t("modal.improvements.loading")}</p>
            )}
            {(analysisResult?.cosmetics ?? []).length > 0 && (
              <>
                <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                    <p className="text-[14px] font-bold" style={{ color: "#5C4F4A" }}>{t("modal.improvements.cosmetics")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                    <motion.div key={`c-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#FFF7ED" }}>
                        <Star className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[14px] font-bold text-[#5C4F4A]">{item.type}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: TINT_WARM, color: "#D97706" }}>{item.key}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed" style={{ color: "#8C8078" }}>{item.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            </div>

            {/* ── AI 피부 예측 ── */}
            {analysisResult?.prediction && (
              <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              <SkinPredictionCard
                prediction={analysisResult.prediction}
                currentScore={analysisResult.scores[0]?.score ?? 0}
                onOpenDiary={handleDiaryEntry}
              />
              </div>
            )}

            <button
              onClick={() => goTo("nutrition")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[12px] font-semibold transition-all active:scale-95"
              style={{ background: "#FAF8F5", color: "#7C3AED" }}>
              <Utensils className="w-4 h-4" />
              <span>{t("result.tab.nutrition")}</span>
            </button>
          </div>
  );
}
