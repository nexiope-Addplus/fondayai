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
- **페이지:** `linear-gradient(180deg, #FDFCFA 0%, #F8F5F1 50%, #FDFCFA 100%)`
- **카드:** #FFFFFF + `boxShadow: 0 1px 6px rgba(0,0,0,0.04)`
- **서브 영역:** BG_MUTED (#F8F7F5) — 카드 안에서 구분
- **기능적 배경:** TINT_GREEN, TINT_WARM — "좋다/나쁘다/주의" 전달 시에만

### 3단계 깊이
```
배경 (그라데이션 베이지) ← 가장 뒤
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

## 미완료 / 다음 세션 TODO
- [ ] **화면별 레이아웃 재설계** — CSS 패치가 아닌 근본적 구조 재설계 필요
- [ ] **모달/시트 화면** — CosmeticsRegister, Analysis 등 팝업 디자인 미적용
- [ ] **폰트** — LINESeedKR 재시도 또는 다른 둥근 한글 폰트 테스트
- [ ] **하단 네비바** — 아직 기존 스타일
- [ ] **홈 화면 리턴 유저** — One Big Number 디자인 실제 확인 필요
- [ ] **결과 화면 헤더카드 내부** — 아직 border 잔존 가능
- [ ] **설문 선택 버튼 디자인** — 현재 상태 실물 확인 필요
- [ ] **반응형** — 태블릿/데스크톱에서 레이아웃 확인
- [ ] **다크 모드** — 아직 미적용
