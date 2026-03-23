import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { DEEP_GREEN, BG_MUTED, BORDER_COLOR, FONT_DISPLAY } from "./constants";

type PartnerForm = {
  name: string;
  company: string;
  email: string;
  message: string;
};

export function PartnershipModal({
  open,
  onClose,
  form,
  onFormChange,
  onSubmit,
  submitting,
  success,
}: {
  open: boolean;
  onClose: () => void;
  form: PartnerForm;
  onFormChange: (next: PartnerForm) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  success: boolean;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm"
            style={{ border: `1px solid ${BORDER_COLOR}` }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: DEEP_GREEN }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            {success ? (
              <div className="py-10 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>
                  {t("modal.partnership.success")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{t("modal.partnership.successDesc")}</p>
              </div>
            ) : (
              <>
                <h3 className="text-center font-extrabold text-lg mb-1" style={{ color: DEEP_GREEN }}>
                  {t("modal.partnership.title")}
                </h3>
                <p
                  className="text-center text-sm leading-relaxed mb-6 text-muted-foreground"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {t("modal.partnership.desc")}
                </p>
                <form onSubmit={onSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder={t("modal.partnership.name")}
                    value={form.name}
                    onChange={(event) => onFormChange({ ...form, name: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none text-sm"
                    style={{ background: BG_MUTED, border: `1px solid ${BORDER_COLOR}` }}
                  />
                  <input
                    type="text"
                    required
                    placeholder={t("modal.partnership.company")}
                    value={form.company}
                    onChange={(event) => onFormChange({ ...form, company: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none text-sm"
                    style={{ background: BG_MUTED, border: `1px solid ${BORDER_COLOR}` }}
                  />
                  <input
                    type="email"
                    required
                    placeholder={t("modal.partnership.email")}
                    value={form.email}
                    onChange={(event) => onFormChange({ ...form, email: event.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none text-sm"
                    style={{ background: BG_MUTED, border: `1px solid ${BORDER_COLOR}` }}
                  />
                  <textarea
                    required
                    placeholder={t("modal.partnership.message")}
                    value={form.message}
                    onChange={(event) => onFormChange({ ...form, message: event.target.value })}
                    rows={3}
                    className="w-full px-4 py-3.5 rounded-xl focus:outline-none text-sm resize-none"
                    style={{ background: BG_MUTED, border: `1px solid ${BORDER_COLOR}` }}
                  />
                  <Button
                    disabled={submitting}
                    type="submit"
                    className="w-full h-14 rounded-2xl font-bold text-[15px] text-white"
                    style={{ background: DEEP_GREEN }}
                  >
                    {submitting ? t("modal.partnership.submitting") : t("modal.partnership.submit")}
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
