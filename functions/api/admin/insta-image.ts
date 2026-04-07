/**
 * POST /api/admin/insta-image — 캐러셀 슬라이드를 이미지(PNG)로 변환
 * Body: { key, contentId } — insta_content 테이블의 ID
 * Response: { slides: ["data:image/png;base64,...", ...] }
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
const W = 1080, H = 1080;
const FF = "Pretendard";

function esc(s: string | number): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(str: string, maxCh: number): string[] {
  const out: string[] = [];
  const words = str.split(" ");
  let line = "";
  for (const w of words) {
    // 한글은 글자 단위로 잘라야 함
    const candidate = line ? line + " " + w : w;
    if (candidate.length > maxCh) {
      if (line) out.push(line);
      // 긴 단어 자체를 잘라야 할 때
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

// ── 공통 SVG 요소 ────────────────────────────────────────────────────────────

function defs(extraDefs = ""): string {
  return `<defs>
    <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A1A2E"/>
      <stop offset="100%" stop-color="#16213E"/>
    </linearGradient>
    <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F8F4F0"/>
      <stop offset="100%" stop-color="#EDE8E2"/>
    </linearGradient>
    <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EEF2FF"/>
      <stop offset="100%" stop-color="#E0E7FF"/>
    </linearGradient>
    <linearGradient id="grad4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFF7ED"/>
      <stop offset="100%" stop-color="#FFEDD5"/>
    </linearGradient>
    <linearGradient id="grad5" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E94560"/>
      <stop offset="100%" stop-color="#C23152"/>
    </linearGradient>
    <linearGradient id="accentGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E94560" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#E94560" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000" flood-opacity="0.08"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${extraDefs}
  </defs>`;
}

/** 장식 원 (배경에 가볍게) */
function decoCircles(color: string, opacity = 0.06): string {
  return `
    <circle cx="920" cy="120" r="200" fill="${color}" opacity="${opacity}"/>
    <circle cx="160" cy="900" r="150" fill="${color}" opacity="${opacity * 0.7}"/>
    <circle cx="800" cy="800" r="80" fill="${color}" opacity="${opacity * 0.5}"/>
  `;
}

/** 브랜드 바 (하단) */
function brandBar(textColor: string, opacity = 0.4): string {
  return `
    <line x1="80" y1="${H - 60}" x2="${W - 80}" y2="${H - 60}" stroke="${textColor}" stroke-width="1" opacity="0.1"/>
    <text x="80" y="${H - 30}" font-family="${FF}" font-weight="600" font-size="20" fill="${textColor}" opacity="${opacity}">FONDAY</text>
    <text x="${W - 80}" y="${H - 30}" text-anchor="end" font-family="${FF}" font-weight="400" font-size="18" fill="${textColor}" opacity="${opacity * 0.7}">@fonday.skincare</text>
  `;
}

/** 상단 키워드 뱃지 */
function topBadge(label: string, bgColor: string, textColor: string, x = W / 2): string {
  const bw = label.length * 18 + 40;
  return `
    <rect x="${x - bw / 2}" y="60" width="${bw}" height="42" rx="21" fill="${bgColor}" opacity="0.9"/>
    <text x="${x}" y="87" text-anchor="middle" font-family="${FF}" font-weight="600" font-size="20" fill="${textColor}">${esc(label)}</text>
  `;
}

// ── 슬라이드 1: 후킹 (다크 그라데이션 + 글로우) ────────────────────────────────

