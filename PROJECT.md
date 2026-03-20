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
| 모델 | Google Gemini 2.5 Flash (`gemini-2.5-flash`) |
| 용도 | 피부 분석, 화장품 사진 분류 |
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
| 개발 도메인 | `fondayai.pages.dev` → dev 브랜치 자동 배포 |

---

## 3. 핵심 파일 구조

```
/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── skin-scan.tsx        ★ 메인 UI 진입점 (463줄 — 리팩토링 완료)
│   │   │   └── battle.tsx           피부 챌린지 페이지
│   │   ├── components/fonday/       ★ 분리된 컴포넌트 모음
│   │   │   ├── ResultScreen.tsx     결과 화면 진입점 (961줄)
│   │   │   ├── ResultHeaderCard.tsx 결과 상단 요약 카드
│   │   │   ├── ResultOverlayPopups.tsx 플로팅 팝업 (스트릭/미션/PWA/체크인/푸시)
│   │   │   ├── ResultModals.tsx     모든 바텀시트·모달 모음
│   │   │   ├── ResultRoutineTab.tsx 결과 루틴 탭 콘텐츠
│   │   │   ├── ResultSolutionTab.tsx 결과 솔루션 탭 콘텐츠
│   │   │   ├── ResultNutritionTab.tsx 결과 영양 탭 콘텐츠
│   │   │   ├── useAICareSettings.ts AI 밀착케어 푸시 설정 훅
│   │   │   ├── PwaInstallPopup.tsx  PWA 설치 팝업
│   │   │   ├── RoutineUpdateSheet.tsx 루틴 업데이트 시트
│   │   │   ├── WaitlistModal.tsx    얼리버드 웨이트리스트 모달
│   │   │   ├── DiaryTab.tsx         피부 일기 탭 (593줄)
│   │   │   ├── DiaryReportTab.tsx   일기 리포트 탭 콘텐츠 (619줄)
│   │   │   ├── DiaryHelpers.tsx     일기 탭 내부 헬퍼 컴포넌트들
│   │   │   │                        (InlineTodos, InlineMemo,
│   │   │   │                         DiaryRoutinePreviewCard,
│   │   │   │                         DiaryCalendarView,
│   │   │   │                         DiaryTimeline, DiaryFullView)
│   │   │   ├── MyScreen.tsx         마이 화면 (289줄)
│   │   │   ├── AttendanceCalendarModal.tsx 출석 달력 모달
│   │   │   ├── MyCosmeticsModal.tsx 내 화장품 목록 모달
│   │   │   ├── CosmeticsRegisterModal.tsx 화장품 등록 모달
│   │   │   ├── ScanIdleScreen.tsx   스캔 대기 화면
│   │   │   ├── ScanningScreen.tsx   분석 중 화면
│   │   │   ├── SurveyScreen.tsx     설문 화면
│   │   │   ├── MagazineTab.tsx      매거진 탭
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
│   │   │   ├── constants.ts         색상/상수
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
│   │   ├── cosmetics/
│   │   │   ├── classify.ts          ★ POST /api/cosmetics/classify (Gemini Vision)
│   │   │   ├── index.ts             ★ GET/POST /api/cosmetics
│   │   │   └── [id].ts              ★ DELETE /api/cosmetics/:id
│   │   ├── scans.ts                 GET/POST /api/scans
│   │   ├── ranking.ts               GET /api/ranking
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
│   └── schema.ts                    DB 스키마 타입 정의
├── worker-api.js                    Cloudflare Worker (크론 푸시)
├── wrangler.toml                    Worker 설정
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
- **출력 디렉토리**: `client/dist`
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
-- 스캔 기록
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  overall_score INTEGER DEFAULT 0,
  baumann_type TEXT DEFAULT '',
  skin_age INTEGER,
  ai_comment TEXT DEFAULT '',
  scores TEXT DEFAULT '[]',
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

> ⚠️ **D1 테이블은 자동 생성되지 않습니다.** Cloudflare 대시보드 → D1 → fonday-db → Console에서 위 SQL을 직접 실행해야 합니다.

### Worker (worker-api.js)
- **이름**: fonday-push-worker (wrangler.toml 참조)
- **바인딩**: PUSH_KV
- **배포 방식**: GitHub 자동배포 아님. `git push`로는 반영되지 않음. `npx wrangler deploy` 또는 Cloudflare 대시보드 수동 배포 필요
- **주의**: 현재 Codex 실행 환경에서는 `CLOUDFLARE_API_TOKEN` 미설정으로 `wrangler deploy` 실패함. 실제 배포 시 토큰 환경변수 필요
- **크론**:
  - `30 22 * * *` — KST 07:30 스캔 리마인더
  - `0 3 * * *` — KST 12:00 점심 식단 알림
  - `0 6 * * *` — KST 15:00 수분 리마인더
  - `0 9 * * *` — KST 18:00 저녁 식단 알림
  - `0 11-13 * * *` — KST 20:00/21:00/22:00 루틴 리마인더

---

## 5-1. 최근 주요 업데이트 (2026-03-16)

### A. 식단 추천 알림 다양화
- `worker-api.js`
  - 기존 바우만 타입 고정 메뉴 1개 구조를 변경
  - 최근 측정 결과의 낮은 점수(`scoreSummary`)를 기반으로 식단 보완 메뉴/팁을 조합
  - 같은 사용자에게 같은 메뉴 조합이 연속으로 가지 않도록 `mealHistory` 저장
- `functions/api/push-subscribe.ts`
  - 구독 데이터에 `scoreSummary` 병합 저장
- `client/src/pages/skin-scan.tsx`
  - 푸시 구독 시 최근 취약 점수 3개를 서버에 전송
  - 이미 구독 중이어도 새 스캔 결과가 나오면 서버 구독 메타데이터 재동기화

### B. 루틴 리마인더 동기화 보강
- 푸시 구독이 갱신될 때 `/api/diary-reminder` 도 다시 동기화하도록 수정
- 구독 재발급 후 루틴 리마인더가 서버 KV에서 끊기는 문제를 줄임

### C. 일기 리포트 탭 고도화
- `client/src/pages/skin-scan.tsx`
  - 리포트 탭을 단순 주간 잠금 카드에서 누적 분석형 화면으로 확장
  - 추가된 내용:
    - 전문가 코멘트형 누적 리포트
    - 우선 케어 과제 3개
    - 성분 중심 추천
    - 시술 방향 제안
    - 루틴/메모/원인 태그 시그널
    - 스파이더 그래프(현재 vs 누적 평균)
    - 성분 반응 추적
    - 시술 후 회복 가이드
    - 계절/환경 영향 해석
    - 트리거 상관관계
    - 향후 2주 회복 예측
- 아직 전용 `/report` 페이지로 분리하지는 않았고, 현재는 `DiaryTab` 내부 리포트 탭에서 확장된 상태

### D. AI 밀착케어 알림 체계 통합
- 목표: 흩어져 있던 스캔/식단/수분/루틴 알림을 `AI 밀착케어` 1개 설정으로 통합
- `client/src/pages/skin-scan.tsx`
  - 결과 페이지 기존 식단 푸시 버튼을 `AI 밀착케어` 카드로 교체
  - 설정 모델 `AICareSettings` 추가
  - 하위 옵션:
    - `scan`
    - `meal`
    - `hydration`
    - `routine`
  - 루틴 시간은 기존 다이어리 리마인더 UI에서 계속 조정하되, 내부적으로 AI 밀착케어 설정과 연동
- `functions/api/push-subscribe.ts`
  - 구독 데이터에 `careSettings` 저장
- `worker-api.js`
  - 스캔/식단/루틴 알림 전송 전에 `careSettings.enabled` 및 각 하위 옵션 확인
  - 새 `sendHydrationPushToAll()` 추가
- `wrangler.toml`
  - 수분 리마인더용 `0 6 * * *` (KST 15:00) 크론 추가

### E. 배포/운영 관련 현재 상태
- GitHub `main`에는 반영 완료
- 그러나 Cloudflare Worker `fonday-push-worker` 는 **자동 Git 배포가 아님**
- Cloudflare 대시보드에서 확인한 결과:
  - `Build > Git repository` 비어 있음
  - 즉 Worker는 수동 배포 필요
- `npx wrangler deploy` 시도했으나 현재 환경에서 실패
  - 이유: 비대화형 환경이라 `CLOUDFLARE_API_TOKEN` 필요
- 따라서 다음 AI/작업자는 아래 중 하나를 해야 함:
  - `export CLOUDFLARE_API_TOKEN=... && npx wrangler deploy`
  - 또는 Cloudflare 대시보드에서 수동 배포
- 배포 후 Cloudflare Worker의 `Trigger Events`에서 반드시 아래 크론 반영 여부 확인 필요:
  - `30 22 * * *`
  - `0 3 * * *`
  - `0 6 * * *`
  - `0 9 * * *`
  - `0 11-13 * * *`

### F. 디자인 시스템/결과 UX 2차 정리 (2026-03-19)
- 대상 파일: `client/src/pages/skin-scan.tsx`, `client/src/index.css`
- 최근 일련의 커밋으로 스캔/결과/일기/My 화면 전반의 시각 톤을 재정리함
- 큰 방향:
  - gradient/강한 배지/과한 그림자 남발을 줄이고 `white + tint + soft shadow` 문법으로 통일
  - 정보량을 줄이는 대신 `첫 화면에 필요한 정보`와 `펼쳐볼 정보`의 위계를 분리
  - 결과 화면 탭 전환을 슬라이드 기반으로 유지하면서 탭별 읽기 흐름을 더 명확히 정리

### G. Idle 화면 재배치
- `ScanIdleScreen`
  - 상단 최우선 정보가 다시 스캔 CTA/히어로가 되도록 재배치
  - `오늘 출석 완료`, `연속 출석`은 최상단 주인공 자리에서 빼고 히어로 아래 보조 정보 스트립으로 이동
  - 헤더 카피는 유지하되, 길어진 설명 때문에 CTA가 아래로 밀리는 문제를 완화
- 현재 의도:
  - 첫 인상은 “지금 스캔하라”
  - 출석/포인트는 보조 동기부여 요소

### H. 결과 화면 재정리
- `ResultScreen`
  - 상단 결과부는 너무 밋밋해졌던 정리 버전에서 일부 임팩트를 복원
  - 점수 3카드/요약 구조는 유지하되, `나의 피부 MBTI` 카드를 새 톤에 맞게 다시 정리
  - MBTI 카드는 화이트 카드 + tint 아이콘 + 낮은 강조 버튼 문법으로 통일
  - 종합점수 / 피부나이 / 순위 상단 카드는 여러 차례 미세조정함
    - 모바일에서 깨지던 레이아웃 수정
    - `종합점수 : ??점` 구조로 정리
    - 종합점수는 메인 카드, 피부나이/순위는 서브 카드 위계로 재정렬
    - 최종적으로 종합점수는 가운데 정렬, 라벨 타이포도 키워서 숫자와 밸런스를 맞춤
- 결과 하단 3탭:
  - `routine / solution / nutrition` 탭 이동은 슬라이드 유지
  - 탭 변경 시 해당 탭 콘텐츠 시작점으로 스크롤되도록 로직 반영
  - `solution`, `nutrition` 카드도 flat tint/white 기반으로 추가 정리
  - 마지막 폴리싱에서 두 탭의 섹션 헤더, 카드 패딩, 아이콘 박스, shadow 강도를 더 같은 시스템으로 맞춤
- `AI 피부 예측` 카드:
  - 기존 이모지 아이콘을 제거하고 Lucide 아이콘(`Bot`)으로 통일
  - CTA도 강한 gradient 대신 현재 결과 화면 톤에 맞는 화이트/보더 스타일로 조정
 - 결과 하단 고정 CTA:
   - 초기의 강한 강조 버튼 문법에서 벗어나, 화면 본문 카드 시스템과 어울리는 bordered button 톤으로 정리

### I. Diary 탭 / My 탭 구조 정리
- `DiaryTab`
  - `calendar / timeline / report / ranking` 내부 슬라이드 탭 구조 적용
  - 루트 탭 관점에서 중복되는 상단 백버튼은 제거
  - 상단 히어로/탭 바를 결과 탭과 비슷한 밀도의 카드 문법으로 통일
  - `report` 탭은 단순 분석 리포트에서 `피부과 상담실장 컨설팅` 흐름으로 확장
    - 상단 요약 카드: `이번 주 피부 컨설팅` + 핵심 한 줄 + 상태 배지
    - `핵심 관찰` / `원인 추정` / `컨설턴트 해석` / `이번 주 우선 과제` 구조 추가
    - `피해야 할 실수`, `유지 / 줄이기 / 추가`, `생활/영양 보완`, `마무리 코멘트` 추가
    - 스파이더 그래프는 유지하되, 메인 콘텐츠가 아니라 해석을 받쳐주는 보조 시각화로 배치
    - 추천 성분 처방 / 권장 시술 방향 / 시술 후 회복 가이드까지 같은 상담 문맥 안에서 읽히도록 정리
- `MyScreen`
  - 기존에는 새 디자인 톤이 거의 반영되지 않았음
  - 현재는 헤더, 프로필, 출석/설정/설치/매거진/디바이스 카드까지 `white + tint + soft shadow` 계열로 재정리
  - 루트 탭 구조라 상단 `홈/뒤로` 버튼은 제거
  - 마지막 폴리싱에서 `rounded-2xl + p-4 + soft shadow` 기준으로 카드 반경/패딩까지 통일

### J. UX 판단 기준 메모
- `idle` 최상단에 출석 상태를 강하게 두는 것은 메인 행동(스캔)을 흐릴 가능성이 큼
- `Diary`, `My`는 하단 탭이 이미 1차 내비게이션이므로 상단 백버튼은 대체로 불필요
- 다크모드는 장기적으로 고려 가능하지만, 현재 우선순위는 아님
  - 피부 사진/분석 결과 신뢰감은 기본적으로 라이트 모드에서 더 잘 살아남
  - 먼저 라이트 경험 완성도를 올리는 쪽이 우선

### K. 현재 남아 있는 기술 이슈
- 2026-03-20 기준 `npm run check` (tsc) 통과
- 이번 세션에서 정리된 항목:
  - `server/auth.ts`: `passport-google-oauth20`, `passport-kakao`, `passport-line-auth` 선언 누락 보강
  - `server/auth.ts`: Google/Kakao OAuth callback 파라미터 타입 보강
  - `server/routes.ts`: `Set` spread를 `Array.from(new Set(...))`로 변경해 TS2802 해소
- 현재 기준으로 별도 타입 오류는 재현되지 않음

### L. skin-scan 리팩토링 중간 복구 상태 (2026-03-19)
- 목적:
  - 거대한 `client/src/pages/skin-scan.tsx`를 `client/src/components/fonday/` 하위 모듈로 분리
- 생성된 리팩토링 파일:
  - `client/src/components/fonday/DiaryTab.tsx`
  - `client/src/components/fonday/MagazineTab.tsx`
  - `client/src/components/fonday/MyScreen.tsx`
  - `client/src/components/fonday/types.ts`
  - `client/src/components/fonday/constants.ts`
  - `client/src/components/fonday/utils.ts`
- 중간에 멈췄을 때 문제:
  - `DiaryTab.tsx`가 사실상 원본 내용을 복사만 한 상태라 import/공용 헬퍼 연결이 거의 없었음
  - `skin-scan.tsx`에서도 `ReportConcernKey`, `syncReminderToServer`가 빠진 채 참조되고 있었음
  - 그 결과 `npm run check`에서 `DiaryTab.tsx` 중심의 대량 `Cannot find name ...` 오류가 발생했음
- 이번 세션에서 복구한 내용:
  - `client/src/components/fonday/types.ts`
    - `ReportConcernKey` 추가
  - `client/src/components/fonday/utils.ts`
    - `buildDiaryReportModel` 공용화
    - `syncReminderToServer` 공용화
  - `client/src/components/fonday/DiaryTab.tsx`
    - React / i18n / framer-motion / recharts / shadcn / shared utils import 복구
    - `export function DiaryTab` 형태로 정리
    - 랭킹 배지 문구 렌더링 오류 수정
  - `client/src/pages/skin-scan.tsx`
    - 공용 `ReportConcernKey`, `syncReminderToServer` 다시 연결
- 현재 결과:
  - 리팩토링 때문에 새로 생겼던 `DiaryTab` 관련 타입 오류는 해소됨
  - 실제 다이어리 화면 렌더링도 이제 `client/src/components/fonday/DiaryTab.tsx`를 사용하도록 전환됨
  - 이후 baseline 타입 오류도 정리되어 `npm run check`가 통과하는 상태가 됨
- 이번 추가 진행:
  - `skin-scan.tsx` 안의 죽은 로컬 diary 구현은 1차 중복 제거 완료
  - 제거된 로컬 함수:
    - `InlineTodos`
    - `InlineMemo`
    - `DiaryRoutinePreviewCard`
    - `DiaryCalendarView`
    - `DiaryTimeline`
    - `DiaryFullView`
    - 로컬 `DiaryTab`
  - 현재 `skin-scan.tsx`는 실제로 추출된 `client/src/components/fonday/DiaryTab.tsx`만 사용함
  - `npm run check` 통과
  - `MagazineTab`, `MyScreen`, `AttendanceCalendarModal`, `CosmeticsRegisterModal`은 이미 추출 컴포넌트 기준으로 실제 사용 중이었고, `skin-scan.tsx` 안에 별도 로컬 중복 구현은 남아 있지 않음을 확인
  - diary 분리 이후 `skin-scan.tsx`에 남아 있던 미사용 diary helper import도 정리함
  - baseline 타입 오류 정리:
    - `client/src/pages/skin-scan.tsx`의 `Set` spread를 `Array.from(new Set(...))`로 변경
    - `server/routes.ts`의 `Set` spread를 `Array.from(new Set(...))`로 변경
    - `server/auth.ts`의 OAuth callback 파라미터 타입 보강
    - `server/passport-auth.d.ts` 추가로 passport 관련 외부 모듈 선언 보강
- 아직 남은 구조 작업:
  - 다음 단계는 `skin-scan.tsx` 자체를 더 작은 결과/스캔/공유/모달 단위로 나눌지 판단하는 것
  - 즉, 현재는 “Diary 분리 + 중복 제거 + My/Magazine 사용 전환 확인 + baseline 타입 정리”까지 끝났고, 다음 단계는 더 큰 화면 단위 분리 여부를 정하는 것
  - 결과 화면 분리 1차:
    - `client/src/components/fonday/SkinPredictionCard.tsx` 추출 완료
    - `skin-scan.tsx`는 해당 예측 카드를 import 해서 사용하도록 전환
    - 이어서 `client/src/components/fonday/ResultDiaryCard.tsx` 추출 완료
    - 결과 화면의 로그인된 `피부일기 요약 카드`는 이제 추출 컴포넌트로 사용
    - 이어서 `client/src/components/fonday/ResultLoginCard.tsx` 추출 완료
    - 결과 화면의 비로그인 유도 카드도 추출 컴포넌트로 사용
    - 이어서 `client/src/components/fonday/ResultNutrientsSheet.tsx` 추출 완료
    - 결과 화면의 `showNutrients` 바텀시트는 추출 컴포넌트로 사용
    - 이 시점 `skin-scan.tsx`는 약 4125줄 수준까지 축소

---

## 6. 인증 시스템

- **방식**: OAuth (Kakao, Google) → JWT 쿠키
- **JWT**: `functions/_utils/jwt.ts`의 `getUserFromCookie(request, env.JWT_SECRET)` 로 검증
- **로컬 개발**: Passport.js 세션 기반 (server/auth.ts)
- **프로덕션**: Cloudflare Functions에서 JWT 쿠키 직접 검증

```typescript
// Cloudflare Functions에서 인증 체크 패턴
const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");
if (!user) return new Response(JSON.stringify([]), { status: 401 });
// user.id, user.email, user.name 사용 가능
```

---

## 7. 구현된 주요 기능

### 핵심 플로우
1. **Idle 화면** → 카메라 촬영 → 설문 (30초) → AI 분석 → 결과 화면
2. 결과 화면: 상단 요약 + 오늘 목표 + 루틴 카드 + 2탭 (솔루션 | 영양) + 하단 고정 액션바

### 피부 분석
- Gemini 2.5 Flash Vision → 10개 점수 항목 (0~100)
- **바우만 타입** 4축 계산: O/D(수분), S/R(민감도), P/N(색소), W/T(탄력)
- 핫스팟(red dot) overlay는 한때 실험했지만, 설명 부족으로 현재 제거됨
- 피부 나이 추정
- 14일 후 피부 예측 (good/bad 시나리오)

### 화장품 카메라 스캔
- 제품 전면 촬영 → Gemini Vision → 이름/브랜드/카테고리 자동 추출
- 썸네일(300px JPEG) D1 저장
- 전성분 텍스트를 수동 입력해서 제품 상세 시트에서 확인 가능
- 등록 시 `am/pm/both`를 직접 받지 않고 카테고리 기준 기본 시간대로 자동 추천
- 결과 화면 사진 바로 아래 배너로 접근
- MyScreen에서 `내 루틴 요약 + 아침/저녁 루틴 보드 + 제품 컬렉션` 형태로 확인
- 제품 카드를 누르면 상세 시트에서 카테고리/사용 시간/개봉일/성분 확인 및 삭제 가능

### 피부 일기 (DiaryTab)
- 로컬스토리지 + D1 서버 동기화 (write-through + server-wins)
- 달력 히트맵, 타임라인, 메모, 루틴 체크리스트, 원인 태그
- 주간 리포트 (7일 연속 스캔 시 잠금 해제)

### 스트릭/미션/출석
- localStorage 기반 (`fonday_streak`, `fonday_missions`, `fonday_attendance`)
- 연속 스캔 스트릭, 9개 미션, 출석 포인트 (하루 3pt)
- 결과 진입 시 자동 체크인

### 결과 화면 UX (2026-03-13 최신)
- 상단 요약은 `작은 얼굴 프레임 + 핵심 점수 4개 + 상세 분석 모달 버튼` 구조
- 종합 점수 / 피부 MBTI / 피부나이 / 백분위는 아래 카드형 요약 블록에서 유지
- `오늘 목표`는 진행판 역할만 맡고, 루틴 상세 내용은 반복 노출하지 않도록 축소
- 아침/저녁 루틴은 제품명 나열 대신 카테고리 순서(`토너 → 세럼 → 선크림`) 중심으로 표기
- 루틴 체크는 제품별 여러 개가 아니라 `아침 완료`, `저녁 완료` 1회 체크로 diary todo에 일괄 반영
- 하단 탭은 현재 `솔루션 / 영양` 2개만 사용하고, 전체 10개 점수는 `주요 분석결과` 모달에서 확인
- 핫스팟(red dot) 오버레이는 설명 부족 문제로 제거됨

### AI 응답 파싱 안정화
- `functions/api/analyze-skin.ts` 와 `server/routes.ts` 에 Gemini JSON 복구 파서 추가
- 코드블록, 스마트 따옴표, trailing comma, quote 없는 key 일부를 방어
- `functions/api/cosmetics/classify.ts` 에도 동일한 복구 파서 반영

### 랭킹/피부 챌린지
- D1 전체 스캔 데이터 기반 백분위 계산
- 챌린지 링크 공유 → `/battle/:token` 페이지에서 비교

### 공유 이미지
- Satori + Resvg WASM 서버사이드 생성 (5장 슬라이드)
- `functions/api/generate-share.ts`

### 푸시 알림
- Web Push API, VAPID 암호화, KV에 구독 저장
- iOS PWA / Android 지원

---

## 8. i18n 아키텍처

- **지원 언어**: KO (기본), EN, JA
- **언어 저장**: localStorage `fonday_lang`
- **번역 파일**: `client/src/locales/{ko,en,ja}/translation.json`
- **서버 프롬프트**: `buildPrompt(surveyData, lang)` — 언어별 AI 응답 언어 지정
- **점수 레이블**: 서버는 항상 한국어로 반환 → 클라이언트에서 `t('scores.0')` 등으로 표시

---

## 9. 색상/디자인 상수

```typescript
const DEEP_GREEN = "#2D5F4F";
const DEEP_GREEN_LIGHT = "#3D7A66";
const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";
```

- 배경: `#FAF9F6` (크림), `#FBF9F7`
- 카드 보더: `#F0EDE8`

