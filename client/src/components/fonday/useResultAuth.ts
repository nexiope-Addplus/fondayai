import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { Button } from "@/components/ui/button";
import React from "react";

export interface UseResultAuthParams {
  analysisResult: any;
  surveyData: any;
  imageBase64: any;
  user: any;
  onOpenDiary?: () => void;
  loginPromptRef: React.RefObject<HTMLDivElement>;
  // Form state for partnership & waitlist
  partnerForm: { name: string; company: string; email: string; message: string };
  setPartnerForm: (v: { name: string; company: string; email: string; message: string }) => void;
  setIsPartnerSubmitting: (v: boolean) => void;
  setIsPartnerSuccess: (v: boolean) => void;
  setShowPartnership: (v: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  setIsSubmitting: (v: boolean) => void;
  setIsSuccess: (v: boolean) => void;
  setShowWaitlist: (v: boolean) => void;
}

export function useResultAuth(params: UseResultAuthParams) {
  const { t } = useTranslation();
  const {
    analysisResult, surveyData, imageBase64, user, onOpenDiary, loginPromptRef,
    partnerForm, setPartnerForm, setIsPartnerSubmitting, setIsPartnerSuccess, setShowPartnership,
    email, setEmail, setIsSubmitting, setIsSuccess, setShowWaitlist,
  } = params;

  const openLoginPopup = useCallback((provider: "kakao" | "line" | "google", returnTab?: string) => {
    if (returnTab) localStorage.setItem("fonday_return_tab", returnTab);
    if (analysisResult) localStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    const lang = localStorage.getItem("fonday_lang") || "ko";
    window.location.href = `/auth/${provider}?lang=${lang}`;
  }, [analysisResult, surveyData, imageBase64]);

  const handleGoogleLogin = () => openLoginPopup("google");
  const handleKakaoLogin = () => openLoginPopup("kakao");
  const handleLineLogin = () => openLoginPopup("line");

  const isKo = i18n.language === "ko";
  const socialLoginButton = isKo ? (
    React.createElement(Button, {
      onClick: handleKakaoLogin,
      className: "w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]",
      style: { background: "#FEE500" },
    },
      React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none" },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z", fill: "#3C1E1E" })
      ),
      t("result.login.kakao")
    )
  ) : (
    React.createElement(Button, {
      onClick: handleLineLogin,
      className: "w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-white",
      style: { background: "#06C755" },
    },
      React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 18 18", fill: "none" },
        React.createElement("path", { d: "M15 7.56c0-3.16-3.13-5.73-6.98-5.73S1.04 4.4 1.04 7.56c0 2.83 2.47 5.2 5.82 5.65.23.05.53.15.61.35.07.18.05.46.02.64l-.1.58c-.03.18-.14.69.6.38.74-.32 3.98-2.38 5.43-4.07C14.54 9.88 15 8.78 15 7.56Z", fill: "white" })
      ),
      t("result.login.line")
    )
  );

  const handleDiaryEntry = () => {
    if (user) {
      onOpenDiary?.();
      return;
    }
    loginPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleOpenDiaryCalendar = () => {
    sessionStorage.setItem("fonday_diary_target_tab", "calendar");
    handleDiaryEntry();
  };

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnerSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xzdjpden", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm),
      });
      if (res.ok) {
        setIsPartnerSuccess(true);
        setTimeout(() => { setShowPartnership(false); setIsPartnerSuccess(false); setPartnerForm({ name: "", company: "", email: "", message: "" }); }, 2000);
      }
    } catch { alert(t("common.error", "오류가 발생했습니다.")); }
    finally { setIsPartnerSubmitting(false); }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData, analysisResult }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { setShowWaitlist(false); setIsSuccess(false); setEmail(""); }, 2000);
      }
    } catch { alert(t("common.error", "오류가 발생했습니다.")); }
    finally { setIsSubmitting(false); }
  };

  return {
    openLoginPopup,
    handleGoogleLogin,
    handleKakaoLogin,
    handleLineLogin,
    socialLoginButton,
    handleDiaryEntry,
    handleOpenDiaryCalendar,
    handlePartnershipSubmit,
    handleWaitlistSubmit,
  };
}
