import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { motion } from "framer-motion";
import { FileText, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BAUMANN_COLORS, DEEP_GREEN, SCAN_FROM, SCAN_TO,
  SCORE_ICONS, SCORE_COLORS, stagger, fadeChild,
} from "./constants";
import { apiBase } from "./utils";

// ─── 리포트 탭 ────────────────────────────────────────────────────
export function ReportTab({ user }: { user: any }) {
  const { t } = useTranslation();
  const [lastScan, setLastScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${apiBase()}/api/scans`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setLastScan(data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-64px)]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#C97062] animate-spin" />
      </div>
    );
  }

  if (!lastScan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px)] px-6 text-center gap-4">
        <FileText className="w-12 h-12 text-stone-200" />
        <p className="text-stone-400 text-sm whitespace-pre-line">{t("report.noRecord")}</p>
      </div>
    );
  }

  const date = new Date(lastScan.createdAt);
  const baumannLetters = lastScan.baumannType ? lastScan.baumannType.split("") : [];

  return (
    <div className="h-[calc(100dvh-64px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-24 space-y-4" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeChild} className="flex items-center justify-between">
          <h2 className="text-xl font-black" style={{ color: DEEP_GREEN }}>{t("report.title")}</h2>
          <span className="text-xs text-stone-400">
            {date.toLocaleDateString(i18n.language === "ko" ? "ko-KR" : i18n.language === "ja" ? "ja-JP" : "en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </motion.div>

        {/* 요약 */}
        <motion.div variants={fadeChild}>
          <Card className="border-none shadow-md rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <span className="text-3xl font-black leading-none">{lastScan.overallScore}</span>
                  <span className="text-xs font-bold opacity-80 mt-1">{t("report.overall")}</span>
                </div>
                {lastScan.skinAge && (
                  <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                    style={{ background: "#8B5CF6" }}>
                    <span className="text-3xl font-black leading-none">{lastScan.skinAge}</span>
                    <span className="text-xs font-bold opacity-80 mt-1">{t("report.skinAge")}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-[13px] text-stone-500">{t("report.baumannLabel")}</span>
                    <span className="text-xl font-black" style={{ color: SCAN_TO }}>{lastScan.baumannType}</span>
                    <span className="text-[13px] text-stone-500">{t("report.baumannSuffix")}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {baumannLetters.map((letter: string, i: number) => {
                      const color = BAUMANN_COLORS[letter];
                      if (!color) return null;
                      return <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}>{t(`baumann.${letter}.name`)}</span>;
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI 총평 */}
        {lastScan.aiComment && (
          <motion.div variants={fadeChild}>
            <Card className="border-none shadow-md rounded-3xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{t("report.aiComment")}</p>
                </div>
                <p className="text-[13px] text-stone-600 leading-relaxed">{lastScan.aiComment}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 항목별 점수 */}
        {lastScan.scores?.length > 0 && (
          <motion.div variants={fadeChild}>
            <Card className="border-none shadow-md rounded-3xl">
              <CardHeader className="pb-1 pt-5 px-5">
                <p className="text-sm font-bold" style={{ color: DEEP_GREEN }}>{t("result.scores")}</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {lastScan.scores.map((item: any, i: number) => {
                  const Icon = SCORE_ICONS[i] || Zap;
                  const color = SCORE_COLORS[i] || DEEP_GREEN;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-stone-50 shadow-sm">
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <span className="text-[#6B5D55]">{t(`scores.${i}`)}</span>
                        </div>
                        <span style={{ color }}>{item.score}{t("result.scoreSuffix")}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-stone-100">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: "0%" }} animate={{ width: `${item.score}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 피부 챌린지 초대 버튼 */}
        {lastScan.shareToken && (
          <motion.div variants={fadeChild}>
            <Button
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg flex items-center justify-center gap-2 rounded-2xl transition-all"
              onClick={() => {
                const shareUrl = `${window.location.origin}/battle/${lastScan.shareToken}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'Fonday AI 피부 챌린지!',
                    text: `내 피부 점수(${lastScan.overallScore}점, ${lastScan.baumannType})를 확인하고 나와 겨뤄보세요!`,
                    url: shareUrl,
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert(t("battle.linkCopied", "챌린지 링크가 복사되었습니다!"));
                  });
                }
              }}
            >
              <Crown className="w-6 h-6" /> 친구에게 피부 챌린지 보내기
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
