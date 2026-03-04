import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  LayoutGrid,
  Activity,
  Target,
  Flame,
  Eye,
  Zap,
  Leaf,
  Star,
  Waves,
  X,
  Lock,
  Thermometer,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  scores: { label: string; score: number; comment?: string }[];
  hotspots: Hotspot[];
  aiComment: string;
  skinAge?: number;
  skinReport?: { area: string; finding: string }[];
  improvements: { title: string; desc: string }[];
  cosmetics: { type: string; key: string; reason: string }[];
}

const BAUMANN_DESC: Record<string, { name: string; desc: string; color: string }> = {
  O: { name: "지성", desc: "피지 분비가 활발해 번들거림이 나타나기 쉬워요.", color: "#F59E0B" },
  D: { name: "건성", desc: "피지 분비가 적어 건조함과 당김이 느껴질 수 있어요.", color: "#3B82F6" },
  S: { name: "민감성", desc: "외부 자극에 붉어지거나 트러블이 생기기 쉬워요.", color: "#EF4444" },
  R: { name: "저항성", desc: "외부 자극에 강하고 트러블이 잘 생기지 않아요.", color: "#10B981" },
  P: { name: "색소성", desc: "기미·잡티 등 색소침착이 생기기 쉬워요.", color: "#8B5CF6" },
  N: { name: "비색소성", desc: "색소침착이 적고 피부톤이 균일한 편이에요.", color: "#06B6D4" },
  W: { name: "주름성", desc: "탄력이 낮아 잔주름이 생기기 쉬운 상태예요.", color: "#6366F1" },
  T: { name: "탄력성", desc: "피부 탄력이 좋아 주름이 적은 상태예요.", color: "#14B8A6" },
};

const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const TEXT_SECONDARY = "#8C8070";
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";

// 인덱스 기반 아이콘/색상 (AI label 매칭 불필요, 순서 보장)
const SCORE_ICONS = [Sparkles, Droplets, Sun, LayoutGrid, Activity, Target, Flame, Eye, Star, Waves];
const SCORE_COLORS = [
  "#D4836B", // 종합 컨디션
  "#3B82C4", // 수분 밸런스
  "#E05A3A", // 붉은기 수준
  "#4A7C6E", // 모공 상태
  "#8C8070", // 주름 및 탄력
  "#A67C52", // 잡티/색소침착
  "#D97706", // 트러블 위험
  "#6366F1", // 다크서클
  "#F59E0B", // 피부 광채
  "#10B981", // 피부결 균일도
];

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

