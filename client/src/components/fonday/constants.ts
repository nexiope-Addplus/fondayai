import React from "react";
import {
  Sparkles,
  Droplets,
  Sun,
  LayoutGrid,
  Activity,
  Target,
  Flame,
  Eye,
  Star,
  Waves,
  Shield,
  Leaf,
  Droplet,
  Clock,
  Zap,
} from "lucide-react";
import type { MagazineArticle } from "./types";

// ─── 색상 상수 ────────────────────────────────────────────────────────────────

export const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B",
  D: "#3B82F6",
  S: "#EF4444",
  R: "#10B981",
  P: "#8B5CF6",
  N: "#06B6D4",
  W: "#6366F1",
  T: "#14B8A6",
};

export const DEEP_GREEN = "#4A7C6E";
export const DEEP_GREEN_LIGHT = "#5E9688";
export const TEXT_SECONDARY = "#8C8078";
export const TEXT_TERTIARY = "#B0A898";
export const SCAN_FROM = "#E09882";
export const SCAN_TO = "#C97062";
export const TINT_WARM = "#FDF3F0";
export const TINT_GREEN = "#F0F7F4";
export const TINT_NEUTRAL = "#F7F5F2";

// ─── DESIGN.md 디자인 토큰 ────────────────────────────────────────────────────
export const BG_BASE = "#FDFCFA";
export const BG_MUTED = "#F8F7F5";
export const BORDER_COLOR = "#EBE8E4";
export const FONT_DISPLAY = "'Fraunces', Georgia, serif";
export const FONT_HEADING = "Pretendard, sans-serif";

// ─── z-index 스케일 ──────────────────────────────────────────────────────────
export const Z = {
  actionBar: 50,   // ResultActionBar / BottomNav
  sheet: 100,      // detail sheets (RoutineTab selectedItem)
  modal: 200,      // modals (CosmeticsRegisterModal, AttendanceCalendar)
  camera: 200,     // CameraCapture overlay
  pwa: 210,        // PWA install prompt
  push: 990,       // push notification banner
  overlay: 999,    // full-screen overlays
} as const;

// ─── 점수 라벨 매핑 (서버는 항상 한국어, 클라이언트에서 t('scores.N')로 번역) ──

export const SCORE_LABEL_MAP: Record<string, number> = {
  "종합 컨디션": 0, "수분 밸런스": 1, "붉은기 수준": 2, "모공 상태": 3,
  "주름 및 탄력": 4, "잡티/색소침착": 5, "트러블 위험": 6,
  "다크서클": 7, "피부 광채": 8, "피부결 균일도": 9,
};

// ─── 피부 맞춤 영양 성분 카드 ─────────────────────────────────────────────────

export const NUTRIENT_COLORS: Record<string, string> = {
  O: "#4A7C6E", D: "#3B82C4", S: "#E05A3A", R: "#10B981",
  P: "#F59E0B", N: "#8B5CF6", W: "#C97062", T: "#10B981",
};

export const NUTRIENT_ICONS: Record<string, React.ReactNode> = {
  O: React.createElement(Droplets, { className: "w-4 h-4" }),
  D: React.createElement(Droplet, { className: "w-4 h-4" }),
  S: React.createElement(Leaf, { className: "w-4 h-4" }),
  R: React.createElement(Shield, { className: "w-4 h-4" }),
  P: React.createElement(Eye, { className: "w-4 h-4" }),
  N: React.createElement(Sparkles, { className: "w-4 h-4" }),
  W: React.createElement(Clock, { className: "w-4 h-4" }),
  T: React.createElement(Zap, { className: "w-4 h-4" }),
};

// ─── 인덱스 기반 아이콘/색상 ──────────────────────────────────────────────────

