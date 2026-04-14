// ─── 화장품 관련 유틸 ────────────────────────────────────────────────────────

import {
  CosmeticItem,
} from "./types";
import {
  CATEGORY_ORDER,
  DEEP_GREEN,
  SCAN_TO,
  SCORE_LABEL_MAP,
} from "./constants";
import { todayStr, apiBase, appFetch } from "./utils-platform";
import { parseIngredientTokens } from "./utils-scoring";

// ─── 자동 화장품 등록 헬퍼 ──────────────────────────────────────────────────

const CAT_KO: Record<string, string> = {
  toner: "토너", serum: "세럼", cream: "크림", sunscreen: "선크림", cleanser: "클렌저",
};

/** 추천 제품 구매 클릭 시 자동 화장품 등록 (fire-and-forget) */
export function autoRegisterCosmetic(product: {
  name: string; brand: string; category: string; keyIngredients?: string[];
}) {
  appFetch(`${apiBase()}/api/cosmetics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: product.name,
      brand: product.brand,
      category: CAT_KO[product.category] || product.category,
      ingredients: product.keyIngredients?.join(", ") || "",
      startDate: new Date().toISOString().slice(0, 10),
    }),
  }).catch(() => {});
}

// ─── 날짜 헬퍼 ──────────────────────────────────────────────────────────────

export function daysSinceDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

// ─── 화장품 인사이트 ──────────────────────────────────────────────────────────

export function buildCosmeticsInsights(
  cosmetics: CosmeticItem[],
  overallScore: number,
  previousScore: number | null,
  t: (key: string, options?: any) => string,
) {
  if (cosmetics.length === 0) return [];

  const insights: { id: string; title: string; desc: string; accent: string }[] = [];
  const categories = new Set(cosmetics.map((item) => item.category));
  const amCount = cosmetics.filter((item) => item.time_of_day === "am" || item.time_of_day === "both").length;
  const pmCount = cosmetics.filter((item) => item.time_of_day === "pm" || item.time_of_day === "both").length;
  const recent = cosmetics
    .map((item) => ({ item, days: daysSinceDate(item.opened_at) }))
    .filter((entry): entry is { item: CosmeticItem; days: number } => entry.days !== null)
    .sort((a, b) => a.days - b.days)[0];

  if (recent && recent.days <= 14) {
    insights.push({
      id: "recent",
      title: t("cosmetics.insightRecentTitle"),
      desc: t("cosmetics.insightRecentDesc", { name: recent.item.name, days: recent.days + 1 }),
      accent: "#C97062",
    });
  }

  if (!categories.has("선크림")) {
    insights.push({
      id: "sunscreen",
      title: t("cosmetics.insightSunscreenTitle"),
      desc: t("cosmetics.insightSunscreenDesc"),
      accent: "#D97706",
    });
  }

  if (pmCount === 0 || pmCount < Math.max(1, Math.ceil(amCount / 2))) {
    insights.push({
      id: "pm-balance",
      title: t("cosmetics.insightBalanceTitle"),
      desc: t("cosmetics.insightBalanceDesc", { am: amCount, pm: pmCount }),
      accent: DEEP_GREEN,
    });
  }

  if (previousScore !== null && previousScore > 0) {
    const delta = overallScore - previousScore;
    if (delta >= 5) {
      insights.push({
        id: "score-up",
        title: t("cosmetics.insightScoreUpTitle"),
        desc: t("cosmetics.insightScoreUpDesc", { delta }),
        accent: "#059669",
      });
    } else if (delta <= -5) {
      insights.push({
        id: "score-down",
        title: t("cosmetics.insightScoreDownTitle"),
        desc: t("cosmetics.insightScoreDownDesc", { delta: Math.abs(delta) }),
        accent: "#DC2626",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "coverage",
      title: t("cosmetics.insightCoverageTitle"),
      desc: t("cosmetics.insightCoverageDesc", { count: cosmetics.length }),
      accent: SCAN_TO,
    });
  }

  return insights.slice(0, 3);
}

// ─── 화장품 상관관계 시그널 ──────────────────────────────────────────────────

type CosmeticSignalScan = {
  createdAt?: string;
  overallScore?: string | number;
  scores?: Array<{ label?: string; score?: number | string }> | string;
};

export type CosmeticCorrelationSignal = {
  itemId: string;
  itemName: string;
  category: string;
  startedAt: string | null;
  daysTracked: number;
  beforeCount: number;
  afterCount: number;
  confidence: "early" | "building" | "strong";
  overallDelta: number | null;
  topScoreIndex: number | null;
  topScoreDelta: number | null;
  secondaryScoreIndex: number | null;
  secondaryScoreDelta: number | null;
  coUsedProducts: string[];
  note: string;
};

function parseScanScores(scan: CosmeticSignalScan) {
  try {
    if (Array.isArray(scan.scores)) return scan.scores;
    if (typeof scan.scores === "string") return JSON.parse(scan.scores);
  } catch {}
  return [];
}

function getScanTimestamp(scan: CosmeticSignalScan) {
  const raw = scan.createdAt;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function getCosmeticStartTimestamp(item: CosmeticItem) {
  const raw = item.opened_at || item.created_at || null;
  if (!raw) return null;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? null : time;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildCosmeticCorrelationSignals(
  cosmetics: CosmeticItem[],
  scans: CosmeticSignalScan[],
  t: (key: string, options?: any) => string,
  routineLogs?: { date_str: string; cosmetic_ids: string[] }[],
): CosmeticCorrelationSignal[] {
  if (cosmetics.length === 0 || scans.length === 0) return [];

  const sortedScans = [...scans]
    .map((scan) => ({ scan, ts: getScanTimestamp(scan) }))
    .filter((entry): entry is { scan: CosmeticSignalScan; ts: number } => entry.ts !== null)
    .sort((a, b) => a.ts - b.ts);

  return cosmetics
    .map((item) => {
      const startTs = getCosmeticStartTimestamp(item);
      if (!startTs) return null;

      const preWindowScans = sortedScans
        .filter(({ ts }) => ts < startTs && ts >= startTs - 21 * 86400000)
        .slice(-3)
        .map(({ scan }) => scan);
      const baselineScans = preWindowScans.length > 0
        ? preWindowScans
        : sortedScans.filter(({ ts }) => ts < startTs).slice(-4).map(({ scan }) => scan);

      const observedAfterScans = sortedScans
        .filter(({ ts }) => ts >= startTs && ts <= startTs + 21 * 86400000)
        .map(({ scan }) => scan);
      const afterScans = observedAfterScans.length > 0
        ? observedAfterScans
        : sortedScans.filter(({ ts }) => ts >= startTs).slice(0, 4).map(({ scan }) => scan);

      // If routine logs are provided, filter after scans to days this product was actually used
      let filteredAfterScans = afterScans;
      if (routineLogs && routineLogs.length > 0) {
        const usedDates = new Set(
          routineLogs
            .filter(log => log.cosmetic_ids.includes(item.id))
            .map(log => log.date_str)
        );
        if (usedDates.size > 0) {
          const filtered = afterScans.filter(scan => {
            const scanDate = new Date(scan.createdAt).toISOString().slice(0, 10);
            return usedDates.has(scanDate);
          });
          // Only use filtered if it has results; otherwise fall back to all afterScans
          if (filtered.length > 0) filteredAfterScans = filtered;
        }
      }

      if (filteredAfterScans.length === 0) return null;

      const comparisonBaselineScans = baselineScans.length > 0
        ? baselineScans
        : filteredAfterScans.slice(0, Math.max(1, Math.min(2, Math.floor(filteredAfterScans.length / 2) || 1)));
      const comparisonAfterScans = baselineScans.length > 0
        ? filteredAfterScans
        : filteredAfterScans.slice(-Math.max(1, Math.min(2, filteredAfterScans.length)));

      const baselineOverall = average(
        comparisonBaselineScans.map((scan) => Number(scan.overallScore) || 0).filter((value) => value > 0)
      );
      const afterOverall = average(
        comparisonAfterScans.map((scan) => Number(scan.overallScore) || 0).filter((value) => value > 0)
      );

      const deltas = Array.from({ length: 10 }, (_, index) => {
        const label = Object.entries(SCORE_LABEL_MAP).find(([, mapped]) => mapped === index)?.[0] || "";
        const beforeValues = comparisonBaselineScans
          .map((scan) => Number(parseScanScores(scan)[index]?.score) || 0)
          .filter((value) => value > 0);
        const afterValues = comparisonAfterScans
          .map((scan) => Number(parseScanScores(scan)[index]?.score) || 0)
          .filter((value) => value > 0);
        const beforeMean = average(beforeValues);
        const afterMean = average(afterValues);
        return {
          index,
          label,
          delta: beforeMean !== null && afterMean !== null ? afterMean - beforeMean : null,
        };
      }).filter((item) => item.delta !== null) as Array<{ index: number; label: string; delta: number }>;

      const sortedPositive = [...deltas]
        .filter((item) => item.index !== 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      const top = sortedPositive[0] || null;
      const second = sortedPositive[1] || null;
      const coUsedProducts = cosmetics
        .filter((other) => other.id !== item.id)
        .filter((other) => {
          const otherTs = getCosmeticStartTimestamp(other);
          return otherTs !== null && otherTs <= startTs;
        })
        .map((other) => other.name)
        .slice(0, 3);

      const confidence: CosmeticCorrelationSignal["confidence"] =
        comparisonBaselineScans.length >= 2 && comparisonAfterScans.length >= 2 && (daysSinceDate(item.opened_at || item.created_at || todayStr()) ?? 0) >= 10
          ? "strong"
          : comparisonBaselineScans.length >= 1 && comparisonAfterScans.length >= 2
          ? "building"
          : "early";

      const daysTracked = Math.max(1, Math.floor((Date.now() - startTs) / 86400000) + 1);
      const overallDelta = baselineOverall !== null && afterOverall !== null ? afterOverall - baselineOverall : null;
      const mainMetricLabel = top ? t(`scores.${top.index}`) : null;

      let note = t("cosmetics.signalNoteEarly");
      if (top && top.delta >= 4) {
        note = t("cosmetics.signalNotePositive", { metric: mainMetricLabel, delta: Math.round(top.delta) });
      } else if (top && top.delta <= -4) {
        note = t("cosmetics.signalNoteNegative", { metric: mainMetricLabel, delta: Math.abs(Math.round(top.delta)) });
      } else if (overallDelta !== null && overallDelta >= 4) {
        note = t("cosmetics.signalNoteOverallPositive", { delta: Math.round(overallDelta) });
      } else if (overallDelta !== null && overallDelta <= -4) {
        note = t("cosmetics.signalNoteOverallNegative", { delta: Math.abs(Math.round(overallDelta)) });
      }

      if (coUsedProducts.length >= 2) {
        note = `${note} ${t("cosmetics.signalNoteCoUsed", { count: coUsedProducts.length })}`;
      }

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        startedAt: item.opened_at || item.created_at || null,
        daysTracked,
        beforeCount: baselineScans.length,
        afterCount: filteredAfterScans.length,
        confidence,
        overallDelta: overallDelta !== null ? Math.round(overallDelta * 10) / 10 : null,
        topScoreIndex: top?.index ?? null,
        topScoreDelta: top ? Math.round(top.delta * 10) / 10 : null,
        secondaryScoreIndex: second?.index ?? null,
        secondaryScoreDelta: second ? Math.round(second.delta * 10) / 10 : null,
        coUsedProducts,
        note,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aAbs = Math.max(Math.abs(a!.topScoreDelta || 0), Math.abs(a!.overallDelta || 0));
      const bAbs = Math.max(Math.abs(b!.topScoreDelta || 0), Math.abs(b!.overallDelta || 0));
      return bAbs - aAbs;
    }) as CosmeticCorrelationSignal[];
}

// ─── 화장품 루틴 정렬/추론 ───────────────────────────────────────────────────

const CATEGORY_DEFAULT_TIME: Record<string, ("am" | "pm")[]> = {
  "클렌저": ["am", "pm"],
  "토너": ["am", "pm"],
  "세럼": ["am", "pm"],
  "진정케어": ["pm"],
  "각질케어": ["pm"],
  "아이크림": ["pm"],
  "장벽케어": ["pm"],
  "크림": ["pm"],
  "선크림": ["am"],
};

export function sortCosmeticsForRoutine(items: CosmeticItem[]) {
  return [...items].sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.category);
    const bIndex = CATEGORY_ORDER.indexOf(b.category);
    const normalizedA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
    const normalizedB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;
    return normalizedA - normalizedB;
  });
}

export function inferCosmeticTimeOfDay(category: string): "am" | "pm" {
  const defaultTimes = CATEGORY_DEFAULT_TIME[category] || ["pm"];
  return defaultTimes[0] || "pm";
}

export function buildRoutineGuide(cosmetics: CosmeticItem[], t: (key: string, options?: any) => string) {
  const shouldIncludeInTime = (item: CosmeticItem, period: "am" | "pm") => {
    if (item.time_of_day === "am" || item.time_of_day === "pm") return item.time_of_day === period;
    const defaults = CATEGORY_DEFAULT_TIME[item.category] || ["pm"];
    return defaults.includes(period);
  };
  const am = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "am")));
  const pm = sortCosmeticsForRoutine(cosmetics.filter((item) => shouldIncludeInTime(item, "pm")));
  const categories = cosmetics.map((item) => item.category);
  const categoryCount = new Map<string, number>();
  categories.forEach((category) => categoryCount.set(category, (categoryCount.get(category) || 0) + 1));
  const uniqueAmSteps = Array.from(new Set(am.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));
  const uniquePmSteps = Array.from(new Set(pm.map((item) => item.category))).map((category) => t(`cosmetics.categories.${category}`));

  const goodMixes: string[] = [];
  const cautions: string[] = [];

  if (categories.includes("진정케어") && categories.includes("장벽케어")) {
    goodMixes.push(t("cosmetics.goodComboBarrier"));
  }
  if (categories.includes("세럼") && categories.includes("크림")) {
    goodMixes.push(t("cosmetics.goodComboLayering"));
  }
  if (categories.includes("선크림")) {
    goodMixes.push(t("cosmetics.goodComboSunscreen"));
  }

  const exfoliatorCount = categoryCount.get("각질케어") || 0;
  if (exfoliatorCount >= 2) {
    cautions.push(t("cosmetics.cautionOverExfoliate"));
  }
  if (cosmetics.some((item) => item.category === "각질케어" && (item.time_of_day === "am" || item.time_of_day === "both"))) {
    cautions.push(t("cosmetics.cautionMorningExfoliate"));
  }
  if ((categoryCount.get("세럼") || 0) >= 3) {
    cautions.push(t("cosmetics.cautionTooManySerums"));
  }
  if (!categories.includes("장벽케어") && !categories.includes("진정케어")) {
    cautions.push(t("cosmetics.cautionRecoveryGap"));
  }

  return {
    am,
    pm,
    amSteps: uniqueAmSteps,
    pmSteps: uniquePmSteps,
    goodMixes: goodMixes.slice(0, 3),
    cautions: cautions.slice(0, 3),
  };
}

// ─── 대표 루틴 빌더 ──────────────────────────────────────────────────────────

type RoutineConflictDetail = {
  ids: string[];
  productNames: string[];
  reason: string;
  resolution: string;
};

const RETINOID_PATTERNS = [/retinol/i, /retinal/i, /retinoid/i, /레티놀/i, /레티날/i, /레티노이드/i, /レチノ/i];
const EXFOLIANT_PATTERNS = [/aha/i, /bha/i, /pha/i, /glycolic/i, /lactic/i, /salicylic/i, /mandelic/i, /글라이콜릭/i, /락틱/i, /살리실릭/i, /만델릭/i, /角質/i];
const VITAMIN_C_PATTERNS = [/vitamin c/i, /ascorb/i, /비타민\s*c/i, /아스코르브/i, /ビタミン\s*c/i];
const NIACINAMIDE_PATTERNS = [/niacinamide/i, /나이아신아마이드/i, /ナイアシンアミド/i];
const REPRESENTATIVE_LIMIT: Record<"am" | "pm", number> = { am: 4, pm: 5 };
const PERIOD_PRIORITY: Record<"am" | "pm", string[]> = {
  am: ["클렌저", "세럼", "크림", "선크림", "토너", "진정케어", "장벽케어", "아이크림", "각질케어"],
  pm: ["클렌저", "토너", "각질케어", "세럼", "진정케어", "장벽케어", "크림", "아이크림", "선크림"],
};

function matchesIngredientPattern(item: CosmeticItem, patterns: RegExp[]) {
  const haystack = `${item.name || ""}\n${item.ingredients || ""}\n${item.category || ""}`;
  return patterns.some((pattern) => pattern.test(haystack));
}

function getItemPeriods(item: CosmeticItem): ("am" | "pm")[] {
  if (item.time_of_day === "am") return ["am"];
  if (item.time_of_day === "pm") return ["pm"];
  if (item.time_of_day === "both") {
    const defaults = CATEGORY_DEFAULT_TIME[item.category] || ["am", "pm"];
    return defaults.length > 0 ? defaults : ["am", "pm"];
  }
  return CATEGORY_DEFAULT_TIME[item.category] || ["pm"];
}

function compareCosmeticPriority(a: CosmeticItem, b: CosmeticItem) {
  const aIndex = CATEGORY_ORDER.indexOf(a.category);
  const bIndex = CATEGORY_ORDER.indexOf(b.category);
  const normalizedA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
  const normalizedB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;

  if (normalizedA !== normalizedB) return normalizedA - normalizedB;

  const aIngredientScore = parseIngredientTokens(a.ingredients).length;
  const bIngredientScore = parseIngredientTokens(b.ingredients).length;
  if (aIngredientScore !== bIngredientScore) return bIngredientScore - aIngredientScore;

  const aImageScore = a.image_thumbnail ? 1 : 0;
  const bImageScore = b.image_thumbnail ? 1 : 0;
  if (aImageScore !== bImageScore) return bImageScore - aImageScore;

  return a.name.localeCompare(b.name, "ko");
}

function getConflictMeta(
  a: CosmeticItem,
  b: CosmeticItem,
  period: "am" | "pm",
  t: (key: string, options?: any) => string
): RoutineConflictDetail | null {
  const aRetinoid = matchesIngredientPattern(a, RETINOID_PATTERNS);
  const bRetinoid = matchesIngredientPattern(b, RETINOID_PATTERNS);
  const aExfoliant = a.category === "각질케어" || matchesIngredientPattern(a, EXFOLIANT_PATTERNS);
  const bExfoliant = b.category === "각질케어" || matchesIngredientPattern(b, EXFOLIANT_PATTERNS);
  const aVitaminC = matchesIngredientPattern(a, VITAMIN_C_PATTERNS);
  const bVitaminC = matchesIngredientPattern(b, VITAMIN_C_PATTERNS);
  const aNiacinamide = matchesIngredientPattern(a, NIACINAMIDE_PATTERNS);
  const bNiacinamide = matchesIngredientPattern(b, NIACINAMIDE_PATTERNS);

  if ((aRetinoid && bExfoliant) || (bRetinoid && aExfoliant)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictRetinoidExfoliant"),
      resolution: t("cosmetics.conflictResolutionSeparate"),
    };
  }

  if ((aRetinoid && bVitaminC) || (bRetinoid && aVitaminC)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictRetinoidVitaminC"),
      resolution: t("cosmetics.conflictResolutionAmPm"),
    };
  }

  if ((aVitaminC && bExfoliant) || (bVitaminC && aExfoliant)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictVitaminCExfoliant"),
      resolution: t("cosmetics.conflictResolutionAlternate"),
    };
  }

  if (aExfoliant && bExfoliant) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.cautionOverExfoliate"),
      resolution: period === "am" ? t("cosmetics.conflictResolutionPmOnly") : t("cosmetics.conflictResolutionAlternate"),
    };
  }

  if ((aNiacinamide && bVitaminC) || (bNiacinamide && aVitaminC)) {
    return {
      ids: [a.id, b.id],
      productNames: [a.name, b.name],
      reason: t("cosmetics.conflictNiacinamideVitaminC"),
      resolution: t("cosmetics.conflictResolutionSeparate"),
    };
  }

  return null;
}

function buildRepresentativePeriod(
  sourceItems: CosmeticItem[],
  period: "am" | "pm",
  t: (key: string, options?: any) => string
) {
  const selected: CosmeticItem[] = [];
  const conflicts: RoutineConflictDetail[] = [];
  const usedCategories = new Set<string>();

  for (const item of sourceItems) {
    if (usedCategories.has(item.category)) continue;

    const conflict = selected
      .map((picked) => getConflictMeta(picked, item, period, t))
      .find(Boolean) || null;

    if (conflict) {
      conflicts.push(conflict);
      continue;
    }

    selected.push(item);
    usedCategories.add(item.category);
  }

  const prioritized = [...selected].sort((a, b) => {
    const aIndex = PERIOD_PRIORITY[period].indexOf(a.category);
    const bIndex = PERIOD_PRIORITY[period].indexOf(b.category);
    const normalizedA = aIndex === -1 ? PERIOD_PRIORITY[period].length : aIndex;
    const normalizedB = bIndex === -1 ? PERIOD_PRIORITY[period].length : bIndex;
    return normalizedA - normalizedB;
  });

  return { items: prioritized.slice(0, REPRESENTATIVE_LIMIT[period]), conflicts };
}

export function buildRepresentativeRoutine(
  cosmetics: CosmeticItem[],
  t: (key: string, options?: any) => string,
  preferred?: { am?: string[]; pm?: string[]; conflicts?: { productNames?: string[]; reason?: string; resolution?: string }[] | null }
) {
  const preferredIds = new Set([...(preferred?.am || []), ...(preferred?.pm || [])]);
  const baseSorted = [...cosmetics].sort(compareCosmeticPriority);

  const getSourceItems = (period: "am" | "pm") => {
    const preferredItems = (preferred?.[period] || [])
      .map((id) => cosmetics.find((item) => item.id === id))
      .filter(Boolean) as CosmeticItem[];

    const remainder = baseSorted.filter((item) => !preferredIds.has(item.id) && getItemPeriods(item).includes(period));
    const explicit = preferredItems.filter((item) => getItemPeriods(item).includes(period));

    return [...explicit, ...remainder];
  };

  const amResult = buildRepresentativePeriod(getSourceItems("am"), "am", t);
  const pmResult = buildRepresentativePeriod(getSourceItems("pm"), "pm", t);

  const mergedConflicts = [
    ...(preferred?.conflicts || []).map((conflict) => ({
      ids: [],
      productNames: conflict.productNames || [],
      reason: conflict.reason || "",
      resolution: conflict.resolution || "",
    })),
    ...amResult.conflicts,
    ...pmResult.conflicts,
  ].filter((conflict) => conflict.reason || conflict.productNames.length > 0);

  const dedupedConflicts: RoutineConflictDetail[] = [];
  const seen = new Set<string>();
  for (const conflict of mergedConflicts) {
    const key = `${[...conflict.productNames].sort().join("|")}::${conflict.reason}::${conflict.resolution}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedConflicts.push(conflict);
  }

  return {
    am: amResult.items,
    pm: pmResult.items,
    amSteps: amResult.items.map((item) => t(`cosmetics.categories.${item.category}`)),
    pmSteps: pmResult.items.map((item) => t(`cosmetics.categories.${item.category}`)),
    conflicts: dedupedConflicts,
  };
}
