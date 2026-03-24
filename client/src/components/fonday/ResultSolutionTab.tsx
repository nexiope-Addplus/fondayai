import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ScanLine, Leaf, Sparkles, Star, Bot, Thermometer, Droplets, Flame, Shield, Microscope, ArrowRight, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEEP_GREEN, SCAN_TO, SCAN_FROM, TINT_WARM, TINT_GREEN, TINT_NEUTRAL, BG_MUTED, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";
import { SkinPredictionCard } from "./SkinPredictionCard";

export function ResultSolutionTab(props: any) {
  const { t } = useTranslation();
  const {
    user, cosmeticCount, setShowCosmeticsRegister, setShowCosmeticsGate,
    analysisResult, handleDiaryEntry,
    pushSubscribed, pushLoading, handlePushToggle,
    aiCareSettings, updateAICareOption, aiCareLabels,
    setShowWaitlist, goTo,
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
                <Leaf className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("modal.improvements.title")}</p>
                <p className="text-xs text-stone-400">{t("modal.improvements.sub")}</p>
              </div>
            </div>
            {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="flex gap-3 p-4 rounded-2xl"
                style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
                <div className="shrink-0">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-normal"
                    style={{ fontFamily: FONT_DISPLAY, background: i === 0 ? TINT_WARM : i === 1 ? TINT_GREEN : "#F6F4FB", color: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>
                    {i + 1}
                  </div>
                  <p className="text-xs font-normal text-center mt-1"
                    style={{ fontFamily: FONT_DISPLAY, color: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>STEP</p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-stone-800 mb-0.5">{item.title}</p>
                  <p className="text-[12px] text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
            {(analysisResult?.improvements ?? []).length === 0 && (
              <p className="text-center text-sm text-stone-400 py-6">{t("modal.improvements.loading")}</p>
            )}
            {(analysisResult?.cosmetics ?? []).length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: TINT_WARM }}>
                    <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("modal.improvements.cosmetics")}</p>
                </div>
                {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                  <motion.div key={`c-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#FFF7ED" }}>
                      <Star className="w-4 h-4" style={{ color: "#D97706" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold text-stone-800">{item.type}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FFFFFF", color: "#D97706" }}>{item.key}</span>
                      </div>
                      <p className="text-[12px] text-stone-500 leading-relaxed">{item.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            </div>

            {/* ── AI 피부 예측 카드 ── */}
            {analysisResult?.prediction && (
              <SkinPredictionCard
                prediction={analysisResult.prediction}
                currentScore={analysisResult.scores[0]?.score ?? 0}
                onOpenDiary={handleDiaryEntry}
              />
            )}

            {/* ── 알림 설정 ── */}
            <div className="rounded-3xl p-4" style={{ background: "#FFFFFF" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FEF3C7" }}>
                    <Bot className="w-5 h-5" style={{ color: "#D97706" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: SCAN_TO }}>{aiCareLabels.title}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{aiCareLabels.schedule}</p>
                  </div>
                </div>
                <button onClick={() => handlePushToggle()} disabled={pushLoading}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={pushSubscribed
                    ? { background: `${DEEP_GREEN}18`, color: DEEP_GREEN, border: `1px solid ${DEEP_GREEN}33` }
                    : { background: SCAN_TO, color: "#FFFFFF" }}>
                  {pushLoading ? "..." : pushSubscribed ? aiCareLabels.on : aiCareLabels.off}
                </button>
              </div>
              
              {/* 항상 토글을 보여주되, 미구독 시 클릭하면 켜기를 유도하거나 토글 기능을 제한 */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {([
                  ["scan", aiCareLabels.scan],
                  ["meal", aiCareLabels.meal],
                  ["hydration", aiCareLabels.hydration],
                  ["routine", aiCareLabels.routine],
                  ["uvCare", aiCareLabels.uvCare],
                  ["bedtime", aiCareLabels.bedtime],
                  ["weatherCare", aiCareLabels.weatherCare],
                ] as const).map(([key, label]) => {
                  const isActive = pushSubscribed && aiCareSettings[key];
                  return (
                    <button key={key}
                      onClick={() => {
                        if (!pushSubscribed) {
                          handlePushToggle(true);
                        } else {
                          updateAICareOption(key, !aiCareSettings[key]);
                        }
                      }}
                      className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                      style={isActive
                        ? { background: `${SCAN_FROM}20`, color: SCAN_TO, border: `1px solid ${SCAN_TO}33` }
                        : { background: TINT_NEUTRAL, color: "#9A8F80", border: "1px solid #ECE6DE" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Fonday 디바이스 티저 (잠금 → 기대감 카드) ── */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>COMING SOON</p>
                    <p className="text-[17px] font-semibold mt-1" style={{ color: DEEP_GREEN }}>{t("result.deviceTeaser.title")}</p>
                    <p className="text-xs text-stone-400 mt-1">{t("result.deviceTeaser.sub")}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: TINT_WARM }}>
                    <Microscope className="w-6 h-6" style={{ color: "#C97062" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: Thermometer, label: t("result.locked.skinTemp"), color: "#E09882" },
                    { icon: Droplets, label: t("result.locked.moisture"), color: "#3B82C4" },
                    { icon: Flame, label: t("result.locked.oil"), color: "#F59E0B" },
                    { icon: Shield, label: t("result.locked.barrier"), color: "#10B981" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                        <p className="text-xs font-semibold text-stone-600">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={() => setShowWaitlist(true)}
                  className="w-full h-11 rounded-2xl text-[12px] font-semibold"
                  style={{ background: TINT_WARM, color: SCAN_TO }}>
                  <span className="flex items-center gap-1.5">{t("result.earlybird")} <ArrowRight className="w-4 h-4" /></span>
                </Button>
              </div>
            </div>
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
