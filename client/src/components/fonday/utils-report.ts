// ─── 다이어리 리포트 모델 ─────────────────────────────────────────────────────

import {
  AnalysisResult,
  CosmeticItem,
  ReportLang,
  ReportConcernKey,
} from "./types";
import {
  DIARY_CAUSE_TAGS,
} from "./constants";
import { todayStr } from "./utils-platform";
import { getDiaryCauseTags, getCauseTagLabel } from "./utils-diary";
import {
  getWeeklyReport,
  getRecoveryGuide,
  getSeasonLabel,
  parseIngredientTokens,
} from "./utils-scoring";

const REPORT_COPY: Record<ReportLang, Record<string, string>> = {
  ko: {
    deck: "Skin Analysis Desk",
    title: "누적 피부 리포트",
    subtitle: "스캔, 일기, 루틴 데이터를 묶어 전문가 노트처럼 정리했습니다.",
    period: "분석 기간",
    scans: "누적 스캔",
    diary: "일기 메모",
    adherence: "루틴 실행",
    executive: "전문가 해석",
    priority: "우선 케어 과제",
    ingredients: "추천 성분 처방",
    procedures: "권장 시술 방향",
    routine: "루틴·생활 시그널",
    trendUp: "회복 추세",
    trendFlat: "안정 구간",
    trendDown: "변동 주의",
    trendUpDesc: "최근 평균 점수가 이전 구간보다 개선되었습니다.",
    trendFlatDesc: "최근 점수가 비슷한 범위에서 유지되고 있습니다.",
    trendDownDesc: "최근 점수가 이전 구간보다 떨어져 원인 확인이 필요합니다.",
    routineStrong: "루틴 지속력이 비교적 안정적입니다.",
    routineWeak: "미완료일이 있어 저녁 회복 루틴 정리가 필요합니다.",
    notEnough: "데이터가 더 쌓이면 리포트 정확도가 올라갑니다.",
    scoreRisk: "리스크 {{value}}",
    avgRisk: "최근 평균",
    recommended: "추천",
    caution: "주의",
    procedureNote: "시술은 피부과·의료진과 상담하며 민감도와 생활 패턴을 함께 고려해 결정하세요.",
    routineGood: "유지되는 루틴",
    routineWatch: "흔들리는 루틴",
    memoSignals: "메모 시그널",
    causeSignals: "원인 태그",
    cosmeticsSignal: "화장품 루틴 시그널",
    cosmeticsMissing: "등록된 화장품이 적어 성분 루틴 분석은 아직 초기 단계입니다.",
    cosmeticsReady: "등록된 화장품 {{count}}개를 기준으로 루틴 밀도도 함께 확인했습니다.",
  },
  en: {
    deck: "Skin Analysis Desk",
    title: "Accumulated Skin Report",
    subtitle: "Scans, diary notes, and routines are organized like an expert consultation note.",
    period: "Analysis period",
    scans: "Scans",
    diary: "Diary notes",
    adherence: "Routine adherence",
    executive: "Expert interpretation",
    priority: "Care priorities",
    ingredients: "Recommended ingredients",
    procedures: "Procedure directions",
    routine: "Routine & lifestyle signals",
    trendUp: "Recovery trend",
    trendFlat: "Stable phase",
    trendDown: "Watch volatility",
    trendUpDesc: "Recent average scores are improving over the previous block.",
    trendFlatDesc: "Recent scores are holding in a similar range.",
    trendDownDesc: "Recent scores have slipped versus the previous block.",
    routineStrong: "Routine consistency looks fairly stable.",
    routineWeak: "There were incomplete days, so evening recovery habits need tightening.",
    notEnough: "The report gets sharper as more data accumulates.",
    scoreRisk: "Risk {{value}}",
    avgRisk: "Recent avg",
    recommended: "Recommended",
    caution: "Caution",
    procedureNote: "Any procedure decision should be discussed with a clinician while considering sensitivity and lifestyle.",
    routineGood: "Routine strengths",
    routineWatch: "Routine to watch",
    memoSignals: "Memo signals",
    causeSignals: "Trigger tags",
    cosmeticsSignal: "Cosmetic routine signal",
    cosmeticsMissing: "There are not enough registered products yet for deep ingredient routine analysis.",
    cosmeticsReady: "Routine density was reviewed across {{count}} registered products.",
  },
  ja: {
    deck: "Skin Analysis Desk",
    title: "蓄積肌レポート",
    subtitle: "スキャン、日記、ルーティンデータをまとめて専門家ノートのように整理しました。",
    period: "分析期間",
    scans: "累積スキャン",
    diary: "日記メモ",
    adherence: "ルーティン実行",
    executive: "専門家コメント",
    priority: "優先ケア課題",
    ingredients: "推奨成分処方",
    procedures: "推奨施術の方向",
    routine: "ルーティン・生活シグナル",
    trendUp: "回復トレンド",
    trendFlat: "安定区間",
    trendDown: "変動に注意",
    trendUpDesc: "直近平均スコアは前の区間より改善しています。",
    trendFlatDesc: "最近のスコアは近い範囲で維持されています。",
    trendDownDesc: "直近スコアが前の区間より下がっており原因確認が必要です。",
    routineStrong: "ルーティン継続力は安定しています。",
    routineWeak: "未完了日があり夜の回復管理が必要です。",
    notEnough: "データが増えるほどレポート精度が上がります。",
    scoreRisk: "リスク {{value}}",
    avgRisk: "直近平均",
    recommended: "推奨",
    caution: "注意",
    procedureNote: "施術は皮膚科・医療者と相談し、敏感度と生活パターンを考慮して決めてください。",
    routineGood: "維持できているルーティン",
    routineWatch: "乱れやすいルーティン",
    memoSignals: "メモシグナル",
    causeSignals: "原因タグ",
    cosmeticsSignal: "コスメルーティンシグナル",
    cosmeticsMissing: "登録コスメが少なく、成分ルーティン分析はまだ初期段階です。",
    cosmeticsReady: "登録済みコスメ{{count}}件をもとにルーティン密度も確認しました。",
  },
};

