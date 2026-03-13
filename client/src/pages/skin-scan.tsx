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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
}

interface RankingData {
  totalScans: number;
  avgScore: number;
  topScore: number;
  scoreDistribution: { label: string; count: number }[];
  baumannDistribution: Record<string, number>;
  myPercentile?: number;
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

const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const TEXT_SECONDARY = "#8C8070";
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";

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
  totalPoints: number;
}

const MISSION_POINTS: Record<string, number> = {
  first_scan: 50, daily_scan: 10, streak_3: 100, streak_7: 200,
  streak_30: 500, score_70: 150, score_80: 300, challenge: 100, share: 50,
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
  return { completed: [], dailyDate: "", dailyCompleted: false, totalPoints: 0 };
}

function checkAndCompleteMissions(streakCount: number, overallScore: number): string[] {
  const state = getMissions();
  const today = todayStr();
  const newlyCompleted: string[] = [];

  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyCompleted = false;
  }

  if (!state.dailyCompleted) {
    state.dailyCompleted = true;
    state.totalPoints += MISSION_POINTS.daily_scan;
    newlyCompleted.push("daily_scan");
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
function CheckinSuccessSheet({ onKakao, onGoogle, onDismiss, user }: {
  onKakao: () => void;
  onGoogle: () => void;
  onDismiss: () => void;
  user: any;
}) {
  const { t } = useTranslation();
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
          <p className="text-[12px] font-bold text-amber-500">{t("attendance.totalPoints", { n: data.totalPoints })}</p>
        </div>

        {!user && (
          <div className="bg-stone-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-[13px] font-semibold text-stone-600 mb-0.5">{t("attendance.stored")}</p>
            <p className="text-[12px] text-stone-400 whitespace-pre-line">{t("attendance.loginDesc")}</p>
          </div>
        )}

        {!user ? (
          <div className="flex flex-col gap-2.5">
            <button onClick={onKakao}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black text-stone-800 flex items-center justify-center gap-2"
              style={{ background: "#FEE500" }}>
              <span>💬</span> {t("attendance.kakao")}
            </button>
            <button onClick={onGoogle}
              className="w-full py-3.5 rounded-2xl text-[14px] font-black border border-stone-200 text-stone-700 flex items-center justify-center gap-2 bg-white">
              <span>G</span> {t("attendance.google")}
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
      className="fixed top-4 left-4 z-[60] flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-sm border border-stone-100 transition-all active:scale-95">
      <CalendarDays className="w-3.5 h-3.5" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }} />
      <span className="text-[11px] font-bold" style={{ color: checkedToday ? SCAN_TO : "#B0A898" }}>
        {checkedToday ? t("attendance.alreadyChecked") : t("attendance.calendarBadge", { n: data.totalPoints })}
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
  if (!state.completed.includes("challenge")) {
    state.completed.push("challenge");
    state.totalPoints += MISSION_POINTS.challenge;
    try { localStorage.setItem("fonday_missions", JSON.stringify(state)); } catch {}
  }
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
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-stone-100">
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
        <div className="grid grid-cols-5 h-[64px]">
          {btn("scan", <Camera className="w-5 h-5" />, t("nav.scan"))}
          {btn("diary", <BookOpen className="w-5 h-5" />, t("nav.diary"))}
          {/* 중앙 Fonday 강조 버튼 */}
          <a
            href="https://fonday.replit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 active:opacity-70 -mt-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-black" style={{ color: "#C97062" }}>Fonday</span>
          </a>
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

  const ALL_MISSION_IDS = ["daily_scan", "first_scan", "streak_3", "streak_7", "streak_30", "score_70", "score_80", "challenge", "share"];

  const missionItems = ALL_MISSION_IDS.map(id => {
    const isDaily = id === "daily_scan";
    const done = isDaily ? isDailyCompleted : missions.completed.includes(id);
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

function WeatherTipCard() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetch(`/api/weather?lat=${lat}&lon=${lon}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data && !data.error) setWeather(data as WeatherData); })
          .catch(() => {});
      },
      () => setDenied(true),
      { timeout: 8000 }
    );
  }, []);

  if (denied || !weather) return null;

  const tipKey = getWeatherTipKey(weather);
  const tipRaw = t(`weather.tips.${tipKey}`, { returnObjects: true });
  const tipArr = Array.isArray(tipRaw) ? tipRaw : [tipRaw];
  const dayIdx = Math.floor(Date.now() / 86400000) % tipArr.length;
  const tip = tipArr[dayIdx] as { emoji: string; title: string; body: string };
  const aqiLabel = weather.aqi ? t(`weather.aqi${weather.aqi}`) : null;

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
      <span className="text-[10px] flex-shrink-0 w-[52px]" style={{ color: TEXT_SECONDARY }}>{label}</span>
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
  const [socialCount, setSocialCount] = useState(0);

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
      {/* 출석 달력 배지 */}
      <AttendanceBadge onClick={() => setShowCalendar(true)} />

      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>

    <motion.div
      className="flex flex-col px-3 pb-8 relative overflow-hidden"
      style={{ minHeight: "calc(100dvh - 60px)", background: "#FDFAF8", paddingTop: 28 }}
      variants={stagger} initial="initial" animate="animate"
    >
      {/* ── Aurora 배경 blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div className="absolute rounded-full"
          style={{ width: 280, height: 280, background: `${SCAN_FROM}18`, filter: "blur(50px)", top: -60, left: -60 }}
          animate={{ x: [0, 30, -10, 0], y: [0, 20, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 200, height: 200, background: "#C084FC18", filter: "blur(40px)", top: 80, right: -40 }}
          animate={{ x: [0, -20, 10, 0], y: [0, 30, -10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute rounded-full"
          style={{ width: 240, height: 240, background: `${SCAN_TO}12`, filter: "blur(50px)", bottom: 200, left: "20%" }}
          animate={{ x: [0, -15, 20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      </div>

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

      {/* ── Editorial 헤더: 브랜드칩 + 제목 + 부제목 ── */}
      <motion.div variants={fadeChild} className="mb-5 relative" style={{ zIndex: 1 }}>
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: `${SCAN_FROM}22`, border: `1px solid ${SCAN_FROM}50` }}>
            <Sparkles className="w-3 h-3" style={{ color: SCAN_TO }} />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: SCAN_TO }}>FONDAY AI</span>
          </div>
        </div>
        <h1 className="text-[28px] font-black text-stone-800 text-center leading-tight mb-2 px-2">
          {t("idle.title")}
        </h1>
        <p className="text-[13px] text-stone-500 text-center px-4">
          {t("idle.subtitle4")}
        </p>
      </motion.div>

      {/* ── AI 스캐너 비주얼 (풀 넓이) ── */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="relative w-full rounded-3xl overflow-hidden" style={{ height: 260 }}>
          {/* 실제 얼굴 이미지 */}
          <img
            src="/face-model.png"
            alt="face"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
          />
          {/* 스캔 라인 */}
          <motion.div className="absolute left-0 right-0 h-[2px] z-10"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${SCAN_TO}CC 40%, ${SCAN_FROM} 50%, ${SCAN_TO}CC 60%, transparent 100%)` }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
          {/* 하단 그라디언트 페이드 */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(253,250,248,0.9), transparent)" }} />
          {/* 4 코너 AR 브라켓 */}
          <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: SCAN_TO }} />
          <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: SCAN_TO }} />
          <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: SCAN_TO }} />
          <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: SCAN_TO }} />
          {/* AI ANALYZING 오버레이 (이미지 하단) */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20">
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SCAN_FROM }} />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI ANALYZING...</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── 소셜 증명 카운터 ── */}
      <motion.div variants={fadeChild} className="flex justify-center mb-4 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: `1px solid ${SCAN_FROM}40`, boxShadow: `0 2px 12px ${SCAN_FROM}20` }}>
          <span className="text-[16px]">🔥</span>
          <span className="text-[12px] font-semibold text-stone-600">
            {t("idle.socialCount", { n: socialCount.toLocaleString() })}
          </span>
        </div>
      </motion.div>

      {/* 결과 미리보기 카드 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="bg-white/90 rounded-2xl p-4 border border-stone-100"
          style={{ boxShadow: "0 4px 24px rgba(180,130,110,0.12), 0 1px 4px rgba(0,0,0,0.05)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>✨</div>
              <div>
                <div className="text-[11px] font-bold text-stone-700">{t("idle.previewTitle")}</div>
                <div className="text-[9px] text-stone-400">{t("idle.previewSub")}</div>
              </div>
            </div>
            <div className="px-2.5 py-0.5 rounded-full text-[12px] font-black text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
              82{t("result.scoreSuffix")}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {PREVIEW_SCORES.map(({ idx, score, color }, i) => (
              <MiniScoreBarIdle key={idx} label={t(`scores.${idx}`)} score={score} color={color} delay={500 + i * 100} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* 날씨 데일리 팁 카드 */}
      <div className="relative" style={{ zIndex: 1 }}><WeatherTipCard /></div>

      {/* 미션 카드 */}
      <div className="relative" style={{ zIndex: 1 }}><MissionCard /></div>

      {/* 단계 표시 */}
      <motion.div variants={fadeChild} className="mb-4 relative" style={{ zIndex: 1 }}>
        <div className="bg-white/90 rounded-2xl px-4 py-3.5 border border-stone-100"
          style={{ boxShadow: "0 2px 12px rgba(180,130,110,0.08)", backdropFilter: "blur(8px)" }}>
          <p className="text-[10px] font-semibold text-stone-400 text-center mb-3 tracking-widest uppercase">
            {t("idle.stepsTitle")}
          </p>
          <div className="flex items-start justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start" style={{ flex: 1 }}>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={step.active
                      ? { background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, boxShadow: `0 4px 14px ${SCAN_FROM}44` }
                      : { background: "#EDE6DE" }}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-bold text-stone-700">{step.title}</div>
                    <div className="text-[9.5px] text-stone-400 mt-0.5">{step.sub}</div>
                  </div>
                </div>
                {i < 2 && <div className="text-stone-200 text-sm pt-3 flex-shrink-0">›</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 개인정보 보호 배지 */}
      <motion.div variants={fadeChild} className="mb-5 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border"
          style={{ background: "#F0FAF6", borderColor: "#C5E5DA" }}>
          <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DEEP_GREEN }} />
          <span className="text-[11px] font-semibold" style={{ color: DEEP_GREEN }}>{t("idle.privacy")}</span>
        </div>
      </motion.div>

      {/* CTA 버튼 */}
      <motion.div variants={fadeChild} className="mt-auto relative" style={{ zIndex: 1 }}>
        {/* 스트릭 배지 */}
        {streak.count >= 2 && (
          <div className="flex justify-center mb-3">
            <span className="text-[13px] font-bold px-4 py-1.5 rounded-full"
              style={{ background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}>
              {t("streak.badge", { count: streak.count })}
            </span>
          </div>
        )}
        <motion.button
          onClick={onScan}
          className="w-full py-[18px] rounded-[18px] text-white text-[16px] font-bold tracking-tight"
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

      {/* ── 교육용 콘텐츠 섹션 (AdSense 정책: 퍼블리셔 콘텐츠 제공) ── */}
      <motion.div variants={fadeChild} className="mt-8 border-t border-stone-100 pt-6 space-y-5 relative" style={{ zIndex: 1 }}>
        <h2 className="text-[14px] font-black tracking-tight" style={{ color: DEEP_GREEN }}>{t("idle.baumannSectionTitle")}</h2>
        <p className="text-[12.5px] leading-relaxed text-stone-500">
          {t("idle.baumannSectionDesc")}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {(t("idle.baumannAxes", { returnObjects: true }) as { label: string; desc: string }[]).map((item, i) => {
            const icons = ["💧", "🌡️", "🌅", "⏳"];
            return (
              <div key={i} className="bg-white rounded-xl p-3 border border-stone-100">
                <span className="text-lg">{icons[i]}</span>
                <p className="text-[11px] font-bold text-stone-700 mt-1">{item.label}</p>
                <p className="text-[10px] text-stone-400">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-100">
          <h3 className="text-[13px] font-black mb-2" style={{ color: DEEP_GREEN }}>{t("idle.howTitle")}</h3>
          <ul className="space-y-1.5">
            {(t("idle.howSteps", { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11.5px] text-stone-500">
                <span className="text-[10px] font-black mt-0.5 shrink-0" style={{ color: SCAN_TO }}>{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center pt-1 pb-4">
          <a href="/privacy.html" className="text-[10px] underline" style={{ color: TEXT_SECONDARY }}>
            {t("idle.privacyLink")}
          </a>
          <span className="text-[10px] text-stone-200 mx-2">·</span>
          <a href="/terms.html" className="text-[10px] underline" style={{ color: TEXT_SECONDARY }}>
            {t("idle.termsLink")}
          </a>
        </div>
      </motion.div>
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
  return { enabled: false, hour: 21, minute: 0, lastNotifiedDate: "" };
}

function saveReminderSettings(next: ReminderSettings) {
  try { localStorage.setItem("fonday_reminder_settings", JSON.stringify(next)); } catch {}
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

// ─── 다이어리 달력 뷰 ────────────────────────────────────────────
function DiaryCalendarView({ allEntries }: { allEntries: { dateStr: string; score: number }[] }) {
  const { t, i18n } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<{ dateStr: string; score: number } | null>(null);

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
              onClick={() => setSelectedEntry(score !== undefined ? { dateStr, score } : null)}
              className="flex min-h-[60px] flex-col items-center justify-start py-1.5 gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all
                ${isSelected ? "ring-2 ring-offset-1 ring-[#C97062]" : ""}`}
                style={score !== undefined
                  ? { background: getScoreColor(score), color: getTextColor(score) }
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
            <span className="text-[20px] font-black" style={{ color: SCAN_TO }}>{selectedEntry.score}{t("result.scoreSuffix")}</span>
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
      {history.length >= 1 && (
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
function DiaryTab({ user, analysisResult, onBack }: { user: any; analysisResult: AnalysisResult | null; onBack?: () => void }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [tab, setTab] = useState<"timeline" | "calendar" | "ranking">("timeline");
  const [loading, setLoading] = useState(true);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => getReminderSettings());
  // Bug 7 fix: stale closure 방지용 ref
  const reminderSettingsRef = useRef(reminderSettings);
  useEffect(() => { reminderSettingsRef.current = reminderSettings; }, [reminderSettings]);

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
  const totalRecords = allEntries.length;
  const recentScores = allEntries.slice(0, 7).map((entry) => entry.score);
  const avgScore = recentScores.length > 0 ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 0;
  const diaryTodoProgress = getDiaryTodoProgress(todayStr());
  const diaryMemoReady = Boolean(getDiaryMemo(todayStr()).trim());
  const streakCount = getStreak().count;
  const weeklyReport = getWeeklyReport(allEntries, streakCount);

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

  const tabs: { id: "timeline" | "calendar" | "ranking"; label: string }[] = [
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "calendar", label: t("modal.diary.calendarTab") },
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
                <Button onClick={() => { window.location.href = "/auth/kakao"; }}
                  className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
                  style={{ background: "#FEE500" }}>
                  {t("result.login.kakao")}
                </Button>
                <Button onClick={() => { window.location.href = "/auth/google"; }}
                  className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
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
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12">
              <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.overall")}</p>
              <p className="text-[22px] font-black mt-1">{overallScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12">
              <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.diary.avg7d")}</p>
              <p className="text-[22px] font-black mt-1">{avgScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 bg-white/10 border border-white/12">
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
      <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
        <div className="px-5 pt-4">
          <Card className="border-none rounded-[28px] overflow-hidden shadow-sm"
            style={{ background: weeklyReport.unlocked ? "linear-gradient(135deg, #FFF7F2 0%, #FFFFFF 100%)" : "linear-gradient(135deg, #F6F3EE 0%, #FFFFFF 100%)" }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: weeklyReport.unlocked ? SCAN_TO : "#9A8F80" }}>
                    {t("modal.diary.weeklyTitle")}
                  </p>
                  <p className="text-[18px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                    {weeklyReport.unlocked
                      ? t("modal.diary.weeklyUnlocked")
                      : t("modal.diary.weeklyLocked", { days: Math.max(7 - weeklyReport.progress, 0) })}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                    {weeklyReport.unlocked
                      ? t("modal.diary.weeklyUnlockedDesc")
                      : t("modal.diary.weeklyLockedDesc")}
                  </p>
                </div>
                <div className="rounded-2xl px-3 py-2 text-right shrink-0"
                  style={{ background: weeklyReport.unlocked ? "#FFF1EC" : "#FFFFFF", border: "1px solid #EDE3DB" }}>
                  <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{t("modal.diary.streakShort")}</p>
                  <p className="text-[20px] font-black leading-none" style={{ color: weeklyReport.unlocked ? SCAN_TO : DEEP_GREEN }}>{weeklyReport.progress}/7</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${SCAN_FROM}, ${DEEP_GREEN})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((weeklyReport.progress / 7) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              {weeklyReport.unlocked && (
                <div className="grid gap-3 mt-4 md:grid-cols-2">
                  <div className="rounded-[22px] p-4" style={{ background: "#FFFFFF", border: "1px solid #F1E6DE" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("modal.diary.scoreFlow")}</p>
                    <p className="text-[22px] font-black mt-2" style={{ color: DEEP_GREEN }}>{weeklyReport.averageScore}</p>
                    <p className="text-[11px] text-stone-500 mt-1">{t("modal.diary.weeklyAverage")}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="rounded-2xl p-3" style={{ background: "#FFF8F4" }}>
                        <p className="text-[10px] text-stone-400">{t("modal.diary.best")}</p>
                        <p className="text-[14px] font-black mt-1" style={{ color: DEEP_GREEN }}>{weeklyReport.bestDay?.score ?? "--"}{weeklyReport.bestDay ? t("result.scoreSuffix") : ""}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: "#F6F3EE" }}>
                        <p className="text-[10px] text-stone-400">{t("modal.diary.low")}</p>
                        <p className="text-[14px] font-black mt-1" style={{ color: "#8C8070" }}>{weeklyReport.worstDay?.score ?? "--"}{weeklyReport.worstDay ? t("result.scoreSuffix") : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[22px] p-4" style={{ background: "#FFFFFF", border: "1px solid #F1E6DE" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("modal.diary.pattern")}</p>
                    <div className="space-y-3 mt-3">
                      <div>
                        <p className="text-[10px] text-stone-400">{t("modal.diary.bestRoutine")}</p>
                        <p className="text-[13px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{weeklyReport.bestRoutine?.text ?? t("modal.diary.collectingData")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-400">{t("modal.diary.worstRoutine")}</p>
                        <p className="text-[13px] font-black mt-1 text-kr-pretty" style={{ color: "#8C8070" }}>{weeklyReport.worstRoutine?.text ?? t("modal.diary.collectingData")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[22px] p-4" style={{ background: "#FFFFFF", border: "1px solid #F1E6DE" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("modal.diary.memoSignals")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(weeklyReport.keywordSummary.length > 0 ? weeklyReport.keywordSummary : [t("modal.diary.memoCollecting")]).map((keyword) => (
                        <span key={keyword} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: "#FFF1EC", color: SCAN_TO }}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-3">{t("modal.diary.weeklyMemoCount", { count: weeklyReport.memoCount })}</p>
                  </div>
                  <div className="rounded-[22px] p-4" style={{ background: "#FFFFFF", border: "1px solid #F1E6DE" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>{t("modal.diary.causeTags")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(weeklyReport.topCauseTags.length > 0
                        ? weeklyReport.topCauseTags.map(([tag, count]) => `${getCauseTagLabel(t, tag)} ${count}`)
                        : [t("modal.diary.tagCollecting")]).map((item) => (
                        <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-3">{t("modal.diary.incompleteDays", { count: weeklyReport.incompleteDays })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-none rounded-[28px] overflow-hidden shadow-sm mt-3" style={{ background: "#FFFFFF" }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("modal.diary.reminderTitle")}</p>
                  <p className="text-[16px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.reminderHeadline")}</p>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                    {t("modal.diary.reminderDesc")}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!reminderSettings.enabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                      await Notification.requestPermission();
                    }
                    const next = { ...reminderSettings, enabled: !reminderSettings.enabled };
                    setReminderSettings(next);
                    saveReminderSettings(next);
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black"
                  style={reminderSettings.enabled
                    ? { background: "#ECFDF5", color: "#059669" }
                    : { background: "#F6F3EE", color: "#9A8F80" }}
                >
                  {reminderSettings.enabled ? "ON" : "OFF"}
                </button>
              </div>
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
        <AnimatePresence mode="wait">
          {tab === "timeline" && (
            <motion.div key="tl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="py-20 text-center"><p className="text-[12px] text-stone-400">...</p></div>
              ) : (
                <DiaryTimeline history={history} analysisResult={analysisResult}
                  overallScore={overallScore} finalType={finalType} currentScanId={null} />
              )}
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
function MyScreen({ user, onInstall, onBack }: { user: any; onInstall: () => void; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const attendance = getAttendance();

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
                <p className="text-[11px] text-stone-400">{user.email || ""}</p>
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
            <button onClick={() => { window.location.href = "/auth/kakao"; }}
              className="w-full h-11 rounded-xl font-bold text-[13px] gap-2 flex items-center justify-center border-0 text-[#3C1E1E]"
              style={{ background: "#FEE500" }}>
              {t("attendance.kakao")}
            </button>
            <button onClick={() => { window.location.href = "/auth/google"; }}
              className="w-full h-11 rounded-xl font-bold text-[13px] border border-stone-200 bg-white text-stone-700 flex items-center justify-center">
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
      </div>

      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── 피부 예측 카드 ────────────────────────────────────────────────
function SkinPredictionCard({ prediction, currentScore, missionPhases, missionProgressPct, onOpenDiary }: {
  prediction: { good: PredictionScenario; bad: PredictionScenario };
  currentScore: number;
  missionPhases: { id: string; label: string; detail: string; done: boolean }[];
  missionProgressPct: number;
  onOpenDiary?: () => void;
}) {
  const { t } = useTranslation();
  const { good, bad } = prediction;
  const goodDelta = good.score - currentScore;
  const badDelta = bad.score - currentScore;
  const rewardPts = Math.max(goodDelta, 5);
  const routeReadyCount = missionPhases.filter((phase) => phase.done).length;
  const remainingRoutePhases = missionPhases.filter((phase) => !phase.done);
  const routeStatusLabel = remainingRoutePhases.length === 0
    ? t("result.prediction.routeReady")
    : t("result.prediction.routePending", { count: remainingRoutePhases.length });
  const routeStatusDesc = remainingRoutePhases.length === 0
    ? t("result.prediction.routeReadyDesc")
    : t("result.prediction.routePendingDesc", { tasks: remainingRoutePhases.map((phase) => phase.label).join(" · ") });

  return (
    <Card className="border-none shadow-md rounded-3xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
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

        <div className="rounded-[24px] p-4 mb-4 text-white"
          style={{ background: "linear-gradient(135deg, #6D28D9 0%, #C97062 100%)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/75">{t("result.prediction.missionEyebrow")}</p>
              <p className="text-[18px] font-black mt-1 text-kr-pretty">{t("result.prediction.missionTitle")}</p>
              <p className="text-[12px] text-white/80 mt-1 text-kr-pretty">{t("result.prediction.daysAfter", { days: good.days })}</p>
            </div>
            <span className="text-[9px] px-2 py-1 rounded-full bg-white/12 text-white/80 shrink-0">
              {t("result.prediction.disclaimer")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="rounded-2xl bg-white/10 p-3 border border-white/12">
              <p className="text-[10px] font-black text-white/70">{t("result.prediction.bestRoute")}</p>
              <p className="text-[15px] font-black mt-1 leading-tight text-kr-pretty">{good.scenario}</p>
              <p className="text-[11px] text-emerald-100 mt-2">+{goodDelta} {t("result.scoreSuffix")}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 border border-white/12">
              <p className="text-[10px] font-black text-white/70">{t("result.prediction.riskRoute")}</p>
              <p className="text-[15px] font-black mt-1 leading-tight text-kr-pretty">{bad.scenario}</p>
              <p className="text-[11px] text-orange-100 mt-2">-{Math.abs(badDelta)} {t("result.scoreSuffix")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] p-4 mb-4" style={{ background: "#FFFBF8", border: "1px solid #F2E1D8" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                {t("result.prediction.routeStatusEyebrow")}
              </p>
              <p className="text-[18px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                {routeStatusLabel}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">{routeStatusDesc}</p>
            </div>
            <div className="rounded-2xl px-3 py-2 text-right shrink-0"
              style={{ background: "#FFF1EC", border: "1px solid #F3DDD6" }}>
              <p className="text-[10px] font-bold text-stone-500">{t("result.prediction.routeStatusProgress")}</p>
              <p className="text-[20px] font-black leading-none" style={{ color: SCAN_TO }}>
                {routeReadyCount}/{missionPhases.length}
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden mt-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${SCAN_FROM}, ${DEEP_GREEN})` }}
              initial={{ width: 0 }}
              animate={{ width: `${missionProgressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="grid gap-2 mt-3">
            {missionPhases.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
                style={{ background: phase.done ? "#F8FFFB" : "#FFFFFF", border: `1px solid ${phase.done ? "#DDF5E8" : "#F3E7E3"}` }}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-kr-pretty" style={{ color: DEEP_GREEN }}>{phase.label}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed text-kr-pretty">{phase.detail}</p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black"
                  style={{ background: phase.done ? "#ECFDF5" : "#FFF7ED", color: phase.done ? "#059669" : "#D97706" }}>
                  {phase.done ? t("result.prediction.routeDone") : t("result.prediction.routeNext")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl p-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
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

        <div className="mt-4 rounded-2xl px-3 py-3 flex items-center justify-between gap-3"
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

function CosmeticsRegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<"am" | "pm" | "both">("both");
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [classifying, setClassifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showNonSkincareAlert, setShowNonSkincareAlert] = useState(false);
  const [nonSkincareType, setNonSkincareType] = useState("");

  const handleNext = async () => {
    if (!name.trim()) return;
    setClassifying(true);
    try {
      const res = await fetch("/api/cosmetics/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brand: brand.trim() }),
      });
      const data = await res.json();
      if (!data.isSkincareRelevant) {
        setNonSkincareType(data.productType || name);
        setShowNonSkincareAlert(true);
        setCategory("기타스킨케어");
      } else {
        setCategory(data.category || "기타스킨케어");
        setStep(2);
      }
    } catch {
      setCategory("기타스킨케어");
      setStep(2);
    }
    setClassifying(false);
  };

  const handleRegister = async () => {
    if (!category) return;
    setRegistering(true);
    try {
      await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brand: brand.trim(), category, timeOfDay, openedAt, isSkincareRelevant: true }),
      });
      onSuccess();
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
              {step === 1 ? t("cosmetics.registerTitle") : t("cosmetics.categoryLabel")}
            </p>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-sm">✕</button>
          </div>
          {/* 진행 바 */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all"
                style={{ background: s <= step ? DEEP_GREEN : "#E7E5E4" }} />
            ))}
          </div>
        </div>

        <div className="px-6 pt-5 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">제품명 *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder={t("cosmetics.namePlaceholder")}
                  className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 text-[14px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50 transition-colors"
                  autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">브랜드</label>
                <input value={brand} onChange={e => setBrand(e.target.value)}
                  placeholder={t("cosmetics.brandPlaceholder")}
                  className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 text-[14px] font-medium text-stone-800 outline-none focus:border-[#2D5F4F] bg-stone-50 transition-colors" />
              </div>
              <button onClick={handleNext} disabled={!name.trim() || classifying}
                className="w-full py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: classifying ? "#9CA3AF" : `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                {classifying
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t("cosmetics.classifying")}</>
                  : t("cosmetics.nextBtn")}
              </button>
            </>
          )}

          {step === 2 && (
            <>
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

              {/* 사용 시간 */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">{t("cosmetics.timeLabel")}</label>
                <div className="flex gap-2">
                  {(["am", "pm", "both"] as const).map(time => (
                    <button key={time} onClick={() => setTimeOfDay(time)}
                      className="flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all"
                      style={timeOfDay === time
                        ? { background: DEEP_GREEN, color: "white", borderColor: DEEP_GREEN }
                        : { background: "#F9F7F5", color: "#6B6560", borderColor: "#E7E5E4" }}>
                      {t(`cosmetics.${time}Btn`)}
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

              <button onClick={handleRegister} disabled={!category || registering}
                className="w-full py-4 rounded-2xl font-black text-[14px] text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: registering ? "#9CA3AF" : `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
                {registering
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t("cosmetics.registering")}</>
                  : <><span>💄</span> {t("cosmetics.registerBtn")}</>}
              </button>
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

function ResultScreen({ surveyData, analysisResult, imageSrc, imageBase64, onBack, onGoMagazine, onOpenDiary, user }: any) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [currentShareToken, setCurrentShareToken] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const analysisDrag = useDragControls();
  const improvementsDrag = useDragControls();
  const nutrientsDrag = useDragControls();
  const diaryDrag = useDragControls();
  const [showNutrients, setShowNutrients] = useState(false);
  const [expandedScore, setExpandedScore] = useState<number | null>(null);
  const [showDiary, setShowDiary] = useState(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [diaryTab, setDiaryTab] = useState<"history" | "compare" | "ranking">("history");
  const [pendingChallengeToken, setPendingChallengeToken] = useState<string | null>(null);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);
  const [streakDelta, setStreakDelta] = useState<number>(0);
  const [missionPops, setMissionPops] = useState<string[]>([]);
  const [showCheckinSheet, setShowCheckinSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "solution" | "nutrition">("analysis");
  const [currentStreak, setCurrentStreak] = useState<StreakData>(() => getStreak());
  const [todayTodoProgress, setTodayTodoProgress] = useState(() => getDiaryTodoProgress(todayStr()));
  const [missionState, setMissionState] = useState<MissionState>(() => getMissions());
  const [todayHasMemo, setTodayHasMemo] = useState(() => Boolean(getDiaryMemo(todayStr()).trim()));
  const loginPromptRef = useRef<HTMLDivElement>(null);
  // 화장품 기능
  const [cosmeticCount, setCosmeticCount] = useState(0);
  const [showCosmeticsGate, setShowCosmeticsGate] = useState(false);
  const [showCosmeticsRegister, setShowCosmeticsRegister] = useState(false);

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
    const newMissions = checkAndCompleteMissions(streak.count, overallScore);
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
    setTodayHasMemo(Boolean(getDiaryMemo(todayStr()).trim()));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshTodayState = () => {
      setTodayTodoProgress(getDiaryTodoProgress(todayStr()));
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

  const handleGoogleLogin = () => {
    sessionStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    window.location.href = "/auth/google";
  };
  const handleKakaoLogin = () => {
    sessionStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    window.location.href = "/auth/kakao";
  };
  const handleDiaryEntry = () => {
    if (user) {
      onOpenDiary?.();
      return;
    }
    loginPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const [isSuccess, setIsSuccess] = useState(false);

  // ── 푸시 알림 구독 상태 ──────────────────────────────────────
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

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

  const handlePushToggle = async () => {
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
      if (existing && pushSubscribed) {
        // 구독 해제
        await fetch("/api/push-subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
        setPushSubscribed(false);
      } else {
        // 권한 요청 + 구독
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { setPushLoading(false); return; }
        const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC,
        });
        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), baumannType: finalType, lang: i18n.language || "ko" }),
        });
        setPushSubscribed(true);
      }
    } catch (e) { console.error("[push]", e); }
    setPushLoading(false);
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
      .then((data: any[]) => setCosmeticCount(Array.isArray(data) ? data.length : 0))
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
      }),
    }).then(res => res.json()).then(data => {
      if (data?.shareToken) setCurrentShareToken(data.shareToken);
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
      })
    }).then(res => res.json()).then(data => {
      setIsSaved(true);
      if (data?.id) setCurrentScanId(data.id);
      if (data?.shareToken) setCurrentShareToken(data.shareToken);
      // D1에도 저장 (관리자 통계용)
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
  const todayRoutine = analysisResult?.prediction?.good?.routine ?? [];
  const morningTask = todayRoutine[0] ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.fallbackFocus");
  const eveningTask = todayRoutine[1] ?? analysisResult?.improvements?.[1]?.title ?? analysisResult?.improvements?.[0]?.title ?? t("result.actionCard.eveningFallback");
  const todayMissionRoutines = [morningTask, eveningTask].filter(Boolean);
  const todayFocus = todayMissionRoutines.join(" · ") || analysisResult?.improvements?.[0]?.title || t("result.actionCard.fallbackFocus");
  const routineDone = todayTodoProgress.done;
  const routineTotal = todayTodoProgress.total || todayRoutine.length;
  const routineComplete = routineTotal > 0 && routineDone === routineTotal;
  const weakestScores: { index: number; score: number }[] = scores
    .slice(1)
    .map((item: any, index: number) => ({ index: index + 1, score: item.score }))
    .sort((a: { index: number; score: number }, b: { index: number; score: number }) => a.score - b.score)
    .slice(0, 2);
  const weakestSummary = weakestScores.map(({ index }: { index: number; score: number }) => t(`scores.${index}`)).join(" · ");
  const nextStreakGoal = [3, 7, 30].find((goal) => goal > (currentStreak.count || 0)) ?? null;
  const daysToGoal = nextStreakGoal ? Math.max(nextStreakGoal - (currentStreak.count || 0), 0) : 0;
  const nextStreakReward = nextStreakGoal ? MISSION_POINTS[`streak_${nextStreakGoal}`] || 0 : 0;
  const missionReward = routineComplete ? 0 : MISSION_POINTS.daily_scan;
  const scoreMissionDone = overallScore >= 70;
  const premiumMissionDone = overallScore >= 80;
  const phaseDoneThreshold = Math.min(2, Math.max(routineTotal, todayRoutine.length, 1));
  const missionPhases = [
    {
      id: "am",
      label: t("result.actionCard.phaseMorning"),
      detail: morningTask,
      done: routineDone >= 1,
      accent: "#F59E0B",
      icon: Sun,
    },
    {
      id: "pm",
      label: t("result.actionCard.phaseEvening"),
      detail: eveningTask,
      done: routineDone >= phaseDoneThreshold,
      accent: "#6366F1",
      icon: Clock,
    },
    {
      id: "record",
      label: t("result.actionCard.phaseRecord"),
      detail: todayHasMemo ? t("result.actionCard.phaseRecordDone") : t("result.actionCard.phaseRecordDesc"),
      done: todayHasMemo,
      accent: "#C97062",
      icon: FileText,
    },
  ];
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
      reward: `${routineDone}/${routineTotal || 0}`,
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
      id: "score70",
      done: scoreMissionDone,
      label: t("result.actionCard.questScore"),
      reward: "70+",
      detail: t("result.actionCard.questScoreDetail"),
      accent: "#D97706",
    },
    {
      id: "score80",
      done: premiumMissionDone,
      label: t("result.actionCard.questPremium"),
      reward: "80+",
      detail: t("result.actionCard.questPremiumDetail"),
      accent: "#0F766E",
    },
  ];
  const essentialQuestIds = new Set(["scan", "routine", "memo"]);
  const essentialQuests = questBoard.filter((quest) => essentialQuestIds.has(quest.id));
  const bonusQuests = questBoard.filter((quest) => !essentialQuestIds.has(quest.id));
  const questDoneCount = questBoard.filter((quest) => quest.done).length;
  const questProgressPct = Math.round((questDoneCount / questBoard.length) * 100);
  const allClearBonus = questDoneCount === questBoard.length ? 20 : 0;
  const missionPhaseDoneCount = missionPhases.filter((phase) => phase.done).length;
  const missionPhaseProgressPct = Math.round((missionPhaseDoneCount / missionPhases.length) * 100);
  const remainingPhases = missionPhases.filter((phase) => !phase.done);
  const missionStatusText = remainingPhases.length === 0
    ? t("result.actionCard.remainingDone")
    : t("result.actionCard.remainingCount", { count: remainingPhases.length });
  const missionStatusDetail = remainingPhases.length === 0
    ? t("result.actionCard.statusDone")
    : t("result.actionCard.statusNext", { tasks: remainingPhases.map((phase) => phase.label).join(" · ") });
  const missionRewards = [
    {
      id: "scan",
      label: t("result.actionCard.rewardScan"),
      value: `+${MISSION_POINTS.daily_scan}pt`,
      done: missionState.dailyCompleted,
      desc: t("result.actionCard.questScanDetail"),
      tone: "#C97062",
      background: "#FFF1EC",
    },
    {
      id: "streak",
      label: t("result.actionCard.rewardStreak"),
      value: nextStreakGoal ? `+${nextStreakReward}pt` : t("result.actionCard.rewardClaimed"),
      done: !nextStreakGoal,
      desc: nextStreakGoal
        ? t("result.actionCard.streakGoal", { days: daysToGoal, goal: nextStreakGoal, reward: nextStreakReward })
        : t("result.actionCard.streakDone"),
      tone: "#D97706",
      background: "#FFF7ED",
    },
    {
      id: "score70",
      label: t("result.actionCard.rewardScore"),
      value: `+${MISSION_POINTS.score_70}pt`,
      done: scoreMissionDone,
      desc: t("result.actionCard.questScoreDetail"),
      tone: "#0F766E",
      background: "#ECFDF5",
    },
    {
      id: "score80",
      label: t("result.actionCard.rewardPremium"),
      value: `+${MISSION_POINTS.score_80}pt`,
      done: premiumMissionDone,
      desc: t("result.actionCard.questPremiumDetail"),
      tone: "#7C3AED",
      background: "#F5F3FF",
    },
  ];

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
      const food = pickFoodOption(d?.lunch, overallScore + idx + l.charCodeAt(0));
      return food ? { food, why: d.lunchWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 1]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length);
      return food ? { food, why: d.why } : null;
    }).filter(Boolean) as { food: string; why: string }[],
  ]).slice(0, 4);

  // 저녁 피해야 할 음식 (바우만 4글자 + 점수 기반 통합)
  const avoidDinner: { food: string; why: string }[] = dedupeFoods([
    ...finalType.split("").filter(l => l in NUTRIENT_COLORS).map((l, idx) => {
      const d = t(`nutrients.avoidFoods.${l}`, { returnObjects: true }) as any;
      const food = pickFoodOption(d?.dinner, overallScore + idx + l.charCodeAt(0) + 5, 1);
      return food ? { food, why: d.dinnerWhy } : null;
    }).filter(Boolean) as { food: string; why: string }[],
    ...scoreAvoidKeys.map((key, idx) => {
      const d = t(`nutrients.scoreAvoid.${key}`, { returnObjects: true }) as any;
      const relatedScore = scores[idx + 5]?.score ?? overallScore;
      const food = pickFoodOption(d?.foods, relatedScore + idx + key.length + 7, 1);
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

      const res = await fetch("/api/generate-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("[share]", e);
        alert(`공유 실패: ${e.message}`);
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
          <p className="text-[13px] font-bold text-amber-500">+{MISSION_POINTS[missionPops[0]] || 0}pt</p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 출석 체크인 팝업 */}
    <AnimatePresence>
      {showCheckinSheet && (
        <CheckinSuccessSheet
          user={user}
          onKakao={() => { setShowCheckinSheet(false); handleKakaoLogin(); }}
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

        {/* 이미지 + 핫스팟 */}
        <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-zinc-900">
          <div className="relative w-full">
            <img src={imageSrc} className="w-full object-cover" style={{ height: 280 }} />
            {analysisResult?.hotspots?.map((dot: any, i: number) => (
              <motion.div key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: "spring" }}
              >
                {/* 중심 점 */}
                <div className="w-2 h-2 rounded-full bg-red-500 border border-white/80 shadow-md" />
                {/* 미세 파동 */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-red-400"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3 }}
                />
              </motion.div>
            ))}
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Detection Active</span>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-md rounded-[32px] overflow-hidden"
          style={{ background: "linear-gradient(180deg, #FFFCFA 0%, #FFFFFF 100%)" }}>
          <CardContent className="p-5">
            <div className="rounded-[28px] p-5 text-white"
              style={{ background: "linear-gradient(135deg, #2D5F4F 0%, #C97062 100%)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.18em] uppercase text-white/70">{t("result.baumannLabel")}</p>
                  <p className="text-[34px] font-black tracking-tight mt-1">{finalType}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {finalType.split("").map((letter, i) => {
                      const color = BAUMANN_COLORS[letter];
                      if (!color) return null;
                      return (
                        <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90 border border-white/15 bg-white/10">
                          {t(`baumann.${letter}.name`)}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-white/72 mt-3 text-kr-pretty">{surveyData?.age} {surveyData?.gender} · {t("result.mbtiSub")}</p>
                </div>
                <div className="rounded-2xl px-3 py-2 bg-white/12 border border-white/15 shrink-0 text-right">
                  <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.overall")}</p>
                  <p className="text-[28px] font-black leading-none">{overallScore}</p>
                </div>
              </div>
              {analysisResult?.aiComment && (
                <div className="mt-4 rounded-[22px] p-4 bg-white/10 border border-white/15">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15 shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[12px] font-black text-white">{t("result.aiComment")}</p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-white/88 text-kr-pretty">{analysisResult.aiComment}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4">
              <div className="rounded-[22px] p-4" style={{ background: `linear-gradient(135deg, ${SCAN_FROM}16, ${SCAN_TO}20)` }}>
                <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{t("result.actionCard.streakLabel")}</p>
                <p className="text-[30px] font-black mt-2 leading-none" style={{ color: SCAN_TO }}>{currentStreak.count || 1}</p>
                <p className="text-[10px] font-bold mt-2" style={{ color: streakDelta > 0 ? "#16A34A" : streakDelta < 0 ? "#D97706" : "#8C8070" }}>
                  {streakDelta > 0
                    ? t("streak.deltaUp", { n: streakDelta })
                    : streakDelta < 0
                    ? t("streak.deltaDown", { n: Math.abs(streakDelta) })
                    : t("result.actionCard.streakValue", { count: currentStreak.count || 1 })}
                </p>
              </div>
              <div className="rounded-[22px] p-4" style={{ background: "linear-gradient(135deg, #7C3AED12, #7C3AED1F)" }}>
                <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{t("result.skinAge")}</p>
                <p className="text-[30px] font-black mt-2 leading-none" style={{ color: "#7C3AED" }}>
                  {analysisResult?.skinAge && analysisResult.skinAge > 0 ? analysisResult.skinAge : "—"}
                </p>
              </div>
              <div className="rounded-[22px] p-4" style={{ background: "linear-gradient(135deg, #F59E0B12, #D9770620)" }}>
                <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{t("ranking.topLabel")}</p>
                <p className="text-[30px] font-black mt-2 leading-none" style={{ color: "#D97706" }}>
                  {rankingData && rankingData.myPercentile !== undefined ? `${rankingData.myPercentile}%` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-3xl overflow-hidden shadow-[0_18px_40px_rgba(201,112,98,0.18)]"
          style={{ background: "linear-gradient(180deg, #FFF8F4 0%, #FFFFFF 100%)" }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.18em] uppercase" style={{ color: SCAN_TO }}>
                  {t("result.actionCard.eyebrow")}
                </p>
                <p className="text-[20px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                  {t("result.actionCard.title")}
                </p>
                <p className="text-[12px] text-stone-500 mt-1 text-kr-pretty leading-relaxed">
                  {t("result.actionCard.subtitle")}
                </p>
                <p className="text-[12px] text-stone-500 mt-2 text-kr-pretty">
                  {t("result.actionCard.reason", { focus: weakestSummary || t("result.actionCard.fallbackFocus") })}
                </p>
              </div>
              <div className="rounded-2xl px-3 py-2 text-right"
                style={{ background: "#FFF1EC", border: "1px solid #F3DDD6" }}>
                <p className="text-[10px] font-bold whitespace-nowrap" style={{ color: SCAN_TO }}>{t("result.actionCard.rewardLabel")}</p>
                <p className="text-[22px] font-black leading-none" style={{ color: SCAN_TO }}>
                  +{missionReward}
                </p>
                <p className="text-[9px] text-stone-400 mt-1 whitespace-nowrap">{t("result.actionCard.rewardSub")}</p>
              </div>
            </div>

            <div className="rounded-[24px] p-4 mb-4 text-white"
              style={{ background: "linear-gradient(135deg, #2D5F4F 0%, #C97062 100%)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-black uppercase tracking-[0.14em] text-white/80">{t("result.actionCard.missionEyebrow")}</p>
                  <p className="text-[18px] font-black mt-1 text-kr-pretty">
                    {routineComplete ? t("result.actionCard.complete") : t("result.actionCard.missionTitle")}
                  </p>
                  <p className="text-[12px] text-white/75 mt-2 leading-relaxed text-kr-pretty">
                    {missionStatusDetail}
                  </p>
                </div>
                <div className="rounded-2xl px-3 py-2 bg-white/14 border border-white/20">
                  <p className="text-[10px] font-bold text-white/70 whitespace-nowrap">{t("result.actionCard.scoreLabel")}</p>
                  <p className="text-[24px] font-black leading-none">{overallScore}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mt-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-white/80">{t("result.actionCard.progressLabel")}</p>
                  <p className="text-[14px] font-black mt-1">{missionStatusText}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-white/70">{t("result.actionCard.progressCount")}</p>
                  <p className="text-[16px] font-black">{missionPhaseDoneCount}/{missionPhases.length}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden mt-3">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${missionPhaseProgressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="rounded-2xl bg-white/10 p-3 border border-white/12">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <p className="text-[10px] font-bold text-white/70">{t("result.actionCard.routineLabel")}</p>
                  </div>
                  <p className="text-[20px] font-black">{routineDone}/{routineTotal || 0}</p>
                  <p className="text-[10px] text-white/75">{t("result.actionCard.routineSub")}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 border border-white/12">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame className="w-4 h-4 text-amber-200" />
                    <p className="text-[10px] font-bold text-white/70">{t("result.actionCard.streakLabel")}</p>
                  </div>
                  <p className="text-[20px] font-black">{t("result.actionCard.streakValue", { count: currentStreak.count || 1 })}</p>
                  <p className="text-[10px] text-white/75">
                    {nextStreakGoal
                      ? t("result.actionCard.streakGoal", { days: daysToGoal, goal: nextStreakGoal, reward: nextStreakReward })
                      : t("result.actionCard.streakDone")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 mb-4 md:grid-cols-3">
              {missionPhases.map((phase) => {
                const Icon = phase.icon;
                return (
                  <div
                    key={phase.id}
                    className="rounded-[22px] p-4"
                    style={{ background: phase.done ? "#F7FFFB" : "#FFFFFF", border: `1px solid ${phase.done ? "#DDF5E8" : "#F3E7E3"}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: phase.done ? phase.accent : `${phase.accent}18` }}>
                        <Icon className="w-4 h-4" style={{ color: phase.done ? "#FFFFFF" : phase.accent }} />
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-black shrink-0"
                        style={{ background: phase.done ? "#ECFDF5" : "#FFF7ED", color: phase.done ? "#059669" : "#D97706" }}>
                        {phase.done ? t("result.actionCard.phaseDone") : t("result.actionCard.phasePending")}
                      </span>
                    </div>
                    <p className="text-[12px] font-black mt-3 text-kr-pretty" style={{ color: DEEP_GREEN }}>{phase.label}</p>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">{phase.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 mb-4 md:grid-cols-2">
              <div className="rounded-[24px] p-4" style={{ background: "#FFFDFB", border: "1px solid #F2E7E2" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>
                      {t("result.actionCard.questEyebrow")}
                    </p>
                    <p className="text-[15px] font-black mt-1 leading-[1.35] text-kr-pretty" style={{ color: DEEP_GREEN }}>
                      {t("result.actionCard.questTitle", { done: essentialQuests.filter((quest) => quest.done).length, total: essentialQuests.length })}
                    </p>
                  </div>
                  <div className="rounded-full px-3 py-1 text-[10px] font-black shrink-0"
                    style={{ background: essentialQuests.every((quest) => quest.done) ? "#ECFDF5" : "#FFF1EC", color: essentialQuests.every((quest) => quest.done) ? "#059669" : SCAN_TO }}>
                    {essentialQuests.every((quest) => quest.done) ? t("result.actionCard.questAllClear") : t("result.actionCard.questInProgress")}
                  </div>
                </div>
                <div className="space-y-2">
                  {essentialQuests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.06 }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3"
                      style={{ background: quest.done ? "#F8FFFB" : "#FFFFFF", border: `1px solid ${quest.done ? "#DDF5E8" : "#F3E7E3"}` }}
                    >
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: quest.done ? quest.accent : `${quest.accent}18` }}>
                        {quest.done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Star className="w-4 h-4" style={{ color: quest.accent }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-black leading-[1.4] text-kr-pretty" style={{ color: DEEP_GREEN }}>{quest.label}</p>
                          <span className="text-[10px] font-black" style={{ color: quest.done ? "#059669" : quest.accent }}>{quest.reward}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-[1.45] text-kr-pretty">{quest.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] p-4" style={{ background: "#FFFDFB", border: "1px solid #F2E7E2" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: SCAN_TO }}>
                      {t("result.actionCard.bonusEyebrow")}
                    </p>
                    <p className="text-[15px] font-black mt-1 leading-[1.35] text-kr-pretty" style={{ color: DEEP_GREEN }}>
                      {t("result.actionCard.bonusTitle", { done: bonusQuests.filter((quest) => quest.done).length, total: bonusQuests.length })}
                    </p>
                  </div>
                  <div className="rounded-full px-3 py-1 text-[10px] font-black shrink-0"
                    style={{ background: bonusQuests.every((quest) => quest.done) ? "#ECFDF5" : "#FFF7ED", color: bonusQuests.every((quest) => quest.done) ? "#059669" : "#D97706" }}>
                    {bonusQuests.every((quest) => quest.done) ? t("result.actionCard.bonusReady") : t("result.actionCard.bonusLocked")}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${SCAN_FROM}, ${DEEP_GREEN})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${questProgressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <div className="rounded-2xl px-3 py-2 mb-3 flex items-center justify-between gap-3"
                  style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <p className="text-[11px] font-black text-orange-700 text-kr-pretty">{t("result.actionCard.comboLabel")}</p>
                  <span className="text-[11px] font-black text-orange-500 shrink-0">+{allClearBonus}pt</span>
                </div>
                <div className="space-y-2">
                  {bonusQuests.map((quest, index) => (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + index * 0.06 }}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3"
                      style={{ background: quest.done ? "#F8FFFB" : "#FFFFFF", border: `1px solid ${quest.done ? "#DDF5E8" : "#F3E7E3"}` }}
                    >
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: quest.done ? quest.accent : `${quest.accent}18` }}>
                        {quest.done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Star className="w-4 h-4" style={{ color: quest.accent }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-black leading-[1.4] text-kr-pretty" style={{ color: DEEP_GREEN }}>{quest.label}</p>
                          <span className="text-[10px] font-black" style={{ color: quest.done ? "#059669" : quest.accent }}>{quest.reward}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-[1.45] text-kr-pretty">{quest.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 mb-4 md:grid-cols-2">
              {missionRewards.map((reward) => (
                <div key={reward.id} className="rounded-[22px] p-4" style={{ background: reward.background, border: "1px solid rgba(0,0,0,0.04)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: reward.tone }}>
                        {reward.label}
                      </p>
                      <p className="text-[18px] font-black mt-1" style={{ color: DEEP_GREEN }}>{reward.value}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-black shrink-0"
                      style={{ background: reward.done ? "#ECFDF5" : "#FFFFFF", color: reward.done ? "#059669" : reward.tone }}>
                      {reward.done ? t("result.actionCard.rewardReady") : t("result.actionCard.rewardLocked")}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">{reward.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] p-4" style={{ background: "linear-gradient(135deg, rgba(224,152,130,0.12), rgba(45,95,79,0.08))" }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.actionCard.diaryTitle")}</p>
                  <p className="text-[11px] text-stone-500 mt-1">{t("result.actionCard.diaryDesc")}</p>
                </div>
                <Button onClick={handleDiaryEntry} className="rounded-full px-4 text-[12px] font-black shadow-none"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {t("result.actionCard.diaryButton")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── AI 피부 예측 카드 ── */}
        {analysisResult?.prediction && (
          <SkinPredictionCard
            prediction={analysisResult.prediction}
            currentScore={analysisResult.scores[0]?.score ?? 0}
            missionPhases={missionPhases.map(({ id, label, detail, done }) => ({ id, label, detail, done }))}
            missionProgressPct={missionPhaseProgressPct}
            onOpenDiary={handleDiaryEntry}
          />
        )}

        {/* ── 3탭 네비게이션 ── */}
        <div className="rounded-[28px] p-2.5 border border-[#F0E6E0] sticky top-0 z-20 backdrop-blur-md"
          style={{ background: "linear-gradient(180deg, rgba(255,249,246,0.96) 0%, rgba(255,255,255,0.96) 100%)" }}>
          <div className="flex gap-2">
          {(["analysis", "solution", "nutrition"] as const).map((tab) => {
            const labels = { analysis: t("result.tab.analysis"), solution: t("result.tab.solution"), nutrition: t("result.tab.nutrition") };
            const icons = {
              analysis: <LayoutGrid className="w-4 h-4" />,
              solution: <Leaf className="w-4 h-4" />,
              nutrition: <Utensils className="w-4 h-4" />,
            };
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-[20px] text-[13px] font-black transition-all"
                style={isActive
                  ? { background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, color: "white", boxShadow: `0 4px 14px ${SCAN_TO}55` }
                  : { background: "#FFF6F1", color: "#A8A29E" }}>
                {icons[tab]}
                <span>{labels[tab]}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* ── 분석 탭 ── */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            {/* 10가지 점수 아코디언 */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader className="pb-1 pt-5 px-5">
                <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.scores")}</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {scores.map((item: any, i: number) => {
                  const Icon = SCORE_ICONS[i] || Zap;
                  const color = SCORE_COLORS[i] || DEEP_GREEN;
                  const isExpanded = expandedScore === i;
                  return (
                    <div key={i} className="rounded-2xl transition-colors cursor-pointer"
                      style={{ background: isExpanded ? `${color}08` : "transparent" }}
                      onClick={() => setExpandedScore(isExpanded ? null : i)}>
                      <div className="space-y-1.5 px-1 pt-1">
                        <div className="flex items-center justify-between text-[13px] font-bold">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-stone-50 shadow-sm">
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                            </div>
                            <span className="text-stone-700">{t(`scores.${i}`)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <motion.span style={{ color }} initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.08, type: "spring" }}>
                              {item.score}{t("result.scoreSuffix")}
                            </motion.span>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="w-3.5 h-3.5 text-stone-300" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-stone-100">
                          <motion.div className="h-full rounded-full" style={{ background: color }}
                            initial={{ width: "0%" }} animate={{ width: `${item.score}%` }}
                            transition={{ delay: 0.3 + i * 0.08, duration: 0.9 }} />
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && item.comment && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden">
                            <p className="text-[12px] text-stone-500 leading-relaxed px-1 pb-3 pt-2">{item.comment}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Fonday 잠금 섹션 */}
            <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-white">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-3 blur-sm opacity-40 pointer-events-none select-none">
                  {[
                    { label: t("result.locked.skinTemp"), value: "36.2°C", icon: Thermometer, color: "#E09882" },
                    { label: t("result.locked.moisture"), value: "68%", icon: Droplets, color: "#3B82C4" },
                    { label: t("result.locked.oil"), value: "42%", icon: Flame, color: "#F59E0B" },
                    { label: t("result.locked.barrier"), value: "B+", icon: Shield, color: "#10B981" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3" style={{ color: item.color }} />
                          <p className="text-[10px] text-stone-400">{item.label}</p>
                        </div>
                        <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/75 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center mb-3 shadow-inner">
                  <Lock className="w-6 h-6 text-stone-500" />
                </div>
                <p className="text-[14px] font-black text-stone-700 mb-2">{t("result.locked.title")}</p>
                <p className="text-[12px] text-stone-500 leading-relaxed mb-3">
                  {t("result.locked.desc")}<br />
                  <span className="font-bold" style={{ color: SCAN_TO }}>{t("result.locked.device")}</span>{t("result.locked.deviceDesc")}
                </p>
                <Button onClick={() => setShowWaitlist(true)}
                  className="h-10 px-6 rounded-xl text-white text-[12px] font-bold shadow-md"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <span className="flex items-center gap-1.5">{t("result.earlybird")} <ArrowRight className="w-4 h-4" /></span>
                </Button>
              </div>
            </Card>

            {/* 피부 일기 카드 / 로그인 카드 */}
            {user === undefined ? (
              <div className="h-16 rounded-3xl bg-stone-100 animate-pulse" />
            ) : user ? (
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => onOpenDiary?.()} className="cursor-pointer">
                <Card className="border-none shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                        <LineChartIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>{t("result.diary.title")}</p>
                        <p className="text-[11px] text-stone-400">
                          {history.length > 0
                            ? t("result.diary.history", {
                                count: history.filter((h: any) => new Date(h.createdAt).toISOString().slice(0, 10) !== todayStr()).length + 1,
                                score: overallScore
                              })
                            : t("result.diary.firstRecord")}
                        </p>
                      </div>
                      {user.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full border border-stone-100 shrink-0" />}
                      <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                    </div>
                    {history.length >= 1 && (
                      <div className="h-16 mt-3 -mx-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...history.slice().reverse().map((item: any) => ({
                            date: new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
                            score: parseInt(item.overallScore),
                          })), { date: "오늘", score: overallScore }]}>
                            <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2}
                              dot={{ r: 2.5, fill: SCAN_TO, strokeWidth: 0 }} activeDot={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "8px" }} />
                            <YAxis hide domain={[0, 100]} />
                          </LineChart>
                        </ResponsiveContainer>
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
                  <Button onClick={handleKakaoLogin}
                    className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
                    style={{ background: "#FEE500" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
                    </svg>
                    {t("result.login.kakao")}
                  </Button>
                  <Button onClick={handleGoogleLogin}
                    className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                    {t("result.login.google")}
                  </Button>
                </CardContent>
              </Card>
              </div>
            )}
            <AdBanner slot="6349940752" />
          </div>
        )}

        {/* ── 솔루션 탭 ── */}
        {activeTab === "solution" && (
          <div className="space-y-3">

            {/* ── 화장품 루틴 분석 히어로 CTA ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-[24px] p-5 overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #1A3B2E 0%, #2D5F4F 60%, #3D7A66 100%)" }}>
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full opacity-5"
                style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💄</span>
                  <p className="text-[16px] font-black text-white">{t("cosmetics.ctaTitle")}</p>
                  {user && cosmeticCount > 0 && (
                    <span className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                      {t("cosmetics.ctaCount", { count: cosmeticCount })}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-white/75 mb-3 leading-relaxed">{t("cosmetics.ctaDesc")}</p>
                <div className="flex flex-col gap-1 mb-4">
                  {[t("cosmetics.ctaBullet1"), t("cosmetics.ctaBullet2"), t("cosmetics.ctaBullet3")].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                      <span className="text-[11px] text-white/70">{b}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (!user) { setShowCosmeticsGate(true); return; }
                    setShowCosmeticsRegister(true);
                  }}
                  className="w-full py-3 rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                  style={{ background: "white", color: DEEP_GREEN }}>
                  <span>💄</span>
                  {t("cosmetics.ctaBtn")}
                  <span className="ml-auto text-stone-400">→</span>
                </button>
              </div>
            </motion.div>

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
        )}

        {/* ── 영양 탭 ── */}
        {activeTab === "nutrition" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black" style={{ color: "#D97706" }}>{t("nutrients.sectionTitle")}</p>
                <p className="text-[11px] text-stone-400">{t("nutrients.sectionSub")}</p>
              </div>
            </div>
            {finalType.split("").filter(l => l in NUTRIENT_COLORS).map((letter, i) => {
              const arr = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
              const nutrient = arr?.[0];
              if (!nutrient) return null;
              const color = NUTRIENT_COLORS[letter];
              return (
                <motion.div key={letter} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }} className="flex gap-3 p-4 rounded-2xl border"
                  style={{ background: `${color}0D`, borderColor: `${color}33` }}>
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: `${color}22` }}>
                      {NUTRIENT_ICONS[letter]}
                    </div>
                    <p className="text-[9px] font-black text-center mt-0.5" style={{ color }}>{letter}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold mb-0.5" style={{ color }}>{nutrient.name}</p>
                    <p className="text-[12px] text-stone-500 leading-relaxed mb-1.5">{nutrient.why}</p>
                    <p className="text-[11px] text-stone-400">
                      <span className="font-bold" style={{ color }}>{t("nutrients.foodLabel")} </span>{nutrient.foods}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-3 pt-2 border-t border-stone-100">
                <span className="text-base">⚠️</span>
                <p className="text-[13px] font-black" style={{ color: "#D97706" }}>{t("nutrients.avoidTitle")}</p>
              </div>
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
            <div className="pt-2 space-y-2">
              <button onClick={handlePushToggle} disabled={pushLoading}
                className="w-full py-3 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-2"
                style={pushSubscribed
                  ? { background: `${DEEP_GREEN}18`, color: DEEP_GREEN, border: `1px solid ${DEEP_GREEN}33` }
                  : { background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white" }}>
                <span>{pushSubscribed ? "🔔" : "🍽️"}</span>
                {pushLoading ? "..." : pushSubscribed ? t("nutrients.pushBtnOn") : t("nutrients.pushBtn")}
              </button>
              <p className="text-[10px] text-center text-stone-400">점심 12:00 · 저녁 18:00 (KST)</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── 하단 고정 액션바 ── */}
      <div className="fixed left-0 right-0 z-[50] flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-stone-100"
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
        {/* 제휴 */}
        <Button onClick={() => setShowPartnership(true)}
          className="flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-1.5"
          style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}>
          <span className="text-[12px]">{t("result.partnershipShort")}</span>
        </Button>
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

                  {/* 푸시 알림 구독 */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handlePushToggle}
                      disabled={pushLoading}
                      className="w-full py-3 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-2"
                      style={pushSubscribed
                        ? { background: `${DEEP_GREEN}18`, color: DEEP_GREEN, border: `1px solid ${DEEP_GREEN}33` }
                        : { background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white" }
                      }
                    >
                      <span>{pushSubscribed ? "🔔" : "🍽️"}</span>
                      {pushLoading ? "..." : pushSubscribed ? t("nutrients.pushBtnOn") : t("nutrients.pushBtn")}
                    </button>
                    <p className="text-[10px] text-center text-stone-400">점심 12:00 · 저녁 18:00 (KST)</p>
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
                  💄
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
                <button onClick={() => { setShowCosmeticsGate(false); window.location.href = "/auth/kakao"; }}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2"
                  style={{ background: "#FEE500", color: "#3C1E1E" }}>
                  <span>💬</span> {t("cosmetics.loginGateKakao")}
                </button>
                <button onClick={() => { setShowCosmeticsGate(false); window.location.href = "/auth/google"; }}
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
              setCosmeticCount(prev => prev + 1);
              setShowCosmeticsRegister(false);
            }}
          />
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

          {/* 광고 (피처드 카드 아래) */}
          <div className="px-5 mb-4">
            <AdBanner slot="6349940752" />
          </div>

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
                {/* 4번째 아티클 뒤 광고 */}
                {idx === 3 && (
                  <div className="mt-3">
                    <AdBanner slot="6349940752" />
                  </div>
                )}
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
          <Button onClick={() => { window.location.href = "/auth/kakao"; }}
            className="w-full h-12 rounded-xl font-bold gap-2 border-0 text-[#3C1E1E]" style={{ background: "#FEE500" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
            </svg>
            {t("report.kakaoLogin")}
          </Button>
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
    fetch("/api/user")
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data ?? null))
      .catch(() => setUser(null));
  }, []);

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
    const saved = sessionStorage.getItem("pendingResult");
    if (!saved) return;
    try {
      const { analysisResult: ar, surveyData: sd, imageBase64: imgB64 } = JSON.parse(saved);
      setAnalysisResult(ar);
      setSurveyData(sd);
      if (imgB64) setImageSrc(imgB64);
      setScanState("result");
    } catch { /* ignore */ }
    sessionStorage.removeItem("pendingResult");
  }, [user]);

  const handleCapture = useCallback((file: File) => {
    setImageFile(file);
    setImageSrc(URL.createObjectURL(file));
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
      {scanState === "idle" && <LangSwitcher />}
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
              <DiaryTab user={user} analysisResult={analysisResult} onBack={() => setActiveTab("scan")} />
            </motion.div>
          )}
          {activeTab === "magazine" && (
            <motion.div key="magazine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MagazineTab />
            </motion.div>
          )}
          {activeTab === "my" && (
            <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MyScreen user={user} onInstall={handleInstall} onBack={() => setActiveTab("scan")} />
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
