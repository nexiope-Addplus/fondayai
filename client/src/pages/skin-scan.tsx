import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  BookOpen,
  Lock,
  Sparkles,
  ArrowRight,
  Heart,
  Clock,
  ChevronRight,
  ScanLine,
  Droplets,
  Sun,
  Shield,
  Leaf,
  AlertCircle,
  Grid,
  Activity,
  Target,
  Flame,
  Eye,
  Zap,
  Instagram,
  LineChart as LineChartIcon,
  Save,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
const BEIGE = "#F5F0EB";
const TEXT_SECONDARY = "#8C8070";

const fadeChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
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
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "scan", label: "AI 스캔", icon: Camera },
    { id: "magazine", label: "매거진", icon: BookOpen },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border transition-colors">
      <div className="flex items-center justify-around h-[60px] max-w-md mx-auto">
        {tabs.map((tab) => {
          const active_ = active === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-1 flex-1 py-1.5 relative">
              {active_ && (
                <motion.div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ background: DEEP_GREEN }} layoutId="nav-indicator" />
              )}
              <Icon className="w-5 h-5 transition-colors" style={{ color: active_ ? DEEP_GREEN : "#B0B0B0" }} />
              <span className="text-[10px] font-semibold transition-colors" style={{ color: active_ ? DEEP_GREEN : "#B0B0B0" }}>{tab.label}</span>
            </button>
          );
        })}
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
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: DEEP_GREEN_LIGHT }}>AI Skin Scanner</span>
      </motion.div>
      <motion.div variants={fadeChild} className="mb-10">
        <p className="text-[15px] font-medium leading-relaxed" style={{ color: TEXT_SECONDARY }}>지금 내 피부 상태,<br />AI가 <span className="font-bold" style={{ color: DEEP_GREEN }}>3초</span>만에 알려줄게요.</p>
      </motion.div>
      <motion.div variants={fadeChild}>
        <motion.button onClick={() => fileRef.current?.click()} className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white" style={{ background: `radial-gradient(circle at 35% 35%, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})`, boxShadow: `0 20px 60px rgba(45,95,79,0.35)` }} whileTap={{ scale: 0.95 }}>
          <ScanLine className="w-12 h-12" />
          <span className="text-[13px] font-bold leading-snug px-6">내 피부 상태<br />AI로 3초 스캔하기</span>
        </motion.button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleChange} />
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
        <h2 className="text-xl font-extrabold" style={{ color: DEEP_GREEN }}>피부 분석 기초 정보</h2>
        <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>정확한 분석을 위해 현재 상태를 선택해 주세요.</p>
      </motion.div>
      <div className="space-y-7 pb-10 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <label className="text-[12px] font-bold" style={{ color: DEEP_GREEN_LIGHT }}>성별</label>
          <div className="flex gap-2">
            {["여성", "남성"].map(item => (
              <button key={item} onClick={() => setGender(item)} className={`flex-1 py-3.5 rounded-xl text-[13px] font-bold border ${gender === item ? "bg-[#2D5F4F] text-white" : "bg-white text-[#8C8070] border-gray-100"}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[12px] font-bold" style={{ color: DEEP_GREEN_LIGHT }}>나이대</label>
          <div className="grid grid-cols-2 gap-2">
            {ageGroups.map(item => (
              <button key={item} onClick={() => setAge(item)} className={`py-3 rounded-xl text-[12px] font-bold border ${age === item ? "bg-[#2D5F4F] text-white" : "bg-white text-[#8C8070] border-gray-100"}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[12px] font-bold" style={{ color: DEEP_GREEN_LIGHT }}>피부 고민 (다중)</label>
          <div className="grid grid-cols-3 gap-2">
            {skinConcerns.map(item => (
              <button key={item} onClick={() => toggleConcern(item)} className={`py-3 rounded-xl text-[11px] font-bold border ${concerns.includes(item) ? "bg-[#3D7A66] text-white" : "bg-white text-[#8C8070] border-gray-100"}`}>{item}</button>
            ))}
          </div>
        </div>
      </div>
      <motion.div variants={fadeChild} className="mt-auto pt-6 flex gap-3 sticky bottom-4">
        <button onClick={onBack} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-500">이전</button>
        <button onClick={() => onSubmit({ gender, age, skinType: "복합성", concerns, condition: "맨얼굴" })} className="flex-[2.5] py-4 rounded-2xl font-bold text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>AI 분석 시작</button>
      </motion.div>
    </motion.div>
  );
}

function ScanningScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] bg-black text-white">
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center">
        <Camera className="w-16 h-16 opacity-20" />
        <motion.div className="absolute left-0 right-0 h-[2px] bg-emerald-400" animate={{ top: ["5%", "95%", "5%"] }} transition={{ duration: 2, repeat: Infinity }} />
      </div>
      <p className="mt-8 font-bold">AI 분석 중...</p>
    </div>
  );
}

