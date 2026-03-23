import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Droplets, Plus, X } from "lucide-react";
import { SCAN_TO, TINT_WARM, BORDER_COLOR, FONT_DISPLAY, fadeChild } from "./constants";

type RoutineLogInputProps = {
  onSave: (products: string[]) => void;
  initialProducts?: string[];
};

export function RoutineLogInput({ onSave, initialProducts = [] }: RoutineLogInputProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<string[]>(initialProducts);
  const [inputValue, setInputValue] = useState("");

  const addProduct = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || products.includes(trimmed)) return;
    const next = [...products, trimmed];
    setProducts(next);
    setInputValue("");
    onSave(next);
  };

  const removeProduct = (index: number) => {
    const next = products.filter((_, i) => i !== index);
    setProducts(next);
    onSave(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addProduct();
    }
  };

  return (
    <motion.div variants={fadeChild} className="rounded-3xl p-4"
      style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: TINT_WARM }}>
          <Droplets className="w-4 h-4" style={{ color: SCAN_TO }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
          {t("routineLog.title", "오늘 사용한 화장품")}
        </p>
      </div>

      {products.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {products.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
              {p}
              <button onClick={() => removeProduct(i)} className="text-stone-400 hover:text-stone-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("routineLog.placeholder", "제품명 입력 (예: 토너, 세럼)")}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-stone-400"
        />
        <button
          onClick={addProduct}
          disabled={!inputValue.trim()}
          className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40"
          style={{ background: SCAN_TO }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-stone-400 mt-2">
        {t("routineLog.hint", "매일 기록하면 어떤 화장품이 효과 있는지 추적할 수 있어요")}
      </p>
    </motion.div>
  );
}
