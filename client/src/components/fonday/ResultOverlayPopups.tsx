import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
import { PwaInstallPopup } from "./PwaInstallPopup";
import { CheckinSuccessSheet } from "./CheckinSuccessSheet";
import { PushPromptSheet } from "./PushPromptSheet";
import { dismissPushPrompt } from "./utils";

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
      {/* 스트릭 마일스톤 팝업 */}
      <AnimatePresence>
        {streakMilestone && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-16 left-1/2 z-[999] -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-[15px] text-center"
            style={{ background: "#F59E0B" }}
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
            className="fixed bottom-24 left-1/2 z-[999] -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl bg-white flex flex-col items-center gap-1 min-w-[200px]"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          >
            <Target className="w-6 h-6" />
            <p className="font-black text-stone-800 text-[14px]">{t("mission.newAchieve")}</p>
            <p className="text-[12px] text-stone-500">{t(`mission.${missionPops[0]}`)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA 설치 팝업 */}
      <PwaInstallPopup
        open={showPwaPopup}
        onDismiss={() => { setShowPwaPopup(false); localStorage.setItem("fonday_pwa_dismissed", "1"); }}
        deferredPrompt={deferredPrompt}
        onShowInstallGuide={onShowInstallGuide}
      />

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
