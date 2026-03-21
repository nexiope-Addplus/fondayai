import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  User,
  ChevronRight,
  CalendarDays,
  BookOpen,
  SmartphoneNfc,
  Activity,
  Clock3,
  BrainCircuit,
  ScanLine,
} from "lucide-react";
import {
  DEEP_GREEN,
  SCAN_TO,
  TINT_WARM,
  TINT_GREEN,
} from "./constants";
import { getAttendance } from "./utils";
import { AttendanceCalendarModal } from "./AttendanceCalendarModal";
import type { AnalysisResult } from "./types";

// Re-export for backward compatibility
export { AttendanceCalendarModal } from "./AttendanceCalendarModal";
export { CosmeticsRegisterModal } from "./CosmeticsRegisterModal";

export function MyScreen({
  user,
  onInstall,
  onBack,
  onLogin,
  onGoMagazine,
  onGoRoutine,
  onOpenDiary,
  analysisResult,
}: {
  user: any;
  onInstall: () => void;
  onBack: () => void;
  onLogin?: (p: "kakao"|"line"|"google", tab: string) => void;
  onGoMagazine?: () => void;
  onGoRoutine?: () => void;
  onOpenDiary?: () => void;
  analysisResult?: AnalysisResult | null;
}) {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const attendance = getAttendance();

  useEffect(() => {
    if (!user) return;
    setLoadingScans(true);
    fetch("/api/scans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setScans(Array.isArray(data) ? data : []))
      .catch(() => setScans([]))
      .finally(() => setLoadingScans(false));
  }, [user]);

  const latestScan = scans[0] ?? null;
  const historyPreview = scans.slice(0, 4);
  const latestScores = useMemo(() => {
    if (!latestScan?.scores || !Array.isArray(latestScan.scores)) return [];
    return [...latestScan.scores]
      .sort((a: any, b: any) => Number(a.score) - Number(b.score))
      .slice(0, 3);
  }, [latestScan]);

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).then(() => window.location.reload());
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] pb-28" style={{ background: "#F8F5F2" }}>
      {/* 헤더 */}
      <div className="px-5 pt-5 pb-0">
        <div className="rounded-3xl p-5" style={{ background: "#FFFFFF", boxShadow: "0 10px 28px rgba(45,95,79,0.08)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>FONDAY</p>
              <h1 className="text-2xl font-bold" style={{ color: DEEP_GREEN }}>{t("nav.my")}</h1>
              <p className="text-[12px] text-stone-500 mt-1">
                {user ? (user.username || user.email || t("nav.my")) : t("attendance.loginDesc")}
              </p>
            </div>
            <div className="rounded-2xl px-3 py-2 text-right shrink-0" style={{ background: TINT_WARM }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: SCAN_TO }}>points</p>
              <p className="text-xl font-bold leading-none mt-1" style={{ color: DEEP_GREEN }}>{attendance.totalPoints}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN }}>
              {t("attendance.calendarTitle")}
            </span>
            <span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: TINT_WARM, color: SCAN_TO }}>
              {t("attendance.totalPoints", { n: attendance.totalPoints })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-3">
        {/* 프로필 */}
        {user ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
            <div className="flex items-center gap-3">
              {user.avatar
                ? <img src={user.avatar} className="w-10 h-10 rounded-full" />
                : <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: TINT_WARM }}>
                    <User className="w-5 h-5" style={{ color: SCAN_TO }} />
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
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-stone-600 bg-white">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-2.5 h-2.5" />
                      Google
                    </span>
                  )}
                  {user.email && <p className="text-[11px] text-stone-400">{user.email}</p>}
                </div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl active:opacity-70"
              style={{ background: TINT_WARM, color: SCAN_TO }}>
              {t("modal.diary.logout")}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white space-y-3" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
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
              className="w-full h-11 rounded-xl font-bold text-[13px] gap-2 bg-white text-stone-700 flex items-center justify-center">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
              {t("attendance.google")}
            </button>
          </div>
        )}

        {/* 출석 달력 */}
        <button onClick={() => setShowCalendar(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white active:opacity-70"
          style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: TINT_WARM }}>
              <CalendarDays className="w-5 h-5" style={{ color: SCAN_TO }} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-stone-800">{t("attendance.calendarTitle")}</p>
              <p className="text-[11px] text-stone-400">{t("attendance.totalPoints", { n: attendance.totalPoints })}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>

        {user && (
          <>
            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                    {t("my.manageEyebrow")}
                  </p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {t("my.manageTitle")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={onBack} className="rounded-2xl p-3 text-left" style={{ background: "#F6FBF8" }}>
                  <ScanLine className="w-4 h-4 mb-2" style={{ color: DEEP_GREEN }} />
                  <p className="text-[12px] font-bold text-stone-800">{t("nav.scan")}</p>
                  <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{t("my.manageScan")}</p>
                </button>
                <button onClick={onGoRoutine} className="rounded-2xl p-3 text-left" style={{ background: "#FFF7F3" }}>
                  <Sparkles className="w-4 h-4 mb-2" style={{ color: SCAN_TO }} />
                  <p className="text-[12px] font-bold text-stone-800">{t("nav.routine")}</p>
                  <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{t("my.manageRoutine")}</p>
                </button>
                <button onClick={onOpenDiary} className="rounded-2xl p-3 text-left" style={{ background: "#F7F4FB" }}>
                  <BookOpen className="w-4 h-4 mb-2 text-[#7C3AED]" />
                  <p className="text-[12px] font-bold text-stone-800">{t("nav.diary")}</p>
                  <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{t("my.manageDiary")}</p>
                </button>
                <button onClick={onGoMagazine} className="rounded-2xl p-3 text-left" style={{ background: "#F8FAFD" }}>
                  <ChevronRight className="w-4 h-4 mb-2 text-stone-500" />
                  <p className="text-[12px] font-bold text-stone-800">{t("nav.magazine")}</p>
                  <p className="text-[11px] text-stone-500 mt-1 text-kr-pretty">{t("my.manageDiscover")}</p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                    {t("my.reportEyebrow")}
                  </p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {t("my.reportTitle")}
                  </p>
                  <p className="text-[12px] text-stone-500 mt-1 text-kr-pretty">
                    {latestScan
                      ? t("my.reportDesc")
                      : t("my.reportEmpty")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: TINT_GREEN }}>
                  <BrainCircuit className="w-5 h-5" style={{ color: DEEP_GREEN }} />
                </div>
              </div>

              {latestScan ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl p-3" style={{ background: "#F6FBF8" }}>
                    <p className="text-[10px] text-stone-400">{t("result.overall")}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: DEEP_GREEN }}>{latestScan.overallScore}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#FFF7F3" }}>
                    <p className="text-[10px] text-stone-400">{t("result.skinAge")}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: SCAN_TO }}>{latestScan.skinAge ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: "#F7F4FB" }}>
                    <p className="text-[10px] text-stone-400">{t("result.baumannLabel")}</p>
                    <p className="text-xl font-bold mt-1 text-stone-800">{latestScan.baumannType || "—"}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                    {t("my.predictionEyebrow")}
                  </p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {t("my.predictionTitle")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F7F4FB" }}>
                  <Sparkles className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
              </div>
              {analysisResult?.prediction?.good ? (
                <div className="mt-4 rounded-2xl p-3" style={{ background: "#F7F4FB" }}>
                  <p className="text-[11px] font-semibold text-stone-500">
                    {t("result.prediction.daysAfter", { days: analysisResult.prediction.good.days })}
                  </p>
                  <p className="text-[20px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {analysisResult.prediction.good.score}{t("result.scoreSuffix")}
                  </p>
                  <p className="text-[12px] text-stone-600 mt-2 text-kr-pretty">
                    {analysisResult.prediction.good.scenario}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl p-3" style={{ background: "#F8FAFD" }}>
                  <p className="text-[12px] text-stone-500 text-kr-pretty">{t("my.predictionEmpty")}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                    {t("my.historyEyebrow")}
                  </p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {t("my.historyTitle")}
                  </p>
                  <p className="text-[12px] text-stone-500 mt-1 text-kr-pretty">
                    {t("my.historyDesc")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#F6FBF8" }}>
                  <Clock3 className="w-5 h-5" style={{ color: DEEP_GREEN }} />
                </div>
              </div>
              {loadingScans ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
                </div>
              ) : historyPreview.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {historyPreview.map((scan) => (
                    <div key={scan.id} className="rounded-2xl p-3 flex items-center justify-between gap-3" style={{ background: "#F8FAFD" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: TINT_WARM }}>
                          <ScanLine className="w-4.5 h-4.5" style={{ color: SCAN_TO }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-stone-800 truncate">
                            {new Date(scan.createdAt).toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-[11px] text-stone-400 truncate">{scan.baumannType || "Baumann"} · {scan.skinAge ?? "—"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-stone-400">{t("result.overall")}</p>
                        <p className="text-[16px] font-bold" style={{ color: DEEP_GREEN }}>{scan.overallScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl p-3" style={{ background: "#F8FAFD" }}>
                  <p className="text-[12px] text-stone-500">{t("my.historyEmpty")}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                    {t("my.archiveEyebrow")}
                  </p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                    {t("my.archiveTitle")}
                  </p>
                </div>
              </div>
              {historyPreview.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {historyPreview.map((scan, index) => (
                    <div key={`archive-${scan.id ?? index}`} className="rounded-2xl p-3 flex items-center justify-between gap-3" style={{ background: "#FAF8F5" }}>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-stone-800 truncate">
                          {t("my.archiveCard", { number: historyPreview.length - index })}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1 truncate">
                          {(scan.baumannType || "Baumann")} · {scan.skinAge ?? "—"} · {new Date(scan.createdAt).toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US")}
                        </p>
                      </div>
                      <p className="text-[14px] font-bold shrink-0" style={{ color: DEEP_GREEN }}>{scan.overallScore}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl p-3" style={{ background: "#F8FAFD" }}>
                  <p className="text-[12px] text-stone-500 text-kr-pretty">{t("my.archiveEmpty")}</p>
                </div>
              )}
            </div>

            {latestScores.length > 0 && (
              <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: SCAN_TO }}>
                      {t("my.focusEyebrow")}
                    </p>
                    <p className="text-[16px] font-bold mt-1" style={{ color: DEEP_GREEN }}>
                      {t("my.focusTitle")}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#FFF7F3" }}>
                    <Activity className="w-5 h-5" style={{ color: SCAN_TO }} />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {latestScores.map((score: any, index: number) => (
                    <div key={`${score.label}-${index}`} className="rounded-2xl p-3 flex items-center justify-between gap-3" style={{ background: "#FFF9F7" }}>
                      <p className="text-[12px] font-semibold text-stone-700">{score.label}</p>
                      <p className="text-[14px] font-bold" style={{ color: SCAN_TO }}>{score.score}{t("result.scoreSuffix")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 언어 설정 */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white" style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F6F4FB" }}>
              <Sparkles className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.language")}</p>
          </div>
          <div className="flex gap-1">
            {(["en", "ko", "ja"] as const).map(lang => (
              <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  i18n.language === lang ? "" : "text-stone-400 bg-stone-100"
                }`}
                style={i18n.language === lang ? { background: TINT_WARM, color: SCAN_TO } : {}}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 앱 설치 */}
        <button onClick={onInstall}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white active:opacity-70"
          style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
              <SmartphoneNfc className="w-5 h-5" style={{ color: "#C2410C" }} />
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.install")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>

        {/* 매거진 */}
        <button onClick={onGoMagazine}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-white active:opacity-70"
          style={{ boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F6F4FB" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#7C3AED" }} />
            </div>
            <p className="text-[14px] font-bold text-stone-800">{t("nav.magazine")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300" />
        </button>
        {/* Fonday 디바이스 링크 */}
        <a href="https://fonday.replit.app/" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl active:opacity-70 transition-opacity"
          style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(45,95,79,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: TINT_WARM }}>
              <Zap className="w-5 h-5" style={{ color: SCAN_TO }} />
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: SCAN_TO }}>{t("result.deviceTeaser.title")}</p>
              <p className="text-[11px] text-stone-400">{t("result.deviceTeaser.sub")}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: SCAN_TO }} />
        </a>
      </div>

      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>
    </div>
  );
}
