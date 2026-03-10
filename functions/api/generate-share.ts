import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

// ── Request / Response types ──────────────────────────────────────────────────

interface SlideData {
  lang: string;
  finalType: string;
  overallScore: number;
  skinAge?: number;
  aiComment: string;
  rankingPercentile?: number;
  scores: Array<{ score: number; label: string }>;
  improvements: Array<{ title: string; desc: string }>;
  cosmetics: Array<{ type: string; key: string; reason: string }>;
  nutrients: Record<string, { name: string; foods: string; why: string }>;
  avoidLunch: Array<{ food: string; why: string }>;
  avoidDinner: Array<{ food: string; why: string }>;
  scoreLabels: string[];
  baumannNames: Record<string, string>;
  scoreSuffix: string;
  dateStr: string;
}

// ── Color constants ───────────────────────────────────────────────────────────

const SCAN_FROM = "#E09882";
const SCAN_TO = "#C97062";
const DEEP_GREEN = "#2D5F4F";

const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B", D: "#3B82F6", S: "#EF4444", R: "#10B981",
  P: "#8B5CF6", N: "#06B6D4", W: "#6366F1", T: "#14B8A6",
};

const SCORE_COLORS = [
  "#D4836B", "#3B82C4", "#E05A3A", "#4A7C6E", "#8C8070",
  "#A67C52", "#D97706", "#6366F1", "#F59E0B", "#10B981",
];

const NUTRIENT_COLORS: Record<string, string> = {
  O: "#4A7C6E", D: "#3B82C4", S: "#E05A3A", R: "#10B981",
  P: "#F59E0B", N: "#8B5CF6", W: "#C97062", T: "#10B981",
};

// ── Module-level cache ────────────────────────────────────────────────────────

let resvgInitialized = false;
let fontsCache: { name: string; data: ArrayBuffer; weight: number; style: string }[] | null = null;

async function ensureResvg(): Promise<void> {
  if (resvgInitialized) return;
  await initWasm(fetch("https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm/index_bg.wasm"));
  resvgInitialized = true;
}

async function getFonts() {
  if (fontsCache) return fontsCache;
  const BASE = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static";
  const [regular, bold, black] = await Promise.all([
    fetch(`${BASE}/pretendard-Regular.woff`).then((r) => r.arrayBuffer()),
    fetch(`${BASE}/pretendard-Bold.woff`).then((r) => r.arrayBuffer()),
    fetch(`${BASE}/pretendard-Black.woff`).then((r) => r.arrayBuffer()),
  ]);
  fontsCache = [
    { name: "Pretendard", data: regular, weight: 400, style: "normal" },
    { name: "Pretendard", data: bold,    weight: 700, style: "normal" },
    { name: "Pretendard", data: black,   weight: 900, style: "normal" },
  ];
  return fontsCache;
}

// ── Satori h() helper ─────────────────────────────────────────────────────────
// Satori accepts React.createElement-like objects. No JSX setup needed.

function h(tag: string, props: Record<string, any> | null, ...rawChildren: any[]): any {
  const children = rawChildren.flat(2).filter(
    (c) => c !== null && c !== undefined && c !== false && c !== "",
  );
  const p: Record<string, any> = { ...(props ?? {}) };
  if (children.length > 0) {
    p.children = children.length === 1 ? children[0] : children;
  }
  return { type: tag, props: p };
}

// ── Shared style objects ──────────────────────────────────────────────────────

const cardBase: Record<string, any> = {
  background: "white",
  border: "1px solid rgba(255,255,255,0.8)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
  borderRadius: 24,
  display: "flex",
  flexDirection: "column",
  position: "relative",
  zIndex: 10,
  overflow: "hidden",
};

// ── Shared layout components ──────────────────────────────────────────────────

function solidBg() {
  return h("div", {
    style: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
      overflow: "hidden",
    },
  },
    h("div", { style: { position: "absolute", top: -100, right: -100, width: 350, height: 350, borderRadius: 175, background: `${SCAN_FROM}1A` } }),
    h("div", { style: { position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: 200, background: "#E0E7FF30" } }),
  );
}

