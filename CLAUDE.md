# CLAUDE.md — Fonday AI 작업 가이드

> Claude Code가 매 세션 자동으로 읽는 파일입니다.
> 프로젝트 전체 컨텍스트는 `PROJECT.md`를 참조하세요.

---

## 빠른 명령어

```bash
npm run dev      # 클라이언트(5173) + 서버(5000) 동시 실행
npm run build    # 빌드 (dist/public/ 출력) — 커밋 전 반드시 확인
```

빌드 성공 기준: `✓ built in X.XXs` 출력, error 없음.

---

## 기술 스택 요약

- **프레임워크**: React 18 + Vite + Tailwind CSS
- **애니메이션**: Framer Motion (`useReducedMotion` 반드시 사용)
- **아이콘**: lucide-react (이모지 아이콘 금지)
- **번역**: react-i18next — 모든 UI 텍스트는 `t("key")` 사용, 하드코딩 금지
- **배포**: Cloudflare Pages (main 브랜치 자동 배포) / dev 브랜치 → `dev.fondayai.com`

---

## 핵심 파일 위치

| 역할 | 경로 |
|------|------|
| 메인 UI 진입점 | `client/src/pages/skin-scan.tsx` |
| 컴포넌트 모음 | `client/src/components/fonday/` |
| 공용 타입 | `client/src/components/fonday/types.ts` |
| 공용 유틸 | `client/src/components/fonday/utils.ts` |
| 상수/색상 | `client/src/components/fonday/constants.ts` |
| 번역 파일 | `client/src/locales/{ko,en,ja}/translation.json` |
| Cloudflare Functions API | `functions/api/` |
| Cloudflare Worker (크론 푸시) | `worker-api.js` |

---

## 코드 컨벤션

### 타입

- `any` 신규 사용 금지. 공용 타입은 `types.ts`에서 import
- 주요 타입: `AppUser`, `ScanHistory`, `AICareSettings`, `CosmeticItem`, `StreakData`

### 유틸 재사용 (utils.ts에 이미 있는 것 — 중복 구현 금지)

- `isIOS()` — `/iPhone|iPad|iPod/i.test(navigator.userAgent)` 인라인 금지
- `isPWA()` — `matchMedia("(display-mode: standalone)")` 인라인 금지
- `todayStr()`, `getStreak()`, `getAttendance()` 등 localStorage 헬퍼 모두 utils.ts

### Z-index

`constants.ts`의 `Z` 객체 사용. 숫자 직접 입력 금지.

```ts
import { Z } from "./constants";
// Z.actionBar=50, Z.sheet=100, Z.modal=200, Z.pwa=210, Z.push=990, Z.overlay=999
```

### 텍스트 최소 크기

WCAG 기준: **`text-[11px]` 미만 금지** (`text-[10px]`, `text-[9px]` 등 사용 금지)

### 애니메이션 (prefers-reduced-motion)

모션을 사용하는 모든 컴포넌트에서 `useReducedMotion()` 적용 필수.

```tsx
const reducedMotion = useReducedMotion();
// animate prop: reducedMotion ? {} : { ... }
// className: `...${reducedMotion ? "" : " animate-pulse"}`
```

### 스크롤 이벤트 핸들러

sessionStorage/localStorage 쓰기가 있는 스크롤 핸들러는 throttle 필수 (300ms ticking 패턴).

```ts
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  setTimeout(() => { /* write */ ticking = false; }, 300);
};
```

---

## 보안 규칙 (절대 위반 금지)

1. **JWT_SECRET fallback 금지**: `env.JWT_SECRET || "fallback"` 패턴 사용 금지. 반드시 `env.JWT_SECRET!`
2. **debug/test 엔드포인트 인증 필수**: `/debug-*`, `/test-*` 경로는 반드시 `ADMIN_KEY` 검증
3. **lang 프롬프트 인젝션 방지**: Gemini 프롬프트에 삽입되는 외부 입력은 allowlist 검증
   ```ts
   const ALLOWED_LANGS = ["ko", "en", "ja"] as const;
   const lang = ALLOWED_LANGS.includes(rawLang) ? rawLang : "ko";
   ```
4. **admin 에러 응답에 stack trace 노출 금지**: `console.error`로 서버 로그, 클라이언트엔 generic 메시지만
5. **환경변수**: `.env` 파일 커밋 금지. `JWT_SECRET` 실제 값은 Cloudflare Pages Secrets에만 저장

---

## 브랜치 전략

- `dev` → 개발 작업 브랜치 (dev.fondayai.com)
- `main` → 프로덕션 자동 배포 (fondayai.com)
- 커밋 후 push는 사용자가 직접 결정 (자동 push 금지)

---

## 자주 하는 실수

- `cd /Users/sangwan/fondayai &&` 없이 `git add functions/` 실행 시 경로 오류 → 항상 절대경로 또는 워킹 디렉토리 확인
- `dist/` 파일은 빌드 결과물이므로 직접 편집 금지
- `PROJECT.md` 하단 `.env` 예시의 `JWT_SECRET=fonday-secret-key`는 문서 예시일 뿐 — 실제 코드에 이 값 하드코딩 금지
