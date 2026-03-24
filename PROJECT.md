# Fonday AI — 프로젝트 컨텍스트

> 이 파일은 Claude, Gemini, Codex 등 어떤 AI 도구에서든 작업을 이어갈 수 있도록 프로젝트 전체 맥락을 담은 문서입니다.
> 새 세션을 시작할 때 반드시 이 파일을 먼저 읽어주세요.

---

## 1. 프로젝트 목적

**Fonday**는 셀카 한 장으로 AI가 피부를 분석해주는 모바일 웹 앱입니다.

- **핵심 가치**: "완전 개인 피부 관리 비서" — 아침 스캔부터 저녁 루틴까지 밀착 케어
- **수익 모델**: Fonday 전용 하드웨어 디바이스 판매 유도 (하단 중앙 버튼 → fonday.replit.app)
- **타겟**: 피부 관리에 관심 있는 한국/일본/영어권 20~40대 여성
- **기술적 차별점**: Baumann Skin Type(의학적 피부 분류) 기반 16가지 타입 진단 ("피부 MBTI")

---

## 2. 기술 스택

### 클라이언트
| 항목 | 기술 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 스타일링 | Tailwind CSS |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| i18n | react-i18next (EN/KO/JA) |
| 아이콘 | lucide-react |
| UI 컴포넌트 | shadcn/ui |

### 서버 (로컬 개발 전용)
| 항목 | 기술 |
|------|------|
| 런타임 | Node.js + Express |
| 인증 | Passport.js (Kakao OAuth, Google OAuth) |
| DB 클라이언트 | `server/d1.ts` (Cloudflare D1 HTTP API) |

### AI
| 항목 | 기술 |
|------|------|
| 모델 | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| 용도 | 피부 분석, 화장품 사진 분류, 지능형 케어 브리핑 생성 |
| 패키지 | `@google/generative-ai` (서버), Fetch API (Cloudflare Functions) |

### 배포 (프로덕션)
| 항목 | 기술 |
|------|------|
| 플랫폼 | Cloudflare Pages |
| API | Cloudflare Pages Functions (`functions/` 폴더) |
| DB | Cloudflare D1 (SQLite) — `fonday-db` |
| KV | Cloudflare Workers KV — 스캔 히스토리, 푸시 구독 |
| Worker | Cloudflare Worker (`worker-api.js`) — 크론 푸시 발송 |
| 서비스 도메인 | `fondayai.com` / `www.fondayai.com` → main 브랜치 자동 배포 |
| 개발 확인 URL | `dev.fondayai.com` → dev 브랜치 고정 개발 도메인 (`dev.fondayai.pages.dev` alias 유지) |

---

## 3. 핵심 파일 구조

