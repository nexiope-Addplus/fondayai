// ─── Shared types for Fonday / Skin-Diary-AI ─────────────────────────────────

export type TabId = "scan" | "diary" | "magazine" | "my";
export type ScanState = "idle" | "survey" | "scanning" | "result";

export interface SurveyData {
  gender: string;
  age: string;
  genderIdx: number;
  ageIdx: number;
  skinType: string;
  concerns: string[];
  condition: string;
}

export interface Hotspot {
  x: number;
  y: number;
  type: string;
}

export interface PredictionScenario {
  days: number;
  score: number;
  scenario: string;
  routine?: string[];
  risks?: string[];
}

export interface AnalysisResult {
  scores: { label: string; score: number; comment?: string }[];
  hotspots: Hotspot[];
  aiComment: string;
  skinAge?: number;
  skinReport?: { area: string; finding: string }[];
  improvements: { title: string; desc: string }[];
  cosmetics: { type: string; key: string; reason: string }[];
  prediction?: { good: PredictionScenario; bad: PredictionScenario };
  nutritionTips?: {
    supplements: { emoji: string; name: string; dose: string; reason: string; targetScore: string }[];
    avoidFoods: { emoji: string; food: string; reason: string }[];
    hydrationGoal: string;
  } | null;
}

export interface RankingData {
  totalScans: number;
  avgScore: number;
  topScore: number;
  scoreDistribution: { label: string; count: number }[];
  baumannDistribution: Record<string, number>;
  myPercentile?: number;
}

export interface CosmeticItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  time_of_day?: "am" | "pm" | "both";
  opened_at?: string | null;
  created_at?: string;
  image_thumbnail?: string;
  ingredients?: string;
  status?: string;
}

// ─── 스트릭 / 미션 시스템 ─────────────────────────────────────────────────────

export interface StreakData {
  count: number;
  lastScanDate: string;
  longest: number;
  lastScore: number;
}

export interface MissionState {
  completed: string[];
  dailyDate: string;
  dailyCompleted: boolean;
  dailyImproved: boolean;
  dailyChallenged: boolean;
  totalPoints: number;
}

// ─── 출석 시스템 ──────────────────────────────────────────────────────────────

export interface AttendanceData {
  dates: string[];      // "2026-03-11" 형식
  totalPoints: number;
}

// ─── 매거진 ───────────────────────────────────────────────────────────────────

export interface MagazineArticle {
  id: number;
  featured?: boolean;
  title: string;
  summary: string;
  body: { heading?: string; text: string }[];
  tag: string;
  category: "성분" | "루틴" | "타입" | "케어" | "전문가";
  readTime: string;
  author: string;
  authorRole: string;
  date: string;
  bgFrom: string;
  bgTo: string;
  emoji: string;
}

// ─── 날씨 ─────────────────────────────────────────────────────────────────────

export type WeatherData = {
  temp: number;
  humidity: number;
  weatherId: number;
  weatherMain: string;
  cityName: string;
  aqi: number | null;
};

export type WeatherTipKey = "polluted" | "snowy" | "rainy" | "foggy" | "cold" | "sunny_hot" | "sunny" | "dry" | "humid" | "cloudy";

// ─── 다이어리 원인 태그 ───────────────────────────────────────────────────────

export type DiaryCauseTag = "sleep" | "newProduct" | "cycle" | "diet" | "stress" | "outdoor";

// ─── 알림 / AI 케어 설정 ──────────────────────────────────────────────────────

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  lastNotifiedDate: string;
}

export interface AICareSettings {
  enabled: boolean;
  scan: boolean;
  meal: boolean;
  hydration: boolean;
  routine: boolean;
  routineHour: number;
  routineMinute: number;
  uvCare: boolean;
  bedtime: boolean;
  weatherCare: boolean;
}

// ─── 루틴 Todo ────────────────────────────────────────────────────────────────

export interface TodoItem {
  text: string;
  done: boolean;
}

// ─── 리포트 언어 ──────────────────────────────────────────────────────────────

export type ReportLang = "ko" | "en" | "ja";
export type ReportConcernKey =
  | "hydration"
  | "redness"
  | "pores"
  | "pigmentation"
  | "elasticity"
  | "breakout"
  | "darkCircle";
