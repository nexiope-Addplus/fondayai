/**
 * POST /api/admin/insta-content — 인스타 콘텐츠 자동 생성
 * GET  /api/admin/insta-content — 생성된 콘텐츠 목록 조회
 *
 * 매일 2개 콘텐츠 생성: 오전(캐러셀) + 저녁(릴스 스크립트)
 * DB에 저장 → 관리자 페이지에서 확인 → 수동 업로드 (Phase 1)
 */
import { callGemini, generateImage } from "../../lib/vertex-ai";

interface Env {
  FONDAY_DB: D1Database;
  GCP_SERVICE_ACCOUNT: string;
  ADMIN_KEY?: string;
}

// ── 콘텐츠 타입 정의 ─────────────────────────────────────────────────────────

type ContentPillar = "data-insight" | "skin-tip" | "ingredient-compare" | "app-cta";
type ContentFormat = "carousel" | "reels-script";

interface ContentSlide {
  title: string;
  body: string;
}

interface GeneratedContent {
  pillar: ContentPillar;
  format: ContentFormat;
  hook: string;          // 첫 문장 (후킹)
  hookSub: string;       // 서브 텍스트
  slides: ContentSlide[];  // 캐러셀 5장 or 릴스 씬 5개
  caption: string;       // 인스타 캡션
  hashtags: string[];
  cta: string;           // 마지막 CTA
  productMention?: string; // 언급된 제품 (있으면)
  ingredientFocus?: string; // 핵심 성분
  imagePrompts: string[];  // 슬라이드별 Imagen 프롬프트
}

// ── 요일별 콘텐츠 기둥 매핑 ──────────────────────────────────────────────────

const WEEKLY_SCHEDULE: Array<{ morning: ContentPillar; evening: ContentPillar }> = [
  { morning: "data-insight",       evening: "skin-tip" },          // 월
  { morning: "ingredient-compare", evening: "data-insight" },      // 화
  { morning: "skin-tip",           evening: "ingredient-compare" },// 수
  { morning: "data-insight",       evening: "skin-tip" },          // 목
  { morning: "ingredient-compare", evening: "app-cta" },           // 금
  { morning: "skin-tip",           evening: "data-insight" },      // 토
  { morning: "ingredient-compare", evening: "app-cta" },           // 일
];

// ── 성분 지식 DB (프롬프트용) ─────────────────────────────────────────────────