function slideHeader(dateStr: string) {
  return h("div", {
    style: {
      padding: "32px 32px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0,
      position: "relative",
      zIndex: 10,
    },
  },
    // Logo
    h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
      h("div", {
        style: {
          width: 24, height: 24, borderRadius: 6,
          background: `linear-gradient(135deg, ${SCAN_FROM}, ${SCAN_TO})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        },
      },
        h("span", { style: { fontSize: 14, color: "white", lineHeight: 1 } }, "\u2736"),
      ),
      h("div", {
        style: { color: "#1E293B", fontSize: 18, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 },
      }, "FondayAI"),
    ),
    // Date pill
    h("div", {
      style: {
        background: "white", padding: "6px 14px", borderRadius: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      },
    },
      h("div", { style: { color: SCAN_TO, fontSize: 13, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 } }, dateStr),
    ),
  );
}

function slideFooter() {
  return h("div", {
    style: { padding: "0 32px 32px", flexShrink: 0, position: "relative", zIndex: 10 },
  },
    h("div", {
      style: {
        background: "white", border: "1px solid #E2E8F0", borderRadius: 100,
        padding: "14px 22px", display: "flex", justifyContent: "space-between",
        alignItems: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      },
    },
      h("div", { style: { fontSize: 14, fontWeight: 900, color: "#1E293B", lineHeight: 1 } },
        "\u{1F525} 나랑 같이 ",
        h("span", { style: { color: SCAN_TO } }, "피부 챌린지"),
        " 할 사람?",
      ),
      h("div", { style: { background: "#F1F5F9", padding: "6px 12px", borderRadius: 100 } },
        h("div", { style: { fontSize: 12, fontWeight: 800, color: "#64748B", lineHeight: 1 } }, "검색창 Fonday AI"),
      ),
    ),
  );
}

// ── SVG → PNG ─────────────────────────────────────────────────────────────────

async function svgToPng(svg: string): Promise<string> {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } });
  const pngData = resvg.render();
  const bytes = pngData.asPng();
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return "data:image/png;base64," + btoa(binary);
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────

function buildSlide1(d: SlideData): any {
  const { finalType, overallScore, skinAge, aiComment, rankingPercentile, scoreSuffix, baumannNames, dateStr } = d;

  // Ranking badge (prominent if available)
  const rankBadge = rankingPercentile !== undefined
    ? h("div", {
        style: {
          background: "linear-gradient(135deg, #1E293B, #0F172A)",
          padding: "10px 20px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
        },
      },
        h("span", { style: { fontSize: 13, fontWeight: 800, color: "#94A3B8", lineHeight: 1 } }, "\u{1F451} 상위 "),
        h("span", { style: { fontSize: 18, fontWeight: 900, color: "#FBBF24", lineHeight: 1 } }, `${rankingPercentile}%`),
        h("span", { style: { fontSize: 13, fontWeight: 800, color: "#94A3B8", lineHeight: 1 } }, " 랭커"),
      )
    : null;

  const baumannBadges = finalType.split("").map((letter) => {
    const color = BAUMANN_COLORS[letter] || "#000";
    return h("div", {
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
        padding: "6px 12px", borderRadius: 100,
        background: `${color}1A`, border: `1px solid ${color}4D`, color, lineHeight: 1,
      },
    }, baumannNames[letter] || letter);
  });

  const scoreBox = h("div", { style: { display: "flex", width: "100%", gap: 12 } },
    h("div", {
      style: {
        flex: 1, background: "#F8FAFC", borderRadius: 16,
        padding: "16px 12px", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      },
    },
      h("div", {
        style: {
          display: "flex", alignItems: "flex-end",
          fontSize: 36, fontWeight: 900, color: SCAN_TO, lineHeight: 1, marginBottom: 8,
        },
      },
        h("span", null, `${overallScore}`),
        h("span", { style: { fontSize: 14, color: "#94A3B8", marginLeft: 2, marginBottom: 4 } }, scoreSuffix),
      ),
      h("div", { style: { fontSize: 11, color: "#64748B", fontWeight: 800, lineHeight: 1 } }, "종합 스코어"),
    ),
    skinAge != null && skinAge > 0
      ? h("div", {
          style: {
            flex: 1, background: "#F8FAFC", borderRadius: 16,
            padding: "16px 12px", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          },
        },
          h("div", {
            style: {
              display: "flex", alignItems: "flex-end",
              fontSize: 36, fontWeight: 900, color: "#8B5CF6", lineHeight: 1, marginBottom: 8,
            },
          },
            h("span", null, `${skinAge}`),
            h("span", { style: { fontSize: 14, color: "#94A3B8", marginLeft: 2, marginBottom: 4 } }, "세"),
          ),
          h("div", { style: { fontSize: 11, color: "#64748B", fontWeight: 800, lineHeight: 1 } }, "피부 나이"),
        )
      : null,
  );

  return h("div", {
    style: { width: 540, height: 675, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Pretendard" },
  },
    solidBg(),
    slideHeader(dateStr),
    h("div", {
      style: {
        flex: 1, padding: "16px 32px", display: "flex",
        flexDirection: "column", justifyContent: "center", gap: 14, zIndex: 10, position: "relative",
      },
    },
      // Main card
      h("div", { style: { ...cardBase, padding: 28, alignItems: "center", textAlign: "center" } },
        rankBadge,
        h("div", { style: { color: "#64748B", fontSize: 12, fontWeight: 900, letterSpacing: 2, marginBottom: 6, lineHeight: 1 } }, "SKIN ANALYSIS"),
        h("div", { style: { fontSize: 60, fontWeight: 900, color: SCAN_TO, letterSpacing: -1, lineHeight: 1, marginBottom: 14 } }, finalType),
        h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 } }, ...baumannBadges),
        scoreBox,
      ),
      // AI comment
      aiComment
        ? h("div", {
            style: {
              ...cardBase, padding: "18px 20px",
              flexDirection: "row", gap: 12, alignItems: "center",
              background: "linear-gradient(135deg, white, #FFF9F2)",
            },
          },
            h("p", {
              style: {
                fontSize: 13, color: "#334155", lineHeight: 1.45,
                margin: 0, fontWeight: 700,
              },
            }, `"${aiComment}"`),
          )
        : null,
    ),
    slideFooter(),
  );
}

// ── Slide 2: Specs ────────────────────────────────────────────────────────────

function buildSlide2(d: SlideData): any {
  const { scores, scoreLabels, dateStr } = d;

  const scoreRows = scores.map((s, i) => {
    const color = SCORE_COLORS[i] || DEEP_GREEN;
    const label = scoreLabels[i] || s.label;
    return h("div", { style: { width: "100%" } },
      h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 } },
        h("span", { style: { fontSize: 13, fontWeight: 800, color: "#475569", lineHeight: 1 } }, label),
        h("span", { style: { fontSize: 15, fontWeight: 900, color, lineHeight: 1 } }, `${s.score}`),
      ),
      h("div", { style: { height: 6, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" } },
        h("div", { style: { height: "100%", width: `${s.score}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99 } }),
      ),
    );
  });

  return h("div", {
    style: { width: 540, height: 675, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Pretendard" },
  },
    solidBg(),
    slideHeader(dateStr),
    h("div", { style: { padding: "12px 32px 0", flexShrink: 0, zIndex: 10, position: "relative" } },
      h("div", { style: { fontSize: 26, fontWeight: 900, color: "#1E293B", letterSpacing: -1, marginBottom: 4, lineHeight: 1 } }, "SKIN SPECS"),
      h("div", { style: { fontSize: 14, color: "#64748B", fontWeight: 700, lineHeight: 1 } }, "10가지 세부 스펙 분석"),
    ),
    h("div", { style: { flex: 1, padding: "16px 32px", display: "flex", flexDirection: "column", zIndex: 10 } },
      h("div", { style: { ...cardBase, padding: "20px 24px", flex: 1, justifyContent: "space-between", gap: 8 } },
        ...scoreRows,
      ),
    ),
    slideFooter(),
  );
}

