// ─── 미션 포인트 (토스 포인트 = 1P) ─────────────────────────────────────────

export const MISSION_POINTS: Record<string, number> = {
  first_scan: 1,       // 첫 피부 진단
  share: 2,            // 결과 공유
  first_cosmetic: 1,   // 화장품 최초 등록
  cosmetic_10: 5,      // 화장품 10개 등록
  first_diary: 1,      // 일기 최초 작성
  diary_streak_10: 5,  // 일기 10일 연속 작성
};

// 토스 프로모션 코드 (콘솔 등록 후 실제 코드로 교체)
export const TOSS_PROMOTION_CODE = "FONDAY_REWARD_V1";

// 토스 공유 리워드 모듈 ID (콘솔 등록 후 실제 ID로 교체)
export const TOSS_VIRAL_MODULE_ID = "FONDAY_VIRAL_V1";

// ─── 다이어리 원인 태그 ───────────────────────────────────────────────────────

export const DIARY_CAUSE_TAGS = ["sleep", "newProduct", "cycle", "diet", "stress", "outdoor"] as const;

export const LEGACY_DIARY_CAUSE_TAG_MAP: Record<string, "sleep" | "newProduct" | "cycle" | "diet" | "stress" | "outdoor"> = {
  "수면부족": "sleep",
  "새 화장품": "newProduct",
  "생리주기": "cycle",
  "식단": "diet",
  "스트레스": "stress",
  "야외활동": "outdoor",
};

export const CAUSE_TAG_KEYWORDS: Record<"sleep" | "newProduct" | "cycle" | "diet" | "stress" | "outdoor", string[]> = {
  sleep: ["피곤", "수면", "잠", "야근", "늦잠", "sleep", "tired", "insomnia", "寝不足", "睡眠"],
  newProduct: ["새", "화장품", "세럼", "크림", "토너", "제품", "new product", "serum", "cream", "toner", "cosmetic", "新しい", "化粧品"],
  cycle: ["생리", "주기", "pms", "period", "cycle", "menstrual", "生理", "周期"],
  diet: ["매운", "야식", "커피", "술", "밀가루", "단것", "식단", "diet", "coffee", "alcohol", "spicy", "sugar", "食事", "コーヒー", "お酒"],
  stress: ["스트레스", "예민", "피로", "긴장", "stress", "stressed", "sensitive", "ストレス", "疲れ"],
  outdoor: ["야외", "운동", "햇빛", "외출", "여행", "outdoor", "sun", "travel", "workout", "外出", "日差し", "旅行"],
};

// ─── 화장품 카테고리 ──────────────────────────────────────────────────────────

export const CATEGORY_ORDER = ["클렌저", "토너", "세럼", "진정케어", "각질케어", "아이크림", "장벽케어", "크림", "선크림"];

export const COSMETIC_CATEGORIES = ["클렌저","토너","세럼","크림","선크림","각질케어","진정케어","장벽케어","아이크림","기타스킨케어"] as const;

// ─── 매거진 카테고리 필터 ─────────────────────────────────────────────────────

export const CATEGORY_FILTERS = ["전체", "성분", "루틴", "타입", "케어", "전문가"] as const;
