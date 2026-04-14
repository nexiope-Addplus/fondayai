import { useTranslation } from "react-i18next";
import type { MissionState } from "./types";
import { MISSION_POINTS, NUTRIENT_COLORS, COLOR_INFO } from "./constants";
import { pickFoodOption, dedupeFoods } from "./utils";

export interface QuestItem {
  id: string;
  done: boolean;
  label: string;
  reward: string;
  detail: string;
  accent: string;
}

export interface UseResultQuestsParams {
  missionState: MissionState;
  routineComplete: boolean;
  todayHasMemo: boolean;
  completedRoutinePhases: number;
  scores: any[];
  overallScore: number;
  finalType: string;
}

export function useResultQuests(params: UseResultQuestsParams): {
  questBoard: QuestItem[];
  essentialQuests: QuestItem[];
  questDoneCount: number;
  questProgressPct: number;
  questStatusDetail: string;
  totalQuestPoints: number;
  avoidLunch: { food: string; why: string }[];
  avoidDinner: { food: string; why: string }[];
} {
  const { t } = useTranslation();
  const {
    missionState, routineComplete, todayHasMemo,
    completedRoutinePhases, scores, overallScore, finalType,
  } = params;

  const questBoard: QuestItem[] = [
    {
      id: "scan",
      done: missionState.dailyCompleted,
      label: t("result.actionCard.questScan"),
      reward: missionState.completed.includes("first_scan") ? t("result.actionCard.questDone") : `+${MISSION_POINTS.first_scan}P`,
      detail: t("result.actionCard.questScanDetail"),
      accent: "#C97062",
    },
    {
      id: "routine",
      done: routineComplete,
      label: t("result.actionCard.questRoutine"),
      reward: routineComplete ? t("result.actionCard.questDone") : `${completedRoutinePhases}/2`,
      detail: t("result.actionCard.questRoutineDetail"),
      accent: "#059669",
    },
    {
      id: "memo",
      done: todayHasMemo,
      label: t("result.actionCard.questMemo"),
      reward: todayHasMemo ? t("result.actionCard.questDone") : t("result.actionCard.questPending"),
      detail: t("result.actionCard.questMemoDetail"),
      accent: COLOR_INFO,
    },
    {
      id: "challenge_share",
      done: missionState.completed.includes("share"),
      label: t("result.actionCard.questChallenge"),
      reward: missionState.completed.includes("share") ? t("result.actionCard.questDone") : `+${MISSION_POINTS.share}P`,
      detail: t("result.actionCard.questChallengeDetail"),
      accent: COLOR_INFO,
    },
  ];

  const essentialQuestIds = new Set(["scan", "routine", "memo"]);
  const essentialQuests = questBoard.filter((quest) => essentialQuestIds.has(quest.id));
  const questDoneCount = questBoard.filter((quest) => quest.done).length;
  const questProgressPct = Math.round((questDoneCount / questBoard.length) * 100);
  const firstIncompleteQuest = questBoard.find((q) => !q.done);
  const questStatusDetail = questDoneCount === questBoard.length
    ? t("result.actionCard.statusDone")
    : firstIncompleteQuest
      ? t("result.actionCard.statusNext", { tasks: firstIncompleteQuest.label })
      : "";

  // 날짜 기반 시드 — 매일 다른 음식 추천
  const dailySeed = (() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  })();

  // 점수 기반 피해야 할 음식 키
  const scoreAvoidKeys: string[] = [];
  if ((scores[1]?.score ?? 100) < 50) scoreAvoidKeys.push("hydration");
  if ((scores[6]?.score ?? 0) > 60)   scoreAvoidKeys.push("trouble");
  if ((scores[7]?.score ?? 0) > 60)   scoreAvoidKeys.push("darkCircle");
  if ((scores[8]?.score ?? 100) < 50) scoreAvoidKeys.push("glow");

  // 점심 피해야 할 음식
  const avoidLunch: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.lunch, overallScore + idx + l.charCodeAt(0) + dailySeed);
      return food ? { food, why: d.lunchWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 1]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  // 저녁 피해야 할 음식
  const avoidDinner: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.dinner, overallScore + idx + l.charCodeAt(0) + 5 + dailySeed);
      return food ? { food, why: d.dinnerWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 5]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + 7 + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  return {
    questBoard,
    essentialQuests,
    questDoneCount,
    questProgressPct,
    questStatusDetail,
    totalQuestPoints: 0, // placeholder — actual total computed in ResultScreen from missionState + attendance
    avoidLunch,
    avoidDinner,
  };
}
