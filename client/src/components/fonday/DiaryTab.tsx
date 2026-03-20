import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Lock,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  AICareSettings,
  AnalysisResult,
  CosmeticItem,
  DiaryCauseTag,
  RankingData,
  ReminderSettings,
  TodoItem,
} from "./types";
import {
  DEEP_GREEN,
  SCAN_FROM,
  SCAN_TO,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
  DIARY_CAUSE_TAGS,
} from "./constants";
import {
  buildDiaryReportModel,
  buildRoutineGuide,
  getAICareSettings,
  getCauseTagLabel,
  getDiaryCauseTags,
  getDiaryMemo,
  getDiaryTodoProgress,
  getDiaryTodos,
  getReminderSettings,
  getReportLang,
  getStreak,
  getWeeklyReport,
  saveAICareSettings,
  saveDiaryCauseTags,
  saveDiaryMemo,
  saveDiaryTodos,
  saveReminderSettings,
  suggestCauseTags,
  syncReminderToServer,
  todayStr,
} from "./utils";

import { InlineTodos, InlineMemo, DiaryRoutinePreviewCard, DiaryCalendarView, DiaryTimeline, DiaryFullView } from "./DiaryHelpers";

export function DiaryTab({ user, analysisResult, onBack, onLogin }: { user: any; analysisResult: AnalysisResult | null; onBack?: () => void; onLogin?: (p: "kakao"|"line"|"google", tab: string) => void }) {
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
  const reportConsultText = reportLang === "ko"
    ? {
        brief: "상담실장 브리핑",
        briefSub: "최근 스캔과 일기 기록을 바탕으로 이번 주 피부 흐름을 상담 메모처럼 정리했습니다.",
        insight: "상담실장 해석",
        priorities: "이번 주 우선 과제",
        causes: "원인 추정",
        consultantPlan: "상담실장 제안",
        routineAdjust: "루틴 조정 제안",
        lifestyle: "생활 변수 해석",
        procedureGuide: "시술 후 회복 가이드",
      }
    : reportLang === "ja"
      ? {
          brief: "カウンセリング要約",
          briefSub: "直近のスキャンと日記記録をもとに、今週の肌 흐름を相談メモのように整理しました。",
          insight: "カウンセラー解釈",
          priorities: "今週の優先課題",
          causes: "原因推定",
          consultantPlan: "カウンセラー提案",
          routineAdjust: "ルーティン調整提案",
          lifestyle: "生活要因の解釈",
          procedureGuide: "施術後の回復ガイド",
        }
      : {
          brief: "Consult Brief",
          briefSub: "This week is framed like a real skin consultation, using your recent scans and diary notes.",
          insight: "Consultant interpretation",
          priorities: "Top priorities this week",
          causes: "Likely drivers",
          consultantPlan: "Consultant recommendations",
          routineAdjust: "Routine adjustments",
          lifestyle: "Lifestyle interpretation",
          procedureGuide: "Post-procedure recovery guide",
        };
  const consultantActionItems = [
    diaryReport.routineHighlights.strong,
    diaryReport.ingredientPlan[0]?.reason || diaryReport.copy.notEnough,
    diaryReport.triggerSignals[0]
      ? `${diaryReport.triggerSignals[0].label} ${diaryReport.triggerSignals[0].diff > 0 ? `+${diaryReport.triggerSignals[0].diff}` : diaryReport.triggerSignals[0].diff}`
      : diaryReport.seasonGuide,
  ].filter(Boolean).slice(0, 3);
  const keyConcern = diaryReport.focusConcerns[0]?.key;
  const reportStatusLabel = reportLang === "ko"
    ? keyConcern === "redness" ? "민감 관리 우선"
      : keyConcern === "pigmentation" ? "색소 변동 주의"
      : keyConcern === "hydration" ? "장벽 회복 우선"
      : diaryReport.trendKey === "trendUp" ? "안정 회복 단계"
      : "집중 관리 구간"
    : reportLang === "ja"
      ? keyConcern === "redness" ? "敏感管理優先"
        : keyConcern === "pigmentation" ? "色素変動注意"
        : keyConcern === "hydration" ? "バリア回復優先"
        : diaryReport.trendKey === "trendUp" ? "安定回復段階"
        : "集中管理区間"
      : keyConcern === "redness" ? "Sensitivity first"
        : keyConcern === "pigmentation" ? "Pigment watch"
        : keyConcern === "hydration" ? "Barrier recovery first"
        : diaryReport.trendKey === "trendUp" ? "Stable recovery phase"
        : "Focused care phase";
  const consultantHeadline = reportLang === "ko"
    ? `${diaryReport.focusConcerns[0]?.titles.ko || "기초 컨디션"} 중심으로 흐름을 먼저 잡아야 하는 주간입니다.`
    : reportLang === "ja"
      ? `${diaryReport.focusConcerns[0]?.titles.ja || "基礎コンディション"}を軸に整える週です。`
      : `This week should center on stabilizing ${diaryReport.focusConcerns[0]?.titles.en || "your baseline condition"}.`;
  const causeEstimateItems = [
    diaryReport.triggerSignals[0]
      ? (reportLang === "ko"
          ? `${diaryReport.triggerSignals[0].label}이 있는 날 이후 점수 변동폭이 ${Math.abs(diaryReport.triggerSignals[0].diff)}점 정도 벌어졌습니다.`
          : reportLang === "ja"
            ? `${diaryReport.triggerSignals[0].label}がある日にスコア変動が約${Math.abs(diaryReport.triggerSignals[0].diff)}点広がりました。`
            : `Score volatility widens by about ${Math.abs(diaryReport.triggerSignals[0].diff)} points on days tagged with ${diaryReport.triggerSignals[0].label}.`)
      : "",
    weeklyReport.incompleteDays > 1
      ? (reportLang === "ko"
          ? `루틴 체크가 끊긴 날이 ${weeklyReport.incompleteDays}일 있어 관리 일관성이 흔들렸습니다.`
          : reportLang === "ja"
            ? `ルーティン記録が途切れた日が${weeklyReport.incompleteDays}日あり、管理の一貫性が落ちました。`
            : `Routine adherence dropped on ${weeklyReport.incompleteDays} days, reducing consistency.`)
      : "",
    diaryReport.topCauseTags[0]
      ? (reportLang === "ko"
          ? `${diaryReport.topCauseTags[0]} 패턴이 반복되어 생활 변수 영향이 같이 보입니다.`
          : reportLang === "ja"
            ? `${diaryReport.topCauseTags[0]}パターンが繰り返され、生活要因の影響も見えます。`
            : `${diaryReport.topCauseTags[0]} keeps recurring, suggesting a lifestyle driver as well.`)
      : "",
  ].filter(Boolean).slice(0, 3);
  const avoidMistakes = [
    ...(routineGuide.cautions.slice(0, 2)),
    reportLang === "ko"
      ? "좋아졌다고 바로 기능성 루틴 강도를 올리지 마세요."
      : reportLang === "ja"
        ? "少し良くなったからといってすぐに強い機能性ケアへ戻さないでください。"
        : "Do not jump back into stronger actives as soon as things start to look better.",
  ].slice(0, 3);
  const routineAdjustPlan = {
    keep: diaryReport.routineHighlights.strong,
    reduce: diaryReport.routineHighlights.watch,
    add: diaryReport.ingredientPlan[0]
      ? (reportLang === "ko"
          ? `${diaryReport.ingredientPlan[0].name} 중심 루틴을 천천히 추가`
          : reportLang === "ja"
            ? `${diaryReport.ingredientPlan[0].name}中心のケアをゆっくり追加`
            : `Slowly add a ${diaryReport.ingredientPlan[0].name}-focused step`)
      : diaryReport.copy.notEnough,
  };
  const lifestyleSupportItems = [
    analysisResult?.nutritionTips?.hydrationGoal || "",
    diaryReport.seasonGuide,
    reportLang === "ko"
      ? "수면과 자외선 노출 변수를 같이 관리하면 점수 변동폭을 줄이기 쉽습니다."
      : reportLang === "ja"
        ? "睡眠と紫外線の変数を一緒に整えるとスコア変動を抑えやすくなります。"
        : "Managing sleep and UV exposure together will usually reduce score volatility.",
  ].filter(Boolean).slice(0, 2);
  const closingComment = reportLang === "ko"
    ? "이번 주는 더 많이 하는 것보다, 흔들리지 않게 유지하는 것이 핵심입니다."
    : reportLang === "ja"
      ? "今週は増やすことより、ぶれずに維持することが重要です。"
      : "This week is less about doing more and more about staying steady.";

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
  const diaryTabSequence = ["calendar", "timeline", "report", "ranking"] as const;
  const diaryTabOrder = { calendar: 0, timeline: 1, report: 2, ranking: 3 } as const;
  const diaryTabDirectionRef = useRef(1);
  const diaryTabNavRef = useRef<HTMLDivElement | null>(null);
  const diaryScrollRef = useRef<HTMLDivElement | null>(null);
  const diaryTabSlideVariants = {
    enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -28, opacity: 0 }),
  };
  const goToDiaryTab = (next: "calendar" | "timeline" | "report" | "ranking") => {
    diaryTabDirectionRef.current = diaryTabOrder[next] >= diaryTabOrder[tab] ? 1 : -1;
    setTab(next);
  };
  const diaryTabMountedRef = useRef(false);
  useEffect(() => {
    if (!diaryTabMountedRef.current) {
      diaryTabMountedRef.current = true;
      return;
    }
    const nav = diaryTabNavRef.current;
    const container = diaryScrollRef.current;
    if (nav && container) {
      container.scrollTo({ top: nav.offsetTop - 12, behavior: "smooth" });
    }
  }, [tab]);

  if (!user) {
    return (
      <div className="flex flex-col" style={{ background: "#F8F5F2", minHeight: "calc(100dvh - 64px)" }}>
        <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
          <div className="rounded-3xl p-5 mb-4 text-white"
            style={{ background: "linear-gradient(135deg, #2D5F4F 0%, #C97062 100%)" }}>
            <p className="text-[11px] font-bold tracking-widest uppercase mb-1 text-white/70">FONDAY</p>
            <h1 className="text-2xl font-bold">{t("modal.diary.title")} ✦</h1>
            <p className="text-[12px] text-white/80 mt-2 text-kr-pretty">{t("result.login.desc")}</p>
          </div>
        </div>
        <div className="flex-1 px-5 py-6">
          <Card className="border-none rounded-3xl shadow-md overflow-hidden"
            style={{ background: TINT_WARM }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${SCAN_TO})` }}>
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold mt-4" style={{ color: DEEP_GREEN }}>{t("result.login.title")}</p>
              <p className="text-[12px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">{t("result.login.desc")}</p>
              <div className="grid grid-cols-3 gap-2.5 mt-5 text-left">
                <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("result.diary.avg7d")}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: SCAN_TO }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#F5F3FF" }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("modal.diary.timelineTab")}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: "#7C3AED" }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: TINT_GREEN }}>
                  <p className="text-[10px] font-bold text-stone-500">{t("modal.diary.calendarTab")}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: "#059669" }}>--</p>
                </div>
              </div>
              <div className="space-y-3 mt-6">
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
                  className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 shadow-sm">
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
    <div className="flex flex-col" style={{ background: "#F8F5F2", minHeight: "calc(100dvh - 64px)" }}>
      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: "1px solid #F0EDE8" }}>
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: "#FFFFFF", boxShadow: "0 10px 28px rgba(45,95,79,0.08)" }}>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>FONDAY</p>
          <h1 className="text-2xl font-bold" style={{ color: DEEP_GREEN }}>{t("modal.diary.title")}</h1>
          <p className="text-[12px] text-stone-500 mt-2 text-kr-pretty">
            {finalType ? `${finalType} · ` : ""}{totalRecords > 0 ? `${t("modal.diary.countLabel", { count: totalRecords })}` : t("result.diary.firstRecord")}
          </p>
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="rounded-2xl p-3 text-center" style={{ background: TINT_WARM }}>
              <p className="text-[10px] font-bold text-stone-400 whitespace-nowrap">{t("result.overall")}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: SCAN_TO }}>{overallScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "#F6F4FB" }}>
              <p className="text-[10px] font-bold text-stone-400 whitespace-nowrap">{t("result.diary.avg7d")}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#7C3AED" }}>{avgScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: TINT_GREEN }}>
              <p className="text-[10px] font-bold text-stone-400 whitespace-nowrap">{t("diary.routineTitle")}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: DEEP_GREEN }}>{diaryTodoProgress.total > 0 ? `${diaryTodoProgress.done}/${diaryTodoProgress.total}` : (diaryMemoReady ? "1/1" : "0/1")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div ref={diaryScrollRef} className="flex-1 overflow-y-auto overscroll-contain pb-24">
        <div ref={diaryTabNavRef} className="px-5 pt-2 pb-0 sticky top-0 z-20" style={{ background: "rgba(248,245,242,0.94)" }}>
          <div className="flex gap-2 p-2 rounded-3xl mb-3" style={{ background: "#FFFFFF", boxShadow: "0 8px 20px rgba(45,95,79,0.05)" }}>
            {tabs.map(({ id, label }) => (
              <button key={id} onClick={() => goToDiaryTab(id)}
                className={`flex-1 py-2.5 text-[12px] font-medium transition-all rounded-2xl ${
                  tab === id ? "shadow-sm" : "text-stone-400"
                }`}
                style={tab === id
                  ? id === "calendar"
                    ? { background: TINT_GREEN, color: DEEP_GREEN }
                    : id === "timeline"
                    ? { background: TINT_WARM, color: SCAN_TO }
                    : id === "report"
                    ? { background: "#F6F4FB", color: "#7C3AED" }
                    : { background: "#FFF7ED", color: "#C2410C" }
                  : { background: "transparent" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden"
          onTouchStart={(e) => { (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchX;
            if (startX == null) return;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) < 40) return;
            const cur = diaryTabSequence.indexOf(tab);
            if (diff < 0 && cur < diaryTabSequence.length - 1) goToDiaryTab(diaryTabSequence[cur + 1]);
            else if (diff > 0 && cur > 0) goToDiaryTab(diaryTabSequence[cur - 1]);
          }}>
        <AnimatePresence mode="wait" initial={false} custom={diaryTabDirectionRef.current}>
          {tab === "calendar" && (
            <motion.div
              key="cal"
              custom={diaryTabDirectionRef.current}
              variants={diaryTabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-full"
            >
              <DiaryCalendarView allEntries={allEntries} />
              <div className="px-5 pt-3">
                <Card className="border-none rounded-3xl overflow-hidden shadow-sm" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("modal.diary.reminderTitle")}</p>
                        <p className="text-base font-bold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.reminderHeadline")}</p>
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
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={reminderSettings.enabled
                          ? { background: TINT_GREEN, color: "#059669" }
                          : { background: TINT_NEUTRAL, color: "#9A8F80" }}
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
                              : { background: TINT_NEUTRAL, color: "#9A8F80" }}
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
              custom={diaryTabDirectionRef.current}
              variants={diaryTabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-full"
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
              custom={diaryTabDirectionRef.current}
              variants={diaryTabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-full"
            >
              <div className="px-5 pt-4 pb-8 space-y-4">
                <Card className="border-none rounded-3xl overflow-hidden shadow-sm"
                  style={{ background: TINT_WARM }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>
                          {reportConsultText.brief}
                        </p>
                        <p className="text-[20px] font-black mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>
                          {reportLang === "ko" ? "이번 주 피부 컨설팅" : reportLang === "ja" ? "今週の肌コンサルティング" : "This Week's Skin Consult"}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed text-kr-pretty">
                          {consultantHeadline}
                        </p>
                      </div>
                      <div className="rounded-3xl px-3 py-2 text-right shrink-0"
                        style={{ background: "#FFFFFFAA" }}>
                        <p className="text-[10px] font-bold text-stone-500 whitespace-nowrap">{diaryReport.copy.period}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.periodLabel}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-start">
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                        {reportStatusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.scans}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.scanCount}</p>
                      </div>
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.diary}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: SCAN_TO }}>{diaryReport.memoCount}</p>
                      </div>
                      <div className="rounded-2xl p-3 text-center" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">{diaryReport.copy.adherence}</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: "#0F766E" }}>{diaryReport.adherence}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
                        <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                          {reportConsultText.insight}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-base font-bold text-kr-pretty" style={{ color: DEEP_GREEN }}>
                            {diaryReport.copy[diaryReport.trendKey]}
                          </p>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: `${SCAN_FROM}18`, color: SCAN_TO }}>
                            {diaryReport.trendDesc}
                          </span>
                        </div>
                        <p className="text-[13px] text-stone-600 mt-3 leading-relaxed text-kr-pretty">
                          {diaryReport.executiveSummary}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">
                          {diaryReport.routineDesc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportConsultText.causes}
                    </p>
                    <div className="space-y-2.5 mt-3">
                      {causeEstimateItems.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: "#F8F5F2" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                            {index + 1}
                          </div>
                          <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportConsultText.priorities}
                    </p>
                    <div className="space-y-2.5 mt-3">
                      {consultantActionItems.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: index === 0 ? TINT_WARM : index === 1 ? TINT_GREEN : "#F6F4FB" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "#FFFFFF", color: index === 0 ? SCAN_TO : index === 1 ? DEEP_GREEN : "#7C3AED" }}>
                            {index + 1}
                          </div>
                          <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] px-1" style={{ color: SCAN_TO }}>
                    {reportLang === "ko" ? "핵심 관찰" : reportLang === "ja" ? "主要観察" : "Key observations"}
                  </p>
                  {diaryReport.focusConcerns.map((concern) => (
                    <Card key={concern.key} className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold text-kr-pretty" style={{ color: concern.accent }}>{concern.titles[reportLang]}</p>
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
                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {diaryReport.copy.ingredients}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{reportLang === "ko" ? "상담실장이 우선 추천하는 성분 처방입니다." : reportLang === "ja" ? "優先して勧めたい成分処方です。" : "Top ingredient prescriptions a consultant would prioritize."}</p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.ingredientPlan.map((item) => (
                          <div key={item.name} className="rounded-2xl p-3" style={{ background: `${item.accent}10` }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold" style={{ color: item.accent }}>{item.name}</p>
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/80 text-stone-500">{item.concern}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {diaryReport.copy.procedures}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{reportLang === "ko" ? "시술이 필요하다면 상담실에서 먼저 검토할 만한 방향입니다." : reportLang === "ja" ? "施術を考えるなら先に相談しやすい方向です。" : "If procedures are on the table, these are the first directions worth discussing."}</p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.procedurePlan.map((item) => (
                          <div key={item.name} className="rounded-2xl p-3 border" style={{ borderColor: `${item.accent}20`, background: "#FFFFFF" }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{item.name}</p>
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
                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportLang === "ko" ? "성분 반응 추적" : reportDetailText.ingredientTrack}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">{reportDetailText.ingredientTrackSub}</p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.ingredientSignals.length > 0 ? (
                          <>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">{reportDetailText.positiveFlow}</p>
                              <div className="space-y-3 mt-2">
                                {diaryReport.ingredientSignals.filter((item) => item.delta >= 0).slice(0, 3).map((item) => (
                                  <div key={`good-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: TINT_GREEN }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-bold text-emerald-700">{item.ingredient}</p>
                                      <span className="text-[10px] font-bold text-emerald-600">+{item.delta}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{reportDetailText.cautionFlow}</p>
                              <div className="space-y-3 mt-2">
                                {diaryReport.ingredientSignals.filter((item) => item.delta < 0).slice(0, 3).map((item) => (
                                  <div key={`bad-${item.ingredient}`} className="rounded-[16px] p-3" style={{ background: TINT_WARM }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-bold" style={{ color: SCAN_TO }}>{item.ingredient}</p>
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

                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportConsultText.procedureGuide}
                      </p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.recoveryGuide.map((item: string) => (
                          <div key={item} className="rounded-2xl p-3" style={{ background: TINT_NEUTRAL }}>
                            <p className="text-[12px] text-stone-600 leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportConsultText.routineAdjust}
                    </p>
                    <div className="grid gap-3 mt-3 md:grid-cols-2">
                      <div className="rounded-3xl p-4" style={{ background: TINT_WARM }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineGood}</p>
                        <p className="text-sm font-bold mt-2 text-kr-pretty" style={{ color: DEEP_GREEN }}>{diaryReport.routineHighlights.strong}</p>
                      </div>
                      <div className="rounded-3xl p-4" style={{ background: TINT_NEUTRAL }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">{diaryReport.copy.routineWatch}</p>
                        <p className="text-sm font-bold mt-2 text-kr-pretty" style={{ color: "#8C8070" }}>{diaryReport.routineHighlights.watch}</p>
                      </div>
                      <div className="rounded-3xl p-4" style={{ background: TINT_WARM }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{diaryReport.copy.memoSignals}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(diaryReport.keywordSummary.length > 0 ? diaryReport.keywordSummary : [diaryReport.copy.notEnough]).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFFFFF", color: SCAN_TO }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-3xl p-4" style={{ background: "#F5F3FF" }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7C3AED]">{diaryReport.copy.causeSignals}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(diaryReport.topCauseTags.length > 0 ? diaryReport.topCauseTags : [diaryReport.copy.notEnough]).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#FFFFFF", color: "#7C3AED" }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-3xl p-4 mt-3" style={{ background: TINT_NEUTRAL }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: DEEP_GREEN }}>
                        {diaryReport.copy.cosmeticsSignal}
                      </p>
                      <p className="text-[12px] text-stone-600 mt-2 leading-relaxed">{diaryReport.cosmeticsSignal}</p>
                      {routineGuide.cautions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {routineGuide.cautions.slice(0, 2).map((item) => (
                            <span key={item} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: TINT_WARM, color: SCAN_TO }}>
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 mt-3 md:grid-cols-3">
                      <div className="rounded-2xl p-3" style={{ background: TINT_GREEN }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">{reportLang === "ko" ? "유지" : reportLang === "ja" ? "維持" : "Keep"}</p>
                        <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.keep}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>{reportLang === "ko" ? "줄이기" : reportLang === "ja" ? "減らす" : "Reduce"}</p>
                        <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.reduce}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: "#F6F4FB" }}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7C3AED]">{reportLang === "ko" ? "추가" : reportLang === "ja" ? "追加" : "Add"}</p>
                        <p className="text-[12px] font-semibold mt-2 text-stone-700 text-kr-pretty">{routineAdjustPlan.add}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportLang === "ko" ? "피해야 할 실수" : reportLang === "ja" ? "避けたいミス" : "Avoid This Week"}
                    </p>
                    <div className="space-y-2.5 mt-3">
                      {avoidMistakes.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: "#FFF7ED" }}>
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: "#FFFFFF", color: "#C2410C" }}>
                            !
                          </div>
                          <p className="text-[12px] text-stone-700 leading-relaxed text-kr-pretty">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportConsultText.lifestyle}
                      </p>
                      <div className="space-y-2.5 mt-3">
                        {lifestyleSupportItems.map((item, index) => (
                          <div key={`${item}-${index}`} className="rounded-2xl p-3" style={{ background: index === 0 ? "#F5F9FF" : TINT_NEUTRAL }}>
                            <p className="text-[12px] text-stone-600 leading-relaxed text-kr-pretty">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                        {reportConsultText.causes}
                      </p>
                      <div className="space-y-3 mt-3">
                        {diaryReport.triggerSignals.length > 0 ? diaryReport.triggerSignals.map((item) => (
                          <div key={item.tag} className="rounded-2xl p-3" style={{ background: item.diff <= 0 ? TINT_WARM : TINT_GREEN }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold" style={{ color: item.diff <= 0 ? SCAN_TO : "#059669" }}>{item.label}</p>
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

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: TINT_GREEN }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                          {reportDetailText.forecastTitle}
                        </p>
                        <p className="text-[13px] text-stone-600 mt-2 leading-relaxed text-kr-pretty">{diaryReport.forecast.note}</p>
                      </div>
                      <div className="rounded-3xl px-3 py-2 shrink-0 text-right" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 2</p>
                        <p className="text-[20px] font-black mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 1</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: SCAN_TO }}>{diaryReport.forecast.week1}</p>
                      </div>
                      <div className="rounded-2xl p-3" style={{ background: "#FFFFFF" }}>
                        <p className="text-[10px] font-bold text-stone-400">WEEK 2</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: DEEP_GREEN }}>{diaryReport.forecast.week2}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none rounded-3xl shadow-sm overflow-hidden" style={{ background: "#FFFFFF" }}>
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: SCAN_TO }}>
                      {reportLang === "ko" ? "마무리 코멘트" : reportLang === "ja" ? "締めコメント" : "Closing note"}
                    </p>
                    <p className="text-[13px] text-stone-700 mt-3 leading-relaxed text-kr-pretty">{closingComment}</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          {tab === "ranking" && (
            <motion.div
              key="rank"
              custom={diaryTabDirectionRef.current}
              variants={diaryTabSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-full"
            >
              <div className="px-5 pb-8 space-y-4 pt-4">
                {!rankingData ? (
                  <div className="py-12 text-center"><p className="text-[12px] text-stone-400">...</p></div>
                ) : (
                  <>
                    {rankingData.myPercentile !== undefined ? (
                      <div className="p-5 rounded-2xl text-center"
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
                      <div className="space-y-3">
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
                        <p className="text-[11px] font-bold text-stone-400 mb-3">{t("ranking.topBaumann")}</p>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(rankingData.baumannDistribution)
                            .sort(([,a],[,b]) => b - a).slice(0, 3)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white">
                                <span className="text-sm font-bold" style={{ color: SCAN_TO }}>{type}</span>
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
    </div>
  );
}
