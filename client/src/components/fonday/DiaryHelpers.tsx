import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Moon,
  Sun,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisResult, DiaryCauseTag, RankingData, TodoItem } from "./types";
import {
  DEEP_GREEN,
  DIARY_CAUSE_TAGS,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
} from "./constants";
import {
  buildRoutineGuide,
  getCauseTagLabel,
  getDiaryCauseTags,
  getDiaryMemo,
  getDiaryTodoProgress,
  getDiaryTodos,
  saveDiaryCauseTags,
  saveDiaryMemo,
  saveDiaryTodos,
  suggestCauseTags,
  todayStr,
} from "./utils";

export function InlineTodos({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(() => getDiaryTodos(dateStr));
  if (todos.length === 0) return null;
  const doneCount = todos.filter(td => td.done).length;
  const toggle = (i: number) => {
    const next = todos.map((td, idx) => idx === i ? { ...td, done: !td.done } : td);
    setTodos(next);
    saveDiaryTodos(dateStr, next);
  };
  return (
    <div className="mb-3 pb-3 border-b border-[#F0EDE8]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-stone-500"><ClipboardList className="w-3 h-3 inline mr-1" />{t("diary.routineTitle")}</p>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: doneCount === todos.length ? TINT_GREEN : "#F9F9F9",
            color: doneCount === todos.length ? "#059669" : "#B0A898" }}>
          {doneCount}/{todos.length}
        </span>
      </div>
      <div className="space-y-3">
        {todos.map((todo, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex items-center gap-2.5 w-full text-left">
            <div className={`w-4 h-4 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all
              ${todo.done ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"}`}>
              {todo.done && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-[12px] leading-snug transition-colors
              ${todo.done ? "line-through text-stone-300" : "text-stone-600"}`}>
              {todo.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 인라인 메모 ─────────────────────────────────────────────────
export function InlineMemo({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(() => getDiaryMemo(dateStr));
  const [tags, setTags] = useState<DiaryCauseTag[]>(() => getDiaryCauseTags(dateStr));

  const handleSave = () => {
    saveDiaryMemo(dateStr, text);
    saveDiaryCauseTags(dateStr, tags);
    setEditing(false);
  };

  if (editing) {
    const autoSuggestions = suggestCauseTags(text).filter((tag) => !tags.includes(tag));
    return (
      <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
        <textarea
          className="w-full text-[12px] text-stone-600 bg-[#FAF9F7] rounded-xl p-2.5 resize-none outline-none focus:border-[#E09882] transition-colors"
          rows={3} maxLength={100}
          placeholder={t("modal.diary.memoPlaceholder")}
          value={text} onChange={e => setText(e.target.value)} autoFocus
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {DIARY_CAUSE_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setTags((prev) => selected ? prev.filter((item) => item !== tag) : [...prev, tag])}
                className="px-2.5 py-1 rounded-full text-xs font-bold transition-colors"
                style={selected
                  ? { background: `${SCAN_FROM}20`, color: SCAN_TO, border: `1px solid ${SCAN_FROM}55` }
                  : { background: TINT_NEUTRAL, color: "#9A8F80" }}
              >
                {getCauseTagLabel(t, tag)}
              </button>
            );
          })}
        </div>
        {autoSuggestions.length > 0 && (
          <div className="mt-2 rounded-xl px-3 py-2" style={{ background: TINT_NEUTRAL }}>
            <p className="text-xs font-bold text-stone-400 mb-1">{t("modal.diary.autoTag")}</p>
            <div className="flex flex-wrap gap-1.5">
              {autoSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTags((prev) => [...prev, tag])}
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#FFFFFF", color: SCAN_TO, border: `1px solid ${SCAN_FROM}40` }}
                >
                  + {getCauseTagLabel(t, tag)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-stone-300">{t("modal.diary.memoChars", { n: text.length })}</span>
          <div className="flex gap-2">
            <button onClick={() => { setText(getDiaryMemo(dateStr)); setTags(getDiaryCauseTags(dateStr)); setEditing(false); }}
              className="text-xs text-stone-400 px-2 py-1">{t("modal.diary.memoCancel")}</button>
            <button onClick={handleSave}
              className="text-xs font-bold px-3 py-1 rounded-lg text-white"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
              {t("modal.diary.memoSave")}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (text) {
    return (
      <div className="mt-3 pt-3 border-t border-[#F0EDE8] flex gap-2 cursor-pointer" onClick={() => setEditing(true)}>
        <span className="text-sm shrink-0">📝</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-stone-500 leading-relaxed">{text}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: TINT_NEUTRAL, color: "#9A8F80" }}>
                  {getCauseTagLabel(t, tag)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
      <button onClick={() => setEditing(true)}
        className="text-xs text-stone-300 font-medium hover:text-stone-400 transition-colors">
        {t("modal.diary.memoAdd")}
      </button>
    </div>
  );
}

export function DiaryRoutinePreviewCard({ routineGuide, dateStr }: { routineGuide: ReturnType<typeof buildRoutineGuide>; dateStr: string }) {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(() => getDiaryTodos(dateStr));

  useEffect(() => {
    setTodos(getDiaryTodos(dateStr));
  }, [dateStr]);

  const isSectionComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const prefixed = `${period} · ${item}`;
      return todos.some((todo) => (todo.text === prefixed || todo.text === item) && todo.done);
    });
  };

  const setSectionComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return;
    const shouldComplete = !isSectionComplete(period, items);
    const next = [...todos];
    items.forEach((item) => {
      const prefixed = `${period} · ${item}`;
      const index = next.findIndex((todo) => todo.text === prefixed || todo.text === item);
      if (index >= 0) {
        next[index] = { ...next[index], text: prefixed, done: shouldComplete };
      } else {
        next.push({ text: prefixed, done: shouldComplete });
      }
    });
    setTodos(next);
    saveDiaryTodos(dateStr, next);
  };

  const sections = [
    {
      key: "am",
      title: t("result.actionCard.phaseMorning"),
      icon: Sun,
      accent: DEEP_GREEN,
      bg: TINT_GREEN,
      border: "#DDECE7",
      items: routineGuide.amSteps,
      period: "AM" as const,
    },
    {
      key: "pm",
      title: t("result.actionCard.phaseEvening"),
      icon: Moon,
      accent: SCAN_TO,
      bg: TINT_WARM,
      border: "#F1DED7",
      items: routineGuide.pmSteps,
      period: "PM" as const,
    },
  ];

  return (
    <div className="px-5 pt-4">
      <div className="rounded-3xl border bg-white shadow-sm" style={{  }}>
        <div className="p-5">
          <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("diary.routineTitle")}</p>
          <p className="text-base font-bold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.todayRoutineTitle")}</p>
          <p className="text-xs text-stone-500 mt-1">{t("modal.diary.todayRoutineDesc")}</p>
          <div className="grid gap-3 mt-4 md:grid-cols-2">
            {sections.map(({ key, title, icon: Icon, accent, bg, border, items, period }) => {
              const completed = isSectionComplete(period, items);
              return (
              <div key={key} className="rounded-3xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{title}</p>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                {items.length > 0 ? (
                  <>
                    <p className="text-xs font-bold leading-relaxed text-kr-pretty" style={{ color: accent }}>
                      {items.join(" → ")}
                    </p>
                    <button
                      onClick={() => setSectionComplete(period, items)}
                      className="mt-3 w-full rounded-2xl bg-white border px-3.5 py-3 flex items-center justify-between gap-3"
                      style={{ borderColor: `${accent}20` }}
                    >
                      <p className="text-xs font-semibold" style={{ color: accent }}>{title} 완료</p>
                      <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                        completed ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                      }`}>
                        {completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-stone-400">{t("modal.diary.todayRoutineEmpty")}</p>
                )}
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 다이어리 달력 뷰 ────────────────────────────────────────────
export function DiaryCalendarView({ allEntries }: { allEntries: { dateStr: string; score: number }[] }) {
  const { t, i18n } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<{ dateStr: string; score: number } | null>(() => {
    const todayEntry = allEntries.find((entry) => entry.dateStr === todayStr());
    return todayEntry ?? null;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const scoreMap = new Map(allEntries.map(e => [e.dateStr, e.score]));

  const getScoreColor = (score: number) =>
    score >= 90 ? SCAN_TO : score >= 75 ? SCAN_FROM : score >= 60 ? "#F5C5B8" : "#FAE0DA";
  const getTextColor = (score: number) => score >= 75 ? "#fff" : SCAN_TO;

  const monthLabel = i18n.language === "ko"
    ? `${year}년 ${month + 1}월`
    : i18n.language === "ja"
    ? `${year}年${month + 1}月`
    : new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdayLabels = i18n.language === "ko"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : i18n.language === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="px-5 pb-8 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-stone-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-stone-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {weekdayLabels.map(d => (
          <div key={d} className="text-center text-xs font-bold text-stone-300 py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const score = scoreMap.get(dateStr);
          const todoProgress = getDiaryTodoProgress(dateStr);
          const memo = getDiaryMemo(dateStr);
          const tags = getDiaryCauseTags(dateStr);
          const isToday = dateStr === todayStr();
          const isSelected = selectedEntry?.dateStr === dateStr;
          return (
            <button key={dateStr}
              onClick={() => setSelectedEntry({ dateStr, score: score ?? 0 })}
              className="flex min-h-[60px] flex-col items-center justify-start py-1.5 gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
                ${isSelected ? "ring-2 ring-offset-1 ring-[#C97062]" : ""}`}
                style={score !== undefined
                  ? { background: getScoreColor(score), color: getTextColor(score) }
                  : isSelected
                  ? { background: `${SCAN_FROM}30`, border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : isToday
                  ? { border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : { color: "#B0A898" }}>
                {day}
              </div>
              {todoProgress.total > 0 ? (
                <div
                  className="min-h-[14px] rounded-full px-1.5 text-xs font-bold leading-[14px]"
                  style={{
                    background: todoProgress.done === todoProgress.total ? TINT_GREEN : TINT_NEUTRAL,
                    color: todoProgress.done === todoProgress.total ? "#059669" : "#9A8F80",
                  }}
                >
                  {todoProgress.done}/{todoProgress.total}
                </div>
              ) : (
                <div className="min-h-[14px]">
                  {score !== undefined && <div className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                </div>
              )}
              <div className="flex items-center gap-1 min-h-[10px]">
                {score !== undefined && <span className="w-1.5 h-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                {todoProgress.total > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: todoProgress.done === todoProgress.total ? "#10B981" : "#D97706" }} />}
                {memo && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C3AED" }} />}
                {tags.length > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4A7C6E" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedEntry && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-5 rounded-3xl shadow-sm" style={{ background: "#FFFFFF" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-stone-400 tracking-wide">{selectedEntry.dateStr}</span>
            {selectedEntry.score > 0 && (
              <span className="text-[20px] font-black" style={{ color: SCAN_TO }}>{selectedEntry.score}{t("result.scoreSuffix")}</span>
            )}
          </div>
          <InlineTodos dateStr={selectedEntry.dateStr} />
          <InlineMemo dateStr={selectedEntry.dateStr} />
        </motion.div>
      )}

      <div className="mt-5 flex items-center gap-3 justify-center flex-wrap">
        {([{ label: "90+", color: SCAN_TO }, { label: "75~89", color: SCAN_FROM },
          { label: "60~74", color: "#F5C5B8" }, { label: "~59", color: "#FAE0DA" }]).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-stone-400">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 justify-center flex-wrap">
        {[
          { label: t("modal.diary.legendRoutine"), color: "#10B981" },
          { label: t("modal.diary.legendIncomplete"), color: "#D97706" },
          { label: t("modal.diary.legendMemo"), color: "#7C3AED" },
          { label: t("modal.diary.legendTag"), color: "#4A7C6E" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs text-stone-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 다이어리 타임라인 ────────────────────────────────────────────
export function DiaryTimeline({ history, analysisResult, overallScore, finalType, currentScanId }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string; currentScanId: string | null;
}) {
  const { t, i18n } = useTranslation();

  const todayEntry = {
    id: currentScanId || "today",
    dateStr: todayStr(),
    date: new Date(),
    score: overallScore,
    baumannType: finalType,
    skinAge: analysisResult?.skinAge,
    aiComment: analysisResult?.aiComment,
    isToday: true,
  };

  const historyEntries = history
    .filter((h: any) => h.id !== currentScanId)
    .map((h: any) => ({
      id: h.id,
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      date: new Date(h.createdAt),
      score: parseInt(h.overallScore),
      baumannType: h.baumannType,
      skinAge: h.skinAge,
      aiComment: h.aiComment,
      isToday: false,
    }));

  const allEntries = [todayEntry, ...historyEntries];

  // 월별 그룹핑
  type EntryType = typeof todayEntry;
  const grouped: { monthKey: string; monthLabel: string; entries: EntryType[] }[] = [];
  for (const entry of allEntries) {
    const mk = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    let group = grouped.find(g => g.monthKey === mk);
    if (!group) {
      const y = entry.date.getFullYear();
      const m = entry.date.getMonth() + 1;
      const label = i18n.language === "ko" ? `${y}년 ${m}월`
        : i18n.language === "ja" ? `${y}年${m}月`
        : entry.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      group = { monthKey: mk, monthLabel: label, entries: [] };
      grouped.push(group);
    }
    group.entries.push(entry);
  }

  // 비교 요약
  const prevScan = history[0];
  const prevScores = prevScan ? (() => { try { return JSON.parse(prevScan.scores || "[]"); } catch { return []; } })() : [];
  const currentScores = analysisResult?.scores || [];
  const improved = currentScores.filter((s: any, idx: number) => s.score > (prevScores[idx]?.score || 0)).length;
  const declined = currentScores.filter((s: any, idx: number) => s.score < (prevScores[idx]?.score || 0)).length;
  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <div className="px-5 pb-8 pt-4">
      {/* 점수 추이 그래프 */}
      {history.length >= 1 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-stone-300 tracking-widest uppercase mb-2">{t("modal.diary.graphTitle")}</p>
          <div className="h-36 rounded-3xl bg-white px-2 pt-2"
            style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.06)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...historyEntries.slice().reverse().map(e => ({
                date: e.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" }),
                score: e.score,
              })), { date: t("modal.diary.today"), score: overallScore }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "9px" }} />
                <YAxis domain={[0, 100]} ticks={[0,25,50,75,100]} axisLine={false} tickLine={false} style={{ fontSize: "9px" }} width={22} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2.5}
                  dot={{ r: 4, fill: SCAN_TO, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 비교 요약 배지 */}
      {history.length >= 1 && prevScores.length > 0 && (improved > 0 || declined > 0) && (
        <div className="mb-5 px-4 py-2.5 rounded-2xl flex items-center gap-2"
          style={{ background: `${DEEP_GREEN}08`, border: `1px solid ${DEEP_GREEN}15` }}>
          <Activity className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
          <p className="text-[12px] font-semibold" style={{ color: DEEP_GREEN }}>
            {t("compare.summary", { improved, declined })}
          </p>
        </div>
      )}

      {/* 월별 타임라인 */}
      {grouped.map((group, gi) => (
        <div key={group.monthKey} className={gi > 0 ? "mt-6" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-4 bg-stone-200" />
            <span className="text-xs font-bold tracking-widest text-stone-300 uppercase whitespace-nowrap">
              {group.monthLabel}
            </span>
            <div className="h-[1px] flex-1 bg-stone-200" />
          </div>

          <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-0 w-[1.5px] bg-stone-200" />
            <div className="space-y-4">
              {group.entries.map((entry, ei) => {
                const dateLabel = entry.isToday
                  ? `${t("modal.diary.today")} · ${entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" })}`
                  : entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" });
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 5 + ei) * 0.05 }}
                    className="flex gap-3 items-start">
                    <div className="shrink-0 w-4 flex flex-col items-center pt-3 z-[1]">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ background: entry.isToday ? SCAN_TO : "#D4C5BC",
                          boxShadow: `0 0 0 2px ${entry.isToday ? SCAN_TO + "30" : "#E8E0D820"}` }} />
                    </div>
                    <div className="flex-1 rounded-3xl p-4 border"
                      style={{
                        background: entry.isToday ? "#FFFAF9" : "#FFFFFF",
                        borderColor: entry.isToday ? `${SCAN_FROM}50` : "#F0EDE8",
                        boxShadow: "0 2px 16px rgba(180,130,110,0.07)",
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium tracking-wide text-stone-400">{dateLabel}</span>
                        <div className="flex items-center gap-1.5">
                          {entry.skinAge && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#A78BFA15", color: "#7C3AED" }}>
                              {t("modal.diary.skinAgeLabel", { age: entry.skinAge })}
                            </span>
                          )}
                          <span className="text-[20px] font-black leading-none"
                            style={{ color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>{entry.score}</span>
                        </div>
                      </div>
                      {entry.baumannType && (
                        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                          style={{ background: entry.isToday ? `${SCAN_FROM}20` : `${DEEP_GREEN}10`,
                            color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>
                          {t("modal.diary.baumannLabel", { type: entry.baumannType })}
                        </span>
                      )}
                      {entry.aiComment && (
                        <p className="text-[12px] text-stone-500 leading-relaxed italic">"{entry.aiComment}"</p>
                      )}
                      <InlineMemo dateStr={entry.dateStr} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 다이어리 풀스크린 뷰 ────────────────────────────────────────
export function DiaryFullView({ history, analysisResult, overallScore, finalType, currentScanId, rankingData, user, onClose, onLogout }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string;
  currentScanId: string | null; rankingData: RankingData | null;
  user: any; onClose: () => void; onLogout: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"timeline" | "calendar" | "ranking">("timeline");

  const allEntries: { dateStr: string; score: number }[] = [
    { dateStr: todayStr(), score: overallScore },
    ...history.filter((h: any) => h.id !== currentScanId).map((h: any) => ({
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      score: parseInt(h.overallScore),
    })),
  ];

  const tabs: { id: "timeline" | "calendar" | "ranking"; label: string }[] = [
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "calendar", label: t("modal.diary.calendarTab") },
    { id: "ranking", label: t("modal.diary.rankingTab") },
  ];

  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col max-w-md mx-auto"
      style={{ background: "#F8F5F2" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}>

      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-1.5 text-stone-500 active:opacity-70">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("modal.diary.title")}</span>
          </button>
          <div className="flex items-center gap-2">
            {user?.avatar && <img src={user.avatar} alt="" aria-hidden="true" className="w-7 h-7 rounded-full" />}
            <button onClick={onLogout} className="text-xs text-stone-300 underline">
              {t("modal.diary.logout")}
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-[12px] font-bold transition-all border-b-2 ${
                tab === id ? "border-[#C97062] text-[#C97062]" : "border-transparent text-stone-400"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {tab === "timeline" && (
            <motion.div key="tl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryTimeline history={history} analysisResult={analysisResult}
                overallScore={overallScore} finalType={finalType} currentScanId={currentScanId} />
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryCalendarView allEntries={allEntries} />
            </motion.div>
          )}
          {tab === "ranking" && (
            <motion.div key="rank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-5 pb-8 space-y-4 pt-4">
                {!rankingData ? (
                  <div className="py-12 text-center"><p className="text-[12px] text-stone-400">...</p></div>
                ) : (
                  <>
                    {rankingData.myPercentile !== undefined ? (
                      <div className="p-5 rounded-2xl text-center"
                        style={{ background: `linear-gradient(135deg, ${SCAN_FROM}20, ${SCAN_TO}10)` }}>
                        <p className="text-xs text-stone-500 mb-1">{t("ranking.myRankLabel")}</p>
                        <p className="text-4xl font-black" style={{ color: SCAN_TO }}>
                          {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl text-center bg-stone-50">
                        <p className="text-[12px] text-stone-500">{t("ranking.loginForRank")}</p>
                        <p className="text-xs text-stone-300 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-stone-400 mb-3">{t("ranking.distribution")}</p>
                      <div className="space-y-3">
                        {rankingData.scoreDistribution.map((band, bi) => {
                          const maxCount = Math.max(...rankingData.scoreDistribution.map(d => d.count), 1);
                          const barPct = Math.round((band.count / maxCount) * 100);
                          const [bMin, bMax] = band.label.split("-").map(Number);
                          const isMyBand = overallScore >= bMin && overallScore <= bMax;
                          return (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-xs text-stone-400 w-14 shrink-0">{band.label}</span>
                              <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.max(barPct, band.count > 0 ? 6 : 0)}%`,
                                    background: isMyBand ? `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` : "#D1D5DB" }} />
                              </div>
                              <span className="text-xs text-stone-400 w-5 text-right">{band.count}</span>
                              {isMyBand && (
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: `${SCAN_FROM}30`, color: SCAN_TO }}>{t("ranking.me")}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {Object.keys(rankingData.baumannDistribution).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-stone-400 mb-2">{t("ranking.topBaumann")}</p>
                        <div className="flex gap-2">
                          {Object.entries(rankingData.baumannDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([type, count], ri) => (
                              <div key={type} className="flex-1 p-3 rounded-2xl text-center bg-white">
                                <span className="text-[13px]">{["🥇","🥈","🥉"][ri]}</span>
                                <p className="text-lg font-bold mt-0.5" style={{ color: SCAN_TO }}>{type}</p>
                                <p className="text-xs text-stone-400">{count as number}{t("ranking.people")}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-white text-center">
                        <p className="text-xs text-stone-400">{t("ranking.avgScore")}</p>
                        <p className="text-xl font-black" style={{ color: DEEP_GREEN }}>{rankingData.avgScore}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white text-center">
                        <p className="text-xs text-stone-400">{t("ranking.topScore")}</p>
                        <p className="text-xl font-black" style={{ color: "#D97706" }}>{rankingData.topScore}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
