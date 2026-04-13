import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
import { isTossMiniApp } from "./utils";
import { PwaInstallPopup } from "./PwaInstallPopup";
import { CheckinSuccessSheet } from "./CheckinSuccessSheet";
import { PushPromptSheet } from "./PushPromptSheet";
import { dismissPushPrompt, haptic } from "./utils";

type ResultOverlayPopupsProps = {
  streakMilestone: number | null;
  missionPops: string[];
  showPwaPopup: boolean;
  setShowPwaPopup: (v: boolean) => void;
  deferredPrompt: any;
  onShowInstallGuide: () => void;
  showCheckinSheet: boolean;
  setShowCheckinSheet: (v: boolean) => void;
  user: any;
  handleKakaoLogin: () => void;
  handleLineLogin: () => void;
  handleGoogleLogin: () => void;
  showPushPrompt: boolean;
  setShowPushPrompt: (v: boolean) => void;
  pushLoading: boolean;
  handlePushToggle: () => Promise<void>;
};

export function ResultOverlayPopups({
  streakMilestone, missionPops,
  showPwaPopup, setShowPwaPopup, deferredPrompt, onShowInstallGuide,
  showCheckinSheet, setShowCheckinSheet, user, handleKakaoLogin, handleLineLogin, handleGoogleLogin,
  showPushPrompt, setShowPushPrompt, pushLoading, handlePushToggle,
}: ResultOverlayPopupsProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* 스트릭 마일스톤 팝업 — 티어별 차등 */}
      <AnimatePresence>
        {streakMilestone && streakMilestone < 10 && (
          <motion.div
            key="milestone-small"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-16 left-1/2 z-[999] -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-[15px] text-center"
            style={{ background: "#F59E0B" }}
          >
            {t("streak.milestone", { count: streakMilestone })}
          </motion.div>
        )}
        {streakMilestone && streakMilestone >= 10 && streakMilestone < 20 && (
          <motion.div
            key="milestone-medium"
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            onAnimationComplete={() => haptic("medium")}
            className="fixed top-14 left-1/2 z-[999] -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white font-black text-[17px] text-center"
            style={{ background: "linear-gradient(135deg, #F59E0B, #EF6C00)", minWidth: 220 }}
          >
            {t("streak.milestone", { count: streakMilestone })}
          </motion.div>
        )}
        {streakMilestone && streakMilestone >= 20 && (
          <motion.div
            key="milestone-large"
            initial={{ opacity: 0, y: -50, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.85 }}
            onAnimationComplete={() => haptic("medium")}
            className="fixed top-12 left-1/2 z-[999] -translate-x-1/2 px-10 py-5 rounded-3xl shadow-2xl text-white text-center"
            style={{ background: "linear-gradient(135deg, #F59E0B, #D32F2F)", minWidth: 260, boxShadow: "0 12px 40px rgba(245,158,11,0.35)" }}
          >
            <p className="font-black text-[20px] leading-tight">{t("streak.milestone", { count: streakMilestone })}</p>
            <p className="text-[13px] font-semibold mt-1 text-white/80">{t("streak.deltaUp", { n: streakMilestone })}</p>
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
            className="fixed bottom-24 left-1/2 z-[999] -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl bg-white flex flex-col items-center gap-1 min-w-[200px]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            <Target className="w-6 h-6" />
            <p className="font-black text-[#5C4F4A] text-[14px]">{t("mission.newAchieve")}</p>
            <p className="text-[12px] text-stone-500">{t(`mission.${missionPops[0]}`)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA 설치 팝업 — 토스 미니앱/네이티브 앱에서는 표시 안 함 */}
      {!isTossMiniApp() && (
        <PwaInstallPopup
          open={showPwaPopup}
          onDismiss={() => { setShowPwaPopup(false); localStorage.setItem("fonday_pwa_dismissed", "1"); }}
          deferredPrompt={deferredPrompt}
          onShowInstallGuide={onShowInstallGuide}
        />
      )}

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
    </>
  );
}
