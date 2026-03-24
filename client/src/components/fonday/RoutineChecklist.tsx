import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { Droplets, Check, Plus, LogIn } from "lucide-react";
import type { CosmeticItem } from "./types";
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
};

export function RoutineChecklist({
  cosmetics,
  checkedIds,
  onToggle,
  onRegister,
  onLogin,
  user,
  loading = false,
}: RoutineChecklistProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const amItems = cosmetics.filter(
    (c) => c.time_of_day === "am" || c.time_of_day === "both" || !c.time_of_day
  );
  const pmItems = cosmetics.filter(
    (c) => c.time_of_day === "pm" || c.time_of_day === "both"
  );

  const checkedCount = checkedIds.filter((id) =>
    cosmetics.some((c) => c.id === id)
  ).length;

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
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4" style={{ color: DEEP_GREEN }} />
            <span
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ fontFamily: FONT_DISPLAY, color: DEEP_GREEN }}
            >
              {t("routineChecklist.title", "오늘 사용한 화장품")}
            </span>
          </div>
          {cosmetics.length > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: `${DEEP_GREEN}15`, color: DEEP_GREEN }}
            >
              {t("routineChecklist.used", { n: checkedCount, defaultValue: `${checkedCount}개 사용` })}
            </span>
          )}
        </div>

        {/* 비로그인 상태 — 로그인 유도 */}
        {!user && onLogin && (
          <div className="py-4 text-center">
            <p
              className="text-[13px] font-normal mb-3 whitespace-pre-line leading-relaxed"
              style={{ color: TEXT_TERTIARY }}
            >
              {t("routineChecklist.loginDesc", "화장품을 등록하고\n어떤 제품이 내 피부에 효과 있는지 추적하세요")}
            </p>
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity active:opacity-70"
              style={{ background: DEEP_GREEN, color: "#FFFFFF" }}
            >
              <LogIn className="w-4 h-4" />
              {t("routineChecklist.login", "로그인하고 시작하기")}
            </button>
          </div>
        )}

        {/* Loading state */}
        {user && loading && (
          <div className="py-6 flex justify-center">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${DEEP_GREEN}40`, borderTopColor: "transparent" }}
            />
          </div>
        )}

        {/* Empty state — 화장품 등록 유도 */}
        {!loading && cosmetics.length === 0 && (
          <div className="py-4 text-center">
            <p
              className="text-[13px] font-normal mb-3 whitespace-pre-line leading-relaxed"
              style={{ color: TEXT_TERTIARY }}
            >
              {t("routineChecklist.empty", "사용 중인 화장품을 등록하면\n어떤 제품이 내 피부에 효과 있는지 추적할 수 있어요")}
            </p>
            {onRegister && (
              <button
                onClick={onRegister}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-opacity active:opacity-70"
                style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}
              >
                <Plus className="w-4 h-4" />
                {t("routineChecklist.register", "화장품 등록하기")}
              </button>
            )}
          </div>
        )}

        {/* AM section */}
        {!loading && amItems.length > 0 && (
          <div className="mb-3">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: DEEP_GREEN }}
            >
              {t("routineChecklist.am", "아침")}
            </p>
            <div className="space-y-1.5">
              {amItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  checked={checkedIds.includes(item.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        )}

        {/* PM section */}
        {!loading && pmItems.length > 0 && (
          <div className="mb-3">
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-2"
              style={{ color: SCAN_TO }}
            >
              {t("routineChecklist.pm", "저녁")}
            </p>
            <div className="space-y-1.5">
              {pmItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  checked={checkedIds.includes(item.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {!loading && cosmetics.length > 0 && (
          <p
            className="text-[11px] font-normal mt-2 leading-relaxed"
            style={{ color: TEXT_TERTIARY }}
          >
            {t(
              "routineChecklist.hint",
              "매일 체크하면 어떤 화장품이 효과 있는지 추적해요"
            )}
          </p>
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
}: {
  item: CosmeticItem;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-200"
      style={{
        background: checked ? `${DEEP_GREEN}08` : "transparent",
      }}
    >
      {/* Custom checkbox */}
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
        style={{
          background: checked ? DEEP_GREEN : "transparent",
          borderColor: checked ? DEEP_GREEN : "#D1CBC3",
        }}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>

      {/* Name + category */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="text-sm font-medium truncate"
          style={{ color: checked ? DEEP_GREEN : "#374151" }}
        >
          {item.name}
        </span>
        {item.category && (
          <span
            className="text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0"
            style={{
              background: checked ? `${DEEP_GREEN}15` : "#F3F2F0",
              color: checked ? DEEP_GREEN : "#6B7280",
            }}
          >
            {item.category}
          </span>
        )}
      </div>
    </button>
  );
}
