import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Microscope, Thermometer, Droplets, Flame, Shield,
  X, ExternalLink,
} from "lucide-react";
import {
  BG_MUTED,
  BORDER_COLOR,
  DEEP_GREEN,
  SCAN_TO,
  TEXT_TERTIARY,
  TEXT_TITLE,
  TEXT_SECONDARY,
  TINT_WARM,
  COLOR_WARNING,
  Z,
} from "./constants";
import { WaitlistModal } from "./WaitlistModal";

export function MyScreenDevice() {
  const { t } = useTranslation();
  const [deviceExpanded, setDeviceExpanded] = useState(false);
  const [showProductPage, setShowProductPage] = useState(false);
  const [showDeviceInquiry, setShowDeviceInquiry] = useState(false);
  const [deviceEmail, setDeviceEmail] = useState("");
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);
  const [deviceSuccess, setDeviceSuccess] = useState(false);

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

  return (
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
              <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <iframe
                  src="https://www.youtube.com/embed/crEvb04l3H4"
                  title={t("device.watchVideo")}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
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

      {/* Product page sheet */}
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

      {/* Device inquiry modal */}
      <WaitlistModal
        open={showDeviceInquiry}
        onClose={() => setShowDeviceInquiry(false)}
        email={deviceEmail}
        onEmailChange={setDeviceEmail}
        isSubmitting={deviceSubmitting}
        isSuccess={deviceSuccess}
        onSubmit={handleDeviceInquiry}
      />
    </>
  );
}
