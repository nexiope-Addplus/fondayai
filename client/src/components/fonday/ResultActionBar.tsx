import { Crown, Share2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { DEEP_GREEN, SCAN_TO, BORDER_COLOR } from "./constants";

export function ResultActionBar({
  shareLoading,
  pendingChallengeToken,
  currentShareToken,
  onShare,
  onOpenChallenge,
  onCreateChallenge,
  baumannType,
}: {
  shareLoading: boolean;
  pendingChallengeToken: string | null;
  currentShareToken: string | null;
  onShare: () => void;
  onOpenChallenge: () => void;
  onCreateChallenge: () => void;
  baumannType?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed left-0 right-0 z-[50] flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-stone-100"
      style={{ bottom: 60, borderTopColor: BORDER_COLOR }}
    >
      <Button
        onClick={onShare}
        disabled={shareLoading}
        aria-label={shareLoading ? t("common.loading") : t("result.share")}
        aria-busy={shareLoading}
        className="flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-1.5 border"
        style={{ background: "#FFFFFF", color: DEEP_GREEN, borderColor: "#D6E7DF" }}
      >
        {shareLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" aria-hidden="true" />
            <span className="sr-only">{t("common.loading")}</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-[12px]">{baumannType ? `${baumannType}형 공유하기` : t("result.share")}</span>
          </>
        )}
      </Button>

      {pendingChallengeToken ? (
        <Button
          onClick={onOpenChallenge}
          className="flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-1.5 border"
          style={{ background: "#FFFFFF", color: "#7C3AED", borderColor: "#E9DDFF" }}
        >
          <Trophy className="w-4 h-4" aria-hidden="true" />
          <span className="text-[12px]">{t("result.challengeResult")}</span>
        </Button>
      ) : (
        <Button
          className="flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-1"
          style={
            currentShareToken
              ? { background: "#FFFFFF", color: SCAN_TO, border: `1px solid ${SCAN_TO}33` }
              : { background: "#F8FAFC", color: "#9CA3AF", border: "1px solid #E5E7EB" }
          }
          disabled={!currentShareToken}
          onClick={onCreateChallenge}
        >
          <Crown className="w-4 h-4" aria-hidden="true" />
          <span className="text-[12px]">{t("result.challengeShort")}</span>
        </Button>
      )}
    </div>
  );
}
