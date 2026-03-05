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
  FileText,
  PlusSquare,
  SmartphoneNfc,
  Clock,
  User,
  ChevronRight,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type TabId = "scan" | "report" | "magazine";
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

// ─── Google AdSense 배너 ──────────────────────────────────────────
// AdSense 대시보드에서 광고 단위 생성 후 data-ad-slot 값을 교체하세요.
function AdBanner({ slot }: { slot: string }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);
  return (
    <div className="w-full overflow-hidden my-1">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5928664043346684"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

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

interface MagazineArticle {
  id: number;
  featured?: boolean;
  title: string;
  summary: string;
  body: { heading?: string; text: string }[];
  tag: string;
  category: "성분" | "루틴" | "타입" | "케어" | "전문가";
  readTime: string;
  author: string;
  authorRole: string;
  date: string;
  bgFrom: string;
  bgTo: string;
  emoji: string;
}

const MAGAZINE_ARTICLES: MagazineArticle[] = [
  {
    id: 1,
    featured: true,
    title: "바우만 피부 타입 완전 가이드: 16가지 타입, 내 피부의 정체를 알다",
    summary: "지성인지 건성인지만 따지던 시대는 끝났습니다. 바우만 박사의 16가지 피부 분류법으로 내 피부를 정확히 이해하면, 수백만 원짜리 컨설팅 없이도 최적의 루틴을 구성할 수 있습니다.",
    body: [
      { heading: "피부 타입이 중요한 이유", text: "같은 '건성 피부'라도 민감하고 색소침착이 잘 생기는 타입과 저항성이 강하고 균일한 타입은 전혀 다른 제품을 써야 합니다. 피부과 전문의 레슬리 바우만 박사가 개발한 바우만 피부 타입 지수(BSTI)는 피부를 네 가지 축으로 분류합니다. 유수분 균형(O/D), 민감도(S/R), 색소침착(P/N), 노화(W/T)가 그것입니다." },
      { heading: "O(지성) vs D(건성)", text: "피지 분비량으로 구분합니다. 지성(O)은 번들거림과 모공 확장이 특징이며 살리실산, 나이아신아마이드가 효과적입니다. 건성(D)은 세라마이드와 스쿠알란처럼 오일 장벽을 강화하는 성분이 핵심입니다." },
      { heading: "S(민감성) vs R(저항성)", text: "외부 자극에 반응하는 피부 장벽 강도를 의미합니다. 민감성(S)은 산성 성분이나 강한 레티놀에 홍조·따가움이 생기기 쉬우므로, 초저자극 포뮬러를 선택해야 합니다. 저항성(R)은 활성 성분 흡수율도 높아 더 강한 농도를 사용할 수 있습니다." },
      { heading: "P(색소성) vs N(비색소성)", text: "기미·잡티 생성 경향을 나타냅니다. 색소성(P) 피부는 자외선 노출 직후 멜라닌 합성이 즉각적으로 반응하므로, 비타민C·알부틴·나이아신아마이드 조합이 필수입니다. SPF 50+ PA++++ 차단제는 매일 빠짐없이 사용하세요." },
      { heading: "W(주름성) vs T(탄력성)", text: "콜라겐·엘라스틴 손실 속도를 반영합니다. 주름성(W) 피부는 레티놀, 펩타이드, 성장인자 성분을 일찍 시작할수록 효과적이며, 탄력성(T) 피부는 기본 보습 루틴을 꾸준히 유지하는 것으로 충분합니다." },
      { text: "자신의 바우만 타입을 알면 수천 가지 제품 중 실제로 자신에게 필요한 것만 선별할 수 있습니다. 화장품 쇼핑에서 낭비를 줄이고, 피부 트러블을 예방하는 가장 과학적인 접근법입니다." },
    ],
    tag: "바우만 타입",
    category: "타입",
    readTime: "6분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#E09882",
    bgTo: "#C97062",
    emoji: "🧬",
  },
  {
    id: 2,
    title: "레티놀 입문 가이드: 부작용 없이 시작하는 법",
    summary: "레티놀은 검증된 항노화 성분이지만 잘못 쓰면 심한 각질과 홍조를 유발합니다. 농도 선택부터 샌드위치 기법까지, 처음 쓰는 분들을 위한 단계별 전략을 공개합니다.",
    body: [
      { heading: "왜 레티놀인가", text: "레티놀은 비타민A의 유도체로, FDA가 공식 인정한 유일한 항노화 성분입니다. 진피 섬유아세포를 자극해 콜라겐 합성을 촉진하고, 표피 교체 주기를 가속화하여 잔주름·모공·칙칙함을 동시에 개선합니다." },
      { heading: "농도 단계별 전략", text: "0.025~0.05%에서 시작하세요. 피부가 적응하면 4~6주 간격으로 농도를 올립니다. 0.1% → 0.3% → 0.5% 순서가 일반적이며, 민감성 피부는 레티닐 팔미테이트처럼 전환 과정이 더 긴 순한 형태로 시작하는 것이 좋습니다." },
      { heading: "샌드위치 기법", text: "피부가 예민하다면 레티놀 전후로 보습제를 바르는 '샌드위치 기법'이 효과적입니다. 보습제 → 레티놀 → 보습제 순서로 레티놀이 피부에 닿는 농도를 조절합니다." },
      { heading: "금기 사항", text: "레티놀은 빛에 불안정하므로 반드시 밤에만 사용하고, 다음 날 아침 SPF 50+ 차단제는 필수입니다. 임신 중이거나 수유 중이라면 의사와 상담 후 사용 여부를 결정하세요." },
    ],
    tag: "성분 분석",
    category: "성분",
    readTime: "5분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.03",
    bgFrom: "#A78BFA",
    bgTo: "#7C3AED",
    emoji: "✨",
  },
  {
    id: 3,
    title: "세라마이드 vs 히알루론산, 내 피부엔 뭐가 맞을까",
    summary: "둘 다 '수분'과 관련된 성분이지만 작용 원리가 완전히 다릅니다. 피부 장벽이 무너진 사람과 수분이 부족한 사람은 다른 전략이 필요합니다.",
    body: [
      { heading: "히알루론산: 수분을 끌어당기는 자석", text: "히알루론산(HA)은 자기 무게의 1,000배에 달하는 수분을 흡수하는 거대 분자입니다. 피부 외부에서 수분을 빠르게 끌어당겨 즉각적인 촉촉함을 제공합니다. 단, 건조한 환경에서는 오히려 피부 속 수분을 빼앗을 수 있어 보습 마무리 크림과 함께 사용해야 효과가 극대화됩니다." },
      { heading: "세라마이드: 장벽을 쌓는 벽돌", text: "세라마이드는 피부 각질층의 50% 이상을 구성하는 지질 성분입니다. 손상된 장벽을 직접 복구해 수분 증발을 막고 외부 자극 차단 효과가 탁월합니다. 아토피, 건선, 민감성 피부처럼 장벽이 약화된 경우 히알루론산보다 세라마이드가 우선입니다." },
      { heading: "나에게 맞는 선택법", text: "겉은 번들거리는데 속이 땅기는 '수부지'라면 히알루론산 세럼으로 수분을 공급한 뒤, 가벼운 세라마이드 로션으로 마무리하세요. 아토피나 피부 장벽이 얇은 타입이라면 세라마이드가 주성분인 크림을 바탕으로 사용하고 히알루론산을 추가하는 방식이 효과적입니다." },
    ],
    tag: "성분 비교",
    category: "성분",
    readTime: "4분",
    author: "김지현",
    authorRole: "코스메틱 케미스트",
    date: "2026.02",
    bgFrom: "#34D399",
    bgTo: "#0D9488",
    emoji: "💧",
  },
  {
    id: 4,
    title: "자외선 차단제, 겨울에도 매일 발라야 하는 이유",
    summary: "흐린 날, 실내에서도 피부 노화의 80%는 자외선 때문입니다. 피부과 전문의들이 강조하는 SPF·PA 수치의 진짜 의미와 올바른 재도포 타이밍을 알아봅니다.",
    body: [
      { heading: "UVA vs UVB, 무엇이 더 무서운가", text: "UVB는 일광화상을 일으키고 피부암 위험을 높이지만, UVA는 유리창을 뚫고 들어와 진피 깊숙이 콜라겐을 분해합니다. 흐린 날에도 UVA의 80%는 지상에 도달합니다. 노화의 주범이 UVA인 이유입니다." },
      { heading: "SPF와 PA 수치 읽는 법", text: "SPF는 UVB 차단 지수로 SPF 50은 약 98%, SPF 30은 약 97%를 차단합니다. PA는 UVA 차단 등급으로 +가 많을수록 강합니다. 일상적인 외출에는 SPF 30+ PA+++, 강한 야외 활동에는 SPF 50+ PA++++를 권장합니다." },
      { heading: "올바른 재도포 타이밍", text: "땀이나 피지로 차단 효과는 2시간마다 소멸합니다. 실내 위주 생활이라도 오전·오후 2회는 재도포가 필요합니다. 메이크업 위에는 파우더 타입 선크림이나 선쿠션을 사용하면 간편하게 재도포할 수 있습니다." },
    ],
    tag: "자외선 차단",
    category: "케어",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.02",
    bgFrom: "#FCD34D",
    bgTo: "#F59E0B",
    emoji: "☀️",
  },
  {
    id: 5,
    title: "각질 제거, 얼마나 자주 해야 할까? 과각질화의 함정",
    summary: "잦은 각질 제거는 피부 장벽을 무너뜨리는 지름길입니다. AHA·BHA·PHA의 차이와 내 피부 타입에 맞는 적정 주기를 피부과적 근거로 정리합니다.",
    body: [
      { heading: "각질은 왜 제거해야 하는가", text: "표피의 각질세포는 28~42일 주기로 자연 탈락합니다. 나이가 들거나 피부 대사가 느려지면 죽은 각질이 쌓여 칙칙함, 모공 막힘, 제품 흡수 저하로 이어집니다. 적절한 각질 제거는 피부 세포 교체를 촉진하고 다음 단계 제품의 효과를 높입니다." },
      { heading: "AHA·BHA·PHA 차이", text: "AHA(글리콜산, 젖산)는 수용성으로 건성·노화 피부에 적합합니다. 표면 각질을 빠르게 녹이지만 민감성 피부에는 자극이 올 수 있습니다. BHA(살리실산)는 지용성으로 모공 속 피지와 각질을 동시에 녹여 지성·여드름성 피부에 탁월합니다. PHA(글루코노락톤)는 분자가 커서 흡수가 느리지만 그만큼 자극이 적어 예민한 피부에 추천합니다." },
      { heading: "올바른 사용 주기", text: "일반 피부는 주 2~3회, 민감성 피부는 주 1회가 적정 주기입니다. 사용 후 반드시 SPF 차단제를 바르세요. 광민감성이 증가한 피부에 자외선이 닿으면 색소침착이 심해질 수 있습니다." },
    ],
    tag: "각질 케어",
    category: "케어",
    readTime: "5분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.01",
    bgFrom: "#FB923C",
    bgTo: "#EA580C",
    emoji: "🔬",
  },
  {
    id: 6,
    title: "비타민C 세럼, 제대로 쓰면 기미가 옅어진다",
    summary: "비타민C는 가장 오래 연구된 항산화·미백 성분이지만 산화 속도가 빨라 제품 선택과 보관이 까다롭습니다. 효과를 극대화하는 농도·pH·보관법을 알아봅니다.",
    body: [
      { heading: "비타민C의 피부 효과", text: "L-아스코르빈산(순수 비타민C)은 멜라닌 합성 효소인 타이로시나아제를 억제해 기미·잡티를 옅게 합니다. 동시에 활성산소를 중화하고 콜라겐 합성을 자극해 밝기와 탄력을 동시에 개선하는 복합 효능을 가집니다." },
      { heading: "농도와 pH", text: "일반적으로 10~20% 농도에서 효과가 검증됐습니다. pH 3.5 이하의 산성 환경에서 피부 흡수율이 높아지므로, 비타민C 세럼은 토너 전 또는 토닝 직후, 가장 먼저 사용하는 것이 원칙입니다." },
      { heading: "산화를 막는 보관법", text: "비타민C는 열·빛·공기에 노출되면 급격히 산화됩니다. 황갈색으로 변한 제품은 효과가 없을 뿐만 아니라 오히려 피부를 자극할 수 있습니다. 차광 용기에 담긴 제품을 선택하고, 개봉 후에는 냉장 보관하거나 3개월 내에 사용을 완료하세요." },
      { heading: "안정화 비타민C 성분들", text: "민감성 피부라면 아스코르빌글루코사이드, 아스코르빌팔미테이트처럼 안정화된 유도체를 선택하세요. 효과는 순수 형태보다 느리게 나타나지만 자극 없이 꾸준히 사용할 수 있습니다." },
    ],
    tag: "미백 성분",
    category: "성분",
    readTime: "5분",
    author: "최지수",
    authorRole: "피부 약학 연구원",
    date: "2026.01",
    bgFrom: "#FDE68A",
    bgTo: "#F59E0B",
    emoji: "🍋",
  },
  {
    id: 7,
    title: "환절기 피부 트러블의 과학: 왜 봄·가을마다 피부가 망가지나",
    summary: "온도와 습도의 급격한 변화는 피부 항상성을 교란합니다. 환절기 트러블의 생물학적 원인과 선제적 대응 루틴을 전문가 시각으로 풀어봅니다.",
    body: [
      { heading: "피부 항상성이란", text: "피부는 외부 온도·습도·UV·미생물 변화에 맞서 내부 환경을 일정하게 유지하려는 '항상성'을 갖습니다. 계절이 바뀔 때 이 적응 시스템이 과부하를 받으면 피지 분비 불균형, 각질 비정상 탈락, 피부 마이크로바이옴 교란이 연쇄적으로 발생합니다." },
      { heading: "봄철 특이점", text: "겨울 동안 두꺼워진 각질층이 온도 상승과 함께 급격히 탈락하면서 일시적으로 피부 장벽이 약해집니다. 황사·꽃가루 같은 환경적 자극원이 급증하고, 겨울용 진한 보습제가 봄의 높아진 습도와 맞지 않아 모공을 막는 경우도 흔합니다." },
      { heading: "선제적 대응 루틴", text: "환절기 2주 전부터 보습제를 가볍게 교체하고, 각질 제거를 주 1~2회 추가하세요. 장벽 강화 세라마이드 제품을 유지하되, 텍스처는 계절 변화에 맞춰 젤→로션→크림 순으로 조정하는 것이 피부 트러블을 최소화하는 방법입니다." },
    ],
    tag: "환절기 케어",
    category: "케어",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#6EE7B7",
    bgTo: "#10B981",
    emoji: "🌿",
  },
  {
    id: 8,
    title: "속건성 vs 겉건성, 내 건조함의 원인이 달라야 해결된다",
    summary: "같은 '건조 피부'라도 원인이 다르면 해결책도 달라집니다. 수분이 부족한 타입과 유분이 부족한 타입을 구분하는 법, 그리고 각각의 최적 루틴을 정리했습니다.",
    body: [
      { heading: "겉건성: 유분 부족형", text: "겉건성은 피지 분비가 적어 피부 표면에 기름막이 형성되지 않는 상태입니다. 세안 후 당김이 오래 지속되고, 미세 각질이 일어나기 쉽습니다. 식물성 오일(스쿠알란, 호호바 오일)이나 세라마이드처럼 지질 성분을 보충하는 것이 핵심입니다." },
      { heading: "속건성: 수분 부족형", text: "속건성은 피지 분비는 정상이거나 많지만 각질층의 수분 함유량이 낮은 상태입니다. 겉은 번들거리는데 속이 당기는 '수부지'가 대표적입니다. 히알루론산·글리세린처럼 수분을 끌어당기는 성분을 충분히 공급하되, 막음막이 역할의 보습 마무리는 가볍게 마무리하세요." },
      { heading: "구분하는 방법", text: "세안 후 아무것도 바르지 않은 상태에서 30분이 지났을 때 피부 상태를 관찰합니다. 전체적으로 당기고 각질이 보이면 겉건성, 이마·코는 번들거리는데 볼만 당긴다면 속건성일 가능성이 높습니다. Fonday AI 스캔으로 바우만 O/D 수치를 확인하면 더 정확하게 판별할 수 있습니다." },
    ],
    tag: "피부 타입",
    category: "타입",
    readTime: "4분",
    author: "이민호",
    authorRole: "피부 연구원",
    date: "2026.02",
    bgFrom: "#93C5FD",
    bgTo: "#3B82F6",
    emoji: "🌊",
  },
  {
    id: 9,
    title: "올바른 더블 클렌징 가이드: 순서 하나가 피부를 바꾼다",
    summary: "클렌징은 스킨케어의 시작이지만 잘못된 순서와 방법이 피부 장벽을 훼손합니다. 오일 클렌저와 폼 클렌저의 올바른 조합법을 과학적으로 설명합니다.",
    body: [
      { heading: "더블 클렌징이 필요한 이유", text: "선크림·파운데이션·컨실러 같은 지용성 메이크업은 수용성 폼 클렌저 하나로는 완전히 제거되지 않습니다. 남은 잔여물이 모공을 막고 피지 산화를 일으켜 피부 트러블의 원인이 됩니다. 1단계 오일 클렌저로 지용성 성분을 먼저 녹이고, 2단계 폼 클렌저로 수용성 불순물을 제거하는 것이 핵심입니다." },
      { heading: "오일 클렌저 사용법", text: "건조한 손과 얼굴에 오일 클렌저를 바르고 30~60초간 부드럽게 마사지합니다. 이때 물을 섞으면 유화 반응이 일어나 각질과 메이크업이 분리됩니다. 물이 약간 섞인 상태에서 충분히 유화한 뒤 물로 헹궈내세요." },
      { heading: "폼 클렌저 주의점", text: "폼 클렌저는 세정력이 강할수록 피부 장벽에 부담이 됩니다. pH 5.5 전후의 약산성 클렌저가 피부의 자연 산성막을 유지하는 데 적합합니다. 클렌징 시간은 60초 이내로 짧게 유지하고, 세안 후 즉시 보습 단계를 진행해 수분 손실을 최소화하세요." },
    ],
    tag: "클렌징 루틴",
    category: "루틴",
    readTime: "4분",
    author: "최지수",
    authorRole: "피부 약학 연구원",
    date: "2026.01",
    bgFrom: "#C4B5FD",
    bgTo: "#8B5CF6",
    emoji: "🫧",
  },
  {
    id: 10,
    title: "압출하면 안 되는 5가지 이유, 피부과 전문의가 말한다",
    summary: "여드름이나 블랙헤드를 손으로 짜는 것은 당장은 해소되는 것 같지만 피부 흉터와 색소침착을 부를 수 있습니다. 올바른 트러블 케어법을 공개합니다.",
    body: [
      { heading: "압출이 피부에 미치는 영향", text: "손가락으로 피부를 누를 때 가해지는 압력은 모낭을 주변 진피층으로 파열시킵니다. 피지가 진피 내부로 흘러들어가면 격렬한 염증 반응이 일어나고, 이것이 흉터와 색소침착의 직접적인 원인이 됩니다." },
      { heading: "균이 퍼진다", text: "손에 있는 포도상구균이나 큐티박테리움 여드름균이 압출 과정에서 주변 모낭으로 전파됩니다. 하나의 여드름을 짜다가 주변에 두세 개가 새로 생기는 경험을 한 적 있다면 바로 이 이유입니다." },
      { heading: "블랙헤드 압출도 금물", text: "블랙헤드는 압출이 아닌 BHA(살리실산)와 클레이 마스크로 서서히 녹여내는 것이 정석입니다. 압출로 모공이 늘어나면 피지 분비가 더 왕성해져 악순환이 반복됩니다." },
      { heading: "올바른 대안", text: "농포성 여드름이라면 패치를 붙여 진물을 흡수시키거나, 피부과에서 전문 압출을 받으세요. 면포(화이트헤드·블랙헤드)는 BHA 성분의 엑스폴리언트로 모공 속을 정기적으로 관리하는 것이 장기적으로 피부 손상을 최소화합니다." },
    ],
    tag: "트러블 케어",
    category: "전문가",
    readTime: "4분",
    author: "박수연",
    authorRole: "피부과 전문의",
    date: "2026.03",
    bgFrom: "#FCA5A5",
    bgTo: "#EF4444",
    emoji: "🩺",
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
function BottomNav({ active, onChange, onScanNew, onInstall }: {
  active: TabId;
  onChange: (t: TabId) => void;
  onScanNew: () => void;
  onInstall: () => void;
}) {
  const btn = (tab: TabId, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange(tab)}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active === tab ? "text-[#C97062]" : "text-stone-400"}`}>
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-stone-100">
      <div className="max-w-md mx-auto px-2">
        <div className="grid grid-cols-5 h-[64px]">
          <button
            onClick={onScanNew}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${active === "scan" ? "text-[#C97062]" : "text-stone-400"}`}>
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-semibold">AI 스캔</span>
          </button>
          {btn("report", <FileText className="w-5 h-5" />, "리포트")}
          <a
            href="https://fonday.replit.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 active:opacity-70 -mt-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] font-black" style={{ color: "#C97062" }}>Fonday</span>
          </a>
          {btn("magazine", <BookOpen className="w-5 h-5" />, "매거진")}
          <button
            onClick={onInstall}
            className="flex flex-col items-center justify-center gap-0.5 text-stone-400 transition-colors active:text-[#C97062]">
            <SmartphoneNfc className="w-5 h-5" />
            <span className="text-[10px] font-semibold">앱 추가</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── 페이스 메시 오버레이 (실제 얼굴 인식) ──────────────────────
import type { NormalizedLandmark, LandmarkConnectionArray } from '@mediapipe/face_mesh';

function FaceMeshOverlay({ imageSrc }: { imageSrc: string }) {
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [connections, setConnections] = useState<{ contours: LandmarkConnectionArray; tess: LandmarkConnectionArray } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mp = await import('@mediapipe/face_mesh');
        const { FaceMesh, FACEMESH_CONTOURS, FACEMESH_TESSELATION } = mp;

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });
        faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

        await new Promise<void>((resolve) => {
          faceMesh.onResults((results: any) => {
            if (cancelled) return;
            if (results.multiFaceLandmarks?.[0]) {
              setLandmarks(results.multiFaceLandmarks[0]);
              setConnections({ contours: FACEMESH_CONTOURS, tess: FACEMESH_TESSELATION });
              setTimeout(() => setVisible(true), 50);
            }
            resolve();
          });
          const img = new Image();
          img.onload = () => faceMesh.send({ image: img });
          img.src = imageSrc;
        });

        faceMesh.close();
      } catch (e) {
        console.warn('Face mesh detection failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [imageSrc]);

  if (!landmarks || !connections) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
    >
      {/* 테셀레이션 (촘촘한 메시) */}
      {connections.tess.map(([a, b], i) => (
        <line key={`t${i}`}
          x1={landmarks[a].x} y1={landmarks[a].y}
          x2={landmarks[b].x} y2={landmarks[b].y}
          stroke="rgba(255,255,255,0.18)" strokeWidth="0.002" />
      ))}
      {/* 외곽선 + 눈/코/입 강조 */}
      {connections.contours.map(([a, b], i) => (
        <line key={`c${i}`}
          x1={landmarks[a].x} y1={landmarks[a].y}
          x2={landmarks[b].x} y2={landmarks[b].y}
          stroke="rgba(255,255,255,0.75)" strokeWidth="0.004" />
      ))}
      {/* 랜드마크 점 (주요 포인트만) */}
      {landmarks.filter((_, i) => i % 12 === 0).map((pt, i) => (
        <circle key={`p${i}`} cx={pt.x} cy={pt.y} r={0.007}
          fill="white" opacity={0.9} />
      ))}
    </svg>
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
          <>
            <img src={imageSrc} className="w-full h-full object-cover" />
            <FaceMeshOverlay imageSrc={imageSrc} />
          </>
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

        {/* 광고 */}
        <AdBanner slot="6349940752" />

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
                            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} style={{ fontSize: "9px" }} tickFormatter={(v) => `${v}`} width={24} />
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
const CATEGORY_FILTERS = ["전체", "성분", "루틴", "타입", "케어", "전문가"] as const;
type CategoryFilter = typeof CATEGORY_FILTERS[number];

function ArticleModal({ article, onClose }: { article: MagazineArticle; onClose: () => void }) {
  const dragControls = useDragControls();
  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-t-3xl w-full max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "92dvh" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y" dragControls={dragControls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.3 }}
        onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) onClose(); }}
      >
        {/* 드래그 핸들 */}
        <div className="pt-4 pb-2 flex justify-center touch-none cursor-grab active:cursor-grabbing shrink-0"
          onPointerDown={e => dragControls.start(e)}>
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>

        {/* 히어로 이미지 영역 */}
        <div
          className="mx-4 mb-4 rounded-2xl overflow-hidden shrink-0"
          style={{
            height: 160,
            background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})`,
            position: "relative",
          }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 52 }}>{article.emoji}</span>
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-black text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
              {article.tag}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-white/80" />
            <span className="text-[10px] text-white/80 font-medium">{article.readTime} 읽기</span>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pb-10 space-y-4">
            <h2 className="text-[19px] font-black leading-snug" style={{ color: DEEP_GREEN }}>{article.title}</h2>

            {/* 저자 정보 */}
            <div className="flex items-center gap-2.5 py-3 border-y border-stone-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                style={{ background: `linear-gradient(135deg, ${article.bgFrom}, ${article.bgTo})` }}>
                {article.author[0]}
              </div>
              <div>
                <p className="text-[12px] font-bold text-stone-800">{article.author}</p>
                <p className="text-[10px] text-stone-400">{article.authorRole} · {article.date}</p>
              </div>
            </div>

            <p className="text-[13px] text-stone-500 leading-relaxed">{article.summary}</p>

            {article.body.map((section, i) => (
              <div key={i} className="space-y-1.5">
                {section.heading && (
                  <h3 className="text-[14px] font-black" style={{ color: DEEP_GREEN_LIGHT }}>{section.heading}</h3>
                )}
                <p className="text-[13px] text-stone-600 leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MagazineTab() {
  const [filter, setFilter] = useState<CategoryFilter>("전체");
  const [selectedArticle, setSelectedArticle] = useState<MagazineArticle | null>(null);

  const filtered = filter === "전체"
    ? MAGAZINE_ARTICLES
    : MAGAZINE_ARTICLES.filter(a => a.category === filter);

  const featured = filtered.find(a => a.featured) ?? filtered[0];
  const rest = filtered.filter(a => a.id !== featured.id);

  return (
    <>
      <ScrollArea className="h-[calc(100dvh-60px)]">
        <motion.div className="pb-28" variants={stagger} initial="initial" animate="animate">

          {/* 헤더 */}
          <motion.div variants={fadeChild} className="px-5 pt-6 pb-4">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: SCAN_TO }}>Beauty Insight</p>
            <h1 className="text-[26px] font-black tracking-tight leading-tight" style={{ color: DEEP_GREEN }}>
              피부 전문가의<br />뷰티 인사이트
            </h1>
          </motion.div>

          {/* 카테고리 필터 */}
          <motion.div variants={fadeChild} className="px-5 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={filter === cat
                    ? { background: DEEP_GREEN, color: "white" }
                    : { background: "#F3F1EE", color: "#8C8070" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 피처드 히어로 카드 */}
          {featured && (
            <motion.div variants={fadeChild} className="px-5 mb-5">
              <motion.div
                onClick={() => setSelectedArticle(featured)}
                whileTap={{ scale: 0.98 }}
                className="rounded-3xl overflow-hidden shadow-lg cursor-pointer"
                style={{ background: `linear-gradient(145deg, ${featured.bgFrom}, ${featured.bgTo})` }}
              >
                {/* 이미지 영역 */}
                <div className="relative" style={{ height: 200 }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1.5px, transparent 1.5px), radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
                  {/* 장식 원 */}
                  <div className="absolute right-6 top-6 w-28 h-28 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                      <span style={{ fontSize: 44 }}>{featured.emoji}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }} />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-black text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      ★ FEATURED
                    </span>
                  </div>
                </div>
                {/* 텍스트 영역 */}
                <div className="px-5 pb-5 pt-3 bg-white/95">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${featured.bgFrom}22`, color: featured.bgTo }}>
                      {featured.tag}
                    </span>
                    <span className="text-[10px] text-stone-400">·</span>
                    <span className="text-[10px] text-stone-400">{featured.readTime} 읽기</span>
                  </div>
                  <h2 className="text-[16px] font-black leading-snug mb-2" style={{ color: DEEP_GREEN }}>
                    {featured.title}
                  </h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{featured.summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-black"
                        style={{ background: `linear-gradient(135deg, ${featured.bgFrom}, ${featured.bgTo})` }}>
                        {featured.author[0]}
                      </div>
                      <span className="text-[11px] font-bold text-stone-500">{featured.author}</span>
                      <span className="text-[10px] text-stone-300">{featured.authorRole}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: featured.bgTo }}>
                      <span className="text-[11px] font-bold">읽기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* 광고 (피처드 카드 아래) */}
          <div className="px-5 mb-4">
            <AdBanner slot="6349940752" />
          </div>

          {/* 나머지 아티클 목록 */}
          <div className="px-5 space-y-3">
            {rest.map((article, idx) => (
              <div key={article.id}>
                <motion.div
                  variants={fadeChild}
                  onClick={() => setSelectedArticle(article)}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                >
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-0 flex items-stretch">
                      {/* 썸네일 */}
                      <div
                        className="w-24 shrink-0 flex flex-col items-center justify-center relative"
                        style={{ background: `linear-gradient(145deg, ${article.bgFrom}, ${article.bgTo})`, minHeight: 96 }}
                      >
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
                        <span style={{ fontSize: 32 }}>{article.emoji}</span>
                      </div>
                      {/* 텍스트 */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: `${article.bgFrom}22`, color: article.bgTo }}>
                              {article.tag}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-black leading-snug line-clamp-2 mb-1" style={{ color: DEEP_GREEN }}>
                            {article.title}
                          </h3>
                          <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">{article.summary}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-stone-300" />
                            <span className="text-[9px] text-stone-400">{article.author}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-stone-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span className="text-[9px]">{article.readTime}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                {/* 4번째 아티클 뒤 광고 */}
                {idx === 3 && (
                  <div className="mt-3">
                    <AdBanner slot="6349940752" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </ScrollArea>

      {/* 아티클 읽기 모달 */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── 리포트 탭 ────────────────────────────────────────────────────
function ReportTab({ user }: { user: any }) {
  const [lastScan, setLastScan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/scans")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setLastScan(data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-64px)] px-6 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})` }}>
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black mb-1" style={{ color: DEEP_GREEN }}>내 피부 리포트</h2>
          <p className="text-sm text-stone-400">로그인하면 지난 분석 결과를 확인할 수 있어요.</p>
        </div>
        <div className="w-full space-y-2">
          <Button onClick={() => { window.location.href = "/auth/kakao"; }}
            className="w-full h-12 rounded-xl font-bold gap-2 border-0 text-[#3C1E1E]" style={{ background: "#FEE500" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.79 1 7.222c0 2.154 1.386 4.045 3.484 5.14L3.62 15.5a.25.25 0 0 0 .368.274L7.9 13.39A9.63 9.63 0 0 0 9 13.444c4.418 0 8-2.791 8-6.222C17 3.79 13.418 1 9 1Z" fill="#3C1E1E"/>
            </svg>
            카카오로 로그인
          </Button>
          <Button onClick={() => { window.location.href = "/auth/google"; }}
            className="w-full h-12 rounded-xl bg-white hover:bg-stone-50 font-bold text-zinc-700 gap-2 border border-stone-200 shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
            Google로 로그인
          </Button>
        </div>
      </div>
    );
  }

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
        <p className="text-stone-400 text-sm">아직 분석 기록이 없어요.<br />AI 스캔을 먼저 해보세요!</p>
      </div>
    );
  }

  const date = new Date(lastScan.createdAt);
  const baumannLetters = lastScan.baumannType ? lastScan.baumannType.split("") : [];

  return (
    <div className="h-[calc(100dvh-64px)] overflow-y-auto">
      <motion.div className="px-5 pt-6 pb-24 space-y-4" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeChild} className="flex items-center justify-between">
          <h2 className="text-xl font-black" style={{ color: DEEP_GREEN }}>내 피부 리포트</h2>
          <span className="text-[11px] text-stone-400">
            {date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                  <span className="text-[9px] font-bold opacity-80 mt-1">종합점수</span>
                </div>
                {lastScan.skinAge && (
                  <div className="w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0"
                    style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                    <span className="text-3xl font-black leading-none">{lastScan.skinAge}</span>
                    <span className="text-[9px] font-bold opacity-80 mt-1">피부나이</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span className="text-[13px] text-stone-500">바우만</span>
                    <span className="text-xl font-black" style={{ color: SCAN_TO }}>{lastScan.baumannType}</span>
                    <span className="text-[13px] text-stone-500">형</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {baumannLetters.map((letter: string, i: number) => {
                      const info = BAUMANN_DESC[letter];
                      if (!info) return null;
                      return <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${info.color}18`, color: info.color }}>{info.name}</span>;
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
                  <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>FondayAI 의 피부 총평</p>
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
                <p className="text-[13px] font-black" style={{ color: DEEP_GREEN }}>10가지 항목별 점수</p>
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
                          <span className="text-stone-700">{item.label}</span>
                        </div>
                        <span style={{ color }}>{item.score}점</span>
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
      </motion.div>
    </div>
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
  const [user, setUser] = useState<any>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleScanNew = () => {
    setActiveTab("scan");
    setScanState("idle");
  };

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
          {activeTab === "report" && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReportTab user={user} />
            </motion.div>
          )}
          {activeTab === "magazine" && (
            <motion.div key="magazine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MagazineTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 앱 추가 안내 모달 (iOS) */}
        <AnimatePresence>
          {showInstallGuide && (
            <motion.div className="fixed inset-0 z-[200] flex items-end justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)} />
              <motion.div className="relative bg-white rounded-t-3xl w-full max-w-sm shadow-xl p-7"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}>
                <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-6" />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  <SmartphoneNfc className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-center text-lg font-black mb-2" style={{ color: "#2D5F4F" }}>홈 화면에 추가하기</h3>
                <p className="text-center text-sm text-stone-400 mb-6">Safari에서 아래 단계를 따라 앱을 추가하세요.</p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="text-[13px] text-stone-600">하단 <strong>공유 버튼(□↑)</strong>을 탭해요.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="text-[13px] text-stone-600"><strong>"홈 화면에 추가"</strong>를 선택해요.</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50">
                    <span className="w-6 h-6 rounded-full bg-[#C97062] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="text-[13px] text-stone-600">오른쪽 위 <strong>"추가"</strong>를 탭하면 완료!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full h-12 rounded-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #E09882, #C97062)" }}>
                  확인
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} onScanNew={handleScanNew} onInstall={handleInstall} />
    </div>
  );
}