function buildSlide1_Hook(hook: string, ingredientFocus: string): string {
  const lines = wrapText(hook, 14);
  const totalHeight = lines.length * 64;
  const startY = (H / 2) - (totalHeight / 2) + 20;

  const linesSvg = lines.map((line, i) =>
    `<text x="${W / 2}" y="${startY + i * 64}" text-anchor="middle" font-family="${FF}" font-weight="800" font-size="52" fill="#FFFFFF">${esc(line)}</text>`
  ).join("\n");

  // 장식 라인들
  const accentLines = `
    <rect x="80" y="${startY - 80}" width="60" height="4" rx="2" fill="#E94560" opacity="0.8"/>
    <rect x="${W - 140}" y="${startY + totalHeight + 40}" width="60" height="4" rx="2" fill="#E94560" opacity="0.8"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  <rect width="${W}" height="${H}" fill="url(#grad1)"/>
  ${decoCircles("#E94560", 0.08)}
  <!-- 중앙 글로우 -->
  <ellipse cx="${W / 2}" cy="${H / 2}" rx="400" ry="300" fill="url(#accentGlow)"/>
  ${ingredientFocus ? topBadge(ingredientFocus, "rgba(233,69,96,0.2)", "#FF8A9E") : ""}
  ${accentLines}
  ${linesSvg}
  <!-- 스와이프 힌트 -->
  <text x="${W / 2}" y="${H - 100}" text-anchor="middle" font-family="${FF}" font-weight="400" font-size="22" fill="#FFFFFF" opacity="0.35">밀어서 더 보기 →</text>
  ${brandBar("#FFFFFF", 0.3)}
</svg>`;
}

// ── 슬라이드 2~4: 정보 카드 ─────────────────────────────────────────────────

interface InfoPalette {
  gradId: string;
  accent: string;
  text: string;
  sub: string;
  cardBg: string;
  cardBorder: string;
  numBg: string;
  numText: string;
  decoColor: string;
}

const INFO_PALETTES: InfoPalette[] = [
  { gradId: "grad2", accent: "#2D5A3D", text: "#1A1814", sub: "#6B6860", cardBg: "#FFFFFF", cardBorder: "rgba(45,90,61,0.12)", numBg: "#2D5A3D", numText: "#FFFFFF", decoColor: "#2D5A3D" },
  { gradId: "grad3", accent: "#4F46E5", text: "#1E1B4B", sub: "#4338CA", cardBg: "#FFFFFF", cardBorder: "rgba(79,70,229,0.12)", numBg: "#4F46E5", numText: "#FFFFFF", decoColor: "#4F46E5" },
  { gradId: "grad4", accent: "#EA580C", text: "#431407", sub: "#9A3412", cardBg: "#FFFFFF", cardBorder: "rgba(234,88,12,0.12)", numBg: "#EA580C", numText: "#FFFFFF", decoColor: "#EA580C" },
];

