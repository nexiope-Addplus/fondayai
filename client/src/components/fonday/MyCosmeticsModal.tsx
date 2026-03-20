import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Droplets, AlertTriangle } from "lucide-react";
import type { CosmeticItem } from "./types";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
} from "./constants";
import { inferCosmeticTimeOfDay, buildRoutineGuide } from "./utils";

interface OptimizedRoutine {
  am: { id: string; order: number }[];
  pm: { id: string; order: number }[];
  conflicts: { productNames: string[]; reason: string; resolution: string }[];
}

export function MyCosmeticsModal({ onClose, onAddNew }: { onClose: () => void; onAddNew: () => void }) {
  const { t } = useTranslation();
  const [list, setList] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState<OptimizedRoutine | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  useEffect(() => {
    fetch("/api/cosmetics").then(r => r.json()).then(data => {
      const items = Array.isArray(data) ? data : [];
      setList(items);
      setLoading(false);
      if (items.length > 0) {
        setOptimizing(true);
        fetch("/api/cosmetics/optimize-routine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cosmetics: items }),
        }).then(r => r.json()).then(result => {
          if (result.am || result.pm) setOptimized(result);
        }).catch(() => {}).finally(() => setOptimizing(false));
      }
    }).catch(() => setLoading(false));
  }, []);

  const fallbackGuide = buildRoutineGuide(list, t);

  const getOrderedItems = (period: "am" | "pm"): CosmeticItem[] => {
    if (optimized) {
      const orderedIds = [...optimized[period]].sort((a, b) => a.order - b.order);
      return orderedIds.map(({ id }) => list.find(c => c.id === id)).filter(Boolean) as CosmeticItem[];
    }
    return fallbackGuide[period];
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/cosmetics/${id}`, { method: "DELETE" }).catch(() => {});
    setList(prev => prev.filter(i => i.id !== id));
    setSelectedItem(prev => (prev?.id === id ? null : prev));
    setDeletingId(null);
  };

  const quickInsights = [
    list[0] ? t("cosmetics.boardRecent", { name: list[0].name }) : null,
    !list.some((item) => item.category === "선크림") ? t("cosmetics.insightSunscreenTitle") : null,
    optimized?.conflicts?.[0] ? `⚠️ ${optimized.conflicts[0].productNames.join(" + ")} 충돌` : null,
  ].filter(Boolean) as string[];

  const sections = [
    {
      key: "am" as const,
      title: t("result.actionCard.phaseMorning"),
      accent: DEEP_GREEN,
      bg: TINT_GREEN,
      border: "#D7ECE4",
    },
    {
      key: "pm" as const,
      title: t("result.actionCard.phaseEvening"),
      accent: SCAN_TO,
      bg: TINT_WARM,
      border: "#F4DDD3",
    },
  ];

  return (
    <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md pb-10 shadow-2xl overflow-y-auto max-h-[85vh]"
        initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-5 pb-4 border-b border-stone-100 z-10">
          <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <p className="text-base font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.myTitle")}</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-sm">✕</button>
          </div>
        </div>

        <div className="px-5 pt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                <Droplets className="w-7 h-7" />
              </div>
              <p className="text-[14px] font-bold text-stone-600 mb-1">{t("cosmetics.myEmpty")}</p>
              <p className="text-[12px] text-stone-400">{t("cosmetics.myEmptyDesc")}</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl p-5" style={{ background: "#FFFFFF" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("cosmetics.myTitle")}</p>
                    <p className="text-lg font-bold mt-1" style={{ color: DEEP_GREEN }}>{t("cosmetics.boardHeadline")}</p>
                    <p className="text-[11px] text-stone-400 mt-1">{t("cosmetics.boardSub")}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: `${SCAN_FROM}16`, color: SCAN_TO }}>
                    {t("cosmetics.ctaCount", { count: list.length })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {quickInsights.slice(0, 3).map((item) => (
                    <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: TINT_WARM, color: SCAN_TO }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {sections.map(({ key, title, accent, bg }) => {
                  const items = getOrderedItems(key);
                  return (
                    <div key={key} className="rounded-3xl p-4" style={{ background: bg }}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{title}</p>
                          <p className="text-[11px] text-stone-400">
                            {optimizing
                              ? "성분 분석 중..."
                              : items.length > 0
                              ? t("cosmetics.boardStepCount", { count: items.length })
                              : t(key === "am" ? "cosmetics.routineEmptyAm" : "cosmetics.routineEmptyPm")}
                          </p>
                        </div>
                        {optimizing && (
                          <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin shrink-0" />
                        )}
                      </div>
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <button
                            key={`${key}-${item.id}`}
                            onClick={() => setSelectedItem(item)}
                            className="w-full rounded-2xl bg-white border px-3.5 py-3 flex items-center gap-3 text-left"
                            style={{ borderColor: `${accent}20` }}
                          >
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: accent }}>
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate" style={{ color: DEEP_GREEN }}>{t(`cosmetics.categories.${item.category}`)}</p>
                              <p className="text-[11px] text-stone-400 truncate">{item.name}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {optimized?.conflicts && optimized.conflicts.length > 0 && (
                  <div className="rounded-3xl p-4" style={{ background: "#FFF8F0" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                      <p className="text-[13px] font-bold" style={{ color: SCAN_TO }}>성분 충돌 주의</p>
                    </div>
                    <div className="space-y-2.5">
                      {optimized.conflicts.map((c, i) => (
                        <div key={i} className="rounded-2xl bg-white p-3">
                          <p className="text-[11px] font-bold text-stone-700 mb-0.5">{c.productNames.join(" + ")}</p>
                          <p className="text-[11px] text-stone-500">{c.reason}</p>
                          {c.resolution && <p className="text-[11px] mt-1 font-medium" style={{ color: DEEP_GREEN }}>{c.resolution}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl p-4 bg-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[15px] font-bold" style={{ color: DEEP_GREEN }}>{t("cosmetics.collectionTitle")}</p>
                    <p className="text-[11px] text-stone-400">{t("cosmetics.collectionSub")}</p>
                  </div>
                  <button onClick={onAddNew}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white"
                    style={{ background: DEEP_GREEN }}>
                    + {t("cosmetics.ctaBtn")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {list.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="rounded-3xl p-3 bg-stone-50 text-left shadow-[0_4px_14px_rgba(0,0,0,0.03)]"
                    >
                      {item.image_thumbnail
                        ? <img src={item.image_thumbnail} className="w-full h-28 rounded-2xl object-cover bg-stone-200" />
                        : <div className="w-full h-28 rounded-2xl bg-stone-100 flex items-center justify-center">
                            <Droplets className="w-7 h-7 text-stone-400" />
                          </div>
                      }
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-stone-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-stone-400 truncate">{item.brand || t("cosmetics.noBrand")}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2 py-1 rounded-full text-[9px] font-bold"
                            style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                            {t(`cosmetics.categories.${item.category}`)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-[9px] font-bold"
                            style={{ background: `${SCAN_FROM}14`, color: SCAN_TO }}>
                            {item.time_of_day === "am"
                              ? t("cosmetics.amBtn")
                              : item.time_of_day === "pm"
                              ? t("cosmetics.pmBtn")
                              : inferCosmeticTimeOfDay(item.category) === "am"
                              ? t("cosmetics.amBtn")
                              : t("cosmetics.pmBtn")}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && list.length === 0 && (
            <button onClick={onAddNew}
              className="w-full py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 mt-2"
              style={{ background: DEEP_GREEN }}>
              <span>+</span> {t("cosmetics.ctaBtn")}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div className="absolute inset-0 z-[130] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedItem(null)} />
            <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8"
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <div className="flex items-start gap-3">
                {selectedItem.image_thumbnail
                  ? <img src={selectedItem.image_thumbnail} className="w-20 h-20 rounded-3xl object-cover bg-stone-100 shrink-0" />
                  : <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center shrink-0">
                      <Droplets className="w-8 h-8 text-stone-400" />
                    </div>
                }
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-stone-800 text-kr-pretty">{selectedItem.name}</p>
                  <p className="text-[12px] text-stone-400 mt-1">{selectedItem.brand || t("cosmetics.noBrand")}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                      {t(`cosmetics.categories.${selectedItem.category}`)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${SCAN_FROM}14`, color: SCAN_TO }}>
                      {selectedItem.time_of_day === "am"
                        ? t("cosmetics.amBtn")
                        : selectedItem.time_of_day === "pm"
                        ? t("cosmetics.pmBtn")
                        : inferCosmeticTimeOfDay(selectedItem.category) === "am"
                        ? t("cosmetics.amBtn")
                        : t("cosmetics.pmBtn")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <div className="rounded-2xl p-3" style={{ background: TINT_NEUTRAL }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.openedLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: DEEP_GREEN }}>{selectedItem.opened_at || t("cosmetics.detailUnknown")}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.detailStatusLabel")}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: SCAN_TO }}>{t("cosmetics.detailStatusActive")}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl p-4" style={{ background: "#FFFFFF" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.ingredientsLabel")}</p>
                <p className="text-[12px] text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap text-kr-pretty">
                  {selectedItem.ingredients?.trim() || t("cosmetics.ingredientsEmpty")}
                </p>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deletingId === selectedItem.id}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[13px] text-stone-600 bg-stone-50 disabled:opacity-40"
                >
                  {deletingId === selectedItem.id ? "..." : t("cosmetics.deleteConfirm")}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ background: DEEP_GREEN }}
                >
                  {t("cosmetics.confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
