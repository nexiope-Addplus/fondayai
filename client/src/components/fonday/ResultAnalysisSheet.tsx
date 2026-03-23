import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Activity, LayoutGrid, Shield, Sparkles, X, Zap } from "lucide-react";

import {
  BAUMANN_COLORS,
  DEEP_GREEN,
  DEEP_GREEN_LIGHT,
  SCAN_FROM,
  SCAN_TO,
  SCORE_COLORS,
  SCORE_ICONS,
  TINT_NEUTRAL,
  TINT_WARM,
} from "./constants";

type ScoreItem = {
  score: number;
  comment?: string;
};

type SkinReportItem = {
  area: string;
  finding: string;
};

export function ResultAnalysisSheet({
  open,
  onClose,
  aiComment,
  scores,
  skinReport,
  finalType,
}: {
  open: boolean;
  onClose: () => void;
  aiComment?: string;
  scores: ScoreItem[];
  skinReport: SkinReportItem[];
  finalType: string;
}) {
  const { t } = useTranslation();
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
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
            <div
              className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
                  >
                    <LayoutGrid className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>
                      {t("modal.analysis.title")}
                    </h3>
                    <p className="text-xs text-stone-400">{t("modal.analysis.sub")}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-stone-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-6 pb-8 space-y-3">
                {aiComment && (
                  <div className="p-4 rounded-2xl" style={{ background: TINT_WARM }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#FFFFFF" }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: SCAN_TO }} />
                      </div>
                      <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>
                        {t("result.aiComment")}
                      </p>
                    </div>
                    <p className="text-[13px] text-stone-600 leading-relaxed text-kr-pretty">{aiComment}</p>
                  </div>
                )}

                {scores.map((item, index) => {
                  const Icon = SCORE_ICONS[index] || Zap;
                  const color = SCORE_COLORS[index] || DEEP_GREEN;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-2xl bg-stone-50"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                          <Icon className="w-3 h-3" style={{ color }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color }}>
                          {t(`scores.${index}`)}
                        </span>
                        <span className="ml-auto text-xs font-semibold" style={{ color }}>
                          {item.score}
                          {t("result.scoreSuffix")}
                        </span>
                      </div>
                      <p className="text-[13px] text-stone-600 leading-relaxed">{item.comment || "-"}</p>
                    </motion.div>
                  );
                })}

                {skinReport.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                      <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>
                        {t("modal.analysis.skinReport")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {skinReport.map((item, index) => (
                        <div key={index} className="p-3 rounded-2xl" style={{ background: TINT_NEUTRAL }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: DEEP_GREEN_LIGHT }}>
                            {item.area}
                          </p>
                          <p className="text-xs text-stone-500 leading-snug">{item.finding}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                    <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>
                      {t("modal.analysis.baumannDetail", { type: finalType })}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {finalType.split("").map((letter, index) => {
                      const color = BAUMANN_COLORS[letter];
                      if (!color) return null;

                      return (
                        <div
                          key={index}
                          className="p-3 rounded-2xl border"
                          style={{ background: `${color}10`, borderColor: `${color}30` }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[17px] font-black" style={{ color }}>
                              {letter}
                            </span>
                            <span className="text-[12px] font-bold text-stone-700">
                              {t(`baumann.${letter}.name`)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 leading-snug">
                            {t(`baumann.${letter}.desc`)}
                          </p>
                        </div>
                      );
                    })}
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