// ─── 얼굴 가이드 카메라 ──────────────────────────────────────────
function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [useFile, setUseFile] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) { setUseFile(true); return; }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setUseFile(true));

    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // 얼굴 영역: 가로 70%, 세로 85%, 세로 위쪽 편향 크롭
    const cropW = vw * 0.70;
    const cropH = Math.min(vh, cropW * 1.3);
    const cropX = (vw - cropW) / 2;
    const cropY = Math.max(0, (vh - cropH) * 0.25);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 전면 카메라 좌우 반전 보정
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onCapture(file); }
  };

  if (useFile) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6">
        <p className="text-white text-sm">카메라를 사용할 수 없습니다. 사진으로 선택해 주세요.</p>
        <Button onClick={() => fileRef.current?.click()} className="bg-white text-black font-bold px-8 h-14 rounded-2xl">
          사진 선택하기
        </Button>
        <Button variant="ghost" onClick={onClose} className="text-white/60">취소</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 카메라 뷰 */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* 얼굴 가이드 오버레이 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="faceCutout">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx="50%" cy="40%" rx="32%" ry="37%" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#faceCutout)" />
          {/* 가이드 타원 실선 */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
          {/* 가이드 타원 점선 (컬러) */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke={SCAN_FROM} strokeWidth="1.5" strokeDasharray="10 6" opacity="0.7" />
        </svg>

        {/* 안내 문구 */}
        <div className="absolute top-[8%] left-0 right-0 text-center pointer-events-none px-6">
          <p className="text-white text-sm font-semibold drop-shadow-lg">얼굴을 타원 안에 맞춰주세요</p>
          <p className="text-white/60 text-xs mt-1">정면을 바라보고 자연광에서 촬영하면 좋아요</p>
        </div>

        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 촬영 버튼 */}
      <div className="bg-black py-8 flex items-center justify-center">
        <motion.button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl disabled:opacity-30"
          whileTap={{ scale: 0.88 }}
        >
          <div className="w-15 h-15 w-[60px] h-[60px] rounded-full border-[3px] border-black/15" />
        </motion.button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── 하단 네비게이션 ──────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-stone-100">
      <div className="max-w-md mx-auto px-6">
        <Tabs value={active} onValueChange={(v) => onChange(v as TabId)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-[60px] bg-transparent">
            <TabsTrigger value="scan" className="data-[state=active]:text-[#C97062] data-[state=active]:bg-transparent flex flex-col gap-1">
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-semibold">AI 스캔</span>
            </TabsTrigger>
            <TabsTrigger value="magazine" className="data-[state=active]:text-[#C97062] data-[state=active]:bg-transparent flex flex-col gap-1">
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-semibold">매거진</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
}

// ─── 메인 스캔 화면 ───────────────────────────────────────────────
function ScanIdleScreen({ onScan }: { onScan: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ minHeight: "calc(100dvh - 60px)", background: "linear-gradient(180deg, #FDF6F3 0%, #FAF9F6 100%)" }}
      variants={stagger} initial="initial" animate="animate"
    >
      <motion.div variants={fadeChild} className="mb-4">
        <Badge variant="outline" className="px-3 py-1 font-bold tracking-widest uppercase text-[10px]"
          style={{ borderColor: SCAN_FROM, color: SCAN_TO }}>
          AI Skin Scanner
        </Badge>
      </motion.div>

      <motion.div variants={fadeChild} className="mb-12">
        <h1 className="text-2xl font-bold mb-2 tracking-tight text-stone-800">피부의 목소리를 들어보세요</h1>
        <p className="text-[15px] font-medium leading-relaxed text-stone-500">
          지금 내 피부 상태,<br />
          AI가 <span className="font-bold" style={{ color: SCAN_TO }}>3초</span>만에 알려줄게요.
        </p>
      </motion.div>

      {/* 애니메이션 스캔 버튼 */}
      <motion.div variants={fadeChild} className="relative flex items-center justify-center">
        {/* 바깥 파동 2 */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 220, height: 220, border: `2px solid ${SCAN_FROM}` }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />
        {/* 바깥 파동 1 */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 220, height: 220, border: `2px solid ${SCAN_FROM}` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
        {/* 메인 버튼 */}
        <motion.button
          onClick={onScan}
          className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white shadow-2xl"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${SCAN_FROM}, ${SCAN_TO})`,
            boxShadow: `0 24px 60px rgba(201,112,98,0.45), 0 8px 20px rgba(201,112,98,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          animate={{
            boxShadow: [
              `0 24px 60px rgba(201,112,98,0.40), 0 8px 20px rgba(201,112,98,0.2)`,
              `0 28px 72px rgba(201,112,98,0.55), 0 10px 28px rgba(201,112,98,0.3)`,
              `0 24px 60px rgba(201,112,98,0.40), 0 8px 20px rgba(201,112,98,0.2)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* 내부 글로우 링 */}
          <div className="absolute inset-0 rounded-full" style={{ border: "1.5px solid rgba(255,255,255,0.2)" }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <ScanLine className="w-12 h-12 drop-shadow" />
          </motion.div>
          <span className="text-[14px] font-bold leading-snug px-6">
            내 피부 상태<br />AI로 스캔하기
          </span>
        </motion.button>
      </motion.div>

      <motion.div variants={fadeChild} className="mt-10 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: SCAN_FROM }} />
        <span className="text-[11px] font-medium" style={{ color: TEXT_SECONDARY }}>
          카메라로 셀카를 찍으면 분석 준비가 시작돼요
        </span>
      </motion.div>
    </motion.div>
  );
}

