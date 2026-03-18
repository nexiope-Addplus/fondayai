import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Camera,
  BookOpen,
  ScanLine,
  AlertCircle,
  Shield,
  Sun,
  Moon,
  Share2,
  LineChart as LineChartIcon,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Heart,
  Droplets,
  LayoutGrid,
  Activity,
  Target,
  Flame,
  Eye,
  Zap,
  Leaf,
  Star,
  Waves,
  X,
  Lock,
  Thermometer,
  FileText,
  PlusSquare,
  SmartphoneNfc,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  Utensils,
  Trophy,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type TabId = "scan" | "diary" | "magazine" | "my";
type ScanState = "idle" | "survey" | "scanning" | "result";

interface SurveyData {
  gender: string;
  age: string;
  genderIdx: number;
  ageIdx: number;
  skinType: string;
  concerns: string[];
  condition: string;
}

interface Hotspot {
  x: number;
  y: number;
  type: string;
}

interface PredictionScenario {
  days: number;
  score: number;
  scenario: string;
  routine?: string[];
  risks?: string[];
}

interface AnalysisResult {
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

interface RankingData {
  totalScans: number;
  avgScore: number;
  topScore: number;
  scoreDistribution: { label: string; count: number }[];
  baumannDistribution: Record<string, number>;
  myPercentile?: number;
}

interface CosmeticItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  time_of_day?: "am" | "pm" | "both";
  opened_at?: string | null;
  image_thumbnail?: string;
  ingredients?: string;
  status?: string;
}

const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B",
  D: "#3B82F6",
  S: "#EF4444",
  R: "#10B981",
  P: "#8B5CF6",
  N: "#06B6D4",
  W: "#6366F1",
  T: "#14B8A6",
};

function buildPushScoreSummary(result: AnalysisResult | null) {
  if (!result?.scores?.length) return [];

  return [...result.scores]
    .filter((item) => Number.isFinite(Number(item?.score)) && typeof item?.label === "string")
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 3)
    .map((item) => ({
      label: item.label,
      score: Number(item.score),
    }));
}

function buildBaumannTypeFromResult(result: AnalysisResult | null) {
  const scores = result?.scores || [];
  const isOily = (scores[3]?.score ?? 100) < 50;
  const isSens = (scores[2]?.score ?? 0) > 50;
  const isPig = (scores[5]?.score ?? 0) > 50;
  const isWrink = (scores[4]?.score ?? 100) < 60;

  return `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`;
}

const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const TEXT_SECONDARY = "#8C8070";
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";

// 서버는 항상 한국어 라벨로 반환 → 클라이언트에서 scores.N 키로 번역
const SCORE_LABEL_MAP: Record<string, number> = {
  "종합 컨디션": 0, "수분 밸런스": 1, "붉은기 수준": 2, "모공 상태": 3,
  "주름 및 탄력": 4, "잡티/색소침착": 5, "트러블 위험": 6,
  "다크서클": 7, "피부 광채": 8, "피부결 균일도": 9,
};

// ─── Google AdSense 배너 ──────────────────────────────────────────
// 주의: AdSense 대시보드에서 각 위치별로 별도 광고 단위를 생성 후 data-ad-slot 값을 개별 교체하세요.
// 동일한 slot ID를 여러 위치에 쓰면 정책 위반이 될 수 있습니다.
function AdBanner({ slot }: { slot: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // 광고는 실제 콘텐츠가 로드된 후에만 삽입
    const timer = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        setLoaded(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="w-full overflow-hidden my-2">
      {/* 광고 레이블 - AdSense 정책 준수 (광고임을 명시) */}
      <p className="text-[10px] text-center text-stone-300 mb-1 tracking-widest uppercase font-medium">광고</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5928664043346684"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ─── 피부 맞춤 영양 성분 카드 ────────────────────────────────────
const NUTRIENT_COLORS: Record<string, string> = {
  O: "#4A7C6E", D: "#3B82C4", S: "#E05A3A", R: "#10B981",
  P: "#F59E0B", N: "#8B5CF6", W: "#C97062", T: "#10B981",
};
const NUTRIENT_ICONS: Record<string, string> = {
  O: "🧴", D: "💧", S: "🌿", R: "🛡️", P: "🍋", N: "✨", W: "⏳", T: "💪",
};


// 인덱스 기반 아이콘/색상 (AI label 매칭 불필요, 순서 보장)
const SCORE_ICONS = [Sparkles, Droplets, Sun, LayoutGrid, Activity, Target, Flame, Eye, Star, Waves];
const SCORE_COLORS = [
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

const fadeChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

// ─── 스트릭 / 미션 시스템 ────────────────────────────────────────
interface StreakData {
  count: number;
  lastScanDate: string;
  longest: number;
  lastScore: number;
}

interface MissionState {
  completed: string[];
  dailyDate: string;
  dailyCompleted: boolean;
  dailyImproved: boolean;
  dailyChallenged: boolean;
  totalPoints: number;
}

const MISSION_POINTS: Record<string, number> = {
  first_scan: 50, daily_scan: 10, streak_3: 100, streak_7: 200,
  streak_30: 500, score_70: 150, score_80: 300, challenge: 100, share: 50,
  daily_improve: 20, daily_challenge: 50,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem("fonday_streak");
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {}
  return { count: 0, lastScanDate: "", longest: 0, lastScore: 0 };
}

function updateStreak(newScore: number): { streak: StreakData; isNewMilestone: boolean; deltaScore: number } {
  const prev = getStreak();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newCount = 1;
  if (prev.lastScanDate === today) {
    newCount = prev.count; // 오늘 이미 스캔 — count 유지
  } else if (prev.lastScanDate === yesterday) {
    newCount = prev.count + 1; // 어제 스캔 — streak++
  }
  // else: 2일+ 경과 또는 첫 스캔 → reset to 1

  const longest = Math.max(newCount, prev.longest);
  const deltaScore = prev.lastScore > 0 ? newScore - prev.lastScore : 0;
  const isNewMilestone = [3, 7, 30].includes(newCount) && prev.lastScanDate !== today;

  const streak: StreakData = { count: newCount, lastScanDate: today, longest, lastScore: newScore };
  try { localStorage.setItem("fonday_streak", JSON.stringify(streak)); } catch {}
  return { streak, isNewMilestone, deltaScore };
}

function getDaysSinceLastScan(): number | null {
  const { lastScanDate } = getStreak();
  if (!lastScanDate) return null;
  const diffMs = Date.now() - new Date(lastScanDate).getTime();
  return Math.floor(diffMs / 86400000);
}

function getMissions(): MissionState {
  try {
    const raw = localStorage.getItem("fonday_missions");
    if (raw) return JSON.parse(raw) as MissionState;
  } catch {}
  return { completed: [], dailyDate: "", dailyCompleted: false, dailyImproved: false, dailyChallenged: false, totalPoints: 0 };
}

function checkAndCompleteMissions(streakCount: number, overallScore: number, scoreDelta?: number | null): string[] {
  const state = getMissions();
  const today = todayStr();
  const newlyCompleted: string[] = [];

  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyCompleted = false;
    state.dailyImproved = false;
    state.dailyChallenged = false;
  }

  if (!state.dailyCompleted) {
    state.dailyCompleted = true;
    state.totalPoints += MISSION_POINTS.daily_scan;
    newlyCompleted.push("daily_scan");
  }

  if (scoreDelta != null && scoreDelta > 0 && !state.dailyImproved) {
    state.dailyImproved = true;
    state.totalPoints += MISSION_POINTS.daily_improve;
    newlyCompleted.push("daily_improve");
  }

  const checks = [
    { id: "first_scan", cond: true },
    { id: "streak_3", cond: streakCount >= 3 },
    { id: "streak_7", cond: streakCount >= 7 },
    { id: "streak_30", cond: streakCount >= 30 },
    { id: "score_70", cond: overallScore >= 70 },
    { id: "score_80", cond: overallScore >= 80 },
  ];

  for (const { id, cond } of checks) {
    if (cond && !state.completed.includes(id)) {
      state.completed.push(id);
      state.totalPoints += MISSION_POINTS[id] || 0;
      newlyCompleted.push(id);
    }
  }

  try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
  return newlyCompleted;
}

// ─── 출석 시스템 ──────────────────────────────────────────────────
interface AttendanceData {
  dates: string[];      // "2026-03-11" 형식
  totalPoints: number;
}

function getAttendance(): AttendanceData {
  try {
    const raw = localStorage.getItem("fonday_attendance");
    if (raw) return JSON.parse(raw) as AttendanceData;
  } catch {}
  return { dates: [], totalPoints: 0 };
}

function checkinToday(): boolean {
  const data = getAttendance();
  const today = todayStr();
  if (data.dates.includes(today)) return false; // 이미 체크인
  data.dates.push(today);
  data.totalPoints += 3;
  try { localStorage.setItem("fonday_attendance", JSON.stringify(data)); } catch {}
  return true;
}

// ─── 달력 모달 ────────────────────────────────────────────────────
function AttendanceCalendarModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const data = getAttendance();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const thisMonthCount = data.dates.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      <motion.div key="att-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40" onClick={onClose} />
      <motion.div key="att-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto px-5 pb-10 pt-6">
        {/* 핸들 */}
        <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>{t("attendance.calendarTitle")}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
              {t("attendance.totalPoints", { n: data.totalPoints })}
            </span>
          </div>
        </div>
        <p className="text-[12px] text-stone-400 mb-4">{t("attendance.thisMonth", { n: thisMonthCount })}</p>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {["일","월","화","수","목","금","토"].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-stone-400 py-1">{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const checked = data.dates.includes(dateStr);
            const isToday = dateStr === todayStr();
            return (
              <div key={dateStr} className="flex flex-col items-center py-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                  ${checked ? "text-white" : isToday ? "text-[#C97062] border border-[#C97062]" : "text-stone-600"}`}
                  style={checked ? { background: "linear-gradient(135deg, #E09882, #C97062)" } : {}}>
                  {day}
                </div>
                {checked && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: SCAN_TO }} />}
              </div>
            );
          })}
        </div>

        <button onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl text-[14px] font-bold text-stone-500 bg-stone-100">
          {t("attendance.close")}
        </button>
      </motion.div>
    </>
  );
}

// ─── 체크인 성공 팝업 ─────────────────────────────────────────────
function CheckinSuccessSheet({ onKakao, onLine, onGoogle, onDismiss, user }: {
  onKakao: () => void;
  onLine: () => void;
  onGoogle: () => void;
  onDismiss: () => void;
  user: any;
}) {
  const { t, i18n } = useTranslation();
  const data = getAttendance();

  return (
    <>
      <motion.div key="ci-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40" onClick={onDismiss} />
      <motion.div key="ci-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto px-5 pb-10 pt-6">
        <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />

        {/* 타이틀 */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-[18px] font-black text-stone-800 mb-1">{t("attendance.title")}</h2>
        </div>

        {!user && (
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-[13px] font-semibold text-stone-600 mb-0.5">{t("attendance.stored")}</p>
            <p className="text-[12px] text-stone-400 whitespace-pre-line">{t("attendance.loginDesc")}</p>
          </div>
        )}

        {!user ? (
          <div className="flex flex-col gap-2.5">
            {i18n.language === "ko" ? (
              <button onClick={onKakao}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black text-stone-800 flex items-center justify-center gap-2"
                style={{ background: "#FEE500" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                {t("attendance.kakao")}
              </button>
            ) : (
              <button onClick={onLine}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2"
                style={{ background: "#06C755" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                {t("attendance.line")}
              </button>
            )}
            <button onClick={onGoogle}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black border border-stone-200 text-stone-700 flex items-center justify-center gap-2 bg-white">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
              {t("attendance.google")}
            </button>
            <button onClick={onDismiss}
              className="w-full py-2.5 text-[13px] font-semibold text-stone-400">
              {t("attendance.later")}
            </button>
          </div>
        ) : (
          <button onClick={onDismiss}
            className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
            {t("attendance.close")}
          </button>
        )}
      </motion.div>
    </>
  );
}

// ─── 출석 배지 버튼 (좌상단) ──────────────────────────────────────
function AttendanceBadge({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  const data = getAttendance();
  const today = todayStr();
  const checkedToday = data.dates.includes(today);
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm border border-stone-100 transition-all active:scale-95">
      <CalendarDays className="w-3.5 h-3.5" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }} />
      <span className="text-[11px] font-bold" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }}>
        {checkedToday ? t("attendance.alreadyChecked") : t("attendance.checkIn")}
      </span>
    </button>
  );
}

// ─── 푸시 프롬프트 유틸 ───────────────────────────────────────────
function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}
function isPWA(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone;
}
function shouldShowPushPrompt(): boolean {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (typeof Notification !== "undefined" && Notification.permission === "denied") return false;
  try {
    const raw = localStorage.getItem("fonday_push_prompt");
    if (!raw) return true;
    const { dismissed, lastDismissed } = JSON.parse(raw);
    if (!dismissed) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastDismissed).getTime()) / 86400000);
    return daysSince >= 7;
  } catch { return true; }
}
function dismissPushPrompt() {
  try {
    localStorage.setItem("fonday_push_prompt", JSON.stringify({ dismissed: true, lastDismissed: todayStr() }));
  } catch {}
}

