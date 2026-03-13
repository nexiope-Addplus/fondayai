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
| 도메인 | GitHub → Cloudflare Pages 자동 배포 (main 브랜치) |

---

## 3. 핵심 파일 구조

```
/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── skin-scan.tsx        ★ 메인 UI (6000줄+, 전체 앱 UI)
│   │   │   └── battle.tsx           피부 챌린지 페이지
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
- **크론**:
  - `0 0 * * *` — KST 09:00 스캔 리마인더
  - `0 3 * * *` — KST 12:00 점심 피부 팁
  - `0 9 * * *` — KST 18:00 저녁 루틴 알림

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

### skin-scan.tsx 규모
- **6000줄 이상**의 단일 파일 — 전체 앱 UI가 여기 있음
- 컴포넌트 순서: 유틸함수 → 작은 컴포넌트 → 큰 컴포넌트(MyScreen, ResultScreen, SkinScanPage 순)
- 수정 전 반드시 해당 섹션 주변 코드를 먼저 읽을 것
- 최근 변경이 결과 화면(ResultScreen)에 많이 몰려 있으므로, 상단 요약/미션 허브/루틴 카드/모달 구조를 같이 읽고 수정하는 편이 안전합니다

### D1 테이블 마이그레이션
- 코드로 자동 마이그레이션 없음 — Cloudflare D1 콘솔에서 수동 실행 필요
- `ALTER TABLE ... ADD COLUMN` 실패해도 무시 (이미 있는 경우)

---

## 11. TODO / 다음 작업

### 즉시 필요
- [ ] 기존에 `both` 로 저장된 화장품 데이터를 카테고리 기반 기본 시간대로 정리할지 결정
- [ ] 결과 화면 상단 카드에서 얼굴 crop을 실기기 기준으로 한 번 더 미세조정
- [ ] `오늘 목표`와 아침/저녁 루틴 카드의 정보 밀도를 더 줄일지 검토
- [ ] MyScreen 화장품 상세 시트에 성분 OCR/자동 추출까지 붙일지 결정 (현재는 수동 입력)
- [ ] D1 Console 테스트 크론 (`*/30 * * * *`) 삭제
- [ ] 공유 이미지 실기기 테스트 (WASM CDN 로드 확인)
- [ ] `server/auth.ts` 타입 선언 누락 정리 (`passport-google-oauth20`, `passport-kakao`, implicit any)

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

```bash
# 개발 후 배포
git add <파일들>
git commit -m "feat/fix/chore: 설명"
git push origin main
# → Cloudflare Pages 자동 빌드 & 배포 (약 1~2분)
```

- **브랜치**: `main` 단일 브랜치 운영
- **커밋 컨벤션**: `feat:` / `fix:` / `chore:` / `refactor:`
- client + server + functions 변경은 **같은 커밋**에 포함

---

## 13. 최근 커밋 히스토리 (주요)

| 커밋 | 내용 |
|------|------|
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
