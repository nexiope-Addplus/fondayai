import {
  AnalysisResult,
  StreakData,
  MissionState,
  AttendanceData,
  AICareSettings,
  ReminderSettings,
  TodoItem,
  DiaryCauseTag,
  CosmeticItem,
  WeatherData,
  WeatherTipKey,
  ReportLang,
  ReportConcernKey,
} from "./types";
import {
  MISSION_POINTS,
  DIARY_CAUSE_TAGS,
  LEGACY_DIARY_CAUSE_TAG_MAP,
  CAUSE_TAG_KEYWORDS,
  CATEGORY_ORDER,
  CATEGORY_FILTERS,
  DEEP_GREEN,
  SCAN_TO,
  SCORE_LABEL_MAP,
} from "./constants";

// ─── 빌드 헬퍼 ───────────────────────────────────────────────────────────────

export function buildPushScoreSummary(result: AnalysisResult | null) {
  if (!result?.scores?.length) return [];

  return [...result.scores]
    .filter((item) => Number.isFinite(Number(item?.score)) && typeof item?.label === "string")
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 3)
    .map((item) => ({
      label: item.label,
      score: Number(item.score),
    }));
}

export function buildBaumannTypeFromResult(result: AnalysisResult | null) {
  const scores = result?.scores || [];
  const isOily = (scores[3]?.score ?? 100) < 50;
  const isSens = (scores[2]?.score ?? 0) > 50;
  const isPig = (scores[5]?.score ?? 0) > 50;
  const isWrink = (scores[4]?.score ?? 100) < 60;

  return `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`;
}

/**
 * 누적 평균 기반 안정적 바우만 타입 판정.
 * 현재 스캔 + 최근 히스토리(최대 4개)의 평균 점수로 판정.
 * 경계값(45~55 / 55~65 for 주름) 구간은 borderline 정보도 반환.
 */
export function buildStableBaumannType(
  currentScores: { label: string; score: number }[],
  history: { scores?: { label: string; score: number }[] }[],
) {
  const recentHistory = history.slice(0, 4);
  const allScoreSets = [currentScores, ...recentHistory.map(h => h.scores || [])].filter(s => s.length >= 6);

  const avg = (index: number): number => {
    const values = allScoreSets.map(s => s[index]?.score).filter((v): v is number => v != null);
    if (values.length === 0) return currentScores[index]?.score ?? 50;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const poreAvg = avg(3);
  const redAvg = avg(2);
  const pigAvg = avg(5);
  const wrinkAvg = avg(4);

  const type = `${poreAvg < 50 ? "O" : "D"}${redAvg > 50 ? "S" : "R"}${pigAvg > 50 ? "P" : "N"}${wrinkAvg < 60 ? "W" : "T"}`;

  const borderline: string[] = [];
  if (poreAvg >= 45 && poreAvg <= 55) borderline.push("O/D");
  if (redAvg >= 45 && redAvg <= 55) borderline.push("S/R");
  if (pigAvg >= 45 && pigAvg <= 55) borderline.push("P/N");
  if (wrinkAvg >= 55 && wrinkAvg <= 65) borderline.push("W/T");

  return { type, borderline, averages: { pore: poreAvg, redness: redAvg, pigment: pigAvg, wrinkle: wrinkAvg } };
}

// ─── 날짜 유틸 ───────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

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

export function checkAndCompleteMissions(streakCount: number, overallScore: number, scoreDelta?: number | null): string[] {
  const state = getMissions();
  const today = todayStr();
  const newlyCompleted: string[] = [];

  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyCompleted = false;
    state.dailyImproved = false;
    state.dailyChallenged = false;
  }

  if (!state.dailyCompleted) {
    state.dailyCompleted = true;
    state.totalPoints += MISSION_POINTS.daily_scan;
    newlyCompleted.push("daily_scan");
  }

  if (scoreDelta != null && scoreDelta > 0 && !state.dailyImproved) {
    state.dailyImproved = true;
    state.totalPoints += MISSION_POINTS.daily_improve;
    newlyCompleted.push("daily_improve");
  }

  const checks = [
    { id: "first_scan", cond: true },
    { id: "streak_3", cond: streakCount >= 3 },
    { id: "streak_7", cond: streakCount >= 7 },
    { id: "streak_30", cond: streakCount >= 30 },
    { id: "score_70", cond: overallScore >= 70 },
    { id: "score_80", cond: overallScore >= 80 },
  ];

  for (const { id, cond } of checks) {
    if (cond && !state.completed.includes(id)) {
      state.completed.push(id);
      state.totalPoints += MISSION_POINTS[id] || 0;
      newlyCompleted.push(id);
    }
  }

  try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
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
  if (!state.completed.includes("challenge")) {
    state.completed.push("challenge");
    state.totalPoints += MISSION_POINTS.challenge;
  }
  if (state.dailyDate === today && !state.dailyChallenged) {
    state.dailyChallenged = true;
    state.totalPoints += MISSION_POINTS.daily_challenge;
  }
  try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
}

export function markShareUsed() {
  const state = getMissions();
  if (!state.completed.includes("share")) {
    state.completed.push("share");
    state.totalPoints += MISSION_POINTS.share;
    try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
  }
}

// ─── 푸시 프롬프트 유틸 ───────────────────────────────────────────────────────

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}
// ─── 햅틱 피드백 ────────────────────────────────────────────────────────────
export function haptic(style: "light" | "medium" | "success" = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    switch (style) {
      case "light": navigator.vibrate(6); break;
      case "medium": navigator.vibrate(12); break;
      case "success": navigator.vibrate([8, 50, 12]); break;
    }
  } catch {}
}

export function isPWA(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone;
}
export function shouldShowPushPrompt(): boolean {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (typeof Notification !== "undefined" && Notification.permission === "denied") return false;
  try {
    const raw = localStorage.getItem("fonday_push_prompt");
    if (!raw) return true;
    const { dismissed, lastDismissed } = JSON.parse(raw);
    if (!dismissed) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastDismissed).getTime()) / 86400000);
    return daysSince >= 7;
  } catch { return true; }
}
export function dismissPushPrompt() {
  try {
    localStorage.setItem("fonday_push_prompt", JSON.stringify({ dismissed: true, lastDismissed: todayStr() }));
  } catch {}
}

// ─── 날씨 팁 키 ───────────────────────────────────────────────────────────────

export function getWeatherTipKey(d: WeatherData): WeatherTipKey {
  if (d.aqi !== null && d.aqi >= 3) return "polluted";
  const id = d.weatherId;
  if (id >= 600 && id < 700) return "snowy";
  if ((id >= 200 && id < 400) || (id >= 500 && id < 600)) return "rainy";
  if (id >= 700 && id < 800) return "foggy";
  if (d.temp < 5) return "cold";
  if ((id === 800 || id === 801) && d.temp >= 28) return "sunny_hot";
  if (id === 800 || id === 801) return "sunny";
  if (d.humidity < 35) return "dry";
  if (d.humidity > 80) return "humid";
  return "cloudy";
}

// ─── 다이어리 메모 유틸 ───────────────────────────────────────────────────────

export function getDiaryMemo(dateStr: string): string {
  try { return localStorage.getItem(`fonday_memo_${dateStr}`) || ""; } catch { return ""; }
}
export function saveDiaryMemo(dateStr: string, text: string) {
  try {
    if (text.trim()) localStorage.setItem(`fonday_memo_${dateStr}`, text.trim());
    else localStorage.removeItem(`fonday_memo_${dateStr}`);
  } catch {}
  // 모든 날짜 dispatch + dateStr 포함 (서버 동기화용)
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}

// ─── 다이어리 원인 태그 유틸 ─────────────────────────────────────────────────

export function getDiaryCauseTags(dateStr: string): DiaryCauseTag[] {
  try {
    const raw = JSON.parse(localStorage.getItem(`fonday_cause_tags_${dateStr}`) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .map((tag) => {
        if (typeof tag !== "string") return null;
        if (DIARY_CAUSE_TAGS.includes(tag as DiaryCauseTag)) return tag as DiaryCauseTag;
        return LEGACY_DIARY_CAUSE_TAG_MAP[tag] ?? null;
      })
      .filter((tag): tag is DiaryCauseTag => Boolean(tag));
  } catch { return []; }
}

export function saveDiaryCauseTags(dateStr: string, tags: DiaryCauseTag[]) {
  try {
    if (tags.length > 0) localStorage.setItem(`fonday_cause_tags_${dateStr}`, JSON.stringify(tags));
    else localStorage.removeItem(`fonday_cause_tags_${dateStr}`);
  } catch {}
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}

export function getCauseTagLabel(t: (key: string, options?: any) => string, tag: DiaryCauseTag) {
  return t(`modal.diary.causeTagOptions.${tag}`);
}

export function suggestCauseTags(text: string): DiaryCauseTag[] {
  const normalized = text.toLowerCase();
  return DIARY_CAUSE_TAGS.filter((tag) => CAUSE_TAG_KEYWORDS[tag].some((keyword) => normalized.includes(keyword.toLowerCase())));
}

// ─── AI 케어 설정 ─────────────────────────────────────────────────────────────

export function getAICareSettings(): AICareSettings {
  try {
    const raw = localStorage.getItem("fonday_ai_care_settings");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AICareSettings>;
      return {
        enabled: Boolean(parsed.enabled),
        scan: parsed.scan ?? true,
        meal: parsed.meal ?? true,
        hydration: parsed.hydration ?? true,
        routine: parsed.routine ?? true,
        routineHour: parsed.routineHour ?? 21,
        routineMinute: parsed.routineMinute ?? 0,
        uvCare: parsed.uvCare ?? true,
        bedtime: parsed.bedtime ?? true,
        weatherCare: parsed.weatherCare ?? true,
      };
    }
  } catch {}
  return {
    enabled: true,
    scan: true,
    meal: true,
    hydration: true,
    routine: true,
    routineHour: 21,
    routineMinute: 0,
    uvCare: true,
    bedtime: true,
    weatherCare: true,
  };
}

export function saveAICareSettings(next: AICareSettings) {
  try { localStorage.setItem("fonday_ai_care_settings", JSON.stringify(next)); } catch {}
}

