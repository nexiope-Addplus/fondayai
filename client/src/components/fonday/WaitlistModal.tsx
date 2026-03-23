import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCAN_FROM, SCAN_TO, DEEP_GREEN, BG_MUTED, BORDER_COLOR } from "./constants";

export function WaitlistModal({ open, onClose, email, onEmailChange, isSubmitting, isSuccess, onSubmit }: any) {
  const { t } = useTranslation();
  return (
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onClose()}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm"
              style={{ border: `1px solid ${BORDER_COLOR}` }}
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                <Heart className="w-7 h-7 text-white" />
              </div>
              {isSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>{t("modal.waitlist.success")}</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-2" style={{ color: DEEP_GREEN }}>{t("modal.waitlist.title")}</h3>
                  <p className="text-center text-sm leading-relaxed mb-6 text-muted-foreground">{t("modal.waitlist.desc")}</p>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <input type="email" required placeholder={t("modal.waitlist.email")} value={email}
                      onChange={e => onEmailChange(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl focus:outline-none text-sm"
                      style={{ background: BG_MUTED, border: `1px solid ${BORDER_COLOR}` }} />
                    <Button disabled={isSubmitting} type="submit"
                      className="w-full h-14 rounded-2xl font-bold text-[15px] text-white"
                      style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                      {isSubmitting ? t("modal.waitlist.submitting") : t("modal.waitlist.submit")}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
