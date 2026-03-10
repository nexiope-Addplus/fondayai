import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-ignore – pre-compiled WebAssembly.Module from Cloudflare Pages bundler
import resvgWasm from "./resvg.wasm";

// ── Types ─────────────────────────────────────────────────────────────────────
interface I18nTexts {
  rankLabel: string;         // "랭커" / "Ranker" / "ランカー"
  overallScoreLabel: string; // "종합 스코어" / "Overall Score" / "総合スコア"
  skinAgeLabel: string;      // "피부 나이" / "Skin Age" / "肌年齢"
  skinAgeSuffix: string;     // "세" / "yrs" / "歳"
  slide2Sub: string;
  slide3Sub: string;
  recIngredient: string;
  slide4Sub: string;
  slide5Sub: string;
  footerText: string;
}

interface SlideData {
  lang: string;
  fontFamily: string;
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
  i18nTexts: I18nTexts;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const SCAN_FROM = "#E09882";
const SCAN_TO   = "#C97062";

const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B", D: "#3B82F6", S: "#EF4444", R: "#10B981",
  P: "#8B5CF6", N: "#06B6D4", W: "#6366F1", T: "#14B8A6",
};

const SCORE_COLORS = [
  "#D4836B","#3B82C4","#E05A3A","#4A7C6E","#8C8070",
  "#A67C52","#D97706","#6366F1","#F59E0B","#10B981",
];

// ── WASM + font cache ─────────────────────────────────────────────────────────
let resvgReady = false;
const fontCache: Record<string, Uint8Array[]> = {};

async function ensureResvg() {
  if (resvgReady) return;
  await initWasm(resvgWasm);
  resvgReady = true;
}

const PRETENDARD = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";
const NOTO_JP    = "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.5/files";

async function getFonts(lang: string): Promise<Uint8Array[]> {
  const key = lang === "ja" ? "ja" : "default";
  if (fontCache[key]) return fontCache[key];

  let buffers: Uint8Array[];
  if (lang === "ja") {
    // Noto Sans JP: Japanese subset + Latin supplement (covers hiragana, katakana, kanji, ASCII)
    const [jp400, jp700, la400, la700] = await Promise.all([
      fetch(`${NOTO_JP}/noto-sans-jp-japanese-400-normal.woff2`).then(x => x.arrayBuffer()),
      fetch(`${NOTO_JP}/noto-sans-jp-japanese-700-normal.woff2`).then(x => x.arrayBuffer()),
      fetch(`${NOTO_JP}/noto-sans-jp-latin-400-normal.woff2`).then(x => x.arrayBuffer()),
      fetch(`${NOTO_JP}/noto-sans-jp-latin-700-normal.woff2`).then(x => x.arrayBuffer()),
    ]);
    buffers = [jp400, jp700, la400, la700].map(b => new Uint8Array(b));
  } else {
    const [r, b, bk] = await Promise.all([
      fetch(`${PRETENDARD}/Pretendard-Regular.otf`).then(x => x.arrayBuffer()),
      fetch(`${PRETENDARD}/Pretendard-Bold.otf`).then(x => x.arrayBuffer()),
      fetch(`${PRETENDARD}/Pretendard-Black.otf`).then(x => x.arrayBuffer()),
    ]);
    buffers = [r, b, bk].map(b => new Uint8Array(b));
  }
  fontCache[key] = buffers;
  return buffers;
}

// ── SVG → PNG ─────────────────────────────────────────────────────────────────
async function svgToPng(svgStr: string, fonts: Uint8Array[], fontFamily: string): Promise<string> {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: "width", value: 1080 },
    font: { fontBuffers: fonts, defaultFontFamily: fontFamily, loadSystemFonts: false } as any,
  });
  const pngData = resvg.render();
  const bytes = pngData.asPng();
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return "data:image/png;base64," + btoa(bin);
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
const W = 1080, H = 1350;
const PAD = 60;

function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// CJK detection (hiragana, katakana, CJK unified ideographs)
function isCJK(str: string): boolean {
  return /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/.test(str);
}

