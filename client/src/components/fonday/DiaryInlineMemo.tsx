import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DiaryCauseTag } from "./types";
import {
  DIARY_CAUSE_TAGS,
  SCAN_FROM,
  SCAN_TO,
  TINT_NEUTRAL,
  BG_BASE,
  TEXT_TERTIARY,
  TEXT_LABEL,
  TEXT_SECONDARY,
} from "./constants";
import {
  checkDiaryMissions,
  getCauseTagLabel,
  getDiaryConsecutiveDays,
  getDiaryCauseTags,
  getDiaryMemo,
  saveDiaryCauseTags,
  saveDiaryMemo,
  suggestCauseTags,
} from "./utils";

export function InlineMemo({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(() => getDiaryMemo(dateStr));
  const [tags, setTags] = useState<DiaryCauseTag[]>(() => getDiaryCauseTags(dateStr));

  const handleSave = () => {
    // 1) localStorage에 저장 (saveDiaryMemo가 이벤트도 dispatch)
    saveDiaryMemo(dateStr, text);
    saveDiaryCauseTags(dateStr, tags);
    // 2) 저장 후 연속일수 계산 → 미션 체크
    const consecutiveDays = getDiaryConsecutiveDays();
    checkDiaryMissions(consecutiveDays);
    // 3) 미션 상태 반영된 후 재 dispatch하여 리스너가 최신 상태 읽도록
    window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
    setEditing(false);
  };

  if (editing) {
    const autoSuggestions = suggestCauseTags(text).filter((tag) => !tags.includes(tag));
    return (
      <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
        <textarea
          className="w-full text-[12px] bg-[#FAF9F7] rounded-xl p-2.5 resize-none outline-none focus:border-[#E09882] transition-colors" style={{ color: TEXT_LABEL }}
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
            <p className="text-xs font-bold mb-1" style={{ color: TEXT_TERTIARY }}>{t("modal.diary.autoTag")}</p>
            <div className="flex flex-wrap gap-1.5">
              {autoSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTags((prev) => [...prev, tag])}
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: BG_BASE, color: SCAN_TO, border: `1px solid ${SCAN_FROM}40` }}
                >
                  + {getCauseTagLabel(t, tag)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs" style={{ color: TEXT_TERTIARY }}>{t("modal.diary.memoChars", { n: text.length })}</span>
          <div className="flex gap-2">
            <button onClick={() => { setText(getDiaryMemo(dateStr)); setTags(getDiaryCauseTags(dateStr)); setEditing(false); }}
              className="text-xs px-2 py-1" style={{ color: TEXT_TERTIARY }}>{t("modal.diary.memoCancel")}</button>
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
          <p className="text-[12px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>{text}</p>
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
        className="text-xs font-medium hover:transition-colors" style={{ color: TEXT_TERTIARY }}>
        {t("modal.diary.memoAdd")}
      </button>
    </div>
  );
}