function buildSlideInfo(title: string, body: string, slideIdx: number): string {
  const pIdx = (slideIdx - 2) % INFO_PALETTES.length; // 0, 1, 2
  const p = INFO_PALETTES[pIdx];
  const num = slideIdx - 1; // 1, 2, 3

  const titleLines = wrapText(title, 18);
  const bodyLines = wrapText(body, 22);

  // 카드 영역 계산
  const cardX = 60, cardY = 150;
  const cardW = W - 120, cardH = H - 260;
  const cardPad = 48;

  let ty = cardY + cardPad + 70; // 넘버 뱃지 아래
  const titleSvg = titleLines.map((line) => {
    const svg = `<text x="${cardX + cardPad}" y="${ty}" font-family="${FF}" font-weight="700" font-size="42" fill="${p.text}">${esc(line)}</text>`;
    ty += 54;
    return svg;
  }).join("\n");

  // 구분선
  ty += 12;
  const divider = `<rect x="${cardX + cardPad}" y="${ty}" width="60" height="4" rx="2" fill="${p.accent}" opacity="0.6"/>`;
  ty += 36;

  const bodySvg = bodyLines.map((line) => {
    const svg = `<text x="${cardX + cardPad}" y="${ty}" font-family="${FF}" font-weight="400" font-size="32" fill="${p.sub}">${esc(line)}</text>`;
    ty += 46;
    return svg;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  <rect width="${W}" height="${H}" fill="url(#${p.gradId})"/>
  ${decoCircles(p.decoColor, 0.05)}
  <!-- 카드 -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="24" fill="${p.cardBg}" filter="url(#shadow)" stroke="${p.cardBorder}" stroke-width="1"/>
  <!-- 넘버 뱃지 -->
  <rect x="${cardX + cardPad}" y="${cardY + cardPad}" width="48" height="48" rx="12" fill="${p.numBg}"/>
  <text x="${cardX + cardPad + 24}" y="${cardY + cardPad + 34}" text-anchor="middle" font-family="${FF}" font-weight="700" font-size="26" fill="${p.numText}">${num}</text>
  <!-- 타이틀 -->
  ${titleSvg}
  ${divider}
  <!-- 본문 -->
  ${bodySvg}
  <!-- 사이드 액센트 바 -->
  <rect x="${cardX}" y="${cardY + 60}" width="4" height="100" fill="${p.accent}" opacity="0.3" rx="2"/>
  ${brandBar(p.text, 0.3)}
</svg>`;
}

// ── 슬라이드 5: CTA ─────────────────────────────────────────────────────────

function buildSlide5_CTA(cta: string): string {
  const lines = wrapText(cta, 16);
  const totalHeight = lines.length * 56;
  const startY = (H / 2) - (totalHeight / 2) - 30;

  const linesSvg = lines.map((line, i) =>
    `<text x="${W / 2}" y="${startY + i * 56}" text-anchor="middle" font-family="${FF}" font-weight="700" font-size="44" fill="#FFFFFF">${esc(line)}</text>`
  ).join("\n");

  // 버튼 Y 위치
  const btnY = startY + totalHeight + 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs()}
  <rect width="${W}" height="${H}" fill="url(#grad5)"/>
  ${decoCircles("#FFFFFF", 0.06)}
  <!-- 상단 장식 -->
  <rect x="${W / 2 - 30}" y="80" width="60" height="4" rx="2" fill="#FFFFFF" opacity="0.4"/>
  <!-- 텍스트 -->
  ${linesSvg}
  <!-- 버튼 -->
  <rect x="${W / 2 - 220}" y="${btnY}" width="440" height="68" rx="34" fill="#FFFFFF"/>
  <text x="${W / 2}" y="${btnY + 44}" text-anchor="middle" font-family="${FF}" font-weight="700" font-size="28" fill="#E94560">무료 AI 피부 분석 받기 →</text>
  <!-- 보조 텍스트 -->
  <text x="${W / 2}" y="${btnY + 110}" text-anchor="middle" font-family="${FF}" font-weight="400" font-size="22" fill="#FFFFFF" opacity="0.6">프로필 링크를 확인하세요</text>
  ${brandBar("#FFFFFF", 0.25)}
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
    const body = await request.json() as { key?: string; contentId?: number; slideIndex?: number };
    if (body.key !== adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (!body.contentId) {
      return new Response(JSON.stringify({ error: "contentId required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const slideIndex = body.slideIndex ?? -1; // -1 = 메타데이터만, 0~4 = 해당 슬라이드

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

    // 메타데이터만 요청 (슬라이드 개수 확인용)
    if (slideIndex === -1) {
      const totalSlides = Math.min(slides.length, 5);
      return new Response(JSON.stringify({
        ok: true,
        contentId: body.contentId,
        totalSlides,
        caption: content.caption,
        hashtags: JSON.parse(content.hashtags as string),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await ensureResvg();

    // 한 장씩 생성
    let svgStr: string;
    if (slideIndex === 0) {
      svgStr = buildSlide1_Hook(hook, ingredientFocus);
    } else if (slideIndex >= 1 && slideIndex <= 3 && slideIndex < slides.length) {
      svgStr = buildSlideInfo(slides[slideIndex].title, slides[slideIndex].body, slideIndex + 1);
    } else {
      svgStr = buildSlide5_CTA(cta);
    }

    const image = await svgToPng(svgStr);

    return new Response(JSON.stringify({
      ok: true,
      contentId: body.contentId,
      slideIndex,
      image,
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
