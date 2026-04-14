import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ClipboardList } from "lucide-react";
import type { TodoItem } from "./types";
import { TINT_GREEN, TEXT_SECONDARY } from "./constants";
import { getDiaryTodos, saveDiaryTodos } from "./utils";

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
        <p className="text-xs font-bold" style={{ color: TEXT_SECONDARY }}><ClipboardList className="w-3 h-3 inline mr-1" />{t("diary.routineTitle")}</p>
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
              ${todo.done ? "line-through" : ""}`}>
              {todo.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