```
/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── skin-scan.tsx        ★ 메인 UI 진입점 (날씨 상태 중앙 관리 추가)
│   │   │   └── battle.tsx           피부 챌린지 페이지
│   │   ├── components/fonday/       ★ 분리된 컴포넌트 모음
│   │   │   ├── ResultScreen.tsx     결과 화면 진입점 (저장 시 기상 정보 포함)
│   │   │   ├── ResultHeaderCard.tsx 결과 상단 요약 카드
│   │   │   ├── ResultOverlayPopups.tsx 플로팅 팝업 (스트릭/미션/PWA/체크인/푸시)
│   │   │   ├── ResultModals.tsx     모든 바텀시트·모달 모음
│   │   │   ├── ResultRoutineTab.tsx 결과 루틴 탭 콘텐츠
│   │   │   ├── ResultSolutionTab.tsx 결과 솔루션 탭 콘텐츠
│   │   │   ├── ResultNutritionTab.tsx 결과 영양 탭 콘텐츠
│   │   │   ├── CosmeticsReportCard.tsx 화장품 성적표 모달
│   │   │   ├── useAICareSettings.ts AI 밀착케어 푸시 설정 훅
│   │   │   ├── PwaInstallPopup.tsx  PWA 설치 팝업
│   │   │   ├── RoutineUpdateSheet.tsx 루틴 업데이트 시트
│   │   │   ├── WaitlistModal.tsx    얼리버드 웨이트리스트 모달
│   │   │   ├── DiaryTab.tsx         피부 일기 탭 (calendar/timeline/report)
│   │   │   ├── DiaryReportTab.tsx   일기 리포트 탭 콘텐츠
│   │   │   ├── DiaryHelpers.tsx     일기 탭 내부 헬퍼 컴포넌트들
│   │   │   ├── MyScreen.tsx         마이 화면
│   │   │   ├── AttendanceCalendarModal.tsx 출석 달력 모달
│   │   │   ├── MyCosmeticsModal.tsx 내 화장품 목록 모달
│   │   │   ├── CosmeticsRegisterModal.tsx 화장품 등록 모달
│   │   │   ├── RoutineChecklist.tsx  루틴 체크리스트 (접기/펼치기, 성분 등급)
│   │   │   ├── ScanIdleScreen.tsx   스캔 대기 화면 (AI 케어 브리핑 카드 추가)
│   │   │   ├── ScanningScreen.tsx   분석 중 화면
│   │   │   ├── SurveyScreen.tsx     설문 화면
│   │   │   ├── MagazineTab.tsx      발견 탭 (안정성 강화 및 스타일 수정)
│   │   │   ├── ReportTab.tsx        리포트 탭
│   │   │   ├── BottomNav.tsx        하단 네비게이션
│   │   │   ├── CameraCapture.tsx    카메라 캡처
│   │   │   ├── FaceMeshOverlay.tsx  얼굴 메시 오버레이
│   │   │   ├── WeatherTipCard.tsx   날씨 팁 카드
│   │   │   ├── SkinPredictionCard.tsx 피부 예측 카드
│   │   │   ├── ResultDiaryCard.tsx  결과 일기 카드
│   │   │   ├── ResultLoginCard.tsx  결과 로그인 유도 카드
│   │   │   ├── ResultNutrientsSheet.tsx 영양 시트
│   │   │   ├── ResultImprovementsSheet.tsx 개선 시트
│   │   │   ├── ResultAnalysisSheet.tsx 분석 시트
│   │   │   ├── ResultCosmeticsGateSheet.tsx 화장품 게이트 시트
│   │   │   ├── ResultActionBar.tsx  결과 액션바
│   │   │   ├── ResultQuestSheet.tsx 퀘스트 시트
│   │   │   ├── PartnershipModal.tsx 제휴 모달
│   │   │   ├── CheckinSuccessSheet.tsx 출석 성공 시트
│   │   │   ├── PushPromptSheet.tsx  푸시 알림 유도 시트
│   │   │   ├── MissionCard.tsx      미션 카드
│   │   │   ├── types.ts             공용 타입 정의
│   │   │   ├── constants.ts         색상/상수 (임포트 이슈 방지용 로컬 상수화 병행)
│   │   │   └── utils.ts             공용 유틸 함수
│   │   ├── locales/
│   │   │   ├── ko/translation.json  ★ 한국어 번역
│   │   │   ├── en/translation.json  ★ 영어 번역
│   │   │   └── ja/translation.json  ★ 일본어 번역
│   │   ├── i18n.ts                  i18n 설정 (localStorage 'fonday_lang')
│   │   └── App.tsx                  라우팅 (/, /battle/:token)
│   └── public/
│       └── sw.js                    서비스 워커 (푸시 알림)
├── server/
│   ├── routes.ts                    ★ Express API (로컬 개발 전용)
│   ├── d1.ts                        D1 HTTP API 클라이언트
│   ├── auth.ts                      Passport OAuth 설정
│   └── storage.ts                   인메모리 스토리지 (폴백용)
├── functions/
│   ├── api/
│   │   ├── analyze-skin.ts          ★ POST /api/analyze-skin (Gemini 피부 분석)
│   │   ├── care-briefing.ts         ★ GET /api/care-briefing (지능형 케어 매니저)
│   │   ├── cosmetics/
│   │   │   ├── classify.ts          ★ POST /api/cosmetics/classify (Gemini Vision)
│   │   │   ├── index.ts             ★ GET/POST /api/cosmetics
│   │   │   └── [id].ts              ★ DELETE /api/cosmetics/:id
│   │   ├── scans.ts                 GET/POST /api/scans (기상 정보 저장 추가)
│   │   ├── ranking.ts               GET /api/ranking (대량 데이터 성능 최적화)
│   │   ├── challenge-token.ts       POST /api/challenge-token (비로그인 지원)
│   │   ├── diary.ts                 GET/POST /api/diary (피부 일기 서버 동기화)
│   │   ├── routine-log.ts          GET/POST /api/routine-log (날짜별 사용 화장품)
│   │   ├── push-subscribe.ts        POST /api/push-subscribe
│   │   ├── generate-share.ts        POST /api/generate-share (공유 이미지 생성)
│   │   ├── weather.ts               GET /api/weather
│   │   ├── user.ts                  GET /api/user
│   │   ├── logout.ts                POST /api/logout
│   │   ├── shared-scan.ts           GET /api/shared-scan/:token
│   │   └── admin/
│   │       └── stats.ts             POST /api/admin/stats (대시보드)
│   ├── _utils/
│   │   └── jwt.ts                   JWT 쿠키 인증 유틸
│   ├── auth/
│   │   ├── kakao.ts                 GET /auth/kakao
│   │   ├── kakao/callback.ts        GET /auth/kakao/callback
│   │   ├── google.ts                GET /auth/google
│   │   └── google/callback.ts       GET /auth/google/callback
│   └── battle/
│       └── [[route]].ts             동적 OG 태그 (카카오톡 미리보기)
├── shared/
│   └── schema.ts                    DB 스키마 타입 정의 (weather_info 필드 추가)
├── worker-api.js                    Cloudflare Worker (크론 푸시, 지능형 브리핑 통합)
├── wrangler.toml                    Worker 설정 (D1 바인딩 추가)
└── PROJECT.md                       ★ 이 파일
```

