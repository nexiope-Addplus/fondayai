import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";

import { DEEP_GREEN, SCAN_TO, TINT_WARM, BORDER_COLOR } from "./constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ResultLoginCard({
  loginPromptRef,
  socialLoginButton,
  onGoogleLogin,
  onGoSolution,
}: {
  loginPromptRef: Ref<HTMLDivElement>;
  socialLoginButton: ReactNode;
  onGoogleLogin: () => void;
  onGoSolution: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div ref={loginPromptRef}>
      <Card className="rounded-3xl p-6 text-center" style={{ background: "#FFFFFF", border: `1px solid ${BORDER_COLOR}` }}>
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold" style={{ color: DEEP_GREEN }}>{t("result.login.title")}</CardTitle>
          <CardDescription className="text-xs">{t("result.login.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          {socialLoginButton}
          <Button onClick={onGoogleLogin} className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-semibold text-zinc-700 gap-2 shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            {t("result.login.google")}
          </Button>
        </CardContent>
      </Card>
      <button
        onClick={onGoSolution}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
        style={{ background: TINT_WARM, color: SCAN_TO }}
      >
        <Leaf className="w-4 h-4" />
        <span>{t("result.tab.solution")} →</span>
      </button>
    </div>
  );
}