const INGREDIENT_KNOWLEDGE: Record<string, { name: string; benefit: string; bestFor: string; caution: string }> = {
  "히알루론산": { name: "히알루론산", benefit: "자기 무게의 1000배 수분 보유. 즉각적인 보습", bestFor: "건성/탈수 피부 (D타입)", caution: "건조한 환경에서 단독 사용 시 오히려 수분 빼앗길 수 있음" },
  "세라마이드": { name: "세라마이드", benefit: "피부 장벽의 50%를 구성하는 핵심 지질. 장벽 복구", bestFor: "민감/건성 피부 (S타입)", caution: "오일리 피부에 과량 시 끈적임" },
  "나이아신아마이드": { name: "나이아신아마이드 (비타민B3)", benefit: "미백+모공+유수분 밸런스. 만능 성분", bestFor: "색소침착/불균일한 피부톤 (P타입)", caution: "비타민C와 함께 사용 시 일부 홍조 가능" },
  "레티놀": { name: "레티놀 (비타민A)", benefit: "세포 턴오버 촉진. 주름+색소 개선", bestFor: "노화/광노화 피부 (W타입)", caution: "자극 강함. 밤에만 사용, 선크림 필수" },
  "비타민C": { name: "비타민C (아스코르빈산)", benefit: "항산화+미백+콜라겐 합성 촉진", bestFor: "칙칙한 피부 (P타입)", caution: "공기/빛에 산화 빠름. 갈변 시 사용 중단" },
  "센텔라": { name: "센텔라 (병풀추출물/CICA)", benefit: "진정+상처회복+항염", bestFor: "민감/트러블 피부 (S타입)", caution: "거의 없음. 가장 안전한 진정 성분" },
  "판테놀": { name: "판테놀 (비타민B5)", benefit: "보습+진정+피부 재생", bestFor: "모든 피부 타입", caution: "거의 없음" },
  "AHA": { name: "AHA (글리콜산/젖산)", benefit: "각질 제거+톤 개선+모공 관리", bestFor: "각질/칙칙한 피부 (R타입)", caution: "광과민성. 선크림 필수, 과사용 시 자극" },
  "BHA": { name: "BHA (살리실산)", benefit: "유분 용해+모공 속 청소+항염", bestFor: "지성/여드름 피부 (O타입)", caution: "건성 피부 사용 시 건조함 악화" },
  "프로폴리스": { name: "프로폴리스", benefit: "항균+항염+보습. 천연 방어막", bestFor: "트러블+건성 피부", caution: "벌 알레르기 있으면 주의" },
  "펩타이드": { name: "펩타이드", benefit: "콜라겐 생성 신호 전달. 탄력+주름 개선", bestFor: "탄력 저하 피부 (W타입)", caution: "단독 효과 느림. 레티놀과 병행 시 시너지" },
  "스쿠알란": { name: "스쿠알란", benefit: "피지와 유사한 유분. 가볍게 보습+장벽 강화", bestFor: "건성이지만 무거운 크림 싫은 피부", caution: "거의 없음. 민감 피부도 안전" },
  "글루타치온": { name: "글루타치온", benefit: "항산화+미백. 멜라닌 생성 억제", bestFor: "색소침착/기미 피부 (P타입)", caution: "경구 섭취 대비 외용 효과 논란 있음" },
  "PDRN": { name: "PDRN (폴리데옥시리보뉴클레오타이드)", benefit: "세포 재생+상처 치유+항염", bestFor: "손상/노화 피부", caution: "연어 알레르기 주의" },
  "갈락토미세스": { name: "갈락토미세스", benefit: "발효 성분. 톤업+보습+피부결 개선", bestFor: "칙칙하고 건조한 피부", caution: "균사체 알레르기 드물게 있음" },
};

const SKIN_CONCERNS: Record<string, string> = {
  hydration: "수분 부족/건조",
  soothing: "진정/민감",
  brightening: "미백/톤업",
  acne: "여드름/트러블",
  pore: "모공 관리",
  "anti-aging": "주름/안티에이징",
  elasticity: "탄력",
  repair: "장벽 회복",
  barrier: "피부 장벽",
  nourishing: "영양",
  absorption: "흡수력",
  "uv-protection": "자외선 차단",
};

const CATEGORIES_KR: Record<string, string> = {
  toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저",
};

