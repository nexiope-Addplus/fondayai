import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  BookOpen,
  ScanLine,
  AlertCircle,
  Shield,
  Sun,
  Share2,
  LineChart as LineChartIcon,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Heart,
  Droplets,
  Grid,
  Activity,
  Target,
  Flame,
  Eye,
  Zap,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type TabId = "scan" | "magazine";
type ScanState = "idle" | "survey" | "scanning" | "result";

interface SurveyData {
  gender: string;
  age: string;
  skinType: string;
  concerns: string[];
  condition: string;
}

interface Hotspot {
  x: number;
  y: number;
  type: string;
}

interface AnalysisResult {
  scores: { label: string; score: number }[];
  hotspots: Hotspot[];
  aiComment: string;
}

const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const TEXT_SECONDARY = "#8C8070";

const fadeChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const iconMap: Record<string, any> = {
  "종합 컨디션": Sparkles,
  "수분 밸런스": Droplets,
  "붉은기 수준": Sun,
  "모공 상태": Grid,
  "주름 및 탄력": Activity,
  "잡티/색소침착": Target,
  "트러블 위험": Flame,
  "다크서클": Eye,
};

const colorMap: Record<string, string> = {
  "종합 컨디션": "#D4836B",
  "수분 밸런스": "#3B82C4",
  "붉은기 수준": "#E05A3A",
  "모공 상태": "#4A7C6E",
  "주름 및 탄력": "#8C8070",
  "잡티/색소침착": "#A67C52",
  "트러블 위험": "#D97706",
  "다크서클": "#6366F1",
};

const articles = [
  {
    id: 1,
    title: "수부지가 절대 쓰면 안 되는 화장품 성분 3가지",
    summary: "겉은 번들거리는데 속은 땅기는 수분부족형 지성 피부. 흔히 쓰는 이 성분이 오히려 피부를 망치고 있을 수 있습니다.",
    tag: "성분 분석",
    readTime: "3분",
    gradient: "from-amber-50 via-orange-50 to-yellow-50",
    icon: AlertCircle,
  },
  {
    id: 2,
    title: "아토피 아이를 위한 올바른 보습제 바르는 법",
    summary: "보습제는 단순히 많이 바른다고 좋은 게 아닙니다. 소아 피부과 전문의가 알려주는 정확한 보습 루틴.",
    tag: "육아 스킨케어",
    readTime: "5분",
    gradient: "from-emerald-50 via-teal-50 to-cyan-50",
    icon: Shield,
  },
  {
    id: 3,
    title: "붉은기 가라앉히는 골든타임 10분 팩 루틴",
    summary: "외출 후 달아오른 얼굴, 10분 안에 진정시키는 응급 처치법. 집에 있는 재료만으로 충분합니다.",
    tag: "응급 케어",
    readTime: "4분",
    gradient: "from-rose-50 via-pink-50 to-red-50",
    icon: Sun,
  },
];

function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border transition-colors">
      <div className="max-w-md mx-auto px-6">
        <Tabs value={active} onValueChange={(v) => onChange(v as TabId)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-[60px] bg-transparent">
            <TabsTrigger value="scan" className="data-[state=active]:text-[#2D5F4F] data-[state=active]:bg-transparent flex flex-col gap-1">
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-semibold">AI 스캔</span>
            </TabsTrigger>
            <TabsTrigger value="magazine" className="data-[state=active]:text-[#2D5F4F] data-[state=active]:bg-transparent flex flex-col gap-1">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-semibold">매거진</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
}

