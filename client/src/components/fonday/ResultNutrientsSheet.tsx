import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertCircle, Moon, Sun, Utensils, X } from "lucide-react";

import {
  BG_MUTED,
  BORDER_COLOR,
  FONT_DISPLAY,
  NUTRIENT_COLORS,
  NUTRIENT_ICONS,
  TEXT_TERTIARY,
  BG_BASE,
  COLOR_WARNING,
} from "./constants";

export function ResultNutrientsSheet({
  open,
  onClose,
  finalType,
  avoidLunch,
  avoidDinner,
}: {
  open: boolean;
  onClose: () => void;
  finalType: string;
  avoidLunch: Array<{ food: string; why: string }>;
  avoidDinner: Array<{ food: string; why: string }>;
}) {
  const { t } = useTranslation();
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            className="relative bg-white rounded-t-3xl w-full max-w-sm max-h-[90dvh] flex flex-col"
            style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) onClose();
            }}
          >
            <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F59E0B" }}>
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: COLOR_WARNING }}>{t("nutrients.sectionTitle")}</h3>
                    <p className="text-xs" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("nutrients.sectionSub")}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-6 pb-8 space-y-3">
                {finalType.split("").filter((letter) => letter in NUTRIENT_COLORS).map((letter, index) => {
                  const items = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
                  const nutrient = items?.[0];
                  if (!nutrient) return null;
                  const color = NUTRIENT_COLORS[letter];

                  return (
                    <motion.div
                      key={letter}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex gap-3 p-4 rounded-2xl border"
                      style={{ background: BG_MUTED, borderColor: BORDER_COLOR }}
                    >
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border" style={{ background: BG_BASE, borderColor: BORDER_COLOR }}>
                          {NUTRIENT_ICONS[letter]}
                        </div>
                        <p className="text-xs font-normal text-center mt-0.5" style={{ fontFamily: FONT_DISPLAY, color }}>{letter}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold mb-0.5" style={{ color }}>{nutrient.name}</p>
                        <p className="text-[12px] text-stone-500 leading-relaxed mb-1.5">{nutrient.why}</p>
                        <p className="text-xs text-stone-400">
                          <span className="font-semibold" style={{ color }}>{t("nutrients.foodLabel")} </span>
                          {nutrient.foods}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3 pt-2 border-t border-stone-100">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-semibold" style={{ color: COLOR_WARNING }}>{t("nutrients.avoidTitle")}</p>
                  </div>

                  <div className="rounded-2xl p-4 mb-2.5 border" style={{ background: BG_MUTED, borderColor: BORDER_COLOR }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Sun className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-xs font-semibold text-orange-700">{t("nutrients.avoidLunch")}</span>
                    </div>
                    <div className="space-y-3">
                      {avoidLunch.map(({ food, why }, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-xs font-semibold text-orange-400 shrink-0 mt-0.5">✕</span>
                          <div>
                            <p className="text-[12px] font-semibold text-[#6B5D55]">{food}</p>
                            <p className="text-xs text-stone-400">{why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 border" style={{ background: BG_MUTED, borderColor: BORDER_COLOR }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Moon className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-xs font-semibold text-violet-700">{t("nutrients.avoidDinner")}</span>
                    </div>
                    <div className="space-y-3">
                      {avoidDinner.map(({ food, why }, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-xs font-semibold text-violet-400 shrink-0 mt-0.5">✕</span>
                          <div>
                            <p className="text-[12px] font-semibold text-[#6B5D55]">{food}</p>
                            <p className="text-xs text-stone-400">{why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