const BAUMANN_TYPES = [
  "DSPT", "DSPW", "DSNT", "DSNW",
  "DRPT", "DRPW", "DRNT", "DRNW",
  "OSPT", "OSPW", "OSNT", "OSNW",
  "ORPT", "ORPW", "ORNT", "ORNW",
];

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `당신은 Fonday AI의 인스타그램 콘텐츠 전문가입니다.
Fonday AI는 AI 피부 분석 앱으로, 사진 한 장으로 피부 상태를 분석하고 바우만 피부 타입을 알려줍니다.

## 역할
인스타그램에 올릴 스킨케어 교육 콘텐츠를 만듭니다.
핵심 원칙: "성분으로 교육하고, 자연스럽게 앱 사용을 유도한다"

## 톤
- 친구한테 알려주듯 편하지만, 데이터와 근거가 있는 말투
- "~거든요", "~인데요" 같은 자연스러운 구어체
- 전문 용어 쓸 때는 바로 풀어서 설명
- 이모지 절대 사용 금지 (슬라이드 title, body, tip, hook, cta 모두 이모지 없이 텍스트만)
- "~해보세요", "~어떠세요?" 같은 AI 느낌 마무리 금지

## 콘텐츠 구조 (캐러셀 4장 — CTA 5장은 자동 추가되므로 생성하지 마세요)
1장: 후킹 — 호기심 자극하는 질문 또는 반전 (15~20자) + 서브 설명 (15~25자)
2장: 핵심 포인트 1 — 소제목 (10자 이내) + 본문 설명 3~4문장 (80~120자) + 실전 팁 (25자 이내)
3장: 핵심 포인트 2 — 같은 구조
4장: 핵심 포인트 3 — 같은 구조
(5장은 CTA 이미지가 자동 추가됩니다. 생성하지 마세요.)

### 본문 작성 규칙 (중요!)
- body는 3~4문장으로 구체적으로 설명. "왜 그런지", "어떻게 작용하는지"를 포함해야 함.
- 예시: "세라마이드는 피부 장벽의 약 50%를 차지하는 핵심 지질이에요. 외부 자극으로부터 피부를 보호하는 방어막 역할을 하는데, 이게 부족하면 수분이 빠져나가고 민감해지거든요. 건성이나 민감성 피부라면 세라마이드가 들어간 제품을 꼭 챙겨 바르는 게 좋아요."
- 절대 "~해요." 한 줄로 끝내지 말 것. 반드시 3문장 이상.
- 바우만 타입 코드(DSPT 등)를 쓸 때는 괄호로 쉬운 설명을 붙일 것. 예: "DSPT(건성+민감+색소+탄력)"
- tip은 구체적 행동 지침. 예: "밤 루틴에서 세럼 다음 단계에 바르세요"

## 콘텐츠 구조 (릴스 스크립트 5씬)
1씬: 후킹 — 3초 안에 관심 끌기 (title: 키워드, body: 대사 1문장)
2씬: 문제 제기 (title: 키워드, body: 대사 1문장)
3씬: 핵심 정보 (title: 키워드, body: 대사 1문장)
4씬: 해결책 (title: 키워드, body: 대사 1문장)
5씬: CTA (title: 키워드, body: 대사 1문장)

## 절대 금지
- 특정 제품을 직접 추천하거나 광고하지 않음 (성분 교육만)
- "최고의", "완벽한", "혁신적인" 같은 과장 수식어
- "안녕하세요~ 오늘은~" 같은 인사형 시작
- 의학적 진단이나 치료 조언
- 해시태그에 #광고 #협찬 넣지 않음 (실제 광고가 아니므로)

## 바우만 피부 타입 시스템
- 4축: D(건성)/O(지성), S(민감)/R(저항), P(색소)/N(비색소), T(탄력)/W(주름)
- 16가지 조합 (DSPT, ORPW 등)
- Fonday AI가 사진 분석으로 타입 판별

## 출력 형식 (반드시 유효한 JSON)
{
  "hook": "후킹 타이틀 (15자 이내)",
  "hookSub": "서브 텍스트 (20자 이내)",
  "slides": [
    { "title": "소제목 (10자 이내)", "body": "본문 3~4문장 (80~120자, 구체적 설명)", "tip": "실전 팁 (25자 이내)" },
    { "title": "소제목", "body": "본문 3~4문장", "tip": "실전 팁" },
    { "title": "소제목", "body": "본문 3~4문장", "tip": "실전 팁" },
    { "title": "소제목", "body": "본문 3~4문장", "tip": "실전 팁" }
  ],
  "caption": "인스타 캡션 (100~200자, 줄바꿈 포함)",
  "hashtags": ["#스킨케어", "#피부타입", ...8~12개],
  "cta": "CTA 문구 (20자 이내)",
  "ingredientFocus": "핵심 성분명 (1개)",
  "imagePrompts": [
    "Slide 1 영문 이미지 프롬프트 (포토리얼, 얼굴X)",
    "Slide 2 영문 이미지 프롬프트",
    "Slide 3 영문 이미지 프롬프트",
    "Slide 4 영문 이미지 프롬프트"
  ]
}

slides 배열은 반드시 5개. title은 키워드만, body는 한 줄, tip도 한 줄.

## imagePrompts 작성 규칙 (가장 중요!)
imagePrompts 배열은 반드시 5개. 각 슬라이드의 배경 사진을 위한 **영문** 프롬프트.

### 공통 규칙 (반드시 지킬 것!)
- 스타일: Photorealistic, soft natural lighting, bright and clean aesthetic, editorial beauty photography
- 인물: MUST be "young East Asian woman in her 20s with long dark hair". NEVER male. NEVER Caucasian/Western.
- 얼굴: ABSOLUTELY NO face visible. NO eyes, NO nose, NO mouth shown. Camera angle MUST be: back of head, over-the-shoulder from behind, hands only, neck/collarbone from side, silhouette only.
- 밝기: Bright, warm, clean. NEVER dark or moody. White/cream/pastel background preferred.
- 금지 (NEVER): macro skin texture, pores, male person, front face, eyes visible, dark lighting, Western/Caucasian person, emoji or text in image

### 슬라이드별 이미지 가이드
- Slide 1 (후킹): 20대 한국 여성의 뒷모습 또는 옆모습 + 스킨케어 분위기. 예: "Back view of young Korean woman sitting at vanity table, soft morning light, skincare bottles on table, wearing white bathrobe"
- Slide 2 (정보1): 해당 성분/주제와 관련된 제품 + 여성의 손. 예: "Young Korean woman's hands holding serum bottle, soft focus background, bright bathroom, natural light"
- Slide 3 (정보2): 스킨케어 루틴 장면 + 제품 배치. 예: "Skincare products arranged on marble tray, young Korean woman's hand reaching for moisturizer, bright natural light"
- Slide 4 (정보3): 스킨케어 적용 장면 (목/어깨/손). 예: "Young Korean woman applying cream on her neck and collarbone area, side view, soft bathroom light"
(Slide 5는 CTA 고정 이미지이므로 프롬프트 생성 불필요)

JSON 외 텍스트 출력 금지. 코드 펜스 사용 금지.`.trim();
}

