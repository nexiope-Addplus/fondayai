import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag, ExternalLink, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  DEEP_GREEN,
  SCAN_TO,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_MUTED,
  BORDER_COLOR,
  TINT_GREEN,
  RADIUS_CARD,
  RADIUS_SUB,
  RADIUS_ITEM,
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
  imageUrl: string;
  matchScore: number;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ko: { toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저" },
  en: { toner: "Toner", serum: "Serum", cream: "Cream", sunscreen: "Sunscreen", cleanser: "Cleanser" },
  ja: { toner: "化粧水", serum: "美容液", cream: "クリーム", sunscreen: "日焼け止め", cleanser: "洗顔" },
};

export function ProductRecommendCard({ baumannType }: { baumannType: string }) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
    fetch(`/api/product-recommend?baumann=${baumannType}&limit=12`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const items = Array.isArray(data?.products) ? data.products : [];
        setProducts(items);
        if (items.length) fireEvent("product_recommend_view", { baumann: baumannType, count: items.length });
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

  const categories = ["all", ...new Set(products.map(p => p.category))];
  const filtered = selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory);
  const catLabels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.ko;

  return (
    <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
      {/* 섹션 제목 */}
      <div className="px-4 flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4" style={{ color: DEEP_GREEN }} />
        <span className="font-bold text-[15px]" style={{ color: "#5C4F4A" }}>
          {t("product.title", { type: baumannType, defaultValue: `${baumannType} 타입 맞춤 추천` })}
        </span>
      </div>
      <p className="px-4 text-[12px] mb-4" style={{ color: TEXT_TERTIARY }}>
        {t("product.subtitle", { defaultValue: "내 피부 타입에 맞는 성분 기반 추천" })}
      </p>

      {/* 카테고리 필터 */}
      <div className="px-4 flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
            style={
              selectedCategory === cat
                ? { background: SCAN_TO, color: "#fff" }
                : { background: BG_MUTED, color: TEXT_SECONDARY }
            }
          >
            {cat === "all"
              ? (lang === "ja" ? "すべて" : lang === "en" ? "All" : "전체")
              : catLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* 제품 리스트 */}
      <div className="px-4 flex flex-col gap-3">
        {filtered.slice(0, 6).map((product, idx) => (
          <motion.div
            key={product.id}
            initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${BORDER_COLOR}` }}
          >
            {/* 매칭도 뱃지 */}
            <div
              className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0"
              style={{ background: product.matchScore >= 80 ? TINT_GREEN : BG_MUTED }}
            >
              <span className="text-[14px] font-extrabold leading-none" style={{ color: product.matchScore >= 80 ? DEEP_GREEN : TEXT_SECONDARY }}>
                {product.matchScore}
              </span>
              <span className="text-[9px] mt-0.5" style={{ color: TEXT_TERTIARY }}>match</span>
            </div>

            {/* 제품 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: TEXT_TERTIARY }}>
                {product.brand} · {catLabels[product.category] || product.category}
              </p>
              <p className="text-[13px] font-bold truncate" style={{ color: "#5C4F4A" }}>
                {product.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {product.keyIngredients.slice(0, 3).map(ing => (
                  <span
                    key={ing}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* 가격 + 구매 */}
            <div className="flex flex-col items-end shrink-0">
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
                    fetch("/api/cosmetics", {
                      method: "POST", credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: product.name, brand: product.brand, category: product.category, startDate: new Date().toISOString().slice(0, 10) }),
                    }).catch(() => {});
                  }}
                  className="flex items-center gap-0.5 mt-1 text-[11px] font-semibold"
                  style={{ color: SCAN_TO }}
                >
                  {lang === "ja" ? "購入" : lang === "en" ? "Buy" : "구매"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="mt-1 text-[11px]" style={{ color: TEXT_TERTIARY }}>
                  <ShoppingBag className="w-3 h-3 inline" />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
