import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEEP_GREEN, SCAN_TO, TINT_GREEN, TINT_WARM } from "./constants";
import type { AnalysisResult, CosmeticItem, CosmeticGrade } from "./types";

// ─── 세션 레벨 캐시 (컴포넌트 재마운트 시에도 유지) ─────────────────
const _gradeCache: Record<string, CosmeticGrade[]> = {};

// ─── 등급별 색상 ──────────────────────────────────────────────────
const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  A: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "최적" },
  B: { color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD", label: "적합" },
  C: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "보통" },
  D: { color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", label: "주의" },
  F: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "부적합" },
};

// ─── 개별 제품 카드 ───────────────────────────────────────────────
function GradeCard({ cosmetic, grade }: { cosmetic: CosmeticItem; grade: CosmeticGrade }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const cfg = GRADE_CONFIG[grade.grade] ?? GRADE_CONFIG["C"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: "#FFFFFF", boxShadow: "0 4px 16px rgba(45,95,79,0.06)", border: `1px solid ${cfg.border}` }}
    >
      <button
        className="w-full p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {/* 썸네일 or 카테고리 아이콘 */}
          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-stone-100 flex items-center justify-center">
            {cosmetic.image_thumbnail ? (
              <img src={cosmetic.image_thumbnail} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🧴</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: DEEP_GREEN }}>{cosmetic.name}</p>
            {cosmetic.brand && (
              <p className="text-xs text-stone-400 truncate">{cosmetic.brand}</p>
            )}
            <p className="text-xs text-stone-500 mt-0.5 truncate">{grade.summary}</p>
          </div>

          {/* 등급 배지 */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg"
              style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}
            >
              {grade.grade}
            </div>
            <p className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>

          <div className="shrink-0 ml-1">
            {expanded
              ? <ChevronUp className="w-4 h-4 text-stone-300" />
              : <ChevronDown className="w-4 h-4 text-stone-300" />}
          </div>
        </div>

        {/* 점수 바 */}
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 truncate min-w-0">{t("cosmeticsReport.compatibility")}</p>
            <p className="text-[11px] font-bold shrink-0" style={{ color: cfg.color }}>{grade.score}{t("result.scoreSuffix")}</p>
          </div>
          <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${grade.score}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              style={{ background: cfg.color }}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
              {grade.pros.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#059669" }}>{t("cosmeticsReport.pros")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grade.pros.map((p, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#ECFDF5", color: "#059669" }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {grade.cons.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#EA580C" }}>{t("cosmeticsReport.cons")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grade.cons.map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FFF7ED", color: "#EA580C" }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {grade.keyIngredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-stone-400">{t("cosmeticsReport.keyIngredients")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grade.keyIngredients.map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: TINT_GREEN, color: DEEP_GREEN }}>{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {grade.conflictIngredients.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#DC2626" }}>{t("cosmeticsReport.conflicts")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grade.conflictIngredients.map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#FEF2F2", color: "#DC2626" }}>{ing}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 성적표 요약 헤더 ─────────────────────────────────────────────
function GradeSummaryBar({ grades }: { grades: CosmeticGrade[] }) {
  const { t } = useTranslation();
  const counts = grades.reduce<Record<string, number>>((acc, g) => {
    acc[g.grade] = (acc[g.grade] || 0) + 1;
    return acc;
  }, {});
  const avg = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length) : 0;
  const cfg = avg >= 90 ? GRADE_CONFIG.A : avg >= 75 ? GRADE_CONFIG.B : avg >= 60 ? GRADE_CONFIG.C : avg >= 40 ? GRADE_CONFIG.D : GRADE_CONFIG.F;

  return (
    <div className="rounded-3xl p-4 mb-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{t("cosmeticsReport.avgScore")}</p>
          <p className="text-3xl font-black mt-0.5" style={{ color: cfg.color }}>{avg}{t("result.scoreSuffix")}</p>
        </div>
        <div className="flex gap-1.5">
          {(["A", "B", "C", "D", "F"] as const).map((g) => counts[g] ? (
            <div key={g} className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                style={{ background: GRADE_CONFIG[g].bg, color: GRADE_CONFIG[g].color, border: `1px solid ${GRADE_CONFIG[g].border}` }}>
                {g}
              </div>
              <span className="text-[10px] font-bold mt-0.5 text-stone-400">×{counts[g]}</span>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 모달 ────────────────────────────────────────────────────
export function CosmeticsReportCard({
  myCosmetics,
  analysisResult,
  finalType,
  onClose,
  onAddCosmetic,
}: {
  myCosmetics: CosmeticItem[];
  analysisResult: AnalysisResult | null;
  finalType: string;
  onClose: () => void;
  onAddCosmetic: () => void;
}) {
  const { t, i18n } = useTranslation();
  const dragControls = useDragControls();
  const [grades, setGrades] = useState<CosmeticGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const hasFetched = useRef(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cacheKey = `${finalType}_${i18n.language}`;

  const startProgress = () => {
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) { clearInterval(progressTimer.current!); return 88; }
        return p + (88 - p) * 0.06;
      });
    }, 120);
  };
  const finishProgress = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 400);
  };

  const doFetch = () => {
    setLoading(true);
    setError(false);
    startProgress();
    fetch("/api/cosmetics/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baumannType: finalType,
        scores: analysisResult?.scores ?? [],
        lang: i18n.language,
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const result = Array.isArray(data) ? data : [];
        _gradeCache[cacheKey] = result;
        setGrades(result);
      })
      .catch(() => setError(true))
      .finally(() => { finishProgress(); setLoading(false); });
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (myCosmetics.length === 0) return;
    // 캐시 확인
    if (_gradeCache[cacheKey]) {
      setGrades(_gradeCache[cacheKey]);
      return;
    }
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 등록된 화장품과 grade 결과를 id로 매칭
  const gradeMap = Object.fromEntries(grades.map((g) => [g.id, g]));

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) onClose(); }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: SCAN_TO }}>{t("cosmeticsReport.eyebrow")}</p>
            <h2 className="text-lg font-bold mt-0.5" style={{ color: DEEP_GREEN }}>{t("cosmeticsReport.title")}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!loading && grades.length > 0 && (
              <button
                onClick={() => {
                  hasFetched.current = false;
                  delete _gradeCache[cacheKey];
                  setGrades([]);
                  doFetch();
                }}
                aria-label={t("common.refresh")}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: TINT_WARM }}
              >
                <RotateCcw className="w-4 h-4" style={{ color: SCAN_TO }} />
              </button>
            )}
            <button onClick={onClose} aria-label={t("common.close")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F5F5F4" }}>
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {/* 화장품 없는 경우 */}
          {myCosmetics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🧴</p>
              <p className="text-sm font-bold text-stone-600">{t("cosmeticsReport.emptyTitle")}</p>
              <p className="text-xs text-stone-400 mt-1 mb-4">{t("cosmeticsReport.emptySub")}</p>
              <Button
                onClick={onAddCosmetic}
                className="rounded-full px-5 h-10 text-sm font-bold text-white"
                style={{ background: DEEP_GREEN }}
              >
                <Plus className="w-4 h-4 mr-1" />{t("cosmeticsReport.addBtn")}
              </Button>
            </div>
          )}

          {/* 로딩 */}
          {loading && myCosmetics.length > 0 && (
            <div className="space-y-3">
              {/* 분석 진행 바 */}
              <div className="rounded-3xl p-4" style={{ background: "#F0F9F4", border: "1px solid #D1FAE5" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: DEEP_GREEN }}>{t("cosmeticsReport.analyzing")}</p>
                  <p className="text-xs font-bold tabular-nums" style={{ color: DEEP_GREEN }}>{Math.round(progress)}%</p>
                </div>
                <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ background: "linear-gradient(90deg, #059669, #34d399)" }}
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-2">{t("cosmeticsReport.analyzingDesc")}</p>
              </div>
              {myCosmetics.map((_, i) => (
                <div key={i} className="rounded-3xl bg-stone-100 animate-pulse" style={{ height: 80 }} />
              ))}
            </div>
          )}

          {/* 에러 */}
          {error && !loading && (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-stone-500">{t("cosmeticsReport.error")}</p>
            </div>
          )}

          {/* 결과 */}
          {!loading && !error && grades.length > 0 && (
            <div className="space-y-3">
              <GradeSummaryBar grades={grades} />
              {myCosmetics.map((c) => {
                const grade = gradeMap[c.id];
                if (!grade) return null;
                return <GradeCard key={c.id} cosmetic={c} grade={grade} />;
              })}
              <button
                onClick={onAddCosmetic}
                className="w-full rounded-3xl py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: TINT_WARM, color: SCAN_TO }}
              >
                <Plus className="w-4 h-4" />{t("cosmeticsReport.addMore")}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