---

## 10. 주요 패턴 & 주의사항

### ⚠️ 프로덕션 vs 로컬 API
- `server/routes.ts` — **로컬 개발 전용** (Express 서버)
- `functions/api/*.ts` — **프로덕션 실제 동작** (Cloudflare Pages Functions)
- 새 API 엔드포인트를 만들 때 **반드시 두 곳 모두** 구현해야 합니다
- 특히 Gemini JSON 파싱 보강처럼 분석/분류 로직을 수정할 때 `functions/api/*.ts` 와 `server/routes.ts` 를 같이 맞춰야 합니다

### Cloudflare Functions 패턴
```typescript
import { getUserFromCookie } from "../../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  // D1 접근: env.FONDAY_DB.prepare(sql).bind(...).run() / .all() / .first()
  // KV 접근: env.SCANS_KV.get(key) / env.PUSH_KV.put(key, value)
  // 인증: const user = await getUserFromCookie(request, env.JWT_SECRET)
};
```

### skin-scan.tsx 규모 (리팩토링 완료)
- **463줄** — `client/src/components/fonday/` 하위로 전체 분리 완료
- `skin-scan.tsx`는 이제 진입점 역할만 하며, 실제 화면 컴포넌트는 모두 `components/fonday/`에 있음
- 주요 화면별 파일:
  - **ResultScreen.tsx** (961줄): 결과 화면 상태 관리 + 레이아웃
  - **DiaryTab.tsx** (593줄): 피부 일기 탭 (달력/타임라인/리포트/랭킹)
  - **DiaryReportTab.tsx** (619줄): 일기 리포트 탭 콘텐츠
  - **DiaryHelpers.tsx** (754줄): 일기 탭 내부 서브 컴포넌트들
  - **MyScreen.tsx** (289줄): 마이 화면
