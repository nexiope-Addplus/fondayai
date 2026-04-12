import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { isTossMiniApp } from "./utils";
import {
  Sparkles,
  Zap,
  User,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  SmartphoneNfc,
  Microscope, Thermometer, Droplets, Flame, Shield, ArrowRight,
  X, ExternalLink, Play,
} from "lucide-react";
import {
  BG_BASE,
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  FONT_DISPLAY,
  FONT_HEADING,
  SCAN_TO,
  TEXT_TERTIARY,
  TINT_WARM,
  TINT_GREEN,
  SHADOW_CARD,
  RADIUS_CARD,
  RADIUS_SUB,
  PAGE_GRADIENT,
  Z,
  TEXT_HEADING,
  TEXT_TITLE,
  TEXT_LABEL,
  TEXT_SECONDARY,
  COLOR_WARNING,
  COLOR_DANGER,
  COLOR_INFO,
} from "./constants";
import { getAttendance } from "./utils";
import { AttendanceCalendarModal } from "./AttendanceCalendarModal";
import { PartnershipModal } from "./PartnershipModal";
import { WaitlistModal } from "./WaitlistModal";
import type { AnalysisResult } from "./types";

// Re-export for backward compatibility
export { AttendanceCalendarModal } from "./AttendanceCalendarModal";
export { CosmeticsRegisterModal } from "./CosmeticsRegisterModal";

export function MyScreen({
  user,
  onInstall,
  onBack,
  onGoMagazine,
  onGoRoutine,
  onOpenDiary,
  analysisResult,
}: {
  user: any;
  onInstall: () => void;
  onBack: () => void;
  onGoMagazine?: () => void;
  onGoRoutine?: () => void;
  onOpenDiary?: () => void;
  analysisResult?: AnalysisResult | null;
}) {
  const { t, i18n } = useTranslation();
  const [showCalendar, setShowCalendar] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [deviceExpanded, setDeviceExpanded] = useState(false);
  const [showProductPage, setShowProductPage] = useState(false);
  const [showDeviceInquiry, setShowDeviceInquiry] = useState(false);
  const [deviceEmail, setDeviceEmail] = useState("");
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);
  const [deviceSuccess, setDeviceSuccess] = useState(false);
  const [showPartnership, setShowPartnership] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", company: "", email: "", message: "" });
  const [isPartnerSubmitting, setIsPartnerSubmitting] = useState(false);
  const [isPartnerSuccess, setIsPartnerSuccess] = useState(false);
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

  const handleDeviceInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeviceSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xzdjpden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deviceEmail, type: "device_inquiry" }),
      });
      if (res.ok) {
        setDeviceSuccess(true);
        setTimeout(() => { setShowDeviceInquiry(false); setDeviceSuccess(false); setDeviceEmail(""); }, 2000);
      }
    } catch {} finally { setDeviceSubmitting(false); }
  };

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
        {/* ── 섹션A: 프로필 ── */}
        {user && (
          <div className="pt-5 mt-5 mb-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: TINT_WARM }}>
                <User className="w-5 h-5" style={{ color: SCAN_TO }} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#5C4F4A] truncate">{user.username || "토스 사용자"}</p>
              </div>
            </div>
          </div>
        )}

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

          {/* 구분선 */}
          <div className="my-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />

          {/* 앱 설치 — 토스 미니앱/네이티브 앱에서는 숨김 */}
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
          {!isTossMiniApp() && (
            <>
          <div className="my-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
          <button
            onClick={() => setDeviceExpanded((v) => !v)}
            className="w-full flex items-center justify-between active:opacity-70"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: TINT_WARM }}>
                <Microscope className="w-5 h-5" style={{ color: "#C97062" }} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#5C4F4A]">{t("result.deviceTeaser.title")}</p>
                <p className="text-[11px]" style={{ color: TEXT_TERTIARY }}>COMING SOON</p>
              </div>
            </div>
            <ChevronDown
              className="w-4 h-4 shrink-0 transition-transform duration-200"
              style={{ color: TEXT_TERTIARY, transform: deviceExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          <AnimatePresence>
            {deviceExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>
                    {t("device.description")}
                  </p>

                  {/* 4가지 측정 기능 */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Thermometer, key: "device.skinTemp", color: "#E85D3A" },
                      { icon: Droplets, key: "device.moisture", color: "#2B7FBF" },
                      { icon: Flame, key: "device.oil", color: COLOR_WARNING },
                      { icon: Shield, key: "device.barrier", color: DEEP_GREEN },
                    ].map(({ icon: Icon, key, color }) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ background: BG_MUTED }}>
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <span className="text-[13px] font-semibold" style={{ color: TEXT_TITLE }}>{t(key)}</span>
                      </div>
                    ))}
                  </div>

                  {/* YouTube 영상 */}
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src="https://www.youtube.com/embed/crEvb04l3H4"
                      title={t("device.watchVideo")}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  {/* 자세히 보기 + 문의하기 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowProductPage(true)}
                      className="flex-1 flex items-center justify-center gap-2 text-[13px] font-bold py-3 rounded-2xl active:opacity-70"
                      style={{ background: TINT_WARM, color: SCAN_TO }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t("device.learnMore")}
                    </button>
                    <button
                      onClick={() => setShowDeviceInquiry(true)}
                      className="flex-1 flex items-center justify-center gap-2 text-[13px] font-bold py-3 rounded-2xl active:opacity-70"
                      style={{ background: `${DEEP_GREEN}10`, color: DEEP_GREEN }}
                    >
                      {t("device.inquiry", "문의하기")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </>
          )}
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

      {/* 디바이스 제품 페이지 시트 */}
      <AnimatePresence>
        {showProductPage && (
          <motion.div
            className="fixed inset-0 flex flex-col"
            style={{ zIndex: Z.modal }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowProductPage(false)} />
            <motion.div
              className="relative mt-12 flex-1 bg-white rounded-t-[24px] flex flex-col overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER_COLOR }}>
                <p className="text-[14px] font-bold" style={{ color: TEXT_TITLE }}>{t("result.deviceTeaser.title")}</p>
                <button
                  onClick={() => setShowProductPage(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: BG_MUTED }}
                >
                  <X className="w-4 h-4" style={{ color: TEXT_SECONDARY }} />
                </button>
              </div>
              <iframe
                src="https://fonday.replit.app/"
                title={t("result.deviceTeaser.title")}
                className="flex-1 w-full border-0"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 법적 고지 링크 */}
      <div className="px-4 mt-8 mb-24 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href="/legal/privacy" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.privacy", "개인정보처리방침")}</a>
        <span className="text-[11px]" style={{ color: BORDER_COLOR }}>|</span>
        <a href="/legal/terms" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.terms", "이용약관")}</a>
        <span className="text-[11px]" style={{ color: BORDER_COLOR }}>|</span>
        <a href="/legal/disclaimer" className="text-[11px]" style={{ color: TEXT_TERTIARY }}>{t("legal.disclaimer", "AI 면책 고지")}</a>
      </div>

      {/* 디바이스 문의 모달 */}
      <WaitlistModal
        open={showDeviceInquiry}
        onClose={() => setShowDeviceInquiry(false)}
        email={deviceEmail}
        onEmailChange={setDeviceEmail}
        isSubmitting={deviceSubmitting}
        isSuccess={deviceSuccess}
        onSubmit={handleDeviceInquiry}
      />
    </div>
  );
}
