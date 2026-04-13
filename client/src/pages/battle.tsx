import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { Shield, Sparkles, ChevronLeft, Zap, ArrowRight, Activity, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BG_BASE, BG_MUTED, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "@/components/fonday/constants";
import { apiBase } from "@/components/fonday/utils";

const SCAN_FROM = "#E5B9A8";
const SCAN_TO = "#C97062";
const DEEP_GREEN = "#2C3E36";
const DEEP_GREEN_LIGHT = "#3A4A43";

// Map baumann letters to colors
const BAUMANN_COLORS: Record<string, string> = { 
  O: "#F59E0B", D: "#3B82F6", S: "#EF4444", R: "#10B981", 
  P: "#A855F7", N: "#6366F1", W: "#EC4899", T: "#14B8A6" 
};

type ScanData = {
  overallScore: string | number;
  scores: { label: string; score: number }[];
  baumannType?: string;
  skinAge?: number | string;
  aiComment?: string;
  createdAt: string;
};

export default function BattlePage() {
  const [, params] = useRoute("/battle/:token");
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [friendScan, setFriendScan] = useState<ScanData | null>(null);
  const [myScan, setMyScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!params?.token) return;

      try {
        setLoading(true);
        // 1. Fetch friend's scan using token (matching Cloudflare API route)
        let res = await fetch(`${apiBase()}/api/shared-scan?token=${params.token}`);

        // Fallback for local Express if needed
        if (res.status === 404) {
           res = await fetch(`${apiBase()}/api/scans/shared/${params.token}`);
        }

        if (!res.ok) {
          throw new Error(res.status === 404 ? t("battle.notFound") : t("battle.loadError"));
        }
        const data = await res.json();
        setFriendScan(data);

        // 2. Fetch my latest scan (logged in) or fallback to sessionStorage (after challenge scan)
        let myFound = false;
        const myRes = await fetch(`${apiBase()}/api/scans`);
        if (myRes.ok) {
          const myData = await myRes.json();
          if (Array.isArray(myData) && myData.length > 0) {
            setMyScan(myData[0]);
            myFound = true;
          }
        }
        if (!myFound) {
          const stored = sessionStorage.getItem('battleMyResult');
          if (stored) {
            try { setMyScan(JSON.parse(stored)); } catch {}
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params?.token]);

  // Handle taking a scan (redirect to home to scan, preserving challenge token)
  const handleTakeScan = () => {
    if (params?.token) sessionStorage.setItem('battleChallengeToken', params.token);
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#C97062] animate-spin" />
      </div>
    );
  }

  if (error || !friendScan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center gap-4" style={{ background: BG_BASE }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: BG_MUTED }}>
          <Shield className="w-8 h-8 text-stone-300" />
        </div>
        <h2 className="text-xl font-black text-[#5C4F4A]">{t("battle.errorTitle")}</h2>
        <p className="text-stone-500 text-sm">{error || t("battle.errorDesc")}</p>
        <Button onClick={() => setLocation("/")} className="mt-4 rounded-xl px-6" variant="outline">
          {t("battle.homeBtn")}
        </Button>
      </div>
    );
  }

  // Animation variants
  const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
  const fadeChild = { 
    initial: { opacity: 0, y: 20 }, 
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } } 
  };

  // Process data for Radar Chart
  const friendScores = friendScan.scores || [];
  const myScores = myScan?.scores || [];
  
  const chartData = friendScores.map((fScore, idx) => {
    const matchingMyScore = myScores.find((m) => m.label === fScore.label);
    const mScoreVal = matchingMyScore ? Number(matchingMyScore.score) : 0;
    
    // Use short labels for the chart
    const shortLabel = t(`scores.${idx}`, fScore.label);
    
    return {
      subject: shortLabel,
      friend: Number(fScore.score),
      me: mScoreVal,
      fullMyScore: matchingMyScore,
    };
  });

  const friendScoreVal = Number(friendScan.overallScore);
  const myScoreVal = myScan ? Number(myScan.overallScore) : 0;
  const isWinner = myScan && (myScoreVal >= friendScoreVal);

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: BG_BASE }}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-50" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <button onClick={() => setLocation("/")} className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors">
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <h1 className="text-lg font-black" style={{ color: DEEP_GREEN }}>{t("battle.title")}</h1>
        <div className="w-10 hidden sm:block" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <motion.div className="px-5 pt-6 space-y-6 max-w-md mx-auto" variants={stagger} initial="initial" animate="animate">
          
          {/* Main Battle Banner */}
          <motion.div variants={fadeChild} className="text-center pt-2 pb-4">
            <h2 className="text-2xl font-black mb-2" style={{ color: DEEP_GREEN }}>
              {myScan ? (isWinner ? t("battle.win") : t("battle.lose")) : t("battle.friendSent")}
            </h2>
            <p className="text-sm text-stone-500">
              {myScan ? t("battle.compareSub") : t("battle.scanSub")}
            </p>
          </motion.div>

          {/* Versus Cards */}
          <motion.div variants={fadeChild} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            {/* Friend Card */}
            <div className="relative p-4 rounded-3xl bg-white flex flex-col items-center justify-center text-center overflow-hidden h-[160px]" style={{ border: `1px solid ${BORDER_COLOR}` }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-stone-100 to-transparent rounded-bl-full opacity-50" />
              <p className="text-xs font-bold mb-2" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("battle.friend")}</p>
              <span className="text-4xl font-light leading-none mb-1" style={{ color: SCAN_TO, fontFamily: FONT_DISPLAY }}>{friendScan.overallScore}</span>
              <p className="text-xs font-bold mb-2" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("battle.totalScore")}</p>
              
              {friendScan.baumannType && (
                <div className="flex items-center justify-center gap-[2px]">
                  {friendScan.baumannType.split('').map((letter, i) => (
                    <span key={i} className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: BAUMANN_COLORS[letter] || "#ccc" }}>
                      {letter}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* VS Badge */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 shadow-md flex items-center justify-center text-white font-black italic text-lg z-10 shrink-0 border-2 border-white ring-4 ring-rose-50">
              VS
            </div>

            {/* My Card */}
            <div className="relative p-4 rounded-3xl flex flex-col items-center justify-center text-center overflow-hidden h-[160px]"
                 style={{
                   background: myScan ? "white" : `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})`,
                   border: myScan ? `1px solid ${BORDER_COLOR}` : "none"
                 }}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
              
              {myScan ? (
                <>
                  <p className="text-xs font-bold mb-2" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("battle.me")}</p>
                  <span className="text-4xl font-light leading-none mb-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{myScan.overallScore}</span>
                  <p className="text-xs font-bold mb-2" style={{ color: TEXT_TERTIARY, fontFamily: FONT_DISPLAY }}>{t("battle.totalScore")}</p>
                  
                  {myScan.baumannType && (
                    <div className="flex items-center justify-center gap-[2px]">
                      {myScan.baumannType.split('').map((letter, i) => (
                        <span key={i} className="text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ background: BAUMANN_COLORS[letter] || "#ccc" }}>
                          {letter}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs font-bold text-white/90">{t("battle.noScanYet")}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Comparison Radar Chart */}
          {myScan && (
            <motion.div variants={fadeChild}>
              <Card className="rounded-3xl overflow-hidden box-border" style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: "none" }}>
                <div className="p-5 pb-0">
                  <h3 className="text-[14px] font-black" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{t("battle.compareTitle")}</h3>
                  <p className="text-xs text-stone-400 mt-1">{t("battle.compareChartSub")}</p>
                </div>
                <div className="w-full h-72 pt-4 box-border">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                      <PolarGrid stroke="#e5e5e5" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#78716c", fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      
                      <Radar name={t("battle.friend")} dataKey="friend" stroke={SCAN_TO} fill={SCAN_TO} fillOpacity={0.2} strokeWidth={2} />
                      <Radar name={t("battle.me")} dataKey="me" stroke={DEEP_GREEN} fill={DEEP_GREEN} fillOpacity={0.4} strokeWidth={2} />
                      
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#444', paddingTop: '10px' }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Detailed Scores List (Only if user has scanned) */}
          {myScan && chartData.length > 0 && (
            <motion.div variants={fadeChild} className="space-y-3 pt-2">
              <h3 className="text-[14px] font-black px-1" style={{ color: DEEP_GREEN, fontFamily: FONT_DISPLAY }}>{t("battle.detailTitle")}</h3>
              {chartData.map((item, i) => {
                const diff = item.me - item.friend;
                const iWon = diff > 0;
                const isTie = diff === 0;

                return (
                  <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between" style={{ border: `1px solid ${BORDER_COLOR}` }}>
                    <div className="flex items-center gap-3 w-[80px] shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: BG_MUTED }}>
                        <Zap className="w-4 h-4 text-stone-400" />
                      </div>
                      <span className="text-[12px] font-bold text-[#6B5D55]">{item.subject}</span>
                    </div>

                    <div className="flex-1 flex justify-center px-4">
                      {isTie ? (
                        <span className="text-xs font-bold text-stone-400 px-3 py-1 bg-stone-100 rounded-full">{t("battle.tie")}</span>
                      ) : iWon ? (
                        <span className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">{t("battle.winLabel", { diff })}</span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">{t("battle.loseLabel", { diff: Math.abs(diff) })}</span>
                      )}
                    </div>

                    <div className="flex flex-col items-end w-[60px] shrink-0 text-xs">
                      <div className="flex items-center gap-1.5 mb-1 text-stone-500">
                        <span>{t("battle.friend")}</span>
                        <span className="font-light text-[12px] text-[#5C4F4A]" style={{ fontFamily: FONT_DISPLAY }}>{item.friend}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: DEEP_GREEN }}>
                        <span>{t("battle.me")}</span>
                        <span className="font-light text-[12px]" style={{ fontFamily: FONT_DISPLAY }}>{item.me}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Action Button */}
          {!myScan && (
            <motion.div variants={fadeChild} className="pt-4">
               <Button 
                onClick={handleTakeScan}
                className="w-full h-16 rounded-2xl text-lg font-black text-white shadow-xl shadow-emerald-900/20 gap-2 overflow-hidden relative group"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}
               >
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                 <Sparkles className="w-5 h-5" />
                 {t("battle.scanBtn")}
                 <ArrowRight className="w-5 h-5 ml-1" />
               </Button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
