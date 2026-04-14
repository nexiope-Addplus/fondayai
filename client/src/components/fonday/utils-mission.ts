// ─── 미션 / 스트릭 / 출석 / 공유 시스템 ──────────────────────────────────────

import {
  StreakData,
  MissionState,
  AttendanceData,
} from "./types";
import {
  MISSION_POINTS,
  TOSS_PROMOTION_CODE,
  TOSS_VIRAL_MODULE_ID,
} from "./constants";
import { todayStr, isTossMiniApp } from "./utils-platform";

// ─── 스트릭 시스템 ────────────────────────────────────────────────────────────

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem("fonday_streak");
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {}
  return { count: 0, lastScanDate: "", longest: 0, lastScore: 0 };
}

export function updateStreak(newScore: number): { streak: StreakData; isNewMilestone: boolean; deltaScore: number } {
  const prev = getStreak();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newCount = 1;
  if (prev.lastScanDate === today) {
    newCount = prev.count; // 오늘 이미 스캔 — count 유지
  } else if (prev.lastScanDate === yesterday) {
    newCount = prev.count + 1; // 어제 스캔 — streak++
  }
  // else: 2일+ 경과 또는 첫 스캔 → reset to 1

  const longest = Math.max(newCount, prev.longest);
  const deltaScore = prev.lastScore > 0 ? newScore - prev.lastScore : 0;
  const isNewMilestone = [3, 7, 30].includes(newCount) && prev.lastScanDate !== today;

  const streak: StreakData = { count: newCount, lastScanDate: today, longest, lastScore: newScore };
  try { localStorage.setItem("fonday_streak", JSON.stringify(streak)); } catch {}
  return { streak, isNewMilestone, deltaScore };
}

export function getDaysSinceLastScan(): number | null {
  const { lastScanDate } = getStreak();
  if (!lastScanDate) return null;
  const diffMs = Date.now() - new Date(lastScanDate).getTime();
  return Math.floor(diffMs / 86400000);
}

// ─── 미션 시스템 ──────────────────────────────────────────────────────────────

export function getMissions(): MissionState {
  try {
    const raw = localStorage.getItem("fonday_missions");
    if (raw) return JSON.parse(raw) as MissionState;
  } catch {}
  return { completed: [], dailyDate: "", dailyCompleted: false, dailyImproved: false, dailyChallenged: false, totalPoints: 0 };
}

/** 토스 프로모션 포인트 지급 (토스 미니앱일 때만) */
async function grantTossReward(missionId: string, amount: number): Promise<void> {
  if (!isTossMiniApp()) return;
  try {
    const { grantPromotionReward } = await import("@apps-in-toss/web-framework");
    const result = await grantPromotionReward({
      params: { promotionCode: TOSS_PROMOTION_CODE, amount },
    });
    if (result && typeof result === "object" && "key" in result) {
      console.log(`[reward] ${missionId} +${amount}P 지급 성공`);
    } else if (result && typeof result === "object" && "errorCode" in result) {
      const err = result as { errorCode: string; message?: string };
      console.warn(`[reward] ${missionId} 실패:`, err.errorCode, err.message);
    }
  } catch (e) {
    console.warn(`[reward] ${missionId} 지급 오류:`, e);
  }
}

function completeMission(state: MissionState, id: string): boolean {
  if (state.completed.includes(id)) return false;
  state.completed.push(id);
  const pts = MISSION_POINTS[id] || 0;
  state.totalPoints += pts;
  grantTossReward(id, pts);
  return true;
}

function saveMissions(state: MissionState) {
  try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
}

/** 스캔 완료 시 호출 — first_scan 체크 */
export function checkAndCompleteMissions(): string[] {
  const state = getMissions();
  const today = todayStr();
  const newlyCompleted: string[] = [];

  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyCompleted = false;
    state.dailyImproved = false;
    state.dailyChallenged = false;
  }

  state.dailyCompleted = true;

  if (completeMission(state, "first_scan")) newlyCompleted.push("first_scan");

  saveMissions(state);
  return newlyCompleted;
}

/** 화장품 등록 시 호출 — first_cosmetic, cosmetic_10 체크 */
export function checkCosmeticMissions(cosmeticCount: number): string[] {
  if (cosmeticCount < 1) return [];
  const state = getMissions();
  const newlyCompleted: string[] = [];
  if (completeMission(state, "first_cosmetic")) newlyCompleted.push("first_cosmetic");
  if (cosmeticCount >= 10 && completeMission(state, "cosmetic_10")) newlyCompleted.push("cosmetic_10");
  saveMissions(state);
  return newlyCompleted;
}

/** 일기 작성 시 호출 — first_diary, diary_streak_10 체크 */
export function checkDiaryMissions(consecutiveDays: number): string[] {
  if (consecutiveDays < 1) return [];
  const state = getMissions();
  const newlyCompleted: string[] = [];
  if (completeMission(state, "first_diary")) newlyCompleted.push("first_diary");
  if (consecutiveDays >= 10 && completeMission(state, "diary_streak_10")) newlyCompleted.push("diary_streak_10");
  saveMissions(state);
  return newlyCompleted;
}

// ─── 출석 시스템 ──────────────────────────────────────────────────────────────

export function getAttendance(): AttendanceData {
  try {
    const raw = localStorage.getItem("fonday_attendance");
    if (raw) return JSON.parse(raw) as AttendanceData;
  } catch {}
  return { dates: [], totalPoints: 0 };
}

export function checkinToday(): boolean {
  const data = getAttendance();
  const today = todayStr();
  if (data.dates.includes(today)) return false; // 이미 체크인
  data.dates.push(today);
  data.totalPoints += 3;
  try { localStorage.setItem("fonday_attendance", JSON.stringify(data)); } catch {}
  return true;
}

// ─── 챌린지 / 공유 ────────────────────────────────────────────────────────────

export function markChallengeUsed() {
  const state = getMissions();
  const today = todayStr();
  if (state.dailyDate === today && !state.dailyChallenged) {
    state.dailyChallenged = true;
  }
  saveMissions(state);
}

/** 결과 공유 시 호출 — share 미션 완료 + 토스 포인트 지급 */
export function markShareUsed(): string[] {
  const state = getMissions();
  const newlyCompleted: string[] = [];
  if (completeMission(state, "share")) newlyCompleted.push("share");
  saveMissions(state);
  return newlyCompleted;
}

/** 토스 친구초대 공유 리워드 (contactsViral) */
export function openContactsViral(onReward?: (amount: number, unit: string) => void): void {
  if (!isTossMiniApp()) return;
  import("@apps-in-toss/web-framework").then(({ contactsViral }) => {
    const cleanup = contactsViral({
      options: { moduleId: TOSS_VIRAL_MODULE_ID },
      onEvent: (event: { type: string; data: any }) => {
        if (event.type === "sendViral") {
          console.log("[viral] 리워드 지급:", event.data.rewardAmount, event.data.rewardUnit);
          onReward?.(event.data.rewardAmount, event.data.rewardUnit);
        } else if (event.type === "close") {
          console.log("[viral] 종료:", event.data.closeReason);
          cleanup?.();
        }
      },
      onError: (error: unknown) => {
        console.warn("[viral] 에러:", error);
        cleanup?.();
      },
    });
  }).catch((e) => console.warn("[viral] import 실패:", e));
}
