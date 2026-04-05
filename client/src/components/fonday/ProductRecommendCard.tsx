import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Sparkles, CheckCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { autoRegisterCosmetic } from "./utils";
import {
  DEEP_GREEN,
  SCAN_TO,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_MUTED,
  BORDER_COLOR,
  TINT_GREEN,
} from "./constants";

interface RecommendedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  keyIngredients: string[];
  targetConcern: string;
  price: number;
  priceCurrency: string;
  buyUrl: string;
  bannerUrl: string;
  imageUrl: string;
  matchScore: number;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ko: { toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저" },
  en: { toner: "Toner", serum: "Serum", cream: "Cream", sunscreen: "Sunscreen", cleanser: "Cleanser" },
  ja: { toner: "化粧水", serum: "美容液", cream: "クリーム", sunscreen: "日焼け止め", cleanser: "洗顔" },
};

const CATEGORY_ORDER = ["cleanser", "toner", "serum", "cream", "sunscreen"];

const STEP_LABELS: Record<string, Record<string, string[]>> = {
  ko: {
    cleanser: ["STEP 1", "세안"],
    toner: ["STEP 2", "토너"],
    serum: ["STEP 3", "세럼"],
    cream: ["STEP 4", "크림"],
    sunscreen: ["STEP 5", "선크림"],
  },
  en: {
    cleanser: ["STEP 1", "Cleanse"],
    toner: ["STEP 2", "Tone"],
    serum: ["STEP 3", "Treat"],
    cream: ["STEP 4", "Moisturize"],
    sunscreen: ["STEP 5", "Protect"],
  },
  ja: {
    cleanser: ["STEP 1", "洗顔"],
    toner: ["STEP 2", "化粧水"],
    serum: ["STEP 3", "美容液"],
    cream: ["STEP 4", "クリーム"],
    sunscreen: ["STEP 5", "日焼け止め"],
  },
};

export function ProductRecommendCard({ baumannType }: { baumannType: string }) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language?.slice(0, 2) || "ko";

  const fireEvent = (type: string, data?: Record<string, unknown>) => {
    fetch("/api/events", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: type, event_data: data ?? {}, lang, is_guest: true }),
    }).catch(() => {});
  };

  useEffect(() => {
    if (!baumannType) return;
    setLoading(true);
    fetch(`/api/product-recommend?baumann=${baumannType}&limit=20`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const items: RecommendedProduct[] = Array.isArray(data?.products) ? data.products : [];
        // 카테고리별 매칭 1위만 추출
        const bestByCategory: RecommendedProduct[] = [];
        for (const cat of CATEGORY_ORDER) {
          const best = items
            .filter(p => p.category === cat)
            .sort((a, b) => b.matchScore - a.matchScore)[0];
          if (best) bestByCategory.push(best);
        }
        setProducts(bestByCategory);
        if (bestByCategory.length) fireEvent("product_recommend_view", { baumann: baumannType, count: bestByCategory.length });
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [baumannType]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full" style={{ background: TINT_GREEN }} />
          <div className="h-4 w-32 rounded" style={{ background: BG_MUTED }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl mb-3" style={{ background: BG_MUTED }} />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  const catLabels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.ko;
  const stepLabels = STEP_LABELS[lang] || STEP_LABELS.ko;

  return (
    <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
      {/* 제휴 공시 문구 */}
      <p className="px-4 text-[11px] font-bold mb-2" style={{ color: "#5C4F4A" }}>
        {t("product.affiliateDisclosure", "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.")}
      </p>

      {/* 섹션 제목 */}
      <div className="px-4 flex items-center gap-2 mb-1">
        <Sparkles className="w-4.5 h-4.5" style={{ color: DEEP_GREEN }} />
        <span className="font-extrabold text-[16px]" style={{ color: "#4A403A" }}>
          {lang === "ja" ? `${baumannType}の処方箋` : lang === "en" ? `${baumannType} Routine` : `${baumannType} 맞춤 루틴`}
        </span>
      </div>
      <p className="px-4 text-[12px] mb-5" style={{ color: TEXT_TERTIARY }}>
        {lang === "ja" ? "カテゴリ別に最も適合する製品を選びました"
          : lang === "en" ? "Best matching product for each step"
          : "카테고리별 최고 매칭 제품을 골라드려요"}
      </p>

      {/* 카테고리별 1위 제품 리스트 */}
      <div className="px-4 flex flex-col gap-4">
        {products.map((product, idx) => {
          const score = Math.round(product.matchScore);
          const step = stepLabels[product.category];
          return (
            <motion.div
              key={product.id}
              initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${BORDER_COLOR}` }}
            >
              {/* 스텝 헤더 */}
              <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                  {step?.[0]}
                </span>
                <span className="text-[12px] font-bold" style={{ color: "#5C4F4A" }}>
                  {step?.[1]}
                </span>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: score >= 85 ? `${DEEP_GREEN}15` : `${SCAN_TO}12`, color: score >= 85 ? DEEP_GREEN : SCAN_TO }}>
                  {lang === "ja" ? "適合" : lang === "en" ? "Match" : "매칭"} {score}%
                </span>
              </div>

              {/* 배너 이미지 + 제품 정보 */}
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                {/* 배너 이미지 */}
                {product.bannerUrl ? (
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#FAFAFA" }}>
                    <iframe
                      src={product.bannerUrl}
                      width="120" height="240"
                      frameBorder="0" scrolling="no"
                      referrerPolicy="unsafe-url"
                      style={{ border: "none", transform: "scale(0.6)", transformOrigin: "top center", pointerEvents: "none" }}
                    />
                  </div>
                ) : (
                  <div className="w-[72px] h-[72px] rounded-xl shrink-0 flex items-center justify-center" style={{ background: TINT_GREEN }}>
                    <CheckCircle className="w-6 h-6" style={{ color: DEEP_GREEN }} />
                  </div>
                )}

                {/* 제품 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold" style={{ color: TEXT_TERTIARY }}>
                    {product.brand}
                  </p>
                  <p className="text-[13px] font-bold mt-0.5 line-clamp-2 leading-snug" style={{ color: "#5C4F4A" }}>
                    {product.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.keyIngredients.slice(0, 3).map(ing => (
                      <span key={ing} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${DEEP_GREEN}0A`, color: DEEP_GREEN }}>
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 가격 + 구매 */}
              <div className="flex items-center justify-between px-3.5 pb-3 pt-1" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                <span className="text-[13px] font-bold" style={{ color: "#5C4F4A" }}>
                  {product.price > 0 ? `${product.price.toLocaleString()}원` : ""}
                </span>
                {product.buyUrl ? (
                  <a
                    href={product.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      fireEvent("product_recommend_click", { productId: product.id, brand: product.brand, name: product.name });
                      autoRegisterCosmetic(product);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full"
                    style={{ background: SCAN_TO, color: "#fff" }}
                  >
                    {lang === "ja" ? "購入する" : lang === "en" ? "Buy Now" : "구매하기"}
                    <ExternalLink className="w-3 h-3" />
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
