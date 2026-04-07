/**
 * POST /api/admin/insta-image — 캐러셀 슬라이드를 이미지(PNG)로 변환
 * Body: { key, contentId } — insta_content 테이블의 ID
 * Response: { slides: ["data:image/png;base64,...", ...] }
 *
 * 기존 generate-share.ts의 resvg+SVG 파이프라인을 재활용
 */
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-ignore
import resvgWasm from "../resvg.wasm";

interface Env {
  FONDAY_DB: D1Database;
  ADMIN_KEY?: string;
}

// ── WASM + font cache ─────────────────────────────────────────────────────────
let resvgReady = false;
let fontBufs: Uint8Array[] | null = null;

const PRETENDARD = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";

async function ensureResvg() {
  if (resvgReady) return;
  await initWasm(resvgWasm);
  resvgReady = true;
}

async function getFonts(): Promise<Uint8Array[]> {
  if (fontBufs) return fontBufs;
  const [r, b, bk] = await Promise.all([
    fetch(`${PRETENDARD}/Pretendard-Regular.otf`).then(x => x.arrayBuffer()),
    fetch(`${PRETENDARD}/Pretendard-Bold.otf`).then(x => x.arrayBuffer()),
    fetch(`${PRETENDARD}/Pretendard-Black.otf`).then(x => x.arrayBuffer()),
  ]);
  fontBufs = [r, b, bk].map(b => new Uint8Array(b));
  return fontBufs;
}

async function svgToPng(svgStr: string): Promise<string> {
  const fonts = await getFonts();
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: "width", value: 1080 },
    font: { fontBuffers: fonts, defaultFontFamily: "Pretendard", loadSystemFonts: false } as any,
  });
  const pngData = resvg.render();
  const bytes = pngData.asPng();
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return "data:image/png;base64," + btoa(bin);
}

// ── SVG 헬퍼 ─────────────────────────────────────────────────────────────────
const W = 1080, H = 1080; // 인스타 1:1 정사각형
const PAD = 60;

