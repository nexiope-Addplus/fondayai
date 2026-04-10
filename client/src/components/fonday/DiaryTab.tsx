import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ClipboardList,
  Lock,
  NotebookPen,
} from "lucide-react";
import {
  Line,
  LineChart,
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
  AppUser,
  CosmeticItem,
  ReminderSettings,
} from "./types";
import {
  BG_BASE,
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  FONT_HEADING,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
  DIARY_CAUSE_TAGS,
  SHADOW_CARD,
  RADIUS_CARD,
  RADIUS_SUB,
  PAGE_GRADIENT,
  TEXT_HEADING,
  TEXT_TITLE,
  TEXT_LABEL,
  TEXT_SECONDARY,
  COLOR_DANGER,
  COLOR_INFO,
} from "./constants";
import {
  buildDiaryReportModel,
  buildRoutineGuide,
  getAICareSettings,
  getDiaryMemo,
  getDiaryTodoProgress,
  getReminderSettings,
  getReportLang,
  getStreak,
  getWeeklyReport,
  saveAICareSettings,
  saveReminderSettings,
  syncReminderToServer,
  todayStr,
} from "./utils";

import { DiaryRoutinePreviewCard, DiaryCalendarView, DiaryTimeline } from "./DiaryHelpers";
import { DiaryReportTab } from "./DiaryReportTab";
import { useAICareSettings } from "./useAICareSettings";

