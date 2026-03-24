import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Droplets, Check, Plus, LogIn, ChevronDown } from "lucide-react";
import type { CosmeticItem } from "./types";
import { haptic } from "./utils";
import type { CosmeticCorrelationSignal } from "./utils";
import {
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  fadeChild,
} from "./constants";

type RoutineChecklistProps = {
  cosmetics: CosmeticItem[];
  checkedIds: string[];
  onToggle: (id: string) => void;
  onRegister?: () => void;
  onLogin?: () => void;
  user?: any;
  loading?: boolean;
  signals?: CosmeticCorrelationSignal[];
};

export function RoutineChecklist({
  cosmetics,
  checkedIds,
  onToggle,
  onRegister,
  onLogin,
  user,
  loading = false,
  signals = [],
}: RoutineChecklistProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const checkedCount = checkedIds.filter((id) =>
    cosmetics.some((c) => c.id === id)
  ).length;

  const checkedItems = cosmetics.filter((c) => checkedIds.includes(c.id));
  const uncheckedItems = cosmetics.filter((c) => !checkedIds.includes(c.id));
  const hasChecked = checkedCount > 0;

  // 각 화장품 ID → signal 매핑
  const signalMap = new Map(signals.map((s) => [s.itemId, s]));

  const getEffectLabel = (id: string) => {
    const sig = signalMap.get(id);
    if (!sig) return null;
    if (sig.confidence === "early") return { text: t("routineChecklist.tracking", "추적 중"), color: TEXT_TERTIARY, delta: null };
    const idx = sig.topScoreIndex;
    const delta = sig.topScoreDelta;
    if (idx == null || delta == null) return null;
    const metric = t(`scores.${idx}`);
    const positive = delta >= 0;
    return {
      text: `${metric} ${positive ? "+" : ""}${delta}`,
      color: positive ? "#2D7D46" : "#C2410C",
      delta,
    };
  };

  return (
    <motion.div
      variants={reducedMotion ? undefined : fadeChild}
      initial={reducedMotion ? undefined : "initial"}
      animate={reducedMotion ? undefined : "animate"}
    >
      <div
        className="rounded-3xl p-4"
        style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}
      >
        {/* ── 비로그인 상태 ── */}
        {!user && onLogin && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}>
                {t("routineChecklist.title", "오늘 사용한 화장품")}
              </span>
            </div>
            <div className="py-4 text-center">
              <p className="text-[13px] font-normal mb-3 whitespace-pre-line leading-relaxed" style={{ color: TEXT_TERTIARY }}>
                {t("routineChecklist.loginDesc", "화장품을 등록하고\n어떤 제품이 내 피부에 효과 있는지 추적하세요")}
              </p>
              <button onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity active:opacity-70"
                style={{ background: DEEP_GREEN, color: "#FFFFFF" }}>
                <LogIn className="w-4 h-4" />
                {t("routineChecklist.login", "로그인하고 시작하기")}
              </button>
            </div>
          </>
        )}

        {/* ── 로그인 + 화장품 미등록 ── */}
        {user && !loading && cosmetics.length === 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}>
                {t("routineChecklist.title", "오늘 사용한 화장품")}
              </span>
            </div>
            <div className="py-4 text-center">
              <p className="text-[13px] font-normal mb-3 whitespace-pre-line leading-relaxed" style={{ color: TEXT_TERTIARY }}>
                {t("routineChecklist.empty", "사용 중인 화장품을 등록하면\n어떤 제품이 내 피부에 효과 있는지 추적할 수 있어요")}
              </p>
              {onRegister && (
                <button onClick={onRegister}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-opacity active:opacity-70"
                  style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                  <Plus className="w-4 h-4" />
                  {t("routineChecklist.register", "화장품 등록하기")}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── 로그인 + 화장품 있음 ── */}
        {user && cosmetics.length > 0 && (
          <>
            {/* 헤더 (탭해서 펼치기/접기) */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}>
                  {t("routineChecklist.title", "오늘 사용한 화장품")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: checkedCount > 0 ? `${DEEP_GREEN}15` : "#F3F2F0", color: checkedCount > 0 ? DEEP_GREEN : TEXT_TERTIARY }}>
                  {checkedCount}/{cosmetics.length}
                </span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ color: TEXT_TERTIARY, transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </div>
            </button>

            {/* ── 접힌 상태: 체크된 제품 요약 + 효과 ── */}
            {!expanded && hasChecked && (
              <div className="mt-3 space-y-1.5">
                {checkedItems.slice(0, 4).map((item) => {
                  const effect = getEffectLabel(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                      style={{ background: `${DEEP_GREEN}06` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: DEEP_GREEN }} />
                        <span className="text-[13px] font-medium truncate" style={{ color: DEEP_GREEN }}>{item.name}</span>
                      </div>
                      {effect && (
                        <span className="text-[11px] font-bold shrink-0 rounded-full px-2 py-0.5"
                          style={{ background: effect.delta != null && effect.delta >= 0 ? "#E8F5EC" : effect.delta != null ? "#FFF7ED" : "#F3F2F0", color: effect.color }}>
                          {effect.text}
                        </span>
                      )}
                    </div>
                  );
                })}
                {checkedItems.length > 4 && (
                  <p className="text-[11px] text-center" style={{ color: TEXT_TERTIARY }}>
                    +{checkedItems.length - 4}{t("routineChecklist.more", "개 더")}
                  </p>
                )}
              </div>
            )}

            {/* ── 접힌 상태: 체크 안 된 경우 안내 ── */}
            {!expanded && !hasChecked && (
              <p className="mt-2 text-[12px]" style={{ color: TEXT_TERTIARY }}>
                {t("routineChecklist.tapToCheck", "탭하여 오늘 사용한 화장품을 체크하세요")}
              </p>
            )}

            {/* ── 펼친 상태: 전체 체크리스트 ── */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3">
                    {/* 미체크 항목 먼저 (체크 유도) */}
                    {uncheckedItems.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_TERTIARY }}>
                          {t("routineChecklist.unchecked", "미체크")}
                        </p>
                        <div className="space-y-1">
                          {uncheckedItems.map((item) => (
                            <ChecklistRow key={item.id} item={item} checked={false} onToggle={onToggle} effect={getEffectLabel(item.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 체크된 항목 */}
                    {checkedItems.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: DEEP_GREEN }}>
                          {t("routineChecklist.checked", "사용 완료")}
                        </p>
                        <div className="space-y-1">
                          {checkedItems.map((item) => (
                            <ChecklistRow key={item.id} item={item} checked onToggle={onToggle} effect={getEffectLabel(item.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-normal mt-3 leading-relaxed" style={{ color: TEXT_TERTIARY }}>
                    {t("routineChecklist.hint", "매일 체크하면 어떤 화장품이 효과 있는지 추적해요")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Individual row ──────────────────────────────────────────────────────────

function ChecklistRow({
  item,
  checked,
  onToggle,
  effect,
}: {
  item: CosmeticItem;
  checked: boolean;
  onToggle: (id: string) => void;
  effect: { text: string; color: string; delta: number | null } | null;
}) {
  return (
    <button
      type="button"
      onClick={() => { haptic("light"); onToggle(item.id); }}
      className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors duration-200"
      style={{ background: checked ? `${DEEP_GREEN}08` : "transparent" }}
    >
      {/* Checkbox */}
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: checked ? DEEP_GREEN : "transparent",
          borderColor: checked ? DEEP_GREEN : "#D1CBC3",
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>

      {/* Name */}
      <span className="text-[13px] font-medium truncate flex-1 min-w-0"
        style={{ color: checked ? DEEP_GREEN : "#374151" }}>
        {item.name}
      </span>

      {/* Effect badge */}
      {effect && (
        <span className="text-[11px] font-bold shrink-0 rounded-full px-2 py-0.5"
          style={{
            background: effect.delta != null && effect.delta >= 0 ? "#E8F5EC" : effect.delta != null ? "#FFF7ED" : "#F3F2F0",
            color: effect.color,
          }}>
          {effect.text}
        </span>
      )}
    </button>
  );
}
