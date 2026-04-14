import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Moon, Sun } from "lucide-react";
import type { TodoItem } from "./types";
import {
  DEEP_GREEN,
  SCAN_TO,
  TINT_GREEN,
  TINT_WARM,
  BORDER_COLOR,
  TEXT_TERTIARY,
  TEXT_SECONDARY,
} from "./constants";
import { buildRoutineGuide, getDiaryTodos, saveDiaryTodos } from "./utils";

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
      <div className="rounded-3xl bg-white" style={{ border: `1px solid ${BORDER_COLOR}` }}>
        <div className="p-5">
          <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("diary.routineTitle")}</p>
          <p className="text-base font-bold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.todayRoutineTitle")}</p>
          <p className="text-xs mt-1" style={{ color: TEXT_SECONDARY }}>{t("modal.diary.todayRoutineDesc")}</p>
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
                      <p className="text-xs font-semibold" style={{ color: accent }}>{title} {t("diary.routineComplete", "완료")}</p>
                      <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                        completed ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                      }`}>
                        {completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("modal.diary.todayRoutineEmpty")}</p>
                )}
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}
