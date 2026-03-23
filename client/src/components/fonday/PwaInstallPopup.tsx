import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { isIOS } from "./utils";

export function PwaInstallPopup({ open, onDismiss, deferredPrompt, onShowInstallGuide }: any) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pwapopup"
          className="fixed inset-0 z-[210] flex items-end justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { onDismiss(); }} />
          <motion.div
            className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl p-7"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-md">
                <img src="/icon-192.png" alt="Fonday" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: "#2D5F4F" }}>{t("install.popupTitle")}</p>
                <p className="text-[13px] text-stone-500 mt-0.5">{t("install.popupDesc")}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onDismiss();
                if (isIOS() || !deferredPrompt) {
                  onShowInstallGuide?.();
                } else {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(() => {}).catch(() => {});
                }
              }}
              className="w-full h-12 rounded-2xl font-bold text-white mb-3"
              style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}
            >
              {isIOS() || !deferredPrompt ? t("install.popupIosBtn") : t("install.popupBtn")}
            </button>
            <button
              onClick={() => { onDismiss(); }}
              className="w-full h-10 rounded-2xl font-medium text-stone-400 text-[14px]"
            >
              {t("install.popupDismiss")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