export const SCORE_ICONS = [Sparkles, Droplets, Sun, LayoutGrid, Activity, Target, Flame, Eye, Star, Waves];
export const SCORE_COLORS = [
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

// ─── 애니메이션 변수 ──────────────────────────────────────────────────────────

export const fadeChild = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const tabSlideVariants = {
  enter: (dir: number) => ({ x: dir * 30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -30, opacity: 0 }),
};

// ─── 미션 포인트 ──────────────────────────────────────────────────────────────

export const MISSION_POINTS: Record<string, number> = {
  first_scan: 50, daily_scan: 10, streak_3: 100, streak_7: 200,
  streak_30: 500, score_70: 150, score_80: 300, challenge: 100, share: 50,
  daily_improve: 20, daily_challenge: 50,
};

// ─── 다이어리 원인 태그 ───────────────────────────────────────────────────────

export const DIARY_CAUSE_TAGS = ["sleep", "newProduct", "cycle", "diet", "stress", "outdoor"] as const;

export const LEGACY_DIARY_CAUSE_TAG_MAP: Record<string, "sleep" | "newProduct" | "cycle" | "diet" | "stress" | "outdoor"> = {
  "수면부족": "sleep",
  "새 화장품": "newProduct",
  "생리주기": "cycle",
  "식단": "diet",
  "스트레스": "stress",
  "야외활동": "outdoor",
};

export const CAUSE_TAG_KEYWORDS: Record<"sleep" | "newProduct" | "cycle" | "diet" | "stress" | "outdoor", string[]> = {
  sleep: ["피곤", "수면", "잠", "야근", "늦잠", "sleep", "tired", "insomnia", "寝不足", "睡眠"],
  newProduct: ["새", "화장품", "세럼", "크림", "토너", "제품", "new product", "serum", "cream", "toner", "cosmetic", "新しい", "化粧品"],
  cycle: ["생리", "주기", "pms", "period", "cycle", "menstrual", "生理", "周期"],
  diet: ["매운", "야식", "커피", "술", "밀가루", "단것", "식단", "diet", "coffee", "alcohol", "spicy", "sugar", "食事", "コーヒー", "お酒"],
  stress: ["스트레스", "예민", "피로", "긴장", "stress", "stressed", "sensitive", "ストレス", "疲れ"],
  outdoor: ["야외", "운동", "햇빛", "외출", "여행", "outdoor", "sun", "travel", "workout", "外出", "日差し", "旅行"],
};

// ─── 화장품 카테고리 ──────────────────────────────────────────────────────────

export const CATEGORY_ORDER = ["클렌저", "토너", "세럼", "진정케어", "각질케어", "아이크림", "장벽케어", "크림", "선크림"];

export const COSMETIC_CATEGORIES = ["클렌저","토너","세럼","크림","선크림","각질케어","진정케어","장벽케어","아이크림","기타스킨케어"] as const;

// ─── 매거진 카테고리 필터 ─────────────────────────────────────────────────────

export const CATEGORY_FILTERS = ["전체", "성분", "루틴", "타입", "케어", "전문가"] as const;

// ─── 매거진 아티클 ────────────────────────────────────────────────────────────

export const MAGAZINE_ARTICLES: MagazineArticle[] = [
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

export const MAGAZINE_ARTICLES_EN: MagazineArticle[] = [
  {
    id: 1, featured: true,
    title: "The Complete Baumann Skin Type Guide: 16 Types — Know Your Skin",
    summary: "The era of simply labeling skin as oily or dry is over. With Dr. Baumann's 16-type system, you can build an optimal routine without spending a fortune on consultations.",
    body: [
      { heading: "Why Skin Type Matters", text: "Even within 'dry skin,' a sensitive, pigmentation-prone type requires completely different products than a resistant, even-toned type. Dr. Leslie Baumann's Skin Type Indicator (BSTI) classifies skin along four axes: oil-moisture balance (O/D), sensitivity (S/R), pigmentation (P/N), and aging (W/T)." },
      { heading: "O (Oily) vs. D (Dry)", text: "Determined by sebum secretion. Oily skin (O) is characterized by shine and enlarged pores — salicylic acid and niacinamide are effective. Dry skin (D) needs oil-barrier-strengthening ingredients like ceramides and squalane." },
      { heading: "S (Sensitive) vs. R (Resistant)", text: "Reflects skin barrier strength against external stimuli. Sensitive skin (S) is prone to flushing from acidic ingredients or strong retinol, so ultra-gentle formulas are essential. Resistant skin (R) absorbs actives efficiently and tolerates higher concentrations." },
      { heading: "P (Pigmented) vs. N (Non-Pigmented)", text: "Indicates tendency to develop hyperpigmentation. Pigmented skin (P) triggers immediate melanin synthesis upon UV exposure — vitamin C, arbutin, and niacinamide together are essential. Use SPF 50+ PA++++ sunscreen every single day." },
      { heading: "W (Wrinkle-Prone) vs. T (Tight)", text: "Reflects the rate of collagen and elastin loss. Wrinkle-prone skin (W) benefits most from starting retinol, peptides, and growth factors early. Tight skin (T) stays firm with a consistent basic moisturizing routine." },
      { text: "Knowing your Baumann type lets you select only what your skin truly needs from thousands of products — the most scientific approach to reducing waste and preventing skin problems." },
    ],
    tag: "Baumann Type", category: "타입", readTime: "6 min", author: "박수연", authorRole: "Dermatologist", date: "2026.03", bgFrom: "#E09882", bgTo: "#C97062", emoji: "🧬",
  },
  {
    id: 2,
    title: "Beginner's Guide to Retinol: How to Start Without Side Effects",
    summary: "Retinol is a proven anti-aging ingredient, but used incorrectly it causes severe flaking and redness. From choosing the right concentration to the sandwich technique — a step-by-step strategy for first-timers.",
    body: [
      { heading: "Why Retinol?", text: "Retinol is a vitamin A derivative and the only anti-aging ingredient officially recognized by the FDA. It stimulates dermal fibroblasts to boost collagen synthesis and accelerates epidermal cell turnover, simultaneously improving fine lines, pores, and dullness." },
      { heading: "Concentration Strategy by Stage", text: "Start between 0.025–0.05%. As skin adapts, increase every 4–6 weeks: 0.1% → 0.3% → 0.5%. Sensitive skin types should start with a gentler form like retinyl palmitate, which has a longer conversion process." },
      { heading: "The Sandwich Technique", text: "If your skin is sensitive, try the 'sandwich technique' — moisturizer → retinol → moisturizer. This regulates the concentration of retinol that comes into direct contact with skin." },
      { heading: "Contraindications", text: "Retinol is light-unstable, so use only at night. SPF 50+ sunscreen the next morning is non-negotiable. If pregnant or breastfeeding, consult your doctor before use." },
    ],
    tag: "Ingredient Analysis", category: "성분", readTime: "5 min", author: "이민호", authorRole: "Skin Researcher", date: "2026.03", bgFrom: "#A78BFA", bgTo: "#7C3AED", emoji: "✨",
  },
  {
    id: 3,
    title: "Ceramides vs. Hyaluronic Acid: Which Does Your Skin Need?",
    summary: "Both are linked to hydration but work in completely different ways. Those with a compromised skin barrier and those lacking moisture require different strategies.",
    body: [
      { heading: "Hyaluronic Acid: A Moisture Magnet", text: "HA is a large molecule that absorbs up to 1,000x its own weight in water, rapidly drawing moisture to the skin's surface. However, in dry environments it can draw moisture out from within — always seal it with a finishing moisturizer." },
      { heading: "Ceramides: The Bricks of Your Barrier", text: "Ceramides make up 50%+ of the stratum corneum and directly repair a damaged barrier, preventing transepidermal water loss. For atopic, psoriatic, or sensitive skin where the barrier is weakened, ceramides take priority over HA." },
      { heading: "Choosing the Right One", text: "If your skin feels oily on the surface but tight underneath (combination-dehydrated), apply a HA serum then finish with a lightweight ceramide lotion. For atopic or thin-barrier skin, build your routine around a ceramide cream and layer HA on top." },
    ],
    tag: "Ingredient Comparison", category: "성분", readTime: "4 min", author: "김지현", authorRole: "Cosmetic Chemist", date: "2026.02", bgFrom: "#34D399", bgTo: "#0D9488", emoji: "💧",
  },
  {
    id: 4,
    title: "Why You Should Wear Sunscreen Every Day — Even in Winter",
    summary: "Even on cloudy days and indoors, 80% of skin aging is caused by UV rays. The true meaning of SPF and PA ratings, and the correct reapplication timing.",
    body: [
      { heading: "UVA vs. UVB: Which Is More Dangerous?", text: "UVB causes sunburn and raises skin cancer risk, but UVA penetrates glass and breaks down collagen deep in the dermis. Even on cloudy days, 80% of UVA reaches Earth's surface — making it the primary driver of skin aging." },
      { heading: "How to Read SPF and PA", text: "SPF is the UVB protection index — SPF 50 blocks ~98%, SPF 30 blocks ~97%. PA is the UVA protection grade; more plus signs mean stronger protection. Use SPF 30+ PA+++ for daily outings, SPF 50+ PA++++ for intense outdoor activity." },
      { heading: "The Right Time to Reapply", text: "Sweat and sebum deplete protection every 2 hours. Even indoors, reapply at least twice a day. Over makeup, a powder sunscreen or sun cushion makes reapplication easy." },
    ],
    tag: "Sun Protection", category: "케어", readTime: "4 min", author: "박수연", authorRole: "Dermatologist", date: "2026.02", bgFrom: "#FCD34D", bgTo: "#F59E0B", emoji: "☀️",
  },
  {
    id: 5,
    title: "How Often Should You Exfoliate? The Over-Exfoliation Trap",
    summary: "Frequent exfoliation is a fast track to a damaged skin barrier. The difference between AHA, BHA, and PHA — and the right frequency for your skin type.",
    body: [
      { heading: "Why Exfoliate?", text: "Skin cells naturally shed every 28–42 days. As we age or when metabolism slows, dead cells accumulate — causing dullness, clogged pores, and reduced product absorption. Proper exfoliation promotes cell turnover and boosts the efficacy of next-step products." },
      { heading: "AHA vs. BHA vs. PHA", text: "AHA (glycolic, lactic acid) is water-soluble, ideal for dry and aging skin — it dissolves surface dead skin quickly but can irritate sensitive types. BHA (salicylic acid) is oil-soluble and penetrates pores to dissolve sebum and dead skin — excellent for oily and acne-prone skin. PHA (gluconolactone) has a larger molecule, so it absorbs slowly but causes far less irritation — ideal for sensitive skin." },
      { heading: "Correct Usage Frequency", text: "Normal skin: 2–3 times per week. Sensitive skin: once per week. Always follow with SPF sunscreen. Photosensitized skin exposed to UV can develop worsened hyperpigmentation." },
    ],
    tag: "Exfoliation", category: "케어", readTime: "5 min", author: "이민호", authorRole: "Skin Researcher", date: "2026.01", bgFrom: "#FB923C", bgTo: "#EA580C", emoji: "🔬",
  },
  {
    id: 6,
    title: "Vitamin C Serum: Used Correctly, It Fades Dark Spots",
    summary: "Vitamin C is the most researched antioxidant and brightening ingredient, but it oxidizes rapidly. The ideal concentration, pH, and storage methods to maximize its effects.",
    body: [
      { heading: "What Vitamin C Does for Skin", text: "L-ascorbic acid inhibits tyrosinase (the melanin-synthesis enzyme) to lighten dark spots and hyperpigmentation. It also neutralizes free radicals and stimulates collagen synthesis — simultaneously improving brightness and firmness." },
      { heading: "Concentration and pH", text: "Efficacy is validated at 10–20% concentration. At pH 3.5 or below, skin absorption is highest — so apply vitamin C serum first, before toner or immediately after toning." },
      { heading: "Storage to Prevent Oxidation", text: "Vitamin C degrades rapidly with heat, light, or air. A yellow-brown product has lost efficacy and may even irritate skin. Choose opaque, airtight packaging and refrigerate after opening, or use within 3 months." },
      { heading: "Stabilized Derivatives", text: "For sensitive skin, choose stabilized derivatives like ascorbyl glucoside or ascorbyl palmitate. Results appear more slowly than pure vitamin C, but they can be used consistently without irritation." },
    ],
    tag: "Brightening", category: "성분", readTime: "5 min", author: "최지수", authorRole: "Cosmetic Pharmacologist", date: "2026.01", bgFrom: "#FDE68A", bgTo: "#F59E0B", emoji: "🍋",
  },
  {
    id: 7,
    title: "The Science of Seasonal Skin Flare-Ups: Why Spring and Autumn Break Your Skin",
    summary: "Rapid changes in temperature and humidity disrupt skin homeostasis. The biological causes of seasonal skin problems and a proactive response routine.",
    body: [
      { heading: "What Is Skin Homeostasis?", text: "Skin maintains a stable internal environment against changes in temperature, humidity, UV, and microorganisms. When this adaptive system overloads during seasonal transitions, sebum imbalance, abnormal desquamation, and skin microbiome disruption occur in a chain reaction." },
      { heading: "Spring-Specific Factors", text: "The thick stratum corneum built up over winter sheds rapidly as temperatures rise, temporarily weakening the barrier. Environmental irritants like yellow dust and pollen surge, and heavy winter moisturizers often clog pores in spring's higher humidity." },
      { heading: "A Proactive Response Routine", text: "Two weeks before the seasonal change, switch to a lighter moisturizer and add 1–2 exfoliation sessions per week. Keep ceramide barrier-strengthening products but adjust texture seasonally: gel → lotion → cream." },
    ],
    tag: "Seasonal Care", category: "케어", readTime: "4 min", author: "박수연", authorRole: "Dermatologist", date: "2026.03", bgFrom: "#6EE7B7", bgTo: "#10B981", emoji: "🌿",
  },
  {
    id: 8,
    title: "Surface Dryness vs. Dehydrated Skin: Different Causes Need Different Solutions",
    summary: "Even within 'dry skin,' different underlying causes require different solutions. How to distinguish oil-deficient from moisture-deficient skin — and the optimal routine for each.",
    body: [
      { heading: "Surface Dryness: Oil-Deficient", text: "Surface dryness occurs when sebum production is low and no lipid film forms on the skin surface. Long-lasting tightness after cleansing and fine flaking are key signs. Replenish lipids with plant oils (squalane, jojoba) or ceramides." },
      { heading: "Dehydrated Skin: Moisture-Deficient", text: "Dehydrated skin has normal or high sebum production but low water content in the stratum corneum. Classic 'combination-dehydrated' — oily on the surface but tight underneath. Supply moisture-attracting ingredients like HA and glycerin, then finish with a lightweight occlusive layer." },
      { heading: "How to Tell the Difference", text: "Observe your skin 30 minutes after cleansing with nothing applied. Overall tightness with visible flaking suggests surface dryness. Shiny forehead and nose with tight cheeks suggests dehydrated skin. Check your Baumann O/D score with a Fonday AI scan for a more accurate reading." },
    ],
    tag: "Skin Types", category: "타입", readTime: "4 min", author: "이민호", authorRole: "Skin Researcher", date: "2026.02", bgFrom: "#93C5FD", bgTo: "#3B82F6", emoji: "🌊",
  },
  {
    id: 9,
    title: "The Complete Double Cleansing Guide: One Step in the Right Order Changes Everything",
    summary: "Cleansing is the foundation of skincare, but the wrong order and method damages the skin barrier. The science behind the correct oil cleanser + foam cleanser combination.",
    body: [
      { heading: "Why Double Cleansing?", text: "Oil-based makeup (sunscreen, foundation, concealer) cannot be fully removed by a water-based foam cleanser alone. Residue clogs pores and causes sebum oxidation — a direct cause of skin problems. Step 1: dissolve oil-soluble substances with an oil cleanser. Step 2: remove water-soluble impurities with a foam cleanser." },
      { heading: "How to Use an Oil Cleanser", text: "Apply to dry hands and a dry face, massage gently for 30–60 seconds. Adding water triggers an emulsification reaction that separates makeup and dead skin. Emulsify thoroughly with a small amount of water before rinsing off completely." },
      { heading: "Key Points for Foam Cleansers", text: "The stronger the cleansing power, the greater the burden on the skin barrier. A mildly acidic cleanser (pH ~5.5) best maintains the skin's natural acid mantle. Keep cleansing under 60 seconds and immediately follow with moisturization." },
    ],
    tag: "Cleansing", category: "루틴", readTime: "4 min", author: "최지수", authorRole: "Cosmetic Pharmacologist", date: "2026.01", bgFrom: "#C4B5FD", bgTo: "#8B5CF6", emoji: "🫧",
  },
  {
    id: 10,
    title: "5 Reasons You Should Never Pop a Pimple, According to a Dermatologist",
    summary: "Squeezing pimples or blackheads may feel satisfying in the moment, but it leads to scarring and hyperpigmentation. The correct approach to managing breakouts.",
    body: [
      { heading: "What Extraction Does to Your Skin", text: "The pressure from pressing with your fingers can rupture the follicle into the surrounding dermis. When sebum leaks into the dermis, a severe inflammatory response occurs — the direct cause of scarring and hyperpigmentation." },
      { heading: "Bacteria Spread", text: "Staphylococcus aureus and Cutibacterium acnes on your hands spread to surrounding follicles during extraction. If one pimple ever turned into two or three nearby, this is exactly why." },
      { heading: "Blackhead Extraction Is Also Off-Limits", text: "Dissolve blackheads gradually with BHA (salicylic acid) and clay masks — not manual extraction. When pores are enlarged by squeezing, sebum production intensifies and the vicious cycle repeats." },
      { heading: "The Right Alternatives", text: "For pustular acne, use an acne patch to absorb the fluid, or visit a dermatologist for professional extraction. For comedones (whiteheads and blackheads), regular BHA exfoliant use minimizes long-term skin damage." },
    ],
    tag: "Blemish Care", category: "전문가", readTime: "4 min", author: "박수연", authorRole: "Dermatologist", date: "2026.03", bgFrom: "#FCA5A5", bgTo: "#EF4444", emoji: "🩺",
  },
];

export const MAGAZINE_ARTICLES_JA: MagazineArticle[] = [
  {
    id: 1, featured: true,
    title: "バウマン皮膚タイプ完全ガイド：16タイプで自分の肌の正体を知る",
    summary: "脂性か乾性かだけで考える時代は終わりました。バウマン博士の16タイプ分類法で肌を正確に理解すれば、高額なコンサルティングなしでも最適なルーティンを組み立てられます。",
    body: [
      { heading: "肌タイプが重要な理由", text: "同じ「乾燥肌」でも、敏感で色素沈着が起きやすいタイプと耐性が強く均一なタイプでは、まったく異なるアイテムが必要です。皮膚科専門医レスリー・バウマン博士のBSTIは肌を4つの軸で分類します。油水分バランス（O/D）、敏感度（S/R）、色素沈着（P/N）、エイジング（W/T）です。" },
      { heading: "O（脂性）vs D（乾性）", text: "皮脂の分泌量で分類。脂性肌（O）はテカリと毛穴の開きが特徴で、サリチル酸やナイアシンアミドが有効です。乾性肌（D）はセラミドやスクワランのような油分バリアを強化する成分が必須です。" },
      { heading: "S（敏感性）vs R（耐性）", text: "外部刺激への皮膚バリアの強度を表します。敏感肌（S）は酸性成分や強いレチノールで赤みが出やすいため超低刺激フォーミュラが必須。耐性肌（R）は活性成分の吸収率が高くより高濃度を使えます。" },
      { heading: "P（色素性）vs N（非色素性）", text: "シミやそばかすの生じやすさを示します。色素性肌（P）は紫外線で即座にメラニンが合成されるため、ビタミンC・アルブチン・ナイアシンアミドの組み合わせが必須。SPF 50+ PA++++を毎日欠かさず使ってください。" },
      { heading: "W（しわ性）vs T（弾力性）", text: "コラーゲン・エラスチンの損失速度を反映。しわ性肌（W）はレチノール・ペプチド・成長因子を早めに始めるほど効果的。弾力性肌（T）は基本的な保湿ルーティンの継続で十分です。" },
      { text: "自分のバウマンタイプを知ることで、何千種類もの製品から本当に必要なものだけを選び出せます。無駄を省き、肌トラブルを予防する最も科学的なアプローチです。" },
    ],
    tag: "バウマン タイプ", category: "타입", readTime: "6分", author: "박수연", authorRole: "皮膚科専門医", date: "2026.03", bgFrom: "#E09882", bgTo: "#C97062", emoji: "🧬",
  },
  {
    id: 2,
    title: "レチノール入門ガイド：副作用なしに始める方法",
    summary: "レチノールは実証済みのエイジングケア成分ですが、間違うと激しい角質荒れや赤みを引き起こします。濃度選びからサンドイッチ法まで、初めての方への段階的戦略を紹介します。",
    body: [
      { heading: "なぜレチノールなのか", text: "レチノールはビタミンAの誘導体で、FDAが公式認定したエイジングケア成分。真皮の線維芽細胞を刺激してコラーゲン合成を促進し、ターンオーバーを加速させることで小じわ・毛穴・くすみを同時に改善します。" },
      { heading: "濃度別の段階的戦略", text: "0.025〜0.05%から始めましょう。肌が慣れたら4〜6週間ごとに濃度を上げます。0.1% → 0.3% → 0.5%が一般的。敏感肌は変換プロセスが長い穏やかなレチニルパルミテートから始めるのが良いでしょう。" },
      { heading: "サンドイッチ法", text: "肌が敏感な方はレチノールの前後に保湿剤を塗る「サンドイッチ法」が効果的。保湿剤 → レチノール → 保湿剤の順で、肌に触れる濃度を調整します。" },
      { heading: "使用上の注意", text: "レチノールは光に不安定なため必ず夜のみ使用し、翌朝はSPF 50+の日焼け止めが必須です。妊娠中・授乳中の方は医師に相談してから判断してください。" },
    ],
    tag: "成分 分析", category: "성분", readTime: "5分", author: "이민호", authorRole: "皮膚研究員", date: "2026.03", bgFrom: "#A78BFA", bgTo: "#7C3AED", emoji: "✨",
  },
  {
    id: 3,
    title: "セラミド vs ヒアルロン酸、自分の肌に合うのはどっち？",
    summary: "どちらも「水分」に関わる成分ですが、作用メカニズムはまったく異なります。肌バリアが崩れている人と水分が不足している人では、異なる戦略が必要です。",
    body: [
      { heading: "ヒアルロン酸：水分を引き寄せる磁石", text: "HAは自重の1,000倍もの水分を吸収できる高分子。皮膚外部から水分を素早く引き寄せ即座なうるおいを提供します。ただし乾燥した環境では逆に皮膚内の水分を奪うため、保湿仕上げクリームと一緒に使うことで効果が最大化されます。" },
      { heading: "セラミド：バリアを築くレンガ", text: "セラミドは角質層の50%以上を構成する脂質成分。損傷したバリアを直接修復し、経皮水分蒸散を防いで外部刺激を遮断します。アトピー・乾癬・敏感肌のようにバリアが弱まっている場合はヒアルロン酸よりセラミドが優先されます。" },
      { heading: "自分に合った選び方", text: "表面はテカるのに内側が突っ張る「インナードライ」の方はHAセラムで水分補給後、軽いセラミドローションで仕上げましょう。アトピーや肌バリアが薄いタイプなら、セラミドクリームをベースにHAを重ねる方法が効果的です。" },
    ],
    tag: "成分 比較", category: "성분", readTime: "4分", author: "김지현", authorRole: "コスメティックケミスト", date: "2026.02", bgFrom: "#34D399", bgTo: "#0D9488", emoji: "💧",
  },
  {
    id: 4,
    title: "日焼け止め、冬でも毎日塗るべき理由",
    summary: "曇りの日も室内でも、肌老化の80%は紫外線が原因です。皮膚科専門医が強調するSPF・PA値の本当の意味と、正しい塗り直しのタイミングを解説します。",
    body: [
      { heading: "UVA vs UVB、どちらが怖いか", text: "UVBは日焼けを引き起こし皮膚がんリスクを高めますが、UVAはガラスを透過して真皮深部のコラーゲンを分解します。曇りの日でもUVAの80%が地上に届きます。老化の主犯がUVAである理由です。" },
      { heading: "SPFとPA値の読み方", text: "SPFはUVB遮断指数でSPF 50は約98%、SPF 30は約97%を遮断。PAはUVA遮断等級で＋の数が多いほど強力。日常の外出にはSPF 30+ PA+++、強い屋外活動にはSPF 50+ PA++++を推奨します。" },
      { heading: "正しい塗り直しのタイミング", text: "汗や皮脂で効果は2時間ごとに失われます。室内中心でも午前・午後の2回は塗り直しが必要。メイクの上からはパウダータイプの日焼け止めやサンクッションが便利です。" },
    ],
    tag: "紫外線 ケア", category: "케어", readTime: "4分", author: "박수연", authorRole: "皮膚科専門医", date: "2026.02", bgFrom: "#FCD34D", bgTo: "#F59E0B", emoji: "☀️",
  },
  {
    id: 5,
    title: "角質ケア、どのくらいの頻度が正解？過角化の落とし穴",
    summary: "過度な角質除去は肌バリアを崩す近道です。AHA・BHA・PHAの違いと、肌タイプ別の適切な頻度を皮膚科学的根拠とともに整理します。",
    body: [
      { heading: "なぜ角質を除去するのか", text: "角質細胞は28〜42日周期で自然脱落します。年齢を重ねたり代謝が遅くなると死んだ角質が蓄積し、くすみ・毛穴詰まり・製品の浸透低下につながります。適切な角質除去はターンオーバーを促進し、次ステップの製品効果を高めます。" },
      { heading: "AHA・BHA・PHAの違い", text: "AHA（グリコール酸・乳酸）は水溶性で乾燥肌・エイジング肌に最適。表面角質を素早く溶かしますが敏感肌には刺激になることも。BHA（サリチル酸）は油溶性で毛穴内の皮脂と角質を同時に溶かし脂性・ニキビ肌に最適。PHA（グルコノラクトン）は分子が大きくゆっくり吸収されるため刺激が少なく敏感肌向けです。" },
      { heading: "正しい使用頻度", text: "普通肌は週2〜3回、敏感肌は週1回が適切。使用後は必ずSPF日焼け止めを塗ってください。光感受性が高まった肌への紫外線は色素沈着を悪化させます。" },
    ],
    tag: "角質 ケア", category: "케어", readTime: "5分", author: "이민호", authorRole: "皮膚研究員", date: "2026.01", bgFrom: "#FB923C", bgTo: "#EA580C", emoji: "🔬",
  },
  {
    id: 6,
    title: "ビタミンCセラム、正しく使えばシミが薄くなる",
    summary: "ビタミンCは最も長く研究された抗酸化・美白成分ですが酸化が早く製品選びと保管が難しいです。効果を最大化するための濃度・pH・保管方法を解説します。",
    body: [
      { heading: "ビタミンCの肌への効果", text: "L-アスコルビン酸（純粋なビタミンC）はメラニン合成酵素チロシナーゼを抑制し、シミやそばかすを薄くします。同時に活性酸素を中和しコラーゲン合成を刺激することで、明るさと弾力を同時に改善する複合的な効能を持ちます。" },
      { heading: "濃度とpH", text: "10〜20%の濃度で効果が実証されています。pH 3.5以下の酸性環境で皮膚吸収率が最大化されるため、ビタミンCセラムはトナーの前または直後に最初に使用するのが原則です。" },
      { heading: "酸化を防ぐ保管方法", text: "ビタミンCは熱・光・空気で急激に酸化します。黄褐色に変色した製品は効果がないだけでなく肌を刺激する可能性があります。遮光容器の製品を選び、開封後は冷蔵保管するか3ヶ月以内に使い切ってください。" },
      { heading: "安定化ビタミンC誘導体", text: "敏感肌にはアスコルビルグルコシドやアスコルビルパルミテートのような安定化された誘導体を。効果の現れ方は遅いですが刺激なく継続して使用できます。" },
    ],
    tag: "美白 成分", category: "성분", readTime: "5分", author: "최지수", authorRole: "コスメティック薬学研究員", date: "2026.01", bgFrom: "#FDE68A", bgTo: "#F59E0B", emoji: "🍋",
  },
  {
    id: 7,
    title: "季節の変わり目の肌荒れの科学：なぜ春と秋に肌が崩れるのか",
    summary: "温度と湿度の急激な変化は肌の恒常性を乱します。季節の変わり目のトラブルの生物学的原因と先手を打った対策ルーティンを専門家の視点で解説します。",
    body: [
      { heading: "肌の恒常性とは", text: "肌は外部の温度・湿度・UV・微生物の変化に抗して内部環境を一定に保とうとする「恒常性」を持っています。季節の変わり目にこの適応システムが過負荷になると、皮脂分泌のアンバランス・異常角質脱落・肌マイクロバイオームの乱れが連鎖的に起きます。" },
      { heading: "春特有の問題", text: "冬に厚くなった角質層が気温上昇とともに急激に脱落し、一時的に肌バリアが弱まります。黄砂・花粉などの環境刺激が急増し、冬用の濃い保湿剤が春の高湿度に合わず毛穴を詰まらせるケースも多いです。" },
      { heading: "先手を打った対策ルーティン", text: "季節の変わり目の2週間前から保湿剤を軽めのものに切り替え、角質ケアを週1〜2回追加しましょう。セラミド製品は継続しながら、テクスチャーをジェル→ローション→クリームと季節に合わせて調整することが肌トラブルを最小化します。" },
    ],
    tag: "季節の変わり目", category: "케어", readTime: "4分", author: "박수연", authorRole: "皮膚科専門医", date: "2026.03", bgFrom: "#6EE7B7", bgTo: "#10B981", emoji: "🌿",
  },
  {
    id: 8,
    title: "表面乾燥 vs インナードライ：乾燥の原因が違えば解決策も変わる",
    summary: "同じ「乾燥肌」でも原因が異なれば解決策も異なります。水分不足タイプと油分不足タイプの見分け方と、それぞれの最適なルーティンをまとめました。",
    body: [
      { heading: "表面乾燥：油分不足型", text: "皮脂分泌が少なく肌の表面に油膜が形成されない状態。洗顔後の突っ張りが長く続き、微細な角質が浮きやすいのが特徴です。植物性オイル（スクワラン・ホホバオイル）やセラミドのような脂質成分を補うことが核心です。" },
      { heading: "インナードライ：水分不足型", text: "皮脂分泌は正常または多いものの角質層の水分含有量が低い状態。表面はテカるのに内側が突っ張る「混合インナードライ」が代表的。ヒアルロン酸・グリセリンのような水分誘引成分を十分に与えつつ、保湿仕上げは軽めに。" },
      { heading: "見分ける方法", text: "洗顔後何も塗らない状態で30分後の肌状態を観察します。全体的に突っ張って角質が見えるなら表面乾燥。おでこ・鼻はテカるのに頬だけ突っ張るならインナードライの可能性が高いです。Fonday AIスキャンでバウマンO/D値を確認するとより正確に判定できます。" },
    ],
    tag: "肌 タイプ", category: "타입", readTime: "4分", author: "이민호", authorRole: "皮膚研究員", date: "2026.02", bgFrom: "#93C5FD", bgTo: "#3B82F6", emoji: "🌊",
  },
  {
    id: 9,
    title: "正しいダブルクレンジングガイド：順番一つで肌が変わる",
    summary: "クレンジングはスキンケアの出発点ですが、間違った順番と方法は肌バリアを傷つけます。オイルクレンザーとフォームクレンザーの正しい組み合わせを科学的に解説します。",
    body: [
      { heading: "ダブルクレンジングが必要な理由", text: "日焼け止め・ファンデーション・コンシーラーのような油溶性メイクは、水溶性フォームクレンザー一本では完全に落とせません。残った汚れが毛穴を詰まらせ皮脂酸化を起こし肌トラブルの原因になります。ステップ1でオイルクレンザーが油溶性成分を溶かし、ステップ2でフォームが水溶性の不純物を除去します。" },
      { heading: "オイルクレンザーの使い方", text: "乾いた手と顔にオイルクレンザーを取り、30〜60秒かけて優しくマッサージします。水を加えると乳化反応が起き、角質とメイクが分離されます。少量の水で十分に乳化させてから水で流してください。" },
      { heading: "フォームクレンザーの注意点", text: "洗浄力が強いほど肌バリアに負担がかかります。pH 5.5前後の弱酸性クレンザーが肌の自然な酸性皮脂膜を維持するのに最適。クレンジングは60秒以内に抑え、洗顔後は直ちに保湿ステップに進みましょう。" },
    ],
    tag: "クレンジング", category: "루틴", readTime: "4分", author: "최지수", authorRole: "コスメティック薬学研究員", date: "2026.01", bgFrom: "#C4B5FD", bgTo: "#8B5CF6", emoji: "🫧",
  },
  {
    id: 10,
    title: "絞り出してはいけない5つの理由、皮膚科専門医が解説",
    summary: "ニキビやブラックヘッドを手で絞るとすぐ解消される気がしますが、瘢痕や色素沈着を招く可能性があります。正しいトラブルケアの方法を公開します。",
    body: [
      { heading: "圧出が肌に与える影響", text: "指で肌を押すときの圧力は毛包を周囲の真皮層へ破裂させます。皮脂が真皮内部に流れ込むと激しい炎症反応が起こり、これが瘢痕と色素沈着の直接的な原因です。" },
      { heading: "菌が広がる", text: "手にある黄色ブドウ球菌やCutibacterium acnesが圧出の際に周囲の毛包に広がります。一つのニキビを絞ったら周りに2〜3個新たに生じた経験があるなら、まさにこれが理由です。" },
      { heading: "ブラックヘッドの圧出も禁物", text: "ブラックヘッドはBHA（サリチル酸）とクレイマスクで徐々に溶かし出すのが正解です。圧出で毛穴が広がると皮脂分泌がさらに活発になり悪循環が繰り返されます。" },
      { heading: "正しい代替ケア", text: "膿疱性ニキビならパッチを貼って浸出液を吸収させるか、皮膚科でプロの圧出を受けましょう。面皰（ホワイトヘッド・ブラックヘッド）はBHAエクスフォリアントで毛穴内を定期的に管理することが長期的な肌ダメージを最小化します。" },
    ],
    tag: "トラブル ケア", category: "전문가", readTime: "4分", author: "박수연", authorRole: "皮膚科専門医", date: "2026.03", bgFrom: "#FCA5A5", bgTo: "#EF4444", emoji: "🩺",
  },
];

export function getMagazineArticles(lang: string): MagazineArticle[] {
  if (lang.startsWith("ja")) return MAGAZINE_ARTICLES_JA;
  if (lang.startsWith("en")) return MAGAZINE_ARTICLES_EN;
  return MAGAZINE_ARTICLES;
}
