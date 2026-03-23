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

## 5-1. 최근 주요 업데이트 (2026-03-23 기준)

### A. Discover 탭 재구성 및 안정화
- `MagazineTab.tsx`
  - 랭킹 요약 및 영양 요약 카드 통합
  - 데이터 파싱 방어 로직 강화 (NaN 체크, 비객체 데이터 필터링)
  - 비표준 Tailwind 클래스 수정 및 레이아웃 최적화
- `api/ranking.ts`
  - 대량 데이터 처리 시 스택 초과 방지를 위해 전개 연산자 제거 및 루프 방식 전환
  - KV 데이터 파싱 예외 처리 추가

### B. 능능적 케어 매니저 (Care Manager) 도입
- **환경-피부 상관관계 인프라**:
  - `shared/schema.ts`: `scans` 테이블에 `weather_info` 필드 추가
  - `api/scans.ts`: 스캔 시점의 기온, 습도, AQI를 영구 저장하도록 수정
- **지능형 분석 엔진 (`api/care-briefing.ts`)**:
  - 실시간 날씨와 유저의 최근 취약 지표를 결합하여 Gemini 기반 맞춤 조언 생성
  - 게스트 유저에게는 일반적인 기상 피부 팁 제공
- **Home 화면 UX 개선**:
  - `ScanIdleScreen.tsx`: 최상단에 **AI Care Briefing** 카드 배치
  - 위치 정보 권한 거부 시 서울 날씨로 자동 폴백(Fallback) 처리

### C. 지능형 푸시 알림 통합
- `worker-api.js` 고도화
  - 매일 아침 7시, 유저의 피부 약점과 기상을 결합한 Gemini 맞춤 푸시 발송
  - 8종의 알림 시나리오(스캔, UV, 식단, 수분, 루틴, 취침 등)를 `scheduled` 트리거로 통합 활성화
  - `wrangler.toml`에 D1 바인딩을 추가하여 Worker에서 직접 스캔 데이터 참조 가능하게 개선

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
- [ ] **사용자 경험 고도화**: 화장품 효과 신호(Correlation Signal)가 실제 기상 데이터와 연동되어 "추운 날 효과가 좋은 제품" 등의 통계 제공
- [ ] **성분 분석 강화**: 화장품 상세 시트에 OCR을 통한 전성분 자동 추출 및 유해 성분 체크 고도화
- [ ] **PWA 최적화**: 오프라인 모드에서의 기본적인 데이터 조회 및 스캔 큐잉 기능 점검
- [ ] **결제 시스템**: 로드맵 Phase 3에 따른 포트원/Stripe 연동 기초 설계

### 리팩토링 예정
- [ ] `ResultScreen.tsx` 내 `useShareHandler`, `useQuestBoard`, `useRoutineTodos` 훅 추출 (코드 다이어트)
- [ ] `api/ranking.ts` 결과의 KV 캐싱 처리 (성능 최적화)

---

## 14. 최근 커밋 히스토리 (2026-03-23)

| 커밋 | 내용 |
|------|------|
| 2752ba6 | fix(care): 게스트 브리핑 노출 및 위치 권한 폴백(서울) 추가 |
| 8c42943 | feat(care): 능동적 AI 케어 매니저 브리핑 및 통합 푸시 시스템 구축 |
| 6d69b3f | fix(feed): constants 임포트 오류 방지를 위해 SCAN_FROM 로컬 선언 |
| 77f707c | fix(feed): 랭킹 데이터 파싱 및 렌더링 안정성 강화 (NaN 체크 및 성능 최적화) |
| 7f5c567 | debug(feed): 런타임 에러 바운더리 추가 |
| 561aa81 | fix(result): 결과 화면 compact 3탭 구조 복원 |