function wrap(str: string, maxCh: number): string[] {
  if (isCJK(str)) {
    // Character-based wrapping for Japanese/Chinese (no space between words)
    const out: string[] = [];
    let line = "";
    for (const ch of str) {
      if (line.length >= maxCh) { out.push(line); line = ""; }
      line += ch;
    }
    if (line) out.push(line);
    return out.length ? out : [""];
  }
  // Space-based wrapping for Latin/Korean
  const out: string[] = [];
  const words = str.split(" ");
  let line = "";
  for (const w of words) {
    const candidate = line ? line + " " + w : w;
    if (candidate.length > maxCh) {
      if (line) out.push(line);
      let rem = w;
      while (rem.length > maxCh) { out.push(rem.slice(0, maxCh)); rem = rem.slice(maxCh); }
      line = rem;
    } else {
      line = candidate;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

// tx: SVG text element. ff = font-family
function tx(
  x: number, y: number, content: string,
  size: number, fill: string,
  opts?: { weight?: number; anchor?: "start"|"middle"|"end"; opacity?: number; ff?: string }
): string {
  const { weight = 400, anchor = "start", opacity = 1, ff = "Pretendard" } = opts ?? {};
  return `<text x="${x}" y="${y}" font-family="${ff}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(content)}</text>`;
}

function rect(x: number, y: number, w: number, h: number, fill: string, rx = 0): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${rx ? `rx="${rx}"` : ""}/>`;
}

// Common header
function header(dateStr: string, ff: string): { svg: string; y: number } {
  let s = "";
  s += rect(0, 0, W, 10, `url(#grad)`);
  s += tx(PAD, 80, "FondayAI", 38, "#1E293B", { weight: 900, ff });
  s += tx(W - PAD, 80, dateStr, 28, SCAN_TO, { weight: 800, anchor: "end", ff });
  s += rect(PAD, 100, W - PAD * 2, 2, "#E2E8F0");
  return { svg: s, y: 130 };
}

// Common footer
function footer(text: string, ff: string): string {
  const FY = H - 110;
  let s = rect(PAD, FY, W - PAD * 2, 80, "white", 40);
  s += tx(W / 2, FY + 52, text, 26, "#1E293B", { weight: 900, anchor: "middle", ff });
  return s;
}

const DEFS = `
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${SCAN_FROM}"/><stop offset="100%" stop-color="${SCAN_TO}"/>
  </linearGradient>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#F1F5F9"/>
  </linearGradient>`;

function slide(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${DEFS}</defs>${rect(0, 0, W, H, "url(#bgGrad)")}${inner}</svg>`;
}

// ── Slide 1: Cover ────────────────────────────────────────────────────────────
function buildSvgSlide1(d: SlideData): string {
  const ff = d.fontFamily;
  const { finalType, overallScore, skinAge, aiComment, rankingPercentile, scoreSuffix, baumannNames, dateStr, i18nTexts } = d;
  const { svg: hdrSvg, y: hY } = header(dateStr, ff);
  let s = hdrSvg;
  let y = hY + 20;

  // Ranking badge
  if (rankingPercentile !== undefined) {
    s += rect(W / 2 - 160, y, 320, 64, "#1E293B", 32);
    s += tx(W / 2, y + 42, `TOP ${rankingPercentile}% ${i18nTexts.rankLabel}`, 30, "#FBBF24", { weight: 900, anchor: "middle", ff });
    y += 84;
  }

  // Baumann type
  s += tx(W / 2, y + 180, finalType, 200, SCAN_TO, { weight: 900, anchor: "middle", ff });
  y += 220;

  // Baumann badges
  const letters = finalType.split("");
  const pW = Math.min(180, (W - PAD * 2 - (letters.length - 1) * 16) / letters.length);
  const pTotalW = letters.length * pW + (letters.length - 1) * 16;
  let px = (W - pTotalW) / 2;
  for (const letter of letters) {
    const c = BAUMANN_COLORS[letter] || "#64748B";
    s += `<rect x="${px}" y="${y}" width="${pW}" height="56" fill="${c}22" rx="28"/>`;
    s += `<rect x="${px}" y="${y}" width="${pW}" height="56" fill="none" stroke="${c}" stroke-opacity="0.5" stroke-width="2" rx="28"/>`;
    s += tx(px + pW / 2, y + 38, baumannNames[letter] || letter, 24, c, { weight: 800, anchor: "middle", ff });
    px += pW + 16;
  }
  y += 80;

  // Score boxes
  const hasSkinAge = skinAge != null && skinAge > 0;
  const boxW = hasSkinAge ? 440 : 500;
  const boxH = 130;
  const totalW = hasSkinAge ? boxW * 2 + 20 : boxW;
  const boxX = (W - totalW) / 2;

  s += rect(boxX, y, boxW, boxH, "white", 24);
  s += tx(boxX + boxW / 2, y + 76, `${overallScore}${scoreSuffix}`, 72, SCAN_TO, { weight: 900, anchor: "middle", ff });
  s += tx(boxX + boxW / 2, y + 112, i18nTexts.overallScoreLabel, 26, "#94A3B8", { weight: 700, anchor: "middle", ff });

  if (hasSkinAge) {
    const bx2 = boxX + boxW + 20;
    s += rect(bx2, y, boxW, boxH, "white", 24);
    s += tx(bx2 + boxW / 2, y + 76, `${skinAge}${i18nTexts.skinAgeSuffix}`, 72, "#8B5CF6", { weight: 900, anchor: "middle", ff });
    s += tx(bx2 + boxW / 2, y + 112, i18nTexts.skinAgeLabel, 26, "#94A3B8", { weight: 700, anchor: "middle", ff });
  }
  y += boxH + 30;

  // AI comment
  if (aiComment) {
    const lines = wrap(`"${aiComment}"`, 26);
    const cH = 60 + lines.length * 50;
    s += rect(PAD, y, W - PAD * 2, cH, "white", 24);
    lines.forEach((ln, i) => {
      s += tx(W / 2, y + 50 + i * 50, ln, 30, "#334155", { weight: 700, anchor: "middle", ff });
    });
    y += cH + 16;
  }

  s += footer(i18nTexts.footerText, ff);
  return slide(s);
}

// ── Slide 2: Skin Specs ───────────────────────────────────────────────────────
function buildSvgSlide2(d: SlideData): string {
  const ff = d.fontFamily;
  const { scores, scoreLabels, dateStr, i18nTexts } = d;
  const { svg: hdrSvg, y: hY } = header(dateStr, ff);
  let s = hdrSvg;

  s += tx(PAD, hY + 50, "SKIN SPECS", 52, "#1E293B", { weight: 900, ff });
  s += tx(PAD, hY + 90, i18nTexts.slide2Sub, 28, "#64748B", { weight: 700, ff });

  const cardY = hY + 120;
  const cardH = H - cardY - 130;
  s += rect(PAD, cardY, W - PAD * 2, cardH, "white", 24);

  const rowH = Math.floor(cardH / 10);
  const barX = PAD + 20, barW = W - PAD * 2 - 40;
  const labelW = 260, scoreW = 80;
  const progressX = barX + labelW + 16;
  const progressW = barW - labelW - scoreW - 32;

  scores.forEach((sc, i) => {
    const color = SCORE_COLORS[i] || "#64748B";
    const label = scoreLabels[i] || sc.label;
    const rowY = cardY + i * rowH;
    const midY = rowY + rowH / 2;

    s += tx(barX, midY + 10, label, 26, "#475569", { weight: 800, ff });
    s += rect(progressX, midY - 8, progressW, 16, "#F1F5F9", 8);
    s += rect(progressX, midY - 8, Math.round(progressW * sc.score / 100), 16, color, 8);
    s += tx(barX + barW - scoreW, midY + 10, String(sc.score), 30, color, { weight: 900, anchor: "end", ff });

    if (i < 9) s += rect(barX, rowY + rowH - 1, barW, 1, "#F1F5F9");
  });

  s += footer(i18nTexts.footerText, ff);
  return slide(s);
}

// ── Slide 3: AI Solution ──────────────────────────────────────────────────────
function buildSvgSlide3(d: SlideData): string {
  const ff = d.fontFamily;
  const { improvements, cosmetics, dateStr, i18nTexts } = d;
  const { svg: hdrSvg, y: hY } = header(dateStr, ff);
  let s = hdrSvg;

  s += tx(PAD, hY + 50, "AI SOLUTION", 52, "#1E293B", { weight: 900, ff });
  s += tx(PAD, hY + 90, i18nTexts.slide3Sub, 28, "#64748B", { weight: 700, ff });

  const impColors = ["#F43F5E", "#10B981", "#8B5CF6"];
  const impBgs = ["#FFF1F2", "#ECFDF5", "#F5F3FF"];
  let y = hY + 130;
  const cardW = W - PAD * 2;

  improvements.slice(0, 3).forEach((imp, i) => {
    const c = impColors[i];
    const bg = impBgs[i];
    const descLines = wrap(imp.desc, 36);
    const cardH = 80 + descLines.length * 44;
    s += rect(PAD, y, cardW, cardH, bg, 20);
    s += rect(PAD, y, 8, cardH, c, 4);
    s += tx(PAD + 30, y + 40, imp.title, 32, "#1E293B", { weight: 900, ff });
    descLines.forEach((ln, j) => {
      s += tx(PAD + 30, y + 72 + j * 44, ln, 26, "#475569", { weight: 600, ff });
    });
    y += cardH + 20;
  });

  if (cosmetics.length > 0) {
    const cos = cosmetics[0];
    const cLines = wrap(cos.reason, 38);
    const cosH = 72 + cLines.length * 40;
    s += rect(PAD, y, cardW, cosH, "white", 20);
    s += tx(PAD + 20, y + 36, i18nTexts.recIngredient, 20, "#64748B", { weight: 900, ff });
    s += tx(PAD + 20, y + 68, cos.key, 32, SCAN_TO, { weight: 900, ff });
    cLines.forEach((ln, j) => {
      s += tx(PAD + 20, y + 68 + 38 + j * 40, ln, 24, "#475569", { weight: 600, ff });
    });
  }

  s += footer(i18nTexts.footerText, ff);
  return slide(s);
}

// ── Slide 4: Inner Beauty ─────────────────────────────────────────────────────
function buildSvgSlide4(d: SlideData): string {
  const ff = d.fontFamily;
  const { finalType, nutrients, dateStr, i18nTexts } = d;
  const { svg: hdrSvg, y: hY } = header(dateStr, ff);
  let s = hdrSvg;

  s += tx(PAD, hY + 50, "INNER BEAUTY", 52, "#1E293B", { weight: 900, ff });
  s += tx(PAD, hY + 90, `${finalType} ${i18nTexts.slide4Sub}`, 28, "#64748B", { weight: 700, ff });

  const letters = finalType.split("").filter(l => l in nutrients);
  const colW = (W - PAD * 2 - 20) / 2;
  const startY = hY + 120;

  letters.slice(0, 4).forEach((letter, i) => {
    const nut = nutrients[letter];
    if (!nut) return;
    const col = i % 2, row = Math.floor(i / 2);
    const cx = PAD + col * (colW + 20);
    const cy = startY + row * 480;
    const color = BAUMANN_COLORS[letter] || "#64748B";

    const whyLines = wrap(nut.why, 20);
    const cardH = 200 + whyLines.length * 38;
    s += rect(cx, cy, colW, cardH, "white", 20);
    s += rect(cx + 20, cy + 20, 60, 60, `${color}22`, 16);
    s += tx(cx + 50, cy + 62, letter, 36, color, { weight: 900, anchor: "middle", ff });
    s += tx(cx + 20, cy + 110, nut.name, 32, color, { weight: 900, ff });
    s += tx(cx + 20, cy + 148, nut.foods, 22, "#64748B", { weight: 800, ff });
    whyLines.forEach((ln, j) => {
      s += tx(cx + 20, cy + 182 + j * 38, ln, 22, "#475569", { weight: 600, ff });
    });
  });

  s += footer(i18nTexts.footerText, ff);
  return slide(s);
}

// ── Slide 5: Danger Zone ──────────────────────────────────────────────────────
function buildSvgSlide5(d: SlideData): string {
  const ff = d.fontFamily;
  const { avoidLunch, avoidDinner, dateStr, i18nTexts } = d;
  const { svg: hdrSvg, y: hY } = header(dateStr, ff);
  let s = hdrSvg;

  s += tx(PAD, hY + 50, "DANGER ZONE", 52, "#1E293B", { weight: 900, ff });
  s += tx(PAD, hY + 90, i18nTexts.slide5Sub, 28, "#64748B", { weight: 700, ff });

  function avoidSection(
    items: Array<{ food: string; why: string }>,
    label: string, topColor: string, startY: number
  ): { svg: string; endY: number } {
    let itemsH = 0;
    const itemHeights: number[] = [];
    for (const item of items.slice(0, 3)) {
      const ih = 60 + wrap(item.why, 36).length * 36;
      itemHeights.push(ih);
      itemsH += ih;
    }
    const sectionH = 80 + itemsH;

    let inner = rect(PAD, startY, W - PAD * 2, sectionH, "white", 20);
    inner += rect(PAD, startY, W - PAD * 2, 8, topColor, 4);
    inner += tx(PAD + 20, startY + 48, label, 28, topColor, { weight: 900, ff });
    inner += rect(PAD + 20, startY + 60, W - PAD * 2 - 40, 2, `${topColor}40`);

    let iy = startY + 72;
    items.slice(0, 3).forEach((item, idx) => {
      const whyLines = wrap(item.why, 36);
      inner += tx(PAD + 14, iy + 32, "X", 26, "#EF4444", { weight: 900, ff });
      inner += tx(PAD + 46, iy + 36, item.food, 30, "#1E293B", { weight: 900, ff });
      whyLines.forEach((ln, j) => {
        inner += tx(PAD + 46, iy + 68 + j * 36, ln, 24, "#64748B", { weight: 600, ff });
      });
      iy += itemHeights[idx];
    });

    return { svg: inner, endY: startY + sectionH };
  }

  const sec1 = avoidSection(avoidLunch, "DAYTIME AVOID", "#F59E0B", hY + 130);
  s += sec1.svg;
  const sec2 = avoidSection(avoidDinner, "NIGHTTIME AVOID", "#8B5CF6", sec1.endY + 20);
  s += sec2.svg;

  s += footer(i18nTexts.footerText, ff);
  return slide(s);
}

// ── Fallback i18nTexts (Korean) ───────────────────────────────────────────────
const FALLBACK_I18N: I18nTexts = {
  rankLabel: "랭커",
  overallScoreLabel: "종합 스코어",
  skinAgeLabel: "피부 나이",
  skinAgeSuffix: "세",
  slide2Sub: "10가지 세부 스펙 분석",
  slide3Sub: "나만을 위한 맞춤 스킨케어 처방",
  recIngredient: "RECOMMENDED INGREDIENT",
  slide4Sub: "맞춤 이너뷰티 솔루션",
  slide5Sub: "오늘은 이거 딱 참아보자!",
  footerText: "피부 챌린지 같이 할 사람? 검색 > Fonday AI",
};

// ── CORS + handler ────────────────────────────────────────────────────────────
const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  if (context.request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (context.request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

  let body: SlideData;
  try { body = await context.request.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS }); }

  // Compute fontFamily server-side based on lang
  body.fontFamily = body.lang === "ja" ? "Noto Sans JP" : "Pretendard";
  // Fallback for clients that don't send i18nTexts yet
  if (!body.i18nTexts) body.i18nTexts = FALLBACK_I18N;

  let fonts: Uint8Array[];
  try {
    [fonts] = await Promise.all([getFonts(body.lang), ensureResvg()]);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "init failed", detail: String(e?.message ?? e) }), { status: 500, headers: CORS });
  }

  const builders = [buildSvgSlide1, buildSvgSlide2, buildSvgSlide3, buildSvgSlide4, buildSvgSlide5];
  const slides: string[] = [];

  for (let i = 0; i < builders.length; i++) {
    try {
      const svgStr = builders[i](body);
      const png = await svgToPng(svgStr, fonts, body.fontFamily);
      slides.push(png);
    } catch (e: any) {
      return new Response(JSON.stringify({ error: `slide${i + 1} failed`, detail: String(e?.message ?? e) }), { status: 500, headers: CORS });
    }
  }

  return new Response(JSON.stringify({ slides }), { headers: CORS });
};
