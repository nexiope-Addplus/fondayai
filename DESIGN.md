# Design System — Fonday

## Product Context
- **What this is:** AI 기반 피부 분석 앱 — 셀카 한 장으로 Skin MBTI 16타입 진단, 맞춤 루틴 추천, 피부 변화 추적
- **Who it's for:** 피부 관리에 관심 있는 일반 소비자 (한국/일본/영어권)
- **Space/industry:** 뷰티테크 / 스킨케어 / 헬스테크
- **Project type:** 모바일 우선 PWA (앱 UI)
- **Reference sites:** Typology, 화해, Oura Ring, Bear App, Gentler Streak
- **Target feel:** "Sophisticated Softness" — 세련되지만 부드러운, 신뢰감+따뜻함

## Aesthetic Direction
- **Direction:** Warm Minimal
- **Mood:** 조용한 자신감. 따뜻하지만 절제된. 전문적이되 친근한 스킨케어 파트너.
- **핵심 원칙:**
  - 카드는 최소한으로 — 탭 가능한 인터랙션이 있을 때만 사용
  - 섹션 구분은 여백 + 구분선 + 타이포 계층으로
  - 색상은 정보를 전달할 때만 (장식용 파스텔 금지)
  - 앱 내부에서 "AI" 텍스트 사용 안 함 (마케팅/공유용만)

## Brand
- **로고:** Fonday° (SVG, client/public/fonday-logo.svg)
- **로고 적용:** 홈 화면 헤더 + 결과 화면 헤더
- **로고 미적용:** Routine/Diary/MY 탭 (기능 제목 + 아이콘)

## Typography
- **탭 제목:** Pretendard ExtraBold (800) 22px — 색상 #4A403A
- **홈 헤드라인:** Pretendard ExtraBold (800) 26px — 색상 #4A403A
- **섹션 제목:** Pretendard Bold (700) 14-15px — 색상 #5C4F4A
- **본문:** Pretendard Regular (400) 13-14px — 색상 #8C8078
- **보조:** Pretendard Regular (400) 12px — 색상 #B0A898
- **포인트 숫자 (큰 점수):** Fraunces Normal (400) — OSNT, 56px 점수 등 영문/숫자만
- **FONT_HEADING:** constants.ts의 `FONT_HEADING` 사용
- **FONT_DISPLAY:** 영문/숫자 포인트에만 사용 (한글 제목에 사용 금지)

## Color

### 텍스트 색상 체계 (따뜻한 브라운)
| 역할 | 색상 | 용도 |
|------|------|------|
| 탭 제목 | #4A403A | ExtraBold 제목 |
| 헤드라인/강조 | #5C4F4A | 섹션 제목, 카드 제목 |
| 소제목/라벨 | #6B5D55 | 부제, 라벨, 아이템 이름 |
| 본문 | #8C8078 | 설명, 부가 정보 |
| 보조 | #B0A898 | 힌트, placeholder |

**금지:** #1C1917, #000000, text-stone-700, text-stone-800, text-stone-900, text-black

### 액센트 색상
| 역할 | 색상 | 용도 |
|------|------|------|
| Sage Green | #4A7C6E | 분석 UI (스캔라인, 점수, 데이터) |
| Salmon | #C97062 | 행동 유도 (메인 CTA, 선택 상태) |

