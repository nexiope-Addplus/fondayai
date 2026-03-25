# 루틴 체크리스트 (RoutineLogInput → 등록 화장품 체크 방식) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 결과화면의 "오늘 사용한 화장품" 영역을 자유 텍스트 입력에서, 등록된 화장품 목록 체크리스트로 교체. 체크된 데이터는 서버에 저장되어 효과 추적(correlation signals)에 활용.

**Architecture:** 기존 `RoutineLogInput`(텍스트 입력)을 `RoutineChecklist`(체크리스트)로 교체. 등록된 화장품(`myCosmetics`)을 아침/저녁으로 나누어 체크박스로 표시. 체크 데이터는 `/api/routine-log` 엔드포인트를 통해 서버 D1에 저장. `buildCosmeticCorrelationSignals()`가 이 데이터를 참조하도록 연결.

**Tech Stack:** React, Tailwind CSS, Cloudflare Functions (D1 SQLite), 기존 디자인 시스템

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/components/fonday/RoutineChecklist.tsx` | 체크리스트 UI 컴포넌트 |
| Create | `functions/api/routine-log.ts` | GET/POST API — 날짜별 사용 화장품 저장/조회 |
| Modify | `client/src/components/fonday/ResultScreen.tsx:831-838` | RoutineLogInput → RoutineChecklist 교체 |
| Modify | `client/src/components/fonday/utils.ts` (buildCosmeticCorrelationSignals) | routine-log 데이터를 correlation에 반영 |
| Delete | `client/src/components/fonday/RoutineLogInput.tsx` | 더 이상 사용하지 않음 |
| Modify | `client/src/locales/ko/translation.json` | 체크리스트 관련 번역 키 추가 |
| Modify | `client/src/locales/en/translation.json` | 영어 번역 |
| Modify | `client/src/locales/ja/translation.json` | 일본어 번역 |

---

### Task 1: API 엔드포인트 — `/api/routine-log`

**Files:**
- Create: `functions/api/routine-log.ts`

- [ ] **Step 1: D1 테이블 생성 SQL 확인**

`routine_logs` 테이블 스키마:
```sql
CREATE TABLE IF NOT EXISTS routine_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date_str TEXT NOT NULL,
  cosmetic_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_logs_user_date ON routine_logs(user_id, date_str);
```

- [ ] **Step 2: API 구현**

```typescript
// functions/api/routine-log.ts
// GET ?date=2026-03-24 → { cosmetic_ids: string[] }
// POST { date_str, cosmetic_ids } → upsert
```

핵심 로직:
- GET: `date` 쿼리 파라미터로 해당 날짜의 체크된 화장품 ID 배열 반환
- POST: `date_str` + `cosmetic_ids`(JSON 배열)를 upsert (같은 날짜면 UPDATE)
- 인증 필수 (기존 JWT 미들웨어 패턴 따르기 — `functions/api/scans.ts` 참고)

- [ ] **Step 3: 커밋**

```bash
git add functions/api/routine-log.ts
git commit -m "feat: /api/routine-log 엔드포인트 — 날짜별 사용 화장품 저장/조회"
```

---

### Task 2: RoutineChecklist UI 컴포넌트

**Files:**
- Create: `client/src/components/fonday/RoutineChecklist.tsx`

- [ ] **Step 1: 컴포넌트 구현**

Props:
```typescript
type RoutineChecklistProps = {
  cosmetics: CosmeticItem[];      // 등록된 전체 화장품 목록
  checkedIds: string[];            // 오늘 체크된 화장품 ID 배열
  onToggle: (id: string) => void;  // 체크 토글 콜백
  loading?: boolean;
};
```

UI 구조:
- 헤더: "오늘 사용한 화장품" (기존 스타일 유지)
- 화장품이 없으면: "루틴 탭에서 화장품을 등록하세요" + 루틴 탭 이동 안내
- 화장품이 있으면: 아침/저녁으로 그룹핑 → 각 제품에 체크박스
- 각 항목: 썸네일(있으면) + 제품명 + 카테고리 뱃지 + 체크 상태
- 체크 시 부드러운 색상 전환 (TINT_GREEN 배경)
- 디자인: 기존 카드 스타일 (rounded-3xl, BORDER_COLOR 테두리)

- [ ] **Step 2: 커밋**

```bash
git add client/src/components/fonday/RoutineChecklist.tsx
git commit -m "feat: RoutineChecklist 컴포넌트 — 등록 화장품 체크리스트 UI"
```

---

### Task 3: ResultScreen 연결 — RoutineLogInput 교체

**Files:**
- Modify: `client/src/components/fonday/ResultScreen.tsx:831-838`
- Delete: `client/src/components/fonday/RoutineLogInput.tsx`

- [ ] **Step 1: ResultScreen에서 RoutineLogInput → RoutineChecklist 교체**

변경 사항:
1. import 변경: `RoutineLogInput` → `RoutineChecklist`
2. `routineProducts` state(string[]) → `checkedCosmeticIds` state(string[])
3. 마운트 시 `GET /api/routine-log?date={todayStr()}` 호출하여 오늘 체크 상태 복원
4. 토글 시 `POST /api/routine-log` 호출하여 서버 저장
5. `myCosmetics`를 props로 전달 (이미 ResultScreen에서 fetch하고 있음)

기존 코드:
```tsx
<RoutineLogInput
  initialProducts={routineProducts}
  onSave={(products) => {
    setRoutineProducts(products);
    localStorage.setItem("fonday_routine_" + todayStr(), JSON.stringify(products));
  }}