function buildUserPrompt(
  pillar: ContentPillar,
  format: ContentFormat,
  products: any[],
  previousTopics: string[],
): string {
  // 랜덤 성분 선택
  const ingredientKeys = Object.keys(INGREDIENT_KNOWLEDGE);
  const randomIngredient = INGREDIENT_KNOWLEDGE[ingredientKeys[Math.floor(Math.random() * ingredientKeys.length)]];

  // 랜덤 바우만 타입
  const randomBaumann = BAUMANN_TYPES[Math.floor(Math.random() * BAUMANN_TYPES.length)];

  // 랜덤 카테고리
  const categories = Object.keys(CATEGORIES_KR);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const categoryKr = CATEGORIES_KR[randomCategory];

  // 랜덤 고민
  const concernKeys = Object.keys(SKIN_CONCERNS);
  const randomConcern = SKIN_CONCERNS[concernKeys[Math.floor(Math.random() * concernKeys.length)]];

  // 해당 카테고리 제품들에서 자주 등장하는 성분 추출
  const categoryProducts = products.filter((p: any) => p.category === randomCategory);
  const topIngredients = getTopIngredients(categoryProducts);

  const previousSection = previousTopics.length > 0
    ? `\n\n최근 다룬 주제 (중복 피할 것): ${previousTopics.join(", ")}`
    : "";

  const formatLabel = format === "carousel" ? "캐러셀 5장" : "릴스 스크립트 5씬";

  const pillarGuide: Record<ContentPillar, string> = {
    "data-insight": `## 데이터 인사이트 콘텐츠
바우만 타입 "${randomBaumann}"을 중심으로 피부 데이터 기반 인사이트를 만들어주세요.
- 이 타입의 피부 특성과 주의할 점
- 이 타입에 맞는 핵심 성분과 그 이유
- 구체적 숫자/비율을 활용 (예: "D타입의 78%가 겨울에 수분 점수 하락")
- 바우만 4축(D/O, S/R, P/N, T/W) 중 하나를 깊게 파기

참고할 성분 정보:
${JSON.stringify(randomIngredient, null, 2)}

이 타입에 많이 추천되는 ${categoryKr} 상위 성분: ${topIngredients.join(", ")}`,

    "skin-tip": `## 피부 상식/팁 콘텐츠
"${randomConcern}" 관련 실용적인 스킨케어 팁을 만들어주세요.
- 많은 사람이 모르거나 잘못 알고 있는 정보
- "이렇게 하면 오히려 역효과" 같은 반전 포인트
- 성분 기반 설명 (왜 이 성분이 이 고민에 효과적인지)
- 계절/환경 변수도 포함

참고할 성분 정보:
${JSON.stringify(randomIngredient, null, 2)}`,

    "ingredient-compare": `## 성분 비교 콘텐츠
"${randomIngredient.name}" 성분을 중심으로 교육 콘텐츠를 만들어주세요.
- 이 성분이 뭔지, 왜 좋은지, 누구에게 맞는지
- 비슷한 효과의 다른 성분과 차이점
- 이 성분이 많이 들어간 ${categoryKr} 제품군의 특징
- 사용 시 주의사항

성분 상세 정보:
- 효능: ${randomIngredient.benefit}
- 추천 피부: ${randomIngredient.bestFor}
- 주의사항: ${randomIngredient.caution}

${categoryKr} 카테고리에서 자주 등장하는 성분: ${topIngredients.join(", ")}`,

    "app-cta": `## 앱 체험 유도 콘텐츠
"내 피부 타입 알아보기"를 주제로, 바우만 피부 타입 시스템의 가치를 알려주는 콘텐츠를 만들어주세요.
- "같은 제품인데 나한텐 왜 안 맞지?" → 피부 타입이 다르니까
- 바우만 16가지 타입 중 자기 타입을 알면 뭐가 달라지는지
- AI 피부 분석의 원리 (사진 한 장 → 10가지 지표 분석)
- CTA는 자연스럽게: "궁금하면 프로필 링크에서 무료로 해보세요"

참고: 바우만 4축 설명
- D(건성) vs O(지성): 유분 생성량
- S(민감) vs R(저항): 외부 자극 반응도
- P(색소) vs N(비색소): 멜라닌 활성도
- T(탄력) vs W(주름): 콜라겐/탄력 상태`,
  };

  return `${formatLabel} 형식으로 콘텐츠를 생성해주세요.

${pillarGuide[pillar]}
${previousSection}

출력: 유효한 JSON만.`;
}