function esc(s: string | number): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(str: string, maxCh: number): string[] {
  const out: string[] = [];
  const words = str.split(" ");
  let line = "";
  for (const w of words) {
    const candidate = line ? line + " " + w : w;
    if (candidate.length > maxCh) {
      if (line) out.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

// ── 색상 팔레트 (슬라이드별 회전) ─────────────────────────────────────────────
const PALETTES = [
  { bg: "#1A1A2E", accent: "#E94560", text: "#FFFFFF", sub: "#B0B0C0" },  // 후킹 (다크+레드)
  { bg: "#F8F4F0", accent: "#2D5A3D", text: "#1A1814", sub: "#6B6860" },  // 정보1 (크림+그린)
  { bg: "#EEF2FF", accent: "#4F46E5", text: "#1E1B4B", sub: "#6366F1" },  // 정보2 (라벤더)
  { bg: "#FFF7ED", accent: "#EA580C", text: "#431407", sub: "#C2410C" },  // 정보3 (오렌지)
  { bg: "#E94560", accent: "#FFFFFF", text: "#FFFFFF", sub: "#FFD1DC" },  // CTA (레드 풀)
];

// ── 슬라이드 SVG 생성 ────────────────────────────────────────────────────────

function buildSlide1_Hook(hook: string, ingredientFocus: string): string {
  const p = PALETTES[0];
  const lines = wrapText(hook, 16);
  const linesSvg = lines.map((line, i) =>
    `<text x="${W/2}" y="${H/2 - (lines.length - 1) * 28 + i * 56}" text-anchor="middle" font-family="Pretendard" font-weight="800" font-size="48" fill="${p.text}">${esc(line)}</text>`
  ).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <rect x="${PAD}" y="${PAD}" width="${W - PAD*2}" height="${H - PAD*2}" rx="24" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.3"/>
  ${ingredientFocus ? `<text x="${W/2}" y="${H/2 - (lines.length) * 28 - 40}" text-anchor="middle" font-family="Pretendard" font-weight="600" font-size="28" fill="${p.accent}">🔬 ${esc(ingredientFocus)}</text>` : ""}
  ${linesSvg}
  <text x="${W/2}" y="${H - 80}" text-anchor="middle" font-family="Pretendard" font-weight="400" font-size="22" fill="${p.sub}">@fonday.skincare</text>
</svg>`;
}

function buildSlideInfo(title: string, body: string, slideIdx: number): string {
  const p = PALETTES[slideIdx] || PALETTES[1];
  const num = slideIdx;

  const titleLines = wrapText(title, 20);
  const bodyLines = wrapText(body, 24);

  let y = 180;
  const titleSvg = titleLines.map((line, i) => {
    const svg = `<text x="${PAD + 20}" y="${y}" font-family="Pretendard" font-weight="700" font-size="40" fill="${p.text}">${esc(line)}</text>`;
    y += 50;
    return svg;
  }).join("\n");

  y += 20; // gap between title and body
  const bodySvg = bodyLines.map((line) => {
    const svg = `<text x="${PAD + 20}" y="${y}" font-family="Pretendard" font-weight="400" font-size="30" fill="${p.sub}">${esc(line)}</text>`;
    y += 42;
    return svg;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <circle cx="${PAD + 40}" cy="100" r="28" fill="${p.accent}"/>
  <text x="${PAD + 40}" y="110" text-anchor="middle" font-family="Pretendard" font-weight="700" font-size="28" fill="${p.bg === "#F8F4F0" || p.bg === "#EEF2FF" || p.bg === "#FFF7ED" ? "#FFFFFF" : p.bg}">${num}</text>
  ${titleSvg}
  ${bodySvg}
  <text x="${W/2}" y="${H - 50}" text-anchor="middle" font-family="Pretendard" font-weight="400" font-size="20" fill="${p.sub}" opacity="0.5">@fonday.skincare</text>
</svg>`;
}

function buildSlide5_CTA(cta: string): string {
  const p = PALETTES[4];
  const lines = wrapText(cta, 18);
  const linesSvg = lines.map((line, i) =>
    `<text x="${W/2}" y="${H/2 - 40 + i * 50}" text-anchor="middle" font-family="Pretendard" font-weight="700" font-size="40" fill="${p.text}">${esc(line)}</text>`
  ).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  ${linesSvg}
  <rect x="${W/2 - 200}" y="${H/2 + 60}" width="400" height="60" rx="30" fill="${p.accent}"/>
  <text x="${W/2}" y="${H/2 + 99}" text-anchor="middle" font-family="Pretendard" font-weight="700" font-size="26" fill="${p.bg}">프로필 링크에서 확인 →</text>
  <text x="${W/2}" y="${H - 80}" text-anchor="middle" font-family="Pretendard" font-weight="500" font-size="24" fill="${p.sub}">@fonday.skincare</text>
</svg>`;
}

// ── API 핸들러 ───────────────────────────────────────────────────────────────

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const adminKey = env.ADMIN_KEY;
  if (!adminKey) return new Response(JSON.stringify({ error: "No admin key" }), { status: 500, headers: { "Content-Type": "application/json" } });

  try {
    const body = await request.json() as { key?: string; contentId?: number };
    if (body.key !== adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (!body.contentId) {
      return new Response(JSON.stringify({ error: "contentId required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // DB에서 콘텐츠 로드
    const content = await env.FONDAY_DB.prepare(
      "SELECT * FROM insta_content WHERE id = ?"
    ).bind(body.contentId).first();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const slides: Array<{ title: string; body: string }> = JSON.parse(content.slides as string);
    const hook = content.hook as string;
    const cta = content.cta as string;
    const ingredientFocus = (content.ingredient_focus as string) || "";

    await ensureResvg();

    // 5장 이미지 생성
    const images: string[] = [];

    // 1장: 후킹
    images.push(await svgToPng(buildSlide1_Hook(hook, ingredientFocus)));

    // 2~4장: 정보
    for (let i = 1; i <= 3 && i < slides.length; i++) {
      images.push(await svgToPng(buildSlideInfo(slides[i].title, slides[i].body, i + 1)));
    }

    // 5장: CTA
    images.push(await svgToPng(buildSlide5_CTA(cta)));

    return new Response(JSON.stringify({
      ok: true,
      contentId: body.contentId,
      slideCount: images.length,
      images,
      caption: content.caption,
      hashtags: JSON.parse(content.hashtags as string),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("insta-image error:", err);
    return new Response(JSON.stringify({ error: "Image generation failed", detail: err?.message ?? "" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