function ScanIdleScreen({ onCapture }: { onCapture: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };
  return (
    <motion.div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "calc(100dvh - 60px)" }} variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="mb-4">
        <Badge variant="outline" className="px-3 py-1 border-[#3D7A66] text-[#3D7A66] font-bold tracking-widest uppercase text-[10px]">
          AI Skin Scanner
        </Badge>
      </motion.div>
      <motion.div variants={fadeChild} className="mb-10">
        <h1 className="text-2xl font-bold mb-2 tracking-tight">피부의 목소리를 들어보세요</h1>
        <p className="text-[15px] font-medium leading-relaxed text-muted-foreground">지금 내 피부 상태,<br />AI가 <span className="font-bold text-[#2D5F4F]">3초</span>만에 알려줄게요.</p>
      </motion.div>
      <motion.div variants={fadeChild}>
        <Button
          onClick={() => fileRef.current?.click()}
          size="icon"
          className="w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
          style={{ background: `radial-gradient(circle at 35% 35%, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}
        >
          <ScanLine className="w-12 h-12" />
          <span className="text-[14px] font-bold leading-snug px-6">내 피부 상태<br />AI로 3초 스캔하기</span>
        </Button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleChange} />
      </motion.div>
      <motion.div variants={fadeChild} className="mt-10 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: DEEP_GREEN_LIGHT }} />
        <span className="text-[11px] font-medium" style={{ color: TEXT_SECONDARY }}>
          카메라로 셀카를 찍으면 분석 준비가 시작돼요
        </span>
      </motion.div>
    </motion.div>
  );
}

function SurveyScreen({ onSubmit, onBack }: { onSubmit: (data: SurveyData) => void; onBack: () => void }) {
  const [gender, setGender] = useState("여성");
  const [age, setAge] = useState("20대 후반");
  const ageGroups = ["10대", "20대 초반", "20대 후반", "30대 초반", "30대 후반", "40대 초반", "40대 후반", "50대+"];
  const skinConcerns = ["모공/피지", "주름/탄력", "트러블/민감", "기미/잡티", "다크서클", "건조함"];
  const [concerns, setConcerns] = useState<string[]>([]);
  const toggleConcern = (concern: string) => { setConcerns(prev => prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]); };

  return (
    <motion.div className="px-6 py-8 flex flex-col gap-8 min-h-[calc(100dvh-60px)]" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild}>
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold text-[#2D5F4F]">피부 분석 기초 정보</h2>
        </div>
        <p className="text-[13px] text-muted-foreground ml-10">정확한 분석을 위해 현재 상태를 선택해 주세요.</p>
      </motion.div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-8 pb-10">
          <div className="space-y-3">
            <label className="text-[12px] font-bold text-[#3D7A66] ml-1 uppercase tracking-wider">성별</label>
            <div className="flex gap-2">
              {["여성", "남성"].map(item => (
                <Button key={item} onClick={() => setGender(item)} variant={gender === item ? "default" : "outline"} className={`flex-1 h-14 rounded-xl text-[14px] font-bold ${gender === item ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>{item}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold text-[#3D7A66] ml-1 uppercase tracking-wider">나이대</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map(item => (
                <Button key={item} onClick={() => setAge(item)} variant={age === item ? "default" : "outline"} className={`h-12 rounded-xl text-[13px] font-bold ${age === item ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>{item}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold text-[#3D7A66] ml-1 uppercase tracking-wider">피부 고민 (다중)</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map(item => (
                <Button key={item} onClick={() => toggleConcern(item)} variant={concerns.includes(item) ? "secondary" : "outline"} className={`h-12 rounded-xl text-[12px] font-bold ${concerns.includes(item) ? "bg-[#3D7A66] text-white hover:bg-[#3D7A66]" : ""}`}>{item}</Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <motion.div variants={fadeChild} className="pt-6 sticky bottom-4">
        <Button onClick={() => onSubmit({ gender, age, skinType: "복합성", concerns, condition: "맨얼굴" })} className="w-full h-14 rounded-2xl font-bold text-white shadow-xl bg-[#2D5F4F] hover:bg-[#3D7A66] transition-all text-lg">AI 분석 시작</Button>
      </motion.div>
    </motion.div>
  );
}

function ScanningScreen({ imageSrc }: { imageSrc: string | null }) {
  const [textIdx, setTextIdx] = useState(0);
  const texts = ["사진 데이터 최적화 중...", "AI 피부 고민 부위 탐색 중...", "수분 및 유분 정밀 분석 중...", "리포트 결과 요약 중..."];

  useEffect(() => {
    const interval = setInterval(() => setTextIdx(prev => (prev + 1) % texts.length), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] bg-background px-6">
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-muted flex items-center justify-center shadow-inner">
        {imageSrc ? (
          <img src={imageSrc} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-16 h-16 opacity-10" />
        )}
        <motion.div className="absolute left-0 right-0 h-1 bg-[#2D5F4F] shadow-[0_0_15px_rgba(45,95,79,0.5)]" animate={{ top: ["5%", "95%", "5%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2D5F4F] animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Scanning</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p key={textIdx} className="font-bold text-xl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            {texts[textIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground italic">전문적인 피부 분석 리포트를 생성하고 있습니다.</p>
      </div>
    </div>
  );
}

function ResultScreen({ surveyData, analysisResult, imageSrc, onBack, onGoMagazine, user }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/scans").then(res => res.json()).then(data => setHistory(data.slice(0, 5).reverse()));
      if (!isSaved && analysisResult) {
        const overallScore = analysisResult.scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;
        fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overallScore, scores: analysisResult.scores, hotspots: analysisResult.hotspots, aiComment: analysisResult.aiComment, imageSrc })
        }).then(() => setIsSaved(true));
      }
    }
  }, [user]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData, analysisResult }),
      });
      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => { setShowWaitlist(false); setIsSuccess(false); setEmail(""); }, 2000);
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scores = analysisResult?.scores || [];
  const overallScore = scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;

  const isOily = (scores.find((s: any) => s.label === "모공 상태")?.score ?? 100) < 50;
  const isSens = (scores.find((s: any) => s.label === "붉은기 수준")?.score ?? 0) > 50;
  const isPig = (scores.find((s: any) => s.label === "잡티/색소침착")?.score ?? 0) > 50;
  const isWrink = (scores.find((s: any) => s.label === "주름 및 탄력")?.score ?? 100) < 60;
  const finalType = `${isOily ? 'O' : 'D'}${isSens ? 'S' : 'R'}${isPig ? 'P' : 'N'}${isWrink ? 'W' : 'T'}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fonday AI 피부 분석 리포트',
          text: `오늘 내 피부 점수는 ${overallScore}점! 바우만 타입은 ${finalType}형이 나왔어요. #Fonday #피부분석 #AI스킨케어`,
          url: window.location.href,
        });
      } catch (err) { /* 사용자 취소 */ }
    } else {
      alert('리포트를 캡처해서 공유해 주세요!');
    }
  };

  const chartData = history.map(item => ({
    date: new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    score: parseInt(item.overallScore)
  }));

  return (
    <ScrollArea className="h-[calc(100dvh-60px)]">
      <motion.div className="px-5 pt-6 pb-24 space-y-6" variants={stagger} initial="initial" animate="animate">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-full gap-1.5 border-[#2D5F4F] text-[#2D5F4F] hover:bg-emerald-50">
            <Camera className="w-4 h-4" /> 다시 촬영
          </Button>
          <h2 className="text-xl font-black text-[#2D5F4F] tracking-tight">AI 피부 리포트</h2>
        </div>

        {/* 이미지 + 핫스팟 */}
        <Card className="overflow-hidden border-none shadow-2xl rounded-3xl">
          <div className="relative w-full h-56">
            <img src={imageSrc} className="w-full h-full object-cover object-top" />
            {analysisResult?.hotspots?.map((dot: any, i: number) => (
              <motion.div key={i} className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-red-500 shadow-lg" style={{ left: `${dot.x}%`, top: `${dot.y}%` }} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} />
            ))}
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Detection Active</span>
            </div>
          </div>
        </Card>

        {/* 점수 카드 */}
        <Card className="border-none shadow-md rounded-3xl bg-white dark:bg-zinc-900">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#2D5F4F] text-white text-3xl font-black shadow-lg">{overallScore}</div>
              <div>
                <CardTitle className="text-lg font-bold text-[#2D5F4F]">{surveyData?.age} {surveyData?.gender}</CardTitle>
                <CardDescription>
                  바우만 <span className="font-bold" style={{ color: "#D4836B" }}>{finalType}</span>형
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {scores.map((item: any, i: number) => {
              const Icon = iconMap[item.label] || Zap;
              const color = colorMap[item.label] || DEEP_GREEN;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800 shadow-sm">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <motion.span style={{ color }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.1, type: "spring" }}>
                      {item.score}점
                    </motion.span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: "0%" }} animate={{ width: `${item.score}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 1 }} />
                  </div>
                </div>
              );
            })}
            {analysisResult?.aiComment && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 text-[14px] leading-relaxed italic text-emerald-900">
                " {analysisResult.aiComment} "
              </div>
            )}
          </CardContent>
        </Card>

        {/* 맞춤 가이드 링크 */}
        <Button variant="outline" onClick={() => onGoMagazine()} className="w-full h-12 rounded-2xl gap-2 border-[#2D5F4F]/20 text-[#2D5F4F]">
          <Leaf className="w-4 h-4" />
          맞춤 응급처치 가이드 보러 가기
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* 히스토리 그래프 (로그인 시) */}
        {user ? (
          <Card className="border-none shadow-md rounded-3xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-[#2D5F4F]" />
                <CardTitle className="text-base font-bold">피부 변화 추이</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...chartData, { date: '오늘', score: overallScore }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2D5F4F" strokeWidth={3} dot={{ r: 4, fill: '#2D5F4F', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.avatar && <img src={user.avatar} className="w-6 h-6 rounded-full border border-emerald-100" />}
                  <span className="text-[12px] font-bold text-[#2D5F4F]">{user.username}님</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => fetch("/api/logout", { method: "POST" }).then(() => window.location.reload())} className="text-[11px] text-muted-foreground underline h-auto p-0 hover:bg-transparent">
                  로그아웃
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-3xl p-6 text-center">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-bold text-[#2D5F4F]">변화 과정을 기록하세요</CardTitle>
              <CardDescription className="text-xs">3초 로그인으로 내 피부 히스토리를 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <Button onClick={() => window.location.href = "/auth/kakao"} className="w-full h-12 rounded-xl bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] font-bold border-none gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.712 4.8 4.346 6.09l-.843 3.09c-.067.247.078.47.284.47.098 0 .195-.03.273-.09l3.63-2.4c.42.06.85.094 1.31.094 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/></svg>
                카카오로 계속하기
              </Button>
              <Button onClick={() => window.location.href = "/auth/google"} variant="outline" className="w-full h-12 rounded-xl bg-white font-bold text-zinc-700">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" /> Google로 계속하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 얼리버드 알림 받기 */}
        <Button
          onClick={() => setShowWaitlist(true)}
          className="w-full h-14 rounded-2xl text-white font-bold shadow-lg"
          style={{ background: "linear-gradient(135deg, #D4836B, #C06A55)" }}
        >
          <span className="flex items-center gap-2">Fonday 얼리버드 알림 받기 <ArrowRight className="w-5 h-5" /></span>
        </Button>

        {/* 결과 공유 */}
        <Button onClick={handleShare} className="w-full h-14 rounded-2xl text-white font-bold shadow-lg hover:opacity-90 transition-opacity bg-gradient-to-r from-[#f09433] via-[#bc1888] to-[#8a3ab9]">
          <Share2 className="w-5 h-5 mr-2" /> 결과 공유하기
        </Button>
      </motion.div>

      {/* 얼리버드 모달 */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowWaitlist(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-xl"
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-[#2D5F4F]">
                <Heart className="w-7 h-7 text-white" />
              </div>
              {isSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg text-[#2D5F4F]">등록이 완료되었습니다!</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-2 text-[#2D5F4F]">얼리버드 등록</h3>
                  <p className="text-center text-sm leading-relaxed mb-6 text-muted-foreground">특별한 혜택을 드립니다!</p>
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <input
                      type="email"
                      required
                      placeholder="이메일을 입력해 주세요"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F]/30 dark:bg-zinc-800 dark:border-zinc-700"
                    />
                    <Button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full h-14 rounded-2xl font-bold text-[15px] text-white bg-[#2D5F4F] hover:bg-[#3D7A66]"
                    >
                      {isSubmitting ? "등록 중..." : "등록할게요!"}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
}

function MagazineTab() {
  return (
    <ScrollArea className="h-[calc(100dvh-60px)]">
      <motion.div className="px-5 pt-6 pb-24 space-y-6" variants={stagger} initial="initial" animate="animate">
        <h1 className="text-2xl font-black text-[#2D5F4F] tracking-tight">뷰티 인사이트</h1>
        <div className="space-y-4">
          {articles.map((article) => {
            const Icon = article.icon;
            return (
              <Card key={article.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl flex gap-4 p-4 items-center">
                <div className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br ${article.gradient} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-8 h-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[9px] font-bold bg-emerald-50 text-[#2D5F4F] hover:bg-emerald-50 rounded-md px-1.5 py-0">
                    {article.tag}
                  </Badge>
                  <h3 className="text-[15px] font-bold leading-tight">{article.title}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{article.summary}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </ScrollArea>
  );
}

export default function SkinScanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/user").then((res) => res.ok ? res.json() : null).then((data) => setUser(data)).catch(() => setUser(null));
  }, []);

  const handleCapture = useCallback((file: File) => {
    setImageFile(file);
    setImageSrc(URL.createObjectURL(file));
    setScanState("survey");
  }, []);

  const handleSurveySubmit = useCallback(async (data: SurveyData) => {
    setSurveyData(data);
    setScanState("scanning");
    if (!imageFile) return;
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async () => {
      try {
        const response = await fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result, surveyData: data }),
        });
        const result = await response.json();
        setAnalysisResult(result);
        setScanState("result");
      } catch (err) {
        alert("분석 실패");
        setScanState("idle");
      }
    };
  }, [imageFile]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <div className="absolute top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <div className="max-w-md mx-auto relative min-h-[100dvh]">
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {scanState === "idle" && <ScanIdleScreen onCapture={handleCapture} />}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen imageSrc={imageSrc} />}
              {scanState === "result" && <ResultScreen surveyData={surveyData} analysisResult={analysisResult} imageSrc={imageSrc} onBack={() => setScanState("idle")} onGoMagazine={() => setActiveTab("magazine")} user={user} />}
            </motion.div>
          )}
          {activeTab === "magazine" && <MagazineTab />}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
