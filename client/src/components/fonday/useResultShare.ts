import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { share as tossShare } from "@apps-in-toss/web-framework";
import type { RankingData, MissionState } from "./types";
import { isTossMiniApp, markShareUsed, getMissions, apiBase, appFetch } from "./utils";

export interface UseResultShareParams {
  analysisResult: any;
  finalType: string;
  overallScore: number;
  currentShareToken: string | null;
  rankingData: RankingData | null;
  avoidLunch: { food: string; why: string }[];
  avoidDinner: { food: string; why: string }[];
  surveyData: any;
  setMissionPops: (v: string[]) => void;
  setMissionState: (v: MissionState) => void;
}

export function useResultShare(params: UseResultShareParams): {
  shareLoading: boolean;
  handleShare: () => Promise<void>;
} {
  const { t } = useTranslation();
  const [shareLoading, setShareLoading] = useState(false);
  const {
    analysisResult, finalType, overallScore, currentShareToken,
    rankingData, avoidLunch, avoidDinner,
    setMissionPops, setMissionState,
  } = params;

  const handleShare = async () => {
    if (shareLoading) return;
    setShareLoading(true);

    // 토스 미니앱: OG 미리보기가 포함된 /share/:token 웹 URL 공유
    if (isTossMiniApp()) {
      try {
        const shareText = t("result.shareText", { score: overallScore, type: finalType });
        const token = currentShareToken;
        const shareUrl = token ? `https://fondayai.com/share/${token}` : "https://fondayai.com";
        await tossShare({ message: `${shareText}\n${shareUrl}` });
        const pops = markShareUsed();
        pops.push("scan_bonus");
        if (pops.length) { setMissionPops(pops); setMissionState(getMissions()); }
      } catch (e) {
        console.warn("[share:toss]", e);
      } finally {
        setShareLoading(false);
      }
      return;
    }

    try {
      const scoreLabels = Array.from({ length: 10 }, (_, i) => t(`scores.${i}`));
      const baumannNames: Record<string, string> = {};
      ["O","D","S","R","P","N","W","T"].forEach(l => { baumannNames[l] = t(`baumann.${l}.name`); });

      const nutrients: Record<string, { name: string; foods: string; why: string }> = {};
      finalType.split("").forEach(letter => {
        const arr = t(`nutrients.${letter}`, { returnObjects: true }) as { name: string; foods: string; why: string }[];
        if (arr?.[0]) nutrients[letter] = arr[0];
      });

      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

      const i18nTexts = {
        rankLabel: t("share.rankLabel"),
        overallScoreLabel: t("share.overallScoreLabel"),
        skinAgeLabel: t("share.skinAgeLabel"),
        skinAgeSuffix: t("share.skinAgeSuffix"),
        slide2Sub: t("share.slide2Sub"),
        slide3Sub: t("share.slide3Sub"),
        recIngredient: t("share.recIngredient"),
        slide4Sub: t("share.slide4Sub"),
        slide5Sub: t("share.slide5Sub"),
        footerText: t("share.footerText"),
      };

      const body = {
        lang: i18n.language,
        finalType,
        overallScore,
        skinAge: analysisResult?.skinAge,
        aiComment: analysisResult?.aiComment ?? "",
        rankingPercentile: rankingData?.myPercentile,
        scores: (analysisResult?.scores ?? []).map((s: any) => ({ score: s.score, label: s.label })),
        improvements: (analysisResult?.improvements ?? []).slice(0, 3),
        cosmetics: (analysisResult?.cosmetics ?? []).slice(0, 2),
        nutrients,
        avoidLunch,
        avoidDinner,
        scoreLabels,
        baumannNames,
        scoreSuffix: t("result.scoreSuffix"),
        dateStr,
        i18nTexts,
      };

      const shareController = new AbortController();
      const shareTimeout = setTimeout(() => shareController.abort(), 20000);
      const res = await appFetch(`${apiBase()}/api/generate-share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: shareController.signal,
      }).finally(() => clearTimeout(shareTimeout));
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        throw new Error(`generate-share failed: ${res.status} | ${errBody?.error ?? ""}: ${errBody?.detail ?? ""}`);
      }

      const { slides } = await res.json() as { slides: string[] };
      if (!slides?.length) throw new Error("no slides returned");

      const files: File[] = slides.map((dataUrl, i) => {
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
        return new File([bytes], `fonday-reels-${i + 1}.png`, { type: "image/png" });
      });

      const shareText = t("result.shareText", { score: overallScore, type: finalType });
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: "Fonday AI 피부 분석", text: shareText });
      } else {
        for (const file of files) {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = file.name;
          a.click();
          await new Promise(r => setTimeout(r, 200));
        }
      }
      const pops = markShareUsed();
      if (pops.length) { setMissionPops(pops); setMissionState(getMissions()); }
    } catch (e) {
      console.error("[share]", e);
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          alert(t("common.timeout", "이미지 생성 시간이 초과되었습니다."));
        } else {
          alert(t("common.shareFail", "공유에 실패했습니다."));
        }
      }
    } finally {
      setShareLoading(false);
    }
  };

  return { shareLoading, handleShare };
}