---

## 4. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (클라이언트 + Express 서버 동시)
npm run dev
# → 클라이언트: http://localhost:5173
# → 서버: http://localhost:5000

# 환경변수 (.env 파일)
GOOGLE_API_KEY=...          # Gemini API 키
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
JWT_SECRET=fonday-secret-key
CF_ACCOUNT_ID=...           # D1 로컬 테스트용
CF_D1_TOKEN=...             # D1 로컬 테스트용
```

---

## 5. Cloudflare 배포 환경

### Pages 프로젝트
- **이름**: fonday (또는 유사)
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `dist/public`
- **배포 브랜치**: `main` (GitHub push 시 자동 배포)

### Pages 환경변수 (Secrets)
```
GOOGLE_API_KEY          Gemini API 키
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
JWT_SECRET              fonday-secret-key
VAPID_PUBLIC_KEY        푸시 알림용
VAPID_PRIVATE_KEY
VAPID_SUBJECT           mailto:...
ADMIN_KEY               어드민 대시보드 접근키
CF_ACCOUNT_ID           D1 API 접근용 (server 측)
CF_D1_TOKEN             D1 API 접근용 (server 측)
```

### Pages 바인딩 (Bindings)
```
FONDAY_DB   → D1 Database: fonday-db (ID: 125366b1-198e-4cef-a3d7-167befda2c77)
PUSH_KV     → KV Namespace: PUSH_KV (ID: 9ef421f3bbbc4ba7a97f3a7cfb73fc8e)
SCANS_KV    → KV Namespace: FONDAY_SCANS
```

### D1 데이터베이스 스키마 (fonday-db)

```sql
-- 스캔 기록 (2026-03-23 weather_info 추가)
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  overall_score INTEGER DEFAULT 0,
  baumann_type TEXT DEFAULT '',
  skin_age INTEGER,
  ai_comment TEXT DEFAULT '',
  scores TEXT DEFAULT '[]',
  weather_info TEXT, -- 기상 정보 JSON (기온, 습도, AQI 등)
  share_token TEXT DEFAULT '',
  lang TEXT DEFAULT 'ko',
  is_guest INTEGER DEFAULT 1,
  user_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id);

-- 피부 일기
CREATE TABLE IF NOT EXISTS diary_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_str TEXT NOT NULL,
  memo TEXT DEFAULT '',
  todos TEXT DEFAULT '[]',
  cause_tags TEXT DEFAULT '[]',
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, date_str)
);