- 수정 시 해당 컴포넌트 파일을 직접 편집할 것

### D1 테이블 마이그레이션
- 코드로 자동 마이그레이션 없음 — Cloudflare D1 콘솔에서 수동 실행 필요
- `ALTER TABLE ... ADD COLUMN` 실패해도 무시 (이미 있는 경우)

---

## 11. TODO / 다음 작업

### Refactor 진행 상태 (2026-03-20 완료)

#### 완료된 리팩토링 전체 요약

| 파일 | 리팩토링 전 | 리팩토링 후 |
|------|------------|------------|
| `skin-scan.tsx` | 6000+ 줄 | **463줄** |
| `ResultScreen.tsx` | (skin-scan 내부) | **961줄** |
| `DiaryTab.tsx` | (skin-scan 내부 → 1883줄) | **593줄** |
| `MyScreen.tsx` | (skin-scan 내부 → 924줄) | **289줄** |

#### Stage 1~2: skin-scan.tsx 1차 분리 (3766줄까지)
- `types.ts`, `constants.ts`, `utils.ts` 공통 모듈 생성
- `ScanIdleScreen`, `ScanningScreen`, `SurveyScreen`, `CameraCapture`, `BottomNav` 추출
- `MagazineTab`, `ReportTab` 추출
- `MyScreen`, `AttendanceCalendarModal`, `CosmeticsRegisterModal` 추출
- `SkinPredictionCard`, `ResultDiaryCard`, `ResultLoginCard` 추출
- `ResultNutrientsSheet`, `ResultImprovementsSheet`, `ResultAnalysisSheet` 추출
- `ResultCosmeticsGateSheet`, `ResultActionBar`, `ResultQuestSheet` 추출
- `PartnershipModal`, `CheckinSuccessSheet`, `PushPromptSheet`, `MissionCard` 추출

