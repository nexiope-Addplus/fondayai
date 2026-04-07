/**
 * POST /api/admin/insta-image — 캐러셀 슬라이드 PNG 생성 (한 장씩)
 * Body: { key, contentId, slideIndex }
 *   slideIndex: -1 = 메타데이터만, 0~4 = 해당 슬라이드
 *
 * 2026 인스타 트렌드: Bold 타이포 + 미니멀 + 통일된 톤앤매너
 */
import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-ignore
import resvgWasm from "../resvg.wasm";

interface Env {
  FONDAY_DB: D1Database;
  ADMIN_KEY?: string;
}

// ── WASM + font ──────────────────────────────────────────────────────────────
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

// ── 디자인 시스템 ────────────────────────────────────────────────────────────
const W = 1080, H = 1080;
const FF = "Pretendard";

// 브랜드 컬러 (전 슬라이드 통일)
const C = {
  dark: "#0F172A",       // 메인 다크 (슬레이트 900)
  accent: "#E94560",     // 코랄 레드
  accentSoft: "#FEE2E2", // 코랄 라이트
  cream: "#FAFAF9",      // 배경 크림
  white: "#FFFFFF",
  text: "#1E293B",       // 본문 (슬레이트 800)
  sub: "#64748B",        // 서브 텍스트 (슬레이트 500)
  muted: "#94A3B8",      // 뮤트 (슬레이트 400)
  border: "#E2E8F0",     // 보더 (슬레이트 200)
  cardBg: "#FFFFFF",
};

