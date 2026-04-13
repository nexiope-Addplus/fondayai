import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ScanLine, Lightbulb, Sparkles, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isTossMiniApp } from "./utils";
import {
  DEEP_GREEN,
  SCAN_TO,
  SCAN_FROM,
  TINT_WARM,
  TINT_GREEN,
  TINT_NEUTRAL,
  BG_MUTED,
  BORDER_COLOR,
  FONT_DISPLAY,
  TEXT_TERTIARY,
  BG_BASE,
  TEXT_TITLE,
  TEXT_LABEL,
  TEXT_SECONDARY,
  COLOR_WARNING,
  COLOR_INFO,
} from "./constants";


export function ResultSolutionTab(props: any) {
  const { t } = useTranslation();
  const {
    user, cosmeticCount, setShowCosmeticsRegister, setShowCosmeticsGate,
    analysisResult, handleDiaryEntry, goTo,
    loginPromptRef, socialLoginButton, handleGoogleLogin,
  } = props;

  return (
          <div className="space-y-4">

            {/* 화장품 스캔 배너 */}
            <div className="px-4 py-3.5 rounded-2xl" style={{ background: TINT_GREEN }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: BG_BASE, color: DEEP_GREEN }}>
                  <ScanLine className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug" style={{ color: DEEP_GREEN }}>{t("cosmetics.ctaTitle")}</p>
                  <p className="text-xs text-stone-400 leading-snug mt-0.5">{t("cosmetics.ctaBannerSub")}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2.5">
                {user && cosmeticCount > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: BG_BASE, color: DEEP_GREEN }}>
                    {t("cosmetics.ctaCount", { count: cosmeticCount })}
                  </span>
                )}
                <button onClick={() => user ? setShowCosmeticsRegister(true) : setShowCosmeticsGate(true)}
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold"
                  style={{ background: DEEP_GREEN }}>
                  + {t("cosmetics.scanBtn")}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: TINT_GREEN }}>
                <Lightbulb className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: TEXT_LABEL }}>{t("modal.improvements.title")}</p>
                <p className="text-xs text-stone-400">{t("modal.improvements.sub")}</p>
              </div>
            </div>
            <div className="space-y-4">
              {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : COLOR_INFO }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#5C4F4A] mb-1">{item.title}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{item.desc}</p>
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
                    <p className="text-[14px] font-bold" style={{ color: TEXT_TITLE }}>{t("modal.improvements.cosmetics")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                    <motion.div key={`c-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.07 }}
                      className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#FFF7ED" }}>
                        <Star className="w-3.5 h-3.5" style={{ color: COLOR_WARNING }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[14px] font-bold text-[#5C4F4A]">{item.type}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: TINT_WARM, color: COLOR_WARNING }}>{item.key}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{item.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
            </div>

            <button
              onClick={() => goTo("nutrition")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[12px] font-semibold transition-all active:scale-95"
              style={{ background: "#FAF8F5", color: COLOR_INFO }}>
              <Utensils className="w-4 h-4" />
              <span>{isTossMiniApp() ? t("result.tab.tossNutrition") : t("result.tab.nutrition")}</span>
            </button>
          </div>
  );
}