#### Stage 3: ResultScreen 추출 (skin-scan.tsx → 463줄)
- `ResultScreen.tsx` (1939줄)로 결과 화면 전체 분리

#### Stage 4: ResultScreen 내부 분리 (1939 → 1406줄)
- `ResultRoutineTab.tsx` — 루틴 탭 콘텐츠
- `ResultSolutionTab.tsx` — 솔루션 탭 콘텐츠
- `ResultNutritionTab.tsx` — 영양 탭 콘텐츠
- `PwaInstallPopup.tsx` — PWA 설치 팝업
- `RoutineUpdateSheet.tsx` — 루틴 업데이트 시트
- `WaitlistModal.tsx` — 얼리버드 모달

#### Stage 5: DiaryTab 내부 분리 (1883 → 1176줄)
- `DiaryHelpers.tsx` — InlineTodos, InlineMemo, DiaryRoutinePreviewCard, DiaryCalendarView, DiaryTimeline, DiaryFullView (6개 헬퍼)

#### Stage 6: MyScreen 분리 (924 → 289줄)
- `AttendanceCalendarModal.tsx` — 출석 달력 모달
- `MyCosmeticsModal.tsx` — 내 화장품 목록 모달
- `CosmeticsRegisterModal.tsx` — 화장품 등록 모달
- MyScreen.tsx에서 backward-compat re-export 유지

