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
    fetch(`/api/product-recommend?baumann=${baumannType}&limit=20&lang=${lang}`)
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
          {lang === "ja" ? `${baumannType}タイプ おすすめ化粧品` : lang === "en" ? `${baumannType} Recommended Products` : `${baumannType} 타입 추천 화장품`}
        </span>
      </div>
      <p className="px-4 text-[12px] mb-5" style={{ color: TEXT_TERTIARY }}>
        {lang === "ja" ? "カテゴリ別に最も適合する製品を選びました"
          : lang === "en" ? "Best matching product for each step"
          : "카테고리별 최고 매칭 제품을 골라드려요"}
      </p>

      {/* 카테고리별 1위 제품 — 가로 스크롤 */}
      <div className="pl-4 flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
        {products.map((product, idx) => {
          const score = Math.round(product.matchScore);
          const step = stepLabels[product.category];
          const scoreColor = score >= 90 ? DEEP_GREEN : score >= 80 ? "#5C8A6E" : SCAN_TO;
          return (
            <motion.div
              key={product.id}
              initial={reducedMotion ? {} : { opacity: 0, x: 12 }}
              animate={reducedMotion ? {} : { opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="shrink-0 w-[140px] rounded-2xl flex flex-col overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${BORDER_COLOR}` }}
            >
              {/* 스텝 라벨 */}
              <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-0.5">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                  {step?.[0]}
                </span>
                <span className="text-[11px] font-bold" style={{ color: "#5C4F4A" }}>
                  {step?.[1]}
                </span>
              </div>

              {/* 배너 이미지 — 컴팩트 */}
              {product.bannerUrl && (
                <div className="w-full overflow-hidden flex justify-center" style={{ height: 130 }}>
                  <iframe
                    src={product.bannerUrl}
                    width="120" height="240"
                    frameBorder="0" scrolling="no"
                    referrerPolicy="unsafe-url"
                    style={{ border: "none", pointerEvents: "none" }}
                  />
                </div>
              )}

              {/* 매칭 점수 — 눈에 띄게 */}
              <div className="mx-2.5 mt-1 mb-1 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1"
                style={{ background: `${scoreColor}12` }}>
                <span className="text-[14px] font-extrabold" style={{ color: scoreColor }}>
                  {score}%
                </span>
                <span className="text-[10px] font-bold" style={{ color: scoreColor }}>
                  {lang === "ja" ? "適合" : lang === "en" ? "match" : "매칭"}
                </span>
              </div>

              {/* 제품 정보 */}
              <div className="px-2.5 pb-1 flex-1 flex flex-col">
                <p className="text-[10px] font-semibold" style={{ color: TEXT_TERTIARY }}>{product.brand}</p>
                <p className="text-[11px] font-bold mt-0.5 line-clamp-2 leading-snug" style={{ color: "#5C4F4A" }}>{product.name}</p>
              </div>

              {/* 가격 + 구매 */}
              <div className="flex items-center justify-between px-2.5 pb-2 pt-1.5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                <span className="text-[11px] font-bold" style={{ color: "#5C4F4A" }}>
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
                    className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: SCAN_TO, color: "#fff" }}
                  >
                    {lang === "ja" ? "購入" : lang === "en" ? "Buy" : "구매"}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : null}
              </div>
            </motion.div>
          );
        })}
        <div className="shrink-0 w-2" />
      </div>
    </div>
  );
}