function getTopIngredients(products: any[]): string[] {
  const count: Record<string, number> = {};
  for (const p of products) {
    try {
      const ingredients: string[] = JSON.parse(p.key_ingredients || "[]");
      for (const ing of ingredients) {
        count[ing] = (count[ing] || 0) + 1;
      }
    } catch { /* skip */ }
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
}

// ── DB 테이블 생성 ───────────────────────────────────────────────────────────

async function ensureTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS insta_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pillar TEXT NOT NULL,
      format TEXT NOT NULL,
      hook TEXT NOT NULL,
      hook_sub TEXT DEFAULT '',
      slides TEXT NOT NULL,
      caption TEXT NOT NULL,
      hashtags TEXT NOT NULL,
      cta TEXT NOT NULL,
      ingredient_focus TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  // 기존 테이블에 새 컬럼 없으면 추가
  try { await db.prepare("ALTER TABLE insta_content ADD COLUMN hook_sub TEXT DEFAULT ''").run(); } catch { /* exists */ }
  try { await db.prepare("ALTER TABLE insta_content ADD COLUMN image_prompts TEXT DEFAULT '[]'").run(); } catch { /* exists */ }
}

// ── 콘텐츠 생성 ─────────────────────────────────────────────────────────────

async function generateContent(
  env: Env,
  pillar: ContentPillar,
  format: ContentFormat,
  scheduledDate: string,
  scheduledTime: string,
): Promise<GeneratedContent> {
  // 제품 DB에서 전체 로드
  const { results: products } = await env.FONDAY_DB.prepare(
    "SELECT * FROM products WHERE is_active = 1"
  ).all();

  // 최근 생성된 콘텐츠에서 주제 중복 방지
  const { results: recent } = await env.FONDAY_DB.prepare(
    "SELECT ingredient_focus FROM insta_content ORDER BY created_at DESC LIMIT 14"
  ).all();
  const previousTopics = (recent || []).map((r: any) => r.ingredient_focus).filter(Boolean);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(pillar, format, products || [], previousTopics);

  const result = await callGemini({
    gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
    model: "gemini-2.5-flash",
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });

  const parts = result.candidates?.[0]?.content?.parts || [];
  const textParts = parts.filter((p: any) => !p.thought && p.text);
  let text = textParts.map((p: any) => p.text).join("").trim();

  // Gemini가 코드 펜스로 감쌀 때 제거
  text = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  // JSON이 잘린 경우 복구 시도
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // 끝이 잘린 경우: 마지막 완전한 } 또는 ] 까지 자르기
    const lastBrace = text.lastIndexOf("}");
    const lastBracket = text.lastIndexOf("]");
    const cutAt = Math.max(lastBrace, lastBracket);
    if (cutAt > 0) {
      const trimmed = text.slice(0, cutAt + 1);
      // 닫히지 않은 중괄호/대괄호 카운트 후 보정
      let opens = 0, closes = 0;
      for (const ch of trimmed) { if (ch === "{") opens++; if (ch === "}") closes++; }
      let fixed = trimmed;
      for (let i = 0; i < opens - closes; i++) fixed += "}";
      let aOpens = 0, aCloses = 0;
      for (const ch of fixed) { if (ch === "[") aOpens++; if (ch === "]") aCloses++; }
      for (let i = 0; i < aOpens - aCloses; i++) fixed += "]";
      // 닫히지 않은 문자열 처리
      fixed = fixed.replace(/,\s*[}\]]/, (m) => m.replace(",", ""));
      try {
        parsed = JSON.parse(fixed);
      } catch {
        // 최후 수단: 기본 구조 반환
        parsed = {
          hook: "피부 성분, 제대로 알고 있나요?",
          hookSub: "오늘의 성분 이야기",
          slides: [
            { title: "성분 교육", body: "피부에 맞는 성분을 찾아보세요", tip: "타입별로 다릅니다" },
            { title: "핵심 포인트", body: "성분 하나가 피부를 바꿀 수 있어요", tip: "꾸준함이 핵심" },
            { title: "실전 팁", body: "아침저녁 루틴을 다르게 해보세요", tip: "밤에는 활성 성분" },
            { title: "주의사항", body: "과하면 오히려 역효과예요", tip: "소량부터 시작" },
            { title: "정리", body: "내 피부 타입부터 알아야 해요", tip: "AI 분석으로 확인" },
          ],
          caption: "피부 성분, 제대로 알아보기\n\n내 피부 타입에 맞는 성분을 찾는 게 첫걸음이에요.",
          hashtags: ["#스킨케어", "#피부타입", "#성분분석", "#피부관리", "#뷰티팁"],
          cta: "내 피부 타입 무료 분석",
          ingredientFocus: format === "carousel" ? "성분 가이드" : "",
        };
      }
    } else {
      throw new Error("Gemini JSON parse failed: " + text.slice(0, 200));
    }
  }

  // 이미지 프롬프트는 저장만 (실제 생성은 대시보드에서 온디맨드)
  const imagePrompts: string[] = parsed.imagePrompts || [];

  return {
    pillar,
    format,
    hook: parsed.hook || "",
    hookSub: parsed.hookSub || "",
    slides: parsed.slides || [],
    caption: parsed.caption || "",
    hashtags: parsed.hashtags || [],
    cta: parsed.cta || "",
    ingredientFocus: parsed.ingredientFocus || "",
    imagePrompts,
  };
}