#### Stage 7: DiaryTab 2차 분리 (1176 → 593줄)
- `DiaryReportTab.tsx` (619줄) — 리포트 탭 전체 콘텐츠 + computed vars 추출

#### Stage 8: ResultScreen 2차 분리 (1406 → 961줄)
- `useAICareSettings.ts` (222줄) — AI 밀착케어 푸시 알림 상태 훅
- `ResultHeaderCard.tsx` (197줄) — 결과 상단 요약 카드 컴포넌트
- `ResultOverlayPopups.tsx` (112줄) — 플로팅 팝업들 (스트릭/미션/PWA/체크인/푸시)
- `ResultModals.tsx` (164줄) — 모든 바텀시트·모달 컴포넌트 집합
- `utils.ts` — `parseFoodOptions`, `pickFoodOption`, `dedupeFoods` 이동

#### 현재 상태 (2026-03-20)
- `npm run check` (tsc) **통과**
- 전체 `components/fonday/` 파일 수: 40개
- 주요 파일 줄수: `ResultScreen.tsx` 961줄, `DiaryTab.tsx` 593줄

#### 추가 진행 예정 (다음 세션)
아래 작업은 현 세션 사용량 부족으로 중단. 다음 세션에서 이어서 진행 가능.

1. **`useShareHandler` 훅 추출** (약 100줄 절감)
   - `handleShare` 함수 전체 (ResultScreen.tsx 내 lines ~605-706)
   - 의존: `analysisResult`, `rankingData`, `finalType`, `overallScore`, `avoidLunch`, `avoidDinner`, `t`, `i18n`
   - 반환: `{ handleShare, shareLoading }`