-- 루틴 로그 (날짜별 사용 화장품 체크)
CREATE TABLE IF NOT EXISTS routine_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_str TEXT NOT NULL,
  cosmetic_ids TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_logs_user_date ON routine_logs(user_id, date_str);

-- 화장품 루틴
CREATE TABLE IF NOT EXISTS cosmetics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT NOT NULL,
  time_of_day TEXT DEFAULT 'both',
  opened_at TEXT,
  status TEXT DEFAULT 'active',
  is_skincare_relevant INTEGER DEFAULT 1,
  image_thumbnail TEXT DEFAULT '',
  created_at TEXT NOT NULL
);
```

### Worker (worker-api.js)
- **이름**: fonday-push-worker (wrangler.toml 참조)
- **바인딩**: PUSH_KV, FONDAY_DB (fonday-db)
- **배포 방식**: `npx wrangler deploy` (수동 배포)
- **크론**:
  - `0 22 * * *` — KST 07:00 스캔 리마인더 + **지능형 케어 브리핑 (New)**
  - `0 1 * * *` — KST 10:00 UV 자외선 케어
  - `0 3 * * *` — KST 12:00 점심 식단 가이드
  - `0 6,9 * * *` — KST 15:00/18:00 수분 리마인더 + 저녁 식단 가이드
  - `0 11-14 * * *` — KST 20~23:00 루틴 체크 및 취침 전 케어

---

## 5-0. 최근 주요 업데이트 (2026-03-24 세션 3)

### 일기 리포트 프리미엄 리디자인 — "Fonday AI 어드바이저"
- **"상담실장"** → **"Fonday AI 어드바이저"** 전체 리네이밍 (ko/en/ja)
- 17개 섹션 구성의 프리미엄 컨설팅 리포트 (추후 유료화 대상)
- **신규 섹션**: 주간 등급(A+~D), 7일 트렌드 라인 차트, 이번주 vs 지난주 비교, 바우만 타입 계절 인사이트, 오늘의 실행 플랜(아침/저녁), 다음 스캔 추천 CTA
- **데이터 모델 확장** (utils.ts): `dailyTrend`, `scoreComparison`, `weeklyGrade`, `baumannSeasonInsight`, `dailyActionPlan`, `nextScanRecommendation` 추가

### 식사 메뉴 다양화
- `MEAL_TIPS`: 단일 메뉴 → 배열(3~4개)로 확장 (ko/en/ja 전부)
- O/D/S/P/W 각 타입별 점심 4개, 저녁 4개 로테이션
- 날짜+유저 seed 기반 매일 다른 메뉴 선택 + 이전 발송 중복 방지
- **Worker 수동 배포 필요**: `npx wrangler deploy`

### 로그인/번역 버그 수정
- OAuth 플로우에 `state` 파라미터로 언어 전달 → 로그인 후 언어 유지 (kakao/google/line)
- 공유 버튼 `${type}형 공유하기` 하드코딩 → `t("result.shareType")` 번역 키
- Google/LINE 로그인: `www.fondayai.com` 리디렉트 URI 등록 필요 (콘솔 설정)
- battle.tsx "친구"/"나" 하드코딩 → `t()` 처리
- ResultScreen/ReportTab 하드코딩 alert → `t()` 처리
- `common.error`, `common.timeout`, `common.shareFail`, `battle.linkCopied` 번역 키 추가

---

## 5-0-prev2. 이전 업데이트 (2026-03-24 세션 2)

### 가독성 개선
- Fraunces 폰트 `font-light`(300) → `font-normal`(400) 전체 18개 파일 일괄 변경
- 작은 uppercase 라벨 `font-medium`(500)으로 강화
- `text-[10px]` → `text-[11px]` WCAG 최소 크기 준수 (WeatherTipCard, ScanIdleScreen)
- 홈 헤더 "Fonday AI" 브랜드 강화 (`text-lg font-bold`), 언어 스위처 축소
- 소셜 카운트 텍스트 줄바꿈 방지 (`whitespace-nowrap`)

### 루틴 체크리스트 기능 (RoutineLogInput → RoutineChecklist)
- **기존**: 자유 텍스트 입력 → localStorage만 저장 → 아무 데도 활용 안 됨
- **변경**: 등록된 화장품 체크박스 → 서버 D1 저장 → 효과 추적 연동
- `/api/routine-log` API 신규 생성 (GET/POST, D1 `routine_logs` 테이블)
- `RoutineChecklist` 컴포넌트: 접기/펼치기, 성분 기반 등급(A~F) 표시
- Gemini `/api/cosmetics/grade` 연동: 바우만 타입 + 현재 점수 기반 호환도
- 비로그인 → 로그인 유도 / 미등록 → 화장품 등록 유도
- `buildCosmeticCorrelationSignals`에 routine-log 실사용 데이터 반영

### UX 흐름 전면 개선
- **홈 신규 유저**: 상단 스캔 CTA 버튼 즉시 노출
- **홈 리턴 유저**: 히어로+미리보기+3단계 숨김 → 대시보드화 (날씨→최근결과→루틴체크→효과보드→재스캔)
- **홈 루틴 위젯**: 스캔 없이도 매일 화장품 체크 가능 + 효과 보드 노출
- **결과화면**: 첫 스캔 시 "다음 스텝" 3단계 가이드 + 화장품 등록 후 루틴 탭 이동 유도
- **일기 탭**: 오늘 스캔 없으면 "스캔하지 않았어요" 유도 카드
- **AI 밀착케어** → "스킨케어 알림" 리네이밍 + OFF 버튼 CTA 강화
- **바텀 네비**: 루틴 아이콘 Droplets → Sparkles 변경
- **햅틱 피드백**: 체크 토글(light), 탭 전환(light), CTA(medium), 풀투리프레시(medium), 출석 성공(success 패턴)

### 신규 파일
- `client/src/components/fonday/RoutineChecklist.tsx` — 체크리스트 UI (접기/펼치기, 등급 표시)
- `functions/api/routine-log.ts` — 날짜별 사용 화장품 저장/조회 API

### 삭제된 파일
- `client/src/components/fonday/RoutineLogInput.tsx` — 자유 텍스트 입력 (RoutineChecklist로 대체)

---

## 5-0-prev. 이전 업데이트 (2026-03-24 세션 1)

### 디자인 시스템 수립 및 전체 적용

**DESIGN.md 생성** — 뷰티테크/스킨케어 리서치 기반 디자인 시스템 확립:
- **Aesthetic**: Minimal / Organic — 여백과 타이포그래피가 주역
- **Primary Color**: Sage Green `#4A7C6E` (기존 Forest Green `#2D5F4F`에서 변경)
- **Accent**: Salmon `#C97062` (유지)
- **Display Font**: Fraunces Light (300) — Google Fonts CDN
- **Body Font**: Pretendard (유지)
- **Spacing**: 8px base, spacious density
- **차별화**: 스킨케어 카테고리의 쿨톤(민트/티아) 대신 따뜻한 earth-tone + 세리프 디스플레이 폰트

