// ─── 점수 / 리포트 / 성분 분석 유틸 ─────────────────────────────────────────

import {
  AnalysisResult,
  DiaryCauseTag,
  ReportLang,
} from "./types";
import {
  getDiaryTodos,
  getDiaryMemo,
  getDiaryCauseTags,
  getCauseTagLabel,
  getRecentDateStrings,
  extractMemoKeywords,
} from "./utils-diary";

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

// ─── 주간 리포트 ──────────────────────────────────────────────────────────────

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