function ResultScreen({ surveyData, analysisResult, imageSrc, onBack, user }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      // 히스토리 가져오기
      fetch("/api/scans")
        .then(res => res.json())
        .then(data => setHistory(data.slice(0, 5).reverse()));
      
      // 자동 저장 (최초 1회)
      if (!isSaved && analysisResult) {
        const overallScore = analysisResult.scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;
        fetch("/api/scans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overallScore,
            scores: analysisResult.scores,
            hotspots: analysisResult.hotspots,
            aiComment: analysisResult.aiComment,
            imageSrc
          })
        }).then(() => setIsSaved(true));
      }
    }
  }, [user]);

  const scores = analysisResult?.scores || [];
  const overallScore = scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;

  const chartData = history.map(item => ({
    date: new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    score: parseInt(item.overallScore)
  }));

  return (
    <motion.div className="px-5 pt-6 pb-24" variants={stagger} initial="initial" animate="animate">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="px-4 py-2 rounded-full border text-[12px] font-bold border-emerald-100 bg-white shadow-sm flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> 다시 촬영</button>
        <h2 className="text-xl font-extrabold text-emerald-900">피부 리포트</h2>
      </div>

      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-white">
        <img src={imageSrc} className="w-full h-full object-cover" />
        {analysisResult?.hotspots?.map((dot: any, i: number) => (
          <motion.div key={i} className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-red-500" style={{ left: `${dot.x}%`, top: `${dot.y}%` }} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} />
        ))}
      </div>

      <div className="rounded-3xl p-6 mb-6 bg-white shadow-sm border border-emerald-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-600 text-white text-3xl font-black">{overallScore}</div>
          <div><p className="text-sm font-bold text-emerald-900">{surveyData?.age} {surveyData?.gender}</p><p className="text-xs text-emerald-600">오늘의 점수</p></div>
        </div>
        
        <div className="space-y-4">
          {scores.map((item: any) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-bold"><span>{item.label}</span><span>{item.score}점</span></div>
              <div className="h-1.5 rounded-full bg-emerald-50 overflow-hidden"><motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1 }} /></div>
            </div>
          ))}
        </div>
        {analysisResult?.aiComment && <div className="mt-6 p-4 rounded-xl bg-emerald-50 text-[13px] leading-relaxed italic">" {analysisResult.aiComment} "</div>}
      </div>

      {/* 히스토리 그래프 영역 */}
      {user ? (
        <div className="rounded-3xl p-6 mb-6 bg-white shadow-sm border border-emerald-50">
          <div className="flex items-center gap-2 mb-6">
            <LineChartIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900">피부 변화 추이</h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...chartData, { date: '오늘', score: overallScore }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-8 mb-6 border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-center">
          <h3 className="font-bold text-emerald-900 mb-2">기록 저장하고 그래프로 보기</h3>
          <p className="text-xs text-gray-500 mb-6">3초 로그인으로 내 피부 히스토리를 관리하세요.</p>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = "/auth/google"} className="flex-1 py-3 rounded-xl bg-white border border-gray-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" /> 구글 로그인
            </button>
          </div>
        </div>
      )}

      <button className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-white mb-6 font-bold shadow-md" style={{ background: "linear-gradient(45deg, #f09433, #bc1888)" }}><Instagram className="w-5 h-5" /> 인스타 인증하기</button>
    </motion.div>
  );
}

function MagazineTab() {
  return (
    <motion.div className="px-5 pt-6 pb-24" variants={stagger} initial="initial" animate="animate">
      <h1 className="text-xl font-extrabold text-emerald-900 mb-6">뷰티 인사이트</h1>
      <div className="space-y-4">
        {articles.map((article) => {
          const Icon = article.icon;
          return (
            <div key={article.id} className="rounded-2xl overflow-hidden border bg-white shadow-sm p-4 flex gap-4">
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${article.gradient} flex items-center justify-center`}><Icon className="w-8 h-8 opacity-20" /></div>
              <div><h3 className="text-[14px] font-bold mb-1">{article.title}</h3><p className="text-[11px] text-gray-500 line-clamp-2">{article.summary}</p></div>
            </div>
          );
        })}
      </div>
    </motion.div>
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
    fetch("/api/user")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data))
      .catch(() => setUser(null));
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
    <div className="min-h-[100dvh] bg-emerald-50/20 text-black transition-colors">
      <div className="absolute top-4 right-4 z-[100] flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            {user.avatar && (
              <img src={user.avatar} className="w-6 h-6 rounded-full" />
            )}
            <span className="text-[11px] font-bold text-emerald-900">{user.username}님</span>
          </div>
        )}
        <ThemeToggle />
      </div>
      <div className="overflow-y-auto" style={{ minHeight: "calc(100dvh - 60px)" }}>
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {scanState === "idle" && <ScanIdleScreen onCapture={handleCapture} />}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen />}
              {scanState === "result" && <ResultScreen surveyData={surveyData} analysisResult={analysisResult} imageSrc={imageSrc} onBack={() => setScanState("idle")} user={user} />}
            </motion.div>
          )}
          {activeTab === "magazine" && <MagazineTab />}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
