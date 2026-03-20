import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DEEP_GREEN, SCAN_TO } from "./constants";

type QuestItem = {
  id: string;
  label: string;
  reward: string;
  detail: string;
  done: boolean;
  accent: string;
};

export function ResultQuestSheet({
  open,
  onClose,
  totalPoints,
  doneCount,
  totalCount,
  questBoard,
}: {
  open: boolean;
  onClose: () => void;
  totalPoints: number;
  doneCount: number;
  totalCount: number;
  questBoard: QuestItem[];
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative bg-white rounded-t-[32px] w-full max-w-md px-5 pt-5 pb-8 shadow-2xl max-h-[82vh] overflow-y-auto"
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>
                  {t("result.actionCard.questEyebrow")}
                </p>
                <p className="text-base font-bold mt-1" style={{ color: DEEP_GREEN }}>
                  {t("result.actionCard.questTitle", { done: doneCount, total: totalCount })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold"
                  style={{ background: "#FFF7ED", color: "#D97706" }}
                >
                  {totalPoints}pt
                </span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"
                  aria-label="Close quest board"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {questBoard.map((quest) => (
                <div
                  key={`sheet-${quest.id}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3"
                  style={{
                    background: quest.done ? "#F8FFFB" : "#FFFFFF",
                    border: `1px solid ${quest.done ? "#DDF5E8" : "#F3E7E3"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: quest.done ? quest.accent : `${quest.accent}18` }}
                  >
                    {quest.done ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Star className="w-4 h-4" style={{ color: quest.accent }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold leading-[1.4] text-kr-pretty" style={{ color: DEEP_GREEN }}>
                        {quest.label}
                      </p>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: quest.done ? "#059669" : quest.accent }}
                      >
                        {quest.reward}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5 leading-[1.45] text-kr-pretty">
                      {quest.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