### 배경
- **페이지:** `#FFFFFF` — 순백 (프로 뷰티앱 표준)
- **카드:** #FFFFFF + `boxShadow: 0 2px 12px rgba(0,0,0,0.08)` — 강한 깊이감
- **서브 영역:** BG_MUTED (#F5F5F5) — 카드 안에서 구분
- **기능적 배경:** TINT_GREEN (#EDF5F2), TINT_WARM (#FDF4F1) — "좋다/나쁘다/주의" 전달 시에만

### 3단계 깊이
```
배경 (#FFFFFF 순백) ← 가장 뒤
  └─ 카드 (#FFFFFF + shadow) ← 떠 있는 느낌
       └─ 서브 요소 (BG_MUTED) ← 카드 안에서 구분
```

## 버튼 스타일

### 메인 CTA (핵심 행동 1개)
- 단색 Salmon (#C97062) pill
- height 52-56px, borderRadius 26-28px
- boxShadow: 0 2px 12px rgba(201,112,98,0.2)
- 용도: 홈 스캔 시작, 설문 분석 시작, 성적표 보기

### 보조 버튼 (배민 스타일)
- 연한 배경 + 동일색 테두리 pill
- Sage Green: `background: rgba(74,124,110,0.06)` + `border: 1.5px solid rgba(74,124,110,0.18)`
- Salmon: `background: rgba(201,112,98,0.06)` + `border: 1.5px solid rgba(201,112,98,0.18)`
- 용도: 공유, 챌린지, 일기 열기, 화장품 추가

### 선택 버튼 (설문)
- 선택: Salmon 단색 (#C97062) + 흰색 텍스트
- 미선택: #FFFFFF + `boxShadow: 0 1px 4px rgba(0,0,0,0.05)`

## 카드 사용 규칙
- **카드 사용:** 탭해서 뭔가 열리는 아이템, 독립적 기능 블록 (알림 설정 등)
- **카드 미사용:** 정보 표시, 리스트 아이템, 섹션 구분
- **섹션 구분:** `borderTop: 1px solid #EBE8E4` + `pt-5 mt-5` + 볼드 제목

## 탭 헤더 패턴
```
[아이콘 circle] 제목 (ExtraBold 22px)
               부제 (Regular 13px, indent 42px)
```
- Routine: 💧 Droplets (TINT_GREEN)
- Diary: 📖 BookOpen (TINT_WARM)
- MY: 👤 User (TINT_WARM)

## Layout
- **좌우 패딩:** px-4 (16px)
- **섹션 간격:** mb-8 (32px) — 모바일 기준
- **Max content width:** 480px
- **Border radius:** pill(full), 카드(20px), 서브(16px), 아이템(12px)

## Motion
- **Approach:** Minimal-functional
- **Required:** `useReducedMotion()` 적용 필수
- **Forbidden:** `transition: all`, layout property 애니메이션

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | 초기 디자인 시스템 생성 | /design-consultation — 뷰티테크 리서치 기반 |
| 2026-03-24 | Sage Green #4A7C6E 선택 | Forest보다 밝고 미니멀 방향에 어울림 |
| 2026-03-25 | CTA: Sage Green→Salmon | 따뜻한 배경에 차가운 녹색 CTA는 어색. Salmon이 초대하는 느낌 |
| 2026-03-25 | 텍스트: 검정→따뜻한 브라운 체계 | #1C1917은 베이지 배경에서 딱딱함. 5단계 브라운 계층 |
| 2026-03-25 | 헤드라인: Fraunces→Pretendard Bold | 한글에 세리프 어색. Fraunces는 영문/숫자 포인트만 |
| 2026-03-25 | 카드 최소화 | 카드 남발은 바이브코딩 패턴. 타이포+여백+구분선으로 대체 |
| 2026-03-25 | 배민 스타일 보조 버튼 | 연한 배경+테두리 pill이 단색보다 부드러움 |
| 2026-03-25 | 앱 내부 "AI" 텍스트 제거 | 2026년 AI는 당연한 것. 브랜드명만 사용 |
| 2026-03-25 | 로고 SVG 적용 | PNG→SVG 벡터. 태그라인 없는 Fonday° 버전 |

## 완료 (2026-03-25 두 번째 세션)
- [x] **디자인 토큰 통일** — SHADOW_CARD, RADIUS_CARD/SUB/ITEM, PAGE_GRADIENT, TEXT_HEADING/TITLE/LABEL
- [x] **화면별 레이아웃 재설계** — 전 화면 카드 최소화, 구분선+타이포 전환
- [x] **비로그인 정보구조** — 홈 CTA 한화면, 루틴/일기 가치 제안, MY 포인트 조건부
- [x] **로그인 정보구조** — 결과 헤더 5층 분리, 솔루션 축소, 루틴 컬렉션 4개 제한
- [x] **LINESeedKR 둥근 폰트** — CDN 로드, 전체 적용 (font-weight 100-900 커버)
- [x] **하단 네비바** — pill 활성 배경, 비활성 따뜻한 톤, BORDER_COLOR 구분선
- [x] **여백 리듬 통일** — 섹션간 mb-8, 섹션내 mb-4, 아이템간 gap-2
- [x] **결과 핵심 액션** — 헤더카드 아래 "오늘의 핵심" 배너 (아침/저녁 루틴)
- [x] **체크리스트 위치 재구성** — 결과에서 제거, 홈은 요약만, 루틴에서 체크
- [x] **AI 밀착케어 → 일기 탭 이동** — 솔루션에서 제거, 일기 리마인더 아래 통합
- [x] **디바이스 → MY 탭 이동** — 솔루션에서 제거, MY 유틸리티 카드 안에 compact
- [x] **아이콘 교체** — 루틴: History, 일기: NotebookPen, 솔루션: Lightbulb
- [x] **결과 섹션 제목 볼드화** — eyebrow 라벨 font-bold + #6B5D55
- [x] **퀘스트 순서/문구** — 루틴(행동) 최상단, 퀘스트(게이미피케이션) 하단
- [x] **스와이프 감도** — 결과/일기 탭 40px→80px
- [x] **결과 헤더카드** — 사진+점수 가로 배치, BG_MUTED 배경으로 여백 해소
- [x] **MY 탭 한화면** — 섹션 간격 축소, 디바이스 compact 통합

## 완료 (2026-03-26 세 번째 세션)
- [x] **배경색 순백** — 베이지 그라데이션 → #FFFFFF (프로 뷰티앱 표준)
- [x] **BG_MUTED 세이지** — #F5F5F5 → #F5F8F6 (건강한 느낌)
- [x] **카드 제거 → 구분선** — 11개 카드 래퍼 제거, borderTop 구분선 전환
- [x] **카드/플랫/틴트 규칙 통일** — 인터랙션=카드, 읽기전용=구분선, 강조=틴트
- [x] **숫자 폰트 통일** — Fraunces 제거, LINESeedKR 통일
- [x] **LINE 로그인** — #06C755 공식 색상 + 아이콘 통일 (7개 파일)
- [x] **아이콘 교체** — 루틴: History, 일기: NotebookPen (전체)
- [x] **공유카드 리뉴얼** — 순백 배경, 앱 palette 통일, Fonday° 로고, fondayai.com footer
- [x] **챌린지 공유 문구** — "내 피부 점수 X점 이길 수 있어? 🔥" (도발적/바이럴)
- [x] **EN/JA 번역 감수** — EN 35곳, JA 25곳 네이티브 톤 수정
- [x] **Vertex AI 전환** — Gemini API 한국 IP 차단 우회, 서비스 계정 인증

## 완료 (2026-03-27~31 네/다섯 번째 세션)

### 기능
- [x] **루틴 체크리스트 복원** + 완료 버튼 + 토스트 피드백
- [x] **MY 제휴 문의** + PartnershipModal
- [x] **MY 디바이스 상세** — 4가지 측정 + YouTube + 제품 페이지 iframe + 문의하기
- [x] **효과 분석 그룹화** — 동일 결과 제품 묶어서 표시
- [x] **알림 기본값 enabled: true**
- [x] **앱 추가 안드로이드/iOS 분기**

### 날씨/환경
- [x] **미세먼지(PM2.5/PM10) + UV** — Open-Meteo Air Quality API 연동
- [x] **날씨카드 4가지 지표** — 온도/습도/UV/PM 뱃지 (가운데 정렬, 색상 코딩)
- [x] **케어 브리핑 강화** — PM2.5+UV+피부취약점 조합 맞춤 인사이트
- [x] **날씨 그리팅 다양화** — 날씨별/시간대별 3가지 변형
- [x] **피부 연동 날씨팁** — 약한 메트릭 기반 개인화

### 번역 (i18n)
- [x] **하드코딩 한글 전면 번역** — result.title, todayFocus, routineComplete, DiaryReportTab 50키 등
- [x] **자동 언어 감지** — 브라우저 언어 기반 ko/ja/en

### OG/SEO
- [x] **OG 이미지** — 얼굴+스캔라인+Fonday 로고+CTA (1200x630)
- [x] **og:title** — "Fonday° — 셀카로 피부 MBTI 진단"
- [x] **og:description** — "30초면 끝! 16가지 피부 타입 진단 + 맞춤 화장품 추천"

### 버그/인프라
- [x] **스캔 저장 중복 방지** (useRef guard)
- [x] **이벤트 중복 방지** (sessionStorage)
- [x] **로그인 유저 추적** (credentials: include)
- [x] **관리자 누적 사용자 수** + 화장품 목록 쿼리 수정
- [x] **PWA appinstalled 트래킹**

## 미완료 / 다음 세션 TODO (후순위)
- [ ] **모달/시트 디자인** — 15개 모달 z-index/radius/backdrop 통일 (시각 변화 적음)
- [ ] **하드코딩 색상 → 상수** — 60곳+ (시각 변화 없음, 유지보수용)
- [ ] **하드코딩 shadow → 상수** — 25곳 (시각 변화 없음)
- [ ] **접근성** — aria-label 보강
- [ ] **반응형** — 태블릿/데스크톱 레이아웃 확인
- [ ] **다크 모드** — 미적용
- [ ] **빈 상태 비주얼** — SVG 일러스트
- [ ] **커스텀 아이콘/일러스트** — 프로 앱 수준 도달에 필요
