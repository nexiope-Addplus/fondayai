import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Leaf, Sparkles, Star, X } from "lucide-react";

import { DEEP_GREEN, SCAN_TO, TINT_GREEN, TINT_WARM } from "./constants";

export function ResultImprovementsSheet({
  open,
  onClose,
  improvements,
  cosmetics,
}: {
  open: boolean;
  onClose: () => void;
  improvements: Array<{ title: string; desc: string }>;
  cosmetics: Array<{ type: string; key: string; reason: string }>;
}) {
  const { t } = useTranslation();
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: DEEP_GREEN }}>
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>{t("modal.improvements.title")}</h3>
                    <p className="text-xs text-stone-400">{t("modal.improvements.sub")}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-6 pb-8 space-y-3">
                {improvements.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-3 p-4 rounded-2xl"
                    style={{ background: index === 0 ? TINT_WARM : index === 1 ? TINT_GREEN : "#F6F4FB" }}
                  >
                    <div className="shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ background: "#FFFFFF", color: index === 0 ? SCAN_TO : index === 1 ? DEEP_GREEN : "#7C3AED" }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-xs font-semibold text-center mt-0.5" style={{ color: index === 0 ? SCAN_TO : index === 1 ? DEEP_GREEN : "#7C3AED" }}>
                        STEP
                      </p>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-stone-800 mb-0.5">{item.title}</p>
                      <p className="text-[12px] text-stone-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
                {improvements.length === 0 && (
                  <p className="text-center text-sm text-stone-400 py-6">{t("modal.improvements.loading")}</p>
                )}

                {cosmetics.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                      <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{t("modal.improvements.cosmetics")}</p>
                    </div>
                    {cosmetics.map((item, index) => (
                      <motion.div
                        key={`cosmetic-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.07 }}
                        className="flex items-start gap-3 p-4 rounded-2xl"
                        style={{ background: "#FFF7ED" }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFFFFF" }}>
                          <Star className="w-4 h-4" style={{ color: "#D97706" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-bold text-stone-800">{item.type}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FFFFFF", color: "#D97706" }}>
                              {item.key}
                            </span>
                          </div>
                          <p className="text-[12px] text-stone-500 leading-relaxed">{item.reason}</p>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
