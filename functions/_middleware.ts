// ── 크롤러 봇 감지 (카카오톡, LINE, Facebook, Twitter 등) ────────────────────
const BOT_UA = /kakaotalk|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|LINE|Slackbot|Discordbot|WhatsApp|TelegramBot/i;

function isBot(ua: string | null): boolean {
  return !!ua && BOT_UA.test(ua);
}

// OG 메타태그 HTML 생성 — 크롤러에게만 반환
function ogHtml(opts: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}): Response {
  const { title, description, imageUrl, pageUrl } = opts;
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Fonday°"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${imageUrl}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${pageUrl}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${imageUrl}"/>
<title>${title}</title>
</head><body></body></html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

// 전역 CORS 미들웨어 — 토스 미니앱(*.apps.tossmini.com)에서 API 접근 허용
export const onRequest: PagesFunction[] = [
  async (context) => {
    const { request } = context;
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    const ua = request.headers.get("User-Agent");

    // ── 크롤러 봇에 OG 메타태그 반환 (/battle/:token, /share/:token) ──
    if (isBot(ua)) {
      const base = url.origin;

      // /battle/:token
      const battleMatch = url.pathname.match(/^\/battle\/([A-Za-z0-9_-]+)$/);
      if (battleMatch) {
        const token = battleMatch[1];
        return ogHtml({
          title: "피부 점수 대결 — 너는 몇 점? 🔥",
          description: "친구가 피부 챌린지를 보냈어요! 내 피부 점수를 확인하고 대결해보세요.",
          imageUrl: `${base}/api/og-image?token=${token}&type=battle`,
          pageUrl: `${base}/battle/${token}`,
        });
      }

      // /share/:token
      const shareMatch = url.pathname.match(/^\/share\/([A-Za-z0-9_-]+)$/);
      if (shareMatch) {
        const token = shareMatch[1];
        return ogHtml({
          title: "내 피부 분석 결과 — Fonday°",
          description: "셀카 한 장으로 받은 AI 피부 분석 결과를 확인해보세요!",
          imageUrl: `${base}/api/og-image?token=${token}&type=share`,
          pageUrl: `${base}/share/${token}`,
        });
      }
    }

    // Preflight OPTIONS 요청 즉시 응답
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Toss-User",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 실제 요청 — 다음 핸들러 실행 후 CORS 헤더 추가
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    return newResponse;
  },
];