// ─── 설문 화면 ────────────────────────────────────────────────────
function SurveyScreen({ onSubmit, onBack }: { onSubmit: (data: SurveyData) => void; onBack: () => void }) {
  const [gender, setGender] = useState("여성");
  const [age, setAge] = useState("20대 후반");
  const ageGroups = ["10대", "20대 초반", "20대 후반", "30대 초반", "30대 후반", "40대 초반", "40대 후반", "50대+"];
  const skinConcerns = ["모공/피지", "주름/탄력", "트러블/민감", "기미/잡티", "다크서클", "건조함"];
  const [concerns, setConcerns] = useState<string[]>([]);
  const toggleConcern = (c: string) => setConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  return (
    <motion.div className="flex flex-col h-[calc(100dvh-60px)]" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="px-6 pt-8 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold" style={{ color: DEEP_GREEN }}>피부 분석 기초 정보</h2>
        </div>
        <p className="text-[13px] text-muted-foreground ml-10">정확한 분석을 위해 현재 상태를 선택해 주세요.</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        <div className="space-y-8 pb-4">
          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>성별</label>
            <div className="flex gap-2">
              {["여성", "남성"].map(item => (
                <Button key={item} onClick={() => setGender(item)} variant={gender === item ? "default" : "outline"}
                  className={`flex-1 h-14 rounded-xl text-[14px] font-bold ${gender === item ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>나이대</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map(item => (
                <Button key={item} onClick={() => setAge(item)} variant={age === item ? "default" : "outline"}
                  className={`h-12 rounded-xl text-[13px] font-bold ${age === item ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>피부 고민 (다중)</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map(item => (
                <Button key={item} onClick={() => toggleConcern(item)} variant={concerns.includes(item) ? "secondary" : "outline"}
                  className={`h-12 rounded-xl text-[12px] font-bold ${concerns.includes(item) ? "bg-[#3D7A66] text-white hover:bg-[#3D7A66]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeChild} className="px-6 py-4 shrink-0 bg-white border-t border-stone-100">
        <Button onClick={() => onSubmit({ gender, age, skinType: "복합성", concerns, condition: "맨얼굴" })}
          className="w-full h-14 rounded-2xl font-bold text-white shadow-xl bg-[#2D5F4F] hover:bg-[#3D7A66] text-lg">
          AI 분석 시작
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── 분석 중 화면 ─────────────────────────────────────────────────
function ScanningScreen({ imageSrc }: { imageSrc: string | null }) {
  const [textIdx, setTextIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const texts = ["사진 데이터 최적화 중...", "AI 피부 고민 부위 탐색 중...", "수분 및 유분 정밀 분석 중...", "리포트 결과 요약 중..."];
  const progressTargets = [20, 45, 68, 88];

  useEffect(() => {
    const t = setTimeout(() => setProgress(12), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIdx(prev => {
        const next = (prev + 1) % texts.length;
        setProgress(progressTargets[next]);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-60px)] bg-[#FAF9F6] px-6">
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-stone-100 flex items-center justify-center shadow-inner">
        {imageSrc ? (
          <img src={imageSrc} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-16 h-16 opacity-10" />
        )}
        <motion.div
          className="absolute left-0 right-0 h-1 shadow-lg"
          style={{ background: `linear-gradient(90deg, transparent, ${SCAN_FROM}, ${SCAN_TO}, ${SCAN_FROM}, transparent)` }}
          animate={{ top: ["5%", "95%", "5%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SCAN_FROM }} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Scanning</span>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p key={textIdx} className="font-bold text-xl text-stone-800"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            {texts[textIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-stone-400 italic">전문적인 피부 분석 리포트를 생성하고 있습니다.</p>
      </div>
      {/* 진행 바 */}
      <div className="mt-8 w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
          <span>분석 진행 중</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${SCAN_FROM}, ${SCAN_TO})` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── 결과 화면 ────────────────────────────────────────────────────
function ResultScreen({ surveyData, analysisResult, imageSrc, imageBase64, onBack, onGoMagazine, user }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultScrollRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const analysisDrag = useDragControls();
  const improvementsDrag = useDragControls();
  const diaryDrag = useDragControls();
  const [showDiary, setShowDiary] = useState(false);

  const handleGoogleLogin = () => {
    sessionStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    window.location.href = "/auth/google";
  };
  const handleKakaoLogin = () => {
    sessionStorage.setItem("pendingResult", JSON.stringify({ analysisResult, surveyData, imageBase64 }));
    window.location.href = "/auth/kakao";
  };
  const [isSuccess, setIsSuccess] = useState(false);

  // 히스토리 로드 (로그인 시)
  useEffect(() => {
    if (!user) return;
    fetch("/api/scans").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setHistory(data);
    });
  }, [user]);

  // 스캔 저장 (로그인 + 분석결과 둘 다 준비됐을 때)
  useEffect(() => {
    if (!user || !analysisResult || isSaved) return;
    const overallScore = analysisResult.scores.find((s: any) => s.label === "종합 컨디션")?.score || 0;
    fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallScore,
        skinAge: analysisResult.skinAge ?? null,
        baumannType: finalType,
        scores: analysisResult.scores,
        hotspots: analysisResult.hotspots,
        aiComment: analysisResult.aiComment,
        improvements: analysisResult.improvements ?? [],
        cosmetics: analysisResult.cosmetics ?? [],
      })
    }).then(res => res.json()).then(data => {
      setIsSaved(true);
      if (data?.id) setCurrentScanId(data.id);
    });
  }, [user, analysisResult]);

  // 모달 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    const el = resultScrollRef.current;
    if (!el) return;
    el.style.overflow = (showAnalysis || showImprovements || showDiary) ? 'hidden' : 'auto';
  }, [showAnalysis, showImprovements, showDiary]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData, analysisResult }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { setShowWaitlist(false); setIsSuccess(false); setEmail(""); }, 2000);
      }
    } catch { alert("오류가 발생했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const scores = analysisResult?.scores || [];
  const overallScore = scores.find((s: any) => s.label === "종합 컨디션")?.score || scores[0]?.score || 0;

  const isOily  = (scores.find((s: any) => s.label === "모공 상태")?.score ?? 100) < 50;
  const isSens  = (scores.find((s: any) => s.label === "붉은기 수준")?.score ?? 0) > 50;
  const isPig   = (scores.find((s: any) => s.label === "잡티/색소침착")?.score ?? 0) > 50;
  const isWrink = (scores.find((s: any) => s.label === "주름 및 탄력")?.score ?? 100) < 60;
  const finalType = `${isOily ? "O" : "D"}${isSens ? "S" : "R"}${isPig ? "P" : "N"}${isWrink ? "W" : "T"}`;

  const handleShare = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const card = shareCardRef.current;
      if (!card) return;
      card.style.display = "block";
      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF9F6",
        logging: false,
      });
      card.style.display = "none";
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "fonday-skin-report.png", { type: "image/png" });
        const shareText = `오늘 내 피부 점수는 ${overallScore}점! 바우만 타입은 ${finalType}형이 나왔어요.\n#Fonday #AI피부분석 #FondayAI`;
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "Fonday AI 피부 분석 리포트", text: shareText });
        } else if (navigator.share) {
          await navigator.share({
            title: "Fonday AI 피부 분석 리포트",
            text: shareText,
            url: window.location.href,
          });
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "fonday-skin-report.png";
          a.click();
        }
      }, "image/png");
    } catch { /* 취소 */ }
  };


  return (
    <>
    {/* 공유용 카드 (화면 밖, html2canvas 캡처용) */}
    <div ref={shareCardRef} style={{ display: "none", position: "fixed", left: "-9999px", top: 0, width: "390px", background: "#FAF9F6", fontFamily: "system-ui, -apple-system, sans-serif", padding: "20px 20px 24px" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "20px", fontWeight: 900, color: DEEP_GREEN }}>FondayAI 피부 리포트</span>
        <span style={{ fontSize: "11px", color: TEXT_SECONDARY }}>{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</span>
      </div>

      {/* 요약 카드 */}
      <div style={{ background: "white", borderRadius: "24px", padding: "20px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* 종합점수 */}
          <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "30px", fontWeight: 900, color: "white", lineHeight: 1 }}>{overallScore}</span>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginTop: "3px" }}>종합점수</span>
          </div>
          {/* 피부나이 */}
          {analysisResult?.skinAge != null && analysisResult.skinAge > 0 && (
            <div style={{ width: "72px", height: "72px", borderRadius: "16px", background: "linear-gradient(135deg, #A78BFA, #7C3AED)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "30px", fontWeight: 900, color: "white", lineHeight: 1 }}>{analysisResult.skinAge}</span>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.85)", marginTop: "3px" }}>피부나이</span>
            </div>
          )}
          {/* 바우만 타입 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "11px", color: TEXT_SECONDARY, marginBottom: "4px" }}>{surveyData?.age} {surveyData?.gender}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", color: "#78716C" }}>바우만</span>
              <span style={{ fontSize: "22px", fontWeight: 900, color: SCAN_TO }}>{finalType}</span>
              <span style={{ fontSize: "13px", color: "#78716C" }}>형</span>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {finalType.split("").map((letter, i) => {
                const info = BAUMANN_DESC[letter];
                if (!info) return null;
                return (
                  <span key={i} style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: `${info.color}18`, color: info.color }}>{info.name}</span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI 피부 총평 */}
      {analysisResult?.aiComment && (
        <div style={{ background: "white", borderRadius: "24px", padding: "18px 20px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: "14px" }}>✦</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 900, color: DEEP_GREEN }}>FondayAI 의 피부 총평</span>
          </div>
          <p style={{ fontSize: "13px", color: "#57534E", lineHeight: 1.65, margin: 0 }}>{analysisResult.aiComment}</p>
        </div>
      )}

      {/* 10가지 항목별 점수 */}
      <div style={{ background: "white", borderRadius: "24px", padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: "13px", fontWeight: 900, color: DEEP_GREEN, marginBottom: "14px" }}>10가지 항목별 점수</p>
        {analysisResult?.scores.map((s: any, i: number) => {
          const Icon = SCORE_ICONS[i] || Zap;
          const color = SCORE_COLORS[i] || DEEP_GREEN;
          return (
            <div key={i} style={{ marginBottom: i < (analysisResult.scores.length - 1) ? "14px" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "999px", background: "#F5F4F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#44403C" }}>{s.label}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color }}>{s.score}점</span>
              </div>
              <div style={{ height: "6px", background: "#F5F4F2", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.score}%`, background: color, borderRadius: "999px" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      <div style={{ textAlign: "center", marginTop: "14px", fontSize: "10px", color: "#C0B8B0" }}>fondayai.pages.dev</div>
    </div>

    <div ref={resultScrollRef} className="h-[calc(100dvh-60px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-24 space-y-6" variants={stagger} initial="initial" animate="animate">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-full gap-1.5 hover:bg-rose-50"
            style={{ borderColor: SCAN_TO, color: SCAN_TO }}>
            <Camera className="w-4 h-4" /> 다시 촬영
          </Button>
          <h2 className="text-xl font-black tracking-tight" style={{ color: DEEP_GREEN }}>FondayAI 피부 리포트</h2>
        </div>

        {/* 이미지 + 핫스팟 */}
        <Card className="overflow-hidden border-none shadow-2xl rounded-3xl bg-zinc-900">
          <div className="relative w-full">
            <img src={imageSrc} className="w-full max-h-80 object-contain" />
            {analysisResult?.hotspots?.map((dot: any, i: number) => (
              <motion.div key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: "spring" }}
              >
                {/* 중심 점 */}
                <div className="w-2 h-2 rounded-full bg-red-500 border border-white/80 shadow-md" />
                {/* 미세 파동 */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-red-400"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.3 }}
                />
              </motion.div>
            ))}
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Detection Active</span>
            </div>
          </div>
        </Card>

        {/* 요약 카드 */}
        <Card className="border-none shadow-md rounded-3xl bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              {/* 종합점수 */}
              <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                <span className="text-3xl font-black leading-none">{overallScore}</span>
                <span className="text-[9px] font-bold opacity-80 mt-1">종합점수</span>
              </div>
              {/* 피부나이 */}
              {analysisResult?.skinAge != null && analysisResult.skinAge > 0 && (
                <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                  style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                  <span className="text-3xl font-black leading-none">{analysisResult.skinAge}</span>
                  <span className="text-[9px] font-bold opacity-80 mt-1">피부나이</span>
                </div>
              )}
              {/* 바우만 타입 */}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-stone-400 mb-1">{surveyData?.age} {surveyData?.gender}</p>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-[13px] text-stone-500">바우만</span>
                  <span className="text-xl font-black" style={{ color: SCAN_TO }}>{finalType}</span>
                  <span className="text-[13px] text-stone-500">형</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {finalType.split("").map((letter, i) => {
                    const info = BAUMANN_DESC[letter];
                    if (!info) return null;
                    return (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${info.color}18`, color: info.color }}>
                        {info.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI 피부 총평 */}
        {analysisResult?.aiComment && (
          <Card className="border-none shadow-md rounded-3xl bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>FondayAI 의 피부 총평</p>
              </div>
              <p className="text-[13px] text-stone-600 leading-relaxed">{analysisResult.aiComment}</p>
            </CardContent>
          </Card>
        )}

        {/* 10가지 점수 */}
        <Card className="border-none shadow-md rounded-3xl bg-white">
          <CardHeader className="pb-1 pt-5 px-5">
            <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>10가지 항목별 점수</p>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {scores.map((item: any, i: number) => {
              const Icon = SCORE_ICONS[i] || Zap;
              const color = SCORE_COLORS[i] || DEEP_GREEN;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-stone-50 shadow-sm">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-stone-700">{item.label}</span>
                    </div>
                    <motion.span style={{ color }} initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring" }}>
                      {item.score}점
                    </motion.span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-stone-100">
                    <motion.div className="h-full rounded-full" style={{ background: color }}
                      initial={{ width: "0%" }} animate={{ width: `${item.score}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.9 }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Fonday 잠금 섹션 */}
        <Card className="border-none shadow-md rounded-3xl overflow-hidden relative bg-white">
          <CardContent className="p-5">
            {/* 배경: 블러 처리된 가상 수치 */}
            <div className="grid grid-cols-2 gap-3 blur-sm opacity-40 pointer-events-none select-none">
              {[
                { label: "피부 온도", value: "36.2°C", icon: Thermometer, color: "#E09882" },
                { label: "수분도", value: "68%", icon: Droplets, color: "#3B82C4" },
                { label: "유분도", value: "42%", icon: Flame, color: "#F59E0B" },
                { label: "피부 장벽", value: "B+", icon: Shield, color: "#10B981" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-3 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3" style={{ color: item.color }} />
                      <p className="text-[10px] text-stone-400">{item.label}</p>
                    </div>
                    <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
          {/* 잠금 오버레이 */}
          <div className="absolute inset-0 backdrop-blur-[2px] bg-white/75 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center mb-3 shadow-inner">
              <Lock className="w-6 h-6 text-stone-500" />
            </div>
            <p className="text-[14px] font-black text-stone-700 mb-2">피부 속 진피층 수분 장벽 측정 불가</p>
            <p className="text-[12px] text-stone-500 leading-relaxed">
              스마트폰 카메라로는 피부 속을 볼 수 없습니다.<br />
              <span className="font-bold" style={{ color: SCAN_TO }}>Fonday 정밀 스캐너</span>로 진짜 피부 속 상태를 확인하세요.
            </p>
          </div>
        </Card>

        {/* 액션 버튼 2개 */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setShowAnalysis(true)}
            className="h-16 rounded-2xl flex-col gap-1.5 font-bold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[12px]">주요 분석결과</span>
          </Button>
          <Button onClick={() => setShowImprovements(true)}
            className="h-16 rounded-2xl flex-col gap-1.5 font-bold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
            <Leaf className="w-5 h-5" />
            <span className="text-[12px]">맞춤솔루션</span>
          </Button>
        </div>

        {/* 피부 일기 카드 버튼 / 로그인 카드 */}
        {user === undefined ? (
          <div className="h-16 rounded-3xl bg-stone-100 animate-pulse" />
        ) : user ? (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDiary(true)}
            className="cursor-pointer">
            <Card className="border-none shadow-md rounded-3xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                    <LineChartIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>피부 일기</p>
                    <p className="text-[11px] text-stone-400">
                      {history.length > 0 ? `${history.length + 1}번의 기록 · 오늘 ${overallScore}점` : "오늘 첫 번째 기록"}
                    </p>
                  </div>
                  {user.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full border border-stone-100 shrink-0" />}
                  <ArrowRight className="w-4 h-4 text-stone-300 shrink-0" />
                </div>
                {/* 미니 스파크라인 */}
                {history.length >= 1 && (
                  <div className="h-16 mt-3 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...history.slice().reverse().map((item: any) => ({
                        date: new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
                        score: parseInt(item.overallScore),
                      })), { date: "오늘", score: overallScore }]}>
                        <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2}
                          dot={{ r: 2.5, fill: SCAN_TO, strokeWidth: 0 }} activeDot={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "8px" }} />
                        <YAxis hide domain={[0, 100]} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="border-2 border-dashed rounded-3xl p-6 text-center" style={{ borderColor: "#F5D5CC", background: "#FDF8F7" }}>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-bold" style={{ color: DEEP_GREEN }}>변화 과정을 기록하세요</CardTitle>
              <CardDescription className="text-xs">로그인으로 내 피부 일기를 시작하세요.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <Button onClick={handleKakaoLogin}
                className="w-full h-12 rounded-xl font-bold gap-2 border-0 shadow-sm text-[#3C1E1E]"
                style={{ background: "#FEE500" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
                </svg>
                카카오로 계속하기
              </Button>
              <Button onClick={handleGoogleLogin}
                className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                Google로 계속하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 얼리버드 */}
        <Button onClick={() => setShowWaitlist(true)}
          className="w-full h-14 rounded-2xl text-white font-bold shadow-lg"
          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
          <span className="flex items-center gap-2">Fonday 얼리버드 알림 받기 <ArrowRight className="w-5 h-5" /></span>
        </Button>

        {/* 공유 */}
        <Button onClick={handleShare}
          className="w-full h-14 rounded-2xl text-white font-bold shadow-lg hover:opacity-90 transition-opacity bg-gradient-to-r from-[#f09433] via-[#bc1888] to-[#8a3ab9]">
          <Share2 className="w-5 h-5 mr-2" /> 결과 공유하기
        </Button>
      </motion.div>

      {/* 주요 분석결과 모달 */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAnalysis(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={analysisDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowAnalysis(false); }}>
              <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => analysisDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                      <LayoutGrid className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>주요 분석결과</h3>
                      <p className="text-[11px] text-stone-400">10가지 항목 상세 분석</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAnalysis(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-3">
                  {/* 10가지 항목별 분석 내용 */}
                  {scores.map((item: any, i: number) => {
                    const Icon = SCORE_ICONS[i] || Zap;
                    const color = SCORE_COLORS[i] || DEEP_GREEN;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-2xl border border-stone-100 bg-stone-50">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0">
                            <Icon className="w-3 h-3" style={{ color }} />
                          </div>
                          <span className="text-[12px] font-black" style={{ color }}>{item.label}</span>
                          <span className="ml-auto text-[12px] font-black" style={{ color }}>{item.score}점</span>
                        </div>
                        <p className="text-[13px] text-stone-600 leading-relaxed">{item.comment || "-"}</p>
                      </motion.div>
                    );
                  })}
                  {/* 피부 부위별 소견 */}
                  {(analysisResult?.skinReport ?? []).length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>피부 부위별 소견</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(analysisResult!.skinReport as { area: string; finding: string }[]).map((item, i) => (
                          <div key={i} className="p-3 rounded-2xl border border-stone-100 bg-stone-50">
                            <p className="text-[12px] font-black mb-1" style={{ color: DEEP_GREEN_LIGHT }}>{item.area}</p>
                            <p className="text-[11px] text-stone-500 leading-snug">{item.finding}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 바우만 타입 설명 */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4" style={{ color: DEEP_GREEN }} />
                      <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>
                        바우만 <span style={{ color: SCAN_TO }}>{finalType}</span>형 상세
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {finalType.split("").map((letter, i) => {
                        const info = BAUMANN_DESC[letter];
                        if (!info) return null;
                        return (
                          <div key={i} className="p-3 rounded-2xl border"
                            style={{ background: `${info.color}10`, borderColor: `${info.color}30` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[17px] font-black" style={{ color: info.color }}>{letter}</span>
                              <span className="text-[12px] font-bold text-stone-700">{info.name}</span>
                            </div>
                            <p className="text-[11px] text-stone-500 leading-snug">{info.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 맞춤솔루션 모달 */}
      <AnimatePresence>
        {showImprovements && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowImprovements(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[90dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={improvementsDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowImprovements(false); }}>
              <div className="p-6 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => improvementsDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                      <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>맞춤솔루션</h3>
                      <p className="text-[11px] text-stone-400">AI가 분석 결과를 바탕으로 제안합니다</p>
                    </div>
                  </div>
                  <button onClick={() => setShowImprovements(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-stone-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-3">
                  {/* 3단계 개선 방안 */}
                  {(analysisResult?.improvements ?? []).slice(0, 3).map((item: { title: string; desc: string }, i: number) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 p-4 rounded-2xl border"
                      style={{ background: i === 0 ? "#FDF1EE" : i === 1 ? "#F0F7F5" : "#F5F0FF", borderColor: i === 0 ? "#F5D5CC" : i === 1 ? "#C5DFD8" : "#DDD5F5" }}>
                      <div className="shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black"
                          style={{ background: i === 0 ? `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` : i === 1 ? `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` : "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                          {i + 1}
                        </div>
                        <p className="text-[9px] font-bold text-center mt-0.5"
                          style={{ color: i === 0 ? SCAN_TO : i === 1 ? DEEP_GREEN : "#7C3AED" }}>
                          STEP
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-stone-800 mb-0.5">{item.title}</p>
                        <p className="text-[12px] text-stone-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                  {(analysisResult?.improvements ?? []).length === 0 && (
                    <p className="text-center text-sm text-stone-400 py-6">개선 방안을 불러오는 중...</p>
                  )}

                  {/* 추천 화장품 */}
                  {(analysisResult?.cosmetics ?? []).length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-2 pb-1">
                        <Sparkles className="w-4 h-4" style={{ color: SCAN_TO }} />
                        <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>추천 화장품</p>
                      </div>
                      {(analysisResult.cosmetics as { type: string; key: string; reason: string }[]).map((item, i) => (
                        <motion.div key={`c-${i}`}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.07 }}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, #F59E0B, #D97706)` }}>
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[13px] font-black text-stone-800">{item.type}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                                style={{ background: "#D97706" }}>{item.key}</span>
                            </div>
                            <p className="text-[12px] text-stone-500 leading-relaxed">{item.reason}</p>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 피부 일기 모달 */}
      <AnimatePresence>
        {showDiary && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowDiary(false)} />
            <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl max-h-[92dvh] flex flex-col"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y" dragControls={diaryDrag} dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setShowDiary(false); }}>
              {/* 핸들 + 헤더 */}
              <div className="p-6 pb-3 shrink-0 touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => diaryDrag.start(e)}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}>
                      <LineChartIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base" style={{ color: DEEP_GREEN }}>피부 일기</h3>
                      <p className="text-[11px] text-stone-400">{history.length + 1}번의 기록</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.avatar && <img src={user.avatar} className="w-7 h-7 rounded-full border border-stone-100" />}
                    <button
                      onClick={() => fetch("/api/logout", { method: "POST" }).then(() => window.location.reload())}
                      className="text-[10px] text-stone-400 underline px-1">로그아웃</button>
                    <button onClick={() => setShowDiary(false)} className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-stone-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-6 pb-8 space-y-4">
                  {/* 점수 변화 그래프 */}
                  {history.length >= 1 && (
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 mb-2">종합점수 변화 추이</p>
                      <div className="h-44 rounded-2xl bg-stone-50 px-2 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...history.slice().reverse().map((item: any) => ({
                            date: new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
                            score: parseInt(item.overallScore),
                          })), { date: "오늘", score: overallScore }]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "9px" }} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                              formatter={(v: any) => [`${v}점`, "종합점수"]}
                            />
                            <Line type="monotone" dataKey="score" stroke={SCAN_TO} strokeWidth={2.5}
                              dot={{ r: 4, fill: SCAN_TO, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* 일기 목록 */}
                  <div className="space-y-3">
                    {/* 오늘 기록 */}
                    <div className="p-4 rounded-2xl border-2 bg-stone-50"
                      style={{ borderColor: `${SCAN_FROM}60` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>오늘</span>
                          <span className="text-[11px] text-stone-400">
                            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-black" style={{ color: SCAN_TO }}>{overallScore}점</span>
                          {analysisResult?.skinAge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#A78BFA20", color: "#7C3AED" }}>
                              피부나이 {analysisResult.skinAge}세
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-2"
                        style={{ background: `${SCAN_FROM}20`, color: SCAN_TO }}>바우만 {finalType}형</span>
                      <p className="text-[12px] text-stone-600 leading-relaxed">{analysisResult?.aiComment}</p>
                    </div>

                    {/* 과거 기록 */}
                    {history.map((item: any, i: number) => {
                      if (item.id === currentScanId) return null;
                      const date = new Date(item.createdAt);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dateLabel = isToday
                        ? `오늘 ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
                        : date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
                      return (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="p-4 rounded-2xl border border-stone-100 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-stone-400">{dateLabel}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-black" style={{ color: DEEP_GREEN }}>{item.overallScore}점</span>
                              {item.skinAge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                  style={{ background: "#A78BFA20", color: "#7C3AED" }}>
                                  피부나이 {item.skinAge}세
                                </span>
                              )}
                            </div>
                          </div>
                          {item.baumannType && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-2"
                              style={{ background: `${DEEP_GREEN}15`, color: DEEP_GREEN }}>
                              바우만 {item.baumannType}형
                            </span>
                          )}
                          {item.aiComment && (
                            <p className="text-[12px] text-stone-600 leading-relaxed">{item.aiComment}</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 얼리버드 모달 */}
      <AnimatePresence>
        {showWaitlist && (
          <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowWaitlist(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-xl"
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                <Heart className="w-7 h-7 text-white" />
              </div>
              {isSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>등록이 완료되었습니다!</h3>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-2" style={{ color: DEEP_GREEN }}>얼리버드 등록</h3>
                  <p className="text-center text-sm leading-relaxed mb-6 text-muted-foreground">특별한 혜택을 드립니다!</p>
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <input type="email" required placeholder="이메일을 입력해 주세요" value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-200" />
                    <Button disabled={isSubmitting} type="submit"
                      className="w-full h-14 rounded-2xl font-bold text-[15px] text-white"
                      style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
                      {isSubmitting ? "등록 중..." : "등록할게요!"}
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

// ─── 매거진 탭 ────────────────────────────────────────────────────
function MagazineTab() {
  return (
    <ScrollArea className="h-[calc(100dvh-60px)]">
      <motion.div className="px-5 pt-6 pb-24 space-y-6" variants={stagger} initial="initial" animate="animate">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: DEEP_GREEN }}>뷰티 인사이트</h1>
        <div className="space-y-4">
          {articles.map(article => {
            const Icon = article.icon;
            return (
              <Card key={article.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl flex gap-4 p-4 items-center">
                <div className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br ${article.gradient} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-8 h-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[9px] font-bold bg-rose-50 rounded-md px-1.5 py-0" style={{ color: SCAN_TO }}>
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

// ─── 루트 페이지 ──────────────────────────────────────────────────
export default function SkinScanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [showCamera, setShowCamera] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [user, setUser] = useState<any>(undefined); // undefined=로딩중, null=미로그인

  useEffect(() => {
    fetch("/api/user")
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data ?? null))
      .catch(() => setUser(null));
  }, []);

  // OAuth 로그인 후 결과 화면 복원
  useEffect(() => {
    if (user === undefined || !user) return;
    const saved = sessionStorage.getItem("pendingResult");
    if (!saved) return;
    try {
      const { analysisResult: ar, surveyData: sd, imageBase64: imgB64 } = JSON.parse(saved);
      setAnalysisResult(ar);
      setSurveyData(sd);
      if (imgB64) setImageSrc(imgB64);
      setScanState("result");
    } catch { /* ignore */ }
    sessionStorage.removeItem("pendingResult");
  }, [user]);

  const handleCapture = useCallback((file: File) => {
    setImageFile(file);
    setImageSrc(URL.createObjectURL(file));
    setShowCamera(false);
    setScanState("survey");
  }, []);

  const handleSurveySubmit = useCallback(async (data: SurveyData) => {
    setSurveyData(data);
    setScanState("scanning");
    if (!imageFile) return;
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async () => {
      setImageBase64(reader.result as string);
      try {
        const response = await fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result, surveyData: data }),
        });
        const rawText = await response.text();
        console.log("[API 응답]", response.status, rawText.slice(0, 300));
        if (!response.ok) {
          let msg = `HTTP ${response.status}`;
          try {
            const errJson = JSON.parse(rawText);
            msg = errJson.detail || errJson.message || errJson.error || JSON.stringify(errJson);
          } catch { msg += ": " + rawText.slice(0, 100); }
          alert(`분석 실패: ${msg}`);
          setScanState("idle");
          return;
        }
        const result = JSON.parse(rawText);
        setAnalysisResult(result);
        setScanState("result");
      } catch (err: any) {
        alert(`분석 실패: ${err.message || "네트워크 오류"}`);
        setScanState("idle");
      }
    };
  }, [imageFile]);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-stone-900">
      <div className="max-w-md mx-auto relative min-h-[100dvh]">

        {/* 얼굴 가이드 카메라 */}
        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {scanState === "idle" && <ScanIdleScreen onScan={() => setShowCamera(true)} />}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={() => setScanState("idle")} />}
              {scanState === "scanning" && <ScanningScreen imageSrc={imageSrc} />}
              {scanState === "result" && (
                <ResultScreen
                  surveyData={surveyData}
                  analysisResult={analysisResult}
                  imageSrc={imageSrc}
                  imageBase64={imageBase64}
                  onBack={() => setScanState("idle")}
                  onGoMagazine={() => setActiveTab("magazine")}
                  user={user}
                />
              )}
            </motion.div>
          )}
          {activeTab === "magazine" && <MagazineTab />}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
