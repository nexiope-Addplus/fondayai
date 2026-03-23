import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Ban } from "lucide-react";
import {
  COSMETIC_CATEGORIES,
  DEEP_GREEN,
  DEEP_GREEN_LIGHT,
  SCAN_FROM,
  SCAN_TO,
} from "./constants";
import { compressThumbnail, inferCosmeticTimeOfDay } from "./utils";

export function CosmeticsRegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  // step 1 = 촬영, step 2 = 확인+등록
  const [step, setStep] = useState<1 | 2>(1);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>("");
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [ingredients, setIngredients] = useState("");
  const [analysisConfidence, setAnalysisConfidence] = useState<"high" | "medium" | "low">("low");
  const [registering, setRegistering] = useState(false);
  const [showNonSkincareAlert, setShowNonSkincareAlert] = useState(false);
  const [nonSkincareType, setNonSkincareType] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCapturedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    try {
      const compressed = await compressThumbnail(capturedImage, 600);
      const res = await fetch("/api/cosmetics/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed }),
      });
      const data = await res.json();
      setAnalysisConfidence(data.confidence === "high" || data.confidence === "medium" ? data.confidence : "low");
      if (!data.isSkincareRelevant) {
        setNonSkincareType(data.productType || data.name || "");
        setShowNonSkincareAlert(true);
        setName(data.name || "");
        setBrand(data.brand || "");
        setCategory("기타스킨케어");
        setIngredients(data.ingredients || "");
      } else {
        setName(data.name || "");
        setBrand(data.brand || "");
        setCategory(data.category || "기타스킨케어");
        setIngredients(data.ingredients || "");
        setStep(2);
      }
    } catch {
      setCategory("기타스킨케어");
      setAnalysisConfidence("low");
      setStep(2);
    }
    setAnalyzing(false);
  };

  const handleRegister = async () => {
    if (!category) return;
    setRegistering(true);
    try {
      const thumbnail = capturedImage ? await compressThumbnail(capturedImage, 300) : "";
      const res = await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          category,
          timeOfDay: inferCosmeticTimeOfDay(category),
          openedAt,
          ingredients: ingredients.trim(),
          isSkincareRelevant: true,
          imageThumbnail: thumbnail,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setRegistering(false);
      }
    } catch {
      setRegistering(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md pb-10 shadow-2xl overflow-y-auto max-h-[90vh]"
        initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-5 pb-4 border-b border-stone-100 z-10">
          <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <p className="text-base font-bold" style={{ color: DEEP_GREEN }}>
              {step === 1 ? t("cosmetics.scanPhoto") : t("cosmetics.confirm")}
            </p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-sm">✕</button>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all"
                style={{ background: s <= step ? DEEP_GREEN : "#E7E5E4" }} />
            ))}
          </div>
        </div>

        {/* 숨겨진 파일 input */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleFileChange} />
        <input ref={galleryInputRef} type="file" accept="image/*"
          className="hidden" onChange={handleFileChange} />

        <div className="px-6 pt-5 space-y-4">
          {step === 1 && (
            <>
              {/* 촬영 영역 */}
              {capturedImage ? (
                <div className="relative rounded-3xl overflow-hidden bg-stone-100" style={{ height: 260 }}>
                  <img src={capturedImage} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                  <button onClick={() => { setCapturedImage(null); if (cameraInputRef.current) cameraInputRef.current.value = ""; if (galleryInputRef.current) galleryInputRef.current.value = ""; }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-sm">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="rounded-3xl bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-3"
                  style={{ height: 220 }}>
                  <span className="text-5xl">🧴</span>
                  <p className="text-[13px] font-bold text-stone-400">{t("cosmetics.scanPhoto")}</p>
                  <p className="text-xs text-stone-300">제품 전면이 잘 보이게 찍어주세요</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold bg-stone-50 text-stone-700 flex items-center justify-center gap-1.5 active:opacity-70">
                  📷 {t("cosmetics.scanPhoto")}
                </button>
                <button onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold bg-stone-50 text-stone-700 flex items-center justify-center gap-1.5 active:opacity-70">
                  🖼 {t("cosmetics.orGallery")}
                </button>
              </div>

              <button onClick={handleAnalyze} disabled={!capturedImage || analyzing}
                className="w-full py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: (!capturedImage || analyzing) ? "#9CA3AF" : `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                {analyzing
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t("cosmetics.analyzing")}</>
                  : <>{t("cosmetics.nextBtn")}</>}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* 사진 미리보기 + 인식 결과 */}
              <div className="flex gap-3 items-start">
                {capturedImage && (
                  <img src={capturedImage} alt="" aria-hidden="true" className="w-20 h-20 rounded-2xl object-cover bg-stone-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">제품명</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 block">브랜드</label>
                    <input value={brand} onChange={e => setBrand(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
                  </div>
                </div>
              </div>

              {/* 카테고리 */}
              <div className="rounded-2xl px-4 py-3" style={{ background: analysisConfidence === "high" ? "#F0F7F4" : "#FFF7ED" }}>
                <p className="text-xs font-semibold text-kr-pretty" style={{ color: analysisConfidence === "high" ? DEEP_GREEN : SCAN_TO }}>
                  {analysisConfidence === "high"
                    ? "사진에서 읽힌 정보를 기준으로 자동 분류했어요. 틀리면 아래에서 수정해 주세요."
                    : "자동 인식 정확도가 높지 않아요. 제품명, 카테고리, 전성분을 꼭 한 번 확인해 주세요."}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.categoryLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {COSMETIC_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className="py-2.5 px-2 rounded-2xl text-[12px] font-bold border transition-all text-center"
                      style={category === cat
                        ? { background: DEEP_GREEN, color: "white", borderColor: DEEP_GREEN }
                        : { background: "#F9F7F5", color: "#6B6560", borderColor: "#E7E5E4" }}>
                      {t(`cosmetics.categories.${cat}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 개봉일 */}
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.openedLabel")}</label>
                <input type="date" value={openedAt} onChange={e => setOpenedAt(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-[14px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.ingredientsLabel")}</label>
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  rows={3}
                  placeholder={t("cosmetics.ingredientsPlaceholder")}
                  className="w-full px-4 py-3 rounded-2xl text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl font-bold text-[13px] text-stone-600 bg-stone-50">
                  {t("cosmetics.retake")}
                </button>
                <button onClick={handleRegister} disabled={!category || registering}
                  className="flex-[2] py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: (!category || registering) ? "#9CA3AF" : `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                  {registering
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t("cosmetics.registering")}</>
                    : <><span>🧴</span> {t("cosmetics.registerBtn")}</>}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* 스킨케어 아님 경고 시트 */}
      <AnimatePresence>
        {showNonSkincareAlert && (
          <motion.div className="absolute inset-0 z-10 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowNonSkincareAlert(false)} />
            <motion.div className="relative bg-white rounded-t-[28px] w-full max-w-md p-6 pb-8"
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <div className="flex justify-center mb-3"><Ban className="w-10 h-10 text-stone-300" /></div>
              <p className="text-base font-bold text-stone-800 text-center mb-2">{t("cosmetics.notSkincareTitle")}</p>
              <p className="text-[13px] text-stone-500 text-center leading-relaxed whitespace-pre-line mb-5">
                {t("cosmetics.notSkincareDesc", { type: nonSkincareType })}
              </p>
              <div className="space-y-3.5">
                <button onClick={() => { setShowNonSkincareAlert(false); setStep(2); }}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-bold text-stone-600 bg-stone-50">
                  {t("cosmetics.notSkincareKeep")}
                </button>
                <button onClick={() => { setShowNonSkincareAlert(false); onClose(); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: DEEP_GREEN }}>
                  {t("cosmetics.notSkincareSkip")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