2. **`useQuestBoard` 훅 추출** (약 60줄 절감)
   - `questBoard`, `essentialQuests`, `questDoneCount`, `questProgressPct` 등 computed values
   - 의존: `missionState`, `routineComplete`, `todayHasMemo`, `overallScore`, `currentStreak`, `t`

3. **`useRoutineTodos` 훅 추출** (약 40줄 절감)
   - `getRoutineTodoState`, `isRoutinePeriodComplete`, `setRoutinePeriodCompletion`
   - 의존: `todayRoutineTodos`, `setTodayRoutineTodos`, `saveDiaryTodos`, `todayStr`

위 3개 모두 완료 시 ResultScreen.tsx 약 760줄 수준까지 감소 예상.

### 즉시 필요
- [ ] 기존에 `both` 로 저장된 화장품 데이터를 카테고리 기반 기본 시간대로 정리할지 결정
- [ ] 결과 화면 상단 카드에서 얼굴 crop을 실기기 기준으로 한 번 더 미세조정
- [ ] `오늘 목표`와 아침/저녁 루틴 카드의 정보 밀도를 더 줄일지 검토
- [ ] MyScreen 화장품 상세 시트에 성분 OCR/자동 추출까지 붙일지 결정 (현재는 수동 입력)
- [ ] Worker 실제 크론 스케줄과 `PROJECT.md` 문서 설명을 최종 기준으로 한 번 더 일치시킬 것
- [ ] 공유 이미지 실기기 테스트 (WASM CDN 로드 확인)

