import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Clock, User, ChevronRight, BarChart3, Salad, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import type { MagazineArticle } from "./types";
import {
  DEEP_GREEN,
  DEEP_GREEN_LIGHT,
  SCAN_TO,
  TINT_GREEN,
  TINT_WARM,
  CATEGORY_FILTERS,
  MAGAZINE_ARTICLES,
  fadeChild,
  stagger,
} from "./constants";

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
                {article.author[0]}
              </div>
              <div>
                <p className="text-[12px] font-bold text-stone-800">{article.author}</p>
                <p className="text-xs text-stone-400">{article.authorRole} · {article.date}</p>
              </div>
            </div>

            <p className="text-[13px] text-stone-500 leading-relaxed">{article.summary}</p>

            {article.body.map((section, i) => (
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
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("전체");
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);
  const [rankingData, setRankingData] = useState<any | null>(null);
  const [latestScan, setLatestScan] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRankingData(data))
      .catch(() => setRankingData(null));
    fetch("/api/scans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLatestScan(data[0]);
      })
      .catch(() => setLatestScan(null));
  }, []);

  const weakestScores = useMemo(() => {
    if (!latestScan?.scores || !Array.isArray(latestScan.scores)) return [];
    return [...latestScan.scores]
      .sort((a: any, b: any) => Number(a.score) - Number(b.score))
      .slice(0, 3);
  }, [latestScan]);

  const filtered = filter === "전체"
    ? MAGAZINE_ARTICLES
    : MAGAZINE_ARTICLES.filter(a => a.category === filter);

  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const rest = filtered.filter(a => a.id !== featured.id);

  return (
    <>
      <ScrollArea className="h-[calc(100dvh-60px)]">
        <motion.div className="pb-28" variants={stagger} initial="initial" animate="animate">

          {/* 헤더 */}
          <motion.div variants={fadeChild} className="px-5 pt-6 pb-4">
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>{t("nav.magazine")}</p>
            <h1 className="text-[24px] font-black tracking-tight leading-tight whitespace-pre-line" style={{ color: DEEP_GREEN }}>
              {t("discover.title")}
            </h1>
          </motion.div>

          <motion.div variants={fadeChild} className="px-5 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white p-4" style={{ boxShadow: "0 10px 24px rgba(45,95,79,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_GREEN }}>
                    <BarChart3 className="w-4.5 h-4.5" style={{ color: DEEP_GREEN }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800">{t("discover.rankingTitle")}</p>
                    <p className="text-xs text-stone-400">
                      {rankingData ? t("ranking.totalData", { count: rankingData.totalScans }) : t("discover.rankingEmpty")}
                    </p>
                  </div>
                </div>
                <p className="text-[22px] font-bold" style={{ color: DEEP_GREEN }}>
                  {rankingData?.myPercentile !== undefined ? `${rankingData.myPercentile}%` : "—"}
                </p>
                <p className="text-xs text-stone-400 mt-1">{t("ranking.topLabel")}</p>
              </div>

              <div className="rounded-3xl bg-white p-4" style={{ boxShadow: "0 10px 24px rgba(45,95,79,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
                    <Salad className="w-4.5 h-4.5" style={{ color: SCAN_TO }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800">{t("discover.nutritionTitle")}</p>
                    <p className="text-xs text-stone-400">{t("discover.feedTitle")}</p>
                  </div>
                </div>
                {weakestScores[0] ? (
                  <>
                    <p className="text-[14px] font-bold text-stone-800">{weakestScores[0].label}</p>
                    <p className="text-xs mt-1" style={{ color: SCAN_TO }}>{weakestScores[0].score}{t("result.scoreSuffix")}</p>
                  </>
                ) : (
                  <p className="text-xs text-stone-400">{t("discover.nutritionEmpty")}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* 카테고리 필터 */}
          <motion.div variants={fadeChild} className="px-5 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all"
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

          {/* 피처드 히어로 카드 */}
          {featured && (
            <motion.div variants={fadeChild} className="px-5 mb-5">
              <motion.div
                onClick={() => setSelectedArticle(featured)}
                whileTap={{ scale: 0.98 }}
                className="rounded-3xl overflow-hidden shadow-lg cursor-pointer"
                style={{ background: `linear-gradient(145deg, ${featured.bgFrom}, ${featured.bgTo})` }}
              >
                {/* 이미지 영역 */}
                <div className="relative" style={{ height: 200 }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
                  {/* 장식 원 */}
                  <div className="absolute right-6 top-6 w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <span style={{ fontSize: 44 }}>{featured.emoji}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }} />
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      ★ FEATURED
                    </span>
                  </div>
                </div>
                {/* 텍스트 영역 */}
                <div className="px-5 pb-5 pt-3 bg-white/95">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${featured.bgFrom}22`, color: featured.bgTo }}>
                      {featured.tag}
                    </span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-400">{t("magazine.readTime", { time: featured.readTime })}</span>
                  </div>
                  <h2 className="text-base font-bold leading-snug mb-2" style={{ color: DEEP_GREEN }}>
                    {featured.title}
                  </h2>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{featured.summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                        style={{ background: `linear-gradient(135deg, ${featured.bgFrom}, ${featured.bgTo})` }}>
                        {featured.author[0]}
                      </div>
                      <span className="text-xs font-bold text-stone-500">{featured.author}</span>
                      <span className="text-xs text-stone-300">{featured.authorRole}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: featured.bgTo }}>
                      <span className="text-xs font-bold">{t("magazine.read")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 나머지 아티클 목록 */}
          <div className="px-5 space-y-3">
            {rest.map((article, idx) => (
              <div key={article.id}>
                <motion.div
                  variants={fadeChild}
                  onClick={() => setSelectedArticle(article)}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex items-stretch">
                      {/* 썸네일 */}
                      <div
                        className="w-24 shrink-0 flex flex-col items-center justify-center relative"
                        style={{ background: `linear-gradient(145deg, ${article.bgFrom}, ${article.bgTo})`, minHeight: 96 }}
                      >
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                        <span style={{ fontSize: 32 }}>{article.emoji}</span>
                      </div>
                      {/* 텍스트 */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: `${article.bgFrom}22`, color: article.bgTo }}>
                              {article.tag}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold leading-snug line-clamp-2 mb-1" style={{ color: DEEP_GREEN }}>
                            {article.title}
                          </h3>
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{article.summary}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-stone-300" />
                            <span className="text-xs text-stone-400">{article.author}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-stone-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-xs">{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ))}
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