// ─── 리마인더 설정 ────────────────────────────────────────────────────────────

export function getReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem("fonday_reminder_settings");
    if (raw) return JSON.parse(raw) as ReminderSettings;
  } catch {}
  const aiCare = getAICareSettings();
  return {
    enabled: aiCare.enabled && aiCare.routine,
    hour: aiCare.routineHour,
    minute: aiCare.routineMinute,
    lastNotifiedDate: "",
  };
}

export function saveReminderSettings(next: ReminderSettings) {
  try { localStorage.setItem("fonday_reminder_settings", JSON.stringify(next)); } catch {}
  const aiCare = getAICareSettings();
  saveAICareSettings({
    ...aiCare,
    routine: next.enabled,
    routineHour: next.hour,
    routineMinute: next.minute,
  });
}

// ─── 루틴 Todo 유틸 ───────────────────────────────────────────────────────────

export function getDiaryTodos(dateStr: string): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(`fonday_todos_${dateStr}`) || "[]"); } catch { return []; }
}
export function saveDiaryTodos(dateStr: string, todos: TodoItem[]) {
  try { localStorage.setItem(`fonday_todos_${dateStr}`, JSON.stringify(todos)); } catch {}
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}
export function getDiaryTodoProgress(dateStr: string) {
  const todos = getDiaryTodos(dateStr);
  return {
    total: todos.length,
    done: todos.filter((todo) => todo.done).length,
  };
}
export function initDiaryTodosFromRoutine(dateStr: string, routine: string[]) {
  if (getDiaryTodos(dateStr).length === 0 && routine.length > 0) {
    saveDiaryTodos(dateStr, routine.map(text => ({ text, done: false })));
  }
}

// ─── 날짜/기간 유틸 ───────────────────────────────────────────────────────────

export function getRecentDateStrings(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - index * 86400000);
    return date.toISOString().slice(0, 10);
  }).reverse();
}

