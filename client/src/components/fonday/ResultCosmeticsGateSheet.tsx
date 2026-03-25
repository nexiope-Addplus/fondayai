import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { BG_MUTED, BORDER_COLOR, DEEP_GREEN, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";

type LoginProvider = "kakao" | "line" | "google";

export function ResultCosmeticsGateSheet({
  open,
  language,
  onClose,
  onLogin,
}: {
  open: boolean;
  language: string;
  onClose: () => void;
  onLogin: (provider: LoginProvider) => void;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            className="relative bg-white rounded-t-[32px] w-full max-w-md p-6 pb-10"
            style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: "linear-gradient(135deg, #1A3B2E, #4A7C6E)" }}
              >
                🧴
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: DEEP_GREEN }}>
                  {t("cosmetics.loginGateTitle")}
                </p>
                <p className="text-[12px]" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("cosmetics.loginGateSubtitle")}</p>
              </div>
            </div>
            <p className="text-[13px] text-stone-600 mb-3 leading-relaxed">{t("cosmetics.loginGateDesc")}</p>

            <div className="rounded-2xl p-4 mb-5 space-y-3.5 border" style={{ background: BG_MUTED, borderColor: BORDER_COLOR }}>
              {[
                t("cosmetics.loginGateBullet1"),
                t("cosmetics.loginGateBullet2"),
                t("cosmetics.loginGateBullet3"),
                t("cosmetics.loginGateBullet4"),
                t("cosmetics.loginGateBullet5"),
              ].map((bullet, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: DEEP_GREEN }}
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-[12px] text-stone-700 font-medium">{bullet}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3.5">
              {language === "ko" ? (
                <button
                  onClick={() => onLogin("kakao")}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#FEE500", color: "#3C1E1E" }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z"
                      fill="#3C1E1E"
                    />
                  </svg>
                  {t("cosmetics.loginGateKakao")}
                </button>
              ) : (
                <button
                  onClick={() => onLogin("line")}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-white"
                  style={{ background: DEEP_GREEN }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z"
                      fill="white"
                    />
                  </svg>
                  {t("cosmetics.loginGateLine")}
                </button>
              )}

              <button
                onClick={() => onLogin("google")}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 bg-white text-stone-700"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-4 h-4"
                />
                {t("cosmetics.loginGateGoogle")}
              </button>

              <button onClick={onClose} className="w-full py-2.5 text-[13px] font-semibold text-stone-400">
                {t("cosmetics.loginGateLater")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