function esc(s: string | number): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapKo(str: string, maxCh: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const ch of str) {
    if (line.length >= maxCh) { out.push(line); line = ""; }
    line += ch;
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

// ── 공통 요소 ────────────────────────────────────────────────────────────────

const SHARED_DEFS = `<defs>
  <linearGradient id="bgDark" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#0F172A"/>
    <stop offset="100%" stop-color="#1E293B"/>
  </linearGradient>
  <linearGradient id="bgCream" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FAFAF9"/>
    <stop offset="100%" stop-color="#F5F5F4"/>
  </linearGradient>
  <linearGradient id="bgCta" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#E94560"/>
    <stop offset="100%" stop-color="#BE123C"/>
  </linearGradient>
  <filter id="cardShadow">
    <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.06"/>
  </filter>
</defs>`;

function brandFooter(light: boolean): string {
  const color = light ? C.white : C.muted;
  const opacity = light ? "0.4" : "0.5";
  return `
    <line x1="80" y1="${H - 70}" x2="${W - 80}" y2="${H - 70}" stroke="${color}" stroke-width="1" opacity="0.15"/>
    <text x="80" y="${H - 36}" font-family="${FF}" font-weight="700" font-size="22" fill="${color}" opacity="${opacity}" letter-spacing="3">FONDAY</text>
    <text x="${W - 80}" y="${H - 36}" text-anchor="end" font-family="${FF}" font-weight="400" font-size="18" fill="${color}" opacity="${String(Number(opacity) * 0.7)}">AI 피부 분석</text>
  `;
}

/** 슬라이드 넘버 인디케이터 (하단 도트) */
function slideIndicator(current: number, total: number, light: boolean): string {
  const dotY = H - 90;
  const dotGap = 18;
  const startX = W / 2 - ((total - 1) * dotGap) / 2;
  const activeColor = light ? C.white : C.accent;
  const inactiveColor = light ? "rgba(255,255,255,0.25)" : C.border;

  return Array.from({ length: total }, (_, i) => {
    const cx = startX + i * dotGap;
    const r = i === current ? 5 : 3;
    const fill = i === current ? activeColor : inactiveColor;
    return `<circle cx="${cx}" cy="${dotY}" r="${r}" fill="${fill}"/>`;
  }).join("\n");
}

// ── 슬라이드 1: 후킹 ────────────────────────────────────────────────────────

function buildSlide1(hook: string, hookSub: string, ingredientFocus: string): string {
  const hookLines = wrapKo(hook, 12);
  const totalH = hookLines.length * 68;
  const startY = H / 2 - totalH / 2 - 20;

  const hookSvg = hookLines.map((line, i) =>
    `<text x="${W / 2}" y="${startY + i * 68}" text-anchor="middle" font-family="${FF}" font-weight="900" font-size="56" fill="${C.white}" letter-spacing="-1">${esc(line)}</text>`
  ).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${SHARED_DEFS}
  <rect width="${W}" height="${H}" fill="url(#bgDark)"/>

  <!-- 배경 장식: 부드러운 글로우 -->
  <ellipse cx="${W / 2}" cy="${H / 2 - 40}" rx="380" ry="280" fill="${C.accent}" opacity="0.06"/>
  <ellipse cx="200" cy="200" rx="200" ry="200" fill="${C.accent}" opacity="0.03"/>

  <!-- 성분 뱃지 -->
  ${ingredientFocus ? `
    <rect x="${W / 2 - (ingredientFocus.length * 11 + 24)}" y="120" width="${ingredientFocus.length * 22 + 48}" height="40" rx="20" fill="${C.accent}" opacity="0.15"/>
    <text x="${W / 2}" y="147" text-anchor="middle" font-family="${FF}" font-weight="600" font-size="20" fill="${C.accent}">${esc(ingredientFocus)}</text>
  ` : ""}

  <!-- 후킹 타이틀 -->
  ${hookSvg}

  <!-- 서브 텍스트 -->
  <text x="${W / 2}" y="${startY + totalH + 40}" text-anchor="middle" font-family="${FF}" font-weight="400" font-size="26" fill="${C.muted}">${esc(hookSub || "")}</text>

  <!-- 스와이프 힌트 -->
  <text x="${W / 2}" y="${H - 120}" text-anchor="middle" font-family="${FF}" font-weight="400" font-size="18" fill="${C.muted}" opacity="0.5">밀어서 확인하기 →</text>

  ${slideIndicator(0, 5, true)}
  ${brandFooter(true)}
</svg>`;
}

// ── 슬라이드 2~4: 정보 카드 ─────────────────────────────────────────────────

const NUM_COLORS = [C.accent, "#6366F1", "#F59E0B"]; // 코랄, 인디고, 앰버

function buildSlideInfo(
  title: string, body: string, tip: string,
  slideNum: number, // 1,2,3
  slideIdx: number, // 0-indexed: 1,2,3
): string {
  const numColor = NUM_COLORS[(slideNum - 1) % NUM_COLORS.length];

  const cardX = 72, cardY = 100;
  const cardW = W - 144, cardH = H - 280;
  const innerX = cardX + 56, innerW = cardW - 112;

  const titleLines = wrapKo(title, 10);
  const bodyLines = wrapKo(body, 16);
  const tipLines = wrapKo(tip || "", 18);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${SHARED_DEFS}
  <rect width="${W}" height="${H}" fill="url(#bgCream)"/>

  <!-- 배경 장식 -->
  <circle cx="920" cy="140" r="180" fill="${numColor}" opacity="0.04"/>
  <circle cx="160" cy="860" r="120" fill="${numColor}" opacity="0.03"/>

  <!-- 메인 카드 -->
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="${C.cardBg}" filter="url(#cardShadow)"/>

  <!-- 넘버 + 라벨 -->
  <text x="${innerX}" y="${cardY + 76}" font-family="${FF}" font-weight="900" font-size="80" fill="${numColor}" opacity="0.12">${String(slideNum).padStart(2, "0")}</text>
  <text x="${innerX}" y="${cardY + 76}" font-family="${FF}" font-weight="900" font-size="48" fill="${numColor}">${String(slideNum).padStart(2, "0")}</text>

  <!-- 액센트 바 -->
  <rect x="${innerX}" y="${cardY + 96}" width="40" height="4" rx="2" fill="${numColor}"/>

  <!-- 타이틀 -->
  ${titleLines.map((line, i) =>
    `<text x="${innerX}" y="${cardY + 156 + i * 54}" font-family="${FF}" font-weight="800" font-size="44" fill="${C.text}" letter-spacing="-0.5">${esc(line)}</text>`
  ).join("\n")}

  <!-- 본문 -->
  ${bodyLines.map((line, i) =>
    `<text x="${innerX}" y="${cardY + 156 + titleLines.length * 54 + 36 + i * 40}" font-family="${FF}" font-weight="400" font-size="28" fill="${C.sub}">${esc(line)}</text>`
  ).join("\n")}

  <!-- 구분선 -->
  <line x1="${innerX}" y1="${cardY + cardH - 140}" x2="${innerX + innerW}" y2="${cardY + cardH - 140}" stroke="${C.border}" stroke-width="1"/>

  <!-- 팁 -->
  ${tip ? `
    <rect x="${innerX}" y="${cardY + cardH - 120}" width="8" height="8" rx="4" fill="${numColor}"/>
    ${tipLines.map((line, i) =>
      `<text x="${innerX + 20}" y="${cardY + cardH - 112 + i * 34}" font-family="${FF}" font-weight="500" font-size="24" fill="${numColor}">${esc(line)}</text>`
    ).join("\n")}
  ` : ""}

  ${slideIndicator(slideIdx, 5, false)}
  ${brandFooter(false)}
</svg>`;
}

// ── 슬라이드 5: CTA ─────────────────────────────────────────────────────────

function buildSlide5(cta: string): string {
  const ctaLines = wrapKo(cta, 12);
  const totalH = ctaLines.length * 60;
  const startY = H / 2 - totalH / 2 - 50;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${SHARED_DEFS}
  <rect width="${W}" height="${H}" fill="url(#bgCta)"/>

  <!-- 배경 글로우 -->
  <ellipse cx="${W / 2}" cy="${H / 2}" rx="400" ry="350" fill="#FFFFFF" opacity="0.05"/>
  <circle cx="180" cy="200" r="150" fill="#FFFFFF" opacity="0.03"/>

  <!-- 상단 장식 -->
  <rect x="${W / 2 - 24}" y="100" width="48" height="4" rx="2" fill="${C.white}" opacity="0.3"/>

  <!-- CTA 텍스트 -->
  ${ctaLines.map((line, i) =>
    `<text x="${W / 2}" y="${startY + i * 60}" text-anchor="middle" font-family="${FF}" font-weight="800" font-size="48" fill="${C.white}" letter-spacing="-0.5">${esc(line)}</text>`
  ).join("\n")}

  <!-- 버튼 -->
  <rect x="${W / 2 - 200}" y="${startY + totalH + 30}" width="400" height="64" rx="32" fill="${C.white}"/>
  <text x="${W / 2}" y="${startY + totalH + 71}" text-anchor="middle" font-family="${FF}" font-weight="700" font-size="26" fill="${C.accent}">무료 AI 피부 분석 →</text>

  <!-- 보조 -->
  <text x="${W / 2}" y="${startY + totalH + 130}" text-anchor="middle" font-family="${FF}" font-weight="400" font-size="20" fill="${C.white}" opacity="0.5">프로필 링크를 확인하세요</text>

  ${slideIndicator(4, 5, true)}
  ${brandFooter(true)}
</svg>`;
}

// ── API 핸들러 ───────────────────────────────────────────────────────────────

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

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

    const slideIndex = body.slideIndex ?? -1;

    const content = await env.FONDAY_DB.prepare(
      "SELECT * FROM insta_content WHERE id = ?"
    ).bind(body.contentId).first();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const slides: Array<{ title: string; body: string; tip?: string }> = JSON.parse(content.slides as string);
    const hook = content.hook as string;
    const hookSub = (content.hook_sub as string) || slides[0]?.body || "";
    const cta = content.cta as string;
    const ingredientFocus = (content.ingredient_focus as string) || "";

    // 메타데이터만
    if (slideIndex === -1) {
      return new Response(JSON.stringify({
        ok: true,
        contentId: body.contentId,
        totalSlides: 5,
        caption: content.caption,
        hashtags: JSON.parse(content.hashtags as string),
      }), { headers: { "Content-Type": "application/json" } });
    }

    await ensureResvg();

    let svgStr: string;
    if (slideIndex === 0) {
      svgStr = buildSlide1(hook, hookSub, ingredientFocus);
    } else if (slideIndex >= 1 && slideIndex <= 3) {
      const s = slides[slideIndex] || slides[Math.min(slideIndex, slides.length - 1)];
      svgStr = buildSlideInfo(s.title, s.body, s.tip || "", slideIndex, slideIndex);
    } else {
      svgStr = buildSlide5(cta);
    }

    const image = await svgToPng(svgStr);

    return new Response(JSON.stringify({
      ok: true,
      contentId: body.contentId,
      slideIndex,
      image,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("insta-image error:", err);
    return new Response(JSON.stringify({ error: "Image generation failed", detail: err?.message ?? "" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
