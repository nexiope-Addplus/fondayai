# Design System — Fonday AI

## Product Context
- **What this is:** AI 기반 피부 분석 앱 — 셀카 한 장으로 Skin MBTI 16타입 진단, 맞춤 루틴 추천, 피부 변화 추적
- **Who it's for:** 피부 관리에 관심 있는 일반 소비자 (한국/일본/영어권)
- **Space/industry:** 뷰티테크 / 스킨케어 / 헬스테크
- **Project type:** 모바일 우선 PWA (앱 UI + 랜딩 혼합)
- **Reference sites:** Typology (typology.com), 화해 (hwahae.co.kr)

## Aesthetic Direction
- **Direction:** Minimal / Organic
- **Decoration level:** Minimal — 타이포그래피와 여백이 주역. 불필요한 배경색, 그라디언트, 텍스처 최소화.
- **Mood:** 조용한 자신감. 따뜻하지만 절제된. 전문적이되 친근한 스킨케어 파트너.
- **Differentiation:** 스킨케어 카테고리의 쿨톤(민트/티아/파란색) 대신 따뜻한 녹색+살몬으로 독자적 아이덴티티.

## Typography
- **Display/Hero:** Fraunces Light (300) — 가볍고 우아한 세리프. 점수, 제목, 브랜드 순간에 사용. 대부분 스킨케어 앱이 산세리프만 쓰는 가운데 차별화 포인트.
- **Body:** Pretendard — 한국어 렌더링 최적화. 본문, 설명, UI 텍스트 전반.
- **UI/Labels:** Pretendard Semibold (600) — 라벨, 배지, 네비게이션.
- **Data/Tables:** Pretendard (font-variant-numeric: tabular-nums) — 점수, 날짜, 수치 정렬.
- **Code:** JetBrains Mono (필요 시)
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400`
- **Scale:**
  - Display XL: 56px / Light 300 (Fraunces)
  - Display: 36px / Light 300 (Fraunces)
  - H1: 30px / Bold 700 (Pretendard)
  - H2: 20px / Bold 700 (Pretendard)
  - Body: 16px / Regular 400
  - Body Small: 14px / Regular 400
  - Caption: 13px / Semibold 600
  - Label: 12px / Semibold 600
  - Micro: 11px / Semibold 600 (최소 크기, 이 이하 사용 금지)

## Color
- **Approach:** Restrained — 색상을 아껴서 사용. 주 액센트 하나, 보조 액센트 하나, 나머지는 중립.
- **Primary (Sage Green):** #4A7C6E — 메인 CTA, 점수, 긍정적 지표. 자연+전문성.
- **Secondary (Salmon):** #C97062 — 보조 액센트, 브랜드 로고, 경고 전 주의 지표.
- **Neutrals (Warm Stone):**
  - Base: #FDFCFA (배경)
  - Muted: #F8F7F5 (섹션 배경)
  - Surface: #FFFFFF (카드, 입력)
  - Border: #EBE8E4
  - Text Primary: #1C1917
  - Text Secondary: #8C8078
  - Text Tertiary: #B0A898
- **Semantic:**
  - Success: #2D7D46 / bg #E8F5EC
  - Warning: #C2410C / bg #FFF7ED
  - Error: #DC2626 / bg #FEF2F2
  - Info: #3B82F4 / bg #EFF6FF
- **Dark mode:**
  - Base: #161412
  - Surface: #1E1B18
  - Muted: #242120
  - Border: #2E2A27
  - Primary text: #E7E5E4
  - Sage Green → #7DBFA8 (밝게 조정)
  - Salmon → #E0988A (밝게 조정)

## Spacing
- **Base unit:** 8px
- **Density:** Spacious — 여백이 자신감의 표현. 요소 간 충분한 호흡.
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Section gap:** 56px (섹션 간 넉넉한 간격)

## Layout
- **Approach:** Hybrid — 홈 랜딩은 자유로운 구성, 앱 탭들은 그리드 기반
- **Grid:** 1열 (모바일 기본), 태블릿 이상에서 max-width 제한
- **Max content width:** 480px (모바일 PWA 기준)
- **Border radius:**
  - sm: 4px (작은 뱃지)
  - md: 8px (입력 필드)
  - lg: 12px (버튼, 카드 내부)
  - xl: 16px (메트릭 카드)
  - 2xl: 24px (메인 카드)
  - 3xl: 28px (대형 카드, 모달)
  - full: 9999px (뱃지, 필)

## Motion
- **Approach:** Minimal-functional — 의미 있는 상태 전환만. 장식적 애니메이션 금지.
- **Easing:** enter(ease-out: 0.16,1,0.3,1) exit(ease-in: 0.7,0,0.84,0) move(ease-in-out: 0.45,0,0.55,1)
- **Duration:** micro(80ms) short(200ms) medium(350ms) long(500ms)
- **Required:** `useReducedMotion()` 적용 필수 (CLAUDE.md 규칙)
- **Forbidden:** `transition: all`, 레이아웃 프로퍼티(width/height/top/left) 애니메이션

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | 초기 디자인 시스템 생성 | /design-consultation — 뷰티테크 리서치 기반 |
| 2026-03-24 | Sage Green #4A7C6E 선택 | Forest #2D5F4F보다 밝고 미니멀 방향에 어울림 |
| 2026-03-24 | Fraunces Light 디스플레이 폰트 | 산세리프 일색인 카테고리에서 세리프로 차별화 |
| 2026-03-24 | Minimal aesthetic 확정 | Typology 스타일 절제 — 여백과 타이포그래피가 주역 |