/>
```

변경 코드:
```tsx
<RoutineChecklist
  cosmetics={myCosmetics}
  checkedIds={checkedCosmeticIds}
  onToggle={(id) => {
    const next = checkedCosmeticIds.includes(id)
      ? checkedCosmeticIds.filter(x => x !== id)
      : [...checkedCosmeticIds, id];
    setCheckedCosmeticIds(next);
    fetch("/api/routine-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_str: todayStr(), cosmetic_ids: next }),
    }).catch(() => {});
  }}
  loading={!user}
/>
```

- [ ] **Step 2: RoutineLogInput.tsx 삭제**

- [ ] **Step 3: localStorage `fonday_routine_*` 관련 코드 정리**

`routineProducts` state, localStorage 읽기/쓰기 코드 제거

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: `✓ built in X.XXs`, error 없음

- [ ] **Step 5: 커밋**

```bash
git add -u
git commit -m "feat: ResultScreen 루틴 체크리스트 연결 + RoutineLogInput 제거"
```

---

### Task 4: 번역 키 추가

**Files:**
- Modify: `client/src/locales/ko/translation.json`
- Modify: `client/src/locales/en/translation.json`
- Modify: `client/src/locales/ja/translation.json`

- [ ] **Step 1: 번역 키 추가**

```json
{
  "routineChecklist": {
    "title": "오늘 사용한 화장품",
    "empty": "루틴 탭에서 화장품을 등록하세요",
    "am": "아침",
    "pm": "저녁",
    "checked": "{{count}}개 사용",
    "hint": "매일 체크하면 어떤 화장품이 효과 있는지 추적해요"
  }
}
```

영어/일본어도 동일 구조.

- [ ] **Step 2: 커밋**

```bash
git add client/src/locales/
git commit -m "i18n: 루틴 체크리스트 번역 키 추가 (ko/en/ja)"
```

---

### Task 5: Correlation Signals에 routine-log 데이터 연결

**Files:**
- Modify: `client/src/components/fonday/utils.ts` (buildCosmeticCorrelationSignals)

- [ ] **Step 1: buildCosmeticCorrelationSignals 수정**

현재: `opened_at` / `created_at` 기준으로 "이 화장품을 사용하기 시작한 날"을 추정
개선: routine-log 데이터가 있으면 **실제로 체크된 날**만 after-window에 포함

변경 방식:
- 함수 시그니처에 `routineLogs?: { date_str: string; cosmetic_ids: string[] }[]` 파라미터 추가
- 각 화장품의 after-window 계산 시, routineLogs에서 해당 화장품 ID가 체크된 날짜만 필터링
- routineLogs가 없으면 기존 로직 유지 (하위 호환)

- [ ] **Step 2: RoutineTab에서 routine-log 데이터 fetch하여 전달**

RoutineTab.tsx의 `buildCosmeticCorrelationSignals()` 호출 부분에서 routine-log 데이터를 함께 전달.

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: `✓ built in X.XXs`

- [ ] **Step 4: 커밋**

```bash
git add client/src/components/fonday/utils.ts client/src/components/fonday/RoutineTab.tsx
git commit -m "feat: correlation signals에 routine-log 실사용 데이터 연결"
```

---

### Task 6: 최종 정리 + 빌드 + 푸시

- [ ] **Step 1: 전체 빌드 확인**

Run: `npm run build`

- [ ] **Step 2: 푸시**

```bash
git push origin dev
```
