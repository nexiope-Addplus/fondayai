import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { DEEP_GREEN, SCAN_TO, TINT_NEUTRAL } from "./constants";

export function RoutineUpdateSheet({ open, onClose, morningRoutineItems, eveningRoutineItems, onApply }: any) {
  const { t } = useTranslation();
  return (
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8 shadow-2xl"
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <p className="text-base font-bold text-center" style={{ color: DEEP_GREEN }}>{t("cosmetics.routineUpdateTitle")}</p>
              <p className="text-[12px] text-stone-500 text-center mt-2 leading-relaxed text-kr-pretty">{t("cosmetics.routineUpdateDesc")}</p>
              <div className="mt-5 rounded-3xl p-4" style={{ background: TINT_NEUTRAL }}>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #DCE9E4" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: DEEP_GREEN }}>{t("cosmetics.amBtn")}</p>
                    <div className="mt-2 space-y-1.5">
                      {morningRoutineItems.map((item: any, index: number) => (
                        <div key={`suggest-am-${index}`} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: DEEP_GREEN }}>{index + 1}</span>
                          <p className="text-[11px] font-semibold text-stone-700 leading-tight text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #F2DED6" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.pmBtn")}</p>
                    <div className="mt-2 space-y-1.5">
                      {eveningRoutineItems.map((item: any, index: number) => (
                        <div key={`suggest-pm-${index}`} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: SCAN_TO }}>{index + 1}</span>
                          <p className="text-[11px] font-semibold text-stone-700 leading-tight text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold text-stone-600 bg-stone-50"
                >
                  {t("cosmetics.routineUpdateKeep")}
                </button>
                <button
                  onClick={() => {
                    onApply();
                  }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: DEEP_GREEN }}
                >
                  {t("cosmetics.routineUpdateApply")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
