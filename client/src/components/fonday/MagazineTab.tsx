import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Clock, ChevronRight, Trophy, Activity, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import type { MagazineArticle } from "./types";
import {
  DEEP_GREEN,
  DEEP_GREEN_LIGHT,
  CATEGORY_FILTERS,
  getMagazineArticles,
  fadeChild,
  stagger,
  BG_MUTED,
  BORDER_COLOR,
  FONT_DISPLAY,
  TEXT_TERTIARY,
} from "./constants";
import { apiBase, appFetch } from "./utils";

// 로컬 색상 상수 (임포트 이슈 방지)
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";

// ─── 타입 ────────────────────────────────────────────────────────
type CategoryFilter = typeof CATEGORY_FILTERS[number];
const CATEGORY_I18N_KEYS: Record<CategoryFilter, string> = {
  "전체": "magazine.categories.all",
  "성분": "magazine.categories.ingredients",
  "루틴": "magazine.categories.routine",
  "타입": "magazine.categories.type",
  "케어": "magazine.categories.care",
  "전문가": "magazine.categories.expert",
};

// ─── 유틸 ─────────────────────────────────────────────────────────
function parseScores(scores: unknown) {
  if (Array.isArray(scores)) return scores.filter(s => s && typeof s === "object");
  if (typeof scores === "string") {
    try {
      const parsed = JSON.parse(scores);
      return Array.isArray(parsed) ? parsed.filter(s => s && typeof s === "object") : [];
    } catch { return []; }
  }
  return [];
}

function normalizeRankingData(data: any) {
  if (!data || typeof data !== "object") return null;
  return {
    totalScans: Number(data.totalScans) || 0,
    avgScore: Number(data.avgScore) || 0,
    topScore: Number(data.topScore) || 0,
    myPercentile: (data.myPercentile !== undefined && data.myPercentile !== null) ? Number(data.myPercentile) : undefined,
    scoreDistribution: Array.isArray(data.scoreDistribution) ? data.scoreDistribution : [],
    baumannDistribution: (data.baumannDistribution && typeof data.baumannDistribution === "object") ? data.baumannDistribution : {},
  };
}

function isInRange(score: number, band: any): boolean {
  const rangeStr = band.range ?? band.label;
  if (rangeStr) {
    const parts = String(rangeStr).split("-").map(Number);
    return score >= (parts[0] ?? 0) && score <= (parts[1] ?? 100);
  }
  return score >= (Number(band.min) || 0) && score <= (Number(band.max) || 100);
}