**전체 코드베이스 적용 (33+ 파일):**
- `constants.ts`: `DEEP_GREEN` → `#4A7C6E`, 디자인 토큰 추가 (`BG_BASE`, `BG_MUTED`, `BORDER_COLOR`, `FONT_DISPLAY`, `TEXT_TERTIARY`)
- `index.html`: Fraunces 폰트 CDN 추가, `theme-color` 업데이트
- 모든 화면: box-shadow 기반 카드 → border 기반 전환 (미니멀)
- 점수/숫자: `font-bold/black` → Fraunces Light 300 (우아함)
- 배경색: 제각각 → `BG_BASE #FDFCFA` / `BG_MUTED #F8F7F5` 통일
- eyebrow 라벨: `FONT_DISPLAY` + `TEXT_TERTIARY` 통일
- 장식 제거: 그라디언트 헤더→단색, backdrop-blur 제거, CTA 그림자 애니메이션 제거
- 타이포 스케일: 메트릭 점수 24px Fraunces Light, 라벨 11px, Body 14px 통일
- 터치 영역: 언어 버튼/푸터 링크 44px 확대 (WCAG)
- 시맨틱 HTML: 스텝 섹션 `<p>` → `<h2>` 변경

### Ultra-MVP 기능 업데이트
- 루틴 로그 + 점수 delta + MBTI 공유 강화
- magazine 탭 참조 제거로 빈 화면 수정
- idle 화면 카피 포지셔닝 변경 (MBTI 진단 → 화장품 추천 → 효과 추적)

