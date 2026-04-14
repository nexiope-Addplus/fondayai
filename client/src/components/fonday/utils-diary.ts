// ─── 다이어리 관련 유틸 ──────────────────────────────────────────────────────

import {
  AICareSettings,
  ReminderSettings,
  TodoItem,
  DiaryCauseTag,
  WeatherData,
  WeatherTipKey,
} from "./types";
import {
  DIARY_CAUSE_TAGS,
  LEGACY_DIARY_CAUSE_TAG_MAP,
  CAUSE_TAG_KEYWORDS,
} from "./constants";
import { todayStr, apiBase, appFetch } from "./utils-platform";

// ─── 날씨 팁 키 ───────────────────────────────────────────────────────────────

export function getWeatherTipKey(d: WeatherData): WeatherTipKey {
  // PM2.5 기준 (날씨카드와 동일): 35 이상이면 미세먼지 나쁨
  if (d.pm25 != null && d.pm25 >= 35) return "polluted";
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

/** 오늘까지 연속 일기 작성 일수 계산 */
export function getDiaryConsecutiveDays(): number {
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!localStorage.getItem(`fonday_memo_${ds}`)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

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

// ─── 리마인더 서버 동기화 ────────────────────────────────────────────────────

export async function syncReminderToServer(settings: ReminderSettings, lang = "ko") {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub?.endpoint) return;

    if (settings.enabled) {
      await appFetch(`${apiBase()}/api/diary-reminder`, {
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

    await appFetch(`${apiBase()}/api/diary-reminder`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch (error) {
    console.error("[diary-reminder-sync]", error);
  }
}
