import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ClipboardList,
  Lock,
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
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  SCAN_FROM,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_GREEN,
  TINT_NEUTRAL,
  TINT_WARM,
  DIARY_CAUSE_TAGS,
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

export function DiaryTab({ user, analysisResult, onBack, onLogin }: { user: AppUser | null; analysisResult: AnalysisResult | null; onBack?: () => void; onLogin?: (p: "kakao"|"line"|"google", tab: string) => void }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<"calendar" | "timeline" | "report">("calendar");
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
      <div className="flex flex-col" style={{ background: BG_BASE, minHeight: "calc(100dvh - 64px)" }}>
        <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
          <div className="rounded-3xl p-5 mb-4"
            style={{ background: DEEP_GREEN }}>
            <p className="text-xs font-medium tracking-widest uppercase mb-1 text-white/70" style={{ fontFamily: FONT_DISPLAY }}>FONDAY</p>
            <h1 className="text-2xl font-normal text-white" style={{ fontFamily: FONT_DISPLAY }}>{t("modal.diary.title")} ✦</h1>
            <p className="text-[12px] text-white/80 mt-2 text-kr-pretty">{t("result.login.desc")}</p>
          </div>
        </div>
        <div className="flex-1 px-5 py-6">
          <Card className="rounded-3xl overflow-hidden"
            style={{ background: TINT_WARM, border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${SCAN_TO})` }}>
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold mt-4" style={{ color: DEEP_GREEN }}>{t("result.login.title")}</p>
              <p className="text-[12px] text-stone-500 mt-2 leading-relaxed text-kr-pretty">{t("result.login.desc")}</p>
              <div className="grid grid-cols-3 gap-2.5 mt-5 text-left">
                <div className="rounded-2xl p-3" style={{ background: TINT_WARM }}>
                  <p className="text-xs font-bold text-stone-500">{t("result.diary.avg7d")}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: SCAN_TO }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: "#F5F3FF" }}>
                  <p className="text-xs font-bold text-stone-500">{t("modal.diary.timelineTab")}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: "#7C3AED" }}>--</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: TINT_GREEN }}>
                  <p className="text-xs font-bold text-stone-500">{t("modal.diary.calendarTab")}</p>
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
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
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
    <div className="flex flex-col" style={{ background: BG_BASE, minHeight: "calc(100dvh - 64px)" }}>
      {/* 헤더 */}
      <div className="shrink-0 px-5 pt-5 pb-0" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
          <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>FONDAY</p>
          <h1 className="text-2xl font-normal" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{t("modal.diary.title")}</h1>
          <p className="text-[13px] mt-2 text-kr-pretty" style={{ color: TEXT_TERTIARY }}>
            {finalType ? `${finalType} · ` : ""}{totalRecords > 0 ? `${t("modal.diary.countLabel", { count: totalRecords })}` : t("result.diary.firstRecord")}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-2xl p-3 text-center border" style={{ borderColor: BORDER_COLOR }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_TERTIARY }}>{t("result.overall")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{overallScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 text-center border" style={{ borderColor: BORDER_COLOR }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_TERTIARY }}>{t("result.diary.avg7d")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: "#7C3AED", fontFamily: FONT_DISPLAY }}>{avgScore || "—"}</p>
            </div>
            <div className="rounded-2xl p-3 text-center border" style={{ borderColor: BORDER_COLOR }}>
              <p className="text-[11px] font-medium whitespace-nowrap" style={{ color: TEXT_TERTIARY }}>{t("diary.routineTitle")}</p>
              <p className="text-[24px] font-normal mt-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{diaryTodoProgress.total > 0 ? `${diaryTodoProgress.done}/${diaryTodoProgress.total}` : (diaryMemoReady ? "1/1" : "0/1")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div ref={diaryScrollRef} className="flex-1 overflow-y-auto overscroll-contain pb-24">
        {overallScore === 0 && (
          <div className="mx-5 mt-3 mb-0">
            <button
              onClick={onBack}
              className="w-full flex items-center gap-3 p-4 rounded-2xl active:opacity-70"
              style={{ background: TINT_GREEN, border: `1px solid ${DEEP_GREEN}20` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
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
        <div ref={diaryTabNavRef} className="px-5 pt-2 pb-0 sticky top-0 z-20" style={{ background: `${BG_BASE}F0` }}>
          <div className="flex gap-2 p-2 rounded-3xl mb-3" style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
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
                <Card className="rounded-3xl overflow-hidden" style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold tracking-[0.16em] uppercase" style={{ color: SCAN_TO }}>{t("modal.diary.reminderTitle")}</p>
                        <p className="text-base font-bold mt-1 text-kr-pretty" style={{ color: DEEP_GREEN }}>{t("modal.diary.reminderHeadline")}</p>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed text-kr-pretty">
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