### Phase 2.5 — 아침 리포트 이메일 (다음 우선순위)
- Resend API 연동
- Worker 크론 KST 07:00
- 어제 스캔 결과 + 오늘 루틴 + 식단 팁 포함

### Phase 2 — 스마트 푸시 고도화
- 하루 5회: 아침스캔 / 정오자차 / 점심메뉴 / 저녁루틴 / 취침케어

### Phase 4 — 주간 리포트 개인화
- 스캔 히스토리 기반 트렌드 분석
- 화장품 사용 + 점수 변화 상관관계

---

## 12. Git / 배포 워크플로우

### 브랜치 구조 (2026-03-20 변경)
```
dev 브랜치   →  fondayai.pages.dev  (개발/테스트용)
main 브랜치  →  fondayai.com        (서비스용)
```

### 개발 플로우
```bash
# 1. 평소 작업은 dev 브랜치에서
git checkout dev
git add <파일들>
git commit -m "feat/fix/chore: 설명"
git push origin dev
# → fondayai.pages.dev 에 자동 배포 (약 1~2분)

# 2. 테스트 완료 후 서비스에 반영
git checkout main
git merge dev
git push origin main
# → fondayai.com 에 자동 배포 (약 1~2분)
git checkout dev  # 다시 dev로
```

- **커밋 컨벤션**: `feat:` / `fix:` / `chore:` / `refactor:`
- client + server + functions 변경은 **같은 커밋**에 포함
- Claude Code는 기본적으로 `dev` 브랜치에서 작업 후 요청 시 main에 merge

---

## 13. 주요 업데이트 (2026-03-20 — 도메인/배포 세팅)

### A. fondayai.com 도메인 등록 및 연결
- Cloudflare Registrar에서 `fondayai.com` 구매
- Cloudflare Pages `fondayai` 프로젝트에 `fondayai.com` / `www.fondayai.com` 커스텀 도메인 연결
- DNS CNAME 레코드 추가 (fondayai.pages.dev → fondayai.com)
- SSL 인증서 자동 발급 완료

### B. 개발/서비스 브랜치 분리
- `dev` 브랜치 생성 및 Cloudflare Pages Preview 브랜치로 지정
- `main` → 서비스 (`fondayai.com`), `dev` → 개발 (`fondayai.pages.dev`)

### C. OG 메타태그 도메인 교체
- `client/index.html`의 canonical, og:url, og:image, twitter:image, JSON-LD url
- `fondayai.pages.dev` → `fondayai.com` 으로 전부 교체

