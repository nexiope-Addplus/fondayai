import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { isTossMiniApp, apiBase, appFetch } from "./utils";
import {
  Sparkles,
  User,
  ChevronRight,
  SmartphoneNfc,
  CalendarDays,
} from "lucide-react";
import {
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  FONT_HEADING,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_WARM,
  RADIUS_SUB,
  PAGE_GRADIENT,
  TEXT_HEADING,
  TEXT_SECONDARY,
  COLOR_DANGER,
  COLOR_INFO,
} from "./constants";
import { getAttendance } from "./utils";
import { AttendanceCalendarModal } from "./AttendanceCalendarModal";
import { PartnershipModal } from "./PartnershipModal";
import { MyScreenProfile } from "./MyScreenProfile";
import { MyScreenDevice } from "./MyScreenDevice";
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
  onLogin?: (p: "kakao" | "line" | "google", tab: string) => void;
  onGoMagazine?: () => void;
  onGoRoutine?: () => void;
  onOpenDiary?: () => void;
  analysisResult?: AnalysisResult | null;
}) {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
  const attendance = getAttendance();

  const handlePartnershipSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch { alert(t("common.error", "오류가 발생했습니다.")); }
    finally { setIsPartnerSubmitting(false); }
  };

  return (
    <div className="h-[calc(100dvh-64px)] overflow-hidden" style={{ background: PAGE_GRADIENT }}>
      {/* 헤더 */}
      <div className="px-4 pt-5 pb-0">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: TINT_WARM }}>
                  <User className="w-4 h-4" style={{ color: SCAN_TO }} />
                </div>
                <h1 className="text-[22px] font-extrabold" style={{ color: TEXT_HEADING, fontFamily: FONT_HEADING }}>{t("nav.my")}</h1>
              </div>
              <p className="text-[13px]" style={{ color: TEXT_SECONDARY, marginLeft: 42 }}>
                {user ? (user.username || user.email || t("nav.my")) : t("attendance.loginDesc")}
              </p>
            </div>
            {user && (
              <div className="px-3 py-2 text-right shrink-0" style={{ borderRadius: RADIUS_SUB, background: BG_MUTED }}>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: TEXT_SECONDARY }}>points</p>
                <p className="text-[24px] font-normal leading-none mt-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{attendance.totalPoints}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4">
        <MyScreenProfile user={user} onLogin={onLogin} />

        {/* ── 섹션B: 유틸리티 (캘린더 + 언어 + 설치) ── */}
        <div className="pt-5 mt-5 mb-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
          {/* 출석 달력 */}
          <button onClick={() => setShowCalendar(true)}
            className="w-full flex items-center justify-between active:opacity-70">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: TINT_WARM }}>
                <CalendarDays className="w-5 h-5" style={{ color: SCAN_TO }} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[14px] font-bold text-[#5C4F4A] truncate">{t("attendance.calendarTitle")}</p>
                <p className="text-xs truncate" style={{ color: TEXT_TERTIARY }}>{t("attendance.totalPoints", { n: attendance.totalPoints })}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: TEXT_TERTIARY }} />
          </button>

          {/* 언어 설정 — 토스 미니앱에서는 한글 고정이므로 숨김 */}
          {!isTossMiniApp() && (
            <>
              <div className="my-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F6F4FB" }}>
                    <Sparkles className="w-4.5 h-4.5" style={{ color: COLOR_INFO }} />
                  </div>
                  <p className="text-[14px] font-bold text-[#5C4F4A]">{t("nav.language")}</p>
                </div>
                <div className="flex gap-1">
                  {(["en", "ko", "ja"] as const).map(lang => (
                    <button key={lang} onClick={() => i18n.changeLanguage(lang)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        i18n.language === lang ? "" : "bg-stone-100"
                      }`}
                      style={i18n.language === lang ? { background: TINT_WARM, color: SCAN_TO } : {}}>
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="my-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />

          {/* 앱 설치 — 토스 미니앱에서는 숨김 */}
          {!isTossMiniApp() && (
            <button onClick={onInstall}
              className="w-full flex items-center justify-between active:opacity-70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFF7ED" }}>
                  <SmartphoneNfc className="w-5 h-5" style={{ color: COLOR_DANGER }} />
                </div>
                <p className="text-[14px] font-bold text-[#5C4F4A] truncate">{t("nav.install")}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: TEXT_TERTIARY }} />
            </button>
          )}

          {/* Fonday 디바이스 — 토스 미니앱에서는 숨김 */}
          {!isTossMiniApp() && <MyScreenDevice />}
        </div>

        {/* 제휴 문의 — 토스 미니앱에서는 숨김 */}
        {!isTossMiniApp() && (
          <div className="pt-4 pb-2 text-center">
            <button onClick={() => setShowPartnership(true)}
              className="text-xs underline underline-offset-2 hover:transition-colors" style={{ color: TEXT_TERTIARY }}>
              {t("result.partnershipLink")}
            </button>
          </div>
        )}
      </div>

      {/* 출석 달력 모달 */}
      <AnimatePresence>
        {showCalendar && <AttendanceCalendarModal onClose={() => setShowCalendar(false)} />}
      </AnimatePresence>

      {/* 제휴 문의 모달 */}
      <PartnershipModal
        open={showPartnership}
        onClose={() => setShowPartnership(false)}
        form={partnerForm}
        onFormChange={setPartnerForm}
        onSubmit={handlePartnershipSubmit}
        submitting={isPartnerSubmitting}
        success={isPartnerSuccess}
      />

      {/* 법적 고지 링크 */}
      <div className="px-4 mt-8 mb-24 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.privacy", "개인정보처리방침")}</a>
        <span className="text-[11px]" style={{ color: BORDER_COLOR }}>|</span>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.terms", "이용약관")}</a>
        <span className="text-[11px]" style={{ color: BORDER_COLOR }}>|</span>
        <a href="/terms.html#disclaimer" target="_blank" rel="noopener noreferrer" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.disclaimer", "AI 면책 고지")}</a>
      </div>
    </div>
  );
}