export function extractMemoKeywords(memos: string[]): string[] {
  const stopwords = new Set(["오늘", "피부", "정도", "조금", "정말", "그냥", "그리고", "메모", "기록", "루틴"]);
  const counts = new Map<string, number>();
  memos.forEach((memo) => {
    memo
      .replace(/[^0-9A-Za-z가-힣\s]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !stopwords.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

export function getWeeklyReport(entries: { dateStr: string; score: number }[], streakCount: number) {
  const last7DateStrings = getRecentDateStrings(7);
  const entryMap = new Map(entries.map((entry) => [entry.dateStr, entry]));
  const weeklyEntries = last7DateStrings
    .map((dateStr) => {
      const entry = entryMap.get(dateStr);
      const todos = getDiaryTodos(dateStr);
      const memo = getDiaryMemo(dateStr);
      const tags = getDiaryCauseTags(dateStr);
      return {
        dateStr,
        score: entry?.score ?? null,
        todos,
        memo,
        tags,
        completion: todos.length > 0 ? todos.filter((todo) => todo.done).length / todos.length : 0,
      };
    });

  const validScores = weeklyEntries.flatMap((entry) => entry.score === null ? [] : [entry.score]);
  const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
  const bestDay = weeklyEntries.filter((entry) => entry.score !== null).sort((a, b) => (b.score || 0) - (a.score || 0))[0] ?? null;
  const worstDay = weeklyEntries.filter((entry) => entry.score !== null).sort((a, b) => (a.score || 0) - (b.score || 0))[0] ?? null;
  const routineStats = new Map<string, { done: number; total: number }>();
  weeklyEntries.forEach((entry) => {
    entry.todos.forEach((todo) => {
      const stat = routineStats.get(todo.text) || { done: 0, total: 0 };
      stat.total += 1;
      if (todo.done) stat.done += 1;
      routineStats.set(todo.text, stat);
    });
  });
  const rankedRoutines = Array.from(routineStats.entries())
    .filter(([, stat]) => stat.total > 0)
    .map(([text, stat]) => ({ text, rate: stat.done / stat.total, done: stat.done, total: stat.total }))
    .sort((a, b) => b.rate - a.rate);
  const bestRoutine = rankedRoutines[0] ?? null;
  const worstRoutine = rankedRoutines[rankedRoutines.length - 1] ?? null;
  const memos = weeklyEntries.map((entry) => entry.memo).filter(Boolean);
  const keywordSummary = extractMemoKeywords(memos);
  const tagCounts = new Map<DiaryCauseTag, number>();
  weeklyEntries.forEach((entry) => entry.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
  const topCauseTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const incompleteDays = weeklyEntries.filter((entry) => entry.todos.length > 0 && entry.todos.some((todo) => !todo.done)).length;

  return {
    unlocked: streakCount >= 7,
    progress: Math.min(streakCount, 7),
    averageScore,
    bestDay,
    worstDay,
    bestRoutine,
    worstRoutine,
    keywordSummary,
    topCauseTags,
    incompleteDays,
    memoCount: memos.length,
  };
}

// ─── 리포트 언어 ──────────────────────────────────────────────────────────────

export function getReportLang(lang: string): ReportLang {
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("en")) return "en";
  return "ko";
}

// ─── 성분 토큰 파싱 ───────────────────────────────────────────────────────────

export function parseIngredientTokens(raw?: string) {
  if (!raw) return [];
  return raw
    .split(/[\n,\/]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 8);
}

// ─── 계절 라벨 ────────────────────────────────────────────────────────────────

export function getSeasonLabel(lang: ReportLang) {
  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  const labels = {
    ko: { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" },
    en: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    ja: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
  };
  return labels[lang][season];
}

// ─── 회복 가이드 ──────────────────────────────────────────────────────────────

export function getRecoveryGuide(lang: ReportLang, procedureNames: string[]) {
  const hasLaser = procedureNames.some((name) => /laser|레이저|レーザー|toning|토닝/i.test(name));
  const hasPeel = procedureNames.some((name) => /peel|필|필링|ピー/i.test(name));
  const hasTightening = procedureNames.some((name) => /rf|tight|고주파|弾力|たるみ/i.test(name));

  if (lang === "en") {
    return [
      hasLaser ? "Avoid retinoids, exfoliating acids, and scrubs for 3-5 days after laser-based sessions." : "Pause strong actives for 2-3 days after any intensive treatment.",
      hasPeel ? "Use bland barrier care and strict SPF after peeling-focused sessions." : "Keep the routine simple with cleanser, moisturizer, and SPF.",
      hasTightening ? "Watch for transient dryness and layer hydration before adding new actives." : "Reintroduce stronger actives only after visible irritation settles.",
    ];
  }
  if (lang === "ja") {
    return [
      hasLaser ? "レーザー系施術後3〜5日はレチノール・角質ケア・スクラブを避けてください。" : "刺激の強い施術後は2〜3日ほど強いアクティブを休んでください。",
      hasPeel ? "ピーリング後はバリア保湿とUV防御を最優先にしてください。" : "クレンザー・保湿・UV中心のシンプルケアが安全です。",
      hasTightening ? "高周波後は一時的な乾燥を見やすいので保湿を厚めにしてください。" : "赤みや刺激が落ち着いてから強い成分を戻してください。",
    ];
  }
  return [
    hasLaser ? "레이저 계열 시술 후 3~5일은 레티놀, 각질 케어, 스크럽을 쉬는 편이 안전합니다." : "강한 시술 직후 2~3일은 고함량 액티브를 쉬어 주세요.",
    hasPeel ? "필링 계열 후에는 장벽 보습과 자외선 차단을 최우선으로 두세요." : "클렌저-보습제-SPF 중심의 단순 루틴이 회복에 유리합니다.",
    hasTightening ? "고주파/탄력 관리 후에는 일시적 건조가 올 수 있어 수분 레이어링이 필요합니다." : "열감이나 따가움이 가라앉은 뒤에만 강한 성분을 재투입하세요.",
  ];
}

// ─── 다이어리 리포트 모델 ─────────────────────────────────────────────────────

const REPORT_COPY: Record<ReportLang, Record<string, string>> = {
  ko: {
    deck: "Skin Analysis Desk",
    title: "누적 피부 리포트",
    subtitle: "스캔, 일기, 루틴 데이터를 묶어 전문가 노트처럼 정리했습니다.",
    period: "분석 기간",
    scans: "누적 스캔",
    diary: "일기 메모",
    adherence: "루틴 실행",
    executive: "전문가 해석",
    priority: "우선 케어 과제",
    ingredients: "추천 성분 처방",
    procedures: "권장 시술 방향",
    routine: "루틴·생활 시그널",
    trendUp: "회복 추세",
    trendFlat: "안정 구간",
    trendDown: "변동 주의",
    trendUpDesc: "최근 평균 점수가 이전 구간보다 개선되었습니다.",
    trendFlatDesc: "최근 점수가 비슷한 범위에서 유지되고 있습니다.",
    trendDownDesc: "최근 점수가 이전 구간보다 떨어져 원인 확인이 필요합니다.",
    routineStrong: "루틴 지속력이 비교적 안정적입니다.",
    routineWeak: "미완료일이 있어 저녁 회복 루틴 정리가 필요합니다.",
    notEnough: "데이터가 더 쌓이면 리포트 정확도가 올라갑니다.",
    scoreRisk: "리스크 {{value}}",
    avgRisk: "최근 평균",
    recommended: "추천",
    caution: "주의",
    procedureNote: "시술은 피부과·의료진과 상담하며 민감도와 생활 패턴을 함께 고려해 결정하세요.",
    routineGood: "유지되는 루틴",
    routineWatch: "흔들리는 루틴",
    memoSignals: "메모 시그널",
    causeSignals: "원인 태그",
    cosmeticsSignal: "화장품 루틴 시그널",
    cosmeticsMissing: "등록된 화장품이 적어 성분 루틴 분석은 아직 초기 단계입니다.",
    cosmeticsReady: "등록된 화장품 {{count}}개를 기준으로 루틴 밀도도 함께 확인했습니다.",
  },
  en: {
    deck: "Skin Analysis Desk",
    title: "Accumulated Skin Report",
    subtitle: "Scans, diary notes, and routines are organized like an expert consultation note.",
    period: "Analysis period",
    scans: "Scans",
    diary: "Diary notes",
    adherence: "Routine adherence",
    executive: "Expert interpretation",
    priority: "Care priorities",
    ingredients: "Recommended ingredients",
    procedures: "Procedure directions",
    routine: "Routine & lifestyle signals",
    trendUp: "Recovery trend",
    trendFlat: "Stable phase",
    trendDown: "Watch volatility",
    trendUpDesc: "Recent average scores are improving over the previous block.",
    trendFlatDesc: "Recent scores are holding in a similar range.",
    trendDownDesc: "Recent scores have slipped versus the previous block.",
    routineStrong: "Routine consistency looks fairly stable.",
    routineWeak: "There were incomplete days, so evening recovery habits need tightening.",
    notEnough: "The report gets sharper as more data accumulates.",
    scoreRisk: "Risk {{value}}",
    avgRisk: "Recent avg",
    recommended: "Recommended",
    caution: "Caution",
    procedureNote: "Any procedure decision should be discussed with a clinician while considering sensitivity and lifestyle.",
    routineGood: "Routine strengths",
    routineWatch: "Routine to watch",
    memoSignals: "Memo signals",
    causeSignals: "Trigger tags",
    cosmeticsSignal: "Cosmetic routine signal",
    cosmeticsMissing: "There are not enough registered products yet for deep ingredient routine analysis.",
    cosmeticsReady: "Routine density was reviewed across {{count}} registered products.",
  },
  ja: {
    deck: "Skin Analysis Desk",
    title: "蓄積肌レポート",
    subtitle: "スキャン、日記、ルーティンデータをまとめて専門家ノートのように整理しました。",
    period: "分析期間",
    scans: "累積スキャン",
    diary: "日記メモ",
    adherence: "ルーティン実行",
    executive: "専門家コメント",
    priority: "優先ケア課題",
    ingredients: "推奨成分処方",
    procedures: "推奨施術の方向",
    routine: "ルーティン・生活シグナル",
    trendUp: "回復トレンド",
    trendFlat: "安定区間",
    trendDown: "変動に注意",
    trendUpDesc: "直近平均スコアは前の区間より改善しています。",
    trendFlatDesc: "最近のスコアは近い範囲で維持されています。",
    trendDownDesc: "直近スコアが前の区間より下がっており原因確認が必要です。",
    routineStrong: "ルーティン継続力は安定しています。",
    routineWeak: "未完了日があり夜の回復管理が必要です。",
    notEnough: "データが増えるほどレポート精度が上がります。",
    scoreRisk: "リスク {{value}}",
    avgRisk: "直近平均",
    recommended: "推奨",
    caution: "注意",
    procedureNote: "施術は皮膚科・医療者と相談し、敏感度と生活パターンを考慮して決めてください。",
    routineGood: "維持できているルーティン",
    routineWatch: "乱れやすいルーティン",
    memoSignals: "メモシグナル",
    causeSignals: "原因タグ",
    cosmeticsSignal: "コスメルーティンシグナル",
    cosmeticsMissing: "登録コスメが少なく、成分ルーティン分析はまだ初期段階です。",
    cosmeticsReady: "登録済みコスメ{{count}}件をもとにルーティン密度も確認しました。",
  },
};

const REPORT_CONCERNS: Array<{
  key: ReportConcernKey;
  label: string;
  risk: (score: number) => number;
  accent: string;
  titles: Record<ReportLang, string>;
  summaries: Record<ReportLang, string>;
  ingredients: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
  procedures: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
}> = [
  {
    key: "hydration",
    label: "수분 밸런스",
    risk: (score) => 100 - score,
    accent: "#3B82F6",
    titles: { ko: "수분-장벽 저하", en: "Hydration barrier dip", ja: "水分・バリア低下" },
    summaries: {
      ko: "수분이 떨어지는 날에 전체 점수 하락이 같이 나타나는 패턴입니다.",
      en: "Lower hydration is moving with wider score drops.",
      ja: "水分低下の日に全体スコア低下が重なる傾向です。",
    },
    ingredients: [
      { name: { ko: "히알루론산", en: "Hyaluronic acid", ja: "ヒアルロン酸" }, reason: { ko: "수분 저장력을 높여 각질 들뜸을 완화합니다.", en: "Supports water retention and reduces surface dryness.", ja: "水分保持を高めて乾燥感を和らげます。" } },
      { name: { ko: "세라마이드", en: "Ceramide", ja: "セラミド" }, reason: { ko: "피부 장벽 복구에 직접적인 축을 담당합니다.", en: "Directly supports barrier repair.", ja: "肌バリア修復を支えます。" } },
    ],
    procedures: [
      { name: { ko: "저자극 스킨부스터", en: "Low-irritation skin booster", ja: "低刺激スキンブースター" }, reason: { ko: "만성 건조와 장벽 저하 구간에서 수분 보강에 유리합니다.", en: "Useful when chronic dryness and barrier loss dominate.", ja: "慢性的な乾燥とバリア低下が続く時に向いています。" } },
    ],
  },
  {
    key: "redness",
    label: "붉은기 수준",
    risk: (score) => score,
    accent: "#EF4444",
    titles: { ko: "민감도 상승", en: "Redness reactivity", ja: "赤み反応性" },
    summaries: {
      ko: "자극 노출 후 붉은기 점수가 쉽게 오르는 민감 패턴입니다.",
      en: "Redness flares easily after likely irritation triggers.",
      ja: "刺激要因の後に赤みが上がりやすい敏感パターンです。",
    },
    ingredients: [
      { name: { ko: "판테놀", en: "Panthenol", ja: "パンテノール" }, reason: { ko: "열감과 민감 반응이 반복될 때 진정 축으로 좋습니다.", en: "Good anchor ingredient for repeated reactivity.", ja: "反応が続く時の鎮静軸として有効です。" } },
      { name: { ko: "센텔라", en: "Centella asiatica", ja: "ツボクサ" }, reason: { ko: "붉은기 완화와 장벽 회복을 동시에 보조합니다.", en: "Helps calm redness while supporting repair.", ja: "赤み緩和とバリア回復を助けます。" } },
    ],
    procedures: [
      { name: { ko: "LED 진정 케어", en: "LED calming care", ja: "LED鎮静ケア" }, reason: { ko: "민감기에는 강한 시술보다 열 자극이 적은 관리가 적합합니다.", en: "Lower-heat calming care is often safer than aggressive procedures.", ja: "敏感期は強い施術より低刺激ケアが向いています。" } },
    ],
  },
  {
    key: "pores",
    label: "모공 상태",
    risk: (score) => 100 - score,
    accent: "#F59E0B",
    titles: { ko: "유분-모공 부담", en: "Sebum-pore load", ja: "皮脂・毛穴負担" },
    summaries: {
      ko: "유분 관리가 흔들릴 때 모공 점수가 빠르게 떨어지는 흐름입니다.",
      en: "Pore condition softens quickly when oil control slips.",
      ja: "皮脂管理が乱れると毛穴状態が下がりやすい流れです。",
    },
    ingredients: [
      { name: { ko: "나이아신아마이드", en: "Niacinamide", ja: "ナイアシンアミド" }, reason: { ko: "피지와 결을 함께 관리하기 좋은 다목적 성분입니다.", en: "A multipurpose ingredient for oil balance and texture.", ja: "皮脂とキメを同時に見やすい多機能成分です。" } },
      { name: { ko: "BHA", en: "BHA", ja: "BHA" }, reason: { ko: "모공 내부 각질과 피지 축적 관리에 적합합니다.", en: "Useful for pore congestion and oil build-up.", ja: "毛穴内の角質・皮脂ケアに向いています。" } },
    ],
    procedures: [
      { name: { ko: "아쿠아필 계열", en: "Hydro / aqua peel", ja: "アクアピーリング系" }, reason: { ko: "막힌 모공과 표면 피지 정리에 직관적인 선택지입니다.", en: "A direct option for congestion and surface oil control.", ja: "詰まり毛穴と表面皮脂の整理に向いています。" } },
    ],
  },
  {
    key: "pigmentation",
    label: "잡티/색소침착",
    risk: (score) => score,
    accent: "#8B5CF6",
    titles: { ko: "색소 흔적 누적", en: "Pigment retention", ja: "色素残存" },
    summaries: {
      ko: "자외선·염증 후 색소가 오래 남는 경향이 보입니다.",
      en: "Pigment marks appear to linger after UV or inflammation exposure.",
      ja: "紫外線や炎症後の色素が残りやすい傾向です。",
    },
    ingredients: [
      { name: { ko: "비타민C", en: "Vitamin C", ja: "ビタミンC" }, reason: { ko: "톤 보정과 항산화 관리의 기본축입니다.", en: "Core ingredient for tone support and antioxidant care.", ja: "トーン補正と抗酸化ケアの軸になります。" } },
      { name: { ko: "트라넥사믹 애씨드", en: "Tranexamic acid", ja: "トラネキサム酸" }, reason: { ko: "반복되는 색소 흔적 관리에 유용합니다.", en: "Useful when pigment marks recur.", ja: "色素痕が繰り返す時に有用です。" } },
    ],
    procedures: [
      { name: { ko: "토닝 레이저 상담", en: "Laser toning consult", ja: "トーニングレーザー相談" }, reason: { ko: "색소가 누적될 때 시술 적합도 검토 가치가 있습니다.", en: "Worth evaluating when pigmentation continues to accumulate.", ja: "色素蓄積が続く時は適応確認の価値があります。" } },
    ],
  },
  {
    key: "elasticity",
    label: "주름 및 탄력",
    risk: (score) => 100 - score,
    accent: "#14B8A6",
    titles: { ko: "탄력 저하 신호", en: "Elasticity decline", ja: "弾力低下サイン" },
    summaries: {
      ko: "건조와 피로 누적 구간에서 탄력 점수가 눌리는 흐름입니다.",
      en: "Elasticity softens when dryness and fatigue stack together.",
      ja: "乾燥や疲労が重なる時に弾力スコアが落ちやすいです。",
    },
    ingredients: [
      { name: { ko: "레티놀", en: "Retinol", ja: "レチノール" }, reason: { ko: "탄력 저하 관리의 대표 성분입니다.", en: "A classic ingredient for firmness management.", ja: "弾力ケアの代表成分です。" } },
      { name: { ko: "펩타이드", en: "Peptides", ja: "ペプチド" }, reason: { ko: "자극을 낮추면서 탄력 루틴을 보강하기 좋습니다.", en: "Useful for adding firmness support with lower irritation.", ja: "比較的やさしく弾力ケアを補強できます。" } },
    ],
    procedures: [
      { name: { ko: "고주파 탄력 관리", en: "RF tightening consult", ja: "高周波たるみ相談" }, reason: { ko: "탄력 축이 지속적으로 낮다면 검토 가능한 방향입니다.", en: "A reasonable direction when elasticity continues to trend down.", ja: "弾力低下が続くなら検討しやすい方向です。" } },
    ],
  },
  {
    key: "breakout",
    label: "트러블 위험",
    risk: (score) => 100 - score,
    accent: "#EC4899",
    titles: { ko: "트러블 재발성", en: "Breakout recurrence", ja: "トラブル再発性" },
    summaries: {
      ko: "생활 패턴 변화에 따라 트러블 위험도가 흔들리는 흐름입니다.",
      en: "Breakout risk appears sensitive to routine and lifestyle disruption.",
      ja: "生活リズムの乱れでトラブルリスクが動きやすい流れです。",
    },
    ingredients: [
      { name: { ko: "아젤라익 애씨드", en: "Azelaic acid", ja: "アゼライン酸" }, reason: { ko: "트러블과 붉은 흔적을 함께 보기에 좋습니다.", en: "Useful for both breakouts and post-redness marks.", ja: "トラブルと赤み跡を一緒に見やすい成分です。" } },
      { name: { ko: "징크 PCA", en: "Zinc PCA", ja: "ジンクPCA" }, reason: { ko: "피지 균형과 번들거림 완화에 유리합니다.", en: "Supports oil balance and shine control.", ja: "皮脂バランスとテカリ管理に向いています。" } },
    ],
    procedures: [
      { name: { ko: "블루/레드 LED 관리", en: "Blue / red LED care", ja: "ブルー/レッドLEDケア" }, reason: { ko: "반복성 트러블 구간에서 저자극 보조 옵션이 됩니다.", en: "A gentle support option for recurrent breakouts.", ja: "再発しやすいトラブルの補助選択肢になります。" } },
    ],
  },
  {
    key: "darkCircle",
    label: "다크서클",
    risk: (score) => score,
    accent: "#6366F1",
    titles: { ko: "눈가 피로 누적", en: "Under-eye fatigue", ja: "目元疲労" },
    summaries: {
      ko: "수면/피로 변수에 따라 눈가 컨디션이 흔들리는 모습입니다.",
      en: "Under-eye condition appears responsive to fatigue and sleep load.",
      ja: "睡眠や疲労により目元状態が揺れやすいようです。",
    },
    ingredients: [
      { name: { ko: "카페인", en: "Caffeine", ja: "カフェイン" }, reason: { ko: "부기와 눈가 컨디션 관리에 보조적입니다.", en: "Helpful as a support ingredient for puffiness and under-eye tone.", ja: "むくみと目元コンディション管理の補助になります。" } },
      { name: { ko: "비타민K", en: "Vitamin K", ja: "ビタミンK" }, reason: { ko: "눈가 톤 관리 루틴에 자주 쓰이는 축입니다.", en: "Often used in targeted under-eye tone routines.", ja: "目元トーンケアで使われやすい軸です。" } },
    ],
    procedures: [
      { name: { ko: "눈가 순환 관리", en: "Under-eye circulation care", ja: "目元循環ケア" }, reason: { ko: "피로형 다크서클이면 생활 패턴 교정과 함께 검토할 수 있습니다.", en: "Can be considered alongside sleep and fatigue correction.", ja: "疲労型なら生活改善と一緒に検討できます。" } },
    ],
  },
];

export function buildDiaryReportModel({
  history,
  analysisResult,
  overallScore,
  finalType,
  weeklyReport,
  myCosmetics,
  t,
  lang,
}: {
  history: any[];
  analysisResult: AnalysisResult | null;
  overallScore: number;
  finalType: string;
  weeklyReport: ReturnType<typeof getWeeklyReport>;
  myCosmetics: CosmeticItem[];
  t: (key: string, options?: any) => string;
  lang: ReportLang;
}) {
  const copy = REPORT_COPY[lang];
  const today = todayStr();
  const snapshots = [
    ...(analysisResult ? [{
      createdAt: new Date().toISOString(),
      overallScore,
      skinAge: analysisResult.skinAge ?? null,
      baumannType: finalType,
      scores: analysisResult.scores ?? [],
    }] : []),
    ...history,
  ].filter((scan, index, arr) => {
    const date = new Date(scan.createdAt).toISOString().slice(0, 10);
    return arr.findIndex((candidate) => new Date(candidate.createdAt).toISOString().slice(0, 10) === date) === index;
  });

  const concernRows = REPORT_CONCERNS.map((concern) => {
    const risks = snapshots.flatMap((scan) => {
      const matched = (scan.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return [];
      return [concern.risk(Number(matched.score))];
    });
    const recentBlock = risks.slice(0, 3);
    const prevBlock = risks.slice(3, 6);
    const avgRisk = risks.length > 0 ? Math.round(risks.reduce((sum, value) => sum + value, 0) / risks.length) : 0;
    const recentAvg = recentBlock.length > 0 ? recentBlock.reduce((sum, value) => sum + value, 0) / recentBlock.length : avgRisk;
    const prevAvg = prevBlock.length > 0 ? prevBlock.reduce((sum, value) => sum + value, 0) / prevBlock.length : recentAvg;
    return {
      ...concern,
      avgRisk,
      delta: Math.round(recentAvg - prevAvg),
    };
  }).sort((a, b) => b.avgRisk - a.avgRisk);

  const focusConcerns = concernRows.slice(0, 3);
  const ingredientPlan = focusConcerns
    .flatMap((concern) => concern.ingredients.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 4);
  const procedurePlan = focusConcerns
    .flatMap((concern) => concern.procedures.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 3);
  const recentOverall = snapshots.slice(0, 3).map((scan) => Number(scan.overallScore) || 0);
  const previousOverall = snapshots.slice(3, 6).map((scan) => Number(scan.overallScore) || 0);
  const recentMean = recentOverall.length > 0 ? recentOverall.reduce((sum, value) => sum + value, 0) / recentOverall.length : overallScore;
  const previousMean = previousOverall.length > 0 ? previousOverall.reduce((sum, value) => sum + value, 0) / previousOverall.length : recentMean;
  const scoreByDate = new Map(
    snapshots.map((scan) => [new Date(scan.createdAt).toISOString().slice(0, 10), Number(scan.overallScore) || 0]),
  );
  const triggerSignals = DIARY_CAUSE_TAGS.map((tag) => {
    const taggedDates = Array.from(scoreByDate.keys()).filter((dateStr) => getDiaryCauseTags(dateStr).includes(tag));
    const taggedScores = taggedDates.map((dateStr) => scoreByDate.get(dateStr) || 0).filter((score) => score > 0);
    const baselineScores = Array.from(scoreByDate.entries())
      .filter(([dateStr]) => !taggedDates.includes(dateStr))
      .map(([, score]) => score)
      .filter((score) => score > 0);
    const taggedAvg = taggedScores.length > 0 ? taggedScores.reduce((sum, score) => sum + score, 0) / taggedScores.length : 0;
    const baselineAvg = baselineScores.length > 0 ? baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length : recentMean;
    return {
      tag,
      label: getCauseTagLabel(t, tag),
      diff: taggedScores.length > 0 ? Math.round(taggedAvg - baselineAvg) : 0,
      count: taggedScores.length,
    };
  })
    .filter((item) => item.count > 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  const ingredientSignals = (() => {
    const signalMap = new Map<string, { deltaSum: number; count: number }>();
    myCosmetics.forEach((item) => {
      const openedAt = item.opened_at ? new Date(item.opened_at) : null;
      if (!openedAt || Number.isNaN(openedAt.getTime())) return;
      const before = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() < openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      const after = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() >= openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      if (before.length === 0 || after.length === 0) return;
      const delta = after.reduce((sum, score) => sum + score, 0) / after.length
        - before.reduce((sum, score) => sum + score, 0) / before.length;
      parseIngredientTokens(item.ingredients).forEach((ingredient) => {
        const stat = signalMap.get(ingredient) || { deltaSum: 0, count: 0 };
        stat.deltaSum += delta;
        stat.count += 1;
        signalMap.set(ingredient, stat);
      });
    });
    return Array.from(signalMap.entries())
      .map(([ingredient, stat]) => ({ ingredient, delta: Math.round(stat.deltaSum / stat.count), count: stat.count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.delta - a.delta);
  })();

  const radarData = REPORT_CONCERNS.slice(0, 6).map((concern) => {
    const currentScore = (() => {
      const current = snapshots[0];
      const matched = (current?.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return 50;
      return 100 - concern.risk(Number(matched.score));
    })();
    const averageScore = (() => {
      const values = snapshots.flatMap((scan) => {
        const matched = (scan?.scores || []).find((item: any) => item?.label === concern.label);
        if (!matched || !Number.isFinite(Number(matched.score))) return [];
        return [100 - concern.risk(Number(matched.score))];
      });
      return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : currentScore;
    })();
    return {
      subject: concern.titles[lang],
      current: currentScore,
      average: averageScore,
    };
  });

  const seasonGuide = (() => {
    const season = getSeasonLabel(lang);
    const keyConcern = focusConcerns[0]?.key;
    if (lang === "en") {
      if (keyConcern === "hydration") return `${season} dryness likely amplifies barrier fatigue. Keep a heavier PM moisturizer than usual.`;
      if (keyConcern === "pigmentation") return `${season} UV exposure can prolong pigment retention. Keep daily antioxidant + SPF habits tight.`;
      return `${season} environment shifts can widen score volatility. Keep the routine stable when symptoms flare.`;
    }
    if (lang === "ja") {
      if (keyConcern === "hydration") return `${season}の乾燥でバリア疲労が強まりやすいです。夜は保湿量を少し厚めにしてください。`;
      if (keyConcern === "pigmentation") return `${season}の紫外線で色素残存が長引きやすいです。抗酸化ケアとSPFを厳守してください。`;
      return `${season}の環境変化でスコア変動が広がりやすいです。症状が揺れる時ほどルーティンを固定してください。`;
    }
    if (keyConcern === "hydration") return `${season} 건조 환경이 장벽 피로를 키우는 시기입니다. 야간 보습량을 평소보다 두텁게 가져가세요.`;
    if (keyConcern === "pigmentation") return `${season} 자외선 노출이 색소 흔적을 오래 끌 수 있습니다. 항산화 케어와 SPF 루틴을 더 엄격하게 유지하세요.`;
    return `${season} 환경 변수로 점수 변동폭이 커질 수 있는 시기입니다. 흔들릴수록 루틴을 단순하게 고정하는 편이 좋습니다.`;
  })();

  const forecast = (() => {
    const base = Math.round(recentMean || overallScore || 60);
    const routineBoost = weeklyReport.incompleteDays <= 1 ? 4 : 1;
    const concernPenalty = Math.round((focusConcerns[0]?.avgRisk || 40) / 18);
    const week1 = Math.max(45, Math.min(95, base + routineBoost - concernPenalty));
    const week2 = Math.max(45, Math.min(95, week1 + 3));
    if (lang === "en") {
      return {
        week1,
        week2,
        note: `If the current routine is kept stable, the next two weeks could recover toward ${week2} with the biggest lift coming from ${focusConcerns[0]?.titles.en || "barrier care"}.`,
      };
    }
    if (lang === "ja") {
      return {
        week1,
        week2,
        note: `現在のルーティンを安定して維持できれば、今後2週間で${week2}前後まで回復する余地があります。最優先は${focusConcerns[0]?.titles.ja || "バリアケア"}です。`,
      };
    }
    return {
      week1,
      week2,
      note: `지금 루틴을 안정적으로 유지하면 향후 2주 안에 ${week2}점 전후까지 회복할 여지가 있습니다. 가장 큰 개선 축은 ${focusConcerns[0]?.titles.ko || "장벽 케어"}입니다.`,
    };
  })();

  const topCauseTags = weeklyReport.topCauseTags.slice(0, 3).map(([tag, count]) => `${getCauseTagLabel(t, tag)} ${count}`);
  const periodEnd = snapshots.length > 0 ? new Date(snapshots[0].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const periodStart = snapshots.length > 0 ? new Date(snapshots[snapshots.length - 1].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const trendDelta = Math.round(recentMean - previousMean);
  const trendKey = trendDelta >= 3 ? "trendUp" : trendDelta <= -3 ? "trendDown" : "trendFlat";
  const executiveSummary = lang === "ko"
    ? `최근 ${snapshots.length}회 스캔과 최근 7일 일기 데이터를 종합하면 ${focusConcerns[0]?.titles.ko || "기초 컨디션"} 축의 부담이 가장 큽니다. ${focusConcerns[1]?.titles.ko || "생활 패턴"}와 ${focusConcerns[2]?.titles.ko || "루틴 안정성"}도 보조 이슈로 보여, 단기 진정만보다 장벽/색소/유분 관리의 우선순위를 분리해 접근하는 편이 좋습니다.`
    : lang === "ja"
      ? `直近${snapshots.length}回のスキャンと7日分の日記を総合すると、最優先課題は${focusConcerns[0]?.titles.ja || "基礎コンディション"}です。${focusConcerns[1]?.titles.ja || "生活パターン"}と${focusConcerns[2]?.titles.ja || "ルーティン安定性"}も補助課題として見えるため、単発ケアより優先順位を分けた管理が有効です。`
      : `Across ${snapshots.length} recent scans and the last 7 days of diary data, the highest burden is on ${focusConcerns[0]?.titles.en || "baseline condition"}. ${focusConcerns[1]?.titles.en || "lifestyle pattern"} and ${focusConcerns[2]?.titles.en || "routine stability"} are secondary drivers, so a prioritized plan will work better than one-off fixes.`;

  // ── 주간 일별 트렌드 데이터 (라인 차트용) ──
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }
  const dailyTrend = last7Days.map((dateStr) => {
    const scan = snapshots.find((s: any) => new Date(s.createdAt).toISOString().slice(0, 10) === dateStr);
    return {
      date: dateStr.slice(5),
      score: scan ? Number(scan.overallScore) || 0 : null,
    };
  });

  // ── 이번주 vs 지난주 항목별 비교 ──
  const thisWeekScans = snapshots.slice(0, Math.min(7, snapshots.length));
  const lastWeekScans = snapshots.slice(Math.min(7, snapshots.length), Math.min(14, snapshots.length));
  const scoreComparison = (analysisResult?.scores || []).slice(0, 10).map((item: any, idx: number) => {
    const thisWeekValues = thisWeekScans.map((s: any) => {
      const scores = Array.isArray(s.scores) ? s.scores : [];
      return Number(scores[idx]?.score) || 0;
    }).filter((v: number) => v > 0);
    const lastWeekValues = lastWeekScans.map((s: any) => {
      const scores = Array.isArray(s.scores) ? s.scores : [];
      return Number(scores[idx]?.score) || 0;
    }).filter((v: number) => v > 0);
    const thisAvg = thisWeekValues.length > 0 ? Math.round(thisWeekValues.reduce((a: number, b: number) => a + b, 0) / thisWeekValues.length) : 0;
    const lastAvg = lastWeekValues.length > 0 ? Math.round(lastWeekValues.reduce((a: number, b: number) => a + b, 0) / lastWeekValues.length) : 0;
    return {
      label: item.label || t(`scores.${idx}`),
      thisWeek: thisAvg,
      lastWeek: lastAvg,
      delta: lastAvg > 0 ? thisAvg - lastAvg : null,
    };
  });

  // ── 주간 피부 건강 등급 ──
  const weeklyGrade = (() => {
    const avg = recentMean || overallScore || 0;
    const adherenceNum = weeklyReport.incompleteDays === 0 ? 100 : Math.max(48, 100 - weeklyReport.incompleteDays * 12);
    const composite = Math.round(avg * 0.7 + adherenceNum * 0.3);
    if (composite >= 90) return { grade: "A+", color: "#059669", bg: "#ECFDF5" };
    if (composite >= 80) return { grade: "A", color: "#059669", bg: "#ECFDF5" };
    if (composite >= 70) return { grade: "B+", color: "#2563EB", bg: "#EFF6FF" };
    if (composite >= 60) return { grade: "B", color: "#2563EB", bg: "#EFF6FF" };
    if (composite >= 50) return { grade: "C", color: "#D97706", bg: "#FFFBEB" };
    return { grade: "D", color: "#DC2626", bg: "#FEF2F2" };
  })();

  // ── 바우만 타입별 맞춤 계절 인사이트 ──
  const baumannSeasonInsight = (() => {
    const month = new Date().getMonth() + 1;
    const season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
    const typeChar = finalType?.[0] || "D"; // O or D
    const sensChar = finalType?.[1] || "R"; // S or R
    const tips: string[] = [];
    if (lang === "ko") {
      if (season === "spring") {
        tips.push("봄 환절기에는 꽃가루와 미세먼지가 피부 장벽을 자극합니다.");
        if (sensChar === "S") tips.push("민감성 피부는 이중 세안보다 저자극 클렌저 한 번이 더 안전합니다.");
        if (typeChar === "D") tips.push("건성 피부는 봄에도 보습 크림을 줄이지 마세요. 바람이 수분을 빼앗아요.");
        if (typeChar === "O") tips.push("지성 피부도 봄에는 유수분 밸런스가 무너질 수 있어요. 가벼운 수분 에센스를 추가하세요.");
      } else if (season === "summer") {
        tips.push("여름 자외선과 높은 습도에 대비하세요.");
        if (typeChar === "O") tips.push("지성 피부는 논코메도제닉 선크림으로 모공 부담을 줄이세요.");
        if (sensChar === "S") tips.push("민감성 피부는 물리적 선크림(무기자차)이 더 안전합니다.");
      } else if (season === "autumn") {
        tips.push("가을 환절기는 여름 손상 회복이 핵심입니다.");
        if (typeChar === "D") tips.push("건성 피부는 세라마이드 함유 제품으로 장벽을 다시 쌓아올리세요.");
      } else {
        tips.push("겨울 건조 환경에서 피부 장벽 보호가 최우선입니다.");
        if (typeChar === "D") tips.push("건성 피부는 밤에 오일 세럼 + 크림 이중 보습이 효과적이에요.");
        if (typeChar === "O") tips.push("지성 피부도 겨울에는 가벼운 보습제가 필요합니다. 피지가 줄어도 장벽은 약해져요.");
      }
    } else if (lang === "ja") {
      if (season === "spring") { tips.push("春の花粉やPM2.5が肌バリアを刺激します。"); if (sensChar === "S") tips.push("敏感肌はダブル洗顔より低刺激クレンザー1回が安全です。"); }
      else if (season === "summer") { tips.push("夏の紫外線と高湿度に備えましょう。"); if (typeChar === "O") tips.push("脂性肌はノンコメドジェニック日焼け止めで毛穴負担を軽減。"); }
      else if (season === "autumn") { tips.push("秋は夏のダメージ回復が重要です。"); }
      else { tips.push("冬の乾燥環境では肌バリア保護が最優先です。"); if (typeChar === "D") tips.push("乾燥肌は夜にオイルセラム＋クリームの二重保湿が効果的。"); }
    } else {
      if (season === "spring") { tips.push("Spring pollen and dust can stress your skin barrier."); if (sensChar === "S") tips.push("Sensitive skin should use a gentle cleanser once rather than double cleansing."); }
      else if (season === "summer") { tips.push("Prepare for summer UV and humidity."); if (typeChar === "O") tips.push("Oily skin: use non-comedogenic sunscreen to ease pore burden."); }
      else if (season === "autumn") { tips.push("Autumn is key for recovering summer damage."); }
      else { tips.push("Winter dryness means barrier protection is the top priority."); if (typeChar === "D") tips.push("Dry skin: oil serum + cream double moisture at night works well."); }
    }
    return tips;
  })();

  // ── 오늘/내일 실행 플랜 ──
  const dailyActionPlan = (() => {
    const topConcern = focusConcerns[0]?.key || "hydration";
    if (lang === "ko") {
      return {
        morning: [
          "저자극 클렌저로 가볍게 세안",
          topConcern === "hydration" ? "수분 에센스 → 보습 크림 순서로 레이어링" : topConcern === "redness" ? "진정 토너 → 시카 크림 순서" : "비타민C 세럼 → 선크림",
          "SPF 50+ 선크림 필수 (2시간마다 덧바르기)",
        ],
        evening: [
          "이중 세안 (클렌징 오일 → 폼 클렌저)",
          topConcern === "hydration" ? "히알루론산 세럼 → 세라마이드 크림" : topConcern === "redness" ? "마데카소사이드 앰플 → 판테놀 크림" : "레티놀 세럼 (주 2~3회) → 보습 크림",
          "아이크림으로 눈가 보습 마무리",
        ],
      };
    }
    if (lang === "ja") {
      return {
        morning: [
          "低刺激クレンザーで優しく洗顔",
          topConcern === "hydration" ? "水分エッセンス → 保湿クリーム" : topConcern === "redness" ? "鎮静トナー → シカクリーム" : "ビタミンCセラム → 日焼け止め",
          "SPF50+ 日焼け止め必須",
        ],
        evening: [
          "ダブル洗顔（オイル → フォーム）",
          topConcern === "hydration" ? "ヒアルロン酸セラム → セラミドクリーム" : topConcern === "redness" ? "マデカソサイドアンプル → パンテノールクリーム" : "レチノールセラム（週2-3回）→ 保湿クリーム",
          "アイクリームで目元保湿",
        ],
      };
    }
    return {
      morning: [
        "Gentle cleanser wash",
        topConcern === "hydration" ? "Hydrating essence → Moisturizer" : topConcern === "redness" ? "Calming toner → Cica cream" : "Vitamin C serum → Sunscreen",
        "SPF 50+ sunscreen (reapply every 2h)",
      ],
      evening: [
        "Double cleanse (oil → foam)",
        topConcern === "hydration" ? "Hyaluronic acid serum → Ceramide cream" : topConcern === "redness" ? "Centella ampoule → Panthenol cream" : "Retinol serum (2-3x/week) → Moisturizer",
        "Eye cream for under-eye hydration",
      ],
    };
  })();

  // ── 다음 스캔 추천 ──
  const nextScanRecommendation = (() => {
    const daysSinceLast = snapshots.length > 0
      ? Math.floor((Date.now() - new Date(snapshots[0].createdAt).getTime()) / 86400000)
      : 999;
    if (lang === "ko") {
      if (daysSinceLast === 0) return "오늘 스캔 완료! 내일 같은 시간에 다시 스캔하면 변화를 정확히 추적할 수 있어요.";
      if (daysSinceLast <= 2) return `마지막 스캔 ${daysSinceLast}일 전. 오늘 스캔하면 트렌드가 더 정확해져요.`;
      return `${daysSinceLast}일 동안 스캔이 없어요. 지금 스캔하면 피부 변화를 놓치지 않아요.`;
    }
    if (lang === "ja") {
      if (daysSinceLast === 0) return "今日のスキャン完了！明日同じ時間にスキャンすると変化を正確に追跡できます。";
      if (daysSinceLast <= 2) return `最後のスキャンは${daysSinceLast}日前。今日スキャンするとトレンドがより正確になります。`;
      return `${daysSinceLast}日間スキャンがありません。今スキャンして肌の変化を見逃さないようにしましょう。`;
    }
    if (daysSinceLast === 0) return "Today's scan done! Scan again at the same time tomorrow for accurate tracking.";
    if (daysSinceLast <= 2) return `Last scan ${daysSinceLast} day(s) ago. Scanning today improves trend accuracy.`;
    return `No scan for ${daysSinceLast} days. Scan now to not miss skin changes.`;
  })();

  return {
    copy,
    periodLabel: `${periodStart} - ${periodEnd}`,
    scanCount: snapshots.length,
    memoCount: weeklyReport.memoCount,
    adherence: weeklyReport.incompleteDays === 0 ? "92%" : `${Math.max(48, 100 - weeklyReport.incompleteDays * 12)}%`,
    trendKey,
    trendDesc: copy[`${trendKey}Desc`],
    routineDesc: weeklyReport.incompleteDays <= 1 ? copy.routineStrong : copy.routineWeak,
    executiveSummary,
    focusConcerns,
    ingredientPlan,
    procedurePlan,
    topCauseTags,
    triggerSignals,
    keywordSummary: weeklyReport.keywordSummary,
    routineHighlights: {
      strong: weeklyReport.bestRoutine?.text || copy.notEnough,
      watch: weeklyReport.worstRoutine?.text || copy.notEnough,
    },
    ingredientSignals,
    recoveryGuide: getRecoveryGuide(lang, procedurePlan.map((item) => item.name)),
    radarData,
    seasonGuide,
    forecast,
    cosmeticsSignal: myCosmetics.length > 0
      ? copy.cosmeticsReady.replace("{{count}}", String(myCosmetics.length))
      : copy.cosmeticsMissing,
    // ── 새 데이터 ──
    dailyTrend,
    scoreComparison,
    weeklyGrade,
    baumannSeasonInsight,
    dailyActionPlan,
    nextScanRecommendation,
    trendDelta,
    recentMean: Math.round(recentMean),
    previousMean: Math.round(previousMean),
    finalType,
  };
}

export async function syncReminderToServer(settings: ReminderSettings, lang = "ko") {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub?.endpoint) return;

    if (settings.enabled) {
      await fetch("/api/diary-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          hour: settings.hour,
          lang,
        }),
      });
      return;
    }

    await fetch("/api/diary-reminder", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch (error) {
    console.error("[diary-reminder-sync]", error);
  }
}

export function daysSinceDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

// ─── 화장품 인사이트 ──────────────────────────────────────────────────────────

export function buildCosmeticsInsights(
  cosmetics: CosmeticItem[],
  overallScore: number,
  previousScore: number | null,
  t: (key: string, options?: any) => string,
) {
  if (cosmetics.length === 0) return [];

  const insights: { id: string; title: string; desc: string; accent: string }[] = [];
  const categories = new Set(cosmetics.map((item) => item.category));
  const amCount = cosmetics.filter((item) => item.time_of_day === "am" || item.time_of_day === "both").length;
  const pmCount = cosmetics.filter((item) => item.time_of_day === "pm" || item.time_of_day === "both").length;
  const recent = cosmetics
    .map((item) => ({ item, days: daysSinceDate(item.opened_at) }))
    .filter((entry): entry is { item: CosmeticItem; days: number } => entry.days !== null)
    .sort((a, b) => a.days - b.days)[0];

  if (recent && recent.days <= 14) {
    insights.push({
      id: "recent",
      title: t("cosmetics.insightRecentTitle"),
      desc: t("cosmetics.insightRecentDesc", { name: recent.item.name, days: recent.days + 1 }),
      accent: "#C97062",
    });
  }

  if (!categories.has("선크림")) {
    insights.push({
      id: "sunscreen",
      title: t("cosmetics.insightSunscreenTitle"),
      desc: t("cosmetics.insightSunscreenDesc"),
      accent: "#D97706",
    });
  }

  if (pmCount === 0 || pmCount < Math.max(1, Math.ceil(amCount / 2))) {
    insights.push({
      id: "pm-balance",
      title: t("cosmetics.insightBalanceTitle"),
      desc: t("cosmetics.insightBalanceDesc", { am: amCount, pm: pmCount }),
      accent: DEEP_GREEN,
    });
  }

  if (previousScore !== null && previousScore > 0) {
    const delta = overallScore - previousScore;
    if (delta >= 5) {
      insights.push({
        id: "score-up",
        title: t("cosmetics.insightScoreUpTitle"),
        desc: t("cosmetics.insightScoreUpDesc", { delta }),
        accent: "#059669",
      });
    } else if (delta <= -5) {
      insights.push({
        id: "score-down",
        title: t("cosmetics.insightScoreDownTitle"),
        desc: t("cosmetics.insightScoreDownDesc", { delta: Math.abs(delta) }),
        accent: "#DC2626",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "coverage",
      title: t("cosmetics.insightCoverageTitle"),
      desc: t("cosmetics.insightCoverageDesc", { count: cosmetics.length }),
      accent: SCAN_TO,
    });
  }

  return insights.slice(0, 3);
}

type CosmeticSignalScan = {
  createdAt?: string;
  overallScore?: string | number;
  scores?: Array<{ label?: string; score?: number | string }> | string;
};

export type CosmeticCorrelationSignal = {
  itemId: string;
  itemName: string;
  category: string;
  startedAt: string | null;
  daysTracked: number;
  beforeCount: number;
  afterCount: number;
  confidence: "early" | "building" | "strong";
  overallDelta: number | null;
  topScoreIndex: number | null;
  topScoreDelta: number | null;
  secondaryScoreIndex: number | null;
  secondaryScoreDelta: number | null;
  coUsedProducts: string[];
  note: string;
};

function parseScanScores(scan: CosmeticSignalScan) {
  try {
    if (Array.isArray(scan.scores)) return scan.scores;
    if (typeof scan.scores === "string") return JSON.parse(scan.scores);
  } catch {}
  return [];
}

function getScanTimestamp(scan: CosmeticSignalScan) {
  const raw = scan.createdAt;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function getCosmeticStartTimestamp(item: CosmeticItem) {
  const raw = item.opened_at || item.created_at || null;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildCosmeticCorrelationSignals(
  cosmetics: CosmeticItem[],
  scans: CosmeticSignalScan[],
  t: (key: string, options?: any) => string,
  routineLogs?: { date_str: string; cosmetic_ids: string[] }[],
): CosmeticCorrelationSignal[] {
  if (cosmetics.length === 0 || scans.length === 0) return [];

  const sortedScans = [...scans]
    .map((scan) => ({ scan, ts: getScanTimestamp(scan) }))
    .filter((entry): entry is { scan: CosmeticSignalScan; ts: number } => entry.ts !== null)
    .sort((a, b) => a.ts - b.ts);

  return cosmetics
    .map((item) => {
      const startTs = getCosmeticStartTimestamp(item);
      if (!startTs) return null;

      const preWindowScans = sortedScans
        .filter(({ ts }) => ts < startTs && ts >= startTs - 21 * 86400000)
        .slice(-3)
        .map(({ scan }) => scan);
      const baselineScans = preWindowScans.length > 0
        ? preWindowScans
        : sortedScans.filter(({ ts }) => ts < startTs).slice(-4).map(({ scan }) => scan);

      const observedAfterScans = sortedScans
        .filter(({ ts }) => ts >= startTs && ts <= startTs + 21 * 86400000)
        .map(({ scan }) => scan);
      const afterScans = observedAfterScans.length > 0
        ? observedAfterScans
        : sortedScans.filter(({ ts }) => ts >= startTs).slice(0, 4).map(({ scan }) => scan);

      // If routine logs are provided, filter after scans to days this product was actually used
      let filteredAfterScans = afterScans;
      if (routineLogs && routineLogs.length > 0) {
        const usedDates = new Set(
          routineLogs
            .filter(log => log.cosmetic_ids.includes(item.id))
            .map(log => log.date_str)
        );
        if (usedDates.size > 0) {
          const filtered = afterScans.filter(scan => {
            const scanDate = new Date(scan.createdAt).toISOString().slice(0, 10);
            return usedDates.has(scanDate);
          });
          // Only use filtered if it has results; otherwise fall back to all afterScans
          if (filtered.length > 0) filteredAfterScans = filtered;
        }
      }

      if (filteredAfterScans.length === 0) return null;

      const comparisonBaselineScans = baselineScans.length > 0
        ? baselineScans
        : filteredAfterScans.slice(0, Math.max(1, Math.min(2, Math.floor(filteredAfterScans.length / 2) || 1)));
      const comparisonAfterScans = baselineScans.length > 0
        ? filteredAfterScans
        : filteredAfterScans.slice(-Math.max(1, Math.min(2, filteredAfterScans.length)));

      const baselineOverall = average(
        comparisonBaselineScans.map((scan) => Number(scan.overallScore) || 0).filter((value) => value > 0)
      );
      const afterOverall = average(
        comparisonAfterScans.map((scan) => Number(scan.overallScore) || 0).filter((value) => value > 0)
      );

      const deltas = Array.from({ length: 10 }, (_, index) => {
        const label = Object.entries(SCORE_LABEL_MAP).find(([, mapped]) => mapped === index)?.[0] || "";
        const beforeValues = comparisonBaselineScans
          .map((scan) => Number(parseScanScores(scan)[index]?.score) || 0)
          .filter((value) => value > 0);
        const afterValues = comparisonAfterScans
          .map((scan) => Number(parseScanScores(scan)[index]?.score) || 0)
          .filter((value) => value > 0);
        const beforeMean = average(beforeValues);
        const afterMean = average(afterValues);
        return {
          index,
          label,
          delta: beforeMean !== null && afterMean !== null ? afterMean - beforeMean : null,
        };
      }).filter((item) => item.delta !== null) as Array<{ index: number; label: string; delta: number }>;

      const sortedPositive = [...deltas]
        .filter((item) => item.index !== 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      const top = sortedPositive[0] || null;
      const second = sortedPositive[1] || null;
      const coUsedProducts = cosmetics
        .filter((other) => other.id !== item.id)
        .filter((other) => {
          const otherTs = getCosmeticStartTimestamp(other);
          return otherTs !== null && otherTs <= startTs;
        })
        .map((other) => other.name)
        .slice(0, 3);

      const confidence: CosmeticCorrelationSignal["confidence"] =
        comparisonBaselineScans.length >= 2 && comparisonAfterScans.length >= 2 && (daysSinceDate(item.opened_at || item.created_at || todayStr()) ?? 0) >= 10
          ? "strong"
          : comparisonBaselineScans.length >= 1 && comparisonAfterScans.length >= 2
          ? "building"
          : "early";

      const daysTracked = Math.max(1, Math.floor((Date.now() - startTs) / 86400000) + 1);
      const overallDelta = baselineOverall !== null && afterOverall !== null ? afterOverall - baselineOverall : null;
      const mainMetricLabel = top ? t(`scores.${top.index}`) : null;

      let note = t("cosmetics.signalNoteEarly");
      if (top && top.delta >= 4) {
        note = t("cosmetics.signalNotePositive", { metric: mainMetricLabel, delta: Math.round(top.delta) });
      } else if (top && top.delta <= -4) {
        note = t("cosmetics.signalNoteNegative", { metric: mainMetricLabel, delta: Math.abs(Math.round(top.delta)) });
      } else if (overallDelta !== null && overallDelta >= 4) {
        note = t("cosmetics.signalNoteOverallPositive", { delta: Math.round(overallDelta) });
      } else if (overallDelta !== null && overallDelta <= -4) {
        note = t("cosmetics.signalNoteOverallNegative", { delta: Math.abs(Math.round(overallDelta)) });
      }

      if (coUsedProducts.length >= 2) {
        note = `${note} ${t("cosmetics.signalNoteCoUsed", { count: coUsedProducts.length })}`;
      }

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        startedAt: item.opened_at || item.created_at || null,
        daysTracked,
        beforeCount: baselineScans.length,
        afterCount: filteredAfterScans.length,
        confidence,
        overallDelta: overallDelta !== null ? Math.round(overallDelta * 10) / 10 : null,
        topScoreIndex: top?.index ?? null,
        topScoreDelta: top ? Math.round(top.delta * 10) / 10 : null,
        secondaryScoreIndex: second?.index ?? null,
        secondaryScoreDelta: second ? Math.round(second.delta * 10) / 10 : null,
        coUsedProducts,
        note,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aAbs = Math.max(Math.abs(a!.topScoreDelta || 0), Math.abs(a!.overallDelta || 0));
      const bAbs = Math.max(Math.abs(b!.topScoreDelta || 0), Math.abs(b!.overallDelta || 0));
      return bAbs - aAbs;
    }) as CosmeticCorrelationSignal[];
}

// ─── 화장품 루틴 정렬/추론 ───────────────────────────────────────────────────

const CATEGORY_DEFAULT_TIME: Record<string, ("am" | "pm")[]> = {
  "클렌저": ["am", "pm"],
  "토너": ["am", "pm"],
  "세럼": ["am", "pm"],
  "진정케어": ["pm"],
  "각질케어": ["pm"],
  "아이크림": ["pm"],
  "장벽케어": ["pm"],
  "크림": ["pm"],
  "선크림": ["am"],
};

export function sortCosmeticsForRoutine(items: CosmeticItem[]) {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.category);
    const bIndex = CATEGORY_ORDER.indexOf(b.category);
    const normalizedA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
    const normalizedB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;
    return normalizedA - normalizedB;
  });
}

export function inferCosmeticTimeOfDay(category: string): "am" | "pm" {
  const defaultTimes = CATEGORY_DEFAULT_TIME[category] || ["pm"];
  return defaultTimes[0] || "pm";
}

export function buildRoutineGuide(cosmetics: CosmeticItem[], t: (key: string, options?: any) => string) {
  const shouldIncludeInTime = (item: CosmeticItem, period: "am" | "pm") => {
    if (item.time_of_day === "am" || item.time_of_day === "pm") return item.time_of_day === period;
    const defaults = CATEGORY_DEFAULT_TIME[item.category] || ["pm"];
    return defaults.includes(period);
  };
  const am = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "am")));
  const pm = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "pm")));
  const categories = cosmetics.map((item) => item.category);
  const categoryCount = new Map<string, number>();
  categories.forEach((category) => categoryCount.set(category, (categoryCount.get(category) || 0) + 1));
  const uniqueAmSteps = Array.from(new Set(am.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));
  const uniquePmSteps = Array.from(new Set(pm.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));

  const goodMixes: string[] = [];
  const cautions: string[] = [];

  if (categories.includes("진정케어") && categories.includes("장벽케어")) {
    goodMixes.push(t("cosmetics.goodComboBarrier"));
  }
  if (categories.includes("세럼") && categories.includes("크림")) {
    goodMixes.push(t("cosmetics.goodComboLayering"));
  }
  if (categories.includes("선크림")) {
    goodMixes.push(t("cosmetics.goodComboSunscreen"));
  }

  const exfoliatorCount = categoryCount.get("각질케어") || 0;
  if (exfoliatorCount >= 2) {
    cautions.push(t("cosmetics.cautionOverExfoliate"));
  }
  if (cosmetics.some((item) => item.category === "각질케어" && (item.time_of_day === "am" || item.time_of_day === "both"))) {
    cautions.push(t("cosmetics.cautionMorningExfoliate"));
  }
  if ((categoryCount.get("세럼") || 0) >= 3) {
    cautions.push(t("cosmetics.cautionTooManySerums"));
  }
  if (!categories.includes("장벽케어") && !categories.includes("진정케어")) {
    cautions.push(t("cosmetics.cautionRecoveryGap"));
  }

  return {
    am,
    pm,
    amSteps: uniqueAmSteps,
    pmSteps: uniquePmSteps,
    goodMixes: goodMixes.slice(0, 3),
    cautions: cautions.slice(0, 3),
  };
}

type RoutineConflictDetail = {
  ids: string[];
  productNames: string[];
  reason: string;
  resolution: string;
};

const RETINOID_PATTERNS = [/retinol/i, /retinal/i, /retinoid/i, /레티놀/i, /레티날/i, /레티노이드/i, /レチノ/i];
const EXFOLIANT_PATTERNS = [/aha/i, /bha/i, /pha/i, /glycolic/i, /lactic/i, /salicylic/i, /mandelic/i, /글라이콜릭/i, /락틱/i, /살리실릭/i, /만델릭/i, /角質/i];
const VITAMIN_C_PATTERNS = [/vitamin c/i, /ascorb/i, /비타민\s*c/i, /아스코르브/i, /ビタミン\s*c/i];
const NIACINAMIDE_PATTERNS = [/niacinamide/i, /나이아신아마이드/i, /ナイアシンアミド/i];
const REPRESENTATIVE_LIMIT: Record<"am" | "pm", number> = { am: 4, pm: 5 };
const PERIOD_PRIORITY: Record<"am" | "pm", string[]> = {
  am: ["클렌저", "세럼", "크림", "선크림", "토너", "진정케어", "장벽케어", "아이크림", "각질케어"],
  pm: ["클렌저", "토너", "각질케어", "세럼", "진정케어", "장벽케어", "크림", "아이크림", "선크림"],
};

function matchesIngredientPattern(item: CosmeticItem, patterns: RegExp[]) {
  const haystack = `${item.name || ""}\n${item.ingredients || ""}\n${item.category || ""}`;
  return patterns.some((pattern) => pattern.test(haystack));
}

function getItemPeriods(item: CosmeticItem): ("am" | "pm")[] {
  if (item.time_of_day === "am") return ["am"];
  if (item.time_of_day === "pm") return ["pm"];
  if (item.time_of_day === "both") {
    const defaults = CATEGORY_DEFAULT_TIME[item.category] || ["am", "pm"];
    return defaults.length > 0 ? defaults : ["am", "pm"];
  }
  return CATEGORY_DEFAULT_TIME[item.category] || ["pm"];
}

function compareCosmeticPriority(a: CosmeticItem, b: CosmeticItem) {
  const aIndex = CATEGORY_ORDER.indexOf(a.category);
  const bIndex = CATEGORY_ORDER.indexOf(b.category);
  const normalizedA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
  const normalizedB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;

  if (normalizedA !== normalizedB) return normalizedA - normalizedB;

  const aIngredientScore = parseIngredientTokens(a.ingredients).length;
  const bIngredientScore = parseIngredientTokens(b.ingredients).length;
  if (aIngredientScore !== bIngredientScore) return bIngredientScore - aIngredientScore;

  const aImageScore = a.image_thumbnail ? 1 : 0;
  const bImageScore = b.image_thumbnail ? 1 : 0;
  if (aImageScore !== bImageScore) return bImageScore - aImageScore;

  return a.name.localeCompare(b.name, "ko");
}

function getConflictMeta(
  a: CosmeticItem,
  b: CosmeticItem,
  period: "am" | "pm",
  t: (key: string, options?: any) => string
): RoutineConflictDetail | null {
  const aRetinoid = matchesIngredientPattern(a, RETINOID_PATTERNS);
  const bRetinoid = matchesIngredientPattern(b, RETINOID_PATTERNS);
  const aExfoliant = a.category === "각질케어" || matchesIngredientPattern(a, EXFOLIANT_PATTERNS);
  const bExfoliant = b.category === "각질케어" || matchesIngredientPattern(b, EXFOLIANT_PATTERNS);
  const aVitaminC = matchesIngredientPattern(a, VITAMIN_C_PATTERNS);
  const bVitaminC = matchesIngredientPattern(b, VITAMIN_C_PATTERNS);
  const aNiacinamide = matchesIngredientPattern(a, NIACINAMIDE_PATTERNS);
  const bNiacinamide = matchesIngredientPattern(b, NIACINAMIDE_PATTERNS);

  if ((aRetinoid && bExfoliant) || (bRetinoid && aExfoliant)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictRetinoidExfoliant"),
      resolution: t("cosmetics.conflictResolutionSeparate"),
    };
  }

  if ((aRetinoid && bVitaminC) || (bRetinoid && aVitaminC)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictRetinoidVitaminC"),
      resolution: t("cosmetics.conflictResolutionAmPm"),
    };
  }

  if ((aVitaminC && bExfoliant) || (bVitaminC && aExfoliant)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictVitaminCExfoliant"),
      resolution: t("cosmetics.conflictResolutionAlternate"),
    };
  }

  if (aExfoliant && bExfoliant) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.cautionOverExfoliate"),
      resolution: period === "am" ? t("cosmetics.conflictResolutionPmOnly") : t("cosmetics.conflictResolutionAlternate"),
    };
  }

  if ((aNiacinamide && bVitaminC) || (bNiacinamide && aVitaminC)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictNiacinamideVitaminC"),
      resolution: t("cosmetics.conflictResolutionSeparate"),
    };
  }

  return null;
}