---

## 5-1. 이전 주요 업데이트 (2026-03-23 기준)

### A. 피드 탭 전면 리디자인 (순위 PRIMARY)
- `MagazineTab.tsx` 구조 변경: **피부 점수 순위 데이터가 최상단 PRIMARY**, 매거진 아티클은 하단 secondary
  - **내 순위 카드**: 내 점수(44px 대형) + 상위 X% 뱃지를 다크 그린 카드로 강조 표시
  - **커뮤니티 통계 바**: 평균 점수 / 최고 점수 / 총 스캔 수 3열 표시 (라벨 truncate 처리)
  - **점수 분포 바 차트**: `scoreDistribution` 기반 시각화, 내 점수 구간을 주황색으로 강조 (◀ 마커)
  - **내 개선 포인트**: 최근 스캔의 하위 3개 점수 카드 표시
  - **Baumann 타입 분포**: 상위 4개 타입 수평 바 차트
  - 매거진 섹션은 구분선 이후 compact 리스트 (썸네일 64px, 텍스트 12px)
- `overflow-x-hidden` 추가 → 영어 전환 시 피드탭 오른쪽 밀림 현상 해결

### B. 영어 레이아웃 버그 수정
- `WeatherTipCard.tsx` — `MiniScoreBarIdle` 컴포넌트:
  - 라벨 `w-[74px] whitespace-nowrap text-xs` → `w-[80px] text-[10px] leading-snug break-words`
  - `items-center` → `items-start`로 2줄 라벨 정렬 맞춤
  - Idle 화면과 결과 화면 10개 점수 그래프에서 영어 라벨 겹침 해결
- `ScanIdleScreen.tsx` — 스캔 카운터 필:
  - `max-w-[52%]` → `max-w-[48%]`, `text-[11px]` → `text-[10px]`으로 영어 텍스트 overflow 해결
- `ScanIdleScreen.tsx` — heroBenefitsTitle 행:
  - `tracking-[0.14em]` → `tracking-[0.08em]`, `text-[10px]` + `truncate`로 영어 정렬 수정

### C. 매거진 다국어 번역 추가
- `constants.ts`: `MAGAZINE_ARTICLES_EN` (10개), `MAGAZINE_ARTICLES_JA` (10개) 추가
- `getMagazineArticles(lang: string)` 함수: 언어별 아티클 자동 선택

### D. 관리자 대시보드 (fondayai.com/admin)
- `functions/api/admin/stats.ts`: POST /api/admin/stats (ADMIN_KEY 인증)
  - 총 유저/스캔/게스트/다이어리/화장품 통계, 일별 스캔 트렌드, 바우만 분포
  - D1 초기화 마이그레이션 API 포함 (`d1-migrate`, `d1-migrate4`)
- ADMIN_KEY는 Cloudflare Pages Secrets에 저장

### E. AI 케어 설정 및 기타 버그 수정
- AI 밀착케어 ON/OFF 토글 → VAPID 키를 서버 `/api/vapid-key` 엔드포인트에서 fetch하도록 수정 (hardcode 제거)
- `ResultDiaryCard.tsx`: 총 스캔 횟수 `fonday_total_scans` localStorage 기반으로 정확히 업데이트
- `ResultScreen.tsx`: 스캔 저장 시 `fonday_total_scans` increment
- Preview 환경(dev.fondayai.com)에 VAPID 키 설정 완료

### F. 능동적 케어 매니저 (Care Manager) 도입 (이전 세션)
- **환경-피부 상관관계 인프라**:
  - `shared/schema.ts`: `scans` 테이블에 `weather_info` 필드 추가
  - `api/scans.ts`: 스캔 시점의 기온, 습도, AQI를 영구 저장
