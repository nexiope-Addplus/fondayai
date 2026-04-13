import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag, ExternalLink, Sparkles, ScanLine } from "lucide-react";
import { autoRegisterCosmetic, apiBase, appFetch } from "./utils";
import { motion, useReducedMotion } from "framer-motion";
import {
  DEEP_GREEN,
  SCAN_TO,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_MUTED,
  BORDER_COLOR,
  TINT_GREEN,
  TINT_WARM,
} from "./constants";

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  keyIngredients: string[];
  targetConcern: string;
  price: number;
  priceCurrency: string;
  buyUrl: string;
  matchScore: number;
}

const CAT_LABELS: Record<string, Record<string, string>> = {
  ko: { all: "전체", toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저" },
  en: { all: "All", toner: "Toner", serum: "Serum", cream: "Cream", sunscreen: "Sunscreen", cleanser: "Cleanser" },
  ja: { all: "すべて", toner: "化粧水", serum: "美容液", cream: "クリーム", sunscreen: "日焼け止め", cleanser: "洗顔" },
};

export function RecommendTab({ user, baumannType, onLogin }: {
  user: any;
  baumannType?: string;
  onLogin?: (provider: "kakao" | "line" | "google") => void;
}) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const lang = i18n.language?.slice(0, 2) || "ko";
  const cats = CAT_LABELS[lang] || CAT_LABELS.ko;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");

  const type = baumannType || localStorage.getItem("fonday_baumann_type") || "";

  useEffect(() => {
    if (!type) { setLoading(false); return; }
    setLoading(true);
    appFetch(`${apiBase()}/api/product-recommend?baumann=${type}&limit=50&lang=${lang}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [type]);

  const filtered = selectedCat === "all" ? products : products.filter(p => p.category === selectedCat);
  const categories = ["all", "toner", "serum", "cream", "sunscreen", "cleanser"];

  const fireEvent = (eventType: string, data?: Record<string, unknown>) => {
    appFetch(`${apiBase()}/api/events`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType, event_data: data ?? {}, lang, is_guest: !user }),
    }).catch(() => {});
  };

  const handleBuy = (p: Product) => {
    fireEvent("product_recommend_click", { productId: p.id, brand: p.brand, name: p.name, from: "tab" });
    autoRegisterCosmetic(p);
  };

  // 스캔 안 한 유저
  if (!type) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: TINT_WARM }}>
          <ScanLine className="w-7 h-7" style={{ color: SCAN_TO }} />
        </div>
        <p className="text-[16px] font-bold mb-1" style={{ color: "#4A403A" }}>
          {lang === "ja" ? "まず肌をスキャンしてください" : lang === "en" ? "Scan your skin first" : "먼저 피부를 스캔해주세요"}
        </p>
        <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
          {lang === "ja" ? "あなたの肌タイプに合った製品を提案します"
            : lang === "en" ? "We'll recommend products that match your skin type"
            : "피부 타입에 맞는 제품을 추천해드려요"}
        </p>
      </div>
    );
  }

  return (
    <div className="tab-bottom-pad">
      {/* 제휴 공시 문구 */}
      <p className="px-4 pt-4 text-[11px] font-bold" style={{ color: "#5C4F4A" }}>
        {lang === "ja" ? "この投稿はアフィリエイト活動の一環であり、これにより一定額の手数料を受け取っています。"
          : lang === "en" ? "This post is part of the Coupang Partners affiliate program, and we receive a commission from qualifying purchases."
          : "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."}
      </p>

      {/* 헤더 */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: TINT_GREEN }}>
          <ShoppingBag className="w-4.5 h-4.5" style={{ color: DEEP_GREEN }} />
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold" style={{ color: "#4A403A" }}>
            {lang === "ja" ? "おすすめ" : lang === "en" ? "Picks for you" : "맞춤 추천"}
          </h2>
          <p className="text-[12px]" style={{ color: TEXT_TERTIARY }}>
            {lang === "ja" ? `${type}タイプ基準 · 成分マッチング`
              : lang === "en" ? `Based on ${type} type · ingredient matching`
              : `${type} 타입 기준 · 성분 매칭`}
          </p>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="px-4 flex gap-2 mt-3 mb-4 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className="shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-colors"
            style={
              selectedCat === cat
                ? { background: SCAN_TO, color: "#fff" }
                : { background: BG_MUTED, color: TEXT_SECONDARY }
            }
          >
            {cats[cat] || cat}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="px-4 flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: BG_MUTED }} />
          ))}
        </div>
      )}

      {/* 제품 리스트 */}
      {!loading && (
        <div className="px-4 flex flex-col gap-3">
          {filtered.map((p, idx) => {
            const score = Math.round(p.matchScore);
            return (
            <motion.div
              key={p.id}
              initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: `1px solid ${BORDER_COLOR}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className="p-3.5">
                {/* 배너 이미지 — 쿠팡 로고 + 제품 이미지, 하단 버튼 숨김 */}
                {p.bannerUrl && (
                  <div className="w-full overflow-hidden rounded-xl mb-3 flex justify-center" style={{ height: 170, background: "#FAFAFA" }}>
                    <iframe
                      src={p.bannerUrl}
                      width="120" height="240"
                      frameBorder="0" scrolling="no"
                      referrerPolicy="unsafe-url"
                      style={{ border: "none", pointerEvents: "none" }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: score >= 90 ? TINT_GREEN : score >= 70 ? BG_MUTED : `${SCAN_TO}08` }}>
                    <span className="text-[15px] font-extrabold leading-none" style={{ color: score >= 90 ? DEEP_GREEN : score >= 70 ? "#5C4F4A" : TEXT_SECONDARY }}>
                      {score}
                    </span>
                    <span className="text-[8px] mt-0.5 font-medium" style={{ color: TEXT_TERTIARY }}>match</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: TEXT_TERTIARY }}>
                      {p.brand} · {cats[p.category] || p.category}
                    </p>
                    <p className="text-[13px] font-bold truncate mt-0.5" style={{ color: "#5C4F4A" }}>{p.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.keyIngredients.slice(0, 3).map(ing => (
                        <span key={ing} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${DEEP_GREEN}0A`, color: DEEP_GREEN }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[13px] font-bold" style={{ color: "#5C4F4A" }}>
                      {p.price > 0 ? `${p.price.toLocaleString()}원` : ""}
                    </span>
                    {p.buyUrl ? (
                      <a href={p.buyUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleBuy(p)}
                        className="flex items-center gap-0.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: SCAN_TO, color: "#fff" }}>
                        {lang === "ja" ? "購入" : lang === "en" ? "Buy" : "구매"}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <p className="text-center py-8 text-[13px]" style={{ color: TEXT_TERTIARY }}>
              {lang === "ja" ? "該当する製品がありません" : lang === "en" ? "No matching products" : "해당 카테고리에 추천 제품이 없어요"}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
