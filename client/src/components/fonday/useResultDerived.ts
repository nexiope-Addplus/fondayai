import { useTranslation } from "react-i18next";
import type { CosmeticItem, StreakData, TodoItem } from "./types";
import { SCORE_COLORS, DEEP_GREEN } from "./constants";
import {
  todayStr,
  getAttendance,
  getDiaryTodos, saveDiaryTodos,
  buildCosmeticsInsights, buildRoutineGuide, buildStableBaumannType,
} from "./utils";

export function useResultDerived(params: {
  analysisResult: any;
  scores: any[];
  history: any[];
  myCosmetics: CosmeticItem[];
  currentStreak: StreakData;
  todayTodoProgress: { done: number; total: number };
  todayRoutineTodos: TodoItem[];
  setTodayRoutineTodos: (v: TodoItem[]) => void;
  missionState: any;
}) {
  const { t } = useTranslation();
  const {
    analysisResult, scores, history, myCosmetics,
    currentStreak, todayTodoProgress, todayRoutineTodos,
    setTodayRoutineTodos, missionState,
  } = params;

  const overallScore = scores[0]?.score || 0;
  const stableBaumann = buildStableBaumannType(scores, history);
  const finalType = stableBaumann.type;
  try {
    localStorage.setItem("fonday_prev_scores", JSON.stringify(scores.map((s: any) => s.score)));
    localStorage.setItem("fonday_baumann_type", finalType);
  } catch {}

  const previousScore = history.length > 0 ? parseInt(history[0]?.overallScore || "0", 10) || null : null;
  const cosmeticsInsights = buildCosmeticsInsights(myCosmetics, overallScore, previousScore, t);
  const routineGuide = buildRoutineGuide(myCosmetics, t);

  const todayRoutine = analysisResult?.prediction?.good?.routine ?? [];
  const morningTask = todayRoutine[0] ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.fallbackFocus");
  const eveningTask = todayRoutine[1] ?? analysisResult?.improvements?.[1]?.title ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.eveningFallback");
  const morningRoutineItems = routineGuide.amSteps.length > 0 ? routineGuide.amSteps : [morningTask];
  const eveningRoutineItems = routineGuide.pmSteps.length > 0 ? routineGuide.pmSteps : [eveningTask];
  const routineUpdateItems = [
    ...morningRoutineItems.map((item) => `AM · ${item}`),
    ...eveningRoutineItems.map((item) => `PM · ${item}`),
  ];

  const getRoutineTodoState = (period: "AM" | "PM", label: string) => {
    const prefixed = `${period} · ${label}`;
    return todayRoutineTodos.find((todo) => todo.text === prefixed || todo.text === label);
  };
  const isRoutinePeriodComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return false;
    return items.every((item) => Boolean(getRoutineTodoState(period, item)?.done));
  };
  const setRoutinePeriodCompletion = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return;
    const next = [...todayRoutineTodos];
    const shouldComplete = !isRoutinePeriodComplete(period, items);
    items.forEach((item) => {
      const prefixed = `${period} · ${item}`;
      const existingIndex = next.findIndex((todo) => todo.text === prefixed || todo.text === item);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], text: prefixed, done: shouldComplete };
      } else {
        next.push({ text: prefixed, done: shouldComplete });
      }
    });
    setTodayRoutineTodos(next);
    saveDiaryTodos(todayStr(), next);
  };

  const routineDone = todayTodoProgress.done;
  const routineTotal = todayTodoProgress.total || todayRoutine.length;
  const routineComplete = routineTotal > 0 && routineDone === routineTotal;
  const morningRoutineComplete = isRoutinePeriodComplete("AM", morningRoutineItems);
  const eveningRoutineComplete = isRoutinePeriodComplete("PM", eveningRoutineItems);
  const completedRoutinePhases = [morningRoutineComplete, eveningRoutineComplete].filter(Boolean).length;

  const weakestScores: { index: number; score: number }[] = scores
    .slice(1)
    .map((item: any, index: number) => ({ index: index + 1, score: item.score }))
    .sort((a: { index: number; score: number }, b: { index: number; score: number }) => a.score - b.score)
    .slice(0, 2);
  const weakestSummary = weakestScores.map(({ index }: { index: number; score: number }) => t(`scores.${index}`)).join(" · ");
  const scoreDelta = previousScore !== null ? overallScore - previousScore : null;
  const previewScoreItems: { idx: number; score: number; color: string }[] = [1, 2, 3, 5]
    .map((idx) => ({ idx, score: scores[idx]?.score ?? 0, color: SCORE_COLORS[idx] || DEEP_GREEN }))
    .filter((item: { idx: number; score: number; color: string }) => item.score > 0);

  const nextStreakGoal = [3, 7, 30].find((goal) => goal > (currentStreak.count || 0)) ?? null;
  const daysToGoal = nextStreakGoal ? Math.max(nextStreakGoal - (currentStreak.count || 0), 0) : 0;
  const attendance = getAttendance();
  const totalPoints = missionState.totalPoints + attendance.totalPoints;

  return {
    overallScore,
    finalType,
    previousScore,
    cosmeticsInsights,
    routineGuide,
    morningTask,
    eveningTask,
    morningRoutineItems,
    eveningRoutineItems,
    routineUpdateItems,
    setRoutinePeriodCompletion,
    routineComplete,
    morningRoutineComplete,
    eveningRoutineComplete,
    completedRoutinePhases,
    weakestSummary,
    scoreDelta,
    previewScoreItems,
    nextStreakGoal,
    daysToGoal,
    totalPoints,
  };
}
