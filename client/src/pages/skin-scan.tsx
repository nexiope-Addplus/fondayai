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
  Share2,
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

const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const BEIGE = "#F5F0EB";
const BEIGE_DARK = "#E8E0D8";
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
  const tabs: { id: TabId; label: string; icon: typeof Camera }[] = [
    { id: "scan", label: "AI 스캔", icon: Camera },
    { id: "magazine", label: "뷰티 매거진", icon: BookOpen },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border transition-colors"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-[60px] max-w-md mx-auto">
        {tabs.map((tab) => {
          const active_ = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-1.5 relative"
              data-testid={`tab-${tab.id}`}
            >
              {active_ && (
                <motion.div
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                  style={{ background: DEEP_GREEN }}
                  layoutId="nav-indicator"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: active_ ? DEEP_GREEN : "#B0B0B0" }}
              />
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: active_ ? DEEP_GREEN : "#B0B0B0" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

function ScanIdleScreen({ onCapture }: { onCapture: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture();
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center px-6 text-center"
      style={{ minHeight: "calc(100dvh - 60px)" }}
      variants={stagger}
      initial="initial"
      animate="animate"
      data-testid="scan-idle"
    >
      <motion.div variants={fadeChild} className="mb-4">
        <span
          className="text-[10px] font-bold tracking-[0.18em] uppercase"
          style={{ color: DEEP_GREEN_LIGHT }}
        >
          AI Skin Scanner
        </span>
      </motion.div>

      <motion.div variants={fadeChild} className="mb-10">
        <p className="text-[15px] font-medium leading-relaxed" style={{ color: TEXT_SECONDARY }}>
          지금 내 피부 상태,<br />AI가 <span className="font-bold" style={{ color: DEEP_GREEN }}>3초</span>만에 알려줄게요.
        </p>
      </motion.div>

      <motion.div variants={fadeChild}>
        <motion.button
          onClick={() => fileRef.current?.click()}
          className="relative w-52 h-52 rounded-full flex flex-col items-center justify-center gap-3 text-white"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})`,
            boxShadow: `0 20px 60px rgba(45,95,79,0.35), 0 8px 20px rgba(45,95,79,0.2), inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              `0 20px 60px rgba(45,95,79,0.35), 0 8px 20px rgba(45,95,79,0.2)`,
              `0 24px 70px rgba(45,95,79,0.45), 0 10px 24px rgba(45,95,79,0.25)`,
              `0 20px 60px rgba(45,95,79,0.35), 0 8px 20px rgba(45,95,79,0.2)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          data-testid="button-scan"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ScanLine className="w-12 h-12 opacity-90" />
          </motion.div>
          <span className="text-[13px] font-bold leading-snug px-6">
            내 피부 상태<br />AI로 3초 스캔하기
          </span>

          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: "2px solid rgba(255,255,255,0.15)" }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: "1.5px solid rgba(255,255,255,0.1)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
        </motion.button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleChange}
          data-testid="input-camera"
        />
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
  const [skinType, setSkinType] = useState("복합성");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [condition, setCondition] = useState("맨얼굴");

  const toggleConcern = (concern: string) => {
    setConcerns(prev => 
      prev.includes(concern) ? prev.filter(c => c !== concern) : [...prev, concern]
    );
  };

  const ageGroups = ["10대", "20대 초반", "20대 후반", "30대 초반", "30대 후반", "40대 초반", "40대 후반", "50대+"];
  const skinConcerns = ["모공/피지", "주름/탄력", "트러블/민감", "기미/잡티", "다크서클", "건조함"];

  return (
    <motion.div
      className="px-6 py-8 flex flex-col gap-8 min-h-[calc(100dvh-60px)]"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeChild}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 rounded-full" style={{ background: DEEP_GREEN }} />
          <h2 className="text-xl font-extrabold" style={{ color: DEEP_GREEN }}>피부 분석 기초 정보</h2>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>정확한 분석을 위해 현재 상태를 선택해 주세요.</p>
      </motion.div>

      <div className="space-y-7 pb-10">
        <motion.div variants={fadeChild} className="space-y-3">
          <label className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: DEEP_GREEN_LIGHT }}>
            <span className="w-1 h-1 rounded-full bg-current" /> 성별
          </label>
          <div className="flex gap-2">
            {["여성", "남성"].map((item) => (
              <button
                key={item}
                onClick={() => setGender(item)}
                className={`flex-1 py-3.5 rounded-xl text-[13px] font-bold border transition-all ${
                  gender === item ? "bg-[#2D5F4F] text-white border-[#2D5F4F] shadow-md" : "bg-white text-[#8C8070] border-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeChild} className="space-y-3">
          <label className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: DEEP_GREEN_LIGHT }}>
            <span className="w-1 h-1 rounded-full bg-current" /> 나이대
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ageGroups.map((item) => (
              <button
                key={item}
                onClick={() => setAge(item)}
                className={`py-3 rounded-xl text-[12px] font-bold border transition-all ${
                  age === item ? "bg-[#2D5F4F] text-white border-[#2D5F4F] shadow-sm" : "bg-white text-[#8C8070] border-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeChild} className="space-y-3">
          <label className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: DEEP_GREEN_LIGHT }}>
            <span className="w-1 h-1 rounded-full bg-current" /> 촬영 당시 상태
          </label>
          <div className="flex gap-2">
            {["맨얼굴", "기초 케어", "풀 메이크업"].map((item) => (
              <button
                key={item}
                onClick={() => setCondition(item)}
                className={`flex-1 py-3.5 rounded-xl text-[12px] font-bold border transition-all ${
                  condition === item ? "bg-[#2D5F4F] text-white border-[#2D5F4F] shadow-sm" : "bg-white text-[#8C8070] border-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeChild} className="space-y-3">
          <label className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: DEEP_GREEN_LIGHT }}>
            <span className="w-1 h-1 rounded-full bg-current" /> 현재 가장 큰 피부 고민 (다중 선택)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {skinConcerns.map((item) => (
              <button
                key={item}
                onClick={() => toggleConcern(item)}
                className={`py-3 rounded-xl text-[11px] font-bold border transition-all ${
                  concerns.includes(item) ? "bg-[#3D7A66] text-white border-[#3D7A66] shadow-sm" : "bg-white text-[#8C8070] border-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeChild} className="mt-auto pt-6 flex gap-3 sticky bottom-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl text-[14px] font-bold bg-gray-100 text-gray-500"
        >
          이전으로
        </button>
        <button
          onClick={() => onSubmit({ gender, age, skinType, concerns, condition })}
          className="flex-[2.5] py-4 rounded-2xl text-[14px] font-bold text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${DEEP_GREEN_LIGHT}, ${DEEP_GREEN})` }}
        >
          AI 정밀 분석 시작하기
        </button>
      </motion.div>
    </motion.div>
  );
}

function ScanningScreen({ onComplete }: { onComplete: () => void }) {
  const [textIdx, setTextIdx] = useState(0);
  const texts = ["데이터 보정 중...", "모공 및 질감 분석 중...", "수분 밸런스 측정 중...", "피부 톤 분석 중..."];

  useEffect(() => {
    const t1 = setTimeout(() => setTextIdx(1), 800);
    const t2 = setTimeout(() => setTextIdx(2), 1600);
    const t3 = setTimeout(() => setTextIdx(3), 2400);
    const t4 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100dvh - 60px)", background: "#0a0a0a" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-testid="scan-scanning"
    >
      <div className="relative w-64 h-80 rounded-3xl overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
        <Camera className="w-16 h-16 text-gray-700" />

        <motion.div
          className="absolute left-0 right-0 h-[2px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${DEEP_GREEN_LIGHT}, rgba(61,122,102,0.8), ${DEEP_GREEN_LIGHT}, transparent)`,
            boxShadow: `0 0 20px 6px rgba(61,122,102,0.4), 0 0 60px 15px rgba(61,122,102,0.15)`,
          }}
          animate={{ top: ["5%", "95%", "5%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: DEEP_GREEN_LIGHT + "80" }} />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: DEEP_GREEN_LIGHT + "80" }} />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: DEEP_GREEN_LIGHT + "80" }} />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: DEEP_GREEN_LIGHT + "80" }} />
      </div>

      <div className="mt-8 text-center px-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={textIdx}
            className="text-[15px] font-bold text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            data-testid="text-scanning-status"
          >
            {texts[textIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-gray-500 mt-2">입력하신 정보와 사진을 결합하여 정밀 분석 중입니다</p>
      </div>
    </motion.div>
  );
}

function ResultScreen({ surveyData, onGoMagazine, onBack }: { surveyData: SurveyData | null; onGoMagazine: () => void; onBack: () => void }) {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("https://formspree.io/f/xgolbgye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, surveyData }),
      });
      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setShowWaitlist(false);
          setIsSuccess(false);
          setEmail("");
        }, 2000);
      }
    } catch (err) {
      console.error("신청 실패:", err);
      alert("오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (기존 scores, baumannType, handleShare 로직 유지)
  const scores = [
    { label: "종합 컨디션", score: 68, color: "#D4836B", icon: Sparkles },
    { label: "수분 밸런스", score: surveyData?.concerns.includes("건조함") ? 35 : 58, color: "#3B82C4", icon: Droplets },
    { label: "붉은기 수준", score: surveyData?.concerns.includes("트러블/민감") ? 78 : 42, color: "#E05A3A", icon: Sun },
    { label: "모공 상태", score: surveyData?.concerns.includes("모공/피지") ? 45 : 65, color: "#4A7C6E", icon: Grid },
    { label: "주름 및 탄력", score: surveyData?.age.includes("40") || surveyData?.age.includes("50") || surveyData?.concerns.includes("주름/탄력") ? 52 : 78, color: "#8C8070", icon: Activity },
    { label: "잡티/색소침착", score: surveyData?.concerns.includes("기미/잡티") ? 48 : 72, color: "#A67C52", icon: Target },
    { label: "트러블 위험", score: surveyData?.age.includes("10") || surveyData?.concerns.includes("트러블/민감") ? 72 : 28, color: "#D97706", icon: Flame },
    { label: "다크서클", score: surveyData?.concerns.includes("다크서클") ? 42 : 68, color: "#6366F1", icon: Eye },
  ];

  const baumannType = (surveyData?.skinType === "지성" || surveyData?.concerns.includes("모공/피지")) ? "O" : "D";
  const baumannSens = surveyData?.concerns.includes("트러블/민감") ? "S" : "R";
  const baumannPig = scores[5].score < 60 ? "P" : "N";
  const baumannWrink = scores[4].score < 60 ? "W" : "T";
  const finalType = `${baumannType}${baumannSens}${baumannPig}${baumannWrink}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fonday AI 피부 분석 리포트',
          text: `오늘 내 피부 점수는 ${scores[0].score}점! 바우만 타입은 ${finalType}형이 나왔어요. #Fonday #피부분석 #AI스킨케어`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('공유 실패:', err);
      }
    } else {
      alert('공유하기를 지원하지 않는 브라우저입니다. 리포트를 캡처해서 공유해 주세요!');
    }
  };

  return (
    <motion.div
      className="px-5 pt-6 pb-24"
      variants={stagger}
      initial="initial"
      animate="animate"
      data-testid="scan-result"
    >
      <motion.div variants={fadeChild} className="mb-5 flex items-start justify-between">
        <motion.button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background/50 backdrop-blur-sm shadow-sm"
          style={{ borderColor: DEEP_GREEN + "20" }}
          whileTap={{ scale: 0.95 }}
          data-testid="button-back-to-scan"
        >
          <Camera className="w-4 h-4" style={{ color: DEEP_GREEN }} />
          <span className="text-[11px] font-bold" style={{ color: DEEP_GREEN }}>다시 촬영</span>
        </motion.button>
        <div className="text-right">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: DEEP_GREEN_LIGHT }}>
            Analysis Complete
          </span>
          <h2 className="text-xl font-extrabold mt-1" style={{ color: DEEP_GREEN }}>
            오늘의 피부 리포트
          </h2>
        </div>
      </motion.div>

      <motion.div
        variants={fadeChild}
        className="rounded-3xl p-6 mb-5 shadow-sm"
        style={{ background: `linear-gradient(180deg, ${BEIGE}, #FFFFFF)`, border: "1px solid rgba(0,0,0,0.03)" }}
        data-testid="result-summary"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
          >
            <span className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>68</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2D5F4F] border border-[#2D5F4F10]">
                {surveyData?.age} {surveyData?.gender}
              </span>
            </div>
            <p className="text-lg font-extrabold" style={{ color: DEEP_GREEN }}>
              바우만 <span style={{ color: "#D4836B" }}>{finalType}</span>형
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 text-white mb-6 shadow-md"
          style={{
            background: `linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)`,
          }}
          whileTap={{ scale: 0.97 }}
        >
          <Instagram className="w-5 h-5" />
          <span className="text-[14px] font-bold">인스타에 결과 인증하기</span>
        </motion.button>

        <div className="space-y-4">
          {scores.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-50">
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                    <span className="text-[13px] font-bold text-gray-700">{item.label}</span>
                  </div>
                  <motion.span
                    className="text-sm font-extrabold tabular-nums"
                    style={{ color: item.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  >
                    {item.score}점
                  </motion.span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={fadeChild}>
        <motion.button
          onClick={onGoMagazine}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 mb-8 border bg-white shadow-sm"
          style={{ borderColor: DEEP_GREEN + "15", color: DEEP_GREEN }}
          whileTap={{ scale: 0.98 }}
        >
          <Leaf className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold">맞춤 응급처치 가이드 보러 가기</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <motion.div variants={fadeChild}>
        <div className="rounded-2xl p-5 mb-8 border border-dashed flex flex-col items-center text-center bg-gray-50/50" 
             style={{ borderColor: DEEP_GREEN + "20" }}>
          <h3 className="font-bold text-[14px] mb-1" style={{ color: DEEP_GREEN }}>기록 저장하고 그래프로 보기</h3>
          <p className="text-[11px] mb-4 text-gray-500">3초 로그인을 통해 내 피부 히스토리를 관리하세요.</p>
          
          <div className="flex gap-2 w-full">
            <button 
              className="flex-1 py-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 bg-white border border-gray-200"
              onClick={() => window.location.href = "/auth/google"}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3.5 h-3.5" alt="Google" />
              구글
            </button>
            <button 
              className="flex-1 py-3 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 bg-[#FEE500] text-[#3c1e1e]"
              onClick={() => window.location.href = "/auth/kakao"}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.712 4.8 4.346 6.09l-.843 3.09c-.067.247.078.47.284.47.098 0 .195-.03.273-.09l3.63-2.4c.42.06.85.094 1.31.094 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/></svg>
              카카오
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeChild} data-testid="lock-area">
        <div
          className="relative rounded-2xl p-5 overflow-hidden mb-4"
          style={{ background: "linear-gradient(180deg, #EDEAE6, #E4E0DC)" }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='0.6'/%3E%3C/g%3E%3C/svg%3E\")" }}
          />
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.07)" }}>
              <Lock className="w-4 h-4" style={{ color: "#A09080" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "#A09080" }}>피부 속 진피층 수분 장벽</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(0,0,0,0.07)", color: "#A09080" }}>
              측정 불가
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold blur-[2px] select-none" style={{ color: "#A09080" }}>진피층 수분 손실률</span>
                <span className="text-lg font-extrabold blur-[3px] select-none" style={{ color: "#A09080" }}>??</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full w-3/5 rounded-full blur-[2px]" style={{ background: "rgba(0,0,0,0.08)" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold blur-[2px] select-none" style={{ color: "#A09080" }}>피부 장벽 무너짐 지수</span>
                <span className="text-lg font-extrabold blur-[3px] select-none" style={{ color: "#A09080" }}>??</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-full w-4/5 rounded-full blur-[2px]" style={{ background: "rgba(0,0,0,0.08)" }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={fadeChild}
        className="rounded-2xl p-4 mb-5"
        style={{ background: "#FBF8F5" }}
        data-testid="text-lock-info"
      >
        <p className="text-[12px] leading-[1.8]" style={{ color: TEXT_SECONDARY }}>
          스마트폰 카메라로는 피부 속을 볼 수 없습니다.
          <br />
          <span className="font-bold" style={{ color: DEEP_GREEN }}>
            Fonday 정밀 스캐너로 진짜 피부 속 상태를 확인하세요.
          </span>
        </p>
      </motion.div>

      <motion.div variants={fadeChild}>
        <motion.button
          onClick={() => setShowWaitlist(true)}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, #D4836B, #C06A55)`,
            boxShadow: "0 8px 30px rgba(212,131,107,0.3)",
          }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-earlybird"
        >
          <span className="flex items-center justify-center gap-2">
            Fonday 얼리버드 알림 받기
            <ArrowRight className="w-5 h-5" />
          </span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWaitlist(false)}
            data-testid="modal-overlay"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              className="relative bg-white rounded-t-3xl sm:rounded-3xl p-8 w-full max-w-sm shadow-xl"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-waitlist"
            >
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})` }}
              >
                <Heart className="w-7 h-7 text-white" />
              </div>
              
              {isSuccess ? (
                <div className="py-10 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="font-bold text-lg" style={{ color: DEEP_GREEN }}>등록이 완료되었습니다!</h3>
                  <p className="text-sm mt-2 text-gray-500">출시 소식을 가장 먼저 알려드릴게요.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-extrabold text-lg mb-2" style={{ color: DEEP_GREEN }}>
                    얼리버드 등록
                  </h3>
                  <p className="text-center text-sm leading-relaxed mb-6" style={{ color: TEXT_SECONDARY }}>
                    Fonday 정밀 스캐너 출시 시<br />특별한 얼리버드 혜택을 드립니다!
                  </p>
                  
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <input
                      type="email"
                      required
                      placeholder="이메일 주소를 입력해 주세요"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": DEEP_GREEN_LIGHT } as any}
                    />
                    <motion.button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${DEEP_GREEN}, ${DEEP_GREEN_LIGHT})`,
                        boxShadow: "0 8px 24px rgba(45,95,79,0.25)",
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? "등록 중..." : "등록할게요!"}
                    </motion.button>
                  </form>
                  <button
                    onClick={() => setShowWaitlist(false)}
                    className="w-full text-sm font-semibold py-4 mt-2"
                    style={{ color: "#A09080" }}
                  >
                    다음에 할게요
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MagazineTab() {
  return (
    <motion.div
      className="px-5 pt-6 pb-24"
      variants={stagger}
      initial="initial"
      animate="animate"
      data-testid="tab-content-magazine"
    >
      <motion.div variants={fadeChild} className="mb-6">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: DEEP_GREEN_LIGHT }}>
          Beauty Insight
        </span>
        <h1 className="text-xl font-extrabold mt-1 leading-tight" style={{ color: DEEP_GREEN }} data-testid="text-magazine-headline">
          Fonday 뷰티 인사이트
        </h1>
        <p className="text-[13px] mt-1" style={{ color: TEXT_SECONDARY }}>
          피부 타입별 맞춤 정보를 확인하세요.
        </p>
      </motion.div>

      <div className="space-y-4">
        {articles.map((article) => {
          const Icon = article.icon;
          return (
            <motion.div key={article.id} variants={fadeChild}>
              <motion.div
                className="rounded-2xl overflow-hidden border cursor-pointer"
                style={{ borderColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.98 }}
                data-testid={`article-card-${article.id}`}
              >
                <div className={`h-36 bg-gradient-to-br ${article.gradient} relative flex items-center justify-center`}>
                  <Icon className="w-20 h-20 opacity-[0.08]" />
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/80 backdrop-blur-sm"
                      style={{ color: DEEP_GREEN }}
                    >
                      {article.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <Clock className="w-3 h-3" style={{ color: TEXT_SECONDARY }} />
                    <span className="text-[10px] font-medium" style={{ color: TEXT_SECONDARY }}>
                      {article.readTime}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-[14px] font-bold leading-snug mb-2" style={{ color: DEEP_GREEN }}>
                    {article.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-xs font-bold" style={{ color: "#D4836B" }}>
                      읽어보기
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: "#D4836B" }} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
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

  const handleCapture = useCallback(() => {
    setScanState("survey");
  }, []);

  const handleSurveySubmit = useCallback((data: SurveyData) => {
    setSurveyData(data);
    setScanState("scanning");
  }, []);

  const handleScanComplete = useCallback(() => {
    setScanState("result");
  }, []);

  const handleBack = useCallback(() => {
    setScanState("idle");
    setSurveyData(null);
  }, []);

  const handleGoMagazine = useCallback(() => {
    setActiveTab("magazine");
  }, []);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground transition-colors" data-testid="app-root">
      <div className="absolute top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <div className="overflow-y-auto" style={{ minHeight: "calc(100dvh - 60px)", paddingBottom: 0 }}>
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {scanState === "idle" && <ScanIdleScreen onCapture={handleCapture} />}
              {scanState === "survey" && <SurveyScreen onSubmit={handleSurveySubmit} onBack={handleBack} />}
              {scanState === "scanning" && <ScanningScreen onComplete={handleScanComplete} />}
              {scanState === "result" && <ResultScreen surveyData={surveyData} onGoMagazine={handleGoMagazine} onBack={handleBack} />}
            </motion.div>
          )}
          {activeTab === "magazine" && (
            <motion.div
              key="magazine"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MagazineTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  );
}
