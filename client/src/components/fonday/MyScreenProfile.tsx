import React from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { isTossMiniApp } from "./utils";
import {
  BORDER_COLOR,
  DEEP_GREEN,
  SCAN_TO,
  TEXT_TERTIARY,
  TEXT_LABEL,
  TINT_WARM,
} from "./constants";

interface MyScreenProfileProps {
  user: any;
  onLogin?: (p: "kakao" | "line" | "google", tab: string) => void;
}

export function MyScreenProfile({ user, onLogin }: MyScreenProfileProps) {
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    fetch("/api/logout", { method: "POST" }).then(() => window.location.reload());
  };

  if (user) {
    return (
      <div className="pt-5 mt-5 mb-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.avatar
              ? <img src={user.avatar} alt={user.username || "프로필"} className="w-10 h-10 rounded-full" width={40} height={40} loading="lazy" />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: TINT_WARM }}>
                  <User className="w-5 h-5" style={{ color: SCAN_TO }} />
                </div>
            }
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#5C4F4A] truncate">{user.username || user.email || t("nav.my")}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {user.provider === "kakao" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold text-[#3C1E1E]" style={{ background: "#FEE500" }}>
                    <svg width="10" height="10" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
                    카카오
                  </span>
                )}
                {user.provider === "line" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold text-white" style={{ background: DEEP_GREEN }}>
                    <svg width="10" height="10" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.582 1 1 3.79 1 7.222c0 2.03 1.09 3.84 2.8 5.04-.12.44-.77 2.96-.8 3.15a.2.2 0 0 0 .3.22l3.72-2.46c.6.09 1.3.14 1.98.14 4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="white"/></svg>
                    LINE
                  </span>
                )}
                {user.provider === "google" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold bg-white" style={{ color: TEXT_LABEL }}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-2.5 h-2.5" />
                    Google
                  </span>
                )}
                {user.email && <p className="text-xs truncate max-w-[160px]" style={{ color: TEXT_TERTIARY }}>{user.email}</p>}
              </div>
            </div>
          </div>
          {!isTossMiniApp() && (
            <button onClick={handleLogout}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl active:opacity-70"
              style={{ background: TINT_WARM, color: SCAN_TO }}>
              {t("modal.diary.logout")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isTossMiniApp() && onLogin) {
    return (
      <div className="pt-5 mt-5 mb-4 space-y-3" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        <div className="text-center mb-2">
          <p className="text-[14px] font-bold text-[#6B5D55] mb-1">{t("report.loginRequired")}</p>
          <p className="text-[12px]" style={{ color: TEXT_TERTIARY }}>{t("attendance.loginDesc")}</p>
        </div>
        {i18n.language === "ko" ? (
          <button onClick={() => onLogin("kakao", "my")}
            className="w-full font-bold text-[13px] gap-2 flex items-center justify-center border-0 text-[#3C1E1E]"
            style={{ background: "#FEE500", height: 48, borderRadius: 24 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/></svg>
            {t("cosmetics.loginGateKakao", "카카오로 시작하기")}
          </button>
        ) : (
          <button onClick={() => onLogin("line", "my")}
            className="w-full font-bold text-[13px] gap-2 flex items-center justify-center border-0 text-white"
            style={{ background: "#06C755", height: 48, borderRadius: 24 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 7.56c0-3.16-3.13-5.73-6.98-5.73S1.04 4.4 1.04 7.56c0 2.83 2.47 5.2 5.82 5.65.23.05.53.15.61.35.07.18.05.46.02.64l-.1.58c-.03.18-.14.69.6.38.74-.32 3.98-2.38 5.43-4.07C14.54 9.88 15 8.78 15 7.56Z" fill="white"/></svg>
            {t("cosmetics.loginGateLine", "LINEで始める")}
          </button>
        )}
        <button onClick={() => onLogin("google", "my")}
          className="w-full font-bold text-[13px] gap-2 flex items-center justify-center bg-white text-[#6B5D55]"
          style={{ height: 48, borderRadius: 24, border: "1px solid #E0DBD5" }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="" />
          {t("cosmetics.loginGateGoogle", "Google로 시작하기")}
        </button>
      </div>
    );
  }

  return null;
}
