import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Clock, User, ChevronRight } from "lucide-react";
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
} from "./constants";

// 로컬 색상 상수 (임포트 이슈 방지)
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";
const TINT_GREEN = "#F0F7F4";
const TINT_WARM = "#FDF3F0";

// ─── 매거진 탭 ────────────────────────────────────────────────────
type CategoryFilter = typeof CATEGORY_FILTERS[number];
const CATEGORY_I18N_KEYS: Record<CategoryFilter, string> = {
  "전체": "magazine.categories.all",
  "성분": "magazine.categories.ingredients",
  "루틴": "magazine.categories.routine",
  "타입": "magazine.categories.type",
  "케어": "magazine.categories.care",
  "전문가": "magazine.categories.expert",
};

function parseScores(scores: unknown) {
  if (Array.isArray(scores)) return scores.filter(s => s && typeof s === "object");
  if (typeof scores === "string") {
    try {
      const parsed = JSON.parse(scores);
      return Array.isArray(parsed) ? parsed.filter(s => s && typeof s === "object") : [];
    } catch {
      return [];
    }
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
    baumannDistribution: (data.baumannDistribution && typeof data.baumannDistribution === "object")
      ? data.baumannDistribution
      : {},
  };
}

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
        {/* 드래그 핸들 */}
        <div className="pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing shrink-0"
          onPointerDown={e => dragControls.start(e)}>
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* 히어로 이미지 영역 */}
        <div
          className="mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
          style={{
            height: 160,
            background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})`,
            position: "relative",
          }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 52 }}>{article.emoji}</span>
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
              {article.tag}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-xs text-white/80 font-medium">{t("magazine.readTime", { time: article.readTime })}</span>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-10 space-y-4">
            <h2 className="text-[19px] font-black leading-snug" style={{ color: DEEP_GREEN }}>{article.title}</h2>

            {/* 저자 정보 */}
            <div className="flex items-center gap-2.5 py-3 border-y border-stone-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})` }}>
                {article.author ? article.author[0] : "?"}
              </div>
              <div>
                <p className="text-[12px] font-bold text-stone-800">{article.author}</p>
                <p className="text-xs text-stone-400">{article.authorRole} · {article.date}</p>
              </div>
            </div>

            <p className="text-[13px] text-stone-500 leading-relaxed">{article.summary}</p>

            {Array.isArray(article.body) && article.body.map((section, i) => (
              <div key={i} className="space-y-1.5">
                {section.heading && (
                  <h3 className="text-sm font-bold" style={{ color: DEEP_GREEN_LIGHT }}>{section.heading}</h3>
                )}
                <p className="text-[13px] text-stone-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MagazineTab() {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("전체");
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);
  const [rankingData, setRankingData] = useState<any | null>(null);
  const [latestScan, setLatestScan] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/scans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const scan = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (scan) setLatestScan(scan);
        const score = scan?.overallScore ? Number(scan.overallScore) : null;
        return fetch(`/api/ranking${score ? `?myScore=${score}` : ""}`);
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

  const { filtered, featured, rest } = useMemo(() => {
    const articles = getMagazineArticles(i18n.language);
    const f = filter === "전체" ? articles : articles.filter(a => a.category === filter);
    const feat = f.find(a => a.featured) ?? f[0] ?? null;
    return { filtered: f, featured: feat, rest: feat ? f.filter(a => a.id !== feat.id) : f };
  }, [filter, i18n.language]);

  // 모든 아티클 (featured 포함) 하나의 리스트로
  const allArticles = useMemo(() => {
    if (!featured) return rest;
    return [featured, ...rest];
  }, [featured, rest]);

  return (
    <>
      <ScrollArea className="h-[calc(100dvh-60px)]">
        <motion.div className="pb-28" variants={stagger} initial="initial" animate="animate">

          {/* 컴팩트 헤더 */}
          <motion.div variants={fadeChild} className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: SCAN_TO }}>{t("nav.magazine")}</p>
              <h1 className="text-[20px] font-black tracking-tight leading-tight" style={{ color: DEEP_GREEN }}>
                {t("magazine.subtitle")}
              </h1>
            </div>
            {/* 인라인 순위 뱃지 */}
            {rankingData?.myPercentile !== undefined && (
              <div className="px-3 py-1.5 rounded-2xl shrink-0" style={{ background: `${SCAN_FROM}18` }}>
                <p className="text-[10px] text-stone-400 text-center">{t("ranking.topLabel")}</p>
                <p className="text-[15px] font-black leading-none text-center" style={{ color: SCAN_TO }}>
                  {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                </p>
              </div>
            )}
          </motion.div>

          {/* 통계 한줄 바 */}
          {rankingData && (
            <motion.div variants={fadeChild} className="mx-5 mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-0 bg-white"
              style={{ boxShadow: "0 2px 8px rgba(45,95,79,0.06)" }}>
              <div className="flex-1 text-center">
                <p className="text-[10px] text-stone-400">{t("ranking.avgScore")}</p>
                <p className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>{rankingData.avgScore || "—"}</p>
              </div>
              <div className="w-px h-7 bg-stone-100" />
              <div className="flex-1 text-center">
                <p className="text-[10px] text-stone-400">{t("ranking.topScore")}</p>
                <p className="text-[16px] font-black" style={{ color: SCAN_TO }}>{rankingData.topScore || "—"}</p>
              </div>
              <div className="w-px h-7 bg-stone-100" />
              <div className="flex-1 text-center">
                <p className="text-[10px] text-stone-400">{t("ranking.totalData", { count: "" }).trim()}</p>
                <p className="text-[16px] font-black text-stone-700">{rankingData.totalScans || "—"}</p>
              </div>
              {latestOverall > 0 && (
                <>
                  <div className="w-px h-7 bg-stone-100" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-stone-400">{t("idle.latestEyebrow")}</p>
                    <p className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>{latestOverall}</p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* 카테고리 필터 */}
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

          {/* 아티클 목록 (featured 포함 통합) */}
          <div className="px-5 space-y-2.5">
            {allArticles.map((article) => {
              const isFeatured = article.featured;
              return (
                <motion.div
                  key={article.id}
                  variants={fadeChild}
                  onClick={() => setSelectedArticle(article)}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="border-none overflow-hidden"
                    style={{ boxShadow: isFeatured ? "0 4px 16px rgba(45,95,79,0.10)" : "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <CardContent className="p-0 flex items-stretch">
                      {/* 썸네일 */}
                      <div
                        className="shrink-0 flex flex-col items-center justify-center relative"
                        style={{
                          background: `linear-gradient(145deg, ${article.bgFrom}, ${article.bgTo})`,
                          width: isFeatured ? 88 : 72,
                          minHeight: isFeatured ? 100 : 84,
                        }}
                      >
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
                        <span style={{ fontSize: isFeatured ? 34 : 26 }}>{article.emoji}</span>
                        {isFeatured && (
                          <span className="absolute top-2 left-2 text-[9px] font-black text-white/90 bg-black/20 px-1.5 py-0.5 rounded-full leading-none">
                            ★
                          </span>
                        )}
                      </div>
                      {/* 텍스트 */}
                      <div className="flex-1 px-3 py-2.5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: `${article.bgFrom}22`, color: article.bgTo }}>
                              {article.tag}
                            </span>
                            {isFeatured && (
                              <span className="text-[11px] font-bold" style={{ color: DEEP_GREEN }}>PICK</span>
                            )}
                          </div>
                          <h3
                            className="font-bold leading-snug line-clamp-2"
                            style={{ fontSize: isFeatured ? 13 : 12, color: DEEP_GREEN }}
                          >
                            {article.title}
                          </h3>
                          {isFeatured && (
                            <p className="text-[11px] text-stone-400 line-clamp-1 leading-relaxed mt-0.5">{article.summary}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-stone-300 shrink-0" />
                            <span className="text-[11px] text-stone-400">{article.authorRole}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-stone-300 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[11px]">{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center pr-3 shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

        </motion.div>
      </ScrollArea>

      {/* 아티클 읽기 모달 */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