const REPORT_CONCERNS: Array<{
  key: ReportConcernKey;
  label: string;
  risk: (score: number) => number;
  accent: string;
  titles: Record<ReportLang, string>;
  summaries: Record<ReportLang, string>;
  ingredients: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
  procedures: Array<{ name: Record<ReportLang, string>; reason: Record<ReportLang, string> }>;
}> = [
  {
    key: "hydration",
    label: "수분 밸런스",
    risk: (score) => 100 - score,
    accent: "#3B82F6",
    titles: { ko: "수분-장벽 저하", en: "Hydration barrier dip", ja: "水分・バリア低下" },
    summaries: {
      ko: "수분이 떨어지는 날에 전체 점수 하락이 같이 나타나는 패턴입니다.",
      en: "Lower hydration is moving with wider score drops.",
      ja: "水分低下の日に全体スコア低下が重なる傾向です。",
    },
    ingredients: [
      { name: { ko: "히알루론산", en: "Hyaluronic acid", ja: "ヒアルロン酸" }, reason: { ko: "수분 저장력을 높여 각질 들뜸을 완화합니다.", en: "Supports water retention and reduces surface dryness.", ja: "水分保持を高めて乾燥感を和らげます。" } },
      { name: { ko: "세라마이드", en: "Ceramide", ja: "セラミド" }, reason: { ko: "피부 장벽 복구에 직접적인 축을 담당합니다.", en: "Directly supports barrier repair.", ja: "肌バリア修復を支えます。" } },
    ],
    procedures: [
      { name: { ko: "저자극 스킨부스터", en: "Low-irritation skin booster", ja: "低刺激スキンブースター" }, reason: { ko: "만성 건조와 장벽 저하 구간에서 수분 보강에 유리합니다.", en: "Useful when chronic dryness and barrier loss dominate.", ja: "慢性的な乾燥とバリア低下が続く時に向いています。" } },
    ],
  },
  {
    key: "redness",
    label: "붉은기 수준",
    risk: (score) => score,
    accent: "#EF4444",
    titles: { ko: "민감도 상승", en: "Redness reactivity", ja: "赤み反応性" },
    summaries: {
      ko: "자극 노출 후 붉은기 점수가 쉽게 오르는 민감 패턴입니다.",
      en: "Redness flares easily after likely irritation triggers.",
      ja: "刺激要因の後に赤みが上がりやすい敏感パターンです。",
    },
    ingredients: [
      { name: { ko: "판테놀", en: "Panthenol", ja: "パンテノール" }, reason: { ko: "열감과 민감 반응이 반복될 때 진정 축으로 좋습니다.", en: "Good anchor ingredient for repeated reactivity.", ja: "反応が続く時の鎮静軸として有効です。" } },
      { name: { ko: "센텔라", en: "Centella asiatica", ja: "ツボクサ" }, reason: { ko: "붉은기 완화와 장벽 회복을 동시에 보조합니다.", en: "Helps calm redness while supporting repair.", ja: "赤み緩和とバリア回復を助けます。" } },
    ],
    procedures: [
      { name: { ko: "LED 진정 케어", en: "LED calming care", ja: "LED鎮静ケア" }, reason: { ko: "민감기에는 강한 시술보다 열 자극이 적은 관리가 적합합니다.", en: "Lower-heat calming care is often safer than aggressive procedures.", ja: "敏感期は強い施術より低刺激ケアが向いています。" } },
    ],
  },
  {
    key: "pores",
    label: "모공 상태",
    risk: (score) => 100 - score,
    accent: "#F59E0B",
    titles: { ko: "유분-모공 부담", en: "Sebum-pore load", ja: "皮脂・毛穴負担" },
    summaries: {
      ko: "유분 관리가 흔들릴 때 모공 점수가 빠르게 떨어지는 흐름입니다.",
      en: "Pore condition softens quickly when oil control slips.",
      ja: "皮脂管理が乱れると毛穴状態が下がりやすい流れです。",
    },
    ingredients: [
      { name: { ko: "나이아신아마이드", en: "Niacinamide", ja: "ナイアシンアミド" }, reason: { ko: "피지와 결을 함께 관리하기 좋은 다목적 성분입니다.", en: "A multipurpose ingredient for oil balance and texture.", ja: "皮脂とキメを同時に見やすい多機能成分です。" } },
      { name: { ko: "BHA", en: "BHA", ja: "BHA" }, reason: { ko: "모공 내부 각질과 피지 축적 관리에 적합합니다.", en: "Useful for pore congestion and oil build-up.", ja: "毛穴内の角質・皮脂ケアに向いています。" } },
    ],
    procedures: [
      { name: { ko: "아쿠아필 계열", en: "Hydro / aqua peel", ja: "アクアピーリング系" }, reason: { ko: "막힌 모공과 표면 피지 정리에 직관적인 선택지입니다.", en: "A direct option for congestion and surface oil control.", ja: "詰まり毛穴と表面皮脂の整理に向いています。" } },
    ],
  },
  {
    key: "pigmentation",
    label: "잡티/색소침착",
    risk: (score) => score,
    accent: "#8B5CF6",
    titles: { ko: "색소 흔적 누적", en: "Pigment retention", ja: "色素残存" },
    summaries: {
      ko: "자외선·염증 후 색소가 오래 남는 경향이 보입니다.",
      en: "Pigment marks appear to linger after UV or inflammation exposure.",
      ja: "紫外線や炎症後の色素が残りやすい傾向です。",
    },
    ingredients: [
      { name: { ko: "비타민C", en: "Vitamin C", ja: "ビタミンC" }, reason: { ko: "톤 보정과 항산화 관리의 기본축입니다.", en: "Core ingredient for tone support and antioxidant care.", ja: "トーン補正と抗酸化ケアの軸になります。" } },
      { name: { ko: "트라넥사믹 애씨드", en: "Tranexamic acid", ja: "トラネキサム酸" }, reason: { ko: "반복되는 색소 흔적 관리에 유용합니다.", en: "Useful when pigment marks recur.", ja: "色素痕が繰り返す時に有用です。" } },
    ],
    procedures: [
      { name: { ko: "토닝 레이저 상담", en: "Laser toning consult", ja: "トーニングレーザー相談" }, reason: { ko: "색소가 누적될 때 시술 적합도 검토 가치가 있습니다.", en: "Worth evaluating when pigmentation continues to accumulate.", ja: "色素蓄積が続く時は適応確認の価値があります。" } },
    ],
  },
  {
    key: "elasticity",
    label: "주름 및 탄력",
    risk: (score) => 100 - score,
    accent: "#14B8A6",
    titles: { ko: "탄력 저하 신호", en: "Elasticity decline", ja: "弾力低下サイン" },
    summaries: {
      ko: "건조와 피로 누적 구간에서 탄력 점수가 눌리는 흐름입니다.",
      en: "Elasticity softens when dryness and fatigue stack together.",
      ja: "乾燥や疲労が重なる時に弾力スコアが落ちやすいです。",
    },
    ingredients: [
      { name: { ko: "레티놀", en: "Retinol", ja: "レチノール" }, reason: { ko: "탄력 저하 관리의 대표 성분입니다.", en: "A classic ingredient for firmness management.", ja: "弾力ケアの代表成分です。" } },
      { name: { ko: "펩타이드", en: "Peptides", ja: "ペプチド" }, reason: { ko: "자극을 낮추면서 탄력 루틴을 보강하기 좋습니다.", en: "Useful for adding firmness support with lower irritation.", ja: "比較的やさしく弾力ケアを補強できます。" } },
    ],
    procedures: [
      { name: { ko: "고주파 탄력 관리", en: "RF tightening consult", ja: "高周波たるみ相談" }, reason: { ko: "탄력 축이 지속적으로 낮다면 검토 가능한 방향입니다.", en: "A reasonable direction when elasticity continues to trend down.", ja: "弾力低下が続くなら検討しやすい方向です。" } },
    ],
  },
  {
    key: "breakout",
    label: "트러블 위험",
    risk: (score) => 100 - score,
    accent: "#EC4899",
    titles: { ko: "트러블 재발성", en: "Breakout recurrence", ja: "トラブル再発性" },
    summaries: {
      ko: "생활 패턴 변화에 따라 트러블 위험도가 흔들리는 흐름입니다.",
      en: "Breakout risk appears sensitive to routine and lifestyle disruption.",
      ja: "生活リズムの乱れでトラブルリスクが動きやすい流れです。",
    },
    ingredients: [
      { name: { ko: "아젤라익 애씨드", en: "Azelaic acid", ja: "アゼライン酸" }, reason: { ko: "트러블과 붉은 흔적을 함께 보기에 좋습니다.", en: "Useful for both breakouts and post-redness marks.", ja: "トラブルと赤み跡を一緒に見やすい成分です。" } },
      { name: { ko: "징크 PCA", en: "Zinc PCA", ja: "ジンクPCA" }, reason: { ko: "피지 균형과 번들거림 완화에 유리합니다.", en: "Supports oil balance and shine control.", ja: "皮脂バランスとテカリ管理に向いています。" } },
    ],
    procedures: [
      { name: { ko: "블루/레드 LED 관리", en: "Blue / red LED care", ja: "ブルー/レッドLEDケア" }, reason: { ko: "반복성 트러블 구간에서 저자극 보조 옵션이 됩니다.", en: "A gentle support option for recurrent breakouts.", ja: "再発しやすいトラブルの補助選択肢になります。" } },
    ],
  },
  {
    key: "darkCircle",
    label: "다크서클",
    risk: (score) => score,
    accent: "#6366F1",
    titles: { ko: "눈가 피로 누적", en: "Under-eye fatigue", ja: "目元疲労" },
    summaries: {
      ko: "수면/피로 변수에 따라 눈가 컨디션이 흔들리는 모습입니다.",
      en: "Under-eye condition appears responsive to fatigue and sleep load.",
      ja: "睡眠や疲労により目元状態が揺れやすいようです。",
    },
    ingredients: [
      { name: { ko: "카페인", en: "Caffeine", ja: "カフェイン" }, reason: { ko: "부기와 눈가 컨디션 관리에 보조적입니다.", en: "Helpful as a support ingredient for puffiness and under-eye tone.", ja: "むくみと目元コンディション管理の補助になります。" } },
      { name: { ko: "비타민K", en: "Vitamin K", ja: "ビタミンK" }, reason: { ko: "눈가 톤 관리 루틴에 자주 쓰이는 축입니다.", en: "Often used in targeted under-eye tone routines.", ja: "目元トーンケアで使われやすい軸です。" } },
    ],
    procedures: [
      { name: { ko: "눈가 순환 관리", en: "Under-eye circulation care", ja: "目元循環ケア" }, reason: { ko: "피로형 다크서클이면 생활 패턴 교정과 함께 검토할 수 있습니다.", en: "Can be considered alongside sleep and fatigue correction.", ja: "疲労型なら生活改善と一緒に検討できます。" } },
    ],
  },
];

