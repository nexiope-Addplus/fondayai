import { useState, useRef, useCallback } from "react";
import {
  Camera,
  BookOpen,
  Sun,
  Shield,
  AlertCircle,
  ScanLine,
  Instagram,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const tabs: { id: TabId; label: string; icon: typeof Camera }[] = [
    { id: "scan", label: "AI 스캔", icon: Camera },
    { id: "magazine", label: "뷰티 매거진", icon: BookOpen },
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
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full" style={{ background: DEEP_GREEN }} />
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
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "calc(100dvh - 60px)" }}>
      <div className="mb-4">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: DEEP_GREEN_LIGHT }}>AI Skin Scanner</span>
      </div>
      <div className="mb-10">
        <p className="text-[15px] font-medium leading-relaxed" style={{ color: TEXT_SECONDARY }}>지금 내 피부 상태,<br />AI가 <span className="font-bold" style={{ color: DEEP_GREEN }}>3초</span>만에 알려줄게요.</p>
      </div>
      <div>
        <button onClick={() => fileRef.current?.click()} className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white transition-transform active:scale-95" style={{ background: `radial-gradient(circle at 35% 35%, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})`, boxShadow: `0 20px 60px rgba(45,95,79,0.35)` }}>
          <ScanLine className="w-12 h-12" />
          <span className="text-[13px] font-bold leading-snug px-6">내 피부 상태<br />AI로 3초 스캔하기</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleChange} />
      </div>
    </div>
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
    <div className="px-6 py-8 flex flex-col gap-8 min-h-[calc(100dvh-60px)]">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: DEEP_GREEN }}>피부 분석 기초 정보</h2>
        <p className="text-[13px]" style={{ color: TEXT_SECONDARY }}>정확한 분석을 위해 현재 상태를 선택해 주세요.</p>
      </div>
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
      <div className="mt-auto pt-6 flex gap-3 sticky bottom-4">
        <button onClick={onBack} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-500">이전</button>
        <button onClick={() => onSubmit({ gender, age, skinType: "복합성", concerns, condition: "맨얼굴" })} className="flex-[2.5] py-4 rounded-2xl font-bold text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>AI 분석 시작</button>
      </div>
    </div>
  );
}

function ScanningScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] bg-black text-white">
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center">
        <Camera className="w-16 h-16 opacity-20" />
        <div className="absolute left-0 right-0 h-[2px] bg-emerald-400 animate-pulse" style={{ top: "50%" }} />
      </div>
      <p className="mt-8 font-bold">AI 분석 중...</p>
    </div>
  );
}

function ResultScreen({ surveyData, analysisResult, imageSrc, onBack }: any) {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData }),
      });
      setIsSuccess(true);
      setTimeout(() => setShowWaitlist(false), 2000);
    } catch (err) { alert("신청 실패"); } finally { setIsSubmitting(false); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Fonday AI 리포트', text: '오늘 내 피부 분석 결과!', url: window.location.href });
    }
  };

  const scores = analysisResult?.scores || [];
  const overallScore = scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;

  return (
    <div className="px-5 pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="px-4 py-2 rounded-full border text-[12px] font-bold border-emerald-100 bg-white shadow-sm flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> 다시 촬영</button>
        <h2 className="text-xl font-extrabold text-emerald-900">피부 리포트</h2>
      </div>

      <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden mb-6 shadow-2xl border-4 border-white">
        <img src={imageSrc} className="w-full h-full object-cover" />
        {analysisResult?.hotspots?.map((dot: any, i: number) => (
          <div key={i} className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-red-500" style={{ left: `${dot.x}%`, top: `${dot.y}%` }} />
        ))}
      </div>

      <div className="rounded-3xl p-6 mb-6 bg-white shadow-sm border border-emerald-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-600 text-white text-3xl font-black">{overallScore}</div>
          <div><p className="text-sm font-bold text-emerald-900">{surveyData?.age} {surveyData?.gender}</p><p className="text-xs text-emerald-600">오늘의 스캔 결과</p></div>
        </div>
        <button onClick={handleShare} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-white mb-6 font-bold shadow-md" style={{ background: "linear-gradient(45deg, #f09433, #bc1888)" }}><Instagram className="w-5 h-5" /> 인스타 인증하기</button>
        <div className="space-y-4">
          {scores.map((item: any) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-bold"><span>{item.label}</span><span>{item.score}점</span></div>
              <div className="h-1.5 rounded-full bg-emerald-50 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${item.score}%` }} /></div>
            </div>
          ))}
        </div>
        {analysisResult?.aiComment && <div className="mt-6 p-4 rounded-xl bg-emerald-50 text-[13px] leading-relaxed italic">" {analysisResult.aiComment} "</div>}
      </div>

      <button onClick={() => setShowWaitlist(true)} className="w-full py-4 rounded-2xl text-[15px] font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, #D4836B, #C06A55)` }}>얼리버드 알림 받기</button>

      {showWaitlist && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setShowWaitlist(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative bg-white rounded-t-3xl p-8 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
            <h3 className="text-center font-extrabold text-lg mb-6">얼리버드 등록</h3>
            {isSuccess ? <div className="py-10 text-center font-bold text-emerald-600">등록 완료!</div> : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <input type="email" required placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-gray-200" />
                <button disabled={isSubmitting} type="submit" className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600">{isSubmitting ? "등록 중..." : "등록하기"}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MagazineTab() {
  return (
    <div className="px-5 pt-6 pb-24">
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
    </div>
  );
}

export default function SkinScanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

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
        setAnalysisResult(result); setScanState("result");
      } catch (err) { alert("분석 실패"); setScanState("idle"); }
    };
  }, [imageFile]);

  return (
    <div className="min-h-screen bg-emerald-50/20 text-black pb-20">
      <div className="absolute top-4 right-4 z-[100]"><ThemeToggle /></div>
      
      <div className="w-full max-w-md mx-auto min-h-screen pt-4">
        {activeTab === "scan" && (
          <div key="scan">
            {scanState === "idle" && <ScanIdleScreen onCapture={handleCapture} />}
            {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
            {scanState === "scanning" && <ScanningScreen />}
            {scanState === "result" && <ResultScreen surveyData={surveyData} analysisResult={analysisResult} imageSrc={imageSrc} onBack={() => setScanState("idle")} />}
          </div>
        )}
        {activeTab === "magazine" && <MagazineTab />}
      </div>
      
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