// ─── 푸시 구독 유도 바텀시트 ─────────────────────────────────────
function PushPromptSheet({ onAllow, onDismiss, isLoading }: { onAllow: () => void; onDismiss: () => void; isLoading: boolean }) {
  const { t } = useTranslation();
  const showIOSGuide = isIOS() && !isPWA();
  return (
    <>
      {/* 딤 오버레이 */}
      <motion.div
        key="push-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[980] bg-black/40"
        onClick={onDismiss}
      />
      {/* 바텀시트 */}
      <motion.div
        key="push-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[990] bg-white rounded-t-3xl px-6 pt-4 pb-10 max-w-lg mx-auto"
        style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.15)" }}
      >
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
        {showIOSGuide ? (
          <>
            <div className="text-center mb-5">
              <span className="text-4xl">📱</span>
              <h3 className="font-black text-stone-800 text-[18px] mt-2">{t("pushPrompt.iosTitle")}</h3>
              <p className="text-stone-500 text-[13px] mt-1.5 leading-relaxed">{t("pushPrompt.iosDesc")}</p>
            </div>
            <div className="space-y-2.5 mb-5">
              {([1, 2, 3] as const).map(n => (
                <div key={n} className="flex items-center gap-3 bg-stone-50 rounded-2xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-[12px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                  <span className="text-[13px] text-stone-700">{t(`pushPrompt.iosStep${n}`)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl">🔔</span>
              <h3 className="font-black text-stone-800 text-[18px] mt-2">{t("pushPrompt.title")}</h3>
              <p className="text-stone-500 text-[13px] mt-1.5 leading-relaxed">{t("pushPrompt.desc")}</p>
              {isAndroid() && (
                <span className="inline-block mt-2 text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Android</span>
              )}
            </div>
            <button
              onClick={onAllow}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-bold text-white text-[15px] mb-2"
              style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
            >
              {isLoading ? "..." : t("pushPrompt.allow")}
            </button>
          </>
        )}
        <button onClick={onDismiss} className="w-full py-3 text-stone-400 text-[14px]">
          {t("pushPrompt.later")}
        </button>
      </motion.div>
    </>
  );
}

function markChallengeUsed() {
  const state = getMissions();
  const today = todayStr();
  if (!state.completed.includes("challenge")) {
    state.completed.push("challenge");
    state.totalPoints += MISSION_POINTS.challenge;
  }
  if (state.dailyDate === today && !state.dailyChallenged) {
    state.dailyChallenged = true;
    state.totalPoints += MISSION_POINTS.daily_challenge;
  }
  try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
}

function markShareUsed() {
  const state = getMissions();
  if (!state.completed.includes("share")) {
    state.completed.push("share");
    state.totalPoints += MISSION_POINTS.share;
    try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
  }
}

interface MagazineArticle {
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

const MAGAZINE_ARTICLES: MagazineArticle[] = [
  {
    id: 1,
    featured: true,
    title: "바우만 피부 타입 완전 가이드: 16가지 타입, 내 피부의 정체를 알다",
    summary: "지성인지 건성인지만 따지던 시대는 끝났습니다. 바우만 박사의 16가지 피부 분류법으로 내 피부를 정확히 이해하면, 수백만 원짜리 컨설팅 없이도 최적의 루틴을 구성할 수 있습니다.",
    body: [
      { heading: "피부 타입이 중요한 이유", text: "같은 '건성 피부'라도 민감하고 색소침착이 잘 생기는 타입과 저항성이 강하고 균일한 타입은 전혀 다른 제품을 써야 합니다. 피부과 전문의 레슬리 바우만 박사가 개발한 바우만 피부 타입 지수(BSTI)는 피부를 네 가지 축으로 분류합니다. 유수분 균형(O/D), 민감도(S/R), 색소침착(P/N), 노화(W/T)가 그것입니다." },
      { heading: "O(지성) vs D(건성)", text: "피지 분비량으로 구분합니다. 지성(O)은 번들거림과 모공 확장이 특징이며 살리실산, 나이아신아마이드가 효과적입니다. 건성(D)은 세라마이드와 스쿠알란처럼 오일 장벽을 강화하는 성분이 핵심입니다." },
      { heading: "S(민감성) vs R(저항성)", text: "외부 자극에 반응하는 피부 장벽 강도를 의미합니다. 민감성(S)은 산성 성분이나 강한 레티놀에 홍조·따가움이 생기기 쉬우므로, 초저자극 포뮬러를 선택해야 합니다. 저항성(R)은 활성 성분 흡수율도 높아 더 강한 농도를 사용할 수 있습니다." },
      { heading: "P(색소성) vs N(비색소성)", text: "기미·잡티 생성 경향을 나타냅니다. 색소성(P) 피부는 자외선 노출 직후 멜라닌 합성이 즉각적으로 반응하므로, 비타민C·알부틴·나이아신아마이드 조합이 필수입니다. SPF 50+ PA++++ 차단제는 매일 빠짐없이 사용하세요." },
      { heading: "W(주름성) vs T(탄력성)", text: "콜라겐·엘라스틴 손실 속도를 반영합니다. 주름성(W) 피부는 레티놀, 펩타이드, 성장인자 성분을 일찍 시작할수록 효과적이며, 탄력성(T) 피부는 기본 보습 루틴을 꾸준히 유지하는 것으로 충분합니다." },
      { text: "자신의 바우만 타입을 알면 수천 가지 제품 중 실제로 자신에게 필요한 것만 선별할 수 있습니다. 화장품 쇼핑에서 낭비를 줄이고, 피부 트러블을 예방하는 가장 과학적인 접근법입니다." },
    ],
    tag: "바우만 타입",
    category: "타입",
    readTime: "6분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#E09882",
    bgTo: "#C97062",
    emoji: "🧬",
  },
  {
    id: 2,
    title: "레티놀 입문 가이드: 부작용 없이 시작하는 법",
    summary: "레티놀은 검증된 항노화 성분이지만 잘못 쓰면 심한 각질과 홍조를 유발합니다. 농도 선택부터 샌드위치 기법까지, 처음 쓰는 분들을 위한 단계별 전략을 공개합니다.",
    body: [
      { heading: "왜 레티놀인가", text: "레티놀은 비타민A의 유도체로, FDA가 공식 인정한 유일한 항노화 성분입니다. 진피 섬유아세포를 자극해 콜라겐 합성을 촉진하고, 표피 교체 주기를 가속화하여 잔주름·모공·칙칙함을 동시에 개선합니다." },
      { heading: "농도 단계별 전략", text: "0.025~0.05%에서 시작하세요. 피부가 적응하면 4~6주 간격으로 농도를 올립니다. 0.1% → 0.3% → 0.5% 순서가 일반적이며, 민감성 피부는 레티닐 팔미테이트처럼 전환 과정이 더 긴 순한 형태로 시작하는 것이 좋습니다." },
      { heading: "샌드위치 기법", text: "피부가 예민하다면 레티놀 전후로 보습제를 바르는 '샌드위치 기법'이 효과적입니다. 보습제 → 레티놀 → 보습제 순서로 레티놀이 피부에 닿는 농도를 조절합니다." },
      { heading: "금기 사항", text: "레티놀은 빛에 불안정하므로 반드시 밤에만 사용하고, 다음 날 아침 SPF 50+ 차단제는 필수입니다. 임신 중이거나 수유 중이라면 의사와 상담 후 사용 여부를 결정하세요." },
    ],
    tag: "성분 분석",
    category: "성분",
    readTime: "5분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.03",
    bgFrom: "#A78BFA",
    bgTo: "#7C3AED",
    emoji: "✨",
  },
  {
    id: 3,
    title: "세라마이드 vs 히알루론산, 내 피부엔 뭐가 맞을까",
    summary: "둘 다 '수분'과 관련된 성분이지만 작용 원리가 완전히 다릅니다. 피부 장벽이 무너진 사람과 수분이 부족한 사람은 다른 전략이 필요합니다.",
    body: [
      { heading: "히알루론산: 수분을 끌어당기는 자석", text: "히알루론산(HA)은 자기 무게의 1,000배에 달하는 수분을 흡수하는 거대 분자입니다. 피부 외부에서 수분을 빠르게 끌어당겨 즉각적인 촉촉함을 제공합니다. 단, 건조한 환경에서는 오히려 피부 속 수분을 빼앗을 수 있어 보습 마무리 크림과 함께 사용해야 효과가 극대화됩니다." },
      { heading: "세라마이드: 장벽을 쌓는 벽돌", text: "세라마이드는 피부 각질층의 50% 이상을 구성하는 지질 성분입니다. 손상된 장벽을 직접 복구해 수분 증발을 막고 외부 자극 차단 효과가 탁월합니다. 아토피, 건선, 민감성 피부처럼 장벽이 약화된 경우 히알루론산보다 세라마이드가 우선입니다." },
      { heading: "나에게 맞는 선택법", text: "겉은 번들거리는데 속이 땅기는 '수부지'라면 히알루론산 세럼으로 수분을 공급한 뒤, 가벼운 세라마이드 로션으로 마무리하세요. 아토피나 피부 장벽이 얇은 타입이라면 세라마이드가 주성분인 크림을 바탕으로 사용하고 히알루론산을 추가하는 방식이 효과적입니다." },
    ],
    tag: "성분 비교",
    category: "성분",
    readTime: "4분",
    author: "김지현",
    authorRole: "코스메틱 케미스트",
    date: "2026.02",
    bgFrom: "#34D399",
    bgTo: "#0D9488",
    emoji: "💧",
  },
  {
    id: 4,
    title: "자외선 차단제, 겨울에도 매일 발라야 하는 이유",
    summary: "흐린 날, 실내에서도 피부 노화의 80%는 자외선 때문입니다. 피부과 전문의들이 강조하는 SPF·PA 수치의 진짜 의미와 올바른 재도포 타이밍을 알아봅니다.",
    body: [
      { heading: "UVA vs UVB, 무엇이 더 무서운가", text: "UVB는 일광화상을 일으키고 피부암 위험을 높이지만, UVA는 유리창을 뚫고 들어와 진피 깊숙이 콜라겐을 분해합니다. 흐린 날에도 UVA의 80%는 지상에 도달합니다. 노화의 주범이 UVA인 이유입니다." },
      { heading: "SPF와 PA 수치 읽는 법", text: "SPF는 UVB 차단 지수로 SPF 50은 약 98%, SPF 30은 약 97%를 차단합니다. PA는 UVA 차단 등급으로 +가 많을수록 강합니다. 일상적인 외출에는 SPF 30+ PA+++, 강한 야외 활동에는 SPF 50+ PA++++를 권장합니다." },
      { heading: "올바른 재도포 타이밍", text: "땀이나 피지로 차단 효과는 2시간마다 소멸합니다. 실내 위주 생활이라도 오전·오후 2회는 재도포가 필요합니다. 메이크업 위에는 파우더 타입 선크림이나 선쿠션을 사용하면 간편하게 재도포할 수 있습니다." },
    ],
    tag: "자외선 차단",
    category: "케어",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.02",
    bgFrom: "#FCD34D",
    bgTo: "#F59E0B",
    emoji: "☀️",
  },
  {
    id: 5,
    title: "각질 제거, 얼마나 자주 해야 할까? 과각질화의 함정",
    summary: "잦은 각질 제거는 피부 장벽을 무너뜨리는 지름길입니다. AHA·BHA·PHA의 차이와 내 피부 타입에 맞는 적정 주기를 피부과적 근거로 정리합니다.",
    body: [
      { heading: "각질은 왜 제거해야 하는가", text: "표피의 각질세포는 28~42일 주기로 자연 탈락합니다. 나이가 들거나 피부 대사가 느려지면 죽은 각질이 쌓여 칙칙함, 모공 막힘, 제품 흡수 저하로 이어집니다. 적절한 각질 제거는 피부 세포 교체를 촉진하고 다음 단계 제품의 효과를 높입니다." },
      { heading: "AHA·BHA·PHA 차이", text: "AHA(글리콜산, 젖산)는 수용성으로 건성·노화 피부에 적합합니다. 표면 각질을 빠르게 녹이지만 민감성 피부에는 자극이 올 수 있습니다. BHA(살리실산)는 지용성으로 모공 속 피지와 각질을 동시에 녹여 지성·여드름성 피부에 탁월합니다. PHA(글루코노락톤)는 분자가 커서 흡수가 느리지만 그만큼 자극이 적어 예민한 피부에 추천합니다." },
      { heading: "올바른 사용 주기", text: "일반 피부는 주 2~3회, 민감성 피부는 주 1회가 적정 주기입니다. 사용 후 반드시 SPF 차단제를 바르세요. 광민감성이 증가한 피부에 자외선이 닿으면 색소침착이 심해질 수 있습니다." },
    ],
    tag: "각질 케어",
    category: "케어",
    readTime: "5분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.01",
    bgFrom: "#FB923C",
    bgTo: "#EA580C",
    emoji: "🔬",
  },
  {
    id: 6,
    title: "비타민C 세럼, 제대로 쓰면 기미가 옅어진다",
    summary: "비타민C는 가장 오래 연구된 항산화·미백 성분이지만 산화 속도가 빨라 제품 선택과 보관이 까다롭습니다. 효과를 극대화하는 농도·pH·보관법을 알아봅니다.",
    body: [
      { heading: "비타민C의 피부 효과", text: "L-아스코르빈산(순수 비타민C)은 멜라닌 합성 효소인 타이로시나아제를 억제해 기미·잡티를 옅게 합니다. 동시에 활성산소를 중화하고 콜라겐 합성을 자극해 밝기와 탄력을 동시에 개선하는 복합 효능을 가집니다." },
      { heading: "농도와 pH", text: "일반적으로 10~20% 농도에서 효과가 검증됐습니다. pH 3.5 이하의 산성 환경에서 피부 흡수율이 높아지므로, 비타민C 세럼은 토너 전 또는 토닝 직후, 가장 먼저 사용하는 것이 원칙입니다." },
      { heading: "산화를 막는 보관법", text: "비타민C는 열·빛·공기에 노출되면 급격히 산화됩니다. 황갈색으로 변한 제품은 효과가 없을 뿐만 아니라 오히려 피부를 자극할 수 있습니다. 차광 용기에 담긴 제품을 선택하고, 개봉 후에는 냉장 보관하거나 3개월 내에 사용을 완료하세요." },
      { heading: "안정화 비타민C 성분들", text: "민감성 피부라면 아스코르빌글루코사이드, 아스코르빌팔미테이트처럼 안정화된 유도체를 선택하세요. 효과는 순수 형태보다 느리게 나타나지만 자극 없이 꾸준히 사용할 수 있습니다." },
    ],
    tag: "미백 성분",
    category: "성분",
    readTime: "5분",
    author: "최지수",
    authorRole: "피부 약학 연구원",
    date: "2026.01",
    bgFrom: "#FDE68A",
    bgTo: "#F59E0B",
    emoji: "🍋",
  },
  {
    id: 7,
    title: "환절기 피부 트러블의 과학: 왜 봄·가을마다 피부가 망가지나",
    summary: "온도와 습도의 급격한 변화는 피부 항상성을 교란합니다. 환절기 트러블의 생물학적 원인과 선제적 대응 루틴을 전문가 시각으로 풀어봅니다.",
    body: [
      { heading: "피부 항상성이란", text: "피부는 외부 온도·습도·UV·미생물 변화에 맞서 내부 환경을 일정하게 유지하려는 '항상성'을 갖습니다. 계절이 바뀔 때 이 적응 시스템이 과부하를 받으면 피지 분비 불균형, 각질 비정상 탈락, 피부 마이크로바이옴 교란이 연쇄적으로 발생합니다." },
      { heading: "봄철 특이점", text: "겨울 동안 두꺼워진 각질층이 온도 상승과 함께 급격히 탈락하면서 일시적으로 피부 장벽이 약해집니다. 황사·꽃가루 같은 환경적 자극원이 급증하고, 겨울용 진한 보습제가 봄의 높아진 습도와 맞지 않아 모공을 막는 경우도 흔합니다." },
      { heading: "선제적 대응 루틴", text: "환절기 2주 전부터 보습제를 가볍게 교체하고, 각질 제거를 주 1~2회 추가하세요. 장벽 강화 세라마이드 제품을 유지하되, 텍스처는 계절 변화에 맞춰 젤→로션→크림 순으로 조정하는 것이 피부 트러블을 최소화하는 방법입니다." },
    ],
    tag: "환절기 케어",
    category: "케어",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#6EE7B7",
    bgTo: "#10B981",
    emoji: "🌿",
  },
  {
    id: 8,
    title: "속건성 vs 겉건성, 내 건조함의 원인이 달라야 해결된다",
    summary: "같은 '건조 피부'라도 원인이 다르면 해결책도 달라집니다. 수분이 부족한 타입과 유분이 부족한 타입을 구분하는 법, 그리고 각각의 최적 루틴을 정리했습니다.",
    body: [
      { heading: "겉건성: 유분 부족형", text: "겉건성은 피지 분비가 적어 피부 표면에 기름막이 형성되지 않는 상태입니다. 세안 후 당김이 오래 지속되고, 미세 각질이 일어나기 쉽습니다. 식물성 오일(스쿠알란, 호호바 오일)이나 세라마이드처럼 지질 성분을 보충하는 것이 핵심입니다." },
      { heading: "속건성: 수분 부족형", text: "속건성은 피지 분비는 정상이거나 많지만 각질층의 수분 함유량이 낮은 상태입니다. 겉은 번들거리는데 속이 당기는 '수부지'가 대표적입니다. 히알루론산·글리세린처럼 수분을 끌어당기는 성분을 충분히 공급하되, 막음막이 역할의 보습 마무리는 가볍게 마무리하세요." },
      { heading: "구분하는 방법", text: "세안 후 아무것도 바르지 않은 상태에서 30분이 지났을 때 피부 상태를 관찰합니다. 전체적으로 당기고 각질이 보이면 겉건성, 이마·코는 번들거리는데 볼만 당긴다면 속건성일 가능성이 높습니다. Fonday AI 스캔으로 바우만 O/D 수치를 확인하면 더 정확하게 판별할 수 있습니다." },
    ],
    tag: "피부 타입",
    category: "타입",
    readTime: "4분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.02",
    bgFrom: "#93C5FD",
    bgTo: "#3B82F6",
    emoji: "🌊",
  },
  {
    id: 9,
    title: "올바른 더블 클렌징 가이드: 순서 하나가 피부를 바꾼다",
    summary: "클렌징은 스킨케어의 시작이지만 잘못된 순서와 방법이 피부 장벽을 훼손합니다. 오일 클렌저와 폼 클렌저의 올바른 조합법을 과학적으로 설명합니다.",
    body: [
      { heading: "더블 클렌징이 필요한 이유", text: "선크림·파운데이션·컨실러 같은 지용성 메이크업은 수용성 폼 클렌저 하나로는 완전히 제거되지 않습니다. 남은 잔여물이 모공을 막고 피지 산화를 일으켜 피부 트러블의 원인이 됩니다. 1단계 오일 클렌저로 지용성 성분을 먼저 녹이고, 2단계 폼 클렌저로 수용성 불순물을 제거하는 것이 핵심입니다." },
      { heading: "오일 클렌저 사용법", text: "건조한 손과 얼굴에 오일 클렌저를 바르고 30~60초간 부드럽게 마사지합니다. 이때 물을 섞으면 유화 반응이 일어나 각질과 메이크업이 분리됩니다. 물이 약간 섞인 상태에서 충분히 유화한 뒤 물로 헹궈내세요." },
      { heading: "폼 클렌저 주의점", text: "폼 클렌저는 세정력이 강할수록 피부 장벽에 부담이 됩니다. pH 5.5 전후의 약산성 클렌저가 피부의 자연 산성막을 유지하는 데 적합합니다. 클렌징 시간은 60초 이내로 짧게 유지하고, 세안 후 즉시 보습 단계를 진행해 수분 손실을 최소화하세요." },
    ],
    tag: "클렌징 루틴",
    category: "루틴",
    readTime: "4분",
    author: "최지수",
    authorRole: "피부 약학 연구원",
    date: "2026.01",
    bgFrom: "#C4B5FD",
    bgTo: "#8B5CF6",
    emoji: "🫧",
  },
  {
    id: 10,
    title: "압출하면 안 되는 5가지 이유, 피부과 전문의가 말한다",
    summary: "여드름이나 블랙헤드를 손으로 짜는 것은 당장은 해소되는 것 같지만 피부 흉터와 색소침착을 부를 수 있습니다. 올바른 트러블 케어법을 공개합니다.",
    body: [
      { heading: "압출이 피부에 미치는 영향", text: "손가락으로 피부를 누를 때 가해지는 압력은 모낭을 주변 진피층으로 파열시킵니다. 피지가 진피 내부로 흘러들어가면 격렬한 염증 반응이 일어나고, 이것이 흉터와 색소침착의 직접적인 원인이 됩니다." },
      { heading: "균이 퍼진다", text: "손에 있는 포도상구균이나 큐티박테리움 여드름균이 압출 과정에서 주변 모낭으로 전파됩니다. 하나의 여드름을 짜다가 주변에 두세 개가 새로 생기는 경험을 한 적 있다면 바로 이 이유입니다." },
      { heading: "블랙헤드 압출도 금물", text: "블랙헤드는 압출이 아닌 BHA(살리실산)와 클레이 마스크로 서서히 녹여내는 것이 정석입니다. 압출로 모공이 늘어나면 피지 분비가 더 왕성해져 악순환이 반복됩니다." },
      { heading: "올바른 대안", text: "농포성 여드름이라면 패치를 붙여 진물을 흡수시키거나, 피부과에서 전문 압출을 받으세요. 면포(화이트헤드·블랙헤드)는 BHA 성분의 엑스폴리언트로 모공 속을 정기적으로 관리하는 것이 장기적으로 피부 손상을 최소화합니다." },
    ],
    tag: "트러블 케어",
    category: "전문가",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#FCA5A5",
    bgTo: "#EF4444",
    emoji: "🩺",
  },
];

// ─── 얼굴 가이드 카메라 ──────────────────────────────────────────
function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [useFile, setUseFile] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) { setUseFile(true); return; }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setUseFile(true));

    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // 얼굴 영역: 가로 70%, 세로 85%, 세로 위쪽 편향 크롭
    const cropW = vw * 0.70;
    const cropH = Math.min(vh, cropW * 1.3);
    const cropX = (vw - cropW) / 2;
    const cropY = Math.max(0, (vh - cropH) * 0.25);

    // max 1024px로 제한하여 전송 크기 최적화
    const MAX_DIM = 1024;
    const scale = Math.min(1, MAX_DIM / Math.max(cropW, cropH));
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 전면 카메라 좌우 반전 보정
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.82);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onCapture(file); }
  };

  if (useFile) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6">
        <p className="text-white text-sm">{t("camera.noCamera")}</p>
        <Button onClick={() => fileRef.current?.click()} className="bg-white text-black font-bold px-8 h-14 rounded-2xl">
          {t("camera.selectPhoto")}
        </Button>
        <Button variant="ghost" onClick={onClose} className="text-white/60">{t("camera.cancel")}</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 카메라 뷰 */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* 얼굴 가이드 오버레이 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="faceCutout">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx="50%" cy="40%" rx="32%" ry="37%" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#faceCutout)" />
          {/* 가이드 타원 실선 */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
          {/* 가이드 타원 점선 (컬러) */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke={SCAN_FROM} strokeWidth="1.5" strokeDasharray="10 6" opacity="0.7" />
        </svg>

        {/* 안내 문구 */}
        <div className="absolute top-[8%] left-0 right-0 text-center pointer-events-none px-6">
          <p className="text-white text-sm font-semibold drop-shadow-lg">{t("camera.guide1")}</p>
          <p className="text-white/60 text-xs mt-1">{t("camera.guide2")}</p>
        </div>

        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 촬영 버튼 */}
      <div className="bg-black py-8 flex items-center justify-center">
        <motion.button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl disabled:opacity-30"
          whileTap={{ scale: 0.88 }}
        >
          <div className="w-15 h-15 w-[60px] h-[60px] rounded-full border-[3px] border-black/15" />
        </motion.button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── 언어 선택 버튼 ──────────────────────────────────────────────
function LangSwitcher() {
  const { i18n: i18nHook } = useTranslation();
  const langs = ["EN", "KO", "JA"];
  const current = (i18nHook.language || "en").toUpperCase();
  return (
    <div className="flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-stone-100">
      {langs.map((lang, idx) => (
        <button
          key={lang}
          onClick={() => i18nHook.changeLanguage(lang.toLowerCase())}
          className="text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-all"
          style={current === lang ? { color: SCAN_TO } : { color: "#B0A898" }}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

// ─── 하단 네비게이션 ──────────────────────────────────────────────
function BottomNav({ active, onChange, scanState }: {
  active: TabId;
  onChange: (t: TabId) => void;
  scanState: ScanState;
}) {
  const { t } = useTranslation();
  if (scanState === "survey" || scanState === "scanning") return null;
  const btn = (tab: TabId, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange(tab)}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active === tab ? "text-[#C97062]" : "text-stone-400"}`}>
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-stone-100">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-4 h-[64px]">
          {btn("scan", <Camera className="w-5 h-5" />, t("nav.scan"))}
          {btn("diary", <BookOpen className="w-5 h-5" />, t("nav.diary"))}
          {btn("magazine", <FileText className="w-5 h-5" />, t("nav.magazine"))}
          {btn("my", <User className="w-5 h-5" />, t("nav.my"))}
        </div>
      </div>
    </nav>
  );
}

// ─── 페이스 메시 오버레이 (실제 얼굴 인식) ──────────────────────
function FaceMeshOverlay({ imageSrc }: { imageSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mp = await import('@mediapipe/face_mesh');
        const { FaceMesh, FACEMESH_CONTOURS, FACEMESH_TESSELATION } = mp;

        const img = new Image();
        img.src = imageSrc;
        await new Promise<void>(r => { img.onload = () => r(); });

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        let lms: any[] = [];
        await new Promise<void>((resolve) => {
          faceMesh.onResults((results: any) => {
            if (!cancelled && results.multiFaceLandmarks?.[0]) {
              lms = results.multiFaceLandmarks[0];
            }
            resolve();
          });
          faceMesh.send({ image: img });
        });
        faceMesh.close();

        if (cancelled || !lms.length) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // 실제 표시 크기 (CSS pixel)
        const cW = canvas.offsetWidth || 256;
        const cH = canvas.offsetHeight || 320;
        canvas.width = cW;
        canvas.height = cH;

        // object-cover 와 동일한 좌표 변환: 이미지 비율 유지하며 컨테이너를 꽉 채움
        const iW = img.naturalWidth;
        const iH = img.naturalHeight;
        const scale = Math.max(cW / iW, cH / iH);
        const ox = (cW - iW * scale) / 2;
        const oy = (cH - iH * scale) / 2;
        const toXY = (lm: any): [number, number] => [
          lm.x * iW * scale + ox,
          lm.y * iH * scale + oy,
        ];

        const ctx = canvas.getContext('2d')!;

        // 테셀레이션 (촘촘한 메시)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 0.6;
        for (const [a, b] of FACEMESH_TESSELATION) {
          const [ax, ay] = toXY(lms[a]);
          const [bx, by] = toXY(lms[b]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        // 외곽선 + 눈/코/입 강조
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        for (const [a, b] of FACEMESH_CONTOURS) {
          const [ax, ay] = toXY(lms[a]);
          const [bx, by] = toXY(lms[b]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        // 랜드마크 점 (8개마다 1개)
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < lms.length; i += 8) {
          const [x, y] = toXY(lms[i]);
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!cancelled) setVisible(true);
      } catch (e) {
        console.warn('Face mesh detection failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [imageSrc]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
    />
  );
}

// ─── idle 미리보기 점수 바 ────────────────────────────────────────
// ─── 날씨 연동 데일리 팁 카드 ─────────────────────────────────────
type WeatherData = {
  temp: number;
  humidity: number;
  weatherId: number;
  weatherMain: string;
  cityName: string;
  aqi: number | null;
};

type WeatherTipKey = "polluted" | "snowy" | "rainy" | "foggy" | "cold" | "sunny_hot" | "sunny" | "dry" | "humid" | "cloudy";

function getWeatherTipKey(d: WeatherData): WeatherTipKey {
  if (d.aqi !== null && d.aqi >= 3) return "polluted";
  const id = d.weatherId;
  if (id >= 600 && id < 700) return "snowy";
  if ((id >= 200 && id < 400) || (id >= 500 && id < 600)) return "rainy";
  if (id >= 700 && id < 800) return "foggy";
  if (d.temp < 5) return "cold";
  if ((id === 800 || id === 801) && d.temp >= 28) return "sunny_hot";
  if (id === 800 || id === 801) return "sunny";
  if (d.humidity < 35) return "dry";
  if (d.humidity > 80) return "humid";
  return "cloudy";
}

// ─── 미션 카드 (idle 화면) ────────────────────────────────────────
function MissionCard() {
  const { t } = useTranslation();
  const [missions, setMissions] = useState<MissionState>(() => getMissions());
  const [expanded, setExpanded] = useState(false);

  // 오늘 날짜 기준으로 daily 미션 표시 여부 결정
  const today = todayStr();
  const isDailyCompleted = missions.dailyDate === today && missions.dailyCompleted;

  const ALL_MISSION_IDS = ["daily_scan", "daily_improve", "daily_challenge", "first_scan", "streak_3", "streak_7", "streak_30", "score_70", "score_80", "challenge", "share"];
  const isDailyImproved = missions.dailyDate === today && missions.dailyImproved;
  const isDailyChallenged = missions.dailyDate === today && missions.dailyChallenged;

  const missionItems = ALL_MISSION_IDS.map(id => {
    let done: boolean;
    if (id === "daily_scan") done = isDailyCompleted;
    else if (id === "daily_improve") done = isDailyImproved;
    else if (id === "daily_challenge") done = isDailyChallenged;
    else done = missions.completed.includes(id);
    return { id, done, points: MISSION_POINTS[id] || 0 };
  });

  const incomplete = missionItems.filter(m => !m.done);
  const complete = missionItems.filter(m => m.done);
  const visible = expanded ? missionItems : [...incomplete.slice(0, 3), ...complete.slice(0, 1)].slice(0, 4);

  return (
    <motion.div variants={fadeChild} className="mb-4">
      <div className="bg-white rounded-2xl px-4 py-3.5 border border-stone-100"
        style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.08)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("mission.title")}</p>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
            {t("mission.points", { n: missions.totalPoints })}
          </span>
        </div>
        <div className="space-y-2">
          {visible.map(({ id, done, points }) => (
            <div key={id} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{done ? "✅" : "🔒"}</span>
                <span className={`text-[12px] font-semibold ${done ? "text-stone-400 line-through" : "text-stone-700"}`}>
                  {t(`mission.${id}`)}
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-500">+{points}pt</span>
            </div>
          ))}
        </div>
        {missionItems.length > 4 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 w-full text-[11px] font-semibold text-stone-400 text-center py-1"
          >
            {expanded ? t("mission.hide") : t("mission.showAll")}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WeatherTipCard({ compact, weather: weatherProp }: { compact?: boolean; weather?: WeatherData | null } = {}) {
  const { t } = useTranslation();
  const [internalWeather, setInternalWeather] = useState<WeatherData | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (weatherProp !== undefined) return; // 외부에서 prop으로 전달된 경우 내부 fetch 스킵
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data && !data.error) setInternalWeather(data as WeatherData); })
          .catch(() => {});
      },
      () => setDenied(true),
      { timeout: 8000 }
    );
  }, [weatherProp]);

  const weather = weatherProp ?? internalWeather;
  if (denied || !weather) return null;

  const tipKey = getWeatherTipKey(weather);
  const tipRaw = t(`weather.tips.${tipKey}`, { returnObjects: true });
  const tipArr = Array.isArray(tipRaw) ? tipRaw : [tipRaw];
  const dayIdx = Math.floor(Date.now() / 86400000) % tipArr.length;
  const tip = tipArr[dayIdx] as { emoji: string; title: string; body: string };
  const aqiLabel = weather.aqi ? t(`weather.aqi${weather.aqi}`) : null;

  if (compact) {
    return (
      <div className="px-3.5 py-2.5 border-t border-stone-100/80"
        style={{ background: "linear-gradient(135deg, #EAF4F0 0%, #F0FAF6 100%)" }}>
        <div className="flex items-start gap-2.5">
          <span className="text-xl leading-none flex-shrink-0 mt-0.5">{tip.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-stone-700 leading-tight">{tip.title}</p>
            <p className="text-[10.5px] text-stone-500 leading-relaxed mt-0.5">{tip.body}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: DEEP_GREEN }}>{weather.temp}°C</span>
            {aqiLabel && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/70 text-stone-500 border border-stone-200">{aqiLabel}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={fadeChild} className="mb-4">
      <div
        className="rounded-2xl p-4 border border-stone-100 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #EAF4F0 0%, #F0FAF6 100%)", boxShadow: "0 2px 12px rgba(45,95,79,0.08)" }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20"
          style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }} />
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: DEEP_GREEN }}>
            <Sun className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: DEEP_GREEN }}>
            {t("weather.cardTitle")}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none flex-shrink-0">{tip.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-stone-800 mb-1 leading-tight">{tip.title}</p>
            <p className="text-[11.5px] text-stone-500 leading-relaxed">{tip.body}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: DEEP_GREEN }}>
            {weather.temp}°C
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-stone-600 border border-stone-200">
            {t("weather.humidity", { val: weather.humidity })}
          </span>
          {aqiLabel && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-stone-600 border border-stone-200">
              {aqiLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MiniScoreBarIdle({ label, score, color, delay }: { label: string; score: number; color: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] flex-shrink-0 w-[74px] whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{label}</span>
      <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "#E8E0D8" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: animated ? `${score}%` : "0%",
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <span className="text-[11px] font-bold flex-shrink-0 w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── 메인 스캔 화면 ───────────────────────────────────────────────
function ScanIdleScreen({ onScan }: { onScan: () => void }) {
  const { t } = useTranslation();
  const streak = getStreak();
  const daysSince = getDaysSinceLastScan();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBaumannExp, setShowBaumannExp] = useState(false);
  const [socialCount, setSocialCount] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [idleWeather, setIdleWeather] = useState<WeatherData | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data && !data.error) setIdleWeather(data as WeatherData); })
          .catch(() => {});
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && window.scrollY === 0) setPullY(Math.min(dy, 80));
  };
  const handleTouchEnd = () => {
    if (pullY >= 70) window.location.reload();
    setPullY(0);
  };

  useEffect(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const target = Math.floor(2000 + Math.abs(Math.sin(seed) * 1500));
    let current = 0;
    const stepMs = 16;
    const increment = target / (1500 / stepMs);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setSocialCount(target); clearInterval(timer); }
      else setSocialCount(Math.floor(current));
    }, stepMs);
    return () => clearInterval(timer);
  }, []);

  const PREVIEW_SCORES = [
    { idx: 0, score: 82, color: SCORE_COLORS[0] },
    { idx: 1, score: 68, color: SCORE_COLORS[1] },
    { idx: 2, score: 74, color: SCORE_COLORS[2] },
    { idx: 3, score: 91, color: SCORE_COLORS[3] },
  ];

  const STEPS = [
    { icon: "📋", title: t("idle.step1"), sub: t("idle.step1Sub"), active: true },
    { icon: "📸", title: t("idle.step2"), sub: t("idle.step2Sub"), active: false },
    { icon: "🧬", title: t("idle.step3"), sub: t("idle.step3Sub"), active: false },
  ];

  return (
    <>
      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>

    <motion.div
      className="flex flex-col px-3 pb-8 relative overflow-hidden"
      style={{ minHeight: "calc(100dvh - 60px)", background: "#FDFAF8", paddingTop: 20 }}
      variants={stagger} initial="initial" animate="animate"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 헤더 row */}
      <div className="flex justify-between items-center mb-3 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-2">
          <AttendanceBadge onClick={() => setShowCalendar(true)} />
          {streak.count >= 2 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}>
              {t("streak.badge", { count: streak.count })}
            </span>
          )}
        </div>
        <LangSwitcher />
      </div>

      {pullY > 10 && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{ height: pullY, opacity: pullY / 70 }}>
          <div className={`w-7 h-7 rounded-full border-2 border-t-transparent flex items-center justify-center ${pullY >= 70 ? "border-[#C97062]" : "border-stone-300"}`}
            style={{ animation: pullY >= 70 ? "spin 0.6s linear infinite" : "none" }} />
        </div>
      )}
      {/* ── Aurora 배경 blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div className="absolute rounded-full"
          style={{ width: 280, height: 280, background: `${SCAN_FROM}18`, filter: "blur(50px)", top: -60, left: -60 }}
          animate={{ x: [0, 30, -10, 0], y: [0, 20, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 200, height: 200, background: "#F3D4C818", filter: "blur(40px)", top: 80, right: -40 }}
          animate={{ x: [0, -20, 10, 0], y: [0, 30, -10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 240, height: 240, background: `${SCAN_TO}12`, filter: "blur(50px)", bottom: 200, left: "20%" }}
          animate={{ x: [0, -15, 20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      {/* 날씨 기반 그리팅 + 날씨 팁 통합 카드 */}
      {(() => {
        const hour = new Date().getHours();
        const weatherEmojiMap: Record<WeatherTipKey, string> = {
          polluted: "😷", snowy: "❄️", rainy: "🌧️", foggy: "🌫️",
          cold: "🧣", sunny_hot: "🌞", sunny: "☀️", dry: "🌵", humid: "💦", cloudy: "☁️",
        };
        const weatherKeyMap: Record<WeatherTipKey, string> = {
          polluted: "idle.greetingWeatherPolluted",
          snowy:    "idle.greetingWeatherSnowy",
          rainy:    "idle.greetingWeatherRainy",
          foggy:    "idle.greetingWeatherFoggy",
          cold:     "idle.greetingWeatherCold",
          sunny_hot:"idle.greetingWeatherSunnyHot",
          sunny:    "idle.greetingWeatherSunny",
          dry:      "idle.greetingWeatherDry",
          humid:    "idle.greetingWeatherHumid",
          cloudy:   "idle.greetingWeatherCloudy",
        };
        const timeBased = [
          { range: [6, 10],  emoji: "☀️", key: "idle.greetingMorning" },
          { range: [10, 14], emoji: "🌤️", key: "idle.greetingNoon" },
          { range: [14, 20], emoji: "💧", key: "idle.greetingAfternoon" },
          { range: [20, 25], emoji: "🌙", key: "idle.greetingNight" },
        ];
        const fallback = timeBased.find(({ range }) => hour >= range[0] && hour < range[1]);
        if (!fallback) return null;

        // 낮 시간대(6~20)에 날씨 데이터가 있으면 날씨 기반 그리팅 사용
        const useWeatherGreeting = idleWeather && hour >= 6 && hour < 20;
        const wKey = useWeatherGreeting ? getWeatherTipKey(idleWeather!) : null;
        const emoji = wKey ? weatherEmojiMap[wKey] : fallback.emoji;
        const greetingKey = wKey ? weatherKeyMap[wKey] : fallback.key;

        return (
          <motion.div variants={fadeChild} className="mb-3 relative" style={{ zIndex: 1 }}>
            <div className="rounded-2xl overflow-hidden border"
              style={{ background: "rgba(255,255,255,0.85)", borderColor: "rgba(201,112,98,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <span className="text-base">{emoji}</span>
                <p className="text-[12px] font-semibold text-stone-600">{t(greetingKey)}</p>
              </div>
              <WeatherTipCard compact weather={idleWeather} />
            </div>
          </motion.div>
        );
      })()}

      {/* 컴백 배너 (3일+ 경과 시) */}
      {daysSince !== null && daysSince >= 3 && (
        <motion.div variants={fadeChild} className="mb-3 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[12px] font-semibold"
            style={daysSince >= 7
              ? { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }
              : { background: "#F0FAF6", color: "#166534", border: "1px solid #BBF7D0" }}>
            {daysSince >= 7
              ? t("streak.comeback7", { days: daysSince })
              : t("streak.comeback3", { days: daysSince })}
          </div>
        </motion.div>
      )}

      {/* ── 헤더 + 히어로 미리보기 ── */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: `${SCAN_FROM}22`, border: `1px solid ${SCAN_FROM}50` }}>
            <Sparkles className="w-3 h-3" style={{ color: SCAN_TO }} />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: SCAN_TO }}>FONDAY AI</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/80 border border-white/70 shadow-[0_8px_24px_rgba(189,133,111,0.12)]">
            <span className="text-[10px] font-bold" style={{ color: DEEP_GREEN }}>{t("idle.heroBadge")}</span>
          </div>
        </div>
        <h1 className="text-[28px] sm:text-[30px] font-black text-stone-800 leading-[1.08] mb-2 px-1">
          {t("idle.subtitle1")}<br />{t("idle.subtitle3")}
        </h1>
        <p className="text-[13px] text-stone-500 px-1 mb-3.5">
          {t("idle.subtitle4")}
        </p>

        <div className="rounded-[28px] p-3 border border-white/70 sm:rounded-[30px] sm:p-3.5"
          style={{ background: "rgba(255,255,255,0.84)", boxShadow: "0 18px 44px rgba(160,120,100,0.15)", backdropFilter: "blur(14px)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] font-bold text-stone-700">{t("idle.previewTitle")}</div>
              <div className="text-[9px] text-stone-400">{t("idle.previewSub")}</div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full max-w-[52%] sm:max-w-none"
              style={{ background: `${SCAN_FROM}16`, color: SCAN_TO }}>
              <Heart className="w-3 h-3 shrink-0" />
              <span className="text-[9.5px] leading-tight font-bold text-right break-keep">{t("idle.socialCount", { n: socialCount.toLocaleString() })}</span>
            </div>
          </div>
          <div className="grid grid-cols-[116px_1fr] gap-2.5 items-stretch sm:grid-cols-[132px_1fr] sm:gap-3">
            <div className="relative rounded-[22px] overflow-hidden min-h-[168px] bg-stone-100 sm:rounded-[24px] sm:min-h-[176px]">
              <img
                src="/face-model.png"
                alt="preview"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center top" }}
              />
              <motion.div className="absolute left-0 right-0 h-[2px] z-10"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${SCAN_TO}CC 40%, ${SCAN_FROM} 50%, ${SCAN_TO}CC 60%, transparent 100%)` }}
                animate={{ top: ["5%", "88%", "5%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
              <div className="absolute inset-x-0 bottom-0 h-24"
                style={{ background: "linear-gradient(to top, rgba(20,20,20,0.55), transparent)" }} />
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-white/75">{t("idle.heroMbtiLabel")}</p>
                <p className="text-[22px] sm:text-[24px] font-black leading-none">OSNT</p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="rounded-[20px] px-2.5 py-2.5 mb-2.5 sm:rounded-[22px] sm:px-3"
                style={{ background: `${SCAN_FROM}10`, border: `1px solid ${SCAN_FROM}24` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("idle.heroBenefitsTitle")}</p>
                  <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: TEXT_SECONDARY }}>{t("idle.heroTag")}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-[9px]" style={{ background: "#F3E8E2", color: SCAN_TO }}>{t("result.baumannLabel")}</Badge>
                    <span>{t("idle.heroBenefit1")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-[9px]" style={{ background: "#E7F7F0", color: DEEP_GREEN }}>{t("result.scores")}</Badge>
                    <span>{t("idle.heroBenefit2")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-700">
                    <Badge className="h-5 rounded-full px-2 text-[9px]" style={{ background: "#FFF2E8", color: "#C2410C" }}>{t("result.skinAge")}</Badge>
                    <span>{t("idle.heroBenefit3")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {PREVIEW_SCORES.map(({ idx, score, color }, i) => (
                  <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={500 + i * 100} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 바우만 설명 더보기 accordion */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="rounded-2xl border border-stone-100 bg-white/90" style={{ backdropFilter: "blur(8px)" }}>
          <button onClick={() => setShowBaumannExp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🧬</span>
              <p className="text-[13px] font-black text-stone-800">{t("idle.baumannSectionTitle")}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {!showBaumannExp && <span className="text-[10px] font-bold text-stone-400">O/D · S/R · P/N · W/T</span>}
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${showBaumannExp ? "rotate-180" : ""}`} />
            </div>
          </button>
          <AnimatePresence>
            {showBaumannExp && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                className="overflow-hidden px-4 pb-4">
                <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">{t("idle.baumannSectionDesc")}</p>
                <div className="space-y-1.5 mb-3">
                  {(t("idle.baumannAxes", { returnObjects: true }) as any[]).map((ax: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <p className="text-[11px] font-black text-stone-600 w-16 shrink-0">{ax.label}</p>
                      <p className="text-[11px] text-stone-400">{ax.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(BAUMANN_COLORS) as [string, string][]).map(([letter, color]) => (
                    <span key={letter} className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ color, background: `${color}12`, borderColor: `${color}25` }}>
                      {letter} {t(`baumann.${letter}.name`)}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 단계 표시 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="bg-white/90 rounded-2xl px-3 py-2 border border-stone-100"
          style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.08)", backdropFilter: "blur(8px)" }}>
          <p className="text-[9px] font-semibold text-stone-400 text-center mb-2 tracking-widest uppercase">
            {t("idle.stepsTitle")}
          </p>
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start" style={{ flex: 1 }}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={step.active
                      ? { background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, boxShadow: `0 4px 14px ${SCAN_FROM}44` }
                      : { background: "#EDE6DE" }}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-stone-700">{step.title}</div>
                    <div className="text-[9px] text-stone-400 mt-0.5 leading-tight">{step.sub}</div>
                  </div>
                </div>
                {i < 2 && <div className="text-stone-200 text-sm pt-2 flex-shrink-0">›</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 개인정보 보호 배지 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border"
          style={{ background: "#F0FAF6", borderColor: "#C5E5DA" }}>
          <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DEEP_GREEN }} />
          <span className="text-[11px] font-semibold" style={{ color: DEEP_GREEN }}>{t("idle.privacy")}</span>
        </div>
      </motion.div>

      {/* CTA 버튼 */}
      <motion.div variants={fadeChild} className="mt-auto relative" style={{ zIndex: 1 }}>
        <motion.button
          onClick={onScan}
          className="w-full py-4 sm:py-[18px] rounded-[18px] text-white text-[15px] sm:text-[16px] font-bold tracking-tight"
          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            boxShadow: [
              `0 8px 28px ${SCAN_FROM}44`,
              `0 12px 40px ${SCAN_FROM}70`,
              `0 8px 28px ${SCAN_FROM}44`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {t("idle.ctaBtn")}
        </motion.button>
        <p className="text-center text-[11px] mt-2.5" style={{ color: TEXT_SECONDARY }}>
          <Sparkles className="w-3 h-3 inline mr-1" style={{ color: SCAN_FROM }} />
          {t("idle.ctaHint")}
        </p>
      </motion.div>


      <div className="text-center pt-4 pb-4 relative" style={{ zIndex: 1 }}>
        <a href="/privacy.html" className="text-[10px] underline" style={{ color: TEXT_SECONDARY }}>
          {t("idle.privacyLink")}
        </a>
        <span className="text-[10px] text-stone-200 mx-2">·</span>
        <a href="/terms.html" className="text-[10px] underline" style={{ color: TEXT_SECONDARY }}>
          {t("idle.termsLink")}
        </a>
      </div>
    </motion.div>
    </>
  );
}

// ─── 설문 화면 ────────────────────────────────────────────────────
function SurveyScreen({ onSubmit, onBack }: { onSubmit: (data: SurveyData) => void; onBack: () => void }) {
  const { t } = useTranslation();
  const [genderIdx, setGenderIdx] = useState(0); // 0=female, 1=male
  const [ageIdx, setAgeIdx] = useState(2);
  const ageGroups = t("survey.ageGroups", { returnObjects: true }) as string[];
  const skinConcerns = t("survey.skinConcerns", { returnObjects: true }) as string[];
  const [concernIdxs, setConcernIdxs] = useState<number[]>([]);
  const toggleConcern = (i: number) => setConcernIdxs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <motion.div className="flex flex-col h-[calc(100dvh-60px)]" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="px-6 pt-8 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold" style={{ color: DEEP_GREEN }}>{t("survey.title")}</h2>
        </div>
        <p className="text-[13px] text-muted-foreground ml-10">{t("survey.subtitle")}</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        <div className="space-y-8 pb-4">
          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.gender")}</label>
            <div className="flex gap-2">
              {[t("survey.female"), t("survey.male")].map((item, idx) => (
                <Button key={idx} onClick={() => setGenderIdx(idx)} variant={genderIdx === idx ? "default" : "outline"}
                  className={`flex-1 h-14 rounded-xl text-[14px] font-bold ${genderIdx === idx ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
                </div>

                <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.age")}</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map((item, idx) => (
                <Button key={idx} onClick={() => setAgeIdx(idx)} variant={ageIdx === idx ? "default" : "outline"}
                  className={`h-12 rounded-xl text-[13px] font-bold ${ageIdx === idx ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.concerns")}</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map((item, idx) => (
                <Button key={idx} onClick={() => toggleConcern(idx)} variant={concernIdxs.includes(idx) ? "secondary" : "outline"}
                  className={`h-12 rounded-xl text-[12px] font-bold ${concernIdxs.includes(idx) ? "bg-[#3D7A66] text-white hover:bg-[#3D7A66]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeChild} className="px-6 py-4 shrink-0 bg-white border-t border-stone-100">
        <Button onClick={() => onSubmit({
          gender: genderIdx === 0 ? t("survey.female") : t("survey.male"),
          age: ageGroups[ageIdx],
          genderIdx,
          ageIdx,
          skinType: "복합성",
          concerns: concernIdxs.map(i => skinConcerns[i]),
          condition: "맨얼굴"
        })}
          className="w-full h-14 rounded-2xl font-bold text-white shadow-xl bg-[#2D5F4F] hover:bg-[#3D7A66] text-lg">
          {t("survey.startBtn")}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── 분석 중 화면 ─────────────────────────────────────────────────
function ScanningScreen({ imageSrc }: { imageSrc: string | null }) {
  const { t, i18n } = useTranslation();
  const [textIdx, setTextIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const texts = t("scanning.texts", { returnObjects: true }) as string[];

  // 텍스트 사이클 — 언어 변경 시 재시작 (Bug 6 fix)
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
      <div className="mt-8 text-center space-y-2">
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

// ─── 다이어리 메모 유틸 ──────────────────────────────────────────
function getDiaryMemo(dateStr: string): string {
  try { return localStorage.getItem(`fonday_memo_${dateStr}`) || ""; } catch { return ""; }
}
function saveDiaryMemo(dateStr: string, text: string) {
  try {
    if (text.trim()) localStorage.setItem(`fonday_memo_${dateStr}`, text.trim());
    else localStorage.removeItem(`fonday_memo_${dateStr}`);
  } catch {}
  // 모든 날짜 dispatch + dateStr 포함 (서버 동기화용)
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}

const DIARY_CAUSE_TAGS = ["sleep", "newProduct", "cycle", "diet", "stress", "outdoor"] as const;
type DiaryCauseTag = typeof DIARY_CAUSE_TAGS[number];
const LEGACY_DIARY_CAUSE_TAG_MAP: Record<string, DiaryCauseTag> = {
  "수면부족": "sleep",
  "새 화장품": "newProduct",
  "생리주기": "cycle",
  "식단": "diet",
  "스트레스": "stress",
  "야외활동": "outdoor",
};
const CAUSE_TAG_KEYWORDS: Record<DiaryCauseTag, string[]> = {
  sleep: ["피곤", "수면", "잠", "야근", "늦잠", "sleep", "tired", "insomnia", "寝不足", "睡眠"],
  newProduct: ["새", "화장품", "세럼", "크림", "토너", "제품", "new product", "serum", "cream", "toner", "cosmetic", "新しい", "化粧品"],
  cycle: ["생리", "주기", "pms", "period", "cycle", "menstrual", "生理", "周期"],
  diet: ["매운", "야식", "커피", "술", "밀가루", "단것", "식단", "diet", "coffee", "alcohol", "spicy", "sugar", "食事", "コーヒー", "お酒"],
  stress: ["스트레스", "예민", "피로", "긴장", "stress", "stressed", "sensitive", "ストレス", "疲れ"],
  outdoor: ["야외", "운동", "햇빛", "외출", "여행", "outdoor", "sun", "travel", "workout", "外出", "日差し", "旅行"],
};

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  lastNotifiedDate: string;
}

interface AICareSettings {
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

function getAICareSettings(): AICareSettings {
  try {
    const raw = localStorage.getItem("fonday_ai_care_settings");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AICareSettings>;
      return {
        enabled: Boolean(parsed.enabled),
        scan: parsed.scan ?? true,
        meal: parsed.meal ?? true,
        hydration: parsed.hydration ?? true,
        routine: parsed.routine ?? true,
        routineHour: parsed.routineHour ?? 21,
        routineMinute: parsed.routineMinute ?? 0,
        uvCare: parsed.uvCare ?? true,
        bedtime: parsed.bedtime ?? true,
        weatherCare: parsed.weatherCare ?? true,
      };
    }
  } catch {}
  return {
    enabled: false,
    scan: true,
    meal: true,
    hydration: true,
    routine: true,
    routineHour: 21,
    routineMinute: 0,
    uvCare: true,
    bedtime: true,
    weatherCare: true,
  };
}

function saveAICareSettings(next: AICareSettings) {
  try { localStorage.setItem("fonday_ai_care_settings", JSON.stringify(next)); } catch {}
}

function getDiaryCauseTags(dateStr: string): DiaryCauseTag[] {
  try {
    const raw = JSON.parse(localStorage.getItem(`fonday_cause_tags_${dateStr}`) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .map((tag) => {
        if (typeof tag !== "string") return null;
        if (DIARY_CAUSE_TAGS.includes(tag as DiaryCauseTag)) return tag as DiaryCauseTag;
        return LEGACY_DIARY_CAUSE_TAG_MAP[tag] ?? null;
      })
      .filter((tag): tag is DiaryCauseTag => Boolean(tag));
  } catch { return []; }
}

function saveDiaryCauseTags(dateStr: string, tags: DiaryCauseTag[]) {
  try {
    if (tags.length > 0) localStorage.setItem(`fonday_cause_tags_${dateStr}`, JSON.stringify(tags));
    else localStorage.removeItem(`fonday_cause_tags_${dateStr}`);
  } catch {}
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}

function getCauseTagLabel(t: (key: string, options?: any) => string, tag: DiaryCauseTag) {
  return t(`modal.diary.causeTagOptions.${tag}`);
}

function suggestCauseTags(text: string): DiaryCauseTag[] {
  const normalized = text.toLowerCase();
  return DIARY_CAUSE_TAGS.filter((tag) => CAUSE_TAG_KEYWORDS[tag].some((keyword) => normalized.includes(keyword.toLowerCase())));
}

function getReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem("fonday_reminder_settings");
    if (raw) return JSON.parse(raw) as ReminderSettings;
  } catch {}
  const aiCare = getAICareSettings();
  return {
    enabled: aiCare.enabled && aiCare.routine,
    hour: aiCare.routineHour,
    minute: aiCare.routineMinute,
    lastNotifiedDate: "",
  };
}

function saveReminderSettings(next: ReminderSettings) {
  try { localStorage.setItem("fonday_reminder_settings", JSON.stringify(next)); } catch {}
  const aiCare = getAICareSettings();
  saveAICareSettings({
    ...aiCare,
    routine: next.enabled,
    routineHour: next.hour,
    routineMinute: next.minute,
  });
}

async function syncReminderToServer(next: ReminderSettings) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const aiCare = getAICareSettings();
    if (next.enabled && aiCare.enabled && aiCare.routine) {
      await fetch("/api/diary-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint, hour: next.hour, lang: localStorage.getItem("fonday_lang") || "ko" }),
      });
    } else {
      await fetch("/api/diary-reminder", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
  } catch {}
}

// ─── 루틴 Todo 유틸 ──────────────────────────────────────────────
interface TodoItem { text: string; done: boolean; }
function getDiaryTodos(dateStr: string): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(`fonday_todos_${dateStr}`) || "[]"); } catch { return []; }
}
function saveDiaryTodos(dateStr: string, todos: TodoItem[]) {
  try { localStorage.setItem(`fonday_todos_${dateStr}`, JSON.stringify(todos)); } catch {}
  window.dispatchEvent(new CustomEvent("fonday:diary-updated", { detail: { dateStr } }));
}
function getDiaryTodoProgress(dateStr: string) {
  const todos = getDiaryTodos(dateStr);
  return {
    total: todos.length,
    done: todos.filter((todo) => todo.done).length,
  };
}
function initDiaryTodosFromRoutine(dateStr: string, routine: string[]) {
  if (getDiaryTodos(dateStr).length === 0 && routine.length > 0) {
    saveDiaryTodos(dateStr, routine.map(text => ({ text, done: false })));
  }
}

function getRecentDateStrings(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - index * 86400000);
    return date.toISOString().slice(0, 10);
  }).reverse();
}

function extractMemoKeywords(memos: string[]): string[] {
  const stopwords = new Set(["오늘", "피부", "정도", "조금", "정말", "그냥", "그리고", "메모", "기록", "루틴"]);
  const counts = new Map<string, number>();
  memos.forEach((memo) => {
    memo
      .replace(/[^0-9A-Za-z가-힣\s]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !stopwords.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

function getWeeklyReport(entries: { dateStr: string; score: number }[], streakCount: number) {
  const last7DateStrings = getRecentDateStrings(7);
  const entryMap = new Map(entries.map((entry) => [entry.dateStr, entry]));
  const weeklyEntries = last7DateStrings
    .map((dateStr) => {
      const entry = entryMap.get(dateStr);
      const todos = getDiaryTodos(dateStr);
      const memo = getDiaryMemo(dateStr);
      const tags = getDiaryCauseTags(dateStr);
      return {
        dateStr,
        score: entry?.score ?? null,
        todos,
        memo,
        tags,
        completion: todos.length > 0 ? todos.filter((todo) => todo.done).length / todos.length : 0,
      };
    });

  const validScores = weeklyEntries.flatMap((entry) => entry.score === null ? [] : [entry.score]);
  const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
  const bestDay = weeklyEntries.filter((entry) => entry.score !== null).sort((a, b) => (b.score || 0) - (a.score || 0))[0] ?? null;
  const worstDay = weeklyEntries.filter((entry) => entry.score !== null).sort((a, b) => (a.score || 0) - (b.score || 0))[0] ?? null;
  const routineStats = new Map<string, { done: number; total: number }>();
  weeklyEntries.forEach((entry) => {
    entry.todos.forEach((todo) => {
      const stat = routineStats.get(todo.text) || { done: 0, total: 0 };
      stat.total += 1;
      if (todo.done) stat.done += 1;
      routineStats.set(todo.text, stat);
    });
  });
  const rankedRoutines = Array.from(routineStats.entries())
    .filter(([, stat]) => stat.total > 0)
    .map(([text, stat]) => ({ text, rate: stat.done / stat.total, done: stat.done, total: stat.total }))
    .sort((a, b) => b.rate - a.rate);
  const bestRoutine = rankedRoutines[0] ?? null;
  const worstRoutine = rankedRoutines[rankedRoutines.length - 1] ?? null;
  const memos = weeklyEntries.map((entry) => entry.memo).filter(Boolean);
  const keywordSummary = extractMemoKeywords(memos);
  const tagCounts = new Map<DiaryCauseTag, number>();
  weeklyEntries.forEach((entry) => entry.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
  const topCauseTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const incompleteDays = weeklyEntries.filter((entry) => entry.todos.length > 0 && entry.todos.some((todo) => !todo.done)).length;

  return {
    unlocked: streakCount >= 7,
    progress: Math.min(streakCount, 7),
    averageScore,
    bestDay,
    worstDay,
    bestRoutine,
    worstRoutine,
    keywordSummary,
    topCauseTags,
    incompleteDays,
    memoCount: memos.length,
  };
}

type ReportLang = "ko" | "en" | "ja";
type ReportConcernKey =
  | "hydration"
  | "redness"
  | "pores"
  | "pigmentation"
  | "elasticity"
  | "breakout"
  | "darkCircle"
  | "glow"
  | "texture";

function getReportLang(lang: string): ReportLang {
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("en")) return "en";
  return "ko";
}

const REPORT_COPY: Record<ReportLang, Record<string, string>> = {
  ko: {
    deck: "Skin Analysis Desk",
    title: "누적 피부 리포트",
    subtitle: "최근 스캔, 일기, 루틴 데이터를 합쳐 피부 전문가 노트처럼 정리했어요.",
    period: "분석 기간",
    scans: "누적 스캔",
    diary: "일기 메모",
    adherence: "루틴 이행",
    executive: "전문가 코멘트",
    priority: "우선 케어 과제",
    ingredients: "추천 성분 처방",
    procedures: "권장 시술 방향",
    routine: "루틴/생활 시그널",
    trendUp: "회복 흐름",
    trendFlat: "정체 구간",
    trendDown: "변동성 주의",
    trendUpDesc: "최근 평균 점수가 앞선 구간보다 개선됐습니다.",
    trendFlatDesc: "최근 점수가 비슷한 범위에서 유지되고 있습니다.",
    trendDownDesc: "최근 점수가 앞선 구간보다 내려가 원인 추적이 필요합니다.",
    routineStrong: "루틴 유지력이 안정적입니다.",
    routineWeak: "루틴 누락일이 보여 야간 회복 관리가 필요합니다.",
    notEnough: "데이터가 더 쌓이면 리포트 정확도가 올라갑니다.",
    scoreRisk: "리스크 {{value}}",
    avgRisk: "최근 평균",
    recommended: "권장",
    caution: "주의",
    procedureNote: "시술은 피부과/의료진 상담 후 피부 민감도와 생활 패턴에 맞춰 결정하세요.",
    routineGood: "잘 유지되는 루틴",
    routineWatch: "흔들리는 루틴",
    memoSignals: "메모 시그널",
    causeSignals: "원인 태그",
    cosmeticsSignal: "화장품 루틴 시그널",
    cosmeticsMissing: "등록 화장품이 적어 성분 루틴 인사이트는 초기 단계예요.",
    cosmeticsReady: "등록된 화장품 {{count}}개를 기준으로 루틴 밀도를 같이 봤어요.",
  },
  en: {
    deck: "Skin Analysis Desk",
    title: "Accumulated Skin Report",
    subtitle: "We combined scans, diary notes, and routine data into a clinician-style summary.",
    period: "Period",
    scans: "Total scans",
    diary: "Diary notes",
    adherence: "Routine adherence",
    executive: "Clinical summary",
    priority: "Priority concerns",
    ingredients: "Ingredient prescription",
    procedures: "Procedure direction",
    routine: "Routine & lifestyle signals",
    trendUp: "Recovery trend",
    trendFlat: "Stable range",
    trendDown: "Watch volatility",
    trendUpDesc: "Recent average scores improved versus the previous block.",
    trendFlatDesc: "Recent scores are holding in a similar range.",
    trendDownDesc: "Recent scores slipped versus the previous block and need review.",
    routineStrong: "Routine adherence looks stable.",
    routineWeak: "Skipped days suggest the evening recovery flow needs work.",
    notEnough: "This report sharpens as more data accumulates.",
    scoreRisk: "Risk {{value}}",
    avgRisk: "Recent mean",
    recommended: "Recommended",
    caution: "Caution",
    procedureNote: "Choose procedures only after consulting a licensed clinician and reviewing sensitivity.",
    routineGood: "Reliable routine",
    routineWatch: "Watch closely",
    memoSignals: "Memo signals",
    causeSignals: "Trigger tags",
    cosmeticsSignal: "Cosmetic routine signal",
    cosmeticsMissing: "There are not enough registered products yet for deep ingredient routine analysis.",
    cosmeticsReady: "Routine density was reviewed across {{count}} registered products.",
  },
  ja: {
    deck: "Skin Analysis Desk",
    title: "蓄積肌レポート",
    subtitle: "スキャン、日記、ルーティンデータをまとめて専門家ノートのように整理しました。",
    period: "分析期間",
    scans: "累積スキャン",
    diary: "日記メモ",
    adherence: "ルーティン実行",
    executive: "専門家コメント",
    priority: "優先ケア課題",
    ingredients: "推奨成分処方",
    procedures: "推奨施術の方向",
    routine: "ルーティン・生活シグナル",
    trendUp: "回復トレンド",
    trendFlat: "安定区間",
    trendDown: "変動に注意",
    trendUpDesc: "直近平均スコアは前の区間より改善しています。",
    trendFlatDesc: "最近のスコアは近い範囲で維持されています。",
    trendDownDesc: "直近スコアが前の区間より下がっており原因確認が必要です。",
    routineStrong: "ルーティン継続力は安定しています。",
    routineWeak: "未完了日があり夜の回復管理が必要です。",
    notEnough: "データが増えるほどレポート精度が上がります。",
    scoreRisk: "リスク {{value}}",
    avgRisk: "直近平均",
    recommended: "推奨",
    caution: "注意",
    procedureNote: "施術は皮膚科・医療者と相談し、敏感度と生活パターンを考慮して決めてください。",
    routineGood: "維持できているルーティン",
    routineWatch: "乱れやすいルーティン",
    memoSignals: "メモシグナル",
    causeSignals: "原因タグ",
    cosmeticsSignal: "コスメルーティンシグナル",
    cosmeticsMissing: "登録コスメが少なく、成分ルーティン分析はまだ初期段階です。",
    cosmeticsReady: "登録済みコスメ{{count}}件をもとにルーティン密度も確認しました。",
  },
};

const REPORT_CONCERNS: Array<{
  key: ReportConcernKey;
  label: string;
  risk: (score: number) => number;
  accent: string;
  titles: Record<ReportLang, string>;
  summaries: Record<ReportLang, string>;
  ingredients: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
  procedures: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
}> = [
  {
    key: "hydration",
    label: "수분 밸런스",
    risk: (score) => 100 - score,
    accent: "#3B82F6",
    titles: { ko: "수분-장벽 저하", en: "Hydration barrier dip", ja: "水分・バリア低下" },
    summaries: {
      ko: "수분이 떨어지는 날에 전체 점수 하락이 같이 나타나는 패턴입니다.",
      en: "Lower hydration is moving with wider score drops.",
      ja: "水分低下の日に全体スコア低下が重なる傾向です。",
    },
    ingredients: [
      { name: { ko: "히알루론산", en: "Hyaluronic acid", ja: "ヒアルロン酸" }, reason: { ko: "수분 저장력을 높여 각질 들뜸을 완화합니다.", en: "Supports water retention and reduces surface dryness.", ja: "水分保持を高めて乾燥感を和らげます。" } },
      { name: { ko: "세라마이드", en: "Ceramide", ja: "セラミド" }, reason: { ko: "피부 장벽 복구에 직접적인 축을 담당합니다.", en: "Directly supports barrier repair.", ja: "肌バリア修復を支えます。" } },
    ],
    procedures: [
      { name: { ko: "저자극 스킨부스터", en: "Low-irritation skin booster", ja: "低刺激スキンブースター" }, reason: { ko: "만성 건조와 장벽 저하 구간에서 수분 보강에 유리합니다.", en: "Useful when chronic dryness and barrier loss dominate.", ja: "慢性的な乾燥とバリア低下が続く時に向いています。" } },
    ],
  },
  {
    key: "redness",
    label: "붉은기 수준",
    risk: (score) => score,
    accent: "#EF4444",
    titles: { ko: "민감도 상승", en: "Redness reactivity", ja: "赤み反応性" },
    summaries: {
      ko: "자극 노출 후 붉은기 점수가 쉽게 오르는 민감 패턴입니다.",
      en: "Redness flares easily after likely irritation triggers.",
      ja: "刺激要因の後に赤みが上がりやすい敏感パターンです。",
    },
    ingredients: [
      { name: { ko: "판테놀", en: "Panthenol", ja: "パンテノール" }, reason: { ko: "열감과 민감 반응이 반복될 때 진정 축으로 좋습니다.", en: "Good anchor ingredient for repeated reactivity.", ja: "反応が続く時の鎮静軸として有効です。" } },
      { name: { ko: "센텔라", en: "Centella asiatica", ja: "ツボクサ" }, reason: { ko: "붉은기 완화와 장벽 회복을 동시에 보조합니다.", en: "Helps calm redness while supporting repair.", ja: "赤み緩和とバリア回復を助けます。" } },
    ],
    procedures: [
      { name: { ko: "LED 진정 케어", en: "LED calming care", ja: "LED鎮静ケア" }, reason: { ko: "민감기에는 강한 시술보다 열 자극이 적은 관리가 적합합니다.", en: "Lower-heat calming care is often safer than aggressive procedures.", ja: "敏感期は強い施術より低刺激ケアが向いています。" } },
    ],
  },
  {
    key: "pores",
    label: "모공 상태",
    risk: (score) => 100 - score,
    accent: "#F59E0B",
    titles: { ko: "유분-모공 부담", en: "Sebum-pore load", ja: "皮脂・毛穴負担" },
    summaries: {
      ko: "유분 관리가 흔들릴 때 모공 점수가 빠르게 떨어지는 흐름입니다.",
      en: "Pore condition softens quickly when oil control slips.",
      ja: "皮脂管理が乱れると毛穴状態が下がりやすい流れです。",
    },
    ingredients: [
      { name: { ko: "나이아신아마이드", en: "Niacinamide", ja: "ナイアシンアミド" }, reason: { ko: "피지와 결을 함께 관리하기 좋은 다목적 성분입니다.", en: "A multipurpose ingredient for oil balance and texture.", ja: "皮脂とキメを同時に見やすい多機能成分です。" } },
      { name: { ko: "BHA", en: "BHA", ja: "BHA" }, reason: { ko: "모공 내부 각질과 피지 축적 관리에 적합합니다.", en: "Useful for pore congestion and oil build-up.", ja: "毛穴内の角質・皮脂ケアに向いています。" } },
    ],
    procedures: [
      { name: { ko: "아쿠아필 계열", en: "Hydro / aqua peel", ja: "アクアピーリング系" }, reason: { ko: "막힌 모공과 표면 피지 정리에 직관적인 선택지입니다.", en: "A direct option for congestion and surface oil control.", ja: "詰まり毛穴と表面皮脂の整理に向いています。" } },
    ],
  },
  {
    key: "pigmentation",
    label: "잡티/색소침착",
    risk: (score) => score,
    accent: "#8B5CF6",
    titles: { ko: "색소 흔적 누적", en: "Pigment retention", ja: "色素残存" },
    summaries: {
      ko: "자외선·염증 후 색소가 오래 남는 경향이 보입니다.",
      en: "Pigment marks appear to linger after UV or inflammation exposure.",
      ja: "紫外線や炎症後の色素が残りやすい傾向です。",
    },
    ingredients: [
      { name: { ko: "비타민C", en: "Vitamin C", ja: "ビタミンC" }, reason: { ko: "톤 보정과 항산화 관리의 기본축입니다.", en: "Core ingredient for tone support and antioxidant care.", ja: "トーン補正と抗酸化ケアの軸になります。" } },
      { name: { ko: "트라넥사믹 애씨드", en: "Tranexamic acid", ja: "トラネキサム酸" }, reason: { ko: "반복되는 색소 흔적 관리에 유용합니다.", en: "Useful when pigment marks recur.", ja: "色素痕が繰り返す時に有用です。" } },
    ],
    procedures: [
      { name: { ko: "토닝 레이저 상담", en: "Laser toning consult", ja: "トーニングレーザー相談" }, reason: { ko: "색소가 누적될 때 시술 적합도 검토 가치가 있습니다.", en: "Worth evaluating when pigmentation continues to accumulate.", ja: "色素蓄積が続く時は適応確認の価値があります。" } },
    ],
  },
  {
    key: "elasticity",
    label: "주름 및 탄력",
    risk: (score) => 100 - score,
    accent: "#14B8A6",
    titles: { ko: "탄력 저하 신호", en: "Elasticity decline", ja: "弾力低下サイン" },
    summaries: {
      ko: "건조와 피로 누적 구간에서 탄력 점수가 눌리는 흐름입니다.",
      en: "Elasticity softens when dryness and fatigue stack together.",
      ja: "乾燥や疲労が重なる時に弾力スコアが落ちやすいです。",
    },
    ingredients: [
      { name: { ko: "레티놀", en: "Retinol", ja: "レチノール" }, reason: { ko: "탄력 저하 관리의 대표 성분입니다.", en: "A classic ingredient for firmness management.", ja: "弾力ケアの代表成分です。" } },
      { name: { ko: "펩타이드", en: "Peptides", ja: "ペプチド" }, reason: { ko: "자극을 낮추면서 탄력 루틴을 보강하기 좋습니다.", en: "Useful for adding firmness support with lower irritation.", ja: "比較的やさしく弾力ケアを補強できます。" } },
    ],
    procedures: [
      { name: { ko: "고주파 탄력 관리", en: "RF tightening consult", ja: "高周波たるみ相談" }, reason: { ko: "탄력 축이 지속적으로 낮다면 검토 가능한 방향입니다.", en: "A reasonable direction when elasticity continues to trend down.", ja: "弾力低下が続くなら検討しやすい方向です。" } },
    ],
  },
  {
    key: "breakout",
    label: "트러블 위험",
    risk: (score) => 100 - score,
    accent: "#EC4899",
    titles: { ko: "트러블 재발성", en: "Breakout recurrence", ja: "トラブル再発性" },
    summaries: {
      ko: "생활 패턴 변화에 따라 트러블 위험도가 흔들리는 흐름입니다.",
      en: "Breakout risk appears sensitive to routine and lifestyle disruption.",
      ja: "生活リズムの乱れでトラブルリスクが動きやすい流れです。",
    },
    ingredients: [
      { name: { ko: "아젤라익 애씨드", en: "Azelaic acid", ja: "アゼライン酸" }, reason: { ko: "트러블과 붉은 흔적을 함께 보기에 좋습니다.", en: "Useful for both breakouts and post-redness marks.", ja: "トラブルと赤み跡を一緒に見やすい成分です。" } },
      { name: { ko: "징크 PCA", en: "Zinc PCA", ja: "ジンクPCA" }, reason: { ko: "피지 균형과 번들거림 완화에 유리합니다.", en: "Supports oil balance and shine control.", ja: "皮脂バランスとテカリ管理に向いています。" } },
    ],
    procedures: [
      { name: { ko: "블루/레드 LED 관리", en: "Blue / red LED care", ja: "ブルー/レッドLEDケア" }, reason: { ko: "반복성 트러블 구간에서 저자극 보조 옵션이 됩니다.", en: "A gentle support option for recurrent breakouts.", ja: "再発しやすいトラブルの補助選択肢になります。" } },
    ],
  },
  {
    key: "darkCircle",
    label: "다크서클",
    risk: (score) => score,
    accent: "#6366F1",
    titles: { ko: "눈가 피로 누적", en: "Under-eye fatigue", ja: "目元疲労" },
    summaries: {
      ko: "수면/피로 변수에 따라 눈가 컨디션이 흔들리는 모습입니다.",
      en: "Under-eye condition appears responsive to fatigue and sleep load.",
      ja: "睡眠や疲労により目元状態が揺れやすいようです。",
    },
    ingredients: [
      { name: { ko: "카페인", en: "Caffeine", ja: "カフェイン" }, reason: { ko: "부기와 눈가 컨디션 관리에 보조적입니다.", en: "Helpful as a support ingredient for puffiness and under-eye tone.", ja: "むくみと目元コンディション管理の補助になります。" } },
      { name: { ko: "비타민K", en: "Vitamin K", ja: "ビタミンK" }, reason: { ko: "눈가 톤 관리 루틴에 자주 쓰이는 축입니다.", en: "Often used in targeted under-eye tone routines.", ja: "目元トーンケアで使われやすい軸です。" } },
    ],
    procedures: [
      { name: { ko: "눈가 순환 관리", en: "Under-eye circulation care", ja: "目元循環ケア" }, reason: { ko: "피로형 다크서클이면 생활 패턴 교정과 함께 검토할 수 있습니다.", en: "Can be considered alongside sleep and fatigue correction.", ja: "疲労型なら生活改善と一緒に検討できます。" } },
    ],
  },
];

function parseIngredientTokens(raw?: string) {
  if (!raw) return [];
  return raw
    .split(/[\n,\/]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 8);
}

function getSeasonLabel(lang: ReportLang) {
  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  const labels = {
    ko: { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" },
    en: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    ja: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
  };
  return labels[lang][season];
}

function getRecoveryGuide(lang: ReportLang, procedureNames: string[]) {
  const hasLaser = procedureNames.some((name) => /laser|레이저|レーザー|toning|토닝/i.test(name));
  const hasPeel = procedureNames.some((name) => /peel|필|필링|ピー/i.test(name));
  const hasTightening = procedureNames.some((name) => /rf|tight|고주파|弾力|たるみ/i.test(name));

  if (lang === "en") {
    return [
      hasLaser ? "Avoid retinoids, exfoliating acids, and scrubs for 3-5 days after laser-based sessions." : "Pause strong actives for 2-3 days after any intensive treatment.",
      hasPeel ? "Use bland barrier care and strict SPF after peeling-focused sessions." : "Keep the routine simple with cleanser, moisturizer, and SPF.",
      hasTightening ? "Watch for transient dryness and layer hydration before adding new actives." : "Reintroduce stronger actives only after visible irritation settles.",
    ];
  }
  if (lang === "ja") {
    return [
      hasLaser ? "レーザー系施術後3〜5日はレチノール・角質ケア・スクラブを避けてください。" : "刺激の強い施術後は2〜3日ほど強いアクティブを休んでください。",
      hasPeel ? "ピーリング後はバリア保湿とUV防御を最優先にしてください。" : "クレンザー・保湿・UV中心のシンプルケアが安全です。",
      hasTightening ? "高周波後は一時的な乾燥を見やすいので保湿を厚めにしてください。" : "赤みや刺激が落ち着いてから強い成分を戻してください。",
    ];
  }
  return [
    hasLaser ? "레이저 계열 시술 후 3~5일은 레티놀, 각질 케어, 스크럽을 쉬는 편이 안전합니다." : "강한 시술 직후 2~3일은 고함량 액티브를 쉬어 주세요.",
    hasPeel ? "필링 계열 후에는 장벽 보습과 자외선 차단을 최우선으로 두세요." : "클렌저-보습제-SPF 중심의 단순 루틴이 회복에 유리합니다.",
    hasTightening ? "고주파/탄력 관리 후에는 일시적 건조가 올 수 있어 수분 레이어링이 필요합니다." : "열감이나 따가움이 가라앉은 뒤에만 강한 성분을 재투입하세요.",
  ];
}

function buildDiaryReportModel({
  history,
  analysisResult,
  overallScore,
  finalType,
  weeklyReport,
  myCosmetics,
  t,
  lang,
}: {
  history: any[];
  analysisResult: AnalysisResult | null;
  overallScore: number;
  finalType: string;
  weeklyReport: ReturnType<typeof getWeeklyReport>;
  myCosmetics: CosmeticItem[];
  t: (key: string, options?: any) => string;
  lang: ReportLang;
}) {
  const copy = REPORT_COPY[lang];
  const today = todayStr();
  const snapshots = [
    ...(analysisResult ? [{
      createdAt: new Date().toISOString(),
      overallScore,
      skinAge: analysisResult.skinAge ?? null,
      baumannType: finalType,
      scores: analysisResult.scores ?? [],
    }] : []),
    ...history,
  ].filter((scan, index, arr) => {
    const date = new Date(scan.createdAt).toISOString().slice(0, 10);
    return arr.findIndex((candidate) => new Date(candidate.createdAt).toISOString().slice(0, 10) === date) === index;
  });

  const concernRows = REPORT_CONCERNS.map((concern) => {
    const risks = snapshots.flatMap((scan) => {
      const matched = (scan.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return [];
      return [concern.risk(Number(matched.score))];
    });
    const recentBlock = risks.slice(0, 3);
    const prevBlock = risks.slice(3, 6);
    const avgRisk = risks.length > 0 ? Math.round(risks.reduce((sum, value) => sum + value, 0) / risks.length) : 0;
    const recentAvg = recentBlock.length > 0 ? recentBlock.reduce((sum, value) => sum + value, 0) / recentBlock.length : avgRisk;
    const prevAvg = prevBlock.length > 0 ? prevBlock.reduce((sum, value) => sum + value, 0) / prevBlock.length : recentAvg;
    return {
      ...concern,
      avgRisk,
      delta: Math.round(recentAvg - prevAvg),
    };
  }).sort((a, b) => b.avgRisk - a.avgRisk);

  const focusConcerns = concernRows.slice(0, 3);
  const ingredientPlan = focusConcerns
    .flatMap((concern) => concern.ingredients.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 4);
  const procedurePlan = focusConcerns
    .flatMap((concern) => concern.procedures.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 3);
  const recentOverall = snapshots.slice(0, 3).map((scan) => Number(scan.overallScore) || 0);
  const previousOverall = snapshots.slice(3, 6).map((scan) => Number(scan.overallScore) || 0);
  const recentMean = recentOverall.length > 0 ? recentOverall.reduce((sum, value) => sum + value, 0) / recentOverall.length : overallScore;
  const previousMean = previousOverall.length > 0 ? previousOverall.reduce((sum, value) => sum + value, 0) / previousOverall.length : recentMean;
  const scoreByDate = new Map(
    snapshots.map((scan) => [new Date(scan.createdAt).toISOString().slice(0, 10), Number(scan.overallScore) || 0]),
  );
  const triggerSignals = DIARY_CAUSE_TAGS.map((tag) => {
    const taggedDates = Array.from(scoreByDate.keys()).filter((dateStr) => getDiaryCauseTags(dateStr).includes(tag));
    const taggedScores = taggedDates.map((dateStr) => scoreByDate.get(dateStr) || 0).filter((score) => score > 0);
    const baselineScores = Array.from(scoreByDate.entries())
      .filter(([dateStr]) => !taggedDates.includes(dateStr))
      .map(([, score]) => score)
      .filter((score) => score > 0);
    const taggedAvg = taggedScores.length > 0 ? taggedScores.reduce((sum, score) => sum + score, 0) / taggedScores.length : 0;
    const baselineAvg = baselineScores.length > 0 ? baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length : recentMean;
    return {
      tag,
      label: getCauseTagLabel(t, tag),
      diff: taggedScores.length > 0 ? Math.round(taggedAvg - baselineAvg) : 0,
      count: taggedScores.length,
    };
  })
    .filter((item) => item.count > 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  const ingredientSignals = (() => {
    const signalMap = new Map<string, { deltaSum: number; count: number }>();
    myCosmetics.forEach((item) => {
      const openedAt = item.opened_at ? new Date(item.opened_at) : null;
      if (!openedAt || Number.isNaN(openedAt.getTime())) return;
      const before = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() < openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      const after = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() >= openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      if (before.length === 0 || after.length === 0) return;
      const delta = after.reduce((sum, score) => sum + score, 0) / after.length
        - before.reduce((sum, score) => sum + score, 0) / before.length;
      parseIngredientTokens(item.ingredients).forEach((ingredient) => {
        const stat = signalMap.get(ingredient) || { deltaSum: 0, count: 0 };
        stat.deltaSum += delta;
        stat.count += 1;
        signalMap.set(ingredient, stat);
      });
    });
    return Array.from(signalMap.entries())
      .map(([ingredient, stat]) => ({ ingredient, delta: Math.round(stat.deltaSum / stat.count), count: stat.count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.delta - a.delta);
  })();

  const radarData = REPORT_CONCERNS.slice(0, 6).map((concern) => {
    const currentScore = (() => {
      const current = snapshots[0];
      const matched = (current?.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return 50;
      return 100 - concern.risk(Number(matched.score));
    })();
    const averageScore = (() => {
      const values = snapshots.flatMap((scan) => {
        const matched = (scan?.scores || []).find((item: any) => item?.label === concern.label);
        if (!matched || !Number.isFinite(Number(matched.score))) return [];
        return [100 - concern.risk(Number(matched.score))];
      });
      return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : currentScore;
    })();
    return {
      subject: concern.titles[lang],
      current: currentScore,
      average: averageScore,
    };
  });

  const seasonGuide = (() => {
    const season = getSeasonLabel(lang);
    const keyConcern = focusConcerns[0]?.key;
    if (lang === "en") {
      if (keyConcern === "hydration") return `${season} dryness likely amplifies barrier fatigue. Keep a heavier PM moisturizer than usual.`;
      if (keyConcern === "pigmentation") return `${season} UV exposure can prolong pigment retention. Keep daily antioxidant + SPF habits tight.`;
      return `${season} environment shifts can widen score volatility. Keep the routine stable when symptoms flare.`;
    }
    if (lang === "ja") {
      if (keyConcern === "hydration") return `${season}の乾燥でバリア疲労が強まりやすいです。夜は保湿量を少し厚めにしてください。`;
      if (keyConcern === "pigmentation") return `${season}の紫外線で色素残存が長引きやすいです。抗酸化ケアとSPFを厳守してください。`;
      return `${season}の環境変化でスコア変動が広がりやすいです。症状が揺れる時ほどルーティンを固定してください。`;
    }
    if (keyConcern === "hydration") return `${season} 건조 환경이 장벽 피로를 키우는 시기입니다. 야간 보습량을 평소보다 두텁게 가져가세요.`;
    if (keyConcern === "pigmentation") return `${season} 자외선 노출이 색소 흔적을 오래 끌 수 있습니다. 항산화 케어와 SPF 루틴을 더 엄격하게 유지하세요.`;
    return `${season} 환경 변수로 점수 변동폭이 커질 수 있는 시기입니다. 흔들릴수록 루틴을 단순하게 고정하는 편이 좋습니다.`;
  })();

  const forecast = (() => {
    const base = Math.round(recentMean || overallScore || 60);
    const routineBoost = weeklyReport.incompleteDays <= 1 ? 4 : 1;
    const concernPenalty = Math.round((focusConcerns[0]?.avgRisk || 40) / 18);
    const week1 = Math.max(45, Math.min(95, base + routineBoost - concernPenalty));
    const week2 = Math.max(45, Math.min(95, week1 + 3));
    if (lang === "en") {
      return {
        week1,
        week2,
        note: `If the current routine is kept stable, the next two weeks could recover toward ${week2} with the biggest lift coming from ${focusConcerns[0]?.titles.en || "barrier care"}.`,
      };
    }
    if (lang === "ja") {
      return {
        week1,
        week2,
        note: `現在のルーティンを安定して維持できれば、今後2週間で${week2}前後まで回復する余地があります。最優先は${focusConcerns[0]?.titles.ja || "バリアケア"}です。`,
      };
    }
    return {
      week1,
      week2,
      note: `지금 루틴을 안정적으로 유지하면 향후 2주 안에 ${week2}점 전후까지 회복할 여지가 있습니다. 가장 큰 개선 축은 ${focusConcerns[0]?.titles.ko || "장벽 케어"}입니다.`,
    };
  })();

  const topCauseTags = weeklyReport.topCauseTags.slice(0, 3).map(([tag, count]) => `${getCauseTagLabel(t, tag)} ${count}`);
  const periodEnd = snapshots.length > 0 ? new Date(snapshots[0].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const periodStart = snapshots.length > 0 ? new Date(snapshots[snapshots.length - 1].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const trendDelta = Math.round(recentMean - previousMean);
  const trendKey = trendDelta >= 3 ? "trendUp" : trendDelta <= -3 ? "trendDown" : "trendFlat";
  const executiveSummary = lang === "ko"
    ? `최근 ${snapshots.length}회 스캔과 최근 7일 일기 데이터를 종합하면 ${focusConcerns[0]?.titles.ko || "기초 컨디션"} 축의 부담이 가장 큽니다. ${focusConcerns[1]?.titles.ko || "생활 패턴"}와 ${focusConcerns[2]?.titles.ko || "루틴 안정성"}도 보조 이슈로 보여, 단기 진정만보다 장벽/색소/유분 관리의 우선순위를 분리해 접근하는 편이 좋습니다.`
    : lang === "ja"
      ? `直近${snapshots.length}回のスキャンと7日分の日記を総合すると、最優先課題は${focusConcerns[0]?.titles.ja || "基礎コンディション"}です。${focusConcerns[1]?.titles.ja || "生活パターン"}と${focusConcerns[2]?.titles.ja || "ルーティン安定性"}も補助課題として見えるため、単発ケアより優先順位を分けた管理が有効です。`
      : `Across ${snapshots.length} recent scans and the last 7 days of diary data, the highest burden is on ${focusConcerns[0]?.titles.en || "baseline condition"}. ${focusConcerns[1]?.titles.en || "lifestyle pattern"} and ${focusConcerns[2]?.titles.en || "routine stability"} are secondary drivers, so a prioritized plan will work better than one-off fixes.`;

  return {
    copy,
    periodLabel: `${periodStart} - ${periodEnd}`,
    scanCount: snapshots.length,
    memoCount: weeklyReport.memoCount,
    adherence: weeklyReport.incompleteDays === 0 ? "92%" : `${Math.max(48, 100 - weeklyReport.incompleteDays * 12)}%`,
    trendKey,
    trendDesc: copy[`${trendKey}Desc`],
    routineDesc: weeklyReport.incompleteDays <= 1 ? copy.routineStrong : copy.routineWeak,
    executiveSummary,
    focusConcerns,
    ingredientPlan,
    procedurePlan,
    topCauseTags,
    triggerSignals,
    keywordSummary: weeklyReport.keywordSummary,
    routineHighlights: {
      strong: weeklyReport.bestRoutine?.text || copy.notEnough,
      watch: weeklyReport.worstRoutine?.text || copy.notEnough,
    },
    ingredientSignals,
    recoveryGuide: getRecoveryGuide(lang, procedurePlan.map((item) => item.name)),
    radarData,
    seasonGuide,
    forecast,
    cosmeticsSignal: myCosmetics.length > 0
      ? copy.cosmeticsReady.replace("{{count}}", String(myCosmetics.length))
      : copy.cosmeticsMissing,
  };
}

function daysSinceDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function buildCosmeticsInsights(
  cosmetics: CosmeticItem[],
  overallScore: number,
  previousScore: number | null,
  t: (key: string, options?: any) => string,
) {
  if (cosmetics.length === 0) return [];

  const insights: { id: string; title: string; desc: string; accent: string }[] = [];
  const categories = new Set(cosmetics.map((item) => item.category));
  const amCount = cosmetics.filter((item) => item.time_of_day === "am" || item.time_of_day === "both").length;
  const pmCount = cosmetics.filter((item) => item.time_of_day === "pm" || item.time_of_day === "both").length;
  const recent = cosmetics
    .map((item) => ({ item, days: daysSinceDate(item.opened_at) }))
    .filter((entry): entry is { item: CosmeticItem; days: number } => entry.days !== null)
    .sort((a, b) => a.days - b.days)[0];

  if (recent && recent.days <= 14) {
    insights.push({
      id: "recent",
      title: t("cosmetics.insightRecentTitle"),
      desc: t("cosmetics.insightRecentDesc", { name: recent.item.name, days: recent.days + 1 }),
      accent: "#C97062",
    });
  }

  if (!categories.has("선크림")) {
    insights.push({
      id: "sunscreen",
      title: t("cosmetics.insightSunscreenTitle"),
      desc: t("cosmetics.insightSunscreenDesc"),
      accent: "#D97706",
    });
  }

  if (pmCount === 0 || pmCount < Math.max(1, Math.ceil(amCount / 2))) {
    insights.push({
      id: "pm-balance",
      title: t("cosmetics.insightBalanceTitle"),
      desc: t("cosmetics.insightBalanceDesc", { am: amCount, pm: pmCount }),
      accent: DEEP_GREEN,
    });
  }

  if (previousScore !== null && previousScore > 0) {
    const delta = overallScore - previousScore;
    if (delta >= 5) {
      insights.push({
        id: "score-up",
        title: t("cosmetics.insightScoreUpTitle"),
        desc: t("cosmetics.insightScoreUpDesc", { delta }),
        accent: "#059669",
      });
    } else if (delta <= -5) {
      insights.push({
        id: "score-down",
        title: t("cosmetics.insightScoreDownTitle"),
        desc: t("cosmetics.insightScoreDownDesc", { delta: Math.abs(delta) }),
        accent: "#DC2626",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "coverage",
      title: t("cosmetics.insightCoverageTitle"),
      desc: t("cosmetics.insightCoverageDesc", { count: cosmetics.length }),
      accent: SCAN_TO,
    });
  }

  return insights.slice(0, 3);
}

const CATEGORY_ORDER = ["클렌저", "토너", "세럼", "진정케어", "각질케어", "아이크림", "장벽케어", "크림", "선크림"];
const CATEGORY_DEFAULT_TIME: Record<string, ("am" | "pm")[]> = {
  "클렌저": ["am", "pm"],
  "토너": ["am", "pm"],
  "세럼": ["am", "pm"],
  "진정케어": ["pm"],
  "각질케어": ["pm"],
  "아이크림": ["pm"],
  "장벽케어": ["pm"],
  "크림": ["pm"],
  "선크림": ["am"],
};

function sortCosmeticsForRoutine(items: CosmeticItem[]) {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.category);
    const bIndex = CATEGORY_ORDER.indexOf(b.category);
    const normalizedA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
    const normalizedB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;
    return normalizedA - normalizedB;
  });
}

function inferCosmeticTimeOfDay(category: string): "am" | "pm" {
  const defaultTimes = CATEGORY_DEFAULT_TIME[category] || ["pm"];
  return defaultTimes[0] || "pm";
}

function buildRoutineGuide(cosmetics: CosmeticItem[], t: (key: string, options?: any) => string) {
  const shouldIncludeInTime = (item: CosmeticItem, period: "am" | "pm") => {
    if (item.time_of_day === "am" || item.time_of_day === "pm") return item.time_of_day === period;
    const defaults = CATEGORY_DEFAULT_TIME[item.category] || ["pm"];
    return defaults.includes(period);
  };
  const am = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "am")));
  const pm = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "pm")));
  const categories = cosmetics.map((item) => item.category);
  const categoryCount = new Map<string, number>();
  categories.forEach((category) => categoryCount.set(category, (categoryCount.get(category) || 0) + 1));
  const uniqueAmSteps = Array.from(new Set(am.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));
  const uniquePmSteps = Array.from(new Set(pm.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));

  const goodMixes: string[] = [];
  const cautions: string[] = [];

  if (categories.includes("진정케어") && categories.includes("장벽케어")) {
    goodMixes.push(t("cosmetics.goodComboBarrier"));
  }
  if (categories.includes("세럼") && categories.includes("크림")) {
    goodMixes.push(t("cosmetics.goodComboLayering"));
  }
  if (categories.includes("선크림")) {
    goodMixes.push(t("cosmetics.goodComboSunscreen"));
  }

  const exfoliatorCount = categoryCount.get("각질케어") || 0;
  if (exfoliatorCount >= 2) {
    cautions.push(t("cosmetics.cautionOverExfoliate"));
  }
  if (cosmetics.some((item) => item.category === "각질케어" && (item.time_of_day === "am" || item.time_of_day === "both"))) {
    cautions.push(t("cosmetics.cautionMorningExfoliate"));
  }
  if ((categoryCount.get("세럼") || 0) >= 3) {
    cautions.push(t("cosmetics.cautionTooManySerums"));
  }
  if (!categories.includes("장벽케어") && !categories.includes("진정케어")) {
    cautions.push(t("cosmetics.cautionRecoveryGap"));
  }

  return {
    am,
    pm,
    amSteps: uniqueAmSteps,
    pmSteps: uniquePmSteps,
    goodMixes: goodMixes.slice(0, 3),
    cautions: cautions.slice(0, 3),
  };
}

// ─── 인라인 루틴 Todo ────────────────────────────────────────────
function InlineTodos({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(() => getDiaryTodos(dateStr));
  if (todos.length === 0) return null;
  const doneCount = todos.filter(td => td.done).length;
  const toggle = (i: number) => {
    const next = todos.map((td, idx) => idx === i ? { ...td, done: !td.done } : td);
    setTodos(next);
    saveDiaryTodos(dateStr, next);
  };
  return (
    <div className="mb-3 pb-3 border-b border-[#F0EDE8]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-stone-500">📋 {t("diary.routineTitle")}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: doneCount === todos.length ? "#ECFDF5" : "#F9F9F9",
            color: doneCount === todos.length ? "#059669" : "#B0A898" }}>
          {doneCount}/{todos.length}
        </span>
      </div>
      <div className="space-y-2">
        {todos.map((todo, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex items-center gap-2.5 w-full text-left">
            <div className={`w-4 h-4 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all
              ${todo.done ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"}`}>
              {todo.done && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-[12px] leading-snug transition-colors
              ${todo.done ? "line-through text-stone-300" : "text-stone-600"}`}>
              {todo.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 인라인 메모 ─────────────────────────────────────────────────
function InlineMemo({ dateStr }: { dateStr: string }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(() => getDiaryMemo(dateStr));
  const [tags, setTags] = useState<DiaryCauseTag[]>(() => getDiaryCauseTags(dateStr));

  const handleSave = () => {
    saveDiaryMemo(dateStr, text);
    saveDiaryCauseTags(dateStr, tags);
    setEditing(false);
  };

  if (editing) {
    const autoSuggestions = suggestCauseTags(text).filter((tag) => !tags.includes(tag));
    return (
      <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
        <textarea
          className="w-full text-[12px] text-stone-600 bg-[#FAF9F7] rounded-xl p-2.5 resize-none outline-none border border-[#F0EDE8] focus:border-[#E09882] transition-colors"
          rows={3} maxLength={100}
          placeholder={t("modal.diary.memoPlaceholder")}
          value={text} onChange={e => setText(e.target.value)} autoFocus
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {DIARY_CAUSE_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setTags((prev) => selected ? prev.filter((item) => item !== tag) : [...prev, tag])}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors"
                style={selected
                  ? { background: `${SCAN_FROM}20`, color: SCAN_TO, border: `1px solid ${SCAN_FROM}55` }
                  : { background: "#F6F3EE", color: "#9A8F80", border: "1px solid #ECE4DC" }}
              >
                {getCauseTagLabel(t, tag)}
              </button>
            );
          })}
        </div>
        {autoSuggestions.length > 0 && (
          <div className="mt-2 rounded-xl px-3 py-2" style={{ background: "#F6F3EE" }}>
            <p className="text-[10px] font-bold text-stone-400 mb-1">{t("modal.diary.autoTag")}</p>
            <div className="flex flex-wrap gap-1.5">
              {autoSuggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTags((prev) => [...prev, tag])}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: "#FFFFFF", color: SCAN_TO, border: `1px solid ${SCAN_FROM}40` }}
                >
                  + {getCauseTagLabel(t, tag)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-stone-300">{t("modal.diary.memoChars", { n: text.length })}</span>
          <div className="flex gap-2">
            <button onClick={() => { setText(getDiaryMemo(dateStr)); setTags(getDiaryCauseTags(dateStr)); setEditing(false); }}
              className="text-[11px] text-stone-400 px-2 py-1">{t("modal.diary.memoCancel")}</button>
            <button onClick={handleSave}
              className="text-[11px] font-bold px-3 py-1 rounded-lg text-white"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
              {t("modal.diary.memoSave")}
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (text) {
    return (
      <div className="mt-3 pt-3 border-t border-[#F0EDE8] flex gap-2 cursor-pointer" onClick={() => setEditing(true)}>
        <span className="text-sm shrink-0">📝</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-stone-500 leading-relaxed">{text}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "#F6F3EE", color: "#9A8F80" }}>
                  {getCauseTagLabel(t, tag)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 pt-3 border-t border-[#F0EDE8]">
      <button onClick={() => setEditing(true)}
        className="text-[11px] text-stone-300 font-medium hover:text-stone-400 transition-colors">
        {t("modal.diary.memoAdd")}
      </button>
    </div>
  );
}

function DiaryRoutinePreviewCard({ routineGuide, dateStr }: { routineGuide: ReturnType<typeof buildRoutineGuide>; dateStr: string }) {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<TodoItem[]>(() => getDiaryTodos(dateStr));

  useEffect(() => {
    setTodos(getDiaryTodos(dateStr));
  }, [dateStr]);

  const isSectionComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return false;
    return items.every((item) => {
      const prefixed = `${period} · ${item}`;
      return todos.some((todo) => (todo.text === prefixed || todo.text === item) && todo.done);
    });
  };

  const setSectionComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return;
    const shouldComplete = !isSectionComplete(period, items);
    const next = [...todos];
    items.forEach((item) => {
      const prefixed = `${period} · ${item}`;
      const index = next.findIndex((todo) => todo.text === prefixed || todo.text === item);
      if (index >= 0) {
        next[index] = { ...next[index], text: prefixed, done: shouldComplete };
      } else {
        next.push({ text: prefixed, done: shouldComplete });
      }
    });
    setTodos(next);
    saveDiaryTodos(dateStr, next);
  };

  const sections = [
    {
      key: "am",
      title: t("result.actionCard.phaseMorning"),
      icon: Sun,
      accent: DEEP_GREEN,
      bg: "#F7FBFA",
      border: "#DDECE7",
      items: routineGuide.amSteps,
      period: "AM" as const,
    },
    {
      key: "pm",
      title: t("result.actionCard.phaseEvening"),
      icon: Moon,
      accent: SCAN_TO,
      bg: "#FFF8F4",
      border: "#F1DED7",
      items: routineGuide.pmSteps,
      period: "PM" as const,
    },
  ];

  return (
    <div className="px-5 pt-4">
      <div className="rounded-[28px] border bg-white shadow-sm" style={{ borderColor: "#F0E6E0" }}>
        <div className="p-5">
          <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("diary.routineTitle")}</p>
          <p className="text-[16px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.todayRoutineTitle")}</p>
          <p className="text-[11px] text-stone-500 mt-1">{t("modal.diary.todayRoutineDesc")}</p>
          <div className="grid gap-3 mt-4 md:grid-cols-2">
            {sections.map(({ key, title, icon: Icon, accent, bg, border, items, period }) => {
              const completed = isSectionComplete(period, items);
              return (
              <div key={key} className="rounded-[24px] p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[14px] font-black" style={{ color: DEEP_GREEN }}>{title}</p>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                {items.length > 0 ? (
                  <>
                    <p className="text-[11px] font-bold leading-relaxed text-kr-pretty" style={{ color: accent }}>
                      {items.join(" → ")}
                    </p>
                    <button
                      onClick={() => setSectionComplete(period, items)}
                      className="mt-3 w-full rounded-2xl bg-white border px-3.5 py-3 flex items-center justify-between gap-3"
                      style={{ borderColor: `${accent}20` }}
                    >
                      <p className="text-[12px] font-black" style={{ color: accent }}>{title} 완료</p>
                      <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                        completed ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                      }`}>
                        {completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  </>
                ) : (
                  <p className="text-[11px] text-stone-400">{t("modal.diary.todayRoutineEmpty")}</p>
                )}
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 다이어리 달력 뷰 ────────────────────────────────────────────
function DiaryCalendarView({ allEntries }: { allEntries: { dateStr: string; score: number }[] }) {
  const { t, i18n } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<{ dateStr: string; score: number } | null>(() => {
    const todayEntry = allEntries.find((entry) => entry.dateStr === todayStr());
    return todayEntry ?? null;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const scoreMap = new Map(allEntries.map(e => [e.dateStr, e.score]));

  const getScoreColor = (score: number) =>
    score >= 90 ? SCAN_TO : score >= 75 ? SCAN_FROM : score >= 60 ? "#F5C5B8" : "#FAE0DA";
  const getTextColor = (score: number) => score >= 75 ? "#fff" : SCAN_TO;

  const monthLabel = i18n.language === "ko"
    ? `${year}년 ${month + 1}월`
    : i18n.language === "ja"
    ? `${year}年${month + 1}月`
    : new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdayLabels = i18n.language === "ko"
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : i18n.language === "ja"
    ? ["日", "月", "火", "水", "木", "金", "土"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="px-5 pb-8 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#F0EDE8] text-stone-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[14px] font-black" style={{ color: DEEP_GREEN }}>{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#F0EDE8] text-stone-400">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {weekdayLabels.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-stone-300 py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const score = scoreMap.get(dateStr);
          const todoProgress = getDiaryTodoProgress(dateStr);
          const memo = getDiaryMemo(dateStr);
          const tags = getDiaryCauseTags(dateStr);
          const isToday = dateStr === todayStr();
          const isSelected = selectedEntry?.dateStr === dateStr;
          return (
            <button key={dateStr}
              onClick={() => setSelectedEntry({ dateStr, score: score ?? 0 })}
              className="flex min-h-[60px] flex-col items-center justify-start py-1.5 gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
                ${isSelected ? "ring-2 ring-offset-1 ring-[#C97062]" : ""}`}
                style={score !== undefined
                  ? { background: getScoreColor(score), color: getTextColor(score) }
                  : isSelected
                  ? { background: `${SCAN_FROM}30`, border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : isToday
                  ? { border: `1.5px solid ${SCAN_FROM}`, color: SCAN_TO }
                  : { color: "#B0A898" }}>
                {day}
              </div>
              {todoProgress.total > 0 ? (
                <div
                  className="min-h-[14px] rounded-full px-1.5 text-[9px] font-bold leading-[14px]"
                  style={{
                    background: todoProgress.done === todoProgress.total ? "#ECFDF5" : "#F6F3EE",
                    color: todoProgress.done === todoProgress.total ? "#059669" : "#9A8F80",
                  }}
                >
                  {todoProgress.done}/{todoProgress.total}
                </div>
              ) : (
                <div className="min-h-[14px]">
                  {score !== undefined && <div className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                </div>
              )}
              <div className="flex items-center gap-1 min-h-[10px]">
                {score !== undefined && <span className="w-1.5 h-1.5 rounded-full" style={{ background: getScoreColor(score) }} />}
                {todoProgress.total > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: todoProgress.done === todoProgress.total ? "#10B981" : "#D97706" }} />}
                {memo && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7C3AED" }} />}
                {tags.length > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2D5F4F" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {selectedEntry && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-[24px] border shadow-sm" style={{ background: "linear-gradient(180deg, #FFFAF9 0%, #FFFFFF 100%)", borderColor: "#F0EDE8" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-stone-400 tracking-wide">{selectedEntry.dateStr}</span>
            {selectedEntry.score > 0 && (
              <span className="text-[20px] font-black" style={{ color: SCAN_TO }}>{selectedEntry.score}{t("result.scoreSuffix")}</span>
            )}
          </div>
          <InlineTodos dateStr={selectedEntry.dateStr} />
          <InlineMemo dateStr={selectedEntry.dateStr} />
        </motion.div>
      )}

      <div className="mt-5 flex items-center gap-3 justify-center flex-wrap">
        {([{ label: "90+", color: SCAN_TO }, { label: "75~89", color: SCAN_FROM },
          { label: "60~74", color: "#F5C5B8" }, { label: "~59", color: "#FAE0DA" }]).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-stone-400">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 justify-center flex-wrap">
        {[
          { label: t("modal.diary.legendRoutine"), color: "#10B981" },
          { label: t("modal.diary.legendIncomplete"), color: "#D97706" },
          { label: t("modal.diary.legendMemo"), color: "#7C3AED" },
          { label: t("modal.diary.legendTag"), color: "#2D5F4F" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-stone-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 다이어리 타임라인 ────────────────────────────────────────────
function DiaryTimeline({ history, analysisResult, overallScore, finalType, currentScanId }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string; currentScanId: string | null;
}) {
  const { t, i18n } = useTranslation();

  const todayEntry = {
    id: currentScanId || "today",
    dateStr: todayStr(),
    date: new Date(),
    score: overallScore,
    baumannType: finalType,
    skinAge: analysisResult?.skinAge,
    aiComment: analysisResult?.aiComment,
    isToday: true,
  };

  const historyEntries = history
    .filter((h: any) => h.id !== currentScanId)
    .map((h: any) => ({
      id: h.id,
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      date: new Date(h.createdAt),
      score: parseInt(h.overallScore),
      baumannType: h.baumannType,
      skinAge: h.skinAge,
      aiComment: h.aiComment,
      isToday: false,
    }));

  const allEntries = [todayEntry, ...historyEntries];

  // 월별 그룹핑
  type EntryType = typeof todayEntry;
  const grouped: { monthKey: string; monthLabel: string; entries: EntryType[] }[] = [];
  for (const entry of allEntries) {
    const mk = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    let group = grouped.find(g => g.monthKey === mk);
    if (!group) {
      const y = entry.date.getFullYear();
      const m = entry.date.getMonth() + 1;
      const label = i18n.language === "ko" ? `${y}년 ${m}월`
        : i18n.language === "ja" ? `${y}年${m}月`
        : entry.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      group = { monthKey: mk, monthLabel: label, entries: [] };
      grouped.push(group);
    }
    group.entries.push(entry);
  }

  // 비교 요약
  const prevScan = history[0];
  const prevScores = prevScan ? (() => { try { return JSON.parse(prevScan.scores || "[]"); } catch { return []; } })() : [];
  const currentScores = analysisResult?.scores || [];
  const improved = currentScores.filter((s: any, idx: number) => s.score > (prevScores[idx]?.score || 0)).length;
  const declined = currentScores.filter((s: any, idx: number) => s.score < (prevScores[idx]?.score || 0)).length;
  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <div className="px-5 pb-8 pt-4">
      {/* 점수 추이 그래프 */}
      {history.length >= 1 && (
        <div className="mb-5">
          <p className="text-[10px] font-bold text-stone-300 tracking-widest uppercase mb-2">{t("modal.diary.graphTitle")}</p>
          <div className="h-36 rounded-[24px] bg-white px-2 pt-2 border border-[#F0EDE8]"
            style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.06)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...historyEntries.slice().reverse().map(e => ({
                date: e.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" }),
                score: e.score,
              })), { date: t("modal.diary.today"), score: overallScore }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "9px" }} />
                <YAxis domain={[0, 100]} ticks={[0,25,50,75,100]} axisLine={false} tickLine={false} style={{ fontSize: "9px" }} width={22} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
                <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2.5}
                  dot={{ r: 4, fill: SCAN_TO, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 비교 요약 배지 */}
      {history.length >= 1 && prevScores.length > 0 && (improved > 0 || declined > 0) && (
        <div className="mb-5 px-4 py-2.5 rounded-2xl flex items-center gap-2"
          style={{ background: `${DEEP_GREEN}08`, border: `1px solid ${DEEP_GREEN}15` }}>
          <Activity className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
          <p className="text-[12px] font-semibold" style={{ color: DEEP_GREEN }}>
            {t("compare.summary", { improved, declined })}
          </p>
        </div>
      )}

      {/* 월별 타임라인 */}
      {grouped.map((group, gi) => (
        <div key={group.monthKey} className={gi > 0 ? "mt-6" : ""}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-4 bg-stone-200" />
            <span className="text-[10px] font-bold tracking-widest text-stone-300 uppercase whitespace-nowrap">
              {group.monthLabel}
            </span>
            <div className="h-[1px] flex-1 bg-stone-200" />
          </div>

          <div className="relative">
            <div className="absolute left-[7px] top-3 bottom-0 w-[1.5px] bg-stone-200" />
            <div className="space-y-4">
              {group.entries.map((entry, ei) => {
                const dateLabel = entry.isToday
                  ? `${t("modal.diary.today")} · ${entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" })}`
                  : entry.date.toLocaleDateString(locale, { month: "numeric", day: "numeric" });
                return (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (gi * 5 + ei) * 0.05 }}
                    className="flex gap-3 items-start">
                    <div className="shrink-0 w-4 flex flex-col items-center pt-3 z-[1]">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ background: entry.isToday ? SCAN_TO : "#D4C5BC",
                          boxShadow: `0 0 0 2px ${entry.isToday ? SCAN_TO + "30" : "#E8E0D820"}` }} />
                    </div>
                    <div className="flex-1 rounded-[24px] p-4 border"
                      style={{
                        background: entry.isToday ? "#FFFAF9" : "#FFFFFF",
                        borderColor: entry.isToday ? `${SCAN_FROM}50` : "#F0EDE8",
                        boxShadow: "0 2px 16px rgba(180,130,110,0.07)",
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium tracking-wide text-stone-400">{dateLabel}</span>
                        <div className="flex items-center gap-1.5">
                          {entry.skinAge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#A78BFA15", color: "#7C3AED" }}>
                              {t("modal.diary.skinAgeLabel", { age: entry.skinAge })}
                            </span>
                          )}
                          <span className="text-[20px] font-black leading-none"
                            style={{ color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>{entry.score}</span>
                        </div>
                      </div>
                      {entry.baumannType && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                          style={{ background: entry.isToday ? `${SCAN_FROM}20` : `${DEEP_GREEN}10`,
                            color: entry.isToday ? SCAN_TO : DEEP_GREEN }}>
                          {t("modal.diary.baumannLabel", { type: entry.baumannType })}
                        </span>
                      )}
                      {entry.aiComment && (
                        <p className="text-[12px] text-stone-500 leading-relaxed italic">"{entry.aiComment}"</p>
                      )}
                      <InlineMemo dateStr={entry.dateStr} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 다이어리 풀스크린 뷰 ────────────────────────────────────────
function DiaryFullView({ history, analysisResult, overallScore, finalType, currentScanId, rankingData, user, onClose, onLogout }: {
  history: any[]; analysisResult: any; overallScore: number; finalType: string;
  currentScanId: string | null; rankingData: RankingData | null;
  user: any; onClose: () => void; onLogout: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"timeline" | "calendar" | "ranking">("timeline");

  const allEntries: { dateStr: string; score: number }[] = [
    { dateStr: todayStr(), score: overallScore },
    ...history.filter((h: any) => h.id !== currentScanId).map((h: any) => ({
      dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
      score: parseInt(h.overallScore),
    })),
  ];

  const tabs: { id: "timeline" | "calendar" | "ranking"; label: string }[] = [
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "calendar", label: t("modal.diary.calendarTab") },
    { id: "ranking", label: t("modal.diary.rankingTab") },
  ];

  const locale = i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US";

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col max-w-md mx-auto"
      style={{ background: "#FBF9F7" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}>

      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-12 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="flex items-center gap-1.5 text-stone-500 active:opacity-70">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[13px] font-semibold">{t("modal.diary.title")}</span>
          </button>
          <div className="flex items-center gap-2">
            {user?.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full border border-stone-100" />}
            <button onClick={onLogout} className="text-[10px] text-stone-300 underline">
              {t("modal.diary.logout")}
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-[12px] font-bold transition-all border-b-2 ${
                tab === id ? "border-[#C97062] text-[#C97062]" : "border-transparent text-stone-400"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {tab === "timeline" && (
            <motion.div key="tl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryTimeline history={history} analysisResult={analysisResult}
                overallScore={overallScore} finalType={finalType} currentScanId={currentScanId} />
            </motion.div>
          )}
          {tab === "calendar" && (
            <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryCalendarView allEntries={allEntries} />
            </motion.div>
          )}
          {tab === "ranking" && (
            <motion.div key="rank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-5 pb-8 space-y-4 pt-4">
                {!rankingData ? (
                  <div className="py-12 text-center"><p className="text-[12px] text-stone-400">...</p></div>
                ) : (
                  <>
                    {rankingData.myPercentile !== undefined ? (
                      <div className="p-5 rounded-2xl text-center border border-[#F0EDE8]"
                        style={{ background: `linear-gradient(135deg, ${SCAN_FROM}20, ${SCAN_TO}10)` }}>
                        <p className="text-[11px] text-stone-500 mb-1">{t("ranking.myRankLabel")}</p>
                        <p className="text-4xl font-black" style={{ color: SCAN_TO }}>
                          {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl text-center bg-stone-50">
                        <p className="text-[12px] text-stone-500">{t("ranking.loginForRank")}</p>
                        <p className="text-[11px] text-stone-300 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 mb-3">{t("ranking.distribution")}</p>
                      <div className="space-y-2">
                        {rankingData.scoreDistribution.map((band, bi) => {
                          const maxCount = Math.max(...rankingData.scoreDistribution.map(d => d.count), 1);
                          const barPct = Math.round((band.count / maxCount) * 100);
                          const [bMin, bMax] = band.label.split("-").map(Number);
                          const isMyBand = overallScore >= bMin && overallScore <= bMax;
                          return (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-[10px] text-stone-400 w-14 shrink-0">{band.label}</span>
                              <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.max(barPct, band.count > 0 ? 6 : 0)}%`,
                                    background: isMyBand ? `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` : "#D1D5DB" }} />
                              </div>
                              <span className="text-[10px] text-stone-400 w-5 text-right">{band.count}</span>
                              {isMyBand && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: `${SCAN_FROM}30`, color: SCAN_TO }}>{t("ranking.me")}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {Object.keys(rankingData.baumannDistribution).length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-stone-400 mb-2">{t("ranking.topBaumann")}</p>
                        <div className="flex gap-2">
                          {Object.entries(rankingData.baumannDistribution)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([type, count], ri) => (
                              <div key={type} className="flex-1 p-3 rounded-2xl text-center bg-white border border-[#F0EDE8]">
                                <span className="text-[13px]">{["🥇","🥈","🥉"][ri]}</span>
                                <p className="text-[18px] font-black mt-0.5" style={{ color: SCAN_TO }}>{type}</p>
                                <p className="text-[10px] text-stone-400">{count as number}{t("ranking.people")}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-white border border-[#F0EDE8] text-center">
                        <p className="text-[11px] text-stone-400">{t("ranking.avgScore")}</p>
                        <p className="text-xl font-black" style={{ color: DEEP_GREEN }}>{rankingData.avgScore}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-[#F0EDE8] text-center">
                        <p className="text-[11px] text-stone-400">{t("ranking.topScore")}</p>
                        <p className="text-xl font-black" style={{ color: "#D97706" }}>{rankingData.topScore}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── 결과 화면 ────────────────────────────────────────────────────
// ─── 피부 일기 탭 (독립 데이터 페칭) ─────────────────────────────
function DiaryTab({ user, analysisResult, onBack, onLogin }: { user: any; analysisResult: AnalysisResult | null; onBack?: () => void; onLogin?: (p: "kakao"|"line"|"google", tab: string) => void }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [tab, setTab] = useState<"calendar" | "timeline" | "report" | "ranking">("calendar");
  const [loading, setLoading] = useState(true);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => getReminderSettings());
  const [aiCareSettings, setAICareSettings] = useState<AICareSettings>(() => getAICareSettings());
  const [reminderPushWarn, setReminderPushWarn] = useState(false);
  const [myCosmetics, setMyCosmetics] = useState<CosmeticItem[]>([]);
  // Bug 7 fix: stale closure 방지용 ref
  const reminderSettingsRef = useRef(reminderSettings);
  useEffect(() => { reminderSettingsRef.current = reminderSettings; }, [reminderSettings]);
  useEffect(() => { setAICareSettings(getAICareSettings()); }, [reminderSettings]);

  const scores = analysisResult?.scores || [];
  const overallScore = scores[0]?.score || 0;
  const isOily  = (scores[3]?.score ?? 100) < 50;
  const isSens  = (scores[2]?.score ?? 0) > 50;
  const isPig   = (scores[5]?.score ?? 0) > 50;
  const isWrink = (scores[4]?.score ?? 100) < 60;
  const finalType = analysisResult
    ? `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`
    : "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (user) {
        try {
          const r = await fetch("/api/scans");
          if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setHistory(d); }
        } catch {}
        // 서버 → localStorage 동기화 (기기 변경/캐시 삭제 복원)
        try {
          const r = await fetch("/api/diary");
          if (r.ok) {
            const entries: any[] = await r.json();
            entries.forEach((entry: any) => {
              const { date_str, memo, todos, cause_tags } = entry;
              if (memo) localStorage.setItem(`fonday_memo_${date_str}`, memo);
              try {
                const t = JSON.parse(todos || "[]");
                if (t.length > 0) localStorage.setItem(`fonday_todos_${date_str}`, todos);
              } catch {}
              try {
                const c = JSON.parse(cause_tags || "[]");
                if (c.length > 0) localStorage.setItem(`fonday_cause_tags_${date_str}`, cause_tags);
              } catch {}
            });
          }
        } catch {}
        try {
          const cosmeticsRes = await fetch("/api/cosmetics");
          if (cosmeticsRes.ok) {
            const cosmetics = await cosmeticsRes.json();
            setMyCosmetics(Array.isArray(cosmetics) ? cosmetics : []);
          }
        } catch {}
      }
      try {
        const qs = overallScore > 0 ? `?myScore=${overallScore}` : "";
        const r = await fetch(`/api/ranking${qs}`);
        if (r.ok) setRankingData(await r.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    const targetTab = sessionStorage.getItem("fonday_diary_target_tab");
    if (targetTab === "calendar" || targetTab === "timeline" || targetTab === "report" || targetTab === "ranking") {
      setTab(targetTab);
      sessionStorage.removeItem("fonday_diary_target_tab");
    }
  }, []);

  const allEntries: { dateStr: string; score: number }[] = overallScore > 0
    ? [
        { dateStr: todayStr(), score: overallScore },
        ...history
          .filter((h: any) => new Date(h.createdAt).toISOString().slice(0, 10) !== todayStr())
          .map((h: any) => ({ dateStr: new Date(h.createdAt).toISOString().slice(0, 10), score: parseInt(h.overallScore) })),
      ]
    : history.map((h: any) => ({
        dateStr: new Date(h.createdAt).toISOString().slice(0, 10),
        score: parseInt(h.overallScore),
      }));
  const uniqueScanDays = new Set([
    ...(overallScore > 0 ? [todayStr()] : []),
    ...history.map((h: any) => new Date(h.createdAt).toISOString().slice(0, 10)),
  ]);
  const totalRecords = uniqueScanDays.size;
  const recentScores = allEntries.slice(0, 7).map((entry) => entry.score);
  const avgScore = recentScores.length > 0 ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 0;
  const diaryTodoProgress = getDiaryTodoProgress(todayStr());
  const diaryMemoReady = Boolean(getDiaryMemo(todayStr()).trim());
  const streakCount = getStreak().count;
  const weeklyReport = getWeeklyReport(allEntries, streakCount);
  const routineGuide = buildRoutineGuide(myCosmetics, t);
  const reportLang = getReportLang(i18n.language || "ko");
  const diaryReport = buildDiaryReportModel({
    history,
    analysisResult,
    overallScore,
    finalType,
    weeklyReport,
    myCosmetics,
    t,
    lang: reportLang,
  });
  const reportDetailText = reportLang === "ko"
    ? {
        radarTitle: "피부 균형 스파이더 그래프",
        radarSub: "현재 상태와 누적 평균을 한 번에 비교합니다.",
        ingredientTrack: "성분 반응 추적",
        ingredientTrackSub: "화장품 개봉 이후 점수 흐름을 기준으로 성분 신호를 추렸습니다.",
        recoveryGuide: "시술 후 회복 가이드",
        seasonImpact: "계절/환경 영향 해석",
        triggerCorrelation: "트리거 상관관계",
        forecastTitle: "다음 2주 회복 예측",
        positiveFlow: "긍정 신호",
        cautionFlow: "주의 신호",
      }
    : reportLang === "ja"
      ? {
          radarTitle: "肌バランススパイダー",
          radarSub: "現在状態と累積平均を一目で比較します。",
          ingredientTrack: "成分反応トラッキング",
          ingredientTrackSub: "開封後のスコア変化から成分シグナルを抽出しました。",
          recoveryGuide: "施術後の回復ガイド",
          seasonImpact: "季節・環境影響の解釈",
          triggerCorrelation: "トリガー相関",
          forecastTitle: "今後2週間の回復予測",
          positiveFlow: "プラスシグナル",
          cautionFlow: "注意シグナル",
        }
      : {
          radarTitle: "Skin Balance Spider",
          radarSub: "Compare the current profile against your accumulated average.",
          ingredientTrack: "Ingredient response tracking",
          ingredientTrackSub: "Signals are estimated from score shifts after product opening dates.",
          recoveryGuide: "Post-procedure recovery guide",
          seasonImpact: "Season & environment interpretation",
          triggerCorrelation: "Trigger correlation",
          forecastTitle: "Next 2-week recovery forecast",
          positiveFlow: "Positive signals",
          cautionFlow: "Signals to watch",
        };

  useEffect(() => {
    if (!reminderSettings.enabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    // Bug 7 fix: ref로 최신 settings 참조 → 중복 알림 방지
    const timer = window.setInterval(() => {
      const settings = reminderSettingsRef.current;
      if (!settings.enabled) return;
      const now = new Date();
      const currentDate = todayStr();
      const progress = getDiaryTodoProgress(currentDate);
      const incomplete = progress.total > 0 && progress.done < progress.total;
      const shouldTrigger = incomplete
        && now.getHours() === settings.hour
        && now.getMinutes() >= settings.minute
        && settings.lastNotifiedDate !== currentDate;
      if (shouldTrigger) {
        new Notification(t("modal.diary.reminderNotifyTitle"), {
          body: t("modal.diary.reminderNotifyBody", { done: progress.done, total: progress.total }),
          icon: "/icon-192.png",
        });
        const next = { ...settings, lastNotifiedDate: currentDate };
        setReminderSettings(next);
        saveReminderSettings(next);
      }
    }, 60000);
    return () => window.clearInterval(timer);
  }, [reminderSettings.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: "calendar" | "timeline" | "report" | "ranking"; label: string }[] = [
    { id: "calendar", label: t("modal.diary.calendarTab") },
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "report", label: t("modal.diary.reportTab") },
    { id: "ranking", label: t("modal.diary.rankingTab") },
  ];

  if (!user) {
    return (
      <div className="flex flex-col" style={{ background: "#FBF9F7", minHeight: "calc(100dvh - 64px)" }}>
        <div className="shrink-0 px-5 pt-12 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
          {onBack && (
            <button onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-500 mb-3 active:opacity-70">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="rounded-[28px] p-5 mb-4 text-white"
            style={{ background: "linear-gradient(135deg, #2D5F4F 0%, #C97062 100%)" }}>
            <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-white/70">FONDAY</p>
            <h1 className="text-[24px] font-black">{t("modal.diary.title")} ✦</h1>
            <p className="text-[12px] text-white/80 mt-2 text-kr-pretty">{t("result.login.desc")}</p>
          </div>
        </div>
        <div className="flex-1 px-5 py-6">
          <Card className="border-none rounded-[30px] shadow-md overflow-hidden"
            style={{ background: "linear-gradient(180deg, #FFF8F4 0%, #FFFFFF 100%)" }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-[20px] mx-auto flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${SCAN_TO})` }}>
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-[22px] font-black mt-4" style={{ color: DEEP_GREEN }}>{t("result.login.title")}</p>
              <p className="text-[12px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">{t("result.login.desc")}</p>
              <div className="grid grid-cols-3 gap-2.5 mt-5 text-left">
                <div className="rounded-2xl p-3" style={{ background: "#FFF1EC" }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("result.diary.avg7d")}</p>
                  <p className="text-[18px] font-black mt-1" style={{ color: SCAN_TO }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#F5F3FF" }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("modal.diary.timelineTab")}</p>
                  <p className="text-[18px] font-black mt-1" style={{ color: "#7C3AED" }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#ECFDF5" }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("modal.diary.calendarTab")}</p>
                  <p className="text-[18px] font-black mt-1" style={{ color: "#059669" }}>--</p>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                {i18n.language === "ko" ? (
                  <Button onClick={() => onLogin ? onLogin("kakao", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/kakao")}
                    className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
                    style={{ background: "#FEE500" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                    {t("result.login.kakao")}
                  </Button>
                ) : (
                  <Button onClick={() => onLogin ? onLogin("line", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/line")}
                    className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-white"
                    style={{ background: "#06C755" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                    {t("result.login.line")}
                  </Button>
                )}
                <Button onClick={() => onLogin ? onLogin("google", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/google")}
                  className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                  {t("result.login.google")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ background: "#FBF9F7", minHeight: "calc(100dvh - 64px)" }}>
      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-12 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
        {onBack && (
          <button onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-500 mb-3 active:opacity-70">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="rounded-[28px] p-5 mb-4 text-white"
          style={{ background: "linear-gradient(135deg, #2D5F4F 0%, #C97062 100%)" }}>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-white/70">FONDAY</p>
          <h1 className="text-[24px] font-black">{t("modal.diary.title")} ✦</h1>
          <p className="text-[12px] text-white/80 mt-2 text-kr-pretty">
            {finalType ? `${finalType} · ` : ""}{totalRecords > 0 ? `${t("modal.diary.countLabel", { count: totalRecords })}` : t("result.diary.firstRecord")}
          </p>
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12 text-center">
              <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.overall")}</p>
              <p className="text-[22px] font-black mt-1">{overallScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12 text-center">
              <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.diary.avg7d")}</p>
              <p className="text-[22px] font-black mt-1">{avgScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12 text-center">
              <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("diary.routineTitle")}</p>
              <p className="text-[22px] font-black mt-1">{diaryTodoProgress.total > 0 ? `${diaryTodoProgress.done}/${diaryTodoProgress.total}` : (diaryMemoReady ? "1/1" : "0/1")}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-2 rounded-[24px] mb-3" style={{ background: "#FFF8F4" }}>
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-[12px] font-bold transition-all rounded-[18px] ${
                tab === id ? "text-white shadow-md" : "text-stone-400"
              }`}
              style={tab === id ? { background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` } : { background: "transparent" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-hidden pb-24">
        <AnimatePresence mode="wait">
          {tab === "calendar" && (
            <motion.div
              key="cal"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full overflow-y-auto overscroll-contain"
            >
              <DiaryCalendarView allEntries={allEntries} />
              <div className="px-5 pt-3">
                <Card className="border-none rounded-[28px] overflow-hidden shadow-sm" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("modal.diary.reminderTitle")}</p>
                        <p className="text-[16px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.reminderHeadline")}</p>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                          {t("modal.diary.reminderDesc")} {aiCareSettings.enabled ? "" : t("modal.diary.aiCareWarn")}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!aiCareSettings.enabled) {
                            setReminderPushWarn(true);
                            setTimeout(() => setReminderPushWarn(false), 3000);
                            return;
                          }
                          if (!reminderSettings.enabled) {
                            // 켜기 전에 push 구독 확인
                            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                              setReminderPushWarn(true);
                              setTimeout(() => setReminderPushWarn(false), 3000);
                              return;
                            }
                            try {
                              const reg = await navigator.serviceWorker.ready;
                              const sub = await reg.pushManager.getSubscription();
                              if (!sub) {
                                setReminderPushWarn(true);
                                setTimeout(() => setReminderPushWarn(false), 3000);
                                return;
                              }
                            } catch { /* ignore */ }
                          }
                          const next = { ...reminderSettings, enabled: !reminderSettings.enabled };
                          setReminderSettings(next);
                          saveReminderSettings(next);
                          const nextCare = { ...aiCareSettings, routine: next.enabled, routineHour: next.hour, routineMinute: next.minute };
                          setAICareSettings(nextCare);
                          saveAICareSettings(nextCare);
                          syncReminderToServer(next);
                        }}
                        className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
                        style={reminderSettings.enabled
                          ? { background: "#ECFDF5", color: "#059669" }
                          : { background: "#F6F3EE", color: "#9A8F80" }}
                      >
                        {reminderSettings.enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                    {reminderPushWarn && (
                      <p className="text-[11px] text-amber-600 mt-1.5">
                        {t("modal.diary.pushWarn")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      {[
                        { label: "20:00", hour: 20, minute: 0 },
                        { label: "21:00", hour: 21, minute: 0 },
                        { label: "22:00", hour: 22, minute: 0 },
                      ].map((option) => {
                        const selected = reminderSettings.hour === option.hour && reminderSettings.minute === option.minute;
                        return (
                          <button
                            key={option.label}
                            onClick={() => {
                              const next = { ...reminderSettings, hour: option.hour, minute: option.minute };
                              setReminderSettings(next);
                              saveReminderSettings(next);
                              const nextCare = { ...aiCareSettings, routineHour: option.hour, routineMinute: option.minute };
                              setAICareSettings(nextCare);
                              saveAICareSettings(nextCare);
                              if (next.enabled) syncReminderToServer(next);
                            }}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                            style={selected
                              ? { background: `${SCAN_FROM}20`, color: SCAN_TO }
                              : { background: "#F6F3EE", color: "#9A8F80" }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DiaryRoutinePreviewCard routineGuide={routineGuide} dateStr={todayStr()} />
            </motion.div>
          )}
          {tab === "timeline" && (
            <motion.div
              key="tl"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full overflow-y-auto overscroll-contain"
            >
              {loading ? (
                <div className="py-20 text-center"><p className="text-[12px] text-stone-400">...</p></div>
              ) : (
                <DiaryTimeline history={history} analysisResult={analysisResult}
                  overallScore={overallScore} finalType={finalType} currentScanId={null} />
              )}
            </motion.div>
          )}
          {tab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full overflow-y-auto overscroll-contain"
            >
              <div className="px-5 pt-4 pb-8 space-y-4">
                <Card className="border-none rounded-[28px] overflow-hidden shadow-sm"
                  style={{ background: "linear-gradient(135deg, #FEF3EC 0%, #FFFDFB 60%, #F2F7F4 100%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>
                          {diaryReport.copy.deck}
                        </p>
                        <p className="text-[20px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                          {diaryReport.copy.title}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                          {diaryReport.copy.subtitle}
                        </p>
                      </div>
                      <div className="rounded-[22px] px-3 py-2 text-right shrink-0"
                        style={{ background: "#FFFFFFAA", border: "1px solid #F1E6DE" }}>
                        <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{diaryReport.copy.period}</p>
                        <p className="text-[14px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.periodLabel}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #F2E7DF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.scans}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.scanCount}</p>
                      </div>
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #F2E7DF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.diary}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: SCAN_TO }}>{diaryReport.memoCount}</p>
                      </div>
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF", border: "1px solid #F2E7DF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.adherence}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: "#0F766E" }}>{diaryReport.adherence}</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] p-4 mt-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #F2E7DF" }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {diaryReport.copy.executive}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-[18px] font-black" style={{ color: DEEP_GREEN }}>
                          {diaryReport.copy[diaryReport.trendKey]}
                        </p>
                        <div className="px-3 py-1.5 rounded-full text-[10px] font-black"
                          style={{ background: `${SCAN_FROM}18`, color: SCAN_TO }}>
                          {diaryReport.trendDesc}
                        </div>
                      </div>
                      <p className="text-[13px] text-stone-600 mt-3 leading-relaxed text-kr-pretty">
                        {diaryReport.executiveSummary}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-3">{diaryReport.routineDesc}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportDetailText.radarTitle}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">{reportDetailText.radarSub}</p>
                    <div className="w-full h-72 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={diaryReport.radarData}>
                          <PolarGrid stroke="#E7E1DA" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#7C6F63", fontSize: 10, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name={reportLang === "ko" ? "현재" : reportLang === "ja" ? "現在" : "Current"} dataKey="current" stroke={SCAN_TO} fill={SCAN_TO} fillOpacity={0.22} strokeWidth={2} />
                          <Radar name={reportLang === "ko" ? "누적 평균" : reportLang === "ja" ? "累積平均" : "Average"} dataKey="average" stroke={DEEP_GREEN} fill={DEEP_GREEN} fillOpacity={0.38} strokeWidth={2} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 700, color: "#444", paddingTop: "8px" }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] px-1" style={{ color: SCAN_TO }}>
                    {diaryReport.copy.priority}
                  </p>
                  {diaryReport.focusConcerns.map((concern) => (
                    <Card key={concern.key} className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-black text-kr-pretty" style={{ color: concern.accent }}>{concern.titles[reportLang]}</p>
                            <p className="text-[12px] text-stone-500 mt-1 leading-relaxed">{concern.summaries[reportLang]}</p>
                          </div>
                          <div className="rounded-2xl px-3 py-2 shrink-0 text-right"
                            style={{ background: `${concern.accent}12`, border: `1px solid ${concern.accent}20` }}>
                            <p className="text-[10px] font-bold" style={{ color: concern.accent }}>{diaryReport.copy.avgRisk}</p>
                            <p className="text-[20px] font-black leading-none mt-1" style={{ color: concern.accent }}>{concern.avgRisk}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-stone-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, concern.avgRisk)}%`, background: concern.accent }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {diaryReport.copy.ingredients}
                      </p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.ingredientPlan.map((item) => (
                          <div key={item.name} className="rounded-[18px] p-3" style={{ background: `${item.accent}10` }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-black" style={{ color: item.accent }}>{item.name}</p>
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/80 text-stone-500">{item.concern}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {diaryReport.copy.procedures}
                      </p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.procedurePlan.map((item) => (
                          <div key={item.name} className="rounded-[18px] p-3 border" style={{ borderColor: `${item.accent}20`, background: "#FFFCFA" }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{item.name}</p>
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${item.accent}12`, color: item.accent }}>
                                {diaryReport.copy.recommended}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-3 leading-relaxed">{diaryReport.copy.procedureNote}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportDetailText.ingredientTrack}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">{reportDetailText.ingredientTrackSub}</p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.ingredientSignals.length > 0 ? (
                          <>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">{reportDetailText.positiveFlow}</p>
                              <div className="space-y-2 mt-2">
                                {diaryReport.ingredientSignals.filter((item) => item.delta >= 0).slice(0, 3).map((item) => (
                                  <div key={`good-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: "#ECFDF5" }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[13px] font-black text-emerald-700">{item.ingredient}</p>
                                      <span className="text-[10px] font-bold text-emerald-600">+{item.delta}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{reportDetailText.cautionFlow}</p>
                              <div className="space-y-2 mt-2">
                                {diaryReport.ingredientSignals.filter((item) => item.delta < 0).slice(0, 3).map((item) => (
                                  <div key={`bad-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: "#FFF1EC" }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[13px] font-black" style={{ color: SCAN_TO }}>{item.ingredient}</p>
                                      <span className="text-[10px] font-bold" style={{ color: SCAN_TO }}>{item.delta}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-[12px] text-stone-400 py-8 text-center">{diaryReport.copy.notEnough}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportDetailText.recoveryGuide}
                      </p>
                      <div className="space-y-2 mt-3">
                        {diaryReport.recoveryGuide.map((item: string) => (
                          <div key={item} className="rounded-[18px] p-3" style={{ background: "#F7FAF8", border: "1px solid #E5F0EB" }}>
                            <p className="text-[12px] text-stone-600 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {diaryReport.copy.routine}
                    </p>
                    <div className="grid gap-3 mt-3 md:grid-cols-2">
                      <div className="rounded-[20px] p-4" style={{ background: "#FFF8F4" }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineGood}</p>
                        <p className="text-[13px] font-black mt-2 text-kr-pretty" style={{ color: DEEP_GREEN }}>{diaryReport.routineHighlights.strong}</p>
                      </div>
                      <div className="rounded-[20px] p-4" style={{ background: "#F6F3EE" }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineWatch}</p>
                        <p className="text-[13px] font-black mt-2 text-kr-pretty" style={{ color: "#8C8070" }}>{diaryReport.routineHighlights.watch}</p>
                      </div>
                      <div className="rounded-[20px] p-4" style={{ background: "#FFF1EC" }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{diaryReport.copy.memoSignals}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(diaryReport.keywordSummary.length > 0 ? diaryReport.keywordSummary : [diaryReport.copy.notEnough]).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[20px] p-4" style={{ background: "#F5F3FF" }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7C3AED]">{diaryReport.copy.causeSignals}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(diaryReport.topCauseTags.length > 0 ? diaryReport.topCauseTags : [diaryReport.copy.notEnough]).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFFFFF", color: "#7C3AED" }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[20px] p-4 mt-3" style={{ background: "#F7FAF8", border: "1px solid #E5F0EB" }}>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: DEEP_GREEN }}>
                        {diaryReport.copy.cosmeticsSignal}
                      </p>
                      <p className="text-[12px] text-stone-600 mt-2 leading-relaxed">{diaryReport.cosmeticsSignal}</p>
                      {routineGuide.cautions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {routineGuide.cautions.slice(0, 2).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFF1EC", color: SCAN_TO }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportDetailText.seasonImpact}
                      </p>
                      <p className="text-[13px] text-stone-600 mt-3 leading-relaxed text-kr-pretty">{diaryReport.seasonGuide}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportDetailText.triggerCorrelation}
                      </p>
                      <div className="space-y-2 mt-3">
                        {diaryReport.triggerSignals.length > 0 ? diaryReport.triggerSignals.map((item) => (
                          <div key={item.tag} className="rounded-[18px] p-3" style={{ background: item.diff <= 0 ? "#FFF1EC" : "#ECFDF5" }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-black" style={{ color: item.diff <= 0 ? SCAN_TO : "#059669" }}>{item.label}</p>
                              <span className="text-[10px] font-bold" style={{ color: item.diff <= 0 ? SCAN_TO : "#059669" }}>
                                {item.diff > 0 ? `+${item.diff}` : item.diff}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <p className="text-[12px] text-stone-400 py-8 text-center">{diaryReport.copy.notEnough}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none rounded-[24px] shadow-sm overflow-hidden" style={{ background: "linear-gradient(135deg, #F0F9F4 0%, #FFFFFF 100%)" }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                          {reportDetailText.forecastTitle}
                        </p>
                        <p className="text-[13px] text-stone-600 mt-2 leading-relaxed text-kr-pretty">{diaryReport.forecast.note}</p>
                      </div>
                      <div className="rounded-[22px] px-3 py-2 shrink-0 text-right" style={{ background: "#FFFFFF", border: "1px solid #DCEFE5" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 2</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-[18px] p-3" style={{ background: "#FFFFFF", border: "1px solid #E5F0EB" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 1</p>
                        <p className="text-[22px] font-black mt-1" style={{ color: SCAN_TO }}>{diaryReport.forecast.week1}</p>
                      </div>
                      <div className="rounded-[18px] p-3" style={{ background: "#FFFFFF", border: "1px solid #E5F0EB" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 2</p>
                        <p className="text-[22px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          {tab === "ranking" && (
            <motion.div
              key="rank"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="h-full overflow-y-auto overscroll-contain"
            >
              <div className="px-5 pb-8 space-y-4 pt-4">
                {!rankingData ? (
                  <div className="py-12 text-center"><p className="text-[12px] text-stone-400">...</p></div>
                ) : (
                  <>
                    {rankingData.myPercentile !== undefined ? (
                      <div className="p-5 rounded-2xl text-center border border-[#F0EDE8]"
                        style={{ background: `linear-gradient(135deg, ${SCAN_FROM}20, ${SCAN_TO}10)` }}>
                        <p className="text-[11px] text-stone-500 mb-1">{t("ranking.myRankLabel")}</p>
                        <p className="text-4xl font-black" style={{ color: SCAN_TO }}>
                          {t("ranking.myPercentile", { percent: rankingData.myPercentile })}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl text-center bg-stone-50">
                        <p className="text-[12px] text-stone-500">{t("ranking.loginForRank")}</p>
                        <p className="text-[11px] text-stone-300 mt-1">{t("ranking.totalData", { count: rankingData.totalScans })}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 mb-3">{t("ranking.distribution")}</p>
                      <div className="space-y-2">
                        {rankingData.scoreDistribution.map((band, bi) => {
                          const maxCount = Math.max(...rankingData.scoreDistribution.map(d => d.count), 1);
                          const barPct = Math.round((band.count / maxCount) * 100);
                          const [bMin, bMax] = band.label.split("-").map(Number);
                          const isMyBand = overallScore >= bMin && overallScore <= bMax;
                          return (
                            <div key={bi} className="flex items-center gap-2">
                              <span className="text-[10px] text-stone-400 w-14 shrink-0">{band.label}</span>
                              <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.max(barPct, band.count > 0 ? 6 : 0)}%`,
                                    background: isMyBand ? `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` : "#D1D5DB" }} />
                              </div>
                              <span className="text-[10px] text-stone-400 w-5 text-right">{band.count}</span>
                              {isMyBand && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                  style={{ background: `${SCAN_FROM}30`, color: SCAN_TO }}>나</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {Object.keys(rankingData.baumannDistribution).length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-stone-400 mb-3">{t("ranking.topBaumann")}</p>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(rankingData.baumannDistribution)
                            .sort(([,a],[,b]) => b - a).slice(0, 3)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#F0EDE8] bg-white">
                                <span className="text-[14px] font-black" style={{ color: SCAN_TO }}>{type}</span>
                                <span className="text-[11px] text-stone-400">{count}{t("ranking.people")}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── 마이 페이지 ─────────────────────────────────────────────────
function MyCosmeticsModal({ onClose, onAddNew }: { onClose: () => void; onAddNew: () => void }) {
  const { t } = useTranslation();
  const [list, setList] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const routineGuide = buildRoutineGuide(list, t);

  useEffect(() => {
    fetch("/api/cosmetics").then(r => r.json()).then(data => {
      setList(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/cosmetics/${id}`, { method: "DELETE" }).catch(() => {});
    setList(prev => prev.filter(i => i.id !== id));
    setSelectedItem(prev => (prev?.id === id ? null : prev));
    setDeletingId(null);
  };

  const quickInsights = [
    list[0] ? t("cosmetics.boardRecent", { name: list[0].name }) : null,
    !list.some((item) => item.category === "선크림") ? t("cosmetics.insightSunscreenTitle") : null,
    routineGuide.pm.length === 0 ? t("cosmetics.boardNeedPm") : null,
    routineGuide.cautions[0] ?? null,
  ].filter(Boolean) as string[];

  const sections = [
    {
      key: "am",
      title: t("result.actionCard.phaseMorning"),
      accent: DEEP_GREEN,
      bg: "#F6FBF9",
      border: "#D7ECE4",
      items: routineGuide.am,
    },
    {
      key: "pm",
      title: t("result.actionCard.phaseEvening"),
      accent: SCAN_TO,
      bg: "#FFF7F2",
      border: "#F4DDD3",
      items: routineGuide.pm,
    },
  ];

  return (
    <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md pb-10 shadow-2xl overflow-y-auto max-h-[85vh]"
        initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-5 pb-4 border-b border-stone-100 z-10">
          <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>{t("cosmetics.myTitle")}</p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-sm">✕</button>
          </div>
        </div>

        <div className="px-5 pt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                <Droplets className="w-7 h-7" />
              </div>
              <p className="text-[14px] font-bold text-stone-600 mb-1">{t("cosmetics.myEmpty")}</p>
              <p className="text-[12px] text-stone-400">{t("cosmetics.myEmptyDesc")}</p>
            </div>
          ) : (
            <>
              <div className="rounded-[30px] p-5 border border-[#E8DFD8]" style={{ background: "linear-gradient(180deg, #FFFCFA 0%, #FFFFFF 100%)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("cosmetics.myTitle")}</p>
                    <p className="text-[18px] font-black mt-1" style={{ color: DEEP_GREEN }}>{t("cosmetics.boardHeadline")}</p>
                    <p className="text-[11px] text-stone-400 mt-1">{t("cosmetics.boardSub")}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black"
                    style={{ background: `${SCAN_FROM}16`, color: SCAN_TO }}>
                    {t("cosmetics.ctaCount", { count: list.length })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {quickInsights.slice(0, 3).map((item) => (
                    <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: "#FFF4EE", color: SCAN_TO, border: "1px solid #F3DED6" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {sections.map(({ key, title, accent, bg, border, items }) => (
                  <div key={key} className="rounded-[28px] p-4 border" style={{ background: bg, borderColor: border }}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[15px] font-black" style={{ color: DEEP_GREEN }}>{title}</p>
                        <p className="text-[11px] text-stone-400">
                          {items.length > 0 ? t("cosmetics.boardStepCount", { count: items.length }) : t(key === "am" ? "cosmetics.routineEmptyAm" : "cosmetics.routineEmptyPm")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <button
                          key={`${key}-${item.id}`}
                          onClick={() => setSelectedItem(item)}
                          className="w-full rounded-2xl bg-white border px-3.5 py-3 flex items-center gap-3 text-left"
                          style={{ borderColor: `${accent}20` }}
                        >
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ background: accent }}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-black truncate" style={{ color: DEEP_GREEN }}>{t(`cosmetics.categories.${item.category}`)}</p>
                            <p className="text-[11px] text-stone-400 truncate">{item.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[30px] p-4 border border-[#ECE4DC] bg-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[15px] font-black" style={{ color: DEEP_GREEN }}>{t("cosmetics.collectionTitle")}</p>
                    <p className="text-[11px] text-stone-400">{t("cosmetics.collectionSub")}</p>
                  </div>
                  <button onClick={onAddNew}
                    className="px-3 py-1.5 rounded-full text-[10px] font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                    + {t("cosmetics.ctaBtn")}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {list.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="rounded-[24px] p-3 bg-stone-50 border border-stone-100 text-left shadow-[0_4px_14px_rgba(0,0,0,0.03)]"
                    >
                      {item.image_thumbnail
                        ? <img src={item.image_thumbnail} className="w-full h-28 rounded-2xl object-cover bg-stone-200" />
                        : <div className="w-full h-28 rounded-2xl bg-stone-100 flex items-center justify-center">
                            <Droplets className="w-7 h-7 text-stone-400" />
                          </div>
                      }
                      <div className="mt-3">
                        <p className="text-[12px] font-black text-stone-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-stone-400 truncate">{item.brand || t("cosmetics.noBrand")}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2 py-1 rounded-full text-[9px] font-bold"
                            style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                            {t(`cosmetics.categories.${item.category}`)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-[9px] font-bold"
                            style={{ background: `${SCAN_FROM}14`, color: SCAN_TO }}>
                            {item.time_of_day === "am"
                              ? t("cosmetics.amBtn")
                              : item.time_of_day === "pm"
                              ? t("cosmetics.pmBtn")
                              : inferCosmeticTimeOfDay(item.category) === "am"
                              ? t("cosmetics.amBtn")
                              : t("cosmetics.pmBtn")}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && list.length === 0 && (
            <button onClick={onAddNew}
              className="w-full py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 mt-2"
              style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
              <span>+</span> {t("cosmetics.ctaBtn")}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div className="absolute inset-0 z-[130] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedItem(null)} />
            <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8"
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <div className="flex items-start gap-3">
                {selectedItem.image_thumbnail
                  ? <img src={selectedItem.image_thumbnail} className="w-20 h-20 rounded-[22px] object-cover bg-stone-100 shrink-0" />
                  : <div className="w-20 h-20 rounded-[22px] bg-stone-100 flex items-center justify-center shrink-0">
                      <Droplets className="w-8 h-8 text-stone-400" />
                    </div>
                }
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-black text-stone-800 text-kr-pretty">{selectedItem.name}</p>
                  <p className="text-[12px] text-stone-400 mt-1">{selectedItem.brand || t("cosmetics.noBrand")}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${DEEP_GREEN}12`, color: DEEP_GREEN }}>
                      {t(`cosmetics.categories.${selectedItem.category}`)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${SCAN_FROM}14`, color: SCAN_TO }}>
                      {selectedItem.time_of_day === "am"
                        ? t("cosmetics.amBtn")
                        : selectedItem.time_of_day === "pm"
                        ? t("cosmetics.pmBtn")
                        : inferCosmeticTimeOfDay(selectedItem.category) === "am"
                        ? t("cosmetics.amBtn")
                        : t("cosmetics.pmBtn")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <div className="rounded-2xl p-3" style={{ background: "#F8FAF9", border: "1px solid #E4ECE8" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.openedLabel")}</p>
                  <p className="text-[12px] font-black mt-1" style={{ color: DEEP_GREEN }}>{selectedItem.opened_at || t("cosmetics.detailUnknown")}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#FFF8F4", border: "1px solid #F1DED7" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">{t("cosmetics.detailStatusLabel")}</p>
                  <p className="text-[12px] font-black mt-1" style={{ color: SCAN_TO }}>{t("cosmetics.detailStatusActive")}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] p-4" style={{ background: "#FFFCFA", border: "1px solid #F2E7E2" }}>
                <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.ingredientsLabel")}</p>
                <p className="text-[12px] text-stone-600 mt-2 leading-relaxed whitespace-pre-wrap text-kr-pretty">
                  {selectedItem.ingredients?.trim() || t("cosmetics.ingredientsEmpty")}
                </p>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deletingId === selectedItem.id}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-[13px] border border-stone-200 text-stone-600 bg-stone-50 disabled:opacity-40"
                >
                  {deletingId === selectedItem.id ? "..." : t("cosmetics.deleteConfirm")}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[13px] text-white"
                  style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
                >
                  {t("cosmetics.confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MyScreen({ user, onInstall, onBack, onLogin }: { user: any; onInstall: () => void; onBack: () => void; onLogin?: (p: "kakao"|"line"|"google", tab: string) => void }) {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMyCosmetics, setShowMyCosmetics] = useState(false);
  const [showCosmeticsRegister, setShowCosmeticsRegister] = useState(false);
  const [myCosmetics, setMyCosmetics] = useState<any[]>([]);
  const attendance = getAttendance();

  useEffect(() => {
    if (user) {
      fetch("/api/cosmetics").then(r => r.json()).then(data => {
        setMyCosmetics(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).then(() => window.location.reload());
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] pb-28" style={{ background: "#FAF9F6" }}>
      {/* 헤더 */}
      <div className="px-5 pt-12 pb-6" style={{ borderBottom: "1px solid #F0EDE8" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-stone-400 mb-4 active:opacity-70">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[13px] font-semibold">{t("nav.scan")}</span>
        </button>
        <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>FONDAY</p>
        <h1 className="text-[22px] font-black" style={{ color: DEEP_GREEN }}>{t("nav.my")}</h1>
      </div>

      <div className="px-5 pt-5 space-y-3">
        {/* 프로필 */}
        {user ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100">
            <div className="flex items-center gap-3">
              {user.avatar
                ? <img src={user.avatar} className="w-10 h-10 rounded-full border border-stone-100" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                    <User className="w-5 h-5 text-white" />
                  </div>
              }
              <div>
                <p className="text-[14px] font-bold text-stone-800">{user.username || user.email || "사용자"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {user.provider === "kakao" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-[#3C1E1E]" style={{ background: "#FEE500" }}>
                      <svg width="10" height="10" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                      카카오
                    </span>
                  )}
                  {user.provider === "line" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: "#06C755" }}>
                      <svg width="10" height="10" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                      LINE
                    </span>
                  )}
                  {user.provider === "google" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-stone-600 border border-stone-200 bg-white">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-2.5 h-2.5" />
                      Google
                    </span>
                  )}
                  {user.email && <p className="text-[11px] text-stone-400">{user.email}</p>}
                </div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="text-[12px] font-semibold text-stone-400 px-3 py-1.5 rounded-xl bg-stone-100 active:opacity-70">
              {t("modal.diary.logout")}
            </button>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white border border-stone-100 space-y-3">
            <div className="text-center mb-2">
              <p className="text-[14px] font-bold text-stone-700 mb-1">{t("report.loginRequired")}</p>
              <p className="text-[12px] text-stone-400">{t("attendance.loginDesc")}</p>
            </div>
            {i18n.language === "ko" ? (
              <button onClick={() => onLogin ? onLogin("kakao", "my") : (localStorage.setItem("fonday_return_tab", "my"), window.location.href = "/auth/kakao")}
                className="w-full h-11 rounded-xl font-bold text-[13px] gap-2 flex items-center justify-center border-0 text-[#3C1E1E]"
                style={{ background: "#FEE500" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                {t("attendance.kakao")}
              </button>
            ) : (
              <button onClick={() => onLogin ? onLogin("line", "my") : (localStorage.setItem("fonday_return_tab", "my"), window.location.href = "/auth/line")}
                className="w-full h-11 rounded-xl font-bold text-[13px] gap-2 flex items-center justify-center border-0 text-white"
                style={{ background: "#06C755" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                {t("attendance.line")}
              </button>
            )}
            <button onClick={() => onLogin ? onLogin("google", "my") : (localStorage.setItem("fonday_return_tab", "my"), window.location.href = "/auth/google")}
              className="w-full h-11 rounded-xl font-bold text-[13px] gap-2 border border-stone-200 bg-white text-stone-700 flex items-center justify-center">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
              {t("attendance.google")}
            </button>
          </div>
        )}

        {/* 출석 달력 */}
        <button onClick={() => setShowCalendar(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100 active:opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}30, ${SCAN_TO}20)` }}>
              <CalendarDays className="w-5 h-5" style={{ color: SCAN_TO }} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-stone-800">{t("attendance.calendarTitle")}</p>
              <p className="text-[11px] text-stone-400">{t("attendance.totalPoints", { n: attendance.totalPoints })}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>

        {/* 언어 설정 */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center">
              <span className="text-[16px]">🌐</span>
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.language")}</p>
          </div>
          <div className="flex gap-1">
            {(["en", "ko", "ja"] as const).map(lang => (
              <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  i18n.language === lang ? "text-white" : "text-stone-400 bg-stone-100"
                }`}
                style={i18n.language === lang ? { background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` } : {}}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 화장품 루틴 목록 (로그인 시만) */}
        {user && (
          <button onClick={() => setShowMyCosmetics(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-100 active:opacity-70">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${DEEP_GREEN}15` }}>
              <Droplets className="w-4.5 h-4.5" style={{ color: DEEP_GREEN }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-bold text-stone-800">{t("cosmetics.myTitle")}</p>
              <p className="text-[11px] text-stone-400">
                {myCosmetics.length > 0
                  ? t("cosmetics.ctaCount", { count: myCosmetics.length })
                  : t("cosmetics.myEmpty")}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300" />
          </button>
        )}

        {/* 앱 설치 */}
        <button onClick={onInstall}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100 active:opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center">
              <SmartphoneNfc className="w-5 h-5 text-stone-500" />
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.install")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>

        {/* 매거진 */}
        <a href="https://fonday.replit.app/" target="_blank" rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-100 active:opacity-70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-stone-500" />
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.magazine")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </a>
        {/* Fonday 디바이스 링크 */}
        <a href="https://fonday.replit.app/" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl active:opacity-70 transition-opacity"
          style={{ background: "linear-gradient(135deg, #FFF1EC, #FFEDE6)", border: "1px solid #F3DDD6" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: "#C97062" }}>{t("result.deviceTeaser.title")}</p>
              <p className="text-[11px] text-stone-400">{t("result.deviceTeaser.sub")}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: "#C97062" }} />
        </a>
      </div>

      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>

      {/* 내 화장품 목록 모달 */}
      <AnimatePresence>
        {showMyCosmetics && (
          <MyCosmeticsModal
            onClose={() => setShowMyCosmetics(false)}
            onAddNew={() => { setShowMyCosmetics(false); setShowCosmeticsRegister(true); }}
          />
        )}
      </AnimatePresence>

      {/* 화장품 등록 모달 (MyScreen에서 열기) */}
      <AnimatePresence>
        {showCosmeticsRegister && (
          <CosmeticsRegisterModal
            onClose={() => setShowCosmeticsRegister(false)}
            onSuccess={() => {
              setShowCosmeticsRegister(false);
              fetch("/api/cosmetics").then(r => r.json()).then(data => {
                setMyCosmetics(Array.isArray(data) ? data : []);
              }).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 피부 예측 카드 ────────────────────────────────────────────────
function SkinPredictionCard({ prediction, currentScore, onOpenDiary }: {
  prediction: { good: PredictionScenario; bad: PredictionScenario };
  currentScore: number;
  onOpenDiary?: () => void;
}) {
  const { t } = useTranslation();
  const { good, bad } = prediction;
  const goodDelta = good.score - currentScore;
  const badDelta = bad.score - currentScore;
  const rewardPts = Math.max(goodDelta, 5);

  return (
    <Card className="border border-[#EADFD8] shadow-md rounded-3xl overflow-hidden bg-white/95">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
              style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
              🔮
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.prediction.title")}</p>
              <p className="text-[11px] text-stone-400">{t("result.prediction.currentScore", { score: currentScore })}</p>
            </div>
          </div>
          <div className="rounded-2xl px-3 py-2 text-right shrink-0"
            style={{ background: "#F5F3FF", border: "1px solid #E9D5FF" }}>
            <p className="text-[10px] font-black text-violet-500">{t("result.prediction.rewardLabel")}</p>
            <p className="text-[20px] font-black leading-none text-violet-700">+{rewardPts}</p>
            <p className="text-[9px] text-violet-400 mt-1">{t("result.prediction.rewardSub")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[12px] font-black text-kr-pretty" style={{ color: DEEP_GREEN }}>
            {t("result.prediction.missionTitle")}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full px-2.5 py-1 text-[9px] font-black text-violet-600 bg-violet-50 border border-violet-100">
              {t("result.prediction.daysAfter", { days: good.days })}
            </span>
            <span className="rounded-full px-2.5 py-1 text-[9px] font-black text-stone-500 bg-stone-50 border border-stone-200">
              {t("result.prediction.disclaimer")}
            </span>
          </div>
        </div>

        <div className="grid gap-2.5">
          <div className="rounded-2xl p-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-emerald-600">{t("result.prediction.bestRoute")}</p>
                <p className="text-[12px] font-black text-emerald-700 text-kr-pretty">{good.scenario}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t("result.prediction.goodCaption")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[28px] font-black leading-none text-emerald-600">{good.score}</p>
                <p className="text-[11px] font-black text-emerald-500 mt-0.5">+{goodDelta}</p>
              </div>
            </div>
            <p className="text-[10px] font-black text-emerald-700 mb-2">{t("result.prediction.routine")}</p>
            <div className="space-y-2">
              {good.routine?.map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="text-[11px] font-medium text-stone-700 leading-tight text-kr-pretty">{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-orange-500">{t("result.prediction.riskRoute")}</p>
                <p className="text-[12px] font-black text-orange-700 text-kr-pretty">{bad.scenario}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t("result.prediction.badCaption")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[28px] font-black leading-none text-orange-500">{bad.score}</p>
                <p className="text-[11px] font-black text-orange-400 mt-0.5">-{Math.abs(badDelta)}</p>
              </div>
            </div>
            <p className="text-[10px] font-black text-orange-700 mb-2">{t("result.prediction.risks")}</p>
            <div className="flex flex-wrap gap-1.5">
              {bad.risks?.map((r, i) => (
                <span key={i} className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-stone-600 text-kr-pretty">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl px-3 py-3 flex items-center justify-between gap-3"
          style={{ background: "#FAF5FF", border: "1px solid #E9D5FF" }}>
          <p className="text-[11px] text-stone-500 leading-snug text-kr-pretty">{t("result.prediction.diaryHint")}</p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-600">
              {t("result.prediction.questHint")}
            </span>
            {onOpenDiary && (
              <Button
                onClick={onOpenDiary}
                className="rounded-full h-8 px-3 text-[11px] font-black shadow-none"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
              >
                {t("result.prediction.diaryButton")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 화장품 등록 모달 ─────────────────────────────────────────────
const COSMETIC_CATEGORIES = ["클렌저","토너","세럼","크림","선크림","각질케어","진정케어","장벽케어","아이크림","기타스킨케어"] as const;

/** 이미지 base64 → 300×300 JPEG 70% 압축 */
async function cropFaceFromImage(src: string): Promise<string> {
  try {
    const mp = await import('@mediapipe/face_mesh');
    const { FaceMesh } = mp;
    const img = new Image();
    img.src = src;
    await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
    const faceMesh = new FaceMesh({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
    let lms: any[] = [];
    await new Promise<void>((r) => {
      faceMesh.onResults((res: any) => { if (res.multiFaceLandmarks?.[0]) lms = res.multiFaceLandmarks[0]; r(); });
      faceMesh.send({ image: img });
    });
    faceMesh.close();
    if (!lms.length) return src;
    const xs = lms.map((l: any) => l.x);
    const ys = lms.map((l: any) => l.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    const fW = maxX - minX, fH = maxY - minY;
    minX = Math.max(0, minX - fW * 0.22);
    maxX = Math.min(1, maxX + fW * 0.22);
    minY = Math.max(0, minY - fH * 0.48);
    maxY = Math.min(1, maxY + fH * 0.12);
    const iW = img.naturalWidth, iH = img.naturalHeight;
    const sx = minX * iW, sy = minY * iH, sw = (maxX - minX) * iW, sh = (maxY - minY) * iH;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return src;
  }
}

function compressThumbnail(base64: string, maxSize = 300): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

function CosmeticsRegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
            <p className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>
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
                  <img src={capturedImage} className="w-full h-full object-cover" />
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
                  <p className="text-[11px] text-stone-300">제품 전면이 잘 보이게 찍어주세요</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold border border-stone-200 bg-stone-50 text-stone-700 flex items-center justify-center gap-1.5 active:opacity-70">
                  📷 {t("cosmetics.scanPhoto")}
                </button>
                <button onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold border border-stone-200 bg-stone-50 text-stone-700 flex items-center justify-center gap-1.5 active:opacity-70">
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
                  <img src={capturedImage} className="w-20 h-20 rounded-2xl object-cover bg-stone-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">제품명</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">브랜드</label>
                    <input value={brand} onChange={e => setBrand(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
                  </div>
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.categoryLabel")}</label>
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
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.openedLabel")}</label>
                <input type="date" value={openedAt} onChange={e => setOpenedAt(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 text-[14px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.ingredientsLabel")}</label>
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  rows={3}
                  placeholder={t("cosmetics.ingredientsPlaceholder")}
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-[13px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl font-bold text-[13px] border border-stone-200 text-stone-600 bg-stone-50">
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
              <div className="text-4xl text-center mb-3">🙅‍♀️</div>
              <p className="text-[16px] font-black text-stone-800 text-center mb-2">{t("cosmetics.notSkincareTitle")}</p>
              <p className="text-[13px] text-stone-500 text-center leading-relaxed whitespace-pre-line mb-5">
                {t("cosmetics.notSkincareDesc", { type: nonSkincareType })}
              </p>
              <div className="space-y-2.5">
                <button onClick={() => { setShowNonSkincareAlert(false); setStep(2); }}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-bold border border-stone-200 text-stone-600 bg-stone-50">
                  {t("cosmetics.notSkincareKeep")}
                </button>
                <button onClick={() => { setShowNonSkincareAlert(false); onClose(); }}
                  className="w-full py-3.5 rounded-2xl text-[13px] font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
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

function ResultScreen({ surveyData, analysisResult, imageSrc, faceCroppedSrc, imageBase64, onBack, onGoMagazine, onOpenDiary, user }: any) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showBaumannInfo, setShowBaumannInfo] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const tabNavRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const analysisDrag = useDragControls();
  const improvementsDrag = useDragControls();
  const nutrientsDrag = useDragControls();
  const diaryDrag = useDragControls();
  const [showNutrients, setShowNutrients] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [diaryTab, setDiaryTab] = useState<"history" | "compare" | "ranking">("history");
  const [pendingChallengeToken, setPendingChallengeToken] = useState<string | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [streakDelta, setStreakDelta] = useState<number>(0);
  const [missionPops, setMissionPops] = useState<string[]>([]);
  const [showCheckinSheet, setShowCheckinSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<"routine" | "solution" | "nutrition">("routine");
  const tabDirectionRef = useRef<1 | -1>(1);
  const [currentStreak, setCurrentStreak] = useState<StreakData>(() => getStreak());
  const [todayTodoProgress, setTodayTodoProgress] = useState(() => getDiaryTodoProgress(todayStr()));
  const [todayRoutineTodos, setTodayRoutineTodos] = useState<TodoItem[]>(() => getDiaryTodos(todayStr()));
  const [missionState, setMissionState] = useState<MissionState>(() => getMissions());
  const [todayHasMemo, setTodayHasMemo] = useState(() => Boolean(getDiaryMemo(todayStr()).trim()));
  const loginPromptRef = useRef<HTMLDivElement>(null);
  // 화장품 기능
  const [cosmeticCount, setCosmeticCount] = useState(0);
  const [myCosmetics, setMyCosmetics] = useState<CosmeticItem[]>([]);
  const [showCosmeticsGate, setShowCosmeticsGate] = useState(false);
  const [showCosmeticsRegister, setShowCosmeticsRegister] = useState(false);
  const [showRoutineUpdateSheet, setShowRoutineUpdateSheet] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("fonday_onboarding_done"));
  const [showQuestSheet, setShowQuestSheet] = useState(false);

  // 챌린지 참여 후 내 결과 저장 (비로그인도 작동)
  useEffect(() => {
    const token = sessionStorage.getItem('battleChallengeToken');
    if (!token) return;
    setPendingChallengeToken(token);
    const sc = analysisResult?.scores ?? [];
    const ov = sc[0]?.score ?? 0;
    const isOilyCh = (sc[1]?.score ?? 0) > 50;
    const isSensCh = (sc[3]?.score ?? 100) < 60;
    const isPigCh  = (sc[5]?.score ?? 0) > 50;
    const isWrinkCh = (sc[4]?.score ?? 100) < 60;
    const bt = `${isOilyCh?"O":"D"}${isSensCh?"S":"R"}${isPigCh?"P":"N"}${isWrinkCh?"W":"T"}`;
    sessionStorage.setItem('battleMyResult', JSON.stringify({
      overallScore: String(ov),
      scores: sc,
      baumannType: bt,
      skinAge: analysisResult?.skinAge,
      aiComment: analysisResult?.aiComment ?? "",
      createdAt: new Date().toISOString(),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스캔 완료 → 스트릭 업데이트 + 미션 체크
  useEffect(() => {
    if (!analysisResult) return;
    const overallScore = analysisResult.scores?.[0]?.score || 0;
    const { streak, isNewMilestone, deltaScore } = updateStreak(overallScore);
    setCurrentStreak(streak);
    setStreakDelta(deltaScore);
    // Bug 3 fix: timeout ID 수집 후 cleanup 반환
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (isNewMilestone) {
      setStreakMilestone(streak.count);
      timers.push(setTimeout(() => setStreakMilestone(null), 3000));
    }
    const newMissions = checkAndCompleteMissions(streak.count, overallScore, deltaScore);
    setMissionState(getMissions());
    if (newMissions.length > 0) {
      setMissionPops(newMissions);
      timers.push(setTimeout(() => setMissionPops([]), 3500));
    }
    // 출석 체크인 (오늘 첫 스캔이면 팝업)
    const isNew = checkinToday();
    if (isNew) {
      timers.push(setTimeout(() => setShowCheckinSheet(true), 1200));
    }
    // 예측 루틴 → 오늘 Todo로 자동 저장 (오늘 처음이면)
    if (analysisResult?.prediction?.good?.routine) {
      initDiaryTodosFromRoutine(todayStr(), analysisResult.prediction.good.routine);
    }
    setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
    setTodayRoutineTodos(getDiaryTodos(todayStr()));
    setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    // 로그인 사용자 → 스트릭/출석 서버 동기화
    if (user) {
      fetch("/api/user-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak,
          attendance: getAttendance(),
          missionState: getMissions(),
        }),
      }).catch(() => {});
    }
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshTodayState = () => {
      setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
      setTodayRoutineTodos(getDiaryTodos(todayStr()));
      setMissionState(getMissions());
      setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshTodayState();
    };
    window.addEventListener("focus", refreshTodayState);
    window.addEventListener("fonday:diary-updated", refreshTodayState as EventListener);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", refreshTodayState);
      window.removeEventListener("fonday:diary-updated", refreshTodayState as EventListener);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const openLoginPopup = useCallback((provider: "kakao" | "line" | "google", returnTab?: string) => {
    if (returnTab) localStorage.setItem("fonday_return_tab", returnTab);
    if (analysisResult) localStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    if (provider === "line") {
      // LINE은 iOS에서 LINE 앱 딥링크 → 콜백이 새 Safari 탭으로 열림
      // window.open으로 PWA 창을 유지하고, 앱으로 돌아올 때 visibilitychange로 로그인 감지
      localStorage.setItem("fonday_login_pending", "1");
      window.open(`/auth/${provider}`, "_blank");
    } else {
      window.location.href = `/auth/${provider}`;
    }
  }, [analysisResult, surveyData, imageBase64]);

  const handleGoogleLogin = () => openLoginPopup("google");
  const handleKakaoLogin = () => openLoginPopup("kakao");
  const handleLineLogin = () => openLoginPopup("line");
  const isKo = i18n.language === "ko";
  const socialLoginButton = isKo ? (
    <Button onClick={handleKakaoLogin}
      className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
      style={{ background: "#FEE500" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
      </svg>
      {t("result.login.kakao")}
    </Button>
  ) : (
    <Button onClick={handleLineLogin}
      className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-white"
      style={{ background: "#06C755" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/>
      </svg>
      {t("result.login.line")}
    </Button>
  );
  const handleDiaryEntry = () => {
    if (user) {
      onOpenDiary?.();
      return;
    }
    loginPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const handleOpenDiaryCalendar = () => {
    sessionStorage.setItem("fonday_diary_target_tab", "calendar");
    handleDiaryEntry();
  };
  const [isSuccess, setIsSuccess] = useState(false);

  // ── 푸시 알림 구독 상태 ──────────────────────────────────────
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [aiCareSettings, setAICareSettings] = useState<AICareSettings>(() => getAICareSettings());
  const pushBaumannType = buildBaumannTypeFromResult(analysisResult);
  const aiCareLabels = i18n.language?.startsWith("en")
    ? {
        title: "AI Care",
        desc: "All-day skin coaching: scan, meals, hydration, UV, weather & bedtime routine.",
        on: "AI Care On",
        off: "Turn On AI Care",
        scan: "📷 Scan",
        meal: "🥗 Meals",
        hydration: "💧 Hydration",
        routine: "✨ Routine",
        uvCare: "☀️ UV",
        bedtime: "🌙 Bedtime",
        weatherCare: "🌤 Weather",
        schedule: "08:00 Weather · 07:30 Scan · 10:00 UV · 12:00 Lunch · 15:00 Water · 18:00 Dinner · Routine · 23:00 Bedtime",
      }
    : i18n.language?.startsWith("ja")
      ? {
          title: "AI密着ケア",
          desc: "スキャン・食事・水分・UV・天気・就寝ケアまで丸ごと管理します。",
          on: "AI密着ケア ON",
          off: "AI密着ケアを有効化",
          scan: "📷 スキャン",
          meal: "🥗 食事",
          hydration: "💧 水分",
          routine: "✨ ルーティン",
          uvCare: "☀️ UV",
          bedtime: "🌙 就寝",
          weatherCare: "🌤 天気",
          schedule: "08:00 天気 · 07:30 スキャン · 10:00 UV · 12:00 昼食 · 15:00 水分 · 18:00 夕食 · ルーティン · 23:00 就寝",
        }
      : {
          title: "AI 밀착케어",
          desc: "하루 종일 피부 코칭: 스캔, 식단, 수분, UV, 날씨, 취침 루틴까지.",
          on: "AI 밀착케어 ON",
          off: "AI 밀착케어 켜기",
          scan: "📷 스캔",
          meal: "🥗 식단",
          hydration: "💧 수분",
          routine: "✨ 루틴",
          uvCare: "☀️ UV",
          bedtime: "🌙 취침",
          weatherCare: "🌤 날씨",
          schedule: "08:00 날씨 · 07:30 스캔 · 10:00 UV · 12:00 점심 · 15:00 수분 · 18:00 저녁 · 루틴 · 23:00 취침",
        };

  const syncPushSubscription = async (subscription: PushSubscriptionJSON, nextCareSettings: AICareSettings) => {
    await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        baumannType: pushBaumannType,
        lang: i18n.language || "ko",
        scoreSummary: buildPushScoreSummary(analysisResult),
        careSettings: nextCareSettings,
      }),
    });
  };

  useEffect(() => {
    // 이미 구독 중인지 확인
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => {
        if (sub) setPushSubscribed(true);
      });
    }
  }, []);

  // 결과 화면 로드 후 2.5초 뒤 푸시 구독 유도
  useEffect(() => {
    if (!analysisResult) return;
    const timer = setTimeout(() => {
      if (!pushSubscribed && shouldShowPushPrompt()) {
        setShowPushPrompt(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult]);

  // 구독 성공 시 프롬프트 자동 닫기
  useEffect(() => {
    if (pushSubscribed) setShowPushPrompt(false);
  }, [pushSubscribed]);

  useEffect(() => {
    if (!analysisResult || !pushSubscribed) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    navigator.serviceWorker.ready
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (!existing || cancelled) return;

        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: existing.toJSON(),
            baumannType: pushBaumannType,
            lang: i18n.language || "ko",
            scoreSummary: buildPushScoreSummary(analysisResult),
            careSettings: aiCareSettings,
          }),
        });
        await syncReminderToServer(getReminderSettings());
      })
      .catch((error) => console.error("[push-sync]", error));

    return () => {
      cancelled = true;
    };
  }, [aiCareSettings, analysisResult, pushBaumannType, pushSubscribed]);

  const handlePushToggle = async (forceEnabled?: boolean) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert(t("nutrients.pushUnsupported")); return;
    }
    if (Notification.permission === "denied") {
      alert(t("nutrients.pushDenied")); return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      const shouldEnable = forceEnabled ?? !pushSubscribed;
      if (existing && !shouldEnable) {
        // 구독 해제
        const nextCare = { ...aiCareSettings, enabled: false };
        setAICareSettings(nextCare);
        saveAICareSettings(nextCare);
        await syncReminderToServer({ ...getReminderSettings(), enabled: false });
        await fetch("/api/push-subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
        setPushSubscribed(false);
      } else {
        // 권한 요청 + 구독
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { setPushLoading(false); return; }
        const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC,
        });
        const nextCare = { ...aiCareSettings, enabled: true };
        setAICareSettings(nextCare);
        saveAICareSettings(nextCare);
        await syncPushSubscription(sub.toJSON(), nextCare);
        await syncReminderToServer({
          ...getReminderSettings(),
          enabled: nextCare.routine,
          hour: nextCare.routineHour,
          minute: nextCare.routineMinute,
        });
        setPushSubscribed(true);
      }
    } catch (e) { console.error("[push]", e); }
    setPushLoading(false);
  };

  const updateAICareOption = async (key: "scan" | "meal" | "hydration" | "routine" | "uvCare" | "bedtime" | "weatherCare", value: boolean) => {
    const next = { ...aiCareSettings, [key]: value };
    setAICareSettings(next);
    saveAICareSettings(next);
    if (key === "routine") {
      saveReminderSettings({
        ...getReminderSettings(),
        enabled: value,
        hour: next.routineHour,
        minute: next.routineMinute,
      });
      await syncReminderToServer({
        ...getReminderSettings(),
        enabled: value,
        hour: next.routineHour,
        minute: next.routineMinute,
      });
    }
    if (!pushSubscribed) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await syncPushSubscription(sub.toJSON(), next);
    } catch (error) {
      console.error("[ai-care-option]", error);
    }
  };

  // 히스토리 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    fetch("/api/scans")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [user]);

  // 등록된 화장품 수 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    fetch("/api/cosmetics")
      .then(r => r.ok ? r.json() : [])
      .then((data: CosmeticItem[]) => {
        const next = Array.isArray(data) ? data : [];
        setMyCosmetics(next);
        setCosmeticCount(next.length);
      })
      .catch(() => {});
  }, [user]);

  // 랭킹 데이터 로드 (Bug 2 fix: analysisResult 의존성 추가)
  useEffect(() => {
    const score = analysisResult?.scores?.[0]?.score || 0;
    fetch(`/api/ranking?myScore=${score}`)
      .then(res => res.json())
      .then(data => setRankingData(data))
      .catch(() => {});
  }, [analysisResult]);

  // 비로그인 챌린지 토큰 생성 (로그인 여부 확정 후 즉시)
  const [guestTokenFetched, setGuestTokenFetched] = useState(false);
  useEffect(() => {
    if (!analysisResult || user !== null || guestTokenFetched) return;
    setGuestTokenFetched(true);
    const KO_AGE_GROUPS = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
    fetch("/api/challenge-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallScore: analysisResult.scores?.[0]?.score || 0,
        baumannType: finalType,
        scores: analysisResult.scores,
        skinAge: analysisResult.skinAge,
        aiComment: analysisResult.aiComment,
        lang: i18n.language || "ko",
        gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
        ageGroup: KO_AGE_GROUPS[surveyData?.ageIdx ?? 2] ?? "",
      }),
    }).then(res => res.json()).then(data => {
      if (data?.shareToken) {
        setCurrentShareToken(data.shareToken);
        // 로그인 후 연결을 위해 localStorage에도 보관
        try { localStorage.setItem("fonday_guest_token", data.shareToken); } catch {}
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, analysisResult]);

  // 스캔 저장 (로그인 + 분석결과 둘 다 준비됐을 때)
  useEffect(() => {
    if (!user || !analysisResult || isSaved) return;
    // Bug 1 fix: 한국어 label 하드코딩 제거 → index 0 (항상 종합점수)
    const overallScore = analysisResult.scores[0]?.score || 0;
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallScore,
        skinAge: analysisResult.skinAge ?? null,
        baumannType: finalType,
        scores: analysisResult.scores,
        hotspots: analysisResult.hotspots,
        aiComment: analysisResult.aiComment,
        improvements: analysisResult.improvements ?? [],
        cosmetics: analysisResult.cosmetics ?? [],
        lang: i18n.language || "ko",
        gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
        ageGroup: ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"][surveyData?.ageIdx ?? 2] ?? "",
      })
    }).then(res => res.json()).then(data => {
      setIsSaved(true);
      if (data?.id) setCurrentScanId(data.id);
      if (data?.shareToken) setCurrentShareToken(data.shareToken);
      // D1에도 저장 (관리자 통계용)
      const KO_AGE_GROUPS2 = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
      fetch("/api/challenge-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallScore,
          baumannType: finalType,
          scores: analysisResult.scores,
          skinAge: analysisResult.skinAge,
          aiComment: analysisResult.aiComment,
          lang: i18n.language || "ko",
          isGuest: false,
          gender: (surveyData?.genderIdx ?? 0) === 0 ? "female" : "male",
          ageGroup: KO_AGE_GROUPS2[surveyData?.ageIdx ?? 2] ?? "",
        }),
      }).catch(() => {});
    }).catch(() => {}); // Bug 4 fix: .catch() 추가
  }, [user, analysisResult]);

  // 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    const el = resultScrollRef.current;
    if (!el) return;
    el.style.overflow = (showAnalysis || showImprovements) ? 'hidden' : 'auto';
  }, [showAnalysis, showImprovements]);

  const tabSlideVariants = {
    enter: (dir: number) => ({ x: dir * 30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -30, opacity: 0 }),
  };
  const TAB_ORDER = { routine: 0, solution: 1, nutrition: 2 } as const;
  const goTo = (next: "routine" | "solution" | "nutrition") => {
    tabDirectionRef.current = TAB_ORDER[next] >= TAB_ORDER[activeTab] ? 1 : -1;
    setActiveTab(next);
  };

  // 탭 전환 시 탭 바 위치로 스크롤 (렌더 후 실행)
  useEffect(() => {
    const nav = tabNavRef.current;
    const container = resultScrollRef.current;
    if (nav && container) container.scrollTo({ top: nav.offsetTop, behavior: "smooth" });
  }, [activeTab]);

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnerSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xzdjpden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });
      if (res.ok) {
        setIsPartnerSuccess(true);
        setTimeout(() => { setShowPartnership(false); setIsPartnerSuccess(false); setPartnerForm({ name: "", company: "", email: "", message: "" }); }, 2000);
      }
    } catch { alert("오류가 발생했습니다."); }
    finally { setIsPartnerSubmitting(false); }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData, analysisResult }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { setShowWaitlist(false); setIsSuccess(false); setEmail(""); }, 2000);
      }
    } catch { alert("오류가 발생했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const scores = analysisResult?.scores || [];
  // Labels from server are always Korean (REQUIRED_LABELS), so we match by Korean label OR by index
  const overallScore = scores[0]?.score || 0;
  const isOily  = (scores[3]?.score ?? 100) < 50;  // index 3 = 모공 상태
  const isSens  = (scores[2]?.score ?? 0) > 50;    // index 2 = 붉은기 수준
  const isPig   = (scores[5]?.score ?? 0) > 50;    // index 5 = 잡티/색소침착
  const isWrink = (scores[4]?.score ?? 100) < 60;  // index 4 = 주름 및 탄력
  const finalType = `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`;
  const previousScore = history.length > 0 ? parseInt(history[0]?.overallScore || "0", 10) || null : null;
  const cosmeticsInsights = buildCosmeticsInsights(myCosmetics, overallScore, previousScore, t);
  const routineGuide = buildRoutineGuide(myCosmetics, t);
  const todayRoutine = analysisResult?.prediction?.good?.routine ?? [];
  const morningTask = todayRoutine[0] ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.fallbackFocus");
  const eveningTask = todayRoutine[1] ?? analysisResult?.improvements?.[1]?.title ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.eveningFallback");
  const morningRoutineItems = routineGuide.amSteps.length > 0
    ? routineGuide.amSteps
    : [morningTask];
  const eveningRoutineItems = routineGuide.pmSteps.length > 0
    ? routineGuide.pmSteps
    : [eveningTask];
  const routineUpdateItems = [
    ...morningRoutineItems.map((item) => `AM · ${item}`),
    ...eveningRoutineItems.map((item) => `PM · ${item}`),
  ];
  const getRoutineTodoState = (period: "AM" | "PM", label: string) => {
    const prefixed = `${period} · ${label}`;
    return todayRoutineTodos.find((todo) => todo.text === prefixed || todo.text === label);
  };
  const isRoutinePeriodComplete = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return false;
    return items.every((item) => Boolean(getRoutineTodoState(period, item)?.done));
  };
  const setRoutinePeriodCompletion = (period: "AM" | "PM", items: string[]) => {
    if (items.length === 0) return;
    const next = [...todayRoutineTodos];
    const shouldComplete = !isRoutinePeriodComplete(period, items);
    items.forEach((item) => {
      const prefixed = `${period} · ${item}`;
      const existingIndex = next.findIndex((todo) => todo.text === prefixed || todo.text === item);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], text: prefixed, done: shouldComplete };
      } else {
        next.push({ text: prefixed, done: shouldComplete });
      }
    });
    setTodayRoutineTodos(next);
    saveDiaryTodos(todayStr(), next);
  };
  const todayMissionRoutines = [morningTask, eveningTask].filter(Boolean);
  const todayFocus = todayMissionRoutines.join(" · ") || analysisResult?.improvements?.[0]?.title || t("result.actionCard.fallbackFocus");
  const routineDone = todayTodoProgress.done;
  const routineTotal = todayTodoProgress.total || todayRoutine.length;
  const routineComplete = routineTotal > 0 && routineDone === routineTotal;
  const morningRoutineComplete = isRoutinePeriodComplete("AM", morningRoutineItems);
  const eveningRoutineComplete = isRoutinePeriodComplete("PM", eveningRoutineItems);
  const completedRoutinePhases = [morningRoutineComplete, eveningRoutineComplete].filter(Boolean).length;
  const weakestScores: { index: number; score: number }[] = scores
    .slice(1)
    .map((item: any, index: number) => ({ index: index + 1, score: item.score }))
    .sort((a: { index: number; score: number }, b: { index: number; score: number }) => a.score - b.score)
    .slice(0, 2);
  const weakestSummary = weakestScores.map(({ index }: { index: number; score: number }) => t(`scores.${index}`)).join(" · ");
  const scoreDelta = previousScore !== null ? overallScore - previousScore : null;
  const previewScoreItems: { idx: number; score: number; color: string }[] = [1, 2, 3, 5]
    .map((idx) => ({ idx, score: scores[idx]?.score ?? 0, color: SCORE_COLORS[idx] || DEEP_GREEN }))
    .filter((item: { idx: number; score: number; color: string }) => item.score > 0);
  const nextStreakGoal = [3, 7, 30].find((goal) => goal > (currentStreak.count || 0)) ?? null;
  const daysToGoal = nextStreakGoal ? Math.max(nextStreakGoal - (currentStreak.count || 0), 0) : 0;
  const nextStreakReward = nextStreakGoal ? MISSION_POINTS[`streak_${nextStreakGoal}`] || 0 : 0;
  const attendance = getAttendance();
  const totalPoints = missionState.totalPoints + attendance.totalPoints;
  const dailyImproved = missionState.dailyDate === todayStr() && missionState.dailyImproved;
  const dailyChallenged = missionState.dailyDate === todayStr() && missionState.dailyChallenged;
  const questBoard = [
    {
      id: "scan",
      done: missionState.dailyCompleted,
      label: t("result.actionCard.questScan"),
      reward: `+${MISSION_POINTS.daily_scan}pt`,
      detail: t("result.actionCard.questScanDetail"),
      accent: "#C97062",
    },
    {
      id: "routine",
      done: routineComplete,
      label: t("result.actionCard.questRoutine"),
      reward: routineComplete ? t("result.actionCard.questDone") : `${completedRoutinePhases}/2`,
      detail: t("result.actionCard.questRoutineDetail"),
      accent: "#059669",
    },
    {
      id: "memo",
      done: todayHasMemo,
      label: t("result.actionCard.questMemo"),
      reward: todayHasMemo ? t("result.actionCard.questDone") : t("result.actionCard.questPending"),
      detail: t("result.actionCard.questMemoDetail"),
      accent: "#7C3AED",
    },
    {
      id: "improve",
      done: dailyImproved,
      label: t("result.actionCard.questImprove"),
      reward: dailyImproved ? `+${MISSION_POINTS.daily_improve}pt` : `+${MISSION_POINTS.daily_improve}pt`,
      detail: t("result.actionCard.questImproveDetail"),
      accent: "#0284C7",
    },
    {
      id: "challenge_share",
      done: dailyChallenged,
      label: t("result.actionCard.questChallenge"),
      reward: `+${MISSION_POINTS.daily_challenge}pt`,
      detail: t("result.actionCard.questChallengeDetail"),
      accent: "#7C3AED",
    },
  ];
  const essentialQuestIds = new Set(["scan", "routine", "memo"]);
  const essentialQuests = questBoard.filter((quest) => essentialQuestIds.has(quest.id));
  const questDoneCount = questBoard.filter((quest) => quest.done).length;
  const questProgressPct = Math.round((questDoneCount / questBoard.length) * 100);
  const allClearBonus = questDoneCount === questBoard.length ? 20 : 0;
  const firstIncompleteQuest = questBoard.find((q) => !q.done);
  const questStatusDetail = questDoneCount === questBoard.length
    ? t("result.actionCard.statusDone")
    : firstIncompleteQuest
      ? t("result.actionCard.statusNext", { tasks: firstIncompleteQuest.label })
      : "";

  const parseFoodOptions = (value?: string): string[] => {
    if (!value) return [];
    const delimiter = value.includes("|") ? "|" : "·";
    return value
      .split(delimiter)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const pickFoodOption = (value: string | undefined, seed: number, fallbackIndex = 0): string | null => {
    const options = parseFoodOptions(value);
    if (options.length === 0) return null;
    const normalizedSeed = Math.abs(Math.round(seed));
    return options[normalizedSeed % options.length] ?? options[Math.min(fallbackIndex, options.length - 1)] ?? null;
  };

  const dedupeFoods = (items: ({ food: string; why: string } | null)[]) => {
    const seen = new Set<string>();
    return items.filter((item): item is { food: string; why: string } => {
      if (!item?.food) return false;
      if (seen.has(item.food)) return false;
      seen.add(item.food);
      return true;
    });
  };

  // 날짜 기반 시드 — 매일 다른 음식 추천 (YYYYMMDD 정수)
  const dailySeed = (() => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  })();

  // 점수 기반 피해야 할 음식 키 (바우만 외 추가 항목)
  const scoreAvoidKeys: string[] = [];
  if ((scores[1]?.score ?? 100) < 50) scoreAvoidKeys.push("hydration");
  if ((scores[6]?.score ?? 0) > 60)   scoreAvoidKeys.push("trouble");
  if ((scores[7]?.score ?? 0) > 60)   scoreAvoidKeys.push("darkCircle");
  if ((scores[8]?.score ?? 100) < 50) scoreAvoidKeys.push("glow");

  // 점심 피해야 할 음식 (바우만 4글자 + 점수 기반 통합)
  const avoidLunch: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.lunch, overallScore + idx + l.charCodeAt(0) + dailySeed);
      return food ? { food, why: d.lunchWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 1]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  // 저녁 피해야 할 음식 (바우만 4글자 + 점수 기반 통합)
  const avoidDinner: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.dinner, overallScore + idx + l.charCodeAt(0) + 5 + dailySeed);
      return food ? { food, why: d.dinnerWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 5]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + 7 + dailySeed);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  const handleShare = async () => {
    if (shareLoading) return;
    markShareUsed();
    setShareLoading(true);
    try {
      // i18n 문자열 미리 resolve
      const scoreLabels = Array.from({ length: 10 }, (_, i) => t(`scores.${i}`));
      const baumannNames: Record<string, string> = {};
      ["O","D","S","R","P","N","W","T"].forEach(l => { baumannNames[l] = t(`baumann.${l}.name`); });

      // nutrients: 바우만 글자별 첫 번째 영양소
      const nutrients: Record<string, { name: string; foods: string; why: string }> = {};
      finalType.split("").forEach(letter => {
        const arr = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
        if (arr?.[0]) nutrients[letter] = arr[0];
      });

      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

      const i18nTexts = {
        rankLabel: t("share.rankLabel"),
        overallScoreLabel: t("share.overallScoreLabel"),
        skinAgeLabel: t("share.skinAgeLabel"),
        skinAgeSuffix: t("share.skinAgeSuffix"),
        slide2Sub: t("share.slide2Sub"),
        slide3Sub: t("share.slide3Sub"),
        recIngredient: t("share.recIngredient"),
        slide4Sub: t("share.slide4Sub"),
        slide5Sub: t("share.slide5Sub"),
        footerText: t("share.footerText"),
      };

      const body = {
        lang: i18n.language,
        finalType,
        overallScore,
        skinAge: analysisResult?.skinAge,
        aiComment: analysisResult?.aiComment ?? "",
        rankingPercentile: rankingData?.myPercentile,
        scores: (analysisResult?.scores ?? []).map((s: any) => ({ score: s.score, label: s.label })),
        improvements: (analysisResult?.improvements ?? []).slice(0, 3),
        cosmetics: (analysisResult?.cosmetics ?? []).slice(0, 2),
        nutrients,
        avoidLunch,
        avoidDinner,
        scoreLabels,
        baumannNames,
        scoreSuffix: t("result.scoreSuffix"),
        dateStr,
        i18nTexts,
      };

      const shareController = new AbortController();
      const shareTimeout = setTimeout(() => shareController.abort(), 20000);
      const res = await fetch("/api/generate-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: shareController.signal,
      }).finally(() => clearTimeout(shareTimeout));
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        throw new Error(`generate-share failed: ${res.status} | ${errBody?.error ?? ""}: ${errBody?.detail ?? ""}`);
      }

      const { slides } = await res.json() as { slides: string[] };
      if (!slides?.length) throw new Error("no slides returned");

      const files: File[] = slides.map((dataUrl, i) => {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
        return new File([bytes], `fonday-reels-${i + 1}.png`, { type: "image/png" });
      });

      const shareText = t("result.shareText", { score: overallScore, type: finalType });
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: "Fonday AI 피부 분석", text: shareText });
      } else {
        for (const file of files) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = file.name;
          a.click();
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (e) {
      console.error("[share]", e);
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          alert("이미지 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
        } else {
          alert(`공유 실패: ${e.message}`);
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <>
    {/* 스트릭 마일스톤 팝업 */}
    <AnimatePresence>
      {streakMilestone && (
        <motion.div
          key="milestone"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-16 left-1/2 z-[999] -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-[15px] text-center"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          {t("streak.milestone", { count: streakMilestone })}
        </motion.div>
      )}
    </AnimatePresence>

    {/* 미션 달성 팝업 */}
    <AnimatePresence>
      {missionPops.length > 0 && (
        <motion.div
          key="missionpop"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 z-[999] -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl bg-white border border-stone-100 flex flex-col items-center gap-1 min-w-[200px]"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        >
          <span className="text-2xl">🎯</span>
          <p className="font-black text-stone-800 text-[14px]">{t("mission.newAchieve")}</p>
          <p className="text-[12px] text-stone-500">{t(`mission.${missionPops[0]}`)}</p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 출석 체크인 팝업 */}
    <AnimatePresence>
      {showCheckinSheet && (
        <CheckinSuccessSheet
          user={user}
          onKakao={() => { setShowCheckinSheet(false); handleKakaoLogin(); }}
          onLine={() => { setShowCheckinSheet(false); handleLineLogin(); }}
          onGoogle={() => { setShowCheckinSheet(false); handleGoogleLogin(); }}
          onDismiss={() => setShowCheckinSheet(false)}
        />
      )}
    </AnimatePresence>

    {/* 푸시 구독 유도 바텀시트 */}
    <AnimatePresence>
      {showPushPrompt && (
        <PushPromptSheet
          isLoading={pushLoading}
          onAllow={async () => {
            await handlePushToggle();
            dismissPushPrompt();
            setShowPushPrompt(false);
          }}
          onDismiss={() => {
            dismissPushPrompt();
            setShowPushPrompt(false);
          }}
        />
      )}
    </AnimatePresence>

    {/* ── 공유 슬라이드는 서버사이드(generate-share.ts)에서 생성됨 ── */}
    <div ref={resultScrollRef} className="h-[calc(100dvh-60px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-40 space-y-6" variants={stagger} initial="initial" animate="animate">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-full gap-1.5 hover:bg-rose-50"
            style={{ borderColor: SCAN_TO, color: SCAN_TO }}>
            <Camera className="w-4 h-4" /> {t("result.back")}
          </Button>
          <h2 className="text-xl font-black tracking-tight" style={{ color: DEEP_GREEN }}>{t("result.title")}</h2>
        </div>

        {/* 압축형 결과 헤더 */}
        <Card className="overflow-hidden border-none shadow-2xl rounded-3xl"
          style={{ background: "linear-gradient(180deg, #FFFCFA 0%, #FFFFFF 100%)" }}>
          <CardContent className="p-3.5">
            <div className="grid grid-cols-[92px_1fr] gap-2.5 items-start sm:grid-cols-[104px_1fr] sm:gap-3">
              <div>
                <div className="relative rounded-[22px] overflow-hidden h-[120px] bg-stone-100 sm:rounded-[24px] sm:h-[132px]">
                  <img src={faceCroppedSrc || imageSrc} className="w-full h-full object-cover" style={{ objectPosition: "center 50%" }} />
                  <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
                  <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
                  <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: SCAN_TO }} />
                  <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: SCAN_TO }} />
                </div>
                <div className="mt-2 rounded-2xl px-2.5 py-2 text-center"
                  style={{ background: "#FFF1EC", border: "1px solid #F3DDD6" }}>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.baumannLabel")}</p>
                  <p className="text-[18px] font-black leading-none mt-1" style={{ color: SCAN_TO }}>{finalType}</p>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="rounded-[20px] px-2.5 py-2.5 mb-2.5 sm:rounded-[22px] sm:px-3"
                  style={{ background: `${SCAN_FROM}10`, border: `1px solid ${SCAN_FROM}24` }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.scores")}</p>
                    <button
                      onClick={() => setShowAnalysis(true)}
                      className="rounded-full px-2.5 py-1 text-[9px] font-black whitespace-nowrap"
                      style={{ background: "#FFF1EC", color: SCAN_TO }}
                    >
                      {t("modal.analysis.title")} {t("result.viewBtn")}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">
                    {scoreDelta !== null
                      ? scoreDelta > 0
                        ? `${t("result.overall")} +${scoreDelta}`
                        : scoreDelta < 0
                        ? `${t("result.overall")} -${Math.abs(scoreDelta)}`
                        : `${t("result.overall")} ${overallScore}`
                      : `${t("result.actionCard.phaseRecord")} · ${weakestSummary || t("result.scores")}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {previewScoreItems.map(({ idx, score, color }: { idx: number; score: number; color: string }, i: number) => (
                    <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={i * 80} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-[18px] px-2 py-4 flex flex-col items-center justify-center text-center" style={{ background: "#FFF4EE", border: "1px solid #F3DED6" }}>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-stone-400">{t("result.overall")}</p>
                <p className="text-[40px] font-black leading-none mt-1.5" style={{ color: SCAN_TO }}>{overallScore}</p>
              </div>
              <div className="rounded-[18px] px-2 py-4 flex flex-col items-center justify-center text-center" style={{ background: "#F7F3FF", border: "1px solid #E9DDFF" }}>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-stone-400">{t("result.skinAge")}</p>
                <p className="text-[40px] font-black leading-none mt-1.5" style={{ color: "#7C3AED" }}>
                  {analysisResult?.skinAge && analysisResult.skinAge > 0 ? analysisResult.skinAge : "—"}
                </p>
              </div>
              <div className="rounded-[18px] px-2 py-4 flex flex-col items-center justify-center text-center" style={{ background: "#FFF8EE", border: "1px solid #F4E2C4" }}>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-stone-400">{t("ranking.topLabel")}</p>
                <p className="text-[34px] font-black leading-none mt-1.5" style={{ color: "#D97706" }}>
                  {rankingData && rankingData.myPercentile !== undefined ? t("ranking.myPercentile", { percent: rankingData.myPercentile }) : "—"}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-[22px] p-3"
              style={{ background: "linear-gradient(180deg, #FFF7F2 0%, #FFFCFA 100%)", border: "1px solid #F2E3DB" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>{t("result.baumannLabel")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[18px] font-black leading-none" style={{ color: DEEP_GREEN }}>{finalType}</p>
                      <button onClick={() => setShowBaumannInfo(v => !v)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                        style={{ background: `${SCAN_TO}18`, color: SCAN_TO }}>
                        {showBaumannInfo ? t("result.baumannFold") : t("result.baumannExpand")}
                      </button>
                    </div>
                    <p className="text-[11px] font-medium mt-1 text-stone-500 text-kr-pretty">{t("result.mbtiSub")}</p>
                  </div>
                  <div className="rounded-full px-3 py-1 text-[10px] font-black shrink-0"
                    style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN }}>
                    {t("streak.badge", { count: currentStreak.count || 1 })}
                  </div>
                </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {finalType.split("").map((letter, i) => {
                  const color = BAUMANN_COLORS[letter];
                  if (!color) return null;
                  return (
                    <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ color, background: `${color}12`, borderColor: `${color}22` }}>
                      {t(`baumann.${letter}.name`)}
                    </span>
                  );
                })}
              </div>
              <AnimatePresence>
                {showBaumannInfo && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="mt-2 grid grid-cols-2 gap-1.5">
                    {finalType.split("").map((letter) => {
                      const color = BAUMANN_COLORS[letter];
                      if (!color) return null;
                      return (
                        <div key={letter} className="rounded-2xl p-2.5"
                          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                          <p className="text-[12px] font-black" style={{ color }}>{letter} — {t(`baumann.${letter}.name`)}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">{t(`baumann.${letter}.desc`)}</p>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
              {analysisResult?.aiComment && (
                <button
                  onClick={() => setShowAnalysis(true)}
                  className="mt-3 block w-full rounded-2xl px-3 py-2.5 text-left"
                  style={{ background: "#FFFFFF", border: "1px solid #F0E2DA" }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("result.aiComment")}</p>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed text-kr-pretty line-clamp-2">
                    {analysisResult.aiComment}
                  </p>
                  <p className="text-[10px] font-black mt-2" style={{ color: SCAN_TO }}>{t("modal.analysis.title")} {t("result.viewBtn")}</p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── 오늘의 핵심 액션 카드 ── */}
        {(analysisResult?.improvements ?? []).length > 0 && (() => {
          const top = (analysisResult.improvements as { title: string; desc: string }[])[0];
          return (
            <motion.div variants={fadeChild} className="rounded-[20px] p-4"
              style={{ background: "linear-gradient(135deg, #FFF5F0, #FFF9F7)", border: "1px solid #F3DDD6" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>🎯</div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                  {t("result.todayAction")}
                </p>
              </div>
              <p className="text-[14px] font-black text-stone-800 leading-tight mb-1">{top.title}</p>
              <p className="text-[11px] text-stone-500 leading-relaxed">{top.desc}</p>
            </motion.div>
          );
        })()}

        {/* ── 3탭 네비게이션 ── */}
        <div ref={tabNavRef} className="rounded-[28px] p-2.5 border border-[#F0E6E0] sticky top-0 z-20 backdrop-blur-md"
          style={{ background: "linear-gradient(180deg, rgba(255,249,246,0.97) 0%, rgba(255,255,255,0.97) 100%)" }}>
          <div className="flex gap-2">
            {([
              { id: "routine" as const,   label: t("result.tab.routine"),   icon: <CheckCircle2 className="w-4 h-4" />, from: "#10B981", to: "#047857",  inactiveBg: "#ECFDF5", inactiveText: "#059669" },
              { id: "solution" as const,  label: t("result.tab.solution"),  icon: <Leaf className="w-4 h-4" />,         from: SCAN_FROM, to: SCAN_TO,   inactiveBg: "#FFF6F1", inactiveText: "#C97062" },
              { id: "nutrition" as const, label: t("result.tab.nutrition"), icon: <Utensils className="w-4 h-4" />,     from: "#F97316", to: "#C2410C", inactiveBg: "#FFF7ED", inactiveText: "#C2410C" },
            ]).map(({ id, label, icon, from, to, inactiveBg, inactiveText }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} onClick={() => goTo(id)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[20px] text-[12px] font-black transition-all"
                  style={isActive
                    ? { background: `linear-gradient(135deg, ${from}, ${to})`, color: "white", boxShadow: `0 4px 14px ${to}55` }
                    : { background: inactiveBg, color: inactiveText, border: `1.5px solid ${to}40` }}>
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden"
          onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            if (startX == null) return;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) < 40) return;
            const cur = TAB_ORDER.indexOf(activeTab);
            if (diff < 0 && cur < TAB_ORDER.length - 1) goTo(TAB_ORDER[cur + 1]);
            else if (diff > 0 && cur > 0) goTo(TAB_ORDER[cur - 1]);
          }}>
        <AnimatePresence mode="wait" initial={false} custom={tabDirectionRef.current}>
        {/* ── 루틴 탭 ── */}
        {activeTab === "routine" && (
          <motion.div key="routine" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <div className="space-y-4">

        {/* 첫 방문자 온보딩 카드 */}
        {showOnboarding && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-4 flex items-start gap-3"
            style={{ background: "#FFF5F0", border: "1px solid #F3DDD6" }}
          >
            <span className="text-xl shrink-0 mt-0.5">✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-stone-800 mb-0.5">{t("result.onboarding.title")}</p>
              <p className="text-[11px] text-stone-500 leading-relaxed text-kr-pretty">{t("result.onboarding.sub")}</p>
              <button
                onClick={() => { localStorage.setItem("fonday_onboarding_done", "1"); setShowOnboarding(false); }}
                className="mt-2 text-[11px] font-black rounded-full px-3 py-1 text-white"
                style={{ background: "linear-gradient(135deg, #f87171, #C97062)" }}
              >
                {t("result.onboarding.dismiss")}
              </button>
            </div>
          </motion.div>
        )}

        {/* 퀘스트 / 미션 카드 */}
        <Card className="border border-[#EADFD8] rounded-3xl overflow-hidden shadow-[0_12px_30px_rgba(201,112,98,0.12)] bg-white">
          <CardContent className="p-3.5">
            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("result.actionCard.missionEyebrow")}</p>
              <p className="text-[16px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("result.actionCard.title")}</p>
              <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed text-kr-pretty">{questStatusDetail}</p>
            </div>
            <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
                initial={{ width: 0 }}
                animate={{ width: `${questProgressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 mt-3">
              <p className="text-[10px] text-stone-500 line-clamp-1">
                {nextStreakGoal
                  ? t("result.actionCard.streakGoal", { days: daysToGoal, goal: nextStreakGoal, reward: nextStreakReward })
                  : t("result.actionCard.streakDone")}
              </p>
              <button
                onClick={() => setShowQuestSheet(true)}
                className="rounded-full px-3 py-1.5 text-[10px] font-black shrink-0 text-white"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
              >
                {t("result.actionCard.questTitle", { done: essentialQuests.filter((quest) => quest.done).length, total: essentialQuests.length })}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 루틴 체크 카드 */}
        <Card className="border border-[#E6ECE8] shadow-md rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: DEEP_GREEN }}>{t("diary.routineTitle")}</p>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[13px] font-bold leading-snug" style={{ color: DEEP_GREEN }}>
                    🌅 {t("cosmetics.amBtn")}: {morningRoutineItems.join(" + ")}
                  </p>
                  <p className="text-[13px] font-bold leading-snug" style={{ color: SCAN_TO }}>
                    🌙 {t("cosmetics.pmBtn")}: {eveningRoutineItems.join(" + ")}
                  </p>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">{t("cosmetics.routineCoachDesc")}</p>
              </div>
              <Button
                onClick={handleDiaryEntry}
                className="rounded-full h-8 px-3 text-[11px] font-black shadow-none shrink-0"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}
              >
                {t("result.actionCard.diaryButton")}
              </Button>
            </div>

            <div className="grid gap-3 mt-4 md:grid-cols-2">
              <button
                onClick={() => setRoutinePeriodCompletion("AM", morningRoutineItems)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left"
                style={{ background: "#F7FBFA", border: "1px solid #DDECE7" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sun className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
                  <p className="text-[11px] font-bold truncate" style={{ color: DEEP_GREEN }}>{morningRoutineItems.join(" → ")}</p>
                </div>
                <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                  morningRoutineComplete ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                }`}>
                  {morningRoutineComplete && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>

              <button
                onClick={() => setRoutinePeriodCompletion("PM", eveningRoutineItems)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left"
                style={{ background: "#FFF8F4", border: "1px solid #F1DED7" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Moon className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                  <p className="text-[11px] font-bold truncate" style={{ color: SCAN_TO }}>{eveningRoutineItems.join(" → ")}</p>
                </div>
                <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 ${
                  eveningRoutineComplete ? "border-emerald-400 bg-emerald-400" : "border-stone-200 bg-white"
                }`}>
                  {eveningRoutineComplete && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            </div>

            {(routineGuide.goodMixes.length > 0 || routineGuide.cautions.length > 0 || cosmeticsInsights.length > 0) && (
              <div className="mt-4 rounded-[24px] p-4" style={{ background: "#FFFCFA", border: "1px solid #F2E7E2" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.insightTitle")}</p>
                    <p className="text-[11px] text-stone-400">{t("cosmetics.ctaCount", { count: cosmeticCount })}</p>
                  </div>
                  <button
                    onClick={() => user ? setShowCosmeticsRegister(true) : setShowCosmeticsGate(true)}
                    className="rounded-full px-3 py-1.5 text-[10px] font-black text-white whitespace-nowrap"
                    style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
                  >
                    + {t("cosmetics.scanBtn")}
                  </button>
                </div>
                {myCosmetics.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] p-3" style={{ background: "#F8FFFB", border: "1px solid #D8EFE4" }}>
                      <p className="text-[11px] font-black" style={{ color: DEEP_GREEN }}>{t("cosmetics.goodComboTitle")}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {routineGuide.goodMixes.length > 0 ? routineGuide.goodMixes.slice(0, 3).map((item, index) => (
                          <span key={`good-mix-${index}`} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: "#ECFDF5", color: "#059669" }}>
                            {item}
                          </span>
                        )) : (
                          <p className="text-[10px] text-stone-400 mt-1">{t("cosmetics.goodComboEmpty")}</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-[20px] p-3" style={{ background: "#FFF8F2", border: "1px solid #F5DDCF" }}>
                      <p className="text-[11px] font-black" style={{ color: "#C2410C" }}>{t("cosmetics.cautionTitle")}</p>
                      <div className="mt-2 space-y-1.5">
                        {routineGuide.cautions.length > 0 ? routineGuide.cautions.slice(0, 2).map((item, index) => (
                          <div key={`caution-note-${index}`} className="flex items-start gap-2">
                            <span className="text-[11px] font-black mt-0.5" style={{ color: "#EA580C" }}>!</span>
                            <p className="text-[11px] text-stone-600 leading-relaxed text-kr-pretty">{item}</p>
                          </div>
                        )) : (
                          <p className="text-[10px] text-stone-400 mt-1">{t("cosmetics.cautionEmpty")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

            {/* 피부 일기 카드 / 로그인 카드 */}
            {user === undefined ? (
              <div className="h-16 rounded-3xl bg-stone-100 animate-pulse" />
            ) : user ? (
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => onOpenDiary?.()} className="cursor-pointer">
                <Card className="rounded-3xl overflow-hidden" style={{ background: "#FDFCFB", border: "1.5px solid #DDD4CB", boxShadow: "0 2px 12px rgba(150,110,90,0.10)" }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                        <LineChartIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.diary.title")}</p>
                        <p className="text-[11px] text-stone-400">
                          {t("result.diary.scanCount", { n: history.filter((h: any) => new Date(h.createdAt).toISOString().slice(0, 10) !== todayStr()).length + 1 })}
                        </p>
                      </div>
                      {user.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full border border-stone-100 shrink-0" />}
                    </div>
                    {/* 점수 변화 강조 — 서버 history 기반 delta */}
                    {(() => {
                      const delta = previousScore !== null ? overallScore - previousScore : 0;
                      return (
                        <div className="mt-3 rounded-2xl p-3"
                          style={{ background: delta > 0 ? "#F0FDF4" : delta < 0 ? "#FFF5F5" : "#F8F7F5" }}>
                          {previousScore !== null ? (
                            <div className="flex items-center gap-3">
                              <span className="text-[28px] font-black leading-none"
                                style={{ color: delta > 0 ? "#059669" : delta < 0 ? "#DC2626" : "#A8A29E" }}>
                                {delta > 0 ? "▲" : delta < 0 ? "▼" : "―"} {t("result.diary.deltaPoint", { n: Math.abs(delta) })}
                              </span>
                              <p className="text-[11px] text-stone-500 leading-snug whitespace-pre-line">
                                {delta > 0 ? t("result.diary.improved") : delta < 0 ? t("result.diary.worse") : t("result.diary.noChange")}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[12px] font-bold text-stone-500">{t("result.diary.firstScan")}</p>
                          )}
                        </div>
                      );
                    })()}
                    {/* 하단 stat pills */}
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1 rounded-2xl py-2 px-2 text-center" style={{ background: "#FFF5F0" }}>
                        <p className="text-[9px] font-bold text-stone-400 mb-0.5">{t("result.diary.streak")}</p>
                        <p className="text-[14px] font-black" style={{ color: SCAN_TO }}>{currentStreak.count || 1}🔥</p>
                      </div>
                      <div className="flex-1 rounded-2xl py-2 px-2 text-center" style={{ background: "#F0FDF4" }}>
                        <p className="text-[9px] font-bold text-stone-400 mb-0.5">{t("result.totalScans")}</p>
                        <p className="text-[14px] font-black" style={{ color: "#059669" }}>{history.length + 1}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onOpenDiary?.(); }}
                        className="flex-1 rounded-2xl py-2 px-2 flex flex-col items-center justify-center gap-0.5 text-white active:scale-95 transition-all"
                        style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, #2D5F4F)` }}>
                        <BookOpen className="w-3.5 h-3.5" />
                        <p className="text-[9px] font-black">{t("result.diaryView")}</p>
                      </button>
                    </div>
                    {/* 이전 측정 기록 미니 히스토리 */}
                    {history.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-stone-100">
                        <p className="text-[9px] font-bold text-stone-400 mb-1.5">{t("result.prevRecords")}</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                          {[...history].slice(0, 5).map((h: any, i: number) => {
                            const sc = parseInt(h.overallScore || "0", 10);
                            const d = new Date(h.createdAt);
                            const label = `${d.getMonth() + 1}/${d.getDate()}`;
                            return (
                              <div key={i} className="flex flex-col items-center shrink-0 px-2.5 py-1.5 rounded-xl"
                                style={{ background: "#F5F2EE", minWidth: 36 }}>
                                <p className="text-[11px] font-black" style={{ color: SCAN_TO }}>{sc}</p>
                                <p className="text-[8px] text-stone-400 mt-0.5">{label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div ref={loginPromptRef}>
              <Card className="border-2 border-dashed rounded-3xl p-6 text-center" style={{ borderColor: "#F5D5CC", background: "#FDF8F7" }}>
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-bold" style={{ color: DEEP_GREEN }}>{t("result.login.title")}</CardTitle>
                  <CardDescription className="text-xs">{t("result.login.desc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {socialLoginButton}
                  <Button onClick={handleGoogleLogin}
                    className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                    {t("result.login.google")}
                  </Button>
          </CardContent>
        </Card>
            {/* 다음 탭 유도 */}
            <button
              onClick={() => goTo("solution")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-black text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
              <Leaf className="w-4 h-4" />
              <span>{t("result.tab.solution")} →</span>
            </button>
          </div>
        )}

          </div>
          </motion.div>
        )}

        {/* ── 솔루션 탭 ── */}
        {activeTab === "solution" && (
          <motion.div key="solution" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <div className="space-y-4">

            {/* 화장품 스캔 배너 */}
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border"
              style={{ background: "#F0F7F5", borderColor: "#C5DFD8" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${DEEP_GREEN}14`, color: DEEP_GREEN }}>
                <ScanLine className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black leading-tight text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("cosmetics.ctaTitle")}</p>
                <p className="text-[11px] text-stone-400 leading-tight text-kr-pretty">{t("cosmetics.ctaBannerSub")}</p>
              </div>
              {user && cosmeticCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                  style={{ background: `${DEEP_GREEN}15`, color: DEEP_GREEN }}>
                  {t("cosmetics.ctaCount", { count: cosmeticCount })}
                </span>
              )}
              <button onClick={() => user ? setShowCosmeticsRegister(true) : setShowCosmeticsGate(true)}
                className="shrink-0 px-4 py-2 rounded-xl text-white text-[12px] font-black"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                + {t("cosmetics.scanBtn")}
              </button>
            </div>

            <div className="space-y-3">

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("modal.improvements.title")}</p>
                <p className="text-[11px] text-stone-400">{t("modal.improvements.sub")}</p>
              </div>
            </div>
            {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} className="flex gap-3 p-4 rounded-2xl border"
                style={{ background: i === 0 ? "#FDF1EE" : i === 1 ? "#F0F7F5" : "#F5F0FF", borderColor: i === 0 ? "#F5D5CC" : i === 1 ? "#C5DFD8" : "#DDD5F5" }}>
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black"
                    style={{ background: i === 0 ? `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` : i === 1 ? `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` : "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                    {i + 1}
                  </div>
                  <p className="text-[9px] font-bold text-center mt-0.5"
                    style={{ color: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>STEP</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-stone-800 mb-0.5">{item.title}</p>
                  <p className="text-[12px] text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
            {(analysisResult?.improvements ?? []).length === 0 && (
              <p className="text-center text-sm text-stone-400 py-6">{t("modal.improvements.loading")}</p>
            )}
            {(analysisResult?.cosmetics ?? []).length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                  <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("modal.improvements.cosmetics")}</p>
                </div>
                {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                  <motion.div key={`c-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[13px] font-black text-stone-800">{item.type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: "#D97706" }}>{item.key}</span>
                      </div>
                      <p className="text-[12px] text-stone-500 leading-relaxed">{item.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            </div>

            {/* ── AI 피부 예측 카드 ── */}
            {analysisResult?.prediction && (
              <SkinPredictionCard
                prediction={analysisResult.prediction}
                currentScore={analysisResult.scores[0]?.score ?? 0}
                onOpenDiary={handleDiaryEntry}
              />
            )}

            {/* ── AI 밀착케어 ── */}
            <div className="rounded-[20px] p-4" style={{ background: "#FFFBF7", border: "1px solid #F3E4D8" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}>
                    🤖
                  </div>
                  <div>
                    <p className="text-[13px] font-black" style={{ color: SCAN_TO }}>{aiCareLabels.title}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{aiCareLabels.schedule}</p>
                  </div>
                </div>
                <button onClick={() => handlePushToggle()} disabled={pushLoading}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
                  style={pushSubscribed
                    ? { background: `${DEEP_GREEN}18`, color: DEEP_GREEN, border: `1px solid ${DEEP_GREEN}33` }
                    : { background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white" }}>
                  {pushLoading ? "..." : pushSubscribed ? aiCareLabels.on : aiCareLabels.off}
                </button>
              </div>
              {pushSubscribed && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {([
                    ["scan", aiCareLabels.scan],
                    ["meal", aiCareLabels.meal],
                    ["hydration", aiCareLabels.hydration],
                    ["routine", aiCareLabels.routine],
                    ["uvCare", aiCareLabels.uvCare],
                    ["bedtime", aiCareLabels.bedtime],
                    ["weatherCare", aiCareLabels.weatherCare],
                  ] as const).map(([key, label]) => (
                    <button key={key}
                      onClick={() => updateAICareOption(key, !aiCareSettings[key])}
                      className="rounded-full px-3 py-1 text-[11px] font-black"
                      style={aiCareSettings[key]
                        ? { background: `${SCAN_FROM}20`, color: SCAN_TO, border: `1px solid ${SCAN_TO}33` }
                        : { background: "#F6F3EE", color: "#9A8F80", border: "1px solid #ECE6DE" }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Fonday 디바이스 티저 (잠금 → 기대감 카드) ── */}
            <div className="rounded-[24px] overflow-hidden border"
              style={{ background: "linear-gradient(135deg, #FFF8F5 0%, #FFF1EC 100%)", borderColor: "#F3DDD6" }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: SCAN_TO }}>COMING SOON</p>
                    <p className="text-[17px] font-black mt-1" style={{ color: DEEP_GREEN }}>{t("result.deviceTeaser.title")}</p>
                    <p className="text-[11px] text-stone-400 mt-1">{t("result.deviceTeaser.sub")}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "linear-gradient(135deg, #FFEDE6, #FFD9CD)" }}>
                    🔬
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: Thermometer, label: t("result.locked.skinTemp"), color: "#E09882" },
                    { icon: Droplets, label: t("result.locked.moisture"), color: "#3B82C4" },
                    { icon: Flame, label: t("result.locked.oil"), color: "#F59E0B" },
                    { icon: Shield, label: t("result.locked.barrier"), color: "#10B981" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                        <p className="text-[11px] font-semibold text-stone-600">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
                <Button onClick={() => setShowWaitlist(true)}
                  className="w-full h-11 rounded-xl text-white text-[12px] font-bold"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <span className="flex items-center gap-1.5">{t("result.earlybird")} <ArrowRight className="w-4 h-4" /></span>
                </Button>
              </div>
            </div>
            {/* 다음 탭 유도 */}
            <button
              onClick={() => goTo("nutrition")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-black text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #F97316, #C2410C)" }}>
              <Utensils className="w-4 h-4" />
              <span>{t("result.tab.nutrition")} →</span>
            </button>
          </div>
          </motion.div>
        )}

        {/* ── 영양 탭 ── */}
        {activeTab === "nutrition" && (
          <motion.div key="nutrition" custom={tabDirectionRef.current} variants={tabSlideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: "easeInOut" }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black" style={{ color: "#7C3AED" }}>{t("nutrients.supplementsTitle")}</p>
                <p className="text-[11px] text-stone-400">{t("nutrients.supplementsSub")}</p>
              </div>
            </div>

            {!analysisResult?.nutritionTips ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-400">
                <span className="text-3xl">💊</span>
                <p className="text-[12px]">{t("nutrients.loadingTips")}</p>
              </div>
            ) : (
              <>
                {/* 영양제 추천 */}
                <div className="space-y-2">
                  {analysisResult.nutritionTips.supplements.map((item: { emoji: string; name: string; dose: string; reason: string; targetScore: string }, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 p-3.5 rounded-2xl"
                      style={{ background: "linear-gradient(135deg, #F5F3FF, #FAF8FF)", border: "1px solid #DDD6FE" }}>
                      <span className="text-2xl shrink-0 mt-0.5">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-[13px] font-black text-stone-800">{item.name}</p>
                          <span className="text-[9px] font-black rounded-full px-2 py-0.5 text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                            {SCORE_LABEL_MAP[item.targetScore] !== undefined ? t(`scores.${SCORE_LABEL_MAP[item.targetScore]}`) : item.targetScore}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: "#7C3AED" }}>💊 {item.dose}</p>
                        <p className="text-[11px] text-stone-500 leading-relaxed">{item.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 수분 목표 */}
                {analysisResult.nutritionTips.hydrationGoal && (
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                    <span className="text-xl shrink-0">💧</span>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 mb-0.5">{t("nutrients.hydrationLabel")}</p>
                      <p className="text-[12px] text-stone-600 leading-relaxed">{analysisResult.nutritionTips.hydrationGoal}</p>
                    </div>
                  </div>
                )}

                {/* 피해야 할 것 */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-3 pt-2 border-t border-stone-100">
                    <span className="text-base">⚠️</span>
                    <p className="text-[13px] font-black" style={{ color: "#D97706" }}>{t("nutrients.avoidTitle")}</p>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.nutritionTips.avoidFoods.map((item: { emoji: string; food: string; reason: string }, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl"
                        style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-stone-700 mb-0.5">{item.food}</p>
                          <p className="text-[11px] text-stone-400">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          </motion.div>
        )}

        </AnimatePresence>
        </div>

        {/* ── 제휴 텍스트 링크 ── */}
        <div className="pt-2 pb-1 text-center">
          <button onClick={() => setShowPartnership(true)}
            className="text-[11px] text-stone-400 underline underline-offset-2 hover:text-stone-600 transition-colors">
            {t("result.partnershipLink")}
          </button>
        </div>

      </motion.div>

      {/* ── 하단 고정 액션바 ── */}
      <div className="fixed left-0 right-0 z-[50] flex items-center gap-2.5 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-stone-100"
        style={{ bottom: 60, boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        {/* 공유 */}
        <Button onClick={handleShare} disabled={shareLoading}
          className="flex-1 h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-[#f09433] via-[#bc1888] to-[#8a3ab9] flex items-center justify-center gap-1.5">
          {shareLoading
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <><Share2 className="w-4 h-4" /><span className="text-[12px]">{t("result.share")}</span></>}
        </Button>
        {/* 챌린지 */}
        {pendingChallengeToken ? (
          <Button onClick={() => { sessionStorage.removeItem('battleChallengeToken'); window.location.href = `/battle/${pendingChallengeToken}`; }}
            className="flex-1 h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}>
            <Trophy className="w-4 h-4" /><span className="text-[12px]">{t("result.challengeResult")}</span>
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 rounded-2xl font-bold flex items-center justify-center gap-1"
            style={currentShareToken
              ? { background: "linear-gradient(135deg, #ec4899, #f43f5e)", color: "white" }
              : { background: "#F3F4F6", color: "#9CA3AF" }}
            disabled={!currentShareToken}
            onClick={() => {
              if (!currentShareToken) return;
              markChallengeUsed();
              const shareUrl = `${window.location.origin}/battle/${currentShareToken}`;
              if (navigator.share) {
                navigator.share({ title: 'Fonday AI 피부 챌린지!', text: t("result.shareText", { score: overallScore, type: finalType }), url: shareUrl }).catch(console.error);
              } else {
                navigator.clipboard.writeText(shareUrl).then(() => alert(t("result.challengeLinkCopied")));
              }
            }}>
            <span className="text-base">👑</span><span className="text-[12px]">{t("result.challengeShort")}</span>
          </Button>
        )}
      </div>

      {/* 주요 분석결과 모달 */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAnalysis(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={analysisDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowAnalysis(false); }}>
              <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => analysisDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                      <LayoutGrid className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>{t("modal.analysis.title")}</h3>
                      <p className="text-[11px] text-stone-400">{t("modal.analysis.sub")}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAnalysis(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-3">
                  {analysisResult?.aiComment && (
                    <div className="p-4 rounded-2xl border"
                      style={{ background: "#FFF7F2", borderColor: "#F2DDD4" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.aiComment")}</p>
                      </div>
                      <p className="text-[13px] text-stone-600 leading-relaxed text-kr-pretty">{analysisResult.aiComment}</p>
                    </div>
                  )}
                  {/* 10가지 항목별 분석 내용 */}
                  {scores.map((item: any, i: number) => {
                    const Icon = SCORE_ICONS[i] || Zap;
                    const color = SCORE_COLORS[i] || DEEP_GREEN;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl border border-stone-100 bg-stone-50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                            <Icon className="w-3 h-3" style={{ color }} />
                          </div>
                          <span className="text-[12px] font-black" style={{ color }}>{t(`scores.${i}`)}</span>
                          <span className="ml-auto text-[12px] font-black" style={{ color }}>{item.score}{t("result.scoreSuffix")}</span>
                        </div>
                        <p className="text-[13px] text-stone-600 leading-relaxed">{item.comment || "-"}</p>
                      </motion.div>
                    );
                  })}
                  {/* 피부 부위별 소견 */}
                  {(analysisResult?.skinReport ?? []).length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("modal.analysis.skinReport")}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(analysisResult!.skinReport as { area: string; finding: string }[]).map((item, i) => (
                          <div key={i} className="p-3 rounded-2xl border border-stone-100 bg-stone-50">
                            <p className="text-[12px] font-black mb-1" style={{ color: DEEP_GREEN_LIGHT }}>{item.area}</p>
                            <p className="text-[11px] text-stone-500 leading-snug">{item.finding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 바우만 타입 설명 */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                      <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>
                        {t("modal.analysis.baumannDetail", { type: finalType })}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {finalType.split("").map((letter, i) => {
                        const color = BAUMANN_COLORS[letter];
                        if (!color) return null;
                        return (
                          <div key={i} className="p-3 rounded-2xl border"
                            style={{ background: `${color}10`, borderColor: `${color}30` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[17px] font-black" style={{ color }}>{letter}</span>
                              <span className="text-[12px] font-bold text-stone-700">{t(`baumann.${letter}.name`)}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 leading-snug">{t(`baumann.${letter}.desc`)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 맞춤솔루션 모달 */}
      <AnimatePresence>
        {showImprovements && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowImprovements(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={improvementsDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowImprovements(false); }}>
              <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => improvementsDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                      <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>{t("modal.improvements.title")}</h3>
                      <p className="text-[11px] text-stone-400">{t("modal.improvements.sub")}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowImprovements(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-3">
                  {/* 3단계 개선 방안 */}
                  {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 p-4 rounded-2xl border"
                      style={{ background: i === 0 ? "#FDF1EE" : i === 1 ? "#F0F7F5" : "#F5F0FF", borderColor: i === 0 ? "#F5D5CC" : i === 1 ? "#C5DFD8" : "#DDD5F5" }}>
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black"
                          style={{ background: i === 0 ? `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` : i === 1 ? `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` : "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                          {i + 1}
                        </div>
                        <p className="text-[9px] font-bold text-center mt-0.5"
                          style={{ color: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>
                          STEP
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-stone-800 mb-0.5">{item.title}</p>
                        <p className="text-[12px] text-stone-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                  {(analysisResult?.improvements ?? []).length === 0 && (
                    <p className="text-center text-sm text-stone-400 py-6">{t("modal.improvements.loading")}</p>
                  )}

                  {/* 추천 화장품 */}
                  {(analysisResult?.cosmetics ?? []).length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-2 pb-1">
                        <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("modal.improvements.cosmetics")}</p>
                      </div>
                      {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                        <motion.div key={`c-${i}`}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.07 }}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, #F59E0B, #D97706)` }}>
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[13px] font-black text-stone-800">{item.type}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                                style={{ background: "#D97706" }}>{item.key}</span>
                            </div>
                            <p className="text-[12px] text-stone-500 leading-relaxed">{item.reason}</p>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 영양성분 모달 */}
      <AnimatePresence>
        {showNutrients && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowNutrients(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={nutrientsDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowNutrients(false); }}>
              <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => nutrientsDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                      <Utensils className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: "#D97706" }}>{t("nutrients.sectionTitle")}</h3>
                      <p className="text-[11px] text-stone-400">{t("nutrients.sectionSub")}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNutrients(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-3">
                  {finalType.split("").filter(l => l in NUTRIENT_COLORS).map((letter, i) => {
                    const arr = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
                    const nutrient = arr?.[0];
                    if (!nutrient) return null;
                    const color = NUTRIENT_COLORS[letter];
                    return (
                      <motion.div key={letter}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-3 p-4 rounded-2xl border"
                        style={{ background: `${color}0D`, borderColor: `${color}33` }}>
                        <div className="shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                            style={{ background: `${color}22` }}>
                            {NUTRIENT_ICONS[letter]}
                          </div>
                          <p className="text-[9px] font-black text-center mt-0.5" style={{ color }}>{letter}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold mb-0.5" style={{ color }}>{nutrient.name}</p>
                          <p className="text-[12px] text-stone-500 leading-relaxed mb-1.5">{nutrient.why}</p>
                          <p className="text-[11px] text-stone-400">
                            <span className="font-bold" style={{ color }}>{t("nutrients.foodLabel")} </span>
                            {nutrient.foods}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* 오늘 피해야 할 음식 */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-3 pt-2 border-t border-stone-100">
                      <span className="text-base">⚠️</span>
                      <p className="text-[13px] font-black" style={{ color: "#D97706" }}>{t("nutrients.avoidTitle")}</p>
                    </div>
                    {/* 점심 */}
                    <div className="rounded-2xl p-4 mb-2.5" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-sm">☀️</span>
                        <span className="text-[12px] font-black text-orange-700">{t("nutrients.avoidLunch")}</span>
                      </div>
                      <div className="space-y-2">
                        {avoidLunch.map(({ food, why }, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-[11px] font-black text-orange-400 shrink-0 mt-0.5">✕</span>
                            <div>
                              <p className="text-[12px] font-bold text-stone-700">{food}</p>
                              <p className="text-[11px] text-stone-400">{why}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 저녁 */}
                    <div className="rounded-2xl p-4" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="text-sm">🌙</span>
                        <span className="text-[12px] font-black text-violet-700">{t("nutrients.avoidDinner")}</span>
                      </div>
                      <div className="space-y-2">
                        {avoidDinner.map(({ food, why }, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-[11px] font-black text-violet-400 shrink-0 mt-0.5">✕</span>
                            <div>
                              <p className="text-[12px] font-bold text-stone-700">{food}</p>
                              <p className="text-[11px] text-stone-400">{why}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 화장품 로그인 게이트 바텀시트 */}
      <AnimatePresence>
        {showCosmeticsGate && (
          <motion.div className="fixed inset-0 z-[110] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCosmeticsGate(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-10 shadow-2xl"
              initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #1A3B2E, #2D5F4F)" }}>
                  🧴
                </div>
                <div>
                  <p className="text-[16px] font-black" style={{ color: DEEP_GREEN }}>{t("cosmetics.loginGateTitle")}</p>
                  <p className="text-[12px] text-stone-400 font-semibold">{t("cosmetics.loginGateSubtitle")}</p>
                </div>
              </div>
              {/* 설명 */}
              <p className="text-[13px] text-stone-600 mb-3 leading-relaxed">{t("cosmetics.loginGateDesc")}</p>
              {/* 기능 목록 */}
              <div className="rounded-2xl p-4 mb-5 space-y-2.5" style={{ background: "#F0F7F5" }}>
                {[
                  t("cosmetics.loginGateBullet1"),
                  t("cosmetics.loginGateBullet2"),
                  t("cosmetics.loginGateBullet3"),
                  t("cosmetics.loginGateBullet4"),
                  t("cosmetics.loginGateBullet5"),
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: DEEP_GREEN }}>
                      <span className="text-white text-[10px] font-black">✓</span>
                    </div>
                    <span className="text-[12px] text-stone-700 font-medium">{b}</span>
                  </div>
                ))}
              </div>
              {/* 로그인 버튼 */}
              <div className="space-y-2.5">
                {i18n.language === "ko" ? (
                  <button onClick={() => { setShowCosmeticsGate(false); openLoginPopup("kakao", "scan"); }}
                    className="w-full py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2"
                    style={{ background: "#FEE500", color: "#3C1E1E" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                    {t("cosmetics.loginGateKakao")}
                  </button>
                ) : (
                  <button onClick={() => { setShowCosmeticsGate(false); openLoginPopup("line", "scan"); }}
                    className="w-full py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2 text-white"
                    style={{ background: "#06C755" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                    {t("cosmetics.loginGateLine")}
                  </button>
                )}
                <button onClick={() => { setShowCosmeticsGate(false); openLoginPopup("google", "scan"); }}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                  {t("cosmetics.loginGateGoogle")}
                </button>
                <button onClick={() => setShowCosmeticsGate(false)}
                  className="w-full py-2.5 text-[13px] font-semibold text-stone-400">
                  {t("cosmetics.loginGateLater")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 화장품 등록 모달 */}
      <AnimatePresence>
        {showCosmeticsRegister && (
          <CosmeticsRegisterModal
            onClose={() => setShowCosmeticsRegister(false)}
            onSuccess={() => {
              setShowCosmeticsRegister(false);
              fetch("/api/cosmetics")
                .then(r => r.ok ? r.json() : [])
                .then((data: CosmeticItem[]) => {
                  const next = Array.isArray(data) ? data : [];
                  setMyCosmetics(next);
                  setCosmeticCount(next.length);
                  if (next.length > 0) setShowRoutineUpdateSheet(true);
                })
                .catch(() => {});
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRoutineUpdateSheet && (
          <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRoutineUpdateSheet(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-8 shadow-2xl"
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
              <p className="text-[16px] font-black text-center" style={{ color: DEEP_GREEN }}>{t("cosmetics.routineUpdateTitle")}</p>
              <p className="text-[12px] text-stone-500 text-center mt-2 leading-relaxed text-kr-pretty">{t("cosmetics.routineUpdateDesc")}</p>
              <div className="mt-5 rounded-3xl p-4" style={{ background: "#F8FAF9", border: "1px solid #E5EEEA" }}>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #DCE9E4" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: DEEP_GREEN }}>{t("cosmetics.amBtn")}</p>
                    <div className="mt-2 space-y-1.5">
                      {morningRoutineItems.map((item, index) => (
                        <div key={`suggest-am-${index}`} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                            style={{ background: DEEP_GREEN }}>{index + 1}</span>
                          <p className="text-[11px] font-semibold text-stone-700 leading-tight text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #F2DED6" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("cosmetics.pmBtn")}</p>
                    <div className="mt-2 space-y-1.5">
                      {eveningRoutineItems.map((item, index) => (
                        <div key={`suggest-pm-${index}`} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                            style={{ background: SCAN_TO }}>{index + 1}</span>
                          <p className="text-[11px] font-semibold text-stone-700 leading-tight text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowRoutineUpdateSheet(false)}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold border border-stone-200 text-stone-600 bg-stone-50"
                >
                  {t("cosmetics.routineUpdateKeep")}
                </button>
                <button
                  onClick={() => {
                    saveDiaryTodos(todayStr(), routineUpdateItems.map((text) => ({ text, done: false })));
                    setShowRoutineUpdateSheet(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl text-[13px] font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
                >
                  {t("cosmetics.routineUpdateApply")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuestSheet && (
          <motion.div className="fixed inset-0 z-[120] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowQuestSheet(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white rounded-t-[32px] w-full max-w-md px-5 pt-5 pb-8 shadow-2xl max-h-[82vh] overflow-y-auto"
              initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>{t("result.actionCard.questEyebrow")}</p>
                  <p className="text-[16px] font-black mt-1" style={{ color: DEEP_GREEN }}>{t("result.actionCard.questTitle", { done: questDoneCount, total: questBoard.length })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-[10px] font-black"
                    style={{ background: "#FFF7ED", color: "#D97706" }}>
                    {totalPoints}pt
                  </span>
                  <button
                    onClick={() => setShowQuestSheet(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"
                    aria-label="Close quest board"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {questBoard.map((quest) => (
                  <div key={`sheet-${quest.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-3"
                    style={{ background: quest.done ? "#F8FFFB" : "#FFFFFF", border: `1px solid ${quest.done ? "#DDF5E8" : "#F3E7E3"}` }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: quest.done ? quest.accent : `${quest.accent}18` }}>
                      {quest.done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Star className="w-4 h-4" style={{ color: quest.accent }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-black leading-[1.4] text-kr-pretty" style={{ color: DEEP_GREEN }}>{quest.label}</p>
                        <span className="text-[10px] font-black" style={{ color: quest.done ? "#059669" : quest.accent }}>{quest.reward}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-[1.45] text-kr-pretty">{quest.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제휴 문의 모달 */}
      <AnimatePresence>
        {showPartnership && (
          <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPartnership(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-xl"
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              {isPartnerSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>{t("modal.partnership.success")}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{t("modal.partnership.successDesc")}</p>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-1" style={{ color: DEEP_GREEN }}>{t("modal.partnership.title")}</h3>
                  <p className="text-center text-sm leading-relaxed mb-6 text-muted-foreground" style={{ whiteSpace: "pre-line" }}>{t("modal.partnership.desc")}</p>
                  <form onSubmit={handlePartnershipSubmit} className="space-y-3">
                    <input type="text" required placeholder={t("modal.partnership.name")} value={partnerForm.name}
                      onChange={e => setPartnerForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 text-sm" />
                    <input type="text" required placeholder={t("modal.partnership.company")} value={partnerForm.company}
                      onChange={e => setPartnerForm(p => ({ ...p, company: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 text-sm" />
                    <input type="email" required placeholder={t("modal.partnership.email")} value={partnerForm.email}
                      onChange={e => setPartnerForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 text-sm" />
                    <textarea required placeholder={t("modal.partnership.message")} value={partnerForm.message}
                      onChange={e => setPartnerForm(p => ({ ...p, message: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 text-sm resize-none" />
                    <Button disabled={isPartnerSubmitting} type="submit"
                      className="w-full h-14 rounded-2xl font-bold text-[15px] text-white"
                      style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                      {isPartnerSubmitting ? t("modal.partnership.submitting") : t("modal.partnership.submit")}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 얼리버드 모달 */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowWaitlist(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-xl"
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                <Heart className="w-7 h-7 text-white" />
              </div>
              {isSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>{t("modal.waitlist.success")}</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-2" style={{ color: DEEP_GREEN }}>{t("modal.waitlist.title")}</h3>
                  <p className="text-center text-sm leading-relaxed mb-6 text-muted-foreground">{t("modal.waitlist.desc")}</p>
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <input type="email" required placeholder={t("modal.waitlist.email")} value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-200" />
                    <Button disabled={isSubmitting} type="submit"
                      className="w-full h-14 rounded-2xl font-bold text-[15px] text-white"
                      style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                      {isSubmitting ? t("modal.waitlist.submitting") : t("modal.waitlist.submit")}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

// ─── 매거진 탭 ────────────────────────────────────────────────────
const CATEGORY_FILTERS = ["전체", "성분", "루틴", "타입", "케어", "전문가"] as const;
type CategoryFilter = typeof CATEGORY_FILTERS[number];
const CATEGORY_I18N_KEYS: Record<CategoryFilter, string> = {
  "전체": "magazine.categories.all",
  "성분": "magazine.categories.ingredients",
  "루틴": "magazine.categories.routine",
  "타입": "magazine.categories.type",
  "케어": "magazine.categories.care",
  "전문가": "magazine.categories.expert",
};

function ArticleModal({ article, onClose }: { article: MagazineArticle; onClose: () => void }) {
  const { t } = useTranslation();
  const dragControls = useDragControls();
  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y" dragControls={dragControls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) onClose(); }}
      >
        {/* 드래그 핸들 */}
        <div className="pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing shrink-0"
          onPointerDown={e => dragControls.start(e)}>
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* 히어로 이미지 영역 */}
        <div
          className="mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
          style={{
            height: 160,
            background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})`,
            position: "relative",
          }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 52 }}>{article.emoji}</span>
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-black text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
              {article.tag}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-[10px] text-white/80 font-medium">{t("magazine.readTime", { time: article.readTime })}</span>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-10 space-y-4">
            <h2 className="text-[19px] font-black leading-snug" style={{ color: DEEP_GREEN }}>{article.title}</h2>

            {/* 저자 정보 */}
            <div className="flex items-center gap-2.5 py-3 border-y border-stone-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                style={{ background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})` }}>
                {article.author[0]}
              </div>
              <div>
                <p className="text-[12px] font-bold text-stone-800">{article.author}</p>
                <p className="text-[10px] text-stone-400">{article.authorRole} · {article.date}</p>
              </div>
            </div>

            <p className="text-[13px] text-stone-500 leading-relaxed">{article.summary}</p>

            {article.body.map((section, i) => (
              <div key={i} className="space-y-1.5">
                {section.heading && (
                  <h3 className="text-[14px] font-black" style={{ color: DEEP_GREEN_LIGHT }}>{section.heading}</h3>
                )}
                <p className="text-[13px] text-stone-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MagazineTab() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("전체");
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);

  const filtered = filter === "전체"
    ? MAGAZINE_ARTICLES
    : MAGAZINE_ARTICLES.filter(a => a.category === filter);

  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const rest = filtered.filter(a => a.id !== featured.id);

  return (
    <>
      <ScrollArea className="h-[calc(100dvh-60px)]">
        <motion.div className="pb-28" variants={stagger} initial="initial" animate="animate">

          {/* 헤더 */}
          <motion.div variants={fadeChild} className="px-5 pt-6 pb-4">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>{t("magazine.subtitle")}</p>
            <h1 className="text-[26px] font-black tracking-tight leading-tight whitespace-pre-line" style={{ color: DEEP_GREEN }}>
              {t("magazine.title")}
            </h1>
          </motion.div>

          {/* 카테고리 필터 */}
          <motion.div variants={fadeChild} className="px-5 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={filter === cat
                    ? { background: DEEP_GREEN, color: "white" }
                    : { background: "#F3F1EE", color: "#8C8070" }
                  }
                >
                  {t(CATEGORY_I18N_KEYS[cat])}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 피처드 히어로 카드 */}
          {featured && (
            <motion.div variants={fadeChild} className="px-5 mb-5">
              <motion.div
                onClick={() => setSelectedArticle(featured)}
                whileTap={{ scale: 0.98 }}
                className="rounded-3xl overflow-hidden shadow-lg cursor-pointer"
                style={{ background: `linear-gradient(145deg, ${featured.bgFrom}, ${featured.bgTo})` }}
              >
                {/* 이미지 영역 */}
                <div className="relative" style={{ height: 200 }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
                  {/* 장식 원 */}
                  <div className="absolute right-6 top-6 w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <span style={{ fontSize: 44 }}>{featured.emoji}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }} />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-black text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      ★ FEATURED
                    </span>
                  </div>
                </div>
                {/* 텍스트 영역 */}
                <div className="px-5 pb-5 pt-3 bg-white/95">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${featured.bgFrom}22`, color: featured.bgTo }}>
                      {featured.tag}
                    </span>
                    <span className="text-[10px] text-stone-400">·</span>
                    <span className="text-[10px] text-stone-400">{t("magazine.readTime", { time: featured.readTime })}</span>
                  </div>
                  <h2 className="text-[16px] font-black leading-snug mb-2" style={{ color: DEEP_GREEN }}>
                    {featured.title}
                  </h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{featured.summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black"
                        style={{ background: `linear-gradient(135deg, ${featured.bgFrom}, ${featured.bgTo})` }}>
                        {featured.author[0]}
                      </div>
                      <span className="text-[11px] font-bold text-stone-500">{featured.author}</span>
                      <span className="text-[10px] text-stone-300">{featured.authorRole}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: featured.bgTo }}>
                      <span className="text-[11px] font-bold">{t("magazine.read")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 나머지 아티클 목록 */}
          <div className="px-5 space-y-3">
            {rest.map((article, idx) => (
              <div key={article.id}>
                <motion.div
                  variants={fadeChild}
                  onClick={() => setSelectedArticle(article)}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex items-stretch">
                      {/* 썸네일 */}
                      <div
                        className="w-24 shrink-0 flex flex-col items-center justify-center relative"
                        style={{ background: `linear-gradient(145deg, ${article.bgFrom}, ${article.bgTo})`, minHeight: 96 }}
                      >
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                        <span style={{ fontSize: 32 }}>{article.emoji}</span>
                      </div>
                      {/* 텍스트 */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: `${article.bgFrom}22`, color: article.bgTo }}>
                              {article.tag}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-black leading-snug line-clamp-2 mb-1" style={{ color: DEEP_GREEN }}>
                            {article.title}
                          </h3>
                          <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">{article.summary}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-stone-300" />
                            <span className="text-[9px] text-stone-400">{article.author}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-stone-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[9px]">{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </ScrollArea>

      {/* 아티클 읽기 모달 */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── 리포트 탭 ────────────────────────────────────────────────────
function ReportTab({ user }: { user: any }) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/scans")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setLastScan(data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px)] px-6 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1" style={{ color: DEEP_GREEN }}>{t("report.title")}</h2>
          <p className="text-sm text-stone-400">{t("report.loginRequired")}</p>
        </div>
        <div className="w-full space-y-2">
          {i18n.language === "ko" ? (
            <Button onClick={() => { window.location.href = "/auth/kakao"; }}
              className="w-full h-12 rounded-xl font-bold gap-2 border-0 text-[#3C1E1E]" style={{ background: "#FEE500" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
              </svg>
              {t("report.kakaoLogin")}
            </Button>
          ) : (
            <Button onClick={() => { window.location.href = "/auth/line"; }}
              className="w-full h-12 rounded-xl font-bold gap-2 border-0 text-white" style={{ background: "#06C755" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/>
              </svg>
              {t("report.lineLogin")}
            </Button>
          )}
          <Button onClick={() => { window.location.href = "/auth/google"; }}
            className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
            {t("report.googleLogin")}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-64px)]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#C97062] animate-spin" />
      </div>
    );
  }

  if (!lastScan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px)] px-6 text-center gap-4">
        <FileText className="w-12 h-12 text-stone-200" />
        <p className="text-stone-400 text-sm whitespace-pre-line">{t("report.noRecord")}</p>
      </div>
    );
  }

  const date = new Date(lastScan.createdAt);
  const baumannLetters = lastScan.baumannType ? lastScan.baumannType.split("") : [];

  return (
    <div className="h-[calc(100dvh-64px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-24 space-y-4" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeChild} className="flex items-center justify-between">
          <h2 className="text-xl font-black" style={{ color: DEEP_GREEN }}>{t("report.title")}</h2>
          <span className="text-[11px] text-stone-400">
            {date.toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </motion.div>

        {/* 요약 */}
        <motion.div variants={fadeChild}>
          <Card className="border-none shadow-md rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <span className="text-3xl font-black leading-none">{lastScan.overallScore}</span>
                  <span className="text-[9px] font-bold opacity-80 mt-1">{t("report.overall")}</span>
                </div>
                {lastScan.skinAge && (
                  <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                    style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                    <span className="text-3xl font-black leading-none">{lastScan.skinAge}</span>
                    <span className="text-[9px] font-bold opacity-80 mt-1">{t("report.skinAge")}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-[13px] text-stone-500">{t("report.baumannLabel")}</span>
                    <span className="text-xl font-black" style={{ color: SCAN_TO }}>{lastScan.baumannType}</span>
                    <span className="text-[13px] text-stone-500">{t("report.baumannSuffix")}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {baumannLetters.map((letter: string, i: number) => {
                      const color = BAUMANN_COLORS[letter];
                      if (!color) return null;
                      return <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}>{t(`baumann.${letter}.name`)}</span>;
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 총평 */}
        {lastScan.aiComment && (
          <motion.div variants={fadeChild}>
            <Card className="border-none shadow-md rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("report.aiComment")}</p>
                </div>
                <p className="text-[13px] text-stone-600 leading-relaxed">{lastScan.aiComment}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 항목별 점수 */}
        {lastScan.scores?.length > 0 && (
          <motion.div variants={fadeChild}>
            <Card className="border-none shadow-md rounded-3xl">
              <CardHeader className="pb-1 pt-5 px-5">
                <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.scores")}</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {lastScan.scores.map((item: any, i: number) => {
                  const Icon = SCORE_ICONS[i] || Zap;
                  const color = SCORE_COLORS[i] || DEEP_GREEN;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-stone-50 shadow-sm">
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <span className="text-stone-700">{t(`scores.${i}`)}</span>
                        </div>
                        <span style={{ color }}>{item.score}{t("result.scoreSuffix")}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-stone-100">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: "0%" }} animate={{ width: `${item.score}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 피부 챌린지 초대 버튼 */}
        {lastScan.shareToken && (
          <motion.div variants={fadeChild}>
            <Button
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg flex items-center justify-center gap-2 rounded-2xl transition-all"
              onClick={() => {
                const shareUrl = `${window.location.origin}/battle/${lastScan.shareToken}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'Fonday AI 피부 챌린지!',
                    text: `내 피부 점수(${lastScan.overallScore}점, ${lastScan.baumannType})를 확인하고 나와 겨뤄보세요!`,
                    url: shareUrl,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("챌린지 링크가 복사되었습니다! 친구에게 보내서 겨뤄보세요.");
                  });
                }
              }}
            >
              <span className="text-2xl">👑</span> 친구에게 피부 챌린지 보내기
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── 루트 페이지 ──────────────────────────────────────────────────
export default function SkinScanPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [showCamera, setShowCamera] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [faceCroppedSrc, setFaceCroppedSrc] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [user, setUser] = useState<any>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleScanNew = () => {
    setActiveTab("scan");
    setScanState("idle");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const justLoggedIn = params.get("login") === "success";
    if (justLoggedIn) window.history.replaceState({}, "", "/");

    fetch("/api/user")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data ?? null);
        if (data && justLoggedIn) {
          // 팝업 모드: 부모에 알리고 닫기
          if (window.opener && !window.opener.closed) {
            try { window.opener.postMessage("fonday:login:success", window.location.origin); window.close(); } catch {}
          }
          // iOS PWA LINE 로그인: 새 Safari 탭 → BroadcastChannel로 원래 PWA 탭에 알림
          try { const bc = new BroadcastChannel("fonday-auth"); bc.postMessage({ type: "login_complete" }); bc.close(); } catch {}
        }
      })
      .catch(() => setUser(null));
  }, []);

  // visibilitychange: LINE 로그인 후 PWA로 돌아올 때 자동 로그인 감지
  // (iOS에서 LINE 앱 경유 → Safari 새탭 콜백 → PWA로 복귀 시 쿠키 공유로 자동 로그인)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!localStorage.getItem("fonday_login_pending")) return;
      fetch("/api/user").then(r => r.ok ? r.json() : null).then(u => {
        if (u) {
          localStorage.removeItem("fonday_login_pending");
          setUser(u);
        }
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  // 팝업 로그인 (DiaryTab·MyScreen 등에서 사용)
  const openLoginPopup = useCallback((provider: "kakao" | "line" | "google", returnTab?: string) => {
    if (returnTab) localStorage.setItem("fonday_return_tab", returnTab);
    if (provider === "line") {
      localStorage.setItem("fonday_login_pending", "1");
      window.open(`/auth/${provider}`, "_blank");
    } else {
      window.location.href = `/auth/${provider}`;
    }
  }, []);

  // 로그인 후 게스트 스캔 연결
  useEffect(() => {
    if (!user) return;
    const guestToken = (() => { try { return localStorage.getItem("fonday_guest_token"); } catch { return null; } })();
    if (!guestToken) return;
    fetch("/api/link-guest-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareToken: guestToken }),
    }).then(() => {
      try { localStorage.removeItem("fonday_guest_token"); } catch {}
    }).catch(() => {});
  }, [user]);

  // 로그인 후 스트릭/출석 서버 데이터 복원
  useEffect(() => {
    if (!user) return;
    fetch("/api/user-stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        // streak: count 더 큰 쪽 우선
        try {
          const local = getStreak();
          if ((data.streak?.count ?? 0) > (local.count ?? 0)) {
            localStorage.setItem("fonday_streak", JSON.stringify(data.streak));
          }
          // attendance: dates 합집합
          const localAtt = getAttendance();
          if (data.attendance?.dates) {
            const unionDates = [...new Set([...localAtt.dates, ...data.attendance.dates])];
            const merged = { dates: unionDates, totalPoints: unionDates.length * 3 };
            localStorage.setItem("fonday_attendance", JSON.stringify(merged));
          }
        } catch { /* ignore */ }
      })
      .catch(() => {});
  }, [user]);

  // 피부 일기 서버 동기화 — 저장 이벤트 발생 시 서버에 write-through
  useEffect(() => {
    if (!user) return;
    const handler = (e: Event) => {
      const dateStr = (e as CustomEvent).detail?.dateStr || todayStr();
      const memo = getDiaryMemo(dateStr);
      const todos = getDiaryTodos(dateStr);
      const causeTags = getDiaryCauseTags(dateStr);
      fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateStr, memo, todos, causeTags }),
      }).catch(() => {});
    };
    window.addEventListener("fonday:diary-updated", handler);
    return () => window.removeEventListener("fonday:diary-updated", handler);
  }, [user]);

  // OAuth 로그인 후 결과 화면 복원
  useEffect(() => {
    if (user === undefined || !user) return;
    const saved = localStorage.getItem("pendingResult");
    if (saved) {
      try {
        const { analysisResult: ar, surveyData: sd, imageBase64: imgB64 } = JSON.parse(saved);
        if (ar) {
          setAnalysisResult(ar);
          setSurveyData(sd);
          if (imgB64) setImageSrc(imgB64);
          setScanState("result");
        }
      } catch { /* ignore */ }
      localStorage.removeItem("pendingResult");
    }
    const returnTab = localStorage.getItem("fonday_return_tab");
    if (returnTab) {
      setActiveTab(returnTab as TabId);
      localStorage.removeItem("fonday_return_tab");
    }
  }, [user]);

  const handleCapture = useCallback((file: File) => {
    setImageFile(file);
    const objUrl = URL.createObjectURL(file);
    setImageSrc(objUrl);
    setFaceCroppedSrc(null);
    cropFaceFromImage(objUrl).then(setFaceCroppedSrc).catch(() => {});
    setShowCamera(false);
    setScanState("survey");
    // 설문 중에 미리 base64 변환 시작
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImageBase64(reader.result as string);
  }, []);

  const handleSurveySubmit = useCallback(async (data: SurveyData) => {
    setSurveyData(data);
    setScanState("scanning");
    if (!imageFile) return;

    // base64가 아직 준비되지 않았으면 대기
    let b64 = imageBase64;
    if (!b64) {
      b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => resolve(reader.result as string);
      });
      setImageBase64(b64);
    }

    try {
      const response = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, surveyData: data, lang: i18n.language || "en" }),
      });
      const rawText = await response.text();
      console.log("[API 응답]", response.status, rawText.slice(0, 300));
      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errJson = JSON.parse(rawText);
          msg = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
        } catch { msg += ": " + rawText.slice(0, 100); }
        alert(`분석 실패: ${msg}`);
        setScanState("idle");
        return;
      }
      const result = JSON.parse(rawText);
      setAnalysisResult(result);
      setScanState("result");
    } catch (err: any) {
      alert(`분석 실패: ${err.message || "네트워크 오류"}`);
      setScanState("idle");
    }
  }, [imageFile, imageBase64]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-stone-900">
      <div className="max-w-md mx-auto relative min-h-[100dvh]">

        {/* 얼굴 가이드 카메라 */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {scanState === "idle" && <ScanIdleScreen onScan={() => setShowCamera(true)} />}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen imageSrc={imageSrc} />}
              {scanState === "result" && (
                <ResultScreen
                  surveyData={surveyData}
                  analysisResult={analysisResult}
                  imageSrc={imageSrc}
                  faceCroppedSrc={faceCroppedSrc}
                  imageBase64={imageBase64}
                  onBack={() => setScanState("idle")}
                  onGoMagazine={() => setActiveTab("magazine")}
                  onOpenDiary={() => setActiveTab("diary")}
                  user={user}
                />
              )}
            </motion.div>
          )}
          {activeTab === "diary" && (
            <motion.div key="diary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DiaryTab user={user} analysisResult={analysisResult} onBack={() => setActiveTab("scan")} onLogin={openLoginPopup} />
            </motion.div>
          )}
          {activeTab === "magazine" && (
            <motion.div key="magazine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MagazineTab />
            </motion.div>
          )}
          {activeTab === "my" && (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MyScreen user={user} onInstall={handleInstall} onBack={() => setActiveTab("scan")} onLogin={openLoginPopup} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 앱 추가 안내 모달 (iOS) */}
        <AnimatePresence>
          {showInstallGuide && (
            <motion.div className="fixed inset-0 z-[200] flex items-end justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)} />
              <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl p-7"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  <SmartphoneNfc className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-center text-lg font-black mb-2" style={{ color: "#2D5F4F" }}>{t("install.title")}</h3>
                <p className="text-center text-sm text-stone-400 mb-6">{t("install.desc")}</p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step1") }} />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step2") }} />
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-[13px] text-stone-600" dangerouslySetInnerHTML={{ __html: t("install.step3") }} />
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full h-12 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  {t("install.close")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} scanState={scanState} />
    </div>
  );
}
