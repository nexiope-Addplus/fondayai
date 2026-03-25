import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { NotebookPen, Flame, LineChart as LineChartIcon } from "lucide-react";

import { DEEP_GREEN, SCAN_TO, TINT_NEUTRAL, TINT_WARM, BORDER_COLOR, FONT_DISPLAY, BG_MUTED } from "./constants";
import { Card, CardContent } from "@/components/ui/card";

export function ResultDiaryCard({
  history,
  overallScore,
  previousScore,
  streakCount,
  avatar,
  onOpenDiary,
}: {
  history: Array<{ createdAt: string; overallScore?: string | number }>;
  overallScore: number;
  previousScore: number | null;
  streakCount: number;
  avatar?: string | null;
  onOpenDiary?: () => void;
}) {
  const { t } = useTranslation();
  const scanCount = history.filter((entry) => new Date(entry.createdAt).toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10)).length + 1;
  const totalScans = (() => {
    try {
      const stored = parseInt(localStorage.getItem("fonday_total_scans") ?? "0", 10);
      return stored > 0 ? stored : history.length + 1;
    } catch {
      return history.length + 1;
    }
  })();
  const delta = previousScore !== null ? overallScore - previousScore : 0;

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => onOpenDiary?.()} className="cursor-pointer">
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: DEEP_GREEN }}>
              <LineChartIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: DEEP_GREEN }}>{t("result.diary.title")}</p>
              <p className="text-xs text-stone-400">{t("result.diary.scanCount", { n: scanCount })}</p>
            </div>
            {avatar && <img src={avatar} alt="" aria-hidden="true" className="w-7 h-7 rounded-full shrink-0" />}
          </div>

          <div className="mt-3 rounded-2xl p-3" style={{ background: delta > 0 ? "#F0FDF4" : delta < 0 ? "#FFF5F5" : "#F8F7F5" }}>
            {previousScore !== null ? (
              <div className="flex items-center gap-3">
                <span className="text-[28px] font-normal leading-none" style={{ fontFamily: FONT_DISPLAY, color: delta > 0 ? "#059669" : delta < 0 ? "#DC2626" : "#A8A29E" }}>
                  {delta > 0 ? "▲" : delta < 0 ? "▼" : "―"} {t("result.diary.deltaPoint", { n: Math.abs(delta) })}
                </span>
                <p className="text-xs text-stone-500 leading-snug whitespace-pre-line">
                  {delta > 0 ? t("result.diary.improved") : delta < 0 ? t("result.diary.worse") : t("result.diary.noChange")}
                </p>
              </div>
            ) : (
              <p className="text-[12px] font-semibold text-stone-500">{t("result.diary.firstScan")}</p>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <div className="flex-1 rounded-2xl py-2 px-2 text-center" style={{ background: TINT_WARM }}>
              <p className="text-xs font-semibold text-stone-400 mb-0.5">{t("result.diary.streak")}</p>
              <p className="text-sm font-normal flex items-center justify-center gap-0.5" style={{ fontFamily: FONT_DISPLAY, color: SCAN_TO }}>
                {streakCount || 1}
                <Flame className="w-3.5 h-3.5 inline ml-0.5" style={{ color: SCAN_TO }} />
              </p>
            </div>
            <div className="flex-1 rounded-2xl py-2 px-2 text-center" style={{ background: "#F0FDF4" }}>
              <p className="text-xs font-semibold text-stone-400 mb-0.5">{t("result.totalScans")}</p>
              <p className="text-sm font-normal" style={{ fontFamily: FONT_DISPLAY, color: "#059669" }}>{totalScans}</p>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onOpenDiary?.();
              }}
              className="flex-1 rounded-2xl py-2 px-2 flex flex-col items-center justify-center gap-0.5 text-white active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, #4A7C6E)` }}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <p className="text-xs font-semibold">{t("result.diaryView")}</p>
            </button>
          </div>

          {history.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-400 mb-1.5">{t("result.prevRecords")}</p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {[...history].slice(0, 5).map((entry, index) => {
                  const score = parseInt(String(entry.overallScore || "0"), 10);
                  const date = new Date(entry.createdAt);
                  const label = `${date.getMonth() + 1}/${date.getDate()}`;
                  return (
                    <div key={index} className="flex flex-col items-center shrink-0 px-2.5 py-1.5 rounded-xl" style={{ background: TINT_NEUTRAL, minWidth: 36 }}>
                      <p className="text-xs font-semibold" style={{ color: SCAN_TO }}>{score}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
