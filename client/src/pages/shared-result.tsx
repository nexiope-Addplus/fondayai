import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ChevronLeft } from "lucide-react";
import { BG_BASE, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "@/components/fonday/constants";
import { apiBase, appFetch, isTossMiniApp } from "@/components/fonday/utils";

const SCAN_TO = "#C97062";
const DEEP_GREEN = "#2C3E36";

const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B", D: "#3B82F6", S: "#EF4444", R: "#10B981",
  P: "#A855F7", N: "#6366F1", W: "#EC4899", T: "#14B8A6",
};

const SCORE_COLORS = [
  "#D4836B", "#3B82C4", "#E05A3A", "#4A7C6E", "#8C8070",
  "#A67C52", "#D97706", "#6366F1", "#F59E0B", "#10B981",
];

type ScanData = {
  overallScore: string | number;
  scores: { label: string; score: number }[];
  baumannType?: string;
  skinAge?: number | string;
  aiComment?: string;
  createdAt: string;
};

export default function SharedResultPage() {
  const [, params] = useRoute("/share/:token");
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.token) return;
    setLoading(true);
    appFetch(`${apiBase()}/api/shared-scan?token=${params.token}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? "결과를 찾을 수 없어요" : "불러오기 실패");
        return res.json();
      })
      .then(data => setScan(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params?.token]);

  const handleTryScan = () => {
    if (isTossMiniApp()) {
      setLocation("/skinReport");
    } else {
      setLocation("/");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]" style={{ background: BG_BASE }}>
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#C97062] animate-spin" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center gap-4" style={{ background: BG_BASE }}>
        <h2 className="text-xl font-black text-[#5C4F4A]">결과를 찾을 수 없어요</h2>
        <p className="text-stone-500 text-sm">{error || "만료되었거나 잘못된 링크예요"}</p>
        <Button onClick={handleTryScan} className="mt-4 rounded-xl px-6" variant="outline">
          내 피부 분석하기
        </Button>
      </div>
    );
  }

  const overallScore = Number(scan.overallScore);
  const baumannType = scan.baumannType || "----";
  const letters = baumannType.split("");
  const skinAge = scan.skinAge ? Number(scan.skinAge) : null;
  const scores = scan.scores || [];

  const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
  const fadeChild = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: BG_BASE }}>
      {/* Header */}
      <div
        className="h-14 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-50"
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <button
          onClick={handleTryScan}
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <h1 className="text-lg font-black" style={{ color: DEEP_GREEN }}>피부 분석 결과</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <motion.div className="px-5 pt-6 space-y-5 max-w-md mx-auto" variants={stagger} initial="initial" animate="animate">
          {/* Score hero */}
          <motion.div variants={fadeChild} className="text-center pt-4 pb-2">
            <p className="text-sm font-bold mb-2" style={{ color: TEXT_TERTIARY }}>친구의 피부 점수</p>
            <span className="text-7xl font-light leading-none" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>
              {overallScore}
            </span>
            <span className="text-2xl ml-1" style={{ color: "#8C8078" }}>점</span>
          </motion.div>

          {/* Baumann type */}
          <motion.div variants={fadeChild} className="flex items-center justify-center gap-2">
            {letters.map((letter, i) => (
              <span
                key={i}
                className="text-sm font-bold w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: BAUMANN_COLORS[letter] || "#ccc" }}
              >
                {letter}
              </span>
            ))}
          </motion.div>

          {/* Skin age */}
          {skinAge && skinAge > 0 && (
            <motion.div variants={fadeChild} className="text-center">
              <span className="text-sm text-stone-500">피부 나이 </span>
              <span className="text-lg font-black" style={{ color: DEEP_GREEN }}>{skinAge}세</span>
            </motion.div>
          )}

          {/* AI comment */}
          {scan.aiComment && (
            <motion.div
              variants={fadeChild}
              className="bg-white rounded-2xl p-5"
              style={{ border: `1px solid ${BORDER_COLOR}` }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: SCAN_TO }}>AI 피부 분석</p>
              <p className="text-sm text-[#4A403A] leading-relaxed">{scan.aiComment}</p>
            </motion.div>
          )}

          {/* Score bars */}
          {scores.length > 0 && (
            <motion.div
              variants={fadeChild}
              className="bg-white rounded-2xl p-5 space-y-3"
              style={{ border: `1px solid ${BORDER_COLOR}` }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: DEEP_GREEN }}>세부 스펙</p>
              {scores.map((sc, i) => {
                const color = SCORE_COLORS[i] || "#64748B";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-stone-500 w-20 shrink-0 truncate">{sc.label}</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${sc.score}%`, background: color }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color }}>{sc.score}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* CTA button */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#FAFAF8] via-[#FAFAF8] to-transparent">
        <Button
          onClick={handleTryScan}
          className="w-full h-14 rounded-2xl text-base font-black text-white shadow-xl shadow-emerald-900/20 gap-2 relative group"
          style={{ background: `linear-gradient(135deg, #3A4A43, ${DEEP_GREEN})` }}
        >
          <Sparkles className="w-5 h-5" />
          나도 무료 피부 분석 받기
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
