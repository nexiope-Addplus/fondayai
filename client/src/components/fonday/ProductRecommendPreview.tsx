import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ExternalLink, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  DEEP_GREEN,
  SCAN_TO,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_MUTED,
  BORDER_COLOR,
  TINT_GREEN,
} from "./constants";

interface PreviewProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  keyIngredients: string[];
  price: number;
  buyUrl: string;
  matchScore: number;
}

/**
 * 결과 화면 점수 아래에 보이는 TOP 3 추천 미리보기.
 * 전체 추천은 네비바 "추천" 탭에서.
 */
export function ProductRecommendPreview({
  baumannType,
  onViewAll,
  onBuyClick,
}: {
  baumannType: string;
  onViewAll?: () => void;
  onBuyClick?: (product: PreviewProduct) => void;
}) {
  const { i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const lang = i18n.language?.slice(0, 2) || "ko";

  useEffect(() => {
    if (!baumannType) return;
    fetch(`/api/product-recommend?baumann=${baumannType}&limit=3`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setProducts([]));
  }, [baumannType]);

  if (products.length === 0) return null;

  const catLabel: Record<string, Record<string, string>> = {
    ko: { toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저" },
    en: { toner: "Toner", serum: "Serum", cream: "Cream", sunscreen: "Sunscreen", cleanser: "Cleanser" },
    ja: { toner: "化粧水", serum: "美容液", cream: "クリーム", sunscreen: "日焼け止め", cleanser: "洗顔" },
  };
  const cats = catLabel[lang] || catLabel.ko;

  const handleBuy = (p: PreviewProduct) => {
    onBuyClick?.(p);
    // 이벤트 추적
    fetch("/api/events", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "product_recommend_click", event_data: { productId: p.id, brand: p.brand, name: p.name, from: "preview" }, lang, is_guest: true }),
    }).catch(() => {});
  };

  return (
    <div className="mt-4 mb-2">
      {/* 제휴 공시 문구 */}
      <p className="text-[11px] font-bold mb-2" style={{ color: "#5C4F4A" }}>
        {lang === "ja" ? "この投稿はアフィリエイト活動の一環であり、これにより一定額の手数料を受け取っています。"
          : lang === "en" ? "This post is part of the Coupang Partners affiliate program, and we receive a commission from qualifying purchases."
          : "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."}
      </p>

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: SCAN_TO }} />
          <span className="text-[13px] font-bold" style={{ color: "#5C4F4A" }}>
            {lang === "ja" ? `${baumannType}タイプ おすすめ` : lang === "en" ? `For ${baumannType} type` : `${baumannType} 타입 맞춤`}
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-0.5 text-[11px] font-semibold"
            style={{ color: SCAN_TO }}
          >
            {lang === "ja" ? "もっと見る" : lang === "en" ? "See all" : "전체보기"}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* TOP 3 가로 스크롤 */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {products.map((p, idx) => {
          return (
          <motion.div
            key={p.id}
            initial={reducedMotion ? {} : { opacity: 0, y: 6 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="shrink-0 w-[140px] rounded-2xl p-2.5 flex flex-col"
            style={{ background: "#fff", border: `1px solid ${BORDER_COLOR}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {/* 배너 이미지 */}
            {p.bannerUrl && (
              <div className="w-full overflow-hidden rounded-xl mb-2" style={{ height: 120 }}>
                <iframe
                  src={p.bannerUrl}
                  width="120" height="240"
                  frameBorder="0" scrolling="no"
                  referrerPolicy="unsafe-url"
                  style={{ border: "none", borderRadius: 12, transform: "scale(1)", transformOrigin: "top center" }}
                />
              </div>
            )}

            {/* 매칭도 뱃지 */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: Math.round(p.matchScore) >= 90 ? `${DEEP_GREEN}15` : `${SCAN_TO}12`, color: Math.round(p.matchScore) >= 90 ? DEEP_GREEN : SCAN_TO }}
              >
                {lang === "ja" ? "適合" : lang === "en" ? "Match" : "매칭"} {Math.round(p.matchScore)}%
              </span>
              <span className="text-[10px]" style={{ color: TEXT_TERTIARY }}>
                {cats[p.category] || p.category}
              </span>
            </div>

            <p className="text-[10px] font-semibold" style={{ color: TEXT_TERTIARY }}>{p.brand}</p>
            <p className="text-[11px] font-bold mt-0.5 line-clamp-2 leading-tight" style={{ color: "#5C4F4A" }}>{p.name}</p>
            <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
              <span className="text-[11px] font-bold" style={{ color: "#5C4F4A" }}>
                {p.price > 0 ? `${p.price.toLocaleString()}원` : ""}
              </span>
              {p.buyUrl ? (
                <a href={p.buyUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleBuy(p)}
                  className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: SCAN_TO, color: "#fff" }}>
                  {lang === "ja" ? "購入" : lang === "en" ? "Buy" : "구매"}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : null}
            </div>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}
