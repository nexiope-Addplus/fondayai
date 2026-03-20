import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Bell, Smartphone } from "lucide-react";
import { DEEP_GREEN } from "./constants";
import { isIOS, isAndroid, isPWA } from "./utils";

// ─── 푸시 구독 유도 바텀시트 ─────────────────────────────────────
export function PushPromptSheet({ onAllow, onDismiss, isLoading }: {
  onAllow: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}) {
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
              <Smartphone className="w-10 h-10 mx-auto mb-2" style={{ color: DEEP_GREEN }} />
              <h3 className="font-bold text-stone-800 text-lg mt-2">{t("pushPrompt.iosTitle")}</h3>
              <p className="text-stone-500 text-[13px] mt-1.5 leading-relaxed">{t("pushPrompt.iosDesc")}</p>
            </div>
            <div className="space-y-3.5 mb-5">
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
              <Bell className="w-10 h-10 mx-auto mb-2" style={{ color: DEEP_GREEN }} />
              <h3 className="font-bold text-stone-800 text-lg mt-2">{t("pushPrompt.title")}</h3>
              <p className="text-stone-500 text-[13px] mt-1.5 leading-relaxed">{t("pushPrompt.desc")}</p>
              {isAndroid() && (
                <span className="inline-block mt-2 text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Android</span>
              )}
            </div>
            <button
              onClick={onAllow}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-bold text-white text-[15px] mb-2"
              style={{ background: DEEP_GREEN }}
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