// ─── 점수 분포 바 ─────────────────────────────────────────────────
function DistributionBar({ label, count, pct, isMyRange }: { label: string; count: number; pct: number; isMyRange: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold w-11 shrink-0 text-right" style={{ color: TEXT_TERTIARY }}>{label}</span>
      <div className="flex-1 h-[14px] rounded-full overflow-hidden relative" style={{ background: "#F0EDE8" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: isMyRange ? `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` : `${DEEP_GREEN}55` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 3)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <span className="absolute right-2 inset-y-0 flex items-center text-[11px] font-bold" style={{ color: TEXT_TERTIARY }}>
          {count}
        </span>
      </div>
      {isMyRange && (
        <span className="text-[11px] font-black shrink-0" style={{ color: SCAN_TO }}>◀</span>
      )}
      {!isMyRange && <span className="w-3 shrink-0" />}
    </div>
  );
}

// ─── 아티클 읽기 모달 ─────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: MagazineArticle; onClose: () => void }) {
  const { t } = useTranslation();
  const dragControls = useDragControls();
  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y" dragControls={dragControls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) onClose(); }}
      >
        <div className="pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing shrink-0"
          onPointerDown={e => dragControls.start(e)}>
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        <div
          className="mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
          style={{ height: 160, background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})`, position: "relative" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontSize: 52 }}>{article.emoji}</span>
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">{article.tag}</span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80 font-medium">{t("magazine.readTime", { time: article.readTime })}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-10 space-y-4">
            <h2 className="text-[19px] font-black leading-snug" style={{ color: DEEP_GREEN }}>{article.title}</h2>
            <div className="flex items-center gap-2.5 py-3 border-y border-stone-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})` }}>
                {article.author ? article.author[0] : "?"}
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#5C4F4A]">{article.author}</p>
                <p className="text-xs text-stone-400">{article.authorRole} · {article.date}</p>
              </div>
            </div>
            <p className="text-[13px] text-stone-500 leading-relaxed">{article.summary}</p>
            {Array.isArray(article.body) && article.body.map((section, i) => (
              <div key={i} className="space-y-1.5">
                {section.heading && <h3 className="text-sm font-bold" style={{ color: DEEP_GREEN_LIGHT }}>{section.heading}</h3>}
                <p className="text-[13px] text-stone-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── 메인 탭 ─────────────────────────────────────────────────────
export function MagazineTab() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("전체");
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);
  const [rankingData, setRankingData] = useState<any | null>(null);
  const [latestScan, setLatestScan] = useState<any | null>(null);

  useEffect(() => {
    appFetch(`${apiBase()}/api/scans`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const scan = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (scan) setLatestScan(scan);
        const score = scan?.overallScore ? Number(scan.overallScore) : null;
        return appFetch(`${apiBase()}/api/ranking${score ? `?myScore=${score}` : ""}`);
      })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRankingData(normalizeRankingData(data)))
      .catch(() => setRankingData(null));
  }, []);

  const weakestScores = useMemo(() => {
    const scores = parseScores(latestScan?.scores);
    if (scores.length === 0) return [];
    return [...scores]
      .filter((s: any) => s && typeof s.score !== "undefined")
      .sort((a: any, b: any) => (Number(a.score) || 0) - (Number(b.score) || 0))
      .slice(0, 3);
  }, [latestScan]);

  const latestOverall = useMemo(() => {
    const val = latestScan?.overallScore ?? 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }, [latestScan]);

  const distributionBands = useMemo(() => {
    if (!rankingData?.scoreDistribution?.length) return [];
    const maxCount = Math.max(...rankingData.scoreDistribution.map((b: any) => Number(b.count) || 0));
    return rankingData.scoreDistribution.map((b: any) => ({
      label: String(b.range ?? b.label ?? `${b.min ?? "?"}-${b.max ?? "?"}`),
      count: Number(b.count) || 0,
      pct: maxCount > 0 ? Math.round(((Number(b.count) || 0) / maxCount) * 100) : 0,
      isMyRange: latestOverall > 0 && isInRange(latestOverall, b),
    }));
  }, [rankingData, latestOverall]);

  const topBaumann = useMemo(() => {
    if (!rankingData?.baumannDistribution) return [];
    const total = Object.values(rankingData.baumannDistribution as Record<string, number>).reduce((s: number, v) => s + (Number(v) || 0), 0);
    return Object.entries(rankingData.baumannDistribution as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([type, count]) => ({ type, count: Number(count) || 0, pct: total > 0 ? Math.round((Number(count) / total) * 100) : 0 }));
  }, [rankingData]);

  const allArticles = useMemo(() => {
    const articles = getMagazineArticles(i18n.language);
    const f = filter === "전체" ? articles : articles.filter(a => a.category === filter);
    const feat = f.find(a => a.featured) ?? f[0] ?? null;
    return feat ? [feat, ...f.filter(a => a.id !== feat.id)] : f;
  }, [filter, i18n.language]);

  const avgDelta = rankingData?.avgScore && latestOverall > 0 ? latestOverall - rankingData.avgScore : 0;

  return (
    <>
      <ScrollArea className="h-[calc(100dvh-60px)]">
        <motion.div className="pb-28 overflow-x-hidden" variants={stagger} initial="initial" animate="animate">

          {/* 헤더 */}
          <motion.div variants={fadeChild} className="px-5 pt-5 pb-4">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{t("nav.magazine")}</p>
            <h1 className="text-[21px] font-black tracking-tight leading-tight" style={{ color: DEEP_GREEN }}>
              {t("magazine.subtitle")}
            </h1>
          </motion.div>

          {/* ── 내 순위 카드 (PRIMARY) ── */}
          {latestOverall > 0 && rankingData && (
            <motion.div variants={fadeChild} className="mx-5 mb-4">
              <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, #4A7C6E)` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-1" style={{ fontFamily: FONT_DISPLAY }}>{t("idle.latestEyebrow")}</p>
                    <p className="text-[44px] font-normal text-white leading-none" style={{ fontFamily: FONT_DISPLAY }}>{latestOverall}</p>
                    {avgDelta !== 0 && (
                      <p className="text-[11px] text-white/60 mt-1">
                        {avgDelta > 0 ? `▲ +${avgDelta}` : `▼ ${avgDelta}`} {t("ranking.avgScore")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="px-3 py-2 rounded-2xl mb-2" style={{ background: "rgba(255,255,255,0.15)" }}>
                      <p className="text-[11px] text-white/60 mb-0.5" style={{ fontFamily: FONT_DISPLAY }}>{t("ranking.topLabel")}</p>
                      {rankingData.myPercentile !== undefined ? (
                        <p className="text-[20px] font-normal text-white leading-none" style={{ fontFamily: FONT_DISPLAY }}>
                          {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                        </p>
                      ) : (
                        <p className="text-[12px] font-bold text-white/50">—</p>
                      )}
                    </div>
                    <Trophy className="w-4 h-4 ml-auto text-white/30" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 커뮤니티 통계 바 ── */}
          {rankingData && (
            <motion.div variants={fadeChild} className="mx-5 mb-4">
              <div className="rounded-2xl px-4 py-3 flex items-center gap-0 bg-white" style={{ border: `1px solid ${BORDER_COLOR}` }}>
                <div className="flex-1 text-center min-w-0">
                  <p className="text-[11px] truncate" style={{ color: TEXT_TERTIARY }}>{t("ranking.avgScore")}</p>
                  <p className="text-[17px] font-normal" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{rankingData.avgScore || "—"}</p>
                </div>
                <div className="w-px h-7 shrink-0" style={{ background: BORDER_COLOR }} />
                <div className="flex-1 text-center min-w-0">
                  <p className="text-[11px] truncate" style={{ color: TEXT_TERTIARY }}>{t("ranking.topScore")}</p>
                  <p className="text-[17px] font-normal" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{rankingData.topScore || "—"}</p>
                </div>
                <div className="w-px h-7 shrink-0" style={{ background: BORDER_COLOR }} />
                <div className="flex-1 text-center min-w-0">
                  <p className="text-[11px] truncate" style={{ color: TEXT_TERTIARY }}>{t("result.totalScans")}</p>
                  <p className="text-[17px] font-normal text-[#6B5D55]" style={{ fontFamily: FONT_DISPLAY }}>{rankingData.totalScans || "—"}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 점수 분포 ── */}
          {distributionBands.length > 0 && (
            <motion.div variants={fadeChild} className="mx-5 mb-4">
              <Card className="rounded-2xl overflow-hidden border-none" style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: DEEP_GREEN }} />
                    <p className="text-[12px] font-bold" style={{ color: DEEP_GREEN }}>{t("ranking.distribution", { defaultValue: "점수 분포" })}</p>
                  </div>
                  <div className="space-y-2">
                    {distributionBands.map((b) => (
                      <DistributionBar key={b.label} {...b} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── 내 개선 포인트 ── */}
          {weakestScores.length > 0 && (
            <motion.div variants={fadeChild} className="mx-5 mb-4">
              <Card className="rounded-2xl overflow-hidden border-none" style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" style={{ color: SCAN_TO }} />
                    <p className="text-[12px] font-bold" style={{ color: SCAN_TO }}>{t("ranking.weakPoints", { defaultValue: "개선 포인트" })}</p>
                  </div>
                  <div className="flex gap-2">
                    {weakestScores.map((s: any, i) => {
                      const idx = s.idx ?? s.category ?? s.name ?? i;
                      const label = t(`scores.${idx}`, { defaultValue: String(idx) });
                      const score = Number(s.score) || 0;
                      return (
                        <div key={i} className="flex-1 rounded-2xl p-2.5 text-center" style={{ background: "#FFF5F5" }}>
                          <p className="text-[11px] mb-1 leading-tight line-clamp-2" style={{ color: TEXT_TERTIARY }}>{label}</p>
                          <p className="text-[20px] font-normal leading-none" style={{ color: "#DC2626", fontFamily: FONT_DISPLAY }}>{score}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Baumann 타입 분포 ── */}
          {topBaumann.length > 0 && (
            <motion.div variants={fadeChild} className="mx-5 mb-4">
              <Card className="rounded-2xl overflow-hidden border-none" style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                <CardContent className="p-4">
                  <p className="text-[12px] font-bold mb-3" style={{ color: DEEP_GREEN }}>{t("result.baumannLabel")}</p>
                  <div className="space-y-2">
                    {topBaumann.map(({ type, count, pct }) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-[11px] font-black w-10 shrink-0" style={{ color: DEEP_GREEN }}>{type}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "#F0EDE8" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `${DEEP_GREEN}55` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 3)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[11px] font-bold w-8 shrink-0 text-right" style={{ color: TEXT_TERTIARY }}>{pct}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── 매거진 구분선 ── */}
          <motion.div variants={fadeChild} className="mx-5 mb-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-100" />
            <p className="text-[11px] font-bold tracking-widest uppercase text-stone-300">{t("nav.magazine")}</p>
            <div className="flex-1 h-px bg-stone-100" />
          </motion.div>

          {/* ── 카테고리 필터 ── */}
          <motion.div variants={fadeChild} className="px-5 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={filter === cat
                    ? { background: DEEP_GREEN, color: "white" }
                    : { background: "#F3F1EE", color: "#8C8070" }
                  }
                >
                  {t(CATEGORY_I18N_KEYS[cat])}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── 아티클 목록 (compact, secondary) ── */}
          <div className="px-5 space-y-2">
            {allArticles.map((article) => (
              <motion.div
                key={article.id}
                variants={fadeChild}
                onClick={() => setSelectedArticle(article)}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden" style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                  <CardContent className="p-0 flex items-stretch">
                    <div
                      className="shrink-0 flex items-center justify-center relative"
                      style={{ background: `linear-gradient(145deg, ${article.bgFrom}, ${article.bgTo})`, width: 64, minHeight: 72 }}
                    >
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
                      <span style={{ fontSize: 24 }}>{article.emoji}</span>
                    </div>
                    <div className="flex-1 px-3 py-2.5 flex flex-col justify-between min-w-0">
                      <div>
                        <span className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded-full mb-0.5"
                          style={{ background: `${article.bgFrom}22`, color: article.bgTo }}>
                          {article.tag}
                        </span>
                        <h3 className="text-[12px] font-bold leading-snug line-clamp-2" style={{ color: DEEP_GREEN }}>
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] truncate min-w-0 mr-2" style={{ color: TEXT_TERTIARY }}>{article.authorRole}</span>
                        <div className="flex items-center gap-0.5 text-stone-300 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[11px]">{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center pr-2.5 shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </ScrollArea>

      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