- **지능형 분석 엔진 (`api/care-briefing.ts`)**:
  - 실시간 날씨와 유저의 최근 취약 지표를 결합하여 Gemini 기반 맞춤 조언 생성
- **Home 화면**: `ScanIdleScreen.tsx` 최상단에 AI Care Briefing 카드 배치
- `worker-api.js`: 매일 아침 7시 Gemini 맞춤 푸시 + 8종 알림 시나리오 통합

---

## 6. 인증 시스템

- **방식**: OAuth (Kakao, Google, LINE) → JWT 쿠키
- **JWT**: `functions/_utils/jwt.ts`의 `getUserFromCookie(request, env.JWT_SECRET)` 로 검증
- **LINE LIFF**: LINE 브라우저 내 자동 로그인 통합 완료

---

## 7. 구현된 주요 기능

### 피부 분석 & Care Manager
- Gemini 2.0 Flash 기반 10개 점수 항목 분석
- **Care Briefing**: 날씨 위협 요소와 피부 약점을 연결한 능동적 조언 (홈 화면 + 푸시)
- 기상 정보 동시 저장: 분석 기록과 당시 환경 데이터(온도/습도 등) 연동 저장

### 화장품 관리 (Cosmetics)
- 사진 촬영을 통한 자동 분류 (Gemini Vision)
- **화장품 성적표**: 바우만 타입별 제품 등급(A~F) 및 성분 궁합 분석
- AI 루틴 최적화: 성분 충돌 감지 및 바르는 순서 가이드

### 푸시 알림 (Intelligent Notifications)
- 하루 8회 밀착 케어: 스캔/날씨브리핑/UV/점심/수분/저녁/루틴/취침
- 유저별 취약 지표 기반의 개인화된 알림 메시지 생성

---

## 11. TODO / 다음 작업

### 우선순위 작업
- [ ] **화장품 효과 알람**: 등록 3/7/14일 후 효과 추적 푸시 알림
- [ ] **Worker 배포**: `npx wrangler deploy` (식사 메뉴 다양화 반영)
- [ ] **ResultScreen 리팩토링**: 1100줄+ → 레이아웃/상태훅/섹션 컴포넌트 분리
- [ ] **포인트 활용처**: 출석 포인트 → 기능 언락 (상세 리포트 등) — 사용처 기획 완료 후
- [ ] **주간 리포트 푸시**: "이번 주 피부 점수 +3점, 가장 효과 좋은 제품: OOO"
- [ ] **성분 분석 강화**: OCR 전성분 자동 추출 + 유해 성분 체크
- [ ] **PWA 최적화**: 오프라인 체크리스트/일기 + 온라인 동기화
- [ ] **결제 시스템**: 일기 리포트 유료화 (Fonday AI 어드바이저 프리미엄)

### 리팩토링 예정
- [ ] `ResultScreen.tsx` 내 `useShareHandler`, `useQuestBoard`, `useRoutineTodos` 훅 추출 (코드 다이어트)
- [ ] `api/ranking.ts` 결과의 KV 캐싱 처리 (성능 최적화)

---

## 14. 최근 커밋 히스토리 (2026-03-24)