// ── Slide 3: Solution ─────────────────────────────────────────────────────────

function buildSlide3(d: SlideData): any {
  const { improvements, cosmetics, dateStr } = d;

  const impStyles = [
    { color: "#F43F5E", bg: "#FFF1F2" },
    { color: "#10B981", bg: "#ECFDF5" },
    { color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  const impCards = improvements.slice(0, 3).map((imp, i) => {
    const { color, bg } = impStyles[i];
    return h("div", {
      style: {
        ...cardBase, flex: 1, padding: "16px 20px", justifyContent: "center",
        borderLeft: `6px solid ${color}`,
        background: `linear-gradient(90deg, ${bg}, white)`,
      },
    },
      h("div", { style: { fontSize: 15, fontWeight: 900, color: "#1E293B", lineHeight: 1, marginBottom: 8 } }, imp.title),
      h("p", { style: { fontSize: 13, color: "#475569", lineHeight: 1.45, margin: 0, fontWeight: 600 } }, imp.desc),
    );
  });

  return h("div", {
    style: { width: 540, height: 675, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Pretendard" },
  },
    solidBg(),
    slideHeader(dateStr),
    h("div", { style: { padding: "12px 32px 0", flexShrink: 0, zIndex: 10, position: "relative" } },
      h("div", { style: { fontSize: 26, fontWeight: 900, color: "#1E293B", letterSpacing: -1, marginBottom: 4, lineHeight: 1 } }, "AI SOLUTION"),
      h("div", { style: { fontSize: 14, color: "#64748B", fontWeight: 700, lineHeight: 1 } }, "나만을 위한 맞춤 스킨케어 처방"),
    ),
    h("div", {
      style: { flex: 1, padding: "16px 32px", display: "flex", flexDirection: "column", gap: 12, zIndex: 10 },
    },
      ...impCards,
      cosmetics.length > 0
        ? h("div", {
            style: {
              ...cardBase, padding: "16px 20px", flexShrink: 0,
              flexDirection: "row", gap: 12, alignItems: "center", background: "#F8FAFC",
            },
          },
            h("div", { style: { fontSize: 24, lineHeight: 1 } }, "\u{1F9EA}"),
            h("div", { style: { flex: 1 } },
              h("div", { style: { fontSize: 10, fontWeight: 900, color: "#64748B", marginBottom: 4, letterSpacing: 0.5, lineHeight: 1 } }, "RECOMMENDED INGREDIENT"),
              h("div", { style: { fontSize: 15, fontWeight: 900, color: SCAN_TO, marginBottom: 4, lineHeight: 1 } }, cosmetics[0].key),
              h("div", { style: { fontSize: 12, color: "#475569", fontWeight: 600, lineHeight: 1.2 } }, cosmetics[0].reason),
            ),
          )
        : null,
    ),
    slideFooter(),
  );
}

// ── Slide 4: Inner Beauty ─────────────────────────────────────────────────────

function buildSlide4(d: SlideData): any {
  const { finalType, nutrients, dateStr } = d;

  const letters = finalType.split("").filter((l) => l in NUTRIENT_COLORS);

  const nutrientCards = letters.map((letter) => {
    const nutrient = nutrients[letter];
    if (!nutrient) return null;
    const color = NUTRIENT_COLORS[letter];
    return h("div", {
      style: {
        ...cardBase,
        width: "calc(50% - 6px)",
        padding: 16, justifyContent: "space-between",
        background: "linear-gradient(135deg, white, #F8FAFC)",
      },
    },
      h("div", null,
        h("div", {
          style: {
            width: 36, height: 36, borderRadius: 12,
            background: `${color}1A`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 12,
          },
        },
          h("div", { style: { fontSize: 16, fontWeight: 900, color, lineHeight: 1 } }, letter),
        ),
        h("div", { style: { fontSize: 15, fontWeight: 900, color, marginBottom: 4, lineHeight: 1 } }, nutrient.name),
        h("div", { style: { fontSize: 11, color: "#64748B", fontWeight: 800, lineHeight: 1.2, marginBottom: 8 } }, nutrient.foods),
      ),
      h("p", { style: { fontSize: 12, color: "#475569", lineHeight: 1.4, margin: 0, fontWeight: 600 } }, nutrient.why),
    );
  }).filter(Boolean);

  return h("div", {
    style: { width: 540, height: 675, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Pretendard" },
  },
    solidBg(),
    slideHeader(dateStr),
    h("div", { style: { padding: "12px 32px 0", flexShrink: 0, zIndex: 10, position: "relative" } },
      h("div", { style: { fontSize: 26, fontWeight: 900, color: "#1E293B", letterSpacing: -1, marginBottom: 4, lineHeight: 1 } }, "INNER BEAUTY"),
      h("div", { style: { fontSize: 14, color: "#64748B", fontWeight: 700, lineHeight: 1, display: "flex", gap: 4 } },
        h("span", { style: { color: SCAN_TO, fontWeight: 900 } }, finalType),
        h("span", null, " 맞춤 이너뷰티 솔루션"),
      ),
    ),
    h("div", {
      style: {
        flex: 1, padding: "16px 32px",
        display: "flex", flexWrap: "wrap",
        gap: 12, zIndex: 10, alignContent: "flex-start",
      },
    },
      ...nutrientCards,
    ),
    slideFooter(),
  );
}

// ── Slide 5: Danger Zone ──────────────────────────────────────────────────────

function buildSlide5(d: SlideData): any {
  const { avoidLunch, avoidDinner, dateStr } = d;

  function avoidList(items: Array<{ food: string; why: string }>) {
    return items.map((item) =>
      h("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
        h("div", { style: { fontSize: 13, fontWeight: 900, color: "#EF4444", lineHeight: 1, marginTop: 2 } }, "✕"),
        h("div", null,
          h("p", { style: { fontSize: 14, fontWeight: 900, color: "#1E293B", margin: "0 0 4px", lineHeight: 1 } }, item.food),
          h("p", { style: { fontSize: 12, color: "#64748B", margin: 0, fontWeight: 600, lineHeight: 1.3 } }, item.why),
        ),
      )
    );
  }

  function avoidCard(
    items: Array<{ food: string; why: string }>,
    label: string,
    borderColor: string,
    bgGradient: string,
    borderColor2: string,
    textColor: string,
  ) {
    return h("div", {
      style: { ...cardBase, flex: 1, padding: 20, borderTop: `6px solid ${borderColor}`, background: bgGradient },
    },
      h("div", {
        style: {
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 16, borderBottom: `1px solid ${borderColor2}`, paddingBottom: 12,
        },
      },
        h("span", { style: { fontSize: 15, fontWeight: 900, color: textColor, lineHeight: 1 } }, label),
      ),
      h("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 } },
        ...avoidList(items),
      ),
    );
  }

  return h("div", {
    style: { width: 540, height: 675, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Pretendard" },
  },
    solidBg(),
    slideHeader(dateStr),
    h("div", { style: { padding: "12px 32px 0", flexShrink: 0, zIndex: 10, position: "relative" } },
      h("div", { style: { fontSize: 26, fontWeight: 900, color: "#1E293B", letterSpacing: -1, marginBottom: 4, lineHeight: 1 } }, "DANGER ZONE"),
      h("div", { style: { fontSize: 14, color: "#64748B", fontWeight: 700, lineHeight: 1 } }, "오늘은 이거 딱 참아보자!"),
    ),
    h("div", {
      style: { flex: 1, padding: "16px 32px", display: "flex", flexDirection: "column", gap: 14, zIndex: 10 },
    },
      avoidCard(avoidLunch, "DAYTIME AVOID", "#F59E0B", "linear-gradient(180deg, white, #FFFBEB)", "#FCD34D", "#D97706"),
      avoidCard(avoidDinner, "NIGHTTIME AVOID", "#8B5CF6", "linear-gradient(180deg, white, #F5F3FF)", "#C4B5FD", "#7C3AED"),
    ),
    slideFooter(),
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  let body: SlideData;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS });
  }

  // Initialize WASM and fonts in parallel
  const [fonts] = await Promise.all([getFonts(), ensureResvg()]);

  const satoriOpts = { width: 540, height: 675, fonts };
  const builders = [buildSlide1, buildSlide2, buildSlide3, buildSlide4, buildSlide5];
  const slides: string[] = [];

  for (const build of builders) {
    const svg = await satori(build(body), satoriOpts);
    const png = await svgToPng(svg);
    slides.push(png);
  }

  return new Response(JSON.stringify({ slides }), { headers: CORS });
};
