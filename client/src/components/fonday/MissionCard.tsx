import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { DEEP_GREEN, TINT_NEUTRAL, MISSION_POINTS, fadeChild, BORDER_COLOR, FONT_DISPLAY } from "./constants";
import type { MissionState } from "./types";
import { getMissions, todayStr } from "./utils";

// ─── 미션 카드 (idle 화면) ────────────────────────────────────────
export function MissionCard() {
  const { t } = useTranslation();
  const [missions, setMissions] = useState<MissionState>(() => getMissions());
  const [expanded, setExpanded] = useState(false);

  // 오늘 날짜 기준으로 daily 미션 표시 여부 결정
  const today = todayStr();
  const isDailyCompleted = missions.dailyDate === today && missions.dailyCompleted;

  const ALL_MISSION_IDS = ["daily_scan", "daily_improve", "daily_challenge", "first_scan", "streak_3", "streak_7", "streak_30", "score_70", "score_80", "challenge", "share"];
  const isDailyImproved = missions.dailyDate === today && missions.dailyImproved;
  const isDailyChallenged = missions.dailyDate === today && missions.dailyChallenged;

  const missionItems = ALL_MISSION_IDS.map(id => {
    let done: boolean;
    if (id === "daily_scan") done = isDailyCompleted;
    else if (id === "daily_improve") done = isDailyImproved;
    else if (id === "daily_challenge") done = isDailyChallenged;
    else done = missions.completed.includes(id);
    return { id, done, points: MISSION_POINTS[id] || 0 };
  });

  const incomplete = missionItems.filter(m => !m.done);
  const complete = missionItems.filter(m => m.done);
  const visible = expanded ? missionItems : [...incomplete.slice(0, 3), ...complete.slice(0, 1)].slice(0, 4);
  const focusedItems = incomplete.length > 0 ? incomplete : complete;

  return (
    <motion.div variants={fadeChild} className="mb-4">
      <div className="rounded-2xl px-4 py-3.5"
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: DEEP_GREEN }}>{t("mission.title")}</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {focusedItems.slice(0, 2).map(({ id }) => t(`mission.${id}`)).join(" · ")}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "#FFF7ED", color: "#B45309" }}>
            {t("mission.points", { n: missions.totalPoints })}
          </span>
        </div>
        <div className="space-y-2">
          {visible.map(({ id, done, points }) => (
            <div key={id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
              style={{ background: done ? "#FAFAF9" : TINT_NEUTRAL }}>
              <div className="flex items-center gap-2 min-w-0">
                {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-stone-300" />}
                <span className={`text-[12px] font-medium truncate ${done ? "text-stone-400 line-through" : "text-[#6B5D55]"}`}>
                  {t(`mission.${id}`)}
                </span>
              </div>
              <span className="text-xs font-semibold shrink-0 text-amber-600">+{points}pt</span>
            </div>
          ))}
        </div>
        {missionItems.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 w-full text-xs font-medium text-stone-400 text-center py-1"
          >
            {expanded ? t("mission.hide") : t("mission.showAll")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