export function DiaryTab({ user, analysisResult, onBack, onLogin }: { user: AppUser | null; analysisResult: AnalysisResult | null; onBack?: () => void; onLogin?: (p: "kakao"|"line"|"google", tab: string) => void }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<"calendar" | "timeline" | "report">("calendar");
  const [loading, setLoading] = useState(true);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => getReminderSettings());
  const [aiCareSettings, setAICareSettings] = useState<AICareSettings>(() => getAICareSettings());
  const [reminderPushWarn, setReminderPushWarn] = useState(false);
  const [myCosmetics, setMyCosmetics] = useState<CosmeticItem[]>([]);
  const { pushSubscribed, pushLoading, handlePushToggle, updateAICareOption, aiCareLabels,
    aiCareSettings: hookAiCareSettings } = useAICareSettings(analysisResult);
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
        const [scansRes, diaryRes, cosmeticsRes] = await Promise.allSettled([
          fetch("/api/scans"),
          fetch("/api/diary"),
          fetch("/api/cosmetics"),
        ]);
        if (scansRes.status === "fulfilled" && scansRes.value.ok) {
          try { const d = await scansRes.value.json(); if (Array.isArray(d)) setHistory(d); } catch {}
        }
        // 서버 → localStorage 동기화 (기기 변경/캐시 삭제 복원)
        if (diaryRes.status === "fulfilled" && diaryRes.value.ok) {
          try {
            const entries: any[] = await diaryRes.value.json();
            entries.forEach((entry: any) => {
              const { date_str, memo, todos, cause_tags } = entry;
              if (memo) localStorage.setItem(`fonday_memo_${date_str}`, memo);
              try { const t = JSON.parse(todos || "[]"); if (t.length > 0) localStorage.setItem(`fonday_todos_${date_str}`, todos); } catch {}
              try { const c = JSON.parse(cause_tags || "[]"); if (c.length > 0) localStorage.setItem(`fonday_cause_tags_${date_str}`, cause_tags); } catch {}
            });
          } catch {}
        }
        if (cosmeticsRes.status === "fulfilled" && cosmeticsRes.value.ok) {
          try { const d = await cosmeticsRes.value.json(); setMyCosmetics(Array.isArray(d) ? d : []); } catch {}
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    const targetTab = sessionStorage.getItem("fonday_diary_target_tab");
    if (targetTab === "calendar" || targetTab === "timeline" || targetTab === "report") {
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

  const tabs: { id: "calendar" | "timeline" | "report"; label: string }[] = [
    { id: "calendar", label: t("modal.diary.calendarTab") },
    { id: "timeline", label: t("modal.diary.timelineTab") },
    { id: "report", label: t("modal.diary.reportTab") },
  ];
  const diaryTabSequence = ["calendar", "timeline", "report"] as const;
  const diaryTabOrder = { calendar: 0, timeline: 1, report: 2 } as const;
  const diaryTabDirectionRef = useRef(1);
  const diaryTabNavRef = useRef<HTMLDivElement | null>(null);
  const diaryScrollRef = useRef<HTMLDivElement | null>(null);
  const diaryTabSlideVariants = {
    enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -28, opacity: 0 }),
  };
  const goToDiaryTab = (next: "calendar" | "timeline" | "report") => {
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

  // 탭 전환 시 스크롤 위치 저장/복원 (서브탭별 독립 키)
  const scrollRestoreKey = `diary_scroll_${tab}`;
  useEffect(() => {
    const container = diaryScrollRef.current;
    if (!container) return;
    const saved = sessionStorage.getItem(scrollRestoreKey);
    if (saved) container.scrollTop = Number(saved);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      setTimeout(() => {
        sessionStorage.setItem(scrollRestoreKey, String(container.scrollTop));
        ticking = false;
      }, 300);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollRestoreKey]);

  if (!user) {
    return (
      <div className="flex flex-col" style={{ background: PAGE_GRADIENT, minHeight: "calc(100dvh - 64px)" }}>
        <div className="px-4 pt-5 tab-bottom-pad">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_WARM }}>
                <NotebookPen className="w-4 h-4" style={{ color: SCAN_TO }} />
              </div>
              <h1 className="text-[22px] font-extrabold" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>{t("modal.diary.title")}</h1>
            </div>
            <p className="text-[13px] text-kr-pretty" style={{ color: TEXT_SECONDARY, marginLeft: 42 }}>{t("diary.loginDesc", "로그인으로 내 피부 일기를 시작하세요.")}</p>
          </div>

          <div className="mb-8">
            <p className="text-[14px] font-bold mb-3" style={{ color: TEXT_TITLE }}>{t("diary.loginValueTitle", "피부 일기를 쓰면")}</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 shrink-0" style={{ color: DEEP_GREEN }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("diary.loginValue1", "매일 피부 점수 변화를 기록해요")}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 shrink-0" style={{ color: SCAN_TO }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("diary.loginValue2", "7일 평균으로 피부 트렌드를 확인해요")}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <NotebookPen className="w-4 h-4 shrink-0" style={{ color: COLOR_INFO }} />
                <p className="text-[13px]" style={{ color: TEXT_LABEL }}>{t("diary.loginValue3", "캘린더에서 한눈에 관리해요")}</p>
              </div>
            </div>
          </div>

          <div className="p-5" style={{ borderRadius: RADIUS_CARD, background: BG_BASE, boxShadow: SHADOW_CARD }}>
            <div className="space-y-2.5">
              {i18n.language === "ko" ? (
                <button onClick={() => onLogin ? onLogin("kakao", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/kakao")}
                  className="w-full font-bold gap-2 border-0 text-[#3C1E1E] flex items-center justify-center"
                  style={{ background: "#FEE500", height: 48, borderRadius: 24 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                  {t("result.login.kakao")}
                </button>
              ) : (
                <button onClick={() => onLogin ? onLogin("line", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/line")}
                  className="w-full font-bold gap-2 border-0 text-white flex items-center justify-center"
                  style={{ background: "#06C755", height: 48, borderRadius: 24 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 7.56c0-3.16-3.13-5.73-6.98-5.73S1.04 4.4 1.04 7.56c0 2.83 2.47 5.2 5.82 5.65.23.05.53.15.61.35.07.18.05.46.02.64l-.1.58c-.03.18-.14.69.6.38.74-.32 3.98-2.38 5.43-4.07C14.54 9.88 15 8.78 15 7.56Z" fill="white"/></svg>
                  {t("result.login.line")}
                </button>
              )}
              <button onClick={() => onLogin ? onLogin("google", "diary") : (localStorage.setItem("fonday_return_tab", "diary"), window.location.href = "/auth/google")}
                className="w-full font-bold text-[#6B5D55] gap-2 bg-white flex items-center justify-center"
                style={{ height: 48, borderRadius: 24 }}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                {t("result.login.google")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ background: PAGE_GRADIENT, minHeight: "calc(100dvh - 64px)" }}>
      {/* 헤더 */}
      <div className="shrink-0 px-4 pt-5 pb-0">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_WARM }}>
              <NotebookPen className="w-4 h-4" style={{ color: SCAN_TO }} />
            </div>
            <h1 className="text-[22px] font-extrabold" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>{t("modal.diary.title")}</h1>
          </div>
          <p className="text-[13px] text-kr-pretty" style={{ color: TEXT_SECONDARY, marginLeft: 42 }}>
            {finalType ? `${finalType} · ` : ""}{totalRecords > 0 ? `${t("modal.diary.countLabel", { count: totalRecords })}` : t("result.diary.firstRecord")}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 text-center" style={{ borderRadius: RADIUS_SUB, background: BG_MUTED }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{t("result.overall")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{overallScore || "—"}</p>
            </div>
            <div className="p-3 text-center" style={{ borderRadius: RADIUS_SUB, background: BG_MUTED }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{t("result.diary.avg7d")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: COLOR_INFO, fontFamily: FONT_DISPLAY }}>{avgScore || "—"}</p>
            </div>
            <div className="p-3 text-center" style={{ borderRadius: RADIUS_SUB, background: BG_MUTED }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{t("diary.routineTitle")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{diaryTodoProgress.total > 0 ? `${diaryTodoProgress.done}/${diaryTodoProgress.total}` : (diaryMemoReady ? "1/1" : "0/1")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div ref={diaryScrollRef} className="flex-1 overflow-y-auto overscroll-contain tab-bottom-pad">
        {overallScore === 0 && (
          <div className="mx-4 mt-3 mb-0">
            <button
              onClick={onBack}
              className="w-full flex items-center gap-3 p-4 active:opacity-70"
              style={{ borderRadius: RADIUS_CARD, background: TINT_GREEN }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${DEEP_GREEN}18` }}>
                <Camera className="w-5 h-5" style={{ color: DEEP_GREEN }} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[13px] font-bold" style={{ color: DEEP_GREEN }}>
                  {t("diary.scanNudge", "오늘 아직 스캔하지 않았어요")}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: TEXT_TERTIARY }}>
                  {t("diary.scanNudgeDesc", "스캔하면 피부 변화를 추적할 수 있어요")}
                </p>
              </div>
            </button>
          </div>
        )}
        <div ref={diaryTabNavRef} className="px-4 pt-2 pb-0 sticky top-0 z-20" style={{ background: "rgba(253,252,250,0.92)", backdropFilter: "blur(12px)" }}>
          <div className="flex gap-2 p-1.5 rounded-full mb-3" style={{ background: BG_MUTED }}>
            {tabs.map(({ id, label }) => (
              <button key={id} onClick={() => goToDiaryTab(id)}
                className={`flex-1 py-2.5 text-[12px] font-semibold transition-all rounded-full ${
                  tab === id ? "shadow-sm" : ""
                }`}
                style={tab === id
                  ? id === "calendar"
                    ? { background: TINT_GREEN, color: DEEP_GREEN }
                    : id === "timeline"
                    ? { background: TINT_WARM, color: SCAN_TO }
                    : id === "report"
                    ? { background: "#F6F4FB", color: COLOR_INFO }
                    : { background: "#FFF7ED", color: COLOR_DANGER }
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
            if (Math.abs(diff) < 80) return;
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
                <div className="pt-5 mt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.08em]" style={{ color: SCAN_TO }}>{t("modal.diary.reminderTitle")}</p>
                        <p className="text-[15px] font-bold mt-1 text-kr-pretty" style={{ color: TEXT_TITLE }}>{t("modal.diary.reminderHeadline")}</p>
                        <p className="text-xs mt-1 leading-relaxed text-kr-pretty" style={{ color: TEXT_SECONDARY }}>
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
                      <p className="text-xs text-amber-600 mt-1.5">
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
                            className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={selected
                              ? { background: `${SCAN_FROM}20`, color: SCAN_TO }
                              : { background: TINT_NEUTRAL, color: "#9A8F80" }}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── AI 밀착케어 알림 ── */}
                  <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.08em]" style={{ color: SCAN_TO }}>{aiCareLabels.title}</p>
                        <p className="text-xs mt-1 leading-relaxed text-kr-pretty" style={{ color: TEXT_SECONDARY }}>{aiCareLabels.desc}</p>
                      </div>
                      <button onClick={() => handlePushToggle()} disabled={pushLoading}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
                        style={pushSubscribed
                          ? { background: TINT_GREEN, color: "#059669" }
                          : { background: SCAN_TO, color: "#FFFFFF" }}>
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
                        ] as const).map(([key, label]) => {
                          const isActive = hookAiCareSettings[key];
                          return (
                            <button key={key}
                              onClick={() => updateAICareOption(key, !hookAiCareSettings[key])}
                              className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                              style={isActive
                                ? { background: `${SCAN_FROM}20`, color: SCAN_TO, border: `1px solid ${SCAN_TO}33` }
                                : { background: TINT_NEUTRAL, color: "#9A8F80", border: "1px solid #ECE6DE" }}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
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
                <div className="py-20 text-center" style={{ color: TEXT_TERTIARY }}><p className="text-[12px]">...</p></div>
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
              <DiaryReportTab
                diaryReport={diaryReport}
                reportLang={reportLang}
                routineGuide={routineGuide}
                weeklyReport={weeklyReport}
                analysisResult={analysisResult}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