| 커밋 | 내용 |
|------|------|
| c57cc6d | fix(i18n): 나머지 하드코딩 한국어 alert 번역 처리 |
| 042937b | fix(i18n): 누락 번역 키 추가 + EN/JA 번역 개선 |
| a362988 | feat: 일기 리포트 프리미엄 리디자인 — Fonday AI 어드바이저 |
| 7cbb175 | feat: 식사 메뉴 다양화 — 피부 타입별 3~4개 로테이션 |
| cbee8bf | fix: 공유 버튼 번역 + OAuth 로그인 후 언어 유지 |
| 8782f71 | feat: 체크리스트 효과 표시를 성분 기반 등급으로 변경 |
| 212ddb9 | fix(ux): 홈 더보기 → 목록 펼치기로 변경 + 효과 표시 중복값 개선 |
| 9af79fd | feat(ux): 햅틱 피드백 추가 — 체크/네비/CTA/출석 |
| e9e4ab0 | feat(ux): 홈 대시보드화 — 리턴 유저 불필요 섹션 숨김 |
| 4fc5ad2 | feat(ux): RoutineChecklist 접기/펼치기 + 제품별 효과 표시 |
| 85679ad | feat(ux): 홈 간소화 + 루틴 탭 아이콘 개선 |
| 29610b6 | feat(ux): 비로그인 시 루틴 체크리스트에 로그인 유도 추가 |
| dc11279 | feat(ux): 홈 효과 보드 노출 |
| d8da564 | feat(ux): 홈에 루틴 체크 위젯 추가 |
| e24681b | feat(ux): 결과화면 다음 스텝 가이드 + 루틴 탭 연결 강화 |
| aa8c712 | feat(ux): 홈 상단에 스캔 CTA 버튼 추가 |
| 08840d3 | feat(ux): "AI 밀착케어" → "알림 설정" 리네이밍 |
| 1099399 | feat: 화장품 미등록 시 등록 유도 UI 추가 |
| c72e5f9 | feat(correlation): routine-log 데이터를 correlation signals에 연결 |
| 44bd003 | feat: ResultScreen에서 RoutineLogInput을 RoutineChecklist로 교체 |
| 5771983 | feat: RoutineChecklist 컴포넌트 추가 |
| e99a39d | feat(api): /api/routine-log 엔드포인트 추가 |
| 4e79548 | fix: 소셜 카운트 텍스트 줄바꿈 방지 + text-[10px] WCAG 위반 수정 |
| 4de86f9 | style: 전체 Fraunces 폰트 가독성 개선 (18개 파일) |
| 3f0b7f3 | style: 홈 헤더 브랜드 강화 + 언어 스위처 축소 |
| 930b2c4 | style: DiaryTab/MyScreen 타이포 스케일 통일 |
| 4c0af84 | style: ScanIdleScreen 타이포/정렬/여백 세밀 조정 |
| 1815de5 | style: 전체 화면 미니멀 리디자인 (5개 화면 shadow→border, FONT_DISPLAY) |
| f0d0f59 | style: ScanIdleScreen 미니멀 리디자인 + 디자인 토큰 추가 |
| 59c2061 | style: DESIGN.md 디자인 시스템 전체 적용 (Sage Green + Fraunces) |
| a960d56 | docs: DESIGN.md 생성 + CLAUDE.md 디자인 시스템 참조 추가 |
| 60f0d98 | style(design): 홈 스텝 섹션 시맨틱 h2 헤딩 추가 |
| 75e8665 | style(design): 푸터 링크 터치 영역 44px 확대 |
| 0b4a13e | style(design): 언어 전환 버튼 터치 영역 44px 확대 |
| 8cdbec4 | feat: 루틴 로그 + 점수 delta + MBTI 공유 강화 |
| 0f70d6d | fix: magazine 탭 참조 제거로 빈 화면 수정 |
| fd4dbf4 | fix(ui): 피드탭 리디자인 및 영어 레이아웃 버그 수정 (MagazineTab 순위 PRIMARY, MiniScoreBarIdle, socialCount, heroBenefitsTitle) |
| 1ba8bb6 | redesign(magazine): 매거진 탭 컴팩트 리디자인 (통계 한줄 바 + unified 아티클 리스트) |
| 39be8fa | feat(magazine): 영어/일본어 매거진 아티클 번역 추가 (constants.ts getMagazineArticles) |
| 3a8b717 | fix(ui): 매거진 순위/스캔횟수/idle헤더/말줄임 버그 수정 |
| bef2531 | feat(admin): 전체 데이터 초기화 기능 추가 (확인 텍스트 + 이중 확인) |
| ec7aeca | fix(admin): d1-migrate4 accept form-data and JSON |
| a349fb9 | fix(push): AI 케어 토글 수정 (VAPID 키 서버 엔드포인트 fetch) |
| 2c95054 | feat(admin): full analytics dashboard + event tracking |
| 2752ba6 | fix(care): 게스트 브리핑 노출 및 위치 권한 폴백(서울) 추가 |
| 8c42943 | feat(care): 능동적 AI 케어 매니저 브리핑 및 통합 푸시 시스템 구축 |