// ── API 핸들러 ───────────────────────────────────────────────────────────────

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  // Admin 인증
  const adminKey = env.ADMIN_KEY;
  if (!adminKey) return new Response(JSON.stringify({ error: "No admin key" }), { status: 500, headers: { "Content-Type": "application/json" } });

  const url = new URL(request.url);
  const cookies = request.headers.get("cookie") || "";
  const cookieMatch = cookies.match(/fonday-admin=([a-zA-Z0-9_\-]+)/);
  const keyParam = url.searchParams.get("key");
  let bodyKey: string | null = null;

  let parsedBody: any = {};
  if (request.method === "POST") {
    try {
      parsedBody = await request.json();
      bodyKey = parsedBody.key || null;
    } catch { /* ignore */ }
  }

  const isAuthed = (cookieMatch && cookieMatch[1] === adminKey) || keyParam === adminKey || bodyKey === adminKey;
  if (!isAuthed) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  await ensureTable(env.FONDAY_DB);

  // GET — 콘텐츠 목록 조회
  if (request.method === "GET") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30"), 100);
    const status = url.searchParams.get("status") || "";

    let query = "SELECT * FROM insta_content";
    const binds: any[] = [];

    if (status) {
      query += " WHERE status = ?";
      binds.push(status);
    }
    query += " ORDER BY scheduled_date DESC, scheduled_time ASC LIMIT ?";
    binds.push(limit);

    const stmt = env.FONDAY_DB.prepare(query);
    const { results } = binds.length === 1
      ? await stmt.bind(binds[0]).all()
      : await stmt.bind(...binds).all();

    return new Response(JSON.stringify({ contents: results || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST — 콘텐츠 생성
  if (request.method === "POST") {
    try {
      const body = parsedBody as {
        key?: string;
        date?: string;    // "2026-04-08" (기본: 오늘)
        count?: number;   // 생성할 개수 (기본: 2)
      };

      // 날짜 기본값: 오늘 (KST)
      const now = new Date();
      const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const dateStr = body.date || kst.toISOString().split("T")[0];

      // 요일 계산 (0=일, 1=월, ...)
      const targetDate = new Date(dateStr + "T00:00:00Z");
      const dayOfWeek = targetDate.getUTCDay(); // 0=Sun, 1=Mon, ...
      const scheduleIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=월, 6=일
      const schedule = WEEKLY_SCHEDULE[scheduleIdx];

      const count = Math.min(body.count || 2, 4);
      const generated: any[] = [];

      // 오전 콘텐츠 (캐러셀)
      if (count >= 1) {
        const morning = await generateContent(env, schedule.morning, "carousel", dateStr, "07:00");
        await env.FONDAY_DB.prepare(`
          INSERT INTO insta_content (pillar, format, hook, hook_sub, slides, caption, hashtags, cta, ingredient_focus, image_prompts, scheduled_date, scheduled_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          morning.pillar, morning.format, morning.hook, morning.hookSub || "",
          JSON.stringify(morning.slides), morning.caption,
          JSON.stringify(morning.hashtags), morning.cta,
          morning.ingredientFocus || "", JSON.stringify(morning.imagePrompts || []), dateStr, "07:00",
        ).run();
        generated.push({ time: "07:00", pillar: morning.pillar, format: morning.format, hook: morning.hook, ingredientFocus: morning.ingredientFocus });
      }

      // 저녁 콘텐츠 (릴스 스크립트)
      if (count >= 2) {
        const evening = await generateContent(env, schedule.evening, "reels-script", dateStr, "20:00");
        await env.FONDAY_DB.prepare(`
          INSERT INTO insta_content (pillar, format, hook, hook_sub, slides, caption, hashtags, cta, ingredient_focus, image_prompts, scheduled_date, scheduled_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          evening.pillar, evening.format, evening.hook, evening.hookSub || "",
          JSON.stringify(evening.slides), evening.caption,
          JSON.stringify(evening.hashtags), evening.cta,
          evening.ingredientFocus || "", JSON.stringify(evening.imagePrompts || []), dateStr, "20:00",
        ).run();
        generated.push({ time: "20:00", pillar: evening.pillar, format: evening.format, hook: evening.hook, ingredientFocus: evening.ingredientFocus });
      }

      return new Response(JSON.stringify({ ok: true, date: dateStr, generated }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("insta-content generation error:", err);
      const detail = err?.message ?? String(err);
      const stack = err?.stack?.split("\n").slice(0, 3).join(" | ") ?? "";
      return new Response(JSON.stringify({ error: "Generation failed", detail, stack }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  // DELETE — 전체 삭제
  if (request.method === "DELETE") {
    try {
      await env.FONDAY_DB.prepare("DELETE FROM insta_content").run();
      return new Response(JSON.stringify({ ok: true, message: "All content deleted" }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