function buildRepresentativePeriod(
  sourceItems: CosmeticItem[],
  period: "am" | "pm",
  t: (key: string, options?: any) => string
) {
  const selected: CosmeticItem[] = [];
  const conflicts: RoutineConflictDetail[] = [];
  const usedCategories = new Set<string>();

  for (const item of sourceItems) {
    if (usedCategories.has(item.category)) continue;

    const conflict = selected
      .map((picked) => getConflictMeta(picked, item, period, t))
      .find(Boolean) || null;

    if (conflict) {
      conflicts.push(conflict);
      continue;
    }

    selected.push(item);
    usedCategories.add(item.category);
  }

  const prioritized = [...selected].sort((a, b) => {
    const aIndex = PERIOD_PRIORITY[period].indexOf(a.category);
    const bIndex = PERIOD_PRIORITY[period].indexOf(b.category);
    const normalizedA = aIndex === -1 ? PERIOD_PRIORITY[period].length : aIndex;
    const normalizedB = bIndex === -1 ? PERIOD_PRIORITY[period].length : bIndex;
    return normalizedA - normalizedB;
  });

  return { items: prioritized.slice(0, REPRESENTATIVE_LIMIT[period]), conflicts };
}

export function buildRepresentativeRoutine(
  cosmetics: CosmeticItem[],
  t: (key: string, options?: any) => string,
  preferred?: { am?: string[]; pm?: string[]; conflicts?: { productNames?: string[]; reason?: string; resolution?: string }[] | null }
) {
  const preferredIds = new Set([...(preferred?.am || []), ...(preferred?.pm || [])]);
  const baseSorted = [...cosmetics].sort(compareCosmeticPriority);

  const getSourceItems = (period: "am" | "pm") => {
    const preferredItems = (preferred?.[period] || [])
      .map((id) => cosmetics.find((item) => item.id === id))
      .filter(Boolean) as CosmeticItem[];

    const remainder = baseSorted.filter((item) => !preferredIds.has(item.id) && getItemPeriods(item).includes(period));
    const explicit = preferredItems.filter((item) => getItemPeriods(item).includes(period));

    return [...explicit, ...remainder];
  };

  const amResult = buildRepresentativePeriod(getSourceItems("am"), "am", t);
  const pmResult = buildRepresentativePeriod(getSourceItems("pm"), "pm", t);

  const mergedConflicts = [
    ...(preferred?.conflicts || []).map((conflict) => ({
      ids: [],
      productNames: conflict.productNames || [],
      reason: conflict.reason || "",
      resolution: conflict.resolution || "",
    })),
    ...amResult.conflicts,
    ...pmResult.conflicts,
  ].filter((conflict) => conflict.reason || conflict.productNames.length > 0);

  const dedupedConflicts: RoutineConflictDetail[] = [];
  const seen = new Set<string>();
  for (const conflict of mergedConflicts) {
    const key = `${[...conflict.productNames].sort().join("|")}::${conflict.reason}::${conflict.resolution}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedConflicts.push(conflict);
  }

  return {
    am: amResult.items,
    pm: pmResult.items,
    amSteps: amResult.items.map((item) => t(`cosmetics.categories.${item.category}`)),
    pmSteps: pmResult.items.map((item) => t(`cosmetics.categories.${item.category}`)),
    conflicts: dedupedConflicts,
  };
}

// ─── 이미지 처리 ──────────────────────────────────────────────────────────────

export async function cropFaceFromImage(src: string): Promise<string> {
  try {
    const mp = await import('@mediapipe/face_mesh');
    const { FaceMesh } = mp;
    const img = new Image();
    img.src = src;
    await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
    const faceMesh = new FaceMesh({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
    let lms: any[] = [];
    await new Promise<void>((r) => {
      faceMesh.onResults((res: any) => { if (res.multiFaceLandmarks?.[0]) lms = res.multiFaceLandmarks[0]; r(); });
      faceMesh.send({ image: img });
    });
    faceMesh.close();
    if (!lms.length) return src;
    const xs = lms.map((l: any) => l.x);
    const ys = lms.map((l: any) => l.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    const fW = maxX - minX, fH = maxY - minY;
    minX = Math.max(0, minX - fW * 0.22);
    maxX = Math.min(1, maxX + fW * 0.22);
    minY = Math.max(0, minY - fH * 0.48);
    maxY = Math.min(1, maxY + fH * 0.12);
    const iW = img.naturalWidth, iH = img.naturalHeight;
    const sx = minX * iW, sy = minY * iH, sw = (maxX - minX) * iW, sh = (maxY - minY) * iH;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return src;
  }
}

export function compressThumbnail(base64: string, maxSize = 300): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export function parseFoodOptions(value?: string): string[] {
  if (!value) return [];
  const delimiter = value.includes("|") ? "|" : "·";
  return value.split(delimiter).map((item) => item.trim()).filter(Boolean);
}

export function pickFoodOption(value: string | undefined, seed: number, fallbackIndex = 0): string | null {
  const options = parseFoodOptions(value);
  if (options.length === 0) return null;
  const normalizedSeed = Math.abs(Math.round(seed));
  return options[normalizedSeed % options.length] ?? options[Math.min(fallbackIndex, options.length - 1)] ?? null;
}

export function dedupeFoods(items: ({ food: string; why: string } | null)[]): { food: string; why: string }[] {
  const seen = new Set<string>();
  return items.filter((item): item is { food: string; why: string } => {
    if (!item?.food) return false;
    if (seen.has(item.food)) return false;
    seen.add(item.food);
    return true;
  });
}
