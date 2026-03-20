import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import { SCAN_FROM, SCAN_TO } from "./constants";
import { FaceMeshOverlay } from "./FaceMeshOverlay";

// ─── 분석 중 화면 ─────────────────────────────────────────────────
export function ScanningScreen({ imageSrc }: { imageSrc: string | null }) {
  const { t, i18n } = useTranslation();
  const [textIdx, setTextIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const texts = t("scanning.texts", { returnObjects: true }) as string[];

  // 텍스트 사이클 — 언어 변경 시 재시작
  useEffect(() => {
    setTextIdx(0);
    const interval = setInterval(() => {
      setTextIdx(prev => (prev + 1) % texts.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // 진행바: 0 → 95% 단방향 스무스 증가 (절대 감소 없음)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 0.35;
      if (current >= 95) { clearInterval(interval); current = 95; }
      setProgress(current);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] bg-[#FAF9F6] px-6">
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-stone-100 flex items-center justify-center shadow-inner">
        {imageSrc ? (
          <>
            <img src={imageSrc} className="w-full h-full object-cover" />
            <FaceMeshOverlay imageSrc={imageSrc} />
          </>
        ) : (
          <Camera className="w-16 h-16 opacity-10" />
        )}
        <motion.div
          className="absolute left-0 right-0 h-1 shadow-lg"
          style={{ background: `linear-gradient(90deg, transparent, ${SCAN_FROM}, ${SCAN_TO}, ${SCAN_FROM}, transparent)` }}
          animate={{ top: ["5%", "95%", "5%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SCAN_FROM }} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Scanning</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center space-y-3">
        <AnimatePresence mode="wait">
          <motion.p key={textIdx} className="font-bold text-xl text-stone-800"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            {texts[textIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-stone-400 italic">{t("scanning.subtitle")}</p>
      </div>
      {/* 진행 바 */}
      <div className="mt-8 w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
          <span>{t("scanning.progress")}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` }}
          />
        </div>
      </div>
    </div>
  );
}