export function buildDiaryReportModel({
  history,
  analysisResult,
  overallScore,
  finalType,
  weeklyReport,
  myCosmetics,
  t,
  lang,
}: {
  history: any[];
  analysisResult: AnalysisResult | null;
  overallScore: number;
  finalType: string;
  weeklyReport: ReturnType<typeof getWeeklyReport>;
  myCosmetics: CosmeticItem[];
  t: (key: string, options?: any) => string;
  lang: ReportLang;
}) {
  const copy = REPORT_COPY[lang];
  const today = todayStr();
  const snapshots = [
    ...(analysisResult ? [{
      createdAt: new Date().toISOString(),
      overallScore,
      skinAge: analysisResult.skinAge ?? null,
      baumannType: finalType,
      scores: analysisResult.scores ?? [],
    }] : []),
    ...history,
  ].filter((scan, index, arr) => {
    const date = new Date(scan.createdAt).toISOString().slice(0, 10);
    return arr.findIndex((candidate) => new Date(candidate.createdAt).toISOString().slice(0, 10) === date) === index;
  });

  const concernRows = REPORT_CONCERNS.map((concern) => {
    const risks = snapshots.flatMap((scan) => {
      const matched = (scan.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return [];
      return [concern.risk(Number(matched.score))];
    });
    const recentBlock = risks.slice(0, 3);
    const prevBlock = risks.slice(3, 6);
    const avgRisk = risks.length > 0 ? Math.round(risks.reduce((sum, value) => sum + value, 0) / risks.length) : 0;
    const recentAvg = recentBlock.length > 0 ? recentBlock.reduce((sum, value) => sum + value, 0) / recentBlock.length : avgRisk;
    const prevAvg = prevBlock.length > 0 ? prevBlock.reduce((sum, value) => sum + value, 0) / prevBlock.length : recentAvg;
    return {
      ...concern,
      avgRisk,
      delta: Math.round(recentAvg - prevAvg),
    };
  }).sort((a, b) => b.avgRisk - a.avgRisk);

  const focusConcerns = concernRows.slice(0, 3);
  const ingredientPlan = focusConcerns
    .flatMap((concern) => concern.ingredients.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 4);
  const procedurePlan = focusConcerns
    .flatMap((concern) => concern.procedures.map((item) => ({
      concern: concern.titles[lang],
      name: item.name[lang],
      reason: item.reason[lang],
      accent: concern.accent,
    })))
    .filter((item, index, arr) => arr.findIndex((candidate) => candidate.name === item.name) === index)
    .slice(0, 3);
  const recentOverall = snapshots.slice(0, 3).map((scan) => Number(scan.overallScore) || 0);
  const previousOverall = snapshots.slice(3, 6).map((scan) => Number(scan.overallScore) || 0);
  const recentMean = recentOverall.length > 0 ? recentOverall.reduce((sum, value) => sum + value, 0) / recentOverall.length : overallScore;
  const previousMean = previousOverall.length > 0 ? previousOverall.reduce((sum, value) => sum + value, 0) / previousOverall.length : recentMean;
  const scoreByDate = new Map(
    snapshots.map((scan) => [new Date(scan.createdAt).toISOString().slice(0, 10), Number(scan.overallScore) || 0]),
  );
  const triggerSignals = DIARY_CAUSE_TAGS.map((tag) => {
    const taggedDates = Array.from(scoreByDate.keys()).filter((dateStr) => getDiaryCauseTags(dateStr).includes(tag));
    const taggedScores = taggedDates.map((dateStr) => scoreByDate.get(dateStr) || 0).filter((score) => score > 0);
    const baselineScores = Array.from(scoreByDate.entries())
      .filter(([dateStr]) => !taggedDates.includes(dateStr))
      .map(([, score]) => score)
      .filter((score) => score > 0);
    const taggedAvg = taggedScores.length > 0 ? taggedScores.reduce((sum, score) => sum + score, 0) / taggedScores.length : 0;
    const baselineAvg = baselineScores.length > 0 ? baselineScores.reduce((sum, score) => sum + score, 0) / baselineScores.length : recentMean;
    return {
      tag,
      label: getCauseTagLabel(t, tag),
      diff: taggedScores.length > 0 ? Math.round(taggedAvg - baselineAvg) : 0,
      count: taggedScores.length,
    };
  })
    .filter((item) => item.count > 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  const ingredientSignals = (() => {
    const signalMap = new Map<string, { deltaSum: number; count: number }>();
    myCosmetics.forEach((item) => {
      const openedAt = item.opened_at ? new Date(item.opened_at) : null;
      if (!openedAt || Number.isNaN(openedAt.getTime())) return;
      const before = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() < openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      const after = snapshots
        .filter((scan) => new Date(scan.createdAt).getTime() >= openedAt.getTime())
        .slice(0, 3)
        .map((scan) => Number(scan.overallScore) || 0)
        .filter((score) => score > 0);
      if (before.length === 0 || after.length === 0) return;
      const delta = after.reduce((sum, score) => sum + score, 0) / after.length
        - before.reduce((sum, score) => sum + score, 0) / before.length;
      parseIngredientTokens(item.ingredients).forEach((ingredient) => {
        const stat = signalMap.get(ingredient) || { deltaSum: 0, count: 0 };
        stat.deltaSum += delta;
        stat.count += 1;
        signalMap.set(ingredient, stat);
      });
    });
    return Array.from(signalMap.entries())
      .map(([ingredient, stat]) => ({ ingredient, delta: Math.round(stat.deltaSum / stat.count), count: stat.count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.delta - a.delta);
  })();

  const radarData = REPORT_CONCERNS.slice(0, 6).map((concern) => {
    const currentScore = (() => {
      const current = snapshots[0];
      const matched = (current?.scores || []).find((item: any) => item?.label === concern.label);
      if (!matched || !Number.isFinite(Number(matched.score))) return 50;
      return 100 - concern.risk(Number(matched.score));
    })();
    const averageScore = (() => {
      const values = snapshots.flatMap((scan) => {
        const matched = (scan?.scores || []).find((item: any) => item?.label === concern.label);
        if (!matched || !Number.isFinite(Number(matched.score))) return [];
        return [100 - concern.risk(Number(matched.score))];
      });
      return values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : currentScore;
    })();
    return {
      subject: concern.titles[lang],
      current: currentScore,
      average: averageScore,
    };
  });

  const seasonGuide = (() => {
    const season = getSeasonLabel(lang);
    const keyConcern = focusConcerns[0]?.key;
    if (lang === "en") {
      if (keyConcern === "hydration") return `${season} dryness likely amplifies barrier fatigue. Keep a heavier PM moisturizer than usual.`;
      if (keyConcern === "pigmentation") return `${season} UV exposure can prolong pigment retention. Keep daily antioxidant + SPF habits tight.`;
      return `${season} environment shifts can widen score volatility. Keep the routine stable when symptoms flare.`;
    }
    if (lang === "ja") {
      if (keyConcern === "hydration") return `${season}の乾燥でバリア疲労が強まりやすいです。夜は保湿量を少し厚めにしてください。`;
      if (keyConcern === "pigmentation") return `${season}の紫外線で色素残存が長引きやすいです。抗酸化ケアとSPFを厳守してください。`;
      return `${season}の環境変化でスコア変動が広がりやすいです。症状が揺れる時ほどルーティンを固定してください。`;
    }
    if (keyConcern === "hydration") return `${season} 건조 환경이 장벽 피로를 키우는 시기입니다. 야간 보습량을 평소보다 두텁게 가져가세요.`;
    if (keyConcern === "pigmentation") return `${season} 자외선 노출이 색소 흔적을 오래 끌 수 있습니다. 항산화 케어와 SPF 루틴을 더 엄격하게 유지하세요.`;
    return `${season} 환경 변수로 점수 변동폭이 커질 수 있는 시기입니다. 흔들릴수록 루틴을 단순하게 고정하는 편이 좋습니다.`;
  })();

  const forecast = (() => {
    const base = Math.round(recentMean || overallScore || 60);
    const routineBoost = weeklyReport.incompleteDays <= 1 ? 4 : 1;
    const concernPenalty = Math.round((focusConcerns[0]?.avgRisk || 40) / 18);
    const week1 = Math.max(45, Math.min(95, base + routineBoost - concernPenalty));
    const week2 = Math.max(45, Math.min(95, week1 + 3));
    if (lang === "en") {
      return {
        week1,
        week2,
        note: `If the current routine is kept stable, the next two weeks could recover toward ${week2} with the biggest lift coming from ${focusConcerns[0]?.titles.en || "barrier care"}.`,
      };
    }
    if (lang === "ja") {
      return {
        week1,
        week2,
        note: `現在のルーティンを安定して維持できれば、今後2週間で${week2}前後まで回復する余地があります。最優先は${focusConcerns[0]?.titles.ja || "バリアケア"}です。`,
      };
    }
    return {
      week1,
      week2,
      note: `지금 루틴을 안정적으로 유지하면 향후 2주 안에 ${week2}점 전후까지 회복할 여지가 있습니다. 가장 큰 개선 축은 ${focusConcerns[0]?.titles.ko || "장벽 케어"}입니다.`,
    };
  })();

  const topCauseTags = weeklyReport.topCauseTags.slice(0, 3).map(([tag, count]) => `${getCauseTagLabel(t, tag)} ${count}`);
  const periodEnd = snapshots.length > 0 ? new Date(snapshots[0].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const periodStart = snapshots.length > 0 ? new Date(snapshots[snapshots.length - 1].createdAt).toISOString().slice(5, 10) : today.slice(5, 10);
  const trendDelta = Math.round(recentMean - previousMean);
  const trendKey = trendDelta >= 3 ? "trendUp" : trendDelta <= -3 ? "trendDown" : "trendFlat";
  const executiveSummary = lang === "ko"
    ? `최근 ${snapshots.length}회 스캔과 최근 7일 일기 데이터를 종합하면 ${focusConcerns[0]?.titles.ko || "기초 컨디션"} 축의 부담이 가장 큽니다. ${focusConcerns[1]?.titles.ko || "생활 패턴"}와 ${focusConcerns[2]?.titles.ko || "루틴 안정성"}도 보조 이슈로 보여, 단기 진정만보다 장벽/색소/유분 관리의 우선순위를 분리해 접근하는 편이 좋습니다.`
    : lang === "ja"
      ? `直近${snapshots.length}回のスキャンと7日分の日記を総合すると、最優先課題は${focusConcerns[0]?.titles.ja || "基礎コンディション"}です。${focusConcerns[1]?.titles.ja || "生活パターン"}と${focusConcerns[2]?.titles.ja || "ルーティン安定性"}も補助課題として見えるため、単発ケアより優先順位を分けた管理が有効です。`
      : `Across ${snapshots.length} recent scans and the last 7 days of diary data, the highest burden is on ${focusConcerns[0]?.titles.en || "baseline condition"}. ${focusConcerns[1]?.titles.en || "lifestyle pattern"} and ${focusConcerns[2]?.titles.en || "routine stability"} are secondary drivers, so a prioritized plan will work better than one-off fixes.`;

  // ── 주간 일별 트렌드 데이터 (라인 차트용) ──
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }
  const dailyTrend = last7Days.map((dateStr) => {
    const scan = snapshots.find((s: any) => new Date(s.createdAt).toISOString().slice(0, 10) === dateStr);
    return {
      date: dateStr.slice(5),
      score: scan ? Number(scan.overallScore) || 0 : null,
    };
  });

  // ── 이번주 vs 지난주 항목별 비교 ──
  const thisWeekScans = snapshots.slice(0, Math.min(7, snapshots.length));
  const lastWeekScans = snapshots.slice(Math.min(7, snapshots.length), Math.min(14, snapshots.length));
  const scoreComparison = (analysisResult?.scores || []).slice(0, 10).map((item: any, idx: number) => {
    const thisWeekValues = thisWeekScans.map((s: any) => {
      const scores = Array.isArray(s.scores) ? s.scores : [];
      return Number(scores[idx]?.score) || 0;
    }).filter((v: number) => v > 0);
    const lastWeekValues = lastWeekScans.map((s: any) => {
      const scores = Array.isArray(s.scores) ? s.scores : [];
      return Number(scores[idx]?.score) || 0;
    }).filter((v: number) => v > 0);
    const thisAvg = thisWeekValues.length > 0 ? Math.round(thisWeekValues.reduce((a: number, b: number) => a + b, 0) / thisWeekValues.length) : 0;
    const lastAvg = lastWeekValues.length > 0 ? Math.round(lastWeekValues.reduce((a: number, b: number) => a + b, 0) / lastWeekValues.length) : 0;
    return {
      label: item.label || t(`scores.${idx}`),
      thisWeek: thisAvg,
      lastWeek: lastAvg,
      delta: lastAvg > 0 ? thisAvg - lastAvg : null,
    };
  });

  // ── 주간 피부 건강 등급 ──
  const weeklyGrade = (() => {
    const avg = recentMean || overallScore || 0;
    const adherenceNum = weeklyReport.incompleteDays === 0 ? 100 : Math.max(48, 100 - weeklyReport.incompleteDays * 12);
    const composite = Math.round(avg * 0.7 + adherenceNum * 0.3);
    if (composite >= 90) return { grade: "A+", color: "#059669", bg: "#ECFDF5" };
    if (composite >= 80) return { grade: "A", color: "#059669", bg: "#ECFDF5" };
    if (composite >= 70) return { grade: "B+", color: "#2563EB", bg: "#EFF6FF" };
    if (composite >= 60) return { grade: "B", color: "#2563EB", bg: "#EFF6FF" };
    if (composite >= 50) return { grade: "C", color: "#D97706", bg: "#FFFBEB" };
    return { grade: "D", color: "#DC2626", bg: "#FEF2F2" };
  })();

  // ── 바우만 타입별 맞춤 계절 인사이트 ──
  const baumannSeasonInsight = (() => {
    const month = new Date().getMonth() + 1;
    const season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
    const typeChar = finalType?.[0] || "D"; // O or D
    const sensChar = finalType?.[1] || "R"; // S or R
    const tips: string[] = [];
    if (lang === "ko") {
      if (season === "spring") {
        tips.push("봄 환절기에는 꽃가루와 미세먼지가 피부 장벽을 자극합니다.");
        if (sensChar === "S") tips.push("민감성 피부는 이중 세안보다 저자극 클렌저 한 번이 더 안전합니다.");
        if (typeChar === "D") tips.push("건성 피부는 봄에도 보습 크림을 줄이지 마세요. 바람이 수분을 빼앗아요.");
        if (typeChar === "O") tips.push("지성 피부도 봄에는 유수분 밸런스가 무너질 수 있어요. 가벼운 수분 에센스를 추가하세요.");
      } else if (season === "summer") {
        tips.push("여름 자외선과 높은 습도에 대비하세요.");
        if (typeChar === "O") tips.push("지성 피부는 논코메도제닉 선크림으로 모공 부담을 줄이세요.");
        if (sensChar === "S") tips.push("민감성 피부는 물리적 선크림(무기자차)이 더 안전합니다.");
      } else if (season === "autumn") {
        tips.push("가을 환절기는 여름 손상 회복이 핵심입니다.");
        if (typeChar === "D") tips.push("건성 피부는 세라마이드 함유 제품으로 장벽을 다시 쌓아올리세요.");
      } else {
        tips.push("겨울 건조 환경에서 피부 장벽 보호가 최우선입니다.");
        if (typeChar === "D") tips.push("건성 피부는 밤에 오일 세럼 + 크림 이중 보습이 효과적이에요.");
        if (typeChar === "O") tips.push("지성 피부도 겨울에는 가벼운 보습제가 필요합니다. 피지가 줄어도 장벽은 약해져요.");
      }
    } else if (lang === "ja") {
      if (season === "spring") { tips.push("春の花粉やPM2.5が肌バリアを刺激します。"); if (sensChar === "S") tips.push("敏感肌はダブル洗顔より低刺激クレンザー1回が安全です。"); }
      else if (season === "summer") { tips.push("夏の紫外線と高湿度に備えましょう。"); if (typeChar === "O") tips.push("脂性肌はノンコメドジェニック日焼け止めで毛穴負担を軽減。"); }
      else if (season === "autumn") { tips.push("秋は夏のダメージ回復が重要です。"); }
      else { tips.push("冬の乾燥環境では肌バリア保護が最優先です。"); if (typeChar === "D") tips.push("乾燥肌は夜にオイルセラム＋クリームの二重保湿が効果的。"); }
    } else {
      if (season === "spring") { tips.push("Spring pollen and dust can stress your skin barrier."); if (sensChar === "S") tips.push("Sensitive skin should use a gentle cleanser once rather than double cleansing."); }
      else if (season === "summer") { tips.push("Prepare for summer UV and humidity."); if (typeChar === "O") tips.push("Oily skin: use non-comedogenic sunscreen to ease pore burden."); }
      else if (season === "autumn") { tips.push("Autumn is key for recovering summer damage."); }
      else { tips.push("Winter dryness means barrier protection is the top priority."); if (typeChar === "D") tips.push("Dry skin: oil serum + cream double moisture at night works well."); }
    }
    return tips;
  })();

  // ── 오늘/내일 실행 플랜 ──
  const dailyActionPlan = (() => {
    const topConcern = focusConcerns[0]?.key || "hydration";
    if (lang === "ko") {
      return {
        morning: [
          "저자극 클렌저로 가볍게 세안",
          topConcern === "hydration" ? "수분 에센스 → 보습 크림 순서로 레이어링" : topConcern === "redness" ? "진정 토너 → 시카 크림 순서" : "비타민C 세럼 → 선크림",
          "SPF 50+ 선크림 필수 (2시간마다 덧바르기)",
        ],
        evening: [
          "이중 세안 (클렌징 오일 → 폼 클렌저)",
          topConcern === "hydration" ? "히알루론산 세럼 → 세라마이드 크림" : topConcern === "redness" ? "마데카소사이드 앰플 → 판테놀 크림" : "레티놀 세럼 (주 2~3회) → 보습 크림",
          "아이크림으로 눈가 보습 마무리",
        ],
      };
    }
    if (lang === "ja") {
      return {
        morning: [
          "低刺激クレンザーで優しく洗顔",
          topConcern === "hydration" ? "水分エッセンス → 保湿クリーム" : topConcern === "redness" ? "鎮静トナー → シカクリーム" : "ビタミンCセラム → 日焼け止め",
          "SPF50+ 日焼け止め必須",
        ],
        evening: [
          "ダブル洗顔（オイル → フォーム）",
          topConcern === "hydration" ? "ヒアルロン酸セラム → セラミドクリーム" : topConcern === "redness" ? "マデカソサイドアンプル → パンテノールクリーム" : "レチノールセラム（週2-3回）→ 保湿クリーム",
          "アイクリームで目元保湿",
        ],
      };
    }
    return {
      morning: [
        "Gentle cleanser wash",
        topConcern === "hydration" ? "Hydrating essence → Moisturizer" : topConcern === "redness" ? "Calming toner → Cica cream" : "Vitamin C serum → Sunscreen",
        "SPF 50+ sunscreen (reapply every 2h)",
      ],
      evening: [
        "Double cleanse (oil → foam)",
        topConcern === "hydration" ? "Hyaluronic acid serum → Ceramide cream" : topConcern === "redness" ? "Centella ampoule → Panthenol cream" : "Retinol serum (2-3x/week) → Moisturizer",
        "Eye cream for under-eye hydration",
      ],
    };
  })();

  // ── 다음 스캔 추천 ──
  const nextScanRecommendation = (() => {
    const daysSinceLast = snapshots.length > 0
      ? Math.floor((Date.now() - new Date(snapshots[0].createdAt).getTime()) / 86400000)
      : 999;
    if (lang === "ko") {
      if (daysSinceLast === 0) return "오늘 스캔 완료! 내일 같은 시간에 다시 스캔하면 변화를 정확히 추적할 수 있어요.";
      if (daysSinceLast <= 2) return `마지막 스캔 ${daysSinceLast}일 전. 오늘 스캔하면 트렌드가 더 정확해져요.`;
      return `${daysSinceLast}일 동안 스캔이 없어요. 지금 스캔하면 피부 변화를 놓치지 않아요.`;
    }
    if (lang === "ja") {
      if (daysSinceLast === 0) return "今日のスキャン完了！明日同じ時間にスキャンすると変化を正確に追跡できます。";
      if (daysSinceLast <= 2) return `最後のスキャンは${daysSinceLast}日前。今日スキャンするとトレンドがより正確になります。`;
      return `${daysSinceLast}日間スキャンがありません。今スキャンして肌の変化を見逃さないようにしましょう。`;
    }
    if (daysSinceLast === 0) return "Today's scan done! Scan again at the same time tomorrow for accurate tracking.";
    if (daysSinceLast <= 2) return `Last scan ${daysSinceLast} day(s) ago. Scanning today improves trend accuracy.`;
    return `No scan for ${daysSinceLast} days. Scan now to not miss skin changes.`;
  })();

  return {
    copy,
    periodLabel: `${periodStart} - ${periodEnd}`,
    scanCount: snapshots.length,
    memoCount: weeklyReport.memoCount,
    adherence: weeklyReport.incompleteDays === 0 ? "92%" : `${Math.max(48, 100 - weeklyReport.incompleteDays * 12)}%`,
    trendKey,
    trendDesc: copy[`${trendKey}Desc`],
    routineDesc: weeklyReport.incompleteDays <= 1 ? copy.routineStrong : copy.routineWeak,
    executiveSummary,
    focusConcerns,
    ingredientPlan,
    procedurePlan,
    topCauseTags,
    triggerSignals,
    keywordSummary: weeklyReport.keywordSummary,
    routineHighlights: {
      strong: weeklyReport.bestRoutine?.text || copy.notEnough,
      watch: weeklyReport.worstRoutine?.text || copy.notEnough,
    },
    ingredientSignals,
    recoveryGuide: getRecoveryGuide(lang, procedurePlan.map((item) => item.name)),
    radarData,
    seasonGuide,
    forecast,
    cosmeticsSignal: myCosmetics.length > 0
      ? copy.cosmeticsReady.replace("{{count}}", String(myCosmetics.length))
      : copy.cosmeticsMissing,
    // ── 새 데이터 ──
    dailyTrend,
    scoreComparison,
    weeklyGrade,
    baumannSeasonInsight,
    dailyActionPlan,
    nextScanRecommendation,
    trendDelta,
    recentMean: Math.round(recentMean),
    previousMean: Math.round(previousMean),
    finalType,
  };
}
