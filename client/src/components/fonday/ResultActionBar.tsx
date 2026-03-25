import { Crown, Share2, Trophy, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

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
      className="fixed left-0 right-0 z-[50] flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md"
      style={{ bottom: 60 }}
    >
      <button
        onClick={onShare}
        disabled={shareLoading}
        className="flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-1.5"
        style={{ background: "rgba(74,124,110,0.06)", color: DEEP_GREEN, border: "1.5px solid rgba(74,124,110,0.18)" }}
      >
        {shareLoading ? (
          <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span className="text-[12px]">{baumannType ? t("result.shareType", { type: baumannType }) : t("result.share")}</span>
          </>
        )}
      </button>

      {pendingChallengeToken ? (
        <button
          onClick={onOpenChallenge}
          className="flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-1.5"
          style={{ background: "rgba(201,112,98,0.06)", color: SCAN_TO, border: "1.5px solid rgba(201,112,98,0.18)" }}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[12px]">{t("result.challengeResult")}</span>
        </button>
      ) : (
        <button
          className="flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-1.5"
          style={
            currentShareToken
              ? { background: "rgba(201,112,98,0.06)", color: SCAN_TO, border: "1.5px solid rgba(201,112,98,0.18)" }
              : { background: "rgba(0,0,0,0.02)", color: "#B0A898", border: "1.5px solid rgba(0,0,0,0.06)" }
          }
          disabled={!currentShareToken}
          onClick={onCreateChallenge}
        >
          <Crown className="w-4 h-4" />
          <span className="text-[12px]">{t("result.challengeShort")}</span>
        </button>
      )}
    </div>
  );
}
