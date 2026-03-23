import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Utensils, Pill, AlertCircle } from "lucide-react";
import { SCORE_LABEL_MAP, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";

export function ResultNutritionTab({ analysisResult }: any) {
  const { t } = useTranslation();

  return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#F6F4FB" }}>
                <Utensils className="w-4 h-4" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("nutrients.supplementsTitle")}</p>
                <p className="text-xs text-stone-400">{t("nutrients.supplementsSub")}</p>
              </div>
            </div>

            {!analysisResult?.nutritionTips ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-400">
                <Pill className="w-7 h-7" style={{ color: "#7C3AED" }} />
                <p className="text-[12px]">{t("nutrients.loadingTips")}</p>
              </div>
            ) : (
              <>
                {/* 영양제 추천 */}
                <div className="space-y-3">
                  {analysisResult.nutritionTips.supplements.map((item: { emoji: string; name: string; dose: string; reason: string; targetScore: string }, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-3.5 rounded-2xl"
                      style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#F6F4FB" }}>
                        <span className="text-xl">{item.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-semibold text-stone-800">{item.name}</p>
                          <span className="text-xs font-medium rounded-full px-2 py-0.5 shrink-0"
                            style={{ background: "#FFFFFF", color: "#7C3AED" }}>
                            {SCORE_LABEL_MAP[item.targetScore] !== undefined ? t(`scores.${SCORE_LABEL_MAP[item.targetScore]}`) : item.targetScore}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mb-0.5 flex items-center gap-0.5" style={{ color: "#7C3AED" }}><Pill className="w-3 h-3 inline mr-0.5" /> {item.dose}</p>
                        <p className="text-xs text-stone-500 leading-relaxed">{item.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 수분 목표 */}
                {analysisResult.nutritionTips.hydrationGoal && (
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                    style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F5F9FF" }}>
                      <span className="text-xl">💧</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-600 mb-0.5">{t("nutrients.hydrationLabel")}</p>
                      <p className="text-[12px] text-stone-600 leading-relaxed">{analysisResult.nutritionTips.hydrationGoal}</p>
                    </div>
                  </div>
                )}

                {/* 피해야 할 것 */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3 pt-2 border-t border-stone-100">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("nutrients.avoidTitle")}</p>
                  </div>
                  <div className="space-y-3">
                    {analysisResult.nutritionTips.avoidFoods.map((item: { emoji: string; food: string; reason: string }, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl"
                        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#FFF7ED" }}>
                          <span className="text-xl">{item.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-stone-700 mb-0.5">{item.food}</p>
                          <p className="text-xs text-stone-400">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
  );
}