### D. 화장품 루틴 AI 최적화 (2026-03-20)
- `POST /api/cosmetics/optimize-routine` 엔드포인트 추가 (서버)
- Gemini 2.5 Flash로 성분 충돌 분석 (레티놀+AHA/BHA, 비타민C+레티놀 등)
- AM/PM 루틴을 바르는 순서(1번~)로 정렬 표시
- 충돌 성분 조합은 하단 경고 카드로 이유/해결방법 표시
- AI 분석 실패 또는 대기 중에는 카테고리 기반 정렬로 fallback

### E. 미완료 — OAuth 콘솔 업데이트 필요
아직 각 OAuth 콘솔에 `fondayai.com` 콜백 URL이 추가되지 않음. 로그인 기능 테스트 전 반드시 필요:
- Google Cloud Console → 승인된 리디렉션 URI에 `https://fondayai.com/auth/google/callback` 추가
- 카카오 디벨로퍼스 → 리디렉션 URI `https://fondayai.com/auth/kakao/callback` 추가
- (LINE 사용 시) LINE Developers → `https://fondayai.com/auth/line/callback` 추가

### F. 미완료 — JWT_SECRET 보안 강화 필요
- 현재 `functions/` 폴더 전체에 `"fonday-secret-key"` fallback 하드코딩됨
- Cloudflare Pages → Settings → Environment variables → Production 탭에 `JWT_SECRET=랜덤값` 설정 필요
- `SESSION_SECRET`도 동일하게 설정 필요

---

## 14. 최근 커밋 히스토리 (주요)

| 커밋 | 내용 |
|------|------|
| 5770ea0 | feat(report): Diary 리포트에 상담실장형 섹션(우선과제/원인추정/피해야할실수/루틴조정 등) 확장 |
| 7bc8f02 | refactor(report): Diary 리포트 탭을 상담 브리핑 흐름으로 재설계 |
| 704ad4c | docs: 3월 UI 최종 폴리싱 내용 PROJECT.md 반영 |
| c338636 | refactor(result): 결과 상단 종합점수/라벨 타이포 미세 조정 |
| d8cada7 | refactor(ui): 결과/솔루션/영양/My 화면 카드 시스템 최종 폴리싱 |
| 47c9ebb | refactor(result): 결과 상단 카드 정렬/간격 마감 조정 |
| a22c23c | refactor(result): 결과 상단 3카드 여백 축소 |
| 7d2550d | fix(result): 모바일에서 깨지던 상단 지표 카드 레이아웃 복원 |
| 61f1a7c | refactor(result): 종합점수 메인 카드, 피부나이/순위 서브 카드 구조로 재정렬 |
| cf2e4bf | docs: PROJECT.md에 3월 UI 리파인먼트 내역 정리 |
| 55d4af9 | refactor(ui): idle/My/MBTI 재정리 + 루트 탭 백버튼 제거 + AI 예측 아이콘 통일 |
| f0d18a6 | refactor(ui): 결과 3탭 톤/스크롤 동작 정렬 |
| 80c023e | refactor(ui): idle/결과 상단 임팩트 복원 + Diary 내부 슬라이드 탭 추가 |
| 1e6a897 | refactor(ui): scan/result 경험의 시각적 강도 정리 |
| 0c07009 | feat(cosmetics): 내 화장품 루틴 보드형 개편 + 성분 상세 시트/저장 추가 |
| b26991f | feat(diary): 피부일기 탭을 달력 중심 독립 페이지형으로 정리 |
| afa0913 | fix(diary): 달력 우선 배치 + 오늘 루틴 완료형 UI 정리 |
| 249a0e7 | fix(result): 결과 요약 카드 정렬 및 총포인트 통합 |
| dec3a48 | fix(result): 주요 분석결과 시트 상단에 피부 총평 먼저 노출 |
| 2296c26 | fix(result): MBTI 요약/루틴 액션 문구 정리 |
| 576701d | feat(result): 결과 화면 시각 위계 재정리 |
| b49879b | feat(result): 결과 화면 중복 축소 + 화장품 자동 시간대 추천 |
| fed963f | feat(result): 루틴 완료 체크를 아침/저녁 단위로 단순화 |
| 2767a8d | fix(result): 결과 사진 축소 + 중복 점수 패널 제거 |
| 9257c93 | fix(ai): Gemini JSON 파싱 복구 로직 추가 |
| a35a1bf | feat(result): compact summary and sync routine actions |
| 5577807 | feat(result): 오늘 목표 허브 + 루틴 코치 통합 |
| 8070560 | feat(cosmetics): routine coach / good combo / caution 추가 |
| cfe287c | feat(flow): diary API 프로덕션 동기화 + cosmetics insight 추가 |
| 44d3b0c | feat(idle): hero copy / mobile layout 정리 |
| ee03355 | docs: add PROJECT.md for cross-session AI context |
| 94ee36f | fix(ux): 사진 object-top, 용어 한국어화 |
| d520a73 | feat(functions): 화장품 Cloudflare Functions 3개 추가 |
