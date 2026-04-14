import React from "react";
import {
  Sparkles,
  Droplets,
  Sun,
  LayoutGrid,
  Activity,
  Target,
  Flame,
  Eye,
  Star,
  Waves,
  Shield,
  Leaf,
  Droplet,
  Clock,
  Zap,
} from "lucide-react";

// ─── 점수 라벨 매핑 (서버는 항상 한국어, 클라이언트에서 t('scores.N')로 번역) ──

export const SCORE_LABEL_MAP: Record<string, number> = {
  "종합 컨디션": 0, "수분 밸런스": 1, "붉은기 수준": 2, "모공 상태": 3,
  "주름 및 탄력": 4, "잡티/색소침착": 5, "트러블 위험": 6,
  "다크서클": 7, "피부 광채": 8, "피부결 균일도": 9,
};

// ─── 피부 맞춤 영양 성분 카드 ─────────────────────────────────────────────────

export const NUTRIENT_COLORS: Record<string, string> = {
  O: "#4A7C6E", D: "#3B82C4", S: "#E05A3A", R: "#10B981",
  P: "#F59E0B", N: "#8B5CF6", W: "#C97062", T: "#10B981",
};

export const NUTRIENT_ICONS: Record<string, React.ReactNode> = {
  O: React.createElement(Droplets, { className: "w-4 h-4" }),
  D: React.createElement(Droplet, { className: "w-4 h-4" }),
  S: React.createElement(Leaf, { className: "w-4 h-4" }),
  R: React.createElement(Shield, { className: "w-4 h-4" }),
  P: React.createElement(Eye, { className: "w-4 h-4" }),
  N: React.createElement(Sparkles, { className: "w-4 h-4" }),
  W: React.createElement(Clock, { className: "w-4 h-4" }),
  T: React.createElement(Zap, { className: "w-4 h-4" }),
};

// ─── 인덱스 기반 아이콘/색상 ──────────────────────────────────────────────────

export const SCORE_ICONS = [Sparkles, Droplets, Sun, LayoutGrid, Activity, Target, Flame, Eye, Star, Waves];
export const SCORE_COLORS = [
  "#D4836B", // 종합 컨디션
  "#3B82C4", // 수분 밸런스
  "#E05A3A", // 붉은기 수준
  "#4A7C6E", // 모공 상태
  "#8C8070", // 주름 및 탄력
  "#A67C52", // 잡티/색소침착
  "#D97706", // 트러블 위험
  "#6366F1", // 다크서클
  "#F59E0B", // 피부 광채
  "#10B981", // 피부결 균일도
];

// ─── 애니메이션 변수 ──────────────────────────────────────────────────────────

export const fadeChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const tabSlideVariants = {
  enter: (dir: number) => ({ x: dir * 30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -30, opacity: 0 }),
};
