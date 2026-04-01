import { Crown, Share2, Trophy, Swords } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  DEEP_GREEN,
  SCAN_TO,
  BORDER_COLOR,
  TEXT_TERTIARY,
} from "./constants";

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
      {/* 공유 버튼 — 보조 (작게) */}
      <button
        onClick={onShare}
        disabled={shareLoading}
        className="w-12 h-12 rounded-full font-semibold flex items-center justify-center shrink-0"
        style={{ background: "rgba(74,124,110,0.06)", color: DEEP_GREEN, border: "1.5px solid rgba(74,124,110,0.18)" }}
      >
        {shareLoading ? (
          <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>

      {/* 챌린지 버튼 — 메인 CTA (크게) */}
      {pendingChallengeToken ? (
        <button
          onClick={onOpenChallenge}
          className="flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-1.5"
          style={{ background: SCAN_TO, color: "#fff" }}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[13px]">{t("result.challengeResult")}</span>
        </button>
      ) : (
        <button
          className="flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-1.5"
          style={
            currentShareToken
              ? { background: SCAN_TO, color: "#fff" }
              : { background: "rgba(0,0,0,0.04)", color: TEXT_TERTIARY, border: "1.5px solid rgba(0,0,0,0.06)" }
          }
          disabled={!currentShareToken}
          onClick={onCreateChallenge}
        >
          <Swords className="w-4 h-4" />
          <span className="text-[13px]">{t("result.challengeFriend", "친구한테 도전하기")}</span>
        </button>
      )}
    </div>
  );
}
