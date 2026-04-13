import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-ignore – pre-compiled WebAssembly.Module from Cloudflare Pages bundler
import resvgWasm from "./resvg.wasm";

// ── WASM + font cache ─────────────────────────────────────────────────────────
let resvgReady = false;
let fontCache: Uint8Array[] | null = null;

async function ensureResvg() {
  if (resvgReady) return;
  await initWasm(resvgWasm);
  resvgReady = true;
}

const LINESEED = "https://cdn.jsdelivr.net/npm/line-seed-kr@1.0.1/fonts";
const PRETENDARD = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";

async function getFonts(): Promise<Uint8Array[]> {
  if (fontCache) return fontCache;
  const [lr, lb, pr, pb] = await Promise.all([
    fetch(`${LINESEED}/LINESeedKR-Rg.woff2`).then(x => x.arrayBuffer()),
    fetch(`${LINESEED}/LINESeedKR-Bd.woff2`).then(x => x.arrayBuffer()),
    fetch(`${PRETENDARD}/Pretendard-Regular.otf`).then(x => x.arrayBuffer()),
    fetch(`${PRETENDARD}/Pretendard-Bold.otf`).then(x => x.arrayBuffer()),
  ]);
  fontCache = [lr, lb, pr, pb].map(b => new Uint8Array(b));
  return fontCache;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const SCAN_TO = "#C97062";
const DEEP_GREEN = "#2C3E36";
const BAUMANN_COLORS: Record<string, string> = {
  O: "#F59E0B", D: "#3B82F6", S: "#EF4444", R: "#10B981",
  P: "#8B5CF6", N: "#06B6D4", W: "#6366F1", T: "#14B8A6",
};

// ── SVG helpers ───────────────────────────────────────────────────────────────
const W = 1200, H = 630;
const FF = "LINESeedKR, Pretendard";

function esc(s: string | number): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tx(x: number, y: number, content: string, size: number, fill: string, opts?: { weight?: number; anchor?: string }) {
  const { weight = 400, anchor = "start" } = opts ?? {};
  return `<text x="${x}" y="${y}" font-family="${FF}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(content)}</text>`;
}

// ── OG Image builders ─────────────────────────────────────────────────────────

function buildShareOG(scan: any): string {
  const score = scan.overallScore ?? "??";
  const type = scan.baumannType ?? "----";
  const skinAge = scan.skinAge;
  const comment = scan.aiComment ?? "";

  let s = "";
  // Background
  s += `<rect width="${W}" height="${H}" fill="#FAFAF8"/>`;
  // Top gradient bar
  s += `<linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#E09882"/><stop offset="100%" stop-color="${SCAN_TO}"/></linearGradient>`;
  s += `<rect width="${W}" height="8" fill="url(#grad)"/>`;

  // Logo
  s += tx(60, 70, "Fonday°", 36, "#4A403A", { weight: 900 });

  // Left side: Score
  s += tx(80, 220, "피부 점수", 28, "#8C8078", { weight: 700 });
  s += tx(80, 340, String(score), 160, SCAN_TO, { weight: 900 });
  s += tx(80 + String(score).length * 80 + 20, 340, "점", 40, "#8C8078", { weight: 700 });

  // Baumann type badges
  const letters = type.split("");
  let bx = 80;
  for (const letter of letters) {
    const c = BAUMANN_COLORS[letter] || "#64748B";
    s += `<rect x="${bx}" y="370" width="80" height="44" fill="${c}22" rx="22"/>`;
    s += `<rect x="${bx}" y="370" width="80" height="44" fill="none" stroke="${c}" stroke-opacity="0.5" stroke-width="2" rx="22"/>`;
    s += tx(bx + 40, 400, letter, 24, c, { weight: 800, anchor: "middle" });
    bx += 96;
  }

  // Skin age
  if (skinAge && skinAge > 0) {
    s += tx(80, 470, `피부 나이 ${skinAge}세`, 30, DEEP_GREEN, { weight: 800 });
  }

  // Right side: AI comment box
  s += `<rect x="600" y="120" width="540" height="400" fill="white" rx="24" stroke="#EBEBEB" stroke-width="1"/>`;
  s += `<rect x="600" y="120" width="4" height="400" fill="${SCAN_TO}" rx="2"/>`;
  s += tx(640, 170, "AI 피부 분석", 24, SCAN_TO, { weight: 800 });

  // Word wrap comment
  if (comment) {
    const maxCh = 18;
    const words = comment.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const candidate = line ? line + " " + w : w;
      if (candidate.length > maxCh) {
        if (line) lines.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, 7).forEach((ln, i) => {
      s += tx(640, 220 + i * 48, ln, 30, "#4A403A", { weight: 600 });
    });
  }

  // Bottom CTA
  s += `<rect x="60" y="${H - 80}" width="${W - 120}" height="60" fill="${SCAN_TO}15" rx="16"/>`;
  s += tx(W / 2, H - 42, "나도 무료 피부 분석 받기 → fondayai.com", 26, SCAN_TO, { weight: 800, anchor: "middle" });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#E09882"/><stop offset="100%" stop-color="${SCAN_TO}"/></linearGradient></defs>${s}</svg>`;
}

function buildBattleOG(friendScan: any): string {
  const score = friendScan.overallScore ?? "??";
  const type = friendScan.baumannType ?? "----";

  let s = "";
  s += `<rect width="${W}" height="${H}" fill="#FAFAF8"/>`;
  s += `<linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#E09882"/><stop offset="100%" stop-color="${SCAN_TO}"/></linearGradient>`;
  s += `<rect width="${W}" height="8" fill="url(#grad)"/>`;

  // Logo
  s += tx(60, 70, "Fonday°", 36, "#4A403A", { weight: 900 });
  s += tx(W - 60, 70, "피부 챌린지", 30, SCAN_TO, { weight: 800, anchor: "end" });

  // Center: VS layout
  // Friend card
  s += `<rect x="80" y="120" width="460" height="420" fill="white" rx="28" stroke="#EBEBEB" stroke-width="1"/>`;
  s += tx(310, 200, "친구", 28, "#8C8078", { weight: 700, anchor: "middle" });
  s += tx(310, 350, String(score), 140, SCAN_TO, { weight: 900, anchor: "middle" });
  s += tx(310, 400, "점", 32, "#8C8078", { weight: 700, anchor: "middle" });

  // Baumann badges on friend card
  const letters = type.split("");
  const totalBW = letters.length * 64 + (letters.length - 1) * 8;
  let bx = 310 - totalBW / 2;
  for (const letter of letters) {
    const c = BAUMANN_COLORS[letter] || "#64748B";
    s += `<rect x="${bx}" y="430" width="64" height="40" fill="${c}22" rx="20"/>`;
    s += tx(bx + 32, 458, letter, 22, c, { weight: 800, anchor: "middle" });
    bx += 72;
  }

  // VS badge
  s += `<circle cx="600" cy="330" r="40" fill="url(#vsgrad)"/>`;
  s += `<linearGradient id="vsgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#EC4899"/></linearGradient>`;
  s += tx(600, 344, "VS", 36, "white", { weight: 900, anchor: "middle" });

  // My card (empty — challenge)
  s += `<rect x="660" y="120" width="460" height="420" fill="${DEEP_GREEN}" rx="28"/>`;
  s += tx(890, 290, "나는", 32, "white", { weight: 700, anchor: "middle" });
  s += tx(890, 350, "몇 점?", 56, "white", { weight: 900, anchor: "middle" });
  s += tx(890, 420, "도전하기 →", 28, "#A0D8C0", { weight: 700, anchor: "middle" });

  // Bottom CTA
  s += `<rect x="60" y="${H - 80}" width="${W - 120}" height="60" fill="${DEEP_GREEN}12" rx="16"/>`;
  s += tx(W / 2, H - 42, "내 피부 점수 확인하고 대결하기!", 28, DEEP_GREEN, { weight: 800, anchor: "middle" });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#E09882"/><stop offset="100%" stop-color="${SCAN_TO}"/></linearGradient><linearGradient id="vsgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs>${s}</svg>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=86400",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type") || "share"; // "share" | "battle"

  if (!token) {
    return new Response("Missing token", { status: 400, headers: CORS });
  }

  if (!env.SCANS_KV) {
    return new Response("Storage not configured", { status: 500, headers: CORS });
  }

  // Fetch scan data from KV
  const raw = await env.SCANS_KV.get(`share:${token}`);
  if (!raw) {
    return new Response("Scan not found", { status: 404, headers: CORS });
  }

  const scan = JSON.parse(raw);
  const scores = typeof scan.scores === "string" ? JSON.parse(scan.scores) : scan.scores;
  const scanData = {
    overallScore: scan.overallScore,
    baumannType: scan.baumannType,
    skinAge: scan.skinAge,
    aiComment: scan.aiComment,
    scores,
  };

  // Build SVG
  const svgStr = type === "battle" ? buildBattleOG(scanData) : buildShareOG(scanData);

  // SVG → PNG
  let fonts: Uint8Array[];
  try {
    [fonts] = await Promise.all([getFonts(), ensureResvg()]);
  } catch (e: any) {
    return new Response(`Init failed: ${e?.message}`, { status: 500, headers: CORS });
  }

  const resvg = new Resvg(svgStr, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontBuffers: fonts, defaultFontFamily: FF, loadSystemFonts: false } as any,
  });
  const pngData = resvg.render();
  const pngBytes = pngData.asPng();

  return new Response(pngBytes, {
    headers: {
      ...CORS,
      "Content-Type": "image/png",
    },
  });
};
